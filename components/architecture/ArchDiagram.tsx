// OWNER: 06-architecture-viz.md — do not edit from another role
// Host for the two architecture views (§5): the interactive node graph (default — real DOM nodes
// on a CSS grid with an SVG connector overlay, never literal ASCII in a <pre>) and a cloud-style
// Mermaid sequence diagram (SequenceDiagram). A Tabs strip switches between them. Owns keyboard
// spatial navigation and the detail panel for the graph view; the mobile (<640px) vertical stack
// falls out of the same grid via Tailwind breakpoints.
"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { archEdges, archNodes } from "@/data/architecture";
import type { ArchNode as ArchNodeType } from "@/lib/types";
import { Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Tabs";
import ArchNode from "./ArchNode";
import ArchEdges, { type ArchNodePosition } from "./ArchEdges";
import ArchNodeDetail from "./ArchNodeDetail";
import SequenceDiagram from "./SequenceDiagram";

// Grid layout — presentation-only spatial arrangement of role 02's graph, not a content change.
// Rows read top-to-bottom following the pipeline's happy-path flow: Ops portal -> ALB -> the
// three EKS pods -> their downstream stores/queues -> the two external systems they talk to.
const COLS = 4;
const ROWS = 5;

const POSITIONS: Record<string, ArchNodePosition> = {
  "ops-portal": { row: 0, col: 1 },
  alb: { row: 1, col: 1 },
  "api-pod": { row: 2, col: 0 },
  "worker-pod": { row: 2, col: 1 },
  "kafka-consumer-pod": { row: 2, col: 2 },
  "rds-postgres": { row: 3, col: 0 },
  s3: { row: 3, col: 1 },
  "sqs-queue": { row: 3, col: 2 },
  "tm-core-banking": { row: 3, col: 3 },
  "ud-mesh": { row: 4, col: 2 },
};

const EXTERNAL_IDS = new Set(["ops-portal", "tm-core-banking", "ud-mesh"]);

type ViewId = "diagram" | "sequence";

const VIEW_TABS = [
  { id: "diagram", label: "Architecture diagram" },
  { id: "sequence", label: "Sequence flow" },
];

type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

function isArrowKey(key: string): key is ArrowKey {
  return key === "ArrowUp" || key === "ArrowDown" || key === "ArrowLeft" || key === "ArrowRight";
}

// Directional nearest-neighbor: among nodes strictly in `direction` from `currentId`, pick the
// one with the smallest movement along that axis, breaking ties by the smallest cross-axis
// offset. Gives arrow-key navigation a sane spatial order across the 3-parallel-EKS-pod row.
function findNeighbor(currentId: string, direction: ArrowKey): string | null {
  const cur = POSITIONS[currentId];
  if (!cur) return null;

  let bestId: string | null = null;
  let bestScore = Infinity;

  for (const node of archNodes) {
    if (node.id === currentId) continue;
    const pos = POSITIONS[node.id];
    if (!pos) continue;

    const dRow = pos.row - cur.row;
    const dCol = pos.col - cur.col;
    let primary: number;
    let secondary: number;

    switch (direction) {
      case "ArrowRight":
        if (dCol <= 0) continue;
        primary = dCol;
        secondary = dRow;
        break;
      case "ArrowLeft":
        if (dCol >= 0) continue;
        primary = -dCol;
        secondary = dRow;
        break;
      case "ArrowDown":
        if (dRow <= 0) continue;
        primary = dRow;
        secondary = dCol;
        break;
      case "ArrowUp":
        if (dRow >= 0) continue;
        primary = -dRow;
        secondary = dCol;
        break;
    }

    const score = primary * 10 + Math.abs(secondary);
    if (score < bestScore) {
      bestScore = score;
      bestId = node.id;
    }
  }

  return bestId;
}

export default function ArchDiagram() {
  const firstNodeId = archNodes[0]?.id ?? "";
  const [focusedId, setFocusedId] = useState<string>(firstNodeId);
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<ViewId>("diagram");

  const nodeElsRef = useRef<Map<string, HTMLButtonElement>>(new Map());
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  function focusNode(id: string) {
    setFocusedId(id);
    nodeElsRef.current.get(id)?.focus();
  }

  function openDetail(id: string, trigger: HTMLButtonElement | null) {
    lastTriggerRef.current = trigger ?? nodeElsRef.current.get(id) ?? null;
    setFocusedId(id);
    setOpenId(id);
  }

  function closeDetail() {
    setOpenId(null);
    lastTriggerRef.current?.focus();
  }

  function handleNodeKeyDown(event: KeyboardEvent<HTMLButtonElement>, node: ArchNodeType) {
    if (isArrowKey(event.key)) {
      event.preventDefault();
      const next = findNeighbor(node.id, event.key);
      if (next) focusNode(next);
      return;
    }
    if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
      event.preventDefault();
      openDetail(node.id, event.currentTarget);
    }
  }

  function handleNodeClick(event: MouseEvent<HTMLButtonElement>, node: ArchNodeType) {
    openDetail(node.id, event.currentTarget);
  }

  const openNode = openId ? archNodes.find((node) => node.id === openId) : undefined;

  return (
    <Panel as="section" className="flex flex-col gap-4">
      <div>
        <h2 className="font-mono text-sm font-medium text-text-primary">Dormancy backtracking pipeline</h2>
        {view === "diagram" ? (
          <p className="mt-1 max-w-prose font-mono text-xs text-text-secondary">
            Use <kbd className="rounded border border-border bg-bg px-1">arrow keys</kbd> to move
            between nodes, <kbd className="rounded border border-border bg-bg px-1">Enter</kbd> or{" "}
            <kbd className="rounded border border-border bg-bg px-1">Space</kbd> to open a node&apos;s
            details, <kbd className="rounded border border-border bg-bg px-1">Esc</kbd> to close.
          </p>
        ) : (
          <p className="mt-1 max-w-prose font-mono text-xs text-text-secondary">
            One account&apos;s happy path, collapsing every retry and claim into the two calls that
            matter.
          </p>
        )}
      </div>

      <Tabs tabs={VIEW_TABS} activeId={view} onChange={(id) => setView(id as ViewId)} aria-label="Architecture view" />

      <div id="tabpanel-diagram" role="tabpanel" aria-labelledby="tab-diagram" hidden={view !== "diagram"}>
        <div className="relative flex flex-col gap-3 sm:grid sm:grid-cols-4 sm:gap-0 sm:[grid-template-rows:repeat(5,7rem)]">
          <ArchEdges edges={archEdges} positions={POSITIONS} cols={COLS} rows={ROWS} />
          {archNodes.map((node) => {
            const position = POSITIONS[node.id];
            return (
              <div
                key={node.id}
                className="sm:p-2"
                style={position ? { gridColumn: position.col + 1, gridRow: position.row + 1 } : undefined}
              >
                <ArchNode
                  ref={(el) => {
                    if (el) nodeElsRef.current.set(node.id, el);
                    else nodeElsRef.current.delete(node.id);
                  }}
                  node={node}
                  focused={focusedId === node.id}
                  tabIndex={focusedId === node.id ? 0 : -1}
                  external={EXTERNAL_IDS.has(node.id)}
                  onFocus={() => setFocusedId(node.id)}
                  onKeyDown={(event) => handleNodeKeyDown(event, node)}
                  onClick={(event) => handleNodeClick(event, node)}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div id="tabpanel-sequence" role="tabpanel" aria-labelledby="tab-sequence" hidden={view !== "sequence"}>
        {view === "sequence" ? <SequenceDiagram /> : null}
      </div>

      <ArchNodeDetail node={openNode} onClose={closeDetail} />
    </Panel>
  );
}
