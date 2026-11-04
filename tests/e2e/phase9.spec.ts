import {test,expect} from '@playwright/test';
test('phase 9 dashboard loads',{ },async({page})=>{await page.goto('/');await expect(page.getByRole('heading',{name:'F&O Strategy Lab'})).toBeVisible();await expect(page.getByText(/PHASE 9/)).toBeVisible();await expect(page.getByRole('heading',{name:'Dynamic strike dataset'})).toBeVisible();});
test('live order remains locked',async({request})=>{const r=await request.post('/api/live/order');expect(r.status()).toBe(403);});
test('risk defaults endpoint works',async({request})=>{const r=await request.get('/api/risk/defaults?capital=5000');expect(r.ok()).toBeTruthy();const b=await r.json();expect(b.capital).toBe(5000);});
