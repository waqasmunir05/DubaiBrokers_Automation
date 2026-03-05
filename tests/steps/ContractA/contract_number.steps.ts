import { Given } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { logger } from '../../utils/logger';

/**
 * Step to use the approved contract number (before extension) for cancel workflow
 */
Given('I use the approved contract number', async function (this: World) {
  const fs = require('fs');
  const path = require('path');
  const contractFilePath = path.join(process.cwd(), 'contract-data.json');
  
  if (fs.existsSync(contractFilePath)) {
    const contractData = JSON.parse(fs.readFileSync(contractFilePath, 'utf-8'));
    
    if (contractData.approvedContractNumber) {
      // Temporarily restore approved contract number for cancel workflow
      contractData.contractNumber = contractData.approvedContractNumber;
      fs.writeFileSync(contractFilePath, JSON.stringify(contractData, null, 2));
      logger.info(`🔄 Using approved contract number for cancel: ${contractData.approvedContractNumber}`);
    }
  }
});
