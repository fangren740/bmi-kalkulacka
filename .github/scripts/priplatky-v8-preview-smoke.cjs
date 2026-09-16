#!/usr/bin/env node
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const previewCommit='f9182a4182d4484dad583b50ff121eed9b7bada4';
const productCommit='09352428b75f5145cb11af9f2484e80b6a8e1dd2';
const repo='fangren740/bmi-kalkulacka';
const filename='v8-priplatky-live-preview.html';
const urls={
 githack:`https://raw.githack.com/${repo}/${previewCommit}/${filename}`,
 htmlpreview:`https://htmlpreview.github.io/?https://github.com/${repo}/blob/${previewCommit}/${filename}`
};
(async()=>{
 const browser=await chromium.launch({headless:true});
 const results={};
 try{
  for(const [provider,url] of Object.entries(urls)){
   const context=await browser.newContext({viewport:{width:390,height:844}});
   if(provider==='githack')await context.addCookies([{name:'__Http-phish',value:'1',domain:'raw.githack.com',path:'/',secure:true,httpOnly:true,sameSite:'Lax'}]);
   const page=await context.newPage();
   const errors=[],badAssets=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&/priplatky-smeny|rv-brand-v32|logo-rv-v32/i.test(r.url()))badAssets.push(`${r.status()} ${r.url()}`);});
   try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
    console.log('PREVIEW_PROVIDER',provider,'HTTP',response&&response.status(),'URL',page.url());
    await page.waitForSelector('#cashBonus',{timeout:20000});
    await page.waitForFunction(()=>/Kč/.test(document.getElementById('cashBonus')?.textContent||''),null,{timeout:20000});
    const links=await page.locator('script[src],link[rel="stylesheet"]').evaluateAll(nodes=>nodes.map(n=>n.src||n.href));
    for(const file of ['priplatky-smeny.js','rv-brand-v32.js','priplatky-smeny.css','rv-brand-v32.css']){
     assert.ok(links.some(x=>x.includes(`/${productCommit}/${file}`)),`Missing pinned original asset ${file}: ${links.join(',')}`);
    }
    assert.equal(await page.locator('header img.rv-logo-image').evaluate(x=>x.complete&&x.naturalWidth>0),true,'Header logo');
    assert.equal(await page.locator('footer img.rv-logo-image').evaluate(x=>x.complete&&x.naturalWidth>0),true,'Footer logo');
    await page.locator('#sfManualTab').click();
    await page.locator('#manualWorked').fill('4');
    await page.locator('#manualNight').fill('6');
    assert.equal(await page.locator('#formError').isVisible(),true,'Invalid worked hours must show error');
    assert.doesNotMatch(await page.locator('#cashBonus').innerText(),/\d[\d\s]*\s*Kč/,'Stale amount displayed');
    assert.deepEqual(errors,[],'JavaScript runtime errors');
    assert.deepEqual(badAssets,[],'Missing first-party assets');
    await page.screenshot({path:`/tmp/${provider}-v8-preview.png`,fullPage:true});
    console.log('PREVIEW_PASS',provider,'FULLY_INTERACTIVE',true,'pinned',productCommit);
    results[provider]={pass:true,url};
   }catch(e){
    console.error('PREVIEW_FAIL',provider,e.stack||e.message,'errors',JSON.stringify(errors),'bad_assets',JSON.stringify(badAssets),'title',await page.title());
    results[provider]={pass:false,error:e.message,url};
    await page.screenshot({path:`/tmp/${provider}-v8-preview-failure.png`,fullPage:true}).catch(()=>{});
   }
   await context.close();
  }
 }finally{await browser.close();}
 console.log('PREVIEW_RESULT',JSON.stringify(results));
 if(!Object.values(results).some(x=>x.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
