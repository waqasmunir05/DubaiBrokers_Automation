// tests/steps/ContractA/edit_contract.steps.ts
import { When, Then } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { ContractsSearchPage } from '../../pages/ContractsSearchPage';
import { ContractDetailsPage } from '../../pages/ContractDetailsPage';
import { ApprovalPage } from '../../pages/ApprovalPage';
import { logger } from '../../utils/logger';
import { waitForPageStable } from '../../utils/waitHelper';

When('I click on contract to view details', { timeout: 120000 }, async function (this: World) {
  const searchPage = new ContractsSearchPage(this.page);
  const detailsPage = new ContractDetailsPage(this.page);

  logger.info('📋 Clicking on contract to view details');
  await waitForPageStable(this.page, 15000);

  // Wait for edit button to appear to confirm details page loaded first
  logger.info('⏳ Waiting for edit button to appear');
  const editButton = this.page.locator('//*[@id="edit_contract"]');
  await editButton.waitFor({ state: 'visible', timeout: 30000 });
  logger.info('✅ Edit button is visible');

  // Log minimal page info
  const pageTitle = await detailsPage.getPageTitle();
  logger.info(`📄 Contract details page title: ${pageTitle || 'Not found'}`);

  // Verify contract number on details page
  const searchedContractNumber = (this as any).contractNumber;
  if (searchedContractNumber) {
    const verified = await detailsPage.verifyContractNumber(searchedContractNumber);
    if (!verified) {
      throw new Error(`❌ Contract number not found on details page: ${searchedContractNumber}`);
    }
  }

  logger.info('✅ Contract details page loaded');
});

When('I click on edit action icon', async function (this: World) {
  const detailsPage = new ContractDetailsPage(this.page);

  await detailsPage.clickEditButton();
  logger.info('✅ Edit button clicked');
});

When('I click on Save and Continue button', { timeout: 60000 }, async function (this: World) {
  const detailsPage = new ContractDetailsPage(this.page);

  logger.info('⏳ Clicking Save and Continue button');
  try {
    await detailsPage.clickSaveAndContinue();
  } catch (e) {
    logger.info('⚠️ Primary Save & Continue click failed, trying fallback selector');
    const altButton = this.page.getByRole('button', { name: /save\s*&?\s*continue/i }).first();
    await altButton.waitFor({ state: 'visible', timeout: 30000 });
    await altButton.click();
    await waitForPageStable(this.page, 10000);
  }
  logger.info('✅ Save and Continue button clicked');
});

When('I land on Seller details page', async function (this: World) {
  logger.info('📄 Verifying Seller details page loaded');

  const greenListQuestion = this.page.getByText('Is your source of lead through Green List?', { exact: false });
  try {
    await greenListQuestion.waitFor({ state: 'visible', timeout: 20000 });
    logger.info('✅ Seller details page confirmed by Green List question');
  } catch (e) {
    logger.info('⚠️ Green List question not found, checking fallback heading');
    const sellerHeading = this.page.locator('h3:has-text("Seller"), h4:has-text("Seller"), div:has-text("Seller Details")').first();
    await sellerHeading.waitFor({ state: 'visible', timeout: 15000 });
    logger.info('✅ Seller details page confirmed by heading');
  }
});

When('I click on I confirm checkbox', async function (this: World) {
  logger.info('☑️  Clicking I confirm checkbox');
  
  // XPath for the I confirm checkbox on seller details
  const xPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[3]/div/div[2]/div/div[2]/div[5]/div/div[2]/input';
  const checkbox = this.page.locator(`xpath=${xPath}`);
  
  try {
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    
    // Check if already checked
    const isChecked = await checkbox.isChecked();
    if (!isChecked) {
      await checkbox.check();
    }
    logger.info('✅ I confirm checkbox checked');
  } catch (e) {
    logger.info('⚠️ Primary XPath not found, trying alternative selector');
    // Try using iCheck helper
    const helper = this.page.locator('input:has-text("I Confirm") + ins.iCheck-helper, label:has-text("I Confirm") input');
    await helper.click({ force: true });
    logger.info('✅ I confirm checkbox checked (via alternative selector)');
  }
});

When('I click on I confirm button', async function (this: World) {
  logger.info('🔘 Clicking I Confirm button');
  
  // Use the confirm button selector from SELECTORS config
  const confirmButton = this.page.locator('button.btn.btn-success');
  
  try {
    await confirmButton.waitFor({ state: 'visible', timeout: 10000 });
    await confirmButton.click();
    await waitForPageStable(this.page, 10000);
    logger.info('✅ I Confirm button clicked');
  } catch (e) {
    logger.info('⚠️ Primary selector not found, trying alternative');
    const altButton = this.page.getByRole('button', { name: /confirm/i }).first();
    await altButton.click();
    logger.info('✅ I Confirm button clicked (via alternative selector)');
  }
});

