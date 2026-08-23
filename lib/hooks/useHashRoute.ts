// OWNER: 04-terminal-shell.md — do not edit from another role
// Thin `window.location.hash` sync: exposes the current hash (minus the leading `#`) and a setter
// that updates it. Listens for both `hashchange` (the authoritative event for hash-only navigation,
// covers browser back/forward and manual edits to the address bar) and `popstate` (fired on
// back/forward in some browsers even for hash-only changes — kept as a defensive second listener).
// Terminal.tsx owns turning a hash into a command dispatch; this hook only owns the string.
"use client";

import { useCallback, useEffect, useState } from "react";

function readHash(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.replace(/^#/, "");
}

export function useHashRoute(): [string, (hash: string) => void] {
  const [hash, setHashState] = useState<string>(() => readHash());

  useEffect(() => {
    function handleHashChange() {
      setHashState(readHash());
    }
    window.addEventListener("hashchange", handleHashChange);
    window.addEventListener("popstate", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      window.removeEventListener("popstate", handleHashChange);
    };
  }, []);

  const setHash = useCallback((next: string) => {
    if (typeof window === "undefined") return;
    const normalized = next.startsWith("#") ? next : `#${next}`;
    if (window.location.hash === normalized) return;
    window.location.hash = normalized;
  }, []);

  return [hash, setHash];
}
