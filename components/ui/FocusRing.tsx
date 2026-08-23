// OWNER: 01-foundation.md — do not edit from another role
// Reusable visible-focus wrapper (§11: "never outline: none without a replacement"). Global
// `:focus-visible` styling lives in app/globals.css for natively-focusable elements; this wraps
// custom interactive elements (e.g. architecture nodes) that need the same treatment applied via
// `:focus-within` on a non-focusable wrapper.

import type { ReactNode } from "react";

export interface FocusRingProps {
  children: ReactNode;
  className?: string;
  rounded?: boolean;
}

export function FocusRing({
  children,
  className = "",
  rounded = true,
}: FocusRingProps) {
  const classes = [
    "inline-block",
    "focus-within:outline",
    "focus-within:outline-2",
    "focus-within:outline-accent-primary",
    "focus-within:outline-offset-2",
    rounded ? "rounded-panel" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}

export default FocusRing;
