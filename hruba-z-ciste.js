(function () {
  const form = document.getElementById("grossFromNetForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
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

  const presets = {
    standard: { targetNet: 35000, children: 0, otherDeductions: 0, taxpayerDiscount: true },
    entry: { targetNet: 28000, children: 0, otherDeductions: 0, taxpayerDiscount: true },
    family: { targetNet: 43000, children: 2, otherDeductions: 0, taxpayerDiscount: true },
    higher: { targetNet: 70000, children: 0, otherDeductions: 0, taxpayerDiscount: true },
    manager: { targetNet: 130000, children: 0, otherDeductions: 0, taxpayerDiscount: true }
  };

  const formatNumber = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const formatDecimal = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const money = (value) => `${formatNumber.format(Math.round(Number(value) || 0))} Kč`;
  const pct = (value) => `${formatDecimal.format(Number(value) || 0)} %`;
  const roundUp = (value) => Math.ceil(Number(value) || 0);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const childWord = (children) => {
    if (children === 1) return "dítě";
    if (children >= 2 && children <= 4) return "děti";
    return "dětí";
  };

  function childCredit(children) {
    let total = 0;
    for (let i = 0; i < children; i++) total += CONFIG.childCredits[Math.min(i, 2)];
    return total;
  }

  function taxBase(gross) {
    return gross <= 0 ? 0 : Math.ceil(gross / 100) * 100;
  }

  function taxBeforeDiscounts(base) {
    const basic = Math.min(base, CONFIG.highTaxMonthlyThreshold);
    const high = Math.max(0, base - CONFIG.highTaxMonthlyThreshold);
    return roundUp(basic * CONFIG.taxBasic + high * CONFIG.taxHigh);
  }

  function socialAssessment(gross, input) {
    if (!input.applySocialCap) return gross;
    const cap = CONFIG.annualSocialCap;
    if (input.yearSocialBase > 0) return clamp(cap - input.yearSocialBase, 0, gross);
    return Math.min(gross, cap / 12);
  }

  function forward(grossSalary, input) {
    const gross = Math.max(0, Math.round(Number(grossSalary) || 0));
    const socialBase = socialAssessment(gross, input);
    const socialEmployee = roundUp(socialBase * CONFIG.socialEmployee);
    const socialEmployer = roundUp(socialBase * CONFIG.socialEmployer);
    const healthBase = input.healthMinimumMode === "full" ? Math.max(gross, CONFIG.healthMinimumBase) : gross;
    const healthSupplementBase = Math.max(0, healthBase - gross);
    const healthEmployee = roundUp(gross * CONFIG.healthEmployee + healthSupplementBase * CONFIG.healthTotal);
    const healthEmployer = roundUp(gross * CONFIG.healthEmployer);
    const base = taxBase(gross);
    const taxBefore = taxBeforeDiscounts(base);
    const taxpayer = input.taxpayerDiscount ? CONFIG.taxpayerDiscount : 0;
    const childrenCredit = childCredit(input.children);
    const taxAfterTaxpayer = Math.max(0, taxBefore - taxpayer);
    const taxAfterChildrenRaw = taxAfterTaxpayer - childrenCredit;
    const taxAfterDiscounts = Math.max(0, taxAfterChildrenRaw);
    const taxBonus = Math.max(0, -taxAfterChildrenRaw);
    const netBeforeOther = gross - socialEmployee - healthEmployee - taxAfterDiscounts + taxBonus;
    const netAfterOther = Math.max(0, netBeforeOther - input.otherDeductions);
    const employeeDeductions = socialEmployee + healthEmployee + taxAfterDiscounts + input.otherDeductions - taxBonus;

    return {
      grossSalary: gross,
      targetNet: input.targetNet,
      netBeforeOther,
      netAfterOther,
      socialBase,
      healthBase,
      healthSupplementBase,
      socialEmployee,
      healthEmployee,
      socialEmployer,
      healthEmployer,
      taxBase: base,
      taxBefore,
      taxpayer,
      childrenCredit,
      totalDiscounts: taxpayer + childrenCredit,
      taxAfterDiscounts,
      taxBonus,
      otherDeductions: input.otherDeductions,
      employeeDeductions,
      totalCost: gross + socialEmployer + healthEmployer,
      highTaxBase: Math.max(0, base - CONFIG.highTaxMonthlyThreshold),
      socialCapApplied: socialBase < gross
    };
  }

  function readInput() {
    return {
      targetNet: Math.max(0, Number($("targetNet")?.value) || 0),
      otherDeductions: Math.max(0, Number($("otherDeductions")?.value) || 0),
      children: clamp(Math.round(Number($("children")?.value) || 0), 0, 5),
      taxpayerDiscount: Boolean($("taxpayerDiscount")?.checked),
      applySocialCap: Boolean($("applySocialCap")?.checked),
      yearSocialBase: Math.max(0, Number($("yearSocialBase")?.value) || 0),
      healthMinimumMode: $("healthMinimumMode")?.value || "off",
      grossStep: Math.max(1, Number($("grossStep")?.value) || 1)
    };
  }

  function estimate(input) {
    if (input.targetNet <= 0) return forward(0, input);
    let low = 0;
    let high = Math.max((input.targetNet + input.otherDeductions) * 2.5, CONFIG.healthMinimumBase, 30000);
    let best = forward(high, input);
    let guard = 0;

    while (best.netAfterOther < input.targetNet && guard < 60) {
      high *= 1.45;
      best = forward(high, input);
      guard += 1;
    }

    while (low <= high) {
      const mid = Math.round((low + high) / 2);
      const current = forward(mid, input);
      if (Math.abs(current.netAfterOther - input.targetNet) < Math.abs(best.netAfterOther - input.targetNet)) best = current;
      if (current.netAfterOther < input.targetNet) low = mid + 1;
      else high = mid - 1;
    }

    if (input.grossStep > 1) {
      const steppedGross = Math.round(best.grossSalary / input.grossStep) * input.grossStep;
      best = forward(Math.max(0, steppedGross), input);
    }

    return best;
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

  function renderBreakdown(input, data) {
    const rows = [
      ["Cílová čistá mzda", money(input.targetNet), "Částka, kterou chcete dostat na účet"],
      ["Dopočtená hrubá mzda", money(data.grossSalary), "Orientační hrubá mzda pro smlouvu nebo mzdový výměr"],
      ["Základ pro sociální pojištění", money(data.socialBase), data.socialCapApplied ? "Omezeno sociálním stropem" : "Běžný vyměřovací základ"],
      ["Sociální pojištění zaměstnance", `− ${money(data.socialEmployee)}`, "7,1 % ze sociálního základu"],
      ["Zdravotní pojištění zaměstnance", `− ${money(data.healthEmployee)}`, data.healthSupplementBase > 0 ? "Včetně dopočtu do minima" : "4,5 % z hrubé mzdy"],
      ["Základ pro daň", money(data.taxBase), "Hrubá mzda zaokrouhlená na stovky nahoru"],
      ["Daň před slevami", money(data.taxBefore), data.highTaxBase > 0 ? `Část ${money(data.highTaxBase)} spadá do 23% pásma` : "15% pásmo"],
      ["Sleva na poplatníka", `− ${money(data.taxpayer)}`, "Základní měsíční sleva, pokud ji uplatňujete"],
      ["Daňové zvýhodnění na děti", `− ${money(data.childrenCredit)}`, input.children > 0 ? `Započteno ${input.children} ${childWord(input.children)}` : "Bez uplatněných dětí"],
      ["Daň po slevách", `− ${money(data.taxAfterDiscounts)}`, "Daň skutečně odečtená ze mzdy"],
      ["Daňový bonus", `+ ${money(data.taxBonus)}`, "Bonus z daňového zvýhodnění na děti"],
      ["Jiné pravidelné srážky", `− ${money(data.otherDeductions)}`, "Srážky po výpočtu mzdy"],
      ["Čistá mzda podle modelu", money(data.netAfterOther), "Nejbližší dosažená částka na účet"],
      ["Sociální pojištění zaměstnavatele", money(data.socialEmployer), "Odvod placený zaměstnavatelem"],
      ["Zdravotní pojištění zaměstnavatele", money(data.healthEmployer), "Odvod placený zaměstnavatelem"],
      ["Cena práce", money(data.totalCost), "Hrubá mzda plus odvody zaměstnavatele"]
    ];

    const body = $("summaryTableBody");
    if (body) body.innerHTML = rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function scenarioRows(input, data) {
    const targets = [input.targetNet - 5000, input.targetNet, input.targetNet + 5000].filter((target) => target > 0);
    const baseGross = data.grossSalary;
    const rows = targets.map((target) => {
      const scenarioInput = { ...input, targetNet: target };
      const scenario = estimate(scenarioInput);
      const diffGross = scenario.grossSalary - baseGross;
      return `<tr${target === input.targetNet ? " class=\"is-current\"" : ""}><td>${money(target)}</td><td>${money(scenario.grossSalary)}</td><td>${money(scenario.totalCost)}</td><td>${diffGross >= 0 ? "+" : "−"} ${money(Math.abs(diffGross))}</td></tr>`;
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
    const diff = data.netAfterOther - input.targetNet;
    const absDiff = Math.abs(diff);
    const ratio = data.grossSalary > 0 ? (data.netAfterOther / data.grossSalary) * 100 : 0;
    const matchLabel = absDiff <= 20 ? "Velmi blízký odhad" : absDiff <= 100 ? "Blízký odhad" : "Orientační odhad";
    const childText = input.children > 0 ? `Započteno je daňové zvýhodnění na ${input.children} ${childWord(input.children)}.` : "Bez daňového zvýhodnění na děti.";
    const bandText = data.highTaxBase > 0 ? `Část základu ${money(data.highTaxBase)} spadá do 23% pásma.` : "Výpočet zůstává v 15% pásmu.";
    const capText = data.socialCapApplied ? " Sociální pojištění je v modelu omezené ročním stropem." : "";

    setText("grossSalaryResult", money(data.grossSalary));
    setText("netSalaryResult", money(data.netAfterOther));
    setText("targetDiffResult", money(absDiff));
    setText("totalCostResult", money(data.totalCost));
    setText("employeeDeductionsResult", money(Math.max(0, data.employeeDeductions)));
    setText("taxResult", money(data.taxAfterDiscounts));
    setText("discountsResult", `${money(data.totalDiscounts)} / bonus ${money(data.taxBonus)}`);
    setText("annualGrossResult", money(data.grossSalary * 12));
    setText("annualCostResult", money(data.totalCost * 12));
    setText("netRatioResult", pct(ratio));
    setText("heroGross", money(data.grossSalary));
    setText("heroGrossSmall", money(data.grossSalary));
    setText("heroTarget", money(input.targetNet));
    setText("heroNet", money(data.netAfterOther));
    setText("heroCost", money(data.totalCost));
    setText("heroCostSmall", money(data.totalCost));
    setText("heroMatch", matchLabel.toLowerCase());
    setText("resultNote", `Pro cílovou čistou mzdu ${money(input.targetNet)} vychází orientační hrubá mzda ${money(data.grossSalary)}. Modelová čistá mzda je ${money(data.netAfterOther)}, rozdíl proti cíli ${money(absDiff)}. ${childText} ${bandText}${capText}`);
    setText("decisionText", `Z čisté mzdy ${money(data.netAfterOther)} vychází hrubá mzda ${money(data.grossSalary)} a cena práce ${money(data.totalCost)}. Čistý podíl z hrubé mzdy je ${pct(ratio)}.`);
    setText("decisionTitle", absDiff <= 20 ? "Výsledek je velmi blízko cíli" : "Výsledek berte jako orientační hrubou mzdu");
    setText("decisionDetail", data.highTaxBase > 0 ? "U vysokých příjmů sledujte 23% daňové pásmo i sociální strop. U bonusů v průběhu roku rozhoduje skutečný roční základ." : "Dopočtenou hrubou mzdu si ověřte i v kalkulačce čisté mzdy, hlavně pokud řešíte nabídku práce nebo smlouvu.");

    const badge = $("resultBadge");
    if (badge) {
      badge.className = `badge ${absDiff <= 20 ? "" : absDiff <= 100 ? "warning" : "risk"}`.trim();
      badge.textContent = matchLabel;
    }

    setBar("netRatioBar", ratio, 100);
    setBar("heroNetBar", data.netAfterOther, data.totalCost);
    setBar("heroDeductionsBar", Math.max(0, data.employeeDeductions), data.totalCost);
    setBar("heroCostBar", data.totalCost, data.totalCost);
    renderBreakdown(input, data);
    scenarioRows(input, data);
  }

  function run() {
    const input = readInput();
    const data = estimate(input);
    render(input, data);
  }

  function applyPreset(name) {
    const preset = presets[name] || presets.standard;
    $("targetNet").value = preset.targetNet;
    $("children").value = preset.children;
    $("otherDeductions").value = preset.otherDeductions;
    $("taxpayerDiscount").checked = preset.taxpayerDiscount;
    updatePresetState(name);
    run();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["targetNet", "children", "otherDeductions", "yearSocialBase", "healthMinimumMode", "grossStep", "taxpayerDiscount", "applySocialCap"].forEach((id) => {
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
