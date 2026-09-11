(function(){
  "use strict";
  const form=document.getElementById("monthlySalaryForm");
  if(!form)return;
  const body=document.body;
  const $=(id)=>document.getElementById(id);
  const MIN_HOURLY_2026=134.4;
  const moneyFmt=new Intl.NumberFormat("cs-CZ",{style:"currency",currency:"CZK",maximumFractionDigits:0});
  const numberFmt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:2});
  const oneFmt=new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:1});
  const state={mode:"basic"};

  function parseNumber(value){
    if(typeof value!=="string")value=String(value??"");
    const cleaned=value.trim().replace(/\s/g,"").replace(",",".");
    if(cleaned==="")return null;
    const parsed=Number(cleaned);
    return Number.isFinite(parsed)?parsed:null;
  }
  function read(id){const el=$(id);return el?parseNumber(el.value):null}
  function money(value){return moneyFmt.format(Number.isFinite(value)?value:0)}
  function number(value,digits=2){const f=digits===1?oneFmt:numberFmt;return f.format(Number.isFinite(value)?value:0)}
  function hours(value){return `${number(value)} h`}
  function rate(value){return `${number(value)} Kč/h`}
  function setText(id,value){const el=$(id);if(el)el.textContent=value}
  function setError(id,message){const el=$(id);if(el)el.textContent=message||""}
  function clamp(value,min,max){return Math.min(max,Math.max(min,value))}
  function selectedBasis(){const el=form.querySelector('input[name="basis"]:checked');return el?el.value:"average"}

  function validate(){
    const values={
      hourlyRate:read("hourlyRate"),weeklyHours:read("weeklyHours"),actualHours:read("actualHours"),
      unpaidHours:read("unpaidHours"),regularExtraHours:read("regularExtraHours"),overtimeHours:read("overtimeHours"),
      overtimePremium:read("overtimePremium"),averageHourly:read("averageHourly"),monthlyExtras:read("monthlyExtras"),annualBonus:read("annualBonus"),
      minimumRegime:Number($("minimumRegime")?.value||40),basis:selectedBasis()
    };
    let valid=true;
    const rules=[
      ["hourlyRate",values.hourlyRate,0.01,100000,"Zadejte kladnou hodinovou sazbu."],
      ["weeklyHours",values.weeklyHours,0.01,80,"Zadejte týdenní rozsah od 0 do 80 hodin."]
    ];
    if(values.basis==="actual")rules.push(["actualHours",values.actualHours,0.01,400,"Zadejte placený fond od 0 do 400 hodin."]);
    if(state.mode==="advanced"){
      rules.push(["unpaidHours",values.unpaidHours??0,0,400,"Neplacené hodiny musí být mezi 0 a 400."],
        ["regularExtraHours",values.regularExtraHours??0,0,400,"Další hodiny musí být mezi 0 a 400."],
        ["overtimeHours",values.overtimeHours??0,0,250,"Přesčasové hodiny musí být mezi 0 a 250."],
        ["overtimePremium",values.overtimePremium??0,0,500,"Příplatek musí být mezi 0 a 500 %."],
        ["monthlyExtras",values.monthlyExtras??0,0,10000000,"Měsíční složky nesmí být záporné."],
        ["annualBonus",values.annualBonus??0,0,100000000,"Roční bonus nesmí být záporný."]);
      if(values.averageHourly!==null)rules.push(["averageHourly",values.averageHourly,0,100000,"Průměrný výdělek nesmí být záporný."]);
    }
    ["hourlyRate","weeklyHours","actualHours","unpaidHours","regularExtraHours","overtimeHours","overtimePremium","averageHourly","monthlyExtras","annualBonus"].forEach(id=>setError(`${id}Error`,""));
    rules.forEach(([id,value,min,max,message])=>{if(value===null||value<min||value>max){setError(`${id}Error`,message);valid=false;}});
    return {valid,values};
  }

  function calculate(v){
    const averageMonthlyHours=v.weeklyHours*52/12;
    const selectedHours=v.basis==="actual"?v.actualHours:averageMonthlyHours;
    const basePaidHours=state.mode==="advanced"?Math.max(0,selectedHours-(v.unpaidHours||0)+(v.regularExtraHours||0)):selectedHours;
    const baseMonthly=v.hourlyRate*basePaidHours;
    const overtimeHours=state.mode==="advanced"?(v.overtimeHours||0):0;
    const averageHourly=state.mode==="advanced"&&(v.averageHourly!==null&&v.averageHourly>0)?v.averageHourly:v.hourlyRate;
    const overtimeBase=overtimeHours*v.hourlyRate;
    const overtimePremium=overtimeHours*averageHourly*((v.overtimePremium||0)/100);
    const monthlyExtras=state.mode==="advanced"?(v.monthlyExtras||0):0;
    const extraMonthly=overtimeBase+overtimePremium+monthlyExtras;
    const monthlyTotal=baseMonthly+extraMonthly;
    const annualBonus=state.mode==="advanced"?(v.annualBonus||0):0;
    const annualTotal=monthlyTotal*12+annualBonus;
    const weeklyBase=v.hourlyRate*v.weeklyHours;
    const shiftPay=v.hourlyRate*8;
    const paidHours=basePaidHours+overtimeHours;
    const effectiveHourly=paidHours>0?(monthlyTotal/paidHours):0;
    const minHourly=MIN_HOURLY_2026*40/v.minimumRegime;
    return {averageMonthlyHours,selectedHours,basePaidHours,baseMonthly,overtimeHours,averageHourly,overtimeBase,overtimePremium,monthlyExtras,extraMonthly,monthlyTotal,annualBonus,annualTotal,weeklyBase,shiftPay,paidHours,effectiveHourly,minHourly};
  }

  function interpretation(v,r){
    if(v.basis==="average"){
      return {title:"Toto je dlouhodobý průměr, ne přesná částka každé výplaty.",text:`Model používá ${number(r.averageMonthlyHours)} hodiny měsíčně. Pro konkrétní období zvolte skutečný fond a doplňte další složky.`};
    }
    if(state.mode==="advanced"&&r.extraMonthly>0){
      return {title:"Výsledek už modeluje základ i další hrubé složky.",text:`Základ tvoří ${money(r.baseMonthly)} a přesčas či další položky přidávají ${money(r.extraMonthly)}. Ověřte, že žádná složka není započtena dvakrát.`};
    }
    if(v.basis==="actual"){
      return {title:"Výsledek odpovídá zadanému placenému fondu.",text:`Použili jste ${hours(r.selectedHours)}. Pro kontrolu pásky doplňte v pokročilém režimu přesčas, bonusy a případné neplacené hodiny.`};
    }
    return {title:"Výsledek je orientační hrubý základ.",text:"Pro přesnější kontrolu použijte konkrétní mzdový fond a oddělte jednotlivé složky výplaty."};
  }

  function renderMinimum(v,r){
    const box=$("minimumCheck");
    if(!box)return;
    box.classList.remove("is-ok","is-warning","is-danger");
    if(state.mode!=="advanced"){
      setText("minimumHeadline","Otevřete pokročilý režim");
      setText("minimumText","Pro smysluplné srovnání je potřeba zvolit stanovenou týdenní pracovní dobu daného režimu.");
      return;
    }
    const diff=v.hourlyRate-r.minHourly;
    if(diff<-.005){
      box.classList.add("is-danger");
      setText("minimumHeadline",`Sazba je o ${money(Math.abs(diff))} za hodinu pod kontrolní hranicí.`);
      setText("minimumText",`Pro režim ${number(v.minimumRegime)} h týdně vychází orientační minimum ${rate(r.minHourly)}. Ověřte mzdový výpočet a složky započitatelné pro minimum.`);
    }else if(diff<10){
      box.classList.add("is-warning");
      setText("minimumHeadline","Sazba je těsně nad kontrolní hranicí.");
      setText("minimumText",`Kontrolní minimum pro zvolený režim je ${rate(r.minHourly)}. Malá rezerva zvyšuje význam správného fondu a započitatelných složek.`);
    }else{
      box.classList.add("is-ok");
      setText("minimumHeadline",`Sazba je o ${money(diff)} za hodinu nad kontrolní hranicí.`);
      setText("minimumText",`Kontrolní minimum pro režim ${number(v.minimumRegime)} h týdně je ${rate(r.minHourly)}. Jde o orientační kontrolu základní sazby, ne celé právní posouzení.`);
    }
  }

  function clearChildren(node){while(node&&node.firstChild)node.removeChild(node.firstChild)}
  function addCell(row,text,tag="td"){const cell=document.createElement(tag);cell.textContent=text;row.appendChild(cell)}
  function renderScenarios(v,r){
    const target=$("scenarioBody");if(!target)return;clearChildren(target);
    const values=[160,168,r.averageMonthlyHours,176,180];
    const seen=new Set();
    values.forEach(h=>{
      const key=h.toFixed(2);if(seen.has(key))return;seen.add(key);
      const row=document.createElement("tr");
      const amount=v.hourlyRate*h;
      const diff=amount-v.hourlyRate*r.averageMonthlyHours;
      addCell(row,h===r.averageMonthlyHours?`${number(h)} h · průměr`:`${number(h)} h`);
      addCell(row,money(amount));
      addCell(row,Math.abs(diff)<.5?"bez rozdílu":`${diff>0?"+":"−"}${money(Math.abs(diff))}`);
      target.appendChild(row);
    });
    const spread=v.hourlyRate*20;
    setText("scenarioHeadline",`Mezi 160 h a 180 h je rozdíl ${money(spread)}.`);
    setText("scenarioText",`Při sazbě ${rate(v.hourlyRate)} zvýší každých 10 placených hodin hrubý základ o ${money(v.hourlyRate*10)}.`);
    const max=180*v.hourlyRate||1;
    [["scaleLow",160],["scaleAverage",r.averageMonthlyHours],["scaleHigh",180]].forEach(([id,h])=>{const el=$(id);if(el)el.style.transform=`scaleX(${clamp(h*v.hourlyRate/max,.05,1)})`;});
  }

  function render(v,r){
    const info=interpretation(v,r);
    const basisLabel=v.basis==="average"?"průměrný měsíc":"konkrétní fond";
    const extraShare=r.monthlyTotal>0?r.extraMonthly/r.monthlyTotal:0;
    setText("heroMonthly",money(r.monthlyTotal));
    setText("heroBasis",`${basisLabel} · ${hours(r.selectedHours)}`);
    setText("heroWeekly",money(r.weeklyBase));
    setText("heroAnnual",money(r.annualTotal));
    setText("heroShift",money(r.shiftPay));
    setText("heroNote",state.mode==="advanced"&&r.extraMonthly>0?`Základ ${money(r.baseMonthly)} doplňují další hrubé složky ${money(r.extraMonthly)}.`:`${v.basis==="average"?"Průměrný měsíc vychází z 52 týdnů rozdělených do 12 měsíců.":"Výsledek vychází ze zadaného placeného fondu."} Čistou mzdu dopočítejte samostatně.`);
    const baseBar=$("heroBaseBar"),extraBar=$("heroExtraBar");
    if(baseBar){baseBar.style.width=`${clamp((1-extraShare)*100,0,100)}%`;baseBar.classList.toggle("is-full",extraShare<0.001);}
    if(extraBar){extraBar.style.width=`${clamp(extraShare*100,0,100)}%`;extraBar.classList.toggle("is-zero",extraShare<0.001);}
    setText("resultMode",state.mode==="advanced"?"Pokročilý režim":"Základní režim");
    setText("resultStatus",v.basis==="average"?"Průměrný měsíční přepočet":"Konkrétní mzdové období");
    setText("monthlyTotal",money(r.monthlyTotal));
    setText("baseMonthly",money(r.baseMonthly));
    setText("extraMonthly",money(r.extraMonthly));
    setText("annualTotal",money(r.annualTotal));
    setText("effectiveHourly",rate(r.effectiveHourly));
    const formulaParts=[`${rate(v.hourlyRate)} × ${hours(r.basePaidHours)}`];
    if(r.overtimeHours>0)formulaParts.push(`přesčas ${hours(r.overtimeHours)}`);
    if(r.monthlyExtras>0)formulaParts.push(`další ${money(r.monthlyExtras)}`);
    setText("resultFormula",formulaParts.join(" + "));
    setText("interpretationTitle",info.title);setText("interpretationText",info.text);
    setText("averageHoursCard",`${hours(r.averageMonthlyHours)} při ${hours(v.weeklyHours)} týdně`);
    setText("selectedHoursCard",`Aktuálně ${hours(r.selectedHours)}`);
    setText("extrasCard",`Navíc ${money(r.extraMonthly)}`);
    renderMinimum(v,r);renderScenarios(v,r);
  }

  function run(){
    const {valid,values}=validate();
    if(!valid)return;
    render(values,calculate(values));
  }

  function setMode(mode){
    state.mode=mode==="advanced"?"advanced":"basic";
    body.dataset.mode=state.mode;
    document.querySelectorAll("[data-mode]").forEach(btn=>{const active=btn.dataset.mode===state.mode;btn.classList.toggle("is-active",active);btn.setAttribute("aria-pressed",String(active));});
    const advanced=document.querySelector('[data-panel="advanced"]');if(advanced)advanced.hidden=state.mode!=="advanced";
    run();
  }
  function updateBasis(){const actual=selectedBasis()==="actual";$("actualHoursWrap")?.classList.toggle("is-hidden",!actual);run()}
  function setInput(id,value){const el=$(id);if(el){el.value=value;el.dispatchEvent(new Event("input",{bubbles:true}));}}

  document.querySelectorAll("[data-mode]").forEach(btn=>btn.addEventListener("click",()=>setMode(btn.dataset.mode)));
  document.querySelectorAll('input[name="basis"]').forEach(input=>input.addEventListener("change",updateBasis));
  document.querySelectorAll("[data-rate]").forEach(btn=>btn.addEventListener("click",()=>setInput("hourlyRate",btn.dataset.rate)));
  document.querySelectorAll("[data-weekly]").forEach(btn=>btn.addEventListener("click",()=>setInput("weeklyHours",btn.dataset.weekly)));
  ["hourlyRate","weeklyHours","actualHours","unpaidHours","regularExtraHours","overtimeHours","overtimePremium","averageHourly","monthlyExtras","annualBonus","minimumRegime"].forEach(id=>{$(id)?.addEventListener("input",run);$(id)?.addEventListener("change",run)});
  form.addEventListener("submit",event=>{event.preventDefault();run()});
  $("resetButton")?.addEventListener("click",()=>{
    const defaults={hourlyRate:"220",weeklyHours:"40",actualHours:"168",unpaidHours:"0",regularExtraHours:"0",overtimeHours:"0",overtimePremium:"25",averageHourly:"",monthlyExtras:"0",annualBonus:"0"};
    Object.entries(defaults).forEach(([id,value])=>{if($(id))$(id).value=value});
    if($("minimumRegime"))$("minimumRegime").value="40";
    const avg=form.querySelector('input[name="basis"][value="average"]');if(avg)avg.checked=true;
    setMode("basic");updateBasis();
  });
  updateBasis();setMode("basic");
})();