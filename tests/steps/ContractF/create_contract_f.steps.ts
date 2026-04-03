import { Given, Then, When } from '@cucumber/cucumber';
import * as fs from 'fs';
import * as path from 'path';
import { World } from '../../support/world';
import { ContractFPage } from '../../pages/ContractFPage';
import { logger } from '../../utils/logger';
import { waitForPageStable } from '../../utils/waitHelper';

function getContractDataPath(): string {
  return path.join(process.cwd(), 'contract-data.json');
}

function readContractData(): Record<string, unknown> {
  const filePath = getContractDataPath();
  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {};
  }
}

function writeContractData(data: Record<string, unknown>): void {
  const filePath = getContractDataPath();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

async function cancelContractFViaSupportApi(contractFNumber: string): Promise<void> {
  const encodedNumber = encodeURIComponent(contractFNumber);
  const actor = 'Automation-waqas';
  const url = `https://apiqa.dubailand.gov.ae/UnifiedContracts.MobileServer_F/supports/CancelContract/${encodedNumber}/${actor}`;

  logger.info(`🧹 Calling support cancel API for Contract F: ${contractFNumber}`);
  const response = await fetch(url, { method: 'GET', redirect: 'follow' });
  const body = (await response.text().catch(() => '')).trim();

  if (!response.ok) {
    throw new Error(`CancelContract API failed (${response.status} ${response.statusText}) for ${contractFNumber}. Response: ${body.slice(0, 400)}`);
  }

  logger.info(`✅ CancelContract API success for ${contractFNumber}. Response: ${body.slice(0, 250) || '<empty>'}`);
}

Given('I cancel previous approved Contract F via support API if available', async function () {
  const data = readContractData();
  const contractFNumber = String(data.contractFNumber || '').trim();

  if (!contractFNumber || !/^CF/i.test(contractFNumber)) {
    logger.info('ℹ️ No valid previous Contract F number found in contract-data.json to cancel. Skipping API cleanup.');
    return;
  }

  await cancelContractFViaSupportApi(contractFNumber);
});

Given('I cancel approved Contract F number {string} via support API', async function (contractFNumber: string) {
  const normalized = String(contractFNumber || '').trim();
  if (!/^CF/i.test(normalized)) {
    throw new Error(`CancelContract requires a valid Contract F number starting with CF. Got: "${normalized}"`);
  }

  await cancelContractFViaSupportApi(normalized);
});

async function returnToContractsTab(page: World['page']): Promise<void> {
  await page.bringToFront().catch(() => {});
  await waitForPageStable(page, 15000).catch(() => {});

  let clicked = false;
  const contractsByRoleTab = page.getByRole('tab', { name: /contracts/i }).first();
  if (await contractsByRoleTab.isVisible().catch(() => false)) {
    await contractsByRoleTab.click({ force: true });
    clicked = true;
  }

  if (!clicked) {
    const contractsByRoleLink = page.getByRole('link', { name: /contracts/i }).first();
    if (await contractsByRoleLink.isVisible().catch(() => false)) {
      await contractsByRoleLink.click({ force: true });
      clicked = true;
    }
  }

  if (!clicked) {
    const contractsByHref = page.locator('a[href="#/contracts"]').first();
    await contractsByHref.waitFor({ state: 'visible', timeout: 30000 });
    await contractsByHref.click({ force: true });
  }

  const closePopupBtn = page.locator('button.btn.btn-dark.btn-agree').first();
  if (await closePopupBtn.isVisible().catch(() => false)) {
    await closePopupBtn.click({ force: true });
  }

  const loadingOverlay = page.locator('div[style*="position: fixed"][style*="z-index: 100002"]').first();
  await loadingOverlay.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  await waitForPageStable(page, 15000).catch(() => {});
}

When('broker returns to Contracts tab after approval flow for Contract F', { timeout: 120000 }, async function (this: World) {
  const approvalPage = (this as any).approvalPage;
  if (approvalPage) {
    await approvalPage.close().catch(() => {});
    (this as any).approvalPage = undefined;
  }

  await returnToContractsTab(this.page);
  logger.info('📂 Returned to Contracts tab for Contract F flow');
});

Then('broker stores active Contract A number for Contract F use', async function (this: World) {
  const contractANumber = String((this as any).contractNumber || '').trim();
  if (!/^CA/i.test(contractANumber)) {
    throw new Error(`Expected active Contract A number for Contract F flow, but found "${contractANumber}"`);
  }

  (this as any).contractANumber = contractANumber;

  const existingData = readContractData();
  writeContractData({
    ...existingData,
    contractANumber,
    lastUpdatedAt: new Date().toISOString()
  });

  logger.info(`💾 Stored Contract A number for Contract F use: ${contractANumber}`);
});

Then('broker stores active Contract B number for Contract F use', async function (this: World) {
  const contractBNumber = String((this as any).contractBNumber || (this as any).contractNumber || '').trim();
  if (!/^CB/i.test(contractBNumber)) {
    throw new Error(`Expected active Contract B number for Contract F flow, but found "${contractBNumber}"`);
  }

  (this as any).contractBNumber = contractBNumber;

  const existingData = readContractData();
  writeContractData({
    ...existingData,
    contractBNumber,
    lastUpdatedAt: new Date().toISOString()
  });

  logger.info(`💾 Stored Contract B number for Contract F use: ${contractBNumber}`);
});

When(/^broker clicks on Create Unified Sale Contract \(F\)$/, { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.clickCreateUnifiedSaleContractF();
});

When(/^broker selects Contract B for Unified Sale Contract \(F\)$/, { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.selectContractBForUnifiedSaleContractF();
});

When('broker enters the saved Contract B number in Contract F prompt', { timeout: 120000 }, async function (this: World) {
  const savedData = readContractData();
  const contractBNumber = String((this as any).contractBNumber || savedData.contractBNumber || '').trim();

  if (!/^CB/i.test(contractBNumber)) {
    throw new Error(`Saved Contract B number is missing for Contract F prompt. Found: "${contractBNumber}"`);
  }

  const contractFPage = new ContractFPage(this.page);
  await contractFPage.enterContractBNumberInPrompt(contractBNumber);

  (this as any).contractBNumber = contractBNumber;
});

When('broker clicks Proceed in Contract F prompt', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.clickProceedInPrompt();
});

