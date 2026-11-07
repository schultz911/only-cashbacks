import { Page, Locator, expect } from '@playwright/test';

export class DashboardModalPage {
  readonly page: Page;
  readonly dialog: Locator;
  readonly title: Locator;
  readonly closeButton: Locator;
  readonly undoButton: Locator;
  readonly resetButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dialog = page.getByRole('dialog', { name: 'My Savings' });
    this.title = page.getByRole('heading', { name: 'My Savings' });
    this.closeButton = page.getByLabel('Close Savings Dashboard');
    this.undoButton = page.getByRole('button', { name: /undo last/i });
    this.resetButton = page.getByRole('button', { name: /reset/i });
  }

  async waitForOpen() {
    await expect(this.title).toBeVisible();
  }

  async close() {
    await this.closeButton.click();
    await expect(this.title).not.toBeVisible();
  }
}

