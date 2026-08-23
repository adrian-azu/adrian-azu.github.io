// OWNER: 04-terminal-shell.md — do not edit from another role
import type { Command } from "@/lib/types";

interface HelpEntry {
  name: string;
  description: string;
}

// Mirrors the `description` field declared on each handler in this directory (kept as a flat
// literal list, rather than importing every handler module, so `help` stays cheap and doesn't pull
// in the full component trees behind `architecture`/`playground`'s `kind: "component"` results just
// to read one-line descriptions).
const ENTRIES: HelpEntry[] = [
  { name: "welcome", description: "Prints the welcome banner" },
  { name: "help", description: "Lists all commands with one-line descriptions" },
  { name: "whoami", description: "2-3 line identity blurb, feeds into `about`" },
  { name: "about", description: "Renders the About section" },
  { name: "experience", description: "Renders the Experience section" },
  { name: "projects", description: "Lists all projects" },
  { name: "project", description: "Renders one project in detail; bare `project` lists slugs" },
  { name: "architecture", description: "Opens the architecture visualization" },
  { name: "skills", description: "Renders the Skills section" },
  { name: "resume", description: "Renders a summary + download/print link" },
  { name: "contact", description: "Renders contact methods" },
  { name: "ls", description: "Lists sections as if they were files" },
  { name: "cat", description: "Alias into the matching section via the `ls` metaphor" },
  { name: "clear", description: "Clears output history" },
  { name: "history", description: "Lists prior commands this session" },
  { name: "theme", description: "Switches theme (dark|light), persists to localStorage" },
];

const help: Command = {
  name: "help",
  description: "Lists all commands with one-line descriptions",
  run: () => {
    const width = Math.max(...ENTRIES.map((entry) => entry.name.length));
    const lines = ENTRIES.map((entry) => `  ${entry.name.padEnd(width + 2)}${entry.description}`);
    const content = [
      "Available commands (case-insensitive):",
      "",
      ...lines,
      "",
      "Tab completes command names. Up/Down recall history. Ctrl+L clears output. Ctrl+C aborts a running simulation.",
      "Every command is also reachable by clicking a chip below.",
    ].join("\n");
    return { kind: "text", content };
  },
};

export default help;
