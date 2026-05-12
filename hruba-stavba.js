(() => {
  const ids = [
    "usableArea",
    "houseType",
    "constructionType",
    "floors",
    "roofType",
    "basement",
    "openingsStandard",
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
    construction: {
      masonry: "zděná stavba",
      mixed: "kombinovaná varianta",
      premium: "náročnější konstrukce",
    },
    roof: {
      simple: "jednoduchá střecha",
      medium: "běžná střecha",
      complex: "členitá střecha",
    },
    basement: {
      none: "bez sklepa",
      partial: "částečný sklep",
      full: "plný sklep",
    },
  };

  const shortLabels = {
    houseType: {
      compact: "kompaktní",
      storey: "patrový",
      bungalow: "bungalov",
    },
    basement: {
      none: "bez sklepa",
      partial: "část sklepa",
      full: "plný sklep",
    },
  };

  const $ = (id) => document.getElementById(id);
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);
  const numberFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const pct = (value) => `${numberFormat.format(value)} %`;
  const compactMoney = (value) =>
    value >= 1000000 ? `${numberFormat.format(value / 1000000)} mil. Kč` : money(value);

  const form = $("roughBuildForm");
  const resetBtn = $("resetBtn");

  function values() {
    return Object.fromEntries(
      ids.map((id) => {
        const element = $(id);
        return [id, element.tagName === "SELECT" ? element.value : Number(element.value) || 0];
      }),
    );
  }

  function baseRate(type) {
    if (type === "compact") return 19000;
    if (type === "bungalow") return 23500;
    return 21500;
  }

  function constructionMultiplier(type) {
    if (type === "mixed") return 1.06;
    if (type === "premium") return 1.14;
    return 1;
  }

  function floorMultiplier(floors) {
    return Number(floors) === 2 ? 1.03 : 1;
  }

  function roofMultiplier(type) {
    if (type === "medium") return 1.07;
    if (type === "complex") return 1.15;
    return 1;
  }

  function basementCost(type, area) {
    if (type === "partial") return area * 4800;
    if (type === "full") return area * 9800;
    return 0;
  }

  function openingsMultiplier(type) {
    if (type === "larger") return 1.04;
    if (type === "premium") return 1.09;
    return 1;
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
        <a href="kalkulacka-orientacni-ceny-stavby-domu.html">Spočítat celou stavbu domu</a>
        <a href="kalkulacka-ceny-zakladove-desky.html">Zkontrolovat základovou desku</a>
        <a href="kalkulacka-ceny-strechy.html">Dopočítat střechu samostatně</a>
      </div>`,
    );
  }

  function decide(v, totalCost, pricePerM2) {
    const riskFactors = [
      v.constructionType === "premium",
      v.roofType === "complex",
      v.basement !== "none",
      v.openingsStandard === "premium",
      v.landComplexity === "hard",
      Number(v.reserveRate) < 10,
    ].filter(Boolean).length;

    if (riskFactors >= 3 || totalCost > 5600000 || pricePerM2 > 38000) {
      return {
        badge: "Náročnější hrubá stavba",
        headline: "Hrubá stavba má zvýšenou technickou náročnost",
        text: `Orientační cena hrubé stavby vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². Výsledek táhne hlavně konstrukce, střecha, sklep, větší otvory nebo pozemek. U takového scénáře je potřeba přesně vědět, co nabídka zahrnuje.`,
        next: "Další krok: ověřte zvlášť střechu, základovou desku, stropy, překlady, izolace a dopravu. Potom dopočítejte celou cenu stavby domu.",
      };
    }

    if (riskFactors >= 1 || totalCost > 3600000 || pricePerM2 > 26000) {
      return {
        badge: "Běžná až vyšší hrubá stavba",
        headline: "Výsledek je použitelný pro srovnání nabídek",
        text: `Orientační cena hrubé stavby vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². Je to realistický první odhad, pokud nabídka jasně popisuje zdivo, stropy, střechu, otvory, zemní návaznosti a rezervu.`,
        next: "Další krok: porovnejte nabídky položkově a samostatně si ověřte základovou desku a střechu.",
      };
    }

    return {
      badge: "Klidnější hrubá stavba",
      headline: "Rozpočet působí jako jednodušší scénář",
      text: `Orientační cena hrubé stavby vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². To je klidnější varianta typicky bez sklepa, s jednodušší střechou a běžnou konstrukcí. Výsledek ale stále neznamená cenu celého domu.`,
      next: "Další krok: dopočítejte celou stavbu domu, aby bylo vidět, kolik přidají technologie, dokončení, povrchy a vybavení.",
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
      sub.textContent = `${labels.construction[v.constructionType]} · ${labels.roof[v.roofType]} · ${labels.basement[v.basement]}. Hrubou stavbu vždy porovnávejte podle rozsahu, ne jen podle ceny.`;
    }
    if (metrics[0]) metrics[0].textContent = `${v.usableArea} m²`;
    if (metrics[1]) metrics[1].textContent = labels.construction[v.constructionType];
    if (metrics[2]) metrics[2].textContent = pct(v.reserveRate);
    if (product) product.textContent = `${shortLabels.houseType[v.houseType]} · ${shortLabels.basement[v.basement]}`;
    if (strip[0]) strip[0].textContent = "zdivo";
    if (strip[1]) strip[1].textContent = "stropy";
    if (strip[2]) strip[2].textContent = interpretation.badge.replace(" hrubá stavba", "");
  }

  function render() {
    const v = values();
    v.usableArea = Math.max(1, Number(v.usableArea) || 1);
    v.floors = Number(v.floors) || 1;
    v.regionFactor = Number(v.regionFactor) || 1;
    v.reserveRate = Number(v.reserveRate) || 0;

    const areaBase = v.usableArea * baseRate(v.houseType);
    const coreMultiplier =
      constructionMultiplier(v.constructionType) *
      floorMultiplier(v.floors) *
      roofMultiplier(v.roofType) *
      openingsMultiplier(v.openingsStandard) *
      landMultiplier(v.landComplexity);
    const coreCost = areaBase * coreMultiplier;
    const basement = basementCost(v.basement, v.usableArea);
    const baseCost = (coreCost + basement) * v.regionFactor;
    const reserveCost = baseCost * (v.reserveRate / 100);
    const totalCost = baseCost + reserveCost;
    const pricePerM2 = totalCost / v.usableArea;
    const interpretation = decide(v, totalCost, pricePerM2);
    const roofShare = coreCost * 0.22;
    const wallShare = coreCost * 0.54;
    const slabShare = coreCost * 0.24;

    $("totalCost").textContent = money(totalCost);
    $("pricePerM2").textContent = money(pricePerM2);
    $("baseCost").textContent = money(baseCost);
    $("reserveCost").textContent = money(reserveCost);
    $("summaryArea").textContent = `${v.usableArea} m²`;
    $("summaryType").textContent = labels.houseType[v.houseType];
    $("summaryConstruction").textContent = labels.construction[v.constructionType];
    $("summaryCore").textContent = money(coreCost * v.regionFactor);
    $("summaryExtras").textContent = money(basement * v.regionFactor);
    $("summaryReserveShare").textContent = pct(v.reserveRate);
    $("budgetBadge").textContent = interpretation.badge;
    $("decisionHeadline").textContent = interpretation.headline;
    $("decisionText").textContent = interpretation.text;
    $("nextStepText").textContent = interpretation.next;

    $("breakdownBody").innerHTML = [
      ["Nosné konstrukce a zdivo", wallShare * v.regionFactor, "zdivo, překlady, nosné části"],
      ["Stropy a hlavní části", slabShare * v.regionFactor, "stropy a konstrukční návaznosti"],
      ["Střešní konstrukce a krytina", roofShare * v.regionFactor, "střecha v rozsahu hrubé stavby"],
      ["Podsklepení", basement * v.regionFactor, "volitelná náročná část"],
      ["Rezerva", reserveCost, "bezpečnost rozpočtu"],
    ]
      .filter((row) => row[1] > 0)
      .map((row) => `<tr><td>${row[0]}</td><td>${money(row[1])}</td><td>${row[2]}</td></tr>`)
      .join("");

    updateHero(v, { totalCost }, interpretation);
    ensureNextActions();
  }

  if (!form) return;
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
