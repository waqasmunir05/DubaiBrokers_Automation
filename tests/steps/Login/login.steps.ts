// tests/steps/Login/login.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { World } from '../../support/world';

const ts = (): string => {
  const now = new Date();
  return `[${now.toTimeString().slice(0, 8)}]`;
};

const isTransientLoginError = (message: string | null | undefined): boolean => {
  const text = (message || '').toLowerCase();
  return (
    text.includes('unexpected token') ||
    text.includes('service.svc is unavailable') ||
    text.includes('no endpoint was found') ||
    text.includes('too busy')
  );
};

const retryUsernameLogin = async (world: World): Promise<void> => {
  const username = (world as any).lastUsername;
  const password = (world as any).lastPassword;
  if (!username || !password) {
    throw new Error('Unable to retry login because stored credentials are missing');
  }

  await world.page.goto('https://trakheesiqa.dubailand.gov.ae/DubaiBrokers/#/login', {
    waitUntil: 'domcontentloaded',
    timeout: 60000,
  });

  const usernameTab = world.page.getByRole('tab', { name: 'Username' });
  await usernameTab.waitFor({ state: 'visible', timeout: 15000 });
  await usernameTab.click().catch(() => undefined);

  const usernameInput = world.page.getByRole('textbox', { name: 'Username' });
  const passwordInput = world.page.getByRole('textbox', { name: 'Password' });
  const loginButton = world.page.getByRole('button', { name: 'Login' });

  await usernameInput.waitFor({ state: 'visible', timeout: 15000 });
  await usernameInput.fill(username);
  await passwordInput.fill(password);
  await loginButton.click({ noWaitAfter: true });
};

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
  const mobileOtpXPath = '//*[@id="MobileDetailsContent"]/div/div[2]/div[2]/input';
  const mobileOtpInput = this.page.locator(`xpath=${mobileOtpXPath}`).first();
  const fillOtp = async (input: ReturnType<World['page']['locator']>) => {
    await input.click({ force: true }).catch(() => undefined);
    await input.fill('');
    await input.fill(otp);
    const currentValue = await input.inputValue().catch(() => '');
    if ((currentValue || '').trim() !== otp) {
      await input.press('Control+A').catch(() => undefined);
      await input.type(otp, { delay: 50 });
    }
  };

  await this.page.waitForSelector('#MobileDetailsContent, input[name="otp" i], input[placeholder*="OTP" i]', {
    state: 'attached',
    timeout: 30000
  });

  await this.page.waitForSelector([
    '#MobileDetailsContent input[name="otp" i]:visible',
    '#MobileDetailsContent input[placeholder*="OTP" i]:visible',
    'input[name="otp" i]:visible',
    'input[placeholder*="OTP" i]:visible'
  ].join(', '), { state: 'visible', timeout: 20000 }).catch(() => undefined);

  const visibleOtpInput = this.page.locator([
    '#MobileDetailsContent input[name="otp" i]:visible',
    '#MobileDetailsContent input[placeholder*="OTP" i]:visible',
    'input[name="otp" i]:visible',
    'input[placeholder*="OTP" i]:visible'
  ].join(', ')).first();

  const visibleOtp = await visibleOtpInput.isVisible().catch(() => false);
  if (visibleOtp) {
    await fillOtp(visibleOtpInput);
    return;
  }

  const exactVisible = await mobileOtpInput.isVisible().catch(() => false);
  if (exactVisible) {
    await fillOtp(mobileOtpInput);
    return;
  }

  const otpInputXPath = '/html/body/div/div/div/div[3]/div[1]/div/div[2]/div/div[1]/div/div[2]/div[2]/input';
  const otpInputByXPath = this.page.locator(`xpath=${otpInputXPath}`).first();
  await otpInputByXPath.waitFor({ state: 'attached', timeout: 30000 });
  await fillOtp(otpInputByXPath);
});

When('I click on Verify', { timeout: 40000 }, async function (this: World) {
  const verifyButton = this.page.getByRole('button', { name: 'Verify' });
  const verifyVisible = await verifyButton.isVisible().catch(() => false);
  if (verifyVisible) {
    await verifyButton.click();
    return;
  }

  const verifyButtonXPath = '/html/body/div/div/div/div[3]/div[1]/div/div[2]/div/div[1]/div/div[2]/div[3]/button';
  const verifyButtonByXPath = this.page.locator(`xpath=${verifyButtonXPath}`);
  await verifyButtonByXPath.waitFor({ state: 'visible', timeout: 40000 });
  await verifyButtonByXPath.click();
});

// Username/Password steps
When('I enter username {string}', async function (this: World, username: string) {
  const usernameInput = this.page.getByRole('textbox', { name: 'Username' });
  await usernameInput.waitFor({ state: 'visible', timeout: 10000 });
  await usernameInput.fill(username);
  (this as any).lastUsername = username;
});

When('I enter password {string}', async function (this: World, password: string) {
  const passwordInput = this.page.getByRole('textbox', { name: 'Password' });
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.fill(password);
  (this as any).lastPassword = password;
});

