import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderContactStudio} from '../../rv3/engine/studio-contact.mjs';
import {createContactMailto,mountContactComposer,mountCopyContact,CONTACT_TYPES,CONTACT_HINTS,CONTACT_EMAIL} from '../../rv3/sitewide/contact-compose.js';
import {extractMain,getCanonical} from '../../rv3/engine/renderer.mjs';

const from=path=>readFileSync(new URL('../../'+path,import.meta.url),'utf8');
const source=from('kontakt.html');
const template=from('rv3/engine/contact.template.html');
const css=from('rv3/sitewide/contact.css');
const svg=from('rv3/assets/contact-postbox.svg');
const about=from('o-nas.html');
const privacy=from('ochrana-osobnich-udaju.html');
const render=()=>renderContactStudio(source,template);

test('contact: independent, bespoke layout with immutable source facts',()=>{
 const {html,manifest}=render();
 assert.equal(manifest.kind,'bespoke-contact-studio');
 assert.equal(manifest.source,'kontakt.html');
 assert.equal(manifest.preview,'/rv3/studio/kontakt.html');
 assert.equal(manifest.previewOnly,true);
 assert.equal(manifest.designStatus,'VISUAL_REVIEW_PENDING');
 assert.equal(manifest.browserQa,'NOT_VERIFIED');
 assert.notEqual(extractMain(html),extractMain(source));
 for(const legacy of ['rv-trust-v7.css','trust-nav','hero-panel','class="card"'])
  assert.ok(!html.includes(legacy),'Legacy layout leaked: '+legacy);
});

test('contact: exact metadata and structured identity, preview index blocked',()=>{
 const {html,manifest}=render();
 assert.equal(getCanonical(html),getCanonical(source));
 assert.equal(manifest.title,'Kontakt | RychléVýpočty.cz');
 assert.match(manifest.sourceSha256,/^[a-f0-9]{64}$/);
 assert.match(html,/<meta name="robots" content="noindex,nofollow,noarchive">/);
 assert.match(html,/<meta name="description" content="Kontakt na Martina Šilingera/);
 assert.equal((html.match(/<h1\b/gi)||[]).length,1);
 assert.equal((html.match(/<main\b/gi)||[]).length,1);
 assert.equal((html.match(/<script\b/gi)||[]).length,2,'Only original JSON-LD and local JS');
 const originalLD=source.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i)?.[1];
 assert.ok(originalLD&&html.includes(originalLD),'Original schema changed');
 for(const placeholder of ['{{JSONLD}}','{{HEADER}}','{{FOOTER}}'])assert.ok(!html.includes(placeholder));
});

