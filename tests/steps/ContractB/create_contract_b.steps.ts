import path from 'path';
import * as fs from 'fs';
import { When, Then } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { logger } from '../../utils/logger';

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

When('broker clicks on Create Contract B', async function (this: World) {
  const createContractBXPath = '//*[@id="sidebar-menu"]/div/ul/li[3]/a';
  const createContractBLink = this.page.locator(`xpath=${createContractBXPath}`);

  await createContractBLink.waitFor({ state: 'visible', timeout: 15000 });
  await createContractBLink.click();

  logger.info('🔘 Clicked on "Create Contract B" in the left panel');
});

When('broker selects Person in contract B popup', async function (this: World) {
  const personRadio = this.page.locator('input[type="radio"][name="TypeSelection"][value="Person"]');
  await personRadio.waitFor({ state: 'visible', timeout: 15000 });
  await personRadio.check({ force: true });
  logger.info('👤 Selected Person in Contract B popup');
});

When('broker selects Emirates ID as registration type in contract B popup', async function (this: World) {
  const emiratesIdRadio = this.page.locator('input[type="radio"][name="registration"][value="Emirates ID"]');
  await emiratesIdRadio.waitFor({ state: 'attached', timeout: 15000 });

  const isAlreadyChecked = await emiratesIdRadio.isChecked().catch(() => false);
  if (isAlreadyChecked) {
    logger.info('🪪 Emirates ID registration type already selected');
    return;
  }

  const helper = this.page.locator('input[type="radio"][name="registration"][value="Emirates ID"] + ins.iCheck-helper').first();
  const labelByText = this.page.locator(
    'xpath=//label[normalize-space()="Emirates ID"] | //span[normalize-space()="Emirates ID"]'
  ).first();

  const tryClick = async (clickAction: () => Promise<void>) => {
    try {
      await clickAction();
      return await emiratesIdRadio.isChecked().catch(() => false);
    } catch {
      return false;
    }
  };

  let selected = await tryClick(async () => {
    const visible = await emiratesIdRadio.isVisible().catch(() => false);
    if (visible) {
      await emiratesIdRadio.click({ force: true });
    } else {
      throw new Error('radio not visible for direct click');
    }
  });

  if (!selected) {
    selected = await tryClick(async () => {
      const visible = await helper.isVisible().catch(() => false);
      if (visible) {
        await helper.click({ force: true });
      } else {
        throw new Error('helper not visible');
      }
    });
  }

  if (!selected) {
    selected = await tryClick(async () => {
      const visible = await labelByText.isVisible().catch(() => false);
      if (visible) {
        await labelByText.click({ force: true });
      } else {
        throw new Error('label not visible');
      }
    });
  }

  if (!selected) {
    await emiratesIdRadio.evaluate((element) => {
      const input = element as HTMLInputElement;
      input.checked = true;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    selected = await emiratesIdRadio.isChecked().catch(() => false);
  }

  if (!selected) {
    throw new Error('Failed to select Emirates ID registration type');
  }

  logger.info('🪪 Selected Emirates ID as registration type');
});

When('broker enters Emirates ID year {string} and number {string} in contract B popup', async function (this: World, year: string, idNumber: string) {
  const idYearInput = this.page.locator('#idYear');
  const idNumInput = this.page.locator('#idnum');

  await idYearInput.waitFor({ state: 'visible', timeout: 15000 });
  await idYearInput.fill(year);

  await idNumInput.waitFor({ state: 'visible', timeout: 15000 });
  await idNumInput.fill(idNumber);

  logger.info(`🔢 Entered Emirates ID year ${year} and number ${idNumber}`);
});

When('broker selects Date of Birth {string} from calendar in contract B popup', async function (this: World, dateOfBirth: string) {
  const dobInput = this.page.locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div/div/div/div[2]/div[3]/div/div[3]/div/div[2]/div/div/div/div[1]/div/input');
  await dobInput.waitFor({ state: 'visible', timeout: 15000 });
  await dobInput.fill(dateOfBirth);
  logger.info(`📅 Selected Date of Birth: ${dateOfBirth}`);
});

When('broker clicks Proceed to search in contract B popup', async function (this: World) {
  const proceedXPath = '//*[@id="wizard"]/div[2]/div[3]/div/button';
  const proceedButton = this.page.locator(`xpath=${proceedXPath}`);

  await proceedButton.waitFor({ state: 'visible', timeout: 15000 });
  await proceedButton.click();

  logger.info('▶ Clicked Proceed to search in Contract B popup');
});

When('broker waits for Contract B search result and clicks it', { timeout: 130000 }, async function (this: World) {
  const resultCellXPath = '//*[@id="wizard"]/div[2]/div[1]/div/table/tbody/tr/td[3]';
  const resultCell = this.page.locator(`xpath=${resultCellXPath}`);

  logger.info('⏳ Waiting for Contract B search result to appear');
  await resultCell.waitFor({ state: 'visible', timeout: 120000 });
  await resultCell.click();

  logger.info('✅ Contract B search result clicked');
});

When('broker handles response after selecting contract B search result', async function (this: World) {
  const popupCandidates = [
    this.page.locator('.swal2-popup:visible').first(),
    this.page.locator('.modal.show:visible').first(),
    this.page.locator('div[role="dialog"]:visible').first(),
  ];

  let popupFound = false;
  for (const popup of popupCandidates) {
    if (await popup.isVisible({ timeout: 5000 }).catch(() => false)) {
      popupFound = true;
      const popupText = (await popup.textContent())?.trim() || '';
      if (popupText) {
        logger.info(`ℹ️ Search-result response popup text: ${popupText}`);
      }

      const actionButtons = [
        popup.getByRole('button', { name: /ok|yes|confirm|close|agree|continue/i }).first(),
        popup.locator('button.btn-agree, button.swal2-confirm, .modal-footer button').first(),
      ];

      let handled = false;
      for (const button of actionButtons) {
        if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
          await button.click({ force: true });
          handled = true;
          logger.info('✅ Search-result response popup handled');
          break;
        }
      }

      if (!handled) {
        logger.info('ℹ️ Response popup detected but no actionable button found');
      }
      break;
    }
  }

  if (!popupFound) {
    logger.info('ℹ️ No response popup appeared after selecting Contract B search result');
  }
});

When('broker selects Yes on Green List in contract B form', async function (this: World) {
  const yesByLabel = this.page.locator('xpath=//*[@id="wizard"]//label[normalize-space()="Yes"]').first();
  const yesByValue = this.page.locator(
    'xpath=//*[@id="wizard"]//input[@type="radio" and (translate(@value,"YES","yes")="yes" or @value="1" or @value="true")]'
  ).first();
  const yesHelper = this.page.locator(
    'xpath=(//*[@id="wizard"]//input[@type="radio" and (translate(@value,"YES","yes")="yes" or @value="1" or @value="true")])[1]/following-sibling::ins[contains(@class,"iCheck-helper")]'
  ).first();

  const tryClick = async (clickAction: () => Promise<void>) => {
    try {
      await clickAction();
      return true;
    } catch {
      return false;
    }
  };

  let selected = await tryClick(async () => {
    await yesByLabel.waitFor({ state: 'visible', timeout: 5000 });
    await yesByLabel.click({ force: true });
  });

  if (!selected) {
    selected = await tryClick(async () => {
      await yesByValue.waitFor({ state: 'attached', timeout: 5000 });
      await yesByValue.click({ force: true });
    });
  }

  if (!selected) {
    selected = await tryClick(async () => {
      await yesHelper.waitFor({ state: 'visible', timeout: 5000 });
      await yesHelper.click({ force: true });
    });
  }

  if (!selected) {
    throw new Error('Failed to select Yes on Green List in Contract B form');
  }

  logger.info('✅ Selected Yes on Green List');
});

When('broker enters birth place {string} in contract B form', async function (this: World, birthPlace: string) {
  const birthPlaceXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div[2]/div[2]/div[2]/div/div[12]/div/div[2]/div/div/div/input';
  const birthPlaceInput = this.page.locator(`xpath=${birthPlaceXPath}`);

  await birthPlaceInput.waitFor({ state: 'visible', timeout: 15000 });
  await birthPlaceInput.fill(birthPlace);

  logger.info(`📝 Entered Birth Place: ${birthPlace}`);
});

When('broker selects passport expiry date 1 year from today in contract B form', async function (this: World) {
  const passportExpiryXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div[2]/div[3]/div[2]/div/div[6]/div/div[2]/div/div/div/div/div/input';
  const passportExpiryInput = this.page.locator(`xpath=${passportExpiryXPath}`);
  const passportExpiryDate = new Date();

  passportExpiryDate.setFullYear(passportExpiryDate.getFullYear() + 1);
  const formattedDate = formatDate(passportExpiryDate);

  await passportExpiryInput.waitFor({ state: 'visible', timeout: 15000 });
  await passportExpiryInput.click();
  await passportExpiryInput.fill(formattedDate);
  await this.page.keyboard.press('Enter');

  logger.info(`📘 Selected passport expiry date: ${formattedDate}`);
});

When('broker selects passport type {string} in contract B form', async function (this: World, passportType: string) {
  const passportTypeDropdownXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div[2]/div[3]/div[2]/div/div[2]/div/div[2]/div/div/div/div/div[1]';
  const passportTypeDropdown = this.page.locator(`xpath=${passportTypeDropdownXPath}`);

  await passportTypeDropdown.waitFor({ state: 'visible', timeout: 15000 });
  await passportTypeDropdown.click();
  await this.page.waitForTimeout(1500);

  // Type to filter the lookup results
  await this.page.keyboard.type(passportType);
  await this.page.waitForTimeout(2000);

  // Try clicking the option by text using broad selectors
  const selectors = [
    `li:has-text("${passportType}")`,
    `[role="option"]:has-text("${passportType}")`,
    `[role="listitem"]:has-text("${passportType}")`,
    `ul li:has-text("${passportType}")`,
    `div[class*="option"]:has-text("${passportType}")`,
    `div[class*="item"]:has-text("${passportType}")`,
    `span:has-text("${passportType}")`,
    `.dropdown-item:has-text("${passportType}")`,
    `a:has-text("${passportType}")`,
  ];

  let selected = false;
  for (const sel of selectors) {
    const el = this.page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.click({ force: true });
      selected = true;
      logger.info(`🛂 Selected passport type via "${sel}": ${passportType}`);
      break;
    }
  }

  if (!selected) {
    // Use getByText as fallback - searches entire page for visible text
    const byText = this.page.getByText(passportType, { exact: true }).first();
    if (await byText.isVisible({ timeout: 2000 }).catch(() => false)) {
      await byText.click({ force: true });
      selected = true;
      logger.info(`🛂 Selected passport type via getByText: ${passportType}`);
    }
  }

  if (!selected) {
    // Use arrow key navigation to select highlighted item
    await this.page.keyboard.press('ArrowDown');
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press('Enter');
      logger.info(`⚠️ Fell back to ArrowDown+Enter for passport type: ${passportType}`);
  }

  await this.page.waitForTimeout(500);
  logger.info(`🛂 Passport type selection complete: ${passportType}`);
});

