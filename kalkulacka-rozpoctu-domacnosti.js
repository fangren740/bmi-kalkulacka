(function () {
  const ids = {
    scoreLabel: 'scoreLabel',
    scoreValue: 'scoreValue',
    remainingValue: 'remainingValue',
    resultSummary: 'resultSummary',
    totalIncome: 'totalIncome',
    totalExpenses: 'totalExpenses',
    fixedRatio: 'fixedRatio',
    reserveMonths: 'reserveMonths',
    nextStep: 'nextStep',
    insightTitle: 'insightTitle',
    insightText: 'insightText',
    insightBullets: 'insightBullets',
    heroRemaining: 'heroRemaining',
    heroStatus: 'heroStatus',
    breakdownList: 'breakdownList'
  };

  const $ = (id) => document.getElementById(id);
  const fmt = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const dec = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });
  const money = (value) => `${fmt.format(Math.round(value || 0))} Kč`;
  const num = (id) => Math.max(0, Number($(id)?.value || 0));
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const expenseMap = [
    ['housing', 'Bydlení'],
    ['utilities', 'Energie a služby'],
    ['food', 'Jídlo a drogerie'],
    ['transport', 'Doprava a auto'],
    ['kids', 'Děti a domácnost'],
    ['debt', 'Splátky'],
    ['insurance', 'Pojištění a zdraví'],
    ['otherExpenses', 'Ostatní a volný čas']
  ];
  const fixedIds = ['housing', 'utilities', 'debt', 'insurance'];

  function text(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function renderNextStep(copy) {
    const element = $(ids.nextStep);
    if (!element) return;
    const [label, ...rest] = copy.split(':');
    element.innerHTML = `<strong>${label}:</strong>${rest.length ? rest.join(':') : ''}`;
  }

  function getDecision(data) {
    const { score, remaining, remainingRatio, fixedRatio, reserveMonths } = data;

    if (score < 45 || remaining < 0) {
      return {
        label: 'Rizikový rozpočet',
        tone: 'risk',
        summary: remaining < 0
          ? 'Výdaje převyšují příjmy. Rozpočet potřebuje rychle snížit pravidelné náklady nebo navýšit příjem.'
          : 'Rozpočet má velmi malý polštář. Nečekaný výdaj může rychle způsobit problém.',
        next: 'Další krok: projděte největší položky, hlavně bydlení, energie a splátky. Nové závazky teď nedávají smysl.',
        title: 'Rozpočet je rizikový',
        text: 'Domácnost má příliš malý prostor po zaplacení nákladů. Prioritou je stabilizovat hotovostní tok a vytvořit alespoň minimální rezervu.',
        bullets: [
          'Snižte největší pravidelné položky.',
          'Odložte novou půjčku nebo dražší bydlení.',
          'Přepočítejte splátky a fixní náklady.'
        ]
      };
    }

    if (score < 70 || remainingRatio < 15 || fixedRatio > 50 || reserveMonths < 3) {
      return {
        label: 'Napjatý rozpočet',
        tone: 'warning',
        summary: 'Peníze vycházejí, ale rozpočet nemá velký prostor na chyby. Zaměřte se na rezervu, fixní výdaje a roční platby.',
        next: 'Další krok: nastavte měsíční odkládání rezervy a otestujte, co se stane při poklesu příjmu nebo vyšších nákladech.',
        title: 'Rozpočet je použitelný, ale napjatý',
        text: 'Příjmy výdaje pokryjí, jenže větší roční platba, oprava auta nebo doplatek energií může rozpočet rozhodit.',
        bullets: [
          'Zkuste snížit fixní náklady pod bezpečnější úroveň.',
          'Roční platby rozpočítejte do měsíčního průměru.',
          'Rezervu budujte automaticky hned po výplatě.'
        ]
      };
    }

    return {
      label: 'Zdravý rozpočet',
      tone: 'healthy',
      summary: 'Po běžných výdajích zůstává prostor na rezervu, nepravidelné platby i finanční cíle.',
      next: 'Další krok: ověřte, zda máte rezervu alespoň na 3 měsíce výdajů, a přebytek rozdělte mezi cíle.',
      title: 'Rozpočet má zdravou rezervu',
      text: 'Domácnost má po zaplacení běžných výdajů rozumný prostor. Dává smysl rezervu držet odděleně a pravidelně kontrolovat největší položky.',
      bullets: [
        'Držte rezervu alespoň 3 měsíce výdajů.',
        'Přebytek rozdělte mezi rezervu a cíle.',
        'Před hypotékou nebo půjčkou otestujte horší scénář.'
      ]
    };
  }

  function calculateScore(data) {
    let score = 100;
    if (data.remaining < 0) score -= 45;
    if (data.remainingRatio < 5) score -= 25;
    else if (data.remainingRatio < 12) score -= 14;
    else if (data.remainingRatio < 20) score -= 6;
    if (data.fixedRatio > 60) score -= 22;
    else if (data.fixedRatio > 50) score -= 14;
    else if (data.fixedRatio > 40) score -= 6;
    if (data.reserveMonths < 1) score -= 18;
    else if (data.reserveMonths < 3) score -= 10;
    else if (data.reserveMonths >= 6) score += 4;
    if (num('debt') > 0 && data.income && num('debt') / data.income > 0.15) score -= 10;
    return Math.round(clamp(score, 0, 100));
  }

  function updateHero(data, decision) {
    text(ids.heroRemaining, money(data.remaining));
    text(ids.heroStatus, decision.label.toLowerCase());

    const rows = document.querySelectorAll('.rv-budget-bars div');
    const heroItems = [
      ['Příjem', data.income, 100],
      ['Bydlení', num('housing'), data.income ? (num('housing') / data.income) * 100 : 0],
      ['Jídlo', num('food'), data.income ? (num('food') / data.income) * 100 : 0],
      ['Doprava', num('transport'), data.income ? (num('transport') / data.income) * 100 : 0]
    ];

    rows.forEach((row, index) => {
      const item = heroItems[index];
      if (!item) return;
      const [label, value, ratio] = item;
      const labelEl = row.querySelector('span');
      const barEl = row.querySelector('b');
      const valueEl = row.querySelector('em');
      if (labelEl) labelEl.textContent = label;
      if (barEl) barEl.style.width = `${clamp(Math.round(ratio), 4, 100)}%`;
      if (valueEl) valueEl.textContent = money(value);
    });

    const floating = document.querySelector('.rv-budget-floating strong');
    if (floating) {
      floating.textContent = `${dec.format(data.reserveMonths)} měsíce rezervy · fixní výdaje ${Math.round(data.fixedRatio)} %`;
    }
  }

  function renderBreakdown(data) {
    const list = $(ids.breakdownList);
    if (!list) return;
    const max = Math.max(...expenseMap.map(([id]) => num(id)), 1);
    list.innerHTML = expenseMap.map(([id, label]) => {
      const value = num(id);
      const width = Math.max(3, Math.round((value / max) * 100));
      const pct = data.income ? Math.round((value / data.income) * 100) : 0;
      return `<div class="rv-budget-breakdown-item"><span>${label}</span><b style="width:${width}%"></b><em>${money(value)} · ${pct}%</em></div>`;
    }).join('');
  }

  function calculate() {
    const income = num('incomeMain') + num('incomeSecond') + num('incomeOther');
    const savings = num('savings');
    const expenses = expenseMap.reduce((sum, [id]) => sum + num(id), 0);
    const remaining = income - expenses;
    const fixed = fixedIds.reduce((sum, id) => sum + num(id), 0);
    const data = {
      income,
      savings,
      expenses,
      remaining,
      fixedRatio: income ? (fixed / income) * 100 : 0,
      expenseRatio: income ? (expenses / income) * 100 : 100,
      reserveMonths: expenses ? savings / expenses : 0,
      remainingRatio: income ? (remaining / income) * 100 : -100
    };
    data.score = calculateScore(data);
    const decision = getDecision(data);

    text(ids.scoreLabel, decision.label);
    text(ids.scoreValue, `${data.score} / 100`);
    text(ids.remainingValue, money(remaining));
    text(ids.resultSummary, decision.summary);
    text(ids.totalIncome, money(income));
    text(ids.totalExpenses, money(expenses));
    text(ids.fixedRatio, `${Math.round(data.fixedRatio)} %`);
    text(ids.reserveMonths, `${dec.format(data.reserveMonths)} měsíce`);
    renderNextStep(decision.next);
    text(ids.insightTitle, decision.title);
    text(ids.insightText, decision.text);

    const bullets = $(ids.insightBullets);
    if (bullets) bullets.innerHTML = decision.bullets.map((item) => `<li>${item}</li>`).join('');

    document.querySelector('.rv-budget-result-card')?.setAttribute('data-tone', decision.tone);
    document.querySelector('.rv-budget-visual')?.setAttribute('data-tone', decision.tone);
    updateHero(data, decision);
    renderBreakdown(data);
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#budgetForm input').forEach((input) => input.addEventListener('input', calculate));
    $('calculateBudget')?.addEventListener('click', calculate);
    calculate();
  });
})();
