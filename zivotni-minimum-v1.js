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
    couple: ['adult','adult'],
    'parent-child': ['adult','childYoung'],
    family: ['adult','adult','childMid','childOld']
  };

  let people = [...PRESETS.single];
  let activePeriod = isFutureEffective() ? 'future' : 'current';

  const els = {
    list: document.getElementById('memberList'),
    add: document.getElementById('addPerson'),
    reset: document.getElementById('resetCalculator'),
    periodButtons: [...document.querySelectorAll('[data-period]')],
    presetButtons: [...document.querySelectorAll('[data-preset]')],
    currentBadge: document.getElementById('currentPeriodBadge'),
    futureBadge: document.getElementById('futurePeriodBadge'),
    status: document.getElementById('resultStatus'),
    mainPeriod: document.getElementById('mainPeriod'),
    mainTotal: document.getElementById('mainTotal'),
    mainInterpretation: document.getElementById('mainInterpretation'),
    currentTotal: document.getElementById('currentTotal'),
    futureTotal: document.getElementById('futureTotal'),
    delta: document.getElementById('futureDelta'),
    deltaPct: document.getElementById('futureDeltaPct'),
    breakdownCount: document.getElementById('breakdownCount'),
    stack: document.getElementById('resultStack'),
    breakdown: document.getElementById('breakdownList'),
    income: document.getElementById('monthlyIncome'),
    incomeResult: document.getElementById('incomeResult'),
    incomeGap: document.getElementById('incomeGap'),
    incomeText: document.getElementById('incomeText')
  };

  function isFutureEffective(){
    const now = new Date();
    const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return local >= new Date(2026, 9, 1);
  }

  function money(value){
    return `${Math.round(value).toLocaleString('cs-CZ')} Kč`;
  }

  function signedMoney(value){
    if (value === 0) return 'beze změny';
    return `${value > 0 ? '+' : '−'}${Math.abs(Math.round(value)).toLocaleString('cs-CZ')} Kč`;
  }

  function pct(value){
    if (!Number.isFinite(value) || value === 0) return '0 %';
    const sign = value > 0 ? '+' : '−';
    return `${sign}${Math.abs(value).toLocaleString('cs-CZ',{minimumFractionDigits:1,maximumFractionDigits:1})} %`;
  }

  function sortPeople(list){
    return list.map((type,index)=>({type,index,...TYPES[type]})).sort((a,b)=>b.rank-a.rank || a.index-b.index);
  }

  function calculate(period){
    const rates = RATES[period];
    if (people.length === 1){
      return { total: rates.single, rows: [{ label:'Jednotlivec', value:rates.single, className:'type-first' }] };
    }
    const sorted = sortPeople(people);
    const rows = sorted.map((person,index)=>{
      if (index === 0) return { label:`První osoba · ${person.short.toLowerCase()}`, value:rates.first, className:'type-first' };
      return { label:person.short, value:rates[person.rateKey], className:person.barClass };
    });
    return { total: rows.reduce((sum,row)=>sum+row.value,0), rows };
  }

  function renderPeople(){
    els.list.innerHTML = people.map((type,index)=>{
      const options = Object.entries(TYPES).map(([key,item])=>`<option value="${key}" ${key===type?'selected':''}>${item.label}</option>`).join('');
      return `<div class="min-member" data-index="${index}"><span class="min-member-no">${index+1}</span><label><span>Osoba ${index+1}</span><select class="person-type" aria-label="Kategorie osoby ${index+1}">${options}</select></label><button type="button" class="min-member-remove" aria-label="Odebrat osobu ${index+1}" ${people.length===1?'disabled':''}>×</button></div>`;
    }).join('');

    els.list.querySelectorAll('.person-type').forEach((select,index)=>{
      select.addEventListener('change',()=>{ people[index]=select.value; markCustom(); renderResults(); });
    });
    els.list.querySelectorAll('.min-member-remove').forEach((button,index)=>{
      button.addEventListener('click',()=>{
        if (people.length === 1) return;
        people.splice(index,1);
        markCustom(); renderPeople(); renderResults();
      });
    });
  }

  function markCustom(){
    els.presetButtons.forEach(button=>button.classList.remove('is-active'));
  }

  function renderPeriods(){
    const futureNow = isFutureEffective();
    els.currentBadge.textContent = futureNow ? 'Historická sazba' : 'Platí nyní';
    els.futureBadge.textContent = futureNow ? 'Platí nyní' : 'Schváleno od října';
    els.currentBadge.classList.toggle('is-now',!futureNow);
    els.futureBadge.classList.toggle('is-now',futureNow);
    els.periodButtons.forEach(button=>{
      const active = button.dataset.period === activePeriod;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-selected',active?'true':'false');
    });
  }

  function renderResults(){
    const current = calculate('current');
    const future = calculate('future');
    const active = activePeriod === 'future' ? future : current;
    const delta = future.total-current.total;
    const deltaPercent = current.total ? (delta/current.total)*100 : 0;

    els.status.textContent = `${people.length} ${people.length === 1 ? 'osoba' : people.length < 5 ? 'osoby' : 'osob'}`;
    els.mainPeriod.textContent = RATES[activePeriod].label;
    els.mainTotal.textContent = money(active.total);
    els.mainInterpretation.textContent = people.length === 1 ? 'Životní minimum jednotlivce za jeden měsíc.' : `Součet pro ${people.length} společně posuzované ${people.length < 5 ? 'osoby' : 'osob'} za jeden měsíc.`;
    els.currentTotal.textContent = money(current.total);
    els.futureTotal.textContent = money(future.total);
    els.delta.textContent = signedMoney(delta);
    els.deltaPct.textContent = pct(deltaPercent);
    els.breakdownCount.textContent = `${active.rows.length} ${active.rows.length === 1 ? 'položka' : active.rows.length < 5 ? 'položky' : 'položek'}`;

    els.stack.innerHTML = active.rows.map(row=>`<i class="${row.className}" style="width:${(row.value/active.total)*100}%"></i>`).join('');
    els.breakdown.innerHTML = active.rows.map(row=>`<div class="min-breakdown-row"><i class="${row.className}"></i><span>${row.label}</span><strong>${money(row.value)}</strong></div>`).join('');

    renderIncome(active.total);
  }

  function renderIncome(total){
    const income = Number(els.income.value);
    if (!Number.isFinite(income) || income <= 0){ els.incomeResult.hidden = true; return; }
    const gap = income-total;
    els.incomeResult.hidden = false;
    els.incomeGap.textContent = gap >= 0 ? `${money(gap)} nad minimem` : `${money(Math.abs(gap))} pod minimem`;
    els.incomeText.textContent = gap >= 0 ? `Zadaný čistý příjem je přibližně ${(income/total).toLocaleString('cs-CZ',{maximumFractionDigits:2})}× životního minima. Tento poměr sám neurčuje nárok na dávku.` : 'Zadaný příjem je nižší než vypočtené životní minimum. Konkrétní sociální nárok ale závisí i na dalších podmínkách.';
  }

  els.add.addEventListener('click',()=>{
    if (people.length >= 10) return;
    people.push('adult'); markCustom(); renderPeople(); renderResults();
  });

  els.reset.addEventListener('click',()=>{
    people=[...PRESETS.single]; activePeriod=isFutureEffective()?'future':'current'; els.income.value='';
    els.presetButtons.forEach(button=>button.classList.toggle('is-active',button.dataset.preset==='single'));
    renderPeople(); renderPeriods(); renderResults();
  });

  els.periodButtons.forEach(button=>button.addEventListener('click',()=>{ activePeriod=button.dataset.period; renderPeriods(); renderResults(); }));
  els.presetButtons.forEach(button=>button.addEventListener('click',()=>{
    people=[...PRESETS[button.dataset.preset]];
    els.presetButtons.forEach(item=>item.classList.toggle('is-active',item===button));
    renderPeople(); renderResults();
  }));
  els.income.addEventListener('input',()=>renderResults());

  renderPeople(); renderPeriods(); renderResults();
})();
