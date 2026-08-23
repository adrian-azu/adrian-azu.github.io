// OWNER: 01-foundation.md — do not edit from another role
// Theme persistence + application. The `theme <dark|light>` *command* itself belongs to role 04
// (site/lib/commands/handlers/theme.ts); this module only owns get/set/toggle + localStorage +
// applying the token class/attribute to <html>, per workflow/01-foundation.md Contract out.

const STORAGE_KEY = "adrian-portfolio-theme";
const DEFAULT_THEME: Theme = "dark";

export type Theme = "dark" | "light";

function isTheme(value: string | null): value is Theme {
  return value === "dark" || value === "light";
}

function applyThemeToDocument(theme: Theme): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
  root.style.colorScheme = theme;
}

/** Reads the persisted theme from localStorage, falling back to the dark default (SSR-safe). */
export function getTheme(): Theme {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isTheme(stored) ? stored : DEFAULT_THEME;
}

/** Persists `theme` to localStorage and applies it to `<html>` immediately. */
export function setTheme(theme: Theme): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }
  applyThemeToDocument(theme);
}

/** Flips between "dark" and "light", persisting and applying the result. */
export function toggleTheme(): void {
  const next: Theme = getTheme() === "dark" ? "light" : "dark";
  setTheme(next);
}
