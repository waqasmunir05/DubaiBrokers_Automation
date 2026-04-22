import { Page } from 'playwright';
import { logger } from '../utils/logger';

export class ContractFPage {
  constructor(private page: Page) {}

  private normalizeAmountText(value: string): string {
    const raw = String(value || '')
      .replace(/AED/gi, '')
      .replace(/,/g, '')
      .replace(/\s+/g, '')
      .trim();
    const match = raw.match(/-?\d+(?:\.\d+)?/);
    if (!match) {
      return '';
    }

    const parsed = Number(match[0]);
    if (Number.isNaN(parsed)) {
      return '';
    }

    return String(Math.trunc(parsed));
  }

  private normalizeDateText(value: string): string {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  async clickCreateUnifiedSaleContractF(): Promise<void> {
    const createFButtonById = this.page.locator('#create_f').first();
    await createFButtonById.waitFor({ state: 'visible', timeout: 60000 });
    await createFButtonById.scrollIntoViewIfNeeded().catch(() => {});
    await createFButtonById.click({ force: true });
    logger.info('🖱️ Clicked Create Unified Sale Contract (F)');
  }

  async selectContractBForUnifiedSaleContractF(): Promise<void> {
    const contractBChoice = this.page
      .locator('.choice', { has: this.page.locator('h6', { hasText: /Enter contract B Number/i }) })
      .first();

    await contractBChoice.waitFor({ state: 'visible', timeout: 30000 });
    await contractBChoice.click({ force: true });

    const contractBRadio = contractBChoice.locator('input[type="radio"]').first();
    if (await contractBRadio.isVisible().catch(() => false)) {
      await contractBRadio.click({ force: true });
    }

    logger.info('📄 Selected Contract B in Contract F prompt');
  }

  async enterContractBNumberInPrompt(contractBNumber: string): Promise<void> {
    const contractBInputByXPath = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div/div/div/div/div[3]/div/div/div/div/div[2]/div/div/div/input')
      .first();
    const contractBInputFallback = this.page
      .locator('.create-contract_f input[type="text"], .create-contract_f input:not([type])')
      .first();

    let contractBInput = contractBInputByXPath;
    try {
      await contractBInputByXPath.waitFor({ state: 'visible', timeout: 10000 });
    } catch {
      await contractBInputFallback.waitFor({ state: 'visible', timeout: 20000 });
      contractBInput = contractBInputFallback;
    }

    await contractBInput.fill(contractBNumber);
    logger.info(`🔎 Entered Contract B number in Contract F prompt: ${contractBNumber}`);
  }

  async clickProceedInPrompt(): Promise<void> {
    const proceedSpan = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div/div/div/div/div[3]/div/div/button/span')
      .first();

    await proceedSpan.waitFor({ state: 'visible', timeout: 20000 });
    await proceedSpan.click({ force: true });

    logger.info('▶ Clicked Proceed in Contract F prompt');
  }

  async verifyContractFCreationFormVisible(): Promise<string> {
    const heading = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[1]/div/h3')
      .first();

    await heading.waitFor({ state: 'visible', timeout: 30000 });
    const headingText = (await heading.textContent())?.trim() || '';
    if (!headingText) {
      throw new Error('Contract F creation form heading is empty');
    }

    logger.info(`✅ Contract F creation form is visible: ${headingText}`);
    return headingText;
  }

  async clickSaveAndContinue(): Promise<void> {
    const loadingOverlays = [
      this.page.locator('div[style*="position: fixed"][style*="z-index: 100002"]').first(),
      this.page.locator('.loading, .spinner, .overlay, .blockUI').first()
    ];

    for (const overlay of loadingOverlays) {
      await overlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }

    const candidates = [
      this.page.getByRole('button', { name: /save\s*&?\s*continue/i }).first(),
      this.page.locator('.create-contract_f button.buttonNext.btn.btn-continue:visible').first(),
      this.page.locator('button.buttonNext.btn.btn-continue:visible').first(),
      this.page.locator('.create-contract_f button.buttonNext.btn.btn-primary:visible').first(),
      this.page.locator('button.buttonNext.btn.btn-primary:visible').first(),
      this.page.locator('xpath=//button[contains(@class,"buttonNext") and contains(@class,"btn") and contains(@class,"btn-continue")][not(@disabled)]').first(),
      this.page.locator('xpath=//button[contains(@class,"buttonNext") and contains(@class,"btn") and contains(@class,"btn-primary")][not(contains(@style,"display: none"))]').first(),
      this.page.locator('xpath=//button[contains(@class,"buttonNext") and contains(@class,"btn") and (contains(@class,"btn-primary") or contains(@class,"btn-continue")) and contains(normalize-space(.),"Save") and contains(normalize-space(.),"Continue")]').first(),
    ];

    let clicked = false;
    for (let attempt = 0; attempt < 3 && !clicked; attempt++) {
      for (const candidate of candidates) {
        if (await candidate.isVisible().catch(() => false)) {
          await candidate.scrollIntoViewIfNeeded().catch(() => {});
          await candidate.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
          await this.page.waitForTimeout(250);

          const isDisabled = await candidate.evaluate((element) => {
            const button = element as HTMLButtonElement;
            return !!button.disabled || button.getAttribute('aria-disabled') === 'true';
          }).catch(() => false);

          if (isDisabled) {
            continue;
          }

          try {
            await candidate.click({ timeout: 5000 });
          } catch {
            try {
              await candidate.click({ force: true, timeout: 5000 });
            } catch {
              await candidate.evaluate((element) => (element as HTMLElement).click());
            }
          }

          await this.page.waitForTimeout(700);
          clicked = true;
          break;
        }
      }

      if (!clicked) {
        for (const overlay of loadingOverlays) {
          await overlay.waitFor({ state: 'hidden', timeout: 3000 }).catch(() => {});
        }
      }
    }

    if (!clicked) {
      await candidates[0].waitFor({ state: 'visible', timeout: 30000 });
      await candidates[0].scrollIntoViewIfNeeded().catch(() => {});
      try {
        await candidates[0].click({ timeout: 5000 });
      } catch {
        try {
          await candidates[0].click({ force: true, timeout: 5000 });
        } catch {
          await candidates[0].evaluate((element) => (element as HTMLElement).click());
        }
      }
    }

    logger.info('➡️ Clicked Save and Continue in Contract F form');
  }

  async verifyOwner1Heading(): Promise<string> {
    const owner1Heading = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[3]/div/div[1]/div/h2')
      .first();

    await owner1Heading.waitFor({ state: 'visible', timeout: 30000 });
    const ownerText = (await owner1Heading.textContent())?.trim() || '';
    if (!/Owner\s*1/i.test(ownerText)) {
      throw new Error(`Expected Owner 1 heading, but found: "${ownerText}"`);
    }

    logger.info(`✅ Owner details heading verified: ${ownerText}`);
    return ownerText;
  }

  async captureOwnerNameFromOwnerDetails(): Promise<string> {
    const ownerNameSpan = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[3]/div/div[2]/div/div[1]/div[1]/div/div[2]/div/div/span')
      .first();

    await ownerNameSpan.waitFor({ state: 'visible', timeout: 30000 });
    const ownerName = ((await ownerNameSpan.textContent()) || '').replace(/\s+/g, ' ').trim();
    if (!ownerName) {
      throw new Error('Owner name is empty on Contract F owner details page');
    }

    logger.info(`👤 Captured Contract F owner name: ${ownerName}`);
    return ownerName;
  }

  async verifyBuyer1Heading(): Promise<string> {
    const buyer1HeadingByXPath = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[2]/div[1]/div/h2')
      .first();
    const buyer1HeadingByText = this.page
      .locator('.create-contract_f h2', { hasText: /Buyer\s*1/i })
      .first();

    let buyer1Heading = buyer1HeadingByXPath;
    try {
      await buyer1HeadingByXPath.waitFor({ state: 'visible', timeout: 15000 });
    } catch {
      await buyer1HeadingByText.waitFor({ state: 'visible', timeout: 30000 });
      buyer1Heading = buyer1HeadingByText;
    }

    const buyerText = (await buyer1Heading.textContent())?.trim() || '';
    if (!/Buyer\s*1/i.test(buyerText)) {
      throw new Error(`Expected Buyer 1 heading, but found: "${buyerText}"`);
    }

    logger.info(`✅ Buyer details heading verified: ${buyerText}`);
    return buyerText;
  }

  async verifyBuyersShareHeading(): Promise<string> {
    const buyerShareHeading = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[1]/h2')
      .first();

    await buyerShareHeading.waitFor({ state: 'visible', timeout: 30000 });
    const shareText = (await buyerShareHeading.textContent())?.trim() || '';
    if (!/Buyer'?s\s*Share/i.test(shareText)) {
      throw new Error(`Expected Buyer's Share heading, but found: "${shareText}"`);
    }

    logger.info(`✅ Buyer's Share heading verified: ${shareText}`);
    return shareText;
  }

  async verifyTenancyInformationHeading(): Promise<string> {
    const tenancyHeading = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div/div[1]')
      .first();

    await tenancyHeading.waitFor({ state: 'visible', timeout: 30000 });
    const tenancyText = (await tenancyHeading.textContent())?.trim() || '';
    if (!/Tenancy\s*Information/i.test(tenancyText)) {
      throw new Error(`Expected Tenancy Information heading, but found: "${tenancyText}"`);
    }

    logger.info(`✅ Tenancy Information heading verified: ${tenancyText}`);
    return tenancyText;
  }

  async verifyFinancialInformationHeading(): Promise<string> {
    const financialHeading = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div/div[1]/h2')
      .first();

    await financialHeading.waitFor({ state: 'visible', timeout: 30000 });
    const financialText = (await financialHeading.textContent())?.trim() || '';
    if (!/Financial\s*Information/i.test(financialText)) {
      throw new Error(`Expected Financial Information heading, but found: "${financialText}"`);
    }

    logger.info(`✅ Financial Information heading verified: ${financialText}`);
    return financialText;
  }

  async enterSellPrice(value: string): Promise<void> {
    const sellPriceInput = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div/div[2]/div/div/div[1]/div/div[2]/div/div/div/input')
      .first();

    await sellPriceInput.waitFor({ state: 'visible', timeout: 30000 });
    await sellPriceInput.fill(value);
    logger.info(`💰 Entered Contract F sell price: ${value}`);
  }

  async enterDepositAmount(value: string): Promise<void> {
    const depositAmountInput = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div/div[2]/div/div/div[2]/div/div[2]/div/div/div/input')
      .first();

    await depositAmountInput.waitFor({ state: 'visible', timeout: 30000 });
    await depositAmountInput.fill(value);
    logger.info(`💵 Entered Contract F deposit amount: ${value}`);
  }

  async selectChequeDepositHolderByOwnerName(ownerName: string): Promise<void> {
    const dropdownByXPath = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div/div[2]/div/div/div[3]/div[1]/div/div[2]/div/div/div/div')
      .first();

    await dropdownByXPath.waitFor({ state: 'visible', timeout: 30000 });
    await dropdownByXPath.click({ force: true });

    const optionCandidates = [
      this.page.locator('div[class*="option"]', { hasText: ownerName }).first(),
      this.page.locator('[role="option"]', { hasText: ownerName }).first(),
      this.page.getByText(ownerName, { exact: false }).first(),
    ];

    let selected = false;
    for (const option of optionCandidates) {
      if (await option.isVisible().catch(() => false)) {
        await option.click({ force: true });
        selected = true;
        break;
      }
    }

    if (!selected) {
      const typeaheadInput = this.page.locator('.create-contract_f input[type="text"]').first();
      if (await typeaheadInput.isVisible().catch(() => false)) {
        await typeaheadInput.fill(ownerName);
        await this.page.keyboard.press('Enter');
        selected = true;
      }
    }

    if (!selected) {
      throw new Error(`Could not select saved owner name in Cheque Deposit Holder dropdown: "${ownerName}"`);
    }

    logger.info(`✅ Selected Cheque Deposit Holder owner: ${ownerName}`);
  }

  async selectConfiscationOfSecurityDepositYes(): Promise<void> {
    const dropdown = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div/div[2]/div/div/div[3]/div[2]/div/div[2]/div/div/div/div')
      .first();

    await dropdown.waitFor({ state: 'visible', timeout: 30000 });
    await dropdown.click({ force: true });

    const optionCandidates = [
      this.page.locator('div[class*="option"]', { hasText: /^Yes$/i }).first(),
      this.page.locator('[role="option"]', { hasText: /^Yes$/i }).first(),
      this.page.getByText(/^Yes$/, { exact: true }).first(),
    ];

    let selected = false;
    for (const option of optionCandidates) {
      if (await option.isVisible().catch(() => false)) {
        await option.click({ force: true });
        selected = true;
        break;
      }
    }

    if (!selected) {
      throw new Error('Could not select Yes for Confiscation of security deposit');
    }

    logger.info('✅ Selected Confiscation of security deposit: Yes');
  }

  async selectMortgageYes(): Promise<void> {
    const yesLabel = this.page
      .locator('label.btn.btn-default.btn-yes', { has: this.page.locator('span', { hasText: /^Yes$/i }) })
      .first();
    const yesInput = yesLabel.locator('input[type="radio"]').first();

    await yesLabel.waitFor({ state: 'visible', timeout: 30000 });
    if (await yesInput.isVisible().catch(() => false)) {
      await yesInput.click({ force: true });
    } else {
      await yesLabel.click({ force: true });
    }

    logger.info('✅ Selected Yes for mortgage on Contract F financial page');
  }

  async verifyPaymentPlanHeading(): Promise<string> {
    const paymentPlanHeading = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[1]/h2')
      .first();

    await paymentPlanHeading.waitFor({ state: 'visible', timeout: 30000 });
    const headingText = (await paymentPlanHeading.textContent())?.trim() || '';
    if (!/Payment\s*Plan/i.test(headingText)) {
      throw new Error(`Expected Payment Plan heading, but found: "${headingText}"`);
    }

    logger.info(`✅ Payment Plan heading verified: ${headingText}`);
    return headingText;
  }

  async selectRemainingAmountPaidOnTransactionDateYes(): Promise<void> {
    const yesLabel = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[2]/div[4]/div/div[2]/div/div/label[1]')
      .first();

    await yesLabel.waitFor({ state: 'visible', timeout: 30000 });
    await yesLabel.click({ force: true });
    logger.info('✅ Selected Remaining amount paid on transaction date: Yes');
  }

  async enterRandomChequeNumber(): Promise<string> {
    const chequeInput = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[3]/div/div/div[1]/div/div[2]/div/div/div/input')
      .first();

    await chequeInput.waitFor({ state: 'visible', timeout: 30000 });
    const chequeNumber = String(Math.floor(100000 + Math.random() * 900000));
    await chequeInput.fill(chequeNumber);
    logger.info(`✅ Entered random cheque number: ${chequeNumber}`);
    return chequeNumber;
  }

  async selectChequeDateDaysFromToday(daysFromToday: number): Promise<string> {
    const chequeDateInput = this.page.locator('input[placeholder="DD/MM/YYYY"]').first();

    await chequeDateInput.waitFor({ state: 'visible', timeout: 30000 });
    const selectedDate = new Date();
    selectedDate.setDate(selectedDate.getDate() + daysFromToday);

    const day = String(selectedDate.getDate()).padStart(2, '0');
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const year = selectedDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    await chequeDateInput.fill(formattedDate);
    await chequeDateInput.press('Enter').catch(() => {});
    await chequeDateInput.press('Tab').catch(() => {});
    await chequeDateInput.evaluate((element) => (element as HTMLInputElement).blur()).catch(() => {});
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(300);
    logger.info(`✅ Selected cheque date: ${formattedDate}`);
    return formattedDate;
  }

  async selectBankNameAbuDhabiIslamicBank(): Promise<void> {
    const bankName = 'Abudhabi Islamic Bank';
    const bankDropdown = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[3]/div/div/div[3]/div/div[2]/div/div/div/div/div[1]')
      .first();
    const bankInputCandidates = [
      this.page
        .locator('xpath=//label[normalize-space()="Bank Name"]/ancestor::div[contains(@class,"control-box")]//input[@aria-autocomplete="list"]')
        .first(),
      this.page.locator('input[id^="react-select-"][id$="-input"]').first(),
      this.page.locator('input[aria-autocomplete="list"]').first(),
    ];

    await bankDropdown.waitFor({ state: 'visible', timeout: 30000 });
    await bankDropdown.click({ force: true });
    await this.page.waitForTimeout(500);

    let focusedInput = false;
    for (const input of bankInputCandidates) {
      if (await input.isVisible().catch(() => false)) {
        await input.click({ force: true }).catch(() => {});
        await input.fill('').catch(() => {});
        focusedInput = true;
        break;
      }
    }

    if (!focusedInput) {
      await bankDropdown.click({ force: true }).catch(() => {});
    }

    await this.page.keyboard.type(bankName, { delay: 80 });
    await this.page.waitForTimeout(800);

    const optionCandidates = [
      this.page.locator('[id^="react-select-"][id*="-option-"]', { hasText: bankName }).first(),
      this.page.locator('[role="option"]', { hasText: bankName }).first(),
      this.page.getByText(bankName, { exact: false }).first(),
    ];

    for (const option of optionCandidates) {
      if (await option.isVisible().catch(() => false)) {
        await option.click({ force: true });
        await this.page.waitForTimeout(500);
        const selectedText = ((await bankDropdown.textContent()) || '').replace(/\s+/g, ' ').trim();
        if (selectedText.toLowerCase().includes(bankName.toLowerCase())) {
          logger.info(`✅ Selected ${bankName} as bank name on Contract F payment plan page`);
          return;
        }
      }
    }

    const selectedText = ((await bankDropdown.textContent()) || '').replace(/\s+/g, ' ').trim();
    if (selectedText.toLowerCase().includes(bankName.toLowerCase())) {
      logger.info(`✅ Entered ${bankName} as bank name on Contract F payment plan page`);
      return;
    }

    throw new Error(`Could not select or enter bank name: ${bankName}`);
  }

  async verifyContractInformationHeading(): Promise<string> {
    const headingCandidates = [
      this.page
        .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div/div[1]/h2')
        .first(),
      this.page.locator('.create-contract_f h2', { hasText: /Contract\s*Information/i }).first(),
      this.page.locator('li a.selected small', { hasText: /Contract\s*Information/i }).first(),
    ];

    for (const heading of headingCandidates) {
      if (await heading.isVisible().catch(() => false)) {
        const headingText = (await heading.textContent())?.trim() || '';
        if (/Contract\s*Information/i.test(headingText)) {
          logger.info(`✅ Contract Information heading verified: ${headingText}`);
          return headingText;
        }
      }
    }

    await headingCandidates[0].waitFor({ state: 'visible', timeout: 30000 });
    const headingText = (await headingCandidates[0].textContent())?.trim() || '';
    if (!/Contract\s*Information/i.test(headingText)) {
      throw new Error(`Expected Contract Information heading, but found: "${headingText}"`);
    }

    logger.info(`✅ Contract Information heading verified: ${headingText}`);
    return headingText;
  }

  async selectContractInformationStartDateDaysFromToday(daysFromToday: number): Promise<string> {
    const startDateInput = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div/div[2]/div/div/div[1]/div/div[2]/div/div/div/div/div/input')
      .first();

    await startDateInput.waitFor({ state: 'visible', timeout: 30000 });

    const selectedDate = new Date();
    selectedDate.setDate(selectedDate.getDate() + daysFromToday);
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const year = selectedDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    await startDateInput.click({ force: true });
    await startDateInput.fill(formattedDate);
    await startDateInput.press('Enter').catch(() => {});
    await startDateInput.press('Tab').catch(() => {});
    await startDateInput.evaluate((element) => (element as HTMLInputElement).blur()).catch(() => {});
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(300);

    logger.info(`✅ Selected Contract F Contract Information start date: ${formattedDate}`);
    return formattedDate;
  }

  async selectContractInformationEndDateTwoMonthsFromStart(startDate: Date): Promise<string> {
    const endDateInput = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div/div[2]/div/div/div[2]/div/div[2]/div/div/div/div/div/input')
      .first();

    await endDateInput.waitFor({ state: 'visible', timeout: 30000 });

    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 2);
    const day = String(endDate.getDate()).padStart(2, '0');
    const month = String(endDate.getMonth() + 1).padStart(2, '0');
    const year = endDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;

    await endDateInput.click({ force: true });
    await endDateInput.fill(formattedDate);
    await endDateInput.press('Enter').catch(() => {});
    await endDateInput.press('Tab').catch(() => {});
    await endDateInput.evaluate((element) => (element as HTMLInputElement).blur()).catch(() => {});
    await this.page.keyboard.press('Escape').catch(() => {});
    await this.page.waitForTimeout(300);

    logger.info(`✅ Selected Contract F Contract Information end date: ${formattedDate}`);
    return formattedDate;
  }

