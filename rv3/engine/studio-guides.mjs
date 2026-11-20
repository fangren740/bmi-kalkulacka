/* RV3 editorial guide library — curated source-backed navigation, no synthetic guides. */
import {createHash} from 'node:crypto';
import {extractMain,getCanonical} from './renderer.mjs';
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';

const SOURCE_SHA='ff2342ca059583c84fab6961c9cb1d295489a376';
const CANONICAL='https://rychlevypocty.cz/navody.html';
const TITLE='Praktické návody pro práci, daně, bydlení a domácnost | RychléVýpočty.cz';
const DESC='34 praktických návodů pro práci a mzdu, daně, bydlení, domácí rozpočet a energie. Najděte správný postup podle situace a pokračujte navazující kalkulačkou.';
const FAMILIES=Object.freeze([
 {id:'prace',title:'Práce a mzda',subtitle:'Od pracovní nabídky až po výplatní pásku'},
 {id:'dane',title:'Daně a povinnosti',subtitle:'Co vyřídit, vypočítat a na co nezapomenout'},
 {id:'bydleni',title:'Bydlení a hypotéka',subtitle:'Rozhodnutí před podpisem smlouvy'},
 {id:'rozpocet',title:'Rodinný rozpočet',subtitle:'Příjmy, výdaje a finanční rezerva'},
 {id:'energie',title:'Energie a domácnost',subtitle:'Spotřeba, vyúčtování a úspory'}
]);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const plain=s=>String(s).replace(/<[^>]*>/g,'').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').trim();
const goodUrl=u=>/^\/[a-z0-9-]+\.html$/.test(u);

