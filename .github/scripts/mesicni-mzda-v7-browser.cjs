const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const base = process.env.RV_TARGET_BASE || 'http://127.0.0.1:8765';
const output = process.env.RV_QA_OUTPUT || '/tmp/rv-mesicni-mzda-v7';
const file = 'mesicni-mzda-z-hodinove-sazby-kalkulacka.html';
const widths = [1440, 1280, 1120, 1024, 768, 390, 320];
fs.mkdirSync(output, { recursive: true });
const rows = [];

function compact(text) {
  return String(text || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      const pageErrors = [];
      const consoleErrors = [];
      page.on('pageerror', e => pageErrors.push(String(e)));
      page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
      await page.goto(`${base}/${file}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('#monthlyTotal');

      const metrics = await page.evaluate(() => {
        const root = document.documentElement;
        const headerLogo = document.querySelector('header img')?.getAttribute('src') || '';
        const footerLogo = document.querySelector('footer img')?.getAttribute('src') || '';
        const socials = document.querySelectorAll('footer .rv-social-links a').length;
        const fixedLarge = [...document.querySelectorAll('body *')]
          .filter(el => getComputedStyle(el).position === 'fixed')
          .map(el => {
            const r = el.getBoundingClientRect();
            return { tag: el.tagName, cls: String(el.className || ''), area: Math.max(0, r.width) * Math.max(0, r.height) };
          })
          .filter(x => x.area > innerWidth * innerHeight * .12);
        return {
          overflow: Math.max(0, root.scrollWidth - root.clientWidth),
          headerLogo,
          footerLogo,
          socials,
          brandBody: document.body.classList.contains('rv-brand-v32'),
          brandHero: document.querySelector('.hero')?.classList.contains('rv-identity-hero') || false,
          brandCalc: document.querySelector('#kalkulacka')?.classList.contains('rv-brand-calculator') || false,
          brandResult: document.querySelector('#vysledek')?.classList.contains('rv-brand-result') || false,
          sources: document.body.textContent.includes('Ověřené zdroje 2026'),
          fixedLarge,
        };
      });

      assert.equal(metrics.overflow, 0, `horizontal overflow ${metrics.overflow}px @ ${width}`);
      assert.match(metrics.headerLogo, /logo-rv-v32\.svg\?v=1/);
      assert.match(metrics.footerLogo, /logo-rv-v32-inverse\.svg\?v=1/);
      assert.equal(metrics.socials, 2);
      assert.ok(metrics.brandBody && metrics.brandHero && metrics.brandCalc && metrics.brandResult, `brand contract missing @ ${width}`);
      assert.ok(metrics.sources, `method sources missing @ ${width}`);
      assert.deepEqual(metrics.fixedLarge, [], `large fixed overlay @ ${width}`);
      assert.deepEqual(pageErrors, [], `page errors @ ${width}: ${pageErrors.join(' | ')}`);
      assert.deepEqual(consoleErrors, [], `console errors @ ${width}: ${consoleErrors.join(' | ')}`);

      const defaultResult = compact(await page.locator('#monthlyTotal').textContent());
      assert.match(defaultResult, /38\s?133\s?Kč/);

      // Critical regression: Advanced must stay selected after click. The old generic
      // [data-mode] listener also bound body and could reset the mode on bubbling.
      await page.locator('.mode-switch button[data-mode="advanced"]').click();
      await page.waitForTimeout(50);
      const advancedState = await page.evaluate(() => ({
        mode: document.body.dataset.mode,
        hidden: document.querySelector('[data-panel="advanced"]')?.hidden,
        pressed: document.querySelector('.mode-switch button[data-mode="advanced"]')?.getAttribute('aria-pressed'),
      }));
      assert.equal(advancedState.mode, 'advanced', `Advanced mode reset @ ${width}`);
      assert.equal(advancedState.hidden, false, `Advanced panel hidden @ ${width}`);
      assert.equal(advancedState.pressed, 'true', `Advanced button state wrong @ ${width}`);

      // The radio itself is visually hidden by the card UI, so exercise the control
      // exactly as a user does: click its visible label/card, then verify checked state.
      const actualCard = page.locator('label:has(input[name="basis"][value="actual"])');
      await actualCard.click();
      assert.equal(await page.locator('input[name="basis"][value="actual"]').isChecked(), true, `Actual basis not selected @ ${width}`);
      await page.locator('#actualHours').fill('168');
      await page.locator('#overtimeHours').fill('10');
      await page.locator('#overtimePremium').fill('25');
      await page.locator('#averageHourly').fill('260');
      await page.locator('#monthlyExtras').fill('1500');
      await page.locator('#annualBonus').fill('12000');
      await page.waitForTimeout(50);
      const advancedResult = compact(await page.locator('#monthlyTotal').textContent());
      assert.match(advancedResult, /41\s?310\s?Kč/, `unexpected advanced result ${advancedResult} @ ${width}`);

      // Stale-state regression: invalid input must hide the old valid amount.
      await page.locator('#hourlyRate').fill('');
      await page.waitForTimeout(30);
      const invalidResult = compact(await page.locator('#monthlyTotal').textContent());
      const invalidAria = await page.locator('#hourlyRate').getAttribute('aria-invalid');
      assert.equal(invalidResult, '—', `stale result visible @ ${width}`);
      assert.equal(invalidAria, 'true', `aria-invalid missing @ ${width}`);
      await page.locator('#hourlyRate').fill('220');
      await page.waitForTimeout(30);
      assert.notEqual(compact(await page.locator('#monthlyTotal').textContent()), '—', `result did not recover @ ${width}`);

      if (width === 1440 || width === 390) {
        await page.goto(`${base}/${file}`, { waitUntil: 'networkidle' });
        await page.screenshot({ path: path.join(output, `mesicni-mzda-${width}-full.png`), fullPage: true });
        await page.screenshot({ path: path.join(output, `mesicni-mzda-${width}-top.png`), clip: { x: 0, y: 0, width, height: Math.min(1800, await page.evaluate(() => document.documentElement.scrollHeight)) } });
      }

      rows.push({ width, defaultResult, advancedResult, ...metrics });
      await page.close();
    }
    fs.writeFileSync(path.join(output, 'summary.json'), JSON.stringify({ status: 'PASS', cases: rows.length, rows }, null, 2));
    console.log(`MESICNI_MZDA_V7_BROWSER_PASS ${rows.length} widths`);
  } finally {
    await browser.close();
  }
})().catch(err => {
  fs.writeFileSync(path.join(output, 'failure.txt'), String(err.stack || err));
  console.error(err);
  process.exit(1);
});
