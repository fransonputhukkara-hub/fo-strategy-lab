import { test, expect } from "@playwright/test";

test("paper page exposes estimate-only workflow", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Paper trading/ }).click();
  await expect(page.getByRole("heading", { name: "Paper outcome calculator" })).toBeVisible();
  await expect(page.getByText("ESTIMATE ONLY")).toBeVisible();
});

test("paper trade returns cost-adjusted result", async ({ request }) => {
  const response = await request.post("/api/paper/trade", {
    data: { gross_pnl: 100, sell_value: 1000, buy_value: 1000 }
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.net_pnl).toBeLessThan(100);
});

test("live trading is blocked", async ({ request }) => {
  const response = await request.post("/api/live/order");
  expect(response.status()).toBe(403);
});

test("daily risk gate blocks excessive loss", async ({ request }) => {
  const response = await request.post("/api/paper/trade", {
    data: { gross_pnl: -1000, sell_value: 1000, buy_value: 1000, daily_pnl: -100 }
  });
  expect(response.status()).toBe(409);
});
