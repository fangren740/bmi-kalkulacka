(() => {
  'use strict';

  const RATES = {
    current: { label: 'Do 30. 9. 2026', single: 4860, first: 4470, adult: 4040, childOld: 3490, childMid: 3050, childYoung: 2480 },
    future:  { label: 'Od 1. 10. 2026', single: 5500, first: 5000, adult: 3750, childOld: 3490, childMid: 3050, childYoung: 2480 }
  };

  const TYPES = {
    adult: { label: 'Dospělý / jiná osoba', short: 'Dospělá osoba', rank: 4, rateKey: 'adult', barClass: 'type-adult' },
    childOld: { label: 'Nezaopatřené dítě 15–26 let', short: 'Dítě 15–26 let', rank: 3, rateKey: 'childOld', barClass: 'type-child-old' },
    childMid: { label: 'Nezaopatřené dítě 6–15 let', short: 'Dítě 6–15 let', rank: 2, rateKey: 'childMid', barClass: 'type-child-mid' },
    childYoung: { label: 'Nezaopatřené dítě do 6 let', short: 'Dítě do 6 let', rank: 1, rateKey: 'childYoung', barClass: 'type-child-young' }
  };

  const PRESETS = {
    single: ['adult'],
    couple: ['adult', 'adult'],
    'parent-child': ['adult', 'childYoung'],
    family: ['adult', 'adult', 'childMid', 'childOld']
  };

  const MAX_PEOPLE = 20;
  let people = [...PRESETS.single];
  let activePeriod = isFutureEffective() ? 'future' : 'current';
  let activeMode = 'basic';

  const $ = id => document.getElementById(id);
  const els = {
    form: $('minimumForm'),
    list: $('memberList'),
    add: $('addPerson'),
    reset: $('resetCalculator'),
    modeButtons: [...document.querySelectorAll('[data-mode]')],
    modePanels: [...document.querySelectorAll('[data-panel]')],
    periodButtons: [...document.querySelectorAll('[data-period]')],
    presetButtons: [...document.querySelectorAll('[data-preset]')],
    basicAdults: $('basicAdults'),
    basicYoung: $('basicYoung'),
    basicMid: $('basicMid'),
    basicOld: $('basicOld'),
    currentBadge: $('currentPeriodBadge'),
    futureBadge: $('futurePeriodBadge'),
    status: $('resultStatus'),
    mainPeriod: $('mainPeriod'),
    mainTotal: $('mainTotal'),
    mainInterpretation: $('mainInterpretation'),
    currentTotal: $('currentTotal'),
    futureTotal: $('futureTotal'),
    delta: $('futureDelta'),
    deltaPct: $('futureDeltaPct'),
    breakdownCount: $('breakdownCount'),
    stack: $('resultStack'),
    breakdown: $('breakdownList'),
    income: $('monthlyIncome'),
    incomeResult: $('incomeResult'),
    incomeGap: $('incomeGap'),
    incomeText: $('incomeText'),
    menu: $('menuToggle'),
    nav: $('mainNav')
  };

  function isFutureEffective() {
    const now = new Date();
    const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return local >= new Date(2026, 9, 1);
  }

  function money(value) {
    return `${Math.round(value).toLocaleString('cs-CZ')} Kč`;
  }

  function signedMoney(value) {
    if (value === 0) return 'beze změny';
    return `${value > 0 ? '+' : '−'}${Math.abs(Math.round(value)).toLocaleString('cs-CZ')} Kč`;
  }

  function pct(value) {
    if (!Number.isFinite(value) || value === 0) return '0 %';
    const sign = value > 0 ? '+' : '−';
    return `${sign}${Math.abs(value).toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
  }

  function pluralPeople(count) {
    if (count === 1) return '1 osoba';
    if (count >= 2 && count <= 4) return `${count} osoby`;
    return `${count} osob`;
  }

  function clampCount(value) {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : 0;
  }

  function countsFromPeople() {
    return people.reduce((acc, type) => {
      if (type === 'adult') acc.adult += 1;
      if (type === 'childYoung') acc.childYoung += 1;
      if (type === 'childMid') acc.childMid += 1;
      if (type === 'childOld') acc.childOld += 1;
      return acc;
    }, { adult: 0, childYoung: 0, childMid: 0, childOld: 0 });
  }

  function peopleFromCounts() {
    const counts = {
      adult: Math.max(1, clampCount(els.basicAdults.value)),
      childYoung: clampCount(els.basicYoung.value),
      childMid: clampCount(els.basicMid.value),
      childOld: clampCount(els.basicOld.value)
    };
    let next = [];
    Object.entries(counts).forEach(([type, count]) => {
      next.push(...Array(count).fill(type));
    });
    if (next.length > MAX_PEOPLE) next = next.slice(0, MAX_PEOPLE);
    people = next;
    syncBasicInputs();
    syncPresetState();
    renderPeople();
    renderResults();
  }

  function syncBasicInputs() {
    const counts = countsFromPeople();
    els.basicAdults.value = counts.adult;
    els.basicYoung.value = counts.childYoung;
    els.basicMid.value = counts.childMid;
    els.basicOld.value = counts.childOld;
  }

  function sameComposition(a, b) {
    if (a.length !== b.length) return false;
    const ca = a.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});
    const cb = b.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});
    return Object.keys({ ...ca, ...cb }).every(k => ca[k] === cb[k]);
  }

  function syncPresetState() {
    let active = null;
    Object.entries(PRESETS).some(([key, value]) => {
      if (sameComposition(people, value)) { active = key; return true; }
      return false;
    });
    els.presetButtons.forEach(button => button.classList.toggle('is-active', button.dataset.preset === active));
  }

  function sortPeople(list) {
    return list.map((type, index) => ({ type, index, ...TYPES[type] }))
      .sort((a, b) => b.rank - a.rank || a.index - b.index);
  }

  function calculate(period) {
    const rates = RATES[period];
    if (people.length === 0) return { total: 0, rows: [] };
    if (people.length === 1) {
      return { total: rates.single, rows: [{ label: 'Jednotlivec', value: rates.single, className: 'type-first' }] };
    }
    const sorted = sortPeople(people);
    const rows = sorted.map((person, index) => {
      if (index === 0) return { label: `První osoba · ${person.short.toLowerCase()}`, value: rates.first, className: 'type-first' };
      return { label: person.short, value: rates[person.rateKey], className: person.barClass };
    });
    return { total: rows.reduce((sum, row) => sum + row.value, 0), rows };
  }

  function renderPeople() {
    if (!people.length) {
      els.list.innerHTML = '<div class="min-empty-members"><strong>Domácnost je zatím prázdná.</strong><span>Přidejte alespoň jednu osobu.</span></div>';
      return;
    }
    els.list.innerHTML = people.map((type, index) => {
      const options = Object.entries(TYPES).map(([key, item]) => `<option value="${key}" ${key === type ? 'selected' : ''}>${item.label}</option>`).join('');
      return `<div class="min-member" data-index="${index}"><span class="min-member-no">${index + 1}</span><label><span>Osoba ${index + 1}</span><select class="person-type" aria-label="Kategorie osoby ${index + 1}">${options}</select></label><button type="button" class="min-member-remove" aria-label="Odebrat osobu ${index + 1}">×</button></div>`;
    }).join('');

    els.list.querySelectorAll('.person-type').forEach((select, index) => {
      select.addEventListener('change', () => {
        people[index] = select.value;
        syncBasicInputs();
        syncPresetState();
        renderResults();
      });
    });
    els.list.querySelectorAll('.min-member-remove').forEach((button, index) => {
      button.addEventListener('click', () => {
        people.splice(index, 1);
        syncBasicInputs();
        syncPresetState();
        renderPeople();
        renderResults();
      });
    });
  }

  function renderPeriods() {
    const futureNow = isFutureEffective();
    els.currentBadge.textContent = futureNow ? 'Historická sazba' : 'Platí nyní';
    els.futureBadge.textContent = futureNow ? 'Platí nyní' : 'Schváleno od října';
    els.currentBadge.classList.toggle('is-now', !futureNow);
    els.futureBadge.classList.toggle('is-now', futureNow);
    els.periodButtons.forEach(button => {
      const active = button.dataset.period === activePeriod;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
  }

  function renderMode() {
    els.modeButtons.forEach(button => {
      const active = button.dataset.mode === activeMode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    els.modePanels.forEach(panel => {
      const active = panel.dataset.panel === activeMode;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
  }

  function renderResults() {
    const current = calculate('current');
    const future = calculate('future');
    const active = activePeriod === 'future' ? future : current;
    const delta = future.total - current.total;
    const deltaPercent = current.total ? (delta / current.total) * 100 : 0;

    els.status.textContent = pluralPeople(people.length);
    els.mainPeriod.textContent = RATES[activePeriod].label;
    els.mainTotal.textContent = money(active.total);
    if (!people.length) {
      els.mainInterpretation.textContent = 'Přidejte alespoň jednu osobu, aby kalkulačka mohla výsledek spočítat.';
    } else if (people.length === 1) {
      els.mainInterpretation.textContent = 'Životní minimum jedné samostatně posuzované osoby za jeden měsíc.';
    } else {
      els.mainInterpretation.textContent = `Součet pro ${pluralPeople(people.length)} za jeden měsíc.`;
    }
    els.currentTotal.textContent = money(current.total);
    els.futureTotal.textContent = money(future.total);
    els.delta.textContent = signedMoney(delta);
    els.deltaPct.textContent = pct(deltaPercent);
    els.breakdownCount.textContent = `${active.rows.length} ${active.rows.length === 1 ? 'položka' : active.rows.length >= 2 && active.rows.length <= 4 ? 'položky' : 'položek'}`;

    els.stack.innerHTML = active.total > 0 ? active.rows.map(row => `<i class="${row.className}" style="width:${(row.value / active.total) * 100}%"></i>`).join('') : '';
    els.breakdown.innerHTML = active.rows.length ? active.rows.map(row => `<div class="min-breakdown-row"><i class="${row.className}"></i><span>${row.label}</span><strong>${money(row.value)}</strong></div>`).join('') : '<p class="min-breakdown-empty">Zatím není co rozdělit.</p>';

    renderIncome(active.total);
  }

  function renderIncome(total) {
    const income = Number(els.income.value);
    if (!Number.isFinite(income) || income <= 0 || total <= 0) {
      els.incomeResult.hidden = true;
      return;
    }
    const gap = income - total;
    els.incomeResult.hidden = false;
    els.incomeGap.textContent = gap >= 0 ? `${money(gap)} nad minimem` : `${money(Math.abs(gap))} pod minimem`;
    els.incomeText.textContent = gap >= 0
      ? `Zadaný čistý příjem odpovídá přibližně ${(income / total).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })}× životního minima. Tento poměr sám neurčuje nárok na dávku.`
      : 'Zadaný příjem je nižší než vypočtené životní minimum. Konkrétní sociální nárok ale závisí na dalších podmínkách.';
  }

  els.form?.addEventListener('submit', event => event.preventDefault());

  els.modeButtons.forEach(button => button.addEventListener('click', () => {
    activeMode = button.dataset.mode;
    renderMode();
  }));

  [els.basicAdults, els.basicYoung, els.basicMid, els.basicOld].forEach(input => {
    input?.addEventListener('input', peopleFromCounts);
    input?.addEventListener('change', peopleFromCounts);
  });

  els.add?.addEventListener('click', () => {
    if (people.length >= MAX_PEOPLE) return;
    people.push('adult');
    syncBasicInputs();
    syncPresetState();
    renderPeople();
    renderResults();
  });

  els.reset?.addEventListener('click', () => {
    people = [...PRESETS.single];
    activePeriod = isFutureEffective() ? 'future' : 'current';
    activeMode = 'basic';
    els.income.value = '';
    syncBasicInputs();
    syncPresetState();
    renderPeople();
    renderPeriods();
    renderMode();
    renderResults();
  });

  els.periodButtons.forEach(button => button.addEventListener('click', () => {
    activePeriod = button.dataset.period;
    renderPeriods();
    renderResults();
  }));

  els.presetButtons.forEach(button => button.addEventListener('click', () => {
    people = [...PRESETS[button.dataset.preset]];
    syncBasicInputs();
    syncPresetState();
    renderPeople();
    renderResults();
  }));

  els.income?.addEventListener('input', renderResults);

  if (els.menu && els.nav) {
    els.menu.addEventListener('click', () => {
      const open = els.menu.getAttribute('aria-expanded') === 'true';
      els.menu.setAttribute('aria-expanded', String(!open));
      els.menu.setAttribute('aria-label', open ? 'Otevřít navigaci' : 'Zavřít navigaci');
      els.nav.classList.toggle('is-open', !open);
    });
    els.nav.addEventListener('click', event => {
      if (event.target.closest('a')) {
        els.nav.classList.remove('is-open');
        els.menu.setAttribute('aria-expanded', 'false');
        els.menu.setAttribute('aria-label', 'Otevřít navigaci');
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        els.nav.classList.remove('is-open');
        els.menu.setAttribute('aria-expanded', 'false');
        els.menu.setAttribute('aria-label', 'Otevřít navigaci');
      }
    });
  }

  syncBasicInputs();
  syncPresetState();
  renderPeople();
  renderPeriods();
  renderMode();
  renderResults();
})();
