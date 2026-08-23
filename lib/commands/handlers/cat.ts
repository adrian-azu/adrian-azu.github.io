// OWNER: 04-terminal-shell.md — do not edit from another role
// Imports the specific sibling handlers it aliases into directly (never `registry.ts`, which would
// be a circular import: registry.ts -> handlers/cat.ts -> registry.ts).
import type { Command } from "@/lib/types";
import { SECTION_FILES } from "@/lib/commands/sectionMap";
import about from "./about";
import experience from "./experience";
import projects from "./projects";
import architecture from "./architecture";
import skills from "./skills";
import resume from "./resume";
import contact from "./contact";

const COMMANDS_BY_NAME: Record<string, Command> = {
  about,
  experience,
  projects,
  architecture,
  skills,
  resume,
  contact,
};

function listing(): string {
  return SECTION_FILES.map((entry) => entry.file).join("\n");
}

const cat: Command = {
  name: "cat",
  description: "Alias into the matching section via the `ls` metaphor",
  run: (args) => {
    const file = args[0];
    if (!file) {
      return { kind: "error", content: `cat: missing file operand\n\n${listing()}` };
    }
    const section = SECTION_FILES.find((entry) => entry.file === file);
    if (!section) {
      return { kind: "error", content: `cat: ${file}: No such file or directory\n\n${listing()}` };
    }
    const command = COMMANDS_BY_NAME[section.command];
    if (!command) {
      return { kind: "error", content: `cat: ${file}: not wired to a command` };
    }
    return command.run(args.slice(1));
  },
};

export default cat;
