// OWNER: 06-architecture-viz.md — do not edit from another role
// Registers the `architecture` command (§3), rendering the interactive dormancy-pipeline diagram
// (ArchDiagram) as a `kind: "component"` CommandResult. Kept as `.ts` (not `.tsx`) per the file
// list in workflow/01-foundation.md, so JSX is written via `createElement` instead of JSX syntax.
import { createElement } from "react";
import type { Command } from "@/lib/types";
import ArchDiagram from "@/components/architecture/ArchDiagram";

const architecture: Command = {
  name: "architecture",
  description: "Opens the interactive dormancy-pipeline architecture diagram",
  run: () => ({ kind: "component", content: createElement(ArchDiagram) }),
};

export default architecture;
