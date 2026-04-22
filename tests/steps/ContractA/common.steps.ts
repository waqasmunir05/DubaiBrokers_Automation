// tests/steps/ContractA/common.steps.ts
// Common/shared steps used across multiple Contract A scenarios
import { When } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { ContractsSearchPage } from '../../pages/ContractsSearchPage';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../utils/logger';
import { waitForPageStable } from '../../utils/waitHelper';

When('I enter the created contract number', async function (this: World) {
  const searchPage = new ContractsSearchPage(this.page);
  
  // Read contract number from file (saved by create scenario)
  let contractNumber = 'CA0001'; // fallback
  const contractFilePath = path.join(process.cwd(), 'contract-data.json');
  
  logger.info(`📄 Checking for contract file at: ${contractFilePath}`);
  logger.info(`📄 File exists: ${fs.existsSync(contractFilePath)}`);
  
  if (fs.existsSync(contractFilePath)) {
    try {
      const fileData = fs.readFileSync(contractFilePath, 'utf-8');
      logger.debug(`📄 Raw file data: ${fileData}`);
      const data = JSON.parse(fileData);
      const contractANumber = String(data.contractANumber || '').trim();
      const genericContractNumber = String(data.contractNumber || '').trim();
      contractNumber = /^CA/i.test(contractANumber)
        ? contractANumber
        : /^CA/i.test(genericContractNumber)
          ? genericContractNumber
          : contractANumber || genericContractNumber || contractNumber;
      logger.info(`📂 Contract number loaded from file: ${contractNumber}`);
    } catch (error) {
      logger.error(`⚠️ Error reading contract file, using fallback: ${error}`);
    }
  } else {
    logger.error(`⚠️ Contract file not found, using fallback: ${contractNumber}`);
  }
  
  logger.info(`🔎 Using contract number for search: ${contractNumber}`);
  await searchPage.enterContractNumber(contractNumber);
  logger.info(`✅ Contract number entered: ${contractNumber}`);
  
  // Store in current context as well
  (this as any).contractNumber = contractNumber;
});

When('I click on Search button to find contract', async function (this: World) {
  const searchPage = new ContractsSearchPage(this.page);
  
  logger.info('🔎 Clicking search button');
  // Search button - usually a button with text "Search" or an icon
  const searchButton = this.page.locator('button:has-text("Search")').first();
  
  try {
    await searchButton.waitFor({ state: 'visible', timeout: 10000 });
    await searchButton.click();
    await waitForPageStable(this.page);
    logger.info('✅ Search button clicked, waiting for results');
  } catch (e) {
    logger.info('⚠️ Search button not found, trying alternative selector');
    const altButton = this.page.getByRole('button', { name: /search/i });
    await altButton.click();
    await waitForPageStable(this.page);
    logger.info('✅ Search completed');
  }
});

When('I click on searched contract result', async function (this: World) {
  logger.info('📋 Clicking searched contract result');
  const resultXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div[4]/div/div[3]/div/table/tbody/tr/td[1]';
  const resultCell = this.page.locator(`xpath=${resultXPath}`);

  await resultCell.waitFor({ state: 'visible', timeout: 30000 });
  await resultCell.click();
  await waitForPageStable(this.page);
  logger.info('✅ Searched contract result clicked');
});