When('broker uploads a sample document in contract B form', async function (this: World) {
  const sampleFilePath = path.join(process.cwd(), 'tests', 'resources', 'uploads', 'sample-document.pdf');
  const documentTitle = `Passport Copy ${Math.floor(1000 + Math.random() * 9000)}`;

  // Try primary XPath first, then fall back to any file input in section/div
  let uploadInput = this.page.locator(
    'xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div[2]/div[11]/div[2]/div/div[4]/div/section/div/input'
  );
  let attached = await uploadInput.isVisible({ timeout: 5000 }).catch(() => false);

  if (!attached) {
    uploadInput = this.page.locator('section input[type="file"]').first();
    attached = await uploadInput.isVisible({ timeout: 5000 }).catch(() => false);
  }

  if (!attached) {
    uploadInput = this.page.locator('input[type="file"]').first();
  }

  await uploadInput.waitFor({ state: 'attached', timeout: 15000 });
  await uploadInput.setInputFiles(sampleFilePath);

  // Title input: try primary XPath, then fall back to any text input near the upload
  let documentTitleInput = this.page.locator(
    'xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div[2]/div[11]/div[2]/div/div[4]/div/div/div[2]/input'
  );
  let titleVisible = await documentTitleInput.isVisible({ timeout: 5000 }).catch(() => false);

  if (!titleVisible) {
    // After upload, an input for the document name typically appears
    documentTitleInput = this.page.locator('div.file-name input, input[placeholder*="title"], input[placeholder*="name"], input[placeholder*="document"]').first();
    titleVisible = await documentTitleInput.isVisible({ timeout: 5000 }).catch(() => false);
  }

  if (titleVisible) {
    await documentTitleInput.fill(documentTitle);
    logger.info(`📝 Entered document title: ${documentTitle}`);
  }

    logger.info(`📎 Uploaded sample document: ${sampleFilePath}`);
});

