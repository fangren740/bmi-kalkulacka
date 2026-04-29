(function () {
  const form = document.getElementById('affordForm');
  if (!form) return;

  const Kč = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const pct = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });

  const defaults = {
    couple: { income: 85000, livingCosts: 29000, debts: 0, savings: 1300000, propertyPrice: 5200000, monthlyHomeCosts: 9000, interestRate: 4.89, years: 30, targetLtv: 80, reserveMonths: 6, purchaseCosts: 2.5, safeHousingShare: 40 },
    family: { income: 105000, livingCosts: 43000, debts: 3500, savings: 1650000, propertyPrice: 6200000, monthlyHomeCosts: 11500, interestRate: 4.89, years: 30, targetLtv: 80, reserveMonths: 6, purchaseCosts: 2.8, safeHousingShare: 38 },
    single: { income: 52000, livingCosts: 21000, debts: 0, savings: 720000, propertyPrice: 3300000, monthlyHomeCosts: 6500, interestRate: 4.89, years: 30, targetLtv: 80, reserveMonths: 5, purchaseCosts: 2.5, safeHousingShare: 40 }
  };

  const $ = (id) => document.getElementById(id);
  const number = (id) => Number($(id)?.value || 0);
  const money = (value) => `${Kč.format(Math.round(value))} Kč`;
  const percent = (value) => `${pct.format(Math.round(value))} %`;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function monthlyPayment(principal, annualRate, years) {
    if (principal <= 0 || years <= 0) return 0;
    const months = years * 12;
    const r = annualRate / 100 / 12;
    if (r === 0) return principal / months;
    return principal * r * Math.pow(1 + r, months) / (Math.pow(1 + r, months) - 1);
  }

  function loanFromPayment(payment, annualRate, years) {
    if (payment <= 0 || years <= 0) return 0;
    const months = years * 12;
    const r = annualRate / 100 / 12;
    if (r === 0) return payment * months;
    return payment * (Math.pow(1 + r, months) - 1) / (r * Math.pow(1 + r, months));
  }

  function setText(id, value) {
    const node = $(id);
    if (node) node.textContent = value;
  }

  function setWidth(id, value) {
    const node = $(id);
    if (node) node.style.width = `${clamp(value, 3, 100)}%`;
  }

  function readValues() {
    return {
      income: number('income'),
      livingCosts: number('livingCosts'),
      debts: number('debts'),
      savings: number('savings'),
      propertyPrice: number('propertyPrice'),
      monthlyHomeCosts: number('monthlyHomeCosts'),
      interestRate: number('interestRate'),
      years: number('years'),
      targetLtv: number('targetLtv') / 100,
      reserveMonths: number('reserveMonths'),
      purchaseCosts: number('purchaseCosts') / 100,
      safeHousingShare: number('safeHousingShare') / 100
    };
  }

  function validate(v) {
    const errors = [];
    if (v.income <= 0) errors.push('Zadejte čistý příjem domácnosti.');
    if (v.propertyPrice <= 0) errors.push('Zadejte cenu nemovitosti.');
    if (v.savings < 0 || v.livingCosts < 0 || v.debts < 0) errors.push('Výdaje, splátky ani úspory nemohou být záporné.');
    if (v.interestRate < 0 || v.interestRate > 25) errors.push('Zkontrolujte úrokovou sazbu.');
    if (v.years < 1 || v.years > 40) errors.push('Doba splácení musí být mezi 1 a 40 lety.');
    if (v.targetLtv <= 0 || v.targetLtv > 0.95) errors.push('LTV musí být realistické, maximálně 95 %.');
    return errors;
  }

  function calculate() {
    const v = readValues();
    const errorBox = $('affordError');
    const errors = validate(v);
    if (errors.length) {
      errorBox.textContent = errors.join(' ');
      errorBox.classList.add('show');
      return;
    }
    errorBox.textContent = '';
    errorBox.classList.remove('show');

    const purchaseCostMoney = v.propertyPrice * v.purchaseCosts;
    const reserveTarget = (v.livingCosts + v.monthlyHomeCosts + v.debts) * v.reserveMonths;
    const availableForPurchase = Math.max(0, v.savings - reserveTarget - purchaseCostMoney);
    const loanNeeded = Math.max(0, v.propertyPrice - availableForPurchase);
    const ltv = loanNeeded / v.propertyPrice;
    const payment = monthlyPayment(loanNeeded, v.interestRate, v.years);
    const totalHousing = payment + v.monthlyHomeCosts;
    const housingShare = v.income ? totalHousing / v.income : 0;
    const leftAfterHousing = v.income - totalHousing - v.livingCosts - v.debts;
    const leftShare = v.income ? leftAfterHousing / v.income : 0;
    const savingsAfterPurchase = v.savings - (v.propertyPrice - loanNeeded) - purchaseCostMoney;
    const reserveCoverage = reserveTarget > 0 ? savingsAfterPurchase / reserveTarget : 1;

    const safePaymentLimitByShare = Math.max(0, v.income * v.safeHousingShare - v.monthlyHomeCosts - v.debts);
    const safePaymentLimitByCashflow = Math.max(0, v.income - v.livingCosts - v.debts - v.monthlyHomeCosts - v.income * 0.15);
    const safePaymentLimit = Math.max(0, Math.min(safePaymentLimitByShare, safePaymentLimitByCashflow));
    const maxLoanByPayment = loanFromPayment(safePaymentLimit, v.interestRate, v.years);
    const maxPriceByLtv = v.targetLtv > 0 ? maxLoanByPayment / v.targetLtv : maxLoanByPayment;
    const maxPriceBySavings = (v.savings - reserveTarget) > 0 ? (v.savings - reserveTarget) / ((1 - v.targetLtv) + v.purchaseCosts) : 0;
    const safePrice = Math.max(0, Math.min(maxPriceByLtv, maxPriceBySavings || maxPriceByLtv));

    let score = 100;
    score -= clamp((housingShare - v.safeHousingShare) * 180, 0, 35);
    score -= clamp((ltv - v.targetLtv) * 120, 0, 25);
    score -= clamp((0.15 - leftShare) * 160, 0, 25);
    score -= reserveCoverage < 1 ? clamp((1 - reserveCoverage) * 25, 0, 25) : 0;
    score = Math.round(clamp(score, 0, 100));

    let status = 'safe';
    if (score < 55 || leftAfterHousing < 0 || ltv > 0.9) status = 'risk';
    else if (score < 75 || housingShare > v.safeHousingShare || reserveCoverage < 1) status = 'border';

    const copy = {
      safe: {
        badge: 'bezpečný scénář',
        title: 'Bydlení vypadá rozumně',
        lead: 'Měsíční zatížení je v rozumném pásmu, LTV nevypadá přehnaně a po zaplacení bydlení zůstává použitelný prostor v rozpočtu.',
        nextTitle: 'Další krok: dopočítejte přesnou hypotéku',
        nextText: 'Scénář je použitelný pro další ověření. Teď dává smysl spočítat přesnou splátku, úroky a dopad vyšší sazby.',
        nextHref: '/hypotecni-kalkulacka.html',
        nextLabel: 'Otevřít hypoteční kalkulačku'
      },
      border: {
        badge: 'hraniční scénář',
        title: 'Bydlení je možné, ale napjaté',
        lead: 'Rozpočet už je citlivý na vyšší náklady, slabší příjem nebo dražší provoz bydlení. Před rozhodnutím ověřte vlastní zdroje a rezervu.',
        nextTitle: 'Další krok: ověřte vlastní zdroje a LTV',
        nextText: 'U hraničního scénáře často rozhodne akontace, vedlejší náklady a hotovost, která zůstane po koupi.',
        nextHref: '/kalkulacka-vlastnich-zdroju-na-koupi-nemovitosti.html',
        nextLabel: 'Spočítat vlastní zdroje'
      },
      risk: {
        badge: 'rizikový scénář',
        title: 'Tento scénář je pro rozpočet rizikový',
        lead: 'Po zaplacení bydlení a běžných výdajů zůstává málo prostoru, LTV nebo rezerva vychází napjatě. Zvažte levnější bydlení, vyšší úspory nebo nájemní variantu.',
        nextTitle: 'Další krok: porovnejte nájem a hypotéku',
        nextText: 'Pokud nákup vychází rizikově, porovnání s nájmem pomůže zjistit, jestli je lepší počkat a spořit dál.',
        nextHref: '/porovnani-najem-vs-hypoteka-kalkulacka.html',
        nextLabel: 'Porovnat nájem vs hypotéka'
      }
    }[status];

    setText('scoreBadge', `${score} / 100`);
    setText('resultTitle', copy.title);
    setText('resultLead', copy.lead);
    setText('safePrice', money(safePrice));
    setText('monthlyPayment', money(payment));
    setText('totalHousingCost', money(totalHousing));
    setText('housingShare', percent(housingShare * 100));
    setText('leftAfterHousing', money(leftAfterHousing));
    setText('nextStepTitle', copy.nextTitle);
    setText('nextStepText', copy.nextText);
    const nextLink = $('nextStepLink');
    if (nextLink) {
      nextLink.href = copy.nextHref;
      nextLink.textContent = copy.nextLabel;
    }

    setText('heroScore', `${score} / 100`);
    setText('heroVerdict', copy.badge);
    setText('heroHousingCost', money(totalHousing));
    setText('heroLeftover', money(leftAfterHousing));

    setWidth('housingBar', housingShare * 100);
    setWidth('costsBar', v.income ? (v.livingCosts + v.debts) / v.income * 100 : 0);
    setWidth('reserveBar', v.income ? Math.max(0, leftAfterHousing) / v.income * 100 : 0);

    document.body.dataset.affordStatus = status;
  }

  function applyPreset(name) {
    const preset = defaults[name] || defaults.couple;
    Object.entries(preset).forEach(([key, value]) => {
      const node = $(key);
      if (node) node.value = value;
    });
    document.querySelectorAll('.rv-afford-preset').forEach((button) => {
      button.classList.toggle('active', button.dataset.preset === name);
    });
    calculate();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    calculate();
  });
  form.addEventListener('input', calculate);

  document.querySelectorAll('.rv-afford-preset').forEach((button) => {
    button.addEventListener('click', () => applyPreset(button.dataset.preset));
  });

  const reset = $('resetAffordBtn');
  if (reset) reset.addEventListener('click', () => applyPreset('couple'));

  calculate();
})();
