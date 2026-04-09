import { Then, When } from '@cucumber/cucumber';
import * as fs from 'fs';
import * as path from 'path';
import { World } from '../../support/world';
import { logger } from '../../utils/logger';
import { waitForPageStable } from '../../utils/waitHelper';
import { ContractDetailsPage } from '../../pages/ContractDetailsPage';
import { ApprovalPage } from '../../pages/ApprovalPage';
import type { Page } from '@playwright/test';

/** Collect all distinct dubailand.gov.ae/r/ approval links from the page (fast, no XPath). */
async function collectApprovalLinks(page: Page): Promise<string[]> {
  const sanitize = (raw: string): string => {
    let link = raw.trim().replace(/Send$/i, '');
    if (link.startsWith('/')) link = `https://dubailand.gov.ae${link}`;
    return link;
  };

  const anchorCandidates = page.locator('a[href*="/r/"]');
  const count = await anchorCandidates.count();
  const links: string[] = [];

  for (let i = 0; i < count; i++) {
    const href = (await anchorCandidates.nth(i).getAttribute('href').catch(() => null)) || '';
    if (href.includes('/r/')) links.push(sanitize(href));
  }

  // Fallback: scan body text for /r/ URLs in case they are plain text, not anchors
  if (links.length < 2) {
    const bodyText = (await page.locator('body').textContent().catch(() => '')) || '';
    const textMatches = bodyText.match(/https:\/\/dubailand\.gov\.ae\/r\/[A-Za-z0-9_-]{8,20}(?:Send)?/g) || [];
    for (const m of textMatches) {
      const sanitized = sanitize(m);
      if (!links.includes(sanitized)) links.push(sanitized);
    }
  }

  return links;
}

async function closeDetailsPopupIfVisible(page: Page): Promise<boolean> {
  const closeBtn = page.locator('.btn.btn-dark.btn-agree').first();
  const closeVisible = await closeBtn.isVisible().catch(() => false);
  if (closeVisible) {
    await closeBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
    return true;
  }

  const altBtn = page.locator('button.btn-agree, [class*="btn-agree"]').first();
  const altVisible = await altBtn.isVisible().catch(() => false);
  if (altVisible) {
    await altBtn.click({ force: true }).catch(() => {});
    await page.waitForTimeout(400);
    return true;
  }

  return false;
}

function ensureUploadSampleFiles(): string[] {
  const uploadsDir = path.join(process.cwd(), 'tests', 'resources', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const existingPdf = path.join(uploadsDir, 'sample-document.pdf');
  const samplePng = path.join(uploadsDir, 'sample-image.png');
  const sampleJpg = path.join(uploadsDir, 'sample-photo.jpg');

  if (!fs.existsSync(samplePng)) {
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7Yx1cAAAAASUVORK5CYII=';
    fs.writeFileSync(samplePng, Buffer.from(pngBase64, 'base64'));
  }

  if (!fs.existsSync(sampleJpg)) {
    const jpgBase64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAVAQEBAAAAAAAAAAAAAAAAAAABAv/aAAwDAQACEAMQAAAB6gD/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AYf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AYf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Apf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/Idf/2gAMAwEAAgADAAAAEP/EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQMBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQIBAT8QH//EABQRAQAAAAAAAAAAAAAAAAAAABD/2gAIAQEAAT8QH//Z';
    fs.writeFileSync(sampleJpg, Buffer.from(jpgBase64, 'base64'));
  }

  const files = [existingPdf, samplePng, sampleJpg].filter((filePath) => fs.existsSync(filePath));
  if (files.length === 0) {
    throw new Error('No upload sample files available in tests/resources/uploads');
  }
  return files;
}

function getContractDataPath(): string {
  return path.join(process.cwd(), 'contract-data.json');
}

function readContractData(): Record<string, any> {
  const contractFilePath = getContractDataPath();
  if (!fs.existsSync(contractFilePath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(contractFilePath, 'utf-8'));
  } catch {
    return {};
  }
}

function writeContractData(data: Record<string, any>): void {
  fs.writeFileSync(getContractDataPath(), JSON.stringify(data, null, 2));
}

function normalizeContractFDataSetKey(dataSetKey: string): string {
  return String(dataSetKey || '').trim().toLowerCase();
}

function getContractFDataSetKey(world?: World): string {
  const key = normalizeContractFDataSetKey(String((world as any)?.contractFDataSetKey || ''));
  return key || 'default';
}

function getStringMap(data: Record<string, any>, fieldName: string): Record<string, string> {
  const value = data[fieldName];
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [key, String(entryValue || '').trim()])
  );
}

