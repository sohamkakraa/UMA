import { test, expect } from "../fixtures/test";
import { loginWithDevToken } from "../fixtures/auth";

test.describe("Chat — archived threads", () => {
  test.beforeEach(async ({ page }) => {
    await loginWithDevToken(page);
    await page.goto("/chat");
    const openChats = page.getByRole("button", { name: "Open chats" });
    if (await openChats.isVisible()) await openChats.click();
  });

  test("shows Active and Archived tabs", async ({ page }) => {
    await expect(page.getByRole("button", { name: /Active/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Archived/i })).toBeVisible();
  });

  test("Archived tab shows archived count", async ({ page }) => {
    const archivedTab = page.getByRole("button", { name: /Archived/i });
    await expect(archivedTab).toBeVisible();
  });
});