Then('broker should see Contract F creation form', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyContractFCreationFormVisible();
});

When('broker clicks Save and Continue in Contract F form', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.clickSaveAndContinue();
});

Then('broker should see Owner 1 on Contract F owner details page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyOwner1Heading();
});

Then('broker captures owner name on Contract F owner details page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  const ownerName = await contractFPage.captureOwnerNameFromOwnerDetails();
  (this as any).contractFOwnerName = ownerName;
});

Then('broker should see Buyer 1 on Contract F buyer details page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyBuyer1Heading();
});

Then("broker should see Buyer's Share on Contract F page", { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyBuyersShareHeading();
});

Then('broker should see Tenancy Information on Contract F page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyTenancyInformationHeading();
});

Then('broker should see Financial Information on Contract F page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyFinancialInformationHeading();
});

When('broker enters sell price 780000 on Contract F financial page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.enterSellPrice('780000');
  (this as any).contractFSellPrice = '780000';
});

When('broker enters deposit amount 78000 on Contract F financial page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.enterDepositAmount('78000');
  (this as any).contractFDepositAmount = '78000';
});

When('broker selects saved owner name in Cheque Deposit Holder on Contract F financial page', { timeout: 120000 }, async function (this: World) {
  const ownerName = String((this as any).contractFOwnerName || '').trim();
  if (!ownerName) {
    throw new Error('No saved owner name found for Contract F Cheque Deposit Holder selection');
  }

  const contractFPage = new ContractFPage(this.page);
  await contractFPage.selectChequeDepositHolderByOwnerName(ownerName);
});

When('broker selects Confiscation of security deposit as Yes on Contract F financial page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.selectConfiscationOfSecurityDepositYes();
});

When('broker selects Yes for mortgage on Contract F financial page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.selectMortgageYes();
});

Then('broker should see Payment Plan on Contract F page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyPaymentPlanHeading();
});

When('broker selects Remaining amount will be paid on transaction date as Yes on Contract F payment plan page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.selectRemainingAmountPaidOnTransactionDateYes();
});

When('broker enters random cheque number on Contract F payment plan page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  const chequeNumber = await contractFPage.enterRandomChequeNumber();
  (this as any).contractFChequeNumber = chequeNumber;
});

When('broker selects cheque date 10 days from today on Contract F payment plan page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  const chequeDate = await contractFPage.selectChequeDateDaysFromToday(10);
  (this as any).contractFChequeDate = chequeDate;
});

When('broker selects Abudhabi Islamic Bank as bank name on Contract F payment plan page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.selectBankNameAbuDhabiIslamicBank();
});

Then('broker should see Contract Information on Contract F page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyContractInformationHeading();
});

When('broker selects Contract Start date 5 days from today on Contract F Contract Information page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  const startDateText = await contractFPage.selectContractInformationStartDateDaysFromToday(5);
  (this as any).contractFContractInfoStartDate = startDateText;
});

When('broker selects Contract End Date 2 months from Start Date on Contract F Contract Information page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  const startDateRaw = String((this as any).contractFContractInfoStartDate || '').trim();
  if (!startDateRaw) {
    throw new Error('Contract F Contract Information start date is missing before selecting end date');
  }

  const [day, month, year] = startDateRaw.split('/').map((value) => Number(value));
  const startDate = new Date(year, month - 1, day);
  const endDateText = await contractFPage.selectContractInformationEndDateTwoMonthsFromStart(startDate);
  (this as any).contractFContractInfoEndDate = endDateText;
});

Then('broker should see Seller Broker and Buyer Broker commission page on Contract F', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifySellerBrokerCommissionHeading();
});

Then('broker should see DLD Registration Fees page on Contract F', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyDldRegistrationFeesHeading();
});

Then('broker should see Notes page on Contract F', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyNotesHeading();
});

Then('broker should see Additional Terms and Conditions page on Contract F', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyAdditionalTermsAndConditionsHeading();
});

