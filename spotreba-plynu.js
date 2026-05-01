(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("gasForm");
  if (!form) return;

  const ids = ["consumptionValue", "inputUnit", "periodType", "conversionFactor", "pricePerKwh", "usageType"];
  const number = (value, digits = 1) => new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);

  function value(id) {
    const element = $(id);
    if (!element) return 0;
    return element.tagName === "SELECT" ? element.value : Number(element.value) || 0;
  }

  function setText(id, text) {
    const element = $(id);
    if (element) element.textContent = text;
  }

  function yearlyMultiplier(period) {
    if (period === "day") return 365;
    if (period === "month") return 12;
    return 1;
  }

  function render() {
    const raw = Math.max(0, value("consumptionValue"));
    const unit = value("inputUnit");
    const period = value("periodType");
    const factor = Math.max(0.1, value("conversionFactor"));
    const price = Math.max(0, value("pricePerKwh"));
    const yearlyBase = raw * yearlyMultiplier(period);
    const yearlyM3 = unit === "kwh" ? yearlyBase / factor : yearlyBase;
    const yearlyKwh = unit === "kwh" ? yearlyBase : yearlyBase * factor;
    const yearCost = yearlyKwh * price;
    const monthKwh = yearlyKwh / 12;
    const dayKwh = yearlyKwh / 365;
    const status = yearCost > 45000 ? "Vysoký náklad" : yearCost > 15000 ? "Běžný náklad" : "Nízký náklad";

    setText("yearConsumptionResult", `${number(yearlyKwh)} kWh`);
    setText("yearConsumptionKwhResult", `${number(yearlyKwh)} kWh`);
    setText("yearConsumptionM3Result", `${number(yearlyM3)} m³`);
    setText("yearCostResult", money(yearCost));
    setText("monthConsumptionResult", `${number(monthKwh)} kWh`);
    setText("monthCostResult", money(yearCost / 12));
    setText("dayConsumptionResult", `${number(dayKwh, 1)} kWh`);
    setText("dayCostResult", money(yearCost / 365));
    setText("conversionFactorResult", `${number(factor, 2)} kWh/m³`);
    setText("pricePerKwhResult", `${number(price, 2)} Kč/kWh`);
    setText("inputUnitLabel", unit === "kwh" ? "kWh" : "m³");
    setText("resultBadge", status);
    setText("costStatus", status);
    setText("costStatusText", `Roční spotřeba vychází přibližně ${number(yearlyKwh)} kWh, tedy ${number(yearlyM3)} m³ plynu.`);
    setText("decisionSummary", "Výsledek použijte pro kontrolu záloh a porovnání s vyúčtováním. Pro přesnou fakturu doplňte koeficient dodavatele.");
    setText("resultNote", `Při ceně ${number(price, 2)} Kč/kWh vychází roční náklad asi ${money(yearCost)}.`);

    const table = $("summaryTableBody");
    if (table) {
      table.innerHTML = [
        ["Den", `${number(dayKwh, 1)} kWh`, money(yearCost / 365)],
        ["Měsíc", `${number(monthKwh)} kWh`, money(yearCost / 12)],
        ["Rok", `${number(yearlyKwh)} kWh`, money(yearCost)],
        ["Přepočet na m³", `${number(yearlyM3)} m³`, `${number(factor, 2)} kWh/m³`],
      ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
    }
  }

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
