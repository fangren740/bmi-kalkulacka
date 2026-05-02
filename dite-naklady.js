(function(){
  const $=(id)=>document.getElementById(id);
  const form=$('childCostForm');
  if(!form) return;
  const money=(v)=>new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0}).format(Math.max(0,v||0));
  const compact=(v)=> v>=1000000 ? new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(v/1000000)+' mil. Kč' : new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(v/1000)+' tis. Kč';
  const pct=(v,d=1)=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:d}).format(v)+' %';
  const ids=['childAge','lifestyle','foodCost','clothesCost','schoolCost','activitiesCost','otherCost','householdIncome'];
  const out=['monthlyCost','yearlyCost','to18Cost','incomeShareResult','summaryFood','summarySchool','summaryActivities','summaryOther','summaryIncome','budgetBadge','budgetStatus','budgetText','actionStatus','decisionSummary','nextActionText','scenarioTableBody','heroMonthly','heroYearly','heroTo18','heroShare','heroFood','heroSchool','heroActivities','heroOther'];
  const el=Object.fromEntries(out.map(id=>[id,$(id)]));
  function val(){return Object.fromEntries(ids.map(id=>[id,Number($(id).value)||0]));}
  function calc(v){
    const base=v.foodCost+v.clothesCost+v.schoolCost+v.activitiesCost+v.otherCost;
    const monthly=base*v.childAge*v.lifestyle;
    const yearly=monthly*12;
    const yearsLeft=({'0.9':17,'1':14,'1.15':10,'1.35':5}[String(v.childAge)]||14);
    return {base,monthly,yearly,to18:yearly*yearsLeft,share:v.householdIncome>0?monthly/v.householdIncome*100:0};
  }
  function msg(r){
    if(r.share<=12) return ['success','Scénář spíše v pohodě','Náklady vypadají vůči příjmu domácnosti zvládnutelně. Pořád ale sledujte, jestli zůstává rezerva na bydlení, energie a nepravidelné výdaje.','Dobrá pozice','Výsledek je zdravější. Další krok je zasadit dítě do celého měsíčního rozpočtu domácnosti.'];
    if(r.share>20) return ['risk','Scénář: vyšší zátěž','Náklady tvoří výraznější část příjmu. Zpřesněte hlavně školku, kroužky, dopravu a opakované drobné výdaje.','Pozor','Tento scénář je citlivější na výpadek příjmu. Vyplatí se projít rozpočet a vytvořit rezervu.'];
    return ['warning','Scénář na hraně','Výsledek je zvládnutelný hlavně tehdy, pokud domácnost drží rezervu i na ostatní velké měsíční položky.','Další krok','Po výpočtu má smysl zkontrolovat pravidelné výdaje a porovnat je s příjmem domácnosti.'];
  }
  function rows(v){
    return [['Úspornější',.85],['Běžný',1],['Pohodlnější',1.2]].map(([label,coef])=>{
      const monthly=(v.foodCost+v.clothesCost+v.schoolCost+v.activitiesCost+v.otherCost)*v.childAge*coef;
      return {label,coef,monthly,yearly:monthly*12,share:v.householdIncome>0?monthly/v.householdIncome*100:0};
    });
  }
  function render(){
    const v=val(); if(v.householdIncome<=0) return;
    const r=calc(v); const m=msg(r);
    el.monthlyCost.textContent=money(r.monthly); el.yearlyCost.textContent=money(r.yearly); el.to18Cost.textContent=money(r.to18); el.incomeShareResult.textContent=pct(r.share);
    el.summaryFood.textContent=money(v.foodCost*v.childAge*v.lifestyle); el.summarySchool.textContent=money(v.schoolCost*v.childAge*v.lifestyle); el.summaryActivities.textContent=money(v.activitiesCost*v.childAge*v.lifestyle); el.summaryOther.textContent=money((v.clothesCost+v.otherCost)*v.childAge*v.lifestyle); el.summaryIncome.textContent=money(v.householdIncome);
    el.budgetBadge.textContent=m[1]; el.budgetBadge.className='rv-family-score '+m[0]; el.budgetStatus.textContent=m[1].replace('Scénář: ',''); el.budgetText.textContent=m[2]; el.actionStatus.textContent=m[3]; el.decisionSummary.textContent=m[4]; el.nextActionText.textContent='Pokud výsledek působí těsně, začněte položkami, které se opakují každý měsíc. Právě ty rozhodují o dlouhodobé únosnosti rozpočtu.';
    el.scenarioTableBody.innerHTML=rows(v).map(row=>`<tr><td>${row.label}</td><td>${row.coef.toFixed(2).replace('.',',')}</td><td>${money(row.monthly)}</td><td>${money(row.yearly)}</td><td>${pct(row.share)}</td></tr>`).join('');
    if(el.heroMonthly){el.heroMonthly.textContent=compact(r.monthly); el.heroYearly.textContent=compact(r.yearly); el.heroTo18.textContent=compact(r.to18); el.heroShare.textContent=pct(r.share,0); el.heroFood.style.width=Math.min(100,(v.foodCost/r.base)*100)+'%'; el.heroSchool.style.width=Math.min(100,(v.schoolCost/r.base)*100)+'%'; el.heroActivities.style.width=Math.min(100,(v.activitiesCost/r.base)*100)+'%'; el.heroOther.style.width=Math.min(100,((v.clothesCost+v.otherCost)/r.base)*100)+'%';}
  }
  const presets={standard:{childAge:1,lifestyle:1,foodCost:3500,clothesCost:1200,schoolCost:2500,activitiesCost:1500,otherCost:1800,householdIncome:65000},low:{childAge:1,lifestyle:.85,foodCost:2800,clothesCost:900,schoolCost:1800,activitiesCost:900,otherCost:1200,householdIncome:65000},higher:{childAge:1,lifestyle:1.2,foodCost:4500,clothesCost:1800,schoolCost:3500,activitiesCost:2500,otherCost:2500,householdIncome:65000},teen:{childAge:1.35,lifestyle:1,foodCost:5000,clothesCost:1800,schoolCost:1200,activitiesCost:2200,otherCost:2300,householdIncome:65000}};
  document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{const p=presets[btn.dataset.preset]; if(!p)return; Object.entries(p).forEach(([k,v])=>{$(k).value=v}); document.querySelectorAll('[data-preset]').forEach(b=>b.classList.toggle('active',b===btn)); render();}));
  $('resetBtn')?.addEventListener('click',()=>document.querySelector('[data-preset="standard"]')?.click());
  ids.forEach(id=>{$(id).addEventListener('input',render);$(id).addEventListener('change',render)});
  form.addEventListener('submit',(e)=>{e.preventDefault();render()});
  render();
})();
