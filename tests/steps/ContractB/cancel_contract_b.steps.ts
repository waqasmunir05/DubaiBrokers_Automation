import { Then, When } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { ContractDetailsPage } from '../../pages/ContractDetailsPage';
import { CancellationApprovalPage } from '../../pages/CancellationApprovalPage';
import { logger } from '../../utils/logger';
import { waitForPageStable } from '../../utils/waitHelper';

When('broker opens searched Contract B details for cancellation', { timeout: 120000 }, async function (this: World) {
  logger.info('📋 Opening searched Contract B details for cancellation');

  await waitForPageStable(this.page, 15000);

  const cancelButton = this.page.locator('xpath=//*[@id="cancel_contract"]');
  await cancelButton.waitFor({ state: 'visible', timeout: 30000 });

  const detailsPage = new ContractDetailsPage(this.page);
  const searchedContractNumber = (this as any).contractNumber;

  if (searchedContractNumber) {
    const verified = await detailsPage.verifyContractNumber(searchedContractNumber);
    if (!verified) {
      throw new Error(`Contract B number not found on details page: ${searchedContractNumber}`);
    }
  }

  logger.info('✅ Contract B details page is ready for cancellation');
});

When('broker clicks Contract B cancel button', async function (this: World) {
  const cancelButton = this.page.locator('xpath=//*[@id="cancel_contract"]');
  await cancelButton.waitFor({ state: 'visible', timeout: 30000 });
  await cancelButton.click();

  logger.info('🚫 Clicked Contract B cancel button');
});

When('broker confirms Contract B cancellation popup with Yes', async function (this: World) {
  const exactYesButton = this.page.locator('button#yes.btn-continue').first();
  if (await exactYesButton.isVisible().catch(() => false)) {
    await exactYesButton.click();
    logger.info('👍 Confirmed Contract B cancellation popup by clicking exact visible Yes button');
    return;
  }

  const yesButtons = this.page.locator('xpath=//*[@id="yes"]');
  await yesButtons.first().waitFor({ state: 'attached', timeout: 20000 });

  const deadline = Date.now() + 20000;
  let clicked = false;

  while (Date.now() < deadline && !clicked) {
    const count = await yesButtons.count();

    for (let index = 0; index < count; index++) {
      const candidate = yesButtons.nth(index);
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      const byText = this.page.getByRole('button', { name: /yes|نعم|ok/i }).first();
      if (await byText.isVisible().catch(() => false)) {
        await byText.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      await this.page.waitForTimeout(400);
    }
  }

  if (!clicked) {
    throw new Error('Could not find a visible Yes confirmation button for Contract B cancellation popup');
  }

  logger.info('👍 Confirmed Contract B cancellation popup by clicking Yes');
});

Then('broker should see Contract B cancellation pending success message', async function (this: World) {
  const successMessageLocator = this.page.locator(
    'xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div/div/h4'
  );

  const expectedMessage =
    'Your cancellation request for contract has been submitted. Cancellation is pending for the confirmation and signature from the parties.';

  await successMessageLocator.waitFor({ state: 'visible', timeout: 20000 });

  const deadline = Date.now() + 30000;
  let messageText = '';
  let matched = false;

  while (Date.now() < deadline && !matched) {
    messageText = ((await successMessageLocator.textContent()) || '').trim();
    if (messageText.includes(expectedMessage)) {
      matched = true;
      break;
    }

    const pageHasExpectedText = await this.page.getByText(expectedMessage).first().isVisible().catch(() => false);
    if (pageHasExpectedText) {
      messageText = expectedMessage;
      matched = true;
      break;
    }

    await this.page.waitForTimeout(500);
  }

  if (!matched) {
    throw new Error(`Expected success message to contain: "${expectedMessage}". Actual: "${messageText}"`);
  }

  logger.info(`✅ Contract B cancellation success message verified: ${messageText}`);
});

When('broker clicks Yes to approve Contract B cancellation', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const cancellationApprovalPage = new CancellationApprovalPage(page);
  await cancellationApprovalPage.clickSubmitButton();
  logger.info('✅ Clicked Yes to approve Contract B cancellation');
});

When('broker confirms Yes on Contract B cancellation popup', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const cancellationApprovalPage = new CancellationApprovalPage(page);
  await cancellationApprovalPage.waitForAndConfirmPopup(30000);
  logger.info('✅ Confirmed Yes on Contract B cancellation popup');
});