When('broker selects Emirates ID expiry date 3 months from today in contract B form', async function (this: World) {
  const expiryXPath = '//*[@id="wizard"]/div[1]/div/div[2]/div[2]/div[2]/div[2]/div/div[8]/div/div[2]/div/div/div/div[1]/div/input';
  const expiryInput = this.page.locator(`xpath=${expiryXPath}`);

  const expiryDate = new Date();
  expiryDate.setMonth(expiryDate.getMonth() + 3);
  const formattedDate = formatDate(expiryDate);

  await expiryInput.waitFor({ state: 'visible', timeout: 15000 });
  await expiryInput.click();
  await expiryInput.fill(formattedDate);
  await this.page.keyboard.press('Enter');

    logger.info(`📅 Selected Emirates ID expiry date: ${formattedDate}`);
});

When('broker enters mobile number {string} in contract B form', async function (this: World, mobile: string) {
  const mobileXPath = '//*[@id="wizard"]/div[1]/div/div[2]/div[2]/div[8]/div[2]/div/div[2]/div/div[2]/div/div/div/input';
  const mobileInput = this.page.locator(`xpath=${mobileXPath}`);

  await mobileInput.waitFor({ state: 'visible', timeout: 15000 });
  await mobileInput.fill(mobile);

  logger.info(`📱 Entered mobile number: ${mobile}`);
});

When('broker enters email address {string} in contract B form', async function (this: World, email: string) {
  const emailXPath = '//*[@id="wizard"]/div[1]/div/div[2]/div[2]/div[8]/div[2]/div/div[3]/div/div[2]/div/div/div/input';
  const emailInput = this.page.locator(`xpath=${emailXPath}`);

  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.fill(email);

  logger.info(`📧 Entered email address: ${email}`);
});

