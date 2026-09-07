/* Live production smoke and visual evidence, separate from Lighthouse scoring. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),output=process.env.RV_QA_OUTPUT||'/tmp/rv-rc-browser';
const rc=JSON.parse(fs.readFileSync(path.join(root,'RV_VNEXT_PROGRESS.json'))).completedPages.filter(p=>p.status==='RELEASE_CANDIDATE');
const requested=(process.env.RV_SEQUENCES||'').split(',').filter(Boolean).map(Number);
const targetBase=process.env.RV_TARGET_BASE||'https://rychlevypocty.cz';
const report={targetBase,measuredAt:new Date().toISOString(),rows:[],interactions:[],resources:{},failures:[]};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
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
   for(const width of [320,360,390,1440]){
    await page.setViewportSize({width,height:900});
    const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,clippedControls:[...document.querySelectorAll('input:not([type=hidden]),select,button')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').filter(e=>{const r=e.getBoundingClientRect();if(r.left>=-1&&r.right<=innerWidth+1)return false;for(let p=e.parentElement;p;p=p.parentElement){const b=p.getBoundingClientRect();if(['auto','scroll'].includes(getComputedStyle(p).overflowX)&&p.scrollWidth>p.clientWidth&&b.left>=-1&&b.right<=innerWidth+1)return false;}return true}).map(e=>e.id||e.textContent.slice(0,40))}));
    const row={sequence:item.sequence,file:item.file,width,...metrics,errors:[...errors]};report.rows.push(row);
    if(row.overflow>1||row.clippedControls.length||row.errors.length)report.failures.push(row);
    if([320,390,1440].includes(width)){
     const style=await page.addStyleTag({content:'* {content-visibility:visible !important;}'});
     await page.evaluate(()=>window.scrollTo(0,0));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     await page.screenshot({path:path.join(output,`${item.sequence}-${width}-full.png`),fullPage:true});await style.evaluate(e=>e.remove());
    }
   }
   if(item.sequence===62){
    await page.setViewportSize({width:320,height:900});
    for(const preset of ['2224','12rot','shortlong','2448','three8']){
     await page.locator(`[data-preset="${preset}"]`).click();
     const ratios=await page.locator('#phaseGrid small').evaluateAll(nodes=>{
      const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number);
      const luminance=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
      return nodes.map(e=>{const a=luminance(rgb(getComputedStyle(e).color)),b=luminance(rgb(getComputedStyle(e.parentElement).backgroundColor));return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)});
     });
     assert(ratios.length>0&&ratios.every(r=>r>=4.5),preset+' phase contrast');
     await page.locator('#monthGrid button').last().click();
     assert(await page.locator('#monthGrid button').last().evaluate(e=>e.classList.contains('is-selected')),preset+' date selection');
    }
    await page.locator('[data-preset="2224"]').click();
    report.interactions.push({sequence:62,status:'PASS',checks:'five cycle presets, phase text contrast, selecting a day through contained horizontal scrolling at 320px'});
   }
  }catch(e){report.failures.push({sequence:item.sequence,error:e.message});}
  await Promise.allSettled(pending);await context.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({sequence:item.sequence,errors,failures:report.failures.filter(r=>r.sequence===item.sequence)}));
 }}finally{await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));}
 if(report.failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
