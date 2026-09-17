#!/usr/bin/env node
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const out='/tmp/v8-rosny';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto('http://127.0.0.1:8765/rosny-bod-kalkulacka.html',{waitUntil:'networkidle'});
  assert.equal(response.status(),200);assert.deepEqual(errors,[],`Initial runtime error ${width}`);
  assert.match(await page.locator('#resultHeadline').innerText(),/13,9|14,0/);
  await page.locator('#air').fill('');
  assert.match(await page.locator('#resultHeadline').innerText(),/Zkontrolujte zadání/);
  assert.equal(await page.locator('#kpiDew').innerText(),'—');
  await page.locator('#air').fill('22');
  assert.match(await page.locator('#resultHeadline').innerText(),/13,9|14,0/);
  await page.locator('[data-mode=surface]').click();
  assert.equal(await page.locator('#surfaceField').isVisible(),true);
  assert.match(await page.locator('#kpiMargin').innerText(),/\+3,/);
  await page.locator('#surface').fill('10');
  assert.match(await page.locator('#resultHeadline').innerText(),/oblasti kondenzace/);
  await page.locator('#resetBtn').click();
  assert.equal(await page.locator('#surfaceField').isVisible(),false);
  assert.deepEqual(errors,[],`Scenario runtime error ${width}`);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'No mobile overflow');
  await page.screenshot({path:`${out}/rosny-${width}-full.png`,fullPage:true});
  console.log('PASS',width,'initial, blank input invalidation, recovery, surface condensation, reset, no JS errors and overflow');
  await page.close();
 }}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
