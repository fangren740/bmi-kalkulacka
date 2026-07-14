(() => {
  'use strict';

  const PRESETS = {
    ceramic30: { name: 'Keramická cihla 30 cm', short: 'Keramická 30', length: 248, height: 249, width: 300, pallet: 80, weight: 14.5, price: 95, reserve: 5 },
    ceramic38: { name: 'Keramická cihla 38 cm', short: 'Keramická 38', length: 248, height: 249, width: 380, pallet: 60, weight: 18.3, price: 135, reserve: 5 },
    aerated30: { name: 'Pórobetonová tvárnice 30 cm', short: 'Pórobeton 30', length: 500, height: 250, width: 300, pallet: 40, weight: 24, price: 145, reserve: 5 },
    partition10: { name: 'Příčkovka 10 cm', short: 'Příčkovka 10', length: 599, height: 249, width: 100, pallet: 90, weight: 9, price: 70, reserve: 8 }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const numberValue = (id, fallback = 0) => {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (!el) return fallback;
    const value = Number(String(el.value).replace(',', '.'));
    return Number.isFinite(value) ? value : fallback;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ceilSafe = value => Math.max(0, Math.ceil(Number.isFinite(value) ? value : 0));
  const formatNumber = (value, digits = 0) => new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const formatMoney = value => `${formatNumber(Math.round(value))} Kč`;
  const formatArea = value => `${formatNumber(value, 2)} m²`;
  const formatVolume = value => `${formatNumber(value, 2)} m³`;
  const formatWeight = value => value >= 1000 ? `${formatNumber(value / 1000, 2)} t` : `${formatNumber(value)} kg`;
  const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

  const form = $('#brickForm');
  const zoneList = $('#zoneList');
  let activeMode = 'basic';
  let zones = [];
  let zoneCounter = 0;
  let lastResult = null;

  function presetOptions(selected) {
    return Object.entries(PRESETS).map(([key, preset]) => `<option value="${key}"${key === selected ? ' selected' : ''}>${escapeHtml(preset.name)}</option>`).join('');
  }

  function createZone(data = {}) {
    zoneCounter += 1;
    const presetKey = data.preset && PRESETS[data.preset] ? data.preset : 'ceramic30';
    const preset = PRESETS[presetKey];
    const zone = {
      id: `zone-${zoneCounter}`,
      name: data.name || `Stěna ${zoneCounter}`,
      length: data.length ?? 6,
      height: data.height ?? 2.75,
      openings: data.openings ?? 1,
      count: data.count ?? 1,
      preset: presetKey,
      reserve: data.reserve ?? preset.reserve,
      unitLength: data.unitLength ?? preset.length,
      unitHeight: data.unitHeight ?? preset.height,
      unitWidth: data.unitWidth ?? preset.width,
      palletSize: data.palletSize ?? preset.pallet,
      unitWeight: data.unitWeight ?? preset.weight,
      unitPrice: data.unitPrice ?? preset.price
    };
    zones.push(zone);
    renderZones();
    calculate();
  }

  function zoneTemplate(zone, index) {
    return `<article class="zone-card" data-zone-id="${zone.id}">
      <div class="zone-head">
        <div class="zone-title"><span class="zone-index">${String(index + 1).padStart(2, '0')}</span><input class="zone-name" type="text" value="${escapeHtml(zone.name)}" aria-label="Název skupiny stěn"></div>
        ${zones.length > 1 ? '<button type="button" class="remove-zone">Odebrat</button>' : ''}
      </div>
      <div class="zone-grid">
        <label class="zone-field zone-field-wide"><span>Typ zdiva</span><select class="zone-preset">${presetOptions(zone.preset)}</select></label>
        <label class="zone-field"><span>Délka jedné stěny</span><input class="zone-length" type="number" min="0.1" max="500" step="0.1" value="${zone.length}"><small>metry</small></label>
        <label class="zone-field"><span>Výška</span><input class="zone-height" type="number" min="0.1" max="30" step="0.05" value="${zone.height}"><small>metry</small></label>
        <label class="zone-field"><span>Otvory celkem</span><input class="zone-openings" type="number" min="0" max="5000" step="0.1" value="${zone.openings}"><small>m² za všechny stěny</small></label>
        <label class="zone-field"><span>Počet stejných stěn</span><input class="zone-count" type="number" min="1" max="500" step="1" value="${zone.count}"><small>opakování</small></label>
        <label class="zone-field"><span>Rezerva</span><input class="zone-reserve" type="number" min="0" max="40" step="1" value="${zone.reserve}"><small>procent</small></label>
        <label class="zone-field"><span>Cena za kus</span><input class="zone-price" type="number" min="0" max="10000" step="1" value="${zone.unitPrice}"><small>Kč / ks</small></label>
      </div>
      <details class="zone-technical">
        <summary>Technické parametry prvku</summary>
        <div class="zone-tech-grid">
          <label class="zone-field"><span>Délka</span><input class="zone-unit-length" type="number" min="50" max="1500" step="1" value="${zone.unitLength}"><small>mm</small></label>
          <label class="zone-field"><span>Výška</span><input class="zone-unit-height" type="number" min="50" max="1000" step="1" value="${zone.unitHeight}"><small>mm</small></label>
          <label class="zone-field"><span>Tloušťka</span><input class="zone-unit-width" type="number" min="50" max="800" step="1" value="${zone.unitWidth}"><small>mm</small></label>
          <label class="zone-field"><span>Kusů na paletě</span><input class="zone-pallet-size" type="number" min="1" max="500" step="1" value="${zone.palletSize}"><small>ks</small></label>
          <label class="zone-field"><span>Hmotnost kusu</span><input class="zone-unit-weight" type="number" min="0.1" max="100" step="0.1" value="${zone.unitWeight}"><small>kg</small></label>
        </div>
      </details>
    </article>`;
  }

  function renderZones() {
    zoneList.innerHTML = zones.map(zoneTemplate).join('');
  }

  function readZonesFromDom() {
    const updated = [];
    $$('.zone-card', zoneList).forEach(card => {
      const id = card.dataset.zoneId;
      const previous = zones.find(zone => zone.id === id);
      if (!previous) return;
      updated.push({
        id,
        name: $('.zone-name', card).value.trim() || 'Stěna',
        preset: $('.zone-preset', card).value,
        length: numberValue($('.zone-length', card), 0),
        height: numberValue($('.zone-height', card), 0),
        openings: numberValue($('.zone-openings', card), 0),
        count: Math.max(1, Math.round(numberValue($('.zone-count', card), 1))),
        reserve: clamp(numberValue($('.zone-reserve', card), 0), 0, 40),
        unitPrice: Math.max(0, numberValue($('.zone-price', card), 0)),
        unitLength: Math.max(1, numberValue($('.zone-unit-length', card), 1)),
        unitHeight: Math.max(1, numberValue($('.zone-unit-height', card), 1)),
        unitWidth: Math.max(1, numberValue($('.zone-unit-width', card), 1)),
        palletSize: Math.max(1, Math.round(numberValue($('.zone-pallet-size', card), 1))),
        unitWeight: Math.max(0, numberValue($('.zone-unit-weight', card), 0))
      });
    });
    zones = updated;
  }

  function applyPresetToBasic(key) {
    const preset = PRESETS[key] || PRESETS.ceramic30;
    $('#basicPreset').value = key;
    $('#basicUnitLength').value = preset.length;
    $('#basicUnitHeight').value = preset.height;
    $('#basicUnitWidth').value = preset.width;
    $('#basicPalletSize').value = preset.pallet;
    $('#basicUnitWeight').value = preset.weight;
    $('#basicUnitPrice').value = preset.price;
    $$('.preset-card').forEach(button => button.classList.toggle('is-active', button.dataset.preset === key));
  }

  function applyPresetToZone(card, key) {
    const preset = PRESETS[key] || PRESETS.ceramic30;
    $('.zone-unit-length', card).value = preset.length;
    $('.zone-unit-height', card).value = preset.height;
    $('.zone-unit-width', card).value = preset.width;
    $('.zone-pallet-size', card).value = preset.pallet;
    $('.zone-unit-weight', card).value = preset.weight;
    $('.zone-price', card).value = preset.price;
    $('.zone-reserve', card).value = preset.reserve;
    readZonesFromDom();
  }

  function calculateWall(input) {
    const grossArea = Math.max(0, input.length * input.height * input.count);
    const netArea = Math.max(0, grossArea - input.openings);
    const faceArea = Math.max(0.000001, (input.unitLength / 1000) * (input.unitHeight / 1000));
    const piecesPerArea = 1 / faceArea;
    const basePiecesExact = netArea * piecesPerArea;
    const basePieces = ceilSafe(basePiecesExact);
    const pieces = ceilSafe(basePiecesExact * (1 + input.reserve / 100));
    const reservePieces = Math.max(0, pieces - basePieces);
    const fullPallets = Math.floor(pieces / input.palletSize);
    const loosePieces = pieces % input.palletSize;
    const palletPlaces = ceilSafe(pieces / input.palletSize);
    const volume = netArea * (input.unitWidth / 1000);
    const weight = pieces * input.unitWeight;
    const cost = pieces * input.unitPrice;
    const firstCourseLength = Math.max(0, input.length * input.count);
    return { ...input, grossArea, netArea, faceArea, piecesPerArea, basePiecesExact, basePieces, pieces, reservePieces, fullPallets, loosePieces, palletPlaces, volume, weight, cost, firstCourseLength };
  }

  function basicInput() {
    const presetKey = $('#basicPreset').value;
    const preset = PRESETS[presetKey] || PRESETS.ceramic30;
    return {
      id: 'basic-wall',
      name: 'Zadaná stěna',
      preset: presetKey,
      materialName: preset.name,
      materialShort: preset.short,
      length: Math.max(0, numberValue('basicLength')),
      height: Math.max(0, numberValue('basicHeight')),
      openings: Math.max(0, numberValue('basicOpenings')),
      count: 1,
      reserve: clamp(numberValue('basicReserve'), 0, 40),
      unitLength: Math.max(1, numberValue('basicUnitLength', preset.length)),
      unitHeight: Math.max(1, numberValue('basicUnitHeight', preset.height)),
      unitWidth: Math.max(1, numberValue('basicUnitWidth', preset.width)),
      palletSize: Math.max(1, Math.round(numberValue('basicPalletSize', preset.pallet))),
      unitWeight: Math.max(0, numberValue('basicUnitWeight', preset.weight)),
      unitPrice: Math.max(0, numberValue('basicUnitPrice', preset.price))
    };
  }

  function advancedInputs() {
    readZonesFromDom();
    return zones.map(zone => {
      const preset = PRESETS[zone.preset] || PRESETS.ceramic30;
      return { ...zone, materialName: preset.name, materialShort: preset.short };
    });
  }

  function buildProject(mode) {
    const walls = mode === 'advanced' ? advancedInputs().map(calculateWall) : [calculateWall(basicInput())];
    const totals = walls.reduce((sum, wall) => {
      sum.grossArea += wall.grossArea;
      sum.netArea += wall.netArea;
      sum.basePieces += wall.basePieces;
      sum.pieces += wall.pieces;
      sum.reservePieces += wall.reservePieces;
      sum.palletPlaces += wall.palletPlaces;
      sum.volume += wall.volume;
      sum.weight += wall.weight;
      sum.unitsCost += wall.cost;
      sum.firstCourseLength += wall.firstCourseLength;
      return sum;
    }, { grossArea: 0, netArea: 0, basePieces: 0, pieces: 0, reservePieces: 0, palletPlaces: 0, volume: 0, weight: 0, unitsCost: 0, firstCourseLength: 0 });

    let mortarKg = 0;
    let foundationKg = 0;
    let mortarBags = 0;
    let mortarCost = 0;
    let deliveryTrips = 0;
    let deliveryCost = 0;
    let handlingCost = 0;
    let laborCost = 0;
    let lintelCost = 0;
    let otherCosts = 0;
    let deposit = 0;

    if (mode === 'advanced') {
      const bagWeight = Math.max(1, numberValue('mortarBagWeight', 25));
      const bagPrice = Math.max(0, numberValue('mortarBagPrice', 0));
      if ($('#includeMortar').checked) mortarKg = totals.volume * Math.max(0, numberValue('mortarConsumption', 0));
      if ($('#includeFoundationMortar').checked) foundationKg = totals.firstCourseLength * Math.max(0, numberValue('foundationConsumption', 0));
      mortarBags = ceilSafe((mortarKg + foundationKg) / bagWeight);
      mortarCost = mortarBags * bagPrice;
      if ($('#includeDelivery').checked) {
        const capacity = Math.max(1, numberValue('deliveryCapacity', 1));
        deliveryTrips = ceilSafe(totals.palletPlaces / capacity);
        deliveryCost = deliveryTrips * Math.max(0, numberValue('deliveryPrice', 0));
      }
      handlingCost = totals.palletPlaces * Math.max(0, numberValue('handlingPerPallet', 0));
      deposit = totals.palletPlaces * Math.max(0, numberValue('palletDeposit', 0));
      if ($('#includeLabor').checked) laborCost = totals.netArea * Math.max(0, numberValue('laborPerArea', 0));
      if ($('#includeLintels').checked) lintelCost = Math.max(0, Math.round(numberValue('lintelCount', 0))) * Math.max(0, numberValue('lintelPrice', 0));
      otherCosts = Math.max(0, numberValue('otherCosts', 0));
    }

    const costWithoutDeposit = totals.unitsCost + mortarCost + deliveryCost + handlingCost + laborCost + lintelCost + otherCosts;
    const totalCost = costWithoutDeposit + deposit;
    return { mode, walls, totals, mortarKg, foundationKg, mortarBags, mortarCost, deliveryTrips, deliveryCost, handlingCost, laborCost, lintelCost, otherCosts, deposit, costWithoutDeposit, totalCost };
  }

  function palletDescription(wall) {
    if (wall.pieces <= 0) return '0 palet';
    if (wall.loosePieces === 0) return `${wall.fullPallets} ${wall.fullPallets === 1 ? 'paleta' : wall.fullPallets < 5 ? 'palety' : 'palet'}`;
    return `${wall.fullPallets} ${wall.fullPallets === 1 ? 'paleta' : wall.fullPallets < 5 ? 'palety' : 'palet'} + ${wall.loosePieces} ks`;
  }

  function updateMainResult(project) {
    const primary = project.walls[0] || calculateWall(basicInput());
    const multi = project.walls.length > 1;
    $('#resultModeBadge').textContent = project.mode === 'advanced' ? 'Rozšířený režim' : 'Základní režim';
    $('#resultMaterialBadge').textContent = multi ? `${project.walls.length} typy / skupiny` : primary.materialShort;
    $('#resultPieces').textContent = `${formatNumber(project.totals.pieces)} ks`;
    $('#resultPalletText').textContent = multi ? `${formatNumber(project.totals.palletPlaces)} paletových míst celkem` : `${palletDescription(primary)}${primary.loosePieces ? ' volných kusů' : ''}`;
    $('#resultNarrative').textContent = project.mode === 'advanced'
      ? `Projekt obsahuje ${formatNumber(project.totals.netArea, 2)} m² čistého zdiva v ${project.walls.length} skupinách. Celkem vychází ${formatNumber(project.totals.pieces)} prvků a ${formatNumber(project.totals.palletPlaces)} paletových míst.`
      : `Pro čistou plochu ${formatNumber(primary.netArea, 2)} m² a rezervu ${formatNumber(primary.reserve)} % vychází přibližně ${formatNumber(primary.pieces)} kusů.`;
    const baseShare = project.totals.pieces > 0 ? (project.totals.basePieces / project.totals.pieces) * 100 : 100;
    $('#wallGaugeMain').style.width = `${clamp(baseShare, 0, 100)}%`;
    $('#wallGaugeReserve').style.width = `${clamp(100 - baseShare, 0, 100)}%`;
    $('#basePieceCount').textContent = `${formatNumber(project.totals.basePieces)} ks`;
    $('#reservePieceCount').textContent = `${formatNumber(project.totals.reservePieces)} ks`;
    $('#resultArea').textContent = formatArea(project.totals.netArea);
    $('#resultVolume').textContent = formatVolume(project.totals.volume);
    $('#resultWeight').textContent = formatWeight(project.totals.weight);
    $('#resultUnitsCost').textContent = formatMoney(project.totals.unitsCost);
    $('#purchasePallets').textContent = `${formatNumber(project.totals.palletPlaces)} paletových míst`;
    $('#fullPallets').textContent = multi ? '—' : formatNumber(primary.fullPallets);
    $('#loosePieces').textContent = multi ? '—' : formatNumber(primary.loosePieces);
    $('#palletSizeText').textContent = multi ? 'viz rozpad stěn' : `po ${formatNumber(primary.palletSize)} ks`;
    const avgConsumption = project.totals.netArea > 0 ? project.totals.pieces / project.totals.netArea : 0;
    $('#piecesPerArea').textContent = `${formatNumber(avgConsumption, 1)} ks/m²`;

    $('[data-hero-pieces]').textContent = `${formatNumber(project.totals.pieces)} ks`;
    $('[data-hero-pallets]').textContent = `${formatNumber(project.totals.palletPlaces)} paletových míst`;
    $('[data-hero-area]').textContent = formatArea(project.totals.netArea);
    $('[data-hero-weight]').textContent = formatWeight(project.totals.weight);

    if (project.mode === 'advanced') {
      $('#advancedResults').hidden = false;
      $('#totalProjectCost').textContent = formatMoney(project.totalCost);
      $('#budgetWithoutDeposit').textContent = `bez vratné zálohy ${formatMoney(project.costWithoutDeposit)}`;
      $('#mortarBagsResult').textContent = `${formatNumber(project.mortarBags)} pytlů`;
      $('#mortarWeightResult').textContent = `${formatNumber(project.mortarKg + project.foundationKg)} kg směsi`;
      $('#deliveryTripsResult').textContent = `${formatNumber(project.deliveryTrips)} jízd`;
      $('#deliveryCostResult').textContent = formatMoney(project.deliveryCost);
      $('#laborCostResult').textContent = formatMoney(project.laborCost);
      $('#laborAreaResult').textContent = `${formatNumber(project.totals.netArea, 2)} m² zdiva`;
      $('#depositResult').textContent = formatMoney(project.deposit);
    } else {
      $('#advancedResults').hidden = true;
    }

    let insightHeadline = 'Objednávku ověřte podle technického listu';
    let insightText = 'Kalkulačka používá rozměr čelní plochy prvku. Skutečná spotřeba se může lišit kvůli vazbě, spárám, dořezům, poškození a skladbě detailů.';
    if (project.totals.netArea <= 0) {
      insightHeadline = 'Zkontrolujte rozměry a plochu otvorů';
      insightText = 'Plocha otvorů nesmí být větší než hrubá plocha stěn. Upravte vstupy, aby čistá plocha byla kladná.';
    } else if (project.totals.palletPlaces >= 10) {
      insightHeadline = 'Naplánujte vykládku a skladování palet';
      insightText = `Dodávka zabere přibližně ${formatNumber(project.totals.palletPlaces)} paletových míst a samotné prvky váží kolem ${formatWeight(project.totals.weight)}. Ověřte přístup vozidla, únosnost plochy a pořadí vykládky.`;
    } else if (project.totals.reservePieces / Math.max(1, project.totals.pieces) < 0.04) {
      insightHeadline = 'Rezerva je nízká';
      insightText = 'U jednoduché rovné stěny může nízká rezerva stačit, ale u rohů, pilířů, otvorů a většího řezání zvažte vyšší scénář.';
    }
    $('#insightHeadline').textContent = insightHeadline;
    $('#insightText').textContent = insightText;
  }

  function updateScenarios(project) {
    const rates = [5, 8, 10, 15];
    const currentRate = project.mode === 'basic' ? project.walls[0].reserve : null;
    $('#reserveScenarios').innerHTML = rates.map(rate => {
      const pieces = project.walls.reduce((sum, wall) => sum + ceilSafe(wall.basePiecesExact * (1 + rate / 100)), 0);
      const palletPlaces = project.walls.reduce((sum, wall) => sum + ceilSafe(ceilSafe(wall.basePiecesExact * (1 + rate / 100)) / wall.palletSize), 0);
      const current = currentRate === rate ? ' is-current' : '';
      return `<article class="scenario-card${current}"><span>Rezerva ${rate} %</span><strong>${formatNumber(pieces)} ks</strong><small>${formatNumber(palletPlaces)} paletových míst</small></article>`;
    }).join('');
  }

  function updateBreakdowns(project) {
    $('#wallBreakdownBody').innerHTML = project.walls.map(wall => `<tr><td>${escapeHtml(wall.name)}</td><td>${formatArea(wall.netArea)}</td><td>${escapeHtml(wall.materialShort)}</td><td>${formatNumber(wall.pieces)} ks</td><td>${palletDescription(wall)}</td><td>${formatMoney(wall.cost)}</td></tr>`).join('');
    const costs = [{ label: 'Cihly a tvárnice', value: project.totals.unitsCost }];
    if (project.mode === 'advanced') {
      costs.push(
        { label: 'Zdicí a zakládací malta', value: project.mortarCost },
        { label: 'Doprava', value: project.deliveryCost },
        { label: 'Manipulace s paletami', value: project.handlingCost },
        { label: 'Překlady', value: project.lintelCost },
        { label: 'Práce', value: project.laborCost },
        { label: 'Ostatní náklady', value: project.otherCosts },
        { label: 'Vratná záloha za palety', value: project.deposit }
      );
    }
    $('#costBreakdown').innerHTML = costs.map(item => `<div><span>${escapeHtml(item.label)}</span><strong>${formatMoney(item.value)}</strong></div>`).join('');
  }

  function calculate() {
    try {
      const project = buildProject(activeMode);
      lastResult = project;
      updateMainResult(project);
      updateScenarios(project);
      updateBreakdowns(project);
    } catch (error) {
      console.error('Chyba výpočtu zdiva:', error);
      $('#insightHeadline').textContent = 'Výpočet se nepodařilo dokončit';
      $('#insightText').textContent = 'Zkontrolujte zadané hodnoty a zkuste výpočet znovu.';
    }
  }

  function switchMode(mode) {
    activeMode = mode === 'advanced' ? 'advanced' : 'basic';
    document.body.dataset.calculatorMode = activeMode;
    form.dataset.mode = activeMode;
    $('#basicCalculation').hidden = activeMode !== 'basic';
    $('#advancedCalculation').hidden = activeMode !== 'advanced';
    $$('.mode-button').forEach(button => {
      const active = button.dataset.mode === activeMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    if (activeMode === 'advanced' && zones.length === 0) transferBasicToAdvanced();
    calculate();
  }

  function transferBasicToAdvanced() {
    const basic = basicInput();
    zones = [];
    zoneCounter = 0;
    createZone({
      name: 'Hlavní stěna', length: basic.length, height: basic.height, openings: basic.openings, count: 1,
      preset: basic.preset, reserve: basic.reserve, unitLength: basic.unitLength, unitHeight: basic.unitHeight,
      unitWidth: basic.unitWidth, palletSize: basic.palletSize, unitWeight: basic.unitWeight, unitPrice: basic.unitPrice
    });
  }

  function resetAll() {
    $('#basicLength').value = 6;
    $('#basicHeight').value = 2.75;
    $('#basicOpenings').value = 1;
    $('#basicReserve').value = 5;
    applyPresetToBasic('ceramic30');
    $$('.reserve-picker button').forEach(button => button.classList.toggle('is-active', button.dataset.reserve === '5'));
    zones = [];
    zoneCounter = 0;
    createZone({ name: 'Obvodová stěna', length: 10, height: 2.75, openings: 5, count: 2, preset: 'ceramic30', reserve: 5 });
    createZone({ name: 'Vnitřní příčky', length: 18, height: 2.75, openings: 7.2, count: 1, preset: 'partition10', reserve: 8 });
    $('#includeMortar').checked = true;
    $('#includeFoundationMortar').checked = true;
    $('#mortarConsumption').value = 17;
    $('#foundationConsumption').value = 8.5;
    $('#mortarBagWeight').value = 25;
    $('#mortarBagPrice').value = 230;
    $('#includeDelivery').checked = true;
    $('#includeLabor').checked = true;
    $('#includeLintels').checked = true;
    $('#deliveryCapacity').value = 12;
    $('#deliveryPrice').value = 4500;
    $('#palletDeposit').value = 350;
    $('#handlingPerPallet').value = 180;
    $('#laborPerArea').value = 850;
    $('#lintelCount').value = 4;
    $('#lintelPrice').value = 1800;
    $('#otherCosts').value = 3500;
    switchMode('basic');
  }

  function copyResult() {
    if (!lastResult) return;
    const text = [
      'Kalkulačka cihel a tvárnic – RychléVýpočty.cz',
      `Režim: ${lastResult.mode === 'advanced' ? 'rozšířený' : 'základní'}`,
      `Čistá plocha: ${formatArea(lastResult.totals.netArea)}`,
      `Počet prvků: ${formatNumber(lastResult.totals.pieces)} ks`,
      `Paletová místa: ${formatNumber(lastResult.totals.palletPlaces)}`,
      `Objem zdiva: ${formatVolume(lastResult.totals.volume)}`,
      `Hmotnost prvků: ${formatWeight(lastResult.totals.weight)}`,
      `Cena prvků: ${formatMoney(lastResult.totals.unitsCost)}`,
      lastResult.mode === 'advanced' ? `Projekt celkem: ${formatMoney(lastResult.totalCost)} (bez vratné zálohy ${formatMoney(lastResult.costWithoutDeposit)})` : '',
      'Výsledek je orientační. Ověřte technický list a projekt.'
    ].filter(Boolean).join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      const button = $('#copyResultButton');
      const original = button.textContent;
      button.textContent = 'Zkopírováno';
      setTimeout(() => { button.textContent = original; }, 1600);
    }).catch(() => window.prompt('Zkopírujte výsledek:', text));
  }

  form.addEventListener('submit', event => { event.preventDefault(); calculate(); $('#vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  form.addEventListener('input', event => {
    if (event.target.closest('.zone-card')) readZonesFromDom();
    calculate();
  });
  form.addEventListener('change', event => {
    const presetSelect = event.target.closest('.zone-preset');
    if (presetSelect) applyPresetToZone(presetSelect.closest('.zone-card'), presetSelect.value);
    calculate();
  });
  form.addEventListener('click', event => {
    const modeButton = event.target.closest('.mode-button');
    if (modeButton) { switchMode(modeButton.dataset.mode); return; }
    const presetButton = event.target.closest('.preset-card');
    if (presetButton) { applyPresetToBasic(presetButton.dataset.preset); calculate(); return; }
    const reserveButton = event.target.closest('.reserve-picker button');
    if (reserveButton) {
      $('#basicReserve').value = reserveButton.dataset.reserve;
      $$('.reserve-picker button').forEach(button => button.classList.toggle('is-active', button === reserveButton));
      calculate();
      return;
    }
    const removeButton = event.target.closest('.remove-zone');
    if (removeButton) {
      const id = removeButton.closest('.zone-card').dataset.zoneId;
      zones = zones.filter(zone => zone.id !== id);
      renderZones();
      calculate();
    }
  });

  $('#addZoneButton').addEventListener('click', () => createZone({ name: `Další stěna ${zones.length + 1}`, preset: 'aerated30', length: 5, height: 2.75, openings: 0, reserve: 8 }));
  $('#resetButton').addEventListener('click', resetAll);
  $('#copyResultButton').addEventListener('click', copyResult);
  $('#printResultButton').addEventListener('click', () => window.print());

  applyPresetToBasic('ceramic30');
  createZone({ name: 'Obvodová stěna', length: 10, height: 2.75, openings: 5, count: 2, preset: 'ceramic30', reserve: 5 });
  createZone({ name: 'Vnitřní příčky', length: 18, height: 2.75, openings: 7.2, count: 1, preset: 'partition10', reserve: 8 });
  switchMode('basic');
})();
