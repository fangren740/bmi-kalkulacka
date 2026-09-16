(function(){
  "use strict";
  const form=document.getElementById("vacationPayForm");
  if(!form)return;
  const $=(id)=>document.getElementById(id);
  const moneyFmt=new Intl.NumberFormat("cs-CZ",{style:"currency",currency:"CZK",maximumFractionDigits:0});
  const numFmt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2});
  let mode="basic";
  let lastResult=null;

  function parseNumber(value){
    if(typeof value==="number")return Number.isFinite(value)?value:0;
    const normalized=String(value??"").replace(/[\s\u00a0]/g,"").replace(",",".");
    if(!/^\d+(?:\.\d+)?$/.test(normalized))return 0;
    const parsed=Number(normalized);
    return Number.isFinite(parsed)?parsed:0;
  }
  function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
  function money(value){return moneyFmt.format(Math.round(Math.max(0,value||0)));}
  function number(value){return numFmt.format(Math.max(0,value||0));}
  function rate(value){return `${number(value)} Kč/h`;}
  function hours(value){return `${number(value)} h`;}
  function selected(name){const input=form.querySelector(`input[name="${name}"]:checked`);return input?input.value:"";}

  function parseShiftList(value){
    const raw=String(value||"").trim();
    if(!raw)return [];
    const parts=/[;\n]/.test(raw)?raw.split(/[;\n]+/):raw.split(/\s+/);
    const numbers=parts.map(parseNumber);
    return numbers.length>1000||numbers.some((v)=>!(v>0&&v<=24))?[]:numbers;
  }

  function previousQuarterFromDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||"")))return "";
    const [y,m]=value.split("-").map(Number);
    const q=Math.floor((m-1)/3)+1;
    return q===1?`4. čtvrtletí ${y-1}`:`${q-1}. čtvrtletí ${y}`;
  }

  function basicInput(){
    return {
      mode:"basic",
      context:selected("basicContext"),
      average:clamp(parseNumber($("basicAverage").value),0,100000),
      vacationHours:clamp(parseNumber($("basicHours").value),0,10000),
      averageSource:"Průměr z podkladů",
      sourceShort:"z podkladů",
      quarterLabel:"ověřte platnost průměru",
      qualityStatus:"Použijte platný průměrný hodinový výdělek",
      qualityText:"Rychlý výpočet předpokládá, že zadaný průměrný hodinový výdělek je správný a platný pro dané období.",
      ordinaryRate:0,
      shiftLength:0,
      shiftCount:0,
      shiftList:[]
    };
  }

  function proAverageState(){
    const method=selected("averageMethod");
    const date=$("useDate").value;
    const quarterLabel=previousQuarterFromDate(date);
    if(!method)return {complete:false,next:"B. Vyberte, odkud máte průměrný výdělek."};
    if(!date)return {complete:false,next:"A. Zadejte datum čerpání nebo skončení pracovního poměru."};

    if(method==="direct"){
      const average=clamp(parseNumber($("proDirectAverage").value),0,100000);
      if(!(average>0))return {complete:false,next:"B. Zadejte průměrný hodinový výdělek z podkladů."};
      return {complete:true,average,source:"Průměr z podkladů",sourceShort:"z podkladů",quarterLabel,qualityStatus:"Přímý průměr připraven",qualityText:`Pro zadané datum vychází jako obecné rozhodné období ${quarterLabel}. Ověřte, že použitý průměr je pro toto období platný.`};
    }

    if(method==="probable"){
      const average=clamp(parseNumber($("proProbableAverage").value),0,100000);
      if(!(average>0))return {complete:false,next:"B. Zadejte pravděpodobný hodinový výdělek určený zaměstnavatelem."};
      return {complete:true,average,source:"Pravděpodobný výdělek",sourceShort:"pravděpodobný",quarterLabel,qualityStatus:"Použit pravděpodobný výdělek",qualityText:"Kalkulačka používá zadanou hodnotu. Samotné určení pravděpodobného výdělku je věcí zaměstnavatele podle § 355."};
    }

    const gross=clamp(parseNumber($("quarterGross").value),0,1000000000);
    const workedHours=clamp(parseNumber($("quarterHours").value),0,100000);
    const workedDays=clamp(parseNumber($("quarterDays").value),0,366);
    if(!(workedDays>0))return {complete:false,next:"B. Doplňte počet odpracovaných dnů v rozhodném období."};
    if(workedDays<21){
      const probable=clamp(parseNumber($("quarterProbableAverage").value),0,100000);
      if(!(probable>0))return {complete:false,blocked:true,next:"B. Méně než 21 odpracovaných dnů: zadejte pravděpodobný hodinový výdělek."};
      return {complete:true,average:probable,source:"Pravděpodobný výdělek · pod 21 dnů",sourceShort:"pravděpodobný",quarterLabel,qualityStatus:"Čtvrtletní podíl nebyl použit",qualityText:`Zadáno ${number(workedDays)} odpracovaných dnů. Pod hranicí 21 dnů kalkulačka používá pravděpodobný výdělek podle § 355.`};
    }
    if(!(gross>0))return {complete:false,next:"B. Doplňte započitatelnou hrubou mzdu za rozhodné období."};
    if(!(workedHours>0))return {complete:false,next:"B. Doplňte odpracované hodiny za rozhodné období."};
    const average=gross/workedHours;
    return {complete:true,average,source:"Kontrolní dopočet z čtvrtletí",sourceShort:"čtvrtletní dopočet",quarterLabel,qualityStatus:"Kontrolní dopočet připraven",qualityText:`Zadáno ${number(workedDays)} odpracovaných dnů. Kontrolní průměr vychází z poměru započitatelné hrubé mzdy a odpracovaných hodin za ${quarterLabel}.`};
  }

  function proVacationState(){
    const method=selected("vacationMode");
    if(!method)return {complete:false,next:"C. Vyberte, jak chcete zadat rozsah dovolené."};
    if(method==="hours"){
      const vacationHours=clamp(parseNumber($("proVacationHours").value),0,10000);
      if(!(vacationHours>0))return {complete:false,next:"C. Zadejte počet hodin dovolené."};
      return {complete:true,vacationHours,shiftLength:0,shiftCount:0,shiftList:[]};
    }
    if(method==="equal"){
      const shiftCount=clamp(parseNumber($("proShiftCount").value),0,1000);
      const shiftLength=clamp(parseNumber($("proShiftLength").value),0,24);
      if(!(shiftCount>0))return {complete:false,next:"C. Zadejte počet směn."};
      if(!(shiftLength>0))return {complete:false,next:"C. Zadejte délku jedné směny."};
      return {complete:true,vacationHours:shiftCount*shiftLength,shiftLength,shiftCount,shiftList:[]};
    }
    const shiftList=parseShiftList($("proShiftList").value);
    if(!shiftList.length)return {complete:false,next:"C. Zadejte platné délky všech směn (každá 0–24 hodin)."};
    const vacationHours=shiftList.reduce((s,v)=>s+v,0);
    return {complete:true,vacationHours,shiftLength:vacationHours/shiftList.length,shiftCount:shiftList.length,shiftList};
  }

  function proState(){
    const context=$("proContext").value;
    if(!context)return {complete:false,next:"A. Vyberte, zda dovolenou čerpáte, nebo řešíte zůstatek při skončení."};
    const averageState=proAverageState();
    if(!averageState.complete)return averageState;
    const vacationState=proVacationState();
    if(!vacationState.complete)return vacationState;
    return {complete:true,input:{mode:"pro",context,average:averageState.average,vacationHours:vacationState.vacationHours,averageSource:averageState.source,sourceShort:averageState.sourceShort,quarterLabel:averageState.quarterLabel,qualityStatus:averageState.qualityStatus,qualityText:averageState.qualityText,ordinaryRate:clamp(parseNumber($("ordinaryHourlyRate").value),0,100000),shiftLength:vacationState.shiftLength,shiftCount:vacationState.shiftCount,shiftList:vacationState.shiftList}};
  }

  function completionState(){
    if(mode==="basic"){
      const input=basicInput();
      if(!input.context)return {complete:false,next:"1. Vyberte, co právě řešíte."};
      if(!(input.average>0))return {complete:false,next:"2. Zadejte svůj průměrný hodinový výdělek."};
      if(!(input.vacationHours>0))return {complete:false,next:"3. Zadejte počet hodin dovolené."};
      return {complete:true,input};
    }
    return proState();
  }

  function calculate(input){
    const gross=input.average*input.vacationHours;
    const ordinaryTotal=input.ordinaryRate>0?input.ordinaryRate*input.vacationHours:0;
    const comparison=input.ordinaryRate>0?gross-ordinaryTotal:null;
    return Object.assign({},input,{gross,ordinaryTotal,comparison});
  }

  function contextTitle(context){return context==="termination"?"Náhrada za nevyčerpanou dovolenou při skončení":"Náhrada za čerpanou dovolenou";}
  function contextStatus(context){return context==="termination"?"Proplacení zůstatku je vázané na skončení pracovního poměru.":"Za dobu čerpání dovolené náleží náhrada ve výši průměrného výdělku.";}

  function renderIdle(state){
    lastResult=null;
    document.body.dataset.mode=mode;
    document.body.dataset.resultState=state&&state.blocked?"blocked":"idle";
    const next=(state&&state.next)||"Vyplňte požadované údaje.";
    $("modeStatus").textContent=mode==="pro"?"Detailní kontrola":"Rychlý výpočet";
    $("heroMode").textContent=mode==="pro"?"PRO":"RYCHLE";
    $("heroType").textContent=state&&state.blocked?"Je potřeba jiný průměr":"Výsledek po vyplnění";
    $("heroPay").textContent="Čeká na údaje";
    $("heroFormula").textContent=next;
    $("heroAverage").textContent="—";$("heroHours").textContent="—";$("heroSource").textContent="—";
    $("resultType").textContent=state&&state.blocked?"Výpočet čeká na pravděpodobný výdělek":"Čeká na vaše údaje";
    $("grossVacationPay").textContent="— Kč";
    $("resultFormula").textContent=next;
    $("resultStatus").textContent=next;
    $("resultLead").textContent=state&&state.blocked?"Když v rozhodném období nebylo alespoň 21 odpracovaných dnů, nepoužíváme čtvrtletní podíl jako zákonný průměr.":"Výsledek počítáme až z vašich údajů. Žádná ukázková částka se nevydává za váš výsledek.";
    $("resultHourly").textContent="—";$("resultHours").textContent="—";$("resultSource").textContent="—";$("resultQuarter").textContent="—";
    $("qualityStatus").textContent=state&&state.blocked?"Použijte pravděpodobný výdělek":"Čeká na údaje";
    $("qualityText").textContent=state&&state.blocked?"Doplňte pravděpodobný hodinový výdělek určený zaměstnavatelem.":"Pokud průměr neznáte, použijte detailní kontrolu.";
    $("comparisonBox").hidden=true;
    $("equationAverage").textContent="— Kč/h";$("equationHours").textContent="— h";$("equationTotal").textContent="— Kč";
  }

  function render(result){
    lastResult=result;
    document.body.dataset.mode=result.mode;
    document.body.dataset.resultState="ready";
    const type=contextTitle(result.context);
    const formula=`${rate(result.average)} × ${hours(result.vacationHours)}`;
    $("modeStatus").textContent=result.mode==="pro"?"Detailní kontrola":"Rychlý výpočet";
    $("heroMode").textContent=result.mode==="pro"?"PRO":"RYCHLE";
    $("heroType").textContent=type;$("heroPay").textContent=money(result.gross);$("heroFormula").textContent=formula;$("heroAverage").textContent=rate(result.average);$("heroHours").textContent=hours(result.vacationHours);$("heroSource").textContent=result.sourceShort;
    $("resultType").textContent=type;$("grossVacationPay").textContent=money(result.gross);$("resultFormula").textContent=formula;$("resultStatus").textContent=contextStatus(result.context);
    $("resultLead").textContent=result.context==="termination"?"Výsledek je hrubý model náhrady za zůstatek dovolené při skončení pracovního poměru.":"Výsledek je hrubá náhrada za hodiny dovolené před zúčtováním celé mzdy.";
    $("resultHourly").textContent=rate(result.average);$("resultHours").textContent=hours(result.vacationHours);$("resultSource").textContent=result.sourceShort;$("resultQuarter").textContent=result.quarterLabel||"—";
    $("qualityStatus").textContent=result.qualityStatus;$("qualityText").textContent=result.qualityText;
    $("equationAverage").textContent=rate(result.average);$("equationHours").textContent=hours(result.vacationHours);$("equationTotal").textContent=money(result.gross);
    if(result.comparison!==null){
      $("comparisonBox").hidden=false;
      const prefix=result.comparison>0?"+":result.comparison<0?"−":"";
      $("comparisonValue").textContent=`${prefix}${money(Math.abs(result.comparison))}`;
      $("comparisonText").textContent=`Srovnání s běžnou sazbou ${rate(result.ordinaryRate)}; zákonný výsledek se tím nemění.`;
    }else $("comparisonBox").hidden=true;
  }

  function updateQuarterUI(){
    const date=$("useDate").value;
    const q=previousQuarterFromDate(date);
    $("quarterLabel").textContent=q?`Rozhodné období: ${q}`:"Rozhodné období se určí podle data";
    const days=parseNumber($("quarterDays").value);
    const under=days>0&&days<21;
    $("probableGate").hidden=!under;
    $("quarterProbableField").hidden=!under;
  }

  function updateAverageFields(){
    const method=selected("averageMethod");
    $("directAverageField").hidden=method!=="direct";
    $("quarterFields").hidden=method!=="quarter";
    $("probableAverageField").hidden=method!=="probable";
    updateQuarterUI();
  }
  function updateVacationFields(){
    const method=selected("vacationMode");
    $("vacationHoursField").hidden=method!=="hours";
    $("equalShiftFields").hidden=method!=="equal";
    $("irregularShiftField").hidden=method!=="irregular";
  }

  function run(){
    updateAverageFields();updateVacationFields();
    const state=completionState();
    if(!state.complete){renderIdle(state);return;}
    render(calculate(state.input));
  }

  function copyBasicToPro(){
    const b=basicInput();
    if(b.context)$("proContext").value=b.context;
    if(b.average>0){form.querySelector('input[name="averageMethod"][value="direct"]').checked=true;$("proDirectAverage").value=number(b.average);}
    if(b.vacationHours>0){form.querySelector('input[name="vacationMode"][value="hours"]').checked=true;$("proVacationHours").value=number(b.vacationHours);}
    updateAverageFields();updateVacationFields();
  }

  function setMode(next,options){
    mode=next==="pro"?"pro":"basic";
    const pro=mode==="pro";
    $("basicPanel").hidden=pro;$("proPanel").hidden=!pro;
    $("basicTab").classList.toggle("is-active",!pro);$("proTab").classList.toggle("is-active",pro);
    $("basicTab").setAttribute("aria-selected",String(!pro));$("proTab").setAttribute("aria-selected",String(pro));
    form.dataset.mode=mode;
    if(pro&&options&&options.copyBasic)copyBasicToPro();
    run();
  }

  function resetBasic(){
    form.querySelectorAll('input[name="basicContext"]').forEach((i)=>i.checked=false);
    $("basicAverage").value="";$("basicHours").value="";syncPresets();run();
  }
  function resetPro(){
    $("proContext").value="";$("useDate").value="";
    form.querySelectorAll('input[name="averageMethod"],input[name="vacationMode"]').forEach((i)=>i.checked=false);
    ["proDirectAverage","quarterGross","quarterHours","quarterDays","quarterProbableAverage","proProbableAverage","proVacationHours","proShiftCount","proShiftLength","proShiftList","ordinaryHourlyRate"].forEach((id)=>$(id).value="");
    updateAverageFields();updateVacationFields();run();
  }

  function syncPresets(){
    const current=parseNumber($("basicHours").value);
    const exact=String($("basicHours").value).trim()!=="";
    form.querySelectorAll("[data-basic-hours]").forEach((button)=>{
      const chosen=exact&&current===Number(button.dataset.basicHours);
      button.classList.toggle("is-active",chosen);
      button.setAttribute("aria-pressed",String(chosen));
    });
  }

  function openProFrom(control){
    setMode("pro",{copyBasic:mode==="basic"});
    const shifts=control&&control.hasAttribute("data-focus-shifts");
    if(shifts){
      form.querySelector('input[name="vacationMode"][value="irregular"]').checked=true;
      updateVacationFields();run();
    }
    const target=shifts?$("irregularShiftField").closest(".vac-file-row"):$("prumer");
    target.scrollIntoView({behavior:"auto",block:"start"});
  }

  function resultText(r){return ["Kalkulačka náhrady mzdy za dovolenou 2026 – RychléVýpočty.cz",`Situace: ${contextTitle(r.context)}`,`Průměrný hodinový výdělek: ${rate(r.average)}`,`Hodiny dovolené: ${hours(r.vacationHours)}`,`Hrubá náhrada: ${money(r.gross)}`,`Zdroj průměru: ${r.averageSource}`,r.quarterLabel?`Rozhodné období: ${r.quarterLabel}`:null,"Výsledek je orientační a nenahrazuje mzdové ani právní posouzení."].filter(Boolean).join("\n");}
  async function copyResult(){
    if(!lastResult)return;
    const text=resultText(lastResult);
    try{await navigator.clipboard.writeText(text);$("copyResult").textContent="Zkopírováno";setTimeout(()=>$("copyResult").textContent="Kopírovat výsledek",1500);}catch(e){const t=document.createElement("textarea");t.value=text;t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();document.execCommand("copy");t.remove();}
  }

  form.addEventListener("submit",(e)=>{e.preventDefault();run();});
  $("basicTab").addEventListener("click",()=>setMode("basic"));
  $("proTab").addEventListener("click",()=>setMode("pro",{copyBasic:mode==="basic"}));
  document.querySelectorAll("[data-open-pro]").forEach((b)=>b.addEventListener("click",()=>openProFrom(b)));
  form.querySelectorAll("[data-basic-hours]").forEach((button)=>button.addEventListener("click",()=>{
    $("basicHours").value=button.dataset.basicHours;
    syncPresets();run();
  }));
  $("basicHours").addEventListener("input",syncPresets);
  $("copyFromBasic").addEventListener("click",()=>{copyBasicToPro();run();});
  $("resetBasic").addEventListener("click",resetBasic);$("resetPro").addEventListener("click",resetPro);
  form.querySelectorAll("input,select,textarea").forEach((control)=>{control.addEventListener("input",run);control.addEventListener("change",run);});
  $("copyResult").addEventListener("click",copyResult);$("printResult").addEventListener("click",()=>window.print());
  updateAverageFields();updateVacationFields();syncPresets();setMode("basic");
})();