  async verifySellerBrokerCommissionHeading(): Promise<string> {
    const sellerBrokerHeading = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div[1]/div[1]/h2')
      .first();

    await sellerBrokerHeading.waitFor({ state: 'visible', timeout: 30000 });
    const headingText = (await sellerBrokerHeading.textContent())?.trim() || '';
    if (!/Seller\s*Broker/i.test(headingText)) {
      throw new Error(`Expected Seller Broker heading, but found: "${headingText}"`);
    }

    logger.info(`✅ Seller Broker commission heading verified: ${headingText}`);
    return headingText;
  }

  async verifyDldRegistrationFeesHeading(): Promise<string> {
    const dldRegistrationFeesHeading = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[1]/h2')
      .first();
    const saveAndContinueButton = this.page.locator('button.buttonNext.btn.btn-primary').first();

    await dldRegistrationFeesHeading.waitFor({ state: 'visible', timeout: 30000 });

    let headingText = '';
    const readHeading = async (): Promise<string> => ((await dldRegistrationFeesHeading.textContent()) || '').trim();

    for (let attempt = 0; attempt < 2; attempt += 1) {
      for (let poll = 0; poll < 10; poll += 1) {
        headingText = await readHeading();
        if (/DLD\s*Registration\s*Fees/i.test(headingText)) {
          logger.info(`✅ DLD Registration Fees heading verified: ${headingText}`);
          return headingText;
        }

        await this.page.waitForTimeout(500);
      }

      if (/Seller\s*Broker/i.test(headingText) && attempt === 0) {
        if (await saveAndContinueButton.isVisible().catch(() => false)) {
          await saveAndContinueButton.scrollIntoViewIfNeeded().catch(() => {});
          await saveAndContinueButton.click({ force: true }).catch(async () => {
            await saveAndContinueButton.evaluate((element) => (element as HTMLElement).click());
          });
          logger.info('➡️ Retried Save and Continue while waiting for DLD Registration Fees page');
          await this.page.waitForTimeout(1000);
        }
      }
    }

    throw new Error(`Expected DLD Registration Fees heading, but found: "${headingText}"`);
  }

