// OWNER: 08-e2e-tests.md — do not edit from another role
//
// BUILD_PROMPT.md §13: "Theme choice persists across reload (localStorage)." Exercises both the
// `theme <dark|light>` command chip and the underlying persistence contract in lib/theme.ts
// (localStorage key `adrian-portfolio-theme`, applied via <html data-theme>).
import { test, expect, type Page } from "@playwright/test";

const STORAGE_KEY = "adrian-portfolio-theme";

// Command chips are hidden until `help` has been run at least once (see Terminal.tsx's
// `chipsRevealed` state) — every test here clicks a chip, so every test must unlock it first.
async function revealChips(page: Page) {
  const input = page.getByLabel("Terminal command input");
  await input.fill("help");
  await input.press("Enter");
}

test.describe("theme persistence", () => {
  test("toggling theme via chip persists across reload", async ({ page }) => {
    await page.goto("/");

    // Default theme is dark (BUILD_PROMPT.md §10).
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await revealChips(page);
    await page.getByRole("button", { name: "Run theme light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY))
      .toBe("light");

    await page.reload();

    // Persisted before hydration by app/layout.tsx's inline theme-init script, so this must hold
    // even in the very first paint after reload, not just after the terminal mounts.
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    const stored = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    expect(stored).toBe("light");
  });

  test("toggling back to dark persists across reload", async ({ page }) => {
    await page.goto("/");
    await revealChips(page);
    await page.getByRole("button", { name: "Run theme light" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

    await page.getByRole("button", { name: "Run theme dark" }).click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const stored = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
    expect(stored).toBe("dark");
  });

  test("`theme` command output reflects the persisted value", async ({ page }) => {
    await page.goto("/");
    await revealChips(page);
    await page.getByRole("button", { name: "Run theme light" }).click();

    const input = page.getByLabel("Terminal command input");
    await input.fill("theme");
    await input.press("Enter");

    const output = page.getByRole("log", { name: "Terminal output" });
    await expect(output).toContainText("Current theme: light");
  });
});
