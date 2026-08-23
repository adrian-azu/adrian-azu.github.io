// OWNER: 05-playground-ui.md — do not edit from another role
// Top-level Backend Playground shell (BUILD_PROMPT.md §4): switches between the three sub-panels,
// tab strip at tablet/desktop, accordion below 640px. Owns the shared `seed` — put in the URL
// query string (independent of role 04's `#/...` hash route) so a run is shareable/reproducible;
// every sub-panel derives its own PRNG stream from this one seed.
"use client";

import { useCallback, useEffect, useState } from "react";
import type { SyntheticEvent } from "react";
import { Panel } from "@/components/ui/Panel";
import { Tabs } from "@/components/ui/Tabs";
import type { TabItem } from "@/components/ui/Tabs";
import ApiPlayground from "@/components/playground/ApiPlayground";
import FailureSimulation from "@/components/playground/FailureSimulation";
import Benchmark from "@/components/playground/Benchmark";

const SEED_PARAM = "seed";
const MOBILE_BREAKPOINT_QUERY = "(max-width: 639px)";

const TABS: TabItem[] = [
  { id: "api", label: "API Playground" },
  { id: "failure", label: "Failure Simulation" },
  { id: "benchmark", label: "Benchmark" },
];

function readSeedFromUrl(): number | null {
  if (typeof window === "undefined") return null;
  const raw = new URLSearchParams(window.location.search).get(SEED_PARAM);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : null;
}

function writeSeedToUrl(seed: number): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.set(SEED_PARAM, String(seed));
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}

function freshSeed(): number {
  return Math.floor(Date.now() % 2147483647);
}

export default function PlaygroundTabs() {
  const [seed, setSeed] = useState<number>(() => readSeedFromUrl() ?? freshSeed());
  const [activeTab, setActiveTab] = useState<string>(TABS[0]!.id);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    writeSeedToUrl(seed);
  }, [seed]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  const reseed = useCallback(() => setSeed(freshSeed()), []);

  function handleAccordionToggle(id: string, e: SyntheticEvent<HTMLDetailsElement>) {
    if (e.currentTarget.open) setActiveTab(id);
  }

  // `key={seed}` forces a full remount of whichever panel is showing on reseed, so each panel's
  // internal state (rng streams, history, in-flight runs) resets to a clean slate for the new
  // seed without needing a `useEffect(() => reset..., [seed])` in every panel.
  function renderPanel(id: string) {
    switch (id) {
      case "api":
        return <ApiPlayground key={seed} seed={seed} />;
      case "failure":
        return <FailureSimulation key={seed} seed={seed} />;
      case "benchmark":
        return <Benchmark key={seed} seed={seed} />;
      default:
        return null;
    }
  }

  return (
    <Panel className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-mono text-sm font-medium text-text-primary">Backend Playground</h2>
          <p className="font-mono text-xs text-text-muted">
            seed <span className="text-text-secondary">{seed}</span> — this run is reproducible
            from the URL&apos;s <code>?seed=</code> query param
          </p>
        </div>
        <button
          type="button"
          onClick={reseed}
          className="rounded-panel border border-border px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors duration-150 ease-out hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2"
        >
          reseed
        </button>
      </header>

      {isMobile ? (
        <div className="flex flex-col gap-2">
          {TABS.map((tab) => (
            <details
              key={tab.id}
              open={tab.id === activeTab}
              onToggle={(e) => handleAccordionToggle(tab.id, e)}
              className="rounded-panel border border-border"
            >
              <summary className="cursor-pointer select-none rounded-panel px-3 py-2 font-mono text-sm text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2">
                {tab.label}
              </summary>
              <div className="border-t border-border p-3">{renderPanel(tab.id)}</div>
            </details>
          ))}
        </div>
      ) : (
        <>
          <Tabs tabs={TABS} activeId={activeTab} onChange={setActiveTab} aria-label="Backend Playground sections" />
          <div role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
            {renderPanel(activeTab)}
          </div>
        </>
      )}
    </Panel>
  );
}
