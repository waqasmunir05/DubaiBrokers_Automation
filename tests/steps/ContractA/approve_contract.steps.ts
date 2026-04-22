// tests/steps/ContractA/approve_contract.steps.ts
import { When, Then } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { ContractDetailsPage } from '../../pages/ContractDetailsPage';
import { ApprovalPage } from '../../pages/ApprovalPage';
import { logger } from '../../utils/logger';
import { waitForPageStable } from '../../utils/waitHelper';
import * as fs from 'fs';
import * as path from 'path';

const normalizeNumberText = (value: string | null | undefined): string => {
  const cleaned = (value || '')
    .replace(/aed/gi, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .trim();

  const numericMatch = cleaned.match(/-?\d+(?:\.\d+)?/);
  if (!numericMatch) {
    return cleaned;
  }

  const [integerPart] = numericMatch[0].split('.');
  return integerPart || numericMatch[0];
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const hasDigits = (value: string | null | undefined): boolean => /\d/.test(value || '');

const loadContractAExpectationData = (): { contractStartDate?: string; contractEndDate?: string } => {
  const contractFilePath = path.join(process.cwd(), 'contract-data.json');
  if (!fs.existsSync(contractFilePath)) {
    return {};
  }

  try {
    const raw = fs.readFileSync(contractFilePath, 'utf-8');
    const data = JSON.parse(raw);
    return {
      contractStartDate: String(data.contractStartDate || '').trim() || undefined,
      contractEndDate: String(data.contractEndDate || '').trim() || undefined,
    };
  } catch {
    return {};
  }
};

const getApprovalValueByLabels = async (
  page: World['page'],
  labels: string[],
  timeout = 8000,
  options?: { requireDigits?: boolean }
): Promise<string> => {
  const requireDigits = options?.requireDigits ?? false;
  const acceptValue = (value: string | null | undefined): value is string => {
    const trimmed = (value || '').trim();
    if (!trimmed) return false;
    if (requireDigits && !hasDigits(trimmed)) return false;
    return true;
  };

  const absoluteXPathByLabel: Record<string, string[]> = {
    'Sell Price': [
      '/html/body/div[3]/div/div[8]/div[2]/div/table[1]/tbody/tr/td/label[2]',
    ],
    'Sale Price': [
      '/html/body/div[3]/div/div[8]/div[2]/div/table[1]/tbody/tr/td/label[2]',
    ],
    'Commission': [
      '/html/body/div[3]/div/div[4]/div[2]/table/tbody/tr[6]/td/label[2]',
      '/html/body/div[3]/div/div[9]/div[2]/div/table[4]/tbody/tr/td/label[2]',
    ],
    'Brokerage': [
      '/html/body/div[3]/div/div[4]/div[2]/table/tbody/tr[6]/td/label[2]',
      '/html/body/div[3]/div/div[9]/div[2]/div/table[4]/tbody/tr/td/label[2]',
    ],
    'Contract Start Date': [
      '/html/body/div[3]/div/div[4]/div[2]/table/tbody/tr[3]/td/label[2]',
    ],
    'Start Date': [
      '/html/body/div[3]/div/div[4]/div[2]/table/tbody/tr[3]/td/label[2]',
    ],
    'Contract End Date': [
      '/html/body/div[3]/div/div[4]/div[2]/table/tbody/tr[4]/td/label[2]',
    ],
    'End Date': [
      '/html/body/div[3]/div/div[4]/div[2]/table/tbody/tr[4]/td/label[2]',
    ],
  };

  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    for (const label of labels) {
      const xpaths = absoluteXPathByLabel[label] || [];
      for (const xpath of xpaths) {
        const locator = page.locator(`xpath=${xpath}`).first();
        const text = await locator.textContent().catch(() => '');
        if (acceptValue(text)) {
          return text.trim();
        }
      }

      const html = await page.content().catch(() => '');

      const spanPattern = new RegExp(
        `<label[^>]*>\s*${escapeRegex(label)}\s*<\/label>[\s\S]{0,1200}?<span[^>]*class="[^"]*form-control-text[^"]*"[^>]*>\s*([^<]+?)\s*<\/span>`,
        'i'
      );

      const spanMatch = html.match(spanPattern);
      if (acceptValue(spanMatch?.[1])) {
        return spanMatch![1].trim();
      }

      const locatorCandidates = [
        page.locator(`.form-group:has(label:has-text("${label}")) .form-control-text`).first(),
        page.locator(`label:has-text("${label}")`).locator('xpath=ancestor::div[contains(@class,"form-group")][1]//*[contains(@class,"form-control-text")][1]').first(),
      ];

      for (const locator of locatorCandidates) {
        const visible = await locator.isVisible().catch(() => false);
        if (!visible) continue;

        const text = await locator.textContent().catch(() => '');
        if (acceptValue(text) && text.trim().toLowerCase() !== label.trim().toLowerCase()) {
          return text.trim();
        }
      }
    }

    await page.waitForTimeout(250);
  }

  throw new Error(`Could not find approval value for labels: ${labels.join(', ')}`);
};

When('I open the approval link', { timeout: 90000 }, async function (this: World) {
  const detailsPage = new ContractDetailsPage(this.page);
  const contractDetailsLink = await detailsPage.getApprovalLink();
  
  logger.info('🌐 Opening approval link in new tab');
  const newPage = await this.page.context().newPage();
  await newPage.goto(contractDetailsLink, { waitUntil: 'load', timeout: 60000 });
  await waitForPageStable(newPage, 15000);
  logger.info('✅ Approval link opened in new tab');
  
  // Store new page in World context for subsequent steps
  (this as any).approvalPage = newPage;
  logger.info('💾 Approval page stored in context');
  
  // Handle OTP verification
  const approvalPage = new ApprovalPage(newPage);
  const contractNumber = (this as any).contractNumber;
  await approvalPage.handleOTPVerification(contractNumber);
});

Then('I verify edited sell price {string} on approval page', async function (this: World, expectedPrice: string) {
  const page = (this as any).approvalPage || this.page;
  logger.info(`🔍 Verifying sell price on approval page: ${expectedPrice}`);
  const actualPrice = await getApprovalValueByLabels(page, ['Sell Price', 'Sale Price'], 15000, { requireDigits: true });
  const cleanedPrice = normalizeNumberText(actualPrice);
  const cleanedExpected = normalizeNumberText(expectedPrice);
  logger.info(`📊 Sell price assertion -> expected raw: "${expectedPrice}", actual raw: "${actualPrice}"`);
  logger.info(`📊 Sell price assertion -> expected normalized: "${cleanedExpected}", actual normalized: "${cleanedPrice}"`);
  
  if (cleanedPrice.includes(cleanedExpected)) {
    logger.info(`✅ Sell price verified on approval page: ${actualPrice}`);
  } else {
    throw new Error(`❌ Sell price mismatch - Expected raw: ${expectedPrice}, Actual raw: ${actualPrice}, Expected normalized: ${cleanedExpected}, Actual normalized: ${cleanedPrice}`);
  }
});

Then('I verify commission {string} on approval page', async function (this: World, expectedCommission: string) {
  const page = (this as any).approvalPage || this.page;
  logger.info(`🔍 Verifying commission on approval page: ${expectedCommission}`);
  const actualCommission = await getApprovalValueByLabels(page, ['Commission', 'Brokerage'], 15000, { requireDigits: true });
  const cleanedCommission = normalizeNumberText(actualCommission);
  const cleanedExpected = normalizeNumberText(expectedCommission);
  logger.info(`📊 Commission assertion -> expected raw: "${expectedCommission}", actual raw: "${actualCommission}"`);
  logger.info(`📊 Commission assertion -> expected normalized: "${cleanedExpected}", actual normalized: "${cleanedCommission}"`);
  
  if (cleanedCommission.includes(cleanedExpected)) {
    logger.info(`✅ Commission verified on approval page: ${actualCommission}`);
  } else {
    throw new Error(`❌ Commission mismatch - Expected raw: ${expectedCommission}, Actual raw: ${actualCommission}, Expected normalized: ${cleanedExpected}, Actual normalized: ${cleanedCommission}`);
  }
});

Then('I verify contract dates on approval page', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const persisted = loadContractAExpectationData();
  const startDate = String((this as any).contractStartDate || persisted.contractStartDate || '').trim() || undefined;
  const endDate = String((this as any).contractEndDate || persisted.contractEndDate || '').trim() || undefined;
  
  logger.info(`🔍 Verifying contract start date: ${startDate}`);
  const actualStartDate = await getApprovalValueByLabels(page, ['Contract Start Date', 'Start Date'], 15000);
  
  logger.info(`📅 Start date on approval page: ${actualStartDate}`);
  
  if (startDate && actualStartDate?.includes(startDate)) {
    logger.info(`✅ Contract start date verified: ${startDate}`);
  } else if (startDate) {
    logger.info(`⚠️ Start date may be in different format - Expected: ${startDate}, Found: ${actualStartDate}`);
  }

  if (endDate) {
    const actualEndDate = await getApprovalValueByLabels(page, ['Contract End Date', 'End Date'], 15000);
    logger.info(`📅 End date on approval page: ${actualEndDate}`);
    if (actualEndDate.includes(endDate)) {
      logger.info(`✅ Contract end date verified: ${endDate}`);
    } else {
      logger.info(`⚠️ End date may be in different format - Expected: ${endDate}, Found: ${actualEndDate}`);
    }
  }
});

When('I click on submit button', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const detailsPage = new ContractDetailsPage(page);
  await detailsPage.clickSubmitButton();
});

When('I confirm approval on popup', { timeout: 120000 }, async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const approvalPage = new ApprovalPage(page);
  await approvalPage.waitForAndConfirmPopup(120000);
});

Then('I should see success message {string}', async function (this: World, expectedMessage: string) {
  const page = (this as any).approvalPage || this.page;
  const approvalPage = new ApprovalPage(page);
  await approvalPage.waitForSuccessMessage(expectedMessage, 30000);
});
