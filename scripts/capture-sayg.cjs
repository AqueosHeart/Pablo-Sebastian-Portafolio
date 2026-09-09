const { chromium } = require('C:/Users/SEBASTIAN/Desktop/SayG programa subir archivos/node_modules/playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto('http://127.0.0.1:5055', { waitUntil: 'networkidle' });

  await page.locator('textarea').evaluateAll((elements) => elements.forEach((element) => { element.value = ''; }));
  await page.locator('input').evaluateAll((elements) => elements.forEach((element) => {
    if (element.type !== 'button' && element.type !== 'submit') element.value = '';
  }));

  const output = path.resolve('public/assets/images/projects/sayg-real');
  await page.locator('header').screenshot({ path: path.join(output, 'dashboard-header.png') });
  await page.locator('#panel-massive').screenshot({ path: path.join(output, 'bulk-upload.png') });
  await page.locator('#panel-expediente-unificado').screenshot({ path: path.join(output, 'unified-expediente.png') });
  await browser.close();
})();
