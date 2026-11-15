/* RV3 Page Studio: Redakcni zasady — original, source-verified editorial UX.
 * No legacy trust markup, no unverified claims of expertise or deadlines.
 */
import {createHash} from 'node:crypto';
import {extractMain,getCanonical} from './renderer.mjs';
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';

const SOURCE='redakcni-zasady.html';
const TITLE='Redakční zásady | RychléVýpočty.cz';
const DESCRIPTION='Jak RychléVýpočty.cz vybírají témata, ověřují zdroje, používají automatizaci a opravují chyby.';
const CANONICAL='https://rychlevypocty.cz/redakcni-zasady.html';
const OWNER='Martin Šilinger';
const EMAIL='rychlevypocty@seznam.cz';

export function renderEditorialStudio(source,template){
 if(typeof source!=='string'||!/^<!doctype html>/i.test(source))throw Error('Invalid editorial source');
 if(getCanonical(source)!==CANONICAL)throw Error('Canonical identity changed');
 if(!source.includes('<title>'+TITLE+'</title>')||!source.includes('content="'+DESCRIPTION+'"'))throw Error('Source SEO drift');
 if(!source.includes('<meta name="robots" content="index,follow">'))throw Error('Source robots changed');
 const main=extractMain(source);
 if(!main)throw Error('Missing source main');
 const facts=[
  'Začínáme konkrétní otázkou','Zdroje hledáme co nejblíže původnímu pravidlu',
  'Jak používáme AI a automatizaci','Finální odpovědnost','Na doložené chyby reagujeme opravou',
  OWNER,EMAIL
 ];
 for(const fact of facts)if(!main.includes(fact))throw Error('Verified editorial claim missing: '+fact);
 if(!main.includes('<strong>Provozovatel</strong><span>'+OWNER+'</span>')||
    !main.includes('nese provozovatel '+OWNER+'.'))throw Error('Verified owner provenance missing');
 const json=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
 if(!json)throw Error('Editorial JSON-LD source missing');
 const data=JSON.parse(json);
 if(!data['@graph']?.some(item=>item['@type']==='WebPage'&&item.url===CANONICAL))
    throw Error('Editorial source structured identity drift');
 if(typeof template!=='string'||!/^<!doctype html>/i.test(template))throw Error('Editorial template invalid');
 if(getCanonical(template)!==CANONICAL||!template.includes('<title>'+TITLE+'</title>')||
   !template.includes('content="'+DESCRIPTION+'"'))throw Error('Editorial template identity changed');
 if(!template.includes('<meta name="robots" content="noindex,nofollow,noarchive">'))
    throw Error('Missing preview noindex');
 for(const marker of ['{{JSONLD}}','{{HEADER}}','{{FOOTER}}'])
    if(template.split(marker).length!==2)throw Error('Missing or duplicated template marker '+marker);
 const html=template
  .replace('{{JSONLD}}',json)
  .replace('{{HEADER}}',renderHeaderV2({catalogHref:'/rv3/poc/katalog-v2.html',active:'/redakcni-zasady.html'})
     .replaceAll('href="/jak-pocitame.html"','href="/rv3/studio/jak-pocitame.html"'))
  .replace('{{FOOTER}}',renderFooterV2());
 if((html.match(/<h1\b/gi)||[]).length!==1||(html.match(/<main\b/gi)||[]).length!==1)
   throw Error('Editorial landmarks invalid');
 if(html.includes('rv-trust-v7.css')||html.includes('trust-nav')||html.includes('hero-panel'))
   throw Error('Legacy editorial layout leaked');
 return {html,manifest:{
   kind:'bespoke-editorial-studio',source:SOURCE,preview:'/rv3/studio/redakcni-zasady.html',
   title:TITLE,canonical:CANONICAL,previewOnly:true,
   sourceSha256:createHash('sha256').update(source).digest('hex'),
   art:'/rv3/assets/editorial-desk.svg',
   css:['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/editorial.css'],
   designStatus:'VISUAL_REVIEW_PENDING',browserQa:'NOT_VERIFIED'
 }};
}
