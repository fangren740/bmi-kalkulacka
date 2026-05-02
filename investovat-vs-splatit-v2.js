(function () {
  const form = document.getElementById("compareForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
  const pct = (value, digits = 2) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(value)} %`;

  function values() {
    return {
      amount: Number($("amount").value) || 0,
      mortgageRate: Number($("mortgageRate").value) || 0,
      investmentReturn: Number($("investmentReturn").value) || 0,
      years: Number($("years").value) || 0,
      riskMode: $("riskMode").value,
      taxDrag: Number($("taxDrag").value) || 0
    };
  }

  function riskLabel(mode) {
    if (mode === "conservative") return "Opatrný";
    if (mode === "balanced") return "Vyvážený";
    return "Dynamický";
  }

  function calculate(input) {
    const effectiveReturn = Math.max(0, input.investmentReturn - input.taxDrag);
    const investmentValue = input.amount * Math.pow(1 + effectiveReturn / 100, input.years);
    const mortgageSavings = input.amount * (Math.pow(1 + input.mortgageRate / 100, input.years) - 1);
    const repayValue = input.amount + mortgageSavings;
    const difference = investmentValue - repayValue;
    return { effectiveReturn, investmentValue, mortgageSavings, repayValue, difference };
  }

  function decision(result) {
    const abs = Math.abs(result.difference);
    if (result.difference > 50000) return { badge: "Číselně vychází investování", text: "Při zadaném výnosu a horizontu má investování vyšší orientační výsledek. Je ale nutné unést kolísání a držet plán i ve slabších letech.", cls: "badge success" };
    if (result.difference < -50000) return { badge: "Číselně vychází splatit hypotéku", text: "Mimořádná splátka má podle zadaných hodnot vyšší jistý efekt než investiční scénář. Výhodou je nižší dluh a menší úrokové riziko.", cls: "badge warning" };
    return { badge: "Výsledek je blízko", text: `Rozdíl ${money(abs)} není proti velikosti rozhodnutí dramatický. V takové situaci často rozhoduje spíš klid, likvidita a vztah k riziku než samotná tabulka.`, cls: "badge warning" };
  }

  function renderTable(input) {
    const rows = [-2, 0, 2].map((delta) => {
      const scenarioReturn = Math.max(0, input.investmentReturn + delta);
      const effective = Math.max(0, scenarioReturn - input.taxDrag);
      const investmentValue = input.amount * Math.pow(1 + effective / 100, input.years);
      const mortgageSavings = input.amount * (Math.pow(1 + input.mortgageRate / 100, input.years) - 1);
      const repayValue = input.amount + mortgageSavings;
      const difference = investmentValue - repayValue;
      return [`Výnos ${pct(scenarioReturn)}`, money(investmentValue), money(repayValue), money(difference)];
    });
    $("scenarioTableBody").innerHTML = rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td><td>${row[3]}</td></tr>`).join("");
  }

  function render(input, result) {
    const state = decision(result);
    $("investmentValue").textContent = money(result.investmentValue);
    $("mortgageSavings").textContent = money(result.mortgageSavings);
    $("differenceValue").textContent = money(result.difference);
    $("effectiveReturn").textContent = pct(result.effectiveReturn);
    $("winnerBadge").textContent = state.badge;
    $("winnerBadge").className = state.cls;
    $("decisionText").textContent = state.text;
    $("summaryAmount").textContent = money(input.amount);
    $("summaryMortgageRate").textContent = pct(input.mortgageRate);
    $("summaryInvestmentReturn").textContent = pct(input.investmentReturn);
    $("summaryYears").textContent = `${input.years} let`;
    $("summaryRisk").textContent = riskLabel(input.riskMode);
    $("heroMain").textContent = money(result.difference);
    $("heroInvest").textContent = money(result.investmentValue);
    $("heroRepay").textContent = money(result.repayValue);
    $("heroReturn").textContent = pct(result.effectiveReturn);
    $("heroBar").style.width = `${Math.max(8, Math.min(100, Math.abs(result.difference) / Math.max(input.amount, 1) * 100))}%`;
    renderTable(input);
  }

  function run() {
    const input = values();
    render(input, calculate(input));
  }

  document.querySelectorAll("[data-compare-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.comparePreset;
      if (preset === "balanced") {
        $("amount").value = 500000;
        $("mortgageRate").value = 4.89;
        $("investmentReturn").value = 7;
        $("years").value = 15;
      }
      if (preset === "repay") {
        $("amount").value = 500000;
        $("mortgageRate").value = 5.7;
        $("investmentReturn").value = 4.5;
        $("years").value = 10;
      }
      if (preset === "invest") {
        $("amount").value = 500000;
        $("mortgageRate").value = 3.8;
        $("investmentReturn").value = 8;
        $("years").value = 20;
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
    $("amount").value = 500000;
    $("mortgageRate").value = 4.89;
    $("investmentReturn").value = 7;
    $("years").value = 15;
    $("riskMode").value = "balanced";
    $("taxDrag").value = 0;
    run();
  });

  run();
})();
