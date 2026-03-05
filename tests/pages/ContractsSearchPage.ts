// tests/pages/ContractsSearchPage.ts
import { Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import { waitForPageStable } from '../utils/waitHelper';

export class ContractsSearchPage {
  constructor(private page: Page) {}

  async clickContractsTab(): Promise<void> {
    logger.info('📑 Clicking on Contracts tab');
    const tab = this.page.getByRole('tab', { name: 'Contracts' });
    await tab.waitFor({ state: 'visible', timeout: 10000 });
    await tab.click();
    logger.info('📑 Clicked on Contracts tab');
  }

  async closePopupMessage(): Promise<void> {
    logger.info('🔔 Closing popup message');
    const closeBtn = this.page.locator('.btn.btn-dark.btn-agree');
    try {
      await closeBtn.waitFor({ state: 'visible', timeout: 15000 });
      await closeBtn.click();
      await waitForPageStable(this.page);
      logger.info('❌ Closed popup message');
    } catch (e) {
      logger.info('ℹ️ No popup message to close');
    }
  }

  async enterContractNumber(contractNumber?: string): Promise<string> {
    let number = contractNumber;

    if (!number) {
      logger.info('🔍 Looking for contract number...');
      
      // Check World context first (if available)
      // This would need to be passed in or retrieved from context

      // Check file
      logger.info('⚠️ Contract number not provided, checking file...');
      try {
        const contractFilePath = path.join(process.cwd(), 'contract-data.json');
        logger.info('📄 Looking for file: ' + contractFilePath);
        
        if (fs.existsSync(contractFilePath)) {
          const fileData = fs.readFileSync(contractFilePath, 'utf-8');
          logger.debug('✅ File found, contents: ' + fileData);
          const parsed = JSON.parse(fileData);
          number = parsed.contractNumber;
          logger.info('✅ Contract number loaded from file: ' + number);
        } else {
          logger.error('❌ File does not exist at: ' + contractFilePath);
          throw new Error('Contract number file not found');
        }
      } catch (err) {
        logger.error('❌ Error reading file: ' + (err instanceof Error ? err.message : String(err)));
        throw err;
      }
    }

    if (!number) {
      throw new Error('Contract number not found');
    }

    logger.info(`🔎 Entering contract number: ${number}`);
    const contractInputXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div[3]/div[2]/div/div[1]/div[3]/div/div[2]/div/div/div/input';
    const contractInput = this.page.locator(`xpath=${contractInputXPath}`);
    await contractInput.waitFor({ state: 'visible', timeout: 10000 });
    await contractInput.fill(number);
    logger.info(`✅ Contract number entered: ${number}`);

    return number;
  }

  async searchContract(): Promise<void> {
    logger.info('🔎 Clicking Search button');
    const searchBtnXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div[3]/div[2]/div/div[2]/div[4]/button[2]';
    const searchBtn = this.page.locator(`xpath=${searchBtnXPath}`);
    await searchBtn.waitFor({ state: 'visible', timeout: 10000 });
    await searchBtn.click();
    logger.info('✅ Search button clicked');

    logger.info('🔎 Waiting for search results');
    const resultCellXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div[4]/div/div[3]/div/table/tbody/tr/td[1]';
    const resultCell = this.page.locator(`xpath=${resultCellXPath}`);
    await resultCell.waitFor({ state: 'visible', timeout: 20000 });
    await resultCell.click();
    await waitForPageStable(this.page);
    logger.info('✅ Opened contract details from search results');
  }

  async navigateToContractsTab(): Promise<void> {
    logger.info('📑 Navigating to Contracts tab');
    await this.clickContractsTab();
    await this.closePopupMessage();
    logger.info('✅ Contracts tab ready');
  }
}
