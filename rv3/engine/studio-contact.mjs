/* RV3 Page Studio: Kontakt — source-verified contact experience.
 * User-entered data stays inside the mail app; no new form backend.
 */
import {createHash} from 'node:crypto';
import {extractMain,getCanonical} from './renderer.mjs';
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';

const SOURCE='kontakt.html';
const TITLE='Kontakt | RychléVýpočty.cz';
const DESCRIPTION='Kontakt na Martina Šilingera a možnosti nahlášení chyby, návrhu nástroje nebo neaktuálního zdroje.';
const CANONICAL='https://rychlevypocty.cz/kontakt.html';
const OWNER='Martin Šilinger';
const EMAIL='rychlevypocty@seznam.cz';

export function renderContactStudio(source,template){
 if(typeof source!=='string'||!/^<!doctype html>/i.test(source))throw Error('Invalid contact source');
 if(getCanonical(source)!==CANONICAL)throw Error('Contact canonical changed');
 if(!source.includes('<title>'+TITLE+'</title>')||!source.includes('content="'+DESCRIPTION+'"'))
  throw Error('Contact SEO identity changed');
 if(!source.includes('<meta name="robots" content="index,follow">'))throw Error('Contact robots drift');
 const main=extractMain(source);
 if(!main)throw Error('Missing source Contact main');
 const facts=[
  'Napište přímo Martinu Šilingerovi','rychlevypocty@seznam.cz','Martin Šilinger',
  'Chyba ve výpočtu','Neaktuální zdroj','Návrh nástroje','Obecný dotaz',
  'Uvádějte pouze údaje potřebné k vyřízení dotazu'
 ];
 for(const fact of facts)if(!main.toLowerCase().includes(fact.toLowerCase()))
  throw Error('Contact factual provenance missing: '+fact);
 if(!main.includes('<strong>E-mail</strong><span>'+EMAIL+'</span>')||
    !main.includes('<strong>Provozovatel</strong><span>'+OWNER+'</span>'))
  throw Error('Primary Contact owner/email provenance changed');
 if(!main.includes('Kontaktní adresa je <a href="mailto:'+EMAIL+'">'+EMAIL+'</a>'))
  throw Error('Contact email link provenance changed');
 const json=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
 if(!json)throw Error('Source Contact JSON-LD missing');
 const data=JSON.parse(json);
 if(!data['@graph']?.some(x=>x['@type']==='WebPage'&&x.url===CANONICAL))
  throw Error('Source Contact structured identity changed');
 if(typeof template!=='string'||!/^<!doctype html>/i.test(template))throw Error('Invalid Contact template');
 if(getCanonical(template)!==CANONICAL||!template.includes('<title>'+TITLE+'</title>')||
    !template.includes('content="'+DESCRIPTION+'"'))throw Error('Template Contact identity drift');
 if(!template.includes('<meta name="robots" content="noindex,nofollow,noarchive">'))
  throw Error('Preview Contact noindex required');
 for(const marker of ['{{JSONLD}}','{{HEADER}}','{{FOOTER}}'])
  if(template.split(marker).length!==2)throw Error('Invalid Contact marker '+marker);
 const html=template
  .replace('{{JSONLD}}',json)
  .replace('{{HEADER}}',renderHeaderV2({catalogHref:'/rv3/poc/katalog-v2.html',active:'/kontakt.html'})
    .replaceAll('href="/jak-pocitame.html"','href="/rv3/studio/jak-pocitame.html"'))
  .replace('{{FOOTER}}',renderFooterV2());
 if((html.match(/<h1\b/gi)||[]).length!==1||(html.match(/<main\b/gi)||[]).length!==1)
  throw Error('Contact landmarks invalid');
 if(html.includes('rv-trust-v7.css')||html.includes('trust-nav')||html.includes('hero-panel'))
  throw Error('Legacy contact template leaked');
 if(!html.includes('mailto:'+EMAIL))throw Error('Contact email went missing');
 return {html,manifest:{
  kind:'bespoke-contact-studio',source:SOURCE,preview:'/rv3/studio/kontakt.html',
  canonical:CANONICAL,title:TITLE,previewOnly:true,
  sourceSha256:createHash('sha256').update(source).digest('hex'),
  art:'/rv3/assets/contact-postbox.svg',
  css:['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/contact.css'],
  enhancement:'/rv3/sitewide/contact-compose.js',
  designStatus:'VISUAL_REVIEW_PENDING',browserQa:'NOT_VERIFIED'
 }};
}
