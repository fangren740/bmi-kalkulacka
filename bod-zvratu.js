(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const form = $('breakEvenForm');
  const fields = {
    price: $('sellingPrice'),
    variable: $('variableCost'),
    fixed: $('fixedCosts'),
    period: $('periodLabel'),
    plan: $('plannedSales'),
    target: $('targetProfit'),
    capacity: $('capacity'),
    unit: $('unitLabel')
  };
  const state = { mode: 'basic' };
  const presets = {
    product: { price: 1200, variable: 450, fixed: 180000, plan: 300, target: 50000, capacity: 360, unit: 'ks', period: 'měsíc' },
    service: { price: 18000, variable: 3500, fixed: 145000, plan: 14, target: 80000, capacity: 18, unit: 'zakázek', period: 'měsíc' },
    gastro: { price: 195, variable: 72, fixed: 310000, plan: 3200, target: 90000, capacity: 4200, unit: 'porcí', period: 'měsíc' },
    eshop: { price: 890, variable: 510, fixed: 125000, plan: 450, target: 60000, capacity: 650, unit: 'objednávek', period: 'měsíc' }
  };

  const parseNumber = (value) => {
    const cleaned = String(value ?? '').trim().replace(/\s+/g, '').replace(',', '.').replace(/[^0-9.+-]/g, '');
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : NaN;
  };
  const format = (number, max = 0, min = 0) => new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: min, maximumFractionDigits: max }).format(Number.isFinite(number) ? number : 0);
  const money = (number, max = 0) => `${format(number, max)} Kč`;
  const roundUnits = (number) => Math.ceil(number - 1e-12);
  const unitLabel = () => fields.unit.value || 'ks';
  const singularUnit = () => ({ ks: 'kus', objednávek: 'objednávku', zakázek: 'zakázku', porcí: 'porci', hodin: 'hodinu', návštěv: 'návštěvu' }[unitLabel()] || 'jednotku');
  const periodText = () => ({ měsíc: 'za měsíc', rok: 'za rok', projekt: 'za projekt', sezónu: 'za sezónu' }[fields.period.value] || 'za období');
  const setError = (field, message) => {
    const holder = field.closest('.field');
    if (holder) holder.classList.toggle('has-error', Boolean(message));
    const error = $(`${field.id}Error`);
    if (error) error.textContent = message || '';
  };
  const deltaText = (value) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${format(Math.abs(value))} ${unitLabel()}`;

  function validate() {
    const data = {
      price: parseNumber(fields.price.value),
      variable: parseNumber(fields.variable.value),
      fixed: parseNumber(fields.fixed.value),
      plan: parseNumber(fields.plan.value),
      target: parseNumber(fields.target.value),
      capacity: parseNumber(fields.capacity.value)
    };
    let valid = true;
    const priceMessage = !Number.isFinite(data.price) || data.price <= 0 ? 'Zadejte cenu větší než 0.' : '';
    setError(fields.price, priceMessage); if (priceMessage) valid = false;
    const variableMessage = !Number.isFinite(data.variable) || data.variable < 0 ? 'Náklad nesmí být záporný.' : Number.isFinite(data.price) && data.variable >= data.price ? 'Variabilní náklad musí být nižší než prodejní cena.' : '';
    setError(fields.variable, variableMessage); if (variableMessage) valid = false;
    const fixedMessage = !Number.isFinite(data.fixed) || data.fixed < 0 ? 'Fixní náklady nesmí být záporné.' : '';
    setError(fields.fixed, fixedMessage); if (fixedMessage) valid = false;
    if (state.mode === 'advanced') {
      const planMessage = !Number.isFinite(data.plan) || data.plan < 0 ? 'Plánovaný prodej nesmí být záporný.' : '';
      setError(fields.plan, planMessage); if (planMessage) valid = false;
      const targetMessage = !Number.isFinite(data.target) || data.target < 0 ? 'Cílový zisk nesmí být záporný.' : '';
      setError(fields.target, targetMessage); if (targetMessage) valid = false;
      const capacityMessage = !Number.isFinite(data.capacity) || data.capacity <= 0 ? 'Kapacita musí být větší než 0.' : '';
      setError(fields.capacity, capacityMessage); if (capacityMessage) valid = false;
    } else {
      setError(fields.plan, ''); setError(fields.target, ''); setError(fields.capacity, '');
    }
    return { ...data, valid };
  }

  function renderInvalid() {
    $('resultBadge').textContent = 'Opravte vstupy';
    $('breakEvenUnitsResult').textContent = '—';
    $('heroBreakEvenUnits').textContent = '—';
    ['breakEvenRevenueResult','unitContributionResult','fixedCostsResult','exactBreakEvenResult'].forEach(id => $(id).textContent = '—');
    $('decisionCard').className = 'decision-card is-danger';
    $('decisionLabel').textContent = 'Výpočet nelze dokončit';
    $('decisionTitle').textContent = 'Cena musí být vyšší než variabilní náklad';
    $('decisionText').textContent = 'Jinak každá další prodaná jednotka ztrátu zvětšuje a konečný bod zvratu neexistuje.';
  }

  function scenarioUnits(fixed, price, variable) {
    const contribution = price - variable;
    return contribution > 0 ? roundUnits(fixed / contribution) : Infinity;
  }

  function calculate() {
    const data = validate();
    if (!data.valid) { renderInvalid(); return; }
    const contribution = data.price - data.variable;
    const contributionRate = contribution / data.price * 100;
    const exactBreakEven = data.fixed / contribution;
    const breakEvenUnits = roundUnits(exactBreakEven);
    const breakEvenRevenue = exactBreakEven * data.price;
    const unit = unitLabel();
    const period = periodText();

    $('resultBadge').textContent = 'Spočítáno';
    $('resultTitle').textContent = 'Hranice nuly';
    $('breakEvenUnitsResult').textContent = `${format(breakEvenUnits)} ${unit}`;
    $('answerPeriod').textContent = period;
    $('breakEvenRevenueResult').textContent = money(breakEvenRevenue);
    $('unitContributionResult').textContent = money(contribution, 2);
    $('contributionRateResult').textContent = `${format(contributionRate, 1)} % z ceny`;
    $('fixedCostsResult').textContent = money(data.fixed);
    $('exactBreakEvenResult').textContent = `${format(exactBreakEven, 2, 2)} ${unit}`;
    $('inlineContribution').textContent = money(contribution, 2);
    $('inlineContributionNote').textContent = `Z každé ${singularUnit()} jde ${format(contributionRate, 1)} % ceny na režii a zisk.`;

    $('heroBreakEvenUnits').textContent = `${format(breakEvenUnits)} ${unit}`;
    $('heroPeriod').textContent = period;
    $('heroRevenue').textContent = money(breakEvenRevenue);
    $('heroContribution').textContent = money(contribution, 2);
    $('heroMargin').textContent = `${format(contributionRate, 1)} %`;
    $('heroMarginBar').style.width = `${Math.max(0, Math.min(100, contributionRate))}%`;
    $('heroAnswerNote').textContent = `Každá další ${singularUnit()} nad hranicí přidává přibližně ${money(contribution, 2)} k výsledku.`;

    $('decisionCard').className = 'decision-card';
    $('decisionLabel').textContent = 'Co výsledek znamená';
    $('decisionTitle').textContent = `${format(breakEvenUnits)}. prodej pokryje všechny náklady`;
    $('decisionText').textContent = `V bodu zvratu je zisk přesně nula. Pro bezpečný plán potřebujete prodej nad ${format(breakEvenUnits)} ${unit} a prostor pro slevy, vratky nebo slabší období.`;

    const priceDown = scenarioUnits(data.fixed, data.price * .95, data.variable);
    const costUp = scenarioUnits(data.fixed, data.price, data.variable * 1.10);
    const fixedUp = scenarioUnits(data.fixed * 1.15, data.price, data.variable);
    const priceUp = scenarioUnits(data.fixed, data.price * 1.05, data.variable);
    const scenarios = [
      ['scenarioPriceDown','scenarioPriceDownDelta',priceDown],
      ['scenarioCostUp','scenarioCostUpDelta',costUp],
      ['scenarioFixedUp','scenarioFixedUpDelta',fixedUp],
      ['scenarioPriceUp','scenarioPriceUpDelta',priceUp]
    ];
    scenarios.forEach(([valueId, deltaId, value]) => {
      $(valueId).textContent = Number.isFinite(value) ? `${format(value)} ${unit}` : 'Bod zvratu nevznikne';
      $(deltaId).textContent = Number.isFinite(value) ? deltaText(value - breakEvenUnits) : 'záporný příspěvek';
    });

    if (state.mode === 'advanced') {
      const plannedProfit = data.plan * contribution - data.fixed;
      const safetyUnits = data.plan - exactBreakEven;
      const safetyPercent = data.plan > 0 ? safetyUnits / data.plan * 100 : 0;
      const targetExact = (data.fixed + data.target) / contribution;
      const targetUnits = roundUnits(targetExact);
      const targetRevenue = targetUnits * data.price;
      const capacityUse = data.capacity > 0 ? targetUnits / data.capacity * 100 : 0;

      $('plannedProfitResult').textContent = money(plannedProfit);
      $('plannedProfitNote').textContent = `Při prodeji ${format(data.plan)} ${unit}.`;
      $('safetyMarginResult').textContent = `${format(safetyPercent, 1)} %`;
      $('safetyMarginNote').textContent = `${safetyUnits >= 0 ? 'Plán je o' : 'Do bodu zvratu chybí'} ${format(Math.abs(safetyUnits), 1)} ${unit}.`;
      $('targetUnitsResult').textContent = `${format(targetUnits)} ${unit}`;
      $('targetRevenueResult').textContent = `Obrat ${money(targetRevenue)}.`;
      $('capacityUseResult').textContent = `${format(capacityUse, 1)} %`;
      $('capacityUseNote').textContent = targetUnits <= data.capacity ? 'Cíl se do zadané kapacity vejde.' : `Cíl překračuje kapacitu o ${format(targetUnits - data.capacity)} ${unit}.`;
      $('plannedUnit').textContent = unit;
      $('capacityUnit').textContent = unit;

      if (data.plan < exactBreakEven) {
        $('decisionCard').className = 'decision-card is-danger';
        $('decisionLabel').textContent = 'Plán je pod hranicí';
        $('decisionTitle').textContent = `Chybí přibližně ${format(exactBreakEven - data.plan, 1)} ${unit}`;
        $('decisionText').textContent = `Při zadaném plánu vzniká výsledek ${money(plannedProfit)}. Nejdřív ověřte cenu, přímé náklady a realistický objem prodeje.`;
      } else if (safetyPercent < 10) {
        $('decisionCard').className = 'decision-card';
        $('decisionLabel').textContent = 'Těsně nad bodem zvratu';
        $('decisionTitle').textContent = `Rezerva je pouze ${format(safetyPercent, 1)} %`;
        $('decisionText').textContent = 'Malý pokles prodeje nebo růst nákladů může plán vrátit do ztráty. Stress test níže ukazuje citlivost.';
      } else {
        $('decisionCard').className = 'decision-card is-good';
        $('decisionLabel').textContent = 'Plán je nad hranicí';
        $('decisionTitle').textContent = `Bezpečnostní rezerva ${format(safetyPercent, 1)} %`;
        $('decisionText').textContent = 'Plán má odstup od bodu zvratu. Ověřte ještě, zda je prodej dosažitelný a zda se cílový zisk vejde do kapacity.';
      }

      const scale = Math.max(data.capacity, data.plan, targetUnits, breakEvenUnits, 1);
      $('breakMarker').style.left = `${Math.min(100, exactBreakEven / scale * 100)}%`;
      $('planBar').style.width = `${Math.min(100, data.plan / scale * 100)}%`;
      $('targetMarker').style.left = `${Math.min(100, targetUnits / scale * 100)}%`;
      $('trackBreakLabel').textContent = `Bod zvratu ${format(breakEvenUnits)}`;
      $('trackPlanLabel').textContent = `Plán ${format(data.plan)}`;
      $('trackCapacityLabel').textContent = `Kapacita ${format(data.capacity)}`;
    }
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('[data-mode]').forEach(button => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('advancedPanel').hidden = mode !== 'advanced';
    $('advancedResults').hidden = mode !== 'advanced';
    calculate();
    if (mode === 'advanced') setTimeout(() => fields.plan.focus({ preventScroll: true }), 0);
  }

  function applyPreset(key) {
    const preset = presets[key];
    if (!preset) return;
    fields.price.value = format(preset.price);
    fields.variable.value = format(preset.variable);
    fields.fixed.value = format(preset.fixed);
    fields.plan.value = format(preset.plan);
    fields.target.value = format(preset.target);
    fields.capacity.value = format(preset.capacity);
    fields.unit.value = preset.unit;
    fields.period.value = preset.period;
    calculate();
  }

  function reset() { applyPreset('product'); setMode('basic'); }

  async function copyResult() {
    const text = `Bod zvratu: ${$('breakEvenUnitsResult').textContent}; potřebný obrat: ${$('breakEvenRevenueResult').textContent}; příspěvek na úhradu: ${$('unitContributionResult').textContent}.`;
    try {
      await navigator.clipboard.writeText(text);
      $('copyResult').textContent = 'Zkopírováno';
      setTimeout(() => { $('copyResult').textContent = 'Kopírovat stručný výsledek'; }, 1400);
    } catch {
      $('copyResult').textContent = 'Kopírování selhalo';
    }
  }

  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
  Object.values(fields).forEach(field => field.addEventListener(field.tagName === 'SELECT' ? 'change' : 'input', calculate));
  form.addEventListener('submit', event => { event.preventDefault(); calculate(); });
  $('resetButton').addEventListener('click', reset);
  $('copyResult').addEventListener('click', copyResult);
  const back = $('backToTop');
  window.addEventListener('scroll', () => back.classList.toggle('is-visible', window.scrollY > 650), { passive: true });
  back.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  calculate();
})();