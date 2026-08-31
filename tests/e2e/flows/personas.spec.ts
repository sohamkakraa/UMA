import { test, expect } from "../fixtures/test";
import { loginWithDevToken } from "../fixtures/auth";
import { seedPatientStore } from "../fixtures/seed-store";
import { PERSONAS } from "../fixtures/personas/data";

for (const persona of PERSONAS) {
  test(`${persona.id} can open a readable dashboard`, async ({ page }) => {
    await page.setViewportSize(persona.viewport);
    await loginWithDevToken(page);
    await page.goto("/dashboard");
    await seedPatientStore(page, persona.store);

    await expect(page.getByRole("heading", { name: "Your health dashboard" })).toBeAttached();
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    expect(hasHorizontalOverflow).toBe(false);
  });
}
