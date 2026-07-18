(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('fuelCalculator');
  if (!form) return;

  let activeMode = 'basic';

  const formatNumber = (value, digits = 2) => new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);

  const formatCurrency = (value) => new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);

  const formatCurrencyFine = (value) => new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);

  const parseNumber = (id) => {
    const element = $(id);
    if (!element) return NaN;
    const normalized = String(element.value).trim().replace(/\s/g, '').replace(',', '.');
    return normalized === '' ? NaN : Number(normalized);
  };

  const setText = (id, value) => {
    const element = $(id);
    if (element) element.textContent = value;
  };

  const liters = (value) => `${formatNumber(value, 2)} l`;
  const distance = (value) => `${formatNumber(value, 1)} km`;
  const consumptionText = (value) => `${formatNumber(value, 2)} l/100 km`;
  const costPerKmText = (value) => `${formatCurrencyFine(value)}/km`;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function clearValidation() {
    form.querySelectorAll('.is-invalid').forEach((element) => element.classList.remove('is-invalid'));
    setText('basicMessage', '');
    setText('proMessage', '');
  }

  function invalidate(id, message, mode) {
    const input = $(id);
    const wrapper = input?.closest('.vpc-input-wrap, .vpc-select-wrap');
    if (wrapper) wrapper.classList.add('is-invalid');
    setText(mode === 'pro' ? 'proMessage' : 'basicMessage', message);
  }

  function readRadio(name) {
    return form.querySelector(`input[name="${name}"]:checked`)?.value || '';
  }

  function getBasicScenario() {
    const routeDistance = parseNumber('basicDistance');
    const consumption = parseNumber('basicConsumption');
    const price = parseNumber('basicPrice');

    if (!Number.isFinite(routeDistance) || routeDistance <= 0) {
      invalidate('basicDistance', 'Zadejte kladnou délku celé cesty.', 'basic');
      return null;
    }
    if (!Number.isFinite(consumption) || consumption <= 0) {
      invalidate('basicConsumption', 'Zadejte kladnou průměrnou spotřebu.', 'basic');
      return null;
    }
    if (!Number.isFinite(price) || price < 0) {
      invalidate('basicPrice', 'Cena paliva musí být nula nebo kladné číslo.', 'basic');
      return null;
    }

    const baseFuel = routeDistance * consumption / 100;
    const fuelCost = baseFuel * price;

    return {
      mode: 'basic',
      routeDistance,
      directionLabel: 'celá zadaná trasa',
      consumption,
      sourceLabel: 'zadaný průměr',
      price,
      reservePercent: 0,
      baseFuel,
      reserveFuel: 0,
      totalFuel: baseFuel,
      fuelCost,
      extraCosts: 0,
      totalCost: fuelCost,
      costPerKm: fuelCost / routeDistance,
      passengers: 1,
      perPerson: fuelCost,
      comparisonConsumption: 0,
      comparisonTotal: 0
    };
  }

  function getProScenario() {
    const oneWayDistance = parseNumber('proDistance');
    const price = parseNumber('proPrice');
    const directionMode = readRadio('direction');
    const source = readRadio('consumptionSource');
    const reservePercent = parseNumber('reservePercent');
    const extraCosts = parseNumber('extraCosts');
    const passengersRaw = parseNumber('passengers');
    const comparisonConsumptionRaw = parseNumber('compareConsumption');

    if (!Number.isFinite(oneWayDistance) || oneWayDistance <= 0) {
      invalidate('proDistance', 'Zadejte kladnou vzdálenost jedním směrem.', 'pro');
      return null;
    }
    if (!Number.isFinite(price) || price < 0) {
      invalidate('proPrice', 'Cena paliva musí být nula nebo kladné číslo.', 'pro');
      return null;
    }

    let consumption;
    let sourceLabel;
    if (source === 'tank') {
      const tankDistance = parseNumber('tankDistance');
      const tankLiters = parseNumber('tankLiters');
      if (!Number.isFinite(tankDistance) || tankDistance <= 0) {
        invalidate('tankDistance', 'Zadejte kladné kilometry mezi tankováními.', 'pro');
        return null;
      }
      if (!Number.isFinite(tankLiters) || tankLiters <= 0) {
        invalidate('tankLiters', 'Zadejte kladné množství doplněného paliva.', 'pro');
        return null;
      }
      consumption = tankLiters / tankDistance * 100;
      sourceLabel = `z tankování ${formatNumber(tankLiters, 2)} l / ${formatNumber(tankDistance, 1)} km`;
    } else {
      consumption = parseNumber('proConsumption');
      sourceLabel = 'zadaný průměr';
      if (!Number.isFinite(consumption) || consumption <= 0) {
        invalidate('proConsumption', 'Zadejte kladnou průměrnou spotřebu.', 'pro');
        return null;
      }
    }

    if (!Number.isFinite(reservePercent) || reservePercent < 0 || reservePercent > 100) {
      invalidate('reservePercent', 'Rezerva musí být mezi 0 a 100 %.', 'pro');
      return null;
    }
    if (!Number.isFinite(extraCosts) || extraCosts < 0) {
      invalidate('extraCosts', 'Další náklady musí být nula nebo kladné číslo.', 'pro');
      return null;
    }
    if (!Number.isFinite(passengersRaw) || passengersRaw < 1 || passengersRaw > 99) {
      invalidate('passengers', 'Počet platících osob musí být mezi 1 a 99.', 'pro');
      return null;
    }
    if (!Number.isFinite(comparisonConsumptionRaw) || comparisonConsumptionRaw < 0) {
      invalidate('compareConsumption', 'Srovnávací spotřeba musí být nula nebo kladné číslo.', 'pro');
      return null;
    }

    const multiplier = directionMode === 'return' ? 2 : 1;
    const routeDistance = oneWayDistance * multiplier;
    const passengers = Math.max(1, Math.round(passengersRaw));
    const baseFuel = routeDistance * consumption / 100;
    const reserveFuel = baseFuel * reservePercent / 100;
    const totalFuel = baseFuel + reserveFuel;
    const fuelCost = totalFuel * price;
    const totalCost = fuelCost + extraCosts;
    const comparisonConsumption = comparisonConsumptionRaw;
    const comparisonTotal = comparisonConsumption > 0
      ? routeDistance * comparisonConsumption / 100 * (1 + reservePercent / 100) * price + extraCosts
      : 0;

    return {
      mode: 'pro',
      routeDistance,
      directionLabel: directionMode === 'return' ? 'tam i zpět' : 'jeden směr',
      consumption,
      sourceLabel,
      price,
      reservePercent,
      baseFuel,
      reserveFuel,
      totalFuel,
      fuelCost,
      extraCosts,
      totalCost,
      costPerKm: totalCost / routeDistance,
      passengers,
      perPerson: totalCost / passengers,
      comparisonConsumption,
      comparisonTotal
    };
  }

  function renderRows(scenario) {
    const body = $('summaryTableBody');
    if (!body) return;

    const rows = [
      ['Celková vzdálenost', distance(scenario.routeDistance), scenario.directionLabel],
      ['Použitá spotřeba', consumptionText(scenario.consumption), scenario.sourceLabel],
      ['Základní palivo', liters(scenario.baseFuel), 'bez plánovací rezervy'],
      ['Rezerva paliva', liters(scenario.reserveFuel), `${formatNumber(scenario.reservePercent, 1)} % ze základních litrů`],
      ['Palivo celkem', liters(scenario.totalFuel), 'základ plus rezerva'],
      ['Palivový náklad', formatCurrency(scenario.fuelCost), `${formatCurrencyFine(scenario.price)} za litr`],
      ['Další náklady', formatCurrency(scenario.extraCosts), 'parkování, mýto a zadané poplatky'],
      ['Cena celé cesty', formatCurrency(scenario.totalCost), `${costPerKmText(scenario.costPerKm)} při ${scenario.passengers} ${scenario.passengers === 1 ? 'osobě' : 'osobách'}`]
    ];

    body.innerHTML = rows.map(([name, value, note]) => `<tr><td data-label="Položka">${name}</td><td data-label="Hodnota"><strong>${value}</strong></td><td data-label="Co znamená">${note}</td></tr>`).join('');
  }

  function renderComparison(scenario) {
    const panel = $('comparisonPanel');
    if (!panel) return;
    if (scenario.mode !== 'pro' || scenario.comparisonConsumption <= 0) {
      panel.hidden = true;
      return;
    }

    panel.hidden = false;
    const difference = scenario.comparisonTotal - scenario.totalCost;
    setText('comparisonTitle', consumptionText(scenario.comparisonConsumption));
    if (Math.abs(difference) < 0.5) {
      setText('comparisonText', `Srovnávací scénář vychází prakticky stejně: ${formatCurrency(scenario.comparisonTotal)} za celou cestu.`);
    } else if (difference > 0) {
      setText('comparisonText', `Při srovnávací spotřebě by cesta stála ${formatCurrency(scenario.comparisonTotal)}, tedy přibližně o ${formatCurrency(difference)} více.`);
    } else {
      setText('comparisonText', `Při srovnávací spotřebě by cesta stála ${formatCurrency(scenario.comparisonTotal)}, tedy přibližně o ${formatCurrency(Math.abs(difference))} méně.`);
    }
  }

  function renderScenario(scenario) {
    const peopleLabel = scenario.passengers === 1 ? '1 platící osoba' : `${scenario.passengers} platící osoby`;
    const fuelShare = scenario.totalCost > 0 ? clamp(scenario.fuelCost / scenario.totalCost * 100, 0, 100) : 0;
    const extrasLabel = scenario.extraCosts > 0 ? `poplatky ${formatCurrency(scenario.extraCosts)}` : 'bez dalších nákladů';

    setText('resultMode', scenario.mode === 'pro' ? 'PRO' : 'Basic');
    setText('mainResult', formatCurrency(scenario.totalCost));
    setText('mainSubResult', costPerKmText(scenario.costPerKm));
    setText('resultSummary', `Na trasu ${distance(scenario.routeDistance)} potřebujete přibližně ${liters(scenario.totalFuel)} paliva${scenario.reservePercent > 0 ? ' včetně rezervy' : ''}.`);
    $('resultBar').style.width = `${fuelShare}%`;
    setText('resultBarLabel', extrasLabel);

    setText('distanceResult', distance(scenario.routeDistance));
    setText('directionResult', scenario.directionLabel);
    setText('fuelResult', liters(scenario.totalFuel));
    setText('reserveResult', scenario.reservePercent > 0 ? `rezerva ${formatNumber(scenario.reservePercent, 1)} %` : 'bez rezervy');
    setText('fuelCostResult', formatCurrency(scenario.fuelCost));
    setText('priceResult', `${formatCurrencyFine(scenario.price)}/l`);
    setText('perPersonResult', formatCurrency(scenario.perPerson));
    setText('peopleResult', peopleLabel);
    setText('baseFuelResult', liters(scenario.baseFuel));
    setText('reserveFuelResult', liters(scenario.reserveFuel));
    setText('extraResult', formatCurrency(scenario.extraCosts));

    const status = $('resultStatus');
    status.classList.remove('is-warning', 'is-error');
    if (scenario.mode === 'basic') {
      setText('statusTitle', 'Rychlý plán bez skrytých doplňků');
      setText('statusBadge', 'Basic odhad');
      setText('statusText', 'Výsledek používá tři základní údaje. Pro reálnou cestu zvažte návrat, rezervu a poplatky.');
    } else if (scenario.reservePercent > 30) {
      status.classList.add('is-warning');
      setText('statusTitle', 'Vysoká plánovací rezerva');
      setText('statusBadge', 'Zkontrolujte vstup');
      setText('statusText', 'Rezerva přesahuje 30 %. Může být záměrná, ale ověřte, zda už objížďky nejsou zahrnuté ve vzdálenosti.');
    } else {
      setText('statusTitle', scenario.sourceLabel.startsWith('z tankování') ? 'Spotřeba odvozena z tankování' : 'PRO scénář je rozpadnutý po položkách');
      setText('statusBadge', 'Kontrolovatelný model');
      setText('statusText', `Základní litry, rezerva a poplatky zůstávají oddělené. Použitá spotřeba: ${scenario.sourceLabel}.`);
    }

    setText('compareBaseFuel', liters(scenario.baseFuel));
    setText('compareReserveFuel', liters(scenario.reserveFuel));
    setText('compareFuelCost', formatCurrency(scenario.fuelCost));
    setText('compareTotalCost', formatCurrency(scenario.totalCost));
    setText('readingTitle', scenario.extraCosts > 0 ? 'Celkovou cenu netvoří jen palivo.' : 'Cesta má přehledný palivový rozpočet.');
    setText('readingText', `Pro ${distance(scenario.routeDistance)} při spotřebě ${consumptionText(scenario.consumption)} vychází ${liters(scenario.baseFuel)} základního paliva. Celkový model je ${formatCurrency(scenario.totalCost)}.`);
    setText('decisionConsumption', consumptionText(scenario.consumption));
    setText('decisionRoute', `${distance(scenario.routeDistance)} · ${scenario.directionLabel}`);
    setText('decisionPeople', peopleLabel);
    setText('decisionCostKm', costPerKmText(scenario.costPerKm));

    setText('heroCostKm', costPerKmText(scenario.costPerKm));
    setText('heroSummary', `${distance(scenario.routeDistance)} · ${consumptionText(scenario.consumption)} · ${formatCurrencyFine(scenario.price)}/l`);
    setText('heroDistance', distance(scenario.routeDistance));
    setText('heroFuel', liters(scenario.totalFuel));
    setText('heroTotal', formatCurrency(scenario.totalCost));
    $('heroRouteBar').style.width = `${clamp(scenario.routeDistance / 700 * 100, 18, 100)}%`;

    renderRows(scenario);
    renderComparison(scenario);
  }

  function renderInvalid(mode) {
    setText('resultMode', mode === 'pro' ? 'PRO' : 'Basic');
    setText('mainResult', 'Doplňte údaje');
    setText('mainSubResult', 'Výpočet čeká na platné vstupy');
    setText('resultSummary', 'Opravte zvýrazněnou hodnotu. Ostatní údaje zůstávají v prohlížeči.');
    const status = $('resultStatus');
    status.classList.remove('is-warning');
    status.classList.add('is-error');
    setText('statusTitle', 'Výpočet nebyl dokončen');
    setText('statusBadge', 'Neplatný vstup');
    setText('statusText', 'Alespoň jedna hodnota chybí nebo je mimo povolený rozsah.');
  }

  function calculate() {
    clearValidation();
    const scenario = activeMode === 'pro' ? getProScenario() : getBasicScenario();
    if (!scenario) {
      renderInvalid(activeMode);
      return null;
    }
    renderScenario(scenario);
    return scenario;
  }

  function setMode(mode) {
    activeMode = mode;
    document.body.dataset.mode = mode;
    $('calcBasic').hidden = mode !== 'basic';
    $('calcPro').hidden = mode !== 'pro';
    document.querySelectorAll('.vpc-mode__button').forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    calculate();
  }

  function setConsumptionSource() {
    const tank = readRadio('consumptionSource') === 'tank';
    $('knownFields').hidden = tank;
    $('tankFields').hidden = !tank;
    calculate();
  }

  function copyBasicToPro() {
    const basicDistance = parseNumber('basicDistance');
    const basicConsumption = parseNumber('basicConsumption');
    const basicPrice = parseNumber('basicPrice');
    if (Number.isFinite(basicDistance) && basicDistance > 0) $('proDistance').value = formatNumber(basicDistance, 2);
    if (Number.isFinite(basicConsumption) && basicConsumption > 0) $('proConsumption').value = formatNumber(basicConsumption, 2);
    if (Number.isFinite(basicPrice) && basicPrice >= 0) $('proPrice').value = formatNumber(basicPrice, 2);
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calculate();
  });

  document.querySelectorAll('.vpc-mode__button').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  document.querySelectorAll('[data-switch-pro]').forEach((button) => button.addEventListener('click', () => {
    copyBasicToPro();
    setMode('pro');
    $('calcPro').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  document.querySelectorAll('[data-switch-basic]').forEach((button) => button.addEventListener('click', () => setMode('basic')));

  document.querySelectorAll('[data-distance]').forEach((button) => button.addEventListener('click', () => {
    $('basicDistance').value = button.dataset.distance;
    document.querySelectorAll('[data-distance]').forEach((item) => item.classList.toggle('is-active', item === button));
    calculate();
  }));

  form.querySelectorAll('input').forEach((input) => input.addEventListener('input', calculate));
  form.querySelectorAll('input[name="direction"]').forEach((input) => input.addEventListener('change', calculate));
  form.querySelectorAll('input[name="consumptionSource"]').forEach((input) => input.addEventListener('change', setConsumptionSource));

  $('resetBasic').addEventListener('click', () => {
    $('basicDistance').value = '250';
    $('basicConsumption').value = '6,7';
    $('basicPrice').value = '38,90';
    document.querySelectorAll('[data-distance]').forEach((item) => item.classList.remove('is-active'));
    calculate();
  });

  $('resetPro').addEventListener('click', () => {
    $('proDistance').value = '250';
    $('proPrice').value = '38,90';
    $('proConsumption').value = '6,7';
    $('tankDistance').value = '520';
    $('tankLiters').value = '34,8';
    $('reservePercent').value = '10';
    $('extraCosts').value = '150';
    $('passengers').value = '2';
    $('compareConsumption').value = '8,0';
    form.querySelector('input[name="direction"][value="return"]').checked = true;
    form.querySelector('input[name="consumptionSource"][value="known"]').checked = true;
    setConsumptionSource();
  });

  $('copyResult').addEventListener('click', async () => {
    const scenario = calculate();
    if (!scenario) return;
    const text = `Cena cesty: ${formatCurrency(scenario.totalCost)} | ${costPerKmText(scenario.costPerKm)} | ${distance(scenario.routeDistance)} | ${liters(scenario.totalFuel)} paliva | ${consumptionText(scenario.consumption)}.`;
    try {
      await navigator.clipboard.writeText(text);
      setText('copyResult', 'Zkopírováno');
      window.setTimeout(() => setText('copyResult', 'Kopírovat výsledek'), 1600);
    } catch (_) {
      setText('copyResult', 'Kopírování se nezdařilo');
      window.setTimeout(() => setText('copyResult', 'Kopírovat výsledek'), 1800);
    }
  });

  $('printResult').addEventListener('click', () => window.print());

  setConsumptionSource();
  setMode('basic');
})();
