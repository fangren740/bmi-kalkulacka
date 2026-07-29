(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const state = { mode: 'basic', preset: 'couple', purpose: 'own' };
  const fmt = (n, max = 0, min = 0) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: max, minimumFractionDigits: min }).format(Number.isFinite(n) ? n : 0);
  const money = n => `${fmt(Math.round(n))} Kč`;
  const percent = (n, digits = 0) => `${fmt(n, digits, digits)} %`;
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const parse = value => {
    const normalized = String(value ?? '').trim().replace(/\s+/g, '').replace(',', '.').replace(/[^0-9.+-]/g, '');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  };

  const fields = ['income','livingCosts','debts','monthlyHomeCosts','savings','propertyPrice','interestRate','years','existingDebtBalance','purchaseCosts','renovationReserve','reserveMonths','safeHousingShare','targetSaving','incomeShock'];
  const moneyFields = new Set(['income','livingCosts','debts','monthlyHomeCosts','savings','propertyPrice','existingDebtBalance','renovationReserve','targetSaving']);
  const presets = {
    couple: { income:85000,livingCosts:29000,debts:0,monthlyHomeCosts:9000,savings:1800000,propertyPrice:5200000,interestRate:4.89,years:30,existingDebtBalance:0,purchaseCosts:2.5,renovationReserve:100000,reserveMonths:6,safeHousingShare:40,targetSaving:10000,incomeShock:20,under36:false,purpose:'own' },
    family: { income:108000,livingCosts:43000,debts:3500,monthlyHomeCosts:11500,savings:2250000,propertyPrice:6400000,interestRate:4.89,years:30,existingDebtBalance:160000,purchaseCosts:2.8,renovationReserve:180000,reserveMonths:7,safeHousingShare:38,targetSaving:14000,incomeShock:20,under36:false,purpose:'own' },
    single: { income:54000,livingCosts:22000,debts:0,monthlyHomeCosts:6500,savings:1100000,propertyPrice:3400000,interestRate:4.89,years:30,existingDebtBalance:0,purchaseCosts:2.5,renovationReserve:60000,reserveMonths:6,safeHousingShare:40,targetSaving:7000,incomeShock:25,under36:true,purpose:'own' }
  };

  function monthlyPayment(principal, annualRate, years) {
    if (principal <= 0 || years <= 0) return 0;
    const n = years * 12;
    const r = annualRate / 100 / 12;
    if (Math.abs(r) < 1e-12) return principal / n;
    return principal * r / (1 - Math.pow(1 + r, -n));
  }
  function loanFromPayment(payment, annualRate, years) {
    if (payment <= 0 || years <= 0) return 0;
    const n = years * 12;
    const r = annualRate / 100 / 12;
    if (Math.abs(r) < 1e-12) return payment * n;
    return payment * (1 - Math.pow(1 + r, -n)) / r;
  }
  function setText(id, text) { const el = $(id); if (el) el.textContent = text; }
  function setWidth(id, pct) { const el = $(id); if (el) el.style.width = `${clamp(pct, 2, 100)}%`; }
  function setError(id, message) {
    const input = $(id); if (!input) return;
    const field = input.closest('.field'); if (field) field.classList.toggle('has-error', Boolean(message));
    const err = $(`${id}Error`); if (err) err.textContent = message || '';
  }
  function values() {
    const v = {};
    fields.forEach(id => v[id] = parse($(id).value));
    v.under36 = $('under36').checked;
    v.purpose = state.purpose;
    return v;
  }
  function validate(v) {
    let ok = true;
    const positive = [['income','Zadejte kladný příjem.'],['propertyPrice','Zadejte kladnou cenu.']];
    positive.forEach(([id,msg]) => { const bad = !Number.isFinite(v[id]) || v[id] <= 0; setError(id,bad?msg:''); if (bad) ok=false; });
    ['livingCosts','debts','monthlyHomeCosts','savings','existingDebtBalance','renovationReserve','targetSaving'].forEach(id => { const bad=!Number.isFinite(v[id])||v[id]<0; setError(id,bad?'Hodnota nesmí být záporná.':''); if(bad)ok=false; });
    const ranges = [
      ['interestRate',v.interestRate<0||v.interestRate>20,'Zadejte sazbu od 0 do 20 %.'],
      ['years',v.years<1||v.years>40,'Zadejte 1 až 40 let.'],
      ['purchaseCosts',v.purchaseCosts<0||v.purchaseCosts>20,'Zadejte 0 až 20 %.'],
      ['reserveMonths',v.reserveMonths<0||v.reserveMonths>36,'Zadejte 0 až 36 měsíců.'],
      ['safeHousingShare',v.safeHousingShare<15||v.safeHousingShare>70,'Zadejte 15 až 70 %.'],
      ['incomeShock',v.incomeShock<0||v.incomeShock>80,'Zadejte 0 až 80 %.']
    ];
    ranges.forEach(([id,bad,msg])=>{setError(id,bad?msg:'');if(bad)ok=false;});
    return ok;
  }
  function getLtvCap(v) {
    if (v.purpose === 'investment') return 0.70;
    return v.under36 ? 0.90 : 0.80;
  }
  function solveCurrentScenario(v, rate = v.interestRate, income = v.income, homeCosts = v.monthlyHomeCosts, repairShock = 0) {
    const ltvCap = getLtvCap(v);
    const purchaseExtras = v.propertyPrice * v.purchaseCosts / 100 + v.renovationReserve;
    let reserveTarget = (v.livingCosts + v.debts + homeCosts) * v.reserveMonths;
    let loan = 0, payment = 0, downPayment = 0;
    for (let i=0;i<18;i++) {
      const cashForPrice = Math.max(0, v.savings - purchaseExtras - reserveTarget - repairShock);
      downPayment = Math.min(v.propertyPrice, cashForPrice);
      loan = Math.max(0, v.propertyPrice - downPayment);
      payment = monthlyPayment(loan, rate, v.years);
      const nextReserve = (v.livingCosts + v.debts + homeCosts + payment) * v.reserveMonths;
      if (Math.abs(nextReserve - reserveTarget) < 1) { reserveTarget = nextReserve; break; }
      reserveTarget = nextReserve;
    }
    const actualCashSpent = downPayment + purchaseExtras;
    const savingsAfterPurchase = v.savings - actualCashSpent - repairShock;
    const totalHousing = payment + homeCosts;
    const left = income - v.livingCosts - v.debts - totalHousing;
    return { ltvCap,purchaseExtras,reserveTarget,loan,payment,downPayment,savingsAfterPurchase,totalHousing,left,ltv:v.propertyPrice?loan/v.propertyPrice:0,reserveMonthsActual:(v.livingCosts+v.debts+homeCosts+payment)>0?savingsAfterPurchase/(v.livingCosts+v.debts+homeCosts+payment):0 };
  }
  function safePrice(v) {
    const cap = getLtvCap(v);
    const paymentByShare = Math.max(0, v.income * v.safeHousingShare / 100 - v.monthlyHomeCosts);
    const paymentByCashflow = Math.max(0, v.income - v.livingCosts - v.debts - v.monthlyHomeCosts - v.targetSaving);
    const safePayment = Math.min(paymentByShare, paymentByCashflow);
    const maxLoan = loanFromPayment(safePayment, v.interestRate, v.years);
    const byPayment = cap > 0 ? maxLoan / cap : maxLoan;
    const roughReserve = (v.livingCosts + v.debts + v.monthlyHomeCosts + safePayment) * v.reserveMonths;
    const availableForPrice = v.savings - roughReserve - v.renovationReserve;
    const denominator = (1 - cap) + v.purchaseCosts / 100;
    const byCash = denominator > 0 ? Math.max(0, availableForPrice / denominator) : 0;
    return Math.max(0, Math.min(byPayment, byCash));
  }
  function calculate() {
    const v = values();
    const valid = validate(v);
    $('formError').hidden = valid;
    if (!valid) { $('formError').textContent='Opravte označené vstupy. Výsledek zůstal na poslední platné hodnotě.'; return; }
    const current = solveCurrentScenario(v);
    const cap = current.ltvCap;
    const requiredCash = v.propertyPrice * (1-cap) + current.purchaseExtras + current.reserveTarget;
    const cashGap = v.savings - requiredCash;
    const annualIncome = v.income * 12;
    const dti = annualIncome > 0 ? (current.loan + v.existingDebtBalance) / annualIncome : 0;
    const housingShare = v.income > 0 ? current.totalHousing / v.income : 0;
    const debtServiceShare = v.income > 0 ? (current.payment + v.debts) / v.income : 0;
    const leftoverShare = v.income > 0 ? current.left / v.income : 0;
    const safe = safePrice(v);

    const stressRate = solveCurrentScenario(v, v.interestRate + 2);
    const stressIncome = solveCurrentScenario(v, v.interestRate, v.income * (1-v.incomeShock/100));
    const stressCosts = solveCurrentScenario(v, v.interestRate, v.income, v.monthlyHomeCosts*1.25);
    const stressRepair = solveCurrentScenario(v, v.interestRate, v.income, v.monthlyHomeCosts, 150000);

    const cashflowScore = clamp(100 - Math.max(0,(housingShare-v.safeHousingShare/100)*220) - Math.max(0,(v.targetSaving-current.left)/Math.max(1,v.targetSaving))*45,0,100);
    const ltvScore = clamp(100 - Math.max(0,(current.ltv-cap)*400),0,100);
    const reserveScore = clamp(current.reserveMonthsActual/Math.max(1,v.reserveMonths)*100,0,100);
    const stressScore = clamp((stressIncome.left>=0?55:Math.max(0,55+stressIncome.left/Math.max(1,v.income)*180)) + (stressRate.left>=0?25:Math.max(0,25+stressRate.left/Math.max(1,v.income)*120)) + (stressRepair.reserveMonthsActual>=3?20:stressRepair.reserveMonthsActual/3*20),0,100);
    const dtiThreshold = v.purpose==='investment'?7:8;
    const dtiScore = clamp(100 - Math.max(0,(dti-dtiThreshold)*22),0,100);
    const priceScore = clamp(safe/Math.max(1,v.propertyPrice)*100,0,100);
    const cashScore = cashGap>=0?100:clamp(100-(-cashGap)/Math.max(1,requiredCash)*180,0,100);
    let score = Math.round(cashflowScore*.24 + ltvScore*.15 + reserveScore*.15 + stressScore*.16 + dtiScore*.10 + priceScore*.12 + cashScore*.08);

    let status='safe';
    if (current.left < 0 || current.ltv > cap+.05 || current.reserveMonthsActual < 1.5 || v.propertyPrice > safe*1.25 || cashGap < -requiredCash*.15 || score < 50) status='risk';
    else if (current.left < v.targetSaving || current.ltv > cap || current.reserveMonthsActual < v.reserveMonths-0.05 || stressIncome.left < 0 || v.propertyPrice > safe || cashGap < 0 || score < 75) status='warning';
    if(status==='risk') score=Math.min(score,54);
    else if(status==='warning') score=Math.min(score,74);
    else score=Math.min(score,96);

    const resultPanel = document.querySelector('.result-panel');
    resultPanel.classList.toggle('is-warning',status==='warning');
    resultPanel.classList.toggle('is-risk',status==='risk');
    const heroDot=$('heroDot'); heroDot.className='status-dot'+(status==='warning'?' is-warning':status==='risk'?' is-risk':'');
    const copy = status==='safe' ? {
      hero:'Rozumný scénář',title:'Bydlení vypadá rozumně',label:'Rozumný scénář',decision:'Rozpočet má prostor i po koupi.',text:'Zadaná cena se vejde do rozpočtu, vlastní zdroje a rezerva nepůsobí kriticky. Přesto ověřte nabídku banky a technický stav nemovitosti.'
    } : status==='warning' ? {
      hero:'Napjatý scénář',title:'Bydlení je možné, ale napjaté',label:'Pozor na slabé místo',decision:'Rozhodnutí stojí na malé rezervě.',text:'Jeden nebo více ukazatelů je těsně za bezpečnou hranicí. Největší efekt obvykle přinese nižší cena, vyšší hotovost nebo větší měsíční přebytek.'
    } : {
      hero:'Rizikový scénář',title:'Tento scénář je pro rozpočet rizikový',label:'Rizikový scénář',decision:'Rozpočet nemá dostatečný ochranný prostor.',text:'Současná cena, úvěr nebo rezerva vytvářejí vysokou citlivost na výpadek příjmu a další náklady. Prověřte levnější variantu nebo delší přípravu.'
    };

    setText('heroStatus',copy.hero); setText('heroScore',`${score} / 100`); setText('heroSafePrice',money(safe)); setText('heroHousingShare',percent(housingShare*100)); setText('heroLeftover',money(current.left));
    setText('resultTitle',copy.title); setText('scoreBadge',`${score} / 100`); setText('verdictLabel',copy.label); setText('safePrice',money(safe)); setText('verdictText',v.propertyPrice<=safe?'Prověřovaná cena je pod vypočteným osobním stropem.':'Prověřovaná cena je nad vypočteným osobním stropem.');
    setText('monthlyPayment',money(current.payment)); setText('loanAmountText',`modelový úvěr ${money(current.loan)}`); setText('totalHousingCost',money(current.totalHousing)); setText('housingShareText',`${percent(housingShare*100)} čistého příjmu`); setText('leftAfterAll',money(current.left)); setText('leftAfterAllText',`${percent(leftoverShare*100)} čistého příjmu`); setText('requiredCash',money(requiredCash)); setText('cashGapText',cashGap>=0?`úspory mají rezervu ${money(cashGap)}`:`chybí přibližně ${money(-cashGap)}`);
    setText('decisionTitle',copy.decision); setText('decisionText',copy.text); setText('decisionKicker',status==='safe'?'Hlavní rozhodnutí':status==='warning'?'Těsně pod hranicí':'Zásadní varování');
    setText('ltvValue',percent(current.ltv*100)); setText('ltvNote',current.ltv<=cap?`pod modelovým limitem ${percent(cap*100)}`:`nad modelovým limitem ${percent(cap*100)}`); setWidth('ltvBar',current.ltv/cap*100);
    setText('dtiValue',`${fmt(dti,1,1)}×`); setText('dtiNote',v.purpose==='investment'?'investiční orientace 7×':'orientační bezpečnostní signál'); setWidth('dtiBar',dti/dtiThreshold*100);
    setText('reserveValue',`${fmt(Math.max(0,current.reserveMonthsActual),1,1)} měs.`); setText('reserveNote',`cíl ${fmt(v.reserveMonths,0)} měsíců`); setWidth('reserveBar',current.reserveMonthsActual/Math.max(1,v.reserveMonths)*100);

    setText('stressRateValue',money(stressRate.payment)); setText('stressRateText',`Při sazbě ${fmt(v.interestRate+2,2,2)} % zůstane po všech výdajích ${money(stressRate.left)}.`);
    setText('stressIncomeValue',money(stressIncome.left)); setText('stressIncomeText',`Po poklesu příjmu o ${fmt(v.incomeShock)} % při nezměněných výdajích.`);
    setText('stressCostsValue',money(stressCosts.left)); setText('stressCostsText',`Zůstatek při provozu bydlení vyšším o 25 %.`);
    setText('stressRepairValue',`${fmt(Math.max(0,stressRepair.reserveMonthsActual),1,1)} měs.`); setText('stressRepairText','Rezerva po jednorázovém výdaji 150 000 Kč.');

    const summary = `Dostupnost bydlení: ${copy.hero}, skóre ${score}/100. Doporučený cenový strop ${money(safe)}, modelová splátka ${money(current.payment)}, bydlení celkem ${money(current.totalHousing)}, po všech výdajích ${money(current.left)}, LTV ${percent(current.ltv*100)}, rezerva ${fmt(Math.max(0,current.reserveMonthsActual),1)} měsíce.`;
    $('copyResult').dataset.summary=summary;
    updateAssumptions(v,cap);
  }
  function updateAssumptions(v,cap) {
    setText('assumptionSummary',`sazbu ${fmt(v.interestRate,2,2)} % · ${fmt(v.years)} let · LTV ${percent(cap*100)} · rezervu ${fmt(v.reserveMonths)} měsíců`);
  }
  function setMode(mode) {
    state.mode=mode;
    document.querySelectorAll('[data-mode]').forEach(btn=>{const active=btn.dataset.mode===mode;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));});
    $('advancedPanel').hidden=mode!=='advanced';
    if(mode==='advanced') setTimeout(()=>$('interestRate').focus({preventScroll:true}),0);
  }
  function setPurpose(purpose) {
    state.purpose=purpose;
    document.querySelectorAll('[data-purpose]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.purpose===purpose));
    $('under36').disabled=purpose==='investment';
    if(purpose==='investment') $('under36').checked=false;
    calculate();
  }
  function applyPreset(name) {
    const p=presets[name]||presets.couple; state.preset=name;
    fields.forEach(id=>{if(id in p)$(id).value=moneyFields.has(id)?fmt(p[id],0):String(p[id]).replace('.',',');});
    $('under36').checked=Boolean(p.under36); setPurpose(p.purpose);
    document.querySelectorAll('[data-preset]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.preset===name));
    calculate();
  }
  function bind() {
    document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
    document.querySelectorAll('[data-open-advanced]').forEach(btn=>btn.addEventListener('click',()=>setMode('advanced')));
    document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));
    document.querySelectorAll('[data-purpose]').forEach(btn=>btn.addEventListener('click',()=>setPurpose(btn.dataset.purpose)));
    fields.forEach(id=>{
      $(id).addEventListener('input',calculate);
      if(moneyFields.has(id)) $(id).addEventListener('blur',()=>{const value=parse($(id).value);if(Number.isFinite(value))$(id).value=fmt(value,0);});
    });
    $('under36').addEventListener('change',calculate);
    $('affordForm').addEventListener('submit',e=>{e.preventDefault();calculate();});
    $('resetButton').addEventListener('click',()=>{setMode('basic');applyPreset('couple');});
    $('copyResult').addEventListener('click',async()=>{try{await navigator.clipboard.writeText($('copyResult').dataset.summary||'');const old=$('copyResult').textContent;$('copyResult').textContent='Zkopírováno';setTimeout(()=>$('copyResult').textContent=old,1400);}catch{$('copyResult').textContent='Kopírování se nepodařilo';}});
  }
  function init(){document.addEventListener('keydown',e=>{if(e.key==='Tab')document.body.classList.add('keyboard-user')},{once:true});document.addEventListener('pointerdown',()=>document.body.classList.remove('keyboard-user'));bind();applyPreset('couple');}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();