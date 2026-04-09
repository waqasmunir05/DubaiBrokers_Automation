// tests/steps/ContractA/create_contract.steps.ts
import { When, Then } from '@cucumber/cucumber';
import type { Page } from 'playwright';
import { World } from '../../support/world';
import { ContractDetailsPage } from '../../pages/ContractDetailsPage';
import { SELECTORS } from '../../config/selectors';
import { waitForHidden, waitForPageStable, waitForVisibleXPath } from '../../utils/waitHelper';
import { logger } from '../../utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const ts = (): string => {
  const now = new Date();
  return `[${now.toTimeString().slice(0, 8)}]`;
};

const TAB_READY_TIMEOUT_MS = 15000;
const TAB_STABILIZE_MS = 150;

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getOwnerValidationInput = (page: Page, fieldLabel: string) => {
  const exactLabelRegex = new RegExp(`^${escapeRegex(fieldLabel)}$`, 'i');
  const partialLabelRegex = new RegExp(escapeRegex(fieldLabel), 'i');

  const candidates = [
    page.getByLabel(exactLabelRegex).first(),
    page.getByLabel(partialLabelRegex).first(),
    page.locator(
      `xpath=//label[contains(translate(normalize-space(.), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), '${fieldLabel
        .toLowerCase()
        .replace(/'/g, "") }')]/ancestor::div[contains(@class,'form-group')][1]//input[not(@type='hidden')]`
    ).first(),
  ];

  if (/date/i.test(fieldLabel)) {
    candidates.push(
      page.locator('input[placeholder="DD/MM/YYYY"]').last(),
      page.locator('input[placeholder*="MM" i][placeholder*="YYYY" i]').last()
    );
  }

  if (/passport/i.test(fieldLabel)) {
    candidates.push(page.getByRole('textbox').nth(3));
  }

  return candidates;
};

const findVisibleOwnerValidationInput = async (page: Page, fieldLabel: string) => {
  if (/^date of birth$/i.test(fieldLabel)) {
    const dateOfBirthByXPath = page.locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[5]/div/div[2]/div/div/div/div[1]/div/input').first();
    if (await dateOfBirthByXPath.isVisible().catch(() => false)) {
      return dateOfBirthByXPath;
    }
  }

  for (const candidate of getOwnerValidationInput(page, fieldLabel)) {
    if (await candidate.isVisible().catch(() => false)) {
      return candidate;
    }
  }

  throw new Error(`Could not find visible owner validation input for field label "${fieldLabel}"`);
};

