// tests/pages/ContractDetailsPage.ts
import { Page } from 'playwright';
import { logger } from '../utils/logger';
import { waitForPageStable } from '../utils/waitHelper';

export class ContractDetailsPage {
  constructor(private page: Page) {}

  private async clickActionControl(action: 'edit' | 'extend'): Promise<void> {
    const keyword = action.toLowerCase();
    const capitalized = action.charAt(0).toUpperCase() + action.slice(1);

    const candidates = [
      this.page.locator(`#${keyword}_contract`).first(),
      this.page.locator(`xpath=//*[@id="${keyword}_contract"]`).first(),
      this.page.locator(`button:has-text("${capitalized}"), a:has-text("${capitalized}"), [role="button"]:has-text("${capitalized}")`).first(),
      this.page.locator(`[title*="${keyword}" i], [aria-label*="${keyword}" i], [id*="${keyword}" i], [class*="${keyword}" i]`).first(),
      this.page.locator(`button:has(i[class*="${keyword}" i]), a:has(i[class*="${keyword}" i]), [role="button"]:has(i[class*="${keyword}" i])`).first(),
      this.page.locator('button:has(i[class*="pencil" i]), a:has(i[class*="pencil" i]), [role="button"]:has(i[class*="pencil" i])').first(),
    ];

    for (const candidate of candidates) {
      const visible = await candidate.isVisible().catch(() => false);
      if (!visible) continue;

      await candidate.scrollIntoViewIfNeeded().catch(() => {});
      const clicked = await candidate.click({ force: true }).then(() => true).catch(async () => {
        return await candidate.evaluate((element: Element) => {
          (element as HTMLElement).click();
        }).then(() => true).catch(() => false);
      });

      if (clicked) {
        await waitForPageStable(this.page, 8000).catch(() => {});
        return;
      }
    }

    const clickedViaEvaluate = await this.page.evaluate((requestedAction) => {
      const isVisible = (element: Element | null): element is HTMLElement => {
        if (!(element instanceof HTMLElement)) return false;
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
      };

      const keywords = requestedAction === 'edit'
        ? ['edit', 'pencil', 'modify']
        : ['extend', 'extension', 'calendar', 'renew'];

      const allNodes = Array.from(document.querySelectorAll('button, a, [role="button"], i, span, div'));
      for (const node of allNodes) {
        const element = node as HTMLElement;
        const haystack = [
          element.id,
          element.getAttribute('title') || '',
          element.getAttribute('aria-label') || '',
          element.className || '',
          element.innerText || '',
        ].join(' ').toLowerCase();

        if (!keywords.some((keyword) => haystack.includes(keyword))) continue;

        const clickable = element.closest('button, a, [role="button"]') || element;
        if (!isVisible(clickable)) continue;

        clickable.click();
        return true;
      }

      return false;
    }, action).catch(() => false);

    if (clickedViaEvaluate) {
      await waitForPageStable(this.page, 8000).catch(() => {});
      return;
    }

    throw new Error(`Unable to find a visible ${action} action control on the contract details page.`);
  }

  // Contract identification locators
  async getContractNumber(): Promise<string | null> {
    try {
      const contractText = await this.page.getByText(/CA[0-9]+|CS[0-9]+/).first().textContent();
      return contractText?.trim() || null;
    } catch (e) {
      return null;
    }
  }

  async verifyContractNumber(contractNumber: string): Promise<boolean> {
    logger.info(`🔍 Verifying contract number on page: ${contractNumber}`);
    const normalizedExpected = contractNumber.replace(/\s+/g, '').trim();

    const exactVisible = await this.page
      .getByText(contractNumber, { exact: false })
      .first()
      .isVisible()
      .catch(() => false);

    if (exactVisible) {
      logger.info(`✅ Contract number verified: ${contractNumber}`);
      return true;
    }

    const bodyText = (await this.page.locator('body').textContent().catch(() => '')) || '';
    const normalizedBody = bodyText.replace(/\s+/g, '');

    if (normalizedExpected && normalizedBody.includes(normalizedExpected)) {
      logger.info(`✅ Contract number verified (normalized match): ${contractNumber}`);
      return true;
    }

    logger.error(`❌ Contract number not found: ${contractNumber}`);
    return false;
  }

