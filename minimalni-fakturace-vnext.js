
(()=>{"use strict";
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const ids=['forYou','businessCosts','activeMonths','taxReserve','annualExtras','averageInvoice'];
const val=id=>{const n=Number($("#"+id).value);return Number.isFinite(n)?Math.max(0,n):0};
const cz=n=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(n))+" Kč";
const months=['LED','ÚNO','BŘE','DUB','KVĚ','ČVN','ČVC','SRP','ZÁŘ','ŘÍJ','LIS','PRO'];
function clampMonths(n){return Math.max(1,Math.min(12,Math.round(n||1)))}
function calc(){
 const forYou=val('forYou'), costs=val('businessCosts'), reserve=val('taxReserve'), extras=val('annualExtras'), avg=val('averageInvoice');
 const active=clampMonths(val('activeMonths')); $('#activeMonths').value=active;
 const base=forYou+costs+reserve; const annual=base*12+extras; const activeTarget=annual/active; const inactiveCarry=activeTarget-base; const extraAnnual=reserve*12+extras;
 $('#activeTarget').textContent=cz(activeTarget); $('#annualTarget').textContent=cz(annual); $('#baseMonthly').textContent=cz(base); $('#inactiveCarry').textContent=cz(Math.max(0,inactiveCarry)); $('#extraResult').textContent=cz(extraAnnual);
 $('#resultSentence').textContent=`Při ${active} fakturačních měsících tak pokryjete roční potřebu ${cz(annual)}.`;
 $('#interpretTitle').textContent=active===12?'Každý měsíc nese jen svou vlastní část roku.':'Aktivní měsíc musí nést i část roku, kdy nefakturujete.';
 $('#interpretText').textContent=`Těch ${cz(activeTarget)} není doporučená tržní cena. Je to matematické minimum podle vašich vlastních potřeb a ${active} fakturačních měsíců.`;
 $('#heroActive').textContent=active; $('#heroMonthly').textContent=cz(activeTarget); $('#heroAnnual').textContent=cz(annual); $('#heroRunwayText').textContent=active===12?'Celoroční potřeba se rozloží rovnoměrně do všech 12 měsíců.':`${12-active} slabší nebo nefakturační ${12-active===1?'měsíc nezmizí':'měsíce nezmizí'} — jejich potřebu musí pokrýt aktivní období.`;
 renderMonths(active); renderSensitivity(annual,active);
 if(avg>0){const count=Math.ceil(activeTarget/avg); $('#invoiceCountWrap').hidden=false; $('#invoiceCount').textContent=`alespoň ${count} ${count===1?'faktura':'faktur'} / aktivní měsíc`;}else{$('#invoiceCountWrap').hidden=true}
}
function renderMonths(active){const hero=$('#heroMonths'), pick=$('#monthPicker'); hero.innerHTML=''; pick.innerHTML=''; months.forEach((m,i)=>{const a=i<active; const d=document.createElement('span');d.className='iv-month'+(a?' is-active':'');d.textContent=m;hero.appendChild(d); const p=document.createElement('span');p.className=a?'is-active':'';p.textContent=String(i+1).padStart(2,'0');pick.appendChild(p);});}
function renderSensitivity(annual,current){const root=$('#sensitivityRows');root.innerHTML=''; const set=[12,11,10,9]; const vals=set.map(m=>annual/m); const max=Math.max(...vals,1);set.forEach((m,i)=>{const row=document.createElement('div');row.className='iv-sens-row'+(m===current?' is-current':'');row.innerHTML=`<span>${m} měs.</span><div class="iv-sens-track"><i style="width:${Math.max(10,vals[i]/max*100).toFixed(1)}%"></i></div><strong>${cz(vals[i])}</strong>`;root.appendChild(row);});}
ids.forEach(id=>$('#'+id)?.addEventListener('input',calc));
$('#invoiceForm').addEventListener('submit',e=>{e.preventDefault();calc()});
$('#resetButton').addEventListener('click',()=>{const defaults={forYou:55000,businessCosts:15000,activeMonths:10,taxReserve:0,annualExtras:0,averageInvoice:0};Object.entries(defaults).forEach(([k,v])=>$('#'+k).value=v);calc()});
const toggle=$('.menu-toggle'),nav=$('.main-nav');if(toggle&&nav){toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));nav.classList.toggle('is-open',!open)});document.addEventListener('keydown',e=>{if(e.key==='Escape'){toggle.setAttribute('aria-expanded','false');nav.classList.remove('is-open')}})}
calc();
})();
