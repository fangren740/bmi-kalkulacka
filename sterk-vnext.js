(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const fmt1 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const fmt2 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt0 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const money = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });

  const profiles = {
    hm1632: {
      label: '16/32', source: 'Heidelberg Materials CZ', densityMin: 1.5, densityMax: 1.6,
      url: 'https://www.heidelbergmaterials.cz/cs/kamenivo/balene-kamenivo',
      sourceText: 'Heidelberg Materials CZ · veřejná reference pro kamenivo 16/32'
    },
    ks032: {
      label: '0/32', source: 'Kamenivo Suchomel · Luleč', densityMin: 1.8, densityMax: 1.8,
      url: 'https://www.kamenivo-suchomel.cz/produkt/pisky-drte-kameniva/kameniva-drcena/smes-drceneho-kameniva-0-32-z-lom-lulec-14725.htm',
      sourceText: 'Kamenivo Suchomel · orientační přepočet konkrétního produktu 0/32 z lomu Luleč'
    },
    ks063: {
      label: '0/63', source: 'Kamenivo Suchomel · Luleč', densityMin: 1.8, densityMax: 1.8,
      url: 'https://www.kamenivo-suchomel.cz/produkt/pisky-drte-kameniva/kameniva-drcena/smes-drceneho-kameniva-0-63-lom-lulec-5589.htm',
      sourceText: 'Kamenivo Suchomel · orientační přepočet konkrétního produktu 0/63 z lomu Luleč'
    },
    cemex48: { label: '4/8', source: 'vlastní převod', densityMin: 0, densityMax: 0, url: 'https://www.cemex.cz/produkty/kamenivo/sterk', sourceText: 'CEMEX uvádí frakci 4/8; pro tuny doplňte převod vašeho dodavatele' },
    cemex816: { label: '8/16', source: 'vlastní převod', densityMin: 0, densityMax: 0, url: 'https://www.cemex.cz/produkty/kamenivo/sterk', sourceText: 'CEMEX uvádí frakci 8/16; pro tuny doplňte převod vašeho dodavatele' },
    cemex3263: { label: '32/63', source: 'vlastní převod', densityMin: 0, densityMax: 0, url: 'https://www.cemex.cz/produkty/kamenivo/sterk', sourceText: 'CEMEX uvádí frakci 32/63; pro tuny doplňte převod vašeho dodavatele' },
    custom: { label: 'vlastní materiál', source: 'vlastní převod', densityMin: 0, densityMax: 0, url: '', sourceText: 'Doplňte převod t/m³ z vašeho ceníku, technického listu nebo od dodavatele' }
  };

  let mode = 'geometry';
  let suppressProfileUpdate = false;

  function n(id) {
    const v = Number.parseFloat($(id)?.value);
    return Number.isFinite(v) ? v : 0;
  }

  function clampPositive(value) { return Number.isFinite(value) && value > 0 ? value : 0; }

  function displayRange(min, max, digits = 1, unit = '') {
    if (!(min > 0) || !(max > 0)) return '—';
    const f = digits === 2 ? fmt2 : fmt1;
    if (Math.abs(max - min) < 1e-9) return `${f.format(min)}${unit}`;
    return `${f.format(min)}–${f.format(max)}${unit}`;
  }

  function tripsRange(minWeight, maxWeight, payload) {
    if (!(minWeight > 0) || !(maxWeight > 0) || !(payload > 0)) return { min: 0, max: 0 };
    return { min: Math.ceil(minWeight / payload), max: Math.ceil(maxWeight / payload) };
  }

  function tripLabel(min, max) {
    if (!min || !max) return '—';
    const suffix = (x) => x === 1 ? 'jízda' : (x >= 2 && x <= 4 ? 'jízdy' : 'jízd');
    if (min === max) return `${min} ${suffix(min)}`;
    return `${min}–${max} jízd`;
  }

  function currentPayload() {
    const preset = $('payloadPreset').value;
    return preset === 'custom' ? clampPositive(n('payloadCustom')) : clampPositive(Number.parseFloat(preset));
  }

  function projectGeometry() {
    if (mode === 'direct') {
      return { area: null, thickness: null, projectVolume: clampPositive(n('directVolume')) };
    }
    const thickness = clampPositive(n('thickness'));
    const geometryType = $('geometryType').value;
    let area = 0;
    if (geometryType === 'area') area = clampPositive(n('area'));
    else area = clampPositive(n('length')) * clampPositive(n('width'));
    return { area, thickness, projectVolume: area * (thickness / 100) };
  }

  function profile() { return profiles[$('materialProfile').value] || profiles.custom; }

  function setProfile(key) {
    const p = profiles[key] || profiles.custom;
    suppressProfileUpdate = true;
    $('densityMin').value = p.densityMin > 0 ? p.densityMin : '';
    $('densityMax').value = p.densityMax > 0 ? p.densityMax : '';
    suppressProfileUpdate = false;
    $('densitySourceText').textContent = p.sourceText;
    $('densitySourceLink').hidden = !p.url;
    if (p.url) $('densitySourceLink').href = p.url;
    $('densityWarning').hidden = p.densityMin > 0;
    calculate();
  }

  function calculate() {
    const g = projectGeometry();
    const reserve = Math.max(0, n('reservePct'));
    const orderVolume = g.projectVolume * (1 + reserve / 100);
    let densityMin = clampPositive(n('densityMin'));
    let densityMax = clampPositive(n('densityMax'));
    if (densityMin > 0 && densityMax > 0 && densityMin > densityMax) [densityMin, densityMax] = [densityMax, densityMin];
    const hasDensity = densityMin > 0 && densityMax > 0;
    const weightMin = hasDensity ? orderVolume * densityMin : 0;
    const weightMax = hasDensity ? orderVolume * densityMax : 0;
    const bagsMin = hasDensity ? Math.ceil(weightMin) : 0;
    const bagsMax = hasDensity ? Math.ceil(weightMax) : 0;
    const payload = currentPayload();
    const trips = tripsRange(weightMin, weightMax, payload);
    const p = profile();

    $('projectVolume').textContent = `${fmt2.format(g.projectVolume)} m³`;
    $('orderVolume').textContent = `${fmt2.format(orderVolume)} m³`;
    $('resultMaterialLabel').textContent = p.label;
    $('slipMaterial').textContent = p.label;
    $('slipSource').textContent = p.source;

    const densityWarning = $('densityWarning');
    densityWarning.hidden = hasDensity;

    if (hasDensity) {
      $('resultLeadLabel').textContent = 'Orientační hmotnost k objednání';
      $('resultWeight').textContent = displayRange(weightMin, weightMax, 1, ' t');
      $('resultExplain').textContent = `${fmt2.format(orderVolume)} m³ × ${displayRange(densityMin, densityMax, 2, ' t/m³')}`;
      $('bigBags').textContent = bagsMin === bagsMax ? `${bagsMax} ks` : `${bagsMin}–${bagsMax} ks`;
      $('truckTrips').textContent = tripLabel(trips.min, trips.max);
      $('slipWeight').textContent = displayRange(weightMin, weightMax, 1, ' t');
      $('slipTrips').textContent = tripLabel(trips.min, trips.max);
      $('orderStatus').textContent = 'připraveno k ověření';
    } else {
      $('resultLeadLabel').textContent = 'Objednávkový objem';
      $('resultWeight').textContent = `${fmt2.format(orderVolume)} m³`;
      $('resultExplain').textContent = 'Tuny dopočítáme po zadání převodu t/m³.';
      $('bigBags').textContent = '—';
      $('truckTrips').textContent = '—';
      $('slipWeight').textContent = `${fmt2.format(orderVolume)} m³`;
      $('slipTrips').textContent = 'po zadání t/m³';
      $('orderStatus').textContent = 'chybí převod t/m³';
    }

    if (mode === 'geometry') {
      $('slipGeometry').textContent = `${fmt1.format(g.area)} m² · ${fmt1.format(g.thickness)} cm`;
    } else {
      $('slipGeometry').textContent = `${fmt2.format(g.projectVolume)} m³ z projektu`;
    }
    $('slipVolume').textContent = `${fmt2.format(orderVolume)} m³ po rezervě`;
    $('slipPayload').textContent = payload > 0 ? `pracovní nosnost ${fmt1.format(payload)} t` : 'doplňte nosnost vozidla';

    const price = clampPositive(n('pricePerTon'));
    const delivery = clampPositive(n('deliveryPerTrip'));
    const costBox = $('costBox');
    if (hasDensity && (price > 0 || delivery > 0)) {
      const minCost = weightMin * price + trips.min * delivery;
      const maxCost = weightMax * price + trips.max * delivery;
      costBox.hidden = false;
      $('costResult').textContent = minCost === maxCost ? money.format(maxCost) : `${money.format(minCost)}–${money.format(maxCost)}`;
      $('costExplain').textContent = `${price > 0 ? `${fmt0.format(price)} Kč/t` : 'bez ceny materiálu'} + ${delivery > 0 ? `${fmt0.format(delivery)} Kč/jízdu` : 'bez ceny dopravy'}`;
    } else costBox.hidden = true;

    const geometryPart = mode === 'geometry'
      ? `Výpočet vychází z ${fmt1.format(g.area)} m², vrstvy ${fmt1.format(g.thickness)} cm, ${fmt1.format(reserve)} % rezervy`
      : `Výpočet vychází z projektového objemu ${fmt2.format(g.projectVolume)} m³ a ${fmt1.format(reserve)} % rezervy`;
    const weightPart = hasDensity
      ? ` a převodu ${displayRange(densityMin, densityMax, 2, ' t/m³')}`
      : '; převod t/m³ bude doplněn dodavatelem';
    $('orderSentence').textContent = hasDensity
      ? `Poptávám kamenivo ${p.label}, orientačně ${displayRange(weightMin, weightMax, 1, ' t')}. ${geometryPart}${weightPart}. Prosím o potvrzení převodu, dostupnosti, dopravy a vykládky.`
      : `Poptávám kamenivo ${p.label}, objednávkový objem ${fmt2.format(orderVolume)} m³. ${geometryPart}. Prosím o potvrzení převodu na tuny, dostupnosti, dopravy a vykládky.`;

    const error = $('formError');
    const validVolume = g.projectVolume > 0;
    if (!validVolume) {
      error.hidden = false;
      error.textContent = 'Zadejte kladnou plochu/rozměry a tloušťku nebo platný projektový objem.';
    } else if ($('payloadPreset').value === 'custom' && !(payload > 0)) {
      error.hidden = false;
      error.textContent = 'Zadejte kladnou vlastní nosnost vozidla.';
    } else {
      error.hidden = true;
      error.textContent = '';
    }
  }

  function setMode(next) {
    mode = next;
    document.querySelectorAll('.gr-mode button').forEach((button) => {
      const active = button.dataset.mode === next;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $('geometryPanel').hidden = next !== 'geometry';
    $('directPanel').hidden = next !== 'direct';
    calculate();
  }

  function setGeometryType() {
    const useArea = $('geometryType').value === 'area';
    $('dimensionsFields').hidden = useArea;
    $('areaField').hidden = !useArea;
    calculate();
  }

  function setPayload() {
    $('payloadCustomWrap').hidden = $('payloadPreset').value !== 'custom';
    calculate();
  }

  async function copyOrder() {
    const text = $('orderSentence').textContent;
    try {
      await navigator.clipboard.writeText(text);
      const button = $('copyOrder');
      const old = button.textContent;
      button.textContent = 'Zkopírováno';
      setTimeout(() => { button.textContent = old; }, 1400);
    } catch (_) {
      window.prompt('Zkopírujte text poptávky:', text);
    }
  }

  function init() {
    document.querySelectorAll('.gr-mode button').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
    $('geometryType').addEventListener('change', setGeometryType);
    $('materialProfile').addEventListener('change', () => setProfile($('materialProfile').value));
    $('payloadPreset').addEventListener('change', setPayload);
    $('copyOrder').addEventListener('click', copyOrder);
    $('printResult').addEventListener('click', () => window.print());
    $('menuToggle').addEventListener('click', () => {
      const open = $('mobileNav').classList.toggle('is-open');
      $('menuToggle').setAttribute('aria-expanded', String(open));
    });
    document.querySelectorAll('#gravelForm input, #gravelForm select').forEach((el) => el.addEventListener('input', () => {
      if ((el.id === 'densityMin' || el.id === 'densityMax') && !suppressProfileUpdate) {
        $('densitySourceText').textContent = 'Upraveno uživatelem · ověřte u konkrétního dodavatele';
      }
      calculate();
    }));
    setGeometryType();
    setPayload();
    setProfile('hm1632');
  }

  document.addEventListener('DOMContentLoaded', init);
})();