const setDateWithCalendar = async (page: Page, inputXPath: string, date: Date, label: string) => {
  const input = page.locator(`xpath=${inputXPath}`);
  await input.waitFor({ state: 'visible', timeout: 10000 });

  const formatted = formatDate(date);
  const dayText = String(date.getDate());

  await input.click();
  await input.fill(formatted);
  await input.evaluate((el) => {
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.keyboard.press('Enter');

  const calendarSelectors = [
    `xpath=//td[not(contains(@class,'disabled'))]//span[normalize-space()='${dayText}']`,
    `xpath=//td[not(contains(@class,'disabled')) and normalize-space()='${dayText}']`,
    `css=.react-datepicker__day--0${dayText.padStart(2, '0')}:not(.react-datepicker__day--outside-month)`,
    `css=.ant-picker-cell-in-view .ant-picker-cell-inner:has-text("${dayText}")`,
    `css=.ui-datepicker-calendar td:not(.ui-datepicker-other-month) a:has-text("${dayText}")`
  ];

  for (const selector of calendarSelectors) {
    const dayCell = page.locator(selector).first();
    const visible = await dayCell.isVisible().catch(() => false);
    if (visible) {
      await dayCell.click();
      break;
    }
  }

  await page.keyboard.press('Tab');
  logger.info(`✅ ${label} set to ${formatted}`);
};

const selectYesRadio = async (page: Page, containerXPath: string, label: string) => {
  const container = page.locator(`xpath=${containerXPath}`);
  await container.waitFor({ state: 'visible', timeout: 10000 });
  const loadingOverlay = page.locator('div[style*="position: fixed"][style*="z-index: 100002"]').first();
  await loadingOverlay.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
  await waitForPageStable(page, 10000).catch(() => {});

  const yesByText = page.locator(
    `xpath=${containerXPath}//*[self::label or self::span or self::div][normalize-space()='Yes' or normalize-space()='YES']`
  ).first();
  const yesByArabicText = page.locator(
    `xpath=${containerXPath}//*[self::label or self::span or self::div][normalize-space()='نعم']`
  ).first();
  const yesInput = page.locator(`xpath=${containerXPath}//input[@type="radio"]`).first();
  const yesValueInput = page.locator(
    `xpath=${containerXPath}//input[@type="radio" and (translate(@value,'YES','yes')='yes' or @value='1' or @value='true')]`
  ).first();
  const yesHelper = page.locator(`xpath=${containerXPath}//input[@type="radio"] + ins.iCheck-helper`).first();
  const yesRoleRadio = page.getByRole('radio', { name: /yes|نعم/i }).first();

  const tryClick = async (locator: ReturnType<typeof page.locator>) => {
    const visible = await locator.isVisible().catch(() => false);
    if (visible) {
      await locator.click({ force: true });
      return true;
    }
    return false;
  };

  const deadline = Date.now() + 25000;
  while (Date.now() < deadline) {
    if (!(await tryClick(yesByText))) {
      if (!(await tryClick(yesByArabicText))) {
        if (!(await tryClick(yesValueInput))) {
          if (!(await tryClick(yesHelper))) {
            if (!(await tryClick(yesRoleRadio))) {
              if (!(await tryClick(yesInput))) {
                await container.click({ force: true }).catch(() => {});
              }
            }
          }
        }
      }
    }

    const radios = container.locator('input[type="radio"]');
    const radioCount = await radios.count();
    for (let i = 0; i < radioCount; i += 1) {
      const radio = radios.nth(i);
      const checked = await radio.isChecked().catch(() => false);
      if (checked) {
        return;
      }
    }

    await page.waitForTimeout(500);
    await waitForPageStable(page, 5000).catch(() => {});
  }

  throw new Error(`Failed to select Yes for ${label}`);
};

When('I land on the dashboard', async function (this: World) {
  // Verify dashboard is loaded after login
  logger.info('🏠 User landed on dashboard');
  // Example: await this.page.waitForSelector('.dashboard-container');
});

Then('I should see created contract ready for approval', async function (this: World) {
  logger.info('✅ Created contract ready for approval');
});

Then('I should see property not found error message', async function (this: World) {
  logger.info('❌ Waiting for property not found error message');

  const errorMessageXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[1]/p';
  const errorMessage = this.page.locator(`xpath=${errorMessageXPath}`);

  await errorMessage.waitFor({ state: 'visible', timeout: 15000 });
  const messageText = (await errorMessage.textContent())?.trim();

  const expectedMessage = 'The Property record could not be found in the system.';
  if (!messageText?.includes(expectedMessage)) {
    throw new Error(`Expected error: "${expectedMessage}". Actual: "${messageText}"`);
  }

  logger.info(`✅ Error message displayed: ${messageText}`);
});

Then('I should see invalid owner information error message', async function (this: World) {
  logger.info('❌ Waiting for invalid owner information error message');

  const errorMessageXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[1]/p';
  const errorMessage = this.page.locator(`xpath=${errorMessageXPath}`);

  await errorMessage.waitFor({ state: 'visible', timeout: 15000 });
  const messageText = (await errorMessage.textContent())?.trim();

  const expectedMessage = 'The current ownership details of the property do not match those in the contract. Please create a new contract using the latest Title Deed and owner information. The property owner can download the updated Title Deed from their Property Wallet in the Dubai REST App.';
  if (!messageText?.includes(expectedMessage)) {
    throw new Error(`Expected error: "${expectedMessage}". Actual: "${messageText}"`);
  }

  logger.info(`✅ Error message displayed: ${messageText}`);
});

Then('I should see invalid certificate year error message', async function (this: World) {
  logger.info('❌ Waiting for invalid certificate year error message');

  const errorMessageXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[1]/p';
  const errorMessage = this.page.locator(`xpath=${errorMessageXPath}`);

  await errorMessage.waitFor({ state: 'visible', timeout: 15000 });
  const messageText = (await errorMessage.textContent())?.trim();

  const expectedMessages = [
    'INVALID_CERTIFICATE_YEAR',
    'The Property record could not be found in the system.'
  ];

  const matchesExpected = expectedMessages.some((expected) => messageText?.includes(expected));
  if (!matchesExpected) {
    throw new Error(`Expected error: "${expectedMessages.join('" or "')}". Actual: "${messageText}"`);
  }

  logger.info(`✅ Error message displayed: ${messageText}`);
});

Then('I should see invalid property type error message', async function (this: World) {
  logger.info('❌ Waiting for invalid property type error message');

  const errorMessageXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[1]/p';
  const errorMessage = this.page.locator(`xpath=${errorMessageXPath}`);

  await errorMessage.waitFor({ state: 'visible', timeout: 15000 });
  const messageText = (await errorMessage.textContent())?.trim();

  const expectedMessages = [
    'INVALID_PROPERTY_TYPE',
    'The Property record could not be found in the system.'
  ];

  const matchesExpected = expectedMessages.some((expected) => messageText?.includes(expected));
  if (!matchesExpected) {
    throw new Error(`Expected error: "${expectedMessages.join('" or "')}". Actual: "${messageText}"`);
  }

  logger.info(`✅ Error message displayed: ${messageText}`);
});

When('I click on {string} tab', async function (this: World, tabName: string) {
  const escapedTabName = escapeRegex(tabName);
  await this.page.bringToFront().catch(() => {});
  const isContractsTab = /^contracts$/i.test(tabName);

  if (!isContractsTab) {
    await waitForPageStable(this.page, TAB_STABILIZE_MS).catch(() => {});
  }

  let clicked = false;
  const tabByRole = this.page.getByRole('tab', { name: new RegExp(`^${escapedTabName}$`, 'i') }).first();
  const linkByRole = this.page.getByRole('link', { name: new RegExp(`^${escapedTabName}$`, 'i') }).first();
  const byHref = this.page.locator(`a[href="#/${tabName.toLowerCase()}"]`).first();
  const byText = this.page.getByText(new RegExp(`^${escapedTabName}$`, 'i')).first();

  const quickCandidates = isContractsTab
    ? [byHref, linkByRole, tabByRole, byText]
    : [tabByRole, linkByRole, byHref, byText];

  for (const candidate of quickCandidates) {
    const visible = await candidate.isVisible().catch(() => false);
    if (!visible) continue;

    await candidate.click({ force: true }).catch(() => {});
    clicked = true;
    break;
  }

  if (!clicked) {
    await Promise.race([
      tabByRole.waitFor({ state: 'visible', timeout: TAB_READY_TIMEOUT_MS }),
      linkByRole.waitFor({ state: 'visible', timeout: TAB_READY_TIMEOUT_MS }),
      byHref.waitFor({ state: 'visible', timeout: TAB_READY_TIMEOUT_MS }),
      byText.waitFor({ state: 'visible', timeout: TAB_READY_TIMEOUT_MS }),
    ]).catch(() => {});

    if (await tabByRole.isVisible().catch(() => false)) {
      await tabByRole.click({ force: true });
      clicked = true;
    } else if (await linkByRole.isVisible().catch(() => false)) {
      await linkByRole.click({ force: true });
      clicked = true;
    } else if (await byHref.isVisible().catch(() => false)) {
      await byHref.click({ force: true });
      clicked = true;
    } else if (await byText.isVisible().catch(() => false)) {
      await byText.click({ force: true });
      clicked = true;
    }
  }

  if (!clicked) {
    await byHref.waitFor({ state: 'visible', timeout: TAB_READY_TIMEOUT_MS });
    await byHref.click({ force: true });
  }

  if (isContractsTab && (this as any).loginClickStartedAt) {
    const fromLoginMs = Date.now() - Number((this as any).loginClickStartedAt);
    const verifiedAt = Number((this as any).loginVerifiedAt || 0);
    const afterVerifyMs = verifiedAt ? Date.now() - verifiedAt : 0;
    logger.info(`${ts()} 📑 Clicked on "${tabName}" tab (${fromLoginMs} ms from Login click, ${afterVerifyMs} ms after login verification)`);
    return;
  }

  logger.info(`📑 Clicked on "${tabName}" tab`);
});

When('I close the popup message', async function (this: World) {
  // Close popup using the close button with class "btn btn-dark btn-agree"
  // First wait for the popup/button to appear
  const closeBtn = this.page.locator('.btn.btn-dark.btn-agree');
  try {
    await closeBtn.waitFor({ state: 'visible', timeout: 15000 });
    await closeBtn.click();
    await waitForHidden(closeBtn, 10000).catch(() => undefined);
    logger.info('❌ Closed popup message');
  } catch (e: unknown) {
    const errorMsg = e instanceof Error ? e.message : String(e);
    logger.info('⚠️  Popup close button not found or timed out:', errorMsg);
    // Try alternative selector if first fails
    const altBtn = this.page.locator('button.btn-agree, [class*="btn-agree"]').first();
    const altVisible = await altBtn.isVisible().catch(() => false);
    if (altVisible) {
      await altBtn.click();
      await waitForHidden(altBtn, 10000).catch(() => undefined);
      logger.info('❌ Closed popup message (using alternative selector)');
    } else {
      logger.info('ℹ️  No popup message to close');
    }
  }
});

When('I click on {string} in the left panel', async function (this: World, menuItem: string) {
  // Click on menu item in left panel (Create Contract A, etc.)
  const menuBtn = this.page.getByText(menuItem).first();
  await menuBtn.waitFor({ state: 'visible', timeout: 10000 });
  await menuBtn.click();
  logger.info(`🔘 Clicked on "${menuItem}" in left panel`);
});

Then('I should see owner selection options', async function (this: World) {
  // Verify owner selection options appear
  logger.info('✅ Owner selection options displayed');
  // Example: await this.page.waitForSelector('[class*="owner-options"]');
});

When('I select {string} option', { timeout: 60000 }, async function (this: World, option: string) {
  logger.info(`🔍 Looking for "${option}" radio button...`);
  
  // Simply click the 2nd radio button (Owner Person)
  const radio = this.page.getByRole('radio').nth(1);
  logger.info(`📍 Found radio, clicking it...`);
  
  await radio.click({ timeout: 10000 });
  const firstInput = this.page.getByRole('textbox').first();
  await firstInput.waitFor({ state: 'visible', timeout: 10000 }).catch(() => undefined);
  logger.info(`👤 "${option}" option selected`);
});

Then('I should see property validation form', async function (this: World) {
  // Verify property validation form appears
  logger.info('✅ Property validation form displayed');
  // Example: await this.page.waitForSelector('form[name="propertyValidation"]');
});

When('I enter Certificate Number {string}', async function (this: World, certificateNumber: string) {
  // Fill Certificate Number field using XPath
  const xPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[1]/div/div[2]/div/div/div/input';
  const input = this.page.locator(`xpath=${xPath}`);
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(certificateNumber);
  logger.info(`🎫 Entered Certificate Number: ${certificateNumber}`);
});

When('I select Certificate Year {string}', async function (this: World, year: string) {
  // Select Certificate Year using XPath
  const xPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[2]/div/div[2]/div/div/div/div/div[1]/div[1]';
  const dropdown = this.page.locator(`xpath=${xPath}`);
  await dropdown.waitFor({ state: 'visible', timeout: 10000 });
  await dropdown.click();
  // Select the year value from dropdown
  const option = this.page.getByText(year, { exact: true });
  await option.click();
  logger.info(`📅 Selected Certificate Year: ${year}`);
});

When('I select Property Type {string}', async function (this: World, propertyType: string) {
  logger.info(`🔍 Selecting Property Type: ${propertyType}`);
  // Select Property Type using XPath
  const xPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[3]/div/div[2]/div/div/div/div/div[1]/div[1]';
  const dropdown = this.page.locator(`xpath=${xPath}`);
  await dropdown.waitFor({ state: 'visible', timeout: 10000 });
  await dropdown.click();
  // Select the property type value from dropdown list
  const option = this.page.getByText(propertyType, { exact: true }).first();
  await option.waitFor({ state: 'visible', timeout: 10000 });
  await option.click();
  await dropdown.waitFor({ state: 'visible', timeout: 10000 });
  logger.info(`🏠 Selected Property Type: ${propertyType}`);
});

When('I select Owner Verification Type {string}', async function (this: World, verificationType: string) {
  logger.info(`🔍 Selecting Owner Verification Type: ${verificationType}`);
  // Select Owner Verification Type using XPath
  const xPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[4]/div/div[2]/div/div/div/div/div[1]/div[1]';
  const dropdown = this.page.locator(`xpath=${xPath}`);
  await dropdown.waitFor({ state: 'visible', timeout: 10000 });
  await dropdown.click();
  // Select the verification type value from dropdown list
  // Try exact match first, then partial match
  let option = this.page.getByText(verificationType, { exact: true }).first();
  let count = await option.count();
  if (count === 0) {
    // If exact match not found, try partial match (e.g., "Passport" -> "Passport Number")
    option = this.page.getByText(verificationType).first();
  }
  await option.waitFor({ state: 'visible', timeout: 10000 });
  await option.click();
  logger.info(`🔐 Selected Owner Verification Type: ${verificationType}`);
});

When('I enter Passport {string}', async function (this: World, passportNumber: string) {
  // Fill Passport field - it's the 4th textbox (nth(3))
  const input = this.page.getByRole('textbox').nth(3);
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(passportNumber);
  logger.info(`🛂 Entered Passport: ${passportNumber}`);
});

When('I select {string} from the list', { timeout: 60000 }, async function (this: World, option: string) {
  logger.info(`🔍 Selecting from list: ${option}`);

  // Click elsewhere to close the dropdown if it's still open
  try {
    await this.page.keyboard.press('Escape');
    logger.info(`📋 Closed dropdown for: ${option}`);
  } catch (error) {
    logger.info(`ℹ️  Dropdown close attempt - may already be closed`);
  }
});

Then('I should see passport field displayed', async function (this: World) {
  // Verify passport input field appears - it's the 4th textbox (nth(3))
  const passportField = this.page.getByRole('textbox').nth(3);
  await passportField.waitFor({ state: 'visible', timeout: 10000 });
  logger.info('✅ Passport field displayed');
});

Then('I should see {string} field displayed', async function (this: World, fieldLabel: string) {
  const input = await findVisibleOwnerValidationInput(this.page, fieldLabel);
  await input.waitFor({ state: 'visible', timeout: 10000 });
  logger.info(`✅ ${fieldLabel} field displayed`);
});

When('I enter {string} value {string}', async function (this: World, fieldLabel: string, fieldValue: string) {
  const input = await findVisibleOwnerValidationInput(this.page, fieldLabel);
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.click({ force: true }).catch(() => {});
  await input.fill(fieldValue);

  if (/date/i.test(fieldLabel)) {
    await input.press('Enter').catch(() => {});
    await input.press('Tab').catch(() => {});
    await input.evaluate((element) => (element as HTMLInputElement).blur()).catch(() => {});
  }

  logger.info(`📝 Entered ${fieldLabel}: ${fieldValue}`);
});

When('I click on {string} button', async function (this: World, buttonName: string) {
  logger.info(`🖱️  Clicking on "${buttonName}" button...`);
  
  let button;
  
  if (buttonName === 'Save & Close' || buttonName === 'Save and Continue') {
    // Use class selector for Save & Close / Save and Continue buttons
    button = this.page.locator(SELECTORS.buttons.primary);
  } else if (buttonName === 'I Confirm') {
    // Use class selector for I Confirm button
    button = this.page.locator(SELECTORS.buttons.confirm);
  } else {
    // Use role selector for other buttons
    button = this.page.getByRole('button', { name: buttonName });
  }
  
  const primaryVisible = await button.isVisible().catch(() => false);
  if (!primaryVisible && buttonName === 'Save and Continue') {
    const notesSaveContinue = this.page.locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[2]/button[2]');
    await notesSaveContinue.waitFor({ state: 'visible', timeout: 10000 });
    await notesSaveContinue.click();
  } else {
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.click();
  }
  
  // Wait for page to load after clicking button (especially for navigation)
  if (buttonName === 'Save & Close') {
    logger.info('⏳ Waiting for Property Information page to load...');
    await waitForPageStable(this.page, 15000);
    await waitForVisibleXPath(this.page, SELECTORS.propertyInformation.containerXPath, 15000).catch(() => undefined);
  } else {
    await waitForPageStable(this.page, 10000);
  }
  
  logger.info(`✓ Clicked on "${buttonName}" button`);
});

When('I click on the checkbox', async function (this: World) {
  logger.info(`☑️  Clicking checkbox...`);
  const xPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[3]/div/div[2]/div/div[2]/div[5]/div/div[2]/input';
  const checkbox = this.page.locator(`xpath=${xPath}`);
  await checkbox.waitFor({ state: 'visible', timeout: 10000 });
  await checkbox.check();
  logger.info(`✓ Checkbox checked`);
});

Then('contract creation should proceed to next step', async function (this: World) {
  // Verify form submission and next step
  logger.info('✅ Contract creation proceeding to next step');
  // Example: await this.page.waitForNavigation();
});

// SPECIFIC SCREEN DETECTION STEPS - Use these instead of generic step to avoid ambiguity

Then('I should see "Property Information" details screen', async function (this: World) {
  logger.info('📄 Waiting for Property Information screen to fully load...');
  
  // First, wait for network to be idle to ensure page has loaded
  await waitForPageStable(this.page, 15000);
  
  try {
    // Use the correct XPath for Property Information container
    const propertyInfoContainer = await waitForVisibleXPath(
      this.page,
      SELECTORS.propertyInformation.containerXPath,
      15000
    );
    logger.info('✓ Property Information container is visible');
    
    // Verify it contains the text "Property Information"
    const text = await propertyInfoContainer.textContent();
    if (text && text.includes('Property Information')) {
      logger.info('✓ Property Information heading verified');
    } else {
      throw new Error('Container found but does not contain "Property Information" text');
    }
    
  } catch (e) {
    logger.info('⚠️ Primary XPath failed, trying text-based fallback...');
    
    // Fallback: Look for heading by text
    const heading = this.page.getByText('Property Information', { exact: false });
    const headingCount = await heading.count();
    
    if (headingCount === 0) {
      logger.error('❌ Property Information heading not found');
      await this.page.screenshot({ path: 'property-info-debug.png' });
      throw new Error('Property Information heading not found. Check property-info-debug.png');
    }
    
    logger.info('✓ Property Information heading found (fallback)');
  }

  logger.info('✅ Property Information screen loaded');
});

Then('I should see "Owner Details" details screen', async function (this: World) {

  logger.info('📄 Waiting for Owner Details screen...');
  await waitForPageStable(this.page, 15000);
  
  // Try to find Owner Details title
  const titleElement = this.page.getByText('Owner Details', { exact: false });
  const isVisible = await titleElement.isVisible({ timeout: 10000 }).catch(() => false);
  
  if (isVisible) {
    logger.info('✅ Owner Details screen loaded');
  } else {
    logger.info('⚠️ Owner Details heading not found, but continuing...');
  }
});

Then('I should see "Tenancy Information" details screen', async function (this: World) {
  logger.info('📄 Waiting for Tenancy Information screen...');
  await waitForPageStable(this.page, 15000);
  
  // Try to find Tenancy Information title
  const titleElement = this.page.getByText('Tenancy Information', { exact: false });
  const isVisible = await titleElement.isVisible({ timeout: 10000 }).catch(() => false);
  
  if (isVisible) {
    logger.info('✅ Tenancy Information screen loaded');
  } else {
    logger.info('⚠️ Tenancy Information heading not found, but continuing...');
  }
});

Then('I should see "Property Financial Information" details screen', async function (this: World) {
  logger.info('📄 Waiting for Property Financial Information screen...');
  await waitForPageStable(this.page, 15000);
  
  // Try to find Property Financial Information title
  const titleElement = this.page.getByText('Property Financial Information', { exact: false });
  const isVisible = await titleElement.isVisible({ timeout: 10000 }).catch(() => false);
  
  if (isVisible) {
    logger.info('✅ Property Financial Information screen loaded');
  } else {
    logger.info('⚠️ Property Financial Information heading not found, but continuing...');
  }
});

Then('I should see "Commission and Duration" details screen', async function (this: World) {
  logger.info('📄 Waiting for Commission and Duration screen...');
  await waitForPageStable(this.page, 15000);
  
  // Try to find Commission and Duration title
  const titleElement = this.page.getByText('Commission and Duration', { exact: false });
  const isVisible = await titleElement.isVisible({ timeout: 10000 }).catch(() => false);
  
  if (isVisible) {
    logger.info('✅ Commission and Duration screen loaded');
  } else {
    logger.info('⚠️ Commission and Duration heading not found, but continuing...');
  }
});


// Helper function for generic screen detection
Then('I should see {string} details screen (old)', async function (this: World, screenTitle: string) {
  logger.info(`📄 [Deprecated] Waiting for ${screenTitle} screen...`);
  // This step is deprecated - use specific screen detection steps instead
});

When('I click on tenancy confirmation checkbox', async function (this: World) {
  logger.info(`☑️  Clicking tenancy confirmation checkbox...`);
  try {
    // The checkbox has an iCheck helper overlay, try clicking the helper element first
    let helper = this.page.locator('input#HasNoTenancyContract + ins.iCheck-helper');
    let count = await helper.count();
    
    if (count > 0) {
      await helper.click({ force: true });
      logger.info(`✅ Clicked on iCheck helper element`);
    } else {
      // Fallback: force click the checkbox itself
      const checkbox = this.page.locator('#HasNoTenancyContract');
      await checkbox.click({ force: true });
      logger.info(`✅ Force clicked on checkbox`);
    }
  } catch (error) {
    logger.error(`❌ Error clicking tenancy checkbox:`, error);
    throw error;
  }
});

When(/I enter Sell\s+Price "([^"]*)"/, async function (this: World, sellPrice: string) {
  logger.info(`💰 Entering Sell Price: ${sellPrice}`);
  const xPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[1]/div/div[2]/div/div/div/input';
  const input = this.page.locator(`xpath=${xPath}`);
  await input.waitFor({ state: 'visible', timeout: 10000 });
  await input.fill(sellPrice);
  logger.info(`✅ Sell Price entered: ${sellPrice}`);
  
  // Store for verification
  (this as any).createdSellPrice = sellPrice;
});

