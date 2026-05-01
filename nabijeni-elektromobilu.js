(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("chargingForm");
  if (!form) return;

  const ids = ["batteryCapacity", "startCharge", "targetCharge", "pricePerKwh", "chargingType", "chargingLoss", "consumptionPer100", "monthlyKm", "chargingPower", "sessionPerMonth"];
  const lossDefaults = { home: 10, public: 14, fast: 18 };
  const number = (value, digits = 1) => new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);

  function value(id) {
    const element = $(id);
    if (!element) return 0;
    return element.tagName === "SELECT" ? element.value : Number(String(element.value || "").replace(",", ".")) || 0;
  }

  function setText(id, text) {
    const element = $(id);
    if (element) element.textContent = text;
  }

  function render() {
    const capacity = Math.max(1, value("batteryCapacity"));
    const start = Math.max(0, Math.min(100, value("startCharge")));
    const target = Math.max(start, Math.min(100, value("targetCharge")));
    const price = Math.max(0, value("pricePerKwh"));
    const lossPct = Math.max(0, value("chargingLoss"));
    const consumption = Math.max(1, value("consumptionPer100"));
    const monthlyKm = Math.max(0, value("monthlyKm"));
    const power = Math.max(0.1, value("chargingPower"));
    const sessions = Math.max(0, value("sessionPerMonth"));
    const rangePct = Math.max(0, target - start);
    const batteryEnergy = capacity * (rangePct / 100);
    const lossEnergy = batteryEnergy * (lossPct / 100);
    const gridEnergy = batteryEnergy + lossEnergy;
    const chargeCost = gridEnergy * price;
    const costPer100 = consumption * price * (1 + lossPct / 100);
    const monthlyCostKm = (monthlyKm / 100) * costPer100;
    const monthlyCostSessions = chargeCost * sessions;
    const chargingTime = gridEnergy / power;

    setText("chargeCostResult", money(chargeCost));
    setText("batteryEnergyResult", `${number(batteryEnergy)} kWh`);
    setText("gridEnergyResult", `${number(gridEnergy)} kWh`);
    setText("costPer100Result", money(costPer100));
    setText("chargeRangeResult", `${number(rangePct, 0)} %`);
    setText("lossEnergyResult", `${number(lossEnergy)} kWh`);
    setText("chargingTimeResult", `${number(chargingTime, 1)} h`);
    setText("monthlyCostKmResult", money(monthlyCostKm));
    setText("monthlyCostSessionsResult", money(monthlyCostSessions));
    setText("pricePerKwhResult", `${number(price, 2)} Kč/kWh`);
    setText("statusBadge", costPer100 > 180 ? "Dražší provoz" : costPer100 > 90 ? "Běžný provoz" : "Levnější provoz");
    setText("chargingVerdict", "Orientační cena nabíjení");
    setText("decisionSummary", `Jedno nabití z ${number(start, 0)} % na ${number(target, 0)} % vychází asi na ${money(chargeCost)}. Cena provozu je přibližně ${money(costPer100)} na 100 km.`);
    setText("interpretationNote", "Domácí nabíjení obvykle vychází nejlépe pro pravidelný provoz, rychlé veřejné nabíjení může být výrazně dražší.");

    const table = $("summaryTableBody");
    if (table) {
      table.innerHTML = [
        ["Energie do baterie", `${number(batteryEnergy)} kWh`, "užitečná energie"],
        ["Energie ze sítě", `${number(gridEnergy)} kWh`, "včetně ztrát"],
        ["Cena nabití", money(chargeCost), "jedna relace"],
        ["Cena na 100 km", money(costPer100), "podle spotřeby"],
        ["Měsíčně podle km", money(monthlyCostKm), `${number(monthlyKm, 0)} km`],
      ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
    }
  }

  $("chargingType")?.addEventListener("change", () => {
    const type = value("chargingType");
    if (lossDefaults[type] && $("chargingLoss")) $("chargingLoss").value = lossDefaults[type];
    render();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  ids.forEach((id) => {
    const element = $(id);
    if (element) {
      element.addEventListener("input", render);
      element.addEventListener("change", render);
    }
  });
  $("resetBtn")?.addEventListener("click", () => {
    form.reset();
    render();
  });
  render();
})();
