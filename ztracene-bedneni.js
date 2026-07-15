(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const num = (element, fallback = 0) => {
    const value = Number(element?.value);
    return Number.isFinite(value) ? value : fallback;
  };
  const ceil = value => Math.ceil(Math.max(0, value));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const fmt = (value, digits = 2) => new Intl.NumberFormat("cs-CZ", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
  const money = value => new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
  const escapeHtml = value => String(value).replace(/[&<>"]/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;"
  })[char]);

  const blockTypes = {
    15: { name: "ZB 15", width: 150, length: 500, height: 250, concrete: 8.5, pallet: 64, weight: 21.4, price: 76 },
    20: { name: "ZB 20", width: 200, length: 500, height: 250, concrete: 14, pallet: 60, weight: 25, price: 82 },
    25: { name: "ZB 25", width: 250, length: 500, height: 250, concrete: 19, pallet: 50, weight: 27, price: 90 },
    30: { name: "ZB 30", width: 300, length: 500, height: 250, concrete: 25, pallet: 40, weight: 28.7, price: 98 },
    40: { name: "ZB 40", width: 400, length: 500, height: 250, concrete: 36, pallet: 30, weight: 36.4, price: 112 }
  };

  const state = { mode: "basic", basicBlock: "20", sections: [] };
  const form = $("#formworkForm");

  function setBasicBlock(key, syncFields = true) {
    const type = blockTypes[key] || blockTypes[20];
    state.basicBlock = String(key);
    $$(".block-chip").forEach(button => button.classList.toggle("is-active", button.dataset.block === String(key)));
    if (syncFields) {
      $("#basicBlockLength").value = type.length;
      $("#basicBlockHeight").value = type.height;
      $("#basicConcreteLiters").value = type.concrete;
      $("#basicPalletSize").value = type.pallet;
      $("#basicBlockWeight").value = type.weight;
      $("#basicBlockPrice").value = type.price;
    }
    calculate();
  }

  function basicData(wasteOverride = null) {
    const length = Math.max(0, num($("#basicLength")));
    const height = Math.max(0, num($("#basicHeight")));
    const openings = Math.max(0, num($("#basicOpenings")));
    const area = Math.max(0, length * height - openings);
    const blockLengthM = Math.max(0.1, num($("#basicBlockLength"), 500) / 1000);
    const blockHeightM = Math.max(0.1, num($("#basicBlockHeight"), 250) / 1000);
    const faceArea = blockLengthM * blockHeightM;
    const piecesPerM2 = faceArea > 0 ? 1 / faceArea : 0;
    const theoreticalBlocks = area * piecesPerM2;
    const waste = wasteOverride === null ? Math.max(0, num($("#basicWaste"), 5)) : wasteOverride;
    const blocks = ceil(theoreticalBlocks * (1 + waste / 100));
    const extraBlocks = Math.max(0, blocks - ceil(theoreticalBlocks));
    const rows = height > 0 ? ceil(height / blockHeightM) : 0;
    const concreteLiters = Math.max(0, num($("#basicConcreteLiters"), 14));
    const concreteWaste = Math.max(0, num($("#basicConcreteWaste"), 5));
    const concrete = ceil(theoreticalBlocks) * concreteLiters / 1000 * (1 + concreteWaste / 100);
    const palletSize = Math.max(1, num($("#basicPalletSize"), 60));
    const pallets = ceil(blocks / palletSize);
    const blockWeight = Math.max(0, num($("#basicBlockWeight"), 25));
    const weight = blocks * blockWeight;
    const blockPrice = Math.max(0, num($("#basicBlockPrice"), 82));
    const concretePrice = Math.max(0, num($("#basicConcretePrice"), 3200));
    const blockCost = blocks * blockPrice;
    const concreteCost = concrete * concretePrice;
    return {
      name: "Zadaná stěna",
      blockName: blockTypes[state.basicBlock]?.name || `ZB ${state.basicBlock}`,
      length,
      height,
      area,
      rows,
      theoreticalBlocks,
      blocks,
      extraBlocks,
      waste,
      palletSize,
      pallets,
      concrete,
      concreteLiters,
      concreteWaste,
      weight,
      blockWeight,
      blockPrice,
      blockCost,
      concreteCost,
      total: blockCost + concreteCost
    };
  }

  function updateSectionPreset(card) {
    const key = $(".section-block", card).value;
    const type = blockTypes[key] || blockTypes[20];
    $(".section-price", card).value = type.price;
    $(".section-concrete", card).value = type.concrete;
  }

  function sectionData(card) {
    const key = $(".section-block", card).value;
    const type = blockTypes[key] || blockTypes[20];
    const length = Math.max(0, num($(".section-length", card)));
    const height = Math.max(0, num($(".section-height", card)));
    const openings = Math.max(0, num($(".section-openings", card)));
    const repeat = Math.max(1, Math.round(num($(".section-repeat", card), 1)));
    const area = Math.max(0, (length * height - openings) * repeat);
    const faceArea = type.length / 1000 * type.height / 1000;
    const theoreticalBlocks = area / faceArea;
    const waste = Math.max(0, num($(".section-waste", card), 5));
    const blocks = ceil(theoreticalBlocks * (1 + waste / 100));
    const rows = height > 0 ? ceil(height / (type.height / 1000)) : 0;
    const palletSize = type.pallet;
    const pallets = ceil(blocks / palletSize);
    const blockPrice = Math.max(0, num($(".section-price", card), type.price));
    const concreteLiters = Math.max(0, num($(".section-concrete", card), type.concrete));
    const blockCost = blocks * blockPrice;
    const weight = blocks * type.weight;
    return {
      name: $(".section-name", card).value.trim() || "Úsek",
      blockName: type.name,
      key,
      length,
      height,
      repeat,
      area,
      rows,
      theoreticalBlocks,
      blocks,
      waste,
      palletSize,
      pallets,
      blockPrice,
      blockCost,
      concreteLiters,
      concreteBase: ceil(theoreticalBlocks) * concreteLiters / 1000,
      weight
    };
  }

  function advancedData() {
    const sections = $$(".section-card", $("#sectionsList")).map(sectionData);
    const blocks = sections.reduce((sum, item) => sum + item.blocks, 0);
    const theoreticalBlocks = sections.reduce((sum, item) => sum + item.theoreticalBlocks, 0);
    const area = sections.reduce((sum, item) => sum + item.area, 0);
    const blocksByType = sections.reduce((map, item) => { map[item.key] = (map[item.key] || 0) + item.blocks; return map; }, {});
    const pallets = Object.entries(blocksByType).reduce((sum, [key, count]) => sum + ceil(count / (blockTypes[key]?.pallet || 1)), 0);
    const weight = sections.reduce((sum, item) => sum + item.weight, 0);
    const blockCost = sections.reduce((sum, item) => sum + item.blockCost, 0);
    const concreteBase = sections.reduce((sum, item) => sum + item.concreteBase, 0);
    const concreteWaste = Math.max(0, num($("#proConcreteWaste"), 5));
    const concreteRequired = concreteBase * (1 + concreteWaste / 100);
    const concreteEnabled = $("#useConcrete").checked;
    const minimumVolume = Math.max(0, num($("#minConcreteVolume"), 1));
    const billedConcrete = concreteEnabled ? Math.max(concreteRequired, minimumVolume) : 0;
    const concretePrice = Math.max(0, num($("#proConcretePrice"), 3200));
    const concreteCost = billedConcrete * concretePrice;

    let rebar = { horizontalLength: 0, verticalLength: 0, totalLength: 0, weight: 0, materialCost: 0 };
    if ($("#useRebar").checked) {
      const diameter = Math.max(1, num($("#rebarDiameter"), 10));
      const horizontalBars = Math.max(0, num($("#horizontalBars"), 2));
      const verticalSpacing = Math.max(0.1, num($("#verticalSpacing"), 0.5));
      const anchorLength = Math.max(0, num($("#anchorLength"), 0.5));
      const waste = Math.max(0, num($("#rebarWaste"), 10));
      const horizontalLength = sections.reduce((sum, section) => sum + section.length * section.repeat * section.rows * horizontalBars, 0);
      const verticalLength = sections.reduce((sum, section) => {
        const barsPerWall = ceil(section.length / verticalSpacing) + 1;
        return sum + barsPerWall * section.repeat * (section.height + anchorLength);
      }, 0);
      const totalLength = (horizontalLength + verticalLength) * (1 + waste / 100);
      const kgPerM = diameter * diameter / 162;
      const weightRebar = totalLength * kgPerM;
      rebar = {
        horizontalLength,
        verticalLength,
        totalLength,
        weight: weightRebar,
        materialCost: weightRebar * Math.max(0, num($("#rebarPrice"), 32))
      };
    }

    const maxRows = sections.reduce((max, section) => Math.max(max, section.rows), 0);
    const rowsPerPour = Math.max(1, Math.round(num($("#rowsPerPour"), 4)));
    const stages = maxRows ? ceil(maxRows / rowsPerPour) : 0;

    const transportEnabled = $("#useTransport").checked;
    const concreteDelivery = transportEnabled && concreteEnabled ? Math.max(0, num($("#concreteDelivery"), 2500)) : 0;
    const pumpCost = transportEnabled && concreteEnabled ? Math.max(0, num($("#pumpCost"))) : 0;
    const blockDelivery = transportEnabled ? Math.max(0, num($("#blockDelivery"), 2200)) : 0;
    const handlingCost = transportEnabled ? Math.max(0, num($("#handlingCost"), 800)) : 0;
    const transportCost = concreteDelivery + pumpCost + blockDelivery + handlingCost;

    let laborCost = 0;
    let layingCost = 0;
    let rebarLaborCost = 0;
    let pourLaborCost = 0;
    if ($("#useLabor").checked) {
      layingCost = blocks * Math.max(0, num($("#layingRate"), 55));
      rebarLaborCost = rebar.weight * Math.max(0, num($("#rebarLaborRate"), 22));
      pourLaborCost = concreteRequired * Math.max(0, num($("#pourLaborRate"), 1400));
      laborCost = layingCost + rebarLaborCost + pourLaborCost + Math.max(0, num($("#otherLabor"), 1500));
    }

    const levelingCost = Math.max(0, num($("#levelingCost"), 800));
    const otherMaterial = Math.max(0, num($("#otherMaterial"), 1000));
    const otherCost = levelingCost + otherMaterial;
    const materialCost = blockCost + concreteCost + rebar.materialCost + otherCost;
    const total = materialCost + transportCost + laborCost;

    return {
      sections,
      blocks,
      theoreticalBlocks,
      area,
      pallets,
      weight,
      blockCost,
      concreteBase,
      concreteRequired,
      billedConcrete,
      concreteCost,
      rebar,
      stages,
      transportCost,
      concreteDelivery,
      pumpCost,
      blockDelivery,
      handlingCost,
      layingCost,
      rebarLaborCost,
      pourLaborCost,
      laborCost,
      levelingCost,
      otherMaterial,
      otherCost,
      materialCost,
      total
    };
  }

  function renderScenarios(base) {
    const wastes = [3, 5, 8, 10];
    $("#scenarioGrid").innerHTML = wastes.map(waste => {
      const data = basicData(waste);
      return `<article class="scenario-card ${Math.abs(waste - base.waste) < 0.1 ? "is-current" : ""}"><span>Rezerva ${waste} %</span><strong>${fmt(data.blocks, 0)} ks</strong><small>${fmt(data.pallets, 0)} palet. místa · ${fmt(data.concrete)} m³</small></article>`;
    }).join("");
  }

  function renderRows(sections) {
    $("#breakdownBody").innerHTML = sections.map(item => `<tr><td>${escapeHtml(item.name)} <small>${escapeHtml(item.blockName)}</small></td><td>${fmt(item.area)} m²</td><td>${fmt(item.rows, 0)}</td><td>${fmt(item.blocks, 0)} ks</td><td>${fmt(item.pallets, 0)}</td><td>${fmt(item.concrete ?? item.concreteBase)} m³</td><td>${money(item.blockCost)}</td></tr>`).join("");
  }

  function renderCosts(items) {
    const visible = items.filter(item => item.value > 0);
    $("#costBreakdown").innerHTML = visible.length ? visible.map(item => `<div><span>${escapeHtml(item.label)}</span><strong>${money(item.value)}</strong></div>`).join("") : `<div><span>Žádné náklady</span><strong>0 Kč</strong></div>`;
  }

  function updateHero(blocks, concrete, pallets) {
    $("[data-hero-blocks]").textContent = `${fmt(blocks, 0)} ks`;
    $("[data-hero-concrete]").textContent = `${fmt(concrete)} m³`;
    $("[data-hero-pallets]").textContent = fmt(pallets, 0);
  }

  function renderBasic(data) {
    $("#resultModeBadge").textContent = "Základní režim";
    $("#resultBlockBadge").textContent = data.blockName;
    $("#resultBlocks").textContent = `${fmt(data.blocks, 0)} ks`;
    $("#resultConcreteLead").textContent = `Zálivka ${fmt(data.concrete)} m³`;
    $("#resultMainText").textContent = `Pro stěnu o čisté ploše ${fmt(data.area)} m² vychází po rezervě ${fmt(data.blocks, 0)} celých tvárnic.`;
    $("#resultNetBlocks").textContent = `${fmt(ceil(data.theoreticalBlocks), 0)} ks`;
    $("#resultExtraBlocks").textContent = `${fmt(data.extraBlocks, 0)} ks`;
    $("#blockGaugeFill").style.width = `${clamp(data.theoreticalBlocks / Math.max(1, data.blocks) * 100, 5, 100)}%`;
    $("#resultRows").textContent = fmt(data.rows, 0);
    $("#resultPallets").textContent = fmt(data.pallets, 0);
    $("#resultWeight").textContent = `${fmt(data.weight, 0)} kg`;
    $("#resultMaterialCost").textContent = money(data.total);
    $("#advancedResult").hidden = true;
    $("#insightTitle").textContent = data.blocks ? "Zkontrolujte skutečný objem dutin" : "Zadejte platné rozměry";
    $("#insightText").textContent = data.blocks ? `Předvolba počítá s ${fmt(data.concreteLiters, 1)} litru betonu na tvárnici. Před objednávkou ji porovnejte s technickým listem vybraného výrobku.` : "Délka a výška stěny musí být větší než nula.";
    renderScenarios(data);
    renderRows([{ ...data, concrete: data.concrete }]);
    renderCosts([
      { label: "Tvárnice", value: data.blockCost },
      { label: "Zálivkový beton", value: data.concreteCost }
    ]);
    updateHero(data.blocks, data.concrete, data.pallets);
  }

  function renderAdvanced(data) {
    const extraBlocks = Math.max(0, data.blocks - ceil(data.theoreticalBlocks));
    $("#resultModeBadge").textContent = "PRO projekt";
    $("#resultBlockBadge").textContent = `${data.sections.length} ÚSEKY`;
    $("#resultBlocks").textContent = `${fmt(data.blocks, 0)} ks`;
    $("#resultConcreteLead").textContent = `Zálivka ${fmt(data.concreteRequired)} m³`;
    $("#resultMainText").textContent = `Projekt obsahuje ${data.sections.length} úseků, ${fmt(data.area)} m² bednicí stěny a orientační rozpočet ${money(data.total)}.`;
    $("#resultNetBlocks").textContent = `${fmt(ceil(data.theoreticalBlocks), 0)} ks`;
    $("#resultExtraBlocks").textContent = `${fmt(extraBlocks, 0)} ks`;
    $("#blockGaugeFill").style.width = `${clamp(data.theoreticalBlocks / Math.max(1, data.blocks) * 100, 5, 100)}%`;
    $("#resultRows").textContent = fmt(data.sections.reduce((max, item) => Math.max(max, item.rows), 0), 0);
    $("#resultPallets").textContent = fmt(data.pallets, 0);
    $("#resultWeight").textContent = `${fmt(data.weight, 0)} kg`;
    $("#resultMaterialCost").textContent = money(data.materialCost);
    $("#resultRebar").textContent = `${fmt(data.rebar.weight, 0)} kg`;
    $("#resultStages").textContent = fmt(data.stages, 0);
    $("#resultLabor").textContent = money(data.laborCost);
    $("#resultTotal").textContent = money(data.total);
    $("#advancedResult").hidden = false;
    $("#insightTitle").textContent = data.billedConcrete > data.concreteRequired + 0.001 ? "Objednávkové minimum zvyšuje cenu betonu" : "Projekt je rozdělen na samostatné úseky";
    $("#insightText").textContent = data.billedConcrete > data.concreteRequired + 0.001 ? `Skutečná potřeba je ${fmt(data.concreteRequired)} m³, ale náklad počítá minimálně ${fmt(data.billedConcrete)} m³. Rozdíl ověřte s betonárnou.` : `Nejvyšší úsek má ${fmt(data.sections.reduce((max, item) => Math.max(max, item.rows), 0), 0)} řad. Při nastaveném limitu vycházejí přibližně ${fmt(data.stages, 0)} etapy betonáže.`;
    renderRows(data.sections.map(item => ({ ...item, concrete: item.concreteBase * (1 + Math.max(0, num($("#proConcreteWaste"), 5)) / 100) })));
    renderCosts([
      { label: "Tvárnice", value: data.blockCost },
      { label: "Zálivkový beton", value: data.concreteCost },
      { label: "Výztuž", value: data.rebar.materialCost },
      { label: "Zakládací malta / vyrovnání", value: data.levelingCost },
      { label: "Ostatní materiál", value: data.otherMaterial },
      { label: "Doprava a manipulace", value: data.transportCost },
      { label: "Práce", value: data.laborCost }
    ]);
    updateHero(data.blocks, data.concreteRequired, data.pallets);
  }

  function calculate() {
    if (state.mode === "advanced") renderAdvanced(advancedData());
    else renderBasic(basicData());
  }

  function setMode(mode, sync = true) {
    state.mode = mode;
    document.body.dataset.calculatorMode = mode;
    form.dataset.mode = mode;
    $$(".mode-button").forEach(button => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    $("#basicCalculation").hidden = mode !== "basic";
    $("#advancedCalculation").hidden = mode !== "advanced";
    if (mode === "advanced" && sync && !state.sections.length) syncBasicToAdvanced();
    calculate();
  }

  function createSection(values = {}) {
    const template = $("#sectionTemplate").content.firstElementChild.cloneNode(true);
    $(".section-name", template).value = values.name || `Úsek ${state.sections.length + 1}`;
    $(".section-length", template).value = values.length ?? 8;
    $(".section-height", template).value = values.height ?? 1;
    $(".section-openings", template).value = values.openings ?? 0;
    $(".section-repeat", template).value = values.repeat ?? 1;
    $(".section-block", template).value = values.block || "20";
    $(".section-waste", template).value = values.waste ?? 5;
    updateSectionPreset(template);
    if (values.price !== undefined) $(".section-price", template).value = values.price;
    if (values.concrete !== undefined) $(".section-concrete", template).value = values.concrete;
    $(".section-block", template).addEventListener("change", () => {
      updateSectionPreset(template);
      calculate();
    });
    $(".remove-section", template).addEventListener("click", () => {
      if ($$(".section-card", $("#sectionsList")).length <= 1) return;
      template.remove();
      state.sections = $$(".section-card", $("#sectionsList"));
      renumberSections();
      calculate();
    });
    template.addEventListener("input", calculate);
    template.addEventListener("change", calculate);
    $("#sectionsList").append(template);
    state.sections = $$(".section-card", $("#sectionsList"));
    renumberSections();
    return template;
  }

  function renumberSections() {
    $$(".section-card", $("#sectionsList")).forEach((card, index) => {
      $(".section-index", card).textContent = `Úsek ${index + 1}`;
    });
  }

  function clearSections() {
    $("#sectionsList").innerHTML = "";
    state.sections = [];
  }

  function syncBasicToAdvanced() {
    clearSections();
    const data = basicData();
    createSection({
      name: "Hlavní stěna",
      length: data.length,
      height: data.height,
      openings: Math.max(0, num($("#basicOpenings"))),
      repeat: 1,
      block: state.basicBlock,
      waste: data.waste,
      price: data.blockPrice,
      concrete: data.concreteLiters
    });
  }

  function resetBasic() {
    $("#basicLength").value = 8;
    $("#basicHeight").value = 1;
    $("#basicOpenings").value = 0;
    $("#basicWaste").value = 5;
    $("#basicConcretePrice").value = 3200;
    $("#basicConcreteWaste").value = 5;
    setBasicBlock("20", true);
  }

  function resetAdvanced() {
    clearSections();
    createSection({ name: "Obvodová nadezdívka", length: 8, height: 1, block: "20", waste: 5 });
    createSection({ name: "Krátký příčný úsek", length: 3.5, height: 0.75, block: "20", waste: 8 });
    $("#useConcrete").checked = true;
    $("#useTransport").checked = true;
    $("#useRebar").checked = true;
    $("#useLabor").checked = true;
    $("#proConcretePrice").value = 3200;
    $("#minConcreteVolume").value = 1;
    $("#proConcreteWaste").value = 5;
    $("#rowsPerPour").value = 4;
    $("#concreteDelivery").value = 2500;
    $("#pumpCost").value = 0;
    $("#blockDelivery").value = 2200;
    $("#handlingCost").value = 800;
    $("#rebarDiameter").value = 10;
    $("#horizontalBars").value = 2;
    $("#verticalSpacing").value = 0.5;
    $("#anchorLength").value = 0.5;
    $("#rebarWaste").value = 10;
    $("#rebarPrice").value = 32;
    $("#layingRate").value = 55;
    $("#rebarLaborRate").value = 22;
    $("#pourLaborRate").value = 1400;
    $("#otherLabor").value = 1500;
    $("#levelingCost").value = 800;
    $("#otherMaterial").value = 1000;
    updateFeatureVisibility();
    calculate();
  }

  function updateFeatureVisibility() {
    const map = {
      concrete: $("#useConcrete").checked,
      transport: $("#useTransport").checked,
      rebar: $("#useRebar").checked,
      labor: $("#useLabor").checked
    };
    $$('[data-feature]').forEach(group => { group.hidden = !map[group.dataset.feature]; });
  }

  function resultText() {
    if (state.mode === "advanced") {
      const data = advancedData();
      return `Ztracené bednění: ${fmt(data.blocks, 0)} tvárnic, ${fmt(data.pallets, 0)} paletových míst, ${fmt(data.concreteRequired)} m³ zálivkového betonu, ${fmt(data.rebar.weight, 0)} kg orientační výztuže, celkem ${money(data.total)}.`;
    }
    const data = basicData();
    return `Ztracené bednění ${data.blockName}: ${fmt(data.blocks, 0)} tvárnic, ${fmt(data.pallets, 0)} paletových míst, ${fmt(data.concrete)} m³ zálivkového betonu, materiál ${money(data.total)}.`;
  }

  form.addEventListener("submit", event => { event.preventDefault(); calculate(); });
  form.addEventListener("input", calculate);
  form.addEventListener("change", event => {
    if (event.target.matches(".feature-toggle input")) updateFeatureVisibility();
    calculate();
  });
  $$(".mode-button").forEach(button => button.addEventListener("click", () => setMode(button.dataset.mode, true)));
  $$(".block-chip").forEach(button => button.addEventListener("click", () => setBasicBlock(button.dataset.block, true)));
  $("#addSection").addEventListener("click", () => { createSection(); calculate(); });
  $("#basicReset").addEventListener("click", resetBasic);
  $("#advancedReset").addEventListener("click", resetAdvanced);
  $("#copyResult").addEventListener("click", async () => {
    const text = resultText();
    try {
      await navigator.clipboard.writeText(text);
      $("#copyResult").textContent = "Zkopírováno";
      setTimeout(() => { $("#copyResult").textContent = "Kopírovat výsledek"; }, 1300);
    } catch {
      window.prompt("Zkopírujte výsledek:", text);
    }
  });
  $("#printResult").addEventListener("click", () => window.print());

  resetAdvanced();
  setBasicBlock("20", true);
  setMode("basic", false);
})();