When('broker enters the created Contract F number', async function (this: World) {
  const contractFilePath = getContractDataPath();

  if (!fs.existsSync(contractFilePath)) {
    throw new Error(`contract-data.json not found at ${contractFilePath}. Run Contract F create flow first.`);
  }

  let contractNumber = '';
  try {
    const data = readContractData();
    const dataSetKey = getContractFDataSetKey(this);
    const preparedByDataSet = getStringMap(data, 'preparedContractFNumbersByDataSet');
    const contractFByDataSet = getStringMap(data, 'contractFNumbersByDataSet');
    const prepared = String(preparedByDataSet[dataSetKey] || data.preparedContractFNumber || '').trim();
    const cfNum = String(contractFByDataSet[dataSetKey] || data.contractFNumber || '').trim();
    const fallback = String(data.contractNumber || '').trim();
    contractNumber = /^CF/i.test(prepared)
      ? prepared
      : /^CF/i.test(cfNum)
        ? cfNum
        : /^CF/i.test(fallback)
          ? fallback
          : '';
  } catch (error) {
    throw new Error(`Unable to read latest Contract F number from contract-data.json: ${error}`);
  }

  if (!contractNumber || !/^CF/i.test(contractNumber)) {
    throw new Error(`Valid Contract F number (must start with CF) not found in contract-data.json. Run Contract F create flow first. Found: "${contractNumber}"`);
  }

  logger.info(`📂 Contract F number loaded from file: ${contractNumber}`);

  const contractInput = this.page
    .locator('xpath=//label[normalize-space()="Contract number"]/ancestor::div[contains(@class,"form-group")]//input[1]')
    .first();
  await contractInput.waitFor({ state: 'visible', timeout: 15000 });
  await contractInput.fill(contractNumber);

  (this as any).contractFNumber = contractNumber;
  (this as any).contractNumber = contractNumber;
  logger.info(`🔎 Entered Contract F number for search: ${contractNumber}`);
});

When('broker clicks on Search button to find contract F', async function (this: World) {
  const contractNumber = (this as any).contractNumber;
  const contractTypeDropdown = this.page.locator('#react-select-2-input').first();
  const contractInput = this.page
    .locator('xpath=//label[normalize-space()="Contract number"]/ancestor::div[contains(@class,"form-group")]//input[1]')
    .first();

  if (await contractTypeDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
    await contractTypeDropdown.click({ force: true }).catch(() => {});
    await contractTypeDropdown.fill('Contract F').catch(() => {});
    await contractTypeDropdown.press('Enter').catch(() => {});
    logger.info('📑 Selected Contract Type filter: Contract F');
  }

  await contractInput.waitFor({ state: 'visible', timeout: 10000 });
  await contractInput.fill(contractNumber);
  logger.info(`🔁 Re-entered Contract F number after filter selection: ${contractNumber}`);

  // Primary: press Enter on input (more reliable than button click for search forms)
  await contractInput.press('Enter');
  await waitForPageStable(this.page, 4000).catch(() => {});

  // Verify results appeared; if not, try clicking the search button
  const resultsAppeared = await this.page.locator('table tbody tr').first().isVisible({ timeout: 3000 }).catch(() => false);
  if (!resultsAppeared) {
    logger.info('ℹ️ Enter did not trigger search — trying button click');
    const buttonClicked = await this.page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const searchBtn = btns.find((b) => /search/i.test((b as HTMLButtonElement).textContent || ''));
      if (searchBtn) { (searchBtn as HTMLButtonElement).click(); return true; }
      return false;
    });
    if (!buttonClicked) {
      const searchButton = this.page.getByRole('button', { name: /search/i }).first();
      await searchButton.waitFor({ state: 'visible', timeout: 10000 });
      await searchButton.click({ force: true });
    }
    await waitForPageStable(this.page, 5000).catch(() => {});
  }
  logger.info('🔍 Submitted Contract F search');
});

When('broker clicks on searched Contract F result', { timeout: 90000 }, async function (this: World) {
  const contractNumber = (this as any).contractNumber;
  const searchPageUrl = this.page.url();
  const resultRowByNumber = this.page.locator(`table tbody tr:has-text("${contractNumber}")`).first();
  const resultCellByNumber = resultRowByNumber.locator('td').first();

  const searchDeadline = Date.now() + 90000;
  let clicked = false;

  while (Date.now() < searchDeadline && !clicked) {
    if (await resultCellByNumber.isVisible().catch(() => false)) {
      const rowText = ((await resultRowByNumber.textContent().catch(() => '')) || '').trim();
      if (!rowText.includes(contractNumber)) {
        await this.page.waitForTimeout(1500);
        await waitForPageStable(this.page, 5000).catch(() => {});
        continue;
      }

      await resultRowByNumber.click({ force: true }).catch(async () => {
        await resultCellByNumber.click({ force: true });
      });
      await this.page.waitForTimeout(500);
      await waitForPageStable(this.page, 10000).catch(() => {});

      const currentUrlAfterClick = this.page.url();
      let landedOnDetails =
        currentUrlAfterClick !== searchPageUrl ||
        (await this.page.locator('#edit_contract').isVisible().catch(() => false)) ||
        (await this.page.locator('a[href*="/r/"]').count().catch(() => 0)) > 0 ||
        (await this.page.getByText(/seller approval link|buyer approval link/i).first().isVisible().catch(() => false)) ||
        !(await this.page.locator('h3:has-text("Search Results")').first().isVisible().catch(() => false));

      if (!landedOnDetails) {
        logger.info('⚠️ First click did not navigate, trying double-click on row');
        await resultRowByNumber.dblclick({ force: true }).catch(async () => {
          await resultCellByNumber.dblclick({ force: true }).catch(() => {});
        });
        await this.page.waitForTimeout(500);
        await waitForPageStable(this.page, 10000).catch(() => {});

        const currentUrlAfterDoubleClick = this.page.url();
        landedOnDetails =
          currentUrlAfterDoubleClick !== searchPageUrl ||
          (await this.page.locator('#edit_contract').isVisible().catch(() => false)) ||
          (await this.page.locator('a[href*="/r/"]').count().catch(() => 0)) > 0 ||
          (await this.page.getByText(/seller approval link|buyer approval link/i).first().isVisible().catch(() => false)) ||
          !(await this.page.locator('h3:has-text("Search Results")').first().isVisible().catch(() => false));
      }

      if (landedOnDetails) {
        clicked = true;
        logger.info(`✅ Opened searched Contract F result for: ${contractNumber}`);
        break;
      }

      logger.info('⚠️ Still on search results after click attempt, retrying...');
      await this.page.waitForTimeout(500);
    }

    await this.page.waitForTimeout(1000);
    await waitForPageStable(this.page, 5000).catch(() => {});
  }

  if (!clicked) {
    const visibleRows = await this.page.locator('table tbody tr').allTextContents().catch(() => [] as string[]);
    logger.info(`ℹ️ Visible search rows while looking for Contract F "${contractNumber}": ${visibleRows.map((row) => row.replace(/\s+/g, ' ').trim()).join(' | ')}`);
    throw new Error(`Contract F search result did not appear for contract number: ${contractNumber}`);
  }

  await waitForPageStable(this.page);
});

