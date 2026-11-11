/* Build-time, progressive-enhancement V3 catalog POC generated from verified tools. */
import {header,footer} from './renderer.mjs';
const GROUPS=[
 {id:'finance',name:'Finance a bydlení',tag:'Rozhodnutí o penězích',mark:'01'},
 {id:'prace',name:'Mzdy a práce',tag:'Vaše výplata a pracovní čas',mark:'02'},
 {id:'osvc',name:'Podnikání a OSVČ',tag:'Co stojí podnikání',mark:'03'},
 {id:'domacnost',name:'Domácnost a energie',tag:'Pravidelné výdaje pod kontrolou',mark:'04'},
 {id:'rodina',name:'Rodina a dávky',tag:'Rozpočet rodiny',mark:'05'},
 {id:'auto',name:'Auto a doprava',tag:'Provoz bez překvapení',mark:'06'},
 {id:'stavba',name:'Stavba a rekonstrukce',tag:'Materiály a rozpočty',mark:'07'},
 {id:'utility',name:'Rychlé přepočty',tag:'Data, jednotky a každodenní výpočty',mark:'08'},
 {id:'zdravi',name:'Zdraví a kalendář',tag:'Osobní orientační výpočty',mark:'09'}
];
const escape=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
function categoryAt(i){
 // Temporary supervised mapping of the current grouped rv-tool-index.js order.
 // Deliberately hard-fail if upstream list changes shape or the named sentinels move.
 if(i<=18)return 'finance';
 if(i<=37||i>=125&&i<=128)return 'prace';
 if(i<=54||i===129)return 'osvc';
 if(i<=69)return 'domacnost';
 if(i<=79||i===130)return 'rodina';
 if(i<=86||i===124)return 'auto';
 if(i<=104||i>=131&&i<=133)return 'stavba';
 if(i<=119||i===134)return 'utility';
 return 'zdravi';
}
export function renderStudioCatalog(items){
 if(!Array.isArray(items)||items.length!==135)throw Error('Catalog must contain exactly 135 verified tools');
 const sentinels={0:'Hypoteční kalkulačka',19:'Kalkulačka čisté mzdy',38:'OSVČ daňová kalkulačka 2026',
   55:'Kalkulačka čistého výnosu z pronájmu',70:'Superdávka kalkulačka 2026',
   80:'Benzín vs diesel vs elektro kalkulačka',87:'Kalkulačka rekonstrukce bytu a domu',
   105:'Kalkulačka procent',119:'BMI kalkulačka',124:'Kalkulačka nabíjení elektromobilu',
   125:'Zkušební doba kalkulačka 2026',130:'Životní minimum kalkulačka 2026',134:'Přepočet receptu podle velikosti formy'};
 for(const [ordinal,name] of Object.entries(sentinels)){
  if(items[Number(ordinal)]?.title!==name)throw Error('Source order changed at '+ordinal+': review taxonomy');
 }
 const urls=new Set();
 const grouped=new Map(GROUPS.map(g=>[g.id,[]]));
 items.forEach((entry,i)=>{
  if(!/^\/[a-z0-9-]+\.html$/.test(entry?.url)||urls.has(entry.url))throw Error('Invalid/duplicate tool URL: '+entry?.url);
  urls.add(entry.url);
  const category=categoryAt(i),group=grouped.get(category);
  if(!group)throw Error('Unknown group for entry '+i);
  group.push(entry);
 });
 const categories=GROUPS.map(g=>'<button type="button" data-filter="'+g.id+'" aria-pressed="false">'+
   escape(g.name)+' <small>'+grouped.get(g.id).length+'</small></button>').join('');
 const sections=GROUPS.map(g=>{
  const cards=grouped.get(g.id).map((r,i)=>{
   const search=[r.title,r.desc,r.type,r.keywords].filter(Boolean).join(' ').slice(0,320);
   return '<article class="rv3c-card" data-tool-card data-category="'+g.id+
     '" data-search="'+escape(search)+'"><a href="'+r.url+'"><div class="rv3c-card-top">'+
     '<span class="rv3c-card-tag">'+escape(r.type)+'</span><span class="rv3c-card-link" aria-hidden="true">↗</span></div>'+
     '<h3>'+escape(r.title)+'</h3><p>'+escape(r.desc)+'</p><span class="rv3c-card-cta">Otevřít kalkulačku <b aria-hidden="true">→</b></span>'+
     '</a></article>';
  }).join('');
  return '<section class="rv3c-group" data-group="'+g.id+'" aria-labelledby="rv3c-title-'+g.id+'">'+
   '<div class="rv3c-group-head"><div><span>'+g.mark+' / '+escape(g.tag)+'</span>'+
   '<h2 id="rv3c-title-'+g.id+'">'+escape(g.name)+'</h2></div><strong>'+grouped.get(g.id).length+' nástrojů</strong></div>'+
   '<div class="rv3c-grid">'+cards+'</div></section>';
 }).join('');
 const chips='<button type="button" data-filter="all" aria-pressed="true">Všechny <small>135</small></button>'+categories;
 const html='<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+
  '<meta name="robots" content="noindex,nofollow,noarchive"><meta name="color-scheme" content="light">'+
  '<title>Studio katalog V3 – 135 kalkulaček | RychléVýpočty.cz [PREVIEW]</title>'+
  '<meta name="description" content="Ověřovací katalog V3: 135 skutečných kalkulaček v přehledných tematických skupinách.">'+
  '<link rel="stylesheet" href="/rv3/poc-theme.css"><link rel="stylesheet" href="/rv3/catalog-studio.css">'+
  '<script defer src="/rv3/catalog-studio.js"></script></head><body class="rv3e-poc rv3c-page">'+
  '<a class="rv3c-skip" href="#main">Přeskočit na katalog</a>'+
  header({source:'studio-katalog.html',anchor:'#rv3c-search'})+
  '<main id="main"><section class="rv3c-hero"><div class="rv3e-shell rv3c-hero-grid"><div>'+
  '<span class="rv3c-eyebrow">NOVÝ KATALOG / VERZE 03</span>'+
  '<h1>Všechny výpočty.<br><em>Jedno dobré rozhodnutí.</em></h1>'+
  '<p>Nemusíte znát vzorec. Začněte tím, co právě řešíte. V katalogu jsou skutečné kalkulačky, nikoli sliby budoucích funkcí.</p>'+
  '<a href="#rv3c-directory" class="rv3c-jump">Prozkoumat nástroje <b aria-hidden="true">↘</b></a></div>'+
  '<div class="rv3c-hero-aside" aria-label="Informace o katalogu"><span>R/V · NÁSTROJE</span>'+
  '<div class="rv3c-metric">135<small>ověřených odkazů</small></div>'+
  '<div class="rv3c-seal"><span>9 tematických oblastí</span><span>Výsledek ve vašem prohlížeči</span></div>'+
  '<p>Každý odkaz vede na existující stránku. Rozhraní katalogu vzniká při sestavení, filtrování probíhá lokálně.</p></div></div></section>'+
  '<section class="rv3c-search-section" id="rv3c-directory"><div class="rv3e-shell">'+
  '<div class="rv3c-find-head"><div><span class="rv3c-eyebrow">01 / VYBERTE SVOU SITUACI</span>'+
  '<h2>Co potřebujete <em>spočítat?</em></h2></div><p>Projděte kategorii nebo napište běžný český dotaz.</p></div>'+
  '<label class="rv3c-search-label" for="rv3c-search">Hledat ve 135 kalkulačkách</label>'+
  '<div class="rv3c-input-wrap"><span aria-hidden="true">⌕</span>'+
  '<input id="rv3c-search" type="search" autocomplete="off" placeholder="Například čistá mzda, hypotéka, příplatky…" aria-controls="rv3c-list">'+
  '<kbd aria-hidden="true">⌘ / CTRL + K</kbd></div>'+
  '<div class="rv3c-filter-bar" aria-label="Filtrovat podle tématu">'+chips+'</div>'+
  '<p id="rv3c-status" class="rv3c-status" role="status" aria-live="polite">Zobrazeno 135 z 135 nástrojů</p>'+
  '<div id="rv3c-list">'+sections+'</div>'+
  '<div id="rv3c-empty" class="rv3c-empty" hidden><h2>Nic jsme nenašli.</h2>'+
  '<p>Zkuste obecnější slovo nebo vraťte filtr na všechny kategorie.</p>'+
  '<button type="button" id="rv3c-reset">Zobrazit všechny nástroje ↗</button></div>'+
  '</div></section>'+
  '<section class="rv3c-end"><div class="rv3e-shell"><strong>Od otázky k výsledku.</strong>'+
  '<p>Nástroje mají vlastní metodiku a omezení. Katalog pouze usnadňuje cestu k nim.</p>'+
  '<a href="/jak-pocitame.html">Jak výpočty ověřujeme ↗</a></div></section></main>'+
  footer()+'</body></html>';
 return {html,report:{tools:items.length,groups:GROUPS.map(g=>({id:g.id,count:grouped.get(g.id).length})),
  generated:'/rv3/poc/studio-katalog.html',previewOnly:true}};
}
