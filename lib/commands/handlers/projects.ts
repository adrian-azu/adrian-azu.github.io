// OWNER: 04-terminal-shell.md — do not edit from another role
import type { Command } from "@/lib/types";
import { projects as projectList } from "@/data/projects";

const projects: Command = {
  name: "projects",
  description: "Lists all projects",
  run: () => {
    if (projectList.length === 0) {
      return { kind: "text", content: "projects/ (0)\n\nNo projects yet." };
    }
    const width = Math.max(...projectList.map((p) => p.slug.length));
    const lines = projectList.map((p) => `  ${p.slug.padEnd(width + 2)}${p.title}`);
    const example = projectList[0];
    const content = [
      `projects/ (${projectList.length})`,
      ...lines,
      "",
      `Run 'project <slug>' for details, e.g. project ${example ? example.slug : ""}`,
    ].join("\n");
    return { kind: "text", content };
  },
};

export default projects;
