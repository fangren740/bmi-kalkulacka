(() => {
  'use strict';

  const CONFIG = {
    year: 2026,
    taxThreshold: 1762812,
    taxpayerCredit: 30840,
    employeeSocialRate: 0.071,
    employeeHealthRate: 0.045,
    employerSocialRate: 0.248,
    employerHealthRate: 0.09,
    osvcSocialRate: 0.292,
    osvcSocialBaseShare: 0.55,
    osvcSocialMaxBase: 2350416,
    socialMainMinJanJun: 19587,
    socialMainMinJulDec: 17139,
    socialNewMin: 12242,
    socialSideMin: 5387,
    sideThresholdFull: 117521,
    osvcHealthRate: 0.135,
    osvcHealthBaseShare: 0.5,
    osvcHealthMinMonthlyBase: 24483.5,
    flatCaps: { 80: 1600000, 60: 1200000, 40: 800000, 30: 600000 }
  };

  const $ = id => document.getElementById(id);
  const num = (id, fallback = 0) => {
    const el = $(id);
    const value = Number(el?.value);
    return Number.isFinite(value) ? Math.max(0, value) : fallback;
  };
  const checked = id => Boolean($(id)?.checked);
  const selected = id => $(id)?.value || '';
  const ceil = value => Math.ceil(Math.max(0, value));
  const roundHundredsDown = value => Math.floor(Math.max(0, value) / 100) * 100;
  const money = value => `${Math.round(value).toLocaleString('cs-CZ')} Kč`;
  const shortMoney = value => {
    const n = Math.max(0, value);
    if (n >= 1000000) return `${(n / 1000000).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} mil.`;
    if (n >= 1000) return `${Math.round(n / 1000).toLocaleString('cs-CZ')} tis.`;
    return Math.round(n).toLocaleString('cs-CZ');
  };
  const pct = value => `${(value * 100).toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

  function progressiveTax(base) {
    return ceil(
      Math.min(base, CONFIG.taxThreshold) * 0.15 +
      Math.max(0, base - CONFIG.taxThreshold) * 0.23
    );
  }

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

  function calculateEmployee(input) {
    const grossAnnual = input.grossMonthly * 12 + input.annualBonus;
    const social = ceil(grossAnnual * CONFIG.employeeSocialRate);
    const health = ceil(grossAnnual * CONFIG.employeeHealthRate);
    const grossTax = progressiveTax(roundHundredsDown(grossAnnual));
    const tax = Math.max(0, grossTax - CONFIG.taxpayerCredit - input.extraCredits);
    const netCash = grossAnnual - social - health - tax;
    const benefits = input.benefitsMonthly * 12 + input.benefitsAnnual;
    const employerSocial = ceil(grossAnnual * CONFIG.employerSocialRate);
    const employerHealth = ceil(grossAnnual * CONFIG.employerHealthRate);
    const employerCost = grossAnnual + employerSocial + employerHealth + benefits;
    const valuedBenefits = benefits * input.benefitValueShare;
    const comparisonValue = netCash + valuedBenefits;
    return {
      grossAnnual, social, health, tax, netCash, benefits, valuedBenefits,
      employerSocial, employerHealth, employerCost, comparisonValue,
      monthlyNet: netCash / 12,
      monthlyCost: employerCost / 12
    };
  }

  function calculateOsva(revenue, input) {
    const taxExpenses = flatExpense(revenue, input.expenseMode, input.actualTaxExpenses);
    const taxProfit = Math.max(0, revenue - taxExpenses);
    const taxBase = roundHundredsDown(Math.max(0, taxProfit - input.deductions));
    const grossTax = progressiveTax(taxBase);
    const incomeTax = Math.max(0, grossTax - CONFIG.taxpayerCredit - input.extraCredits);

    const socialRequired = input.activity === 'main' || taxProfit >= CONFIG.sideThresholdFull || input.socialVoluntary;
    const socialActualBase = taxProfit * CONFIG.osvcSocialBaseShare;
    const socialMinBase = socialMinimumBase(input.activity, input.isNew);
    const socialBase = socialRequired ? Math.min(CONFIG.osvcSocialMaxBase, Math.max(socialActualBase, socialMinBase)) : 0;
    const social = socialRequired ? ceil(socialBase * CONFIG.osvcSocialRate) : 0;

    const healthActualBase = taxProfit * CONFIG.osvcHealthBaseShare;
    const healthMinBase = input.healthMinimum ? CONFIG.osvcHealthMinMonthlyBase * 12 : 0;
    const healthBase = Math.max(healthActualBase, healthMinBase);
    const health = ceil(healthBase * CONFIG.osvcHealthRate);
    const sick = ceil(input.sickMonthly * 12);
    const duties = incomeTax + social + health + sick;
    const cashCosts = input.monthlyCashCosts * 12 + input.annualInvestments;
    const privateReserve = input.privateReserveMonthly * 12;
    const netCash = revenue - cashCosts - duties - privateReserve;

    return {
      revenue, taxExpenses, taxProfit, taxBase, incomeTax, social, health, sick,
      duties, cashCosts, privateReserve, netCash,
      monthlyNet: netCash / 12,
      effectiveBurden: revenue > 0 ? duties / revenue : 0,
      socialRequired
    };
  }

  function solveRevenue(targetAnnual, input) {
    let low = 0;
    let high = Math.max(1200000, targetAnnual + input.monthlyCashCosts * 12 + input.annualInvestments + input.privateReserveMonthly * 12 + 600000);
    while (calculateOsva(high, input).netCash < targetAnnual && high < 20000000) high *= 1.5;
    for (let i = 0; i < 70; i += 1) {
      const mid = (low + high) / 2;
      if (calculateOsva(mid, input).netCash >= targetAnnual) high = mid;
      else low = mid;
    }
    return Math.ceil(high / 100) * 100;
  }

  function readBasic() {
    return {
      employee: {
        grossMonthly: num('basicGross', 60000),
        annualBonus: 0,
        benefitsMonthly: num('basicBenefits', 2500),
        benefitsAnnual: 0,
        extraCredits: 0,
        benefitValueShare: 1
      },
      osvc: {
        monthlyCashCosts: num('basicCosts', 8000),
        annualInvestments: 0,
        expenseMode: selected('basicExpenseMode') || '60',
        actualTaxExpenses: num('basicCosts', 8000) * 12,
        activity: selected('basicActivity') || 'main',
        isNew: false,
        healthMinimum: selected('basicActivity') !== 'side',
        socialVoluntary: false,
        deductions: 0,
        extraCredits: 0,
        sickMonthly: 0,
        privateReserveMonthly: 0,
        activeMonths: 11,
        billableDays: 15,
        hoursPerDay: 6,
        vatRate: 0,
        riskPremium: 0,
        dependentRisk: false
      }
    };
  }

  function readAdvanced() {
    const actualTaxExpenses = num('advActualTaxExpenses', 0) || (num('advCosts', 10000) * 12 + num('advInvestments', 30000));
    return {
      employee: {
        grossMonthly: num('advGross', 60000),
        annualBonus: num('advBonus', 60000),
        benefitsMonthly: num('advBenefitsMonthly', 3000),
        benefitsAnnual: num('advBenefitsAnnual', 10000),
        extraCredits: num('advEmployeeCredits', 0),
        benefitValueShare: num('advBenefitValue', 100) / 100
      },
      osvc: {
        monthlyCashCosts: num('advCosts', 10000),
        annualInvestments: num('advInvestments', 30000),
        expenseMode: selected('advExpenseMode') || '60',
        actualTaxExpenses,
        activity: selected('advActivity') || 'main',
        isNew: checked('advNewOsva'),
        healthMinimum: checked('advHealthMinimum'),
        socialVoluntary: checked('advSocialVoluntary'),
        deductions: num('advDeductions', 0),
        extraCredits: num('advOsvaCredits', 0),
        sickMonthly: num('advSickMonthly', 0),
        privateReserveMonthly: num('advPrivateReserve', 5000),
        activeMonths: Math.max(1, Math.min(12, num('advActiveMonths', 10.5))),
        billableDays: Math.max(1, num('advBillableDays', 15)),
        hoursPerDay: Math.max(1, num('advHours', 6)),
        vatRate: Number(selected('advVatRate') || 0) / 100,
        riskPremium: num('advRiskPremium', 10) / 100,
        dependentRisk: checked('advDependentRisk')
      }
    };
  }

  function currentInput() {
    return document.body.dataset.mode === 'advanced' ? readAdvanced() : readBasic();
  }

  function expenseLabel(mode) {
    return mode === 'actual' ? 'Skutečné výdaje' : `Paušál ${mode} %`;
  }

  function renderScenarios(baseInput) {
    const grid = $('salaryScenarioGrid');
    if (!grid) return;
    const salaries = [40000, 60000, 80000, 100000];
    const current = baseInput.employee.grossMonthly;
    grid.innerHTML = salaries.map(gross => {
      const employee = calculateEmployee({ ...baseInput.employee, grossMonthly: gross, annualBonus: 0 });
      const osvc = calculateOsva(employee.employerCost, baseInput.osvc);
      const active = Math.abs(gross - current) < 1 ? ' is-current' : '';
      return `<article class="scenario-card${active}"><span>Hrubá mzda ${money(gross)}</span><strong>${money(employee.monthlyCost)}</strong><small>náklad firmy · OSVČ čisté ${money(osvc.monthlyNet)}</small></article>`;
    }).join('');
  }

  function renderBreakdown(employee, osvc, equivalentRevenue) {
    const body = $('breakdownBody');
    if (!body) return;
    const rows = [
      ['Roční příjem / hrubá mzda', employee.grossAnnual, osvc.revenue],
      ['Sociální pojištění osoby', employee.social, osvc.social],
      ['Zdravotní pojištění osoby', employee.health, osvc.health],
      ['Daň z příjmů', employee.tax, osvc.incomeTax],
      ['Skutečné provozní náklady', 0, osvc.cashCosts],
      ['Soukromé rezervy OSVČ', 0, osvc.privateReserve],
      ['Čisté peníze za rok', employee.netCash, osvc.netCash],
      ['Celkový rozpočet firmy / klienta', employee.employerCost, osvc.revenue],
      ['Fakturace pro srovnatelný balíček', employee.employerCost, equivalentRevenue]
    ];
    body.innerHTML = rows.map(([name, emp, osv]) => `<tr><td>${name}</td><td>${money(emp)}</td><td>${money(osv)}</td></tr>`).join('');
  }

  function render() {
    const input = currentInput();
    const employee = calculateEmployee(input.employee);
    const osvcSameBudget = calculateOsva(employee.employerCost, input.osvc);
    const targetValue = employee.comparisonValue * (1 + input.osvc.riskPremium);
    const equivalentRevenue = solveRevenue(targetValue, input.osvc);
    const equivalentOsva = calculateOsva(equivalentRevenue, input.osvc);
    const deltaMonthly = osvcSameBudget.monthlyNet - employee.monthlyNet;
    const activeInvoice = equivalentRevenue / input.osvc.activeMonths;
    const dailyRate = activeInvoice / input.osvc.billableDays;
    const hourlyRate = dailyRate / input.osvc.hoursPerDay;
    const invoiceWithVat = activeInvoice * (1 + input.osvc.vatRate);

    $('employeeNet').textContent = money(employee.monthlyNet);
    $('osvcNet').textContent = money(osvcSameBudget.monthlyNet);
    $('employerBudget').textContent = money(employee.monthlyCost);
    $('deltaMonthly').textContent = `${deltaMonthly >= 0 ? '+' : '−'}${money(Math.abs(deltaMonthly))} / měsíc`;
    $('employeeInsurance').textContent = money((employee.social + employee.health) / 12);
    $('employeeTax').textContent = money(employee.tax / 12);
    $('osvcDuties').textContent = money(osvcSameBudget.duties / 12);
    $('osvcCosts').textContent = money((osvcSameBudget.cashCosts + osvcSameBudget.privateReserve) / 12);
    $('equivalentInvoice').textContent = money(equivalentRevenue / 12);
    $('equivalentActiveInvoice').textContent = money(activeInvoice);
    $('rateDay').textContent = money(dailyRate);
    $('rateHour').textContent = money(hourlyRate);
    $('invoiceVat').textContent = input.osvc.vatRate > 0 ? money(invoiceWithVat) : 'Nezapočítáno';
    $('taxModeLabel').textContent = expenseLabel(input.osvc.expenseMode);
    $('resultModeLabel').textContent = document.body.dataset.mode === 'advanced' ? 'PRO srovnání' : 'Základní režim';

    $('heroBudget').textContent = shortMoney(employee.monthlyCost);
    $('heroEmployee').textContent = shortMoney(employee.monthlyNet);
    $('heroOsva').textContent = shortMoney(osvcSameBudget.monthlyNet);
    $('heroEquivalent').textContent = shortMoney(equivalentRevenue / 12);
    $('heroRate').textContent = shortMoney(hourlyRate);

    const advanced = $('advancedResult');
    if (advanced) advanced.hidden = document.body.dataset.mode !== 'advanced';

    const insight = $('resultInsight');
    const ratio = employee.monthlyCost > 0 ? (equivalentRevenue / 12) / employee.monthlyCost : 0;
    let headline = 'Porovnávejte celý balíček, ne hrubou mzdu s fakturou';
    let text = `Firma u zaměstnance vydává přibližně ${money(employee.monthlyCost)} měsíčně. Při stejném rozpočtu zůstává v modelu OSVČ ${money(osvcSameBudget.monthlyNet)} po skutečných nákladech a odvodech.`;
    if (ratio > 1.05) {
      headline = 'Stejný čistý standard vyžaduje vyšší fakturaci než dnešní náklad firmy';
      text = `Pro zadanou hodnotu benefitů, soukromé rezervy a rizikovou přirážku potřebuje OSVČ přibližně ${money(equivalentRevenue / 12)} měsíčně. To je více než současný měsíční rozpočet firmy.`;
    } else if (ratio < 0.82) {
      headline = 'Daňový model OSVČ vytváří prostor, ale není to automatická výhoda';
      text = `Srovnatelný čistý balíček vychází kolem ${money(equivalentRevenue / 12)} měsíčně. Rozdíl musí pokrýt neplacený čas, podnikatelské riziko, rezervu, pojištění a obchodní výpadky.`;
    }
    insight.innerHTML = `<strong>${headline}</strong><p>${text}</p>`;

    const alert = $('riskAlert');
    if (input.osvc.dependentRisk) {
      alert.hidden = false;
      alert.innerHTML = '<strong>Pozor na znaky závislé práce</strong>Pokud by práce probíhala osobně podle pokynů firmy, v určené pracovní době, jejím jménem a na její odpovědnost, finanční výhodnost sama o sobě neznamená, že lze pracovní poměr nahradit fakturací.';
    } else {
      alert.hidden = document.body.dataset.mode !== 'advanced';
      alert.innerHTML = '<strong>Právní forma musí odpovídat realitě</strong>Kalkulačka porovnává peníze. Neposuzuje, zda konkrétní spolupráce naplňuje znaky samostatného podnikání nebo závislé práce.';
    }

    renderScenarios(input);
    renderBreakdown(employee, osvcSameBudget, equivalentRevenue);

    const comparison = $('comparisonSummary');
    if (comparison) comparison.textContent = `Zaměstnanec: ${money(employee.monthlyNet)} čistého · OSVČ při stejném rozpočtu: ${money(osvcSameBudget.monthlyNet)} · fakturace pro srovnatelný balíček: ${money(equivalentRevenue / 12)} měsíčně.`;

    return { input, employee, osvcSameBudget, equivalentRevenue, equivalentOsva };
  }

  function switchMode(mode) {
    document.body.dataset.mode = mode;
    $('basicCalculation').hidden = mode !== 'basic';
    $('advancedCalculation').hidden = mode !== 'advanced';
    document.querySelectorAll('.mode-button').forEach(button => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    if (mode === 'advanced') {
      $('advGross').value = $('basicGross').value;
      $('advBenefitsMonthly').value = $('basicBenefits').value;
      $('advCosts').value = $('basicCosts').value;
      $('advExpenseMode').value = $('basicExpenseMode').value;
      $('advActivity').value = $('basicActivity').value;
      $('advHealthMinimum').checked = $('basicActivity').value !== 'side';
    }
    render();
  }

  function resetForm() {
    $('comparisonForm').reset();
    document.body.dataset.mode = 'basic';
    $('basicCalculation').hidden = false;
    $('advancedCalculation').hidden = true;
    document.querySelectorAll('.mode-button').forEach(button => {
      const active = button.dataset.mode === 'basic';
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', String(active));
    });
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    const form = $('comparisonForm');
    if (!form) return;
    form.addEventListener('input', render);
    form.addEventListener('change', render);
    form.addEventListener('submit', event => { event.preventDefault(); render(); });
    document.querySelectorAll('.mode-button').forEach(button => button.addEventListener('click', () => switchMode(button.dataset.mode)));
    $('resetComparison')?.addEventListener('click', resetForm);
    $('copyComparison')?.addEventListener('click', async () => {
      const text = $('comparisonSummary')?.textContent || '';
      try {
        await navigator.clipboard.writeText(text);
        $('copyComparison').textContent = 'Zkopírováno';
        setTimeout(() => { $('copyComparison').textContent = 'Kopírovat výsledek'; }, 1400);
      } catch (error) {
        window.prompt('Zkopírujte výsledek:', text);
      }
    });
    $('printComparison')?.addEventListener('click', () => window.print());
    render();
  });
})();
