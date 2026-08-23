// OWNER: 04-terminal-shell.md — do not edit from another role
import type { Command } from "@/lib/types";
import { getTheme, setTheme, type Theme } from "@/lib/theme";

function isTheme(value: string | undefined): value is Theme {
  return value === "dark" || value === "light";
}

const theme: Command = {
  name: "theme",
  description: "Switches theme (dark|light), persists to localStorage",
  run: (args) => {
    const requested = args[0]?.toLowerCase();
    if (!requested) {
      return { kind: "text", content: `Current theme: ${getTheme()}\nUsage: theme <dark|light>` };
    }
    if (!isTheme(requested)) {
      return { kind: "error", content: `invalid theme: ${args[0]}. Use 'dark' or 'light'.` };
    }
    setTheme(requested);
    return { kind: "text", content: `theme set to ${requested}` };
  },
};

export default theme;
