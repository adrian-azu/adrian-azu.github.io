// OWNER: 01-foundation.md — frozen contract, append-only after Wave 0 (see workflow/00-ORCHESTRATION.md
// collision rule 3). Every shape below is copied verbatim from BUILD_PROMPT.md §12. No role edits an
// existing type; propose additions via workflow/requests/<role>-types-<topic>.md instead.
import type { ReactNode } from "react";

export interface CommandResult {
  kind: "text" | "component" | "error";
  content: string | ReactNode;
}

export type Command = {
  name: string;
  description: string;
  run: (args: string[]) => CommandResult;
};

export interface Project {
  slug: string;
  title: string;
  problem: string;
  architecture: string;
  techChoices: { tech: string; why: string }[];
  challenge?: string;
  outcome?: string;
  repoUrl: string;
}

export interface Role {
  companySlug: string;
  title: string;
  company: string;
  window: string;
  focus: string;
  achievements: string[];
}

export interface SkillGroup {
  category: string;
  items: string[];
}

export interface MockEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  sampleRequest: unknown;
  latencyRangeMs: [number, number];
}

export interface SimConfig {
  jobCount: number;
  workerCount: number;
  failureRate: number;
  maxAttempts: number;
  backoffBaseMs: number;
  seed: number;
}

export interface JobEvent {
  jobId: string;
  timestampMs: number;
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  state: "visible" | "in-flight" | "done" | "dead-lettered";
}

export interface BenchResult {
  mode: "sequential" | "parallel";
  concurrency: number;
  p50: number;
  p95: number;
  p99: number;
  throughputRps: number;
  wallTimeMs: number;
}

export interface ArchNode {
  id: string;
  label: string;
  responsibility: string;
  tech: string;
  scaling: string;
  failureModes: string;
  observability: string;
  tradeoff: string;
  service: string; // short AWS-service tag shown on the node card (e.g. "AWS RDS (PostgreSQL)")
}

export interface ArchEdge {
  from: string;
  to: string;
  order: number; // sequence position for the `simulate` animation and the sequence-diagram view
  label: string; // short hop description, shown as the message text in the sequence-diagram view
}
