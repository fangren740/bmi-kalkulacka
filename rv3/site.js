/* RV3: minimal progressive enhancements. All tool links work without JS. */
(()=>{'use strict';
const searchItems=[
['Čistá mzda 2026','Z hrubé mzdy na částku na účet','/cista-mzda-kalkulacka.html'],
['Příplatky za směny','Víkend, noc, svátek a přesčas','/kalkulacka-priplatku-za-smeny.html'],
['Hrubá mzda z čisté','Spočítejte potřebnou hrubou mzdu','/kalkulacka-hrube-mzdy-z-ciste.html'],
['DPP / DPČ','Výdělek a odvody na dohodu','/dpp-dpc-kalkulacka.html'],
['Podpora v nezaměstnanosti','Odhad podpory při ztrátě práce','/podpora-v-nezamestnanosti-kalkulacka.html'],
['Dovolená','Kolik dovolené vám náleží','/kalkulacka-dovolene.html'],
['Výpovědní doba','Kdy pracovní poměr skončí','/vypovedni-doba-kalkulacka.html'],
['Nemocenská','Orientační nemocenské dávky','/nemocenska-kalkulacka.html'],
['OČR','Ošetřovné pro péči o dítě','/ocr-kalkulacka.html'],
['Odstupné','Kolik odstupného můžete dostat','/odstupne-kalkulacka.html'],
['Náklady zaměstnavatele','Kolik stojí zaměstnanec','/naklady-zamestnavatele-kalkulacka.html'],
['Hypotéka','Orientační splátka hypotéky','/hypotecni-kalkulacka.html']
];
const normalize=s=>s.toLocaleLowerCase('cs-CZ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const search=document.getElementById('rv3-search'),matches=document.getElementById('rv3-search-results');
if(search&&matches){
  const draw=()=>{matches.replaceChildren();const q=normalize(search.value);if(q.length<2){matches.hidden=true;return}const hits=searchItems.filter(x=>normalize(x[0]+' '+x[1]).includes(q)||q.split(/\s+/).every(t=>normalize(x[0]+' '+x[1]).includes(t))).slice(0,6);
  if(!hits.length){const x=document.createElement('div');x.style.padding='14px';x.textContent='Nic přesného jsme nenašli. Zkuste kratší výraz.';matches.append(x)}
  for(const [name,desc,url] of hits){const a=document.createElement('a');a.href=url;const b=document.createElement('strong'),c=document.createElement('span');b.textContent=name;c.textContent=desc;a.append(b,c);matches.append(a)}matches.hidden=false;};
  search.addEventListener('input',draw);search.addEventListener('keydown',e=>{if(e.key==='Escape')matches.hidden=true;if(e.key==='Enter'){const a=matches.querySelector('a');if(a){e.preventDefault();location.href=a.href}}});document.addEventListener('click',e=>{if(!search.contains(e.target)&&!matches.contains(e.target))matches.hidden=true});
}
const salary=window.RV3Salary;
const quick=document.getElementById('rv3-quick-gross'),quickNet=document.getElementById('rv3-quick-net');
if(quick&&quickNet&&salary){const run=()=>{const gross=Number(quick.value.replace(/[\s\u00a0]/g,'').replace(',','.'));if(!Number.isFinite(gross)||gross<=0||gross>1e8){quickNet.textContent='—';return}quickNet.textContent=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(salary.standardScenario(gross,true,false).netSalary)+' Kč';};quick.addEventListener('input',run);run()}
})();
