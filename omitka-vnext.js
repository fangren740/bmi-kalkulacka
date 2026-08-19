(()=>{
'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const num=v=>{const n=Number(String(v??'').replace(',','.'));return Number.isFinite(n)?n:0};
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const fmt=(v,d=1)=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:d,minimumFractionDigits:0}).format(v);
const money=v=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(v))+' Kč';
const bagWord=n=>n===1?'pytel':(n>=2&&n<=4?'pytle':'pytlů');

const PRODUCTS={
 'knauf-mp75l':{name:'Knauf MP 75 L',kind:'sádrová · interiér',cons:0.85,bag:30,min:8,rec:10,max:15,localMax:50,range:'8–15 mm běžná vrstva',rangeNote:'Výrobce uvádí lokálně až 50 mm.',source:'https://knauf.com/cs-CZ/p/vyrobek/mp-75-l-10257_0106'},
 'knauf-mp75':{name:'Knauf MP 75',kind:'sádrová · interiér',cons:1.00,bag:30,min:8,rec:10,max:15,localMax:50,range:'8–15 mm běžná vrstva',rangeNote:'Výrobce uvádí lokálně až 50 mm.',source:'https://knauf.com/cs-CZ/p/vyrobek/mp-75-10256_0106'},
 'knauf-mp75one':{name:'Knauf MP 75 ONE',kind:'sádrová · interiér',cons:1.10,bag:30,min:8,rec:10,max:25,ceilingMax:15,range:'8–25 mm stěna · 8–15 mm strop',rangeNote:'Na stropě výrobce uvádí maximum 15 mm.',source:'https://knauf.com/cs-CZ/p/vyrobek/mp-75-one-29988_0106'},
 'cemix-4220':{name:'Cemix 4220',kind:'sádrová · interiér',cons:1.05,bag:25,min:5,rec:10,max:40,range:'5–40 mm · doporučeně 10 mm',source:'https://www.cemix.cz/cs/p/4200-Vnitrni-omitky/4220-SADROVA-OMITKA-FILCOVANA'},
 'cemix-2020':{name:'Cemix 2020',kind:'vápenocementová · jádrová',cons:1.30,bag:25,min:10,rec:15,max:30,range:'10–30 mm · doporučeně 15 mm',source:'https://www.cemix.cz/cs/p/2000-Jadrove-omitky/2020-OMITKA-STROJNI'},
 'cemix-4260':{name:'Cemix 4260',kind:'jednovrstvá · interiér',cons:1.25,bag:25,min:5,rec:15,max:25,range:'5–25 mm · doporučeně 15 mm',source:'https://www.cemix.cz/cs/p/4200-Vnitrni-omitky/4260-JEDNOVRSTVA-OMITKA'},
 'knauf-mv1':{name:'Knauf MV 1',kind:'vápenocementová · jádrová',cons:1.60,bag:25,min:10,rec:15,max:20,range:'10–20 mm',source:'https://knauf.com/cs-CZ/p/vyrobek/mv-1-10281_0106'},
 'knauf-mcs1':{name:'Knauf MCS 1',kind:'cementová · namáhanější plochy',cons:1.50,bag:30,min:10,rec:15,max:25,range:'10–25 mm',source:'https://knauf.com/cs-CZ/p/vyrobek/mcs-1-10280_0106'}
};
let activeMode='quick';
let surfaceId=0;
const state={userTouchedThickness:false};

function getProduct(){
 const key=$('#productSelect').value;
 if(key!=='custom') return {...PRODUCTS[key],key,custom:false};
 return {key:'custom',custom:true,name:$('#customName').value.trim()||'Vlastní omítka',kind:'vlastní technický list',cons:Math.max(.001,num($('#customConsumption').value)),bag:Math.max(.1,num($('#customBag').value)),min:null,rec:Math.max(.1,num($('#customRecommended').value)),max:null,range:'hodnoty zadává uživatel',source:''};
}
function quickArea(){
 const mode=$('input[name="areaMode"]:checked')?.value||'room';
 if(mode==='known') return Math.max(0,num($('#knownArea').value));
 const l=Math.max(0,num($('#roomLength').value)),w=Math.max(0,num($('#roomWidth').value)),h=Math.max(0,num($('#roomHeight').value)),open=Math.max(0,num($('#roomOpenings').value));
 const wall=Math.max(0,2*(l+w)*h-open); const ceiling=$('#includeCeiling').checked?l*w:0;
 return wall+ceiling;
}
function projectArea(){
 return $$('.om-surface').reduce((sum,row)=>{
  const l=Math.max(0,num(row.querySelector('[data-f="l"]').value));
  const h=Math.max(0,num(row.querySelector('[data-f="h"]').value));
  const openings=Math.max(0,num(row.querySelector('[data-f="o"]').value));
  const count=Math.max(1,Math.round(num(row.querySelector('[data-f="c"]').value)||1));
  return sum+Math.max(0,l*h-openings)*count;
 },0);
}
function calcArea(){return activeMode==='project'?projectArea():quickArea()}
function includesCeiling(){return activeMode==='quick' && ($('input[name="areaMode"]:checked')?.value==='room') && $('#includeCeiling').checked}

