(() => {
  'use strict';

  const form = document.getElementById('tcoForm');
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const ids = [
    'carPrice','ownershipYears','annualKm','resalePrice','monthlyRunningCost',
    'energyType','consumption','unitPrice','insuranceMonthly','serviceMonthly',
    'tiresMonthly','parkingMonthly','annualFees','otherMonthly','downPayment',
    'loanPayment','loanPayments','financeFee','balloonPayment','monthlyIncome',
    'otherObligations','targetShare','cashReserve','comparePurchase',
    'compareResale','compareMonthlyRunning'
  ];
  const fields = Object.fromEntries(ids.map((id) => [id, $(id)]));
  const useBreakdown = $('useBreakdown');
  const includeFinancing = $('includeFinancing');
  const compareEnabled = $('compareEnabled');
  const proSettings = $('proSettings');
  const result = $('vysledek');
  const presets = [...document.querySelectorAll('[data-preset]')];
  const money = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const decimal = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const number = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });

  const presetData = {
    family: { carPrice: 720000, ownershipYears: 5, annualKm: 18000, resalePrice: 330000, monthlyRunningCost: 8500 },
    used: { carPrice: 350000, ownershipYears: 5, annualKm: 15000, resalePrice: 170000, monthlyRunningCost: 7000 },
    small: { carPrice: 450000, ownershipYears: 7, annualKm: 12000, resalePrice: 160000, monthlyRunningCost: 6000 }
  };

  const defaultAdvanced = {
    energyType: 'fuel', consumption: 6.7, unitPrice: 38.5, insuranceMonthly: 1800,
    serviceMonthly: 1400, tiresMonthly: 450, parkingMonthly: 900, annualFees: 2640,
    otherMonthly: 300, downPayment: 200000, loanPayment: 9500, loanPayments: 60,
    financeFee: 0, balloonPayment: 0, monthlyIncome: 55000, otherObligations: 5000,
    targetShare: 25, cashReserve: 180000, comparePurchase: 550000,
    compareResale: 250000, compareMonthlyRunning: 6500
  };

  const n = (field) => {
    const value = Number.parseFloat(field?.value);
    return Number.isFinite(value) ? value : 0;
  };
  const fmtMoney = (value) => `${money.format(Math.round(value))} Kč`;
  const fmtKm = (value) => `${money.format(Math.round(value))} km`;
  const fmtPercent = (value) => `${number.format(Math.max(0, value))} %`;
  const setText = (id, value) => { const node = $(id); if (node) node.textContent = value; };
  const setWidth = (id, value) => { const node = $(id); if (node) node.style.width = `${Math.max(0, Math.min(100, value))}%`; };

  function getValues() {
    return Object.fromEntries(ids.map((id) => [id, n(fields[id])]));
  }

  function validate(v) {
    if (v.carPrice < 10000) return 'Zadejte kupní cenu auta alespoň 10 000 Kč.';
    if (v.ownershipYears <= 0) return 'Zvolte dobu vlastnictví.';
    if (v.annualKm < 500) return 'Roční nájezd musí být alespoň 500 km.';
    if (v.resalePrice < 0 || v.resalePrice > v.carPrice) return 'Prodejní cena musí být mezi nulou a kupní cenou auta.';
    if (v.monthlyRunningCost < 0) return 'Měsíční provoz nesmí být záporný.';
    if (useBreakdown.checked) {
      const breakdownValues = ['consumption','unitPrice','insuranceMonthly','serviceMonthly','tiresMonthly','parkingMonthly','annualFees','otherMonthly'];
      if (breakdownValues.some((id) => v[id] < 0)) return 'Provozní položky nesmějí být záporné.';
    }
    if (includeFinancing.checked) {
      const financeValues = ['downPayment','loanPayment','loanPayments','financeFee','balloonPayment'];
      if (financeValues.some((id) => v[id] < 0)) return 'Položky financování nesmějí být záporné.';
      if (v.loanPayments > v.ownershipYears * 12) return 'Počet započtených splátek přesahuje dobu vlastnictví. Zadejte jen splátky do prodeje a zbývající dluh vložte jako konečný doplatek.';
      const payments = v.downPayment + v.loanPayment * v.loanPayments + v.financeFee + v.balloonPayment;
      if (payments + 1 < v.carPrice) return 'Úplné pořizovací platby jsou nižší než cena auta. Doplňte chybějící splátky nebo konečný doplatek.';
    }
    if (compareEnabled.checked) {
      if (v.comparePurchase < 0 || v.compareResale < 0 || v.compareMonthlyRunning < 0) return 'Hodnoty auta B nesmějí být záporné.';
      if (v.compareResale > v.comparePurchase) return 'Prodejní hodnota auta B nemůže být vyšší než jeho pořizovací platby.';
    }
    return '';
  }

  function calculate(v) {
    const months = v.ownershipYears * 12;
    const totalKm = v.annualKm * v.ownershipYears;
    const depreciation = v.carPrice - v.resalePrice;
    const runningItems = [];
    let runningTotal = 0;

    if (useBreakdown.checked) {
      const energyTotal = fields.energyType.value === 'none' ? 0 : (totalKm / 100) * v.consumption * v.unitPrice;
      const items = [
        ['Palivo nebo elektřina', energyTotal],
        ['Pojištění', v.insuranceMonthly * months],
        ['Servis a opravy', v.serviceMonthly * months],
        ['Pneumatiky', v.tiresMonthly * months],
        ['Parkování a garáž', v.parkingMonthly * months],
        ['Roční poplatky', v.annualFees * v.ownershipYears],
        ['Ostatní výdaje', v.otherMonthly * months]
      ];
      items.forEach(([label, total]) => {
        if (total > 0) runningItems.push({ label, total, monthly: total / months });
        runningTotal += total;
      });
    } else {
      runningTotal = v.monthlyRunningCost * months;
      runningItems.push({ label: 'Provozní náklady celkem', total: runningTotal, monthly: v.monthlyRunningCost });
    }

    let purchasePayments = v.carPrice;
    if (includeFinancing.checked) {
      purchasePayments = v.downPayment + v.loanPayment * v.loanPayments + v.financeFee + v.balloonPayment;
    }
    const financePremium = Math.max(0, purchasePayments - v.carPrice);
    const totalTco = depreciation + runningTotal + financePremium;
    const monthlyTco = totalTco / months;
    const costPerKm = totalTco / totalKm;
    const monthlyCash = (purchasePayments + runningTotal) / months;
    const budgetCommitment = monthlyCash + v.otherObligations;
    const budgetShare = v.monthlyIncome > 0 ? budgetCommitment / v.monthlyIncome * 100 : 0;
    const neededIncome = v.targetShare > 0 ? budgetCommitment / (v.targetShare / 100) : 0;
    const shares = {
      depreciation: totalTco > 0 ? depreciation / totalTco * 100 : 0,
      running: totalTco > 0 ? runningTotal / totalTco * 100 : 0,
      finance: totalTco > 0 ? financePremium / totalTco * 100 : 0
    };
    const categories = [
      { label: 'ztráta hodnoty', value: depreciation },
      { label: 'provoz', value: runningTotal },
      { label: 'financování', value: financePremium }
    ];
    const largest = categories.sort((a, b) => b.value - a.value)[0];
    const comparisonB = compareEnabled.checked
      ? v.comparePurchase - v.compareResale + v.compareMonthlyRunning * months
      : null;

    return {
      ...v, months, totalKm, depreciation, runningItems, runningTotal, purchasePayments,
      financePremium, totalTco, monthlyTco, costPerKm, monthlyCash, budgetCommitment,
      budgetShare, neededIncome, shares, largest, comparisonB
    };
  }

  function addTableRow(body, cells) {
    const tr = document.createElement('tr');
    cells.forEach(({ label, value }) => {
      const td = document.createElement('td');
      td.dataset.label = label;
      td.textContent = value;
      tr.appendChild(td);
    });
    body.appendChild(tr);
  }

  function renderBreakdown(c) {
    const body = $('breakdownBody');
    body.replaceChildren();
    const rows = [
      { label: 'Ztráta hodnoty', monthly: c.depreciation / c.months, total: c.depreciation },
      ...c.runningItems,
      ...(c.financePremium > 0 ? [{ label: 'Financování navíc', monthly: c.financePremium / c.months, total: c.financePremium }] : [])
    ];
    rows.forEach((row) => addTableRow(body, [
      { label: 'Položka', value: row.label },
      { label: 'Za měsíc', value: fmtMoney(row.monthly) },
      { label: 'Za období', value: fmtMoney(row.total) },
      { label: 'Podíl TCO', value: fmtPercent(c.totalTco > 0 ? row.total / c.totalTco * 100 : 0) }
    ]));
  }

  function renderLedger(c) {
    const body = $('ledgerBody');
    body.replaceChildren();
    for (let year = 1; year <= c.ownershipYears; year += 1) {
      const progress = year / c.ownershipYears;
      const modelValue = c.carPrice - c.depreciation * progress;
      const running = c.runningTotal * progress;
      const cumulativeTco = c.depreciation * progress + running + c.financePremium * progress;
      addTableRow(body, [
        { label: 'Rok', value: `${year}. rok` },
        { label: 'Nájezd celkem', value: fmtKm(c.annualKm * year) },
        { label: 'Modelová hodnota auta', value: fmtMoney(modelValue) },
        { label: 'Provoz kumulativně', value: fmtMoney(running) },
        { label: 'TCO kumulativně', value: fmtMoney(cumulativeTco) }
      ]);
    }
  }

  function renderDecision(c, advancedActive) {
    const panel = $('decisionPanel');
    panel.classList.remove('is-warning');
    let title = 'Náklad není totéž co splátka';
    let text = 'Rozpočet musí zvládnout platby dříve, než jednou získáte peníze z prodeje.';

    if (advancedActive && c.monthlyIncome > 0 && c.budgetShare > c.targetShare) {
      panel.classList.add('is-warning');
      title = 'Zadaný rozpočet překračuje kontrolní podíl';
      text = `Auto a ostatní závazky využívají ${fmtPercent(c.budgetShare)} příjmu. Pro limit ${fmtPercent(c.targetShare)} by orientačně vycházel příjem ${fmtMoney(c.neededIncome)}.`;
    } else if (advancedActive && c.cashReserve < c.monthlyCash * 3) {
      panel.classList.add('is-warning');
      title = 'Rezerva nepokrývá tři průměrné měsíce auta';
      text = `Zadaná rezerva ${fmtMoney(c.cashReserve)} je nižší než trojnásobek průměrného cash flow ${fmtMoney(c.monthlyCash * 3)}.`;
    } else if (advancedActive && c.financePremium > c.carPrice * .2) {
      panel.classList.add('is-warning');
      title = 'Financování přidává výraznou část ceny';
      text = `Náklad financování navíc činí ${fmtMoney(c.financePremium)}. Ověřte RPSN, poplatky a konečný doplatek ve smlouvě.`;
    } else if (c.depreciation > c.carPrice * .7) {
      panel.classList.add('is-warning');
      title = 'Výsledek silně závisí na budoucí prodejní ceně';
      text = 'Zadaný pokles hodnoty přesahuje 70 % kupní ceny. Přepočítejte i druhý scénář prodeje.';
    }
    panel.querySelector('strong').textContent = title;
    panel.querySelector('p').textContent = text;
  }

  function renderComparison(c) {
    const panel = $('compareResult');
    if (c.comparisonB === null) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const difference = Math.abs(c.totalTco - c.comparisonB);
    const winner = c.totalTco < c.comparisonB ? 'Auto A má nižší TCO' : c.comparisonB < c.totalTco ? 'Auto B má nižší TCO' : 'Obě auta mají stejné TCO';
    setText('compareWinner', winner);
    setText('compareATotal', fmtMoney(c.totalTco));
    setText('compareBTotal', fmtMoney(c.comparisonB));
    setText('compareDifference', `Rozdíl: ${fmtMoney(difference)} za stejné období`);
  }

  function renderInvalid(message) {
    setText('totalTco', '—');
    setText('resultStatus', message);
    const panel = $('decisionPanel');
    panel.classList.add('is-warning');
    panel.querySelector('strong').textContent = 'Výpočet čeká na opravu zadání';
    panel.querySelector('p').textContent = message;
  }

  function render(c) {
    const advancedActive = proSettings.open || useBreakdown.checked || includeFinancing.checked || compareEnabled.checked;
    setText('modeBadge', advancedActive ? 'PRO režim' : 'Základní režim');
    setText('totalTco', fmtMoney(c.totalTco));
    setText('resultStatus', 'Výpočet připraven');
    setText('resultPeriod', `${number.format(c.ownershipYears)} let · ${fmtKm(c.totalKm)}`);
    setText('depreciationResult', fmtMoney(c.depreciation));
    setText('runningResult', fmtMoney(c.runningTotal));
    setText('financePremiumResult', fmtMoney(c.financePremium));
    setText('monthlyTco', fmtMoney(c.monthlyTco));
    setText('costPerKm', `${decimal.format(c.costPerKm)} Kč`);
    setText('monthlyCash', fmtMoney(c.monthlyCash));
    setText('purchasePaymentsResult', fmtMoney(c.purchasePayments));
    setText('resaleResult', fmtMoney(c.resalePrice));
    setText('totalKmResult', fmtKm(c.totalKm));
    setWidth('depreciationBar', c.shares.depreciation);
    setWidth('runningBar', c.shares.running);
    setWidth('financeBar', c.shares.finance);
    setText('depreciationShare', fmtPercent(c.shares.depreciation));
    setText('runningShare', fmtPercent(c.shares.running));
    setText('financeShare', fmtPercent(c.shares.finance));

    const budgetPanel = $('budgetPanel');
    budgetPanel.hidden = !(advancedActive && c.monthlyIncome > 0);
    if (!budgetPanel.hidden) {
      setText('budgetUse', fmtPercent(c.budgetShare));
      setWidth('budgetBar', c.budgetShare);
      setText('budgetText', `Průměrný cash flow auta a ostatní závazky činí ${fmtMoney(c.budgetCommitment)} měsíčně. Zvolený kontrolní podíl je ${fmtPercent(c.targetShare)}.`);
    }
    renderDecision(c, advancedActive);
    renderComparison(c);

    setText('detailHeadline', `${c.largest.label.charAt(0).toUpperCase()}${c.largest.label.slice(1)} je největší částí modelovaného TCO.`);
    setText('detailText', `Největší kategorie tvoří ${fmtMoney(c.largest.value)}. Změňte její hlavní předpoklad a sledujte, zda se rozhodnutí otočí.`);
    setText('resaleDropCheck', fmtPercent(c.depreciation / c.carPrice * 100));
    setText('monthlyRunningCheck', fmtMoney(c.runningTotal / c.months));
    setText('financePremiumCheck', fmtMoney(c.financePremium));
    setText('neededIncomeCheck', c.monthlyIncome > 0 ? fmtMoney(c.neededIncome) : 'nezadáno');
    setText('cashflowRule', c.monthlyCash > c.monthlyTco ? 'Rozpočet musí průběžně unést více než měsíční TCO' : 'Cash flow a TCO jsou v tomto modelu velmi blízko');
    setText('cashflowText', `TCO činí ${fmtMoney(c.monthlyTco)} měsíčně, ale průměrný peněžní požadavek před budoucím prodejem je ${fmtMoney(c.monthlyCash)}.`);

    setText('heroPurchase', fmtMoney(c.purchasePayments));
    setText('heroResale', fmtMoney(c.resalePrice));
    setText('heroMonthly', fmtMoney(c.monthlyTco));
    setText('heroPerKm', `${decimal.format(c.costPerKm)} Kč/km`);
    setText('heroPeriod', `${number.format(c.ownershipYears)} let / ${fmtKm(c.totalKm)}`);
    setText('heroTotal', fmtMoney(c.totalTco));
    setText('heroLargest', c.largest.label);

    renderBreakdown(c);
    renderLedger(c);
    form.dataset.valid = 'true';
    form._lastCalculation = c;
  }

  function update() {
    const values = getValues();
    const error = validate(values);
    if (error) {
      form.dataset.valid = 'false';
      form._lastCalculation = null;
      renderInvalid(error);
      return null;
    }
    const calculation = calculate(values);
    render(calculation);
    return calculation;
  }

  function updateEnergyFields() {
    const type = fields.energyType.value;
    const disabled = type === 'none';
    fields.consumption.disabled = disabled;
    fields.unitPrice.disabled = disabled;
    setText('consumptionUnit', type === 'electric' ? 'kWh/100 km' : 'l/100 km');
    setText('unitPriceUnit', type === 'electric' ? 'Kč/kWh' : 'Kč/l');
  }

  function setPreset(name) {
    const data = presetData[name];
    if (!data) return;
    Object.entries(data).forEach(([id, value]) => { fields[id].value = value; });
    useBreakdown.checked = false;
    includeFinancing.checked = false;
    compareEnabled.checked = false;
    $('breakdownFields').hidden = true;
    $('financingFields').hidden = true;
    $('compareFields').hidden = true;
    presets.forEach((button) => button.classList.toggle('is-active', button.dataset.preset === name));
    update();
  }

  function resetAll() {
    setPreset('family');
    Object.entries(defaultAdvanced).forEach(([id, value]) => { fields[id].value = value; });
    fields.energyType.value = 'fuel';
    proSettings.open = false;
    updateEnergyFields();
    update();
  }

  fields.energyType.addEventListener('change', () => {
    if (fields.energyType.value === 'electric' && n(fields.consumption) === 6.7 && n(fields.unitPrice) === 38.5) {
      fields.consumption.value = 18;
      fields.unitPrice.value = 6;
    } else if (fields.energyType.value === 'fuel' && n(fields.consumption) === 18 && n(fields.unitPrice) === 6) {
      fields.consumption.value = 6.7;
      fields.unitPrice.value = 38.5;
    }
    updateEnergyFields();
    update();
  });

  [
    [useBreakdown, $('breakdownFields')],
    [includeFinancing, $('financingFields')],
    [compareEnabled, $('compareFields')]
  ].forEach(([switchNode, panel]) => {
    switchNode.addEventListener('change', () => {
      panel.hidden = !switchNode.checked;
      update();
    });
  });

  ids.forEach((id) => {
    fields[id].addEventListener('input', () => {
      presets.forEach((button) => button.classList.remove('is-active'));
      update();
    });
    fields[id].addEventListener('change', update);
  });
  proSettings.addEventListener('toggle', update);
  presets.forEach((button) => button.addEventListener('click', () => setPreset(button.dataset.preset)));
  $('resetBtn').addEventListener('click', resetAll);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const calculation = update();
    if (calculation && window.matchMedia('(max-width: 920px)').matches) {
      result.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  $('copyResult').addEventListener('click', async (event) => {
    const c = form._lastCalculation;
    if (!c) return;
    const text = `TCO auta: ${fmtMoney(c.totalTco)} za ${number.format(c.ownershipYears)} let (${fmtMoney(c.monthlyTco)} měsíčně, ${decimal.format(c.costPerKm)} Kč/km). Ztráta hodnoty ${fmtMoney(c.depreciation)}, provoz ${fmtMoney(c.runningTotal)}, financování navíc ${fmtMoney(c.financePremium)}.`;
    try {
      await navigator.clipboard.writeText(text);
      event.currentTarget.textContent = 'Výsledek zkopírován';
      setTimeout(() => { event.currentTarget.textContent = 'Kopírovat výsledek'; }, 1800);
    } catch {
      event.currentTarget.textContent = 'Kopírování není dostupné';
      setTimeout(() => { event.currentTarget.textContent = 'Kopírovat výsledek'; }, 1800);
    }
  });

  updateEnergyFields();
  update();
})();
