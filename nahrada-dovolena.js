(function () {
  "use strict";

  const form = document.getElementById("vacationPayForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const moneyFormatter = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0
  });

  let mode = "basic";
  let lastResult = null;

  function parseNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const normalized = String(value || "")
      .replace(/\s/g, "")
      .replace(/[^0-9,.-]/g, "")
      .replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function money(value) {
    return moneyFormatter.format(Math.round(Math.max(0, value || 0)));
  }

  function number(value, digits) {
    const maximumFractionDigits = Number.isInteger(digits) ? digits : 2;
    return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: maximumFractionDigits }).format(Math.max(0, value || 0));
  }

  function rate(value) {
    return number(value, 2) + " Kč/h";
  }

  function hours(value) {
    return number(value, 2) + " h";
  }

  function selected(name) {
    const input = form.querySelector('input[name="' + name + '"]:checked');
    return input ? input.value : "";
  }

  function shiftLabel(value) {
    const rounded = Math.round(value * 100) / 100;
    if (rounded === 1) return "1 směna";
    if (rounded >= 2 && rounded <= 4 && Number.isInteger(rounded)) return number(rounded, 0) + " směny";
    return number(rounded, 2) + " směn";
  }

  function parseShiftList(value) {
    const raw = String(value || "").trim();
    if (!raw) return [];

    let parts;
    if (/[;\n]/.test(raw)) {
      parts = raw.split(/[;\n]+/);
    } else if (/,\s+/.test(raw) || (raw.match(/,/g) || []).length > 1) {
      parts = raw.split(/,\s*/);
    } else {
      parts = raw.split(/\s+/);
    }

    return parts
      .map((part) => parseNumber(part))
      .filter((item) => Number.isFinite(item) && item > 0 && item <= 24);
  }

  function previousQuarter(quarter, year) {
    const q = clamp(Math.round(quarter || 1), 1, 4);
    const y = clamp(Math.round(year || 2026), 2000, 2200);
    if (q === 1) return "4. čtvrtletí " + (y - 1);
    return (q - 1) + ". čtvrtletí " + y;
  }

  function basicInput() {
    const average = clamp(parseNumber($("basicAverage").value), 0, 100000);
    const vacationHours = clamp(parseNumber($("basicHours").value), 0, 10000);
    const shiftLength = clamp(parseNumber($("basicShiftLength").value), 0, 24);
    const shiftCount = shiftLength > 0 ? vacationHours / shiftLength : 0;
    const weeklyHours = shiftLength > 0 ? shiftLength * 5 : 40;

    return {
      mode: "basic",
      averageMethod: "direct",
      average: average,
      averageSource: "Přímé zadání",
      sourceShort: "přímé zadání",
      quarterLabel: "Rozhodné období: ověřte",
      qualityStatus: "Ověřte průměr v podkladech",
      qualityText: "Přímé zadání je přesné pouze tehdy, pokud používáte průměrný hodinový výdělek platný pro dané období.",
      vacationMode: "hours",
      vacationHours: vacationHours,
      shiftLength: shiftLength,
      shiftCount: shiftCount,
      shiftList: [],
      weeklyHours: weeklyHours,
      ordinaryRate: 0,
      payContext: "drawing",
      quarterDays: null
    };
  }

  function proAverage() {
    const method = selected("averageMethod") || "direct";
    const useYear = clamp(parseNumber($("useYear").value), 2000, 2200);
    const useQuarter = clamp(parseNumber($("useQuarter").value), 1, 4);
    const quarterLabel = "Rozhodné období: " + previousQuarter(useQuarter, useYear);

    if (method === "quarter") {
      const gross = clamp(parseNumber($("quarterGross").value), 0, 1000000000);
      const workedHours = clamp(parseNumber($("quarterHours").value), 0, 100000);
      const workedDays = clamp(parseNumber($("quarterDays").value), 0, 366);
      const average = workedHours > 0 ? gross / workedHours : 0;
      const underLimit = workedDays < 21;

      return {
        method: method,
        average: average,
        source: "Dopočet z čtvrtletí",
        sourceShort: "čtvrtletní dopočet",
        quarterLabel: quarterLabel,
        quarterDays: workedDays,
        qualityStatus: underLimit ? "Pod 21 dnů: použijte pravděpodobný výdělek" : "Kontrolní dopočet je připraven",
        qualityText: underLimit
          ? "V rozhodném období nebylo zadáno alespoň 21 odpracovaných dnů. Zákonný výpočet proto obvykle pracuje s pravděpodobným výdělkem určeným zaměstnavatelem."
          : "Dopočet dělí zadanou započitatelnou hrubou mzdu odpracovanými hodinami. Ověřte, že vstupy odpovídají mzdové metodice."
      };
    }

    if (method === "probable") {
      return {
        method: method,
        average: clamp(parseNumber($("proProbableAverage").value), 0, 100000),
        source: "Pravděpodobný výdělek",
        sourceShort: "pravděpodobný výdělek",
        quarterLabel: quarterLabel,
        quarterDays: null,
        qualityStatus: "Hodnotu musí určit zaměstnavatel",
        qualityText: "Kalkulačka používá zadaný pravděpodobný výdělek, ale sama neposuzuje mzdy srovnatelných zaměstnanců ani očekávané příplatky."
      };
    }

    return {
      method: "direct",
      average: clamp(parseNumber($("proDirectAverage").value), 0, 100000),
      source: "Přímé zadání",
      sourceShort: "přímé zadání",
      quarterLabel: quarterLabel,
      quarterDays: null,
      qualityStatus: "Ověřte průměr v podkladech",
      qualityText: "Použijte průměrný hodinový výdělek platný pro zvolené čtvrtletí, nikoli automaticky tarifní nebo běžnou hodinovou sazbu."
    };
  }

  function proVacation() {
    const vacationMode = selected("vacationMode") || "hours";
    const weeklyHours = clamp(parseNumber($("weeklyHours").value), 0, 168);

    if (vacationMode === "equal") {
      const shiftCount = clamp(parseNumber($("proShiftCount").value), 0, 1000);
      const shiftLength = clamp(parseNumber($("proShiftLength").value), 0, 24);
      return {
        vacationMode: vacationMode,
        vacationHours: shiftCount * shiftLength,
        shiftLength: shiftLength,
        shiftCount: shiftCount,
        shiftList: [],
        weeklyHours: weeklyHours
      };
    }

    if (vacationMode === "irregular") {
      const shiftList = parseShiftList($("proShiftList").value);
      const vacationHours = shiftList.reduce((sum, item) => sum + item, 0);
      const shiftCount = shiftList.length;
      const shiftLength = shiftCount > 0 ? vacationHours / shiftCount : 0;
      return {
        vacationMode: vacationMode,
        vacationHours: vacationHours,
        shiftLength: shiftLength,
        shiftCount: shiftCount,
        shiftList: shiftList,
        weeklyHours: weeklyHours
      };
    }

    return {
      vacationMode: "hours",
      vacationHours: clamp(parseNumber($("proVacationHours").value), 0, 10000),
      shiftLength: 0,
      shiftCount: 0,
      shiftList: [],
      weeklyHours: weeklyHours
    };
  }

  function proInput() {
    const averageData = proAverage();
    const vacationData = proVacation();
    return {
      mode: "pro",
      averageMethod: averageData.method,
      average: averageData.average,
      averageSource: averageData.source,
      sourceShort: averageData.sourceShort,
      quarterLabel: averageData.quarterLabel,
      qualityStatus: averageData.qualityStatus,
      qualityText: averageData.qualityText,
      quarterDays: averageData.quarterDays,
      vacationMode: vacationData.vacationMode,
      vacationHours: vacationData.vacationHours,
      shiftLength: vacationData.shiftLength,
      shiftCount: vacationData.shiftCount,
      shiftList: vacationData.shiftList,
      weeklyHours: vacationData.weeklyHours,
      ordinaryRate: clamp(parseNumber($("ordinaryHourlyRate").value), 0, 100000),
      payContext: selected("payContext") || "drawing"
    };
  }

  function calculate(input) {
    const gross = input.average * input.vacationHours;
    const perShift = input.shiftLength > 0 ? input.average * input.shiftLength : 0;
    const weekPay = input.average * input.weeklyHours;
    const ordinaryTotal = input.ordinaryRate > 0 ? input.ordinaryRate * input.vacationHours : 0;
    const comparison = input.ordinaryRate > 0 ? gross - ordinaryTotal : null;
    return Object.assign({}, input, {
      gross: gross,
      perShift: perShift,
      weekPay: weekPay,
      ordinaryTotal: ordinaryTotal,
      comparison: comparison
    });
  }

  function tableRow(label, value, meaning) {
    return '<tr><td data-label="Položka">' + label + '</td><td data-label="Hodnota">' + value + '</td><td data-label="Význam">' + meaning + "</td></tr>";
  }

  function renderTable(result) {
    const context = result.payContext === "termination"
      ? "Proplacení zůstatku při skončení pracovního poměru"
      : "Náhrada za dobu čerpání dovolené";
    const shiftMeaning = result.vacationMode === "irregular"
      ? "Sečtené směny: " + result.shiftList.map((item) => number(item, 2)).join(" + ") + " h"
      : result.shiftLength > 0
        ? shiftLabel(result.shiftCount) + " při délce " + hours(result.shiftLength)
        : "Hodiny byly zadány přímo bez převodu na směny";

    const rows = [
      tableRow("Průměrný hodinový výdělek", rate(result.average), result.averageSource),
      tableRow("Rozhodné období", result.quarterLabel.replace("Rozhodné období: ", ""), "Obvykle předchozí kalendářní čtvrtletí"),
      tableRow("Rozsah dovolené", hours(result.vacationHours), shiftMeaning),
      tableRow("Hrubá náhrada", money(result.gross), rate(result.average) + " × " + hours(result.vacationHours)),
      tableRow("Kontext výplaty", result.payContext === "termination" ? "Skončení práce" : "Čerpání", context),
      tableRow("Model pracovního týdne", money(result.weekPay), hours(result.weeklyHours) + " × " + rate(result.average))
    ];

    if (result.comparison !== null) {
      const sign = result.comparison > 0 ? "+" : result.comparison < 0 ? "−" : "";
      rows.push(tableRow(
        "Rozdíl proti běžné sazbě",
        sign + money(Math.abs(result.comparison)),
        "Srovnávací sazba " + rate(result.ordinaryRate) + "; nemění zákonný výsledek"
      ));
    }

    $("summaryTableBody").innerHTML = rows.join("");
  }

  function render(result) {
    const valid = result.average > 0 && result.vacationHours > 0;
    const contextTitle = result.payContext === "termination"
      ? "Náhrada za nevyčerpanou dovolenou"
      : "Náhrada za čerpanou dovolenou";
    const contextShort = result.payContext === "termination" ? "Proplacení při skončení" : "Čerpaná dovolená";
    const shiftText = result.shiftLength > 0 ? hours(result.shiftLength) : "délka neuvedena";
    const countText = result.shiftCount > 0 ? shiftLabel(result.shiftCount) : "zadáno v hodinách";
    const barWidth = result.weeklyHours > 0
      ? clamp((result.vacationHours / result.weeklyHours) * 100, valid ? 5 : 0, 100)
      : 0;

    $("modeStatus").textContent = result.mode === "basic" ? "Basic výpočet" : "PRO scénář";
    $("resultType").textContent = contextTitle;
    $("grossVacationPay").textContent = valid ? money(result.gross) : "Doplňte hodnoty";
    $("resultFormula").textContent = valid ? rate(result.average) + " × " + hours(result.vacationHours) : "Průměr × hodiny dovolené";
    $("resultLead").textContent = result.payContext === "termination"
      ? "Jde o hrubý model vypořádání nevyčerpané dovolené při skončení pracovního poměru, nikoli o možnost proplatit volno kdykoli během zaměstnání."
      : "Jde o hrubou náhradu před zúčtováním daně, pojistného a ostatních položek výplaty.";
    $("resultBar").style.width = barWidth + "%";
    $("resultHours").textContent = hours(result.vacationHours);
    $("resultHourly").textContent = rate(result.average);
    $("resultSource").textContent = result.sourceShort;
    $("resultPerShift").textContent = result.shiftLength > 0 ? money(result.perShift) : "—";
    $("resultShift").textContent = shiftText;
    $("resultDays").textContent = countText;
    $("resultWeek").textContent = money(result.weekPay);
    $("resultWeekHours").textContent = hours(result.weeklyHours);
    $("qualityStatus").textContent = result.qualityStatus;
    $("qualityText").textContent = result.qualityText;
    $("resultQuarter").textContent = result.quarterLabel;

    if (result.comparison === null) {
      $("resultComparison").textContent = "není zadáno";
      $("resultComparisonText").textContent = result.mode === "basic"
        ? "V Basic režimu se náhrada nesrovnává s tarifní nebo smluvní sazbou."
        : "Volitelné srovnání nemění náhradu. Doplňte běžnou hodinovou sazbu, pokud chcete vidět rozdíl.";
    } else {
      const sign = result.comparison > 0 ? "+" : result.comparison < 0 ? "−" : "";
      $("resultComparison").textContent = sign + money(Math.abs(result.comparison));
      if (result.comparison === 0) {
        $("resultComparisonText").textContent = "Náhrada je při zadané běžné sazbě shodná. Srovnání je pouze informativní.";
      } else {
        const direction = result.comparison > 0 ? "vyšší" : "nižší";
        $("resultComparisonText").textContent = "Náhrada je o " + money(Math.abs(result.comparison)) + " " + direction + " než prostý výpočet z běžné sazby " + rate(result.ordinaryRate) + ". Srovnání je pouze informativní.";
      }
    }

    $("readingTitle").textContent = valid
      ? "Za " + hours(result.vacationHours) + " dovolené vychází " + money(result.gross) + " hrubého."
      : "Doplňte průměrný výdělek a hodiny dovolené.";
    $("readingText").textContent = result.shiftCount > 0
      ? "Jde orientačně o " + shiftLabel(result.shiftCount) + ". Výsledek používá " + result.averageSource.toLowerCase() + " ve výši " + rate(result.average) + "."
      : "Hodiny byly zadány přímo. Výsledek používá " + result.averageSource.toLowerCase() + " ve výši " + rate(result.average) + " a nepřevádí rozsah na univerzální osmihodinové dny.";
    $("decisionSource").textContent = result.averageSource;
    $("decisionHours").textContent = hours(result.vacationHours);
    $("decisionContext").textContent = contextShort;

    $("heroPay").textContent = valid ? money(result.gross) : "—";
    $("heroFormula").textContent = valid ? rate(result.average) + " × " + hours(result.vacationHours) : "Průměr × hodiny";
    $("heroHours").textContent = hours(result.vacationHours);
    $("heroShift").textContent = result.shiftLength > 0 ? money(result.perShift) : "—";
    $("heroSource").textContent = result.averageMethod === "quarter"
      ? "Čtvrtletí"
      : result.averageMethod === "probable"
        ? "Pravděpodobný"
        : "Přímý průměr";
    $("heroMode").textContent = result.mode === "basic" ? "Basic" : "PRO";
    $("heroBar").style.width = barWidth + "%";

    renderTable(result);
    lastResult = result;
  }

  function syncConditionals() {
    const averageMethod = selected("averageMethod") || "direct";
    $("directAverageField").hidden = averageMethod !== "direct";
    $("quarterFields").hidden = averageMethod !== "quarter";
    $("probableAverageField").hidden = averageMethod !== "probable";

    const vacationMode = selected("vacationMode") || "hours";
    $("proHoursField").hidden = vacationMode !== "hours";
    $("equalShiftFields").hidden = vacationMode !== "equal";
    $("irregularShiftField").hidden = vacationMode !== "irregular";
  }

  function run() {
    syncConditionals();
    const input = mode === "basic" ? basicInput() : proInput();
    render(calculate(input));
  }

  function setMode(nextMode) {
    mode = nextMode === "pro" ? "pro" : "basic";
    form.dataset.mode = mode;
    document.body.dataset.mode = mode;

    document.querySelectorAll("[data-mode-button]").forEach((button) => {
      const active = button.dataset.modeButton === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });

    document.querySelectorAll("[data-mode-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.modePanel !== mode;
    });

    run();
  }

  function setPreset(preset) {
    const shift = clamp(parseNumber($("basicShiftLength").value), 0, 24) || 8;
    const multiplier = preset === "one" ? 1 : preset === "week" ? 5 : 2;
    $("basicHours").value = number(shift * multiplier, 2).replace(/\s/g, "");
    document.querySelectorAll("[data-basic-preset]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.basicPreset === preset);
    });
    run();
  }

  function copyBasicToPro() {
    $("proDirectAverage").value = $("basicAverage").value;
    $("proVacationHours").value = $("basicHours").value;
    $("weeklyHours").value = number((parseNumber($("basicShiftLength").value) || 8) * 5, 2).replace(/\s/g, "");
    form.querySelector('input[name="averageMethod"][value="direct"]').checked = true;
    form.querySelector('input[name="vacationMode"][value="hours"]').checked = true;
    setMode("pro");
  }

  function resetBasic() {
    $("basicAverage").value = "265";
    $("basicHours").value = "16";
    $("basicShiftLength").value = "8";
    document.querySelectorAll("[data-basic-preset]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.basicPreset === "two");
    });
    setMode("basic");
  }

  function resetPro() {
    form.querySelector('input[name="averageMethod"][value="direct"]').checked = true;
    form.querySelector('input[name="vacationMode"][value="hours"]').checked = true;
    form.querySelector('input[name="payContext"][value="drawing"]').checked = true;
    $("proDirectAverage").value = "265";
    $("quarterGross").value = "126500";
    $("quarterHours").value = "480";
    $("quarterDays").value = "60";
    $("proProbableAverage").value = "265";
    $("useYear").value = "2026";
    $("useQuarter").value = "3";
    $("proVacationHours").value = "16";
    $("proShiftCount").value = "2";
    $("proShiftLength").value = "8";
    $("proShiftList").value = "8, 12, 8";
    $("ordinaryHourlyRate").value = "250";
    $("weeklyHours").value = "40";
    setMode("pro");
  }

  function resultText() {
    if (!lastResult) return "";
    return [
      "Náhrada mzdy za dovolenou – orientační výpočet",
      "Hrubá náhrada: " + money(lastResult.gross),
      "Průměrný hodinový výdělek: " + rate(lastResult.average),
      "Dovolená: " + hours(lastResult.vacationHours),
      "Zdroj průměru: " + lastResult.averageSource,
      "Rozhodné období: " + lastResult.quarterLabel.replace("Rozhodné období: ", ""),
      "Kontext: " + (lastResult.payContext === "termination" ? "proplacení při skončení" : "čerpání dovolené"),
      "Výsledek je hrubý a orientační."
    ].join("\n");
  }

  async function copyResult() {
    const button = $("copyResult");
    const text = resultText();
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Zkopírováno";
    } catch (error) {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      button.textContent = "Zkopírováno";
    }
    window.setTimeout(() => {
      button.textContent = "Kopírovat výsledek";
    }, 1800);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  form.querySelectorAll("input, select, textarea").forEach((element) => {
    element.addEventListener("input", run);
    element.addEventListener("change", run);
  });

  document.querySelectorAll("[data-mode-button]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.modeButton));
  });

  document.querySelectorAll("[data-basic-preset]").forEach((button) => {
    button.addEventListener("click", () => setPreset(button.dataset.basicPreset));
  });

  document.querySelectorAll("[data-open-pro]").forEach((button) => {
    button.addEventListener("click", copyBasicToPro);
  });

  $("copyFromBasic").addEventListener("click", copyBasicToPro);
  $("resetBasic").addEventListener("click", resetBasic);
  $("resetPro").addEventListener("click", resetPro);
  $("copyResult").addEventListener("click", copyResult);
  $("printResult").addEventListener("click", () => window.print());

  syncConditionals();
  run();
})();
