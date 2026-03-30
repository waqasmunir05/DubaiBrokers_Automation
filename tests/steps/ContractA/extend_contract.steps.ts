import { When } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { logger } from '../../utils/logger';

/**
 * Contract Extension Step Definitions
 */

When('I click on extend action icon', async function (this: World) {
  logger.info('⏳ Waiting for extend button to appear');
  
  const extendButtonXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[8]/div/div/button[3]/div/i';
  const extendButton = this.page.locator(`xpath=${extendButtonXPath}`);
  
  await extendButton.waitFor({ state: 'visible', timeout: 30000 });
  await extendButton.click();
  
  logger.info('✅ Extend button clicked');
});

When('I select new Contract End date 4 months from today', async function (this: World) {
  logger.info('📅 Selecting new contract end date for extension (4 months from today)');
  
  // Wait for the date picker popup to appear
  const dateInputXPath = '/html/body/div[1]/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div[2]/div/div/div[1]/div/div[2]/div/div/div/div[1]/div/input';
  const dateInput = this.page.locator(`xpath=${dateInputXPath}`);
  
  await dateInput.waitFor({ state: 'visible', timeout: 15000 });
  
  // Calculate date 4 months from today
  const today = new Date();
  const extendedDate = new Date(today);
  extendedDate.setMonth(today.getMonth() + 4);
  
  // Format date as DD/MM/YYYY
  const day = String(extendedDate.getDate()).padStart(2, '0');
  const month = String(extendedDate.getMonth() + 1).padStart(2, '0');
  const year = extendedDate.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  
  // Clear and enter the date
  await dateInput.clear();
  await dateInput.fill(formattedDate);
  
  logger.info(`✅ Extended end date set to ${formattedDate}`);
  
  // Store in context for verification
  (this as any).extendedEndDate = formattedDate;
});

When('I click on Continue button for extension', async function (this: World) {
  logger.info('📤 Clicking on Continue button');
  
  const continueButtonXPath = '//*[@id="continue"]';
  const continueButton = this.page.locator(`xpath=${continueButtonXPath}`);
  
  await continueButton.waitFor({ state: 'visible', timeout: 10000 });
  await continueButton.click();
  
  logger.info('✅ Continue button clicked - Waiting for success message...');
});

When('I should see extension request success message', async function (this: World) {
  logger.info('🔍 Waiting for extension request success message');
  
  // Wait for success message containing "Your contract has been submitted successfully"
  const successMessage = this.page.getByText(/your contract has been submitted successfully/i);
  
  await successMessage.waitFor({ state: 'visible', timeout: 15000 });
  const messageText = await successMessage.textContent();
  
  logger.info(`✅ Extension request submitted successfully: ${messageText}`);
  
  // Extract new contract number from success message text
  logger.info('📋 Extracting new contract number from success message');
  
  if (messageText) {
    // Extract contract number using regex: "Contract number is CAXXXXXXXXX"
    const contractNumberMatch = messageText.match(/Contract number is\s+(CA\d+)/i);
    
    if (contractNumberMatch && contractNumberMatch[1]) {
      const contractNumber = contractNumberMatch[1];
      logger.info(`✅ Extracted new contract number: ${contractNumber}`);
      
      // Save to context and file
      (this as any).contractNumber = contractNumber;
      logger.info(`🔢 NEW CONTRACT NUMBER SAVED: ${contractNumber}`);
      
      // Save to JSON file for next scenario
      const fs = require('fs');
      const path = require('path');
      const contractData = { contractNumber };
      const filePath = path.join(process.cwd(), 'contract-data.json');
      fs.writeFileSync(filePath, JSON.stringify(contractData, null, 2));
      logger.info(`📄 Contract data saved to: ${filePath}`);
      
      // Verify file was written
      if (fs.existsSync(filePath)) {
        const savedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        logger.info(`✅ File verified - New contract number persisted: ${savedData.contractNumber}`);
      }
    } else {
      logger.info('⚠️ Could not extract contract number from message text');
      logger.info(`Message text: ${messageText}`);
    }
  }
});

When('I add {string} years to contract period', async function (this: World, yearsToAdd: string) {
  logger.info(`📅 Adding ${yearsToAdd} years to contract period`);
  
  // XPath for extension period input
  const periodInputXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div/div/div/div[2]/div/div/input';
  const periodInput = this.page.locator(`xpath=${periodInputXPath}`);
  
  await periodInput.waitFor({ state: 'visible', timeout: 10000 });
  await periodInput.clear();
  await periodInput.fill(yearsToAdd);
  
  logger.info(`✅ Extension period set to: ${yearsToAdd} years`);
});
