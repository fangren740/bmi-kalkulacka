(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('extraPaymentForm');
  if (!form) return;

  const moneyFormatter = new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: 0
  });
  const decimalFormatter = new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  const refs = {
    basicTab: $('basicTab'),
    proTab: $('proTab'),
    basicFields: $('basicFields'),
    proFields: $('proFields'),
    basicBalance: $('basicBalance'),
    basicExtra: $('basicExtra'),
    basicRate: $('basicRate'),
    basicYears: $('basicYears'),
    proBalance: $('proBalance'),
    proExtra: $('proExtra'),
    proRate: $('proRate'),
    proYears: $('proYears'),
    proMonths: $('proMonths'),
    proActualPayment: $('proActualPayment'),
    proStrategy: $('proStrategy'),
    proFee: $('proFee'),
    proTaxLoss: $('proTaxLoss'),
    proReserve: $('proReserve'),
    proMonthlyExpenses: $('proMonthlyExpenses'),
    formModeLabel: $('formModeLabel'),
    formModeText: $('formModeText'),
    formError: $('formError'),
    switchToPro: $('switchToPro'),
    resetBtn: $('resetBtn'),
    modeStatus: $('modeStatus'),
    netSavingResult: $('netSavingResult'),
    statusBadge: $('statusBadge'),
    resultLead: $('resultLead'),
    originalInterestBar: $('originalInterestBar'),
    newInterestBar: $('newInterestBar'),
    originalInterestResult: $('originalInterestResult'),
    newInterestResult: $('newInterestResult'),
    originalPaymentResult: $('originalPaymentResult'),
    newPaymentResult: $('newPaymentResult'),
    timeSavedResult: $('timeSavedResult'),
    newPrincipalResult: $('newPrincipalResult'),
    strategyHeadline: $('strategyHeadline'),
    decisionText: $('decisionText'),
    reserveStatus: $('reserveStatus'),
    reserveText: $('reserveText'),
    shortenSaving: $('shortenSaving'),
    shortenMeta: $('shortenMeta'),
    reduceSaving: $('reduceSaving'),
    reduceMeta: $('reduceMeta'),
    comparisonBody: $('comparisonBody'),
    detailHeadline: $('detailHeadline'),
    detailText: $('detailText'),
    checkPayment: $('checkPayment'),
    checkStrategy: $('checkStrategy'),
    checkCosts: $('checkCosts'),
    copyResult: $('copyResult'),
    printResult: $('printResult'),
    heroExtraPayment: $('heroExtraPayment'),
    heroSaving: $('heroSaving'),
    heroStrategy: $('heroStrategy'),
    heroPrincipal: $('heroPrincipal'),
    heroTime: $('heroTime'),
    heroNet: $('heroNet')
  };

  const defaults = Object.freeze({
    balance: 3000000,
    extra: 300000,
    rate: 5.3,
    years: 20,
    months: 0,
    actualPayment: 0,
    strategy: 'shorten',
    fee: 0,
    taxLoss: 0,
    reserve: 300000,
    monthlyExpenses: 50000
  });

  const presets = Object.freeze({
    balanced: {
      balance: 3000000,
      extra: 300000,
      rate: 5.3,
      years: 20,
      months: 0,
      actualPayment: 0,
      strategy: 'shorten',
      fee: 0,
      taxLoss: 0,
      reserve: 300000,
      monthlyExpenses: 50000
    },
    highRate: {
      balance: 2800000,
      extra: 250000,
      rate: 6.4,
      years: 18,
      months: 0,
      actualPayment: 0,
      strategy: 'shorten',
      fee: 0,
      taxLoss: 0,
      reserve: 260000,
      monthlyExpenses: 52000
    },
    fullRepay: {
      balance: 650000,
      extra: 650000,
      rate: 4.9,
      years: 5,
      months: 0,
      actualPayment: 0,
      strategy: 'shorten',
      fee: 0,
      taxLoss: 0,
      reserve: 350000,
      monthlyExpenses: 45000
    }
  });

  let activeMode = 'basic';
  let lastValidResult = null;

  const numericValue = (element) => {
    const value = Number.parseFloat(String(element.value).replace(/\s/g, '').replace(',', '.'));
    return Number.isFinite(value) ? value : 0;
  };

  const money = (value) => {
    const safe = Number.isFinite(value) ? Math.round(value) : 0;
    const prefix = safe < 0 ? '−' : '';
    return prefix + moneyFormatter.format(Math.abs(safe)) + ' Kč';
  };

  const percent = (value) => {
    const safe = Number.isFinite(value) ? value : 0;
    return decimalFormatter.format(safe) + ' %';
  };

  const monthsText = (value) => {
    const months = Math.max(0, Math.round(Number.isFinite(value) ? value : 0));
    if (months === 0) return '0 měs.';
    const years = Math.floor(months / 12);
    const rest = months % 12;
    if (!years) return months + ' měs.';
    if (!rest) return years + (years === 1 ? ' rok' : years < 5 ? ' roky' : ' let');
    return years + (years === 1 ? ' rok ' : years < 5 ? ' roky ' : ' let ') + rest + ' měs.';
  };

  const monthlyPayment = (principal, annualRate, months) => {
    if (principal <= 0) return 0;
    if (!Number.isFinite(months) || months <= 0) return NaN;
    const monthlyRate = annualRate / 100 / 12;
    if (Math.abs(monthlyRate) < 1e-12) return principal / months;
    return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
  };

  const amortize = (principal, annualRate, payment, maximumMonths = 1200) => {
    if (principal <= 0) {
      return { months: 0, interest: 0, totalPaid: 0, finalPayment: 0 };
    }
    if (!Number.isFinite(payment) || payment <= 0) {
      throw new Error('Měsíční splátka musí být vyšší než nula.');
    }

    const monthlyRate = annualRate / 100 / 12;
    if (monthlyRate > 0 && payment <= principal * monthlyRate + 0.005) {
      throw new Error('Zadaná splátka nepokrývá ani měsíční úrok. Zkontrolujte skutečnou splátku.');
    }

    let balance = principal;
    let interestTotal = 0;
    let totalPaid = 0;
    let months = 0;
    let finalPayment = 0;

    while (balance > 0.005 && months < maximumMonths) {
      const interest = balance * monthlyRate;
      const due = balance + interest;
      const paid = Math.min(payment, due);
      balance = Math.max(0, due - paid);
      interestTotal += interest;
      totalPaid += paid;
      finalPayment = paid;
      months += 1;
    }

    if (balance > 0.005) {
      throw new Error('Zadaná splátka by vedla k mimořádně dlouhému splácení. Zkontrolujte vstupy.');
    }

    return {
      months,
      interest: interestTotal,
      totalPaid,
      finalPayment
    };
  };

  const validate = (values) => {
    if (!Number.isFinite(values.balance) || values.balance < 10000) {
      throw new Error('Zůstatek hypotéky musí být alespoň 10 000 Kč.');
    }
    if (!Number.isFinite(values.extra) || values.extra < 1000 || values.extra > values.balance) {
      throw new Error('Mimořádná splátka musí být alespoň 1 000 Kč a nesmí převýšit zůstatek hypotéky.');
    }
    if (!Number.isFinite(values.rate) || values.rate < 0 || values.rate > 30) {
      throw new Error('Úroková sazba musí být mezi 0 a 30 % ročně.');
    }
    if (!Number.isInteger(values.termMonths) || values.termMonths < 1 || values.termMonths > 600) {
      throw new Error('Zbývající doba musí být od 1 měsíce do 50 let.');
    }
    if (!['shorten', 'reduce'].includes(values.strategy)) {
      throw new Error('Vyberte platnou strategii přepočtu.');
    }
    ['actualPayment', 'fee', 'taxLoss', 'reserve', 'monthlyExpenses'].forEach((key) => {
      if (!Number.isFinite(values[key]) || values[key] < 0) {
        throw new Error('Náklady, splátka ani rezerva nemohou být záporné.');
      }
    });
  };

  const calculate = (values) => {
    validate(values);

    const modelPayment = monthlyPayment(values.balance, values.rate, values.termMonths);
    const originalPayment = values.actualPayment > 0 ? values.actualPayment : modelPayment;
    const original = amortize(values.balance, values.rate, originalPayment);
    const newPrincipal = Math.max(0, values.balance - values.extra);

    const shorten = newPrincipal === 0
      ? { months: 0, interest: 0, totalPaid: 0, finalPayment: 0 }
      : amortize(newPrincipal, values.rate, originalPayment);

    const reducedPayment = newPrincipal === 0
      ? 0
      : monthlyPayment(newPrincipal, values.rate, values.termMonths);
    const reduce = newPrincipal === 0
      ? { months: 0, interest: 0, totalPaid: 0, finalPayment: 0 }
      : amortize(newPrincipal, values.rate, reducedPayment);

    const costs = values.fee + values.taxLoss;
    const shortenGrossSaving = Math.max(0, original.interest - shorten.interest);
    const reduceGrossSaving = Math.max(0, original.interest - reduce.interest);
    const shortenNetSaving = shortenGrossSaving - costs;
    const reduceNetSaving = reduceGrossSaving - costs;
    const selected = values.strategy === 'reduce' ? reduce : shorten;
    const selectedPayment = newPrincipal === 0
      ? 0
      : values.strategy === 'reduce' ? reducedPayment : originalPayment;
    const grossSaving = values.strategy === 'reduce' ? reduceGrossSaving : shortenGrossSaving;
    const netSaving = values.strategy === 'reduce' ? reduceNetSaving : shortenNetSaving;
    const timeSaved = Math.max(0, original.months - selected.months);
    const paymentReduction = Math.max(0, originalPayment - selectedPayment);

    return {
      ...values,
      modelPayment,
      originalPayment,
      original,
      newPrincipal,
      shorten,
      reduce,
      reducedPayment,
      selected,
      selectedPayment,
      costs,
      grossSaving,
      netSaving,
      timeSaved,
      paymentReduction,
      shortenGrossSaving,
      reduceGrossSaving,
      shortenNetSaving,
      reduceNetSaving
    };
  };

  const readValues = () => {
    if (activeMode === 'basic') {
      return {
        mode: 'basic',
        balance: numericValue(refs.basicBalance),
        extra: numericValue(refs.basicExtra),
        rate: numericValue(refs.basicRate),
        termMonths: Math.max(0, Math.round(numericValue(refs.basicYears) * 12)),
        actualPayment: 0,
        strategy: 'shorten',
        fee: 0,
        taxLoss: 0,
        reserve: 0,
        monthlyExpenses: 0
      };
    }

    return {
      mode: 'pro',
      balance: numericValue(refs.proBalance),
      extra: numericValue(refs.proExtra),
      rate: numericValue(refs.proRate),
      termMonths: Math.round(numericValue(refs.proYears) * 12 + numericValue(refs.proMonths)),
      actualPayment: numericValue(refs.proActualPayment),
      strategy: refs.proStrategy.value,
      fee: numericValue(refs.proFee),
      taxLoss: numericValue(refs.proTaxLoss),
      reserve: numericValue(refs.proReserve),
      monthlyExpenses: numericValue(refs.proMonthlyExpenses)
    };
  };

  const setText = (element, value) => {
    if (element) element.textContent = value;
  };

  const updateStatusClass = (netSaving) => {
    refs.statusBadge.classList.toggle('is-warning', netSaving <= 0);
    refs.statusBadge.classList.toggle('is-positive', netSaving > 0);
  };

  const comparisonRow = (label, paymentValue, schedule, savingValue) => {
    return '<tr>' +
      '<td data-label="Varianta">' + label + '</td>' +
      '<td data-label="Měsíční splátka">' + money(paymentValue) + '</td>' +
      '<td data-label="Zbývající doba">' + monthsText(schedule.months) + '</td>' +
      '<td data-label="Budoucí úroky">' + money(schedule.interest) + '</td>' +
      '<td data-label="Čistá úspora">' + money(savingValue) + '</td>' +
      '</tr>';
  };

  const renderResult = (result) => {
    const reduceSelected = result.strategy === 'reduce';
    const strategyLabel = reduceSelected ? 'nižší splátka' : 'kratší doba';
    const netLabel = result.netSaving > 0
      ? 'Model ukazuje kladný čistý přínos'
      : result.netSaving === 0
        ? 'Přínos po nákladech vychází nulový'
        : 'Zadané náklady převyšují úsporu';

    setText(refs.modeStatus, result.mode === 'basic' ? 'Basic' : 'PRO');
    setText(refs.netSavingResult, money(result.netSaving));
    setText(refs.statusBadge, netLabel);
    updateStatusClass(result.netSaving);
    setText(
      refs.resultLead,
      reduceSelected
        ? 'Měsíční splátka klesne přibližně o ' + money(result.paymentReduction) + '. Úvěr ale zůstane naplánovaný na původní dobu.'
        : 'Při zachování splátky se modelová doba zkrátí přibližně o ' + monthsText(result.timeSaved) + '.'
    );

    setText(refs.originalInterestResult, money(result.original.interest));
    setText(refs.newInterestResult, money(result.selected.interest));
    const interestMaximum = Math.max(result.original.interest, result.selected.interest, 1);
    refs.originalInterestBar.style.width = Math.min(100, result.original.interest / interestMaximum * 100) + '%';
    refs.newInterestBar.style.width = Math.min(100, result.selected.interest / interestMaximum * 100) + '%';

    setText(refs.originalPaymentResult, money(result.originalPayment));
    setText(refs.newPaymentResult, money(result.selectedPayment));
    setText(refs.timeSavedResult, monthsText(result.timeSaved));
    setText(refs.newPrincipalResult, money(result.newPrincipal));
    setText(
      refs.strategyHeadline,
      reduceSelected ? 'Snížit povinnou splátku a držet původní konec' : 'Zachovat splátku a skončit dřív'
    );
    setText(
      refs.decisionText,
      'Hrubá úspora úroků je ' + money(result.grossSaving) +
      '. Po odečtení nákladů ' + money(result.costs) +
      ' vychází čistý modelový přínos ' + money(result.netSaving) + '.'
    );

    if (result.mode === 'pro') {
      if (result.monthlyExpenses > 0) {
        const reserveMonths = result.reserve / result.monthlyExpenses;
        const reserveLabel = reserveMonths >= 6
          ? 'Silná rezerva'
          : reserveMonths >= 3
            ? 'Základní rezerva'
            : 'Nízká rezerva';
        setText(refs.reserveStatus, reserveLabel + ' • ' + decimalFormatter.format(reserveMonths) + ' měs.');
        setText(
          refs.reserveText,
          reserveMonths >= 3
            ? 'Zadaná hotovost pokrývá alespoň tři měsíce nezbytných výdajů.'
            : 'Po splátce zůstává méně než tři měsíce nezbytných výdajů.'
        );
      } else {
        setText(refs.reserveStatus, 'Výdaje nejsou zadané');
        setText(refs.reserveText, 'Pro kontrolu rezervy doplňte nezbytné měsíční výdaje.');
      }
    } else {
      setText(refs.reserveStatus, 'V Basic režimu nekontrolována');
      setText(refs.reserveText, 'Pro kontrolu likvidity otevřete PRO.');
    }

    setText(refs.shortenSaving, money(result.shortenNetSaving));
    setText(refs.shortenMeta, 'konec za ' + monthsText(result.shorten.months));
    setText(refs.reduceSaving, money(result.reduceNetSaving));
    setText(refs.reduceMeta, 'splátka ' + money(result.reducedPayment));

    const shortenPayment = result.newPrincipal === 0 ? 0 : result.originalPayment;
    refs.comparisonBody.innerHTML =
      comparisonRow('Původní hypotéka', result.originalPayment, result.original, 0) +
      comparisonRow('Zachovat splátku', shortenPayment, result.shorten, result.shortenNetSaving) +
      comparisonRow('Snížit splátku', result.reducedPayment, result.reduce, result.reduceNetSaving);

    setText(
      refs.detailHeadline,
      reduceSelected
        ? 'Povinná splátka klesne, ale hypotéka běží dál.'
        : 'Stejná splátka ukrajuje nižší jistinu rychleji.'
    );
    setText(
      refs.detailText,
      'Nová jistina je ' + money(result.newPrincipal) +
      '. Vybraná varianta počítá s budoucími úroky ' + money(result.selected.interest) +
      ' a dobou ' + monthsText(result.selected.months) + '.'
    );
    setText(refs.checkPayment, money(result.originalPayment));
    setText(refs.checkStrategy, strategyLabel);
    setText(refs.checkCosts, money(result.costs));

    setText(refs.heroExtraPayment, money(result.extra));
    setText(refs.heroSaving, money(result.grossSaving));
    setText(refs.heroStrategy, strategyLabel);
    setText(refs.heroPrincipal, money(result.newPrincipal));
    setText(refs.heroTime, monthsText(result.timeSaved));
    setText(refs.heroNet, money(result.netSaving));
  };

  const showError = (message) => {
    refs.formError.hidden = false;
    refs.formError.textContent = message;
  };

  const clearError = () => {
    refs.formError.hidden = true;
    refs.formError.textContent = '';
  };

  const render = ({ scrollToResult = false } = {}) => {
    try {
      const result = calculate(readValues());
      lastValidResult = result;
      clearError();
      renderResult(result);
      if (scrollToResult && window.matchMedia('(max-width: 920px)').matches) {
        const resultBox = refs.netSavingResult.closest('.dc-result');
        if (resultBox) resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return result;
    } catch (error) {
      showError(error.message || 'Zkontrolujte zadané hodnoty.');
      return lastValidResult;
    }
  };

  const syncBasicToPro = () => {
    refs.proBalance.value = refs.basicBalance.value;
    refs.proExtra.value = refs.basicExtra.value;
    refs.proRate.value = refs.basicRate.value;
    const totalMonths = Math.max(1, Math.round(numericValue(refs.basicYears) * 12));
    refs.proYears.value = Math.floor(totalMonths / 12);
    refs.proMonths.value = totalMonths % 12;
    refs.proActualPayment.value = 0;
    refs.proStrategy.value = 'shorten';
  };

  const syncProToBasic = () => {
    refs.basicBalance.value = refs.proBalance.value;
    refs.basicExtra.value = refs.proExtra.value;
    refs.basicRate.value = refs.proRate.value;
    const years = numericValue(refs.proYears) + numericValue(refs.proMonths) / 12;
    refs.basicYears.value = Math.max(0.1, Math.round(years * 10) / 10);
  };

  const setMode = (mode, { preserveValues = true } = {}) => {
    if (!['basic', 'pro'].includes(mode) || mode === activeMode) return;

    if (preserveValues) {
      if (mode === 'pro') syncBasicToPro();
      else syncProToBasic();
    }

    activeMode = mode;
    const basic = mode === 'basic';
    refs.basicTab.classList.toggle('is-active', basic);
    refs.proTab.classList.toggle('is-active', !basic);
    refs.basicTab.setAttribute('aria-selected', String(basic));
    refs.proTab.setAttribute('aria-selected', String(!basic));
    refs.basicTab.tabIndex = basic ? 0 : -1;
    refs.proTab.tabIndex = basic ? -1 : 0;
    refs.basicFields.hidden = !basic;
    refs.proFields.hidden = basic;
    refs.switchToPro.hidden = !basic;
    setText(refs.formModeLabel, basic ? 'Stačí 4 údaje' : 'Přesnější bankovní scénář');
    setText(
      refs.formModeText,
      basic
        ? 'Zadejte aktuální zůstatek hypotéky, částku navíc, sazbu a zbývající dobu. Výsledek ukáže dopad při zachování dnešní modelové splátky.'
        : 'Doplňte přesnou dobu, skutečnou splátku, strategii, náklady a rezervu. Nulová skutečná splátka ponechá standardní anuitní model.'
    );
    render();
  };

  const applyPreset = (name) => {
    const preset = presets[name];
    if (!preset) return;

    refs.basicBalance.value = preset.balance;
    refs.basicExtra.value = preset.extra;
    refs.basicRate.value = preset.rate;
    refs.basicYears.value = preset.years + preset.months / 12;
    refs.proBalance.value = preset.balance;
    refs.proExtra.value = preset.extra;
    refs.proRate.value = preset.rate;
    refs.proYears.value = preset.years;
    refs.proMonths.value = preset.months;
    refs.proActualPayment.value = preset.actualPayment;
    refs.proStrategy.value = preset.strategy;
    refs.proFee.value = preset.fee;
    refs.proTaxLoss.value = preset.taxLoss;
    refs.proReserve.value = preset.reserve;
    refs.proMonthlyExpenses.value = preset.monthlyExpenses;
    render();
  };

  const resetAll = () => {
    applyPreset('balanced');
    if (activeMode !== 'basic') {
      activeMode = 'pro';
      setMode('basic', { preserveValues: false });
    }
    clearError();
    render();
  };

  const resultAsText = () => {
    const result = lastValidResult;
    if (!result) return '';
    const strategy = result.strategy === 'reduce' ? 'snížení splátky' : 'zkrácení doby';
    return [
      'Mimořádná splátka hypotéky – orientační výsledek',
      'Zůstatek: ' + money(result.balance),
      'Mimořádná splátka: ' + money(result.extra),
      'Strategie: ' + strategy,
      'Čistá úspora: ' + money(result.netSaving),
      'Původní splátka: ' + money(result.originalPayment),
      'Nová splátka: ' + money(result.selectedPayment),
      'Nová jistina: ' + money(result.newPrincipal),
      'Zbývající doba: ' + monthsText(result.selected.months),
      'Budoucí úroky: ' + money(result.selected.interest),
      'Zdroj: rychlevypocty.cz/mimoradna-splatka-hypoteky-kalkulacka.html'
    ].join('\n');
  };

  const copyText = async () => {
    const text = resultAsText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setText(refs.copyResult, 'Zkopírováno');
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      setText(refs.copyResult, 'Zkopírováno');
    }
    window.setTimeout(() => setText(refs.copyResult, 'Kopírovat výsledek'), 1600);
  };

  const inputIds = [
    'basicBalance', 'basicExtra', 'basicRate', 'basicYears',
    'proBalance', 'proExtra', 'proRate', 'proYears', 'proMonths',
    'proActualPayment', 'proStrategy', 'proFee', 'proTaxLoss',
    'proReserve', 'proMonthlyExpenses'
  ];

  refs.basicTab.addEventListener('click', () => setMode('basic'));
  refs.proTab.addEventListener('click', () => setMode('pro'));
  [refs.basicTab, refs.proTab].forEach((tab) => tab.addEventListener('keydown', (event) => {
    const tabs = [refs.basicTab, refs.proTab];
    const current = tabs.indexOf(document.activeElement);
    let next = current;
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    setMode(next === 0 ? 'basic' : 'pro');
    tabs[next].focus();
  }));
  refs.switchToPro.addEventListener('click', () => setMode('pro'));
  refs.resetBtn.addEventListener('click', resetAll);
  refs.copyResult.addEventListener('click', copyText);
  refs.printResult.addEventListener('click', () => window.print());

  document.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => applyPreset(button.dataset.preset));
  });

  inputIds.forEach((id) => {
    const element = $(id);
    element.addEventListener('input', () => render());
    element.addEventListener('change', () => render());
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    render({ scrollToResult: true });
  });

  window.mrpCalculator = Object.freeze({
    monthlyPayment,
    amortize,
    calculate
  });

  render();
})();