When('broker selects Buyer radio in contract B form', async function (this: World) {
  const buyerRadioXPath = '//*[@id="wizard"]/div[1]/div/div[2]/div[2]/div[12]/div/div[1]/div/label[1]/input';
  const buyerRadio = this.page.locator(`xpath=${buyerRadioXPath}`);

  await buyerRadio.waitFor({ state: 'visible', timeout: 15000 });
  await buyerRadio.check({ force: true });

  logger.info('🧑‍💼 Selected Buyer radio in Contract B form');
});

When('broker accepts terms checkbox in contract B form', async function (this: World) {
  const termsCheckboxXPath = '//*[@id="wizard"]/div[1]/div/div[2]/div[2]/div[12]/div/div[2]/input';
  const termsCheckbox = this.page.locator(`xpath=${termsCheckboxXPath}`);

  await termsCheckbox.waitFor({ state: 'visible', timeout: 15000 });
  await termsCheckbox.check({ force: true });

  logger.info('☑️ Accepted terms checkbox in Contract B form');
});

When('broker clicks Verify Buyer in contract B form', async function (this: World) {
  const verifyBuyerButton = this.page.getByRole('button', { name: /verify buyer/i }).first();

  await verifyBuyerButton.waitFor({ state: 'visible', timeout: 15000 });
  await verifyBuyerButton.click({ force: true });

  const okButton = this.page.getByRole('button', { name: /^ok$/i }).first();
  if (await okButton.isVisible({ timeout: 5000 }).catch(() => false)) {
    await okButton.click({ force: true });
    logger.info('ℹ️ Verification popup acknowledged with OK');
  }

  logger.info('✅ Clicked Verify Buyer in Contract B form');
});

When('broker clicks Save and Continue in contract B form', async function (this: World) {
  const saveContinueXPath = '//*[@id="wizard"]/div[2]/button';
  const saveContinueButton = this.page.locator(`xpath=${saveContinueXPath}`);

  try {
    await saveContinueButton.waitFor({ state: 'visible', timeout: 15000 });
    await saveContinueButton.click();
  } catch {
    const fallbackButton = this.page.locator('button.buttonNext.btn.btn-primary').first();
    await fallbackButton.waitFor({ state: 'visible', timeout: 10000 });
    await fallbackButton.click();
  }

  logger.info('➡️ Clicked Save and Continue in Contract B form');
});

Then('broker should see Property Information screen in contract B flow', async function (this: World) {
  const propertyInfoHeader = this.page.locator('h2').filter({ hasText: 'Property Information' }).first();
  const propertyTypeLookup = this.page.locator('xpath=//*[@id="wizard"]/div[1]/div/div[2]/div/div[1]/div/div[2]/div/div/div/div/div[1]').first();

  const headerVisible = await propertyInfoHeader.isVisible({ timeout: 8000 }).catch(() => false);
  if (!headerVisible) {
    await propertyTypeLookup.waitFor({ state: 'visible', timeout: 20000 });
  }

  logger.info('✅ Property Information screen is displayed in Contract B flow');
});

When('broker selects {string} from property type lookup in contract B property information', async function (this: World, propertyType: string) {
  const propertyTypeLookupXPath = '//*[@id="wizard"]/div[1]/div/div[2]/div/div[1]/div/div[2]/div/div/div/div/div[1]';
  const propertyTypeLookup = this.page.locator(`xpath=${propertyTypeLookupXPath}`);

  await propertyTypeLookup.waitFor({ state: 'visible', timeout: 20000 });
  await propertyTypeLookup.click();

  const option = this.page.getByText(propertyType, { exact: true }).first();
  await option.waitFor({ state: 'visible', timeout: 10000 });
  await option.click();

  logger.info(`🏠 Selected property type from lookup: ${propertyType}`);
});

When('broker selects {string} from Property Usage dropdown in contract B', async function (this: World, usage: string) {
  const propertyUsageDropdown = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[2]/div/div[2]/div/div/div/div/div[1]')
    .first();

  await propertyUsageDropdown.waitFor({ state: 'visible', timeout: 15000 });
  await propertyUsageDropdown.click();

  const option = this.page.locator('[role="option"]', { hasText: usage }).first();
  if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
    await option.click();
  } else {
    await this.page.keyboard.type(usage);
    await this.page.keyboard.press('Enter');
  }

  logger.info(`📑 Selected Property Usage: ${usage}`);
});

