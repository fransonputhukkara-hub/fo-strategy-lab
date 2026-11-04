import { test, expect } from '@playwright/test';

test('health endpoint is available', async ({ request }) => {
  const r = await request.get('/api/health');
  expect(r.ok()).toBeTruthy();
  const body = await r.json();
  expect(body.status).toBe('ok');
  expect(body.live_trading).toBe(false);
});

test('research dashboard loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'F&O Strategy Lab' })).toBeVisible();
  await expect(page.getByText('RESEARCH / PAPER ONLY')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Run research report' })).toBeVisible();
});

test('mobile dashboard remains usable', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'F&O Strategy Lab' })).toBeVisible();
  const input = page.locator('input').first();
  await expect(input).toBeVisible();
});