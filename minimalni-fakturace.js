(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('billingForm');
  if (!form) return;

  const state = { mode: 'basic' };
  const fieldIds = [
    'personalTarget','businessCosts','activeMonths','taxReserve','socialMonthly','healthMonthly',
    'otherMonthly','annualInvestments','lossReserve','safetyBuffer','billableDays','billableHours',
    'averageInvoice','currentBilling','vatRate'
  ];

  const els = Object.fromEntries(fieldIds.map((id) => [id, $(id)]));
  els.vatPayer = $('vatPayer');
  els.advancedPanel = $('advancedPanel');
  els.basicAssumptions = $('basicAssumptions');
  els.modeDescription = $('modeDescription');

  const currency = new Intl.NumberFormat('cs-CZ', {
    style: 'currency', currency: 'CZK', maximumFractionDigits: 0
  });
  const number0 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const number1 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });

  function parseNumber(value) {
    const cleaned = String(value ?? '')
      .trim()
      .replace(/\s+/g, '')
      .replace(',', '.')
      .replace(/[^0-9.+-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function money(value) {
    return currency.format(Number.isFinite(value) ? value : 0);
  }

  function compactMoney(value) {
    if (!Number.isFinite(value)) return '—';
    if (Math.abs(value) >= 1_000_000) return `${number1.format(value / 1_000_000)} mil. Kč`;
    return money(value);
  }

  function setText(id, value) {
    const node = $(id);
    if (node) node.textContent = value;
  }

  function setError(id, message) {
    const input = els[id];
    if (!input) return;
    const field = input.closest('.field');
    if (field) field.classList.toggle('has-error', Boolean(message));
    const error = $(`${id}Error`);
    if (error) error.textContent = message || '';
  }

  function readValues() {
    const values = {};
    fieldIds.forEach((id) => { values[id] = parseNumber(els[id].value); });
    values.vatPayer = Boolean(els.vatPayer.checked);
    return values;
  }

  function validate(v) {
    const rules = {
      personalTarget: [v.personalTarget >= 0, 'Částka pro osobní rozpočet nesmí být záporná.'],
      businessCosts: [v.businessCosts >= 0, 'Náklady podnikání nesmí být záporné.'],
      activeMonths: [v.activeMonths >= 1 && v.activeMonths <= 12, 'Zadejte 1 až 12 aktivních měsíců.'],
      taxReserve: [v.taxReserve >= 0 && v.taxReserve < 70, 'Daňová rezerva musí být od 0 do méně než 70 %.'],
      socialMonthly: [v.socialMonthly >= 0, 'Sociální pojištění nesmí být záporné.'],
      healthMonthly: [v.healthMonthly >= 0, 'Zdravotní pojištění nesmí být záporné.'],
      otherMonthly: [v.otherMonthly >= 0, 'Další pravidelné povinnosti nesmí být záporné.'],
      annualInvestments: [v.annualInvestments >= 0, 'Investice nesmí být záporné.'],
      lossReserve: [v.lossReserve >= 0 && v.lossReserve < 40, 'Rezerva na ztráty musí být od 0 do méně než 40 %.'],
      safetyBuffer: [v.safetyBuffer >= 0 && v.safetyBuffer <= 100, 'Bezpečnostní polštář musí být od 0 do 100 %.'],
      billableDays: [v.billableDays > 0 && v.billableDays <= 31, 'Zadejte více než 0 a nejvýše 31 fakturačních dnů.'],
      billableHours: [v.billableHours > 0 && v.billableHours <= 16, 'Zadejte více než 0 a nejvýše 16 placených hodin.'],
      averageInvoice: [v.averageInvoice >= 0, 'Průměrná faktura nesmí být záporná.'],
      currentBilling: [v.currentBilling >= 0, 'Současná fakturace nesmí být záporná.'],
      vatRate: [v.vatRate >= 0 && v.vatRate <= 100, 'Sazba DPH musí být od 0 do 100 %.']
    };

    let valid = true;
    Object.entries(rules).forEach(([id, [ok, message]]) => {
      const finite = Number.isFinite(v[id]);
      const isValid = finite && ok;
      setError(id, isValid ? '' : message);
      if (!isValid) valid = false;
    });

    if (Number.isFinite(v.taxReserve) && Number.isFinite(v.lossReserve) && v.taxReserve + v.lossReserve >= 85) {
      setError('lossReserve', 'Součet daňové a ztrátové rezervy musí být nižší než 85 %.');
      valid = false;
    }
    if (v.personalTarget + v.businessCosts + v.socialMonthly + v.healthMonthly + v.otherMonthly <= 0) {
      setError('personalTarget', 'Zadejte alespoň jednu kladnou měsíční potřebu.');
      valid = false;
    }
    return valid;
  }

  function calculate(v, activeMonthsOverride) {
    const activeMonths = activeMonthsOverride ?? v.activeMonths;
    const personalAnnual = v.personalTarget * 12;
    const businessAnnual = v.businessCosts * 12;
    const socialAnnual = v.socialMonthly * 12;
    const healthAnnual = v.healthMonthly * 12;
    const otherAnnual = v.otherMonthly * 12;
    const fixedNeed = personalAnnual + businessAnnual + socialAnnual + healthAnnual + otherAnnual + v.annualInvestments;
    const reserveShare = (v.taxReserve + v.lossReserve) / 100;
    const revenueBeforeBuffer = fixedNeed / Math.max(0.01, 1 - reserveShare);
    const taxAmount = revenueBeforeBuffer * (v.taxReserve / 100);
    const lossAmount = revenueBeforeBuffer * (v.lossReserve / 100);
    const safetyAmount = revenueBeforeBuffer * (v.safetyBuffer / 100);
    const annualTarget = revenueBeforeBuffer + safetyAmount;
    const monthlyTarget = annualTarget / activeMonths;
    const calendarAverage = annualTarget / 12;
    const dailyRate = monthlyTarget / v.billableDays;
    const hourlyRate = dailyRate / v.billableHours;
    const invoiceCountExact = v.averageInvoice > 0 ? monthlyTarget / v.averageInvoice : 0;
    const invoiceCount = v.averageInvoice > 0 ? Math.ceil(invoiceCountExact) : 0;
    const currentCoverage = v.currentBilling > 0 ? (v.currentBilling / monthlyTarget) * 100 : 0;
    const currentGapMonthly = v.currentBilling > 0 ? v.currentBilling - monthlyTarget : 0;
    const currentAnnual = v.currentBilling * activeMonths;
    const annualGap = v.currentBilling > 0 ? currentAnnual - annualTarget : 0;
    const monthlyWithVat = monthlyTarget * (1 + v.vatRate / 100);

    return {
      ...v, activeMonths, personalAnnual, businessAnnual, socialAnnual, healthAnnual, otherAnnual,
      fixedNeed, taxAmount, lossAmount, safetyAmount, annualTarget, monthlyTarget, calendarAverage,
      dailyRate, hourlyRate, invoiceCount, invoiceCountExact, currentCoverage, currentGapMonthly,
      currentAnnual, annualGap, monthlyWithVat
    };
  }

  function renderInvalid() {
    ['monthlyTarget','annualTarget','dailyRate','hourlyRate','invoiceCount'].forEach((id) => setText(id, '—'));
    setText('resultBadge', 'Zkontrolujte vstupy');
    setText('resultSentence', 'Opravte označené hodnoty. Kalkulačka nezobrazí NaN, nekonečno ani záporné ekonomické výsledky.');
    setText('heroMonthlyTarget', '—');
    setText('heroAnnualTarget', '—');
    setText('heroDailyRate', '—');
    setText('heroHourlyRate', '—');
  }

  function renderDecision(r) {
    const card = $('decisionCard');
    card.className = 'decision-card';
    let label = 'Vyvážený model';
    let title = 'Minimum je podklad, ne cenovka';
    let text = 'Výsledek je spodní obratová hranice. Skutečný obchodní cíl nastavte výše podle hodnoty, rizika, vyjednávacího prostoru a růstu.';

    if (r.activeMonths >= 11.5) {
      card.classList.add('is-warning');
      label = 'Těsný kalendář';
      title = 'Plán téměř nepočítá s neplaceným časem';
      text = 'Jeden výpadek může posunout celý roční plán. Ověřte scénář s deseti nebo jedenácti aktivními měsíci.';
    } else if (r.activeMonths <= 8) {
      card.classList.add('is-warning');
      label = 'Koncentrovaný výkon';
      title = 'Roční potřeba je stlačená do malého počtu měsíců';
      text = 'Zkontrolujte, zda počet fakturačních dnů, průměrná faktura a prodejní kapacita odpovídají tak vysokému měsíčnímu cíli.';
    }

    if (r.currentBilling > 0 && r.currentCoverage < 85) {
      card.className = 'decision-card is-danger';
      label = 'Výkonnostní deficit';
      title = 'Současná fakturace je výrazně pod minimem';
      text = `V aktivním měsíci chybí přibližně ${money(Math.abs(r.currentGapMonthly))}. Rozdíl nelze bezpečně řešit pouze delší pracovní dobou; prověřte cenu, průměrnou zakázku, kapacitu a náklady.`;
    } else if (r.currentBilling > 0 && r.currentCoverage < 100) {
      card.className = 'decision-card is-warning';
      label = 'Těsně pod hranicí';
      title = 'Současná fakturace zatím minimum nepokrývá';
      text = `V aktivním měsíci chybí přibližně ${money(Math.abs(r.currentGapMonthly))}. Menší cenová nebo kapacitní změna může plán dorovnat, ale nechte prostor i nad hranicí.`;
    } else if (r.currentBilling > 0 && r.currentCoverage >= 120) {
      label = 'Prostor nad minimem';
      title = 'Současný výkon vytváří rezervu';
      text = `Aktivní měsíční fakturace je přibližně o ${money(r.currentGapMonthly)} nad vypočteným minimem. Sledujte, zda se rozdíl skutečně proměňuje v rezervu, investice nebo zisk.`;
    }

    setText('decisionLabel', label);
    setText('decisionTitle', title);
    setText('decisionText', text);
    setText('heroStatus', title);
  }

  function renderCoverage(r) {
    const fill = $('coverageFill');
    if (r.currentBilling <= 0) {
      setText('currentComparison', 'Doplňte současnou fakturaci');
      setText('coveragePercent', '—');
      fill.style.width = '0%';
      setText('coverageText', 'Porovnání používá aktivní měsíční fakturaci, nikoli průměr přes celý kalendářní rok.');
      return;
    }
    const clamped = Math.max(0, Math.min(140, r.currentCoverage));
    fill.style.width = `${Math.min(100, clamped)}%`;
    setText('coveragePercent', `${number0.format(r.currentCoverage)} %`);
    if (r.currentCoverage >= 100) {
      setText('currentComparison', `${money(r.currentBilling)} pokrývá minimum`);
      setText('coverageText', `Za ${number1.format(r.activeMonths)} aktivních měsíců vytváří současný výkon roční prostor ${money(Math.max(0, r.annualGap))} nad minimem.`);
    } else {
      setText('currentComparison', `${money(r.currentBilling)} je pod minimem`);
      setText('coverageText', `Při stejné výkonnosti chybí za aktivní rok přibližně ${money(Math.abs(r.annualGap))}.`);
    }
  }

  function appendBreakdownRow(container, label, value, total = false) {
    const row = document.createElement('div');
    row.className = `breakdown-row${total ? ' total' : ''}`;
    const name = document.createElement('span');
    const amount = document.createElement('strong');
    name.textContent = label;
    amount.textContent = money(value);
    row.append(name, amount);
    container.append(row);
  }

  function renderBreakdown(r) {
    const container = $('breakdownList');
    container.replaceChildren();
    appendBreakdownRow(container, 'Osobní cíl na rok', r.personalAnnual);
    appendBreakdownRow(container, 'Provoz podnikání na rok', r.businessAnnual);
    appendBreakdownRow(container, 'Sociální a zdravotní pojištění', r.socialAnnual + r.healthAnnual);
    appendBreakdownRow(container, 'Další pravidelné povinnosti', r.otherAnnual);
    appendBreakdownRow(container, 'Investice a jednorázové výdaje', r.annualInvestments);
    appendBreakdownRow(container, 'Plánovací daňová rezerva', r.taxAmount);
    appendBreakdownRow(container, 'Rezerva na ztráty a výpadky', r.lossAmount);
    appendBreakdownRow(container, 'Bezpečnostní polštář', r.safetyAmount);
    appendBreakdownRow(container, 'Roční minimum fakturace', r.annualTarget, true);
  }

  function renderScenarios(v) {
    const container = $('scenarioGrid');
    container.replaceChildren();
    [8, 9, 10, 11, 12].forEach((months) => {
      const r = calculate(v, months);
      const article = document.createElement('article');
      article.className = `scenario-card${Math.abs(months - v.activeMonths) < 0.25 ? ' is-current' : ''}`;
      const label = document.createElement('span');
      const title = document.createElement('h3');
      const amount = document.createElement('strong');
      const note = document.createElement('p');
      label.textContent = `${12 - months} měs. mimo plný výkon`;
      title.textContent = `${months} aktivních měsíců`;
      amount.textContent = money(r.monthlyTarget);
      note.textContent = `${money(r.dailyRate)} za fakturační den při zadané kapacitě.`;
      article.append(label, title, amount, note);
      container.append(article);
    });
  }

  function render(r) {
    setText('monthlyTarget', money(r.monthlyTarget));
    setText('annualTarget', money(r.annualTarget));
    setText('dailyRate', money(r.dailyRate));
    setText('hourlyRate', money(r.hourlyRate));
    setText('invoiceCount', r.invoiceCount ? `${r.invoiceCount} faktury` : 'Doplňte hodnotu');
    setText('invoiceNote', r.invoiceCount ? `Při průměru ${money(r.averageInvoice)}` : 'Průměrná faktura není vyplněna');
    setText('annualNote', `Průměr přes 12 měsíců: ${money(r.calendarAverage)}`);
    setText('dailyNote', `${number1.format(r.billableDays)} fakturačních dnů za aktivní měsíc`);
    setText('hourlyNote', `${number1.format(r.billableHours)} placených hodin za fakturační den`);
    setText('resultBadge', `Model ${number1.format(r.activeMonths)} měs.`);
    setText('resultSentence', `${number1.format(r.activeMonths)} plně fakturačních měsíců musí vytvořit celý roční obrat včetně zadaných povinností a rezerv.`);

    setText('heroMonthlyTarget', money(r.monthlyTarget));
    setText('heroAnnualTarget', compactMoney(r.annualTarget));
    setText('heroDailyRate', money(r.dailyRate));
    setText('heroHourlyRate', money(r.hourlyRate));
    setText('heroNote', `${number1.format(r.activeMonths)} aktivních měsíců financuje také ${number1.format(12 - r.activeMonths)} měsíce mimo plnou fakturaci.`);

    renderDecision(r);
    renderCoverage(r);
    renderBreakdown(r);
    renderScenarios(r);

    const vatCard = $('vatCard');
    vatCard.hidden = !r.vatPayer;
    if (r.vatPayer) {
      setText('monthlyWithVat', money(r.monthlyWithVat));
      setText('vatNote', `Při sazbě ${number1.format(r.vatRate)} %. DPH není výnosem podnikání a do ekonomického minima se nezapočítává.`);
    }
  }

  function recalculate(options = {}) {
    const values = readValues();
    if (!validate(values)) {
      renderInvalid();
      return false;
    }
    const result = calculate(values);
    render(result);
    if (options.scroll && window.matchMedia('(max-width: 720px)').matches) {
      $('vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    return true;
  }

  const presets = {
    solo: {
      personalTarget:'45 000', businessCosts:'10 000', activeMonths:'10', taxReserve:'10', socialMonthly:'5 005',
      healthMonthly:'3 306', otherMonthly:'0', annualInvestments:'35 000', lossReserve:'3', safetyBuffer:'8',
      billableDays:'16', billableHours:'6', averageInvoice:'25 000', currentBilling:'90 000', vatRate:'21', vatPayer:false
    },
    consultant: {
      personalTarget:'70 000', businessCosts:'18 000', activeMonths:'9.5', taxReserve:'14', socialMonthly:'7 500',
      healthMonthly:'4 500', otherMonthly:'1 200', annualInvestments:'80 000', lossReserve:'4', safetyBuffer:'12',
      billableDays:'13', billableHours:'6', averageInvoice:'55 000', currentBilling:'150 000', vatRate:'21', vatPayer:true
    },
    studio: {
      personalTarget:'85 000', businessCosts:'75 000', activeMonths:'10', taxReserve:'12', socialMonthly:'9 000',
      healthMonthly:'5 500', otherMonthly:'4 000', annualInvestments:'180 000', lossReserve:'6', safetyBuffer:'12',
      billableDays:'18', billableHours:'8', averageInvoice:'80 000', currentBilling:'260 000', vatRate:'21', vatPayer:true
    }
  };

  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    fieldIds.forEach((id) => { els[id].value = preset[id]; });
    els.vatPayer.checked = preset.vatPayer;
    document.querySelectorAll('[data-preset]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.preset === name);
    });
    recalculate();
  }

  function setMode(mode) {
    const advanced = mode === 'advanced';
    state.mode = advanced ? 'advanced' : 'basic';
    document.documentElement.dataset.calculatorMode = state.mode;
    document.querySelectorAll('[data-mode]').forEach((button) => {
      const active = button.dataset.mode === state.mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
      button.setAttribute('aria-expanded', String(active && advanced));
    });
    els.advancedPanel.toggleAttribute('hidden', !advanced);
    els.basicAssumptions.toggleAttribute('hidden', advanced);
    if (els.modeDescription) {
      els.modeDescription.textContent = advanced
        ? 'Pokročilý režim zpřístupňuje odvody, investice, rizikové rezervy, kapacitu, DPH a porovnání se současnou fakturací.'
        : 'Základní režim používá čtyři hlavní vstupy a bezpečné výchozí předpoklady.';
    }
    if (advanced) {
      window.setTimeout(() => els.socialMonthly.focus({ preventScroll: true }), 0);
    }
  }

  async function copyResult() {
    const values = readValues();
    if (!validate(values)) return;
    const r = calculate(values);
    const text = [
      `Minimální fakturace OSVČ: ${money(r.annualTarget)} ročně bez DPH`,
      `${money(r.monthlyTarget)} za aktivní měsíc`,
      `${money(r.dailyRate)} za fakturační den`,
      `${money(r.hourlyRate)} za placenou hodinu`,
      `${number1.format(r.activeMonths)} aktivních měsíců`
    ].join(' | ');
    try {
      await navigator.clipboard.writeText(text);
      setText('copyResult', 'Zkopírováno');
      window.setTimeout(() => setText('copyResult', 'Kopírovat výsledek'), 1500);
    } catch {
      setText('copyResult', 'Kopírování selhalo');
    }
  }

  function bind() {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      recalculate({ scroll: true });
    });
    fieldIds.forEach((id) => {
      els[id].addEventListener('input', () => recalculate());
      els[id].addEventListener('change', () => recalculate());
    });
    els.vatPayer.addEventListener('change', () => recalculate());
    document.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => setMode(button.dataset.mode));
    });
    const openAdvanced = document.querySelector('[data-open-advanced]');
    if (openAdvanced) openAdvanced.addEventListener('click', () => setMode('advanced'));
    document.querySelectorAll('[data-preset]').forEach((button) => {
      button.addEventListener('click', () => applyPreset(button.dataset.preset));
    });
    $('resetButton').addEventListener('click', () => {
      applyPreset('solo');
      setMode('basic');
    });
    $('copyResult').addEventListener('click', copyResult);
  }

  function init() {
    bind();
    setMode('basic');
    recalculate();
  }

  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
