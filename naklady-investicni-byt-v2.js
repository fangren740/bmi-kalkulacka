(function () {
  const form = document.getElementById("investmentCostsForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
  const pct = (value, digits = 1) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(value)} %`;

  function values() {
    return {
      mortgagePayment: Number($("mortgagePayment").value) || 0,
      repairFund: Number($("repairFund").value) || 0,
      insurance: Number($("insurance").value) || 0,
      management: Number($("management").value) || 0,
      maintenanceReserve: Number($("maintenanceReserve").value) || 0,
      vacancyRate: Number($("vacancyRate").value) || 0,
      expectedRent: Number($("expectedRent").value) || 0,
      adminReserve: Number($("adminReserve").value) || 0,
      annualOneOffCosts: Number($("annualOneOffCosts").value) || 0,
      safetyBufferRate: Number($("safetyBufferRate").value) || 0
    };
  }

  function calculate(input) {
    const vacancyCost = input.expectedRent * input.vacancyRate / 100;
    const annualSpread = input.annualOneOffCosts / 12;
    const financingCosts = input.mortgagePayment;
    const baseOperatingCosts = input.repairFund + input.insurance + input.management + input.maintenanceReserve + vacancyCost + input.adminReserve + annualSpread;
    const preBufferTotal = financingCosts + baseOperatingCosts;
    const safetyBuffer = preBufferTotal * input.safetyBufferRate / 100;
    const totalMonthlyCosts = preBufferTotal + safetyBuffer;
    const totalYearlyCosts = totalMonthlyCosts * 12;
    const operatingCosts = baseOperatingCosts + safetyBuffer;
    const rentCostRatio = input.expectedRent > 0 ? totalMonthlyCosts / input.expectedRent : 0;
    return { vacancyCost, annualSpread, financingCosts, baseOperatingCosts, safetyBuffer, totalMonthlyCosts, totalYearlyCosts, operatingCosts, rentCostRatio };
  }

  function decision(result) {
    if (result.rentCostRatio <= 0.75) return { badge: "Náklady jsou lehčí", text: "Nákladová struktura je podle zadaných hodnot relativně zdravá. Další krok je ověřit cashflow a čistý výnos vůči ceně bytu.", cls: "badge success" };
    if (result.rentCostRatio <= 0.95) return { badge: "Náklady jsou na hraně", text: "Náklady ukrajují velkou část nájemného. Je potřeba hlídat rezervy, neobsazenost a dopad do cashflow.", cls: "badge warning" };
    return { badge: "Náklady dusí investici", text: "Měsíční náklady jsou velmi blízko nájemnému nebo ho převyšují. Bez vyššího nájmu, levnějšího financování nebo nižších nákladů může být cashflow slabé.", cls: "badge danger" };
  }

  function renderTable(input, result) {
    const rows = [
      ["Splátka hypotéky", money(input.mortgagePayment), "Financování investice"],
      ["Fond oprav / SVJ", money(input.repairFund), "Pravidelný náklad bytu"],
      ["Pojištění a správa", money(input.insurance + input.management), "Pojištění, externí správa"],
      ["Rezerva na údržbu", money(input.maintenanceReserve), "Opravy a opotřebení"],
      ["Neobsazenost", money(result.vacancyCost), `${pct(input.vacancyRate)} z očekávaného nájmu`],
      ["Roční náklady měsíčně", money(result.annualSpread), "Jednorázové položky rozpočtené na měsíc"],
      ["Bezpečnostní buffer", money(result.safetyBuffer), `${pct(input.safetyBufferRate)} z mezisoučtu`],
      ["Celkem měsíčně", money(result.totalMonthlyCosts), "Celková nákladová vrstva"]
    ];
    $("breakdownBody").innerHTML = rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function render(input, result) {
    const state = decision(result);
    $("totalMonthlyCosts").textContent = money(result.totalMonthlyCosts);
    $("totalYearlyCosts").textContent = money(result.totalYearlyCosts);
    $("financingCosts").textContent = money(result.financingCosts);
    $("operatingCosts").textContent = money(result.operatingCosts);
    $("costsBadge").textContent = state.badge;
    $("costsBadge").className = state.cls;
    $("decisionText").textContent = state.text;
    $("summaryVacancy").textContent = money(result.vacancyCost);
    $("summaryRepairFund").textContent = money(input.repairFund);
    $("summaryInsuranceManagement").textContent = money(input.insurance + input.management);
    $("summaryMaintenance").textContent = money(input.maintenanceReserve);
    $("summaryAnnualSpread").textContent = money(result.annualSpread);
    $("summarySafetyBuffer").textContent = money(result.safetyBuffer);
    $("heroMain").textContent = money(result.totalMonthlyCosts);
    $("heroYear").textContent = money(result.totalYearlyCosts);
    $("heroRatio").textContent = pct(result.rentCostRatio * 100);
    $("heroOperating").textContent = money(result.operatingCosts);
    $("heroBar").style.width = `${Math.max(8, Math.min(100, result.rentCostRatio * 100))}%`;
    renderTable(input, result);
  }

  function run() {
    const input = values();
    render(input, calculate(input));
  }

  document.querySelectorAll("[data-costs-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.costsPreset;
      if (preset === "light") {
        $("mortgagePayment").value = 12000;
        $("repairFund").value = 2200;
        $("expectedRent").value = 24000;
        $("vacancyRate").value = 3;
      }
      if (preset === "normal") {
        $("mortgagePayment").value = 14500;
        $("repairFund").value = 2600;
        $("expectedRent").value = 22000;
        $("vacancyRate").value = 5;
      }
      if (preset === "heavy") {
        $("mortgagePayment").value = 16500;
        $("repairFund").value = 3200;
        $("expectedRent").value = 20000;
        $("vacancyRate").value = 8;
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
    $("mortgagePayment").value = 14500;
    $("repairFund").value = 2600;
    $("insurance").value = 400;
    $("management").value = 0;
    $("maintenanceReserve").value = 1500;
    $("vacancyRate").value = 5;
    $("expectedRent").value = 22000;
    $("adminReserve").value = 500;
    $("annualOneOffCosts").value = 12000;
    $("safetyBufferRate").value = 5;
    run();
  });

  run();
})();
