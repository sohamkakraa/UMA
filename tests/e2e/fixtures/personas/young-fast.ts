import { test as base } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, provide) => {
    await provide(page); // baseline — no modifications
  },
});