Then('broker should see Contract F details page with seller and buyer approval links', { timeout: 120000 }, async function (this: World) {
  const detailsPage = new ContractDetailsPage(this.page);
  const contractNumber = String((this as any).contractFNumber || (this as any).contractNumber || '').trim();

  const approvalLinkCount = await detailsPage.verifyApprovalLinkCount(2);

  if (contractNumber) {
    const detailsContractNumberLocator = this.page.locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[1]/div/div[2]/h4');
    await detailsContractNumberLocator.waitFor({ state: 'visible', timeout: 8000 });

    const detailsContractNumberText = ((await detailsContractNumberLocator.textContent()) || '').trim();
    const normalizedExpected = contractNumber.replace(/\s+/g, '').trim();
    const normalizedActual = detailsContractNumberText.replace(/\s+/g, '').trim();

    if (!normalizedActual.includes(normalizedExpected)) {
      throw new Error(
        `Contract number mismatch on details page. Expected to include "${contractNumber}", but found "${detailsContractNumberText}"`
      );
    }

    logger.info(`✅ Contract number matched on details page at h4: ${detailsContractNumberText}`);
  }

  // Cache the approval links for later use (Seller = index 0, Buyer = index 1)
  const cachedLinks = await collectApprovalLinks(this.page);
  if (cachedLinks.length < 2) {
    throw new Error(`Expected seller and buyer approval links on Contract F details page, but found ${cachedLinks.length}: ${cachedLinks.join(', ')}`);
  }
  (this as any).cachedApprovalLinks = cachedLinks;
  logger.info(`💾 Cached ${cachedLinks.length} approval link(s) for Seller/Buyer steps`);

  logger.info(`✅ Contract F details page validated with ${approvalLinkCount} approval link(s)`);
});

When('broker opens Seller approval link for Contract F', { timeout: 120000 }, async function (this: World) {
  // Collect all /r/ approval links from the details page (first = Seller)
  const allApprovalLinks = await collectApprovalLinks(this.page);
  if (allApprovalLinks.length === 0) {
    throw new Error('No approval links (dubailand.gov.ae/r/...) found on Contract F details page for Seller');
  }

  const approvalUrl = allApprovalLinks[0];
  logger.info(`🔗 Seller Approval link (index 0 of ${allApprovalLinks.length}): ${approvalUrl}`);

  logger.info('🌐 Opening Contract F Seller approval link in new tab');
  const approvalTab = await this.page.context().newPage();
  await approvalTab.goto(approvalUrl, { waitUntil: 'load', timeout: 60000 });
  await waitForPageStable(approvalTab, 15000).catch(() => {});

  (this as any).approvalPage = approvalTab;
  logger.info('✅ Contract F Seller approval signatory page opened');
});

