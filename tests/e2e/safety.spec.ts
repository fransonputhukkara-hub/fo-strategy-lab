import { test, expect } from '@playwright/test';

test('live order endpoint is blocked', async ({ request }) => {
  const r = await request.post('/api/live/order');
  expect(r.status()).toBe(403);
  const body = await r.json();
  expect(String(body.detail)).toContain('Live trading is disabled');
});

test('health explicitly reports live trading disabled', async ({ request }) => {
  const r = await request.get('/api/health');
  const body = await r.json();
  expect(body.live_trading).toBe(false);
});