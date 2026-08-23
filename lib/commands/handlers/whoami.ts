// OWNER: 04-terminal-shell.md — do not edit from another role
import type { Command } from "@/lib/types";
import { about } from "@/data/about";
import { experience } from "@/data/experience";

const whoami: Command = {
  name: "whoami",
  description: "2-3 line identity blurb, feeds into `about`",
  run: () => {
    const current = experience[0];
    const firstSentence = about.split(/(?<=\.)\s+/)[0] ?? about;
    const lines = [
      current ? `${current.title} @ ${current.company}` : "Backend Engineer",
      firstSentence,
      "Type 'about' for the full picture, or 'help' to see everything this console can do.",
    ];
    return { kind: "text", content: lines.join("\n") };
  },
};

export default whoami;
