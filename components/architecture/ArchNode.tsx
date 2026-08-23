// OWNER: 06-architecture-viz.md — do not edit from another role
// Single focusable/keyboard-activatable node in the diagram (§5). A real <button>, not a styled
// <div>, so it gets native focus/activation semantics for free; ArchDiagram drives the roving
// tabindex + arrow-key spatial navigation and passes the resulting handlers down as props.
import { forwardRef } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { ArchNode as ArchNodeType } from "@/lib/types";

export interface ArchNodeProps {
  node: ArchNodeType;
  focused: boolean;
  tabIndex: number;
  external?: boolean;
  onFocus?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

const ArchNode = forwardRef<HTMLButtonElement, ArchNodeProps>(function ArchNode(
  { node, focused, tabIndex, external = false, onFocus, onKeyDown, onClick, className = "" },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      id={`arch-node-${node.id}`}
      tabIndex={tabIndex}
      aria-haspopup="dialog"
      aria-label={`${node.label}. Press Enter or Space for details.`}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onClick={onClick}
      className={[
        "flex h-full min-h-[4.5rem] w-full flex-col items-start gap-1 rounded-panel border p-3 text-left font-mono text-[11px] leading-snug shadow-panel transition-colors duration-150 ease-out",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2",
        focused
          ? "border-accent-primary bg-accent-primary/10"
          : "border-border bg-surface hover:border-text-muted",
        external ? "border-dashed" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span className="font-medium text-text-primary">{node.label}</span>
      <span className="text-text-muted">{node.service}</span>
    </button>
  );
});

export default ArchNode;
