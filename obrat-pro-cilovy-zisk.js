(() => {
  const ids = [
    "fixedCosts",
    "targetProfit",
    "calculationMode",
    "contributionMargin",
    "unitPrice",
    "variableCostPerUnit",
    "currentTurnover",
    "periodLabel"
  ];
  const $ = (id) => document.getElementById(id);
  const form = $("targetProfitForm");
  const resetBtn = $("resetBtn");
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0
    }).format(Number.isFinite(value) ? value : 0);
  const num = (value) =>
    new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(
      Number.isFinite(value) ? value : 0
    );
  const pct = (value) =>
    `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(value)} %`;

  function values() {
    return Object.fromEntries(
      ids.map((id) => [id, $(id).tagName === "SELECT" ? $(id).value : Number($(id).value) || 0])
    );
  }

  function render() {
    const v = values();
    const requiredContribution = v.fixedCosts + v.targetProfit;
    const marginRate =
      v.calculationMode === "price-cost"
        ? (v.unitPrice - v.variableCostPerUnit) / Math.max(1, v.unitPrice)
        : v.contributionMargin / 100;
    const safeMarginRate = Math.max(0.001, marginRate);
    const requiredTurnover = requiredContribution / safeMarginRate;
    const contributionPerUnit =
      v.calculationMode === "price-cost"
        ? v.unitPrice - v.variableCostPerUnit
        : v.unitPrice * safeMarginRate;
    const requiredUnits =
      contributionPerUnit > 0 ? requiredContribution / contributionPerUnit : 0;
    const turnoverGap = requiredTurnover - v.currentTurnover;
    const profitShare = requiredTurnover > 0 ? (v.targetProfit / requiredTurnover) * 100 : 0;

    $("requiredTurnover").textContent = money(requiredTurnover);
    $("requiredContribution").textContent = money(requiredContribution);
    $("requiredUnits").textContent = num(Math.ceil(requiredUnits));
    $("turnoverGap").textContent = money(turnoverGap);
    $("contributionMarginResult").textContent = pct(safeMarginRate * 100);
    $("contributionPerUnitResult").textContent = money(contributionPerUnit);
    $("fixedCostsResult").textContent = money(v.fixedCosts);
    $("targetProfitResult").textContent = money(v.targetProfit);
    $("currentTurnoverResult").textContent = money(v.currentTurnover);
    $("profitShareResult").textContent = pct(profitShare);
    $("resultBadge").textContent =
      turnoverGap <= 0 ? "Současný obrat cíl pokrývá" : "Chybí obrat do cíle";
    $("decisionHeadline").textContent =
      turnoverGap <= 0 ? "Cílový zisk je dosažitelný" : "K cíli ještě chybí obrat";
    $("decisionText").textContent = `Pro cílový zisk je potřeba obrat přibližně ${money(
      requiredTurnover
    )}. Při zadaném příspěvku na úhradu to odpovídá zhruba ${num(
      Math.ceil(requiredUnits)
    )} jednotkám.`;
    $("nextStepText").textContent =
      "Další krok: ověřte marži, cenu a variabilní náklady. Malá změna příspěvku na úhradu umí výrazně změnit potřebný obrat.";
    $("breakdownBody").innerHTML = [
      ["Fixní náklady", money(v.fixedCosts), "základ"],
      ["Cílový zisk", money(v.targetProfit), "cíl"],
      ["Potřebný příspěvek", money(requiredContribution), "součet"],
      ["Příspěvek na jednotku", money(contributionPerUnit), "marže"],
      ["Rozdíl proti současnosti", money(turnoverGap), "mezera"]
    ]
      .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
      .join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  ids.forEach((id) => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });
  resetBtn.addEventListener("click", () => {
    form.reset();
    render();
  });
  render();
})();