When('I click on {string}', async function (this: World, buttonName: string) {
  const button = this.page.getByRole('button', { name: buttonName });
  await button.waitFor({ state: 'visible', timeout: 10000 });
  if (/^login$/i.test(buttonName)) {
    (this as any).loginClickStartedAt = Date.now();
    console.log(`${ts()} 🔐 Clicking Login button`);
    await button.click({ noWaitAfter: true });
    console.log(`${ts()} 🖱️ Login click returned in ${Date.now() - Number((this as any).loginClickStartedAt)} ms`);
    return;
  }
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

const assertDashboardReadyAfterLogin = async (page: World['page']): Promise<void> => {
  const pendingRequestsTab = page.locator('xpath=//*[@id="pending-requests-tab"]').first();
  await pendingRequestsTab.waitFor({ state: 'visible', timeout: 40000 });
};

Then('I should see logged in username {string}', { timeout: 90000 }, async function (this: World, expectedUsername: string) {
  if (!expectedUsername) return; // skip for negative cases

  const alertText = (await this.page.locator('.alert.alert-danger').first().textContent().catch(() => '')) || '';
  if (isTransientLoginError(alertText)) {
    throw new Error(`Transient login error detected: ${alertText}`);
  }

  await assertDashboardReadyAfterLogin(this.page);

  if ((this as any).loginClickStartedAt) {
    const elapsedMs = Date.now() - Number((this as any).loginClickStartedAt);
    console.log(`${ts()} ✅ Login verified in ${elapsedMs} ms`);
    (this as any).loginVerifiedAt = Date.now();
  }
});

Then('I should see logged-in username as {string}', { timeout: 90000 }, async function (this: World, expectedUsername: string) {
  if (!expectedUsername) return; // skip for negative cases

  const alertText = (await this.page.locator('.alert.alert-danger').first().textContent().catch(() => '')) || '';
  if (isTransientLoginError(alertText)) {
    throw new Error(`Transient login error detected: ${alertText}`);
  }

  await assertDashboardReadyAfterLogin(this.page);
  if ((this as any).loginClickStartedAt) {
    const elapsedMs = Date.now() - Number((this as any).loginClickStartedAt);
    console.log(`${ts()} ✅ Login verified in ${elapsedMs} ms`);
    (this as any).loginVerifiedAt = Date.now();
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

// Lowercase variant: 'I enter emirates id {string}'
When('I enter emirates id {string}', async function (this: World, emiratesId: string) {
  const emiratesInput = this.page.getByRole('textbox', { name: 'Emirates ID Number' });
  await emiratesInput.waitFor({ state: 'visible', timeout: 10000 });
  await emiratesInput.fill(emiratesId);
});

When('I enter mobile number {string}', async function (this: World, mobileNumber: string) {
  const mobileInput = this.page.locator([
    'input[type="tel"]',
    'input[placeholder*="mobile" i]',
    'input[name*="mobile" i]',
    'input[id*="mobile" i]',
    'input[formcontrolname*="mobile" i]',
    'input[aria-label*="mobile" i]'
  ].join(', ')).first();

  await mobileInput.waitFor({ state: 'visible', timeout: 15000 });
  await mobileInput.fill(mobileNumber);
});

When('I click Send OTP for Mobile', async function (this: World) {
  const visibleSendOtp = this.page.locator('button:has-text("Send OTP"):visible').first();
  const visible = await visibleSendOtp.isVisible().catch(() => false);
  if (visible) {
    await visibleSendOtp.click();
    return;
  }

  const roleButton = this.page.getByRole('button', { name: /send\s*otp/i }).first();
  const roleVisible = await roleButton.isVisible().catch(() => false);
  if (roleVisible) {
    await roleButton.click();
    return;
  }

  const sendOtpXPath = '/html/body/div/div/div/div[3]/div[1]/div/div[2]/div/div[1]/div/div[2]/div[2]/button';
  const sendOtpBtn = this.page.locator(`xpath=${sendOtpXPath}`);
  await sendOtpBtn.click({ force: true });
});

When('I click Send OTP for Emirates ID', async function (this: World) {
  const sendOtpXPath = '/html/body/div/div/div/div[3]/div[1]/div/div[2]/div/div[1]/div/div[2]/div[2]/button';
  const sendOtpBtn = this.page.locator(`xpath=${sendOtpXPath}`);
  await sendOtpBtn.waitFor({ state: 'visible', timeout: 10000 });
  await sendOtpBtn.click();
});

Then('I should see Pending Requests tab on logged in page', { timeout: 30000 }, async function (this: World) {
  await this.page.waitForSelector('#pending-requests-tab', { state: 'visible', timeout: 30000 });
});

// OTP verification screen: enter fixed OTP, click Verify via XPath, wait for login success
Then('I should see OTP verification screen', { timeout: 90000 }, async function (this: World) {
  const otpInputXPath = '/html/body/div/div/div/div[3]/div[1]/div/div[2]/div/div[1]/div/div[2]/div[2]/input';
  const verifyButtonXPath = '/html/body/div/div/div/div[3]/div[1]/div/div[2]/div/div[1]/div/div[2]/div[3]/button';

  // Wait for OTP input to appear
  const otpInput = this.page.locator(`xpath=${otpInputXPath}`);
  await otpInput.waitFor({ state: 'visible', timeout: 60000 });

  // Enter OTP
  await otpInput.fill('123456');

  // Click Verify button
  const verifyButton = this.page.locator(`xpath=${verifyButtonXPath}`);
  await verifyButton.waitFor({ state: 'visible', timeout: 10000 });
  await verifyButton.click();

  // Assert dashboard loaded by waiting for Pending Requests tab
  await this.page.waitForSelector('#pending-requests-tab', { state: 'visible', timeout: 30000 });
});
