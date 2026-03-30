import { Then, When } from '@cucumber/cucumber';
import { World } from '../../support/world';
import { logger } from '../../utils/logger';

const CONTRACTS_TAB_TIMEOUT_MS = 15000;
const LONG_WAIT_STEP_TIMEOUT_MS = 23 * 60 * 1000;
const LOGIN_URL_FRAGMENT = '#/login';

const ts = (): string => {
  const now = new Date();
  return `[${now.toTimeString().slice(0, 8)}]`;
};

const clickContractsTab = async (world: World): Promise<void> => {
  const contractsTab = world.page.getByRole('tab', { name: 'Contracts' });
  await contractsTab.waitFor({ state: 'visible', timeout: CONTRACTS_TAB_TIMEOUT_MS });
  await contractsTab.click({ force: true });
};

const closePopupIfVisible = async (world: World): Promise<void> => {
  const closeBtn = world.page.locator('.btn.btn-dark.btn-agree').first();
  const altBtn = world.page.locator('button.btn-agree, [class*="btn-agree"]').first();

  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click({ force: true });
    return;
  }

  if (await altBtn.isVisible().catch(() => false)) {
    await altBtn.click({ force: true });
  }
};

const openCreateContractB = async (world: World): Promise<void> => {
  const createByText = world.page.getByText('Create Contract B').first();
  if (await createByText.isVisible().catch(() => false)) {
    await createByText.click({ force: true });
    return;
  }

  const createByXPath = world.page.locator('xpath=//*[@id="sidebar-menu"]/div/ul/li[3]/a').first();
  await createByXPath.waitFor({ state: 'visible', timeout: 15000 });
  await createByXPath.click({ force: true });
};

const ensureContractBPopupVisible = async (world: World): Promise<void> => {
  const personRadio = world.page.locator('input[type="radio"][name="TypeSelection"][value="Person"]');
  const personLabel = world.page.getByText('Person', { exact: true }).first();

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    await openCreateContractB(world);

    const popupVisible = await personRadio.isVisible({ timeout: 10000 }).catch(() => false);
    if (popupVisible) {
      logger.info(`${ts()} 🔘 Create Contract B popup is visible (attempt ${attempt})`);
      return;
    }

    const labelVisible = await personLabel.isVisible({ timeout: 2000 }).catch(() => false);
    if (labelVisible) {
      logger.info(`${ts()} 🔘 Create Contract B popup detected by label (attempt ${attempt})`);
      return;
    }

    logger.info(`${ts()} ⚠️ Create Contract B popup not visible yet (attempt ${attempt}); retrying`);
    await clickContractsTab(world);
    await closePopupIfVisible(world);
    await world.page.waitForTimeout(1500);
  }

  throw new Error('Create Contract B popup did not become visible after 3 attempts.');
};

