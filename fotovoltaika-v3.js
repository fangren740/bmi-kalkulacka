(function (global) {
  "use strict";

  const DEFAULTS = Object.freeze({
    mode: "basic",
    systemPrice: 350000,
    supportAmount: 0,
    systemPower: 6,
    annualConsumption: 5000,
    yieldPerKwp: 1000,
    electricityPrice: 6.5,
    selfConsumption: 70,
    exportPrice: 1.5,
    annualService: 2500,
    degradation: 0.5,
    electricityGrowth: 2,
    analysisYears: 25,
    inverterYear: 15,
    inverterCost: 45000,
    batteryYear: 0,
    batteryCost: 100000,
    discountRate: 3
  });

  const FIELD_RULES = Object.freeze({
    systemPrice: { min: 0, max: 10000000, digits: 0 },
    supportAmount: { min: 0, max: 10000000, digits: 0 },
    systemPower: { min: 0.1, max: 100, digits: 1 },
    annualConsumption: { min: 1, max: 1000000, digits: 0 },
    yieldPerKwp: { min: 100, max: 2000, digits: 0 },
    electricityPrice: { min: 0, max: 100, digits: 2 },
    selfConsumption: { min: 0, max: 100, digits: 1 },
    exportPrice: { min: 0, max: 100, digits: 2 },
    annualService: { min: 0, max: 1000000, digits: 0 },
    degradation: { min: 0, max: 5, digits: 2 },
    electricityGrowth: { min: -20, max: 20, digits: 2 },
    inverterCost: { min: 0, max: 2000000, digits: 0 },
    batteryCost: { min: 0, max: 5000000, digits: 0 },
    discountRate: { min: 0, max: 30, digits: 2 }
  });

  const URL_MAP = Object.freeze({
    systemPrice: "cena",
    supportAmount: "podpora",
    systemPower: "vykon",
    annualConsumption: "spotreba",
    yieldPerKwp: "vynos",
    electricityPrice: "elektrina",
    selfConsumption: "vlastni",
    exportPrice: "pretok",
    annualService: "servis",
    degradation: "degradace",
    electricityGrowth: "rust",
    analysisYears: "horizont",
    inverterYear: "stridacRok",
    inverterCost: "stridacCena",
    batteryYear: "baterieRok",
    batteryCost: "baterieCena",
    discountRate: "diskont"
  });

  function parseLocaleNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
    const normalized = String(value ?? "")
      .trim()
      .replace(/[\s\u00A0\u202F']/g, "")
      .replace(",", ".");
    if (normalized === "" || !/^-?\d*(?:\.\d*)?$/.test(normalized)) return NaN;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : NaN;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function valuesFromSearch(search) {
    const params = new URLSearchParams(String(search || "").replace(/^\?/, ""));
    const values = {};
    Object.entries(URL_MAP).forEach(([id, key]) => {
      if (!params.has(key)) return;
      const value = parseLocaleNumber(params.get(key));
      if (Number.isFinite(value)) values[id] = value;
    });
    values.mode = params.get("rezim") === "advanced" ? "advanced" : "basic";
    return values;
  }

  function searchFromValues(values, mode) {
    const params = new URLSearchParams();
    Object.entries(URL_MAP).forEach(([id, key]) => {
      const value = Number(values[id]);
      if (Number.isFinite(value)) params.set(key, String(value));
    });
    params.set("rezim", mode === "advanced" ? "advanced" : "basic");
    return params.toString();
  }

  function normaliseInput(raw) {
    return {
      systemPrice: Math.max(0, Number(raw.systemPrice) || 0),
      supportAmount: Math.max(0, Number(raw.supportAmount) || 0),
      systemPower: Math.max(0, Number(raw.systemPower) || 0),
      annualConsumption: Math.max(0, Number(raw.annualConsumption) || 0),
      yieldPerKwp: Math.max(0, Number(raw.yieldPerKwp) || 0),
      electricityPrice: Math.max(0, Number(raw.electricityPrice) || 0),
      selfConsumption: clamp(Number(raw.selfConsumption) || 0, 0, 100),
      exportPrice: Math.max(0, Number(raw.exportPrice) || 0),
      annualService: Math.max(0, Number(raw.annualService) || 0),
      degradation: clamp(Number(raw.degradation) || 0, 0, 100),
      electricityGrowth: Number(raw.electricityGrowth) || 0,
      analysisYears: Math.max(1, Math.round(Number(raw.analysisYears) || 1)),
      inverterYear: Math.max(0, Math.round(Number(raw.inverterYear) || 0)),
      inverterCost: Math.max(0, Number(raw.inverterCost) || 0),
      batteryYear: Math.max(0, Math.round(Number(raw.batteryYear) || 0)),
      batteryCost: Math.max(0, Number(raw.batteryCost) || 0),
      discountRate: Math.max(0, Number(raw.discountRate) || 0)
    };
  }

  function calculate(rawInput) {
    const v = normaliseInput(rawInput);
    const netInvestment = Math.max(v.systemPrice - Math.min(v.supportAmount, v.systemPrice), 0);
    const firstYearProduction = v.systemPower * v.yieldPerKwp;
    const annualRows = [];
    const cumulative = [-netInvestment];
    let running = -netInvestment;
    let npv = -netInvestment;

    for (let year = 1; year <= v.analysisYears; year += 1) {
      const productionFactor = Math.pow(1 - v.degradation / 100, year - 1);
      const production = firstYearProduction * productionFactor;
      const selfUsePotential = production * (v.selfConsumption / 100);
      const selfUse = Math.min(selfUsePotential, v.annualConsumption);
      const exports = Math.max(production - selfUse, 0);
      const electricityPrice = v.electricityPrice * Math.pow(1 + v.electricityGrowth / 100, year - 1);
      const selfUseValue = selfUse * electricityPrice;
      const exportValue = exports * v.exportPrice;
      const replacementCost = (v.inverterYear === year ? v.inverterCost : 0) + (v.batteryYear === year ? v.batteryCost : 0);
      const cashFlow = selfUseValue + exportValue - v.annualService - replacementCost;
      running += cashFlow;
      cumulative.push(running);
      npv += cashFlow / Math.pow(1 + v.discountRate / 100, year);
      annualRows.push({
        year,
        production,
        selfUse,
        exports,
        electricityPrice,
        selfUseValue,
        exportValue,
        replacementCost,
        cashFlow,
        cumulative: running
      });
    }

    let paybackYears = Infinity;
    if (netInvestment === 0) {
      paybackYears = 0;
    } else {
      for (let index = 1; index < cumulative.length; index += 1) {
        const staysNonNegative = cumulative.slice(index).every((value) => value >= 0);
        if (cumulative[index] >= 0 && cumulative[index - 1] < 0 && staysNonNegative) {
          const yearCashFlow = annualRows[index - 1].cashFlow;
          const fraction = yearCashFlow > 0 ? Math.abs(cumulative[index - 1]) / yearCashFlow : 1;
          paybackYears = (index - 1) + clamp(fraction, 0, 1);
          break;
        }
      }
    }

    const first = annualRows[0] || {
      production: 0,
      selfUse: 0,
      exports: 0,
      selfUseValue: 0,
      exportValue: 0,
      cashFlow: 0
    };
    const totalCashFlow = annualRows.reduce((sum, row) => sum + row.cashFlow, 0);
    const netProfit = totalCashFlow - netInvestment;
    const selfConsumptionActual = first.production > 0 ? (first.selfUse / first.production) * 100 : 0;
    const selfSufficiency = v.annualConsumption > 0 ? Math.min((first.selfUse / v.annualConsumption) * 100, 100) : 0;
    const simplePayback = first.cashFlow > 0 ? netInvestment / first.cashFlow : Infinity;

    return {
      input: v,
      netInvestment,
      firstYearProduction,
      firstYearSelfUse: first.selfUse,
      firstYearExports: first.exports,
      firstYearSelfUseValue: first.selfUseValue,
      firstYearExportValue: first.exportValue,
      firstYearBenefit: first.cashFlow,
      selfConsumptionActual,
      selfSufficiency,
      simplePayback,
      paybackYears,
      totalCashFlow,
      netProfit,
      npv,
      annualRows,
      cumulative
    };
  }

  const api = Object.freeze({ DEFAULTS, FIELD_RULES, URL_MAP, parseLocaleNumber, valuesFromSearch, searchFromValues, calculate });
  if (global) global.RVSolarCalculator = api;
  if (typeof document === "undefined") return;

  const $ = (id) => document.getElementById(id);
  const form = $("solarForm");
  if (!form) return;

  const numberFormatters = new Map();
  function formatter(digits) {
    if (!numberFormatters.has(digits)) {
      numberFormatters.set(digits, new Intl.NumberFormat("cs-CZ", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits
      }));
    }
    return numberFormatters.get(digits);
  }
  const fmt = (value, digits = 0) => formatter(digits).format(Number.isFinite(value) ? value : 0);
  const czk = (value) => `${fmt(value, 0)} Kč`;
  const compactCzk = (value) => Math.abs(value) >= 1000000 ? `${fmt(value / 1000000, 1)} mil. Kč` : Math.abs(value) >= 10000 ? `${fmt(value / 1000, 1)} tis. Kč` : czk(value);
  const kwh = (value) => `${fmt(value, 0)} kWh`;
  const percent = (value, digits = 0) => `${fmt(value, digits)} %`;

  const numericFieldIds = Object.keys(FIELD_RULES);
  const selectFieldIds = ["analysisYears", "inverterYear", "batteryYear"];
  const modeButtons = Array.from(document.querySelectorAll(".mode-button"));
  const profileInputs = Array.from(document.querySelectorAll('input[name="profile"]'));
  let currentMode = "basic";

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function setFieldValue(id, value, format = true) {
    const element = $(id);
    if (!element) return;
    if (format && FIELD_RULES[id]) {
      element.value = fmt(Number(value), FIELD_RULES[id].digits);
    } else {
      element.value = String(value);
    }
  }

  function readField(id) {
    const element = $(id);
    return element ? parseLocaleNumber(element.value) : NaN;
  }

  function readValues() {
    const values = {};
    numericFieldIds.forEach((id) => { values[id] = readField(id); });
    selectFieldIds.forEach((id) => { values[id] = Number($(id).value); });
    return values;
  }

  function validate(values) {
    const errors = [];
    numericFieldIds.forEach((id) => {
      const rule = FIELD_RULES[id];
      const value = values[id];
      const label = form.querySelector(`label[for="${id}"] > span:first-child`);
      const name = label ? label.textContent.trim() : id;
      if (!Number.isFinite(value)) {
        errors.push(`${name}: zadejte platné číslo.`);
      } else if (value < rule.min || value > rule.max) {
        errors.push(`${name}: povolený rozsah je ${fmt(rule.min, rule.digits)} až ${fmt(rule.max, rule.digits)}.`);
      }
    });
    if (Number.isFinite(values.supportAmount) && Number.isFinite(values.systemPrice) && values.supportAmount > values.systemPrice) {
      errors.push("Ověřená přímá podpora nemůže být vyšší než celková cena systému.");
    }
    return errors;
  }

  function showValidation(errors) {
    const box = $("validationMessage");
    if (!box) return;
    if (!errors.length) {
      box.hidden = true;
      box.textContent = "";
      return;
    }
    box.hidden = false;
    box.textContent = errors.join(" ");
  }

  function paybackLabel(payback, horizon) {
    if (payback === 0) return "Ihned";
    if (!Number.isFinite(payback)) return `Více než ${horizon} let`;
    if (payback < 1) return "Méně než 1 rok";
    return `${fmt(payback, 1)} let`;
  }

  function verdict(result) {
    const horizon = result.input.analysisYears;
    if (result.netInvestment === 0) {
      return ["Čistá investice je nulová", "Zkontrolujte, zda zadaná přímá podpora skutečně odpovídá ceně a podmínkám projektu.", "Model počítá okamžitou návratnost, protože po odečtení podpory nezůstala počáteční investice."];
    }
    if (!Number.isFinite(result.paybackYears)) {
      return ["Investice se v horizontu nevrátí", `Kumulované cash-flow zůstává po ${horizon} letech záporné. Ověřte cenu systému, vlastní spotřebu a plánované výměny.`, "Výsledek není automaticky technické zamítnutí FVE, ale finanční scénář potřebuje zásadní kontrolu."];
    }
    if (result.paybackYears <= 10 && result.npv > 0) {
      return ["Silná ekonomika při zadaných předpokladech", `Model dosáhne trvalého bodu návratnosti přibližně za ${fmt(result.paybackYears, 1)} roku a NPV zůstává kladná.`, "Ověřte hlavně výrobu, vlastní spotřebu, rozsah nabídky a skutečný nárok na podporu."];
    }
    if (result.paybackYears <= 15) {
      return ["Rozumná návratnost, ale citlivá na vstupy", `Investice se podle modelu trvale vrátí přibližně za ${fmt(result.paybackYears, 1)} roku.`, "Porovnejte nulový růst ceny elektřiny a nižší vlastní spotřebu, abyste viděli konzervativní variantu."];
    }
    return ["Delší návratnost vyžaduje pečlivé porovnání", `Bod návratnosti vychází přibližně za ${fmt(result.paybackYears, 1)} roku.`, "Zvažte menší systém, jinou konfiguraci baterie, vyšší reálné využití výroby nebo cenově výhodnější nabídku."];
  }

  function renderHero(result, label) {
    const payback = document.querySelector("[data-hero-payback]");
    const benefit = document.querySelector("[data-hero-benefit]");
    const self = document.querySelector("[data-hero-self]");
    const status = document.querySelector("[data-hero-status]");
    if (payback) payback.textContent = label;
    if (benefit) benefit.textContent = compactCzk(result.firstYearBenefit);
    if (self) self.textContent = percent(result.selfSufficiency, 0);
    if (status) status.textContent = Number.isFinite(result.paybackYears) ? "trvalý bod návratnosti" : "mimo zvolený horizont";
  }

  function renderTable(result) {
    const tbody = $("summaryTableBody");
    if (!tbody) return;
    tbody.replaceChildren();
    const payback = paybackLabel(result.paybackYears, result.input.analysisYears);
    const rows = [
      ["Čistá investice", czk(result.netInvestment), "Cena systému po odečtení pouze ověřené přímé podpory"],
      ["Výroba v 1. roce", kwh(result.firstYearProduction), "Výkon FVE násobený výnosem na 1 kWp"],
      ["Vlastní využití", kwh(result.firstYearSelfUse), `${percent(result.selfConsumptionActual, 1)} výroby využité v domácnosti`],
      ["Přetoky", kwh(result.firstYearExports), "Nevyužitá výroba oceněná zadanou hodnotou přetoku"],
      ["Hodnota vlastní energie", czk(result.firstYearSelfUseValue), "Vlastní využití násobené cenou nahrazené elektřiny"],
      ["Hodnota přetoků", czk(result.firstYearExportValue), "Přetoky násobené zadanou smluvní hodnotou"],
      ["Přínos v 1. roce", czk(result.firstYearBenefit), "Vlastní energie + přetoky − roční servis"],
      ["Dynamická návratnost", payback, "První trvalý přechod kumulovaného cash-flow do plusu"],
      ["Čistý přínos", czk(result.netProfit), `Výsledek po ${result.input.analysisYears} letech, investici, servisu a výměnách`],
      ["NPV", czk(result.npv), `Čistá současná hodnota při diskontu ${percent(result.input.discountRate, 1)}`]
    ];
    rows.forEach((row) => {
      const tr = document.createElement("tr");
      row.forEach((value, index) => {
        const td = document.createElement("td");
        td.textContent = value;
        td.dataset.label = ["Položka", "Hodnota", "Význam"][index];
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  function milestoneYears(horizon) {
    const values = [0];
    for (let step = 1; step <= 5; step += 1) values.push(Math.round((horizon * step) / 5));
    return Array.from(new Set(values)).sort((a, b) => a - b);
  }

  function renderCashflow(result) {
    const chart = $("cashflowChart");
    if (!chart) return;
    chart.replaceChildren();
    const years = milestoneYears(result.input.analysisYears);
    const points = years.map((year) => ({ year, value: result.cumulative[year] ?? result.cumulative[result.cumulative.length - 1] }));
    const maxAbs = Math.max(...points.map((point) => Math.abs(point.value)), 1);
    points.forEach((point) => {
      const wrapper = document.createElement("div");
      wrapper.className = `cashflow-point${point.value < 0 ? " is-negative" : ""}`;
      const bar = document.createElement("i");
      bar.style.height = `${Math.max(6, (Math.abs(point.value) / maxAbs) * 76)}px`;
      const value = document.createElement("b");
      value.textContent = `${fmt(point.value / 1000, 0)} tis.`;
      value.title = czk(point.value);
      const year = document.createElement("span");
      year.textContent = point.year === 0 ? "Start" : `${point.year}. rok`;
      wrapper.append(bar, value, year);
      chart.appendChild(wrapper);
    });
    setText("breakEvenLabel", Number.isFinite(result.paybackYears) ? `Trvalý bod: ${fmt(result.paybackYears, 1)} roku` : `Bez návratnosti do ${result.input.analysisYears} let`);
  }

  function renderScenarios(values, baseResult) {
    const lowInput = { ...values, selfConsumption: clamp(values.selfConsumption - 10, 0, 100) };
    const highInput = { ...values, selfConsumption: clamp(values.selfConsumption + 10, 0, 100) };
    const low = calculate(lowInput);
    const high = calculate(highInput);
    setText("scenarioLow", paybackLabel(low.paybackYears, values.analysisYears));
    setText("scenarioBase", paybackLabel(baseResult.paybackYears, values.analysisYears));
    setText("scenarioHigh", paybackLabel(high.paybackYears, values.analysisYears));
    setText("scenarioLowNote", `${percent(lowInput.selfConsumption, 0)} vlastní spotřeby • ${czk(low.firstYearBenefit)} v 1. roce`);
    setText("scenarioBaseNote", `${percent(values.selfConsumption, 0)} vlastní spotřeby • ${czk(baseResult.firstYearBenefit)} v 1. roce`);
    setText("scenarioHighNote", `${percent(highInput.selfConsumption, 0)} vlastní spotřeby • ${czk(high.firstYearBenefit)} v 1. roce`);
  }

  function render() {
    const values = readValues();
    const errors = validate(values);
    showValidation(errors);
    if (errors.length) return null;

    const result = calculate(values);
    const label = paybackLabel(result.paybackYears, values.analysisYears);
    const [badge, summary, note] = verdict(result);
    setText("paybackYears", label);
    setText("statusBadge", badge);
    setText("netInvestment", czk(result.netInvestment));
    setText("firstYearBenefit", czk(result.firstYearBenefit));
    setText("netProfit", czk(result.netProfit));
    setText("npvValue", czk(result.npv));
    setText("solarVerdict", badge);
    setText("decisionSummary", summary);
    setText("interpretationNote", note);
    setText("annualProduction", kwh(result.firstYearProduction));
    setText("selfUseKwh", kwh(result.firstYearSelfUse));
    setText("exportKwh", kwh(result.firstYearExports));
    setText("selfSufficiency", percent(result.selfSufficiency, 1));
    setText("resultMode", currentMode === "advanced" ? "Rozšířený model" : "Základní model");

    const selfWidth = clamp(result.selfConsumptionActual, 0, 100);
    $("selfUseBar").style.width = `${selfWidth}%`;
    $("exportBar").style.width = `${100 - selfWidth}%`;
    renderHero(result, label);
    renderCashflow(result);
    renderScenarios(values, result);
    renderTable(result);
    return result;
  }

  function setMode(mode, options = {}) {
    currentMode = mode === "advanced" ? "advanced" : "basic";
    document.body.dataset.calculatorMode = currentMode;
    modeButtons.forEach((button) => {
      const active = button.dataset.mode === currentMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $("basicCalculation").hidden = currentMode === "advanced";
    $("advancedCalculation").hidden = currentMode !== "advanced";
    if (currentMode === "basic") {
      const currentSelf = readField("selfConsumption");
      const nearest = profileInputs.reduce((best, input) => {
        const difference = Math.abs(Number(input.value) - currentSelf);
        return difference < best.difference ? { input, difference } : best;
      }, { input: profileInputs[0], difference: Infinity });
      if (nearest.input && !profileInputs.some((input) => input.checked)) nearest.input.checked = true;
      if (nearest.input && options.syncProfile !== false) setFieldValue("selfConsumption", Number(nearest.input.value));
    }
    render();
  }

  function formatInput(id) {
    const value = readField(id);
    if (Number.isFinite(value)) setFieldValue(id, value);
  }

  function resetForm() {
    numericFieldIds.forEach((id) => setFieldValue(id, DEFAULTS[id]));
    selectFieldIds.forEach((id) => setFieldValue(id, DEFAULTS[id], false));
    profileInputs.forEach((input) => { input.checked = Number(input.value) === DEFAULTS.selfConsumption; });
    setText("copyStatus", "");
    setMode("basic", { syncProfile: false });
  }


  function loadFromUrl() {
    const params = new URLSearchParams(global.location.search);
    let hasValues = false;
    Object.entries(URL_MAP).forEach(([id, key]) => {
      if (!params.has(key)) return;
      const value = parseLocaleNumber(params.get(key));
      if (!Number.isFinite(value)) return;
      setFieldValue(id, value, false);
      hasValues = true;
    });
    const mode = params.get("rezim");
    const selfValue = readField("selfConsumption");
    profileInputs.forEach((input) => { input.checked = Number(input.value) === selfValue; });
    setMode(mode === "advanced" ? "advanced" : "basic", { syncProfile: !hasValues });
    numericFieldIds.forEach(formatInput);
  }

  function buildShareUrl() {
    const values = readValues();
    const errors = validate(values);
    if (errors.length) return null;
    const url = new URL(global.location.href);
    url.search = "";
    url.hash = "vysledek";
    Object.entries(URL_MAP).forEach(([id, key]) => {
      const value = id in values ? values[id] : Number($(id).value);
      url.searchParams.set(key, String(value));
    });
    url.searchParams.set("rezim", currentMode);
    return url.toString();
  }

  async function copyShareUrl() {
    const url = buildShareUrl();
    if (!url) {
      setText("copyStatus", "Nejdříve opravte vstupy.");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setText("copyStatus", "Odkaz zkopírován.");
    } catch (error) {
      const textarea = document.createElement("textarea");
      textarea.value = url;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand("copy");
      textarea.remove();
      setText("copyStatus", copied ? "Odkaz zkopírován." : "Kopírování se nepodařilo.");
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  numericFieldIds.forEach((id) => {
    const element = $(id);
    if (!element) return;
    element.addEventListener("input", render);
    element.addEventListener("change", render);
    element.addEventListener("blur", () => formatInput(id));
  });
  selectFieldIds.forEach((id) => {
    const element = $(id);
    if (element) element.addEventListener("change", render);
  });
  profileInputs.forEach((input) => {
    input.addEventListener("change", () => {
      if (!input.checked) return;
      setFieldValue("selfConsumption", Number(input.value));
      render();
    });
  });
  modeButtons.forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });
  $("selfConsumption").addEventListener("input", () => {
    const value = readField("selfConsumption");
    profileInputs.forEach((input) => { input.checked = Number(input.value) === value; });
  });
  $("resetBtn").addEventListener("click", resetForm);
  $("copyLinkBtn").addEventListener("click", copyShareUrl);

  loadFromUrl();
})(typeof window !== "undefined" ? window : globalThis);
