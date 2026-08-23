// OWNER: 01-foundation.md — do not edit from another role
// Clickable pill atom. Used by role 04 for the always-visible command-chip row (§3: "every command
// is reachable by click alone") and by role 05 for playground toggles (idempotency key, auth
// token, downstream health).

import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface ChipProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> {
  children: ReactNode;
  active?: boolean;
  className?: string;
}

export function Chip({
  children,
  active = false,
  className = "",
  ...rest
}: ChipProps) {
  const base =
    "inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-xs transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2";
  const state = active
    ? "border-accent-primary bg-accent-primary/10 text-accent-primary"
    : "border-border bg-surface text-text-secondary hover:text-text-primary hover:border-text-muted";

  return (
    <button
      type="button"
      className={`${base} ${state} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

export default Chip;