  async verifyApprovalLinkCount(minCount: number): Promise<number> {
    await waitForPageStable(this.page, 6000).catch(() => {});

    const collectLinkCount = async (): Promise<number> => {
      const anchorCandidates = this.page.locator('a[href*="/r/"]');
      const anchorCount = await anchorCandidates.count();
      const extractedLinks: string[] = [];

      for (let index = 0; index < anchorCount; index++) {
        const href = await anchorCandidates.nth(index).getAttribute('href');
        if (!href) continue;

        const trimmed = href.trim();
        if (!trimmed || !trimmed.includes('/r/')) continue;

        const normalized = trimmed.startsWith('http')
          ? trimmed
          : trimmed.startsWith('/')
            ? `https://dubailand.gov.ae${trimmed}`
            : trimmed;

        extractedLinks.push(this.sanitizeApprovalLink(normalized));
      }

      const distinctAnchorLinks = Array.from(new Set(extractedLinks.filter(Boolean)));
      if (distinctAnchorLinks.length >= minCount) {
        return distinctAnchorLinks.length;
      }

      const bodyText = (await this.page.locator('body').textContent().catch(() => '')) || '';
      const textMatches = bodyText.match(/https:\/\/dubailand\.gov\.ae\/r\/[A-Za-z0-9_-]{8,20}(?:Send)?/g) || [];
      const normalizedTextLinks = textMatches.map((link) => this.sanitizeApprovalLink(link));

      const distinctLinks = Array.from(new Set([...distinctAnchorLinks, ...normalizedTextLinks].filter(Boolean)));
      return distinctLinks.length;
    };

    let count = await collectLinkCount();
    if (count < minCount) {
      await this.page.waitForTimeout(1500);
      await waitForPageStable(this.page, 4000).catch(() => {});
      count = await collectLinkCount();
    }

    if (count < minCount) {
      throw new Error(`Expected at least ${minCount} approval link(s) on contract details page, but found ${count}`);
    }

    logger.info(`✅ Contract details page contains ${count} approval link(s)`);
    return count;
  }

  // Button locators and actions
  async clickEditButton(): Promise<void> {
    logger.info('✏️ Clicking on edit button');
    await this.clickActionControl('edit');
    logger.info('✅ Edit button clicked');
  }

  async clickExtendButton(): Promise<void> {
    logger.info('⏳ Waiting for extend button to appear');
    await this.clickActionControl('extend');
    logger.info('✅ Extend button clicked');
  }

