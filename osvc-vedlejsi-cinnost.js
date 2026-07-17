(() => {
  'use strict';

  const CONFIG = {
    year: 2026,
    taxThreshold: 1762812,
    taxpayerCredit: 30840,
    socialRate: 0.292,
    socialBaseShare: 0.55,
    socialMaxBase: 2350416,
    socialSideMinMonthlyBase: 5387,
    socialSideMinAdvance: 1574,
    sideThresholdFull: 117521,
    sideThresholdReduction: 9794,
    healthRate: 0.135,
    healthBaseShare: 0.5,
    healthMinMonthlyBase: 24483.5,
    flatCaps: { 80: 1600000, 60: 1200000, 40: 800000, 30: 600000 }
  };

  const $ = (id) => document.getElementById(id);
  const num = (id) => Math.max(0, Number($(id)?.value || 0));
  const val = (id) => $(id)?.value || '';
  const bool = (id) => Boolean($(id)?.checked);
  const money = (value) => `${Math.round(value).toLocaleString('cs-CZ')} Kč`;
  const shortMoney = (value) => {
    const n = Math.abs(value);
    if (n >= 1000000) return `${(n / 1000000).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} mil.`;
    if (n >= 1000) return `${Math.round(n / 1000).toLocaleString('cs-CZ')} tis.`;
    return `${Math.round(n).toLocaleString('cs-CZ')}`;
  };
  const pct = (value, digits = 1) => `${(value * 100).toLocaleString('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
  const ceil = (value) => Math.ceil(Math.max(0, value));
  const floorHundreds = (value) => Math.floor(Math.max(0, value) / 100) * 100;

  function flatExpense(revenue, mode, actualExpenses) {
    if (mode === 'actual') return Math.min(revenue, Math.max(0, actualExpenses));
    const rate = Number(mode);
    return Math.min(revenue * rate / 100, CONFIG.flatCaps[rate] || 0);
  }

  function mixedFlatExpense(parts) {
    return [80, 60, 40, 30].reduce((sum, rate) => {
      const revenue = Math.max(0, Number(parts[rate] || 0));
      return sum + Math.min(revenue * rate / 100, CONFIG.flatCaps[rate]);
    }, 0);
  }

  function progressiveTax(base) {
    const taxable = floorHundreds(base);
    return ceil(
      Math.min(taxable, CONFIG.taxThreshold) * 0.15 +
      Math.max(0, taxable - CONFIG.taxThreshold) * 0.23
    );
  }

  function sideThreshold(months) {
    const activeMonths = Math.min(12, Math.max(1, Math.round(months || 12)));
    return Math.max(0, CONFIG.sideThresholdFull - CONFIG.sideThresholdReduction * (12 - activeMonths));
  }

  function calculate(input) {
    const months = Math.min(12, Math.max(1, Math.round(input.months || 12)));
    const revenue = Math.max(0, input.revenue || 0);
    const taxExpenses = Math.min(revenue, Math.max(0, input.taxExpenses || 0));
    const taxProfit = Math.max(0, revenue - taxExpenses);
    const threshold = sideThreshold(months);

    const credits = (input.taxpayerCreditAvailable ? CONFIG.taxpayerCredit : 0) + Math.max(0, input.extraCredits || 0);
    const deductions = Math.max(0, input.deductions || 0);
    const otherTaxBase = Math.max(0, input.otherTaxBase || 0);
    const totalBase = Math.max(0, otherTaxBase + taxProfit - deductions);
    const baseWithoutBusiness = Math.max(0, otherTaxBase - deductions);
    const totalTax = Math.max(0, progressiveTax(totalBase) - credits);
    const taxWithoutBusiness = Math.max(0, progressiveTax(baseWithoutBusiness) - credits);
    const incomeTax = Math.max(0, totalTax - taxWithoutBusiness);

    const socialRequired = taxProfit >= threshold || Boolean(input.socialVoluntary);
    const socialActualBase = taxProfit * CONFIG.socialBaseShare;
    const socialMinBase = CONFIG.socialSideMinMonthlyBase * months;
    const socialBase = socialRequired ? Math.min(CONFIG.socialMaxBase, Math.max(socialActualBase, socialMinBase)) : 0;
    const social = socialRequired ? ceil(socialBase * CONFIG.socialRate) : 0;
    const futureSocialAdvance = socialRequired ? ceil(Math.max(CONFIG.socialSideMinAdvance, social / months)) : 0;

    const healthActualBase = taxProfit * CONFIG.healthBaseShare;
    const healthMinBase = input.healthMinimum ? CONFIG.healthMinMonthlyBase * months : 0;
    const healthBase = Math.max(healthActualBase, healthMinBase);
    const health = ceil(healthBase * CONFIG.healthRate);
    const healthAdvance = input.healthMinimum ? ceil(Math.max(3306, health / months)) : 0;

    const totalDuties = incomeTax + social + health;
    const cashCosts = Math.max(0, input.cashCosts || 0);
    const netCash = revenue - cashCosts - totalDuties;
    const monthlyNet = netCash / months;
    const monthlyReserve = totalDuties / months;
    const headroom = threshold - taxProfit;
    const effectiveBurden = revenue ? totalDuties / revenue : 0;

    return {
      ...input,
      months,
      revenue,
      taxExpenses,
      taxProfit,
      threshold,
      credits,
      deductions,
      otherTaxBase,
      incomeTax,
      socialRequired,
      socialActualBase,
      socialMinBase,
      socialBase,
      social,
      futureSocialAdvance,
      healthActualBase,
      healthMinBase,
      healthBase,
      health,
      healthAdvance,
      totalDuties,
      cashCosts,
      netCash,
      monthlyNet,
      monthlyReserve,
      headroom,
      effectiveBurden,
      taxSettlement: incomeTax - Math.max(0, input.paidTax || 0),
      socialSettlement: social - Math.max(0, input.paidSocial || 0),
      healthSettlement: health - Math.max(0, input.paidHealth || 0)
    };
  }

  function basicInput() {
    const revenue = num('basicRevenue');
    const expenseMode = val('basicExpenseMode') || '60';
    const actualExpenses = num('basicActualExpenses');
    const status = val('basicStatus') || 'employee';
    return {
      mode: 'basic',
      status,
      months: Number(val('basicMonths') || 12),
      revenue,
      taxExpenses: flatExpense(revenue, expenseMode, actualExpenses),
      expenseMode,
      cashCosts: num('basicCashCosts'),
      otherTaxBase: status === 'employee' ? num('basicOtherTaxBase') : 0,
      taxpayerCreditAvailable: bool('basicTaxpayerCreditAvailable'),
      extraCredits: 0,
      deductions: 0,
      socialVoluntary: false,
      healthMinimum: bool('basicHealthMinimum'),
      paidTax: 0,
      paidSocial: 0,
      paidHealth: 0
    };
  }

  function advancedInput() {
    const revenueParts = {
      80: num('advRevenue80'),
      60: num('advRevenue60'),
      40: num('advRevenue40'),
      30: num('advRevenue30')
    };
    const revenue = Object.values(revenueParts).reduce((sum, value) => sum + value, 0);
    const expenseMode = val('advExpenseMode') || 'flat';
    return {
      mode: 'advanced',
      status: val('advStatus') || 'employee',
      months: Number(val('advMonths') || 12),
      revenue,
      revenueParts,
      taxExpenses: expenseMode === 'actual' ? Math.min(revenue, num('advActualExpenses')) : mixedFlatExpense(revenueParts),
      expenseMode,
      cashCosts: num('advCashCosts'),
      otherTaxBase: num('advOtherTaxBase'),
      taxpayerCreditAvailable: bool('advTaxpayerCreditAvailable'),
      extraCredits: num('advExtraCredits'),
      deductions: num('advDeductions'),
      socialVoluntary: bool('advSocialVoluntary'),
      healthMinimum: bool('advHealthMinimum'),
      paidTax: num('advPaidTax'),
      paidSocial: num('advPaidSocial'),
      paidHealth: num('advPaidHealth')
    };
  }

  function currentInput() {
    return document.body.dataset.mode === 'advanced' ? advancedInput() : basicInput();
  }

  function findRevenueAtSocialThreshold(input) {
    let low = 0;
    let high = Math.max(input.revenue * 2, 1000000);
    for (let i = 0; i < 70; i += 1) {
      const mid = (low + high) / 2;
      let expenses;
      if (input.mode === 'advanced' && input.expenseMode !== 'actual') {
        const total = Math.max(1, input.revenue);
        const parts = {};
        [80, 60, 40, 30].forEach((rate) => {
          parts[rate] = mid * ((input.revenueParts?.[rate] || 0) / total);
        });
        expenses = mixedFlatExpense(parts);
      } else if (input.expenseMode === 'actual') {
        expenses = input.taxExpenses;
      } else {
        expenses = flatExpense(mid, input.expenseMode, input.taxExpenses);
      }
      const profit = Math.max(0, mid - expenses);
      if (profit >= sideThreshold(input.months)) high = mid;
      else low = mid;
    }
    return high;
  }

  function statusLabel(status) {
    return ({
      employee: 'Zaměstnání + OSVČ',
      pension: 'Důchod + OSVČ',
      parental: 'Rodičovská / stát + OSVČ',
      student: 'Studium + OSVČ',
      other: 'Jiný doložený důvod'
    })[status] || 'Vedlejší OSVČ';
  }

  function settlementText(value) {
    if (Math.abs(value) < 1) return 'Vyrovnáno';
    return value > 0 ? `Doplatek ${money(value)}` : `Přeplatek ${money(Math.abs(value))}`;
  }

  function renderScenarios(input) {
    const box = $('scenarioGrid');
    if (!box) return;
    const values = [0.75, 1, 1.25, 1.5];
    box.innerHTML = values.map((factor) => {
      const revenue = input.revenue * factor;
      let taxExpenses;
      if (input.mode === 'advanced' && input.expenseMode !== 'actual') {
        const total = Math.max(1, input.revenue);
        const parts = {};
        [80, 60, 40, 30].forEach((rate) => { parts[rate] = revenue * ((input.revenueParts?.[rate] || 0) / total); });
        taxExpenses = mixedFlatExpense(parts);
      } else if (input.expenseMode === 'actual') {
        taxExpenses = input.taxExpenses;
      } else {
        taxExpenses = flatExpense(revenue, input.expenseMode, input.taxExpenses);
      }
      const scenario = calculate({ ...input, revenue, taxExpenses, cashCosts: input.cashCosts * factor });
      return `<article class="scenario-card${factor === 1 ? ' is-current' : ''}"><span>${Math.round(factor * 100)} % příjmů</span><strong>${money(revenue)}</strong><small>${scenario.socialRequired ? 'sociální vzniká' : 'bez povinného sociálního'} · čistě ${money(scenario.netCash)}</small></article>`;
    }).join('');
  }

  function renderBreakdown(result) {
    const body = $('breakdownBody');
    if (!body) return;
    const rows = [
      ['Příjmy ze samostatné činnosti', result.revenue, 'obrat'],
      ['Daňové výdaje', -result.taxExpenses, result.expenseMode === 'actual' ? 'skutečné' : 'paušální'],
      ['Daňový základ ze samostatné činnosti', result.taxProfit, 'pro daň a pojistné'],
      ['Daň z příjmů navíc', -result.incomeTax, 'přírůstek proti ostatním příjmům'],
      ['Sociální pojištění', -result.social, result.socialRequired ? 'povinná účast' : 'nevzniká'],
      ['Zdravotní pojištění', -result.health, result.healthMinimum ? 's minimem' : 'ze skutečného zisku'],
      ['Skutečné peněžní náklady', -result.cashCosts, 'cash-flow'],
      ['Čistý přínos vedlejší činnosti', result.netCash, 'po nákladech a odvodech']
    ];
    body.innerHTML = rows.map(([label, amount, note], index) => `<tr${index === rows.length - 1 ? ' class="is-total"' : ''}><td>${label}</td><td>${amount < 0 ? '− ' : ''}${money(Math.abs(amount))}</td><td>${note}</td></tr>`).join('');
  }

  function render(result) {
    const below = !result.socialRequired;
    const revenueThreshold = findRevenueAtSocialThreshold(result);
    const progress = result.threshold > 0 ? Math.min(100, result.taxProfit / result.threshold * 100) : 100;

    $('resultBadge').textContent = below ? 'Pod hranicí sociálního' : 'Sociální pojištění vzniká';
    $('resultTitle').textContent = below ? 'Vedlejší činnost zůstává bez povinného sociálního' : 'Daňový základ překročil rozhodnou částku';
    $('resultMain').textContent = money(result.netCash);
    $('resultMainSub').textContent = `čistý přínos za ${result.months} měsíců`;
    $('resultNarrative').textContent = below
      ? `Daňový základ ${money(result.taxProfit)} je pod upravenou rozhodnou částkou ${money(result.threshold)}. Zdravotní a daň se však počítají samostatně.`
      : `Daňový základ ${money(result.taxProfit)} dosáhl nebo překročil rozhodnou částku ${money(result.threshold)}. Model proto dopočítává povinné sociální pojištění.`;

    $('thresholdGauge').style.width = `${progress}%`;
    $('thresholdProfit').textContent = money(result.taxProfit);
    $('thresholdLimit').textContent = money(result.threshold);
    $('thresholdHeadroom').textContent = result.headroom >= 0 ? money(result.headroom) : `překročeno o ${money(Math.abs(result.headroom))}`;

    $('taxResult').textContent = money(result.incomeTax);
    $('socialResult').textContent = money(result.social);
    $('healthResult').textContent = money(result.health);
    $('reserveResult').textContent = money(result.monthlyReserve);
    $('monthlyNetResult').textContent = money(result.monthlyNet);
    $('effectiveBurdenResult').textContent = pct(result.effectiveBurden);
    $('revenueThresholdResult').textContent = money(revenueThreshold);
    $('futureAdvanceResult').textContent = result.socialRequired ? money(result.futureSocialAdvance) : '0 Kč';
    $('healthAdvanceResult').textContent = result.healthAdvance ? money(result.healthAdvance) : 'Bez povinné zálohy';
    $('statusResult').textContent = statusLabel(result.status);

    $('settlementTax').textContent = settlementText(result.taxSettlement);
    $('settlementSocial').textContent = settlementText(result.socialSettlement);
    $('settlementHealth').textContent = settlementText(result.healthSettlement);

    $('heroStatus').textContent = below ? 'Bez sociálního' : 'Sociální vzniká';
    $('heroProfit').textContent = shortMoney(result.taxProfit);
    $('heroLimit').textContent = shortMoney(result.threshold);
    $('heroNet').textContent = shortMoney(result.netCash);

    $('resultPanel').dataset.state = below ? 'below' : 'above';
    $('advancedSettlement').hidden = result.mode !== 'advanced';
    renderScenarios(result);
    renderBreakdown(result);
    window.__sideOsResult = result;
  }

  function update() {
    render(calculate(currentInput()));
  }

  function setMode(mode) {
    document.body.dataset.mode = mode;
    document.querySelectorAll('.mode-button').forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    $('basicCalculation').hidden = mode !== 'basic';
    $('advancedCalculation').hidden = mode !== 'advanced';
    if (mode === 'advanced') transferBasicToAdvanced();
    update();
  }

  function transferBasicToAdvanced() {
    const basic = basicInput();
    $('advStatus').value = basic.status;
    $('advMonths').value = basic.months;
    $('advRevenue80').value = 0;
    $('advRevenue60').value = basic.expenseMode === '60' ? basic.revenue : 0;
    $('advRevenue40').value = basic.expenseMode === '40' ? basic.revenue : 0;
    $('advRevenue30').value = basic.expenseMode === '30' ? basic.revenue : 0;
    $('advRevenue80').value = basic.expenseMode === '80' ? basic.revenue : $('advRevenue80').value;
    if (basic.expenseMode === 'actual') {
      $('advExpenseMode').value = 'actual';
      $('advActualExpenses').value = basic.taxExpenses;
    } else {
      $('advExpenseMode').value = 'flat';
    }
    $('advCashCosts').value = basic.cashCosts;
    $('advOtherTaxBase').value = basic.otherTaxBase;
    $('advTaxpayerCreditAvailable').checked = basic.taxpayerCreditAvailable;
    $('advHealthMinimum').checked = basic.healthMinimum;
    syncConditionalFields();
  }

  function setStep(step) {
    const next = Math.min(3, Math.max(1, Number(step || 1)));
    document.querySelectorAll('.wizard-step').forEach((panel) => { panel.hidden = Number(panel.dataset.step) !== next; });
    document.querySelectorAll('.wizard-progress button').forEach((button) => {
      const active = Number(button.dataset.stepTarget) === next;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'step' : 'false');
    });
    $('wizardCounter').textContent = `Krok ${next} ze 3`;
    $('wizardProgressBar').style.width = `${next / 3 * 100}%`;
    $('wizardPrev').disabled = next === 1;
    $('wizardNext').textContent = next === 3 ? 'Hotovo – zobrazit výsledek' : 'Pokračovat';
    $('wizardNext').dataset.currentStep = String(next);
  }

  function syncStatusDefaults(source) {
    const status = val(source);
    const isEmployee = status === 'employee';
    if (source === 'basicStatus') {
      $('basicOtherTaxBaseWrap').hidden = !isEmployee;
      if (!isEmployee) $('basicOtherTaxBase').value = 0;
      $('basicTaxpayerCreditAvailable').checked = !isEmployee;
      $('basicHealthMinimum').checked = false;
    } else {
      if (!isEmployee && num('advOtherTaxBase') === 720000) $('advOtherTaxBase').value = 0;
      $('advTaxpayerCreditAvailable').checked = !isEmployee;
      $('advHealthMinimum').checked = false;
    }
    update();
  }

  function syncConditionalFields() {
    const basicActual = val('basicExpenseMode') === 'actual';
    $('basicActualExpensesWrap').hidden = !basicActual;
    const advActual = val('advExpenseMode') === 'actual';
    $('advActualExpensesWrap').hidden = !advActual;
  }

  function resetBasic() {
    $('basicStatus').value = 'employee';
    $('basicMonths').value = '12';
    $('basicRevenue').value = '250000';
    $('basicExpenseMode').value = '60';
    $('basicActualExpenses').value = '100000';
    $('basicCashCosts').value = '60000';
    $('basicOtherTaxBase').value = '720000';
    $('basicTaxpayerCreditAvailable').checked = false;
    $('basicHealthMinimum').checked = false;
    syncConditionalFields();
    update();
  }

  function copyResult() {
    const r = window.__sideOsResult;
    if (!r) return;
    const text = [
      `Vedlejší OSVČ ${CONFIG.year}`,
      `Příjmy: ${money(r.revenue)}`,
      `Daňový základ: ${money(r.taxProfit)}`,
      `Rozhodná částka: ${money(r.threshold)}`,
      `Daň: ${money(r.incomeTax)}`,
      `Sociální: ${money(r.social)}`,
      `Zdravotní: ${money(r.health)}`,
      `Čistý přínos: ${money(r.netCash)}`
    ].join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      const button = $('copyResult');
      const original = button.textContent;
      button.textContent = 'Zkopírováno';
      setTimeout(() => { button.textContent = original; }, 1500);
    }).catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.mode-button').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
    document.querySelectorAll('input,select').forEach((control) => control.addEventListener('input', update));
    $('basicStatus').addEventListener('change', () => syncStatusDefaults('basicStatus'));
    $('advStatus').addEventListener('change', () => syncStatusDefaults('advStatus'));
    $('basicExpenseMode').addEventListener('change', () => { syncConditionalFields(); update(); });
    $('advExpenseMode').addEventListener('change', () => { syncConditionalFields(); update(); });
    document.querySelectorAll('[data-step-target]').forEach((button) => button.addEventListener('click', () => setStep(button.dataset.stepTarget)));
    $('wizardPrev').addEventListener('click', () => setStep(Number($('wizardNext').dataset.currentStep || 1) - 1));
    $('wizardNext').addEventListener('click', () => {
      const current = Number($('wizardNext').dataset.currentStep || 1);
      if (current < 3) setStep(current + 1);
      else document.getElementById('vysledek')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('resetBasic').addEventListener('click', resetBasic);
    $('copyResult').addEventListener('click', copyResult);
    $('printResult').addEventListener('click', () => window.print());
    $('sideForm').addEventListener('submit', (event) => { event.preventDefault(); update(); });
    syncConditionalFields();
    setStep(1);
    setMode('basic');
  });
})();
