// OWNER: 06-architecture-viz.md — do not edit from another role
// Static SVG connector lines between nodes (§5, "not literal ASCII in a <pre>"). Uses a viewBox
// scaled to the same col/row grid ArchDiagram positions nodes on (one viewBox unit == one grid
// cell, no grid gap — spacing between nodes comes from padding inside each cell instead), so a
// straight line from (fromCol+0.5, fromRow+0.5) to (toCol+0.5, toRow+0.5) lands on each node's
// visual center without needing to measure the DOM.
import type { ArchEdge } from "@/lib/types";

export interface ArchNodePosition {
  row: number;
  col: number;
}

export interface ArchEdgesProps {
  edges: ArchEdge[];
  positions: Record<string, ArchNodePosition>;
  cols: number;
  rows: number;
}

export default function ArchEdges({ edges, positions, cols, rows }: ArchEdgesProps) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 hidden h-full w-full sm:block"
      viewBox={`0 0 ${cols} ${rows}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {edges.map((edge) => {
        const from = positions[edge.from];
        const to = positions[edge.to];
        if (!from || !to) return null;
        return (
          <line
            key={`${edge.from}-${edge.to}-${edge.order}`}
            x1={from.col + 0.5}
            y1={from.row + 0.5}
            x2={to.col + 0.5}
            y2={to.row + 0.5}
            stroke="var(--border)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
            opacity={0.6}
          />
        );
      })}
    </svg>
  );
}