  async clickTermsCheckbox(): Promise<void> {
    logger.info('☑️ Clicking on terms and conditions checkbox');
    
    const page = this.page;

    const previewCheckbox = page.locator('.agree-link input[type="checkbox"]').first();
    const previewCheckboxLabel = page.locator('.agree-link label').first();
    const previewSubmitButton = page
      .locator('button.btn-continue:has-text("Submit Contract for Approval"), button:has-text("Submit Contract for Approval")')
      .first();

    const isPreviewTermsAccepted = async (): Promise<boolean> => {
      const checked = await previewCheckbox.isChecked().catch(() => false);
      if (checked) return true;

      const submitEnabled = await previewSubmitButton.isEnabled().catch(() => false);
      return submitEnabled;
    };

    const finalizeCheckboxAttempt = async (successLabel: string): Promise<boolean> => {
      await page.waitForTimeout(250);
      await waitForPageStable(page, 1500).catch(() => {});

      if (await isPreviewTermsAccepted()) {
        logger.info(`✅ Terms and conditions checkbox checked (${successLabel})`);
        return true;
      }

      return false;
    };

    const tryActivatePreviewTerms = async (): Promise<boolean> => {
      const visible = await previewCheckbox.isVisible().catch(() => false);
      if (!visible) return false;

      await previewCheckbox.scrollIntoViewIfNeeded().catch(() => {});

      if (await isPreviewTermsAccepted()) {
        logger.info('✅ Terms and conditions checkbox already checked (preview page)');
        return true;
      }

      const previewAttempts: Array<{ label: string; action: () => Promise<void> }> = [
        {
          label: 'preview label click',
          action: async () => {
            await previewCheckboxLabel.click({ timeout: 5000 });
          },
        },
        {
          label: 'preview checkbox check',
          action: async () => {
            await previewCheckbox.check({ force: true, timeout: 5000 });
          },
        },
        {
          label: 'preview checkbox click',
          action: async () => {
            await previewCheckbox.click({ force: true, timeout: 5000 });
          },
        },
        {
          label: 'preview keyboard space',
          action: async () => {
            await previewCheckbox.focus();
            await page.keyboard.press('Space');
          },
        },
        {
          label: 'preview DOM toggle fallback',
          action: async () => {
            await previewCheckbox.evaluate((element) => {
              const input = element as HTMLInputElement;
              input.click();
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            });
          },
        },
      ];

      for (const attempt of previewAttempts) {
        const worked = await attempt.action().then(() => true).catch(() => false);
        if (!worked) continue;
        if (await finalizeCheckboxAttempt(attempt.label)) return true;
      }

      return false;
    };

    const tryClickByLocator = async (locator: ReturnType<Page['locator']>, label: string): Promise<boolean> => {
      const count = await locator.count().catch(() => 0);
      if (!count) return false;

      for (let index = 0; index < count; index++) {
        const candidate = locator.nth(index);
        const visible = await candidate.isVisible().catch(() => false);
        if (!visible) continue;

        const clicked = await candidate.click({ force: true }).then(() => true).catch(async () => {
          return await candidate.check({ force: true }).then(() => true).catch(() => false);
        });

        if (clicked) {
          await page.waitForTimeout(200);
          if (await tryActivatePreviewTerms()) return true;
          logger.info(`✅ Terms and conditions checkbox checked (${label}, index ${index})`);
          return true;
        }
      }

      return false;
    };

    if (await tryActivatePreviewTerms()) return;
    
    // Try approval page XPath first
    const approvalCheckboxXPath = '//*[@id="TermsAccepted"]';
    let checkbox = page.locator(`xpath=${approvalCheckboxXPath}`);
    let checkboxVisible = await checkbox.isVisible().catch(() => false);
    
    if (checkboxVisible) {
      await checkbox.click();
      logger.info('✅ Terms and conditions checkbox checked (approval page - XPath 1)');
      return;
    }
    
    // Try alternative approval page XPath
    const approvalCheckboxXPath2 = '/html/body/div[3]/div/div[15]/div/form/label';
    checkbox = page.locator(`xpath=${approvalCheckboxXPath2}`);
    checkboxVisible = await checkbox.isVisible().catch(() => false);
    
    if (checkboxVisible) {
      await checkbox.click();
      logger.info('✅ Terms and conditions checkbox checked (approval page - XPath 2)');
      return;
    }

    // Flexible fallbacks on signatory/details pages
    if (await tryClickByLocator(page.locator('input#TermsAccepted'), 'input#TermsAccepted')) return;
    if (await tryClickByLocator(page.locator('input[name*="Terms" i], input[id*="Terms" i]'), 'input name/id contains Terms')) return;
    if (await tryClickByLocator(page.locator('label:has-text("I agree"), label:has-text("I Accept"), label:has-text("terms")'), 'label text agree/terms')) return;
    if (await tryClickByLocator(page.getByRole('checkbox'), 'visible role=checkbox')) return;

    // Try clicking any visible checkbox-like wrapper near terms text
    const clickedViaEvaluate = await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('label, div, span')) as HTMLElement[];
      for (const el of candidates) {
        const text = (el.innerText || '').replace(/\s+/g, ' ').trim();
        if (!/terms|agree|accept/i.test(text)) continue;
        const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
        if (input) {
          input.click();
          return true;
        }
        el.click();
        return true;
      }
      return false;
    }).catch(() => false);

    if (clickedViaEvaluate) {
      logger.info('✅ Terms and conditions checkbox checked (evaluate fallback)');
      return;
    }
    
    // Try creation page XPath
    const creationCheckboxXPath = '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[2]/label/input';
    checkbox = page.locator(`xpath=${creationCheckboxXPath}`);
    const creationVisible = await checkbox.isVisible({ timeout: 5000 }).catch(() => false);
    if (creationVisible) {
      await checkbox.check({ force: true }).catch(async () => {
        await checkbox.click({ force: true }).catch(() => {});
      });
      await waitForPageStable(page);
      logger.info('✅ Terms and conditions checkbox checked (creation page)');
      return;
    }

    throw new Error(`Unable to find/click Terms and Conditions checkbox on page: ${page.url()}`);
  }

  async clickSubmitButton(): Promise<void> {
    logger.info('📤 Clicking on submit button');
    // Use getByRole to select the Accept button specifically
    const submitButton = this.page.getByRole('button', { name: /Accept|قبول/ });
    await submitButton.waitFor({ state: 'visible', timeout: 10000 });
    await submitButton.click();
    logger.info('✅ Submit button clicked');
  }

  async clickConfirmYesButton(): Promise<void> {
    logger.info('👍 Clicking Yes button on confirmation popup');

    const successAlreadyVisible = await this.page
      .getByText(/Your signature request has been accepted successfully|Your request has been accepted successfully|لقد تمت الموافقة/i)
      .first()
      .isVisible()
      .catch(() => false);

    if (successAlreadyVisible) {
      logger.info('ℹ️ Success message already visible, confirmation popup not required');
      return;
    }

    const candidates = [
      this.page.locator('xpath=/html/body/div[4]/div[3]/div/button[1]').first(),
      this.page.locator('#yes').first(),
      this.page.getByRole('button', { name: /Yes|OK|Confirm|نعم/i }).first(),
      this.page.locator('.swal2-confirm, .modal-footer button.btn-primary, .modal-footer button').first(),
    ];

    for (const candidate of candidates) {
      const visible = await candidate.isVisible({ timeout: 4000 }).catch(() => false);
      if (!visible) continue;

      await candidate.scrollIntoViewIfNeeded().catch(() => {});
      try {
        await candidate.click({ timeout: 5000, noWaitAfter: true });
      } catch {
        try {
          await candidate.click({ force: true, timeout: 5000, noWaitAfter: true });
        } catch {
          await candidate.evaluate((element) => (element as HTMLElement).click()).catch(() => {});
        }
      }

      logger.info('✅ Confirmation accepted');
      return;
    }

    const successVisibleAfterWait = await this.page
      .getByText(/Your signature request has been accepted successfully|Your request has been accepted successfully|لقد تمت الموافقة/i)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (successVisibleAfterWait) {
      logger.info('ℹ️ No popup appeared, but success message became visible');
      return;
    }

    throw new Error(`Confirmation popup did not appear and no success message was visible on page: ${this.page.url()}`);
  }

  async waitForSuccessMessage(expectedMessage: string): Promise<boolean> {
    logger.info(`🔍 Waiting for success message: "${expectedMessage}"`);
    try {
      const successMessage = this.page.getByText(expectedMessage);
      await successMessage.waitFor({ state: 'visible', timeout: 30000 });
      const messageText = await successMessage.textContent();
      logger.info(`✅ Success message verified: "${messageText}"`);
      return true;
    } catch (e) {
      logger.error('❌ Success message not found within timeout');
      return false;
    }
  }

  async clickSaveAndContinue(): Promise<void> {
    logger.info('➡️ Clicking Save & Continue');
    const saveContinueButton = this.page.locator('button.buttonNext.btn.btn-primary');
    await saveContinueButton.waitFor({ state: 'visible', timeout: 30000 });
    await saveContinueButton.click();
    await waitForPageStable(this.page);
    logger.info('✅ Save & Continue clicked');
  }

  async clickSubmitContractForApproval(): Promise<void> {
    logger.info('📤 Clicking on Submit Contract for Approval button');
    const candidates = [
      this.page.getByRole('button', { name: /Submit Contract for Approval/i }).first(),
      this.page.locator('button.btn-continue').filter({ hasText: 'Submit Contract for Approval' }).first(),
      this.page.locator('button:has-text("Submit Contract for Approval")').first(),
      this.page.locator('xpath=/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div[2]/div[2]/div/div[3]/div/button[2]').first(),
    ];

    let submitBtn = candidates[0];
    let foundVisible = false;

    for (const candidate of candidates) {
      const visible = await candidate.isVisible().catch(() => false);
      if (!visible) continue;
      submitBtn = candidate;
      foundVisible = true;
      break;
    }

    if (!foundVisible) {
      throw new Error('Submit Contract for Approval button was not visible on the preview page.');
    }

    await submitBtn.scrollIntoViewIfNeeded().catch(() => {});

    const enabled = await submitBtn.isEnabled().catch(() => false);
    if (!enabled) {
      throw new Error('Submit Contract for Approval button is still disabled. Terms checkbox may not be accepted yet.');
    }

    const clickAttempts: Array<() => Promise<void>> = [
      async () => { await submitBtn.click({ timeout: 5000 }); },
      async () => { await submitBtn.click({ force: true, timeout: 5000, noWaitAfter: true }); },
      async () => {
        await submitBtn.evaluate((element) => {
          (element as HTMLButtonElement).click();
        });
      },
    ];

    let clicked = false;
    for (const attempt of clickAttempts) {
      try {
        await attempt();
        clicked = true;
        break;
      } catch {
        continue;
      }
    }

    if (!clicked) {
      throw new Error('Unable to click Submit Contract for Approval button on the preview page.');
    }

    const confirmButton = this.page.getByRole('button', { name: /yes|ok|confirm|submit/i }).first();
    if (await confirmButton.isVisible({ timeout: 4000 }).catch(() => false)) {
      await confirmButton.click({ force: true }).catch(() => {});
      logger.info('ℹ️ Confirmed Contract A submit action on popup');
    }

    await waitForPageStable(this.page, 15000).catch(() => {});

    const successVisible = await this.page
      .getByText(/Your contract has been submitted successfully/i)
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    const submitStillVisible = await submitBtn.isVisible().catch(() => false);
    if (!successVisible && submitStillVisible) {
      throw new Error('Submit Contract for Approval click did not transition away from preview page or show success message.');
    }

    logger.info('✅ Contract submitted for approval');
  }

  private sanitizeApprovalLink(rawLink: string): string {
    const trimmed = (rawLink || '').trim();
    if (!trimmed) return '';

    const directUrlMatch = trimmed.match(/https?:\/\/dubailand\.gov\.ae\/r\/[A-Za-z0-9_-]+/);
    if (!directUrlMatch) return trimmed;

    const original = directUrlMatch[0];
    let sanitized = original;
    try {
      const parsed = new URL(sanitized);
      const pathParts = parsed.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1] || '';

      if (/send$/i.test(lastPart) && lastPart.length > 4) {
        pathParts[pathParts.length - 1] = lastPart.replace(/send$/i, '');
        parsed.pathname = `/${pathParts.join('/')}`;
        sanitized = parsed.toString();
      }
    } catch {
      if (/send$/i.test(sanitized) && sanitized.length > 4) {
        sanitized = sanitized.replace(/send$/i, '');
      }
    }

    if (sanitized !== original) {
      logger.info(`🧹 Sanitized approval link: ${original} -> ${sanitized}`);
    }

    return sanitized;
  }

  // Approval/Edit link extraction
  async getApprovalLink(fallbackXPath?: string): Promise<string> {
    logger.info('📄 Waiting for approval link to load');
    await waitForPageStable(this.page, 15000);

    const anchorCandidates = this.page.locator('a[href*="/r/"]');
    const anchorCount = await anchorCandidates.count();

    const extractedLinks: string[] = [];
    for (let index = 0; index < anchorCount; index++) {
      const link = await anchorCandidates.nth(index).getAttribute('href');
      if (!link) continue;

      const trimmed = link.trim();
      if (!trimmed) continue;
      if (trimmed.includes('/r/')) {
        extractedLinks.push(trimmed);
      }
    }

    const normalizedLinks = extractedLinks
      .map((link) => {
        if (link.startsWith('http')) return link;
        if (link.startsWith('/')) return `https://dubailand.gov.ae${link}`;
        return link;
      })
      .filter((link) => link.includes('dubailand.gov.ae/r/'));

    if (normalizedLinks.length > 0) {
      const latestLink = this.sanitizeApprovalLink(normalizedLinks[normalizedLinks.length - 1]);
      logger.info(`✅ Approval link element found (${normalizedLinks.length} candidate(s))`);
      logger.info('🔗 Extracted approval link: ' + latestLink);
      return latestLink;
    }

    const bodyText = (await this.page.locator('body').textContent().catch(() => '')) || '';
    const textMatches = bodyText.match(/https:\/\/dubailand\.gov\.ae\/r\/[A-Za-z0-9_-]{8,20}(?:Send)?/g) || [];
    if (textMatches.length > 0) {
      const latestRawTextLink = textMatches[textMatches.length - 1].replace(/Send$/i, '');
      const latestTextLink = this.sanitizeApprovalLink(latestRawTextLink);
      logger.info(`✅ Approval link found in text (${textMatches.length} candidate(s))`);
      logger.info('🔗 Extracted approval link: ' + latestTextLink);
      return latestTextLink;
    }

    const resolvedFallbackXPath = fallbackXPath || '/html/body/div/div/div/div/div/div[2]/div[2]/div/div/div[2]/div/div[3]/div/div[3]/div/div[2]/div/div[1]/div[1]/div[2]/div/div[1]';
    const fallbackElement = this.page.locator(`xpath=${resolvedFallbackXPath}`);
    await fallbackElement.waitFor({ state: 'attached', timeout: 15000 });
    let fallbackLink = await fallbackElement.getAttribute('href');
    if (!fallbackLink) {
      fallbackLink = await fallbackElement.evaluate((element) => {
        const anchor =
          (element instanceof HTMLAnchorElement ? element : null) ||
          element.querySelector('a') ||
          element.closest('a');

        return (
          anchor?.getAttribute('href') ||
          anchor?.textContent ||
          element.getAttribute('href') ||
          element.getAttribute('data-href') ||
          element.textContent ||
          ''
        );
      });
    }

    const extractedFallbackLink = this.sanitizeApprovalLink(fallbackLink?.trim() || '');
    if (!extractedFallbackLink) {
      throw new Error('❌ Approval link is empty or not found');
    }

    logger.info('🔗 Extracted approval link (fallback): ' + extractedFallbackLink);
    return extractedFallbackLink;
  }

  // Page title verification
  async getPageTitle(): Promise<string | null> {
    try {
      const pageTitle = await this.page.locator('h1, h2, h3').first().textContent();
      return pageTitle?.trim() || null;
    } catch (e) {
      return null;
    }
  }

  async waitForPageToLoad(timeout: number = 30000): Promise<void> {
    logger.info('⏳ Waiting for page to load');
    // Wait for any page content to be visible
    await this.page.locator('body').waitFor({ state: 'visible', timeout });
    await waitForPageStable(this.page, timeout);
    logger.info('✅ Page loaded');
  }
}
