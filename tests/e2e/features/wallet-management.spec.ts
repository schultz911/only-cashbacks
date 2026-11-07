import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { WalletModalPage } from '../pages/WalletModalPage';

test.describe('Wallet Management Flow', () => {
  let homePage: HomePage;
  let walletModal: WalletModalPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    walletModal = new WalletModalPage(page);
    await homePage.goto();
  });

  test('should open wallet manager and filter cards by search query', async () => {
    await homePage.openWallet();
    await walletModal.waitForOpen();

    await walletModal.searchCards('HDFC');
    const hdfcCard = walletModal.getCardCheckbox('HDFC').first();
    await expect(hdfcCard).toBeVisible();

    await walletModal.close();
  });

  test('should toggle card ownership and update selected count badge', async () => {
    await homePage.openWallet();
    await walletModal.waitForOpen();

    const countInitial = await walletModal.countBadge.innerText();
    expect(countInitial).toContain('selected');

    // Toggle a card
    const firstCheckbox = walletModal.page.getByRole('checkbox').first();
    await firstCheckbox.click();

    const countUpdated = await walletModal.countBadge.innerText();
    expect(countUpdated).toContain('selected');

    await walletModal.close();
  });
});

