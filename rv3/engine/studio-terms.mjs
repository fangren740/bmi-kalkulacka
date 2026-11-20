/* RV3 Terms: source-locked eight-part reader with a focused customer-first design. */
import {createHash} from 'node:crypto';
import {extractMain,getCanonical} from './renderer.mjs';
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';
const SOURCE_BLOB='624631f727a8dbcbeb836bce2c1eec401dc03800';
const CANONICAL='https://rychlevypocty.cz/podminky-pouziti.html';
const TITLE='Podmínky použití | RychléVýpočty.cz';
const DESCRIPTION='Pravidla používání webu RychléVýpočty.cz, charakter výsledků, odpovědnost uživatele a autorská práva.';
export const TERMS_TOPICS=Object.freeze([
 ['ucel','Co web nabízí','Pomůcka pro orientaci a porovnání'],
 ['vysledky','Jak číst výsledky','Správnost výsledku začíná správným zadáním'],
 ['pouziti','Používání obsahu','Běžné používání a sdílení odkazů'],
 ['dostupnost','Dostupnost','Obsah a funkce se mohou měnit'],
 ['externi','Externí odkazy','Externí odkazy vedou na weby jiných provozovatelů'],
 ['prava','Autorská práva','Respektujte původ obsahu'],
 ['zmeny','Změny pravidel','Kde najdete aktuální podmínky'],
 ['kontakt','Kontakt','Dotazy a hlášení chyb']
]);
export function renderTermsStudio(source,template){
 if(typeof source!=='string'||typeof template!=='string')throw Error('Terms source/template invalid');
 const blob=createHash('sha1').update('blob '+Buffer.byteLength(source,'utf8')+'\0'+source).digest('hex');
 if(blob!==SOURCE_BLOB)throw Error('Terms source fingerprint changed — review required');
 if(getCanonical(source)!==CANONICAL||getCanonical(template)!==CANONICAL)throw Error('Terms canonical drift');
 for(const html of [source,template]){
  if(!html.includes('<title>'+TITLE+'</title>')||
     !html.includes('<meta name="description" content="'+DESCRIPTION+'">'))
   throw Error('Terms metadata drift');
 }
 if(!source.includes('<meta name="robots" content="index,follow">')||
 !template.includes('<meta name="robots" content="noindex,nofollow,noarchive">'))
  throw Error('Terms preview robots invalid');
 const main=extractMain(source);
 if(!main)throw Error('Terms source missing main');
 const sections=[...main.matchAll(/<section class="card">([\s\S]*?)<\/section>/g)].map(m=>m[1]);
 if(sections.length!==TERMS_TOPICS.length)throw Error('Terms chapter count drift');
 for(let i=0;i<sections.length;i++)
  if(!sections[i].includes('<h2>'+TERMS_TOPICS[i][2]+'</h2>'))
   throw Error('Terms chapter drift: '+i);
 const schemaText=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
 if(!schemaText||!JSON.parse(schemaText)['@graph']?.some(x=>x['@type']==='WebPage'&&x.url===CANONICAL))
  throw Error('Terms structured data drift');
 const tags=['{{JSONLD}}','{{HEADER}}','{{FOOTER}}',...TERMS_TOPICS.map((_,i)=>'{{TERM_'+i+'}}')];
 for(const t of tags)if(template.split(t).length!==2)throw Error('Invalid terms template marker '+t);
 let html=template.replace('{{JSONLD}}',schemaText)
 .replace('{{HEADER}}',renderHeaderV2({catalogHref:'/rv3/poc/katalog-v2.html',active:'/podminky-pouziti.html'}))
 .replace('{{FOOTER}}',renderFooterV2());
 sections.forEach((part,i)=>html=html.replace('{{TERM_'+i+'}}',part));
 if((html.match(/<main\b/g)||[]).length!==1||(html.match(/<h1\b/g)||[]).length!==1)
  throw Error('Terms HTML landmarks drift');
 for(const part of sections)if(html.split(part).length!==2)
  throw Error('Original terms content altered or duplicated');
 return {html,manifest:{kind:'terms-reading-page',source:'podminky-pouziti.html',
 preview:'/rv3/studio/podminky-pouziti.html',canonical:CANONICAL,previewOnly:true,
 sourceSha256:createHash('sha256').update(source).digest('hex'),
 chapters:8,sourceChaptersVerbatim:true,browserQa:'NOT_VERIFIED',designReview:'OWNER_REVIEW_PENDING'}};
}
