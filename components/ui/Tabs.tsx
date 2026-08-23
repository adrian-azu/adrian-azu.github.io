// OWNER: 01-foundation.md — do not edit from another role
// Accessible tab-strip atom (WAI-ARIA tabs pattern: role="tablist"/"tab", roving tabindex,
// Left/Right/Home/End keyboard nav, visible focus rings). Role 05's PlaygroundTabs uses this at
// tablet/desktop widths and falls back to its own accordion below 640px (§4 mobile rule) — that
// responsive switch is role 05's concern, this component only renders the strip itself.
"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";

export interface TabItem {
  id: string;
  label: string;
}

export interface TabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
  className?: string;
  "aria-label"?: string;
}

export function Tabs({ tabs, activeId, onChange, className = "", ...rest }: TabsProps) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function focusTab(index: number) {
    const el = tabRefs.current[index];
    el?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (tabs.length === 0) return;
    switch (event.key) {
      case "ArrowRight": {
        event.preventDefault();
        const next = (index + 1) % tabs.length;
        const tab = tabs[next];
        if (tab) {
          onChange(tab.id);
          focusTab(next);
        }
        break;
      }
      case "ArrowLeft": {
        event.preventDefault();
        const prev = (index - 1 + tabs.length) % tabs.length;
        const tab = tabs[prev];
        if (tab) {
          onChange(tab.id);
          focusTab(prev);
        }
        break;
      }
      case "Home": {
        event.preventDefault();
        const tab = tabs[0];
        if (tab) {
          onChange(tab.id);
          focusTab(0);
        }
        break;
      }
      case "End": {
        event.preventDefault();
        const lastIndex = tabs.length - 1;
        const tab = tabs[lastIndex];
        if (tab) {
          onChange(tab.id);
          focusTab(lastIndex);
        }
        break;
      }
      default:
        break;
    }
  }

  return (
    <div role="tablist" aria-label={rest["aria-label"]} className={`flex gap-1 border-b border-border ${className}`.trim()}>
      {tabs.map((tab, index) => {
        const selected = tab.id === activeId;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`px-3 py-2 font-mono text-sm transition-colors duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2 ${
              selected
                ? "border-b-2 border-accent-primary text-text-primary"
                : "border-b-2 border-transparent text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
