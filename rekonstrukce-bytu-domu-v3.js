(() => {
  "use strict";
  const doc = document;
  const root = doc.body;
  const $ = (id) => doc.getElementById(id);
  const form = $("renovationForm");
  if (!form) return;

  const numberFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const moneyFormatter = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const number = (value) => numberFormatter.format(Number.isFinite(value) ? value : 0);
  const money = (value) => moneyFormatter.format(Number.isFinite(value) ? value : 0);
  const compactMoney = (value) => {
    if (!Number.isFinite(value)) return "0 Kč";
    if (value >= 1000000) return `${number(value / 1000000)} mil. Kč`;
    if (value >= 1000) return `${number(value / 1000)} tis. Kč`;
    return money(value);
  };

  const LABELS = {
    propertyType: { apartment: "byt", house: "rodinný dům" },
    scope: { light: "lehčí úpravy", medium: "střední rekonstrukce", full: "kompletní rekonstrukce" },
    quality: { basic: "úsporný standard", standard: "běžný kvalitní standard", higher: "vyšší standard" },
  };

  const BASE_RATE = { light: 6500, medium: 12000, full: 18500 };
  const PROPERTY_FACTOR = { apartment: 1, house: 1.08 };
  const QUALITY_FACTOR = { basic: 0.9, standard: 1, higher: 1.18 };
  const BATHROOM_COST = { basic: 165000, standard: 210000, higher: 315000 };
  const KITCHEN_COST = { none: 0, basic: 190000, standard: 285000, higher: 475000 };
  const ELECTRO_RATE = { none: 0, partial: 900, full: 1850 };
  const PLUMBING_RATE = { none: 0, partial: 550, full: 1200 };
  const SURFACE_RATE = { basic: 750, standard: 1350, higher: 2450 };
  const WINDOWS_RATE = {
    apartment: { none: 0, partial: 700, full: 1450 },
    house: { none: 0, partial: 1000, full: 2050 },
  };
  const DOOR_COST = { none: 0, partial: 45000, full: 105000, higher: 180000 };
  const HEATING_COST = { none: 0, partial: 80000, full: 210000, heatpump: 390000 };
  const EXTERIOR_COST = { none: 0, facade: 330000, roof: 520000, insulation: 470000, major: 1050000 };
  const DEMOLITION_FACTOR = { low: 0.92, standard: 1, high: 1.1, veryHigh: 1.2 };
  const CONDITION_FACTOR = { good: 0.96, standard: 1, poor: 1.12, unknown: 1.18 };

  const numericInputs = [
    "area", "availableBudget", "bathrooms", "customBaseRate", "customTechnical", "customEquipment",
    "priceAdjustment", "advancedBudget",
  ];
  const selectInputs = [
    "propertyType", "scope", "quality", "kitchen", "basicReserve", "demolition", "buildingCondition",
    "electro", "plumbing", "surfaces", "windows", "doors", "heating", "exterior", "regionFactor", "reserveRate",
  ];
  const allInputs = [...numericInputs, ...selectInputs];
  const URL_MAP = {
    propertyType: "typ", area: "plocha", scope: "rozsah", quality: "standard", bathrooms: "koupelny",
    kitchen: "kuchyn", basicReserve: "rezerva", availableBudget: "rozpocet", demolition: "bourani",
    buildingCondition: "stav", electro: "elektro", plumbing: "voda", surfaces: "povrchy", windows: "okna",
    doors: "dvere", heating: "topeni", exterior: "exterier", regionFactor: "region", customBaseRate: "vlastniM2",
    customTechnical: "technikaCena", customEquipment: "vybaveniCena", priceAdjustment: "uprava",
    reserveRate: "proRezerva", advancedBudget: "proRozpocet",
  };

  let currentMode = "basic";
  let currentAdvancedStep = 0;
  let lastResult = null;

  function setText(id, value) { const el = $(id); if (el) el.textContent = value; }
  function parseLocalized(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const normalized = String(value ?? "").replace(/[\s\u00a0]/g, "").replace(/,/g, ".").replace(/[^0-9.+-]/g, "");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  function limits(input) {
    return {
      min: input.dataset.min === undefined ? -Infinity : parseLocalized(input.dataset.min),
      max: input.dataset.max === undefined ? Infinity : parseLocalized(input.dataset.max),
    };
  }
  function readNumeric(id) {
    const input = $(id);
    if (!input) return 0;
    const { min, max } = limits(input);
    return clamp(parseLocalized(input.value), min, max);
  }
  function formatInput(id) {
    const input = $(id);
    if (!input) return;
    const value = readNumeric(id);
    const decimals = ["area", "priceAdjustment"].includes(id) ? 1 : 0;
    input.value = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: decimals }).format(value);
  }
  function selectValue(id, fallback) { const el = $(id); return el ? el.value : fallback; }
  function collectCore() {
    return {
      propertyType: selectValue("propertyType", "apartment"),
      area: readNumeric("area"),
      scope: selectValue("scope", "medium"),
      quality: selectValue("quality", "standard"),
    };
  }
  function basicDefaults(scope) {
    if (scope === "light") return { demolition: "low", condition: "good", electro: "none", plumbing: "none", surfaces: "basic", windows: "none", doors: "partial", heating: "none" };
    if (scope === "full") return { demolition: "high", condition: "poor", electro: "full", plumbing: "full", surfaces: "higher", windows: "partial", doors: "full", heating: "partial" };
    return { demolition: "standard", condition: "standard", electro: "partial", plumbing: "partial", surfaces: "standard", windows: "none", doors: "partial", heating: "none" };
  }
  function collectBasic() {
    const core = collectCore();
    const defaults = basicDefaults(core.scope);
    return {
      ...core,
      bathrooms: readNumeric("bathrooms"),
      kitchen: selectValue("kitchen", "standard"),
      reserveRate: Number(selectValue("basicReserve", "10")) || 10,
      availableBudget: readNumeric("availableBudget"),
      demolition: defaults.demolition,
      buildingCondition: defaults.condition,
      electro: defaults.electro,
      plumbing: defaults.plumbing,
      surfaces: defaults.surfaces,
      windows: defaults.windows,
      doors: defaults.doors,
      heating: defaults.heating,
      exterior: "none",
      regionFactor: 1,
      customBaseRate: 0,
      customTechnical: 0,
      customEquipment: 0,
      priceAdjustment: 0,
    };
  }
  function collectAdvanced() {
    const core = collectCore();
    return {
      ...core,
      bathrooms: readNumeric("bathrooms"),
      kitchen: selectValue("kitchen", "standard"),
      reserveRate: Number(selectValue("reserveRate", "12")) || 12,
      availableBudget: readNumeric("advancedBudget"),
      demolition: selectValue("demolition", "standard"),
      buildingCondition: selectValue("buildingCondition", "standard"),
      electro: selectValue("electro", "partial"),
      plumbing: selectValue("plumbing", "partial"),
      surfaces: selectValue("surfaces", "standard"),
      windows: selectValue("windows", "none"),
      doors: selectValue("doors", "partial"),
      heating: selectValue("heating", "none"),
      exterior: selectValue("exterior", "none"),
      regionFactor: parseLocalized(selectValue("regionFactor", "1")) || 1,
      customBaseRate: readNumeric("customBaseRate"),
      customTechnical: readNumeric("customTechnical"),
      customEquipment: readNumeric("customEquipment"),
      priceAdjustment: readNumeric("priceAdjustment"),
    };
  }
  function validate(values) {
    const errors = [];
    if (values.area < 20) errors.push("Plocha musí být alespoň 20 m².");
    if (values.area > 500) errors.push("Pro tuto kalkulačku zadejte plochu nejvýše 500 m².");
    if (values.bathrooms < 0 || values.bathrooms > 6) errors.push("Počet koupelen musí být mezi 0 a 6.");
    return errors;
  }
  function calculate(values, mode) {
    const baseRate = mode === "advanced" && values.customBaseRate > 0
      ? values.customBaseRate
      : (BASE_RATE[values.scope] || BASE_RATE.medium) * (PROPERTY_FACTOR[values.propertyType] || 1) * (QUALITY_FACTOR[values.quality] || 1);
    const demolitionFactor = DEMOLITION_FACTOR[values.demolition] || 1;
    const conditionFactor = CONDITION_FACTOR[values.buildingCondition] || 1;
    const generalCostRaw = values.area * baseRate * demolitionFactor * conditionFactor;

    const technicalModel = {
      electro: values.area * (ELECTRO_RATE[values.electro] || 0),
      plumbing: values.area * (PLUMBING_RATE[values.plumbing] || 0),
      surfaces: values.area * (SURFACE_RATE[values.surfaces] || 0),
      windows: values.area * ((WINDOWS_RATE[values.propertyType] || WINDOWS_RATE.apartment)[values.windows] || 0),
      doors: DOOR_COST[values.doors] || 0,
      heating: HEATING_COST[values.heating] || 0,
      exterior: values.propertyType === "house" ? (EXTERIOR_COST[values.exterior] || 0) : 0,
    };
    const technicalCostRaw = mode === "advanced" && values.customTechnical > 0
      ? values.customTechnical
      : Object.values(technicalModel).reduce((sum, item) => sum + item, 0);

    const quality = values.quality in BATHROOM_COST ? values.quality : "standard";
    const bathroomCostRaw = values.bathrooms * BATHROOM_COST[quality];
    const kitchenCostRaw = KITCHEN_COST[values.kitchen] || 0;
    const equipmentCostRaw = mode === "advanced" && values.customEquipment > 0
      ? values.customEquipment
      : bathroomCostRaw + kitchenCostRaw;

    const rawSubtotal = Math.max(0, generalCostRaw + technicalCostRaw + equipmentCostRaw);
    const adjustmentMultiplier = mode === "advanced" ? 1 + clamp(values.priceAdjustment, -30, 50) / 100 : 1;
    const applied = values.regionFactor * adjustmentMultiplier;
    const generalCost = generalCostRaw * applied;
    const technicalCost = technicalCostRaw * applied;
    const equipmentCost = equipmentCostRaw * applied;
    const subtotal = Math.max(0, rawSubtotal * applied);
    const reserveCost = subtotal * clamp(values.reserveRate, 0, 35) / 100;
    const totalCost = subtotal + reserveCost;

    let uncertainty = values.scope === "light" ? 0.08 : values.scope === "full" ? 0.19 : 0.13;
    if (values.propertyType === "house") uncertainty += 0.025;
    if (values.buildingCondition === "poor") uncertainty += 0.035;
    if (values.buildingCondition === "unknown") uncertainty += 0.055;
    if (values.exterior !== "none") uncertainty += 0.03;
    if (mode === "advanced" && values.customTechnical > 0) uncertainty -= 0.02;
    if (mode === "advanced" && values.customEquipment > 0) uncertainty -= 0.015;
    if (mode === "advanced" && values.customBaseRate > 0) uncertainty -= 0.015;
    if (values.reserveRate < 10) uncertainty += 0.02;
    uncertainty = clamp(uncertainty, 0.055, 0.26);

    const rangeLow = totalCost * (1 - Math.max(0.05, uncertainty * 0.48));
    const rangeHigh = totalCost * (1 + uncertainty);
    const scenarioLow = totalCost * (1 - Math.max(0.1, uncertainty * 0.68));
    const scenarioHigh = totalCost * (1 + Math.max(0.14, uncertainty));
    const budgetDifference = values.availableBudget > 0 ? values.availableBudget - totalCost : null;
    const pricePerM2 = totalCost / Math.max(values.area, 1);

    return {
      mode, values, baseRate, generalCostRaw, technicalModel, technicalCostRaw, bathroomCostRaw, kitchenCostRaw,
      equipmentCostRaw, rawSubtotal, adjustmentMultiplier, generalCost, technicalCost, equipmentCost, subtotal,
      reserveCost, totalCost, uncertainty, rangeLow, rangeHigh, scenarioLow, scenarioHigh, budgetDifference, pricePerM2,
    };
  }
  function interpretation(result) {
    const technicalShare = result.technicalCost / Math.max(result.totalCost, 1);
    if (result.values.buildingCondition === "unknown" || result.values.buildingCondition === "poor" || result.values.exterior !== "none") {
      return {
        badge: "Vyšší technická nejistota", kicker: "Hlavní riziko",
        headline: "Rozpočet může změnit stav konstrukcí a rozvodů",
        text: `Odhad je ${money(result.totalCost)}. Před objednávkou ověřte stav rozvodů, podkladů, vlhkosti a případných částí obálky domu. Rezervu nesnižujte jen proto, aby se výsledek vešel do limitu.`,
      };
    }
    if (result.equipmentCost / Math.max(result.totalCost, 1) > 0.35) {
      return {
        badge: "Výrazný podíl vybavení", kicker: "Kde hledat úsporu",
        headline: "Rozpočet táhne koupelna, kuchyň nebo standard zařízení",
        text: `Celkový rámec je ${money(result.totalCost)}. Pokud potřebujete cenu snížit, porovnávejte konkrétní vybavení a rozsah dodávky. Technické práce a bezpečnostní rezervu snižujte až po ověření skutečného stavu.`,
      };
    }
    if (technicalShare > 0.32) {
      return {
        badge: "Technicky náročnější projekt", kicker: "Co ověřit",
        headline: "Velkou část ceny tvoří rozvody a návazné práce",
        text: `Odhad je ${money(result.totalCost)}. Nechte si rozepsat elektroinstalaci, vodu, odpady, topení, okna a povrchy. Nabídky bez stejného rozsahu nelze férově porovnat.`,
      };
    }
    return {
      badge: "Realistický první rámec", kicker: "Další krok",
      headline: "Rozpočet je vhodný pro sjednocení poptávek",
      text: `Aktuální odhad je ${money(result.totalCost)}, tedy ${money(result.pricePerM2)} za m². Nyní rozdělte projekt na nutné práce, vybavení a volitelné zlepšení a poptávejte všechny firmy ve stejném rozsahu.`,
    };
  }
  function renderBreakdown(result) {
    const container = $("breakdownList");
    if (!container) return;
    const customTechnical = result.mode === "advanced" && result.values.customTechnical > 0;
    const customEquipment = result.mode === "advanced" && result.values.customEquipment > 0;
    const rows = [
      { name: "Obecné stavební práce", value: result.generalCost, note: `${money(result.baseRate)} / m² před regionální korekcí`, classes: [] },
      { name: "Elektroinstalace", value: customTechnical ? 0 : result.technicalModel.electro * result.values.regionFactor * result.adjustmentMultiplier, note: customTechnical ? "nahrazeno vlastním technickým součtem" : "zásuvky, okruhy, světla a rozvaděč", classes: customTechnical ? ["is-replaced"] : [] },
      { name: "Voda a odpady", value: customTechnical ? 0 : result.technicalModel.plumbing * result.values.regionFactor * result.adjustmentMultiplier, note: customTechnical ? "nahrazeno vlastním technickým součtem" : "rozvody vody, odpadů a návazné práce", classes: customTechnical ? ["is-replaced"] : [] },
      { name: "Povrchy, podlahy a dokončení", value: customTechnical ? 0 : result.technicalModel.surfaces * result.values.regionFactor * result.adjustmentMultiplier, note: customTechnical ? "nahrazeno vlastním technickým součtem" : "materiál a práce nad základním modelem", classes: customTechnical ? ["is-replaced"] : [] },
      { name: "Okna, dveře a vytápění", value: customTechnical ? 0 : (result.technicalModel.windows + result.technicalModel.doors + result.technicalModel.heating) * result.values.regionFactor * result.adjustmentMultiplier, note: customTechnical ? "nahrazeno vlastním technickým součtem" : "podle zvoleného rozsahu", classes: customTechnical ? ["is-replaced"] : [] },
      { name: result.values.propertyType === "house" ? "Fasáda, střecha nebo zateplení" : "Technické práce celkem", value: customTechnical ? result.technicalCost : result.technicalModel.exterior * result.values.regionFactor * result.adjustmentMultiplier, note: customTechnical ? "uživatel zadal vlastní technický součet" : result.values.propertyType === "house" ? "pouze pokud byla zvolena část obálky domu" : "byt nepočítá samostatnou obálku budovy", classes: customTechnical ? ["is-total"] : [] },
      { name: "Koupelny", value: customEquipment ? 0 : result.bathroomCostRaw * result.values.regionFactor * result.adjustmentMultiplier, note: customEquipment ? "nahrazeno vlastním součtem vybavení" : `${number(result.values.bathrooms)} × model podle standardu`, classes: customEquipment ? ["is-replaced"] : [] },
      { name: "Kuchyň", value: customEquipment ? result.equipmentCost : result.kitchenCostRaw * result.values.regionFactor * result.adjustmentMultiplier, note: customEquipment ? "uživatel zadal vlastní součet vybavení" : "linka, běžné spotřebiče a montáž", classes: customEquipment ? ["is-total"] : [] },
      { name: "Rozpočtová rezerva", value: result.reserveCost, note: `${number(result.values.reserveRate)} % z upraveného mezisoučtu`, classes: ["is-total"] },
    ];
    container.replaceChildren(...rows.map((item) => {
      const row = doc.createElement("div");
      row.className = ["reno-breakdown-row", ...(item.classes || [])].join(" ").trim();
      const copy = doc.createElement("div");
      const strong = doc.createElement("strong");
      const small = doc.createElement("small");
      const amount = doc.createElement("b");
      strong.textContent = item.name; small.textContent = item.note; amount.textContent = money(item.value);
      copy.append(strong, small); row.append(copy, amount); return row;
    }));
  }
  function renderBudget(result) {
    const box = $("budgetCheck");
    if (!box) return;
    box.classList.remove("is-positive", "is-warning", "is-negative");
    if (result.budgetDifference === null) {
      setText("budgetDifference", "Rozpočet nebyl zadán");
      setText("budgetMessage", "Doplňte nepovinný limit a uvidíte finanční polštář nebo chybějící částku.");
      return;
    }
    if (result.budgetDifference >= result.reserveCost) {
      box.classList.add("is-positive");
      setText("budgetDifference", `Zbývá ${money(result.budgetDifference)}`);
      setText("budgetMessage", "Limit pokrývá odhad včetně rezervy a ponechává ještě další finanční polštář.");
    } else if (result.budgetDifference >= 0) {
      box.classList.add("is-warning");
      setText("budgetDifference", `Zbývá jen ${money(result.budgetDifference)}`);
      setText("budgetMessage", "Limit pokrývá středový odhad, ale další prostor pro změny je malý.");
    } else {
      box.classList.add("is-negative");
      setText("budgetDifference", `Chybí ${money(Math.abs(result.budgetDifference))}`);
      setText("budgetMessage", "Rozdělte projekt na nutné práce a volitelné vybavení. Technické části a rezervu nekráťte bez ověření stavu.");
    }
  }
  function updateHero(result) {
    setText("heroTotal", compactMoney(result.totalCost));
    setText("heroSummary", `${LABELS.propertyType[result.values.propertyType]}, ${LABELS.scope[result.values.scope]} a ${LABELS.quality[result.values.quality]}.`);
    setText("heroArea", `${number(result.values.area)} m²`);
    setText("heroPerM2", compactMoney(result.pricePerM2));
    setText("heroReserve", compactMoney(result.reserveCost));
  }
  function renderExamples() {
    const scenario = (values, mode = "basic") => calculate(values, mode);
    const base = (overrides) => {
      const core = { propertyType: "apartment", area: 55, scope: "light", quality: "basic", bathrooms: 1, kitchen: "basic", reserveRate: 10, availableBudget: 0, ...basicDefaults("light"), exterior: "none", regionFactor: 1, customBaseRate: 0, customTechnical: 0, customEquipment: 0, priceAdjustment: 0, ...overrides };
      return core;
    };
    const a = scenario(base({ area: 55, scope: "light", quality: "basic", kitchen: "basic", ...basicDefaults("light") }));
    const b = scenario(base({ area: 75, scope: "medium", quality: "standard", kitchen: "standard", ...basicDefaults("medium") }));
    const c = scenario(base({ propertyType: "house", area: 145, scope: "full", quality: "higher", bathrooms: 2, kitchen: "higher", reserveRate: 15, demolition: "veryHigh", buildingCondition: "unknown", electro: "full", plumbing: "full", surfaces: "higher", windows: "full", doors: "higher", heating: "heatpump", exterior: "major" }), "advanced");
    const write = (id, result) => setText(id, `${money(result.totalCost)} · pracovní interval ${money(result.rangeLow)} až ${money(result.rangeHigh)}`);
    write("exampleAResult", a); write("exampleBResult", b); write("exampleCResult", c);
  }
  function render() {
    const values = currentMode === "advanced" ? collectAdvanced() : collectBasic();
    const errors = validate(values);
    setText("formStatus", errors.join(" "));
    if (errors.length) return null;
    const result = calculate(values, currentMode);
    const decision = interpretation(result);
    lastResult = result;
    setText("resultModeLabel", currentMode === "advanced" ? "Podrobný rozpočet" : "Rychlý odhad");
    setText("totalCost", money(result.totalCost));
    setText("resultRange", `Pracovní interval: ${money(result.rangeLow)} až ${money(result.rangeHigh)}`);
    setText("resultSummary", `Obecné stavební práce tvoří ${number(result.generalCost / Math.max(result.totalCost, 1) * 100)} %, technické části ${number(result.technicalCost / Math.max(result.totalCost, 1) * 100)} % a koupelny s kuchyní ${number(result.equipmentCost / Math.max(result.totalCost, 1) * 100)} % celkového rámce.`);
    setText("generalCost", money(result.generalCost));
    setText("technicalCost", money(result.technicalCost));
    setText("equipmentCost", money(result.equipmentCost));
    setText("reserveCost", money(result.reserveCost));
    setText("qualityLabel", LABELS.quality[values.quality]);
    setText("reserveLabel", `${number(values.reserveRate)} %`);
    setText("budgetBadge", decision.badge);
    setText("decisionKicker", decision.kicker);
    setText("decisionHeadline", decision.headline);
    setText("decisionText", decision.text);
    setText("scenarioLow", money(result.scenarioLow));
    setText("scenarioCurrent", money(result.totalCost));
    setText("scenarioHigh", money(result.scenarioHigh));
    renderBudget(result); renderBreakdown(result); updateHero(result);
    return result;
  }
  function setMode(mode, options = {}) {
    currentMode = mode === "advanced" ? "advanced" : "basic";
    root.dataset.calculatorMode = currentMode;
    doc.querySelectorAll(".reno-mode-btn").forEach((button) => {
      const active = button.dataset.mode === currentMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const advanced = $("advancedCalculation");
    if (advanced) advanced.hidden = currentMode !== "advanced";
    setText("formTitle", currentMode === "advanced" ? "Zpřesněte rozpočet celé rekonstrukce" : "Začněte rychlým odhadem");
    setText("formLead", currentMode === "advanced"
      ? "Základní čtyři údaje zůstávají nahoře. Pod nimi přidáte technický stav, vybavení a vlastní cenové podklady."
      : "Čtyři srozumitelné údaje stačí pro první realistický rámec. Koupelny, kuchyň a rezervu lze doplnit volitelně.");
    if (options.render !== false) render();
  }
  function setAdvancedStep(index) {
    const stages = [...doc.querySelectorAll("[data-advanced-stage]")];
    const buttons = [...doc.querySelectorAll("[data-advanced-step]")];
    if (!stages.length) return;
    currentAdvancedStep = clamp(Number(index) || 0, 0, stages.length - 1);
    stages.forEach((stage, i) => { const active = i === currentAdvancedStep; stage.hidden = !active; stage.classList.toggle("is-active", active); });
    buttons.forEach((button, i) => { const active = i === currentAdvancedStep; button.classList.toggle("is-active", active); if (active) button.setAttribute("aria-current", "step"); else button.removeAttribute("aria-current"); });
    const prev = $("advancedPrev"); const next = $("advancedNext");
    if (prev) prev.disabled = currentAdvancedStep === 0;
    if (next) { const last = currentAdvancedStep === stages.length - 1; next.disabled = last; next.textContent = last ? "Všechny kroky hotové" : "Další krok →"; }
    setText("advancedStepStatus", `Krok ${currentAdvancedStep + 1} ze ${stages.length}`);
  }
  function shareUrl() {
    const url = new URL(window.location.href); url.search = "";
    Object.entries(URL_MAP).forEach(([id, key]) => {
      const el = $(id); if (!el) return;
      const value = el.tagName === "SELECT" ? el.value : readNumeric(id);
      url.searchParams.set(key, String(value));
    });
    url.searchParams.set("rezim", currentMode); return url.toString();
  }
  function loadUrl() {
    const params = new URLSearchParams(window.location.search);
    Object.entries(URL_MAP).forEach(([id, key]) => {
      if (!params.has(key)) return;
      const el = $(id); if (!el) return;
      const raw = params.get(key);
      if (el.tagName === "SELECT") { const valid = [...el.options].some((option) => option.value === raw); if (valid) el.value = raw; }
      else { el.value = raw ?? ""; formatInput(id); }
    });
    setMode(params.get("rezim") === "advanced" ? "advanced" : "basic", { render: false });
    if (currentMode === "advanced") setAdvancedStep(0);
  }
  async function copyText(value, successMessage) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
        const area = doc.createElement("textarea"); area.value = value; area.setAttribute("readonly", ""); area.style.position = "fixed"; area.style.opacity = "0";
        doc.body.appendChild(area); area.select(); const copied = doc.execCommand("copy"); area.remove(); if (!copied) throw new Error("copy failed");
      }
      setText("copyStatus", successMessage);
    } catch { setText("copyStatus", "Kopírování se nepodařilo. Odkaz můžete zkopírovat z adresního řádku."); }
  }
  function resultText() {
    if (!lastResult) return "";
    const r = lastResult;
    return [
      "Náklady na rekonstrukci bytu nebo domu – RychléVýpočty.cz",
      `Režim: ${r.mode === "advanced" ? "podrobný" : "rychlý"}`,
      `Nemovitost: ${LABELS.propertyType[r.values.propertyType]}, ${number(r.values.area)} m²`,
      `Varianta: ${LABELS.scope[r.values.scope]}, ${LABELS.quality[r.values.quality]}`,
      `Obecné stavební práce: ${money(r.generalCost)}`,
      `Technické části: ${money(r.technicalCost)}`,
      `Koupelny a kuchyň: ${money(r.equipmentCost)}`,
      `Rezerva: ${money(r.reserveCost)} (${number(r.values.reserveRate)} %)`,
      `Celkový rámec: ${money(r.totalCost)}`,
      `Cena za m²: ${money(r.pricePerM2)}`,
      `Pracovní interval: ${money(r.rangeLow)} až ${money(r.rangeHigh)}`,
      "Výsledek je orientační a nenahrazuje zaměření, projekt, soupis prací ani závaznou nabídku.",
    ].join("\n");
  }
  function resetAll() {
    form.reset(); numericInputs.forEach(formatInput); setText("copyStatus", ""); setText("formStatus", ""); setAdvancedStep(0); setMode("basic", { render: false }); render();
  }

  form.addEventListener("submit", (event) => { event.preventDefault(); render(); });
  allInputs.forEach((id) => {
    const el = $(id); if (!el) return;
    el.addEventListener("input", render); el.addEventListener("change", render);
    if (el.tagName !== "SELECT") el.addEventListener("blur", () => { formatInput(id); render(); });
  });
  doc.querySelectorAll(".reno-mode-btn").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  doc.querySelectorAll(".reno-step-btn").forEach((button) => button.addEventListener("click", () => setAdvancedStep(Number(button.dataset.advancedStep))));
  $("advancedPrev")?.addEventListener("click", () => setAdvancedStep(currentAdvancedStep - 1));
  $("advancedNext")?.addEventListener("click", () => setAdvancedStep(currentAdvancedStep + 1));
  $("resetBtn")?.addEventListener("click", resetAll);
  $("copyResultBtn")?.addEventListener("click", () => copyText(resultText(), "Výsledek byl zkopírován."));
  $("copyLinkBtn")?.addEventListener("click", () => copyText(shareUrl(), "Odkaz s nastavením byl zkopírován."));
  $("toggleBreakdown")?.addEventListener("click", (event) => {
    const wrap = $("breakdownWrap"); if (!wrap) return;
    const collapsed = wrap.classList.toggle("is-collapsed");
    event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
    event.currentTarget.textContent = collapsed ? "Zobrazit rozpad" : "Skrýt rozpad";
  });

  loadUrl(); numericInputs.forEach(formatInput); setAdvancedStep(0); renderExamples(); render();
})();
