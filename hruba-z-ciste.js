(() => {
  "use strict";

  const form = document.getElementById("grossFromNetForm");
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
    monthlyBonusMinimum: 50,
    maxGrossSearch: 100000000
  });

  const PRESETS = Object.freeze({
    entry: { targetNet: 28000, children: 0, taxDeclaration: true },
    standard: { targetNet: 35000, children: 0, taxDeclaration: true },
    family: { targetNet: 43000, children: 2, taxDeclaration: true },
    higher: { targetNet: 70000, children: 0, taxDeclaration: true }
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
      targetNet: numberFrom("targetNet"),
      children: clamp(Math.round(numberFrom("children")), 0, 5),
      taxDeclaration: checked("taxDeclaration"),
      otherDeductions: advanced ? numberFrom("otherDeductions") : 0,
      disabilityDiscount: advanced ? numberFrom("disabilityDiscount") : 0,
      yearSocialBase: advanced ? numberFrom("yearSocialBase") : 0,
      negotiationStep: advanced ? Math.max(1, numberFrom("negotiationStep")) : 500,
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

  function calculateGross(grossValue, input) {
    const gross = clamp(Math.round(Number(grossValue) || 0), 0, CONFIG.maxGrossSearch);
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
    const employeeDeductions = Math.max(0, gross - netBeforeOther);
    const netGrossRatio = gross > 0 ? netSalary / gross * 100 : 0;
    const netCostRatio = totalCost > 0 ? netSalary / totalCost * 100 : 0;
    const employeeCostRatio = totalCost > 0 ? Math.max(0, gross - netSalary) / totalCost * 100 : 0;
    const employerCostRatio = totalCost > 0 ? employerContributions / totalCost * 100 : 0;
    const highTaxBase = Math.max(0, baseForTax - CONFIG.highTaxMonthlyThreshold);

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
      employeeDeductions,
      netGrossRatio,
      netCostRatio,
      employeeCostRatio,
      employerCostRatio,
      highTaxBase
    };
  }

  function isBetter(candidate, best, target) {
    const candidateError = Math.abs(candidate.netSalary - target);
    const bestError = Math.abs(best.netSalary - target);
    if (candidateError !== bestError) return candidateError < bestError;
    if (candidate.netSalary >= target && best.netSalary < target) return true;
    if (candidate.netSalary < target && best.netSalary >= target) return false;
    return candidate.gross < best.gross;
  }

  function estimate(input) {
    if (input.targetNet <= 0) {
      const zero = calculateGross(0, input);
      return { ...zero, negotiationGross: 0, negotiation: zero, targetDifference: 0 };
    }

    let low = 0;
    let high = Math.max(CONFIG.minimumWage, input.targetNet + input.otherDeductions + 12000);
    let highResult = calculateGross(high, input);
    let guard = 0;

    while (highResult.netSalary < input.targetNet && high < CONFIG.maxGrossSearch && guard < 70) {
      high = Math.min(CONFIG.maxGrossSearch, Math.ceil(high * 1.45 + 1000));
      highResult = calculateGross(high, input);
      guard += 1;
    }

    let best = highResult;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const current = calculateGross(mid, input);
      if (isBetter(current, best, input.targetNet)) best = current;
      if (current.netSalary < input.targetNet) low = mid + 1;
      else high = mid - 1;
    }

    const refinementStart = Math.max(0, best.gross - 350);
    const refinementEnd = Math.min(CONFIG.maxGrossSearch, best.gross + 350);
    for (let gross = refinementStart; gross <= refinementEnd; gross += 1) {
      const current = calculateGross(gross, input);
      if (isBetter(current, best, input.targetNet)) best = current;
    }

    const step = Math.max(1, input.negotiationStep || 500);
    const negotiationGross = best.gross > 0 ? Math.ceil(best.gross / step) * step : 0;
    const negotiation = calculateGross(negotiationGross, input);
    return {
      ...best,
      negotiationGross,
      negotiation,
      targetDifference: best.netSalary - input.targetNet
    };
  }

  function modeDescription(input) {
    if (input.mode === "basic") return "Běžný HPP model";
    const flags = [];
    if (input.otherDeductions > 0) flags.push("jiné srážky");
    if (input.disabilityDiscount > 0 || input.ztpDiscount) flags.push("osobní sleva");
    if (input.pensionerDiscount) flags.push("pracující důchodce");
    if (input.healthMinimum) flags.push("zdravotní minimum");
    if (input.yearSocialBase > 0) flags.push("roční sociální základ");
    return flags.length ? flags.slice(0, 2).join(" · ") : "Pokročilý HPP model";
  }

  function childLabel(count) {
    if (count === 1) return "1 dítě";
    if (count >= 2 && count <= 4) return `${count} děti`;
    return `${count} dětí`;
  }

  function fitState(difference) {
    const absolute = Math.abs(difference);
    if (absolute <= 5) return { className: "", label: `rozdíl ${money(absolute)}`, explanation: "Výsledek je prakticky shodný se zadanou čistou mzdou." };
    if (absolute <= 50) return { className: "is-warning", label: `rozdíl ${money(absolute)}`, explanation: "Rozdíl je malý a vzniká hlavně zaokrouhlením daně a pojistného." };
    return { className: "is-risk", label: `rozdíl ${money(absolute)}`, explanation: "Výsledek je orientační. Zkontrolujte zadané slevy, děti a pravidelné srážky." };
  }

  function insight(result) {
    const difference = result.targetDifference;
    if (result.socialCapUsed) {
      return [
        "Výsledek ovlivňuje dosažený roční strop sociálního",
        "U velmi vysokých příjmů záleží na skutečném ročním vyměřovacím základu. Pro pracovní nabídku proto ověřte i očekávané bonusy v ostatních měsících."
      ];
    }
    if (result.healthSupplementBase > 0) {
      return [
        "Zdravotní minimum zvyšuje potřebnou hrubou mzdu",
        "Pokud se na vás povinnost minima nevztahuje, vypněte ji. Výjimky se týkají například některých státních pojištěnců a souběhů zaměstnání."
      ];
    }
    if (!result.taxDeclaration) {
      return [
        "Bez prohlášení je potřebná hrubá mzda vyšší",
        "U tohoto zaměstnavatele se měsíčně neuplatní sleva na poplatníka ani zadané zvýhodnění. Některé nároky lze následně řešit v ročním zúčtování nebo přiznání."
      ];
    }
    if (result.children > 0) {
      return [
        "Daňové zvýhodnění snižuje potřebnou hrubou mzdu",
        `Model počítá s uplatněním na ${childLabel(result.children)} právě u tohoto zaměstnavatele. Pokud děti uplatňuje druhý rodič, změňte počet na nulu.`
      ];
    }
    if (Math.abs(difference) <= 5) {
      return [
        "Pro jednání použijte mírně zaokrouhlenou částku",
        `Přesný model vychází na ${money(result.gross)}. Praktické doporučení ${money(result.negotiationGross)} vytváří malou rezervu proti odlišnému zaokrouhlení nebo nezadaným položkám.`
      ];
    }
    return [
      "Výsledek berte jako orientační mzdový požadavek",
      "Skutečnou výplatní pásku mohou změnit benefity, náhrady, nemoc, neplacené volno nebo jiné srážky. Pro důležité rozhodnutí si ověřte i dopředný výpočet čisté mzdy."
    ];
  }

  function renderBreakdown(result) {
    const rows = [
      ["Požadovaná čistá mzda", money(result.targetNet), "Částka, kterou chcete dostat na účet po zadaných srážkách."],
      ["Nalezená hrubá mzda", money(result.gross), "Nejbližší hrubá částka podle opačného mzdového výpočtu."],
      ["Sociální základ", money(result.socialBase), result.socialCapUsed ? "Omezeno zbývající částí ročního maxima." : "Běžný vyměřovací základ pro sociální pojistné."],
      ["Sociální pojistné zaměstnance", `− ${money(result.socialEmployee)}`, result.pensionerDiscountAmount > 0 ? `Po slevě pracujícího důchodce ${money(result.pensionerDiscountAmount)}.` : "Sazba 7,1 % ze sociálního základu."],
      ["Zdravotní pojistné zaměstnance", `− ${money(result.healthEmployee)}`, result.healthSupplementBase > 0 ? `Včetně dopočtu z rozdílu ${money(result.healthSupplementBase)} do minima.` : "Zaměstnanecká část celkového zdravotního pojistného."],
      ["Základ pro zálohu na daň", money(result.baseForTax), "Hrubá mzda zaokrouhlená na celé stokoruny nahoru."],
      ["Daň před slevami", money(result.taxBeforeDiscounts), result.highTaxBase > 0 ? `Část ${money(result.highTaxBase)} spadá do 23% pásma.` : "Celý základ zůstává v 15% pásmu."],
      ["Osobní daňové slevy", `− ${money(result.personalDiscounts)}`, result.taxDeclaration ? "Sleva na poplatníka a případné další zvolené slevy." : "Bez podepsaného Prohlášení poplatníka se měsíčně neuplatní."],
      ["Daňové zvýhodnění na děti", `− ${money(result.childrenCredit)}`, result.children > 0 ? `Zvýhodnění pro ${childLabel(result.children)}.` : "Bez zadaných dětí."],
      ["Daň po slevách", `− ${money(result.taxAfterDiscounts)}`, "Záloha na daň skutečně odečtená ze mzdy."],
      ["Daňový bonus", `+ ${money(result.taxBonus)}`, result.taxBonus > 0 ? "Bonus vyplacený po splnění příjmové podmínky." : "V tomto scénáři nevzniká vyplacený bonus."],
      ["Čistá mzda před jinými srážkami", money(result.netBeforeOther), "Hrubá mzda po povinném pojistném, dani a případném bonusu."],
      ["Jiné pravidelné srážky", `− ${money(result.otherDeductions)}`, "Položky odečtené až po běžném mzdovém výpočtu."],
      ["Modelová čistá mzda na účet", money(result.netSalary), `Rozdíl proti cíli ${money(Math.abs(result.targetDifference))}.`],
      ["Sociální pojistné zaměstnavatele", money(result.socialEmployer), "Běžná sazba 24,8 % ze sociálního základu."],
      ["Zdravotní pojistné zaměstnavatele", money(result.healthEmployer), "Běžný podíl zaměstnavatele na zdravotním pojistném."],
      ["Cena práce", money(result.totalCost), "Hrubá mzda a modelované povinné odvody zaměstnavatele."],
      ["Doporučená hrubá pro jednání", money(result.negotiationGross), `Zaokrouhleno nahoru na krok ${money(result.negotiationStep)}.`]
    ];

    const body = $("breakdownBody");
    if (!body) return;
    body.innerHTML = rows.map(([name, value, note]) => `<tr><td>${name}</td><td>${value}</td><td>${note}</td></tr>`).join("");
  }

  function scenarioResult(input, target) {
    return estimate({ ...input, targetNet: Math.max(0, target) });
  }

  function renderScenarios(input, result) {
    const delta = input.targetNet < 30000 ? 3000 : input.targetNet < 80000 ? 5000 : 10000;
    const targets = [Math.max(1000, input.targetNet - delta), input.targetNet, input.targetNet + delta];
    const labels = ["Úspornější varianta", "Váš zadaný cíl", "Vyšší čistý cíl"];
    const grid = $("scenarioGrid");
    if (!grid) return;

    grid.innerHTML = targets.map((target, index) => {
      const scenario = target === input.targetNet ? result : scenarioResult(input, target);
      const grossDifference = scenario.gross - result.gross;
      const differenceText = index === 1 ? "Výchozí varianta" : `${grossDifference >= 0 ? "+" : "−"} ${money(Math.abs(grossDifference))} hrubého`;
      return `<article class="scenario-card${index === 1 ? " is-current" : ""}"><span>${labels[index]}</span><h3>${money(target)} čistého</h3><p>${differenceText}</p><dl><div><dt>Potřebná hrubá</dt><dd>${money(scenario.gross)}</dd></div><div><dt>Doporučení pro jednání</dt><dd>${money(scenario.negotiationGross)}</dd></div><div><dt>Cena práce</dt><dd>${money(scenario.totalCost)}</dd></div></dl></article>`;
    }).join("");
  }

  function render(input, result) {
    const fit = fitState(result.targetDifference);
    const [insightTitle, insightText] = insight(result);
    const employeePart = Math.max(0, result.gross - result.netSalary);

    text("grossSalaryResult", money(result.gross));
    text("targetNetResult", money(input.targetNet));
    text("netSalaryResult", money(result.netSalary));
    text("totalCostResult", money(result.totalCost));
    text("employeeDeductionsResult", money(employeePart));
    text("negotiationGrossResult", money(result.negotiationGross));
    text("netRatioResult", percent(result.netGrossRatio));
    text("targetFitResult", fit.label);
    text("fitExplanation", fit.explanation);
    text("costShareResult", `${percent(result.netCostRatio)} na účet`);
    text("resultStatus", modeDescription(input));
    text("resultKicker", input.mode === "advanced" ? "Krok 3 · Výsledek" : "Krok 2 · Výsledek");
    text("resultSummary", `Pro čistý cíl ${money(input.targetNet)} vychází modelová čistá mzda ${money(result.netSalary)}.`);
    text("insightTitle", insightTitle);
    text("insightText", insightText);

    text("heroGross", money(result.gross));
    text("heroGrossSmall", money(result.gross));
    text("heroTarget", money(input.targetNet));
    text("heroCost", money(result.totalCost));
    text("heroCostShare", percent(result.netCostRatio));
    text("heroMatch", `modelová čistá mzda ${money(result.netSalary)}`);
    text("heroNote", `${modeDescription(input)}${input.children > 0 ? ` · ${childLabel(input.children)}` : " · bez dětí"}.`);

    text("readingGross", money(result.gross));
    text("readingNegotiation", money(result.negotiationGross));
    text("readingCost", money(result.totalCost));

    const fitPanel = $("fitPanel");
    if (fitPanel) fitPanel.className = `result-fit ${fit.className}`.trim();

    width("netShareBar", result.netCostRatio);
    width("employeeShareBar", result.employeeCostRatio);
    width("employerShareBar", result.employerCostRatio);
    width("heroNetBar", result.netCostRatio);
    width("heroEmployeeBar", result.employeeCostRatio);
    width("heroEmployerBar", result.employerCostRatio);

    renderScenarios(input, result);
    renderBreakdown(result);
  }

  function calculateAndRender() {
    const input = readInput();
    const result = estimate(input);
    render(input, result);
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
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v5m0 4h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><p><strong>Pokročilý režim</strong> přidává jen položky, které mohou změnit konkrétní výplatní pásku. Neznámé volby nechte vypnuté nebo na nule.</p>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v5m0 4h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><p><strong>Základní režim</strong> odpovídá běžnému měsíci zaměstnance v pracovním poměru. Pro první odhad stačí cílová čistá mzda.</p>';
    }
    calculateAndRender();
  }

  function applyPreset(name) {
    const preset = PRESETS[name] || PRESETS.standard;
    $("targetNet").value = preset.targetNet;
    $("children").value = preset.children;
    $("taxDeclaration").checked = preset.taxDeclaration;
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.preset === name));
    });
    calculateAndRender();
  }

  function reset() {
    form.reset();
    $("targetNet").value = 35000;
    $("children").value = 0;
    $("taxDeclaration").checked = true;
    if ($("negotiationStep")) $("negotiationStep").value = 500;
    if ($("applySocialCap")) $("applySocialCap").checked = true;
    setMode("basic");
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.preset === "standard"));
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculateAndRender();
  });

  form.addEventListener("input", calculateAndRender, { passive: true });
  form.addEventListener("change", calculateAndRender, { passive: true });

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });

  $("resetBtn")?.addEventListener("click", reset);

  calculateAndRender();
})();
