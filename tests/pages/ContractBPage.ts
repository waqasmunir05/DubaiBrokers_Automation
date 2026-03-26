// tests/pages/ContractBPage.ts
import { Page } from 'playwright';
import { logger } from '../utils/logger';
import { waitForPageStable } from '../utils/waitHelper';

export class ContractBPage {
  constructor(private page: Page) {}

  async selectPropertyType(propertyType: string): Promise<void> {
    logger.info(`🏠 Selecting property type: ${propertyType}`);

    const propertyTypeLookupXPath = '//*[@id="wizard"]/div[1]/div/div[2]/div/div[1]/div/div[2]/div/div/div/div/div[1]';
    const propertyTypeLookup = this.page.locator(`xpath=${propertyTypeLookupXPath}`);

    await propertyTypeLookup.waitFor({ state: 'visible', timeout: 20000 });
    await propertyTypeLookup.click();

    const option = this.page.getByText(propertyType, { exact: true }).first();
    await option.waitFor({ state: 'visible', timeout: 10000 });
    await option.click();

    logger.info(`✅ Property type selected: ${propertyType}`);
  }

  async selectRentalStatus(rentalStatus: string): Promise<void> {
    logger.info(`📑 Selecting rental status: ${rentalStatus}`);

    const rentalStatusXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[3]/div/div[2]/div/div/div/div/div[1]';
    const rentalStatusDropdown = this.page.locator(`xpath=${rentalStatusXPath}`);

    await rentalStatusDropdown.waitFor({ state: 'visible', timeout: 15000 });
    await rentalStatusDropdown.click();
    await this.page.waitForTimeout(1000);

    // Type to filter the lookup results
    await this.page.keyboard.type(rentalStatus);
    await this.page.waitForTimeout(1500);

    // Try multiple selectors for lookup result items
    const selectors = [
      `li:has-text("${rentalStatus}")`,
      `[role="option"]:has-text("${rentalStatus}")`,
      `[role="listitem"]:has-text("${rentalStatus}")`,
      `ul li:has-text("${rentalStatus}")`,
      `div[class*="option"]:has-text("${rentalStatus}")`,
      `div[class*="item"]:has-text("${rentalStatus}")`,
    ];

    let selected = false;
    for (const sel of selectors) {
      const el = this.page.locator(sel).first();
      if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
        await el.click();
        selected = true;
        logger.info(`✅ Rental status selected via "${sel}": ${rentalStatus}`);
        break;
      }
    }

    if (!selected) {
      await this.page.keyboard.press('Enter');
      logger.info(`⚠️ Fell back to Enter key for Rental Status: ${rentalStatus}`);
    }

    logger.info(`✅ Rental status selection complete: ${rentalStatus}`);
  }

  async selectPropertyUsage(usage: string): Promise<void> {
    logger.info(`📑 Selecting property usage: ${usage}`);

    const propertyUsageDropdown = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[2]/div/div[2]/div/div/div/div/div[1]')
      .first();

    await propertyUsageDropdown.waitFor({ state: 'visible', timeout: 15000 });
    await propertyUsageDropdown.click();

    const option = this.page.locator('[role="option"]', { hasText: usage }).first();
    if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
      await option.click();
    } else {
      await this.page.keyboard.type(usage);
      await this.page.keyboard.press('Enter');
    }

    logger.info(`✅ Property usage selected: ${usage}`);
  }

  async selectIsFreeholdQuestion(answer: string): Promise<void> {
    logger.info(`🏠 Selecting Is Freehold: ${answer}`);

    const radioXPath = answer === 'Yes'
      ? '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[4]/div/div[2]/div/div/label[1]/input'
      : '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[4]/div/div[2]/div/div/label[2]/input';

    const radioButton = this.page.locator(`xpath=${radioXPath}`).first();
    await radioButton.waitFor({ state: 'visible', timeout: 15000 });
    await radioButton.check({ force: true });

    logger.info(`✅ Is Freehold selected: ${answer}`);
  }

  async enterPropertyField(fieldName: string, value: string): Promise<void> {
    logger.info(`📝 Entering ${fieldName}: ${value}`);

    // Field XPaths for Property Information
    const fieldXPaths: Record<string, string> = {
      'Number of Rooms': '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[5]/div/div[2]/div/div/div/input',
      'Area/Community': '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[6]/div/div[2]/div/div/textarea',
    };

    const xPath = fieldXPaths[fieldName];
    if (!xPath) {
      throw new Error(`Unknown property field: ${fieldName}`);
    }

    const input = this.page.locator(`xpath=${xPath}`).first();
    await input.waitFor({ state: 'visible', timeout: 15000 });
    await input.fill(value);

    logger.info(`✅ ${fieldName} entered: ${value}`);
  }
}