export function parseGuides(source){
 if(typeof source!=='string'||!/^<!doctype html>/i.test(source))throw Error('Invalid guide source');
 const sha=createHash('sha1').update('blob '+Buffer.byteLength(source,'utf8')+'\0'+source).digest('hex');
 if(sha!==SOURCE_SHA)throw Error('Guide source SHA drift: manual review required');
 if(getCanonical(source)!==CANONICAL||!source.includes('<title>'+TITLE+'</title>')||
  !source.includes('<meta name="description" content="'+DESC+'">'))
  throw Error('Guide SEO source drift');
 const main=extractMain(source);
 if(!main)throw Error('No guide main');
 const groups=[...main.matchAll(/<section class="collection" id="([^"]+)">([\s\S]*?)<\/section>/g)];
 if(groups.length!==5)throw Error('Expected five source guide collections');
 const collected=groups.map((m,i)=>{
  const id=m[1],html=m[2];
  if(id!==FAMILIES[i].id)throw Error('Guide collection order changed');
  const heading=html.match(/<div class="collection-intro">[\s\S]*?<h3>([^<]+)<\/h3><p>([\s\S]*?)<\/p>/);
  const hub=html.match(/<a class="collection-hub" href="([^"]+)">/);
  const featured=html.match(/<a class="feature-guide"[^>]*data-keywords="([^"]+)" href="([^"]+)">[\s\S]*?<strong>([^<]+)<\/strong><p>([\s\S]*?)<\/p>/);
  const rows=[...html.matchAll(/<a class="guide-row"[^>]*data-keywords="([^"]+)" href="([^"]+)">[\s\S]*?<strong>([^<]+)<\/strong><span>([\s\S]*?)<\/span>/g)];
  const strip=html.match(/<div class="calc-strip">([\s\S]*?)<\/div>/);
  if(!heading||!hub||!featured||!strip||!goodUrl(hub[1]))throw Error('Guide source missing evidence for '+id);
  const calculators=[...strip[1].matchAll(/<a href="([^"]+)">([^<]+)<\/a>/g)].map(x=>({url:x[1],title:plain(x[2])}));
  const guides=[{url:featured[2],title:plain(featured[3]),description:plain(featured[4]),keywords:plain(featured[1]),featured:true},
   ...rows.map(x=>({url:x[2],title:plain(x[3]),description:plain(x[4]),keywords:plain(x[1]),featured:false}))];
  if(guides.some(x=>!goodUrl(x.url))||calculators.some(x=>!goodUrl(x.url))||!guides.length||calculators.length<2)
   throw Error('Guide source URL problem in '+id);
  return {id,title:plain(heading[1]),description:plain(heading[2]),hub:hub[1],guides,calculators};
 });
 const extras=[...main.matchAll(/<article class="other-card"[^>]*>[\s\S]*?<h3>([^<]+)<\/h3><p>([\s\S]*?)<\/p><a data-guide[^>]*data-keywords="([^"]+)" href="([^"]+)">[\s\S]*?<\/a><a class="tool" href="([^"]+)">([^<]+)<\/a><\/article>/g)]
 .map(x=>({title:plain(x[1]),description:plain(x[2]),keywords:plain(x[3]),url:x[4],calculator:x[5],calculatorTitle:plain(x[6])}));
 const total=collected.reduce((n,g)=>n+g.guides.length,0)+extras.length;
 if(total!==34||extras.length!==3||new Set([...collected.flatMap(g=>g.guides.map(x=>x.url)),...extras.map(x=>x.url)]).size!==34)
  throw Error('Original 34 guide destinations lost or duplicated');
 if(extras.some(x=>!goodUrl(x.url)||!goodUrl(x.calculator)))throw Error('Extra guide URL invalid');
 return {groups:collected,extras,count:total};
}
export function renderGuidesStudio(source,template){
 const data=parseGuides(source);
 if(typeof template!=='string'||!/^<!doctype html>/i.test(template)||getCanonical(template)!==CANONICAL||
  !template.includes('<title>'+TITLE+'</title>')||
  !template.includes('<meta name="description" content="'+DESC+'">')||
  !template.includes('<meta name="robots" content="noindex,nofollow,noarchive">'))
  throw Error('Invalid guide template SEO identity');
 const tokens=['{{JSONLD}}','{{HEADER}}','{{FOOTER}}','{{TABS}}','{{COLLECTIONS}}','{{EXTRAS}}'];
 for(const t of tokens)if(template.split(t).length!==2)throw Error('Guide token missing/duplicate: '+t);
 const schemas=[...source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 if(schemas.length!==2)throw Error('Guide source schema drift');
 const tabs=data.groups.map(g=>'<a href="#'+g.id+'">'+esc(FAMILIES.find(f=>f.id===g.id).title)+'</a>').join('');
 const collections=data.groups.map((g,i)=>'<section class="rv3g-collection" id="'+g.id+'" data-collection>'+
  '<div class="rv3g-collection-head"><div><span class="rv3g-eyebrow">KAPITOLA 0'+(i+1)+'</span><h2>'+esc(g.title)+'</h2>'+
  '<p>'+esc(g.description)+'</p></div><a href="'+esc(g.hub)+'">Celá oblast <span aria-hidden="true">↗</span></a></div>'+
  '<div class="rv3g-feature" data-guide data-search="'+esc([g.guides[0].title,g.guides[0].description,g.guides[0].keywords].join(' '))+'">'+
  '<div><span class="rv3g-feature-tag">DOPORUČENÝ START</span><h3>'+esc(g.guides[0].title)+'</h3><p>'+esc(g.guides[0].description)+'</p></div>'+
  '<a href="'+esc(g.guides[0].url)+'">Začít návodem <span aria-hidden="true">↗</span></a></div>'+
  '<div class="rv3g-guide-list">'+g.guides.slice(1).map((v,j)=>
   '<a class="rv3g-guide-row" data-guide data-search="'+esc([v.title,v.description,v.keywords].join(' '))+'" href="'+esc(v.url)+'">'+
   '<span class="rv3g-guide-no">'+String(j+2).padStart(2,'0')+'</span><span><strong>'+esc(v.title)+'</strong><small>'+esc(v.description)+'</small></span>'+
   '<b aria-hidden="true">↗</b></a>').join('')+'</div>'+
  '<div class="rv3g-tools"><strong>SOUVISEJÍCÍ KALKULAČKY</strong>'+
  g.calculators.map(x=>'<a href="'+esc(x.url)+'">'+esc(x.title)+' <span aria-hidden="true">→</span></a>').join('')+'</div></section>').join('');
 const extras=data.extras.map((g,i)=>'<article class="rv3g-extra" data-guide data-search="'+esc([g.title,g.description,g.keywords].join(' '))+'"><span class="rv3g-eyebrow">DALŠÍ TÉMA 0'+(i+1)+'</span><h3>'+esc(g.title)+'</h3><p>'+esc(g.description)+'</p><div class="rv3g-extra-links"><a href="'+esc(g.url)+'">Otevřít návod ↗</a><a href="'+esc(g.calculator)+'">'+esc(g.calculatorTitle)+' →</a></div></article>').join('');
 const html=template.replace('{{JSONLD}}',schemas.map(s=>'<script type="application/ld+json">'+s+'</script>').join('\n'))
  .replace('{{HEADER}}',renderHeaderV2({catalogHref:'/rv3/poc/katalog-v2.html',active:'/navody.html'}))
  .replace('{{FOOTER}}',renderFooterV2()).replace('{{TABS}}',tabs)
  .replace('{{COLLECTIONS}}',collections).replace('{{EXTRAS}}',extras);
 if((html.match(/<h1\b/g)||[]).length!==1||(html.match(/<main\b/g)||[]).length!==1||
  (html.match(/data-guide(?:\s|>)/g)||[]).length!==34)throw Error('Guide renderer integrity');
 return {html,manifest:{kind:'editorial-guide-library',source:'navody.html',preview:'/rv3/studio/navody.html',
  canonical:CANONICAL,sourceSha256:createHash('sha256').update(source).digest('hex'),
  previewOnly:true,groups:5,guides:34,uniqueGuideDestinations:34,
  linkValidation:'BUILD_TIME',browserQa:'NOT_VERIFIED',ownerApproval:'PENDING'}};
}
