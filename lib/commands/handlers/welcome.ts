// OWNER: 04-terminal-shell.md — do not edit from another role
// The banner shown automatically as the first output entry once the terminal boots (see
// Terminal.tsx's `entries` initializer), and re-runnable by typing `welcome`. Kept as `.ts` (not
// `.tsx`) per the file list in workflow/01-foundation.md, so JSX is written via `createElement`.
import { createElement } from "react";
import type { Command } from "@/lib/types";

// Figlet "Standard" font render of "ADRIAN" — generated once via `npx figlet`, pasted as a static
// string rather than pulling in figlet as a runtime dependency for one banner.
const ASCII_NAME = String.raw`     _    ____  ____  ___    _    _   _
    / \  |  _ \|  _ \|_ _|  / \  | \ | |
   / _ \ | | | | |_) || |  / _ \ |  \| |
  / ___ \| |_| |  _ < | | / ___ \| |\  |
 /_/   \_\____/|_| \_\___/_/   \_\_| \_|`;

const welcome: Command = {
  name: "welcome",
  description: "Prints the welcome banner",
  run: () =>
    ({
      kind: "component" as const,
      content: createElement(
        "div",
        { className: "space-y-3" },
        createElement(
          "div",
          { className: "overflow-x-auto" },
          createElement(
            "pre",
            {
              "aria-hidden": "true",
              className: "text-accent-primary",
            },
            ASCII_NAME,
          ),
        ),
        createElement("span", { className: "sr-only" }, "Adrian Azucena"),
        createElement(
          "pre",
          { className: "whitespace-pre-wrap break-words text-text-primary" },
          "Welcome to my terminal portfolio.\n\nType `help` to see every command, or `about` to learn more about me.",
        ),
      ),
    }),
};

export default welcome;
