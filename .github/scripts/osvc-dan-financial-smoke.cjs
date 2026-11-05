'use strict';
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const base=process.env.RV_TARGET_BASE||'http://127.0.0.1:8765',out=process.env.RV_QA_OUTPUT||'/tmp/rv-osvc-financial';
fs.mkdirSync(out,{recursive:true});
const norm=s=>s.replace(/[\u00a0\u202f]/g,' ');
(async()=>{
 const browser=await chromium.launch({headless:true});
 const report=[];
 try{
  for(const width of [320,390,768,1440]){
   const p=await browser.newPage({viewport:{width,height:900},locale:'cs-CZ',reducedMotion:'reduce'});
   const errors=[];p.on('pageerror',e=>errors.push(e.message));
   const r=await p.goto(base+'/osvc-danova-kalkulacka.html',{waitUntil:'networkidle',timeout:40000});
   assert.equal(r.status(),200);
   assert.equal(await p.locator('#taxFormError').isVisible(),false);
   assert.equal(norm(await p.locator('#totalDuties').innerText()),'157 912 Kč','unchanged 2026 reference');
   assert.equal(await p.locator('#revenue').isVisible(),true);
   const inputTop=await p.locator('#revenue').evaluate(el=>el.getBoundingClientRect().top);
   if(width<=390)assert.ok(inputTop>0&&inputTop<800,'mobile input must appear early '+width+' '+inputTop);
   if(width<=390)assert.equal(await p.locator('.tx-statement').isVisible(),false,'decorative statement not displace mobile form');
   if(width<=390){const gap=await p.evaluate(()=>{const badge=document.querySelector('.tx-year-note .tx-year-badge').getBoundingClientRect(),para=document.querySelector('.tx-year-note p').getBoundingClientRect();return para.top-badge.bottom});assert.ok(gap>=4,'year badge must not overlap warning text at '+width+': gap '+gap)}
   if(width===390||width===1440){
    await p.evaluate(()=>window.scrollTo(0,0));
    await p.screenshot({path:path.join(out,'OSVC-CANDIDATE-initial-'+width+'.png'),fullPage:true,animations:'disabled'});
   }
   await p.locator('#revenue').fill('');
   assert.equal(await p.locator('#taxFormError').isVisible(),true,'empty revenue not zero');
   assert.equal(norm(await p.locator('#totalDuties').innerText()),'—','invalid total hidden');
   assert.equal(norm(await p.locator('#heroTotal').innerText()),'—','invalid headline hidden');
   assert.equal(await p.locator('#revenue').getAttribute('aria-invalid'),'true');
   await p.locator('#revenue').fill('0');
   assert.equal(await p.locator('#taxFormError').isVisible(),false,'valid zero revenue recovers');
   assert.equal(norm(await p.locator('#totalDuties').innerText()),'99 720 Kč','zero revenue full-year minima reference');
   assert.equal(norm(await p.locator('#afterDuties').innerText()),'−99 720 Kč','negative balance must not be reported as 0');
   assert.equal(norm(await p.locator('#heroAfter').innerText()),'−99 720 Kč','negative hero must be visible');
   if(width===390||width===1440){
    await p.evaluate(()=>window.scrollTo(0,0));
    await p.screenshot({path:path.join(out,'OSVC-CANDIDATE-negative-'+width+'.png'),fullPage:true,animations:'disabled'});
   }
   await p.locator('#revenue').fill('1000000');
   await p.locator('.tx-details summary').click();
   await p.locator('#cashCosts').fill('950000');
   assert.equal(norm(await p.locator('#afterCash').innerText()),'−83 064 Kč','net negative cash position scenario');
   assert.equal(norm(await p.locator('#socialResult').innerText()),'64 240 Kč','exact-integer pension payment must not ceil floating noise to 64 241');
   assert.equal(await p.locator('#afterCash').evaluate(el=>el.classList.contains('is-negative')),true);
   await p.locator('#expenseMode').selectOption('actual');
   await p.locator('#actualTaxExpenses').fill('1000001');
   assert.equal(await p.locator('#taxFormError').isVisible(),true,'tax loss requires truthful limitation');
   assert.match(await p.locator('#taxFormError').innerText(),/daňovou ztrátu/i);
   assert.equal(norm(await p.locator('#totalDuties').innerText()),'—');
   await p.locator('#actualTaxExpenses').fill('300000');
   assert.equal(await p.locator('#taxFormError').isVisible(),false);
   await p.locator('#activeMonths').fill('1.5');
   assert.equal(await p.locator('#taxFormError').isVisible(),true,'fractional months rejected');
   await p.locator('#activeMonths').fill('12');
   assert.equal(await p.locator('#taxFormError').isVisible(),false);
   await p.locator('#paidTax').fill('');
   assert.equal(await p.locator('#settlementError').isVisible(),true,'empty settlement must not silently become zero');
   assert.equal(norm(await p.locator('#settleTax').innerText()),'—');
   assert.notEqual(norm(await p.locator('#totalDuties').innerText()),'—','settlement invalid cannot invalidate correct annual tax');
   await p.locator('#paidTax').fill('0');
   assert.equal(await p.locator('#settlementError').isVisible(),false);
   await p.locator('#resetButton').click();
   assert.equal(norm(await p.locator('#totalDuties').innerText()),'157 912 Kč','reset default reference');
   await p.locator('#activity').selectOption('side');
   assert.equal(await p.locator('#healthMinimum').isChecked(),false,'switch to side must disable minimum by default');
   await p.locator('#revenue').fill('0');
   assert.equal(norm(await p.locator('#totalDuties').innerText()),'0 Kč','side below threshold no mandatory social and without minimum health 0');
   const overflow=await p.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth);
   assert.ok(overflow<=2,'no horizontal overflow '+width+' '+overflow);
   assert.deepEqual(errors,[],'browser JS runtime errors '+width);
   report.push({width,result:'PASS',inputTop:Math.round(inputTop),baseline:'157 912 Kč',negativeNoRevenue:'−99 720 Kč',negativeCash:'−83 064 Kč',jsErrors:errors.length,overflow});
   await p.close();
  }
  for(const width of [390,1440]){
   const live=await browser.newPage({viewport:{width,height:900},locale:'cs-CZ',reducedMotion:'reduce'});
   try{const res=await live.goto('https://rychlevypocty.cz/osvc-danova-kalkulacka.html',{waitUntil:'domcontentloaded',timeout:20000});await live.screenshot({path:path.join(out,'OSVC-LIVE-initial-'+width+'.png'),fullPage:true,animations:'disabled'});report.push({liveWidth:width,status:res.status()});}
   catch(e){report.push({liveWidth:width,unavailable:e.message.slice(0,140)})}
   finally{await live.close()}
  }
 }finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({report},null,2));}
 console.log(JSON.stringify({status:'PASS_AWAITING_VISUAL_APPROVAL',report}));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
