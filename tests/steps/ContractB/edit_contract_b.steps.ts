import { Then, When } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { ContractDetailsPage } from '../../pages/ContractDetailsPage';
import { ContractBPage } from '../../pages/ContractBPage';
import { logger } from '../../utils/logger';
import { waitForPageStable } from '../../utils/waitHelper';

const formatDate = (date: Date): string => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

When('broker clicks edit action icon in contract B', async function (this: World) {
  const detailsPage = new ContractDetailsPage(this.page);
  await detailsPage.clickEditButton();
  logger.info('✏️ Clicked edit action icon in Contract B details');
});

Then('broker should see Contract B edit form', async function (this: World) {
  const saveContinueButton = this.page
    .locator('xpath=//*[@id="wizard"]/div[2]/button')
    .first();

  await saveContinueButton.waitFor({ state: 'visible', timeout: 20000 });
  logger.info('✅ Contract B edit form is visible');
});

When('broker selects who will represent as Buyer in contract B edit', async function (this: World) {
  const buyerRadioInput = this.page
    .locator('xpath=//*[@id="wizard"]/div[1]/div/div[2]/div[2]/div[12]/div/div[1]/div/label[1]/input')
    .first();
  const buyerRadioLabel = this.page.getByText('Buyer', { exact: true }).first();

  await buyerRadioInput.waitFor({ state: 'visible', timeout: 15000 });

  let isChecked = await buyerRadioInput.isChecked().catch(() => false);
  if (!isChecked) {
    await buyerRadioInput.check({ force: true }).catch(() => {});
    isChecked = await buyerRadioInput.isChecked().catch(() => false);
  }

  if (!isChecked) {
    await buyerRadioLabel.click({ force: true }).catch(() => {});
    isChecked = await buyerRadioInput.isChecked().catch(() => false);
  }

  if (!isChecked) {
    throw new Error('Failed to select representative as Buyer in Contract B edit');
  }

  logger.info('🧑‍💼 Selected representative as Buyer in Contract B edit');
});

When('broker confirms broker declaration in contract B edit', async function (this: World) {
  const declarationCheckbox = this.page
    .locator('xpath=//*[@id="wizard"]/div[1]/div/div[2]/div[2]/div[12]/div/div[2]/input')
    .first();
  const declarationText = this.page
    .getByText('I confirm that I am acting only as a real estate broker', { exact: false })
    .first();

  await declarationCheckbox.waitFor({ state: 'visible', timeout: 15000 });

  let isChecked = await declarationCheckbox.isChecked().catch(() => false);
  if (!isChecked) {
    await declarationCheckbox.check({ force: true }).catch(() => {});
    isChecked = await declarationCheckbox.isChecked().catch(() => false);
  }

  if (!isChecked) {
    await declarationText.click({ force: true }).catch(() => {});
    isChecked = await declarationCheckbox.isChecked().catch(() => false);
  }

  if (!isChecked) {
    throw new Error('Failed to check broker declaration checkbox in Contract B edit');
  }

  logger.info('☑️ Confirmed broker declaration checkbox in Contract B edit');
});

When('broker clicks Verify Buyer in contract B edit', async function (this: World) {
  const verifyBuyerButton = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[3]/button[2]')
    .first();

  await verifyBuyerButton.waitFor({ state: 'visible', timeout: 20000 });
  await verifyBuyerButton.click({ force: true });
  logger.info('🔎 Clicked Verify Buyer in Contract B edit');
});

When('broker clicks searched buyer result in contract B edit popup', async function (this: World) {
  const searchedResultCell = this.page
    .locator('xpath=/html/body/div[1]/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[4]/div/div/div/div/div/div/div[2]/div/table/tbody/tr/td[1]')
    .first();

  await searchedResultCell.waitFor({ state: 'visible', timeout: 30000 });
  await searchedResultCell.click({ force: true });
  await waitForPageStable(this.page, 10000);
  logger.info('✅ Clicked searched buyer result in Contract B edit popup');
});

When('broker enters same mobile and email as create contract B in edit', async function (this: World) {
  const mobileInput = this.page
    .locator('xpath=//*[@id="wizard"]/div[1]/div/div[2]/div[2]/div[8]/div[2]/div/div[2]/div/div[2]/div/div/div/input')
    .first();
  const emailInput = this.page
    .locator('xpath=//*[@id="wizard"]/div[1]/div/div[2]/div[2]/div[8]/div[2]/div/div[3]/div/div[2]/div/div/div/input')
    .first();

  const mobile = '0558895363';
  const email = 'waqas.munir@eres.ae';

  await mobileInput.waitFor({ state: 'visible', timeout: 15000 });
  await mobileInput.fill(mobile);

  await emailInput.waitFor({ state: 'visible', timeout: 15000 });
  await emailInput.fill(email);

  logger.info(`📱 Updated mobile in Contract B edit: ${mobile}`);
  logger.info(`📧 Updated email in Contract B edit: ${email}`);
});

Then('broker should see Property Information screen in contract B edit', async function (this: World) {
  const propertyTypeLookup = this.page
    .locator('xpath=//*[@id="wizard"]/div[1]/div/div[2]/div/div[1]/div/div[2]/div/div/div/div/div[1]')
    .first();

  await propertyTypeLookup.waitFor({ state: 'visible', timeout: 20000 });
  logger.info('✅ Property Information screen is visible in Contract B edit');
});