  async verifyNotesHeading(): Promise<string> {
    const notesHeading = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[1]/h2')
      .first();

    await notesHeading.waitFor({ state: 'visible', timeout: 30000 });
    const headingText = (await notesHeading.textContent())?.trim() || '';
    if (!/^Notes$/i.test(headingText)) {
      throw new Error(`Expected Notes heading, but found: "${headingText}"`);
    }

    logger.info(`✅ Notes heading verified: ${headingText}`);
    return headingText;
  }

  async verifyAdditionalTermsAndConditionsHeading(): Promise<string> {
    const additionalTermsHeading = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[1]/h2')
      .first();

    await additionalTermsHeading.waitFor({ state: 'visible', timeout: 30000 });
    const headingText = (await additionalTermsHeading.textContent())?.trim() || '';
    if (!/Additional\s*Terms\s*and\s*Conditions/i.test(headingText)) {
      throw new Error(`Expected Additional Terms and Conditions heading, but found: "${headingText}"`);
    }

    logger.info(`✅ Additional Terms and Conditions heading verified: ${headingText}`);
    return headingText;
  }

  async clickAddButtonOnAdditionalTermsAndConditions(): Promise<void> {
    const addButton = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[4]/div/button')
      .first();

    await addButton.waitFor({ state: 'visible', timeout: 30000 });
    await addButton.scrollIntoViewIfNeeded().catch(() => {});
    await addButton.click({ force: true }).catch(async () => {
      await addButton.evaluate((element) => (element as HTMLElement).click());
    });

    logger.info('➕ Clicked Add button on Additional Terms and Conditions page');
  }

