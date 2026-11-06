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
  for(const width of [320,390,768,1100,1440,1920]){
   const page=await browser.newPage({viewport:{width,height:900},locale:'cs-CZ',reducedMotion:'reduce'});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const response=await page.goto(base+'/superdavka-kalkulacka.html',{waitUntil:'networkidle',timeout:45000});
   assert.equal(response.status(),200);
   const firstInputTop=await page.locator('#basicRegion').evaluate(el=>el.getBoundingClientRect().top);
   if(width<=390||width===768)assert.ok(firstInputTop>0&&firstInputTop<900,
     'first mobile/tablet district select must be reachable in the initial 900px view, '+width+'px: '+firstInputTop);
   if(width===1440)assert.ok(firstInputTop>0&&firstInputTop<900,
     'first desktop district select should be in initial 900px view: '+firstInputTop);
   const contentQuality=await page.evaluate(()=>{
     const text=document.body.textContent.replace(/\\s+/g,' ').trim();
     return {words:text.split(/\\s+/).length,faq:document.querySelectorAll('#otazky details').length,
       scenarios:document.querySelectorAll('.sd88-story-grid article').length,
       officialLinks:document.querySelectorAll('.sd88-source-grid a[href^="https://"]').length};
   });
   assert.ok(contentQuality.words>=2800,'substantive editorial content must remain: '+contentQuality.words);
   assert.equal(contentQuality.faq,10,'FAQ must remain practical and structured');
   assert.equal(contentQuality.scenarios,3,'three independently described real-world scenarios');
   assert.equal(contentQuality.officialLinks,3,'methodology anchored in independent official evidence');
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
   if(width===390||width===1100||width===1440){
    await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,0);});
    await page.screenshot({path:path.join(out,'superdavka-oct-first-use-'+width+'.png'),fullPage:true,animations:'disabled'});
   }
   assert.equal(await page.locator('#basicRegion option').count(),78);
   assert.equal(await page.locator('#region option').count(),78);
   if(width<=768)assert.equal(await page.locator('#mobileSummary').isHidden(),true,'mobile shortcut must not invent a result before district');
   const before=await page.locator('#totalBenefit').innerText();
   assert.equal(before,'—','must NOT invent a zero result before district selection');
   assert.match(await page.locator('#resultExplanation').innerText(),/zvolte okres/i);
   for(const id of ['heroHousing','heroLiving','heroChild','heroWork']){
    assert.equal(await page.locator('#'+id).innerText(),'—','hero cannot invent a component before district selection');
   }
   for(const type of ['is-house','is-life','is-child','is-work']){
    assert.equal(await page.locator('.sd87-stack-lines .'+type+' i').evaluate(el=>el.style.getPropertyValue('--sd87-share')),'0%','hero chart starts empty');
   }
   await page.locator('[data-template="single"]').click();
   await page.locator('#basicRegion').selectOption('Praha');
   await page.locator('#basicHousingType').selectOption('rent');
   await page.locator('#basicWorkIncome').fill('20000');
   await page.locator('#basicOtherIncome').fill('0');
   await page.locator('#basicRent').fill('12000');
   await page.locator('#basicEnergy').fill('3000');
   const comparable=text=>text.replace(/[\u00a0\u202f]/g,' ');
   assert.equal(comparable(await page.locator('#totalBenefit').innerText()),'7 560 Kč','independently calculated one-person statutory scenario');
   if(width<=768){
    assert.equal(await page.locator('#mobileSummary').isVisible(),true,'mobile summary appears only after valid district and calculation');
    assert.equal(comparable(await page.locator('#mobileSummaryValue').innerText()),'7 560 Kč / měsíc','summary must equal actual total');
    const summaryPosition=await page.locator('#mobileSummary').evaluate(el=>getComputedStyle(el).position);
    assert.equal(summaryPosition,'sticky','mobile total must stay visible while editing long form');
    if(width===390){
     await page.evaluate(()=>{document.documentElement.style.scrollBehavior='auto';window.scrollTo(0,950)});
     const top=await page.locator('#mobileSummary').evaluate(el=>el.getBoundingClientRect().top);
     assert.ok(top>=60&&top<=95,'mobile shortcut should stick just under navigation: '+top);
     await page.screenshot({path:path.join(out,'superdavka-mobile-sticky-result-390.png'),animations:'disabled'});
     await page.locator('#mobileSummaryLink').click();
     assert.equal(await page.evaluate(()=>document.activeElement.id),'vysledek','result shortcut should take keyboard focus to the result');
    }
   }
   assert.equal(comparable(await page.locator('#heroHousing').innerText()),comparable(await page.locator('#housingComponent').innerText()),'desktop hero housing amount must equal the real result');
   assert.equal(comparable(await page.locator('#heroWork').innerText()),comparable(await page.locator('#workComponent').innerText()),'desktop hero work amount must equal the real result');
   const totalBars=await page.locator('.sd87-stack-lines i').evaluateAll(nodes=>nodes.reduce((a,n)=>a+parseFloat(n.style.getPropertyValue('--sd87-share')||'0'),0));
   assert.ok(Math.abs(totalBars-100)<0.3,'hero shares should sum to 100% of displayed components: '+totalBars);
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
   // Regression: editing members in advanced cannot silently change the visible basic preset.
   assert.equal(await page.locator('#memberList .sd87-member').count(),2);
   await page.locator('#addMember').click();
   assert.equal(await page.locator('#memberList .sd87-member').count(),3);
   await page.locator('#workIncome').fill('32123');
   await page.locator('#savings').fill('120000');
   await page.locator('#allPeople').fill('5');
   await page.locator('[data-mode="basic"]').click();
   assert.equal(await page.locator('#memberList .sd87-member').count(),2,'basic mode must use selected two-person preset');
   assert.equal(await page.locator('[data-template="couple"]').evaluate(el=>el.classList.contains('is-active')),true);
   await page.locator('[data-mode="advanced"]').click();
   assert.equal(await page.locator('#memberList .sd87-member').count(),3,'advanced edits must survive a round-trip through basic mode');
   assert.equal((await page.locator('#workIncome').inputValue()).replace(/\D/g,''),'32123','advanced income must survive tab switches');
   assert.equal((await page.locator('#savings').inputValue()).replace(/\D/g,''),'120000','advanced assets must survive tab switches');
   assert.equal(await page.locator('#allPeople').inputValue(),'5','advanced extra household count must survive tabs');
   // A failed savings eligibility test must not show positive "payable" parts next to a zero total.
   await page.locator('#savings').fill('500000');
   assert.equal(await page.locator('#totalBenefit').innerText(),'0 Kč','savings hard stop makes result zero');
   assert.equal(await page.locator('#housingComponent').innerText(),'—','no imaginary payable housing after hard stop');
   assert.equal(await page.locator('#heroHousing').innerText(),'—','hero also must not show blocked housing amount');
   assert.equal(await page.locator('#housingBar').evaluate(el=>el.style.width),'0%','blocked component bar must disappear');
   await page.locator('#savings').fill('120000');
   await page.locator('[data-mode="basic"]').click();
   assert.equal(await page.locator('#memberList .sd87-member').count(),2);
   await page.locator('#basicWorkIncome').fill('30000');
   await page.locator('[data-mode="advanced"]').click();
   assert.equal((await page.locator('#workIncome').inputValue()).replace(/\D/g,''),'30000','a changed basic income should update advanced, not lose recent edits');
   assert.equal((await page.locator('#savings').inputValue()).replace(/\D/g,''),'120000','basic input changes must not erase advanced assets');
   assert.equal(await page.locator('#allPeople').inputValue(),'5','basic input change must preserve advanced persons beyond explicit list');
   await page.locator('[data-mode="basic"]').click();
   // Selecting a different basic preset intentionally replaces the advanced structure.
   await page.locator('[data-template="single"]').click();
   await page.locator('[data-mode="advanced"]').click();
   assert.equal(await page.locator('#memberList .sd87-member').count(),1,'new preset must clear old saved advanced structure');
   await page.locator('[data-mode="basic"]').click();
   await page.locator('[data-template="couple"]').click();
   await page.locator('#basicWorkIncome').fill('neplatné');
   assert.equal(await page.locator('#totalBenefit').innerText(),'—','invalid text must not become zero');
   if(width<=768)assert.equal(await page.locator('#mobileSummary').isHidden(),true,'invalid calculations must hide misleading mobile summary');
   assert.equal(await page.locator('#heroHousing').innerText(),'—','invalid input clears misleading hero amounts');
   assert.equal(await page.locator('.sd87-stack-lines .is-house i').evaluate(el=>el.style.getPropertyValue('--sd87-share')),'0%','invalid input clears hero chart');
   for(const id of ['lifeMinimum','incomeRatio','recognisedHousing','assetLimit']){
    assert.equal(await page.locator('#'+id).innerText(),'—','invalid entry must clear stale '+id);
   }
   for(const id of ['housingBar','livingBar','childBar','workBar']){
    assert.equal(await page.locator('#'+id).evaluate(el=>el.style.width),'0%','invalid entry must clear stale '+id);
   }
   assert.equal(await page.locator('#basicWorkIncome').getAttribute('aria-invalid'),'true');
   await page.locator('button[type="submit"]').click();
   assert.equal(await page.evaluate(()=>document.activeElement.id),'basicWorkIncome','submit should focus the first invalid input');
   await page.locator('#basicWorkIncome').fill('20000');
   assert.match(await page.locator('#totalBenefit').innerText(),/Kč/);
   await page.locator('button[type="submit"]').click();
   if(width<=768){
    assert.equal(await page.evaluate(()=>document.activeElement.id),'vysledek','mobile submit must focus the result');
    const resultTop=await page.locator('#vysledek').evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(resultTop>=50&&resultTop<=240,'mobile submit must reveal the result near header, width '+width+': '+resultTop);
   }
   if(width===1440){
    const sticky=await page.locator('#vysledek').evaluate(el=>getComputedStyle(el).position);
    assert.equal(sticky,'sticky','long-form desktop result must stay visible alongside its inputs');
   }
   // A reset of the model must not silently discard the district chosen by the user.
   await page.locator('#resetBtn').click();
   assert.equal(await page.locator('#basicRegion').inputValue(),'Praha-východ');
   assert.match(await page.locator('#totalBenefit').innerText(),/Kč/);
   const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
   assert.ok(overflow<=2,'horizontal overflow at '+width+': '+overflow);
   assert.deepEqual(errors,[],'browser JavaScript errors '+width);
   if(width===390||width===1100||width===1440){
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
