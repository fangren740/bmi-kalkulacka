(() => {
  const ids = ["purchasePrice", "calcMode", "percentValue", "quantity", "vatRate", "discountRate"];
  const $ = id => document.getElementById(id);
  const form = $("pricingForm");
  const resetBtn = $("resetBtn");

  const money = (value, digits = 0) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: digits
    }).format(Number.isFinite(value) ? value : 0);

  const compactMoney = value => {
    const safeValue = Number.isFinite(value) ? value : 0;
    const abs = Math.abs(safeValue);
    if (abs >= 1000000) return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(safeValue / 1000000)} mil. Kč`;
    if (abs >= 100000) return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(safeValue / 1000)} tis. Kč`;
    return money(safeValue);
  };

  const pct = value =>
    `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(
      Number.isFinite(value) ? value : 0
    )} %`;

  const premium = {
    verdict: $("marginPremiumVerdict"),
    subline: $("marginPremiumSubline"),
    sentence: $("marginPremiumSentence"),
    checklist: $("marginPremiumChecklist"),
    table: $("marginScenarioTableBody")
  };

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
    const margin = salePrice > 0 ? profitPerUnit / salePrice * 100 : 0;
    const markup = v.purchasePrice > 0 ? profitPerUnit / v.purchasePrice * 100 : 0;
    const salePriceVat = salePrice * (1 + v.vatRate / 100);
    const discountedPrice = salePrice * (1 - v.discountRate / 100);
    const profitAfterDiscount = discountedPrice - v.purchasePrice;
    const marginAfterDiscount = discountedPrice > 0 ? profitAfterDiscount / discountedPrice * 100 : 0;
    const totalProfit = profitPerUnit * v.quantity;
    const totalProfitAfterDiscount = profitAfterDiscount * v.quantity;
    return {
      salePrice,
      profitPerUnit,
      margin,
      markup,
      salePriceVat,
      discountedPrice,
      profitAfterDiscount,
      marginAfterDiscount,
      totalProfit,
      totalProfitAfterDiscount
    };
  }

  function stateFor(v, r) {
    if (r.profitAfterDiscount < 0) {
      return {
        badge: "Sleva posílá cenu do ztráty",
        headline: "Sleva posílá prodej do ztráty",
        text: `Prodejní cena bez DPH je ${money(r.salePrice)}, ale po slevě ${pct(v.discountRate)} klesá zisk na kus na ${money(r.profitAfterDiscount)}. Taková akce potřebuje vyšší cenu, nižší nákupní cenu nebo menší slevu.`,
        next: "Další krok: spočítejte minimální prodejní cenu a bod zvratu před spuštěním akce."
      };
    }

    if (r.marginAfterDiscount < 15) {
      return {
        badge: "Marže po slevě je těsná",
        headline: "Cena vychází, ale rezerva je nízká",
        text: `Po slevě zůstává zisk na kus ${money(r.profitAfterDiscount)} a marže ${pct(r.marginAfterDiscount)}. To může být použitelné při velkém objemu, ale snadno to sebere reklama, doprava nebo vratky.`,
        next: "Další krok: ověřte bod zvratu a minimální cenu po započtení dalších nákladů."
      };
    }

    return {
      badge: "Cena vytváří použitelný prostor",
      headline: "Cenotvorba má kladný výsledek",
      text: `Prodejní cena bez DPH vychází ${money(r.salePrice)}. Zisk na kus je ${money(r.profitPerUnit)}, marže ${pct(r.margin)} a po slevě zůstává ${money(r.profitAfterDiscount)}.`,
      next: "Další krok: porovnejte cenu s minimální prodejní cenou, DPH a bodem zvratu."
    };
  }

  function renderPremium(v, r, state) {
    if (!premium.verdict) return;

    premium.verdict.textContent = state.badge;
    premium.subline.textContent = `Marže ${pct(r.margin)}, po slevě ${pct(r.marginAfterDiscount)}`;
    premium.sentence.textContent = `${state.text} ${state.next}`;
    premium.checklist.innerHTML = [
      v.calcMode === "markup"
        ? "Počítáte podle přirážky. Přirážka se vztahuje k nákupní ceně, proto je výsledná marže nižší než zadané procento."
        : "Počítáte podle cílové marže. Výsledná přirážka vůči nákupu bývá výrazně vyšší než marže.",
      v.discountRate > 0
        ? `Sleva ${pct(v.discountRate)} snižuje zisk na kus na ${money(r.profitAfterDiscount)}. Kontrolujte ji před každou akcí.`
        : "Bez slevy vychází základní cena. Před akcí otestujte dopad slevy 5 až 20 %.",
      "DPH oddělujte od marže. Pro ziskovost je rozhodující cena bez DPH a všechny další provozní náklady."
    ].map(item => `<li>${item}</li>`).join("");

    premium.table.innerHTML = [0, 5, 10, 20].map(discount => {
      const scenario = calculate({ ...v, discountRate: discount });
      return `<tr><td>${pct(discount)}</td><td>${money(scenario.discountedPrice)}</td><td>${money(scenario.profitAfterDiscount)}</td></tr>`;
    }).join("");
  }

  function renderHero(r) {
    const set = (id, value) => {
      const element = $(id);
      if (element) element.textContent = value;
    };
    set("marginHeroSale", compactMoney(r.salePrice));
    set("marginHeroCost", compactMoney(r.salePrice - r.profitPerUnit));
    set("marginHeroProfit", compactMoney(r.profitPerUnit));
    set("marginHeroNet", compactMoney(r.salePrice));
    set("marginHeroAfter", pct(r.marginAfterDiscount));
    set("marginHeroDiscountProfit", `Zisk po slevě ${compactMoney(r.profitAfterDiscount)}`);
    set("marginHeroVat", compactMoney(r.salePriceVat));
    set("marginHeroMarkup", pct(r.markup));

    const discount = $("marginHeroDiscount");
    if (discount) discount.textContent = pct(values().discountRate);
    const bar = $("marginHeroMarginBar");
    if (bar) bar.style.width = `${Math.max(5, Math.min(100, r.marginAfterDiscount))}%`;
  }

  function render() {
    const v = values();
    const r = calculate(v);
    const state = stateFor(v, r);

    $("salePrice").textContent = money(r.salePrice);
    $("profitPerUnit").textContent = money(r.profitPerUnit);
    $("marginOutput").textContent = pct(r.margin);
    $("markupOutput").textContent = pct(r.markup);
    $("salePriceVat").textContent = money(r.salePriceVat);
    $("discountedPrice").textContent = money(r.discountedPrice);
    $("profitAfterDiscount").textContent = money(r.profitAfterDiscount);
    $("totalProfit").textContent = money(r.totalProfit);
    $("quantityOutput").textContent = new Intl.NumberFormat("cs-CZ").format(v.quantity);
    $("statusBadge").textContent = state.badge;
    $("decisionHeadline").textContent = state.headline;
    $("decisionText").textContent = state.text;
    $("nextStepText").textContent = state.next;
    $("summaryTableBody").innerHTML = [
      ["Nákupní cena", money(v.purchasePrice), "vstup bez DPH"],
      ["Prodejní cena", money(r.salePrice), "výsledná cena bez DPH"],
      ["Cena s DPH", money(r.salePriceVat), "orientační koncová cena"],
      ["Marže", pct(r.margin), "podíl zisku z ceny"],
      ["Přirážka", pct(r.markup), "navýšení proti nákupu"],
      ["Zisk po slevě", money(r.profitAfterDiscount), "kontrola akční ceny"]
    ].map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");

    renderHero(r);
    renderPremium(v, r, state);
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    render();
  });
  ids.forEach(id => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });
  resetBtn.addEventListener("click", () => {
    form.reset();
    render();
  });
  render();
})();
