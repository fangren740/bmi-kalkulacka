(() => {
  const ids = ["sellingPrice", "variableCost", "fixedCosts", "plannedSales"];
  const $ = id => document.getElementById(id);
  const form = $("breakEvenForm");
  const resetBtn = $("resetBtn");

  const money = value =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0
    }).format(Number.isFinite(value) ? value : 0);

  const compactMoney = value => {
    const safeValue = Number.isFinite(value) ? value : 0;
    const abs = Math.abs(safeValue);
    if (abs >= 1000000) return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(safeValue / 1000000)} mil. Kč`;
    if (abs >= 100000) return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(safeValue / 1000)} tis. Kč`;
    return money(safeValue);
  };

  const num = value =>
    new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(
      Number.isFinite(value) ? value : 0
    );

  const pct = value =>
    `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(
      Number.isFinite(value) ? value : 0
    )} %`;

  const premium = {
    verdict: $("breakEvenPremiumVerdict"),
    subline: $("breakEvenPremiumSubline"),
    sentence: $("breakEvenPremiumSentence"),
    checklist: $("breakEvenPremiumChecklist"),
    table: $("breakEvenScenarioTableBody")
  };

  function values() {
    return Object.fromEntries(ids.map(id => [id, Number($(id).value) || 0]));
  }

  function calculate(v) {
    const unitMargin = v.sellingPrice - v.variableCost;
    const breakEvenUnits = unitMargin > 0 ? Math.ceil(v.fixedCosts / unitMargin) : 0;
    const breakEvenRevenue = breakEvenUnits * v.sellingPrice;
    const plannedContribution = v.plannedSales * unitMargin;
    const plannedProfit = plannedContribution - v.fixedCosts;
    const safetyMargin = v.plannedSales - breakEvenUnits;
    const safetyRate = breakEvenUnits > 0 ? safetyMargin / breakEvenUnits * 100 : 0;
    const marginRate = v.sellingPrice > 0 ? unitMargin / v.sellingPrice * 100 : 0;
    return { unitMargin, breakEvenUnits, breakEvenRevenue, plannedContribution, plannedProfit, safetyMargin, safetyRate, marginRate };
  }

  function stateFor(r) {
    if (r.unitMargin <= 0) {
      return {
        badge: "Cena nepokrývá variabilní náklad",
        headline: "Model nemá kladný příspěvek na kus",
        text: "Prodejní cena je stejná nebo nižší než variabilní náklad. Každý prodej zhoršuje výsledek a bod zvratu nedává smysl.",
        next: "Další krok: zvyšte cenu, snižte variabilní náklad nebo přepočítejte minimální prodejní cenu."
      };
    }
    if (r.plannedProfit < 0) {
      return {
        badge: "Plán je pod bodem zvratu",
        headline: "Plán zatím nepokrývá fixní náklady",
        text: `Bod zvratu vychází na ${num(r.breakEvenUnits)} ks, ale plánovaný prodej je níže. Výsledek je ${money(r.plannedProfit)}, takže projekt zatím nevytváří zisk.`,
        next: "Další krok: zvyšte cenu, snižte náklady nebo spočítejte obrat pro cílový zisk."
      };
    }
    if (r.safetyRate < 20) {
      return {
        badge: "Plán je těsně nad nulou",
        headline: "Plán má jen malou rezervu",
        text: `Plán je nad bodem zvratu o ${num(r.safetyMargin)} ks, tedy přibližně ${pct(r.safetyRate)}. Stačí slabší prodej, vratky nebo dražší reklama a výsledek se může dostat pod nulu.`,
        next: "Další krok: otestujte cenu, variabilní náklad a fixní náklady v citlivostním scénáři."
      };
    }
    return {
      badge: "Plán má rezervu nad bodem zvratu",
      headline: "Plán má rezervu nad nulou",
      text: `Bod zvratu vychází na ${num(r.breakEvenUnits)} ks a plánovaný prodej je o ${num(r.safetyMargin)} ks výše. To vytváří orientační zisk ${money(r.plannedProfit)}.`,
      next: "Další krok: dopočítejte cílový zisk a porovnejte marži s minimální prodejní cenou."
    };
  }

  function renderPremium(v, r, state) {
    if (!premium.verdict) return;

    premium.verdict.textContent = state.badge;
    premium.subline.textContent = `Bod zvratu ${num(r.breakEvenUnits)} ks, rezerva ${num(r.safetyMargin)} ks`;
    premium.sentence.textContent = `${state.text} ${state.next}`;
    premium.checklist.innerHTML = [
      r.unitMargin <= 0
        ? "Nejdřív opravte cenu nebo variabilní náklad. Bez kladného příspěvku nelze pokrýt fixní náklady objemem."
        : `Příspěvek na kus je ${money(r.unitMargin)}, tedy ${pct(r.marginRate)} z prodejní ceny.`,
      r.safetyMargin < 0
        ? "Plánovaný prodej je pod hranicí nuly. Než projekt spustíte, hledejte vyšší cenu nebo nižší náklady."
        : "Rezervu nad bodem zvratu berte jako ochranu proti slabšímu prodeji, reklamacím a dražší akvizici.",
      "Bod zvratu neřeší cílový zisk. Po pokrytí nákladů dopočítejte, kolik prodeje potřebujete pro skutečně zajímavý výsledek."
    ].map(item => `<li>${item}</li>`).join("");

    const scenarios = [
      ["Cena +10 %", calculate({ ...v, sellingPrice: v.sellingPrice * 1.1 })],
      ["Cena -10 %", calculate({ ...v, sellingPrice: v.sellingPrice * 0.9 })],
      ["Variabilní náklad -10 %", calculate({ ...v, variableCost: v.variableCost * 0.9 })],
      ["Fixní náklady +20 %", calculate({ ...v, fixedCosts: v.fixedCosts * 1.2 })]
    ];
    premium.table.innerHTML = scenarios.map(([label, scenario]) => {
      const impact = scenario.plannedProfit >= 0 ? `zisk ${money(scenario.plannedProfit)}` : `ztráta ${money(Math.abs(scenario.plannedProfit))}`;
      return `<tr><td>${label}</td><td>${num(scenario.breakEvenUnits)} ks</td><td>${impact}</td></tr>`;
    }).join("");
  }

  function renderHero(v, r) {
    const set = (id, value) => {
      const element = $(id);
      if (element) element.textContent = value;
    };
    set("breakHeroUnits", `${num(r.breakEvenUnits)} ks`);
    set("breakHeroProfit", `Plánovaný výsledek ${compactMoney(r.plannedProfit)}`);
    set("breakHeroPlanLabel", `plán ${num(v.plannedSales)} ks`);
    set("breakHeroReserve", `rezerva ${num(r.safetyMargin)} ks`);
    set("breakHeroPrice", compactMoney(v.sellingPrice));
    set("breakHeroMargin", compactMoney(r.unitMargin));
    set("breakHeroFixed", compactMoney(v.fixedCosts));
    set("breakHeroState", r.plannedProfit >= 0 ? "plán je nad nulou" : "plán je pod nulou");

    const scaleMax = Math.max(v.plannedSales, r.breakEvenUnits, 1);
    const marker = $("breakHeroBreakMarker");
    const plan = $("breakHeroPlanBar");
    if (marker) marker.style.left = `${Math.max(0, Math.min(100, r.breakEvenUnits / scaleMax * 100))}%`;
    if (plan) plan.style.width = `${Math.max(6, Math.min(100, v.plannedSales / scaleMax * 100))}%`;
  }

  function render() {
    const v = values();
    const r = calculate(v);
    const state = stateFor(r);

    $("breakEvenUnitsResult").textContent = `${num(r.breakEvenUnits)} ks`;
    $("breakEvenRevenueResult").textContent = money(r.breakEvenRevenue);
    $("contributionMarginResult").textContent = money(r.plannedContribution);
    $("plannedProfitResult").textContent = money(r.plannedProfit);
    $("resultBadge").textContent = state.badge;
    $("sellingPriceResult").textContent = money(v.sellingPrice);
    $("variableCostResult").textContent = money(v.variableCost);
    $("fixedCostsResult").textContent = money(v.fixedCosts);
    $("unitMarginResult").textContent = money(r.unitMargin);
    $("plannedSalesResult").textContent = `${num(v.plannedSales)} ks`;
    $("safetyMarginResult").textContent = `${num(r.safetyMargin)} ks`;
    $("decisionHeadline").textContent = state.headline;
    $("decisionText").textContent = state.text;
    $("nextStepText").textContent = state.next;
    $("summaryTableBody").innerHTML = [
      ["Prodejní cena", money(v.sellingPrice)],
      ["Variabilní náklad", money(v.variableCost)],
      ["Příspěvek na kus", money(r.unitMargin)],
      ["Fixní náklady", money(v.fixedCosts)],
      ["Plánovaný prodej", `${num(v.plannedSales)} ks`],
      ["Plánovaný zisk", money(r.plannedProfit)]
    ].map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td></tr>`).join("");

    renderHero(v, r);
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
