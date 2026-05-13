(function () {
  const form = document.getElementById("salaryForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const optional = (id) => document.getElementById(id);

  const elements = {
    grossSalary: $("grossSalary"),
    bonusSalary: optional("bonusSalary"),
    otherDeductions: optional("otherDeductions"),
    children: $("children"),
    taxpayerDiscount: $("taxpayerDiscount"),
    resetBtn: $("resetBtn"),
    presets: Array.from(document.querySelectorAll("[data-preset]")),

    netSalaryResult: $("netSalaryResult"),
    grossSalaryResult: $("grossSalaryResult"),
    totalCostResult: $("totalCostResult"),
    employeeDeductionsResult: $("employeeDeductionsResult"),
    taxResult: $("taxResult"),
    discountsResult: $("discountsResult"),
    netRatioResult: $("netRatioResult"),
    resultBadge: $("resultBadge"),
    resultNote: $("resultNote"),
    meterPercent: $("meterPercent"),
    netRatioBar: $("netRatioBar"),
    breakdownBody: $("breakdownBody"),

    heroNet: $("heroNet"),
    heroGross: $("heroGross"),
    heroCost: $("heroCost"),
    heroRatio: $("heroRatio"),
    heroCalcNet: $("heroCalcNet"),
    heroNetBar: $("heroNetBar"),
    heroDeductionsBar: $("heroDeductionsBar"),

    decisionText: $("decisionText"),
    decisionNetText: $("decisionNetText"),
    decisionDeductionsText: $("decisionDeductionsText"),
    decisionCostText: $("decisionCostText"),
    decisionCostTag: $("decisionCostTag"),

    salaryPremiumNet: $("salaryPremiumNet"),
    salaryPremiumSentence: $("salaryPremiumSentence"),
    salaryPremiumChecklist: $("salaryPremiumChecklist"),
    salaryScenarioTableBody: $("salaryScenarioTableBody"),
  };

  const CONFIG = {
    socialRateEmployee: 0.071,
    healthRateEmployee: 0.045,
    socialRateEmployer: 0.248,
    healthRateEmployer: 0.09,
    taxRateBasic: 0.15,
    taxRateHigh: 0.23,
    monthlyHighTaxThreshold: 146901,
    taxpayerDiscount: 2570,
    child1: 1267,
    child2: 1860,
    child3plus: 2320,
  };

  const presetValues = {
    standard: { gross: 45000, bonus: 0, otherDeductions: 0, children: 0, taxpayerDiscount: true },
    entry: { gross: 32000, bonus: 0, otherDeductions: 0, children: 0, taxpayerDiscount: true },
    family: { gross: 52000, bonus: 0, otherDeductions: 0, children: 2, taxpayerDiscount: true },
    higher: { gross: 70000, bonus: 0, otherDeductions: 0, children: 0, taxpayerDiscount: true },
  };

  const round = (value) => Math.round(Number(value) || 0);
  const roundUp = (value) => Math.ceil(Number(value) || 0);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const formatCurrency = (value) => `${round(value).toLocaleString("cs-CZ")} Kč`;
  const formatPlain = (value) => round(value).toLocaleString("cs-CZ");
  const formatPercent = (value) =>
    `${(Number(value) || 0).toLocaleString("cs-CZ", {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} %`;

  function getChildCredit(children) {
    if (children <= 0) return 0;
    if (children === 1) return CONFIG.child1;
    if (children === 2) return CONFIG.child1 + CONFIG.child2;
    return CONFIG.child1 + CONFIG.child2 + (children - 2) * CONFIG.child3plus;
  }

  function getTaxBase(gross) {
    if (gross <= 100) return roundUp(gross);
    return Math.ceil(gross / 100) * 100;
  }

  function progressiveTax(taxBase) {
    const basicPart = Math.min(taxBase, CONFIG.monthlyHighTaxThreshold);
    const highPart = Math.max(0, taxBase - CONFIG.monthlyHighTaxThreshold);
    return roundUp(basicPart * CONFIG.taxRateBasic + highPart * CONFIG.taxRateHigh);
  }

  function calculate(input) {
    const grossBase = Math.max(0, Number(input.gross) || 0);
    const bonus = Math.max(0, Number(input.bonus) || 0);
    const otherDeductions = Math.max(0, Number(input.otherDeductions) || 0);
    const gross = grossBase + bonus;
    const children = clamp(Math.round(Number(input.children) || 0), 0, 5);

    const socialEmployee = roundUp(gross * CONFIG.socialRateEmployee);
    const healthEmployee = roundUp(gross * CONFIG.healthRateEmployee);
    const employeeDeductions = socialEmployee + healthEmployee;

    const socialEmployer = roundUp(gross * CONFIG.socialRateEmployer);
    const healthEmployer = roundUp(gross * CONFIG.healthRateEmployer);
    const totalCost = round(gross + socialEmployer + healthEmployer);

    const taxBase = getTaxBase(gross);
    const taxBeforeDiscounts = progressiveTax(taxBase);
    const highTaxBase = Math.max(0, taxBase - CONFIG.monthlyHighTaxThreshold);
    const basicDiscount = input.withTaxpayerDiscount ? CONFIG.taxpayerDiscount : 0;
    const childCredit = getChildCredit(children);
    const taxAfterBasic = Math.max(0, taxBeforeDiscounts - basicDiscount);
    const taxAfterChildrenRaw = taxAfterBasic - childCredit;
    const taxAfterDiscounts = Math.max(0, taxAfterChildrenRaw);
    const taxBonus = Math.max(0, -taxAfterChildrenRaw);
    const netBeforeOtherDeductions = round(gross - employeeDeductions - taxAfterDiscounts + taxBonus);
    const netSalary = Math.max(0, netBeforeOtherDeductions - otherDeductions);
    const netRatio = gross > 0 ? (netSalary / gross) * 100 : 0;
    const deductionsTotal = employeeDeductions + taxAfterDiscounts + otherDeductions - taxBonus;
    const deductionsShare = gross > 0 ? (deductionsTotal / gross) * 100 : 0;

    return {
      grossBase,
      bonus,
      gross,
      children,
      withTaxpayerDiscount: !!input.withTaxpayerDiscount,
      otherDeductions,
      socialEmployee,
      healthEmployee,
      employeeDeductions,
      socialEmployer,
      healthEmployer,
      totalCost,
      taxBase,
      taxBeforeDiscounts,
      highTaxBase,
      basicDiscount,
      childCredit,
      taxAfterDiscounts,
      taxBonus,
      netBeforeOtherDeductions,
      netSalary,
      netRatio,
      deductionsTotal,
      deductionsShare,
      annualNet: netSalary * 12,
      annualGross: gross * 12,
      annualTotalCost: totalCost * 12,
    };
  }

  function readInput() {
    return {
      gross: Number(elements.grossSalary.value) || 0,
      bonus: elements.bonusSalary ? Number(elements.bonusSalary.value) || 0 : 0,
      otherDeductions: elements.otherDeductions ? Number(elements.otherDeductions.value) || 0 : 0,
      children: Number(elements.children.value) || 0,
      withTaxpayerDiscount: elements.taxpayerDiscount.checked,
    };
  }

  function ensureDeepResult() {
    if (document.getElementById("salaryDeepGrid")) return;
    const meter = document.querySelector(".result-panel .meter");
    if (!meter) return;
    meter.insertAdjacentHTML(
      "afterend",
      `<div class="salary-deep-grid" id="salaryDeepGrid">
        <div><span>Ročně čistě</span><strong id="yearlyNetResult">0 Kč</strong></div>
        <div><span>Roční cena práce</span><strong id="yearlyCostResult">0 Kč</strong></div>
        <div><span>Daňové pásmo</span><strong id="taxBandResult">15 %</strong></div>
        <div><span>Další krok</span><strong id="nextSalaryStep">Rozpočet</strong></div>
      </div>`,
    );
  }

  function buildBadge(result) {
    const badge = elements.resultBadge;
    badge.classList.remove("warning", "risk");
    if (result.netRatio >= 82) {
      badge.textContent = "Vysoký čistý podíl";
    } else if (result.netRatio >= 74) {
      badge.textContent = "Běžný čistý podíl";
      badge.classList.add("warning");
    } else {
      badge.textContent = "Vyšší zatížení srážkami";
      badge.classList.add("risk");
    }
  }

  function describeChildren(result) {
    if (result.children === 0) return "bez daňového zvýhodnění na děti";
    if (result.children === 1) return "s daňovým zvýhodněním na 1 dítě";
    return `s daňovým zvýhodněním na ${result.children} děti`;
  }

  function updateNote(result) {
    const parts = [];
    parts.push(result.withTaxpayerDiscount ? "Počítáme se slevou na poplatníka." : "Počítáme bez slevy na poplatníka.");
    if (result.bonus > 0) parts.push(`Prémie ${formatCurrency(result.bonus)} je zahrnutá do zdanitelné hrubé mzdy.`);
    if (result.children > 0) parts.push(`Zahrnuto je daňové zvýhodnění na ${result.children} ${result.children === 1 ? "dítě" : "děti"}.`);
    if (result.highTaxBase > 0) parts.push(`Část mzdy nad ${formatCurrency(CONFIG.monthlyHighTaxThreshold)} počítáme ve vyšším 23% pásmu.`);
    if (result.taxBonus > 0) parts.push(`Vychází daňový bonus ${formatCurrency(result.taxBonus)}.`);
    if (result.otherDeductions > 0) parts.push(`Po čisté mzdě odečítáme další srážky ${formatCurrency(result.otherDeductions)}.`);
    parts.push("Výsledek je orientační a nemusí odpovídat výplatní pásce s nemocí, dovolenou, exekucí, benefity nebo nepravidelnými složkami.");
    elements.resultNote.textContent = parts.join(" ");
  }

  function updateDecisionTexts(result) {
    const takeHomeAfterRaise = calculate({
      ...readInput(),
      gross: result.grossBase + 5000,
    }).netSalary;
    const raiseNet = Math.max(0, takeHomeAfterRaise - result.netSalary);
    const deductions = Math.max(0, result.employeeDeductions + result.taxAfterDiscounts + result.otherDeductions - result.taxBonus);
    elements.decisionText.textContent = `Z hrubé mzdy ${formatCurrency(result.gross)} vám orientačně zůstane ${formatCurrency(result.netSalary)}. To je ${formatPercent(result.netRatio)} z hrubé mzdy ${describeChildren(result)}.`;
    elements.decisionNetText.textContent = `Na účet vychází přibližně ${formatCurrency(result.netSalary)} měsíčně, tedy ${formatCurrency(result.annualNet)} ročně. Tohle číslo používejte pro nájem, hypotéku, rezervu a běžné výdaje.`;
    elements.decisionDeductionsText.textContent = `Sociální, zdravotní, daň po slevách a zadané srážky dělají přibližně ${formatCurrency(deductions)}. Zvýšení hrubé mzdy o 5 000 Kč by zde přidalo čistě asi ${formatCurrency(raiseNet)}.`;
    elements.decisionCostText.textContent = `Celková cena práce je ${formatCurrency(result.totalCost)} měsíčně. Zaměstnavatele stojíte o ${formatCurrency(result.totalCost - result.gross)} víc než je hrubá mzda před benefity a další režií.`;
    elements.decisionCostTag.classList.remove("risk", "warning");
    elements.decisionCostTag.classList.add(result.highTaxBase > 0 ? "warning" : "safe");
  }

  function updateBreakdown(result) {
    const rows = [
      ["Smluvní hrubá mzda", formatCurrency(result.grossBase)],
      ["Prémie a odměny", formatCurrency(result.bonus)],
      ["Zdanitelná hrubá mzda", formatCurrency(result.gross)],
      ["Sociální pojištění zaměstnance (7,1 %)", `− ${formatCurrency(result.socialEmployee)}`],
      ["Zdravotní pojištění zaměstnance (4,5 %)", `− ${formatCurrency(result.healthEmployee)}`],
      ["Základ pro zálohu na daň", formatCurrency(result.taxBase)],
      ["Daň před slevami (15 % / 23 %)", formatCurrency(result.taxBeforeDiscounts)],
      ["Sleva na poplatníka", `− ${formatCurrency(result.basicDiscount)}`],
      ["Daňové zvýhodnění na děti", `− ${formatCurrency(result.childCredit)}`],
      ["Daň po slevách", `− ${formatCurrency(result.taxAfterDiscounts)}`],
      ["Daňový bonus", `+ ${formatCurrency(result.taxBonus)}`],
      ["Čistá mzda před jinými srážkami", formatCurrency(result.netBeforeOtherDeductions)],
      ["Jiné pravidelné srážky", `− ${formatCurrency(result.otherDeductions)}`],
      ["Čistá mzda na účet", formatCurrency(result.netSalary)],
      ["Sociální pojištění zaměstnavatele (24,8 %)", formatCurrency(result.socialEmployer)],
      ["Zdravotní pojištění zaměstnavatele (9 %)", formatCurrency(result.healthEmployer)],
      ["Cena práce", formatCurrency(result.totalCost)],
    ];
    elements.breakdownBody.innerHTML = rows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join("");
  }

  function updateHero(result) {
    elements.heroNet.textContent = formatCurrency(result.netSalary);
    elements.heroGross.textContent = formatCurrency(result.gross);
    elements.heroCost.textContent = formatCurrency(result.totalCost);
    elements.heroRatio.textContent = formatPercent(result.netRatio);
    elements.heroCalcNet.textContent = formatPlain(result.netSalary);
    elements.heroNetBar.style.width = `${clamp(result.netRatio, 12, 100)}%`;
    elements.heroDeductionsBar.style.width = `${clamp(result.deductionsShare, 8, 88)}%`;
  }

  function updateDeepResult(result) {
    const yearlyNet = optional("yearlyNetResult");
    const yearlyCost = optional("yearlyCostResult");
    const taxBand = optional("taxBandResult");
    const nextStep = optional("nextSalaryStep");
    if (yearlyNet) yearlyNet.textContent = formatCurrency(result.annualNet);
    if (yearlyCost) yearlyCost.textContent = formatCurrency(result.annualTotalCost);
    if (taxBand) taxBand.textContent = result.highTaxBase > 0 ? "15 % + 23 %" : "15 %";
    if (nextStep) {
      nextStep.textContent =
        result.netSalary >= 45000 ? "Dostupnost bydlení" : result.children > 0 ? "Rodinný rozpočet" : "Hrubá z čisté";
    }
  }

  function updatePremiumDecision(result) {
    if (elements.salaryPremiumNet) elements.salaryPremiumNet.textContent = formatCurrency(result.netSalary);
    if (elements.salaryPremiumSentence) {
      elements.salaryPremiumSentence.textContent = `Z hrubé mzdy ${formatCurrency(result.gross)} vychází orientační čistá mzda ${formatCurrency(result.netSalary)}. Zaměstnanec na pojištění, dani a zadaných srážkách odevzdá přibližně ${formatCurrency(result.deductionsTotal)} a celková cena práce je ${formatCurrency(result.totalCost)}.`;
    }
    if (elements.salaryPremiumChecklist) {
      const up = calculate({ ...readInput(), gross: result.grossBase + 5000 });
      const items = [
        `Pro domácí rozpočet používejte čistou mzdu ${formatCurrency(result.netSalary)}, ne hrubou částku ze smlouvy.`,
        `Navýšení hrubé mzdy o 5 000 Kč by v tomto modelu zvýšilo čistou mzdu asi o ${formatCurrency(up.netSalary - result.netSalary)}.`,
        result.highTaxBase > 0
          ? "U vysokých mezd sledujte vyšší 23% daňové pásmo. Rozdíl mezi hrubou a čistou mzdou pak roste rychleji."
          : "Pokud máte děti, prémie nebo pravidelné srážky, zadejte je. Umí změnit čistý příjem výrazně víc než samotná sazba daně.",
      ];
      elements.salaryPremiumChecklist.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
    }
    if (elements.salaryScenarioTableBody) {
      const up = calculate({ ...readInput(), gross: result.grossBase + 5000 });
      const down = calculate({ ...readInput(), gross: Math.max(0, result.grossBase - 5000) });
      elements.salaryScenarioTableBody.innerHTML = [
        ["Zadaná mzda", formatCurrency(result.netSalary), "Aktuální čistý příjem pro rozpočet"],
        ["Hrubá mzda +5 000 Kč", formatCurrency(up.netSalary), `Dopad čistě ${formatCurrency(up.netSalary - result.netSalary)}`],
        ["Hrubá mzda −5 000 Kč", formatCurrency(down.netSalary), `Pokles čistě ${formatCurrency(result.netSalary - down.netSalary)}`],
      ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
    }
  }

  function updateUI() {
    ensureDeepResult();
    const result = calculate(readInput());

    elements.netSalaryResult.textContent = formatCurrency(result.netSalary);
    elements.grossSalaryResult.textContent = formatCurrency(result.gross);
    elements.totalCostResult.textContent = formatCurrency(result.totalCost);
    elements.employeeDeductionsResult.textContent = formatCurrency(result.employeeDeductions);
    elements.taxResult.textContent = formatCurrency(result.taxAfterDiscounts);
    elements.discountsResult.textContent = formatCurrency(result.basicDiscount + result.childCredit + result.taxBonus);
    elements.netRatioResult.textContent = formatPercent(result.netRatio);
    elements.meterPercent.textContent = formatPercent(result.netRatio);
    elements.netRatioBar.style.width = `${clamp(result.netRatio, 0, 100)}%`;

    buildBadge(result);
    updateNote(result);
    updateDecisionTexts(result);
    updateBreakdown(result);
    updateHero(result);
    updateDeepResult(result);
    updatePremiumDecision(result);
  }

  function setPreset(name) {
    const preset = presetValues[name];
    if (!preset) return;
    elements.grossSalary.value = preset.gross;
    if (elements.bonusSalary) elements.bonusSalary.value = preset.bonus;
    if (elements.otherDeductions) elements.otherDeductions.value = preset.otherDeductions;
    elements.children.value = String(preset.children);
    elements.taxpayerDiscount.checked = preset.taxpayerDiscount;
    elements.presets.forEach((button) => {
      button.classList.toggle("active", button.dataset.preset === name);
    });
    updateUI();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    updateUI();
  });

  ["input", "change"].forEach((eventName) => {
    form.addEventListener(eventName, updateUI);
  });

  elements.presets.forEach((button) => {
    button.addEventListener("click", () => setPreset(button.dataset.preset));
  });

  elements.resetBtn.addEventListener("click", () => setPreset("standard"));

  updateUI();
})();
