import { test, expect } from "@playwright/test";

test("health endpoint is available", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
  expect(body.live_trading).toBe(false);
});

test("research dashboard loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("RESEARCH / PAPER ONLY")).toBeVisible();
  await expect(page.getByText("Live orders locked")).toBeVisible();
  await expect(page.getByText("No approved dataset available")).toHaveCount(0);
});

test("mobile dashboard remains usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Market data/ })).toBeVisible();
});
