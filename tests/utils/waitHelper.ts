// tests/utils/waitHelper.ts
import type { Locator, Page } from 'playwright';

export const waitForVisible = async (locator: Locator, timeout = 15000): Promise<Locator> => {
  await locator.waitFor({ state: 'visible', timeout });
  return locator;
};

export const waitForVisibleXPath = async (
  page: Page,
  xpath: string,
  timeout = 15000
): Promise<Locator> => {
  const locator = page.locator(`xpath=${xpath}`);
  return waitForVisible(locator, timeout);
};

export const waitForHidden = async (locator: Locator, timeout = 15000): Promise<void> => {
  await locator.waitFor({ state: 'hidden', timeout });
};

export const waitForDetached = async (locator: Locator, timeout = 15000): Promise<void> => {
  await locator.waitFor({ state: 'detached', timeout });
};

export const waitForPageStable = async (page: Page, timeout = 10000): Promise<void> => {
  await page.waitForLoadState('domcontentloaded', { timeout });
  await page.waitForLoadState('networkidle', { timeout }).catch(() => undefined);
};
