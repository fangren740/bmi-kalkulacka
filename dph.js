(function () {
  const form = document.getElementById('vatForm');
  if (!form) return;

  const resetBtn = document.getElementById('resetBtn');
  const presetButtons = Array.from(document.querySelectorAll('.scenario-chip'));
  const $ = id => document.getElementById(id);

  const outputs = {
    withoutDPH: $('withoutDPH'),
    dph: $('dph'),
    withDPH: $('withDPH'),
    summaryAmount: $('summaryAmount'),
    summaryMode: $('summaryMode'),
    summaryRate: $('summaryRate'),
    summaryShare: $('summaryShare'),
    statusBadge: $('statusBadge'),
    decisionStatus: $('decisionStatus'),
    decisionSummary: $('decisionSummary'),
    actionStatus: $('actionStatus'),
    actionSummary: $('actionSummary'),
    nextActionText: $('nextActionText'),
    primaryNextCta: $('primaryNextCta'),
    secondaryNextCta: $('secondaryNextCta'),
    heroTaxRate: $('heroTaxRate'),
    heroWith: $('heroWith'),
    heroWithout: $('heroWithout'),
    heroTax: $('heroTax'),
    heroModePill: $('heroModePill'),
    barWithout: $('barWithout'),
    barTax: $('barTax'),
    premiumVerdict: $('dphPremiumVerdict'),
    premiumSubline: $('dphPremiumSubline'),
    premiumSentence: $('dphPremiumSentence'),
    premiumChecklist: $('dphPremiumChecklist'),
    premiumTable: $('dphScenarioTableBody')
  };

  function formatCurrency(value) {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number.isFinite(value) ? value : 0);
  }

  function compactCurrency(value) {
    const safeValue = Number.isFinite(value) ? value : 0;
    const abs = Math.abs(safeValue);
    const number = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });
    if (abs >= 1000000) return `${number.format(safeValue / 1000000)} mil. Kč`;
    if (abs >= 100000) return `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(safeValue / 1000)} tis. Kč`;
    return formatCurrency(safeValue);
  }

  function formatPercent(value, digits = 2) {
    return `${new Intl.NumberFormat('cs-CZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits
    }).format(Number.isFinite(value) ? value : 0)} %`;
  }

  function getValues() {
    return {
      amount: Number($('amount').value),
      rate: Number($('rate').value),
      mode: $('mode').value
    };
  }

  function validate(values) {
    if (Number.isNaN(values.amount) || values.amount < 0) return 'Zadejte platnou částku.';
    if (!values.rate || values.rate <= 0) return 'Zvolte platnou sazbu DPH.';
    if (!['with', 'without'].includes(values.mode)) return 'Zvolte platný typ výpočtu.';
    return '';
  }

  function calculateVAT(values) {
    let withoutDPH = 0;
    let withDPH = 0;
    let dph = 0;

    if (values.mode === 'with') {
      withDPH = values.amount;
      withoutDPH = values.amount / (1 + values.rate / 100);
      dph = withDPH - withoutDPH;
    } else {
      withoutDPH = values.amount;
      dph = values.amount * (values.rate / 100);
      withDPH = withoutDPH + dph;
    }

    const shareOfGross = withDPH > 0 ? dph / withDPH * 100 : 0;
    return { withoutDPH, withDPH, dph, shareOfGross };
  }

  function decision(values, result) {
    const isWith = values.mode === 'with';
    if (isWith) {
      return {
        badge: 'Rozpočítáváte konečnou cenu',
        status: 'Cena s DPH',
        summary: 'Právě dopočítáváte základ daně z částky, která už DPH obsahuje. To se hodí při kontrole faktury, účtenky nebo cenové nabídky.',
        next: 'Po výpočtu si ověřte, že vstupní částka opravdu byla konečná cena včetně DPH. Pro marži pak pracujte se základem bez DPH.',
        primaryText: 'Spočítat marži',
        primaryHref: 'kalkulacka-marze-a-prirazky.html',
        secondaryText: 'Minimální cena',
        secondaryHref: 'minimalni-prodejni-cena-kalkulacka.html',
        hero: 'Cena s DPH rozpočítaná na základ a daň'
      };
    }

    return {
      badge: 'Tvoříte cenu ze základu',
      status: 'Cena bez DPH',
      summary: 'Právě dopočítáváte finální cenu s DPH ze základu daně. To se hodí při tvorbě nabídky, kalkulaci ceny nebo kontrole fakturace.',
      next: 'Po výpočtu si ověřte správnou sazbu a zkontrolujte, zda konečná cena dává smysl pro zákazníka i marži.',
      primaryText: 'Bod zvratu',
      primaryHref: 'bod-zvratu-kalkulacka.html',
      secondaryText: 'Procenta',
      secondaryHref: 'procenta-kalkulacka.html',
      hero: 'Základ navýšený o zvolenou sazbu DPH'
    };
  }

  function renderPremium(values, result, state) {
    if (!outputs.premiumVerdict) return;

    outputs.premiumVerdict.textContent = state.badge;
    outputs.premiumSubline.textContent = `${formatPercent(values.rate, 0)} sazba, DPH ${formatCurrency(result.dph)}`;
    outputs.premiumSentence.textContent = `${state.summary} ${state.next}`;
    outputs.premiumChecklist.innerHTML = [
      values.mode === 'with'
        ? 'Zadaná částka už obsahuje DPH. Daň se neodečítá prostým procentem z konečné ceny, ale přes koeficient.'
        : 'Zadaná částka je základ bez DPH. DPH se přičítá navrch a mění konečnou cenu pro zákazníka.',
      'Pro cenotvorbu plátce bývá klíčová cena bez DPH, protože samotná daň není marže ani výnos.',
      'U faktury s více položkami počítejte každou sazbu zvlášť a až potom porovnejte součty.'
    ].map(item => `<li>${item}</li>`).join('');

    outputs.premiumTable.innerHTML = [21, 12].map(rate => {
      const scenario = calculateVAT({ ...values, rate });
      return `<tr><td>${formatPercent(rate, 0)}</td><td>${formatCurrency(scenario.dph)}</td><td>${formatCurrency(scenario.withDPH)}</td></tr>`;
    }).join('');
  }

  function updateDecision(values, result) {
    const state = decision(values, result);
    const isWith = values.mode === 'with';

    outputs.statusBadge.className = isWith ? 'badge success' : 'badge warning';
    outputs.statusBadge.textContent = state.badge;
    outputs.decisionStatus.className = isWith ? 'decision-status safe' : 'decision-status caution';
    outputs.decisionStatus.textContent = state.status;
    outputs.decisionSummary.textContent = state.summary;
    outputs.actionStatus.className = isWith ? 'decision-status safe' : 'decision-status caution';
    outputs.actionStatus.textContent = 'Další krok';
    outputs.actionSummary.textContent = isWith
      ? `Ze zadané částky ${formatCurrency(values.amount)} při sazbě ${formatPercent(values.rate, 0)} vychází základ daně ${formatCurrency(result.withoutDPH)} a samotná DPH ${formatCurrency(result.dph)}.`
      : `Ze základu ${formatCurrency(values.amount)} při sazbě ${formatPercent(values.rate, 0)} vychází DPH ${formatCurrency(result.dph)} a výsledná cena s DPH ${formatCurrency(result.withDPH)}.`;
    outputs.nextActionText.textContent = state.next;
    outputs.primaryNextCta.href = state.primaryHref;
    outputs.primaryNextCta.textContent = state.primaryText;
    outputs.secondaryNextCta.href = state.secondaryHref;
    outputs.secondaryNextCta.textContent = state.secondaryText;
    outputs.heroModePill.textContent = state.hero;

    renderPremium(values, result, state);
  }

  function render(values, result) {
    outputs.withoutDPH.textContent = formatCurrency(result.withoutDPH);
    outputs.dph.textContent = formatCurrency(result.dph);
    outputs.withDPH.textContent = formatCurrency(result.withDPH);
    outputs.summaryAmount.textContent = formatCurrency(values.amount);
    outputs.summaryMode.textContent = values.mode === 'with' ? 'Zadaná částka je cena s DPH' : 'Zadaná částka je cena bez DPH';
    outputs.summaryRate.textContent = formatPercent(values.rate, 0);
    outputs.summaryShare.textContent = formatPercent(result.shareOfGross);
    outputs.heroTaxRate.textContent = `${formatPercent(values.rate, 0)} DPH`;
    outputs.heroWith.textContent = compactCurrency(result.withDPH);
    outputs.heroWithout.textContent = compactCurrency(result.withoutDPH);
    outputs.heroTax.textContent = compactCurrency(result.dph);

    const withoutShare = result.withDPH > 0 ? Math.max(8, Math.min(100, result.withoutDPH / result.withDPH * 100)) : 0;
    const taxShare = result.withDPH > 0 ? Math.max(8, Math.min(100, result.dph / result.withDPH * 100)) : 0;
    outputs.barWithout.style.width = `${withoutShare}%`;
    outputs.barTax.style.width = `${taxShare}%`;

    updateDecision(values, result);
  }

  function renderError(message) {
    outputs.withoutDPH.textContent = '0 Kč';
    outputs.dph.textContent = '0 Kč';
    outputs.withDPH.textContent = '0 Kč';
    outputs.summaryAmount.textContent = '-';
    outputs.summaryMode.textContent = '-';
    outputs.summaryRate.textContent = '-';
    outputs.summaryShare.textContent = '-';
    outputs.statusBadge.className = 'badge warning';
    outputs.statusBadge.textContent = 'Chybí vstupní data';
    outputs.decisionStatus.className = 'decision-status caution';
    outputs.decisionStatus.textContent = 'Zkontrolujte vstup';
    outputs.decisionSummary.textContent = message;
    outputs.actionSummary.textContent = 'Po opravě vstupu kalkulačka hned dopočítá základ daně, DPH i finální cenu.';
  }

  function runCalculation() {
    const values = getValues();
    const error = validate(values);
    if (error) {
      renderError(error);
      return;
    }
    render(values, calculateVAT(values));
  }

  function setPreset(name) {
    const presets = {
      with21: { amount: 1000, mode: 'with', rate: '21' },
      without21: { amount: 1000, mode: 'without', rate: '21' },
      with12: { amount: 1120, mode: 'with', rate: '12' }
    };
    const preset = presets[name];
    if (!preset) return;
    $('amount').value = preset.amount;
    $('mode').value = preset.mode;
    $('rate').value = preset.rate;
    presetButtons.forEach(button => {
      const active = button.dataset.preset === name;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    runCalculation();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    runCalculation();
  });

  ['amount', 'mode', 'rate'].forEach(id => {
    $(id).addEventListener('input', runCalculation);
    $(id).addEventListener('change', runCalculation);
  });

  presetButtons.forEach(button => button.addEventListener('click', () => setPreset(button.dataset.preset)));
  resetBtn.addEventListener('click', () => setPreset('with21'));
  runCalculation();
})();
