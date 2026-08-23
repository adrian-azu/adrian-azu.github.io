// OWNER: 06-architecture-viz.md — do not edit from another role
// AWS-service-level sequence diagram alternative to the interactive node graph (ArchDiagram) — the
// full happy-path hop order, generated straight from data/architecture.ts's archNodes/archEdges (the
// same source of truth the graph view renders) so the two views can never drift out of sync.
// Renders client-side via mermaid.js. Mermaid's theme engine parses `themeVariables` as real colors
// (it computes shades from them), so `var(--token)` CSS references aren't accepted — colors are
// resolved from the live computed styles instead, and re-resolved whenever the site's theme toggles.
"use client";

import { useEffect, useId, useRef, useState } from "react";
import { archEdges, archNodes } from "@/data/architecture";

function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, "_");
}

// Async/event hops (e.g. the Kafka confirmation from Core Banking) render as a dashed "fire and
// forget" arrow; everything else is a solid request/step arrow.
function arrowFor(label: string): string {
  return /async|event/i.test(label) ? "--)" : "->>";
}

function buildDefinition(): string {
  const orderedEdges = [...archEdges].sort((a, b) => a.order - b.order);
  const seen = new Set<string>();
  const participantLines: string[] = [];

  for (const edge of orderedEdges) {
    for (const nodeId of [edge.from, edge.to]) {
      if (seen.has(nodeId)) continue;
      seen.add(nodeId);
      const node = archNodes.find((candidate) => candidate.id === nodeId);
      participantLines.push(`    participant ${sanitizeId(nodeId)} as ${node?.service ?? nodeId}`);
    }
  }

  const messageLines = orderedEdges.map(
    (edge) => `    ${sanitizeId(edge.from)}${arrowFor(edge.label)}${sanitizeId(edge.to)}: ${edge.label}`,
  );

  return ["sequenceDiagram", ...participantLines, "", ...messageLines].join("\n");
}

const CSS_VARS = {
  bg: "--bg",
  surface: "--surface",
  border: "--border",
  textPrimary: "--text-primary",
  textSecondary: "--text-secondary",
  textMuted: "--text-muted",
} as const;

function resolveThemeVariables(): Record<string, string> {
  const styles = getComputedStyle(document.documentElement);
  const resolved = Object.fromEntries(
    Object.entries(CSS_VARS).map(([key, varName]) => [key, styles.getPropertyValue(varName).trim()]),
  ) as Record<keyof typeof CSS_VARS, string>;

  return {
    background: resolved.bg,
    textColor: resolved.textPrimary,
    lineColor: resolved.textMuted,
    actorBkg: resolved.surface,
    actorBorder: resolved.border,
    actorTextColor: resolved.textPrimary,
    actorLineColor: resolved.textMuted,
    signalColor: resolved.textSecondary,
    signalTextColor: resolved.textPrimary,
    labelBoxBkgColor: resolved.surface,
    labelBoxBorderColor: resolved.border,
    labelTextColor: resolved.textPrimary,
    loopTextColor: resolved.textSecondary,
    noteBkgColor: resolved.surface,
    noteBorderColor: resolved.border,
    noteTextColor: resolved.textSecondary,
    activationBkgColor: resolved.surface,
    activationBorderColor: resolved.border,
  };
}

export default function SequenceDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const rawId = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    let cancelled = false;
    let renderToken = 0;

    async function renderDiagram() {
      const token = ++renderToken;
      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          fontFamily: "var(--font-mono), var(--font-mono-fallback), monospace",
          themeVariables: resolveThemeVariables(),
        });

        const { svg, bindFunctions } = await mermaid.render(`arch-sequence-${rawId}-${token}`, buildDefinition());
        if (cancelled || token !== renderToken || !containerRef.current) return;
        containerRef.current.innerHTML = svg;
        bindFunctions?.(containerRef.current);
        setError(false);
      } catch (err) {
        if (!cancelled) {
          console.error("SequenceDiagram render failed:", err);
          setError(true);
        }
      }
    }

    renderDiagram();

    // Mermaid bakes resolved colors into the SVG at render time (see file header) — re-render
    // whenever the site's theme toggles (lib/theme.ts flips `data-theme` on <html>) so the diagram
    // stays in sync instead of freezing at whichever theme was active on first render.
    const observer = new MutationObserver(() => {
      renderDiagram();
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [rawId]);

  if (error) {
    return <p className="font-mono text-xs text-accent-error">Sequence diagram failed to render.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-panel border border-border bg-surface p-4 shadow-panel">
      <div ref={containerRef} aria-label="Sequence diagram of the dormancy backtracking request flow" />
    </div>
  );
}
