(() => {
  'use strict';

  const byId = (id) => document.getElementById(id);
  const form = byId('reserveForm');
  if (!form) return;

  const fieldIds = [
    'businessCosts','personalCosts','crisisIncome','targetMonths','liquidReserve',
    'receivables','collectability','earmarked','oneOffShock','costCutPercent',
    'costCutDelay','safetyBuffer','monthlySaving','clientConcentration','recoveryMonths'
  ];
  const state = { mode: 'basic' };
  const moneyFormatter = new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0});
  const numberFormatter = new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1});
  const percentFormatter = new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0});

  const parseNumber = (value) => {
    const normalized = String(value ?? '').trim().replace(/\s+/g,'').replace(',','.').replace(/[^0-9.+-]/g,'');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : NaN;
  };
  const money = (v) => moneyFormatter.format(Number.isFinite(v) ? v : 0);
  const number = (v) => numberFormatter.format(Number.isFinite(v) ? v : 0);
  const percent = (v) => `${percentFormatter.format(Number.isFinite(v) ? v : 0)} %`;
  const monthsText = (v) => !Number.isFinite(v) ? 'bez omezení' : v < .05 ? '0 měs.' : `${number(v)} měs.`;
  const setText = (id,value) => { const el=byId(id); if(el) el.textContent=value; };

  function setError(id,message){
    const input=byId(id), error=byId(`${id}Error`), field=input?.closest('.field');
    if(error) error.textContent=message;
    if(field) field.classList.toggle('has-error',Boolean(message));
    if(input) input.setAttribute('aria-invalid',message?'true':'false');
  }
  function rawValues(){ return Object.fromEntries(fieldIds.map(id=>[id,parseNumber(byId(id).value)])); }
  function effectiveValues(){
    const raw=rawValues();
    if(state.mode==='advanced') return raw;
    return {...raw,receivables:0,collectability:0,earmarked:0,oneOffShock:0,costCutPercent:0,costCutDelay:raw.targetMonths,safetyBuffer:10,monthlySaving:0,clientConcentration:0,recoveryMonths:raw.targetMonths};
  }
  function validate(v){
    const errors={};
    ['businessCosts','personalCosts','crisisIncome','liquidReserve','receivables','earmarked','oneOffShock','monthlySaving'].forEach(id=>{
      if(!Number.isFinite(v[id])||v[id]<0) errors[id]='Zadejte nezápornou částku.';
      if(Number.isFinite(v[id])&&v[id]>1_000_000_000) errors[id]='Zkontrolujte nezvykle vysokou částku.';
    });
    if(v.businessCosts+v.personalCosts<=0){errors.businessCosts='Zadejte alespoň jednu nezbytnou měsíční částku.';errors.personalCosts='Zadejte alespoň jednu nezbytnou měsíční částku.';}
    if(!Number.isFinite(v.targetMonths)||v.targetMonths<1||v.targetMonths>36) errors.targetMonths='Zadejte horizont 1 až 36 měsíců.';
    if(!Number.isFinite(v.collectability)||v.collectability<0||v.collectability>100) errors.collectability='Zadejte 0 až 100 %.';
    if(!Number.isFinite(v.costCutPercent)||v.costCutPercent<0||v.costCutPercent>100) errors.costCutPercent='Zadejte 0 až 100 %.';
    if(!Number.isFinite(v.costCutDelay)||v.costCutDelay<0||v.costCutDelay>36) errors.costCutDelay='Zadejte 0 až 36 měsíců.';
    if(!Number.isFinite(v.safetyBuffer)||v.safetyBuffer<0||v.safetyBuffer>100) errors.safetyBuffer='Zadejte 0 až 100 %.';
    if(!Number.isFinite(v.clientConcentration)||v.clientConcentration<0||v.clientConcentration>100) errors.clientConcentration='Zadejte 0 až 100 %.';
    if(!Number.isFinite(v.recoveryMonths)||v.recoveryMonths<0||v.recoveryMonths>60) errors.recoveryMonths='Zadejte 0 až 60 měsíců.';
    fieldIds.forEach(id=>setError(id,errors[id]||''));
    return Object.keys(errors).length===0;
  }

  function calculate(v,horizon=v.targetMonths){
    const targetMonths=Math.max(0,horizon);
    const essentialBefore=v.businessCosts+v.personalCosts;
    const reducedBusinessCosts=v.businessCosts*(1-v.costCutPercent/100);
    const essentialAfter=reducedBusinessCosts+v.personalCosts;
    const monthlyGapBefore=Math.max(0,essentialBefore-v.crisisIncome);
    const monthlyGapAfter=Math.max(0,essentialAfter-v.crisisIncome);
    const firstStageMonths=Math.min(targetMonths,Math.max(0,v.costCutDelay));
    const secondStageMonths=Math.max(0,targetMonths-firstStageMonths);
    const operatingNeed=monthlyGapBefore*firstStageMonths+monthlyGapAfter*secondStageMonths;
    const baseNeed=operatingNeed+v.oneOffShock;
    const recommended=baseNeed*(1+v.safetyBuffer/100);
    const usableReceivables=v.receivables*v.collectability/100;
    const availableCash=Math.max(0,v.liquidReserve-v.earmarked);
    const available=availableCash+usableReceivables;
    const missing=Math.max(0,recommended-available);
    const surplus=Math.max(0,available-recommended);
    const coverage=recommended>0?available/recommended:1;
    const afterShock=Math.max(0,available-v.oneOffShock);
    let runway;
    if(monthlyGapBefore<=0&&monthlyGapAfter<=0) runway=Infinity;
    else if(firstStageMonths<=0) runway=monthlyGapAfter>0?afterShock/monthlyGapAfter:Infinity;
    else{
      const firstNeed=monthlyGapBefore*firstStageMonths;
      if(monthlyGapBefore>0&&afterShock<firstNeed) runway=afterShock/monthlyGapBefore;
      else if(monthlyGapAfter>0) runway=firstStageMonths+Math.max(0,afterShock-firstNeed)/monthlyGapAfter;
      else runway=Infinity;
    }
    const monthsToBuild=missing<=0?0:v.monthlySaving>0?missing/v.monthlySaving:Infinity;
    const receivableShare=available>0?usableReceivables/available:0;
    const monthlySavingForYear=missing/12;
    return {...v,targetMonths,essentialBefore,essentialAfter,reducedBusinessCosts,monthlyGapBefore,monthlyGapAfter,firstStageMonths,secondStageMonths,operatingNeed,baseNeed,recommended,usableReceivables,availableCash,available,missing,surplus,coverage,runway,monthsToBuild,receivableShare,monthlySavingForYear};
  }

  function factualStatus(r){
    if(r.recommended<=0) return 'Rezerva není v tomto scénáři potřeba';
    if(r.missing<=0) return `Cíl pokryt · +${money(r.surplus)}`;
    return `Pokryto ${percent(Math.min(100,r.coverage*100))}`;
  }
  function decision(v,r){
    if(r.recommended<=0) return {label:'Scénář bez deficitu',title:'Krizový příjem pokrývá zadané minimum',text:'Při těchto vstupech nevzniká pravidelný měsíční deficit. Rezervu může stále dávat smysl držet na jednorázové šoky a zpožděné inkaso.'};
    if(r.missing<=0){
      const extra=v.clientConcentration>0?` Největší klient tvoří ${percent(v.clientConcentration)} tržeb; koncentraci sledujte odděleně od samotného výpočtu.`:'';
      return {label:'Cíl pokryt',title:`Zvolený stress test je pokryt s přebytkem ${money(r.surplus)}`,text:`Současné použitelné zdroje kryjí celý horizont. Držte vyhrazené závazky odděleně a model pravidelně přepočítejte.${extra}`};
    }
    const runwaySentence=Number.isFinite(r.runway)?`Současné zdroje kupují přibližně ${monthsText(r.runway)} času.`:'Při zadaném krizovém příjmu nevzniká pravidelný deficit.';
    return {label:'Chybí do cíle',title:`Doplňte přibližně ${money(r.missing)}`,text:`${runwaySentence} Do zvoleného cíle ${number(v.targetMonths)} měsíců chybí ${money(r.missing)}.`};
  }
  function goalDate(count){
    if(!Number.isFinite(count)||count<=0) return '';
    const d=new Date(); d.setMonth(d.getMonth()+Math.ceil(count));
    return new Intl.DateTimeFormat('cs-CZ',{month:'long',year:'numeric'}).format(d);
  }
  function updateActions(v,r){
    if(r.missing<=0){setText('actionOneTitle','Chraňte dosažený cíl');setText('actionOneText',`Nad zvoleným cílem zbývá ${money(r.surplus)}. Určete, jaká část zůstává nedotknutelná.`);}
    else if(v.monthlySaving>0){setText('actionOneTitle','Nastavte plán doplnění');setText('actionOneText',`Při ${money(v.monthlySaving)} měsíčně vychází přibližně ${Math.ceil(r.monthsToBuild)} měsíců do cíle${goalDate(r.monthsToBuild)?`, kolem ${goalDate(r.monthsToBuild)}`:''}.`);}
    else{setText('actionOneTitle','Nastavte pravidelný vklad');setText('actionOneText',`Pro doplnění do 12 měsíců je potřeba odkládat přibližně ${money(r.monthlySavingForYear)} měsíčně.`);}
    if(r.usableReceivables>0){setText('actionTwoTitle','Hlídejte inkaso');setText('actionTwoText',`${money(r.usableReceivables)} použitelné rezervy stojí na očekávaných úhradách. Nominální faktura není totéž co hotovost.`);}
    else{setText('actionTwoTitle','Zrychlete inkaso');setText('actionTwoText','Kratší splatnost, zálohy a průběžná fakturace mohou snížit potřebu vlastního překlenovacího kapitálu.');}
    if(v.costCutPercent>0){setText('actionThreeTitle','Připravte spouštěč úspor');setText('actionThreeText',`Po ${number(v.costCutDelay)} měsících model počítá s ${percent(v.costCutPercent)} snížením podnikatelských nákladů.`);}
    else{setText('actionThreeTitle','Sepište úspornou variantu');setText('actionThreeText','Určete náklady, které lze omezit bez ztráty schopnosti získat a dodat práci.');}
  }

  function renderScenarioCard(v,horizon){
    const r=calculate(v,horizon), card=document.createElement('article');
    card.className='scenario-card'; if(Math.abs(horizon-v.targetMonths)<.01) card.classList.add('is-current');
    const label=document.createElement('span'); label.textContent=`${horizon} měsíců ochrany`;
    const h=document.createElement('h3'); h.textContent=money(r.recommended);
    const list=document.createElement('dl');
    [['Použitelné zdroje',money(r.available)],['Chybí do cíle',money(r.missing)],['Deficit po úsporách',money(r.monthlyGapAfter)],['Runway dnes',monthsText(r.runway)]].forEach(([a,b])=>{const row=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=a;dd.textContent=b;row.append(dt,dd);list.append(row);});
    card.append(label,h,list);
    if(Math.abs(horizon-v.targetMonths)<.01){const b=document.createElement('b');b.textContent='Váš zvolený scénář';card.append(b);}
    return card;
  }
  function renderScenarios(v){
    const grid=byId('scenarioGrid'); if(!grid) return;
    grid.replaceChildren(...[3,6,9,12].map(h=>renderScenarioCard(v,h)));
    const current=calculate(v,v.targetMonths);
    setText('scenarioHeadline',`${number(v.targetMonths)}měsíční varianta vyžaduje ${money(current.recommended)}.`);
    setText('scenarioExplanation',v.recoveryMonths>v.targetMonths?`Odhad návratu příjmů je ${number(v.recoveryMonths)} měsíců, tedy delší než zvolený horizont. Zvažte delší stress test nebo rychlejší reakční plán.`:'Horizont je pracovní rozhodnutí, nikoli univerzální doporučení. Vyšší nejistota příjmů a pomalejší reakce nákladů obvykle znamenají potřebu delšího scénáře.');
  }

  function render(options={}){
    const v=effectiveValues();
    if(!validate(v)){
      ['recommendedReserve','availableReserve','currentRunway','missingReserve','monthlyGap','coveragePercent','heroRecommended','heroRunway','heroGap','heroMonthlyGap','heroCoverageLabel'].forEach(id=>setText(id,'—'));
      setText('resultBadge','Zkontrolujte vstupy');
      setText('coverageNote','Výsledek nelze spočítat');
      setText('coverageText','Opravte označené hodnoty a výsledek se okamžitě přepočítá.');
      setText('heroStatus','Zkontrolujte vstupy');
      setText('heroNote','Některý ze vstupů je mimo povolený rozsah.');
      const coverageFill=byId('coverageFill'); if(coverageFill) coverageFill.style.width='0%';
      const heroCoverageFill=byId('heroCoverageFill'); if(heroCoverageFill) heroCoverageFill.style.width='0%';
      return false;
    }
    const r=calculate(v), d=decision(v,r), coverageWidth=Math.min(100,Math.max(0,r.coverage*100));
    const bufferText=state.mode==='basic'?'včetně výchozího 10% polštáře':`včetně ${percent(v.safetyBuffer)} polštáře`;
    setText('recommendedReserve',money(r.recommended));setText('availableReserve',money(r.available));
    setText('availableDetail',state.mode==='basic'?'Likvidní peníze bez pohledávek a závazků':`${money(r.availableCash)} hotovost + ${money(r.usableReceivables)} realistické pohledávky`);
    setText('currentRunway',monthsText(r.runway));setText('runwayDetail',v.oneOffShock>0?`Po jednorázovém šoku ${money(v.oneOffShock)}`:'Bez zadaného jednorázového šoku');
    setText('missingReserve',money(r.missing));setText('gapDetail',r.missing>0?`${percent(Math.max(0,(1-Math.min(1,r.coverage))*100))} cílové rezervy`:`Přebytek ${money(r.surplus)}`);
    setText('monthlyGap',money(r.monthlyGapBefore));setText('postCutGap',v.costCutPercent>0?`Po úsporách ${money(r.monthlyGapAfter)}`:'Bez zadaného snížení nákladů');
    setText('resultSentence',`Cíl kryje ${number(v.targetMonths)} měsíců zadaného scénáře, ${bufferText}${v.oneOffShock>0?` a jednorázový šok ${money(v.oneOffShock)}`:''}.`);
    setText('resultBadge',factualStatus(r));
    setText('coveragePercent',percent(Math.min(100,r.coverage*100)));setText('coverageNote',r.missing<=0?'Zvolený cíl je pokryt':'Cíl ještě není splněn');
    byId('coverageFill').style.width=`${coverageWidth}%`;setText('coverageText',`Použitelná rezerva ${money(r.available)} oproti doporučeným ${money(r.recommended)}.`);
    setText('decisionLabel',d.label);setText('decisionTitle',d.title);setText('decisionText',d.text);updateActions(v,r);

    setText('heroRecommended',money(r.recommended));setText('heroStatus',r.missing<=0?'Cíl pokryt':`Chybí ${money(r.missing)}`);setText('heroCoverageLabel',percent(Math.min(100,r.coverage*100)));setText('heroRunway',monthsText(r.runway));setText('heroGap',money(r.missing));setText('heroMonthlyGap',`${money(r.monthlyGapBefore)} / měs.`);
    setText('heroNote',state.mode==='advanced'?'Výpočet odděluje dostupnou hotovost od vyhrazených závazků a zohledňuje jen realistickou část pohledávek.':'Základní režim používá likvidní hotovost, nulové pohledávky a výchozí 10% bezpečnostní polštář.');
    const runwayPos=Number.isFinite(r.runway)?Math.min(100,(r.runway/12)*100):100;
    const targetPos=Math.min(100,(v.targetMonths/12)*100);
    byId('heroCoverageFill').style.width=`${runwayPos}%`;byId('heroRunwayMarker').style.left=`${runwayPos}%`;byId('heroTargetMarker').style.left=`${targetPos}%`;
    renderScenarios(v);
    window.__rvBusinessReserve={values:v,result:r};
    if(options.scroll&&window.matchMedia('(max-width:820px)').matches) byId('vysledek').scrollIntoView({behavior:'smooth',block:'start'});
    return true;
  }

  function setMode(mode){
    state.mode=mode;
    document.querySelectorAll('[data-mode]').forEach(btn=>{const active=btn.dataset.mode===mode;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active));});
    byId('advancedPanel').hidden=mode!=='advanced';render();
  }
  const presets={
    freelancer:{businessCosts:'8 000',personalCosts:'32 000',crisisIncome:'0',targetMonths:'6',liquidReserve:'160 000',receivables:'30 000',collectability:'70',earmarked:'15 000',oneOffShock:'20 000',costCutPercent:'10',costCutDelay:'1',safetyBuffer:'10',monthlySaving:'10 000',clientConcentration:'45',recoveryMonths:'4'},
    studio:{businessCosts:'85 000',personalCosts:'30 000',crisisIncome:'45 000',targetMonths:'6',liquidReserve:'420 000',receivables:'180 000',collectability:'60',earmarked:'90 000',oneOffShock:'50 000',costCutPercent:'20',costCutDelay:'2',safetyBuffer:'15',monthlySaving:'30 000',clientConcentration:'35',recoveryMonths:'6'},
    eshop:{businessCosts:'140 000',personalCosts:'35 000',crisisIncome:'80 000',targetMonths:'9',liquidReserve:'520 000',receivables:'120 000',collectability:'80',earmarked:'170 000',oneOffShock:'100 000',costCutPercent:'18',costCutDelay:'3',safetyBuffer:'20',monthlySaving:'45 000',clientConcentration:'15',recoveryMonths:'8'}
  };
  function applyPreset(name){
    const p=presets[name]; if(!p) return;
    Object.entries(p).forEach(([id,val])=>{byId(id).value=val;});
    document.querySelectorAll('[data-preset]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.preset===name));render();
  }
  function reset(){form.reset();fieldIds.forEach(id=>setError(id,''));document.querySelectorAll('[data-preset]').forEach(btn=>btn.classList.remove('is-active'));setMode('basic');}
  async function copyResult(){
    const v=effectiveValues();if(!validate(v)) return;const r=calculate(v);
    const text=`Podnikatelská rezerva: cílová rezerva ${money(r.recommended)}, použitelné zdroje ${money(r.available)}, runway ${monthsText(r.runway)}, chybí ${money(r.missing)}. Horizont ${number(v.targetMonths)} měsíců.`;
    const btn=byId('copyResult');
    try{await navigator.clipboard.writeText(text);btn.textContent='Zkopírováno';window.setTimeout(()=>{btn.textContent='Kopírovat výsledek';},1500);}catch{btn.textContent='Kopírování selhalo';}
  }

  document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
  document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));
  fieldIds.forEach(id=>{const el=byId(id);el.addEventListener('input',render);el.addEventListener('change',render);});
  form.addEventListener('submit',e=>{e.preventDefault();render({scroll:true});});
  byId('resetButton').addEventListener('click',reset);byId('copyResult').addEventListener('click',copyResult);

  const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.main-nav');
  if(toggle&&nav){toggle.addEventListener('click',()=>{const open=!nav.classList.contains('is-open');nav.classList.toggle('is-open',open);toggle.setAttribute('aria-expanded',String(open));});document.addEventListener('keydown',e=>{if(e.key==='Escape'){nav.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');}});}

  setMode('basic');
})();
