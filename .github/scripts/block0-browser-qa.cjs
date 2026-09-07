/* Reproducible regression runner for the block-0 changes; not a portfolio PASS. */
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const output = path.resolve(process.env.RV_QA_OUTPUT || '/tmp/rv-block0-qa');
const progress = JSON.parse(fs.readFileSync(path.join(root, 'RV_VNEXT_PROGRESS.json')));
const scope = progress.completedPages.filter(p => progress.recoveryClosure20260906.scopeSequences.includes(p.sequence) || [85,88,94].includes(p.sequence));
const widths = [320,360,390,768,1024,1120,1280,1366,1440];
const mime = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.json':'application/json','.csv':'text/csv','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const report = {rows:[], interactions:[], failures:[]};
fs.mkdirSync(output, {recursive:true});
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if (!file.startsWith(root+path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {res.writeHead(404);return res.end();}
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream'); fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true});
 try {
  for(const item of scope){
   const context=await browser.newContext({reducedMotion:'reduce'});
   // Absolute first-party asset URLs must read the candidate, not live main.
   await context.route('https://rychlevypocty.cz/**',async route=>{
    const u=new URL(route.request().url());await route.fulfill({response:await context.request.get(base+u.pathname+u.search)});
   });
   const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(base+'/'+item.file,{waitUntil:'networkidle'});
   for(const width of widths){
    await page.setViewportSize({width,height:900});
    const metrics=await page.evaluate(()=>{
     const visible=e=>!!e.getClientRects().length && getComputedStyle(e).visibility!=='hidden';
     const socials=[...document.querySelectorAll('footer a[href*="facebook.com/rychlevypocty"],footer a[href*="instagram.com/rychlevypocty"]')];
     return {overflow:document.documentElement.scrollWidth-innerWidth,socials:socials.map(e=>{const r=e.getBoundingClientRect();return {name:e.getAttribute('aria-label'),width:r.width,height:r.height,svg:!!e.querySelector('svg'),visible:visible(e)}}),clippedControls:[...document.querySelectorAll('input:not([type=hidden]),select,button')].filter(visible).filter(e=>{const r=e.getBoundingClientRect();return r.left< -1 || r.right>innerWidth+1}).map(e=>e.id||e.textContent.slice(0,40))};
    });
    const row={sequence:item.sequence,file:item.file,width,...metrics,errors:[...errors]}; report.rows.push(row);
    if(metrics.overflow>1||metrics.clippedControls.length||errors.length||metrics.socials.some(s=>!s.name||!s.svg))report.failures.push(row);
    // New common social controls have an explicit 44px touch contract.
    if(await page.locator('.rv-social-links').count())assert(metrics.socials.every(s=>s.width>=44&&s.height>=44),item.file+' social target');
    if([320,390,1440].includes(width)){
      // Materialize off-screen content before measuring screenshot bounds.
      // This only disables rendering deferral for captures, not layout styling.
      const captureStyle=await page.addStyleTag({content:'* { content-visibility: visible !important; }'});
      await page.locator('footer').scrollIntoViewIfNeeded();
      await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
      await page.locator('footer').screenshot({path:path.join(output,`${item.sequence}-${width}-footer.png`)});
      if([75,76,84,85,88,94].includes(item.sequence))await page.screenshot({path:path.join(output,`${item.sequence}-${width}-full.png`),fullPage:true});
      await captureStyle.evaluate(e=>e.remove());
    }
   }
   if(item.sequence===85){
    for(const width of [390,1440]){
     await page.setViewportSize({width,height:900});await page.reload({waitUntil:'networkidle'});
     const result=()=>page.locator('#takeHome').innerText();const initial=await result();
     await page.getByRole('button',{name:'Přesnější',exact:true}).click();assert.equal(await page.locator('#advancedPanel').isVisible(),true);assert.equal(await result(),initial);
     assert.equal(await page.locator('#tabAdvanced').getAttribute('aria-expanded'),'true');
     await page.locator('#spouseEligible').check();assert.notEqual(await result(),initial);
     await page.locator('#tabAdvanced').press('Home');assert.equal(await page.locator('#advancedPanel').isVisible(),false);assert.equal(await result(),initial);
     await page.locator('#tabBasic').press('Home');assert.equal(await page.locator('#advancedPanel').isVisible(),false);
     await page.locator('#tabBasic').press('End');await page.locator('#tabAdvanced').press('End');assert.equal(await page.locator('#advancedPanel').isVisible(),true);
     await page.locator('#reset').click();assert.equal(await result(),initial);assert.equal(await page.locator('#tabBasic').getAttribute('aria-pressed'),'true');
     await page.locator('#netWage').fill('0');assert.match(await result(),/^0\s*Kč$/);
     await page.locator('#netWage').fill('');assert.equal(await page.locator('#formError').isVisible(),true);
     await page.locator('#reset').click();await page.locator('#tabBasic').focus();await page.keyboard.press('Tab');assert.equal(await page.locator('#tabAdvanced').evaluate(e=>e===document.activeElement),true);
     await page.locator('#executionForm').screenshot({path:path.join(output,`85-${width}-interaction.png`)});
     report.interactions.push({file:item.file,width,status:'PASS',checks:'mode, spouse, Home/End, reset, zero, blank, Tab'});
    }
   }
   if(item.sequence===94){assert.equal(await page.getByRole('spinbutton',{name:'Maximální amortizace v Kč na kilometr',exact:true}).count(),1);report.interactions.push({file:item.file,status:'PASS',checks:'target input accessible name'});}
   await context.close();
  }
 } finally {await browser.close();server.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));}
 console.log(JSON.stringify({rows:report.rows.length,interactions:report.interactions,failures:report.failures},null,2));
 if(report.failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
