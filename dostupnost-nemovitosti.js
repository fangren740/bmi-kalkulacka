(function(){
  const $ = id => document.getElementById(id);
  const form = $('affordabilityForm');
  if (!form) return;

  const premium = {
    verdict: $('affPremiumVerdict'),
    subline: $('affPremiumSubline'),
    sentence: $('affPremiumSentence'),
    checklist: $('affPremiumChecklist'),
    table: $('affScenarioTableBody')
  };

  const fmt = (value, digits = 0) => new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0);
  const czk = value => `${fmt(value)} Kč`;
  const compact = value => {
    const n = Number.isFinite(value) ? value : 0;
    if (Math.abs(n) >= 1000000) return `${fmt(n / 1000000, 1)} mil. Kč`;
    if (Math.abs(n) >= 1000) return `${fmt(n / 1000, 0)} tis. Kč`;
    return czk(n);
  };

  function num(id){
    return Number($(id).value) || 0;
  }

  function values(){
    return {
      netIncome: num('netIncome'),
      savings: num('savings'),
      interestRate: num('interestRate'),
      years: num('years'),
      ltv: num('ltv'),
      incomeShare: num('incomeShare'),
      otherDebts: num('otherDebts')
    };
  }

  function loanCapacity(payment, rate, years){
    const months = years * 12;
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return payment * months;
    return payment * (1 - Math.pow(1 + monthlyRate, -months)) / monthlyRate;
  }

  function monthlyPayment(loan, rate, years){
    const months = years * 12;
    const monthlyRate = rate / 100 / 12;
    if (monthlyRate === 0) return loan / months;
    return loan * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
  }

  function calc(v){
    const maxHousingBudget = Math.max(0, (v.netIncome * (v.incomeShare / 100)) - v.otherDebts);
    const maxLoanByPayment = loanCapacity(maxHousingBudget, v.interestRate, v.years);
    const ltvRatio = v.ltv / 100;
    const maxPropertyByPayment = maxLoanByPayment / ltvRatio;
    const maxPropertyBySavings = v.savings / (1 - ltvRatio);
    const recommendedPropertyPrice = Math.min(maxPropertyByPayment, maxPropertyBySavings);
    const recommendedLoan = recommendedPropertyPrice * ltvRatio;
    const requiredSavings = recommendedPropertyPrice - recommendedLoan;
    const estimatedPayment = monthlyPayment(recommendedLoan, v.interestRate, v.years);
    const limitingFactor = maxPropertyByPayment < maxPropertyBySavings ? 'příjem' : 'vlastní zdroje';

    return { maxHousingBudget, maxPropertyByPayment, maxPropertyBySavings, recommendedPropertyPrice, recommendedLoan, requiredSavings, estimatedPayment, limitingFactor };
  }

  function status(v, result){
    const ratio = v.netIncome > 0 ? result.estimatedPayment / v.netIncome * 100 : 0;
    const coverage = v.savings > 0 ? result.requiredSavings / v.savings : 999;
    if (result.recommendedPropertyPrice <= 0) {
      return ['Scénář nevychází', 'Příjem nebo vlastní zdroje nestačí na smysluplný výpočet.', 'Zkuste snížit jiné splátky, navýšit úspory nebo zvolit nižší cenu nemovitosti.'];
    }
    if (ratio <= 35 && v.ltv <= 85 && coverage <= .9) {
      return ['Scénář působí zdravě', 'Cena nemovitosti odpovídá zadanému příjmu a vlastním zdrojům.', 'Další krok je dopočítat konkrétní splátku hypotéky a celkové náklady bydlení.'];
    }
    if (ratio <= 40) {
      return ['Scénář je na hraně', 'Výsledek může vyjít, ale je potřeba hlídat rezervu po koupi a budoucí změnu sazby.', 'Zvažte opatrnější podíl splátky na příjmu nebo vyšší vlastní zdroje.'];
    }
    return ['Scénář je napjatý', 'Splátka už tvoří vysoký podíl příjmu a koupě může být citlivá na nečekané výdaje.', 'Vyplatí se hledat levnější nemovitost nebo počkat na vyšší rezervu.'];
  }

  function renderTable(v){
    const budget = Math.max(0, (v.netIncome * (v.incomeShare / 100)) - v.otherDebts);
    $('scenarioTableBody').innerHTML = [80, 85, 90].map(ltv => {
      const ratio = ltv / 100;
      const maxLoan = loanCapacity(budget, v.interestRate, v.years);
      const byPayment = maxLoan / ratio;
      const bySavings = v.savings / (1 - ratio);
      const price = Math.min(byPayment, bySavings);
      const loan = price * ratio;
      const own = price - loan;
      return `<tr><td>${ltv} %</td><td>${czk(price)}</td><td>${czk(loan)}</td><td>${czk(own)}</td><td>${czk(monthlyPayment(loan, v.interestRate, v.years))}</td></tr>`;
    }).join('');
  }

  function renderPremium(v, result, label){
    if (!premium.verdict) return;

    const ratio = v.netIncome > 0 ? result.estimatedPayment / v.netIncome * 100 : 0;
    premium.verdict.textContent = label;
    premium.subline.textContent = `Limituje vás hlavně: ${result.limitingFactor}`;
    premium.sentence.textContent = `Orientační dostupná cena vychází na ${czk(result.recommendedPropertyPrice)}. Splátka je přibližně ${czk(result.estimatedPayment)} měsíčně, což odpovídá ${fmt(ratio, 1)} % čistého příjmu domácnosti.`;

    premium.checklist.innerHTML = [
      result.limitingFactor === 'vlastní zdroje'
        ? 'Největší brzda jsou vlastní zdroje. Zkuste nižší cenu, delší spoření nebo ověřte, zda je vyšší LTV realistické.'
        : 'Největší brzda je měsíční kapacita splátky. Opatrně pracujte s delší splatností a jinými závazky.',
      v.ltv > 85 ? 'LTV je vyšší. Počítejte s citlivějším schvalováním a potřebou větší rezervy.' : 'LTV je v rozumnějším pásmu, ale pořád ověřte odhad nemovitosti a vedlejší náklady.',
      'Před prohlídkami si dopočítejte vlastní zdroje, celkové náklady bydlení a scénář sazby vyšší o 1 procentní bod.'
    ].map(item => `<li>${item}</li>`).join('');

    const scenarios = [
      ['Základní scénář', result.recommendedPropertyPrice, 'Současné zadání'],
      ['Sazba +1 p. b.', calc({ ...v, interestRate: v.interestRate + 1 }).recommendedPropertyPrice, 'Citlivost na dražší financování'],
      ['Podíl splátky -5 p. b.', calc({ ...v, incomeShare: Math.max(20, v.incomeShare - 5) }).recommendedPropertyPrice, 'Konzervativnější rozpočet'],
      ['Úspory +200 000 Kč', calc({ ...v, savings: v.savings + 200000 }).recommendedPropertyPrice, 'Dopad vyšší akontace']
    ];

    premium.table.innerHTML = scenarios.map(row => `<tr><td>${row[0]}</td><td>${czk(row[1])}</td><td>${row[2]}</td></tr>`).join('');
  }

  function render(){
    const v = values();
    if (v.netIncome <= 0 || v.years <= 0 || v.ltv <= 0 || v.ltv >= 100) return;
    const result = calc(v);
    const ratio = v.netIncome > 0 ? result.estimatedPayment / v.netIncome * 100 : 0;
    const [label, text, next] = status(v, result);

    $('maxPropertyPrice').textContent = czk(result.recommendedPropertyPrice);
    $('maxLoan').textContent = czk(result.recommendedLoan);
    $('requiredSavings').textContent = czk(result.requiredSavings);
    $('estimatedPayment').textContent = czk(result.estimatedPayment);
    $('incomeRatio').textContent = `${fmt(ratio, 1)} %`;
    $('scenarioBadge').textContent = label;
    $('affordabilityStatus').textContent = label;
    $('finalVerdict').textContent = text;
    $('decisionSummary').textContent = next;
    $('summaryIncome').textContent = czk(v.netIncome);
    $('availablePayment').textContent = czk(result.maxHousingBudget);
    $('summaryLtv').textContent = `${fmt(v.ltv)} %`;
    $('summaryDebts').textContent = czk(v.otherDebts);
    $('summaryYears').textContent = `${fmt(v.years)} let`;
    $('heroMainPrice').textContent = compact(result.recommendedPropertyPrice);
    $('heroPropertyPrice').textContent = compact(result.recommendedPropertyPrice);
    $('heroLtvLabel').textContent = `LTV ${fmt(v.ltv)} %`;
    $('heroPayment').textContent = czk(result.estimatedPayment);
    $('heroSavings').textContent = czk(v.savings);
    $('heroIncome').textContent = czk(v.netIncome);
    $('heroMortgageShare').textContent = `${fmt(v.ltv)} %`;
    $('heroOwnShare').textContent = `${fmt(100 - v.ltv)} %`;
    $('heroMortgageMeter').style.width = `${Math.min(100, v.ltv)}%`;
    $('heroOwnMeter').style.width = `${Math.min(100, 100 - v.ltv)}%`;
    $('heroLoanBar').style.width = `${Math.min(100, v.ltv)}%`;
    $('heroOwnBar').style.width = `${Math.min(100, 100 - v.ltv)}%`;
    $('heroPaymentBar').style.width = `${Math.max(8, Math.min(100, ratio * 2.2))}%`;

    renderTable(v);
    renderPremium(v, result, label);
  }

  function setPreset(name){
    const presets = {
      standard: { netIncome: 65000, savings: 1000000, interestRate: 4.89, years: 30, ltv: 85, incomeShare: 40, otherDebts: 0 },
      safe: { netIncome: 65000, savings: 1300000, interestRate: 4.89, years: 30, ltv: 80, incomeShare: 35, otherDebts: 0 },
      stretch: { netIncome: 65000, savings: 750000, interestRate: 4.89, years: 30, ltv: 90, incomeShare: 45, otherDebts: 0 }
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

  ['netIncome', 'savings', 'interestRate', 'years', 'ltv', 'incomeShare', 'otherDebts'].forEach(id => {
    const element = $(id);
    element.addEventListener('input', render);
    element.addEventListener('change', render);
  });

  document.querySelectorAll('[data-preset]').forEach(button => button.addEventListener('click', () => setPreset(button.dataset.preset)));
  $('resetBtn').addEventListener('click', () => setPreset('standard'));
  render();
})();