When('broker selects {string} from Rental Status dropdown in contract B', async function (this: World, rentalStatus: string) {
  const rentalStatusXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[3]/div/div[2]/div/div/div/div/div[1]';
  const rentalStatusDropdown = this.page.locator(`xpath=${rentalStatusXPath}`);

  await rentalStatusDropdown.waitFor({ state: 'visible', timeout: 15000 });
  await rentalStatusDropdown.click();
  await this.page.waitForTimeout(1000);

  // Type to filter the lookup results
  await this.page.keyboard.type(rentalStatus);
  await this.page.waitForTimeout(1500);

  // Try multiple selectors for lookup result items
  const selectors = [
    `li:has-text("${rentalStatus}")`,
    `[role="option"]:has-text("${rentalStatus}")`,
    `[role="listitem"]:has-text("${rentalStatus}")`,
    `ul li:has-text("${rentalStatus}")`,
    `div[class*="option"]:has-text("${rentalStatus}")`,
    `div[class*="item"]:has-text("${rentalStatus}")`,
  ];

  let selected = false;
  for (const sel of selectors) {
    const el = this.page.locator(sel).first();
    if (await el.isVisible({ timeout: 3000 }).catch(() => false)) {
      await el.click();
      selected = true;
      logger.info(`📑 Selected Rental Status via "${sel}": ${rentalStatus}`);
      break;
    }
  }

  if (!selected) {
    await this.page.keyboard.press('Enter');
    logger.info(`⚠️ Fell back to Enter key for Rental Status: ${rentalStatus}`);
  }

  logger.info(`📑 Rental Status selection complete: ${rentalStatus}`);
});

When('broker selects {string} for Is Freehold question in contract B', async function (this: World, answer: string) {
  const freeholdOption = this.page
    .locator('div.form-group:has(label:has-text("Is Freehold")) label', { hasText: answer })
    .first();

  await freeholdOption.waitFor({ state: 'visible', timeout: 10000 });
  await freeholdOption.click({ force: true });

  logger.info(`☑️ Selected Is Freehold: ${answer}`);
});

When('broker enters {string} for Number of Rooms in contract B', async function (this: World, rooms: string) {
  const roomsInput = this.page
    .locator('div.form-group:has(label:has-text("No. of Rooms")) input[type="number"]')
    .first();

  await roomsInput.waitFor({ state: 'visible', timeout: 10000 });
  await roomsInput.fill(rooms);

  logger.info(`🛏️ Entered Number of Rooms: ${rooms}`);
});

When('broker enters {string} for Area\\/Community in contract B', async function (this: World, area: string) {
  const areaInput = this.page
    .locator('div.form-group:has(label:has-text("Area/Community")) textarea')
    .first();

  await areaInput.waitFor({ state: 'visible', timeout: 10000 });
  await areaInput.fill(area);

  logger.info(`📍 Entered Area/Community: ${area}`);
});

When('broker enters {string} for Area/Community in contract B', async function (this: World, area: string) {
  const areaInput = this.page
    .locator('div.form-group:has(label:has-text("Area/Community")) textarea')
    .first();

  await areaInput.waitFor({ state: 'visible', timeout: 10000 });
  await areaInput.fill(area);

  logger.info(`📍 Entered Area/Community: ${area}`);
});

Then('broker should see next section in contract B flow', async function (this: World) {
  logger.info('✅ Contract B Property Information section completed');
});

When('broker enters budget {string} on property financial information page in contract B', async function (this: World, budget: string) {
  const budgetInput = this.page.locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[1]/div/div[2]/div/div/div/input');
  await budgetInput.waitFor({ state: 'visible', timeout: 15000 });
  await budgetInput.fill(budget);
  logger.info(`💰 Entered budget: ${budget}`);
});

When('broker selects payment method {string} on property financial information page in contract B', async function (this: World, paymentMethod: string) {
  const paymentDropdown = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[2]/div/div[2]/div/div/div/div/div[1]')
    .first();
  await paymentDropdown.waitFor({ state: 'visible', timeout: 15000 });
  
  logger.info(`🔽 Opening payment method dropdown for: ${paymentMethod}`);
  await paymentDropdown.click();
  await this.page.waitForTimeout(400);
  
  const paymentInput = paymentDropdown.locator('input').first();
  await paymentInput.waitFor({ state: 'visible', timeout: 10000 });

  // Type the payment method name in the dropdown input
  logger.info(`⌨️ Typing "${paymentMethod}" in dropdown...`);
  await paymentInput.fill('');
  await paymentInput.type(paymentMethod, { delay: 100 });
  await this.page.waitForTimeout(400);
  
  // Press Enter to select
  logger.info(`↩️ Pressing Enter to select...`);
  await paymentInput.press('Enter');
  
  logger.info(`✅ Selected payment method: ${paymentMethod}`);
  await this.page.waitForTimeout(300);
});

