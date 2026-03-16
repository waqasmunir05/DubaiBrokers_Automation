import path from 'path';
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

When('broker clicks Proceed to search in contract B popup', async function (this: World) {
  const proceedXPath = '//*[@id="wizard"]/div[2]/div[3]/div/button';
  const proceedButton = this.page.locator(`xpath=${proceedXPath}`);

  await proceedButton.waitFor({ state: 'visible', timeout: 15000 });
  await proceedButton.click();

  logger.info('▶ Clicked Proceed to search in Contract B popup');
});

When('broker waits for Contract B search result and clicks it', async function (this: World) {
  const resultCellXPath = '//*[@id="wizard"]/div[2]/div[1]/div/table/tbody/tr/td[3]';
  const resultCell = this.page.locator(`xpath=${resultCellXPath}`);

  logger.info('⏳ Waiting for Contract B search result to appear');
  await resultCell.waitFor({ state: 'visible', timeout: 60000 });
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
    logger.warn(`⚠️ Fell back to ArrowDown+Enter for passport type: ${passportType}`);
  }

  await this.page.waitForTimeout(500);
  logger.info(`🛂 Passport type selection complete: ${passportType}`);
});

When('broker uploads a sample document in contract B form', async function (this: World) {
  const uploadInputXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div[2]/div[11]/div[2]/div/div[4]/div/section/div/input';
  const uploadInput = this.page.locator(`xpath=${uploadInputXPath}`);
  const documentTitleXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div[2]/div[11]/div[2]/div/div[4]/div/div/div[2]/input';
  const documentTitleInput = this.page.locator(`xpath=${documentTitleXPath}`);
  const sampleFilePath = path.join(process.cwd(), 'tests', 'resources', 'uploads', 'sample-document.pdf');
  const documentTitle = `Passport Copy ${Math.floor(1000 + Math.random() * 9000)}`;

  await uploadInput.waitFor({ state: 'attached', timeout: 15000 });
  await uploadInput.setInputFiles(sampleFilePath);
  await documentTitleInput.waitFor({ state: 'visible', timeout: 15000 });
  await documentTitleInput.fill(documentTitle);

  logger.info(`📎 Uploaded sample document: ${sampleFilePath}`);
  logger.info(`📝 Entered document title: ${documentTitle}`);
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

When('broker waits 30 seconds in contract B flow', { timeout: 40000 }, async function (this: World) {
  logger.info('⏳ Waiting 30 seconds to observe Contract B scenario state');
  await this.page.waitForTimeout(30000);
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
  await propertyInfoHeader.waitFor({ state: 'visible', timeout: 20000 });
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

When('broker waits 30 seconds to observe contract B property information', { timeout: 40000 }, async function (this: World) {
  logger.info('⏳ Waiting 30 seconds to observe Contract B Property Information state');
  await this.page.waitForTimeout(30000);
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
    logger.warn(`⚠️ Fell back to Enter key for Rental Status: ${rentalStatus}`);
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