Then('broker should see Contract B cancellation approval success message', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const successHeading = page.locator('xpath=/html/body/div[3]/div/div/div/h4').first();

  await successHeading.waitFor({ state: 'visible', timeout: 30000 });
  const messageText = ((await successHeading.textContent()) || '').trim();

  const expected = 'Contract cancelation has been done successfully';
  if (!messageText.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`Expected success message to contain \"${expected}\". Actual: \"${messageText}\"`);
  }

  logger.info(`✅ Contract B cancellation approval success verified: ${messageText}`);
});

When('broker clicks Contracts tab after cancellation approval', { timeout: 120000 }, async function (this: World) {
  const approvalPage = (this as any).approvalPage;
  if (approvalPage) {
    await approvalPage.close().catch(() => {});
    (this as any).approvalPage = undefined;
  }

  await this.page.bringToFront().catch(() => {});
  await waitForPageStable(this.page, 15000).catch(() => {});

  let clicked = false;
  const contractsByRoleTab = this.page.getByRole('tab', { name: /contracts/i }).first();
  if (await contractsByRoleTab.isVisible().catch(() => false)) {
    await contractsByRoleTab.click({ force: true });
    clicked = true;
  }

  if (!clicked) {
    const contractsByRoleLink = this.page.getByRole('link', { name: /contracts/i }).first();
    if (await contractsByRoleLink.isVisible().catch(() => false)) {
      await contractsByRoleLink.click({ force: true });
      clicked = true;
    }
  }

  if (!clicked) {
    const contractsByHref = this.page.locator('a[href="#/contracts"]').first();
    await contractsByHref.waitFor({ state: 'visible', timeout: 30000 });
    await contractsByHref.click({ force: true });
  }

  await waitForPageStable(this.page, 15000).catch(() => {});

  const closePopupBtn = this.page.locator('button.btn.btn-dark.btn-agree').first();
  if (await closePopupBtn.isVisible().catch(() => false)) {
    await closePopupBtn.click({ force: true });
    logger.info('❌ Closed popup message after returning to Contracts tab');
  }

  const loadingOverlay = this.page.locator('div[style*="position: fixed"][style*="z-index: 100002"]').first();
  await loadingOverlay.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});

  logger.info('📂 Clicked Contracts tab after cancellation approval');
});

When('broker searches Contract B again after cancellation approval', { timeout: 120000 }, async function (this: World) {
  await this.page.bringToFront().catch(() => {});
  await waitForPageStable(this.page, 15000).catch(() => {});

  const contractNumber = ((this as any).contractNumber || '').trim();
  if (!contractNumber) {
    throw new Error('Contract B number is not available in context for post-cancellation search');
  }

  const contractInput = this.page
    .locator('xpath=//label[normalize-space()="Contract number"]/ancestor::div[contains(@class,"form-group")]//input[1]')
    .first();

  await contractInput.waitFor({ state: 'visible', timeout: 20000 });
  await contractInput.fill(contractNumber);

  const searchButton = this.page.locator('button.btn.btn-dark:has-text("Search")').first();
  if (await searchButton.isVisible().catch(() => false)) {
    await searchButton.click({ force: true });
  } else {
    const searchByRole = this.page.getByRole('button', { name: /search/i }).first();
    await searchByRole.waitFor({ state: 'visible', timeout: 20000 });
    await searchByRole.click({ force: true });
  }

  const loadingOverlay = this.page.locator('div[style*="position: fixed"][style*="z-index: 100002"]').first();
  await loadingOverlay.waitFor({ state: 'hidden', timeout: 40000 }).catch(() => {});
  await waitForPageStable(this.page, 15000).catch(() => {});

  logger.info(`🔎 Re-searched Contract B after cancellation approval: ${contractNumber}`);
});

Then('broker should see Contract B search results after cancellation approval', { timeout: 120000 }, async function (this: World) {
  const statusCell = this.page.locator(
    'xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div[4]/div/div[3]/div[1]/table/tbody/tr[1]/td[7]'
  );
  await statusCell.waitFor({ state: 'visible', timeout: 120000 });

  logger.info('✅ Contract B search results displayed after cancellation approval');
});

Then('broker should see Contract B status as Cancelled after cancellation approval', async function (this: World) {
  const statusLocator = this.page.locator(
    'xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div[4]/div/div[3]/div[1]/table/tbody/tr[1]/td[7]'
  );

  await statusLocator.waitFor({ state: 'visible', timeout: 30000 });
  const statusText = ((await statusLocator.textContent()) || '').trim();

  if (!statusText.toLowerCase().includes('cancelled')) {
    throw new Error(`Expected Contract B status to be "Cancelled" but found "${statusText}"`);
  }

  logger.info(`✅ Contract B status verified as Cancelled: ${statusText}`);
});
