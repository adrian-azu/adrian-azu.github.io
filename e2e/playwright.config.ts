// OWNER: 08-e2e-tests.md — do not edit from another role
//
// Local Playwright config, kept inside role 08's own `e2e/**` directory so it doesn't collide with
// collision rule 5 (config is Foundation-only for root-level config files owned by role 01). See
// workflow/requests/08-playwright-dependency.md: once role 01 adds `@playwright/test` as a real
// devDependency, this file can be superseded by (or wired into) a root `site/playwright.config.ts`
// + an `npm run e2e` script — no spec changes anticipated either way.
//
// Usage (from `site/`), against a locally built + started app:
//   npm run build && npm run start &
//   npx playwright test --config=e2e/playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT ?? "3000";
const BASE_URL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    // Reduced motion is a first-class, tested code path (BUILD_PROMPT.md §13: boot sequence and
    // arch-diagram animations must be skipped entirely under `prefers-reduced-motion: reduce`,
    // "content still appears, just instantly"). Running the whole suite under it keeps specs fast
    // and deterministic without weakening what's being asserted — the reduced-motion fallback is
    // required to render the same content as the animated path, just without the stagger/token
    // animation. Mobile-viewport-specific overrides (if any) live in the spec itself.
    contextOptions: { reducedMotion: "reduce" },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
