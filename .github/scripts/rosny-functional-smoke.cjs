'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.RV_TARGET_BASE || 'http://127.0.0.1:8765';
const out = process.env.RV_QA_OUTPUT || '/tmp/rv-rosny-fix';
fs.mkdirSync(out,{recursive:true});
const summary = [];

async function captureLive(browser,width) {
  const p = await browser.newPage({viewport:{width,height:900},locale:'cs-CZ',reducedMotion:'reduce'});
  const errs=[];
  p.on('pageerror',e=>errs.push(e.message));
  try {
    const res=await p.goto('https://rychlevypocty.cz/rosny-bod-kalkulacka.html',{waitUntil:'domcontentloaded',timeout:25000});
    await p.waitForTimeout(250);
    await p.evaluate(()=>window.scrollTo(0,0));
    await p.screenshot({path:path.join(out,'rosny-LIVE-'+width+'.png'),fullPage:true,animations:'disabled'});
    return {http:res?.status(),errors:errs.slice(0,4)};
  }catch(e){return {notAvailable:e.message};}
  finally{await p.close();}
}

(async()=>{
  const b=await chromium.launch({headless:true});
  try{
   for(const width of [320,390,768,1440]){
     const p=await b.newPage({viewport:{width,height:900},locale:'cs-CZ',reducedMotion:'reduce'});
     const errors=[];
     p.on('pageerror',e=>errors.push(e.message));
     const response=await p.goto(base+'/rosny-bod-kalkulacka.html',{waitUntil:'networkidle',timeout:45000});
     assert.equal(response.status(),200);
     assert.equal(await p.locator('#heroDot').count(),0,'legacy missing decorative element should not be necessary');
     assert.match((await p.locator('#kpiDew').innerText()).replace(/\s/g,' '),/13,9\s*°C/,'initial dewpoint should compute');
     assert.match(await p.locator('#status').innerText(),/přepočítán/);
     assert.equal(await p.locator('#inputFeedback').isVisible(),false,'no initial warning');
     assert.equal(await p.locator('[data-mode="dew"]').getAttribute('aria-pressed'),'true');
     const numeric=await p.evaluate(()=>{
       const core=window.RVDewPointCore;
       return [core.calculate({airTempC:20,rhPct:50}),core.calculate({airTempC:20,rhPct:100})];
     });
     assert.ok(Math.abs(numeric[0].dewPointC-9.261)<0.02,'20C 50% benchmark');
     assert.ok(Math.abs(numeric[1].dewPointC-20)<1e-7,'at 100% RH dewpoint = air temperature');
     if([390,1440].includes(width)){
       await p.evaluate(()=>window.scrollTo(0,0));
       await p.screenshot({path:path.join(out,'rosny-CANDIDATE-'+width+'.png'),fullPage:true,animations:'disabled'});
     }
     await p.locator('[data-mode="surface"]').click();
     assert.equal(await p.locator('[data-mode="surface"]').getAttribute('aria-pressed'),'true');
     assert.equal(await p.locator('#surfaceField').isVisible(),true);
     assert.match((await p.locator('#kpiMargin').innerText()).replace(/\s/g,' '),/\+3,1\s*°C/);
     await p.locator('#surface').fill('10');
     assert.match(await p.locator('#resultHeadline').innerText(),/kondenzace/i);
     assert.match((await p.locator('#kpiMargin').innerText()).replace(/\s/g,' '),/-3,9\s*°C/);
     await p.locator('#surface').fill('');
     assert.equal(await p.locator('#inputFeedback').isVisible(),true,'invalid surface should be visibly explained');
     assert.equal(await p.locator('#surface').getAttribute('aria-invalid'),'true');
     assert.equal((await p.locator('#kpiDew').innerText()).trim(),'—');
     assert.equal((await p.locator('#heroDew').innerText()).trim(),'—','no stale hero');
     await p.locator('#surface').fill('17');
     assert.equal(await p.locator('#inputFeedback').isVisible(),false,'valid surface restores result');
     assert.notEqual((await p.locator('#heroDew').innerText()).trim(),'—');
     await p.locator('[data-mode="dew"]').click();
     await p.locator('#air').fill('');
     assert.equal(await p.locator('#inputFeedback').isVisible(),true,'blank temperature not treated as 0');
     assert.equal(await p.locator('#air').getAttribute('aria-invalid'),'true');
     assert.equal((await p.locator('#heroDew').innerText()).trim(),'—');
     await p.locator('#air').fill('20');
     await p.locator('#rh').fill('50');
     assert.match((await p.locator('#kpiDew').innerText()).replace(/\s/g,' '),/9,3\s*°C/);
     assert.equal(await p.locator('#air').getAttribute('aria-invalid'),'false');
     await p.locator('#rh').fill('');
     assert.equal(await p.locator('#inputFeedback').isVisible(),true,'blank humidity invalid');
     await p.locator('#resetBtn').click();
     assert.equal(await p.locator('#air').inputValue(),'22');
     assert.equal(await p.locator('#rh').inputValue(),'60');
     assert.equal(await p.locator('#inputFeedback').isVisible(),false);
     await p.locator('#rhRange').fill('70');
     assert.equal(await p.locator('#rh').inputValue(),'70');
     const overflow=await p.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
     assert.ok(overflow<=2,'horizontal overflow '+width+': '+overflow);
     assert.deepEqual(errors,[],'JS runtime errors '+width);
     if([390,1440].includes(width)){
       await p.evaluate(()=>window.scrollTo(0,0));
       await p.screenshot({path:path.join(out,'rosny-CANDIDATE-SURFACE-'+width+'.png'),fullPage:true,animations:'disabled'});
     }
     summary.push({width,http:200,independentPhysicsBenchmarks:2,errorClearing:true,surfaceMode:true,overflow,jsErrors:errors});
     await p.close();
   }
   for(const width of [390,1440]){
     const live=await captureLive(b,width);
     summary.push({width,baselineLive:live});
   }
  }finally {
    await b.close();
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({status:'PASS_REQUIRES_VISUAL_REVIEW',summary},null,2));
  }
  console.log(JSON.stringify({status:'PASS_REQUIRES_VISUAL_REVIEW',summary}));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
