(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("gasForm");
  if (!form) return;

  const ids = [
    "consumptionValue",
    "inputUnit",
    "periodType",
    "conversionFactor",
    "pricePerKwh",
    "usageType",
  ];
  const scenarios = {
    cooking: { consumptionValue: 14, inputUnit: "m3", periodType: "month", usageType: "cooking" },
    water: { consumptionValue: 38, inputUnit: "m3", periodType: "month", usageType: "water" },
    heating: { consumptionValue: 2.8, inputUnit: "m3", periodType: "day", usageType: "heating" },
  };
  const number = (value, digits = 1) =>
    new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(
      Number.isFinite(value) ? value : 0
    );
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function value(id) {
    const element = $(id);
    if (!element) return 0;
    return element.tagName === "SELECT"
      ? element.value
      : Number(String(element.value || "").replace(",", ".")) || 0;
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

  function applyScenario(name) {
    const scenario = scenarios[name];
    if (!scenario) return;
    Object.entries(scenario).forEach(([id, val]) => {
      const element = $(id);
      if (element) element.value = val;
    });
    document.querySelectorAll("[data-scenario]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.scenario === name ? "true" : "false");
    });
  }

  function classify(yearCost, usageType) {
    if (usageType === "cooking") {
      return {
        label: yearCost > 5000 ? "Vyšší náklad na vaření" : "Nízký náklad na vaření",
        text:
          "U samotného vaření bývá spotřeba plynu menší položka. Pokud výsledek výrazně roste, ověřte, jestli nezadáváte i ohřev vody nebo vytápění.",
        next: "Pro domácnost má větší smysl navázat celkovými náklady na bydlení nebo spotřebou elektřiny.",
      };
    }
    if (yearCost > 45000) {
      return {
        label: "Vysoký náklad na plyn",
        text:
          "Roční náklad je citelný a stojí za kontrolu. U vytápění sledujte hlavně teplotu v místnostech, délku topné sezóny a účinnost zdroje.",
        next:
          "Zpřesněte výsledek kalkulačkou nákladů na vytápění a zkontrolujte zálohy proti vyúčtování.",
      };
    }
    if (yearCost > 15000) {
      return {
        label: "Běžný náklad na plyn",
        text:
          "Výsledek odpovídá běžné položce v rozpočtu. Důležité je porovnat ho s delším obdobím, protože plyn silně kolísá podle sezóny.",
        next:
          "Pokračujte kontrolou nákladů na vytápění, elektřiny nebo celkových měsíčních nákladů na bydlení.",
      };
    }
    return {
      label: "Nízký náklad na plyn",
      text:
        "Spotřeba působí nízko. To dává smysl hlavně u vaření nebo krátkého období mimo topnou sezónu.",
      next:
        "Pro jistější roční odhad zadejte průměr z více měsíců nebo hodnotu z posledního vyúčtování.",
    };
  }

  function renderHero(data) {
    const intensity = data.yearCost > 0 ? clamp((data.yearCost / 45000) * 100, 8, 100) : 8;
    setText("yearCostResult", money(data.yearCost));
    const heroNumber = document.querySelector(".rv-gas-page .rv-hero-number");
    if (heroNumber) heroNumber.textContent = `${money(data.yearCost)}/rok`;
    const metrics = document.querySelectorAll(".rv-gas-page .rv-hero-metrics b");
    if (metrics[0]) metrics[0].textContent = `${number(data.dayM3, 1)} m³`;
    if (metrics[1]) metrics[1].textContent = `${number(data.yearlyKwh, 0)} kWh`;
    if (metrics[2]) metrics[2].textContent = `${number(data.price, 2)} Kč`;
    const bars = document.querySelectorAll(".rv-gas-page .energy-meter b");
    if (bars[0]) bars[0].style.width = `${clamp(data.yearlyM3 / 18, 8, 100)}%`;
    if (bars[1]) bars[1].style.width = `${intensity}%`;
    const labels = document.querySelectorAll(".rv-gas-page .energy-meter strong");
    if (labels[0]) labels[0].textContent = data.yearlyM3 > 1800 ? "vysoká" : "běžná";
    if (labels[1]) labels[1].textContent = data.yearCost > 45000 ? "vysoký" : "citelný";
  }

  function render() {
    const raw = Math.max(0, value("consumptionValue"));
    const unit = value("inputUnit");
    const period = value("periodType");
    const factor = Math.max(0.1, value("conversionFactor"));
    const price = Math.max(0, value("pricePerKwh"));
    const usageType = value("usageType");
    const yearlyBase = raw * yearlyMultiplier(period);
    const yearlyM3 = unit === "kwh" ? yearlyBase / factor : yearlyBase;
    const yearlyKwh = unit === "kwh" ? yearlyBase : yearlyBase * factor;
    const yearCost = yearlyKwh * price;
    const monthKwh = yearlyKwh / 12;
    const dayKwh = yearlyKwh / 365;
    const monthM3 = yearlyM3 / 12;
    const dayM3 = yearlyM3 / 365;
    const status = classify(yearCost, usageType);

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
    setText("resultBadge", status.label);
    setText("costStatus", status.label);
    setText(
      "costStatusText",
      `${status.text} Roční spotřeba vychází přibližně ${number(
        yearlyKwh
      )} kWh, tedy ${number(yearlyM3)} m³ plynu.`
    );
    setText("decisionSummary", status.next);
    setText(
      "resultNote",
      `Při ceně ${number(price, 2)} Kč/kWh vychází roční náklad asi ${money(yearCost)}.`
    );

    const table = $("summaryTableBody");
    if (table) {
      table.innerHTML = [
        ["Den", `${number(dayKwh, 1)} kWh / ${number(dayM3, 2)} m³`, money(yearCost / 365)],
        ["Měsíc", `${number(monthKwh)} kWh / ${number(monthM3)} m³`, money(yearCost / 12)],
        ["Rok", `${number(yearlyKwh)} kWh / ${number(yearlyM3)} m³`, money(yearCost)],
        ["Koeficient", `${number(factor, 2)} kWh/m³`, `${number(price, 2)} Kč/kWh`],
      ]
        .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
        .join("");
    }

    renderHero({ yearCost, yearlyKwh, yearlyM3, dayM3, price });
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

  document.querySelectorAll("[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      applyScenario(button.dataset.scenario);
      render();
    });
  });

  $("resetBtn")?.addEventListener("click", () => {
    form.reset();
    applyScenario("heating");
    render();
  });

  render();
})();
