// tests/pages/CancellationApprovalPage.ts
import { Locator, Page } from 'playwright';
import { logger } from '../utils/logger';
import { waitForPageStable } from '../utils/waitHelper';

export class CancellationApprovalPage {
  constructor(private page: Page) {}

  private async waitForBlockingOverlaysToDisappear(timeout: number = 10000): Promise<void> {
    const overlay = this.page.locator('.overlayy, .modal-backdrop, .blockUI, .loading, .spinner, .spinner-border').first();
    await overlay.waitFor({ state: 'hidden', timeout }).catch(() => {});
  }

  private async safeClick(locator: Locator, label: string, timeout: number = 30000): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await this.waitForBlockingOverlaysToDisappear(Math.min(timeout, 10000));

    try {
      await locator.click({ timeout: 5000 });
      return;
    } catch (error) {
      logger.info(`⚠️ Normal click failed for ${label}, trying force click`);
    }

    try {
      await locator.click({ force: true, timeout: 5000, noWaitAfter: true });
      return;
    } catch (error) {
      logger.info(`⚠️ Force click failed for ${label}, trying DOM click`);
    }

    await locator.evaluate((element: Element) => {
      (element as HTMLElement).click();
    });
  }

  // OTP verification flow for cancellation approval
  async handleOTPVerification(contractNumber?: string): Promise<void> {
    logger.info('🔘 Looking for verify button');
    const verifyButton = this.page
      .locator('#Verify, [id="Verify"], #GetToken, [id="GetToken"], button:has-text("Verify"), button:has-text("Get Token")')
      .first();
    await this.safeClick(verifyButton, 'cancellation verify button', 30000);
    logger.info('✅ Verify button clicked');
    
    // Wait for OTP field
    logger.info('⏳ Waiting for OTP field to appear');
    const otpField = this.page.locator('#TokenNumber, [id="TokenNumber"]').first();
    await otpField.waitFor({ state: 'visible', timeout: 30000 });
    logger.info('✅ OTP field appeared');
    
    // Generate random 5-digit OTP
    const randomOtp = Math.floor(10000 + Math.random() * 90000).toString();
    logger.info('🔢 Generated random OTP: ' + randomOtp);
    
    // Enter OTP
    await otpField.fill(randomOtp);
    logger.info('✅ OTP entered');
    
    // Click verify button again to verify OTP
    logger.info('🔘 Clicking Verify button to verify OTP');
    await this.safeClick(verifyButton, 'cancellation post-OTP verify button', 10000);
    logger.info('✅ OTP verification clicked');
    await waitForPageStable(this.page, 15000);
    logger.info('⏳ Cancellation approval page loaded');

    // Optionally verify contract number if provided
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

  // Click submit button for cancellation (no checkbox required)
  async clickSubmitButton(): Promise<void> {
    logger.info('📤 Clicking on submit button for cancellation approval');
    await waitForPageStable(this.page, 15000);
    
    // Log current URL to verify we're on the right page
    const currentUrl = this.page.url();
    logger.debug(`Current URL: ${currentUrl}`);
    
    const successAlreadyVisible = await this.page
      .getByText(/Contract cancelation has been done successfully|لقد تم إلغاء العقد بنجاح/i)
      .first()
      .isVisible()
      .catch(() => false);

    if (successAlreadyVisible) {
      logger.info('ℹ️ Cancellation success message already visible, submit action not required');
      return;
    }

    const candidates = [
      { name: 'accept button', locator: this.page.getByRole('button', { name: /Accept|قبول/i }).first() },
      { name: 'submit button', locator: this.page.getByRole('button', { name: /Submit|إرسال|Confirm|Approve/i }).first() },
      { name: 'generic submit input', locator: this.page.locator('button[type="submit"], input[type="submit"], #Submit, #submit').first() },
      { name: 'yes confirmation button', locator: this.page.locator('#yes, button:has-text("Yes / نعم"), button:has-text("Yes")').first() },
    ];

    let clicked = false;
    for (const candidate of candidates) {
      const visible = await candidate.locator.isVisible({ timeout: 6000 }).catch(() => false);
      if (!visible) continue;

      logger.info(`✅ Found ${candidate.name}, clicking now`);
      await this.safeClick(candidate.locator, candidate.name, 10000);
      clicked = true;
      break;
    }

    if (!clicked) {
      throw new Error(`Unable to find cancellation submit button on page: ${currentUrl}`);
    }
    
    logger.info('✅ Submit button clicked for cancellation');
  }

  // Confirmation popup handling for cancellation - may not appear
  async waitForAndConfirmPopup(timeout: number = 15000): Promise<void> {
    logger.info('⏳ Waiting for confirmation popup to appear');
    
    // Try to find the popup - if it doesn't appear, the success message might be shown directly
    const yesButton = this.page.locator('#yes, button:has-text("Yes / نعم"), button:has-text("Yes")').first();
    
    try {
      // Wait for button with shorter timeout
      await yesButton.waitFor({ state: 'visible', timeout: 5000 });
      logger.info('👍 Confirmation popup appeared, clicking Yes button');
      await this.safeClick(yesButton, 'cancellation confirmation Yes button', 5000);
      logger.info('✅ Confirmation accepted');
    } catch (e) {
      logger.info('⚠️ No popup found - success message may appear directly');
    }
    
    // Wait for success message to appear
    logger.info('⏳ Waiting for success message to appear');
    const successMessage = this.page.getByText(/Contract cancelation has been done successfully|لقد تم إلغاء العقد بنجاح/i).first();
    await successMessage.waitFor({ state: 'visible', timeout: timeout });
    logger.info('✅ Cancellation approval completed successfully');
  }

  async waitForSuccessMessage(expectedMessage: string, timeout: number = 30000): Promise<boolean> {
    logger.info(`🔍 Waiting for success message: "${expectedMessage}"`);
    const successMessageLocator = this.page.getByText(new RegExp(expectedMessage, 'i'));
    await successMessageLocator.waitFor({ state: 'visible', timeout: timeout });
    logger.info('✅ Success message appeared');
    return true;
  }
}
