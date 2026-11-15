/* RV3 Page Studio / Privacy. Exact legal source text is preserved.
 * This renderer designs navigation/presentation only: it must NOT rewrite GDPR claims.
 * All contested operational claims are separate release blockers.
 */
import {createHash} from 'node:crypto';
import {extractMain,getCanonical} from './renderer.mjs';
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';

const CANONICAL='https://rychlevypocty.cz/ochrana-osobnich-udaju.html';
// Git blob SHA of reviewed production legal source at the start of this design round.
// Any source change requires an explicit content review and fingerprint update.
const REVIEWED_SOURCE_GIT_BLOB='74c09875753ba7eac387ec10b871b5fd04ffe845';
const TITLE='Ochrana osobních údajů | RychléVýpočty.cz';
const PREVIEW_DESCRIPTION='Srozumitelně o tom, jak RychléVýpočty.cz zpracovávají osobní údaje, kdo je správcem a jaká máte práva.';
const DESCRIPTION='Informace o zpracování osobních údajů na RychléVýpočty.cz při e-mailovém kontaktu, hostingu GitHub Pages a volitelných lokálních funkcích.';
export const PRIVACY_TOPICS=Object.freeze([
 {id:'spravce',title:'Kdo odpovídá za údaje',glyph:'independent',sourceTitle:'Kdo je správcem osobních údajů'},
 {id:'prohlizec',title:'Výpočty a prohlížeč',glyph:'calculator',sourceTitle:'Co zůstává ve vašem prohlížeči'},
 {id:'mereni',title:'Analytika a reklama',glyph:'audit',sourceTitle:'Google Analytics nyní není aktivní'},
 {id:'email',title:'E-mailová komunikace',glyph:'feedback',sourceTitle:'Jak se zpracuje vaše zpráva'},
 {id:'hosting',title:'Technický provoz',glyph:'sources',sourceTitle:'Hosting prostřednictvím GitHub Pages'},
 {id:'odkazy',title:'Externí odkazy',glyph:'context',sourceTitle:'Co se stane po otevření externího odkazu'},
 {id:'prava',title:'Vaše práva podle GDPR',glyph:'privacy',sourceTitle:'Přístup, oprava, výmaz a další možnosti'}
]);

