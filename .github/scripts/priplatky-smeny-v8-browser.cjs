#!/usr/bin/env node
'use strict';
// Targeted browser QA for the existing shift-premium calculator. Run on a
// local, isolated checkout: RV_TARGET_BASE=http://127.0.0.1:8765 node ...
// Requires Playwright/Chromium; does not mutate production or GitHub.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.RV_TARGET_BASE || 'http://127.0.0.1:8765';
const path = '/kalkulacka-priplatku-za-smeny.html';
const errors = [];
async function scenario(name, fn) {
  try { await fn(); console.log(`PASS ${name}`); }
  catch (error) { errors.push({name, message:error.message}); console.error(`FAIL ${name}: ${error.message}`); }
}
async function edit(page, values) {
  for (const [id, value] of Object.entries(values)) {
    await page.locator(`#${id}`).fill(String(value));
    await page.locator(`#${id}`).dispatchEvent('input');
  }
}
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    for (const width of [390, 1440]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      const runtime = [];
      page.on('pageerror', e => runtime.push(e.message));
      await page.goto(`${base}${path}`, {waitUntil:'networkidle'});
      await scenario(`${width}: initial calculation stays usable`, async () => {
        assert.equal(await page.locator('#formError').isVisible(), false);
        assert.match(await page.locator('#cashBonus').innerText(), /Kč/);
        assert.equal(runtime.length, 0, runtime.join('; '));
      });
      await scenario(`${width}: break must fit completely inside shift`, async () => {
        await edit(page,{shiftDate:'2026-09-18',shiftStart:'22:00',shiftEnd:'06:00',breakStart:'05:50',breakMinutes:'30'});
        assert.equal(await page.locator('#formError').isVisible(), true);
        assert.match(await page.locator('#formError').innerText(), /přestávk/i);
        assert.doesNotMatch(await page.locator('#cashBonus').innerText(), /\d[\d\s]*\s*Kč/,
          'Invalid input must not present a seemingly valid payable result');
      });
      await scenario(`${width}: normal break restores calculation`, async () => {
        await edit(page,{breakStart:'01:00',breakMinutes:'30'});
        assert.equal(await page.locator('#formError').isVisible(), false);
        assert.match(await page.locator('#cashBonus').innerText(), /Kč/);
      });
      await scenario(`${width}: manual hours cannot exceed worked`, async () => {
        await page.locator('#sfManualTab').click();
        await edit(page,{manualWorked:'4',manualNight:'6'});
        assert.equal(await page.locator('#formError').isVisible(), true);
        assert.doesNotMatch(await page.locator('#cashBonus').innerText(), /\d[\d\s]*\s*Kč/);
      });
      await scenario(`${width}: logo actually loads and remains visible`, async () => {
        const images = page.locator('header img.rv-logo-image, footer img');
        const n=await images.count(); assert.ok(n>=2, 'Expected header and footer image assets');
        for(let i=0;i<n;i++){
          const image=images.nth(i);
          const info=await image.evaluate(el=>({loaded:el.complete&&el.naturalWidth>0,
            src:el.currentSrc, filter:getComputedStyle(el).filter, opacity:getComputedStyle(el).opacity}));
          assert.ok(info.loaded, `Asset failed: ${info.src}`);
          assert.notEqual(info.opacity,'0',`Invisible asset: ${info.src}`);
          console.log(`BRAND ${width}: ${JSON.stringify(info)}`);
        }
      });
      await scenario(`${width}: no horizontal overflow`, async () => {
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth+1),true);
      });
      await page.close();
    }
  } finally {await browser.close();}
  if (errors.length) {
    console.error(JSON.stringify({result:'FAIL', errors},null,2));
    process.exitCode=1;
  } else console.log('SHIFT CALCULATOR V8 BROWSER QA PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
