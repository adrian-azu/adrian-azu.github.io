// OWNER: 04-terminal-shell.md — do not edit from another role
import type { Command } from "@/lib/types";
import { skills as skillGroups } from "@/data/skills";

const skills: Command = {
  name: "skills",
  description: "Renders the Skills section",
  run: () => {
    // Plain categorized lists (BUILD_PROMPT.md §8) — no progress bars, no ratings.
    const blocks = skillGroups.map((group) => `${group.category}:\n  ${group.items.join(", ")}`);
    return { kind: "text", content: blocks.join("\n\n") };
  },
};

export default skills;
