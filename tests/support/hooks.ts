// tests/support/hooks.ts
import { Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { World } from './world';

setDefaultTimeout(30 * 1000); // 30 seconds timeout for all steps

import fs from 'fs';
import path from 'path';

Before(async function (this: World) {
  await this.initBrowser();
});

After({ timeout: 90000 }, async function (this: World, { result }) {

  // On failure, capture screenshot and page source into allure-results
  try {
    if (result && result.status === 'FAILED' && this.page) {
      const resultsDir = path.resolve(process.cwd(), 'allure-results');
      if (!fs.existsSync(resultsDir)) fs.mkdirSync(resultsDir, { recursive: true });

      // slug to associate attachments with scenario
      const sanitize = (s: string) => s.replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 200);
      const feature = (this as any).pickle?.uri || 'unknown-feature';
      const scenarioName = (this as any).pickle?.name || `scenario-${Date.now()}`;
      const slug = sanitize(`${feature}-${scenarioName}`);

      const screenshotFile = `${slug}-screenshot-${Date.now()}.png`;
      const htmlFile = `${slug}-page-${Date.now()}.html`;

      const screenshotPath = path.join(resultsDir, screenshotFile);
      const htmlPath = path.join(resultsDir, htmlFile);

      // write screenshot
      const screenshot = await this.page.screenshot();
      fs.writeFileSync(screenshotPath, screenshot);

      // write page source
      const html = await this.page.content();
      fs.writeFileSync(htmlPath, html, 'utf8');

      // write attachments metadata for converter to pick up
      const attachmentsMeta = [
        { name: 'screenshot', type: 'image/png', source: screenshotFile },
        { name: 'page-source', type: 'text/html', source: htmlFile }
      ];
      fs.writeFileSync(path.join(resultsDir, `${slug}-attachments.json`), JSON.stringify(attachmentsMeta, null, 2));

      console.log(`🟦 Wrote attachments for ${scenarioName} -> ${screenshotFile}, ${htmlFile}`);
    }
  } catch (e) {
    const errMsg = (e && (e as any).message) ? (e as any).message : String(e);
    console.error('🟥 Failed to write failure artifacts:', errMsg);
  }

  // Wait 30 seconds before closing so you can observe the final page state
  if (this.page) {
    await this.page.waitForTimeout(30000);
  }

  await this.closeBrowser();
});
