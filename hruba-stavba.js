(() => {
  "use strict";

  const form = document.getElementById("roughBuildForm");
  if (!form) return;

  const STORAGE_KEY = "rv-rough-build-v4";
  const formIds = [
    "usableArea", "houseType", "scope", "region", "constructionType", "floors",
    "roofType", "basement", "terrain", "openings", "reserveRate", "priceLevel",
    "includeFoundation", "includeChimney", "includeSite", "includeTransport",
    "rateFoundation", "rateStructure", "rateCeiling", "rateRoof", "rateOpenings", "rateSite"
  ];

  const elements = Object.fromEntries(formIds.map((id) => [id, document.getElementById(id)]));
  const output = (id) => document.getElementById(id);
  const modes = [...document.querySelectorAll("[data-mode]")];
  const presets = [...document.querySelectorAll("[data-preset]")];
  let mode = "basic";
  let lastResult = null;

  const money = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0
  });
  const number = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });

  const labels = {
    house: {
      compact: "kompaktní patrový dům",
      storey: "běžný patrový dům",
      bungalow: "bungalov",
      articulated: "členitý dům"
    },
    scope: {
      core: "nosná část bez střechy",
      roof: "nosná část se střechou",
      closed: "uzavřená hrubá stavba"
    }
  };

  const presetsData = {
    compact: { usableArea: 100, houseType: "compact", scope: "roof", region: "1", floors: "2", roofType: "simple" },
    family: { usableArea: 140, houseType: "storey", scope: "roof", region: "1", floors: "2", roofType: "hip" },
    bungalow: { usableArea: 120, houseType: "bungalow", scope: "roof", region: "1", floors: "1", roofType: "hip" }
  };

  const defaultState = Object.fromEntries(formIds.map((id) => {
    const el = elements[id];
    return [id, el.type === "checkbox" ? el.checked : el.value];
  }));

  function clamp(value, min, max, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function readNumber(id, min, max, fallback) {
    return clamp(elements[id].value, min, max, fallback);
  }

  function setText(id, value) {
    const el = output(id);
    if (el) el.textContent = value;
  }

  function setMode(nextMode, persist = true) {
    mode = nextMode === "advanced" ? "advanced" : "basic";
    modes.forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    output("advancedPanel").hidden = mode !== "advanced";
    output("basicIntro").hidden = mode === "advanced";
    setText("resultMode", mode === "advanced" ? "PRO režim" : "Základní režim");
    if (persist) saveState();
    calculate();
  }

  function activeValue(id, basicValue) {
    return mode === "advanced" ? elements[id].value : basicValue;
  }

  function activeChecked(id, basicValue = true) {
    return mode === "advanced" ? elements[id].checked : basicValue;
  }

  function getInputs() {
    const area = readNumber("usableArea", 40, 600, 140);
    const houseType = elements.houseType.value;
    const scope = elements.scope.value;
    const basicFloors = houseType === "bungalow" ? 1 : 2;
    const floors = mode === "advanced" ? readNumber("floors", 1, 3, basicFloors) : basicFloors;
    const basicRoof = houseType === "bungalow" ? "hip" : "simple";

    return {
      area,
      houseType,
      scope,
      region: readNumber("region", 0.8, 1.3, 1),
      constructionType: activeValue("constructionType", "masonry"),
      floors,
      roofType: activeValue("roofType", basicRoof),
      basement: activeValue("basement", "none"),
      terrain: activeValue("terrain", "normal"),
      openings: activeValue("openings", "standard"),
      reserveRate: mode === "advanced" ? readNumber("reserveRate", 0, 30, 10) : 10,
      priceLevel: mode === "advanced" ? readNumber("priceLevel", 0.85, 1.2, 1) : 1,
      includeFoundation: activeChecked("includeFoundation"),
      includeChimney: activeChecked("includeChimney"),
      includeSite: activeChecked("includeSite"),
      includeTransport: activeChecked("includeTransport"),
      rates: {
        foundation: readNumber("rateFoundation", 500, 20000, 5200),
        structure: readNumber("rateStructure", 3000, 30000, 11800),
        ceiling: readNumber("rateCeiling", 1000, 15000, 5200),
        roof: readNumber("rateRoof", 1500, 20000, 6900),
        openings: readNumber("rateOpenings", 500, 15000, 3100),
        site: readNumber("rateSite", 0, 8000, 1300)
      }
    };
  }

  function buildModel(i) {
    const houseFactors = { compact: 0.94, storey: 1, bungalow: 1.06, articulated: 1.13 };
    const constructionFactors = { masonry: 1, timber: 0.95, concrete: 1.17 };
    const roofFactors = { simple: 0.94, hip: 1.06, flat: 1.08, complex: 1.2 };
    const roofAreaFactors = { simple: 1.18, hip: 1.24, flat: 1.06, complex: 1.33 };
    const terrainFactors = { easy: 0.94, normal: 1, hard: 1.16 };
    const openingFactors = { basic: 0.88, standard: 1, large: 1.25 };
    const basementParts = { none: 0, partial: 0.45, full: 1 };
    const houseFactor = houseFactors[i.houseType] || 1;
    const constructionFactor = constructionFactors[i.constructionType] || 1;
    const roofFactor = roofFactors[i.roofType] || 1;
    const terrainFactor = terrainFactors[i.terrain] || 1;
    const openingFactor = openingFactors[i.openings] || 1;
    const footprintRatio = i.houseType === "bungalow" ? 0.93 : i.houseType === "articulated" ? (1 / Math.max(1, i.floors - 0.2)) : (1 / Math.max(1, i.floors - 0.12));
    const footprint = i.area * footprintRatio;
    const ceilingArea = i.floors > 1 ? footprint * (i.floors - 1) : i.area * 0.2;
    const roofArea = footprint * (roofAreaFactors[i.roofType] || 1.18);
    const marketFactor = i.region * i.priceLevel;

    const rawItems = [
      {
        key: "foundation", label: "Základové konstrukce", active: i.includeFoundation,
        basis: `${number.format(footprint)} m² půdorysu`, rate: `${number.format(i.rates.foundation)} Kč/m² × terén`,
        amount: footprint * i.rates.foundation * terrainFactor, category: "core"
      },
      {
        key: "structure", label: "Nosné svislé konstrukce", active: true,
        basis: `${number.format(i.area)} m² užitné plochy`, rate: `${number.format(i.rates.structure)} Kč/m² × typ domu`,
        amount: i.area * i.rates.structure * constructionFactor * houseFactor, category: "core"
      },
      {
        key: "ceiling", label: "Stropy, věnce a nosné vodorovné prvky", active: true,
        basis: `${number.format(ceilingArea)} m² modelové plochy`, rate: `${number.format(i.rates.ceiling)} Kč/m²`,
        amount: ceilingArea * i.rates.ceiling * constructionFactor, category: "core"
      },
      {
        key: "roof", label: "Nosná konstrukce a plášť střechy", active: i.scope !== "core",
        basis: `${number.format(roofArea)} m² modelové plochy`, rate: `${number.format(i.rates.roof)} Kč/m² × tvar`,
        amount: roofArea * i.rates.roof * roofFactor, category: "extras"
      },
      {
        key: "openings", label: "Výplně otvorů", active: i.scope === "closed",
        basis: `${number.format(i.area)} m² užitné plochy`, rate: `${number.format(i.rates.openings)} Kč/m² × prosklení`,
        amount: i.area * i.rates.openings * openingFactor, category: "extras"
      },
      {
        key: "basement", label: "Podsklepení", active: i.basement !== "none",
        basis: `${number.format(footprint * basementParts[i.basement])} m² sklepa`, rate: "19 800 Kč/m² × terén",
        amount: footprint * basementParts[i.basement] * 19800 * terrainFactor, category: "extras"
      },
      {
        key: "chimney", label: "Komínové těleso", active: i.includeChimney,
        basis: "1 modelová sestava", rate: "95 000 Kč/sestava",
        amount: 95000, category: "extras"
      },
      {
        key: "site", label: "Lešení a provoz staveniště", active: i.includeSite,
        basis: `${number.format(i.area)} m² užitné plochy`, rate: `${number.format(i.rates.site)} Kč/m² × terén`,
        amount: i.area * i.rates.site * terrainFactor, category: "extras"
      },
      {
        key: "transport", label: "Doprava a stavební technika", active: i.includeTransport,
        basis: `${number.format(i.area)} m² užitné plochy`, rate: "620 Kč/m² × náročnost",
        amount: i.area * 620 * terrainFactor * houseFactor, category: "extras"
      }
    ];

    const items = rawItems.map((item) => ({
      ...item,
      amount: item.active ? item.amount * marketFactor : 0
    }));
    const core = items.filter((item) => item.active && item.category === "core").reduce((sum, item) => sum + item.amount, 0);
    const extras = items.filter((item) => item.active && item.category === "extras").reduce((sum, item) => sum + item.amount, 0);
    const base = core + extras;
    const reserve = base * i.reserveRate / 100;
    const total = base + reserve;
    const included = items.filter((item) => item.active);
    const excluded = items.filter((item) => !item.active);

    return {
      input: i, items, core, extras, base, reserve, total, footprint, roofArea,
      included, excluded,
      perM2: total / Math.max(1, i.area),
      low: total * 0.9,
      high: total * 1.13
    };
  }

  function resultInterpretation(result) {
    const i = result.input;
    if (i.basement !== "none") {
      return {
        headline: "Sklep zvyšuje nejistotu spodní stavby",
        text: "Ověřte geologii, vodu, rozsah výkopů, izolace a odvodnění. U sklepa má konkrétní projekt větší váhu než průměrná sazba."
      };
    }
    if (i.terrain === "hard") {
      return {
        headline: "Pozemek může být větší riziko než samotné zdivo",
        text: "Horší přístup, svah nebo nejisté podloží prověřte samostatně. Modelová přirážka nemusí pokrýt atypické opěrné konstrukce nebo zvláštní zakládání."
      };
    }
    if (i.scope === "core") {
      return {
        headline: "Výsledek nezahrnuje střechu ani výplně otvorů",
        text: "Při porovnání s nabídkou označenou jako hrubá stavba zkontrolujte, zda firma tyto části nepřidává. Jinak budete srovnávat odlišný rozsah."
      };
    }
    if (i.scope === "closed") {
      return {
        headline: "U uzavřené stavby zkontrolujte standard otvorů",
        text: "Velké portály, materiál rámů, zasklení a montáž mohou výsledek změnit. Vyžádejte si samostatnou specifikaci oken a dveří."
      };
    }
    return {
      headline: "Nejdřív porovnejte rozsah, potom celkovou cenu",
      text: "Model zahrnuje nosné konstrukce a střechu, nikoli výplně otvorů. U nabídky si nechte výslovně potvrdit, které vrstvy střechy a doplňky jsou v ceně."
    };
  }

  function renderBreakdown(result) {
    const body = output("breakdownBody");
    body.innerHTML = "";
    result.items.forEach((item) => {
      const row = document.createElement("tr");
      if (!item.active) row.className = "breakdown-row-off";
      const cells = [
        ["Položka", item.label],
        ["Základ výpočtu", item.active ? item.basis : "mimo zvolený rozsah"],
        ["Modelová sazba", item.active ? item.rate : "—"],
        ["Částka", item.active ? money.format(Math.round(item.amount)) : "0 Kč"],
        ["Stav", item.active ? "Započítáno" : "Nezapočítáno"]
      ];
      cells.forEach(([label, value], index) => {
        const cell = document.createElement("td");
        cell.dataset.label = label;
        if (index === 3) cell.className = "breakdown-amount";
        if (index === 4) {
          const badge = document.createElement("span");
          badge.className = `breakdown-status${item.active ? "" : " is-off"}`;
          badge.textContent = value;
          cell.appendChild(badge);
        } else {
          cell.textContent = value;
        }
        row.appendChild(cell);
      });
      body.appendChild(row);
    });

    const reserveRow = document.createElement("tr");
    reserveRow.innerHTML = `<td data-label="Položka">Rozpočtová rezerva</td><td data-label="Základ výpočtu">${number.format(result.input.reserveRate)} % ze zahrnutých položek</td><td data-label="Modelová sazba">rezerva uživatele</td><td data-label="Částka" class="breakdown-amount">${money.format(Math.round(result.reserve))}</td><td data-label="Stav"><span class="breakdown-status">Započítáno</span></td>`;
    body.appendChild(reserveRow);
  }

  function render(result) {
    const i = result.input;
    lastResult = result;
    setText("totalCost", money.format(Math.round(result.total)));
    setText("pricePerM2", `${money.format(Math.round(result.perM2))}/m²`);
    setText("baseCost", money.format(Math.round(result.base)));
    setText("reserveCost", money.format(Math.round(result.reserve)));
    setText("reserveLabel", `${number.format(i.reserveRate)} % z modelu`);
    setText("footprintArea", `${number.format(result.footprint)} m²`);
    setText("includedCount", `${result.included.length} / ${result.items.length}`);
    setText("resultBadge", `${mode === "advanced" ? "PRO MODEL" : "RYCHLÝ MODEL"} · STŘEDNÍ SCÉNÁŘ`);
    setText("resultSummary", `${number.format(i.area)} m² · ${labels.house[i.houseType]} · ${labels.scope[i.scope]}. Výsledek je plánovací pásmo, nikoli nabídka.`);

    const totalForShare = Math.max(1, result.total);
    const coreShare = result.core / totalForShare * 100;
    const extrasShare = result.extras / totalForShare * 100;
    const reserveShare = result.reserve / totalForShare * 100;
    output("gaugeCore").style.width = `${coreShare}%`;
    output("gaugeRoof").style.width = `${extrasShare}%`;
    output("gaugeReserve").style.width = `${reserveShare}%`;
    setText("coreShare", `${number.format(coreShare)} %`);
    setText("extrasShare", `${number.format(extrasShare)} %`);
    setText("reserveShare", `${number.format(reserveShare)} %`);

    const chips = output("includedItems");
    chips.innerHTML = "";
    result.included.forEach((item) => {
      const chip = document.createElement("span");
      chip.textContent = item.label;
      chips.appendChild(chip);
    });
    setText("excludedText", result.excluded.length
      ? `Mimo výpočet: ${result.excluded.map((item) => item.label.toLowerCase()).join(", ")}.`
      : "Všechny modelové skupiny jsou započítané. Přesto ověřte jejich přesný technický rozsah.");

    const interpretation = resultInterpretation(result);
    setText("decisionHeadline", interpretation.headline);
    setText("decisionText", interpretation.text);

    setText("scenarioLow", money.format(Math.round(result.low)));
    setText("scenarioMid", money.format(Math.round(result.total)));
    setText("scenarioHigh", money.format(Math.round(result.high)));
    setText("scenarioGap", money.format(Math.round(result.high - result.low)));

    setText("heroArea", `${number.format(i.area)} m²`);
    setText("heroScope", labels.scope[i.scope]);
    setText("heroTotal", result.total >= 1000000 ? `${(result.total / 1000000).toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} mil. Kč` : money.format(Math.round(result.total)));
    setText("heroPerM2", `${money.format(Math.round(result.perM2))}/m²`);
    output("heroProgress").style.width = `${clamp((result.total - 1500000) / 8500000 * 100, 18, 100, 60)}%`;

    renderBreakdown(result);
  }

  function calculate() {
    const input = getInputs();
    const areaEl = elements.usableArea;
    areaEl.setAttribute("aria-invalid", String(Number(areaEl.value) < 40 || Number(areaEl.value) > 600));
    render(buildModel(input));
  }

  function saveState() {
    try {
      const values = Object.fromEntries(formIds.map((id) => {
        const el = elements[id];
        return [id, el.type === "checkbox" ? el.checked : el.value];
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, values }));
    } catch (_) {
      // Kalkulačka funguje i bez úložiště prohlížeče.
    }
  }

  function restoreState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved || !saved.values) return false;
      formIds.forEach((id) => {
        const el = elements[id];
        if (!(id in saved.values)) return;
        if (el.type === "checkbox") el.checked = Boolean(saved.values[id]);
        else el.value = saved.values[id];
      });
      mode = saved.mode === "advanced" ? "advanced" : "basic";
      return true;
    } catch (_) {
      return false;
    }
  }

  function markPreset(name) {
    presets.forEach((button) => button.classList.toggle("is-active", button.dataset.preset === name));
  }

  modes.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  presets.forEach((button) => button.addEventListener("click", () => {
    const values = presetsData[button.dataset.preset];
    Object.entries(values).forEach(([id, value]) => { if (elements[id]) elements[id].value = value; });
    markPreset(button.dataset.preset);
    saveState();
    calculate();
  }));

  form.addEventListener("input", () => {
    presets.forEach((button) => button.classList.remove("is-active"));
    saveState();
    calculate();
  });
  form.addEventListener("change", () => {
    saveState();
    calculate();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
    if (window.matchMedia("(max-width: 760px)").matches) output("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  output("resetBtn").addEventListener("click", () => {
    formIds.forEach((id) => {
      const el = elements[id];
      if (el.type === "checkbox") el.checked = Boolean(defaultState[id]);
      else el.value = defaultState[id];
    });
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    markPreset("family");
    setMode("basic", false);
  });

  output("printResult").addEventListener("click", () => window.print());
  output("copyResult").addEventListener("click", async (event) => {
    if (!lastResult) return;
    const r = lastResult;
    const text = [
      "Orientační rozpočet hrubé stavby",
      `${number.format(r.input.area)} m² · ${labels.house[r.input.houseType]} · ${labels.scope[r.input.scope]}`,
      `Střední model: ${money.format(Math.round(r.total))}`,
      `Cena za m²: ${money.format(Math.round(r.perM2))}`,
      `Scénáře: ${money.format(Math.round(r.low))} až ${money.format(Math.round(r.high))}`,
      `Zahrnuto: ${r.included.map((item) => item.label).join(", ")}`,
      "Výsledek je orientační a nenahrazuje položkový rozpočet ani nabídku."
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch (_) {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    const button = event.currentTarget;
    const original = button.textContent;
    button.textContent = "Zkopírováno";
    button.classList.add("copy-feedback");
    setTimeout(() => { button.textContent = original; button.classList.remove("copy-feedback"); }, 1600);
  });

  const restored = restoreState();
  setMode(mode, false);
  if (!restored) markPreset("family");
})();
