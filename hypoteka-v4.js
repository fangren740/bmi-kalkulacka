/* RychléVýpočty.cz · Mortgage X-Ray V-next · deterministic core + UI */
(function(){
  'use strict';
  const EPS=1e-8;
  const core={
    annuity(principal, annualRatePct, months){
      principal=Number(principal); annualRatePct=Number(annualRatePct); months=Math.round(Number(months));
      if(!(principal>=0)||!(annualRatePct>=0)||!(months>0)) return NaN;
      if(principal===0) return 0;
      const r=annualRatePct/100/12;
      if(Math.abs(r)<EPS) return principal/months;
      return principal*r/(1-Math.pow(1+r,-months));
    },
    amortize(principal, annualRatePct, months){
      const payment=core.annuity(principal,annualRatePct,months);
      if(!Number.isFinite(payment)) return null;
      const r=annualRatePct/100/12;
      let balance=principal,totalInterest=0,totalPrincipal=0;
      const rows=[];
      for(let m=1;m<=months;m++){
        const interest=Math.abs(r)<EPS?0:balance*r;
        let principalPart=payment-interest;
        let actualPayment=payment;
        if(principalPart>balance || m===months){principalPart=balance;actualPayment=interest+principalPart;}
        balance=Math.max(0,balance-principalPart);
        totalInterest+=interest;totalPrincipal+=principalPart;
        rows.push({month:m,payment:actualPayment,interest,principal:principalPart,balance,totalInterest,totalPrincipal});
        if(balance<=0.005) break;
      }
      return {payment,totalInterest,totalPaid:principal+totalInterest,rows};
    },
    balanceAfter(principal, annualRatePct, totalMonths, elapsedMonths){
      const plan=core.amortize(principal,annualRatePct,totalMonths);
      if(!plan) return NaN;
      if(elapsedMonths<=0) return principal;
      const row=plan.rows[Math.min(Math.round(elapsedMonths),plan.rows.length)-1];
      return row?row.balance:0;
    },
    refix(principal, currentRatePct, totalMonths, fixMonths, newRatePct){
      fixMonths=Math.max(0,Math.min(Math.round(fixMonths),totalMonths));
      const original=core.amortize(principal,currentRatePct,totalMonths);
      if(!original) return null;
      if(fixMonths<=0 || fixMonths>=totalMonths) return {balance:principal,payment:original.payment,delta:0,remainingMonths:totalMonths};
      const balance=core.balanceAfter(principal,currentRatePct,totalMonths,fixMonths);
      const remainingMonths=totalMonths-fixMonths;
      const payment=core.annuity(balance,newRatePct,remainingMonths);
      return {balance,payment,delta:payment-original.payment,remainingMonths};
    },
    ltv(loan,property){return property>0?loan/property*100:null}
  };
  if(typeof module!=='undefined'&&module.exports) module.exports=core;
  if(typeof window!=='undefined') window.RVMortgageCore=core;
  if(typeof document==='undefined') return;

  const $=id=>document.getElementById(id);
  const els={
    form:$('mortgageForm'),loan:$('loan'),rate:$('rate'),years:$('years'),property:$('propertyValue'),fix:$('fixYears'),refix:$('refixRate'),error:$('inputError'),
    monthly:$('monthlyPayment'),caption:$('paymentCaption'),totalInterest:$('totalInterest'),totalPaid:$('totalPaid'),firstTotal:$('firstPaymentTotal'),firstInterest:$('firstInterest'),firstPrincipal:$('firstPrincipal'),interestShare:$('firstInterestShare'),principalShare:$('firstPrincipalShare'),interestBar:$('interestBar'),principalBar:$('principalBar'),yearInterest:$('year1Interest'),yearPrincipal:$('year1Principal'),yearBalance:$('year1Balance'),ltvBox:$('ltvResult'),ltvValue:$('ltvValue'),ltvText:$('ltvText'),refixBox:$('refixResult'),fixBalance:$('fixBalance'),refixPayment:$('refixPayment'),refixDelta:$('refixDelta'),refixText:$('refixText'),milestones:$('milestones'),scenarioGrid:$('scenarioGrid'),chartLine:$('debtLine'),chartArea:$('debtArea'),chartDots:$('debtDots'),chartEnd:$('chartEndLabel'),chartStart:$('axisStart'),chartBalanceNow:$('chartBalanceNow'),copy:$('copyBtn'),share:$('shareBtn'),reset:$('resetBtn')
  };
  const CZK=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
  const PCT=new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:2,maximumFractionDigits:2});
  const money=v=>`${CZK.format(Math.round(v))} Kč`;
  const pct=v=>`${PCT.format(v)} %`;
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  const num=el=>Number(el.value);

  function validate(){
    const loan=num(els.loan),rate=num(els.rate),years=num(els.years);
    const problems=[];
    if(!(loan>=100000&&loan<=50000000)) problems.push('Výše hypotéky musí být mezi 100 000 a 50 000 000 Kč.');
    if(!(rate>=0&&rate<=30)) problems.push('Úroková sazba musí být mezi 0 a 30 %.');
    if(!(years>=1&&years<=50)) problems.push('Splatnost musí být mezi 1 a 50 lety.');
    const property=num(els.property); if(els.property.value!==''&&!(property>0&&property<=100000000)) problems.push('Hodnota nemovitosti musí být kladná a nejvýše 100 000 000 Kč.');
    if(!els.refix.disabled){const r=num(els.refix);if(!(r>=0&&r<=30)) problems.push('Modelová sazba po fixaci musí být mezi 0 a 30 %.');}
    els.error.hidden=problems.length===0; els.error.textContent=problems[0]||'';
    return problems.length===0;
  }
  function getInputs(){return {loan:num(els.loan),rate:num(els.rate),years:Math.round(num(els.years)),property:els.property.value===''?null:num(els.property),fixYears:Number(els.fix.value),refixRate:num(els.refix)}}
  function rowAt(plan,months,principal){if(months<=0)return {balance:principal,totalInterest:0,totalPrincipal:0};return plan.rows[Math.min(months,plan.rows.length)-1]||plan.rows[plan.rows.length-1]}

  function render(){
    if(!validate()) return;
    const v=getInputs(),months=v.years*12,plan=core.amortize(v.loan,v.rate,months); if(!plan)return;
    const first=plan.rows[0],year=rowAt(plan,Math.min(12,months),v.loan);
    const interestShare=plan.payment?first.interest/plan.payment*100:0,principalShare=100-interestShare;
    els.monthly.textContent=money(plan.payment); els.caption.textContent=`při ${pct(v.rate)} p. a. na ${v.years} ${v.years===1?'rok':v.years<5?'roky':'let'}`;
    els.totalInterest.textContent=money(plan.totalInterest); els.totalPaid.textContent=money(plan.totalPaid);
    els.firstTotal.textContent=money(first.payment);els.firstInterest.textContent=money(first.interest);els.firstPrincipal.textContent=money(first.principal);els.interestShare.textContent=pct(interestShare);els.principalShare.textContent=pct(principalShare);els.interestBar.style.width=`${clamp(interestShare,0,100)}%`;els.principalBar.style.width=`${clamp(principalShare,0,100)}%`;
    els.yearInterest.textContent=money(year.totalInterest);els.yearPrincipal.textContent=money(year.totalPrincipal);els.yearBalance.textContent=money(year.balance);
    renderLtv(v);renderRefix(v,months);renderMilestones(v,plan);renderScenarios(v);renderChart(v,plan);updateUrlSilently(v);
  }
  function renderLtv(v){
    if(!(v.property>0)){els.ltvBox.hidden=true;return} els.ltvBox.hidden=false;
    const l=core.ltv(v.loan,v.property),own=v.property-v.loan;els.ltvValue.textContent=pct(l);
    let msg=`Úvěr tvoří ${pct(l)} z hodnoty zástavy. `;
    if(own>=0) msg+=`Rozdíl mezi hodnotou nemovitosti a úvěrem je ${money(own)}.`; else msg+=`Úvěr je o ${money(Math.abs(own))} vyšší než zadaná hodnota nemovitosti.`;
    msg+=' ČNB aktuálně uvádí obecnou horní hranici 80 % a 90 % pro žadatele mladší 36 let při financování vlastního bydlení; konkrétní posouzení dělá banka.';
    els.ltvText.textContent=msg;
  }
  function renderRefix(v,months){
    if(!(v.fixYears>0)){els.refixBox.hidden=true;return} els.refixBox.hidden=false;
    const fixMonths=Math.min(v.fixYears*12,months-1),r=core.refix(v.loan,v.rate,months,fixMonths,v.refixRate); if(!r){els.refixBox.hidden=true;return}
    els.fixBalance.textContent=money(r.balance);els.refixPayment.textContent=money(r.payment);const sign=r.delta>0?'+':'';els.refixDelta.textContent=`${sign}${money(r.delta)}`;
    els.refixText.textContent=`Po ${v.fixYears} ${v.fixYears===1?'roce':v.fixYears<5?'letech':'letech'} modelujeme sazbu ${pct(v.refixRate)} pro zbývajících ${Math.round(r.remainingMonths/12*10)/10} roku. Nejde o předpověď budoucí sazby.`;
  }
  function renderMilestones(v,plan){
    const points=[1,5,10,20,v.years].filter((x,i,a)=>x<=v.years&&a.indexOf(x)===i).sort((a,b)=>a-b);
    els.milestones.innerHTML=points.map(y=>{const row=rowAt(plan,Math.min(y*12,plan.rows.length),v.loan),paid=(1-row.balance/v.loan)*100;return `<div><span>${y===v.years?'Konec':y+'. rok'}</span><b><i style="width:${clamp(paid,0,100).toFixed(2)}%"></i></b><strong>${money(row.balance)}</strong></div>`}).join('');
  }
  function renderScenarios(v){
    const deltas=[-1,0,1,2];
    els.scenarioGrid.innerHTML=deltas.map(d=>{const rate=Math.max(0,v.rate+d),p=core.amortize(v.loan,rate,v.years*12),delta=p.payment-core.annuity(v.loan,v.rate,v.years*12);return `<article class="scenario-card ${d===0?'current':''}"><span>${d===0?'Váš model':d>0?'Sazba +'+d+' p. b.':'Sazba −1 p. b.'}</span><b>${pct(rate)} p. a.</b><strong>${money(p.payment)}</strong><small>${d===0?'výchozí měsíční splátka':`${delta>=0?'+':''}${money(delta)} měsíčně oproti vašemu modelu`} · úroky celkem ${money(p.totalInterest)}</small>${d===0?'<i>VÝCHOZÍ</i>':''}</article>`}).join('');
  }
  function renderChart(v,plan){
    const W=800,H=300,left=56,right=768,top=34,bottom=244,total=plan.rows.length;
    const samples=[0];for(let m=12;m<total;m+=12)samples.push(m);samples.push(total);
    const pts=samples.map(m=>{const balance=m===0?v.loan:rowAt(plan,m,v.loan).balance;const x=left+(right-left)*(m/total),y=bottom-(bottom-top)*(balance/v.loan);return {x,y,m,balance}});
    const line=pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');els.chartLine.setAttribute('d',line);els.chartArea.setAttribute('d',`${line} L${right},${bottom} L${left},${bottom} Z`);
    const dotYears=[0,5,10,20,v.years].filter((y,i,a)=>y<=v.years&&a.indexOf(y)===i);els.chartDots.innerHTML=dotYears.map(y=>{const m=Math.min(y*12,total),balance=m===0?v.loan:rowAt(plan,m,v.loan).balance,x=left+(right-left)*(m/total),yy=bottom-(bottom-top)*(balance/v.loan);return `<circle cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" r="5"></circle>${y>0&&y<v.years?`<text x="${x.toFixed(1)}" y="${Math.max(18,yy-12).toFixed(1)}" text-anchor="middle">${y} r.</text>`:''}`}).join('');
    els.chartEnd.textContent=`${v.years} let`;els.chartStart.textContent=`${(v.loan/1e6).toLocaleString('cs-CZ',{maximumFractionDigits:1})} mil. Kč`;els.chartBalanceNow.textContent=`${money(v.loan)} → 0 Kč`;
  }
  function updateUrlSilently(v){
    if(!history.replaceState)return;try{const u=new URL(location.href);u.search='';u.searchParams.set('uver',Math.round(v.loan));u.searchParams.set('sazba',v.rate.toFixed(2));u.searchParams.set('roky',v.years);if(v.property)u.searchParams.set('hodnota',Math.round(v.property));if(v.fixYears){u.searchParams.set('fixace',v.fixYears);u.searchParams.set('refix',v.refixRate.toFixed(2));}history.replaceState(null,'',u.pathname+'?'+u.searchParams.toString()+u.hash);}catch(e){/* about:blank / locked-down preview: calculation remains fully functional */}
  }
  function loadUrl(){const q=new URLSearchParams(location.search);const set=(el,key,min,max)=>{if(!q.has(key))return;const v=Number(q.get(key));if(Number.isFinite(v)&&v>=min&&v<=max)el.value=v};set(els.loan,'uver',100000,50000000);set(els.rate,'sazba',0,30);set(els.years,'roky',1,50);set(els.property,'hodnota',1,100000000);if(q.has('fixace')){const f=String(Number(q.get('fixace')));if([...els.fix.options].some(o=>o.value===f))els.fix.value=f}set(els.refix,'refix',0,30);syncFix();}
  function syncFix(){
    const termYears=Math.max(1,Math.round(num(els.years))||1);
    [...els.fix.options].forEach(o=>{const y=Number(o.value);o.disabled=y>0&&y>=termYears});
    if(Number(els.fix.value)>=termYears) els.fix.value='0';
    const active=Number(els.fix.value)>0;
    els.refix.disabled=!active;
    if(active)$('advancedPanel').open=true;
  }
  async function copyText(text,button,label){try{await navigator.clipboard.writeText(text);const old=button.textContent;button.textContent=label;setTimeout(()=>button.textContent=old,1600)}catch(e){button.textContent='Kopírování selhalo';setTimeout(()=>button.textContent='Kopírovat',1600)}}
  function resultText(){const v=getInputs(),plan=core.amortize(v.loan,v.rate,v.years*12),first=plan.rows[0];return `Hypotéka ${money(v.loan)}, ${pct(v.rate)} p. a., ${v.years} let\nMěsíční splátka: ${money(plan.payment)}\nCelkové úroky při stejné sazbě: ${money(plan.totalInterest)}\nPrvní splátka: úrok ${money(first.interest)}, jistina ${money(first.principal)}\nVýpočet: RychléVýpočty.cz`}
  els.form.addEventListener('input',e=>{if(e.target===els.years)syncFix();render()});els.fix.addEventListener('change',()=>{syncFix();render()});document.querySelectorAll('[data-loan]').forEach(b=>b.addEventListener('click',()=>{els.loan.value=b.dataset.loan;render()}));els.reset.addEventListener('click',()=>{els.form.reset();els.loan.value=4000000;els.rate.value='5.00';els.years.value=30;els.property.value='';els.fix.value='0';els.refix.value='6.00';syncFix();render()});els.copy.addEventListener('click',()=>copyText(resultText(),els.copy,'Zkopírováno ✓'));els.share.addEventListener('click',()=>copyText(location.href,els.share,'Odkaz zkopírován ✓'));
  const menu=$('menuToggle'),nav=$('mainNav');
  if(menu&&nav){menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav.classList.toggle('is-open',!open)});document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open')}})}
  loadUrl();render();
})();