  async enterRandomEnglishAdditionalTermsText(): Promise<string> {
    const englishTextarea = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[3]/div/div/div[1]/div/div[2]/div/div/textarea')
      .first();

    const englishTexts = [
      'This clause confirms that both parties reviewed the contract details and accepted the additional conditions before final approval.',
      'The buyer and seller agree that all supporting documents were verified and the transaction will proceed according to the agreed timeline.',
      'This test note records that the broker verified the payment details, contract period, and additional obligations with both parties.'
    ];
    const text = `${englishTexts[Math.floor(Math.random() * englishTexts.length)]} Ref ${Date.now()}.`;

    await englishTextarea.waitFor({ state: 'visible', timeout: 30000 });
    await englishTextarea.scrollIntoViewIfNeeded().catch(() => {});
    await englishTextarea.fill(text);

    logger.info(`✍️ Entered English additional terms text: ${text}`);
    return text;
  }

  async enterRandomArabicAdditionalTermsText(): Promise<string> {
    const arabicTextarea = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[2]/div/div[1]/div/div[3]/div/div/div[2]/div/div[2]/div/div/textarea')
      .first();

    const arabicTexts = [
      'هذا نص تجريبي يوضح أن جميع الأطراف راجعوا تفاصيل العقد ووافقوا على الشروط الإضافية قبل الاعتماد النهائي.',
      'يؤكد هذا البند أن المشتري والبائع اطلعا على المستندات المطلوبة وتمت مراجعة جميع البيانات المرتبطة بالمعاملة.',
      'تمت إضافة هذه الملاحظة التجريبية لإثبات أن الوسيط تحقق من مدة العقد وآلية السداد والالتزامات الإضافية.'
    ];
    const text = `${arabicTexts[Math.floor(Math.random() * arabicTexts.length)]} مرجع ${Date.now()}.`;

    await arabicTextarea.waitFor({ state: 'visible', timeout: 30000 });
    await arabicTextarea.scrollIntoViewIfNeeded().catch(() => {});
    await arabicTextarea.fill(text);

    logger.info(`✍️ Entered Arabic additional terms text: ${text}`);
    return text;
  }

