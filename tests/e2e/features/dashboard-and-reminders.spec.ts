import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { DashboardModalPage } from '../pages/DashboardModalPage';

test.describe('Dashboard and Reminders Flow', () => {
  let homePage: HomePage;
  let dashboardModal: DashboardModalPage;

  test.beforeEach(async ({ page }) => {
    homePage = new HomePage(page);
    dashboardModal = new DashboardModalPage(page);
    await homePage.goto();
  });

  test('should display Statement Reminders section on homepage', async ({ page }) => {
    const remindersHeading = page.locator('text=Statement Reminders');
    await expect(remindersHeading).toBeVisible();
  });

  test('should open and close My Savings dashboard', async () => {
    await homePage.openDashboard();
    await dashboardModal.waitForOpen();

    await expect(dashboardModal.title).toBeVisible();
    await dashboardModal.close();
  });
});
