import { test, expect } from '@playwright/test';

const routes = [
  '/', '/login', '/signup', '/profile', '/settings', '/performance',
  '/dashboard', '/admin', '/orders', '/messages', '/my-gigs', '/create-gig'
];

for (const route of routes) {
  test(`loads ${route} without a blank page`, async ({ page }) => {
    const pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `No document response for ${route}`).not.toBeNull();
    expect(response.status(), `HTTP status for ${route}`).toBeLessThan(400);

    await page.locator('body').waitFor();
    await expect(page.locator('body')).not.toBeEmpty();
    await page.waitForTimeout(1200);

    const bodyText = (await page.locator('body').innerText()).trim();
    expect(bodyText.length, `Page appears blank: ${route}`).toBeGreaterThan(0);
    expect(pageErrors, `JavaScript errors on ${route}`).toEqual([]);
  });
}

test('home page has no horizontal overflow on mobile and desktop', async ({ page }) => {
  await page.goto('/');
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 2);
});

for (const route of routes) {
  test(`mobile layout stays inside the viewport on ${route}`, async ({ page }) => {
    for (const width of [320, 360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await page.locator('body').waitFor();
      await page.waitForTimeout(250);
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      expect(
        Math.max(dimensions.document, dimensions.body),
        `Horizontal overflow on ${route} at ${width}px: ${JSON.stringify(dimensions)}`
      ).toBeLessThanOrEqual(dimensions.viewport + 2);
    }
  });
}
