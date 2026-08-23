// OWNER: 04-terminal-shell.md — do not edit from another role
import type { Command } from "@/lib/types";
import { getHistoryEntries } from "@/lib/commands/sessionHistory";

const history: Command = {
  name: "history",
  description: "Lists prior commands this session",
  run: () => {
    const entries = getHistoryEntries();
    if (entries.length === 0) {
      return { kind: "text", content: "No commands yet this session." };
    }
    const width = String(entries.length).length;
    const lines = entries.map((cmd, index) => `  ${String(index + 1).padStart(width)}  ${cmd}`);
    return { kind: "text", content: lines.join("\n") };
  },
};

export default history;
