// OWNER: 04-terminal-shell.md — do not edit from another role
import type { Command, Role } from "@/lib/types";
import { experience as experienceRoles } from "@/data/experience";

// Fixed per-role block shape from BUILD_PROMPT.md §7.
function formatRole(role: Role): string {
  const achievements = role.achievements.map((line) => `  - ${line}`).join("\n");
  return [
    `$ cat experience/${role.companySlug}.log`,
    "",
    `ROLE       ${role.title}`,
    `COMPANY    ${role.company}`,
    `WINDOW     ${role.window}`,
    `FOCUS      ${role.focus}`,
    "ACHIEVEMENTS",
    achievements,
  ].join("\n");
}

const experience: Command = {
  name: "experience",
  description: "Renders the Experience section",
  run: () => ({
    kind: "text",
    content: experienceRoles.map(formatRole).join("\n\n"),
  }),
};

export default experience;
