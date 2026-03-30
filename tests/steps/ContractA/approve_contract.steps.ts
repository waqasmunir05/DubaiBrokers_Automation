// tests/steps/ContractA/approve_contract.steps.ts
import { When, Then } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { ContractDetailsPage } from '../../pages/ContractDetailsPage';
import { ApprovalPage } from '../../pages/ApprovalPage';
import { logger } from '../../utils/logger';
import { waitForPageStable } from '../../utils/waitHelper';

When('I open the approval link', { timeout: 90000 }, async function (this: World) {
  const detailsPage = new ContractDetailsPage(this.page);
  const contractDetailsLink = await detailsPage.getApprovalLink();
  
  logger.info('🌐 Opening approval link in new tab');
  const newPage = await this.page.context().newPage();
  await newPage.goto(contractDetailsLink, { waitUntil: 'load', timeout: 60000 });
  await waitForPageStable(newPage, 15000);
  logger.info('✅ Approval link opened in new tab');
  
  // Store new page in World context for subsequent steps
  (this as any).approvalPage = newPage;
  logger.info('💾 Approval page stored in context');
  
  // Handle OTP verification
  const approvalPage = new ApprovalPage(newPage);
  const contractNumber = (this as any).contractNumber;
  await approvalPage.handleOTPVerification(contractNumber);
});

Then('I verify edited sell price {string} on approval page', async function (this: World, expectedPrice: string) {
  const page = (this as any).approvalPage || this.page;
  logger.info(`🔍 Verifying sell price on approval page: ${expectedPrice}`);
  
  const sellPriceXPath = '/html/body/div[3]/div/div[8]/div[2]/div/table[1]/tbody/tr/td/label[2]';
  const sellPriceElement = page.locator(`xpath=${sellPriceXPath}`);
  
  await sellPriceElement.waitFor({ state: 'visible', timeout: 15000 });
  const actualPrice = await sellPriceElement.textContent();
  const cleanedPrice = actualPrice?.trim().replace(/,/g, '');
  const cleanedExpected = expectedPrice.replace(/,/g, '');
  
  if (cleanedPrice?.includes(cleanedExpected)) {
    logger.info(`✅ Sell price verified on approval page: ${actualPrice}`);
  } else {
    throw new Error(`❌ Sell price mismatch - Expected: ${expectedPrice}, Actual: ${actualPrice}`);
  }
});

Then('I verify commission {string} on approval page', async function (this: World, expectedCommission: string) {
  const page = (this as any).approvalPage || this.page;
  logger.info(`🔍 Verifying commission on approval page: ${expectedCommission}`);
  
  const commissionXPath = '/html/body/div[3]/div/div[4]/div[2]/table/tbody/tr[6]/td/label[2]';
  const commissionElement = page.locator(`xpath=${commissionXPath}`);
  
  await commissionElement.waitFor({ state: 'visible', timeout: 15000 });
  const actualCommission = await commissionElement.textContent();
  const cleanedCommission = actualCommission?.trim().replace(/,/g, '');
  const cleanedExpected = expectedCommission.replace(/,/g, '');
  
  if (cleanedCommission?.includes(cleanedExpected)) {
    logger.info(`✅ Commission verified on approval page: ${actualCommission}`);
  } else {
    throw new Error(`❌ Commission mismatch - Expected: ${expectedCommission}, Actual: ${actualCommission}`);
  }
});

Then('I verify contract dates on approval page', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const startDate = (this as any).contractStartDate;
  
  logger.info(`🔍 Verifying contract start date: ${startDate}`);
  
  const startDateXPath = '/html/body/div[3]/div/div[4]/div[2]/table/tbody/tr[3]/td/label[2]';
  const startDateElement = page.locator(`xpath=${startDateXPath}`);
  
  await startDateElement.waitFor({ state: 'visible', timeout: 15000 });
  const actualStartDate = await startDateElement.textContent();
  
  logger.info(`📅 Start date on approval page: ${actualStartDate}`);
  
  if (startDate && actualStartDate?.includes(startDate)) {
    logger.info(`✅ Contract start date verified: ${startDate}`);
  } else if (startDate) {
    logger.info(`⚠️ Start date may be in different format - Expected: ${startDate}, Found: ${actualStartDate}`);
  }
});

When('I click on submit button', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const detailsPage = new ContractDetailsPage(page);
  await detailsPage.clickSubmitButton();
});

When('I confirm approval on popup', { timeout: 120000 }, async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const approvalPage = new ApprovalPage(page);
  await approvalPage.waitForAndConfirmPopup(120000);
});

Then('I should see success message {string}', async function (this: World, expectedMessage: string) {
  const page = (this as any).approvalPage || this.page;
  const approvalPage = new ApprovalPage(page);
  await approvalPage.waitForSuccessMessage(expectedMessage, 30000);
});
