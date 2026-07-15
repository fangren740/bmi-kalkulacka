(() => {
  'use strict';

  const CONFIG = {
    year: 2026,
    taxThreshold: 1762812,
    taxpayerCredit: 30840,
    socialRate: 0.292,
    socialBaseShare: 0.55,
    socialMaxBase: 2350416,
    socialMainMinJanJun: 19587,
    socialMainMinJulDec: 17139,
    socialNewMin: 12242,
    socialSideMin: 5387,
    sideThresholdFull: 117521,
    sideThresholdReduction: 9794,
    healthRate: 0.135,
    healthBaseShare: 0.5,
    healthMinMonthlyBase: 24483.5,
    flatCaps: { 80: 1600000, 60: 1200000, 40: 800000, 30: 600000 }
  };

  const $ = (id) => document.getElementById(id);
  const number = (id) => Math.max(0, Number($(id)?.value || 0));
  const checked = (id) => Boolean($(id)?.checked);
  const selected = (id) => $(id)?.value || '';
  const ceil = (value) => Math.ceil(Math.max(0, value));
  const roundHundredsDown = (value) => Math.floor(Math.max(0, value) / 100) * 100;
  const money = (value) => `${Math.round(value).toLocaleString('cs-CZ')} Kč`;
  const shortMoney = (value) => {
    const n = Math.max(0, value);
    if (n >= 1000000) return `${(n / 1000000).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} mil.`;
    if (n >= 1000) return `${Math.round(n / 1000).toLocaleString('cs-CZ')} tis.`;
    return `${Math.round(n).toLocaleString('cs-CZ')}`;
  };
  const percent = (value) => `${(value * 100).toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

  function flatExpense(revenue, mode, actualExpenses) {
    if (mode === 'actual') return Math.min(revenue, Math.max(0, actualExpenses));
    const rate = Number(mode);
    const cap = CONFIG.flatCaps[rate] || 0;
    return Math.min(revenue * rate / 100, cap);
  }

  function socialMinimumBase(activity, startMonth, months, isNew) {
    if (activity === 'side') return CONFIG.socialSideMin * months;
    if (isNew) return CONFIG.socialNewMin * months;
    let total = 0;
    for (let i = 0; i < months; i += 1) {
      const month = startMonth + i;
      if (month > 12) break;
      total += month <= 6 ? CONFIG.socialMainMinJanJun : CONFIG.socialMainMinJulDec;
    }
    return total;
  }

  function sideThreshold(months) {
    return Math.max(0, CONFIG.sideThresholdFull - CONFIG.sideThresholdReduction * (12 - months));
  }

  function calculate(input) {
    const revenue = Math.max(0, input.revenue);
    const months = Math.min(12, Math.max(1, Math.round(input.months || 12)));
    const startMonth = Math.min(12, Math.max(1, Math.round(input.startMonth || 1)));
    const availableMonths = Math.min(months, 13 - startMonth);
    const taxExpenses = flatExpense(revenue, input.expenseMode, input.actualTaxExpenses);
    const taxProfit = Math.max(0, revenue - taxExpenses);
    const taxBaseAfterDeductions = roundHundredsDown(Math.max(0, taxProfit - input.deductions));
    const grossTax = ceil(
      Math.min(taxBaseAfterDeductions, CONFIG.taxThreshold) * 0.15 +
      Math.max(0, taxBaseAfterDeductions - CONFIG.taxThreshold) * 0.23
    );
    const credits = (input.taxpayerCredit ? CONFIG.taxpayerCredit : 0) + Math.max(0, input.extraCredits || 0);
    const incomeTax = Math.max(0, grossTax - credits);

    const threshold = sideThreshold(availableMonths);
    const socialRequired = input.activity === 'main' || taxProfit >= threshold || input.socialVoluntary;
    const socialActualBase = taxProfit * CONFIG.socialBaseShare;
    const socialMinBase = socialMinimumBase(input.activity, startMonth, availableMonths, input.isNew);
    let socialBase = 0;
    let social = 0;
    if (socialRequired) {
      socialBase = Math.min(CONFIG.socialMaxBase, Math.max(socialActualBase, socialMinBase));
      social = ceil(socialBase * CONFIG.socialRate);
    }

    const healthActualBase = taxProfit * CONFIG.healthBaseShare;
    const healthMinBase = input.healthMinimum ? CONFIG.healthMinMonthlyBase * availableMonths : 0;
    const healthBase = Math.max(healthActualBase, healthMinBase);
    const health = ceil(healthBase * CONFIG.healthRate);
    const sick = ceil(Math.max(0, input.sickMonthly || 0) * availableMonths);

    const totalDuties = incomeTax + social + health + sick;
    const cashCosts = Math.max(0, input.cashCosts || 0);
    const annualCash = revenue - cashCosts - totalDuties;
    const monthlyCash = annualCash / availableMonths;
    const monthlyReserve = totalDuties / availableMonths;
    const effectiveBurden = revenue > 0 ? totalDuties / revenue : 0;

    return {
      ...input,
      revenue,
      months: availableMonths,
      taxExpenses,
      taxProfit,
      taxBaseAfterDeductions,
      grossTax,
      credits,
      incomeTax,
      socialRequired,
      socialActualBase,
      socialMinBase,
      socialBase,
      social,
      threshold,
      healthActualBase,
      healthMinBase,
      healthBase,
      health,
      sick,
      totalDuties,
      cashCosts,
      annualCash,
      monthlyCash,
      monthlyReserve,
      effectiveBurden,
      taxSettlement: incomeTax - Math.max(0, input.paidTax || 0),
      socialSettlement: social - Math.max(0, input.paidSocial || 0),
      healthSettlement: health - Math.max(0, input.paidHealth || 0)
    };
  }

  function basicInput() {
    return {
      mode: 'basic',
      revenue: number('basicRevenue'),
      expenseMode: selected('basicExpenseMode'),
      actualTaxExpenses: number('basicActualExpenses'),
      cashCosts: number('basicCashCosts'),
      activity: selected('basicActivity'),
      startMonth: 1,
      months: 12,
      taxpayerCredit: checked('basicTaxpayerCredit'),
      extraCredits: 0,
      deductions: 0,
      isNew: false,
      socialVoluntary: false,
      healthMinimum: selected('basicActivity') === 'main',
      sickMonthly: 0,
      paidTax: 0,
      paidSocial: 0,
      paidHealth: 0
    };
  }

  function advancedInput() {
    const startMonth = Math.round(number('advStartMonth') || 1);
    const maxMonths = Math.max(1, 13 - startMonth);
    const months = Math.min(maxMonths, Math.max(1, Math.round(number('advMonths') || 1)));
    if ($('advMonths')) $('advMonths').value = months;
    return {
      mode: 'advanced',
      revenue: number('advRevenue'),
      expenseMode: selected('advExpenseMode'),
      actualTaxExpenses: number('advTaxExpenses'),
      cashCosts: number('advCashCosts'),
      activity: selected('advActivity'),
      startMonth,
      months,
      taxpayerCredit: checked('advTaxpayerCredit'),
      extraCredits: number('advExtraCredits'),
      deductions: number('advDeductions'),
      isNew: checked('advNewOs'),
      socialVoluntary: checked('advSocialVoluntary'),
      healthMinimum: checked('advHealthMinimum'),
      sickMonthly: number('advSickMonthly'),
      paidTax: number('advPaidTax'),
      paidSocial: number('advPaidSocial'),
      paidHealth: number('advPaidHealth')
    };
  }

  function settlementLabel(value) {
    if (Math.abs(value) < 1) return 'Vyrovnáno';
    return value > 0 ? `Doplatek ${money(value)}` : `Přeplatek ${money(Math.abs(value))}`;
  }

  function expenseName(mode) {
    return mode === 'actual' ? 'Skutečné výdaje' : `Paušál ${mode} %`;
  }

  function renderScenarios(input, current) {
    const grid = $('scenarioGrid');
    if (!grid) return;
    const modes = ['80', '60', '40', '30', 'actual'];
    grid.innerHTML = modes.map((mode) => {
      const result = calculate({ ...input, expenseMode: mode });
      const active = String(current.expenseMode) === mode ? ' is-current' : '';
      return `<article class="scenario-card${active}"><span>${expenseName(mode)}</span><strong>${money(result.totalDuties)}</strong><small>zůstane ${money(result.monthlyCash)} / měs.</small></article>`;
    }).join('');
  }

  function renderBreakdown(result) {
    const rows = [
      ['Roční příjmy', result.revenue, 'Příjmy ze samostatné činnosti zadané do modelu.'],
      ['Daňové výdaje', -result.taxExpenses, `${expenseName(result.expenseMode)} pro stanovení daňového základu.`],
      ['Daňový základ před odpočty', result.taxProfit, 'Rozdíl příjmů a daňových výdajů.'],
      ['Daň z příjmů', -result.incomeTax, 'Po sazbách, odpočtech a zadaných slevách.'],
      ['Sociální pojištění', -result.social, result.socialRequired ? '29,2 % z použitého vyměřovacího základu.' : 'U vedlejší činnosti nevznikla povinná účast.'],
      ['Zdravotní pojištění', -result.health, '13,5 % ze skutečného nebo minimálního vyměřovacího základu.'],
      ['Dobrovolné nemocenské', -result.sick, 'Volitelná měsíční platba zadaná v PRO režimu.'],
      ['Skutečné provozní náklady', -result.cashCosts, 'Peněžní náklady použité pro cash-flow, nikoli automaticky daňový paušál.'],
      ['Zůstane po povinnostech a nákladech', result.annualCash, 'Orientační roční cash-flow.']
    ];
    $('breakdownBody').innerHTML = rows.map(([name, amount, note]) => `<tr><td>${name}</td><td>${amount < 0 ? '− ' : ''}${money(Math.abs(amount))}</td><td>${note}</td></tr>`).join('');
  }

  function render(result) {
    const activityName = result.activity === 'main' ? 'Hlavní OSVČ' : 'Vedlejší OSVČ';
    $('monthlyNet').textContent = money(result.monthlyCash);
    $('annualNet').textContent = `${money(result.annualCash)} za ${result.months === 12 ? 'rok' : `${result.months} měsíců`}`;
    $('taxBase').textContent = money(result.taxProfit);
    $('expenseCaption').textContent = `${expenseName(result.expenseMode)} · výdaje ${money(result.taxExpenses)}`;
    $('totalDuties').textContent = money(result.totalDuties);
    $('effectiveBurden').textContent = `${percent(result.effectiveBurden)} z příjmů`;
    $('monthlyReserve').textContent = money(result.monthlyReserve);
    $('cashAfterCosts').textContent = money(result.annualCash);
    $('legendTax').textContent = money(result.incomeTax);
    $('legendSocial').textContent = money(result.social);
    $('legendHealth').textContent = money(result.health);
    $('resultActivityBadge').textContent = activityName.toUpperCase();
    $('resultModeBadge').textContent = result.mode === 'advanced' ? 'Rozšířený režim' : 'Základní režim';

    const total = Math.max(1, result.revenue);
    $('barTax').style.width = `${Math.min(100, result.incomeTax / total * 100)}%`;
    $('barSocial').style.width = `${Math.min(100, result.social / total * 100)}%`;
    $('barHealth').style.width = `${Math.min(100, result.health / total * 100)}%`;

    const note = result.expenseMode === 'actual'
      ? 'Skutečné výdaje vstupují do daňového základu i do cash-flow pouze v rozsahu, který jste zadali.'
      : `${expenseName(result.expenseMode)} snižuje daňový základ, ale cash-flow používá samostatné skutečné náklady ${money(result.cashCosts)}.`;
    $('resultSummary').textContent = `Z příjmů ${money(result.revenue)} vychází daň a pojistné ${money(result.totalDuties)}. ${note}`;

    let insightTitle = 'Odkládejte pravidelnou rezervu';
    let insightText = `Pro tento model vychází rozumné odkládat přibližně ${money(result.monthlyReserve)} za každý měsíc činnosti. Konečná povinnost se může změnit podle dalších příjmů, slev a skutečné evidence.`;
    if (result.activity === 'side' && !result.socialRequired) {
      insightTitle = 'Vedlejší činnost zůstala pod rozhodnou částkou';
      insightText = `Daňový základ ${money(result.taxProfit)} nepřesáhl upravenou rozhodnou částku ${money(result.threshold)}, proto model nepočítá povinné sociální pojistné. Zdravotní pojistné se však počítá ze skutečného základu.`;
    } else if (result.socialMinBase > result.socialActualBase || result.healthMinBase > result.healthActualBase) {
      insightTitle = 'Výsledek ovlivňuje minimální pojistné';
      insightText = 'Pojistné nevychází pouze ze skutečného zisku. Alespoň u jedné složky se uplatnil minimální vyměřovací základ, proto nižší daňový základ nesnižuje odvody stejným tempem.';
    }
    $('insightTitle').textContent = insightTitle;
    $('insightText').textContent = insightText;

    $('advancedResult').hidden = result.mode !== 'advanced';
    $('settlementTax').textContent = settlementLabel(result.taxSettlement);
    $('settlementSocial').textContent = settlementLabel(result.socialSettlement);
    $('settlementHealth').textContent = settlementLabel(result.healthSettlement);
    $('sideThreshold').textContent = result.activity === 'side' ? money(result.threshold) : 'Nevztahuje se';

    document.querySelectorAll('[data-hero-net]').forEach((el) => { el.textContent = money(result.revenue - result.totalDuties); });
    document.querySelectorAll('[data-hero-tax]').forEach((el) => { el.textContent = shortMoney(result.incomeTax); });
    document.querySelectorAll('[data-hero-social]').forEach((el) => { el.textContent = shortMoney(result.social); });
    document.querySelectorAll('[data-hero-health]').forEach((el) => { el.textContent = shortMoney(result.health); });
    document.querySelectorAll('[data-hero-rate]').forEach((el) => { el.textContent = expenseName(result.expenseMode).replace('Paušál ', ''); });
    document.querySelectorAll('[data-hero-burden]').forEach((el) => { el.textContent = percent(result.effectiveBurden); });

    renderScenarios(result.mode === 'advanced' ? advancedInput() : basicInput(), result);
    renderBreakdown(result);
    window.__osvcTaxResult = result;
  }

  function currentMode() {
    return document.body.dataset.mode === 'advanced' ? 'advanced' : 'basic';
  }

  function recalculate() {
    render(calculate(currentMode() === 'advanced' ? advancedInput() : basicInput()));
  }

  function syncToAdvanced() {
    $('advRevenue').value = number('basicRevenue');
    $('advExpenseMode').value = selected('basicExpenseMode');
    $('advTaxExpenses').value = number('basicActualExpenses');
    $('advCashCosts').value = number('basicCashCosts');
    $('advActivity').value = selected('basicActivity');
    $('advTaxpayerCredit').checked = checked('basicTaxpayerCredit');
    updateConditionalFields();
  }

  function setMode(mode) {
    const advanced = mode === 'advanced';
    if (advanced && currentMode() === 'basic') syncToAdvanced();
    document.body.dataset.mode = mode;
    $('taxForm').dataset.mode = mode;
    $('basicCalculation').hidden = advanced;
    $('advancedCalculation').hidden = !advanced;
    $('basicModeTab').classList.toggle('is-active', !advanced);
    $('advancedModeTab').classList.toggle('is-active', advanced);
    $('basicModeTab').setAttribute('aria-selected', String(!advanced));
    $('advancedModeTab').setAttribute('aria-selected', String(advanced));
    recalculate();
  }

  function updateConditionalFields() {
    $('basicActualExpensesField').hidden = selected('basicExpenseMode') !== 'actual';
    $('advTaxExpensesField').hidden = selected('advExpenseMode') !== 'actual';
    const side = selected('advActivity') === 'side';
    $('advSideVoluntaryField').hidden = !side;
    if (side) {
      $('advNewOs').checked = false;
      $('advHealthMinimum').checked = false;
    }
  }

  function resetBasic() {
    $('basicRevenue').value = 1200000;
    $('basicExpenseMode').value = '60';
    $('basicActivity').value = 'main';
    $('basicActualExpenses').value = 300000;
    $('basicCashCosts').value = 180000;
    $('basicTaxpayerCredit').checked = true;
    updateConditionalFields();
    recalculate();
  }

  function resetAdvanced() {
    $('advRevenue').value = 1200000;
    $('advExpenseMode').value = '60';
    $('advTaxExpenses').value = 300000;
    $('advCashCosts').value = 180000;
    $('advActivity').value = 'main';
    $('advStartMonth').value = '1';
    $('advMonths').value = 12;
    $('advNewOs').checked = false;
    $('advSocialVoluntary').checked = false;
    $('advHealthMinimum').checked = true;
    $('advTaxpayerCredit').checked = true;
    $('advExtraCredits').value = 0;
    $('advDeductions').value = 0;
    $('advSickMonthly').value = 0;
    $('advPaidTax').value = 0;
    $('advPaidSocial').value = 64350;
    $('advPaidHealth').value = 39672;
    updateConditionalFields();
    recalculate();
  }

  function copyResult() {
    const r = window.__osvcTaxResult;
    if (!r) return;
    const text = [
      'OSVČ daňová kalkulačka 2026',
      `Příjmy: ${money(r.revenue)}`,
      `Daňový základ: ${money(r.taxProfit)}`,
      `Daň z příjmů: ${money(r.incomeTax)}`,
      `Sociální pojištění: ${money(r.social)}`,
      `Zdravotní pojištění: ${money(r.health)}`,
      `Celkem povinnosti: ${money(r.totalDuties)}`,
      `Měsíčně po skutečných nákladech: ${money(r.monthlyCash)}`
    ].join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      const btn = $('copyResult');
      const original = btn.textContent;
      btn.textContent = 'Zkopírováno';
      setTimeout(() => { btn.textContent = original; }, 1500);
    }).catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('basicModeTab').addEventListener('click', () => setMode('basic'));
    $('advancedModeTab').addEventListener('click', () => setMode('advanced'));
    $('basicReset').addEventListener('click', resetBasic);
    $('advReset').addEventListener('click', resetAdvanced);
    $('copyResult').addEventListener('click', copyResult);
    $('printResult').addEventListener('click', () => window.print());
    $('taxForm').addEventListener('submit', (event) => { event.preventDefault(); recalculate(); });

    document.querySelectorAll('#taxForm input, #taxForm select').forEach((control) => {
      control.addEventListener('input', () => { updateConditionalFields(); recalculate(); });
      control.addEventListener('change', () => { updateConditionalFields(); recalculate(); });
    });

    updateConditionalFields();
    recalculate();
  });
})();
