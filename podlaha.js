(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const number = (value, fallback = 0) => {
    const parsed = Number(String(value ?? '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const fmt = (value, digits = 1) => new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
  const fmtCompact = (value, digits = 2) => new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
  const money = (value) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(value || 0))} Kč`;
  const areaText = (value) => `${fmt(value, 2)} m²`;
  const metreText = (value) => `${fmt(value, 1)} m`;
  const kgText = (value) => `${fmt(value, value >= 100 ? 0 : 1)} kg`;
  const litreText = (value) => `${fmt(value, value >= 100 ? 0 : 1)} l`;
  const escapeHtml = (value) => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);

  const form = $('#floorForm');
  const roomList = $('#advancedRoomList');
  const errorBox = $('#formError');
  let currentMode = 'basic';
  let roomSerial = 0;
  let advancedSeeded = false;
  let lastResult = null;

  const floorTypes = {
    laminate: { label: 'Laminát', packArea: 2.22, straight: 7, offset: 8, herringbone: 12 },
    vinylClick: { label: 'Click vinyl', packArea: 2.20, straight: 7, offset: 8, herringbone: 12 },
    vinylGlue: { label: 'Lepený vinyl', packArea: 3.34, straight: 5, offset: 7, herringbone: 10 },
    wood: { label: 'Dřevěná podlaha', packArea: 2.00, straight: 8, offset: 10, herringbone: 15 }
  };

  function getRecommendedReserve(type, pattern) {
    return floorTypes[type]?.[pattern] ?? 7;
  }

  function getBasicMethod() {
    return $('input[name="basicMethod"]:checked')?.value || 'dimensions';
  }

  function getBasicArea() {
    const method = getBasicMethod();
    if (method === 'area') {
      const area = Math.max(0, number($('#basicKnownArea').value));
      if (!area) throw new Error('Zadejte kladnou plochu v metrech čtverečních.');
      return { area, perimeter: 0, detail: 'známá plocha' };
    }
    const length = Math.max(0, number($('#basicLength').value));
    const width = Math.max(0, number($('#basicWidth').value));
    if (!length || !width) throw new Error('Zadejte kladnou délku a šířku místnosti.');
    return { area: length * width, perimeter: 2 * (length + width), detail: `${fmtCompact(length)} × ${fmtCompact(width)} m` };
  }

  function calculateBasic() {
    const base = getBasicArea();
    const type = $('#basicFloorType').value || 'laminate';
    const pattern = $('#basicPattern').value || 'straight';
    const reserve = clamp(number($('#basicReserve').value, getRecommendedReserve(type, pattern)), 0, 40);
    const packArea = Math.max(0.01, number($('#basicPackArea').value, floorTypes[type]?.packArea || 2.22));
    const packPrice = Math.max(0, number($('#basicPackPrice').value));
    const requiredArea = base.area * (1 + reserve / 100);
    const packs = Math.ceil(requiredArea / packArea - 1e-9);
    const purchasedArea = packs * packArea;
    const leftoverArea = Math.max(0, purchasedArea - base.area);
    const floorCost = packs * packPrice;
    const pricePerNetArea = base.area > 0 ? floorCost / base.area : 0;
    return {
      mode: 'basic', ...base, type, typeLabel: floorTypes[type]?.label || 'Podlaha', pattern,
      reserve, packArea, packPrice, netArea: base.area, requiredArea, packs, purchasedArea,
      leftoverArea, floorCost, materialCost: floorCost, labourCost: 0, totalCost: floorCost,
      pricePerNetArea, durationDays: 0, skirtingMetres: 0, skirtingPieces: 0,
      rooms: [{ name: 'Zadaná místnost', area: base.area, perimeter: base.perimeter, required: requiredArea }],
      costs: [{ label: 'Podlahová krytina', value: floorCost }]
    };
  }

  function roomMarkup(room = {}) {
    roomSerial += 1;
    const id = `room-${roomSerial}`;
    const name = room.name || `Místnost ${roomSerial}`;
    const length = room.length ?? 4;
    const width = room.width ?? 3.5;
    const excluded = room.excluded ?? 0;
    const doors = room.doors ?? 1;
    const doorWidth = room.doorWidth ?? 0.8;
    const quantity = room.quantity ?? 1;
    return `
      <article class="room-card" data-room-id="${id}">
        <div class="room-card-head">
          <div class="room-name-wrap"><span class="room-index">${String(roomSerial).padStart(2, '0')}</span><input class="room-name" type="text" value="${escapeHtml(name)}" aria-label="Název místnosti"></div>
          <button class="room-remove" type="button" aria-label="Odebrat místnost">×</button>
        </div>
        <div class="room-card-body">
          <div class="room-grid">
            <label class="room-field"><span>Délka</span><div><input class="room-length" type="number" min="0.1" step="0.1" value="${length}" inputmode="decimal"><em>m</em></div></label>
            <label class="room-field"><span>Šířka</span><div><input class="room-width" type="number" min="0.1" step="0.1" value="${width}" inputmode="decimal"><em>m</em></div></label>
            <label class="room-field"><span>Odečíst pevné prvky</span><div><input class="room-excluded" type="number" min="0" step="0.1" value="${excluded}" inputmode="decimal"><em>m²</em></div></label>
            <label class="room-field"><span>Počet dveří</span><div><input class="room-doors" type="number" min="0" max="20" step="1" value="${doors}" inputmode="numeric"><em>ks</em></div></label>
            <label class="room-field"><span>Šířka jedněch dveří</span><div><input class="room-door-width" type="number" min="0" max="3" step="0.05" value="${doorWidth}" inputmode="decimal"><em>m</em></div></label>
            <label class="room-field"><span>Počet stejných místností</span><div><input class="room-quantity" type="number" min="1" max="50" step="1" value="${quantity}" inputmode="numeric"><em>×</em></div></label>
          </div>
          <div class="room-summary"><span>Čistá plocha <b data-room-area>–</b></span><span>Obvod pro lišty <b data-room-perimeter>–</b></span><span>K nákupu <b data-room-required>–</b></span></div>
        </div>
      </article>`;
  }

  function addRoom(room) {
    roomList.insertAdjacentHTML('beforeend', roomMarkup(room));
    bindRoomEvents(roomList.lastElementChild);
    calculateAndRender(false);
  }

  function bindRoomEvents(card) {
    $$('input,select', card).forEach(input => input.addEventListener('input', () => calculateAndRender(false)));
    $('.room-remove', card).addEventListener('click', () => {
      if ($$('.room-card', roomList).length <= 1) return;
      card.remove();
      renumberRooms();
      calculateAndRender(false);
    });
  }

  function renumberRooms() {
    $$('.room-card', roomList).forEach((card, index) => {
      $('.room-index', card).textContent = String(index + 1).padStart(2, '0');
    });
  }

  function readRooms(reserve) {
    const rooms = $$('.room-card', roomList).map(card => {
      const length = Math.max(0, number($('.room-length', card).value));
      const width = Math.max(0, number($('.room-width', card).value));
      const excluded = Math.max(0, number($('.room-excluded', card).value));
      const doors = clamp(Math.round(number($('.room-doors', card).value)), 0, 20);
      const doorWidth = Math.max(0, number($('.room-door-width', card).value));
      const quantity = clamp(Math.round(number($('.room-quantity', card).value, 1)), 1, 50);
      const grossArea = length * width;
      const area = Math.max(0, grossArea - excluded) * quantity;
      const perimeterPerRoom = Math.max(0, 2 * (length + width) - doors * doorWidth);
      const perimeter = perimeterPerRoom * quantity;
      const required = area * (1 + reserve / 100);
      $('[data-room-area]', card).textContent = areaText(area);
      $('[data-room-perimeter]', card).textContent = metreText(perimeter);
      $('[data-room-required]', card).textContent = areaText(required);
      return {
        name: $('.room-name', card).value.trim() || 'Místnost',
        length, width, excluded, doors, doorWidth, quantity, area, perimeter, required
      };
    });
    if (!rooms.length || rooms.every(room => room.area <= 0)) throw new Error('Přidejte alespoň jednu místnost s kladnými rozměry.');
    return rooms;
  }

  function calcRounded(amount, packageSize) {
    if (amount <= 0 || packageSize <= 0) return { packages: 0, purchased: 0 };
    const packages = Math.ceil(amount / packageSize - 1e-9);
    return { packages, purchased: packages * packageSize };
  }

  function calculateAdvanced() {
    const type = $('#advancedFloorType').value || 'laminate';
    const pattern = $('#advancedPattern').value || 'straight';
    const reserve = clamp(number($('#advancedReserve').value, getRecommendedReserve(type, pattern)), 0, 40);
    const rooms = readRooms(reserve);
    const packArea = Math.max(0.01, number($('#advancedPackArea').value, floorTypes[type]?.packArea || 2.22));
    const packPrice = Math.max(0, number($('#advancedPackPrice').value));
    const delivery = Math.max(0, number($('#floorDelivery').value));
    const netArea = rooms.reduce((sum, room) => sum + room.area, 0);
    const perimeter = rooms.reduce((sum, room) => sum + room.perimeter, 0);
    const requiredArea = netArea * (1 + reserve / 100);
    const packs = Math.ceil(requiredArea / packArea - 1e-9);
    const purchasedArea = packs * packArea;
    const leftoverArea = Math.max(0, purchasedArea - netArea);
    const floorCost = packs * packPrice;

    let underlayArea = 0, underlayRolls = 0, underlayCost = 0;
    if ($('#useUnderlay').checked) {
      const reserveValue = clamp(number($('#underlayReserve').value, 5), 0, 30);
      const rollArea = Math.max(0.1, number($('#underlayRollArea').value, 10));
      const rollPrice = Math.max(0, number($('#underlayRollPrice').value));
      underlayArea = netArea * (1 + reserveValue / 100);
      underlayRolls = Math.ceil(underlayArea / rollArea - 1e-9);
      underlayCost = underlayRolls * rollPrice;
    }

    let vapourArea = 0, vapourRolls = 0, vapourCost = 0;
    if ($('#useVapour').checked) {
      const reserveValue = clamp(number($('#vapourReserve').value, 10), 0, 30);
      const rollArea = Math.max(0.1, number($('#vapourRollArea').value, 20));
      const rollPrice = Math.max(0, number($('#vapourRollPrice').value));
      vapourArea = netArea * (1 + reserveValue / 100);
      vapourRolls = Math.ceil(vapourArea / rollArea - 1e-9);
      vapourCost = vapourRolls * rollPrice;
    }

    let skirtingMetres = 0, skirtingPieces = 0, skirtingCost = 0, clips = 0, clipPacks = 0, clipsCost = 0;
    if ($('#useSkirting').checked) {
      const reserveValue = clamp(number($('#skirtingReserve').value, 8), 0, 30);
      const pieceLength = Math.max(0.1, number($('#skirtingPieceLength').value, 2.4));
      const piecePrice = Math.max(0, number($('#skirtingPiecePrice').value));
      const clipSpacing = Math.max(0.1, number($('#clipSpacing').value, 0.45));
      const clipPackSize = Math.max(1, Math.round(number($('#clipPackSize').value, 30)));
      const clipPackPrice = Math.max(0, number($('#clipPackPrice').value));
      skirtingMetres = perimeter * (1 + reserveValue / 100);
      skirtingPieces = Math.ceil(skirtingMetres / pieceLength - 1e-9);
      skirtingCost = skirtingPieces * piecePrice;
      clips = Math.ceil(perimeter / clipSpacing - 1e-9);
      clipPacks = Math.ceil(clips / clipPackSize - 1e-9);
      clipsCost = clipPacks * clipPackPrice;
    }

    let profileCount = 0, profileCost = 0;
    if ($('#useProfiles').checked) {
      profileCount = Math.max(0, Math.round(number($('#profileCount').value)));
      profileCost = profileCount * Math.max(0, number($('#profilePrice').value));
    }

    let levelKg = 0, levelBags = 0, levelCost = 0;
    if ($('#useLeveling').checked) {
      const thickness = Math.max(0.1, number($('#levelThickness').value, 3));
      const consumption = Math.max(0.1, number($('#levelConsumption').value, 1.6));
      const bagSize = Math.max(1, number($('#levelBagSize').value, 23));
      const bagPrice = Math.max(0, number($('#levelBagPrice').value));
      levelKg = netArea * thickness * consumption;
      levelBags = Math.ceil(levelKg / bagSize - 1e-9);
      levelCost = levelBags * bagPrice;
    }

    let primerLitres = 0, primerPacks = 0, primerCost = 0;
    if ($('#usePrimer').checked) {
      const consumption = Math.max(0.01, number($('#primerConsumption').value, 0.15));
      const packSize = Math.max(0.1, number($('#primerPackSize').value, 5));
      const packPriceValue = Math.max(0, number($('#primerPackPrice').value));
      primerLitres = netArea * consumption;
      primerPacks = Math.ceil(primerLitres / packSize - 1e-9);
      primerCost = primerPacks * packPriceValue;
    }

    let adhesiveKg = 0, adhesivePacks = 0, adhesiveCost = 0;
    if ($('#useAdhesive').checked) {
      const consumption = Math.max(0.01, number($('#adhesiveConsumption').value, 0.35));
      const packSize = Math.max(0.1, number($('#adhesivePackSize').value, 14));
      const packPriceValue = Math.max(0, number($('#adhesivePackPrice').value));
      adhesiveKg = netArea * consumption;
      adhesivePacks = Math.ceil(adhesiveKg / packSize - 1e-9);
      adhesiveCost = adhesivePacks * packPriceValue;
    }

    const removalRate = Math.max(0, number($('#removalRate').value));
    const prepRate = Math.max(0, number($('#prepRate').value));
    const labourRate = Math.max(0, number($('#labourRate').value));
    const skirtingLabourRate = Math.max(0, number($('#skirtingLabourRate').value));
    const productivity = Math.max(1, number($('#productivity').value, 22));
    const otherCosts = Math.max(0, number($('#otherCosts').value));
    const removalCost = netArea * removalRate;
    const prepCost = netArea * prepRate;
    const layingCost = netArea * labourRate;
    const skirtingLabourCost = $('#useSkirting').checked ? perimeter * skirtingLabourRate : 0;
    const labourCost = removalCost + prepCost + layingCost + skirtingLabourCost;
    const materialCost = floorCost + delivery + underlayCost + vapourCost + skirtingCost + clipsCost + profileCost + levelCost + primerCost + adhesiveCost + otherCosts;
    const totalCost = materialCost + labourCost;
    const durationDays = Math.max(0.5, netArea / productivity + rooms.length * 0.12 + ($('#useLeveling').checked ? 1 : 0));
    const pricePerNetArea = netArea > 0 ? totalCost / netArea : 0;

    const costs = [
      { label: 'Podlahová krytina', value: floorCost },
      { label: 'Doprava krytiny', value: delivery },
      { label: `Podložka (${underlayRolls} bal.)`, value: underlayCost },
      { label: `Parozábrana (${vapourRolls} rolí)`, value: vapourCost },
      { label: `Obvodové lišty (${skirtingPieces} ks)`, value: skirtingCost },
      { label: `Příchytky (${clipPacks} bal.)`, value: clipsCost },
      { label: `Přechodové profily (${profileCount} ks)`, value: profileCost },
      { label: `Nivelační stěrka (${levelBags} pytlů)`, value: levelCost },
      { label: `Penetrace (${primerPacks} bal.)`, value: primerCost },
      { label: `Lepidlo (${adhesivePacks} bal.)`, value: adhesiveCost },
      { label: 'Odstranění staré krytiny', value: removalCost },
      { label: 'Příprava podkladu', value: prepCost },
      { label: 'Pokládka podlahy', value: layingCost },
      { label: 'Montáž lišt', value: skirtingLabourCost },
      { label: 'Doprava, nářadí a ostatní', value: otherCosts }
    ].filter(item => item.value > 0);

    return {
      mode: 'advanced', type, typeLabel: floorTypes[type]?.label || 'Podlaha', pattern, reserve,
      packArea, packPrice, rooms, netArea, perimeter, requiredArea, packs, purchasedArea,
      leftoverArea, floorCost, underlayArea, underlayRolls, underlayCost, vapourArea, vapourRolls,
      vapourCost, skirtingMetres, skirtingPieces, skirtingCost, clips, clipPacks, clipsCost,
      profileCount, profileCost, levelKg, levelBags, levelCost, primerLitres, primerPacks,
      primerCost, adhesiveKg, adhesivePacks, adhesiveCost, removalCost, prepCost, layingCost,
      skirtingLabourCost, labourCost, materialCost, totalCost, durationDays, pricePerNetArea,
      diyCost: materialCost, proCost: totalCost, costs
    };
  }

  function renderScenarios(result) {
    const reserves = [5, 8, 10, 15];
    $('#scenarioGrid').innerHTML = reserves.map(reserve => {
      const required = result.netArea * (1 + reserve / 100);
      const packs = Math.ceil(required / result.packArea - 1e-9);
      const purchased = packs * result.packArea;
      const active = Math.abs(reserve - result.reserve) < 0.5 ? ' is-current' : '';
      return `<article class="scenario-card${active}"><span>Rezerva ${reserve} %</span><strong>${areaText(required)}</strong><small>${packs} bal. · nákup ${areaText(purchased)}</small></article>`;
    }).join('');
  }

  function renderRooms(result) {
    $('#roomBreakdownBody').innerHTML = result.rooms.map(room => `
      <tr><td>${escapeHtml(room.name)}</td><td>${areaText(room.area)}</td><td>${room.perimeter ? metreText(room.perimeter) : '–'}</td><td>${areaText(room.required)}</td></tr>`).join('');
  }

  function renderCosts(result) {
    const rows = result.costs.filter(item => item.value > 0);
    $('#costBreakdown').innerHTML = rows.length
      ? rows.map(item => `<div><span>${escapeHtml(item.label)}</span><strong>${money(item.value)}</strong></div>`).join('')
      : '<div class="empty-cost">Zadejte cenu balení nebo zapněte nákladové položky.</div>';
  }

  function renderResult(result) {
    lastResult = result;
    const netShare = result.purchasedArea > 0 ? clamp(result.netArea / result.purchasedArea * 100, 0, 100) : 0;
    const extraShare = Math.max(0, 100 - netShare);
    $('#resultModeBadge').textContent = result.mode === 'basic' ? 'Základní režim' : 'Rozšířený projekt';
    $('#resultFloorLabel').textContent = result.typeLabel;
    $('#resultPacks').textContent = `${result.packs} ${result.packs === 1 ? 'bal.' : 'bal.'}`;
    $('#resultPurchaseArea').textContent = `Nakoupíte ${areaText(result.purchasedArea)}`;
    $('#resultMainText').textContent = `Pro čistou plochu ${areaText(result.netArea)} a rezervu ${fmtCompact(result.reserve)} % vychází ${areaText(result.requiredArea)}. Po zaokrouhlení koupíte ${result.packs} celých balení.`;
    $('#gaugeNet').style.width = `${netShare}%`;
    $('#gaugeExtra').style.width = `${extraShare}%`;
    $('#legendNet').textContent = areaText(result.netArea);
    $('#legendExtra').textContent = areaText(result.leftoverArea);
    $('#metricRequired').textContent = areaText(result.requiredArea);
    $('#metricFloorCost').textContent = money(result.floorCost);
    $('#metricReserve').textContent = `${fmtCompact(result.reserve)} %`;
    $('#metricPriceM2').textContent = money(result.pricePerNetArea);
    $('[data-hero-packs]').textContent = `${result.packs} bal.`;
    $('[data-hero-area]').textContent = areaText(result.purchasedArea);
    $('[data-hero-reserve]').textContent = `${fmtCompact(result.reserve)} %`;

    const advancedPanel = $('#advancedResultPanel');
    if (result.mode === 'advanced') {
      advancedPanel.hidden = false;
      $('#advancedTotalCost').textContent = money(result.totalCost);
      $('#advancedMaterialCost').textContent = money(result.materialCost);
      $('#advancedLabourCost').textContent = money(result.labourCost);
      $('#advancedDuration').textContent = `${fmt(result.durationDays, 1)} dne`;
      $('#diyCost').textContent = money(result.diyCost);
      $('#proCost').textContent = money(result.proCost);
      $('#insightTitle').textContent = result.leftoverArea > result.packArea * 0.7 ? 'Zaokrouhlení vytváří téměř celé balení navíc' : 'Projekt je přepočítaný na skutečná prodejní balení';
      $('#insightText').textContent = `Rozšířený model počítá ${result.rooms.length} ${result.rooms.length === 1 ? 'místnost' : 'místnosti'}, ${metreText(result.perimeter)} obvodu pro lišty a všechny zapnuté vrstvy. Celková cena je ${money(result.totalCost)}.`;
    } else {
      advancedPanel.hidden = true;
      $('#insightTitle').textContent = result.leftoverArea > result.packArea * 0.7 ? 'Další balení vzniká hlavně zaokrouhlením' : 'Nákup je zaokrouhlený na celé balení';
      $('#insightText').textContent = `Čistá plocha je ${areaText(result.netArea)}, ale koupíte ${areaText(result.purchasedArea)}. Rozdíl zahrnuje prořez i nevyužitou část posledního balení.`;
    }
    renderScenarios(result);
    renderRooms(result);
    renderCosts(result);
  }

  function calculateAndRender(scrollOnError = false) {
    try {
      const result = currentMode === 'basic' ? calculateBasic() : calculateAdvanced();
      errorBox.hidden = true;
      renderResult(result);
    } catch (error) {
      errorBox.textContent = error.message || 'Zkontrolujte zadané hodnoty.';
      errorBox.hidden = false;
      if (scrollOnError) errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function syncBasicReserve() {
    const type = $('#basicFloorType').value;
    const pattern = $('#basicPattern').value;
    $('#basicReserve').value = getRecommendedReserve(type, pattern);
    calculateAndRender(false);
  }

  function syncAdvancedReserve() {
    const type = $('#advancedFloorType').value;
    const pattern = $('#advancedPattern').value;
    $('#advancedReserve').value = getRecommendedReserve(type, pattern);
    if (type === 'vinylGlue') {
      $('#useUnderlay').checked = false;
      $('#useVapour').checked = false;
      $('#useAdhesive').checked = true;
    }
    toggleFeatureFields();
    calculateAndRender(false);
  }

  function setMode(mode) {
    currentMode = mode;
    form.dataset.mode = mode;
    document.body.dataset.calculatorMode = mode;
    $$('.mode-button').forEach(button => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $('#basicCalculation').hidden = mode !== 'basic';
    $('#advancedCalculation').hidden = mode !== 'advanced';
    if (mode === 'advanced' && !advancedSeeded) seedAdvancedFromBasic();
    calculateAndRender(false);
  }

  function seedAdvancedFromBasic() {
    advancedSeeded = true;
    const basic = getBasicArea();
    const type = $('#basicFloorType').value;
    const pattern = $('#basicPattern').value;
    $('#advancedFloorType').value = type;
    $('#advancedPattern').value = pattern;
    $('#advancedReserve').value = $('#basicReserve').value;
    $('#advancedPackArea').value = $('#basicPackArea').value;
    $('#advancedPackPrice').value = $('#basicPackPrice').value;
    roomList.innerHTML = '';
    roomSerial = 0;
    if (getBasicMethod() === 'dimensions') {
      addRoom({ name: 'Hlavní místnost', length: number($('#basicLength').value, 5), width: number($('#basicWidth').value, 3.2), doors: 1 });
    } else {
      const side = Math.sqrt(basic.area);
      addRoom({ name: 'Hlavní místnost', length: side, width: side, doors: 1 });
    }
  }

  function toggleFeatureFields() {
    $$('[data-toggle-fields]').forEach(container => {
      const checkbox = $(`#${container.dataset.toggleFields}`);
      container.hidden = !checkbox?.checked;
    });
  }

  function resetBasic() {
    $('#basicLength').value = 5;
    $('#basicWidth').value = 3.2;
    $('#basicKnownArea').value = 16;
    $('input[name="basicMethod"][value="dimensions"]').checked = true;
    $('#basicDimensionsFields').hidden = false;
    $('#basicAreaField').hidden = true;
    $('#basicFloorType').value = 'laminate';
    $$('.floor-type').forEach(button => button.classList.toggle('is-active', button.dataset.floorType === 'laminate'));
    $('#basicPattern').value = 'straight';
    $('#basicPackArea').value = 2.22;
    $('#basicReserve').value = 7;
    $('#basicPackPrice').value = 1190;
    calculateAndRender(false);
  }

  function resetAdvanced() {
    advancedSeeded = true;
    roomList.innerHTML = '';
    roomSerial = 0;
    addRoom({ name: 'Obývací pokoj', length: 5.2, width: 4, excluded: 0, doors: 2, doorWidth: 0.8 });
    addRoom({ name: 'Ložnice', length: 4, width: 3.5, excluded: 1.2, doors: 1, doorWidth: 0.8 });
    $('#advancedFloorType').value = 'laminate';
    $('#advancedPattern').value = 'straight';
    $('#advancedReserve').value = 7;
    $('#advancedPackArea').value = 2.22;
    $('#advancedPackPrice').value = 1190;
    $('#floorDelivery').value = 800;
    $('#useUnderlay').checked = true;
    $('#useVapour').checked = true;
    $('#useSkirting').checked = true;
    $('#useProfiles').checked = true;
    $('#useLeveling').checked = false;
    $('#usePrimer').checked = false;
    $('#useAdhesive').checked = false;
    $('#profileCount').value = 2;
    $('#removalRate').value = 120;
    $('#prepRate').value = 90;
    $('#labourRate').value = 290;
    $('#skirtingLabourRate').value = 80;
    $('#productivity').value = 22;
    $('#otherCosts').value = 1800;
    toggleFeatureFields();
    calculateAndRender(false);
  }

  function copyResult() {
    if (!lastResult) return;
    const text = lastResult.mode === 'advanced'
      ? `Kalkulačka podlahy: ${areaText(lastResult.netArea)}, rezerva ${fmtCompact(lastResult.reserve)} %, ${lastResult.packs} balení (${areaText(lastResult.purchasedArea)}), materiály ${money(lastResult.materialCost)}, práce ${money(lastResult.labourCost)}, celkem ${money(lastResult.totalCost)}.`
      : `Kalkulačka podlahy: ${areaText(lastResult.netArea)}, rezerva ${fmtCompact(lastResult.reserve)} %, ${lastResult.packs} balení, nákup ${areaText(lastResult.purchasedArea)}, cena krytiny ${money(lastResult.floorCost)}.`;
    navigator.clipboard?.writeText(text).then(() => {
      const button = $('#copyResult');
      const original = button.textContent;
      button.textContent = 'Zkopírováno';
      setTimeout(() => { button.textContent = original; }, 1400);
    }).catch(() => {});
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    calculateAndRender(true);
    $('#vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $$('.mode-button').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  $$('input[name="basicMethod"]').forEach(input => input.addEventListener('change', () => {
    const dimensions = getBasicMethod() === 'dimensions';
    $('#basicDimensionsFields').hidden = !dimensions;
    $('#basicAreaField').hidden = dimensions;
    calculateAndRender(false);
  }));
  $$('.floor-type').forEach(button => button.addEventListener('click', () => {
    const type = button.dataset.floorType;
    $('#basicFloorType').value = type;
    $$('.floor-type').forEach(item => item.classList.toggle('is-active', item === button));
    $('#basicPackArea').value = floorTypes[type]?.packArea || 2.22;
    syncBasicReserve();
  }));
  $('#basicPattern').addEventListener('change', syncBasicReserve);
  $('#advancedFloorType').addEventListener('change', syncAdvancedReserve);
  $('#advancedPattern').addEventListener('change', syncAdvancedReserve);
  $('#addRoomBtn').addEventListener('click', () => addRoom());
  $('#basicReset').addEventListener('click', resetBasic);
  $('#advancedReset').addEventListener('click', resetAdvanced);
  $('#copyResult').addEventListener('click', copyResult);
  $('#printResult').addEventListener('click', () => window.print());

  $$('input,select', form).forEach(input => {
    if (input.closest('.room-card')) return;
    input.addEventListener('input', () => calculateAndRender(false));
    input.addEventListener('change', () => {
      if (input.type === 'checkbox') toggleFeatureFields();
      calculateAndRender(false);
    });
  });

  toggleFeatureFields();
  resetBasic();
})();
