import { When, Then } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { CancellationApprovalPage } from '../../pages/CancellationApprovalPage';
import { logger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Contract Cancellation Step Definitions
 */

When('I wait for cancel button to appear', async function (this: World) {
  logger.info('⏳ Waiting for cancel button to load');
  
  const cancelButtonXPath = '//*[@id="cancel_contract"]';
  const cancelButton = this.page.locator(`xpath=${cancelButtonXPath}`);
  
  await cancelButton.waitFor({ state: 'visible', timeout: 30000 });
  
  logger.info('✅ Cancel button is visible');
});

When('I click on cancel action icon', async function (this: World) {
  logger.info('🚫 Clicking on cancel button');
  
  const cancelButtonXPath = '//*[@id="cancel_contract"]';
  const cancelButton = this.page.locator(`xpath=${cancelButtonXPath}`);
  
  await cancelButton.click();
  
  logger.info('✅ Cancel button clicked');
});

When('I confirm cancellation on popup', async function (this: World) {
  logger.info('⏳ Waiting for cancellation confirmation popup');
  
  // Click Yes button on confirmation popup
  const yesButtonXPath = '//*[@id="yes"]';
  const yesButton = this.page.locator(`xpath=${yesButtonXPath}`);
  
  await yesButton.waitFor({ state: 'visible', timeout: 15000 });
  logger.info('👍 Clicking Yes button on cancellation popup');
  
  await yesButton.click();
  
  logger.info('✅ Cancellation confirmed');
});

Then('I should see cancellation request success message', async function (this: World) {
  logger.info('🔍 Waiting for cancellation request success message');
  
  // Wait for success message containing cancellation confirmation text
  const successMessage = this.page.getByText(/your cancellation request for contract has been submitted/i);
  
  await successMessage.waitFor({ state: 'visible', timeout: 15000 });
  const messageText = await successMessage.textContent();
  
  logger.info(`✅ Cancellation request submitted successfully: ${messageText}`);
});

When('I click on submit button for cancellation', async function (this: World) {
  // Use the approval page context that was opened in new tab
  const page = (this as any).approvalPage || this.page;
  
  // Use the CancellationApprovalPage class
  const cancellationApprovalPage = new CancellationApprovalPage(page);
  await cancellationApprovalPage.clickSubmitButton();
});

When('I confirm cancellation approval on popup', async function (this: World) {
  // Use the approval page context that was opened in new tab
  const page = (this as any).approvalPage || this.page;
  
  // Use the CancellationApprovalPage class for confirmation
  const cancellationApprovalPage = new CancellationApprovalPage(page);
  await cancellationApprovalPage.waitForAndConfirmPopup();
});
