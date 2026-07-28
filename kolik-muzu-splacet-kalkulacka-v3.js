(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const basicIds = ['income', 'expenses', 'existingPayments', 'plannedPayment', 'savings'];
  const advancedIds = ['people', 'stability', 'paymentType', 'targetBuffer', 'safeDebtRatio', 'incomeShock', 'expenseShock'];
  const allIds = [...basicIds, ...advancedIds];
  const defaults = {
    income: '75000',
    expenses: '42000',
    existingPayments: '6500',
    plannedPayment: '12000',
    savings: '250000',
    people: '3',
    stability: 'normal',
    paymentType: 'loan',
    targetBuffer: '0',
    safeDebtRatio: '27',
    incomeShock: '15',
    expenseShock: '10'
  };

  let mode = 'basic';

  const parseNumber = (value) => {
    let normalized = String(value ?? '').trim().replace(/[\s\u00a0']/g, '');
    if (!normalized) return NaN;
    const comma = normalized.lastIndexOf(',');
    const dot = normalized.lastIndexOf('.');
    if (comma >= 0 && dot >= 0) {
      const decimalIndex = Math.max(comma, dot);
      normalized = normalized
        .split('')
        .filter((char, index) => (char !== ',' && char !== '.') || index === decimalIndex)
        .join('')
        .replace(',', '.');
    } else {
      const separator = comma >= 0 ? ',' : dot >= 0 ? '.' : '';
      if (separator) {
        const pieces = normalized.split(separator);
        if (pieces.length > 2 && pieces.slice(1).every((piece) => piece.length === 3)) {
          normalized = pieces.join('');
        } else if (pieces.length > 2) {
          const decimalPart = pieces.pop();
          normalized = `${pieces.join('')}.${decimalPart}`;
        } else {
          normalized = normalized.replace(separator, '.');
        }
      }
    }
    const number = Number(normalized);
    return Number.isFinite(number) ? number : NaN;
  };

  const read = (id) => parseNumber($(id)?.value);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const money = (value) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(Number.isFinite(value) ? value : 0))} Kč`;
  const percent = (value, digits = 0) => `${new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0)} %`;
  const months = (value) => `${new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0)} měs.`;

  function activeAssumptions(values) {
    if (mode === 'basic') {
      return {
        people: 2,
        stability: 'normal',
        paymentType: 'loan',
        targetBuffer: 0,
        safeDebtRatio: 27,
        incomeShock: 15,
        expenseShock: 10
      };
    }
    return {
      people: Math.round(values.people),
      stability: values.stability,
      paymentType: values.paymentType,
      targetBuffer: values.targetBuffer,
      safeDebtRatio: values.safeDebtRatio,
      incomeShock: values.incomeShock,
      expenseShock: values.expenseShock
    };
  }

  function currentValues() {
    const values = {};
    for (const id of basicIds) values[id] = read(id);
    values.people = read('people');
    values.stability = $('stability')?.value || 'normal';
    values.paymentType = $('paymentType')?.value || 'loan';
    values.targetBuffer = read('targetBuffer');
    values.safeDebtRatio = read('safeDebtRatio');
    values.incomeShock = read('incomeShock');
    values.expenseShock = read('expenseShock');
    return values;
  }

  function validate(values) {
    const errors = [];
    if (!(values.income > 0)) errors.push(['income', 'Zadejte kladný čistý měsíční příjem domácnosti.']);
    for (const id of ['expenses', 'existingPayments', 'plannedPayment', 'savings']) {
      if (!(values[id] >= 0)) errors.push([id, 'Příjmy, výdaje, splátky ani rezerva nesmí být záporné.']);
    }
    if (values.expenses + values.existingPayments > values.income * 2) {
      errors.push(['expenses', 'Zkontrolujte výdaje a současné splátky. Zadané hodnoty jsou výrazně nad příjmem.']);
    }
    if (mode === 'advanced') {
      if (!(values.people >= 1 && values.people <= 12)) errors.push(['people', 'Počet osob musí být mezi 1 a 12.']);
      if (!(values.targetBuffer >= 0)) errors.push(['targetBuffer', 'Vlastní měsíční polštář nesmí být záporný.']);
      if (!(values.safeDebtRatio >= 10 && values.safeDebtRatio <= 50)) errors.push(['safeDebtRatio', 'Bezpečný podíl splátek nastavte mezi 10 a 50 %.']);
      if (!(values.incomeShock >= 0 && values.incomeShock <= 60)) errors.push(['incomeShock', 'Pokles příjmu ve stresovém scénáři nastavte mezi 0 a 60 %.']);
      if (!(values.expenseShock >= 0 && values.expenseShock <= 60)) errors.push(['expenseShock', 'Růst výdajů ve stresovém scénáři nastavte mezi 0 a 60 %.']);
    }
    return errors;
  }

  function model(values) {
    const assumptions = activeAssumptions(values);
    const stabilityFactor = assumptions.stability === 'stable' ? 1 : assumptions.stability === 'unstable' ? 0.78 : 0.9;
    const automaticBuffer = Math.max(values.income * 0.08, 6500 + Math.max(0, assumptions.people - 1) * 4200);
    const minimumBuffer = assumptions.targetBuffer > 0 ? assumptions.targetBuffer : automaticBuffer;
    const monthlyCommitments = values.expenses + values.existingPayments;
    const reserveMonths = monthlyCommitments > 0 ? values.savings / monthlyCommitments : 0;
    const reserveFactor = reserveMonths < 1 ? 0.6 : reserveMonths < 3 ? 0.78 : reserveMonths < 6 ? 0.92 : 1;

    const debtCapacity = Math.max(0, values.income * (assumptions.safeDebtRatio / 100) * stabilityFactor - values.existingPayments);
    const cashCapacity = Math.max(0, values.income - values.expenses - values.existingPayments - minimumBuffer);
    const rawSafe = Math.min(debtCapacity, cashCapacity);
    const safePayment = Math.max(0, rawSafe * reserveFactor);

    const borderRatio = Math.min(55, assumptions.safeDebtRatio + 10);
    const borderDebt = Math.max(0, values.income * (borderRatio / 100) * stabilityFactor - values.existingPayments);
    const borderCash = Math.max(0, values.income - values.expenses - values.existingPayments - minimumBuffer * 0.45);
    const borderPayment = Math.max(safePayment, Math.min(borderDebt, borderCash));

    const totalPayments = values.existingPayments + values.plannedPayment;
    const debtRatio = values.income > 0 ? totalPayments / values.income * 100 : 0;
    const leftAfter = values.income - values.expenses - totalPayments;
    const headroom = safePayment - values.plannedPayment;

    const stressIncome = values.income * (1 - assumptions.incomeShock / 100);
    const stressExpenses = values.expenses * (1 + assumptions.expenseShock / 100);
    const stressLeft = stressIncome - stressExpenses - values.existingPayments - values.plannedPayment;
    const stressDebtRatio = stressIncome > 0 ? totalPayments / stressIncome * 100 : 100;

    let bottleneck = debtCapacity <= cashCapacity ? 'podíl splátek na příjmu' : 'měsíční cashflow po výdajích';
    if (reserveFactor < 0.9) bottleneck = 'nízká likvidní rezerva';

    let status = 'safe';
    if (values.plannedPayment > borderPayment || leftAfter < minimumBuffer * 0.35 || debtRatio > 48 || stressLeft < -minimumBuffer * 0.65) {
      status = 'risk';
    } else if (values.plannedPayment > safePayment || leftAfter < minimumBuffer || debtRatio > assumptions.safeDebtRatio || stressLeft < 0 || reserveMonths < 2) {
      status = 'border';
    }

    return {
      ...assumptions,
      stabilityFactor,
      automaticBuffer,
      minimumBuffer,
      reserveMonths,
      reserveFactor,
      debtCapacity,
      cashCapacity,
      safePayment,
      borderPayment,
      debtRatio,
      leftAfter,
      headroom,
      stressIncome,
      stressExpenses,
      stressLeft,
      stressDebtRatio,
      bottleneck,
      status
    };
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function setWidth(id, value) {
    const element = $(id);
    if (element) element.style.width = `${clamp(value, 0, 100)}%`;
  }

  function statusCopy(result, values) {
    const typeNames = { loan: 'úvěru', mortgage: 'hypotéky', car: 'financování auta', other: 'nového závazku' };
    const type = typeNames[result.paymentType] || 'úvěru';
    if (result.status === 'safe') {
      return {
        title: 'Plánovaná splátka je v bezpečné zóně',
        label: 'bezpečný scénář',
        text: `Splátka je pod orientačním bezpečným limitem a po zaplacení běžných výdajů zůstává provozní polštář. Ani tento výsledek není pokyn využít maximum: u dlouhého ${type} má smysl ponechat si další prostor pro změnu cen, příjmu a životních plánů.`,
        next: 'Porovnejte nyní konkrétní nabídku podle RPSN, celkové ceny, délky splácení a podmínek předčasného splacení.'
      };
    }
    if (result.status === 'border') {
      return {
        title: 'Plánovaná splátka je na hraně',
        label: 'citlivý rozpočet',
        text: 'Běžný měsíc může vycházet, ale rozhodnutí je citlivé na výpadek příjmu, růst výdajů nebo mimořádnou platbu. Výsledek stojí blízko bezpečné hranice, případně jej oslabuje menší finanční rezerva.',
        next: 'Snižte splátku nebo cenu financovaného nákupu a znovu otestujte stresový scénář. Před podpisem sestavte úplný rozpočet alespoň z několika skutečných měsíců.'
      };
    }
    return {
      title: 'Plánovaná splátka je riziková',
      label: 'vysoké zatížení',
      text: 'Po zaplacení výdajů a závazků zůstává příliš malý prostor, nebo je splátka příliš vysoká vůči příjmu a rezervě. Schválení úvěru by samo o sobě neznamenalo, že je závazek dlouhodobě bezpečný.',
      next: 'Zvažte nižší úvěr, vyšší vlastní zdroje, levnější variantu, delší přípravu rezervy nebo odložení nákupu. Nejdříve stabilizujte rozpočet.'
    };
  }

  function calculate() {
    const values = currentValues();
    const errors = validate(values);
    const message = $('formMessage');
    if (message) message.textContent = errors[0]?.[1] || '';
    for (const id of allIds) $(id)?.removeAttribute('aria-invalid');
    document.body.dataset.calculationState = errors.length ? 'invalid' : 'ready';
    if (errors.length) {
      const field = $(errors[0][0]);
      if (field) field.setAttribute('aria-invalid', 'true');
      return;
    }

    const result = model(values);
    const copy = statusCopy(result, values);
    document.body.dataset.status = result.status;
    const resultPanel = $('vysledek');
    if (resultPanel) resultPanel.dataset.status = result.status;

    setText('resultTitle', copy.title);
    setText('resultStatus', copy.label);
    setText('resultText', copy.text);
    setText('nextStep', copy.next);
    setText('plannedPaymentEcho', money(values.plannedPayment));
    setText('safePayment', money(result.safePayment));
    setText('borderPayment', money(result.borderPayment));
    setText('leftAfter', money(result.leftAfter));
    setText('debtRatio', percent(result.debtRatio));
    setText('reserveMonths', months(result.reserveMonths));
    setText('headroom', result.headroom >= 0 ? `+${money(result.headroom)}` : `−${money(Math.abs(result.headroom))}`);
    setText('stressLeft', money(result.stressLeft));
    setText('stressDebtRatio', percent(result.stressDebtRatio));
    setText('bottleneck', result.bottleneck);
    setText('cashCapacity', money(result.cashCapacity));
    setText('debtCapacity', money(result.debtCapacity));
    setText('minimumBuffer', money(result.minimumBuffer));
    setText('reserveFactor', percent(result.reserveFactor * 100));
    setText('stressIncomeValue', money(result.stressIncome));
    setText('stressExpensesValue', money(result.stressExpenses));
    setText('stressScenarioLabel', `příjem −${percent(result.incomeShock)} · výdaje +${percent(result.expenseShock)}`);

    const meterLabel = result.status === 'safe' ? 'bezpečná zóna' : result.status === 'border' ? 'hraniční zóna' : 'riziková zóna';
    setText('meterLabel', meterLabel);
    setWidth('debtBar', result.debtRatio * 2);
    setWidth('safeShareBar', result.borderPayment > 0 ? result.safePayment / result.borderPayment * 100 : 0);
    setWidth('plannedShareBar', result.borderPayment > 0 ? values.plannedPayment / result.borderPayment * 100 : 0);
    setWidth('stressBar', result.minimumBuffer > 0 ? (result.stressLeft + result.minimumBuffer) / (result.minimumBuffer * 2) * 100 : 50);

    setText('heroSafePayment', money(result.safePayment));
    setText('heroStatus', copy.label);
    setText('heroDebtRatio', percent(result.debtRatio));
    setText('heroLeftAfter', money(result.leftAfter));
    setText('heroReserveMonths', months(result.reserveMonths));
    setText('heroStress', money(result.stressLeft));

    saveUrl(values);
  }

  function setMode(nextMode) {
    mode = nextMode === 'advanced' ? 'advanced' : 'basic';
    document.body.dataset.mode = mode;
    document.querySelectorAll('[data-mode-button]').forEach((button) => {
      const active = button.dataset.modeButton === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-selected', String(active));
      button.tabIndex = active ? 0 : -1;
    });
    const advanced = $('advancedZone');
    if (advanced) advanced.hidden = mode !== 'advanced';
    calculate();
  }

  function applyStressPreset(name) {
    const presets = {
      mild: { incomeShock: '10', expenseShock: '5' },
      standard: { incomeShock: '15', expenseShock: '10' },
      strong: { incomeShock: '25', expenseShock: '15' }
    };
    const preset = presets[name] || presets.standard;
    $('incomeShock').value = preset.incomeShock;
    $('expenseShock').value = preset.expenseShock;
    document.querySelectorAll('[data-stress-preset]').forEach((button) => {
      const active = button.dataset.stressPreset === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    setMode('advanced');
  }

  function saveUrl(values = currentValues()) {
    try {
      const url = new URL(window.location.href);
      url.search = '';
      url.searchParams.set('rezim', mode);
      for (const id of allIds) {
        const element = $(id);
        if (!element) continue;
        url.searchParams.set(id, element.value);
      }
      window.history.replaceState({}, '', url);
    } catch (_) {}
  }

  function loadUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      for (const id of allIds) {
        if (params.has(id) && $(id)) $(id).value = params.get(id);
      }
      mode = params.get('rezim') === 'advanced' ? 'advanced' : 'basic';
    } catch (_) {}
  }

  async function copyText(text, success) {
    try {
      await navigator.clipboard.writeText(text);
      setText('formMessage', success);
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      setText('formMessage', success);
    }
  }

  function reset() {
    for (const [id, value] of Object.entries(defaults)) {
      if ($(id)) $(id).value = value;
    }
    document.querySelectorAll('[data-stress-preset]').forEach((button) => {
      const active = button.dataset.stressPreset === 'standard';
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    setMode('basic');
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadUrl();
    for (const id of allIds) {
      const element = $(id);
      element?.addEventListener('input', calculate);
      element?.addEventListener('change', calculate);
    }
    $('installmentForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      calculate();
    });
    document.querySelectorAll('[data-mode-button]').forEach((button) => {
      button.addEventListener('click', () => setMode(button.dataset.modeButton));
    });
    document.querySelectorAll('[data-stress-preset]').forEach((button) => {
      button.addEventListener('click', () => applyStressPreset(button.dataset.stressPreset));
    });
    $('resetForm')?.addEventListener('click', reset);
    $('copyLink')?.addEventListener('click', () => copyText(window.location.href, 'Odkaz s nastavením byl zkopírován.'));
    $('copyResult')?.addEventListener('click', () => {
      const text = `${$('resultTitle')?.textContent || ''}\nBezpečná splátka: ${$('safePayment')?.textContent || ''}\nHraniční splátka: ${$('borderPayment')?.textContent || ''}\nPo splátce zůstane: ${$('leftAfter')?.textContent || ''}\nStresový zůstatek: ${$('stressLeft')?.textContent || ''}\n${window.location.href}`;
      copyText(text, 'Výsledek byl zkopírován.');
    });
    setMode(mode);
  });
})();
