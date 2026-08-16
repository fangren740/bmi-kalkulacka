(()=>{"use strict";
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const COEF=4.348, MIN_2026=134.40;
function num(v){if(typeof v==='number')return Number.isFinite(v)?v:0;const n=parseFloat(String(v??'').replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?n:0}
function localDate(v){if(!v)return null;const [y,m,d]=v.split('-').map(Number);return new Date(y,m-1,d,12,0,0)}
function iso(d){return d?`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`:''}
function fmtDate(d){return d?new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'long',year:'numeric'}).format(d):'—'}
function fmtShort(d){return d?new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'numeric',year:'numeric'}).format(d):'—'}
function money(v,d=0){return Number.isFinite(v)?new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d}).format(v)+' Kč':'—'}
function hourly(v){return Number.isFinite(v)?new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)+' Kč/h':'—'}
function decimal(v,d=3){return Number.isFinite(v)?new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:0,maximumFractionDigits:d}).format(v):'—'}
function quarterBounds(date){const q=Math.floor(date.getMonth()/3);const start=new Date(date.getFullYear(),q*3,1,12);const end=new Date(date.getFullYear(),q*3+3,0,12);return{q:q+1,start,end}}
function prevQuarter(date){const curr=quarterBounds(date);const d=new Date(curr.start);d.setDate(0);return quarterBounds(d)}
function daysInclusive(a,b){return Math.max(0,Math.round((b-a)/86400000)+1)}
function ceil3(v){return Math.ceil((v-1e-10)*1000)/1000}
function weightedWeek(start,end,change,before,after){if(!start||!end||!change||change<=start)return change&&change<=start?after:before;if(change>end)return before;const prev=new Date(change);prev.setDate(prev.getDate()-1);const d1=daysInclusive(start,prev),d2=daysInclusive(change,end);return ceil3((before*d1+after*d2)/(d1+d2))}
function minHourlyFor(standardWeek,year){return year===2026?MIN_2026*(40/standardWeek):null}
function currentMode(){return document.body.dataset.mode==='advanced'?'advanced':'basic'}
function getState(){
 const advanced=currentMode()==='advanced';
 const useDate=localDate($(advanced?'#advancedUseDate':'#basicUseDate').value)||new Date();
 const prev=prevQuarter(useDate);
 const employmentStart=advanced?localDate($('#employmentStart').value):null;
 const decisionStart=employmentStart&&employmentStart>prev.start&&employmentStart<=prev.end?employmentStart:prev.start;
 const workedDays=num($(advanced?'#advancedWorkedDays':'#basicWorkedDays').value);
 const workedHours=num($(advanced?'#advancedWorkedHours':'#basicWorkedHours').value);
 const weeklyHours=num($(advanced?'#advancedWeeklyHours':'#basicWeeklyHours').value)||40;
 let gross=0,bonusAllocated=0,bonusQuarterShare=0,workRatio=1;
 if(advanced){
   const base=num($('#advancedBaseGross').value), extras=num($('#advancedExtras').value), bonus=num($('#longBonus').value), period=num($('#bonusPeriod').value)||12, planned=num($('#plannedHours').value);
   if(bonus>0&&period>3){bonusQuarterShare=bonus*3/period;workRatio=planned>0?Math.min(1,workedHours/planned):1;bonusAllocated=bonusQuarterShare*workRatio}
   gross=base+extras+bonusAllocated;
 }else gross=num($('#basicGross').value);
 const probableMonthly=num($(advanced?'#advancedProbableMonthly':'#basicProbableMonthly').value);
 const standardWeek=advanced?num($('#standardWeek').value)||40:40;
 const sector=advanced?$('#sector').value:'wage';
 let weightedWeekly=weeklyHours;
 if(advanced&&$('#weeklyChange').checked){
   const change=localDate($('#weeklyChangeDate').value), before=num($('#weeklyBefore').value)||weeklyHours, after=num($('#weeklyAfter').value)||weeklyHours;
   weightedWeekly=weightedWeek(decisionStart,prev.end,change,before,after);
 }
 return{advanced,useDate,prev,decisionStart,employmentStart,workedDays,workedHours,weeklyHours,weightedWeekly,gross,probableMonthly,standardWeek,sector,bonusAllocated,bonusQuarterShare,workRatio};
}
function calculate(s){
 const method=s.workedDays>=21?'average':'probable';
 let rawHourly=0,source='';
 if(method==='average'){
   rawHourly=s.workedHours>0?s.gross/s.workedHours:0;
   source=`${money(s.gross)} ÷ ${decimal(s.workedHours,2)} h`;
 }else{
   rawHourly=s.probableMonthly>0&&s.weightedWeekly>0?s.probableMonthly/(s.weightedWeekly*COEF):0;
   source=`${money(s.probableMonthly)} ÷ (${decimal(s.weightedWeekly)} h × ${COEF})`;
 }
 const floor=minHourlyFor(s.standardWeek,s.useDate.getFullYear());
 const adjusted=rawHourly>0&&floor?Math.max(rawHourly,floor):rawHourly;
 const floorApplied=!!(floor&&rawHourly>0&&rawHourly<floor);
 const monthly=adjusted>0?adjusted*s.weightedWeekly*COEF:0;
 return{method,rawHourly,adjusted,floor,floorApplied,monthly,source};
}
function render(){
 const s=getState(),r=calculate(s),prob=r.method==='probable';
 $('#basicProbableWrap').hidden=!(currentMode()==='basic'&&prob);
 $('#advancedProbableWrap').hidden=!(currentMode()==='advanced'&&prob);
 $('#bonusDetails').hidden=!($('#longBonus')&&num($('#longBonus').value)>0);
 $('#weeklyChangeWrap').hidden=!($('#weeklyChange')&&$('#weeklyChange').checked);
 const q=s.prev;
 $('#decisionPeriod').textContent=`${q.q}. čtvrtletí ${q.start.getFullYear()}`;
 $('#decisionDates').textContent=`${fmtShort(s.decisionStart)}–${fmtShort(q.end)}`;
 $('#validQuarter').textContent=`${quarterBounds(s.useDate).q}. čtvrtletí ${s.useDate.getFullYear()}`;
 $('#workedDaysResult').textContent=`${decimal(s.workedDays,0)} dnů`;
 $('#methodName').textContent=prob?'Pravděpodobný výdělek':'Průměrný výdělek';
 $('#methodStatus').textContent=prob?'Pravděpodobný':'Průměrný';
 $('#methodStatus').className='earn-status'+(prob?' is-warning':'');
 $('#hourlyResult').textContent=r.adjusted>0?hourly(r.adjusted):'—';
 $('#rawHourly').textContent=r.rawHourly>0?hourly(r.rawHourly):'—';
 $('#monthlyResult').textContent=r.monthly>0?money(r.monthly,0):'—';
 $('#weeklyResult').textContent=`${decimal(s.weightedWeekly)} h/týden`;
 $('#floorResult').textContent=r.floor?hourly(r.floor):'Mimo 2026';
 $('#sourceFormula').textContent=r.source;
 $('#bonusResult').textContent=s.advanced&&s.bonusAllocated>0?money(s.bonusAllocated,0):'Bez dlouhodobé odměny';
 $('#bonusNote').textContent=s.advanced&&s.bonusAllocated>0?`čtvrtletní podíl ${money(s.bonusQuarterShare,0)} × poměr odpracované doby ${Math.round(s.workRatio*100)} %`:'do rozhodného výdělku nic nepřidáváme';
 $('#floorNote').textContent=r.floorApplied?'Výsledek byl zvýšen na použitelnou hodinovou minimální mzdu.':'Bez navýšení na minimum.';
 $('#quarterMapPrev').textContent=`${q.q}. čtvrtletí ${q.start.getFullYear()}`;
 $('#quarterMapUse').textContent=`${quarterBounds(s.useDate).q}. čtvrtletí ${s.useDate.getFullYear()}`;
 $('#thresholdLeft').textContent=s.workedDays<21?`${decimal(s.workedDays,0)} dnů`:'20 dnů';
 $('#thresholdRight').textContent=s.workedDays>=21?`${decimal(s.workedDays,0)} dnů`:'21 dnů';
 let meaning='';
 if(!r.rawHourly){meaning=prob?'Zadejte pravděpodobnou hrubou měsíční mzdu, kterou by zaměstnanec zřejmě dosáhl.':'Zadejte započitatelný hrubý výdělek a odpracované hodiny.'}
 else if(prob) meaning=`V rozhodném období je méně než 21 odpracovaných dnů. Kalkulačka proto nepoužívá aritmetický průměr z kvartálu, ale kontrolní model pravděpodobného výdělku.`;
 else meaning=`Z ${decimal(s.workedDays,0)} odpracovaných dnů lze použít průměrný výdělek. Základní hodinová hodnota vychází z výdělku a skutečně odpracovaných hodin.`;
 if(r.floorApplied) meaning+=` Protože výsledek klesl pod zákonnou spodní hranici pro rok 2026, použitelná hodnota byla zvýšena.`;
 $('#resultMeaning').textContent=meaning;
 let warning='Výsledek je orientační kontrolní výpočet. Do vstupu patří jen mzdové složky a odpracovaná doba, které do průměrného výdělku podle zákoníku práce skutečně vstupují.';
 if(prob) warning='Pravděpodobný výdělek právně zjišťuje zaměstnavatel podle dosažené nebo zřejmě dosažitelné mzdy/platu a obvyklých složek. Zadaná měsíční částka je proto kontrolní předpoklad, ne automatické právní určení.';
 if(s.sector==='salary') warning+=' U platu ve veřejné sféře může být spodní hranicí i příslušná nejnižší úroveň zaručeného platu; tu tato verze automaticky neurčuje.';
 $('#resultWarningText').textContent=warning;
 $('#monthlyCard').classList.toggle('is-highlight',r.monthly>0);
 $('#hourlyCard').classList.toggle('is-highlight',r.adjusted>0);
 $('#bonusFormulaBox').hidden=!(s.advanced&&s.bonusAllocated>0);
 if(s.advanced&&s.bonusAllocated>0){
   $('#bonusFormulaText').textContent=`${money(num($('#longBonus').value),0)} × 3/${num($('#bonusPeriod').value)||12} × ${Math.round(s.workRatio*100)} % = ${money(s.bonusAllocated,0)}`;
 }
}
function setMode(mode){document.body.dataset.mode=mode;$$('.earn-mode').forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle('is-active',on);b.setAttribute('aria-selected',String(on))});$$('.earn-mode-panel').forEach(p=>{const on=p.dataset.panel===mode;p.classList.toggle('is-active',on);p.hidden=!on});render()}
function defaults(){
 const today=new Date(); const isoToday=iso(today);
 $('#basicUseDate').value=isoToday;$('#advancedUseDate').value=isoToday;
 const prev=prevQuarter(today); $('#employmentStart').value='';
 $('#basicWorkedDays').value=58;$('#advancedWorkedDays').value=58;
 $('#basicGross').value=156000;$('#basicWorkedHours').value=504;$('#basicWeeklyHours').value=40;$('#basicProbableMonthly').value=48000;
 $('#advancedBaseGross').value=148000;$('#advancedExtras').value=8000;$('#advancedWorkedHours').value=504;$('#advancedWeeklyHours').value=40;$('#advancedProbableMonthly').value=48000;
 $('#standardWeek').value='40';$('#sector').value='wage';$('#longBonus').value=0;$('#bonusPeriod').value='12';$('#plannedHours').value=504;
 $('#weeklyChange').checked=false;$('#weeklyBefore').value=40;$('#weeklyAfter').value=30;const ch=new Date(prev.start.getFullYear(),prev.start.getMonth()+1,15,12);$('#weeklyChangeDate').value=iso(ch);
 setMode('basic');
}
function setup(){
 $$('.earn-mode').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
 document.addEventListener('input',e=>{if(e.target.closest('#earningForm'))render()});
 document.addEventListener('change',e=>{if(e.target.closest('#earningForm'))render()});
 $('#resetBtn').addEventListener('click',defaults);
 $$('.earn-copy').forEach(btn=>btn.addEventListener('click',async()=>{const target=$(btn.dataset.copy);const text=target?.textContent||'';try{await navigator.clipboard.writeText(text);const old=btn.textContent;btn.textContent='Zkopírováno';setTimeout(()=>btn.textContent=old,1200)}catch(_){}}));
 const toggle=$('#menuToggle'),nav=$('#mainNav'); if(toggle&&nav)toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));nav.classList.toggle('is-open',!open)});
 defaults();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
