// OWNER: 04-terminal-shell.md — do not edit from another role
// The mounted shell: boot sequence, output log, command chips, input, hash routing, and dispatch
// against lib/commands/registry.ts. This is the primary interactive surface of the site
// (BUILD_PROMPT.md §2/§3) — app/page.tsx (role 01) mounts this verbatim.
"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { MouseEvent } from "react";
import type { CommandResult } from "@/lib/types";
import { registry } from "@/lib/commands/registry";
import welcome from "@/lib/commands/handlers/welcome";
import { levenshtein } from "@/lib/commands/levenshtein";
import { pushHistoryEntry } from "@/lib/commands/sessionHistory";
import { abortActiveRun } from "@/lib/commands/abortSignal";
import { SECTION_FILES } from "@/lib/commands/sectionMap";
import { useHashRoute } from "@/lib/hooks/useHashRoute";
import BootSequence from "./BootSequence";
import CommandChips, { type CommandChipEntry } from "./CommandChips";
import CommandInput from "./CommandInput";
import OutputLog, { type OutputEntry } from "./OutputLog";

const BOOT_FLAG_KEY = "adrian-portfolio-booted";

// Sections that get a `#/<name>` deep link (BUILD_PROMPT.md §2). `help`/`ls`/`cat`/`clear`/
// `history`/`theme` are real commands but not "sections", so they deliberately don't touch the URL.
const SIMPLE_HASH_COMMANDS: Record<string, string> = {
  about: "/about",
  experience: "/experience",
  projects: "/projects",
  architecture: "/architecture",
  skills: "/skills",
  resume: "/resume",
  contact: "/contact",
};

const KNOWN_HASH_COMMANDS = new Set(Object.keys(SIMPLE_HASH_COMMANDS));

const CHIP_ENTRIES: CommandChipEntry[] = [
  { label: "welcome", command: "welcome" },
  { label: "help", command: "help" },
  { label: "whoami", command: "whoami" },
  { label: "about", command: "about" },
  { label: "experience", command: "experience" },
  { label: "projects", command: "projects" },
  { label: "project", command: "project" },
  { label: "architecture", command: "architecture" },
  { label: "skills", command: "skills" },
  { label: "resume", command: "resume" },
  { label: "contact", command: "contact" },
  { label: "ls", command: "ls" },
  { label: "cat about.md", command: "cat about.md" },
  { label: "theme dark", command: "theme dark" },
  { label: "theme light", command: "theme light" },
  { label: "history", command: "history" },
  { label: "clear", command: "clear" },
];

function hashForCommand(name: string, args: string[]): string | null {
  const simple = SIMPLE_HASH_COMMANDS[name];
  if (simple) return simple;
  if (name === "project") return args[0] ? `/projects/${args[0]}` : "/projects";
  if (name === "cat") {
    const file = args[0];
    const section = SECTION_FILES.find((entry) => entry.file === file);
    return section ? section.hash : null;
  }
  return null;
}

// `useSyncExternalStore` (not `useState` + `useEffect`) for the boot-skip decision: it's the
// idiomatic way to read a browser-only value (matchMedia/sessionStorage) that must default to a
// fixed value during SSR and then reconcile safely on the client without a setState-in-effect
// cascade or a hydration mismatch — React re-renders once, automatically, after hydration if the
// client snapshot differs from the server one.
function subscribeNever(): () => void {
  return () => {};
}

function getBootSkipSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const alreadyBooted = window.sessionStorage.getItem(BOOT_FLAG_KEY) === "1";
  return reducedMotion || alreadyBooted;
}

function getBootSkipServerSnapshot(): boolean {
  return false;
}

// Real terminals never lose the caret — typing should work immediately after running a command
// (typed or chip-clicked) or clicking anywhere in the panel, with no separate click into the input
// box required.
function focusCommandInput() {
  document.getElementById("terminal-command-input")?.focus();
}

