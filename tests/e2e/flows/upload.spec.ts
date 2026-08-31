import { test, expect } from "../fixtures/test";
import { loginWithDevToken } from "../fixtures/auth";

test("upload page redirects to dashboard", async ({ page }) => {
  await loginWithDevToken(page);
  await page.goto("/upload");
  await expect(page).toHaveURL(/dashboard/);
});