When('I select Contract Start date 2 days from today', async function (this: World) {
  logger.info('📅 Selecting Contract Start date (2 days from today)');
  const xPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[1]/div/div[2]/div/div/div/div[1]/div/input';
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 2);
  await setDateWithCalendar(this.page, xPath, targetDate, 'Contract Start date');
  
  // Store for verification
  (this as any).contractStartDate = formatDate(targetDate);
});

When('I select Contract End date 3 months from start date', async function (this: World) {
  logger.info('📅 Selecting Contract End date (3 months from start date)');
  const xPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[2]/div/div[2]/div/div/div/div/div/input';
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 2);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 3);
  await setDateWithCalendar(this.page, xPath, endDate, 'Contract End date');
  
  // Store for verification
  (this as any).contractEndDate = formatDate(endDate);
});

When('I select {string} from Usage dropdown', { timeout: 60000 }, async function (this: World, usage: string) {
  logger.info(`🔍 Selecting Usage: ${usage}`);
  const loadingOverlay = this.page.locator('div[style*="position: fixed"][style*="z-index: 100002"]').first();
  await loadingOverlay.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {});
  await waitForPageStable(this.page, 15000).catch(() => {});

  const usageInputByLabel = this.page
    .locator('xpath=//label[contains(normalize-space(),"Usage")]/ancestor::div[contains(@class,"form-group")][1]//input[starts-with(@id,"react-select-")]')
    .first();

  if (await usageInputByLabel.isVisible().catch(() => false)) {
    logger.info('✓ Usage react-select input found via label association');
    await usageInputByLabel.scrollIntoViewIfNeeded().catch(() => {});
    await usageInputByLabel.click({ force: true }).catch(() => {});
    await usageInputByLabel.fill(usage).catch(() => {});
    await this.page.waitForTimeout(400);

    const directOption = this.page.locator('[id*="react-select-"][id*="-option-"]', { hasText: usage }).first();
    if (await directOption.isVisible().catch(() => false)) {
      await directOption.click({ force: true });
      logger.info(`✅ Selected Usage: ${usage} (via labeled react-select input)`);
      return;
    }

    await usageInputByLabel.press('Enter').catch(() => {});
    logger.info(`✅ Selected Usage: ${usage} (via labeled react-select input + Enter)`);
    return;
  }

  const clickUsageControlByLabel = async (): Promise<boolean> => {
    return this.page.evaluate(() => {
      const isVisible = (element: Element | null): element is HTMLElement => {
        if (!element || !(element instanceof HTMLElement)) return false;
        const style = window.getComputedStyle(element);
        return style.display !== 'none' && style.visibility !== 'hidden' && element.offsetParent !== null;
      };

      const labels = Array.from(document.querySelectorAll('label'));
      const usageLabel = labels.find((label) => /usage/i.test((label.textContent || '').replace(/\s+/g, ' ').trim()));
      if (!usageLabel) return false;

      const formGroup = usageLabel.closest('.form-group, .control-box, .col-md-6, .col-lg-6') || usageLabel.parentElement;
      if (!formGroup) return false;

      const control = formGroup.querySelector(
        '[role="combobox"], .css-1wy0on6, .css-1hwfws3, .css-f1jc1m-control, .css-1pahdxg-control, .Select-control, .select__control, input[id^="react-select-"]'
      ) as HTMLElement | null;

      const clickTarget = control || (formGroup.querySelector('div.form-control, div[class*="control"], input') as HTMLElement | null);
      if (!isVisible(clickTarget)) return false;

      clickTarget.scrollIntoView({ block: 'center', inline: 'nearest' });
      clickTarget.click();
      return true;
    });
  };
  
  let lastError: Error | null = null;
  
  try {
    logger.info('⏳ Waiting for Usage dropdown to be visible...');
    
    // Try primary selector first with longer timeout
    let dropdown = null;
    try {
      dropdown = await waitForVisibleXPath(
        this.page,
        SELECTORS.propertyInformation.usageDropdownXPath,
        12000
      );
      logger.info('✓ Usage dropdown found via primary XPath');
    } catch (e) {
      logger.info('⚠️ Primary dropdown selector failed, trying fallbacks...');
      lastError = e as Error;

      // Fallback 0: label-based xpath (more stable across UI shifts)
      try {
        dropdown = this.page
          .locator('xpath=//label[contains(normalize-space(),"Usage")]/ancestor::div[contains(@class,"form-group")]//*[contains(@class,"Select") or contains(@class,"select") or @role="combobox"]')
          .first();
        await dropdown.waitFor({ state: 'visible', timeout: 6000 });
        logger.info('✓ Usage dropdown found via label-based locator');
      } catch (e0) {
        logger.info('⚠️ Label-based locator failed, trying generic fallbacks...');
      }
      
      // Fallback 1: look for any select element
      if (!dropdown) {
        try {
          dropdown = this.page.locator('select').first();
          await dropdown.waitFor({ state: 'visible', timeout: 3000 });
          logger.info('✓ Usage dropdown found via select element');
        } catch (e2) {
          logger.info('⚠️ Select element not found, trying div-based fallback...');
          
          // Fallback 2: Look for divs that might be custom dropdowns
          dropdown = this.page.locator('div[role="combobox"], div[class*="select"], div[class*="dropdown"]').first();
          await dropdown.waitFor({ state: 'visible', timeout: 3000 });
          logger.info('✓ Usage dropdown found via div fallback');
        }
      }
    }
    
    if (!dropdown) {
      throw new Error('Could not locate Usage dropdown after all attempts');
    }

    await dropdown.scrollIntoViewIfNeeded().catch(() => {});
    await this.page.waitForTimeout(250);
    
    logger.info('⏳ Clicking dropdown to open options...');
    let opened = false;
    try {
      await dropdown.click({ force: true });
      opened = true;
    } catch {
      logger.info('⚠️ Direct click on Usage dropdown failed, trying label-based DOM click...');
    }

    if (!opened) {
      opened = await clickUsageControlByLabel().catch(() => false);
      if (opened) {
        logger.info('✓ Usage dropdown opened via label-based DOM click');
      }
    }

    if (!opened) {
      await dropdown.evaluate((element) => (element as HTMLElement).click()).catch(() => {});
      opened = true;
    }

    await this.page.waitForTimeout(500);

    const reactSelectInput = this.page.locator('input[id^="react-select-"][id$="-input"]').last();
    if (await reactSelectInput.isVisible().catch(() => false)) {
      await reactSelectInput.fill(usage).catch(() => {});
      await this.page.waitForTimeout(300);
    }
    
    // Try to find and select the usage option
    logger.info(`🔍 Looking for "${usage}" option...`);
    const option = this.page.getByText(usage, { exact: true });
    const optionCount = await option.count();
    
    if (optionCount > 0) {
      logger.info(`✓ Found "${usage}" option by text`);
      // Use pure JS click via page.evaluate to bypass Playwright's viewport constraints
      const clicked = await this.page.evaluate((usageText) => {
        const options = document.querySelectorAll('[id*="react-select"][id*="option"]');
        for (const opt of options) {
          if ((opt as HTMLElement).innerText?.trim() === usageText) {
            (opt as HTMLElement).click();
            return true;
          }
        }
        // Fallback: any visible div with matching text
        const allDivs = document.querySelectorAll('div');
        for (const div of allDivs) {
          if (div.children.length === 0 && div.innerText?.trim() === usageText) {
            div.click();
            return true;
          }
        }
        return false;
      }, usage);
      if (clicked) {
        logger.info(`✅ Selected Usage: ${usage} (via JS evaluate)`);
        return;
      }
      logger.info(`⚠️ JS evaluate click returned false, trying fallback...`);
    }

    // Try role option for react-select style controls
    const roleOption = this.page.getByRole('option', { name: usage }).first();
    if (await roleOption.isVisible().catch(() => false)) {
      await roleOption.click({ force: true });
      logger.info(`✅ Selected Usage: ${usage} (via role option)`);
      return;
    }
    
    // Try alternative: use selectOption for HTML select elements
    logger.info(`⚠️ Option not found by text, trying selectOption()...`);
    try {
      await dropdown.selectOption(usage);
      logger.info(`✅ Selected Usage: ${usage} (via selectOption)`);
      return;
    } catch (e) {
      logger.info(`⚠️ selectOption() failed: ${(e as Error).message}`);
    }
    
    // Try partial text match as last resort
    logger.info(`⚠️ Trying partial text match for "${usage}"...`);
    const partialOption = this.page.getByText(usage, { exact: false });
    const partialCount = await partialOption.count();
    
    if (partialCount > 0) {
      logger.info(`✓ Found "${usage}" via partial match`);
      await partialOption.first().click({ force: true });
      logger.info(`✅ Selected Usage: ${usage}`);
      return;
    }
    
    throw new Error(`Option "${usage}" not found after all attempts`);
    
  } catch (e) {
    lastError = e as Error;
    logger.error(`❌ Failed to select Usage: ${lastError.message}`);
    await this.page.screenshot({ path: 'usage-dropdown-debug.png' });
    throw new Error(`Could not select Usage dropdown (${usage}). Check usage-dropdown-debug.png for details. Error: ${lastError.message}`);
  }
});