function parseHash(hash: string): { command: string; args: string[] } | null {
  const path = hash.replace(/^#/, "");
  const segments = path.split("/").filter(Boolean);
  const first = segments[0];
  if (!first) return null;
  if (first === "projects" && segments.length > 1) {
    return { command: "project", args: [segments.slice(1).join("/")] };
  }
  if (KNOWN_HASH_COMMANDS.has(first)) {
    return { command: first, args: segments.slice(1) };
  }
  return null;
}

export default function Terminal() {
  const skipBootAnimation = useSyncExternalStore(
    subscribeNever,
    getBootSkipSnapshot,
    getBootSkipServerSnapshot,
  );
  const [animationDone, setAnimationDone] = useState(false);
  const booted = skipBootAnimation || animationDone;
  // Seeded with `welcome` already "run", so the banner is there the moment the terminal becomes
  // interactive — mirrors a real shell's MOTD, not a command the visitor has to know to type first.
  const [entries, setEntries] = useState<OutputEntry[]>(() => [
    { command: "welcome", result: welcome.run([]) },
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  // Chips start hidden — a visitor must run `help` at least once before the always-visible click
  // shortcuts appear, so the terminal opens as a bare prompt rather than a button toolbar.
  const [chipsRevealed, setChipsRevealed] = useState(false);
  const [hash, setHash] = useHashRoute();
  const lastHandledHashRef = useRef<string | null>(null);

  // Marks this session as "booted" so a reload within the same tab skips the sequence next time
  // (§3: "first load only"). A plain write, not a `setState` call, so it's a legitimate mount-time
  // effect regardless of the `react-hooks/set-state-in-effect` rule's scope.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(BOOT_FLAG_KEY, "1");
  }, []);

  const appendEntry = useCallback((command: string, result: CommandResult) => {
    setEntries((prev) => [...prev, { command, result }]);
  }, []);

  const runCommand = useCallback((name: string, args: string[]): CommandResult => {
    const command = registry[name];
    if (command) return command.run(args);

    const suggestions = Object.keys(registry)
      .map((candidate) => ({ candidate, distance: levenshtein(name, candidate) }))
      .filter((entry) => entry.distance <= 2)
      .sort((a, b) => a.distance - b.distance || a.candidate.localeCompare(b.candidate))
      .slice(0, 2)
      .map((entry) => entry.candidate);
    const hint = suggestions.length > 0 ? ` Did you mean: ${suggestions.join(", ")}?` : "";
    return { kind: "error", content: `command not found: ${name}. Try 'help'.${hint}` };
  }, []);

  // Hash-driven navigation: deep links (#/projects, #/architecture, ...) and browser back/forward
  // both flow through useHashRoute's `hash` state, so this single effect covers "first navigation"
  // (initial mount, hash already present) and "hash change" (programmatic re-run) per
  // BUILD_PROMPT.md §2. `lastHandledHashRef` prevents double-dispatch when *we* set the hash
  // ourselves right after a typed/clicked command (see handleRun below). This genuinely needs to
  // dispatch a command and append output *in response to* an external system changing (the
  // browser's URL, via back/forward or a pasted deep link) — there's no user-initiated event handler
  // to move this into, so the `react-hooks/set-state-in-effect` rule's "move setState into an event
  // handler" suggestion doesn't apply here.
  useEffect(() => {
    if (hash === lastHandledHashRef.current) return;
    lastHandledHashRef.current = hash;
    const parsed = parseHash(hash);
    if (!parsed) return;
    const result = runCommand(parsed.command, parsed.args);
    const echo = [parsed.command, ...parsed.args].join(" ");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see comment above the effect
    appendEntry(echo, result);
  }, [hash, runCommand, appendEntry]);

  const handleRun = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      pushHistoryEntry(trimmed);
      setCommandHistory((prev) => [...prev, trimmed]);

      const [rawName, ...args] = trimmed.split(/\s+/);
      const name = (rawName ?? "").toLowerCase();

      if (name === "clear") {
        setEntries([]);
        focusCommandInput();
        return;
      }

      if (name === "help") setChipsRevealed(true);

      const result = runCommand(name, args);
      appendEntry(trimmed, result);

      const nextHash = hashForCommand(name, args);
      if (nextHash && nextHash !== hash) {
        lastHandledHashRef.current = nextHash;
        setHash(nextHash);
      }

      // Chips are real <button>s, so a chip-triggered run leaves focus sitting on the button —
      // pull it back to the input so the visitor can keep typing without an extra click.
      focusCommandInput();
    },
    [appendEntry, hash, runCommand, setHash],
  );

  const handleAbort = useCallback(() => {
    abortActiveRun();
    // Role 05's FailureSimulation panel already runs its own document-level Ctrl+C listener
    // (see workflow/requests/05-ctrl-c-abort-contract.md) and separately listens for this event so
    // a global Ctrl+C from the terminal shell can stop an in-flight playground run too, without
    // either role importing the other's files.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("playground:abort"));
    }
    appendEntry("^C", { kind: "text", content: "^C aborted" });
  }, [appendEntry]);

  // Ctrl+C / Ctrl+L are handled globally (not scoped to CommandInput) because a running simulation
  // the visitor wants to Ctrl+C out of lives inside role 05's Playground UI, which has its own
  // focus targets (sliders, toggles, tab strip) — see lib/commands/abortSignal.ts for the contract
  // exposed to that consumer.
  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if (!event.ctrlKey) return;
      const key = event.key.toLowerCase();
      if (key === "c") {
        const selection = typeof window !== "undefined" ? window.getSelection()?.toString() : "";
        if (selection) return; // let a real text-copy Ctrl+C through untouched
        event.preventDefault();
        handleAbort();
      } else if (key === "l") {
        event.preventDefault();
        setEntries([]);
      }
    }
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [handleAbort]);

  // New output is announced via OutputLog's `aria-live="polite"` region instead of a forced DOM
  // focus move — moving focus off the input after every command was the bug: it made typing the
  // *next* command require clicking back into the input box first. aria-live announces the content
  // to assistive tech without disturbing keyboard focus.
  function handlePanelClick(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("a, button, input, textarea, select, [role='tab']")) return;
    const selection = typeof window !== "undefined" ? window.getSelection()?.toString() : "";
    if (selection) return; // don't yank focus away from a just-completed text selection
    focusCommandInput();
  }

  const commandNames = Object.keys(registry).sort();

  return (
    <section
      aria-label="Interactive terminal console"
      className="flex flex-1 flex-col gap-2"
      onClick={handlePanelClick}
    >
      {!booted ? (
        <BootSequence onComplete={() => setAnimationDone(true)} />
      ) : (
        <>
          <OutputLog entries={entries} />
          {chipsRevealed ? <CommandChips chips={CHIP_ENTRIES} onSelect={handleRun} /> : null}
          <CommandInput commandNames={commandNames} history={commandHistory} onSubmit={handleRun} autoFocus />
        </>
      )}
    </section>
  );
}
