import { test, expect } from '@playwright/test';
test('phase 8 dashboard loads', async ({page})=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'F&O Strategy Lab'})).toBeVisible();
 await expect(page.getByText(/PHASE 8/)).toBeVisible();
 await expect(page.getByRole('heading',{name:'Walk-forward validation'})).toBeVisible();
});
test('live order remains blocked in phase 8', async({request})=>{
 const r=await request.post('/api/live/order'); expect(r.status()).toBe(403);
});