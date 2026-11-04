import { test, expect } from "@playwright/test";

test("desktop dashboard loads real backend status", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("RESEARCH / PAPER ONLY")).toBeVisible();
  await expect(page.getByText("API connected")).toBeVisible();
  await expect(page.getByText("Live orders locked")).toBeVisible();
  await expect(page.getByText("₹5,000")).toBeVisible();
});

test("navigation opens market data and research sections", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Market data/ }).click();
  await expect(page.getByRole("heading", { name: "Market data status" })).toBeVisible();
  await page.getByRole("button", { name: /Research reports/ }).click();
  await expect(page.getByRole("heading", { name: "No approved dataset available" })).toBeVisible();
});

test("paper calculator returns a cost-adjusted estimate", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Paper trading/ }).click();
  await page.getByRole("button", { name: /Calculate net outcome/ }).click();
  await expect(page.getByText("ESTIMATED NET P&L")).toBeVisible();
  await expect(page.getByText(/This estimate is not saved to the account ledger/)).toBeVisible();
});

test("mobile dashboard stays usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
});
