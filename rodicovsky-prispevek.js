(()=>{
  'use strict';

  const $=id=>document.getElementById(id);
  const form=$('parentalForm');
  if(!form) return;

  const els={
    durationGoalBtn:$('durationGoalBtn'),targetGoalBtn:$('targetGoalBtn'),
    basicModeBtn:$('basicModeBtn'),advancedModeBtn:$('advancedModeBtn'),
    basicMode:$('basicMode'),advancedMode:$('advancedMode'),
    monthlyField:$('monthlyField'),targetField:$('targetField'),phaseToggleField:$('phaseToggleField'),
    birthDate:$('birthDate'),childrenType:$('childrenType'),alreadyUsed:$('alreadyUsed'),monthlyAmount:$('monthlyAmount'),targetMonth:$('targetMonth'),
    startMonth:$('startMonth'),dvz:$('dvz'),customTotalEnabled:$('customTotalEnabled'),customTotalField:$('customTotalField'),customTotal:$('customTotal'),
    phaseEnabled:$('phaseEnabled'),phaseFields:$('phaseFields'),phaseAfter:$('phaseAfter'),phaseAmount:$('phaseAmount'),phaseOneText:$('phaseOneText'),
    formStatus:$('formStatus'),resetButton:$('resetButton'),
    resultBadge:$('resultBadge'),primaryResultLabel:$('primaryResultLabel'),primaryResult:$('primaryResult'),primaryResultSub:$('primaryResultSub'),
    usedPercent:$('usedPercent'),usedProgress:$('usedProgress'),usedValue:$('usedValue'),remainingValue:$('remainingValue'),
    durationMetricLabel:$('durationMetricLabel'),durationResult:$('durationResult'),endResult:$('endResult'),limitResult:$('limitResult'),deadlineResult:$('deadlineResult'),
    deadlineCard:$('deadlineCard'),deadlineGap:$('deadlineGap'),deadlineText:$('deadlineText'),adviceTitle:$('adviceTitle'),adviceText:$('adviceText'),scenarioList:$('scenarioList'),
    heroRemaining:$('heroRemaining'),heroRule:$('heroRule'),heroUsedLabel:$('heroUsedLabel'),heroProgressBar:$('heroProgressBar'),heroMonthly:$('heroMonthly'),heroDuration:$('heroDuration'),heroEnd:$('heroEnd'),heroDeadline:$('heroDeadline'),heroNote:$('heroNote')
  };

  const state={goal:'duration',advanced:false};
  const money=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
  const monthName=new Intl.DateTimeFormat('cs-CZ',{month:'long',year:'numeric'});

  const clamp=(value,min,max)=>Math.min(Math.max(value,min),max);
  const num=(input,fallback=0)=>{
    const value=Number(input?.value);
    return Number.isFinite(value)?value:fallback;
  };
  const formatMoney=value=>`${money.format(Math.round(Math.max(0,value)))} Kč`;
  const pluralMonths=value=>{
    const n=Math.max(0,Math.round(value));
    if(n===1) return '1 měsíc';
    if(n>=2&&n<=4) return `${n} měsíce`;
    return `${n} měsíců`;
  };
  const parseDate=value=>{
    if(!value) return null;
    const d=new Date(`${value}T12:00:00`);
    return Number.isNaN(d.getTime())?null:d;
  };
  const parseMonth=value=>{
    if(!value||!/^[0-9]{4}-[0-9]{2}$/.test(value)) return null;
    const [year,month]=value.split('-').map(Number);
    return new Date(year,month-1,1,12);
  };
  const monthStart=date=>new Date(date.getFullYear(),date.getMonth(),1,12);
  const addMonths=(date,count)=>new Date(date.getFullYear(),date.getMonth()+count,1,12);
  const addYears=(date,count)=>new Date(date.getFullYear()+count,date.getMonth(),date.getDate(),12);
  const monthsInclusive=(start,end)=>{
    const diff=(end.getFullYear()-start.getFullYear())*12+(end.getMonth()-start.getMonth());
    return Math.max(0,diff+1);
  };
  const monthDiff=(start,end)=>(end.getFullYear()-start.getFullYear())*12+(end.getMonth()-start.getMonth());
  const formatMonth=date=>monthName.format(date);

  function automaticRule(birth,multiple){
    const d2024=new Date(2024,0,1,12);
    const d2026=new Date(2026,0,1,12);
    if(birth<d2024){
      return {total:multiple?450000:300000,deadlineYears:4,label:multiple?'vícerčata • nárok 450 000 Kč':'jedno dítě • nárok 300 000 Kč',period:'do 31. 12. 2023'};
    }
    if(birth<d2026){
      return {total:multiple?525000:350000,deadlineYears:3,label:multiple?'vícerčata • nárok 525 000 Kč':'jedno dítě • nárok 350 000 Kč',period:'2024–2025'};
    }
    return {total:multiple?700000:350000,deadlineYears:3,label:multiple?'vícerčata • nárok 700 000 Kč':'jedno dítě • nárok 350 000 Kč',period:'od roku 2026'};
  }

  function monthlyLimit(dvz,multiple){
    const base=multiple?30000:15000;
    if(dvz<=0) return base;
    const calculated=.7*30*dvz*(multiple?2:1);
    return Math.max(base,calculated);
  }

  function durationPlan(remaining,firstAmount,phaseEnabled,phaseMonths,secondAmount,start){
    if(remaining<=0) return {months:0,end:start,lastPayment:0,firstSpent:0};
    if(firstAmount<=0) return {months:Infinity,end:null,lastPayment:0,firstSpent:0};

    if(!phaseEnabled){
      const months=Math.ceil(remaining/firstAmount);
      const lastPayment=remaining-firstAmount*(months-1);
      return {months,end:addMonths(start,Math.max(0,months-1)),lastPayment,firstSpent:Math.min(remaining,months*firstAmount)};
    }

    const firstMonths=Math.max(1,Math.floor(phaseMonths));
    const firstCapacity=firstAmount*firstMonths;
    if(remaining<=firstCapacity){
      const months=Math.ceil(remaining/firstAmount);
      return {months,end:addMonths(start,Math.max(0,months-1)),lastPayment:remaining-firstAmount*(months-1),firstSpent:remaining};
    }
    if(secondAmount<=0) return {months:Infinity,end:null,lastPayment:0,firstSpent:firstCapacity};
    const rest=remaining-firstCapacity;
    const secondMonths=Math.ceil(rest/secondAmount);
    const months=firstMonths+secondMonths;
    return {months,end:addMonths(start,months-1),lastPayment:rest-secondAmount*(secondMonths-1),firstSpent:firstCapacity};
  }

  function scenario(name,amount,remaining,start,deadline,limit){
    const safeAmount=Math.max(1,amount);
    const months=Math.ceil(remaining/safeAmount);
    const end=addMonths(start,Math.max(0,months-1));
    const inDeadline=end<=monthStart(deadline);
    const inLimit=safeAmount<=limit+.01;
    return {name,amount:safeAmount,months,end,inDeadline,inLimit};
  }

  function setGoal(goal){
    state.goal=goal;
    const isDuration=goal==='duration';
    els.durationGoalBtn.classList.toggle('is-active',isDuration);
    els.targetGoalBtn.classList.toggle('is-active',!isDuration);
    els.durationGoalBtn.setAttribute('aria-pressed',String(isDuration));
    els.targetGoalBtn.setAttribute('aria-pressed',String(!isDuration));
    els.monthlyField.hidden=!isDuration;
    els.targetField.hidden=isDuration;
    els.phaseToggleField.hidden=!isDuration;
    if(!isDuration){
      els.phaseFields.hidden=true;
    }else{
      els.phaseFields.hidden=!(state.advanced&&els.phaseEnabled.checked);
    }
    calculate();
  }

  function setMode(advanced){
    state.advanced=advanced;
    els.basicModeBtn.classList.toggle('is-active',!advanced);
    els.advancedModeBtn.classList.toggle('is-active',advanced);
    els.basicModeBtn.setAttribute('aria-selected',String(!advanced));
    els.advancedModeBtn.setAttribute('aria-selected',String(advanced));
    els.basicMode.hidden=false;
    els.advancedMode.hidden=!advanced;
    els.phaseFields.hidden=!(advanced&&state.goal==='duration'&&els.phaseEnabled.checked);
    calculate();
  }

  function renderScenarios(remaining,start,deadline,limit,availableMonths,currentAmount){
    if(remaining<=0){
      els.scenarioList.innerHTML='<div class="scenario-item"><div><span>Hotovo</span><strong>Celý nárok je již vyčerpán</strong></div><b>0 Kč</b></div>';
      return;
    }
    const minimum=Math.ceil(remaining/Math.max(1,availableMonths));
    const balanced=Math.ceil(remaining/Math.max(1,Math.min(availableMonths,24)));
    const fast=Math.min(limit,Math.max(currentAmount,balanced*1.25));
    const variants=[
      scenario('Do zákonného termínu',minimum,remaining,start,deadline,limit),
      scenario('Vyrovnaně do 24 měsíců',balanced,remaining,start,deadline,limit),
      scenario('Rychlejší varianta',fast,remaining,start,deadline,limit)
    ];
    els.scenarioList.innerHTML=variants.map(item=>{
      const status=!item.inLimit?'nad limitem':(!item.inDeadline?'po termínu':pluralMonths(item.months));
      return `<div class="scenario-item"><div><span>${item.name}</span><strong>${formatMoney(item.amount)} měsíčně</strong></div><b>${status}</b></div>`;
    }).join('');
  }

  function calculate(){
    const birth=parseDate(els.birthDate.value);
    const multiple=els.childrenType.value==='multiple';
    if(!birth){
      els.formStatus.textContent='Zadejte platné datum narození dítěte.';
      els.formStatus.className='form-status is-error';
      return;
    }

    const rule=automaticRule(birth,multiple);
    const total=state.advanced&&els.customTotalEnabled.checked?Math.max(0,num(els.customTotal,rule.total)):rule.total;
    const used=clamp(num(els.alreadyUsed,0),0,total);
    const remaining=Math.max(0,total-used);
    const start=state.advanced&&parseMonth(els.startMonth.value)?parseMonth(els.startMonth.value):monthStart(new Date());
    const deadline=addYears(birth,rule.deadlineYears);
    const deadlineMonth=monthStart(deadline);
    const availableMonths=monthsInclusive(start,deadlineMonth);
    const dvz=state.advanced?Math.max(0,num(els.dvz,0)):0;
    const limit=monthlyLimit(dvz,multiple);
    const phaseEnabled=state.advanced&&state.goal==='duration'&&els.phaseEnabled.checked;
    const phaseMonths=Math.max(1,Math.floor(num(els.phaseAfter,6)));
    const secondAmount=Math.max(0,num(els.phaseAmount,10000));

    let monthly=Math.max(0,num(els.monthlyAmount,15000));
    let plan;
    let target=null;
    if(state.goal==='target'){
      target=parseMonth(els.targetMonth.value)||deadlineMonth;
      if(target>deadlineMonth) target=deadlineMonth;
      if(target<start) target=start;
      const monthsToTarget=monthsInclusive(start,target);
      monthly=Math.ceil(remaining/Math.max(1,monthsToTarget));
      plan={months:monthsToTarget,end:target,lastPayment:remaining-monthly*(monthsToTarget-1),firstSpent:remaining};
    }else{
      plan=durationPlan(remaining,monthly,phaseEnabled,phaseMonths,secondAmount,start);
    }

    const usedPct=total>0?clamp(used/total*100,0,100):0;
    const end=plan.end;
    const deadlineDelta=end?monthDiff(end,deadlineMonth):0;
    const monthlyOver=monthly>limit+.01||(phaseEnabled&&secondAmount>limit+.01);
    const missesDeadline=end?end>deadlineMonth:false;
    const alreadyLate=start>deadlineMonth&&remaining>0;
    const neededToDeadline=remaining/Math.max(1,availableMonths);

    let badge='Plán je v limitu';
    let statusClass='form-status';
    let status='Výchozí model počítá s pravidly účinnými v roce 2026.';
    let adviceTitle='Praktický závěr';
    let adviceText='Plán má časovou rezervu. Ověřte, zda navazuje na konec mateřské, návrat do práce a další příjem domácnosti.';
    let heroNote='Plán se vejde do zákonné lhůty a nepřekračuje orientační měsíční limit.';

    els.deadlineCard.classList.remove('is-warning','is-danger');
    if(remaining===0){
      badge='Nárok vyčerpán';
      status='Podle zadaných hodnot již nezbývá žádná částka k čerpání.';
      adviceText='Zkontrolujte, zda údaj „již vyčerpáno“ odpovídá poslednímu rozhodnutí nebo přehledu Úřadu práce.';
      heroNote='Podle zadaných hodnot je celý nárok již vyčerpán.';
    }else if(alreadyLate||missesDeadline){
      badge='Riziko nedočerpání';
      statusClass='form-status is-error';
      status=`Současný plán se nevejde do zákonné lhůty. Orientačně je potřeba alespoň ${formatMoney(neededToDeadline)} měsíčně.`;
      adviceTitle='Plán je potřeba upravit';
      adviceText=`Při dostupném čase vychází orientační minimum ${formatMoney(neededToDeadline)} měsíčně. Pokud je nad vaším limitem, ověřte individuální možnosti na Úřadu práce.`;
      heroNote='Současné tempo může skončit až po zákonné hranici. Zvyšte částku nebo upravte start plánu.';
      els.deadlineCard.classList.add('is-danger');
    }else if(monthlyOver){
      badge='Nad měsíčním limitem';
      statusClass='form-status is-warning';
      status=`Zadaná částka překračuje orientační maximum ${formatMoney(limit)}. Vyšší volba vyžaduje odpovídající DVZ.`;
      adviceTitle='Ověřte dostupný DVZ';
      adviceText='Matematický plán je časově možný, ale zadaná měsíční částka je nad vypočteným limitem. Upravte částku nebo doplňte ověřený DVZ.';
      heroNote='Časově plán vychází, ale měsíční částka je nad orientačním limitem.';
      els.deadlineCard.classList.add('is-warning');
    }else if(deadlineDelta<=2){
      badge='Těsná časová rezerva';
      statusClass='form-status is-warning';
      status='Plán se vejde do termínu, ale rezerva je malá. Zkontrolujte datum startu a již vyčerpanou částku.';
      adviceText='Stačí malá změna výplaty nebo pozdější start a část nároku nemusí být vyčerpána včas. Zvažte mírně vyšší tempo.';
      heroNote='Plán se vejde do lhůty, ale časová rezerva je malá.';
      els.deadlineCard.classList.add('is-warning');
    }

    els.formStatus.textContent=status;
    els.formStatus.className=statusClass;
    els.resultBadge.textContent=badge;
    els.primaryResultLabel.textContent=state.goal==='target'?'Doporučené měsíční čerpání':'Zbývá vyčerpat';
    els.primaryResult.textContent=state.goal==='target'?formatMoney(monthly):formatMoney(remaining);
    els.primaryResultSub.textContent=state.goal==='target'
      ?`Pro rozložení do ${formatMonth(plan.end)} při zadaném zůstatku.`
      :(phaseEnabled?`${formatMoney(monthly)} prvních ${pluralMonths(phaseMonths)}, potom ${formatMoney(secondAmount)}.`:`Při ${formatMoney(monthly)} měsíčně přibližně ${pluralMonths(plan.months)}.`);

    els.usedPercent.textContent=`${Math.round(usedPct)} % vyčerpáno`;
    els.usedProgress.style.width=`${usedPct}%`;
    els.usedValue.textContent=`Vyčerpáno ${formatMoney(used)}`;
    els.remainingValue.textContent=`Zbývá ${formatMoney(remaining)}`;
    els.durationMetricLabel.textContent=state.goal==='target'?'Doba do cíle':'Doba čerpání';
    els.durationResult.textContent=Number.isFinite(plan.months)?pluralMonths(plan.months):'nelze určit';
    els.endResult.textContent=end?formatMonth(end):'—';
    els.limitResult.textContent=formatMoney(limit);
    els.deadlineResult.textContent=formatMonth(deadlineMonth);

    if(remaining===0){
      els.deadlineGap.textContent='hotovo';
      els.deadlineText.textContent='Celkový nárok je podle zadaných údajů již vyčerpán.';
    }else if(!end){
      els.deadlineGap.textContent='bez výpočtu';
      els.deadlineText.textContent='Pro výpočet konce je potřeba kladná měsíční částka.';
    }else if(deadlineDelta>=0){
      els.deadlineGap.textContent=deadlineDelta===0?'stejný měsíc':pluralMonths(deadlineDelta);
      els.deadlineText.textContent=`Plán končí ${deadlineDelta===0?'v měsíci zákonné hranice':`přibližně ${pluralMonths(deadlineDelta)} před zákonnou hranicí`}.`;
    }else{
      els.deadlineGap.textContent=`o ${pluralMonths(Math.abs(deadlineDelta))} později`;
      els.deadlineText.textContent='Při tomto tempu by část zůstatku mohla po zániku nároku zůstat nevyčerpaná.';
    }

    els.adviceTitle.textContent=adviceTitle;
    els.adviceText.textContent=adviceText;
    renderScenarios(remaining,start,deadline,limit,availableMonths,monthly);

    els.heroRemaining.textContent=formatMoney(remaining);
    els.heroRule.textContent=state.advanced&&els.customTotalEnabled.checked?`vlastní nárok ${formatMoney(total)}`:rule.label;
    els.heroUsedLabel.textContent=`${Math.round(usedPct)} %`;
    els.heroProgressBar.style.width=`${usedPct}%`;
    els.heroMonthly.textContent=formatMoney(monthly);
    els.heroDuration.textContent=Number.isFinite(plan.months)?pluralMonths(plan.months):'—';
    els.heroEnd.textContent=end?formatMonth(end):'—';
    els.heroDeadline.textContent=formatMonth(deadlineMonth);
    els.heroNote.textContent=heroNote;
    els.phaseOneText.textContent=`${formatMoney(num(els.monthlyAmount,0))} po dobu ${pluralMonths(phaseMonths)}`;
  }

  function reset(){
    form.reset();
    els.birthDate.value='2026-01-15';
    els.childrenType.value='single';
    els.alreadyUsed.value='60000';
    els.monthlyAmount.value='15000';
    els.targetMonth.value='2028-06';
    els.startMonth.value='2026-08';
    els.dvz.value='0';
    els.customTotal.value='350000';
    els.phaseAfter.value='6';
    els.phaseAmount.value='10000';
    els.customTotalField.hidden=true;
    els.phaseFields.hidden=true;
    setGoal('duration');
    setMode(false);
  }

  els.durationGoalBtn.addEventListener('click',()=>setGoal('duration'));
  els.targetGoalBtn.addEventListener('click',()=>setGoal('target'));
  els.basicModeBtn.addEventListener('click',()=>setMode(false));
  els.advancedModeBtn.addEventListener('click',()=>setMode(true));
  els.customTotalEnabled.addEventListener('change',()=>{els.customTotalField.hidden=!els.customTotalEnabled.checked;calculate();});
  els.phaseEnabled.addEventListener('change',()=>{els.phaseFields.hidden=!(state.advanced&&state.goal==='duration'&&els.phaseEnabled.checked);calculate();});
  els.childrenType.addEventListener('change',()=>{
    const birth=parseDate(els.birthDate.value);
    if(birth&&!els.customTotalEnabled.checked){
      els.customTotal.value=automaticRule(birth,els.childrenType.value==='multiple').total;
    }
    calculate();
  });
  els.birthDate.addEventListener('change',()=>{
    const birth=parseDate(els.birthDate.value);
    if(birth&&!els.customTotalEnabled.checked){
      els.customTotal.value=automaticRule(birth,els.childrenType.value==='multiple').total;
    }
    calculate();
  });
  form.addEventListener('input',event=>{
    if(event.target!==els.birthDate&&event.target!==els.childrenType) calculate();
  });
  form.addEventListener('change',calculate);
  form.addEventListener('submit',event=>{event.preventDefault();calculate();});
  els.resetButton.addEventListener('click',reset);

  calculate();
})();
