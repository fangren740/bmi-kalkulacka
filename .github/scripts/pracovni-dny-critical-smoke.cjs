'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const base=process.env.RV_TARGET_BASE||'http://127.0.0.1:8765',out=process.env.RV_QA_OUTPUT||'/tmp/rv-workdays-fix';
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});const report=[];
 try{
  for(const width of [320,390,768,1440]){
   const p=await browser.newPage({viewport:{width,height:900},locale:'cs-CZ',reducedMotion:'reduce'});
   const errors=[];p.on('pageerror',x=>errors.push(x.message));
   let response=await p.goto(base+'/pracovni-dny-kalkulacka.html',{waitUntil:'networkidle',timeout:30000});
   assert.equal(response.status(),200);
   assert.equal(await p.locator('#formError').isVisible(),false);
   assert.ok(await p.locator('.site-header img').evaluate(el=>el.complete&&el.naturalWidth>0),'brand logo');
   if(width===390||width===1440){await p.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:path.join(out,'pracovni-CANDIDATE-'+width+'.png'),fullPage:true,animations:'disabled'});}
   await p.locator('#modeAdd').click();
   await p.locator('#anchorDate').fill('2026-12-23');
   await p.locator('#workdayAmount').fill('1');
   assert.match(await p.locator('#resultDate').innerText(),/28\.\s*prosince\s*2026/,'skip Christmas and weekend');
   await p.locator('#countAnchor').check();
   assert.match(await p.locator('#resultDate').innerText(),/23\.\s*prosince\s*2026/,'include anchor if working');
   await p.locator('#workdayAmount').fill('0');
   assert.equal((await p.locator('#metricCalendar').innerText()).trim(),'0','zero-day shift must not count hours/days');
   await p.locator('#workdayAmount').fill('');
   assert.equal(await p.locator('#formError').isVisible(),true,'blank not automatically zero');
   assert.equal((await p.locator('#primaryValue').innerText()).trim(),'—');
   assert.equal((await p.locator('#metricCalendar').innerText()).trim(),'—','no stale result');
   assert.equal(await p.locator('#workdayAmount').getAttribute('aria-invalid'),'true');
   await p.locator('#workdayAmount').fill('1.5');
   assert.equal(await p.locator('#formError').isVisible(),true,'fraction must not truncate silently');
   await p.locator('#workdayAmount').fill('1');
   await p.locator('#settings summary').click();
   await p.locator('#hoursPerDay').fill('');
   assert.equal(await p.locator('#formError').isVisible(),true,'blank hours not silently 8');
   await p.locator('#hoursPerDay').fill('8');
   for(const weekday of [1,2,3,4,5])await p.locator('#weekdaySelector button[data-day="'+weekday+'"]').click({timeout:5000});
   assert.equal(await p.locator('#formError').isVisible(),true,'no days must explain missing working week');
   assert.match(await p.locator('#formError').innerText(),/alespoň jeden/);
   assert.equal((await p.locator('#primaryValue').innerText()).trim(),'—');
   assert.equal(await p.locator('#dayStrip').locator('.wd59-day').count(),0,'no stale timeline');
   assert.equal(await p.locator('#weekdaySelector button[aria-pressed="true"]').count(),0);
   if(width===390||width===1440){await p.evaluate(()=>{document.activeElement?.blur();window.scrollTo({top:0,behavior:'instant'})});await p.screenshot({path:path.join(out,'pracovni-CANDIDATE-error-'+width+'.png'),fullPage:true,animations:'disabled'});}
   await p.locator('#weekdaySelector button[data-day="1"]').click();
   assert.equal(await p.locator('#formError').isVisible(),false,'recovered after selecting one workday');
   await p.locator('#resetBtn').click();
   await p.locator('#modeYear').click();
   await p.locator('#yearInput').fill('');
   assert.equal(await p.locator('#formError').isVisible(),true,'blank year cannot silently fallback');
   await p.locator('#yearInput').fill('2026');
   assert.equal((await p.locator('#primaryValue').innerText()).trim(),'250','2026 standard workdays');
   await p.locator('#modeBetween').click();
   await p.locator('#startDate').fill('2026-12-23');
   await p.locator('#endDate').fill('2026-12-28');
   assert.equal((await p.locator('#primaryValue').innerText()).trim(),'2','Dec23–28 working days');
   await p.locator('#endDate').fill('2200-01-01');
   assert.equal(await p.locator('#formError').isVisible(),true,'excessively large ranges bounded');
   const overflow=await p.evaluate(()=>Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth);
   assert.ok(overflow<=2,'no horizontal scroll '+width+' overflow '+overflow);
   assert.deepEqual(errors,[],'runtime errors '+width);
   report.push({width,status:'PASS',standard2026:250,christmasShift:'2026-12-28',noWorkdays:'error instead of freeze',blankInput:'rejected',invalidYear:'rejected',overflow,errors:errors.length});
   await p.close();
  }
  for(const width of [390,1440]){
   const p=await browser.newPage({viewport:{width,height:900},locale:'cs-CZ',reducedMotion:'reduce'});
   try{const r=await p.goto('https://rychlevypocty.cz/pracovni-dny-kalkulacka.html',{waitUntil:'domcontentloaded',timeout:24000});await p.screenshot({path:path.join(out,'pracovni-LIVE-'+width+'.png'),fullPage:true,animations:'disabled'});report.push({liveWidth:width,http:r.status()})}
   catch(e){report.push({liveWidth:width,unavailable:e.message.slice(0,160)})}
   finally{await p.close()}
  }
 }finally{await browser.close();fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({report},null,2))}
 console.log(JSON.stringify({status:'PASS_PENDING_VISUAL_REVIEW',report}));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