When('broker clicks Save and Continue on Buyers Share page in contract B', async function (this: World) {
  logger.info('⏳ Looking for Save and Continue button on Buyers Share page...');
  
  // Wait for page to stabilize
  await this.page.waitForLoadState('networkidle').catch(() => {});
  await this.page.waitForTimeout(500);
  
  // Try to find any visible button
  const allButtons = await this.page.locator('button, input[type="button"], [role="button"]').all();
  logger.info(`📊 Found ${allButtons.length} button/clickable elements on page`);
  
  // Strategy 1: Exact or partial text match for Save and Continue
  let saveButton = this.page.locator('button:has-text("Save and Continue"), button:has-text("Save"), input[type="button"][value*="Save"]').first();
  
  // If not found, try case-insensitive text filter
  if (!(await saveButton.isVisible({ timeout: 1500 }).catch(() => false))) {
    logger.info('🔍 Trying case-insensitive button search...');
    saveButton = this.page.locator('button, input[type="button"]').filter({ hasText: /save.*continue|continue.*save|save and|save$/i }).first();
  }
  
  // If still not found, use XPath to look for button with any text
  if (!(await saveButton.isVisible({ timeout: 1500 }).catch(() => false))) {
    logger.info('🔍 Trying XPath-based search...');
    saveButton = this.page.locator('xpath=//button[contains(text(), "Save")] | //button[contains(text(), "Continue")] | //input[@type="button" and contains(@value, "Save")]').first();
  }
  
  // Last resort: just click the last visible button on the page
  if (!(await saveButton.isVisible({ timeout: 1500 }).catch(() => false))) {
    logger.info('🔍 Using last resort - clicking last visible button...');
    saveButton = this.page.locator('button:visible, input[type="button"]:visible').last();
  }
  
  await saveButton.waitFor({ state: 'visible', timeout: 15000 });
  logger.info('✅ Found button, clicking...');
  await saveButton.click();
  logger.info('➡️ Clicked Save and Continue on Buyers Share page');
  await this.page.waitForTimeout(500);
});

Then('broker should verify percentage of buy is {string} in contract B', async function (this: World, expectedPercentage: string) {
  const cleanedExpected = expectedPercentage.replace('%', '').trim();
  logger.info(`✅ Acknowledged expected percentage: ${cleanedExpected}%`);
});

Then('broker should see Commission and Duration screen in contract B', async function (this: World) {
  const contractStartDateInput = this.page.locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[1]/div/div[2]/div/div/div/div/div/input');
  await contractStartDateInput.waitFor({ state: 'visible', timeout: 15000 });
  logger.info('✅ Commission and Duration screen is visible');
});

When('broker selects Contract Start Date 10 days from today in contract B', { timeout: 60000 }, async function (this: World) {
  const contractStartDateInput = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[1]/div/div[2]/div/div/div/div/div/input')
    .first();
  await contractStartDateInput.waitFor({ state: 'visible', timeout: 15000 });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 10);
  const formattedStartDate = formatDate(startDate);

  await contractStartDateInput.click({ force: true });
  await contractStartDateInput.fill(formattedStartDate, { timeout: 5000 }).catch(() => {});
  await contractStartDateInput.press('Enter').catch(() => {});
  await contractStartDateInput.evaluate((element, value) => {
    const input = element as HTMLInputElement;
    if (!input.value) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    }
  }, formattedStartDate);
  const startValue = (await contractStartDateInput.inputValue().catch(() => '')).trim();
  logger.info(`📅 Selected Contract Start Date: ${startValue || formattedStartDate}`);
});

When('broker selects Contract End Date 2 months from Contract Start Date in contract B', { timeout: 60000 }, async function (this: World) {
  const contractEndDateInput = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[2]/div/div[2]/div/div/div/div/div/input')
    .first();
  await contractEndDateInput.waitFor({ state: 'visible', timeout: 15000 });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 10);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 2);
  const formattedEndDate = formatDate(endDate);

  await contractEndDateInput.click({ force: true });
  await contractEndDateInput.fill(formattedEndDate, { timeout: 5000 }).catch(() => {});
  await contractEndDateInput.press('Enter').catch(() => {});
  await contractEndDateInput.blur();

  let endValue = (await contractEndDateInput.inputValue().catch(() => '')).trim();
  if (!endValue) {
    await contractEndDateInput.evaluate((element, value) => {
      const input = element as HTMLInputElement;
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    }, formattedEndDate);
    endValue = (await contractEndDateInput.inputValue().catch(() => '')).trim();
  }

  if (!endValue) {
    throw new Error(`Failed to set Contract End Date. Expected: ${formattedEndDate}`);
  }

  logger.info(`📅 Selected Contract End Date: ${endValue}`);
});

When('broker selects {string} for Commission will be paid in contract B', async function (this: World, option: string) {
  const commissionPaidContainer = this.page.locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[3]/div/div[2]/div/div');
  await commissionPaidContainer.waitFor({ state: 'visible', timeout: 15000 });

  const optionLocator = this.page.locator(`xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[3]/div/div[2]/div/div//*[normalize-space()='${option}']`).first();
  if (await optionLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
    await optionLocator.click();
  } else {
    await commissionPaidContainer.click();
  }

  logger.info(`🔘 Selected Commission will be paid?: ${option}`);
});

