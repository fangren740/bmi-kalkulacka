(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const form = byId('rvMinPriceForm');
  if (!form) return;

  const fields = {
    cost: byId('rvCost'),
    fees: byId('rvFees'),
    margin: byId('rvMargin')
  };

  const outputs = {
    target: byId('rvTarget'),
    feeAmount: byId('rvFeeAmount'),
    profit: byId('rvProfit'),
    markup: byId('rvMarkup'),
    error: byId('rvError')
  };

  function parseNumber(value) {
    const normalized = String(value ?? '').trim().replace(/\s+/g, '').replace(',', '.');
    if (normalized === '') return Number.NaN;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
  }

  function calculate(cost, feesPercent, marginPercent) {
    const fees = feesPercent / 100;
    const margin = marginPercent / 100;
    const target = cost / (1 - fees - margin);
    return {
      target,
      feeAmount: target * fees,
      profit: target * margin,
      markup: cost > 0 ? ((target - cost) / cost) * 100 : 0
    };
  }

  const money = (value) => new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);

  const percent = (value) => `${new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value)} %`;

  function showError(message) {
    outputs.error.hidden = false;
    outputs.error.textContent = message;
    outputs.target.textContent = '—';
    outputs.feeAmount.textContent = '—';
    outputs.profit.textContent = '—';
    outputs.markup.textContent = '—';
  }

  function render() {
    const cost = parseNumber(fields.cost.value);
    const fees = parseNumber(fields.fees.value);
    const margin = parseNumber(fields.margin.value);

    if (![cost, fees, margin].every(Number.isFinite)) {
      showError('Doplňte platná čísla. Lze použít desetinnou čárku i tečku.');
      return;
    }
    if (cost < 0 || fees < 0 || margin < 0) {
      showError('Náklad, poplatky ani marže nemohou být záporné.');
      return;
    }
    if (fees + margin >= 95) {
      showError('Součet poplatků a cílové marže musí být nižší než 95 %.');
      return;
    }

    outputs.error.hidden = true;
    const result = calculate(cost, fees, margin);
    outputs.target.textContent = money(result.target);
    outputs.feeAmount.textContent = money(result.feeAmount);
    outputs.profit.textContent = money(result.profit);
    outputs.markup.textContent = percent(result.markup);
  }

  Object.values(fields).forEach((field) => {
    field.addEventListener('input', render, { passive: true });
    field.addEventListener('change', render, { passive: true });
  });

  form.addEventListener('submit', (event) => event.preventDefault());
  render();
})();
