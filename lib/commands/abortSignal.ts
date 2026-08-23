// OWNER: 04-terminal-shell.md — do not edit from another role
//
// Cancel-signal contract for Ctrl+C (BUILD_PROMPT.md §3: "`Ctrl+C` aborts an in-flight simulation
// ... and prints `^C aborted`"). Terminal.tsx listens for Ctrl+C globally (`window`, not just while
// the command input is focused), since an in-flight sim/benchmark run lives inside role 05's
// Playground UI, which has its own focus targets (sliders, toggles, tab strip) — see the keydown
// listener in Terminal.tsx for the "don't steal a real text-copy Ctrl+C" guard.
//
// Two ways for a long-running consumer (role 05's FailureSimulation/Benchmark run loop) to react —
// pick whichever fits its control flow better, this module doesn't care which:
//   1. AbortSignal: call `getActiveSignal()` once when a run starts and either thread it through
//      whatever async/interval loop drives the simulation, or poll `.aborted` between steps.
//      `abortActiveRun()` fires this signal's "abort" event synchronously.
//   2. DOM event: `window.addEventListener(TERMINAL_ABORT_EVENT, handler)` — dispatched at the same
//      time, for call sites that would rather not hold onto an AbortSignal reference.
// Either way, `abortActiveRun()` also rotates in a fresh AbortController right after aborting, so
// the *next* run started after a Ctrl+C gets a fresh, unaborted signal for free — callers never need
// to construct their own controller.
//
// Role 05 already ships a self-contained Ctrl+C handler in FailureSimulation.tsx (see
// workflow/requests/05-ctrl-c-abort-contract.md) and separately listens for a
// `window.dispatchEvent(new CustomEvent("playground:abort"))`. Terminal.tsx's global Ctrl+C
// handler dispatches that event too (alongside calling `abortActiveRun()` here), so a Ctrl+C
// anywhere on the page stops an in-flight playground run and prints `^C aborted` to the terminal
// output at the same time.
export const TERMINAL_ABORT_EVENT = "terminal:abort";

let controller = new AbortController();

/** The signal for whatever run is currently in flight (or about to start). */
export function getActiveSignal(): AbortSignal {
  return controller.signal;
}

/** Aborts the current run's signal, fires the DOM event, then rotates in a fresh controller. */
export function abortActiveRun(): void {
  controller.abort();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TERMINAL_ABORT_EVENT));
  }
  controller = new AbortController();
}