  async verifyContractFPreviewPage(): Promise<void> {
    const sellPricePreview = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[1]/div/div[6]/div/div/div[2]/div/div/div[1]/div/div[2]/div/div/span')
      .first();

    await sellPricePreview.waitFor({ state: 'visible', timeout: 30000 });
    logger.info('✅ Contract F preview page is visible');
  }

  async verifyPreviewSellPrice(expectedValue: string): Promise<string> {
    const sellPricePreview = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[1]/div/div[6]/div/div/div[2]/div/div/div[1]/div/div[2]/div/div/span')
      .first();

    await sellPricePreview.waitFor({ state: 'visible', timeout: 30000 });
    const actualText = (await sellPricePreview.textContent())?.trim() || '';

    if (this.normalizeAmountText(actualText) !== this.normalizeAmountText(expectedValue)) {
      throw new Error(`Expected preview sell price "${expectedValue}", but found "${actualText}"`);
    }

    logger.info(`✅ Preview sell price matched: ${actualText}`);
    return actualText;
  }

  async verifyPreviewDepositAmount(expectedValue: string): Promise<string> {
    const depositPreview = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[1]/div/div[6]/div/div/div[2]/div/div/div[2]/div/div[2]/div/div/span')
      .first();

    await depositPreview.waitFor({ state: 'visible', timeout: 30000 });
    const actualText = (await depositPreview.textContent())?.trim() || '';

    if (this.normalizeAmountText(actualText) !== this.normalizeAmountText(expectedValue)) {
      throw new Error(`Expected preview deposit amount "${expectedValue}", but found "${actualText}"`);
    }

    logger.info(`✅ Preview deposit amount matched: ${actualText}`);
    return actualText;
  }

