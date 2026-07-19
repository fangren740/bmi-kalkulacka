(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const formatter = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });
  const integerFormatter = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const moneyFormatter = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const moneyPreciseFormatter = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const official2026 = {
    basePerKm: 5.90,
    petrol: 34.70,
    diesel: 42.10,
    ev: 7.20
  };

  const presets = {
    commute: {
      driveType: 'petrol', tripType: 'return', distance: 25, consumption: 6.5,
      energyPrice: 38.5, people: 1, tripExtras: 0
    },
    family: {
      driveType: 'petrol', tripType: 'return', distance: 120, consumption: 6.8,
      energyPrice: 38.5, people: 4, tripExtras: 300
    },
    business: {
      driveType: 'diesel', tripType: 'oneway', distance: 180, consumption: 5.7,
      energyPrice: 42.1, people: 1, tripExtras: 180
    },
    electric: {
      driveType: 'ev', tripType: 'return', distance: 100, consumption: 18.5,
      energyPrice: 6.5, people: 2, tripExtras: 0
    }
  };

  const driveConfig = {
    petrol: { label: 'Benzín', consumptionLabel: 'Reálná spotřeba', consumptionUnit: 'l/100 km', priceLabel: 'Cena benzínu', priceUnit: 'Kč/l', amountUnit: 'l' },
    diesel: { label: 'Diesel', consumptionLabel: 'Reálná spotřeba', consumptionUnit: 'l/100 km', priceLabel: 'Cena nafty', priceUnit: 'Kč/l', amountUnit: 'l' },
    ev: { label: 'Elektro', consumptionLabel: 'Spotřeba elektřiny', consumptionUnit: 'kWh/100 km', priceLabel: 'Cena nabíjení', priceUnit: 'Kč/kWh', amountUnit: 'kWh' }
  };

  function number(id, fallback = 0) {
    const element = $(id);
    if (!element) return fallback;
    const raw = String(element.value || '').replace(',', '.').trim();
    const value = Number(raw);
    return Number.isFinite(value) ? value : fallback;
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function setWidth(id, percentage) {
    const element = $(id);
    if (element) element.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
  }

  function formatMoney(value, precise = false) {
    return (precise ? moneyPreciseFormatter : moneyFormatter).format(Number.isFinite(value) ? value : 0);
  }

  function formatNumber(value, digits = 2) {
    if (!Number.isFinite(value)) return '0';
    return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: digits }).format(value);
  }

  function isChecked(id) {
    return Boolean($(id) && $(id).checked);
  }

  function getValues() {
    const driveType = $('driveType').value;
    const tripType = $('tripType').value;
    const distance = number('distance');
    const tripKm = distance * (tripType === 'return' ? 2 : 1);
    const consumption = number('consumption');
    const energyPrice = number('energyPrice');
    const people = Math.max(1, Math.round(number('people', 1)));
    const tripExtras = Math.max(0, number('tripExtras'));
    const includeOperating = isChecked('includeOperating');
    const useDetailedOperating = includeOperating && isChecked('useDetailedOperating');
    const annualKm = Math.max(1, number('annualKm', 15000));
    const manualOperatingPerKm = includeOperating ? Math.max(0, number('manualOperatingPerKm')) : 0;
    const detailedAnnualOperating = [
      'insuranceAnnual', 'serviceAnnual', 'tiresAnnual', 'roadFeesAnnual',
      'parkingAnnual', 'otherAnnual'
    ].reduce((sum, id) => sum + Math.max(0, number(id)), 0);
    const operatingPerKm = includeOperating
      ? (useDetailedOperating ? detailedAnnualOperating / annualKm : manualOperatingPerKm)
      : 0;
    const includeDepreciation = isChecked('includeDepreciation');
    const purchasePrice = Math.max(0, number('purchasePrice'));
    const resalePrice = Math.max(0, number('resalePrice'));
    const ownershipYears = Math.max(0.25, number('ownershipYears', 5));
    const acquisitionCosts = Math.max(0, number('acquisitionCosts'));
    const saleCosts = Math.max(0, number('saleCosts'));
    const valueLoss = includeDepreciation
      ? Math.max(0, purchasePrice + acquisitionCosts + saleCosts - resalePrice)
      : 0;
    const depreciationPerKm = includeDepreciation ? valueLoss / (annualKm * ownershipYears) : 0;
    const monthlyKm = Math.max(0, number('monthlyKm'));
    const reservePct = Math.max(0, Math.min(100, number('reservePct', 10)));
    const showLegalBenchmark = isChecked('showLegalBenchmark');

    return {
      driveType, tripType, distance, tripKm, consumption, energyPrice, people, tripExtras,
      includeOperating, useDetailedOperating, annualKm, manualOperatingPerKm,
      detailedAnnualOperating, operatingPerKm, includeDepreciation, purchasePrice,
      resalePrice, ownershipYears, acquisitionCosts, saleCosts, valueLoss,
      depreciationPerKm, monthlyKm, reservePct, showLegalBenchmark
    };
  }

  function calculate(values) {
    const energyPerKm = values.consumption / 100 * values.energyPrice;
    const energyAmount = values.tripKm * values.consumption / 100;
    const energyTrip = energyPerKm * values.tripKm;
    const operatingTrip = values.operatingPerKm * values.tripKm;
    const depreciationTrip = values.depreciationPerKm * values.tripKm;
    const basicTrip = energyTrip + values.tripExtras;
    const fullTrip = basicTrip + operatingTrip + depreciationTrip;
    const fullPerKm = values.tripKm > 0 ? fullTrip / values.tripKm : 0;
    const basicPerKm = values.tripKm > 0 ? basicTrip / values.tripKm : 0;
    const perPerson = fullTrip / values.people;
    const monthly = fullPerKm * values.monthlyKm;
    const reserve = fullTrip * values.reservePct / 100;
    const totalWithReserve = fullTrip + reserve;
    const officialEnergyPrice = official2026[values.driveType];
    const legalBenchmarkPerKm = official2026.basePerKm + values.consumption / 100 * officialEnergyPrice;
    const legalBenchmarkTrip = legalBenchmarkPerKm * values.tripKm;
    const scenarioLow = (values.consumption * 0.95 / 100 * values.energyPrice * 0.90 + values.operatingPerKm + values.depreciationPerKm) * values.tripKm + values.tripExtras;
    const scenarioHigh = (values.consumption * 1.10 / 100 * values.energyPrice * 1.15 + values.operatingPerKm + values.depreciationPerKm) * values.tripKm + values.tripExtras;
    const shares = {
      energy: fullTrip > 0 ? energyTrip / fullTrip * 100 : 0,
      operating: fullTrip > 0 ? operatingTrip / fullTrip * 100 : 0,
      depreciation: fullTrip > 0 ? depreciationTrip / fullTrip * 100 : 0,
      extras: fullTrip > 0 ? values.tripExtras / fullTrip * 100 : 0
    };
    const isPro = values.includeOperating || values.includeDepreciation;

    return {
      energyPerKm, energyAmount, energyTrip, operatingTrip, depreciationTrip, basicTrip,
      fullTrip, fullPerKm, basicPerKm, perPerson, monthly, reserve, totalWithReserve,
      legalBenchmarkPerKm, legalBenchmarkTrip, scenarioLow, scenarioHigh, shares, isPro
    };
  }

  function validate(values) {
    const problems = [];
    if (values.distance <= 0) problems.push('Zadejte vzdálenost větší než nula.');
    if (values.consumption <= 0) problems.push('Zadejte kladnou reálnou spotřebu.');
    if (values.energyPrice <= 0) problems.push('Zadejte kladnou cenu paliva nebo elektřiny.');
    if (values.people < 1) problems.push('Počet platících osob musí být alespoň jedna.');
    if (values.includeDepreciation && values.purchasePrice <= 0) problems.push('Pro ztrátu hodnoty zadejte pořizovací cenu.');
    if (values.includeDepreciation && values.resalePrice > values.purchasePrice + values.acquisitionCosts + values.saleCosts) {
      problems.push('Očekávaná prodejní cena je vyšší než vložená hodnota. Zkontrolujte scénář.');
    }
    return problems;
  }

  function renderDriveLabels(values) {
    const config = driveConfig[values.driveType];
    setText('consumptionLabel', config.consumptionLabel);
    setText('consumptionUnit', config.consumptionUnit);
    setText('energyPriceLabel', config.priceLabel);
    setText('energyPriceUnit', config.priceUnit);
    setText('energyAmountUnit', config.amountUnit);
    setText('resultDriveLabel', config.label);
  }

  function renderResult(values, result) {
    const config = driveConfig[values.driveType];
    const mainLabel = result.isPro ? 'Plná cena zadané cesty' : 'Cena cesty v BASIC režimu';
    const badge = result.isPro ? 'PRO · plný model' : 'BASIC · energie a poplatky';
    setText('mainResultLabel', mainLabel);
    setText('mainTripCost', formatMoney(result.fullTrip));
    setText('resultBadge', badge);
    setText('resultPerKm', `${formatMoney(result.fullPerKm, true)}/km`);
    setText('resultPerPerson', formatMoney(result.perPerson));
    setText('resultEnergyTrip', formatMoney(result.energyTrip));
    setText('resultEnergyAmount', formatNumber(result.energyAmount));
    setText('resultDistance', `${formatNumber(result.energyAmount)} ${config.amountUnit}`);
    setText('resultMonthly', values.monthlyKm > 0 ? formatMoney(result.monthly) : 'nezadáno');
    setText('resultReserve', formatMoney(result.reserve));
    setText('resultWithReserve', formatMoney(result.totalWithReserve));
    setText('resultFormula', `${formatNumber(values.tripKm, 1)} km × ${formatMoney(result.fullPerKm, true)}/km${values.tripExtras > 0 ? `, poplatky už zahrnuty` : ''}`);

    setText('breakdownEnergy', formatMoney(result.energyTrip));
    setText('breakdownExtras', formatMoney(values.tripExtras));
    setText('breakdownOperating', formatMoney(result.operatingTrip));
    setText('breakdownDepreciation', formatMoney(result.depreciationTrip));
    setText('breakdownTotal', formatMoney(result.fullTrip));
    setText('breakdownEnergyPerKm', `${formatMoney(result.energyPerKm, true)}/km`);
    setText('breakdownOperatingPerKm', `${formatMoney(values.operatingPerKm, true)}/km`);
    setText('breakdownDepreciationPerKm', `${formatMoney(values.depreciationPerKm, true)}/km`);

    setText('shareEnergy', `${formatNumber(result.shares.energy, 0)} %`);
    setText('shareOperating', `${formatNumber(result.shares.operating, 0)} %`);
    setText('shareDepreciation', `${formatNumber(result.shares.depreciation, 0)} %`);
    setText('shareExtras', `${formatNumber(result.shares.extras, 0)} %`);
    setWidth('shareEnergyBar', result.shares.energy);
    setWidth('shareOperatingBar', result.shares.operating);
    setWidth('shareDepreciationBar', result.shares.depreciation);
    setWidth('shareExtrasBar', result.shares.extras);

    setText('scenarioLow', formatMoney(result.scenarioLow));
    setText('scenarioBase', formatMoney(result.fullTrip));
    setText('scenarioHigh', formatMoney(result.scenarioHigh));
    const spread = Math.max(0, result.scenarioHigh - result.fullTrip);
    setText('scenarioSpread', formatMoney(spread));

    const benchmark = $('benchmarkCard');
    if (benchmark) benchmark.hidden = !values.showLegalBenchmark;
    setText('benchmarkPerKm', `${formatMoney(result.legalBenchmarkPerKm, true)}/km`);
    setText('benchmarkTrip', formatMoney(result.legalBenchmarkTrip));
    setText('benchmarkFuelPrice', `${formatMoney(official2026[values.driveType], true)}/${config.amountUnit}`);

    let title = 'Číslo je rychlý odhad energie a poplatků.';
    let text = 'Pro jednorázové rozdělení cesty může BASIC stačit. Pro cenu vlastního auta ale zatím chybí servis a ztráta hodnoty.';
    if (result.isPro && values.includeOperating && values.includeDepreciation) {
      title = 'Výsledek už ukazuje plnou ekonomickou cenu cesty.';
      text = 'Energie, provoz, poplatky i ztráta hodnoty používají stejný nájezd. Přesto jde o model, nikoli budoucí fakturu.';
    } else if (result.isPro && values.includeOperating) {
      title = 'Provoz je zahrnutý, ztráta hodnoty zatím ne.';
      text = 'Výsledek je vhodný pro rozpočet běžného používání. Pro porovnání vlastnictví přidejte také pokles hodnoty auta.';
    } else if (result.isPro && values.includeDepreciation) {
      title = 'Pokles hodnoty je zahrnutý, pravidelný provoz zatím ne.';
      text = 'Přidejte pojištění, servis a pneumatiky, pokud chcete plnou cenu vlastního auta za kilometr.';
    }
    setText('readingTitle', title);
    setText('readingText', text);

    setText('heroTripCost', formatMoney(result.fullTrip));
    setText('heroPerKm', `${formatMoney(result.fullPerKm, true)}/km`);
    setText('heroPerPerson', formatMoney(result.perPerson));
    setText('heroDistance', `${formatNumber(values.tripKm, 0)} km`);
    setWidth('heroRouteProgress', Math.min(100, Math.max(18, values.tripKm / 4)));
  }

  function renderError(problems) {
    const box = $('formError');
    if (!box) return;
    if (!problems.length) {
      box.hidden = true;
      box.textContent = '';
      return;
    }
    box.hidden = false;
    box.textContent = problems.join(' ');
  }

  function calculateAndRender() {
    const values = getValues();
    renderDriveLabels(values);
    const problems = validate(values);
    renderError(problems);
    if (problems.some((problem) => /vzdálenost|spotřebu|cenu paliva|Počet/.test(problem))) return;
    renderResult(values, calculate(values));
  }

  function setPressed(buttons, activeButton) {
    buttons.forEach((button) => {
      const active = button === activeButton;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function setDrive(type, shouldCalculate = true) {
    if (!driveConfig[type]) return;
    $('driveType').value = type;
    const buttons = $$('[data-drive]');
    setPressed(buttons, buttons.find((button) => button.dataset.drive === type));
    if (shouldCalculate) calculateAndRender();
  }

  function setTripType(type, shouldCalculate = true) {
    $('tripType').value = type === 'return' ? 'return' : 'oneway';
    const buttons = $$('[data-trip]');
    setPressed(buttons, buttons.find((button) => button.dataset.trip === $('tripType').value));
    if (shouldCalculate) calculateAndRender();
  }

  function setPreset(name) {
    const preset = presets[name] || presets.commute;
    setDrive(preset.driveType, false);
    setTripType(preset.tripType, false);
    ['distance', 'consumption', 'energyPrice', 'people', 'tripExtras'].forEach((key) => {
      if ($(key)) $(key).value = preset[key];
    });
    $$('[data-preset]').forEach((button) => {
      const active = button.dataset.preset === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    calculateAndRender();
  }

  function toggleDependentFields() {
    const includeOperating = isChecked('includeOperating');
    const detailed = includeOperating && isChecked('useDetailedOperating');
    const includeDepreciation = isChecked('includeDepreciation');
    const manual = $('manualOperatingFields');
    const detail = $('detailedOperatingFields');
    const depreciation = $('depreciationFields');
    if (manual) manual.hidden = !includeOperating || detailed;
    if (detail) detail.hidden = !detailed;
    if (depreciation) depreciation.hidden = !includeDepreciation;
  }

  function activateProTab(name) {
    const tabs = $$('[data-pro-tab]');
    const panels = $$('[data-pro-panel]');
    const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.dataset.proTab === name));
    tabs.forEach((tab, index) => {
      const active = index === activeIndex;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => { panel.hidden = panel.dataset.proPanel !== tabs[activeIndex].dataset.proTab; });
    setText('proStep', `${activeIndex + 1} / ${tabs.length}`);
    const previous = $('proPrev');
    const next = $('proNext');
    if (previous) previous.disabled = activeIndex === 0;
    if (next) next.textContent = activeIndex === tabs.length - 1 ? 'Hotovo' : 'Další krok';
  }

  function movePro(direction) {
    const tabs = $$('[data-pro-tab]');
    const current = Math.max(0, tabs.findIndex((tab) => tab.classList.contains('is-active')));
    const target = Math.max(0, Math.min(tabs.length - 1, current + direction));
    if (direction > 0 && current === tabs.length - 1) {
      $('proSettings').open = false;
      $('vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    activateProTab(tabs[target].dataset.proTab);
  }

  function resetAdvanced() {
    ['includeOperating', 'useDetailedOperating', 'includeDepreciation', 'showLegalBenchmark'].forEach((id) => {
      if ($(id)) $(id).checked = false;
    });
    const defaults = {
      manualOperatingPerKm: 1.60, annualKm: 15000, insuranceAnnual: 18000,
      serviceAnnual: 15000, tiresAnnual: 5000, roadFeesAnnual: 2500,
      parkingAnnual: 6000, otherAnnual: 4000, purchasePrice: 550000,
      resalePrice: 330000, ownershipYears: 5, acquisitionCosts: 10000,
      saleCosts: 8000, monthlyKm: 1500, reservePct: 10
    };
    Object.entries(defaults).forEach(([id, value]) => { if ($(id)) $(id).value = value; });
    toggleDependentFields();
  }

  const form = $('costKmForm');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calculateAndRender();
    $('vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('input', (event) => {
    if (event.target.matches('input, select')) {
      toggleDependentFields();
      calculateAndRender();
    }
  });
  form.addEventListener('change', (event) => {
    if (event.target.matches('input, select')) {
      toggleDependentFields();
      calculateAndRender();
    }
  });

  $$('[data-drive]').forEach((button) => button.addEventListener('click', () => setDrive(button.dataset.drive)));
  $$('[data-trip]').forEach((button) => button.addEventListener('click', () => setTripType(button.dataset.trip)));
  $$('[data-preset]').forEach((button) => button.addEventListener('click', () => setPreset(button.dataset.preset)));
  $$('[data-pro-tab]').forEach((button) => button.addEventListener('click', () => activateProTab(button.dataset.proTab)));
  $('proPrev').addEventListener('click', () => movePro(-1));
  $('proNext').addEventListener('click', () => movePro(1));
  $('resetBtn').addEventListener('click', () => {
    resetAdvanced();
    setPreset('commute');
    $('proSettings').open = false;
  });

  resetAdvanced();
  activateProTab('running');
  setPreset('commute');
})();
