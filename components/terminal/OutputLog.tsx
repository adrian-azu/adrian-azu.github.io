// OWNER: 04-terminal-shell.md — do not edit from another role
// The scrollback: `role="log"` `aria-live="polite"` so screen readers announce new output without
// re-reading the whole history (BUILD_PROMPT.md §3/§11). Each entry gets a stable DOM id
// (`output-entry-<index>`) that Terminal.tsx uses to move focus onto the newest entry after every
// command — the DoD calls for focus to land on the new output block itself, not just stay on the
// input.
"use client";

import type { CommandResult } from "@/lib/types";
import PromptLabel from "./PromptLabel";

export interface OutputEntry {
  command: string;
  result: CommandResult;
}

export interface OutputLogProps {
  entries: OutputEntry[];
}

function renderResult(result: CommandResult) {
  if (result.kind === "error") {
    return <pre className="whitespace-pre-wrap break-words text-accent-error">{result.content}</pre>;
  }
  if (result.kind === "component") {
    return <div>{result.content}</div>;
  }
  return <pre className="whitespace-pre-wrap break-words text-text-primary">{result.content}</pre>;
}

export default function OutputLog({ entries }: OutputLogProps) {
  return (
    <div
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Terminal output"
      className="space-y-4 pt-2 pb-2 font-mono text-sm"
    >
      {entries.length === 0 ? (
        <p className="text-text-muted">
          Type a command, or click a chip below. Try &lsquo;help&rsquo; to see everything.
        </p>
      ) : null}
      {entries.map((entry, index) => (
        <div key={index} id={`output-entry-${index}`} tabIndex={-1} className="scroll-mt-4 outline-none">
          <p className="text-text-secondary">
            <PromptLabel /> {entry.command}
          </p>
          <div className="mt-1">{renderResult(entry.result)}</div>
        </div>
      ))}
    </div>
  );
}
