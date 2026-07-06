(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const form = $("breakEvenForm");
  if (!form) return;

  const fields = {
    sellingPrice: $("sellingPrice"),
    variableCost: $("variableCost"),
    fixedCosts: $("fixedCosts"),
    plannedSales: $("plannedSales"),
    targetProfit: $("targetProfit"),
    unitLabel: $("unitLabel"),
    periodLabel: $("periodLabel")
  };

  const presets = {
    product: { sellingPrice: 1200, variableCost: 450, fixedCosts: 180000, plannedSales: 300, targetProfit: 0, unitLabel: "ks", periodLabel: "měsíc" },
    service: { sellingPrice: 2500, variableCost: 400, fixedCosts: 120000, plannedSales: 80, targetProfit: 0, unitLabel: "zakázek", periodLabel: "měsíc" },
    gastro: { sellingPrice: 220, variableCost: 85, fixedCosts: 250000, plannedSales: 2200, targetProfit: 0, unitLabel: "porcí", periodLabel: "měsíc" },
    eshop: { sellingPrice: 899, variableCost: 520, fixedCosts: 160000, plannedSales: 500, targetProfit: 0, unitLabel: "objednávek", periodLabel: "měsíc" }
  };

  const numberFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const integerFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const moneyFormat = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });

  const formatNumber = value => integerFormat.format(Number.isFinite(value) ? value : 0);
  const formatMoney = value => moneyFormat.format(Number.isFinite(value) ? value : 0);
  const formatPercent = value => `${numberFormat.format(Number.isFinite(value) ? value : 0)} %`;
  const unitText = (value, unit) => `${formatNumber(value)} ${unit}`;

  function readValues() {
    return {
      sellingPrice: Number(fields.sellingPrice.value),
      variableCost: Number(fields.variableCost.value),
      fixedCosts: Number(fields.fixedCosts.value),
      plannedSales: Number(fields.plannedSales.value),
      targetProfit: Number(fields.targetProfit.value),
      unitLabel: fields.unitLabel.value,
      periodLabel: fields.periodLabel.value
    };
  }

  function validate(values) {
    const numeric = [values.sellingPrice, values.variableCost, values.fixedCosts, values.plannedSales, values.targetProfit];
    if (numeric.some(value => !Number.isFinite(value))) return "Vyplňte prosím všechna číselná pole.";
    if (numeric.some(value => value < 0)) return "Zadané hodnoty nemohou být záporné.";
    if (values.sellingPrice <= 0) return "Prodejní cena musí být vyšší než nula.";
    if (values.sellingPrice <= values.variableCost) return "Prodejní cena musí být vyšší než variabilní náklad. Jinak každý další prodej vytváří ztrátu.";
    return "";
  }

  function calculate(values) {
    const unitContribution = values.sellingPrice - values.variableCost;
    const contributionRate = unitContribution / values.sellingPrice * 100;
    const breakEvenExact = values.fixedCosts / unitContribution;
    const breakEvenUnits = Math.ceil(breakEvenExact);
    const breakEvenRevenue = breakEvenUnits * values.sellingPrice;
    const plannedProfit = values.plannedSales * unitContribution - values.fixedCosts;
    const safetyUnits = values.plannedSales - breakEvenUnits;
    const safetyRate = values.plannedSales > 0 ? safetyUnits / values.plannedSales * 100 : NaN;
    const targetUnits = values.targetProfit > 0
      ? Math.ceil((values.fixedCosts + values.targetProfit) / unitContribution)
      : 0;
    const targetRevenue = targetUnits * values.sellingPrice;
    return { unitContribution, contributionRate, breakEvenExact, breakEvenUnits, breakEvenRevenue, plannedProfit, safetyUnits, safetyRate, targetUnits, targetRevenue };
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function setInvalidState(message) {
    const error = $("breakEvenError");
    error.textContent = message;
    error.hidden = false;
    setText("resultBadge", "Opravte zadání");
    $("resultBadge").className = "break-even-status is-danger";
    setText("breakEvenUnitsResult", "—");
    setText("breakEvenRevenueResult", "—");
    setText("unitContributionResult", "—");
    setText("plannedProfitResult", "—");
    setText("safetyMarginResult", "—");
    setText("decisionKicker", "Výpočet nelze dokončit");
    setText("decisionHeadline", "Cena nepokrývá náklad na prodej");
    setText("decisionText", message);
    setText("nextStepText", "Upravte cenu nebo variabilní náklad a výsledek se ihned přepočítá.");
    $("decisionHeadline").parentElement.className = "break-even-decision is-danger";
    $("targetProfitResultBox").hidden = true;
    setText("heroBreakEvenUnits", "—");
    setText("heroVerdict", "Opravte zadané hodnoty");
    setText("heroContribution", "—");
    setText("heroRevenue", "—");
    setText("heroProfit", "—");
    $("heroPlanBar").style.width = "0%";
    $("heroBreakMarker").style.left = "0%";
    clearChart();
    $("scenarioList").replaceChildren();
  }

  function decisionFor(values, result) {
    if (values.plannedSales === 0) {
      return {
        type: "neutral",
        badge: "Bod zvratu spočítán",
        headline: "Doplňte plánovaný prodej",
        text: `Pro pokrytí nákladů potřebujete alespoň ${unitText(result.breakEvenUnits, values.unitLabel)}. Bez plánu prodeje nelze vyhodnotit rezervu.`,
        next: "Další krok: zadejte realistický plán prodeje a porovnejte ho s hranicí zisku."
      };
    }
    if (values.plannedSales < result.breakEvenUnits) {
      return {
        type: "danger",
        badge: "Plán je ve ztrátě",
        headline: `Chybí ${unitText(Math.abs(result.safetyUnits), values.unitLabel)} do bodu zvratu`,
        text: `Při plánu ${unitText(values.plannedSales, values.unitLabel)} vychází ztráta ${formatMoney(Math.abs(result.plannedProfit))}.`,
        next: "Další krok: zvyšte cenu či objem prodeje, nebo snižte náklady."
      };
    }
    if (result.safetyRate < 10) {
      return {
        type: "warning",
        badge: "Velmi těsná rezerva",
        headline: "Plán je jen těsně nad bodem zvratu",
        text: `Rezerva je ${unitText(result.safetyUnits, values.unitLabel)}, tedy ${formatPercent(result.safetyRate)} plánovaného prodeje.`,
        next: "Další krok: ověřte slabší scénář ceny a vyšších nákladů."
      };
    }
    if (result.safetyRate < 25) {
      return {
        type: "warning",
        badge: "Střední rezerva",
        headline: "Plán je v zisku, ale má omezený polštář",
        text: `Rezerva činí ${unitText(result.safetyUnits, values.unitLabel)} neboli ${formatPercent(result.safetyRate)} plánovaného prodeje.`,
        next: "Další krok: pracujte i s konzervativní variantou prodeje."
      };
    }
    return {
      type: "healthy",
      badge: "Zdravá rezerva",
      headline: "Plán je bezpečně nad bodem zvratu",
      text: `Rezerva činí ${unitText(result.safetyUnits, values.unitLabel)} neboli ${formatPercent(result.safetyRate)} plánovaného prodeje.`,
      next: "Další krok: nastavte si cílový zisk a ověřte potřebný prodej."
    };
  }

  function renderDecision(values, result) {
    const decision = decisionFor(values, result);
    setText("resultBadge", decision.badge);
    $("resultBadge").className = `break-even-status${decision.type === "danger" ? " is-danger" : decision.type === "warning" ? " is-warning" : ""}`;
    setText("decisionKicker", "Vyhodnocení plánu");
    setText("decisionHeadline", decision.headline);
    setText("decisionText", decision.text);
    setText("nextStepText", decision.next);
    $("decisionHeadline").parentElement.className = `break-even-decision${decision.type === "danger" ? " is-danger" : decision.type === "warning" ? " is-warning" : ""}`;
    return decision;
  }

  function renderHero(values, result, decision) {
    setText("heroBreakEvenUnits", unitText(result.breakEvenUnits, values.unitLabel));
    setText("heroVerdict", decision.badge);
    setText("heroContribution", formatMoney(result.unitContribution));
    setText("heroRevenue", formatMoney(result.breakEvenRevenue));
    setText("heroProfit", formatMoney(result.plannedProfit));
    setText("heroPlanLabel", `Plán ${formatNumber(values.plannedSales)}`);
    const max = Math.max(values.plannedSales, result.breakEvenUnits, 1);
    $("heroPlanBar").style.width = `${Math.min(100, values.plannedSales / max * 100)}%`;
    $("heroBreakMarker").style.left = `${Math.min(100, result.breakEvenUnits / max * 100)}%`;
  }

  function clearChart() {
    $("totalCostPath").setAttribute("d", "");
    $("revenuePath").setAttribute("d", "");
    $("breakEvenLine").setAttribute("x1", "44");
    $("breakEvenLine").setAttribute("x2", "44");
    $("breakEvenPoint").setAttribute("cx", "44");
    $("breakEvenPoint").setAttribute("cy", "224");
    $("planPoint").setAttribute("cx", "44");
    $("planPoint").setAttribute("cy", "224");
    setText("chartMaxLabel", "—");
    setText("chartBreakLabel", "bod zvratu");
    setText("chartSummary", "Graf se zobrazí po opravě hodnot.");
  }

  function renderChart(values, result) {
    const maxUnits = Math.max(10, Math.ceil(Math.max(values.plannedSales, result.breakEvenUnits, result.targetUnits || 0) * 1.2));
    const maxMoney = Math.max(
      values.sellingPrice * maxUnits,
      values.fixedCosts + values.variableCost * maxUnits,
      1
    ) * 1.08;
    const left = 44, right = 620, top = 30, bottom = 224;
    const x = units => left + units / maxUnits * (right - left);
    const y = amount => bottom - amount / maxMoney * (bottom - top);
    $("revenuePath").setAttribute("d", `M ${x(0)} ${y(0)} L ${x(maxUnits)} ${y(values.sellingPrice * maxUnits)}`);
    $("totalCostPath").setAttribute("d", `M ${x(0)} ${y(values.fixedCosts)} L ${x(maxUnits)} ${y(values.fixedCosts + values.variableCost * maxUnits)}`);
    const breakX = x(Math.min(result.breakEvenExact, maxUnits));
    const breakY = y(result.breakEvenExact * values.sellingPrice);
    $("breakEvenLine").setAttribute("x1", breakX);
    $("breakEvenLine").setAttribute("x2", breakX);
    $("breakEvenPoint").setAttribute("cx", breakX);
    $("breakEvenPoint").setAttribute("cy", breakY);
    const planX = x(Math.min(values.plannedSales, maxUnits));
    const planY = y(Math.min(values.plannedSales, maxUnits) * values.sellingPrice);
    $("planPoint").setAttribute("cx", planX);
    $("planPoint").setAttribute("cy", planY);
    $("planPoint").style.display = values.plannedSales > 0 ? "block" : "none";
    setText("chartMaxLabel", unitText(maxUnits, values.unitLabel));
    $("chartBreakLabel").setAttribute("x", breakX);
    setText("chartBreakLabel", `bod zvratu ${formatNumber(result.breakEvenUnits)}`);
    setText("chartSummary", `Křivky se protínají přibližně při ${unitText(result.breakEvenUnits, values.unitLabel)}.`);
    setText("chartDesc", `Tržby a celkové náklady se protínají v bodu zvratu ${unitText(result.breakEvenUnits, values.unitLabel)}. Plánovaný prodej je ${unitText(values.plannedSales, values.unitLabel)}.`);
  }

  function renderScenarios(values, result) {
    const scenarios = [
      ["Cena +10 %", { ...values, sellingPrice: values.sellingPrice * 1.1 }],
      ["Cena −10 %", { ...values, sellingPrice: values.sellingPrice * .9 }],
      ["Variabilní náklad +10 %", { ...values, variableCost: values.variableCost * 1.1 }],
      ["Fixní náklady +20 %", { ...values, fixedCosts: values.fixedCosts * 1.2 }]
    ];
    const fragment = document.createDocumentFragment();
    scenarios.forEach(([label, scenario]) => {
      const card = document.createElement("div");
      card.className = "break-even-scenario-card";
      const contribution = scenario.sellingPrice - scenario.variableCost;
      if (contribution <= 0) {
        card.innerHTML = `<span>${label}</span><strong>Nevychází</strong><small>Cena nepokrývá variabilní náklad.</small>`;
      } else {
        const units = Math.ceil(scenario.fixedCosts / contribution);
        const difference = units - result.breakEvenUnits;
        const change = difference === 0 ? "beze změny" : `${difference > 0 ? "+" : "−"}${formatNumber(Math.abs(difference))} ${values.unitLabel}`;
        card.innerHTML = `<span>${label}</span><strong>${unitText(units, values.unitLabel)}</strong><small>${change} proti základnímu výpočtu</small>`;
      }
      fragment.appendChild(card);
    });
    $("scenarioList").replaceChildren(fragment);
  }

  function render(options = {}) {
    const values = readValues();
    const message = validate(values);
    if (message) {
      setInvalidState(message);
      return false;
    }
    $("breakEvenError").hidden = true;
    const result = calculate(values);
    setText("breakEvenUnitsResult", unitText(result.breakEvenUnits, values.unitLabel));
    setText("answerPeriod", `za ${values.periodLabel}`);
    setText("breakEvenRevenueResult", formatMoney(result.breakEvenRevenue));
    setText("unitContributionResult", formatMoney(result.unitContribution));
    setText("plannedProfitResult", formatMoney(result.plannedProfit));
    setText("safetyMarginResult", values.plannedSales > 0
      ? `${formatPercent(result.safetyRate)} (${result.safetyUnits >= 0 ? "+" : "−"}${unitText(Math.abs(result.safetyUnits), values.unitLabel)})`
      : "Bez plánu");
    setText("fixedCostsResult", formatMoney(values.fixedCosts));
    setText("variableCostResult", formatMoney(values.variableCost));
    setText("contributionRateResult", formatPercent(result.contributionRate));
    setText("plannedSalesResult", unitText(values.plannedSales, values.unitLabel));
    setText("plannedSalesUnit", values.unitLabel);
    const decision = renderDecision(values, result);
    const targetBox = $("targetProfitResultBox");
    targetBox.hidden = values.targetProfit <= 0;
    if (values.targetProfit > 0) {
      setText("targetProfitLabel", formatMoney(values.targetProfit));
      setText("targetUnitsResult", unitText(result.targetUnits, values.unitLabel));
      setText("targetRevenueResult", `Obrat alespoň ${formatMoney(result.targetRevenue)} za ${values.periodLabel}`);
    }
    renderHero(values, result, decision);
    renderChart(values, result);
    renderScenarios(values, result);
    if (options.scroll && window.matchMedia("(max-width: 720px)").matches) {
      $("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return true;
  }

  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    Object.entries(preset).forEach(([key, value]) => { fields[key].value = value; });
    document.querySelectorAll("[data-break-preset]").forEach(button => {
      button.classList.toggle("is-active", button.dataset.breakPreset === name);
    });
    render();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    render({ scroll: true });
  });
  Object.values(fields).forEach(field => {
    field.addEventListener("input", () => render());
    field.addEventListener("change", () => render());
  });
  document.querySelectorAll("[data-break-preset]").forEach(button => {
    button.addEventListener("click", () => applyPreset(button.dataset.breakPreset));
  });
  $("resetBtn").addEventListener("click", () => applyPreset("product"));
  applyPreset("product");
})();
