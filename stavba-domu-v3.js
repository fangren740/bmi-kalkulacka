(() => {
  "use strict";

  const doc = document;
  const root = doc.body;
  const form = doc.getElementById("houseBuildForm");
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
    return money(value);
  };

  const labels = {
    houseType: { compact: "kompaktní dům", storey: "patrový rodinný dům", bungalow: "bungalov" },
    stage: { rough: "hrubá stavba", shell: "dům k dokončení", turnkey: "dům na klíč" },
    standard: { basic: "úspornější řešení", standard: "běžný standard", higher: "vyšší standard" },
    roof: { simple: "jednoduchá střecha", medium: "běžně členitá střecha", complex: "složitá střecha" },
    land: { easy: "jednoduchý pozemek", medium: "běžný pozemek", hard: "náročný pozemek" },
  };

  const BASE_RATE = { compact: 40000, storey: 43000, bungalow: 46000 };
  const STAGE_MULTIPLIER = { rough: 0.48, shell: 0.73, turnkey: 1 };
  const STANDARD_MULTIPLIER = { basic: 0.91, standard: 1, higher: 1.18 };
  const FLOOR_MULTIPLIER = { 1: 1, 2: 1, 3: 1.06 };
  const ROOF_MULTIPLIER = { simple: 1, medium: 1.06, complex: 1.13 };
  const LAND_MULTIPLIER = { easy: 0.98, medium: 1, hard: 1.11 };
  const GARAGE_COST = { none: 0, carport: 240000, garage: 650000 };

  const BASIC_ASSUMPTIONS = Object.freeze({
    floors: 2,
    roofType: "simple",
    landComplexity: "medium",
    regionFactor: 1,
    projectCost: 320000,
    connectionsCost: 280000,
    garage: "none",
    garageCustom: 0,
    exteriorCost: 220000,
    extraEquipment: 0,
    customRate: 0,
    priceAdjustment: 0,
  });

  const numericInputs = [
    "usableArea", "availableBudget", "projectCost", "connectionsCost", "garageCustom", "exteriorCost",
    "extraEquipment", "customRate", "priceAdjustment", "advancedBudget",
  ];
  const selectInputs = [
    "houseType", "completionStage", "buildStandard", "basicReserve", "floors", "roofType",
    "landComplexity", "regionFactor", "garage", "reserveRate",
  ];
  const allInputs = [...numericInputs, ...selectInputs];

  const URL_MAP = {
    usableArea: "plocha",
    houseType: "typ",
    completionStage: "faze",
    buildStandard: "standard",
    availableBudget: "rozpocet",
    basicReserve: "rezerva",
    floors: "podlazi",
    roofType: "strecha",
    landComplexity: "pozemek",
    regionFactor: "region",
    projectCost: "projekt",
    connectionsCost: "pripojky",
    garage: "garaz",
    garageCustom: "garazCena",
    exteriorCost: "okoli",
    extraEquipment: "vybaveni",
    customRate: "sazba",
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
    const decimals = id === "priceAdjustment" || id === "usableArea" ? 1 : 0;
    input.value = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: decimals }).format(value);
  }

  function selectValue(id, fallback) {
    const el = $(id);
    return el ? el.value : fallback;
  }

  function collectCore() {
    return {
      usableArea: readNumeric("usableArea"),
      houseType: selectValue("houseType", "storey"),
      completionStage: selectValue("completionStage", "turnkey"),
      buildStandard: selectValue("buildStandard", "standard"),
    };
  }

  function collectBasic() {
    const core = collectCore();
    return {
      ...core,
      ...BASIC_ASSUMPTIONS,
      reserveRate: Number(selectValue("basicReserve", "12")) || 12,
      availableBudget: readNumeric("availableBudget"),
    };
  }

  function collectAdvanced() {
    const core = collectCore();
    return {
      ...core,
      floors: Number(selectValue("floors", "2")) || 2,
      roofType: selectValue("roofType", "simple"),
      landComplexity: selectValue("landComplexity", "medium"),
      regionFactor: parseLocalized(selectValue("regionFactor", "1")) || 1,
      projectCost: readNumeric("projectCost"),
      connectionsCost: readNumeric("connectionsCost"),
      garage: selectValue("garage", "none"),
      garageCustom: readNumeric("garageCustom"),
      exteriorCost: readNumeric("exteriorCost"),
      extraEquipment: readNumeric("extraEquipment"),
      customRate: readNumeric("customRate"),
      priceAdjustment: readNumeric("priceAdjustment"),
      reserveRate: Number(selectValue("reserveRate", "12")) || 0,
      availableBudget: readNumeric("advancedBudget"),
    };
  }

  function validate(values) {
    const errors = [];
    if (values.usableArea < 30) errors.push("Užitná plocha musí být alespoň 30 m².");
    if (values.usableArea > 1000) errors.push("Pro tuto kalkulačku zadejte plochu nejvýše 1 000 m².");
    return errors;
  }

  function calculate(values, mode) {
    const modelBaseRate = BASE_RATE[values.houseType] || BASE_RATE.storey;
    const stageMultiplier = STAGE_MULTIPLIER[values.completionStage] || 1;
    const standardMultiplier = STANDARD_MULTIPLIER[values.buildStandard] || 1;
    const floorMultiplier = FLOOR_MULTIPLIER[values.floors] || 1;
    const roofMultiplier = ROOF_MULTIPLIER[values.roofType] || 1;
    const landMultiplier = LAND_MULTIPLIER[values.landComplexity] || 1;
    const regionFactor = Number(values.regionFactor) || 1;
    const adjustmentMultiplier = 1 + clamp(values.priceAdjustment, -30, 50) / 100;

    let effectiveRate;
    let rateSource;
    if (mode === "advanced" && values.customRate > 0) {
      effectiveRate = values.customRate * adjustmentMultiplier;
      rateSource = "vlastní sazba zadaná uživatelem";
    } else {
      effectiveRate = modelBaseRate * stageMultiplier * standardMultiplier * floorMultiplier * roofMultiplier * landMultiplier * regionFactor * adjustmentMultiplier;
      rateSource = "modelová sazba RV-DŮM-2026.07";
    }

    const buildCost = Math.max(0, values.usableArea * effectiveRate);
    const garageCost = values.garage === "custom" ? values.garageCustom : (GARAGE_COST[values.garage] || 0);
    const otherWithoutReserve = Math.max(0,
      values.projectCost + values.connectionsCost + garageCost + values.exteriorCost + values.extraEquipment,
    );
    const subtotal = buildCost + otherWithoutReserve;
    const reserveCost = subtotal * (clamp(values.reserveRate, 0, 50) / 100);
    const totalCost = subtotal + reserveCost;

    let uncertainty = 0.075;
    if (values.completionStage === "rough") uncertainty += 0.04;
    else if (values.completionStage === "shell") uncertainty += 0.025;
    if (values.buildStandard === "higher") uncertainty += 0.02;
    if (values.houseType === "bungalow") uncertainty += 0.012;
    if (mode === "advanced") {
      if (values.roofType === "medium") uncertainty += 0.015;
      if (values.roofType === "complex") uncertainty += 0.04;
      if (values.landComplexity === "medium") uncertainty += 0.01;
      if (values.landComplexity === "hard") uncertainty += 0.04;
      if (values.customRate > 0) uncertainty -= 0.018;
    }
    if (values.reserveRate < 10) uncertainty += 0.015;
    uncertainty = clamp(uncertainty, 0.055, 0.19);

    const rangeLow = totalCost * (1 - uncertainty * 0.48);
    const rangeHigh = totalCost * (1 + uncertainty);
    const scenarioLow = totalCost * (1 - Math.max(0.08, uncertainty * 0.7));
    const scenarioHigh = totalCost * (1 + Math.max(0.12, uncertainty));
    const budgetDifference = values.availableBudget > 0 ? values.availableBudget - totalCost : null;

    return {
      mode,
      values,
      effectiveRate,
      rateSource,
      buildCost,
      garageCost,
      otherWithoutReserve,
      subtotal,
      reserveCost,
      totalCost,
      rangeLow,
      rangeHigh,
      uncertainty,
      scenarioLow,
      scenarioHigh,
      budgetDifference,
    };
  }

  function interpretation(result) {
    const v = result.values;
    const riskCount = [
      v.buildStandard === "higher",
      v.completionStage !== "turnkey",
      v.houseType === "bungalow",
      v.roofType === "complex",
      v.landComplexity === "hard",
      v.reserveRate < 10,
    ].filter(Boolean).length;

    if (result.budgetDifference !== null && result.budgetDifference < 0) {
      return {
        badge: "Rozpočet nestačí",
        kicker: "Finanční limit",
        headline: "Plán přesahuje zadaný rozpočet",
        text: `Do středového odhadu chybí přibližně ${money(Math.abs(result.budgetDifference))}. Nejdříve porovnejte menší plochu, nižší rozsah dodávky a položky mimo samotný dům. Nesnižujte rezervu jen proto, aby výsledek formálně vyšel.`,
      };
    }
    if (result.budgetDifference !== null && result.budgetDifference >= result.totalCost * 0.1) {
      return {
        badge: "Rozpočet má polštář",
        kicker: "Finanční limit",
        headline: "Zadaný rozpočet ponechává použitelnou rezervu",
        text: `Po odečtení středového odhadu zbývá přibližně ${money(result.budgetDifference)}. Ještě ověřte, zda váš limit zahrnuje pozemek, úroky, vybavení po nastěhování a všechny položky, které dodavatel vede mimo nabídku.`,
      };
    }
    if (riskCount >= 3 || result.uncertainty >= 0.14) {
      return {
        badge: "Vyšší nejistota",
        kicker: "Jak výsledek číst",
        headline: "Projekt už potřebuje položkový rozpočet",
        text: `Středový odhad je ${money(result.totalCost)}, ale kombinace zvolených parametrů rozšiřuje pracovní interval. Rozdělte projekt na konstrukce, technologie, dokončení, přípojky a práce na pozemku a vyžádejte si srovnatelný výkaz rozsahu.`,
      };
    }
    return {
      badge: "Použitelný první rámec",
      kicker: "Jak výsledek číst",
      headline: "Výsledek je vhodný pro první kontrolu záměru",
      text: `Středový odhad ${money(result.totalCost)} používejte jako rozpočtový rámec, ne jako nabídku. Dalším krokem je ověřit rozsah fáze „${labels.stage[v.completionStage]}“, cenu přípojek a položky, které nejsou součástí sazby za m².`,
    };
  }

  function renderBreakdown(result) {
    const list = $("breakdownList");
    if (!list) return;
    while (list.firstChild) list.removeChild(list.firstChild);

    const v = result.values;
    const rows = [
      ["Stavební dodávka domu", result.buildCost, `${labels.stage[v.completionStage]} · ${result.rateSource}`],
      ["Projekt, průzkumy a inženýring", v.projectCost, "samostatná přípravná položka"],
      ["Přípojky a napojení", v.connectionsCost, "podle konkrétního pozemku a sítí"],
      ["Garáž nebo přístřešek", result.garageCost, v.garage === "custom" ? "vlastní zadaná částka" : "modelová položka"],
      ["Venkovní úpravy", v.exteriorCost, "okolí domu bez ceny pozemku"],
      ["Vybavení mimo dodávku", v.extraEquipment, "nepovinná položka"],
      ["Rozpočtová rezerva", result.reserveCost, `${number(v.reserveRate)} % ze zahrnutých nákladů`],
    ].filter((row) => row[1] > 0 || row[0] === "Stavební dodávka domu" || row[0] === "Rozpočtová rezerva");

    rows.forEach(([name, value, note]) => {
      const row = doc.createElement("div");
      row.className = "house-breakdown-row";
      const label = doc.createElement("span");
      label.textContent = name;
      const amount = doc.createElement("b");
      amount.textContent = money(value);
      const small = doc.createElement("small");
      small.textContent = note;
      row.append(label, amount, small);
      list.appendChild(row);
    });
  }

  function renderBudget(result) {
    const box = $("budgetCheck");
    if (!box) return;
    box.classList.remove("is-positive", "is-negative");
    if (result.budgetDifference === null) {
      setText("budgetDifference", "Rozpočet nebyl zadán");
      setText("budgetMessage", "Zadejte volitelný rozpočet a kalkulačka ukáže finanční polštář nebo chybějící částku.");
      return;
    }
    if (result.budgetDifference >= 0) {
      box.classList.add("is-positive");
      setText("budgetDifference", `Zbývá ${money(result.budgetDifference)}`);
      setText("budgetMessage", "Částka je rozdíl mezi vaším limitem a středovým odhadem. Ověřte, zda limit zahrnuje pozemek, financování a vybavení po nastěhování.");
    } else {
      box.classList.add("is-negative");
      setText("budgetDifference", `Chybí ${money(Math.abs(result.budgetDifference))}`);
      setText("budgetMessage", "Nesnižujte pouze rezervu. Porovnejte menší plochu, jinou fázi, standard a vedlejší položky.");
    }
  }

  function updateHero(result) {
    const total = Math.max(result.totalCost, 1);
    setText("heroTotal", compactMoney(result.totalCost));
    setText("heroStage", labels.stage[result.values.completionStage]);
    setText("heroRange", `${compactMoney(result.rangeLow)} až ${compactMoney(result.rangeHigh)}`);
    setText("heroBuild", compactMoney(result.buildCost));
    setText("heroUnit", `${money(result.effectiveRate)}/m²`);
    setText("heroReserve", compactMoney(result.reserveCost));
    const buildBar = $("heroBuildBar");
    const otherBar = $("heroOtherBar");
    if (buildBar) buildBar.style.width = `${clamp((result.buildCost / total) * 100, 4, 100)}%`;
    if (otherBar) otherBar.style.width = `${clamp(((result.otherWithoutReserve + result.reserveCost) / total) * 100, 4, 100)}%`;
  }

  function render() {
    const values = currentMode === "advanced" ? collectAdvanced() : collectBasic();
    const errors = validate(values);
    setText("formStatus", errors.join(" "));
    if (errors.length) return null;

    const result = calculate(values, currentMode);
    const decision = interpretation(result);
    lastResult = result;

    setText("resultModeLabel", currentMode === "advanced" ? "Rozšířený rozpočet" : "Rychlý odhad");
    setText("totalCost", money(result.totalCost));
    setText("resultRange", `Pracovní interval: ${money(result.rangeLow)} až ${money(result.rangeHigh)}`);
    setText("resultSummary", `Stavební dodávka tvoří ${number((result.buildCost / Math.max(result.totalCost, 1)) * 100)} % celkového rámce. Zbytek připadá na zadané vedlejší náklady a rezervu.`);
    setText("buildCost", money(result.buildCost));
    setText("pricePerM2", money(result.effectiveRate));
    setText("otherCosts", money(result.otherWithoutReserve));
    setText("reserveCost", money(result.reserveCost));
    setText("stageLabel", labels.stage[values.completionStage]);
    setText("reserveLabel", `${number(values.reserveRate)} %`);
    setText("budgetBadge", decision.badge);
    setText("decisionKicker", decision.kicker);
    setText("decisionHeadline", decision.headline);
    setText("decisionText", decision.text);
    setText("scenarioLow", money(result.scenarioLow));
    setText("scenarioCurrent", money(result.totalCost));
    setText("scenarioHigh", money(result.scenarioHigh));
    renderBudget(result);
    renderBreakdown(result);
    updateHero(result);
    return result;
  }

  function setMode(mode, options = {}) {
    currentMode = mode === "advanced" ? "advanced" : "basic";
    root.dataset.calculatorMode = currentMode;
    doc.querySelectorAll(".house-mode-btn").forEach((button) => {
      const active = button.dataset.mode === currentMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const advanced = $("advancedCalculation");
    if (advanced) advanced.hidden = currentMode !== "advanced";
    setText("formTitle", currentMode === "advanced" ? "Zpřesněte rozpočet domu" : "Začněte rychlým odhadem");
    setText("formLead", currentMode === "advanced"
      ? "Čtyři základní údaje zůstávají nahoře. Rozšířený režim pod nimi přidává pouze tři jasné kroky."
      : "Základní režim vyžaduje jen údaje, které bývají známé už na začátku. Výsledek se přepočítává automaticky.");
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
    let hasValues = false;
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
      hasValues = true;
    });
    setMode(params.get("rezim") === "advanced" ? "advanced" : "basic", { render: false });
    if (hasValues && currentMode === "advanced") setAdvancedStep(0);
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
      "Orientační cena stavby domu – RychléVýpočty.cz",
      `Režim: ${r.mode === "advanced" ? "rozšířený" : "rychlý"}`,
      `Dům: ${labels.houseType[r.values.houseType]}, ${labels.stage[r.values.completionStage]}, ${labels.standard[r.values.buildStandard]}`,
      `Užitná plocha: ${number(r.values.usableArea)} m²`,
      `Stavební dodávka: ${money(r.buildCost)}`,
      `Cena stavební dodávky za m²: ${money(r.effectiveRate)}`,
      `Náklady mimo hlavní dodávku: ${money(r.otherWithoutReserve)}`,
      `Rezerva: ${money(r.reserveCost)} (${number(r.values.reserveRate)} %)`,
      `Celkový rozpočtový rámec: ${money(r.totalCost)}`,
      `Pracovní interval: ${money(r.rangeLow)} až ${money(r.rangeHigh)}`,
      "Výsledek je orientační a nenahrazuje položkový rozpočet ani závaznou nabídku.",
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

  doc.querySelectorAll(".house-mode-btn").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  doc.querySelectorAll(".house-step-btn").forEach((button) => button.addEventListener("click", () => setAdvancedStep(Number(button.dataset.advancedStep))));
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
