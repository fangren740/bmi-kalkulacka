(() => {
  'use strict';

  const TAX_THRESHOLD_2026 = 1762812;
  const FLAT_EXPENSE_CAP = 600000;
  const $ = (id) => document.getElementById(id);
  const all = (selector) => Array.from(document.querySelectorAll(selector));
  const money = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });
  let activeMode = 'basic';
  let activeStep = 1;
  let lastResult = null;

  const value = (id, fallback = 0) => {
    const el = $(id);
    if (!el) return fallback;
    const parsed = Number(String(el.value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const formatMoney = (n) => money.format(Math.round(Number.isFinite(n) ? n : 0));
  const formatSigned = (n) => `${n > 0 ? '+' : ''}${formatMoney(n)}`;
  const annualTax = (base) => {
    const safeBase = Math.max(0, base);
    return Math.min(safeBase, TAX_THRESHOLD_2026) * 0.15 + Math.max(0, safeBase - TAX_THRESHOLD_2026) * 0.23;
  };

  function getBasicInputs() {
    return {
      mode: 'basic',
      rent: Math.max(0, value('basicRent')),
      otherIncome: 0,
      vacancyWeeks: clamp(value('basicVacancy'), 0, 52),
      lossRate: 0,
      ownerMonthly: Math.max(0, value('basicOwnerCosts')),
      maintenanceMonthly: Math.max(0, value('basicMaintenance')),
      annualOther: Math.max(0, value('basicAnnual')),
      capexAnnual: 0,
      managementMode: 'fixed',
      managementValue: 0,
      mortgageMonthly: Math.max(0, value('basicMortgage')),
      otherDebtMonthly: 0,
      refixPayment: Math.max(0, value('basicMortgage')) * 1.2,
      targetBuffer: 0,
      taxMode: 'none',
      expenseMethod: 'flat',
      taxExpenses: 0,
      depreciation: 0,
      otherTaxBase: 0,
      rentGrowth: 0,
      costGrowth: 0,
      debtGrowth: 0,
      loanBalance: 0,
      interestRate: 0
    };
  }

  function getProInputs() {
    return {
      mode: 'pro',
      rent: Math.max(0, value('proRent')),
      otherIncome: Math.max(0, value('proOtherIncome')),
      vacancyWeeks: clamp(value('proVacancy'), 0, 52),
      lossRate: clamp(value('proLossRate'), 0, 100),
      ownerMonthly: Math.max(0, value('proSvj')) + Math.max(0, value('proInsurance')),
      maintenanceMonthly: Math.max(0, value('proMaintenance')),
      annualOther: Math.max(0, value('proPropertyTax')) + Math.max(0, value('proOtherAnnual')),
      capexAnnual: Math.max(0, value('proCapex')),
      managementMode: $('proManagementMode')?.value || 'fixed',
      managementValue: Math.max(0, value('proManagement')),
      mortgageMonthly: Math.max(0, value('proMortgage')),
      otherDebtMonthly: Math.max(0, value('proOtherDebt')),
      refixPayment: Math.max(0, value('proRefixPayment')),
      targetBuffer: Math.max(0, value('proTargetBuffer')),
      taxMode: $('proTaxMode')?.value || 'none',
      expenseMethod: $('proExpenseMethod')?.value || 'flat',
      taxExpenses: Math.max(0, value('proTaxExpenses')),
      depreciation: Math.max(0, value('proDepreciation')),
      otherTaxBase: Math.max(0, value('proOtherTaxBase')),
      rentGrowth: value('proRentGrowth'),
      costGrowth: value('proCostGrowth'),
      debtGrowth: value('proDebtGrowth'),
      loanBalance: Math.max(0, value('proLoanBalance')),
      interestRate: Math.max(0, value('proInterest'))
    };
  }

  function calculateModel(input, overrides = {}) {
    const i = { ...input, ...overrides };
    const occupiedShare = clamp(1 - i.vacancyWeeks / 52, 0, 1);
    const collectedRent = i.rent * 12 * occupiedShare * (1 - i.lossRate / 100);
    const otherIncomeAnnual = i.otherIncome * 12;
    const effectiveIncomeAnnual = collectedRent + otherIncomeAnnual;
    const managementAnnual = i.managementMode === 'percent'
      ? effectiveIncomeAnnual * clamp(i.managementValue, 0, 100) / 100
      : i.managementValue * 12;
    const fixedOperatingAnnual = (i.ownerMonthly + i.maintenanceMonthly) * 12 + i.annualOther + i.capexAnnual;
    const operatingAnnual = fixedOperatingAnnual + managementAnnual;
    const debtAnnual = (i.mortgageMonthly + i.otherDebtMonthly) * 12;
    const noiAnnual = effectiveIncomeAnnual - operatingAnnual;
    const preTaxAnnual = noiAnnual - debtAnnual;

    let taxExpense = 0;
    let rentalTaxBase = 0;
    let taxAnnual = 0;
    if (i.taxMode !== 'none') {
      if (i.expenseMethod === 'actual') {
        taxExpense = i.taxExpenses + i.depreciation;
      } else {
        taxExpense = Math.min(effectiveIncomeAnnual * 0.30, FLAT_EXPENSE_CAP);
      }
      rentalTaxBase = Math.max(0, effectiveIncomeAnnual - taxExpense);
      if (i.taxMode === 'progressive') {
        taxAnnual = Math.max(0, annualTax(i.otherTaxBase + rentalTaxBase) - annualTax(i.otherTaxBase));
      } else {
        taxAnnual = rentalTaxBase * 0.15;
      }
    }
    const afterTaxAnnual = preTaxAnnual - taxAnnual;
    const dscr = debtAnnual > 0 ? noiAnnual / debtAnnual : null;
    const vacancyLossAnnual = i.rent * 12 - collectedRent;
    const estimatedInterestAnnual = i.loanBalance * (i.interestRate / 100);

    return {
      input: i,
      occupiedShare,
      collectedRent,
      otherIncomeAnnual,
      effectiveIncomeAnnual,
      vacancyLossAnnual,
      managementAnnual,
      fixedOperatingAnnual,
      operatingAnnual,
      debtAnnual,
      noiAnnual,
      preTaxAnnual,
      taxExpense,
      rentalTaxBase,
      taxAnnual,
      afterTaxAnnual,
      monthlyPreTax: preTaxAnnual / 12,
      monthlyAfterTax: afterTaxAnnual / 12,
      dscr,
      estimatedInterestAnnual
    };
  }

  function breakEvenRent(input) {
    const occupiedFactor = 12 * clamp(1 - input.vacancyWeeks / 52, 0, 1) * (1 - input.lossRate / 100);
    if (occupiedFactor <= 0) return Infinity;
    const otherAnnual = input.otherIncome * 12;
    const fixedOps = (input.ownerMonthly + input.maintenanceMonthly) * 12 + input.annualOther + input.capexAnnual;
    const debt = (input.mortgageMonthly + input.otherDebtMonthly) * 12;
    if (input.managementMode === 'percent') {
      const rate = clamp(input.managementValue, 0, 99) / 100;
      return Math.max(0, (fixedOps + debt - otherAnnual * (1 - rate)) / (occupiedFactor * (1 - rate)));
    }
    const management = input.managementValue * 12;
    return Math.max(0, (fixedOps + management + debt - otherAnnual) / occupiedFactor);
  }

  function targetRent(input) {
    const targetAnnual = input.targetBuffer * 12;
    let low = 0;
    let high = Math.max(input.rent * 4, 100000);
    for (let n = 0; n < 60; n += 1) {
      const mid = (low + high) / 2;
      const result = calculateModel(input, { rent: mid, taxMode: 'none' });
      if (result.preTaxAnnual < targetAnnual) low = mid;
      else high = mid;
    }
    return high;
  }

  function stressResults(input) {
    const base = calculateModel(input);
    const vacancy = calculateModel(input, { vacancyWeeks: clamp(input.vacancyWeeks + 4, 0, 52) });
    const costs = calculateModel(input, {
      ownerMonthly: input.ownerMonthly * 1.15,
      maintenanceMonthly: input.maintenanceMonthly * 1.15,
      annualOther: input.annualOther * 1.15,
      capexAnnual: input.capexAnnual * 1.15,
      managementValue: input.managementMode === 'fixed' ? input.managementValue * 1.15 : input.managementValue
    });
    const stressedMortgage = input.mode === 'pro' && input.refixPayment > 0
      ? input.refixPayment
      : input.mortgageMonthly * 1.2;
    const debt = calculateModel(input, { mortgageMonthly: stressedMortgage });
    const combined = calculateModel(input, {
      vacancyWeeks: clamp(input.vacancyWeeks + 4, 0, 52),
      ownerMonthly: input.ownerMonthly * 1.15,
      maintenanceMonthly: input.maintenanceMonthly * 1.15,
      annualOther: input.annualOther * 1.15,
      capexAnnual: input.capexAnnual * 1.15,
      managementValue: input.managementMode === 'fixed' ? input.managementValue * 1.15 : input.managementValue,
      mortgageMonthly: stressedMortgage
    });
    return { base, vacancy, costs, debt, combined };
  }

  function buildProjection(input) {
    const rows = [];
    for (let year = 1; year <= 5; year += 1) {
      const rentFactor = Math.pow(1 + input.rentGrowth / 100, year - 1);
      const costFactor = Math.pow(1 + input.costGrowth / 100, year - 1);
      const debtFactor = Math.pow(1 + input.debtGrowth / 100, Math.max(0, year - 1));
      const yearInput = {
        ...input,
        rent: input.rent * rentFactor,
        otherIncome: input.otherIncome * rentFactor,
        ownerMonthly: input.ownerMonthly * costFactor,
        maintenanceMonthly: input.maintenanceMonthly * costFactor,
        annualOther: input.annualOther * costFactor,
        capexAnnual: input.capexAnnual * costFactor,
        managementValue: input.managementMode === 'fixed' ? input.managementValue * costFactor : input.managementValue,
        mortgageMonthly: input.mortgageMonthly * debtFactor,
        otherDebtMonthly: input.otherDebtMonthly * debtFactor,
        taxExpenses: input.taxExpenses * costFactor,
        depreciation: input.depreciation
      };
      rows.push({ year, result: calculateModel(yearInput) });
    }
    return rows;
  }

  function setBar(id, value, max) {
    const el = $(id);
    if (!el) return;
    el.style.width = `${clamp(max > 0 ? Math.abs(value) / max * 100 : 0, 0, 100)}%`;
  }

  function updateStatus(monthly, effectiveMonthly) {
    const score = $('cashflowScore');
    score?.classList.remove('is-positive', 'is-negative');
    const margin = effectiveMonthly > 0 ? monthly / effectiveMonthly : 0;
    let label = 'Na hraně bez bezpečnostní rezervy';
    let message = 'Cashflow je blízko nule. I malý výpadek nájmu nebo oprava může vytvořit doplatek z vlastních peněz.';
    if (monthly >= 3000 && margin >= 0.10) {
      label = 'Zdravější kladné cashflow';
      message = 'Byt vytváří kladnou hotovost a má viditelnou rezervu. Přesto zkontrolujte kombinovaný stres a čistý výnos vůči pořizovací ceně.';
      score?.classList.add('is-positive');
    } else if (monthly > 0) {
      label = 'Kladné, ale citlivé cashflow';
      message = 'Byt je v plusu, ale rezerva je úzká. Výsledek může snadno zhoršit prázdný měsíc, větší oprava nebo vyšší splátka.';
      score?.classList.add('is-positive');
    } else if (monthly < 0) {
      label = 'Záporné cashflow – pravidelný doplatek';
      message = 'Provoz a financování spotřebují více peněz, než pronájem přináší. Prověřte vyšší reálný nájem, nižší cenu, větší vlastní kapitál nebo levnější financování.';
      score?.classList.add('is-negative');
    }
    $('cashflowStatus').textContent = label;
    $('resultMessage').textContent = message;
    $('heroStatus').textContent = label.replace(' cashflow', '');
    return label;
  }

  function renderProjection(input) {
    const tbody = $('projectionBody');
    if (!tbody) return;
    const rows = buildProjection(input);
    tbody.innerHTML = rows.map(({ year, result }) => `
      <tr>
        <td>Rok ${year}</td>
        <td>${formatMoney(result.effectiveIncomeAnnual)}</td>
        <td>${formatMoney(result.operatingAnnual)}</td>
        <td>${formatMoney(result.debtAnnual)}</td>
        <td>${formatMoney(result.taxAnnual)}</td>
        <td>${formatSigned(result.afterTaxAnnual)}</td>
      </tr>`).join('');
  }

  function render() {
    const input = activeMode === 'pro' ? getProInputs() : getBasicInputs();
    const result = calculateModel(input);
    const stress = stressResults(input);
    const breakEven = breakEvenRent(input);
    const target = activeMode === 'pro' ? targetRent(input) : breakEven;
    const displayedMonthly = input.taxMode === 'none' ? result.monthlyPreTax : result.monthlyAfterTax;
    const effectiveMonthly = result.effectiveIncomeAnnual / 12;
    const status = updateStatus(displayedMonthly, effectiveMonthly);

    $('monthlyCashflow').textContent = formatSigned(displayedMonthly);
    $('yearlyCashflow').textContent = formatSigned(result.preTaxAnnual);
    $('afterTaxCashflow').textContent = input.taxMode === 'none' ? 'nezahrnuto' : formatSigned(result.afterTaxAnnual);
    $('breakEvenRent').textContent = Number.isFinite(breakEven) ? formatMoney(breakEven) : 'nelze spočítat';
    $('dscrValue').textContent = result.dscr === null ? 'bez dluhu' : number.format(result.dscr);
    $('effectiveIncome').textContent = formatMoney(result.effectiveIncomeAnnual / 12);
    $('operatingCosts').textContent = formatMoney(result.operatingAnnual / 12);
    $('debtCosts').textContent = formatMoney(result.debtAnnual / 12);
    $('taxReserve').textContent = input.taxMode === 'none' ? 'nezahrnuta' : formatMoney(result.taxAnnual / 12);

    const maxLayer = Math.max(result.effectiveIncomeAnnual, result.operatingAnnual, result.debtAnnual, result.taxAnnual, 1);
    setBar('barIncome', result.effectiveIncomeAnnual, maxLayer);
    setBar('barOperating', result.operatingAnnual, maxLayer);
    setBar('barDebt', result.debtAnnual, maxLayer);
    setBar('barTax', result.taxAnnual, maxLayer);

    $('stressVacancy').textContent = `${formatSigned(stress.vacancy.monthlyAfterTax)} / měs.`;
    $('stressCosts').textContent = `${formatSigned(stress.costs.monthlyAfterTax)} / měs.`;
    $('stressDebt').textContent = `${formatSigned(stress.debt.monthlyAfterTax)} / měs.`;
    $('stressCombined').textContent = `${formatSigned(stress.combined.monthlyAfterTax)} / měs.`;
    $('targetRentValue').textContent = Number.isFinite(target) ? `${formatMoney(target)} / měs.` : 'nelze spočítat';
    $('targetRentText').textContent = activeMode === 'pro'
      ? `Pro přebytek ${formatMoney(input.targetBuffer)} měsíčně před daní potřebujete při zadané obsazenosti přibližně tento čistý smluvní nájem.`
      : 'Hodnota odpovídá nájmu, při kterém je základní cashflow před zdaněním přibližně na nule.';

    $('heroRent').textContent = formatMoney(input.rent);
    $('heroOps').textContent = `− ${formatMoney(result.operatingAnnual / 12)}`;
    $('heroDebt').textContent = `− ${formatMoney(result.debtAnnual / 12)}`;
    $('heroCashflow').textContent = formatSigned(displayedMonthly);

    renderProjection(input);
    lastResult = { input, result, stress, breakEven, target, displayedMonthly, status };
  }

  function setMode(mode) {
    activeMode = mode;
    all('.mode-btn').forEach((button) => button.classList.toggle('is-active', button.dataset.mode === mode));
    all('.mode-panel').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === mode));
    render();
  }

  function updateStep() {
    all('.pro-step').forEach((button) => {
      const step = Number(button.dataset.step);
      button.classList.toggle('is-active', step === activeStep);
      button.classList.toggle('is-done', step < activeStep);
    });
    all('.pro-stage').forEach((stage) => stage.classList.toggle('is-active', Number(stage.dataset.stage) === activeStep));
    $('stepCounter').textContent = `Krok ${activeStep} ze 4`;
    $('prevStep').disabled = activeStep === 1;
    $('nextStep').textContent = activeStep === 4 ? 'Hotovo – zobrazit výsledek' : 'Pokračovat';
  }

  function applyPreset(name) {
    const presets = {
      cash: { basicRent: 20000, basicMortgage: 0, basicOwnerCosts: 2900, basicMaintenance: 1700, basicVacancy: 2, basicAnnual: 7000 },
      balanced: { basicRent: 22000, basicMortgage: 14500, basicOwnerCosts: 3200, basicMaintenance: 1500, basicVacancy: 2, basicAnnual: 6000 },
      tight: { basicRent: 21000, basicMortgage: 16600, basicOwnerCosts: 3500, basicMaintenance: 1600, basicVacancy: 4, basicAnnual: 9000 }
    };
    Object.entries(presets[name] || {}).forEach(([id, val]) => { if ($(id)) $(id).value = val; });
    render();
  }

  function resetBasic() {
    applyPreset('balanced');
  }

  function updateConditionalFields() {
    const actual = $('proExpenseMethod')?.value === 'actual';
    const progressive = $('proTaxMode')?.value === 'progressive';
    all('.conditional-actual').forEach((el) => el.classList.toggle('is-visible', actual));
    all('.conditional-progressive').forEach((el) => el.classList.toggle('is-visible', progressive));
    const managementPercent = $('proManagementMode')?.value === 'percent';
    $('managementUnit').textContent = managementPercent ? '% z příjmu' : 'Kč/měs.';
    if (managementPercent && value('proManagement') > 30) $('proManagement').value = 8;
    render();
  }

  function copyResult() {
    if (!lastResult) return;
    const { input, result, breakEven, displayedMonthly, status } = lastResult;
    const text = [
      'Cashflow z pronájmu – RychléVýpočty.cz',
      `Režim: ${input.mode === 'pro' ? 'PRO' : 'základní'}`,
      `Měsíční cashflow: ${formatSigned(displayedMonthly)}`,
      `Roční cashflow před daní: ${formatSigned(result.preTaxAnnual)}`,
      `Efektivní příjem: ${formatMoney(result.effectiveIncomeAnnual)}/rok`,
      `Provozní náklady: ${formatMoney(result.operatingAnnual)}/rok`,
      `Financování: ${formatMoney(result.debtAnnual)}/rok`,
      `Break-even nájem: ${Number.isFinite(breakEven) ? formatMoney(breakEven) : 'nelze spočítat'}/měs.`,
      `Hodnocení: ${status}`
    ].join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      const button = $('copyResult');
      const original = button.textContent;
      button.textContent = 'Zkopírováno';
      window.setTimeout(() => { button.textContent = original; }, 1600);
    }).catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', () => {
    all('.mode-btn').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
    all('[data-preset]').forEach((button) => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
    all('.pro-step').forEach((button) => button.addEventListener('click', () => { activeStep = Number(button.dataset.step); updateStep(); }));
    $('prevStep')?.addEventListener('click', () => { activeStep = Math.max(1, activeStep - 1); updateStep(); });
    $('nextStep')?.addEventListener('click', () => {
      if (activeStep < 4) { activeStep += 1; updateStep(); }
      else $('vysledek')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('rentalForm')?.addEventListener('submit', (event) => { event.preventDefault(); render(); $('vysledek')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('resetBasic')?.addEventListener('click', resetBasic);
    $('proExpenseMethod')?.addEventListener('change', updateConditionalFields);
    $('proTaxMode')?.addEventListener('change', updateConditionalFields);
    $('proManagementMode')?.addEventListener('change', updateConditionalFields);
    $('copyResult')?.addEventListener('click', copyResult);
    $('printResult')?.addEventListener('click', () => window.print());
    all('#rentalForm input, #rentalForm select').forEach((el) => {
      el.addEventListener('input', render);
      el.addEventListener('change', render);
    });
    updateConditionalFields();
    updateStep();
    render();
  });
})();
