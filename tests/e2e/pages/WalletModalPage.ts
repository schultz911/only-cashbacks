import { Page, Locator, expect } from '@playwright/test';

export class WalletModalPage {
  readonly page: Page;
  readonly dialogTitle: Locator;
  readonly searchInput: Locator;
  readonly closeButton: Locator;
  readonly countBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialogTitle = page.locator('#wallet-title');
    this.searchInput = page.getByPlaceholder('Search by card, bank, or network');
    this.closeButton = page.getByLabel('Close Wallet Manager');
    this.countBadge = page.locator('span[aria-live="polite"]');
  }

  async waitForOpen() {
    await expect(this.dialogTitle).toBeVisible();
  }

  async searchCards(term: string) {
    await this.searchInput.fill(term);
  }

  getCardCheckbox(cardName: string): Locator {
    return this.page.getByRole('checkbox', { name: new RegExp(cardName, 'i') });
  }

  async toggleCard(cardName: string) {
    const card = this.getCardCheckbox(cardName);
    await card.click();
  }

  async close() {
    await this.closeButton.click();
    await expect(this.dialogTitle).not.toBeVisible();
  }
}

