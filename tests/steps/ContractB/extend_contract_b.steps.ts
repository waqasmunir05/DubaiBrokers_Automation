import { Then, When } from '@cucumber/cucumber';
import * as fs from 'fs';
import * as path from 'path';
import { World } from '../../support/world';
import { logger } from '../../utils/logger';
import { waitForPageStable } from '../../utils/waitHelper';

/**
 * Contract B Extension Step Definitions
 */

When('broker clicks on contract to view details in contract B', async function (this: World) {
  logger.info('📋 Opening Contract B details page');

  const detailsButton = this.page
    .locator('button:has-text("Details"), a:has-text("Details"), [role="button"]:has-text("Details")')
    .first();

  if (await detailsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await detailsButton.click();
    logger.info('✅ Clicked Details button to view Contract B');
  } else {
    logger.info('ℹ️ Details already loaded or button not visible');
  }

  await waitForPageStable(this.page, 5000).catch(() => {});
});

When('broker clicks on extend action icon in contract B', async function (this: World) {
  logger.info('⏳ Waiting for extend button to appear');

  const extendButton = this.page.locator('xpath=//*[@id="extend_contract"]');
  await extendButton.waitFor({ state: 'visible', timeout: 30000 });
  await extendButton.scrollIntoViewIfNeeded().catch(() => {});
  await extendButton.click({ force: true });
  await waitForPageStable(this.page, 5000).catch(() => {});

  logger.info('✅ Extend button clicked');
  await this.page.waitForLoadState('networkidle').catch(() => {});
  await this.page.waitForTimeout(2000);
});

When('broker selects new Contract B End date {int} months from today', async function (this: World, months: number) {
  logger.info(`📅 Selecting new contract B end date for extension (${months} months from today)`);

  logger.info('⏳ Waiting for extend modal/form to be ready');
  await this.page.waitForLoadState('domcontentloaded').catch(() => {});

  const candidateSelectors = [
    'xpath=/html/body/div[1]/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[2]/div/div/div[1]/div/div[2]/div/div/div/div/div/input',
    'input[placeholder="DD/MM/YYYY"][type="text"]:visible',
    'xpath=//input[@placeholder="DD/MM/YYYY" and @type="text"]',
    'input[placeholder="DD/MM/YYYY"]:visible',
    'input[type="text"].form-control.flex-one:visible',
    'input[type="text"]:visible'
  ];

  let dateInput = this.page.locator(candidateSelectors[0]).first();
  let found = false;

  for (const selector of candidateSelectors) {
    const candidate = this.page.locator(selector).first();
    const visible = await candidate.isVisible({ timeout: 3000 }).catch(() => false);
    if (visible) {
      dateInput = candidate;
      found = true;
      logger.info(`✅ Found extension date input using selector: ${selector}`);
      break;
    }
  }

  if (!found) {
    await dateInput.waitFor({ state: 'visible', timeout: 15000 });
  }

  const today = new Date();
  const extendedDate = new Date(today);
  extendedDate.setMonth(today.getMonth() + months);

  const day = String(extendedDate.getDate()).padStart(2, '0');
  const month = String(extendedDate.getMonth() + 1).padStart(2, '0');
  const year = extendedDate.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  logger.info(`📅 Calculated extended date: ${formattedDate}`);

  await dateInput.clear().catch(() => {});
  await dateInput.fill(formattedDate);
  await this.page.keyboard.press('Enter').catch(() => {});

  logger.info(`✅ Extended contract B end date set to ${formattedDate}`);

  (this as any).extendedEndDate = formattedDate;
});

When('broker clicks on Continue button for Contract B extension', async function (this: World) {
  logger.info('📤 Clicking on Continue button for Contract B extension');

  const continueButton = this.page.locator('//*[@id="continue"]');

  await continueButton.waitFor({ state: 'visible', timeout: 10000 });
  await continueButton.click();
  await waitForPageStable(this.page, 5000).catch(() => {});

  logger.info('✅ Continue button clicked - Waiting for success message...');
});

Then('broker should see Contract B extension request success message', async function (this: World) {
  logger.info('🔍 Verifying Contract B extension success message');

  const successMessageContainer = this.page.getByText(/your contract has been submitted successfully/i).first();
  const contractNumberLink = this.page.locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div/div/h4/b/a').first();

  await successMessageContainer.waitFor({ state: 'visible', timeout: 30000 });

  const messageText = ((await successMessageContainer.textContent()) || '').trim();

  if (!messageText.includes('Your contract has been submitted successfully')) {
    throw new Error(`Expected success message containing "Your contract has been submitted successfully" but got: "${messageText}"`);
  }

  await contractNumberLink.waitFor({ state: 'visible', timeout: 15000 });
  const contractNumberText = ((await contractNumberLink.textContent()) || '').trim();

  if (!/^CB/i.test(contractNumberText)) {
    throw new Error(`Expected Contract B number starting with "CB", but got "${contractNumberText}"`);
  }

  (this as any).contractBNumber = contractNumberText;
  (this as any).contractNumber = contractNumberText;

  const contractDataFilePath = path.join(process.cwd(), 'contract-data.json');
  let contractData: Record<string, unknown> = {};

  if (fs.existsSync(contractDataFilePath)) {
    try {
      contractData = JSON.parse(fs.readFileSync(contractDataFilePath, 'utf-8'));
    } catch {
      contractData = {};
    }
  }

  const updatedContractData = {
    ...contractData,
    contractBNumber: contractNumberText,
    contractNumber: contractNumberText,
    lastUpdatedAt: new Date().toISOString()
  };

  fs.writeFileSync(contractDataFilePath, JSON.stringify(updatedContractData, null, 2));

  logger.info(`✅ Success message contains expected text: Your contract has been submitted successfully`);
  logger.info(`🔢 Contract B number captured: ${contractNumberText}`);
  logger.info(`📄 Contract data saved to: ${contractDataFilePath}`);
});
