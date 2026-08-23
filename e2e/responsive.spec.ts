// OWNER: 08-e2e-tests.md — do not edit from another role
//
// BUILD_PROMPT.md §13 / §11: no section produces horizontal overflow on `document.body` below
// 640px. (The Backend Playground's accordion-vs-tabstrip breakpoint test was removed along with
// the `playground` command — see lib/commands/registry.ts.)
import { test, expect } from "@playwright/test";

test.use({ viewport: { width: 375, height: 800 } });

test.describe("mobile viewport (<640px)", () => {
  test("no horizontal scroll on document.body across sections", async ({ page }) => {
    const assertNoHorizontalOverflow = async () => {
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.body.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth);
    };

    await page.goto("/#/architecture");
    await expect(page.getByRole("heading", { name: "Dormancy backtracking pipeline" })).toBeVisible();
    await assertNoHorizontalOverflow();

    await page.goto("/#/projects");
    await expect(page.getByRole("log", { name: "Terminal output" })).toContainText("projects/");
    await assertNoHorizontalOverflow();
  });
});
