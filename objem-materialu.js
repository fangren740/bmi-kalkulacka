(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const csNumber = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });
  const csInteger = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const csCurrency = new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0
  });

  const MATERIALS = {
    soil: { label: 'Zemina', density: 1450, price: 650 },
    sand: { label: 'Písek', density: 1600, price: 900 },
    gravel: { label: 'Štěrk / kamenivo', density: 1610, price: 1050 },
    mulch: { label: 'Mulč / kůra', density: 350, price: 1200 },
    concrete: { label: 'Beton', density: 2350, price: 3500 },
    custom: { label: 'Vlastní materiál', density: 1500, price: 0 }
  };

  const SHAPES = {
    layer: { label: 'plocha a vrstva', badge: 'PLOCHA / VRSTVA' },
    rect: { label: 'kvádr', badge: 'KVÁDR' },
    cylinder: { label: 'válec', badge: 'VÁLEC' },
    trench: { label: 'šikmý výkop', badge: 'ŠIKMÝ VÝKOP' }
  };

  const PRESETS = {
    garden: { shape: 'layer', material: 'soil', area: 40, depth: 8, reserve: 10 },
    driveway: { shape: 'layer', material: 'gravel', area: 60, depth: 12, reserve: 12 },
    sand: { shape: 'layer', material: 'sand', area: 25, depth: 5, reserve: 8 },
    mulch: { shape: 'layer', material: 'mulch', area: 35, depth: 7, reserve: 10 }
  };

  const DEFAULTS = {
    shape: 'layer',
    material: 'soil',
    reserve: 10,
    layerArea: 20,
    layerDepth: 5,
    rectLength: 6,
    rectWidth: 3,
    rectHeight: 0.2,
    cylinderDiameter: 1.2,
    cylinderHeight: 1,
    trenchLength: 10,
    trenchTop: 1.2,
    trenchBottom: 0.6,
    trenchDepth: 0.8,
    density: 1450,
    compactionPercent: 0,
    roundingStep: 0.1,
    pricePerM3: 650,
    vehicleCapacity: 5,
    vehiclePayload: 8,
    deliveryPrice: 1800
  };

  let mode = 'basic';

  function numberValue(id) {
    const element = $(id);
    const value = Number(element ? element.value : NaN);
    return Number.isFinite(value) ? value : NaN;
  }

  function formatM3(value) {
    return `${csNumber.format(Math.max(0, value))} m³`;
  }

  function formatLiters(value) {
    return `${csInteger.format(Math.max(0, value))} l`;
  }

  function formatWeight(kilograms) {
    const safe = Math.max(0, kilograms);
    return safe >= 1000 ? `${csNumber.format(safe / 1000)} t` : `${csInteger.format(safe)} kg`;
  }

  function formatCurrency(value) {
    return csCurrency.format(Math.max(0, value)).replace(/\u00a0/g, ' ');
  }

  function formatPercent(value) {
    return `${csNumber.format(Math.max(0, value))} %`;
  }

  function ceilToStep(value, step) {
    if (!Number.isFinite(value) || value <= 0) return 0;
    if (!Number.isFinite(step) || step <= 0) return value;
    return Math.ceil((value - 1e-10) / step) * step;
  }

  function selectedShape() {
    return document.querySelector('input[name="shape"]:checked')?.value || DEFAULTS.shape;
  }

  function pluralTrips(count) {
    if (count === 1) return '1 jízda';
    if (count >= 2 && count <= 4) return `${count} jízdy`;
    return `${count} jízd`;
  }

  function geometry(shape) {
    if (shape === 'layer') {
      const area = numberValue('layerArea');
      const depth = numberValue('layerDepth');
      return {
        valid: area > 0 && depth > 0,
        volume: area * (depth / 100),
        formula: `objem = ${csNumber.format(area)} m² × ${csNumber.format(depth / 100)} m = ${formatM3(area * (depth / 100))}`,
        measures: [`${csNumber.format(area)} m²`, `${csNumber.format(depth)} cm`, 'vrstva']
      };
    }

    if (shape === 'rect') {
      const length = numberValue('rectLength');
      const width = numberValue('rectWidth');
      const height = numberValue('rectHeight');
      return {
        valid: length > 0 && width > 0 && height > 0,
        volume: length * width * height,
        formula: `objem = ${csNumber.format(length)} m × ${csNumber.format(width)} m × ${csNumber.format(height)} m = ${formatM3(length * width * height)}`,
        measures: [`${csNumber.format(length)} m`, `${csNumber.format(width)} m`, `${csNumber.format(height)} m`]
      };
    }

    if (shape === 'cylinder') {
      const diameter = numberValue('cylinderDiameter');
      const height = numberValue('cylinderHeight');
      const volume = Math.PI * Math.pow(diameter / 2, 2) * height;
      return {
        valid: diameter > 0 && height > 0,
        volume,
        formula: `objem = π × (${csNumber.format(diameter)} m ÷ 2)² × ${csNumber.format(height)} m = ${formatM3(volume)}`,
        measures: [`Ø ${csNumber.format(diameter)} m`, `${csNumber.format(height)} m`, 'válec']
      };
    }

    const length = numberValue('trenchLength');
    const top = numberValue('trenchTop');
    const bottom = numberValue('trenchBottom');
    const depth = numberValue('trenchDepth');
    const volume = length * ((top + bottom) / 2) * depth;
    return {
      valid: length > 0 && top > 0 && bottom > 0 && depth > 0,
      volume,
      formula: `objem = ${csNumber.format(length)} m × ((${csNumber.format(top)} + ${csNumber.format(bottom)}) ÷ 2) m × ${csNumber.format(depth)} m = ${formatM3(volume)}`,
      measures: [`${csNumber.format(length)} m`, `${csNumber.format(top)} / ${csNumber.format(bottom)} m`, `${csNumber.format(depth)} m`]
    };
  }

  function calculate(options = {}) {
    const shape = options.shape || selectedShape();
    const geometryResult = geometry(shape);
    const materialKey = $('materialType')?.value || DEFAULTS.material;
    const material = MATERIALS[materialKey] || MATERIALS.custom;
    const reserve = options.reserve ?? numberValue('reservePercent');
    const compaction = options.compaction ?? (mode === 'advanced' ? numberValue('compactionPercent') : 0);
    const roundingStep = numberValue('roundingStep');
    const density = numberValue('density');
    const price = numberValue('pricePerM3');
    const capacity = numberValue('vehicleCapacity');
    const payload = numberValue('vehiclePayload');
    const deliveryPrice = numberValue('deliveryPrice');

    const inputValues = [reserve, compaction, roundingStep, density, price, capacity, payload, deliveryPrice];
    const valid = geometryResult.valid && inputValues.every(Number.isFinite) && reserve >= 0 && reserve <= 30 &&
      compaction >= 0 && compaction <= 100 && roundingStep > 0 && density >= 50 && density <= 4000 &&
      price >= 0 && capacity >= 0 && payload >= 0 && deliveryPrice >= 0;

    if (!valid) return { valid: false, shape, materialKey, material, geometry: geometryResult };

    const netVolume = geometryResult.volume;
    const factorVolume = netVolume * (1 + compaction / 100);
    const rawOrder = factorVolume * (1 + reserve / 100);
    const orderVolume = ceilToStep(rawOrder, roundingStep);
    const reserveVolume = Math.max(0, orderVolume - factorVolume);
    const compactionVolume = Math.max(0, factorVolume - netVolume);
    const extraVolume = Math.max(0, orderVolume - netVolume);
    const weightKg = orderVolume * density;
    const weightTonnes = weightKg / 1000;
    const tripsByVolume = capacity > 0 ? Math.ceil(orderVolume / capacity) : 0;
    const tripsByWeight = payload > 0 ? Math.ceil(weightTonnes / payload) : 0;
    const hasTransportLimit = capacity > 0 || payload > 0;
    const tripCount = orderVolume > 0 && hasTransportLimit ? Math.max(tripsByVolume, tripsByWeight, 1) : 0;
    const materialCost = orderVolume * price;
    const deliveryCost = tripCount * deliveryPrice;

    return {
      valid: true,
      shape,
      materialKey,
      material,
      geometry: geometryResult,
      reserve,
      compaction,
      roundingStep,
      density,
      price,
      capacity,
      payload,
      deliveryPrice,
      netVolume,
      factorVolume,
      rawOrder,
      orderVolume,
      reserveVolume,
      compactionVolume,
      extraVolume,
      weightKg,
      weightTonnes,
      tripsByVolume,
      tripsByWeight,
      tripCount,
      materialCost,
      deliveryCost,
      totalCost: materialCost + deliveryCost
    };
  }

  function setText(target, value) {
    if (typeof target === 'string') {
      const element = $(target);
      if (element) element.textContent = value;
      return;
    }
    target.forEach((element) => { element.textContent = value; });
  }

  function renderGeometryState(shape, result) {
    $$('[data-shape-panel]').forEach((panel) => {
      const active = panel.dataset.shapePanel === shape;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });

    const scene = document.querySelector('.material-scene');
    if (scene) {
      scene.dataset.scene = shape;
      if (result?.materialKey) scene.dataset.material = result.materialKey;
    }
    setText($$('[data-hero-shape]'), SHAPES[shape].badge);

    if (result?.geometry?.measures) {
      setText($$('.scene-x'), result.geometry.measures[0]);
      setText($$('.scene-y'), result.geometry.measures[1]);
      setText($$('.scene-z'), result.material?.label?.toLowerCase() || result.geometry.measures[2]);
    }
  }

  function renderBars(result) {
    const total = result.orderVolume || 1;
    const netShare = Math.max(0, Math.min(100, result.netVolume / total * 100));
    const factorShare = Math.max(0, Math.min(100 - netShare, result.compactionVolume / total * 100));
    const reserveShare = Math.max(0, 100 - netShare - factorShare);
    $('netBar').style.width = `${netShare}%`;
    $('factorBar').style.width = `${factorShare}%`;
    $('reserveBar').style.width = `${reserveShare}%`;
    $('factorBar').classList.toggle('is-zero', factorShare < 0.01);
  }

  function renderQuickScenarios(result) {
    const reserves = [0, 5, 10, 15];
    $('quickScenarios').innerHTML = reserves.map((reserve) => {
      const scenario = calculate({ reserve, compaction: result.compaction });
      const current = Math.round(result.reserve) === reserve;
      return `<div${current ? ' class="is-current"' : ''}><span>${reserve} %</span><strong>${formatM3(scenario.orderVolume)}</strong></div>`;
    }).join('');
  }

  function renderAdvanced(result) {
    let reason = 'objem i nosnost vyhoví';
    if (result.tripsByWeight > result.tripsByVolume) reason = 'rozhoduje nosnost vozidla';
    if (result.tripsByVolume > result.tripsByWeight) reason = 'rozhoduje objem vozidla';
    if (result.capacity === 0 && result.payload === 0) reason = 'doplňte kapacitu nebo nosnost';

    setText('tripCount', result.tripCount > 0 ? pluralTrips(result.tripCount) : 'neuvedeno');
    setText('tripReason', reason);
    setText('materialCost', formatCurrency(result.materialCost));
    setText('deliveryCost', formatCurrency(result.deliveryCost));
    setText('deliveryCount', result.tripCount > 0 ? `${result.tripCount} × cena jízdy` : 'bez dopravního limitu');
    setText('totalCost', formatCurrency(result.totalCost));
  }

  function renderBreakdown(result) {
    const rows = [
      ['Čistý geometrický objem', formatM3(result.netVolume), SHAPES[result.shape].label],
      ['Navýšení pro hutnění', formatM3(result.compactionVolume), result.compaction > 0 ? `${formatPercent(result.compaction)} z čistého objemu` : 'v režimu Basic se nepřidává'],
      ['Objem před rezervou', formatM3(result.factorVolume), 'čistý objem + hutnění'],
      ['Rezerva a zaokrouhlení', formatM3(result.reserveVolume), `${formatPercent(result.reserve)} a krok ${formatM3(result.roundingStep)}`],
      ['Množství k objednání', formatM3(result.orderVolume), 'výsledná poptávaná hodnota'],
      ['Orientační hmotnost', formatWeight(result.weightKg), `při ${csInteger.format(result.density)} kg/m³`]
    ];
    $('summaryTableBody').innerHTML = rows.map((row) => `<tr><td>${row[0]}</td><td><strong>${row[1]}</strong></td><td>${row[2]}</td></tr>`).join('');

    const scenarios = [
      { label: 'Bez navýšení', compaction: 0, reserve: 0 },
      { label: 'Jen aktuální rezerva', compaction: 0, reserve: result.reserve },
      { label: 'Aktuální nastavení', compaction: result.compaction, reserve: result.reserve },
      { label: 'Kontrolní + 5 bodů', compaction: Math.min(100, result.compaction + 5), reserve: Math.min(30, result.reserve + 5) }
    ];
    $('scenarioTableBody').innerHTML = scenarios.map((item) => {
      const scenario = calculate({ compaction: item.compaction, reserve: item.reserve });
      return `<tr><td>${item.label}</td><td>${formatPercent(item.compaction)}</td><td>${formatPercent(item.reserve)}</td><td><strong>${formatM3(scenario.orderVolume)}</strong></td><td>${formatWeight(scenario.weightKg)}</td><td>${formatCurrency(scenario.materialCost)}</td></tr>`;
    }).join('');
    setText('formulaBox', result.geometry.formula);
  }

  function renderCallout(result) {
    let title = 'Objem je připravený pro orientační poptávku';
    let text = 'Před objednávkou ověřte hustotu, vlhkost, frakci a způsob účtování u konkrétního dodavatele.';

    if (result.reserve < 5) {
      title = 'Rezerva je nízká';
      text = 'Zkontrolujte nerovnosti podkladu, ztráty při manipulaci a minimální objednávkové množství dodavatele.';
    } else if (result.compaction > 25) {
      title = 'Navýšení pro hutnění je výrazné';
      text = 'Ověřte koeficient u konkrétního materiálu a způsobu ukládání. Univerzální procento neexistuje.';
    } else if (result.materialKey === 'concrete') {
      title = 'U betonu pokračujte specializovaným výpočtem';
      text = 'Betonová kalkulačka řeší konstrukce, rezervu, balení i objednávku podrobněji než obecný přepočet objemu.';
    }

    setText('calloutTitle', title);
    setText('calloutText', text);
    $('concreteCta').classList.toggle('is-highlighted', result.materialKey === 'concrete');
  }

  function render() {
    const shape = selectedShape();
    const result = calculate();
    renderGeometryState(shape, result.valid ? result : null);
    setText('reserveLabel', `${csInteger.format(Math.max(0, numberValue('reservePercent') || 0))} %`);
    $$('[data-reserve]').forEach((button) => button.classList.toggle('is-active', Number(button.dataset.reserve) === numberValue('reservePercent')));

    const error = $('inputError');
    error.hidden = result.valid;
    if (!result.valid) {
      error.textContent = 'Zkontrolujte kladné rozměry a povolený rozsah zadaných hodnot.';
      return;
    }

    setText('modeBadge', mode === 'advanced' ? 'Advanced' : 'Basic');
    setText('resultMaterial', result.material.label);
    setText('resultShape', SHAPES[result.shape].label);
    setText('orderVolume', formatM3(result.orderVolume));
    setText('resultSummary', mode === 'advanced'
      ? `Čistý objem ${formatM3(result.netVolume)} je navýšen o ${formatPercent(result.compaction)} pro hutnění a ${formatPercent(result.reserve)} rezervy.`
      : `Čistý objem ${formatM3(result.netVolume)} je navýšen o ${formatPercent(result.reserve)} rezervy a zaokrouhlen na objednávkový krok.`);
    setText('netVolume', formatM3(result.netVolume));
    setText('litersResult', formatLiters(result.orderVolume * 1000));
    setText('weightResult', formatWeight(result.weightKg));
    setText('densityResult', `při ${csInteger.format(result.density)} kg/m³`);
    setText('extraVolume', formatM3(result.extraVolume));

    setText($$('[data-hero-order]'), formatM3(result.orderVolume));
    setText($$('[data-hero-net]'), formatM3(result.netVolume));
    setText($$('[data-hero-weight]'), formatWeight(result.weightKg));
    setText($$('[data-hero-material]'), `${result.material.label} · přibližně ${formatWeight(result.weightKg)}`);
    setText($$('.scene-z'), result.material.label.toLowerCase());

    renderBars(result);
    renderQuickScenarios(result);
    renderAdvanced(result);
    renderBreakdown(result);
    renderCallout(result);
  }

  function setMode(nextMode) {
    mode = nextMode === 'advanced' ? 'advanced' : 'basic';
    if (mode === 'basic') {
      const layerRadio = document.querySelector('input[name="shape"][value="layer"]');
      if (layerRadio) layerRadio.checked = true;
      $('reservePercent').value = DEFAULTS.reserve;
    }
    document.body.dataset.mode = mode;
    document.body.dataset.calculatorMode = mode;
    $$('[data-mode]').forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $('advancedPanel').hidden = mode !== 'advanced';
    $('advancedResults').hidden = mode !== 'advanced';
    setText('formTitle', mode === 'advanced' ? 'Zpřesněte geometrii a dopravu' : 'Tři údaje a máte hotovo');
    setText('formIntro', mode === 'advanced'
      ? 'Vyberte tvar prostoru a upravte rezervu, hustotu, cenu i kapacitu dopravy.'
      : 'Vyberte příklad, nebo rovnou zadejte plochu, tloušťku a materiál.');
    setText('calculateButton', mode === 'advanced' ? 'Přepočítat objednávku' : 'Ukázat výsledek');
    render();
  }

  function setShape(shape) {
    const radio = document.querySelector(`input[name="shape"][value="${shape}"]`);
    if (radio) radio.checked = true;
    render();
  }

  function setMaterial(materialKey) {
    const material = MATERIALS[materialKey] || MATERIALS.custom;
    $('materialType').value = materialKey;
    $('density').value = material.density;
    $('pricePerM3').value = material.price;
  }

  function applyPreset(name) {
    const preset = PRESETS[name];
    if (!preset) return;
    setShape(preset.shape);
    setMaterial(preset.material);
    $('layerArea').value = preset.area;
    $('layerDepth').value = preset.depth;
    $('reservePercent').value = mode === 'basic' ? DEFAULTS.reserve : preset.reserve;
    $$('[data-preset]').forEach((button) => {
      const active = button.dataset.preset === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    render();
  }

  function reset() {
    Object.entries(DEFAULTS).forEach(([key, value]) => {
      const element = $(key);
      if (element) element.value = value;
    });
    setMaterial(DEFAULTS.material);
    setShape(DEFAULTS.shape);
    $('reservePercent').value = DEFAULTS.reserve;
    $$('[data-preset]').forEach((button) => {
      button.classList.remove('is-active');
      button.setAttribute('aria-pressed', 'false');
    });
    setMode('basic');
  }

  function bindEvents() {
    $$('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
    $$('[data-open-advanced]').forEach((button) => button.addEventListener('click', () => setMode('advanced')));
    $$('input[name="shape"]').forEach((radio) => radio.addEventListener('change', render));
    $$('[data-preset]').forEach((button) => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
    $$('[data-reserve]').forEach((button) => button.addEventListener('click', () => {
      $('reservePercent').value = button.dataset.reserve;
      render();
    }));

    const liveInputs = [
      'layerArea', 'layerDepth', 'rectLength', 'rectWidth', 'rectHeight',
      'cylinderDiameter', 'cylinderHeight', 'trenchLength', 'trenchTop',
      'trenchBottom', 'trenchDepth', 'reservePercent', 'density',
      'compactionPercent', 'roundingStep', 'pricePerM3', 'vehicleCapacity',
      'vehiclePayload', 'deliveryPrice'
    ];
    liveInputs.forEach((id) => {
      $(id)?.addEventListener('input', render);
      $(id)?.addEventListener('change', render);
    });

    $('materialType')?.addEventListener('change', (event) => {
      setMaterial(event.target.value);
      render();
    });
    $('materialForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      render();
      if (!$('inputError').hidden) {
        $('inputError').scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (window.matchMedia('(max-width: 1120px)').matches) {
        $('vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    $('resetBtn')?.addEventListener('click', reset);
  }

  bindEvents();
  setMode('basic');
}());
