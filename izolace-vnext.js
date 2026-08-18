(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const EPS = 1e-9;
  const nf0 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const nf2 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nf3 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const money = (v) => `${nf0.format(Math.round(v || 0))} Kč`;
  const num = (v, fallback = 0) => {
    const parsed = Number(String(v ?? '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const ceilSafe = (v) => Math.ceil(v - EPS);

  const PRODUCTS = {
    frontrock: {
      manufacturer: 'ROCKWOOL',
      name: 'FRONTROCK SUPER',
      use: 'ETICS fasáda',
      source: 'https://www.rockwool.com/cz/frontrock-super/',
      salesNote: 'Výrobce v produktové tabulce uvádí prodejní jednotku Paleta.',
      variants: [
        { t: 100, lambda: 0.036, packArea: 1.8, pieces: 3, length: 1000, width: 600, palletArea: 28.8, packsPerPallet: 16 },
        { t: 120, lambda: 0.036, packArea: 1.8, pieces: 3, length: 1000, width: 600, palletArea: 21.6, packsPerPallet: 12 },
        { t: 140, lambda: 0.036, packArea: 1.2, pieces: 2, length: 1000, width: 600, palletArea: 19.2, packsPerPallet: 16 },
        { t: 150, lambda: 0.036, packArea: 1.2, pieces: 2, length: 1000, width: 600, palletArea: 19.2, packsPerPallet: 16 },
        { t: 160, lambda: 0.036, packArea: 1.2, pieces: 2, length: 1000, width: 600, palletArea: 14.4, packsPerPallet: 12 },
        { t: 180, lambda: 0.036, packArea: 1.2, pieces: 2, length: 1000, width: 600, palletArea: 14.4, packsPerPallet: 12 },
        { t: 200, lambda: 0.036, packArea: 1.2, pieces: 2, length: 1000, width: 600, palletArea: 14.4, packsPerPallet: 12 }
      ]
    },
    resolution: {
      manufacturer: 'Austrotherm',
      name: 'Resolution Fasáda',
      use: 'ETICS fasáda',
      source: 'https://www.austrotherm.cz/produkty/austrotherm-resolution/austrotherm-resolution-fasada',
      salesNote: 'Balení a deklarovaný tepelný odpor se mění s tloušťkou.',
      variants: [
        { t: 25, lambda: 0.022, packArea: 8.0, pieces: 16, length: 1000, width: 500, sourceR: 1.10 },
        { t: 30, lambda: 0.022, packArea: 6.5, pieces: 13, length: 1000, width: 500, sourceR: 1.35 },
        { t: 40, lambda: 0.022, packArea: 5.0, pieces: 10, length: 1000, width: 500, sourceR: 1.80 },
        { t: 50, lambda: 0.022, packArea: 4.0, pieces: 8, length: 1000, width: 500, sourceR: 2.25 },
        { t: 60, lambda: 0.022, packArea: 3.0, pieces: 6, length: 1000, width: 500, sourceR: 2.70 },
        { t: 70, lambda: 0.022, packArea: 2.5, pieces: 5, length: 1000, width: 500, sourceR: 3.15 },
        { t: 80, lambda: 0.022, packArea: 2.5, pieces: 5, length: 1000, width: 500, sourceR: 3.60 },
        { t: 90, lambda: 0.022, packArea: 2.0, pieces: 4, length: 1000, width: 500, sourceR: 4.05 },
        { t: 100, lambda: 0.022, packArea: 2.0, pieces: 4, length: 1000, width: 500, sourceR: 4.50 },
        { t: 120, lambda: 0.022, packArea: 1.5, pieces: 3, length: 1000, width: 500, sourceR: 5.45 },
        { t: 140, lambda: 0.022, packArea: 1.0, pieces: 2, length: 1000, width: 500, sourceR: 6.35 },
        { t: 160, lambda: 0.022, packArea: 1.0, pieces: 2, length: 1000, width: 500, sourceR: 7.25 },
        { t: 180, lambda: 0.022, packArea: 1.0, pieces: 2, length: 1000, width: 500, sourceR: 8.15 },
        { t: 200, lambda: 0.022, packArea: 1.0, pieces: 2, length: 1000, width: 500, sourceR: 9.05 }
      ]
    },
    xps: {
      manufacturer: 'Austrotherm',
      name: 'XPS TOP 30 SF',
      use: 'základy, podlahy, sokl, ploché střechy',
      source: 'https://www.austrotherm.cz/produkty/austrotherm-xps/austrotherm-xps-top-30-sf',
      salesNote: 'U této řady se s tloušťkou mění plocha balení i deklarovaná λ.',
      variants: [
        { t: 30, lambda: 0.033, packArea: 10.5, pieces: 14, length: 1250, width: 600, packsPerPallet: 12 },
        { t: 40, lambda: 0.032, packArea: 7.5, pieces: 10, length: 1250, width: 600, packsPerPallet: 12 },
        { t: 50, lambda: 0.032, packArea: 6.0, pieces: 8, length: 1250, width: 600, packsPerPallet: 12 },
        { t: 60, lambda: 0.033, packArea: 5.25, pieces: 7, length: 1250, width: 600, packsPerPallet: 12 },
        { t: 70, lambda: 0.033, packArea: 4.5, pieces: 6, length: 1250, width: 600, packsPerPallet: 12 },
        { t: 80, lambda: 0.035, packArea: 3.75, pieces: 5, length: 1250, width: 600, packsPerPallet: 12 },
        { t: 100, lambda: 0.035, packArea: 3.0, pieces: 4, length: 1250, width: 600, packsPerPallet: 12 },
        { t: 120, lambda: 0.035, packArea: 2.25, pieces: 3, length: 1250, width: 600, packsPerPallet: 14 },
        { t: 140, lambda: 0.036, packArea: 2.25, pieces: 3, length: 1250, width: 600, packsPerPallet: 12 },
        { t: 160, lambda: 0.036, packArea: 1.5, pieces: 2, length: 1250, width: 600, packsPerPallet: 16 }
      ]
    }
  };

  let currentMode = 'buy';
  let projectSerial = 0;
  let lastText = '';

  function fmtArea(v) { return `${nf2.format(v)} m²`; }
  function fmtR(v) { return `${nf2.format(v)} m²·K/W`; }
  function fmtLambda(v) { return `${nf3.format(v)} W/mK`; }
  function fmtVolume(v) { return `${nf2.format(v)} m³`; }

  function productOptions(includeCustom = true) {
    const opts = Object.entries(PRODUCTS).map(([key, p]) => `<option value="${key}">${p.manufacturer} ${p.name}</option>`).join('');
    return opts + (includeCustom ? '<option value="custom">Vlastní výrobek / technický list</option>' : '');
  }

  function fillProductSelect(select, includeCustom = true, selected = 'frontrock') {
    select.innerHTML = productOptions(includeCustom);
    select.value = selected;
  }

  function fillThickness(select, productKey, preferred) {
    if (productKey === 'custom') return;
    const p = PRODUCTS[productKey];
    select.innerHTML = p.variants.map(v => `<option value="${v.t}">${v.t} mm · ${nf2.format(v.packArea)} m²/balení · λ ${nf3.format(v.lambda)}</option>`).join('');
    const target = p.variants.some(v => v.t === preferred) ? preferred : (productKey === 'frontrock' ? 160 : p.variants[Math.min(5, p.variants.length - 1)].t);
    select.value = String(target);
  }

  function getVariant(productKey, thickness, prefix = 'buy') {
    if (productKey === 'custom') {
      const name = $(`${prefix}CustomName`).value.trim() || 'Vlastní izolace';
      const t = Math.max(1, num($(`${prefix}CustomThickness`).value, 160));
      const lambda = Math.max(0.001, num($(`${prefix}CustomLambda`).value, 0.038));
      const packArea = Math.max(0.01, num($(`${prefix}CustomPackArea`).value, 1.2));
      return { productKey, manufacturer: '', name, use: 'dle technického listu', source: '', salesNote: 'Vlastní hodnoty uživatele.', t, lambda, packArea, pieces: 0, length: 0, width: 0 };
    }
    const p = PRODUCTS[productKey];
    const v = p.variants.find(x => x.t === Number(thickness)) || p.variants[0];
    return { productKey, ...p, ...v };
  }

  function calcArea(prefix) {
    const mode = $(`${prefix}AreaMode`).value;
    if (mode === 'direct') {
      const area = Math.max(0, num($(`${prefix}DirectArea`).value));
      if (!area) throw new Error('Zadejte kladnou čistou plochu izolace.');
      return { netArea: area, detail: 'známá plocha' };
    }
    const width = Math.max(0, num($(`${prefix}Width`).value));
    const height = Math.max(0, num($(`${prefix}Height`).value));
    const openings = Math.max(0, num($(`${prefix}Openings`).value));
    const gross = width * height;
    const netArea = Math.max(0, gross - openings);
    if (!width || !height || !netArea) throw new Error('Zadejte kladné rozměry a zkontrolujte odečtenou plochu otvorů.');
    return { netArea, detail: `${nf2.format(width)} × ${nf2.format(height)} m − ${nf2.format(openings)} m² otvorů` };
  }

  function calcOrder(netArea, reserve, variant, price = 0) {
    const required = netArea * (1 + reserve / 100);
    const packs = ceilSafe(required / variant.packArea);
    const purchased = packs * variant.packArea;
    const excess = Math.max(0, purchased - required);
    const r = (variant.t / 1000) / variant.lambda;
    const layerVolume = netArea * variant.t / 1000;
    const purchasedVolume = purchased * variant.t / 1000;
    const cost = packs * price;
    let pallet = null;
    if (variant.packsPerPallet) {
      const pallets = ceilSafe(packs / variant.packsPerPallet);
      const palletPacks = pallets * variant.packsPerPallet;
      const palletArea = variant.palletArea ? pallets * variant.palletArea : palletPacks * variant.packArea;
      pallet = { pallets, palletPacks, palletArea };
    }
    return { netArea, reserve, required, packs, purchased, excess, r, layerVolume, purchasedVolume, cost, pallet };
  }

  function renderProductCard(prefix, variant) {
    const box = $(`${prefix}ProductCard`);
    if (!box) return;
    const source = variant.source ? `<a href="${variant.source}" rel="noopener noreferrer" target="_blank">Technický zdroj výrobce ↗</a>` : '<span>Vlastní technické údaje</span>';
    box.innerHTML = `<div><span>${variant.manufacturer || 'Vlastní'}</span><strong>${variant.name} · ${variant.t} mm</strong><p>${variant.use}</p></div><dl><div><dt>λ</dt><dd>${fmtLambda(variant.lambda)}</dd></div><div><dt>Balení</dt><dd>${fmtArea(variant.packArea)}</dd></div>${variant.pieces ? `<div><dt>Desek</dt><dd>${variant.pieces} ks</dd></div>` : ''}${variant.length ? `<div><dt>Rozměr</dt><dd>${variant.length} × ${variant.width} mm</dd></div>` : ''}</dl><footer>${source}</footer>`;
  }

  function updateCustomVisibility(prefix, productKey) {
    const el = $(`${prefix}CustomFields`);
    if (el) el.hidden = productKey !== 'custom';
    const thickness = $(`${prefix}Thickness`);
    if (thickness) thickness.closest('.in-field').hidden = productKey === 'custom';
  }

  function getBuyVariant() {
    const key = $('buyProduct').value;
    updateCustomVisibility('buy', key);
    return getVariant(key, num($('buyThickness').value, 160), 'buy');
  }

  function calcBuy() {
    const area = calcArea('buy');
    const variant = getBuyVariant();
    const reserve = clamp(num($('buyReserve').value, 5), 0, 40);
    const price = Math.max(0, num($('buyPackPrice').value));
    return { ...calcOrder(area.netArea, reserve, variant, price), variant, detail: area.detail };
  }

  function renderBuy(result) {
    $('resultMode').textContent = 'nákup';
    $('resultLabel').textContent = 'Nákupní potřeba';
    $('resultPrimary').textContent = `${result.packs} balení`;
    $('resultSub').textContent = `${fmtArea(result.purchased)} skutečně pokryto při nákupu`;
    $('resultGrid').innerHTML = `
      <div><span>Čistá plocha</span><strong>${fmtArea(result.netArea)}</strong></div>
      <div><span>Po rezervě</span><strong>${fmtArea(result.required)}</strong></div>
      <div><span>Přebytek nad potřebou</span><strong>${fmtArea(result.excess)}</strong></div>
      <div><span>Objem vrstvy</span><strong>${fmtVolume(result.layerVolume)}</strong></div>`;
    $('resultThermal').innerHTML = `<div><span>Tloušťka</span><strong>${result.variant.t} mm</strong></div><div><span>λD / λ</span><strong>${fmtLambda(result.variant.lambda)}</strong></div><div class="in-thermal-r"><span>R samotné vrstvy</span><strong>${fmtR(result.r)}</strong></div>`;
    const palletNote = result.variant.productKey === 'frontrock' && result.pallet
      ? `<div class="in-result-alert"><strong>Paletový scénář výrobce</strong><p>ROCKWOOL uvádí prodejní jednotku Paleta. Pokud dodavatel prodává jen celé palety, ${result.pallet.pallets} pal. = ${result.pallet.palletPacks} balení = ${fmtArea(result.pallet.palletArea)}. Ověřte obchodní podmínky dodavatele.</p></div>`
      : '';
    $('resultRows').innerHTML = `<div class="in-result-row"><span>${result.variant.manufacturer || 'Vlastní výrobek'} ${result.variant.name}</span><strong>${result.packs} bal.</strong><small>${result.variant.t} mm · ${fmtArea(result.variant.packArea)}/balení</small></div>${result.cost > 0 ? `<div class="in-result-row"><span>Cena podle vašeho vstupu</span><strong>${money(result.cost)}</strong><small>${money(num($('buyPackPrice').value))} / balení</small></div>` : ''}${palletNote}`;
    $('resultGuide').innerHTML = `<strong>Jak číst výsledek</strong><p>Nejprve přidáváme viditelnou rezervu, teprve potom zaokrouhlujeme na celé balení konkrétní varianty. R je pouze odpor této izolační vrstvy — nikoli U celé konstrukce.</p>`;
    renderProductCard('buy', result.variant);
    lastText = `Izolace – nákupní plán\n${result.variant.manufacturer} ${result.variant.name} ${result.variant.t} mm\nČistá plocha: ${fmtArea(result.netArea)}\nPo rezervě: ${fmtArea(result.required)}\nObjednávková potřeba: ${result.packs} balení = ${fmtArea(result.purchased)}\nR samotné vrstvy: ${fmtR(result.r)}`;
  }

  function calcCompareVariant(productKey, t, area, reserve) {
    const v = getVariant(productKey, t, 'compare');
    return { variant: v, ...calcOrder(area, reserve, v, 0) };
  }

  function renderCompare() {
    const area = Math.max(0.1, num($('compareArea').value, 45));
    const reserve = clamp(num($('compareReserve').value, 5), 0, 40);
    const key = $('compareProduct').value;
    const a = calcCompareVariant(key, num($('compareThicknessA').value), area, reserve);
    const b = calcCompareVariant(key, num($('compareThicknessB').value), area, reserve);
    $('resultMode').textContent = 'porovnání';
    $('resultLabel').textContent = 'Tepelný odpor vrstvy';
    $('resultPrimary').textContent = `${nf2.format(a.r)} → ${nf2.format(b.r)}`;
    $('resultSub').textContent = `${a.variant.t} mm vs. ${b.variant.t} mm · stejná plocha ${fmtArea(area)}`;
    $('resultGrid').innerHTML = `<div><span>${a.variant.t} mm · balení</span><strong>${a.packs} bal.</strong></div><div><span>${b.variant.t} mm · balení</span><strong>${b.packs} bal.</strong></div><div><span>${a.variant.t} mm · m²/bal.</span><strong>${nf2.format(a.variant.packArea)}</strong></div><div><span>${b.variant.t} mm · m²/bal.</span><strong>${nf2.format(b.variant.packArea)}</strong></div>`;
    $('resultThermal').innerHTML = `<div><span>${a.variant.t} mm</span><strong>R ${nf2.format(a.r)}</strong></div><div><span>${b.variant.t} mm</span><strong>R ${nf2.format(b.r)}</strong></div><div class="in-thermal-r"><span>Rozdíl R</span><strong>+${nf2.format(b.r - a.r)}</strong></div>`;
    $('resultRows').innerHTML = `<div class="in-compare-cards"><article><span>Varianta A</span><strong>${a.variant.t} mm</strong><b>${a.packs} balení</b><small>${fmtArea(a.purchased)} nakoupeno · λ ${nf3.format(a.variant.lambda)}</small></article><article><span>Varianta B</span><strong>${b.variant.t} mm</strong><b>${b.packs} balení</b><small>${fmtArea(b.purchased)} nakoupeno · λ ${nf3.format(b.variant.lambda)}</small></article></div>`;
    $('resultGuide').innerHTML = `<strong>Stejný výrobek nemusí mít stejné balení</strong><p>Změna tloušťky může změnit R vrstvy i m² v jednom balení. Proto počet balení nemusí růst plynule s tloušťkou.</p>`;
    lastText = `Izolace – porovnání tlouštěk\n${a.variant.manufacturer} ${a.variant.name}\n${a.variant.t} mm: R ${nf2.format(a.r)}, ${a.packs} balení\n${b.variant.t} mm: R ${nf2.format(b.r)}, ${b.packs} balení`;
  }

  function projectRowMarkup(row = {}) {
    projectSerial += 1;
    return `<article class="in-project-row"><span class="in-project-index">${String(projectSerial).padStart(2, '0')}</span><label><span>Název plochy</span><input class="project-name" type="text" value="${row.name || `Plocha ${projectSerial}`}"></label><label><span>Čistá plocha</span><div class="in-unit"><input class="project-area" type="number" min="0.1" step="0.1" value="${row.area ?? 5}"><b>m²</b></div></label><button class="project-remove" type="button" aria-label="Odebrat plochu">×</button></article>`;
  }

  function addProjectRow(row) {
    const wrap = $('projectRows');
    wrap.insertAdjacentHTML('beforeend', projectRowMarkup(row));
    const el = wrap.lastElementChild;
    $$('input', el).forEach(i => i.addEventListener('input', calculateAndRender));
    el.querySelector('.project-remove').addEventListener('click', () => {
      if ($$('.in-project-row', wrap).length <= 1) return;
      el.remove();
      calculateAndRender();
    });
  }

  function calcProject() {
    const key = $('projectProduct').value;
    updateCustomVisibility('project', key);
    const variant = getVariant(key, num($('projectThickness').value, 160), 'project');
    const reserve = clamp(num($('projectReserve').value, 5), 0, 40);
    const rows = $$('.in-project-row', $('projectRows')).map(el => ({
      name: el.querySelector('.project-name').value.trim() || 'Plocha',
      area: Math.max(0, num(el.querySelector('.project-area').value))
    })).filter(x => x.area > 0);
    if (!rows.length) throw new Error('Přidejte alespoň jednu plochu s kladnou výměrou.');
    const netArea = rows.reduce((s, x) => s + x.area, 0);
    const agg = calcOrder(netArea, reserve, variant, 0);
    const separatePacks = rows.reduce((s, x) => s + ceilSafe(x.area * (1 + reserve / 100) / variant.packArea), 0);
    return { variant, reserve, rows, separatePacks, ...agg };
  }

  function renderProject(result) {
    $('resultMode').textContent = 'projekt';
    $('resultLabel').textContent = 'Společná objednávka';
    $('resultPrimary').textContent = `${result.packs} balení`;
    $('resultSub').textContent = `${result.rows.length} ploch · ${fmtArea(result.netArea)} čisté plochy`;
    $('resultGrid').innerHTML = `<div><span>Po rezervě</span><strong>${fmtArea(result.required)}</strong></div><div><span>Společně</span><strong>${result.packs} bal.</strong></div><div><span>Po plochách zvlášť</span><strong>${result.separatePacks} bal.</strong></div><div><span>Rozdíl zaokrouhlení</span><strong>${result.separatePacks - result.packs} bal.</strong></div>`;
    $('resultThermal').innerHTML = `<div><span>Tloušťka</span><strong>${result.variant.t} mm</strong></div><div><span>λD / λ</span><strong>${fmtLambda(result.variant.lambda)}</strong></div><div class="in-thermal-r"><span>R vrstvy</span><strong>${fmtR(result.r)}</strong></div>`;
    const rowsHtml = result.rows.map(x => `<div class="in-result-row"><span>${x.name}</span><strong>${fmtArea(x.area)}</strong><small>čistá plocha</small></div>`).join('');
    $('resultRows').innerHTML = rowsHtml + `<div class="in-result-row in-result-row-accent"><span>Objednat společně</span><strong>${result.packs} bal.</strong><small>${fmtArea(result.purchased)} nakoupeno</small></div>`;
    $('resultGuide').innerHTML = `<strong>Agregace před zaokrouhlením</strong><p>Pokud opravdu kupujete stejný produkt a tloušťku pro všechny plochy, sečteme je před zaokrouhlením. Tím nevzniká umělý celý balík navíc na každé ploše.</p>`;
    renderProductCard('project', result.variant);
    lastText = `Izolace – projekt\n${result.variant.manufacturer} ${result.variant.name} ${result.variant.t} mm\nPlochy: ${result.rows.map(x => `${x.name} ${fmtArea(x.area)}`).join(', ')}\nSpolečná objednávka: ${result.packs} balení = ${fmtArea(result.purchased)}\nR samotné vrstvy: ${fmtR(result.r)}`;
  }

  function calculateAndRender() {
    try {
      $('formError').hidden = true;
      if (currentMode === 'buy') renderBuy(calcBuy());
      else if (currentMode === 'compare') renderCompare();
      else renderProject(calcProject());
    } catch (err) {
      $('formError').textContent = err.message || 'Zkontrolujte zadané hodnoty.';
      $('formError').hidden = false;
    }
  }

  function setMode(mode) {
    currentMode = mode;
    $$('[data-mode]').forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
      btn.setAttribute('tabindex', active ? '0' : '-1');
    });
    $('buyPanel').hidden = mode !== 'buy';
    $('comparePanel').hidden = mode !== 'compare';
    $('projectPanel').hidden = mode !== 'project';
    calculateAndRender();
  }

  function bindAreaMode(prefix) {
    const select = $(`${prefix}AreaMode`);
    const sync = () => {
      $(`${prefix}Dimensions`).hidden = select.value !== 'dimensions';
      $(`${prefix}Direct`).hidden = select.value !== 'direct';
      calculateAndRender();
    };
    select.addEventListener('change', sync);
    sync();
  }

  function bindProduct(prefix, selectedProduct = 'frontrock', selectedThickness = 160, includeCustom = true) {
    const product = $(`${prefix}Product`);
    const thickness = $(`${prefix}Thickness`);
    fillProductSelect(product, includeCustom, selectedProduct);
    fillThickness(thickness, product.value, selectedThickness);
    const sync = () => {
      const key = product.value;
      updateCustomVisibility(prefix, key);
      if (key !== 'custom') fillThickness(thickness, key, num(thickness.value, selectedThickness));
      calculateAndRender();
    };
    product.addEventListener('change', sync);
    thickness.addEventListener('change', calculateAndRender);
    const custom = $(`${prefix}CustomFields`);
    if (custom) $$('input', custom).forEach(i => i.addEventListener('input', calculateAndRender));
  }

  function initCompare() {
    fillProductSelect($('compareProduct'), false, 'frontrock');
    const syncProduct = () => {
      const key = $('compareProduct').value;
      fillThickness($('compareThicknessA'), key, 120);
      fillThickness($('compareThicknessB'), key, 160);
      calculateAndRender();
    };
    $('compareProduct').addEventListener('change', syncProduct);
    $('compareThicknessA').addEventListener('change', calculateAndRender);
    $('compareThicknessB').addEventListener('change', calculateAndRender);
    syncProduct();
  }

  function initProject() {
    bindProduct('project', 'frontrock', 160, true);
    addProjectRow({ name: 'Fasáda sever', area: 5 });
    addProjectRow({ name: 'Fasáda jih', area: 5 });
    $('addProjectRow').addEventListener('click', () => addProjectRow());
  }

  function init() {
    bindAreaMode('buy');
    bindProduct('buy', 'frontrock', 160, true);
    initCompare();
    initProject();

    const modeTabs = $$('[data-mode]');
    modeTabs.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
    $('.in-mode').addEventListener('keydown', event => {
      const currentIndex = modeTabs.indexOf(document.activeElement);
      if (currentIndex < 0) return;
      let nextIndex = currentIndex;
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % modeTabs.length;
      else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + modeTabs.length) % modeTabs.length;
      else if (event.key === 'Home') nextIndex = 0;
      else if (event.key === 'End') nextIndex = modeTabs.length - 1;
      else return;
      event.preventDefault();
      const next = modeTabs[nextIndex];
      setMode(next.dataset.mode);
      next.focus();
    });
    $$('input,select', $('insulationPlanner')).forEach(el => el.addEventListener('input', calculateAndRender));
    $('compareArea').addEventListener('input', calculateAndRender);
    $('compareReserve').addEventListener('input', calculateAndRender);
    $('projectReserve').addEventListener('input', calculateAndRender);

    $('copyResult').addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(lastText);
        const old = $('copyResult').textContent;
        $('copyResult').textContent = 'Zkopírováno';
        setTimeout(() => $('copyResult').textContent = old, 1400);
      } catch (_) {
        window.prompt('Zkopírujte plán:', lastText);
      }
    });
    $('printResult').addEventListener('click', () => window.print());

    const toggle = $('menuToggle');
    if (toggle) toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      $('mobileNav').classList.toggle('is-open', !open);
    });

    setMode('buy');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
