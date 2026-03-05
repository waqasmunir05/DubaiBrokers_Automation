// tests/pages/ApprovalPage.ts
import { Page } from 'playwright';
import { logger } from '../utils/logger';
import { waitForPageStable } from '../utils/waitHelper';

export class ApprovalPage {
  constructor(private page: Page) {}

  // OTP verification flow
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
    logger.info('⏳ Approval page loaded');

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

  // Confirmation popup handling
  async waitForAndConfirmPopup(timeout: number = 30000): Promise<void> {
    logger.info('⏳ Waiting for confirmation popup to appear');
    const yesButtonXPath = '/html/body/div[4]/div[3]/div/button[1]';
    const yesButton = this.page.locator(`xpath=${yesButtonXPath}`);
    await yesButton.waitFor({ state: 'visible', timeout: 10000 });
    logger.info('👍 Clicking Yes button on confirmation popup');
    await yesButton.click();
    logger.info('✅ Confirmation accepted');
    
    // Wait for success message to appear
    logger.info('⏳ Waiting for success message to appear');
    const successMessage = this.page.getByText('Your signature request has been accepted successfully');
    await successMessage.waitFor({ state: 'visible', timeout: timeout });
    logger.info('✅ Approval completed successfully');
  }

  async waitForSuccessMessage(expectedMessage: string, timeout: number = 30000): Promise<boolean> {
    logger.info(`🔍 Waiting for success message: "${expectedMessage}"`);
    try {
      const successMessage = this.page.getByText(expectedMessage);
      await successMessage.waitFor({ state: 'visible', timeout });
      const messageText = await successMessage.textContent();
      logger.info(`✅ Success message verified: "${messageText}"`);
      return true;
    } catch (e) {
      logger.error(`❌ Success message not found within timeout`);
      return false;
    }
  }
}