  async verifyPreviewContractEndDate(expectedValue: string): Promise<string> {
    const endDatePreview = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[1]/div/div[8]/div/div/div[2]/div/div/div[2]/div/div[2]/div/div/span')
      .first();

    await endDatePreview.waitFor({ state: 'visible', timeout: 30000 });
    const actualText = (await endDatePreview.textContent())?.trim() || '';

    if (this.normalizeDateText(actualText) !== this.normalizeDateText(expectedValue)) {
      throw new Error(`Expected preview contract end date "${expectedValue}", but found "${actualText}"`);
    }

    logger.info(`✅ Preview contract end date matched: ${actualText}`);
    return actualText;
  }

  async acceptPreviewTermsAndConditions(): Promise<void> {
    const checkboxInput = this.page
      .locator('xpath=//div[contains(@class,"agree-link") and contains(.,"I accept the above Terms and Conditions")]//input[@type="checkbox"]')
      .first();
    const checkboxLabel = this.page
      .locator('xpath=//div[contains(@class,"agree-link") and contains(.,"I accept the above Terms and Conditions")]//label')
      .first();

    await checkboxInput.waitFor({ state: 'visible', timeout: 30000 });
    await checkboxInput.scrollIntoViewIfNeeded().catch(() => {});

    const alreadyChecked = await checkboxInput.isChecked().catch(() => false);
    if (!alreadyChecked) {
      try {
        await checkboxLabel.click({ timeout: 5000 });
      } catch {
        try {
          await checkboxInput.check({ force: true, timeout: 5000 });
        } catch {
          await checkboxInput.evaluate((element) => {
            const input = element as HTMLInputElement;
            input.checked = true;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          });
        }
      }
    }

    const checked = await checkboxInput.isChecked().catch(() => false);
    if (!checked) {
      throw new Error('Contract F preview terms and conditions checkbox was not checked');
    }

    logger.info('☑️ Accepted Contract F preview terms and conditions');
  }

