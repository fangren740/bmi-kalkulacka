(()=>{
'use strict';
const $=id=>document.getElementById(id);
const form=$('parentalForm'); if(!form)return;
const state={mode:'basic',goal:'duration'};
const moneyFmt=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
const monthFmt=new Intl.DateTimeFormat('cs-CZ',{month:'long',year:'numeric'});
const els={
 birthDate:$('birthDate'),childrenType:$('childrenType'),alreadyUsed:$('alreadyUsed'),monthlyAmount:$('monthlyAmount'),targetMonth:$('targetMonth'),dvz:$('dvz'),startMonth:$('startMonth'),
 basicPanel:$('rp81BasicPanel'),advancedPanel:$('rp81AdvancedPanel'),basicTab:$('rp81BasicTab'),advancedTab:$('rp81AdvancedTab'),modeHelp:$('modeHelp'),
 durationField:document.querySelector('.rp81-duration-field'),targetField:document.querySelector('.rp81-target-field'),
 result:$('vysledek'),resultRule:$('resultRule'),resultBadge:$('resultBadge'),primaryLabel:$('primaryLabel'),primaryResult:$('primaryResult'),resultSentence:$('resultSentence'),
 monthlyResult:$('monthlyResult'),monthsResult:$('monthsResult'),limitResult:$('limitResult'),lastPaymentResult:$('lastPaymentResult'),
 runwayStart:$('runwayStart'),runwayEnd:$('runwayEnd'),runwayDeadline:$('runwayDeadline'),runwayFill:$('runwayFill'),deadlinePin:$('deadlinePin'),runwayText:$('runwayText'),
 heroTotal:$('heroTotal'),heroUsed:$('heroUsed'),heroRemaining:$('heroRemaining'),heroUsedBar:$('heroUsedBar'),heroMonthly:$('heroMonthly'),heroMonths:$('heroMonths'),heroEnd:$('heroEnd'),heroStatus:$('heroStatus'),
 optionDeadlineAmount:$('optionDeadlineAmount'),optionDeadlineText:$('optionDeadlineText'),optionBalancedAmount:$('optionBalancedAmount'),optionBalancedText:$('optionBalancedText'),optionFastAmount:$('optionFastAmount'),optionFastText:$('optionFastText'),actionIntro:$('actionIntro'),
 birthDateError:$('birthDateError'),alreadyUsedError:$('alreadyUsedError'),monthlyAmountError:$('monthlyAmountError'),targetMonthError:$('targetMonthError'),dvzError:$('dvzError'),startMonthError:$('startMonthError')
};
const clamp=(v,min,max)=>Math.min(Math.max(v,min),max);
const parseMoney=v=>{const s=String(v??'').replace(/\s/g,'').replace(',','.').replace(/[^0-9.\-]/g,'');const n=Number(s);return Number.isFinite(n)?n:0};
const money=v=>`${moneyFmt.format(Math.round(Math.max(0,Number.isFinite(v)?v:0)))} Kč`;
const pluralMonths=n=>{n=Math.max(0,Math.round(n));if(n===1)return'1 měsíc';if(n>=2&&n<=4)return`${n} měsíce`;return`${n} měsíců`};
const dateFromInput=v=>{if(!v)return null;const d=new Date(`${v}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
const monthFromInput=v=>{if(!/^\d{4}-\d{2}$/.test(v||''))return null;const [y,m]=v.split('-').map(Number);return new Date(y,m-1,1,12)};
const monthStart=d=>new Date(d.getFullYear(),d.getMonth(),1,12);
const addMonths=(d,n)=>new Date(d.getFullYear(),d.getMonth()+n,1,12);
const addYears=(d,n)=>new Date(d.getFullYear()+n,d.getMonth(),d.getDate(),12);
const monthDiff=(a,b)=>(b.getFullYear()-a.getFullYear())*12+(b.getMonth()-a.getMonth());
const monthsInclusive=(a,b)=>Math.max(0,monthDiff(a,b)+1);
const formatMonth=d=>d?monthFmt.format(d):'—';
const maxDate=(a,b)=>a>b?a:b;
function automaticRule(birth,multiple){
 const d2024=new Date(2024,0,1,12),d2026=new Date(2026,0,1,12);
 if(birth<d2024)return{total:multiple?450000:300000,years:4,period:'do 2023',label:multiple?'VÍCERČATA DO 2023 · 450 000 KČ':'DÍTĚ DO 2023 · 300 000 KČ'};
 if(birth<d2026)return{total:multiple?525000:350000,years:3,period:'2024–2025',label:multiple?'VÍCERČATA 2024–2025 · 525 000 KČ':'DÍTĚ 2024–2025 · 350 000 KČ'};
 return{total:multiple?700000:350000,years:3,period:'od 2026',label:multiple?'VÍCERČATA 2026 · 700 000 KČ':'DÍTĚ 2026 · 350 000 KČ'};
}
function monthlyLimit(dvz,multiple){
 const floor=multiple?30000:15000;
 if(!(dvz>0))return floor;
 const calc=.70*30*dvz*(multiple?2:1);
 return Math.max(floor,Math.floor(calc));
}
function planDuration(remaining,amount,start){
 if(remaining<=0)return{months:0,end:start,last:0};
 if(!(amount>0))return{months:Infinity,end:null,last:0};
 const months=Math.ceil(remaining/amount); const last=remaining-amount*(months-1);
 return{months,end:addMonths(start,Math.max(0,months-1)),last};
}
function clearErrors(){['birthDateError','alreadyUsedError','monthlyAmountError','targetMonthError','dvzError','startMonthError'].forEach(id=>{const e=$(id);if(e)e.textContent=''})}
function validate(){
 clearErrors(); let ok=true; const birth=dateFromInput(els.birthDate.value);
 if(!birth){els.birthDateError.textContent='Zadejte platné datum narození.';ok=false}else if(birth>new Date(2026,11,31,23,59)){els.birthDateError.textContent='Tento model používá pravidla pro děti narozené nejpozději v roce 2026.';ok=false}
 const used=parseMoney(els.alreadyUsed.value); if(used<0){els.alreadyUsedError.textContent='Částka nemůže být záporná.';ok=false}
 if(state.goal==='duration'&&parseMoney(els.monthlyAmount.value)<=0){els.monthlyAmountError.textContent='Zadejte měsíční částku vyšší než 0 Kč.';ok=false}
 if(state.goal==='target'&&!monthFromInput(els.targetMonth.value)){els.targetMonthError.textContent='Zadejte cílový měsíc.';ok=false}
 if(state.mode==='advanced'&&parseMoney(els.dvz.value)<0){els.dvzError.textContent='DVZ nemůže být záporný.';ok=false}
 if(state.mode==='advanced'&&!monthFromInput(els.startMonth.value)){els.startMonthError.textContent='Zadejte měsíc začátku plánu.';ok=false}
 return ok;
}
function calculate(){
 if(!validate())return;
 const birth=dateFromInput(els.birthDate.value),multiple=els.childrenType.value==='multiple',rule=automaticRule(birth,multiple);
 let used=clamp(parseMoney(els.alreadyUsed.value),0,rule.total); if(parseMoney(els.alreadyUsed.value)>rule.total)els.alreadyUsedError.textContent=`Maximální nárok v tomto režimu je ${money(rule.total)}.`;
 const remaining=Math.max(0,rule.total-used);
 const now=new Date(); const fallbackStart=(now.getFullYear()===2026)?monthStart(now):new Date(2026,7,1,12);
 const requestedStart=state.mode==='advanced'?(monthFromInput(els.startMonth.value)||fallbackStart):fallbackStart;
 const start=maxDate(requestedStart,monthStart(birth));
 const deadline=monthStart(addYears(birth,rule.years));
 const availableMonths=monthsInclusive(start,deadline);
 const dvz=state.mode==='advanced'?Math.max(0,parseMoney(els.dvz.value)):0;
 const limit=monthlyLimit(dvz,multiple);
 let monthly=state.goal==='duration'?Math.max(0,parseMoney(els.monthlyAmount.value)):0;
 let target=null;
 if(state.goal==='target'){
   target=monthFromInput(els.targetMonth.value)||deadline;
   if(target<start){els.targetMonthError.textContent='Cílový měsíc je před začátkem plánu.';target=start}
   if(target>deadline)target=deadline;
   const targetMonths=Math.max(1,monthsInclusive(start,target)); monthly=remaining>0?Math.ceil(remaining/targetMonths):0;
 }
 const plan=planDuration(remaining,monthly,start);
 const end=state.goal==='target'&&remaining>0?target:plan.end;
 const overLimit=monthly>limit;
 const expired=remaining>0&&start>deadline;
 const misses=remaining>0&&end&&end>deadline;
 const monthsToDeadline=Math.max(1,availableMonths);
 const neededToDeadline=remaining>0?Math.ceil(remaining/monthsToDeadline):0;
 const reserve=end?monthDiff(end,deadline):0;
 let badge='V LIMITU',sentence='',runway='',status=''; let resultClass='';
 if(remaining===0){badge='VYČERPÁNO';sentence='Podle zadaných údajů už z celkového nároku nic nezbývá.';runway='Celkový balík je podle vstupu vyčerpán.';status='Celý zadaný nárok je už vyčerpán.'}
 else if(expired){badge='PO VĚKOVÉ HRANICI';resultClass='is-danger';sentence='Zadaný start plánu je až po orientační věkové hranici dítěte.';runway='Tento plán už nelze bezpečně modelovat jako běžné čerpání.';status='Zkontrolujte skutečný stav nároku v Jendě nebo na Úřadu práce.'}
 else if(overLimit){badge='NAD MĚSÍČNÍM LIMITEM';resultClass='is-warning';sentence=`Požadované tempo ${money(monthly)} je nad vypočteným maximem ${money(limit)}.`;runway='Časově může plán vycházet, ale zvolená částka potřebuje vyšší dostupný DVZ.';status=`Pro zvolené tempo je potřeba ověřit DVZ. Orientační maximum vychází ${money(limit)}.`}
 else if(misses){badge='RIZIKO NEDOČERPÁNÍ';resultClass='is-danger';sentence=`Současné tempo končí až po plánovací hranici. Do ní vychází alespoň ${money(neededToDeadline)} měsíčně.`;runway='Zvyšte měsíční částku nebo zkontrolujte skutečný zůstatek a datum startu.';status=`Při současném tempu může část zůstat nevyčerpaná. Orientační tempo do hranice je ${money(neededToDeadline)}.`}
 else if(reserve<=1){badge='TĚSNÁ REZERVA';resultClass='is-warning';sentence='Plán se vejde do věkové hranice, ale časová rezerva je malá.';runway='Nechte si raději prostor pro administrativní změnu nebo nepřesný start.';status='Plán je velmi těsný. Zvažte o něco vyšší tempo čerpání.'}
 else{badge='V LIMITU';sentence=`Při ${money(monthly)} měsíčně vychází přibližně ${pluralMonths(plan.months)}.`;runway='Plán končí před orientační věkovou hranicí dítěte.';status='Výchozí plán se vejde do měsíčního limitu i orientační časové hranice.'}
 els.result.classList.remove('is-warning','is-danger'); if(resultClass)els.result.classList.add(resultClass);
 els.resultRule.textContent=rule.label; els.resultBadge.textContent=badge;
 els.primaryLabel.textContent=state.goal==='target'?'Potřebné měsíční čerpání':'Zbývá vyčerpat';
 els.primaryResult.textContent=state.goal==='target'?money(monthly):money(remaining); els.resultSentence.textContent=sentence;
 els.monthlyResult.textContent=money(monthly); els.monthsResult.textContent=Number.isFinite(plan.months)?pluralMonths(plan.months):'—'; els.limitResult.textContent=money(limit); els.lastPaymentResult.textContent=remaining>0&&plan.months>0?money(plan.last):'0 Kč';
 els.runwayStart.textContent=formatMonth(start); els.runwayEnd.textContent=end?formatMonth(end):'—'; els.runwayDeadline.textContent=`hranice: ${formatMonth(deadline)}`; els.runwayText.textContent=runway;
 const ratio=availableMonths>0&&Number.isFinite(plan.months)?clamp(plan.months/availableMonths*100,0,100):100; els.runwayFill.style.width=`${ratio}%`; els.deadlinePin.style.left='97%';
 const usedPct=rule.total>0?clamp(used/rule.total*100,0,100):0; els.heroTotal.textContent=money(rule.total);els.heroUsed.textContent=money(used);els.heroRemaining.textContent=money(remaining);els.heroUsedBar.style.width=`${usedPct}%`;els.heroMonthly.textContent=money(monthly);els.heroMonths.textContent=Number.isFinite(plan.months)?pluralMonths(plan.months):'—';els.heroEnd.textContent=end?formatMonth(end):'—';els.heroStatus.textContent=status;
 renderOptions({remaining,start,deadline,limit,current:monthly,availableMonths});
 els.actionIntro.textContent=end?`Při tomto nastavení vychází poslední modelovaná platba na ${formatMonth(end)}. Teď zkontrolujte, jaký příjem domácnosti má v tomto období navázat.`:'Až znáte měsíc konce, zkontrolujte si, co bude příjem domácnosti nahrazovat potom.';
 syncPreset(monthly);
}
function renderOptions({remaining,start,deadline,limit,current,availableMonths}){
 if(remaining<=0){els.optionDeadlineAmount.textContent='0 Kč';els.optionDeadlineText.textContent='Balík je podle zadaného stavu už vyčerpán.';els.optionBalancedAmount.textContent='0 Kč';els.optionBalancedText.textContent='Není co rozkládat.';els.optionFastAmount.textContent='0 Kč';els.optionFastText.textContent='Není co zrychlovat.';return}
 const toDeadline=Math.ceil(remaining/Math.max(1,availableMonths));
 const balancedMonths=Math.max(1,Math.min(24,availableMonths));const balanced=Math.ceil(remaining/balancedMonths);
 const fast=Math.min(limit,Math.max(current||0,Math.ceil(balanced*1.35)));
 const p1=planDuration(remaining,toDeadline,start),p2=planDuration(remaining,balanced,start),p3=planDuration(remaining,fast,start);
 els.optionDeadlineAmount.textContent=`${money(toDeadline)} / měs.`;els.optionDeadlineText.textContent=toDeadline<=limit?`Orientačně do ${formatMonth(p1.end)}; využívá téměř celý dostupný čas.`:`Potřebné tempo je nad limitem ${money(limit)} – ověřte DVZ nebo skutečný zůstatek.`;
 els.optionBalancedAmount.textContent=`${money(balanced)} / měs.`;els.optionBalancedText.textContent=balanced<=limit?`Přibližně ${pluralMonths(p2.months)} do ${formatMonth(p2.end)}.`:`24měsíční tempo je nad vaším orientačním limitem.`;
 els.optionFastAmount.textContent=`${money(fast)} / měs.`;els.optionFastText.textContent=`Přibližně ${pluralMonths(p3.months)} do ${formatMonth(p3.end)}; částka respektuje vypočtený limit.`;
}
function setMode(mode){state.mode=mode;const basic=mode==='basic';els.basicTab.classList.toggle('is-active',basic);els.advancedTab.classList.toggle('is-active',!basic);els.basicTab.setAttribute('aria-selected',String(basic));els.advancedTab.setAttribute('aria-selected',String(!basic));els.basicTab.tabIndex=basic?0:-1;els.advancedTab.tabIndex=basic?-1:0;els.basicPanel.hidden=!basic;els.advancedPanel.hidden=basic;els.modeHelp.textContent=basic?'Pro základní plán stačí datum narození, počet dětí, již vyčerpaná částka a vaše měsíční tempo.':'Přesnější režim navíc používá DVZ a vlastní měsíc, od kterého chcete plánovat další čerpání.';calculate()}
function setGoal(goal){state.goal=goal;document.querySelectorAll('[data-goal]').forEach(b=>{const on=b.dataset.goal===goal;b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on))});els.durationField.hidden=goal!=='duration';els.targetField.hidden=goal!=='target';calculate()}
function syncPreset(monthly){document.querySelectorAll('.rp81-presets [data-amount]').forEach(b=>b.classList.toggle('is-active',Number(b.dataset.amount)===Math.round(monthly)))}
function setDefaultMonth(){const now=new Date();const d=now.getFullYear()===2026?now:new Date(2026,7,1);els.startMonth.value=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function formatInput(el){if(!el||el.type==='date'||el.type==='month')return;const n=parseMoney(el.value);if(Number.isFinite(n)&&n>=0)el.value=moneyFmt.format(Math.round(n))}
form.addEventListener('submit',e=>{e.preventDefault();calculate()});
['birthDate','childrenType','alreadyUsed','monthlyAmount','targetMonth','dvz','startMonth'].forEach(id=>{$(id)?.addEventListener('input',calculate);$(id)?.addEventListener('change',calculate)});
[els.alreadyUsed,els.monthlyAmount,els.dvz].forEach(el=>el?.addEventListener('blur',()=>{formatInput(el);calculate()}));
document.querySelectorAll('[data-goal]').forEach(b=>b.addEventListener('click',()=>setGoal(b.dataset.goal)));
document.querySelectorAll('.rp81-presets [data-amount]').forEach(b=>b.addEventListener('click',()=>{state.goal='duration';setGoal('duration');els.monthlyAmount.value=moneyFmt.format(Number(b.dataset.amount));calculate()}));
[els.basicTab,els.advancedTab].forEach((b,i,arr)=>{b.addEventListener('click',()=>setMode(b.dataset.mode));b.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const next=e.key==='ArrowRight'?arr[(i+1)%arr.length]:arr[(i-1+arr.length)%arr.length];next.focus();setMode(next.dataset.mode)})});
const menu=document.querySelector('.rp81-menu'),mobile=document.querySelector('.rp81-mobile-nav');if(menu&&mobile)menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));mobile.hidden=open});
setDefaultMonth();calculate();
})();
