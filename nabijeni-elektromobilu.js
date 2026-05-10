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

  function renderHero(data) {
    const visual = document.querySelector(".hero-visual");
    if (!visual) return;
    const numberEl = visual.querySelector(".rv-hero-number");
    if (numberEl) numberEl.textContent = money(data.chargeCost);
    const metrics = visual.querySelectorAll(".rv-hero-metrics b");
    if (metrics[0]) metrics[0].textContent = `${number(data.batteryEnergy)} kWh`;
    if (metrics[1]) metrics[1].textContent = `${number(data.gridEnergy)} kWh`;
    if (metrics[2]) metrics[2].textContent = money(data.costPer100);
    const bars = visual.querySelectorAll(".energy-meter b");
    const labels = visual.querySelectorAll(".energy-meter strong");
    if (bars[0]) bars[0].style.width = `${Math.max(6, Math.min(100, data.rangePct))}%`;
    if (bars[1]) bars[1].style.width = `${Math.max(6, Math.min(100, data.lossPct))}%`;
    if (labels[0]) labels[0].textContent = `${number(data.rangePct, 0)} %`;
    if (labels[1]) labels[1].textContent = `${number(data.lossPct, 0)} %`;
    const fill = visual.querySelector(".ev-fill");
    if (fill) fill.style.width = `${Math.max(8, Math.min(100, data.rangePct))}%`;
    const batteryLabel = visual.querySelector(".ev-battery strong");
    if (batteryLabel) batteryLabel.textContent = `${number(data.start, 0)}-${number(data.target, 0)} %`;
    const charger = visual.querySelector(".ev-charger");
    if (charger) charger.textContent = `${number(data.power, 1)} kW`;
    const card = visual.querySelector(".energy-mini-card strong");
    if (card) card.textContent = `Jedno nabití stojí asi ${money(data.chargeCost)}. Provoz vychází přibližně na ${money(data.costPer100)} / 100 km.`;
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
    setText("interpretationNote", "Domácí nabíjení obvykle vychází nejlépe pro pravidelný provoz. Rychlé veřejné nabíjení může být výrazně dražší.");
    renderHero({ start, target, rangePct, lossPct, batteryEnergy, gridEnergy, chargeCost, costPer100, power });

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
