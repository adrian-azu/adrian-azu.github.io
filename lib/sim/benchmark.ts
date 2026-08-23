// OWNER: 03-simulation-engine.md — do not edit from another role
//
// Pure, deterministic timing model for the "Benchmark" tab. Simulates `jobCount` synthetic
// I/O-bound calls dispatched by up to `concurrency` concurrent request loops, all sharing a fixed
// connection pool of `poolSize` connections. When `concurrency <= poolSize` every loop always
// finds a free connection immediately (no queueing). Once `concurrency > poolSize`, the extra
// loops must queue for a connection to free up — that queueing delay is computed as part of each
// request's timing (not just described in a comment), which is what produces the visible
// throughput "knee" once concurrency crosses the pool limit. No `Math.random()` — all randomness
// comes from the caller-supplied `rng` (typically `mulberry32(seed)`); no `Date.now()` — the whole
// run is timed on a virtual clock starting at 0.
import type { BenchResult } from "@/lib/types";

interface RunBenchmarkInput {
  jobCount: number;
  mode: "sequential" | "parallel";
  concurrency: number;
  poolSize: number;
  rng: () => number;
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const idx = Math.min(sortedAsc.length - 1, Math.floor(p * sortedAsc.length));
  return sortedAsc[idx] ?? 0;
}

/** One synthetic I/O-bound call's service time (ms): mostly 30-120ms, occasional 300-600ms spike. */
function sampleServiceTimeMs(rng: () => number): number {
  const isTailSpike = rng() < 0.06;
  if (isTailSpike) return Math.round(300 + rng() * 300);
  return Math.round(30 + rng() * 90);
}

/**
 * Runs the synthetic I/O-bound benchmark workload and reports latency/throughput stats.
 * `mode: "sequential"` always behaves as a single request loop (concurrency 1) regardless of
 * `concurrency`; `mode: "parallel"` runs `min(concurrency, jobCount)` request loops that share
 * `poolSize` connections, so throughput visibly flattens once `concurrency` exceeds `poolSize`.
 */
export function runBenchmark(input: RunBenchmarkInput): BenchResult {
  const { jobCount, mode, poolSize, rng } = input;
  const effectiveConcurrency = mode === "sequential" ? 1 : input.concurrency;
  const numLoops = Math.max(1, Math.min(effectiveConcurrency, Math.max(1, jobCount)));
  const numConnections = Math.max(1, poolSize);

  if (jobCount <= 0) {
    return { mode, concurrency: effectiveConcurrency, p50: 0, p95: 0, p99: 0, throughputRps: 0, wallTimeMs: 0 };
  }

  const connFreeAt = new Array<number>(numConnections).fill(0);
  const loopFreeAt = new Array<number>(numLoops).fill(0);
  const totalLatenciesMs: number[] = [];

  let nextJobIndex = 0;
  let wallTimeMs = 0;

  while (nextJobIndex < jobCount) {
    // The loop that becomes ready soonest pulls the next queued job.
    let loopIdx = 0;
    let requestedAt = loopFreeAt[0] ?? 0;
    for (let l = 1; l < loopFreeAt.length; l++) {
      const freeAt = loopFreeAt[l] ?? 0;
      if (freeAt < requestedAt) {
        requestedAt = freeAt;
        loopIdx = l;
      }
    }
    nextJobIndex++;

    // Acquire the connection that frees up soonest; if it's already free (<= requestedAt), the
    // request starts immediately with zero queueing delay.
    let connIdx = 0;
    let connMinFreeAt = connFreeAt[0] ?? 0;
    for (let c = 1; c < connFreeAt.length; c++) {
      const freeAt = connFreeAt[c] ?? 0;
      if (freeAt < connMinFreeAt) {
        connMinFreeAt = freeAt;
        connIdx = c;
      }
    }
    const startedAt = Math.max(requestedAt, connMinFreeAt);
    const serviceMs = sampleServiceTimeMs(rng);
    const finishedAt = startedAt + serviceMs;

    connFreeAt[connIdx] = finishedAt;
    loopFreeAt[loopIdx] = finishedAt;

    totalLatenciesMs.push(finishedAt - requestedAt); // includes any connection-acquire queueing
    wallTimeMs = Math.max(wallTimeMs, finishedAt);
  }

  totalLatenciesMs.sort((a, b) => a - b);
  const throughputRps = wallTimeMs > 0 ? jobCount / (wallTimeMs / 1000) : 0;

  return {
    mode,
    concurrency: effectiveConcurrency,
    p50: percentile(totalLatenciesMs, 0.5),
    p95: percentile(totalLatenciesMs, 0.95),
    p99: percentile(totalLatenciesMs, 0.99),
    throughputRps: Math.round(throughputRps * 100) / 100,
    wallTimeMs,
  };
}
