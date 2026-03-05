// tests/steps/ContractA/download_contract.steps.ts
import { When, Then } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { logger } from '../../utils/logger';
import { waitForPageStable } from '../../utils/waitHelper';

Then('I should see contract details page', async function (this: World) {
  logger.info('🔍 Verifying contract details page is displayed');
  
  // Wait for page to load
  await waitForPageStable(this.page);
  
  logger.info('✅ Contract details page verified');
});

When('I extract and save contract expiry date as pdf password', async function (this: World) {
  logger.info('📅 Extracting contract expiry date');
  
  // Extract expiry date from the specified XPath
  const expiryDateXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[6]/div/div/div[2]/div/div/div[2]/div/div[2]/div/div/span';
  const expiryDateElement = this.page.locator(`xpath=${expiryDateXPath}`);
  
  await expiryDateElement.waitFor({ state: 'visible', timeout: 15000 });
  const expiryDateText = await expiryDateElement.textContent();
  
  logger.info(`📅 Expiry date found: ${expiryDateText}`);
  
  // Remove slashes from the date (e.g., "21/02/2027" becomes "21022027")
  const pdfPassword = expiryDateText?.replace(/\//g, '') || '';
  
  logger.info(`🔐 PDF password saved: ${pdfPassword}`);
  
  // Store in context for later use
  (this as any).pdfPassword = pdfPassword;
});

When('I click on download contract button', async function (this: World) {
  logger.info('📥 Clicking download contract button');
  
  // Click download button using XPath
  const downloadButtonXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[8]/div/div/button[2]/div/i';
  const downloadButton = this.page.locator(`xpath=${downloadButtonXPath}`).or(
    this.page.getByRole('button', { name: /Download|تحميل/i })
  ).or(
    this.page.locator('button:has-text("Download")')
  );
  
  try {
    await downloadButton.waitFor({ state: 'visible', timeout: 30000 });
    await downloadButton.scrollIntoViewIfNeeded();
    await downloadButton.click({ timeout: 20000 });
  } catch (error) {
    logger.error('❌ Download contract button not found/clickable. Pausing for inspection.');
    await this.page.pause();
    throw error;
  }
  
  logger.info('✅ Download button clicked');
  
  // Wait for download to process
  await waitForPageStable(this.page);
});

Then('I should see download popup', { timeout: 60000 }, async function (this: World) {
  logger.info('⏳ Waiting for download popup to appear');
  
  // Wait for popup container and Download Contract button
  const popupContainer = this.page.locator('#download_pop');
  const popupButton = popupContainer.getByText('Download Contract');

  try {
    await popupContainer.waitFor({ state: 'attached', timeout: 40000 });
    await popupButton.waitFor({ state: 'visible', timeout: 40000 });
  } catch (error) {
    logger.error('❌ Download popup not detected. Pausing for inspection.');
    await this.page.pause();
    throw error;
  }
  
  logger.info('✅ Download popup detected');
});

When('I click download button in popup', { timeout: 60000 }, async function (this: World) {
  logger.info('📥 Clicking download button in popup');
  
  // Use popup container and wait for new window
  const popupDownloadButton = this.page.locator('#download_pop').getByText('Download Contract');
  const popupPromise = this.page.waitForEvent('popup');
  
  try {
    await popupDownloadButton.waitFor({ state: 'visible', timeout: 20000 });
    await popupDownloadButton.scrollIntoViewIfNeeded();
    await popupDownloadButton.click({ timeout: 20000, force: true });
    
    const popupPage = await popupPromise;
    await waitForPageStable(popupPage);
    (this as any).pdfPopupPage = popupPage;
  } catch (error) {
    logger.error('❌ Failed to click download button in popup. Pausing for inspection.');
    await this.page.pause();
    throw error;
  }
  
  logger.info('✅ Download popup button clicked');
});

Then('I should see pdf password field', { timeout: 60000 }, async function (this: World) {
  logger.info('🔐 Waiting for PDF password field');
  
  // Wait for new window to load and find password field
  const popupPage = (this as any).pdfPopupPage || await this.page.context().waitForEvent('page', { timeout: 20000 });
  await waitForPageStable(popupPage);

  const passwordField = popupPage.locator('input#input').or(
    popupPage.locator('input[type="password"]')
  );
  
  try {
    await passwordField.waitFor({ state: 'visible', timeout: 20000 });
  } catch (error) {
    logger.error('❌ PDF password field not found. Pausing for inspection.');
    await popupPage.pause();
    throw error;
  }
  
  logger.info('✅ PDF password field found');
});

When('I enter the contract expiry date as pdf password', { timeout: 60000 }, async function (this: World) {
  logger.info('🔐 Entering PDF password');
  
  const pdfPassword = (this as any).pdfPassword;
  
  if (!pdfPassword) {
    throw new Error('PDF password not found in context');
  }
  
  // Enter password in the field
  const popupPage = (this as any).pdfPopupPage || await this.page.context().waitForEvent('page', { timeout: 20000 });
  await waitForPageStable(popupPage);

  const passwordField = popupPage.locator('input#input').or(
    popupPage.locator('input[type="password"]')
  );
  
  try {
    await passwordField.waitFor({ state: 'visible', timeout: 10000 });
    await passwordField.fill(pdfPassword);
  } catch (error) {
    logger.error('❌ Failed to enter PDF password. Pausing for inspection.');
    await popupPage.pause();
    throw error;
  }
  
  logger.info(`✅ Password entered: ${pdfPassword}`);
  
  // Press Enter to submit
  await passwordField.press('Enter');
  
  logger.info('✅ Password submitted');
});

Then('I should see contract pdf opened successfully', async function (this: World) {
  logger.info('📄 Verifying PDF opened successfully');
  
  const popupPage = (this as any).pdfPopupPage;
  if (popupPage) {
    await waitForPageStable(popupPage);
  }
  
  logger.info('✅ Contract PDF opened successfully');
});