When('broker opens Buyer approval link for Contract F', { timeout: 120000 }, async function (this: World) {
  const detailsTab = this.page;
  await detailsTab.bringToFront();

  const closeBtn = detailsTab.locator('.btn.btn-dark.btn-agree').first();
  const closeVisible = await closeBtn.isVisible().catch(() => false);
  if (closeVisible) {
    await closeBtn.click({ force: true }).catch(() => {});
    await detailsTab.waitForTimeout(400);
    logger.info('❌ Closed popup message before opening Buyer Approval link');
  }

  // Collect all /r/ approval links from the details page (second = Buyer)
  // Note: After Seller approval, the Seller link may be grayed out/removed
  let allApprovalLinks: string[] = (this as any).cachedApprovalLinks || [];
  if (allApprovalLinks.length === 0) {
    logger.info('ℹ️ No cached links found, recollecting from details page...');
    allApprovalLinks = await collectApprovalLinks(detailsTab);
  }

  // If we have 2+ cached links: index 1 is Buyer; otherwise: index 0 (only Buyer remains)
  let buyerIndex = allApprovalLinks.length >= 2 ? 1 : 0;
  if (buyerIndex >= allApprovalLinks.length) {
    throw new Error(`No Buyer approval link found. Cached links: ${allApprovalLinks.join(', ')}`);
  }

  const approvalUrl = allApprovalLinks[buyerIndex];
  logger.info(`🔗 Buyer Approval link (index ${buyerIndex} of ${allApprovalLinks.length}): ${approvalUrl}`);

  logger.info('🌐 Opening Contract F Buyer approval link in new tab');
  const approvalTab = await this.page.context().newPage();
  await approvalTab.goto(approvalUrl, { waitUntil: 'load', timeout: 60000 });
  await waitForPageStable(approvalTab, 15000).catch(() => {});

  (this as any).approvalPage = approvalTab;
  logger.info('✅ Contract F Buyer approval signatory page opened');
});

Then('signatory page loads and broker clicks Get Token for Contract F', { timeout: 120000 }, async function (this: World) {
  const approvalTab = (this as any).approvalPage || this.page;
  await waitForPageStable(approvalTab, 15000).catch(() => {});

  const approvalPage = new ApprovalPage(approvalTab);
  const contractNumber = String((this as any).contractFNumber || (this as any).contractNumber || '').trim();

  logger.info('🔘 Triggering Get Token/Verify flow on Contract F signatory page');
  await approvalPage.handleOTPVerification(contractNumber, { requireTokenRequest: true });
  logger.info('✅ Get Token/Verify flow completed on Contract F signatory page');
});

Then('broker should see searched Contract F number on signatory page', { timeout: 120000 }, async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const expectedContractNumber = String((this as any).contractFNumber || (this as any).contractNumber || '').trim();

  const contractNumberLocator = page.locator('xpath=/html/body/div[3]/div/div[4]/div[2]/table/tbody/tr[1]/td/label[2]').first();
  await contractNumberLocator.waitFor({ state: 'visible', timeout: 30000 });

  const actualContractNumber = ((await contractNumberLocator.textContent()) || '').trim();
  const normalizedExpected = expectedContractNumber.replace(/\s+/g, '').trim();
  const normalizedActual = actualContractNumber.replace(/\s+/g, '').trim();

  if (!normalizedActual.includes(normalizedExpected)) {
    throw new Error(
      `Contract F number mismatch on signatory page. Expected to include "${expectedContractNumber}", but found "${actualContractNumber}"`
    );
  }

  logger.info(`✅ Contract F number verified on signatory page: ${actualContractNumber}`);
});

When('broker accepts terms and conditions on Contract F signatory page', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const detailsPage = new ContractDetailsPage(page);
  await detailsPage.clickTermsCheckbox();
  logger.info('☑️ Accepted terms on Contract F signatory page');
});

When('broker submits Contract F approval', async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const detailsPage = new ContractDetailsPage(page);
  await detailsPage.clickSubmitButton();
  logger.info('📨 Submitted Contract F approval');
});

When('broker confirms approval on popup for Contract F', { timeout: 120000 }, async function (this: World) {
  const page = (this as any).approvalPage || this.page;
  const detailsPage = new ContractDetailsPage(page);
  await detailsPage.clickConfirmYesButton();
  await waitForPageStable(page, 15000).catch(() => {});
  logger.info('✅ Confirmed Contract F approval popup');
});

Then('broker should see Contract F approval success message {string}', { timeout: 120000 }, async function (this: World, expectedMessage: string) {
  const page = (this as any).approvalPage || this.page;
  const successHeading = page.locator('xpath=/html/body/div[3]/div/div/div/h4').first();

  await successHeading.waitFor({ state: 'visible', timeout: 90000 });

  const firstTextNode = await successHeading.evaluate((element: HTMLElement) => {
    const firstText = Array.from(element.childNodes).find(
      (node): node is Text => node.nodeType === Node.TEXT_NODE
    );
    return firstText?.textContent?.trim() || '';
  });

  const normalizedExpected = expectedMessage.replace(/\s+/g, ' ').trim();
  const normalizedActual = firstTextNode.replace(/\s+/g, ' ').trim();

  if (normalizedActual !== normalizedExpected) {
    throw new Error(
      `Contract F approval success message mismatch. Expected "${expectedMessage}", actual first text node was "${firstTextNode}"`
    );
  }

  if (/All parties have completed their signatures\./i.test(normalizedActual)) {
    const approvedContractFNumber = String((this as any).contractFNumber || (this as any).contractNumber || '').trim();
    if (/^CF/i.test(approvedContractFNumber)) {
      const existingData = readContractData();
      const dataSetKey = getContractFDataSetKey(this);
      const preparedContractFNumbersByDataSet = getStringMap(existingData, 'preparedContractFNumbersByDataSet');
      const contractFNumbersByDataSet = getStringMap(existingData, 'contractFNumbersByDataSet');
      const lastApprovedContractFNumbersByDataSet = getStringMap(existingData, 'lastApprovedContractFNumbersByDataSet');
      preparedContractFNumbersByDataSet[dataSetKey] = approvedContractFNumber;
      contractFNumbersByDataSet[dataSetKey] = approvedContractFNumber;
      lastApprovedContractFNumbersByDataSet[dataSetKey] = approvedContractFNumber;

      writeContractData({
        ...existingData,
        preparedContractFNumbersByDataSet,
        contractFNumbersByDataSet,
        lastApprovedContractFNumbersByDataSet,
        preparedContractFNumber: approvedContractFNumber,
        contractFNumber: approvedContractFNumber,
        contractNumber: approvedContractFNumber,
        lastApprovedContractFNumber: approvedContractFNumber,
        lastUpdatedAt: new Date().toISOString()
      });
      logger.info(`💾 Stored last approved Contract F number: ${approvedContractFNumber} under data set key "${dataSetKey}"`);
    }
  }

  logger.info(`✅ Contract F approval success verified: ${firstTextNode}`);
});

