(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const all = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const num = (id) => {
    const el = $(id);
    const value = el ? Number(String(el.value).replace(',', '.')) : 0;
    return Number.isFinite(value) ? value : 0;
  };
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const money = (value) => `${Math.round(Number.isFinite(value) ? value : 0).toLocaleString('cs-CZ')} Kč`;
  const pct = (value, digits = 1) => `${(Number.isFinite(value) ? value : 0).toLocaleString('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;

  function paymentFromLoan(loan, annualRate, years) {
    const principal = Math.max(0, loan);
    const months = Math.max(1, Math.round(years * 12));
    const monthlyRate = Math.max(0, annualRate) / 100 / 12;
    if (monthlyRate === 0) return principal / months;
    const factor = Math.pow(1 + monthlyRate, months);
    return principal * monthlyRate * factor / (factor - 1);
  }

  function loanFromPayment(payment, annualRate, years) {
    const monthlyPayment = Math.max(0, payment);
    const months = Math.max(1, Math.round(years * 12));
    const monthlyRate = Math.max(0, annualRate) / 100 / 12;
    if (monthlyRate === 0) return monthlyPayment * months;
    return monthlyPayment * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate;
  }

  function readBasic() {
    return {
      mode: 'basic',
      income: Math.max(0, num('basicIncome')),
      savings: Math.max(0, num('basicSavings')),
      reserve: Math.max(0, num('basicReserve')),
      fixedCosts: Math.max(0, num('basicExtras')),
      percentCosts: 0,
      debts: Math.max(0, num('basicDebts')),
      rate: Math.max(0, num('basicRate')),
      years: clamp(num('basicYears'), 1, 40),
      ltv: clamp(num('basicLtv') / 100, 0, 1),
      dsti: clamp(num('basicDsti') / 100, 0, 1),
      appraisal: 1,
      livingCosts: 0,
      ownerCosts: 0,
      savingsGoal: 0,
      safetyFactor: 0.9,
      incomeStress: 0,
      rateStress: 2,
      targetPrice: 0,
      purpose: 'own'
    };
  }

  function readPro() {
    const stable = Math.max(0, num('proIncome1')) + Math.max(0, num('proIncome2'));
    const variable = Math.max(0, num('proVariableIncome')) * clamp(num('proVariableShare') / 100, 0, 1);
    return {
      mode: 'pro',
      income: stable + variable,
      savings: Math.max(0, num('proSavings')),
      reserve: Math.max(0, num('proReserve')),
      fixedCosts: Math.max(0, num('proFixedCosts')),
      percentCosts: clamp(num('proPercentCosts') / 100, 0, 0.5),
      debts: Math.max(0, num('proOtherDebts')),
      rate: Math.max(0, num('proRate')),
      years: clamp(num('proYears'), 1, 40),
      ltv: clamp(num('proLtv') / 100, 0, 1),
      dsti: clamp(num('proDsti') / 100, 0, 1),
      appraisal: clamp(num('proAppraisal') / 100, 0.5, 1.2),
      livingCosts: Math.max(0, num('proLivingCosts')),
      ownerCosts: Math.max(0, num('proOwnerCosts')),
      savingsGoal: Math.max(0, num('proSavingsGoal')),
      safetyFactor: clamp(num('proSafetyFactor') / 100, 0.6, 1),
      incomeStress: clamp(num('proIncomeStress') / 100, 0, 0.5),
      rateStress: Math.max(0, num('proRateStress')),
      targetPrice: Math.max(0, num('proTargetPrice')),
      purpose: $('proPurpose') ? $('proPurpose').value : 'own'
    };
  }

  function calculateModel(input, overrides = {}) {
    const x = { ...input, ...overrides };
    const effectiveIncome = Math.max(0, x.income * (1 - (x.incomeStress || 0)));
    const debtPaymentLimit = Math.max(0, effectiveIncome * x.dsti - x.debts);
    const practicalPaymentLimit = x.mode === 'pro'
      ? Math.max(0, effectiveIncome - x.livingCosts - x.debts - x.ownerCosts - x.savingsGoal)
      : debtPaymentLimit;
    const paymentCapacity = Math.max(0, Math.min(debtPaymentLimit, practicalPaymentLimit));
    const loanCapacity = loanFromPayment(paymentCapacity, x.rate, x.years);
    const effectiveLoanShare = clamp(x.ltv * x.appraisal, 0, 1);
    const incomeLimitPrice = effectiveLoanShare > 0 ? loanCapacity / effectiveLoanShare : 0;
    const availableCash = Math.max(0, x.savings - x.reserve - x.fixedCosts);
    const ownPriceShare = Math.max(0, 1 - effectiveLoanShare) + x.percentCosts;
    const cashLimitPrice = ownPriceShare > 0 ? availableCash / ownPriceShare : (availableCash > 0 ? Number.MAX_SAFE_INTEGER : 0);
    const technicalPrice = Math.max(0, Math.min(incomeLimitPrice, cashLimitPrice));
    const safePrice = technicalPrice * x.safetyFactor;
    const loan = Math.min(loanCapacity, safePrice * effectiveLoanShare);
    const payment = paymentFromLoan(loan, x.rate, x.years);
    const downPayment = Math.max(0, safePrice - loan);
    const ownCash = downPayment + x.fixedCosts + safePrice * x.percentCosts + x.reserve;
    const totalDebtRatio = effectiveIncome > 0 ? (payment + x.debts) / effectiveIncome * 100 : 0;
    const constraint = incomeLimitPrice <= cashLimitPrice ? 'příjem a splátková kapacita' : 'vlastní hotovost a LTV';
    const targetGap = x.targetPrice > 0 ? safePrice - x.targetPrice : 0;
    return {
      ...x,
      effectiveIncome,
      debtPaymentLimit,
      practicalPaymentLimit,
      paymentCapacity,
      loanCapacity,
      effectiveLoanShare,
      incomeLimitPrice,
      cashLimitPrice,
      technicalPrice,
      safePrice,
      loan,
      payment,
      downPayment,
      ownCash,
      availableCash,
      totalDebtRatio,
      constraint,
      targetGap
    };
  }

  let currentMode = 'basic';
  let currentResult = null;
  let activeStep = 1;

  function renderBar(id, value, max) {
    const el = $(id);
    if (!el) return;
    const width = max > 0 ? clamp(value / max * 100, 3, 100) : 0;
    el.style.width = `${width}%`;
  }

  function stressPrice(input, changes) {
    const stressed = calculateModel(input, changes);
    return stressed.safePrice;
  }

  function diffText(stressed, base) {
    const diff = stressed - base;
    const sign = diff > 0 ? '+' : '';
    return `${sign}${money(diff)} proti základu`;
  }

  function render(result) {
    currentResult = result;
    const maxLimit = Math.max(result.incomeLimitPrice, result.cashLimitPrice, 1);
    $('safePrice').textContent = money(result.safePrice);
    $('technicalPrice').textContent = money(result.technicalPrice);
    $('resultLoan').textContent = money(result.loan);
    $('resultPayment').textContent = money(result.payment);
    $('resultOwnCash').textContent = money(result.ownCash);
    $('paymentCapacity').textContent = money(result.paymentCapacity);
    $('effectiveIncome').textContent = money(result.effectiveIncome);
    $('resultDsti').textContent = pct(result.totalDebtRatio);
    $('availableCash').textContent = money(result.availableCash);
    $('remainingReserve').textContent = money(result.reserve);
    $('incomeLimitPrice').textContent = money(result.incomeLimitPrice);
    $('cashLimitPrice').textContent = result.cashLimitPrice >= Number.MAX_SAFE_INTEGER / 2 ? 'Bez omezení' : money(result.cashLimitPrice);
    $('bindingConstraint').textContent = result.constraint;
    $('constraintText').textContent = result.constraint.startsWith('příjem')
      ? 'Úspory by umožnily vyšší cenu, ale měsíční splátková kapacita je nižší.'
      : 'Příjem by zvládl vyšší cenu, ale chyběla by vlastní hotovost na podíl, náklady a rezervu.';
    $('resultBadge').textContent = result.safePrice > 0 ? `Bezpečnostní faktor ${Math.round(result.safetyFactor * 100)} %` : 'Zkontrolujte vstupy';
    $('resultMessage').textContent = result.safePrice <= 0
      ? 'Při zadaných hodnotách nevychází kladný cenový prostor. Zkontrolujte příjem, jiné splátky, úspory, rezervu a vedlejší náklady.'
      : `Doporučený strop je o ${money(result.technicalPrice - result.safePrice)} nižší než technické maximum. Tento odstup je určen pro plánování, nikoli jako bankovní pravidlo.`;
    $('targetVerdict').textContent = result.targetPrice > 0
      ? (result.targetGap >= 0 ? `V limitu o ${money(result.targetGap)}` : `Nad limitem o ${money(Math.abs(result.targetGap))}`)
      : 'Nezadána';

    renderBar('incomeLimitBar', result.incomeLimitPrice, maxLimit);
    renderBar('cashLimitBar', Math.min(result.cashLimitPrice, maxLimit), maxLimit);

    $('heroSafePrice').textContent = money(result.safePrice);
    $('heroIncomePrice').textContent = money(result.incomeLimitPrice);
    $('heroCashPrice').textContent = result.cashLimitPrice >= Number.MAX_SAFE_INTEGER / 2 ? 'Bez omezení' : money(result.cashLimitPrice);
    $('heroLoan').textContent = money(result.loan);
    $('heroPayment').textContent = money(result.payment);
    $('heroOwn').textContent = money(result.ownCash);
    $('heroConstraint').textContent = result.constraint.startsWith('příjem') ? 'Příjem' : 'Hotovost';
    renderBar('heroIncomeBar', result.incomeLimitPrice, maxLimit);
    renderBar('heroCashBar', Math.min(result.cashLimitPrice, maxLimit), maxLimit);

    const rateStress = stressPrice(result, { rate: result.rate + (result.rateStress || 2) });
    const incomeStress = stressPrice(result, { income: result.income * 0.85 });
    const appraisalStress = stressPrice(result, { appraisal: Math.max(0.5, result.appraisal - 0.05) });
    const combinedStress = stressPrice(result, { rate: result.rate + (result.rateStress || 2), income: result.income * 0.85, appraisal: Math.max(0.5, result.appraisal - 0.05) });
    $('stressRatePrice').textContent = money(rateStress);
    $('stressIncomePrice').textContent = money(incomeStress);
    $('stressAppraisalPrice').textContent = money(appraisalStress);
    $('stressCombinedPrice').textContent = money(combinedStress);
    $('stressRateDiff').textContent = diffText(rateStress, result.safePrice);
    $('stressIncomeDiff').textContent = diffText(incomeStress, result.safePrice);
    $('stressAppraisalDiff').textContent = diffText(appraisalStress, result.safePrice);
    $('stressCombinedDiff').textContent = diffText(combinedStress, result.safePrice);

    if (result.targetPrice > 0) {
      $('targetGap').textContent = result.targetGap >= 0 ? `Rezerva ${money(result.targetGap)}` : `Chybí ${money(Math.abs(result.targetGap))}`;
      $('targetCheckText').textContent = result.targetGap >= 0
        ? 'Zadaná nabídka se vejde pod doporučený cenový strop. Přesto ověřte celkovou cenu koupě a konkrétní bankovní nabídku.'
        : 'Zadaná nabídka je nad doporučeným stropem. Rozdíl lze snížit vyšší hotovostí, nižší cenou nebo lepší splátkovou kapacitou.';
    } else {
      $('targetGap').textContent = '—';
      $('targetCheckText').textContent = 'V PRO režimu můžete zadat cenu konkrétní nabídky a zjistit orientační přebytek nebo chybějící prostor.';
    }
  }

  function calculate() {
    const input = currentMode === 'pro' ? readPro() : readBasic();
    render(calculateModel(input));
  }

  function setMode(mode) {
    currentMode = mode;
    all('.aff-mode-btn').forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    all('.aff-mode-panel').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === mode));
    calculate();
  }

  function setStep(step) {
    activeStep = clamp(step, 1, 4);
    all('.aff-step').forEach((button) => {
      const n = Number(button.dataset.step);
      button.classList.toggle('is-active', n === activeStep);
      button.classList.toggle('is-done', n < activeStep);
    });
    all('.aff-stage').forEach((stage) => stage.classList.toggle('is-active', Number(stage.dataset.stage) === activeStep));
    $('stepCounter').textContent = `Krok ${activeStep} ze 4`;
    $('prevStep').disabled = activeStep === 1;
    $('nextStep').textContent = activeStep === 4 ? 'Hotovo' : 'Pokračovat';
  }

  function applyPreset(name) {
    const presets = {
      safe: { income: 68000, savings: 1500000, reserve: 400000, extras: 200000, debts: 2500, rate: 5.2, years: 25, ltv: 80, dsti: 30 },
      standard: { income: 68000, savings: 1400000, reserve: 300000, extras: 180000, debts: 3500, rate: 4.79, years: 30, ltv: 80, dsti: 35 },
      stretch: { income: 68000, savings: 1200000, reserve: 180000, extras: 150000, debts: 3500, rate: 4.79, years: 30, ltv: 90, dsti: 40 }
    };
    const p = presets[name] || presets.standard;
    $('basicIncome').value = p.income;
    $('basicSavings').value = p.savings;
    $('basicReserve').value = p.reserve;
    $('basicExtras').value = p.extras;
    $('basicDebts').value = p.debts;
    $('basicRate').value = p.rate;
    $('basicYears').value = p.years;
    $('basicLtv').value = p.ltv;
    $('basicDsti').value = p.dsti;
    calculate();
  }

  function updatePurpose() {
    const purpose = $('proPurpose').value;
    const values = {
      own: { ltv: 80, text: 'Pro vlastní bydlení je aktuální horní hranice LTV standardně 80 %. Kalkulačka umožňuje scénář měnit, ale výsledek není bankovní nabídka.' },
      young: { ltv: 90, text: 'Pro žadatele mladší 36 let pořizující vlastní bydlení je aktuální horní hranice LTV 90 %. Vyšší úvěr ale zvyšuje splátku a citlivost rozpočtu.' },
      investment: { ltv: 70, text: 'ČNB od 1. dubna 2026 doporučuje u investičních hypoték obezřetnější LTV 70 % a DTI 7. Kalkulačka používá LTV 70 % jako výchozí scénář.' }
    };
    $('proLtv').value = values[purpose].ltv;
    $('ltvGuidance').textContent = values[purpose].text;
    calculate();
  }

  function resetAll() {
    $('affForm').reset();
    activeStep = 1;
    setStep(1);
    updatePurpose();
    calculate();
  }

  document.addEventListener('DOMContentLoaded', () => {
    all('.aff-mode-btn').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
    all('.aff-step').forEach((button) => button.addEventListener('click', () => setStep(Number(button.dataset.step))));
    all('.aff-presets button').forEach((button) => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
    all('#affForm input, #affForm select').forEach((field) => field.addEventListener('input', calculate));
    $('proPurpose').addEventListener('change', updatePurpose);
    $('prevStep').addEventListener('click', () => setStep(activeStep - 1));
    $('nextStep').addEventListener('click', () => {
      if (activeStep < 4) setStep(activeStep + 1);
      else document.querySelector('#vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('affForm').addEventListener('submit', (event) => { event.preventDefault(); calculate(); });
    $('resetBtn').addEventListener('click', resetAll);
    $('printResult').addEventListener('click', () => window.print());
    $('copyResult').addEventListener('click', async () => {
      if (!currentResult) return;
      const text = `Doporučený cenový strop: ${money(currentResult.safePrice)}\nTechnické maximum: ${money(currentResult.technicalPrice)}\nHypotéka: ${money(currentResult.loan)}\nSplátka: ${money(currentResult.payment)}\nOmezující faktor: ${currentResult.constraint}`;
      try {
        await navigator.clipboard.writeText(text);
        $('copyResult').textContent = 'Zkopírováno';
        setTimeout(() => { $('copyResult').textContent = 'Kopírovat'; }, 1600);
      } catch (_) {
        $('copyResult').textContent = 'Nelze kopírovat';
      }
    });
    setStep(1);
    updatePurpose();
    setMode('basic');
  });
})();
