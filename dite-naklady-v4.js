(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));
  const ids = ['childAge','householdIncome','foodCost','schoolCost','clothesCost','activitiesCost','transportCost','otherCost','annualIrregular','monthlyLimit','planToAge','futureAdjustment','sharedIncrease','futureOneOff','annualGrowth','monthlySaving'];
  const inputs = Object.fromEntries(ids.map(id => [id, $(id)]));
  const categoryIds = ['foodCost','schoolCost','clothesCost','activitiesCost','transportCost','otherCost'];
  const categoryLabels = ['Jídlo','Škola a péče','Oblečení','Volný čas','Doprava a technologie','Zdraví a ostatní'];
  const colors = ['#f1ad55','#6857d9','#45b7a6','#f47b87','#5c96d8','#a88ce8'];
  const stageDefs = [
    {min:0,max:2,label:'0–2 roky',short:'0–2',name:'Péče',base:[1800,1200,1000,500,500,1200]},
    {min:3,max:5,label:'3–5 let',short:'3–5',name:'Předškolák',base:[2600,2500,1100,1100,650,1050]},
    {min:6,max:10,label:'6–10 let',short:'6–10',name:'Mladší školák',base:[3500,2000,1200,1800,900,1200]},
    {min:11,max:14,label:'11–14 let',short:'11–14',name:'Starší školák',base:[4300,1800,1500,2200,1300,1600]},
    {min:15,max:18,label:'15–18 let',short:'15–18',name:'Student',base:[5000,1800,1700,2600,1800,2200]}
  ];
  const profileFactors = {saving:.8, balanced:1, active:1.25};
  let mode = 'basic';
  let activeProfile = 'balanced';
  let activeStep = 0;

  function parseNumber(value, fallback=0){
    if (typeof value !== 'string') value = String(value ?? '');
    const normalized = value.replace(/\s/g,'').replace(',','.').replace(/[^0-9.+-]/g,'');
    const n = Number.parseFloat(normalized);
    return Number.isFinite(n) ? n : fallback;
  }
  function clamp(n,min,max){return Math.min(max,Math.max(min,n));}
  function money(n){return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(n))+' Kč';}
  function compact(n){
    const abs=Math.abs(n);
    if(abs>=1_000_000) return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2}).format(n/1_000_000)+' mil. Kč';
    if(abs>=1000) return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(n/1000)+' tis. Kč';
    return money(n);
  }
  function stageForAge(age){return stageDefs.find(s=>age>=s.min&&age<=s.max)||stageDefs[stageDefs.length-1];}
  function stageIndex(age){return Math.max(0,stageDefs.findIndex(s=>age>=s.min&&age<=s.max));}
  function sum(arr){return arr.reduce((a,b)=>a+b,0);}
  function currentValues(){return categoryIds.map(id=>Math.max(0,parseNumber(inputs[id].value)));}
  function currentAge(){return Math.round(clamp(parseNumber(inputs.childAge.value,8),0,18));}
  function currentStage(){return stageForAge(currentAge());}
  function baseline(stage,profile=activeProfile){return stage.base.map(v=>v*profileFactors[profile]);}
  function applyProfile(profile){
    activeProfile=profile;
    $$('.profile-row button').forEach(b=>b.classList.toggle('active',b.dataset.profile===profile));
    const vals=baseline(currentStage(),profile);
    categoryIds.forEach((id,i)=>inputs[id].value=Math.round(vals[i]));
    update();
  }
  function model(){
    const age=currentAge();
    inputs.childAge.value=age;
    const stage=stageForAge(age);
    const categories=currentValues();
    const irregularYear=Math.max(0,parseNumber(inputs.annualIrregular.value));
    const irregularMonth=irregularYear/12;
    const shared=mode==='advanced'?Math.max(0,parseNumber(inputs.sharedIncrease.value)):0;
    const currentMonthly=sum(categories)+irregularMonth+shared;
    const yearly=currentMonthly*12;
    const income=Math.max(0,parseNumber(inputs.householdIncome.value));
    const share=income>0?currentMonthly/income*100:0;
    const currentBase=sum(baseline(stage));
    const customRatio=currentBase>0?sum(categories)/currentBase:1;
    const futureAdj=mode==='advanced'?clamp(parseNumber(inputs.futureAdjustment.value,100),20,300)/100:1;
    const planTo=mode==='advanced'?Math.round(clamp(parseNumber(inputs.planToAge.value,18),age,18)):18;
    const growth=mode==='advanced'?clamp(parseNumber(inputs.annualGrowth.value,0),0,20)/100:0;
    const oneOff=mode==='advanced'?Math.max(0,parseNumber(inputs.futureOneOff.value)):0;
    const saving=mode==='advanced'?Math.max(0,parseNumber(inputs.monthlySaving.value)):0;
    let total=oneOff, saved=0, monthIndex=0;
    const monthsRemaining=Math.max(0,(planTo-age)*12);
    for(let m=0;m<monthsRemaining;m++){
      const simulatedAge=Math.min(18,age+m/12);
      const s=stageForAge(Math.floor(simulatedAge));
      const stageMonthly=sum(baseline(s))*customRatio*futureAdj+irregularMonth+shared;
      const year=Math.floor(m/12);
      total+=stageMonthly*Math.pow(1+growth,year);
      saved+=saving;
      monthIndex++;
    }
    const stageMonthly=stageDefs.map(s=>sum(baseline(s))*customRatio*futureAdj+irregularMonth+shared);
    return {age,stage,categories,irregularYear,irregularMonth,shared,currentMonthly,yearly,income,share,customRatio,planTo,growth,oneOff,saving,total,saved,stageMonthly,monthsRemaining};
  }
  function setText(id,text){const el=$(id);if(el)el.textContent=text;}
  function updateStagePreview(age){
    $$('#stagePreview>div').forEach((d,i)=>d.classList.toggle('active',i===stageIndex(age)));
  }
  function updatePulse(m){
    const chart=$('pulseChart');
    chart.textContent='';
    const max=Math.max(...m.stageMonthly,1);
    m.stageMonthly.forEach((value,i)=>{
      const item=document.createElement('div');item.className='pulse-item';
      const bar=document.createElement('div');bar.className='pulse-bar'+(i===stageIndex(m.age)?' active':'');bar.style.height=Math.max(18,value/max*78)+'px';
      const val=document.createElement('span');val.textContent=compact(value).replace(' Kč','');bar.appendChild(val);
      const label=document.createElement('small');label.textContent=stageDefs[i].short;
      item.append(bar,label);chart.appendChild(item);
    });
  }
  function updateBreakdown(m){
    const holder=$('breakdownRows');holder.textContent='';
    categoryLabels.forEach((label,i)=>{
      const row=document.createElement('div');row.className='break-row';
      const s=document.createElement('span');s.textContent=label;
      const b=document.createElement('strong');b.textContent=money(m.categories[i]);
      row.append(s,b);holder.appendChild(row);
    });
    [['Nepravidelné výdaje / 12',m.irregularMonth],['Společné navýšení',m.shared],['Celkem za měsíc',m.currentMonthly]].forEach(([label,val])=>{
      const row=document.createElement('div');row.className='break-row';const s=document.createElement('span');s.textContent=label;const b=document.createElement('strong');b.textContent=money(val);row.append(s,b);holder.appendChild(row);
    });
  }
  function updateDecision(m){
    const limit=Math.max(0,parseNumber(inputs.monthlyLimit.value));
    let title,text;
    if(m.share===0){title='Doplňte příjem pro kontrolu únosnosti';text='Samotná částka je užitečná pro plán, ale bez příjmu nelze ukázat její váhu v rozpočtu domácnosti.';}
    else if(m.share<10){title='Výdaje tvoří menší část příjmu';text='Zkontrolujte, zda nechybí sezónní platby, doprava nebo náklady sdílené s celou domácností.';}
    else if(m.share<20){title='Výrazná, ale obvykle plánovatelná položka';text='Největší obálku sledujte samostatně a nepravidelné výdaje odkládejte průběžně během roku.';}
    else{title='Rozpočet dítěte silně zatěžuje příjem';text='Prověřte celý rozpočet domácnosti, fixní náklady, rezervu a případný nárok na aktuální podporu. Neomezujte automaticky základní potřeby dítěte.';}
    setText('decisionTitle',title);setText('decisionText',text);
    if(limit<=0)setText('limitResult','bez limitu');
    else{const diff=limit-m.currentMonthly;setText('limitResult',diff>=0?money(diff)+' rezerva':money(Math.abs(diff))+' nad limitem');}
  }
  function update(){
    const m=model();
    const largest=Math.max(...m.categories);const largestIdx=m.categories.indexOf(largest);
    setText('monthlyResult',money(m.currentMonthly));setText('yearlyResult',compact(m.yearly));setText('incomeShare',m.income>0?new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(m.share)+' %':'—');
    setText('longTermResult',compact(m.total));setText('horizonLabel',`Odteď do ${m.planTo} let`);setText('stageChip',m.stage.label);setText('largestCategory',categoryLabels[largestIdx]+' · '+money(largest));
    setText('irregularMonthly',money(m.irregularMonth)+' / měs.');setText('savingResult',compact(m.saved));
    setText('heroCost',money(m.currentMonthly));setText('heroStage','etapa '+m.stage.label);setText('heroLargest',categoryLabels[largestIdx]);
    const totalCat=sum(m.categories)||1;
    $$('#stackBar i').forEach((el,i)=>el.style.width=(m.categories[i]/totalCat*100)+'%');
    updatePulse(m);updateBreakdown(m);updateDecision(m);updateStagePreview(m.age);
    const profileLabel={saving:'úsporný',balanced:'vyvážený',active:'aktivní'}[activeProfile];
    setText('monthlyCaption',`profil ${profileLabel}, včetně měsíční rezervy na nepravidelné výdaje`);
    setText('formStatus',`Aktuální etapa: ${m.stage.name}. Výsledek je přepočítaný.`);
    syncUrl(false);
  }
  function showStep(index){
    activeStep=clamp(index,0,2);
    $$('.step-tab').forEach((b,i)=>b.classList.toggle('active',i===activeStep));
    $$('.advanced-stage').forEach((s,i)=>s.hidden=i!==activeStep);
  }
  function setMode(next){
    mode=next;
    $$('.mode-btn').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    $('advancedPanel').hidden=mode!=='advanced';
    update();
  }
  function syncUrl(push){
    const p=new URLSearchParams();p.set('vek',currentAge());p.set('profil',activeProfile);p.set('rezim',mode);
    ['householdIncome','foodCost','schoolCost','clothesCost','activitiesCost','transportCost','otherCost','annualIrregular','monthlyLimit'].forEach(id=>p.set(id,inputs[id].value));
    if(mode==='advanced')['planToAge','futureAdjustment','sharedIncrease','futureOneOff','annualGrowth','monthlySaving'].forEach(id=>p.set(id,inputs[id].value));
    const url=location.pathname+'?'+p.toString();
    try{history[push?'pushState':'replaceState']({},'',url);}catch(_){/* local preview */}
  }
  function loadUrl(){
    const p=new URLSearchParams(location.search);
    if(p.has('vek'))inputs.childAge.value=p.get('vek');
    if(profileFactors[p.get('profil')])activeProfile=p.get('profil');
    if(p.get('rezim')==='advanced')mode='advanced';
    ids.forEach(id=>{if(p.has(id))inputs[id].value=p.get(id);});
    $$('.profile-row button').forEach(b=>b.classList.toggle('active',b.dataset.profile===activeProfile));
    setMode(mode);
  }
  async function copyText(text){
    if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(text);return;}
    const ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
  }
  function resultText(){const m=model();return `Náklady na dítě (${m.stage.label}): ${money(m.currentMonthly)} měsíčně, ${money(m.yearly)} ročně, podíl na příjmu ${m.income>0?m.share.toFixed(1).replace('.',',')+' %':'neuveden'}, plán do ${m.planTo} let ${money(m.total)}. RychléVýpočty.cz`;}
  function reset(){
    activeProfile='balanced';mode='basic';activeStep=0;
    inputs.childAge.value='8';inputs.householdIncome.value='65000';inputs.annualIrregular.value='18000';inputs.monthlyLimit.value='12000';inputs.planToAge.value='18';inputs.futureAdjustment.value='100';inputs.sharedIncrease.value='0';inputs.futureOneOff.value='0';inputs.annualGrowth.value='0';inputs.monthlySaving.value='0';
    applyProfile('balanced');setMode('basic');showStep(0);update();
  }
  ids.forEach(id=>inputs[id]?.addEventListener('input',update));
  inputs.childAge.addEventListener('change',()=>applyProfile(activeProfile));
  $$('.profile-row button').forEach(b=>b.addEventListener('click',()=>applyProfile(b.dataset.profile)));
  $$('.mode-btn').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
  $$('.step-tab').forEach((b,i)=>b.addEventListener('click',()=>showStep(i)));
  $$('[data-prev-step]').forEach(b=>b.addEventListener('click',()=>showStep(activeStep-1)));
  $('calculateBtn').addEventListener('click',update);$('resetBtn').addEventListener('click',reset);
  $('copyBtn').addEventListener('click',async()=>{try{await copyText(resultText());setText('copyStatus','Výsledek byl zkopírován.');}catch(_){setText('copyStatus','Kopírování se nepodařilo.');}});
  $('shareBtn').addEventListener('click',async()=>{syncUrl(true);try{await copyText(location.href);setText('copyStatus','Odkaz s nastavením byl zkopírován.');}catch(_){setText('copyStatus','Odkaz je připraven v adresním řádku.');}});
  loadUrl();showStep(0);update();
})();
