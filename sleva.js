(() => {
  const ids = ["originalPrice", "discountPercent", "secondDiscount", "couponValue", "quantity", "vatMode"];
  const $ = (id) => document.getElementById(id);
  const form = $("discountForm");
  const resetBtn = $("resetBtn");
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0
    }).format(Number.isFinite(value) ? value : 0);
  const pct = (value) =>
    `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0)} %`;

  function values() {
    return {
      originalPrice: Number($("originalPrice").value) || 0,
      discountPercent: Number($("discountPercent").value) || 0,
      secondDiscount: Number($("secondDiscount").value) || 0,
      couponValue: Number($("couponValue").value) || 0,
      quantity: Number($("quantity").value) || 0,
      vatMode: $("vatMode").value
    };
  }

  function calculate(v) {
    const original = v.originalPrice;
    const afterFirst = original * (1 - v.discountPercent / 100);
    const afterSecond = afterFirst * (1 - v.secondDiscount / 100);
    const afterCoupon = Math.max(0, afterSecond - v.couponValue);
    const finalPricePerPiece = Math.max(0, afterCoupon);
    const savedPerPiece = original - finalPricePerPiece;
    const originalTotal = original * v.quantity;
    const finalTotalPrice = finalPricePerPiece * v.quantity;
    const savedTotal = savedPerPiece * v.quantity;
    const effectiveDiscount = original > 0 ? (savedPerPiece / original) * 100 : 0;
    return { original, afterFirst, afterSecond, afterCoupon, finalPricePerPiece, savedPerPiece, originalTotal, finalTotalPrice, savedTotal, effectiveDiscount };
  }

  function render() {
    const v = values();
    const r = calculate(v);
    $("finalPricePerPiece").textContent = money(r.finalPricePerPiece);
    $("finalTotalPrice").textContent = money(r.finalTotalPrice);
    $("savedPerPiece").textContent = money(r.savedPerPiece);
    $("savedTotal").textContent = money(r.savedTotal);
    $("discountBadge").textContent = `Efektivní sleva: ${pct(r.effectiveDiscount)}`;
    $("summaryOriginal").textContent = money(r.original);
    $("summaryAfterFirst").textContent = money(r.afterFirst);
    $("summaryAfterSecond").textContent = money(r.afterSecond);
    $("summaryAfterCoupon").textContent = money(r.afterCoupon);
    $("summaryQuantity").textContent = new Intl.NumberFormat("cs-CZ").format(v.quantity);
    $("decisionHeadline").textContent =
      r.effectiveDiscount >= 30 ? "Sleva je výrazná" : r.effectiveDiscount > 0 ? "Sleva snižuje cenu přehledně" : "Cena je bez slevy";
    $("decisionText").textContent = `Finální cena za kus je ${money(r.finalPricePerPiece)} a úspora na kus ${money(
      r.savedPerPiece
    )}. Efektivní sleva vychází ${pct(r.effectiveDiscount)}.`;
    $("nextStepText").textContent =
      "Další krok: pokud prodáváte zboží, ověřte po slevě ještě marži a minimální prodejní cenu.";
    $("stepsBody").innerHTML = [
      ["Původní cena", money(r.original), "základ pro výpočet"],
      ["Po první slevě", money(r.afterFirst), `${pct(v.discountPercent)} sleva`],
      ["Po druhé slevě", money(r.afterSecond), `${pct(v.secondDiscount)} sleva`],
      ["Po kuponu", money(r.afterCoupon), `kupon ${money(v.couponValue)}`],
      ["Celkem za kusy", money(r.finalTotalPrice), `${v.quantity} ks`],
      ["Celková úspora", money(r.savedTotal), "rozdíl proti původní ceně"]
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