Then('broker should see Contract F preview page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyContractFPreviewPage();
});

Then('broker should see entered sell price deposit and contract end date on Contract F preview page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);

  const sellPrice = String((this as any).contractFSellPrice || '').trim();
  const depositAmount = String((this as any).contractFDepositAmount || '').trim();
  const contractEndDate = String((this as any).contractFContractInfoEndDate || '').trim();

  if (!sellPrice) {
    throw new Error('Contract F sell price is missing before preview validation');
  }

  if (!depositAmount) {
    throw new Error('Contract F deposit amount is missing before preview validation');
  }

  if (!contractEndDate) {
    throw new Error('Contract F contract end date is missing before preview validation');
  }

  await contractFPage.verifyPreviewSellPrice(sellPrice);
  await contractFPage.verifyPreviewDepositAmount(depositAmount);
  await contractFPage.verifyPreviewContractEndDate(contractEndDate);
});

When('broker accepts the terms and conditions on Contract F preview page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.acceptPreviewTermsAndConditions();
});

When('broker clicks Submit Contract for Approval on Contract F preview page', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.clickSubmitContractForApproval();
});

Then('broker should see Contract F submitted successfully message', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyContractFSubmissionSuccessMessage();
});

Then('broker stores active Contract F number for reuse', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.verifyContractFSubmissionSuccessMessage();
  const contractFNumber = await contractFPage.getSubmittedContractFNumber();

  (this as any).contractFNumber = contractFNumber;
  (this as any).contractNumber = contractFNumber;

  const existingData = readContractData();
  writeContractData({
    ...existingData,
    contractFNumber,
    contractNumber: contractFNumber,
    lastUpdatedAt: new Date().toISOString()
  });

  logger.info(`💾 Stored Contract F number for reuse: ${contractFNumber}`);
});

When('broker clicks Add button on Additional Terms and Conditions page on Contract F', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.clickAddButtonOnAdditionalTermsAndConditions();
});

When('broker enters random meaningful English text on Additional Terms and Conditions page on Contract F', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  const englishText = await contractFPage.enterRandomEnglishAdditionalTermsText();
  (this as any).contractFAdditionalTermsEnglishText = englishText;
});

When('broker enters random meaningful Arabic text on Additional Terms and Conditions page on Contract F', { timeout: 120000 }, async function (this: World) {
  const contractFPage = new ContractFPage(this.page);
  const arabicText = await contractFPage.enterRandomArabicAdditionalTermsText();
  (this as any).contractFAdditionalTermsArabicText = arabicText;
});

When('broker sets Seller Broker commission slider to {int}% on Contract F', { timeout: 120000 }, async function (this: World, percentage: number) {
  const contractFPage = new ContractFPage(this.page);
  await contractFPage.setSellerBrokerCommissionPercentage(percentage);
});

Then('broker pauses on Contract F final flow for observation', { timeout: 120000 }, async function (this: World) {
  logger.info('⏸️ Pausing on Contract F final flow for 30 seconds');
  await this.page.waitForTimeout(30000);
});

When('broker enters the saved Contract A number for Contract F', async function (this: World) {
  const savedData = readContractData();
  const contractANumber = String((this as any).contractANumber || savedData.contractANumber || '').trim();

  if (!/^CA/i.test(contractANumber)) {
    throw new Error(`Saved Contract A number is missing for Contract F flow. Found: "${contractANumber}"`);
  }

  const contractInput = this.page
    .locator('xpath=//label[normalize-space()="Contract number"]/ancestor::div[contains(@class,"form-group")]//input[1]')
    .first();

  const loadingOverlay = this.page.locator('div[style*="position: fixed"][style*="z-index: 100002"]').first();
  await loadingOverlay.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  await waitForPageStable(this.page, 20000).catch(() => {});

  await contractInput.waitFor({ state: 'visible', timeout: 20000 });
  await contractInput.fill(contractANumber);
  (this as any).contractANumber = contractANumber;
  (this as any).contractNumber = contractANumber;

  logger.info(`🔎 Entered saved Contract A number for Contract F: ${contractANumber}`);
});

When('broker enters the saved Contract B number for Contract F', async function (this: World) {
  const savedData = readContractData();
  const contractBNumber = String((this as any).contractBNumber || savedData.contractBNumber || '').trim();

  if (!/^CB/i.test(contractBNumber)) {
    throw new Error(`Saved Contract B number is missing for Contract F flow. Found: "${contractBNumber}"`);
  }

  const contractInput = this.page
    .locator('xpath=//label[normalize-space()="Contract number"]/ancestor::div[contains(@class,"form-group")]//input[1]')
    .first();

  const loadingOverlay = this.page.locator('div[style*="position: fixed"][style*="z-index: 100002"]').first();
  await loadingOverlay.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  await waitForPageStable(this.page, 20000).catch(() => {});

  await contractInput.waitFor({ state: 'visible', timeout: 20000 });
  await contractInput.fill(contractBNumber);
  (this as any).contractBNumber = contractBNumber;
  (this as any).contractNumber = contractBNumber;

  logger.info(`🔎 Entered saved Contract B number for Contract F: ${contractBNumber}`);
});
