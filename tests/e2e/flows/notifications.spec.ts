import { test, expect } from "../fixtures/test";
import { loginWithDevToken } from "../fixtures/auth";

test("notification bell is visible", async ({ page }) => {
  await loginWithDevToken(page);
  await page.goto("/dashboard");
  const notificationButton = page.getByRole("button", { name: /notification/i });
  if (!(await notificationButton.isVisible())) {
    await page.getByRole("button", { name: "Open menu" }).click();
  }
  await expect(notificationButton).toBeVisible({ timeout: 5000 });
});
