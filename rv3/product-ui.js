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

function initSearch(){
 const input=byId('tool-search'),out=byId('tool-results');
 if(!input||!out)return;
 function render(){
  const q=normal(input.value);out.replaceChildren();
  if(q.length<2){out.hidden=true;return}
  const terms=q.split(/\s+/).filter(Boolean);
  const hits=CATALOG.filter(item=>terms.every(t=>normal(item[0]+' '+item[1]).includes(t))).slice(0,6);
  if(!hits.length){const message=document.createElement('div');message.className='empty';message.textContent='Zkuste kratší nebo jiný výraz.';out.append(message)}
  for(const [title,desc,link] of hits){
   const a=document.createElement('a');a.href=link;const left=document.createElement('span');
   const b=document.createElement('strong');b.textContent=title;const s=document.createElement('small');s.textContent=desc;
   left.append(b,s);const arr=document.createElement('span');arr.textContent='↗';a.append(left,arr);out.append(a);
  }
  out.hidden=false;
 }
 input.addEventListener('input',render);
 input.addEventListener('keydown',e=>{
  if(e.key==='Escape')out.hidden=true;
  if(e.key==='Enter'){
   const a=out.querySelector('a[href]');
   if(a){e.preventDefault();a.click()}
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
 function render(){
  const a=parse(before.value),b=parse(after.value);
  const valid=engine&&[a,b].every(n=>Number.isFinite(n)&&n>0&&n<=1e8);
  before.setAttribute('aria-invalid',String(!Number.isFinite(a)||a<=0||a>1e8));
  after.setAttribute('aria-invalid',String(!Number.isFinite(b)||b<=0||b>1e8));
  if(!valid){delta.textContent='—';year.textContent='—';hint.textContent='Zadejte obě kladné hrubé mzdy.';hint.classList.add('compare-invalid');return}
  const change=engine.standardScenario(b,true,false).netSalary-engine.standardScenario(a,true,false).netSalary;
  delta.textContent=signed(change);
  year.textContent=signed(change*12);
  hint.textContent='HPP · podepsané prohlášení · bez dětí';
  hint.classList.remove('compare-invalid');
 }
 before.addEventListener('input',render);after.addEventListener('input',render);render();
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
