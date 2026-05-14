(function () {
  const form = document.getElementById("grossFromNetForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const CONFIG = {
    socialEmployee: 0.071,
    healthEmployee: 0.045,
    socialEmployer: 0.248,
    healthEmployer: 0.09,
    taxBasic: 0.15,
    taxHigh: 0.23,
    highTaxThreshold: 146901,
    taxpayerDiscount: 2570,
    child1: 1267,
    child2: 1860,
    child3plus: 2320
  };

  const presets = {
    standard: { netSalary: 35000, otherDeductions: 0, children: 0, taxpayerDiscount: true },
    family: { netSalary: 43000, otherDeductions: 0, children: 2, taxpayerDiscount: true },
    higher: { netSalary: 70000, otherDeductions: 0, children: 0, taxpayerDiscount: true },
    manager: { netSalary: 130000, otherDeductions: 0, children: 0, taxpayerDiscount: true }
  };

  const round = (value) => Math.round(Number(value) || 0);
  const roundUp = (value) => Math.ceil(Number(value) || 0);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(round(value));
  const pct = (value) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(value)} %`;

  function childCredit(children) {
    if (children <= 0) return 0;
    if (children === 1) return CONFIG.child1;
    if (children === 2) return CONFIG.child1 + CONFIG.child2;
    return CONFIG.child1 + CONFIG.child2 + (children - 2) * CONFIG.child3plus;
  }

  function taxBase(gross) {
    if (gross <= 100) return roundUp(gross);
    return Math.ceil(gross / 100) * 100;
  }

  function taxBeforeDiscounts(base) {
    const basic = Math.min(base, CONFIG.highTaxThreshold);
    const high = Math.max(0, base - CONFIG.highTaxThreshold);
    return roundUp(basic * CONFIG.taxBasic + high * CONFIG.taxHigh);
  }

  function forward(grossSalary, input) {
    const gross = Math.max(0, round(grossSalary));
    const socialEmployee = roundUp(gross * CONFIG.socialEmployee);
    const healthEmployee = roundUp(gross * CONFIG.healthEmployee);
    const socialEmployer = roundUp(gross * CONFIG.socialEmployer);
    const healthEmployer = roundUp(gross * CONFIG.healthEmployer);
    const base = taxBase(gross);
    const taxBefore = taxBeforeDiscounts(base);
    const taxpayer = input.taxpayerDiscount ? CONFIG.taxpayerDiscount : 0;
    const childrenCredit = childCredit(input.children);
    const totalDiscounts = taxpayer + childrenCredit;
    const taxAfterBasic = Math.max(0, taxBefore - taxpayer);
    const taxAfterChildrenRaw = taxAfterBasic - childrenCredit;
    const taxAfterDiscounts = Math.max(0, taxAfterChildrenRaw);
    const taxBonus = Math.max(0, -taxAfterChildrenRaw);
    const netBeforeOther = gross - socialEmployee - healthEmployee - taxAfterDiscounts + taxBonus;
    const netAfterOther = Math.max(0, netBeforeOther - input.otherDeductions);
    const employeeDeductions = socialEmployee + healthEmployee + taxAfterDiscounts + input.otherDeductions - taxBonus;
    return {
      grossSalary: gross,
      taxBase: base,
      netBeforeOther,
      netAfterOther,
      socialEmployee,
      healthEmployee,
      taxBefore,
      taxpayer,
      childrenCredit,
      totalDiscounts,
      taxAfterDiscounts,
      taxBonus,
      otherDeductions: input.otherDeductions,
      employeeDeductions,
      socialEmployer,
      healthEmployer,
      totalCost: gross + socialEmployer + healthEmployer,
      highTaxBase: Math.max(0, base - CONFIG.highTaxThreshold)
    };
  }

  function readInput() {
    return {
      targetNet: Math.max(0, Number($("netSalary").value) || 0),
      otherDeductions: Math.max(0, Number($("otherDeductions").value) || 0),
      children: Math.max(0, Math.min(5, Math.round(Number($("children").value) || 0))),
      taxpayerDiscount: $("taxpayerDiscount").checked
    };
  }

  function estimate(input) {
    let low = 0;
    let high = Math.max((input.targetNet + input.otherDeductions) * 2.4, 30000);
    let best = forward(high, input);
    let guard = 0;
    while (best.netAfterOther < input.targetNet && guard < 50) {
      high *= 1.5;
      best = forward(high, input);
      guard++;
    }
    for (let i = 0; i < 70; i++) {
      const mid = Math.round((low + high) / 2);
      const current = forward(mid, input);
      if (Math.abs(current.netAfterOther - input.targetNet) < Math.abs(best.netAfterOther - input.targetNet)) best = current;
      if (current.netAfterOther < input.targetNet) low = mid + 1;
      else high = mid - 1;
    }
    return best;
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function bar(id, value, max) {
    const element = $(id);
    if (element) element.style.width = `${Math.max(8, Math.min(100, max ? value / max * 100 : 0))}%`;
  }

  function renderTable(input, data) {
    const rows = [
      ["Cílová čistá mzda na účet", money(input.targetNet), "Částka, kterou chcete dostat po odvodech a srážkách"],
      ["Hrubá mzda", money(data.grossSalary), "Orientačně dopočtená smluvní hrubá mzda"],
      ["Základ pro zálohu na daň", money(data.taxBase), "Hrubá mzda zaokrouhlená pro daňový výpočet"],
      ["Sociální pojištění zaměstnance (7,1 %)", `− ${money(data.socialEmployee)}`, "Odvod zaměstnance"],
      ["Zdravotní pojištění zaměstnance (4,5 %)", `− ${money(data.healthEmployee)}`, "Odvod zaměstnance"],
      ["Daň před slevami (15 % / 23 %)", money(data.taxBefore), data.highTaxBase > 0 ? "Část mzdy spadá do 23% pásma" : "Základní daňové pásmo"],
      ["Sleva na poplatníka", `− ${money(data.taxpayer)}`, "Základní měsíční sleva"],
      ["Daňové zvýhodnění na děti", `− ${money(data.childrenCredit)}`, "Může vytvořit daňový bonus"],
      ["Daň po slevách", `− ${money(data.taxAfterDiscounts)}`, "Reálně započtená daň"],
      ["Daňový bonus", `+ ${money(data.taxBonus)}`, "Bonus z daňového zvýhodnění na děti"],
      ["Jiné pravidelné srážky", `− ${money(data.otherDeductions)}`, "Srážky po výpočtu čisté mzdy"],
      ["Čistá mzda podle modelu", money(data.netAfterOther), "Nejbližší dopočtená částka"],
      ["Cena práce", money(data.totalCost), "Hrubá mzda plus odvody zaměstnavatele"]
    ];
    $("summaryTableBody").innerHTML = rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function render(input, data) {
    const diff = data.netAfterOther - input.targetNet;
    const absDiff = Math.abs(diff);
    const matchLabel = absDiff <= 20 ? "Velmi blízký odhad" : absDiff <= 100 ? "Blízký odhad" : "Orientační odhad";
    const grossToNet = data.grossSalary > 0 ? data.netAfterOther / data.grossSalary * 100 : 0;

    setText("grossSalaryResult", money(data.grossSalary));
    setText("totalCostResult", money(data.totalCost));
    setText("employeeDeductionsResult", money(Math.max(0, data.employeeDeductions)));
    setText("taxResult", money(data.taxAfterDiscounts));
    setText("netSalaryResult", money(data.netAfterOther));
    setText("socialEmployeeResult", money(data.socialEmployee));
    setText("healthEmployeeResult", money(data.healthEmployee));
    setText("socialEmployerResult", money(data.socialEmployer));
    setText("healthEmployerResult", money(data.healthEmployer));
    setText("discountsResult", `${money(data.totalDiscounts)} / bonus ${money(data.taxBonus)}`);
    setText("heroGross", money(data.grossSalary));
    setText("heroNet", money(data.netAfterOther));
    setText("heroCost", money(data.totalCost));
    setText("heroDeductions", money(Math.max(0, data.employeeDeductions)));
    setText("heroMatch", matchLabel.toLowerCase());

    const badge = $("resultBadge");
    badge.className = absDiff <= 50 ? "badge success" : "badge warning";
    badge.textContent = matchLabel;

    const childText = input.children > 0 ? `Včetně zvýhodnění na ${input.children} ${input.children === 1 ? "dítě" : "děti"}.` : "Bez daňového zvýhodnění na děti.";
    const bandText = data.highTaxBase > 0 ? "Část mzdy spadá do 23% pásma." : "Výpočet zůstává v 15% pásmu.";
    setText("resultNote", `Pro cílovou čistou mzdu ${money(input.targetNet)} vychází hrubá mzda ${money(data.grossSalary)}. Dopočtená čistá je ${money(data.netAfterOther)}, rozdíl proti cíli ${money(absDiff)}. ${childText} ${bandText}`);
    setText("grossDecision", `Čistý podíl z hrubé mzdy je ${pct(grossToNet)}. Pro nabídku práce sledujte i cenu práce ${money(data.totalCost)}; detail odvodů je v rozpadu níže.`);
    setText("annualGrossResult", money(data.grossSalary * 12));
    setText("annualCostResult", money(data.totalCost * 12));
    setText("targetDiffResult", money(absDiff));
    setText("taxBandSummary", data.highTaxBase > 0 ? "15 % + 23 %" : "15 %");

    bar("heroNetBar", data.netAfterOther, data.totalCost);
    bar("heroDeductionsBar", Math.max(0, data.employeeDeductions), data.totalCost);
    bar("heroCostBar", data.totalCost, data.totalCost);
    renderTable(input, data);
  }

  function run() {
    const input = readInput();
    if (input.targetNet <= 0) return;
    render(input, estimate(input));
  }

  function applyPreset(name) {
    const preset = presets[name] || presets.standard;
    $("netSalary").value = preset.netSalary;
    $("otherDeductions").value = preset.otherDeductions;
    $("children").value = preset.children;
    $("taxpayerDiscount").checked = preset.taxpayerDiscount;
    run();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["netSalary", "otherDeductions", "children", "taxpayerDiscount"].forEach((id) => {
    $(id).addEventListener("input", run);
    $(id).addEventListener("change", run);
  });

  document.querySelectorAll("[data-gross-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.grossPreset));
  });

  $("resetBtn").addEventListener("click", () => applyPreset("standard"));
  run();
})();
