#!/usr/bin/env node
'use strict';
/* Diagnostic evidence, NOT a quality verdict. Never change the public site. */
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const registry=JSON.parse(fs.readFileSync(path.join(root,'calculators-registry.json'),'utf8'));
const inventory=JSON.parse(fs.readFileSync(path.join(root,'RV_VNEXT_INVENTORY.json'),'utf8'));
const statuses=Object.fromEntries(inventory.items.map(item=>[item.file,item.status]));
const items=registry.items.filter(item=>item.type==='calculator');
const out='/tmp/rv-v8-portfolio-triage'; fs.mkdirSync(out,{recursive:true});
const base='https://rychlevypocty.cz/';
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function check(browser,item,width){
  const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
  const problems=[]; const jsErrors=[];const localFailures=[];
  page.on('pageerror',error=>jsErrors.push(error.message.slice(0,180)));
  page.on('response',response=>{if(response.status()>=400&&response.url().startsWith(base))localFailures.push(response.status()+' '+response.url().slice(-100));});
  try{
    const response=await page.goto(base+item.file,{waitUntil:'domcontentloaded',timeout:25000});
    await sleep(550);
    const data=await page.evaluate(()=>{
      const all=[...document.querySelectorAll('[id]')].map(e=>e.id);
      const duplicates=all.filter((id,i)=>id&&all.indexOf(id)!==i);
      const images=[...document.querySelectorAll('header img, footer img')];
      const branding=images.map(img=>({src:img.currentSrc,loaded:img.complete&&img.naturalWidth>0,filter:getComputedStyle(img).filter}));
      const controls=[...document.querySelectorAll('input:not([type=hidden]),select,textarea')];
      const visible=controls.filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden';});
      const earliest=visible.length?Math.min(...visible.map(el=>el.getBoundingClientRect().top+scrollY)):null;
      return {title:document.title,h1:document.querySelectorAll('h1').length,
        description:!!document.querySelector('meta[name=description]')?.content?.trim(),
        canonical:!!document.querySelector('link[rel=canonical]')?.href,
        viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,
        main:!!document.querySelector('main'),footer:!!document.querySelector('footer'),
        controls:controls.length,firstControlY:earliest,bodyText:document.body.innerText.length,
        duplicateIds:[...new Set(duplicates)].slice(0,12),branding};
    });
    if(!response||response.status()!==200)problems.push('HTTP_'+(response?.status()??'NO_RESPONSE'));
    if(data.scrollWidth>width+1)problems.push('HORIZONTAL_OVERFLOW_'+(data.scrollWidth-width));
    if(!data.main)problems.push('NO_MAIN');
    if(!data.footer)problems.push('NO_FOOTER');
    if(data.h1!==1)problems.push('H1_COUNT_'+data.h1);
    if(!data.title)problems.push('NO_TITLE');
    if(!data.description)problems.push('NO_META_DESCRIPTION');
    if(!data.canonical)problems.push('NO_CANONICAL');
    if(data.controls===0)problems.push('NO_FORM_CONTROLS');
    if(data.firstControlY!==null&&data.firstControlY>(width<600?1750:1350))problems.push('FIRST_CONTROL_FAR_DOWN');
    if(data.bodyText<800)problems.push('VERY_THIN_VISIBLE_TEXT');
    if(data.duplicateIds.length)problems.push('DUPLICATE_IDS');
    if(data.branding.some(img=>!img.loaded))problems.push('BROKEN_BRAND_IMAGE');
    if(data.branding.some(img=>img.filter!=='none'))problems.push('BRAND_CSS_FILTER');
    if(jsErrors.length)problems.push('JS_RUNTIME_ERROR');
    if(localFailures.length)problems.push('LOCAL_ASSET_HTTP_ERROR');
    return {width,problems,data,jsErrors,localFailures};
  }catch(error){return {width,problems:['PAGE_LOAD_FAILURE'],error:String(error).slice(0,300)};}
  finally{await page.close();}
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const records=new Array(items.length);let next=0;
 async function worker(){while(next<items.length){const index=next++;const item=items[index];const mobile=await check(browser,item,390);const desktop=await check(browser,item,1440);records[index]={file:item.file,category:item.categoryId,status:statuses[item.file]||'UNKNOWN',mobile,desktop};if((index+1)%20===0)console.log('SCANNED',index+1,'/',items.length);}}
 try{await Promise.all(Array.from({length:5},worker));
  const severity={PAGE_LOAD_FAILURE:100,HTTP_:95,NO_FORM_CONTROLS:80,JS_RUNTIME_ERROR:75,HORIZONTAL_OVERFLOW_:65,BROKEN_BRAND_IMAGE:50,DUPLICATE_IDS:48,LOCAL_ASSET_HTTP_ERROR:45,NO_MAIN:36,NO_FOOTER:30,BRAND_CSS_FILTER:25,NO_CANONICAL:20,NO_META_DESCRIPTION:20,H1_COUNT_:18,FIRST_CONTROL_FAR_DOWN:15,VERY_THIN_VISIBLE_TEXT:12,NO_TITLE:20};
  const points=issue=>Object.entries(severity).find(([key])=>issue.startsWith(key))?.[1]||0;
  for(const record of records){const unique=[...new Set([...record.mobile.problems,...record.desktop.problems])];record.issueTypes=unique;record.triageSignal=unique.reduce((sum,issue)=>sum+points(issue),0);}
  records.sort((a,b)=>b.triageSignal-a.triageSignal||a.file.localeCompare(b.file));
  const summary={timestamp:new Date().toISOString(),sourceCommit:process.env.GITHUB_SHA||'unknown',source:'live desktop 1440 + mobile 390; registry 134 calculators',scanned:records.length,
    disclaimer:'Diagnostic technical signals only; NOT a verified worst-quality ranking. Manual full-page render and primary-intent test required before selecting work.',
    issues:records.filter(r=>r.triageSignal>0).length,top:records.slice(0,20).map(({file,status,triageSignal,issueTypes,mobile,desktop})=>({file,status,triageSignal,issueTypes,mobileFirstInput:mobile.data?.firstControlY,desktopFirstInput:desktop.data?.firstControlY})),records};
  fs.writeFileSync(path.join(out,'live-triage.json'),JSON.stringify(summary,null,2));
  console.log('PORTFOLIO_TOTAL',records.length,'FLAGGED',summary.issues,'TOP_DIAGNOSTIC',JSON.stringify(summary.top));
  for(const entry of records.slice(0,8)){
   const safe=entry.file.replace(/\.html$/,'');
   for(const width of [390,1440]){
    const page=await browser.newPage({viewport:{width,height:900},deviceScaleFactor:1});
    try{await page.goto(base+entry.file,{waitUntil:'domcontentloaded',timeout:25000});await sleep(700);await page.screenshot({path:path.join(out,safe+'-'+width+'.png'),fullPage:false});
      if(records.indexOf(entry)<3)await page.screenshot({path:path.join(out,safe+'-'+width+'-full.png'),fullPage:true});
    }catch(e){console.log('SCREENSHOT_FAILURE',entry.file,width,String(e).slice(0,120));}finally{await page.close();}
   }
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