  async clickSubmitContractForApproval(): Promise<void> {
    const submitButton = this.page
      .locator('xpath=//button[contains(@class,"buttonNext") and contains(@class,"btn-continue") and contains(.,"Submit Contract for Approval")]')
      .first();

    await submitButton.waitFor({ state: 'visible', timeout: 30000 });
    await submitButton.scrollIntoViewIfNeeded().catch(() => {});

    try {
      await submitButton.click({ timeout: 5000 });
    } catch {
      try {
        await submitButton.click({ force: true, timeout: 5000 });
      } catch {
        await submitButton.evaluate((element) => (element as HTMLButtonElement).click());
      }
    }

    const confirmButton = this.page.getByRole('button', { name: /yes|ok|confirm|submit/i }).first();
    if (await confirmButton.isVisible({ timeout: 4000 }).catch(() => false)) {
      await confirmButton.click({ force: true }).catch(() => {});
      logger.info('ℹ️ Confirmed Contract F submit action on popup');
    }

    logger.info('📨 Clicked Submit Contract for Approval on Contract F preview');
  }

  async verifyContractFSubmissionSuccessMessage(): Promise<string> {
    const successHeading = this.page
      .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div/div/h4')
      .first();

    await successHeading.waitFor({ state: 'visible', timeout: 30000 });
    const messageText = (await successHeading.textContent())?.trim() || '';

    if (!/Your contract has been submitted successfully\.?/i.test(messageText)) {
      throw new Error(`Expected success message containing "Your contract has been submitted successfully" but found "${messageText}"`);
    }

    logger.info(`✅ Contract F submission success message verified: ${messageText}`);
    return messageText;
  }

  async getSubmittedContractFNumber(): Promise<string> {
    // Strategy 1: anchor link inside <b> inside <h4> (same as CA/CB)
    const linkXPath = 'xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div/div/h4/b/a';
    const linkLocator = this.page.locator(linkXPath).first();
    const linkVisible = await linkLocator.isVisible({ timeout: 5000 }).catch(() => false);
    if (linkVisible) {
      const num = ((await linkLocator.textContent()) || '').trim();
      if (/^CF/i.test(num)) {
        logger.info(`💾 Captured Contract F number via link: ${num}`);
        return num;
      }
    }

    // Strategy 2: <b> text directly (no anchor)
    const boldXPath = 'xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div/div/h4/b';
    const boldLocator = this.page.locator(boldXPath).first();
    const boldVisible = await boldLocator.isVisible({ timeout: 5000 }).catch(() => false);
    if (boldVisible) {
      const num = ((await boldLocator.textContent()) || '').trim();
      if (/^CF/i.test(num)) {
        logger.info(`💾 Captured Contract F number via bold text: ${num}`);
        return num;
      }
    }

    // Strategy 3: regex extract CF\d+ from full success message text
    const h4Locator = this.page.locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div/div/h4').first();
    const h4Visible = await h4Locator.isVisible({ timeout: 5000 }).catch(() => false);
    if (h4Visible) {
      const fullText = ((await h4Locator.textContent()) || '').trim();
      const match = fullText.match(/CF\d+/i);
      if (match) {
        logger.info(`💾 Captured Contract F number via regex from message: ${match[0]}`);
        return match[0].trim();
      }
    }

    // Strategy 4: scan entire page for any CF\d+ pattern
    const pageText = await this.page.evaluate(() => document.body.innerText);
    const pageMatch = pageText.match(/CF\d{10,}/i);
    if (pageMatch) {
      logger.info(`💾 Captured Contract F number via full page scan: ${pageMatch[0]}`);
      return pageMatch[0].trim();
    }

    throw new Error('Could not extract Contract F number from success message. No CF\\d+ pattern found anywhere on page.');
  }

