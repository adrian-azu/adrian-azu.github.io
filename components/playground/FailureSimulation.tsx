// OWNER: 05-playground-ui.md — do not edit from another role
// Streams role 03's `runFailureSim` event stream as timestamped log lines (BUILD_PROMPT.md §4b).
// No backoff/jitter/queue math happens here — every delay and plain-English explanation shown is
// `event.message` verbatim, straight from lib/sim/failureSim.ts.
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { replayDlq, runFailureSim, summarize } from "@/lib/sim/failureSim";
import type { JobEvent, SimConfig } from "@/lib/types";

type RunStatus = "idle" | "running" | "done" | "aborted";

const LEVEL_CLASS: Record<JobEvent["level"], string> = {
  INFO: "text-text-secondary",
  WARN: "text-accent-warn",
  ERROR: "text-accent-error",
};

/** Caps the wall-clock time the log stream takes to fully play out, regardless of virtual-clock span. */
const MAX_PLAYBACK_MS = 6000;

function playbackFactor(events: JobEvent[]): number {
  const maxTs = events.reduce((max, e) => Math.max(max, e.timestampMs), 0);
  if (maxTs <= MAX_PLAYBACK_MS) return 1;
  return MAX_PLAYBACK_MS / maxTs;
}

interface LogStreamState {
  status: RunStatus;
  events: JobEvent[]; // full computed set for this run
  visible: JobEvent[]; // streamed-in-so-far subset
}

function useEventStream() {
  const [state, setState] = useState<LogStreamState>({ status: "idle", events: [], visible: [] });
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    for (const id of timeoutsRef.current) clearTimeout(id);
    timeoutsRef.current = [];
  }, []);

  const play = useCallback(
    (events: JobEvent[]) => {
      clearTimers();
      setState({ status: events.length > 0 ? "running" : "done", events, visible: [] });
      const factor = playbackFactor(events);
      events.forEach((event, i) => {
        const delay = Math.round(event.timestampMs * factor);
        const id = setTimeout(() => {
          setState((prev) => ({ ...prev, visible: [...prev.visible, event] }));
          if (i === events.length - 1) {
            setState((prev) => ({ ...prev, status: "done" }));
          }
        }, delay);
        timeoutsRef.current.push(id);
      });
    },
    [clearTimers],
  );

  const skip = useCallback(() => {
    clearTimers();
    setState((prev) => ({ ...prev, visible: prev.events, status: prev.events.length > 0 ? "done" : "idle" }));
  }, [clearTimers]);

  const abort = useCallback(() => {
    clearTimers();
    setState((prev) => (prev.status === "running" ? { ...prev, status: "aborted" } : prev));
  }, [clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setState({ status: "idle", events: [], visible: [] });
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  return { state, play, skip, abort, reset };
}

/** Local, self-contained Ctrl+C handling: matches the DoD's "abort an in-flight sim" behavior
 * without requiring role 04's terminal to be wired yet (registry.ts / CommandInput.tsx are still
 * stubs as of Wave 2). Also listens for a `playground:abort` window CustomEvent so role 04 can
 * trigger the same abort from its own global Ctrl+C handler later without importing this file
 * (see workflow/requests/05-ctrl-c-abort-contract.md). */
function useAbortHotkey(active: boolean, onAbort: () => void) {
  useEffect(() => {
    if (!active) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && (e.key === "c" || e.key === "C")) {
        onAbort();
      }
    }
    function handleCustomAbort() {
      onAbort();
    }
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("playground:abort", handleCustomAbort);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("playground:abort", handleCustomAbort);
    };
  }, [active, onAbort]);
}

function LogLine({ event }: { event: JobEvent }) {
  return (
    <li className="font-mono text-xs leading-relaxed">
      <span className="text-text-muted">[+{event.timestampMs}ms]</span>{" "}
      <span className={`font-semibold ${LEVEL_CLASS[event.level]}`}>{event.level}</span>{" "}
      <span className="text-text-primary">{event.message}</span>
    </li>
  );
}

function SummaryTable({ events, title }: { events: JobEvent[]; title: string }) {
  const summary = useMemo(() => summarize(events), [events]);
  return (
    <table className="w-full border-collapse font-mono text-xs">
      <caption className="mb-1 text-left text-text-muted">{title}</caption>
      <thead>
        <tr className="border-b border-border text-text-muted">
          <th className="py-1 pr-3 text-left font-normal">succeeded</th>
          <th className="py-1 pr-3 text-left font-normal">retried</th>
          <th className="py-1 pr-3 text-left font-normal">dead-lettered</th>
          <th className="py-1 pr-3 text-left font-normal">p50 job duration</th>
          <th className="py-1 text-left font-normal">p95 job duration</th>
        </tr>
      </thead>
      <tbody>
        <tr className="text-text-primary">
          <td className="py-1 pr-3 text-accent-success">{summary.succeeded}</td>
          <td className="py-1 pr-3 text-accent-warn">{summary.retried}</td>
          <td className="py-1 pr-3 text-accent-error">{summary.deadLettered}</td>
          <td className="py-1 pr-3">{summary.p50Ms}ms</td>
          <td className="py-1">{summary.p95Ms}ms</td>
        </tr>
      </tbody>
    </table>
  );
}

export interface FailureSimulationProps {
  seed: number;
}

