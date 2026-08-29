(() => {
  'use strict';

  const RATES = {
    current: { label: 'Platí nyní · do 30. 9. 2026', single: 4860, first: 4470, adult: 4040, childOld: 3490, childMid: 3050, childYoung: 2480 },
    future:  { label: 'Od 1. 10. 2026', single: 5500, first: 5000, adult: 3750, childOld: 3490, childMid: 3050, childYoung: 2480 }
  };

  const TYPES = {
    adult: { label: 'Dospělý / jiná osoba', short: 'Dospělá osoba', rank: 4, rateKey: 'adult', className: 'type-adult' },
    childOld: { label: 'Nezaopatřené dítě 15–26 let', short: 'Dítě 15–26 let', rank: 3, rateKey: 'childOld', className: 'type-child-old' },
    childMid: { label: 'Nezaopatřené dítě 6–15 let', short: 'Dítě 6–15 let', rank: 2, rateKey: 'childMid', className: 'type-child-mid' },
    childYoung: { label: 'Nezaopatřené dítě do 6 let', short: 'Dítě do 6 let', rank: 1, rateKey: 'childYoung', className: 'type-child-young' }
  };

  const PRESETS = {
    single: ['adult'],
    couple: ['adult', 'adult'],
    'parent-child': ['adult', 'childYoung'],
    family: ['adult', 'adult', 'childMid', 'childOld']
  };

  const MAX_PEOPLE = 20;
  let people = [...PRESETS.single];
  let mode = 'basic';

  const $ = id => document.getElementById(id);
  const els = {
    form: $('minimumForm'),
    basicAdults: $('basicAdults'), basicYoung: $('basicYoung'), basicMid: $('basicMid'), basicOld: $('basicOld'),
    basicTab: $('lm86BasicTab'), advancedTab: $('lm86AdvancedTab'), basicPanel: $('lm86BasicPanel'), advancedPanel: $('lm86AdvancedPanel'),
    memberList: $('memberList'), addMember: $('addMember'), monthlyIncome: $('monthlyIncome'), resetBtn: $('resetBtn'),
    resultPeriodLabel: $('resultPeriodLabel'), mainTotal: $('mainTotal'), mainDescription: $('mainDescription'), currentTotal: $('currentTotal'), futureTotal: $('futureTotal'),
    deltaBadge: $('deltaBadge'), changeExplanation: $('changeExplanation'), breakdownCount: $('breakdownCount'), resultStack: $('resultStack'), breakdownList: $('breakdownList'),
    incomeResult: $('incomeResult'), incomeGap: $('incomeGap'), incomeText: $('incomeText'), menu: document.querySelector('.lm86-menu'), mobileNav: document.querySelector('.lm86-mobile-nav')
  };

  const money = value => `${Math.round(value).toLocaleString('cs-CZ')} Kč`;
  const signed = value => value === 0 ? 'beze změny' : `${value > 0 ? '+' : '−'}${Math.abs(Math.round(value)).toLocaleString('cs-CZ')} Kč`;
  const futureIsActive = () => new Date() >= new Date(2026, 9, 1, 0, 0, 0, 0);

  function clampInt(value, min = 0, max = 10) {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
  }

  function parseMoney(value) {
    const cleaned = String(value || '').replace(/[^0-9,.-]/g, '').replace(',', '.');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  function sortPeople(list) {
    return list.map((type, index) => ({ type, index, ...TYPES[type] }))
      .sort((a, b) => b.rank - a.rank || a.index - b.index);
  }

  function calculate(list, period) {
    const rates = RATES[period];
    if (!list.length) return { total: 0, rows: [] };
    if (list.length === 1) return { total: rates.single, rows: [{ label: 'Jednotlivec', value: rates.single, className: 'type-first' }] };
    const sorted = sortPeople(list);
    const rows = sorted.map((person, index) => index === 0
      ? { label: `První osoba · ${person.short.toLowerCase()}`, value: rates.first, className: 'type-first' }
      : { label: person.short, value: rates[person.rateKey], className: person.className });
    return { total: rows.reduce((sum, row) => sum + row.value, 0), rows };
  }

  function countsFromPeople() {
    return people.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, { adult: 0, childYoung: 0, childMid: 0, childOld: 0 });
  }

  function syncBasic() {
    const c = countsFromPeople();
    els.basicAdults.value = Math.max(1, c.adult || 0);
    els.basicYoung.value = c.childYoung || 0;
    els.basicMid.value = c.childMid || 0;
    els.basicOld.value = c.childOld || 0;
  }

  function peopleFromBasic() {
    const adults = clampInt(els.basicAdults.value, 1, 10);
    const young = clampInt(els.basicYoung.value);
    const mid = clampInt(els.basicMid.value);
    const old = clampInt(els.basicOld.value);
    people = [
      ...Array(adults).fill('adult'),
      ...Array(young).fill('childYoung'),
      ...Array(mid).fill('childMid'),
      ...Array(old).fill('childOld')
    ].slice(0, MAX_PEOPLE);
    els.basicAdults.value = adults; els.basicYoung.value = young; els.basicMid.value = mid; els.basicOld.value = old;
    syncPresetButtons(); renderMembers(); render();
  }

  function sameComposition(a, b) {
    if (a.length !== b.length) return false;
    const count = arr => arr.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});
    const ca = count(a), cb = count(b);
    return Object.keys({ ...ca, ...cb }).every(key => ca[key] === cb[key]);
  }

  function syncPresetButtons() {
    let active = '';
    Object.entries(PRESETS).some(([key, list]) => {
      if (sameComposition(people, list)) { active = key; return true; }
      return false;
    });
    document.querySelectorAll('[data-preset]').forEach(btn => btn.classList.toggle('is-active', btn.dataset.preset === active));
  }

  function renderMembers() {
    if (!els.memberList) return;
    els.memberList.innerHTML = people.map((type, index) => {
      const opts = Object.entries(TYPES).map(([key, item]) => `<option value="${key}" ${key === type ? 'selected' : ''}>${item.label}</option>`).join('');
      return `<div class="lm86-member"><span>${index + 1}</span><label><span>Osoba ${index + 1}</span><select data-member="${index}" aria-label="Kategorie osoby ${index + 1}">${opts}</select></label><button type="button" data-remove="${index}" aria-label="Odebrat osobu ${index + 1}">×</button></div>`;
    }).join('');
    els.memberList.querySelectorAll('[data-member]').forEach(select => select.addEventListener('change', () => {
      people[Number(select.dataset.member)] = select.value;
      syncBasic(); syncPresetButtons(); render();
    }));
    els.memberList.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
      if (people.length <= 1) return;
      people.splice(Number(button.dataset.remove), 1);
      if (!people.some(type => type === 'adult')) people.unshift('adult');
      syncBasic(); syncPresetButtons(); renderMembers(); render();
    }));
  }

  function deltaExplanation(delta, adultCount) {
    if (people.length === 1) return `U jednotlivce se životní minimum zvýší o ${money(Math.abs(delta))} měsíčně.`;
    if (delta > 0) return `Pro tuto domácnost se součet od října zvýší o ${money(delta)} měsíčně.`;
    if (delta < 0) return `Pro tuto domácnost se součet od října sníží o ${money(Math.abs(delta))}. Důvodem je nižší sazba druhé a další dospělé osoby.`;
    if (adultCount === 0) return 'Dětské částky zůstávají od října stejné.';
    return 'Pro tuto skladbu domácnosti vychází celková částka v obou obdobích stejně.';
  }

  function renderIncome(total) {
    const income = parseMoney(els.monthlyIncome?.value);
    if (!els.incomeResult || income <= 0 || total <= 0) { if (els.incomeResult) els.incomeResult.hidden = true; return; }
    const gap = income - total;
    els.incomeResult.hidden = false;
    els.incomeGap.textContent = gap >= 0 ? `${money(gap)} nad minimem` : `${money(Math.abs(gap))} pod minimem`;
    els.incomeText.textContent = gap >= 0
      ? `Zadaný příjem je přibližně ${(income / total).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })}× vypočteného životního minima. Tento poměr sám neurčuje nárok na dávku.`
      : 'Zadaný příjem je pod vypočteným životním minimem. Konkrétní nárok na pomoc ale závisí na dalších zákonných podmínkách.';
  }

  function render() {
    const current = calculate(people, 'current');
    const future = calculate(people, 'future');
    const activeKey = futureIsActive() ? 'future' : 'current';
    const active = activeKey === 'future' ? future : current;
    const delta = future.total - current.total;
    const adultCount = people.filter(x => x === 'adult').length;

    els.resultPeriodLabel.textContent = RATES[activeKey].label.toUpperCase();
    els.mainTotal.textContent = money(active.total);
    els.mainDescription.textContent = people.length === 1 ? 'Jedna samostatně posuzovaná osoba.' : `${people.length} společně posuzovaných osob za jeden měsíc.`;
    els.currentTotal.textContent = money(current.total);
    els.futureTotal.textContent = money(future.total);
    els.deltaBadge.textContent = signed(delta);
    els.deltaBadge.classList.toggle('is-down', delta < 0);
    els.changeExplanation.innerHTML = `<strong>Co udělá říjen?</strong><p>${deltaExplanation(delta, adultCount)}</p>`;

    els.breakdownCount.textContent = `${active.rows.length} ${active.rows.length === 1 ? 'položka' : active.rows.length <= 4 ? 'položky' : 'položek'}`;
    els.resultStack.innerHTML = active.rows.map(row => `<i class="${row.className}" style="width:${active.total ? (row.value / active.total) * 100 : 0}%"></i>`).join('');
    els.breakdownList.innerHTML = active.rows.map(row => `<div class="lm86-breakdown-row"><i class="${row.className}"></i><span>${row.label}</span><strong>${money(row.value)}</strong></div>`).join('');
    renderIncome(active.total);
  }

  function setMode(nextMode, focus = false) {
    mode = nextMode;
    const basic = mode === 'basic';
    els.basicTab.classList.toggle('is-active', basic); els.advancedTab.classList.toggle('is-active', !basic);
    els.basicTab.setAttribute('aria-selected', String(basic)); els.advancedTab.setAttribute('aria-selected', String(!basic));
    els.basicTab.tabIndex = basic ? 0 : -1; els.advancedTab.tabIndex = basic ? -1 : 0;
    els.basicPanel.hidden = !basic; els.advancedPanel.hidden = basic;
    if (focus) (basic ? els.basicTab : els.advancedTab).focus();
  }

  function reset() {
    people = [...PRESETS.single];
    mode = 'basic';
    if (els.monthlyIncome) els.monthlyIncome.value = '';
    syncBasic(); syncPresetButtons(); renderMembers(); setMode('basic'); render();
  }

  els.form?.addEventListener('submit', event => { event.preventDefault(); render(); });
  [els.basicAdults, els.basicYoung, els.basicMid, els.basicOld].forEach(input => input?.addEventListener('input', peopleFromBasic));
  document.querySelectorAll('[data-preset]').forEach(btn => btn.addEventListener('click', () => {
    people = [...PRESETS[btn.dataset.preset]]; syncBasic(); syncPresetButtons(); renderMembers(); render();
  }));
  els.addMember?.addEventListener('click', () => {
    if (people.length >= MAX_PEOPLE) return;
    people.push('adult'); syncBasic(); syncPresetButtons(); renderMembers(); render();
  });
  els.monthlyIncome?.addEventListener('input', render);
  els.resetBtn?.addEventListener('click', reset);
  els.basicTab?.addEventListener('click', () => setMode('basic'));
  els.advancedTab?.addEventListener('click', () => setMode('advanced'));
  [els.basicTab, els.advancedTab].forEach(tab => tab?.addEventListener('keydown', event => {
    if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home' || event.key === 'ArrowLeft') setMode('basic', true);
    else setMode('advanced', true);
  }));

  if (els.menu && els.mobileNav) {
    els.menu.addEventListener('click', () => {
      const open = els.menu.getAttribute('aria-expanded') === 'true';
      els.menu.setAttribute('aria-expanded', String(!open));
      els.menu.textContent = open ? '☰' : '×';
      els.mobileNav.hidden = open;
    });
    els.mobileNav.addEventListener('click', event => {
      if (!event.target.closest('a')) return;
      els.mobileNav.hidden = true; els.menu.setAttribute('aria-expanded', 'false'); els.menu.textContent = '☰';
    });
  }

  syncBasic(); syncPresetButtons(); renderMembers(); setMode('basic'); render();
})();
