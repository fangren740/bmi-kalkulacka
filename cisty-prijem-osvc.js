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
  const num = (id, fallback = 0) => {
    const value = Number($(id)?.value);
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
  };
  const checked = (id) => Boolean($(id)?.checked);
  const selected = (id) => $(id)?.value || '';
  const ceil = (value) => Math.ceil(Math.max(0, value));
  const roundHundredsDown = (value) => Math.floor(Math.max(0, value) / 100) * 100;
  const money = (value) => `${Math.round(value).toLocaleString('cs-CZ')} Kč`;
  const moneyNoUnit = (value) => Math.round(value).toLocaleString('cs-CZ');
  const shortMoney = (value) => {
    const n = Math.max(0, value);
    if (n >= 1000000) return `${(n / 1000000).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} mil.`;
    if (n >= 1000) return `${Math.round(n / 1000).toLocaleString('cs-CZ')} tis.`;
    return Math.round(n).toLocaleString('cs-CZ');
  };
  const pct = (value) => `${(value * 100).toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

  function flatExpense(revenue, mode, actualExpenses) {
    if (mode === 'actual') return Math.min(revenue, Math.max(0, actualExpenses));
    const rate = Number(mode);
    return Math.min(revenue * rate / 100, CONFIG.flatCaps[rate] || 0);
  }

  function socialMinimumBase(activity, isNew) {
    if (activity === 'side') return CONFIG.socialSideMin * 12;
    if (isNew) return CONFIG.socialNewMin * 12;
    return CONFIG.socialMainMinJanJun * 6 + CONFIG.socialMainMinJulDec * 6;
  }

  function calculateAnnual(revenue, input) {
    const taxExpenses = flatExpense(revenue, input.expenseMode, input.actualTaxExpenses);
    const taxProfit = Math.max(0, revenue - taxExpenses);
    const taxBase = roundHundredsDown(Math.max(0, taxProfit - input.deductions));
    const grossTax = ceil(
      Math.min(taxBase, CONFIG.taxThreshold) * 0.15 +
      Math.max(0, taxBase - CONFIG.taxThreshold) * 0.23
    );
    const credits = (input.taxpayerCredit ? CONFIG.taxpayerCredit : 0) + input.extraCredits;
    const incomeTax = Math.max(0, grossTax - credits);

    const socialRequired = input.activity === 'main' || taxProfit >= CONFIG.sideThresholdFull || input.socialVoluntary;
    const socialActualBase = taxProfit * CONFIG.socialBaseShare;
    const socialMinBase = socialMinimumBase(input.activity, input.isNew);
    const socialBase = socialRequired ? Math.min(CONFIG.socialMaxBase, Math.max(socialActualBase, socialMinBase)) : 0;
    const social = socialRequired ? ceil(socialBase * CONFIG.socialRate) : 0;

    const healthActualBase = taxProfit * CONFIG.healthBaseShare;
    const healthMinBase = input.healthMinimum ? CONFIG.healthMinMonthlyBase * 12 : 0;
    const healthBase = Math.max(healthActualBase, healthMinBase);
    const health = ceil(healthBase * CONFIG.healthRate);
    const sick = ceil(input.sickMonthly * 12);
    const duties = incomeTax + social + health + sick;
    const cashCosts = input.monthlyCashCosts * 12 + input.annualInvestments;
    const cashAfter = revenue - cashCosts - duties;

    return {
      revenue,
      taxExpenses,
      taxProfit,
      taxBase,
      incomeTax,
      social,
      health,
      sick,
      duties,
      cashCosts,
      cashAfter,
      effectiveBurden: revenue > 0 ? duties / revenue : 0,
      socialRequired
    };
  }

  function solveRevenue(input) {
    const targetAnnual = input.targetMonthly * 12 * (1 + input.safetyPercent / 100);
    let low = 0;
    let high = Math.max(1000000, targetAnnual + input.monthlyCashCosts * 12 + input.annualInvestments + 500000);
    let result = calculateAnnual(high, input);
    let guard = 0;
    while (result.cashAfter < targetAnnual && high < 100000000 && guard < 30) {
      high *= 1.8;
      result = calculateAnnual(high, input);
      guard += 1;
    }
    for (let i = 0; i < 90; i += 1) {
      const mid = (low + high) / 2;
      const candidate = calculateAnnual(mid, input);
      if (candidate.cashAfter >= targetAnnual) high = mid;
      else low = mid;
    }
    const annualRevenue = Math.ceil(high / 100) * 100;
    const solved = calculateAnnual(annualRevenue, input);
    return { ...solved, targetAnnual };
  }

  function inputBasic() {
    return {
      mode: 'basic',
      targetMonthly: num('basicTarget', 60000),
      monthlyCashCosts: num('basicCosts', 10000),
      expenseMode: selected('basicExpenseMode') || '60',
      actualTaxExpenses: num('basicActualTaxExpenses', 0),
      activity: selected('basicActivity') || 'main',
      taxpayerCredit: true,
      deductions: 0,
      extraCredits: 0,
      isNew: false,
      socialVoluntary: false,
      healthMinimum: selected('basicActivity') !== 'side',
      sickMonthly: 0,
      annualInvestments: 0,
      safetyPercent: 0,
      activeMonths: 12,
      billableDays: 15,
      hoursPerDay: 6,
      vatRate: 0
    };
  }

  function inputAdvanced() {
    const activity = selected('advActivity') || 'main';
    return {
      mode: 'advanced',
      targetMonthly: num('advTarget', 60000),
      monthlyCashCosts: num('advCosts', 10000),
      expenseMode: selected('advExpenseMode') || '60',
      actualTaxExpenses: num('advActualTaxExpenses', 0),
      activity,
      taxpayerCredit: checked('advTaxpayerCredit'),
      deductions: num('advDeductions', 0),
      extraCredits: num('advExtraCredits', 0),
      isNew: checked('advNewOs'),
      socialVoluntary: checked('advSocialVoluntary'),
      healthMinimum: checked('advHealthMinimum'),
      sickMonthly: num('advSickMonthly', 0),
      annualInvestments: num('advInvestments', 0),
      safetyPercent: num('advSafety', 5),
      activeMonths: Math.min(12, Math.max(1, num('advActiveMonths', 10))),
      billableDays: Math.max(1, num('advBillableDays', 14)),
      hoursPerDay: Math.max(0.5, num('advHoursPerDay', 6)),
      vatRate: num('advVatRate', 0)
    };
  }

  function expenseLabel(mode) {
    return mode === 'actual' ? 'Skutečné výdaje' : `Výdajový paušál ${mode} %`;
  }

  function modeInput() {
    return document.body.dataset.mode === 'advanced' ? inputAdvanced() : inputBasic();
  }

  function renderScenarioCards(input) {
    const targets = [40000, 60000, 80000, 100000];
    const grid = $('targetScenarioGrid');
    if (!grid) return;
    grid.innerHTML = targets.map((target) => {
      const solved = solveRevenue({ ...input, targetMonthly: target });
      const monthlyBilling = solved.revenue / input.activeMonths;
      const active = Math.round(input.targetMonthly) === target ? ' is-current' : '';
      return `<article class="scenario-card${active}"><span>Čistý cíl ${money(target)}</span><strong>${money(monthlyBilling)}</strong><small>fakturace v aktivním měsíci</small></article>`;
    }).join('');
  }

  function renderExpenseCards(input) {
    const grid = $('expenseScenarioGrid');
    if (!grid) return;
    const modes = ['80', '60', '40', '30', 'actual'];
    grid.innerHTML = modes.map((mode) => {
      const solved = solveRevenue({ ...input, expenseMode: mode });
      const active = input.expenseMode === mode ? ' is-current' : '';
      return `<article class="scenario-card${active}"><span>${expenseLabel(mode)}</span><strong>${money(solved.revenue / input.activeMonths)}</strong><small>aktivní měsíční fakturace</small></article>`;
    }).join('');
  }

  function renderBreakdown(result, input) {
    const rows = [
      ['Roční fakturace bez DPH', result.revenue, 'Obrat potřebný pro dosažení cílového cash-flow.'],
      ['Skutečné provozní náklady', -input.monthlyCashCosts * 12, 'Pravidelný peněžní provoz za celý rok.'],
      ['Roční investice', -input.annualInvestments, 'Technika, vzdělávání nebo rozvoj nad běžný provoz.'],
      ['Daň z příjmů', -result.incomeTax, 'Výpočet po výdajích, odpočtech a slevách.'],
      ['Sociální pojištění', -result.social, result.socialRequired ? 'Roční pojistné včetně případného minima.' : 'Vedlejší činnost pod rozhodnou částkou.'],
      ['Zdravotní pojištění', -result.health, 'Skutečný nebo minimální vyměřovací základ podle nastavení.'],
      ['Nemocenské pojištění', -result.sick, 'Dobrovolná měsíční platba v PRO režimu.'],
      ['Čisté cash-flow po povinnostech', result.cashAfter, 'Zůstane po nákladech, dani a pojistném.'],
      ['Cílový příjem včetně polštáře', result.targetAnnual, 'Roční cíl po započtení bezpečnostního polštáře.']
    ];
    $('breakdownBody').innerHTML = rows.map(([name, value, note]) => `<tr><td>${name}</td><td>${value < 0 ? '− ' : ''}${money(Math.abs(value))}</td><td>${note}</td></tr>`).join('');
  }

  function render(result, input) {
    const activeMonthly = result.revenue / input.activeMonths;
    const calendarMonthly = result.revenue / 12;
    const dailyRate = activeMonthly / input.billableDays;
    const hourlyRate = dailyRate / input.hoursPerDay;
    const grossVatMonthly = activeMonthly * (1 + input.vatRate / 100);
    const dutiesMonthly = result.duties / 12;
    const reserveShare = result.revenue > 0 ? result.duties / result.revenue : 0;

    $('requiredBilling').textContent = money(activeMonthly);
    $('resultSubtitle').textContent = `Ročně je potřeba vyfakturovat přibližně ${money(result.revenue)} bez DPH.`;
    $('calendarBilling').textContent = money(calendarMonthly);
    $('annualBilling').textContent = money(result.revenue);
    $('monthlyDuties').textContent = money(dutiesMonthly);
    $('monthlyNetCheck').textContent = money(result.cashAfter / 12);
    $('dailyRate').textContent = money(dailyRate);
    $('hourlyRate').textContent = money(hourlyRate);
    $('billingMonthsLabel').textContent = `${input.activeMonths.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} z 12 měsíců`;
    $('billingMonthsFill').style.width = `${Math.min(100, input.activeMonths / 12 * 100)}%`;
    $('taxModeLabel').textContent = expenseLabel(input.expenseMode);
    $('activityLabel').textContent = input.activity === 'main' ? 'Hlavní OSVČ' : 'Vedlejší OSVČ';
    $('burdenLabel').textContent = pct(reserveShare);
    $('grossVatMonthly').textContent = input.vatRate > 0 ? money(grossVatMonthly) : 'Nezapočítáno';
    $('advancedResultPanel').hidden = input.mode !== 'advanced';
    $('resultModeBadge').textContent = input.mode === 'advanced' ? 'PRO model' : 'Základní režim';

    const insightTitle = activeMonthly > 180000 ? 'Cíl vyžaduje vyšší cenu nebo kapacitu' : activeMonthly > 110000 ? 'Cíl je dosažitelný s řízenou kapacitou' : 'Cíl působí jako běžný podnikatelský plán';
    const insightText = `Pro cílových ${money(input.targetMonthly)} měsíčně potřebujete při ${input.activeMonths.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} aktivních měsících fakturovat přibližně ${money(activeMonthly)} za aktivní měsíc. Daň a pojistné tvoří v modelu ${pct(result.effectiveBurden)} obratu.`;
    $('insightTitle').textContent = insightTitle;
    $('insightText').textContent = insightText;

    $('heroBilling').textContent = shortMoney(activeMonthly);
    $('heroTarget').textContent = money(input.targetMonthly);
    $('heroRate').textContent = money(hourlyRate);
    $('heroDuties').textContent = money(dutiesMonthly);

    const taxWidth = result.duties > 0 ? result.incomeTax / result.duties * 100 : 0;
    const socialWidth = result.duties > 0 ? result.social / result.duties * 100 : 0;
    const healthWidth = result.duties > 0 ? result.health / result.duties * 100 : 0;
    $('barTax').style.width = `${taxWidth}%`;
    $('barSocial').style.width = `${socialWidth}%`;
    $('barHealth').style.width = `${healthWidth}%`;
    $('legendTax').textContent = money(result.incomeTax);
    $('legendSocial').textContent = money(result.social);
    $('legendHealth').textContent = money(result.health);

    renderScenarioCards(input);
    renderExpenseCards(input);
    renderBreakdown(result, input);
  }

  function calculateAndRender() {
    const input = modeInput();
    if (input.targetMonthly <= 0) {
      $('formError').hidden = false;
      $('formError').textContent = 'Zadejte cílový měsíční čistý příjem vyšší než nula.';
      return;
    }
    $('formError').hidden = true;
    render(solveRevenue(input), input);
  }

  function setMode(mode, transfer = true) {
    document.body.dataset.mode = mode;
    const basic = mode === 'basic';
    $('basicCalculation').hidden = !basic;
    $('advancedCalculation').hidden = basic;
    $('basicModeTab').classList.toggle('is-active', basic);
    $('advancedModeTab').classList.toggle('is-active', !basic);
    $('basicModeTab').setAttribute('aria-selected', String(basic));
    $('advancedModeTab').setAttribute('aria-selected', String(!basic));
    if (!basic && transfer) {
      $('advTarget').value = $('basicTarget').value;
      $('advCosts').value = $('basicCosts').value;
      $('advExpenseMode').value = $('basicExpenseMode').value;
      $('advActivity').value = $('basicActivity').value;
      $('advHealthMinimum').checked = $('basicActivity').value === 'main';
    }
    calculateAndRender();
  }

  function reset() {
    $('netForm').reset();
    setMode('basic', false);
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('basicModeTab').addEventListener('click', () => setMode('basic'));
    $('advancedModeTab').addEventListener('click', () => setMode('advanced'));
    $('netForm').addEventListener('input', calculateAndRender);
    $('netForm').addEventListener('change', calculateAndRender);
    $('netForm').addEventListener('submit', (event) => {
      event.preventDefault();
      calculateAndRender();
      $('vysledek')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('resetBtn').addEventListener('click', reset);
    $('copyBtn').addEventListener('click', async () => {
      const text = `Potřebná fakturace OSVČ: ${$('requiredBilling').textContent} za aktivní měsíc; ročně ${$('annualBilling').textContent}; orientační hodinová sazba ${$('hourlyRate').textContent}.`;
      try {
        await navigator.clipboard.writeText(text);
        $('copyBtn').textContent = 'Zkopírováno';
        setTimeout(() => { $('copyBtn').textContent = 'Kopírovat výsledek'; }, 1600);
      } catch (_) {
        window.prompt('Zkopírujte výsledek:', text);
      }
    });
    $('printBtn').addEventListener('click', () => window.print());
    setMode('basic', false);
  });
})();