function updateProductUI(setRecommended=false){
 const p=getProduct();
 $('#customProduct').hidden=!p.custom;
 $('#productKind').textContent=p.kind;
 $('#productRange').textContent=p.range;
 const src=$('#productSource');
 if(p.source){src.hidden=false;src.href=p.source;src.textContent='Zdroj výrobce ↗'}else{src.hidden=true}
 if(setRecommended && p.rec && !p.custom){$('#thickness').value=String(p.rec);state.userTouchedThickness=false}
 updateThicknessHint(p);
}
function updateThicknessHint(p=getProduct()){
 const h=$('#thicknessHint');
 if(p.custom){h.textContent='Rozsah vrstvy ověřte v technickém listu vlastního výrobku.';return}
 h.textContent='Výrobce: '+p.range+'.'+(p.rangeNote?' '+p.rangeNote:'');
}
function thicknessStatus(p,t){
 if(p.custom) return {type:'info',title:'Vlastní technický list.',text:'Kalkulačka neumí ověřit povolený rozsah vrstvy. Zkontrolujte jej v dokumentaci výrobce.'};
 if(t<p.min) return {type:'danger',title:'Tloušťka je pod zveřejněným minimem.',text:`Zadaných ${fmt(t,1)} mm je méně než minimum ${fmt(p.min,1)} mm pro tento preset.`};
 if(p.ceilingMax && includesCeiling() && t>p.ceilingMax) return {type:'warning',title:'Pozor na strop.',text:`Pro tento výrobek je na stropě zveřejněno maximum ${fmt(p.ceilingMax,1)} mm. Stěna může mít jiný rozsah.`};
 if(p.localMax && t>p.max && t<=p.localMax) return {type:'warning',title:'Jste nad běžnou vrstvou.',text:`Výrobce uvádí běžně do ${fmt(p.max,1)} mm a lokálně až ${fmt(p.localMax,1)} mm. Ověřte konkrétní provedení.`};
 if(t>p.max) return {type:'danger',title:'Tloušťka je nad zveřejněným rozsahem.',text:`Zadaných ${fmt(t,1)} mm překračuje horní hranici ${fmt(p.max,1)} mm tohoto presetu.`};
 return {type:'ok',title:'Rozsah výrobku sedí.',text:`Zadaná tloušťka ${fmt(t,1)} mm odpovídá zveřejněnému rozsahu tohoto výrobku.`};
}
function renderBagStack(n){
 const stack=$('#bagStack');stack.innerHTML='';
 const count=Math.min(5,Math.max(1,Math.ceil(n/8)));
 for(let i=0;i<count;i++){const el=document.createElement('i');el.style.height=(28+i*7)+'px';stack.appendChild(el)}
}
function calculate(){
 const p=getProduct();
 const area=Math.max(0,calcArea());
 const t=Math.max(.1,num($('#thickness').value));
 const reserve=clamp(num($('#reserve').value),0,30);
 const price=Math.max(0,num($('#bagPrice').value));
 const net=area*t*p.cons;
 const withReserve=net*(1+reserve/100);
 const bags=withReserve>0?Math.ceil(withReserve/p.bag):0;
 const purchased=bags*p.bag;
 const coverage=p.cons*t>0?p.bag/(p.cons*t):0;
 const mmKg=area*p.cons;
 const mmBags=p.bag>0?Math.ceil(mmKg/p.bag):0;
 $('#resultBags').textContent=fmt(bags,0);
 $('#resultBagLabel').textContent=`${bagWord(bags)} po ${fmt(p.bag,1)} kg`;
 $('#resultProduct').textContent=p.name;
 $('#resultConsumption').textContent=`${fmt(p.cons,2)} kg/m²/mm`;
 $('#resultArea').textContent=`${fmt(area,1)} m²`;
 $('#resultNetKg').textContent=`${fmt(net,1)} kg`;
 $('#resultReserveKg').textContent=`${fmt(withReserve,1)} kg`;
 $('#resultPurchasedKg').textContent=`${fmt(purchased,1)} kg`;
 $('#resultCoverage').textContent=`${fmt(coverage,2)} m² při ${fmt(t,1)} mm`;
 $('#mmImpactKg').textContent=`+${fmt(mmKg,1)} kg`;
 $('#mmImpactText').textContent=`Na stejné ploše znamená každý další 1 mm přibližně +${fmt(mmKg,1)} kg čisté směsi (asi ${fmt(mmBags,0)} ${bagWord(mmBags)} podle velikosti balení).`;
 const costRow=$('#costRow');costRow.hidden=!(price>0);if(price>0)$('#resultCost').textContent=money(bags*price);
 renderBagStack(bags);
 const s=thicknessStatus(p,t), box=$('#resultCheck');box.classList.remove('is-warning','is-danger');if(s.type==='warning')box.classList.add('is-warning');if(s.type==='danger')box.classList.add('is-danger');
 $('#checkTitle').textContent=s.title;$('#checkText').textContent=s.text;
 updateProductUI(false);
}
function setAreaMode(mode){
 $('#roomFields').hidden=mode!=='room';$('#knownFields').hidden=mode!=='known';calculate();
}
function addSurface(data={name:'Stěna',l:4,h:2.6,o:0,c:1}){
 surfaceId++;
 const row=document.createElement('div');row.className='om-surface';row.dataset.id=String(surfaceId);
 row.innerHTML=`<label><span>Název</span><input data-f="n" type="text" value="${String(data.name).replace(/"/g,'&quot;')}"></label><label><span>Délka</span><input data-f="l" type="number" min="0" step="0.1" value="${data.l}"></label><label><span>Výška</span><input data-f="h" type="number" min="0" step="0.05" value="${data.h}"></label><label><span>Otvory m²</span><input data-f="o" type="number" min="0" step="0.1" value="${data.o}"></label><label><span>Počet</span><input data-f="c" type="number" min="1" step="1" value="${data.c}"></label><button class="om-remove-surface" type="button" aria-label="Odstranit plochu">×</button>`;
 $('#surfaceList').appendChild(row);calculate();
}
function switchMode(next,focus=true){
 activeMode=next;
 const q=next==='quick';
 $('#tabQuick').classList.toggle('is-active',q);$('#tabProject').classList.toggle('is-active',!q);
 $('#tabQuick').setAttribute('aria-selected',String(q));$('#tabProject').setAttribute('aria-selected',String(!q));
 $('#tabQuick').tabIndex=q?0:-1;$('#tabProject').tabIndex=q?-1:0;
 $('#panelQuick').hidden=!q;$('#panelProject').hidden=q;
 if(focus)(q?$('#tabQuick'):$('#tabProject')).focus();calculate();
}
function initTabs(){
 const tabs=[$('#tabQuick'),$('#tabProject')];
 tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>switchMode(i===0?'quick':'project',false));
  tab.addEventListener('keydown',e=>{let idx=i;if(e.key==='ArrowRight')idx=(i+1)%2;else if(e.key==='ArrowLeft')idx=(i+1)%2;else if(e.key==='Home')idx=0;else if(e.key==='End')idx=1;else return;e.preventDefault();switchMode(idx===0?'quick':'project',true)});
 });
}
function initMenu(){
 const b=$('#menuToggle'),nav=$('#mobileNav');if(!b||!nav)return;
 b.addEventListener('click',()=>{const open=b.getAttribute('aria-expanded')==='true';b.setAttribute('aria-expanded',String(!open));b.setAttribute('aria-label',open?'Otevřít navigaci':'Zavřít navigaci');nav.classList.toggle('is-open',!open)});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Otevřít navigaci');nav.classList.remove('is-open')}});
}
function init(){
 initTabs();initMenu();
 addSurface({name:'Obývák · stěna A',l:5,h:2.6,o:2.4,c:1});
 addSurface({name:'Obývák · stěna B',l:4,h:2.6,o:1.8,c:1});
 $$('input[name="areaMode"]').forEach(r=>r.addEventListener('change',()=>setAreaMode(r.value)));
 $('#productSelect').addEventListener('change',()=>{updateProductUI(true);calculate()});
 $('#thickness').addEventListener('input',()=>{state.userTouchedThickness=true;calculate()});
 $('#customRecommended').addEventListener('change',()=>{if($('#productSelect').value==='custom'&&!state.userTouchedThickness)$('#thickness').value=$('#customRecommended').value;calculate()});
 $('#addSurface').addEventListener('click',()=>addSurface({name:'Další stěna',l:3,h:2.6,o:0,c:1}));
 $('#surfaceList').addEventListener('click',e=>{const btn=e.target.closest('.om-remove-surface');if(!btn)return;const rows=$$('.om-surface');if(rows.length<=1)return;btn.closest('.om-surface').remove();calculate()});
 $('#surfaceList').addEventListener('input',calculate);
 $('#plasterCalculator').addEventListener('input',e=>{if(e.target.id==='thickness')return;calculate()});
 $('#plasterCalculator').addEventListener('change',e=>{if(e.target.matches('input[name="areaMode"]'))return;calculate()});
 setAreaMode('room');updateProductUI(false);calculate();
}
document.addEventListener('DOMContentLoaded',init);
})();
