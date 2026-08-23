// OWNER: 04-terminal-shell.md — do not edit from another role
import type { Command } from "@/lib/types";
import { about } from "@/data/about";

const aboutCommand: Command = {
  name: "about",
  description: "Renders the About section",
  // Plain terminal text, same monospace "output block" styling as every other section (e.g.
  // `experience`) — no separate prose/card treatment.
  run: () => ({ kind: "text", content: about }),
};

export default aboutCommand;