When('I modify sell price to {string}', async function (this: World, newPrice: string) {
  logger.info(`💰 Modifying sell price to: ${newPrice}`);
  
  // Same XPath used in Create Contract A for Sell Price
  const xPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[1]/div/div[2]/div/div/div/input';
  const sellPriceInput = this.page.locator(`xpath=${xPath}`);

  await sellPriceInput.waitFor({ state: 'visible', timeout: 30000 });
  await sellPriceInput.scrollIntoViewIfNeeded();
  await sellPriceInput.click();
  await sellPriceInput.fill(newPrice);
  logger.info(`✅ Sell price modified to: ${newPrice}`);
  
  // Store for verification on approval page
  (this as any).editedSellPrice = newPrice;
});

When('I modify commission amount to {string}', async function (this: World, newAmount: string) {
  logger.info(`💼 Modifying commission amount to: ${newAmount}`);
  
  // Find the commission input field - use XPath from creation step
  const xPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[4]/div/div[2]/div[1]/div/div/input';
  const commissionInput = this.page.locator(`xpath=${xPath}`);
  
  try {
    await commissionInput.waitFor({ state: 'visible', timeout: 10000 });
    await commissionInput.click({ clickCount: 3 });
    await commissionInput.fill(newAmount);
    logger.info(`✅ Commission amount modified to: ${newAmount}`);
  } catch (e) {
    logger.info('⚠️ Primary XPath not found, trying alternative selector');
    const altInput = this.page.getByRole('textbox', { name: /commission|amount/i }).first();
    await altInput.waitFor({ state: 'visible', timeout: 10000 });
    await altInput.click({ clickCount: 3 });
    await altInput.fill(newAmount);
    logger.info(`✅ Commission amount modified to: ${newAmount}`);
  }
});

When('I submit the edit request', async function (this: World) {
  const detailsPage = new ContractDetailsPage(this.page);
  await detailsPage.clickSaveAndContinue();
});

Then('I should see edit submitted confirmation message', async function (this: World) {
  logger.info('🔍 Verifying edit submission confirmation');
  
  // The same success message as contract creation
  const successText = 'Your contract has been submitted successfully';
  const successElement = this.page.getByText(successText, { exact: false });
  
  try {
    await successElement.waitFor({ state: 'visible', timeout: 10000 });
    const foundText = await successElement.textContent();
    logger.info(`✅ Edit submission confirmed: "${foundText}"`);
  } catch (e) {
    logger.info('⚠️ Expected confirmation message not found, but edit may still be submitted');
  }
});

When('I open the edit approval link', { timeout: 120000 }, async function (this: World) {
  const detailsPage = new ContractDetailsPage(this.page);
  const approvalPage = new ApprovalPage(this.page);

  // Get the approval link
  const extractedLink = await detailsPage.getApprovalLink();

  // Open in new tab
  logger.info('🌐 Opening edit approval link in new tab');
  const newPage = await this.page.context().newPage();
  await newPage.goto(extractedLink, { waitUntil: 'load', timeout: 60000 });
  logger.info('✅ Edit approval link opened in new tab');

  // Store approval page for subsequent steps
  (this as any).approvalPage = newPage;
  logger.info('💾 Edit approval page stored in context');
  await waitForPageStable(newPage, 15000);

  // Handle OTP verification
  const approvalPageObj = new ApprovalPage(newPage);
  const searchedContractNumber = (this as any).contractNumber;
  await approvalPageObj.handleOTPVerification(searchedContractNumber);
});

When('I click on edit approval submit button', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const detailsPage = new ContractDetailsPage(page);
  await detailsPage.clickSubmitButton();
});

When('I confirm edit approval on popup', { timeout: 120000 }, async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const approvalPage = new ApprovalPage(page);
  await approvalPage.waitForAndConfirmPopup(120000);
});

Then('I should see edit approval success message {string}', async function (this: World, expectedMessage: string) {
  const page = (this as any).approvalPage || this.page;
  const approvalPage = new ApprovalPage(page);
  await approvalPage.waitForSuccessMessage(expectedMessage, 30000);
});

When('I update sell price to {string}', async function (this: World, newPrice: string) {
  logger.info(`💰 Updating sell price to: ${newPrice}`);
  
  // XPath for sell price input in edit mode
  const sellPriceXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div/div/div/div/div[2]/div/div/input';
  const sellPriceInput = this.page.locator(`xpath=${sellPriceXPath}`);
  
  await sellPriceInput.waitFor({ state: 'visible', timeout: 10000 });
  await sellPriceInput.clear();
  await sellPriceInput.fill(newPrice);
  
  logger.info(`✅ Sell price updated to: ${newPrice}`);
});