Then('broker returns to Contract F details tab and verifies seller approval date is today', { timeout: 120000 }, async function (this: World) {
  const detailsTab = this.page;
  const sellerApprovalDateXPath =
    '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[3]/div/div[3]/div/div[2]/div/div[2]/div[1]/div[3]/div/div[2]/div/div/span';

  await detailsTab.bringToFront();
  const deadline = Date.now() + 120000;
  let dateMatched = false;
  let lastObservedDateText = '';

  const now = new Date();
  const todayDubai = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Dubai',
  }).format(now);

  const [day, month, year] = todayDubai.split('/');
  const todayDubaiNoPadding = `${Number(day)}/${Number(month)}/${year}`;
  const todayDubaiDash = `${day}-${month}-${year}`;
  const acceptedTodayFormats = [todayDubai, todayDubaiNoPadding, todayDubaiDash];

  while (Date.now() < deadline && !dateMatched) {
    await detailsTab.reload({ waitUntil: 'load', timeout: 60000 });
    await waitForPageStable(detailsTab, 15000).catch(() => {});
    const popupClosed = await closeDetailsPopupIfVisible(detailsTab);
    if (popupClosed) {
      logger.info('❌ Closed popup message after refresh on Contract F details');
    }

    const approvalDateNode = detailsTab.locator(`xpath=${sellerApprovalDateXPath}`).first();
    const approvalDateNodeCount = await approvalDateNode.count().catch(() => 0);
    if (approvalDateNodeCount === 0) {
      logger.info('⏳ Seller approval date node not found yet after refresh, waiting for update...');
      await detailsTab.waitForTimeout(5000);
      continue;
    }

    const visible = await approvalDateNode.isVisible().catch(() => false);
    if (!visible) {
      logger.info('⏳ Seller approval date node not visible yet after refresh, waiting for update...');
      await detailsTab.waitForTimeout(5000);
      continue;
    }

    const nodeText = ((await approvalDateNode.textContent().catch(() => '')) || '').trim();
    lastObservedDateText = nodeText;

    dateMatched = acceptedTodayFormats.some((dateFormat) => nodeText.includes(dateFormat));

    if (!dateMatched) {
      logger.info(
        `⏳ Seller approval date not updated to today yet. Found "${nodeText}", expected one of: ${acceptedTodayFormats.join(', ')}`
      );
      await detailsTab.waitForTimeout(5000);
    }
  }

  if (!dateMatched) {
    throw new Error(
      `Seller approval date did not update to today. Last observed text at XPath was "${lastObservedDateText}".`
    );
  }

  logger.info(`✅ Seller approval date updated to today on refreshed Contract F details page (${todayDubai})`);
});

When('broker refreshes Contract F details page again', { timeout: 90000 }, async function (this: World) {
  await this.page.bringToFront();
  await this.page.reload({ waitUntil: 'load', timeout: 60000 });
  await waitForPageStable(this.page, 12000).catch(() => {});
  logger.info('🔄 Refreshed Contract F details page again');
});

When('broker closes popup message on Contract F details page', async function (this: World) {
  const popupClosed = await closeDetailsPopupIfVisible(this.page);
  if (popupClosed) {
    logger.info('❌ Closed popup message on Contract F details page');
  } else {
    logger.info('ℹ️ No popup message visible on Contract F details page');
  }
});

Then('broker verifies Contract F number on details page', async function (this: World) {
  const expectedContractNumber = String((this as any).contractFNumber || (this as any).contractNumber || '').trim();
  if (!expectedContractNumber) {
    throw new Error('Contract F number not available in world context for details verification.');
  }

  const detailsContractNumberLocator = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[1]/div/div[2]/h4')
    .first();
  await detailsContractNumberLocator.waitFor({ state: 'visible', timeout: 10000 });

  const detailsContractNumberText = ((await detailsContractNumberLocator.textContent()) || '').trim();
  const normalizedExpected = expectedContractNumber.replace(/\s+/g, '').trim();
  const normalizedActual = detailsContractNumberText.replace(/\s+/g, '').trim();

  if (!normalizedActual.includes(normalizedExpected)) {
    throw new Error(
      `Contract F number mismatch on details page. Expected to include "${expectedContractNumber}", but found "${detailsContractNumberText}"`
    );
  }

  logger.info(`✅ Contract F number verified on details page: ${detailsContractNumberText}`);
});

