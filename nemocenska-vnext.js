(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const form=$('sicknessForm'); if(!form)return;
  const C={RH1:1633,RH2:2449,RH3:4897,HR1:285.78,HR2:428.58,HR3:856.98};
  const state={mode:'basic',worker:'employee'};
  const moneyNF=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
  const decNF=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2});
  const dateNF=new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'short',year:'numeric'});
  const parse=v=>{const n=Number(String(v??'').replace(/\s/g,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:0};
  const fmt=n=>`${moneyNF.format(Math.round(Number.isFinite(n)?n:0))} Kč`;
  const fmtHour=n=>`${decNF.format(Number.isFinite(n)?n:0)} Kč/h`;
  const set=(id,val)=>{const el=$(id);if(el)el.textContent=val};
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const localDateValue=id=>{const v=$(id)?.value;if(!v)return null;const [y,m,d]=v.split('-').map(Number);return y&&m&&d?new Date(y,m-1,d,12):null};
  const dateInputValue=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const addDays=(d,n)=>{if(!d)return null;const x=new Date(d);x.setDate(x.getDate()+Math.max(1,Math.round(n))-1);return x};

  function reduceDvz(dvz){
    const p1=Math.min(Math.max(dvz,0),C.RH1)*.90;
    const p2=Math.min(Math.max(dvz-C.RH1,0),C.RH2-C.RH1)*.60;
    const p3=Math.min(Math.max(dvz-C.RH2,0),C.RH3-C.RH2)*.30;
    return Math.ceil(p1+p2+p3);
  }
  function reduceHourly(hourly){
    const p1=Math.min(Math.max(hourly,0),C.HR1)*.90;
    const p2=Math.min(Math.max(hourly-C.HR1,0),C.HR2-C.HR1)*.60;
    const p3=Math.min(Math.max(hourly-C.HR2,0),C.HR3-C.HR2)*.30;
    return Math.ceil((p1+p2+p3)*100)/100;
  }
  function estimatedHours(start,duration,daysWeek,hoursShift){
    const total=Math.min(14,Math.max(0,Math.round(duration)));
    const days=clamp(Math.round(daysWeek)||5,1,7), hrs=clamp(hoursShift||8,0,24);
    if(!start)return total/7*days*hrs;
    let shifts=0;
    for(let i=0;i<total;i++){
      const d=new Date(start);d.setDate(d.getDate()+i);
      const wd=d.getDay()===0?7:d.getDay();
      if(wd<=days)shifts++;
    }
    return shifts*hrs;
  }
  function read(){
    if(state.mode==='basic'){
      const monthly=Math.max(0,parse($('monthlyIncome').value));
      const duration=clamp(Math.round(parse($('durationDays').value)||1),1,380);
      const start=localDateValue('startDate');
      const daysWeek=clamp(Math.round(parse($('workDaysWeek').value)||5),1,7);
      const shiftHours=clamp(parse($('shiftHours').value)||8,1,24);
      return {mode:'basic',worker:'employee',monthly,totalIncome:monthly*12,assessmentDays:365,dvz:monthly*12/365,hourly:monthly/173.92,duration,start,missedHours:estimatedHours(start,duration,daysWeek,shiftHours),daysWeek,shiftHours};
    }
    const totalIncome=Math.max(0,parse($('annualIncome').value));
    const assessmentDays=clamp(Math.round(parse($('assessmentDays').value)||365),1,366);
    const duration=clamp(Math.round(parse($('advancedDuration').value)||1),1,380);
    const start=localDateValue('advancedStartDate');
    return {mode:'advanced',worker:state.worker,monthly:totalIncome/12,totalIncome,assessmentDays,dvz:totalIncome/assessmentDays,hourly:state.worker==='employee'?Math.max(0,parse($('averageHourly').value)):0,duration,start,missedHours:state.worker==='employee'?Math.max(0,parse($('missedHours').value)):0,daysWeek:0,shiftHours:0};
  }
  function calc(v,duration=v.duration){
    const days=clamp(Math.round(duration),1,380);
    let missed=v.missedHours;
    if(v.mode==='basic')missed=estimatedHours(v.start,days,v.daysWeek,v.shiftHours);
    const rh=reduceHourly(v.hourly), hourlyComp=rh*.60;
    const employer=v.worker==='employee'?Math.round(hourlyComp*missed):0;
    const rdvz=reduceDvz(v.dvz);
    const rate60=Math.ceil(rdvz*.60),rate66=Math.ceil(rdvz*.66),rate72=Math.ceil(rdvz*.72);
    const d1=Math.min(Math.max(days-14,0),16),d2=Math.min(Math.max(days-30,0),30),d3=Math.max(days-60,0);
    const b1=d1*rate60,b2=d2*rate66,b3=d3*rate72,cssz=b1+b2+b3,total=employer+cssz;
    return {days,missed,reducedHourly:rh,hourlyComp,employer,rdvz,rate60,rate66,rate72,d1,d2,d3,b1,b2,b3,cssz,total};
  }
  function valid(v){
    const msg=$('formMessage');msg.hidden=true;msg.textContent='';
    if(v.mode==='basic'&&v.monthly<=0){msg.textContent='Zadejte kladnou měsíční hrubou mzdu.';msg.hidden=false;return false}
    if(v.mode==='advanced'&&v.totalIncome<=0){msg.textContent='Zadejte kladný započitatelný příjem za rozhodné období.';msg.hidden=false;return false}
    if(v.mode==='advanced'&&v.worker==='employee'&&v.hourly<=0){msg.textContent='Pro zaměstnance zadejte průměrný hodinový výdělek.';msg.hidden=false;return false}
    return true;
  }
  function bar(id,part,total){const el=$(id);if(el)el.style.width=total>0?`${Math.max(part>0?7:0,Math.min(100,part/total*100))}%`:'0%'}
  function render(){
    const v=read(); if(!valid(v))return;
    const r=calc(v), end=addDays(v.start,r.days);
    set('totalResult',fmt(r.total));set('employerResult',fmt(r.employer));set('csszResult',fmt(r.cssz));
    set('reducedHourlyResult',fmtHour(r.reducedHourly));set('missedHoursResult',`${decNF.format(r.missed)} h zameškáno`);set('reducedDvzResult',fmt(r.rdvz));set('dvzResult',`DVZ ${fmt(v.dvz)}`);set('dailyRatesResult',`${moneyNF.format(r.rate60)} / ${moneyNF.format(r.rate66)} / ${moneyNF.format(r.rate72)} Kč`);set('endDateResult',end?dateNF.format(end):'zadejte datum');
    set('band1Result',fmt(r.b1));set('band2Result',fmt(r.b2));set('band3Result',fmt(r.b3));bar('band1Bar',r.b1,r.cssz);bar('band2Bar',r.b2,r.cssz);bar('band3Bar',r.b3,r.cssz);
    set('resultStatus',`${r.days} ${r.days===1?'DEN':'DNŮ'} NESCHOPENKY`);
    let sentence='';
    if(v.worker==='osvc') sentence=r.days<=14?'U OSVČ kalkulačka v prvních 14 dnech nepočítá náhradu mzdy.':'U OSVČ je zobrazena pouze orientační dávka od 15. dne při splnění podmínek nemocenského pojištění.';
    else if(r.days<=14)sentence=`Celou modelovou částku tvoří náhrada mzdy za přibližně ${decNF.format(r.missed)} zameškaných hodin.`;
    else sentence=`Model rozděluje ${fmt(r.total)} na ${fmt(r.employer)} od zaměstnavatele a ${fmt(r.cssz)} od ČSSZ.`;
    set('resultSentence',sentence);
    set('heroTotal',fmt(r.total));set('heroEmployer',`${fmt(r.employer)} · zaměstnavatel`);set('heroCssz',`${fmt(r.cssz)} · ČSSZ`);set('heroIncome',v.worker==='osvc'?'OSVČ · zadaný pojistný základ':`při příjmu ${fmt(v.monthly)} měsíčně`);
    [14,30,60,90].forEach(d=>set(`scenario${d}`,fmt(calc(v,d).total)));
    set('bench30',fmt(calc(v,30).total));set('bench60',fmt(calc(v,60).total));set('bench90',fmt(calc(v,90).total));
  }
  function syncMode(mode){
    state.mode=mode;
    document.querySelectorAll('[data-mode]').forEach(b=>{const a=b.dataset.mode===mode;b.classList.toggle('is-active',a);b.setAttribute('aria-pressed',String(a))});
    document.querySelectorAll('[data-mode-card]').forEach(b=>{const a=b.dataset.modeCard===mode;b.classList.toggle('is-active',a)});
    $('basicPanel').hidden=mode!=='basic';$('advancedPanel').hidden=mode!=='advanced';render();
  }
  function syncWorker(worker){
    state.worker=worker;
    document.querySelectorAll('[data-worker]').forEach(b=>b.classList.toggle('is-active',b.dataset.worker===worker));
    document.querySelectorAll('.employee-only').forEach(el=>el.hidden=worker==='osvc');render();
  }
  function reset(){
    form.reset();state.worker='employee';
    const today=new Date();$('startDate').value=dateInputValue(today);$('advancedStartDate').value=dateInputValue(today);
    syncWorker('employee');syncMode('basic');
  }
  form.addEventListener('submit',e=>{e.preventDefault();render()});
  form.addEventListener('input',render);form.addEventListener('change',render);
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>syncMode(b.dataset.mode)));
  document.querySelectorAll('[data-mode-card]').forEach(b=>b.addEventListener('click',()=>syncMode(b.dataset.modeCard)));
  document.querySelectorAll('[data-worker]').forEach(b=>b.addEventListener('click',()=>syncWorker(b.dataset.worker)));
  $('resetButton').addEventListener('click',reset);
  const menu=$('menuBtn'),mobile=$('mobile-nav'); if(menu&&mobile)menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));mobile.classList.toggle('is-open',!open)});
  const today=new Date(); if(!$('startDate').value)$('startDate').value=dateInputValue(today);if(!$('advancedStartDate').value)$('advancedStartDate').value=dateInputValue(today);
  window.__SICK78_TEST__={reduceDvz,reduceHourly,calc};
  syncWorker('employee');syncMode('basic');
})();
