/* Read-only production Lighthouse evidence. Never promotes tracker statuses. */
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const output=path.resolve(process.env.RV_QA_OUTPUT||'/tmp/rv-rc-production');
const shard=Number(process.env.RV_SHARD||0), shards=Number(process.env.RV_SHARDS||1);
const rc=JSON.parse(fs.readFileSync(path.join(root,'RV_VNEXT_PROGRESS.json'))).completedPages.filter(p=>p.status==='RELEASE_CANDIDATE');
const selected=rc.filter((p,i)=>i%shards===shard);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={schemaVersion:1,measuredAt:new Date().toISOString(),candidate:process.env.GITHUB_SHA||null,shard,shards,rows:[]};
fs.mkdirSync(output,{recursive:true});
function save(){fs.writeFileSync(path.join(output,'summary.json'),JSON.stringify(report,null,2));}
(async()=>{
 for(const item of selected){
  let identity;
  try{
   const res=await fetch(item.url,{signal:AbortSignal.timeout(30000)});
   const body=Buffer.from(await res.arrayBuffer());
   identity={url:res.url,httpStatus:res.status,productionHtmlSha256:hash(body),repositoryHtmlSha256:hash(fs.readFileSync(path.join(root,item.file)))};
   identity.htmlMatchesRepository=identity.productionHtmlSha256===identity.repositoryHtmlSha256;
  }catch(e){identity={error:e.message};}
  for(const device of ['mobile','desktop']){
   const stem=`${item.sequence}-${device}`;
   const jsonPath=path.join(output,stem+'.report.json');
   const args=[path.join(process.env.RV_QA_DEPS,'node_modules/lighthouse/cli/index.js'),item.url,'--quiet','--chrome-flags=--headless --no-sandbox --disable-dev-shm-usage','--output=json','--output=html','--output-path='+path.join(output,stem),'--only-categories=performance,accessibility,best-practices,seo'];
   if(device==='desktop')args.push('--preset=desktop');
   const run=spawnSync(process.execPath,args,{timeout:180000,encoding:'utf8',maxBuffer:4*1024*1024});
   const row={sequence:item.sequence,file:item.file,url:item.url,device,identity,exitCode:run.status};
   if(fs.existsSync(jsonPath)){
    const lhr=JSON.parse(fs.readFileSync(jsonPath));
    row.lighthouseVersion=lhr.lighthouseVersion;row.fetchTime=lhr.fetchTime;row.finalUrl=lhr.finalDisplayedUrl||lhr.finalUrl;row.runtimeError=lhr.runtimeError||null;
    row.scores=Object.fromEntries(Object.entries(lhr.categories).map(([k,v])=>[k,v.score===null?null:Math.round(v.score*100)]));
    row.metrics=Object.fromEntries(['largest-contentful-paint','cumulative-layout-shift','total-blocking-time','first-contentful-paint'].map(k=>[k,lhr.audits[k]?.numericValue]));
    const categories={};for(const [k,v] of Object.entries(lhr.categories))for(const a of v.auditRefs)(categories[a.id]??=[]).push(k);
    row.findings=Object.values(lhr.audits).filter(a=>a.score!==null&&a.score<1).map(a=>({id:a.id,title:a.title,score:a.score,categories:categories[a.id]||[],displayValue:a.displayValue,details:a.details}));
    row.status=row.runtimeError?'ERROR':!identity.htmlMatchesRepository?'VERSION_REVIEW':Object.values(row.scores).every(s=>s===100)?'AUTOMATED_PASS_REQUIRES_REVIEW':'REVIEW_REQUIRED';
   }else {row.status='ERROR';row.error=run.error?.message||run.stderr?.slice(-2000)||'Missing Lighthouse output';}
   report.rows.push(row);save();console.log(JSON.stringify({sequence:row.sequence,device,status:row.status,scores:row.scores,identity:identity.htmlMatchesRepository,error:row.error,findings:row.findings?.map(f=>f.id)}));
  }
 }
 if(report.rows.some(r=>r.status==='ERROR'))process.exitCode=1;
})().catch(e=>{console.error(e);save();process.exitCode=1;});
