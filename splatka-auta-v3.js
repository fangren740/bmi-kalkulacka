(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const form = byId('carLoanForm');
  if (!form) return;

  const ids = [
    'carPrice', 'downPayment', 'interestRate', 'loanMonths', 'initialFee',
    'monthlyFee', 'requiredInsurance', 'balloonPayment', 'monthlyIncome',
    'otherObligations', 'targetShare', 'cashReserve', 'compareDown',
    'compareMonths', 'compareRate', 'compareBalloon', 'compareInitialFee',
    'compareMonthlyExtras'
  ];
  const field = Object.fromEntries(ids.map((id) => [id, byId(id)]));
  const compareToggle = byId('compareEnabled');
  const compareFields = byId('compareFields');
  const proSettings = byId('proSettings');

  const presets = {
    standard: { carPrice: 650000, downPayment: 130000, interestRate: 6.49, loanMonths: 60 },
    used: { carPrice: 350000, downPayment: 100000, interestRate: 7.2, loanMonths: 48 },
    short: { carPrice: 650000, downPayment: 180000, interestRate: 5.9, loanMonths: 36 }
  };

  const defaults = {
    ...presets.standard,
    initialFee: 0,
    monthlyFee: 0,
    requiredInsurance: 0,
    balloonPayment: 0,
    monthlyIncome: 50000,
    otherObligations: 5000,
    targetShare: 30,
    cashReserve: 150000,
    compareDown: 100000,
    compareMonths: 72,
    compareRate: 5.9,
    compareBalloon: 100000,
    compareInitialFee: 5000,
    compareMonthlyExtras: 1200
  };

  const money = new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0
  });
  const number = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const rate = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

  const value = (element) => {
    const parsed = Number.parseFloat(String(element?.value ?? '').replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const clamp = (num, min, max) => Math.min(max, Math.max(min, num));
  const setText = (id, text) => {
    const element = byId(id);
    if (element) element.textContent = text;
  };

  function monthlyPayment(principal, annualRate, months, balloon = 0) {
    if (principal <= 0 || months <= 0) return 0;
    const monthlyRate = annualRate / 1200;
    if (monthlyRate === 0) return Math.max(0, (principal - balloon) / months);
    const factor = Math.pow(1 + monthlyRate, months);
    return Math.max(0, (principal - balloon / factor) * monthlyRate / (1 - 1 / factor));
  }

  function collectPrimary() {
    const data = {
      price: value(field.carPrice),
      down: value(field.downPayment),
      annualRate: value(field.interestRate),
      months: Math.round(value(field.loanMonths)),
      initialFee: value(field.initialFee),
      monthlyFee: value(field.monthlyFee),
      insurance: value(field.requiredInsurance),
      balloon: value(field.balloonPayment),
      income: value(field.monthlyIncome),
      obligations: value(field.otherObligations),
      targetShare: value(field.targetShare),
      reserve: value(field.cashReserve)
    };
    data.principal = data.price - data.down;
    data.monthlyExtras = data.monthlyFee + data.insurance;
    return data;
  }

  function validate(data) {
    if (data.price < 50000) return 'Zadejte cenu auta alespoň 50 000 Kč.';
    if (data.down < 0 || data.down >= data.price) return 'Vlastní peníze musí být nižší než cena auta.';
    if (data.months < 6 || data.months > 120) return 'Doba splácení musí být od 6 do 120 měsíců.';
    if (data.annualRate < 0 || data.annualRate > 50) return 'Roční sazba musí být od 0 do 50 %.';
    if (data.balloon < 0 || data.balloon >= data.principal) return 'Závěrečný doplatek musí být nižší než financovaná částka.';
    if ([data.initialFee, data.monthlyFee, data.insurance, data.income, data.obligations, data.reserve].some((item) => item < 0)) {
      return 'Poplatky, příjmy a rezerva nemohou být záporné.';
    }
    return '';
  }

  function calculate(data) {
    const payment = monthlyPayment(data.principal, data.annualRate, data.months, data.balloon);
    const monthlyOutflow = payment + data.monthlyExtras;
    const interestCost = payment * data.months + data.balloon - data.principal;
    const serviceCost = data.initialFee + data.monthlyExtras * data.months;
    const totalPaid = data.down + payment * data.months + data.balloon + serviceCost;
    const creditCost = totalPaid - data.price;
    const effectiveMonthly = totalPaid / data.months;
    const commitment = monthlyOutflow + data.obligations;
    const budgetShare = data.income > 0 ? commitment / data.income * 100 : 0;
    const freeAfter = data.income - commitment;
    const neededIncome = data.targetShare > 0 ? commitment / (data.targetShare / 100) : 0;
    return {
      ...data,
      payment,
      monthlyOutflow,
      interestCost,
      serviceCost,
      totalPaid,
      creditCost,
      effectiveMonthly,
      commitment,
      budgetShare,
      freeAfter,
      neededIncome,
      downShare: data.price > 0 ? data.down / data.price * 100 : 0,
      balloonShare: data.price > 0 ? data.balloon / data.price * 100 : 0
    };
  }

  function renderError(message) {
    setText('monthlyPayment', '—');
    setText('resultStatus', 'Zkontrolujte zadání');
    setText('resultFormulaNote', message);
    const panel = byId('decisionPanel');
    if (panel) {
      panel.className = 'auto-loan-decision is-danger';
      panel.innerHTML = '<strong>Výpočet nelze dokončit</strong><p>' + message + '</p>';
    }
  }

  function renderHero(result) {
    setText('heroCarPrice', money.format(result.price));
    setText('heroLoanAmount', 'financováno ' + money.format(result.principal));
    setText('heroMonthly', money.format(result.payment));
    setText('heroTerms', result.months + ' měsíců · ' + rate.format(result.annualRate) + ' % p. a.');
    setText('heroDown', money.format(result.down));
    setText('heroCreditCost', money.format(result.creditCost));
    setText('heroTotal', money.format(result.totalPaid));
  }

  function renderBudget(result) {
    const panel = byId('budgetPanel');
    if (!panel) return;
    if (result.income <= 0) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    setText('budgetUse', decimal.format(result.budgetShare) + ' %');
    const bar = byId('budgetBar');
    if (bar) bar.style.width = clamp(result.budgetShare, 0, 100) + '%';
    const budgetText = result.freeAfter >= 0
      ? 'Po zadaných splátkách a závazcích zbývá ' + money.format(result.freeAfter) + ' měsíčně před běžnými výdaji domácnosti.'
      : 'Zadané splátky a závazky převyšují příjem o ' + money.format(Math.abs(result.freeAfter)) + ' měsíčně.';
    setText('budgetText', budgetText);
  }

  function renderDecision(result) {
    const panel = byId('decisionPanel');
    if (!panel) return;
    let tone = '';
    let title = 'Čtěte splátku spolu s rezervou';
    let text = 'V rozpočtu ponechte palivo, pojištění, servis, pneumatiky a horší měsíc.';

    if (result.income > 0 && result.freeAfter < 0) {
      tone = 'is-danger';
      title = 'Zadaný rozpočet nevychází';
      text = 'Splátka a ostatní závazky jsou vyšší než uvedený čistý příjem.';
    } else if (result.income > 0 && result.budgetShare > result.targetShare) {
      tone = 'is-warning';
      title = 'Výsledek překračuje váš kontrolní podíl';
      text = 'Nejde o hranici schválení, ale o signál pro levnější auto, vyšší vlastní vklad nebo delší přípravu.';
    } else if (result.balloonShare > 25) {
      tone = 'is-warning';
      title = 'Nízkou splátku vytváří vysoký doplatek';
      text = 'Na konci zůstává více než čtvrtina ceny auta. Připravte zdroj doplacení bez spoléhání na budoucí refinancování.';
    } else if (result.downShare < 10) {
      tone = 'is-warning';
      title = 'Vlastní vklad je nízký';
      text = 'Financujete téměř celou cenu auta. Porovnejte úvěr také s variantou, ve které nejdřív navýšíte vlastní prostředky.';
    }
    panel.className = 'auto-loan-decision' + (tone ? ' ' + tone : '');
    panel.innerHTML = '<strong>' + title + '</strong><p>' + text + '</p>';
  }

  function makeRow(label, displayedValue, meaning) {
    const row = document.createElement('tr');
    [label, displayedValue, meaning].forEach((text, index) => {
      const cell = document.createElement(index === 0 ? 'th' : 'td');
      cell.textContent = text;
      if (index > 0) cell.dataset.label = index === 1 ? 'Hodnota' : 'Co znamená';
      row.appendChild(cell);
    });
    return row;
  }

  function renderSummary(result) {
    const body = byId('summaryTableBody');
    if (!body) return;
    body.replaceChildren(
      makeRow('Cena auta', money.format(result.price), 'Pořizovací cena použitá ve výpočtu'),
      makeRow('Vlastní peníze', money.format(result.down), decimal.format(result.downShare) + ' % ceny zaplaceno předem'),
      makeRow('Financovaná jistina', money.format(result.principal), 'Cena auta po odečtení vlastních peněz'),
      makeRow('Měsíční splátka úvěru', money.format(result.payment), 'Anuitní platba bez dalších služeb'),
      makeRow('Úrok za celou dobu', money.format(result.interestCost), 'Součet úrokové části splátek'),
      makeRow('Poplatky a služby', money.format(result.serviceCost), 'Jednorázové a zadané měsíční náklady'),
      makeRow('Závěrečný doplatek', money.format(result.balloon), 'Jistina ponechaná na konec'),
      makeRow('Celkem zaplaceno', money.format(result.totalPaid), 'Všechny modelované platby včetně vlastních peněz'),
      makeRow('Náklady financování', money.format(result.creditCost), 'Celkem zaplaceno minus cena auta')
    );

    setText('checkDownShare', decimal.format(result.downShare) + ' %');
    setText('checkBalloonShare', decimal.format(result.balloonShare) + ' %');
    setText('checkExtras', money.format(result.serviceCost));
    setText('checkNeededIncome', money.format(result.neededIncome));

    let headline = 'Splátka je jen jedna část ceny auta.';
    let detail = 'Úplná cena financování činí ' + money.format(result.totalPaid) + ', tedy o ' + money.format(result.creditCost) + ' více než pořizovací cena.';
    if (result.monthlyExtras > 0 || result.initialFee > 0) {
      headline = 'Povinné služby mění skutečný měsíční odtok.';
      detail = 'Čistá splátka je ' + money.format(result.payment) + ', ale se zadanými službami odchází ' + money.format(result.monthlyOutflow) + ' měsíčně.';
    }
    if (result.balloon > 0) {
      headline = 'Část dluhu zůstává až na poslední den.';
      detail = 'Běžná splátka je nižší díky závěrečnému doplatku ' + money.format(result.balloon) + '. Ten musí mít vlastní plán úhrady.';
    }
    setText('detailHeadline', headline);
    setText('detailText', detail);
  }

  function renderReserve(result) {
    const months = result.income > 0 ? result.reserve / result.income : 0;
    let headline = 'Po akontaci ponechte rezervu mimo auto';
    let text = 'Zadaná rezerva je ' + money.format(result.reserve) + '. Vhodnou výši určují celé nezbytné výdaje domácnosti, ne pouze příjem.';
    if (result.income > 0) {
      text = 'Zadaná rezerva ' + money.format(result.reserve) + ' odpovídá přibližně ' + decimal.format(months) + 'násobku uvedeného čistého příjmu. Nejde o počet měsíců krytí výdajů, dokud nezapočítáte celý rozpočet.';
    }
    if (result.reserve < result.monthlyOutflow * 3) {
      headline = 'Rezerva je nízká i vůči samotným splátkám';
    }
    setText('reserveHeadline', headline);
    setText('reserveText', text);
  }

  function renderSchedule(result) {
    const body = byId('scheduleBody');
    if (!body) return;
    const checkpoints = new Set([1, result.months]);
    for (let month = 12; month < result.months; month += 12) checkpoints.add(month);
    const monthlyRate = result.annualRate / 1200;
    let balance = result.principal;
    const rows = [];
    for (let month = 1; month <= result.months; month += 1) {
      const interest = balance * monthlyRate;
      const principalPaid = Math.min(balance, Math.max(0, result.payment - interest));
      balance = Math.max(result.balloon, balance - principalPaid);
      if (!checkpoints.has(month)) continue;
      const row = document.createElement('tr');
      const values = [
        [String(month), 'Měsíc'],
        [money.format(result.payment), 'Splátka'],
        [money.format(interest), 'Úrok'],
        [money.format(principalPaid), 'Uhrazená jistina'],
        [money.format(balance), 'Zůstatek']
      ];
      values.forEach(([text, label]) => {
        const cell = document.createElement('td');
        cell.textContent = text;
        cell.dataset.label = label;
        row.appendChild(cell);
      });
      rows.push(row);
    }
    body.replaceChildren(...rows);
  }

  function collectCompare(price) {
    const data = {
      price,
      down: value(field.compareDown),
      annualRate: value(field.compareRate),
      months: Math.round(value(field.compareMonths)),
      initialFee: value(field.compareInitialFee),
      monthlyFee: value(field.compareMonthlyExtras),
      insurance: 0,
      balloon: value(field.compareBalloon),
      income: 0,
      obligations: 0,
      targetShare: 30,
      reserve: 0
    };
    data.principal = data.price - data.down;
    data.monthlyExtras = data.monthlyFee;
    return data;
  }

  function renderCompare(primary) {
    const panel = byId('compareResult');
    if (!panel) return;
    if (!compareToggle?.checked) {
      panel.hidden = true;
      return;
    }
    const dataB = collectCompare(primary.price);
    const error = validate(dataB);
    panel.hidden = false;
    if (error) {
      setText('compareWinner', 'Zkontrolujte nabídku B');
      setText('compareDifference', error);
      return;
    }
    const resultB = calculate(dataB);
    const difference = Math.abs(primary.totalPaid - resultB.totalPaid);
    const primaryWins = primary.totalPaid <= resultB.totalPaid;
    setText('compareWinner', primaryWins ? 'Nabídka A má nižší modelované platby' : 'Nabídka B má nižší modelované platby');
    setText('compareATotal', money.format(primary.totalPaid));
    setText('compareBTotal', money.format(resultB.totalPaid));
    setText('compareDifference', 'Rozdíl úplných modelovaných plateb je ' + money.format(difference) + '. Porovnejte také vlastnictví, pojištění a flexibilitu.');
  }

  function advancedIsActive(result) {
    return proSettings?.open || compareToggle?.checked || result.initialFee > 0 || result.monthlyExtras > 0 || result.balloon > 0;
  }

  function render() {
    const data = collectPrimary();
    const error = validate(data);
    if (error) {
      renderError(error);
      return null;
    }
    const result = calculate(data);
    const isPro = advancedIsActive(result);

    setText('modeBadge', isPro ? 'PRO režim' : 'Základní režim');
    setText('monthlyPayment', money.format(result.payment));
    setText('resultStatus', 'Výpočet připraven');
    setText('resultFormulaNote', result.monthlyExtras > 0 ? 'služby jsou oddělené níže' : 'bez dalších měsíčních služeb');
    setText('basePaymentResult', money.format(result.payment));
    setText('extrasResult', money.format(result.monthlyExtras));
    setText('monthlyOutflowResult', money.format(result.monthlyOutflow));
    setText('downResult', money.format(result.down));
    setText('loanAmountResult', money.format(result.principal));
    setText('totalPaidResult', money.format(result.totalPaid));
    setText('creditCostResult', money.format(result.creditCost));
    setText('balloonResult', money.format(result.balloon));
    setText('effectiveMonthlyResult', money.format(result.effectiveMonthly));

    renderHero(result);
    renderBudget(result);
    renderDecision(result);
    renderSummary(result);
    renderReserve(result);
    renderSchedule(result);
    renderCompare(result);
    return result;
  }

  document.querySelectorAll('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = presets[button.dataset.preset];
      if (!preset) return;
      Object.entries(preset).forEach(([key, presetValue]) => {
        if (field[key]) field[key].value = presetValue;
      });
      document.querySelectorAll('[data-preset]').forEach((item) => item.classList.toggle('is-active', item === button));
      render();
    });
  });

  compareToggle?.addEventListener('change', () => {
    compareFields.hidden = !compareToggle.checked;
    render();
  });
  proSettings?.addEventListener('toggle', render);
  form.addEventListener('input', render);
  form.addEventListener('change', render);
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = render();
    if (result && window.matchMedia('(max-width: 920px)').matches) {
      byId('vysledek')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  byId('resetBtn')?.addEventListener('click', () => {
    Object.entries(defaults).forEach(([key, defaultValue]) => {
      if (field[key]) field[key].value = defaultValue;
    });
    compareToggle.checked = false;
    compareFields.hidden = true;
    if (proSettings) proSettings.open = false;
    document.querySelectorAll('[data-preset]').forEach((item) => item.classList.toggle('is-active', item.dataset.preset === 'standard'));
    render();
  });

  byId('copyResult')?.addEventListener('click', async (event) => {
    const result = render();
    if (!result) return;
    const text = [
      'Kalkulačka splátky auta – RychléVýpočty.cz',
      'Cena auta: ' + money.format(result.price),
      'Vlastní peníze: ' + money.format(result.down),
      'Měsíční splátka: ' + money.format(result.payment),
      'Měsíční odtok se službami: ' + money.format(result.monthlyOutflow),
      'Celkem zaplaceno: ' + money.format(result.totalPaid),
      'Náklady financování: ' + money.format(result.creditCost),
      'Orientační výpočet, nikoli nabídka úvěru.'
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      event.currentTarget.textContent = 'Zkopírováno';
      window.setTimeout(() => { event.currentTarget.textContent = 'Kopírovat výsledek'; }, 1800);
    } catch (_error) {
      event.currentTarget.textContent = 'Kopírování se nezdařilo';
      window.setTimeout(() => { event.currentTarget.textContent = 'Kopírovat výsledek'; }, 1800);
    }
  });

  render();
})();
