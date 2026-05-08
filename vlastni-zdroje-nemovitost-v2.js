(function(){
  const form = document.getElementById('equityForm');
  if (!form) return;

  const $ = id => document.getElementById(id);
  const money = value => new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0
  }).format(Number.isFinite(value) ? value : 0);
  const compactMoney = value => {
    const safeValue = Number.isFinite(value) ? value : 0;
    const abs = Math.abs(safeValue);
    if (abs >= 1000000) {
      return `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(safeValue / 1000000)} mil. Kč`;
    }
    if (abs >= 100000) {
      return `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(safeValue / 1000)} tis. Kč`;
    }
    return money(safeValue);
  };
  const pct = (value, digits = 0) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0)} %`;

  const premium = {
    verdict: $('equityPremiumVerdict'),
    subline: $('equityPremiumSubline'),
    sentence: $('equityPremiumSentence'),
    checklist: $('equityPremiumChecklist'),
    table: $('equityScenarioTableBody')
  };

  function values(){
    return {
      propertyPrice: Number($('propertyPrice').value) || 0,
      downPaymentPercent: Number($('downPaymentPercent').value) || 0,
      legalCosts: Number($('legalCosts').value) || 0,
      estimateCosts: Number($('estimateCosts').value) || 0,
      moveAndSetupCosts: Number($('moveAndSetupCosts').value) || 0,
      reserveMonths: Number($('reserveMonths').value) || 0,
      monthlyHouseholdCosts: Number($('monthlyHouseholdCosts').value) || 0,
      savedMoney: Number($('savedMoney').value) || 0
    };
  }

  function calculate(input){
    const downPayment = input.propertyPrice * input.downPaymentPercent / 100;
    const mortgageNeeded = input.propertyPrice - downPayment;
    const sideCosts = input.legalCosts + input.estimateCosts + input.moveAndSetupCosts;
    const reserveValue = input.reserveMonths * input.monthlyHouseholdCosts;
    const totalNeeded = downPayment + sideCosts + reserveValue;
    const extraNeeded = sideCosts + reserveValue;
    const savingsDifference = input.savedMoney - totalNeeded;
    return {
      downPayment,
      mortgageNeeded,
      sideCosts,
      reserveValue,
      totalNeeded,
      extraNeeded,
      savingsDifference,
      savingsBalance: Math.max(0, savingsDifference)
    };
  }

  function verdict(result){
    if (result.savingsDifference >= result.reserveValue * 0.5) {
      return {
        badge: 'Vlastní zdroje působí bezpečně',
        text: 'Po započtení akontace, vedlejších nákladů a rezervy vám zůstává další prostor. Další krok je ověřit měsíční splátku hypotéky a dlouhodobou udržitelnost rozpočtu.',
        cls: 'badge success'
      };
    }
    if (result.savingsDifference >= 0) {
      return {
        badge: 'Vychází, ale bez velké rezervy',
        text: 'Zadané úspory pokrývají potřebné vlastní zdroje, ale prostor po koupi není velký. Opatrně zkontrolujte první měsíce po nastěhování a případné další výdaje.',
        cls: 'badge warning'
      };
    }
    return {
      badge: 'Vlastní zdroje nestačí',
      text: 'Po započtení akontace, vedlejších nákladů a rezervy část peněz chybí. Může pomoci nižší cena, delší spoření, menší rozsah okamžitého vybavení nebo jiné financování.',
      cls: 'badge danger'
    };
  }

  function renderTable(input, result){
    const rows = [
      ['Akontace', money(result.downPayment), `${pct(input.downPaymentPercent)} z ceny nemovitosti`],
      ['Odhadovaná hypotéka', money(result.mortgageNeeded), 'Část ceny financovaná úvěrem'],
      ['Právní a odhadní náklady', money(input.legalCosts + input.estimateCosts), 'Služby, odhad, administrace'],
      ['Stěhování a vybavení', money(input.moveAndSetupCosts), 'První náklady po koupi'],
      ['Doporučená rezerva', money(result.reserveValue), `${input.reserveMonths} měsíců výdajů`],
      ['Celkem vlastních peněz', money(result.totalNeeded), 'Akontace plus náklady a rezerva'],
      ['Rozdíl proti úsporám', money(result.savingsDifference), 'Kladné číslo znamená prostor navíc']
    ];
    $('breakdownBody').innerHTML = rows.map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('');
  }

  function renderPremium(input, result, state){
    if (!premium.verdict) return;

    premium.verdict.textContent = state.badge;
    premium.subline.textContent = result.savingsDifference >= 0
      ? `Po koupi zbývá ${money(result.savingsBalance)}`
      : `Chybí ${money(Math.abs(result.savingsDifference))}`;
    premium.sentence.textContent = `Na koupi za ${money(input.propertyPrice)} potřebujete orientačně ${money(result.totalNeeded)} vlastních peněz. Z toho akontace tvoří ${money(result.downPayment)}, vedlejší náklady ${money(result.sideCosts)} a rezerva ${money(result.reserveValue)}.`;

    premium.checklist.innerHTML = [
      result.savingsDifference < 0
        ? 'Úspory zatím nestačí. Nejdřív testujte nižší cenu nemovitosti nebo delší spoření.'
        : result.savingsDifference < result.reserveValue * 0.5
          ? 'Výsledek vychází těsně. Rezervu po koupi držte odděleně od peněz na vybavení.'
          : 'Vlastní zdroje působí zdravěji, ale ještě ověřte měsíční splátku a provoz bydlení.',
      input.reserveMonths < 3
        ? 'Rezerva je nízká. U starší nemovitosti nebo méně stabilního příjmu zvažte alespoň 3 až 6 měsíců výdajů.'
        : 'Rezerva po koupi je započtená. Před podpisem ji porovnejte se skutečnými výdaji domácnosti.',
      'Další krok je spočítat hypotéku, celkovou cenu koupě a dostupnost nemovitosti podle čistého příjmu.'
    ].map(item => `<li>${item}</li>`).join('');

    const scenarios = [
      ['Základní scénář', result.totalNeeded, 'Aktuální zadání'],
      ['Cena +300 000 Kč', calculate({ ...input, propertyPrice: input.propertyPrice + 300000 }).totalNeeded, 'Dopad dražší nemovitosti'],
      ['Rezerva 6 měsíců', calculate({ ...input, reserveMonths: 6 }).totalNeeded, 'Bezpečnější první měsíce po koupi'],
      ['Akontace 15 %', calculate({ ...input, downPaymentPercent: 15 }).totalNeeded, 'Nižší hotovost, vyšší hypotéka a LTV']
    ];

    premium.table.innerHTML = scenarios.map(row => `<tr><td>${row[0]}</td><td>${money(row[1])}</td><td>${row[2]}</td></tr>`).join('');
  }

  function render(input, result){
    const state = verdict(result);
    $('totalNeeded').textContent = money(result.totalNeeded);
    $('mortgageNeeded').textContent = money(result.mortgageNeeded);
    $('savingsDifference').textContent = money(result.savingsDifference);
    $('savingsBalance').textContent = money(result.savingsBalance);
    $('downPaymentValue').textContent = money(result.downPayment);
    $('statusBadge').textContent = state.badge;
    $('statusBadge').className = state.cls;
    $('readinessText').textContent = state.text;
    $('sideCosts').textContent = money(result.sideCosts);
    $('reserveValue').textContent = money(result.reserveValue);
    $('extraNeeded').textContent = money(result.extraNeeded);
    $('downPaymentPercentResult').textContent = pct(input.downPaymentPercent);
    $('savedMoneyResult').textContent = money(input.savedMoney);
    $('heroMain').textContent = compactMoney(result.totalNeeded);
    $('heroMortgage').textContent = compactMoney(result.mortgageNeeded);
    $('heroReserve').textContent = compactMoney(result.reserveValue);
    $('heroDiff').textContent = compactMoney(result.savingsDifference);
    $('heroBar').style.width = `${Math.max(8, Math.min(100, input.savedMoney && result.totalNeeded ? input.savedMoney / result.totalNeeded * 100 : 8))}%`;

    renderTable(input, result);
    renderPremium(input, result, state);
  }

  function run(){
    const input = values();
    render(input, calculate(input));
  }

  document.querySelectorAll('[data-equity-preset]').forEach(button => {
    button.addEventListener('click', () => {
      const preset = button.dataset.equityPreset;
      if (preset === 'standard') {
        $('propertyPrice').value = 6200000;
        $('downPaymentPercent').value = 20;
        $('savedMoney').value = 1650000;
      }
      if (preset === 'tight') {
        $('propertyPrice').value = 7200000;
        $('downPaymentPercent').value = 20;
        $('savedMoney').value = 1500000;
      }
      if (preset === 'safer') {
        $('propertyPrice').value = 5500000;
        $('downPaymentPercent').value = 20;
        $('savedMoney').value = 1800000;
      }
      run();
    });
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    run();
  });

  form.querySelectorAll('input, select').forEach(field => {
    field.addEventListener('input', run);
    field.addEventListener('change', run);
  });

  $('resetBtn').addEventListener('click', () => {
    $('propertyPrice').value = 6200000;
    $('downPaymentPercent').value = 20;
    $('legalCosts').value = 35000;
    $('estimateCosts').value = 15000;
    $('moveAndSetupCosts').value = 100000;
    $('reserveMonths').value = 3;
    $('monthlyHouseholdCosts').value = 35000;
    $('savedMoney').value = 1650000;
    run();
  });

  run();
})();