When('broker performs person search in Contract B to refresh session token', { timeout: 180000 }, async function (this: World) {
  logger.info(`${ts()} 🔐 Starting Contract B person search to refresh session token`);

  await clickContractsTab(this);
  logger.info(`${ts()} 📑 Contracts tab clicked`);

  await closePopupIfVisible(this);
  logger.info(`${ts()} ❌ Popup handled (if any)`);

  await ensureContractBPopupVisible(this);

  // Popup verified; proceed with person selection
  const personRadio = this.page.locator('input[type="radio"][name="TypeSelection"][value="Person"]');
  await personRadio.waitFor({ state: 'visible', timeout: 15000 });
  await personRadio.check({ force: true });
  logger.info(`${ts()} 👤 Person radio selected`);

  // Resilient Emirates ID selection — mirrors create_contract_b.steps.ts approach
  const emiratesIdRadio = this.page.locator('input[type="radio"][name="registration"][value="Emirates ID"]');
  await emiratesIdRadio.waitFor({ state: 'attached', timeout: 15000 });

  const isAlreadyChecked = await emiratesIdRadio.isChecked().catch(() => false);
  if (!isAlreadyChecked) {
    const helper = this.page.locator('input[type="radio"][name="registration"][value="Emirates ID"] + ins.iCheck-helper').first();
    const labelByText = this.page.locator(
      'xpath=//label[normalize-space()="Emirates ID"] | //span[normalize-space()="Emirates ID"]'
    ).first();

    const tryClick = async (fn: () => Promise<void>): Promise<boolean> => {
      try { await fn(); return await emiratesIdRadio.isChecked().catch(() => false); }
      catch { return false; }
    };

    let ok = await tryClick(async () => {
      if (await emiratesIdRadio.isVisible().catch(() => false)) await emiratesIdRadio.click({ force: true });
      else throw new Error('not visible');
    });

    if (!ok) ok = await tryClick(async () => {
      if (await helper.isVisible().catch(() => false)) await helper.click({ force: true });
      else throw new Error('helper not visible');
    });

    if (!ok) ok = await tryClick(async () => {
      if (await labelByText.isVisible().catch(() => false)) await labelByText.click({ force: true });
      else throw new Error('label not visible');
    });

    if (!ok) {
      await emiratesIdRadio.evaluate((el) => {
        const input = el as HTMLInputElement;
        input.checked = true;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      });
      ok = await emiratesIdRadio.isChecked().catch(() => false);
    }

    if (!ok) throw new Error('Failed to select Emirates ID registration type in session token step');
  }
  logger.info(`${ts()} 🪪 Emirates ID registration type selected`);

  const idYearInput = this.page.locator('#idYear');
  const idNumInput = this.page.locator('#idnum');
  await idYearInput.waitFor({ state: 'visible', timeout: 15000 });
  await idYearInput.fill('1986');
  await idNumInput.waitFor({ state: 'visible', timeout: 15000 });
  await idNumInput.fill('57419044');
  logger.info(`${ts()} 🔢 Emirates ID year=1986, number=57419044 entered`);

  const proceedButton = this.page.locator('xpath=//*[@id="wizard"]/div[2]/div[3]/div/button');
  await proceedButton.waitFor({ state: 'visible', timeout: 15000 });
  await proceedButton.click({ force: true });
  logger.info(`${ts()} ▶ Proceed to search clicked`);

  const resultCell = this.page.locator('xpath=//*[@id="wizard"]/div[2]/div[1]/div/table/tbody/tr/td[3]');
  await resultCell.waitFor({ state: 'visible', timeout: 60000 });
  await resultCell.click({ force: true });
  logger.info(`${ts()} ✅ Search result clicked`);

  const responseOk = this.page.getByRole('button', { name: /ok|yes|confirm|continue/i }).first();
  if (await responseOk.isVisible({ timeout: 5000 }).catch(() => false)) {
    await responseOk.click({ force: true });
    logger.info(`${ts()} ℹ️ Response popup dismissed`);
  }

  logger.info(`${ts()} 🔐 Session token refresh complete`);
});

When('broker waits {int} minutes for session token validation', { timeout: LONG_WAIT_STEP_TIMEOUT_MS }, async function (this: World, minutes: number) {
  if (minutes < 1 || minutes > 21) {
    throw new Error(`Unsupported wait time ${minutes} minutes. Use a value between 1 and 21.`);
  }

  const waitMs = minutes * 60 * 1000;
  const deadline = new Date(Date.now() + waitMs);
  logger.info(`${ts()} ⏳ Waiting ${minutes} minute(s) — will resume at ${deadline.toTimeString().slice(0, 8)}`);

  // Log a heartbeat every minute so console stays active
  const intervalMs = 60 * 1000;
  let elapsed = 0;
  while (elapsed < waitMs) {
    const chunk = Math.min(intervalMs, waitMs - elapsed);
    await this.page.waitForTimeout(chunk);
    elapsed += chunk;
    const remaining = Math.round((waitMs - elapsed) / 1000 / 60);
    logger.info(`${ts()} ⏱ Elapsed ${Math.round(elapsed / 1000 / 60)}m — ${remaining}m remaining before next action`);
  }

  logger.info(`${ts()} ✅ Wait complete — resuming session-token validation`);
});

When('broker searches Emirates ID in Contract B after idle period', { timeout: 120000 }, async function (this: World) {
  logger.info(`${ts()} 🧪 Attempting Emirates ID search in Contract B after idle period`);

  await clickContractsTab(this);
  await closePopupIfVisible(this);
  await openCreateContractB(this);

  const personRadio = this.page.locator('input[type="radio"][name="TypeSelection"][value="Person"]');
  await personRadio.waitFor({ state: 'visible', timeout: 30000 });
  await personRadio.check({ force: true });

  const emiratesIdRadio = this.page.locator('input[type="radio"][name="registration"][value="Emirates ID"]');
  await emiratesIdRadio.waitFor({ state: 'attached', timeout: 15000 });
  if (!(await emiratesIdRadio.isChecked().catch(() => false))) {
    await emiratesIdRadio.click({ force: true });
  }

  const idYearInput = this.page.locator('#idYear');
  const idNumInput = this.page.locator('#idnum');
  await idYearInput.waitFor({ state: 'visible', timeout: 15000 });
  await idYearInput.fill('1986');
  await idNumInput.waitFor({ state: 'visible', timeout: 15000 });
  await idNumInput.fill('57419044');

  const proceedButton = this.page.locator('xpath=//*[@id="wizard"]/div[2]/div[3]/div/button');
  await proceedButton.waitFor({ state: 'visible', timeout: 15000 });
  await proceedButton.click({ force: true });

  logger.info(`${ts()} 🔎 Emirates ID search action triggered after idle period (Proceed clicked)`);
});

