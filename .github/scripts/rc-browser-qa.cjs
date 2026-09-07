/* Live production smoke and visual evidence, separate from Lighthouse scoring. */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../..'),output=process.env.RV_QA_OUTPUT||'/tmp/rv-rc-browser';
const rc=JSON.parse(fs.readFileSync(path.join(root,'RV_VNEXT_PROGRESS.json'))).completedPages.filter(p=>p.status==='RELEASE_CANDIDATE');
const report={measuredAt:new Date().toISOString(),rows:[],resources:{},failures:[]};
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(output,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{for(const item of rc){
  const context=await browser.newContext({reducedMotion:'reduce',locale:'cs-CZ'});
  const page=await context.newPage(),errors=[],pending=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{
   const u=new URL(r.url());if(u.origin!=='https://rychlevypocty.cz'||!['document','script','stylesheet'].includes(r.request().resourceType()))return;
   pending.push((async()=>{try{const b=await r.body(),file=path.resolve(root,'.'+decodeURIComponent(u.pathname));const local=file.startsWith(root+path.sep)&&fs.existsSync(file)?hash(fs.readFileSync(file)):null;report.resources[r.url()]={status:r.status(),productionSha256:hash(b),repositorySha256:local,matchesRepository:local===hash(b)};}catch(e){report.resources[r.url()]={error:e.message};}})());
  });
  try{
   await page.goto(item.url,{waitUntil:'networkidle',timeout:45000});
   for(const width of [320,360,390,1440]){
    await page.setViewportSize({width,height:900});
    const metrics=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,clippedControls:[...document.querySelectorAll('input:not([type=hidden]),select,button')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1}).map(e=>e.id||e.textContent.slice(0,40))}));
    const row={sequence:item.sequence,file:item.file,width,...metrics,errors:[...errors]};report.rows.push(row);
    if(row.overflow>1||row.clippedControls.length||row.errors.length)report.failures.push(row);
    if([390,1440].includes(width)){
     const style=await page.addStyleTag({content:'* {content-visibility:visible !important;}'});
     await page.evaluate(()=>window.scrollTo(0,0));await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
     await page.screenshot({path:path.join(output,`${item.sequence}-${width}-full.png`),fullPage:true});await style.evaluate(e=>e.remove());
    }
   }
  }catch(e){report.failures.push({sequence:item.sequence,error:e.message});}
  await Promise.allSettled(pending);await context.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({sequence:item.sequence,errors,failures:report.failures.filter(r=>r.sequence===item.sequence)}));
 }}finally{await browser.close();fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));}
 if(report.failures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
