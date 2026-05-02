(function () {
  const form = document.getElementById("rentalYieldForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
  const pct = (value, digits = 2) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(value)} %`;

  function values() {
    return {
      propertyPrice: Number($("propertyPrice").value) || 0,
      purchaseCosts: Number($("purchaseCosts").value) || 0,
      monthlyRent: Number($("monthlyRent").value) || 0,
      vacancyRate: Number($("vacancyRate").value) || 0,
      managementMonthly: Number($("managementMonthly").value) || 0,
      maintenanceMonthly: Number($("maintenanceMonthly").value) || 0,
      fundRepairsMonthly: Number($("fundRepairsMonthly").value) || 0,
      insuranceMonthly: Number($("insuranceMonthly").value) || 0,
      propertyTaxMonthly: Number($("propertyTaxMonthly").value) || 0,
      otherMonthly: Number($("otherMonthly").value) || 0,
      financingMonthly: Number($("financingMonthly").value) || 0,
      yieldTarget: Number($("yieldTarget").value) || 0
    };
  }

  function calculate(input) {
    const totalInvestment = input.propertyPrice + input.purchaseCosts;
    const grossAnnualRent = input.monthlyRent * 12;
    const vacancyLoss = grossAnnualRent * input.vacancyRate / 100;
    const effectiveAnnualRent = grossAnnualRent - vacancyLoss;
    const operatingCostsAnnual = (input.managementMonthly + input.maintenanceMonthly + input.fundRepairsMonthly + input.insuranceMonthly + input.propertyTaxMonthly + input.otherMonthly) * 12;
    const netAnnualIncome = effectiveAnnualRent - operatingCostsAnnual;
    const grossYield = totalInvestment > 0 ? grossAnnualRent / totalInvestment * 100 : 0;
    const netYield = totalInvestment > 0 ? netAnnualIncome / totalInvestment * 100 : 0;
    const annualFinancing = input.financingMonthly * 12;
    const cashflowAfterFinancing = netAnnualIncome - annualFinancing;
    const yieldGap = netYield - input.yieldTarget;
    return { totalInvestment, grossAnnualRent, vacancyLoss, effectiveAnnualRent, operatingCostsAnnual, netAnnualIncome, grossYield, netYield, annualFinancing, cashflowAfterFinancing, yieldGap };
  }

  function decision(result) {
    if (result.netYield >= 5) return { badge: "Silnější čistý výnos", text: "Investice podle zadaných hodnot působí zajímavě i po nákladech. Další krok je ověřit cashflow po financování a citlivost na neobsazenost.", cls: "badge success" };
    if (result.netYield >= 3) return { badge: "Střední čistý výnos", text: "Výnos není špatný, ale u investiční nemovitosti je potřeba pečlivě hlídat náklady, financování a rezervy na opravy.", cls: "badge warning" };
    return { badge: "Slabý čistý výnos", text: "Po započtení nákladů vychází čistý výnos nízko. U takového bytu může investiční smysl stát spíš na růstu hodnoty než na pravidelném výnosu.", cls: "badge danger" };
  }

  function renderTable(input, result) {
    const rows = [
      ["Celková investice", money(result.totalInvestment), "Cena nemovitosti plus pořizovací náklady"],
      ["Hrubé roční nájemné", money(result.grossAnnualRent), "Nájem bez očištění"],
      ["Ztráta z neobsazenosti", `-${money(result.vacancyLoss)}`, `${pct(input.vacancyRate, 1)} z hrubého nájmu`],
      ["Provozní náklady", `-${money(result.operatingCostsAnnual)}`, "Správa, fond, údržba, pojištění a další"],
      ["Čistý roční příjem", money(result.netAnnualIncome), "Nájem po nákladech bez financování"],
      ["Čistý výnos", pct(result.netYield), "Čistý příjem vůči celkové investici"],
      ["Cashflow po financování", money(result.cashflowAfterFinancing), "Čistý příjem minus splátky za rok"]
    ];
    $("breakdownBody").innerHTML = rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function render(input, result) {
    const state = decision(result);
    $("netAnnualIncome").textContent = money(result.netAnnualIncome);
    $("netYieldPercent").textContent = pct(result.netYield);
    $("grossAnnualRent").textContent = money(result.grossAnnualRent);
    $("cashflowAfterFinancing").textContent = money(result.cashflowAfterFinancing);
    $("yieldBadge").textContent = state.badge;
    $("yieldBadge").className = state.cls;
    $("decisionText").textContent = state.text;
    $("summaryTotalInvestment").textContent = money(result.totalInvestment);
    $("summaryVacancyLoss").textContent = money(result.vacancyLoss);
    $("summaryOperatingCosts").textContent = money(result.operatingCostsAnnual);
    $("summaryGrossYield").textContent = pct(result.grossYield);
    $("summaryYieldGap").textContent = pct(result.yieldGap);
    $("heroMain").textContent = pct(result.netYield);
    $("heroIncome").textContent = money(result.netAnnualIncome);
    $("heroGross").textContent = pct(result.grossYield);
    $("heroCashflow").textContent = money(result.cashflowAfterFinancing);
    $("heroBar").style.width = `${Math.max(8, Math.min(100, result.netYield / Math.max(input.yieldTarget, 1) * 100))}%`;
    renderTable(input, result);
  }

  function run() {
    const input = values();
    render(input, calculate(input));
  }

  document.querySelectorAll("[data-yield-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.yieldPreset;
      if (preset === "city") {
        $("propertyPrice").value = 4900000;
        $("purchaseCosts").value = 180000;
        $("monthlyRent").value = 22000;
        $("vacancyRate").value = 5;
      }
      if (preset === "strong") {
        $("propertyPrice").value = 3600000;
        $("purchaseCosts").value = 140000;
        $("monthlyRent").value = 21000;
        $("vacancyRate").value = 4;
      }
      if (preset === "weak") {
        $("propertyPrice").value = 6500000;
        $("purchaseCosts").value = 230000;
        $("monthlyRent").value = 23500;
        $("vacancyRate").value = 6;
      }
      run();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  form.querySelectorAll("input, select").forEach((field) => {
    field.addEventListener("input", run);
    field.addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("propertyPrice").value = 4900000;
    $("purchaseCosts").value = 180000;
    $("monthlyRent").value = 22000;
    $("vacancyRate").value = 5;
    $("managementMonthly").value = 0;
    $("maintenanceMonthly").value = 1200;
    $("fundRepairsMonthly").value = 1800;
    $("insuranceMonthly").value = 250;
    $("propertyTaxMonthly").value = 150;
    $("otherMonthly").value = 300;
    $("financingMonthly").value = 0;
    $("yieldTarget").value = 4;
    run();
  });

  run();
})();
