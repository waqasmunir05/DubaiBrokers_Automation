// tests/pages/ApprovalPage.ts
import { Locator, Page } from 'playwright';
import { logger } from '../utils/logger';
import { waitForPageStable } from '../utils/waitHelper';

export class ApprovalPage {
  constructor(private page: Page) {}

  private isBenignNavigationError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error || '');
    return /Target page, context or browser has been closed|Execution context was destroyed|Element is not attached|Frame was detached/i.test(message);
  }

  private async getVisibleLocator(selectors: string[], timeout: number): Promise<Locator | null> {
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      for (const selector of selectors) {
        const locator = this.page.locator(selector).first();
        const visible = await locator.isVisible().catch(() => false);
        if (visible) {
          return locator;
        }
      }

      await this.page.waitForTimeout(250);
    }

    return null;
  }

  private async waitForOtpOrActionable(otpField: Locator, timeout: number): Promise<'otp' | 'actionable' | 'none'> {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      const otpVisible = await otpField.isVisible().catch(() => false);
      if (otpVisible) {
        return 'otp';
      }

      const actionableWithoutOtp = await this.isApprovalPageActionable(1500);
      if (actionableWithoutOtp) {
        return 'actionable';
      }

      await this.page.waitForTimeout(1500);
    }

    return 'none';
  }

  private async isApprovalPageActionable(timeout: number = 5000): Promise<boolean> {
    const actionableLocators = [
      this.page.locator('#TermsAccepted, input#TermsAccepted').first(),
      this.page.getByRole('button', { name: /Accept|Submit|Confirm|Approve|قبول/i }).first(),
      this.page.locator('label:has-text("I agree"), label:has-text("I Accept"), label:has-text("terms")').first(),
    ];

    for (const locator of actionableLocators) {
      const visible = await locator.isVisible({ timeout }).catch(() => false);
      if (visible) {
        return true;
      }
    }

    return false;
  }

  private async waitForBlockingOverlaysToDisappear(timeout: number = 10000): Promise<void> {
    const overlay = this.page.locator('.overlayy, .modal-backdrop, .blockUI, .loading, .spinner, .spinner-border').first();
    await overlay.waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  private async safeClick(locator: Locator, label: string, timeout: number = 30000, options?: { navigationExpected?: boolean }): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await this.waitForBlockingOverlaysToDisappear(Math.min(timeout, 10000));

    try {
      await locator.click({ timeout: 5000, noWaitAfter: Boolean(options?.navigationExpected) });
      return;
    } catch (error) {
      if (options?.navigationExpected && this.isBenignNavigationError(error)) {
        logger.info(`ℹ️ ${label} triggered page transition during normal click`);
        return;
      }
      logger.info(`⚠️ Normal click failed for ${label}, trying force click`);
    }

    try {
      await locator.click({ force: true, timeout: 5000, noWaitAfter: true });
      return;
    } catch (error) {
      if (options?.navigationExpected && this.isBenignNavigationError(error)) {
        logger.info(`ℹ️ ${label} triggered page transition during force click`);
        return;
      }
      logger.info(`⚠️ Force click failed for ${label}, trying DOM click`);
    }

    try {
      await locator.evaluate((element: Element) => {
        (element as HTMLElement).click();
      });
    } catch (error) {
      if (options?.navigationExpected && this.isBenignNavigationError(error)) {
        logger.info(`ℹ️ ${label} triggered page transition during DOM click`);
        return;
      }
      throw error;
    }
  }

  // OTP verification flow
  async handleOTPVerification(contractNumber?: string, options?: { requireTokenRequest?: boolean }): Promise<void> {
    await waitForPageStable(this.page, 15000).catch(() => {});

    const requireTokenRequest = Boolean(options?.requireTokenRequest);
    const verifySelectors = [
      '#Verify',
      '[id="Verify"]',
      '#GetToken',
      '[id="GetToken"]',
      'button.btn-login',
      'button.btn-primary',
      'button[type="submit"]',
      'button:has-text("Verify")',
      'button:has-text("Get Token")'
    ];
    const otpSelectors = [
      '#TokenNumber',
      '[id="TokenNumber"]',
      'input[name="otp"]',
      'input[id="otp"]',
      'input[name*="token" i]',
      'input[id*="token" i]',
      'input[placeholder*="OTP" i]'
    ];

    const getVerifyButton = async (timeout: number): Promise<Locator | null> =>
      this.getVisibleLocator(verifySelectors, timeout);

    const getOtpField = async (timeout: number): Promise<Locator | null> =>
      this.getVisibleLocator(otpSelectors, timeout);

    const requestOtpIfButtonVisible = async (label: string, timeout: number): Promise<boolean> => {
      const verifyButton = await getVerifyButton(3000);
      if (!verifyButton) {
        return false;
      }

      logger.info(`🔘 ${label}`);
      await this.safeClick(verifyButton, label, timeout);
      logger.info('✅ Get Token/Verify button clicked');
      return true;
    };

    logger.info('⏳ Checking whether OTP is already requested');
    let tokenRequestTriggered = false;
    let otpField = await getOtpField(3000);
    let state: 'otp' | 'actionable' | 'none' = requireTokenRequest
      ? 'none'
      : otpField
        ? 'otp'
        : await this.waitForOtpOrActionable(this.page.locator(otpSelectors.join(', ')).first(), 3000);

    if (requireTokenRequest) {
      const clicked = await requestOtpIfButtonVisible('Triggering initial Get Token/Verify button', 10000);
      tokenRequestTriggered = clicked;
      if (clicked) {
        await this.page.waitForTimeout(1500);
        otpField = await getOtpField(12000);
        state = otpField ? 'otp' : 'none';
      }
    }

    if (state !== 'otp') {
      const clicked = await requestOtpIfButtonVisible('Looking for initial Get Token/Verify button', 10000);
      tokenRequestTriggered = tokenRequestTriggered || clicked;
      if (clicked) {
        otpField = await getOtpField(12000);
        state = otpField ? 'otp' : await this.waitForOtpOrActionable(this.page.locator(otpSelectors.join(', ')).first(), 12000);
      }
    }

    if (state === 'none') {
      const clicked = await requestOtpIfButtonVisible('Retrying Get Token/Verify button', 10000);
      tokenRequestTriggered = tokenRequestTriggered || clicked;
      if (clicked) {
        otpField = await getOtpField(12000);
        state = otpField ? 'otp' : await this.waitForOtpOrActionable(this.page.locator(otpSelectors.join(', ')).first(), 12000);
        if (state === 'none') {
          logger.info('⚠️ OTP field did not appear after click, retrying Get Token/Verify button');
          const verifyButton = await getVerifyButton(3000);
          if (verifyButton) {
            await this.safeClick(verifyButton, 'Get Token/Verify button retry', 7000);
          }
          otpField = await getOtpField(20000);
          state = otpField ? 'otp' : await this.waitForOtpOrActionable(this.page.locator(otpSelectors.join(', ')).first(), 20000);
        }
      }
    }

    if (state === 'none') {
      const verifyButton = await getVerifyButton(3000);
      if (verifyButton) {
        logger.info('⚠️ Final OTP retry via Get Token/Verify button');
        await this.safeClick(verifyButton, 'final Get Token/Verify button retry', 7000);
        tokenRequestTriggered = true;
        otpField = await getOtpField(25000);
        state = otpField ? 'otp' : await this.waitForOtpOrActionable(this.page.locator(otpSelectors.join(', ')).first(), 25000);
      }
    }

    if (state === 'actionable' && !requireTokenRequest) {
        logger.info('ℹ️ Approval page is already actionable without OTP input; continuing');
        if (contractNumber) {
          await this.verifyContractNumber(contractNumber);
        }
        return;
    }

    if (!otpField) {
      otpField = await getOtpField(45000);
    }

    if (requireTokenRequest && !tokenRequestTriggered) {
      throw new Error('No visible Get Token/Verify button was found on the signatory page, so token request could not be triggered.');
    }

    if (!otpField) {
      throw new Error(requireTokenRequest
        ? 'Get Token button was triggered but no visible OTP field appeared on the signatory page.'
        : 'No visible OTP field appeared on the approval page.');
    }

    logger.info('✅ OTP field appeared');

    // Generate random 5-digit OTP (QA environment accepts any value)
    const randomOtp = Math.floor(10000 + Math.random() * 90000).toString();
    logger.info('🔢 Generated random OTP: ' + randomOtp);
    await otpField.fill(randomOtp);
    await this.page.waitForTimeout(800);
    logger.info('✅ OTP entered');

    // After OTP entry the original #Verify button may disappear or be replaced —
    // try multiple candidate selectors to submit the OTP
    logger.info('🔘 Looking for submit button after OTP entry');
    const postOtpBtn = await this.getVisibleLocator([
      '#Verify',
      '#VerifyOTP',
      '#VerifyToken',
      '#Submit',
      '#submit',
      'button.btn-login',
      'button.btn-primary',
      'button[type="submit"]',
      'button:has-text("Verify")',
      'button:has-text("Get Token")',
      'button:has-text("Submit")',
      'button:has-text("Confirm")'
    ], 8000);

    if (postOtpBtn) {
      await this.safeClick(postOtpBtn, 'post-OTP submit button', 10000, { navigationExpected: true });
      logger.info('✅ Post-OTP submit button clicked');
    } else {
      logger.info('⚠️ No submit button found — pressing Enter on OTP field as fallback');
      await otpField.press('Enter');
    }

    await this.page.waitForTimeout(1500);
    await waitForPageStable(this.page, 20000).catch(() => {});

    const otpStillVisible = await otpField.isVisible().catch(() => false);
    const pageActionable = await this.isApprovalPageActionable(3000).catch(() => false);
    if (otpStillVisible && !pageActionable) {
      throw new Error('OTP Verify button was clicked, but the approval page did not transition to the actionable signatory content.');
    }

    logger.info('✅ OTP verification complete, page stable');

    if (contractNumber) {
      await this.verifyContractNumber(contractNumber);
    }
  }

  async verifyContractNumber(contractNumber: string): Promise<boolean> {
    logger.info(`🔍 Verifying contract number on approval page: ${contractNumber}`);
    const contractNumberOnPage = this.page.getByText(contractNumber);
    const isVisible = await contractNumberOnPage.isVisible().catch(() => false);

    if (isVisible) {
      logger.info(`✅ Contract number verified on approval page: ${contractNumber}`);
      return true;
    } else {
      logger.info(`⚠️ Contract number not found on approval page: ${contractNumber}`);
      return false;
    }
  }

  // Confirmation popup handling
  async waitForAndConfirmPopup(timeout: number = 30000): Promise<void> {
    logger.info('⏳ Waiting for confirmation popup to appear');
    const yesButtonXPath = '/html/body/div[4]/div[3]/div/button[1]';
    const yesButton = this.page.locator(`xpath=${yesButtonXPath}`);
    await yesButton.waitFor({ state: 'visible', timeout: 10000 });
    logger.info('👍 Clicking Yes button on confirmation popup');
    await yesButton.click({ noWaitAfter: true, timeout: 10000 });
    logger.info('✅ Confirmation accepted');

    // Wait for success message to appear
    logger.info('⏳ Waiting for success message to appear');
    const successMessage = this.page.getByText('Your signature request has been accepted successfully');
    await successMessage.waitFor({ state: 'visible', timeout });
    logger.info('✅ Approval completed successfully');
  }

  async waitForSuccessMessage(expectedMessage: string, timeout: number = 30000): Promise<boolean> {
    logger.info(`🔍 Waiting for success message: "${expectedMessage}"`);
    try {
      const byPartial = this.page.getByText(expectedMessage, { exact: false });
      await byPartial.waitFor({ state: 'visible', timeout });
      const messageText = await byPartial.textContent();
      logger.info(`✅ Success message verified: "${messageText}"`);
      return true;
    } catch (e) {
      logger.error(`❌ Success message not found within timeout`);
      throw new Error(`Expected success message not found. Expected: "${expectedMessage}"`);
    }
  }
}
