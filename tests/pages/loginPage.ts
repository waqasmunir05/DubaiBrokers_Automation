import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}

  async open() {
    await this.page.goto('https://trakheesiqa.dubailand.gov.ae/DubaiBrokers/#/login');
  }

  async selectLoginOption(option: 'Emirates ID' | 'Username') {
    await this.page.getByRole('tab', { name: option }).click();
  }

  // Emirates ID login
  async enterEmiratesID(id: string) {
    const input = this.page.getByRole('textbox', { name: 'Emirates ID Number' });
    await input.waitFor({ state: 'visible', timeout: 20000 });
    await input.fill(id);
  }

  async clickSendOTP() {
    const button = this.page.getByRole('button', { name: 'Send OTP' });
    await button.waitFor({ state: 'visible', timeout: 20000 });
    await button.click();
  }

  async enterOTP(otp: string) {
    const input = this.page.getByRole('textbox', { name: 'OTP' });
    await input.waitFor({ state: 'visible', timeout: 20000 });
    await input.fill(otp);
  }

  async clickVerify() {
    const button = this.page.getByRole('button', { name: 'Verify' });
    await button.waitFor({ state: 'visible', timeout: 20000 });
    await button.click();
  }

  // Username login
  async enterUsername(username: string) {
    const input = this.page.getByRole('textbox', { name: 'Username' });
    await input.waitFor({ state: 'visible', timeout: 20000 });
    await input.fill(username);
  }

  async enterPassword(password: string) {
    const input = this.page.getByRole('textbox', { name: 'Password' });
    await input.waitFor({ state: 'visible', timeout: 20000 });
    await input.fill(password);
  }

  async clickLogin() {
    const button = this.page.getByRole('button', { name: 'Login' });
    await button.waitFor({ state: 'visible', timeout: 20000 });
    await button.click();
  }

  async getLoggedInUsername(): Promise<string> {
    const username = await this.page.textContent('.user-name');
    if (!username) throw new Error('Logged-in username not found');
    return username.trim();
  }
}
