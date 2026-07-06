(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const form = $("targetProfitForm");
  if (!form) return;

  const fields = {
    fixedCosts: $("fixedCosts"),
    targetProfit: $("targetProfit"),
    currentTurnover: $("currentTurnover"),
    contributionMargin: $("contributionMargin"),
    averageOrderValue: $("averageOrderValue"),
    unitPrice: $("unitPrice"),
    variableCostPerUnit: $("variableCostPerUnit"),
    workdays: $("workdays"),
    periodLabel: $("periodLabel"),
    unitLabel: $("unitLabel")
  };
  let mode = "margin";

  const presets = {
    eshop: { fixedCosts: 180000, targetProfit: 120000, currentTurnover: 720000, contributionMargin: 32, averageOrderValue: 1450, unitPrice: 1450, variableCostPerUnit: 986, workdays: 22, periodLabel: "měsíc", unitLabel: "objednávek", mode: "margin" },
    service: { fixedCosts: 120000, targetProfit: 100000, currentTurnover: 380000, contributionMargin: 0, averageOrderValue: 0, unitPrice: 25000, variableCostPerUnit: 5500, workdays: 20, periodLabel: "měsíc", unitLabel: "zakázek", mode: "unit" },
    gastro: { fixedCosts: 260000, targetProfit: 90000, currentTurnover: 780000, contributionMargin: 38, averageOrderValue: 310, unitPrice: 310, variableCostPerUnit: 192.2, workdays: 26, periodLabel: "měsíc", unitLabel: "objednávek", mode: "margin" },
    b2b: { fixedCosts: 420000, targetProfit: 250000, currentTurnover: 1550000, contributionMargin: 0, averageOrderValue: 0, unitPrice: 85000, variableCostPerUnit: 29000, workdays: 21, periodLabel: "měsíc", unitLabel: "zakázek", mode: "unit" }
  };

  const moneyFormat = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
  const integerFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const decimalFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const money = value => moneyFormat.format(Number.isFinite(value) ? value : 0);
  const number = value => integerFormat.format(Number.isFinite(value) ? value : 0);
  const percent = value => `${decimalFormat.format(Number.isFinite(value) ? value : 0)} %`;
  const signedMoney = value => `${value >= 0 ? "+" : "−"}${money(Math.abs(value))}`;

  function readValues() {
    return {
      fixedCosts: Number(fields.fixedCosts.value),
      targetProfit: Number(fields.targetProfit.value),
      currentTurnover: Number(fields.currentTurnover.value),
      contributionMargin: Number(fields.contributionMargin.value),
      averageOrderValue: Number(fields.averageOrderValue.value),
      unitPrice: Number(fields.unitPrice.value),
      variableCostPerUnit: Number(fields.variableCostPerUnit.value),
      workdays: Number(fields.workdays.value),
      periodLabel: fields.periodLabel.value,
      unitLabel: fields.unitLabel.value
    };
  }

  function validate(v) {
    const common = [v.fixedCosts, v.targetProfit, v.currentTurnover, v.workdays];
    if (common.some(value => !Number.isFinite(value))) return "Vyplňte prosím všechna základní číselná pole.";
    if (common.some(value => value < 0)) return "Náklady, zisk ani současný obrat nemohou být záporné.";
    if (v.fixedCosts + v.targetProfit <= 0) return "Zadejte fixní náklady nebo cílový zisk vyšší než nula.";
    if (v.workdays <= 0 || !Number.isInteger(v.workdays)) return "Počet prodejních dnů musí být kladné celé číslo.";
    if (mode === "margin") {
      if (!Number.isFinite(v.contributionMargin) || v.contributionMargin <= 0 || v.contributionMargin > 100) return "Příspěvková marže musí být vyšší než 0 % a nejvýše 100 %.";
      if (!Number.isFinite(v.averageOrderValue) || v.averageOrderValue < 0) return "Průměrná hodnota objednávky nemůže být záporná.";
    } else {
      if (![v.unitPrice, v.variableCostPerUnit].every(Number.isFinite)) return "Vyplňte cenu a variabilní náklad na jednotku.";
      if (v.unitPrice <= 0) return "Prodejní cena musí být vyšší než nula.";
      if (v.variableCostPerUnit < 0) return "Variabilní náklad nemůže být záporný.";
      if (v.unitPrice <= v.variableCostPerUnit) return "Prodejní cena musí být vyšší než variabilní náklad. Jinak nelze cílového zisku dosáhnout růstem prodeje.";
    }
    return "";
  }

  function calculate(v, overrides = {}) {
    const source = { ...v, ...overrides };
    const marginRate = overrides.marginRate ?? (mode === "margin"
      ? source.contributionMargin / 100
      : (source.unitPrice - source.variableCostPerUnit) / source.unitPrice);
    const unitValue = mode === "unit" ? source.unitPrice : source.averageOrderValue;
    const contributionPerUnit = unitValue > 0 ? unitValue * marginRate : 0;
    const requiredContribution = source.fixedCosts + source.targetProfit;
    const requiredTurnover = requiredContribution / marginRate;
    const breakEvenTurnover = source.fixedCosts / marginRate;
    const requiredUnits = contributionPerUnit > 0 ? Math.ceil(requiredContribution / contributionPerUnit) : null;
    const breakEvenUnits = contributionPerUnit > 0 ? Math.ceil(source.fixedCosts / contributionPerUnit) : null;
    const gap = requiredTurnover - source.currentTurnover;
    const growthRate = source.currentTurnover > 0 ? gap / source.currentTurnover * 100 : null;
    const currentProfit = source.currentTurnover * marginRate - source.fixedCosts;
    const progress = requiredTurnover > 0 ? source.currentTurnover / requiredTurnover * 100 : 0;
    const dailyTarget = requiredTurnover / source.workdays;
    const dailyUnits = requiredUnits !== null ? Math.ceil(requiredUnits / source.workdays) : null;
    const variableShare = 100 - marginRate * 100;
    return { marginRate, unitValue, contributionPerUnit, requiredContribution, requiredTurnover, breakEvenTurnover, requiredUnits, breakEvenUnits, gap, growthRate, currentProfit, progress, dailyTarget, dailyUnits, variableShare };
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function clearInvalid(message) {
    const error = $("targetProfitError");
    error.textContent = message;
    error.hidden = false;
    ["requiredTurnover", "requiredUnits", "turnoverGap", "dailyTarget", "currentProfitResult"].forEach(id => setText(id, "—"));
    setText("resultBadge", "Opravte zadání");
    $("resultBadge").className = "target-profit-status is-danger";
    setText("decisionHeadline", "Výpočet nelze dokončit");
    setText("decisionText", message);
    setText("nextStepText", "Upravte označené hodnoty a kalkulačka se ihned přepočítá.");
    $("targetDecision").className = "target-profit-decision is-danger";
    $("targetProgressBar").style.width = "0%";
    $("heroTargetBar").style.width = "0%";
    $("scenarioList").replaceChildren();
  }

  function decisionFor(v, r) {
    if (v.currentTurnover <= 0) return { type: "neutral", badge: "Cíl je spočítán", headline: "Doplňte současný obrat pro srovnání", text: `Pro cílový zisk potřebujete obrat ${money(r.requiredTurnover)} za ${v.periodLabel}.`, next: "Další krok: porovnejte cíl s reálným obratem stejného období." };
    if (r.gap <= 0) return { type: "success", badge: "Cíl je splněný", headline: `Nad cílem jste o ${money(Math.abs(r.gap))}`, text: `Současný obrat podle zadané marže vytváří odhadovaný zisk ${money(r.currentProfit)}.`, next: "Další krok: ověřte, zda marže zahrnuje všechny variabilní náklady a vratky." };
    if (v.currentTurnover >= r.breakEvenTurnover) return { type: "warning", badge: "V zisku, ale pod cílem", headline: `Do cíle chybí ${money(r.gap)}`, text: `Současný obrat už překročil bod zvratu. K požadovanému zisku je potřeba růst o ${percent(Math.max(0, r.growthRate || 0))}.`, next: "Další krok: rozdělte chybějící obrat mezi cenu, počet objednávek a konverzi." };
    return { type: "danger", badge: "Pod bodem zvratu", headline: `Nejdřív chybí ${money(r.breakEvenTurnover - v.currentTurnover)} k nule`, text: `Současný obrat vytváří odhadovaný výsledek ${money(r.currentProfit)}. Cílový zisk je zatím druhý krok.`, next: "Další krok: nejprve stabilizujte marži a dosažení bodu zvratu." };
  }

  function renderDecision(v, r) {
    const state = decisionFor(v, r);
    setText("resultBadge", state.badge);
    $("resultBadge").className = `target-profit-status${state.type === "danger" ? " is-danger" : state.type === "warning" ? " is-warning" : state.type === "success" ? " is-success" : ""}`;
    setText("decisionHeadline", state.headline);
    setText("decisionText", state.text);
    setText("nextStepText", state.next);
    $("targetDecision").className = `target-profit-decision${state.type === "danger" ? " is-danger" : state.type === "warning" ? " is-warning" : state.type === "success" ? " is-success" : ""}`;
    return state;
  }

  function renderPlan(v, r) {
    const target = Math.max(r.requiredTurnover, v.currentTurnover, 1);
    const breakWidth = Math.min(100, r.breakEvenTurnover / target * 100);
    const currentWidth = Math.min(100, v.currentTurnover / target * 100);
    $("targetProgressBar").style.width = `${Math.min(100, r.progress)}%`;
    $("targetBreakMarker").style.left = `${breakWidth}%`;
    $("targetCurrentMarker").style.left = `${currentWidth}%`;
    setText("progressLabel", `${percent(Math.min(100, r.progress))} cíle`);
    setText("planBreakEven", money(r.breakEvenTurnover));
    setText("planCurrent", money(v.currentTurnover));
    setText("planTarget", money(r.requiredTurnover));
    setText("heroTargetValue", money(r.requiredTurnover));
    setText("heroCurrentValue", money(v.currentTurnover));
    setText("heroGapValue", r.gap > 0 ? money(r.gap) : `náskok ${money(Math.abs(r.gap))}`);
    setText("heroDailyValue", money(r.dailyTarget));
    $("heroTargetBar").style.width = `${Math.min(100, r.progress)}%`;
    $("heroBreakMarker").style.left = `${Math.min(100, r.breakEvenTurnover / r.requiredTurnover * 100)}%`;
  }

  function renderScenarios(v, r) {
    const basePoints = r.marginRate * 100;
    const candidates = [
      ["Marže +5 bodů", { marginRate: Math.min(1, r.marginRate + .05) }],
      ["Marže −5 bodů", { marginRate: Math.max(.001, r.marginRate - .05) }],
      ["Fixní náklady +10 %", { fixedCosts: v.fixedCosts * 1.1 }],
      ["Cílový zisk +20 %", { targetProfit: v.targetProfit * 1.2 }]
    ];
    const fragment = document.createDocumentFragment();
    candidates.forEach(([label, overrides]) => {
      const scenario = calculate(v, overrides);
      const difference = scenario.requiredTurnover - r.requiredTurnover;
      const card = document.createElement("div");
      card.className = "target-scenario-card";
      card.innerHTML = `<span>${label}</span><strong>${money(scenario.requiredTurnover)}</strong><small>${difference === 0 ? "beze změny" : `${signedMoney(difference)} proti základu`}</small>`;
      fragment.appendChild(card);
    });
    $("scenarioList").replaceChildren(fragment);
    setText("scenarioBaseMargin", percent(basePoints));
  }

  function render(options = {}) {
    const v = readValues();
    const error = validate(v);
    if (error) {
      clearInvalid(error);
      return false;
    }
    $("targetProfitError").hidden = true;
    const r = calculate(v);
    setText("requiredTurnover", money(r.requiredTurnover));
    setText("requiredContribution", money(r.requiredContribution));
    setText("requiredUnits", r.requiredUnits === null ? "Doplňte hodnotu objednávky" : `${number(r.requiredUnits)} ${v.unitLabel}`);
    setText("turnoverGap", r.gap > 0 ? money(r.gap) : `Náskok ${money(Math.abs(r.gap))}`);
    setText("dailyTarget", `${money(r.dailyTarget)} / den`);
    setText("dailyUnits", r.dailyUnits === null ? "—" : `${number(r.dailyUnits)} ${v.unitLabel} / den`);
    setText("contributionMarginResult", percent(r.marginRate * 100));
    setText("contributionPerUnitResult", r.contributionPerUnit > 0 ? money(r.contributionPerUnit) : "—");
    setText("breakEvenTurnoverResult", money(r.breakEvenTurnover));
    setText("currentProfitResult", money(r.currentProfit));
    setText("growthRateResult", r.growthRate === null ? "Bez srovnání" : r.gap <= 0 ? "Cíl splněn" : percent(r.growthRate));
    setText("variableShareResult", percent(r.variableShare));
    setText("periodResult", `za ${v.periodLabel}`);
    setText("formulaMargin", percent(r.marginRate * 100));
    const state = renderDecision(v, r);
    renderPlan(v, r);
    renderScenarios(v, r);
    setText("resultSentence", `Pro zisk ${money(v.targetProfit)} při marži ${percent(r.marginRate * 100)} potřebujete obrat alespoň ${money(r.requiredTurnover)} za ${v.periodLabel}.`);
    setText("heroState", state.badge);
    if (options.scroll && window.matchMedia("(max-width: 720px)").matches) $("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  function setMode(nextMode) {
    mode = nextMode;
    form.dataset.mode = mode;
    $("marginFields").hidden = mode !== "margin";
    $("unitFields").hidden = mode !== "unit";
    document.querySelectorAll("[data-profit-mode]").forEach(button => {
      const active = button.dataset.profitMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    render();
  }

  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    Object.entries(preset).forEach(([key, value]) => {
      if (key !== "mode" && fields[key]) fields[key].value = value;
    });
    document.querySelectorAll("[data-profit-preset]").forEach(button => button.classList.toggle("is-active", button.dataset.profitPreset === name));
    setMode(preset.mode);
  }

  form.addEventListener("submit", event => { event.preventDefault(); render({ scroll: true }); });
  Object.values(fields).forEach(field => {
    field.addEventListener("input", () => render());
    field.addEventListener("change", () => render());
  });
  document.querySelectorAll("[data-profit-mode]").forEach(button => button.addEventListener("click", () => setMode(button.dataset.profitMode)));
  document.querySelectorAll("[data-profit-preset]").forEach(button => button.addEventListener("click", () => applyPreset(button.dataset.profitPreset)));
  $("resetBtn").addEventListener("click", () => applyPreset("eshop"));
  applyPreset("eshop");
})();
