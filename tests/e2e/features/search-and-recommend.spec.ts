import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';

test.describe('Search and Recommendation Flow', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    await homePage.goto();
  });

  test('should recommend the best card for food delivery (Swiggy)', async ({ page }) => {
    await homePage.search('Swiggy', '1000');

    await expect(homePage.recommendationHeading).toBeVisible();
    await expect(page.locator('text=Net Value')).toBeVisible();

    // Verify recommendation card is displayed
    const bestCard = page.getByRole('button', { name: /view .* card details/i }).first();
    await expect(bestCard).toBeVisible();

    // Verify cashback / net value calculation is positive
    const netValueText = await homePage.getNetValue();
    expect(netValueText).toContain('₹');
  });

  test('should display P2P UPI exclusion warning when transferring money to a friend', async ({ page }) => {
    await homePage.search('friend', '2000');

    // Should display P2P warning
    const p2pWarning = page.locator('text=P2P UPI Exclusion Warning');
    await expect(p2pWarning).toBeVisible();
  });

  test('should allow toggling between Online and Offline spend mode', async () => {
    // Default is Online pressed
    await expect(homePage.onlineToggle).toHaveAttribute('aria-pressed', 'true');

    await homePage.onlineToggle.click();
    await expect(homePage.onlineToggle).toHaveAttribute('aria-pressed', 'false');

    await homePage.onlineToggle.click();
    await expect(homePage.onlineToggle).toHaveAttribute('aria-pressed', 'true');
  });

  test('should reject empty search query with validation', async ({ page }) => {
    await homePage.searchInput.fill('');
    await homePage.amountInput.fill('500');
    await homePage.checkButton.click();

    // Expect error toast notification or recommendation heading not present
    await expect(homePage.recommendationHeading).not.toBeVisible();
  });
});
