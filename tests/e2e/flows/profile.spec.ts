import { test, expect } from "../fixtures/test";
import { loginWithDevToken } from "../fixtures/auth";

test("profile page loads", async ({ page }) => {
  await loginWithDevToken(page);
  await page.goto("/profile");
  await expect(page.getByRole("heading", { name: /profile/i })).toBeAttached({ timeout: 5000 });
  await expect(page).toHaveURL(/profile/);
});