test('contact: visual identity, local icon references and responsive artwork',()=>{
 const {html,manifest}=render();
 assert.ok(html.includes('src="/logo-rv-v32.svg"'));
 for(const style of ['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/contact.css'])
  assert.ok(html.includes('href="'+style+'"'));
 assert.deepEqual(manifest.css,['/rv3/catalog-v2.css','/rv3/catalog-v3-theme.css','/rv3/sitewide/contact.css']);
 assert.equal(manifest.art,'/rv3/assets/contact-postbox.svg');
 assert.ok(html.includes('src="/rv3/assets/contact-postbox.svg"'));
 assert.match(svg,/<title\b/);
 assert.match(svg,/<desc\b/);
 assert.match(svg,/url\(#shadow\)/);
 assert.match(css,/font-family:Georgia/);
 assert.match(css,/font-style:italic/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/@media\(max-width:620px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.ok(Buffer.byteLength(svg,'utf8')<9500);
 assert.ok(Buffer.byteLength(css,'utf8')<17000);
 assert.ok((html.match(/about-icons\.svg#/g)||[]).length>=12);
});

test('contact: direct owner, four truthful intents and accessible mailto composer',()=>{
 const {html}=render();
 assert.ok(source.includes('Martin Šilinger'));
 assert.ok(source.includes('rychlevypocty@seznam.cz'));
 assert.ok(about.includes('fyzickou osobou bez přiděleného IČO'));
 assert.ok(privacy.includes('e-mailová adresa'));
 assert.ok(html.includes('Martin Šilinger'));
 assert.ok(html.includes('rychlevypocty@seznam.cz'));
 assert.ok(html.includes('data-copy-contact'));
 assert.ok(html.includes('data-copy-status'));
 assert.equal((html.match(/type="radio" name="type"/g)||[]).length,4);
 assert.equal((html.match(/type="radio" name="type" value="[^"]+" checked/g)||[]).length,1);
 for(const type of CONTACT_TYPES)assert.ok(html.includes('value="'+type+'"'));
 for(const id of ['napsat','rv3c-page','rv3c-detail'])assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('data-contact-compose action="mailto:rychlevypocty@seznam.cz" method="post" enctype="text/plain"'));
 assert.ok(html.includes('data-contact-tips'));
 assert.ok(html.includes('role="status" aria-live="polite" data-contact-status'));
 assert.ok(html.includes('type="submit"'));
 assert.ok(html.includes('Nevkládejte')===false);
 assert.ok(html.includes('Neuvádějte rodná čísla'));
});

test('contact: internal guidance links point to actual source-backed routes',()=>{
 const {html}=render();
 for(const href of ['/rv3/studio/jak-pocitame.html','/rv3/studio/redakcni-zasady.html','/rv3/studio/o-nas.html','/ochrana-osobnich-udaju.html','/rv3/poc/katalog-v2.html'])
  assert.ok(html.includes('href="'+href+'"'),'Missing '+href);
 assert.ok(html.includes('href="#napsat"'));
 assert.ok(html.includes('href="mailto:rychlevypocty@seznam.cz"'));
});

test('contact: mailto composer safely encodes special characters, no HTTP endpoint',()=>{
 assert.equal(CONTACT_EMAIL,'rychlevypocty@seznam.cz');
 assert.deepEqual(CONTACT_TYPES,['Chyba ve výpočtu','Neaktuální zdroj','Návrh nástroje','Obecný dotaz']);
 assert.deepEqual(Object.keys(CONTACT_HINTS),CONTACT_TYPES);
 const href=createContactMailto({
  type:'Chyba ve výpočtu',page:'/cista-mzda.html?rocni=2026&test=<a>',
  detail:'Vstupy 30 000 Kč; chyba + 5 % & <tag>'
 });
 assert.ok(href.startsWith('mailto:rychlevypocty@seznam.cz?subject='));
 const params=new URL(href.replace('mailto:','https://example.test/')).searchParams;
 assert.equal(params.get('subject'),'RychléVýpočty.cz — Chyba ve výpočtu');
 assert.ok(params.get('body').includes('/cista-mzda.html?rocni=2026&test=<a>'));
 assert.ok(params.get('body').includes('30 000 Kč; chyba + 5 % & <tag>'));
 assert.ok(!href.includes('<tag>')&&!href.includes('&test=<a>'));
 assert.equal(createContactMailto({type:'Obecný dotaz',detail:'Zajímá mě kalkulačka'}).includes('Neuvedena'),true);
});

test('contact: invalid or overlong inputs cannot trigger mail client',()=>{
 const data={type:'Obecný dotaz',page:'',detail:'Potřebuji vysvětlit výsledek'};
 for(const bad of [
  {...data,type:'Neověřený kontakt'}, {...data,type:''},
  {...data,page:5},{...data,page:'x'.repeat(251)},
  {...data,detail:''},{...data,detail:'   '},{...data,detail:'x'.repeat(1801)}
 ])assert.throws(()=>createContactMailto(bad),TypeError);
 assert.equal(mountContactComposer(null,()=>{}),false);
 assert.equal(mountCopyContact(null,async()=>{}),false);
});

test('contact: actual user controls switch hints and open mailto only after submit',()=>{
 const selection=CONTACT_TYPES.map((value,i)=>({value,checked:i===0,handlers:{},addEventListener(event,fn){this.handlers[event]=fn}}));
 const nodes={
  '[name="page"]':{value:'/kontakt.html'},
  '[name="detail"]':{value:'Testovací zpráva'},
  '[data-contact-tips]':{ownerDocument:{createElement:tag=>({tag,textContent:''})},children:[],replaceChildren(...items){this.children=items}},
  '[data-contact-guidance]':{textContent:''},
  '[data-contact-status]':{textContent:''}
 };
 let submit;
 const form={
  querySelectorAll:selector=>selector==='[name="type"]'?selection:[],
  querySelector:selector=>nodes[selector],
  addEventListener:(name,callback)=>{if(name==='submit')submit=callback;}
 };
 const opened=[];
 assert.equal(mountContactComposer(form,url=>opened.push(url)),true);
 assert.equal(opened.length,0,'No automatic mailto open on mount');
 selection[0].checked=false;
 selection[2].checked=true;
 selection[2].handlers.change();
 assert.deepEqual(nodes['[data-contact-tips]'].children.map(x=>x.textContent),CONTACT_HINTS['Návrh nástroje']);
 assert.match(nodes['[data-contact-guidance]'].textContent,/nástroj/);
 let prevented=false;
 submit({preventDefault(){prevented=true;}});
 assert.equal(prevented,true);
 assert.equal(opened.length,1);
 assert.match(decodeURIComponent(opened[0]),/Návrh nástroje/);
 nodes['[name="detail"]'].value='';
 submit({preventDefault(){}});
 assert.equal(opened.length,1,'Bad content must not open new mailto');
 assert.match(nodes['[data-contact-status]'].textContent,/Zkontrolujte/);
});

test('contact: copy button requires click and communicates both success and failure',async()=>{
 const messages={textContent:''};
 let handler;
 const button={
  closest:selector=>selector==='.rv3c-email-card'?{querySelector:()=>messages}:null,
  addEventListener:(type,cb)=>{if(type==='click')handler=cb;}
 };
 const copied=[];
 assert.equal(mountCopyContact(button,async value=>{copied.push(value)}),true);
 assert.equal(copied.length,0);
 await handler();
 assert.deepEqual(copied,[CONTACT_EMAIL]);
 assert.match(messages.textContent,/zkopírována/);
 const failed={textContent:''};
 let handler2;
 mountCopyContact({closest:()=>({querySelector:()=>failed}),addEventListener:(t,cb)=>{handler2=cb;}},async()=>{throw Error('clipboard blocked')});
 await handler2();
 assert.match(failed.textContent,/Kopírování se nezdařilo/);
});

test('contact: mutations to owner, SEO, mail and robots fail closed',()=>{
 assert.throws(()=>renderContactStudio(source.replace('https://rychlevypocty.cz/kontakt.html','https://fake.test/kontakt.html'),template),/canonical/i);
 assert.throws(()=>renderContactStudio(source.replace('rychlevypocty@seznam.cz','fake@example.test'),template),/provenance|factual/i);
 assert.throws(()=>renderContactStudio(source.replace('Martin Šilinger','Fiktivní tým'),template),/provenance|factual/i);
 assert.throws(()=>renderContactStudio(source.replace('content="index,follow"','content="noindex,nofollow"'),template),/robots/i);
 assert.throws(()=>renderContactStudio(source,template.replace('noindex,nofollow,noarchive','index,follow')), /noindex/i);
 assert.throws(()=>renderContactStudio(source,template.replace('https://rychlevypocty.cz/kontakt.html','https://wrong.test/')), /identity/i);
});
