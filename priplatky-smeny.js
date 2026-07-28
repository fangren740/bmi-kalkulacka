(() => {
  "use strict";

  const doc = document;
  const root = doc.body;
  const form = doc.getElementById("shiftForm");
  if (!form) return;

  const $ = (id) => doc.getElementById(id);
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const numberFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
  const wholeMoneyFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const decimalMoneyFormat = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const LEGAL_DEFAULTS = {
    wage: { night: 10, weekend: 10, holiday: 100, overtime: 25 },
    salary: { night: 20, weekend: 25, holiday: 100, overtime: 25 },
    agreement: { night: 10, weekend: 10, holiday: 100, overtime: 0 },
  };

  const REGIME_LABELS = {
    wage: "mzda",
    salary: "plat",
    agreement: "DPP / DPČ",
  };

  const numericIds = [
    "hourlyRate", "averageEarnings", "shiftHours", "shiftCount", "nightHours", "weekendHours",
    "holidayHours", "overtimeHours", "breakMinutes", "nightPercent", "weekendPercent",
    "holidayPercent", "overtimePercent", "customPercent", "customFixedRate", "customHours",
    "paidBonus", "paidShiftCount",
  ];
  const selectableIds = [
    "payRegime", "holidayCompensation", "overtimeCompensation", "shiftDate", "shiftStart",
    "shiftEnd", "breakStart",
  ];
  const checkboxIds = ["includeNight", "includeWeekend", "includeHoliday", "includeOvertime", "roundWhole"];
  const allIds = [...numericIds, ...selectableIds, ...checkboxIds];

  const URL_MAP = {
    payRegime: "rezimOdm",
    hourlyRate: "sazba",
    averageEarnings: "prumer",
    shiftHours: "hodiny",
    shiftCount: "smeny",
    includeNight: "nocAno",
    nightHours: "nocH",
    includeWeekend: "vikendAno",
    weekendHours: "vikendH",
    includeHoliday: "svatekAno",
    holidayHours: "svatekH",
    includeOvertime: "prescasAno",
    overtimeHours: "prescasH",
    shiftDate: "datum",
    shiftStart: "zacatek",
    shiftEnd: "konec",
    breakStart: "pauzaOd",
    breakMinutes: "pauzaMin",
    nightPercent: "nocPct",
    weekendPercent: "vikendPct",
    holidayPercent: "svatekPct",
    overtimePercent: "prescasPct",
    holidayCompensation: "svatekForma",
    overtimeCompensation: "prescasForma",
    customPercent: "vlastniPct",
    customFixedRate: "vlastniKc",
    customHours: "vlastniH",
    paidBonus: "paskaPriplatky",
    paidShiftCount: "paskaSmeny",
    roundWhole: "celeKc",
  };

  const PRESETS = {
    night: { night: true, weekend: false, holiday: false, overtime: false, nightHours: 8, weekendHours: 0, holidayHours: 0, overtimeHours: 0 },
    weekendNight: { night: true, weekend: true, holiday: false, overtime: false, nightHours: 8, weekendHours: 8, holidayHours: 0, overtimeHours: 0 },
    holiday: { night: false, weekend: false, holiday: true, overtime: false, nightHours: 0, weekendHours: 0, holidayHours: 8, overtimeHours: 0 },
    overtimeNight: { night: true, weekend: false, holiday: false, overtime: true, nightHours: 8, weekendHours: 0, holidayHours: 0, overtimeHours: 2 },
  };

  let currentMode = "basic";
  let currentStep = 0;
  let lastResult = null;
  let ratesCustomized = false;
  const exactValues = new Map();

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
      min: input?.dataset.min === undefined ? -Infinity : parseLocalized(input.dataset.min),
      max: input?.dataset.max === undefined ? Infinity : parseLocalized(input.dataset.max),
    };
  }

  function readNumeric(id) {
    const input = $(id);
    if (!input) return 0;
    const { min, max } = limits(input);
    const value = exactValues.has(id) ? exactValues.get(id) : parseLocalized(input.value);
    return clamp(Number.isFinite(value) ? value : 0, min, max);
  }

  function formatInput(id) {
    const input = $(id);
    if (!input) return;
    const decimalIds = [
      "hourlyRate", "averageEarnings", "shiftHours", "nightHours", "weekendHours",
      "holidayHours", "overtimeHours", "customHours", "nightPercent", "weekendPercent",
      "holidayPercent", "overtimePercent", "customPercent", "customFixedRate", "paidBonus",
    ];
    const decimals = decimalIds.includes(id) ? 2 : 0;
    input.value = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: decimals }).format(readNumeric(id));
  }

  function setExactNumeric(id, value) {
    const input = $(id);
    if (!input || !Number.isFinite(value)) return;
    exactValues.set(id, value);
    input.value = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(value);
  }

  function selectValue(id, fallback = "") {
    const el = $(id);
    return el ? el.value : fallback;
  }

  function checked(id) {
    return Boolean($(id)?.checked);
  }

  function money(value, roundWhole = true) {
    const safe = Number.isFinite(value) ? value : 0;
    return `${(roundWhole ? wholeMoneyFormat : decimalMoneyFormat).format(safe)} Kč`;
  }

  function hours(value) {
    return `${numberFormat.format(Number.isFinite(value) ? value : 0)} h`;
  }

  function legalRates(regime) {
    return LEGAL_DEFAULTS[regime] || LEGAL_DEFAULTS.wage;
  }

  function applyRegimeDefaults(force = false) {
    if (ratesCustomized && !force) return;
    const regime = selectValue("payRegime", "wage");
    const defaults = legalRates(regime);
    $("nightPercent").value = defaults.night;
    $("weekendPercent").value = defaults.weekend;
    $("holidayPercent").value = defaults.holiday;
    $("overtimePercent").value = defaults.overtime;
    if (regime === "agreement") {
      $("includeOvertime").checked = false;
      $("overtimeHours").value = 0;
    }
    updateRegimeHints();
  }

  function updateRegimeHints() {
    const regime = selectValue("payRegime", "wage");
    const defaults = legalRates(regime);
    const overtimeToggle = $("includeOvertime");
    const overtimeCard = doc.querySelector('[data-bonus-card="overtime"]');
    if (overtimeToggle) overtimeToggle.disabled = regime === "agreement";
    if (overtimeCard) {
      overtimeCard.classList.toggle("is-unavailable", regime === "agreement");
      overtimeCard.setAttribute("aria-disabled", String(regime === "agreement"));
    }
    const nightText = regime === "salary"
      ? `Výchozí sazba pro plat: ${numberFormat.format(defaults.night)} % průměrného hodinového výdělku.`
      : `Výchozí sazba: ${numberFormat.format(defaults.night)} % průměrného výdělku; smluvně může být určena jinak.`;
    const weekendText = regime === "salary"
      ? `Výchozí sazba pro plat: ${numberFormat.format(defaults.weekend)} % průměrného hodinového výdělku.`
      : `Výchozí sazba: ${numberFormat.format(defaults.weekend)} % průměrného výdělku; smluvně může být určena jinak.`;
    const overtimeText = regime === "agreement"
      ? "U DPP a DPČ kalkulačka zákonný přesčasový příplatek automaticky nenastavuje."
      : regime === "salary"
        ? "Výchozí sazba pro plat: 25 %, ve dni nepřetržitého odpočinku 50 %."
        : "Výchozí sazba pro mzdu: 25 % průměrného výdělku.";
    setText("nightRateHint", nightText);
    setText("weekendRateHint", weekendText);
    setText("overtimeRateHint", overtimeText);

    const assumption = $("legalAssumption");
    if (assumption) {
      const strong = assumption.querySelector("strong");
      const p = assumption.querySelector("p");
      if (regime === "salary") {
        if (strong) strong.textContent = "Rychlý režim používá výchozí sazby pro plat:";
        if (p) p.textContent = "noční 20 %, víkend 25 %, přesčas 25 %. U přesčasu ve dni nepřetržitého odpočinku upravte sazbu na 50 %. Svátek je předvolen jako náhradní volno.";
      } else if (regime === "agreement") {
        if (strong) strong.textContent = "Rychlý režim používá výchozí sazby pro DPP / DPČ:";
        if (p) p.textContent = "noční 10 %, víkend 10 %, svátek s předvoleným náhradním volnem. Přesčasový příplatek není automaticky zapnutý; případný smluvní bonus zadejte v podrobném režimu.";
      } else {
        if (strong) strong.textContent = "Rychlý režim používá výchozí sazby pro mzdu:";
        if (p) p.textContent = "noční 10 %, víkend 10 %, přesčas 25 %. U svátku je předvoleno náhradní volno; peněžní příplatek lze zvolit v podrobném režimu.";
      }
    }
  }

  function collectInput(options = {}) {
    const regime = selectValue("payRegime", "wage");
    const defaults = legalRates(regime);
    const advanced = currentMode === "advanced";
    const rateSource = options.rateSource || "current";
    const factor = rateSource === "higher" ? 1.25 : 1;
    const useLegal = rateSource === "legal" || !advanced;
    const rate = (id, key) => (useLegal ? defaults[key] : readNumeric(id)) * factor;

    return {
      regime,
      hourlyRate: readNumeric("hourlyRate"),
      averageEarnings: readNumeric("averageEarnings") || readNumeric("hourlyRate"),
      shiftHours: readNumeric("shiftHours"),
      shiftCount: Math.max(1, Math.round(readNumeric("shiftCount"))),
      includeNight: checked("includeNight"),
      nightHours: checked("includeNight") ? readNumeric("nightHours") : 0,
      nightPercent: rate("nightPercent", "night"),
      includeWeekend: checked("includeWeekend"),
      weekendHours: checked("includeWeekend") ? readNumeric("weekendHours") : 0,
      weekendPercent: rate("weekendPercent", "weekend"),
      includeHoliday: checked("includeHoliday"),
      holidayHours: checked("includeHoliday") ? readNumeric("holidayHours") : 0,
      holidayPercent: rate("holidayPercent", "holiday"),
      includeOvertime: checked("includeOvertime") && regime !== "agreement",
      overtimeHours: checked("includeOvertime") && regime !== "agreement" ? readNumeric("overtimeHours") : 0,
      overtimePercent: rate("overtimePercent", "overtime"),
      holidayCompensation: advanced ? selectValue("holidayCompensation", "leave") : "leave",
      overtimeCompensation: advanced ? selectValue("overtimeCompensation", "pay") : "pay",
      customPercent: advanced ? readNumeric("customPercent") * factor : 0,
      customFixedRate: advanced ? readNumeric("customFixedRate") * factor : 0,
      customHours: advanced ? readNumeric("customHours") : 0,
      paidBonus: advanced ? readNumeric("paidBonus") : 0,
      paidShiftCount: advanced ? Math.max(1, Math.round(readNumeric("paidShiftCount"))) : Math.max(1, Math.round(readNumeric("shiftCount"))),
      roundWhole: checked("roundWhole"),
      rateSource,
    };
  }

  function validate(input) {
    const errors = [];
    if (input.hourlyRate <= 0) errors.push("Základní hodinová sazba musí být vyšší než nula.");
    if (input.averageEarnings <= 0) errors.push("Průměrný hodinový výdělek musí být vyšší než nula.");
    if (input.shiftHours <= 0 || input.shiftHours > 24) errors.push("Odpracovaná doba musí být mezi 0,25 a 24 hodinami.");
    [
      [input.nightHours, "Noční"], [input.weekendHours, "Víkendové"],
      [input.holidayHours, "Sváteční"], [input.overtimeHours, "Přesčasové"],
      [input.customHours, "Vlastní"],
    ].forEach(([value, label]) => {
      if (value > input.shiftHours + 0.001) errors.push(`${label} hodiny nemohou být vyšší než celková doba směny.`);
    });
    return errors;
  }

  function calculate(input) {
    const basePay = input.hourlyRate * input.shiftHours;
    const nightBonus = input.averageEarnings * input.nightHours * input.nightPercent / 100;
    const weekendBonus = input.averageEarnings * input.weekendHours * input.weekendPercent / 100;
    const holidayBonus = input.holidayCompensation === "pay"
      ? input.averageEarnings * input.holidayHours * input.holidayPercent / 100
      : 0;
    const overtimeBonus = input.overtimeCompensation === "pay"
      ? input.averageEarnings * input.overtimeHours * input.overtimePercent / 100
      : 0;
    const customPercentBonus = input.averageEarnings * input.customHours * input.customPercent / 100;
    const customFixedBonus = input.customFixedRate * input.customHours;
    const cashBonus = nightBonus + weekendBonus + holidayBonus + overtimeBonus + customPercentBonus + customFixedBonus;
    const totalPay = basePay + cashBonus;
    const effectiveHourly = input.shiftHours > 0 ? totalPay / input.shiftHours : 0;
    const timeoffHours = (input.holidayCompensation === "leave" ? input.holidayHours : 0)
      + (input.overtimeCompensation === "leave" ? input.overtimeHours : 0);
    const timeoffValue = input.averageEarnings * timeoffHours;
    const monthlyBonus = cashBonus * input.shiftCount;
    const monthlyTotal = totalPay * input.shiftCount;
    const payrollExpected = cashBonus * input.paidShiftCount;
    const payrollDifference = input.paidBonus > 0 ? input.paidBonus - payrollExpected : null;
    const activeCount = [input.nightHours, input.weekendHours, input.holidayHours, input.overtimeHours].filter((v) => v > 0).length + ((input.customHours > 0 && (input.customPercent > 0 || input.customFixedRate > 0)) ? 1 : 0);
    return {
      input, basePay, nightBonus, weekendBonus, holidayBonus, overtimeBonus, customPercentBonus,
      customFixedBonus, cashBonus, totalPay, effectiveHourly, timeoffHours, timeoffValue,
      monthlyBonus, monthlyTotal, payrollExpected, payrollDifference, activeCount,
    };
  }

  function bonusRows(result) {
    const { input } = result;
    const rows = [
      { name: "Základní odměna", value: result.basePay, note: `${numberFormat.format(input.shiftHours)} h × ${money(input.hourlyRate, input.roundWhole)} za hodinu`, total: false },
    ];
    if (input.nightHours > 0) rows.push({ name: "Noční práce", value: result.nightBonus, note: `${numberFormat.format(input.nightHours)} h × ${numberFormat.format(input.nightPercent)} % z průměrného výdělku`, total: false });
    if (input.weekendHours > 0) rows.push({ name: "Sobota a neděle", value: result.weekendBonus, note: `${numberFormat.format(input.weekendHours)} h × ${numberFormat.format(input.weekendPercent)} % z průměrného výdělku`, total: false });
    if (input.holidayHours > 0) rows.push({ name: "Práce ve svátek", value: result.holidayBonus, note: input.holidayCompensation === "leave" ? `${numberFormat.format(input.holidayHours)} h řešeno náhradním volnem` : `${numberFormat.format(input.holidayHours)} h × ${numberFormat.format(input.holidayPercent)} %`, total: false });
    if (input.overtimeHours > 0) rows.push({ name: "Práce přesčas", value: result.overtimeBonus, note: input.overtimeCompensation === "leave" ? `${numberFormat.format(input.overtimeHours)} h řešeno náhradním volnem` : `${numberFormat.format(input.overtimeHours)} h × ${numberFormat.format(input.overtimePercent)} %`, total: false });
    if (input.customHours > 0 && input.customPercent > 0) rows.push({ name: "Vlastní procentní příplatek", value: result.customPercentBonus, note: `${numberFormat.format(input.customHours)} h × ${numberFormat.format(input.customPercent)} %`, total: false });
    if (input.customHours > 0 && input.customFixedRate > 0) rows.push({ name: "Vlastní pevný příplatek", value: result.customFixedBonus, note: `${numberFormat.format(input.customHours)} h × ${money(input.customFixedRate, input.roundWhole)} za hodinu`, total: false });
    rows.push({ name: "Peněžní příplatky celkem", value: result.cashBonus, note: "Součet všech vyplacených příplatkových položek", total: true });
    rows.push({ name: "Celkem za směnu", value: result.totalPay, note: "Základní odměna a peněžní příplatky", total: true });
    return rows;
  }

  function renderBreakdown(result) {
    const list = $("breakdownList");
    if (!list) return;
    list.replaceChildren(...bonusRows(result).map((item) => {
      const row = doc.createElement("div");
      row.className = `shift-breakdown-row${item.total ? " is-total" : ""}`;
      const copy = doc.createElement("div");
      const strong = doc.createElement("strong");
      const small = doc.createElement("small");
      const amount = doc.createElement("b");
      strong.textContent = item.name;
      small.textContent = item.note;
      amount.textContent = money(item.value, result.input.roundWhole);
      copy.append(strong, small);
      row.append(copy, amount);
      return row;
    }));
  }

  function describeActive(input) {
    const labels = [];
    if (input.nightHours > 0) labels.push("noční");
    if (input.weekendHours > 0) labels.push("víkend");
    if (input.holidayHours > 0) labels.push("svátek");
    if (input.overtimeHours > 0) labels.push("přesčas");
    if (input.customHours > 0 && (input.customPercent > 0 || input.customFixedRate > 0)) labels.push("vlastní bonus");
    return labels.length ? labels.join(" + ") : "bez příplatkového režimu";
  }

  function renderPayroll(result) {
    const box = $("payrollCheck");
    if (!box) return;
    box.classList.remove("is-positive", "is-negative");
    if (result.payrollDifference === null) {
      setText("payrollDifference", "Částka z pásky nebyla zadána");
      setText("payrollMessage", "V podrobném režimu můžete porovnat vyplacené příplatky se stejným počtem směn.");
      return;
    }
    const diff = result.payrollDifference;
    if (Math.abs(diff) < 1) {
      box.classList.add("is-positive");
      setText("payrollDifference", "Model a páska se shodují");
      setText("payrollMessage", `Očekávané příplatky za ${result.input.paidShiftCount} směn jsou ${money(result.payrollExpected, result.input.roundWhole)}.`);
    } else if (diff > 0) {
      box.classList.add("is-positive");
      setText("payrollDifference", `Na pásce je o ${money(diff, result.input.roundWhole)} více`);
      setText("payrollMessage", "Rozdíl může tvořit vyšší interní sazba, další bonus nebo jiný počet příplatkových hodin.");
    } else {
      box.classList.add("is-negative");
      setText("payrollDifference", `Na pásce je o ${money(Math.abs(diff), result.input.roundWhole)} méně`);
      setText("payrollMessage", "Nejprve ověřte průměrný výdělek, hodiny, náhradní volno a smluvní sazby. Rozdíl není automaticky důkaz chyby.");
    }
  }

  function renderDecision(result) {
    const { input } = result;
    if (result.activeCount === 0) {
      setText("decisionKicker", "Bez příplatku");
      setText("decisionHeadline", "Výsledek obsahuje pouze základní odměnu");
      setText("decisionText", "Zapněte noční, víkendový, sváteční nebo přesčasový režim a zadejte skutečný počet hodin.");
      return;
    }
    if (result.timeoffHours > 0) {
      setText("decisionKicker", "Peněžní část a volno");
      setText("decisionHeadline", "Část nároku není okamžitě vyplaceným příplatkem");
      setText("decisionText", `K peněžním příplatkům ${money(result.cashBonus, input.roundWhole)} kalkulačka eviduje ${hours(result.timeoffHours)} náhradního volna. Na pásce proto nemusí být celá ekonomická hodnota vidět jako hotovost.`);
      return;
    }
    if (result.activeCount >= 2) {
      setText("decisionKicker", "Souběh příplatků");
      setText("decisionHeadline", "Každou příplatkovou položku kontrolujte samostatně");
      setText("decisionText", `Směna kombinuje ${describeActive(input)}. Peněžní příplatky činí ${money(result.cashBonus, input.roundWhole)} a neměly by být bez důvodu sloučeny do jedné nejasné sazby.`);
      return;
    }
    setText("decisionKicker", "Jednoduchý scénář");
    setText("decisionHeadline", "Zkontrolujte hlavně počet hodin a průměrný výdělek");
    setText("decisionText", `Při jediném příplatkovém režimu je nejčastějším zdrojem rozdílu jiný počet hodin nebo jiný průměrný hodinový výdělek než ${money(input.averageEarnings, input.roundWhole)}.`);
  }

  function setBar(id, ratio) {
    const el = $(id);
    if (!el) return;
    const width = clamp(Number.isFinite(ratio) ? ratio * 100 : 0, 0, 100);
    el.style.width = `${width}%`;
    const track = el.closest(".shift-map-track");
    track?.classList.toggle("is-active", width > 0.01 || track.classList.contains("is-base"));
  }

  function renderShiftMap(result) {
    const { input } = result;
    const total = Math.max(input.shiftHours, 0.01);
    setText("mapSummary", `${numberFormat.format(input.shiftHours)} h · ${describeActive(input)}`);
    setText("mapBaseValue", hours(input.shiftHours));
    setText("mapNightValue", hours(input.nightHours));
    setText("mapWeekendValue", hours(input.weekendHours));
    setText("mapHolidayValue", hours(input.holidayHours));
    setText("mapOvertimeValue", hours(input.overtimeHours));
    setBar("mapBaseFill", 1);
    setBar("mapNightFill", input.nightHours / total);
    setBar("mapWeekendFill", input.weekendHours / total);
    setBar("mapHolidayFill", input.holidayHours / total);
    setBar("mapOvertimeFill", input.overtimeHours / total);

    const heroBars = [
      ["heroBaseBar", 1],
      ["heroNightBar", input.nightHours / total],
      ["heroWeekendBar", input.weekendHours / total],
    ];
    heroBars.forEach(([id, ratio]) => {
      const el = $(id);
      if (el) el.style.setProperty("--fill", `${clamp(ratio * 100, 0, 100)}%`);
    });
  }

  function setConfidence(id, state, text) {
    const el = $(id);
    if (!el) return;
    el.classList.remove("is-warning", "is-strong");
    if (state) el.classList.add(state);
    const small = el.querySelector("small");
    if (small) small.textContent = text;
  }

  function renderConfidence(result) {
    const { input } = result;
    const sameRate = Math.abs(input.averageEarnings - input.hourlyRate) < 0.01;
    setConfidence(
      "confidenceAverage",
      sameRate ? "is-warning" : "is-strong",
      sameRate
        ? "Používáte stejnou hodnotu jako základní sazbu. Pro kontrolu pásky ověřte skutečný průměrný výdělek."
        : `Samostatně zadáno ${money(input.averageEarnings, input.roundWhole)} za hodinu.`
    );
    const usedAuto = currentMode === "advanced" && Boolean(selectValue("shiftDate")) && Boolean(selectValue("shiftStart")) && Boolean(selectValue("shiftEnd"));
    setConfidence(
      "confidenceHours",
      usedAuto ? "is-strong" : "is-warning",
      usedAuto
        ? "Časové rozdělení lze ověřit automatickým výpočtem po minutách."
        : "Hodiny jsou zadané ručně. Porovnejte je s evidencí pracovní doby."
    );
    setConfidence(
      "confidenceRates",
      ratesCustomized ? "is-strong" : "",
      ratesCustomized
        ? "Sazby jste upravili podle vlastních podkladů."
        : `Použity výchozí sazby pro režim ${REGIME_LABELS[input.regime]}.`
    );
  }

  function render(result) {
    lastResult = result;
    const { input } = result;
    const legalResult = calculate(collectInput({ rateSource: "legal" }));
    const higherResult = calculate(collectInput({ rateSource: "higher" }));

    setText("resultModeLabel", currentMode === "advanced" ? "Podrobná kontrola" : "Rychlý výpočet");
    setText("totalPay", money(result.totalPay, input.roundWhole));
    setText("cashBonusTotal", money(result.cashBonus, input.roundWhole));
    setText("basePay", money(result.basePay, input.roundWhole));
    setText("baseRateLabel", `${numberFormat.format(input.hourlyRate)} Kč × ${numberFormat.format(input.shiftHours)} h`);
    setText("effectiveHourly", money(result.effectiveHourly, input.roundWhole));
    setText("monthlyBonus", money(result.monthlyBonus, input.roundWhole));
    setText("monthlyShiftLabel", `${input.shiftCount} stejných směn`);
    setText("monthlyTotal", money(result.monthlyTotal, input.roundWhole));
    setText("statusBadge", result.activeCount ? `Souběh ${result.activeCount} režimů` : "Bez příplatku");
    setText("resultSummary", result.activeCount > 1
      ? `${describeActive(input)} se počítají jako oddělené položky podle vlastního počtu hodin.`
      : `${describeActive(input)} je vypočten ze zadaného průměrného hodinového výdělku.`);
    setText("timeoffHours", hours(result.timeoffHours));
    setText("timeoffValue", result.timeoffHours > 0
      ? `Orientační hodnota placeného volna při průměru ${money(input.averageEarnings, input.roundWhole)} za hodinu je ${money(result.timeoffValue, input.roundWhole)}.`
      : "V tomto scénáři není započtené náhradní volno.");
    setText("scenarioLegal", money(legalResult.totalPay, input.roundWhole));
    setText("scenarioCurrent", money(result.totalPay, input.roundWhole));
    setText("scenarioHigher", money(higherResult.totalPay, input.roundWhole));

    setText("heroTotal", money(result.totalPay, input.roundWhole));
    setText("heroBase", money(result.basePay, input.roundWhole));
    setText("heroBonus", money(result.cashBonus, input.roundWhole));
    setText("heroMonth", money(result.monthlyBonus, input.roundWhole));
    setText("heroSummary", `${numberFormat.format(input.shiftHours)} hodin, ${describeActive(input)} v režimu ${REGIME_LABELS[input.regime]}.`);

    renderBreakdown(result);
    renderPayroll(result);
    renderDecision(result);
    renderShiftMap(result);
    renderConfidence(result);
  }

  function run() {
    toggleCards();
    const input = collectInput();
    const errors = validate(input);
    setText("formStatus", errors.join(" "));
    if (errors.length) return null;
    const result = calculate(input);
    render(result);
    return result;
  }

  function toggleCards() {
    const map = { night: "includeNight", weekend: "includeWeekend", holiday: "includeHoliday", overtime: "includeOvertime" };
    Object.entries(map).forEach(([key, id]) => {
      const card = doc.querySelector(`[data-bonus-card="${key}"]`);
      const active = checked(id);
      card?.classList.toggle("is-active", active);
      card?.querySelectorAll("input[type='text']").forEach((input) => { input.disabled = !active; });
    });
  }

  function setMode(mode, options = {}) {
    currentMode = mode === "advanced" ? "advanced" : "basic";
    root.dataset.calculatorMode = currentMode;
    doc.querySelectorAll(".shift-mode-btn").forEach((button) => {
      const active = button.dataset.mode === currentMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const advanced = $("advancedCalculation");
    if (advanced) advanced.hidden = currentMode !== "advanced";
    setText("formTitle", currentMode === "advanced" ? "Zkontrolujte směnu do detailu" : "Spočítejte odměnu za jednu směnu");
    setText("formLead", currentMode === "advanced"
      ? "Základní vstupy zůstávají nahoře. Pod nimi rozložíte směnu podle času, upravíte sazby a porovnáte výsledek s páskou."
      : "Zvolte způsob odměňování, zadejte sazbu a označte skutečné noční, víkendové, sváteční nebo přesčasové hodiny.");
    if (options.render !== false) run();
  }

  function setAdvancedStep(index) {
    const stages = [...doc.querySelectorAll("[data-advanced-stage]")];
    const buttons = [...doc.querySelectorAll("[data-advanced-step]")];
    if (!stages.length) return;
    currentStep = clamp(Number(index) || 0, 0, stages.length - 1);
    stages.forEach((stage, i) => {
      const active = i === currentStep;
      stage.hidden = !active;
      stage.classList.toggle("is-active", active);
    });
    buttons.forEach((button, i) => button.classList.toggle("is-active", i === currentStep));
    const prev = $("advancedPrev");
    const next = $("advancedNext");
    if (prev) prev.disabled = currentStep === 0;
    if (next) {
      const isLast = currentStep === stages.length - 1;
      next.disabled = isLast;
      next.textContent = isLast ? "Všechny kroky hotové" : "Další krok →";
    }
    setText("advancedStepStatus", `Krok ${currentStep + 1} ze ${stages.length}`);
  }

  function timeToMinutes(value) {
    const match = /^(\d{1,2}):(\d{2})$/.exec(value || "");
    if (!match) return null;
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function easterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function czechHolidays(year) {
    const fixed = ["01-01", "05-01", "05-08", "07-05", "07-06", "09-28", "10-28", "11-17", "12-24", "12-25", "12-26"];
    const keys = new Set(fixed.map((md) => `${year}-${md}`));
    const easter = easterSunday(year);
    const goodFriday = new Date(easter); goodFriday.setDate(easter.getDate() - 2);
    const easterMonday = new Date(easter); easterMonday.setDate(easter.getDate() + 1);
    keys.add(dateKey(goodFriday));
    keys.add(dateKey(easterMonday));
    return keys;
  }

  function autoHours() {
    const dateValue = selectValue("shiftDate");
    const startMinutes = timeToMinutes(selectValue("shiftStart"));
    const endMinutes = timeToMinutes(selectValue("shiftEnd"));
    if (!dateValue || startMinutes === null || endMinutes === null) return null;
    const [year, month, day] = dateValue.split("-").map(Number);
    const start = new Date(year, month - 1, day, Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
    const end = new Date(year, month - 1, day, Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
    if (end <= start) end.setDate(end.getDate() + 1);
    if ((end - start) / 3600000 > 24) return null;

    let breakStartDate = null;
    let breakEndDate = null;
    const breakStartMinutes = timeToMinutes(selectValue("breakStart"));
    const breakLength = readNumeric("breakMinutes");
    if (breakStartMinutes !== null && breakLength > 0) {
      breakStartDate = new Date(year, month - 1, day, Math.floor(breakStartMinutes / 60), breakStartMinutes % 60, 0, 0);
      if (breakStartDate < start) breakStartDate.setDate(breakStartDate.getDate() + 1);
      breakEndDate = new Date(breakStartDate.getTime() + breakLength * 60000);
    }

    const holidaysByYear = new Map();
    const getHolidays = (y) => {
      if (!holidaysByYear.has(y)) holidaysByYear.set(y, czechHolidays(y));
      return holidaysByYear.get(y);
    };
    let worked = 0;
    let night = 0;
    let weekend = 0;
    let holiday = 0;
    for (let t = start.getTime(); t < end.getTime(); t += 60000) {
      const moment = new Date(t);
      if (breakStartDate && breakEndDate && t >= breakStartDate.getTime() && t < breakEndDate.getTime()) continue;
      worked += 1;
      const hour = moment.getHours();
      if (hour >= 22 || hour < 6) night += 1;
      if (moment.getDay() === 0 || moment.getDay() === 6) weekend += 1;
      if (getHolidays(moment.getFullYear()).has(dateKey(moment))) holiday += 1;
    }
    const toHours = (minutes) => minutes / 60;
    return { worked: toHours(worked), night: toHours(night), weekend: toHours(weekend), holiday: toHours(holiday), start, end };
  }

  function renderAutoHours() {
    const result = autoHours();
    if (!result) {
      setText("autoTotalHours", "—");
      setText("autoNightHours", "—");
      setText("autoWeekendHours", "—");
      setText("autoHolidayHours", "—");
      setText("autoHoursNote", "Zkontrolujte datum a časy. Směna může mít nejvýše 24 hodin.");
      return null;
    }
    setText("autoTotalHours", hours(result.worked));
    setText("autoNightHours", hours(result.night));
    setText("autoWeekendHours", hours(result.weekend));
    setText("autoHolidayHours", hours(result.holiday));
    const crossesMidnight = result.start.getDate() !== result.end.getDate();
    setText("autoHoursNote", `${crossesMidnight ? "Směna pokračuje přes půlnoc. " : ""}Výpočet vynechal zadanou neplacenou přestávku a rozpoznal kalendářní režimy po minutách.`);
    return result;
  }

  function applyAutoHours() {
    const result = renderAutoHours();
    if (!result) return;
    setExactNumeric("shiftHours", result.worked);
    setExactNumeric("nightHours", result.night);
    setExactNumeric("weekendHours", result.weekend);
    setExactNumeric("holidayHours", result.holiday);
    $("includeNight").checked = result.night > 0;
    $("includeWeekend").checked = result.weekend > 0;
    $("includeHoliday").checked = result.holiday > 0;
    run();
  }

  function shareUrl() {
    const url = new URL(window.location.href);
    url.search = "";
    Object.entries(URL_MAP).forEach(([id, key]) => {
      const el = $(id);
      if (!el) return;
      const value = el.type === "checkbox" ? (el.checked ? "1" : "0") : el.tagName === "SELECT" || el.type === "date" || el.type === "time" ? el.value : readNumeric(id);
      url.searchParams.set(key, String(value));
    });
    url.searchParams.set("rezim", currentMode);
    return url.toString();
  }

  function loadUrl() {
    exactValues.clear();
    const params = new URLSearchParams(window.location.search);
    Object.entries(URL_MAP).forEach(([id, key]) => {
      if (!params.has(key)) return;
      const el = $(id);
      if (!el) return;
      const raw = params.get(key) ?? "";
      if (el.type === "checkbox") el.checked = raw === "1" || raw === "true";
      else if (el.tagName === "SELECT") {
        if ([...el.options].some((option) => option.value === raw)) el.value = raw;
      } else {
        el.value = raw;
        if (numericIds.includes(id)) formatInput(id);
      }
    });
    if (params.has("nocPct") || params.has("vikendPct") || params.has("prescasPct") || params.has("svatekPct")) ratesCustomized = true;
    setMode(params.get("rezim") === "advanced" ? "advanced" : "basic", { render: false });
  }

  async function copyText(value, successMessage) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
      else {
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
      "Příplatky za směny – RychléVýpočty.cz",
      `Režim: ${REGIME_LABELS[r.input.regime]}, ${currentMode === "advanced" ? "podrobná kontrola" : "rychlý výpočet"}`,
      `Směna: ${numberFormat.format(r.input.shiftHours)} h`,
      `Příplatkové režimy: ${describeActive(r.input)}`,
      `Základní odměna: ${money(r.basePay, r.input.roundWhole)}`,
      `Peněžní příplatky: ${money(r.cashBonus, r.input.roundWhole)}`,
      `Celkem za směnu: ${money(r.totalPay, r.input.roundWhole)}`,
      `Měsíčně na příplatcích: ${money(r.monthlyBonus, r.input.roundWhole)}`,
      `Náhradní volno: ${hours(r.timeoffHours)}`,
      "Výsledek je orientační hrubý model a nenahrazuje mzdové podklady zaměstnavatele.",
    ].join("\n");
  }

  function applyPreset(name) {
    const preset = PRESETS[name] || PRESETS.weekendNight;
    doc.querySelectorAll("[data-shift-preset]").forEach((button) => {
      const active = button.dataset.shiftPreset === name;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    ["nightHours", "weekendHours", "holidayHours", "overtimeHours"].forEach((id) => exactValues.delete(id));
    $("includeNight").checked = preset.night;
    $("includeWeekend").checked = preset.weekend;
    $("includeHoliday").checked = preset.holiday;
    $("includeOvertime").checked = preset.overtime;
    $("nightHours").value = preset.nightHours;
    $("weekendHours").value = preset.weekendHours;
    $("holidayHours").value = preset.holidayHours;
    $("overtimeHours").value = preset.overtimeHours;
    ["nightHours", "weekendHours", "holidayHours", "overtimeHours"].forEach(formatInput);
    run();
  }

  function resetAll() {
    exactValues.clear();
    form.reset();
    ratesCustomized = false;
    currentStep = 0;
    $("payRegime").value = "wage";
    applyRegimeDefaults(true);
    setMode("basic", { render: false });
    setAdvancedStep(0);
    numericIds.forEach(formatInput);
    setText("copyStatus", "");
    setText("formStatus", "");
    renderAutoHours();
    run();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  numericIds.forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", () => {
      exactValues.delete(id);
      if (["nightPercent", "weekendPercent", "holidayPercent", "overtimePercent"].includes(id)) ratesCustomized = true;
      run();
    });
    el.addEventListener("change", run);
    el.addEventListener("blur", () => { formatInput(id); run(); });
  });

  checkboxIds.forEach((id) => $(id)?.addEventListener("change", run));
  $("payRegime")?.addEventListener("change", () => { ratesCustomized = false; applyRegimeDefaults(true); run(); });
  ["holidayCompensation", "overtimeCompensation"].forEach((id) => $(id)?.addEventListener("change", run));
  ["shiftDate", "shiftStart", "shiftEnd", "breakStart", "breakMinutes"].forEach((id) => {
    $(id)?.addEventListener("input", renderAutoHours);
    $(id)?.addEventListener("change", renderAutoHours);
  });

  doc.querySelectorAll("[data-shift-preset]").forEach((button) => button.addEventListener("click", () => applyPreset(button.dataset.shiftPreset)));
  doc.querySelectorAll(".shift-mode-btn").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  doc.querySelectorAll(".shift-step-btn").forEach((button) => button.addEventListener("click", () => setAdvancedStep(Number(button.dataset.advancedStep))));
  $("advancedPrev")?.addEventListener("click", () => setAdvancedStep(currentStep - 1));
  $("advancedNext")?.addEventListener("click", () => setAdvancedStep(currentStep + 1));
  $("applyAutoHours")?.addEventListener("click", applyAutoHours);
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
  const dateInput = $("shiftDate");
  const urlHasDate = new URLSearchParams(window.location.search).has("datum");
  if (dateInput && !urlHasDate) {
    const now = new Date();
    const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    dateInput.value = localDate;
  }
  if (!ratesCustomized) applyRegimeDefaults(true);
  numericIds.forEach(formatInput);
  setAdvancedStep(0);
  renderAutoHours();
  run();
})();
