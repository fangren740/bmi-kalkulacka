'use strict';
const { chromium }=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const out=process.env.RV_QA_OUTPUT||'/tmp/rv-name-days-v8';
const base=process.env.RV_TARGET_BASE||'http://127.0.0.1:8765';
fs.mkdirSync(out,{recursive:true});
const reports=[];
const normalize=s=>s.replace(/[\u00a0\u202f]/g,' ');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const width of [320,390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:900},locale:'cs-CZ',reducedMotion:'reduce',acceptDownloads:true});
   const jsErrors=[], badAssets=[];
   page.on('pageerror',e=>jsErrors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&/kalendar-jmen|logo-rv|rv-brand|rv-vnext/.test(r.url()))badAssets.push(r.status()+' '+r.url())});
   const response=await page.goto(base+'/kalendar-jmen.html',{waitUntil:'networkidle',timeout:45000});
   assert.equal(response.status(),200);
   assert.equal(await page.locator('h1').count(),1);
   assert.equal(await page.locator('#nameForm').count(),1);
   assert.equal(await page.locator('#nameSearch').isVisible(),true);
   const inputTop=await page.locator('#nameSearch').evaluate(el=>el.getBoundingClientRect().top);
   if(width<=390)assert.ok(inputTop>0&&inputTop<650,'search field must appear quickly '+width+' '+inputTop);
   assert.equal(await page.locator('#yearMap .name65-month').count(),12);
   assert.equal(await page.locator('#calendarYear').inputValue(),String(new Date().getFullYear()));
   const assets=await page.locator('.site-header .brand img').evaluate(img=>({ok:img.complete&&img.naturalWidth>0,width:img.naturalWidth}));
   assert.ok(assets.ok,'logo must actually load');
   assert.notEqual((await page.locator('#heroNames').innerText()).trim(),'—','today has result');
   assert.equal(await page.locator('[data-month-jump]').count(),12);
   if([390,1440].includes(width)){
    await page.evaluate(()=>window.scrollTo(0,0));
    await page.screenshot({path:path.join(out,'JMENA-CANDIDATE-first-'+width+'.png'),fullPage:true,animations:'disabled'});
   }
   await page.locator('#nameSearch').fill('tereza');
   assert.equal(await page.locator('#suggestions button').count()>0,true);
   await page.locator('#suggestions button').first().click();
   assert.match(await page.locator('#resultTitle').innerText(),/Tereza/i);
   assert.match(await page.locator('#resultDate').innerText(),/15\. října/);
   assert.equal(await page.locator('#dateSearch').inputValue().then(v=>v.slice(5)),'10-15');
   await page.locator('#nameSearch').fill('Qwertzxxy');
   assert.equal(await page.locator('#nameFeedback').isVisible(),true,'local no-match warning');
   await page.locator('#nameSearch').fill('');
   assert.equal(await page.locator('#nameFeedback').isVisible(),false);
   await page.locator('[data-quick-name="Petr"]').click();
   assert.match(await page.locator('#resultTitle').innerText(),/Petr/i);
   assert.equal(await page.locator('#multiDates button').count(),2,'Petr has two namedays');
   await page.locator('#multiDates button').nth(1).click();
   assert.match(await page.locator('#resultDate').innerText(),/29\. června/);
   assert.match(page.url(),/jmeno=Petr&datum=06-29/,'shared link must retain alternate nameday');
   await page.reload({waitUntil:'networkidle'});
   assert.match(await page.locator('#resultDate').innerText(),/29\. června/,'alternate date persists across reload');
   const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#downloadIcs').click()]);
   const saved=path.join(out,'petr-'+width+'.ics');await download.saveAs(saved);
   const ics=fs.readFileSync(saved,'utf8');
   assert.match(ics,/BEGIN:VCALENDAR\r\n/);
   assert.match(ics,/RRULE:FREQ=YEARLY\r\n/);
   assert.match(ics,/TRIGGER:-P1D\r\n/);
   await page.locator('#saveName').click();
   assert.match(await page.locator('#savedNames').innerText(),/Petr/);
   await page.reload({waitUntil:'networkidle'});
   assert.match(await page.locator('#savedNames').innerText(),/Petr/,'saved name persists locally');
   await page.goto(base+'/kalendar-jmen.html?datum=02-29',{waitUntil:'networkidle'});
   assert.match(await page.locator('#resultDate').innerText(),/29\. února 2028/,'Feb29 resolves next valid leap year');
   await page.goto(base+'/kalendar-jmen.html?datum=02-30',{waitUntil:'networkidle'});
   assert.ok(!Number.isNaN(Date.parse(await page.locator('#dateSearch').inputValue())),'bad day must not become nonexistent date');
   await page.locator('[data-month-jump="2"]').click();
   const feb=page.locator('#mesic-02');
   assert.equal(await feb.getAttribute('id'),'mesic-02');
   assert.equal(await feb.locator('.name65-month-toggle').getAttribute('aria-expanded'),'true');
   assert.equal(await page.locator('#yearMap .name65-month').count(),12);
   const overflow=await page.evaluate(()=>Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)-innerWidth);
   assert.ok(overflow<=2,'horizontal overflow '+width+' '+overflow);
   assert.deepEqual(jsErrors,[],'JS errors '+width);
   assert.deepEqual(badAssets,[],'missing assets '+width);
   if([390,1440].includes(width)){
    await page.goto(base+'/kalendar-jmen.html?jmeno=Petr&datum=06-29',{waitUntil:'networkidle'});
    await page.screenshot({path:path.join(out,'JMENA-CANDIDATE-Petr-'+width+'.png'),fullPage:true,animations:'disabled'});
   }
   reports.push({width,status:'PASS',inputTop:Math.round(inputTop),months:12,leapYear:'2028-02-29',doubleName:'Petr',ics:true,overflow,logo:'ok',jsErrors:jsErrors.length});
   await page.close();
  }
  const nojs=await browser.newPage({javaScriptEnabled:false});
  await nojs.goto(base+'/kalendar-jmen.html',{waitUntil:'domcontentloaded'});
  assert.equal(await nojs.locator('#yearMap .name65-fallback-days li').count(),366,'366 namedays in static HTML without JS');
  assert.match(await nojs.locator('#mesic-11').innerText(),/Martin/);
  assert.match(await nojs.locator('#mesic-02').innerText(),/Horymír/);
  assert.equal(await nojs.locator('#yearMap .name65-month').count(),12);
  reports.push({noJavaScriptStaticEntries:366,status:'PASS'});
  await nojs.close();
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({status:'PASS_REVIEW_SCREENSHOTS',reports},null,2));
 console.log(JSON.stringify({status:'PASS_REVIEW_SCREENSHOTS',reports}));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
