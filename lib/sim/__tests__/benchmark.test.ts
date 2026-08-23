// OWNER: 03-simulation-engine.md — do not edit from another role
import { describe, expect, it } from "vitest";
import { mulberry32 } from "@/lib/sim/prng";
import { runBenchmark } from "@/lib/sim/benchmark";

describe("runBenchmark — determinism", () => {
  it("same seed and inputs produce identical results", () => {
    const a = runBenchmark({ jobCount: 60, mode: "parallel", concurrency: 8, poolSize: 10, rng: mulberry32(5) });
    const b = runBenchmark({ jobCount: 60, mode: "parallel", concurrency: 8, poolSize: 10, rng: mulberry32(5) });
    expect(a).toEqual(b);
  });
});

describe("runBenchmark — pool saturation knee", () => {
  it("throughput growth slows/flattens once concurrency exceeds poolSize", () => {
    const jobCount = 300;
    const poolSize = 10;

    const below = runBenchmark({ jobCount, mode: "parallel", concurrency: 4, poolSize, rng: mulberry32(1) });
    const atLimit = runBenchmark({ jobCount, mode: "parallel", concurrency: 10, poolSize, rng: mulberry32(1) });
    const wayOver = runBenchmark({ jobCount, mode: "parallel", concurrency: 30, poolSize, rng: mulberry32(1) });

    // Below the pool limit, adding concurrency meaningfully increases throughput.
    const gainBelowLimit = atLimit.throughputRps - below.throughputRps;
    expect(gainBelowLimit).toBeGreaterThan(0);

    // Past the pool limit, more concurrency buys much less (the "knee").
    const gainPastLimit = wayOver.throughputRps - atLimit.throughputRps;
    expect(gainPastLimit).toBeLessThan(gainBelowLimit);

    // Throughput never regresses to below the at-limit measurement, but it also never scales
    // anywhere near linearly with the 3x concurrency increase past the pool limit.
    expect(wayOver.throughputRps).toBeGreaterThanOrEqual(atLimit.throughputRps);
    expect(wayOver.throughputRps).toBeLessThan(atLimit.throughputRps * 1.5);
  });

  it("p95/p99 latency grows once requests start queueing for a connection", () => {
    const jobCount = 300;
    const poolSize = 10;

    const atLimit = runBenchmark({ jobCount, mode: "parallel", concurrency: 10, poolSize, rng: mulberry32(2) });
    const wayOver = runBenchmark({ jobCount, mode: "parallel", concurrency: 30, poolSize, rng: mulberry32(2) });

    expect(wayOver.p95).toBeGreaterThan(atLimit.p95);
    expect(wayOver.p99).toBeGreaterThanOrEqual(wayOver.p95);
  });

  it("sequential mode ignores the concurrency input and behaves as concurrency=1", () => {
    const result = runBenchmark({ jobCount: 20, mode: "sequential", concurrency: 16, poolSize: 10, rng: mulberry32(3) });
    expect(result.concurrency).toBe(1);
  });
});

describe("runBenchmark — reported stats", () => {
  it("p50 <= p95 <= p99 and throughput/wallTime are internally consistent", () => {
    const result = runBenchmark({ jobCount: 50, mode: "parallel", concurrency: 6, poolSize: 8, rng: mulberry32(4) });
    expect(result.p50).toBeLessThanOrEqual(result.p95);
    expect(result.p95).toBeLessThanOrEqual(result.p99);
    expect(result.wallTimeMs).toBeGreaterThan(0);
    expect(result.throughputRps).toBeGreaterThan(0);
  });

  it("handles a zero job count without throwing", () => {
    const result = runBenchmark({ jobCount: 0, mode: "parallel", concurrency: 4, poolSize: 10, rng: mulberry32(6) });
    expect(result.wallTimeMs).toBe(0);
    expect(result.throughputRps).toBe(0);
  });
});
