(() => {
  const form = document.getElementById('ltvForm');
  if (!form) return;

  const resetBtn = document.getElementById('resetBtn');
  const ids = ['propertyPrice', 'ownSavings', 'reserveAmount', 'additionalCosts', 'targetLtv', 'monthlyIncome'];
  const get = id => document.getElementById(id);

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
    verdict: get('ltvPremiumVerdict'),
    subline: get('ltvPremiumSubline'),
    sentence: get('ltvPremiumSentence'),
    checklist: get('ltvPremiumChecklist'),
    table: get('ltvScenarioTableBody')
  };

  function readValues() {
    return {
      propertyPrice: Number(get('propertyPrice')?.value) || 0,
      ownSavings: Number(get('ownSavings')?.value) || 0,
      reserveAmount: Number(get('reserveAmount')?.value) || 0,
      additionalCosts: Number(get('additionalCosts')?.value) || 0,
      targetLtv: Number(get('targetLtv')?.value) || 80,
      monthlyIncome: Number(get('monthlyIncome')?.value) || 0
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
    const reserveMonths = values.monthlyIncome > 0 ? values.reserveAmount / values.monthlyIncome : 0;
    const ownSourcesPlus100k = Math.min(values.propertyPrice, usedOwnSources + 100000);
    const ltvAfterExtra100k = values.propertyPrice > 0 ? (values.propertyPrice - ownSourcesPlus100k) / values.propertyPrice * 100 : 0;
    const maxPriceAtTarget = values.targetLtv < 100 && fundsAfterCosts > 0
      ? fundsAfterCosts / (1 - values.targetLtv / 100)
      : 0;

    return {
      usableSavings,
      fundsAfterCosts,
      usedOwnSources,
      requiredMortgage,
      ltv,
      targetMortgage,
      ownForTarget,
      missingForTarget,
      incomeMultiple,
      reserveMonths,
      ltvAfterExtra100k,
      maxPriceAtTarget
    };
  }

  function stateFor(values, result) {
    if (result.ltv <= values.targetLtv && result.reserveMonths >= 3) {
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
        text: `Do cílového LTV se vejdete, ale po koupi necháváte rezervu ${money(values.reserveAmount)}, což je přibližně ${number(result.reserveMonths)} měsíce zadaného příjmu. U starší nemovitosti nebo napjatého rozpočtu ji raději porovnejte s běžnými výdaji.`,
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
    if (!premium.table) return;

    premium.table.innerHTML = [80, 85, 90].map(limit => {
      const ownNeed = Math.max(0, values.propertyPrice * (1 - limit / 100));
      const missing = Math.max(0, ownNeed - result.usedOwnSources);
      const impact = missing > 0 ? `chybí ${money(missing)}` : 'splněno';
      return `<tr><td>LTV ${limit} %</td><td>${money(ownNeed)}</td><td>${impact}</td></tr>`;
    }).join('');
  }

  function renderPremium(values, result, state) {
    if (!premium.verdict) return;

    premium.verdict.textContent = state.badge;
    premium.subline.textContent = result.missingForTarget > 0
      ? `Chybí ${money(result.missingForTarget)} do ${values.targetLtv} % LTV`
      : `LTV ${percent(result.ltv)} proti cíli ${values.targetLtv} %`;
    premium.sentence.textContent = state.text;

    premium.checklist.innerHTML = [
      result.missingForTarget > 0
        ? 'Nejdřív ověřte, zda problém dělá cena nemovitosti, vedlejší náklady, ponechaná rezerva, nebo nízká akontace.'
        : 'Cílové LTV vychází. Teď je důležitější měsíční splátka, rezerva po koupi a celkové náklady vlastnictví.',
      result.reserveMonths < 3
        ? 'Rezerva je nízká vůči zadanému příjmu. Před podpisem si nechte hotovost na první měsíce bydlení a nečekané opravy.'
        : 'Rezerva je v modelu započtená. Porovnejte ji ještě se skutečnými výdaji domácnosti, ne jen s příjmem.',
      result.incomeMultiple > 75
        ? 'Hypotéka je vysoká vůči měsíčnímu příjmu. Spočítejte dostupnost nemovitosti a stress test splátky.'
        : 'Hypotéka nepůsobí extrémně vůči zadanému příjmu, ale banka bude řešit i závazky, stabilitu příjmu a odhad nemovitosti.'
    ].map(item => `<li>${item}</li>`).join('');

    renderScenarioTable(values, result);
  }

  function renderBreakdown(values, result) {
    const breakdownBody = get('breakdownBody');
    if (!breakdownBody) return;

    breakdownBody.innerHTML = [80, 85, 90].map(limit => {
      const ownNeed = Math.max(0, values.propertyPrice * (1 - limit / 100));
      const mortgage = Math.max(0, values.propertyPrice - Math.max(result.usedOwnSources, ownNeed));
      const missing = Math.max(0, ownNeed - result.usedOwnSources);
      const status = missing > 0 ? `chybí ${money(missing)}` : 'splněno';
      return `<tr><td>LTV ${limit} %</td><td>${money(ownNeed)}</td><td>${money(mortgage)}</td><td>${status}</td></tr>`;
    }).join('');
  }

  function setText(id, value) {
    const element = get(id);
    if (element) element.textContent = value;
  }

  function render() {
    const values = readValues();
    if (!values.propertyPrice) return;

    const result = calculate(values);
    const state = stateFor(values, result);

    setText('requiredMortgage', money(result.requiredMortgage));
    setText('usableDownPayment', money(result.usedOwnSources));
    setText('ltvValue', percent(result.ltv));
    setText('missingForTarget', money(result.missingForTarget));
    setText('targetOwnNeeded', money(result.ownForTarget));
    setText('reserveMonthsResult', `${number(result.reserveMonths)}×`);
    setText('ltvAfterExtra100k', percent(result.ltvAfterExtra100k));
    setText('maxPriceAtTarget', money(result.maxPriceAtTarget));
    setText('summaryIncomeMultiple', `${number(result.incomeMultiple)}×`);
    setText('summaryPropertyPrice', money(values.propertyPrice));
    setText('summaryAdditionalCosts', money(values.additionalCosts));
    setText('summaryReserve', money(values.reserveAmount));
    setText('summaryUsedOwnSources', money(result.usedOwnSources));
    setText('heroLtvValue', `${percent(result.ltv)} LTV`);
    setText('heroPropertyPrice', compactMoney(values.propertyPrice));
    setText('heroOwnSources', compactMoney(result.usedOwnSources));
    setText('heroReserve', compactMoney(values.reserveAmount));
    setText('heroMortgage', compactMoney(result.requiredMortgage));
    setText('ltvBadge', state.badge);
    setText('decisionHeadline', state.headline);
    setText('decisionText', state.text);
    setText('nextStepText', state.next);

    renderBreakdown(values, result);
    renderPremium(values, result, state);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    render();
  });

  ids.forEach(id => {
    const element = get(id);
    if (!element) return;
    element.addEventListener('input', render);
    element.addEventListener('change', render);
  });

  resetBtn?.addEventListener('click', () => {
    form.reset();
    render();
  });

  render();
})();
