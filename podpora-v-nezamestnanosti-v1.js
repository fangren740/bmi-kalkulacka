(()=>{
  'use strict';
  const AVG_WAGE=48171;
  const MAX_SUPPORT=Math.ceil(AVG_WAGE*.8);
  const FIXED={high:Math.ceil(AVG_WAGE*.4),middle:Math.ceil(AVG_WAGE*.2),low:Math.ceil(AVG_WAGE*.15)};
  const fmt=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
  const qs=id=>document.getElementById(id);
  const all=(selector,root=document)=>Array.from(root.querySelectorAll(selector));
  const money=n=>`${fmt.format(Math.max(0,Math.round(Number(n)||0)))} Kč`;
  const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
  const number=id=>{const el=qs(id);if(!el)return 0;const n=Number(String(el.value||'').replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?n:0};
  const todayISO=()=>{const d=new Date();const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
  const parseDate=value=>{if(!value)return null;const d=new Date(`${value}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const formatDate=d=>d?new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'numeric',year:'numeric'}).format(d):'—';
  const addMonths=(date,months)=>{const d=new Date(date.getTime());const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()+months);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return d};
  const fullAge=(birth,at)=>{let age=at.getFullYear()-birth.getFullYear();const before=at.getMonth()<birth.getMonth()||(at.getMonth()===birth.getMonth()&&at.getDate()<birth.getDate());if(before)age--;return age};
  const bracketFromAge=age=>age<=52?'under52':age<=57?'52to57':'over57';
  const bracketLabel=bracket=>bracket==='under52'?'do 52 let':bracket==='52to57'?'nad 52 do 57 let':'nad 57 let';
  const planForBracket=bracket=>bracket==='under52'?{months:5,high:2,middle:2,low:1}:bracket==='52to57'?{months:8,high:3,middle:3,low:2}:{months:11,high:3,middle:3,low:5};
  const ceilMoney=n=>Math.ceil(Math.max(0,n));
  const capped=n=>Math.min(MAX_SUPPORT,ceilMoney(n));
  const makeSchedule=(plan,source,base)=>{
    const result=[];
    for(let i=1;i<=plan.months;i++){
      let phase,rate,amount;
      if(i<=plan.high){phase='První období';rate=.8;amount=source==='fixed'?FIXED.high:capped(base*rate)}
      else if(i<=plan.high+plan.middle){phase='Druhé období';rate=.5;amount=source==='fixed'?FIXED.middle:capped(base*rate)}
      else{phase='Zbývající období';rate=.4;amount=source==='fixed'?FIXED.low:capped(base*rate)}
      result.push({month:i,phase,rate,amount,capped:source!=='fixed'&&ceilMoney(base*rate)>MAX_SUPPORT});
    }
    return result;
  };

  const state={mode:'basic'};
  const form=qs('unemploymentForm');
  const basicPanel=qs('basicPanel');
  const advancedPanel=qs('advancedPanel');
  const sourceBasic=qs('sourceBasic');
  const sourceAdvanced=qs('sourceAdvanced');
  const basicIncomeWrap=qs('basicIncomeWrap');
  const advancedIncomeWrap=qs('advancedIncomeWrap');

  function syncSourceFields(){
    const basicFixed=sourceBasic?.value==='fixed';
    const advancedFixed=sourceAdvanced?.value==='fixed';
    if(basicIncomeWrap)basicIncomeWrap.hidden=basicFixed;
    if(advancedIncomeWrap)advancedIncomeWrap.hidden=advancedFixed;
    const basicUnit=qs('basicIncomeUnit');
    const advUnit=qs('advancedIncomeUnit');
    if(basicUnit)basicUnit.textContent=sourceBasic?.value==='osvc'?'Kč / měsíc':'Kč čistého';
    if(advUnit)advUnit.textContent=sourceAdvanced?.value==='osvc'?'Kč / měsíc':'Kč čistého';
    const basicLabel=qs('basicIncomeLabel');
    const advLabel=qs('advancedIncomeLabel');
    if(basicLabel)basicLabel.textContent=sourceBasic?.value==='osvc'?'Poslední měsíční vyměřovací základ OSVČ':'Průměrný měsíční čistý výdělek';
    if(advLabel)advLabel.textContent=sourceAdvanced?.value==='osvc'?'Poslední vyměřovací základ přepočtený na měsíc':'Průměrný měsíční čistý výdělek potvrzený zaměstnavatelem';
  }

  function getInputs(){
    if(state.mode==='basic'){
      return{
        bracket:qs('ageBracket')?.value||'under52',
        source:sourceBasic?.value||'employee',
        base:number('basicIncome'),
        applicationDate:parseDate(qs('basicApplicationDate')?.value),
        birthDate:null,
        insuredMonths:qs('basicEligibility')?.checked?12:0,
        oldAgePension:false,
        grossBreach:false,
        previousSupport:false
      };
    }
    const applicationDate=parseDate(qs('applicationDate')?.value);
    const birthDate=parseDate(qs('birthDate')?.value);
    let bracket='under52';
    if(applicationDate&&birthDate)bracket=bracketFromAge(fullAge(birthDate,applicationDate));
    return{
      bracket,
      source:sourceAdvanced?.value||'employee',
      base:number('advancedIncome'),
      applicationDate,
      birthDate,
      insuredMonths:number('insuredMonths'),
      oldAgePension:!!qs('oldAgePension')?.checked,
      grossBreach:!!qs('grossBreach')?.checked,
      previousSupport:!!qs('previousSupport')?.checked
    };
  }

  function eligibility(inputs){
    const issues=[];
    if(inputs.insuredMonths<12)issues.push('Pro běžný vznik nároku chybí alespoň 12 měsíců důchodového pojištění nebo započitatelné náhradní doby v posledních dvou letech.');
    if(inputs.oldAgePension)issues.push('Příjemce starobního důchodu standardně nárok na podporu v nezaměstnanosti nemá.');
    if(inputs.grossBreach)issues.push('Skončení zaměstnání pro zvlášť hrubé porušení povinností v posledních šesti měsících může nárok vyloučit.');
    if(inputs.previousSupport)issues.push('Předchozí čerpání podpory může zkrátit novou podpůrčí dobu nebo vyžadovat nových devět měsíců pojištění; tento případ musí posoudit Úřad práce individuálně.');
    return issues;
  }

  function render(){
    syncSourceFields();
    const inputs=getInputs();
    const plan=planForBracket(inputs.bracket);
    const base=inputs.source==='fixed'?AVG_WAGE:Math.max(0,inputs.base);
    const schedule=makeSchedule(plan,inputs.source,base);
    const total=schedule.reduce((sum,item)=>sum+item.amount,0);
    const first=schedule[0]?.amount||0;
    const average=plan.months?total/plan.months:0;
    const capMonths=schedule.filter(item=>item.capped).length;
    const issues=eligibility(inputs);
    const missingDate=state.mode==='advanced'&&(!inputs.applicationDate||!inputs.birthDate);
    if(missingDate)issues.unshift('Pro přesné určení věkové skupiny doplňte datum narození i datum podání žádosti.');
    const missingIncome=inputs.source!=='fixed'&&inputs.base<=0;
    if(missingIncome)issues.unshift('Doplňte částku, ze které se má podpora počítat.');

    const resultStatus=qs('resultStatus');
    const statusText=issues.length?'Nutné ověřit podmínky':inputs.source==='fixed'?'Zákonné pevné částky':'Orientační nárok';
    if(resultStatus){resultStatus.textContent=statusText;resultStatus.className=`u-result-status${issues.length?' warning':''}`}
    const firstResult=qs('firstResult');if(firstResult)firstResult.textContent=money(first);
    const totalResult=qs('totalResult');if(totalResult)totalResult.textContent=money(total);
    const durationResult=qs('durationResult');if(durationResult)durationResult.textContent=`${plan.months} měsíců`;
    const averageResult=qs('averageResult');if(averageResult)averageResult.textContent=money(average);
    const bracketResult=qs('bracketResult');if(bracketResult)bracketResult.textContent=bracketLabel(inputs.bracket);
    const capResult=qs('capResult');if(capResult)capResult.textContent=capMonths?`${capMonths} měs.`:'ne';

    const summary=qs('resultSummary');
    if(summary){
      if(inputs.source==='fixed')summary.textContent=`Při zákonném náhradním výpočtu činí první období ${money(FIXED.high)}, druhé ${money(FIXED.middle)} a zbytek ${money(FIXED.low)} za celý měsíc.`;
      else summary.textContent=`Z částky ${money(inputs.base)} vychází první celé měsíční období na ${money(first)}. ${capMonths?`Strop ${money(MAX_SUPPORT)} zasáhne ${capMonths} ${capMonths===1?'měsíc':'měsíce nebo měsíců'}.`:'Zákonný strop výsledek nesnižuje.'}`;
    }
    const insight=qs('resultInsightText');
    if(insight){
      if(issues.length)insight.textContent=issues[0];
      else if(inputs.source==='fixed')insight.textContent='Pevné částky se používají například tehdy, když poslední započitatelnou dobou byla náhradní doba nebo nelze bez vlastního zavinění doložit výdělek.';
      else if(capMonths)insight.textContent=`U vyššího příjmu se část podpory zastaví na maximu ${money(MAX_SUPPORT)}. Vyšší výchozí výdělek už tuto část měsíční podpory nezvýší.`;
      else insight.textContent=`První období nahrazuje 80 % zadaného základu, poté sazba klesne na 50 % a nakonec na 40 %. Pro rozpočet proto sledujte celý průběh, ne jen první měsíc.`;
    }
    const alert=qs('resultAlert');
    if(alert){alert.classList.toggle('is-visible',issues.length>0);alert.textContent=issues.join(' ')}

    const list=qs('scheduleList');
    if(list){
      const max=Math.max(...schedule.map(item=>item.amount),1);
      list.innerHTML=schedule.map(item=>`<div class="u-month"><span>${item.month}. měs.</span><div class="u-month-track" title="${item.phase}: ${Math.round(item.rate*100)} %"><i style="width:${clamp(item.amount/max*100,5,100)}%"></i></div><strong>${money(item.amount)}</strong></div>`).join('');
    }
    const scheduleCaption=qs('scheduleCaption');
    if(scheduleCaption)scheduleCaption.textContent=`${plan.months} plných měsíčních období · sazby ${plan.high}× 80 %, ${plan.middle}× 50 %, ${plan.low}× 40 %`;

    const endResult=qs('endResult');
    if(endResult){
      if(inputs.applicationDate){const end=addMonths(inputs.applicationDate,plan.months);end.setDate(end.getDate()-1);endResult.textContent=formatDate(end)}else endResult.textContent='—';
    }
    const dateNote=qs('dateNote');
    if(dateNote)dateNote.textContent=inputs.applicationDate?'Orientační konec při nepřerušeném čerpání. Skutečné kalendářní výplaty mohou být za neúplný měsíc poměrné.':'Doplňte datum žádosti pro orientační konec podpůrčí doby.';

    const heroFirst=qs('heroFirst');if(heroFirst)heroFirst.textContent=money(first||Math.min(MAX_SUPPORT,36000));
    const heroDuration=qs('heroDuration');if(heroDuration)heroDuration.textContent=`${plan.months} měs.`;
    const heroTotal=qs('heroTotal');if(heroTotal)heroTotal.textContent=money(total);
    const heroBracket=qs('heroBracket');if(heroBracket)heroBracket.textContent=bracketLabel(inputs.bracket);
    const heroContext=qs('heroContext');if(heroContext)heroContext.textContent=inputs.source==='fixed'?'náhradní zákonný výpočet':`ze základu ${money(inputs.base||45000)}`;

    const limitHint=qs('limitHint');
    if(limitHint){
      const firstThreshold=Math.ceil(MAX_SUPPORT/.8);
      limitHint.textContent=`V prvním období se maximum ${money(MAX_SUPPORT)} uplatní přibližně od výchozího základu ${money(firstThreshold)}.`;
    }
  }

  all('[data-mode]').forEach(button=>button.addEventListener('click',()=>{
    state.mode=button.dataset.mode;
    all('[data-mode]').forEach(item=>{const active=item===button;item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active))});
    if(basicPanel)basicPanel.hidden=state.mode!=='basic';
    if(advancedPanel)advancedPanel.hidden=state.mode!=='advanced';
    const note=qs('modeNoteText');
    if(note)note.innerHTML=state.mode==='basic'?'<strong>Základní režim:</strong> stačí věková skupina, typ výchozího příjmu a částka. Výsledek ukáže plné měsíční částky.':'<strong>Pokročilý režim:</strong> datum narození a žádosti určí věkovou skupinu; doplňkové otázky upozorní na základní překážky nároku.';
    render();
  }));

  all('[data-income]').forEach(button=>button.addEventListener('click',()=>{
    const target=state.mode==='basic'?qs('basicIncome'):qs('advancedIncome');
    if(target){target.value=button.dataset.income;target.dispatchEvent(new Event('input',{bubbles:true}))}
  }));

  form?.addEventListener('input',render);
  form?.addEventListener('change',render);
  form?.addEventListener('submit',event=>{event.preventDefault();render();qs('vysledek')?.scrollIntoView({behavior:'smooth',block:'start'})});
  qs('resetBtn')?.addEventListener('click',()=>{
    form.reset();
    state.mode='basic';
    all('[data-mode]').forEach(item=>{const active=item.dataset.mode==='basic';item.classList.toggle('is-active',active);item.setAttribute('aria-pressed',String(active))});
    if(basicPanel)basicPanel.hidden=false;if(advancedPanel)advancedPanel.hidden=true;
    qs('basicIncome').value='45000';qs('advancedIncome').value='45000';qs('insuredMonths').value='12';
    const application=todayISO();qs('basicApplicationDate').value=application;qs('applicationDate').value=application;
    render();
  });

  const initialDate=todayISO();
  if(qs('basicApplicationDate')&&!qs('basicApplicationDate').value)qs('basicApplicationDate').value=initialDate;
  if(qs('applicationDate')&&!qs('applicationDate').value)qs('applicationDate').value=initialDate;
  render();
})();