Then('broker should see Required Documents for RT Office section on Contract F details page', async function (this: World) {
  const requiredDocsHeader = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div[1]/h3')
    .first();

  await requiredDocsHeader.waitFor({ state: 'visible', timeout: 15000 });
  const headerText = ((await requiredDocsHeader.textContent()) || '').replace(/\s+/g, ' ').trim();
  if (!/Required Documents for RT Office/i.test(headerText)) {
    throw new Error(`Expected "Required Documents for RT Office" section heading, but found "${headerText}"`);
  }

  logger.info(`✅ Required documents section visible: ${headerText}`);
});

When('broker clicks Proceed to upload button on Contract F details page', async function (this: World) {
  const preClickUrl = this.page.url();
  const proceedBtn = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div[1]/div/button[2]')
    .first();

  await proceedBtn.waitFor({ state: 'visible', timeout: 15000 });
  const popupPromise = this.page.context().waitForEvent('page', { timeout: 7000 }).catch(() => null);
  await proceedBtn.click({ force: true });
  const uploadPage = await popupPromise;

  if (uploadPage) {
    await uploadPage.waitForLoadState('domcontentloaded', { timeout: 20000 }).catch(() => {});
    await waitForPageStable(uploadPage, 12000).catch(() => {});
    (this as any).uploadDocsPage = uploadPage;
    (this as any).uploadDocsPreClickUrl = preClickUrl;
    logger.info('🗂️ Proceed to upload opened in new tab');
  } else {
    await waitForPageStable(this.page, 12000).catch(() => {});
    (this as any).uploadDocsPage = this.page;
    (this as any).uploadDocsPreClickUrl = preClickUrl;
    logger.info('🗂️ Proceed to upload opened in same tab');
  }

  logger.info('➡️ Clicked Proceed to upload button on Contract F details page');
});

