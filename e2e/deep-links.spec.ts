// OWNER: 08-e2e-tests.md — do not edit from another role
//
// BUILD_PROMPT.md §13: "Deep links (#/projects, #/architecture, etc.) load directly into that
// section." Each case navigates straight to a URL hash in a brand-new page (no prior command typed
// or chip clicked) and asserts the corresponding section is rendered — proving the hash alone
// drives the section render, per workflow/08-e2e-tests.md's DoD item.
import { test, expect } from "@playwright/test";

const OUTPUT_LOG = { role: "log" as const, name: "Terminal output" };

test.describe("deep links", () => {
  test("#/projects loads the Projects section directly", async ({ page }) => {
    await page.goto("/#/projects");

    const output = page.getByRole(OUTPUT_LOG.role, { name: OUTPUT_LOG.name });
    await expect(output).toContainText("projects/");
    await expect(output).toContainText("xyz-parking-lot");

    // Nothing was typed to get here — the command input stays empty.
    await expect(page.getByLabel("Terminal command input")).toHaveValue("");
  });

  test("#/architecture loads the Architecture section directly", async ({ page }) => {
    await page.goto("/#/architecture");

    await expect(page.getByRole("heading", { name: "Dormancy backtracking pipeline" })).toBeVisible();
    await expect(page.getByLabel("Terminal command input")).toHaveValue("");
  });

  test("#/skills loads the Skills section directly", async ({ page }) => {
    await page.goto("/#/skills");

    const output = page.getByRole(OUTPUT_LOG.role, { name: OUTPUT_LOG.name });
    await expect(output).toContainText("Languages:");
    await expect(page.getByLabel("Terminal command input")).toHaveValue("");
  });

  test("#/contact loads the Contact section directly", async ({ page }) => {
    await page.goto("/#/contact");

    const output = page.getByRole(OUTPUT_LOG.role, { name: OUTPUT_LOG.name });
    await expect(output).toContainText("Email");
    await expect(page.getByLabel("Terminal command input")).toHaveValue("");
  });

  test("browser back navigates between two deep-linked sections", async ({ page }) => {
    await page.goto("/#/projects");
    const output = page.getByRole(OUTPUT_LOG.role, { name: OUTPUT_LOG.name });
    await expect(output).toContainText("projects/");

    await page.goto("/#/architecture");
    await expect(page.getByRole("heading", { name: "Dormancy backtracking pipeline" })).toBeVisible();

    await page.goBack();
    await expect(output).toContainText("projects/");
  });
});
