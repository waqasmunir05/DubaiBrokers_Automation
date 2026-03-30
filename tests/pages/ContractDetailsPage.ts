// tests/pages/ContractDetailsPage.ts
import { Page } from 'playwright';
import { logger } from '../utils/logger';
import { waitForPageStable } from '../utils/waitHelper';

export class ContractDetailsPage {
  constructor(private page: Page) {}

  // Contract identification locators
  async getContractNumber(): Promise<string | null> {
    try {
      const contractText = await this.page.getByText(/CA[0-9]+|CS[0-9]+/).first().textContent();
      return contractText?.trim() || null;
    } catch (e) {
      return null;
    }
  }

  async verifyContractNumber(contractNumber: string): Promise<boolean> {
    logger.info(`🔍 Verifying contract number on page: ${contractNumber}`);
    const normalizedExpected = contractNumber.replace(/\s+/g, '').trim();

    const exactVisible = await this.page
      .getByText(contractNumber, { exact: false })
      .first()
      .isVisible()
      .catch(() => false);

    if (exactVisible) {
      logger.info(`✅ Contract number verified: ${contractNumber}`);
      return true;
    }

    const bodyText = (await this.page.locator('body').textContent().catch(() => '')) || '';
    const normalizedBody = bodyText.replace(/\s+/g, '');

    if (normalizedExpected && normalizedBody.includes(normalizedExpected)) {
      logger.info(`✅ Contract number verified (normalized match): ${contractNumber}`);
      return true;
    }

    logger.error(`❌ Contract number not found: ${contractNumber}`);
    return false;
  }

  // Button locators and actions
  async clickEditButton(): Promise<void> {
    logger.info('✏️ Clicking on edit button');
    const editButton = this.page.locator('//*[@id="edit_contract"]');
    await editButton.waitFor({ state: 'visible', timeout: 10000 });
    await editButton.click();
    await waitForPageStable(this.page);
    logger.info('✅ Edit button clicked');
  }

  async clickTermsCheckbox(): Promise<void> {
    logger.info('☑️ Clicking on terms and conditions checkbox');
    
    const page = this.page;
    
    // Try approval page XPath first
    const approvalCheckboxXPath = '//*[@id="TermsAccepted"]';
    let checkbox = page.locator(`xpath=${approvalCheckboxXPath}`);
    let checkboxVisible = await checkbox.isVisible().catch(() => false);
    
    if (checkboxVisible) {
      await checkbox.click();
      logger.info('✅ Terms and conditions checkbox checked (approval page - XPath 1)');
      return;
    }
    
    // Try alternative approval page XPath
    const approvalCheckboxXPath2 = '/html/body/div[3]/div/div[15]/div/form/label';
    checkbox = page.locator(`xpath=${approvalCheckboxXPath2}`);
    checkboxVisible = await checkbox.isVisible().catch(() => false);
    
    if (checkboxVisible) {
      await checkbox.click();
      logger.info('✅ Terms and conditions checkbox checked (approval page - XPath 2)');
      return;
    }
    
    // Try creation page XPath
    const creationCheckboxXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[2]/label/input';
    checkbox = page.locator(`xpath=${creationCheckboxXPath}`);
    await checkbox.waitFor({ state: 'visible', timeout: 10000 });
    await checkbox.check();
    await waitForPageStable(page);
    logger.info('✅ Terms and conditions checkbox checked (creation page)');
  }

  async clickSubmitButton(): Promise<void> {
    logger.info('📤 Clicking on submit button');
    // Use getByRole to select the Accept button specifically
    const submitButton = this.page.getByRole('button', { name: /Accept|قبول/ });
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await submitButton.click();
    logger.info('✅ Submit button clicked');
  }

  async clickConfirmYesButton(): Promise<void> {
    logger.info('👍 Clicking Yes button on confirmation popup');
    const yesButtonXPath = '/html/body/div[4]/div[3]/div/button[1]';
    const yesButton = this.page.locator(`xpath=${yesButtonXPath}`);
    await yesButton.waitFor({ state: 'visible', timeout: 10000 });
    await yesButton.click();
    logger.info('✅ Confirmation accepted');
  }

  async waitForSuccessMessage(expectedMessage: string): Promise<boolean> {
    logger.info(`🔍 Waiting for success message: "${expectedMessage}"`);
    try {
      const successMessage = this.page.getByText(expectedMessage);
      await successMessage.waitFor({ state: 'visible', timeout: 30000 });
      const messageText = await successMessage.textContent();
      logger.info(`✅ Success message verified: "${messageText}"`);
      return true;
    } catch (e) {
      logger.error('❌ Success message not found within timeout');
      return false;
    }
  }

  async clickSaveAndContinue(): Promise<void> {
    logger.info('➡️ Clicking Save & Continue');
    const saveContinueButton = this.page.locator('button.buttonNext.btn.btn-primary');
    await saveContinueButton.waitFor({ state: 'visible', timeout: 30000 });
    await saveContinueButton.click();
    await waitForPageStable(this.page);
    logger.info('✅ Save & Continue clicked');
  }

