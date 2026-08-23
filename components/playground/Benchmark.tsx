// OWNER: 05-playground-ui.md — do not edit from another role
// Sequential-vs-parallel benchmark UI over role 03's `runBenchmark` (BUILD_PROMPT.md §4c). No
// latency/queueing math happens here — every p50/p95/p99/throughput/wallTime number rendered is
// `runBenchmark`'s return value, unmodified. The "pool saturation knee" chart is a sweep of
// `runBenchmark` calls across concurrency levels, still entirely role 03's timing model.
"use client";

import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import Histogram from "@/components/playground/Histogram";
import { mulberry32 } from "@/lib/sim/prng";
import { runBenchmark } from "@/lib/sim/benchmark";
import type { BenchResult } from "@/lib/types";

const POOL_SIZE = 10;
const SWEEP_LEVELS = [1, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32];

function deriveSeed(base: number, salt: number): number {
  return ((base ^ Math.imul(salt, 0x9e3779b1)) >>> 0) || 1;
}

function ResultRow({ label, result }: { label: string; result: BenchResult }) {
  return (
    <tr className="text-text-primary">
      <td className="py-1 pr-3 font-mono text-xs text-text-secondary">{label}</td>
      <td className="py-1 pr-3 font-mono text-xs">{result.p50}ms</td>
      <td className="py-1 pr-3 font-mono text-xs">{result.p95}ms</td>
      <td className="py-1 pr-3 font-mono text-xs">{result.p99}ms</td>
      <td className="py-1 pr-3 font-mono text-xs">{result.throughputRps} req/s</td>
      <td className="py-1 font-mono text-xs">{result.wallTimeMs}ms</td>
    </tr>
  );
}

export interface BenchmarkProps {
  seed: number;
}

export default function Benchmark({ seed }: BenchmarkProps) {
  const [jobCount, setJobCount] = useState(150);
  const [concurrency, setConcurrency] = useState(8);
  const [results, setResults] = useState<{ sequential: BenchResult; parallel: BenchResult } | null>(null);
  const [sweep, setSweep] = useState<BenchResult[]>([]);

  // PlaygroundTabs remounts this component with `key={seed}` on reseed, so `results`/`sweep`
  // reset to their initial empty values automatically — no effect needed here.
  function handleRun() {
    const sequential = runBenchmark({
      jobCount,
      mode: "sequential",
      concurrency: 1,
      poolSize: POOL_SIZE,
      rng: mulberry32(deriveSeed(seed, 1)),
    });
    const parallel = runBenchmark({
      jobCount,
      mode: "parallel",
      concurrency,
      poolSize: POOL_SIZE,
      rng: mulberry32(deriveSeed(seed, 2)),
    });
    setResults({ sequential, parallel });

    const sweepResults = SWEEP_LEVELS.map((c) =>
      runBenchmark({
        jobCount,
        mode: "parallel",
        concurrency: c,
        poolSize: POOL_SIZE,
        rng: mulberry32(deriveSeed(seed, 1000 + c)),
      }),
    );
    setSweep(sweepResults);
  }

  const throughputBars = useMemo(
    () =>
      sweep.map((r) => ({
        label: `${r.concurrency}`,
        value: r.throughputRps,
        highlight: r.concurrency === POOL_SIZE,
      })),
    [sweep],
  );

  const latencyBars = useMemo(
    () =>
      sweep.map((r) => ({
        label: `${r.concurrency}`,
        value: r.p95,
        highlight: r.concurrency === POOL_SIZE,
      })),
    [sweep],
  );

  const percentileBars = useMemo(() => {
    if (!results) return [];
    return [
      { label: "p50", value: results.parallel.p50 },
      { label: "p95", value: results.parallel.p95 },
      { label: "p99", value: results.parallel.p99 },
    ];
  }, [results]);

  return (
    <Panel title="Benchmark — sequential vs parallel" className="flex flex-col gap-4">
      <section aria-label="Benchmark configuration" className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 font-mono text-xs text-text-secondary">
          job count ({jobCount})
          <input
            type="range"
            min={20}
            max={500}
            step={10}
            value={jobCount}
            onChange={(e) => setJobCount(Number(e.target.value))}
            className="accent-accent-primary"
          />
        </label>
        <label className="flex flex-col gap-1 font-mono text-xs text-text-secondary">
          parallel concurrency ({concurrency}) — pool size is fixed at {POOL_SIZE} connections
          <input
            type="range"
            min={1}
            max={32}
            value={concurrency}
            onChange={(e) => setConcurrency(Number(e.target.value))}
            className="accent-accent-primary"
          />
        </label>
      </section>

      <button
        type="button"
        onClick={handleRun}
        className="self-start rounded-panel border border-accent-primary bg-accent-primary/10 px-4 py-2 font-mono text-sm text-accent-primary transition-colors duration-150 ease-out hover:bg-accent-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
      >
        Run benchmark
      </button>

      {results ? (
        <>
          <section aria-label="Benchmark results">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border text-text-muted">
                  <th className="py-1 pr-3 text-left font-mono text-xs font-normal">mode</th>
                  <th className="py-1 pr-3 text-left font-mono text-xs font-normal">p50</th>
                  <th className="py-1 pr-3 text-left font-mono text-xs font-normal">p95</th>
                  <th className="py-1 pr-3 text-left font-mono text-xs font-normal">p99</th>
                  <th className="py-1 pr-3 text-left font-mono text-xs font-normal">throughput</th>
                  <th className="py-1 text-left font-mono text-xs font-normal">wall time</th>
                </tr>
              </thead>
              <tbody>
                <ResultRow label="sequential" result={results.sequential} />
                <ResultRow label={`parallel (c=${concurrency})`} result={results.parallel} />
              </tbody>
            </table>
          </section>

          <section aria-label="Parallel run latency percentiles">
            <p className="mb-1 font-mono text-xs uppercase tracking-wide text-text-muted">
              Latency percentiles — parallel run
            </p>
            <Histogram bars={percentileBars} unit="ms" ariaLabel="p50, p95, p99 latency in milliseconds" />
          </section>
        </>
      ) : (
        <p className="font-mono text-xs text-text-muted">Run the benchmark to see results.</p>
      )}

      {sweep.length > 0 ? (
        <>
          <section aria-label="Connection pool saturation — throughput">
            <p className="mb-1 font-mono text-xs uppercase tracking-wide text-text-muted">
              Throughput vs concurrency — pool size {POOL_SIZE} (highlighted bar)
            </p>
            <p className="mb-2 font-mono text-xs text-text-secondary">
              Throughput climbs with concurrency up to the pool limit, then flattens: past{" "}
              {POOL_SIZE} concurrent requests, extra loops queue for a connection instead of doing
              more work in parallel.
            </p>
            <Histogram bars={throughputBars} unit=" rps" ariaLabel="Throughput in requests per second by concurrency level" />
          </section>

          <section aria-label="Connection pool saturation — queueing delay">
            <p className="mb-1 font-mono text-xs uppercase tracking-wide text-text-muted">
              p95 latency vs concurrency — connection-acquire queueing grows past the pool limit
            </p>
            <Histogram bars={latencyBars} unit="ms" ariaLabel="p95 latency in milliseconds by concurrency level" />
          </section>
        </>
      ) : null}
    </Panel>
  );
}
