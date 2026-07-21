(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const czk = value => new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0}).format(Number.isFinite(value)?value:0);
  const num = (id, fallback=0) => { const v = Number($(id)?.value); return Number.isFinite(v) ? v : fallback; };
  const pct = value => `${new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(Number.isFinite(value)?value:0)} %`;
  const monthsText = months => { const y=Math.floor(months/12), m=months%12; return [y?`${y} let`:null,m?`${m} měs.`:null].filter(Boolean).join(' ') || '0 měs.'; };

  const defaults = {
    basicLoan:4000000,basicRate:4.89,basicYears:30,basicFee:0,basicProperty:5000000,basicIncome:70000,
    proLoan:4000000,proProperty:5000000,proRate:4.89,proYears:30,proFee:0,proIncome:70000,proOtherDebt:0,
    fixYears:5,refixRate:6.0,extraMonthly:0,extraOneTime:0,extraMonth:60,insuranceMonthly:0,taxRate:15
  };

  function annuity(principal, annualRate, months){
    if(principal<=0 || months<=0) return 0;
    const r=annualRate/100/12;
    return r===0 ? principal/months : principal*(r*Math.pow(1+r,months))/(Math.pow(1+r,months)-1);
  }

  function baseValues(){
    const pro = $('proPanel')?.classList.contains('is-active');
    if(pro){
      return {
        loan:num('proLoan'), property:num('proProperty'), rate:num('proRate'), years:num('proYears'), fee:num('proFee'), income:num('proIncome'), otherDebt:num('proOtherDebt'),
        fixYears:num('fixYears'), refixRate:num('refixRate'), extraMonthly:num('extraMonthly'), extraOneTime:num('extraOneTime'), extraMonth:Math.round(num('extraMonth')), insurance:num('insuranceMonthly'),
        taxEnabled:$('taxEnabled')?.checked, taxRate:num('taxRate',15), strategy:$('extraStrategy')?.value || 'term', pro:true
      };
    }
    return {
      loan:num('basicLoan'), property:num('basicProperty'), rate:num('basicRate'), years:num('basicYears'), fee:num('basicFee'), income:num('basicIncome'), otherDebt:0,
      fixYears:0, refixRate:num('basicRate'), extraMonthly:0, extraOneTime:0, extraMonth:0, insurance:0,taxEnabled:false,taxRate:15,strategy:'term',pro:false
    };
  }

  function validate(v){
    if(v.loan<=0) return 'Zadejte kladnou výši hypotéky.';
    if(v.property<=0) return 'Zadejte hodnotu nemovitosti.';
    if(v.rate<0 || v.rate>30) return 'Úroková sazba musí být mezi 0 a 30 %.';
    if(v.years<1 || v.years>45) return 'Splatnost nastavte mezi 1 a 45 lety.';
    if(v.fixYears<0 || v.fixYears>v.years) return 'Délka fixace nemůže překročit celou splatnost.';
    if(v.refixRate<0 || v.refixRate>30) return 'Sazba po fixaci musí být mezi 0 a 30 %.';
    if(v.extraMonth<0 || v.extraMonth>v.years*12) return 'Měsíc jednorázové splátky musí ležet v době splácení.';
    return '';
  }

  function simulate(v,{useRefix=false,useExtras=false}={}){
    const originalMonths=Math.round(v.years*12);
    const fixMonth=useRefix ? Math.min(originalMonths,Math.round(v.fixYears*12)) : originalMonths;
    let balance=v.loan;
    let month=0;
    let annualRate=v.rate;
    let basePayment=annuity(balance,annualRate,originalMonths);
    let totalInterest=0,totalPrincipal=0,totalFees=0,firstYearInterest=0;
    let oneTimeApplied=false;
    let balanceAtFix=fixMonth===0?balance:0;
    const rows=[];
    const yearAgg={};
    const maxMonths=720;
    while(balance>0.01 && month<maxMonths){
      month++;
      if(useRefix && month===fixMonth+1 && fixMonth<originalMonths){
        annualRate=v.refixRate;
        basePayment=annuity(balance,annualRate,Math.max(1,originalMonths-month+1));
      }
      const rate=annualRate/100/12;
      const interest=rate===0?0:balance*rate;
      let principal=Math.max(0,basePayment-interest);
      let extra=useExtras?Math.max(0,v.extraMonthly):0;
      if(useExtras && !oneTimeApplied && v.extraOneTime>0 && month===Math.max(1,v.extraMonth)){
        extra+=v.extraOneTime; oneTimeApplied=true;
      }
      principal=Math.min(balance,principal+extra);
      const payment=interest+principal;
      balance=Math.max(0,balance-principal);
      totalInterest+=interest; totalPrincipal+=principal; totalFees+=Math.max(0,v.fee+v.insurance);
      if(month<=12) firstYearInterest+=interest;
      if(month===fixMonth) balanceAtFix=balance;
      const y=Math.ceil(month/12);
      yearAgg[y] ||= {year:y,payments:0,interest:0,principal:0,fees:0,balance:0,rate:annualRate};
      yearAgg[y].payments+=payment; yearAgg[y].interest+=interest; yearAgg[y].principal+=principal; yearAgg[y].fees+=Math.max(0,v.fee+v.insurance); yearAgg[y].balance=balance; yearAgg[y].rate=annualRate;
      if(useExtras && oneTimeApplied && v.strategy==='payment' && month===Math.max(1,v.extraMonth) && balance>0){
        const remaining=Math.max(1,originalMonths-month);
        basePayment=annuity(balance,annualRate,remaining);
      }
      if(month>originalMonths && !useExtras) break;
    }
    const schedule=Object.values(yearAgg);
    return {
      months:month, monthlyInitial:annuity(v.loan,v.rate,originalMonths), monthlyAfterFix: useRefix&&fixMonth<originalMonths ? annuity(balanceAtFix,v.refixRate,Math.max(1,originalMonths-fixMonth)) : annuity(v.loan,v.rate,originalMonths),
      totalInterest,totalPrincipal,totalFees,totalPaid:totalInterest+totalPrincipal+totalFees,firstYearInterest,balanceAtFix,schedule
    };
  }

  function metrics(v){
    const baseline=simulate(v,{useRefix:false,useExtras:false});
    const refix=simulate(v,{useRefix:v.fixYears>0,useExtras:false});
    const optimized=simulate(v,{useRefix:v.fixYears>0,useExtras:v.extraMonthly>0||v.extraOneTime>0});
    const ltv=v.property>0?v.loan/v.property*100:0;
    const monthlyAll=baseline.monthlyInitial+v.fee+v.insurance;
    const burden=v.income>0?(monthlyAll+v.otherDebt)/v.income*100:0;
    const stress=annuity(v.loan,v.rate+2,v.years*12)+v.fee+v.insurance;
    const taxBase=Math.min(150000,baseline.firstYearInterest);
    const taxSaving=v.taxEnabled?taxBase*(v.taxRate/100):0;
    return {baseline,refix,optimized,ltv,monthlyAll,burden,stress,taxSaving};
  }

  function set(id,text){ if($(id)) $(id).textContent=text; }
  function setWidth(id,val){ if($(id)) $(id).style.width=`${Math.max(0,Math.min(100,val))}%`; }

  function verdict(v,m){
    const refixAll=m.refix.monthlyAfterFix+v.fee+v.insurance;
    if(m.ltv<=80 && m.burden<=35 && (v.income<=0 || (refixAll+v.otherDebt)/v.income*100<=42)) return ['Stabilnější scénář','Splátka, LTV i zátěž příjmu působí relativně rozumně. Přesto zachovejte rezervu a porovnejte nabídky podle RPSN, poplatků a podmínek fixace.','good'];
    if(m.ltv>90 || m.burden>45 || (v.income>0&&(refixAll+v.otherDebt)/v.income*100>52)) return ['Rizikovější scénář','Vysoké LTV nebo velký podíl splátek na příjmu dělá úvěr citlivý na výpadek příjmu a změnu sazby. Zvažte nižší úvěr, vyšší vlastní zdroje nebo delší rezervu.','risk'];
    return ['Scénář vyžaduje rezervu','Výsledek může být použitelný, ale rozpočet je potřeba otestovat při vyšší sazbě, dalších nákladech bydlení a méně příznivém měsíci.','warn'];
  }

  function renderSchedule(rows,fixYears){
    const body=$('scheduleBody'); if(!body) return;
    const selected=[];
    rows.forEach(r=>{ if(r.year<=5 || r.year===fixYears || r.year%5===0 || r.year===rows.length) selected.push(r); });
    const unique=selected.filter((r,i,a)=>a.findIndex(x=>x.year===r.year)===i);
    body.innerHTML=unique.map(r=>`<tr><td>${r.year}. rok</td><td>${czk(r.payments+r.fees)}</td><td>${czk(r.interest)}</td><td>${czk(r.principal)}</td><td>${czk(r.balance)}</td><td>${pct(r.rate)}</td></tr>`).join('');
    const bars=$('balanceBars'); if(!bars) return;
    const max=Math.max(...unique.map(r=>r.balance),1);
    bars.innerHTML=unique.slice(0,12).map(r=>`<div class="mort-bar ${r.year===fixYears?'is-refix':''}" style="height:${Math.max(5,r.balance/max*100)}%" data-year="${r.year}"></div>`).join('');
  }

  function render(){
    const v=baseValues(); const error=validate(v); const box=$('calcError');
    if(error){ if(box){box.hidden=false;box.textContent=error;} return; }
    if(box){box.hidden=true;box.textContent='';}
    const m=metrics(v); const [label,message,state]=verdict(v,m);
    set('resultPayment',czk(m.monthlyAll));
    set('resultPaymentNote',`Samotná anuitní splátka ${czk(m.baseline.monthlyInitial)} + poplatky a pojištění ${czk(v.fee+v.insurance)}.`);
    set('resultInterest',czk(m.baseline.totalInterest));
    set('resultTotal',czk(m.baseline.totalPaid));
    set('resultLtv',pct(m.ltv));
    set('resultBurden',v.income>0?pct(m.burden):'nezadáno');
    set('resultStress',czk(m.stress));
    set('resultFirstYearInterest',czk(m.baseline.firstYearInterest));
    set('resultRefixPayment',v.fixYears>0&&v.fixYears<v.years?czk(m.refix.monthlyAfterFix+v.fee+v.insurance):'bez změny');
    set('resultFixBalance',czk(m.refix.balanceAtFix));
    set('resultOptimizedTerm',monthsText(m.optimized.months));
    set('resultInterestSaved',czk(Math.max(0,m.refix.totalInterest-m.optimized.totalInterest)));
    set('resultTaxSaving',v.taxEnabled?czk(m.taxSaving):'nezapočteno');
    set('resultVerdict',label); set('resultMessage',message);
    const verdictEl=$('resultVerdict'); if(verdictEl) verdictEl.dataset.state=state;
    setWidth('heroLtvBar',m.ltv); setWidth('heroBurdenBar',m.burden);
    set('heroPayment',czk(m.monthlyAll)); set('heroLtv',pct(m.ltv)); set('heroInterest',czk(m.baseline.totalInterest)); set('heroStress',czk(m.stress));
    set('stressRatePayment',czk(m.stress));
    set('stressRefixPayment',v.fixYears>0?czk(m.refix.monthlyAfterFix+v.fee+v.insurance):czk(m.monthlyAll));
    set('stressIncomeBurden',v.income>0?pct((m.stress+v.otherDebt)/v.income*100):'nezadáno');
    const reserve6=(m.stress+v.otherDebt)*6; set('stressReserve',czk(reserve6));
    set('compareBaseInterest',czk(m.baseline.totalInterest)); set('compareRefixInterest',czk(m.refix.totalInterest)); set('compareOptimizedInterest',czk(m.optimized.totalInterest));
    set('compareBaseTerm',monthsText(m.baseline.months)); set('compareRefixTerm',monthsText(m.refix.months)); set('compareOptimizedTerm',monthsText(m.optimized.months));
    renderSchedule(m.optimized.schedule,Math.round(v.fixYears));
  }

  function syncBasicToPro(){
    const pairs=[['basicLoan','proLoan'],['basicProperty','proProperty'],['basicRate','proRate'],['basicYears','proYears'],['basicFee','proFee'],['basicIncome','proIncome']];
    pairs.forEach(([a,b])=>{ if($(a)&&$(b)) $(b).value=$(a).value; });
  }
  function syncProToBasic(){
    const pairs=[['proLoan','basicLoan'],['proProperty','basicProperty'],['proRate','basicRate'],['proYears','basicYears'],['proFee','basicFee'],['proIncome','basicIncome']];
    pairs.forEach(([a,b])=>{ if($(a)&&$(b)) $(b).value=$(a).value; });
  }

  $$('.mort-mode-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const mode=btn.dataset.mode;
    if(mode==='pro') syncBasicToPro(); else syncProToBasic();
    $$('.mort-mode-btn').forEach(b=>b.classList.toggle('is-active',b===btn));
    $('basicPanel')?.classList.toggle('is-active',mode==='basic'); $('proPanel')?.classList.toggle('is-active',mode==='pro'); render();
  }));

  let step=0; const stages=$$('.mort-stage'),steps=$$('.mort-step');
  function showStep(i){ step=Math.max(0,Math.min(stages.length-1,i)); stages.forEach((s,n)=>s.classList.toggle('is-active',n===step)); steps.forEach((s,n)=>{s.classList.toggle('is-active',n===step);s.classList.toggle('is-done',n<step);}); set('stepCounter',`Krok ${step+1} ze ${stages.length}`); if($('prevStep')) $('prevStep').disabled=step===0; if($('nextStep')) $('nextStep').textContent=step===stages.length-1?'Hotovo':'Pokračovat'; }
  steps.forEach((s,i)=>s.addEventListener('click',()=>showStep(i)));
  $('prevStep')?.addEventListener('click',()=>showStep(step-1)); $('nextStep')?.addEventListener('click',()=>showStep(step+1));

  $$('.mort-presets button').forEach(btn=>btn.addEventListener('click',()=>{
    const p=btn.dataset.preset;
    const presets={balanced:{loan:4000000,property:5000000,rate:4.89,years:30,income:70000},lower:{loan:3000000,property:4500000,rate:4.59,years:25,income:75000},higher:{loan:6000000,property:7500000,rate:5.19,years:30,income:110000}};
    const x=presets[p]||presets.balanced;
    ['basic','pro'].forEach(prefix=>{ const map={Loan:x.loan,Property:x.property,Rate:x.rate,Years:x.years,Income:x.income}; Object.entries(map).forEach(([k,val])=>{const el=$(prefix+k);if(el)el.value=val;}); }); render();
  }));

  $$('input,select').forEach(el=>el.addEventListener('input',render));
  $('calculateBtn')?.addEventListener('click',render);
  $('resetBtn')?.addEventListener('click',()=>{ Object.entries(defaults).forEach(([id,val])=>{if($(id))$(id).value=val;}); if($('taxEnabled'))$('taxEnabled').checked=false; if($('extraStrategy'))$('extraStrategy').value='term'; showStep(0); render(); });
  $('printBtn')?.addEventListener('click',()=>window.print());
  $('copyBtn')?.addEventListener('click',async()=>{ const v=baseValues(),m=metrics(v); const text=`Hypotéka ${czk(v.loan)} | splátka ${czk(m.monthlyAll)} | úroky ${czk(m.baseline.totalInterest)} | LTV ${pct(m.ltv)} | stresová splátka ${czk(m.stress)}`; try{await navigator.clipboard.writeText(text);set('copyBtn','Zkopírováno');setTimeout(()=>set('copyBtn','Kopírovat'),1600);}catch{set('copyBtn','Kopírování selhalo');} });
  showStep(0); render();
})();
