(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const fmt = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const fmt1 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const money = n => `${fmt.format(Math.round(Number.isFinite(n) ? n : 0))} Kč`;
  const pct = n => `${fmt1.format(Number.isFinite(n) ? n : 0)} %`;
  const val = id => Math.max(0, Number($(id)?.value || 0));
  const set = (id, text) => { if ($(id)) $(id).textContent = text; };
  const modeButtons = [...document.querySelectorAll('[data-mode]')];
  const presets = {
    rent: { housingType:'rent', primaryCost:18000, operations:7300, income:55000, reserve:0, people:2, area:65, debt:0, target:35, stressMain:10, stressOps:15 },
    flat: { housingType:'flat', primaryCost:24500, operations:9000, income:78000, reserve:2500, people:2, area:72, debt:0, target:35, stressMain:10, stressOps:15 },
    house:{ housingType:'house', primaryCost:31000, operations:11700, income:98000, reserve:4500, people:4, area:145, debt:0, target:35, stressMain:10, stressOps:15 }
  };
  let mode = 'basic';

  function read() {
    return {
      mode,
      type: $('housingType').value,
      primary: val('primaryCost'),
      operations: val('operations'),
      income: val('income'),
      reserve: mode === 'advanced' ? val('reserve') : 0,
      people: Math.max(1, mode === 'advanced' ? val('people') : 2),
      area: Math.max(1, mode === 'advanced' ? val('area') : 65),
      debt: mode === 'advanced' ? val('debt') : 0,
      target: Math.min(100, mode === 'advanced' ? val('target') : 35),
      stressMain: mode === 'advanced' ? val('stressMain') : 10,
      stressOps: mode === 'advanced' ? val('stressOps') : 15
    };
  }

  function calculate(v) {
    const total = v.primary + v.operations + v.reserve;
    const annual = total * 12;
    const share = v.income > 0 ? total / v.income * 100 : 0;
    const remainder = v.income - total - v.debt;
    const perPerson = total / v.people;
    const perArea = total / v.area;
    const stress = v.primary * (1 + v.stressMain / 100) + (v.operations + v.reserve) * (1 + v.stressOps / 100);
    const stressShare = v.income > 0 ? stress / v.income * 100 : 0;
    return { ...v, total, annual, share, remainder, perPerson, perArea, stress, stressShare };
  }

  function interpretation(r) {
    if (!r.income) return ['Doplňte čistý příjem domácnosti.', 'Bez příjmu umíme sečíst náklady, ale ne jejich tlak na rozpočet.'];
    if (r.remainder < 0) return ['Měsíční cash-flow je záporné.', `Po bydlení a dalších splátkách chybí ${money(Math.abs(r.remainder))} měsíčně.`];
    if (r.share >= 40) return ['Bydlení bere přes 40 % příjmu.', `Eurostat používá 40 % jako statistickou hranici housing-cost overburden. Není to osobní doporučení, ale užitečný varovný kontext.`];
    if (r.mode === 'advanced' && r.share > r.target) return ['Nad vaším zadaným limitem.', `Aktuální podíl ${pct(r.share)} je nad vaším osobním cílem ${pct(r.target)}.`];
    if (r.mode === 'advanced') return ['Pod vaším zadaným limitem.', `Bydlení bere ${pct(r.share)} příjmu a po bydlení a dalších splátkách zbývá ${money(r.remainder)}.`];
    return [`Bydlení tvoří ${pct(r.share)} čistého příjmu.`, `Po bydlení zbývá ${money(r.remainder)}. Pro osobní limit, náklad na osobu, m² a stresový test přepněte na podrobný režim.`];
  }

  function render() {
    const r = calculate(read());
    const [headline, copy] = interpretation(r);
    const mainShare = r.total ? r.primary / r.total * 100 : 0;
    const opsShare = r.total ? r.operations / r.total * 100 : 0;
    const reserveShare = r.total ? r.reserve / r.total * 100 : 0;
    const housingIncomeShare = r.income > 0 ? Math.min(100, r.total / r.income * 100) : 0;
    const debtIncomeShare = r.income > 0 ? Math.min(Math.max(0, 100 - housingIncomeShare), r.debt / r.income * 100) : 0;
    const freeIncomeShare = r.income > 0 ? Math.max(0, 100 - housingIncomeShare - debtIncomeShare) : 0;

    set('heroTotal', money(r.total));
    set('heroShare', r.income ? pct(r.share) : '—');
    set('heroRemainder', r.income ? money(r.remainder) : '—');
    set('heroAnnual', money(r.annual));
    set('heroStatus', !r.income ? 'Doplňte příjem pro kontext rozpočtu.' : (r.remainder < 0 ? `Rozpočet je v mínusu o ${money(Math.abs(r.remainder))}.` : `Po bydlení zůstává ${money(r.remainder)} měsíčně.`));
    set('resultTotal', money(r.total));
    set('resultAnnual', `${money(r.annual)} za rok`);
    set('resultShare', r.income ? pct(r.share) : '—');
    set('resultRemainder', r.income ? money(r.remainder) : '—');
    set('resultPerPerson', r.mode === 'advanced' ? money(r.perPerson) : '—');
    set('resultPerArea', r.mode === 'advanced' ? `${money(r.perArea)}/m²` : '—');
    set('resultHeadline', headline);
    set('resultCopy', copy);
    set('stressTotal', money(r.stress));
    set('stressShare', r.income ? pct(r.stressShare) : '—');
    set('stressDelta', money(Math.max(0, r.stress - r.total)));
    set('barMainLabel', `${pct(mainShare)} · ${money(r.primary)}`);
    set('barOpsLabel', `${pct(opsShare)} · ${money(r.operations)}`);
    set('barReserveLabel', `${pct(reserveShare)} · ${money(r.reserve)}`);
    $('stackMain').style.width = `${mainShare}%`;
    $('stackOps').style.width = `${opsShare}%`;
    $('stackReserve').style.width = `${reserveShare}%`;
    $('incomeFill').style.width = `${Math.min(100, r.share)}%`;
    $('incomeMarker').style.left = '40%';
    if ($('shareDial')) {
      $('shareDial').style.setProperty('--hm-share', `${Math.min(100, r.share)}%`);
      $('shareDial').classList.toggle('is-over', r.income > 0 && r.share >= 40);
    }
    if ($('cashlineHousing')) $('cashlineHousing').style.width = `${housingIncomeShare}%`;
    if ($('cashlineDebt')) $('cashlineDebt').style.width = `${debtIncomeShare}%`;
    if ($('cashlineFree')) $('cashlineFree').style.width = `${freeIncomeShare}%`;
    set('cashlineCaption', !r.income ? 'Doplňte příjem' : (r.remainder >= 0 ? `${money(r.remainder)} volně` : `${money(Math.abs(r.remainder))} chybí`));
    document.querySelectorAll('.hm-kpi-advanced').forEach(el => { el.hidden = r.mode !== 'advanced'; });
    document.querySelectorAll('.hm-reserve-output').forEach(el => { el.hidden = r.mode !== 'advanced'; });
    document.querySelectorAll('.hm-debt-output').forEach(el => { el.hidden = r.mode !== 'advanced' || r.debt <= 0; });
    if ($('stressPanel')) $('stressPanel').hidden = r.mode !== 'advanced';
    set('stressAssumption', `Model: hlavní platba +${fmt.format(r.stressMain)} %, provoz a rezerva +${fmt.format(r.stressOps)} %.`);
    $('vysledek')?.classList.toggle('is-over', r.income > 0 && r.share >= 40);
    $('vysledek')?.classList.toggle('is-negative', r.income > 0 && r.remainder < 0);

    const typeLabel = { rent:'Nájem', flat:'Vlastní byt', house:'Rodinný dům' }[r.type];
    set('heroType', typeLabel);
    const selectedBenchmark = { rent:['Nájemní bydlení','13 572 Kč','30,1 %'], flat:['Byt v osobním vlastnictví','7 495 Kč','13,6 %'], house:['Vlastní dům','8 004 Kč','12,1 %'] }[r.type];
    set('benchmarkSelectedType', selectedBenchmark[0]);
    set('benchmarkSelectedCost', selectedBenchmark[1]);
    set('benchmarkSelectedShare', selectedBenchmark[2]);
    set('benchmarkScopeNote', r.type === 'rent'
      ? 'U nájemního bydlení je hlavní nájem v oficiálních nákladech zahrnutý. Rozsah ale stále nemusí přesně odpovídat vašemu zadání.'
      : 'Pozor: ČSÚ u vlastnického bydlení do těchto nákladů nezahrnuje splátky hypotéky. Proto nesrovnávejte svůj all-in cash-flow přímo s touto částkou jako skóre.');
  }

  function setMode(next) {
    mode = next === 'advanced' ? 'advanced' : 'basic';
    if ($('advancedDetails')) {
      $('advancedDetails').hidden = mode !== 'advanced';
      $('advancedDetails').open = mode === 'advanced';
    }
    if ($('advancedFields')) $('advancedFields').hidden = mode !== 'advanced';
    modeButtons.forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    });
    render();
  }

  function applyPreset(key) {
    const p = presets[key];
    if (!p) return;
    Object.entries(p).forEach(([id, value]) => { if ($(id)) $(id).value = value; });
    render();
  }

  $('housingForm')?.addEventListener('input', render);
  $('housingForm')?.addEventListener('change', render);
  $('housingForm')?.addEventListener('submit', e => { e.preventDefault(); render(); $('vysledek')?.scrollIntoView({ behavior:'smooth', block:'start' }); });
  modeButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
  document.querySelectorAll('[data-preset]').forEach(btn => btn.addEventListener('click', () => applyPreset(btn.dataset.preset)));
  $('resetButton')?.addEventListener('click', () => { $('housingForm').reset(); setMode('basic'); });

  const toggle = document.querySelector('.hm-menu-toggle');
  const nav = document.querySelector('.hm-main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded','false'); } });
  }

  setMode('basic');
})();