  async setSellerBrokerCommissionPercentage(percentage: number): Promise<void> {
    if (![0, 25, 50, 75, 100].includes(percentage)) {
      throw new Error(`Unsupported Seller Broker commission percentage: ${percentage}. Supported values: 0, 25, 50, 75, 100`);
    }
    const sellerSection = this.page
      .locator('xpath=//h2[normalize-space()="Seller Broker"]/ancestor::div[contains(@class,"content-usc-readonly")][1]')
      .first();
    const sliderContainer = sellerSection.locator('.share-slider').first();
    const sliderInput = sellerSection.locator('input[id^="share-slider"]').first();
    const sliderHandle = sellerSection.locator('.irs-handle.single').first();
    const sliderLine = sellerSection.locator('.irs-line').first();
    const sliderMarks = sellerSection.locator('.irs-grid-text');
    const sellerValueText = sellerSection.locator('.share-slider-value-box span').nth(0);

    const targetSliderFrom = 100 - percentage;

    const readSellerPercentage = async (): Promise<number | null> => {
      const visibleText = ((await sellerValueText.textContent().catch(() => '')) || '').replace(/\s+/g, ' ').trim();
      const visibleMatch = visibleText.match(/(\d+)\s*%/);
      if (visibleMatch) {
        return Number(visibleMatch[1]);
      }

      const fromAttribute = await sliderInput.getAttribute('data-from').catch(() => null);
      if (fromAttribute !== null) {
        const fromValue = Number(fromAttribute);
        if (!Number.isNaN(fromValue)) {
          return 100 - fromValue;
        }
      }

      const handleLeft = await sliderHandle.evaluate((element) => {
        const htmlElement = element as HTMLElement;
        return htmlElement.style.left || window.getComputedStyle(htmlElement).left || '';
      }).catch(() => null);
      if (handleLeft && handleLeft.includes('%')) {
        const leftValue = Number(handleLeft.replace('%', '').trim());
        if (!Number.isNaN(leftValue)) {
          return 100 - Math.round(leftValue);
        }
      }

      return null;
    };

    const verifySellerPercentage = async (): Promise<boolean> => {
      const currentSellerPercentage = await readSellerPercentage();
      return currentSellerPercentage === percentage;
    };

    await sellerSection.waitFor({ state: 'visible', timeout: 30000 });
    await sliderContainer.waitFor({ state: 'visible', timeout: 30000 });
    await sliderInput.waitFor({ state: 'attached', timeout: 30000 });

    if (await verifySellerPercentage()) {
      logger.info(`✅ Seller Broker commission slider already set to ${percentage}%`);
      return;
    }

    const pluginUpdated = await sliderInput.evaluate((element, targetFrom) => {
      const input = element as HTMLInputElement;
      const win = window as typeof window & { $?: any; jQuery?: any };
      const jquery = win.$ || win.jQuery;
      const plugin = jquery ? jquery(input).data('ionRangeSlider') : null;

      if (plugin && typeof plugin.update === 'function') {
        plugin.update({ from: targetFrom });
        return true;
      }

      input.setAttribute('data-from', String(targetFrom));
      input.value = String(targetFrom);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      return false;
    }, targetSliderFrom).catch(() => false);

    await this.page.waitForTimeout(800);
    if (await verifySellerPercentage()) {
      logger.info(`✅ Set Seller Broker commission slider to ${percentage}%${pluginUpdated ? ' via plugin update' : ''}`);
      return;
    }

    const lineBox = await sliderLine.boundingBox().catch(() => null);
    if (lineBox) {
      const x = lineBox.x + (lineBox.width * targetSliderFrom) / 100;
      const y = lineBox.y + lineBox.height / 2;
      await this.page.mouse.click(x, y);
      await this.page.waitForTimeout(500);
      if (await verifySellerPercentage()) {
        logger.info(`✅ Set Seller Broker commission slider to ${percentage}% via line click`);
        return;
      }
    }

    const matchingMark = sliderMarks.filter({ hasText: String(targetSliderFrom) }).first();
    if (await matchingMark.isVisible().catch(() => false)) {
      await matchingMark.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(500);
      if (await verifySellerPercentage()) {
        logger.info(`✅ Set Seller Broker commission slider to ${percentage}% via grid mark`);
        return;
      }
    }

    const handleBox = await sliderHandle.boundingBox().catch(() => null);
    if (handleBox && lineBox) {
      await this.page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
      await this.page.mouse.down();
      await this.page.mouse.move(lineBox.x + (lineBox.width * targetSliderFrom) / 100, handleBox.y + handleBox.height / 2, { steps: 16 });
      await this.page.mouse.up();
      await this.page.waitForTimeout(700);
      if (await verifySellerPercentage()) {
        logger.info(`✅ Set Seller Broker commission slider to ${percentage}% via drag`);
        return;
      }
    }

    const currentSellerPercentage = await readSellerPercentage();
    throw new Error(`Seller Broker commission slider did not change to ${percentage}%. Current seller value: ${currentSellerPercentage ?? 'unknown'}`);
  }
}
