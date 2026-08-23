// OWNER: 04-terminal-shell.md — do not edit from another role
import type { Command } from "@/lib/types";
import { SECTION_FILES } from "@/lib/commands/sectionMap";

const ls: Command = {
  name: "ls",
  description: "Lists sections as if they were files",
  run: () => {
    const lines = SECTION_FILES.map((entry) => entry.file);
    const content = [...lines, "", "Run 'cat <file>' to open one, e.g. cat about.md"].join("\n");
    return { kind: "text", content };
  },
};

export default ls;
