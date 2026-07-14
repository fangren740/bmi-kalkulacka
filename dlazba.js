(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const number = (value, fallback = 0) => {
    const parsed = Number(String(value ?? '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ceilStep = (value, step = 1) => Math.ceil((value - 1e-9) / step) * step;
  const fmt = (value, digits = 1) => new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
  const fmtCompact = (value, digits = 2) => new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
  const money = (value) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(value || 0))} Kč`;
  const areaText = (value) => `${fmt(value, 2)} m²`;
  const kgText = (value) => `${fmt(value, value >= 100 ? 0 : 1)} kg`;
  const litreText = (value) => `${fmt(value, value >= 100 ? 0 : 1)} l`;
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

  const form = $('#tileForm');
  const zoneList = $('#advancedZoneList');
  const errorBox = $('#formError');
  let currentMode = 'basic';
  let zoneSerial = 0;
  let advancedSeeded = false;
  let lastResult = null;

  const tilePresets = {
    '20x20': { width: 200, height: 200, pack: 1.0 },
    '30x60': { width: 300, height: 600, pack: 1.44 },
    '60x60': { width: 600, height: 600, pack: 1.44 },
    '60x120': { width: 600, height: 1200, pack: 1.44 }
  };
  const patternWaste = {
    straight: 7,
    offset: 10,
    diagonal: 12,
    complex: 15
  };

  function getBasicMethod() {
    return $('input[name="basicMethod"]:checked')?.value || 'dimensions';
  }

  function getBasicArea() {
    const method = getBasicMethod();
    if (method === 'area') {
      const area = Math.max(0, number($('#basicKnownArea').value));
      if (!area) throw new Error('Zadejte kladnou plochu v metrech čtverečních.');
      return { area, detail: 'známá plocha' };
    }
    const length = Math.max(0, number($('#basicLength').value));
    const width = Math.max(0, number($('#basicWidth').value));
    if (!length || !width) throw new Error('Zadejte kladnou délku a šířku plochy.');
    return { area: length * width, detail: `${fmtCompact(length)} × ${fmtCompact(width)} m` };
  }

  function getTileGeometry(prefix = 'basic') {
    const width = Math.max(1, number($(`#${prefix}TileWidth`).value));
    const height = Math.max(1, number($(`#${prefix}TileHeight`).value));
    const tileArea = width * height / 1_000_000;
    return { width, height, tileArea };
  }

  function calculateBasic() {
    const base = getBasicArea();
    const tile = getTileGeometry('basic');
    const pattern = $('#basicPattern').value || 'straight';
    const reserve = clamp(number($('#basicReserve').value, patternWaste[pattern] || 7), 0, 60);
    const packArea = Math.max(0.01, number($('#basicPackArea').value, 1.44));
    const packPrice = Math.max(0, number($('#basicPackPrice').value));
    const requiredArea = base.area * (1 + reserve / 100);
    const tiles = Math.ceil(requiredArea / tile.tileArea - 1e-9);
    const packs = Math.ceil(requiredArea / packArea - 1e-9);
    const purchasedArea = packs * packArea;
    const leftoverArea = Math.max(0, purchasedArea - base.area);
    const materialCost = packs * packPrice;
    const pricePerNetArea = base.area > 0 ? materialCost / base.area : 0;
    return {
      mode: 'basic', ...base, tile, pattern, reserve, packArea, packPrice,
      requiredArea, tiles, packs, purchasedArea, leftoverArea, materialCost,
      pricePerNetArea, netArea: base.area, zoneCount: 1, wetArea: 0,
      adhesiveKg: 0, adhesiveBags: 0, adhesiveCost: 0,
      groutKg: 0, groutPacks: 0, groutCost: 0,
      primerLitres: 0, primerPacks: 0, primerCost: 0,
      hydroKg: 0, hydroPacks: 0, hydroCost: 0,
      skirtingCost: 0, labourCost: 0, otherCosts: 0, totalCost: materialCost,
      durationDays: 0, zones: [{ name: 'Zadaná plocha', area: base.area, reserve, required: requiredArea }]
    };
  }

  function zoneMarkup(zone = {}) {
    zoneSerial += 1;
    const id = `zone-${zoneSerial}`;
    const name = zone.name || `Plocha ${zoneSerial}`;
    const width = zone.width ?? 3;
    const height = zone.height ?? 2.6;
    const openings = zone.openings ?? 0;
    const quantity = zone.quantity ?? 1;
    const type = zone.type || 'wall';
    const pattern = zone.pattern || 'straight';
    const wet = Boolean(zone.wet);
    return `
      <article class="zone-card" data-zone-id="${id}">
        <div class="zone-card-head">
          <div class="zone-name-wrap"><span class="zone-index">${String(zoneSerial).padStart(2, '0')}</span><input class="zone-name" type="text" value="${escapeHtml(name)}" aria-label="Název plochy"></div>
          <button class="zone-remove" type="button" aria-label="Odebrat plochu">×</button>
        </div>
        <div class="zone-card-body">
          <div class="zone-grid">
            <label class="zone-field"><span>Typ</span><select class="zone-type"><option value="floor" ${type === 'floor' ? 'selected' : ''}>Podlaha</option><option value="wall" ${type === 'wall' ? 'selected' : ''}>Stěna</option><option value="other" ${type === 'other' ? 'selected' : ''}>Jiná plocha</option></select></label>
            <label class="zone-field"><span>Délka / šířka</span><div><input class="zone-width" type="number" min="0.1" step="0.1" value="${width}" inputmode="decimal"><em>m</em></div></label>
            <label class="zone-field"><span>Šířka / výška</span><div><input class="zone-height" type="number" min="0.1" step="0.1" value="${height}" inputmode="decimal"><em>m</em></div></label>
            <label class="zone-field"><span>Otvory</span><div><input class="zone-openings" type="number" min="0" step="0.1" value="${openings}" inputmode="decimal"><em>m²</em></div></label>
            <label class="zone-field"><span>Počet stejných ploch</span><div><input class="zone-quantity" type="number" min="1" max="50" step="1" value="${quantity}" inputmode="numeric"><em>×</em></div></label>
            <label class="zone-field"><span>Vzor pokládky</span><select class="zone-pattern"><option value="straight" ${pattern === 'straight' ? 'selected' : ''}>Rovně – 7 %</option><option value="offset" ${pattern === 'offset' ? 'selected' : ''}>Na vazbu – 10 %</option><option value="diagonal" ${pattern === 'diagonal' ? 'selected' : ''}>Diagonálně – 12 %</option><option value="complex" ${pattern === 'complex' ? 'selected' : ''}>Složitý vzor – 15 %</option></select></label>
          </div>
          <div class="zone-options"><label class="zone-check"><input class="zone-wet" type="checkbox" ${wet ? 'checked' : ''}><span><i></i><b>Mokrá zóna</b><small>Zahrnout do hydroizolace</small></span></label></div>
          <div class="zone-summary"><span>Čistá plocha <b data-zone-area>–</b></span><span>Rezerva <b data-zone-reserve>–</b></span><span>K nákupu <b data-zone-required>–</b></span></div>
        </div>
      </article>`;
  }

  function addZone(zone) {
    zoneList.insertAdjacentHTML('beforeend', zoneMarkup(zone));
    bindZoneEvents(zoneList.lastElementChild);
    calculateAndRender(false);
  }

  function bindZoneEvents(card) {
    $$('input,select', card).forEach(input => input.addEventListener('input', () => calculateAndRender(false)));
    $('.zone-remove', card).addEventListener('click', () => {
      if ($$('.zone-card', zoneList).length <= 1) return;
      card.remove();
      renumberZones();
      calculateAndRender(false);
    });
  }

  function renumberZones() {
    $$('.zone-card', zoneList).forEach((card, index) => {
      $('.zone-index', card).textContent = String(index + 1).padStart(2, '0');
    });
  }

  function readZones() {
    const zones = $$('.zone-card', zoneList).map(card => {
      const width = Math.max(0, number($('.zone-width', card).value));
      const height = Math.max(0, number($('.zone-height', card).value));
      const openings = Math.max(0, number($('.zone-openings', card).value));
      const quantity = clamp(Math.round(number($('.zone-quantity', card).value, 1)), 1, 50);
      const gross = width * height * quantity;
      const area = Math.max(0, gross - openings * quantity);
      const pattern = $('.zone-pattern', card).value || 'straight';
      const reserve = patternWaste[pattern] ?? 7;
      const required = area * (1 + reserve / 100);
      $('[data-zone-area]', card).textContent = areaText(area);
      $('[data-zone-reserve]', card).textContent = `${reserve} %`;
      $('[data-zone-required]', card).textContent = areaText(required);
      return {
        name: $('.zone-name', card).value.trim() || 'Plocha',
        type: $('.zone-type', card).value,
        width, height, openings, quantity, area, pattern, reserve, required,
        wet: $('.zone-wet', card).checked
      };
    });
    if (!zones.length || zones.every(zone => zone.area <= 0)) throw new Error('Přidejte alespoň jednu plochu s kladnými rozměry.');
    return zones;
  }

  function calcRoundedAmount(amount, packageSize) {
    if (amount <= 0 || packageSize <= 0) return { packages: 0, purchased: 0 };
    const packages = Math.ceil(amount / packageSize - 1e-9);
    return { packages, purchased: packages * packageSize };
  }

  function calculateAdvanced() {
    const zones = readZones();
    const tile = getTileGeometry('advanced');
    const joint = clamp(number($('#advancedJoint').value, 3), 0, 30);
    const packArea = Math.max(0.01, number($('#advancedPackArea').value, 1.44));
    const packPrice = Math.max(0, number($('#advancedPackPrice').value));
    const netArea = zones.reduce((sum, zone) => sum + zone.area, 0);
    const requiredArea = zones.reduce((sum, zone) => sum + zone.required, 0);
    const wetArea = zones.filter(zone => zone.wet).reduce((sum, zone) => sum + zone.area, 0);
    const tiles = Math.ceil(requiredArea / tile.tileArea - 1e-9);
    const packs = Math.ceil(requiredArea / packArea - 1e-9);
    const purchasedArea = packs * packArea;
    const leftoverArea = Math.max(0, purchasedArea - netArea);
    const tileCost = packs * packPrice;

    let adhesiveKg = 0, adhesiveBags = 0, adhesivePurchased = 0, adhesiveCost = 0;
    if ($('#useAdhesive').checked) {
      const consumption = Math.max(0, number($('#adhesiveConsumption').value, 4));
      const reserve = clamp(number($('#adhesiveReserve').value, 5), 0, 100);
      const bagSize = Math.max(0.1, number($('#adhesiveBag').value, 25));
      const bagPrice = Math.max(0, number($('#adhesivePrice').value));
      adhesiveKg = netArea * consumption * (1 + reserve / 100);
      const rounded = calcRoundedAmount(adhesiveKg, bagSize);
      adhesiveBags = rounded.packages;
      adhesivePurchased = rounded.purchased;
      adhesiveCost = adhesiveBags * bagPrice;
    }

    let groutKg = 0, groutPacks = 0, groutPurchased = 0, groutCost = 0;
    if ($('#useGrout').checked && joint > 0) {
      const depth = Math.max(0.1, number($('#groutDepth').value, 8));
      const density = Math.max(0.1, number($('#groutDensity').value, 1.6));
      const reserve = clamp(number($('#groutReserve').value, 10), 0, 100);
      const packageSize = Math.max(0.1, number($('#groutPackage').value, 5));
      const packagePrice = Math.max(0, number($('#groutPrice').value));
      const kgPerM2 = ((tile.width + tile.height) / (tile.width * tile.height)) * joint * depth * density;
      groutKg = netArea * kgPerM2 * (1 + reserve / 100);
      const rounded = calcRoundedAmount(groutKg, packageSize);
      groutPacks = rounded.packages;
      groutPurchased = rounded.purchased;
      groutCost = groutPacks * packagePrice;
    }

    let primerLitres = 0, primerPacks = 0, primerPurchased = 0, primerCost = 0;
    if ($('#usePrimer').checked) {
      const consumption = Math.max(0, number($('#primerConsumption').value, 0.15));
      const packageSize = Math.max(0.1, number($('#primerPackage').value, 5));
      const packagePrice = Math.max(0, number($('#primerPrice').value));
      primerLitres = netArea * consumption;
      const rounded = calcRoundedAmount(primerLitres, packageSize);
      primerPacks = rounded.packages;
      primerPurchased = rounded.purchased;
      primerCost = primerPacks * packagePrice;
    }

    let hydroKg = 0, hydroPacks = 0, hydroPurchased = 0, hydroCost = 0;
    if ($('#useHydro').checked && wetArea > 0) {
      const consumption = Math.max(0, number($('#hydroConsumption').value, 1.5));
      const packageSize = Math.max(0.1, number($('#hydroPackage').value, 15));
      const packagePrice = Math.max(0, number($('#hydroPrice').value));
      hydroKg = wetArea * consumption;
      const rounded = calcRoundedAmount(hydroKg, packageSize);
      hydroPacks = rounded.packages;
      hydroPurchased = rounded.purchased;
      hydroCost = hydroPacks * packagePrice;
    }

    let skirtingLength = 0, skirtingCost = 0;
    if ($('#useSkirting').checked) {
      skirtingLength = Math.max(0, number($('#skirtingLength').value));
      const reserve = clamp(number($('#skirtingReserve').value, 8), 0, 100);
      const price = Math.max(0, number($('#skirtingPrice').value));
      skirtingLength *= (1 + reserve / 100);
      skirtingCost = skirtingLength * price;
    }

    const layingRate = Math.max(0, number($('#layingRate').value));
    const prepRate = Math.max(0, number($('#prepRate').value));
    const demolitionRate = $('#useDemolition').checked ? Math.max(0, number($('#demolitionRate').value)) : 0;
    const labourCost = netArea * (layingRate + prepRate + demolitionRate);
    const productivity = Math.max(0.1, number($('#productivity').value, 10));
    const durationDays = netArea / productivity;
    const otherCosts = Math.max(0, number($('#otherCosts').value));
    const materialCost = tileCost + adhesiveCost + groutCost + primerCost + hydroCost + skirtingCost;
    const totalCost = materialCost + labourCost + otherCosts;
    const pricePerNetArea = netArea > 0 ? totalCost / netArea : 0;
    const averageReserve = netArea > 0 ? (requiredArea / netArea - 1) * 100 : 0;

    return {
      mode: 'advanced', zones, zoneCount: zones.length, tile, joint, packArea, packPrice,
      netArea, requiredArea, wetArea, tiles, packs, purchasedArea, leftoverArea,
      materialCost, tileCost, totalCost, pricePerNetArea, averageReserve,
      adhesiveKg, adhesiveBags, adhesivePurchased, adhesiveCost,
      groutKg, groutPacks, groutPurchased, groutCost,
      primerLitres, primerPacks, primerPurchased, primerCost,
      hydroKg, hydroPacks, hydroPurchased, hydroCost,
      skirtingLength, skirtingCost, labourCost, otherCosts, durationDays
    };
  }

  function renderScenarios(result) {
    const reserves = [5, 8, 10, 15];
    const root = $('#scenarioGrid');
    root.innerHTML = reserves.map(reserve => {
      const required = result.netArea * (1 + reserve / 100);
      const packs = Math.ceil(required / result.packArea - 1e-9);
      const purchased = packs * result.packArea;
      return `<div class="scenario-card ${Math.abs(reserve - (result.mode === 'basic' ? result.reserve : result.averageReserve)) < 1.5 ? 'is-current' : ''}"><span>Rezerva ${reserve} %</span><strong>${areaText(required)}</strong><small>${packs} bal. · nákup ${areaText(purchased)}</small></div>`;
    }).join('');
  }

  function renderZoneTable(result) {
    const body = $('#zoneBreakdown');
    body.innerHTML = result.zones.map(zone => `<tr><td>${escapeHtml(zone.name)}</td><td>${areaText(zone.area)}</td><td>${fmt(zone.reserve, 0)} %</td><td>${areaText(zone.required)}</td></tr>`).join('');
  }

  function renderCostRows(result) {
    const rows = [
      ['Dlažba / obklad', result.mode === 'advanced' ? result.tileCost : result.materialCost],
      ['Lepidlo', result.adhesiveCost],
      ['Spárovací hmota', result.groutCost],
      ['Penetrace', result.primerCost],
      ['Hydroizolace', result.hydroCost],
      ['Sokly', result.skirtingCost],
      ['Práce a příprava', result.labourCost],
      ['Ostatní náklady', result.otherCosts]
    ].filter(([, value]) => value > 0);
    $('#costBreakdown').innerHTML = rows.length ? rows.map(([label, value]) => `<div><span>${label}</span><strong>${money(value)}</strong></div>`).join('') : '<p class="empty-cost">Zadejte ceny balení nebo přepněte do rozšířeného režimu.</p>';
  }

  function renderResult(result) {
    lastResult = result;
    const isAdvanced = result.mode === 'advanced';
    $('#modeResultBadge').textContent = isAdvanced ? 'Rozšířený režim' : 'Základní režim';
    $('#resultStatus').textContent = isAdvanced ? `${result.zoneCount} ${result.zoneCount === 1 ? 'plocha' : result.zoneCount < 5 ? 'plochy' : 'ploch'}` : 'Rychlý odhad';
    $('#resultPurchase').textContent = `${result.packs} bal.`;
    $('#resultPurchaseArea').textContent = areaText(result.purchasedArea);
    $('#resultSentence').textContent = `Čistá plocha je ${areaText(result.netArea)}. Po započtení řezání a rezervy potřebujete ${areaText(result.requiredArea)}, tedy ${result.packs} balení s celkovým pokrytím ${areaText(result.purchasedArea)}.`;
    $('#netAreaResult').textContent = areaText(result.netArea);
    $('#requiredAreaResult').textContent = areaText(result.requiredArea);
    $('#tileCountResult').textContent = `${new Intl.NumberFormat('cs-CZ').format(result.tiles)} ks`;
    $('#leftoverResult').textContent = areaText(result.leftoverArea);
    $('#packageResult').textContent = `${result.packs} × ${areaText(result.packArea)}`;
    $('#totalCostResult').textContent = result.totalCost > 0 ? money(result.totalCost) : 'Doplňte cenu';
    $('#pricePerM2Result').textContent = result.pricePerNetArea > 0 ? `${money(result.pricePerNetArea)}/m²` : '–';
    $('#resultHeading').textContent = isAdvanced ? 'Materiálový a cenový plán' : 'Kolik balení koupit';

    const purchased = Math.max(result.purchasedArea, 0.001);
    const needPct = clamp(result.requiredArea / purchased * 100, 0, 100);
    $('#needBar').style.width = `${needPct}%`;
    $('#leftBar').style.width = `${100 - needPct}%`;
    $('#gaugeNeed').textContent = areaText(result.requiredArea);
    $('#gaugeLeft').textContent = areaText(Math.max(0, result.purchasedArea - result.requiredArea));

    $('#materialSummary').innerHTML = [
      { show: true, label: 'Balení krytiny', value: `${result.packs} ks`, sub: areaText(result.purchasedArea) },
      { show: isAdvanced && result.adhesiveBags > 0, label: 'Lepidlo', value: `${result.adhesiveBags} pytlů`, sub: kgText(result.adhesivePurchased) },
      { show: isAdvanced && result.groutPacks > 0, label: 'Spárovací hmota', value: `${result.groutPacks} bal.`, sub: kgText(result.groutPurchased) },
      { show: isAdvanced && result.primerPacks > 0, label: 'Penetrace', value: `${result.primerPacks} bal.`, sub: litreText(result.primerPurchased) },
      { show: isAdvanced && result.hydroPacks > 0, label: 'Hydroizolace', value: `${result.hydroPacks} bal.`, sub: kgText(result.hydroPurchased) },
      { show: isAdvanced && result.skirtingLength > 0, label: 'Sokly', value: `${fmt(result.skirtingLength, 1)} bm`, sub: money(result.skirtingCost) }
    ].filter(item => item.show).map(item => `<div><span>${item.label}</span><strong>${item.value}</strong><small>${item.sub}</small></div>`).join('');

    $('#advancedResultPanel').hidden = !isAdvanced;
    if (isAdvanced) {
      $('#wetAreaResult').textContent = areaText(result.wetArea);
      $('#durationResult').textContent = `${fmt(result.durationDays, 1)} pracovního dne`;
      $('#materialCostResult').textContent = money(result.materialCost);
      $('#labourCostResult').textContent = money(result.labourCost);
    }
    renderScenarios(result);
    renderZoneTable(result);
    renderCostRows(result);
    updateHero(result);
  }

  function updateHero(result) {
    $$('[data-hero-packs]').forEach(el => { el.textContent = `${result.packs} bal.`; });
    $$('[data-hero-area]').forEach(el => { el.textContent = areaText(result.requiredArea); });
    $$('[data-hero-tiles]').forEach(el => { el.textContent = `${new Intl.NumberFormat('cs-CZ').format(result.tiles)} ks`; });
  }

  function calculateAndRender(showError = true) {
    try {
      const result = currentMode === 'advanced' ? calculateAdvanced() : calculateBasic();
      errorBox.hidden = true;
      renderResult(result);
      return result;
    } catch (error) {
      if (showError) {
        errorBox.textContent = error.message || 'Zkontrolujte zadané hodnoty.';
        errorBox.hidden = false;
      }
      return null;
    }
  }

  function seedAdvancedFromBasic() {
    if (advancedSeeded) return;
    let basic;
    try { basic = calculateBasic(); } catch { basic = null; }
    zoneList.innerHTML = '';
    zoneSerial = 0;
    if (basic && getBasicMethod() === 'dimensions') {
      addZone({ name: 'Hlavní plocha', type: 'floor', width: number($('#basicLength').value, 4), height: number($('#basicWidth').value, 3), pattern: $('#basicPattern').value });
    } else {
      const known = basic?.netArea || 12;
      addZone({ name: 'Hlavní plocha', type: 'other', width: known, height: 1, pattern: $('#basicPattern').value });
    }
    $('#advancedTileWidth').value = $('#basicTileWidth').value;
    $('#advancedTileHeight').value = $('#basicTileHeight').value;
    $('#advancedPackArea').value = $('#basicPackArea').value;
    $('#advancedPackPrice').value = $('#basicPackPrice').value;
    advancedSeeded = true;
  }

  function switchMode(mode) {
    currentMode = mode;
    form.dataset.mode = mode;
    document.body.dataset.calculatorMode = mode;
    const advanced = mode === 'advanced';
    if (advanced) seedAdvancedFromBasic();
    $('#basicCalculation').hidden = advanced;
    $('#advancedCalculation').hidden = !advanced;
    $$('.mode-button').forEach(button => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $('#calculateBtn').textContent = advanced ? 'Spočítat celý projekt' : 'Spočítat balení';
    calculateAndRender(false);
  }

  function updateBasicPattern() {
    const pattern = $('#basicPattern').value;
    $('#basicReserve').value = patternWaste[pattern] ?? 7;
    $$('[data-reserve-chip]').forEach(chip => chip.classList.toggle('is-active', number(chip.dataset.reserveChip) === number($('#basicReserve').value)));
    calculateAndRender(false);
  }

  function resetCalculator() {
    form.reset();
    advancedSeeded = false;
    zoneList.innerHTML = '';
    zoneSerial = 0;
    $('#basicTileWidth').value = 600;
    $('#basicTileHeight').value = 600;
    $('#basicPackArea').value = 1.44;
    $('#basicReserve').value = 7;
    switchMode('basic');
    setBasicMethod('dimensions');
    errorBox.hidden = true;
  }

  function setBasicMethod(method) {
    const dimensions = method === 'dimensions';
    $('#basicDimensionsFields').hidden = !dimensions;
    $('#basicAreaField').hidden = dimensions;
    calculateAndRender(false);
  }

  function copyResult() {
    if (!lastResult) return;
    const lines = [
      'Kalkulačka dlažby a obkladů – RychléVýpočty.cz',
      `Čistá plocha: ${areaText(lastResult.netArea)}`,
      `Plocha k nákupu: ${areaText(lastResult.requiredArea)}`,
      `Balení: ${lastResult.packs} ks (${areaText(lastResult.purchasedArea)})`,
      `Počet dlaždic: ${new Intl.NumberFormat('cs-CZ').format(lastResult.tiles)} ks`,
      lastResult.totalCost > 0 ? `Celkový rozpočet: ${money(lastResult.totalCost)}` : '',
      'https://www.rychlevypocty.cz/kalkulacka-dlazby-a-obkladu.html'
    ].filter(Boolean).join('\n');
    navigator.clipboard?.writeText(lines).then(() => {
      const button = $('#copyResultBtn');
      const original = button.textContent;
      button.textContent = 'Zkopírováno';
      setTimeout(() => { button.textContent = original; }, 1600);
    });
  }

  $$('.mode-button').forEach(button => button.addEventListener('click', () => switchMode(button.dataset.mode)));
  $$('input[name="basicMethod"]').forEach(radio => radio.addEventListener('change', () => setBasicMethod(radio.value)));
  $$('.tile-preset').forEach(button => button.addEventListener('click', () => {
    const preset = tilePresets[button.dataset.tilePreset];
    if (!preset) return;
    $('#basicTileWidth').value = preset.width;
    $('#basicTileHeight').value = preset.height;
    $('#basicPackArea').value = preset.pack;
    $$('.tile-preset').forEach(item => item.classList.toggle('is-active', item === button));
    calculateAndRender(false);
  }));
  $('#basicPattern').addEventListener('change', updateBasicPattern);
  $$('[data-reserve-chip]').forEach(chip => chip.addEventListener('click', () => {
    $('#basicReserve').value = chip.dataset.reserveChip;
    $$('[data-reserve-chip]').forEach(item => item.classList.toggle('is-active', item === chip));
    calculateAndRender(false);
  }));
  $('#addZoneBtn').addEventListener('click', () => addZone({ name: `Plocha ${$$('.zone-card', zoneList).length + 1}`, type: 'wall', width: 3, height: 2.6 }));
  $('#calculateBtn').addEventListener('click', (event) => { event.preventDefault(); calculateAndRender(true); });
  form.addEventListener('submit', event => { event.preventDefault(); calculateAndRender(true); });
  form.addEventListener('input', event => {
    if (event.target.closest('.zone-card')) return;
    calculateAndRender(false);
  });
  $('#resetBtn').addEventListener('click', resetCalculator);
  $('#copyResultBtn').addEventListener('click', copyResult);
  $('#printResultBtn').addEventListener('click', () => window.print());

  ['useAdhesive', 'useGrout', 'usePrimer', 'useHydro', 'useSkirting', 'useDemolition'].forEach(id => {
    $(`#${id}`).addEventListener('change', () => {
      const target = document.querySelector(`[data-toggle-fields="${id}"]`);
      if (target) target.hidden = !$(`#${id}`).checked;
      calculateAndRender(false);
    });
  });

  addZone({ name: 'Podlaha koupelny', type: 'floor', width: 2.8, height: 2.2, openings: 0, pattern: 'straight', wet: true });
  addZone({ name: 'Obklad stěn', type: 'wall', width: 7.2, height: 2.2, openings: 1.8, pattern: 'straight', wet: true });
  setBasicMethod('dimensions');
  switchMode('basic');
})();
