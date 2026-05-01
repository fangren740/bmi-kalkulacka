(() => {
  const ids = ["sellingPrice", "variableCost", "fixedCosts", "plannedSales"];
  const $ = (id) => document.getElementById(id);
  const form = $("breakEvenForm");
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

  function values() {
    return Object.fromEntries(ids.map((id) => [id, Number($(id).value) || 0]));
  }

  function render() {
    const v = values();
    const unitMargin = v.sellingPrice - v.variableCost;
    const breakEvenUnits = unitMargin > 0 ? Math.ceil(v.fixedCosts / unitMargin) : 0;
    const breakEvenRevenue = breakEvenUnits * v.sellingPrice;
    const plannedContribution = v.plannedSales * unitMargin;
    const plannedProfit = plannedContribution - v.fixedCosts;
    const safetyMargin = v.plannedSales - breakEvenUnits;
    const marginRate = v.sellingPrice > 0 ? (unitMargin / v.sellingPrice) * 100 : 0;

    $("breakEvenUnitsResult").textContent = `${num(breakEvenUnits)} ks`;
    $("breakEvenRevenueResult").textContent = money(breakEvenRevenue);
    $("contributionMarginResult").textContent = money(plannedContribution);
    $("plannedProfitResult").textContent = money(plannedProfit);
    $("resultBadge").textContent =
      plannedProfit >= 0 ? "Plán je nad bodem zvratu" : "Plán je pod bodem zvratu";
    $("sellingPriceResult").textContent = money(v.sellingPrice);
    $("variableCostResult").textContent = money(v.variableCost);
    $("fixedCostsResult").textContent = money(v.fixedCosts);
    $("unitMarginResult").textContent = money(unitMargin);
    $("plannedSalesResult").textContent = `${num(v.plannedSales)} ks`;
    $("safetyMarginResult").textContent = `${num(safetyMargin)} ks`;
    $("decisionHeadline").textContent =
      plannedProfit >= 0 ? "Plán má rezervu nad nulou" : "Plán zatím nepokrývá fixní náklady";
    $("decisionText").textContent = `Bod zvratu vychází na ${num(
      breakEvenUnits
    )} ks a obrat ${money(breakEvenRevenue)}. Příspěvek na úhradu je ${money(
      unitMargin
    )} na kus, tedy přibližně ${num(marginRate)} % z ceny.`;
    $("nextStepText").textContent =
      plannedProfit >= 0
        ? "Další krok: dopočtěte cílový zisk a sledujte, jestli je bezpečnostní rezerva dostatečná."
        : "Další krok: zvyšte cenu, snižte variabilní náklady, omezte fixní náklady nebo upravte plán prodeje.";
    $("summaryTableBody").innerHTML = [
      ["Prodejní cena", money(v.sellingPrice)],
      ["Variabilní náklad", money(v.variableCost)],
      ["Příspěvek na kus", money(unitMargin)],
      ["Fixní náklady", money(v.fixedCosts)],
      ["Plánovaný prodej", `${num(v.plannedSales)} ks`],
      ["Plánovaný zisk", money(plannedProfit)]
    ]
      .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`)
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
