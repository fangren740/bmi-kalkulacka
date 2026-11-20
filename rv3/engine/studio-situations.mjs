/* RV3 Situations: 28 real decisions from original source; new decision-first composition. */
import {createHash} from 'node:crypto';
import {extractMain,getCanonical} from './renderer.mjs';
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';

const SOURCE_BLOB='46573d69c6d07b2e72ff1221a8fd5edc49a6dcdd';
const CANONICAL='https://rychlevypocty.cz/situace.html';
const TITLE='Co právě řešíte? Vyberte situaci a správný výpočet | RychléVýpočty.cz';
const DESCRIPTION='Začněte tím, co právě řešíte: výplata, práce, bydlení, rozpočet, energie, auto, rodina, podnikání nebo rekonstrukce. RychléVýpočty.cz vás nasměrují na správný návod a kalkulačku.';
const GROUPS=Object.freeze([
 {id:'penize',name:'Peníze doma',subtitle:'Výdaje, úspory a finanční rezerva',emoji:'◈'},
 {id:'prace',name:'Práce',subtitle:'Nová nabídka, mzda a smlouvy',emoji:'↗'},
 {id:'bydleni',name:'Bydlení',subtitle:'Byt, hypotéka a náklady',emoji:'⌂'},
 {id:'energie',name:'Energie',subtitle:'Spotřeba, vytápění a úspory',emoji:'ϟ'},
 {id:'auto',name:'Auto',subtitle:'Pořízení a provoz vozidla',emoji:'◎'},
 {id:'rodina',name:'Rodina',subtitle:'Děti, rodičovství a výdaje',emoji:'♡'},
 {id:'podnikani',name:'Podnikání',subtitle:'Příjmy, ceny a fakturace',emoji:'▤'}
]);
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const plain=s=>String(s).replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').trim();
export function parseSituations(source){
 if(typeof source!=='string'||!/^<!doctype html>/i.test(source))throw Error('Situation source invalid');
 const blob=createHash('sha1').update('blob '+Buffer.byteLength(source,'utf8')+'\0'+source).digest('hex');
 if(blob!==SOURCE_BLOB)throw Error('Situation source fingerprint drift — verify links/content');
 if(getCanonical(source)!==CANONICAL||!source.includes('<title>'+TITLE+'</title>')||
 !source.includes('<meta name="description" content="'+DESCRIPTION+'">'))
  throw Error('Situation SEO identity drift');
 const main=extractMain(source);
 if(!main)throw Error('Situation main missing');
 const matches=[...main.matchAll(/<article class="situation-row" data-situation data-topic="([^"]+)" data-keywords="([^"]+)">([\s\S]*?)<\/article>/g)];
 if(matches.length!==28)throw Error('Expected 28 actual situations, found '+matches.length);
 const situations=matches.map((m,i)=>{
  const html=m[3],group=GROUPS.find(g=>g.name===m[1]);
  const body=html.match(/<div class="situation-main"><small>([\s\S]*?)<\/small><strong>([\s\S]*?)<\/strong><p>([\s\S]*?)<\/p><\/div>/);
  const links=[...html.matchAll(/<a href="([^"]+)">([\s\S]*?)<\/a>/g)]
   .map(x=>({url:x[1],label:plain(x[2]).replace(/\s*→\s*$/,'')}));
  if(!group||!body||links.length!==2||links.some(l=>!/^\/[a-z0-9-]+\.html$/.test(l.url)))
   throw Error('Invalid situation row '+i);
  return {id:'s'+(i+1),group:group.id,topic:m[1],keywords:plain(m[2]),
   tag:plain(body[1]),title:plain(body[2]),description:plain(body[3]),links};
 });
 for(const group of GROUPS)
  if(situations.filter(s=>s.group===group.id).length!==4)
   throw Error('Situation group must contain four entries: '+group.id);
 return situations;
}
export function renderSituationsStudio(source,template){
 const situations=parseSituations(source);
 if(typeof template!=='string'||!/^<!doctype html>/i.test(template))throw Error('Invalid situation template');
 if(getCanonical(template)!==CANONICAL||!template.includes('<title>'+TITLE+'</title>')||
 !template.includes('<meta name="description" content="'+DESCRIPTION+'">')||
 !template.includes('<meta name="robots" content="noindex,nofollow,noarchive">'))
  throw Error('Situation template SEO/robots mismatch');
 const tags=['{{JSONLD}}','{{HEADER}}','{{FOOTER}}','{{TOPICS}}','{{GROUPS}}'];
 for(const t of tags)if(template.split(t).length!==2)throw Error('Invalid situation placeholder '+t);
 const schemas=[...source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>m[1]);
 if(schemas.length!==2)throw Error('Situations original JSON-LD missing');
 const nav=GROUPS.map(g=>'<button type="button" class="rv3s-topic" data-filter="'+g.id+'" aria-pressed="false">'+
   '<span class="rv3s-topic-symbol" aria-hidden="true">'+g.emoji+'</span><span>'+esc(g.name)+'</span></button>').join('');
 const groupHtml=GROUPS.map(g=>{
  const cards=situations.filter(x=>x.group===g.id).map(s=>
   '<article class="rv3s-card" data-situation="'+s.id+'" data-group="'+s.group+
   '" data-search="'+esc([s.title,s.description,s.keywords,s.topic,s.tag].join(' '))+'">'+
   '<div class="rv3s-card-top"><span class="rv3s-category">'+esc(s.tag)+'</span></div>'+
   '<h3>'+esc(s.title)+'</h3><p>'+esc(s.description)+'</p>'+
   '<div class="rv3s-card-links"><a class="rv3s-primary" href="'+esc(s.links[0].url)+'">'+esc(s.links[0].label)+' <span aria-hidden="true">↗</span></a>'+
   '<a class="rv3s-secondary" href="'+esc(s.links[1].url)+'">'+esc(s.links[1].label)+' <span aria-hidden="true">→</span></a></div></article>').join('');
  return '<section class="rv3s-group" data-group-section="'+g.id+'" id="'+g.id+'">'+
   '<div class="rv3s-group-heading"><div><span class="rv3s-group-kicker">'+esc(g.name.toUpperCase())+'</span>'+
   '<h2>'+esc(g.name)+'</h2><p>'+esc(g.subtitle)+'</p></div><span class="rv3s-group-count">4 situace</span></div>'+
   '<div class="rv3s-cards">'+cards+'</div></section>';
 }).join('');
 let html=template.replace('{{JSONLD}}',schemas.map(s=>'<script type="application/ld+json">'+s+'</script>').join('\n'))
 .replace('{{HEADER}}',renderHeaderV2({catalogHref:'/rv3/poc/katalog-v2.html',active:'/situace.html'}))
 .replace('{{FOOTER}}',renderFooterV2())
 .replace('{{TOPICS}}',nav).replace('{{GROUPS}}',groupHtml);
 if((html.match(/<main\b/g)||[]).length!==1||(html.match(/<h1\b/g)||[]).length!==1||
 (html.match(/class="rv3s-card"/g)||[]).length!==28)throw Error('Situation page integrity');
 return {html,manifest:{kind:'decision-first-situation-studio',source:'situace.html',
  preview:'/rv3/studio/situace.html',canonical:CANONICAL,previewOnly:true,
  sourceSha256:createHash('sha256').update(source).digest('hex'),sourceSituationCount:28,
  sourceGroupCount:7,sourceLinkCount:56,linksVerifiedInBuild:false,
  browserQa:'NOT_VERIFIED',ownerApproval:'PENDING'}};
}
