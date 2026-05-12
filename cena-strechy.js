(() => {
  const ids = [
    "roofArea",
    "roofType",
    "roofSlope",
    "roofing",
    "truss",
    "insulation",
    "flashings",
    "openings",
    "accessibility",
    "regionFactor",
    "reserveRate",
  ];

  const labels = {
    roofType: {
      simple: "jednoduchá",
      standard: "běžná členitost",
      complex: "členitá",
    },
    roofSlope: {
      easy: "mírný sklon",
      medium: "běžný sklon",
      hard: "náročný sklon",
    },
    roofing: {
      basic: "základní",
      standard: "běžná",
      higher: "vyšší standard",
    },
    truss: {
      basic: "jednodušší",
      standard: "běžný",
      higher: "náročnější",
    },
    insulation: {
      basic: "základní",
      standard: "běžné",
      higher: "vyšší",
    },
    openActions: {
      safe: "Jako další krok porovnejte cenu střechy s hrubou stavbou a celkovým rozpočtem domu.",
      watch: "Další krok: nechte si v nabídce rozepsat krov, krytinu, klempířské prvky, lešení a prostupy zvlášť.",
      risk: "Další krok: ověřte projekt, lešení, demontáž, prostupy, klempířinu a rezervu, protože drobné detaily mohou konečnou cenu rychle zvednout.",
    },
  };

  const $ = (id) => document.getElementById(id);
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);
  const compactMoney = (value) =>
    value >= 1000000
      ? `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(value / 1000000)} mil. Kč`
      : money(value);
  const pct = (value) =>
    `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(value)} %`;

  const form = $("roofForm");
  const resetBtn = $("resetBtn");

  function values() {
    return Object.fromEntries(
      ids.map((id) => {
        const element = $(id);
        return [id, element.tagName === "SELECT" ? element.value : Number(element.value) || 0];
      }),
    );
  }

  function getRoofTypeMultiplier(type) {
    if (type === "standard") return 1.08;
    if (type === "complex") return 1.18;
    return 1;
  }

  function getSlopeMultiplier(type) {
    if (type === "medium") return 1.06;
    if (type === "hard") return 1.12;
    return 1;
  }

  function getRoofingRate(type) {
    if (type === "basic") return 2100;
    if (type === "higher") return 3900;
    return 2900;
  }

  function getTrussRate(type) {
    if (type === "basic") return 1800;
    if (type === "higher") return 3400;
    return 2500;
  }

  function getInsulationRate(type) {
    if (type === "basic") return 700;
    if (type === "higher") return 1500;
    return 1000;
  }

  function getFlashingsRate(type) {
    if (type === "basic") return 350;
    if (type === "higher") return 950;
    return 600;
  }

  function getOpeningsMultiplier(type) {
    if (type === "medium") return 1.06;
    if (type === "high") return 1.13;
    return 1;
  }

  function getAccessibilityMultiplier(type) {
    if (type === "medium") return 1.04;
    if (type === "hard") return 1.1;
    return 1;
  }

  function ensureNextActions() {
    if (document.querySelector(".rv-reno-next-actions")) return;
    const summary = document.querySelector(".result-panel .rv-output-summary");
    if (!summary) return;
    summary.insertAdjacentHTML(
      "afterend",
      `<div class="rv-reno-next-actions" aria-label="Co spočítat dál">
        <strong>Co spočítat dál</strong>
        <a href="kalkulacka-ceny-hrube-stavby-domu.html">Navázat hrubou stavbou domu</a>
        <a href="kalkulacka-ceny-zakladove-desky.html">Ověřit cenu základové desky</a>
        <a href="kalkulacka-orientacni-ceny-stavby-domu.html">Spočítat celkový rozpočet domu</a>
      </div>`,
    );
  }

  function updateHero(v, totalCost, reserveCost) {
    const visual = document.querySelector(".hero-visual");
    if (!visual) return;

    const number = visual.querySelector(".reno-number");
    const sub = visual.querySelector(".reno-sub");
    const metrics = visual.querySelectorAll(".reno-metrics b");
    const product = visual.querySelector(".product-card strong");
    if (number) number.textContent = compactMoney(totalCost);
    if (sub) {
      sub.textContent = `Model ukazuje střechu ${labels.roofType[v.roofType]} s krytinou ${labels.roofing[v.roofing]}. Sledujte hlavně krov, krytinu, detaily a rezervu.`;
    }
    if (metrics[0]) metrics[0].textContent = `${v.roofArea} m²`;
    if (metrics[1]) metrics[1].textContent = labels.roofing[v.roofing];
    if (metrics[2]) metrics[2].textContent = pct(v.reserveRate);
    if (product) product.textContent = `${labels.roofSlope[v.roofSlope]} · rezerva ${v.reserveRate}%`;
  }

  function decide(v, pricePerM2, totalCost) {
    const riskFactors = [
      v.roofType === "complex",
      v.roofSlope === "hard",
      v.openings === "high",
      v.accessibility === "hard",
      v.roofing === "higher",
      v.truss === "higher",
    ].filter(Boolean).length;

    if (riskFactors >= 3 || pricePerM2 > 11500) {
      return {
        badge: "Náročnější střecha",
        headline: "Rozpočet je citlivý na detaily a pracnost",
        text: `Orientační cena střechy vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². Výsledek už míří do náročnější varianty, kde cenu netvoří jen krytina, ale hlavně krov, sklon, prostupy, klempířské prvky a přístup na stavbu.`,
        next: labels.openActions.risk,
      };
    }

    if (riskFactors >= 1 || pricePerM2 > 7800) {
      return {
        badge: "Běžná až vyšší střecha",
        headline: "Výsledek dává smysl, ale hlídejte rozsah nabídky",
        text: `Orientační cena střechy vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². Je to realistický první odhad, pokud nabídka skutečně obsahuje krov, krytinu, zateplení, klempířské prvky, dopravu, lešení a rezervu.`,
        next: labels.openActions.watch,
      };
    }

    return {
      badge: "Úspornější střecha",
      headline: "Rozpočet působí relativně klidně",
      text: `Orientační cena střechy vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². To je příznivější scénář, typicky pro jednodušší tvar, rozumný sklon a méně detailů. Pořád ale ověřte, zda v nabídce nechybí lešení, klempířina a prostupy.`,
      next: labels.openActions.safe,
    };
  }

  function render() {
    const v = values();
    v.roofArea = Math.max(1, Number(v.roofArea) || 1);
    v.regionFactor = Number(v.regionFactor) || 1;
    v.reserveRate = Number(v.reserveRate) || 0;

    const trussCost = v.roofArea * getTrussRate(v.truss) * getRoofTypeMultiplier(v.roofType);
    const roofingCost = v.roofArea * getRoofingRate(v.roofing) * getSlopeMultiplier(v.roofSlope);
    const insulationCost = v.roofArea * getInsulationRate(v.insulation);
    const flashingsCost = v.roofArea * getFlashingsRate(v.flashings);
    const complexityBase =
      (trussCost + roofingCost + insulationCost + flashingsCost) *
      (getOpeningsMultiplier(v.openings) - 1);
    const logisticsBase =
      (trussCost + roofingCost) * (getAccessibilityMultiplier(v.accessibility) - 1);
    const baseBeforeRegion =
      trussCost + roofingCost + insulationCost + flashingsCost + complexityBase + logisticsBase;
    const baseCost = baseBeforeRegion * v.regionFactor;
    const reserveCost = baseCost * (v.reserveRate / 100);
    const totalCost = baseCost + reserveCost;
    const pricePerM2 = totalCost / v.roofArea;
    const interpretation = decide(v, pricePerM2, totalCost);

    $("totalCost").textContent = money(totalCost);
    $("pricePerM2").textContent = money(pricePerM2);
    $("baseCost").textContent = money(baseCost);
    $("reserveCost").textContent = money(reserveCost);
    $("summaryArea").textContent = `${v.roofArea} m²`;
    $("summaryTruss").textContent = money(trussCost * v.regionFactor);
    $("summaryRoofing").textContent = money(roofingCost * v.regionFactor);
    $("summaryDetails").textContent = money((insulationCost + flashingsCost) * v.regionFactor);
    $("summaryComplexity").textContent = money((complexityBase + logisticsBase) * v.regionFactor);
    $("summaryReserveShare").textContent = pct(v.reserveRate);
    $("budgetBadge").textContent = interpretation.badge;
    $("decisionHeadline").textContent = interpretation.headline;
    $("decisionText").textContent = interpretation.text;
    $("nextStepText").textContent = interpretation.next;

    $("breakdownBody").innerHTML = [
      ["Krov a konstrukce", trussCost * v.regionFactor, "nosná část střechy"],
      ["Krytina", roofingCost * v.regionFactor, "viditelná vrstva a montáž"],
      ["Zateplení", insulationCost * v.regionFactor, "tepelný komfort a skladba"],
      ["Klempířské prvky", flashingsCost * v.regionFactor, "okapy, oplechování a detaily"],
      ["Členitost a přístup", (complexityBase + logisticsBase) * v.regionFactor, "prostupy, sklon, lešení a logistika"],
      ["Rezerva", reserveCost, "pro odchylky projektu a nabídky"],
    ]
      .map((row) => `<tr><td>${row[0]}</td><td>${money(row[1])}</td><td>${row[2]}</td></tr>`)
      .join("");

    updateHero(v, totalCost, reserveCost);
    ensureNextActions();
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
