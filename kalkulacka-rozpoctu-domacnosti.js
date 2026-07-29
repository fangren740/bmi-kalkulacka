(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const form = $('budgetForm');
  if (!form) return;

  const state = { mode: 'basic', advancedInitialized: false };
  const nf0 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });
  const money = (value) => `${nf0.format(Math.round(Number.isFinite(value) ? value : 0))} Kč`;
  const percent = (value) => `${nf1.format(Number.isFinite(value) ? value : 0)} %`;
  const parseNumber = (input) => {
    const clean = String(input?.value ?? '').trim().replace(/\s+/g, '').replace(',', '.').replace(/[^0-9.+-]/g, '');
    const number = Number(clean);
    return Number.isFinite(number) ? number : NaN;
  };
  const setText = (id, value) => { const node = $(id); if (node) node.textContent = value; };
  const setWidth = (id, value) => { const node = $(id); if (node) node.style.width = `${Math.max(0, Math.min(100, value))}%`; };

  const ids = [
    'income','essential','flexible','annual','incomePrimary','incomeSecondary','incomeOther','housing','debt','insurance','food','transport','family',
    'flexibleAdvanced','annualAdvanced','currentReserve','reserveMonths','plannedSaving','incomeShock','expenseShock','cutFlexible','targetDate'
  ];

  function value(id) { return parseNumber($(id)); }

  function setError(id, message) {
    const input = $(id);
    const field = input?.closest('.field');
    if (field) field.classList.toggle('has-error', Boolean(message));
    const error = $(`${id}Error`);
    if (error) error.textContent = message || '';
  }

  function validateNonNegative(id, label, max = 1_000_000_000) {
    const number = value(id);
    const message = !Number.isFinite(number) || number < 0 || number > max ? `${label} musí být nezáporné číslo.` : '';
    setError(id, message);
    return message ? NaN : number;
  }

  function readBasic() {
    const income = validateNonNegative('income', 'Příjem');
    const essential = validateNonNegative('essential', 'Nezbytné výdaje');
    const flexible = validateNonNegative('flexible', 'Volitelné výdaje');
    const annual = validateNonNegative('annual', 'Roční výdaje');
    const valid = [income, essential, flexible, annual].every(Number.isFinite) && income > 0;
    if (Number.isFinite(income) && income <= 0) setError('income', 'Příjem musí být vyšší než 0 Kč.');
    return {
      valid,
      income,
      essential,
      flexible,
      annual,
      reserve: 180000,
      reserveMonths: 6,
      plannedSaving: 0,
      incomeShock: 10,
      expenseShock: 10,
      cutFlexible: 40,
      targetDate: 24,
      categories: [
        ['Nezbytné výdaje', essential],
        ['Volitelné výdaje', flexible],
        ['Roční platby / měsíc', annual / 12]
      ]
    };
  }

  function readAdvanced() {
    const primary = validateNonNegative('incomePrimary', 'Hlavní příjem');
    const secondary = validateNonNegative('incomeSecondary', 'Druhý příjem');
    const other = validateNonNegative('incomeOther', 'Další příjem');
    const housing = validateNonNegative('housing', 'Bydlení');
    const debt = validateNonNegative('debt', 'Splátky');
    const insurance = validateNonNegative('insurance', 'Pojištění');
    const food = validateNonNegative('food', 'Potraviny');
    const transport = validateNonNegative('transport', 'Doprava');
    const family = validateNonNegative('family', 'Péče');
    const flexible = validateNonNegative('flexibleAdvanced', 'Volitelné výdaje');
    const annual = validateNonNegative('annualAdvanced', 'Roční výdaje');
    const reserve = validateNonNegative('currentReserve', 'Rezerva');
    const plannedSaving = validateNonNegative('plannedSaving', 'Plánované spoření');
    const reserveMonths = value('reserveMonths');
    const incomeShock = value('incomeShock');
    const expenseShock = value('expenseShock');
    const cutFlexible = value('cutFlexible');
    const targetDate = value('targetDate');

    const ranged = [
      ['reserveMonths', reserveMonths, 1, 36, 'Cíl rezervy musí být od 1 do 36 měsíců.'],
      ['incomeShock', incomeShock, 0, 80, 'Pokles příjmu musí být od 0 do 80 %.'],
      ['expenseShock', expenseShock, 0, 100, 'Růst výdajů musí být od 0 do 100 %.'],
      ['cutFlexible', cutFlexible, 0, 100, 'Omezení volitelných výdajů musí být od 0 do 100 %.'],
      ['targetDate', targetDate, 1, 120, 'Termín musí být od 1 do 120 měsíců.']
    ];
    let rangeValid = true;
    ranged.forEach(([id, number, min, max, message]) => {
      const invalid = !Number.isFinite(number) || number < min || number > max;
      const field = $(id)?.closest('.field');
      if (field) field.classList.toggle('has-error', invalid);
      if (invalid) rangeValid = false;
      const err = $(`${id}Error`); if (err) err.textContent = invalid ? message : '';
    });

    const income = primary + secondary + other;
    const essential = housing + debt + insurance + food + transport + family;
    const numbers = [primary, secondary, other, housing, debt, insurance, food, transport, family, flexible, annual, reserve, plannedSaving];
    const valid = numbers.every(Number.isFinite) && rangeValid && income > 0;
    return {
      valid,
      income,
      essential,
      flexible,
      annual,
      reserve,
      reserveMonths,
      plannedSaving,
      incomeShock,
      expenseShock,
      cutFlexible,
      targetDate,
      categories: [
        ['Bydlení a energie', housing],
        ['Splátky a závazky', debt],
        ['Pojištění a služby', insurance],
        ['Potraviny a drogerie', food],
        ['Doprava', transport],
        ['Děti, zdraví a péče', family],
        ['Volitelné výdaje', flexible],
        ['Roční platby / měsíc', annual / 12]
      ]
    };
  }

  function syncBasicToAdvanced() {
    const income = Math.max(0, value('income'));
    const essential = Math.max(0, value('essential'));
    $('incomePrimary').value = Math.round(income * .76);
    $('incomeSecondary').value = Math.round(income * .24);
    $('incomeOther').value = 0;
    $('housing').value = Math.round(essential * .55);
    $('debt').value = Math.round(essential * .10);
    $('insurance').value = Math.round(essential * .06);
    $('food').value = Math.round(essential * .21);
    $('transport').value = Math.round(essential * .06);
    $('family').value = Math.max(0, essential - ['housing','debt','insurance','food','transport'].reduce((sum,id) => sum + value(id), 0));
    $('flexibleAdvanced').value = Math.max(0, value('flexible'));
    $('annualAdvanced').value = Math.max(0, value('annual'));
    state.advancedInitialized = true;
  }

  function syncAdvancedToBasic() {
    const data = readAdvanced();
    if (!data.valid) return;
    $('income').value = Math.round(data.income);
    $('essential').value = Math.round(data.essential);
    $('flexible').value = Math.round(data.flexible);
    $('annual').value = Math.round(data.annual);
  }

  function setMode(mode) {
    if (mode === 'advanced' && !state.advancedInitialized) syncBasicToAdvanced();
    if (mode === 'basic' && state.mode === 'advanced') syncAdvancedToBasic();
    state.mode = mode;
    document.querySelectorAll('[data-mode]').forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('advancedPanel').hidden = mode !== 'advanced';
    $('basicPanel').hidden = mode === 'advanced';
    $('basicAssumptions').hidden = mode === 'advanced';
    setText('modeDescription', mode === 'advanced'
      ? 'Pokročilý režim nahrazuje souhrny jednotlivými kategoriemi a přidává vlastní rezervu, plánované spoření a stresové předpoklady.'
      : 'Základní režim pracuje se čtyřmi souhrnnými částkami a ukáže hlavní výsledek bez formulářové stěny.');
    calculate();
  }

  function classify(data, metrics) {
    const { balance, savingsRate, runway, stress } = metrics;
    if (balance < 0) return {
      type: 'danger', badge: 'Rozpočet je v deficitu', title: 'Běžný měsíc spotřebovává úspory',
      text: 'Nejdříve zastavte pravidelný schodek. Rozdělte výdaje podle nutnosti a zaměřte se na největší opakované položky.'
    };
    if (stress < 0) return {
      type: 'warning', badge: 'Kladný, ale křehký', title: 'Stress test převrací rozpočet do mínusu',
      text: 'Základní měsíc funguje, ale kombinace nižšího příjmu a vyšších nezbytných výdajů by vyžadovala čerpání rezervy.'
    };
    if (savingsRate < 5) return {
      type: 'warning', badge: 'Těsný rozpočet', title: 'Malý výkyv může spotřebovat celý přebytek',
      text: 'Bilance je kladná, ale prostor je omezený. Roční platby a tvorbu rezervy držte jako pravidelnou součást rozpočtu.'
    };
    if (runway < 3) return {
      type: 'warning', badge: 'Budujte rezervu', title: 'Přebytek existuje, likvidní polštář je zatím nízký',
      text: 'Část přebytku směřujte do rychle dostupné rezervy, dokud nepokryje zvolený počet měsíců nezbytných výdajů.'
    };
    return {
      type: 'safe', badge: 'Stabilnější rozpočet', title: 'Základ i stress test zůstávají kladné',
      text: 'Rozpočet vytváří prostor pro rezervu a cíle. Pravidelně jej porovnávejte se skutečností a nepovažujte volný prostor automaticky za peníze ke spotřebě.'
    };
  }

  function scenarioCard(label, title, income, essential, flexible, irregular, current = false) {
    const total = essential + flexible + irregular;
    const balance = income - total;
    const article = document.createElement('article');
    article.className = `scenario-card${current ? ' is-current' : ''}${balance < 0 ? ' is-negative' : ''}`;
    const badge = document.createElement('span'); badge.textContent = label;
    const heading = document.createElement('h3'); heading.textContent = title;
    const strong = document.createElement('strong'); strong.textContent = money(balance);
    const dl = document.createElement('dl');
    [['Příjem', income], ['Nezbytné', essential], ['Volitelné', flexible], ['Výdaje celkem', total]].forEach(([name, amount]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt'); dt.textContent = name;
      const dd = document.createElement('dd'); dd.textContent = money(amount);
      row.append(dt, dd); dl.append(row);
    });
    const p = document.createElement('p');
    p.textContent = balance >= 0 ? 'Scénář zůstává kladný bez nutnosti čerpat rezervu.' : `Každý měsíc by bylo nutné doplnit ${money(Math.abs(balance))} z rezervy nebo změnou výdajů.`;
    article.append(badge, heading, strong, dl, p);
    return article;
  }

  function renderScenarios(data, irregular) {
    const grid = $('scenarioGrid');
    grid.replaceChildren();
    const incomeDown = data.income * (1 - data.incomeShock / 100);
    const essentialUp = data.essential * (1 + data.expenseShock / 100);
    const flexibleCut = data.flexible * (1 - data.cutFlexible / 100);
    grid.append(
      scenarioCard('Základ', 'Současný plán', data.income, data.essential, data.flexible, irregular, true),
      scenarioCard(`−${nf1.format(data.incomeShock)} % příjmu`, 'Příjmový výpadek', incomeDown, data.essential, data.flexible, irregular),
      scenarioCard(`+${nf1.format(data.expenseShock)} % nutných výdajů`, 'Zdražení provozu', data.income, essentialUp, data.flexible, irregular),
      scenarioCard('Kombinace', 'Stress test s reakcí domácnosti', incomeDown, essentialUp, flexibleCut, irregular)
    );
  }

  function calculate() {
    const data = state.mode === 'advanced' ? readAdvanced() : readBasic();
    if (!data.valid) {
      ['balanceResult','savingsRateResult','essentialShareResult','runwayResult','reserveGapResult','afterSavingResult','annualBalanceResult','stressResult'].forEach((id) => setText(id, '—'));
      setText('resultSentence', 'Opravte označené vstupy, aby bylo možné rozpočet bezpečně spočítat.');
      return;
    }

    const irregular = data.annual / 12;
    const expenses = data.essential + data.flexible + irregular;
    const balance = data.income - expenses;
    const savingsRate = data.income > 0 ? balance / data.income * 100 : 0;
    const essentialShare = data.income > 0 ? data.essential / data.income * 100 : 0;
    const runway = data.essential > 0 ? data.reserve / data.essential : Infinity;
    const reserveTarget = data.essential * data.reserveMonths;
    const reserveGap = Math.max(0, reserveTarget - data.reserve);
    const afterSaving = balance - data.plannedSaving;
    const annualBalance = balance * 12;
    const incomeDown = data.income * (1 - data.incomeShock / 100);
    const essentialUp = data.essential * (1 + data.expenseShock / 100);
    const flexibleCut = data.flexible * (1 - data.cutFlexible / 100);
    const stress = incomeDown - essentialUp - flexibleCut - irregular;
    const monthlyNeededForTarget = reserveGap > 0 ? reserveGap / data.targetDate : 0;
    const classification = classify(data, { balance, savingsRate, runway, stress });

    setText('balanceResult', money(balance));
    setText('resultSentence', balance >= 0
      ? `Po započtení ${money(irregular)} měsíčně na roční platby domácnosti zbývá ${money(balance)}.`
      : `Po započtení všech modelovaných výdajů domácnosti každý měsíc chybí ${money(Math.abs(balance))}.`);
    setText('savingsRateResult', percent(savingsRate));
    setText('essentialShareResult', percent(essentialShare));
    setText('runwayResult', Number.isFinite(runway) ? `${nf1.format(runway)} měs.` : 'Bez nutných výdajů');
    setText('reserveGapResult', reserveGap > 0 ? money(reserveGap) : 'Cíl pokryt');
    setText('reserveGapNote', reserveGap > 0 ? `Pro termín ${nf0.format(data.targetDate)} měs. odkládat ${money(monthlyNeededForTarget)}` : 'Současná rezerva dosahuje zvoleného cíle');
    setText('afterSavingResult', money(afterSaving));
    setText('annualBalanceResult', money(annualBalance));
    setText('decisionLabel', classification.badge);
    setText('decisionTitle', classification.title);
    setText('decisionText', classification.text);
    $('decisionCard').className = `decision-card${classification.type === 'warning' ? ' is-warning' : classification.type === 'danger' ? ' is-danger' : ''}`;
    setText('stressResult', money(stress));
    setText('stressText', stress >= 0
      ? 'Po poklesu příjmu, růstu nezbytných výdajů a omezení části volitelné spotřeby zůstává rozpočet kladný.'
      : `Kombinovaný scénář vytváří schodek ${money(Math.abs(stress))} měsíčně a vyžaduje rezervu nebo větší změnu výdajů.`);

    const essentialPer100 = data.income ? Math.max(0, data.essential / data.income * 100) : 0;
    const flexiblePer100 = data.income ? Math.max(0, data.flexible / data.income * 100) : 0;
    const irregularPer100 = data.income ? Math.max(0, irregular / data.income * 100) : 0;
    const surplusPer100 = Math.max(0, 100 - essentialPer100 - flexiblePer100 - irregularPer100);
    const totalBar = Math.max(100, essentialPer100 + flexiblePer100 + irregularPer100);
    setWidth('barEssential', essentialPer100 / totalBar * 100);
    setWidth('barFlexible', flexiblePer100 / totalBar * 100);
    setWidth('barIrregular', irregularPer100 / totalBar * 100);
    setWidth('barSurplus', surplusPer100 / totalBar * 100);
    setText('legendEssential', `${nf0.format(essentialPer100)} Kč`);
    setText('legendFlexible', `${nf0.format(flexiblePer100)} Kč`);
    setText('legendIrregular', `${nf0.format(irregularPer100)} Kč`);
    setText('legendSurplus', `${nf0.format(surplusPer100)} Kč`);

    setText('heroBalance', money(balance));
    setText('heroStatus', classification.badge);
    setText('heroIncome', money(data.income));
    setText('heroExpenses', money(expenses));
    setText('heroSavingsRate', percent(savingsRate));
    setText('heroRunway', Number.isFinite(runway) ? `${nf1.format(runway)} měs.` : '—');
    setText('heroStress', money(stress));
    setText('heroNote', stress >= 0 ? 'Základní plán i kombinovaný stress test zůstávají kladné.' : 'Základ může být kladný, ale kombinovaný stress test potřebuje rezervu.');
    const expenseShare = data.income > 0 ? Math.min(100, expenses / data.income * 100) : 100;
    setWidth('heroExpenseBar', expenseShare);
    setWidth('heroSurplusBar', Math.max(0, 100 - expenseShare));
    setText('resultBadge', state.mode === 'advanced' ? 'Pokročilý model' : 'Rychlý model');
    setText('savingsRateNote', data.plannedSaving > 0 ? `Plánované spoření ${money(data.plannedSaving)}` : 'Před plánovaným spořením');

    renderScenarios(data, irregular);
  }

  const presets = {
    single: { income: 42000, essential: 25500, flexible: 6500, annual: 18000, reserve: 90000 },
    couple: { income: 72000, essential: 43000, flexible: 11000, annual: 24000, reserve: 180000 },
    family: { income: 92000, essential: 59500, flexible: 13000, annual: 42000, reserve: 220000 }
  };

  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    $('income').value = preset.income;
    $('essential').value = preset.essential;
    $('flexible').value = preset.flexible;
    $('annual').value = preset.annual;
    $('currentReserve').value = preset.reserve;
    state.advancedInitialized = false;
    if (state.mode === 'advanced') syncBasicToAdvanced();
    calculate();
  }

  function reset() {
    form.reset();
    state.advancedInitialized = false;
    setMode('basic');
  }

  async function copyResult() {
    const text = `Rozpočet domácnosti: měsíční bilance ${$('balanceResult').textContent}, míra úspor ${$('savingsRateResult').textContent}, rezerva ${$('runwayResult').textContent}, kombinovaný stress test ${$('stressResult').textContent}.`;
    try {
      await navigator.clipboard.writeText(text);
      $('copyResult').textContent = 'Zkopírováno';
      setTimeout(() => { $('copyResult').textContent = 'Kopírovat shrnutí výsledku'; }, 1500);
    } catch {
      $('copyResult').textContent = 'Kopírování selhalo';
    }
  }

  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  document.querySelectorAll('[data-open-advanced]').forEach((button) => button.addEventListener('click', () => setMode('advanced')));
  document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
  ids.forEach((id) => $(id)?.addEventListener('input', calculate));
  form.addEventListener('submit', (event) => { event.preventDefault(); calculate(); $('vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('resetButton').addEventListener('click', reset);
  $('copyResult').addEventListener('click', copyResult);

  const backToTop = $('backToTop');
  const toggleBack = () => backToTop.classList.toggle('is-visible', window.scrollY > 650);
  window.addEventListener('scroll', toggleBack, { passive: true });
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  calculate();
})();
