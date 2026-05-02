(function () {
  const form = document.getElementById("roiForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
  const pct = (value) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(value)} %`;
  const years = (value) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(value)} roku`;

  function values() {
    return {
      initialInvestment: Number($("initialInvestment").value) || 0,
      annualRevenue: Number($("annualRevenue").value) || 0,
      annualCosts: Number($("annualCosts").value) || 0,
      projectYears: Number($("projectYears").value) || 0,
      residualValue: Number($("residualValue").value) || 0,
      investmentType: $("investmentType").value
    };
  }

  function typeLabel(type) {
    if (type === "business") return "Podnikání";
    if (type === "property") return "Nemovitost";
    if (type === "equipment") return "Vybavení";
    return "Investice";
  }

  function calculate(input) {
    const annualNet = input.annualRevenue - input.annualCosts;
    const totalBenefit = annualNet * input.projectYears + input.residualValue;
    const netProfit = totalBenefit - input.initialInvestment;
    const roi = input.initialInvestment > 0 ? netProfit / input.initialInvestment * 100 : 0;
    const payback = annualNet > 0 ? input.initialInvestment / annualNet : Infinity;
    return { annualNet, totalBenefit, netProfit, roi, payback };
  }

  function renderTable(input, result) {
    $("summaryTableBody").innerHTML = [
      ["Počáteční investice", money(input.initialInvestment), "Vstupní kapitál nebo náklad"],
      ["Roční příjem", money(input.annualRevenue), "Hrubý roční přínos"],
      ["Roční náklady", money(input.annualCosts), "Provozní nebo související náklady"],
      ["Roční čistý přínos", money(result.annualNet), "Příjem minus náklady"],
      ["Celkový přínos", money(result.totalBenefit), "Čistý přínos za období plus zůstatková hodnota"],
      ["Čistý zisk", money(result.netProfit), "Celkový přínos minus investice"]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function render(input, result) {
    $("roiResult").textContent = pct(result.roi);
    $("netProfitResult").textContent = money(result.netProfit);
    $("paybackResult").textContent = Number.isFinite(result.payback) ? years(result.payback) : "není návratná";
    $("annualNetResult").textContent = money(result.annualNet);
    $("resultBadge").textContent = result.netProfit > 0 ? "Investice vychází kladně" : "Investice nevychází kladně";
    $("resultBadge").className = result.netProfit > 0 ? "badge success" : "badge warning";
    $("initialInvestmentResult").textContent = money(input.initialInvestment);
    $("annualRevenueResult").textContent = money(input.annualRevenue);
    $("annualCostsResult").textContent = money(input.annualCosts);
    $("projectYearsResult").textContent = `${input.projectYears} let`;
    $("residualValueResult").textContent = money(input.residualValue);
    $("totalBenefitResult").textContent = money(result.totalBenefit);
    $("resultNote").textContent = `Typ: ${typeLabel(input.investmentType)}. Roční čistý přínos je ${money(result.annualNet)} a čistý výsledek za celé období ${money(result.netProfit)}.`;
    $("heroRoi").textContent = pct(result.roi);
    $("heroProfit").textContent = money(result.netProfit);
    $("heroPayback").textContent = Number.isFinite(result.payback) ? years(result.payback) : "-";
    $("heroAnnual").textContent = money(result.annualNet);
    $("heroBar").style.width = `${Math.max(8, Math.min(100, Math.max(0, result.roi)))}%`;
    renderTable(input, result);
  }

  function run() {
    const input = values();
    render(input, calculate(input));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["initialInvestment", "annualRevenue", "annualCosts", "projectYears", "residualValue", "investmentType"].forEach((id) => {
    $(id).addEventListener("input", run);
    $(id).addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("initialInvestment").value = 250000;
    $("annualRevenue").value = 120000;
    $("annualCosts").value = 20000;
    $("projectYears").value = 5;
    $("residualValue").value = 30000;
    $("investmentType").value = "business";
    run();
  });

  run();
})();
