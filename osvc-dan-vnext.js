(() => {
  'use strict';
  const CFG = {
    year: 2026,
    taxThreshold: 1762812,
    taxpayerCredit: 30840,
    socialRate: 0.292,
    socialBaseShare: 0.55,
    socialMaxBase: 2350416,
    socialMainMinMonthlyBase: 17139,
    socialNewMinMonthlyBase: 12242,
    socialSideMinMonthlyBase: 5387,
    sideThresholdFull: 117521,
    sideThresholdReduction: 9794,
    healthRate: 0.135,
    healthBaseShare: 0.5,
    healthMinMonthlyBase: 24483.5,
    flatCaps: {80:1600000,60:1200000,40:800000,30:600000}
  };
  const $ = id => document.getElementById(id);
  const num = (id, fallback=0) => { const v=Number($(id)?.value); return Number.isFinite(v) ? Math.max(0,v) : fallback; };
  const checked = id => Boolean($(id)?.checked);
  const selected = id => $(id)?.value || '';
  const ceil = v => Math.ceil(Math.max(0,v));
  const floor100 = v => Math.floor(Math.max(0,v)/100)*100;
  const money = v => `${Math.round(Math.max(0,v)).toLocaleString('cs-CZ')} Kč`;
  const balance = v => v < 0 ? `−${money(-v)}` : money(v);
  let currentResult = null;
  const primaryIds=['totalDuties','taxResult','socialResult','healthResult','profitResult','afterDuties','afterCash','effectiveResult','heroTotal','heroTax','heroSocial','heroHealth','heroAfter','thresholdValue','taxBaseView','expenseView'];
  const moneySigned = v => v > 0 ? `doplatek ${money(v)}` : v < 0 ? `přeplatek ${money(Math.abs(v))}` : 'vyrovnáno';
  const pct = v => `${(Math.max(0,v)*100).toLocaleString('cs-CZ',{minimumFractionDigits:1,maximumFractionDigits:1})} %`;

  function taxExpenses(revenue, mode, actual){
    if(mode==='actual') return Math.min(revenue,Math.max(0,actual));
    const rate=Number(mode); return Math.min(revenue*rate/100, CFG.flatCaps[rate]||0);
  }
  function sideThreshold(months){return Math.max(0,CFG.sideThresholdFull-CFG.sideThresholdReduction*(12-months));}
  function socialMinBase(activity,months,isNew){
    if(activity==='side') return CFG.socialSideMinMonthlyBase*months;
    return (isNew?CFG.socialNewMinMonthlyBase:CFG.socialMainMinMonthlyBase)*months;
  }
  function calculate(input){
    const revenue=Math.max(0,input.revenue);
    const months=Math.min(12,Math.max(1,Math.round(input.activeMonths||12)));
    const deductible=taxExpenses(revenue,input.expenseMode,input.actualTaxExpenses);
    const profit=Math.max(0,revenue-deductible);
    const taxBase=floor100(Math.max(0,profit-input.deductions));
    const grossTax=ceil(Math.min(taxBase,CFG.taxThreshold)*.15+Math.max(0,taxBase-CFG.taxThreshold)*.23);
    const credits=(input.taxpayerCredit?CFG.taxpayerCredit:0)+input.extraCredits;
    const incomeTax=Math.max(0,grossTax-credits);
    const threshold=sideThreshold(months);
    const socialRequired=input.activity==='main'||profit>=threshold||input.socialVoluntary;
    const socialActualBase=profit*CFG.socialBaseShare;
    const socialMinimum=socialMinBase(input.activity,months,input.isNew);
    const socialBase=socialRequired?Math.min(CFG.socialMaxBase,Math.max(socialActualBase,socialMinimum)):0;
    const social=socialRequired?ceil(socialBase*CFG.socialRate):0;
    const healthActualBase=profit*CFG.healthBaseShare;
    const healthMinBase=input.healthMinimum?CFG.healthMinMonthlyBase*months:0;
    const healthBase=Math.max(healthActualBase,healthMinBase);
    const health=ceil(healthBase*CFG.healthRate);
    const duties=incomeTax+social+health;
    const cashCosts=input.cashCosts;
    return {revenue,months,deductible,profit,taxBase,grossTax,incomeTax,social,socialBase,socialActualBase,socialMinimum,socialRequired,threshold,health,healthBase,healthActualBase,healthMinBase,duties,cashCosts,afterDuties:revenue-duties,afterCash:revenue-duties-cashCosts,effective:revenue>0?duties/revenue:0};
  }
  function collect(){
    return {
      revenue:num('revenue',1200000), expenseMode:selected('expenseMode')||'60', actualTaxExpenses:num('actualTaxExpenses',300000), cashCosts:num('cashCosts',0), activity:selected('activity')||'main', activeMonths:Math.min(12,Math.max(1,num('activeMonths',12))), taxpayerCredit:checked('taxpayerCredit'), deductions:num('deductions',0), extraCredits:num('extraCredits',0), isNew:checked('isNew'), socialVoluntary:checked('socialVoluntary'), healthMinimum:checked('healthMinimum')
    };
  }
  function expenseLabel(mode){return mode==='actual'?'skutečné daňové výdaje':`výdajový paušál ${mode} %`;}
  function validate(){
    const numericFields=['revenue','cashCosts','deductions','extraCredits','activeMonths'];
    if(selected('expenseMode')==='actual')numericFields.push('actualTaxExpenses');
    let message='';
    for(const id of numericFields){
      const el=$(id),raw=el.value.trim(),n=Number(raw);
      const integer=id==='activeMonths';
      const invalid=raw===''||!Number.isFinite(n)||n<0||(integer&&(!Number.isInteger(n)||n<1||n>12));
      el.setAttribute('aria-invalid',String(invalid));
      if(invalid&&!message)message=id==='activeMonths'?'Vyplňte počet měsíců jako celé číslo od 1 do 12.':'Vyplňte všechna použitá číselná pole platnými nezápornými hodnotami. Prázdný údaj není automaticky nula.';
    }
    if(!message&&selected('expenseMode')==='actual'&&Number($('actualTaxExpenses').value)>Number($('revenue').value)){
      message='Skutečné daňové výdaje převyšují příjmy. Tento orientační model neřeší daňovou ztrátu; pro tento případ použijte individuální daňové posouzení.';
      $('actualTaxExpenses').setAttribute('aria-invalid','true');
    }
    const box=$('taxFormError');if(box){box.hidden=!message;box.textContent=message;}
    return message;
  }
  function invalidState(message){
    currentResult=null;
    for(const id of primaryIds)$(id).textContent='—';
    $('resultMeaning').textContent=message;
    $('socialNote').textContent='Výsledek čeká na opravu zadání.';
    $('thresholdMonths').textContent='';
    $('expenseModeView').textContent='—';
    const note=document.querySelector('.tx-statement-note');
    if(note)note.textContent='Výsledek čeká na opravu vstupních údajů.';
    ['afterDuties','afterCash','heroAfter'].forEach(id=>$(id).classList.remove('is-negative'));
    renderSettlement(null);
  }
  function render(){
    $('actualTaxWrap').hidden=selected('expenseMode')!=='actual';
    $('sideSettings').hidden=selected('activity')!=='side';
    const error=validate();if(error){invalidState(error);return;}
    const input=collect(), r=calculate(input);currentResult=r;
    $('totalDuties').textContent=money(r.duties);
    $('taxResult').textContent=money(r.incomeTax);
    $('socialResult').textContent=money(r.social);
    $('healthResult').textContent=money(r.health);
    $('profitResult').textContent=money(r.profit);
    $('afterDuties').textContent=balance(r.afterDuties);
    $('afterCash').textContent=input.cashCosts>0?balance(r.afterCash):'náklady nezadané';
    for(const id of ['afterDuties','afterCash'])$(id).classList.toggle('is-negative',id==='afterDuties'?r.afterDuties<0:input.cashCosts>0&&r.afterCash<0);
    $('effectiveResult').textContent=pct(r.effective);
    $('heroTotal').textContent=money(r.duties);
    $('heroTax').textContent=money(r.incomeTax);
    $('heroSocial').textContent=money(r.social);
    $('heroHealth').textContent=money(r.health);
    $('heroAfter').textContent=balance(r.afterDuties);$('heroAfter').classList.toggle('is-negative',r.afterDuties<0);
    const note=document.querySelector('.tx-statement-note');if(note)note.textContent='Přepočteno podle aktuálně zadaných příjmů, výdajů a typu činnosti.';
    $('resultMeaning').textContent=`Při ročních příjmech ${money(r.revenue)}, ${expenseLabel(input.expenseMode)} a režimu ${input.activity==='main'?'hlavní':'vedlejší'} OSVČ vychází modelovaná roční povinnost přibližně ${money(r.duties)}. Tato částka je součtem daně z příjmů, sociálního a zdravotního pojištění; paušální daň ani DPH v ní nejsou.`;
    $('socialNote').textContent=input.activity==='side'&&!r.socialRequired?`Daňový základ ${money(r.profit)} je pod modelovanou rozhodnou částkou ${money(r.threshold)} pro ${r.months} měsíců vedlejší činnosti, takže povinné sociální pojištění v tomto modelu nevzniká.`:input.isNew&&input.activity==='main'?'Používá se snížené sociální minimum pro oprávněnou novou hlavní OSVČ.':'Sociální pojištění používá 55 % daňového základu a případné zákonné minimum.';
    $('thresholdValue').textContent=money(r.threshold);
    $('thresholdMonths').textContent=`pro ${r.months} měsíců vedlejší činnosti`;
    $('taxBaseView').textContent=money(r.taxBase);
    $('expenseView').textContent=money(r.deductible);
    $('expenseModeView').textContent=expenseLabel(input.expenseMode);
    renderSettlement(r);
  }
  function renderSettlement(r){
    let bad=false;
    const vals={};
    for(const id of ['paidTax','paidSocial','paidHealth']){
      const el=$(id),raw=el.value.trim(),n=Number(raw),invalid=raw===''||!Number.isFinite(n)||n<0;
      el.setAttribute('aria-invalid',String(invalid));
      if(invalid)bad=true;else vals[id]=n;
    }
    const error=$('settlementError');if(error){error.hidden=!bad;error.textContent=bad?'Zálohy musí být platná nezáporná čísla; prázdné pole se nepovažuje za nulu.':'';}
    if(bad||!r){for(const id of ['settleTax','settleSocial','settleHealth'])$(id).textContent='—';return;}
    $('settleTax').textContent=moneySigned(r.incomeTax-vals.paidTax);
    $('settleSocial').textContent=moneySigned(r.social-vals.paidSocial);
    $('settleHealth').textContent=moneySigned(r.health-vals.paidHealth);
  }
  function reset(){
    $('revenue').value=1200000;$('expenseMode').value='60';$('actualTaxExpenses').value=300000;$('cashCosts').value=0;$('activity').value='main';$('activeMonths').value=12;$('taxpayerCredit').checked=true;$('deductions').value=0;$('extraCredits').value=0;$('isNew').checked=false;$('socialVoluntary').checked=false;$('healthMinimum').checked=true;$('paidTax').value=0;$('paidSocial').value=0;$('paidHealth').value=0;render();
  }
  const form=$('taxForm');
  const onFormChange=e=>{if(e.target?.id==='activity'){const health=$('healthMinimum');if(health)health.checked=e.target.value==='main';}render();};
  form?.addEventListener('input',onFormChange);
  form?.addEventListener('change',onFormChange);
  form?.addEventListener('submit',e=>{e.preventDefault();render();});
  $('resetButton')?.addEventListener('click',reset);
  ['paidTax','paidSocial','paidHealth'].forEach(id=>$(id)?.addEventListener('input',()=>renderSettlement(currentResult)));
  const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.main-nav');
  if(toggle&&nav){toggle.addEventListener('click',()=>{const open=!nav.classList.contains('is-open');nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));});document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');}});}
  render();
})();
