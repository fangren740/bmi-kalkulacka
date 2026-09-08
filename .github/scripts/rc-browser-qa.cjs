/* TEMP #74 Gold candidate browser QA. Revert before merge. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),output=process.env.RV_QA_OUTPUT||'/tmp/rv-rc-candidate';
const base=process.env.RV_TARGET_BASE||'http://127.0.0.1:8765';
const viewports=[{width:320,height:740},{width:390,height:844},{width:768,height:900},{width:1024,height:900},{width:1366,height:768},{width:1440,height:900}];
const norm=s=>String(s??'').replace(/[\u00a0\u202f]/g,' ');
const report={targetBase:base,sequence:74,measuredAt:new Date().toISOString(),rows:[],interactions:[],failures:[]};
fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true});const context=await browser.newContext({reducedMotion:'reduce',locale:'cs-CZ'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
try{
 await page.goto(base+'/cista-mzda-kalkulacka.html',{waitUntil:'networkidle',timeout:45000});
 for(const vp of viewports){await page.setViewportSize(vp);const m=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,clippedControls:[...document.querySelectorAll('input:not([type=hidden]),select,button')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').filter(e=>{const r=e.getBoundingClientRect();return r.left < -1 || r.right > innerWidth+1}).map(e=>e.id||e.textContent.trim().slice(0,40))}));const row={...vp,...m,errors:[...errors]};report.rows.push(row);if(row.overflow>1||row.clippedControls.length||row.errors.length)report.failures.push(row);const style=await page.addStyleTag({content:'* {content-visibility:visible !important;}'});await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:path.join(output,`74-${vp.width}x${vp.height}-full.png`),fullPage:true});await style.evaluate(e=>e.remove());}
 await page.setViewportSize({width:390,height:844});const gross=page.locator('#grossSalary'),net=page.locator('#netResult');
 assert.equal(norm(await net.textContent()),'35 600 Kč','PAY baseline');
 for(const [id,value] of [['PAY-I01','0'],['PAY-I02','-1'],['PAY-I03',''],['PAY-I04','abc'],['PAY-I05','100000001']]){await gross.fill('45000');assert.equal(norm(await net.textContent()),'35 600 Kč',id+' valid setup');await gross.fill(value);assert.equal(await page.locator('body').getAttribute('data-result-state'),'invalid',id+' invalid state');for(const sel of ['#netResult','#heroNet','#flowNet','#scenarioBase'])assert.equal(await page.locator(sel).textContent(),'—',id+' clears '+sel);assert.equal(await gross.getAttribute('aria-invalid'),'true',id+' aria-invalid');}
 await page.screenshot({path:path.join(output,'74-390x844-invalid.png'),fullPage:false});
 await gross.fill('45000');assert.equal(await page.locator('body').getAttribute('data-result-state'),'valid','correction valid');assert.equal(norm(await net.textContent()),'35 600 Kč','correction result');
 await gross.fill('45000,49');const liveNet=norm(await net.textContent());await gross.blur();const blurValue=norm(await gross.inputValue()),blurNet=norm(await net.textContent());await gross.press('Enter');const submitValue=norm(await gross.inputValue()),submitNet=norm(await net.textContent());assert.equal(liveNet,'35 583 Kč','PAY-S01 live');assert.equal(blurNet,liveNet,'PAY-S01 blur');assert.equal(submitNet,liveNet,'PAY-S01 submit');assert.equal(blurValue,'45 000,49','PAY-S01 blur value');assert.equal(submitValue,'45 000,49','PAY-S01 submit value');await page.screenshot({path:path.join(output,'74-390x844-decimal.png'),fullPage:false});
 await gross.fill('45000,499');assert.equal(await page.locator('body').getAttribute('data-result-state'),'invalid','>2 decimals rejected');
 await page.locator('[data-mode="advanced"]').click();await gross.fill('22000,49');await page.locator('#healthMinimum').check();assert.equal(await page.locator('body').getAttribute('data-result-state'),'unavailable','fractional health minimum unavailable');
 await page.locator('#resetButton').click();assert.equal(await page.locator('body').getAttribute('data-result-state'),'valid','reset valid');assert.equal(norm(await net.textContent()),'35 600 Kč','reset result');assert(await page.locator('#advancedPanel').isHidden(),'reset basic');
 await gross.fill('50000');await gross.press('Enter');assert.equal(await page.locator('body').getAttribute('data-result-state'),'valid','Enter valid');
 assert.equal(await page.locator('label[for="grossSalary"]').count(),1,'gross label');await page.locator('.salary74-actions .salary74-btn--main').click();await page.waitForTimeout(350);assert(await gross.evaluate(e=>document.activeElement===e),'first-use CTA focus');
 report.interactions.push({status:'PASS',checks:['PAY-I01–PAY-I05','PAY-S01','valid→invalid→correction','precision rejection','unavailable boundary','reset','Enter','label','first-use focus']});
}catch(e){report.failures.push({error:e.stack||e.message});}finally{await page.close();await context.close();await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));if(report.failures.length)process.exitCode=1;}})();
