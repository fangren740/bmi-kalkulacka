(()=>{
'use strict';
const CONFIG={year:2026,limits:[1633,2449,4897],rate:0.60};
const hasDOM=typeof document!=='undefined'; const $=id=>hasDOM?document.getElementById(id):null; const $$=s=>hasDOM?Array.from(document.querySelectorAll(s)):[];
const state={mode:'basic',caregiver:'standard',source:'period'};
const parse=v=>{const n=Number.parseFloat(String(v??'').replace(/\s/g,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const nf=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
const money=v=>`${nf.format(Math.round(Number.isFinite(v)?v:0))} Kč`;
const number=v=>nf.format(Math.round(Number.isFinite(v)?v:0));
const set=(id,v)=>{const n=$(id);if(n)n.textContent=v};
function reduceDvz(dvz){
 const d=Math.max(0,dvz),[a,b,c]=CONFIG.limits;
 const p1=Math.min(d,a)*.9;
 const p2=Math.max(0,Math.min(d,b)-a)*.6;
 const p3=Math.max(0,Math.min(d,c)-b)*.3;
 const ignored=Math.max(0,d-c);
 const reduced=Math.ceil(p1+p2+p3);
 return{dvz:d,p1,p2,p3,ignored,reduced};
}
function input(){
 if(state.mode==='basic'){
  const gross=clamp(parse($('basicGross').value),0,10000000);
  const requested=Math.ceil(clamp(parse($('basicDays').value),1,365));
  const limit=state.caregiver==='lone'?16:9;
  return{mode:'basic',dvz:gross*12/365,requested,limit,insured:true,waiting:true,worker:'employee',source:'odhad z měsíční mzdy'};
 }
 const requested=Math.ceil(clamp(parse($('advancedDays').value),1,365));
 const lone=$('advancedLone').checked,limit=lone?16:9;
 const dvz=state.source==='direct'?clamp(parse($('directDvz').value),0,1000000):clamp(parse($('periodIncome').value),0,100000000)/Math.max(1,clamp(parse($('periodDays').value),1,3660));
 return{mode:'advanced',dvz,requested,limit,insured:true,waiting:$('waitingPeriod').checked,worker:$('workerType').value||'employee',source:state.source==='direct'?'přímo zadaný DVZ':'z rozhodného období'};
}
function calculate(v){
 const r=reduceDvz(v.dvz); const daily=Math.ceil(r.reduced*CONFIG.rate); const paid=Math.min(v.requested,v.limit); const over=Math.max(0,v.requested-paid); const total=daily*paid;
 return{...v,...r,daily,paid,over,total};
}
function validate(){
 const msg=$('formMessage');msg.hidden=true;msg.textContent='';
 const v=input();
 if(!Number.isFinite(v.dvz)||v.dvz<=0){msg.hidden=false;msg.textContent='Zadejte kladný příjem nebo denní vyměřovací základ.';return false}
 if(!Number.isFinite(v.requested)||v.requested<1){msg.hidden=false;msg.textContent='Zadejte alespoň 1 den péče.';return false}
 return true;
}
function renderDays(r){
 const box=$('resultDays');if(!box)return;let html='';
 for(let i=1;i<=16;i++){const cls=i<=r.paid?'is-paid':(i<=r.requested?'is-over':'');html+=`<i class="${cls}" title="Den ${i}">${i}</i>`}box.innerHTML=html;
}
function render(r){
 set('resultStatus',`${r.limit===16?'Delší':'Běžný'} limit · ${r.limit} dnů`);
 set('totalBenefit',money(r.total));set('dailyBenefit',money(r.daily));set('paidDays',`${r.paid} / ${r.requested}`);set('daysDetail',r.over?`${r.over} ${r.over===1?'den je':'dnů je'} nad limitem`:'žádný den nad limitem');set('dvzResult',money(r.dvz));set('dvzSource',r.source);set('reducedResult',money(r.reduced));
 set('resultSentence',`Denní dávka ${money(r.daily)} × ${r.paid} započtených kalendářních dnů${r.over?`; ${r.over} dnů je nad zvoleným limitem`:''}.`);
 set('careWindowLabel',`${r.limit} dnů`);set('careWindowText',r.over?`Zadali jste ${r.requested} dnů, ale tento scénář započítá nejvýše ${r.limit}.`:`V tomto scénáři se započítá všech ${r.paid} zadaných dnů.`);renderDays(r);
 set('flowDvz',money(r.dvz));set('flowReduced',money(r.reduced));set('flowDaily',money(r.daily));set('flowTotal',money(r.total));set('flowDays',`${r.paid} kalendářních dnů`);
 const notice=$('eligibilityNotice');notice.className='ocr79-notice is-ok';
 if(state.mode==='advanced'&&!r.waiting){notice.className='ocr79-notice is-danger';notice.innerHTML='<strong>Nárok v tomto nastavení není potvrzen.</strong><span>Uvedli jste, že nesplňujete čekací dobu nemocenského pojištění. Částku proto berte jen jako technický model výpočtu.</span>'}
 else if(r.over){notice.className='ocr79-notice is-warning';notice.innerHTML=`<strong>${r.over} ${r.over===1?'den je':'dnů je'} nad podpůrčí dobou.</strong><span>Delší potřeba péče automaticky neprodlužuje krátkodobé ošetřovné. Ověřte, zda se na situaci nevztahuje jiný režim.</span>`}
 else{notice.innerHTML='<strong>Výpočet částky je připraven.</strong><span>Samotný výpočet nepotvrzuje nárok. Ten závisí i na účasti na nemocenském pojištění a důvodu péče.</span>'}
 window.__ocr79Last=r;
}
function update(){if(!validate())return false;const r=calculate(input());render(r);return true}
function setMode(mode){state.mode=mode==='advanced'?'advanced':'basic';$$('[data-mode]').forEach(b=>{const on=b.dataset.mode===state.mode;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on))});$('basicPanel').hidden=state.mode!=='basic';$('advancedPanel').hidden=state.mode!=='advanced';set('formTitle',state.mode==='basic'?'Mzdu, délku péče a typ podpůrčí doby':'Přesný zdroj DVZ, délku péče a pojištění');set('formIntro',state.mode==='basic'?'Výchozí režim je plánovací odhad pro stabilní měsíční mzdu.':'Přesnější režim pracuje s rozhodným obdobím nebo přímo známým DVZ.');update()}
function setSource(source){state.source=source==='direct'?'direct':'period';$$('[data-source]').forEach(b=>{const on=b.dataset.source===state.source;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on))});$('periodFields').hidden=state.source!=='period';$('directField').hidden=state.source!=='direct';update()}
function setCaregiver(c){state.caregiver=c==='lone'?'lone':'standard';$$('[data-caregiver]').forEach(b=>{const on=b.dataset.caregiver===state.caregiver;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on))});update()}
function reset(){state.caregiver='standard';state.source='period';$('basicGross').value='42 000';$('basicDays').value='9';$('periodIncome').value='504 000';$('periodDays').value='365';$('directDvz').value='1 381';$('advancedDays').value='9';$('workerType').value='employee';$('waitingPeriod').checked=true;$('advancedLone').checked=false;$$('[data-preset]').forEach(b=>b.classList.toggle('is-active',b.dataset.preset==='42000'));setCaregiver('standard');setSource('period');setMode('basic')}
globalThis.OCR79Engine={CONFIG,reduceDvz,calculate};
if(hasDOM){
$$('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
$$('[data-source]').forEach(b=>b.addEventListener('click',()=>setSource(b.dataset.source)));
$$('[data-caregiver]').forEach(b=>b.addEventListener('click',()=>setCaregiver(b.dataset.caregiver)));
$$('[data-preset]').forEach(b=>b.addEventListener('click',()=>{$('basicGross').value=nf.format(Number(b.dataset.preset));$$('[data-preset]').forEach(x=>x.classList.toggle('is-active',x===b));update()}));
$('ocrForm')?.addEventListener('input',update);$('ocrForm')?.addEventListener('change',update);$('ocrForm')?.addEventListener('submit',e=>{e.preventDefault();if(update()&&matchMedia('(max-width:900px)').matches)$('vysledek')?.scrollIntoView({behavior:'smooth',block:'start'})});$('resetButton')?.addEventListener('click',reset);
$('workerType')?.addEventListener('change',()=>set('waitingHelp',$('workerType').value==='osvc'?'U OSVČ musí nemocenské pojištění před vznikem potřeby péče trvat v posledních 3 měsících.':'U zaměstnance musí nemocenské pojištění v posledních 4 měsících trvat alespoň 90 dnů.'));
const menu=document.querySelector('.menu-btn'),mobile=document.querySelector('.mobile-nav');menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));mobile.hidden=open});
setMode('basic');
}
})();
