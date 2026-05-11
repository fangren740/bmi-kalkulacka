(function () {
  const $ = (id) => document.getElementById(id);
  const form = $("acForm");
  if (!form) return;

  const fmt = (value, digits = 0) =>
    new Intl.NumberFormat("cs-CZ", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Number.isFinite(value) ? value : 0);
  const czk = (value) => `${fmt(value)} Kč`;
  const kwh = (value) => `${fmt(value, value < 10 ? 2 : 1)} kWh`;
  const watts = (value) => `${fmt(value)} W`;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const presets = {
    eco: { hoursPerDay: 3, efficiencyFactor: 55, usageMode: "eco" },
    standard: { hoursPerDay: 6, efficiencyFactor: 75, usageMode: "standard" },
    intense: { hoursPerDay: 10, efficiencyFactor: 90, usageMode: "intense" },
  };

  function num(id) {
    return Math.max(0, Number($(id)?.value) || 0);
  }

  function values() {
    return {
      acPower: num("acPower"),
      hoursPerDay: num("hoursPerDay"),
      daysPerMonth: Math.max(1, num("daysPerMonth")),
      seasonDays: Math.max(1, num("seasonDays")),
      pricePerKwh: num("pricePerKwh"),
      usageMode: $("usageMode").value,
      efficiencyFactor: clamp(num("efficiencyFactor"), 10, 100),
      standbyPower: num("standbyPower"),
    };
  }

  function calculate(v) {
    const effectivePower = v.acPower * (v.efficiencyFactor / 100);
    const hourlyKwh = effectivePower / 1000;
    const hourlyCost = hourlyKwh * v.pricePerKwh;
    const dailyKwh = hourlyKwh * v.hoursPerDay;
    const dailyCost = dailyKwh * v.pricePerKwh;
    const monthlyKwh = dailyKwh * v.daysPerMonth;
    const monthlyCost = monthlyKwh * v.pricePerKwh;
    const activeSeasonKwh = dailyKwh * v.seasonDays;
    const standbyHoursPerDay = Math.max(0, 24 - v.hoursPerDay);
    const standbySeasonKwh = (v.standbyPower / 1000) * standbyHoursPerDay * v.seasonDays;
    const seasonKwh = activeSeasonKwh + standbySeasonKwh;
    const seasonCost = seasonKwh * v.pricePerKwh;
    return {
      effectivePower,
      hourlyKwh,
      hourlyCost,
      dailyKwh,
      dailyCost,
      monthlyKwh,
      monthlyCost,
      standbySeasonKwh,
      seasonKwh,
      seasonCost,
    };
  }

  function interpretation(v, result) {
    if (result.seasonCost > 5000) {
      return {
        label: "Citelný sezónní náklad",
        text:
          "Sezónní provoz klimatizace už je výrazný. Vyplatí se hlídat nastavenou teplotu, stínění, zavřená okna a dobu provozu.",
        next:
          "Zkontrolujte další spotřebiče a dejte sezónní výdaj do rozpočtu, aby vás letní faktura nepřekvapila.",
      };
    }
    if (result.seasonCost > 2000) {
      return {
        label: "Běžný sezónní náklad",
        text:
          "Výsledek odpovídá běžnému letnímu používání. Malé změny režimu mohou za sezónu ušetřit stovky korun.",
        next:
          "Porovnejte spotřebu s dalšími spotřebiči a sledujte, jestli klimatizace neběží zbytečně dlouho po vychlazení místnosti.",
      };
    }
    return {
      label: "Nižší náklad",
      text:
        "Provoz je podle zadání spíš menší položka. Přesto sledujte reálnou spotřebu v horkých dnech, kdy může být provoz výrazně delší.",
      next:
        "Pro přesnější odhad zadejte skutečný příkon ze štítku nebo chytré zásuvky a délku typické letní sezóny.",
    };
  }

  function renderHero(result, v) {
    $("heroAcSeason").textContent = `${czk(result.seasonCost)}/sez.`;
    $("heroAcDay").textContent = czk(result.dailyCost);
    $("heroAcKwh").textContent = kwh(result.seasonKwh);
    $("heroAcPower").textContent = watts(result.effectivePower);
    $("heroAcHours").textContent = `${fmt(v.hoursPerDay, v.hoursPerDay % 1 ? 1 : 0)} h`;
    $("heroAcLoad").textContent = `${fmt(v.efficiencyFactor)} %`;
    $("heroAcHoursBar").style.width = `${clamp((v.hoursPerDay / 12) * 100, 8, 100)}%`;
    $("heroAcLoadBar").style.width = `${clamp(v.efficiencyFactor, 8, 100)}%`;
  }

  function ensureNextActions() {
    if (document.querySelector(".rv-ac-page .rv-next-actions")) return;
    const box = document.createElement("div");
    box.className = "rv-next-actions";
    box.setAttribute("aria-label", "Co spočítat dál");
    box.innerHTML =
      '<strong>Co spočítat dál</strong><a href="spotreba-elektriny-kalkulacka.html">Zkontrolovat další spotřebiče</a><a href="led-uspora-elektriny-kalkulacka.html">Snížit spotřebu osvětlením</a><a href="kalkulacka-rozpoctu-domacnosti.html">Dát sezónu do rozpočtu</a>';
    document.querySelector("#vysledek .rv-result-note")?.after(box);
  }

  function render() {
    const v = values();
    if (v.usageMode !== "custom" && presets[v.usageMode]) {
      const preset = presets[v.usageMode];
      v.hoursPerDay = preset.hoursPerDay;
      v.efficiencyFactor = preset.efficiencyFactor;
      $("hoursPerDay").value = preset.hoursPerDay;
      $("efficiencyFactor").value = preset.efficiencyFactor;
    }
    if (v.acPower <= 0 || v.hoursPerDay <= 0 || v.daysPerMonth <= 0 || v.seasonDays <= 0) return;

    const result = calculate(v);
    const decision = interpretation(v, result);
    $("seasonCostResult").textContent = czk(result.seasonCost);
    $("dailyCostResult").textContent = czk(result.dailyCost);
    $("monthlyCostResult").textContent = czk(result.monthlyCost);
    $("seasonConsumptionResult").textContent = kwh(result.seasonKwh);
    $("hourlyCostResult").textContent = czk(result.hourlyCost);
    $("hourlyConsumptionResult").textContent = kwh(result.hourlyKwh);
    $("dailyConsumptionResult").textContent = kwh(result.dailyKwh);
    $("monthlyConsumptionResult").textContent = kwh(result.monthlyKwh);
    $("effectivePowerResult").textContent = watts(result.effectivePower);
    $("standbySeasonResult").textContent = kwh(result.standbySeasonKwh);
    $("statusBadge").textContent = decision.label;
    $("interpretationNote").textContent = decision.text;
    $("decisionSummary").textContent =
      `${decision.next} Při ${fmt(v.hoursPerDay, 1)} hodinách denně vychází sezónní spotřeba na ${kwh(
        result.seasonKwh
      )} a cena přibližně ${czk(result.seasonCost)}.`;
    $("summaryTableBody").innerHTML = [
      ["Hodina", kwh(result.hourlyKwh), czk(result.hourlyCost)],
      ["Den", kwh(result.dailyKwh), czk(result.dailyCost)],
      ["Měsíc", kwh(result.monthlyKwh), czk(result.monthlyCost)],
      ["Sezóna", kwh(result.seasonKwh), czk(result.seasonCost)],
    ]
      .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
      .join("");

    renderHero(result, v);
    ensureNextActions();
  }

  function applyPreset(id) {
    const preset = presets[id];
    if (!preset) return;
    $("usageMode").value = preset.usageMode;
    $("hoursPerDay").value = preset.hoursPerDay;
    $("efficiencyFactor").value = preset.efficiencyFactor;
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.preset === id));
    });
    render();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  form.querySelectorAll("input,select").forEach((element) => {
    ["input", "change"].forEach((eventName) => {
      element.addEventListener(eventName, () => {
        if (["hoursPerDay", "efficiencyFactor"].includes(element.id)) $("usageMode").value = "custom";
        render();
      });
    });
  });
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });
  $("resetBtn").addEventListener("click", () => {
    $("acPower").value = 1200;
    $("daysPerMonth").value = 30;
    $("seasonDays").value = 90;
    $("pricePerKwh").value = 6.5;
    $("standbyPower").value = 2;
    applyPreset("standard");
  });
  render();
})();
