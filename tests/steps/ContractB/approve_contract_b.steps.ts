import { Then, When } from '@cucumber/cucumber';
import * as fs from 'fs';
import * as path from 'path';
import { World } from '../../support/world';
import { logger } from '../../utils/logger';
import { waitForPageStable } from '../../utils/waitHelper';
import { ContractDetailsPage } from '../../pages/ContractDetailsPage';
import { ApprovalPage } from '../../pages/ApprovalPage';

When('broker enters the created Contract B number', async function (this: World) {
  const contractFilePath = path.join(process.cwd(), 'contract-data.json');

  if (!fs.existsSync(contractFilePath)) {
    throw new Error(`contract-data.json not found at ${contractFilePath}. Run Contract B create flow first.`);
  }

  let contractNumber = '';
  try {
    const fileData = fs.readFileSync(contractFilePath, 'utf-8');
    const data = JSON.parse(fileData);
    contractNumber = (data.contractBNumber || data.contractNumber || '').trim();
  } catch (error) {
    throw new Error(`Unable to read latest Contract B number from contract-data.json: ${error}`);
  }

  if (!/^CB/i.test(contractNumber)) {
    throw new Error(`Latest Contract B number is missing or invalid in contract-data.json. Found: "${contractNumber}"`);
  }

  logger.info(`📂 Contract B number loaded from file: ${contractNumber}`);

  const contractInput = this.page
    .locator('xpath=//label[normalize-space()="Contract number"]/ancestor::div[contains(@class,"form-group")]//input[1]')
    .first();
  await contractInput.waitFor({ state: 'visible', timeout: 15000 });
  await contractInput.fill(contractNumber);

  (this as any).contractNumber = contractNumber;
  logger.info(`🔎 Entered Contract B number for search: ${contractNumber}`);
});

When('broker clicks on Search button to find contract B', async function (this: World) {
  const contractNumber = (this as any).contractNumber;
  const contractTypeDropdown = this.page.locator('#react-select-2-input').first();
  const contractInput = this.page
    .locator('xpath=//label[normalize-space()="Contract number"]/ancestor::div[contains(@class,"form-group")]//input[1]')
    .first();

  if (await contractTypeDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
    await contractTypeDropdown.click({ force: true }).catch(() => {});
    await contractTypeDropdown.fill('Contract B').catch(() => {});
    await contractTypeDropdown.press('Enter').catch(() => {});
    logger.info('📑 Selected Contract Type filter: Contract B');
  }

  await contractInput.waitFor({ state: 'visible', timeout: 10000 });
  await contractInput.fill(contractNumber);
  logger.info(`🔁 Re-entered Contract B number after filter selection: ${contractNumber}`);

  const searchButton = this.page.getByRole('button', { name: /search/i }).first();
  await searchButton.waitFor({ state: 'visible', timeout: 15000 });
  await searchButton.click({ force: true });
  await waitForPageStable(this.page);
  logger.info('🔍 Clicked Search for Contract B');
});

When('broker clicks on searched Contract B result', { timeout: 90000 }, async function (this: World) {
  const contractNumber = (this as any).contractNumber;
  const resultRowByNumber = this.page.locator(`table tbody tr:has-text("${contractNumber}")`).first();
  const resultCellByNumber = resultRowByNumber.locator('td').first();
  const firstResultCell = this.page.locator('table tbody tr td').first();

  const searchDeadline = Date.now() + 90000;
  let clicked = false;

  while (Date.now() < searchDeadline && !clicked) {
    if (await resultCellByNumber.isVisible().catch(() => false)) {
      await resultCellByNumber.click({ force: true });
      clicked = true;
      logger.info(`✅ Opened searched Contract B result for: ${contractNumber}`);
      break;
    }

    if (await firstResultCell.isVisible().catch(() => false)) {
      const rowText = ((await firstResultCell.locator('xpath=ancestor::tr').textContent().catch(() => '')) || '').trim();
      logger.info(`ℹ️ Falling back to first visible Contract B result row: ${rowText}`);
      await firstResultCell.click({ force: true });
      clicked = true;
      logger.info('✅ Opened first visible searched Contract B result');
      break;
    }

    await this.page.waitForTimeout(2000);
    await waitForPageStable(this.page, 5000).catch(() => {});
  }

  if (!clicked) {
    throw new Error(`Contract B search result did not appear for contract number: ${contractNumber}`);
  }

  await waitForPageStable(this.page);
});

When('broker opens Contract B approval link', { timeout: 90000 }, async function (this: World) {
  const detailsPage = new ContractDetailsPage(this.page);
  const approvalUrl = await detailsPage.getApprovalLink(
    '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[2]/div[2]/div[1]/div/div[1]/div[2]/div/div[1]'
  );

  logger.info('🌐 Opening Contract B approval link in new tab');
  const approvalTab = await this.page.context().newPage();
  await approvalTab.goto(approvalUrl, { waitUntil: 'load', timeout: 60000 });
  await waitForPageStable(approvalTab, 15000).catch(() => {});

  logger.info('✅ Contract B approval link opened in new tab');
  (this as any).approvalPage = approvalTab;

  const approvalPage = new ApprovalPage(approvalTab);
  const contractNumber = (this as any).contractNumber;
  await approvalPage.handleOTPVerification(contractNumber);

  logger.info('✅ Contract B approval page opened and OTP verified');
});

When('broker accepts terms and conditions on Contract B approval page', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const detailsPage = new ContractDetailsPage(page);
  await detailsPage.clickTermsCheckbox();
  logger.info('☑️ Accepted terms on Contract B approval page');
});

When('broker submits Contract B approval', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const detailsPage = new ContractDetailsPage(page);
  await detailsPage.clickSubmitButton();
  logger.info('📨 Submitted Contract B approval');
});

When('broker confirms approval on popup for Contract B', { timeout: 120000 }, async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const approvalPage = new ApprovalPage(page);
  await approvalPage.waitForAndConfirmPopup(120000);
  logger.info('✅ Confirmed Contract B approval popup');
});

Then('broker should see Contract B approval success message {string}', async function (this: World, expectedMessage: string) {
  const page = (this as any).approvalPage || this.page;
  const successHeading = page.locator('xpath=/html/body/div[3]/div/div/div/h4').first();

  await successHeading.waitFor({ state: 'visible', timeout: 30000 });

  const firstTextNode = await successHeading.evaluate((element: HTMLElement) => {
    const firstText = Array.from(element.childNodes).find(
      (node): node is Text => node.nodeType === Node.TEXT_NODE
    );
    return firstText?.textContent?.trim() || '';
  });

  if (!firstTextNode.includes(expectedMessage)) {
    throw new Error(
      `Contract B approval success message mismatch. Expected to contain "${expectedMessage}", actual first text node was "${firstTextNode}"`
    );
  }

  logger.info(`✅ Contract B approval success verified: ${firstTextNode}`);
});
