import { type Page, expect } from '@playwright/test';

export const navigateToTab = async (page: Page, tabName: string): Promise<void> => {
  const tab = page.getByRole('link', { name: tabName });
  await tab.click();
};

export const expectPageTitle = async (page: Page, title: string): Promise<void> => {
  await expect(page).toHaveTitle(title);
};
