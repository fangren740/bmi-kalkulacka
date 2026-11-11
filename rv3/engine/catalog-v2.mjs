/* Brand-first, decision-first V3 catalogue v2. All 135 original routes remain in SSR HTML. */
import {renderHeaderV2,renderFooterV2} from './shell-v2.mjs';
const esc=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const pathRx=/^\/[a-z0-9-]+\.html$/;
const preview='/rv3/poc/katalog-v2.html';
export function renderCatalogV2(tools,taxonomy){
 if(!Array.isArray(tools)||tools.length!==135)throw Error('V2 registry mismatch: expected 135 tools');
 if(taxonomy?.schema!==1||taxonomy.groups?.length!==8)throw Error('V2 taxonomy version/category count mismatch');
 const byPath=new Map();
 for(const tool of tools){
  if(!pathRx.test(tool.url)||byPath.has(tool.url))throw Error('Invalid or duplicate source tool: '+tool.url);
  byPath.set(tool.url,tool);
 }
 const assigned=new Set();
 for(const group of taxonomy.groups){
  if(!/^[a-z]+$/.test(group.id)||!Array.isArray(group.routes)||!group.routes.length)throw Error('Invalid V2 group');
  if(!group.title||!group.intro||!Array.isArray(group.featured))throw Error('Missing V2 category metadata');
  for(const url of group.routes){
   if(!byPath.has(url)||assigned.has(url))throw Error('Missing or duplicate route in category '+group.id+': '+url);
   assigned.add(url);
  }
  for(const url of group.featured)if(!group.routes.includes(url))throw Error('Featured route outside group: '+url);
 }
 if(assigned.size!==tools.length)throw Error('Unclassified tools: '+tools.filter(t=>!assigned.has(t.url)).map(t=>t.url));
 if(taxonomy.quickRoutes?.length!==6)throw Error('Six editorial quick paths required');
 for(const route of taxonomy.quickRoutes)if(!byPath.has(route.url))throw Error('Quick route not in verified catalog: '+route.url);
 const renderToolLink=(url,group,lead)=>{
  const t=byPath.get(url),search=[t.title,t.type,t.desc,t.keywords,taxonomy.aliases?.[url]||''].filter(Boolean).join(' ').slice(0,480);
  return '<li><a class="rv3d-tool-link '+(lead?'rv3d-tool-featured':'rv3d-tool-compact')+
   '" href="'+esc(url)+'" data-v3-tool data-category="'+esc(group.id)+'" data-title="'+esc(t.title)+'"'+
   ' data-description="'+esc(t.desc||'')+'" data-search="'+esc(search)+'">'+
   '<span class="rv3d-tool-copy"><strong>'+esc(t.title)+'</strong>'+
   (lead?'<small>'+esc(t.desc||'')+'</small>':'')+
   '</span><span class="rv3d-link-arrow" aria-hidden="true">↗</span></a></li>';
 };
 const domainMarkup=taxonomy.groups.map((group,i)=>{
  const chosen=new Set(group.featured),extra=group.routes.filter(url=>!chosen.has(url));
  return '<details class="rv3d-domain" data-v3-category="'+esc(group.id)+'">'+
   '<summary><span class="rv3d-domain-index" aria-hidden="true">'+String(i+1).padStart(2,'0')+'</span>'+
   '<span class="rv3d-domain-identity"><strong>'+esc(group.title)+'</strong><small>'+esc(group.intro)+'</small></span>'+
   '<span class="rv3d-domain-count">'+group.routes.length+' nástrojů</span>'+
   '<span class="rv3d-domain-toggle" aria-hidden="true">+</span></summary>'+
   '<div class="rv3d-domain-content"><p class="rv3d-domain-caption">Doporučený začátek</p>'+
   '<ul class="rv3d-tool-list">'+group.featured.map(url=>renderToolLink(url,group,true)).join('')+'</ul>'+
   (extra.length?'<details class="rv3d-more-tools"><summary>Všechny ostatní nástroje v této oblasti <span>'+extra.length+'</span></summary>'+
    '<ul class="rv3d-more-list">'+extra.map(url=>renderToolLink(url,group,false)).join('')+'</ul></details>':'')+
   '</div></details>';
 }).join('');
 const quick=taxonomy.quickRoutes.map((entry,i)=>{
   return '<li><a href="'+esc(entry.url)+'"><span class="rv3d-quick-ordinal">'+String(i+1).padStart(2,'0')+'</span>'+
    '<span class="rv3d-quick-copy"><strong>'+esc(entry.question)+'</strong><small>'+esc(entry.label)+'</small></span>'+
    '<span class="rv3d-quick-arrow" aria-hidden="true">↗</span></a></li>';
 }).join('');
 const html='<!doctype html><html lang="cs"><head>'+
  '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
  '<meta name="robots" content="noindex,nofollow,noarchive">'+
  '<meta name="color-scheme" content="light"><meta name="theme-color" content="#f8faf7">'+
  '<title>Katalog kalkulaček V3 | Najděte správný výpočet – RychléVýpočty.cz [NÁHLED]</title>'+
  '<meta name="description" content="Najděte správnou kalkulačku podle své situace. Přehledný rozcestník, šest rychlých cest a všech 135 nástrojů po oblastech.">'+
  '<link rel="stylesheet" href="/rv3/catalog-v2.css">'+
  '<script type="module" src="/rv3/catalog-v2-ui.mjs"></script>'+
  '</head><body class="rv3d-page">'+
  '<a class="rv3d-skip" href="#main">Přeskočit na obsah</a>'+
  renderHeaderV2({catalogHref:preview})+
  '<main id="main">'+
  '<section class="rv3d-hero"><div class="rv3d-wrap rv3d-hero-grid">'+
  '<div class="rv3d-discovery">'+
  '<span class="rv3d-kicker"><span class="rv3d-kicker-line" aria-hidden="true"></span> PRŮVODCE VÝPOČTY</span>'+
  '<h1>Co dnes potřebujete <em>spočítat?</em></h1>'+
  '<p class="rv3d-hero-description">Řekněte nám, co řešíte. Nabídneme odpovídající kalkulačku — bez procházení dlouhých seznamů.</p>'+
  '<div class="rv3d-find"><label for="rv3d-search">Hledat kalkulačku nebo otázku</label>'+
  '<div class="rv3d-find-input"><span class="rv3d-find-icon" aria-hidden="true">⌕</span>'+
  '<input id="rv3d-search" type="search" autocomplete="off" spellcheck="false" placeholder="Například výplata, hypotéka, dovolená…" '+
  'aria-controls="rv3d-search-results" aria-expanded="false">'+
  '<span class="rv3d-shortcut" aria-hidden="true">Ctrl K</span></div>'+
  '<div id="rv3d-search-results" class="rv3d-search-results" hidden>'+
  '<div class="rv3d-search-head"><span id="rv3d-search-state" role="status" aria-live="polite"></span>'+
  '<button type="button" id="rv3d-clear">Zrušit hledání</button></div>'+
  '<ol id="rv3d-suggestions" class="rv3d-suggestions"></ol>'+
  '<button id="rv3d-more-results" type="button" class="rv3d-more-results" hidden></button>'+
  '<div class="rv3d-empty" id="rv3d-no-results" hidden>Pro tento dotaz nemáme shodu. Zkuste třeba „mzda“, „bydlení“ nebo „procenta“.</div>'+
  '</div></div>'+
  '<div class="rv3d-examples"><span>Například</span>'+
  '<button type="button" data-v3-query="čistá mzda">čistá mzda</button>'+
  '<button type="button" data-v3-query="hypotéka">hypotéka</button>'+
  '<button type="button" data-v3-query="dovolená">dovolená</button>'+
  '<button type="button" data-v3-query="podpora v nezaměstnanosti">podpora na pracáku</button></div>'+
  '<noscript><p>Vyhledávání využívá JavaScript. Kompletní seznam nástrojů funguje i bez něj v rozbalovacích oblastech níže.</p></noscript>'+
  '</div>'+
  '<aside class="rv3d-quick" aria-labelledby="rv3d-quick-title">'+
  '<div class="rv3d-quick-head"><span>NECHCI HLEDAT</span><h2 id="rv3d-quick-title">Začít rovnou</h2></div>'+
  '<ol>'+quick+'</ol></aside>'+
  '</div></section>'+
  '<section class="rv3d-domains" id="rv3d-domains" aria-labelledby="rv3d-domains-title"><div class="rv3d-wrap">'+
  '<div class="rv3d-domains-head"><div><span class="rv3d-kicker">NEBO VYBERTE OBLAST</span>'+
  '<h2 id="rv3d-domains-title">Všechno má <em>své místo.</em></h2></div>'+
  '<p>Otevřete jen téma, které právě řešíte. Celý katalog nemusíte procházet.</p></div>'+
  '<div class="rv3d-domain-grid">'+domainMarkup+'</div>'+
  '<p class="rv3d-count-note">Celkem 135 existujících kalkulaček v 8 přehledných oblastech. Odkazy fungují i bez vyhledávání.</p>'+
  '</div></section>'+
  '<section class="rv3d-method"><div class="rv3d-wrap"><div><strong>Vědět kolik. A také proč.</strong>'+
  '<p>Každá kalkulačka má vlastní pravidla a omezení. K výsledku patří srozumitelná metodika.</p></div>'+
  '<a href="/jak-pocitame.html">Ověření metodiky <span aria-hidden="true">↗</span></a></div></section>'+
  '</main>'+renderFooterV2()+
  '</body></html>';
 return {html,report:{source:taxonomy.source,groups:taxonomy.groups.map(g=>({id:g.id,count:g.routes.length})),total:tools.length,
  url:preview,previewOnly:true,featured:taxonomy.quickRoutes.map(r=>r.url)}};
}
