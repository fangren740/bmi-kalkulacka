(() => {
  "use strict";
  const doc = document;
  const $ = (id) => doc.getElementById(id);
  const root = doc.body;
  const form = $("heatingCostForm");
  if (!form) return;

  const moneyFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const oneDecimal = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const money = (value) => `${moneyFormat.format(Number.isFinite(value) ? value : 0)} Kč`;
  const number = (value) => oneDecimal.format(Number.isFinite(value) ? value : 0);
  const compactMoney = (value) => {
    if (!Number.isFinite(value)) return "0 Kč";
    if (value >= 1000000) return `${number(value / 1000000)} mil. Kč`;
    if (value >= 1000) return `${number(value / 1000)} tis. Kč`;
    return money(value);
  };
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const BUILDINGS = {
    veryLow: { label: "velmi úsporná budova", demand: 35, uncertainty: 0.16 },
    low: { label: "dobře zateplená budova", demand: 60, uncertainty: 0.18 },
    renovated: { label: "renovovaná nebo novější budova", demand: 90, uncertainty: 0.21 },
    standard: { label: "běžná starší budova", demand: 130, uncertainty: 0.25 },
    old: { label: "starší nezateplená budova", demand: 190, uncertainty: 0.3 },
  };

  const SOURCES = {
    gas: { label: "kondenzační plynový kotel", priceLabel: "Cena zemního plynu", priceUnit: "Kč/kWh", priceHelp: "Použijte cenu za odebranou kWh z nabídky nebo vyúčtování.", defaultPrice: 2.2, efficiency: 95, efficiencyLabel: "Sezónní účinnost zdroje", efficiencyUnit: "%", energyContent: 1, contentUnit: "kWh/kWh", contentHelp: "Plyn je již oceňován za kWh, proto zůstává převod jedna.", purchaseUnit: "kWh", defaultAux: 120, defaultService: 2500 },
    electric: { label: "elektrický kotel nebo přímotopy", priceLabel: "Cena elektřiny", priceUnit: "Kč/kWh", priceHelp: "Použijte celkovou cenu kWh odpovídající vašemu tarifu a spotřebě.", defaultPrice: 5.5, efficiency: 99, efficiencyLabel: "Sezónní účinnost zdroje", efficiencyUnit: "%", energyContent: 1, contentUnit: "kWh/kWh", contentHelp: "Elektřina se převádí přímo, proto zůstává převod jedna.", purchaseUnit: "kWh", defaultAux: 0, defaultService: 500 },
    heatpump: { label: "tepelné čerpadlo", priceLabel: "Cena elektřiny pro tepelné čerpadlo", priceUnit: "Kč/kWh", priceHelp: "Použijte celkovou cenu kWh v tarifu, ve kterém je čerpadlo skutečně provozováno.", defaultPrice: 5.5, efficiency: 320, efficiencyLabel: "Sezónní topný faktor SPF × 100", efficiencyUnit: "%", energyContent: 1, contentUnit: "kWh/kWh", contentHelp: "Hlavní převod zajišťuje SPF; energetický obsah elektřiny zůstává jedna.", purchaseUnit: "kWh", defaultAux: 100, defaultService: 2500 },
    wood: { label: "vytápění kusovým dřevem", priceLabel: "Cena suchého dřeva", priceUnit: "Kč/kg", priceHelp: "Použijte cenu za kilogram. Nepřevádějte bez kontroly prostorový metr přímo na kilogram.", defaultPrice: 6, efficiency: 75, efficiencyLabel: "Sezónní účinnost zdroje", efficiencyUnit: "%", energyContent: 4, contentUnit: "kWh/kg", contentHelp: "Orientační výhřevnost suchého dřeva. Vlhkost může skutečnou hodnotu výrazně snížit.", purchaseUnit: "kg", defaultAux: 80, defaultService: 3000 },
    pellets: { label: "automatický kotel na pelety", priceLabel: "Cena pelet", priceUnit: "Kč/kg", priceHelp: "Použijte cenu za kilogram včetně dopravy, pokud ji chcete v nákladu zohlednit.", defaultPrice: 8.5, efficiency: 85, efficiencyLabel: "Sezónní účinnost zdroje", efficiencyUnit: "%", energyContent: 4.8, contentUnit: "kWh/kg", contentHelp: "Modelová výhřevnost pelet; konkrétní výrobek může mít jinou deklarovanou hodnotu.", purchaseUnit: "kg", defaultAux: 180, defaultService: 3000 },
    district: { label: "dálkové teplo", priceLabel: "Cena dálkového tepla", priceUnit: "Kč/GJ", priceHelp: "Použijte cenu jedné GJ podle ceníku nebo vyúčtování objektu.", defaultPrice: 950, efficiency: 98, efficiencyLabel: "Účinnost předání do budovy", efficiencyUnit: "%", energyContent: 277.7778, contentUnit: "kWh/GJ", contentHelp: "Jedna GJ odpovídá přibližně 277,78 kWh energie.", purchaseUnit: "GJ", defaultAux: 60, defaultService: 0 },
  };

  const numericInputs = ["heatedArea", "energyPrice", "heatingMonths", "basicFixedCosts", "annualBudget", "customHeatDemand", "heatedShare", "temperatureCorrection", "sourceEfficiency", "energyContent", "auxiliaryElectricity", "auxiliaryPrice", "fixedAnnualCosts", "serviceAnnualCosts", "priceAdjustment", "advancedBudget"];
  const selectInputs = ["buildingState", "heatSource", "climateFactor"];
  const allInputs = [...numericInputs, ...selectInputs];
  const URL_MAP = { heatedArea: "plocha", buildingState: "stav", heatSource: "zdroj", energyPrice: "cena", heatingMonths: "mesice", basicFixedCosts: "dalsi", annualBudget: "rozpocet", customHeatDemand: "potreba", heatedShare: "podil", climateFactor: "klima", temperatureCorrection: "rezim", sourceEfficiency: "ucinnost", energyContent: "vyhrevnost", auxiliaryElectricity: "pomocna", auxiliaryPrice: "pomocnaCena", fixedAnnualCosts: "stale", serviceAnnualCosts: "servis", priceAdjustment: "uprava", advancedBudget: "proRozpocet" };

  let currentMode = "basic";
  let currentAdvancedStep = 0;
  let lastResult = null;
  let sourceSyncLock = false;

  function setText(id, value) { const el = $(id); if (el) el.textContent = value; }
  function parseLocalized(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const normalized = String(value ?? "").replace(/[\s\u00a0]/g, "").replace(/,/g, ".").replace(/[^0-9.+-]/g, "");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function limits(input) { return { min: input.dataset.min === undefined ? -Infinity : parseLocalized(input.dataset.min), max: input.dataset.max === undefined ? Infinity : parseLocalized(input.dataset.max) }; }
  function readNumeric(id) { const input = $(id); if (!input) return 0; const { min, max } = limits(input); return clamp(parseLocalized(input.value), min, max); }
  function formatInput(id) { const input = $(id); if (!input) return; const decimals = ["energyPrice", "customHeatDemand", "temperatureCorrection", "sourceEfficiency", "energyContent", "auxiliaryPrice", "priceAdjustment", "heatedShare"].includes(id) ? 2 : 0; input.value = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: decimals }).format(readNumeric(id)); }
  function selectValue(id, fallback) { const el = $(id); return el ? el.value : fallback; }
  function sourceData() { return SOURCES[selectValue("heatSource", "gas")] || SOURCES.gas; }

  function updateSourceInterface(options = {}) {
    const source = sourceData();
    setText("energyPriceLabel", source.priceLabel);
    setText("energyPriceUnit", source.priceUnit);
    setText("energyPriceHelp", source.priceHelp);
    setText("efficiencyLabel", source.efficiencyLabel);
    setText("efficiencyUnit", source.efficiencyUnit);
    setText("efficiencyHelp", source.heatpump ? "Použijte roční sezónní faktor, nikoli laboratorní COP." : source.efficiencyLabel.includes("SPF") ? "Použijte reálný sezónní faktor, například 320 pro SPF 3,2." : "Zadejte sezónní účinnost, nikoli pouze laboratorní maximum výrobce.");
    setText("energyContentUnit", source.contentUnit);
    setText("energyContentHelp", source.contentHelp);
    if (options.resetValues !== false) {
      sourceSyncLock = true;
      $("energyPrice").value = String(source.defaultPrice).replace(".", ",");
      $("sourceEfficiency").value = String(source.efficiency).replace(".", ",");
      $("energyContent").value = String(source.energyContent).replace(".", ",");
      $("auxiliaryElectricity").value = String(source.defaultAux);
      $("serviceAnnualCosts").value = String(source.defaultService);
      $("basicFixedCosts").value = String(source.defaultService);
      numericInputs.forEach((id) => { if (["energyPrice", "sourceEfficiency", "energyContent", "auxiliaryElectricity", "serviceAnnualCosts", "basicFixedCosts"].includes(id)) formatInput(id); });
      sourceSyncLock = false;
    }
    updateAssumptionText();
  }

  function collectCore() { return { heatedArea: readNumeric("heatedArea"), buildingState: selectValue("buildingState", "renovated"), heatSource: selectValue("heatSource", "gas"), energyPrice: readNumeric("energyPrice"), heatingMonths: readNumeric("heatingMonths") || 8 }; }
  function collectBasic() {
    const core = collectCore();
    const source = SOURCES[core.heatSource] || SOURCES.gas;
    return { ...core, heatDemand: BUILDINGS[core.buildingState].demand, heatedShare: 100, climateFactor: 1, temperatureCorrection: 0, efficiency: source.efficiency, energyContent: source.energyContent, auxiliaryElectricity: source.defaultAux, auxiliaryPrice: core.heatSource === "heatpump" ? core.energyPrice : 5.5, fixedAnnualCosts: 0, serviceAnnualCosts: readNumeric("basicFixedCosts"), priceAdjustment: 0, annualBudget: readNumeric("annualBudget") };
  }
  function collectAdvanced() {
    const core = collectCore();
    const modelDemand = BUILDINGS[core.buildingState].demand;
    return { ...core, heatDemand: readNumeric("customHeatDemand") > 0 ? readNumeric("customHeatDemand") : modelDemand, heatedShare: readNumeric("heatedShare"), climateFactor: parseLocalized(selectValue("climateFactor", "1")) || 1, temperatureCorrection: readNumeric("temperatureCorrection"), efficiency: readNumeric("sourceEfficiency"), energyContent: readNumeric("energyContent"), auxiliaryElectricity: readNumeric("auxiliaryElectricity"), auxiliaryPrice: readNumeric("auxiliaryPrice"), fixedAnnualCosts: readNumeric("fixedAnnualCosts"), serviceAnnualCosts: readNumeric("serviceAnnualCosts"), priceAdjustment: readNumeric("priceAdjustment"), annualBudget: readNumeric("advancedBudget") };
  }
  function validate(values) {
    const errors = [];
    if (values.heatedArea < 15) errors.push("Vytápěná plocha musí být alespoň 15 m².");
    if (values.heatedArea > 1000) errors.push("Pro tuto kalkulačku zadejte plochu nejvýše 1 000 m².");
    if (values.energyPrice <= 0) errors.push("Cena energie musí být vyšší než nula.");
    if (values.efficiency <= 0) errors.push("Účinnost nebo SPF musí být vyšší než nula.");
    if (values.energyContent <= 0) errors.push("Energetický obsah jednotky musí být vyšší než nula.");
    return errors;
  }

  function calculate(values, mode, priceMultiplier = 1) {
    const source = SOURCES[values.heatSource] || SOURCES.gas;
    const heatedAreaEffective = values.heatedArea * clamp(values.heatedShare, 20, 100) / 100;
    const regimeFactor = 1 + clamp(values.temperatureCorrection, -25, 40) / 100;
    const usefulHeat = Math.max(0, heatedAreaEffective * values.heatDemand * values.climateFactor * regimeFactor);
    const efficiencyFactor = values.efficiency / 100;
    const purchasedUnits = usefulHeat / Math.max(efficiencyFactor, 0.01) / Math.max(values.energyContent, 0.01);
    const adjustedPrice = values.energyPrice * (1 + clamp(values.priceAdjustment, -50, 100) / 100) * priceMultiplier;
    const energyCost = purchasedUnits * adjustedPrice;
    const auxiliaryCost = values.auxiliaryElectricity * values.auxiliaryPrice;
    const totalCost = Math.max(0, energyCost + auxiliaryCost + values.fixedAnnualCosts + values.serviceAnnualCosts);
    const variableBase = energyCost + auxiliaryCost;
    const modelUncertainty = mode === "advanced" && readNumeric("customHeatDemand") > 0 ? 0.12 : BUILDINGS[values.buildingState].uncertainty;
    const sourceUncertainty = values.heatSource === "heatpump" || values.heatSource === "wood" ? 0.05 : 0.025;
    const uncertainty = clamp(modelUncertainty + sourceUncertainty, 0.1, 0.38);
    const rangeLow = totalCost * (1 - uncertainty * 0.55);
    const rangeHigh = totalCost * (1 + uncertainty);
    const seasonMonthly = totalCost / Math.max(values.heatingMonths, 1);
    const costPerM2 = totalCost / Math.max(values.heatedArea, 1);
    const budgetDifference = values.annualBudget > 0 ? values.annualBudget - totalCost : null;
    return { mode, values, source, heatedAreaEffective, usefulHeat, efficiencyFactor, purchasedUnits, adjustedPrice, energyCost, auxiliaryCost, variableBase, totalCost, uncertainty, rangeLow, rangeHigh, seasonMonthly, costPerM2, budgetDifference };
  }

  function energyDisplay(result) {
    const unit = result.source.purchaseUnit;
    if (unit === "kWh") return result.purchasedUnits >= 1000 ? `${number(result.purchasedUnits / 1000)} MWh` : `${number(result.purchasedUnits)} kWh`;
    if (unit === "kg") return result.purchasedUnits >= 1000 ? `${number(result.purchasedUnits / 1000)} t` : `${number(result.purchasedUnits)} kg`;
    return `${number(result.purchasedUnits)} GJ`;
  }
  function usefulDisplay(value) { return value >= 1000 ? `${number(value / 1000)} MWh` : `${number(value)} kWh`; }

  function interpretation(result) {
    const q = result.values.heatDemand * result.values.climateFactor * (1 + result.values.temperatureCorrection / 100);
    if (q >= 170) return { badge: "Vysoká energetická náročnost", kicker: "Největší páka", headline: "Nejdříve prověřte budovu, teprve potom zdroj", text: `Model počítá s potřebou přibližně ${number(q)} kWh/m² za rok. U takto náročného objektu může zateplení, utěsnění a regulace ovlivnit účet více než malý rozdíl mezi dvěma ceníky stejného paliva.` };
    if (result.values.heatSource === "heatpump" && result.values.efficiency < 280) return { badge: "Nízký sezónní faktor", kicker: "Provozní riziko", headline: "Ověřte teplotu topné vody a elektrický dohřev", text: `Zadaný faktor odpovídá SPF ${number(result.values.efficiency / 100)}. Výsledek je citlivý na provozní podmínky, odmrazování a zapojení doplňkového zdroje.` };
    if (result.energyCost / Math.max(result.totalCost, 1) < 0.65) return { badge: "Významné pevné náklady", kicker: "Jak výsledek číst", headline: "Samotná cena energie nevysvětluje celý účet", text: `Variabilní energie tvoří méně než dvě třetiny ročního výsledku. Při porovnávání nabídek proto sledujte také stálé platby, servis a pomocnou elektřinu.` };
    return { badge: "Realistický první rámec", kicker: "Další krok", headline: "Porovnejte model se spotřebou a vyúčtováním", text: `Aktuální odhad je ${money(result.totalCost)} za rok, tedy ${money(result.costPerM2)} na vytápěný m². Největší přesnost získáte nahrazením modelové potřeby tepla a ceny vlastními údaji.` };
  }

  function renderBreakdown(result) {
    const container = $("breakdownList");
    if (!container) return;
    const rows = [
      { name: "Nakoupená energie nebo palivo", value: result.energyCost, note: `${energyDisplay(result)} × ${number(result.adjustedPrice)} ${result.source.priceUnit}`, classes: [] },
      { name: "Pomocná elektřina", value: result.auxiliaryCost, note: `${number(result.values.auxiliaryElectricity)} kWh × ${number(result.values.auxiliaryPrice)} Kč/kWh`, classes: [] },
      { name: "Stálé roční náklady", value: result.values.fixedAnnualCosts, note: "zadaná pevná částka připsaná vytápění", classes: [] },
      { name: "Servis a údržba", value: result.values.serviceAnnualCosts, note: "pravidelná údržba a kontroly v modelovém roce", classes: [] },
      { name: "Celkový roční náklad", value: result.totalCost, note: "součet všech zobrazených položek", classes: ["is-total"] },
    ];
    container.replaceChildren(...rows.map((item) => {
      const row = doc.createElement("div"); row.className = ["heat-breakdown-row", ...(item.classes || [])].join(" ");
      const copy = doc.createElement("div"); const strong = doc.createElement("strong"); const small = doc.createElement("small"); const amount = doc.createElement("b");
      strong.textContent = item.name; small.textContent = item.note; amount.textContent = money(item.value); copy.append(strong, small); row.append(copy, amount); return row;
    }));
  }

  function renderBudget(result) {
    const box = $("budgetCheck"); if (!box) return; box.classList.remove("is-positive", "is-negative");
    if (result.budgetDifference === null) { setText("budgetDifference", "Rozpočet nebyl zadán"); setText("budgetMessage", "Doplňte nepovinný limit a uvidíte finanční rezervu nebo chybějící částku."); return; }
    if (result.budgetDifference >= 0) { box.classList.add("is-positive"); setText("budgetDifference", `Zbývá ${money(result.budgetDifference)}`); setText("budgetMessage", "Roční limit pokrývá modelový náklad vytápění. Rezervu nevyužívejte automaticky jako důvod ke zvýšení teploty nebo ignorování servisu."); }
    else { box.classList.add("is-negative"); setText("budgetDifference", `Chybí ${money(Math.abs(result.budgetDifference))}`); setText("budgetMessage", "Prověřte cenu energie, nastavení zdroje, skutečnou potřebu tepla a možnosti snížení tepelných ztrát budovy."); }
  }

  function updateHero(result) {
    setText("heroTotal", compactMoney(result.totalCost));
    setText("heroSummary", `${BUILDINGS[result.values.buildingState].label}, ${number(result.values.heatedArea)} m² a ${result.source.label}.`);
    setText("heroHeat", usefulDisplay(result.usefulHeat));
    setText("heroEnergy", energyDisplay(result));
    setText("heroPerM2", money(result.costPerM2));
  }
  function updateAssumptionText() {
    const building = BUILDINGS[selectValue("buildingState", "renovated")];
    const source = sourceData();
    const efficiencyText = selectValue("heatSource", "gas") === "heatpump" ? `SPF ${number(source.efficiency / 100)}` : `účinnost ${number(source.efficiency)} %`;
    setText("basicAssumptionText", `Používá potřebu tepla ${number(building.demand)} kWh/m² za rok, ${efficiencyText}, modelový energetický obsah jednotky a zadané další roční náklady. Skryté hodnoty podrobného režimu rychlý výsledek neovlivňují.`);
  }

  function renderContentExamples() {
    const make = (values, mode) => calculate(values, mode);
    const a = make({ heatedArea:120, buildingState:"renovated", heatSource:"gas", energyPrice:2.2, heatingMonths:8, heatDemand:90, heatedShare:100, climateFactor:1, temperatureCorrection:0, efficiency:95, energyContent:1, auxiliaryElectricity:120, auxiliaryPrice:5.5, fixedAnnualCosts:0, serviceAnnualCosts:2500, priceAdjustment:0, annualBudget:0 }, "basic");
    const b = make({ heatedArea:120, buildingState:"renovated", heatSource:"heatpump", energyPrice:5.5, heatingMonths:8, heatDemand:90, heatedShare:100, climateFactor:1, temperatureCorrection:0, efficiency:320, energyContent:1, auxiliaryElectricity:100, auxiliaryPrice:5.5, fixedAnnualCosts:0, serviceAnnualCosts:2500, priceAdjustment:0, annualBudget:0 }, "advanced");
    const c = make({ heatedArea:150, buildingState:"old", heatSource:"wood", energyPrice:6, heatingMonths:8, heatDemand:190, heatedShare:100, climateFactor:1, temperatureCorrection:0, efficiency:75, energyContent:4, auxiliaryElectricity:80, auxiliaryPrice:5.5, fixedAnnualCosts:0, serviceAnnualCosts:3000, priceAdjustment:0, annualBudget:0 }, "advanced");
    setText("exampleAResult", `${money(a.totalCost)} za rok a spotřeba ${energyDisplay(a)}`);
    setText("exampleBResult", `${money(b.totalCost)} za rok a spotřeba ${energyDisplay(b)}`);
    setText("exampleCResult", `${money(c.totalCost)} za rok a spotřeba ${energyDisplay(c)}`);
  }

  function render() {
    if (sourceSyncLock) return null;
    const values = currentMode === "advanced" ? collectAdvanced() : collectBasic();
    const errors = validate(values); setText("formStatus", errors.join(" ")); if (errors.length) return null;
    const result = calculate(values, currentMode); const low = calculate(values, currentMode, .85); const high = calculate(values, currentMode, 1.2); const decision = interpretation(result); lastResult = result;
    setText("resultModeLabel", currentMode === "advanced" ? "Podrobný model" : "Rychlý odhad");
    setText("totalCost", `${money(result.totalCost)}/rok`);
    setText("resultRange", `Pracovní interval: ${money(result.rangeLow)} až ${money(result.rangeHigh)} za rok`);
    setText("resultSummary", `Budova potřebuje přibližně ${usefulDisplay(result.usefulHeat)} užitečného tepla. Zdroj k tomu nakoupí ${energyDisplay(result)} a přidá ${money(result.auxiliaryCost + result.values.fixedAnnualCosts + result.values.serviceAnnualCosts)} dalších ročních nákladů.`);
    setText("usefulHeat", usefulDisplay(result.usefulHeat));
    setText("demandLabel", `${number(result.values.heatDemand * result.values.climateFactor * (1 + result.values.temperatureCorrection / 100))} kWh/m²·rok`);
    setText("purchasedEnergy", energyDisplay(result)); setText("sourceLabel", result.source.label);
    setText("seasonMonthly", money(result.seasonMonthly)); setText("monthsLabel", `${number(result.values.heatingMonths)} měsíců`);
    setText("costPerM2", money(result.costPerM2)); setText("budgetBadge", decision.badge); setText("decisionKicker", decision.kicker); setText("decisionHeadline", decision.headline); setText("decisionText", decision.text);
    setText("scenarioLow", money(low.totalCost)); setText("scenarioCurrent", money(result.totalCost)); setText("scenarioHigh", money(high.totalCost));
    renderBudget(result); renderBreakdown(result); updateHero(result); updateAssumptionText(); return result;
  }

  function setMode(mode, options = {}) {
    currentMode = mode === "advanced" ? "advanced" : "basic"; root.dataset.calculatorMode = currentMode;
    doc.querySelectorAll(".heat-mode-btn").forEach((button) => { const active = button.dataset.mode === currentMode; button.classList.toggle("is-active", active); button.setAttribute("aria-pressed", String(active)); });
    const advanced = $("advancedCalculation"); if (advanced) advanced.hidden = currentMode !== "advanced";
    setText("formTitle", currentMode === "advanced" ? "Zpřesněte náklady vytápění" : "Začněte rychlým odhadem");
    setText("formLead", currentMode === "advanced" ? "Základní údaje zůstávají nahoře. Pod nimi přidáte pouze potřebu budovy, účinnost, servis a vlastní nákladové podklady." : "Čtyři údaje stačí pro první srozumitelný výsledek. Podrobný režim přidá klima, účinnost, servis a vlastní technická data.");
    if (options.render !== false) render();
  }
  function setAdvancedStep(index) {
    const stages = [...doc.querySelectorAll("[data-advanced-stage]")]; const buttons = [...doc.querySelectorAll("[data-advanced-step]")]; if (!stages.length) return;
    currentAdvancedStep = clamp(Number(index) || 0, 0, stages.length - 1);
    stages.forEach((stage, i) => { const active = i === currentAdvancedStep; stage.hidden = !active; stage.classList.toggle("is-active", active); });
    buttons.forEach((button, i) => { const active = i === currentAdvancedStep; button.classList.toggle("is-active", active); if (active) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current"); });
    const prev = $("advancedPrev"); const next = $("advancedNext"); if (prev) prev.disabled = currentAdvancedStep === 0; if (next) { const last = currentAdvancedStep === stages.length - 1; next.disabled = last; next.textContent = last ? "Všechny kroky hotové" : "Další krok →"; } setText("advancedStepStatus", `Krok ${currentAdvancedStep + 1} ze ${stages.length}`);
  }

  function shareUrl() { const url = new URL(window.location.href); url.search = ""; Object.entries(URL_MAP).forEach(([id,key]) => { const el = $(id); if (!el) return; const value = el.tagName === "SELECT" ? el.value : readNumeric(id); url.searchParams.set(key,String(value)); }); url.searchParams.set("rezim",currentMode); return url.toString(); }
  function loadUrl() {
    const params = new URLSearchParams(window.location.search); let sourceChanged = false;
    Object.entries(URL_MAP).forEach(([id,key]) => { if (!params.has(key)) return; const el = $(id); if (!el) return; const raw = params.get(key); if (el.tagName === "SELECT") { const valid=[...el.options].some(o=>o.value===raw); if(valid){ el.value=raw; if(id==="heatSource") sourceChanged=true; } } else { el.value=raw??""; } });
    updateSourceInterface({ resetValues: !sourceChanged || !params.has("cena") });
    Object.entries(URL_MAP).forEach(([id,key]) => { if (!params.has(key)) return; const el=$(id); if(el && el.tagName!=="SELECT"){ el.value=params.get(key)??""; formatInput(id); } });
    setMode(params.get("rezim") === "advanced" ? "advanced" : "basic", { render:false }); if(currentMode === "advanced") setAdvancedStep(0);
  }
  async function copyText(value, successMessage) { try { if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value); else { const area=doc.createElement("textarea"); area.value=value; area.setAttribute("readonly",""); area.style.position="fixed"; area.style.opacity="0"; doc.body.appendChild(area); area.select(); const copied=doc.execCommand("copy"); area.remove(); if(!copied) throw new Error("copy failed"); } setText("copyStatus",successMessage); } catch { setText("copyStatus","Kopírování se nepodařilo. Odkaz můžete zkopírovat z adresního řádku."); } }
  function resultText() { if(!lastResult) return ""; const r=lastResult; return ["Náklady na vytápění – RychléVýpočty.cz",`Režim: ${r.mode === "advanced" ? "podrobný" : "rychlý"}`,`Budova: ${BUILDINGS[r.values.buildingState].label}, ${number(r.values.heatedArea)} m²`,`Zdroj: ${r.source.label}`,`Potřeba tepla: ${usefulDisplay(r.usefulHeat)}`,`Nakoupená energie nebo palivo: ${energyDisplay(r)}`,`Roční náklad: ${money(r.totalCost)}`,`Průměr za topný měsíc: ${money(r.seasonMonthly)}`,`Cena na m²: ${money(r.costPerM2)}`,`Pracovní interval: ${money(r.rangeLow)} až ${money(r.rangeHigh)}`,"Výsledek je orientační a nezahrnuje pořizovací investici ani ohřev vody."].join("\n"); }
  function resetAll() { form.reset(); updateSourceInterface(); numericInputs.forEach(formatInput); setText("copyStatus",""); setText("formStatus",""); setAdvancedStep(0); setMode("basic",{render:false}); const wrap=$("breakdownWrap"); const button=$("toggleBreakdown"); if(wrap && button){wrap.classList.add("is-collapsed");button.setAttribute("aria-expanded","false");button.textContent="Zobrazit rozpad";} render(); }

  form.addEventListener("submit", (event) => { event.preventDefault(); render(); });
  allInputs.forEach((id) => { const el=$(id); if(!el) return; el.addEventListener("input",render); el.addEventListener("change",render); if(el.tagName!=="SELECT") el.addEventListener("blur",()=>{formatInput(id);render();}); });
  $("heatSource")?.addEventListener("change", () => { updateSourceInterface(); render(); });
  doc.querySelectorAll(".heat-mode-btn").forEach((button)=>button.addEventListener("click",()=>setMode(button.dataset.mode)));
  doc.querySelectorAll(".heat-step-btn").forEach((button)=>button.addEventListener("click",()=>setAdvancedStep(Number(button.dataset.advancedStep))));
  $("advancedPrev")?.addEventListener("click",()=>setAdvancedStep(currentAdvancedStep-1)); $("advancedNext")?.addEventListener("click",()=>setAdvancedStep(currentAdvancedStep+1));
  $("resetBtn")?.addEventListener("click",resetAll); $("copyResultBtn")?.addEventListener("click",()=>copyText(resultText(),"Výsledek byl zkopírován.")); $("copyLinkBtn")?.addEventListener("click",()=>copyText(shareUrl(),"Odkaz s nastavením byl zkopírován."));
  $("toggleBreakdown")?.addEventListener("click",(event)=>{const wrap=$("breakdownWrap");if(!wrap)return;const collapsed=wrap.classList.toggle("is-collapsed");event.currentTarget.setAttribute("aria-expanded",String(!collapsed));event.currentTarget.textContent=collapsed?"Zobrazit rozpad":"Skrýt rozpad";});

  updateSourceInterface({ resetValues:false }); loadUrl(); numericInputs.forEach(formatInput); setAdvancedStep(0); renderContentExamples(); render();
})();
