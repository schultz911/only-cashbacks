import { Page, Locator, expect } from '@playwright/test';

export class LoungeModalPage {
  readonly page: Page;
  readonly title: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator('#lounge-tracker-title');
    this.closeButton = page.getByLabel('Close lounge tracker');
  }

  async waitForOpen() {
    await expect(this.title).toBeVisible();
  }

  async close() {
    await this.closeButton.click();
    await expect(this.title).not.toBeVisible();
  }
}