export default function FailureSimulation({ seed }: FailureSimulationProps) {
  const [jobCount, setJobCount] = useState(20);
  const [workerCount, setWorkerCount] = useState(3);
  const [failureRate, setFailureRate] = useState(30);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [backoffBaseMs, setBackoffBaseMs] = useState(200);
  const [lastConfig, setLastConfig] = useState<SimConfig | null>(null);

  const main = useEventStream();
  const dlq = useEventStream();

  useAbortHotkey(main.state.status === "running", main.abort);
  useAbortHotkey(dlq.state.status === "running", dlq.abort);

  // PlaygroundTabs remounts this component with `key={seed}` on reseed, so `main`/`dlq`/
  // `lastConfig` reset to their initial idle values automatically — no effect needed here.
  function handleRun() {
    const config: SimConfig = { jobCount, workerCount, failureRate, maxAttempts, backoffBaseMs, seed };
    setLastConfig(config);
    dlq.reset();
    const events = runFailureSim(config);
    main.play(events);
  }

  function handleReplayDlq() {
    if (!lastConfig || main.state.events.length === 0) return;
    const replayed = replayDlq(main.state.events, lastConfig);
    dlq.play(replayed);
  }

  const mainSummary = main.state.status === "done" || main.state.status === "aborted" ? main.state.events : null;
  const deadLetteredCount = useMemo(
    () => (mainSummary ? summarize(mainSummary).deadLettered : 0),
    [mainSummary],
  );

  return (
    <Panel title="Failure Simulation — queue + worker pool" className="flex flex-col gap-4">
      <section aria-label="Run configuration" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 font-mono text-xs text-text-secondary">
          job count ({jobCount})
          <input
            type="range"
            min={5}
            max={50}
            value={jobCount}
            onChange={(e) => setJobCount(Number(e.target.value))}
            className="accent-accent-primary"
          />
        </label>
        <label className="flex flex-col gap-1 font-mono text-xs text-text-secondary">
          workers ({workerCount})
          <input
            type="range"
            min={1}
            max={8}
            value={workerCount}
            onChange={(e) => setWorkerCount(Number(e.target.value))}
            className="accent-accent-primary"
          />
        </label>
        <label className="flex flex-col gap-1 font-mono text-xs text-text-secondary">
          failure rate ({failureRate}%)
          <input
            type="range"
            min={0}
            max={100}
            value={failureRate}
            onChange={(e) => setFailureRate(Number(e.target.value))}
            className="accent-accent-primary"
          />
        </label>
        <label className="flex flex-col gap-1 font-mono text-xs text-text-secondary">
          max attempts ({maxAttempts})
          <input
            type="range"
            min={1}
            max={5}
            value={maxAttempts}
            onChange={(e) => setMaxAttempts(Number(e.target.value))}
            className="accent-accent-primary"
          />
        </label>
        <label className="flex flex-col gap-1 font-mono text-xs text-text-secondary">
          backoff base (ms)
          <input
            type="number"
            min={10}
            max={5000}
            step={10}
            value={backoffBaseMs}
            onChange={(e) => setBackoffBaseMs(Number(e.target.value))}
            className="rounded-panel border border-border bg-bg px-2 py-1 text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
          />
        </label>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleRun}
          className="rounded-panel border border-accent-primary bg-accent-primary/10 px-4 py-2 font-mono text-sm text-accent-primary transition-colors duration-150 ease-out hover:bg-accent-primary/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
        >
          Run
        </button>
        <button
          type="button"
          onClick={main.skip}
          disabled={main.state.status !== "running"}
          className="rounded-panel border border-border px-4 py-2 font-mono text-sm text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
        >
          Skip to end
        </button>
        <button
          type="button"
          onClick={main.abort}
          disabled={main.state.status !== "running"}
          className="rounded-panel border border-accent-error px-4 py-2 font-mono text-sm text-accent-error transition-colors duration-150 ease-out hover:bg-accent-error/10 disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
        >
          Abort (^C)
        </button>
        <button
          type="button"
          onClick={handleReplayDlq}
          disabled={main.state.status !== "done" || deadLetteredCount === 0 || dlq.state.status === "running"}
          className="rounded-panel border border-accent-warn px-4 py-2 font-mono text-sm text-accent-warn transition-colors duration-150 ease-out hover:bg-accent-warn/10 disabled:opacity-40 disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
        >
          replay-dlq ({deadLetteredCount})
        </button>
      </div>

      <section aria-label="Simulation log">
        <p className="mb-1 font-mono text-xs uppercase tracking-wide text-text-muted">
          Log {main.state.status === "running" ? "(streaming…)" : main.state.status === "aborted" ? "(aborted)" : ""}
        </p>
        <ol
          role="log"
          aria-live="polite"
          className="flex max-h-72 flex-col gap-0.5 overflow-y-auto rounded-panel border border-border bg-bg p-3"
        >
          {main.state.visible.length === 0 ? (
            <li className="font-mono text-xs text-text-muted">No run yet. Configure and hit Run.</li>
          ) : (
            main.state.visible.map((event, i) => <LogLine key={`${event.jobId}-${i}`} event={event} />)
          )}
        </ol>
      </section>

      {main.state.status === "done" || main.state.status === "aborted" ? (
        <SummaryTable events={main.state.events} title="Run summary" />
      ) : null}

      {dlq.state.events.length > 0 ? (
        <section aria-label="DLQ replay log">
          <p className="mb-1 font-mono text-xs uppercase tracking-wide text-text-muted">
            DLQ replay {dlq.state.status === "running" ? "(streaming…)" : ""}
          </p>
          <ol
            role="log"
            aria-live="polite"
            className="flex max-h-72 flex-col gap-0.5 overflow-y-auto rounded-panel border border-border bg-bg p-3"
          >
            {dlq.state.visible.map((event, i) => (
              <LogLine key={`replay-${event.jobId}-${i}`} event={event} />
            ))}
          </ol>
          {dlq.state.status === "done" || dlq.state.status === "aborted" ? (
            <div className="mt-2">
              <SummaryTable events={dlq.state.events} title="Replay summary" />
            </div>
          ) : null}
        </section>
      ) : null}
    </Panel>
  );
}
