#!/usr/bin/env node
'use strict';
// Diagnostic ONLY. A public URL is not a valid preview until the actual
// candidate JS, styles, logos and interactions all work in a real browser.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const candidate = '9445a5a8f3c09a56d1a304a4d86fa027a17e6748';
const source = `https://github.com/fangren740/bmi-kalkulacka/blob/${candidate}/kalkulacka-priplatku-za-smeny.html`;
const url = `https://htmlpreview.github.io/?${source}`;
const out = '/tmp/rv-priplatky-v8'; fs.mkdirSync(out,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}});
    const errors=[]; const assets=[];
    page.on('pageerror',e=>errors.push('JS: '+e.message));
    page.on('response',r=>{
      const u=r.url();
      if(/priplatky-smeny|rv-brand-v32|logo-rv-v32/.test(u))assets.push({status:r.status(),url:u});
    });
    console.log('REMOTE_PREVIEW_URL',url);
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    console.log('REMOTE_STATUS',response?.status(),'URL',page.url());
    await page.waitForTimeout(6000);
    console.log('REMOTE_TITLE',await page.title());
    console.log('REMOTE_ASSETS',JSON.stringify(assets));
    console.log('REMOTE_ERRORS',JSON.stringify(errors));
    await page.screenshot({path:`${out}/remote-preview-diagnostic.png`,fullPage:true});
    assert.equal(await page.locator('#cashBonus').count(),1,'Preview did not render calculator HTML');
    assert.match(await page.locator('#cashBonus').innerText(),/Kč/,'Calculator JS did not run');
    assert.equal(await page.locator('header img.rv-logo-image').evaluate(i=>i.complete&&i.naturalWidth>0),true,'Header logo fails');
    assert.equal(await page.locator('footer img.rv-logo-image').evaluate(i=>i.complete&&i.naturalWidth>0),true,'Footer logo fails');
    const style=await page.locator('.sf-hero').evaluate(e=>getComputedStyle(e).backgroundImage);
    assert.notEqual(style,'none','Stylesheet not applied');
    await page.locator('#sfManualTab').click();
    for(const [id,v] of Object.entries({manualWorked:'4',manualNight:'6',manualWeekend:'3'})){
      await page.locator('#'+id).fill(v);await page.locator('#'+id).dispatchEvent('input');
    }
    assert.equal(await page.locator('#formError').isVisible(),true,'Candidate validation JS absent');
    assert.equal((await page.locator('#cashBonus').innerText()).trim(),'—','Stale candidate: source JS not loaded');
    assert.equal(errors.length,0,'Runtime errors');
    console.log('VERIFIED_REMOTE_INTERACTIVE_PREVIEW_PASS',url);
    await page.close();
  } finally {await browser.close();}
})().catch(e=>{console.error('REMOTE_PREVIEW_UNVERIFIED',e.message);process.exitCode=1;});