Then('broker should still be logged in as {string}', { timeout: 30000 }, async function (this: World, expectedUsername: string) {
  logger.info(`${ts()} 🔍 Checking session is still active for user: ${expectedUsername}`);

  if (this.page.url().includes(LOGIN_URL_FRAGMENT)) {
    throw new Error(`${ts()} ❌ Session expired unexpectedly — redirected to login page.`);
  }

  const usernameText = this.page.getByText(expectedUsername, { exact: false }).first();
  await usernameText.waitFor({ state: 'visible', timeout: 30000 });
  logger.info(`${ts()} ✅ Session still active — logged in as ${expectedUsername}`);
});

Then('broker should be redirected to login page due to session timeout', { timeout: 180000 }, async function (this: World) {
  logger.info(`${ts()} 🔍 Checking for session expiry popup or login redirect...`);

  // Wait for the "Your session has expired" popup with OK button at #yes
  const sessionExpiredOkBtn = this.page.locator('#yes');
  const sessionExpiredText = this.page.getByText('Your session has expired', { exact: false }).first();

  let sessionPopupHandled = false;
  try {
    await sessionExpiredText.waitFor({ state: 'visible', timeout: 60000 });
    const popupMessage = (await sessionExpiredText.textContent())?.trim();
    logger.info(`${ts()} 🔔 Session expiry popup detected: "${popupMessage}"`);

    if (await sessionExpiredOkBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sessionExpiredOkBtn.click({ force: true });
      logger.info(`${ts()} ✅ Clicked OK on session expiry popup (#yes)`);
    } else {
      // fallback: any visible OK button in the popup
      const fallbackOk = this.page.getByRole('button', { name: /^ok$/i }).first();
      if (await fallbackOk.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fallbackOk.click({ force: true });
        logger.info(`${ts()} ✅ Clicked fallback OK button on session expiry popup`);
      }
    }
    sessionPopupHandled = true;
  } catch {
    logger.info(`${ts()} ℹ️ No session expiry popup detected within 60s — checking for direct login redirect`);
  }

  // After dismissing popup, verify redirect to login page
  const loginButton = this.page.getByRole('button', { name: /^login$/i }).first();
  await Promise.race([
    this.page.waitForURL(new RegExp(`${LOGIN_URL_FRAGMENT}`), { timeout: 60000 }),
    loginButton.waitFor({ state: 'visible', timeout: 60000 })
  ]);

  const onLoginUrl = this.page.url().includes(LOGIN_URL_FRAGMENT);
  const loginVisible = await loginButton.isVisible().catch(() => false);

  if (!onLoginUrl && !loginVisible) {
    throw new Error(`${ts()} ❌ Expected login page after session timeout, but it was not detected.`);
  }

  logger.info(`${ts()} ✅ Session timeout confirmed — login page is displayed` +
    (sessionPopupHandled ? ' (after "Your session has expired" popup was dismissed)' : ' (direct redirect)'));
});

Then('broker should not see session expired popup message', { timeout: 15000 }, async function (this: World) {
  logger.info(`${ts()} 🔍 Verifying that session expiry popup is not shown`);

  const sessionExpiredText = this.page.getByText('Your session has expired', { exact: false }).first();
  const sessionExpiredOkBtn = this.page.locator('#yes').first();

  await this.page.waitForTimeout(3000);

  const textVisible = await sessionExpiredText.isVisible().catch(() => false);
  const okVisible = await sessionExpiredOkBtn.isVisible().catch(() => false);

  if (textVisible || okVisible) {
    throw new Error(`${ts()} ❌ Session-expired popup appeared while session expiry is expected to be disabled.`);
  }

  if (this.page.url().includes(LOGIN_URL_FRAGMENT)) {
    throw new Error(`${ts()} ❌ Redirected to login unexpectedly while session expiry is disabled.`);
  }

  logger.info(`${ts()} ✅ No session-expired popup detected`);
});