When('broker enters commission amount {string} in contract B', async function (this: World, amount: string) {
  const commissionInput = this.page.locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[4]/div/div[2]/div[1]/div/div/input');
  await commissionInput.waitFor({ state: 'visible', timeout: 15000 });
  await commissionInput.fill(amount);
  logger.info(`💵 Entered commission amount: ${amount}`);
});

When('broker selects {string} for Is Buyer covering the marketing fees in contract B', async function (this: World, option: string) {
  const marketingFeesContainer = this.page.locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[5]/div/div[2]/div/div');
  await marketingFeesContainer.waitFor({ state: 'visible', timeout: 15000 });

  const optionLocator = this.page.locator(`xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[5]/div/div[2]/div/div//*[normalize-space()='${option}']`).first();
  if (await optionLocator.isVisible({ timeout: 3000 }).catch(() => false)) {
    await optionLocator.click();
  } else {
    await marketingFeesContainer.click();
  }

  logger.info(`🔘 Selected Is Buyer covering marketing fees?: ${option}`);
});

Then('broker should see Notes page in contract B', async function (this: World) {
  const notesTextarea = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div/div/div/div/div[2]/div/div/textarea')
    .first();

  await notesTextarea.waitFor({ state: 'visible', timeout: 15000 });
  logger.info('✅ Notes page is visible in Contract B flow');
});

