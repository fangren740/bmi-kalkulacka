/* RV3 V2: shared, build-time rendered navigation and footer. */
const h=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const topLinks=[
 ['/kalkulacky.html','Všechny kalkulačky'],
 ['/mzdy-a-prace.html','Mzdy a práce'],
 ['/finance-a-hypoteky.html','Finance a bydlení'],
 ['/jak-pocitame.html','Jak počítáme']
];
export function renderHeaderV2(){
 const links=topLinks.map(([href,text],i)=>'<a href="'+href+'"'+(i===0?' aria-current="page"':'')+'>'+h(text)+'</a>').join('');
 return '<header class="rv3d-header"><div class="rv3d-wrap rv3d-header-inner">'+
 '<a class="rv3d-brand" href="/" aria-label="RychléVýpočty.cz — úvod">'+
 '<img src="/logo-rv-v32.svg" alt="RychléVýpočty.cz" width="220" height="36"></a>'+
 '<nav class="rv3d-nav" aria-label="Hlavní navigace">'+links+'</nav>'+
 '<details class="rv3d-menu"><summary>Menu <span aria-hidden="true">☰</span></summary>'+
 '<nav aria-label="Mobilní navigace">'+links+'</nav></details>'+
 '</div></header>';
}
export function renderFooterV2(){
 return '<footer class="rv3d-footer"><div class="rv3d-wrap">'+
 '<div class="rv3d-footer-intro"><div><span class="rv3d-footer-eyebrow">RYCHLÉVÝPOČTY.CZ / METODIKA NA PRVNÍM MÍSTĚ</span>'+
 '<h2>Správný výpočet.<br><em>Lepší rozhodnutí.</em></h2>'+
 '<p>Vyberte nástroj, zadejte údaje a podívejte se nejen na výsledek, ale i na jeho vysvětlení.</p></div>'+
 '<a class="rv3d-footer-method" href="/jak-pocitame.html">Jak ověřujeme výpočty <span aria-hidden="true">↗</span></a></div>'+
 '<div class="rv3d-footer-links"><a href="/" class="rv3d-footer-brand">'+
 '<img src="/logo-rv-v32.svg" width="205" height="34" alt="RychléVýpočty.cz"></a>'+
 '<nav aria-label="Informace o webu"><a href="/o-nas.html">O projektu</a>'+
 '<a href="/redakcni-zasady.html">Redakční zásady</a>'+
 '<a href="/kontakt.html">Kontakt</a>'+
 '<a href="/ochrana-osobnich-udaju.html">Soukromí</a></nav></div>'+
 '<div class="rv3d-footer-end"><span>Orientační výpočty pro Českou republiku.</span>'+
 '<span>V3 / TESTOVACÍ NÁHLED · žádná produkční změna</span></div>'+
 '</div></footer>';
}
