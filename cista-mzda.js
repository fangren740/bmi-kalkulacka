(function () {
  const form = document.getElementById("salaryForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const money = (value) => `${Math.round(Number.isFinite(value) ? value : 0).toLocaleString("cs-CZ")} Kč`;
  const pct = (value) => `${nf.format(Number.isFinite(value) ? value : 0)} %`;
  const roundUp = (value) => Math.ceil(Math.max(0, Number(value) || 0));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const CONFIG = {
    socialEmployee: 0.071,
    healthEmployee: 0.045,
    healthTotal: 0.135,
    socialEmployer: 0.248,
    healthEmployer: 0.09,
    taxBasic: 0.15,
    taxHigh: 0.23,
    highTaxMonthlyThreshold: 146901,
    taxpayerDiscount: 2570,
    childCredits: [1267, 1860, 2320],
    annualSocialCap: 2350416,
    healthMinimumBase: 22400
  };

  const PRESETS = {
    standard: { grossSalary: 45000, bonusSalary: 0, otherDeductions: 0, children: 0, yearSocialBase: 0, healthMinimumMode: "off", taxpayerDiscount: true, applySocialCap: true },
    entry: { grossSalary: 32000, bonusSalary: 0, otherDeductions: 0, children: 0, yearSocialBase: 0, healthMinimumMode: "off", taxpayerDiscount: true, applySocialCap: true },
    family: { grossSalary: 52000, bonusSalary: 0, otherDeductions: 0, children: 2, yearSocialBase: 0, healthMinimumMode: "off", taxpayerDiscount: true, applySocialCap: true },
    higher: { grossSalary: 90000, bonusSalary: 0, otherDeductions: 0, children: 0, yearSocialBase: 0, healthMinimumMode: "off", taxpayerDiscount: true, applySocialCap: true },
    top: { grossSalary: 180000, bonusSalary: 0, otherDeductions: 0, children: 0, yearSocialBase: 0, healthMinimumMode: "off", taxpayerDiscount: true, applySocialCap: true }
  };

  const inputIds = ["grossSalary", "bonusSalary", "otherDeductions", "children", "yearSocialBase", "healthMinimumMode", "taxpayerDiscount", "applySocialCap"];

  function numeric(id) {
    return Math.max(0, Number($(id)?.value) || 0);
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function setWidth(id, value) {
    const element = $(id);
    if (element) element.style.width = value;
  }

  function childCredit(children) {
    let total = 0;
    for (let i = 0; i < children; i += 1) {
      total += CONFIG.childCredits[Math.min(i, 2)];
    }
    return total;
  }

  function taxBase(gross) {
    if (gross <= 0) return 0;
    return Math.ceil(gross / 100) * 100;
  }

  function progressiveTax(base) {
    const basic = Math.min(base, CONFIG.highTaxMonthlyThreshold);
    const high = Math.max(0, base - CONFIG.highTaxMonthlyThreshold);
    return roundUp(basic * CONFIG.taxBasic + high * CONFIG.taxHigh);
  }

  function readInput() {
    return {
      grossBase: numeric("grossSalary"),
      bonus: numeric("bonusSalary"),
      otherDeductions: numeric("otherDeductions"),
      children: clamp(Math.round(numeric("children")), 0, 5),
      yearSocialBase: numeric("yearSocialBase"),
      healthMinimumMode: $("healthMinimumMode")?.value || "off",
      taxpayerDiscount: $("taxpayerDiscount")?.checked ?? true,
      applySocialCap: $("applySocialCap")?.checked ?? true
    };
  }

  function socialBase(input, gross) {
    if (!input.applySocialCap) return gross;
    if (input.yearSocialBase > 0) {
      return Math.max(0, Math.min(gross, CONFIG.annualSocialCap - input.yearSocialBase));
    }
    return Math.min(gross, CONFIG.annualSocialCap / 12);
  }

  function calculate(input) {
    const gross = input.grossBase + input.bonus;
    const socialAssessment = socialBase(input, gross);
    const socialCapUsed = input.applySocialCap && socialAssessment < gross;
    const socialEmployee = roundUp(socialAssessment * CONFIG.socialEmployee);
    const socialEmployer = roundUp(socialAssessment * CONFIG.socialEmployer);

    const healthBase = input.healthMinimumMode === "full" ? Math.max(gross, CONFIG.healthMinimumBase) : gross;
    const healthSupplementBase = Math.max(0, healthBase - gross);
    const healthEmployee = roundUp(gross * CONFIG.healthEmployee + healthSupplementBase * CONFIG.healthTotal);
    const healthEmployer = roundUp(gross * CONFIG.healthEmployer);

    const baseForTax = taxBase(gross);
    const taxBeforeDiscounts = progressiveTax(baseForTax);
    const taxpayerDiscount = input.taxpayerDiscount ? CONFIG.taxpayerDiscount : 0;
    const childrenCredit = childCredit(input.children);
    const taxAfterTaxpayer = Math.max(0, taxBeforeDiscounts - taxpayerDiscount);
    const taxAfterChildrenRaw = taxAfterTaxpayer - childrenCredit;
    const taxAfterDiscounts = Math.max(0, taxAfterChildrenRaw);
    const taxBonus = Math.max(0, -taxAfterChildrenRaw);
    const employeeDeductions = socialEmployee + healthEmployee;
    const netBeforeOther = gross - employeeDeductions - taxAfterDiscounts + taxBonus;
    const netSalary = Math.max(0, Math.round(netBeforeOther - input.otherDeductions));
    const totalCost = Math.round(gross + socialEmployer + healthEmployer);
    const discountsTotal = taxpayerDiscount + childrenCredit + taxBonus;
    const netRatio = gross > 0 ? netSalary / gross * 100 : 0;
    const deductionsTotal = employeeDeductions + taxAfterDiscounts + input.otherDeductions - taxBonus;
    const deductionsShare = gross > 0 ? deductionsTotal / gross * 100 : 0;
    const highTaxBase = Math.max(0, baseForTax - CONFIG.highTaxMonthlyThreshold);

    return {
      ...input,
      gross,
      socialAssessment,
      socialCapUsed,
      healthBase,
      healthSupplementBase,
      socialEmployee,
      socialEmployer,
      healthEmployee,
      healthEmployer,
      employeeDeductions,
      baseForTax,
      taxBeforeDiscounts,
      taxpayerDiscount,
      childrenCredit,
      taxAfterDiscounts,
      taxBonus,
      netBeforeOther,
      netSalary,
      totalCost,
      discountsTotal,
      netRatio,
      deductionsTotal,
      deductionsShare,
      highTaxBase,
      annualNet: netSalary * 12,
      annualGross: gross * 12,
      annualCost: totalCost * 12
    };
  }

  function buildNote(result) {
    const notes = [];
    notes.push(`Z hrubé mzdy ${money(result.gross)} vychází orientační čistá mzda ${money(result.netSalary)}.`);
    notes.push(result.taxpayerDiscount ? "Je uplatněna sleva na poplatníka." : "Sleva na poplatníka není uplatněna.");
    if (result.children > 0) notes.push(`Započítáno je daňové zvýhodnění na ${result.children} ${result.children === 1 ? "dítě" : "děti"}.`);
    if (result.taxBonus > 0) notes.push(`Vzniká orientační daňový bonus ${money(result.taxBonus)}.`);
    if (result.highTaxBase > 0) notes.push(`Část základu ${money(result.highTaxBase)} spadá do 23% pásma.`);
    if (result.socialCapUsed) notes.push("Sociální pojištění je v modelu omezené ročním stropem.");
    if (result.healthSupplementBase > 0) notes.push(`Zdravotní pojištění je dopočtené do minimálního základu ${money(CONFIG.healthMinimumBase)}.`);
    if (result.otherDeductions > 0) notes.push(`Po výpočtu čisté mzdy se odečítají jiné srážky ${money(result.otherDeductions)}.`);
    return notes.join(" ");
  }

  function badge(result) {
    const el = $("resultBadge");
    if (!el) return;
    el.className = "badge";
    if (result.netRatio >= 80) {
      el.textContent = "Vyšší čistý podíl";
    } else if (result.netRatio >= 72) {
      el.textContent = "Běžný čistý podíl";
      el.classList.add("warning");
    } else {
      el.textContent = "Vyšší zatížení";
      el.classList.add("risk");
    }
  }

  function rows(result) {
    return [
      ["Hrubá mzda", money(result.grossBase), "Smluvní hrubá měsíční mzda"],
      ["Prémie a odměny", money(result.bonus), "Zdanitelná částka navíc v měsíci"],
      ["Hrubá mzda celkem", money(result.gross), "Základ pro daň a pojistné"],
      ["Sociální pojištění zaměstnance", `− ${money(result.socialEmployee)}`, `${pct(CONFIG.socialEmployee * 100)} ze základu ${money(result.socialAssessment)}`],
      ["Zdravotní pojištění zaměstnance", `− ${money(result.healthEmployee)}`, result.healthSupplementBase > 0 ? "Včetně dopočtu do zdravotního minima" : "4,5 % z hrubé mzdy"],
      ["Základ pro daň", money(result.baseForTax), "Hrubá mzda zaokrouhlená na stovky nahoru"],
      ["Daň před slevami", money(result.taxBeforeDiscounts), result.highTaxBase > 0 ? "15 % + 23 % z části nad limit" : "15% pásmo"],
      ["Sleva na poplatníka", `− ${money(result.taxpayerDiscount)}`, "Základní měsíční sleva, pokud ji uplatňujete"],
      ["Daňové zvýhodnění na děti", `− ${money(result.childrenCredit)}`, "Podle zadaného počtu dětí"],
      ["Daň po slevách", `− ${money(result.taxAfterDiscounts)}`, "Záloha po slevách a zvýhodnění"],
      ["Daňový bonus", `+ ${money(result.taxBonus)}`, "Vzniká, pokud zvýhodnění na děti převýší daň"],
      ["Jiné srážky", `− ${money(result.otherDeductions)}`, "Srážky po výpočtu čisté mzdy"],
      ["Čistá mzda", money(result.netSalary), "Orientační částka na účet"],
      ["Sociální pojištění zaměstnavatele", money(result.socialEmployer), "24,8 % pro běžný model zaměstnavatele"],
      ["Zdravotní pojištění zaměstnavatele", money(result.healthEmployer), "9 % z hrubé mzdy"],
      ["Cena práce", money(result.totalCost), "Hrubá mzda plus odvody zaměstnavatele"]
    ];
  }

  function updateScenarios(input, result) {
    const body = $("salaryScenarioTableBody");
    if (!body) return;
    const deltas = [-10000, -5000, 0, 5000, 10000];
    body.innerHTML = deltas.map((delta) => {
      const scenarioInput = { ...input, grossBase: Math.max(0, input.grossBase + delta) };
      const scenario = calculate(scenarioInput);
      const diff = scenario.netSalary - result.netSalary;
      const label = delta === 0 ? "Zadaná mzda" : delta > 0 ? `Hrubá +${money(delta)}` : `Hrubá −${money(Math.abs(delta))}`;
      const diffText = delta === 0 ? "—" : `${diff > 0 ? "+" : "−"} ${money(Math.abs(diff))}`;
      return `<tr><td>${label}</td><td>${money(scenario.gross)}</td><td>${money(scenario.netSalary)}</td><td>${diffText}</td></tr>`;
    }).join("");
  }

  function update(result, input) {
    setText("netSalaryResult", money(result.netSalary));
    setText("grossSalaryResult", money(result.gross));
    setText("totalCostResult", money(result.totalCost));
    setText("employeeDeductionsResult", money(result.employeeDeductions));
    setText("taxResult", money(result.taxAfterDiscounts));
    setText("discountsResult", money(result.discountsTotal));
    setText("netRatioResult", pct(result.netRatio));
    setText("annualNetResult", money(result.annualNet));
    setText("annualCostResult", money(result.annualCost));
    setText("meterPercent", pct(result.netRatio));
    setText("resultNote", buildNote(result));
    setWidth("netRatioBar", `${clamp(result.netRatio, 0, 100)}%`);

    setText("heroNet", money(result.netSalary));
    setText("heroGross", money(result.gross));
    setText("heroCost", money(result.totalCost));
    setText("heroRatio", `${pct(result.netRatio)} z hrubé mzdy`);
    setWidth("heroNetBar", `${clamp(result.netRatio, 8, 100)}%`);
    setWidth("heroDeductionsBar", `${clamp(result.deductionsShare, 8, 90)}%`);
    setWidth("heroCostBar", "100%");

    setText("decisionText", `Z hrubé mzdy ${money(result.gross)} zůstane na účet přibližně ${money(result.netSalary)}. To je ${pct(result.netRatio)} z hrubé mzdy.`);
    setText("decisionTitle", result.netSalary >= 45000 ? "Ověřte dostupnost bydlení a rezervu" : result.children > 0 ? "Porovnejte čistý příjem celé domácnosti" : "Použijte čistou mzdu jako základ rozpočtu");
    setText("decisionDetail", `Odvody zaměstnance a daň po slevách dělají ${money(result.employeeDeductions + result.taxAfterDiscounts)}. Cena práce pro zaměstnavatele vychází ${money(result.totalCost)}.`);

    const body = $("breakdownBody");
    if (body) body.innerHTML = rows(result).map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
    badge(result);
    updateScenarios(input, result);
  }

  function run() {
    const input = readInput();
    update(calculate(input), input);
  }

  function setPressed(name) {
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.preset === name ? "true" : "false");
    });
  }

  function applyPreset(name) {
    const preset = PRESETS[name] || PRESETS.standard;
    Object.entries(preset).forEach(([key, value]) => {
      const element = $(key);
      if (!element) return;
      if (element.type === "checkbox") element.checked = Boolean(value);
      else element.value = value;
    });
    setPressed(name);
    run();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  inputIds.forEach((id) => {
    const element = $(id);
    if (!element) return;
    element.addEventListener("input", run);
    element.addEventListener("change", run);
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });

  $("resetBtn")?.addEventListener("click", () => applyPreset("standard"));
  setPressed("standard");
  run();
})();
