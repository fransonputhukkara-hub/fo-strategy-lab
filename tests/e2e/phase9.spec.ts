import { test, expect } from "@playwright/test";

test("risk controls show backend defaults", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Risk controls/ }).click();
  await expect(page.getByRole("heading", { name: "Risk limits" })).toBeVisible();
  await expect(page.getByText("Persistent risk settings")).toBeVisible();
  await expect(page.getByText("Not implemented")).toBeVisible();
});

test("live order remains locked", async ({ request }) => {
  const response = await request.post("/api/live/order");
  expect(response.status()).toBe(403);
});

test("risk defaults endpoint works", async ({ request }) => {
  const response = await request.get("/api/risk/defaults?capital=5000");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.capital).toBe(5000);
});
