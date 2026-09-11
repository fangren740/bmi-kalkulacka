const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const base = process.env.RV_TARGET_BASE || 'http://127.0.0.1:8765';
const output = process.env.RV_QA_OUTPUT || '/tmp/rv-batch1-browser';
fs.mkdirSync(output, { recursive: true });

const targets = [
  ['procenta-kalkulacka.html', '#answerValue', /30/],
  ['kalkulacka-celkove-ceny-vlastnictvi-auta.html', '#totalTco', /900\s*000|900\.000|900,000/],
  ['kalkulacka-hodinove-mzdy.html', '#hourlyResult', /238/],
  ['kalkulacka-dovolene.html', '#remainingHours', /160/],
  ['kalkulacka-prescasu.html', '#totalCash', /1\s*800|1800/],
  ['cestovni-nahrady-kalkulacka.html', '#resultTotal', /Kč/],
];
const widths = [1440, 1280, 1024, 768, 390, 320];
const rows = [];

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const [file, resultSelector, resultPattern] of targets) {
      for (const width of widths) {
        const page = await browser.newPage({ viewport: { width, height: 900 } });
        const pageErrors = [];
        const consoleErrors = [];
        page.on('pageerror', e => pageErrors.push(String(e)));
        page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
        await page.goto(`${base}/${file}`, { waitUntil: 'networkidle' });
        await page.waitForSelector('[data-rv-finish-trust="1"]', { timeout: 5000 });

        const metrics = await page.evaluate(() => {
          const root = document.documentElement;
          const headerLogo = document.querySelector('header img')?.getAttribute('src') || '';
          const footerLogo = document.querySelector('footer img')?.getAttribute('src') || '';
          const social = [...document.querySelectorAll('footer a')].filter(a => /facebook\.com\/rychlevypocty|instagram\.com\/rychlevypocty/.test(a.href)).length;
          const hero = document.querySelector('.rv-finish-watermark');
          const trust = document.querySelector('[data-rv-finish-trust="1"]');
          const calc = document.querySelector('#kalkulacka');
          const fixed = [...document.querySelectorAll('body *')].filter(el => getComputedStyle(el).position === 'fixed').map(el => {
            const r = el.getBoundingClientRect();
            return { tag: el.tagName, cls: el.className, w: r.width, h: r.height, area: Math.max(0,r.width)*Math.max(0,r.height) };
          });
          const visibleInterstitials = [...document.querySelectorAll('.tco-nav,.vpc-anchor,.section-nav,.fact-strip,.travel-subnav')]
            .filter(el => getComputedStyle(el).display !== 'none' && el.getBoundingClientRect().height > 1)
            .map(el => el.className);
          return {
            overflow: Math.max(0, root.scrollWidth - root.clientWidth),
            headerLogo, footerLogo, social,
            watermark: hero?.getAttribute('data-rv-watermark') || '',
            trust: Boolean(trust),
            calculatorTop: calc?.getBoundingClientRect().top ?? null,
            fixedLarge: fixed.filter(x => x.area > innerWidth * innerHeight * .12),
            visibleInterstitials,
          };
        });

        assert.equal(metrics.overflow, 0, `${file} @ ${width}: horizontal overflow ${metrics.overflow}px`);
        assert.match(metrics.headerLogo, /logo-rv-v32\.svg\?v=1/, `${file}: canonical header logo missing`);
        assert.match(metrics.footerLogo, /logo-rv-v32-inverse\.svg\?v=1/, `${file}: inverse footer logo missing`);
        assert.equal(metrics.social, 2, `${file}: expected FB + IG`);
        assert.ok(metrics.watermark, `${file}: watermark missing`);
        assert.ok(metrics.trust, `${file}: trust block missing`);
        assert.deepEqual(pageErrors, [], `${file} @ ${width}: page errors`);
        assert.deepEqual(consoleErrors, [], `${file} @ ${width}: console errors`);
        if (width <= 390) {
          assert.equal(metrics.fixedLarge.length, 0, `${file}: large fixed mobile overlay detected`);
          assert.deepEqual(metrics.visibleInterstitials, [], `${file}: mobile hero must flow directly into calculator`);
        }

        const resultText = (await page.locator(resultSelector).first().textContent() || '').replace(/\u00a0/g, ' ');
        assert.match(resultText, resultPattern, `${file}: unexpected default result ${JSON.stringify(resultText)}`);

        if (file === 'kalkulacka-prescasu.html') {
          const help = await page.locator('#overtimeHours').locator('xpath=ancestor::*[contains(@class,"field")][1]//small').textContent();
          assert.match(help || '', /kratší pracovní doby/);
        }
        if (file === 'kalkulacka-hodinove-mzdy.html') {
          const minimum = await page.locator('#minimumStatus').textContent();
          assert.match(minimum || '', /40\s*h|40hodin|40 hodin/i);
        }

        if (width === 1440 || width === 390) {
          await page.screenshot({ path: path.join(output, `${file.replace('.html','')}-${width}.png`), fullPage: true });
        }
        rows.push({ file, width, ...metrics, resultText });
        await page.close();
      }
    }
    fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify({ status: 'PASS', rows }, null, 2));
    console.log(`BATCH1_BROWSER_PASS ${rows.length} cases`);
  } finally {
    await browser.close();
  }
})().catch(err => {
  fs.writeFileSync(path.join(output, 'failure.txt'), String(err.stack || err));
  console.error(err);
  process.exit(1);
});
