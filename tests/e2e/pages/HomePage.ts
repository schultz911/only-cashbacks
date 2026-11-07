import { Page, Locator, expect } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly brandTitle: Locator;
  readonly searchInput: Locator;
  readonly amountInput: Locator;
  readonly checkButton: Locator;
  readonly onlineToggle: Locator;
  readonly intlToggle: Locator;
  readonly recommendationHeading: Locator;
  readonly netValueText: Locator;
  readonly logButton: Locator;
  readonly mySavingsButton: Locator;
  readonly walletEditButton: Locator;
  readonly viewPassesButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.brandTitle = page.locator('h1:has-text("OnlyCashbacks")');
    this.searchInput = page.locator('#merchant-search');
    this.amountInput = page.locator('#spend-amount');
    this.checkButton = page.getByRole('button', { name: /^Check$/i });
    this.onlineToggle = page.getByRole('button', { name: /online/i });
    this.intlToggle = page.getByRole('button', { name: /intl/i });
    this.recommendationHeading = page.getByRole('heading', { name: /recommendation/i });
    this.netValueText = page.locator('text=Net Value');
    this.logButton = page.locator('button:has-text("Log Transaction"), button:has-text("Logged"), button:has-text("Check"):not(#spend-amount *)');
    this.mySavingsButton = page.locator('button[aria-label="My Savings"]');
    this.walletEditButton = page.getByRole('button', { name: 'Edit' });
    this.viewPassesButton = page.getByRole('button', { name: 'View Passes' });
  }

  async goto() {
    await this.page.goto('/');
    await expect(this.brandTitle).toBeVisible();
  }

  async search(merchant: string, amount: string = '1000') {
    await this.searchInput.fill(merchant);
    await this.amountInput.fill(amount);
    await this.checkButton.click();
    await expect(this.recommendationHeading).toBeVisible();
  }

  async getNetValue(): Promise<string | null> {
    const parent = this.netValueText.locator('..');
    return await parent.innerText();
  }

  async openWallet() {
    await this.walletEditButton.click();
  }

  async openDashboard() {
    await this.mySavingsButton.click();
  }

  async openLoungeTracker() {
    await this.viewPassesButton.click();
  }
}

