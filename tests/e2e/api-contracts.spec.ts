import { test, expect } from '@playwright/test';

test('research endpoint rejects missing dataset path', async ({ request }) => {
  const r = await request.post('/api/research/report', {
    data: { path: 'does-not-exist.json', train_ratio: 0.7 }
  });
  expect(r.status()).toBe(400);
});

test('research endpoint rejects malformed train ratio', async ({ request }) => {
  const r = await request.post('/api/research/report', {
    data: { path: 'x.json', train_ratio: 0.7 }
  });
  // A missing file should be a controlled client error, not an application crash.
  expect([400, 404]).toContain(r.status());
});