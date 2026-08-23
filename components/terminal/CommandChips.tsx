// OWNER: 04-terminal-shell.md — do not edit from another role
// Always-visible row of clickable command shortcuts (BUILD_PROMPT.md §3: "every command is
// reachable by click alone, typing is never required"). Terminal.tsx supplies the exact list,
// including argument-bearing variants (e.g. "theme dark") that a bare command name alone couldn't
// reach by click.
"use client";

import Chip from "@/components/ui/Chip";

export interface CommandChipEntry {
  /** Chip label shown to the user. */
  label: string;
  /** Full command string (may include args) submitted verbatim on click. */
  command: string;
}

export interface CommandChipsProps {
  chips: CommandChipEntry[];
  onSelect: (command: string) => void;
}

export default function CommandChips({ chips, onSelect }: CommandChipsProps) {
  return (
    <div role="group" aria-label="Command shortcuts" className="flex flex-wrap gap-2 border-b border-border pb-2">
      {chips.map((chip) => (
        <Chip key={chip.command} onClick={() => onSelect(chip.command)} aria-label={`Run ${chip.label}`}>
          {chip.label}
        </Chip>
      ))}
    </div>
  );
}
