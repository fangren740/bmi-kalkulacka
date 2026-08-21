(() => {
'use strict';
const $=id=>document.getElementById(id);
const fmt=(n,d=0)=>new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
const money=n=>`${fmt(Math.abs(n),Math.abs(n)<100?2:0)} Kč`;
const signedMoney=n=>`${n>0?'+':n<0?'−':''}${money(n)}`;
const signedPct=(n,d=1)=>`${n>0?'+':n<0?'−':''}${fmt(Math.abs(n),d)} %`;
const val=(id,f=0)=>{const n=Number($(id)?.value);return Number.isFinite(n)?n:f};
let depth='basic', mode='compare';
function calculate(){
  let oldPrice=0,newPrice=0;
  if(mode==='compare'){oldPrice=val('oldPrice',1000);newPrice=val('newPrice',1200)}
  if(mode==='forward'){oldPrice=val('basePrice',1000);const p=Math.max(0,val('changePercent',20))/100;newPrice=$('forwardDirection').value==='increase'?oldPrice*(1+p):oldPrice*(1-p)}
  if(mode==='reverse'){newPrice=val('currentPrice',1200);const p=Math.max(0,val('previousPercent',20))/100;oldPrice=$('reverseDirection').value==='increase'?newPrice/(1+p):(p>=1?NaN:newPrice/(1-p))}
  const error=$('priceError');
  if(!Number.isFinite(oldPrice)||oldPrice<=0||!Number.isFinite(newPrice)||newPrice<0){error.hidden=false;error.textContent='Zkontrolujte zadané hodnoty. Původní cena musí být větší než nula a výsledná cena nesmí být záporná.';return null}
  error.hidden=true;
  const diff=newPrice-oldPrice, change=diff/oldPrice*100, index=newPrice/oldPrice*100, ratio=newPrice/oldPrice;
  const ret=newPrice>0?(oldPrice/newPrice-1)*100:null;
  return {oldPrice,newPrice,diff,change,index,ratio,ret};
}
function directionLabel(r){return r.change>0?'ZDRAŽENÍ':r.change<0?'ZLEVNĚNÍ':'BEZ ZMĚNY'}
function render(){
 const r=calculate(); if(!r)return;
 const dir=r.change>0?'increase':r.change<0?'decrease':'flat'; $('vysledek').dataset.direction=dir;
 $('statusBadge').textContent=directionLabel(r);
 $('resultTitle').textContent=r.change>0?`Cena vzrostla o ${fmt(Math.abs(r.change),1)} %.`:r.change<0?`Cena klesla o ${fmt(Math.abs(r.change),1)} %.`:'Cena se nezměnila.';
 $('resultSentence').textContent=`Z ${money(r.oldPrice)} na ${money(r.newPrice)}.`;
 $('differenceValue').textContent=signedMoney(r.diff); $('differencePct').textContent=signedPct(r.change,1);
 $('oldResult').textContent=money(r.oldPrice); $('newResult').textContent=money(r.newPrice); $('indexResult').textContent=`index ${fmt(r.index,1)}`;
 $('priceIndex').textContent=fmt(r.index,1); $('priceRatio').textContent=`${fmt(r.ratio,2)}×`;
 if(r.ret===null){$('returnPercent').textContent='nelze';$('returnText').textContent='Z nulové ceny se procentním růstem na kladnou původní cenu vrátit nelze.'}
 else{$('returnPercent').textContent=signedPct(r.ret,1);$('returnText').textContent=`Z nové ceny ${money(r.newPrice)} je pro návrat na ${money(r.oldPrice)} potřeba ${r.ret>0?'zdražit':'zlevnit'} o ${fmt(Math.abs(r.ret),1)} %.`}
 const units=Math.max(0,val('unitsPerMonth',1)),months=Math.max(1,Math.round(val('periodMonths',12))); const period=r.diff*units*months;
 $('periodDifference').textContent=signedMoney(period); $('periodContext').textContent=`${fmt(units,units%1?2:0)}× měsíčně · ${months} měsíců`;
 $('meaningText').textContent=r.change===0?'Obě ceny jsou stejné. Cenový index je 100 a není potřeba žádná návratová změna.':`Nová cena je ${fmt(r.ratio,2)}× původní. Návratové procento ${r.ret!==null?`je ${fmt(Math.abs(r.ret),1)} %`:'nelze určit'}, protože se další krok počítá už z ${r.newPrice>r.oldPrice?'vyšší':'nižší'} částky.`;
 $('demoStart').textContent=money(r.oldPrice); $('demoMiddle').textContent=money(r.newPrice); $('demoEnd').textContent=money(r.oldPrice); $('demoFirstPct').textContent=signedPct(r.change,1); $('demoReturnPct').textContent=r.ret===null?'—':signedPct(r.ret,1);
 if(r.ret!==null){$('mirrorHeadline').textContent=`${signedPct(r.change,1)} ↔ ${signedPct(r.ret,1)}`; const sameOpp=r.newPrice*(1-r.change/100); $('mirrorCopy').textContent=r.change===0?'Bez změny není potřeba žádná cesta zpět.':`To je přesná dvojice pro cestu tam a zpět. Použití stejného procenta opačným směrem by skončilo na ${money(sameOpp)}, ne na ${money(r.oldPrice)}.`}
 renderLadder(r.oldPrice);
 window.__rvPriceChange=r;
}
function renderLadder(base){const items=[-30,-15,0,15,30];$('ladderGrid').innerHTML=items.map(p=>`<article class="pc-ladder-card${p===0?' is-center':''}"><span>${p===0?'VÝCHOZÍ':signedPct(p,0)}</span><strong>${money(base*(1+p/100))}</strong><small>${p===0?'index 100':`index ${100+p}`}</small></article>`).join('')}
function setMode(next){mode=next;document.querySelectorAll('[data-mode]').forEach(b=>{const active=b.dataset.mode===next;b.setAttribute('aria-selected',String(active));b.tabIndex=active?0:-1});document.querySelectorAll('[data-panel]').forEach(p=>p.hidden=p.dataset.panel!==next);render()}
function setDepth(next){depth=next;document.querySelectorAll('[data-depth]').forEach(b=>{const active=b.dataset.depth===next;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active))});document.querySelectorAll('.advanced-only').forEach(el=>el.hidden=next!=='advanced');if(next==='basic')setMode('compare');render()}
document.querySelectorAll('[data-depth]').forEach(b=>b.addEventListener('click',()=>setDepth(b.dataset.depth)));
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
const tabs=[...document.querySelectorAll('.pc-mode [role=tab]')];tabs.forEach((tab,i)=>tab.addEventListener('keydown',e=>{let j=i;if(e.key==='ArrowRight')j=(i+1)%tabs.length;else if(e.key==='ArrowLeft')j=(i-1+tabs.length)%tabs.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=tabs.length-1;else return;e.preventDefault();tabs[j].focus();setMode(tabs[j].dataset.mode)}));
$('priceForm').addEventListener('input',render);$('priceForm').addEventListener('change',render);$('priceForm').addEventListener('submit',e=>{e.preventDefault();render();$('vysledek').scrollIntoView({behavior:'smooth',block:'start'})});
$('resetBtn').addEventListener('click',()=>{$('oldPrice').value=1000;$('newPrice').value=1200;$('basePrice').value=1000;$('changePercent').value=20;$('forwardDirection').value='increase';$('currentPrice').value=1200;$('previousPercent').value=20;$('reverseDirection').value='increase';$('unitsPerMonth').value=1;$('periodMonths').value=12;setDepth('basic')});
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.main-nav');if(toggle&&nav){toggle.addEventListener('click',()=>{const open=!nav.classList.contains('is-open');nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open))});document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false')}})}
setDepth('basic');render();
})();