(() => {
  const form = document.getElementById('ltvForm');
  if (!form) return;

  const resetBtn = document.getElementById('resetBtn');
  const ids = ['propertyPrice', 'ownSavings', 'reserveAmount', 'additionalCosts', 'targetLtv', 'monthlyIncome'];
  const $ = id => document.getElementById(id);

  const money = value => new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);

  const number = value => new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: 1
  }).format(Number.isFinite(value) ? value : 0);

  const percent = value => `${number(value)} %`;

  const compactMoney = value => {
    const safeValue = Number.isFinite(value) ? value : 0;
    const abs = Math.abs(safeValue);
    if (abs >= 1000000) return `${number(safeValue / 1000000)} mil. Kč`;
    if (abs >= 100000) return `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(safeValue / 1000)} tis. Kč`;
    return money(safeValue);
  };

  const premium = {
    verdict: $('ltvPremiumVerdict'),
    subline: $('ltvPremiumSubline'),
    sentence: $('ltvPremiumSentence'),
    checklist: $('ltvPremiumChecklist'),
    table: $('ltvScenarioTableBody')
  };

  function readValues() {
    return {
      propertyPrice: Number($('propertyPrice').value) || 0,
      ownSavings: Number($('ownSavings').value) || 0,
      reserveAmount: Number($('reserveAmount').value) || 0,
      additionalCosts: Number($('additionalCosts').value) || 0,
      targetLtv: Number($('targetLtv').value) || 80,
      monthlyIncome: Number($('monthlyIncome').value) || 0
    };
  }

  function calculate(values) {
    const usableSavings = Math.max(0, values.ownSavings - values.reserveAmount);
    const fundsAfterCosts = Math.max(0, usableSavings - values.additionalCosts);
    const usedOwnSources = Math.min(values.propertyPrice, fundsAfterCosts);
    const requiredMortgage = Math.max(0, values.propertyPrice - usedOwnSources);
    const ltv = values.propertyPrice > 0 ? requiredMortgage / values.propertyPrice * 100 : 0;
    const targetMortgage = values.propertyPrice * (values.targetLtv / 100);
    const ownForTarget = Math.max(0, values.propertyPrice - targetMortgage);
    const missingForTarget = Math.max(0, ownForTarget - usedOwnSources);
    const incomeMultiple = values.monthlyIncome > 0 ? requiredMortgage / values.monthlyIncome : 0;

    return {
      usableSavings,
      fundsAfterCosts,
      usedOwnSources,
      requiredMortgage,
      ltv,
      ownForTarget,
      missingForTarget,
      incomeMultiple
    };
  }

  function stateFor(values, result) {
    if (result.ltv <= values.targetLtv && values.reserveAmount >= values.monthlyIncome * 2) {
      return {
        badge: 'LTV i rezerva působí zdravě',
        headline: 'LTV vychází v cílovém pásmu',
        tone: 'safe',
        text: `Potřebná hypotéka je ${money(result.requiredMortgage)} a LTV přibližně ${percent(result.ltv)}. Po odečtení rezervy a vedlejších nákladů používáte ${money(result.usedOwnSources)} vlastních zdrojů.`,
        next: 'Další krok: spočítejte měsíční splátku hypotéky a ověřte, zda sedí do příjmu domácnosti.'
      };
    }

    if (result.ltv <= values.targetLtv) {
      return {
        badge: 'LTV vychází, rezerva je citlivá',
        headline: 'Cílové LTV splňujete, ale hlídejte hotovost',
        tone: 'watch',
        text: `Do cílového LTV se vejdete, ale po koupi zůstává rezerva ${money(values.reserveAmount)}. U starší nemovitosti nebo napjatého rozpočtu ji raději porovnejte s běžnými výdaji.`,
        next: 'Další krok: dopočítejte celkovou cenu koupě a ověřte, jestli rezerva nepůjde hned do vybavení nebo oprav.'
      };
    }

    return {
      badge: 'Do cílového LTV chybí vlastní zdroje',
      headline: 'Cílové LTV zatím nevychází',
      tone: 'risk',
      text: `Potřebná hypotéka je ${money(result.requiredMortgage)} a do cílového LTV chybí přibližně ${money(result.missingForTarget)} vlastních zdrojů. Výsledek berte jako signál pro levnější nemovitost, delší spoření nebo jiné nastavení financování.`,
      next: 'Další krok: zkuste levnější nemovitost, vyšší úspory nebo spočítejte dostupnost bydlení podle čistého příjmu.'
    };
  }

  function renderScenarioTable(values, result) {
    const rows = [80, 85, 90].map(limit => {
      const ownNeed = Math.max(0, values.propertyPrice * (1 - limit / 100));
      const missing = Math.max(0, ownNeed - result.usedOwnSources);
      const impact = missing > 0 ? `chybí ${money(missing)}` : 'splněno';
      return `<tr><td>LTV ${limit} %</td><td>${money(ownNeed)}</td><td>${impact}</td></tr>`;
    });

    if (premium.table) premium.table.innerHTML = rows.join('');
  }

  function renderPremium(values, result, state) {
    if (!premium.verdict) return;

    premium.verdict.textContent = state.badge;
    premium.subline.textContent = result.missingForTarget > 0
      ? `Chybí ${money(result.missingForTarget)} do ${values.targetLtv} % LTV`
      : `LTV ${percent(result.ltv)} proti cíli ${values.targetLtv} %`;
    premium.sentence.textContent = state.text;

    const reserveMonths = values.monthlyIncome > 0 ? values.reserveAmount / values.monthlyIncome : 0;
    premium.checklist.innerHTML = [
      result.missingForTarget > 0
        ? 'Nejdřív ověřte, zda problém dělá cena nemovitosti, vedlejší náklady, nebo nízká akontace.'
        : 'Cílové LTV vychází. Teď je důležitější měsíční splátka a rezerva po koupi.',
      reserveMonths < 2
        ? 'Rezerva je nízká vůči příjmu. Před podpisem si nechte hotovost na první měsíce bydlení.'
        : 'Rezerva je v modelu započtená. Porovnejte ji ještě se skutečnými výdaji domácnosti.',
      result.incomeMultiple > 75
        ? 'Hypotéka je vysoká vůči měsíčnímu příjmu. Spočítejte dostupnost nemovitosti a stresový scénář sazby.'
        : 'Hypotéka nepůsobí extrémně vůči zadanému příjmu, ale banka bude řešit i závazky a stabilitu příjmu.'
    ].map(item => `<li>${item}</li>`).join('');

    renderScenarioTable(values, result);
  }

  function renderBreakdown(values, result) {
    const scenarios = [80, 85, 90].map(limit => {
      const ownNeed = Math.max(0, values.propertyPrice * (1 - limit / 100));
      const mortgage = Math.max(0, values.propertyPrice - Math.max(result.usedOwnSources, ownNeed));
      const missing = Math.max(0, ownNeed - result.usedOwnSources);
      const status = missing > 0 ? `chybí ${money(missing)}` : 'splněno';
      return `<tr><td>LTV ${limit} %</td><td>${money(ownNeed)}</td><td>${money(mortgage)}</td><td>${status}</td></tr>`;
    });

    $('breakdownBody').innerHTML = scenarios.join('');
  }

  function render() {
    const values = readValues();
    if (!values.propertyPrice) return;

    const result = calculate(values);
    const state = stateFor(values, result);

    $('requiredMortgage').textContent = money(result.requiredMortgage);
    $('usableDownPayment').textContent = money(result.usedOwnSources);
    $('ltvValue').textContent = percent(result.ltv);
    $('missingForTarget').textContent = money(result.missingForTarget);
    $('summaryIncomeMultiple').textContent = `${number(result.incomeMultiple)}×`;
    $('summaryPropertyPrice').textContent = money(values.propertyPrice);
    $('summaryAdditionalCosts').textContent = money(values.additionalCosts);
    $('summaryReserve').textContent = money(values.reserveAmount);
    $('summaryUsedOwnSources').textContent = money(result.usedOwnSources);
    $('heroLtvValue').textContent = `${percent(result.ltv)} LTV`;
    $('heroPropertyPrice').textContent = compactMoney(values.propertyPrice);
    $('heroOwnSources').textContent = compactMoney(result.usedOwnSources);
    $('heroReserve').textContent = compactMoney(values.reserveAmount);
    $('heroMortgage').textContent = compactMoney(result.requiredMortgage);
    $('ltvBadge').textContent = state.badge;
    $('decisionHeadline').textContent = state.headline;
    $('decisionText').textContent = state.text;
    $('nextStepText').textContent = state.next;

    renderBreakdown(values, result);
    renderPremium(values, result, state);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    render();
  });

  ids.forEach(id => {
    const element = $(id);
    element.addEventListener('input', render);
    element.addEventListener('change', render);
  });

  resetBtn.addEventListener('click', () => {
    form.reset();
    render();
  });

  render();
})();
