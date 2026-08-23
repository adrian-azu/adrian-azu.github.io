// OWNER: 04-terminal-shell.md — do not edit from another role
import type { Command, Project } from "@/lib/types";
import { projects } from "@/data/projects";

// Fixed shape from BUILD_PROMPT.md §6.
function formatProject(project: Project): string {
  const techLines = project.techChoices.map((t) => `  - ${t.tech}: ${t.why}`).join("\n");
  return [
    `$ cat projects/${project.slug}.md`,
    "",
    project.title,
    "",
    `- Problem: ${project.problem}`,
    `- Architecture: ${project.architecture}`,
    "- Tech choices + why:",
    techLines,
    `- Repo: ${project.repoUrl}`,
  ].join("\n");
}

function listSlugs(): string {
  const width = Math.max(...projects.map((p) => p.slug.length));
  const lines = projects.map((p) => `  ${p.slug.padEnd(width + 2)}${p.title}`);
  return ["Usage: project <slug>", "", "Available projects:", ...lines].join("\n");
}

const project: Command = {
  name: "project",
  description: "Renders one project in detail; bare `project` lists slugs",
  run: (args) => {
    const slug = args[0];
    if (!slug) {
      return { kind: "text", content: listSlugs() };
    }
    const found = projects.find((p) => p.slug === slug);
    if (!found) {
      return { kind: "error", content: `project not found: ${slug}\n\n${listSlugs()}` };
    }
    return { kind: "text", content: formatProject(found) };
  },
};

export default project;
