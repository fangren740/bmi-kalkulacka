(function () {
  const form = document.getElementById('employerCostForm');
  if (!form) return;

  const $ = id => document.getElementById(id);
  const grossInput = $('grossSalary');
  const roundMode = $('roundMode');
  const comparisonMode = $('comparisonMode');
  const resetBtn = $('resetBtn');
  const presetButtons = Array.from(document.querySelectorAll('.scenario-chip'));

  const outputs = {
    monthlyTotalCost: $('monthlyTotalCost'),
    yearlyTotalCost: $('yearlyTotalCost'),
    employerSocial: $('employerSocial'),
    employerHealth: $('employerHealth'),
    summaryGross: $('summaryGross'),
    summaryDifference: $('summaryDifference'),
    summaryContributionShare: $('summaryContributionShare'),
    costPer10k: $('costPer10k'),
    resultLead: $('resultLead'),
    nextStep: $('nextStep'),
    decisionTitle: $('decisionTitle'),
    decisionText: $('decisionText'),
    breakdownList: $('breakdownList'),
    comparisonGrid: $('comparisonGrid'),
    comparisonEmployee: $('comparisonEmployee'),
    comparisonOsvc: $('comparisonOsvc'),
    comparisonText: $('comparisonText'),
    heroTotalCost: $('heroTotalCost'),
    heroGross: $('heroGross'),
    heroSocial: $('heroSocial'),
    heroHealth: $('heroHealth'),
    heroYearly: $('heroYearly'),
    heroGrossBar: $('heroGrossBar'),
    heroContributionBar: $('heroContributionBar'),
    premiumVerdict: $('employerPremiumVerdict'),
    premiumSubline: $('employerPremiumSubline'),
    premiumSentence: $('employerPremiumSentence'),
    premiumChecklist: $('employerPremiumChecklist'),
    premiumTable: $('employerScenarioTableBody')
  };

  function formatCurrency(value, whole = true) {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2
    }).format(Number.isFinite(value) ? value : 0);
  }

  function formatNumber(value, digits = 1) {
    return new Intl.NumberFormat('cs-CZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits
    }).format(Number.isFinite(value) ? value : 0);
  }

  function compactCurrency(value) {
    const safeValue = Number.isFinite(value) ? value : 0;
    const abs = Math.abs(safeValue);
    if (abs >= 1000000) return `${formatNumber(safeValue / 1000000, 2)} mil. Kč`;
    if (abs >= 100000) return `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(safeValue / 1000)} tis. Kč`;
    return formatCurrency(safeValue);
  }

  function getValues() {
    return {
      grossSalary: Number(grossInput.value) || 0,
      roundWhole: roundMode.value === 'whole',
      compareOSVC: comparisonMode.value === 'osvc'
    };
  }

  function validate(values) {
    if (values.grossSalary <= 0) return 'Zadejte platnou hrubou měsíční mzdu.';
    if (values.grossSalary > 10000000) return 'Zadaná mzda je neobvykle vysoká. Zkontrolujte prosím hodnotu.';
    return '';
  }

  function calculateForGross(grossSalary) {
    const socialRate = 0.248;
    const healthRate = 0.09;
    const employerSocial = grossSalary * socialRate;
    const employerHealth = grossSalary * healthRate;
    const monthlyTotalCost = grossSalary + employerSocial + employerHealth;
    const yearlyTotalCost = monthlyTotalCost * 12;
    const difference = monthlyTotalCost - grossSalary;
    const contributionShare = monthlyTotalCost > 0 ? difference / monthlyTotalCost * 100 : 0;
    const ratioToGross = grossSalary > 0 ? monthlyTotalCost / grossSalary : 0;
    const costPer10k = 10000 * ratioToGross;

    return {
      employerSocial,
      employerHealth,
      monthlyTotalCost,
      yearlyTotalCost,
      difference,
      contributionShare,
      ratioToGross,
      costPer10k
    };
  }

  function calculate(values) {
    const result = calculateForGross(values.grossSalary);
    return {
      ...result,
      osvcEstimate: values.compareOSVC ? values.grossSalary * 1.15 : 0
    };
  }

  function decisionContent(result) {
    if (result.monthlyTotalCost <= 45000) {
      return {
        badge: 'Nižší cena práce',
        title: 'Nižší mzdová hladina, ale odvody pořád rozhodují.',
        text: 'I u nižších mezd je rozdíl mezi hrubou mzdou a cenou práce výrazný. Pokud plánujete více pozic, přepočítejte celý týmový rozpočet.',
        next: 'Další krok: spočítejte čistou mzdu, aby bylo jasné, co z hrubé částky dostane zaměstnanec.'
      };
    }
    if (result.monthlyTotalCost <= 85000) {
      return {
        badge: 'Běžná rozpočtová zátěž',
        title: 'Standardní úroveň nákladů zaměstnavatele.',
        text: 'Výsledek odpovídá běžnému zaměstnaneckému poměru. Pro rozhodnutí sledujte hlavně měsíční náklad, roční dopad a prostor na benefity.',
        next: 'Další krok: porovnejte hodinovou mzdu a celkový roční rozpočet pozice.'
      };
    }
    return {
      badge: 'Vyšší nákladová pozice',
      title: 'Vyšší mzdová pozice rychle zvyšuje roční náklad.',
      text: 'U vyšších mezd dává smysl dívat se hlavně na roční náklad firmy a porovnat, zda odpovídá očekávanému přínosu role.',
      next: 'Další krok: ověřte návratnost role, hodinovou sazbu alternativy a bod zvratu u služby nebo týmu.'
    };
  }

  function renderBreakdown(values, result) {
    const items = [
      ['Hrubá mzda', 'Zadaná hrubá měsíční mzda zaměstnance.', values.grossSalary],
      ['Sociální pojištění 24,8 %', 'Povinný odvod hrazený zaměstnavatelem.', result.employerSocial],
      ['Zdravotní pojištění 9 %', 'Povinný odvod hrazený zaměstnavatelem.', result.employerHealth],
      ['Celková cena práce', 'Součet hrubé mzdy a odvodů zaměstnavatele.', result.monthlyTotalCost]
    ];

    outputs.breakdownList.innerHTML = items.map(item => `<div class="breakdown-item"><div><strong>${item[0]}</strong><span>${item[1]}</span></div><b>${formatCurrency(item[2], values.roundWhole)}</b></div>`).join('');
  }

  function renderComparison(values, result) {
    if (!values.compareOSVC) {
      outputs.comparisonGrid.hidden = true;
      return;
    }

    outputs.comparisonGrid.hidden = false;
    outputs.comparisonEmployee.textContent = formatCurrency(result.monthlyTotalCost, values.roundWhole);
    outputs.comparisonOsvc.textContent = formatCurrency(result.osvcEstimate, values.roundWhole);
    const delta = result.monthlyTotalCost - result.osvcEstimate;
    outputs.comparisonText.textContent = delta > 0
      ? `Jednoduchý orientační model naznačuje rozdíl ${formatCurrency(delta, values.roundWhole)} měsíčně. U OSVČ vždy řešte i právní rámec, odpovědnost a skutečný rozsah spolupráce.`
      : 'Jednoduchý orientační model vychází podobně jako HPP. V praxi záleží na oboru, fakturaci, odpovědnosti a rozsahu spolupráce.';
  }

  function renderPremium(values, result, decision) {
    if (!outputs.premiumVerdict) return;

    outputs.premiumVerdict.textContent = decision.badge;
    outputs.premiumSubline.textContent = `${formatCurrency(result.monthlyTotalCost, values.roundWhole)} měsíčně, ${formatCurrency(result.yearlyTotalCost, values.roundWhole)} ročně`;
    outputs.premiumSentence.textContent = `${decision.text} ${decision.next}`;
    outputs.premiumChecklist.innerHTML = [
      `Odvody zaměstnavatele navyšují hrubou mzdu o ${formatCurrency(result.difference, values.roundWhole)} měsíčně.`,
      'Do finálního rozpočtu připočtěte benefity, vybavení, nábor, onboarding a režii pozice.',
      values.compareOSVC
        ? 'Porovnání s OSVČ berte jen orientačně. Právní rámec spolupráce nelze rozhodnout samotnou cenou.'
        : 'Pro rozhodování o nabídce navazuje čistá mzda, hodinová mzda a případné porovnání s dohodou nebo fakturací.'
    ].map(item => `<li>${item}</li>`).join('');

    const scenarios = [32000, 40000, 55000, 80000].map(gross => {
      const scenario = calculateForGross(gross);
      return `<tr><td>${formatCurrency(gross, values.roundWhole)}</td><td>${formatCurrency(scenario.monthlyTotalCost, values.roundWhole)}</td><td>${formatCurrency(scenario.yearlyTotalCost, values.roundWhole)}</td></tr>`;
    }).join('');
    outputs.premiumTable.innerHTML = scenarios;
  }

  function render(values, result) {
    const decision = decisionContent(result);
    outputs.monthlyTotalCost.textContent = formatCurrency(result.monthlyTotalCost, values.roundWhole);
    outputs.yearlyTotalCost.textContent = formatCurrency(result.yearlyTotalCost, values.roundWhole);
    outputs.employerSocial.textContent = formatCurrency(result.employerSocial, values.roundWhole);
    outputs.employerHealth.textContent = formatCurrency(result.employerHealth, values.roundWhole);
    outputs.summaryGross.textContent = formatCurrency(values.grossSalary, values.roundWhole);
    outputs.summaryDifference.textContent = formatCurrency(result.difference, values.roundWhole);
    outputs.summaryContributionShare.textContent = `${formatNumber(result.contributionShare, 1)} %`;
    outputs.costPer10k.textContent = formatCurrency(result.costPer10k, values.roundWhole);
    outputs.resultLead.textContent = `Při hrubé mzdě ${formatCurrency(values.grossSalary, values.roundWhole)} činí orientační cena práce ${formatCurrency(result.monthlyTotalCost, values.roundWhole)} měsíčně.`;
    outputs.nextStep.textContent = values.compareOSVC ? 'Porovnejte model s limity spolupráce' : 'Zkuste jinou hrubou mzdu a porovnejte scénáře';
    outputs.decisionTitle.textContent = decision.title;
    outputs.decisionText.textContent = `${decision.text} ${decision.next}`;
    outputs.heroTotalCost.textContent = compactCurrency(result.monthlyTotalCost);
    outputs.heroGross.textContent = `Hrubá mzda ${compactCurrency(values.grossSalary)}`;
    outputs.heroSocial.textContent = compactCurrency(result.employerSocial);
    outputs.heroHealth.textContent = compactCurrency(result.employerHealth);
    outputs.heroYearly.textContent = compactCurrency(result.yearlyTotalCost);
    outputs.heroGrossBar.style.width = `${Math.max(20, Math.min(100, values.grossSalary / result.monthlyTotalCost * 100))}%`;
    outputs.heroContributionBar.style.width = `${Math.max(12, Math.min(100, result.difference / result.monthlyTotalCost * 100))}%`;

    renderBreakdown(values, result);
    renderComparison(values, result);
    renderPremium(values, result, decision);
  }

  function runCalculation() {
    const values = getValues();
    const error = validate(values);
    if (error) {
      outputs.nextStep.textContent = error;
      return;
    }
    render(values, calculate(values));
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    runCalculation();
  });

  [grossInput, roundMode, comparisonMode].forEach(element => {
    element.addEventListener('input', runCalculation);
    element.addEventListener('change', runCalculation);
  });

  presetButtons.forEach(button => button.addEventListener('click', function () {
    grossInput.value = this.dataset.gross;
    presetButtons.forEach(item => item.setAttribute('aria-pressed', item === this ? 'true' : 'false'));
    runCalculation();
  }));

  resetBtn.addEventListener('click', () => {
    grossInput.value = 40000;
    roundMode.value = 'whole';
    comparisonMode.value = 'off';
    runCalculation();
  });

  runCalculation();
})();
