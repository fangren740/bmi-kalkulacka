/* RV3 Page Studio: Jak počítáme. Verified source is a factual contract only,
 * bespoke markup comes from its own content template, never legacy DOM.
 */
import {createHash} from 'node:crypto';
import {extractMain,getCanonical} from './renderer.mjs';
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';

const SOURCE='jak-pocitame.html';
const CANONICAL='https://rychlevypocty.cz/jak-pocitame.html';
const TITLE='Jak počítáme | RychléVýpočty.cz';
const DESCRIPTION='Metodika výpočtů, práce se zdroji, referenčními roky, testy a limity kalkulaček.';

export function renderMethodologyStudio(source,template){
 if(typeof source!=='string'||!/^<!doctype html>/i.test(source))throw Error('Invalid methodology source');
 if(getCanonical(source)!==CANONICAL)throw Error('Methodology canonical drift');
 if(!source.includes('<title>'+TITLE+'</title>')||!source.includes('content="'+DESCRIPTION+'"'))throw Error('Methodology SEO drift');
 if(!source.includes('<meta name="robots" content="index,follow">'))throw Error('Source robots changed');
 const main=extractMain(source);
 if(!main)throw Error('Methodology main missing');
 for(const phrase of [
  'Přesný výpočet','Modelový výpočet','Orientační výpočet','Referenční rok',
  'hraničních příkladech','ručním výpočtem nebo nezávislou referencí',
  'Benchmarky zveřejňujeme i jako CSV','Kdy výpočet kontrolujeme znovu'
 ])if(!main.includes(phrase))throw Error('Missing source-backed methodology claim: '+phrase);
 const json=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
 if(!json)throw Error('Source JSON-LD missing');
 const schema=JSON.parse(json);
 if(!schema['@graph']?.some(item=>item['@type']==='WebPage'&&item.url===CANONICAL))
    throw Error('Methodology structured identity changed');
 if(typeof template!=='string'||!/^<!doctype html>/i.test(template))throw Error('Invalid methodology template');
 if(getCanonical(template)!==CANONICAL||!template.includes('<title>'+TITLE+'</title>')||
   !template.includes('content="'+DESCRIPTION+'"'))throw Error('Template SEO identity drift');
 if(!template.includes('<meta name="robots" content="noindex,nofollow,noarchive">'))
   throw Error('Missing preview noindex');
 const markers=['{{JSONLD}}','{{HEADER}}','{{FOOTER}}'];
 for(const marker of markers)if(template.split(marker).length!==2)throw Error('Missing/duplicated template marker '+marker);
 const html=template
  .replace('{{JSONLD}}',json)
  .replace('{{HEADER}}',renderHeaderV2({catalogHref:'/rv3/poc/katalog-v2.html',active:'/jak-pocitame.html'}).replaceAll('href="/jak-pocitame.html"','href="/rv3/studio/jak-pocitame.html"'))
  .replace('{{FOOTER}}',renderFooterV2());
 if((html.match(/<h1\b/gi)||[]).length!==1||(html.match(/<main\b/gi)||[]).length!==1)
    throw Error('Page landmarks invalid');
 if(html.includes('rv-trust-v7.css')||html.includes('trust-nav')||html.includes('hero-panel'))
    throw Error('Legacy layout leaked');
 return {html,manifest:{
   kind:'bespoke-methodology-studio',source:SOURCE,preview:'/rv3/studio/jak-pocitame.html',
   canonical:CANONICAL,title:TITLE,previewOnly:true,
   sourceSha256:createHash('sha256').update(source).digest('hex'),
   art:'/rv3/assets/method-workbench.svg',
   css:['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/methodology.css'],
   designStatus:'VISUAL_REVIEW_PENDING',browserQa:'NOT_VERIFIED',example:'discount-volume-model'
 }};
}