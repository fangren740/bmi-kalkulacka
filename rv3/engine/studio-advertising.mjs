/* RV3 advertising: concise visitor-facing copy, without transient implementation status. */
import {createHash} from 'node:crypto';
import {extractMain,getCanonical} from './renderer.mjs';
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';

const SOURCE_BLOB='a146faeae3b0d4f131f5cf87bda11def1694fa67';
const CANONICAL='https://rychlevypocty.cz/reklama-a-spoluprace.html';
const TITLE='Reklama a spolupráce | RychléVýpočty.cz';
const DESCRIPTION='Aktuální stav reklamy, affiliate odkazů a placených spoluprací na RychléVýpočty.cz.';

export function renderAdvertisingStudio(source,template){
 if(typeof source!=='string'||typeof template!=='string')throw Error('Invalid advertising input');
 const sha=createHash('sha1').update('blob '+Buffer.byteLength(source,'utf8')+'\0'+source).digest('hex');
 if(sha!==SOURCE_BLOB)throw Error('Advertising source changed — content review required');
 if(getCanonical(source)!==CANONICAL||getCanonical(template)!==CANONICAL)throw Error('Advertising canonical drift');
 for(const html of [source,template])
  if(!html.includes('<title>'+TITLE+'</title>')||!html.includes('<meta name="description" content="'+DESCRIPTION+'">'))
   throw Error('Advertising SEO metadata drift');
 if(!source.includes('<meta name="robots" content="index,follow">')||
    !template.includes('<meta name="robots" content="noindex,nofollow,noarchive">'))
   throw Error('Advertising robots mismatch');
 // Keep original source under fingerprint protection, not as compulsory customer-facing copy.
 const main=extractMain(source);
 if(!main||!main.includes('Reklama ani placené spolupráce nejsou aktivní')||
   !main.includes('Případný obchodní obsah jasně označíme')||
   !main.includes('rychlevypocty@seznam.cz'))
  throw Error('Advertising source content drift');
 const json=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
 if(!json||!JSON.parse(json)['@graph']?.some(x=>x['@type']==='WebPage'&&x.url===CANONICAL))
  throw Error('Advertising schema drift');
 const marks=['{{JSONLD}}','{{HEADER}}','{{FOOTER}}'];
 for(const mark of marks)if(template.split(mark).length!==2)throw Error('Template marker invalid: '+mark);
 let html=template.replace('{{JSONLD}}',json)
  .replace('{{HEADER}}',renderHeaderV2({catalogHref:'/rv3/poc/katalog-v2.html',active:'/reklama-a-spoluprace.html'}))
  .replace('{{FOOTER}}',renderFooterV2());
 if((html.match(/<main\b/g)||[]).length!==1||(html.match(/<h1\b/g)||[]).length!==1||
  html.includes('rv-trust-v7.css')||html.includes('trust-nav'))
  throw Error('Advertising markup invalid');
 if(!html.includes('mailto:rychlevypocty@seznam.cz')||
  !html.includes('/rv3/studio/ochrana-osobnich-udaju.html')||
  !html.includes('/rv3/studio/cookies.html'))
  throw Error('Required visitor links missing');
 return {html,manifest:{
  kind:'customer-first-advertising',source:'reklama-a-spoluprace.html',
  preview:'/rv3/studio/reklama-a-spoluprace.html',canonical:CANONICAL,previewOnly:true,
  sourceSha256:createHash('sha256').update(source).digest('hex'),
  copyApproach:'evergreen-reviewed-paraphrase',
  legalOperationalReview:'PENDING_ACTUAL_ADS_AND_CONSENT_CONFIGURATION',
  browserQa:'NOT_VERIFIED',designReview:'OWNER_REVIEW_PENDING'
 }};
}
