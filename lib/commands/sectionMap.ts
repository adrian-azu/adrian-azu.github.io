// OWNER: 04-terminal-shell.md — do not edit from another role
// The `ls`/`cat` file metaphor table (BUILD_PROMPT.md §3), shared by handlers/ls.ts, handlers/cat.ts,
// and Terminal.tsx's hash<->command mapping (§2's deep-link hashes) so all three stay in sync from
// one source instead of three hand-maintained lists.
export interface SectionFile {
  /** The fake filename shown by `ls` and matched by `cat <file>`. */
  file: string;
  /** The registry command name this file aliases into. */
  command: string;
  /** The URL hash (without a leading `#`) that section deep-links to. */
  hash: string;
}

export const SECTION_FILES: SectionFile[] = [
  { file: "about.md", command: "about", hash: "/about" },
  { file: "experience.log", command: "experience", hash: "/experience" },
  { file: "projects/", command: "projects", hash: "/projects" },
  { file: "architecture.sys", command: "architecture", hash: "/architecture" },
  { file: "skills.json", command: "skills", hash: "/skills" },
  { file: "resume.pdf", command: "resume", hash: "/resume" },
  { file: "contact.txt", command: "contact", hash: "/contact" },
];
