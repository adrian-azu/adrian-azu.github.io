// OWNER: 05-playground-ui.md — do not edit from another role
// Stub authored in Wave 0 (role 01) only to keep the tree compiling — role 04 imports this file's
// default export into registry.ts regardless of stub/final state (signature is fixed by role 01).
// Role 05 replaces this body from Wave 2 onward. Kept as `.ts` (not `.tsx`) per the file list in
// workflow/01-foundation.md, so JSX is written via `createElement` instead of JSX syntax.
import { createElement } from "react";
import type { Command } from "@/lib/types";
import PlaygroundTabs from "@/components/playground/PlaygroundTabs";

const playground: Command = {
  name: "playground",
  description: "Opens the Backend Playground (API Playground / Failure Simulation / Benchmark)",
  run: () => ({ kind: "component", content: createElement(PlaygroundTabs) }),
};

export default playground;
