/* RychléVýpočty V3 clean-slate UI. Never alters numeric methodology.
   Usability layers only: intent routing, search, salary comparison and salary form. */
(()=>{'use strict';
const byId=id=>document.getElementById(id);
const cz=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
const money=v=>cz.format(Math.round(v))+' Kč';
const signed=v=>(v<0?'−':v>0?'+':'')+money(Math.abs(v));
const parse=value=>{const str=String(value??'').trim().replace(/[\s\u00a0\u202f]/g,'').replace(',','.');return str?Number(str):NaN};
const normal=s=>String(s).toLocaleLowerCase('cs-CZ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const engine=window.RV3Salary;

const CATALOG=[
 ['Příplatky za směny','Víkend, noc, svátek a přesčas','/kalkulacka-priplatku-za-smeny.html'],
 ['Čistá mzda','Hrubá mzda na čistou 2026','/cista-mzda-kalkulacka.html'],
 ['Dovolená','Nárok na dovolenou','/kalkulacka-dovolene.html'],
 ['DPP a DPČ','Práce na dohodu a odvody','/dpp-dpc-kalkulacka.html'],
 ['Výpovědní doba','Kdy skončí pracovní poměr','/vypovedni-doba-kalkulacka.html'],
 ['Podpora v nezaměstnanosti','Podpora při ztrátě práce','/podpora-v-nezamestnanosti-kalkulacka.html'],
 ['Hypotéka','Splátka a úrok','/hypotecni-kalkulacka.html'],
 ['Cena práce','Náklady zaměstnavatele','/naklady-zamestnavatele-kalkulacka.html'],
 ['Nemocenská','Výpočet nemocenské','/nemocenska-kalkulacka.html'],
 ['OČR','Ošetřovné','/ocr-kalkulacka.html'],
 ['Přesčasy','Výpočet přesčasů','/kalkulacka-prescasu.html'],
 ['Odstupné','Orientační odstupné','/odstupne-kalkulacka.html'],
 ['Procenta','Procentní změna a podíl','/procenta-kalkulacka.html'],
 ['DPH','Daň z přidané hodnoty','/dph-kalkulacka.html'],
 ['Odpracované hodiny','Kolik hodin jste odpracovali','/kalkulacka-odpracovanych-hodin.html'],
 ['Náklady na bydlení','Měsíční výdaje za bydlení','/mesicni-naklady-na-bydleni-kalkulacka.html']
];

// Intent-oriented Czech typeahead. Entirely local: no personal queries leave the browser.
const ALIASES={
  '/kalkulacka-priplatku-za-smeny.html':'priplatek priplatky vikend vikendove noc nocni nocni smena smeny svatek svatky prescas vyplata kolik dostanu za vikend noc vikendovy priplatek',
  '/cista-mzda-kalkulacka.html':'cista hruba mzda vyplata vypocet dane odvody plat penez na ucet',
  '/kalkulacka-dovolene.html':'volno dovolena narok kolik dni volna',
  '/dpp-dpc-kalkulacka.html':'dohoda brigada dpp dpc prace privydelek',
  '/vypovedni-doba-kalkulacka.html':'vypoved vypovedni lhuta pracovni pomer konec zamestnani',
  '/podpora-v-nezamestnanosti-kalkulacka.html':'urad prace pracaku podpora nezamestnanost',
  '/hypotecni-kalkulacka.html':'hypoteka banka splatka urok uver bydleni',
  '/naklady-zamestnavatele-kalkulacka.html':'cena prace zamestnavatel superhruba',
  '/nemocenska-kalkulacka.html':'nemoc nemocenska neschopenka nemocny',
  '/ocr-kalkulacka.html':'ocr osetrovne nemocne dite pecovani o dite',
  '/kalkulacka-prescasu.html':'prescasy prescas prace navic',
  '/odstupne-kalkulacka.html':'odstupne vypoved ukonceni pracovniho pomeru',
  '/procenta-kalkulacka.html':'procenta procent procentni zmena',
  '/dph-kalkulacka.html':'dph dan cena s dani',
  '/kalkulacka-odpracovanych-hodin.html':'smena hodiny odpracovano doba',
  '/mesicni-naklady-na-bydleni-kalkulacka.html':'najem najemne energie naklady na byt bydleni'
};
const STOPWORDS=new Set(['kolik','co','jak','kde','mi','me','mam','muzu','muze','jsem','je','to','ten','ta','se','si','za','do','na','o','v','ve','z','ze','po','pro','by','dostanu','spocitam','spocitat','kalkulacka','kalkulacku']);
function searchStem(s){return s.replace(/(oveho|ove|ove|ovou|ech|ich|ami|emi|ova|ove|ovy|eho|eho|ka|ky|ek|ku|ce|ci|u|e|y|a)$/,'')}
/* Lazy-load the real tool inventory only on search interaction.
   Initial render stays instant with handpicked popular tools. */
let discoveredTools=null;
function initSearch(){
 const input=byId('tool-search'),out=byId('tool-results');if(!input||!out)return;
 function render(){
  const q=normal(input.value);out.replaceChildren();
  if(q.length<2){out.hidden=true;input.setAttribute('aria-expanded','false');return}
  let terms=q.split(/[^a-z0-9]+/).filter(Boolean).filter(t=>!STOPWORDS.has(t));
  if(!terms.length)terms=q.split(/[^a-z0-9]+/).filter(Boolean);
  const tools=discoveredTools
   ? [...CATALOG,...discoveredTools.filter(item=>!CATALOG.some(curated=>curated[2]===item[2]))]
   : CATALOG;
  const scored=tools.map(([title,desc,href,keywords],index)=>{
   const titleText=normal(title),descText=normal(desc),alias=ALIASES[href]||'';
   const pool=titleText+' '+descText+' '+alias+' '+normal(keywords||'');
   const words=pool.split(/[^a-z0-9]+/).filter(Boolean);
   let score=0;
   for(const term of terms){
    const stem=searchStem(term);
    const match=words.some(w=>w===term||w.startsWith(stem)||searchStem(w)===stem);
    if(!match)return null;
    score+=titleText.includes(stem)?5:descText.includes(stem)?3:1;
   }
   return {title,desc,href,index,score};
  }).filter(Boolean).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,6);
  if(!scored.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='Nenašli jsme přesnou shodu. Zkuste například „mzda“, „příplatky“ nebo „hypotéka“.';out.append(empty)}
  for(const item of scored){
   const a=document.createElement('a');a.href=item.href;
   const text=document.createElement('span');const strong=document.createElement('strong');strong.textContent=item.title;
   const small=document.createElement('small');small.textContent=item.desc;text.append(strong,small);
   const icon=document.createElement('span');icon.textContent='↗';icon.setAttribute('aria-hidden','true');a.append(text,icon);out.append(a);
  }
  out.hidden=false;
  input.setAttribute('aria-expanded','true');
 }
 let requested=false;
 function requestIndex(){
  if(requested||typeof fetch!=='function')return;
  requested=true;
  fetch('/rv3/tool-search-index.json',{credentials:'same-origin',cache:'force-cache'})
   .then(response=>{if(!response.ok)throw Error('Catalog HTTP '+response.status);return response.json()})
   .then(items=>{if(Array.isArray(items)&&items.length>=100){
     discoveredTools=items.filter(item=>Array.isArray(item)&&item.length>=3&&/^\/[a-z0-9-]+\.html$/.test(item[2]));
     if(input.value.trim().length>=2)render();
   }}).catch(()=>{/* Curated, locally available fallback keeps search usable. */});
 }
 input.addEventListener('focus',requestIndex);
 input.addEventListener('input',()=>{render();requestIndex()});
 input.addEventListener('keydown',e=>{
  if(e.key==='Escape'){out.hidden=true;input.setAttribute('aria-expanded','false');}
  if(e.key==='Enter'){
   const a=out.querySelector('a[href]');if(a){e.preventDefault();a.click()}
  }
 });
 input.addEventListener('keydown',e=>{
   if(e.key==='ArrowDown'&&!out.hidden){
     const first=out.querySelector('a[href]');if(first){e.preventDefault();first.focus()}
   }
 });
 out.addEventListener('keydown',e=>{
   if(e.key==='Escape'){
     e.preventDefault();out.hidden=true;input.setAttribute('aria-expanded','false');input.focus();return;
   }
   if(e.key==='ArrowDown'||e.key==='ArrowUp'){
     const links=Array.from(out.querySelectorAll('a[href]'));
     const index=links.indexOf(document.activeElement);
     if(e.key==='ArrowUp'&&index<=0){e.preventDefault();input.focus();return}
     const next=links[index+(e.key==='ArrowDown'?1:-1)];
     if(next){e.preventDefault();next.focus()}
   }
 });
 document.querySelectorAll('[data-search]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.search;render();input.focus()}));
 document.addEventListener('click',e=>{if(!input.contains(e.target)&&!out.contains(e.target)&&!e.target.closest('[data-search]'))out.hidden=true});
}

function initTabs(rootSelector,buttonAttr,panelAttr){
 const root=document.querySelector(rootSelector);if(!root)return;
 const buttons=Array.from(root.querySelectorAll('['+buttonAttr+']'));
 const panels=Array.from(root.querySelectorAll('['+panelAttr+']'));
 for(const btn of buttons)btn.addEventListener('click',()=>{
  const name=btn.getAttribute(buttonAttr);
  for(const b of buttons)b.setAttribute('aria-pressed',String(b===btn));
  for(const p of panels)p.hidden=p.getAttribute(panelAttr)!==name;
 });
}

function initOffer(){
 const before=byId('offer-before'),after=byId('offer-after');
 if(!before||!after)return;
 const delta=byId('offer-difference'),year=byId('offer-year'),hint=byId('offer-help');
 const oldNet=byId('offer-net-before'),newNet=byId('offer-net-after');
 const oldBar=byId('offer-bar-before'),newBar=byId('offer-bar-after');
 const copy=byId('offer-copy'),copyStatus=byId('offer-copy-status');
 const presets=Array.from(document.querySelectorAll('[data-offer-increase]'));
 let lastValid=null;
 function render(){
  const a=parse(before.value),b=parse(after.value);
  const valid=!!engine&&[a,b].every(n=>Number.isFinite(n)&&n>0&&n<=1e8);
  before.setAttribute('aria-invalid',String(!Number.isFinite(a)||a<=0||a>1e8));
  after.setAttribute('aria-invalid',String(!Number.isFinite(b)||b<=0||b>1e8));
  if(copyStatus){copyStatus.hidden=true;copyStatus.textContent=''}
  if(copy)copy.disabled=!valid;
  for(const btn of presets)btn.setAttribute('aria-pressed',String(valid&&Math.round(b-a)===Number(btn.dataset.offerIncrease)));
  if(!valid){
   lastValid=null;delta.textContent='—';year.textContent='—';
   hint.textContent='Zadejte dvě kladné hrubé mzdy.';hint.classList.add('compare-invalid');
   if(oldNet)oldNet.textContent='—';if(newNet)newNet.textContent='—';
   if(oldBar)oldBar.style.width='0%';if(newBar)newBar.style.width='0%';
   return;
  }
  const current=engine.standardScenario(a,true,false).netSalary;
  const proposed=engine.standardScenario(b,true,false).netSalary;
  const change=proposed-current;
  lastValid={current,proposed,change,from:a,to:b};
  delta.textContent=signed(change);
  year.textContent=signed(change*12);
  if(oldNet)oldNet.textContent=money(current);
  if(newNet)newNet.textContent=money(proposed);
  const maximum=Math.max(current,proposed,1);
  if(oldBar)oldBar.style.width=(Math.max(0,current)/maximum*100).toFixed(2)+'%';
  if(newBar)newBar.style.width=(Math.max(0,proposed)/maximum*100).toFixed(2)+'%';
  hint.textContent='Model HPP za celý měsíc · podepsané prohlášení · bez dětí';
  hint.classList.remove('compare-invalid');
 }
 before.addEventListener('input',render);
 after.addEventListener('input',render);
 for(const preset of presets)preset.addEventListener('click',()=>{
  const base=parse(before.value),increase=Number(preset.dataset.offerIncrease);
  if(!Number.isFinite(base)||base<=0||base+increase>1e8)return;
  after.value=String(base+increase);
  render();
 });
 if(copy)copy.addEventListener('click',()=>{
  if(!lastValid||!copyStatus)return;
  if(typeof navigator==='undefined'||!navigator.clipboard?.writeText){
   copyStatus.textContent='Kopírování v tomto prohlížeči není dostupné.';
   copyStatus.hidden=false;return;
  }
  const text='Porovnání čisté mzdy 2026 (HPP, prohlášení, bez dětí)\\n'
    +'Dnes: '+money(lastValid.from)+' hrubého → '+money(lastValid.current)+' čistého\\n'
    +'Nabídka: '+money(lastValid.to)+' hrubého → '+money(lastValid.proposed)+' čistého\\n'
    +'Rozdíl: '+signed(lastValid.change)+' měsíčně / '+signed(lastValid.change*12)+' za 12 měsíců.\\n'
    +'Orientační model: rychlevypocty.cz/cista-mzda-kalkulacka.html';
  navigator.clipboard.writeText(text).then(()=>{
   copyStatus.textContent='Porovnání zkopírováno do schránky.';
   copyStatus.hidden=false;
  }).catch(()=>{
   copyStatus.textContent='Kopírování se nepodařilo. Zkuste označit výsledek ručně.';
   copyStatus.hidden=false;
  });
 });
 render();
}

function initSalary(){
 const form=byId('s-form');if(!form)return;
 const output=byId('s-valid-result'),invalidBox=byId('s-invalid-result'),error=byId('s-error');
 const advancedIds=['s-bonus','s-other','s-extra-children','s-invalidity','s-year-base'];
 const field=id=>byId(id);
 const set=(id,value)=>{const el=field(id);if(el)el.textContent=value};
 function fail(id,message){
  const el=field(id);if(el)el.setAttribute('aria-invalid','true');
  error.textContent=message;error.hidden=false;output.hidden=true;invalidBox.hidden=false;
 }
 function read(){
  const count=Number(field('s-children').value);
  const extra=parse(field('s-extra-children').value);
  return {count,extra,gross:parse(field('s-gross').value),bonus:parse(field('s-bonus').value),
    other:parse(field('s-other').value),invalidity:Number(field('s-invalidity').value),year:parse(field('s-year-base').value),
    declaration:field('s-declaration').checked,ztp:field('s-ztp').checked,pensioner:field('s-pensioner').checked,
    healthMin:field('s-health-min').checked,cap:field('s-cap').checked};
 }
 function update(){
  error.hidden=true;error.textContent='';
  for(const id of ['s-gross',...advancedIds])field(id).removeAttribute('aria-invalid');
  if(!engine){fail('s-gross','Výpočetní jádro se nepodařilo načíst.');return}
  const v=read();
  for(const [id,value,min,max,msg] of [
    ['s-gross',v.gross,1,1e8,'Hrubá mzda musí být mezi 1 Kč a 100 miliony Kč.'],
    ['s-bonus',v.bonus,0,1e8,'Prémie musí být od 0 do 100 milionů Kč.'],
    ['s-other',v.other,0,1e8,'Další srážky musí být od 0 do 100 milionů Kč.'],
    ['s-year-base',v.year,0,1e9,'Roční základ musí být od 0 do 1 miliardy Kč.'],
    ['s-extra-children',v.extra,0,10,'Počet dalších dětí musí být celé číslo 0 až 10.']
  ]){
   if(!Number.isFinite(value)||value<min||value>max){fail(id,msg);return}
  }
  if(!Number.isInteger(v.extra)){fail('s-extra-children','Počet dětí musí být celé číslo.');return}
  if(v.extra>0&&v.count!==3){fail('s-extra-children','Další děti lze přidat při výběru 3 dětí v základním nastavení.');return}
  const r=engine.calculate({
   mode:'advanced',grossBase:v.gross,bonus:v.bonus,otherDeductions:v.other,
   taxDeclaration:v.declaration,disabilityDiscount:v.invalidity,ztpDiscount:v.ztp,
   pensionerDiscount:v.pensioner,healthMinimum:v.healthMin,applySocialCap:v.cap,
   yearSocialBase:v.year,
   children:{first:v.count>=1,second:v.count>=2,thirdPlus:Math.max(0,v.count-2)+v.extra}
  });
  output.hidden=false;invalidBox.hidden=true;
  set('s-net',money(r.netSalary));set('s-percentage',new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(r.netGrossRatio)+' % hrubé mzdy');
  set('s-gross-out',money(r.gross));set('s-social',signed(-r.socialEmployee));
  set('s-health',signed(-r.healthEmployee));set('s-tax',signed(-r.taxAfterDiscounts));
  set('s-cost',money(r.totalCost));set('s-tax-bonus',signed(r.taxBonus));
  field('s-bonus-line').hidden=r.taxBonus===0;
  field('s-after-line').hidden=r.otherDeductions===0;set('s-after',money(r.afterOther));
  set('s-tax-base',money(r.baseForTax));set('s-tax-before',money(r.taxBeforeDiscounts));
  set('s-discounts',money(r.personalDiscounts));set('s-child-credit',money(r.childrenCredit));
  set('s-employer-social',money(r.socialEmployer));set('s-employer-health',money(r.healthEmployer));
  const notes=['Model běžného pracovního poměru za celý měsíc.'];
  if(!v.declaration)notes.push('Bez podepsaného prohlášení se neuplatní měsíční daňové slevy.');
  if(r.taxBonus>0)notes.push('Čistá mzda zahrnuje daňový bonus '+money(r.taxBonus)+'.');
  if(r.socialCapUsed)notes.push('Byla zohledněna zbývající část ročního sociálního maxima.');
  if(r.highTaxBase>0)notes.push('Část základu spadá do 23% daňového pásma.');
  if(r.gross<engine.CONFIG.minimumWage&&!v.healthMin)notes.push('Při nízké mzdě ověřte, zda se na vás vztahuje zdravotní minimum.');
  set('s-context',notes.join(' '));
 }
 form.addEventListener('input',update);form.addEventListener('change',update);
 form.addEventListener('submit',e=>{e.preventDefault();update()});
 const reset=field('s-reset');reset.addEventListener('click',()=>{form.reset();field('s-advanced').open=false;update()});
 update();
}

initSearch();
initTabs('[data-intent-root]','data-intent','data-intent-panel');
initTabs('[data-hub-root]','data-hub','data-hub-panel');
initOffer();
initSalary();
})();
