// OWNER: 04-terminal-shell.md — do not edit from another role
// The single Record<string, Command> lookup map (BUILD_PROMPT.md §3: "registered in a
// Record<string, Command> map, not a switch statement"). Terminal.tsx lowercases the typed/clicked
// command name before indexing here, so dispatch is case-insensitive without needing any
// case-folding logic in this file. Role 04 is the only role that ever writes this file — see
// workflow/00-ORCHESTRATION.md's "Registry resolution" note; the two cross-role imports below
// (handlers/playground.ts, handlers/architecture.ts) are role 05's and role 06's files, imported by
// their fixed, foundation-authored signature regardless of stub/final implementation state.
import type { Command } from "@/lib/types";
import welcome from "./handlers/welcome";
import help from "./handlers/help";
import whoami from "./handlers/whoami";
import about from "./handlers/about";
import experience from "./handlers/experience";
import projects from "./handlers/projects";
import project from "./handlers/project";
import architecture from "./handlers/architecture";
import skills from "./handlers/skills";
import resume from "./handlers/resume";
import contact from "./handlers/contact";
import ls from "./handlers/ls";
import cat from "./handlers/cat";
import clear from "./handlers/clear";
import history from "./handlers/history";
import theme from "./handlers/theme";

export const registry: Record<string, Command> = {
  welcome,
  help,
  whoami,
  about,
  experience,
  projects,
  project,
  architecture,
  skills,
  resume,
  contact,
  ls,
  cat,
  clear,
  history,
  theme,
};
