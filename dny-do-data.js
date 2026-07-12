(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const form = $("daysForm");
  if (!form) return;

  const MS_PER_DAY = 86400000;
  const number = new Intl.NumberFormat("cs-CZ");
  const decimal = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const dateFormatter = new Intl.DateTimeFormat("cs-CZ", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const formatNumber = (value) => number.format(Number.isFinite(value) ? value : 0);
  const formatDecimal = (value) => decimal.format(Number.isFinite(value) ? value : 0);
  const pad = (value) => String(value).padStart(2, "0");
  const toInputValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  const todayLocal = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };
  const parseDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) return null;
    return parsed;
  };
  const utcDay = (date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDifference = (start, target) => Math.round((utcDay(target) - utcDay(start)) / MS_PER_DAY);

  function addMonthsClamped(date, months) {
    const monthStart = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDay = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    return new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(date.getDate(), lastDay));
  }

  function calendarDifference(start, target) {
    const first = start <= target ? start : target;
    const last = start <= target ? target : start;
    let totalMonths = (last.getFullYear() - first.getFullYear()) * 12 + last.getMonth() - first.getMonth();
    if (addMonthsClamped(first, totalMonths) > last) totalMonths -= 1;
    const anchor = addMonthsClamped(first, totalMonths);
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    const days = dayDifference(anchor, last);
    return { years, months, days };
  }

  function daysLabel(value) {
    const absolute = Math.abs(value);
    if (absolute === 1) return "den";
    if (absolute >= 2 && absolute <= 4) return "dny";
    return "dní";
  }

  function yearsLabel(value) {
    if (value === 1) return "rok";
    if (value >= 2 && value <= 4) return "roky";
    return "let";
  }

  function calendarText(parts) {
    const chunks = [];
    if (parts.years) chunks.push(`${formatNumber(parts.years)} ${yearsLabel(parts.years)}`);
    if (parts.months) chunks.push(`${formatNumber(parts.months)} měs.`);
    if (parts.days || !chunks.length) chunks.push(`${formatNumber(parts.days)} ${daysLabel(parts.days)}`);
    return chunks.join(" ");
  }

  function setText(id, text) {
    const element = $(id);
    if (element) element.textContent = text;
  }

  function setDefaults() {
    const today = todayLocal();
    $("startDate").value = toInputValue(today);
    $("targetDate").value = toInputValue(addDays(today, 30));
    $("calculationMode").value = "absolute";
    $("includeTargetDay").checked = false;
    $("daysAdvanced").open = false;
    $("inputError").hidden = true;
  }

  function setInvalidState() {
    $("inputError").hidden = false;
    setText("resultBadge", "Doplňte obě data");
    setText("daysResult", "—");
    setText("resultNote", "Výpočet potřebuje platné počáteční i cílové datum.");
    setText("statusResult", "Neúplné zadání");
    setText("timingStatus", "Výsledek zatím chybí");
    setText("timingText", "Zkontrolujte obě datumová pole.");
  }

  function render() {
    const start = parseDate($("startDate").value);
    const target = parseDate($("targetDate").value);
    if (!start || !target) {
      setInvalidState();
      return;
    }

    $("inputError").hidden = true;
    const rawDifference = dayDifference(start, target);
    const absoluteDifference = Math.abs(rawDifference);
    const targetIncluded = $("includeTargetDay").checked;
    const signedMode = $("calculationMode").value === "signed";
    const countedAbsolute = absoluteDifference + (targetIncluded ? 1 : 0);
    const directionSign = rawDifference === 0 ? 1 : Math.sign(rawDifference);
    const displayedDays = signedMode ? countedAbsolute * directionSign : countedAbsolute;
    const fullWeeks = Math.floor(countedAbsolute / 7);
    const remainingDays = countedAbsolute % 7;
    const approximateMonths = countedAbsolute / 30.436875;
    const parts = calendarDifference(start, target);
    const calendarBreakdown = calendarText(parts);
    const direction = rawDifference > 0 ? "do budoucna" : rawDifference < 0 ? "do minulosti" : "stejný den";
    const status = rawDifference > 0 ? "Datum teprve přijde" : rawDifference < 0 ? "Datum už proběhlo" : "Obě data jsou stejná";
    const prefix = signedMode && displayedDays > 0 ? "+" : "";
    const mainValue = `${prefix}${formatNumber(displayedDays)} ${daysLabel(displayedDays)}`;
    const weekText = `${formatNumber(fullWeeks)} týd. ${formatNumber(remainingDays)} ${daysLabel(remainingDays)}`;
    const targetMode = targetIncluded ? "započítán" : "nezapočítán";

    setText("daysResult", mainValue);
    setText("statusResult", status);
    setText("weeksResult", weekText);
    setText("monthsResult", formatDecimal(approximateMonths));
    setText("calendarBreakdownResult", calendarBreakdown);
    setText("resultBadge", rawDifference === 0 ? "Stejný kalendářní den" : `Výpočet ${direction}`);
    setText("startDateResult", dateFormatter.format(start));
    setText("targetDateResult", dateFormatter.format(target));
    setText("directionResult", direction);
    setText("yearsResult", `${formatNumber(parts.years)} ${yearsLabel(parts.years)}`);
    setText("calendarMonthsResult", `${formatNumber(parts.years * 12 + parts.months)} měs.`);
    setText("targetDayModeResult", targetMode);

    const baseExplanation = targetIncluded
      ? `Výsledek zahrnuje také cílový den, proto je o jeden den vyšší než čistá vzdálenost ${formatNumber(absoluteDifference)} ${daysLabel(absoluteDifference)}.`
      : `Jde o čistou vzdálenost mezi daty; cílový den není přidaný jako další den období.`;
    setText("resultNote", baseExplanation);
    setText("timingStatus", status);

    if (rawDifference > 0) {
      setText("timingText", `Do cílového data zbývá ${formatNumber(countedAbsolute)} ${daysLabel(countedAbsolute)}. Výpočet zahrnuje víkendy i svátky.`);
      setText("readingTitle", `Cílové datum je vzdálené ${formatNumber(countedAbsolute)} ${daysLabel(countedAbsolute)}.`);
      setText("readingText", `Termín leží v budoucnosti. Kalendářní rozpad odpovídá hodnotě ${calendarBreakdown}.`);
      setText("decisionSummary", countedAbsolute <= 14 ? "Termín je blízko; zkontrolujte, zda potřebujete kalendářní, nebo pracovní dny." : "Termín poskytuje delší horizont, ale pracovní kapacita může být kratší než kalendářní rozdíl.");
      setText("nextActionText", "U zakázky nebo úředního termínu navazujte kontrolou pracovních dnů a konkrétních pravidel lhůty.");
    } else if (rawDifference < 0) {
      setText("timingText", `Od cílového data uplynulo ${formatNumber(countedAbsolute)} ${daysLabel(countedAbsolute)}. Ve směrovém režimu se minulost zobrazí záporně.`);
      setText("readingTitle", `Od cílového data uplynulo ${formatNumber(countedAbsolute)} ${daysLabel(countedAbsolute)}.`);
      setText("readingText", `Cíl leží před počátečním datem. Absolutní vzdálenost má kalendářní rozpad ${calendarBreakdown}.`);
      setText("decisionSummary", "Záporný výsledek ve směrovém režimu není chyba; potvrzuje, že cíl leží v minulosti.");
      setText("nextActionText", "Pro přesný věk použijte kalkulačku věku; pro obecnou událost zůstává vhodný tento datumový rozdíl.");
    } else {
      setText("timingText", targetIncluded ? "Data jsou stejná a započítání cílového dne vytváří jednodenní období." : "Mezi stejnými daty není žádný celý kalendářní krok.");
      setText("readingTitle", targetIncluded ? "Stejné datum tvoří jednodenní období." : "Obě data označují stejný kalendářní den.");
      setText("readingText", targetIncluded ? "Cílový den je zahrnut, proto výsledek činí 1 den." : "Čistá vzdálenost je 0 dní. Zapnutím cílového dne získáte jednodenní období.");
      setText("decisionSummary", "Rozhodněte, zda chcete vzdálenost 0 dní, nebo období včetně jediného zadaného dne.");
      setText("nextActionText", "Volba závisí na tom, zda počítáte časový odstup, nebo počet zahrnutých kalendářních dnů.");
    }

    setText("heroDays", `${formatNumber(countedAbsolute)} ${daysLabel(countedAbsolute)}`);
    setText("heroDirection", status);
    setText("heroStart", dateFormatter.format(start));
    setText("heroTarget", dateFormatter.format(target));
    setText("heroWeeks", `${formatNumber(fullWeeks)} týd. + ${formatNumber(remainingDays)} d.`);
    setText("heroMonths", `${formatDecimal(approximateMonths)} měs.`);
    setText("heroMode", targetIncluded ? "včetně cílového dne" : "čistá vzdálenost");
    setText("directionStartLabel", toInputValue(start));
    setText("directionTargetLabel", toInputValue(target));

    const progress = Math.max(10, Math.min(96, 12 + Math.log10(countedAbsolute + 1) * 31));
    $("heroProgress").style.width = `${progress}%`;
    $("directionBar").style.width = `${progress}%`;

    const rows = [
      ["Počáteční datum", dateFormatter.format(start), "výchozí kalendářní den"],
      ["Cílové datum", dateFormatter.format(target), "porovnávaný termín"],
      ["Čistý rozdíl", `${formatNumber(absoluteDifference)} ${daysLabel(absoluteDifference)}`, "vzdálenost bez přidaného cílového dne"],
      ["Zobrazený výsledek", mainValue, signedMode ? "směrový režim" : "absolutní režim"],
      ["Týdenní rozpad", weekText, "celé týdny a zbývající dny"],
      ["Kalendářní rozpad", calendarBreakdown, "skutečné roky, měsíce a dny"],
      ["Cílový den", targetMode, targetIncluded ? "přidává jeden den" : "bez přidání dne"]
    ];
    $("summaryTableBody").replaceChildren(...rows.map((row) => {
      const tr = document.createElement("tr");
      row.forEach((cell) => {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      return tr;
    }));
  }

  function applyPreset(preset) {
    const today = todayLocal();
    let target;
    if (preset === "week") target = addDays(today, 7);
    if (preset === "month") target = addDays(today, 30);
    if (preset === "month-end") target = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    if (preset === "year-end") target = new Date(today.getFullYear(), 11, 31);
    if (!target) return;
    $("startDate").value = toInputValue(today);
    $("targetDate").value = toInputValue(target);
    render();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    if (window.matchMedia("(max-width: 980px)").matches) {
      $("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
  ["startDate", "targetDate", "calculationMode", "includeTargetDay"].forEach((id) => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });
  document.querySelectorAll("[data-days-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.daysPreset));
  });
  $("swapDatesBtn").addEventListener("click", () => {
    const start = $("startDate").value;
    $("startDate").value = $("targetDate").value;
    $("targetDate").value = start;
    render();
  });
  $("resetBtn").addEventListener("click", () => {
    setDefaults();
    render();
  });

  setDefaults();
  render();
})();
