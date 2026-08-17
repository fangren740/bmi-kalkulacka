(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const number = (value, fallback = 0) => {
    const n = Number(String(value ?? "").trim().replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : fallback;
  };
  const read = (id, fallback = 0, min = -Infinity, max = Infinity) => Math.min(max, Math.max(min, number($(id)?.value, fallback)));
  const money = (v) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(Number.isFinite(v) ? v : 0);
  const decimal = (v, d = 1) => new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: d, maximumFractionDigits: d }).format(Number.isFinite(v) ? v : 0);
  const scenarios = {
    simple: { label: "jednodušší realizace", low: 2500, high: 4000 },
    standard: { label: "standardní rodinný dům", low: 3500, high: 5000 },
    demanding: { label: "náročnější založení", low: 5000, high: 7000 }
  };

  function setText(id, value) { const el = $(id); if (el) el.textContent = value; }
  function selected(name, fallback) { return document.querySelector(`input[name="${name}"]:checked`)?.value || fallback; }

  function setupTabs() {
    const buttons = $$("[data-mode]");
    const panels = $$("[data-panel]");
    buttons.forEach((button) => button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      buttons.forEach((b) => { const active = b === button; b.classList.toggle("is-active", active); b.setAttribute("aria-selected", active ? "true" : "false"); });
      panels.forEach((panel) => { panel.hidden = panel.dataset.panel !== mode; });
      if (mode === "estimate") renderEstimate();
      if (mode === "material") renderMaterial();
      if (mode === "offer") renderOffer();
    }));
  }

  function renderEstimate() {
    const length = read("estimateLength", 12, 0, 100);
    const width = read("estimateWidth", 10, 0, 100);
    const area = length * width;
    const scenario = scenarios[selected("estimateScenario", "standard")] || scenarios.standard;
    const reserve = read("estimateReserve", 10, 0, 40);
    const budget = read("estimateBudget", 0, 0, 20000000);
    const low = area * scenario.low;
    const high = area * scenario.high;
    const mid = (low + high) / 2;
    const ceiling = high * (1 + reserve / 100);
    setText("estimateArea", `${decimal(area)} m²`);
    setText("estimateScenarioLabel", scenario.label);
    setText("estimateRange", area > 0 ? `${money(low)}–${money(high)}` : "Doplňte rozměry");
    setText("estimateUnit", `${money(scenario.low).replace(/\s?Kč/, "")}–${money(scenario.high).replace(/\s?Kč/, "")} Kč/m²`);
    setText("estimateMid", money(mid));
    setText("estimateCeiling", money(ceiling));
    if (!budget) {
      setText("estimateBudgetState", "nezadaný");
      setText("estimateHeadline", "Berete cenu jako radar, ne jako nabídku");
      setText("estimateMessage", "Veřejné ceníky se liší rozsahem i režimem DPH. Než dvě částky porovnáte, sjednoťte položky, které jsou skutečně zahrnuté.");
    } else if (budget < low) {
      setText("estimateBudgetState", `${money(low - budget)} pod pásmem`);
      setText("estimateHeadline", "Limit je pod spodní hranou pracovního pásma");
      setText("estimateMessage", "Neznamená to automaticky, že stavba nejde realizovat. Ověřte ale rozsah, DPH a hlavně to, zda v nabídce nechybí zemní práce, izolace, doprava nebo další položky.");
    } else if (budget <= high) {
      setText("estimateBudgetState", "uvnitř pásma");
      setText("estimateHeadline", "Limit leží uvnitř pracovního pásma");
      setText("estimateMessage", "Další přesnost už nezískáte dalším násobením m². Přepněte na projektový režim nebo audit nabídky a pracujte s konkrétním rozsahem.");
    } else {
      setText("estimateBudgetState", `${money(budget - high)} nad pásmem`);
      setText("estimateHeadline", "Limit je nad horní hranou pracovního pásma");
      setText("estimateMessage", "Vyšší rozpočet může být zcela oprávněný složitým podložím, svahovou parcelou, nadstandardní izolací nebo širším rozsahem. Porovnejte položky, ne jen Kč/m².");
    }
  }

  function materialValues() {
    const length = read("materialLength", 12, 0, 200);
    const width = read("materialWidth", 10, 0, 200);
    const slabThickness = read("slabThickness", 20, 0, 100) / 100;
    const reserve = read("concreteReserve", 5, 0, 25) / 100;
    const system = selected("foundationSystem", "raft");
    const stripLength = system === "strips" ? read("stripLength", 44, 0, 1000) : 0;
    const stripWidth = system === "strips" ? read("stripWidth", .5, 0, 5) : 0;
    const stripDepth = system === "strips" ? read("stripDepth", .5, 0, 5) : 0;
    const subbaseThickness = read("subbaseThickness", 20, 0, 200) / 100;
    const subbaseLoose = read("subbaseLooseFactor", 15, 0, 40) / 100;
    const steelKgM2 = read("steelKgM2", 0, 0, 100);
    const area = length * width;
    const perimeter = 2 * (length + width);
    const slab = area * slabThickness;
    const strips = stripLength * stripWidth * stripDepth;
    const concreteNet = slab + strips;
    const concreteOrder = concreteNet * (1 + reserve);
    const subbaseCompacted = area * subbaseThickness;
    const subbaseOrder = subbaseCompacted * (1 + subbaseLoose);
    const steel = steelKgM2 > 0 ? area * steelKgM2 : 0;
    const concretePrice = read("concretePrice", 0, 0, 50000);
    const subbasePrice = read("subbasePrice", 0, 0, 50000);
    const steelPrice = read("steelPrice", 0, 0, 500);
    const costParts = [concreteOrder * concretePrice, subbaseOrder * subbasePrice, steel * steelPrice].filter((x) => x > 0);
    const materialCost = costParts.reduce((a,b) => a+b, 0);
    return { system, area, perimeter, slab, strips, concreteOrder, subbaseCompacted, subbaseOrder, steel, materialCost, hasPrices: costParts.length > 0 };
  }

  function renderMaterial() {
    const v = materialValues();
    const strips = $("stripFields"); if (strips) strips.hidden = v.system !== "strips";
    setText("materialSystemLabel", v.system === "strips" ? "pasy + horní deska" : "nosná základová deska");
    setText("concreteOrder", `${decimal(v.concreteOrder)} m³`);
    setText("slabConcrete", `${decimal(v.slab)} m³`);
    setText("stripConcrete", `${decimal(v.strips)} m³`);
    setText("subbaseCompacted", `${decimal(v.subbaseCompacted)} m³`);
    setText("subbaseOrder", `${decimal(v.subbaseOrder)} m³`);
    setText("steelWeight", v.steel > 0 ? `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(v.steel)} kg` : "nezadaná");
    setText("materialPerimeter", `${decimal(v.perimeter)} m`);
    setText("materialCost", v.hasPrices ? money(v.materialCost) : "—");
    setText("materialCostNote", v.hasPrices ? "Součet zahrnuje pouze materiálové sazby, které jste vyplnili. Práce, doprava, čerpadlo, izolace a další služby nejsou dopočítány." : "Jednotkové ceny jsou volitelné. Výsledek nezahrnuje práci, techniku, dopravu, izolace ani služby.");
  }

  const scopeItems = ["Vytyčení a geodet","Skrývka a výkopy","Odvoz a uložení zeminy","Podklad a hutnění","Pasy / ztracené bednění","Beton a jeho doprava","Čerpadlo betonu","Výztuž a vázání","Hydro / radonová izolace","Tepelná izolace","Kanalizace a prostupy","Uzemnění","Drenáž / odvodnění","Úklid a předání"];
  function renderOffer() {
    const total = read("offerTotal", 500000, 0, 50000000);
    const area = read("offerArea", 120, 1, 5000);
    const scenario = scenarios[$("offerScenario")?.value || "standard"] || scenarios.standard;
    const ppm = area > 0 ? total / area : 0;
    const checked = $$("#scopeChecklist input:checked").map((x) => x.value);
    const missing = scopeItems.filter((x) => !checked.includes(x));
    const score = checked.length;
    setText("offerPriceM2", `${money(ppm).replace(/\s?Kč/, "")} Kč/m²`);
    let compare = "uvnitř pracovního veřejného pásma";
    if (ppm < scenario.low) compare = "pod pracovním veřejným pásmem";
    if (ppm > scenario.high) compare = "nad pracovním veřejným pásmem";
    setText("offerCompare", compare);
    setText("scopeScore", `${score} / ${scopeItems.length}`);
    const bar = $("scopeScoreBar"); if (bar) bar.style.width = `${(score / scopeItems.length) * 100}%`;
    setText("missingItems", missing.length ? `${missing.slice(0,6).join(", ")}${missing.length > 6 ? `… +${missing.length-6} další` : ""}` : "Všechny kontrolní položky jsou označené jako potvrzené. Ještě ověřte výměry, kvalitu, jednotkové ceny a DPH.");
    if (score < 7) {
      setText("offerHeadline", "Rozsah nabídky je zatím málo potvrzený");
      setText("offerMessage", `Cena ${money(ppm).replace(/\s?Kč/, "")} Kč/m² je jen matematický přepočet. Potvrzeno máte ${score} z ${scopeItems.length} kontrolních položek, takže cenové srovnání může být zavádějící.`);
    } else if (score < scopeItems.length) {
      setText("offerHeadline", "Cena už je čitelnější, ale scope není kompletní");
      setText("offerMessage", `Potvrzeno je ${score} z ${scopeItems.length} položek. Než nabídku označíte za levnou nebo drahou, dořešte chybějící rozsah a sjednoťte DPH.`);
    } else {
      setText("offerHeadline", "Rozsah je podle checklistu potvrzený");
      setText("offerMessage", "Teď má srovnání Kč/m² mnohem větší smysl. Stále ale porovnejte výměry, technické specifikace, kvalitu materiálů, harmonogram a podmínky víceprací.");
    }
  }

  function setupInputs() {
    ["estimateLength","estimateWidth","estimateReserve","estimateBudget"].forEach((id) => { $(id)?.addEventListener("input", renderEstimate); $(id)?.addEventListener("change", renderEstimate); });
    $$('input[name="estimateScenario"]').forEach((el) => el.addEventListener("change", renderEstimate));
    ["materialLength","materialWidth","slabThickness","concreteReserve","stripLength","stripWidth","stripDepth","subbaseThickness","steelKgM2","subbaseLooseFactor","concretePrice","subbasePrice","steelPrice"].forEach((id) => { $(id)?.addEventListener("input", renderMaterial); $(id)?.addEventListener("change", renderMaterial); });
    $$('input[name="foundationSystem"]').forEach((el) => el.addEventListener("change", renderMaterial));
    ["offerTotal","offerArea","offerScenario"].forEach((id) => { $(id)?.addEventListener("input", renderOffer); $(id)?.addEventListener("change", renderOffer); });
    $$("#scopeChecklist input").forEach((el) => el.addEventListener("change", renderOffer));
  }

  function resetForm(id, render) { const form = $(id); if (!form) return; form.reset(); render(); }
  $("resetEstimate")?.addEventListener("click", () => resetForm("estimateForm", renderEstimate));
  $("resetMaterial")?.addEventListener("click", () => resetForm("materialForm", renderMaterial));
  $("resetOffer")?.addEventListener("click", () => resetForm("offerForm", renderOffer));
  const menuToggle = $("menuToggle"), mainNav = $("mainNav");
  menuToggle?.addEventListener("click", () => { const open = mainNav?.classList.toggle("is-open"); menuToggle.setAttribute("aria-expanded", open ? "true" : "false"); });
  mainNav?.addEventListener("click", (e) => { if (e.target.closest("a") && mainNav.classList.contains("is-open")) { mainNav.classList.remove("is-open"); menuToggle?.setAttribute("aria-expanded","false"); }});

  setupTabs(); setupInputs(); renderEstimate(); renderMaterial(); renderOffer();
})();