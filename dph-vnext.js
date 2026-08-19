(()=>{
'use strict';
const qs=(s,r=document)=>r.querySelector(s), qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const money=n=>new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:Math.abs(n-Math.round(n))>.004?2:0,maximumFractionDigits:2}).format(Number.isFinite(n)?n:0)+' Kč';
const pct=n=>new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number.isFinite(n)?n:0)+' %';
const num=v=>{const n=Number(String(v??'').replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?n:0};
const amount=qs('#amount'), amountLabel=qs('#amountLabel'), amountHelp=qs('#amountHelp'), customRate=qs('#customRate'), customRateWrap=qs('#customRateWrap');
let rate=21;
function direction(){return qs('input[name="direction"]:checked')?.value||'gross'}
function currentRate(){return Math.max(0,num(rate==='custom'?customRate.value:rate))}
function calculate(){
 const a=Math.max(0,num(amount.value)), r=currentRate()/100, dir=direction(); let net=0,tax=0,gross=0;
 if(dir==='gross'){gross=a; net=(1+r)>0?gross/(1+r):gross; tax=gross-net;} else {net=a; tax=net*r; gross=net+tax;}
 const share=gross>0?tax/gross*100:0;
 qs('#netOut').textContent=money(net); qs('#taxOut').textContent=money(tax); qs('#taxOut2').textContent=money(tax); qs('#grossOut').textContent=money(gross); qs('#shareOut').textContent=pct(share);
 qs('#resultRate').textContent=(rate==='custom'?new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2}).format(currentRate()):rate)+' % DPH';
 if(dir==='gross'){
   qs('#resultLeadLabel').textContent='Z konečné ceny je DPH';
   qs('#resultSentence').textContent=`Z ${money(gross)} je ${money(tax)} DPH a základ bez daně je ${money(net)}.`;
   qs('#formulaOut').textContent=`${money(gross).replace(' Kč','')} ÷ ${(1+r).toLocaleString('cs-CZ',{maximumFractionDigits:4})} = ${money(net).replace(' Kč','')}`;
   amountLabel.textContent='Cena včetně DPH'; amountHelp.textContent='Například konečná částka z účtenky nebo nabídky.';
 }else{
   qs('#resultLeadLabel').textContent='K základu přičtete DPH';
   qs('#resultSentence').textContent=`K ${money(net)} přidáte ${money(tax)} DPH. Konečná cena je ${money(gross)}.`;
   qs('#formulaOut').textContent=`${money(net).replace(' Kč','')} × ${currentRate().toLocaleString('cs-CZ',{maximumFractionDigits:2})} % = ${money(tax).replace(' Kč','')}`;
   amountLabel.textContent='Cena bez DPH'; amountHelp.textContent='Základ daně před přičtením DPH.';
 }
 qsa('[data-hero-gross]').forEach(el=>el.textContent=money(gross)); qsa('[data-hero-base]').forEach(el=>el.textContent=money(net)); qsa('[data-hero-tax]').forEach(el=>el.textContent=money(tax)); const rtxt=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2}).format(currentRate())+' %'; qsa('[data-hero-rate-text]').forEach(el=>el.textContent=rtxt); qsa('[data-hero-rate-stamp]').forEach(el=>el.textContent=rtxt.replace(' ','')); qsa('[data-hero-eq-base]').forEach(el=>el.textContent=money(net).replace(' Kč','')); qsa('[data-hero-eq-tax]').forEach(el=>el.textContent=money(tax).replace(' Kč','')); qsa('[data-hero-eq-gross]').forEach(el=>el.textContent=money(gross).replace(' Kč',''));
}
qsa('input[name="direction"]').forEach(el=>el.addEventListener('change',calculate)); amount.addEventListener('input',calculate); customRate.addEventListener('input',calculate);
qsa('.rate-picker button').forEach(btn=>btn.addEventListener('click',()=>{rate=btn.dataset.rate; qsa('.rate-picker button').forEach(b=>{const on=b===btn;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on))});customRateWrap.hidden=rate!=='custom';calculate()}));
qsa('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{
 const p=btn.dataset.preset; let d='gross',a=1210,r='21'; if(p==='1120'){a=1120;r='12'} if(p==='10000'){a=10000;d='net';r='21'};
 qs(`input[name="direction"][value="${d}"]`).checked=true; amount.value=a; rate=r; qsa('.rate-picker button').forEach(b=>{const on=b.dataset.rate===r;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on))});customRateWrap.hidden=true;calculate();
}));
const rows=qs('#invoiceRows');
function rowTemplate(name='Služba',price=1000,qty=1,r=21){
 const tr=document.createElement('tr'); tr.innerHTML=`<td><input class="row-name" type="text" value="${name}" aria-label="Název položky"></td><td><input class="row-price" type="number" min="0" step="0.01" value="${price}" inputmode="decimal" aria-label="Cena bez DPH"></td><td><input class="row-qty" type="number" min="0" step="0.01" value="${qty}" inputmode="decimal" aria-label="Počet"></td><td><select class="row-rate" aria-label="Sazba DPH"><option value="21" ${r===21?'selected':''}>21 %</option><option value="12" ${r===12?'selected':''}>12 %</option></select></td><td class="row-tax">—</td><td class="row-gross">—</td><td><button class="row-remove" type="button" aria-label="Odstranit položku">×</button></td>`;
 tr.addEventListener('input',calcInvoice); tr.addEventListener('change',calcInvoice); qs('.row-remove',tr).addEventListener('click',()=>{tr.remove();calcInvoice()}); return tr;
}
function resetInvoice(){rows.innerHTML='';rows.append(rowTemplate('Služba',1000,1,21));rows.append(rowTemplate('Vybraná položka',500,2,12));calcInvoice()}
function calcInvoice(){let net=0,tax=0,gross=0;qsa('tr',rows).forEach(tr=>{const p=Math.max(0,num(qs('.row-price',tr).value)),q=Math.max(0,num(qs('.row-qty',tr).value)),r=Math.max(0,num(qs('.row-rate',tr).value))/100;const n=p*q,t=n*r,g=n+t;net+=n;tax+=t;gross+=g;qs('.row-tax',tr).textContent=money(t);qs('.row-gross',tr).textContent=money(g)});qs('#invNet').textContent=money(net);qs('#invTax').textContent=money(tax);qs('#invGross').textContent=money(gross)}
qs('#addRow').addEventListener('click',()=>{rows.append(rowTemplate('Nová položka',0,1,21));calcInvoice()});qs('#resetRows').addEventListener('click',resetInvoice);resetInvoice();
const menu=qs('.menu-toggle'),nav=qs('#main-nav'); if(menu&&nav){menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));menu.setAttribute('aria-label',open?'Otevřít navigaci':'Zavřít navigaci');nav.classList.toggle('is-open',!open)});document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Otevřít navigaci');nav.classList.remove('is-open')}})}
qs('#dphForm').addEventListener('submit',e=>{e.preventDefault();calculate()});
calculate();
})();
