(() => {
  "use strict";

  const CONFIG = {
    healthEmployer: 0.09,
    socialCap2026: 2350416,
    partTimeDiscount: 0.05
  };

  const $ = (id) => document.getElementById(id);
  const form = $("employerCostForm");
  if (!form) return;

  const moneyFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const decimalFormatter = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (value) => `${moneyFormatter.format(Math.round(Number.isFinite(value) ? value : 0))} Kč`;
  const decimalMoney = (value) => `${decimalFormatter.format(Number.isFinite(value) ? value : 0)} Kč`;
  const pct = (value, digits = 1) => `${new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0)} %`;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const numberValue = (id, fallback = 0) => {
    const value = Number($(id)?.value);
    return Number.isFinite(value) ? value : fallback;
  };
  const ceilCzk = (value) => Math.ceil(Math.max(0, value));

  function employeeLabel(count) {
    if (count === 1) return "1 zaměstnanec";
    if (count >= 2 && count <= 4) return `${count} zaměstnanci`;
    return `${count} zaměstnanců`;
  }

  function readInput() {
    const socialMode = $("socialRateMode")?.value || "24.8";
    const customRate = clamp(numberValue("customSocialRate", 24.8), 0, 50);
    return {
      grossSalary: clamp(numberValue("grossSalary", 50000), 0, 10000000),
      headcount: Math.round(clamp(numberValue("headcount", 1), 1, 10000)),
      months: Math.round(clamp(numberValue("months", 12), 1, 12)),
      monthlyBonus: clamp(numberValue("monthlyBonus"), 0, 10000000),
      annualBonus: clamp(numberValue("annualBonus"), 0, 100000000),
      monthlyExtras: clamp(numberValue("monthlyExtras"), 0, 10000000),
      oneOffCost: clamp(numberValue("oneOffCost"), 0, 100000000),
      socialRate: (socialMode === "custom" ? customRate : Number(socialMode)) / 100,
      socialMode,
      yearSocialBase: clamp(numberValue("yearSocialBase"), 0, 100000000),
      monthlyHours: clamp(numberValue("monthlyHours", 174), 1, 300),
      applySocialCap: Boolean($("applySocialCap")?.checked),
      applyPartTimeDiscount: Boolean($("applyPartTimeDiscount")?.checked)
    };
  }

  function calculate(input) {
    const monthlyTaxablePerPerson = input.grossSalary + input.monthlyBonus;
    const periodTaxablePerPerson = monthlyTaxablePerPerson * input.months + input.annualBonus;
    const remainingSocialBase = input.applySocialCap ? Math.max(0, CONFIG.socialCap2026 - input.yearSocialBase) : periodTaxablePerPerson;
    const socialBasePerPerson = input.applySocialCap ? Math.min(periodTaxablePerPerson, remainingSocialBase) : periodTaxablePerPerson;
    const socialGrossPerPerson = ceilCzk(socialBasePerPerson * input.socialRate);
    const discountPerPerson = input.applyPartTimeDiscount ? ceilCzk(socialBasePerPerson * CONFIG.partTimeDiscount) : 0;
    const socialPeriodPerPerson = Math.max(0, socialGrossPerPerson - discountPerPerson);
    const healthPeriodPerPerson = ceilCzk(periodTaxablePerPerson * CONFIG.healthEmployer);
    const extrasPeriodPerPerson = input.monthlyExtras * input.months + input.oneOffCost;
    const totalPeriodPerPerson = periodTaxablePerPerson + socialPeriodPerPerson + healthPeriodPerPerson + extrasPeriodPerPerson;
    const monthlyAveragePerPerson = totalPeriodPerPerson / input.months;

    const periodTotal = totalPeriodPerPerson * input.headcount;
    const monthlyTotal = monthlyAveragePerPerson * input.headcount;
    const grossMonthlyTotal = monthlyTaxablePerPerson * input.headcount;
    const grossPeriodTotal = periodTaxablePerPerson * input.headcount;
    const socialMonthlyAverage = (socialPeriodPerPerson / input.months) * input.headcount;
    const healthMonthlyAverage = (healthPeriodPerPerson / input.months) * input.headcount;
    const extrasMonthlyAverage = (extrasPeriodPerPerson / input.months) * input.headcount;
    const monthlyLevies = socialMonthlyAverage + healthMonthlyAverage;
    const ratio = grossPeriodTotal > 0 ? (periodTotal / grossPeriodTotal) * 100 : 0;
    const nonWageShare = monthlyTotal > 0 ? ((monthlyTotal - grossMonthlyTotal) / monthlyTotal) * 100 : 0;
    const hourCost = monthlyAveragePerPerson / input.monthlyHours;

    return {
      monthlyTaxablePerPerson,
      periodTaxablePerPerson,
      socialBasePerPerson,
      capApplied: input.applySocialCap && socialBasePerPerson < periodTaxablePerPerson,
      socialGrossPerPerson,
      discountPerPerson,
      socialPeriodPerPerson,
      healthPeriodPerPerson,
      extrasPeriodPerPerson,
      totalPeriodPerPerson,
      monthlyAveragePerPerson,
      periodTotal,
      monthlyTotal,
      grossMonthlyTotal,
      grossPeriodTotal,
      socialMonthlyAverage,
      healthMonthlyAverage,
      extrasMonthlyAverage,
      monthlyLevies,
      ratio,
      nonWageShare,
      hourCost
    };
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function setSegment(id, value, total) {
    const element = $(id);
    if (!element) return;
    const width = total > 0 && value > 0 ? Math.max(1.5, (value / total) * 100) : 0;
    element.style.width = `${Math.min(100, width)}%`;
  }

  function renderBreakdown(input, data) {
    const rows = [
      ["Hrubá mzda a měsíční bonus", data.monthlyTaxablePerPerson, data.grossMonthlyTotal],
      ["Průměrné sociální pojištění firmy", data.socialPeriodPerPerson / input.months, data.socialMonthlyAverage],
      ["Průměrné zdravotní pojištění firmy", data.healthPeriodPerPerson / input.months, data.healthMonthlyAverage],
      ["Benefity, režie a onboarding", data.extrasPeriodPerPerson / input.months, data.extrasMonthlyAverage],
      ["Měsíční náklad celkem", data.monthlyAveragePerPerson, data.monthlyTotal],
      [`Náklad za ${input.months} měsíců`, data.totalPeriodPerPerson, data.periodTotal]
    ];
    const body = $("breakdownBody");
    if (body) body.innerHTML = rows.map(([label, perPerson, total]) => `<tr><td>${label}</td><td>${money(perPerson)}</td><td>${money(total)}</td></tr>`).join("");
  }

  function renderScenarios(input) {
    const changes = [-0.1, 0, 0.1];
    const labels = ["O 10 % nižší", "Aktuální", "O 10 % vyšší"];
    const rows = changes.map((change, index) => {
      const gross = Math.max(0, input.grossSalary * (1 + change));
      const scenarioInput = { ...input, grossSalary: gross };
      const data = calculate(scenarioInput);
      return `<tr${change === 0 ? ' class="is-current"' : ""}><td>${labels[index]}</td><td>${money(gross)}</td><td>${money(data.monthlyTotal)}</td><td>${money(data.periodTotal)}</td><td>${decimalMoney(data.ratio)}</td></tr>`;
    });
    const body = $("scenarioTableBody");
    if (body) body.innerHTML = rows.join("");
  }

  function render(input, data) {
    const employeeText = employeeLabel(input.headcount);
    const extrasActive = data.extrasMonthlyAverage > 0;
    const discountText = input.applyPartTimeDiscount ? ` Sleva na pojistném snižuje sociální odvod za období o ${money(data.discountPerPerson * input.headcount)}.` : "";
    const capText = data.capApplied ? " Sociální pojištění je omezeno zadaným zbývajícím ročním stropem." : "";
    const ratioText = data.ratio > 0 ? `100 Kč hrubé mzdy stojí firmu ${decimalMoney(data.ratio)}` : "Zadejte hrubou mzdu";

    setText("monthlyTotalCost", money(data.monthlyTotal));
    setText("monthlyResultCaption", `${employeeText}, průměr za ${input.months} měsíců`);
    setText("costPerPerson", money(data.monthlyAveragePerPerson));
    setText("periodTotalCost", money(data.periodTotal));
    setText("monthlyLevies", money(data.monthlyLevies));
    setText("hourCost", money(data.hourCost));
    setText("grossTotal", money(data.grossMonthlyTotal));
    setText("socialTotal", money(data.socialMonthlyAverage));
    setText("healthTotal", money(data.healthMonthlyAverage));
    setText("extrasTotal", money(data.extrasMonthlyAverage));
    setText("nonWageShare", `${pct(data.nonWageShare)} mimo hrubou mzdu`);
    setText("decisionTitle", ratioText);
    setText("decisionText", `V modelu tvoří povinné odvody a zadané další náklady ${pct(data.nonWageShare)} měsíční ceny pozice.${discountText}${capText}`);
    setText("heroTotal", money(data.monthlyTotal));
    setText("heroPeople", employeeText);
    setText("heroGross", money(data.grossMonthlyTotal));
    setText("heroLevies", money(data.monthlyLevies));
    setText("heroAnnual", money(data.periodTotal));
    setText("heroRatio", decimalMoney(data.ratio));

    const badge = $("resultBadge");
    if (badge) badge.textContent = data.capApplied ? "Sociální strop aktivní" : input.applyPartTimeDiscount ? "Sleva 5 % aktivní" : extrasActive ? "Rozšířený rozpočet" : "Standardní model";

    const gross = data.grossMonthlyTotal;
    const total = data.monthlyTotal;
    setSegment("grossBar", gross, total);
    setSegment("socialBar", data.socialMonthlyAverage, total);
    setSegment("healthBar", data.healthMonthlyAverage, total);
    setSegment("extrasBar", data.extrasMonthlyAverage, total);
    setSegment("heroGrossBar", gross, total);
    setSegment("heroSocialBar", data.socialMonthlyAverage, total);
    setSegment("heroHealthBar", data.healthMonthlyAverage, total);
    setSegment("heroExtrasBar", data.extrasMonthlyAverage, total);

    renderBreakdown(input, data);
    renderScenarios(input);
  }

  function run() {
    const input = readInput();
    render(input, calculate(input));
  }

  function setMode(mode) {
    const advanced = mode === "advanced";
    $("basicModeBtn")?.classList.toggle("is-active", !advanced);
    $("advancedModeBtn")?.classList.toggle("is-active", advanced);
    $("basicModeBtn")?.setAttribute("aria-selected", String(!advanced));
    $("advancedModeBtn")?.setAttribute("aria-selected", String(advanced));
    if ($("basicMode")) $("basicMode").hidden = advanced;
    if ($("advancedMode")) $("advancedMode").hidden = !advanced;
  }

  function reset() {
    form.reset();
    $("grossSalary").value = 50000;
    $("headcount").value = 1;
    $("months").value = 12;
    $("monthlyHours").value = 174;
    $("socialRateMode").value = "24.8";
    $("customSocialRate").value = 24.8;
    $("applySocialCap").checked = true;
    $("applyPartTimeDiscount").checked = false;
    document.querySelectorAll("[data-gross]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.gross === "50000")));
    $("customSocialField").hidden = true;
    setMode("basic");
    run();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  form.addEventListener("input", (event) => {
    if (event.target.matches("input,select")) run();
  });

  form.addEventListener("change", (event) => {
    if (event.target.id === "socialRateMode") $("customSocialField").hidden = event.target.value !== "custom";
    run();
  });

  $("basicModeBtn")?.addEventListener("click", () => setMode("basic"));
  $("advancedModeBtn")?.addEventListener("click", () => setMode("advanced"));
  $("resetBtn")?.addEventListener("click", reset);

  document.querySelectorAll("[data-gross]").forEach((button) => {
    button.addEventListener("click", () => {
      $("grossSalary").value = button.dataset.gross;
      document.querySelectorAll("[data-gross]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      run();
    });
  });

  $("breakdownToggle")?.addEventListener("click", () => {
    const panel = $("breakdownPanel");
    const button = $("breakdownToggle");
    if (!panel || !button) return;
    panel.hidden = !panel.hidden;
    button.setAttribute("aria-expanded", String(!panel.hidden));
    button.querySelector("span").textContent = panel.hidden ? "Zobrazit podrobný rozpad" : "Skrýt podrobný rozpad";
    button.querySelector("b").textContent = panel.hidden ? "+" : "−";
  });

  $("customSocialField").hidden = true;
  setMode("basic");
  run();
})();
