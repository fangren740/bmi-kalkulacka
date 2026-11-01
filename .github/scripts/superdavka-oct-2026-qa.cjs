'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require('playwright');
const base=process.env.RV_TARGET_BASE||'http://127.0.0.1:8765';
const out=process.env.RV_QA_OUTPUT||'/tmp/rv-superdavka-oct';
fs.mkdirSync(out,{recursive:true});
const results=[];
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:900},locale:'cs-CZ',reducedMotion:'reduce'});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto(base+'/superdavka-kalkulacka.html',{waitUntil:'networkidle',timeout:45000});
   assert.equal(response.status(),200);
   const data=await page.evaluate(()=>window.__RV_SUPERDAVKA_OCT26__);
   assert.equal(data.periodFrom,'2026-10-01');
   assert.equal(data.periodTo,'2026-12-31');
   assert.equal(data.names.length,77);
   assert.equal(Object.keys(data.districts).length,77);
   assert.deepEqual(Array.from(data.districts['Praha'].standard),[13380,16190,18570,19710,19820]);
   assert.deepEqual(Array.from(data.districts['Praha'].vulnerable),[16810,19770,22794,24370,24880]);
   assert.deepEqual(Array.from(data.districts['Praha-východ'].standard),[11547,14440,15320,18110,18110]);
   assert.deepEqual(Array.from(data.districts['Bruntál'].vulnerable),[8575,10270,11730,12170,13614]);
   for(const item of Object.values(data.districts)){
    assert.equal(item.standard.length,5);
    assert.equal(item.vulnerable.length,5);
    for(const amount of [...item.standard,...item.vulnerable])assert.ok(Number.isSafeInteger(amount)&&amount>0);
   }
   if(width===390||width===1440){
    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});
    await page.screenshot({path:path.join(out,'superdavka-oct-first-use-'+width+'.png'),fullPage:true,animations:'disabled'});
   }
   assert.equal(await page.locator('#basicRegion option').count(),78);
   assert.equal(await page.locator('#region option').count(),78);
   const before=await page.locator('#totalBenefit').innerText();
   assert.equal(before,'—','must NOT invent a zero result before district selection');
   assert.match(await page.locator('#resultExplanation').innerText(),/zvolte okres/i);
   await page.locator('[data-template="single"]').click();
   await page.locator('#basicRegion').selectOption('Praha');
   await page.locator('#basicHousingType').selectOption('rent');
   await page.locator('#basicWorkIncome').fill('20000');
   await page.locator('#basicOtherIncome').fill('0');
   await page.locator('#basicRent').fill('12000');
   await page.locator('#basicEnergy').fill('3000');
   const comparable=text=>text.replace(/[\u00a0\u202f]/g,' ');
   assert.equal(comparable(await page.locator('#totalBenefit').innerText()),'7 560 Kč','independently calculated one-person statutory scenario');
   // Same inputs in cheaper district must change housing component.
   await page.locator('#basicRegion').selectOption('Bruntál');
   const bruntal=await page.locator('#totalBenefit').innerText();
   assert.notEqual(comparable(bruntal),'7 560 Kč');
   // Solo parent with child under 15 qualifies as vulnerable adult.
   await page.locator('[data-template="singleChild"]').click();
   const parentVulnerable=await page.evaluate(()=>window.__RV_SD87__.templates.singleChild[0].vulnerable);
   assert.equal(parentVulnerable,true);
   await page.locator('#basicRegion').selectOption('Praha-východ');
   await page.locator('#basicWorkIncome').fill('15000');
   await page.locator('#basicRent').fill('15000');
   const parentResult=await page.locator('#totalBenefit').innerText();
   assert.equal(comparable(parentResult),'19 936 Kč','single-parent vulnerable-norm independent reference');
   await page.locator('[data-template="couple"]').click();
   await page.locator('#basicRegion').selectOption('Praha');
   await page.locator('#basicWorkIncome').fill('25000');
   await page.locator('#basicRent').fill('12000');
   assert.equal(comparable(await page.locator('#totalBenefit').innerText()),'8 850 Kč','two adults updated life minimum independent reference');
   await page.locator('#basicRegion').selectOption('Praha-východ');
   await page.locator('[data-mode="advanced"]').click();
   assert.equal(await page.locator('#region').inputValue(),'Praha-východ','district must survive mode switch');
   assert.equal(await page.locator('#sd87AdvancedPanel').isVisible(),true);
   await page.locator('[data-mode="basic"]').click();
   await page.locator('#basicWorkIncome').fill('neplatné');
   assert.equal(await page.locator('#totalBenefit').innerText(),'—','invalid text must not become zero');
   assert.equal(await page.locator('#basicWorkIncome').getAttribute('aria-invalid'),'true');
   await page.locator('#basicWorkIncome').fill('20000');
   assert.match(await page.locator('#totalBenefit').innerText(),/Kč/);
   const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
   assert.ok(overflow<=2,'horizontal overflow at '+width+': '+overflow);
   assert.deepEqual(errors,[],'browser JavaScript errors '+width);
   if(width===390||width===1440){
    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});
    await page.screenshot({path:path.join(out,'superdavka-oct-'+width+'.png'),fullPage:true,animations:'disabled'});
   }
   results.push({width,model:'October-Dec 2026',norms:77,referenceSingle:'7 560 Kč',bruntal,parentResult,overflow,jsErrors:errors.length,status:'PASS'});
   await page.close();
  }
 }finally{
  await browser.close();
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({results,status:'BROWSER_SCENARIOS_PASS_VISUAL_REVIEW_REQUIRED'},null,2));
 }
 console.log(JSON.stringify({status:'BROWSER_SCENARIOS_PASS_VISUAL_REVIEW_REQUIRED',results}));
})().catch(err=>{console.error(err.stack||err);process.exitCode=1});
