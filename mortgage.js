/* Calculator-specific V2 logic. Shared helpers live in rv-tool-core.js. */

(() => {
  const form = document.getElementById('mortgageForm');
  if (!form) return;

  const resetBtn = document.getElementById('resetBtn');
  const presetButtons = Array.from(document.querySelectorAll('.scenario-chip'));
  const get = id => document.getElementById(id);

  const outputs = {
    errorBox: get('errorBox'),
    monthlyPayment: get('monthlyPayment'),
    monthlyWithFees: get('monthlyWithFees'),
    heroMonthly: get('heroMonthly'),
    totalPaid: get('totalPaid'),
    totalInterest: get('totalInterest'),
    neededIncomeInline: get('neededIncomeInline'),
    ownFunds: get('ownFunds'),
    ltvValue: get('ltvValue'),
    heroLtv: get('heroLtv'),
    heroRisk: get('heroRisk'),
    annualPaymentResult: get('annualPaymentResult'),
    stressPaymentResult: get('stressPaymentResult'),
    lowerLoanPaymentResult: get('lowerLoanPaymentResult'),
    incomeBurdenResult: get('incomeBurdenResult'),
    affordabilityStatus: get('affordabilityStatus'),
    affordabilityText: get('affordabilityText'),
    primaryNextCta: get('primaryNextCta'),
    actionStatus: get('actionStatus'),
    decisionHeadline: get('decisionHeadline'),
    decisionSummary: get('decisionSummary'),
    decisionMonthly: get('decisionMonthly'),
    stressIncreaseText: get('stressIncreaseText'),
    summaryInstallments: get('summaryInstallments'),
    ltvBadge: get('ltvBadge'),
    ltvMeterFill: get('ltvMeterFill'),
    incomeMeterLabel: get('incomeMeterLabel'),
    incomeMeterFill: get('incomeMeterFill'),
    nextActionText: get('nextActionText'),
    stressTestText: get('stressTestText'),
    scheduleBody: get('scheduleBody'),
    mortgageVerdictScore: get('mortgageVerdictScore'),
    mortgageDecisionSentence: get('mortgageDecisionSentence'),
    mortgageRiskList: get('mortgageRiskList'),
    mortgageScenarioTableBody: get('mortgageScenarioTableBody')
  };

  const formatCurrency = value => new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);

  const formatPercent = (value, digits = 1) => `${new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits
  }).format(Number.isFinite(value) ? value : 0)} %`;

  const getNumber = id => Number(get(id)?.value) || 0;
  const setText = (element, value) => {
    if (element) element.textContent = value;
  };

  function getValues() {
    return {
      loanAmount: getNumber('loanAmount'),
      propertyValue: getNumber('propertyValue'),
      interestRate: getNumber('interestRate'),
      years: getNumber('years'),
      monthlyFee: getNumber('monthlyFee'),
      incomeShare: getNumber('incomeShare'),
      monthlyIncome: getNumber('monthlyIncome')
    };
  }

  function validate(values) {
    if (!values.propertyValue || values.propertyValue <= 0) return 'Zadejte platnou cenu nemovitosti.';
    if (!values.loanAmount || values.loanAmount <= 0) return 'Zadejte platnou výši hypotéky.';
    if (values.interestRate < 0 || !Number.isFinite(values.interestRate)) return 'Zadejte platnou úrokovou sazbu.';
    if (!values.years || values.years <= 0 || values.years > 45) return 'Zadejte platnou dobu splácení.';
    if (values.incomeShare <= 0 || values.incomeShare > 90) return 'Zadejte rozumný podíl splátky na příjmu.';
    if (values.loanAmount > values.propertyValue * 1.5) return 'Výše hypotéky je neobvykle vysoká vůči ceně nemovitosti. Zkontrolujte zadání.';
    return '';
  }

  function calculateMortgage(values) {
    const months = values.years * 12;
    const monthlyRate = values.interestRate / 100 / 12;
    const monthlyPayment = monthlyRate === 0
      ? values.loanAmount / months
      : values.loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    const totalPaidWithoutFees = monthlyPayment * months;
    const totalInterestWithoutFees = totalPaidWithoutFees - values.loanAmount;
    const monthlyWithFees = monthlyPayment + values.monthlyFee;
    const totalFees = values.monthlyFee * months;
    const totalPaid = totalPaidWithoutFees + totalFees;
    const totalInterest = totalInterestWithoutFees + totalFees;
    const ltv = values.propertyValue > 0 ? values.loanAmount / values.propertyValue * 100 : 0;
    const neededIncome = values.incomeShare > 0 ? monthlyWithFees / (values.incomeShare / 100) : 0;
    const actualIncomeShare = values.monthlyIncome > 0 ? monthlyWithFees / values.monthlyIncome * 100 : values.incomeShare;

    return {
      months,
      monthlyPayment,
      monthlyWithFees,
      totalPaid,
      totalInterest,
      ltv,
      neededIncome,
      actualIncomeShare
    };
  }

  function buildSchedule(values, monthlyPayment, months) {
    const monthlyRate = values.interestRate / 100 / 12;
    let balance = values.loanAmount;
    const rows = [];

    for (let i = 1; i <= months; i += 1) {
      const interestPart = monthlyRate === 0 ? 0 : balance * monthlyRate;
      const principalPart = monthlyPayment - interestPart;
      balance = Math.max(0, balance - principalPart);
      rows.push({ month: i, payment: monthlyPayment, interest: interestPart, principal: principalPart, balance });
    }

    const preview = [];
    rows.slice(0, 4).forEach(row => preview.push(row));
    if (rows.length > 8) preview.push({ separator: true });
    rows.slice(-4).forEach(row => preview.push(row));
    return preview;
  }

  function renderSchedule(schedule) {
    if (!outputs.scheduleBody) return;
    outputs.scheduleBody.innerHTML = schedule.map(row => row.separator
      ? '<tr><td colspan="5">...</td></tr>'
      : `<tr><td>${row.month}.</td><td>${formatCurrency(row.payment)}</td><td>${formatCurrency(row.interest)}</td><td>${formatCurrency(row.principal)}</td><td>${formatCurrency(row.balance)}</td></tr>`
    ).join('');
  }

  function getAffordability(result, values) {
    const stressOne = calculateMortgage({ ...values, interestRate: values.interestRate + 1 });
    const stressTwo = calculateMortgage({ ...values, interestRate: values.interestRate + 2 });
    const share = result.actualIncomeShare;

    let data = {
      className: 'warning',
      label: 'Na hraně rozpočtu',
      headline: 'Scénář je použitelný, ale hlídejte rezervu',
      text: 'Splátka může být zvládnutelná, ale je dobré počítat i s provozem bydlení, rezervou a možným růstem sazby.',
      summary: 'Porovnejte nižší úvěr, vyšší vlastní zdroje nebo delší splatnost. Největší riziko bývá kombinace vysokého LTV a napjatého příjmu.',
      next: 'Pokud výsledek vychází těsně, zkuste snížit úvěr, prodloužit splatnost nebo navýšit vlastní zdroje.',
      cta: 'kalkulacka-vlastnich-zdroju-na-koupi-nemovitosti.html',
      ctaText: 'Spočítat vlastní zdroje',
      heroRisk: 'na hraně'
    };

    if (result.ltv <= 80 && share <= 35 && stressTwo.actualIncomeShare <= 42) {
      data = {
        className: 'success',
        label: 'Rozumnější scénář',
        headline: 'Scénář působí relativně zdravě',
        text: 'Při těchto hodnotách vychází splátka, LTV i zátěž příjmu rozumněji. Výsledek pořád berte jako orientační a ověřte ho s reálnou nabídkou banky.',
        summary: 'Teď dává smysl porovnat nájem vs hypotéku, ověřit celkové náklady koupě a zkontrolovat více sazeb.',
        next: 'Jste v lepší výchozí pozici. Další krok je porovnat varianty bydlení a celkové náklady.',
        cta: 'porovnani-najem-vs-hypoteka-kalkulacka.html',
        ctaText: 'Porovnat nájem vs hypotéka',
        heroRisk: 'rozumnější scénář'
      };
    } else if (result.ltv > 90 || share > 45 || stressTwo.actualIncomeShare > 52) {
      data = {
        className: 'risk',
        label: 'Rizikovější scénář',
        headline: 'Scénář je citlivý na příjem i sazbu',
        text: 'Vyšší LTV nebo vysoký podíl splátky na příjmu znamená větší tlak na rozpočet. Doporučujeme přepočítat konzervativnější variantu.',
        summary: 'Největší páka je nižší úvěr, vyšší vlastní zdroje, levnější nemovitost nebo delší splatnost. U takového scénáře je rezerva zásadní.',
        next: 'Začněte snížením LTV nebo ověřením čistého příjmu domácnosti. Bez rezervy je podobný scénář zbytečně křehký.',
        cta: 'cista-mzda-kalkulacka.html',
        ctaText: 'Ověřit čistý příjem',
        heroRisk: 'rizikovější scénář'
      };
    }

    data.stress = stressOne;
    data.stressTwo = stressTwo;
    return data;
  }

  const classForLtv = ltv => (ltv <= 80 ? 'success' : ltv <= 90 ? 'warning' : 'risk');
  const classForIncomeShare = share => (share <= 35 ? 'success' : share <= 45 ? 'warning' : 'risk');

  function renderPremiumDecision(values, result, affordability) {
    setText(outputs.mortgageVerdictScore, affordability.label);
    setText(
      outputs.mortgageDecisionSentence,
      `Měsíční splátka včetně poplatků vychází přibližně na ${formatCurrency(result.monthlyWithFees)}. LTV je ${formatPercent(result.ltv)} a při zadaném příjmu tvoří splátka ${formatPercent(result.actualIncomeShare)} čistého příjmu domácnosti.`
    );

    if (outputs.mortgageRiskList) {
      const stressIncrease = affordability.stressTwo.monthlyWithFees - result.monthlyWithFees;
      const ownFunds = Math.max(0, values.propertyValue - values.loanAmount);
      outputs.mortgageRiskList.innerHTML = [
        `Vedle hypotéky potřebujete vlastní zdroje alespoň ${formatCurrency(ownFunds)} plus rezervu na vedlejší náklady a první měsíce bydlení.`,
        `Při sazbě vyšší o 2 procentní body by splátka vzrostla asi o ${formatCurrency(stressIncrease)} měsíčně.`,
        result.actualIncomeShare > 45
          ? 'Splátka už bere vysokou část příjmu. Zkuste nižší úvěr, delší splatnost nebo levnější nemovitost.'
          : 'Podíl splátky na příjmu nevypadá extrémně, ale ověřte i běžné výdaje, další závazky a rezervu.'
      ].map(item => `<li>${item}</li>`).join('');
    }

    if (outputs.mortgageScenarioTableBody) {
      const lowerLoan = calculateMortgage({ ...values, loanAmount: values.loanAmount * 0.9 });
      const shorterYears = Math.max(1, values.years - 5);
      const shorter = calculateMortgage({ ...values, years: shorterYears });
      outputs.mortgageScenarioTableBody.innerHTML = [
        ['Základní výpočet', formatCurrency(result.monthlyWithFees), 'Výchozí splátka a podíl na příjmu'],
        ['Sazba +1 p. b.', formatCurrency(affordability.stress.monthlyWithFees), 'Citlivost na konec fixace nebo horší nabídku'],
        ['Sazba +2 p. b.', formatCurrency(affordability.stressTwo.monthlyWithFees), 'Tvrdší stress test pro rezervu domácnosti'],
        ['Nižší úvěr o 10 %', formatCurrency(lowerLoan.monthlyWithFees), 'Kolik pomůže vyšší akontace nebo levnější nemovitost'],
        [`Splatnost ${shorterYears} let`, formatCurrency(shorter.monthlyWithFees), 'Vyšší splátka, ale nižší celkové úroky']
      ].map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('');
    }
  }

  function render(values, result) {
    if (outputs.errorBox) outputs.errorBox.classList.remove('is-visible');

    const affordability = getAffordability(result, values);
    const ownFunds = Math.max(0, values.propertyValue - values.loanAmount);
    const ltvRounded = Number(result.ltv.toFixed(1));
    const ltvClass = classForLtv(ltvRounded);
    const incomeClass = classForIncomeShare(result.actualIncomeShare);
    const lowerLoan = calculateMortgage({ ...values, loanAmount: values.loanAmount * 0.9 });

    setText(outputs.monthlyPayment, formatCurrency(result.monthlyPayment));
    setText(outputs.monthlyWithFees, formatCurrency(result.monthlyWithFees));
    setText(outputs.heroMonthly, formatCurrency(result.monthlyWithFees));
    setText(outputs.decisionMonthly, formatCurrency(result.monthlyWithFees));
    setText(outputs.totalPaid, formatCurrency(result.totalPaid));
    setText(outputs.totalInterest, formatCurrency(result.totalInterest));
    setText(outputs.neededIncomeInline, formatCurrency(result.neededIncome));
    setText(outputs.ownFunds, formatCurrency(ownFunds));
    setText(outputs.ltvValue, formatPercent(ltvRounded));
    setText(outputs.heroLtv, formatPercent(ltvRounded, 0));
    setText(outputs.annualPaymentResult, formatCurrency(result.monthlyWithFees * 12));
    setText(outputs.stressPaymentResult, formatCurrency(affordability.stressTwo.monthlyWithFees));
    setText(outputs.lowerLoanPaymentResult, formatCurrency(lowerLoan.monthlyWithFees));
    setText(outputs.incomeBurdenResult, formatPercent(result.actualIncomeShare));
    setText(outputs.summaryInstallments, String(result.months));
    setText(outputs.affordabilityStatus, affordability.label);
    setText(outputs.affordabilityText, affordability.text);
    setText(outputs.actionStatus, affordability.label);
    setText(outputs.decisionHeadline, affordability.headline);
    setText(outputs.decisionSummary, affordability.summary);
    setText(outputs.nextActionText, affordability.next);
    setText(outputs.heroRisk, affordability.heroRisk);

    if (outputs.primaryNextCta) {
      outputs.primaryNextCta.href = affordability.cta;
      outputs.primaryNextCta.textContent = affordability.ctaText;
    }

    if (outputs.affordabilityStatus) outputs.affordabilityStatus.className = `decision-status ${affordability.className}`;
    if (outputs.actionStatus) outputs.actionStatus.className = `decision-status ${affordability.className}`;
    if (outputs.ltvBadge) {
      outputs.ltvBadge.textContent = `LTV: ${formatPercent(ltvRounded)}`;
      outputs.ltvBadge.className = `badge ${ltvClass}`;
    }
    if (outputs.ltvMeterFill) {
      outputs.ltvMeterFill.style.width = `${Math.min(100, Math.max(0, ltvRounded))}%`;
      outputs.ltvMeterFill.className = ltvClass;
    }
    if (outputs.incomeMeterFill) {
      outputs.incomeMeterFill.style.width = `${Math.min(100, Math.max(0, result.actualIncomeShare))}%`;
      outputs.incomeMeterFill.className = incomeClass;
    }
    if (outputs.incomeMeterLabel) {
      outputs.incomeMeterLabel.textContent = `${formatPercent(result.actualIncomeShare, 0)} příjmu`;
      outputs.incomeMeterLabel.className = `badge ${incomeClass}`;
    }

    const stressIncrease = affordability.stressTwo.monthlyWithFees - result.monthlyWithFees;
    setText(outputs.stressIncreaseText, `${stressIncrease >= 0 ? '+' : ''}${formatCurrency(stressIncrease)}`);
    setText(outputs.stressTestText, `Při sazbě vyšší o 2 procentní body by měsíční zatížení vyšlo přibližně na ${formatCurrency(affordability.stressTwo.monthlyWithFees)}.`);

    renderSchedule(buildSchedule(values, result.monthlyPayment, result.months));
    renderPremiumDecision(values, result, affordability);
  }

  function runCalculation() {
    const values = getValues();
    const error = validate(values);

    if (error) {
      if (outputs.errorBox) {
        outputs.errorBox.textContent = error;
        outputs.errorBox.classList.add('is-visible');
      }
      return;
    }

    const result = calculateMortgage(values);
    render(values, result);

  }

  function setPreset(name) {
    const presets = {
      standard: { loanAmount: 4000000, propertyValue: 5000000, interestRate: 4.89, years: 30, monthlyFee: 0, incomeShare: 40, monthlyIncome: 70000 },
      conservative: { loanAmount: 3500000, propertyValue: 5000000, interestRate: 4.89, years: 30, monthlyFee: 0, incomeShare: 35, monthlyIncome: 85000 },
      'higher-loan': { loanAmount: 4500000, propertyValue: 5000000, interestRate: 4.89, years: 30, monthlyFee: 0, incomeShare: 40, monthlyIncome: 70000 },
      shorter: { loanAmount: 4000000, propertyValue: 5000000, interestRate: 4.89, years: 25, monthlyFee: 0, incomeShare: 40, monthlyIncome: 70000 }
    };
    const preset = presets[name];
    if (!preset) return;

    Object.entries(preset).forEach(([key, value]) => {
      const input = get(key);
      if (input) input.value = value;
    });

    presetButtons.forEach(button => button.classList.toggle('active', button.dataset.preset === name));
    runCalculation();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    runCalculation();
  });
  form.addEventListener('input', () => runCalculation());
  resetBtn?.addEventListener('click', () => setPreset('standard'));
  presetButtons.forEach(button => button.addEventListener('click', () => setPreset(button.dataset.preset)));
  runCalculation();
})();
