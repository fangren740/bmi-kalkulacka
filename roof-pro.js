(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const form = $("roofForm");
  if (!form) return;

  const money = (value) => new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
  const number = (value, digits = 0) => new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);
  const compactMoney = (value) => value >= 1000000
    ? `${number(value / 1000000, 2)} mil. Kč`
    : money(value);
  const parse = (value, fallback = 0) => {
    const parsed = Number(String(value ?? "").replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const checkedValue = (name) => form.querySelector(`[name="${name}"]:checked`)?.value;
  const countLabel = (value, one, few, many) => {
    const absolute = Math.abs(Math.round(value));
    if (absolute === 1) return `${absolute} ${one}`;
    if (absolute >= 2 && absolute <= 4) return `${absolute} ${few}`;
    return `${absolute} ${many}`;
  };

  const scopePresets = {
    new: {
      label: "Nová kompletní střecha",
      short: "nová střecha",
      rates: { structure: 2300, underlay: 850, covering: 2100, insulation: 1300, flashings: 600, demolition: 0, scaffolding: 420 },
    },
    renovation: {
      label: "Kompletní rekonstrukce",
      short: "rekonstrukce",
      rates: { structure: 1200, underlay: 900, covering: 2100, insulation: 1300, flashings: 650, demolition: 550, scaffolding: 480 },
    },
    covering: {
      label: "Výměna krytiny a doplňků",
      short: "výměna krytiny",
      rates: { structure: 0, underlay: 900, covering: 2100, insulation: 0, flashings: 650, demolition: 500, scaffolding: 480 },
    },
    insulation: {
      label: "Zateplení střešního pláště",
      short: "zateplení střechy",
      rates: { structure: 0, underlay: 200, covering: 0, insulation: 1500, flashings: 120, demolition: 150, scaffolding: 200 },
    },
  };

  const coveringFactors = {
    concrete: { label: "Betonová taška", factor: 0.95 },
    ceramic: { label: "Pálená taška", factor: 1 },
    metal: { label: "Plechová krytina", factor: 0.86 },
    premium: { label: "Vyšší standard", factor: 1.28 },
  };
  const complexityFactors = {
    simple: { label: "Jednoduchá", factor: 1 },
    standard: { label: "Běžná", factor: 1.1 },
    complex: { label: "Členitá", factor: 1.23 },
  };
  const slopeFactors = { easy: 1, standard: 1.05, hard: 1.12 };
  const accessFactors = { easy: 1, standard: 1.05, hard: 1.12 };

  const modeButtons = [...form.querySelectorAll("[data-mode-button]")];
  const modePanels = [...form.querySelectorAll("[data-mode-panel]")];

  function setMode(mode, focusPanel = false) {
    body.dataset.calculatorMode = mode;
    form.dataset.mode = mode;
    modeButtons.forEach((button) => {
      const active = button.dataset.modeButton === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    modePanels.forEach((panel) => {
      panel.hidden = panel.dataset.modePanel !== mode;
    });
    $("modeStatus").textContent = mode === "pro" ? "PRO režim" : "Základní režim";
    $("modelBadge").textContent = mode === "pro" ? "VLASTNÍ SAZBY" : "MODELOVÝ ODHAD";
    render();
    if (focusPanel) {
      $(mode === "pro" ? "proPanel" : "basicPanel")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function item(name, category, basis, rate, cost) {
    return { name, category, basis, rate, cost: Math.max(0, cost) };
  }

  function basicModel() {
    const area = clamp(parse($("basicArea").value, 160), 20, 1500);
    const scopeKey = checkedValue("basicScope") || "new";
    const complexityKey = checkedValue("basicComplexity") || "standard";
    const coveringKey = $("basicCovering").value;
    const region = clamp(parse($("basicRegion").value, 1), 0.8, 1.35);
    const reserveRate = clamp(parse($("basicReserve").value, 10), 0, 30);
    const budget = Math.max(0, parse($("basicBudget").value, 1500000));
    const scope = scopePresets[scopeKey];
    const complexity = complexityFactors[complexityKey];
    const covering = coveringFactors[coveringKey];
    const factor = complexity.factor * region;
    const softFactor = (1 + (complexity.factor - 1) * 0.65) * region;
    const detailFactor = (1 + (complexity.factor - 1) * 1.35) * region;
    const rates = { ...scope.rates, covering: scope.rates.covering * covering.factor };
    const items = [
      item("Krov a dřevěné konstrukce", "structure", `${number(area)} m²`, `${money(rates.structure)} / m²`, area * rates.structure * factor),
      item("Pojistná hydroizolace, latě a kontralatě", "envelope", `${number(area)} m²`, `${money(rates.underlay)} / m²`, area * rates.underlay * factor),
      item(`Krytina – ${covering.label.toLowerCase()}`, "envelope", `${number(area)} m²`, `${money(rates.covering)} / m²`, area * rates.covering * factor),
      item("Tepelná izolace a vnitřní vrstvy", "envelope", `${number(area)} m²`, `${money(rates.insulation)} / m²`, area * rates.insulation * softFactor),
      item("Klempířské prvky, okapy a detaily", "envelope", `${number(area)} m²`, `${money(rates.flashings)} / m²`, area * rates.flashings * detailFactor),
      item("Demontáž a odvoz", "work", `${number(area)} m²`, `${money(rates.demolition)} / m²`, area * rates.demolition * factor),
      item("Lešení, doprava a staveništní logistika", "work", `${number(area)} m²`, `${money(rates.scaffolding)} / m²`, area * rates.scaffolding * factor),
    ].filter((row) => row.cost > 0);
    return finalize({
      mode: "basic",
      area,
      budget,
      reserveRate,
      items,
      scopeKey,
      scopeLabel: scope.label,
      complexityKey,
      complexityLabel: complexity.label,
      detailLabel: covering.label,
      workFactor: factor,
    });
  }

  function proModel() {
    const area = clamp(parse($("proArea").value, 160), 1, 5000);
    const complexityKey = $("proComplexity").value;
    const shapeFactor = complexityFactors[complexityKey]?.factor || 1;
    const slopeFactor = slopeFactors[$("proSlope").value] || 1;
    const accessFactor = accessFactors[$("proAccess").value] || 1;
    const region = clamp(parse($("proRegion").value, 1), 0.7, 1.5);
    const reserveRate = clamp(parse($("proReserve").value, 10), 0, 50);
    const budget = Math.max(0, parse($("proBudget").value, 1500000));
    const workFactor = shapeFactor * slopeFactor * accessFactor * region;
    const softFactor = (1 + (workFactor / region - 1) * 0.65) * region;
    const detailFactor = (1 + (workFactor / region - 1) * 1.25) * region;
    const rate = (id) => Math.max(0, parse($(id).value, 0));
    const include = (id) => $(id).checked;
    const windows = Math.max(0, Math.round(parse($("proWindows").value, 0)));
    const chimneys = Math.max(0, Math.round(parse($("proChimneys").value, 1)));
    const gutterLength = Math.max(0, parse($("proGutterLength").value, 28));
    const items = [];
    if (include("incStructure")) items.push(item("Krov a dřevěné konstrukce", "structure", `${number(area)} m²`, `${money(rate("proStructureRate"))} / m²`, area * rate("proStructureRate") * workFactor));
    if (include("incUnderlay")) items.push(item("Pojistná hydroizolace, latě a kontralatě", "envelope", `${number(area)} m²`, `${money(rate("proUnderlayRate"))} / m²`, area * rate("proUnderlayRate") * workFactor));
    if (include("incCovering")) items.push(item("Krytina, systémové doplňky a montáž", "envelope", `${number(area)} m²`, `${money(rate("proCoveringRate"))} / m²`, area * rate("proCoveringRate") * workFactor));
    if (include("incInsulation")) items.push(item("Tepelná izolace a vnitřní vrstvy", "envelope", `${number(area)} m²`, `${money(rate("proInsulationRate"))} / m²`, area * rate("proInsulationRate") * softFactor));
    if (include("incFlashings")) items.push(item("Klempířské prvky a oplechování", "envelope", `${number(area)} m²`, `${money(rate("proFlashingsRate"))} / m²`, area * rate("proFlashingsRate") * detailFactor));
    if (include("incDemolition")) items.push(item("Demontáž a odvoz původní skladby", "work", `${number(area)} m²`, `${money(rate("proDemolitionRate"))} / m²`, area * rate("proDemolitionRate") * workFactor));
    if (include("incScaffolding")) items.push(item("Lešení, doprava a logistika", "work", `${number(area)} m²`, `${money(rate("proScaffoldingRate"))} / m²`, area * rate("proScaffoldingRate") * workFactor));
    if (windows > 0) items.push(item("Střešní okna včetně osazení", "details", `${windows} ks`, `${money(rate("proWindowRate"))} / ks`, windows * rate("proWindowRate") * region));
    if (chimneys > 0) items.push(item("Komíny a prostupy střechou", "details", `${chimneys} ks`, `${money(rate("proChimneyRate"))} / ks`, chimneys * rate("proChimneyRate") * region));
    if (gutterLength > 0) items.push(item("Žlaby a svody", "details", `${number(gutterLength, 1)} m`, `${money(rate("proGutterRate"))} / m`, gutterLength * rate("proGutterRate") * region));
    const other = rate("proOtherCost");
    if (other > 0) items.push(item("Ostatní projektové a rozpočtové položky", "other", "paušál", money(other), other));
    return finalize({
      mode: "pro",
      area,
      budget,
      reserveRate,
      items,
      scopeKey: "pro",
      scopeLabel: "Vlastní položkový rozsah",
      complexityKey,
      complexityLabel: complexityFactors[complexityKey]?.label || "Vlastní",
      detailLabel: `${countLabel(windows, "okno", "okna", "oken")} · ${countLabel(chimneys, "prostup", "prostupy", "prostupů")}`,
      workFactor,
    });
  }

  function finalize(model) {
    const baseCost = model.items.reduce((sum, row) => sum + row.cost, 0);
    const reserveCost = baseCost * model.reserveRate / 100;
    const totalCost = baseCost + reserveCost;
    const budgetGap = model.budget > 0 ? model.budget - totalCost : 0;
    const budgetUse = model.budget > 0 ? totalCost / model.budget * 100 : 0;
    return {
      ...model,
      baseCost,
      reserveCost,
      totalCost,
      budgetGap,
      budgetUse,
      pricePerM2: model.area > 0 ? totalCost / model.area : 0,
    };
  }

  function interpretation(model) {
    if (!model.items.length || model.totalCost <= 0) {
      return {
        title: "Vyberte alespoň jednu rozpočtovou položku",
        text: "PRO režim neobsahuje žádnou aktivní část střechy. Zapněte konstrukci, střešní plášť, izolaci nebo jinou položku.",
      };
    }
    if (model.budget > 0 && model.budgetGap < 0) {
      return {
        title: "Model překračuje zadaný rozpočet",
        text: `Do limitu ${money(model.budget)} chybí ${money(Math.abs(model.budgetGap))}. Nejdřív ověřte úplnost a sazby největší etapy; nesnižujte rezervu jen proto, aby se číslo formálně vešlo.`,
      };
    }
    if (model.budget > 0 && model.budgetUse >= 90) {
      return {
        title: "Rozpočtový prostor je už těsný",
        text: `Model využívá ${number(model.budgetUse, 1)} % limitu a ponechává ${money(model.budgetGap)}. Před podpisem smlouvy prověřte platnost cen, DPH, vícepráce a platební milníky.`,
      };
    }
    const detailShare = model.items.filter((row) => ["details", "work", "other"].includes(row.category)).reduce((sum, row) => sum + row.cost, 0) / model.baseCost;
    if (model.complexityKey === "complex" || model.workFactor >= 1.22 || detailShare > 0.28) {
      return {
        title: "Rozpočet je citlivý na pracnost a detaily",
        text: `Model ${model.scopeLabel.toLowerCase()} vychází na ${money(model.totalCost)}. U členité nebo obtížně přístupné střechy si nechte zvlášť rozepsat nároží, úžlabí, prostupy, lešení, oplechování a ochranu stavby během realizace.`,
      };
    }
    if (model.reserveRate < 8) {
      return {
        title: "Rezerva je spíše nízká",
        text: `Zadaná rezerva ${number(model.reserveRate)} % nechává malý prostor pro skryté vady, změnu rozsahu nebo chybějící detail nabídky. Nezvyšujte ji mechanicky – nejprve ověřte, co v rozpočtu opravdu je.`,
      };
    }
    return {
      title: "Model je připravený pro porovnání nabídek",
      text: `Pro plochu ${number(model.area)} m² vychází ${money(model.pricePerM2)} za m² včetně rezervy. Porovnávejte jen nabídky se stejnou skladbou, rozsahem práce, dopravou, lešením a daňovým režimem.`,
    };
  }

  function renderBreakdown(model) {
    const rows = model.items.map((row) => {
      const share = model.baseCost > 0 ? row.cost / model.baseCost * 100 : 0;
      return `<tr><td>${row.name}</td><td>${row.basis}</td><td>${row.rate}</td><td>${money(row.cost)}</td><td>${number(share, 1)} %</td></tr>`;
    });
    rows.push(`<tr class="breakdown-total"><td>Základ rozpočtu</td><td>bez rezervy</td><td>—</td><td>${money(model.baseCost)}</td><td>100 %</td></tr>`);
    rows.push(`<tr class="breakdown-reserve"><td>Rozpočtová rezerva</td><td>${number(model.reserveRate)} %</td><td>základ × rezerva</td><td>${money(model.reserveCost)}</td><td>${number(model.totalCost ? model.reserveCost / model.totalCost * 100 : 0, 1)} % z celku</td></tr>`);
    $("breakdownBody").innerHTML = rows.join("");
  }

  function renderScenarios(model) {
    const scenario = (id, multiplier, reserve = model.reserveRate) => {
      const base = model.baseCost * multiplier;
      const total = base * (1 + reserve / 100);
      $(id).textContent = money(total);
    };
    $("scenarioNoReserve").textContent = money(model.baseCost);
    $("scenarioCurrent").textContent = money(model.totalCost);
    scenario("scenarioPlusTen", 1.1);
    scenario("scenarioPlusTwenty", 1.2);
  }

  function renderBudget(model) {
    const panel = $("budgetPanel");
    panel.classList.remove("is-within", "is-close", "is-over", "is-empty");
    if (model.budget <= 0) {
      panel.classList.add("is-empty");
      $("budgetStatus").textContent = "Limit není zadaný";
      $("budgetGap").textContent = "volitelné";
      $("budgetText").textContent = "Doplňte vlastní rozpočet v upřesnění Basic režimu nebo v PRO vstupu. Výpočet potom ukáže, zda máte rezervu.";
      $("budgetProgress").style.width = "0%";
      $("heroBudgetStatus").textContent = "nezadaný";
      $("heroBudgetGap").textContent = "—";
      return;
    }
    const over = model.budgetGap < 0;
    const close = !over && model.budgetUse >= 90;
    panel.classList.add(over ? "is-over" : close ? "is-close" : "is-within");
    $("budgetStatus").textContent = over ? "Nad rozpočtem" : close ? "Těsně pod limitem" : "V limitu s rezervou";
    $("budgetGap").textContent = over ? `chybí ${money(Math.abs(model.budgetGap))}` : `zbývá ${money(model.budgetGap)}`;
    $("budgetText").textContent = over
      ? `Model využívá ${number(model.budgetUse, 1)} % limitu ${money(model.budget)}. Ověřte největší etapu, rozsah nabídky a případnou změnu standardu.`
      : `Model využívá ${number(model.budgetUse, 1)} % limitu ${money(model.budget)}. Volná částka není totéž co rezerva na chybějící položky.`;
    $("budgetProgress").style.width = `${clamp(model.budgetUse, 0, 100)}%`;
    $("heroBudgetStatus").textContent = over ? "nad limitem" : close ? "těsný" : "v limitu";
    $("heroBudgetGap").textContent = over ? `−${compactMoney(Math.abs(model.budgetGap))}` : `+${compactMoney(model.budgetGap)}`;
  }

  function renderStages(model) {
    const stages = [
      { key: "Structure", label: "konstrukce", categories: ["structure"] },
      { key: "Envelope", label: "funkční plášť", categories: ["envelope"] },
      { key: "Details", label: "detaily", categories: ["details", "other"] },
      { key: "Work", label: "práce a logistika", categories: ["work"] },
    ].map((stage) => ({
      ...stage,
      value: model.items.filter((row) => stage.categories.includes(row.category)).reduce((sum, row) => sum + row.cost, 0),
    }));
    stages.forEach((stage) => {
      const share = model.baseCost > 0 ? stage.value / model.baseCost * 100 : 0;
      $(`stage${stage.key}Value`).textContent = money(stage.value);
      $(`stage${stage.key}Bar`).style.width = `${clamp(share, 0, 100)}%`;
      $(`stage${stage.key}Share`).textContent = `${number(share, 1)} % základu`;
    });
    const leader = stages.reduce((largest, stage) => stage.value > largest.value ? stage : largest, stages[0]);
    const leaderShare = model.baseCost > 0 ? leader.value / model.baseCost * 100 : 0;
    $("stageLeader").textContent = `${leader.label.charAt(0).toUpperCase()}${leader.label.slice(1)} · ${money(leader.value)}`;
    $("stageAdvice").textContent = leader.value > 0
      ? `Tato etapa tvoří ${number(leaderShare, 1)} % základu. V nabídce u ní nejdřív ověřte množství, jednotkové sazby, rozsah montáže a související doplňky.`
      : "Zapněte alespoň jednu položku a dashboard označí část, kterou má největší smysl prověřit.";
  }

  function renderHero(model) {
    $("heroTotalCost").textContent = compactMoney(model.totalCost);
    $("heroArea").textContent = `${number(model.area)} m²`;
    $("heroPrice").textContent = `${money(model.pricePerM2)} / m²`;
    $("heroReserve").textContent = `${number(model.reserveRate)} %`;
    $("heroScope").textContent = model.mode === "pro" ? "PRO model" : model.scopeLabel;
    const visual = document.querySelector(".roof-visual");
    visual?.classList.toggle("is-complex", model.complexityKey === "complex");
    visual?.classList.toggle("is-simple", model.complexityKey === "simple");
  }

  function render() {
    $("basicReserveOutput").textContent = `${number(parse($("basicReserve").value, 10))} %`;
    const model = form.dataset.mode === "pro" ? proModel() : basicModel();
    const insight = interpretation(model);
    $("totalCost").value = money(model.totalCost);
    $("pricePerM2").textContent = `${money(model.pricePerM2)} / m²`;
    $("baseCost").textContent = money(model.baseCost);
    $("reserveCost").textContent = money(model.reserveCost);
    $("areaSummary").textContent = `${number(model.area)} m²`;
    $("scopeSummary").textContent = model.scopeLabel;
    $("complexitySummary").textContent = model.complexityLabel;
    $("detailSummary").textContent = model.detailLabel;
    $("resultInsightTitle").textContent = insight.title;
    $("resultInsightText").textContent = insight.text;

    const structure = model.items.filter((row) => row.category === "structure").reduce((sum, row) => sum + row.cost, 0);
    const envelope = model.items.filter((row) => row.category !== "structure").reduce((sum, row) => sum + row.cost, 0);
    const denominator = model.totalCost || 1;
    $("gaugeStructure").style.width = `${structure / denominator * 100}%`;
    $("gaugeEnvelope").style.width = `${envelope / denominator * 100}%`;
    $("gaugeReserve").style.width = `${model.reserveCost / denominator * 100}%`;
    $("gaugeStructureLabel").textContent = `${number(structure / denominator * 100, 1)} %`;
    $("gaugeEnvelopeLabel").textContent = `${number(envelope / denominator * 100, 1)} %`;
    $("gaugeReserveLabel").textContent = `${number(model.reserveCost / denominator * 100, 1)} %`;

    $("advancedResult").hidden = model.mode !== "pro";
    if (model.mode === "pro") {
      $("proWorkFactor").textContent = `${number(model.workFactor, 2)}×`;
      $("proActiveItems").textContent = `${model.items.length}`;
      $("proDetailsCost").textContent = money(model.items.filter((row) => ["details", "other"].includes(row.category)).reduce((sum, row) => sum + row.cost, 0));
      $("proReserveShare").textContent = `${number(model.totalCost ? model.reserveCost / model.totalCost * 100 : 0, 1)} %`;
    }

    renderBreakdown(model);
    renderScenarios(model);
    renderBudget(model);
    renderStages(model);
    renderHero(model);
    form._lastModel = model;
  }

  function syncBasicToPro() {
    const basic = basicModel();
    const scope = scopePresets[basic.scopeKey] || scopePresets.new;
    const covering = coveringFactors[$("basicCovering").value] || coveringFactors.ceramic;
    $("proArea").value = number(basic.area);
    $("proComplexity").value = basic.complexityKey;
    $("proRegion").value = $("basicRegion").value;
    $("proReserve").value = number(basic.reserveRate);
    $("proBudget").value = number(basic.budget);
    $("proStructureRate").value = scope.rates.structure;
    $("proUnderlayRate").value = scope.rates.underlay;
    $("proCoveringRate").value = Math.round(scope.rates.covering * covering.factor);
    $("proInsulationRate").value = scope.rates.insulation;
    $("proFlashingsRate").value = scope.rates.flashings;
    $("proDemolitionRate").value = scope.rates.demolition;
    $("proScaffoldingRate").value = scope.rates.scaffolding;
    $("incStructure").checked = scope.rates.structure > 0;
    $("incUnderlay").checked = scope.rates.underlay > 0;
    $("incCovering").checked = scope.rates.covering > 0;
    $("incInsulation").checked = scope.rates.insulation > 0;
    $("incFlashings").checked = scope.rates.flashings > 0;
    $("incDemolition").checked = scope.rates.demolition > 0;
    $("incScaffolding").checked = scope.rates.scaffolding > 0;
  }

  modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.modeButton)));
  form.querySelectorAll("input, select").forEach((control) => {
    control.addEventListener("input", render);
    control.addEventListener("change", render);
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    if (window.matchMedia("(max-width: 760px)").matches) $("vysledek")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  form.querySelectorAll("[data-open-pro]").forEach((button) => button.addEventListener("click", () => {
    syncBasicToPro();
    setMode("pro", true);
  }));
  $("resetBasic").addEventListener("click", () => {
    form.reset();
    setMode("basic");
  });
  $("resetPro").addEventListener("click", () => {
    form.reset();
    setMode("pro");
  });
  $("copyResult").addEventListener("click", async () => {
    const model = form._lastModel || basicModel();
    const budgetText = model.budget > 0 ? ` Rozpočtový limit ${money(model.budget)}, ${model.budgetGap < 0 ? `chybí ${money(Math.abs(model.budgetGap))}` : `zbývá ${money(model.budgetGap)}`}.` : "";
    const text = `Kalkulačka ceny střechy – ${model.scopeLabel}: ${money(model.totalCost)} celkem, ${money(model.pricePerM2)} za m², plocha ${number(model.area)} m², rezerva ${number(model.reserveRate)} %.${budgetText} Výsledek je orientační.`;
    try {
      await navigator.clipboard.writeText(text);
      $("copyResult").textContent = "Zkopírováno";
      $("copyResult").classList.add("copied");
      window.setTimeout(() => {
        $("copyResult").textContent = "Kopírovat výsledek";
        $("copyResult").classList.remove("copied");
      }, 1800);
    } catch (_) {
      window.prompt("Zkopírujte výsledek:", text);
    }
  });
  $("printResult").addEventListener("click", () => window.print());

  setMode("basic");
})();
