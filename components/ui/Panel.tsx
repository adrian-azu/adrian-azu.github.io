// OWNER: 01-foundation.md — do not edit from another role
// Bordered surface container — the base "card" every section, command output block, playground
// panel, and architecture detail panel is built from (§10: surface/border/shadow-panel tokens,
// 6px border radius, 8px-multiple spacing).

import type { ElementType, ReactNode } from "react";

export interface PanelProps {
  children: ReactNode;
  className?: string;
  title?: string;
  as?: ElementType;
}

export function Panel({
  children,
  className = "",
  title,
  as: Tag = "div",
}: PanelProps) {
  return (
    <Tag
      className={`rounded-panel border border-border bg-surface p-4 shadow-panel ${className}`.trim()}
    >
      {title ? (
        <h3 className="mb-2 font-mono text-sm font-medium text-text-secondary">
          {title}
        </h3>
      ) : null}
      {children}
    </Tag>
  );
}

export default Panel;
