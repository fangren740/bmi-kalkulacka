(() => {
  'use strict';

  const form = document.getElementById('concreteForm');
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const nf = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });
  const n1 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const money = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });

  const presets = {
    terrace: { shape: 'slab', slabLength: 5, slabWidth: 4, slabThickness: 12, reserve: 8 },
    garage: { shape: 'slab', slabLength: 6, slabWidth: 4, slabThickness: 15, reserve: 10 },
    strips: { shape: 'strip', stripLength: 48, stripWidth: 0.4, stripDepth: 80, reserve: 8 },
    footings: { shape: 'footing', footingCount: 8, footingLength: 0.6, footingWidth: 0.6, footingHeight: 0.8, reserve: 10 },
    columns: { shape: 'column', columnCount: 6, columnDiameter: 25, columnHeight: 2.5, reserve: 8 }
  };

  const number = (id, fallback = 0) => {
    const value = Number.parseFloat($(id)?.value);
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
  };
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const setOutput = (id, value) => { const el = $(id); if (el) el.value = value; };
  const roundUpTenth = (value) => Math.ceil((value - Number.EPSILON) * 10) / 10;

  function activeShape() {
    return form.querySelector('input[name="shape"]:checked')?.value || 'slab';
  }

  function switchShape() {
    const shape = activeShape();
    document.querySelectorAll('.shape-panel').forEach((panel) => {
      panel.classList.toggle('is-active', panel.dataset.shape === shape);
    });
  }

  function volumeFor(shape) {
    if (shape === 'strip') {
      return number('stripLength') * number('stripWidth') * (number('stripDepth') / 100 || number('stripDepth'));
    }
    if (shape === 'footing') {
      return number('footingCount') * number('footingLength') * number('footingWidth') * number('footingHeight');
    }
    if (shape === 'column') {
      const radius = number('columnDiameter') / 200;
      return number('columnCount') * Math.PI * radius * radius * number('columnHeight');
    }
    return number('slabLength') * number('slabWidth') * (number('slabThickness') / 100);
  }

  function shapeLabel(shape) {
    return { slab: 'deska', strip: 'základové pasy', footing: 'patky', column: 'sloupy' }[shape] || 'konstrukce';
  }

  function describe(shape) {
    if (shape === 'strip') return `${n1.format(number('stripLength'))} m × ${nf.format(number('stripWidth'))} m × ${nf.format(number('stripDepth') / 100)} m`;
    if (shape === 'footing') return `${nf.format(number('footingCount'))} ks × ${nf.format(number('footingLength'))} × ${nf.format(number('footingWidth'))} × ${nf.format(number('footingHeight'))} m`;
    if (shape === 'column') return `${nf.format(number('columnCount'))} ks × Ø ${nf.format(number('columnDiameter'))} cm × ${nf.format(number('columnHeight'))} m`;
    return `${nf.format(number('slabLength'))} m × ${nf.format(number('slabWidth'))} m × ${nf.format(number('slabThickness'))} cm`;
  }

  function recommendation(orderVolume) {
    if (orderVolume < 0.35) {
      return {
        status: 'Menší objem',
        title: 'Prověřte pytlovanou směs nebo malou dodávku',
        text: 'U takto malého množství může doprava transportbetonu tvořit velkou část ceny. Porovnejte cenu pytlované směsi, lokální malé betonárky a vlastní čas na míchání.'
      };
    }
    if (orderVolume < 1.2) {
      return {
        status: 'Hraniční objem',
        title: 'Porovnejte obě varianty včetně práce',
        text: 'Objem už znamená desítky pytlů a mnoho cyklů míchačky. Rozhodne přístup na stavbu, minimální odběr, doprava, čas a požadovaná rychlost betonáže.'
      };
    }
    return {
      status: 'Větší betonáž',
      title: 'Transportbeton bývá praktická výchozí varianta',
      text: 'Při větším objemu roste význam plynulé dodávky, stejnoměrnosti směsi a rychlosti ukládání. Ověřte kapacitu autodomíchávače, čekání, přístup a případné čerpadlo.'
    };
  }

  function calculate() {
    switchShape();
    const shape = activeShape();
    const netVolume = volumeFor(shape);
    const reservePct = number('reserve', 8);
    const reserveVolume = netVolume * reservePct / 100;
    const volumeWithReserve = netVolume + reserveVolume;
    const orderVolume = roundUpTenth(volumeWithReserve);
    const density = number('density', 2350);
    const weight = orderVolume * density;
    const yieldLitres = Math.max(0.1, number('bagYield', 12.5));
    const bagCount = Math.ceil(orderVolume * 1000 / yieldLitres);
    const mixerLitres = Math.max(1, number('mixerLitres', 100));
    const mixerBatches = Math.ceil(orderVolume * 1000 / mixerLitres);
    const readyPrice = number('readyPrice', 3500);
    const transport = number('transportPrice', 2500);
    const pump = number('pumpPrice', 0);
    const bagPrice = number('bagPrice', 135);
    const readyCost = orderVolume * readyPrice + transport + pump;
    const bagCost = bagCount * bagPrice;
    const rec = recommendation(orderVolume);

    const invalid = !Number.isFinite(netVolume) || netVolume <= 0;
    $('formError').hidden = !invalid;
    if (invalid) {
      $('formError').textContent = 'Zkontrolujte rozměry. Vypočtený objem musí být větší než nula.';
      return;
    }

    setText('resultStatus', rec.status);
    setText('resultVolume', `${n1.format(orderVolume)} m³`);
    setText('resultSentence', `Pro ${shapeLabel(shape)} o rozměrech ${describe(shape)} vychází čistý objem ${n1.format(netVolume)} m³. Po rezervě a zaokrouhlení je vhodné poptávat přibližně ${n1.format(orderVolume)} m³.`);
    setText('netVolume', `${n1.format(netVolume)} m³`);
    setText('reserveVolume', `${n1.format(reserveVolume)} m³`);
    setText('weightResult', `${nf.format(weight / 1000)} t`);
    setText('bagCount', `${nf.format(bagCount)} ks`);
    setText('mixerBatches', `${nf.format(mixerBatches)} dávek`);
    setText('readyCost', money.format(readyCost));
    setText('readyCostMetric', money.format(readyCost));
    setText('bagCost', money.format(bagCost));
    setText('recommendationTitle', rec.title);
    setText('recommendationText', rec.text);
    setText('summaryShape', shapeLabel(shape));
    setText('summaryDimensions', describe(shape));
    setText('summaryNet', `${n1.format(netVolume)} m³`);
    setText('summaryReserve', `${nf.format(reservePct)} % / ${n1.format(reserveVolume)} m³`);
    setText('summaryOrder', `${n1.format(orderVolume)} m³`);
    setText('summaryWeight', `${nf.format(weight / 1000)} t`);
    setText('summaryBags', `${nf.format(bagCount)} ks`);
    setText('summaryBatches', `${nf.format(mixerBatches)} dávek`);
    setText('summaryReadyCost', money.format(readyCost));
    setText('summaryBagCost', money.format(bagCost));

    const readyBar = $('readyBar');
    const bagBar = $('bagBar');
    const maxCost = Math.max(readyCost, bagCost, 1);
    if (readyBar) readyBar.style.width = `${Math.max(8, readyCost / maxCost * 100)}%`;
    if (bagBar) bagBar.style.width = `${Math.max(8, bagCost / maxCost * 100)}%`;

    const heroValue = document.querySelector('[data-hero-volume]');
    const heroBags = document.querySelector('[data-hero-bags]');
    const heroWeight = document.querySelector('[data-hero-weight]');
    if (heroValue) heroValue.textContent = `${n1.format(orderVolume)} m³`;
    if (heroBags) heroBags.textContent = `${nf.format(bagCount)} ks`;
    if (heroWeight) heroWeight.textContent = `${nf.format(weight / 1000)} t`;
  }

  function applyPreset(id) {
    const preset = presets[id];
    if (!preset) return;
    Object.entries(preset).forEach(([key, value]) => {
      if (key === 'shape') {
        const radio = form.querySelector(`input[name="shape"][value="${value}"]`);
        if (radio) radio.checked = true;
      } else if ($(key)) {
        $(key).value = value;
      }
    });
    document.querySelectorAll('[data-preset]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.preset === id)));
    calculate();
  }

  async function copyResult() {
    const text = [
      'Výpočet betonu – RychléVýpočty.cz',
      `Konstrukce: ${$('summaryShape').textContent}`,
      `Rozměry: ${$('summaryDimensions').textContent}`,
      `Čistý objem: ${$('summaryNet').textContent}`,
      `Rezerva: ${$('summaryReserve').textContent}`,
      `Doporučené množství k objednání: ${$('summaryOrder').textContent}`,
      `Orientační hmotnost: ${$('summaryWeight').textContent}`,
      `Pytlovaná směs: ${$('summaryBags').textContent}`
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setText('copyResult', 'Zkopírováno');
      setTimeout(() => setText('copyResult', 'Kopírovat výsledek'), 1600);
    } catch {
      window.prompt('Zkopírujte výsledek:', text);
    }
  }

  form.addEventListener('input', calculate);
  form.addEventListener('change', calculate);
  form.addEventListener('submit', (event) => { event.preventDefault(); calculate(); document.getElementById('vysledek')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
  $('resetBtn')?.addEventListener('click', () => { form.reset(); document.querySelectorAll('[data-preset]').forEach((b) => b.setAttribute('aria-pressed', 'false')); calculate(); });
  $('copyResult')?.addEventListener('click', copyResult);
  $('printResult')?.addEventListener('click', () => window.print());
  calculate();
})();
