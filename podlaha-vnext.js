(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const qs = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const num = (value, fallback = 0) => {
    const n = Number(String(value ?? '').trim().replace(',', '.'));
    return Number.isFinite(n) ? n : fallback;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ceilSafe = (value) => Math.ceil(value - 1e-10);
  const fmt = (value, digits = 2) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const money = (value) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(value || 0))} Kč`;
  const area = (value) => `${fmt(value, 2)} m²`;
  const metres = (value) => `${fmt(value, 2)} m`;

  const PRODUCTS = {
    tarkett30: {
      label: 'Tarkett Starfloor Click Ultimate 30',
      packArea: 1.727,
      plankLength: 1.213,
      plankWidth: 0.178,
      pieces: 8,
      underlay: 'integrated-note',
      note: '1,727 m² / balení · 8 lamel · 1213 × 178 mm · integrovaná akustická vrstva',
      source: 'Tarkett'
    },
    tarkett55: {
      label: 'Tarkett Starfloor Click Ultimate 55',
      packArea: 1.281,
      plankLength: 1.213,
      plankWidth: 0.176,
      pieces: 6,
      underlay: 'integrated-note',
      note: '1,281 m² / balení · 6 lamel · 1213 × 176 mm',
      source: 'Tarkett'
    },
    egger199: {
      label: 'EGGER NatureSense Classic',
      packArea: 1.99,
      plankLength: 1.292,
      plankWidth: 0.193,
      underlay: 'separate',
      note: '1,99 m² / balení · 1292 × 193 mm · plovoucí pokládka vyžaduje vhodnou podložku',
      source: 'EGGER'
    },
    egger253: {
      label: 'EGGER NatureSense Aqua Kingsize',
      packArea: 2.53,
      plankLength: 1.292,
      plankWidth: 0.327,
      underlay: 'separate',
      note: '2,53 m² / balení · 1292 × 327 mm',
      source: 'EGGER'
    },
    aquadura253: {
      label: 'EGGER AquaDura+ Kingsize',
      packArea: 2.53,
      plankLength: 1.292,
      plankWidth: 0.327,
      underlay: 'integrated',
      note: '2,53 m² / balení · integrovaná podložka; další izolační podložka se nepřidává',
      source: 'EGGER'
    }
  };

  const ROLLS = {
    tarkettClassic40: { label: 'Tarkett Classic 40', widths: [2, 3, 4], note: 'Výrobce uvádí role v šířkách 2, 3 a 4 m.' },
    tarkettTopaz70: { label: 'Tarkett Topaz 70', widths: [2, 3, 4], note: 'Výrobce uvádí role v šířkách 2, 3 a 4 m.' }
  };

  function calcPackage(netArea, reservePct, packArea) {
    if (!(netArea > 0) || !(packArea > 0)) throw new Error('Plocha a plocha balení musí být kladná čísla.');
    const reserve = clamp(reservePct, 0, 50);
    const requiredArea = netArea * (1 + reserve / 100);
    const packs = ceilSafe(requiredArea / packArea);
    const purchasedArea = packs * packArea;
    return {
      netArea,
      reserve,
      requiredArea,
      packs,
      purchasedArea,
      surplusRequired: Math.max(0, purchasedArea - requiredArea),
      surplusNet: Math.max(0, purchasedArea - netArea)
    };
  }

  function calcRoll(length, width, rollWidth, trimCm = 0) {
    if (!(length > 0) || !(width > 0) || !(rollWidth > 0)) throw new Error('Rozměry místnosti i šířka role musí být kladné.');
    const trim = Math.max(0, trimCm) / 100;
    const optionA = {
      direction: 'pásy po délce místnosti',
      strips: ceilSafe(width / rollWidth),
      stripLength: length + trim,
    };
    optionA.linearMetres = optionA.strips * optionA.stripLength;
    optionA.purchasedArea = optionA.linearMetres * rollWidth;
    optionA.seams = Math.max(0, optionA.strips - 1);

    const optionB = {
      direction: 'pásy po šířce místnosti',
      strips: ceilSafe(length / rollWidth),
      stripLength: width + trim,
    };
    optionB.linearMetres = optionB.strips * optionB.stripLength;
    optionB.purchasedArea = optionB.linearMetres * rollWidth;
    optionB.seams = Math.max(0, optionB.strips - 1);

    const best = optionA.purchasedArea <= optionB.purchasedArea ? optionA : optionB;
    return {
      length,
      width,
      netArea: length * width,
      rollWidth,
      trimCm: Math.max(0, trimCm),
      best,
      alternative: best === optionA ? optionB : optionA,
      wasteArea: Math.max(0, best.purchasedArea - length * width)
    };
  }

  function calcSkirting(length, width, totalDoorWidth, pieceLength) {
    if (!(length > 0) || !(width > 0) || !(pieceLength > 0)) return null;
    const perimeter = Math.max(0, 2 * (length + width) - Math.max(0, totalDoorWidth));
    const pieces = ceilSafe(perimeter / pieceLength);
    return { perimeter, pieces, purchased: pieces * pieceLength };
  }

  function calcLayout(acrossDimension, plankWidth) {
    if (!(acrossDimension > 0) || !(plankWidth > 0)) return null;
    const fullRows = Math.floor(acrossDimension / plankWidth + 1e-10);
    let lastWidth = acrossDimension - fullRows * plankWidth;
    if (lastWidth < 1e-8) lastWidth = plankWidth;
    const rows = lastWidth === plankWidth ? fullRows : fullRows + 1;
    return { rows, lastWidth, warning: lastWidth < 0.05 };
  }

  function packageProductFromUi(prefix = 'pack') {
    const key = $(`${prefix}Product`).value;
    if (key !== 'custom') return { key, ...PRODUCTS[key] };
    const packArea = Math.max(0.01, num($(`${prefix}CustomPackArea`).value));
    const plankWidth = Math.max(0, num($(`${prefix}CustomPlankWidth`).value)) / 1000;
    const plankLength = Math.max(0, num($(`${prefix}CustomPlankLength`).value)) / 1000;
    return {
      key: 'custom',
      label: $(`${prefix}CustomName`).value.trim() || 'Vlastní podlaha',
      packArea,
      plankWidth,
      plankLength,
      underlay: $(`${prefix}CustomUnderlay`).value,
      note: `${fmt(packArea, 3)} m² / balení · vlastní technické údaje`,
      source: 'vlastní údaj'
    };
  }

  function getSingleRoom(prefix) {
    const method = $(`${prefix}AreaMode`).value;
    if (method === 'direct') {
      const netArea = Math.max(0, num($(`${prefix}DirectArea`).value));
      if (!netArea) throw new Error('Zadejte kladnou plochu podlahy.');
      return { netArea, length: 0, width: 0, dimensionMode: false };
    }
    const length = Math.max(0, num($(`${prefix}Length`).value));
    const width = Math.max(0, num($(`${prefix}Width`).value));
    if (!length || !width) throw new Error('Zadejte kladnou délku a šířku místnosti.');
    return { netArea: length * width, length, width, dimensionMode: true };
  }

  function underlayResult(product, netArea, mode, reservePct, rollArea) {
    if (mode === 'none') return { status: 'none', label: 'Podložka se nepočítá', rolls: 0, purchasedArea: 0 };
    if (mode === 'auto' && product.underlay === 'integrated') return { status: 'integrated', label: 'Integrovaná podložka · další se nepřidává', rolls: 0, purchasedArea: 0 };
    if (mode === 'auto' && product.underlay === 'integrated-note') return { status: 'integrated-note', label: 'Integrovaná akustická vrstva · další podložku ověřte v návodu', rolls: 0, purchasedArea: 0 };
    const finalRollArea = Math.max(0.1, rollArea || 15);
    const required = netArea * (1 + clamp(reservePct, 0, 30) / 100);
    const rolls = ceilSafe(required / finalRollArea);
    return { status: 'separate', label: 'Samostatná podložka', requiredArea: required, rolls, purchasedArea: rolls * finalRollArea, rollArea: finalRollArea };
  }

  function renderProductCard(prefix = 'pack') {
    const product = packageProductFromUi(prefix);
    const card = $(`${prefix}ProductCard`);
    card.innerHTML = `<strong>${product.label}</strong><p>${product.note}</p><div><span>${product.source}</span><span>${product.underlay === 'integrated' ? 'integrovaná podložka' : product.underlay === 'separate' ? 'samostatná podložka' : product.underlay === 'integrated-note' ? 'integrovaná akustická vrstva' : 'vlastní nastavení'}</span></div>`;
    $(`${prefix}Custom`).hidden = $(`${prefix}Product`).value !== 'custom';
  }

  let currentMode = 'pack';
  let roomSerial = 0;
  let lastSummary = '';

  function renderResult(title, primary, subtitle, kpis, rows, note) {
    $('resultTitle').textContent = title;
    $('resultPrimary').textContent = primary;
    $('resultSubtitle').textContent = subtitle || '';
    $('resultKpis').innerHTML = kpis.map(([label, value]) => `<div><span>${label}</span><strong>${value}</strong></div>`).join('');
    $('resultRows').innerHTML = rows.map(r => `<article><div><strong>${r.label}</strong><b>${r.value}</b></div>${r.note ? `<p>${r.note}</p>` : ''}</article>`).join('');
    $('resultNote').innerHTML = `<strong>${note.title}</strong><p>${note.text}</p>`;
    lastSummary = [title, `${primary} · ${subtitle}`, ...rows.map(r => `${r.label}: ${r.value}`)].join('\n');
  }

  function calcPackMode() {
    const room = getSingleRoom('pack');
    const product = packageProductFromUi('pack');
    const reserve = clamp(num($('packReserve').value), 0, 50);
    const result = calcPackage(room.netArea, reserve, product.packArea);
    const packPrice = Math.max(0, num($('packPrice').value));
    const floorCost = packPrice ? result.packs * packPrice : 0;

    const rows = [
      { label: product.label, value: `${result.packs} bal.`, note: `${area(product.packArea)} / balení · nakoupeno ${area(result.purchasedArea)}` }
    ];

    let layout = null;
    if (room.dimensionMode && product.plankWidth > 0 && $('layoutCheck').checked) {
      const across = $('layoutDirection').value === 'length' ? room.width : room.length;
      layout = calcLayout(across, product.plankWidth);
      rows.push({
        label: 'Kontrola poslední řady',
        value: `${fmt(layout.lastWidth * 100, 1)} cm`,
        note: layout.warning ? 'Velmi úzká poslední řada. Upravte rozvržení první řady podle montážního návodu.' : `${layout.rows} řad při zvoleném směru; geometrická kontrola před dilatačními spárami.`
      });
    }

    const underlay = underlayResult(product, result.netArea, $('underlayMode').value, num($('underlayReserve').value), num($('underlayRollArea').value));
    if (underlay.status === 'separate') {
      rows.push({ label: 'Podložka', value: `${underlay.rolls} rol.`, note: `${area(underlay.rollArea)} / role · nákup ${area(underlay.purchasedArea)}` });
    } else {
      rows.push({ label: 'Podložka', value: '0 rol.', note: underlay.label });
    }

    let skirting = null;
    if ($('skirtingEnabled').checked && room.dimensionMode) {
      skirting = calcSkirting(room.length, room.width, num($('doorWidthTotal').value), num($('skirtingPieceLength').value));
      if (skirting) rows.push({ label: 'Soklové lišty', value: `${skirting.pieces} ks`, note: `čistý obvod ${metres(skirting.perimeter)} · nakoupeno ${metres(skirting.purchased)}` });
    }

    if (floorCost) rows.push({ label: 'Cena krytiny', value: money(floorCost), note: `Pouze z ceny za balení, kterou jste zadali.` });

    renderResult(
      'NÁKUPNÍ PLÁN · BALENÍ',
      `${result.packs} bal.`,
      `${area(result.purchasedArea)} skutečně nakoupeno`,
      [
        ['Čistá plocha', area(result.netArea)],
        ['Po rezervě', area(result.requiredArea)],
        ['Přebytek nad potřebou', area(result.surplusRequired)],
        ['Rezerva', `${fmt(result.reserve, 1)} %`]
      ],
      rows,
      { title: 'Jak číst výsledek', text: 'Rezerva je samostatný viditelný vstup. Až potom se množství zaokrouhlí na celé balíky konkrétního výrobku.' }
    );
  }

  function syncRollWidths() {
    const preset = $('rollProduct').value;
    const select = $('rollWidth');
    const custom = preset === 'custom';
    $('rollCustom').hidden = !custom;
    if (!custom) {
      const data = ROLLS[preset];
      select.innerHTML = data.widths.map(w => `<option value="${w}">${fmt(w, 0)} m</option>`).join('');
      select.value = String(data.widths[data.widths.length - 1]);
      $('rollProductCard').innerHTML = `<strong>${data.label}</strong><p>${data.note}</p><div><span>Tarkett</span><span>role / metráž</span></div>`;
    } else {
      select.innerHTML = '<option value="4">4 m</option>';
      $('rollProductCard').innerHTML = '<strong>Vlastní metráž</strong><p>Zadejte skutečnou šířku role z nabídky dodavatele.</p><div><span>vlastní údaj</span><span>role / metráž</span></div>';
    }
  }

  function calcRollMode() {
    const length = Math.max(0, num($('rollLength').value));
    const width = Math.max(0, num($('rollRoomWidth').value));
    const rollWidth = $('rollProduct').value === 'custom' ? Math.max(0.1, num($('rollCustomWidth').value)) : Math.max(0.1, num($('rollWidth').value));
    const trim = clamp(num($('rollTrim').value), 0, 100);
    const result = calcRoll(length, width, rollWidth, trim);
    const priceLm = Math.max(0, num($('rollPriceLm').value));
    const rows = [
      { label: 'Doporučená orientace pásů', value: result.best.direction, note: `${result.best.strips} pás${result.best.strips === 1 ? '' : 'y'} · ${result.best.seams} spoj${result.best.seams === 1 ? '' : 'ů'}` },
      { label: 'Alternativní orientace', value: `${fmt(result.alternative.linearMetres, 2)} bm`, note: `${area(result.alternative.purchasedArea)} nákupu` }
    ];
    if (priceLm) rows.push({ label: 'Cena metráže', value: money(priceLm * result.best.linearMetres), note: 'Podle zadané ceny za běžný metr role.' });

    let skirting = null;
    if ($('rollSkirtingEnabled').checked) {
      skirting = calcSkirting(length, width, num($('rollDoorWidth').value), num($('rollSkirtingPieceLength').value));
      if (skirting) rows.push({ label: 'Soklové lišty', value: `${skirting.pieces} ks`, note: `obvod ${metres(skirting.perimeter)} · nákup ${metres(skirting.purchased)}` });
    }

    renderResult(
      'NÁKUPNÍ PLÁN · ROLE',
      `${fmt(result.best.linearMetres, 2)} bm`,
      `${area(result.best.purchasedArea)} při šířce role ${fmt(result.rollWidth, 2)} m`,
      [
        ['Čistá plocha', area(result.netArea)],
        ['Počet pásů', String(result.best.strips)],
        ['Spoje', String(result.best.seams)],
        ['Odpad plochy', area(result.wasteArea)]
      ],
      rows,
      { title: 'Proč nestačí m²', text: 'U metráže rozhoduje šířka role a orientace pásů. Kalkulačka porovná oba směry obdélníkové místnosti a zvolí menší nákup.' }
    );
  }

  function roomMarkup(room = {}) {
    roomSerial += 1;
    return `<article class="fp-room" data-room>
      <div class="fp-room-head"><span>${String(roomSerial).padStart(2, '0')}</span><input class="room-name" value="${room.name || `Místnost ${roomSerial}`}" aria-label="Název místnosti"><button type="button" class="room-remove" aria-label="Odebrat místnost">×</button></div>
      <div class="fp-room-grid">
        <label><span>Délka</span><div class="fp-unit"><input class="room-length" type="number" min="0.1" step="0.1" value="${room.length ?? 4}"><b>m</b></div></label>
        <label><span>Šířka</span><div class="fp-unit"><input class="room-width" type="number" min="0.1" step="0.1" value="${room.width ?? 3.5}"><b>m</b></div></label>
        <label><span>Odečíst pevné prvky</span><div class="fp-unit"><input class="room-excluded" type="number" min="0" step="0.1" value="${room.excluded ?? 0}"><b>m²</b></div></label>
        <label><span>Šířka dveřních otvorů celkem</span><div class="fp-unit"><input class="room-door" type="number" min="0" step="0.05" value="${room.door ?? 0.8}"><b>m</b></div></label>
      </div>
      <div class="fp-room-summary"><span>Plocha <b data-room-area>–</b></span><span>Obvod pro lišty <b data-room-perimeter>–</b></span></div>
    </article>`;
  }

  function addRoom(room) {
    $('projectRooms').insertAdjacentHTML('beforeend', roomMarkup(room));
    const card = $('projectRooms').lastElementChild;
    $$('input', card).forEach(input => input.addEventListener('input', calculate));
    qs('.room-remove', card).addEventListener('click', () => {
      if ($$('[data-room]', $('projectRooms')).length <= 1) return;
      card.remove();
      calculate();
    });
  }

  function projectRooms() {
    const rooms = $$('[data-room]', $('projectRooms')).map(card => {
      const length = Math.max(0, num(qs('.room-length', card).value));
      const width = Math.max(0, num(qs('.room-width', card).value));
      const excluded = Math.max(0, num(qs('.room-excluded', card).value));
      const door = Math.max(0, num(qs('.room-door', card).value));
      const netArea = Math.max(0, length * width - excluded);
      const perimeter = Math.max(0, 2 * (length + width) - door);
      qs('[data-room-area]', card).textContent = area(netArea);
      qs('[data-room-perimeter]', card).textContent = metres(perimeter);
      return { name: qs('.room-name', card).value.trim() || 'Místnost', length, width, excluded, door, netArea, perimeter };
    });
    if (!rooms.length || rooms.every(r => r.netArea <= 0)) throw new Error('Projekt potřebuje alespoň jednu místnost s kladnou plochou.');
    return rooms;
  }

  function calcProjectMode() {
    const rooms = projectRooms();
    const product = packageProductFromUi('project');
    const reserve = clamp(num($('projectReserve').value), 0, 50);
    const netArea = rooms.reduce((s, r) => s + r.netArea, 0);
    const totalPerimeter = rooms.reduce((s, r) => s + r.perimeter, 0);
    const result = calcPackage(netArea, reserve, product.packArea);
    const rows = rooms.map(r => ({ label: r.name, value: area(r.netArea), note: `obvod pro lišty ${metres(r.perimeter)}` }));
    rows.unshift({ label: product.label, value: `${result.packs} bal.`, note: `${area(result.packArea || product.packArea)} / balení · nákup ${area(result.purchasedArea)}` });

    if ($('projectSkirtingEnabled').checked) {
      const piece = Math.max(0.1, num($('projectSkirtingPieceLength').value));
      const pieces = ceilSafe(totalPerimeter / piece);
      rows.push({ label: 'Soklové lišty', value: `${pieces} ks`, note: `${metres(totalPerimeter)} čistý obvod · nákup ${metres(pieces * piece)}` });
    }

    const underlay = underlayResult(product, netArea, $('projectUnderlayMode').value, num($('projectUnderlayReserve').value), num($('projectUnderlayRollArea').value));
    if (underlay.status === 'separate') rows.push({ label: 'Podložka', value: `${underlay.rolls} rol.`, note: `${area(underlay.purchasedArea)} nákup` });
    else rows.push({ label: 'Podložka', value: '0 rol.', note: underlay.label });

    renderResult(
      'NÁKUPNÍ PLÁN · PROJEKT',
      `${result.packs} bal.`,
      `${area(result.purchasedArea)} společný nákup pro ${rooms.length} místnosti`,
      [
        ['Čistá plocha', area(netArea)],
        ['Po rezervě', area(result.requiredArea)],
        ['Místnosti', String(rooms.length)],
        ['Přebytek', area(result.surplusRequired)]
      ],
      rows,
      { title: 'Výhoda agregace', text: 'Stejnou krytinu zaokrouhlujeme na balení až po sečtení místností. Tím nevytváříme umělý přebytek zaokrouhlením každého pokoje zvlášť.' }
    );
  }

  function calculate() {
    try {
      $('formError').hidden = true;
      if (currentMode === 'pack') calcPackMode();
      else if (currentMode === 'roll') calcRollMode();
      else calcProjectMode();
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
    });
    $('packPanel').hidden = mode !== 'pack';
    $('rollPanel').hidden = mode !== 'roll';
    $('projectPanel').hidden = mode !== 'project';
    calculate();
  }

  function syncAreaMode() {
    const direct = $('packAreaMode').value === 'direct';
    $('packDimensions').hidden = direct;
    $('packDirect').hidden = !direct;
    $('layoutBlock').hidden = direct;
    $('skirtingBlock').hidden = direct;
    calculate();
  }

  function bind() {
    $$('[data-mode]').forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
    $('packAreaMode').addEventListener('change', syncAreaMode);
    $('packProduct').addEventListener('change', () => { renderProductCard('pack'); calculate(); });
    $('projectProduct').addEventListener('change', () => { renderProductCard('project'); calculate(); });
    $('rollProduct').addEventListener('change', () => { syncRollWidths(); calculate(); });
    $('rollWidth').addEventListener('change', calculate);
    $('addProjectRoom').addEventListener('click', () => addRoom());
    $('copyResult').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(lastSummary); $('copyResult').textContent = 'Zkopírováno'; setTimeout(() => $('copyResult').textContent = 'Kopírovat plán', 1400); } catch (_) {}
    });
    $('printResult').addEventListener('click', () => window.print());
    $('menuToggle').addEventListener('click', () => {
      const open = $('menuToggle').getAttribute('aria-expanded') === 'true';
      $('menuToggle').setAttribute('aria-expanded', String(!open));
      $('mobileNav').classList.toggle('is-open', !open);
    });
    $$('input,select', $('floorPlanner')).forEach(el => el.addEventListener('input', calculate));
    $$('input,select', $('floorPlanner')).forEach(el => el.addEventListener('change', calculate));
  }

  renderProductCard('pack');
  renderProductCard('project');
  syncRollWidths();
  addRoom({ name: 'Obývák', length: 5, width: 4, excluded: 0, door: 0.8 });
  addRoom({ name: 'Ložnice', length: 4, width: 3.5, excluded: 0, door: 0.8 });
  bind();
  syncAreaMode();
  calculate();

  window.__floorVNextTest = { calcPackage, calcRoll, calcSkirting, calcLayout };
})();
