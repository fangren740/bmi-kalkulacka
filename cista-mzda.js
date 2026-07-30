(() => {
  "use strict";

  const form = document.getElementById("salaryForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const moneyFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const decimalFormatter = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const money = (value) => `${moneyFormatter.format(Math.round(Number.isFinite(value) ? value : 0))} Kč`;
  const percent = (value) => `${decimalFormatter.format(Number.isFinite(value) ? value : 0)} %`;
  const ceil = (value) => Math.ceil(Math.max(0, Number(value) || 0));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const CONFIG = Object.freeze({
    socialEmployee: 0.071,
    pensionerSocialDiscount: 0.065,
    socialEmployer: 0.248,
    healthTotal: 0.135,
    healthEmployer: 0.09,
    taxBasic: 0.15,
    taxHigh: 0.23,
    highTaxMonthlyThreshold: 146901,
    taxpayerDiscount: 2570,
    ztpDiscount: 1345,
    childCredits: [1267, 1860, 2320],
    annualSocialCap: 2350416,
    minimumWage: 22400,
    monthlyBonusIncomeThreshold: 11200,
    monthlyBonusMinimum: 50
  });

  const PRESETS = Object.freeze({
    minimum: { grossSalary: 22400, children: 0, taxDeclaration: true },
    standard: { grossSalary: 45000, children: 0, taxDeclaration: true },
    family: { grossSalary: 52000, children: 2, taxDeclaration: true },
    higher: { grossSalary: 90000, children: 0, taxDeclaration: true }
  });

  let currentMode = "basic";

  function numberFrom(id) {
    const element = $(id);
    return Math.max(0, Number(element?.value) || 0);
  }

  function checked(id) {
    return Boolean($(id)?.checked);
  }

  function text(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function width(id, value) {
    const element = $(id);
    if (element) element.style.width = `${clamp(value, 0, 100)}%`;
  }

  function childCredit(count) {
    let total = 0;
    for (let index = 0; index < count; index += 1) {
      total += CONFIG.childCredits[Math.min(index, CONFIG.childCredits.length - 1)];
    }
    return total;
  }

  function taxBase(gross) {
    return gross > 0 ? Math.ceil(gross / 100) * 100 : 0;
  }

  function progressiveTax(base) {
    const basicPart = Math.min(base, CONFIG.highTaxMonthlyThreshold);
    const highPart = Math.max(0, base - CONFIG.highTaxMonthlyThreshold);
    return ceil(basicPart * CONFIG.taxBasic + highPart * CONFIG.taxHigh);
  }

  function readInput() {
    const advanced = currentMode === "advanced";
    return {
      mode: currentMode,
      grossBase: numberFrom("grossSalary"),
      children: clamp(Math.round(numberFrom("children")), 0, 5),
      taxDeclaration: checked("taxDeclaration"),
      bonus: advanced ? numberFrom("bonusSalary") : 0,
      otherDeductions: advanced ? numberFrom("otherDeductions") : 0,
      disabilityDiscount: advanced ? numberFrom("disabilityDiscount") : 0,
      yearSocialBase: advanced ? numberFrom("yearSocialBase") : 0,
      ztpDiscount: advanced && checked("ztpDiscount"),
      pensionerDiscount: advanced && checked("pensionerDiscount"),
      healthMinimum: advanced && checked("healthMinimum"),
      applySocialCap: !advanced || checked("applySocialCap")
    };
  }

  function socialAssessment(input, gross) {
    if (!input.applySocialCap) return gross;
    const remainingAnnualBase = Math.max(0, CONFIG.annualSocialCap - input.yearSocialBase);
    return Math.min(gross, remainingAnnualBase);
  }

  function calculate(input) {
    const gross = input.grossBase + input.bonus;
    const socialBase = socialAssessment(input, gross);
    const socialCapUsed = input.applySocialCap && socialBase < gross;
    const socialEmployeeBeforeDiscount = ceil(socialBase * CONFIG.socialEmployee);
    const pensionerDiscountAmount = input.pensionerDiscount ? ceil(socialBase * CONFIG.pensionerSocialDiscount) : 0;
    const socialEmployee = Math.max(0, socialEmployeeBeforeDiscount - pensionerDiscountAmount);
    const socialEmployer = ceil(socialBase * CONFIG.socialEmployer);

    const healthAssessment = input.healthMinimum ? Math.max(gross, CONFIG.minimumWage) : gross;
    const healthTotal = ceil(healthAssessment * CONFIG.healthTotal);
    let healthEmployer;
    let healthEmployee;
    if (input.healthMinimum && healthAssessment > gross) {
      healthEmployer = ceil(gross * CONFIG.healthEmployer);
      healthEmployee = Math.max(0, healthTotal - healthEmployer);
    } else {
      healthEmployee = ceil(healthTotal / 3);
      healthEmployer = Math.max(0, healthTotal - healthEmployee);
    }
    const healthSupplementBase = Math.max(0, healthAssessment - gross);

    const baseForTax = taxBase(gross);
    const taxBeforeDiscounts = progressiveTax(baseForTax);
    const taxpayerDiscount = input.taxDeclaration ? CONFIG.taxpayerDiscount : 0;
    const disabilityDiscount = input.taxDeclaration ? input.disabilityDiscount : 0;
    const ztpDiscount = input.taxDeclaration && input.ztpDiscount ? CONFIG.ztpDiscount : 0;
    const personalDiscounts = taxpayerDiscount + disabilityDiscount + ztpDiscount;
    const taxAfterPersonal = Math.max(0, taxBeforeDiscounts - personalDiscounts);
    const childrenCredit = input.taxDeclaration ? childCredit(input.children) : 0;
    const taxAfterChildrenRaw = taxAfterPersonal - childrenCredit;
    const taxAfterDiscounts = Math.max(0, taxAfterChildrenRaw);
    const possibleTaxBonus = Math.max(0, -taxAfterChildrenRaw);
    const taxBonusEligible = gross >= CONFIG.monthlyBonusIncomeThreshold && possibleTaxBonus >= CONFIG.monthlyBonusMinimum;
    const taxBonus = taxBonusEligible ? possibleTaxBonus : 0;

    const employeeInsurance = socialEmployee + healthEmployee;
    const netBeforeOther = gross - employeeInsurance - taxAfterDiscounts + taxBonus;
    const netSalary = Math.max(0, Math.round(netBeforeOther - input.otherDeductions));
    const employerContributions = socialEmployer + healthEmployer;
    const totalCost = Math.round(gross + employerContributions);
    const employeeLoss = Math.max(0, gross - netSalary);
    const highTaxBase = Math.max(0, baseForTax - CONFIG.highTaxMonthlyThreshold);
    const netGrossRatio = gross > 0 ? netSalary / gross * 100 : 0;
    const employeeLossRatio = gross > 0 ? employeeLoss / gross * 100 : 0;
    const employerExtraRatio = gross > 0 ? employerContributions / gross * 100 : 0;

    const barNetPart = totalCost > 0 ? Math.min(netSalary, gross) / totalCost * 100 : 0;
    const barEmployeePart = totalCost > 0 ? Math.max(0, gross - Math.min(netSalary, gross)) / totalCost * 100 : 0;
    const barEmployerPart = totalCost > 0 ? employerContributions / totalCost * 100 : 0;

    return {
      ...input,
      gross,
      socialBase,
      socialCapUsed,
      socialEmployeeBeforeDiscount,
      pensionerDiscountAmount,
      socialEmployee,
      socialEmployer,
      healthAssessment,
      healthSupplementBase,
      healthTotal,
      healthEmployee,
      healthEmployer,
      baseForTax,
      taxBeforeDiscounts,
      taxpayerDiscount,
      disabilityDiscount,
      ztpDiscount,
      personalDiscounts,
      childrenCredit,
      taxAfterDiscounts,
      possibleTaxBonus,
      taxBonusEligible,
      taxBonus,
      employeeInsurance,
      netBeforeOther,
      netSalary,
      employerContributions,
      totalCost,
      employeeLoss,
      highTaxBase,
      netGrossRatio,
      employeeLossRatio,
      employerExtraRatio,
      barNetPart,
      barEmployeePart,
      barEmployerPart,
      annualNet: netSalary * 12,
      annualCost: totalCost * 12
    };
  }

  function resultStatus(result) {
    if (!result.taxDeclaration) return "Bez měsíčních daňových slev";
    if (result.taxBonus > 0) return "Včetně daňového bonusu";
    if (result.highTaxBase > 0) return "Část mzdy v 23% pásmu";
    if (result.socialCapUsed) return "Uplatněn sociální strop";
    if (result.pensionerDiscountAmount > 0) return "Sleva pracujícího důchodce";
    return result.mode === "advanced" ? "Pokročilý scénář" : "Běžný HPP model";
  }

  function insight(result) {
    if (!result.taxDeclaration) {
      return ["Zkontrolujte Prohlášení poplatníka", "Bez podepsaného prohlášení se v měsíci neuplatní základní sleva ani zadané osobní slevy a děti."];
    }
    if (result.taxBonus > 0) {
      return ["Čistou mzdu zvyšuje daňový bonus", `Daňové zvýhodnění na děti převýšilo daň a přidává k výplatě ${money(result.taxBonus)}.`];
    }
    if (result.highTaxBase > 0) {
      return ["Vyšší sazba se týká jen části mzdy", `Do 23% pásma spadá ${money(result.highTaxBase)} ze zaokrouhleného měsíčního základu.`];
    }
    if (result.healthSupplementBase > 0) {
      return ["Zdravotní pojistné je dopočtené do minima", `Model používá minimální zdravotní základ ${money(CONFIG.minimumWage)}, protože zadaná mzda je nižší.`];
    }
    if (result.pensionerDiscountAmount > 0) {
      return ["Sleva snižuje sociální pojistné", `Model odečetl slevu pracujícího starobního důchodce ${money(result.pensionerDiscountAmount)}.`];
    }
    return ["Rozpočet stavte z čisté mzdy", "Pro pravidelné výdaje používejte částku na účet po všech stálých srážkách, nikoli hrubou mzdu."];
  }

  function summary(result) {
    const parts = [`Z hrubé mzdy ${money(result.gross)} vám zůstane přibližně ${percent(result.netGrossRatio)}.`];
    if (result.taxBonus > 0) parts.push(`Výsledek zahrnuje daňový bonus ${money(result.taxBonus)}.`);
    if (result.otherDeductions > 0) parts.push(`Po výpočtu byly odečteny další srážky ${money(result.otherDeductions)}.`);
    return parts.join(" ");
  }

  function taxDetail(result) {
    if (!result.taxDeclaration) return "bez měsíčních slev";
    if (result.taxBonus > 0) return `bonus ${money(result.taxBonus)}`;
    if (result.highTaxBase > 0) return "15% a 23% pásmo";
    return "po měsíčních slevách";
  }

  function heroNote(result) {
    const notes = [];
    notes.push(result.taxDeclaration ? "Podepsané Prohlášení poplatníka" : "Bez podepsaného Prohlášení poplatníka");
    notes.push(result.children > 0 ? `${result.children} ${result.children === 1 ? "dítě" : result.children < 5 ? "děti" : "dětí"}` : "bez dětí");
    if (result.mode === "advanced" && result.bonus > 0) notes.push(`prémie ${money(result.bonus)}`);
    return `${notes.join(" · ")}.`;
  }

  function breakdownRows(result) {
    const rows = [
      ["Smluvní hrubá mzda", money(result.grossBase), "Základní hrubá měsíční mzda zadaná ve formuláři."],
      ["Prémie a zdanitelné odměny", money(result.bonus), result.mode === "advanced" ? "Zdanitelná odměna přičtená ve stejném měsíci." : "V základním režimu se prémie neuplatňuje."],
      ["Hrubá mzda celkem", money(result.gross), "Výchozí částka pro pojistné a měsíční zálohu na daň."],
      ["Sociální pojistné zaměstnance", `− ${money(result.socialEmployee)}`, `7,1 % ze sociálního základu ${money(result.socialBase)}, zaokrouhleno nahoru.`]
    ];
    if (result.pensionerDiscountAmount > 0) rows.push(["Sleva pracujícího důchodce", `+ ${money(result.pensionerDiscountAmount)}`, "Sleva 6,5 % odečtená od pojistného zaměstnance."]);
    rows.push(
      ["Zdravotní pojistné zaměstnance", `− ${money(result.healthEmployee)}`, result.healthSupplementBase > 0 ? `Včetně dopočtu ze základu ${money(result.healthAssessment)}.` : "Zaměstnanecká část celkového zdravotního pojistného 13,5 %."],
      ["Základ pro měsíční zálohu na daň", money(result.baseForTax), "Zdanitelný příjem zaokrouhlený na celé stokoruny nahoru."],
      ["Daň před slevami", money(result.taxBeforeDiscounts), result.highTaxBase > 0 ? `15 % do hranice a 23 % z části ${money(result.highTaxBase)}.` : "Výpočet v 15% pásmu."],
      ["Sleva na poplatníka", `− ${money(result.taxpayerDiscount)}`, result.taxDeclaration ? "Měsíční základní sleva 2 570 Kč." : "Bez podepsaného prohlášení se neuplatní."],
      ["Další osobní slevy", `− ${money(result.disabilityDiscount + result.ztpDiscount)}`, "Invalidita a průkaz ZTP/P podle pokročilých voleb."],
      ["Daňové zvýhodnění na děti", `− ${money(result.childrenCredit)}`, result.taxDeclaration ? "Podle pořadí a počtu uplatňovaných dětí." : "Bez podepsaného prohlášení se neuplatní."],
      ["Daň po slevách", `− ${money(result.taxAfterDiscounts)}`, "Měsíční záloha po slevách a daňovém zvýhodnění."],
      ["Daňový bonus", `+ ${money(result.taxBonus)}`, result.possibleTaxBonus > 0 && !result.taxBonusEligible ? "Nevyplacen v modelu, protože není splněna příjmová nebo minimální částková podmínka." : "Kladný rozdíl, pokud zvýhodnění na děti převýší daň a jsou splněny podmínky."],
      ["Jiné srážky", `− ${money(result.otherDeductions)}`, "Volitelné srážky odečtené až po výpočtu daně a pojistného."],
      ["Čistá mzda", money(result.netSalary), "Orientační částka na účet v zadaném scénáři."],
      ["Sociální pojistné zaměstnavatele", money(result.socialEmployer), "Běžná sazba 24,8 % ze sociálního základu."],
      ["Zdravotní pojistné zaměstnavatele", money(result.healthEmployer), "Zaměstnavatelská část zdravotního pojistného."],
      ["Cena práce", money(result.totalCost), "Hrubá mzda plus modelované povinné odvody zaměstnavatele."]
    );
    return rows;
  }

  function renderBreakdown(result) {
    const body = $("breakdownBody");
    if (!body) return;
    body.innerHTML = breakdownRows(result).map(([label, amount, note]) => `<tr><td>${label}</td><td>${amount}</td><td>${note}</td></tr>`).join("");
  }

  function scenarioData(input, result) {
    const values = [
      { label: "Nižší nabídka", delta: -5000 },
      { label: "Zadaná mzda", delta: 0, current: true },
      { label: "Navýšení o 5 000 Kč", delta: 5000 },
      { label: "Navýšení o 10 000 Kč", delta: 10000 }
    ];
    return values.map((item) => {
      const scenarioInput = { ...input, grossBase: Math.max(0, input.grossBase + item.delta) };
      const scenario = calculate(scenarioInput);
      return { ...item, scenario, difference: scenario.netSalary - result.netSalary };
    });
  }

  function renderScenarios(input, result) {
    const grid = $("scenarioGrid");
    if (!grid) return;
    grid.innerHTML = scenarioData(input, result).map(({ label, current, scenario, difference }) => {
      const differenceText = current ? "Výchozí varianta" : `${difference >= 0 ? "+" : "−"} ${money(Math.abs(difference))} čistého`;
      return `<article class="scenario-card${current ? " is-current" : ""}"><span>${current ? "Aktuální výpočet" : "Alternativa"}</span><h3>${label}</h3><strong>${money(scenario.netSalary)}</strong><small>z hrubé mzdy ${money(scenario.gross)}</small><p>${differenceText}. Cena práce ${money(scenario.totalCost)}.</p></article>`;
    }).join("");
  }

  function render(result, input) {
    text("netSalaryResult", money(result.netSalary));
    text("grossSalaryResult", money(result.gross));
    text("employeeInsuranceResult", money(result.employeeInsurance));
    text("taxResult", money(result.taxAfterDiscounts));
    text("totalCostResult", money(result.totalCost));
    text("annualNetResult", money(result.annualNet));
    text("annualCostResult", money(result.annualCost));
    text("resultSummary", summary(result));
    text("resultStatus", resultStatus(result));
    text("taxDetail", taxDetail(result));

    text("heroNet", money(result.netSalary));
    text("heroGross", money(result.gross));
    text("heroCost", money(result.totalCost));
    text("heroEmployeeLoss", money(result.employeeLoss));
    text("heroNetShare", `${percent(result.netGrossRatio)} z hrubé mzdy`);
    text("heroNote", heroNote(result));
    width("heroGrossBar", result.totalCost > 0 ? result.gross / result.totalCost * 100 : 0);
    width("heroNetBar", result.barNetPart);

    width("netShareBar", result.barNetPart);
    width("employeeShareBar", result.barEmployeePart);
    width("employerShareBar", result.barEmployerPart);
    text("netShareLabel", percent(result.netGrossRatio));
    text("deductionShareLabel", percent(result.employeeLossRatio));
    text("employerShareLabel", percent(result.employerExtraRatio));

    const [insightTitle, insightText] = insight(result);
    text("insightTitle", insightTitle);
    text("insightText", insightText);

    text("readingNet", money(result.netSalary));
    text("readingGross", money(result.gross));
    text("readingCost", money(result.totalCost));

    renderBreakdown(result);
    renderScenarios(input, result);
  }

  function run() {
    const input = readInput();
    render(calculate(input), input);
  }

  function setMode(mode) {
    currentMode = mode === "advanced" ? "advanced" : "basic";
    document.querySelectorAll("[data-mode]").forEach((button) => {
      const active = button.dataset.mode === currentMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    const panel = $("advancedPanel");
    if (panel) panel.hidden = currentMode !== "advanced";
    const note = $("modeNote");
    if (note) {
      note.innerHTML = currentMode === "advanced"
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v5m0 4h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><p><strong>Pokročilý režim</strong> zapojuje prémie, osobní slevy, pracujícího důchodce, zdravotní minimum, jiné srážky a roční sociální strop.</p>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v5m0 4h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><p><strong>Základní režim</strong> odpovídá běžnému měsíci zaměstnance v pracovním poměru. Pro první výsledek stačí hrubá mzda.</p>';
    }
    run();
  }

  function markPreset(name) {
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.preset === name));
    });
  }

  function resetAdvanced() {
    $("bonusSalary").value = 0;
    $("otherDeductions").value = 0;
    $("disabilityDiscount").value = 0;
    $("yearSocialBase").value = 0;
    $("ztpDiscount").checked = false;
    $("pensionerDiscount").checked = false;
    $("healthMinimum").checked = false;
    $("applySocialCap").checked = true;
  }

  function applyPreset(name) {
    const preset = PRESETS[name] || PRESETS.standard;
    $("grossSalary").value = preset.grossSalary;
    $("children").value = preset.children;
    $("taxDeclaration").checked = preset.taxDeclaration;
    resetAdvanced();
    setMode("basic");
    markPreset(name);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  form.querySelectorAll("input,select").forEach((element) => {
    element.addEventListener("input", () => { markPreset(""); run(); });
    element.addEventListener("change", () => { markPreset(""); run(); });
  });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });

  $("resetBtn")?.addEventListener("click", () => applyPreset("standard"));

  setMode("basic");
  markPreset("standard");
})();
