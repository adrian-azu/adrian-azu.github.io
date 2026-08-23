// OWNER: 04-terminal-shell.md — do not edit from another role
// Four-line staggered boot sequence (BUILD_PROMPT.md §3), total time under the 600ms budget.
// Terminal.tsx decides *whether* to mount this at all (first load only, per session, via
// sessionStorage — see Terminal.tsx); this component independently double-checks
// `prefers-reduced-motion` on mount as a defense-in-depth fallback, since it's the piece that
// actually owns the stagger.
"use client";

import { useEffect, useState } from "react";

export interface BootSequenceProps {
  onComplete?: () => void;
}

const LINES = ["booting console...", "loading profile...", "mounting sections...", "ready."];
// 4 lines * 120ms stagger + a short settle delay = 540ms, comfortably under the <600ms budget.
const STEP_MS = 120;
const FINISH_DELAY_MS = 60;

export default function BootSequence({ onComplete }: BootSequenceProps) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      onComplete?.();
      return;
    }

    const timers: ReturnType<typeof setTimeout>[] = LINES.map((_, index) =>
      setTimeout(() => setVisibleCount(index + 1), index * STEP_MS),
    );
    timers.push(
      setTimeout(() => onComplete?.(), LINES.length * STEP_MS + FINISH_DELAY_MS),
    );

    return () => {
      timers.forEach(clearTimeout);
    };
    // Runs exactly once on mount — the boot sequence never re-plays for prop changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-1 font-mono text-sm text-text-secondary" aria-hidden="true">
      {LINES.slice(0, visibleCount).map((line, index) => (
        <p key={index}>{line}</p>
      ))}
    </div>
  );
}
