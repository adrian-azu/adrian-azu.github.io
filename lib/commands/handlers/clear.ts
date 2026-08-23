// OWNER: 04-terminal-shell.md — do not edit from another role
import type { Command } from "@/lib/types";

// Terminal.tsx special-cases the literal command name "clear" (case-insensitively) *before*
// reaching this module: instead of appending this command's return value as a new output entry, it
// wipes the existing entries array, matching a real shell's `clear` (and `Ctrl+L`, which triggers
// the same wipe). This `run` implementation exists so the registry stays a complete, always-truthful
// `Record<string, Command>` — every §3 row resolves to a real Command, not a special case baked
// into the map itself — and so calling `registry.clear.run([])` directly still returns a sane,
// side-effect-free result instead of throwing.
const clear: Command = {
  name: "clear",
  description: "Clears output history",
  run: () => ({ kind: "text", content: "" }),
};

export default clear;