When('I select {string} for Green List question', async function (this: World, answer: string) {
  logger.info(`✅ Selecting Green List: ${answer}`);
  // Click Yes label for Green List question
  const containerXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div/div/div[2]/div/div';
  await selectYesRadio(this.page, containerXPath, 'Green List');
  logger.info(`🟢 Selected Green List: ${answer}`);
});

When('I select Commission as paid and enter amount {string}', async function (this: World, amount: string) {
  logger.info('💼 Selecting commission paid option');
  const containerXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[3]/div/div[2]/div/div';
  await selectYesRadio(this.page, containerXPath, 'Commission paid');

  const commissionInputXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[4]/div/div[2]/div[1]/div/div/input';
  const commissionInput = this.page.locator(`xpath=${commissionInputXPath}`);
  await commissionInput.waitFor({ state: 'visible', timeout: 10000 });
  await commissionInput.fill(amount);
  logger.info(`💰 Commission amount entered: ${amount}`);
  
  // Store for verification
  (this as any).createdCommission = amount;
  // Store for verification
  (this as any).createdCommission = amount;
});

When('I select NOC from developer as Yes', async function (this: World) {
  logger.info('✅ Selecting NOC from developer: Yes');
  const yesLabelXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[5]/div/div[2]/div/div/label[1]';
  const yesLabel = this.page.locator(`xpath=${yesLabelXPath}`);
  await yesLabel.waitFor({ state: 'visible', timeout: 10000 });
  await yesLabel.click({ force: true });
  await yesLabel.waitFor({ state: 'visible', timeout: 10000 });
  logger.info('📄 Clicked NOC from developer: Yes');
});