Then('system should redirect broker to upload documents screen for Contract F', { timeout: 90000 }, async function (this: World) {
  const page = (this as any).uploadDocsPage || this.page;
  const preClickUrl = String((this as any).uploadDocsPreClickUrl || '').trim();
  await page.bringToFront().catch(() => {});
  await waitForPageStable(page, 10000).catch(() => {});

  const deadline = Date.now() + 45000;
  let detected = false;
  let detectionReason = '';

  while (Date.now() < deadline && !detected) {
    const currentUrl = page.url();
    const urlChanged = !!preClickUrl && currentUrl !== preClickUrl;
    const urlLooksUpload = /upload|document|attachment/i.test(currentUrl);

    const detection = await page.evaluate(() => {
      const isVisible = (element: Element | null): boolean => {
        if (!element) return false;
        const style = window.getComputedStyle(element as HTMLElement);
        return style.display !== 'none' && style.visibility !== 'hidden' && (element as HTMLElement).offsetParent !== null;
      };

      const requiredDocsHeader = Array.from(document.querySelectorAll('h2,h3,h4')).find((el) => {
        const text = ((el as HTMLElement).innerText || '').replace(/\s+/g, ' ').trim();
        return /Required Documents for RT Office/i.test(text) && isVisible(el);
      });
      const requiredDocsHeaderVisible = !!requiredDocsHeader;

      const fileDropZones = Array.from(document.querySelectorAll('#file-drop-zone, [id*="file-drop-zone"], section div[tabindex="0"]'));
      const fileDropZoneCount = fileDropZones.length;

      const hiddenFileInputsCount = Array.from(document.querySelectorAll('input[type="file"]')).length;

      const visibleFileInputs = Array.from(document.querySelectorAll('input[type="file"]')).filter((input) => isVisible(input)).length;
      const visibleUploadButtons = Array.from(document.querySelectorAll('button,[role="button"]')).filter((btn) => {
        if (!isVisible(btn)) return false;
        const text = ((btn as HTMLElement).innerText || '').replace(/\s+/g, ' ').trim();
        return /upload|choose file|browse|attach/i.test(text);
      }).length;

      const activateBtnVisible = Array.from(document.querySelectorAll('button')).some((btn) => {
        if (!isVisible(btn)) return false;
        const text = ((btn as HTMLElement).innerText || '').replace(/\s+/g, ' ').trim();
        return /^activate$/i.test(text);
      });

      const proceedBtnVisible = Array.from(document.querySelectorAll('button')).some((btn) => {
        if (!isVisible(btn)) return false;
        const text = ((btn as HTMLElement).innerText || '').replace(/\s+/g, ' ').trim();
        return /proceed to upload/i.test(text);
      });

      return {
        requiredDocsHeaderVisible,
        fileDropZoneCount,
        hiddenFileInputsCount,
        visibleFileInputs,
        visibleUploadButtons,
        activateBtnVisible,
        proceedBtnVisible,
      };
    }).catch(() => ({ requiredDocsHeaderVisible: false, fileDropZoneCount: 0, hiddenFileInputsCount: 0, visibleFileInputs: 0, visibleUploadButtons: 0, activateBtnVisible: false, proceedBtnVisible: false }));

    if (urlChanged && urlLooksUpload) {
      detected = true;
      detectionReason = `URL changed to upload/documents page (${currentUrl})`;
      break;
    }

    if (detection.visibleFileInputs > 0) {
      detected = true;
      detectionReason = `Visible file inputs found (${detection.visibleFileInputs})`;
      break;
    }

    if (detection.visibleUploadButtons > 0 && !detection.proceedBtnVisible) {
      detected = true;
      detectionReason = `Visible upload controls found (${detection.visibleUploadButtons})`;
      break;
    }

    if (detection.requiredDocsHeaderVisible && detection.fileDropZoneCount > 0) {
      detected = true;
      detectionReason = `Required Documents section loaded with ${detection.fileDropZoneCount} upload block(s)`;
      break;
    }

    if (detection.hiddenFileInputsCount > 0 && detection.activateBtnVisible) {
      detected = true;
      detectionReason = `Upload document controls present (file inputs: ${detection.hiddenFileInputsCount}, Activate button visible)`;
      break;
    }

    await page.waitForTimeout(1000);
    await waitForPageStable(page, 3000).catch(() => {});
  }

  if (!detected) {
    const bodyPreview = ((await page.locator('body').textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    throw new Error(`Upload documents screen not detected after clicking Proceed to upload. URL: ${page.url()} Body preview: ${bodyPreview}`);
  }

  const uploadAlertContainer = page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div[1]')
    .first();
  await uploadAlertContainer.waitFor({ state: 'visible', timeout: 15000 });

  const uploadAlertText = ((await uploadAlertContainer.textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
  const expectedUploadAlert = 'You are required to present orignal documents during your visit at the RT office.';
  if (!uploadAlertText.includes(expectedUploadAlert)) {
    throw new Error(`Expected upload documents alert to include "${expectedUploadAlert}", but found "${uploadAlertText}"`);
  }

  logger.info(`✅ Redirected to upload documents screen (${detectionReason})`);
  logger.info(`✅ Upload documents alert verified at target XPath: ${expectedUploadAlert}`);
});

Then('broker scans required documents count and locators on upload documents screen for Contract F', async function (this: World) {
  const page = (this as any).uploadDocsPage || this.page;
  await page.bringToFront().catch(() => {});
  await waitForPageStable(page, 10000).catch(() => {});

  const docs = await page.evaluate(() => {
    const cssPath = (element: Element): string => {
      const parts: string[] = [];
      let node: Element | null = element;
      while (node && node.nodeType === Node.ELEMENT_NODE && parts.length < 6) {
        const tag = node.tagName.toLowerCase();
        const id = (node as HTMLElement).id;
        if (id) {
          parts.unshift(`${tag}#${id}`);
          break;
        }
        const cls = ((node as HTMLElement).className || '').toString().trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
        const segment = cls ? `${tag}.${cls}` : tag;
        parts.unshift(segment);
        node = node.parentElement;
      }
      return parts.join(' > ');
    };

    const rows = Array.from(document.querySelectorAll('#file-drop-zone, [id*="file-drop-zone"], section div[tabindex="0"]'));
    const matches: Array<{ label: string; locator: string }> = [];

    for (const row of rows) {
      const container = row.closest('.col-md-6, .col-sm-6, .col-xs-12') || row.parentElement || row;
      const labelNode = container.querySelector('p, label, span, strong, h4, h3') || row;
      const labelText = ((labelNode.textContent || '').replace(/\s+/g, ' ').trim()).slice(0, 180);
      if (!labelText) continue;

      const hasFileInput = !!container.querySelector('input[type="file"]') || !!row.querySelector('input[type="file"]');
      if (!hasFileInput) continue;

      matches.push({ label: labelText, locator: cssPath(container) });
    }

    const dedup = new Map<string, { label: string; locator: string }>();
    for (const item of matches) {
      const key = `${item.label}||${item.locator}`;
      if (!dedup.has(key)) dedup.set(key, item);
    }

    return Array.from(dedup.values());
  });

  logger.info(`📄 Required document blocks detected on upload screen: ${docs.length}`);
  docs.forEach((doc, index) => {
    logger.info(`📌 Required Doc ${index + 1}: ${doc.label} | locator: ${doc.locator}`);
  });

  if (docs.length === 0) {
    throw new Error('No required document upload blocks detected on upload documents screen.');
  }
});

When('broker uploads different sample documents and enters titles on upload documents screen for Contract F', { timeout: 180000 }, async function (this: World) {
  const page = (this as any).uploadDocsPage || this.page;
  await page.bringToFront().catch(() => {});
  await waitForPageStable(page, 10000).catch(() => {});

  const sampleFiles = ensureUploadSampleFiles();
  logger.info(`📦 Upload samples ready: ${sampleFiles.map((p) => path.basename(p)).join(', ')}`);

  const blocks = page.locator('div.col-md-6.col-sm-6.col-xs-12:has(input[type="file"])');
  const blockCount = await blocks.count();
  if (!blockCount) {
    throw new Error('No upload blocks with file inputs found on upload documents screen.');
  }

  let uploadedCount = 0;
  let titledCount = 0;

  for (let i = 0; i < blockCount; i++) {
    const block = blocks.nth(i);
    const fileInput = block.locator('input[type="file"]').first();

    const label = ((await block.locator('p, label, span, strong').first().textContent().catch(() => '')) || `Document ${i + 1}`)
      .replace(/\s+/g, ' ')
      .trim();

    const samplePath = sampleFiles[i % sampleFiles.length];
    await fileInput.setInputFiles(samplePath);
    uploadedCount += 1;
    logger.info(`📤 Uploaded ${path.basename(samplePath)} for "${label}"`);

    // Wait for uploaded file card + title field to render inside this block
    const titleFieldVisible = await block
      .locator('.doc-item input[maxlength], .doc-item input:not([type="file"]), label.simple-label + input, input[maxlength="50"]')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    const titleValue = `Auto-${String(i + 1).padStart(2, '0')}-${Date.now().toString().slice(-6)}`;

    const inlineTitle = block
      .locator('.doc-item input[maxlength], .doc-item input:not([type="file"]), label.simple-label + input, input[maxlength="50"], input[type="text"], textarea, input[placeholder*="title" i], input[name*="title" i], input[id*="title" i], input[placeholder*="document" i], input[name*="document" i]')
      .first();

    if (titleFieldVisible || await inlineTitle.isVisible().catch(() => false)) {
      await inlineTitle.fill(titleValue).catch(() => {});
      titledCount += 1;
      logger.info(`✍️ Entered inline title for "${label}": ${titleValue}`);
      await page.waitForTimeout(200);
      continue;
    }

    await block.click({ force: true }).catch(() => {});
    await page.waitForTimeout(250);

    const modalTitle = page
      .locator('.modal.show input[type="text"], .modal.show textarea, [role="dialog"] input[type="text"], [role="dialog"] textarea')
      .first();

    if (await modalTitle.isVisible().catch(() => false)) {
      await modalTitle.fill(titleValue).catch(() => {});
      titledCount += 1;
      logger.info(`✍️ Entered modal title for "${label}": ${titleValue}`);

      const saveBtn = page
        .locator('.modal.show button:has-text("Save"), .modal.show button:has-text("OK"), .modal.show button:has-text("Add"), [role="dialog"] button:has-text("Save"), [role="dialog"] button:has-text("OK")')
        .first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(300);
      }
      continue;
    }

    logger.info(`ℹ️ No title input found for "${label}" after upload`);
    await page.waitForTimeout(200);
  }

  if (uploadedCount === 0) {
    throw new Error('No documents were uploaded on upload documents screen.');
  }

  if (titledCount === 0) {
    throw new Error('Documents were uploaded, but no document title input was found/filled.');
  }

  logger.info(`✅ Uploaded documents count: ${uploadedCount}; titles filled: ${titledCount}`);
});

When('broker clicks Activate button on upload documents screen for Contract F', { timeout: 60000 }, async function (this: World) {
  const page = (this as any).uploadDocsPage || this.page;
  await page.bringToFront().catch(() => {});
  await waitForPageStable(page, 8000).catch(() => {});

  const activateBtn = page.locator('xpath=//*[@id="activate"]').first();
  await activateBtn.waitFor({ state: 'visible', timeout: 20000 });
  await activateBtn.click({ force: true });

  await waitForPageStable(page, 12000).catch(() => {});
  logger.info('✅ Clicked Activate button on upload documents screen');
});

Then('upload activation page loads and broker closes popup message for Contract F', { timeout: 90000 }, async function (this: World) {
  const primaryPage = (this as any).uploadDocsPage || this.page;
  await primaryPage.bringToFront().catch(() => {});

  await primaryPage.waitForTimeout(1500);
  await waitForPageStable(primaryPage, 12000).catch(() => {});

  // Activation may keep same URL, refresh DOM, or open/update another tab.
  const contextPages = primaryPage.context().pages();
  const candidatePages = [
    primaryPage,
    this.page,
    ...contextPages,
  ].filter((p, idx, arr) => p && arr.indexOf(p) === idx);

  logger.info(`✅ Activation flow completed after Activate click (URL: ${primaryPage.url()})`);

  let popupClosed = false;
  for (const candidate of candidatePages) {
    await candidate.bringToFront().catch(() => {});
    await waitForPageStable(candidate, 4000).catch(() => {});

    const closed = await closeDetailsPopupIfVisible(candidate).catch(() => false);
    if (closed) {
      popupClosed = true;
      logger.info(`✅ Closed popup message after Activate on URL: ${candidate.url()}`);
      break;
    }
  }

  if (!popupClosed) {
    logger.info('ℹ️ No popup message appeared after Activate page load');
  }
});

Then('broker pauses on Contract F approval details for observation', { timeout: 120000 }, async function (this: World) {
  logger.info('⏸️ Pausing on Contract F approval details for 30 seconds');
  await this.page.waitForTimeout(30000);
});