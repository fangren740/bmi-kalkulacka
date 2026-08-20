(() => {
  'use strict';

  const CFG = {
    year: 2026,
    taxThreshold: 1762812,
    taxpayerCredit: 30840,
    socialRate: 0.292,
    socialBaseShare: 0.55,
    socialMaxBase: 2350416,
    socialMainMinMonthlyBase: 17139,
    socialNewMinMonthlyBase: 12242,
    socialSideMinMonthlyBase: 5387,
    sideThreshold: 117521,
    healthRate: 0.135,
    healthBaseShare: 0.5,
    healthMinMonthlyBase: 24483.5,
    flatCaps: { 80: 1600000, 60: 1200000, 40: 800000, 30: 600000 }
  };

  const $ = (id) => document.getElementById(id);
  const num = (id, fallback = 0) => {
    const el = $(id);
    const value = Number(el?.value);
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
  };
  const checked = (id) => Boolean($(id)?.checked);
  const selected = (id) => $(id)?.value || '';
  const money = (value) => `${Math.round(Math.max(0, value)).toLocaleString('cs-CZ')} Kč`;
  const moneyShort = (value) => {
    const n = Math.max(0, value);
    if (n >= 1000000) return `${(n / 1000000).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} mil. Kč`;
    if (n >= 1000) return `${Math.round(n / 1000).toLocaleString('cs-CZ')} tis. Kč`;
    return money(n);
  };
  const pct = (value) => `${(value * 100).toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
  const ceil = (value) => Math.ceil(Math.max(0, value));
  const roundHundredsDown = (value) => Math.floor(Math.max(0, value) / 100) * 100;

  function taxExpenses(revenue, mode, actualAnnual) {
    if (mode === 'actual') return Math.min(revenue, Math.max(0, actualAnnual));
    const rate = Number(mode);
    return Math.min(revenue * rate / 100, CFG.flatCaps[rate] || 0);
  }

  function socialMinimumBase(activity, isNew) {
    if (activity === 'side') return CFG.socialSideMinMonthlyBase * 12;
    if (isNew) return CFG.socialNewMinMonthlyBase * 12;
    return CFG.socialMainMinMonthlyBase * 12;
  }

  function calculateAnnual(revenue, input) {
    const deductibleExpenses = taxExpenses(revenue, input.expenseMode, input.actualTaxExpenses);
    const taxProfit = Math.max(0, revenue - deductibleExpenses);
    const taxBase = roundHundredsDown(Math.max(0, taxProfit - input.deductions));
    const grossTax = ceil(
      Math.min(taxBase, CFG.taxThreshold) * 0.15 +
      Math.max(0, taxBase - CFG.taxThreshold) * 0.23
    );
    const credits = (input.taxpayerCredit ? CFG.taxpayerCredit : 0) + input.extraCredits;
    const incomeTax = Math.max(0, grossTax - credits);

    const socialRequired = input.activity === 'main' || taxProfit >= CFG.sideThreshold || input.socialVoluntary;
    const socialActualBase = taxProfit * CFG.socialBaseShare;
    const socialBase = socialRequired
      ? Math.min(CFG.socialMaxBase, Math.max(socialActualBase, socialMinimumBase(input.activity, input.isNew)))
      : 0;
    const social = socialRequired ? ceil(socialBase * CFG.socialRate) : 0;

    const healthActualBase = taxProfit * CFG.healthBaseShare;
    const healthMinimumBase = input.healthMinimum ? CFG.healthMinMonthlyBase * 12 : 0;
    const healthBase = Math.max(healthActualBase, healthMinimumBase);
    const health = ceil(healthBase * CFG.healthRate);

    const duties = incomeTax + social + health;
    const cashCosts = input.monthlyCashCosts * 12 + input.annualCashCosts;
    const cashAfter = revenue - cashCosts - duties;

    return {
      revenue,
      deductibleExpenses,
      taxProfit,
      taxBase,
      incomeTax,
      social,
      health,
      duties,
      cashCosts,
      cashAfter,
      socialRequired,
      effectiveDutyShare: revenue > 0 ? duties / revenue : 0
    };
  }

  function collectInput() {
    const activity = selected('activity') || 'main';
    return {
      targetMonthly: num('targetMonthly', 60000),
      monthlyCashCosts: num('monthlyCashCosts', 10000),
      annualCashCosts: num('annualCashCosts', 0),
      expenseMode: selected('expenseMode') || '60',
      actualTaxExpenses: num('actualTaxExpenses', 0),
      activity,
      taxpayerCredit: checked('taxpayerCredit'),
      deductions: num('deductions', 0),
      extraCredits: num('extraCredits', 0),
      isNew: checked('isNew'),
      socialVoluntary: checked('socialVoluntary'),
      healthMinimum: checked('healthMinimum'),
      activeMonths: Math.min(12, Math.max(1, num('activeMonths', 12))),
      billableHours: Math.max(1, num('billableHours', 100)),
      vatRate: num('vatRate', 0)
    };
  }

  function solveRevenue(input) {
    const targetAnnual = input.targetMonthly * 12;
    const zeroResult = calculateAnnual(0, input);
    if (zeroResult.cashAfter >= targetAnnual) return zeroResult;
    let low = 0;
    let high = Math.max(1000000, targetAnnual + input.monthlyCashCosts * 12 + input.annualCashCosts + 500000);
    let guard = 0;
    while (calculateAnnual(high, input).cashAfter < targetAnnual && guard < 30) {
      high *= 1.6;
      guard += 1;
    }
    for (let i = 0; i < 72; i += 1) {
      const mid = (low + high) / 2;
      if (calculateAnnual(mid, input).cashAfter >= targetAnnual) high = mid;
      else low = mid;
    }
    const revenue = Math.ceil(high / 100) * 100;
    return calculateAnnual(revenue, input);
  }

  function expenseLabel(mode) {
    return mode === 'actual' ? 'Skutečné výdaje' : `Paušál ${mode} %`;
  }

  function renderWaterfall(result, input) {
    const total = result.revenue || 1;
    const rows = [
      ['Cíl pro vás', input.targetMonthly * 12, 'net'],
      ['Skutečné náklady', result.cashCosts, 'cost'],
      ['Daň z příjmů', result.incomeTax, 'tax'],
      ['Sociální', result.social, 'social'],
      ['Zdravotní', result.health, 'health']
    ];
    const root = $('waterfallRows');
    if (!root) return;
    root.innerHTML = rows.map(([label, value, cls]) => {
      const width = Math.max(2, Math.min(100, value / total * 100));
      return `<div class="net-water-row"><span>${label}</span><div class="net-water-track"><i class="${cls}" style="width:${width.toFixed(2)}%"></i></div><strong>${money(value)}</strong></div>`;
    }).join('');
  }

  function renderScenarios(input) {
    const targets = [40000, 60000, 80000, 100000];
    const grid = $('scenarioGrid');
    if (!grid) return;
    grid.innerHTML = targets.map((target) => {
      const solved = solveRevenue({ ...input, targetMonthly: target });
      const monthly = solved.revenue / 12;
      const active = Math.round(input.targetMonthly) === target ? ' is-current' : '';
      return `<article class="net-scenario${active}"><span>${money(target)} čistého</span><strong>${money(monthly)} / měs.</strong><small>${moneyShort(solved.revenue)} ročně</small></article>`;
    }).join('');
  }

  function render() {
    const input = collectInput();
    const result = solveRevenue(input);
    const annualTarget = input.targetMonthly * 12;
    const monthlyCalendar = result.revenue / 12;
    const monthlyActive = result.revenue / input.activeMonths;
    const hourly = monthlyActive / input.billableHours;
    const invoiceWithVat = monthlyActive * (1 + input.vatRate / 100);

    $('requiredBilling').textContent = money(monthlyCalendar);
    $('annualBilling').textContent = money(result.revenue);
    $('activeBilling').textContent = money(monthlyActive);
    $('hourlyCheck').textContent = `${money(hourly)}/h`;
    $('dutiesAnnual').textContent = money(result.duties);
    $('cashCostsAnnual').textContent = money(result.cashCosts);
    $('netAnnual').textContent = money(annualTarget);
    $('taxAnnual').textContent = money(result.incomeTax);
    $('socialAnnual').textContent = money(result.social);
    $('healthAnnual').textContent = money(result.health);
    $('taxProfit').textContent = money(result.taxProfit);
    $('taxExpenseLabel').textContent = expenseLabel(input.expenseMode);
    $('effectiveDutyShare').textContent = pct(result.effectiveDutyShare);
    $('vatInvoice').textContent = input.vatRate > 0 ? money(invoiceWithVat) : 'DPH nepřičteno';

    $('heroTarget').textContent = money(input.targetMonthly);
    $('heroBilling').textContent = money(monthlyCalendar);
    $('heroGap').textContent = money(Math.max(0, monthlyCalendar - input.targetMonthly));

    const activityLabel = input.activity === 'main' ? 'hlavní OSVČ' : 'vedlejší OSVČ';
    const healthText = input.healthMinimum ? 'minimum zdravotního se uplatňuje' : 'minimum zdravotního je vypnuté';
    $('resultMeaning').textContent = `Pro ${money(input.targetMonthly)} čistého měsíčně vychází při ${expenseLabel(input.expenseMode).toLowerCase()}, režimu ${activityLabel} a zadaných nákladech přibližně ${money(monthlyCalendar)} fakturace za kalendářní měsíc. Model počítá standardní daňový režim 2026; ${healthText}.`;

    const socialNote = input.activity === 'side' && !result.socialRequired
      ? `Vedlejší činnost v modelu zůstává pod rozhodnou částkou ${money(CFG.sideThreshold)}, proto sociální pojistné vychází 0 Kč.`
      : input.isNew && input.activity === 'main'
        ? 'Používá se snížené sociální minimum pro oprávněnou novou OSVČ.'
        : 'Sociální pojištění používá zákonný vyměřovací základ a případné minimum.';
    $('socialNote').textContent = socialNote;

    const actualWrap = $('actualTaxExpensesWrap');
    if (actualWrap) actualWrap.hidden = input.expenseMode !== 'actual';

    const sideBox = $('sideSettings');
    if (sideBox) sideBox.hidden = input.activity !== 'side';

    renderWaterfall(result, input);
    renderScenarios(input);
  }

  function setDefaultsForActivity() {
    const activity = selected('activity');
    const health = $('healthMinimum');
    if (health) health.checked = activity !== 'side';
    render();
  }

  function reset() {
    $('targetMonthly').value = 60000;
    $('monthlyCashCosts').value = 10000;
    $('expenseMode').value = '60';
    $('activity').value = 'main';
    $('annualCashCosts').value = 0;
    $('actualTaxExpenses').value = 120000;
    $('taxpayerCredit').checked = true;
    $('deductions').value = 0;
    $('extraCredits').value = 0;
    $('isNew').checked = false;
    $('socialVoluntary').checked = false;
    $('healthMinimum').checked = true;
    $('activeMonths').value = 12;
    $('billableHours').value = 100;
    $('vatRate').value = 0;
    render();
  }

  const form = $('netForm');
  if (form) {
    form.addEventListener('input', render);
    form.addEventListener('change', (event) => {
      if (event.target?.id === 'activity') setDefaultsForActivity();
      else render();
    });
    form.addEventListener('submit', (event) => { event.preventDefault(); render(); });
  }
  $('resetButton')?.addEventListener('click', reset);

  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      menuToggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        nav.classList.remove('is-open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  render();
})();
