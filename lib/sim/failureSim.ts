// OWNER: 03-simulation-engine.md — do not edit from another role
//
// Pure, deterministic simulation of a mock SQS-style queue + worker pool with exponential
// backoff + full jitter and a dead-letter queue (DLQ). `runFailureSim` returns the *entire* event
// stream as a materialized array (not a generator/async iterable): the whole run is computed
// synchronously against a virtual clock derived from `config.seed`, so role 05 can render it by
// simply mapping over the array (optionally staggered with `setTimeout`/CSS delay keyed off each
// event's `timestampMs` for the "streaming log" effect) rather than awaiting anything.
//
// No `Math.random()` (all randomness comes from `mulberry32(config.seed)`), no `Date.now()`
// (every `timestampMs` is a virtual-clock offset computed from 0, not wall-clock time).
import type { JobEvent, SimConfig } from "@/lib/types";
import { mulberry32 } from "@/lib/sim/prng";

/** Ceiling on the exponential backoff delay, in ms, before full jitter is applied. */
const BACKOFF_CAP_MS = 30_000;

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor(p * sortedAsc.length));
  return sortedAsc[idx] ?? 0;
}

function sampleAttemptDurationMs(rng: () => number): number {
  return Math.round(60 + rng() * 200); // 60-260ms simulated I/O-bound processing time
}

interface PendingAttempt {
  jobId: string;
  attemptNumber: number; // 1-indexed
  readyTime: number; // virtual ms timestamp at which this attempt may be picked up
  enqueueOrder: number; // tie-breaker so equal-readyTime attempts stay FIFO
}

/**
 * Runs `jobIds` through a simulated `workerCount`-worker pool, applying `config`'s failure rate,
 * max-attempts, and full-jitter backoff. Shared by `runFailureSim` (fresh jobs) and `replayDlq`
 * (dead-lettered jobs re-entering the queue as a fresh redrive, attempt counters reset to 1 —
 * matching real SQS DLQ redrive semantics, where a redriven message is a new receive).
 */
function simulateJobs(jobIds: string[], config: SimConfig, rng: () => number): JobEvent[] {
  const { workerCount, failureRate, maxAttempts, backoffBaseMs } = config;
  const events: JobEvent[] = [];

  const pending: PendingAttempt[] = jobIds.map((jobId, i) => ({
    jobId,
    attemptNumber: 1,
    readyTime: 0,
    enqueueOrder: i,
  }));

  for (const jobId of jobIds) {
    events.push({
      jobId,
      timestampMs: 0,
      level: "INFO",
      message: `${jobId} enqueued, visible in queue (attempt 1/${maxAttempts})`,
      state: "visible",
    });
  }

  const workerFreeAt = new Array<number>(Math.max(1, workerCount)).fill(0);

  while (pending.length > 0) {
    pending.sort((a, b) => a.readyTime - b.readyTime || a.enqueueOrder - b.enqueueOrder);
    const next = pending.shift() as PendingAttempt;

    let workerIdx = 0;
    let workerMinFreeAt = workerFreeAt[0] ?? 0;
    for (let w = 1; w < workerFreeAt.length; w++) {
      const freeAt = workerFreeAt[w] ?? 0;
      if (freeAt < workerMinFreeAt) {
        workerMinFreeAt = freeAt;
        workerIdx = w;
      }
    }

    const startTime = Math.max(workerMinFreeAt, next.readyTime);
    const durationMs = sampleAttemptDurationMs(rng);
    const endTime = startTime + durationMs;
    workerFreeAt[workerIdx] = endTime;

    events.push({
      jobId: next.jobId,
      timestampMs: startTime,
      level: "INFO",
      message: `${next.jobId} picked up by worker-${workerIdx + 1} (attempt ${next.attemptNumber}/${maxAttempts})`,
      state: "in-flight",
    });

    const attemptFailed = rng() < failureRate / 100;

    if (!attemptFailed) {
      events.push({
        jobId: next.jobId,
        timestampMs: endTime,
        level: "INFO",
        message: `${next.jobId} completed successfully in ${durationMs}ms (attempt ${next.attemptNumber}/${maxAttempts})`,
        state: "done",
      });
      continue;
    }

    if (next.attemptNumber >= maxAttempts) {
      events.push({
        jobId: next.jobId,
        timestampMs: endTime,
        level: "ERROR",
        message: `${next.jobId} dead-lettered after ${next.attemptNumber}/${maxAttempts} attempts — reason: max attempts exceeded`,
        state: "dead-lettered",
      });
      continue;
    }

    const exponent = next.attemptNumber; // matches the worked example: attempt N failing -> 2^N
    const rawBackoff = Math.min(BACKOFF_CAP_MS, backoffBaseMs * 2 ** exponent);
    const jitter = rng();
    const backoffMs = Math.round(rawBackoff * jitter);
    const nextAttemptNumber = next.attemptNumber + 1;
    const nextReadyTime = endTime + backoffMs;

    events.push({
      jobId: next.jobId,
      timestampMs: endTime,
      level: "WARN",
      message: `retrying ${next.jobId} in ${backoffMs}ms (attempt ${nextAttemptNumber}/${maxAttempts}) — backoff = base(${backoffBaseMs}ms) * 2^${exponent}, jittered`,
      state: "visible",
    });

    pending.push({
      jobId: next.jobId,
      attemptNumber: nextAttemptNumber,
      readyTime: nextReadyTime,
      enqueueOrder: next.enqueueOrder,
    });
  }

  return events;
}

