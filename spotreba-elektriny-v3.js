(() => {
  "use strict";
  const doc = document;
  const form = doc.getElementById("electricityForm");
  if (!form) return;
  const $ = (id) => doc.getElementById(id);
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const moneyFmt = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
  const numFmt = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
  const money = (value) => moneyFmt.format(Number.isFinite(value) ? value : 0);
  const number = (value, digits = 2) => new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const compactMoney = (value) => {
    if (!Number.isFinite(value)) return "0 Kč";
    if (Math.abs(value) >= 1000000) return `${number(value / 1000000, 1)} mil. Kč`;
    if (Math.abs(value) >= 1000) return `${number(value / 1000, 1)} tis. Kč`;
    return money(value);
  };
  const PRESETS = {
    heater: { power: 1500, hours: 2, days: 30 },
    computer: { power: 300, hours: 6, days: 30 },
    tv: { power: 90, hours: 4, days: 30 },
    custom: null,
  };
  const URL_MAP = {
    basicPower: "prikon", basicHours: "hodiny", basicDays: "dny", basicPrice: "cena", basicStandby: "standby", basicPeriod: "obdobi", basicBudget: "limit",
    advancedPower: "proPrikon", hoursPerUse: "delkaPouziti", usesPerWeek: "pouzitiTydne", loadFactor: "zatizeni", cycleConsumption: "cyklusKwh", cyclesPerWeek: "cyklyTydne", labelAnnual: "rocniKwh",
    highPrice: "vtCena", lowPrice: "ntCena", lowShare: "ntPodil", standbyPower: "proStandby", standbyHours: "standbyHodiny", allocatedFixed: "pevneNaklady",
    periodDays: "proObdobi", monthlyBudget: "proLimit", alternativeAnnual: "alternativaKwh", alternativePrice: "alternativaCena"
  };
  const numericIds = Object.keys(URL_MAP);
  let currentMode = "basic";
  let advancedStep = 0;
  let method = "power";
  let lastResult = null;

  function parseLocalized(value) {
    const normalized = String(value ?? "").replace(/[\s\u00a0]/g, "").replace(/,/g, ".").replace(/[^0-9.+-]/g, "");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function limits(input) { return { min: input.dataset.min === undefined ? -Infinity : parseLocalized(input.dataset.min), max: input.dataset.max === undefined ? Infinity : parseLocalized(input.dataset.max) }; }
  function read(id) { const input = $(id); if (!input) return 0; const { min, max } = limits(input); return clamp(parseLocalized(input.value), min, max); }
  function formatInput(id) { const input = $(id); if (!input) return; const decimals = ["basicHours","basicPrice","basicStandby","advancedPower","hoursPerUse","usesPerWeek","loadFactor","cycleConsumption","cyclesPerWeek","labelAnnual","highPrice","lowPrice","lowShare","standbyPower","standbyHours","alternativeAnnual"].includes(id) ? 2 : 0; input.value = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: decimals }).format(read(id)); }
  function setText(id, value) { const el = $(id); if (el) el.textContent = value; }

  function collectBasic() {
    const power = read("basicPower");
    const hours = read("basicHours");
    const days = read("basicDays");
    const price = read("basicPrice");
    const standbyPower = read("basicStandby");
    const activeMonthlyKwh = power / 1000 * hours * days;
    const standbyHours = Math.max(0, 24 - hours);
    const standbyMonthlyKwh = standbyPower / 1000 * standbyHours * days;
    const monthlyKwh = activeMonthlyKwh + standbyMonthlyKwh;
    const annualFactor = 12;
    const annualKwh = monthlyKwh * annualFactor;
    const annualActiveKwh = activeMonthlyKwh * annualFactor;
    const annualStandbyKwh = standbyMonthlyKwh * annualFactor;
    return {
      mode: "basic", method: "power", methodLabel: "příkon a čas", price, activeAnnualKwh: annualActiveKwh, standbyAnnualKwh: annualStandbyKwh,
      annualKwh, annualCost: annualKwh * price, allocatedFixed: 0, monthlyKwh, monthlyCost: monthlyKwh * price,
      periodDays: read("basicPeriod"), monthlyBudget: read("basicBudget"), activeHoursAnnual: hours * days * 12,
      power, alternativeAnnual: 0, alternativePrice: 0
    };
  }
  function collectAdvanced() {
    let activeAnnualKwh = 0;
    let activeHoursAnnual = 0;
    let methodLabel = "příkon a čas";
    if (method === "power") {
      const p = read("advancedPower"); const hours = read("hoursPerUse"); const uses = read("usesPerWeek"); const load = read("loadFactor") / 100;
      activeAnnualKwh = p / 1000 * hours * uses * 52 * load;
      activeHoursAnnual = hours * uses * 52;
    } else if (method === "cycle") {
      activeAnnualKwh = read("cycleConsumption") * read("cyclesPerWeek") * 52;
      activeHoursAnnual = 0;
      methodLabel = "spotřeba na cyklus";
    } else {
      activeAnnualKwh = read("labelAnnual");
      activeHoursAnnual = 0;
      methodLabel = "roční spotřeba ze štítku";
    }
    const high = read("highPrice"); const low = read("lowPrice"); const share = read("lowShare") / 100;
    const price = high * (1 - share) + low * share;
    const standbyAnnualKwh = read("standbyPower") / 1000 * read("standbyHours") * 365;
    const annualKwh = activeAnnualKwh + standbyAnnualKwh;
    const allocatedFixed = read("allocatedFixed");
    const annualCost = annualKwh * price + allocatedFixed;
    return {
      mode: "advanced", method, methodLabel, price, activeAnnualKwh, standbyAnnualKwh, annualKwh, annualCost, allocatedFixed,
      monthlyKwh: annualKwh / 12, monthlyCost: annualCost / 12, periodDays: read("periodDays"), monthlyBudget: read("monthlyBudget"), activeHoursAnnual,
      power: method === "power" ? read("advancedPower") : 0, alternativeAnnual: read("alternativeAnnual"), alternativePrice: read("alternativePrice")
    };
  }
  function validate(result) {
    const errors = [];
    if (result.price <= 0) errors.push("Cena elektřiny musí být vyšší než nula.");
    if (result.annualKwh < 0 || !Number.isFinite(result.annualKwh)) errors.push("Spotřebu se nepodařilo vypočítat.");
    if (currentMode === "basic" && read("basicHours") > 24) errors.push("Denní doba provozu může být nejvýše 24 hodin.");
    return errors;
  }
  function enrich(result) {
    const periodKwh = result.annualKwh / 365 * result.periodDays;
    const periodCost = result.annualCost / 365 * result.periodDays;
    const standbyShare = result.annualKwh > 0 ? result.standbyAnnualKwh / result.annualKwh * 100 : 0;
    const variableAnnualCost = result.annualKwh * result.price;
    const activeCost = result.activeAnnualKwh * result.price;
    const standbyCost = result.standbyAnnualKwh * result.price;
    const costPerHour = result.activeHoursAnnual > 0 ? activeCost / result.activeHoursAnnual : 0;
    const lowAnnualCost = result.activeAnnualKwh * .8 * result.price + result.standbyAnnualKwh * result.price + result.allocatedFixed;
    const highAnnualCost = result.activeAnnualKwh * 1.25 * result.price + result.standbyAnnualKwh * result.price + result.allocatedFixed;
    const alternativeAnnualCost = result.alternativeAnnual > 0 ? result.alternativeAnnual * result.price + result.allocatedFixed : 0;
    const annualSavings = result.alternativeAnnual > 0 ? result.annualCost - alternativeAnnualCost : 0;
    const payback = annualSavings > 0 && result.alternativePrice > 0 ? result.alternativePrice / annualSavings : null;
    return { ...result, periodKwh, periodCost, standbyShare, variableAnnualCost, activeCost, standbyCost, costPerHour, lowAnnualCost, highAnnualCost, alternativeAnnualCost, annualSavings, payback };
  }
  function interpretation(r) {
    if (r.standbyShare >= 20 && r.standbyAnnualKwh > 5) return { badge: "Standby tvoří významný podíl", kicker: "Nejdříve ověřte pohotovost", headline: "Nízký nepřetržitý odběr je důležitější než krátký aktivní provoz", text: `Pohotovostní režim tvoří přibližně ${number(r.standbyShare, 0)} % roční spotřeby. Ověřte jej měřičem a vypínejte pouze tehdy, pokud tím neomezíte bezpečnost, aktualizace nebo síťové funkce.` };
    if (r.annualCost >= 10000) return { badge: "Citelný roční náklad", kicker: "Kde hledat úsporu", headline: "Změna doby provozu má větší dopad než kosmetické úpravy", text: `Roční náklad je přibližně ${money(r.annualCost)}. Porovnejte kratší provoz, přesnější měření a úspornější variantu. U topení nebo ohřevu vody řešte zároveň stav budovy a regulaci.` };
    if (r.annualCost >= 2000) return { badge: "Střední provozní dopad", kicker: "Praktická interpretace", headline: "Výdaj už stojí za kontrolu skutečné spotřeby", text: `Roční náklad je přibližně ${money(r.annualCost)}. Jednorázové měření a realistický provozní scénář mohou rozhodnout, zda má smysl měnit nastavení nebo spotřebič.` };
    return { badge: "Nízký provozní dopad", kicker: "Praktická interpretace", headline: "Spotřebič pravděpodobně není hlavním zdrojem účtu", text: `Roční náklad je přibližně ${money(r.annualCost)}. Větší úsporu obvykle přinesou zařízení s vyšším příkonem, delším provozem nebo ohřevem a chlazením.` };
  }
  function renderBudget(r) {
    const box = $("budgetCheck"); if (!box) return;
    box.classList.remove("is-positive","is-negative");
    if (r.monthlyBudget <= 0) { setText("budgetDifference","Limit nebyl zadán"); setText("budgetMessage","Doplňte nepovinný měsíční limit a uvidíte rezervu nebo překročení."); return; }
    const diff = r.monthlyBudget - r.monthlyCost;
    if (diff >= 0) { box.classList.add("is-positive"); setText("budgetDifference",`Zbývá ${money(diff)} měsíčně`); setText("budgetMessage","Zadaný limit pokrývá modelový měsíční provoz spotřebiče."); }
    else { box.classList.add("is-negative"); setText("budgetDifference",`Limit překročen o ${money(Math.abs(diff))}`); setText("budgetMessage","Porovnejte kratší provoz, přesnější spotřebu nebo jiný spotřebič. Cena sama se kalkulačkou nemění."); }
  }
  function renderBreakdown(r) {
    const list = $("breakdownList"); if (!list) return;
    const rows = [
      { name:"Aktivní spotřeba", note:`${number(r.activeAnnualKwh,2)} kWh za rok`, value:r.activeCost },
      { name:"Pohotovostní odběr", note:`${number(r.standbyAnnualKwh,2)} kWh za rok`, value:r.standbyCost },
      { name:"Efektivní cena elektřiny", note:"vážená cena podle zadaného tarifu", value:r.price, unit:"Kč/kWh" },
      { name:"Volitelně alokované pevné náklady", note:"zahrnuté pouze na žádost uživatele", value:r.allocatedFixed },
      { name:"Celkový roční náklad", note:`${number(r.annualKwh,2)} kWh celkem`, value:r.annualCost, total:true },
      { name:`Náklad za ${number(r.periodDays,0)} dnů`, note:`${number(r.periodKwh,2)} kWh ve zvoleném období`, value:r.periodCost, total:true }
    ];
    list.replaceChildren(...rows.map(item => { const row=doc.createElement("div"); row.className=`electricity-breakdown-row${item.total?" is-total":""}`; const copy=doc.createElement("div"); const strong=doc.createElement("strong"); const small=doc.createElement("small"); const amount=doc.createElement("b"); strong.textContent=item.name; small.textContent=item.note; amount.textContent=item.unit ? `${number(item.value,2)} ${item.unit}` : money(item.value); copy.append(strong,small); row.append(copy,amount); return row; }));
  }
  function renderReplacement(r) {
    const box = $("replacementBox"); if (!box) return;
    if (r.alternativeAnnual <= 0) { box.hidden=true; return; }
    box.hidden=false;
    if (r.annualSavings <= 0) { setText("replacementHeadline","Zadaná alternativa nevytváří úsporu"); setText("replacementText",`Její modelový roční náklad je ${money(r.alternativeAnnualCost)}, tedy stejný nebo vyšší než aktuálních ${money(r.annualCost)}.`); return; }
    setText("replacementHeadline",`Roční úspora ${money(r.annualSavings)}`);
    if (r.payback !== null) setText("replacementText",`Při pořizovací ceně ${money(r.alternativePrice)} vychází jednoduchá návratnost přibližně ${number(r.payback,1)} roku. Model nezohledňuje životnost, opravy, financování ani zbytkovou hodnotu.`);
    else setText("replacementText",`Úspornější varianta má modelový roční náklad ${money(r.alternativeAnnualCost)}. Doplňte pořizovací cenu, pokud chcete orientační jednoduchou návratnost.`);
  }
  function renderHero(r) {
    setText("heroTotal",`${compactMoney(r.monthlyCost)}/měs.`); setText("heroMonthlyKwh",`${number(r.monthlyKwh,1)} kWh`); setText("heroYearlyCost",compactMoney(r.annualCost));
    setText("heroHourlyCost",r.costPerHour>0?money(r.costPerHour):"dle cyklu");
    setText("heroSummary",currentMode==="basic"?`Příkon ${number(read("basicPower"),0)} W používaný ${number(read("basicHours"),1)} hodiny denně.`:`Podrobný model metodou „${r.methodLabel}“.`);
  }
  function render() {
    const base = currentMode === "basic" ? collectBasic() : collectAdvanced();
    const errors = validate(base); setText("formStatus",errors.join(" ")); if (errors.length) return null;
    const r = enrich(base); const decision = interpretation(r); lastResult=r;
    setText("resultModeLabel",currentMode==="basic"?"Rychlý odhad":"Podrobný model"); setText("monthlyCost",`${money(r.monthlyCost)}/měs.`); setText("yearlySummary",`Ročně: ${number(r.annualKwh,1)} kWh · ${money(r.annualCost)}`); setText("resultSummary",`Aktivní provoz tvoří ${number(r.activeAnnualKwh,1)} kWh a pohotovost ${number(r.standbyAnnualKwh,1)} kWh za rok. Efektivní cena je ${number(r.price,2)} Kč/kWh.`); setText("monthlyConsumption",`${number(r.monthlyKwh,1)} kWh`); setText("methodLabel",r.methodLabel); setText("yearlyCost",money(r.annualCost)); setText("costPerHour",r.costPerHour>0?money(r.costPerHour):"dle cyklu"); setText("hourLabel",r.costPerHour>0?"náklad aktivního provozu":"metoda nemá hodinový údaj"); setText("standbyShare",`${number(r.standbyShare,0)} %`); setText("standbyLabel",`${number(r.standbyAnnualKwh,1)} kWh ročně`); setText("costBadge",decision.badge); setText("decisionKicker",decision.kicker); setText("decisionHeadline",decision.headline); setText("decisionText",decision.text); setText("scenarioLow",money(r.lowAnnualCost)); setText("scenarioCurrent",money(r.annualCost)); setText("scenarioHigh",money(r.highAnnualCost)); renderBudget(r); renderBreakdown(r); renderReplacement(r); renderHero(r); return r;
  }
  function setMode(modeValue,{renderNow=true}={}) { currentMode=modeValue==="advanced"?"advanced":"basic"; doc.querySelectorAll(".electricity-mode-btn").forEach(btn=>{const active=btn.dataset.mode===currentMode;btn.classList.toggle("is-active",active);btn.setAttribute("aria-pressed",String(active));}); $("advancedCalculation").hidden=currentMode!=="advanced"; setText("formTitle",currentMode==="advanced"?"Zpřesněte spotřebu a cenu":"Začněte rychlým odhadem"); setText("formLead",currentMode==="advanced"?"Vyberte příkon a čas, spotřebu na cyklus nebo roční údaj ze štítku. Potom doplňte tarify, standby a případné porovnání.":"Čtyři údaje stačí pro první srozumitelný výsledek. Podrobný režim přidá cykly, energetický štítek, dva tarify, standby a porovnání úspornější varianty."); if(renderNow)render(); }
  function setStep(index) { const stages=[...doc.querySelectorAll("[data-advanced-stage]")]; const buttons=[...doc.querySelectorAll("[data-advanced-step]")]; advancedStep=clamp(Number(index)||0,0,stages.length-1); stages.forEach((stage,i)=>stage.hidden=i!==advancedStep); buttons.forEach((btn,i)=>{btn.classList.toggle("is-active",i===advancedStep); if(i===advancedStep)btn.setAttribute("aria-current","step"); else btn.removeAttribute("aria-current");}); $("advancedPrev").disabled=advancedStep===0; $("advancedNext").disabled=advancedStep===stages.length-1; $("advancedNext").textContent=advancedStep===stages.length-1?"Všechny kroky hotové":"Další krok →"; setText("advancedStepStatus",`Krok ${advancedStep+1} ze ${stages.length}`); }
  function setMethod(next,{renderNow=true}={}) { method=["power","cycle","annual"].includes(next)?next:"power"; doc.querySelectorAll("[data-method]").forEach(btn=>{const active=btn.dataset.method===method;btn.classList.toggle("is-active",active);btn.setAttribute("aria-pressed",String(active));}); doc.querySelectorAll("[data-method-panel]").forEach(panel=>panel.hidden=panel.dataset.methodPanel!==method); if(renderNow)render(); }
  function applyPreset(name) { const preset=PRESETS[name]; doc.querySelectorAll("[data-preset]").forEach(btn=>{const active=btn.dataset.preset===name;btn.classList.toggle("is-active",active);btn.setAttribute("aria-pressed",String(active));}); if(!preset)return; $("basicPower").value=preset.power; $("basicHours").value=preset.hours; $("basicDays").value=preset.days; ["basicPower","basicHours","basicDays"].forEach(formatInput); render(); }
  function shareUrl() { const url=new URL(window.location.href); url.search=""; Object.entries(URL_MAP).forEach(([id,key])=>url.searchParams.set(key,String(read(id)))); url.searchParams.set("rezim",currentMode); url.searchParams.set("metoda",method); return url.toString(); }
  function loadUrl() { const p=new URLSearchParams(window.location.search); Object.entries(URL_MAP).forEach(([id,key])=>{if(!p.has(key)||!$(id))return;$(id).value=p.get(key)??"";formatInput(id);}); setMode(p.get("rezim")==="advanced"?"advanced":"basic",{renderNow:false}); setMethod(p.get("metoda")||"power",{renderNow:false}); }
  async function copyText(value,success){try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(value);else{const area=doc.createElement("textarea");area.value=value;area.style.position="fixed";area.style.opacity="0";doc.body.appendChild(area);area.select();if(!doc.execCommand("copy"))throw new Error("copy");area.remove();}setText("copyStatus",success);}catch{setText("copyStatus","Kopírování se nepodařilo. Odkaz můžete zkopírovat z adresního řádku.");}}
  function resultText(){if(!lastResult)return"";const r=lastResult;return["Spotřeba elektřiny – RychléVýpočty.cz",`Režim: ${r.mode==="advanced"?"podrobný":"rychlý"}`,`Metoda: ${r.methodLabel}`,`Měsíční spotřeba: ${number(r.monthlyKwh,1)} kWh`,`Měsíční náklad: ${money(r.monthlyCost)}`,`Roční spotřeba: ${number(r.annualKwh,1)} kWh`,`Roční náklad: ${money(r.annualCost)}`,`Pohotovostní odběr: ${number(r.standbyAnnualKwh,1)} kWh za rok`,`Efektivní cena: ${number(r.price,2)} Kč/kWh`,`Výsledek je orientační a nenahrazuje měření ani kontrolu vyúčtování.`].join("\n");}
  function resetAll(){form.reset();numericIds.forEach(formatInput);setText("copyStatus","");setText("formStatus","");setMethod("power",{renderNow:false});setStep(0);setMode("basic",{renderNow:false});applyPreset("heater");render();}
  function renderExamples(){const annual=(power,hours,days=365)=>power/1000*hours*days*6.5;setText("exampleLed",`${number(10/1000*5*365,1)} kWh · ${money(annual(10,5))} ročně`);setText("exampleComputer",`${number(300/1000*6*365,0)} kWh · ${money(annual(300,6))} ročně`);setText("exampleHeater",`${number(1500/1000*2*365,0)} kWh · ${money(annual(1500,2))} ročně`);setText("exampleStandby",`${number(10/1000*24*365,1)} kWh · ${money(annual(10,24))} ročně`);}
  form.addEventListener("submit",e=>{e.preventDefault();render();});
  numericIds.forEach(id=>{const el=$(id);if(!el)return;el.addEventListener("input",render);el.addEventListener("change",render);el.addEventListener("blur",()=>{formatInput(id);render();});});
  doc.querySelectorAll(".electricity-mode-btn").forEach(btn=>btn.addEventListener("click",()=>setMode(btn.dataset.mode)));
  doc.querySelectorAll("[data-preset]").forEach(btn=>btn.addEventListener("click",()=>applyPreset(btn.dataset.preset)));
  doc.querySelectorAll("[data-method]").forEach(btn=>btn.addEventListener("click",()=>setMethod(btn.dataset.method)));
  doc.querySelectorAll("[data-advanced-step]").forEach(btn=>btn.addEventListener("click",()=>setStep(btn.dataset.advancedStep)));
  $("advancedPrev")?.addEventListener("click",()=>setStep(advancedStep-1)); $("advancedNext")?.addEventListener("click",()=>setStep(advancedStep+1)); $("resetBtn")?.addEventListener("click",resetAll); $("copyResultBtn")?.addEventListener("click",()=>copyText(resultText(),"Výsledek byl zkopírován.")); $("copyLinkBtn")?.addEventListener("click",()=>copyText(shareUrl(),"Odkaz s nastavením byl zkopírován.")); $("toggleBreakdown")?.addEventListener("click",e=>{const wrap=$("breakdownWrap");const collapsed=wrap.classList.toggle("is-collapsed");e.currentTarget.setAttribute("aria-expanded",String(!collapsed));e.currentTarget.textContent=collapsed?"Zobrazit detail":"Skrýt detail";});
  loadUrl(); numericIds.forEach(formatInput); setStep(0); renderExamples(); render();
})();