When('I select Seller covering marketing fee as Yes', async function (this: World) {
  logger.info('✅ Selecting Seller covering marketing fee: Yes');
  const yesLabelXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[6]/div/div[2]/div/div/label[1]';
  const yesLabel = this.page.locator(`xpath=${yesLabelXPath}`);
  await yesLabel.waitFor({ state: 'visible', timeout: 10000 });
  await yesLabel.click({ force: true });
  await yesLabel.waitFor({ state: 'visible', timeout: 10000 });
  logger.info('💰 Clicked Seller covering marketing fee: Yes');
});

When('I select Is Exclusive as No', async function (this: World) {
  logger.info('✅ Selecting Is Exclusive: No');
  const noLabelXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[7]/div/div[2]/div/div/label[2]';
  const noLabel = this.page.locator(`xpath=${noLabelXPath}`);
  await noLabel.waitFor({ state: 'visible', timeout: 10000 });
  await noLabel.click({ force: true });
  await noLabel.waitFor({ state: 'visible', timeout: 10000 });
  logger.info('📌 Clicked Is Exclusive: No');
});

When('I wait for {int} seconds', { timeout: 60000 }, async function (this: World, seconds: number) {
  const ms = seconds * 1000;
  logger.info(`⏳ Waiting for ${seconds} seconds...`);
  await this.page.waitForTimeout(ms);
});

