import {test,expect} from '@playwright/test';
test('phase 10 dashboard loads',async({page})=>{await page.goto('/');await expect(page.getByText(/PHASE 10/)).toBeVisible();await expect(page.getByRole('heading',{name:'₹5,000 paper trade'})).toBeVisible();});
test('paper trade returns cost-adjusted result',async({request})=>{const r=await request.post('/api/paper/trade',{data:{gross_pnl:100,sell_value:1000,buy_value:1000}});expect(r.ok()).toBeTruthy();const b=await r.json();expect(b.net_pnl).toBeLessThan(100);});
test('live trading is blocked',async({request})=>{const r=await request.post('/api/live/order');expect(r.status()).toBe(403);});
test('daily risk gate blocks excessive loss',async({request})=>{const r=await request.post('/api/paper/trade',{data:{gross_pnl:-1000,sell_value:1000,buy_value:1000,daily_pnl:-100}});expect(r.status()).toBe(409);});
