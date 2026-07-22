(() => {
  "use strict";

  const doc = document;
  const root = doc.body;
  const form = doc.getElementById("kitchenCalculator");
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
    scope: { refresh: "výměna linky", medium: "nová kuchyň včetně úprav", full: "kompletní rekonstrukce" },
    quality: { basic: "úsporný standard", standard: "běžný kvalitní standard", higher: "vyšší standard" },
    appliances: { reuse: "část spotřebičů zůstává", basic: "základní nová sada", standard: "běžná vestavná sada", higher: "vyšší třída spotřebičů" },
  };

  const FURNITURE_RATE = { basic: 28000, standard: 43000, higher: 65000 };
  const APPLIANCE_COST = { reuse: 18000, basic: 70000, standard: 125000, higher: 230000 };
  const WORKTOP_RATE = { laminate: 6000, wood: 11500, stone: 23500 };
  const BACKSPLASH_RATE = { none: 0, basic: 3200, higher: 8800 };
  const SINK_LIGHTING_COST = { basic: 16000, standard: 33000, higher: 68000 };
  const DEMOLITION_COST = { self: 0, standard: 22000, complex: 45000 };
  const WATER_COST = { none: 0, partial: 22000, full: 58000 };
  const SURFACE_RATE = { none: 0, partial: 1750, full: 4400 };
  const BASIC_ASSUMPTIONS = Object.freeze({
    islandLength: 0,
    backsplash: "basic",
    sinkLighting: "standard",
    extraEquipment: 0,
    customFurnitureRate: 0,
    customAppliances: 0,
    regionFactor: 1,
    priceAdjustment: 0,
  });

  const numericInputs = [
    "lineLength", "area", "availableBudget", "customTechnical", "customWorktop", "islandLength",
    "customAppliances", "extraEquipment", "customFurnitureRate", "priceAdjustment", "advancedBudget",
  ];
  const selectInputs = [
    "scope", "quality", "appliances", "basicWorktop", "basicReserve", "water", "electro", "surfaces",
    "demolition", "layoutChanges", "worktop", "backsplash", "sinkLighting", "regionFactor", "reserveRate",
  ];
  const allInputs = [...numericInputs, ...selectInputs];

  const URL_MAP = {
    lineLength: "delka",
    area: "plocha",
    scope: "rozsah",
    quality: "standard",
    appliances: "spotrebice",
    basicWorktop: "deska",
    basicReserve: "rezerva",
    availableBudget: "rozpocet",
    water: "voda",
    electro: "elektro",
    surfaces: "povrchy",
    demolition: "demontaz",
    layoutChanges: "dispozice",
    customTechnical: "technikaCena",
    worktop: "proDeska",
    customWorktop: "deskaCena",
    islandLength: "ostruvek",
    backsplash: "obklad",
    sinkLighting: "doplnky",
    customAppliances: "spotrebiceCena",
    extraEquipment: "vybaveni",
    customFurnitureRate: "nabytekBm",
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
    const decimals = ["lineLength", "area", "islandLength", "priceAdjustment"].includes(id) ? 1 : 0;
    input.value = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: decimals }).format(value);
  }

  function selectValue(id, fallback) {
    const el = $(id);
    return el ? el.value : fallback;
  }

  function collectCore() {
    return {
      lineLength: readNumeric("lineLength"),
      area: readNumeric("area"),
      scope: selectValue("scope", "medium"),
      quality: selectValue("quality", "standard"),
      appliances: selectValue("appliances", "standard"),
    };
  }

  function basicTechnical(scope, area, length) {
    if (scope === "refresh") {
      return {
        demolition: 12000,
        water: 0,
        electro: 9000,
        surfaces: Math.max(5000, area * 650),
        layout: 0,
      };
    }
    if (scope === "full") {
      return {
        demolition: 38000,
        water: 52000,
        electro: 62000 + length * 1900,
        surfaces: area * 4200,
        layout: 48000,
      };
    }
    return {
      demolition: 22000,
      water: 22000,
      electro: 30000 + length * 1200,
      surfaces: area * 1750,
      layout: 0,
    };
  }

  function collectBasic() {
    const core = collectCore();
    const tech = basicTechnical(core.scope, core.area, core.lineLength);
    return {
      ...core,
      ...BASIC_ASSUMPTIONS,
      worktop: selectValue("basicWorktop", "laminate"),
      reserveRate: Number(selectValue("basicReserve", "10")) || 10,
      availableBudget: readNumeric("availableBudget"),
      technicalModel: tech,
      customTechnical: 0,
      demolition: "standard",
      water: "partial",
      electro: "partial",
      surfaces: "partial",
      layoutChanges: "no",
      customWorktop: 0,
    };
  }

  function collectAdvanced() {
    const core = collectCore();
    return {
      ...core,
      water: selectValue("water", "partial"),
      electro: selectValue("electro", "partial"),
      surfaces: selectValue("surfaces", "partial"),
      demolition: selectValue("demolition", "standard"),
      layoutChanges: selectValue("layoutChanges", "no"),
      customTechnical: readNumeric("customTechnical"),
      worktop: selectValue("worktop", "laminate"),
      customWorktop: readNumeric("customWorktop"),
      islandLength: readNumeric("islandLength"),
      backsplash: selectValue("backsplash", "basic"),
      sinkLighting: selectValue("sinkLighting", "standard"),
      customAppliances: readNumeric("customAppliances"),
      extraEquipment: readNumeric("extraEquipment"),
      customFurnitureRate: readNumeric("customFurnitureRate"),
      regionFactor: parseLocalized(selectValue("regionFactor", "1")) || 1,
      priceAdjustment: readNumeric("priceAdjustment"),
      reserveRate: Number(selectValue("reserveRate", "10")) || 10,
      availableBudget: readNumeric("advancedBudget"),
      technicalModel: null,
    };
  }

  function validate(values) {
    const errors = [];
    if (values.lineLength < 1) errors.push("Délka linky musí být alespoň 1 bm.");
    if (values.lineLength > 20) errors.push("Pro tuto kalkulačku zadejte délku nejvýše 20 bm.");
    if (values.area < 4) errors.push("Plocha kuchyně musí být alespoň 4 m².");
    return errors;
  }

  function advancedTechnical(values) {
    const demolition = DEMOLITION_COST[values.demolition] || 0;
    const water = WATER_COST[values.water] || 0;
    const electro = values.electro === "full"
      ? 62000 + values.lineLength * 1900
      : values.electro === "partial"
        ? 30000 + values.lineLength * 1200
        : 8000;
    const surfaces = (SURFACE_RATE[values.surfaces] || 0) * values.area;
    const layout = values.layoutChanges === "yes" ? 48000 : 0;
    return { demolition, water, electro, surfaces, layout };
  }

  function calculate(values, mode) {
    const furnitureRate = mode === "advanced" && values.customFurnitureRate > 0
      ? values.customFurnitureRate
      : (FURNITURE_RATE[values.quality] || FURNITURE_RATE.standard);
    const effectiveLine = values.lineLength + (mode === "advanced" ? values.islandLength * 1.18 : 0);
    const furnitureCost = effectiveLine * furnitureRate;
    const appliancesCost = mode === "advanced" && values.customAppliances > 0
      ? values.customAppliances
      : (APPLIANCE_COST[values.appliances] || APPLIANCE_COST.standard);
    const worktopLength = values.lineLength + (mode === "advanced" ? values.islandLength * 1.1 : 0);
    const worktopCost = mode === "advanced" && values.worktop === "custom"
      ? values.customWorktop
      : worktopLength * (WORKTOP_RATE[values.worktop] || WORKTOP_RATE.laminate);
    const backsplashCost = mode === "advanced"
      ? values.lineLength * (BACKSPLASH_RATE[values.backsplash] || 0)
      : values.lineLength * BACKSPLASH_RATE.basic;
    const sinkLightingCost = mode === "advanced"
      ? (SINK_LIGHTING_COST[values.sinkLighting] || SINK_LIGHTING_COST.standard)
      : SINK_LIGHTING_COST.standard;
    const extraEquipment = mode === "advanced" ? values.extraEquipment : 0;

    const modelTechnical = mode === "advanced" ? advancedTechnical(values) : values.technicalModel;
    const technicalCore = mode === "advanced" && values.customTechnical > 0
      ? values.customTechnical
      : Object.values(modelTechnical).reduce((sum, value) => sum + value, 0);
    const installationLogistics = 12000 + furnitureCost * (values.scope === "refresh" ? 0.08 : values.scope === "full" ? 0.13 : 0.105);

    const equipmentCost = appliancesCost + worktopCost + backsplashCost + sinkLightingCost + extraEquipment;
    const technicalCost = technicalCore + installationLogistics;
    const rawSubtotal = furnitureCost + equipmentCost + technicalCost;
    const regionFactor = mode === "advanced" ? values.regionFactor : 1;
    const adjustmentMultiplier = mode === "advanced" ? 1 + clamp(values.priceAdjustment, -30, 50) / 100 : 1;
    const subtotal = Math.max(0, rawSubtotal * regionFactor * adjustmentMultiplier);
    const reserveCost = subtotal * clamp(values.reserveRate, 0, 50) / 100;
    const totalCost = subtotal + reserveCost;

    let uncertainty = values.scope === "refresh" ? 0.07 : values.scope === "full" ? 0.16 : 0.11;
    if (values.quality === "higher") uncertainty += 0.025;
    if (mode === "advanced") {
      if (values.layoutChanges === "yes") uncertainty += 0.03;
      if (values.electro === "full" || values.water === "full") uncertainty += 0.025;
      if (values.worktop === "stone") uncertainty += 0.015;
      if (values.islandLength > 0) uncertainty += 0.015;
      if (values.customFurnitureRate > 0) uncertainty -= 0.015;
      if (values.customTechnical > 0) uncertainty -= 0.012;
    }
    if (values.reserveRate < 10) uncertainty += 0.02;
    uncertainty = clamp(uncertainty, 0.055, 0.22);

    const rangeLow = totalCost * (1 - Math.max(0.05, uncertainty * 0.52));
    const rangeHigh = totalCost * (1 + uncertainty);
    const scenarioLow = totalCost * (1 - Math.max(0.09, uncertainty * 0.72));
    const scenarioHigh = totalCost * (1 + Math.max(0.13, uncertainty));
    const budgetDifference = values.availableBudget > 0 ? values.availableBudget - totalCost : null;

    return {
      mode,
      values,
      furnitureRate,
      effectiveLine,
      furnitureCost,
      appliancesCost,
      worktopCost,
      backsplashCost,
      sinkLightingCost,
      extraEquipment,
      modelTechnical,
      technicalCore,
      installationLogistics,
      equipmentCost,
      technicalCost,
      rawSubtotal,
      regionFactor,
      adjustmentMultiplier,
      subtotal,
      reserveCost,
      totalCost,
      uncertainty,
      rangeLow,
      rangeHigh,
      scenarioLow,
      scenarioHigh,
      budgetDifference,
    };
  }

  function interpretation(result) {
    const v = result.values;
    if (result.budgetDifference !== null && result.budgetDifference < 0) {
      return {
        badge: "Rozpočet nestačí",
        kicker: "Finanční limit",
        headline: "Zadání přesahuje váš dostupný rozpočet",
        text: `Do středového odhadu chybí přibližně ${money(Math.abs(result.budgetDifference))}. Nejdříve porovnejte standard nábytku, spotřebiče, pracovní desku a změnu dispozice. Nesnižujte rezervu jen proto, aby součet formálně vyšel.`,
      };
    }
    const technicalShare = result.technicalCost / Math.max(result.totalCost, 1);
    const furnitureShare = result.furnitureCost / Math.max(result.totalCost, 1);
    if (technicalShare > 0.32) {
      return {
        badge: "Technicky náročná varianta",
        kicker: "Co táhne cenu",
        headline: "Velkou část rozpočtu tvoří práce mimo samotnou linku",
        text: `Technické a montážní práce představují přibližně ${number(technicalShare * 100)} % výsledku. Před objednávkou nábytku ověřte elektro, vodu, odpad, podklady a pořadí jednotlivých profesí.`,
      };
    }
    if (furnitureShare > 0.48) {
      return {
        badge: "Cenu táhne nábytek",
        kicker: "Největší položka",
        headline: "Největší prostor pro změnu je ve standardu sestavy",
        text: `Nábytek tvoří přibližně ${number(furnitureShare * 100)} % celkového rámce. Porovnejte počet zásuvek, vysokých skříní, rohových mechanismů, kování a atypických prvků, ne pouze dekor čela.`,
      };
    }
    return {
      badge: v.scope === "full" ? "Kompletní rekonstrukce" : "Vyvážený rozpočet",
      kicker: "První rozpočtový rámec",
      headline: "Výsledek rozděluje kuchyň na srovnatelné části",
      text: `Středový odhad vychází na ${money(result.totalCost)}. Při poptávce porovnejte stejný rozsah nábytku, spotřebičů, desky, montáže a technických prací.`,
    };
  }

  function clearNode(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function appendBreakdownRow(parent, label, value, note) {
    if (!(value > 0)) return;
    const row = doc.createElement("div");
    row.className = "kitchen-breakdown-row";
    const span = doc.createElement("span");
    span.textContent = label;
    const strong = doc.createElement("b");
    strong.textContent = money(value);
    const small = doc.createElement("small");
    small.textContent = note;
    row.append(span, strong, small);
    parent.appendChild(row);
  }

  function renderBreakdown(result) {
    const list = $("breakdownList");
    if (!list) return;
    clearNode(list);
    const factor = result.regionFactor * result.adjustmentMultiplier;
    appendBreakdownRow(list, "Kuchyňský nábytek", result.furnitureCost * factor, `${number(result.effectiveLine)} bm · ${LABELS.quality[result.values.quality]}`);
    appendBreakdownRow(list, "Spotřebiče", result.appliancesCost * factor, LABELS.appliances[result.values.appliances]);
    appendBreakdownRow(list, "Pracovní deska", result.worktopCost * factor, "materiál, výřezy a modelová délka");
    appendBreakdownRow(list, "Obklad za linkou", result.backsplashCost * factor, "materiál a běžná montáž");
    appendBreakdownRow(list, "Dřez, baterie a osvětlení", result.sinkLightingCost * factor, "samostatně od nábytku");
    appendBreakdownRow(list, "Další vybavení", result.extraEquipment * factor, "uživatelsky zadaná částka");
    appendBreakdownRow(list, "Stavební a technické práce", result.technicalCore * factor, result.values.customTechnical > 0 ? "vlastní součet" : "demontáž, elektro, voda, povrchy a dispozice");
    appendBreakdownRow(list, "Montáž, doprava a logistika", result.installationLogistics * factor, "model podle velikosti a rozsahu");
    appendBreakdownRow(list, "Rozpočtová rezerva", result.reserveCost, `${number(result.values.reserveRate)} % z mezisoučtu`);
  }

  function renderBudget(result) {
    const box = $("budgetCheck");
    if (!box) return;
    box.classList.remove("is-positive", "is-negative", "is-warning");
    if (result.budgetDifference === null) {
      setText("budgetDifference", "Rozpočet nebyl zadán");
      setText("budgetMessage", "Doplňte nepovinný limit a uvidíte finanční polštář nebo chybějící částku.");
      return;
    }
    if (result.budgetDifference >= result.reserveCost) {
      box.classList.add("is-positive");
      setText("budgetDifference", `Zbývá ${money(result.budgetDifference)}`);
      setText("budgetMessage", "Zadaný limit je nad středovým odhadem. Přesto zkontrolujte horní hranici intervalu a položky, které nabídka neobsahuje.");
    } else if (result.budgetDifference >= 0) {
      box.classList.add("is-warning");
      setText("budgetDifference", `Zbývá jen ${money(result.budgetDifference)}`);
      setText("budgetMessage", "Projekt se do limitu vejde pouze těsně. Finanční polštář je menší než vypočtená rezerva.");
    } else {
      box.classList.add("is-negative");
      setText("budgetDifference", `Chybí ${money(Math.abs(result.budgetDifference))}`);
      setText("budgetMessage", "Porovnejte levnější scénář, menší rozsah nebo jiný standard. Rezervu nesnižujte bez odstranění skutečného rizika.");
    }
  }

  function updateHero(result) {
    setText("heroTotal", compactMoney(result.totalCost));
    setText("heroSummary", `${LABELS.scope[result.values.scope]}, ${LABELS.quality[result.values.quality]} a ${LABELS.appliances[result.values.appliances]}.`);
    setText("heroVariant", LABELS.scope[result.values.scope]);
    setText("heroLine", `${number(result.effectiveLine)} bm`);
    setText("heroFurniture", compactMoney(result.furnitureCost * result.regionFactor * result.adjustmentMultiplier));
    setText("heroTechnical", compactMoney(result.technicalCost * result.regionFactor * result.adjustmentMultiplier));
    setText("heroReserve", compactMoney(result.reserveCost));
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
    setText("resultSummary", `Nábytek tvoří ${number(result.furnitureCost / Math.max(result.totalCost, 1) * 100)} %, vybavení ${number(result.equipmentCost / Math.max(result.totalCost, 1) * 100)} % a technické práce s montáží ${number(result.technicalCost / Math.max(result.totalCost, 1) * 100)} % celkového rámce.`);
    setText("furnitureCost", money(result.furnitureCost * result.regionFactor * result.adjustmentMultiplier));
    setText("equipmentCost", money(result.equipmentCost * result.regionFactor * result.adjustmentMultiplier));
    setText("technicalCost", money(result.technicalCost * result.regionFactor * result.adjustmentMultiplier));
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
    setText("totalLineLabel", `${number(result.effectiveLine)} bm`);
    const lineTrack = $("lineTrack");
    if (lineTrack) lineTrack.style.width = `${clamp(result.effectiveLine / 12 * 100, 10, 100)}%`;
    renderBudget(result);
    renderBreakdown(result);
    updateHero(result);
    return result;
  }

  function setMode(mode, options = {}) {
    currentMode = mode === "advanced" ? "advanced" : "basic";
    root.dataset.calculatorMode = currentMode;
    doc.querySelectorAll(".kitchen-mode-btn").forEach((button) => {
      const active = button.dataset.mode === currentMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const advanced = $("advancedCalculation");
    if (advanced) advanced.hidden = currentMode !== "advanced";
    setText("formTitle", currentMode === "advanced" ? "Zpřesněte rozpočet kuchyně" : "Začněte rychlým odhadem");
    setText("formLead", currentMode === "advanced"
      ? "Základní údaje zůstávají nahoře. Pod nimi přidáte pouze technické práce, vybavení a vlastní rozpočtové podklady."
      : "Čtyři základní volby stačí pro první realistický rozpočtový rámec. Výsledek se aktualizuje automaticky.");
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
      "Cena rekonstrukce kuchyně – RychléVýpočty.cz",
      `Režim: ${r.mode === "advanced" ? "podrobný" : "rychlý"}`,
      `Varianta: ${LABELS.scope[r.values.scope]}, ${LABELS.quality[r.values.quality]}`,
      `Délka sestavy: ${number(r.effectiveLine)} bm`,
      `Kuchyňský nábytek: ${money(r.furnitureCost * r.regionFactor * r.adjustmentMultiplier)}`,
      `Spotřebiče a vybavení: ${money(r.equipmentCost * r.regionFactor * r.adjustmentMultiplier)}`,
      `Technické práce a montáž: ${money(r.technicalCost * r.regionFactor * r.adjustmentMultiplier)}`,
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

  doc.querySelectorAll(".kitchen-mode-btn").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  doc.querySelectorAll(".kitchen-step-btn").forEach((button) => button.addEventListener("click", () => setAdvancedStep(Number(button.dataset.advancedStep))));
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
  render();
})();
