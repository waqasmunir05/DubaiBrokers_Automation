// tests/pages/CancellationApprovalPage.ts
import { Page } from 'playwright';
import { logger } from '../utils/logger';
import { waitForPageStable } from '../utils/waitHelper';

export class CancellationApprovalPage {
  constructor(private page: Page) {}

  // OTP verification flow for cancellation approval
  async handleOTPVerification(contractNumber?: string): Promise<void> {
    logger.info('🔘 Looking for verify button');
    const verifyButtonXPath = '//*[@id="Verify"]';
    const verifyButton = this.page.locator(`xpath=${verifyButtonXPath}`);
    await verifyButton.waitFor({ state: 'visible', timeout: 30000 });
    await verifyButton.click();
    logger.info('✅ Verify button clicked');
    
    // Wait for OTP field
    logger.info('⏳ Waiting for OTP field to appear');
    const otpFieldXPath = '//*[@id="TokenNumber"]';
    const otpField = this.page.locator(`xpath=${otpFieldXPath}`);
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
    await verifyButton.waitFor({ state: 'visible', timeout: 10000 });
    await verifyButton.click();
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
    
    // Use specific selector for the Yes button (not No button)
    const submitButton = this.page.getByRole('button', { name: 'Yes / نعم' });
    
    logger.info('🔍 Waiting for Yes button to be visible');
    await submitButton.waitFor({ state: 'visible', timeout: 20000 });
    logger.info('✅ Yes button is visible, clicking now');
    
    await submitButton.click();
    
    logger.info('✅ Submit button clicked for cancellation');
  }

  // Confirmation popup handling for cancellation - may not appear
  async waitForAndConfirmPopup(timeout: number = 15000): Promise<void> {
    logger.info('⏳ Waiting for confirmation popup to appear');
    
    // Try to find the popup - if it doesn't appear, the success message might be shown directly
    const yesButtonXPath = '/html/body/div[4]/div[3]/div/button[1]';
    const yesButton = this.page.locator(`xpath=${yesButtonXPath}`);
    
    try {
      // Wait for button with shorter timeout
      await yesButton.waitFor({ state: 'visible', timeout: 5000 });
      logger.info('👍 Confirmation popup appeared, clicking Yes button');
      await yesButton.click();
      logger.info('✅ Confirmation accepted');
    } catch (e) {
      logger.info('⚠️ No popup found - success message may appear directly');
    }
    
    // Wait for success message to appear
    logger.info('⏳ Waiting for success message to appear');
    const successMessageXPath = '/html/body/div[3]/div/div/div/h4[contains(text(), "Contract cancelation has been done successfully") or contains(text(), "لقد تم إلغاء العقد بنجاح")]';
    const successMessage = this.page.locator(`xpath=${successMessageXPath}`);
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
