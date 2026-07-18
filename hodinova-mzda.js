(() => {
  "use strict";

  const MINIMUM_HOURLY_2026 = 134.4;
  const $ = (id) => document.getElementById(id);
  const form = $("hourlyWageForm");
  if (!form) return;

  const money0 = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const money2 = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const number1 = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  let mode = "basic";
  let lastState = null;

  const parseNumber = (value) => {
    const normalized = String(value ?? "")
      .replace(/[\s\u00a0]/g, "")
      .replace(/,/g, ".")
      .replace(/[^0-9.-]/g, "");
    const number = Number(normalized);
    return Number.isFinite(number) ? number : 0;
  };

  const formatKc = (value) => `${money0.format(Math.round(value))} Kč`;
  const formatRate = (value) => `${money2.format(value)} Kč/h`;
  const formatHours = (value) => `${number1.format(value)} h`;
  const typeLabel = (type) => type === "net" ? "Čistá" : "Hrubá";
  const periodLabel = (months) => months === 1 ? "Jeden měsíc" : months === 3 ? "Jedno čtvrtletí" : "Jeden rok";
  const periodShort = (months) => months === 1 ? "1 měsíc" : months === 3 ? "3 měsíce" : "12 měsíců";

  const checkedValue = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value || "";

  const getBasicState = () => {
    const incomeType = $("basicIncomeType").value;
    const monthlyPay = parseNumber($("basicMonthlyPay").value);
    const hours = parseNumber($("basicWorkedHours").value);
    const shiftHours = parseNumber($("basicShiftHours").value);
    if (monthlyPay <= 0) return { error: "Zadejte měsíční příjem vyšší než nula." };
    if (hours <= 0) return { error: "Zadejte počet hodin vyšší než nula." };
    if (shiftHours <= 0 || shiftHours > 24) return { error: "Délka směny musí být větší než nula a nejvýše 24 hodin." };
    const hourly = monthlyPay / hours;
    return {
      mode: "basic",
      incomeType,
      months: 1,
      monthlyBase: monthlyPay,
      cashTotal: monthlyPay,
      benefitsTotal: 0,
      total: monthlyPay,
      includesBenefits: false,
      variableTotal: 0,
      hours,
      shiftHours,
      hourly,
      cashHourly: hourly,
      compareRate: 0,
      hoursMode: "direct"
    };
  };

  const getProState = () => {
    const months = parseNumber(checkedValue("proPeriod")) || 12;
    const incomeType = $("proIncomeType").value;
    const monthlyBase = parseNumber($("proBaseMonthly").value);
    const variableTotal = parseNumber($("proVariableTotal").value);
    const benefitsMonthly = parseNumber($("proBenefitsMonthly").value);
    const includesBenefits = $("includeBenefits").checked;
    const hoursMode = checkedValue("hoursMode") || "direct";
    const directHours = parseNumber($("proDirectHours").value);
    const weeklyHours = parseNumber($("proWeeklyHours").value);
    const workedWeeks = parseNumber($("proWorkedWeeks").value);
    const overtimeHours = parseNumber($("proOvertimeHours").value);
    const shiftHours = parseNumber($("proShiftHours").value) || 8;
    const compareRate = parseNumber($("compareHourlyRate").value);

    if (monthlyBase < 0 || variableTotal < 0 || benefitsMonthly < 0) return { error: "Peněžní částky nemohou být záporné." };
    const cashTotal = monthlyBase * months + variableTotal;
    const benefitsTotal = includesBenefits ? benefitsMonthly * months : 0;
    const total = cashTotal + benefitsTotal;
    const hours = hoursMode === "schedule" ? weeklyHours * workedWeeks + overtimeHours : directHours;
    if (total <= 0) return { error: "Součet odměny musí být vyšší než nula." };
    if (hours <= 0) return { error: "Celkový počet hodin musí být vyšší než nula." };
    if (hoursMode === "schedule" && (weeklyHours <= 0 || workedWeeks <= 0)) return { error: "U odhadu z rozvrhu zadejte hodiny týdně i počet odpracovaných týdnů." };
    if (shiftHours <= 0 || shiftHours > 24) return { error: "Délka směny musí být větší než nula a nejvýše 24 hodin." };

    return {
      mode: "pro",
      incomeType,
      months,
      monthlyBase,
      cashTotal,
      benefitsTotal,
      total,
      includesBenefits,
      variableTotal,
      hours,
      shiftHours,
      hourly: total / hours,
      cashHourly: cashTotal / hours,
      compareRate,
      hoursMode,
      weeklyHours,
      workedWeeks,
      overtimeHours
    };
  };

  const setText = (id, value) => {
    const element = $(id);
    if (element) element.textContent = value;
  };

  const setSummaryRows = (rows) => {
    $("summaryTableBody").innerHTML = rows.map(([item, value, meaning]) =>
      `<tr><td data-label="Položka">${item}</td><td data-label="Hodnota"><strong>${value}</strong></td><td data-label="Co znamená">${meaning}</td></tr>`
    ).join("");
  };

  const renderSensitivity = (state) => {
    const monthlyValue = state.total / state.months;
    const ranges = [160, 168, 176, 184];
    $("sensitivityGrid").innerHTML = ranges.map((hours) => {
      const rate = monthlyValue / hours;
      const active = state.mode === "basic" && Math.abs(state.hours - hours) < 0.01 ? " is-active" : "";
      return `<article class="${active.trim()}"><span>${hours} hodin</span><strong>${formatRate(rate)}</strong><small>${formatKc(monthlyValue)} ÷ ${hours} h</small></article>`;
    }).join("");
  };

  const showError = (message) => {
    setText("hourlyResult", "—");
    setText("resultFormula", "Zkontrolujte vstupní údaje");
    setText("resultLead", message);
    setText("qualityStatus", "Výpočet čeká na opravu");
    setText("qualityText", message);
    $("statusBox").classList.add("is-warning");
  };

  const render = () => {
    const state = mode === "basic" ? getBasicState() : getProState();
    if (state.error) {
      showError(state.error);
      return;
    }
    lastState = state;
    $("statusBox").classList.remove("is-warning");

    const daily = state.hourly * state.shiftHours;
    const weekly = state.hourly * 40;
    const averageMonthly = state.total / state.months;
    const isNet = state.incomeType === "net";
    const resultType = `${state.includesBenefits ? "Celková " : ""}${typeLabel(state.incomeType).toLowerCase()} hodinová ${state.includesBenefits ? "hodnota" : "mzda"}`;
    const incomeLabel = `${typeLabel(state.incomeType)}${state.includesBenefits ? " + benefity" : ""}`;
    const baseFormula = state.mode === "basic"
      ? `${formatKc(state.total)} ÷ ${formatHours(state.hours)}`
      : `${formatKc(state.total)} ÷ ${formatHours(state.hours)} za ${periodShort(state.months)}`;

    setText("modeStatus", state.mode === "basic" ? "Basic výpočet" : "PRO scénář");
    setText("resultType", resultType.charAt(0).toUpperCase() + resultType.slice(1));
    setText("hourlyResult", formatRate(state.hourly));
    setText("resultFormula", baseFormula);
    setText("resultLead", state.includesBenefits
      ? "Hlavní výsledek zahrnuje peněžní odměnu i vámi oceněné benefity. Peněžní hodinovka zůstává v detailu."
      : `Jedna hodina má při zadané ${typeLabel(state.incomeType).toLowerCase()} odměně tuto orientační hodnotu.`);
    setText("resultHours", formatHours(state.hours));
    setText("resultDaily", formatKc(daily));
    setText("resultShift", formatHours(state.shiftHours));
    setText("resultWeekly", formatKc(weekly));
    setText("resultMonthly", formatKc(averageMonthly));
    setText("resultPeriod", periodShort(state.months));
    setText("resultTotal", formatKc(state.total));
    setText("resultTotalLabel", state.includesBenefits ? "peníze + oceněné benefity" : "peněžní příjem");

    const barWidth = Math.min(100, Math.max(8, state.hourly / 5));
    $("resultBar").style.width = `${barWidth}%`;
    $("heroBar").style.width = `${barWidth}%`;

    setText("heroHourly", formatRate(state.hourly));
    setText("heroFormula", `${formatKc(state.total)} ÷ ${formatHours(state.hours)}`);
    setText("heroHours", formatHours(state.hours));
    setText("heroDaily", formatKc(daily));
    setText("heroIncomeType", incomeLabel);
    setText("heroMode", state.mode === "basic" ? "Basic" : "PRO");

    if (isNet) {
      setText("minimumStatus", "Čistou hodnotu s hrubým minimem nesrovnávejte");
    } else if (state.cashHourly >= MINIMUM_HOURLY_2026) {
      setText("minimumStatus", "Nad orientační hranicí 2026");
    } else {
      setText("minimumStatus", "Pod orientační hranicí 2026 – ověřte složky");
      $("statusBox").classList.add("is-warning");
    }

    if (state.mode === "basic") {
      setText("qualityStatus", "Stejné období je základ");
      setText("qualityText", "Měsíční příjem i hodiny musí patřit ke stejnému měsíci. Výsledek není zákonný průměrný výdělek.");
    } else if (state.includesBenefits) {
      setText("qualityStatus", "Zobrazená je celková hodnota");
      setText("qualityText", `Peněžní hodinovka bez benefitů činí ${formatRate(state.cashHourly)}. Pro právní kontrolu minima používejte peněžní složky podle oficiálních pravidel.`);
    } else {
      setText("qualityStatus", "PRO pracuje s peněžní odměnou");
      setText("qualityText", "Bonusy i hodiny jsou rozloženy do stejného období. Přesto jde o analytický podíl, nikoli pracovněprávní průměr.");
    }

    if (state.mode === "pro" && state.compareRate > 0) {
      const perHourDifference = state.hourly - state.compareRate;
      const periodDifference = perHourDifference * state.hours;
      const direction = perHourDifference > 0.005 ? "vyšší" : perHourDifference < -0.005 ? "nižší" : "shodná";
      setText("resultComparison", `${perHourDifference >= 0 ? "+" : ""}${money2.format(perHourDifference)} Kč/h`);
      setText("resultComparisonText", direction === "shodná"
        ? `Výsledek je při zadané srovnávací sazbě prakticky shodný. Dopad za období je ${formatKc(periodDifference)}.`
        : `Hodinová hodnota je ${direction} než ${money2.format(state.compareRate)} Kč/h. Dopad za celé období je ${periodDifference >= 0 ? "+" : ""}${formatKc(periodDifference)}.`);
    } else {
      setText("resultComparison", "není zadáno");
      setText("resultComparisonText", "V Basic režimu se výsledek s jinou nabídkou nesrovnává.");
    }

    const readingContext = state.includesBenefits ? "včetně oceněných benefitů" : "z peněžního příjmu";
    setText("readingTitle", `Za ${periodShort(state.months)} vychází ${formatRate(state.hourly)}.`);
    setText("readingText", `Výpočet používá ${formatKc(state.total)} a ${formatHours(state.hours)} ${readingContext}. Denní přepočet při směně ${formatHours(state.shiftHours)} činí ${formatKc(daily)}.`);
    setText("decisionType", incomeLabel);
    setText("decisionPeriod", periodLabel(state.months));
    setText("decisionHours", formatHours(state.hours));

    const rows = state.mode === "basic" ? [
      ["Typ příjmu", typeLabel(state.incomeType), "Kalkulačka nepřevádí hrubou částku na čistou ani naopak"],
      ["Měsíční příjem", formatKc(state.total), "Částka ze stejného měsíce jako použité hodiny"],
      ["Odpracovaný čas", formatHours(state.hours), "Jmenovatel hodinového přepočtu"],
      ["Hodinová hodnota", formatRate(state.hourly), "Měsíční příjem dělený hodinami"],
      ["Jedna směna", formatKc(daily), `${formatRate(state.hourly)} × ${formatHours(state.shiftHours)}`],
      ["Model 40 hodin", formatKc(weekly), "Srozumitelný týdenní přepočet, nikoli další příjem"]
    ] : [
      ["Období", periodLabel(state.months), "Všechny peníze i hodiny musí patřit do tohoto rozsahu"],
      ["Základní mzda", formatKc(state.monthlyBase * state.months), `${formatKc(state.monthlyBase)} × ${state.months}`],
      ["Bonusy", formatKc(state.variableTotal), "Součet peněžních odměn za celé období"],
      ["Peněžní odměna", formatKc(state.cashTotal), "Základ a bonusy bez nepeněžních benefitů"],
      ["Oceněné benefity", formatKc(state.benefitsTotal), state.includesBenefits ? "Zahrnuty v hlavním výsledku" : "Nejsou zahrnuty v hlavním výsledku"],
      ["Celková hodnota", formatKc(state.total), "Čitatel hlavního hodinového výsledku"],
      ["Pracovní čas", formatHours(state.hours), state.hoursMode === "direct" ? "Přímý součet hodin" : "Týdenní rozsah × týdny + další přesčasy"],
      ["Peněžní hodinovka", formatRate(state.cashHourly), "Bez oceněných nepeněžních benefitů"],
      ["Hlavní výsledek", formatRate(state.hourly), "Celková hodnota dělená časem"]
    ];
    setSummaryRows(rows);
    renderSensitivity(state);
  };

  const setMode = (nextMode, shouldScroll = false) => {
    mode = nextMode;
    document.body.dataset.mode = mode;
    form.dataset.mode = mode;
    document.querySelectorAll("[data-mode-button]").forEach((button) => {
      const active = button.dataset.modeButton === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-mode-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.modePanel !== mode;
    });
    render();
    if (shouldScroll) $("kalkulacka").scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const syncConditionalFields = () => {
    const hoursMode = checkedValue("hoursMode");
    $("directHoursField").hidden = hoursMode !== "direct";
    $("scheduleHoursFields").hidden = hoursMode !== "schedule";
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });

  form.addEventListener("input", () => {
    syncConditionalFields();
    render();
  });

  form.addEventListener("change", () => {
    syncConditionalFields();
    render();
  });

  document.querySelectorAll("[data-mode-button]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.modeButton));
  });

  document.querySelectorAll("[data-open-pro]").forEach((button) => {
    button.addEventListener("click", () => setMode("pro", true));
  });

  document.querySelectorAll("[data-basic-hours]").forEach((button) => {
    button.addEventListener("click", () => {
      $("basicWorkedHours").value = button.dataset.basicHours;
      document.querySelectorAll("[data-basic-hours]").forEach((item) => item.classList.toggle("is-active", item === button));
      render();
    });
  });

  $("copyFromBasic").addEventListener("click", () => {
    $("proIncomeType").value = $("basicIncomeType").value;
    $("proBaseMonthly").value = $("basicMonthlyPay").value;
    $("proVariableTotal").value = "0";
    $("proBenefitsMonthly").value = "0";
    $("includeBenefits").checked = false;
    $("proDirectHours").value = $("basicWorkedHours").value;
    form.querySelector('input[name="proPeriod"][value="1"]').checked = true;
    form.querySelector('input[name="hoursMode"][value="direct"]').checked = true;
    syncConditionalFields();
    render();
  });

  $("resetBasic").addEventListener("click", () => {
    $("basicIncomeType").value = "gross";
    $("basicMonthlyPay").value = "40000";
    $("basicWorkedHours").value = "168";
    $("basicShiftHours").value = "8";
    document.querySelectorAll("[data-basic-hours]").forEach((button) => button.classList.toggle("is-active", button.dataset.basicHours === "168"));
    render();
  });

  $("resetPro").addEventListener("click", () => {
    $("proIncomeType").value = "gross";
    $("proBaseMonthly").value = "40000";
    $("proVariableTotal").value = "60000";
    $("proBenefitsMonthly").value = "2000";
    $("includeBenefits").checked = true;
    $("proDirectHours").value = "1900";
    $("proWeeklyHours").value = "40";
    $("proWorkedWeeks").value = "46";
    $("proOvertimeHours").value = "60";
    $("proShiftHours").value = "8";
    $("compareHourlyRate").value = "280";
    form.querySelector('input[name="proPeriod"][value="12"]').checked = true;
    form.querySelector('input[name="hoursMode"][value="direct"]').checked = true;
    syncConditionalFields();
    render();
  });

  $("copyResult").addEventListener("click", async () => {
    if (!lastState) return;
    const text = `${$("resultType").textContent}: ${$("hourlyResult").textContent}. ${$("resultFormula").textContent}. ${$("resultLead").textContent}`;
    try {
      await navigator.clipboard.writeText(text);
      const original = $("copyResult").textContent;
      $("copyResult").textContent = "Zkopírováno";
      window.setTimeout(() => { $("copyResult").textContent = original; }, 1600);
    } catch {
      window.prompt("Zkopírujte výsledek:", text);
    }
  });

  $("printResult").addEventListener("click", () => window.print());

  syncConditionalFields();
  setMode("basic");
})();
