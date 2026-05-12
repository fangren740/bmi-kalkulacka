(() => {
  const ids = [
    "usableArea",
    "houseType",
    "floors",
    "roofType",
    "buildStandard",
    "completionStage",
    "garage",
    "landComplexity",
    "regionFactor",
    "reserveRate",
  ];

  const labels = {
    houseType: {
      compact: "kompaktní dům",
      storey: "patrový dům",
      bungalow: "bungalov",
    },
    stage: {
      rough: "hrubá stavba",
      shell: "dům k dokončení",
      turnkey: "dům na klíč",
    },
    standard: {
      basic: "úspornější standard",
      standard: "běžný standard",
      higher: "vyšší standard",
    },
    roof: {
      simple: "jednoduchá střecha",
      medium: "běžná střecha",
      complex: "členitá střecha",
    },
  };

  const shortLabels = {
    houseType: {
      compact: "kompaktní",
      storey: "patrový",
      bungalow: "bungalov",
    },
    roof: {
      simple: "jednoduchá",
      medium: "běžná střecha",
      complex: "členitá střecha",
    },
  };

  const $ = (id) => document.getElementById(id);
  const moneyFormat = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  });
  const numberFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const money = (value) => moneyFormat.format(Number.isFinite(value) ? value : 0);
  const pct = (value) => `${numberFormat.format(value)} %`;
  const compactMoney = (value) =>
    value >= 1000000 ? `${numberFormat.format(value / 1000000)} mil. Kč` : money(value);

  const form = $("houseBuildForm");
  const resetBtn = $("resetBtn");

  function text(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function values() {
    return Object.fromEntries(
      ids.map((id) => {
        const element = $(id);
        return [id, element.tagName === "SELECT" ? element.value : Number(element.value) || 0];
      }),
    );
  }

  function baseRate(type) {
    if (type === "compact") return 38000;
    if (type === "bungalow") return 46000;
    return 42000;
  }

  function floorMultiplier(floors) {
    return Number(floors) === 2 ? 1.03 : 1;
  }

  function roofMultiplier(type) {
    if (type === "medium") return 1.06;
    if (type === "complex") return 1.13;
    return 1;
  }

  function standardMultiplier(type) {
    if (type === "basic") return 0.92;
    if (type === "higher") return 1.18;
    return 1;
  }

  function stageMultiplier(type) {
    if (type === "rough") return 0.54;
    if (type === "shell") return 0.78;
    return 1;
  }

  function garageCost(type) {
    if (type === "carport") return 180000;
    if (type === "garage") return 420000;
    return 0;
  }

  function landMultiplier(type) {
    if (type === "medium") return 1.05;
    if (type === "hard") return 1.12;
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
        <a href="kalkulacka-ceny-hrube-stavby-domu.html">Rozpadnout hrubou stavbu</a>
        <a href="kalkulacka-ceny-zakladove-desky.html">Ověřit základovou desku</a>
        <a href="kalkulacka-ceny-strechy.html">Dopočítat střechu</a>
        <a href="muzu-si-dovolit-bydleni.html">Ověřit dostupnost bydlení</a>
      </div>`,
    );
  }

  function decide(v, totalCost, pricePerM2) {
    const riskFactors = [
      v.buildStandard === "higher",
      v.completionStage === "turnkey",
      v.roofType === "complex",
      v.houseType === "bungalow",
      v.landComplexity === "hard",
      v.garage === "garage",
      Number(v.reserveRate) < 10,
    ].filter(Boolean).length;

    if (riskFactors >= 4 || totalCost > 9500000 || pricePerM2 > 68000) {
      return {
        badge: "Náročnější rozpočet stavby",
        headline: "Rozpočet už potřebuje detailní položkový rozpad",
        text: `Orientační cena domu vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². To už je citlivější scénář, kde rozhoduje standard, rozsah dokončení, střecha, pozemek a rezerva. Bez položkového rozpočtu se nabídky budou porovnávat těžko.`,
        next: "Další krok: rozdělte cenu na základovou desku, hrubou stavbu, střechu, technologie, dokončovací práce a rezervu. Potom ověřte, jestli plán sedí na financování.",
      };
    }

    if (riskFactors >= 2 || totalCost > 6200000 || pricePerM2 > 48000) {
      return {
        badge: "Běžný až vyšší rozpočet",
        headline: "Výsledek je realistický, ale hlídejte rozsah dodávky",
        text: `Orientační cena domu vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². Je to použitelný první rámec, pokud víte, zda jde o hrubou stavbu, dům k dokončení nebo dům na klíč a co přesně je v ceně zahrnuté.`,
        next: "Další krok: porovnejte hrubou stavbu, střechu a základovou desku zvlášť. U nabídky si nechte vypsat, co v ceně není.",
      };
    }

    return {
      badge: "Klidnější první odhad",
      headline: "Rozpočet působí jako klidnější scénář",
      text: `Orientační cena domu vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². Výsledek je příznivější, typicky díky menší ploše, jednoduššímu tvaru nebo nižší fázi dokončení. I tak počítejte s rezervou a položkami mimo samotnou stavbu.`,
      next: "Další krok: ověřte, zda v rozpočtu nechybí projekt, přípojky, základová deska, střecha, dokončovací práce a rezerva po nastěhování.",
    };
  }

  function updateHero(v, result, interpretation) {
    const hero = document.querySelector(".hero-visual");
    if (!hero) return;

    const number = hero.querySelector(".reno-number");
    const sub = hero.querySelector(".reno-sub");
    const metrics = hero.querySelectorAll(".reno-metrics b");
    const product = hero.querySelector(".product-card strong");
    const strip = hero.querySelectorAll(".hero-mini-strip span");

    if (number) number.textContent = compactMoney(result.totalCost);
    if (sub) {
      sub.textContent = `${labels.stage[v.completionStage]} · ${labels.standard[v.buildStandard]} · ${money(result.pricePerM2)} za m². Výsledek berte jako rámec pro nabídky, financování a rezervu.`;
    }
    if (metrics[0]) metrics[0].textContent = `${v.usableArea} m²`;
    if (metrics[1]) metrics[1].textContent = labels.stage[v.completionStage];
    if (metrics[2]) metrics[2].textContent = pct(v.reserveRate);
    if (product) product.textContent = `${shortLabels.houseType[v.houseType]} · ${shortLabels.roof[v.roofType]}`;
    if (strip[0]) strip[0].textContent = "základy";
    if (strip[1]) strip[1].textContent = "hrubá stavba";
    if (strip[2]) strip[2].textContent = interpretation.badge.replace(" rozpočet", "");
  }

  function render() {
    const v = values();
    v.usableArea = Math.max(1, Number(v.usableArea) || 1);
    v.floors = Number(v.floors) || 1;
    v.regionFactor = Number(v.regionFactor) || 1;
    v.reserveRate = Number(v.reserveRate) || 0;

    const areaBase = v.usableArea * baseRate(v.houseType);
    const coreCost =
      areaBase *
      floorMultiplier(v.floors) *
      roofMultiplier(v.roofType) *
      standardMultiplier(v.buildStandard) *
      stageMultiplier(v.completionStage) *
      landMultiplier(v.landComplexity);
    const garage = garageCost(v.garage);
    const baseCost = (coreCost + garage) * v.regionFactor;
    const reserveCost = baseCost * (v.reserveRate / 100);
    const totalCost = baseCost + reserveCost;
    const pricePerM2 = totalCost / v.usableArea;
    const finishGap = Math.max(0, v.usableArea * baseRate(v.houseType) * (1 - stageMultiplier(v.completionStage)) * v.regionFactor);
    const interpretation = decide(v, totalCost, pricePerM2);
    const result = { coreCost, garage, baseCost, reserveCost, totalCost, pricePerM2 };

    text("totalCost", money(totalCost));
    text("pricePerM2", money(pricePerM2));
    text("baseCost", money(baseCost));
    text("reserveCost", money(reserveCost));
    text("summaryArea", `${v.usableArea} m²`);
    text("summaryType", labels.houseType[v.houseType]);
    text("summaryStage", labels.stage[v.completionStage]);
    text("summaryCore", money(coreCost * v.regionFactor));
    text("summaryExtras", money(garage * v.regionFactor));
    text("summaryReserveShare", pct(v.reserveRate));
    text("budgetBadge", interpretation.badge);
    text("decisionHeadline", interpretation.headline);
    text("decisionText", interpretation.text);
    text("nextStepText", interpretation.next);

    const rows = [
      ["Stavební část podle plochy", coreCost * v.regionFactor, "typ domu, standard a fáze"],
      ["Garáž / přístřešek", garage * v.regionFactor, "volitelná položka"],
      ["Orientační rozdíl do domu na klíč", finishGap, "dokončení mimo zvolenou fázi"],
      ["Rezerva", reserveCost, "bezpečnost rozpočtu"],
    ].filter((row) => row[1] > 0);

    const body = $("breakdownBody");
    if (body) {
      body.innerHTML = rows
        .map((row) => `<tr><td>${row[0]}</td><td>${money(row[1])}</td><td>${row[2]}</td></tr>`)
        .join("");
    }

    updateHero(v, result, interpretation);
    ensureNextActions();
  }

  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });

  ids.forEach((id) => {
    $(id)?.addEventListener("input", render);
    $(id)?.addEventListener("change", render);
  });

  resetBtn?.addEventListener("click", () => {
    form.reset();
    render();
  });

  render();
})();