  async clickSubmitContractForApproval(): Promise<void> {
    logger.info('📤 Clicking on Submit Contract for Approval button');
    const submitBtnXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[3]/div/button[2]';
    const submitBtn = this.page.locator(`xpath=${submitBtnXPath}`);
    await submitBtn.waitFor({ state: 'visible', timeout: 10000 });
    await submitBtn.click();
    await waitForPageStable(this.page);
    logger.info('✅ Contract submitted for approval');
  }

  private sanitizeApprovalLink(rawLink: string): string {
    const trimmed = (rawLink || '').trim();
    if (!trimmed) return '';

    const directUrlMatch = trimmed.match(/https?:\/\/dubailand\.gov\.ae\/r\/[A-Za-z0-9_-]+/);
    if (!directUrlMatch) return trimmed;

    const original = directUrlMatch[0];
    let sanitized = original;
    try {
      const parsed = new URL(sanitized);
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1] || '';

      if (/send$/i.test(lastPart) && lastPart.length > 4) {
        pathParts[pathParts.length - 1] = lastPart.replace(/send$/i, '');
        parsed.pathname = `/${pathParts.join('/')}`;
        sanitized = parsed.toString();
      }
    } catch {
      if (/send$/i.test(sanitized) && sanitized.length > 4) {
        sanitized = sanitized.replace(/send$/i, '');
      }
    }

    if (sanitized !== original) {
      logger.info(`🧹 Sanitized approval link: ${original} -> ${sanitized}`);
    }

    return sanitized;
  }

  // Approval/Edit link extraction
  async getApprovalLink(fallbackXPath?: string): Promise<string> {
    logger.info('📄 Waiting for approval link to load');
    await waitForPageStable(this.page, 15000);

    const anchorCandidates = this.page.locator('a[href*="/r/"]');
    const anchorCount = await anchorCandidates.count();

    const extractedLinks: string[] = [];
    for (let index = 0; index < anchorCount; index++) {
      const link = await anchorCandidates.nth(index).getAttribute('href');
      if (!link) continue;

      const trimmed = link.trim();
      if (!trimmed) continue;
      if (trimmed.includes('/r/')) {
        extractedLinks.push(trimmed);
      }
    }

    const normalizedLinks = extractedLinks
      .map((link) => {
        if (link.startsWith('http')) return link;
        if (link.startsWith('/')) return `https://dubailand.gov.ae${link}`;
        return link;
      })
      .filter((link) => link.includes('dubailand.gov.ae/r/'));

    if (normalizedLinks.length > 0) {
      const latestLink = this.sanitizeApprovalLink(normalizedLinks[normalizedLinks.length - 1]);
      logger.info(`✅ Approval link element found (${normalizedLinks.length} candidate(s))`);
      logger.info('🔗 Extracted approval link: ' + latestLink);
      return latestLink;
    }

    const bodyText = (await this.page.locator('body').textContent().catch(() => '')) || '';
    const textMatches = bodyText.match(/https:\/\/dubailand\.gov\.ae\/r\/[A-Za-z0-9_-]{8,20}(?:Send)?/g) || [];
    if (textMatches.length > 0) {
      const latestRawTextLink = textMatches[textMatches.length - 1].replace(/Send$/i, '');
      const latestTextLink = this.sanitizeApprovalLink(latestRawTextLink);
      logger.info(`✅ Approval link found in text (${textMatches.length} candidate(s))`);
      logger.info('🔗 Extracted approval link: ' + latestTextLink);
      return latestTextLink;
    }

    const resolvedFallbackXPath = fallbackXPath || '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[3]/div/div[3]/div/div[2]/div/div[1]/div[1]/div[2]/div/div[1]';
    const fallbackElement = this.page.locator(`xpath=${resolvedFallbackXPath}`);
    await fallbackElement.waitFor({ state: 'attached', timeout: 15000 });
    let fallbackLink = await fallbackElement.getAttribute('href');
    if (!fallbackLink) {
      fallbackLink = await fallbackElement.evaluate((element) => {
        const anchor =
          (element instanceof HTMLAnchorElement ? element : null) ||
          element.querySelector('a') ||
          element.closest('a');

        return (
          anchor?.getAttribute('href') ||
          anchor?.textContent ||
          element.getAttribute('href') ||
          element.getAttribute('data-href') ||
          element.textContent ||
          ''
        );
      });
    }

    const extractedFallbackLink = this.sanitizeApprovalLink(fallbackLink?.trim() || '');
    if (!extractedFallbackLink) {
      throw new Error('❌ Approval link is empty or not found');
    }

    logger.info('🔗 Extracted approval link (fallback): ' + extractedFallbackLink);
    return extractedFallbackLink;
  }

  // Page title verification
  async getPageTitle(): Promise<string | null> {
    try {
      const pageTitle = await this.page.locator('h1, h2, h3').first().textContent();
      return pageTitle?.trim() || null;
    } catch (e) {
      return null;
    }
  }

  async waitForPageToLoad(timeout: number = 30000): Promise<void> {
    logger.info('⏳ Waiting for page to load');
    // Wait for any page content to be visible
    await this.page.locator('body').waitFor({ state: 'visible', timeout });
    await waitForPageStable(this.page, timeout);
    logger.info('✅ Page loaded');
  }
}
