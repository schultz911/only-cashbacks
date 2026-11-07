import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Offline and PWA Flow', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should display offline indicator banner when connection is lost', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    const offlineBanner = page.locator('text=Offline Mode: Changes will be saved locally');
    await expect(offlineBanner).toBeVisible();

    // Check button shows offline indicator
    await expect(page.locator('button:has-text("Check")')).toBeVisible();

    // Restore online
    await context.setOffline(false);
    await page.evaluate(() => window.dispatchEvent(new Event('online')));

    await expect(offlineBanner).not.toBeVisible();
  });

  test('should provide card recommendations even in offline mode', async ({ page, context }) => {
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event('offline')));

    await homePage.search('Swiggy', '500');
    await expect(homePage.recommendationHeading).toBeVisible();

    const netValue = await homePage.getNetValue();
    expect(netValue).toContain('₹');

    // Restore online
    await context.setOffline(false);
  });
});

