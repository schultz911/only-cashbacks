import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { LoungeModalPage } from '../pages/LoungeModalPage';

test.describe('Lounge Tracker Flow', () => {
  let homePage: HomePage;
  let loungeModal: LoungeModalPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    loungeModal = new LoungeModalPage(page);
    await homePage.goto();
  });

  test('should open Lounge Tracker and display lounge access benefits', async ({ page }) => {
    await homePage.openLoungeTracker();
    await loungeModal.waitForOpen();

    await expect(loungeModal.title).toBeVisible();
    await expect(page.locator('text=Domestic Lounges').first()).toBeVisible();

    await loungeModal.close();
  });
});

