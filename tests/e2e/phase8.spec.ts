import { test, expect } from "@playwright/test";

test("strategy lab opens from navigation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Strategy lab/ }).click();
  await expect(page.getByRole("heading", { name: "Opening-range breakout" })).toBeVisible();
  await expect(page.getByText("Not validated")).toBeVisible();
});

test("live order remains blocked", async ({ request }) => {
  const response = await request.post("/api/live/order");
  expect(response.status()).toBe(403);
});
