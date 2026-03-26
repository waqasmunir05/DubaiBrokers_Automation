// tests/pages/ApprovalPage.ts
import { Page } from 'playwright';
import { logger } from '../utils/logger';
import { waitForPageStable } from '../utils/waitHelper';

export class ApprovalPage {
  constructor(private page: Page) {}

  // OTP verification flow
  async handleOTPVerification(contractNumber?: string): Promise<void> {
    logger.info('🔘 Looking for initial Verify button');
    const verifyButton = this.page.locator('#Verify, [id="Verify"], button:has-text("Verify")').first();
    await verifyButton.waitFor({ state: 'visible', timeout: 30000 });
    await verifyButton.click();
    logger.info('✅ Verify button clicked — OTP field should appear');

    // Wait for OTP field
    logger.info('⏳ Waiting for OTP field to appear');
    const otpField = this.page.locator('#TokenNumber, [id="TokenNumber"]').first();
    await otpField.waitFor({ state: 'visible', timeout: 30000 });
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
    const postOtpBtn = this.page.locator(
      '#Verify, #VerifyOTP, #VerifyToken, #Submit, #submit, ' +
      'button[type="submit"], button:has-text("Verify"), button:has-text("Submit"), button:has-text("Confirm")'
    ).first();

    const btnVisible = await postOtpBtn.isVisible({ timeout: 8000 }).catch(() => false);
    if (btnVisible) {
      await postOtpBtn.click({ force: true, noWaitAfter: true });
      logger.info('✅ Post-OTP submit button clicked');
    } else {
      logger.info('⚠️ No submit button found — pressing Enter on OTP field as fallback');
      await otpField.press('Enter');
    }

    await this.page.waitForTimeout(1500);
    await waitForPageStable(this.page, 20000).catch(() => {});
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
