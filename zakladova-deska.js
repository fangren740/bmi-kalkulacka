(() => {
  const ids = [
    "builtArea",
    "slabThickness",
    "groundType",
    "reinforcement",
    "earthworks",
    "insulationLevel",
    "drainage",
    "accessibility",
    "regionFactor",
    "reserveRate",
  ];

  const labels = {
    slabThickness: {
      standard: "běžná deska",
      thicker: "silnější deska",
      high: "náročná deska",
    },
    groundType: {
      easy: "dobré podloží",
      medium: "běžně náročné",
      hard: "náročné podloží",
    },
    earthworks: {
      easy: "jednodušší zemní práce",
      medium: "běžné zemní práce",
      hard: "složitější zemní práce",
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

  const form = $("foundationForm");
  const resetBtn = $("resetBtn");

  function values() {
    return Object.fromEntries(
      ids.map((id) => {
        const element = $(id);
        return [id, element.tagName === "SELECT" ? element.value : Number(element.value) || 0];
      }),
    );
  }

  function baseRate() {
    return 7600;
  }

  function thicknessMultiplier(type) {
    if (type === "thicker") return 1.1;
    if (type === "high") return 1.2;
    return 1;
  }

  function groundMultiplier(type) {
    if (type === "medium") return 1.08;
    if (type === "hard") return 1.18;
    return 1;
  }

  function reinforcementMultiplier(type) {
    if (type === "basic") return 0.96;
    if (type === "higher") return 1.12;
    return 1;
  }

  function earthworksMultiplier(type) {
    if (type === "medium") return 1.1;
    if (type === "hard") return 1.22;
    return 1;
  }

  function insulationMultiplier(type) {
    if (type === "basic") return 0.95;
    if (type === "higher") return 1.12;
    return 1;
  }

  function drainageCost(type, area) {
    return type === "yes" ? area * 550 : 0;
  }

  function accessMultiplier(type) {
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
        <a href="kalkulacka-ceny-strechy.html">Dopočítat střechu domu</a>
        <a href="kalkulacka-orientacni-ceny-stavby-domu.html">Spočítat celkovou cenu stavby</a>
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
      sub.textContent = `Model počítá ${labels.slabThickness[v.slabThickness]} pro ${labels.groundType[v.groundType]}. Největší pozornost věnujte zemině, izolacím, drenážím a prostupům.`;
    }
    if (metrics[0]) metrics[0].textContent = `${v.builtArea} m²`;
    if (metrics[1]) metrics[1].textContent = labels.groundType[v.groundType];
    if (metrics[2]) metrics[2].textContent = pct(v.reserveRate);
    if (product) product.textContent = `${labels.earthworks[v.earthworks]} · rezerva ${v.reserveRate}%`;
  }

  function decide(v, pricePerM2, totalCost) {
    const riskFactors = [
      v.slabThickness === "high",
      v.groundType === "hard",
      v.earthworks === "hard",
      v.reinforcement === "higher",
      v.insulationLevel === "higher",
      v.drainage === "yes",
      v.accessibility === "hard",
    ].filter(Boolean).length;

    if (riskFactors >= 3 || pricePerM2 > 15000) {
      return {
        badge: "Náročnější deska",
        headline: "Největší riziko je v podloží a přípravě pozemku",
        text: `Orientační cena základové desky vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². Výsledek už počítá s náročnější kombinací podloží, zemních prací, vrstev nebo drenáží, takže je dobré mít projekt a nabídku rozepsané opravdu položkově.`,
        next: "Další krok: ověřte geologii, skrývku, hutnění, drenáže, prostupy a odvoz zeminy. Potom navazujte hrubou stavbou a celkovou cenou domu.",
      };
    }

    if (riskFactors >= 1 || pricePerM2 > 11500) {
      return {
        badge: "Běžná až vyšší deska",
        headline: "Výsledek je použitelný, ale hlídejte rozsah prací",
        text: `Orientační cena základové desky vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². Vypadá jako realistický odhad, pokud jsou v ceně zahrnuté zemní práce, beton, výztuž, izolace, prostupy, doprava a přiměřená rezerva.`,
        next: "Další krok: porovnejte, zda nabídka zahrnuje stejné vrstvy a stejný rozsah zemních prací. Pak dopočítejte hrubou stavbu a střechu.",
      };
    }

    return {
      badge: "Klidnější scénář",
      headline: "Rozpočet působí jako běžný první odhad",
      text: `Orientační cena základové desky vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². To je klidnější scénář pro menší riziko podloží a jednodušší zemní práce. I tak berte výsledek jako vodítko, ne jako položkový rozpočet.`,
      next: "Další krok: ověřte skladbu desky v projektu a navazujte výpočtem hrubé stavby nebo celkové ceny domu.",
    };
  }

  function render() {
    const v = values();
    v.builtArea = Math.max(1, Number(v.builtArea) || 1);
    v.regionFactor = Number(v.regionFactor) || 1;
    v.reserveRate = Number(v.reserveRate) || 0;

    const concreteAndStructure =
      v.builtArea *
      baseRate() *
      thicknessMultiplier(v.slabThickness) *
      groundMultiplier(v.groundType) *
      accessMultiplier(v.accessibility);
    const earthworksCost =
      v.builtArea * 1100 * earthworksMultiplier(v.earthworks) * groundMultiplier(v.groundType);
    const technicalCost =
      v.builtArea *
      950 *
      reinforcementMultiplier(v.reinforcement) *
      insulationMultiplier(v.insulationLevel);
    const drainage = drainageCost(v.drainage, v.builtArea);
    const baseCost = (concreteAndStructure + earthworksCost + technicalCost + drainage) * v.regionFactor;
    const reserveCost = baseCost * (v.reserveRate / 100);
    const totalCost = baseCost + reserveCost;
    const pricePerM2 = totalCost / v.builtArea;
    const interpretation = decide(v, pricePerM2, totalCost);

    $("totalCost").textContent = money(totalCost);
    $("pricePerM2").textContent = money(pricePerM2);
    $("baseCost").textContent = money(baseCost);
    $("reserveCost").textContent = money(reserveCost);
    $("summaryArea").textContent = `${v.builtArea} m²`;
    $("summaryCore").textContent = money(concreteAndStructure * v.regionFactor);
    $("summaryEarthworks").textContent = money(earthworksCost * v.regionFactor);
    $("summaryTechnical").textContent = money(technicalCost * v.regionFactor);
    $("summaryExtras").textContent = money(drainage * v.regionFactor);
    $("summaryReserveShare").textContent = pct(v.reserveRate);
    $("budgetBadge").textContent = interpretation.badge;
    $("decisionHeadline").textContent = interpretation.headline;
    $("decisionText").textContent = interpretation.text;
    $("nextStepText").textContent = interpretation.next;

    $("breakdownBody").innerHTML = [
      ["Betonová a konstrukční část", concreteAndStructure * v.regionFactor, "deska, tloušťka a zatížení"],
      ["Zemní práce a podklad", earthworksCost * v.regionFactor, "skrývka, výkopy, hutnění"],
      ["Výztuž, izolace a vrstvy", technicalCost * v.regionFactor, "technická skladba desky"],
      ["Drenáže a odvodnění", drainage * v.regionFactor, "volitelná ochrana pozemku"],
      ["Rezerva", reserveCost, "pro odchylky projektu a pozemku"],
    ]
      .filter((row) => row[1] > 0)
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
