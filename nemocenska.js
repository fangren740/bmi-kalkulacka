(function(){
  "use strict";
  const form=document.getElementById("sicknessForm");
  if(!form)return;
  const $=id=>document.getElementById(id);
  const RH1=1633,RH2=2449,RH3=4897;
  const HR1=285.78,HR2=428.58,HR3=856.98;
  const money=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:0});
  const decimal=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2});
  const shortDate=new Intl.DateTimeFormat("cs-CZ",{day:"numeric",month:"short",year:"numeric"});
  let mode="basic";

  function value(id){const el=$(id);const n=Number(String(el&&el.value||"").replace(",","."));return Number.isFinite(n)?n:0}
  function text(id,val){const el=$(id);if(el)el.textContent=val}
  function fmt(n){return `${money.format(Math.round(Number.isFinite(n)?n:0))} Kč`}
  function fmtHour(n){return `${decimal.format(Number.isFinite(n)?n:0)} Kč/h`}
  function dateValue(){const el=$("startDate");return el&&el.value?new Date(`${el.value}T12:00:00`):null}
  function addDays(date,count){const d=new Date(date.getTime());d.setDate(d.getDate()+Math.max(1,Math.round(count))-1);return d}
  function reduceDvz(dvz){
    const p1=Math.min(Math.max(dvz,0),RH1)*.90;
    const p2=Math.min(Math.max(dvz-RH1,0),RH2-RH1)*.60;
    const p3=Math.min(Math.max(dvz-RH2,0),RH3-RH2)*.30;
    return Math.ceil(p1+p2+p3);
  }
  function reduceHourly(hourly){
    const p1=Math.min(Math.max(hourly,0),HR1)*.90;
    const p2=Math.min(Math.max(hourly-HR1,0),HR2-HR1)*.60;
    const p3=Math.min(Math.max(hourly-HR2,0),HR3-HR2)*.30;
    return Math.ceil((p1+p2+p3)*100)/100;
  }
  function countEstimatedHours(start,duration,daysPerWeek,hoursPerShift){
    const total=Math.min(Math.max(0,Math.round(duration)),14);
    if(!start)return total/7*Math.min(Math.max(daysPerWeek,1),7)*Math.max(hoursPerShift,0);
    let shifts=0;
    for(let i=0;i<total;i++){
      const d=new Date(start.getTime());d.setDate(d.getDate()+i);
      const weekday=d.getDay()===0?7:d.getDay();
      if(weekday<=Math.min(Math.max(Math.round(daysPerWeek),1),7))shifts++;
    }
    return shifts*Math.max(hoursPerShift,0);
  }
  function baseInputs(){
    const start=dateValue();
    const duration=Math.min(380,Math.max(1,Math.round(value("durationDays")||1)));
    const reduction=$("reductionType").value;
    if(mode==="basic"){
      const monthly=Math.max(0,value("monthlyIncome"));
      const workDays=Math.min(7,Math.max(1,value("workDaysWeek")||5));
      const shiftHours=Math.min(24,Math.max(0,value("shiftHours")||8));
      return{mode,worker:"employee",monthly,totalIncome:monthly*12,assessmentDays:365,dvz:monthly*12/365,hourly:monthly/173.92,missedHours:countEstimatedHours(start,duration,workDays,shiftHours),start,duration,reduction:"none",workDays,shiftHours};
    }
    const worker=$("workerType").value;
    const totalIncome=Math.max(0,value("annualIncome"));
    const assessmentDays=Math.min(366,Math.max(1,value("assessmentDays")||365));
    const monthly=totalIncome/12;
    const hourly=worker==="employee"?Math.max(0,value("averageHourly")):0;
    const missedHours=worker==="employee"?Math.max(0,value("missedHours")):0;
    return{mode,worker,monthly,totalIncome,assessmentDays,dvz:totalIncome/assessmentDays,hourly,missedHours,start,duration,reduction,workDays:0,shiftHours:0};
  }
  function resultFor(data,duration){
    const days=Math.min(380,Math.max(1,Math.round(duration)));
    let missed=data.missedHours;
    if(data.mode==="basic")missed=countEstimatedHours(data.start,days,data.workDays,data.shiftHours);
    if(days<14&&data.mode==="advanced")missed=Math.min(missed,missed*days/14);
    const reducedHourly=reduceHourly(data.hourly);
    let hourlyComp=reducedHourly*.60;
    if(data.reduction==="half")hourlyComp*=.50;
    const employer=data.worker==="employee"?hourlyComp*missed:0;
    const rdvz=reduceDvz(data.dvz);
    let rate60=Math.ceil(rdvz*.60),rate66=Math.ceil(rdvz*.66),rate72=Math.ceil(rdvz*.72);
    if(data.reduction==="half"){rate60=Math.ceil(rate60*.5);rate66=Math.ceil(rate66*.5);rate72=Math.ceil(rate72*.5)}
    const band1Days=Math.min(Math.max(days-14,0),16);
    const band2Days=Math.min(Math.max(days-30,0),30);
    const band3Days=Math.max(days-60,0);
    const band1=band1Days*rate60,band2=band2Days*rate66,band3=band3Days*rate72;
    const cssz=band1+band2+band3;
    return{days,missed,reducedHourly,hourlyComp,employer,rdvz,rate60,rate66,rate72,band1Days,band2Days,band3Days,band1,band2,band3,cssz,total:employer+cssz};
  }
  function setTrack(id,part,total){const el=$(id);if(el)el.style.width=total>0?`${Math.max(part>0?5:0,Math.min(100,part/total*100))}%`:"0%"}
  function updateDecision(data,r){
    if(data.worker==="osvc"){
      text("decisionTitle","OSVČ nemá náhradu mzdy za prvních 14 dnů");
      text("decisionText",r.days<=14?"Při neschopnosti do 14 dnů kalkulačka u OSVČ nepočítá žádnou dávku. Nárok od 15. dne závisí na dobrovolném nemocenském pojištění.":"Výsledek od 15. dne je použitelný jen tehdy, pokud zadaný základ odpovídá nemocenskému pojištění OSVČ a jsou splněny podmínky nároku.");
      return;
    }
    if(r.days<=14){text("decisionTitle","Krátká nemoc: rozhoduje rozvrh směn");text("decisionText","Celou částku platí zaměstnavatel jen za zameškané pracovní hodiny. Pro kontrolu výplatní pásky použijte přesnější režim a skutečný průměrný hodinový výdělek.");}
    else if(r.days<=30){text("decisionTitle","Od 15. dne už navazuje nemocenské ČSSZ");text("decisionText","Výsledek kombinuje dvě různá pravidla. První část závisí na směnách, druhá se platí za každý kalendářní den sazbou 60 % redukovaného DVZ.");}
    else if(r.days<=60){text("decisionTitle","Od 31. dne se denní dávka zvyšuje");text("decisionText","ČSSZ od 31. dne používá sazbu 66 % redukovaného DVZ. Pro rozpočet sledujte celkovou částku a dobu, po kterou musí pokrýt pravidelné výdaje.");}
    else{text("decisionTitle","Dlouhá neschopenka vyžaduje plán na více měsíců");text("decisionText","Od 61. dne se používá sazba 72 %, ale stále z redukovaného základu. Prověřte rezervu, splátky a případné další náklady spojené s léčbou.");}
  }
  function calculate(){
    const data=baseInputs();
    const r=resultFor(data,data.duration);
    const end=data.start?addDays(data.start,r.days):null;
    const avg=r.total/r.days;
    text("totalResult",fmt(r.total));text("employerResult",fmt(r.employer));text("csszResult",fmt(r.cssz));text("averageDailyResult",fmt(avg));text("endDateResult",end?shortDate.format(end):"zadejte datum");
    text("resultStatus",`${r.days} ${r.days===1?"den":"dnů"} neschopenky`);text("durationLabel",`po ${r.days} dnech`);text("employerDaysLabel",data.worker==="osvc"?"OSVČ bez náhrady":"zameškané směny do 14. dne");text("csszDaysLabel",`${r.band1Days+r.band2Days+r.band3Days} placených dnů`);
    text("missedHoursResult",`${decimal.format(r.missed)} h`);text("reducedHourlyResult",fmtHour(r.reducedHourly));text("hourlyCompResult",fmtHour(r.hourlyComp));
    text("band1Result",fmt(r.band1));text("band2Result",fmt(r.band2));text("band3Result",fmt(r.band3));text("dvzResult",fmt(data.dvz));text("reducedDvzResult",fmt(r.rdvz));text("dailyRatesResult",`${money.format(r.rate60)} / ${money.format(r.rate66)} / ${money.format(r.rate72)} Kč`);
    text("employerPhaseAmount",fmt(r.employer));text("csszPhaseAmount",fmt(r.cssz));text("employerPhaseMiniAmount",fmt(r.employer));text("csszPhaseMiniAmount",fmt(r.cssz));text("phaseSummary",r.cssz>0?"2 navazující období":"pouze první období");setTrack("employerTrack",r.employer,r.total);setTrack("csszTrack",r.cssz,r.total);
    text("heroTotal",fmt(r.total));text("heroEmployer",fmt(r.employer));text("heroCssz",fmt(r.cssz));text("heroDuration",`${r.days} dnů`);text("heroIncome",data.worker==="osvc"?"odhad pro pojištěnou OSVČ":`při příjmu ${fmt(data.monthly)} měsíčně`);text("heroStart",data.start?shortDate.format(data.start):"—");text("heroEnd",end?shortDate.format(end):"—");
    text("heroMessage",data.worker==="osvc"?"OSVČ nemá náhradu mzdy za prvních 14 dnů. Nemocenské může vzniknout od 15. dne při splnění podmínek pojištění.":r.days<=14?"Při krátké nemoci rozhoduje skutečný rozvrh směn v prvních 14 kalendářních dnech.":"Prvních 14 dnů platí zaměstnavatel za směny, od 15. dne ČSSZ za kalendářní dny.");
    [14,30,60,90].forEach(days=>text(`scenario${days}`,fmt(resultFor(data,days).total)));
    updateDecision(data,r);
  }
  function updateWorker(){
    const osvc=mode==="advanced"&&$("workerType").value==="osvc";
    document.querySelectorAll(".employee-only").forEach(el=>el.classList.toggle("is-hidden",osvc));
    text("formNote",osvc?"OSVČ nemá náhradu mzdy od zaměstnavatele. Výpočet od 15. dne je orientační a musí vycházet ze základů dobrovolného nemocenského pojištění, nikoli z obratu.":mode==="basic"?"Co kalkulačka předpokládá: stálou mzdu, 365 dnů rozhodného období, pravidelný pracovní týden a směny podle zadané délky. Přesný výsledek může ovlivnit rozvrh, vyloučené dny a podklady zaměstnavatele.":"Přesnější režim odděluje denní základ pro ČSSZ a průměrný hodinový výdělek pro zaměstnavatele. Zadejte skutečné údaje z rozhodného období a rozvrhu.");
  }
  function setMode(next){
    mode=next;
    form.classList.toggle("is-basic",mode==="basic");form.classList.toggle("is-advanced",mode==="advanced");
    $("basicFields").hidden=mode!=="basic";$("advancedFields").hidden=mode!=="advanced";
    document.querySelectorAll(".mode-card").forEach(btn=>{const active=btn.dataset.mode===mode;btn.classList.toggle("is-active",active);btn.setAttribute("aria-pressed",String(active))});
    updateWorker();calculate();
  }
  function reset(){
    form.reset();
    const now=new Date();$("startDate").value=now.toISOString().slice(0,10);
    setMode("basic");
  }
  document.querySelectorAll(".mode-card").forEach(btn=>btn.addEventListener("click",()=>setMode(btn.dataset.mode)));
  form.addEventListener("submit",e=>{e.preventDefault();calculate()});
  form.addEventListener("input",calculate);
  form.addEventListener("change",e=>{if(e.target.id==="workerType")updateWorker();calculate()});
  $("resetButton").addEventListener("click",reset);
  if(!$("startDate").value){const now=new Date();$("startDate").value=now.toISOString().slice(0,10)}
  setMode("basic");
})();