When('broker changes property type from Unit to Villa in contract B edit', async function (this: World) {
  const contractBPage = new ContractBPage(this.page);
  await contractBPage.selectPropertyType('Villa');
  logger.info('🏡 Changed property type from Unit to Villa in Contract B edit');
});

When('broker changes rental status from Rented to Vacant in contract B edit', async function (this: World) {
  const contractBPage = new ContractBPage(this.page);
  await contractBPage.selectRentalStatus('Vacant');
  logger.info('📊 Changed rental status from Rented to Vacant in Contract B edit');
});

Then('broker should see Property Financial Information screen in contract B edit', async function (this: World) {
  const budgetInput = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[1]/div/div[2]/div/div/div/input')
    .first();

  await budgetInput.waitFor({ state: 'visible', timeout: 20000 });
  logger.info('✅ Property Financial Information screen is visible in Contract B edit');
});

When('broker updates budget to {string} in contract B edit', async function (this: World, budget: string) {
  const budgetInput = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div[2]/div/div[1]/div/div[2]/div/div/div/input')
    .first();

  await budgetInput.waitFor({ state: 'visible', timeout: 15000 });
  await budgetInput.fill(budget);
  logger.info(`💰 Updated budget in Contract B edit: ${budget}`);
});

Then('broker should see Buyers Share page in contract B edit', async function (this: World) {
  const saveContinueButton = this.page
    .locator('button:has-text("Save and Continue"), button:has-text("Save"), input[type="button"][value*="Save"]')
    .first();

  await saveContinueButton.waitFor({ state: 'visible', timeout: 20000 });
  logger.info('✅ Buyers Share page is visible in Contract B edit');
});

When('broker selects Contract Start Date 15 days from today in contract B', { timeout: 60000 }, async function (this: World) {
  const contractStartDateInput = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[1]/div/div[2]/div/div/div/div/div/input')
    .first();

  await contractStartDateInput.waitFor({ state: 'visible', timeout: 15000 });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 15);
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
  logger.info(`📅 Updated Contract Start Date in edit: ${startValue || formattedStartDate}`);
});

When('broker selects Contract End Date 3 months from Contract Start Date in contract B edit', { timeout: 60000 }, async function (this: World) {
  const contractEndDateInput = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[2]/div/div[2]/div/div/div/div/div/input')
    .first();

  await contractEndDateInput.waitFor({ state: 'visible', timeout: 15000 });

  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 15);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 3);
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
    throw new Error(`Failed to set Contract End Date in edit. Expected: ${formattedEndDate}`);
  }

  logger.info(`📅 Updated Contract End Date in edit: ${endValue}`);
});

When('broker edits commission amount to {string} in contract B edit', async function (this: World, amount: string) {
  const commissionInput = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div/div[1]/div/div/div[2]/div/div/div[4]/div/div[2]/div[1]/div/div/input')
    .first();

  await commissionInput.waitFor({ state: 'visible', timeout: 15000 });
  await commissionInput.click({ clickCount: 3 }).catch(() => {});
  await commissionInput.fill(amount);
  logger.info(`💵 Updated commission amount in Contract B edit: ${amount}`);
});

When('broker clicks contract preview checkbox in contract B edit', async function (this: World) {
  const previewCheckboxContainer = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[2]')
    .first();
  const previewCheckboxInput = previewCheckboxContainer.locator('input[type="checkbox"]').first();
  const previewCheckboxLabel = previewCheckboxContainer.locator('label').first();
  const termsText = this.page.getByText('I accept the above Terms and').first();
  const submitButton = this.page
    .locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[3]/div/button[2]')
    .first();
  const verifyBuyersPopup = this.page.getByText('Please verify all buyers before proceeding').first();
  const verifyBuyersOkButton = this.page.locator('#yes').first();

  const dismissVerifyBuyersPopup = async () => {
    if (await verifyBuyersPopup.isVisible({ timeout: 3000 }).catch(() => false)) {
      await verifyBuyersOkButton.click({ force: true }).catch(() => {});
      await this.page.waitForTimeout(700);
      logger.info('ℹ️ Dismissed verify buyers popup on Contract Preview in edit flow');
    }
  };

  const isCheckboxAccepted = async () => {
    const isChecked = await previewCheckboxInput.isChecked().catch(() => false);
    const isSubmitEnabled = await submitButton.isEnabled().catch(() => false);
    return { isChecked, isSubmitEnabled, accepted: isChecked || isSubmitEnabled };
  };

  await previewCheckboxContainer.waitFor({ state: 'visible', timeout: 20000 });
  await submitButton.waitFor({ state: 'visible', timeout: 20000 });
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

    await this.page.waitForTimeout(1500);
    await dismissVerifyBuyersPopup();
    checkboxState = await isCheckboxAccepted();
  }

  if (!checkboxState.accepted) {
    throw new Error('Contract Preview checkbox was not accepted in Contract B edit flow and submit button remained disabled');
  }

  logger.info(`☑️ Contract Preview checkbox accepted in edit flow (checked=${checkboxState.isChecked}, submitEnabled=${checkboxState.isSubmitEnabled})`);
});