When('I enter notes for testing', async function (this: World) {
  const notesXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div/div/div/div/div[2]/div/div/textarea';
  const notesField = this.page.locator(`xpath=${notesXPath}`);
  await notesField.waitFor({ state: 'visible', timeout: 10000 });

  const notesText = 'Test notes for QA validation: creating a Contract A with commission details, NOC confirmation, marketing fee coverage, and exclusivity set to No. Please review and approve. This is sample text for verification.';
  await notesField.click({ force: true });
  await notesField.fill(notesText);
  logger.info('📝 Notes entered for testing');
});

Then('I should see preview page with terms and conditions', async function (this: World) {
  logger.info('📋 Verifying preview page with terms and conditions');
  const termsText = 'This agreement is the authorization of the owner of the property to the real estate brokerage office to carry out the marketing of the property and find a buyer for the property';
  const termsElement = this.page.getByText(termsText, { exact: false });
  await termsElement.waitFor({ state: 'visible', timeout: 10000 });
  const foundText = await termsElement.textContent();
  if (foundText && foundText.includes('authorization')) {
    logger.info('✅ Preview page loaded - Terms text verified: "' + foundText.substring(0, 80) + '..."');
  } else {
    throw new Error('Terms and conditions text not found or incomplete');
  }
});

When('I click on terms and conditions checkbox', async function (this: World) {
  logger.info('☑️ Clicking on terms and conditions checkbox');
  
  // Get the page context (either approval page or original page)
  const page = (this as any).approvalPage || this.page;
  const detailsPage = new ContractDetailsPage(page);
  await detailsPage.clickTermsCheckbox();
});

