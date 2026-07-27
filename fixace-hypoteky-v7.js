(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const inputs = [
    'principal','remainingYears','horizonYears','fixYearsA','rateA','followRateA','fixYearsB','rateB','followRateB',
    'feeA','feeB','monthlyFeeA','monthlyFeeB','cashReserve','netIncome','stressShock','paymentLimit'
  ];
  const defaults = {
    principal: '3500000', remainingYears: '25', horizonYears: '5', fixYearsA: '3', rateA: '4,49', followRateA: '4,10',
    fixYearsB: '5', rateB: '4,79', followRateB: '4,79', feeA: '0', feeB: '0', monthlyFeeA: '0', monthlyFeeB: '0',
    cashReserve: '300000', netIncome: '70000', stressShock: '2', paymentLimit: '26000'
  };
  let mode = 'basic';

  const parseNumber = (value) => {
    const normalized = String(value ?? '').trim().replace(/\s+/g, '').replace(',', '.');
    const number = Number.parseFloat(normalized);
    return Number.isFinite(number) ? number : NaN;
  };
  const read = (id) => parseNumber($(id)?.value);
  const money = (value) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(Number.isFinite(value) ? value : 0))} Kč`;
  const rate = (value) => `${new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0)} %`;
  const yearsLabel = (value) => {
    const n = Math.round(value);
    if (n === 1) return '1 rok';
    if (n >= 2 && n <= 4) return `${n} roky`;
    return `${n} let`;
  };
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function annuityPayment(principal, annualRate, months) {
    if (!(principal > 0) || !(months > 0)) return 0;
    const monthlyRate = Math.max(0, annualRate) / 100 / 12;
    if (monthlyRate === 0) return principal / months;
    return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
  }

  function simulate({ principal, years, horizonYears, firstRate, fixYears, followRate, oneTimeFee, monthlyFee }) {
    const totalMonths = Math.max(1, Math.round(years * 12));
    const horizonMonths = Math.min(totalMonths, Math.max(1, Math.round(horizonYears * 12)));
    const fixedMonths = Math.max(1, Math.round(fixYears * 12));
    let balance = principal;
    let currentPayment = annuityPayment(balance, firstRate, totalMonths);
    const firstPayment = currentPayment;
    let paymentAfterFix = firstPayment;
    let interest = 0;
    let principalPaid = 0;
    let cashPaid = 0;

    for (let month = 1; month <= horizonMonths; month += 1) {
      const remainingMonths = totalMonths - month + 1;
      const isAfterFix = month > fixedMonths;
      const annualRate = isAfterFix ? followRate : firstRate;
      if (month === fixedMonths + 1) {
        currentPayment = annuityPayment(balance, followRate, remainingMonths);
        paymentAfterFix = currentPayment;
      }
      const monthlyRate = Math.max(0, annualRate) / 100 / 12;
      const monthInterest = balance * monthlyRate;
      const monthPrincipal = Math.min(balance, Math.max(0, currentPayment - monthInterest));
      balance = Math.max(0, balance - monthPrincipal);
      interest += monthInterest;
      principalPaid += monthPrincipal;
      cashPaid += currentPayment + monthlyFee;
    }

    if (horizonMonths <= fixedMonths) {
      const balanceAtFix = balanceAfterMonths(principal, years, firstRate, Math.min(fixedMonths, totalMonths));
      const remainingAtFix = Math.max(1, totalMonths - fixedMonths);
      paymentAfterFix = fixedMonths < totalMonths ? annuityPayment(balanceAtFix, followRate, remainingAtFix) : 0;
    }

    const monthlyFeesTotal = monthlyFee * horizonMonths;
    return {
      firstPayment,
      paymentAfterFix,
      interest,
      principalPaid,
      balance,
      cashPaid,
      oneTimeFee,
      monthlyFeesTotal,
      totalCost: interest + oneTimeFee + monthlyFeesTotal,
      fixedMonths,
      horizonMonths
    };
  }

  function balanceAfterMonths(principal, years, annualRate, months) {
    const totalMonths = Math.max(1, Math.round(years * 12));
    const limit = Math.min(totalMonths, Math.max(0, Math.round(months)));
    const monthlyRate = Math.max(0, annualRate) / 100 / 12;
    const payment = annuityPayment(principal, annualRate, totalMonths);
    let balance = principal;
    for (let month = 0; month < limit; month += 1) {
      const interest = balance * monthlyRate;
      balance = Math.max(0, balance - Math.max(0, payment - interest));
    }
    return balance;
  }

  function currentValues() {
    const values = {};
    for (const id of inputs) values[id] = read(id);
    return values;
  }

  function validate(v) {
    const errors = [];
    if (!(v.principal > 0)) errors.push('Zadejte kladný zůstatek hypotéky.');
    if (!(v.remainingYears >= 1 && v.remainingYears <= 50)) errors.push('Zbývající splatnost musí být mezi 1 a 50 lety.');
    if (!(v.horizonYears >= 1 && v.horizonYears <= v.remainingYears)) errors.push('Horizont musí být nejméně 1 rok a nesmí překročit zbývající splatnost.');
    if (!(v.fixYearsA >= 1 && v.fixYearsB >= 1)) errors.push('Obě délky fixace musí být alespoň jeden rok.');
    if (!(v.fixYearsA < v.fixYearsB)) errors.push('Varianta A má být kratší než varianta B.');
    for (const id of ['rateA','followRateA','rateB','followRateB']) {
      if (!(v[id] >= 0 && v[id] <= 25)) errors.push('Sazby musí být v rozmezí 0 až 25 %.');
    }
    if (mode === 'advanced') {
      for (const id of ['feeA','feeB','monthlyFeeA','monthlyFeeB','cashReserve','netIncome','stressShock','paymentLimit']) {
        if (!(v[id] >= 0)) errors.push('Podrobné hodnoty nesmí být záporné.');
      }
    }
    return [...new Set(errors)];
  }

  function configuration(v, variant, overrideFollowRate = null) {
    const advanced = mode === 'advanced';
    const isA = variant === 'A';
    return {
      principal: v.principal,
      years: v.remainingYears,
      horizonYears: v.horizonYears,
      firstRate: isA ? v.rateA : v.rateB,
      fixYears: isA ? v.fixYearsA : v.fixYearsB,
      followRate: overrideFollowRate ?? (isA ? v.followRateA : v.followRateB),
      oneTimeFee: advanced ? (isA ? v.feeA : v.feeB) : 0,
      monthlyFee: advanced ? (isA ? v.monthlyFeeA : v.monthlyFeeB) : 0
    };
  }

  function findBreakEven(v, longResult) {
    const test = (followRate) => simulate(configuration(v, 'A', followRate)).totalCost - longResult.totalCost;
    let low = 0;
    let high = 20;
    let fLow = test(low);
    let fHigh = test(high);
    if (!Number.isFinite(fLow) || !Number.isFinite(fHigh) || fLow === 0) return low;
    if (fLow * fHigh > 0) return null;
    for (let i = 0; i < 70; i += 1) {
      const mid = (low + high) / 2;
      const fMid = test(mid);
      if (Math.abs(fMid) < 0.01) return mid;
      if (fLow * fMid <= 0) {
        high = mid;
        fHigh = fMid;
      } else {
        low = mid;
        fLow = fMid;
      }
    }
    return (low + high) / 2;
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }
  function setWidth(id, value) {
    const element = $(id);
    if (element) element.style.width = `${clamp(value, 0, 100)}%`;
  }
  function setLeft(id, value) {
    const element = $(id);
    if (element) element.style.left = `${clamp(value, 0, 100)}%`;
  }

  function calculate() {
    const v = currentValues();
    const errors = validate(v);
    const message = $('formMessage');
    if (message) message.textContent = errors[0] || '';
    if (errors.length) return;

    const a = simulate(configuration(v, 'A'));
    const b = simulate(configuration(v, 'B'));
    const difference = a.totalCost - b.totalCost;
    const absoluteDifference = Math.abs(difference);
    const closeThreshold = Math.max(5000, v.principal * 0.0015);
    const winner = absoluteDifference <= closeThreshold ? 'close' : difference < 0 ? 'A' : 'B';
    const breakEven = findBreakEven(v, b);
    const paymentGap = Math.abs(a.firstPayment - b.firstPayment);
    const certaintyMonths = Math.max(0, Math.round((v.fixYearsB - v.fixYearsA) * 12));

    let title;
    let reason;
    let status;
    if (winner === 'A') {
      title = 'Kratší fixace vychází levněji';
      reason = `Ve společném horizontu ${yearsLabel(v.horizonYears)} má nižší modelované úroky a započtené poplatky.`;
      status = 'cenová výhoda A';
    } else if (winner === 'B') {
      title = 'Delší fixace vychází levněji';
      reason = `Vyšší dnešní jistota v tomto scénáři současně přináší nižší modelované náklady.`;
      status = 'výhoda jistoty B';
    } else {
      title = 'Obě fixace jsou finančně blízko';
      reason = 'Rozdíl je malý vůči zůstatku hypotéky. Rozhodnout může jistota, flexibilita a kvalita nabídky.';
      status = 'těsný výsledek';
    }

    setText('winnerTitle', title);
    setText('winnerReason', reason);
    setText('resultStatus', status);
    setText('costDifference', money(absoluteDifference));
    setText('differenceDirection', winner === 'close' ? 'výsledek je těsný' : `ve prospěch varianty ${winner}`);
    setText('paymentA', money(a.firstPayment));
    setText('paymentB', money(b.firstPayment));
    setText('afterPaymentA', `po refixaci ${money(a.paymentAfterFix)}`);
    setText('afterPaymentB', v.horizonYears > v.fixYearsB ? `po refixaci ${money(b.paymentAfterFix)}` : 'bez refixace v horizontu');
    setText('paymentGap', money(paymentGap));
    setText('costA', money(a.totalCost));
    setText('costB', money(b.totalCost));
    setText('balanceA', money(a.balance));
    setText('balanceB', money(b.balance));
    setText('principalPaidA', money(a.principalPaid));
    setText('principalPaidB', money(b.principalPaid));
    setText('interestA', money(a.interest));
    setText('interestB', money(b.interest));
    setText('feesTotalA', money(a.oneTimeFee + a.monthlyFeesTotal));
    setText('feesTotalB', money(b.oneTimeFee + b.monthlyFeesTotal));
    setText('certaintyText', `O ${certaintyMonths} měsíců delší jistotu první sazby.`);

    if (breakEven === null) {
      setText('breakEvenRate', 'mimo rozsah');
      setText('breakEvenText', 'V testovaném rozsahu 0 až 20 % nevznikl společný bod nákladů. Zkontrolujte horizont a zadané poplatky.');
      setLeft('breakEvenMarker', 95);
    } else {
      setText('breakEvenRate', rate(breakEven));
      setText('breakEvenText', `Kratší fixace si drží cenovou výhodu, pokud její nová sazba zůstane přibližně pod ${rate(breakEven)}.`);
      setLeft('breakEvenMarker', breakEven / 10 * 100);
    }

    const fixShareA = Math.min(100, v.fixYearsA / v.horizonYears * 100);
    const fixShareB = Math.min(100, v.fixYearsB / v.horizonYears * 100);
    const timelineA = $('timelineA');
    const timelineB = $('timelineB');
    if (timelineA) timelineA.style.background = `linear-gradient(90deg,var(--green) 0 ${fixShareA}%,rgba(255,255,255,.30) ${fixShareA}% 100%)`;
    if (timelineB) timelineB.style.background = `linear-gradient(90deg,var(--amber) 0 ${fixShareB}%,rgba(255,255,255,.30) ${fixShareB}% 100%)`;
    setWidth('timelineA', 100);
    setWidth('timelineB', 100);
    setText('timelineLabelA', v.horizonYears > v.fixYearsA ? `${yearsLabel(v.fixYearsA)} fix + ${yearsLabel(v.horizonYears - v.fixYearsA)} refix` : `${yearsLabel(v.horizonYears)} v první fixaci`);
    setText('timelineLabelB', v.horizonYears > v.fixYearsB ? `${yearsLabel(v.fixYearsB)} fix + ${yearsLabel(v.horizonYears - v.fixYearsB)} refix` : `${yearsLabel(v.horizonYears)} v první fixaci`);

    const shock = mode === 'advanced' ? v.stressShock : 2;
    const stressRate = v.rateA + shock;
    const stressBalance = balanceAfterMonths(v.principal, v.remainingYears, v.rateA, v.fixYearsA * 12);
    const remainingMonthsAtRefix = Math.max(1, Math.round((v.remainingYears - v.fixYearsA) * 12));
    const stressedPayment = annuityPayment(stressBalance, stressRate, remainingMonthsAtRefix);
    const paymentShock = Math.max(0, stressedPayment - a.firstPayment);
    setText('stressPayment', `+${money(paymentShock)}/měs.`);
    let stressText = `Při sazbě vyšší o ${new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(shock)} p. b. by splátka kratší varianty vzrostla přibližně na ${money(stressedPayment)}.`;
    let stressPercent = 38;
    if (mode === 'advanced') {
      const overLimit = v.paymentLimit > 0 ? stressedPayment - v.paymentLimit : 0;
      const incomeShare = v.netIncome > 0 ? stressedPayment / v.netIncome * 100 : 0;
      const monthsCovered = paymentShock > 0 ? v.cashReserve / paymentShock : 999;
      if (overLimit > 0) stressText += ` Překročila by váš limit o ${money(overLimit)}.`;
      else if (v.paymentLimit > 0) stressText += ` Zůstala by pod vaším limitem.`;
      if (v.netIncome > 0) stressText += ` Samotná splátka by tvořila ${new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(incomeShare)} % čistého příjmu.`;
      if (paymentShock > 0 && Number.isFinite(monthsCovered)) stressText += ` Rezerva odpovídá přibližně ${new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(monthsCovered)} měsícům tohoto navýšení.`;
      stressPercent = v.paymentLimit > 0 ? stressedPayment / v.paymentLimit * 100 : incomeShare * 1.5;
    }
    setText('stressInterpretation', stressText);
    setWidth('stressMeter', stressPercent);

    setText('heroWinner', winner === 'A' ? 'Kratší fixace' : winner === 'B' ? 'Delší fixace' : 'Těsný výsledek');
    setText('heroDifference', winner === 'close' ? `rozdíl jen ${money(absoluteDifference)}` : `o ${money(absoluteDifference)}`);
    setText('heroFixA', yearsLabel(v.fixYearsA));
    setText('heroFixB', yearsLabel(v.fixYearsB));
    setText('heroPaymentA', money(a.firstPayment));
    setText('heroPaymentB', money(b.firstPayment));
    setText('heroThreshold', breakEven === null ? '—' : rate(breakEven));
    setText('heroThresholdMini', breakEven === null ? '—' : rate(breakEven));
    setWidth('heroThresholdBar', breakEven === null ? 20 : breakEven / 8 * 100);

    document.body.dataset.winner = winner;
    saveUrl(v);
  }

  function setMode(nextMode) {
    mode = nextMode === 'advanced' ? 'advanced' : 'basic';
    document.querySelectorAll('.mode-button').forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    const zone = $('advancedZone');
    if (zone) zone.hidden = mode !== 'advanced';
    calculate();
  }

  function setScenario(name) {
    const base = read('rateA');
    if (!Number.isFinite(base)) return;
    const values = { down: Math.max(0, base - 0.75), flat: base, up: base + 1.5 };
    const selected = values[name] ?? base;
    $('followRateA').value = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(selected);
    document.querySelectorAll('[data-scenario]').forEach((button) => button.classList.toggle('active', button.dataset.scenario === name));
    calculate();
  }

  function saveUrl(v = currentValues()) {
    try {
      const url = new URL(window.location.href);
      url.search = '';
      url.searchParams.set('rezim', mode);
      for (const id of inputs) {
        const value = Number.isFinite(v[id]) ? v[id] : read(id);
        if (Number.isFinite(value)) url.searchParams.set(id, String(value));
      }
      window.history.replaceState({}, '', url);
    } catch (_) {}
  }

  function loadUrl() {
    try {
      const params = new URLSearchParams(window.location.search);
      for (const id of inputs) {
        if (params.has(id) && $(id)) $(id).value = params.get(id);
      }
      if (params.get('rezim') === 'advanced') mode = 'advanced';
    } catch (_) {}
  }

  async function copyText(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      setText('formMessage', message);
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
      setText('formMessage', message);
    }
  }

  function reset() {
    for (const [id, value] of Object.entries(defaults)) if ($(id)) $(id).value = value;
    document.querySelectorAll('[data-scenario]').forEach((button) => button.classList.toggle('active', button.dataset.scenario === 'flat'));
    setMode('basic');
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadUrl();
    for (const id of inputs) $(id)?.addEventListener('input', calculate);
    $('fixationForm')?.addEventListener('submit', (event) => { event.preventDefault(); calculate(); });
    document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
    document.querySelectorAll('[data-scenario]').forEach((button) => button.addEventListener('click', () => setScenario(button.dataset.scenario)));
    $('resetForm')?.addEventListener('click', reset);
    $('copyLink')?.addEventListener('click', () => copyText(window.location.href, 'Odkaz s nastavením byl zkopírován.'));
    $('copyResult')?.addEventListener('click', () => {
      const text = `${$('winnerTitle')?.textContent || ''}\nRozdíl nákladů: ${$('costDifference')?.textContent || ''}\nSplátka A: ${$('paymentA')?.textContent || ''}\nSplátka B: ${$('paymentB')?.textContent || ''}\nBod zvratu: ${$('breakEvenRate')?.textContent || ''}\n${window.location.href}`;
      copyText(text, 'Výsledek byl zkopírován.');
    });
    setMode(mode);
  });
})();
