(function () {
  const form = document.getElementById("cashflowForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
  const pct = (value) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(value)} %`;

  function values() {
    return {
      monthlyRent: Number($("monthlyRent").value) || 0,
      vacancyRate: Number($("vacancyRate").value) || 0,
      mortgagePayment: Number($("mortgagePayment").value) || 0,
      repairFund: Number($("repairFund").value) || 0,
      insurance: Number($("insurance").value) || 0,
      management: Number($("management").value) || 0,
      maintenanceReserve: Number($("maintenanceReserve").value) || 0,
      propertyTaxReserve: Number($("propertyTaxReserve").value) || 0,
      oneOffAnnualCosts: Number($("oneOffAnnualCosts").value) || 0,
      targetBuffer: Number($("targetBuffer").value) || 0
    };
  }

  function calculate(input) {
    const vacancyLoss = input.monthlyRent * input.vacancyRate / 100;
    const effectiveRent = input.monthlyRent - vacancyLoss;
    const monthlyAnnualCosts = input.oneOffAnnualCosts / 12;
    const operatingCosts = input.repairFund + input.insurance + input.management + input.maintenanceReserve + input.propertyTaxReserve;
    const bufferCost = effectiveRent * input.targetBuffer / 100;
    const totalCosts = input.mortgagePayment + operatingCosts + monthlyAnnualCosts + bufferCost;
    const monthlyCashflow = effectiveRent - totalCosts;
    return {
      vacancyLoss,
      effectiveRent,
      monthlyAnnualCosts,
      operatingCosts,
      bufferCost,
      totalCosts,
      monthlyCashflow,
      yearlyCashflow: monthlyCashflow * 12
    };
  }

  function status(result) {
    if (result.monthlyCashflow >= 3000) return { badge: "Zdravé kladné cashflow", text: "Pronájem má podle zadaných hodnot měsíční rezervu. Další krok je ověřit čistý výnos vůči pořizovací ceně a zkontrolovat citlivost na růst sazeb nebo prázdný měsíc.", cls: "badge success" };
    if (result.monthlyCashflow >= 0) return { badge: "Cashflow je těsně nad nulou", text: "Pronájem vychází kladně, ale rezerva je malá. Stačí drobná oprava, delší neobsazenost nebo vyšší splátka a výsledek se může překlopit do ztráty.", cls: "badge warning" };
    return { badge: "Cashflow je záporné", text: "Pronájem podle zadaných hodnot měsíčně doplácíte. Zkontrolujte nájem, financování, fond oprav a rezervy, protože optický výnos může být v praxi slabý.", cls: "badge danger" };
  }

  function renderTable(input, result) {
    const rows = [
      ["Nájemné", money(input.monthlyRent), "Hrubý měsíční příjem"],
      ["Neobsazenost", `-${money(result.vacancyLoss)}`, `${pct(input.vacancyRate)} z nájemného`],
      ["Efektivní nájem", money(result.effectiveRent), "Příjem po neobsazenosti"],
      ["Hypotéka", `-${money(input.mortgagePayment)}`, "Měsíční splátka financování"],
      ["Provozní náklady", `-${money(result.operatingCosts)}`, "Fond, pojištění, správa, rezerva"],
      ["Roční náklady měsíčně", `-${money(result.monthlyAnnualCosts)}`, "Jednorázové položky rozpočtené na měsíc"],
      ["Bezpečnostní buffer", `-${money(result.bufferCost)}`, `${pct(input.targetBuffer)} z efektivního nájmu`],
      ["Měsíční cashflow", money(result.monthlyCashflow), "Výsledek po všech zadaných položkách"]
    ];
    $("breakdownBody").innerHTML = rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function render(input, result) {
    const state = status(result);
    $("monthlyCashflow").textContent = money(result.monthlyCashflow);
    $("yearlyCashflow").textContent = money(result.yearlyCashflow);
    $("effectiveRent").textContent = money(result.effectiveRent);
    $("totalCosts").textContent = money(result.totalCosts);
    $("cashflowBadge").textContent = state.badge;
    $("cashflowBadge").className = state.cls;
    $("decisionText").textContent = state.text;
    $("summaryRent").textContent = money(input.monthlyRent);
    $("summaryVacancy").textContent = money(result.vacancyLoss);
    $("summaryMortgage").textContent = money(input.mortgagePayment);
    $("summaryOperating").textContent = money(result.operatingCosts);
    $("summaryAnnualCosts").textContent = money(result.monthlyAnnualCosts);
    $("summaryBuffer").textContent = money(result.bufferCost);
    $("heroMain").textContent = money(result.monthlyCashflow);
    $("heroYear").textContent = money(result.yearlyCashflow);
    $("heroRent").textContent = money(result.effectiveRent);
    $("heroCosts").textContent = money(result.totalCosts);
    $("heroBar").style.width = `${Math.max(8, Math.min(100, result.effectiveRent ? Math.abs(result.monthlyCashflow) / result.effectiveRent * 100 : 8))}%`;
    renderTable(input, result);
  }

  function run() {
    const input = values();
    render(input, calculate(input));
  }

  document.querySelectorAll("[data-cashflow-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.cashflowPreset;
      if (preset === "safe") {
        $("monthlyRent").value = 26000;
        $("vacancyRate").value = 3;
        $("mortgagePayment").value = 13000;
        $("repairFund").value = 2200;
        $("maintenanceReserve").value = 1200;
      }
      if (preset === "tight") {
        $("monthlyRent").value = 22000;
        $("vacancyRate").value = 5;
        $("mortgagePayment").value = 14500;
        $("repairFund").value = 2500;
        $("maintenanceReserve").value = 1500;
      }
      if (preset === "risk") {
        $("monthlyRent").value = 19000;
        $("vacancyRate").value = 8;
        $("mortgagePayment").value = 16000;
        $("repairFund").value = 3000;
        $("maintenanceReserve").value = 2000;
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
    $("monthlyRent").value = 22000;
    $("vacancyRate").value = 5;
    $("mortgagePayment").value = 14500;
    $("repairFund").value = 2500;
    $("insurance").value = 400;
    $("management").value = 0;
    $("maintenanceReserve").value = 1500;
    $("propertyTaxReserve").value = 500;
    $("oneOffAnnualCosts").value = 12000;
    $("targetBuffer").value = 5;
    run();
  });

  run();
})();
