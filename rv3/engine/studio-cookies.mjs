/* RV3 cookies & browser storage: source-locked, content-first rendering.
 * Verbatim explanatory and technical table content; no new storage or UI gimmicks.
 * Analytics claims are NOT recertified by this renderer.
 */
import {createHash} from 'node:crypto';
import {extractMain,getCanonical} from './renderer.mjs';
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';

const SOURCE='cookies.html';
const SOURCE_GIT_BLOB='68e9ba2b0db21a80dfdb5a7dc3443e17394eb56f';
const TITLE='Cookies a lokální úložiště | RychléVýpočty.cz';
const DESCRIPTION='Přehled lokálního ukládání a URL parametrů používaných na RychléVýpočty.cz, včetně přesných spouštěčů a možností odstranění.';
const CANONICAL='https://rychlevypocty.cz/cookies.html';
export const COOKIES_SECTIONS=Object.freeze([
 {id:'rozdily',title:'Cookies, localStorage a URL',glyph:'context',heading:'Jaký je rozdíl mezi cookies, localStorage a URL'},
 {id:'mereni',title:'Analytika a reklama',glyph:'audit',heading:'Tyto technologie nyní nejsou aktivní'},
 {id:'uloziste',title:'Přehled 9 uložených položek',glyph:'entry',heading:'Co se ukládá, kdy a jak se údaje odstraní'},
 {id:'smazani',title:'Jak údaje smazat',glyph:'privacy',heading:'Použijte reset nástroje nebo nastavení prohlížeče'},
 {id:'sdileni',title:'Sdílení odkazů',glyph:'sources',heading:'Před odesláním zkontrolujte adresu'}
]);
export const STORAGE_KEYS=Object.freeze([
 'rv_catalog_favorites_v1','rv_catalog_recent_v1','rv-name-calendar-favourites-v1',
 'rv-vacation-planner-v1','rv-shift-calendar-v1','rv-workdays-v2',
 'rv_ac_calculator_v3','rv-rough-build-v4','rv-storage-preferences-v1'
]);
export function renderCookiesStudio(source,template){
 if(typeof source!=='string'||!/^<!doctype html>/i.test(source))throw Error('Cookies source invalid');
 const blob=createHash('sha1').update('blob '+Buffer.byteLength(source,'utf8')+'\0'+source).digest('hex');
 if(blob!==SOURCE_GIT_BLOB)throw Error('Cookies factual source fingerprint changed — re-audit required');
 if(getCanonical(source)!==CANONICAL||
   !source.includes('<title>'+TITLE+'</title>')||
   !source.includes('<meta name="description" content="'+DESCRIPTION+'">')||
   !source.includes('<meta name="robots" content="index,follow">'))
  throw Error('Cookies source SEO identity changed');
 const main=extractMain(source);
 if(!main)throw Error('Cookies main missing');
 const cards=[...main.matchAll(/<section class="card">([\s\S]*?)<\/section>/g)].map(m=>m[1]);
 if(cards.length!==COOKIES_SECTIONS.length)throw Error('Cookies source section count changed');
 cards.forEach((part,i)=>{
  if(!part.includes('<h2>'+COOKIES_SECTIONS[i].heading+'</h2>'))
   throw Error('Cookies section heading changed: '+i);
 });
 const table=cards[2];
 if(!table.includes('<table class="data-table">')||!table.includes('</table>'))
  throw Error('Cookies storage reference table missing');
 const rows=[...table.matchAll(/<tr><td class="key" data-label="Klíč">([^<]+)<\/td>/g)].map(m=>m[1]);
 if(JSON.stringify(rows)!==JSON.stringify(STORAGE_KEYS))
  throw Error('Cookies storage keys or their order changed');
 if((table.match(/<td\b/g)||[]).length!==54)
  throw Error('Cookies storage details lost');
 if(!cards[3].includes('data webu')||!cards[4].includes('URL může obsahovat zadané hodnoty'))
  throw Error('Cookies deletion or sharing warning missing');
 const json=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
 if(!json)throw Error('Cookies source JSON-LD missing');
 const schema=JSON.parse(json);
 if(!schema['@graph']?.some(v=>v['@type']==='WebPage'&&v.url===CANONICAL))
  throw Error('Cookies structured data changed');
 if(typeof template!=='string'||!/^<!doctype html>/i.test(template)||
   getCanonical(template)!==CANONICAL||!template.includes('<title>'+TITLE+'</title>')||
   !template.includes('<meta name="description" content="'+DESCRIPTION+'">')||
   !template.includes('<meta name="robots" content="noindex,nofollow,noarchive">'))
  throw Error('Cookies preview identity/robots invalid');
 for(const tag of ['{{JSONLD}}','{{HEADER}}','{{FOOTER}}',...COOKIES_SECTIONS.map((_,i)=>'{{CONTENT_'+i+'}}')])
  if(template.split(tag).length!==2)throw Error('Cookies preview placeholder invalid: '+tag);
 let html=template
  .replace('{{JSONLD}}',json)
  .replace('{{HEADER}}',renderHeaderV2({catalogHref:'/rv3/poc/katalog-v2.html',active:'/cookies.html'})
   .replaceAll('href="/jak-pocitame.html"','href="/rv3/studio/jak-pocitame.html"'))
  .replace('{{FOOTER}}',renderFooterV2());
 cards.forEach((value,i)=>{html=html.replace('{{CONTENT_'+i+'}}',value)});
 if((html.match(/<main\b/gi)||[]).length!==1||(html.match(/<h1\b/gi)||[]).length!==1)
  throw Error('Cookies landmarks invalid');
 cards.forEach((value,i)=>{if(html.split(value).length!==2)throw Error('Cookies source section not preserved: '+i)});
 if(html.includes('rv-trust-v7.css')||html.includes('trust-nav')||html.includes('hero-panel'))
  throw Error('Cookies legacy layout leaked');
 return {html,manifest:{
  kind:'bespoke-cookies-reference',source:SOURCE,preview:'/rv3/studio/cookies.html',
  title:TITLE,canonical:CANONICAL,previewOnly:true,
  sourceSha256:createHash('sha256').update(source).digest('hex'),
  sourceBodyVerbatim:true,sections:cards.length,storageKeys:rows.length,
  art:'/rv3/assets/storage-drawer.svg',
  css:['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/cookies.css'],
  factualReviewStatus:'BLOCKED_PENDING_ANALYTICS_CMP_AND_STORAGE_CODE_VERIFICATION',
  designStatus:'VISUAL_REVIEW_PENDING',browserQa:'NOT_VERIFIED'
 }};
}