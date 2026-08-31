import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "../fixtures/test";
import { loginWithDevToken } from "../fixtures/auth";

const ROUTES = ["/dashboard", "/chat", "/profile"];

for (const route of ROUTES) {
  test(`${route} has no serious accessibility violations`, async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await loginWithDevToken(page);
    await page.goto(route);
    await page.waitForTimeout(1000);

    const criticalErrors = consoleErrors.filter(
      (e) => !e.includes("ResizeObserver") && !e.includes("hydration")
    );
    expect(criticalErrors).toHaveLength(0);

    const results = await new AxeBuilder({ page }).analyze();
    const serious = results.violations.filter(
      (violation) => violation.impact === "serious" || violation.impact === "critical",
    );
    expect(
      serious.map(({ id, impact, help, nodes }) => ({
        id,
        impact,
        help,
        targets: nodes.map((node) => node.target.join(" ")),
      })),
    ).toEqual([]);

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
}
