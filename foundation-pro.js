(() => {
  "use strict";

  const form = document.getElementById("foundationForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const number = (value, fallback = 0) => {
    const parsed = Number(String(value ?? "").trim().replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const read = (id, fallback = 0, min = 0, max = 10000000) => clamp(number($(id)?.value, fallback), min, max);
  const money = (value) => new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
  const compactMoney = (value) => {
    if (value >= 1000000) {
      return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(value / 1000000)} mil. Kč`;
    }
    return money(value);
  };
  const decimal = (value, digits = 1) => new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
  const whole = (value) => new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
  const percent = (value) => `${decimal(value, value % 1 ? 1 : 0)} %`;

  const presets = {
    house: {
      label: "rodinný dům",
      slabThickness: 15,
      subbaseThickness: 20,
      steelKgM2: 10,
      concreteReserve: 5,
      concretePrice: 4800,
      pumpPrice: 36000,
      gravelPrice: 720,
      gravelDensity: 1.75,
      earthworks: 1450,
      subbaseLabor: 1450,
      steelPrice: 34,
      steelLabor: 650,
      insulation: 2500,
      formwork: 650,
      generalLabor: 1600,
      services: 55000,
    },
    garage: {
      label: "garáž",
      slabThickness: 15,
      subbaseThickness: 18,
      steelKgM2: 8,
      concreteReserve: 5,
      concretePrice: 4800,
      pumpPrice: 30000,
      gravelPrice: 720,
      gravelDensity: 1.75,
      earthworks: 1250,
      subbaseLabor: 1250,
      steelPrice: 34,
      steelLabor: 560,
      insulation: 950,
      formwork: 650,
      generalLabor: 1450,
      services: 32000,
    },
    extension: {
      label: "přístavba",
      slabThickness: 15,
      subbaseThickness: 20,
      steelKgM2: 10,
      concreteReserve: 7,
      concretePrice: 4800,
      pumpPrice: 33000,
      gravelPrice: 720,
      gravelDensity: 1.75,
      earthworks: 1650,
      subbaseLabor: 1550,
      steelPrice: 34,
      steelLabor: 720,
      insulation: 2350,
      formwork: 760,
      generalLabor: 1850,
      services: 52000,
    },
    workshop: {
      label: "dílna nebo zahradní stavba",
      slabThickness: 13,
      subbaseThickness: 16,
      steelKgM2: 7,
      concreteReserve: 5,
      concretePrice: 4800,
      pumpPrice: 28000,
      gravelPrice: 720,
      gravelDensity: 1.75,
      earthworks: 1100,
      subbaseLabor: 1100,
      steelPrice: 34,
      steelLabor: 520,
      insulation: 650,
      formwork: 620,
      generalLabor: 1350,
      services: 24000,
    },
  };

  let currentMode = "basic";
  let currentResult = null;
  let copiedTimer = null;

  function checkedValue(name, fallback) {
    return form.querySelector(`input[name="${name}"]:checked`)?.value || fallback;
  }

  function groundFactor(value) {
    if (value === "easy") return 0.92;
    if (value === "difficult") return 1.2;
    return 1;
  }

  function basicParams() {
    const purpose = checkedValue("basicPurpose", "house");
    const preset = presets[purpose] || presets.house;
    const length = read("basicLength", 12, 0, 300);
    const width = read("basicWidth", 10, 0, 300);
    const area = length * width;
    const perimeter = 2 * (length + width);
    const ground = $("basicGround")?.value || "standard";
    const factor = groundFactor(ground);
    const reserve = read("basicReserve", 10, 0, 40);
    const region = read("basicRegion", 1, 0.7, 1.6);

    return {
      mode: "basic",
      label: preset.label,
      area,
      perimeter,
      slabThickness: preset.slabThickness,
      subbaseThickness: preset.subbaseThickness,
      steelKgM2: preset.steelKgM2,
      concreteReserve: preset.concreteReserve,
      concretePrice: preset.concretePrice,
      pumpPrice: preset.pumpPrice,
      gravelPrice: preset.gravelPrice,
      gravelDensity: preset.gravelDensity,
      earthworks: preset.earthworks * factor,
      subbaseLabor: preset.subbaseLabor * factor,
      steelPrice: preset.steelPrice,
      steelLabor: preset.steelLabor,
      insulation: preset.insulation,
      formwork: preset.formwork,
      generalLabor: preset.generalLabor * (ground === "difficult" ? 1.08 : 1),
      services: preset.services,
      drainageEnabled: false,
      drainageLength: 0,
      drainageRate: 0,
      difficultAccess: ground === "difficult",
      region,
      reserve,
      ground,
      valid: length > 0 && width > 0,
    };
  }

  function proParams() {
    const area = read("proArea", 120, 0, 10000);
    const perimeter = read("proPerimeter", 44, 0, 10000);
    return {
      mode: "pro",
      label: "vlastní PRO rozpočet",
      area,
      perimeter,
      slabThickness: read("proSlabThickness", 15, 1, 150),
      subbaseThickness: read("proSubbaseThickness", 20, 0, 300),
      steelKgM2: read("proSteelKgM2", 10, 0, 200),
      concreteReserve: read("proConcreteReserve", 5, 0, 50),
      concretePrice: read("proConcretePrice", 4800, 0, 100000),
      pumpPrice: read("proPumpPrice", 36000, 0, 5000000),
      gravelPrice: read("proGravelPrice", 720, 0, 100000),
      gravelDensity: read("proGravelDensity", 1.75, 0.1, 10),
      earthworks: read("proEarthworks", 1450, 0, 100000),
      subbaseLabor: read("proSubbaseLabor", 1450, 0, 100000),
      steelPrice: read("proSteelPrice", 34, 0, 1000),
      steelLabor: read("proSteelLabor", 650, 0, 100000),
      insulation: read("proInsulation", 2500, 0, 100000),
      formwork: read("proFormwork", 650, 0, 100000),
      generalLabor: read("proGeneralLabor", 1600, 0, 100000),
      services: read("proServices", 55000, 0, 10000000),
      drainageEnabled: Boolean($("proDrainageEnabled")?.checked),
      drainageLength: read("proDrainageLength", 44, 0, 10000),
      drainageRate: read("proDrainageRate", 1450, 0, 100000),
      difficultAccess: Boolean($("proDifficultAccess")?.checked),
      region: read("proRegion", 1, 0.7, 1.6),
      reserve: read("proReserve", 10, 0, 50),
      ground: "custom",
      valid: area > 0,
    };
  }

  function calculate(params) {
    const area = Math.max(params.area, 0);
    const perimeter = Math.max(params.perimeter, 0);
    const concreteGeometric = area * (params.slabThickness / 100);
    const concreteOrder = concreteGeometric * (1 + params.concreteReserve / 100);
    const gravelCompacted = area * (params.subbaseThickness / 100);
    const gravelLoose = gravelCompacted * 1.15;
    const gravelTons = gravelLoose * params.gravelDensity;
    const steelKg = area * params.steelKgM2;

    const rawRows = [
      { key: "earth", label: "Zemní práce a příprava pláně", basis: `${decimal(area)} m² × ${whole(params.earthworks)} Kč`, amount: area * params.earthworks, group: "work" },
      { key: "gravel", label: "Kamenivo", basis: `${decimal(gravelTons, 2)} t × ${whole(params.gravelPrice)} Kč`, amount: gravelTons * params.gravelPrice, group: "material" },
      { key: "subbase", label: "Rozprostření a hutnění podkladu", basis: `${decimal(area)} m² × ${whole(params.subbaseLabor)} Kč`, amount: area * params.subbaseLabor, group: "work" },
      { key: "concrete", label: "Beton", basis: `${decimal(concreteOrder, 2)} m³ × ${whole(params.concretePrice)} Kč`, amount: concreteOrder * params.concretePrice, group: "material" },
      { key: "pump", label: "Doprava a čerpání betonu", basis: "jednorázová položka", amount: params.pumpPrice, group: "work" },
      { key: "steel", label: "Betonářská ocel", basis: `${whole(steelKg)} kg × ${whole(params.steelPrice)} Kč`, amount: steelKg * params.steelPrice, group: "material" },
      { key: "steelWork", label: "Příprava a vázání výztuže", basis: `${decimal(area)} m² × ${whole(params.steelLabor)} Kč`, amount: area * params.steelLabor, group: "work" },
      { key: "insulation", label: "Izolace a technické vrstvy", basis: `${decimal(area)} m² × ${whole(params.insulation)} Kč`, amount: area * params.insulation, group: "material" },
      { key: "formwork", label: "Bednění obvodu", basis: `${decimal(perimeter)} m × ${whole(params.formwork)} Kč`, amount: perimeter * params.formwork, group: "work" },
      { key: "labor", label: "Betonáž a ostatní práce", basis: `${decimal(area)} m² × ${whole(params.generalLabor)} Kč`, amount: area * params.generalLabor, group: "work" },
      { key: "services", label: "Prostupy, kanalizace a služby", basis: "souhrnná položka", amount: params.services, group: "work" },
    ];

    if (params.drainageEnabled) {
      rawRows.push({ key: "drainage", label: "Drenáž", basis: `${decimal(params.drainageLength)} m × ${whole(params.drainageRate)} Kč`, amount: params.drainageLength * params.drainageRate, group: "work" });
    }

    if (params.difficultAccess) {
      const affected = rawRows.filter((row) => row.group === "work").reduce((sum, row) => sum + row.amount, 0);
      rawRows.push({ key: "access", label: "Horší přístup techniky", basis: "7 % z pracovních a servisních položek", amount: affected * 0.07, group: "work" });
    }

    const rows = rawRows
      .filter((row) => row.amount > 0.01)
      .map((row) => ({ ...row, amount: row.amount * params.region }));
    const base = rows.reduce((sum, row) => sum + row.amount, 0);
    const reserveCost = base * (params.reserve / 100);
    const total = base + reserveCost;
    const material = rows.filter((row) => row.group === "material").reduce((sum, row) => sum + row.amount, 0);
    const work = Math.max(0, base - material);

    return {
      params,
      rows,
      area,
      perimeter,
      concreteGeometric,
      concreteOrder,
      gravelCompacted,
      gravelLoose,
      gravelTons,
      steelKg,
      base,
      reserveCost,
      total,
      pricePerM2: area > 0 ? total / area : 0,
      material,
      work,
      valid: params.valid && total > 0,
    };
  }

  function setText(id, value) {
    if ($(id)) $(id).textContent = value;
  }

  function setWidth(id, value) {
    if ($(id)) $(id).style.width = `${clamp(value, 0, 100)}%`;
  }

  function interpretation(result) {
    if (!result.valid) {
      return {
        status: "Doplňte rozměry",
        title: "Výpočet čeká na platnou plochu",
        text: "Zadejte kladnou délku a šířku, případně plochu v PRO režimu.",
      };
    }
    if (result.area < 50) {
      return {
        status: "Menší deska",
        title: "Jednorázové náklady mají větší vliv",
        text: `Plocha ${decimal(result.area)} m² rozpočítává dopravu, čerpadlo a přípravu do menšího počtu metrů. Kontrolujte proto celkovou cenu i cenu za m².`,
      };
    }
    if (result.pricePerM2 > 15000) {
      return {
        status: "Náročnější scénář",
        title: "Rozpočet táhne složitější skladba nebo práce",
        text: `Výsledek ${money(result.pricePerM2)} za m² je vyšší modelový scénář. V rozpadu ověřte zejména zemní práce, izolace, přístup, jednorázové služby a zvolenou rezervu.`,
      };
    }
    if (result.pricePerM2 < 8500) {
      return {
        status: "Úsporný scénář",
        title: "Ověřte, zda nic podstatného nechybí",
        text: `Výsledek ${money(result.pricePerM2)} za m² působí úsporně. Zkontrolujte hlavně zemní práce, izolace, prostupy, dopravu, čerpadlo a rozsah práce.`,
      };
    }
    return {
      status: "Modelový odhad",
      title: "Rozpočet je připravený k položkové kontrole",
      text: `Výsledek ${money(result.pricePerM2)} za m² je orientační rámec pro ${result.params.label}. Nahraďte pracovní předvolby projektovými výměrami a konkrétními nabídkami.`,
    };
  }

  function renderBreakdown(result) {
    const total = result.total || 1;
    const rows = [...result.rows, {
      key: "reserve",
      label: "Rozpočtová rezerva",
      basis: percent(result.params.reserve),
      amount: result.reserveCost,
      group: "reserve",
    }].filter((row) => row.amount > 0.01);
    $("breakdownBody").innerHTML = rows.map((row) => `
      <tr>
        <td>${row.label}</td>
        <td>${row.basis}</td>
        <td>${money(row.amount)}</td>
        <td>${percent((row.amount / total) * 100)}</td>
      </tr>`).join("");
  }

  function renderScenarios(result) {
    const currentReserve = result.params.reserve;
    const scenarios = [
      { label: "Jednodušší", factor: 0.92, reserve: Math.max(3, currentReserve - 5), note: "lepší podmínky a menší rezerva" },
      { label: "Aktuální", factor: 1, reserve: currentReserve, note: "právě zadané hodnoty", current: true },
      { label: "Náročnější", factor: 1.13, reserve: Math.max(12, currentReserve + 3), note: "více přípravy a vyšší polštář" },
      { label: "Rizikový rámec", factor: 1.25, reserve: Math.max(18, currentReserve + 8), note: "nejistoty před zpřesněním projektu" },
    ];
    $("scenarioGrid").innerHTML = scenarios.map((scenario) => {
      const scenarioBase = result.base * scenario.factor;
      const scenarioTotal = scenarioBase * (1 + scenario.reserve / 100);
      return `<article class="scenario-card${scenario.current ? " is-current" : ""}"><span>${scenario.label}</span><strong>${compactMoney(scenarioTotal)}</strong><small>${scenario.note} · rezerva ${percent(scenario.reserve)}</small></article>`;
    }).join("");
  }

  function render() {
    const params = currentMode === "pro" ? proParams() : basicParams();
    const result = calculate(params);
    const insight = interpretation(result);
    currentResult = result;

    setText("basicAreaPreview", `${decimal(basicParams().area)} m²`);
    setText("basicReserveOutput", percent(read("basicReserve", 10, 0, 40)));
    setText("totalCost", result.valid ? money(result.total) : "—");
    setText("pricePerM2", result.valid ? `${money(result.pricePerM2)}/m²` : "Doplňte rozměry");
    setText("resultStatus", insight.status);
    setText("resultModeLabel", currentMode === "pro" ? "PRO rozpočet" : "Základní režim");
    setText("resultLead", currentMode === "pro" ? "Položkový výsledek používá vaše množství, sazby, region a rezervu." : "Rychlý model doplnil běžné vrstvy a sazby podle zvoleného typu stavby.");
    setText("resultArea", `${decimal(result.area)} m²`);
    setText("resultConcrete", `${decimal(result.concreteOrder, 2)} m³`);
    setText("resultGravel", `${decimal(result.gravelTons, 2)} t`);
    setText("resultSteel", `${whole(result.steelKg)} kg`);
    setText("baseCost", money(result.base));
    setText("reserveCost", money(result.reserveCost));
    setText("reserveCaption", percent(params.reserve));
    setText("resultGravelVolume", `${decimal(result.gravelLoose, 2)} m³`);
    setText("resultPerimeter", `${decimal(result.perimeter)} m`);
    setText("resultDrainage", params.drainageEnabled ? `${decimal(params.drainageLength)} m` : "nezahrnuta");
    setText("resultRegion", decimal(params.region, 2));
    setText("insightTitle", insight.title);
    setText("insightText", insight.text);

    const materialShare = result.total > 0 ? (result.material / result.total) * 100 : 0;
    const workShare = result.total > 0 ? (result.work / result.total) * 100 : 0;
    const reserveShare = result.total > 0 ? (result.reserveCost / result.total) * 100 : 0;
    setWidth("materialGauge", materialShare);
    setWidth("workGauge", workShare);
    setWidth("reserveGauge", reserveShare);
    setText("materialShare", percent(materialShare));
    setText("workShare", percent(workShare));
    setText("reserveShare", percent(reserveShare));

    setText("heroTotalCost", result.valid ? compactMoney(result.total) : "doplňte rozměry");
    setText("heroArea", `${decimal(result.area)} m²`);
    setText("heroConcrete", `${decimal(result.concreteOrder, 1)} m³`);
    setText("heroReserve", percent(params.reserve));
    setText("heroSlabThickness", `${decimal(params.slabThickness, 0)} cm`);
    setText("heroSubbaseThickness", `${decimal(params.subbaseThickness, 0)} cm`);

    $("proResultExtras").hidden = currentMode !== "pro";
    renderBreakdown(result);
    renderScenarios(result);
  }

  function switchMode(mode, transferBasic = false) {
    if (!["basic", "pro"].includes(mode)) return;
    if (mode === "pro" && transferBasic) {
      const basic = basicParams();
      $("proArea").value = decimal(basic.area, 1).replace(/\s/g, "").replace(",", ".");
      $("proPerimeter").value = decimal(basic.perimeter, 1).replace(/\s/g, "").replace(",", ".");
      $("proSlabThickness").value = basic.slabThickness;
      $("proSubbaseThickness").value = basic.subbaseThickness;
      $("proSteelKgM2").value = basic.steelKgM2;
      $("proReserve").value = basic.reserve;
      $("proRegion").value = String(basic.region);
    }
    currentMode = mode;
    form.dataset.mode = mode;
    document.body.dataset.calculatorMode = mode;
    $$('[data-mode-button]').forEach((button) => {
      const active = button.dataset.modeButton === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $$('[data-mode-panel]').forEach((panel) => {
      panel.hidden = panel.dataset.modePanel !== mode;
    });
    render();
  }

  function resetBasic() {
    const purpose = form.querySelector('input[name="basicPurpose"][value="house"]');
    if (purpose) purpose.checked = true;
    $("basicLength").value = "12";
    $("basicWidth").value = "10";
    $("basicGround").value = "standard";
    $("basicRegion").value = "1";
    $("basicReserve").value = "10";
    $("basicDetails").open = false;
    render();
  }

  function resetPro() {
    const defaults = {
      proArea: 120,
      proPerimeter: 44,
      proSlabThickness: 15,
      proSubbaseThickness: 20,
      proSteelKgM2: 10,
      proConcreteReserve: 5,
      proConcretePrice: 4800,
      proPumpPrice: 36000,
      proGravelPrice: 720,
      proGravelDensity: 1.75,
      proSteelPrice: 34,
      proSteelLabor: 650,
      proEarthworks: 1450,
      proSubbaseLabor: 1450,
      proInsulation: 2500,
      proFormwork: 650,
      proGeneralLabor: 1600,
      proServices: 55000,
      proDrainageLength: 44,
      proDrainageRate: 1450,
      proReserve: 10,
    };
    Object.entries(defaults).forEach(([id, value]) => { if ($(id)) $(id).value = value; });
    $("proRegion").value = "1";
    $("proDrainageEnabled").checked = false;
    $("proDifficultAccess").checked = false;
    $("drainageFields").hidden = true;
    render();
  }

  function copySummary() {
    if (!currentResult) return;
    const result = currentResult;
    const summary = [
      "Kalkulačka ceny základové desky – RychléVýpočty.cz",
      `Režim: ${currentMode === "pro" ? "PRO" : "základní"}`,
      `Plocha: ${decimal(result.area)} m²`,
      `Cena celkem: ${money(result.total)}`,
      `Cena za m²: ${money(result.pricePerM2)}`,
      `Beton: ${decimal(result.concreteOrder, 2)} m³`,
      `Kamenivo: ${decimal(result.gravelTons, 2)} t`,
      `Výztuž: ${whole(result.steelKg)} kg`,
      `Rezerva: ${money(result.reserveCost)} (${percent(result.params.reserve)})`,
      "Výsledek je orientační a nenahrazuje projekt ani nabídku dodavatele.",
    ].join("\n");

    const button = $("copyResult");
    const done = () => {
      if (!button) return;
      button.textContent = "Zkopírováno";
      button.classList.add("copied");
      window.clearTimeout(copiedTimer);
      copiedTimer = window.setTimeout(() => {
        button.textContent = "Kopírovat výsledek";
        button.classList.remove("copied");
      }, 1800);
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(summary).then(done).catch(() => fallbackCopy(summary, done));
    } else {
      fallbackCopy(summary, done);
    }
  }

  function fallbackCopy(text, callback) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand("copy"); callback(); } catch (_) { /* no-op */ }
    textarea.remove();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  form.addEventListener("input", (event) => {
    if (event.target.matches("input, select")) render();
  });
  form.addEventListener("change", (event) => {
    if (event.target.id === "proDrainageEnabled") {
      $("drainageFields").hidden = !event.target.checked;
    }
    if (event.target.matches("input, select")) render();
  });
  $$('[data-mode-button]').forEach((button) => button.addEventListener("click", () => switchMode(button.dataset.modeButton, false)));
  $$('[data-open-pro]').forEach((button) => button.addEventListener("click", () => switchMode("pro", true)));
  $("resetBasic")?.addEventListener("click", resetBasic);
  $("resetPro")?.addEventListener("click", resetPro);
  $("copyResult")?.addEventListener("click", copySummary);
  $("printResult")?.addEventListener("click", () => window.print());

  switchMode("basic");
})();
