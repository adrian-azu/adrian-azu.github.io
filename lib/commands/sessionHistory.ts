// OWNER: 04-terminal-shell.md — do not edit from another role
// Session-scoped record of every submitted command, in submission order (not persisted — resets on
// a full reload since it's a plain module-level array, matching BUILD_PROMPT.md §3's "per-session
// array, not persisted"). Terminal.tsx pushes to this on every handled submission (typed Enter or a
// clicked chip both count as "submitting" a command); handlers/history.ts reads it back out so the
// `history` command works standalone as a plain `Command`, without needing React state threaded
// into the static registry.
let entries: string[] = [];

export function pushHistoryEntry(command: string): void {
  entries = [...entries, command];
}

export function getHistoryEntries(): readonly string[] {
  return entries;
}
