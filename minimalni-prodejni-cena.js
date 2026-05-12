(() => {
  const ids = ["directCosts", "extraCosts", "fixedCostsPerUnit", "commissionPercent", "targetMargin", "vatRate", "priceMode", "currentPrice"];
  const $ = (id) => document.getElementById(id);
  const form = $("pricingForm");
  const resetBtn = $("resetBtn");
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0
    }).format(Number.isFinite(value) ? value : 0);
  const pct = (value) =>
    `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(
      Number.isFinite(value) ? value : 0
    )} %`;
  const moneyFine = (value) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Number.isFinite(value) ? value : 0);

  function ensureNextActions() {
    const summary = document.querySelector(".result-panel .rv-output-summary");
    if (!summary || document.querySelector(".rv-business-next-actions")) return;
    summary.insertAdjacentHTML(
      "afterend",
      `<div class="rv-business-next-actions" aria-label="Co spočítat dál">
        <strong>Co spočítat dál</strong>
        <a href="kalkulacka-marze-a-prirazky.html">Ověřit marži a přirážku</a>
        <a href="bod-zvratu-kalkulacka.html">Spočítat bod zvratu</a>
        <a href="dph-kalkulacka.html">Zkontrolovat cenu s DPH</a>
      </div>`
    );
  }

  function updateHero(v, r) {
    const number = document.querySelector(".hero-visual .reno-number");
    if (number) number.textContent = moneyFine(r.minPriceNet);
    const sub = document.querySelector(".hero-visual .reno-sub");
    if (sub) {
      sub.textContent = r.priceDifference < 0
        ? "Aktuální cena je pod minimem, zadaný model nepokrývá cíl."
        : "Cena pokrývá náklady, provizi i požadovanou marži.";
    }
    document.querySelectorAll(".hero-visual .reno-metrics b").forEach((element, index) => {
      const valuesForHero = [moneyFine(r.totalCosts), moneyFine(r.commissionAmount), moneyFine(r.minPriceGross)];
      element.textContent = valuesForHero[index] || element.textContent;
    });
  }

  function values() {
    return {
      directCosts: Number($("directCosts").value) || 0,
      extraCosts: Number($("extraCosts").value) || 0,
      fixedCostsPerUnit: Number($("fixedCostsPerUnit").value) || 0,
      commissionPercent: Number($("commissionPercent").value) || 0,
      targetMargin: Number($("targetMargin").value) || 0,
      vatRate: Number($("vatRate").value) || 0,
      priceMode: $("priceMode").value,
      currentPrice: Number($("currentPrice").value) || 0
    };
  }

  function calculate(v) {
    const totalCosts = v.directCosts + v.extraCosts + v.fixedCostsPerUnit;
    const commissionRate = v.commissionPercent / 100;
    const marginRate = v.priceMode === "margin" ? v.targetMargin / 100 : 0;
    const denominator = Math.max(0.001, 1 - commissionRate - marginRate);
    const minPriceNet = totalCosts / denominator;
    const commissionAmount = minPriceNet * commissionRate;
    const marginAmount = minPriceNet * marginRate;
    const vatAmount = minPriceNet * (v.vatRate / 100);
    const minPriceGross = minPriceNet + vatAmount;
    const currentCommission = v.currentPrice * commissionRate;
    const currentProfit = v.currentPrice - totalCosts - currentCommission;
    const actualMargin = v.currentPrice > 0 ? (currentProfit / v.currentPrice) * 100 : 0;
    const currentPriceGross = v.currentPrice * (1 + v.vatRate / 100);
    const priceDifference = v.currentPrice - minPriceNet;
    return { totalCosts, minPriceNet, minPriceGross, commissionAmount, marginAmount, vatAmount, currentPriceGross, actualMargin, priceDifference, currentProfit };
  }

  function render() {
    const v = values();
    const r = calculate(v);
    $("minPriceNet").textContent = moneyFine(r.minPriceNet);
    $("minPriceGross").textContent = moneyFine(r.minPriceGross);
    $("marginAmount").textContent = moneyFine(r.marginAmount);
    $("priceDifference").textContent = moneyFine(r.priceDifference);
    $("totalCosts").textContent = moneyFine(r.totalCosts);
    $("commissionAmount").textContent = moneyFine(r.commissionAmount);
    $("vatAmount").textContent = moneyFine(r.vatAmount);
    $("currentPriceResult").textContent = moneyFine(v.currentPrice);
    $("currentPriceGrossResult").textContent = moneyFine(r.currentPriceGross);
    $("actualMarginResult").textContent = pct(r.actualMargin);
    const below = v.currentPrice > 0 && v.currentPrice < r.minPriceNet;
    const tight = v.currentPrice > 0 && v.currentPrice < r.minPriceNet * 1.1;
    $("statusBadge").textContent = below
      ? "Aktuální cena je pod minimem"
      : tight
        ? "Cena je těsně nad minimem"
        : "Cena má rozumnou rezervu";
    $("decisionHeadline").textContent = below
      ? "Aktuální cena je příliš nízko"
      : tight
        ? "Cena je jen těsně nad hranicí"
        : "Cena vypadá udržitelně";
    $("decisionText").textContent = `Minimální cena bez DPH vychází ${money(
      r.minPriceNet
    )}. Aktuální cena je proti ní ${moneyFine(r.priceDifference)}. ${
      below
        ? "To znamená, že pro zadané náklady, provizi a marži je cena příliš nízko."
        : tight
          ? "Rezerva je malá, takže sleva nebo růst nákladů může rychle smazat marži."
          : "Cena má nad spodní hranicí prostor na běžné výkyvy a obchodní slevy."
    }`;
    $("nextStepText").textContent = below
      ? "Další krok: upravte cenu, provizi nebo náklady, jinak obchod nepokryje zadaný cíl."
      : tight
        ? "Další krok: ověřte, kolik slevy si ještě můžete dovolit, a spočítejte bod zvratu."
        : "Další krok: ověřte marži v kalkulačce marže a dopad objemu prodeje v bodu zvratu.";
    $("interpretationNote").textContent = $("decisionText").textContent;
    $("summaryTableBody").innerHTML = [
      ["Celkové náklady na kus", moneyFine(r.totalCosts), "součet nákladů bez provize"],
      ["Provize", moneyFine(r.commissionAmount), "proměnlivý poplatek z ceny"],
      ["Cílová marže", moneyFine(r.marginAmount), "rezerva nad náklady"],
      ["Minimální cena bez DPH", moneyFine(r.minPriceNet), "dolní hranice ceny"],
      ["Minimální cena s DPH", moneyFine(r.minPriceGross), "orientační koncová cena"]
    ]
      .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
      .join("");
    updateHero(v, r);
  }

  ensureNextActions();
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
