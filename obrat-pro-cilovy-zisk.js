(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = { mode: 'basic', entryMethod: 'unit' };
  const fields = {
    price: $('sellingPrice'), variable: $('variableCost'), margin: $('marginPercent'), fixed: $('fixedCosts'), target: $('targetProfit'), period: $('periodLabel'), current: $('currentRevenue'), average: $('averageOrder'), workdays: $('workdays'), capacity: $('capacity'), buffer: $('bufferPercent'), unit: $('unitLabel')
  };
  const presets = {
    consultant: { method:'unit', price:25000, variable:7000, fixed:125000, target:90000, current:340000, average:25000, workdays:18, capacity:20, buffer:10, unit:'zakázek', period:'měsíc' },
    eshop: { method:'margin', margin:32, fixed:180000, target:80000, current:680000, average:1350, workdays:22, capacity:900, buffer:12, unit:'objednávek', period:'měsíc' },
    studio: { method:'unit', price:25000, variable:10000, fixed:140000, target:100000, current:350000, average:25000, workdays:20, capacity:14, buffer:10, unit:'zakázek', period:'měsíc' },
    gastro: { method:'unit', price:220, variable:88, fixed:330000, target:90000, current:640000, average:220, workdays:26, capacity:4200, buffer:8, unit:'prodejů', period:'měsíc' }
  };
  const parseNumber = (value) => { const cleaned=String(value??'').trim().replace(/\s+/g,'').replace(',','.').replace(/[^0-9.+-]/g,''); const n=Number(cleaned); return Number.isFinite(n)?n:NaN; };
  const fmt = (n,max=0,min=0) => new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:min,maximumFractionDigits:max}).format(Number.isFinite(n)?n:0);
  const money = (n,max=0) => `${fmt(n,max)} Kč`;
  const periodText = () => ({měsíc:'za měsíc',rok:'za rok',projekt:'za projekt',sezónu:'za sezónu'}[fields.period.value]||'za období');
  const unitText = () => fields.unit.value || 'prodejů';
  const setError=(field,message)=>{const holder=field.closest('.field');if(holder)holder.classList.toggle('has-error',Boolean(message));const e=$(`${field.id}Error`);if(e)e.textContent=message||'';};
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

  function setEntryMethod(method, focus=false){
    state.entryMethod=method;
    document.querySelectorAll('[data-entry-method]').forEach(btn=>{const active=btn.dataset.entryMethod===method;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));});
    $('unitEntry').hidden=method!=='unit'; $('marginEntry').hidden=method!=='margin';
    if(focus){const target=method==='unit'?fields.price:fields.margin;setTimeout(()=>target.focus({preventScroll:true}),0);}
    calculate();
  }
  function setMode(mode){
    state.mode=mode;
    document.querySelectorAll('[data-mode]').forEach(btn=>{const active=btn.dataset.mode===mode;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));});
    $('advancedPanel').hidden=mode!=='advanced'; $('advancedResults').hidden=mode!=='advanced'; $('currentGoalRow').hidden=mode!=='advanced';
    if(mode==='advanced')setTimeout(()=>fields.current.focus({preventScroll:true}),0);
    calculate();
  }
  function validate(){
    const d={price:parseNumber(fields.price.value),variable:parseNumber(fields.variable.value),marginInput:parseNumber(fields.margin.value),fixed:parseNumber(fields.fixed.value),target:parseNumber(fields.target.value),current:parseNumber(fields.current.value),average:parseNumber(fields.average.value),workdays:parseNumber(fields.workdays.value),capacity:parseNumber(fields.capacity.value),buffer:parseNumber(fields.buffer.value)};
    let valid=true;
    if(state.entryMethod==='unit'){
      const p=!Number.isFinite(d.price)||d.price<=0?'Zadejte cenu větší než 0.':''; setError(fields.price,p); if(p)valid=false;
      const v=!Number.isFinite(d.variable)||d.variable<0?'Náklad nesmí být záporný.':Number.isFinite(d.price)&&d.variable>=d.price?'Přímý náklad musí být nižší než cena.':''; setError(fields.variable,v); if(v)valid=false; setError(fields.margin,'');
    }else{
      const m=!Number.isFinite(d.marginInput)||d.marginInput<=0||d.marginInput>100?'Zadejte marži od více než 0 do 100 %.':'';setError(fields.margin,m);if(m)valid=false;setError(fields.price,'');setError(fields.variable,'');
    }
    const f=!Number.isFinite(d.fixed)||d.fixed<0?'Fixní náklady nesmí být záporné.':'';setError(fields.fixed,f);if(f)valid=false;
    const t=!Number.isFinite(d.target)||d.target<0?'Cílový zisk nesmí být záporný.':'';setError(fields.target,t);if(t)valid=false;
    if(state.mode==='advanced'){
      const c=!Number.isFinite(d.current)||d.current<0?'Současný obrat nesmí být záporný.':'';setError(fields.current,c);if(c)valid=false;
      const a=!Number.isFinite(d.average)||d.average<=0?'Průměrný prodej musí být větší než 0.':'';setError(fields.average,a);if(a)valid=false;
      const w=!Number.isFinite(d.workdays)||d.workdays<1||d.workdays>366?'Zadejte 1 až 366 prodejních dnů.':'';setError(fields.workdays,w);if(w)valid=false;
      const cp=!Number.isFinite(d.capacity)||d.capacity<=0?'Kapacita musí být větší než 0.':'';setError(fields.capacity,cp);if(cp)valid=false;
      const b=!Number.isFinite(d.buffer)||d.buffer<0||d.buffer>100?'Polštář musí být od 0 do 100 %.':'';setError(fields.buffer,b);if(b)valid=false;
    }else{[fields.current,fields.average,fields.workdays,fields.capacity,fields.buffer].forEach(el=>setError(el,''));}
    return {...d,valid};
  }
  function renderInvalid(){
    $('resultBadge').textContent='Opravte vstupy';
    ['requiredRevenueResult','breakEvenRevenueResult','requiredContributionResult','contributionMarginResult','basicSalesCountResult','heroRequiredRevenue','heroBreakEven','heroContribution'].forEach(id=>$(id).textContent='—');
    $('decisionCard').className='decision-card is-danger';$('decisionHeadline').textContent='Výsledek zatím nelze spočítat';$('decisionText').textContent='Opravte označené hodnoty. Cena musí být vyšší než přímý náklad a marže musí být kladná.';$('nextStepText').textContent='Další krok: zkontrolujte vstupy ve formuláři.';
  }
  function calculate(){
    const d=validate(); if(!d.valid){renderInvalid();return;}
    let margin,unitContribution,unitPrice;
    if(state.entryMethod==='unit'){unitContribution=d.price-d.variable;margin=unitContribution/d.price;unitPrice=d.price;}else{margin=d.marginInput/100;unitContribution=NaN;unitPrice=state.mode==='advanced'&&d.average>0?d.average:NaN;}
    if(!Number.isFinite(margin)||margin<=0){renderInvalid();return;}
    const requiredContribution=d.fixed+d.target;
    const requiredRevenue=requiredContribution/margin;
    const breakEven=d.fixed/margin;
    const averageForCount=state.mode==='advanced'?d.average:(Number.isFinite(unitPrice)?unitPrice:NaN);
    const salesCount=Number.isFinite(averageForCount)&&averageForCount>0?Math.ceil(requiredRevenue/averageForCount):NaN;
    const marginPct=margin*100;
    const hundred=margin*100;
    $('requiredRevenueResult').textContent=money(requiredRevenue);$('requiredRevenueNote').textContent=`${periodText()} při příspěvkové marži ${fmt(marginPct,1,1)} %.`;
    $('breakEvenRevenueResult').textContent=money(breakEven);$('requiredContributionResult').textContent=money(requiredContribution);$('contributionMarginResult').textContent=`${fmt(marginPct,1,1)} %`;$('contributionMarginNote').textContent=`${fmt(hundred,1)} Kč z každých 100 Kč obratu.`;
    $('basicSalesCountResult').textContent=Number.isFinite(salesCount)?fmt(salesCount):'—';$('basicSalesCountNote').textContent=Number.isFinite(salesCount)?`Při průměrné hodnotě ${money(averageForCount)}.`:'Doplňte průměrnou hodnotu prodeje v pokročilém režimu.';
    $('heroRequiredRevenue').textContent=money(requiredRevenue);$('heroBreakEven').textContent=money(breakEven);$('heroContribution').textContent=`${fmt(hundred,1)} Kč`;$('heroMargin').textContent=`${fmt(marginPct,1,1)} %`;$('heroMarginBar').style.width=`${clamp(marginPct,2,100)}%`;$('heroPeriod').textContent=periodText();
    $('goalBreakEvenValue').textContent=money(breakEven);$('goalTargetValue').textContent=money(requiredRevenue);$('goalScale').textContent=`0–${money(requiredRevenue)}`;$('goalBreakEvenBar').style.width=`${clamp(breakEven/requiredRevenue*100,0,100)}%`;$('goalTargetBar').style.width='100%';
    $('heroAnswerNote').textContent=d.target>0?'Tato úroveň pokryje fixní náklady i zadaný provozní zisk.':'Tato úroveň odpovídá bodu zvratu bez cílového zisku.';
    if(state.entryMethod==='unit'){$('unitContributionPreview').textContent=money(unitContribution);$('unitContributionPreviewNote').textContent=`Příspěvková marže ${fmt(marginPct,1,1)} %.`;}
    renderDecision(requiredRevenue,breakEven,marginPct,d,salesCount);
    renderScenarios(d,margin,requiredRevenue);
    if(state.mode==='advanced')renderAdvanced(d,requiredRevenue,salesCount);
  }
  function renderDecision(requiredRevenue,breakEven,marginPct,d,salesCount){
    const card=$('decisionCard');card.className='decision-card';let label='Co výsledek znamená',headline='Cíl je matematicky čitelný',text='Největší vliv má příspěvková marže. Než zvýšíte požadovaný počet prodejů, ověřte, zda lze zlepšit cenu nebo přímý náklad.',next='Další krok: porovnejte cíl se svou současnou kapacitou.';
    if(marginPct<15){card.classList.add('is-warning');label='Nízká marže';headline='Cíl je velmi citlivý na malé změny';text='Při nízké příspěvkové marži roste potřebný obrat rychle. Sleva, dražší nákup nebo změna mixu mohou plán významně zhoršit.';next='Další krok: vytvořte scénář s marží nižší alespoň o 2–3 procentní body.';}
    if(state.mode==='advanced'&&d.current>0){
      const gap=requiredRevenue-d.current;
      if(gap<=0){label='Cíl při dnešním obratu vychází';headline='Současný obrat je nad vypočtenou hranicí';text='Ověřte, zda reálná marže odpovídá modelu a zda nejsou mimořádné náklady mimo výpočet.';next='Další krok: porovnejte model se skutečným provozním ziskem.';}
      else if(gap/requiredRevenue>.35){card.classList.add('is-warning');label='Výrazná mezera';headline='Cíl vyžaduje zásadní změnu výkonu nebo marže';text='Samotné „prodat více“ nemusí být proveditelné. Rozložte mezeru mezi cenu, konverzi, opakované nákupy, přímé náklady a kapacitu.';next='Další krok: ověřte kapacitní limit a scénáře citlivosti.';}
      if(Number.isFinite(salesCount)&&d.capacity>0&&salesCount>d.capacity){card.className='decision-card is-danger';label='Kapacitní konflikt';headline='Potřebný počet prodejů přesahuje zadanou kapacitu';text='Při současné ekonomice jedné objednávky nelze cíl dodat bez vyšší ceny, nižšího nákladu, větší kapacity nebo změny cíle.';next='Další krok: neplánujte objem, který tým nemůže dodat.';}
    }
    $('decisionLabel').textContent=label;$('decisionHeadline').textContent=headline;$('decisionText').textContent=text;$('nextStepText').textContent=next;
  }
  function renderAdvanced(d,requiredRevenue,salesCount){
    const gap=requiredRevenue-d.current; const gapPct=d.current>0?gap/d.current*100:NaN; const dailyRevenue=requiredRevenue/d.workdays; const dailySales=Number.isFinite(salesCount)?salesCount/d.workdays:NaN; const capacityUse=Number.isFinite(salesCount)?salesCount/d.capacity*100:NaN; const buffered=requiredRevenue*(1+d.buffer/100);
    $('revenueGapResult').textContent=gap>=0?money(gap):`náskok ${money(Math.abs(gap))}`;$('revenueGapNote').textContent=d.current>0?`${gap>=0?fmt(Math.abs(gapPct),1)+' % nad současným obratem':fmt(Math.abs(gapPct),1)+' % pod současným obratem'}.`:'Současný obrat nebyl zadán.';
    $('dailyRevenueResult').textContent=`${money(dailyRevenue)}/den`;$('dailySalesResult').textContent=Number.isFinite(dailySales)?`${fmt(dailySales,1,1)} ${unitText()} za prodejní den.`:'Počet prodejů nelze bez průměrné hodnoty určit.';
    $('capacityUseResult').textContent=Number.isFinite(capacityUse)?`${fmt(capacityUse,1,1)} %`:'—';$('capacityUseNote').textContent=Number.isFinite(salesCount)?`${fmt(salesCount)} z maximálních ${fmt(d.capacity)} ${unitText()}.`:'Doplňte průměrnou hodnotu prodeje.';
    $('bufferedRevenueResult').textContent=money(buffered);$('bufferedRevenueNote').textContent=`Bezpečnostní polštář ${fmt(d.buffer,1)} %.`;
    $('goalCurrentValue').textContent=money(d.current);const scale=Math.max(requiredRevenue,d.current,1);$('goalCurrentBar').style.width=`${clamp(d.current/scale*100,0,100)}%`;$('goalTargetBar').style.width=`${clamp(requiredRevenue/scale*100,0,100)}%`;$('goalBreakEvenBar').style.width=`${clamp((d.fixed/(state.entryMethod==='unit'?((d.price-d.variable)/d.price):(d.marginInput/100)))/scale*100,0,100)}%`;$('goalScale').textContent=`0–${money(scale)}`;
    let status='Cíl vyžaduje zvýšení výkonu';if(d.current>=requiredRevenue)status='Současný obrat je nad cílem';if(Number.isFinite(salesCount)&&salesCount>d.capacity)status='Cíl překračuje kapacitu';$('advancedState').textContent=status;
  }
  function renderScenarios(d,margin,requiredRevenue){
    let priceScenario=requiredRevenue,costScenario=requiredRevenue;
    if(state.entryMethod==='unit'){
      const higherPrice=d.price*1.05;const priceMargin=(higherPrice-d.variable)/higherPrice;priceScenario=(d.fixed+d.target)/priceMargin;
      const lowerCost=d.variable*.95;const costMargin=(d.price-lowerCost)/d.price;costScenario=(d.fixed+d.target)/costMargin;
      $('scenarioPriceLabel').textContent='Cena +5 %';$('scenarioCostLabel').textContent='Přímý náklad −5 %';
      $('scenarioPriceText').textContent='Vyšší cena zlepšuje příspěvek na jeden prodej, pokud přímý náklad zůstává stejný. Ověřte dopad na poptávku a mix zákazníků.';
      $('scenarioCostText').textContent='Úspora v nákupu, procesu nebo provizi může zvednout marži bez zvýšení ceny. Musí však být dlouhodobě udržitelná.';
    }else{
      priceScenario=(d.fixed+d.target)/Math.min(.999,margin+0.03);costScenario=(d.fixed+d.target)/Math.min(.999,margin+0.02);
      $('scenarioPriceLabel').textContent='Marže +3 p. b.';$('scenarioCostLabel').textContent='Marže +2 p. b.';
      $('scenarioPriceText').textContent='Silnější cenotvorba nebo výhodnější mix zvedne příspěvkovou marži o tři body. Scénář ukazuje, jak se tím sníží potřebný obrat.';
      $('scenarioCostText').textContent='Druhý scénář simuluje mírnější zlepšení marže o dva body, například díky nižším přímým nákladům nebo menším slevám.';
    }
    const lowerMargin=Math.max(.005,margin-.03);const marginScenario=(d.fixed+d.target)/lowerMargin;const higherProfit=(d.fixed+d.target*1.25)/margin;
    $('scenarioPriceResult').textContent=`Potřebný obrat ${money(priceScenario)}`;$('scenarioCostResult').textContent=`Potřebný obrat ${money(costScenario)}`;$('scenarioMarginResult').textContent=`Potřebný obrat ${money(marginScenario)}`;$('scenarioProfitResult').textContent=`Potřebný obrat ${money(higherProfit)}`;
  }
  function applyPreset(name){const p=presets[name];if(!p)return;fields.price.value=p.price;fields.variable.value=p.variable;fields.margin.value=p.margin??40;fields.fixed.value=p.fixed;fields.target.value=p.target;fields.current.value=p.current;fields.average.value=p.average;fields.workdays.value=p.workdays;fields.capacity.value=p.capacity;fields.buffer.value=p.buffer;fields.unit.value=p.unit;fields.period.value=p.period;setEntryMethod(p.method);calculate();}
  function reset(){fields.price.value='2 500';fields.variable.value='1 500';fields.margin.value='40';fields.fixed.value='140 000';fields.target.value='60 000';fields.current.value='420 000';fields.average.value='2 500';fields.workdays.value='20';fields.capacity.value='260';fields.buffer.value='10';fields.unit.value='prodejů';fields.period.value='měsíc';setEntryMethod('unit');setMode('basic');calculate();}
  async function copyResult(){const text=`Potřebný obrat: ${$('requiredRevenueResult').textContent} ${periodText()}; bod zvratu: ${$('breakEvenRevenueResult').textContent}; příspěvková marže: ${$('contributionMarginResult').textContent}.`;try{await navigator.clipboard.writeText(text);$('copyResult').textContent='Zkopírováno';setTimeout(()=>$('copyResult').textContent='Kopírovat výsledek',1500);}catch{$('copyResult').textContent='Kopírování selhalo';}}
  function bind(){document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));document.querySelectorAll('[data-entry-method]').forEach(btn=>btn.addEventListener('click',()=>setEntryMethod(btn.dataset.entryMethod,true)));document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));$('targetProfitForm').addEventListener('submit',e=>{e.preventDefault();calculate();});$('resetButton').addEventListener('click',reset);$('copyResult').addEventListener('click',copyResult);Object.values(fields).forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',calculate));const back=$('backToTop');const toggle=()=>back.classList.toggle('is-visible',window.scrollY>520);window.addEventListener('scroll',toggle,{passive:true});back.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));}
  function init(){document.addEventListener('keydown',e=>{if(e.key==='Tab')document.body.classList.add('keyboard-user')},{once:true});document.addEventListener('pointerdown',()=>document.body.classList.remove('keyboard-user'));const skip=document.querySelector('.skip-link');if(document.activeElement===skip)skip.blur();bind();setEntryMethod('unit');setMode('basic');calculate();}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();