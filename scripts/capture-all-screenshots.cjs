const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { chromium } = require('C:/Users/SEBASTIAN/Desktop/SayG programa subir archivos/node_modules/playwright');

const outDir = path.resolve(__dirname, '../src/assets/images/projects');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function waitUrl(url, timeoutMs = 25000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = async () => {
      try {
        const res = await fetch(url);
        if (res.ok || res.status < 500) {
          return resolve(true);
        }
      } catch (e) {}
      if (Date.now() - start > timeoutMs) {
        return resolve(false);
      }
      setTimeout(check, 800);
    };
    check();
  });
}

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture workflow...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2
  });

  // 1. WORK APP (Vite)
  console.log('\n[1/5] Starting Work App dev server...');
  const procWork = spawn('npx.cmd', ['vite', '--port', '3010'], {
    cwd: 'C:\\Users\\SEBASTIAN\\Desktop\\work',
    shell: true,
    stdio: 'ignore'
  });

  const isWorkReady = await waitUrl('http://localhost:3010');
  if (isWorkReady) {
    console.log('📸 Capturing screenshot for Work App...');
    const page = await context.newPage();
    await page.goto('http://localhost:3010', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.screenshot({ path: path.join(outDir, 'work.png'), type: 'png' });
    await page.close();
    console.log('✅ Captured work.png');
  } else {
    console.log('⚠️ Work App server timed out, fallback to local HTML.');
    const page = await context.newPage();
    await page.goto(`file:///C:/Users/SEBASTIAN/Desktop/work/index.html`);
    await page.screenshot({ path: path.join(outDir, 'work.png'), type: 'png' });
    await page.close();
  }
  procWork.kill();

  // 2. SHOP APP (Next.js)
  console.log('\n[2/5] Starting Shop App dev server...');
  const procShop = spawn('npx.cmd', ['next', 'dev', '-p', '3011'], {
    cwd: 'C:\\Users\\SEBASTIAN\\Desktop\\Shop\\shop',
    shell: true,
    stdio: 'ignore'
  });

  const isShopReady = await waitUrl('http://localhost:3011');
  if (isShopReady) {
    console.log('📸 Capturing screenshot for Shop App...');
    const page = await context.newPage();
    await page.goto('http://localhost:3011', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, 'shop.png'), type: 'png' });
    await page.close();
    console.log('✅ Captured shop.png');
  } else {
    console.log('⚠️ Shop App server timed out.');
  }
  procShop.kill();

  // 3. CREATOR OS (Next.js)
  console.log('\n[3/5] Starting Creator OS dev server...');
  const procCreator = spawn('npx.cmd', ['next', 'dev', '-p', '3012'], {
    cwd: 'C:\\Users\\SEBASTIAN\\Desktop\\Work2',
    shell: true,
    stdio: 'ignore'
  });

  const isCreatorReady = await waitUrl('http://localhost:3012');
  if (isCreatorReady) {
    console.log('📸 Capturing screenshot for Creator OS...');
    const page = await context.newPage();
    await page.goto('http://localhost:3012', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, 'creator-os.png'), type: 'png' });
    await page.close();
    console.log('✅ Captured creator-os.png');
  } else {
    console.log('⚠️ Creator OS server timed out.');
  }
  procCreator.kill();

  // 4. AARC AUTH (Next.js)
  console.log('\n[4/5] Starting AARC Auth dev server...');
  const procAarc = spawn('npx.cmd', ['next', 'dev', '-p', '3013'], {
    cwd: 'C:\\Users\\SEBASTIAN\\Desktop\\sistemas-1',
    shell: true,
    stdio: 'ignore'
  });

  const isAarcReady = await waitUrl('http://localhost:3013');
  if (isAarcReady) {
    console.log('📸 Capturing screenshot for AARC Auth...');
    const page = await context.newPage();
    await page.goto('http://localhost:3013', { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(outDir, 'aarc-auth.png'), type: 'png' });
    await page.close();
    console.log('✅ Captured aarc-auth.png');
  } else {
    console.log('⚠️ AARC Auth server timed out.');
  }
  procAarc.kill();

  // 5. SAYG DOCUMENT AUTOMATION (Local HTML Dashboard)
  console.log('\n[5/5] Capturing SayG Document Automation dashboard...');
  const pageSayg = await context.newPage();
  const saygHtmlPath = 'file:///C:/Users/SEBASTIAN/Desktop/SayG%20programa%20subir%20archivos/debug_table_page.html';
  await pageSayg.goto(saygHtmlPath, { waitUntil: 'networkidle' }).catch(() => {});
  await pageSayg.screenshot({ path: path.join(outDir, 'sayg-automation.png'), type: 'png' });
  await pageSayg.close();
  console.log('✅ Captured sayg-automation.png');

  await browser.close();
  console.log('\n🎉 Screenshot capture workflow completed!');
}

captureScreenshots();
