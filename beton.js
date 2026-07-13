(() => {
  'use strict';

  const form = document.getElementById('concreteForm');
  if (!form) return;

  const byId = (id) => document.getElementById(id);
  const all = (selector, root = document) => [...root.querySelectorAll(selector)];
  const volumeFormat = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  const preciseVolumeFormat = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const numberFormat = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const decimalFormat = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });
  const moneyFormat = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });

  const presets = {
    terrace: { shape: 'slab', slabLength: 5, slabWidth: 4, slabThickness: 12, reserve: 8 },
    garage: { shape: 'slab', slabLength: 6, slabWidth: 4, slabThickness: 15, reserve: 10 },
    strips: { shape: 'strip', stripLength: 48, stripWidth: 0.4, stripDepth: 80, reserve: 8 },
    footings: { shape: 'footing', footingCount: 8, footingLength: 0.6, footingWidth: 0.6, footingHeight: 0.8, reserve: 10 }
  };

  let mode = 'basic';

  function readNumber(id, fallback = 0) {
    const input = byId(id);
    if (!input) return fallback;
    const normalized = String(input.value).trim().replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function setText(id, value) {
    const element = byId(id);
    if (element) element.textContent = value;
  }

  function activeShape() {
    return form.querySelector('input[name="shape"]:checked')?.value || 'slab';
  }

  function shapeName(shape) {
    return {
      slab: 'betonovou desku',
      strip: 'základové pasy',
      footing: 'betonové patky',
      column: 'válcové sloupy'
    }[shape] || 'konstrukci';
  }

  function shapeShortName(shape) {
    return { slab: 'deska', strip: 'základové pasy', footing: 'patky', column: 'sloupy' }[shape] || 'konstrukce';
  }

  function volumeFor(shape) {
    if (shape === 'strip') {
      return readNumber('stripLength') * readNumber('stripWidth') * (readNumber('stripDepth') / 100);
    }
    if (shape === 'footing') {
      return readNumber('footingCount') * readNumber('footingLength') * readNumber('footingWidth') * readNumber('footingHeight');
    }
    if (shape === 'column') {
      const radius = readNumber('columnDiameter') / 200;
      return readNumber('columnCount') * Math.PI * radius * radius * readNumber('columnHeight');
    }
    return readNumber('slabLength') * readNumber('slabWidth') * (readNumber('slabThickness') / 100);
  }

  function describeShape(shape) {
    if (shape === 'strip') {
      return `${volumeFormat.format(readNumber('stripLength'))} m × ${volumeFormat.format(readNumber('stripWidth'))} m × ${volumeFormat.format(readNumber('stripDepth') / 100)} m`;
    }
    if (shape === 'footing') {
      return `${numberFormat.format(readNumber('footingCount'))} ks × ${volumeFormat.format(readNumber('footingLength'))} × ${volumeFormat.format(readNumber('footingWidth'))} × ${volumeFormat.format(readNumber('footingHeight'))} m`;
    }
    if (shape === 'column') {
      return `${numberFormat.format(readNumber('columnCount'))} ks × Ø ${decimalFormat.format(readNumber('columnDiameter'))} cm × ${volumeFormat.format(readNumber('columnHeight'))} m`;
    }
    return `${volumeFormat.format(readNumber('slabLength'))} m × ${volumeFormat.format(readNumber('slabWidth'))} m × ${decimalFormat.format(readNumber('slabThickness'))} cm`;
  }

  function updateBlueprint(shape) {
    const x = document.querySelector('.measure-x');
    const y = document.querySelector('.measure-y');
    const z = document.querySelector('.measure-z');
    if (!x || !y || !z) return;

    if (shape === 'strip') {
      x.textContent = `${volumeFormat.format(readNumber('stripLength'))} m`;
      y.textContent = `${volumeFormat.format(readNumber('stripWidth'))} m`;
      z.textContent = `${decimalFormat.format(readNumber('stripDepth'))} cm`;
    } else if (shape === 'footing') {
      x.textContent = `${numberFormat.format(readNumber('footingCount'))} ks`;
      y.textContent = `${volumeFormat.format(readNumber('footingLength'))} × ${volumeFormat.format(readNumber('footingWidth'))} m`;
      z.textContent = `${volumeFormat.format(readNumber('footingHeight'))} m`;
    } else if (shape === 'column') {
      x.textContent = `${numberFormat.format(readNumber('columnCount'))} ks`;
      y.textContent = `Ø ${decimalFormat.format(readNumber('columnDiameter'))} cm`;
      z.textContent = `${volumeFormat.format(readNumber('columnHeight'))} m`;
    } else {
      x.textContent = `${volumeFormat.format(readNumber('slabLength'))} m`;
      y.textContent = `${volumeFormat.format(readNumber('slabWidth'))} m`;
      z.textContent = `${decimalFormat.format(readNumber('slabThickness'))} cm`;
    }
  }

  function setMode(nextMode, focus = false) {
    mode = nextMode === 'advanced' ? 'advanced' : 'basic';
    form.dataset.mode = mode;
    document.body.dataset.calculatorMode = mode;

    all('[data-mode]', form).forEach((button) => {
      if (!button.classList.contains('mode-button')) return;
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });

    const advancedPanel = byId('advancedCalculation');
    const advancedResults = document.querySelector('[data-advanced-result]');
    if (advancedPanel) advancedPanel.hidden = mode !== 'advanced';
    if (advancedResults) advancedResults.hidden = mode !== 'advanced';
    setText('modeResultBadge', mode === 'advanced' ? 'Rozšířený režim' : 'Základní režim');

    if (focus && mode === 'advanced') advancedPanel?.focus?.();
    calculate();
  }

  function switchShapePanels() {
    const shape = activeShape();
    all('.shape-panel', form).forEach((panel) => {
      const active = panel.dataset.shape === shape;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
    updateBlueprint(shape);
  }

  function roundUp(value, step) {
    const safeStep = Math.max(step, 0.001);
    return Math.ceil((value - Number.EPSILON) / safeStep) * safeStep;
  }

  function orderVolumeFor(netVolume, reservePercent) {
    const step = mode === 'advanced' ? Math.max(readNumber('roundingStep', 0.1), 0.01) : 0.1;
    const minimum = mode === 'advanced' ? Math.max(readNumber('minimumOrder', 0), 0) : 0;
    const withReserve = netVolume * (1 + reservePercent / 100);
    return Math.max(roundUp(withReserve, step), minimum);
  }

  function timeText(totalMinutes) {
    const minutes = Math.max(0, Math.round(totalMinutes));
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `${rest} min`;
    if (rest === 0) return `${hours} h`;
    return `${hours} h ${rest} min`;
  }

  function getRecommendation(orderVolume, readyCost, bagTotal) {
    if (orderVolume < 0.35) {
      return {
        status: 'Malý objem',
        title: 'U malého objemu nejprve prověřte pytlovanou směs',
        text: 'Doprava transportbetonu může tvořit velkou část ceny. Porovnejte materiál, minimální odběr, přístup a vlastní čas na míchání.'
      };
    }
    if (orderVolume < 1.2) {
      return {
        status: 'Hraniční objem',
        title: 'Tady rozhoduje hlavně logistika a hodnota práce',
        text: mode === 'advanced'
          ? `Rozšířený model porovnává zadané náklady. Levnější výsledek ale ještě nemusí být praktičtější pro souvislou betonáž.`
          : 'Přepněte do rozšířeného režimu a porovnejte pytle, vlastní míchání, dopravu a transportbeton.'
      };
    }
    const cheaper = readyCost <= bagTotal ? 'Transportbeton' : 'Pytlovaná směs';
    return {
      status: 'Souvislá betonáž',
      title: mode === 'advanced' ? `${cheaper} vychází v zadaném modelu lépe` : 'Transportbeton je praktická výchozí varianta',
      text: 'U většího objemu roste význam plynulé dodávky, stejnoměrnosti směsi, rychlosti ukládání, přístupu pro techniku a připravenosti lidí.'
    };
  }

  function validate(shape, netVolume) {
    const error = byId('formError');
    const activeInputs = all(`.shape-panel[data-shape="${shape}"] input`, form);
    all('input, select', form).forEach((input) => input.removeAttribute('aria-invalid'));

    const invalidInput = activeInputs.find((input) => {
      const value = readNumber(input.id, NaN);
      return !Number.isFinite(value) || value <= 0;
    });

    if (invalidInput || !Number.isFinite(netVolume) || netVolume <= 0) {
      if (invalidInput) invalidInput.setAttribute('aria-invalid', 'true');
      if (error) {
        error.hidden = false;
        error.textContent = 'Zkontrolujte rozměry zvolené konstrukce. Všechny používané hodnoty musí být větší než nula.';
      }
      return false;
    }

    if (mode === 'advanced' && (readNumber('bagYield') <= 0 || readNumber('mixerLitres') <= 0 || readNumber('density') <= 0)) {
      if (error) {
        error.hidden = false;
        error.textContent = 'V rozšířeném režimu musí být vydatnost pytle, dávka míchačky a objemová hmotnost větší než nula.';
      }
      return false;
    }

    if (error) error.hidden = true;
    return true;
  }

  function updateReserveControls(reservePercent) {
    setText('reserveControlValue', `${decimalFormat.format(reservePercent)} %`);
    all('[data-reserve]', form).forEach((button) => {
      button.classList.toggle('is-active', Number(button.dataset.reserve) === reservePercent);
    });
  }

  function calculate() {
    switchShapePanels();
    const shape = activeShape();
    const netVolume = volumeFor(shape);
    const reservePercent = Math.min(25, Math.max(0, readNumber('reserve', 8)));
    updateReserveControls(reservePercent);

    if (!validate(shape, netVolume)) return;

    const reserveVolume = netVolume * reservePercent / 100;
    const orderVolume = orderVolumeFor(netVolume, reservePercent);
    const additionalVolume = Math.max(0, orderVolume - netVolume);
    const density = Math.max(1, readNumber('density', 2350));
    const litres = orderVolume * 1000;
    const weightKg = orderVolume * density;

    const bagYield = Math.max(0.1, readNumber('bagYield', 12.5));
    const bagCount = Math.ceil(litres / bagYield);
    const bagPrice = Math.max(0, readNumber('bagPrice', 135));
    const bagMaterialCost = bagCount * bagPrice;

    const mixerLitres = Math.max(1, readNumber('mixerLitres', 100));
    const mixerBatches = Math.ceil(litres / mixerLitres);
    const minutesPerBatch = Math.max(0, readNumber('minutesPerBatch', 8));
    const mixingMinutes = mixerBatches * minutesPerBatch;
    const labourRate = Math.max(0, readNumber('labourRate', 300));
    const labourCost = mixingMinutes / 60 * labourRate;
    const mixingExtras = Math.max(0, readNumber('mixingExtras', 0));
    const bagTotalCost = bagMaterialCost + labourCost + mixingExtras;

    const readyPrice = Math.max(0, readNumber('readyPrice', 3500));
    const transportPrice = Math.max(0, readNumber('transportPrice', 2500));
    const pumpPrice = Math.max(0, readNumber('pumpPrice', 0));
    const readyCost = orderVolume * readyPrice + transportPrice + pumpPrice;
    const difference = Math.abs(readyCost - bagTotalCost);
    const readyWins = readyCost <= bagTotalCost;
    const recommendation = getRecommendation(orderVolume, readyCost, bagTotalCost);

    const minimumOrder = mode === 'advanced' ? Math.max(0, readNumber('minimumOrder', 0)) : 0;
    const minimumNote = minimumOrder > netVolume * (1 + reservePercent / 100)
      ? ` Výsledek navyšuje zadaný minimální účtovaný objem ${volumeFormat.format(minimumOrder)} m³.`
      : '';

    setText('resultStatus', recommendation.status);
    setText('resultVolume', `${volumeFormat.format(orderVolume)} m³`);
    setText('resultSentence', `Pro ${shapeName(shape)} o rozměrech ${describeShape(shape)} vychází čistý objem ${preciseVolumeFormat.format(netVolume)} m³. Po ${decimalFormat.format(reservePercent)}% rezervě a zaokrouhlení objednejte přibližně ${volumeFormat.format(orderVolume)} m³.${minimumNote}`);
    setText('netVolume', `${preciseVolumeFormat.format(netVolume)} m³`);
    setText('reserveVolume', `${preciseVolumeFormat.format(reserveVolume)} m³`);
    setText('reservePercentMetric', `${decimalFormat.format(reservePercent)} % z čistého objemu`);
    setText('litresResult', `${numberFormat.format(litres)} l`);
    setText('weightResult', `${volumeFormat.format(weightKg / 1000)} t`);
    setText('netVolumeLegend', `${preciseVolumeFormat.format(netVolume)} m³`);
    setText('reserveVolumeLegend', `${preciseVolumeFormat.format(additionalVolume)} m³`);

    const netBar = byId('netVolumeBar');
    const reserveBar = byId('reserveVolumeBar');
    const netShare = orderVolume > 0 ? Math.min(100, netVolume / orderVolume * 100) : 0;
    if (netBar) netBar.style.width = `${netShare}%`;
    if (reserveBar) reserveBar.style.width = `${Math.max(0, 100 - netShare)}%`;

    [5, 8, 10, 15].forEach((scenarioReserve) => {
      const step = mode === 'advanced' ? Math.max(readNumber('roundingStep', 0.1), 0.01) : 0.1;
      const minimum = mode === 'advanced' ? Math.max(readNumber('minimumOrder', 0), 0) : 0;
      const scenarioVolume = Math.max(roundUp(netVolume * (1 + scenarioReserve / 100), step), minimum);
      setText(`scenario${scenarioReserve}`, `${volumeFormat.format(scenarioVolume)} m³`);
    });
    all('.scenario-grid > div').forEach((card) => card.classList.remove('is-current'));
    const scenarioIndex = [5, 8, 10, 15].indexOf(reservePercent);
    if (scenarioIndex >= 0) all('.scenario-grid > div')[scenarioIndex]?.classList.add('is-current');

    setText('bagCount', `${numberFormat.format(bagCount)} ks`);
    setText('bagYieldNote', `${decimalFormat.format(bagYield)} l / pytel`);
    setText('mixerBatches', numberFormat.format(mixerBatches));
    setText('mixerCapacityNote', `${numberFormat.format(mixerLitres)} l / dávka`);
    setText('mixingTime', timeText(mixingMinutes));
    setText('labourCost', moneyFormat.format(labourCost));
    setText('readyCost', moneyFormat.format(readyCost));
    setText('bagCost', moneyFormat.format(bagTotalCost));
    setText('costWinner', readyWins ? 'Transportbeton vychází levněji' : 'Pytlovaná směs vychází levněji');
    setText('costDifference', `o ${moneyFormat.format(difference)}`);
    setText('readyCostDetail', `${volumeFormat.format(orderVolume)} m³ × ${moneyFormat.format(readyPrice)} + doprava a služby`);
    setText('bagCostDetail', `${numberFormat.format(bagCount)} pytlů + ${timeText(mixingMinutes)} práce`);

    const maxCost = Math.max(readyCost, bagTotalCost, 1);
    const readyBar = byId('readyBar');
    const bagBar = byId('bagBar');
    if (readyBar) readyBar.style.width = `${Math.max(5, readyCost / maxCost * 100)}%`;
    if (bagBar) bagBar.style.width = `${Math.max(5, bagTotalCost / maxCost * 100)}%`;

    setText('recommendationTitle', recommendation.title);
    setText('recommendationText', recommendation.text);

    setText('summaryShape', shapeShortName(shape));
    setText('summaryDimensions', describeShape(shape));
    setText('summaryNet', `${preciseVolumeFormat.format(netVolume)} m³`);
    setText('summaryReserve', `${decimalFormat.format(reservePercent)} % / ${preciseVolumeFormat.format(reserveVolume)} m³`);
    setText('summaryOrder', `${volumeFormat.format(orderVolume)} m³`);
    setText('summaryWeight', `${volumeFormat.format(weightKg / 1000)} t`);
    setText('summaryBags', `${numberFormat.format(bagCount)} ks`);
    setText('summaryBatches', `${numberFormat.format(mixerBatches)} dávek / ${timeText(mixingMinutes)}`);
    setText('summaryReadyCost', moneyFormat.format(readyCost));
    setText('summaryBagCost', `${moneyFormat.format(bagTotalCost)} včetně práce`);

    document.querySelectorAll('[data-hero-volume]').forEach((element) => { element.textContent = `${volumeFormat.format(orderVolume)} m³`; });
    document.querySelectorAll('[data-hero-net]').forEach((element) => { element.textContent = `${preciseVolumeFormat.format(netVolume)} m³`; });
    document.querySelectorAll('[data-hero-weight]').forEach((element) => { element.textContent = `${volumeFormat.format(weightKg / 1000)} t`; });
    updateBlueprint(shape);
  }

  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    Object.entries(preset).forEach(([key, value]) => {
      if (key === 'shape') {
        const radio = form.querySelector(`input[name="shape"][value="${value}"]`);
        if (radio) radio.checked = true;
      } else {
        const input = byId(key);
        if (input) input.value = String(value);
      }
    });
    all('[data-preset]', form).forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.preset === name)));
    calculate();
  }

  async function copyResult() {
    const lines = [
      'Kalkulačka betonu – RychléVýpočty.cz',
      `Režim: ${mode === 'advanced' ? 'rozšířený' : 'základní'}`,
      `Konstrukce: ${byId('summaryShape')?.textContent || ''}`,
      `Rozměry: ${byId('summaryDimensions')?.textContent || ''}`,
      `Čistý objem: ${byId('summaryNet')?.textContent || ''}`,
      `Rezerva: ${byId('summaryReserve')?.textContent || ''}`,
      `Množství k objednání: ${byId('summaryOrder')?.textContent || ''}`,
      `Orientační hmotnost: ${byId('summaryWeight')?.textContent || ''}`
    ];
    if (mode === 'advanced') {
      lines.push(`Pytlovaná směs: ${byId('summaryBags')?.textContent || ''}`);
      lines.push(`Míchání: ${byId('summaryBatches')?.textContent || ''}`);
      lines.push(`Transportbeton: ${byId('summaryReadyCost')?.textContent || ''}`);
      lines.push(`Pytle včetně práce: ${byId('summaryBagCost')?.textContent || ''}`);
    }
    const text = lines.join('\n');
    const button = byId('copyResult');
    try {
      await navigator.clipboard.writeText(text);
      if (button) button.textContent = 'Zkopírováno';
      window.setTimeout(() => { if (button) button.textContent = 'Kopírovat výsledek'; }, 1500);
    } catch {
      window.prompt('Zkopírujte výsledek:', text);
    }
  }

  all('.mode-button', form).forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  all('input[name="shape"]', form).forEach((input) => input.addEventListener('change', calculate));
  all('[data-preset]', form).forEach((button) => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
  all('[data-reserve]', form).forEach((button) => button.addEventListener('click', () => {
    const reserveInput = byId('reserve');
    if (reserveInput) reserveInput.value = button.dataset.reserve;
    calculate();
  }));

  form.addEventListener('input', calculate);
  form.addEventListener('change', calculate);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calculate();
    if (window.matchMedia('(max-width: 1030px)').matches) byId('vysledek')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  byId('resetBtn')?.addEventListener('click', () => {
    form.reset();
    all('[data-preset]', form).forEach((button) => button.setAttribute('aria-pressed', 'false'));
    setMode('basic');
  });
  byId('copyResult')?.addEventListener('click', copyResult);
  byId('printResult')?.addEventListener('click', () => window.print());

  setMode('basic');
})();