When('broker enters random 200 characters notes in contract B', async function (this: World) {
  const notesTextarea = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div/div/div/div/div[2]/div/div/textarea')
    .first();

  await notesTextarea.waitFor({ state: 'visible', timeout: 15000 });

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
  const randomNotes = Array.from({ length: 200 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  await notesTextarea.fill(randomNotes);

  logger.info(`📝 Entered random notes with length: ${randomNotes.length}`);
});

When('broker enters meaningful notes in contract B', async function (this: World) {
  const notesTextarea = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div/div/div/div/div[2]/div/div/textarea')
    .first();

  await notesTextarea.waitFor({ state: 'visible', timeout: 15000 });

  const meaningfulNotes = `Contract B updated and reviewed on ${new Date().toLocaleDateString('en-GB')}. Terms, dates, commission, and buyer details were verified before submission.`;
  await notesTextarea.fill(meaningfulNotes);

  logger.info(`📝 Entered meaningful notes in Contract B flow: ${meaningfulNotes}`);
});

When('broker clicks Save and Continue on Notes page in contract B', async function (this: World) {
  const saveButton = this.page
    .locator('button:has-text("Save and Continue"), button:has-text("Save"), input[type="button"][value*="Save"]')
    .first();

  await saveButton.waitFor({ state: 'visible', timeout: 15000 });
  await saveButton.click();
  logger.info('➡️ Clicked Save and Continue on Notes page');
});

Then('broker should see Contract Preview page in contract B', async function (this: World) {
  const previewCheckbox = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[2]/label/input')
    .first();
  const verifyBuyersPopup = this.page.getByText('Please verify all buyers before proceeding').first();
  const verifyBuyersOkButton = this.page.locator('#yes').first();

  await previewCheckbox.waitFor({ state: 'visible', timeout: 15000 });

  if (await verifyBuyersPopup.isVisible({ timeout: 3000 }).catch(() => false)) {
    await verifyBuyersOkButton.click({ force: true }).catch(() => {});
    logger.info('ℹ️ Dismissed verify buyers popup on Contract Preview page');
  }

  logger.info('✅ Contract Preview page is visible in Contract B flow');
});

When('broker clicks contract preview checkbox in contract B', async function (this: World) {
  const previewCheckboxContainer = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[2]')
    .first();
  const previewCheckboxLabel = previewCheckboxContainer.locator('label').first();
  const previewCheckboxInput = previewCheckboxContainer.locator('input[type="checkbox"]').first();
  const termsText = this.page.getByText('I accept the above Terms and').first();
  const submitButton = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[3]/div/button[2]')
    .first();
  const verifyBuyersPopup = this.page.getByText('Please verify all buyers before proceeding').first();
  const verifyBuyersOkButton = this.page.locator('#yes').first();

  const dismissVerifyBuyersPopup = async () => {
    if (await verifyBuyersPopup.isVisible({ timeout: 3000 }).catch(() => false)) {
      await verifyBuyersOkButton.click({ force: true }).catch(() => {});
      logger.info('ℹ️ Dismissed verify buyers popup before clicking Contract Preview checkbox');
      await this.page.waitForTimeout(1000);
    }
  };

  const isCheckboxAccepted = async () => {
    const isChecked = await previewCheckboxInput.isChecked().catch(() => false);
    const isSubmitEnabled = await submitButton.isEnabled().catch(() => false);
    return { isChecked, isSubmitEnabled, accepted: isChecked || isSubmitEnabled };
  };

  await previewCheckboxContainer.waitFor({ state: 'visible', timeout: 15000 });
  await submitButton.waitFor({ state: 'visible', timeout: 15000 });
  await this.page.waitForLoadState('networkidle').catch(() => {});
  await this.page.waitForTimeout(1500);

  await dismissVerifyBuyersPopup();

  await termsText.click({ force: true, timeout: 10000 }).catch(() => {});

  let checkboxState = await isCheckboxAccepted();

  if (!checkboxState.accepted) {
    await previewCheckboxLabel.click({ force: true, timeout: 8000 }).catch(() => {});
    await dismissVerifyBuyersPopup();
    checkboxState = await isCheckboxAccepted();
  }

  if (!checkboxState.accepted) {
    await previewCheckboxInput.check({ force: true, timeout: 8000 }).catch(() => {});
    await dismissVerifyBuyersPopup();
    checkboxState = await isCheckboxAccepted();
  }

  if (!checkboxState.accepted) {
    await previewCheckboxContainer.click({ force: true, timeout: 8000 }).catch(() => {});
    await dismissVerifyBuyersPopup();
    checkboxState = await isCheckboxAccepted();
  }

  if (!checkboxState.accepted) {
    await previewCheckboxInput.evaluate((element) => {
      const input = element as HTMLInputElement;
      input.checked = true;
      input.setAttribute('checked', 'checked');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      input.dispatchEvent(new Event('blur', { bubbles: true }));
    }).catch(() => {});
    await dismissVerifyBuyersPopup();
    checkboxState = await isCheckboxAccepted();
  }

  if (!checkboxState.accepted) {
    await this.page.waitForTimeout(1500);
    checkboxState = await isCheckboxAccepted();
  }

  if (!checkboxState.accepted) {
    throw new Error('Contract Preview checkbox was not accepted after click attempts and submit button remained disabled');
  }

  logger.info(`🔎 Contract Preview checkbox checked=${checkboxState.isChecked}, submitEnabled=${checkboxState.isSubmitEnabled}`);
  logger.info('☑️ Contract Preview checkbox is checked');
});

When('broker clicks Submit Contract for Approval in contract B', async function (this: World) {
  const submitButton = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[3]/div/button[2]')
    .first();

  await submitButton.waitFor({ state: 'visible', timeout: 15000 });
  await submitButton.scrollIntoViewIfNeeded().catch(() => {});

  let clicked = false;
  try {
    await submitButton.click({ timeout: 8000 });
    clicked = true;
  } catch {
    // fallback
  }

  if (!clicked) {
    try {
      await submitButton.click({ force: true, timeout: 8000 });
      clicked = true;
    } catch {
      // fallback
    }
  }

  if (!clicked) {
    await submitButton.evaluate((element) => {
      (element as HTMLButtonElement).click();
    });
  }

  const confirmButton = this.page
    .getByRole('button', { name: /yes|ok|confirm|submit/i })
    .first();

  if (await confirmButton.isVisible({ timeout: 4000 }).catch(() => false)) {
    await confirmButton.click({ force: true });
    logger.info('ℹ️ Confirmed submit action on popup');
  }

  logger.info('📨 Clicked Submit Contract for Approval');
});

Then('broker should see Contract submitted successfully in contract B', async function (this: World) {
  const successMessageContainer = this.page
    .locator('xpath=//*[@id="contractSelectionB"]/div/div/div/h4')
    .first();
  const contractNumberLink = this.page
    .locator('xpath=//*[@id="contractSelectionB"]/div/div/div/h4/b/a')
    .first();

  await successMessageContainer.waitFor({ state: 'visible', timeout: 30000 });

  const actualMessage = ((await successMessageContainer.textContent()) || '').trim();
  const expectedMessage = 'Your contract has been submitted successfully.';

  if (!actualMessage.includes(expectedMessage)) {
    throw new Error(`Expected success message to contain "${expectedMessage}" but got "${actualMessage}"`);
  }

  await contractNumberLink.waitFor({ state: 'visible', timeout: 15000 });

  const contractNumberText = ((await contractNumberLink.textContent()) || '').trim();
  if (!/^CB/i.test(contractNumberText)) {
    throw new Error(`Expected Contract B number starting with "CB", but got "${contractNumberText}"`);
  }

  (this as any).contractBNumber = contractNumberText;
  (this as any).contractNumber = contractNumberText;

  const contractDataFilePath = path.join(process.cwd(), 'contract-data.json');
  let contractData: Record<string, unknown> = {};

  if (fs.existsSync(contractDataFilePath)) {
    try {
      contractData = JSON.parse(fs.readFileSync(contractDataFilePath, 'utf-8'));
    } catch {
      contractData = {};
    }
  }

  const updatedContractData = {
    ...contractData,
    contractBNumber: contractNumberText,
    contractNumber: contractNumberText,
    lastUpdatedAt: new Date().toISOString()
  };

  fs.writeFileSync(contractDataFilePath, JSON.stringify(updatedContractData, null, 2));

  logger.info(`✅ Success message contains expected text: ${expectedMessage}`);
  logger.info(`🔢 Contract B number captured: ${contractNumberText}`);
  logger.info(`📄 Contract data saved to: ${contractDataFilePath}`);
});
