(() => {
  const ids = [
    "area",
    "lineLength",
    "scope",
    "quality",
    "appliances",
    "worktop",
    "water",
    "electro",
    "floorWalls",
    "layoutChanges",
    "reserveRate",
    "regionFactor"
  ];
  const $ = (id) => document.getElementById(id);
  const form = $("kitchenForm");
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

  function ensureNextActions() {
    const summary = document.querySelector(".result-panel .rv-output-summary");
    if (!summary || document.querySelector(".rv-reno-next-actions")) return;
    summary.insertAdjacentHTML(
      "afterend",
      `<div class="rv-reno-next-actions" aria-label="Co spočítat dál">
        <strong>Co spočítat dál</strong>
        <a href="kalkulacka-ceny-rekonstrukce-koupelny.html">Porovnat rekonstrukci koupelny</a>
        <a href="kalkulacka-nakladu-na-rekonstrukci-bytu-domu.html">Spočítat celou rekonstrukci</a>
        <a href="kalkulacka-celkove-ceny-nemovitosti.html">Započítat rekonstrukci do ceny nemovitosti</a>
      </div>`
    );
  }

  function scopeBase(scope, area) {
    return area * ({ light: 3500, medium: 7000, full: 12000 }[scope] || 7000);
  }

  function lineRate(quality) {
    if (quality === "basic") return 28000;
    if (quality === "higher") return 62000;
    return 42000;
  }

  function appliancesCost(type) {
    if (type === "reuse") return 15000;
    if (type === "higher") return 120000;
    return 65000;
  }

  function worktopCost(type, length) {
    if (type === "basic") return length * 3500;
    if (type === "higher") return length * 14000;
    return length * 7000;
  }

  function waterCost(type) {
    if (type === "partial") return 18000;
    if (type === "full") return 42000;
    return 0;
  }

  function electroCost(type, length) {
    if (type === "partial") return 18000 + length * 1800;
    if (type === "full") return 38000 + length * 2800;
    return 0;
  }

  function floorWallsCost(type, area) {
    if (type === "partial") return area * 1800;
    if (type === "full") return area * 4200;
    return 0;
  }

  function layoutCost(type) {
    return type === "yes" ? 45000 : 0;
  }

  function scopeLabel(scope) {
    if (scope === "light") return "Lehčí modernizace";
    if (scope === "full") return "Kompletní rekonstrukce";
    return "Střední rekonstrukce";
  }

  function calculate(v) {
    const area = Number(v.area);
    const lineLength = Number(v.lineLength);
    const reserveRate = Number(v.reserveRate);
    const regionFactor = Number(v.regionFactor);
    const baseBuild = scopeBase(v.scope, area);
    const line = lineLength * lineRate(v.quality);
    const appliances = appliancesCost(v.appliances);
    const worktop = worktopCost(v.worktop, lineLength);
    const water = waterCost(v.water);
    const electro = electroCost(v.electro, lineLength);
    const floor = floorWallsCost(v.floorWalls, area);
    const layout = layoutCost(v.layoutChanges);
    const kitchenCore = line + appliances + worktop;
    const technical = baseBuild + water + electro + floor + layout;
    const baseCost = (kitchenCore + technical) * regionFactor;
    const reserveCost = baseCost * (reserveRate / 100);
    const total = baseCost + reserveCost;
    const perMeter = total / Math.max(1, lineLength);
    return {
      ...v,
      area,
      lineLength,
      reserveRate,
      regionFactor,
      baseBuild,
      line,
      appliances,
      worktop,
      water,
      electro,
      floor,
      layout,
      kitchenCore,
      technical,
      baseCost,
      reserveCost,
      total,
      perMeter
    };
  }

  function interpretation(result) {
    if (result.electro > 35000 || result.water > 30000 || result.layout > 0) {
      return {
        badge: "Technicky náročnější kuchyně",
        title: "Rozpočet netáhne jen linka, ale i rozvody",
        text: `Odhad kuchyně vychází na ${money(result.total)}. U této varianty je důležité ověřit elektro okruhy, vodu, odpad, dispozici a napojení spotřebičů.`,
        next: "Při porovnávání nabídek chtějte rozdělit linku, spotřebiče, pracovní desku, montáž a technické práce zvlášť."
      };
    }
    if (result.kitchenCore / Math.max(1, result.baseCost) > 0.7) {
      return {
        badge: "Cenu táhne vybavení",
        title: "Hlavní položka je linka, deska a spotřebiče",
        text: `Cena vychází na ${money(result.total)}. Většina rozpočtu je v samotné kuchyňské sestavě, spotřebičích a pracovní desce.`,
        next: "Pokud chcete šetřit, porovnejte materiál desky, kování, spotřebiče a počet atypických prvků dřív než jen hledat levnější montáž."
      };
    }
    return {
      badge: "Střední rekonstrukce kuchyně",
      title: "Výsledek působí jako použitelný první rozpočet",
      text: `Orientační cena kuchyně vychází ${money(result.total)}, tedy ${money(result.perMeter)} za běžný metr linky. Sledujte hlavně rozsah dodávky.`,
      next: "Další krok je ověřit, zda nabídka obsahuje montáž, zaměření, dopravu, spotřebiče, rozvody, pracovní desku, osvětlení a rezervu."
    };
  }

  function updateHero(result, read) {
    const number = document.querySelector(".hero-visual .reno-number");
    if (number) number.textContent = money(result.total);
    const sub = document.querySelector(".hero-visual .reno-sub");
    if (sub) sub.textContent = read.text;
    document.querySelectorAll(".hero-visual .reno-metrics b").forEach((element, index) => {
      const valuesForHero = [`${num(result.lineLength)} bm`, result.quality === "higher" ? "vyšší" : result.quality === "basic" ? "základní" : "běžný", pct(result.reserveRate)];
      element.textContent = valuesForHero[index] || element.textContent;
    });
  }

  function render() {
    const result = calculate(values());
    const read = interpretation(result);
    setText("totalCost", money(result.total));
    setText("pricePerMeter", money(result.perMeter));
    setText("baseCost", money(result.baseCost));
    setText("reserveCost", money(result.reserveCost));
    setText("summaryArea", `${num(result.area)} m²`);
    setText("summaryLength", `${num(result.lineLength)} bm`);
    setText("summaryScope", scopeLabel(result.scope));
    setText("summaryKitchenCore", money(result.kitchenCore * result.regionFactor));
    setText("summaryTechnical", money(result.technical * result.regionFactor));
    setText("summaryReserveShare", pct(result.reserveRate));
    setText("budgetBadge", read.badge);
    setText("decisionHeadline", read.title);
    setText("decisionText", read.text);
    setText("nextStepText", read.next);
    const rows = [
      ["Stavební a montážní práce", result.baseBuild * result.regionFactor, "příprava"],
      ["Kuchyňská linka", result.line * result.regionFactor, "hlavní položka"],
      ["Spotřebiče", result.appliances * result.regionFactor, "výbava"],
      ["Pracovní deska", result.worktop * result.regionFactor, "materiál"],
      ["Rozvody vody a odpadu", result.water * result.regionFactor, "technika"],
      ["Elektroinstalace", result.electro * result.regionFactor, "technika"],
      ["Podlahy, omítky a malby", result.floor * result.regionFactor, "povrchy"],
      ["Změna dispozice", result.layout * result.regionFactor, "volitelně"],
      ["Rezerva", result.reserveCost, "bezpečnost"]
    ].filter((row) => row[1] > 0);
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
