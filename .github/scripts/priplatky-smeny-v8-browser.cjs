#!/usr/bin/env node
'use strict';
// Real rendered/browser QA of one isolated calculator; never production.
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const fs = require('node:fs');
const base = process.env.RV_TARGET_BASE || 'http://127.0.0.1:8765';
const path = '/kalkulacka-priplatku-za-smeny.html';
const errors = [];
const screenshots = process.env.RV_SCREENSHOTS || '/tmp/rv-priplatky-v8';
fs.mkdirSync(screenshots,{recursive:true});
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
async function renderedColors(page, image, shot) {
  const png=await image.screenshot({path:shot});
  return page.evaluate(async data=>{
    const img=new Image(); img.src=`data:image/png;base64,${data}`; await img.decode();
    const c=document.createElement('canvas'); c.width=img.width;c.height=img.height;
    const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
    const rgba=ctx.getImageData(0,0,c.width,c.height).data;
    let green=0,blue=0,light=0;
    for(let i=0;i<rgba.length;i+=4){
      const r=rgba[i],g=rgba[i+1],b=rgba[i+2];
      if(g>100&&g>r*1.3&&g>b*.85)green++;
      if(b>95&&b>r*1.25&&b>g*.95)blue++;
      if(r>225&&g>225&&b>225)light++;
    }
    return {green,blue,light};
  },png.toString('base64'));
}
(async () => {
  const browser = await chromium.launch({headless:true});
  try {
    for (const width of [320,390,768,1440]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      const runtime = [];
      page.on('pageerror', e => runtime.push(e.message));
      await page.goto(`${base}${path}`, {waitUntil:'networkidle'});
      await scenario(`${width}: initial calculation stays usable`, async () => {
        assert.equal(await page.locator('#formError').isVisible(), false);
        assert.match(await page.locator('#cashBonus').innerText(), /Kč/);
        assert.equal(runtime.length, 0, runtime.join('; '));
      });
      // Measure the visible element *before* scrolling the sticky header away.
      await scenario(`${width}: rendered branding, CSS filters and versioned cache`, async () => {
        for(const [label,selector] of [['header','header img.rv-logo-image'],['footer','footer img.rv-logo-image']]) {
          if(label==='header') await page.evaluate(()=>scrollTo(0,0));
          const image=page.locator(selector);assert.equal(await image.count(),1);
          await image.scrollIntoViewIfNeeded();
          assert.equal(await image.isVisible(),true,`${label} logo must be visible`);
          const info=await image.evaluate(el=>({loaded:el.complete&&el.naturalWidth>0,
            src:el.currentSrc, filter:getComputedStyle(el).filter,
            parentFilter:getComputedStyle(el.parentElement).filter,
            opacity:getComputedStyle(el).opacity}));
          assert.ok(info.loaded, `SVG failed: ${info.src}`);
          assert.notEqual(info.opacity,'0',`Invisible SVG: ${info.src}`);
          assert.equal(info.filter,'none',`SVG CSS filter changes official colors: ${info.src}`);
          assert.equal(info.parentFilter,'none',`Parent filter changes official colors: ${info.src}`);
          assert.match(info.src,/logo-rv-v32(?:-inverse|-footer-color)?\.svg\?v=/,'Versioned official asset required');
          const response=await page.request.get(info.src);assert.equal(response.status(),200);
          const colors=await renderedColors(page,image,`${screenshots}/${label}-${width}.png`);
          console.log(`BRAND ${width} ${label}: ${JSON.stringify({info,colors})}`);
          assert.ok(colors.green>5,`Rendered ${label} logo lost green: ${JSON.stringify(colors)}`);
          assert.ok(colors.blue>5,`Rendered ${label} logo lost blue: ${JSON.stringify(colors)}`);
          assert.ok(colors.light>5,`Rendered ${label} logo lost light glyphs: ${JSON.stringify(colors)}`);
        }
      });
      await scenario(`${width}: break must fit completely inside shift`, async () => {
        await edit(page,{shiftDate:'2026-09-18',shiftStart:'22:00',shiftEnd:'06:00',breakStart:'05:50',breakMinutes:'30'});
        assert.equal(await page.locator('#formError').isVisible(), true);
        assert.match(await page.locator('#formError').innerText(), /přestávk/i);
        for (const id of ['cashBonus','totalPay','auditExpected'])
          assert.doesNotMatch(await page.locator(`#${id}`).innerText(), /\d[\d\s]*\s*Kč/);
        assert.equal(await page.locator('#copyResult').isDisabled(),true);
      });
      await scenario(`${width}: normal break restores calculation`, async () => {
        await edit(page,{breakStart:'01:00',breakMinutes:'30'});
        assert.equal(await page.locator('#formError').isVisible(), false);
        assert.match(await page.locator('#cashBonus').innerText(), /Kč/);
        assert.equal(await page.locator('#copyResult').isEnabled(),true);
      });
      await scenario(`${width}: manual invalid hours and recovery`, async () => {
        await page.locator('#sfManualTab').click();
        await edit(page,{manualWorked:'4',manualNight:'6',manualWeekend:'3'});
        assert.equal(await page.locator('#formError').isVisible(), true);
        assert.doesNotMatch(await page.locator('#cashBonus').innerText(), /\d[\d\s]*\s*Kč/);
        await edit(page,{manualNight:'3'});
        assert.equal(await page.locator('#formError').isVisible(), false);
        assert.match(await page.locator('#cashBonus').innerText(), /Kč/);
      });
      await scenario(`${width}: no horizontal overflow`, async () => {
        assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
      });
      await page.locator('#sfShiftTab').click();
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:`${screenshots}/priplatky-${width}-full.png`,fullPage:true});
      await page.close();
    }
  } finally {await browser.close();}
  if (errors.length) {
    console.error(JSON.stringify({result:'FAIL', errors},null,2));
    process.exitCode=1;
  } else console.log('SHIFT CALCULATOR V8 BROWSER QA PASS');
})().catch(error=>{console.error(error);process.exitCode=1;});