/** Runs the failure-injected queue simulation for `config`, returning the full event stream. */
export function runFailureSim(config: SimConfig): JobEvent[] {
  const rng = mulberry32(config.seed);
  const jobIds = Array.from({ length: config.jobCount }, (_, i) => `job#${i + 1}`);
  return simulateJobs(jobIds, config, rng);
}

/** Drains dead-lettered jobs from `priorEvents` back through the same worker pool (a DLQ redrive). */
export function replayDlq(priorEvents: JobEvent[], config: SimConfig): JobEvent[] {
  const deadLetteredJobIds = Array.from(
    new Set(priorEvents.filter((e) => e.state === "dead-lettered").map((e) => e.jobId)),
  );
  if (deadLetteredJobIds.length === 0) return [];

  // Derive a distinct-but-deterministic rng from the same seed so a replay isn't a verbatim
  // duplicate of the original run's random sequence, while staying fully reproducible.
  const rng = mulberry32((config.seed ^ 0x9e3779b9) >>> 0);
  return simulateJobs(deadLetteredJobIds, config, rng);
}

interface FailureSimSummary {
  succeeded: number;
  retried: number;
  deadLettered: number;
  p50Ms: number;
  p95Ms: number;
}

/**
 * Summarizes a run's events: succeeded/dead-lettered are terminal-state counts; `retried` counts
 * jobs that needed more than one attempt; `p50Ms`/`p95Ms` are percentiles of each job's total
 * time-to-terminal-state (enqueue at t=0 to its final `done`/`dead-lettered` event).
 */
export function summarize(events: JobEvent[]): FailureSimSummary {
  const terminalByJob = new Map<string, JobEvent>();
  const retriedJobIds = new Set<string>();

  for (const event of events) {
    if (event.level === "WARN") retriedJobIds.add(event.jobId);
    if (event.state === "done" || event.state === "dead-lettered") {
      terminalByJob.set(event.jobId, event);
    }
  }

  let succeeded = 0;
  let deadLettered = 0;
  const durations: number[] = [];
  for (const terminal of terminalByJob.values()) {
    durations.push(terminal.timestampMs);
    if (terminal.state === "done") succeeded++;
    else deadLettered++;
  }
  durations.sort((a, b) => a - b);

  return {
    succeeded,
    retried: retriedJobIds.size,
    deadLettered,
    p50Ms: percentile(durations, 0.5),
    p95Ms: percentile(durations, 0.95),
  };
}
