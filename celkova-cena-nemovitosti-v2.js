(function () {
  const form = document.getElementById("propertyCostForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
  const pct = (value) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(value)} %`;

  function values() {
    return {
      propertyPrice: Number($("propertyPrice").value) || 0,
      commissionRate: Number($("commissionRate").value) || 0,
      legalServices: Number($("legalServices").value) || 0,
      adminFees: Number($("adminFees").value) || 0,
      renovation: Number($("renovation").value) || 0,
      equipment: Number($("equipment").value) || 0,
      movingCosts: Number($("movingCosts").value) || 0,
      reserve: Number($("reserve").value) || 0
    };
  }

  function calculate(input) {
    const commissionValue = input.propertyPrice * input.commissionRate / 100;
    const legalFees = input.legalServices + input.adminFees;
    const upgradeCosts = input.renovation + input.equipment;
    const additionalCosts = commissionValue + legalFees + upgradeCosts + input.movingCosts + input.reserve;
    const totalCost = input.propertyPrice + additionalCosts;
    const additionalShare = totalCost > 0 ? additionalCosts / totalCost * 100 : 0;
    return { commissionValue, legalFees, upgradeCosts, additionalCosts, totalCost, additionalShare };
  }

  function renderTable(input, result) {
    const rows = [
      ["Kupní cena", money(input.propertyPrice), "Cena v inzerátu nebo nabídce"],
      ["Provize", money(result.commissionValue), `${pct(input.commissionRate)} z kupní ceny`],
      ["Právní a administrativní služby", money(result.legalFees), "Advokát, úschova, poplatky"],
      ["Rekonstrukce a vybavení", money(result.upgradeCosts), "Úpravy před nastěhováním nebo pronájmem"],
      ["Stěhování", money(input.movingCosts), "Přesun, doprava, drobné práce"],
      ["Rezerva", money(input.reserve), "Bezpečnostní polštář po koupi"],
      ["Celkem mimo kupní cenu", money(result.additionalCosts), "Vedlejší náklady dohromady"]
    ];
    $("breakdownBody").innerHTML = rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function render(input, result) {
    $("totalCost").textContent = money(result.totalCost);
    $("additionalCosts").textContent = money(result.additionalCosts);
    $("commissionValue").textContent = money(result.commissionValue);
    $("additionalShare").textContent = pct(result.additionalShare);
    $("costBadge").textContent = result.additionalShare > 14 ? "Vedlejší náklady jsou výrazné" : "Vedlejší náklady jsou v běžném rozsahu";
    $("costBadge").className = result.additionalShare > 14 ? "badge warning" : "badge success";
    $("summaryPrice").textContent = money(input.propertyPrice);
    $("summaryLegalFees").textContent = money(result.legalFees);
    $("summaryUpgrade").textContent = money(result.upgradeCosts);
    $("summaryMoving").textContent = money(input.movingCosts);
    $("summaryReserve").textContent = money(input.reserve);
    $("summaryOutsidePrice").textContent = money(result.additionalCosts);
    $("heroMain").textContent = money(result.totalCost);
    $("heroExtra").textContent = money(result.additionalCosts);
    $("heroCommission").textContent = money(result.commissionValue);
    $("heroShare").textContent = pct(result.additionalShare);
    $("heroBar").style.width = `${Math.max(8, Math.min(100, result.additionalShare * 4))}%`;
    renderTable(input, result);
  }

  function run() {
    const input = values();
    render(input, calculate(input));
  }

  document.querySelectorAll("[data-cost-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.costPreset;
      if (preset === "flat") {
        $("propertyPrice").value = 5000000;
        $("commissionRate").value = 3;
        $("renovation").value = 200000;
        $("equipment").value = 150000;
        $("reserve").value = 100000;
      }
      if (preset === "house") {
        $("propertyPrice").value = 8500000;
        $("commissionRate").value = 3;
        $("renovation").value = 600000;
        $("equipment").value = 250000;
        $("reserve").value = 250000;
      }
      if (preset === "small") {
        $("propertyPrice").value = 3200000;
        $("commissionRate").value = 2;
        $("renovation").value = 80000;
        $("equipment").value = 70000;
        $("reserve").value = 80000;
      }
      run();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  form.querySelectorAll("input").forEach((field) => {
    field.addEventListener("input", run);
    field.addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("propertyPrice").value = 5000000;
    $("commissionRate").value = 3;
    $("legalServices").value = 30000;
    $("adminFees").value = 5000;
    $("renovation").value = 200000;
    $("equipment").value = 150000;
    $("movingCosts").value = 20000;
    $("reserve").value = 100000;
    run();
  });

  run();
})();
