(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = { uiMode: 'basic', calcMode: 'arithmetic', weightedId: 0 };
  const form = $('averageForm');
  const numberList = $('numberList');
  const presets = {
    simple: { label: 'Jednoduchý příklad', values: '8; 10; 12; 14' },
    grades: { label: 'Známky', values: '1; 2; 2; 1; 3; 2' },
    measurements: { label: 'Měření', values: '19,98; 20,02; 20,01; 19,99; 20,03; 19,97' },
    expenses: { label: 'Výdaje', values: '18400; 17650; 19200; 18100; 20500; 17950' },
    outlier: { label: 'S extrémem', values: '10; 11; 12; 11; 10; 55' }
  };

  function parseNumber(value) {
    const normalized = String(value ?? '').trim().replace(/\u00a0/g, '').replace(/(?<=\d)\s(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
    if (!/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return NaN;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : NaN;
  }

  function tokenize(text) {
    const normalized = String(text ?? '')
      .replace(/\r/g, '\n')
      .replace(/,(?=\s|$)/g, ';')
      .replace(/\t/g, ';')
      .replace(/\n+/g, ';');
    const preliminary = normalized.split(';').flatMap((part) => {
      const trimmed = part.trim();
      if (!trimmed) return [];
      if (/\s/.test(trimmed) && !/^[-+]?\d{1,3}(?:\s\d{3})+(?:[,.]\d+)?$/.test(trimmed)) return trimmed.split(/\s+/);
      return [trimmed];
    });
    const valid = [], invalid = [];
    preliminary.forEach((token) => {
      const value = parseNumber(token);
      if (Number.isFinite(value)) valid.push(value); else invalid.push(token);
    });
    return { valid, invalid };
  }

  function format(value, maxDigits = null) {
    if (!Number.isFinite(value)) return '—';
    const setting = $('decimalPlaces').value;
    let digits = maxDigits;
    if (setting !== 'auto') digits = Number(setting);
    if (digits === null) {
      const abs = Math.abs(value);
      digits = Number.isInteger(value) ? 0 : abs >= 1000 ? 1 : abs >= 10 ? 2 : 3;
    }
    return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(value);
  }

  function sum(values) { return values.reduce((total, value) => total + value, 0); }
  function quantile(sorted, q) {
    if (!sorted.length) return NaN;
    const position = (sorted.length - 1) * q;
    const base = Math.floor(position);
    const rest = position - base;
    return sorted[base + 1] === undefined ? sorted[base] : sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  function median(values) { return quantile([...values].sort((a, b) => a - b), 0.5); }
  function weightedQuantile(entries, q) {
    const sorted = [...entries].filter((entry) => entry.weight > 0).sort((a, b) => a.value - b.value);
    const totalWeight = sum(sorted.map((entry) => entry.weight));
    if (!sorted.length || totalWeight <= 0) return NaN;
    const target = totalWeight * q;
    let cumulative = 0;
    for (const entry of sorted) {
      cumulative += entry.weight;
      if (cumulative >= target) return entry.value;
    }
    return sorted[sorted.length - 1].value;
  }

  function arithmeticStats(values) {
    const count = values.length;
    const total = sum(values);
    const mean = total / count;
    const sorted = [...values].sort((a, b) => a - b);
    const med = median(sorted);
    const min = sorted[0], max = sorted[sorted.length - 1];
    const sample = $('deviationMode').value === 'sample';
    const denominator = sample && count > 1 ? count - 1 : count;
    const variance = denominator > 0 ? sum(values.map((value) => (value - mean) ** 2)) / denominator : 0;
    return { values, count, total, mean, median: med, min, max, range: max - min, std: Math.sqrt(Math.max(0, variance)), q1: quantile(sorted, .25), q3: quantile(sorted, .75), weighted: false, weightTotal: count, sample };
  }

  function weightedStats(entries) {
    const usable = entries.filter((entry) => Number.isFinite(entry.value) && Number.isFinite(entry.weight) && entry.weight > 0);
    const weightTotal = sum(usable.map((entry) => entry.weight));
    const total = sum(usable.map((entry) => entry.value * entry.weight));
    const mean = total / weightTotal;
    const values = usable.map((entry) => entry.value);
    const variance = sum(usable.map((entry) => entry.weight * (entry.value - mean) ** 2)) / weightTotal;
    const min = Math.min(...values), max = Math.max(...values);
    return { values, entries: usable, count: usable.length, total, mean, median: weightedQuantile(usable, .5), min, max, range: max - min, std: Math.sqrt(Math.max(0, variance)), q1: weightedQuantile(usable, .25), q3: weightedQuantile(usable, .75), weighted: true, weightTotal, sample: false };
  }

  function getWeightedEntries() {
    return [...$('weightedRows').querySelectorAll('.weighted-row')].map((row) => ({
      value: parseNumber(row.querySelector('[data-role="value"]').value),
      weight: parseNumber(row.querySelector('[data-role="weight"]').value)
    }));
  }

  function setFeedback(validCount, invalid) {
    const box = $('inputFeedback');
    box.classList.remove('is-warning', 'is-error');
    if (validCount === 0) {
      box.classList.add('is-error');
      $('feedbackTitle').textContent = 'Zatím není co počítat';
      $('feedbackText').textContent = invalid.length ? `Nerozpoznané položky: ${invalid.slice(0, 3).join(', ')}.` : 'Vložte alespoň jednu číselnou hodnotu.';
    } else if (invalid.length) {
      box.classList.add('is-warning');
      $('feedbackTitle').textContent = `Načteno ${validCount} platných hodnot`;
      $('feedbackText').textContent = `Ignorované položky: ${invalid.slice(0, 3).join(', ')}${invalid.length > 3 ? '…' : ''}`;
    } else {
      $('feedbackTitle').textContent = `Načteno ${validCount} ${plural(validCount, 'hodnota', 'hodnoty', 'hodnot')}`;
      $('feedbackText').textContent = 'Všechny zadané položky jsou platná čísla.';
    }
  }

  function plural(number, one, few, many) { return number === 1 ? one : number >= 2 && number <= 4 ? few : many; }

  function outlierInfo(stats) {
    if (stats.count < 4 || !Number.isFinite(stats.q1) || !Number.isFinite(stats.q3)) return { count: 0, values: [] };
    const iqr = stats.q3 - stats.q1;
    if (iqr === 0) {
      const unusual = stats.values.filter((value) => value !== stats.median);
      return { count: unusual.length, values: unusual };
    }
    const low = stats.q1 - 1.5 * iqr, high = stats.q3 + 1.5 * iqr;
    const unusual = stats.values.filter((value) => value < low || value > high);
    return { count: unusual.length, values: unusual };
  }

  function renderInvalid(message) {
    $('averageValue').textContent = '—';
    $('resultSentence').textContent = message;
    ['medianValue', 'minMaxValue', 'stdValue', 'sumValue', 'rangeValue', 'countValue', 'coefficientValue'].forEach((id) => { $(id).textContent = '—'; });
    $('resultBadge').textContent = 'Chybí data';
    $('distributionSummary').textContent = 'Po zadání dat se zobrazí poloha průměru a mediánu.';
    $('decisionCard').className = 'decision-card is-warning';
    $('decisionKicker').textContent = 'Výpočet čeká na platná data';
    $('decisionTitle').textContent = 'Zkontrolujte vstupní hodnoty.';
    $('decisionText').textContent = 'Zadejte alespoň jednu hodnotu. Pro variabilitu a medián je užitečné mít více záznamů.';
  }

  function updateScale(stats) {
    const range = stats.max - stats.min;
    const meanPosition = range === 0 ? 50 : ((stats.mean - stats.min) / range) * 100;
    const medianPosition = range === 0 ? 50 : ((stats.median - stats.min) / range) * 100;
    $('meanMarker').style.left = `${Math.min(100, Math.max(0, meanPosition))}%`;
    $('medianMarker').style.left = `${Math.min(100, Math.max(0, medianPosition))}%`;
    $('scaleMin').textContent = format(stats.min);
    $('scaleMax').textContent = format(stats.max);
  }

  function renderDecision(stats) {
    const outliers = outlierInfo(stats);
    const card = $('decisionCard');
    card.className = 'decision-card';
    const meanMedianGap = stats.range > 0 ? Math.abs(stats.mean - stats.median) / stats.range : 0;
    const cv = stats.mean !== 0 ? Math.abs(stats.std / stats.mean) * 100 : NaN;
    if (outliers.count > 0) {
      card.classList.add('is-danger');
      $('decisionKicker').textContent = 'Zkontrolujte neobvyklou hodnotu';
      $('decisionTitle').textContent = `${outliers.count} ${plural(outliers.count, 'hodnota může', 'hodnoty mohou', 'hodnot může')} výrazně ovlivňovat průměr.`;
      $('decisionText').textContent = `Orientační kontrola označila ${outliers.values.slice(0, 3).map((value) => format(value)).join(', ')}${outliers.count > 3 ? '…' : ''}. Ověřte původ dat a porovnejte průměr s mediánem.`;
    } else if (meanMedianGap > .18) {
      card.classList.add('is-warning');
      $('decisionKicker').textContent = 'Průměr a medián se viditelně liší';
      $('decisionTitle').textContent = 'Soubor je pravděpodobně vychýlený na jednu stranu.';
      $('decisionText').textContent = 'Pro popis typické hodnoty zvažte vedle průměru také medián. Rozdíl může způsobovat několik vyšších nebo nižších záznamů.';
    } else if (Number.isFinite(cv) && cv > 25) {
      card.classList.add('is-warning');
      $('decisionKicker').textContent = 'Vyšší rozptýlení';
      $('decisionTitle').textContent = 'Jednotlivé hodnoty se od průměru výrazně liší.';
      $('decisionText').textContent = 'Průměr je matematicky správný, ale pro praktické rozhodnutí sledujte i minimum, maximum a konkrétní hodnoty.';
    } else {
      $('decisionKicker').textContent = 'Rychlá interpretace';
      $('decisionTitle').textContent = stats.range === 0 ? 'Všechny hodnoty jsou stejné.' : 'Průměr a medián si jsou blízko.';
      $('decisionText').textContent = stats.range === 0 ? 'Soubor nemá žádné rozptýlení. Průměr, medián, minimum i maximum jsou shodné.' : 'Výsledek není viditelně tažen jednou stranou souboru. Přesto jej čtěte společně s rozsahem a účelem dat.';
    }
  }

  function render({ scroll = false } = {}) {
    let stats;
    if (state.calcMode === 'weighted' && state.uiMode === 'advanced') {
      const entries = getWeightedEntries();
      const usable = entries.filter((entry) => Number.isFinite(entry.value) && Number.isFinite(entry.weight) && entry.weight > 0);
      if (!usable.length) { renderInvalid('Zadejte alespoň jednu platnou hodnotu s kladnou vahou.'); return false; }
      stats = weightedStats(entries);
    } else {
      const parsed = tokenize(numberList.value);
      setFeedback(parsed.valid.length, parsed.invalid);
      if (!parsed.valid.length) { renderInvalid('Vložte alespoň jednu platnou číselnou hodnotu.'); return false; }
      stats = arithmeticStats(parsed.valid);
    }
    if (!Number.isFinite(stats.mean)) { renderInvalid('Výsledek nelze z dostupných hodnot spočítat.'); return false; }

    const cv = stats.mean !== 0 ? Math.abs(stats.std / stats.mean) * 100 : NaN;
    $('resultTitle').textContent = stats.weighted ? 'Vážený průměr' : 'Aritmetický průměr';
    $('primaryLabel').textContent = stats.weighted ? 'Průměr po započtení vah' : 'Průměr zadaných čísel';
    $('averageValue').textContent = format(stats.mean);
    $('medianValue').textContent = format(stats.median);
    $('minMaxValue').textContent = `${format(stats.min)} / ${format(stats.max)}`;
    $('rangeValue').textContent = `rozsah ${format(stats.range)}`;
    $('stdValue').textContent = format(stats.std);
    $('stdLabel').textContent = stats.weighted ? 'vážená populační' : stats.sample ? 'výběrová' : 'celý soubor';
    $('sumValue').textContent = format(stats.total);
    $('countValue').textContent = stats.weighted ? `${stats.count} ${plural(stats.count, 'řádek', 'řádky', 'řádků')}, váha ${format(stats.weightTotal)}` : `${stats.count} ${plural(stats.count, 'hodnota', 'hodnoty', 'hodnot')}`;
    $('resultBadge').textContent = stats.weighted ? `součet vah ${format(stats.weightTotal)}` : `${stats.count} ${plural(stats.count, 'hodnota', 'hodnoty', 'hodnot')}`;
    $('resultSentence').textContent = stats.weighted ? `Součet hodnot násobených vahami ${format(stats.total)} dělený součtem vah ${format(stats.weightTotal)} dává ${format(stats.mean)}.` : `Součet ${format(stats.total)} dělený ${stats.count} ${plural(stats.count, 'hodnotou', 'hodnotami', 'hodnotami')} dává ${format(stats.mean)}.`;
    $('coefficientValue').textContent = Number.isFinite(cv) ? `CV ${format(cv, 1)} %` : 'CV nelze určit';
    const gap = Math.abs(stats.mean - stats.median);
    $('distributionSummary').textContent = gap < Math.max(.000001, stats.range * .05) ? 'Průměr a medián jsou téměř na stejném místě.' : `Průměr a medián se liší o ${format(gap)}.`;
    updateScale(stats);
    renderDecision(stats);
    if (scroll && matchMedia('(max-width:820px)').matches) $('vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
    return true;
  }

  function addWeightedRow(value = '', weight = '1') {
    state.weightedId += 1;
    const row = document.createElement('div');
    row.className = 'weighted-row';
    row.dataset.rowId = String(state.weightedId);
    const valueInput = document.createElement('input');
    valueInput.type = 'text'; valueInput.inputMode = 'decimal'; valueInput.autocomplete = 'off'; valueInput.dataset.role = 'value'; valueInput.value = value; valueInput.setAttribute('aria-label', `Hodnota řádku ${state.weightedId}`);
    const weightInput = document.createElement('input');
    weightInput.type = 'text'; weightInput.inputMode = 'decimal'; weightInput.autocomplete = 'off'; weightInput.dataset.role = 'weight'; weightInput.value = weight; weightInput.setAttribute('aria-label', `Váha řádku ${state.weightedId}`);
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'remove-row'; remove.textContent = '×'; remove.setAttribute('aria-label', 'Odstranit řádek');
    [valueInput, weightInput].forEach((input) => input.addEventListener('input', () => render()));
    remove.addEventListener('click', () => { row.remove(); if (!$('weightedRows').children.length) addWeightedRow('', '1'); render(); });
    row.append(valueInput, weightInput, remove);
    $('weightedRows').append(row);
  }

  function loadWeightedExample() {
    $('weightedRows').replaceChildren();
    addWeightedRow('80', '2');
    addWeightedRow('90', '3');
    addWeightedRow('100', '1');
  }

  function setUiMode(mode) {
    state.uiMode = mode;
    $('advancedPanel').hidden = mode !== 'advanced';
    document.querySelectorAll('[data-ui-mode]').forEach((button) => {
      const active = button.dataset.uiMode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (mode === 'basic') {
      state.calcMode = 'arithmetic';
      $('listEntry').hidden = false;
      $('calculatorTitle').textContent = 'Vložte čísla do jednoho pole.';
      $('calculatorIntro').textContent = 'Oddělte je středníkem, mezerou nebo novým řádkem. Výsledek se přepočítá automaticky.';
    } else {
      $('calculatorTitle').textContent = 'Zvolte běžný nebo vážený průměr.';
      $('calculatorIntro').textContent = 'Pokročilé možnosti jsou oddělené. Použijte je jen pro váhy, četnosti nebo přesnější nastavení variability.';
    }
    syncCalcMode();
  }

  function setCalcMode(mode) {
    if (state.uiMode !== 'advanced') return;
    state.calcMode = mode;
    syncCalcMode();
  }

  function syncCalcMode() {
    document.querySelectorAll('[data-calc-mode]').forEach((button) => {
      const active = button.dataset.calcMode === state.calcMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const weighted = state.uiMode === 'advanced' && state.calcMode === 'weighted';
    $('weightedEntry').hidden = !weighted;
    $('listEntry').hidden = weighted;
    render();
  }

  function setPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    numberList.value = preset.values;
    document.querySelectorAll('[data-preset]').forEach((button) => button.classList.toggle('is-active', button.dataset.preset === name));
    render();
  }

  async function copyResult() {
    const text = `${$('resultTitle').textContent}: ${$('averageValue').textContent}. Medián: ${$('medianValue').textContent}. Minimum / maximum: ${$('minMaxValue').textContent}. Směrodatná odchylka: ${$('stdValue').textContent}.`;
    try {
      await navigator.clipboard.writeText(text);
      $('copyResult').textContent = 'Zkopírováno';
      setTimeout(() => { $('copyResult').textContent = 'Kopírovat výsledek'; }, 1500);
    } catch {
      $('copyResult').textContent = 'Kopírování selhalo';
    }
  }

  function reset() {
    $('decimalPlaces').value = 'auto';
    $('deviationMode').value = 'population';
    loadWeightedExample();
    setUiMode('basic');
    setPreset('simple');
  }

  function bind() {
    form.addEventListener('submit', (event) => { event.preventDefault(); render({ scroll: true }); });
    numberList.addEventListener('input', () => render());
    document.querySelectorAll('[data-ui-mode]').forEach((button) => button.addEventListener('click', () => setUiMode(button.dataset.uiMode)));
    document.querySelectorAll('[data-calc-mode]').forEach((button) => button.addEventListener('click', () => setCalcMode(button.dataset.calcMode)));
    document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => setPreset(button.dataset.preset)));
    $('decimalPlaces').addEventListener('change', () => render());
    $('deviationMode').addEventListener('change', () => render());
    $('addWeightedRow').addEventListener('click', () => { addWeightedRow('', '1'); const rows = $('weightedRows').querySelectorAll('.weighted-row'); rows[rows.length - 1].querySelector('[data-role="value"]').focus(); });
    $('resetButton').addEventListener('click', reset);
    $('copyResult').addEventListener('click', copyResult);
  }

  function init() {
    loadWeightedExample();
    bind();
    setUiMode('basic');
    setPreset('simple');
  }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