export function renderPrivacyStudio(source,template){
 if(typeof source!=='string'||!/^<!doctype html>/i.test(source))
  throw Error('Invalid privacy source document');
 const sourceBlob=createHash('sha1').update('blob '+Buffer.byteLength(source,'utf8')+'\0'+source).digest('hex');
 if(sourceBlob!==REVIEWED_SOURCE_GIT_BLOB)
  throw Error('Privacy legal source fingerprint changed — manual legal review required');
 if(getCanonical(source)!==CANONICAL)
  throw Error('Source privacy canonical drift');
 if(!source.includes('<title>'+TITLE+'</title>')||
    !source.includes('<meta name="description" content="'+DESCRIPTION+'">'))
  throw Error('Source privacy SEO identity changed');
 if(!source.includes('<meta name="robots" content="index,follow">'))
  throw Error('Source privacy robots drift');
 const main=extractMain(source);
 if(!main)throw Error('Missing source privacy main');
 const match=[...main.matchAll(/<section class="card">([\s\S]*?)<\/section>/g)];
 if(match.length!==PRIVACY_TOPICS.length)
  throw Error('Privacy legal section count changed: '+match.length);
 const expectedParagraphCounts=[1,4,2,4,3,1,2];
 match.forEach((entry,i)=>{
  const count=(entry[1].match(/<p(?:\s|>)/g)||[]).length;
  if(count!==expectedParagraphCounts[i])
   throw Error('Privacy legal paragraph count drift in section '+i);
 });
 const originalSections=match.map(x=>x[1]);
 for(let i=0;i<PRIVACY_TOPICS.length;i++){
  if(!originalSections[i].includes('<h2>'+PRIVACY_TOPICS[i].sourceTitle+'</h2>'))
   throw Error('Privacy legal section '+i+' changed title/order');
 }
 for(const evidence of [
  'Martin Šilinger','rychlevypocty@seznam.cz',
  'Web nemá uživatelské účty, přihlášení, newsletter ani kontaktní formulář.',
  'Google Analytics nyní není aktivní',
  'GitHub Pages',
  'čl. 6 odst. 1 písm. f GDPR',
  'čl. 6 odst. 1 písm. b GDPR',
  'čl. 6 odst. 1 písm. c GDPR',
  'standardní smluvní doložky EU',
  'Za podmínek stanovených GDPR',
  'Úřadu pro ochranu osobních údajů'
 ])if(!main.includes(evidence))
  throw Error('Missing source privacy evidence: '+evidence);
 const json=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
 if(!json)throw Error('Privacy JSON-LD source missing');
 const schema=JSON.parse(json);
 if(!schema['@graph']?.some(x=>x['@type']==='PrivacyPolicy'&&x.url===CANONICAL))
  throw Error('Privacy structured data identity drift');
 if(typeof template!=='string'||!/^<!doctype html>/i.test(template))
  throw Error('Invalid privacy template');
 if(getCanonical(template)!==CANONICAL||!template.includes('<title>'+TITLE+'</title>')||
    !template.includes('<meta name="description" content="'+PREVIEW_DESCRIPTION+'">'))
  throw Error('Template privacy SEO changed');
 if(!template.includes('<meta name="robots" content="noindex,nofollow,noarchive">'))
  throw Error('Preview privacy robots missing');
 const markers=['{{JSONLD}}','{{HEADER}}','{{FOOTER}}',
  ...PRIVACY_TOPICS.map((_,i)=>'{{LEGAL_'+i+'}}')];
 for(const marker of markers)
  if(template.split(marker).length!==2)
   throw Error('Missing or duplicated privacy placeholder: '+marker);
 let html=template
  .replace('{{JSONLD}}',json)
  .replace('{{HEADER}}',renderHeaderV2({catalogHref:'/rv3/poc/katalog-v2.html',active:'/ochrana-osobnich-udaju.html'})
   .replaceAll('href="/jak-pocitame.html"','href="/rv3/studio/jak-pocitame.html"'))
  .replace('{{FOOTER}}',renderFooterV2());
 originalSections.forEach((fragment,i)=>{html=html.replace('{{LEGAL_'+i+'}}',fragment)});
 if((html.match(/<h1\b/gi)||[]).length!==1||
    (html.match(/<main\b/gi)||[]).length!==1)
  throw Error('Invalid privacy heading/landmarks');
 // Content integrity: verbatim copy of each source section, including links,
 // all original legal paragraphs and legal bases. No source paraphrasing.
 for(const fragment of originalSections)
  if(!html.includes(fragment))throw Error('Source legal content has been modified');
 if(html.includes('rv-trust-v7.css')||html.includes('trust-nav')||html.includes('hero-panel'))
  throw Error('Legacy trust layout leaked');
 return {html,manifest:{
  kind:'bespoke-privacy-reading-room',
  source:'ochrana-osobnich-udaju.html',
  preview:'/rv3/studio/ochrana-osobnich-udaju.html',
  canonical:CANONICAL,title:TITLE,previewOnly:true,
  sourceSha256:createHash('sha256').update(source).digest('hex'),
  legalSectionCount:PRIVACY_TOPICS.length,
  sourceLegalContentUnmodified:true,
  art:'/rv3/assets/privacy-flow.svg',
  css:['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/privacy.css'],
  legalReviewStatus:'BLOCKED_PENDING_TRACKING_CONTACT_AND_HOSTING_VERIFICATION',
  designStatus:'VISUAL_REVIEW_PENDING',
  browserQa:'NOT_VERIFIED'
 }};
}