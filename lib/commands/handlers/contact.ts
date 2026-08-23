// OWNER: 04-terminal-shell.md — do not edit from another role
import { createElement } from "react";
import type { Command } from "@/lib/types";
import { contact as contactMethods } from "@/data/contact";

const contact: Command = {
  name: "contact",
  description: "Renders contact methods",
  run: () => ({
    kind: "component",
    content: createElement(
      "dl",
      { className: "space-y-1 font-mono text-sm text-text-primary" },
      contactMethods.map((method) =>
        createElement(
          "div",
          { key: method.label, className: "flex flex-wrap gap-2" },
          createElement("dt", { className: "text-text-secondary" }, `${method.label}:`),
          createElement(
            "dd",
            { className: "m-0" },
            method.href
              ? createElement(
                  "a",
                  {
                    href: method.href,
                    className:
                      "text-accent-primary underline underline-offset-2 hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2",
                  },
                  method.value,
                )
              : method.value,
          ),
        ),
      ),
    ),
  }),
};

export default contact;
