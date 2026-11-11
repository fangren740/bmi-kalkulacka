/* Preview-only V3 static layout adapter; no runtime framework. */
import {createHash} from 'node:crypto';

export const POC_ROUTES=Object.freeze([
 {source:'kalkulacky.html',type:'catalog',anchor:'#catalog-search',label:'Katalog kalkulaček'},
 {source:'hypotecni-kalkulacka.html',type:'external-js',anchor:'#kalkulacka',label:'Hypotéka'},
 {source:'dpp-dpc-kalkulacka.html',type:'inline-js',anchor:'#kalkulacka',label:'DPP / DPČ'}
]);
const escape=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const previewPath=r=>'/rv3/poc/'+r.source;
export const extractMain=h=>h.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0]??null;
export const scriptsOf=h=>[...h.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/gi)].map(m=>m[0]);
export function getCanonical(h){
 const m=h.match(/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i);
 if(!m)throw Error('Missing canonical: fail closed');
 return m[1];
}
function header(current){
 const links=POC_ROUTES.map(r=>'<a href="'+previewPath(r)+'"'+(r.source===current.source?' aria-current="page"':'')+'>'+escape(r.label)+'</a>').join('');
 const mobile=POC_ROUTES.map(r=>'<a href="'+previewPath(r)+'">'+escape(r.label)+'</a>').join('');
 return '<header class="rv3e-header"><div class="rv3e-signature" aria-hidden="true"></div>'+
 '<div class="rv3e-shell rv3e-header-row"><a href="/" class="rv3e-logo" aria-label="RychléVýpočty.cz – úvod">'+
 '<img src="/logo-rv-v32.svg" width="220" height="36" alt="RychléVýpočty.cz"></a>'+
 '<nav class="rv3e-nav" aria-label="Navigace prototypu">'+links+'</nav>'+
 '<details class="rv3e-mobile"><summary>Menu ☰</summary><nav aria-label="Mobilní navigace prototypu">'+mobile+'</nav></details></div>'+
 '<div class="rv3e-preview-strip"><div class="rv3e-shell"><span class="rv3e-live-dot" aria-hidden="true"></span>'+
 ' RV3 ENGINE / TESTOVACÍ VERZE <span class="rv3e-preview-text">Původní obsah a skripty zachovány</span>'+
 '<a href="'+escape(current.anchor)+'">Přejít k nástroji ↗</a></div></div></header>';
}
function footer(){
 return '<footer class="rv3e-footer"><div class="rv3e-shell">'+
 '<div class="rv3e-footer-top"><div><span class="rv3e-eyebrow">R/V · ENGINE PROTOTYPE</span>'+
 '<h2>Jedna identita.<br><em>Různé výpočty.</em></h2>'+
 '<p>Ověřovací návrh sdíleného vzhledu. Výpočty a metodiku poskytují existující kalkulačky.</p></div>'+
 '<a class="rv3e-footer-cta" href="/kalkulacky.html">Všechny kalkulačky ↗</a></div>'+
 '<div class="rv3e-footer-row"><a href="/" class="rv3e-footer-logo">'+
 '<img src="/logo-rv-v32.svg" width="190" height="32" alt="RychléVýpočty.cz"></a>'+
 '<nav aria-label="Patička prototypu"><a href="/jak-pocitame.html">Metodika</a>'+
 '<a href="/o-nas.html">O projektu</a><a href="/kontakt.html">Kontakt</a>'+
 '<a href="/ochrana-osobnich-udaju.html">Soukromí</a></nav></div>'+
 '<p class="rv3e-disclaimer">Izolovaný technický náhled, nikoliv produkce. '+
 'U každého výpočtu ověřte aktuální metodiku a podmínky.</p></div></footer>';
}
function replaceOne(h,regex,replacement,name){
 const matches=[...h.matchAll(new RegExp(regex.source,'gi'))];
 if(matches.length!==1)throw Error('Ambiguous '+name+': '+matches.length);
 return h.replace(regex,replacement);
}
export function renderPrototypePage(source,route){
 if(!POC_ROUTES.some(r=>r.source===route?.source&&r.type===route.type))throw Error('Unapproved POC route');
 if(!/<!doctype html>/i.test(source))throw Error('Missing doctype');
 // <base href="/"> would break #fragment navigation on nested preview URLs.
 // These opted-in sources are all root-absolute; refuse future relative URLs until an adapter handles them.
 const refs=[...source.matchAll(/\b(?:href|src|action|poster)=(["'])(.*?)\1/gi)].map(m=>m[2]);
 const relative=refs.filter(u=>u&&!u.startsWith('/')&&!u.startsWith('#')
   && !/^[a-z][a-z0-9+.-]*:/i.test(u));
 if(relative.length)throw Error('Relative URL needs route adapter: '+relative[0]);
 if(/<base\b/i.test(source))throw Error('Unexpected original base element');

 const main=extractMain(source);
 if(!main)throw Error('Missing main');
 const canonical=getCanonical(source);
 if(!canonical.endsWith('/'+route.source))throw Error('Canonical does not match route');
 const scripts=scriptsOf(source);
 const originalHeader=source.match(/<header\b[^>]*>[\s\S]*?<\/header>/gi)||[];
 const originalFooter=source.match(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi)||[];
 if(originalHeader.length!==1||originalFooter.length!==1)throw Error('Ambiguous legacy landmarks');
 let html=source;
 // Hidden/inert compatibility shell keeps old nav ids alive for legacy JavaScript.
 html=replaceOne(html,/<header\b[^>]*>[\s\S]*?<\/header>/i,
   header(route)+'<div class="rv3e-legacy-shell" hidden inert aria-hidden="true">'+originalHeader[0]+'</div>','header');
 html=replaceOne(html,/<footer\b[^>]*>[\s\S]*?<\/footer>/i,
   footer()+'<div class="rv3e-legacy-shell" hidden inert aria-hidden="true">'+originalFooter[0]+'</div>','footer');
 html=replaceOne(html,/<\/head>/i,
   '<meta name="robots" content="noindex,nofollow">'+
   '<meta name="rv3-engine" content="poc-'+escape(route.type)+'">'+
   '<link rel="stylesheet" href="/rv3/poc-theme.css"></head>','head close');
 html=replaceOne(html,/<body\b[^>]*>/i,function(tag){
   if(/\bclass=["'][^"']*["']/.test(tag))
     return tag.replace(/\bclass=(["'])([^"']*)\1/,function(all,q,value){return 'class='+q+value+' rv3e-poc'+q});
   return tag.slice(0,-1)+' class="rv3e-poc">';
 },'body open');
 if(extractMain(html)!==main)throw Error('Main altered: '+route.source);
 if(JSON.stringify(scriptsOf(html))!==JSON.stringify(scripts))throw Error('Scripts altered: '+route.source);
 if(getCanonical(html)!==canonical)throw Error('Canonical altered');
 if((html.match(/<h1\b/gi)||[]).length!==(source.match(/<h1\b/gi)||[]).length)throw Error('H1 count altered');
 const digest=s=>createHash('sha256').update(s).digest('hex');
 return {html,manifest:{source:route.source,prototype:previewPath(route),type:route.type,
   sourceMainSha256:digest(main),scriptsSha256:digest(JSON.stringify(scripts)),
   canonical,legacyShellCompatibility:true,status:'preview-only-browser-unverified'}};
}
