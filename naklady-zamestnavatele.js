(function () {
  const form = document.getElementById("employerCostForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const CONFIG = {
    socialEmployer: 0.248,
    healthEmployer: 0.09,
    annualSocialCap: 2350416
  };

  const presets = {
    junior: { grossSalary: 35000, headcount: 1, monthlyBonus: 0, annualBonus: 0, monthlyExtras: 0 },
    standard: { grossSalary: 50000, headcount: 1, monthlyBonus: 0, annualBonus: 0, monthlyExtras: 0 },
    senior: { grossSalary: 75000, headcount: 1, monthlyBonus: 0, annualBonus: 0, monthlyExtras: 0 },
    team: { grossSalary: 50000, headcount: 3, monthlyBonus: 5000, annualBonus: 30000, monthlyExtras: 2500 },
    manager: { grossSalary: 120000, headcount: 1, monthlyBonus: 0, annualBonus: 150000, monthlyExtras: 5000 }
  };

  const formatNumber = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const formatDecimal = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const money = (value) => `${formatNumber.format(Math.round(Number(value) || 0))} Kč`;
  const pct = (value) => `${formatDecimal.format(Number(value) || 0)} %`;
  const roundUp = (value) => Math.ceil(Number(value) || 0);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function readInput() {
    const socialRateMode = $("socialRateMode")?.value || "standard";
    const customSocialRate = Math.max(0, Number($("customSocialRate")?.value) || 0) / 100;
    return {
      grossSalary: Math.max(0, Number($("grossSalary")?.value) || 0),
      headcount: clamp(Math.round(Number($("headcount")?.value) || 1), 1, 1000),
      monthlyBonus: Math.max(0, Number($("monthlyBonus")?.value) || 0),
      annualBonus: Math.max(0, Number($("annualBonus")?.value) || 0),
      monthlyExtras: Math.max(0, Number($("monthlyExtras")?.value) || 0),
      yearSocialBase: Math.max(0, Number($("yearSocialBase")?.value) || 0),
      applySocialCap: Boolean($("applySocialCap")?.checked),
      includeExtrasInTotal: Boolean($("includeExtrasInTotal")?.checked),
      socialRate: socialRateMode === "custom" ? customSocialRate : CONFIG.socialEmployer,
      socialRateMode
    };
  }

  function socialAnnualBase(input) {
    const taxableAnnual = (input.grossSalary + input.monthlyBonus) * 12 + input.annualBonus;
    if (!input.applySocialCap) return taxableAnnual;
    const remaining = Math.max(0, CONFIG.annualSocialCap - input.yearSocialBase);
    return Math.min(taxableAnnual, remaining);
  }

  function calculate(input) {
    const monthlyTaxableWage = input.grossSalary + input.monthlyBonus;
    const annualTaxableWage = monthlyTaxableWage * 12 + input.annualBonus;
    const annualSocialBase = socialAnnualBase(input);
    const annualEmployerSocialPerPerson = roundUp(annualSocialBase * input.socialRate);
    const annualEmployerHealthPerPerson = roundUp(annualTaxableWage * CONFIG.healthEmployer);
    const annualExtrasPerPerson = input.includeExtrasInTotal ? input.monthlyExtras * 12 : 0;
    const annualCostPerPerson = annualTaxableWage + annualEmployerSocialPerPerson + annualEmployerHealthPerPerson + annualExtrasPerPerson;
    const monthlyCostPerPerson = annualCostPerPerson / 12;
    const monthlySocialPerPerson = annualEmployerSocialPerPerson / 12;
    const monthlyHealthPerPerson = annualEmployerHealthPerPerson / 12;
    const monthlyExtrasPerPerson = input.includeExtrasInTotal ? input.monthlyExtras : 0;
    const monthlyWageBudget = monthlyTaxableWage * input.headcount;
    const monthlySocial = monthlySocialPerPerson * input.headcount;
    const monthlyHealth = monthlyHealthPerPerson * input.headcount;
    const monthlyExtras = monthlyExtrasPerPerson * input.headcount;
    const monthlyTotalCost = monthlyCostPerPerson * input.headcount;
    const annualTotalCost = annualCostPerPerson * input.headcount;
    const annualGrossTotal = annualTaxableWage * input.headcount;
    const monthlyContributions = monthlySocial + monthlyHealth;
    const upliftBase = monthlyWageBudget || 1;
    const uplift = ((monthlyTotalCost / upliftBase) - 1) * 100;
    const nonGrossShare = monthlyTotalCost > 0 ? ((monthlyContributions + monthlyExtras) / monthlyTotalCost) * 100 : 0;

    return {
      monthlyTaxableWage,
      annualTaxableWage,
      annualSocialBase,
      socialCapApplied: input.applySocialCap && annualSocialBase < annualTaxableWage,
      annualEmployerSocialPerPerson,
      annualEmployerHealthPerPerson,
      annualExtrasPerPerson,
      annualCostPerPerson,
      monthlyCostPerPerson,
      monthlySocialPerPerson,
      monthlyHealthPerPerson,
      monthlyWageBudget,
      monthlySocial,
      monthlyHealth,
      monthlyExtras,
      monthlyTotalCost,
      annualTotalCost,
      annualGrossTotal,
      monthlyContributions,
      uplift,
      nonGrossShare
    };
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function setBar(id, value, max, minVisible = 7) {
    const element = $(id);
    if (!element) return;
    const width = max > 0 ? clamp((value / max) * 100, minVisible, 100) : 0;
    element.style.width = `${width}%`;
  }

  function headcountText(count) {
    if (count === 1) return "1 člověk";
    if (count >= 2 && count <= 4) return `${count} lidi`;
    return `${count} lidí`;
  }

  function renderBreakdown(input, data) {
    const rows = [
      ["Hrubá mzda na osobu", money(input.grossSalary), "Sjednaná měsíční hrubá mzda"],
      ["Pravidelná měsíční odměna", money(input.monthlyBonus), "Zdanitelná měsíční částka navíc"],
      ["Měsíční hrubé mzdy celkem", money(data.monthlyWageBudget), `Hrubá mzda a odměny pro ${headcountText(input.headcount)}`],
      ["Sociální pojištění zaměstnavatele", money(data.monthlySocial), `${pct(input.socialRate * 100)} ze sociálního základu${data.socialCapApplied ? ", omezeno sociálním stropem" : ""}`],
      ["Zdravotní pojištění zaměstnavatele", money(data.monthlyHealth), "9 % z hrubých zdanitelných příjmů"],
      ["Benefity a režie", money(data.monthlyExtras), input.includeExtrasInTotal ? "Interní rozpočtový náklad započtený do ceny" : "Nezapočteno do celkového nákladu"],
      ["Měsíční cena práce", money(data.monthlyTotalCost), "Celkový měsíční náklad firmy"],
      ["Roční bonusy celkem", money(input.annualBonus * input.headcount), "Roční bonusy pro započtený počet lidí"],
      ["Roční cena práce", money(data.annualTotalCost), "Celkový roční rozpočet podle zadaného modelu"]
    ];

    const body = $("breakdownBody");
    if (body) body.innerHTML = rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function scenarioRows(input) {
    const grossValues = [input.grossSalary - 10000, input.grossSalary, input.grossSalary + 10000].filter((value) => value > 0);
    const rows = grossValues.map((gross) => {
      const scenarioInput = { ...input, grossSalary: gross };
      const scenario = calculate(scenarioInput);
      const label = gross === input.grossSalary ? "Aktuální" : gross < input.grossSalary ? "Nižší nabídka" : "Vyšší nabídka";
      return `<tr${gross === input.grossSalary ? " class=\"is-current\"" : ""}><td>${label}</td><td>${money(gross)}</td><td>${money(scenario.monthlyTotalCost)}</td><td>${money(scenario.annualTotalCost)}</td></tr>`;
    });
    const body = $("scenarioTableBody");
    if (body) body.innerHTML = rows.join("");
  }

  function updatePresetState(activeName) {
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.preset === activeName));
    });
  }

  function render(input, data) {
    const badgeLabel = data.monthlyTotalCost <= 60000 ? "Nižší náklad" : data.monthlyTotalCost <= 120000 ? "Střední náklad" : "Vyšší náklad";
    const capText = data.socialCapApplied ? " Sociální odvod je v ročním modelu omezen sociálním stropem." : "";
    const extrasText = input.includeExtrasInTotal && input.monthlyExtras > 0 ? ` V nákladu jsou započteny benefity a režie ${money(input.monthlyExtras)} měsíčně na osobu.` : "";

    setText("monthlyTotalCost", money(data.monthlyTotalCost));
    setText("yearlyTotalCost", money(data.annualTotalCost));
    setText("employerContributions", money(data.monthlyContributions));
    setText("employerSocial", money(data.monthlySocial));
    setText("employerHealth", money(data.monthlyHealth));
    setText("grossTotal", money(data.monthlyWageBudget));
    setText("extrasTotal", money(data.monthlyExtras));
    setText("costPerPerson", money(data.monthlyCostPerPerson));
    setText("upliftResult", pct(data.uplift));
    setText("contributionShare", pct(data.nonGrossShare));
    setText("resultNote", `Při hrubé mzdě ${money(input.grossSalary)} a počtu ${headcountText(input.headcount)} vychází měsíční náklad firmy ${money(data.monthlyTotalCost)} a roční náklad ${money(data.annualTotalCost)}.${extrasText}${capText}`);
    setText("decisionText", `Odvody a započtené položky navyšují mzdový rozpočet o ${pct(data.uplift)} proti hrubým mzdám. Pro rozhodnutí sledujte hlavně roční náklad a přínos role.`);
    setText("decisionTitle", badgeLabel === "Vyšší náklad" ? "Vyšší náklad vyžaduje jasný přínos role" : "Cena práce je pod kontrolou, ale plánujte celý rok");
    setText("decisionDetail", input.headcount > 1 ? "U týmu sledujte roční dopad a rezervu na slabší měsíce. Fixní náklady se násobí počtem lidí." : "U nové pozice přičtěte i nábor, vybavení, software, onboarding a čas manažera.");
    setText("heroMonthlyCost", money(data.monthlyTotalCost));
    setText("heroHeadcount", headcountText(input.headcount));
    setText("heroGross", money(input.grossSalary));
    setText("heroYearlyCost", money(data.annualTotalCost));
    setText("heroBaseCost", money(data.monthlyWageBudget));
    setText("heroContributions", money(data.monthlyContributions));
    setText("heroBenefits", money(data.monthlyExtras));

    const badge = $("resultBadge");
    if (badge) {
      badge.className = `badge ${badgeLabel === "Střední náklad" ? "warning" : badgeLabel === "Vyšší náklad" ? "risk" : ""}`.trim();
      badge.textContent = badgeLabel;
    }

    setBar("contributionShareBar", data.nonGrossShare, 100);
    setBar("heroGrossBar", data.monthlyWageBudget, data.monthlyTotalCost);
    setBar("heroContributionBar", data.monthlyContributions, data.monthlyTotalCost);
    setBar("heroBenefitsBar", data.monthlyExtras, data.monthlyTotalCost);
    renderBreakdown(input, data);
    scenarioRows(input);
  }

  function run() {
    const input = readInput();
    const data = calculate(input);
    render(input, data);
  }

  function applyPreset(name) {
    const preset = presets[name] || presets.standard;
    $("grossSalary").value = preset.grossSalary;
    $("headcount").value = preset.headcount;
    $("monthlyBonus").value = preset.monthlyBonus;
    $("annualBonus").value = preset.annualBonus;
    $("monthlyExtras").value = preset.monthlyExtras;
    $("yearSocialBase").value = 0;
    $("socialRateMode").value = "standard";
    $("customSocialRate").value = 24.8;
    $("applySocialCap").checked = true;
    $("includeExtrasInTotal").checked = true;
    updatePresetState(name);
    run();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["grossSalary", "headcount", "monthlyBonus", "annualBonus", "monthlyExtras", "yearSocialBase", "socialRateMode", "customSocialRate", "applySocialCap", "includeExtrasInTotal"].forEach((id) => {
    const element = $(id);
    if (!element) return;
    element.addEventListener("input", () => {
      updatePresetState("");
      run();
    });
    element.addEventListener("change", () => {
      updatePresetState("");
      run();
    });
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });

  $("resetBtn")?.addEventListener("click", () => applyPreset("standard"));
  applyPreset("standard");
})();
