// OWNER: 03-simulation-engine.md — do not edit from another role
import { describe, expect, it } from "vitest";
import { mulberry32 } from "@/lib/sim/prng";
import { replayDlq, runFailureSim, summarize } from "@/lib/sim/failureSim";
import type { SimConfig } from "@/lib/types";

describe("runFailureSim — backoff formula", () => {
  it("matches min(cap, base * 2^attempt) * rng() exactly, including the logged message", () => {
    const seed = 777;
    const config: SimConfig = {
      jobCount: 1,
      workerCount: 1,
      failureRate: 100, // always fails so the retry path is deterministic
      maxAttempts: 2,
      backoffBaseMs: 200,
      seed,
    };

    const events = runFailureSim(config);
    const retryEvent = events.find((e) => e.level === "WARN");
    expect(retryEvent).toBeDefined();

    // Replay the exact same rng draw order the implementation consumes for job#1's single
    // attempt cycle: [attempt duration, failure-check, backoff jitter].
    const rng = mulberry32(seed);
    rng(); // attempt-1 duration
    rng(); // attempt-1 pass/fail check
    const jitter = rng(); // full-jitter multiplier
    const expectedBackoffMs = Math.round(Math.min(30_000, 200 * 2 ** 1) * jitter);

    expect(retryEvent!.message).toContain(`retrying job#1 in ${expectedBackoffMs}ms`);
    expect(retryEvent!.message).toContain("attempt 2/2");
    expect(retryEvent!.message).toContain("backoff = base(200ms) * 2^1");
    expect(retryEvent!.message).toContain("jittered");
  });

  it("every plain-English message explains what happened and why", () => {
    const config: SimConfig = { jobCount: 5, workerCount: 2, failureRate: 40, maxAttempts: 3, backoffBaseMs: 150, seed: 42 };
    const events = runFailureSim(config);
    for (const event of events) {
      expect(event.message.length).toBeGreaterThan(10);
      expect(event.message).toContain(event.jobId);
    }
  });
});

describe("runFailureSim — DLQ threshold", () => {
  it("dead-letters jobs that exceed maxAttempts and never retries past the limit", () => {
    const config: SimConfig = { jobCount: 3, workerCount: 2, failureRate: 100, maxAttempts: 1, backoffBaseMs: 100, seed: 1 };
    const events = runFailureSim(config);
    const summary = summarize(events);

    expect(summary.deadLettered).toBe(3);
    expect(summary.succeeded).toBe(0);
    expect(summary.retried).toBe(0); // maxAttempts=1 means no retry ever happens, straight to DLQ

    const deadLetterEvents = events.filter((e) => e.state === "dead-lettered");
    expect(deadLetterEvents).toHaveLength(3);
    for (const e of deadLetterEvents) {
      expect(e.level).toBe("ERROR");
      expect(e.message).toContain("dead-lettered");
    }
  });

  it("jobs that eventually succeed within maxAttempts are not dead-lettered", () => {
    const config: SimConfig = { jobCount: 10, workerCount: 3, failureRate: 0, maxAttempts: 4, backoffBaseMs: 100, seed: 2 };
    const events = runFailureSim(config);
    const summary = summarize(events);
    expect(summary.succeeded).toBe(10);
    expect(summary.deadLettered).toBe(0);
  });
});

describe("replayDlq", () => {
  it("re-processes only the previously dead-lettered jobs through the same worker pool", () => {
    const initialConfig: SimConfig = { jobCount: 4, workerCount: 2, failureRate: 100, maxAttempts: 1, backoffBaseMs: 100, seed: 9 };
    const initialEvents = runFailureSim(initialConfig);
    const initialSummary = summarize(initialEvents);
    expect(initialSummary.deadLettered).toBe(4);

    const replayConfig: SimConfig = { ...initialConfig, failureRate: 0 }; // guarantee success on redrive
    const replayEvents = replayDlq(initialEvents, replayConfig);
    expect(replayEvents.length).toBeGreaterThan(0);

    const originalDeadLetteredIds = new Set(
      initialEvents.filter((e) => e.state === "dead-lettered").map((e) => e.jobId),
    );
    const replayedIds = new Set(replayEvents.map((e) => e.jobId));
    expect(replayedIds).toEqual(originalDeadLetteredIds);

    const replaySummary = summarize(replayEvents);
    expect(replaySummary.succeeded).toBe(4);
    expect(replaySummary.deadLettered).toBe(0);
  });

  it("returns an empty array when there is nothing to replay", () => {
    const config: SimConfig = { jobCount: 4, workerCount: 2, failureRate: 0, maxAttempts: 4, backoffBaseMs: 100, seed: 10 };
    const events = runFailureSim(config);
    expect(replayDlq(events, config)).toEqual([]);
  });
});

describe("summarize", () => {
  it("reports non-negative p50/p95 and counts that add up to every resolved job", () => {
    const config: SimConfig = { jobCount: 20, workerCount: 4, failureRate: 35, maxAttempts: 3, backoffBaseMs: 120, seed: 55 };
    const events = runFailureSim(config);
    const summary = summarize(events);

    expect(summary.succeeded + summary.deadLettered).toBe(20);
    expect(summary.p50Ms).toBeGreaterThanOrEqual(0);
    expect(summary.p95Ms).toBeGreaterThanOrEqual(summary.p50Ms);
  });
});

describe("determinism", () => {
  it("the same seed and config produce byte-identical event streams", () => {
    const config: SimConfig = { jobCount: 15, workerCount: 3, failureRate: 30, maxAttempts: 3, backoffBaseMs: 100, seed: 123 };
    const a = runFailureSim(config);
    const b = runFailureSim(config);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
