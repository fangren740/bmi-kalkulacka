(function(){
  "use strict";
  const form=document.getElementById("maternityForm");
  if(!form)return;
  const $=id=>document.getElementById(id);
  const RH1=1633,RH2=2449,RH3=4897;
  const money=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:0});
  const shortDate=new Intl.DateTimeFormat("cs-CZ",{day:"numeric",month:"short",year:"numeric"});
  const fmt=n=>`${money.format(Math.round(Number.isFinite(n)?n:0))} Kč`;
  const pct=n=>`${money.format(Math.round(Number.isFinite(n)?n:0))} %`;
  let mode="basic";

  function number(id){const el=$(id);const n=Number(String(el&&el.value||"").replace(",","."));return Number.isFinite(n)?n:0}
  function addDays(date,days){const d=new Date(date.getTime());d.setDate(d.getDate()+Math.max(0,Math.round(days))-1);return d}
  function dateValue(id){const el=$(id);return el&&el.value?new Date(`${el.value}T12:00:00`):null}
  function duration(type){return({motherSingle:196,motherMultiple:259,takeoverSingle:154,takeoverMultiple:217})[type]||196}
  function durationWeeks(type){return({motherSingle:28,motherMultiple:37,takeoverSingle:22,takeoverMultiple:31})[type]||28}
  function reduceDvz(dvz){
    const p1=Math.min(Math.max(dvz,0),RH1);
    const p2=Math.min(Math.max(dvz-RH1,0),RH2-RH1)*.60;
    const p3=Math.min(Math.max(dvz-RH2,0),RH3-RH2)*.30;
    return Math.ceil(p1+p2+p3);
  }
  function dailyBenefit(dvz){return Math.ceil(reduceDvz(dvz)*.70)}
  function inputs(){
    const source=$("incomeSource").value;
    const monthly=Math.max(0,number("monthlyIncome"));
    const total=mode==="basic"?monthly*12:Math.max(0,number("periodIncome"));
    const days=mode==="basic"?365:Math.max(1,number("periodDays"));
    return{source,monthly:mode==="basic"?monthly:total/12,total,days,dvz:total/days};
  }
  function setText(id,value){const el=$(id);if(el)el.textContent=value}
  function calculate(){
    const data=inputs();
    const rdvz=reduceDvz(data.dvz);
    const daily=Math.ceil(rdvz*.70);
    const type=$("caseType").value;
    const daysTotal=duration(type);
    const weeks=durationWeeks(type);
    const total=daily*daysTotal;
    const m28=daily*28,m30=daily*30,m31=daily*31;
    const replacement=data.monthly>0?m30/data.monthly*100:0;
    const retained=data.dvz>0?rdvz/data.dvz*100:0;
    const start=dateValue("startDate");
    const end=start?addDays(start,daysTotal):null;

    setText("monthlyResult",fmt(m30));setText("dailyResult",fmt(daily));setText("totalResult",fmt(total));setText("durationResult",`${daysTotal} dnů`);setText("endResult",end?shortDate.format(end):"zadejte datum");
    setText("month28",fmt(m28));setText("month30",fmt(m30));setText("month31",fmt(m31));
    setText("dvzResult",fmt(data.dvz));setText("reducedDvzResult",fmt(rdvz));setText("retainedResult",pct(retained));setText("replacementResult",pct(replacement));
    setText("modeResultLabel",mode==="basic"?"odhad z měsíční mzdy":"výpočet z rozhodného období");
    setText("resultStatus",mode==="basic"?"Rychlý odhad PPM":"Přesnější výpočet PPM");
    setText("heroMonthly",fmt(m30));setText("heroDaily",fmt(daily));setText("heroTotal",fmt(total));setText("heroDuration",`${weeks} týdnů`);setText("heroIncome",data.source==="osvc"?"z měsíčních základů pojištění":`při průměru ${fmt(data.monthly)}`);setText("heroStart",start?shortDate.format(start):"—");setText("heroEnd",end?shortDate.format(end):"—");
    const max=m31||1;[["bar28",m28],["bar30",m30],["bar31",m31]].forEach(([id,val])=>{const el=$(id);if(el)el.style.width=`${Math.max(5,val/max*100)}%`});
    updateEligibility();
  }
  function updateEligibility(){
    const card=$("eligibilityCard");card.classList.remove("is-warning","is-success");
    if(mode==="basic"){
      setText("eligibilityIcon","i");setText("eligibilityTitle","Výši máte spočítanou. Nárok ještě ověřte.");setText("eligibilityText","Rychlý režim neověřuje dobu pojištění ani ochrannou lhůtu. Pro orientační kontrolu přepněte na přesnější výpočet.");return;
    }
    const insurance=number("insuranceDays");const active=$("insuredAtStart").checked;const osvc=$("incomeSource").value==="osvc";const osvcDays=number("osvcInsuranceDays");
    const ok=insurance>=270&&active&&(!osvc||osvcDays>=180);
    if(ok){card.classList.add("is-success");setText("eligibilityIcon","✓");setText("eligibilityTitle","Základní kontrola podmínek vychází kladně.");setText("eligibilityText","Zadané dny pojištění a stav při nástupu splňují orientační minimum. Konečný nárok a částku potvrzuje ČSSZ.");}
    else{card.classList.add("is-warning");setText("eligibilityIcon","!");setText("eligibilityTitle","Některá základní podmínka nemusí být splněna.");let reason=[];if(insurance<270)reason.push(`pojištění ${Math.round(insurance)} z požadovaných 270 dnů`);if(!active)reason.push("netrvá pojištění ani označená ochranná lhůta");if(osvc&&osvcDays<180)reason.push(`OSVČ pojištění ${Math.round(osvcDays)} z požadovaných 180 dnů`);setText("eligibilityText",`Zkontrolujte: ${reason.join(", ")}. Konkrétní situaci ověřte u OSSZ.`);}
  }
  function updateSource(){
    const osvc=$("incomeSource").value==="osvc";
    document.querySelectorAll(".osvc-only").forEach(el=>el.hidden=!osvc);
    setText("periodIncomeLabel",osvc?"Úhrn měsíčních základů za období":"Započitatelný příjem za období");
    setText("periodIncomeHelp",osvc?"Součet měsíčních základů, z nichž bylo zaplaceno nemocenské pojištění OSVČ.":"Obvykle součet započitatelné hrubé mzdy za 12 měsíců před nástupem.");
    setText("incomeSourceHelp",osvc?"Nezadávejte obrat ani daňový zisk. Použijte základy nemocenského pojištění.":"Zadejte příjem, ze kterého bylo odvedeno nemocenské pojištění.");
  }
  function setMode(next){
    mode=next;form.classList.toggle("is-basic",mode==="basic");form.classList.toggle("is-advanced",mode==="advanced");
    $("basicFields").hidden=mode!=="basic";$("advancedFields").hidden=mode!=="advanced";
    document.querySelectorAll(".mode-card").forEach(btn=>{const active=btn.dataset.mode===mode;btn.classList.toggle("is-active",active);btn.setAttribute("aria-pressed",String(active))});
    calculate();
  }
  function fillExamples(){
    const tbody=$("exampleTableBody");if(!tbody)return;
    tbody.innerHTML=[30000,45000,60000,90000,140000].map(monthly=>{const dvz=monthly*12/365;const daily=dailyBenefit(dvz);return`<tr><td>${fmt(monthly)}</td><td>${fmt(daily)}</td><td>${fmt(daily*30)}</td><td>${fmt(daily*196)}</td><td>${pct(daily*30/monthly*100)}</td></tr>`}).join("");
  }
  document.querySelectorAll(".mode-card").forEach(btn=>btn.addEventListener("click",()=>setMode(btn.dataset.mode)));
  ["monthlyIncome","periodIncome","periodDays","insuranceDays","osvcInsuranceDays","insuredAtStart","caseType","startDate"].forEach(id=>{const el=$(id);if(el){el.addEventListener("input",calculate);el.addEventListener("change",calculate)}});
  $("incomeSource").addEventListener("change",()=>{updateSource();calculate()});
  const start=$("startDate");if(start&&!start.value){const d=new Date();d.setDate(d.getDate()+42);start.value=d.toISOString().slice(0,10)}
  updateSource();fillExamples();setMode("basic");
})();
