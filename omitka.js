(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const fmt = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });
  const money = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });
  const n = (value, fallback = 0) => {
    const parsed = Number(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const ceil = (value) => Math.ceil(Math.max(0, value));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const setText = (selector, value) => { const el = $(selector); if (el) el.textContent = value; };

  const presets = {
    gypsum: { label: 'Sádrová omítka', consumption: 0.8, thickness: 10, bag: 25, bagPrice: 245, waterPerBag: 10, reserve: 7 },
    lime: { label: 'Vápenocementová omítka', consumption: 1.45, thickness: 15, bag: 25, bagPrice: 185, waterPerBag: 5.8, reserve: 8 },
    core: { label: 'Jádrová omítka', consumption: 1.6, thickness: 15, bag: 25, bagPrice: 175, waterPerBag: 5.5, reserve: 10 },
    skim: { label: 'Jemná stěrka / štuk', consumption: 1.2, thickness: 2, bag: 20, bagPrice: 310, waterPerBag: 7, reserve: 8 }
  };

  const systemPresets = {
    gypsum: {
      label: 'Interiér – sádrová jednovrstvá',
      coreConsumption: 0.8, coreThickness: 10, coreBag: 25, corePrice: 245,
      finishEnabled: false, finishConsumption: 0, finishBag: 20, finishPrice: 0,
      primerEnabled: true, primerConsumption: 0.12, primerPack: 10, primerPrice: 620,
      meshEnabled: false, meshFactor: 1.08, meshRoll: 50, meshPrice: 1150,
      reserve: 7
    },
    lime: {
      label: 'Interiér – jádro + štuk',
      coreConsumption: 1.5, coreThickness: 15, coreBag: 25, corePrice: 185,
      finishEnabled: true, finishConsumption: 2.4, finishBag: 20, finishPrice: 310,
      primerEnabled: true, primerConsumption: 0.12, primerPack: 10, primerPrice: 620,
      meshEnabled: false, meshFactor: 1.08, meshRoll: 50, meshPrice: 1150,
      reserve: 9
    },
    facade: {
      label: 'Fasáda – armovací vrstva + omítka',
      coreConsumption: 4.5, coreThickness: 1, coreBag: 25, corePrice: 270,
      finishEnabled: true, finishConsumption: 2.5, finishBag: 25, finishPrice: 1650,
      primerEnabled: true, primerConsumption: 0.2, primerPack: 15, primerPrice: 1050,
      meshEnabled: true, meshFactor: 1.12, meshRoll: 50, meshPrice: 1250,
      reserve: 8
    },
    repair: {
      label: 'Lokální opravy a srovnání',
      coreConsumption: 1.2, coreThickness: 6, coreBag: 25, corePrice: 230,
      finishEnabled: true, finishConsumption: 1.8, finishBag: 20, finishPrice: 310,
      primerEnabled: true, primerConsumption: 0.15, primerPack: 10, primerPrice: 620,
      meshEnabled: true, meshFactor: 1.08, meshRoll: 50, meshPrice: 1150,
      reserve: 12
    }
  };

  const form = $('#plasterForm');
  if (!form) return;

  let mode = 'basic';
  let surfaceCounter = 0;

  function areaFromBasic() {
    const method = $('input[name="basicMeasure"]:checked')?.value || 'room';
    if (method === 'area') return Math.max(0, n($('#basicKnownArea')?.value));
    const length = Math.max(0, n($('#basicLength')?.value));
    const width = Math.max(0, n($('#basicWidth')?.value));
    const height = Math.max(0, n($('#basicHeight')?.value));
    const walls = 2 * (length + width) * height;
    const ceiling = $('#basicCeiling')?.checked ? length * width : 0;
    const openings = Math.max(0, n($('#basicOpenings')?.value));
    return Math.max(0, walls + ceiling - openings);
  }

  function getBasicData() {
    const area = areaFromBasic();
    const consumption = Math.max(0, n($('#basicConsumption')?.value, 0.8));
    const thickness = Math.max(0, n($('#basicThickness')?.value, 10));
    const reserve = clamp(n($('#basicReserve')?.value, 7), 0, 50);
    const bag = Math.max(0.1, n($('#basicBag')?.value, 25));
    const bagPrice = Math.max(0, n($('#basicBagPrice')?.value, 0));
    const waterPerBag = Math.max(0, n($('#basicWater')?.value, 0));
    const dryBase = area * consumption * thickness;
    const dryWithReserve = dryBase * (1 + reserve / 100);
    const bags = ceil(dryWithReserve / bag);
    const purchasedKg = bags * bag;
    return {
      area, consumption, thickness, reserve, bag, bagPrice, waterPerBag,
      dryBase, dryWithReserve, bags, purchasedKg,
      excessKg: Math.max(0, purchasedKg - dryWithReserve),
      water: bags * waterPerBag,
      materialCost: bags * bagPrice
    };
  }

  function calculateBasic() {
    const d = getBasicData();
    setText('#resultMain', `${fmt.format(d.bags)} pytlů`);
    setText('#resultSub', `${fmt.format(d.purchasedKg)} kg nakoupené směsi`);
    setText('#metricArea', `${fmt.format(d.area)} m²`);
    setText('#metricNeed', `${fmt.format(d.dryWithReserve)} kg`);
    setText('#metricWater', `${fmt.format(d.water)} l`);
    setText('#metricCost', money.format(d.materialCost));
    setText('#summaryThickness', `${fmt.format(d.thickness)} mm`);
    setText('#summaryConsumption', `${fmt.format(d.consumption)} kg/m²/mm`);
    setText('#summaryReserve', `${fmt.format(d.reserve)} %`);
    setText('#summaryExcess', `${fmt.format(d.excessKg)} kg`);
    setText('[data-hero-bags]', `${fmt.format(d.bags)} pytlů`);
    setText('[data-hero-area]', `${fmt.format(d.area)} m²`);
    setText('[data-hero-kg]', `${fmt.format(d.dryWithReserve)} kg`);
    const max = Math.max(d.purchasedKg, 1);
    const needPct = clamp((d.dryWithReserve / max) * 100, 0, 100);
    const needBar = $('#needBar');
    const excessBar = $('#excessBar');
    if (needBar) needBar.style.width = `${needPct}%`;
    if (excessBar) excessBar.style.width = `${100 - needPct}%`;
    const typeLabel = presets[$('#basicType')?.value]?.label || 'Vlastní směs';
    setText('#resultType', typeLabel);
    const insight = d.area <= 0
      ? 'Zadejte kladné rozměry nebo plochu. Výsledek se přepočítá automaticky.'
      : d.bags <= 5
        ? 'Jde o menší realizaci. Před nákupem zkontrolujte minimální tloušťku vrstvy a zda lze otevřené balení bezpečně skladovat.'
        : d.excessKg > d.bag * 0.65
          ? 'Zaokrouhlení na celé pytle vytváří větší přebytek. U větší stavby porovnejte paletové balení nebo strojní dodávku.'
          : 'Objednávka vychází s rozumným přebytkem. Před nákupem ještě ověřte spotřebu v technickém listu konkrétní směsi.';
    setText('#resultInsightText', insight);
    renderScenarios(d);
  }

  function renderScenarios(d) {
    const holder = $('#scenarioGrid');
    if (!holder) return;
    holder.innerHTML = [5, 8, 10, 15].map(reserve => {
      const kg = d.dryBase * (1 + reserve / 100);
      const bags = ceil(kg / d.bag);
      const current = Math.round(d.reserve) === reserve ? ' is-current' : '';
      return `<article class="scenario-card${current}"><span>Rezerva ${reserve} %</span><strong>${fmt.format(bags)} pytlů</strong><small>${fmt.format(kg)} kg · nákup ${fmt.format(bags * d.bag)} kg</small></article>`;
    }).join('');
  }

  function setBasicPreset(key) {
    const p = presets[key] || presets.gypsum;
    $('#basicConsumption').value = p.consumption;
    $('#basicThickness').value = p.thickness;
    $('#basicBag').value = p.bag;
    $('#basicBagPrice').value = p.bagPrice;
    $('#basicWater').value = p.waterPerBag;
    $('#basicReserve').value = p.reserve;
    setText('#basicReserveOutput', `${p.reserve} %`);
    $$('.reserve-chip').forEach(btn => btn.classList.toggle('is-active', n(btn.dataset.reserve) === p.reserve));
    calculateBasic();
  }

  function surfaceTemplate(data = {}) {
    const id = ++surfaceCounter;
    return `<article class="surface-card" data-surface-id="${id}">
      <div class="surface-head"><div class="surface-title"><span class="surface-index">${String(id).padStart(2, '0')}</span><input class="surface-name" aria-label="Název plochy" value="${data.name || `Stěny ${id}`}"></div><button class="remove-surface" type="button">Odebrat</button></div>
      <div class="surface-grid">
        <label class="surface-field"><span>Způsob zadání</span><select data-key="measure"><option value="dimensions">Rozměry</option><option value="area">Známá plocha</option></select></label>
        <label class="surface-field dimension-field"><span>Délka / součet šířek</span><input data-key="length" type="number" min="0" step="0.1" value="${data.length ?? 12}"><small>m</small></label>
        <label class="surface-field dimension-field"><span>Výška</span><input data-key="height" type="number" min="0" step="0.1" value="${data.height ?? 2.6}"><small>m</small></label>
        <label class="surface-field area-field" hidden><span>Známá plocha</span><input data-key="area" type="number" min="0" step="0.1" value="${data.area ?? 30}"><small>m²</small></label>
        <label class="surface-field"><span>Otvory</span><input data-key="openings" type="number" min="0" step="0.1" value="${data.openings ?? 3}"><small>m²</small></label>
        <label class="surface-field"><span>Opakování</span><input data-key="count" type="number" min="1" step="1" value="${data.count ?? 1}"><small>×</small></label>
        <label class="surface-field"><span>Korekce nerovnosti</span><select data-key="factor"><option value="1">Rovný podklad</option><option value="1.08">Mírné dorovnání +8 %</option><option value="1.15">Nerovný podklad +15 %</option><option value="1.25">Výrazné dorovnání +25 %</option></select></label>
        <label class="surface-field"><span>Rohy a ostění</span><input data-key="edges" type="number" min="0" step="0.5" value="${data.edges ?? 8}"><small>bm</small></label>
      </div>
    </article>`;
  }

  function addSurface(data) {
    $('#surfaceList').insertAdjacentHTML('beforeend', surfaceTemplate(data));
    calculateAdvanced();
  }

  function readSurfaces() {
    return $$('.surface-card').map(card => {
      const val = (key) => n($(`[data-key="${key}"]`, card)?.value);
      const measure = $('[data-key="measure"]', card)?.value || 'dimensions';
      const baseArea = measure === 'area' ? val('area') : val('length') * val('height');
      const netArea = Math.max(0, baseArea - val('openings')) * Math.max(1, val('count'));
      const adjustedArea = netArea * Math.max(0.5, val('factor') || 1);
      return { name: $('.surface-name', card)?.value || 'Plocha', netArea, adjustedArea, edges: val('edges') * Math.max(1, val('count')) };
    });
  }

  function getAdvancedData() {
    const surfaces = readSurfaces();
    const netArea = surfaces.reduce((s, item) => s + item.netArea, 0);
    const adjustedArea = surfaces.reduce((s, item) => s + item.adjustedArea, 0);
    const edges = surfaces.reduce((s, item) => s + item.edges, 0);
    const reserve = clamp(n($('#advReserve')?.value, 8), 0, 50);
    const coreConsumption = Math.max(0, n($('#advCoreConsumption')?.value, 0.8));
    const coreThickness = Math.max(0, n($('#advCoreThickness')?.value, 10));
    const coreBag = Math.max(0.1, n($('#advCoreBag')?.value, 25));
    const corePrice = Math.max(0, n($('#advCorePrice')?.value, 0));
    const coreKg = adjustedArea * coreConsumption * coreThickness * (1 + reserve / 100);
    const coreBags = ceil(coreKg / coreBag);
    const coreCost = coreBags * corePrice;

    const finishEnabled = $('#advFinishEnabled')?.checked;
    const finishConsumption = Math.max(0, n($('#advFinishConsumption')?.value, 0));
    const finishBag = Math.max(0.1, n($('#advFinishBag')?.value, 20));
    const finishPrice = Math.max(0, n($('#advFinishPrice')?.value, 0));
    const finishKg = finishEnabled ? adjustedArea * finishConsumption * (1 + reserve / 100) : 0;
    const finishBags = finishEnabled ? ceil(finishKg / finishBag) : 0;
    const finishCost = finishBags * finishPrice;

    const primerEnabled = $('#advPrimerEnabled')?.checked;
    const primerConsumption = Math.max(0, n($('#advPrimerConsumption')?.value, 0.12));
    const primerPack = Math.max(0.1, n($('#advPrimerPack')?.value, 10));
    const primerPrice = Math.max(0, n($('#advPrimerPrice')?.value, 0));
    const primerLitres = primerEnabled ? adjustedArea * primerConsumption * (1 + reserve / 100) : 0;
    const primerPacks = primerEnabled ? ceil(primerLitres / primerPack) : 0;
    const primerCost = primerPacks * primerPrice;

    const meshEnabled = $('#advMeshEnabled')?.checked;
    const meshFactor = Math.max(1, n($('#advMeshFactor')?.value, 1.1));
    const meshRoll = Math.max(0.1, n($('#advMeshRoll')?.value, 50));
    const meshPrice = Math.max(0, n($('#advMeshPrice')?.value, 0));
    const meshArea = meshEnabled ? netArea * meshFactor : 0;
    const meshRolls = meshEnabled ? ceil(meshArea / meshRoll) : 0;
    const meshCost = meshRolls * meshPrice;

    const beadEnabled = $('#advBeadEnabled')?.checked;
    const beadLength = Math.max(0.1, n($('#advBeadLength')?.value, 2.5));
    const beadPrice = Math.max(0, n($('#advBeadPrice')?.value, 0));
    const beadPieces = beadEnabled ? ceil(edges / beadLength) : 0;
    const beadCost = beadPieces * beadPrice;

    const prepRate = Math.max(0, n($('#advPrepRate')?.value, 0));
    const coreWorkRate = Math.max(0, n($('#advCoreWorkRate')?.value, 0));
    const finishWorkRate = finishEnabled ? Math.max(0, n($('#advFinishWorkRate')?.value, 0)) : 0;
    const meshWorkRate = meshEnabled ? Math.max(0, n($('#advMeshWorkRate')?.value, 0)) : 0;
    const beadWorkRate = beadEnabled ? Math.max(0, n($('#advBeadWorkRate')?.value, 0)) : 0;
    const transport = Math.max(0, n($('#advTransport')?.value, 0));
    const machine = Math.max(0, n($('#advMachine')?.value, 0));
    const other = Math.max(0, n($('#advOther')?.value, 0));
    const workCost = netArea * (prepRate + coreWorkRate + finishWorkRate + meshWorkRate) + edges * beadWorkRate;
    const materialCost = coreCost + finishCost + primerCost + meshCost + beadCost;
    const total = materialCost + workCost + transport + machine + other;
    const productivity = Math.max(1, n($('#advProductivity')?.value, 35));
    const workers = Math.max(1, n($('#advWorkers')?.value, 2));
    const days = netArea / (productivity * workers);

    return { surfaces, netArea, adjustedArea, edges, reserve, coreKg, coreBags, coreCost, finishKg, finishBags, finishCost, primerLitres, primerPacks, primerCost, meshArea, meshRolls, meshCost, beadPieces, beadCost, materialCost, workCost, transport, machine, other, total, days };
  }

  function calculateAdvanced() {
    const d = getAdvancedData();
    setText('#advResultMain', money.format(d.total));
    setText('#advResultSub', `${fmt.format(d.netArea)} m² projektu · ${fmt.format(d.coreBags)} pytlů hlavní směsi`);
    setText('#advMetricArea', `${fmt.format(d.netArea)} m²`);
    setText('#advMetricCore', `${fmt.format(d.coreBags)} pytlů`);
    setText('#advMetricMaterial', money.format(d.materialCost));
    setText('#advMetricWork', money.format(d.workCost));
    setText('#advPrimerResult', d.primerPacks ? `${fmt.format(d.primerPacks)} bal.` : 'Vypnuto');
    setText('#advMeshResult', d.meshRolls ? `${fmt.format(d.meshRolls)} rolí` : 'Vypnuto');
    setText('#advBeadResult', d.beadPieces ? `${fmt.format(d.beadPieces)} ks` : 'Vypnuto');
    setText('#advDaysResult', `${fmt.format(d.days)} dne`);
    setText('#advTotalMaterial', money.format(d.materialCost));
    setText('#advTotalWork', money.format(d.workCost));
    setText('#advTotalExtras', money.format(d.transport + d.machine + d.other));
    setText('#advTotalAll', money.format(d.total));
    const tbody = $('#surfaceTableBody');
    if (tbody) tbody.innerHTML = d.surfaces.map(s => `<tr><td>${s.name}</td><td>${fmt.format(s.netArea)} m²</td><td>${fmt.format(s.adjustedArea)} m²</td><td>${fmt.format(s.edges)} bm</td></tr>`).join('');
    const insight = d.netArea <= 0 ? 'Přidejte plochu s kladnými rozměry. Projekt se přepočítá automaticky.' : d.workCost > d.materialCost * 2 ? 'V tomto scénáři tvoří největší část rozpočtu práce. Při porovnání nabídek ověřte, zda zahrnují stejnou přípravu podkladu, profily a dokončení.' : d.materialCost > d.workCost ? 'Materiál tvoří významnou část rozpočtu. Ověřte spotřebu, velikost balení a kompatibilitu všech vrstev v jednom systému.' : 'Poměr materiálu a práce působí vyváženě. Před objednávkou ještě ověřte skutečnou rovnost podkladu a technické listy všech vrstev.';
    setText('#resultInsightText', insight);
  }

  function setSystemPreset(key) {
    const p = systemPresets[key] || systemPresets.gypsum;
    $('#advCoreConsumption').value = p.coreConsumption;
    $('#advCoreThickness').value = p.coreThickness;
    $('#advCoreBag').value = p.coreBag;
    $('#advCorePrice').value = p.corePrice;
    $('#advFinishEnabled').checked = p.finishEnabled;
    $('#advFinishConsumption').value = p.finishConsumption;
    $('#advFinishBag').value = p.finishBag;
    $('#advFinishPrice').value = p.finishPrice;
    $('#advPrimerEnabled').checked = p.primerEnabled;
    $('#advPrimerConsumption').value = p.primerConsumption;
    $('#advPrimerPack').value = p.primerPack;
    $('#advPrimerPrice').value = p.primerPrice;
    $('#advMeshEnabled').checked = p.meshEnabled;
    $('#advMeshFactor').value = p.meshFactor;
    $('#advMeshRoll').value = p.meshRoll;
    $('#advMeshPrice').value = p.meshPrice;
    $('#advReserve').value = p.reserve;
    updateConditionalFields();
    calculateAdvanced();
  }

  function updateConditionalFields() {
    $$('[data-feature-fields]').forEach(group => {
      const control = $(`#${group.dataset.featureFields}`);
      group.hidden = !control?.checked;
    });
    $$('.surface-card').forEach(card => {
      const isArea = $('[data-key="measure"]', card)?.value === 'area';
      $$('.dimension-field', card).forEach(el => el.hidden = isArea);
      $$('.area-field', card).forEach(el => el.hidden = !isArea);
    });
  }

  function switchMode(nextMode) {
    mode = nextMode;
    document.body.dataset.calculatorMode = mode;
    form.dataset.mode = mode;
    $('#basicCalculation').hidden = mode !== 'basic';
    $('#advancedCalculation').hidden = mode !== 'advanced';
    $('#basicResults').hidden = mode !== 'basic';
    $('#advancedResults').hidden = mode !== 'advanced';
    $$('.mode-button').forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    setText('#resultModeBadge', mode === 'basic' ? 'Základní režim' : 'Rozšířený projekt');
    if (mode === 'advanced') calculateAdvanced(); else calculateBasic();
  }

  function resetAll() {
    form.reset();
    $('#surfaceList').innerHTML = '';
    surfaceCounter = 0;
    addSurface({ name: 'Obvodové stěny', length: 18, height: 2.7, openings: 5.5, edges: 14 });
    setBasicPreset('gypsum');
    setSystemPreset('gypsum');
    switchMode('basic');
    updateConditionalFields();
  }

  form.addEventListener('input', event => {
    if (event.target.id === 'basicReserve') setText('#basicReserveOutput', `${fmt.format(n(event.target.value))} %`);
    updateConditionalFields();
    mode === 'advanced' ? calculateAdvanced() : calculateBasic();
  });
  form.addEventListener('change', event => {
    if (event.target.id === 'basicType') setBasicPreset(event.target.value);
    if (event.target.id === 'advSystem') setSystemPreset(event.target.value);
    updateConditionalFields();
    mode === 'advanced' ? calculateAdvanced() : calculateBasic();
  });
  form.addEventListener('submit', event => { event.preventDefault(); mode === 'advanced' ? calculateAdvanced() : calculateBasic(); });
  form.addEventListener('click', event => {
    const modeButton = event.target.closest('.mode-button');
    if (modeButton) switchMode(modeButton.dataset.mode);
    const reserveButton = event.target.closest('.reserve-chip');
    if (reserveButton) {
      $('#basicReserve').value = reserveButton.dataset.reserve;
      setText('#basicReserveOutput', `${reserveButton.dataset.reserve} %`);
      $$('.reserve-chip').forEach(btn => btn.classList.toggle('is-active', btn === reserveButton));
      calculateBasic();
    }
    if (event.target.closest('#addSurface')) addSurface();
    if (event.target.closest('.remove-surface')) {
      const card = event.target.closest('.surface-card');
      if ($$('.surface-card').length > 1) card.remove();
      calculateAdvanced();
    }
    if (event.target.closest('#resetBtn')) resetAll();
    if (event.target.closest('#copyResult')) {
      const text = mode === 'basic' ? `Omítka: ${$('#resultMain').textContent}, ${$('#metricNeed').textContent}, cena ${$('#metricCost').textContent}.` : `Projekt omítek: ${$('#advResultMain').textContent}, plocha ${$('#advMetricArea').textContent}.`;
      navigator.clipboard?.writeText(text);
      event.target.closest('#copyResult').textContent = 'Zkopírováno';
      setTimeout(() => { const btn = $('#copyResult'); if (btn) btn.textContent = 'Kopírovat výsledek'; }, 1300);
    }
    if (event.target.closest('#printResult')) window.print();
  });

  addSurface({ name: 'Obvodové stěny', length: 18, height: 2.7, openings: 5.5, edges: 14 });
  setBasicPreset('gypsum');
  setSystemPreset('gypsum');
  switchMode('basic');
  updateConditionalFields();
})();
