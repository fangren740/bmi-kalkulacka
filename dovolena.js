(function () {
  const form = document.getElementById("vacationForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const pf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });

  const outputs = {
    remainingHours: $("remainingHours"),
    remainingSummary: $("remainingSummary"),
    decisionSummary: $("decisionSummary"),
    statusBadge: $("statusBadge"),
    annualHours: $("annualHours"),
    earnedHours: $("earnedHours"),
    usedOutput: $("usedOutput"),
    remainingDays: $("remainingDays"),
    annualDays: $("annualDays"),
    earnedDays: $("earnedDays"),
    summaryWeeks: $("summaryWeeks"),
    summaryWeeklyHours: $("summaryWeeklyHours"),
    summaryTableBody: $("summaryTableBody"),
    resultReadingTitle: $("resultReadingTitle"),
    resultReadingText: $("resultReadingText"),
    usedShareBar: $("usedShareBar"),
    remainingShareBar: $("remainingShareBar"),
    usedShareText: $("usedShareText"),
    remainingShareText: $("remainingShareText"),
    heroRemaining: $("heroRemaining"),
    heroEarned: $("heroEarned"),
    heroUsed: $("heroUsed"),
    heroDays: $("heroDays"),
    heroUsedBar: $("heroUsedBar"),
    heroRemainingBar: $("heroRemainingBar"),
    heroWeekly: $("heroWeekly"),
    heroWeeks: $("heroWeeks"),
    heroMonths: $("heroMonths")
  };

  function number(id) {
    const field = $(id);
    return field ? Number(field.value.toString().replace(",", ".")) || 0 : 0;
  }

  function unit(value, one, few, many) {
    const absolute = Math.abs(value);
    const integer = Number.isInteger(absolute);
    if (integer && absolute === 1) return one;
    if (integer && absolute >= 2 && absolute <= 4) return few;
    return many;
  }

  function hours(value) {
    return `${nf.format(value)} h`;
  }

  function days(value) {
    return `${nf.format(value)} ${unit(value, "den", "dny", "dnů")}`;
  }

  function weeks(value) {
    return `${nf.format(value)} ${unit(value, "týden", "týdny", "týdnů")}`;
  }

  function moneylessPercent(value) {
    return `${pf.format(value)} %`;
  }

  function setText(target, value) {
    if (target) target.textContent = value;
  }

  function setClass(target, value) {
    if (target) target.className = value;
  }

  function setWidth(target, value) {
    if (target) target.style.width = value;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function values() {
    return {
      weeklyHours: number("weeklyHours"),
      annualWeeks: number("annualWeeks"),
      monthsWorked: number("monthsWorked"),
      usedHours: number("usedHours"),
      workdayHours: number("workdayHours")
    };
  }

  function validate(input) {
    if (input.weeklyHours <= 0 || input.weeklyHours > 80) return "Zadejte platný týdenní úvazek.";
    if (input.annualWeeks <= 0 || input.annualWeeks > 10) return "Zadejte platnou roční výměru dovolené.";
    if (input.monthsWorked <= 0 || input.monthsWorked > 12) return "Počet měsíců musí být 1 až 12.";
    if (input.usedHours < 0) return "Vyčerpaná dovolená nemůže být záporná.";
    if (input.workdayHours <= 0 || input.workdayHours > 16) return "Zadejte platnou délku pracovního dne.";
    return "";
  }

  function calculate(input) {
    const annualHours = input.weeklyHours * input.annualWeeks;
    const earnedHours = annualHours * (input.monthsWorked / 12);
    const remainingHours = earnedHours - input.usedHours;
    const annualDays = annualHours / input.workdayHours;
    const earnedDays = earnedHours / input.workdayHours;
    const remainingDays = remainingHours / input.workdayHours;
    const usedShare = earnedHours > 0 ? (input.usedHours / earnedHours) * 100 : 0;
    const remainingShare = earnedHours > 0 ? (remainingHours / earnedHours) * 100 : 0;

    return {
      annualHours,
      earnedHours,
      remainingHours,
      annualDays,
      earnedDays,
      remainingDays,
      usedShare,
      remainingShare
    };
  }

  function setStatus(result, input) {
    setClass(outputs.statusBadge, "badge success");

    if (result.remainingHours < 0) {
      setText(outputs.statusBadge, "Zůstatek vychází přečerpaný");
      setClass(outputs.statusBadge, "badge warning");
      setText(outputs.remainingSummary, `Podle zadaných hodnot je vyčerpáno o ${hours(Math.abs(result.remainingHours))} více, než odpovídá poměrné části. Ověřte evidenci dovolené, převody a případnou změnu úvazku.`);
      setText(outputs.decisionSummary, "Tohle je rizikový signál pro kontrolu s personalistikou. Nejdřív ověřte vyčerpané hodiny a období, za které poměrnou část počítáte.");
      setText(outputs.resultReadingTitle, "Výsledek ukazuje přečerpání dovolené.");
      setText(outputs.resultReadingText, `Přečerpání o ${hours(Math.abs(result.remainingHours))} nemusí automaticky znamenat chybu, ale je potřeba ho porovnat s interní evidencí, převodem dovolené a pravidly zaměstnavatele.`);
      return;
    }

    if (result.remainingHours <= input.workdayHours) {
      setText(outputs.statusBadge, "Zbývá už jen malá rezerva");
      setClass(outputs.statusBadge, "badge warning");
      setText(outputs.remainingSummary, `Zbývá přibližně ${hours(result.remainingHours)}, tedy ${days(result.remainingDays)} při délce dne ${hours(input.workdayHours)}. Další volno už plánujte proti přesné evidenci směn.`);
      setText(outputs.decisionSummary, "Rezerva je nízká. Před žádostí o delší volno zkontrolujte, zda se do evidence nepromítá jiná délka směny.");
      setText(outputs.resultReadingTitle, "Zůstatek je nízký a vyplatí se ho ověřit.");
      setText(outputs.resultReadingText, "Když zbývá zhruba jeden pracovní den nebo méně, i drobný rozdíl v hodinách, směně nebo zaokrouhlení může změnit praktické plánování volna.");
      return;
    }

    setText(outputs.statusBadge, "Zůstatek je orientačně v pořádku");
    setText(outputs.remainingSummary, `Zbývá přibližně ${hours(result.remainingHours)}, tedy ${days(result.remainingDays)} při délce pracovního dne ${hours(input.workdayHours)}. Výsledek je vhodný jako rychlá kontrola proti evidenci zaměstnavatele.`);
    setText(outputs.decisionSummary, "Číslo působí bezpečně pro běžné plánování. U směnného provozu nebo změny úvazku si přesto ověřte, kolik hodin se odečte za konkrétní dny volna.");
    setText(outputs.resultReadingTitle, "Zůstatek dovoluje plánovat další volno.");
    setText(outputs.resultReadingText, `Poměrná část vychází ${hours(result.earnedHours)} a po odečtení čerpání zbývá ${hours(result.remainingHours)}. Přepočet na dny používejte hlavně pro orientaci v kalendáři.`);
  }

  function renderTable(input, result) {
    const rows = [
      ["Roční nárok", hours(result.annualHours), `${weeks(input.annualWeeks)} × ${hours(input.weeklyHours)} týdenního úvazku`],
      ["Poměrná část", hours(result.earnedHours), `${input.monthsWorked} z 12 měsíců v modelu`],
      ["Vyčerpaná dovolená", hours(input.usedHours), "Už odečtené hodiny dovolené"],
      ["Zůstatek", hours(result.remainingHours), "Poměrná část minus vyčerpané hodiny"],
      ["Přepočet na dny", days(result.remainingDays), `Děleno délkou pracovního dne ${hours(input.workdayHours)}`],
      ["Podíl čerpání", moneylessPercent(result.usedShare), "Kolik z poměrné části je už vyčerpáno"]
    ];

    if (!outputs.summaryTableBody) return;
    outputs.summaryTableBody.innerHTML = rows.map((row) => (
      `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`
    )).join("");
  }

  function renderBars(result) {
    const usedShare = clamp(result.usedShare, 0, 100);
    const remainingShare = clamp(result.remainingShare, 0, 100);

    setText(outputs.usedShareText, moneylessPercent(usedShare));
    setText(outputs.remainingShareText, moneylessPercent(remainingShare));
    setWidth(outputs.usedShareBar, `${Math.max(4, usedShare)}%`);
    setWidth(outputs.remainingShareBar, `${Math.max(4, remainingShare)}%`);
    setWidth(outputs.heroUsedBar, `${Math.max(5, usedShare)}%`);
    setWidth(outputs.heroRemainingBar, `${Math.max(5, remainingShare)}%`);
  }

  function render(input, result) {
    setText(outputs.remainingHours, hours(result.remainingHours));
    setText(outputs.annualHours, hours(result.annualHours));
    setText(outputs.earnedHours, hours(result.earnedHours));
    setText(outputs.usedOutput, hours(input.usedHours));
    setText(outputs.remainingDays, days(result.remainingDays));
    setText(outputs.annualDays, days(result.annualDays));
    setText(outputs.earnedDays, days(result.earnedDays));
    setText(outputs.summaryWeeks, weeks(input.annualWeeks));
    setText(outputs.summaryWeeklyHours, hours(input.weeklyHours));

    setText(outputs.heroRemaining, hours(result.remainingHours));
    setText(outputs.heroEarned, hours(result.earnedHours));
    setText(outputs.heroUsed, hours(input.usedHours));
    setText(outputs.heroDays, days(result.remainingDays));
    setText(outputs.heroWeekly, hours(input.weeklyHours));
    setText(outputs.heroWeeks, weeks(input.annualWeeks));
    setText(outputs.heroMonths, `${input.monthsWorked}/12`);

    setStatus(result, input);
    renderBars(result);
    renderTable(input, result);
  }

  function run() {
    const input = values();
    const error = validate(input);

    if (error) {
      setText(outputs.statusBadge, error);
      setClass(outputs.statusBadge, "badge warning");
      return;
    }

    render(input, calculate(input));
  }

  document.querySelectorAll("[data-vacation-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.vacationPreset;

      if (preset === "full") {
        $("weeklyHours").value = 40;
        $("annualWeeks").value = 5;
        $("monthsWorked").value = 12;
        $("usedHours").value = 40;
        $("workdayHours").value = 8;
      }

      if (preset === "part") {
        $("weeklyHours").value = 30;
        $("annualWeeks").value = 5;
        $("monthsWorked").value = 8;
        $("usedHours").value = 30;
        $("workdayHours").value = 6;
      }

      if (preset === "new") {
        $("weeklyHours").value = 40;
        $("annualWeeks").value = 5;
        $("monthsWorked").value = 4;
        $("usedHours").value = 0;
        $("workdayHours").value = 8;
      }

      run();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["weeklyHours", "annualWeeks", "monthsWorked", "usedHours", "workdayHours"].forEach((id) => {
    const field = $(id);
    field.addEventListener("input", run);
    field.addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("weeklyHours").value = 40;
    $("annualWeeks").value = 5;
    $("monthsWorked").value = 12;
    $("usedHours").value = 40;
    $("workdayHours").value = 8;
    run();
  });

  run();
})();
