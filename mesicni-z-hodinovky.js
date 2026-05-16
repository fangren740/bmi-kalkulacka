(function () {
  const form = document.getElementById("monthlyFromHourlyForm");
  if (!form) return;

  const MIN_HOURLY_2026 = 134.4;
  const $ = (id) => document.getElementById(id);
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const moneyNf = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0
  });

  const money = (value) => moneyNf.format(Number.isFinite(value) ? value : 0);
  const plainMoney = (value) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0)} Kč`;
  const hours = (value) => `${nf.format(Number.isFinite(value) ? value : 0)} h`;
  const setText = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };

  function num(id) {
    const el = $(id);
    return el ? Number(String(el.value).replace(",", ".")) || 0 : 0;
  }

  function readInput() {
    return {
      hourlyRate: Math.max(0, num("hourlyRate")),
      hoursPerWeek: Math.max(0, num("hoursPerWeek")),
      weeksPerMonth: Math.max(0, num("weeksPerMonth")),
      hoursPerMonthOverride: Math.max(0, num("hoursPerMonthOverride"))
    };
  }

  function calculate(input) {
    const derivedHours = input.hoursPerWeek * input.weeksPerMonth;
    const hoursPerMonth = input.hoursPerMonthOverride > 0 ? input.hoursPerMonthOverride : derivedHours;
    const weeklyPay = input.hourlyRate * input.hoursPerWeek;
    const monthlyPay = input.hourlyRate * hoursPerMonth;
    return {
      derivedHours,
      hoursPerMonth,
      hoursPerYear: hoursPerMonth * 12,
      weeklyPay,
      monthlyPay,
      yearlyPay: monthlyPay * 12,
      dayPay: input.hourlyRate * 8,
      longShiftPay: input.hourlyRate * 12,
      isOwnFund: input.hoursPerMonthOverride > 0,
      minimumDiff: input.hourlyRate - MIN_HOURLY_2026
    };
  }

  function status(input, result) {
    if (!input.hourlyRate || !result.hoursPerMonth) {
      return {
        badge: "Doplňte sazbu a hodiny",
        headline: "Výsledek zatím čeká na vstupy.",
        note: "Zadejte hodinovou sazbu a fond hodin. Kalkulačka dopočítá měsíční, týdenní i roční hrubý odhad."
      };
    }
    if (input.hourlyRate < MIN_HOURLY_2026) {
      return {
        badge: "Pod orientačním minimem",
        headline: "Hodinová sazba je pod orientační minimální hodinovou mzdou 2026.",
        note: `Při sazbě ${plainMoney(input.hourlyRate)} za hodinu vychází měsíční hrubá mzda ${plainMoney(result.monthlyPay)}. Než s částkou počítáte, ověřte aktuální pravidla, typ úvazku a smlouvu.`
      };
    }
    if (result.monthlyPay < 30000) {
      return {
        badge: "Nižší měsíční dopad",
        headline: "Měsíční částka je spíš nízká, proto ji porovnejte s čistou mzdou.",
        note: `Hrubý odhad ${plainMoney(result.monthlyPay)} může na účtu znamenat výrazně méně. Zkontrolujte čistou mzdu, příplatky a skutečný počet hodin v měsíci.`
      };
    }
    if (result.monthlyPay > 65000) {
      return {
        badge: "Silnější měsíční odhad",
        headline: "Měsíční hrubá mzda je výraznější, rozhoduje ale čistá částka a stabilita hodin.",
        note: `Při fondu ${hours(result.hoursPerMonth)} vychází hrubý odhad ${plainMoney(result.monthlyPay)}. U vyšších příjmů sledujte také roční dopad, bonusy a čistou mzdu.`
      };
    }
    return {
      badge: result.isOwnFund ? "Použit vlastní fond" : "Použit průměr 4,33 týdne",
      headline: "Výsledek je vhodný jako rychlý hrubý odhad měsíční mzdy.",
      note: `Při hodinové sazbě ${plainMoney(input.hourlyRate)} a fondu ${hours(result.hoursPerMonth)} vychází měsíční hrubá mzda přibližně ${plainMoney(result.monthlyPay)}. Jako další krok dopočítejte čistou mzdu.`
    };
  }

  function renderSummary(input, result) {
    const rows = [
      ["Hodinová sazba", `${plainMoney(input.hourlyRate)}/h`, "Hrubá odměna za jednu hodinu práce."],
      ["Týdenní úvazek", hours(input.hoursPerWeek), "Kolik hodin typicky odpracujete za týden."],
      ["Měsíční fond", hours(result.hoursPerMonth), result.isOwnFund ? "Ručně zadaný fond pro konkrétní měsíc." : "Týdenní hodiny přepočtené přes počet týdnů v měsíci."],
      ["Týdenní mzda", plainMoney(result.weeklyPay), "Hodinová sazba × týdenní fond."],
      ["Měsíční mzda", plainMoney(result.monthlyPay), "Hodinová sazba × měsíční fond."],
      ["Roční odhad", plainMoney(result.yearlyPay), "Měsíční odhad × 12 měsíců bez bonusů a výpadků."]
    ];
    const html = rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
    setText("summaryRows", "");
    const target = $("summaryRows");
    if (target) target.innerHTML = html;
  }

  function renderScenarios(input) {
    const scenarios = [
      ["160 h měsíc", 160],
      ["168 h měsíc", 168],
      ["173,2 h průměr", input.hoursPerWeek * 4.33],
      ["180 h silnější fond", 180]
    ];
    const target = $("scenarioRows");
    if (!target) return;
    target.innerHTML = scenarios.map(([label, h]) => `<tr><td>${label}</td><td>${hours(h)}</td><td>${plainMoney(input.hourlyRate * h)}</td></tr>`).join("");
  }

  function render(input, result) {
    const read = status(input, result);
    const barWidth = Math.max(8, Math.min(100, (result.hoursPerMonth / 180) * 100));
    const minimumText = input.hourlyRate >= MIN_HOURLY_2026 ? `+${plainMoney(result.minimumDiff)}/h` : `${plainMoney(result.minimumDiff)}/h`;

    setText("monthlyPayResult", plainMoney(result.monthlyPay));
    setText("yearlyPayResult", plainMoney(result.yearlyPay));
    setText("weeklyPayResult", plainMoney(result.weeklyPay));
    setText("shiftPayResult", plainMoney(result.dayPay));
    setText("hourlyRateResult", `${plainMoney(input.hourlyRate)}/h`);
    setText("hoursPerMonthResult", hours(result.hoursPerMonth));
    setText("hoursPerYearResult", hours(result.hoursPerYear));
    setText("longShiftPayResult", plainMoney(result.longShiftPay));
    setText("minimumCheck", minimumText);
    setText("resultBadge", read.badge);
    setText("resultStatus", read.headline);
    setText("resultNote", read.note);
    setText("decisionHeadline", read.headline);
    setText("decisionSummary", read.note);

    setText("heroMonthly", plainMoney(result.monthlyPay));
    setText("heroWeekly", plainMoney(result.weeklyPay));
    setText("heroYearly", plainMoney(result.yearlyPay));
    setText("heroShift", plainMoney(result.dayPay));
    setText("heroHours", hours(result.hoursPerMonth));
    setText("heroScenario", `${plainMoney(input.hourlyRate)}/h × ${hours(result.hoursPerMonth)}`);
    const heroBar = $("heroBar");
    if (heroBar) heroBar.style.width = `${barWidth}%`;

    const primary = document.querySelector(".monthly-primary");
    if (primary) {
      primary.classList.toggle("is-warning", input.hourlyRate > 0 && input.hourlyRate < MIN_HOURLY_2026);
    }

    renderSummary(input, result);
    renderScenarios(input);
  }

  function run() {
    const input = readInput();
    const result = calculate(input);
    render(input, result);
  }

  const presets = {
    standard: { hourlyRate: 220, hoursPerWeek: 40, weeksPerMonth: 4.33, hoursPerMonthOverride: "" },
    minimum: { hourlyRate: MIN_HOURLY_2026, hoursPerWeek: 40, weeksPerMonth: 4.33, hoursPerMonthOverride: "" },
    "part-time": { hourlyRate: 220, hoursPerWeek: 20, weeksPerMonth: 4.33, hoursPerMonthOverride: "" },
    "custom-hours": { hourlyRate: 220, hoursPerWeek: 40, weeksPerMonth: 4.33, hoursPerMonthOverride: 168 }
  };

  document.querySelectorAll("[data-hourly-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = presets[button.dataset.hourlyPreset];
      if (!preset) return;
      Object.entries(preset).forEach(([id, value]) => {
        const el = $(id);
        if (el) el.value = value;
      });
      run();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["hourlyRate", "hoursPerWeek", "weeksPerMonth", "hoursPerMonthOverride"].forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", run);
    el.addEventListener("change", run);
  });

  const reset = $("resetBtn");
  if (reset) {
    reset.addEventListener("click", () => {
      Object.entries(presets.standard).forEach(([id, value]) => {
        const el = $(id);
        if (el) el.value = value;
      });
      run();
    });
  }

  run();
})();
