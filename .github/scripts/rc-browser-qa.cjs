/* Candidate browser smoke and visual evidence. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),output=process.env.RV_QA_OUTPUT||'/tmp/rv-rc-browser';
const rc=JSON.parse(fs.readFileSync(path.join(root,'RV_VNEXT_PROGRESS.json'))).completedPages.filter(p=>p.status==='RELEASE_CANDIDATE');
const requested=(process.env.RV_SEQUENCES||'').split(',').filter(Boolean).map(Number);
const targetBase=process.env.RV_TARGET_BASE||'https://rychlevypocty.cz';
const report={targetBase,measuredAt:new Date().toISOString(),rows:[],interactions:[],resources:{},failures:[]};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const viewports=[{width:320,height:740},{width:390,height:844},{width:768,height:900},{width:1024,height:900},{width:1366,height:768},{width:1440,height:900}];
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{for(const item of rc.filter(p=>!requested.length||requested.includes(p.sequence))){
  const context=await browser.newContext({reducedMotion:'reduce',locale:'cs-CZ'});
  const page=await context.newPage(),errors=[],pending=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{
   const u=new URL(r.url());if(u.origin!==targetBase||!['document','script','stylesheet'].includes(r.request().resourceType()))return;
   pending.push((async()=>{try{const b=await r.body(),file=path.resolve(root,'.'+decodeURIComponent(u.pathname));const local=file.startsWith(root+path.sep)&&fs.existsSync(file)?hash(fs.readFileSync(file)):null;report.resources[r.url()]={status:r.status(),productionSha256:hash(b),repositorySha256:local,matchesRepository:local===hash(b)};}catch(e){report.resources[r.url()]={error:e.message};}})());
  });
  try{
   await page.goto(targetBase+'/'+item.file,{waitUntil:'networkidle',timeout:45000});
   for(const vp of viewports){
    await page.setViewportSize(vp);
    const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,clippedControls:[...document.querySelectorAll('input:not([type=hidden]),select,button')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').filter(e=>{const r=e.getBoundingClientRect();if(r.left>=-1&&r.right<=innerWidth+1)return false;for(let p=e.parentElement;p;p=p.parentElement){const b=p.getBoundingClientRect();if(['auto','scroll'].includes(getComputedStyle(p).overflowX)&&p.scrollWidth>p.clientWidth&&b.left>=-1&&b.right<=innerWidth+1)return false;}return true}).map(e=>e.id||e.textContent.slice(0,40))}));
    const row={sequence:item.sequence,file:item.file,...vp,...metrics,errors:[...errors]};report.rows.push(row);
    if(row.overflow>1||row.clippedControls.length||row.errors.length)report.failures.push(row);
    if([320,390,768,1024,1366,1440].includes(vp.width)){
     const style=await page.addStyleTag({content:'* {content-visibility:visible !important;}'});
     await page.evaluate(()=>window.scrollTo(0,0));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     await page.screenshot({path:path.join(output,`${item.sequence}-${vp.width}x${vp.height}-full.png`),fullPage:true});await style.evaluate(e=>e.remove());
    }
   }
   if(item.sequence===74){
    await page.setViewportSize({width:390,height:844});
    const gross=page.locator('#grossSalary'),net=page.locator('#netResult');
    assert.equal(await net.textContent(),'35 600 Kč','PAY baseline');
    await gross.fill('0');
    assert.equal(await page.locator('body').getAttribute('data-result-state'),'invalid','PAY-I01 invalid state');
    for(const sel of ['#netResult','#heroNet','#flowNet','#scenarioBase'])assert.equal(await page.locator(sel).textContent(),'—',`stale result cleared ${sel}`);
    assert.equal(await gross.getAttribute('aria-invalid'),'true','invalid aria');
    await gross.fill('45000');
    assert.equal(await page.locator('body').getAttribute('data-result-state'),'valid','correction valid');
    assert.equal(await net.textContent(),'35 600 Kč','corrected baseline');
    await gross.fill('45000,49');
    const liveNet=await net.textContent();
    await gross.blur();
    const blurValue=await gross.inputValue(),blurNet=await net.textContent();
    await gross.press('Enter');
    const submitValue=await gross.inputValue(),submitNet=await net.textContent();
    assert.equal(liveNet,blurNet,'PAY-S01 live vs blur');assert.equal(blurNet,submitNet,'PAY-S01 blur vs submit');
    assert.match(blurValue,/45[\s\u00a0\u202f]000,49/,'PAY-S01 blur canonical');assert.match(submitValue,/45[\s\u00a0\u202f]000,49/,'PAY-S01 submit canonical');
    await gross.fill('45000,499');
    assert.equal(await page.locator('body').getAttribute('data-result-state'),'invalid','precision >2 invalid');
    await page.locator('[data-mode="advanced"]').click();
    await gross.fill('22000,49');await page.locator('#healthMinimum').check();
    assert.equal(await page.locator('body').getAttribute('data-result-state'),'unavailable','fractional health minimum unavailable');
    await page.locator('#resetButton').click();
    assert.equal(await page.locator('body').getAttribute('data-result-state'),'valid','reset valid');assert.equal(await net.textContent(),'35 600 Kč','reset result');assert.equal(await page.locator('#advancedPanel').isHidden(),true,'reset basic hidden');
    await gross.fill('50000');await gross.press('Enter');assert.equal(await page.locator('body').getAttribute('data-result-state'),'valid','Enter submits valid scenario');
    assert.equal(await page.locator('label[for="grossSalary"]').count(),1,'gross label');
    await page.locator('.salary74-actions .salary74-btn--main').click();await page.waitForTimeout(300);assert.equal(await gross.evaluate(e=>document.activeElement===e),true,'first-use CTA focuses gross input');
    report.interactions.push({sequence:74,status:'PASS',checks:{baseline:true,invalidClearsAll:true,correction:true,payS01:{liveNet,blurNet,submitNet,blurValue,submitValue},precisionReject:true,healthFractionalUnavailable:true,reset:true,enter:true,label:true,firstUseFocus:true}});
   }
  }catch(e){report.failures.push({sequence:item.sequence,error:e.stack||e.message});}
  await Promise.allSettled(pending);await context.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({sequence:item.sequence,errors,failures:report.failures.filter(r=>r.sequence===item.sequence),interactions:report.interactions.filter(r=>r.sequence===item.sequence)}));
 }}finally{await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));}
 if(report.failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
