(function(){
  'use strict';

  const YEAR = 2026;
  const LIMIT_1 = 1633;
  const LIMIT_2 = 2449;
  const LIMIT_3 = 4897;
  const RATE = 0.60;
  const DAYS_IN_YEAR = 365;
  const MONTHS = 12;

  const form = document.getElementById('ocr-form');
  if (!form) return;

  const els = {
    modeGross: document.getElementById('mode-gross'),
    modeDvz: document.getElementById('mode-dvz'),
    grossWrap: document.getElementById('gross-wrap'),
    dvzWrap: document.getElementById('dvz-wrap'),
    gross: document.getElementById('gross-income'),
    dvz: document.getElementById('daily-base'),
    days: document.getElementById('care-days'),
    singleParent: document.getElementById('single-parent'),
    resultTotal: document.getElementById('result-total'),
    resultDaily: document.getElementById('result-daily'),
    resultDvz: document.getElementById('result-dvz'),
    resultReduced: document.getElementById('result-reduced'),
    resultPaidDays: document.getElementById('result-paid-days'),
    resultLimit: document.getElementById('result-limit'),
    replacement: document.getElementById('result-replacement'),
    alert: document.getElementById('result-alert'),
    tableBody: document.getElementById('breakdown-body'),
    scenario5: document.getElementById('scenario-5'),
    scenario9: document.getElementById('scenario-9'),
    scenario16: document.getElementById('scenario-16')
  };

  let mode = 'gross';

  const nf = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const money = value => `${nf.format(Math.max(0, Math.round(value || 0)))} Kč`;
  const num = value => Number(String(value || '').replace(/\s/g,'').replace(',', '.')) || 0;
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  function getDvz(){
    if (mode === 'dvz') return Math.ceil(num(els.dvz.value));
    const monthly = num(els.gross.value);
    return Math.ceil((monthly * MONTHS) / DAYS_IN_YEAR);
  }

  function reduceDvz(dvz){
    const first = Math.min(dvz, LIMIT_1) * 0.90;
    const second = Math.max(Math.min(dvz, LIMIT_2) - LIMIT_1, 0) * 0.60;
    const third = Math.max(Math.min(dvz, LIMIT_3) - LIMIT_2, 0) * 0.30;
    const ignored = Math.max(dvz - LIMIT_3, 0);
    return { first, second, third, ignored, reduced: first + second + third };
  }

  function calculate(daysOverride){
    const dvz = getDvz();
    const reduction = reduceDvz(dvz);
    const dailyBenefit = Math.ceil(reduction.reduced * RATE);
    const requestedDays = typeof daysOverride === 'number' ? daysOverride : Math.ceil(num(els.days.value));
    const limit = els.singleParent.checked ? 16 : 9;
    const paidDays = clamp(requestedDays, 0, limit);
    const unpaidDays = Math.max(requestedDays - paidDays, 0);
    const total = dailyBenefit * paidDays;
    const approximateDailyIncome = mode === 'gross' ? (num(els.gross.value) * MONTHS / DAYS_IN_YEAR) : dvz;
    const replacement = approximateDailyIncome > 0 ? Math.round((dailyBenefit / approximateDailyIncome) * 100) : 0;
    return { dvz, reduction, dailyBenefit, requestedDays, limit, paidDays, unpaidDays, total, replacement };
  }

  function render(){
    const result = calculate();
    els.resultTotal.textContent = money(result.total);
    els.resultDaily.textContent = money(result.dailyBenefit);
    els.resultDvz.textContent = money(result.dvz);
    els.resultReduced.textContent = money(result.reduction.reduced);
    els.resultPaidDays.textContent = `${result.paidDays} z ${result.requestedDays || 0}`;
    els.resultLimit.textContent = `${result.limit} dní`;
    els.replacement.textContent = `${result.replacement} %`;

    if (result.unpaidDays > 0) {
      els.alert.textContent = `Zadaná délka je o ${result.unpaidDays} ${result.unpaidDays === 1 ? 'den' : result.unpaidDays < 5 ? 'dny' : 'dní'} vyšší než podpůrčí doba. Kalkulačka proto počítá jen ${result.limit} hrazených dnů.`;
      els.alert.classList.add('active');
    } else {
      els.alert.textContent = '';
      els.alert.classList.remove('active');
    }

    els.tableBody.innerHTML = [
      ['Do 1. redukční hranice', `min(DVZ, ${nf.format(LIMIT_1)}) × 90 %`, result.reduction.first],
      ['Mezi 1. a 2. hranicí', `nad ${nf.format(LIMIT_1)} do ${nf.format(LIMIT_2)} × 60 %`, result.reduction.second],
      ['Mezi 2. a 3. hranicí', `nad ${nf.format(LIMIT_2)} do ${nf.format(LIMIT_3)} × 30 %`, result.reduction.third],
      ['Nad 3. hranicí', `nad ${nf.format(LIMIT_3)} se nezohledňuje`, 0],
      ['Redukovaný denní základ', 'součet započtených částí', result.reduction.reduced],
      ['Ošetřovné za den', '60 % redukovaného základu, zaokrouhleno nahoru', result.dailyBenefit]
    ].map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${money(row[2])}</td></tr>`).join('');

    els.scenario5.textContent = money(calculate(5).total);
    els.scenario9.textContent = money(calculate(9).total);
    els.scenario16.textContent = money(calculate(16).total);
  }

  function setMode(nextMode){
    mode = nextMode;
    els.modeGross.setAttribute('aria-pressed', String(mode === 'gross'));
    els.modeDvz.setAttribute('aria-pressed', String(mode === 'dvz'));
    els.grossWrap.hidden = mode !== 'gross';
    els.dvzWrap.hidden = mode !== 'dvz';
    render();
  }

  els.modeGross.addEventListener('click', () => setMode('gross'));
  els.modeDvz.addEventListener('click', () => setMode('dvz'));
  form.addEventListener('input', render);
  form.addEventListener('submit', event => { event.preventDefault(); render(); document.getElementById('vysledek').scrollIntoView({ behavior:'smooth', block:'start' }); });
  document.getElementById('reset-example').addEventListener('click', () => { els.gross.value = 42000; els.dvz.value = 1381; els.days.value = 9; els.singleParent.checked = false; setMode('gross'); });

  render();
})();
