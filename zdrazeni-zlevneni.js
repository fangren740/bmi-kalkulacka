(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("priceChangeForm");
  const resetBtn = $("resetBtn");
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(
      Number.isFinite(value) ? value : 0
    );
  const pct = (value) =>
    `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0)} %`;

  function impact(absPercent) {
    if (absPercent < 1) return "Téměř beze změny";
    if (absPercent < 5) return "Mírná změna";
    if (absPercent < 15) return "Střední změna";
    return "Výrazná změna";
  }

  function render() {
    const oldPrice = Number($("oldPrice").value) || 0;
    const newPrice = Number($("newPrice").value) || 0;
    const diff = newPrice - oldPrice;
    const percent = oldPrice > 0 ? (diff / oldPrice) * 100 : 0;
    const absPercent = Math.abs(percent);
    const type = diff > 0 ? "Zdražení" : diff < 0 ? "Zlevnění" : "Beze změny";
    $("percentChange").textContent = pct(percent);
    $("difference").textContent = money(diff);
    $("statusBadge").textContent = type;
    $("oldPriceSummary").textContent = money(oldPrice);
    $("newPriceSummary").textContent = money(newPrice);
    $("changeType").textContent = type;
    $("impactLevel").textContent = impact(absPercent);
    $("changeVsBase").textContent = pct(percent);
    $("resultNote").textContent = `Změna z ${money(oldPrice)} na ${money(newPrice)} je ${pct(percent)}.`;
    $("priceStatus").textContent = impact(absPercent);
    $("priceText").textContent =
      diff > 0
        ? `Cena vzrostla o ${money(diff)}. Procento se počítá z původní ceny.`
        : diff < 0
          ? `Cena klesla o ${money(Math.abs(diff))}. Sleva odpovídá ${pct(absPercent)} z původní ceny.`
          : "Cena se nezměnila.";
    $("actionStatus").textContent = "Další krok";
    $("decisionSummary").textContent =
      absPercent >= 10
        ? "Změna je dost výrazná na kontrolu rozpočtu, marže nebo srovnání s inflací."
        : "Změna je spíš menší, ale u opakovaných plateb se může projevit za delší období.";
    $("nextActionText").textContent =
      "Pokud jde o obchodní cenu, ověřte dopad na marži. Pokud jde o životní náklady, porovnejte změnu s inflací.";
    $("summaryTableBody").innerHTML = [
      ["Původní cena", money(oldPrice), "základ výpočtu"],
      ["Nová cena", money(newPrice), "porovnávaná hodnota"],
      ["Rozdíl", money(diff), "změna v korunách"],
      ["Procentní změna", pct(percent), "změna vůči původní ceně"],
      ["Vyhodnocení", impact(absPercent), type]
    ]
      .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
      .join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  ["oldPrice", "newPrice"].forEach((id) => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });
  resetBtn.addEventListener("click", () => {
    form.reset();
    render();
  });
  document.querySelectorAll("[data-price-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      $("oldPrice").value = button.dataset.old;
      $("newPrice").value = button.dataset.new;
      render();
    });
  });
  render();
})();
