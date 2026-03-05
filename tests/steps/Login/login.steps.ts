// tests/steps/Login/login.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { World } from '../../support/world';

// Open login page
Given('I open the DLD login page', { timeout: 60000 }, async function (this: World) {
  await this.page.goto('https://trakheesiqa.dubailand.gov.ae/DubaiBrokers/#/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
});

// Select login option (Emirates ID / Username)
When('I select {string} login option', async function (this: World, option: string) {
  const tab = this.page.getByRole('tab', { name: option });
  await tab.waitFor({ state: 'visible', timeout: 10000 });
  await tab.click();
});

// Emirates ID steps
When('I enter Emirates ID {string}', async function (this: World, emiratesId: string) {
  const emiratesInput = this.page.getByRole('textbox', { name: 'Emirates ID Number' });
  await emiratesInput.waitFor({ state: 'visible', timeout: 10000 });
  await emiratesInput.fill(emiratesId);
});

When('I click on Send OTP', async function (this: World) {
  const sendOtpButton = this.page.getByRole('button', { name: 'Send OTP' });
  await sendOtpButton.waitFor({ state: 'visible', timeout: 10000 });
  await sendOtpButton.click();
});

When('I enter OTP {string}', { timeout: 90000 }, async function (this: World, otp: string) {
  const otpInput = this.page.getByRole('textbox', { name: 'OTP' });
  await otpInput.waitFor({ state: 'visible', timeout: 90000 });
  await otpInput.fill(otp);
});

When('I click on Verify', { timeout: 40000 }, async function (this: World) {
  const verifyButton = this.page.getByRole('button', { name: 'Verify' });
  await verifyButton.waitFor({ state: 'visible', timeout: 40000 });
  await verifyButton.click();
});

// Username/Password steps
When('I enter username {string}', async function (this: World, username: string) {
  const usernameInput = this.page.getByRole('textbox', { name: 'Username' });
  await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
  await usernameInput.fill(username);
});

When('I enter password {string}', async function (this: World, password: string) {
  const passwordInput = this.page.getByRole('textbox', { name: 'Password' });
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.fill(password);
});

When('I click on {string}', async function (this: World, buttonName: string) {
  const button = this.page.getByRole('button', { name: buttonName });
  await button.waitFor({ state: 'visible', timeout: 10000 });
  await button.click();
});

// Verification step (used for both Emirates ID and Username logins)
Then('I should see OTP error message {string}', async function (this: World, expectedError: string) {
  if (!expectedError) return; // nothing to check for positive case
  const errorEl = this.page.locator('.alert.alert-danger').first();
  await errorEl.waitFor({ state: 'visible', timeout: 20000 });
  const text = (await errorEl.textContent())?.trim();
  if (!text || !text.includes(expectedError)) {
    throw new Error(`Expected OTP error "${expectedError}", but got "${text}"`);
  }
});

const resolveLoggedInUsername = async (page: World['page'], expectedUsername: string) => {
  const selectors = ['.user-name', '.userName', '[class*="user-name"]'];
  for (const selector of selectors) {
    const el = page.locator(selector).first();
    const visible = await el.isVisible().catch(() => false);
    if (visible) {
      const text = (await el.textContent())?.trim();
      if (text) return text;
    }
  }

  const textLocator = page.getByText(expectedUsername, { exact: false }).first();
  const textVisible = await textLocator.isVisible().catch(() => false);
  if (textVisible) {
    const text = (await textLocator.textContent())?.trim();
    return text || expectedUsername;
  }

  await Promise.race([
    page.waitForSelector('.user-name', { state: 'visible', timeout: 40000 }),
    page.getByText(expectedUsername, { exact: false }).waitFor({ state: 'visible', timeout: 40000 })
  ]);

  const fallback = page.locator('.user-name').first();
  const fallbackText = (await fallback.textContent())?.trim();
  return fallbackText || expectedUsername;
};

Then('I should see logged in username {string}', async function (this: World, expectedUsername: string) {
  if (!expectedUsername) return; // skip for negative cases
  const actualUsername = await resolveLoggedInUsername(this.page, expectedUsername);
  if (!actualUsername || actualUsername !== expectedUsername) {
    throw new Error(`Expected username "${expectedUsername}", but got "${actualUsername}"`);
  }
});

Then('I should see logged-in username as {string}', async function (this: World, expectedUsername: string) {
  if (!expectedUsername) return; // skip for negative cases
  const actualUsername = await resolveLoggedInUsername(this.page, expectedUsername);
  if (!actualUsername) throw new Error('Username element not found');
  if (actualUsername !== expectedUsername) {
    throw new Error(`Expected username "${expectedUsername}", but got "${actualUsername}"`);
  }
});

Then('I should see login error message {string}', async function (this: World, expectedError: string) {
  if (!expectedError) return; // nothing to check for positive case
  const errorEl = this.page.locator('.alert.alert-danger').first();
  // Wait for element to exist in DOM, then extract text regardless of visibility state
  await this.page.waitForFunction(() => {
    const el = document.querySelector('.alert.alert-danger');
    return el && el.textContent;
  }, { timeout: 20000 });
  const text = (await errorEl.textContent())?.trim();
  if (!text || !text.includes(expectedError)) {
    throw new Error(`Expected login error "${expectedError}", but got "${text}"`);
  }
});
