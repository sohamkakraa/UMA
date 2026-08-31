import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, provide, testInfo) => {
    if (testInfo.project.name === "elderly") {
      await page.addInitScript(() => {
        document.documentElement.style.fontSize = "32px";
      });
      await page.emulateMedia({ reducedMotion: "reduce" });
    }
    await provide(page);
  },
});

export { expect };
