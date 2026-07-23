(() => {
  "use strict";

  const doc = document;
  const root = doc.body;
  const form = doc.getElementById("bathroomCalculator");
  if (!form) return;

  const $ = (id) => doc.getElementById(id);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const moneyFormat = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
  const numberFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const money = (value) => moneyFormat.format(Number.isFinite(value) ? value : 0);
  const number = (value) => numberFormat.format(Number.isFinite(value) ? value : 0);
  const compactMoney = (value) => {
    if (!Number.isFinite(value)) return "0 Kč";
    if (value >= 1000000) return `${number(value / 1000000)} mil. Kč`;
    if (value >= 1000) return `${number(value / 1000)} tis. Kč`;
    return money(value);
  };

  const LABELS = {
    scope: { refresh: "obnova bez velkých rozvodů", medium: "běžná kompletní koupelna", full: "kompletní přestavba" },
    quality: { basic: "úsporný standard", standard: "běžný kvalitní standard", higher: "vyšší standard" },
    sanitary: { shower: "sprchový kout", bath: "vana", both: "sprcha i vana" },
  };

  const CORE_RATE = { refresh: 15000, medium: 23500, full: 31500 };
  const QUALITY_CORE = { basic: 0.88, standard: 1, higher: 1.18 };
  const QUALITY_EQUIPMENT = { basic: 0.8, standard: 1, higher: 1.45 };
  const BASIC_TILE_RATE = { basic: 650, standard: 950, higher: 1650 };
  const SANITARY_COST = { shower: 42000, bath: 48000, both: 85000 };
  const FURNITURE_COST = { basic: 22000, standard: 38000, higher: 70000 };
  const ACCESSORY_COST = { basic: 16000, standard: 26000, higher: 48000 };
  const TOILET_COST = { none: 0, standard: 32000, higher: 52000 };
  const DEMOLITION_COST = { self: 3000, standard: 22000, complex: 48000 };
  const WATER_COST = { none: 0, partial: 28000, full: 62000 };
  const ELECTRO_COST = { none: 5000, partial: 16000, full: 35000 };
  const SUBSTRATE_COST = { good: 8000, standard: 22000, problem: 52000 };
  const LAYOUT_COST = { no: 0, minor: 28000, major: 75000 };
  const VENTILATION_COST = { existing: 0, fan: 9000, complex: 28000 };

  const numericInputs = [
    "area", "availableBudget", "customTechnical", "tilesRate", "sanitaryCustom", "customEquipment",
    "customCoreRate", "priceAdjustment", "advancedBudget",
  ];
  const selectInputs = [
    "scope", "sanitary", "quality", "bathroomType", "basicHeating", "basicReserve", "demolition", "water",
    "electro", "substrate", "layoutChanges", "ventilation", "toilet", "heating", "furniture", "accessories",
    "regionFactor", "reserveRate",
  ];
  const allInputs = [...numericInputs, ...selectInputs];

  const URL_MAP = {
    area: "plocha",
    scope: "rozsah",
    sanitary: "sanita",
    quality: "standard",
    bathroomType: "wc",
    basicHeating: "topeni",
    basicReserve: "rezerva",
    availableBudget: "rozpocet",
    demolition: "bourani",
    water: "voda",
    electro: "elektro",
    substrate: "podklad",
    layoutChanges: "dispozice",
    ventilation: "vetrani",
    customTechnical: "technikaCena",
    tilesRate: "obkladCena",
    sanitaryCustom: "sanitaCena",
    toilet: "proWc",
    heating: "proTopeni",
    furniture: "nabytek",
    accessories: "doplnky",
    customEquipment: "vybaveniCena",
    customCoreRate: "praceM2",
    regionFactor: "region",
    priceAdjustment: "uprava",
    reserveRate: "proRezerva",
    advancedBudget: "proRozpocet",
  };

  let currentMode = "basic";
  let currentAdvancedStep = 0;
  let lastResult = null;

  function setText(id, value) {
    const el = $(id);
    if (el) el.textContent = value;
  }

  function parseLocalized(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const normalized = String(value ?? "")
      .replace(/[\s\u00a0]/g, "")
      .replace(/,/g, ".")
      .replace(/[^0-9.+-]/g, "");
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

  function selectValue(id, fallback) {
    const el = $(id);
    return el ? el.value : fallback;
  }

  function collectCore() {
    return {
      area: readNumeric("area"),
      scope: selectValue("scope", "medium"),
      sanitary: selectValue("sanitary", "shower"),
      quality: selectValue("quality", "standard"),
    };
  }

  function cladArea(area, scope) {
    const factor = scope === "refresh" ? 3.2 : scope === "full" ? 4.4 : 4;
    return Math.max(10, area * factor);
  }

  function heatingCost(type, area) {
    if (type === "ladder") return 15000;
    if (type === "floor") return 8000 + area * 3500;
    if (type === "both") return 21000 + area * 3500;
    return 0;
  }

  function basicTechnical(scope, area) {
    if (scope === "refresh") {
      return { demolition: 12000, water: 0, electro: 6000, substrate: 10000, layout: 0, ventilation: 0 };
    }
    if (scope === "full") {
      return { demolition: 38000, water: 48000, electro: 28000, substrate: 30000, layout: 25000, ventilation: 8000 };
    }
    return { demolition: 22000, water: 26000, electro: 14000, substrate: 18000, layout: 0, ventilation: 0 };
  }

  function collectBasic() {
    const core = collectCore();
    return {
      ...core,
      tileRate: BASIC_TILE_RATE[core.quality] || BASIC_TILE_RATE.standard,
      bathroomType: selectValue("bathroomType", "without"),
      heating: selectValue("basicHeating", "ladder"),
      reserveRate: Number(selectValue("basicReserve", "10")) || 10,
      availableBudget: readNumeric("availableBudget"),
      technicalModel: basicTechnical(core.scope, core.area),
      customTechnical: 0,
      customEquipment: 0,
      customCoreRate: 0,
      sanitaryCustom: 0,
      toilet: selectValue("bathroomType", "without") === "with" ? "standard" : "none",
      furniture: core.quality,
      accessories: core.quality,
      regionFactor: 1,
      priceAdjustment: 0,
      demolition: "standard",
      water: core.scope === "refresh" ? "none" : core.scope === "full" ? "full" : "partial",
      electro: core.scope === "refresh" ? "none" : core.scope === "full" ? "full" : "partial",
      substrate: core.scope === "full" ? "problem" : "standard",
      layoutChanges: core.scope === "full" ? "minor" : "no",
      ventilation: core.scope === "full" ? "fan" : "existing",
    };
  }

  function collectAdvanced() {
    const core = collectCore();
    return {
      ...core,
      demolition: selectValue("demolition", "standard"),
      water: selectValue("water", "partial"),
      electro: selectValue("electro", "partial"),
      substrate: selectValue("substrate", "standard"),
      layoutChanges: selectValue("layoutChanges", "no"),
      ventilation: selectValue("ventilation", "existing"),
      customTechnical: readNumeric("customTechnical"),
      tileRate: readNumeric("tilesRate"),
      sanitaryCustom: readNumeric("sanitaryCustom"),
      toilet: selectValue("toilet", "none"),
      heating: selectValue("heating", "ladder"),
      furniture: selectValue("furniture", "standard"),
      accessories: selectValue("accessories", "standard"),
      customEquipment: readNumeric("customEquipment"),
      customCoreRate: readNumeric("customCoreRate"),
      regionFactor: parseLocalized(selectValue("regionFactor", "1")) || 1,
      priceAdjustment: readNumeric("priceAdjustment"),
      reserveRate: Number(selectValue("reserveRate", "10")) || 10,
      availableBudget: readNumeric("advancedBudget"),
      technicalModel: null,
    };
  }

  function validate(values) {
    const errors = [];
    if (values.area < 2) errors.push("Plocha koupelny musí být alespoň 2 m².");
    if (values.area > 30) errors.push("Pro tuto kalkulačku zadejte plochu nejvýše 30 m².");
    if (values.tileRate < 0) errors.push("Cena obkladů nemůže být záporná.");
    return errors;
  }

  function advancedTechnical(values) {
    return {
      demolition: DEMOLITION_COST[values.demolition] || 0,
      water: WATER_COST[values.water] || 0,
      electro: ELECTRO_COST[values.electro] || 0,
      substrate: SUBSTRATE_COST[values.substrate] || 0,
      layout: LAYOUT_COST[values.layoutChanges] || 0,
      ventilation: VENTILATION_COST[values.ventilation] || 0,
    };
  }

  function calculate(values, mode) {
    const surfaceArea = cladArea(values.area, values.scope);
    const baseRate = mode === "advanced" && values.customCoreRate > 0
      ? values.customCoreRate
      : (CORE_RATE[values.scope] || CORE_RATE.medium) * (QUALITY_CORE[values.quality] || 1);
    const coreLaborCost = values.area * baseRate;
    const tileMaterialCost = surfaceArea * Math.max(0, values.tileRate);
    const coreCostRaw = coreLaborCost + tileMaterialCost;

    const technicalModel = mode === "advanced" ? advancedTechnical(values) : values.technicalModel;
    const technicalCostRaw = mode === "advanced" && values.customTechnical > 0
      ? values.customTechnical
      : Object.values(technicalModel).reduce((sum, item) => sum + item, 0);

    const equipmentMultiplier = QUALITY_EQUIPMENT[values.quality] || 1;
    const sanitaryCost = values.sanitaryCustom > 0
      ? values.sanitaryCustom
      : (SANITARY_COST[values.sanitary] || SANITARY_COST.shower) * equipmentMultiplier;
    const toiletCost = (TOILET_COST[values.toilet] || 0) * (values.toilet === "higher" ? 1 : equipmentMultiplier);
    const heatCost = heatingCost(values.heating, values.area) * (values.quality === "higher" ? 1.2 : values.quality === "basic" ? 0.9 : 1);
    const furnitureCost = FURNITURE_COST[values.furniture] || FURNITURE_COST.standard;
    const accessoriesCost = ACCESSORY_COST[values.accessories] || ACCESSORY_COST.standard;
    const equipmentCostRaw = mode === "advanced" && values.customEquipment > 0
      ? values.customEquipment
      : sanitaryCost + toiletCost + heatCost + furnitureCost + accessoriesCost;

    const rawSubtotal = Math.max(0, coreCostRaw + technicalCostRaw + equipmentCostRaw);
    const regionFactor = mode === "advanced" ? values.regionFactor : 1;
    const adjustmentMultiplier = mode === "advanced" ? 1 + clamp(values.priceAdjustment, -30, 50) / 100 : 1;
    const subtotal = Math.max(0, rawSubtotal * regionFactor * adjustmentMultiplier);
    const reserveCost = subtotal * clamp(values.reserveRate, 0, 50) / 100;
    const totalCost = subtotal + reserveCost;

    const applied = regionFactor * adjustmentMultiplier;
    const coreCost = coreCostRaw * applied;
    const technicalCost = technicalCostRaw * applied;
    const equipmentCost = equipmentCostRaw * applied;

    let uncertainty = values.scope === "refresh" ? 0.08 : values.scope === "full" ? 0.18 : 0.12;
    if (values.quality === "higher") uncertainty += 0.025;
    if (values.sanitary === "both") uncertainty += 0.02;
    if (mode === "advanced") {
      if (values.substrate === "problem") uncertainty += 0.04;
      if (values.water === "full" || values.electro === "full") uncertainty += 0.025;
      if (values.layoutChanges === "minor") uncertainty += 0.02;
      if (values.layoutChanges === "major") uncertainty += 0.045;
      if (values.ventilation === "complex") uncertainty += 0.02;
      if (values.customTechnical > 0) uncertainty -= 0.018;
      if (values.customEquipment > 0) uncertainty -= 0.014;
      if (values.customCoreRate > 0) uncertainty -= 0.012;
    }
    if (values.reserveRate < 10) uncertainty += 0.02;
    uncertainty = clamp(uncertainty, 0.055, 0.24);

    const rangeLow = totalCost * (1 - Math.max(0.05, uncertainty * 0.5));
    const rangeHigh = totalCost * (1 + uncertainty);
    const scenarioLow = totalCost * (1 - Math.max(0.1, uncertainty * 0.68));
    const scenarioHigh = totalCost * (1 + Math.max(0.14, uncertainty));
    const budgetDifference = values.availableBudget > 0 ? values.availableBudget - totalCost : null;
    const pricePerM2 = totalCost / Math.max(values.area, 1);

    return {
      mode,
      values,
      surfaceArea,
      baseRate,
      coreLaborCost,
      tileMaterialCost,
      coreCostRaw,
      technicalModel,
      technicalCostRaw,
      sanitaryCost,
      toiletCost,
      heatCost,
      furnitureCost,
      accessoriesCost,
      equipmentCostRaw,
      rawSubtotal,
      regionFactor,
      adjustmentMultiplier,
      coreCost,
      technicalCost,
      equipmentCost,
      subtotal,
      reserveCost,
      totalCost,
      uncertainty,
      rangeLow,
      rangeHigh,
      scenarioLow,
      scenarioHigh,
      budgetDifference,
      pricePerM2,
    };
  }

  function interpretation(result) {
    const techShare = result.technicalCost / Math.max(result.totalCost, 1);
    if (result.values.layoutChanges === "major" || result.values.substrate === "problem" || techShare > 0.34) {
      return {
        badge: "Technicky náročnější varianta",
        kicker: "Hlavní riziko",
        headline: "Rozpočet táhnou skryté práce a návaznosti",
        text: `Odhad je ${money(result.totalCost)}. Před objednávkou ověřte podklad, rozvody, hydroizolaci, větrání a změnu dispozice. Nejlevnější nabídka bez těchto položek nemusí být nejnižší konečná cena.`,
      };
    }
    if (result.values.quality === "higher" || result.values.sanitary === "both" || result.equipmentCost / Math.max(result.totalCost, 1) > 0.38) {
      return {
        badge: "Vyšší podíl vybavení",
        kicker: "Kde hledat úsporu",
        headline: "Výsledek ovlivňuje hlavně sanita a standard detailů",
        text: `Koupelna vychází na ${money(result.totalCost)}. Pokud potřebujete rozpočet snížit, porovnejte konkrétní výrobky a atypické detaily. Technickou rezervu nesnižujte jen kvůli dražší sanitě.`,
      };
    }
    if (result.pricePerM2 > 75000 && result.values.area <= 5) {
      return {
        badge: "Malá koupelna, vyšší cena za m²",
        kicker: "Jak číst cenu za metr",
        headline: "Pevné náklady se rozpočítávají do malé plochy",
        text: `Výsledek ${money(result.totalCost)} odpovídá ${money(result.pricePerM2)} za m². U malé koupelny to nemusí znamenat luxus; mnoho profesí a montážních položek stojí podobně bez ohledu na plochu.`,
      };
    }
    return {
      badge: "Realistický první rámec",
      kicker: "Další krok",
      headline: "Rozpočet je vhodný pro sjednocení poptávek",
      text: `Aktuální odhad je ${money(result.totalCost)}, tedy ${money(result.pricePerM2)} za m². Nyní porovnejte nabídky ve stejném rozsahu a model nahrazujte skutečnými cenami.`,
    };
  }

  function renderBreakdown(result) {
    const container = $("breakdownList");
    if (!container) return;
    const rows = [
      ["Stavební práce a pokládka", result.coreLaborCost * result.regionFactor * result.adjustmentMultiplier, `${money(result.baseRate)} / m²`],
      ["Materiál obkladů a dlažby", result.tileMaterialCost * result.regionFactor * result.adjustmentMultiplier, `${number(result.surfaceArea)} m²`],
      ["Demontáž a odvoz", result.values.customTechnical > 0 ? 0 : (result.technicalModel.demolition || 0) * result.regionFactor * result.adjustmentMultiplier, result.values.customTechnical > 0 ? "nahrazeno součtem" : "technika"],
      ["Voda a odpady", result.values.customTechnical > 0 ? 0 : (result.technicalModel.water || 0) * result.regionFactor * result.adjustmentMultiplier, result.values.customTechnical > 0 ? "nahrazeno součtem" : "rozvody"],
      ["Elektroinstalace", result.values.customTechnical > 0 ? 0 : (result.technicalModel.electro || 0) * result.regionFactor * result.adjustmentMultiplier, result.values.customTechnical > 0 ? "nahrazeno součtem" : "rozvody"],
      ["Podklad, dispozice a větrání", result.values.customTechnical > 0 ? result.technicalCost : ((result.technicalModel.substrate || 0) + (result.technicalModel.layout || 0) + (result.technicalModel.ventilation || 0)) * result.regionFactor * result.adjustmentMultiplier, result.values.customTechnical > 0 ? "vlastní technický součet" : "příprava"],
      ["Sprcha nebo vana", result.values.customEquipment > 0 ? 0 : result.sanitaryCost * result.regionFactor * result.adjustmentMultiplier, result.values.customEquipment > 0 ? "nahrazeno součtem" : LABELS.sanitary[result.values.sanitary]],
      ["WC, topení, nábytek a doplňky", result.values.customEquipment > 0 ? result.equipmentCost : (result.toiletCost + result.heatCost + result.furnitureCost + result.accessoriesCost) * result.regionFactor * result.adjustmentMultiplier, result.values.customEquipment > 0 ? "vlastní vybavení" : "vybavení"],
      ["Rozpočtová rezerva", result.reserveCost, `${number(result.values.reserveRate)} %`],
    ];
    container.replaceChildren(...rows.map(([name, value, note]) => {
      const row = doc.createElement("div");
      row.className = "bathroom-breakdown-row";
      const copy = doc.createElement("div");
      const strong = doc.createElement("strong");
      const small = doc.createElement("small");
      const amount = doc.createElement("b");
      strong.textContent = name;
      small.textContent = note;
      amount.textContent = money(value);
      copy.append(strong, small);
      row.append(copy, amount);
      return row;
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
      setText("budgetMessage", "Limit pokrývá celkový odhad včetně projektové rezervy a ponechává ještě další finanční polštář.");
    } else if (result.budgetDifference >= 0) {
      box.classList.add("is-warning");
      setText("budgetDifference", `Zbývá jen ${money(result.budgetDifference)}`);
      setText("budgetMessage", "Limit pokrývá celkový odhad včetně rezervy, ale další polštář domácnosti je menší než projektová rezerva.");
    } else {
      box.classList.add("is-negative");
      setText("budgetDifference", `Chybí ${money(Math.abs(result.budgetDifference))}`);
      setText("budgetMessage", "Porovnejte menší rozsah nebo levnější vybavení. Technické práce a rezervu nesnižujte bez odstranění skutečného rizika.");
    }
  }

  function updateHero(result) {
    setText("heroTotal", compactMoney(result.totalCost));
    setText("heroSummary", `${LABELS.scope[result.values.scope]}, ${LABELS.sanitary[result.values.sanitary]} a ${LABELS.quality[result.values.quality]}.`);
    setText("heroVariant", LABELS.scope[result.values.scope]);
    setText("heroArea", `${number(result.values.area)} m²`);
    setText("heroTechnical", compactMoney(result.coreCost + result.technicalCost));
    setText("heroEquipment", compactMoney(result.equipmentCost));
    setText("heroReserve", compactMoney(result.reserveCost));
  }

  function renderContentExamples() {
    const baseScenario = ({ area, scope, sanitary, quality, bathroomType = "without", heating = "none", reserveRate = 10 }) => ({
      area, scope, sanitary, quality,
      tileRate: BASIC_TILE_RATE[quality] || BASIC_TILE_RATE.standard,
      bathroomType, heating, reserveRate, availableBudget: 0,
      technicalModel: basicTechnical(scope, area),
      customTechnical: 0, customEquipment: 0, customCoreRate: 0, sanitaryCustom: 0,
      toilet: bathroomType === "with" ? "standard" : "none",
      furniture: quality, accessories: quality, regionFactor: 1, priceAdjustment: 0,
      demolition: "standard", water: "partial", electro: "partial", substrate: "standard",
      layoutChanges: "no", ventilation: "existing",
    });

    const scenarioA = calculate(baseScenario({ area: 4, scope: "refresh", sanitary: "shower", quality: "basic", heating: "none", reserveRate: 10 }), "basic");
    const scenarioB = calculate(baseScenario({ area: 5.5, scope: "medium", sanitary: "shower", quality: "standard", heating: "ladder", reserveRate: 10 }), "basic");
    const scenarioC = calculate({
      area: 8, scope: "full", sanitary: "both", quality: "higher", tileRate: BASIC_TILE_RATE.higher,
      demolition: "complex", water: "full", electro: "full", substrate: "problem", layoutChanges: "major", ventilation: "fan",
      customTechnical: 0, sanitaryCustom: 0, toilet: "higher", heating: "floor", furniture: "higher", accessories: "higher",
      customEquipment: 0, customCoreRate: 0, regionFactor: 1, priceAdjustment: 0, reserveRate: 15, availableBudget: 0, technicalModel: null,
    }, "advanced");

    const write = (id, result) => setText(id, `${money(result.totalCost)} · pracovní interval ${money(result.rangeLow)} až ${money(result.rangeHigh)}`);
    write("exampleAResult", scenarioA);
    write("exampleBResult", scenarioB);
    write("exampleCResult", scenarioC);
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
    setText("resultSummary", `Stavební práce a povrchy tvoří ${number(result.coreCost / Math.max(result.totalCost, 1) * 100)} %, technické zásahy ${number(result.technicalCost / Math.max(result.totalCost, 1) * 100)} % a vybavení ${number(result.equipmentCost / Math.max(result.totalCost, 1) * 100)} % celkového rámce.`);
    setText("coreCost", money(result.coreCost));
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
    setText("areaLabel", `${number(result.values.area)} m²`);
    const track = $("areaTrack");
    if (track) track.style.width = `${clamp(result.values.area / 20 * 100, 10, 100)}%`;
    renderBudget(result);
    renderBreakdown(result);
    updateHero(result);
    return result;
  }

  function setMode(mode, options = {}) {
    currentMode = mode === "advanced" ? "advanced" : "basic";
    root.dataset.calculatorMode = currentMode;
    doc.querySelectorAll(".bathroom-mode-btn").forEach((button) => {
      const active = button.dataset.mode === currentMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const advanced = $("advancedCalculation");
    if (advanced) advanced.hidden = currentMode !== "advanced";
    setText("formTitle", currentMode === "advanced" ? "Zpřesněte rozpočet koupelny" : "Začněte rychlým odhadem");
    setText("formLead", currentMode === "advanced"
      ? "Základní údaje zůstávají nahoře. Pod nimi přidáte pouze technický stav, vybavení a vlastní rozpočtové podklady."
      : "Čtyři srozumitelné údaje stačí pro první realistický rozpočtový rámec. Výsledek se mění automaticky.");
    if (options.render !== false) render();
  }

  function setAdvancedStep(index) {
    const stages = [...doc.querySelectorAll("[data-advanced-stage]")];
    const buttons = [...doc.querySelectorAll("[data-advanced-step]")];
    if (!stages.length) return;
    currentAdvancedStep = clamp(Number(index) || 0, 0, stages.length - 1);
    stages.forEach((stage, i) => {
      const active = i === currentAdvancedStep;
      stage.hidden = !active;
      stage.classList.toggle("is-active", active);
    });
    buttons.forEach((button, i) => {
      const active = i === currentAdvancedStep;
      button.classList.toggle("is-active", active);
      if (active) button.setAttribute("aria-current", "step");
      else button.removeAttribute("aria-current");
    });
    const prev = $("advancedPrev");
    const next = $("advancedNext");
    if (prev) prev.disabled = currentAdvancedStep === 0;
    if (next) {
      const last = currentAdvancedStep === stages.length - 1;
      next.disabled = last;
      next.textContent = last ? "Všechny kroky hotové" : "Další krok →";
    }
    setText("advancedStepStatus", `Krok ${currentAdvancedStep + 1} ze ${stages.length}`);
  }

  function shareUrl() {
    const url = new URL(window.location.href);
    url.search = "";
    Object.entries(URL_MAP).forEach(([id, key]) => {
      const el = $(id);
      if (!el) return;
      const value = el.tagName === "SELECT" ? el.value : readNumeric(id);
      url.searchParams.set(key, String(value));
    });
    url.searchParams.set("rezim", currentMode);
    return url.toString();
  }

  function loadUrl() {
    const params = new URLSearchParams(window.location.search);
    Object.entries(URL_MAP).forEach(([id, key]) => {
      if (!params.has(key)) return;
      const el = $(id);
      if (!el) return;
      const raw = params.get(key);
      if (el.tagName === "SELECT") {
        const valid = [...el.options].some((option) => option.value === raw);
        if (valid) el.value = raw;
      } else {
        el.value = raw ?? "";
        formatInput(id);
      }
    });
    setMode(params.get("rezim") === "advanced" ? "advanced" : "basic", { render: false });
    if (currentMode === "advanced") setAdvancedStep(0);
  }

  async function copyText(value, successMessage) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = doc.createElement("textarea");
        area.value = value;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        doc.body.appendChild(area);
        area.select();
        const copied = doc.execCommand("copy");
        area.remove();
        if (!copied) throw new Error("copy failed");
      }
      setText("copyStatus", successMessage);
    } catch (error) {
      setText("copyStatus", "Kopírování se nepodařilo. Odkaz můžete zkopírovat z adresního řádku.");
    }
  }

  function resultText() {
    if (!lastResult) return "";
    const r = lastResult;
    return [
      "Cena rekonstrukce koupelny – RychléVýpočty.cz",
      `Režim: ${r.mode === "advanced" ? "podrobný" : "rychlý"}`,
      `Varianta: ${LABELS.scope[r.values.scope]}, ${LABELS.sanitary[r.values.sanitary]}, ${LABELS.quality[r.values.quality]}`,
      `Plocha: ${number(r.values.area)} m²`,
      `Stavební práce a povrchy: ${money(r.coreCost)}`,
      `Technické rozvody a příprava: ${money(r.technicalCost)}`,
      `Sanita a vybavení: ${money(r.equipmentCost)}`,
      `Rezerva: ${money(r.reserveCost)} (${number(r.values.reserveRate)} %)`,
      `Celkový rozpočtový rámec: ${money(r.totalCost)}`,
      `Pracovní interval: ${money(r.rangeLow)} až ${money(r.rangeHigh)}`,
      "Výsledek je orientační a nenahrazuje zaměření, položkový rozpočet ani závaznou nabídku.",
    ].join("\n");
  }

  function resetAll() {
    form.reset();
    numericInputs.forEach(formatInput);
    setText("copyStatus", "");
    setText("formStatus", "");
    setAdvancedStep(0);
    setMode("basic", { render: false });
    render();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });

  allInputs.forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", render);
    el.addEventListener("change", render);
    if (el.tagName !== "SELECT") el.addEventListener("blur", () => { formatInput(id); render(); });
  });

  doc.querySelectorAll(".bathroom-mode-btn").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  doc.querySelectorAll(".bathroom-step-btn").forEach((button) => button.addEventListener("click", () => setAdvancedStep(Number(button.dataset.advancedStep))));
  $("advancedPrev")?.addEventListener("click", () => setAdvancedStep(currentAdvancedStep - 1));
  $("advancedNext")?.addEventListener("click", () => setAdvancedStep(currentAdvancedStep + 1));
  $("resetBtn")?.addEventListener("click", resetAll);
  $("copyResultBtn")?.addEventListener("click", () => copyText(resultText(), "Výsledek byl zkopírován."));
  $("copyLinkBtn")?.addEventListener("click", () => copyText(shareUrl(), "Odkaz s nastavením byl zkopírován."));
  $("toggleBreakdown")?.addEventListener("click", (event) => {
    const wrap = $("breakdownWrap");
    if (!wrap) return;
    const collapsed = wrap.classList.toggle("is-collapsed");
    event.currentTarget.setAttribute("aria-expanded", String(!collapsed));
    event.currentTarget.textContent = collapsed ? "Zobrazit rozpad" : "Skrýt rozpad";
  });

  loadUrl();
  numericInputs.forEach(formatInput);
  setAdvancedStep(0);
  renderContentExamples();
  render();
})();
