// tests/steps/ContractA/reject_contract.steps.ts
import { When } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { logger } from '../../utils/logger';

When('I click on decline button', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  logger.info('🚫 Clicking Declined button');

  const declineButton = page.locator('input#submit[value*="Declined"]').or(
    page.locator('input#submit[value*="رفض"]')
  ).or(
    page.getByRole('button', { name: /Declined|رفض/i })
  );

  await declineButton.waitFor({ state: 'visible', timeout: 20000 });
  await declineButton.click();
  logger.info('✅ Declined button clicked');
});

When('I confirm rejection on popup', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  logger.info('⏳ Waiting for rejection confirmation popup');

  const yesButtonXPath = '/html/body/div[5]/div[3]/div/button[1]';
  const yesButton = page.locator(`xpath=${yesButtonXPath}`);
  await yesButton.waitFor({ state: 'visible', timeout: 10000 });
  await yesButton.click();
  logger.info('✅ Rejection confirmed');

  // Wait for any rejection success message
  const successMessage = page.getByText(/declined|rejected|تم الرفض/i);
  await successMessage.waitFor({ state: 'visible', timeout: 20000 });
  logger.info('✅ Rejection success message displayed');
});
