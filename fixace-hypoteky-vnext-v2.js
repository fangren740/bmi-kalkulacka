(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const nf=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});
  const pf=new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:2,maximumFractionDigits:2});
  const defaults={principal:'3500000',remainingYears:'25',fixYearsA:'3',rateA:'4,49',fixYearsB:'5',rateB:'4,79',feeA:'0',feeB:'0',expectedRate:''};
  const parse=v=>{const n=parseFloat(String(v??'').replace(/\s/g,'').replace(',','.').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?n:NaN};
  const money=n=>`${nf.format(Math.round(n||0))} Kč`;
  const pct=n=>`${pf.format(n||0)} %`;
  const years=n=>`${nf.format(n)} ${n===1?'rok':n>=2&&n<=4?'roky':'let'}`;
  const pay=(p,annual,months)=>{if(!(p>=0&&months>0))return 0;const r=annual/100/12;return Math.abs(r)<1e-12?p/months:p*r/(1-Math.pow(1+r,-months));};
  function simulate({principal,remainingYears,horizonYears,firstRate,fixYears,followRate,fee}){
    const total=Math.max(1,Math.round(remainingYears*12));
    const horizon=Math.min(total,Math.max(1,Math.round(horizonYears*12)));
    const fixed=Math.max(1,Math.round(fixYears*12));
    let bal=principal,interest=0,payment=pay(bal,firstRate,total),firstPayment=payment,afterPayment=payment;
    for(let m=1;m<=horizon;m++){
      if(m===fixed+1){const rem=Math.max(1,total-(m-1));payment=pay(bal,followRate,rem);afterPayment=payment;}
      const annual=m>fixed?followRate:firstRate,r=annual/100/12,intr=bal*r,principalPart=Math.max(0,Math.min(bal,payment-intr));
      bal=Math.max(0,bal-principalPart);interest+=intr;
    }
    return{cost:interest+fee,interest,balance:bal,firstPayment,afterPayment};
  }
  const values=()=>Object.fromEntries(Object.keys(defaults).map(k=>[k,parse($(k)?.value)]));
  function validate(v){const e=[];if(!(v.principal>0))e.push('Zůstatek hypotéky musí být vyšší než 0 Kč.');if(!(v.remainingYears>=1&&v.remainingYears<=40))e.push('Zbývající splatnost musí být 1 až 40 let.');if(!(v.fixYearsA>=1&&v.fixYearsB>=1&&v.fixYearsA<v.fixYearsB))e.push('Varianta A musí mít kratší fixaci než varianta B.');if(!(v.fixYearsB<=v.remainingYears))e.push('Delší fixace nemůže být delší než zbývající splatnost.');if(!(v.rateA>=0&&v.rateA<=20&&v.rateB>=0&&v.rateB<=20))e.push('Sazby musí být mezi 0 a 20 %.');if(!(v.feeA>=0&&v.feeB>=0))e.push('Jednorázové náklady nemohou být záporné.');if(Number.isFinite(v.expectedRate)&&!(v.expectedRate>=0&&v.expectedRate<=20))e.push('Vlastní odhad refixace musí být mezi 0 a 20 %.');return e;}
  const config=(v,side,follow)=>{const a=side==='A';return{principal:v.principal,remainingYears:v.remainingYears,horizonYears:v.fixYearsB,firstRate:a?v.rateA:v.rateB,fixYears:a?v.fixYearsA:v.fixYearsB,followRate:follow??(a?v.rateA:v.rateB),fee:a?v.feeA:v.feeB};};
  function breakEven(v,longRes){const diff=r=>simulate(config(v,'A',r)).cost-longRes.cost;let lo=0,hi=20,dLo=diff(lo),dHi=diff(hi);if(Math.sign(dLo)===Math.sign(dHi))return null;for(let i=0;i<80;i++){const mid=(lo+hi)/2,d=diff(mid);if(Math.sign(d)===Math.sign(dLo)){lo=mid;dLo=d}else hi=mid;}return(lo+hi)/2;}
  const set=(id,t)=>{const e=$(id);if(e)e.textContent=t;};
  function calculate(){
    const v=values(),errors=validate(v),box=$('formError');
    if(errors.length){box.hidden=false;box.textContent=errors[0];document.body.dataset.calculationState='invalid';return;}
    box.hidden=true;document.body.dataset.calculationState='ready';
    const longRes=simulate(config(v,'B',v.rateB)),be=breakEven(v,longRes),threshold=be??v.rateA,shortAtBe=simulate(config(v,'A',threshold));
    set('heroPrincipal',money(v.principal));set('heroShortYears',nf.format(v.fixYearsA));set('heroShortRate',pct(v.rateA));set('heroLongYears',nf.format(v.fixYearsB));set('heroLongRate',pct(v.rateB));set('heroBreakEven',be===null?'mimo rozsah':pct(be));
    set('breakEvenRate',be===null?'mimo rozsah':pct(be));set('mapThreshold',be===null?'—':pct(be));set('paymentA',money(shortAtBe.firstPayment));set('paymentB',money(longRes.firstPayment));set('horizonLabel',years(v.fixYearsB));set('costA',money(shortAtBe.cost));set('costB',money(longRes.cost));set('balanceA',money(shortAtBe.balance));set('balanceB',money(longRes.balance));
    if(be===null){set('verdictTitle','V běžném rozsahu nevzniká bod zlomu');set('verdictText','Rozdíl sazeb nebo zadaných nákladů je tak velký, že se varianty v rozsahu 0–20 % budoucí sazby neprotnou. Zkontrolujte vstupy a úplné podmínky nabídek.');set('breakEvenDelta','Zkontrolujte sazby a jednorázové náklady.');}
    else{const d=be-v.rateA;set('verdictTitle',`Po ${nf.format(v.fixYearsA)} letech může sazba vystoupat přibližně na ${pct(be)}`);set('verdictText',`Pod touto hranicí vychází v ${nf.format(v.fixYearsB)}letém horizontu levněji kratší fixace. Nad ní přebírá výhodu delší fixace.`);set('breakEvenDelta',`${d>=0?'+':''}${pf.format(d)} p. b. proti dnešní sazbě A`);}
    const exp=$('expectedScenario');if(Number.isFinite(v.expectedRate)){const s=simulate(config(v,'A',v.expectedRate)),delta=s.cost-longRes.cost,shortWins=delta<0;exp.hidden=false;set('expectedVerdict',shortWins?`Při ${pct(v.expectedRate)} vychází levněji kratší fixace`:`Při ${pct(v.expectedRate)} vychází levněji delší fixace`);set('expectedDetail',`Rozdíl úroků + zadaných jednorázových nákladů je přibližně ${money(Math.abs(delta))} za ${years(v.fixYearsB)}.`);}else exp.hidden=true;
  }
  function reset(){for(const[k,v]of Object.entries(defaults))if($(k))$(k).value=v;calculate();}
  let timer;document.querySelectorAll('#fixationForm input').forEach(el=>{el.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(calculate,90)});el.addEventListener('change',calculate)});
  $('fixationForm')?.addEventListener('submit',e=>e.preventDefault());$('resetBtn')?.addEventListener('click',reset);
  const menu=document.querySelector('.menu-btn'),nav=$('mobile-nav');menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav?.classList.toggle('is-open',!open)});nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu?.setAttribute('aria-expanded','false');nav.classList.remove('is-open')}));
  calculate();
})();
