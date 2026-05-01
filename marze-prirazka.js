(() => {
  const ids = ["purchasePrice", "calcMode", "percentValue", "quantity", "vatRate", "discountRate"];
  const $ = (id) => document.getElementById(id);
  const form = $("pricingForm");
  const resetBtn = $("resetBtn");
  const money = (value, digits = 0) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: digits
    }).format(Number.isFinite(value) ? value : 0);
  const pct = (value) =>
    `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(
      Number.isFinite(value) ? value : 0
    )} %`;

  function values() {
    return {
      purchasePrice: Number($("purchasePrice").value) || 0,
      calcMode: $("calcMode").value,
      percentValue: Number($("percentValue").value) || 0,
      quantity: Number($("quantity").value) || 0,
      vatRate: Number($("vatRate").value) || 0,
      discountRate: Number($("discountRate").value) || 0
    };
  }

  function calculate(v) {
    const salePrice =
      v.calcMode === "markup"
        ? v.purchasePrice * (1 + v.percentValue / 100)
        : v.purchasePrice / Math.max(0.001, 1 - v.percentValue / 100);
    const profitPerUnit = salePrice - v.purchasePrice;
    const margin = salePrice > 0 ? (profitPerUnit / salePrice) * 100 : 0;
    const markup = v.purchasePrice > 0 ? (profitPerUnit / v.purchasePrice) * 100 : 0;
    const salePriceVat = salePrice * (1 + v.vatRate / 100);
    const discountedPrice = salePrice * (1 - v.discountRate / 100);
    const profitAfterDiscount = discountedPrice - v.purchasePrice;
    const totalProfit = profitPerUnit * v.quantity;
    return { salePrice, profitPerUnit, margin, markup, salePriceVat, discountedPrice, profitAfterDiscount, totalProfit };
  }

  function render() {
    const v = values();
    const r = calculate(v);
    $("salePrice").textContent = money(r.salePrice);
    $("profitPerUnit").textContent = money(r.profitPerUnit);
    $("marginOutput").textContent = pct(r.margin);
    $("markupOutput").textContent = pct(r.markup);
    $("salePriceVat").textContent = money(r.salePriceVat);
    $("discountedPrice").textContent = money(r.discountedPrice);
    $("profitAfterDiscount").textContent = money(r.profitAfterDiscount);
    $("totalProfit").textContent = money(r.totalProfit);
    $("quantityOutput").textContent = new Intl.NumberFormat("cs-CZ").format(v.quantity);
    $("statusBadge").textContent = r.profitAfterDiscount < 0 ? "Po slevě vychází ztráta" : "Cena vytváří kladný zisk";
    $("decisionHeadline").textContent =
      r.profitAfterDiscount < 0 ? "Sleva posílá prodej do ztráty" : "Cenotvorba má kladný výsledek";
    $("decisionText").textContent = `Prodejní cena bez DPH vychází ${money(
      r.salePrice
    )}. Zisk na kus je ${money(r.profitPerUnit)} a marže ${pct(r.margin)}.`;
    $("nextStepText").textContent =
      r.profitAfterDiscount < 0
        ? "Další krok: snižte slevu, zvyšte cenu nebo ověřte nákupní cenu."
        : "Další krok: porovnejte cenu s minimální prodejní cenou a bodem zvratu.";
    $("summaryTableBody").innerHTML = [
      ["Nákupní cena", money(v.purchasePrice), "vstup bez DPH"],
      ["Prodejní cena", money(r.salePrice), "výsledná cena bez DPH"],
      ["Cena s DPH", money(r.salePriceVat), "orientační koncová cena"],
      ["Marže", pct(r.margin), "podíl zisku z ceny"],
      ["Přirážka", pct(r.markup), "navýšení proti nákupu"],
      ["Zisk po slevě", money(r.profitAfterDiscount), "kontrola akční ceny"]
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
