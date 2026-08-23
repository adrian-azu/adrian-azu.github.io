// OWNER: 06-architecture-viz.md — do not edit from another role
// Fixed 6-field detail panel (§5): Responsibility, Tech, Scaling strategy, Failure modes,
// Observability, Tradeoff accepted — rendered exactly as authored by role 02, no truncation, no
// rewriting. Modal dialog: opens with focus moved in, Esc closes, Tab is trapped inside while
// open, backdrop click closes.
"use client";

import { useEffect, useRef } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import type { ArchNode } from "@/lib/types";

export interface ArchNodeDetailProps {
  node?: ArchNode;
  onClose?: () => void;
}

const FIELDS: Array<{ label: string; key: keyof Omit<ArchNode, "id" | "label"> }> = [
  { label: "Responsibility", key: "responsibility" },
  { label: "Tech", key: "tech" },
  { label: "Scaling strategy", key: "scaling" },
  { label: "Failure modes", key: "failureModes" },
  { label: "Observability", key: "observability" },
  { label: "Tradeoff accepted", key: "tradeoff" },
];

export default function ArchNodeDetail({ node, onClose }: ArchNodeDetailProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [node?.id]);

  if (!node) return null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose?.();
      return;
    }
    if (event.key !== "Tab") return;

    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables || focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose?.();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="arch-node-detail-title"
        onKeyDown={handleKeyDown}
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-panel border border-border bg-surface p-5 shadow-panel"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="arch-node-detail-title" className="font-mono text-sm font-medium text-text-primary">
            {node.label}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close details (Esc)"
            className="shrink-0 rounded-panel border border-border px-2 py-1 font-mono text-xs text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
          >
            Esc ✕
          </button>
        </div>
        <dl className="space-y-3">
          {FIELDS.map((field) => (
            <div key={field.key}>
              <dt className="font-mono text-[11px] uppercase tracking-wide text-text-muted">
                {field.label}
              </dt>
              <dd className="mt-1 font-mono text-xs leading-relaxed text-text-secondary">
                {node[field.key]}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