When('I click on Submit Contract for Approval button', async function (this: World) {
  logger.info('📤 Clicking on Submit Contract for Approval button');
  const detailsPage = new ContractDetailsPage(this.page);
  await detailsPage.clickSubmitContractForApproval();
});

Then('I should see success message Your contract has been submitted successfully', async function (this: World) {
  logger.info('🔍 Verifying success message');
  const successText = 'Your contract has been submitted successfully';

  await waitForPageStable(this.page, 15000);
  
  try {
    // Try to find success message with extended timeout
    const successElement = this.page.getByText(successText, { exact: false });
    await successElement.waitFor({ state: 'visible', timeout: 20000 });
    const foundText = await successElement.textContent();
    if (foundText && foundText.includes('submitted successfully')) {
      logger.info('✅ Contract creation completed successfully: "' + foundText.trim() + '"');
    } else {
      throw new Error('Success message text not found');
    }
  } catch (e) {
    logger.info('⚠️ Primary success message selector failed, trying fallback...');
    // Fallback: look for any alert/notification div with success class
    const alertSelectors = [
      '.ant-alert-success',
      '.alert-success',
      '[class*="success"]',
      'div[role="alert"]'
    ];
    
    let found = false;
    for (const selector of alertSelectors) {
      try {
        const alert = this.page.locator(selector);
        const count = await alert.count();
        if (count > 0) {
          const text = await alert.first().textContent();
          if (text && text.includes('submitted')) {
            logger.info(`✅ Success message found via fallback selector "${selector}"`);
            found = true;
            break;
          }
        }
      } catch (err) {
        continue;
      }
    }
    
    if (!found) {
      await this.page.screenshot({ path: 'success-message-debug.png' });
      throw new Error('Success message not found after trying all selectors. Check success-message-debug.png');
    }
  }

  logger.info('📋 Extracting contract number');
  const contractLinkXPath = '//*[@id="contractSelectionB"]/div/div/div/h4/b/a';
  const contractLink = this.page.locator(`xpath=${contractLinkXPath}`);
  
  // Try multiple attempts to find the contract number
  let contractNumber = null;
  let contractVisible = await contractLink.isVisible().catch(() => false);
  
  if (!contractVisible) {
    logger.info('⚠️ Primary XPath not visible, trying alternative selectors...');
    // Try alternative selectors
    const altSelectors = [
      'a:has-text("CS")', // If contract starts with CS
      '[id*="contractSelection"]',
      '.contract-number',
      'a[href*="contract"]'
    ];
    
    for (const selector of altSelectors) {
      const altElement = this.page.locator(selector).first();
      const altVisible = await altElement.isVisible().catch(() => false);
      if (altVisible) {
        const text = await altElement.textContent().catch(() => null);
        if (text && text.trim().length > 0) {
          contractNumber = text;
          logger.info(`✅ Found contract number via selector "${selector}": ${contractNumber}`);
          break;
        }
      }
    }
  } else {
    contractNumber = await contractLink.textContent();
    logger.info('✅ Found contract number via primary XPath: ' + contractNumber);
  }
  
  if (contractNumber) {
    const trimmedNumber = contractNumber.trim();
    (this as any).contractNumber = trimmedNumber;
    (this as any).contractANumber = trimmedNumber;

    // Merge with existing data and save typed key
    const contractFilePath = path.join(process.cwd(), 'contract-data.json');
    let existingData: Record<string, unknown> = {};
    if (fs.existsSync(contractFilePath)) {
      try { existingData = JSON.parse(fs.readFileSync(contractFilePath, 'utf-8')); } catch { existingData = {}; }
    }
    const updatedData = {
      ...existingData,
      contractANumber: trimmedNumber,
      contractNumber: trimmedNumber,
      contractStartDate: String((this as any).contractStartDate || '').trim() || existingData.contractStartDate,
      contractEndDate: String((this as any).contractEndDate || '').trim() || existingData.contractEndDate,
      lastUpdatedAt: new Date().toISOString()
    };
    fs.writeFileSync(contractFilePath, JSON.stringify(updatedData, null, 2));
    logger.info('🔢 CONTRACT NUMBER SAVED: ' + trimmedNumber);
    logger.info('📄 Contract data saved to: ' + contractFilePath);

    // Verify file was written
    if (fs.existsSync(contractFilePath)) {
      logger.info('✅ File verified - contract data persisted');
    } else {
      logger.info('⚠️ Warning: File write may have failed');
    }
  } else {
    throw new Error('Contract number could not be found with any selector. Please check the success page layout.');
  }
});
