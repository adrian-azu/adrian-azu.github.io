// OWNER: 04-terminal-shell.md — do not edit from another role
import { createElement } from "react";
import type { Command } from "@/lib/types";
import { links as externalLinks } from "@/data/links";

const links: Command = {
  name: "links",
  description: "Renders external profile links (GitHub, LinkedIn, ...)",
  run: () => ({
    kind: "component",
    content: createElement(
      "dl",
      { className: "space-y-1 font-mono text-sm text-text-primary" },
      externalLinks.map((link) =>
        createElement(
          "div",
          { key: link.label, className: "flex flex-wrap gap-2" },
          createElement("dt", { className: "text-text-secondary" }, `${link.label}:`),
          createElement(
            "dd",
            { className: "m-0" },
            createElement(
              "a",
              {
                href: link.href,
                target: "_blank",
                rel: "noopener noreferrer",
                className:
                  "text-accent-primary underline underline-offset-2 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2",
              },
              link.value,
            ),
          ),
        ),
      ),
    ),
  }),
};

export default links;
