/* Calculator-specific V2 logic. Shared helpers live in /assets/js/rv-tool-core.js. */
(function(){
  const form = document.getElementById('calculatorForm');
  if (!form) return;

  const presetButtons = Array.from(document.querySelectorAll('[data-preset]'));
  const outputs = {
    netIncome: document.getElementById('netIncome'),
    grossIncomeOut: document.getElementById('grossIncomeOut'),
    socialInsurance: document.getElementById('socialInsurance'),
    healthInsurance: document.getElementById('healthInsurance'),
    summaryLimit: document.getElementById('summaryLimit'),
    taxMode: document.getElementById('taxMode'),
    taxAfterCredit: document.getElementById('taxAfterCredit'),
    statusBadge: document.getElementById('statusBadge'),
    resultNote: document.getElementById('resultNote'),
    breakdownBody: document.getElementById('breakdownBody'),
    limitStatus: document.getElementById('limitStatus'),
    limitText: document.getElementById('limitText'),
    taxStatus: document.getElementById('taxStatus'),
    taxText: document.getElementById('taxText'),
    payrollStatus: document.getElementById('payrollStatus'),
    nextActionText: document.getElementById('nextActionText'),
    limitHelper: document.getElementById('limitHelper'),
    limitProgressBar: document.getElementById('limitProgressBar'),
    meterPercent: document.getElementById('meterPercent'),
    meterLabel: document.getElementById('meterLabel'),
    decisionText: document.getElementById('decisionText'),
    heroPreviewNet: document.getElementById('heroPreviewNet'),
    heroPreviewGross: document.getElementById('heroPreviewGross'),
    heroPreviewInsurance: document.getElementById('heroPreviewInsurance'),
    heroPreviewTax: document.getElementById('heroPreviewTax'),
    heroPreviewBadge: document.getElementById('heroPreviewBadge'),
    heroPreviewType: document.getElementById('heroPreviewType'),
    dppPremiumNet: document.getElementById('dppPremiumNet'),
    dppPremiumBadge: document.getElementById('dppPremiumBadge'),
    dppPremiumSentence: document.getElementById('dppPremiumSentence'),
    dppPremiumChecklist: document.getElementById('dppPremiumChecklist'),
    dppScenarioTableBody: document.getElementById('dppScenarioTableBody')
  };

  const formatCurrency = value => new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);

  function getValues(){
    return {
      agreementType: document.getElementById('agreementType').value,
      grossIncome: Number(document.getElementById('grossIncome').value),
      taxRate: Number(document.getElementById('taxRate').value),
      signedDeclaration: document.getElementById('signedDeclaration').checked,
      applyTaxCredit: document.getElementById('applyTaxCredit').checked
    };
  }

  function getLimit(type){
    return type === 'DPP' ? 12000 : 4500;
  }

  function getTaxCredit(values){
    return values.signedDeclaration && values.applyTaxCredit ? 2570 : 0;
  }

  function calculateAgreement(values){
    const limit = getLimit(values.agreementType);
    const insuranceApplies = values.grossIncome >= limit;
    const socialInsurance = Math.round(values.grossIncome * (insuranceApplies ? 0.071 : 0));
    const healthInsurance = Math.round(values.grossIncome * (insuranceApplies ? 0.045 : 0));
    const taxBeforeCredit = Math.round(values.grossIncome * (values.taxRate / 100));
    const taxCredit = Math.min(getTaxCredit(values), taxBeforeCredit);
    const taxAfterCredit = Math.max(0, taxBeforeCredit - taxCredit);
    const taxMode = (!values.signedDeclaration && values.grossIncome < limit) ? 'Srážková daň' : 'Zálohová daň';
    const netIncome = values.grossIncome - socialInsurance - healthInsurance - taxAfterCredit;

    return { limit, insuranceApplies, socialInsurance, healthInsurance, taxBeforeCredit, taxCredit, taxAfterCredit, taxMode, netIncome };
  }

  function renderBreakdown(values, result){
    const rows = [
      ['Hrubá odměna', 'Zadaná hrubá měsíční odměna.', values.grossIncome],
      ['Sociální pojištění', result.insuranceApplies ? 'Odvod sociálního pojištění zaměstnance.' : 'Pod rozhodným limitem se v modelu neodvádí.', -result.socialInsurance],
      ['Zdravotní pojištění', result.insuranceApplies ? 'Odvod zdravotního pojištění zaměstnance.' : 'Pod rozhodným limitem se v modelu neodvádí.', -result.healthInsurance],
      ['Daň před slevou', 'Orientační daň ze zadané hrubé odměny.', -result.taxBeforeCredit],
      ['Sleva na poplatníka', values.signedDeclaration && values.applyTaxCredit ? 'Uplatněná základní sleva na poplatníka.' : 'Sleva se neuplatňuje.', result.taxCredit],
      ['Daň po slevě', 'Skutečně odečtená orientační daň po slevě.', -result.taxAfterCredit],
      ['Čistá odměna', 'Orientační částka k výplatě.', result.netIncome]
    ];
    outputs.breakdownBody.innerHTML = rows.map(row => `<tr><td>${row[0]}<br><small>${row[1]}</small></td><td>${row[2] >= 0 ? formatCurrency(row[2]) : '- ' + formatCurrency(Math.abs(row[2]))}</td></tr>`).join('');
  }

  function updateDecision(values, result){
    const diff = values.grossIncome - result.limit;
    const near = Math.abs(diff) <= 1500;

    outputs.limitStatus.className = 'tag ' + (result.insuranceApplies ? 'caution' : 'safe');
    outputs.limitStatus.textContent = result.insuranceApplies ? 'Nad limitem' : 'Pod limitem';
    outputs.limitText.textContent = result.insuranceApplies
      ? `Odvody už vznikají. Aktuálně jste přibližně o ${formatCurrency(Math.max(0, diff))} nad limitem.`
      : `Odvody zatím nevznikají. Do limitu zbývá přibližně ${formatCurrency(Math.max(0, -diff))}.`;

    outputs.taxStatus.className = 'tag ' + (values.signedDeclaration ? 'safe' : 'caution');
    outputs.taxStatus.textContent = values.signedDeclaration ? 'Sleva pomáhá' : 'Bez slevy';
    outputs.taxText.textContent = values.signedDeclaration
      ? 'Podepsané Prohlášení může čistou odměnu výrazně zlepšit.'
      : 'Bez Prohlášení se neuplatní základní sleva na poplatníka.';

    outputs.payrollStatus.className = 'tag ' + (near ? 'caution' : result.insuranceApplies ? 'risk' : 'safe');
    outputs.payrollStatus.textContent = near ? 'Blízko limitu' : result.insuranceApplies ? 'Vyšší srážky' : 'Příznivý režim';
    outputs.nextActionText.textContent = near
      ? 'Jste blízko rozhodného limitu. Zkuste si porovnat částku těsně pod a nad limitem.'
      : result.insuranceApplies
        ? 'Porovnejte, jestli se vyšší hrubá odměna po odvodech stále vyplatí.'
        : 'Pokud řešíte nabídku práce, porovnejte i DPČ nebo HPP podle rozsahu práce.';

    outputs.decisionText.textContent = result.insuranceApplies
      ? 'U této odměny se do čisté částky promítá sociální a zdravotní pojištění. Proto je rozdíl mezi hrubou a čistou částkou vyšší.'
      : 'Odměna je pod rozhodným limitem pro odvody. Čistá částka proto vychází příznivěji, zvlášť při uplatnění slevy na poplatníka.';

    outputs.resultNote.textContent = !values.signedDeclaration && !result.insuranceApplies
      ? 'Orientačně vychází zdanění srážkovou daní bez uplatnění základní slevy na poplatníka.'
      : !values.signedDeclaration && result.insuranceApplies
        ? 'Bez Prohlášení a při vzniku odvodů počítá model zálohovou daň bez základní slevy na poplatníka.'
        : 'Výsledek zohledňuje podpis Prohlášení a základní slevu na poplatníka. Konkrétní situaci může ovlivnit souběh dalších příjmů.';
  }

  function updateLimitUI(values, result){
    const percent = Math.min(160, Math.max(0, (values.grossIncome / result.limit) * 100));
    outputs.limitProgressBar.style.width = Math.min(100, percent) + '%';
    outputs.meterPercent.textContent = Math.round(percent) + ' %';
    outputs.meterLabel.textContent = `Využití limitu ${formatCurrency(result.limit)}`;
    outputs.limitHelper.textContent = `Použitý rozhodný limit pro ${values.agreementType}: ${formatCurrency(result.limit)}.`;
  }

  function renderPremiumDecision(values, result){
    if (!outputs.dppPremiumNet) return;

    const gap = values.grossIncome - result.limit;
    const near = Math.abs(gap) <= 1500;
    const verdict = near ? 'Blízko limitu' : result.insuranceApplies ? 'Nad limitem' : 'Pod limitem';

    outputs.dppPremiumNet.textContent = formatCurrency(result.netIncome);
    outputs.dppPremiumBadge.textContent = `${verdict}, ${result.taxMode.toLowerCase()}`;
    outputs.dppPremiumSentence.textContent = `Z hrubé odměny ${formatCurrency(values.grossIncome)} vychází orientační čistá odměna ${formatCurrency(result.netIncome)}. Rozhodný limit pro ${values.agreementType} je ${formatCurrency(result.limit)} a ${result.insuranceApplies ? 'odvody se do výsledku už promítají' : 'odvody se v tomto modelu ještě neodečítají'}.`;

    outputs.dppPremiumChecklist.innerHTML = [
      near ? 'Jste těsně kolem limitu. Porovnejte částku o pár stokorun níž a výš, čistý rozdíl může být překvapivý.' : result.insuranceApplies ? 'Odměna je nad limitem, proto sledujte čistý nárůst, ne jen vyšší hrubou částku.' : 'Odměna je pod limitem. Výsledek je citlivý hlavně na daňové prohlášení a slevu.',
      values.signedDeclaration ? 'Prohlášení k dani zlepšuje čistý výsledek, ale obvykle ho nelze mít podepsané u více zaměstnavatelů.' : 'Bez Prohlášení k dani se sleva neuplatní. U více příjmů ověřte daňový režim.',
      'Jako další krok porovnejte DPP/DPČ s čistou mzdou nebo hodinovou sazbou, aby bylo vidět, co se opravdu vyplatí.'
    ].map(item => `<li>${item}</li>`).join('');

    const scenarios = [
      [`${values.agreementType} těsně pod limitem`, Math.max(1, result.limit - 100), 'Čistá částka před vznikem odvodů'],
      [`${values.agreementType} těsně nad limitem`, result.limit + 100, 'Dopad přechodu přes rozhodný limit'],
      [values.agreementType === 'DPP' ? 'Stejná odměna jako DPČ' : 'Stejná odměna jako DPP', values.grossIncome, 'Porovnání typu dohody při stejné hrubé částce', values.agreementType === 'DPP' ? 'DPČ' : 'DPP']
    ];

    outputs.dppScenarioTableBody.innerHTML = scenarios.map(row => {
      const scenarioValues = { ...values, grossIncome: row[1], agreementType: row[3] || values.agreementType };
      const scenarioResult = calculateAgreement(scenarioValues);
      return `<tr><td>${row[0]}</td><td>${formatCurrency(scenarioResult.netIncome)}</td><td>${row[2]}</td></tr>`;
    }).join('');
  }

  function render(values, result){
    outputs.netIncome.textContent = formatCurrency(result.netIncome);
    outputs.grossIncomeOut.textContent = formatCurrency(values.grossIncome);
    outputs.socialInsurance.textContent = formatCurrency(result.socialInsurance);
    outputs.healthInsurance.textContent = formatCurrency(result.healthInsurance);
    outputs.summaryLimit.textContent = formatCurrency(result.limit);
    outputs.taxMode.textContent = result.taxMode;
    outputs.taxAfterCredit.textContent = formatCurrency(result.taxAfterCredit);
    outputs.statusBadge.textContent = result.insuranceApplies ? 'Vznikají odvody' : 'Bez odvodů';
    outputs.heroPreviewNet.textContent = formatCurrency(result.netIncome);
    outputs.heroPreviewGross.textContent = formatCurrency(values.grossIncome);
    outputs.heroPreviewInsurance.textContent = formatCurrency(result.socialInsurance + result.healthInsurance);
    outputs.heroPreviewTax.textContent = formatCurrency(result.taxAfterCredit);
    outputs.heroPreviewBadge.textContent = result.insuranceApplies ? 'Vznikají odvody' : 'Bez odvodů';
    outputs.heroPreviewType.textContent = values.agreementType;

    renderBreakdown(values, result);
    updateDecision(values, result);
    updateLimitUI(values, result);
    renderPremiumDecision(values, result);
  }

  function syncCreditAvailability(){
    const signed = document.getElementById('signedDeclaration').checked;
    const credit = document.getElementById('applyTaxCredit');
    if (!signed) {
      credit.checked = false;
      credit.disabled = true;
    } else {
      credit.disabled = false;
    }
  }

  function runCalculation(){
    const values = getValues();
    if (!values.grossIncome || values.grossIncome <= 0) return;
    render(values, calculateAgreement(values));
  }

  function applyPreset(btn){
    document.getElementById('agreementType').value = btn.dataset.type;
    document.getElementById('grossIncome').value = btn.dataset.income;
    document.getElementById('signedDeclaration').checked = btn.dataset.signed === '1';
    document.getElementById('applyTaxCredit').checked = btn.dataset.credit === '1';
    syncCreditAvailability();
    presetButtons.forEach(preset => preset.classList.toggle('active', preset === btn));
    runCalculation();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    runCalculation();
  });

  ['agreementType', 'grossIncome', 'taxRate', 'signedDeclaration', 'applyTaxCredit'].forEach(id => {
    const element = document.getElementById(id);
    element.addEventListener('input', () => {
      if (id === 'signedDeclaration') syncCreditAvailability();
      runCalculation();
    });
    element.addEventListener('change', () => {
      if (id === 'signedDeclaration') syncCreditAvailability();
      runCalculation();
    });
  });

  presetButtons.forEach(btn => btn.addEventListener('click', () => applyPreset(btn)));
  document.getElementById('resetBtn').addEventListener('click', () => applyPreset(presetButtons[0]));
  document.getElementById('copyResultBtn').addEventListener('click', async () => {
    const text = `DPP / DPČ kalkulačka
Čistá odměna: ${outputs.netIncome.textContent}
Hrubá odměna: ${outputs.grossIncomeOut.textContent}
Sociální pojištění: ${outputs.socialInsurance.textContent}
Zdravotní pojištění: ${outputs.healthInsurance.textContent}
Daňový režim: ${outputs.taxMode.textContent}`;
    try {
      await navigator.clipboard.writeText(text);
      outputs.statusBadge.textContent = 'Výsledek zkopírován';
    } catch (error) {
      outputs.statusBadge.textContent = 'Kopírování se nepovedlo';
    }
  });

  syncCreditAvailability();
  runCalculation();
})();
