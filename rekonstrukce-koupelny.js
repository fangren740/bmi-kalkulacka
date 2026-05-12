(() => {
  const ids = [
    "area",
    "scope",
    "quality",
    "layoutChanges",
    "water",
    "electro",
    "showerBath",
    "toilet",
    "heating",
    "furniture",
    "reserveRate",
    "regionFactor"
  ];
  const $ = (id) => document.getElementById(id);
  const form = $("bathroomForm");
  const resetBtn = $("resetBtn");
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(
      Number.isFinite(value) ? value : 0
    );
  const pct = (value) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(value)} %`;
  const num = (value, digits = 1) =>
    new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);

  if (!form) return;

  function values() {
    return Object.fromEntries(
      ids.map((id) => {
        const element = $(id);
        return [id, element.tagName === "SELECT" ? element.value : Number(element.value) || 0];
      })
    );
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function label(map, key) {
    return map[key] || key;
  }

  function ensureNextActions() {
    const summary = document.querySelector(".result-panel .rv-output-summary");
    if (!summary || document.querySelector(".rv-reno-next-actions")) return;
    summary.insertAdjacentHTML(
      "afterend",
      `<div class="rv-reno-next-actions" aria-label="Co spočítat dál">
        <strong>Co spočítat dál</strong>
        <a href="kalkulacka-ceny-rekonstrukce-kuchyne.html">Porovnat rekonstrukci kuchyně</a>
        <a href="kalkulacka-nakladu-na-rekonstrukci-bytu-domu.html">Spočítat celou rekonstrukci</a>
        <a href="mesicni-naklady-na-bydleni-kalkulacka.html">Ověřit měsíční náklady bydlení</a>
      </div>`
    );
  }

  function getBaseRate(scope) {
    return { light: 18000, medium: 28000, full: 39000 }[scope] || 28000;
  }

  function getQualityMultiplier(quality) {
    if (quality === "basic") return 0.9;
    if (quality === "higher") return 1.18;
    return 1;
  }

  function getLayoutCost(layoutChanges) {
    return layoutChanges === "yes" ? 35000 : 0;
  }

  function getWaterCost(type, area) {
    if (type === "partial") return area * 4500;
    if (type === "full") return area * 7800;
    return 0;
  }

  function getElectroCost(type, area) {
    if (type === "partial") return area * 2200;
    if (type === "full") return area * 4200;
    return 0;
  }

  function getSanitaryCost(type) {
    if (type === "bath") return 38000;
    if (type === "both") return 72000;
    return 30000;
  }

  function getToiletCost(toilet) {
    return toilet === "yes" ? 18000 : 0;
  }

  function getHeatingCost(type, area) {
    if (type === "ladder") return 12000;
    if (type === "floor") return area * 2800;
    if (type === "both") return 12000 + area * 2800;
    return 0;
  }

  function getFurnitureCost(type) {
    if (type === "basic") return 12000;
    if (type === "higher") return 42000;
    return 24000;
  }

  function calculate(v) {
    const area = Number(v.area);
    const reserveRate = Number(v.reserveRate);
    const regionFactor = Number(v.regionFactor);
    const coreBaseCost = area * getBaseRate(v.scope) * getQualityMultiplier(v.quality);
    const layoutCost = getLayoutCost(v.layoutChanges);
    const waterCost = getWaterCost(v.water, area);
    const electroCost = getElectroCost(v.electro, area);
    const sanitaryCost = getSanitaryCost(v.showerBath);
    const toiletCost = getToiletCost(v.toilet);
    const heatingCost = getHeatingCost(v.heating, area);
    const furnitureCost = getFurnitureCost(v.furniture);
    const technicalCost = layoutCost + waterCost + electroCost;
    const sanitaryAndEquipment = sanitaryCost + toiletCost + heatingCost + furnitureCost;
    const baseCost = (coreBaseCost + technicalCost + sanitaryAndEquipment) * regionFactor;
    const reserveCost = baseCost * (reserveRate / 100);
    const totalCost = baseCost + reserveCost;
    const pricePerM2 = totalCost / Math.max(1, area);
    return {
      ...v,
      area,
      reserveRate,
      regionFactor,
      coreBaseCost,
      layoutCost,
      waterCost,
      electroCost,
      sanitaryCost,
      toiletCost,
      heatingCost,
      furnitureCost,
      technicalCost,
      sanitaryAndEquipment,
      baseCost,
      reserveCost,
      totalCost,
      pricePerM2
    };
  }

  function interpretation(result) {
    if (result.layoutCost > 0 || result.water === "full" || result.electro === "full") {
      return {
        badge: "Technicky náročnější koupelna",
        title: "Rozpočet táhnou rozvody a dispozice",
        text: `Odhad vychází na ${money(result.totalCost)}. U této varianty je klíčové ověřit vodu, odpady, elektro, hydroizolaci a návaznosti po bourání.`,
        next: "Při poptávce chtějte rozepsat technické práce zvlášť. Právě tady se často objeví rozdíl mezi levnou a realistickou nabídkou."
      };
    }
    if (result.pricePerM2 > 70000) {
      return {
        badge: "Vyšší rozpočet na m²",
        title: "Cena za metr je vyšší kvůli vybavení a detailům",
        text: `Koupelna vychází na ${money(result.pricePerM2)} za m². To může být v pořádku u menší místnosti s kvalitnější sanitou, topením nebo nábytkem.`,
        next: "Zkontrolujte, jestli dražší položky opravdu zvyšují komfort nebo životnost, ne jen cenu nabídky."
      };
    }
    return {
      badge: "Běžný rekonstrukční rozsah",
      title: "Výsledek působí jako realistický první odhad",
      text: `Rekonstrukce koupelny vychází orientačně ${money(result.totalCost)}, tedy ${money(result.pricePerM2)} za m². Největší pozornost věnujte rozvodům, hydroizolaci a rozsahu montáže.`,
      next: "Další krok je porovnat konkrétní nabídky podle stejného rozsahu: bourání, odvoz, hydroizolace, rozvody, sanita, obklady, montáž a rezerva."
    };
  }

  function updateHero(result, read) {
    const number = document.querySelector(".hero-visual .reno-number");
    if (number) number.textContent = money(result.totalCost);
    const sub = document.querySelector(".hero-visual .reno-sub");
    if (sub) sub.textContent = read.text;
    document.querySelectorAll(".hero-visual .reno-metrics b").forEach((element, index) => {
      const valuesForHero = [
        `${num(result.area)} m²`,
        label({ light: "lehčí", medium: "běžný", full: "kompletní" }, result.scope),
        pct(result.reserveRate)
      ];
      element.textContent = valuesForHero[index] || element.textContent;
    });
  }

  function render() {
    const result = calculate(values());
    const read = interpretation(result);
    setText("totalCost", money(result.totalCost));
    setText("pricePerM2", money(result.pricePerM2));
    setText("baseCost", money(result.baseCost));
    setText("reserveCost", money(result.reserveCost));
    setText("summaryArea", `${num(result.area)} m²`);
    setText("summaryScope", label({ light: "Lehčí obnova", medium: "Běžná rekonstrukce", full: "Kompletní rekonstrukce" }, result.scope));
    setText("summaryQuality", label({ basic: "Základní", standard: "Běžný", higher: "Vyšší" }, result.quality));
    setText("summarySanitary", money(result.sanitaryAndEquipment));
    setText("summaryTechnical", money(result.technicalCost));
    setText("summaryReserveShare", pct(result.reserveRate));
    setText("budgetBadge", read.badge);
    setText("decisionHeadline", read.title);
    setText("decisionText", read.text);
    setText("nextStepText", read.next);
    const rows = [
      ["Základní práce a obklady", result.coreBaseCost, "plocha"],
      ["Změna dispozice", result.layoutCost, "příprava"],
      ["Voda a odpady", result.waterCost, "rozvody"],
      ["Elektroinstalace", result.electroCost, "technika"],
      ["Sanita", result.sanitaryCost, "sprcha/vana"],
      ["WC", result.toiletCost, "zařízení"],
      ["Topení", result.heatingCost, "komfort"],
      ["Nábytek", result.furnitureCost, "vybavení"],
      ["Rezerva", result.reserveCost, "bezpečnost"]
    ];
    const body = $("breakdownBody");
    if (body) {
      body.innerHTML = rows.map((row) => `<tr><td>${row[0]}</td><td>${money(row[1])}</td><td>${row[2]}</td></tr>`).join("");
    }
    updateHero(result, read);
  }

  ensureNextActions();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  ids.forEach((id) => {
    const element = $(id);
    element.addEventListener("input", render);
    element.addEventListener("change", render);
  });
  resetBtn?.addEventListener("click", () => {
    form.reset();
    render();
  });
  render();
})();
