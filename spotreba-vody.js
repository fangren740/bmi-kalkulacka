(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("waterForm");
  if (!form) return;

  const ids = ["persons", "dailyLiters", "waterPrice", "sewerPrice", "monthlyFee", "periodMonths", "usageProfile", "includeSewer"];
  const profileFactor = { low: 0.8, standard: 1, high: 1.25 };
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
    const persons = Math.max(1, value("persons"));
    const dailyLiters = Math.max(0, value("dailyLiters"));
    const waterPrice = Math.max(0, value("waterPrice"));
    const sewerPrice = Math.max(0, value("sewerPrice"));
    const monthlyFee = Math.max(0, value("monthlyFee"));
    const months = Math.max(1, value("periodMonths"));
    const factor = profileFactor[value("usageProfile")] || 1;
    const includeSewer = value("includeSewer") !== "no";
    const dailyM3 = (persons * dailyLiters * factor) / 1000;
    const monthlyM3 = dailyM3 * 30;
    const yearlyM3 = dailyM3 * 365;
    const monthlyWater = monthlyM3 * waterPrice;
    const monthlySewer = includeSewer ? monthlyM3 * sewerPrice : 0;
    const monthlyCost = monthlyWater + monthlySewer + monthlyFee;
    const periodM3 = monthlyM3 * months;
    const periodCost = monthlyCost * months;
    const yearlyCost = monthlyCost * 12;
    const status = monthlyCost > 1600 ? "Vyšší náklady na vodu" : monthlyCost > 700 ? "Běžné náklady na vodu" : "Nízké náklady na vodu";

    setText("periodCost", money(periodCost));
    setText("monthlyCost", money(monthlyCost));
    setText("yearlyCost", money(yearlyCost));
    setText("periodConsumption", `${number(periodM3)} m³`);
    setText("monthlyConsumption", `${number(monthlyM3)} m³`);
    setText("dailyConsumption", `${number(dailyM3, 2)} m³`);
    setText("dailyPerPerson", `${number(dailyLiters * factor, 0)} l/os.`);
    setText("monthlyWaterCost", money(monthlyWater));
    setText("monthlySewerCost", money(monthlySewer));
    setText("monthlyFixedCost", money(monthlyFee));
    setText("statusBadge", status);
    setText("costStatus", status);
    setText("costStatusText", `Domácnost spotřebuje přibližně ${number(monthlyM3)} m³ vody měsíčně.`);
    setText("decisionSummary", "Výsledek porovnejte s fakturou a sledujte hlavně dlouhodobou měsíční spotřebu.");
    setText("resultNote", `Za ${number(months, 0)} měsíců vychází spotřeba asi ${number(periodM3)} m³ a náklad ${money(periodCost)}.`);

    const table = $("summaryTableBody");
    if (table) {
      table.innerHTML = [
        ["Den", `${number(dailyM3, 2)} m³`, money(monthlyCost / 30)],
        ["Měsíc", `${number(monthlyM3)} m³`, money(monthlyCost)],
        [`${number(months, 0)} měsíců`, `${number(periodM3)} m³`, money(periodCost)],
        ["Rok", `${number(yearlyM3)} m³`, money(yearlyCost)],
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
