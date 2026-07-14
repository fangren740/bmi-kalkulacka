(() => {
  'use strict';

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
  const form = $('#paintForm');
  if (!form) return;

  const number = (value, fallback = 0) => {
    const parsed = Number.parseFloat(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const round = (value, digits = 1) => {
    const factor = 10 ** digits;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  };
  const ceilStep = (value, step = 0.1) => Math.ceil((value - 1e-9) / step) * step;
  const formatNumber = (value, digits = 1) => new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
  const formatCompact = (value, maxDigits = 1) => new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDigits
  }).format(Number.isFinite(value) ? value : 0);
  const formatMoney = (value) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(value || 0))} Kč`;
  const formatLitres = (value) => `${formatNumber(value, value >= 100 ? 0 : 1)} l`;
  const formatArea = (value) => `${formatNumber(value, 1)} m²`;
  const setHidden = (element, hidden) => { if (element) element.hidden = hidden; };

  const roomList = $('#advancedRoomList');
  const errorBox = $('#formError');
  let roomSerial = 0;
  let currentMode = 'basic';
  let advancedSeeded = false;
  let lastResult = null;

  const basicPackageSizes = [1, 2.5, 5, 10];
  const roomPresets = {
    small: { length: 3.2, width: 2.7, height: 2.55 },
    bedroom: { length: 4.1, width: 3.4, height: 2.6 },
    living: { length: 5.5, width: 4.2, height: 2.65 }
  };

  function basicPackagePlan(required) {
    const target = Math.max(0, required);
    let best = null;
    const max10 = Math.ceil(target / 10) + 1;
    for (let a = 0; a <= max10; a += 1) {
      for (let b = 0; b <= 5; b += 1) {
        for (let c = 0; c <= 5; c += 1) {
          for (let d = 0; d <= 5; d += 1) {
            const counts = [d, c, b, a];
            const litres = counts.reduce((sum, count, index) => sum + count * basicPackageSizes[index], 0);
            if (litres + 1e-9 < target) continue;
            const pieces = counts.reduce((sum, count) => sum + count, 0);
            const candidate = { counts, litres, pieces, waste: litres - target };
            if (!best || candidate.waste < best.waste - 1e-9 ||
              (Math.abs(candidate.waste - best.waste) < 1e-9 && candidate.pieces < best.pieces) ||
              (Math.abs(candidate.waste - best.waste) < 1e-9 && candidate.pieces === best.pieces && candidate.litres < best.litres)) {
              best = candidate;
            }
          }
        }
      }
    }
    if (!best) return { counts: [0, 0, 0, 0], litres: 0, pieces: 0, waste: 0, text: '–' };
    const text = best.counts
      .map((count, index) => count > 0 ? `${count}× ${formatCompact(basicPackageSizes[index], 1)} l` : '')
      .filter(Boolean)
      .join(' + ');
    return { ...best, text };
  }

  function optimisePackages(required, packages) {
    const valid = packages
      .filter(pkg => pkg.enabled && pkg.size > 0 && pkg.price >= 0)
      .map((pkg, index) => ({ ...pkg, originalIndex: index, units: Math.max(1, Math.round(pkg.size * 10)) }));
    if (!valid.length || required <= 0) {
      return { counts: [], litres: 0, cost: 0, pieces: 0, waste: 0, text: 'Bez aktivního balení' };
    }
    const target = Math.max(1, Math.ceil(required * 10 - 1e-9));
    const maxPackage = Math.max(...valid.map(pkg => pkg.units));
    const limit = target + maxPackage * 2;
    const dp = Array(limit + 1).fill(null);
    dp[0] = { cost: 0, pieces: 0, counts: Array(valid.length).fill(0) };

    for (let units = 0; units <= limit; units += 1) {
      const state = dp[units];
      if (!state) continue;
      valid.forEach((pkg, index) => {
        const nextUnits = units + pkg.units;
        if (nextUnits > limit) return;
        const candidate = {
          cost: state.cost + pkg.price,
          pieces: state.pieces + 1,
          counts: state.counts.map((count, i) => count + (i === index ? 1 : 0))
        };
        const existing = dp[nextUnits];
        if (!existing || candidate.cost < existing.cost - 1e-9 ||
          (Math.abs(candidate.cost - existing.cost) < 1e-9 && candidate.pieces < existing.pieces)) {
          dp[nextUnits] = candidate;
        }
      });
    }

    let best = null;
    for (let units = target; units <= limit; units += 1) {
      const state = dp[units];
      if (!state) continue;
      const candidate = { ...state, units, wasteUnits: units - target };
      if (!best || candidate.cost < best.cost - 1e-9 ||
        (Math.abs(candidate.cost - best.cost) < 1e-9 && candidate.wasteUnits < best.wasteUnits) ||
        (Math.abs(candidate.cost - best.cost) < 1e-9 && candidate.wasteUnits === best.wasteUnits && candidate.pieces < best.pieces)) {
        best = candidate;
      }
    }
    if (!best) return { counts: [], litres: required, cost: 0, pieces: 0, waste: 0, text: 'Zadejte ceny balení' };

    const counts = valid.map((pkg, index) => ({ size: pkg.size, price: pkg.price, count: best.counts[index] })).filter(item => item.count > 0);
    const litres = best.units / 10;
    const text = counts.map(item => `${item.count}× ${formatCompact(item.size, 1)} l`).join(' + ');
    return { counts, litres, cost: best.cost, pieces: best.pieces, waste: litres - required, text };
  }

  function getBasicMethod() {
    return $('input[name="basicMethod"]:checked')?.value || 'room';
  }

  function getBasicDimensions() {
    return {
      length: Math.max(0, number($('#basicLength').value)),
      width: Math.max(0, number($('#basicWidth').value)),
      height: Math.max(0, number($('#basicHeight').value))
    };
  }

  function calculateBasic() {
    const method = getBasicMethod();
    const coats = clamp(Math.round(number($('#basicCoats').value, 2)), 1, 8);
    const coverage = Math.max(0.1, number($('#basicCoverage').value, 10));
    const reserve = clamp(number($('#basicReserve').value, 10), 0, 100);
    let walls = 0;
    let ceiling = 0;
    let openings = 0;
    let surfaceArea = 0;
    let dimensionsText = '';

    if (method === 'room') {
      const dimensions = getBasicDimensions();
      if (!dimensions.length || !dimensions.width || !dimensions.height) throw new Error('Zadejte kladnou délku, šířku a výšku místnosti.');
      const rawWalls = 2 * (dimensions.length + dimensions.width) * dimensions.height;
      if ($('#basicOpenings').checked) {
        const doors = clamp(Math.round(number($('#basicDoors').value)), 0, 20);
        const windows = clamp(Math.round(number($('#basicWindows').value)), 0, 30);
        openings = doors * 1.8 + windows * 1.5;
      }
      walls = Math.max(0, rawWalls - openings);
      ceiling = $('#basicCeiling').checked ? dimensions.length * dimensions.width : 0;
      surfaceArea = walls + ceiling;
      dimensionsText = `${formatCompact(dimensions.length, 2)} × ${formatCompact(dimensions.width, 2)} × ${formatCompact(dimensions.height, 2)} m`;
    } else {
      surfaceArea = Math.max(0, number($('#basicKnownArea').value));
      if (!surfaceArea) throw new Error('Zadejte kladnou plochu k malování.');
      walls = surfaceArea;
      dimensionsText = 'známá plocha';
    }

    const coatedArea = surfaceArea * coats;
    const netLitres = coatedArea / coverage;
    const requiredLitres = netLitres * (1 + reserve / 100);
    const packagePlan = basicPackagePlan(requiredLitres);
    const rows = [{ name: method === 'room' ? 'Základní místnost' : 'Zadaná plocha', walls, ceiling, openings, coatedArea }];

    return {
      mode: 'basic', method, coats, coverage, reserve, walls, ceiling, openings, surfaceArea, coatedArea,
      netLitres, requiredLitres, purchasedLitres: packagePlan.litres, leftover: Math.max(0, packagePlan.litres - requiredLitres),
      packagePlan, dimensionsText, rows, factors: 1, roomCount: 1, workHours: 0,
      paintCost: 0, primerCost: 0, labourCost: 0, otherCost: 0, totalCost: 0,
      primerLitres: 0, primerPurchased: 0
    };
  }

  function roomMarkup(room = {}) {
    roomSerial += 1;
    const id = `room-${roomSerial}`;
    const name = room.name || `Místnost ${roomSerial}`;
    const length = room.length ?? 4;
    const width = room.width ?? 3;
    const height = room.height ?? 2.6;
    const openings = room.openings ?? 3.3;
    const ceiling = room.ceiling !== false;
    return `
      <article class="room-card" data-room-id="${id}">
        <div class="room-card-head">
          <div class="room-name-wrap"><span class="room-index">${String(roomSerial).padStart(2, '0')}</span><input class="room-name" type="text" value="${escapeHtml(name)}" aria-label="Název místnosti"></div>
          <button class="room-remove" type="button" aria-label="Odebrat místnost">×</button>
        </div>
        <div class="room-card-body">
          <div class="room-dim-grid">
            <label class="room-mini-field"><span>Délka</span><div><input class="room-length" type="number" min="0.1" step="0.1" value="${length}" inputmode="decimal"><em>m</em></div></label>
            <label class="room-mini-field"><span>Šířka</span><div><input class="room-width" type="number" min="0.1" step="0.1" value="${width}" inputmode="decimal"><em>m</em></div></label>
            <label class="room-mini-field"><span>Výška</span><div><input class="room-height" type="number" min="0.1" step="0.05" value="${height}" inputmode="decimal"><em>m</em></div></label>
          </div>
          <div class="room-options">
            <label class="room-check"><input class="room-ceiling" type="checkbox" ${ceiling ? 'checked' : ''}> Malovat strop</label>
            <label class="room-check room-openings">Otvory <input class="room-openings-area" type="number" min="0" step="0.1" value="${openings}" inputmode="decimal"> m²</label>
          </div>
          <div class="room-summary"><span>Stěny <b data-room-walls>–</b></span><span>Strop <b data-room-ceiling>–</b></span><span>Po vrstvách <b data-room-coated>–</b></span></div>
        </div>
      </article>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
  }

  function addRoom(room) {
    roomList.insertAdjacentHTML('beforeend', roomMarkup(room));
    renumberRooms();
  }

  function renumberRooms() {
    $$('.room-card', roomList).forEach((card, index) => {
      const badge = $('.room-index', card);
      if (badge) badge.textContent = String(index + 1).padStart(2, '0');
      const remove = $('.room-remove', card);
      if (remove) remove.disabled = $$('.room-card', roomList).length <= 1;
    });
  }

  function readRooms() {
    const wallCoats = clamp(Math.round(number($('#advancedWallCoats').value, 2)), 1, 8);
    const ceilingCoats = clamp(Math.round(number($('#advancedCeilingCoats').value, 2)), 1, 8);
    return $$('.room-card', roomList).map((card, index) => {
      const name = $('.room-name', card).value.trim() || `Místnost ${index + 1}`;
      const length = Math.max(0, number($('.room-length', card).value));
      const width = Math.max(0, number($('.room-width', card).value));
      const height = Math.max(0, number($('.room-height', card).value));
      const openings = Math.max(0, number($('.room-openings-area', card).value));
      const includeCeiling = $('.room-ceiling', card).checked;
      if (!length || !width || !height) throw new Error(`Zkontrolujte rozměry místnosti „${name}“.`);
      const rawWalls = 2 * (length + width) * height;
      const walls = Math.max(0, rawWalls - Math.min(openings, rawWalls));
      const ceiling = includeCeiling ? length * width : 0;
      const coatedArea = walls * wallCoats + ceiling * ceilingCoats;
      return { card, name, length, width, height, openings: Math.min(openings, rawWalls), walls, ceiling, coatedArea, includeCeiling };
    });
  }

  function readPackages() {
    return $$('.package-row', $('#packageTable')).map(row => ({
      enabled: $('.package-enabled', row).checked,
      size: Math.max(0, number($('.package-size', row).value)),
      price: Math.max(0, number($('.package-price', row).value))
    }));
  }

  function calculateAdvanced() {
    const rooms = readRooms();
    if (!rooms.length) throw new Error('Přidejte alespoň jednu místnost.');
    const coverage = Math.max(0.1, number($('#advancedCoverage').value, 10));
    const reserve = clamp(number($('#advancedReserve').value, 8), 0, 100);
    const surfaceFactor = clamp(number($('#surfaceFactor').value, 1), 0.5, 3);
    const colourFactor = clamp(number($('#colourFactor').value, 1), 0.5, 3);
    const applicationFactor = clamp(number($('#applicationFactor').value, 1), 0.5, 3);
    const colourCount = clamp(Math.round(number($('#colourCount').value, 1)), 1, 20);
    const factors = surfaceFactor * colourFactor * applicationFactor;
    const walls = rooms.reduce((sum, room) => sum + room.walls, 0);
    const ceiling = rooms.reduce((sum, room) => sum + room.ceiling, 0);
    const openings = rooms.reduce((sum, room) => sum + room.openings, 0);
    const surfaceArea = walls + ceiling;
    const coatedArea = rooms.reduce((sum, room) => sum + room.coatedArea, 0);
    const netLitres = coatedArea / coverage;
    const requiredLitres = netLitres * factors * (1 + reserve / 100);
    const packages = readPackages();
    const perColourNeed = requiredLitres / colourCount;
    const perColourPlan = optimisePackages(perColourNeed, packages);
    const planCounts = perColourPlan.counts.map(item => ({ ...item, count: item.count * colourCount }));
    const packagePlan = {
      counts: planCounts,
      litres: perColourPlan.litres * colourCount,
      cost: perColourPlan.cost * colourCount,
      pieces: perColourPlan.pieces * colourCount,
      waste: Math.max(0, perColourPlan.litres * colourCount - requiredLitres),
      text: planCounts.length ? planCounts.map(item => `${item.count}× ${formatCompact(item.size, 1)} l`).join(' + ') : perColourPlan.text,
      perColour: colourCount > 1
    };

    const usePrimer = $('#usePrimer').checked;
    let primerLitres = 0;
    let primerPurchased = 0;
    let primerPackages = 0;
    let primerCost = 0;
    if (usePrimer) {
      const primerCoverage = Math.max(0.1, number($('#primerCoverage').value, 12));
      const primerCoats = clamp(Math.round(number($('#primerCoats').value, 1)), 1, 5);
      const primerPackage = Math.max(0.1, number($('#primerPackage').value, 5));
      const primerPackagePrice = Math.max(0, number($('#primerPackagePrice').value, 390));
      primerLitres = surfaceArea * primerCoats / primerCoverage * surfaceFactor;
      primerPackages = Math.ceil(primerLitres / primerPackage - 1e-9);
      primerPurchased = primerPackages * primerPackage;
      primerCost = primerPackages * primerPackagePrice;
    }

    const useLabour = $('#useLabour').checked;
    let workHours = 0;
    let labourCost = 0;
    if (useLabour) {
      const productivity = Math.max(0.1, number($('#productivity').value, 18));
      const prepHours = Math.max(0, number($('#prepHoursPerRoom').value, 1.5));
      const labourRate = Math.max(0, number($('#labourRate').value, 450));
      workHours = coatedArea / productivity + rooms.length * prepHours;
      labourCost = workHours * labourRate;
    }
    const otherCost = Math.max(0, number($('#otherCosts').value, 0));
    const paintCost = packagePlan.cost;
    const totalCost = paintCost + primerCost + labourCost + otherCost;

    return {
      mode: 'advanced', rooms, rows: rooms, roomCount: rooms.length, coverage, reserve, surfaceFactor, colourFactor,
      applicationFactor, colourCount, factors, walls, ceiling, openings, surfaceArea, coatedArea, netLitres,
      requiredLitres, purchasedLitres: packagePlan.litres, leftover: packagePlan.waste, packagePlan,
      paintCost, primerLitres, primerPurchased, primerPackages, primerCost, workHours, labourCost, otherCost, totalCost,
      wallCoats: clamp(Math.round(number($('#advancedWallCoats').value, 2)), 1, 8),
      ceilingCoats: clamp(Math.round(number($('#advancedCeilingCoats').value, 2)), 1, 8)
    };
  }

  function calculate() {
    try {
      errorBox.hidden = true;
      const result = currentMode === 'advanced' ? calculateAdvanced() : calculateBasic();
      lastResult = result;
      renderResult(result);
      return result;
    } catch (error) {
      errorBox.textContent = error.message || 'Zkontrolujte zadané hodnoty.';
      errorBox.hidden = false;
      return null;
    }
  }

  function renderResult(result) {
    const advanced = result.mode === 'advanced';
    setText('#modeResultBadge', advanced ? 'Rozšířený projekt' : 'Základní režim');
    setText('#resultStatus', advanced ? `${result.roomCount} ${result.roomCount === 1 ? 'místnost' : result.roomCount < 5 ? 'místnosti' : 'místností'}` : 'Jedna místnost');
    setText('#resultHeading', advanced ? 'Nákup a rozpočet projektu' : 'Kolik barvy koupit');
    setText('#resultMainLabel', advanced ? 'Optimalizovaný nákup barvy' : 'Doporučený nákup barvy');
    setText('#resultPurchase', formatLitres(result.purchasedLitres));
    setText('#surfaceAreaResult', formatArea(result.surfaceArea));
    setText('#coatedAreaResult', formatArea(result.coatedArea));
    setText('#netLitresResult', formatLitres(result.netLitres));
    setText('#reserveLitresResult', formatLitres(result.requiredLitres));
    setText('#reserveMetricNote', advanced ? `rezerva ${formatCompact(result.reserve)} % + korekce` : `rezerva ${formatCompact(result.reserve)} %`);

    const needPercent = result.purchasedLitres > 0 ? clamp(result.requiredLitres / result.purchasedLitres * 100, 0, 100) : 0;
    $('#paintNeedBar').style.width = `${needPercent}%`;
    setText('#gaugeNeed', formatLitres(result.requiredLitres));
    setText('#gaugeLeft', formatLitres(result.leftover));

    [8, 10, 12, 14].forEach(value => {
      const factor = advanced ? result.factors : 1;
      const litres = result.coatedArea / value * factor * (1 + result.reserve / 100);
      setText(`#scenario${value}`, formatLitres(litres));
    });
    $$('.scenario-grid>div').forEach((node, index) => node.classList.toggle('is-current', [8, 10, 12, 14][index] === Math.round(result.coverage)));

    if (advanced) {
      setText('#resultSentence', `Projekt potřebuje přibližně ${formatLitres(result.requiredLitres)} barvy. Optimalizovaný nákup aktivních balení je ${result.packagePlan.text || formatLitres(result.purchasedLitres)} za ${formatMoney(result.paintCost)}.`);
      setText('#wallsAreaResult', formatArea(result.walls));
      setText('#ceilingsAreaResult', formatArea(result.ceiling));
      setText('#roomCountResult', String(result.roomCount));
      setText('#workTimeResult', result.workHours ? formatHours(result.workHours) : 'Nezapočítáno');
      renderPackagePlan(result);
      renderCosts(result);
    } else {
      setText('#resultSentence', `Na ${formatArea(result.surfaceArea)} povrchů při ${result.coats} ${result.coats === 1 ? 'vrstvě' : result.coats < 5 ? 'vrstvách' : 'vrstvách'} vychází ${formatLitres(result.requiredLitres)} barvy. Praktický nákup: ${result.packagePlan.text}.`);
    }
    setHidden($('[data-advanced-result]'), !advanced);
    renderBreakdown(result);
    renderRecommendation(result);
    renderHero(result);
    updateRoomSummaries(result);
  }

  function renderPackagePlan(result) {
    const list = $('#packagePlanList');
    list.innerHTML = '';
    if (!result.packagePlan.counts.length) {
      list.innerHTML = '<div class="package-plan-item"><span>Aktivujte alespoň jedno balení a zadejte jeho cenu.</span><b>–</b></div>';
    } else {
      result.packagePlan.counts
        .sort((a, b) => b.size - a.size)
        .forEach(item => {
          list.insertAdjacentHTML('beforeend', `<div class="package-plan-item"><span>${item.count} bal. × ${formatCompact(item.size, 1)} l</span><b>${formatMoney(item.count * item.price)}</b></div>`);
        });
    }
    setText('#packagePlanTitle', result.packagePlan.perColour ? `Kombinace pro ${result.colourCount} odstíny` : 'Nejlevnější kombinace balení');
    setText('#packagePlanCost', formatMoney(result.paintCost));
    setText('#purchasedLitres', formatLitres(result.purchasedLitres));
    setText('#leftoverLitres', formatLitres(result.leftover));
    setText('#effectiveLitrePrice', result.purchasedLitres > 0 ? `${formatMoney(result.paintCost / result.purchasedLitres).replace(' Kč', '')} Kč/l` : '0 Kč/l');
  }

  function renderCosts(result) {
    setText('#totalProjectCost', formatMoney(result.totalCost));
    setText('#paintCost', formatMoney(result.paintCost));
    setText('#primerCost', formatMoney(result.primerCost));
    setText('#labourCost', formatMoney(result.labourCost));
    setText('#otherCost', formatMoney(result.otherCost));
    setText('#paintCostDetail', `${result.packagePlan.pieces} balení / ${formatLitres(result.purchasedLitres)}`);
    setText('#primerCostDetail', result.primerCost ? `${result.primerPackages} balení / ${formatLitres(result.primerPurchased)}` : 'nezapočítáno');
    setText('#labourCostDetail', result.workHours ? `${formatHours(result.workHours)} při zadané sazbě` : 'nezapočítáno');
    setText('#costHeadline', result.labourCost > result.paintCost ? 'Největší položkou je práce' : result.paintCost ? 'Největší položkou je materiál' : 'Doplňte ceny balení');
    const max = Math.max(result.paintCost, result.primerCost, result.labourCost, result.otherCost, 1);
    $('#paintCostBar').style.width = `${result.paintCost / max * 100}%`;
    $('#primerCostBar').style.width = `${result.primerCost / max * 100}%`;
    $('#labourCostBar').style.width = `${result.labourCost / max * 100}%`;
    $('#otherCostBar').style.width = `${result.otherCost / max * 100}%`;
  }

  function renderBreakdown(result) {
    const body = $('#roomBreakdownBody');
    body.innerHTML = '';
    result.rows.forEach(row => {
      body.insertAdjacentHTML('beforeend', `<tr><td>${escapeHtml(row.name || 'Zadaná plocha')}</td><td>${formatArea(row.walls)}</td><td>${formatArea(row.ceiling)}</td><td>${formatArea(row.openings)}</td><td>${formatArea(row.coatedArea)}</td></tr>`);
    });
    setText('#summaryWalls', formatArea(result.walls));
    setText('#summaryCeilings', formatArea(result.ceiling));
    setText('#summaryOpenings', formatArea(result.openings));
    setText('#summaryCoated', formatArea(result.coatedArea));
  }

  function renderRecommendation(result) {
    let title = 'Zkontrolujte vydatnost konkrétní barvy';
    let text = 'Největší rozdíl ve výsledku dělá skutečná vydatnost na vašem podkladu a počet potřebných vrstev.';
    if (result.mode === 'basic') {
      const wasteRatio = result.purchasedLitres ? result.leftover / result.purchasedLitres : 0;
      if (wasteRatio > 0.3) {
        title = 'Nákup vytváří větší zbytek';
        text = 'Zvažte jinou kombinaci dostupných balení nebo využití stejného odstínu v další místnosti. Malý zbytek je praktický, velký přebytek už může být zbytečný.';
      } else if (result.coats >= 3) {
        title = 'Tři vrstvy výrazně mění spotřebu';
        text = 'Ověřte, zda je třetí vrstva skutečně potřebná. Při výrazné změně odstínu může pomoci vhodná příprava nebo systém doporučený výrobcem.';
      }
    } else {
      if (result.colourCount > 1) {
        title = 'Nákup je rozdělen rovnoměrně mezi odstíny';
        text = 'Optimalizace předpokládá stejnou spotřebu každého odstínu. Pokud mají odstíny rozdílné plochy, rozdělte projekt na samostatné výpočty.';
      } else if (result.factors > 1.25) {
        title = 'Podmínky projektu zvyšují spotřebu';
        text = 'Savý nebo hrubý podklad, výrazná změna odstínu či způsob aplikace významně navyšují výsledek. Proveďte zkušební nátěr a ověřte skutečnou vydatnost.';
      } else if (result.leftover > Math.max(2, result.requiredLitres * 0.2)) {
        title = 'Optimalizace chrání cenu, ale zůstává více barvy';
        text = 'Zadaná kombinace balení je nejlevnější podle vašich cen. Přidejte jinou velikost balení nebo upravte ceny, pokud chcete snížit přebytek.';
      } else {
        title = 'Projekt je připravený k ověření nabídky';
        text = 'Před nákupem potvrďte technický list, dostupná balení, odstín a stav podkladu. Rozpočet práce je orientační a nezahrnuje neplánované opravy.';
      }
    }
    setText('#recommendationTitle', title);
    setText('#recommendationText', text);
  }

  function renderHero(result) {
    $$('[data-hero-litres]').forEach(el => { el.textContent = formatLitres(result.requiredLitres); });
    $$('[data-hero-purchase]').forEach(el => { el.textContent = formatLitres(result.purchasedLitres); });
    $$('[data-hero-area]').forEach(el => { el.textContent = formatArea(result.coatedArea); });
    $$('[data-hero-coats]').forEach(el => {
      el.textContent = result.mode === 'advanced' ? `${result.wallCoats}× / ${result.ceilingCoats}×` : `${result.coats}×`;
    });
  }

  function updateRoomSummaries(result) {
    if (result.mode !== 'advanced') return;
    result.rooms.forEach(room => {
      setText('[data-room-walls]', formatArea(room.walls), room.card);
      setText('[data-room-ceiling]', formatArea(room.ceiling), room.card);
      setText('[data-room-coated]', formatArea(room.coatedArea), room.card);
    });
  }

  function setText(selector, value, scope = document) {
    const element = $(selector, scope);
    if (element) element.textContent = value;
  }

  function formatHours(hours) {
    const totalMinutes = Math.round(hours * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }

  function updateBasicMethodVisibility() {
    const method = getBasicMethod();
    $$('[data-basic-method]').forEach(section => { section.hidden = section.dataset.basicMethod !== method; });
  }

  function updateOpeningVisibility() {
    $('#basicOpeningFields').hidden = !$('#basicOpenings').checked;
  }

  function updateAdvancedOptionVisibility() {
    const primerFields = $('#primerFields');
    const labourFields = $('#labourFields');
    primerFields.style.display = $('#usePrimer').checked ? '' : 'none';
    labourFields.style.display = $('#useLabour').checked ? '' : 'none';
  }

  function updatePackageUnitPrices() {
    $$('.package-row', $('#packageTable')).forEach(row => {
      const size = Math.max(0, number($('.package-size', row).value));
      const price = Math.max(0, number($('.package-price', row).value));
      const unit = $('[data-package-unit]', row);
      unit.textContent = size ? `${formatMoney(price / size).replace(' Kč', '')} Kč/l` : '–';
    });
  }

  function seedAdvancedFromBasic() {
    if (advancedSeeded) return;
    roomList.innerHTML = '';
    const method = getBasicMethod();
    const dimensions = getBasicDimensions();
    const doors = $('#basicOpenings').checked ? clamp(Math.round(number($('#basicDoors').value)), 0, 20) : 0;
    const windows = $('#basicOpenings').checked ? clamp(Math.round(number($('#basicWindows').value)), 0, 30) : 0;
    if (method === 'area') {
      const knownArea = Math.max(0.1, number($('#basicKnownArea').value, 42));
      const transferHeight = 2.6;
      const squareSide = Math.max(0.1, knownArea / (4 * transferHeight));
      addRoom({
        name: 'Zadaná plocha – upravte rozměry', length: squareSide, width: squareSide,
        height: transferHeight, openings: 0, ceiling: false
      });
    } else {
      addRoom({
        name: 'Hlavní místnost', length: dimensions.length || 4, width: dimensions.width || 3,
        height: dimensions.height || 2.6, openings: doors * 1.8 + windows * 1.5, ceiling: $('#basicCeiling').checked
      });
    }
    $('#advancedCoverage').value = $('#basicCoverage').value;
    $('#advancedWallCoats').value = $('#basicCoats').value;
    $('#advancedCeilingCoats').value = $('#basicCoats').value;
    $('#advancedReserve').value = Math.min(50, number($('#basicReserve').value, 10));
    advancedSeeded = true;
  }

  function switchMode(mode) {
    currentMode = mode === 'advanced' ? 'advanced' : 'basic';
    if (currentMode === 'advanced') seedAdvancedFromBasic();
    form.dataset.mode = currentMode;
    document.body.dataset.calculatorMode = currentMode;
    $$('.mode-button').forEach(button => {
      const active = button.dataset.mode === currentMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $('#basicCalculation').hidden = currentMode !== 'basic';
    $('#advancedCalculation').hidden = currentMode !== 'advanced';
    const calculateButton = $('#calculateBtn');
    if (calculateButton) calculateButton.textContent = currentMode === 'basic' ? 'Spočítat barvu' : 'Přepočítat celý projekt';
    calculate();
  }

  function reset() {
    form.reset();
    currentMode = 'basic';
    advancedSeeded = false;
    roomList.innerHTML = '';
    roomSerial = 0;
    $('#basicCoats').value = '2';
    $$('.coat-picker button').forEach(button => button.classList.toggle('is-active', button.dataset.basicCoats === '2'));
    updateBasicMethodVisibility();
    updateOpeningVisibility();
    updateAdvancedOptionVisibility();
    updatePackageUnitPrices();
    switchMode('basic');
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    calculate();
    $('#vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('input', event => {
    if (event.target.matches('.package-size,.package-price,.package-enabled')) updatePackageUnitPrices();
    calculate();
  });
  form.addEventListener('change', event => {
    if (event.target.name === 'basicMethod') updateBasicMethodVisibility();
    if (event.target.id === 'basicOpenings') updateOpeningVisibility();
    if (event.target.id === 'usePrimer' || event.target.id === 'useLabour') updateAdvancedOptionVisibility();
    calculate();
  });

  $$('.mode-button').forEach(button => button.addEventListener('click', () => switchMode(button.dataset.mode)));
  $$('.coat-picker button').forEach(button => button.addEventListener('click', () => {
    $('#basicCoats').value = button.dataset.basicCoats;
    $$('.coat-picker button').forEach(item => item.classList.toggle('is-active', item === button));
    calculate();
  }));
  $$('[data-room-preset]').forEach(button => button.addEventListener('click', () => {
    const preset = roomPresets[button.dataset.roomPreset];
    if (!preset) return;
    $('#basicLength').value = preset.length;
    $('#basicWidth').value = preset.width;
    $('#basicHeight').value = preset.height;
    calculate();
  }));
  $$('[data-step-target]').forEach(button => button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.stepTarget);
    if (!input) return;
    const next = clamp(number(input.value) + number(button.dataset.step), number(input.min, 0), number(input.max, 999));
    input.value = String(next);
    calculate();
  }));

  $('#addRoomBtn').addEventListener('click', () => {
    const count = $$('.room-card', roomList).length;
    addRoom({ name: `Místnost ${count + 1}`, length: 4, width: 3, height: 2.6, openings: 3.3, ceiling: true });
    calculate();
  });
  roomList.addEventListener('click', event => {
    const removeButton = event.target.closest('.room-remove');
    if (!removeButton) return;
    if ($$('.room-card', roomList).length <= 1) return;
    removeButton.closest('.room-card').remove();
    renumberRooms();
    calculate();
  });

  $('#resetBtn').addEventListener('click', reset);
  $('#printResult').addEventListener('click', () => window.print());
  $('#copyResult').addEventListener('click', async () => {
    if (!lastResult) return;
    const lines = lastResult.mode === 'advanced'
      ? [
        'Kalkulačka barvy na malování – RychléVýpočty.cz',
        `Místnosti: ${lastResult.roomCount}`,
        `Plocha povrchů: ${formatArea(lastResult.surfaceArea)}`,
        `Natíraná plocha: ${formatArea(lastResult.coatedArea)}`,
        `Potřeba barvy: ${formatLitres(lastResult.requiredLitres)}`,
        `Nákup: ${lastResult.packagePlan.text}`,
        `Cena barvy: ${formatMoney(lastResult.paintCost)}`,
        `Celkový orientační rozpočet: ${formatMoney(lastResult.totalCost)}`
      ]
      : [
        'Kalkulačka barvy na malování – RychléVýpočty.cz',
        `Plocha povrchů: ${formatArea(lastResult.surfaceArea)}`,
        `Natíraná plocha: ${formatArea(lastResult.coatedArea)}`,
        `Potřeba barvy: ${formatLitres(lastResult.requiredLitres)}`,
        `Doporučený nákup: ${lastResult.packagePlan.text}`
      ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      const button = $('#copyResult');
      const original = button.textContent;
      button.textContent = 'Zkopírováno';
      setTimeout(() => { button.textContent = original; }, 1500);
    } catch {
      errorBox.textContent = 'Výsledek se nepodařilo zkopírovat. Označte jej prosím ručně.';
      errorBox.hidden = false;
    }
  });

  updateBasicMethodVisibility();
  updateOpeningVisibility();
  updateAdvancedOptionVisibility();
  updatePackageUnitPrices();
  calculate();
})();
