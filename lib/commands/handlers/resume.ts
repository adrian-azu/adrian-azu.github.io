// OWNER: 04-terminal-shell.md — do not edit from another role
import { createElement } from "react";
import type { Command } from "@/lib/types";
import { about } from "@/data/about";
import { experience } from "@/data/experience";
import { contact } from "@/data/contact";

// `window.print()` only ever printed the truncated on-screen summary. The full resume lives as a
// real PDF at public/Azucena-Adrian-Resume.pdf, so this is a plain download link instead.
const RESUME_PDF_HREF = "/Azucena-Adrian-Resume.pdf";

function PrintButton() {
  return createElement(
    "a",
    {
      href: RESUME_PDF_HREF,
      download: "Azucena Adrian Resume.pdf",
      className:
        "inline-block rounded-panel border border-border bg-bg px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2",
    },
    "Download resume (PDF)",
  );
}

const resume: Command = {
  name: "resume",
  description: "Renders a summary + download/print link",
  run: () => {
    const current = experience[0];
    const email = contact.find((entry) => entry.href?.startsWith("mailto:"));
    const summaryLines = [
      current ? `${current.title} — ${current.company} (${current.window})` : null,
      about,
      email ? `Contact: ${email.value}` : null,
    ].filter((line): line is string => Boolean(line));

    return {
      kind: "component",
      content: createElement(
        "div",
        { className: "space-y-3" },
        createElement(
          "pre",
          { className: "whitespace-pre-wrap break-words font-mono text-sm text-text-primary" },
          summaryLines.join("\n\n"),
        ),
        createElement(PrintButton, null),
      ),
    };
  },
};

export default resume;
