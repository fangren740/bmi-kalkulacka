'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const base = process.env.RV_TARGET_BASE || 'http://127.0.0.1:8765';
const output = process.env.RV_QA_OUTPUT || '/tmp/rv-superdavka-historic';
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const width of [320, 390, 768, 1440]) {
      const page = await browser.newPage({viewport: {width, height: 900}, locale: 'cs-CZ', reducedMotion: 'reduce'});
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/superdavka-kalkulacka.html', { waitUntil: 'networkidle', timeout: 45000 });
      assert.equal(await page.locator('.sd87-historic-alert').count(), 1, 'historical warning must be present');
      assert.ok(await page.locator('.sd87-historic-alert').isVisible(), 'historical warning must be visible');
      const warning = await page.locator('.sd87-historic-alert').innerText();
      assert.match(warning, /30\. 9\. 2026/);
      assert.match(warning, /není odhadem současného nároku/);
      assert.equal(await page.locator('.sd87-historic-alert a').getAttribute('href'), 'https://mpsv.gov.cz/dssp-kalkulacka');
      assert.equal(await page.locator('.sd87-historic-result').count(), 1);
      assert.match(await page.locator('.sd87-result-head').innerText(), /HISTORICKÝ ODHAD/);
      assert.match(await page.locator('.sd87-period-note').innerText(), /Historický model do 30\. 9\. 2026/);
      const before = await page.locator('#totalBenefit').innerText();
      assert.match(before, /Kč/);
      await page.locator('[data-template="single"]').click();
      assert.match(await page.locator('.sd87-result-head').innerText(), /HISTORICKÝ ODHAD/);
      await page.locator('#basicWorkIncome').fill('18000');
      await page.locator('#basicRent').fill('9000');
      const after = await page.locator('#totalBenefit').innerText();
      assert.match(after, /Kč/);
      await page.locator('[data-mode="advanced"]').click();
      assert.equal(await page.locator('#sd87AdvancedPanel').isVisible(), true, 'advanced controls');
      await page.locator('[data-mode="basic"]').click();
      assert.equal(await page.locator('#sd87BasicPanel').isVisible(), true, 'basic controls');
      assert.equal(errors.length, 0, 'browser JS errors: ' + errors.join('; '));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 2, 'horizontal overflow ' + width + 'px: ' + overflow);
      if (width === 390 || width === 1440) {
        await page.screenshot({ path: path.join(output, 'superdavka-' + width + '.png'), fullPage: true });
      }
      if (width === 390) {
        // Existing 25 scenario benchmark protects the historical calculation, independent of the new warning copy.
        const csv = fs.readFileSync(path.join(__dirname, '../../superdavka-2026-benchmark.csv'), 'utf8').replace(/^\\uFEFF/, '');
        const rows = csv.trim().split(/\\r?\\n/).slice(1).map(line => line.split(','));
        for (const cols of rows) {
          const [id, template, workIncome, otherIncome, rent, energy, region, housingType, expectedTotal] = cols;
          await page.locator('[data-template="' + template + '"]').click();
          await page.locator('#basicWorkIncome').fill(workIncome);
          await page.locator('#basicOtherIncome').fill(otherIncome);
          await page.locator('#basicRent').fill(rent);
          await page.locator('#basicEnergy').fill(energy);
          await page.locator('#basicRegion').selectOption(region);
          await page.locator('#basicHousingType').selectOption(housingType);
          const amount = await page.locator('#totalBenefit').innerText();
          const actual = Number(amount.replace(/[^0-9]/g, ''));
          assert.equal(actual, Number(expectedTotal), 'historical benchmark scenario ' + id + ' total');
        }
        results.push({ width: 390, benchmarkScenarios: rows.length, status: 'BENCHMARK_PASS' });
      }
      results.push({ width, before, after, errors, overflow, status: 'AUTOMATED_PASS_REQUIRES_VISUAL_REVIEW' });
      await page.close();
    }
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({ base, results }, null, 2));
  }
  console.log(JSON.stringify({ status: 'AUTOMATED_PASS_REQUIRES_VISUAL_REVIEW', results }));
})().catch(error => { console.error(error); process.exitCode = 1; });
