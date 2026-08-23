// OWNER: 04-terminal-shell.md — do not edit from another role
// The prompt line: history recall (Up/Down), Tab ghost-text completion, Enter to submit
// (BUILD_PROMPT.md §3). Ctrl+L / Ctrl+C are handled globally by Terminal.tsx (a `window` keydown
// listener, not scoped to this input) because an in-flight simulation the user wants to Ctrl+C out
// of lives inside role 05's Playground UI, which has its own focus targets — see
// lib/commands/abortSignal.ts for that contract.
"use client";

import { useMemo, useRef, useState } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import PromptLabel from "./PromptLabel";

export interface CommandInputProps {
  /** All registered command names, used for Tab ghost-text completion. */
  commandNames: string[];
  /** Session command history, oldest first — used for Up/Down recall. */
  history: string[];
  onSubmit: (raw: string) => void;
  autoFocus?: boolean;
}

export default function CommandInput({ commandNames, history, onSubmit, autoFocus = false }: CommandInputProps) {
  const [value, setValue] = useState("");
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const draftRef = useRef("");

  // Ghost-text completion: only while typing the first token (no space yet), and only when exactly
  // the not-yet-typed remainder of a single matching command name is shown inline (§3: "inline
  // ghost-text completion, not a dropdown").
  const ghostSuffix = useMemo(() => {
    if (value.length === 0 || value.includes(" ")) return "";
    const lower = value.toLowerCase();
    const match = commandNames.find((name) => name !== lower && name.startsWith(lower));
    return match ? match.slice(value.length) : "";
  }, [value, commandNames]);

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
    setHistoryIndex(null);
    draftRef.current = "";
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "Enter":
        event.preventDefault();
        submit();
        break;
      case "Tab":
        if (ghostSuffix) {
          event.preventDefault();
          setValue((current) => current + ghostSuffix);
        }
        break;
      case "ArrowUp": {
        if (history.length === 0) break;
        event.preventDefault();
        setHistoryIndex((prevIndex) => {
          if (prevIndex === null) draftRef.current = value;
          const nextIndex = prevIndex === null ? history.length - 1 : Math.max(0, prevIndex - 1);
          const entry = history[nextIndex];
          if (entry !== undefined) setValue(entry);
          return nextIndex;
        });
        break;
      }
      case "ArrowDown": {
        if (historyIndex === null) break;
        event.preventDefault();
        setHistoryIndex((prevIndex) => {
          if (prevIndex === null) return null;
          const nextIndex = prevIndex + 1;
          if (nextIndex >= history.length) {
            setValue(draftRef.current);
            return null;
          }
          const entry = history[nextIndex];
          if (entry !== undefined) setValue(entry);
          return nextIndex;
        });
        break;
      }
      default:
        break;
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
    setHistoryIndex(null);
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="terminal-command-input" className="select-none whitespace-pre font-mono text-sm">
        <PromptLabel />
      </label>
      <div className="relative flex-1 font-mono text-sm">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-pre"
        >
          <span className="invisible">{value}</span>
          <span className="text-text-muted">{ghostSuffix}</span>
        </div>
        <input
          id="terminal-command-input"
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          placeholder="type a command… (try 'help')"
          aria-label="Terminal command input"
          aria-describedby="terminal-input-hint"
          className="relative m-0 w-full border-0 bg-transparent p-0 text-text-primary caret-accent-primary outline-none placeholder:text-text-muted"
        />
      </div>
      <span id="terminal-input-hint" className="sr-only">
        Press Tab to autocomplete, Up and Down arrows to recall previous commands, Control plus L to
        clear output, Control plus C to abort a running simulation.
      </span>
    </div>
  );
}
