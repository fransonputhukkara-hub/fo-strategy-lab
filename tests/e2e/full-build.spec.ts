
import { test, expect } from '@playwright/test';

test('full mobile dashboard loads', async ({page})=>{
  await page.goto('/');
  await expect(page.getByRole('heading',{name:'F&O Strategy Lab'})).toBeVisible();
  await expect(page.getByText(/FULL BUILD/)).toBeVisible();
  await expect(page.getByText('₹5,000')).toBeVisible();
});

test('paper calculation includes costs', async ({request})=>{
  const r=await request.post('/api/paper/trade',{
    data:{gross_pnl:100,sell_value:1000,buy_value:1000}
  });
  expect(r.ok()).toBeTruthy();
  const b=await r.json();
  expect(b.net_pnl).toBeLessThan(100);
  expect(b.costs.estimated_total).toBeGreaterThan(0);
});

test('paper risk gate blocks daily-loss breach', async ({request})=>{
  const r=await request.post('/api/paper/trade',{
    data:{gross_pnl:-1000,sell_value:1000,buy_value:1000,daily_pnl:-100}
  });
  expect(r.status()).toBe(409);
});

test('final holdout rejects insufficient evidence', async ({request})=>{
  const r=await request.post('/api/research/final-gate',{
    data:{
      development:{trades:30},
      test:{trades:3,expectancy:10},
      holdout:{trades:2,expectancy:5},
      min_trades:20
    }
  });
  expect(r.ok()).toBeTruthy();
  const b=await r.json();
  expect(b.status).toBe('REJECT');
});

test('final holdout can pass configured research gates', async ({request})=>{
  const r=await request.post('/api/research/final-gate',{
    data:{
      development:{trades:100},
      test:{trades:30,expectancy:5},
      holdout:{trades:25,expectancy:3},
      min_trades:20
    }
  });
  expect(r.ok()).toBeTruthy();
  const b=await r.json();
  expect(b.status).toBe('PASS');
});

test('live order is always blocked', async ({request})=>{
  const r=await request.post('/api/live/order');
  expect(r.status()).toBe(403);
});
