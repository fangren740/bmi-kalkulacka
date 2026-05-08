(function(){
  const $ = id => document.getElementById(id);
  const form = $('rentVsMortgageForm');
  if (!form) return;

  const outputs = {
    rentPremiumVerdict: $('rentPremiumVerdict'),
    rentPremiumSubline: $('rentPremiumSubline'),
    rentPremiumSentence: $('rentPremiumSentence'),
    rentPremiumChecklist: $('rentPremiumChecklist'),
    rentScenarioTableBody: $('rentScenarioTableBody')
  };

  const fmt = (value, digits = 0) => new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
  const czk = value => `${fmt(value)} Kč`;

  function num(id){
    return Number($(id).value) || 0;
  }

  function values(){
    return {
      monthlyRent: num('monthlyRent'),
      rentRelatedCosts: num('rentRelatedCosts'),
      rentIncrease: num('rentIncrease'),
      rentDeposit: num('rentDeposit'),
      propertyPrice: num('propertyPrice'),
      downPayment: num('downPayment'),
      interestRate: num('interestRate'),
      mortgageYears: num('mortgageYears'),
      ownerCosts: num('ownerCosts'),
      purchaseCosts: num('purchaseCosts'),
      comparisonYears: num('comparisonYears'),
      incomeShare: num('incomeShare')
    };
  }

  function mortgage(loan, rate, years){
    const months = years * 12;
    const monthlyRate = rate / 100 / 12;
    const monthlyPayment = monthlyRate === 0
      ? loan / months
      : loan * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
    return {
      monthlyPayment,
      monthlyRate,
      totalPaid: monthlyPayment * months,
      totalInterest: monthlyPayment * months - loan
    };
  }

  function balance(loan, rate, years, paidMonths){
    const m = mortgage(loan, rate, years);
    const monthlyRate = m.monthlyRate;
    if (monthlyRate === 0) return Math.max(0, loan - m.monthlyPayment * paidMonths);
    return Math.max(0, loan * Math.pow(1 + monthlyRate, paidMonths) - m.monthlyPayment * ((Math.pow(1 + monthlyRate, paidMonths) - 1) / monthlyRate));
  }

  function rentScenario(v){
    let total = 0;
    let currentRent = v.monthlyRent;
    for (let year = 1; year <= v.comparisonYears; year += 1) {
      total += (currentRent + v.rentRelatedCosts) * 12;
      currentRent *= 1 + v.rentIncrease / 100;
    }
    return {
      monthlyBase: v.monthlyRent + v.rentRelatedCosts,
      totalCost: total,
      entryCash: v.rentDeposit
    };
  }

  function mortgageScenario(v){
    const loan = v.propertyPrice - v.downPayment;
    const m = mortgage(loan, v.interestRate, v.mortgageYears);
    const monthlyTotal = m.monthlyPayment + v.ownerCosts;
    const horizonMonths = v.comparisonYears * 12;
    const remaining = balance(loan, v.interestRate, v.mortgageYears, horizonMonths);
    const principalPaid = loan - remaining;
    const entryCash = v.downPayment + v.purchaseCosts;
    const effectiveCostOverHorizon = entryCash + (monthlyTotal * horizonMonths) - principalPaid;
    const neededIncome = monthlyTotal / (v.incomeShare / 100);

    return {
      loan,
      monthlyPayment: m.monthlyPayment,
      monthlyTotal,
      entryCash,
      principalPaid,
      effectiveCostOverHorizon,
      neededIncome,
      totalInterest: m.totalInterest
    };
  }

  function getComparison(v){
    const rent = rentScenario(v);
    const mortgageData = mortgageScenario(v);
    const monthlyDifference = Math.abs(rent.monthlyBase - mortgageData.monthlyTotal);
    const longTermDifference = Math.abs(rent.totalCost - mortgageData.effectiveCostOverHorizon);
    const monthlyWinner = rent.monthlyBase < mortgageData.monthlyTotal ? 'Nájem' : rent.monthlyBase > mortgageData.monthlyTotal ? 'Hypotéka' : 'Remíza';
    const longTermWinner = rent.totalCost < mortgageData.effectiveCostOverHorizon ? 'Nájem' : rent.totalCost > mortgageData.effectiveCostOverHorizon ? 'Hypotéka' : 'Remíza';

    return { rent, mortgageData, monthlyDifference, longTermDifference, monthlyWinner, longTermWinner };
  }

  function decision(monthlyWinner, longTermWinner, monthlyDifference, longTermDifference){
    if (monthlyWinner === 'Hypotéka' && longTermWinner === 'Hypotéka') {
      return ['Hypotéka vychází silně', 'Hypotéka je podle zadání výhodnější měsíčně i ve zvoleném horizontu.', 'Přesto si ověřte rezervu po koupi, budoucí sazbu a celkové náklady vlastnictví.'];
    }
    if (monthlyWinner === 'Nájem' && longTermWinner === 'Nájem') {
      return ['Nájem vychází opatrněji', 'Nájem je podle zadání levnější měsíčně i v horizontu porovnání.', 'Zkontrolujte, jestli problém není v ceně nemovitosti, akontaci nebo úrokové sazbě.'];
    }
    if (monthlyDifference < 1000 && longTermDifference < 100000) {
      return ['Výsledek je těsný', 'Finanční rozdíl je malý. Rozhodovat může flexibilita, rezerva a délka plánovaného bydlení.', 'Dopočítejte si konkrétní hypoteční nabídku a měsíční náklady na bydlení.'];
    }
    return ['Rozhodnutí záleží na prioritě', 'Jedna varianta vychází lépe měsíčně a druhá v delším horizontu.', 'Sledujte hlavně cashflow, vstupní hotovost a jistotu, jak dlouho chcete v místě bydlet.'];
  }

  function renderTable(rent, mortgageData){
    $('comparisonBody').innerHTML = `
      <tr><td>Měsíční platba</td><td>${czk(rent.monthlyBase)}</td><td>${czk(mortgageData.monthlyTotal)}</td></tr>
      <tr><td>Vstupní hotovost</td><td>${czk(rent.entryCash)}</td><td>${czk(mortgageData.entryCash)}</td></tr>
      <tr><td>Náklad za horizont</td><td>${czk(rent.totalCost)}</td><td>${czk(mortgageData.effectiveCostOverHorizon)}</td></tr>
      <tr><td>Splacená jistina</td><td>-</td><td>${czk(mortgageData.principalPaid)}</td></tr>
    `;
  }

  function renderPremium(v, comparison, badge){
    if (!outputs.rentPremiumVerdict) return;

    const { rent, mortgageData, monthlyDifference, longTermDifference, monthlyWinner, longTermWinner } = comparison;
    const entryCashDifference = Math.abs(mortgageData.entryCash - rent.entryCash);
    const monthlyGapText = `${monthlyWinner} vychází měsíčně lépe o ${czk(monthlyDifference)}.`;

    outputs.rentPremiumVerdict.textContent = badge;
    outputs.rentPremiumSubline.textContent = `${monthlyWinner} měsíčně, ${longTermWinner} v horizontu ${v.comparisonYears} let`;
    outputs.rentPremiumSentence.textContent = `${monthlyGapText} V horizontu ${v.comparisonYears} let je orientační rozdíl ${czk(longTermDifference)} a koupě vyžaduje o ${czk(entryCashDifference)} více vstupní hotovosti než nájem.`;

    const reserveWarning = mortgageData.entryCash > v.downPayment
      ? 'Po akontaci počítejte ještě s vedlejšími náklady koupě a rezervou na stěhování, vybavení a opravy.'
      : 'Vstupní hotovost nevypadá vysoká, přesto ověřte rezervu po nastěhování.';
    const incomeWarning = `Pro zadaný bezpečný podíl bydlení vychází potřebný čistý příjem přibližně ${czk(mortgageData.neededIncome)}.`;
    const horizonWarning = v.comparisonYears <= 5
      ? 'Krátký horizont zvýrazňuje riziko vstupních nákladů a flexibility.'
      : 'Delší horizont dává větší prostor splácení jistiny, ale neřeší budoucí sazbu ani cenu nemovitosti.';

    outputs.rentPremiumChecklist.innerHTML = [reserveWarning, incomeWarning, horizonWarning].map(item => `<li>${item}</li>`).join('');

    const rateScenario = getComparison({ ...v, interestRate: v.interestRate + 1 });
    const rentGrowthScenario = getComparison({ ...v, rentIncrease: v.rentIncrease + 2 });
    const lowerCashScenario = getComparison({ ...v, downPayment: Math.max(0, v.downPayment - 200000) });

    outputs.rentScenarioTableBody.innerHTML = [
      ['Základní scénář', `${monthlyWinner} o ${czk(monthlyDifference)}`, 'Aktuální měsíční tlak na rozpočet'],
      ['Sazba hypotéky +1 p. b.', `${rateScenario.monthlyWinner} o ${czk(rateScenario.monthlyDifference)}`, 'Citlivost koupě na dražší financování'],
      ['Růst nájmu +2 p. b.', `${rentGrowthScenario.longTermWinner} v horizontu`, 'Citlivost nájmu na rychlejší zdražování'],
      ['Akontace o 200 000 Kč nižší', `${lowerCashScenario.monthlyWinner} o ${czk(lowerCashScenario.monthlyDifference)}`, 'Dopad menších vlastních zdrojů']
    ].map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('');
  }

  function render(){
    const v = values();
    if (v.propertyPrice <= 0 || v.downPayment < 0 || v.downPayment >= v.propertyPrice) return;

    const comparison = getComparison(v);
    const { rent, mortgageData, monthlyDifference, longTermDifference, monthlyWinner, longTermWinner } = comparison;
    const [badge, text, next] = decision(monthlyWinner, longTermWinner, monthlyDifference, longTermDifference);

    $('monthlyWinner').textContent = monthlyWinner;
    $('monthlyDifference').textContent = czk(monthlyDifference);
    $('longTermWinner').textContent = longTermWinner;
    $('longTermDifference').textContent = czk(longTermDifference);
    $('comparisonBadge').textContent = badge;
    $('monthlyDecisionStatus').textContent = badge;
    $('realityCheckText').textContent = text;
    $('decisionSummary').textContent = next;
    $('rentMonthlyTotal').textContent = czk(rent.monthlyBase);
    $('mortgageMonthlyTotal').textContent = czk(mortgageData.monthlyTotal);
    $('mortgageEntryCash').textContent = czk(mortgageData.entryCash);
    $('entryCashDifference').textContent = czk(Math.abs(mortgageData.entryCash - rent.entryCash));
    $('principalPaid').textContent = czk(mortgageData.principalPaid);
    $('neededIncome').textContent = czk(mortgageData.neededIncome);

    renderTable(rent, mortgageData);
    renderPremium(v, comparison, badge);
  }

  function setPreset(name){
    const presets = {
      standard: { monthlyRent: 22000, rentRelatedCosts: 1500, rentIncrease: 3, rentDeposit: 44000, propertyPrice: 6200000, downPayment: 1240000, interestRate: 4.89, mortgageYears: 30, ownerCosts: 4500, purchaseCosts: 150000, comparisonYears: 5, incomeShare: 35 },
      city: { monthlyRent: 30000, rentRelatedCosts: 1800, rentIncrease: 4, rentDeposit: 60000, propertyPrice: 8500000, downPayment: 1700000, interestRate: 4.89, mortgageYears: 30, ownerCosts: 6000, purchaseCosts: 180000, comparisonYears: 5, incomeShare: 35 },
      lower: { monthlyRent: 16000, rentRelatedCosts: 1200, rentIncrease: 3, rentDeposit: 32000, propertyPrice: 4200000, downPayment: 840000, interestRate: 4.89, mortgageYears: 30, ownerCosts: 3500, purchaseCosts: 120000, comparisonYears: 5, incomeShare: 35 }
    };
    const preset = presets[name];
    if (!preset) return;
    Object.entries(preset).forEach(([id, value]) => {
      $(id).value = value;
    });
    document.querySelectorAll('[data-preset]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.preset === name));
    });
    render();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    render();
  });

  ['monthlyRent', 'rentRelatedCosts', 'rentIncrease', 'rentDeposit', 'propertyPrice', 'downPayment', 'interestRate', 'mortgageYears', 'ownerCosts', 'purchaseCosts', 'comparisonYears', 'incomeShare'].forEach(id => {
    const element = $(id);
    element.addEventListener('input', render);
    element.addEventListener('change', render);
  });

  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => setPreset(button.dataset.preset)));
  $('resetBtn').addEventListener('click', () => setPreset('standard'));
  render();
})();
