import { expect, test } from '@playwright/test';

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`renders sign-in workspace at ${viewport.name} size`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'SOC5 Outbound' })).toBeVisible();
    await expect(page.getByLabel('Work email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    await expect(page.getByText('Asia/Manila')).toBeVisible();

    const dimensions = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport);
    await page.screenshot({ fullPage: true, path: `test-results/${viewport.name}.png` });
  });
}

test('routes health through the same-origin API and protects profile', async ({ page }) => {
  const health = await page.request.get('/api/health');
  expect(health.status()).toBe(200);
  await expect(health).toBeOK();
  expect(await health.json()).toMatchObject({ status: 'ok' });

  const profile = await page.request.get('/api/auth/me');
  expect(profile.status()).toBe(401);
});

test('serves the three source truck-label templates', async ({ page }) => {
  for (const template of ['single_lh.jpg', 'coload_lh.jpg', 'triload_lh.jpg']) {
    const response = await page.request.get(`/label-templates/${template}`);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/jpeg');
  }
});
