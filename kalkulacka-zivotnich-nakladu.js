(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const fields = ['housing','food','transport','other','income','people','children','health','debt','leisure','annualIrregular','reserveContribution','cashReserve','bufferTarget','stressIncrease','oneOffShock'];
  const state = { mode: 'basic' };
  const colors = ['#6db9a3','#d7ad6d','#7a9bb4','#9b8fb3','#6f857f','#b58c77','#8ca7a1','#b8a37a'];
  const presets = {
    single:{housing:17000,food:7000,transport:3500,other:4500,income:42000,people:1,children:0,health:800,debt:800,leisure:1800,annualIrregular:24000,reserveContribution:2500,cashReserve:100000,bufferTarget:15,stressIncrease:10,oneOffShock:20000},
    couple:{housing:22000,food:10500,transport:5000,other:5500,income:68000,people:2,children:0,health:1200,debt:1000,leisure:2500,annualIrregular:30000,reserveContribution:3000,cashReserve:150000,bufferTarget:15,stressIncrease:10,oneOffShock:25000},
    family:{housing:24000,food:13000,transport:6500,other:6000,income:70000,people:3,children:3000,health:1000,debt:1500,leisure:2500,annualIrregular:36000,reserveContribution:3000,cashReserve:180000,bufferTarget:15,stressIncrease:10,oneOffShock:30000}
  };
  const labels = {
    housing:'Bydlení a energie',food:'Jídlo a domácnost',transport:'Doprava',other:'Ostatní pravidelné',children:'Děti a vzdělávání',health:'Zdraví a péče',debt:'Pojištění a splátky',leisure:'Volný čas',annual:'Roční platby'
  };

  function parseNumber(value){
    const cleaned = String(value ?? '').trim().replace(/\s+/g,'').replace(',','.').replace(/[^0-9.+-]/g,'');
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : NaN;
  }
  function formatNumber(value, digits=0){return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:digits,minimumFractionDigits:digits}).format(Number.isFinite(value)?value:0)}
  function money(value){return `${formatNumber(Math.round(value))} Kč`}
  function signedMoney(value){const sign=value>0?'+':value<0?'−':'';return `${sign}${money(Math.abs(value))}`}
  function pluralPeople(n){return n===1?'1 osobě':n>=2&&n<=4?`${n} osobách`:`${n} osobách`}
  function setError(id,message){const input=$(id);const label=input.closest('.field');if(label)label.classList.toggle('has-error',Boolean(message));const error=$(id+'Error');if(error)error.textContent=message||''}
  function read(){
    const values={}; let ok=true;
    fields.forEach(id=>{values[id]=parseNumber($(id).value)});
    ['housing','food','transport','other','income','children','health','debt','leisure','annualIrregular','reserveContribution','cashReserve','oneOffShock'].forEach(id=>{
      const invalid=!Number.isFinite(values[id])||values[id]<0;setError(id,invalid?'Zadejte nulu nebo kladnou částku.':'');if(invalid)ok=false;
    });
    const peopleInvalid=!Number.isFinite(values.people)||values.people<1||values.people>20||!Number.isInteger(values.people);setError('people',peopleInvalid?'Zadejte celé číslo od 1 do 20.':'');if(peopleInvalid)ok=false;
    const bufferInvalid=!Number.isFinite(values.bufferTarget)||values.bufferTarget<0||values.bufferTarget>=80;setError('bufferTarget',bufferInvalid?'Zadejte hodnotu od 0 do méně než 80 %.':'');if(bufferInvalid)ok=false;
    const stressInvalid=!Number.isFinite(values.stressIncrease)||values.stressIncrease<0||values.stressIncrease>100;setError('stressIncrease',stressInvalid?'Zadejte hodnotu od 0 do 100 %.':'');if(stressInvalid)ok=false;
    return {ok,...values};
  }
  function calculate(){
    const v=read(); if(!v.ok){renderInvalid();return;}
    const advanced=state.mode==='advanced';
    const annualMonthly=advanced?v.annualIrregular/12:0;
    const categories=[
      {key:'housing',label:labels.housing,value:v.housing},
      {key:'food',label:labels.food,value:v.food},
      {key:'transport',label:labels.transport,value:v.transport},
      {key:'other',label:labels.other,value:v.other}
    ];
    if(advanced){
      categories.push({key:'children',label:labels.children,value:v.children},{key:'health',label:labels.health,value:v.health},{key:'debt',label:labels.debt,value:v.debt},{key:'leisure',label:labels.leisure,value:v.leisure},{key:'annual',label:labels.annual,value:annualMonthly});
    }
    const monthly=categories.reduce((s,c)=>s+c.value,0);
    const reserveContribution=advanced?v.reserveContribution:0;
    const safePlan=monthly+reserveContribution;
    const annual=monthly*12;
    const remaining=v.income-safePlan;
    const remainingPct=v.income>0?remaining/v.income*100:0;
    const burden=v.income>0?monthly/v.income*100:0;
    const buffer=advanced?v.bufferTarget:15;
    const required=safePlan/(1-buffer/100);
    const perPerson=monthly/v.people;
    const sorted=[...categories].sort((a,b)=>b.value-a.value);
    const largest=sorted[0]||{label:'—',value:0};
    const stress=advanced?v.stressIncrease:10;
    const essential=v.housing+v.food+v.transport+(advanced?v.children+v.health+v.debt+annualMonthly:0);
    const stressedMonthly=monthly+essential*stress/100;
    const stressedRemaining=v.income-(stressedMonthly+reserveContribution);
    const incomeDropRemaining=v.income*.8-safePlan;
    const shock=advanced?v.oneOffShock:30000;
    const reserve=advanced?v.cashReserve:0;
    const runway=monthly>0?Math.max(0,reserve-shock)/monthly:0;

    $('monthlyCost').textContent=money(monthly);$('annualCost').textContent=money(annual);$('perPerson').textContent=money(perPerson);$('perPersonNote').textContent=`při ${pluralPeople(v.people)}`;
    $('remaining').textContent=signedMoney(remaining);$('remainingPercent').textContent=v.income>0?`${formatNumber(remainingPct,1)} % příjmu`:'Příjem není zadán';$('requiredIncome').textContent=money(required);$('requiredIncomeNote').textContent=`pro ${formatNumber(buffer)}% volný prostor`;
    $('monthlyNote').textContent=advanced?`Včetně ${money(annualMonthly)} měsíčního podílu ročních výdajů.`:'Součet čtyř hlavních měsíčních kategorií.';
    $('largestCategoryText').textContent=`Největší položkou je ${largest.label.toLowerCase()} (${money(largest.value)}).`;$('burdenRatio').textContent=v.income>0?`${formatNumber(burden,1)} % příjmu`:'Bez porovnání příjmu';
    $('heroMonthly').textContent=money(monthly);$('heroAnnual').textContent=`${money(annual)} za rok`;$('heroRemaining').textContent=signedMoney(remaining);$('heroPerPerson').textContent=money(perPerson);
    renderStatus({remaining,remainingPct,burden,v,monthly,advanced,largest,annualMonthly});
    renderCategories(categories,monthly);
    renderActions({remaining,remainingPct,burden,advanced,largest,annualMonthly,reserve,runway});
    $('scenarioBase').textContent=signedMoney(remaining);$('scenarioInflation').textContent=signedMoney(stressedRemaining);$('scenarioInflationNote').textContent=`Při zvýšení hlavních výdajů o ${formatNumber(stress)} %.`;$('scenarioIncomeDrop').textContent=signedMoney(incomeDropRemaining);$('scenarioShock').textContent=advanced?`${formatNumber(runway,1)} měsíce`:'Zapněte pokročilý režim';$('scenarioShockNote').textContent=advanced?`Po jednorázovém výdaji ${money(shock)}.`:'Doplňte rezervu a jednorázový výdaj.';
  }
  function renderStatus({remaining,remainingPct,burden,v,advanced,annualMonthly}){
    const card=$('decisionCard');card.className='decision-card';let badge='Stabilní rozpočet',label='Dobrá výchozí pozice',title='Rozpočet má prostor na rezervu i výkyvy',text='Po běžných výdajích zůstává použitelný prostor. Zkontrolujte ještě roční platby a skutečné bankovní výpisy.',hero='Rozpočet má prostor na rezervu, cíle i běžné výkyvy.';
    if(v.income<=0){badge='Součet nákladů';label='Příjem není zadaný';title='Náklady jsou spočítané bez posouzení rozpočtu';text='Doplňte čistý příjem domácnosti, pokud chcete vidět zůstatek a potřebný příjem.';hero='Doplňte příjem pro posouzení finančního prostoru.';}
    else if(remaining<0){card.classList.add('is-danger');badge='Deficit';label='Rozpočet nevychází';title=`Měsíčně chybí přibližně ${money(Math.abs(remaining))}`;text='Nejdřív ověřte vstupy. Pokud odpovídají realitě, je nutné snížit výdaje, zvýšit příjem nebo upravit plánované odkládání.';hero='Současný model je v deficitu a vyžaduje konkrétní změnu.';}
    else if(remainingPct<10||burden>90){card.classList.add('is-warning');badge='Těsný rozpočet';label='Malý bezpečnostní prostor';title='Rozpočet vychází, ale je citlivý na výkyvy';text='Kladný zůstatek je malý vzhledem k příjmu. Doplňte roční platby a prověřte stresový scénář.';hero='Rozpočet vychází těsně a potřebuje vyšší rezervu.';}
    else if(remainingPct<20||burden>80){card.classList.add('is-warning');badge='Omezený prostor';label='Rozpočet je použitelný';title='Výsledek je kladný, ale citlivý na větší změnu';text='Plán má rezervu, ale dražší bydlení, slabší příjem nebo jednorázová oprava ji mohou rychle snížit.';hero='Rozpočet je kladný, ale větší změna už bude znát.';}
    if(!advanced&&annualMonthly===0&&v.income>0)text+=' Pokročilý režim doplní roční a nepravidelné výdaje.';
    $('resultBadge').textContent=badge;$('decisionLabel').textContent=label;$('decisionTitle').textContent=title;$('decisionText').textContent=text;$('heroMessage').textContent=hero;
  }
  function renderCategories(categories,total){
    const bar=$('stackedBar'),list=$('categoryList');bar.replaceChildren();list.replaceChildren();
    categories.filter(c=>c.value>0).forEach((c,index)=>{
      const pct=total>0?c.value/total*100:0;const segment=document.createElement('i');segment.style.width=`${pct}%`;segment.style.background=colors[index%colors.length];segment.title=`${c.label}: ${formatNumber(pct,1)} %`;bar.appendChild(segment);
      const row=document.createElement('div');row.className='category-row';const dot=document.createElement('i');dot.style.background=colors[index%colors.length];const name=document.createElement('span');name.textContent=`${c.label} · ${formatNumber(pct,1)} %`;const value=document.createElement('strong');value.textContent=money(c.value);row.append(dot,name,value);list.appendChild(row);
    });
  }
  function renderActions({remaining,remainingPct,burden,advanced,largest,annualMonthly,reserve,runway}){
    const title=$('actionTitle'),list=$('actionList');list.replaceChildren();let actions=[];
    if(remaining<0){title.textContent='Začněte odstraněním měsíčního deficitu.';actions=[`Ověřte největší kategorii: ${largest.label.toLowerCase()}.`,`Rozdělte nutné a odložitelné výdaje.`,`Nový závazek přidávejte až po návratu rozpočtu do plusu.`];}
    else if(remainingPct<10||burden>90){title.textContent='Zvětšete prostor dřív, než přijde výkyv.';actions=[`Prověřte ${largest.label.toLowerCase()} a roční smlouvy.`,`Přidejte skutečné roční platby v pokročilém režimu.`,`Nastavte pravidelný převod do rezervy, i kdyby byl zpočátku menší.`];}
    else if(!advanced){title.textContent='Ověřte roční a nepravidelné platby.';actions=['Přepněte do pokročilého režimu.','Doplňte servis, pojištění, školní a sezónní výdaje.','Porovnejte výsledek s výpisy za několik měsíců.'];}
    else if(runway<3){title.textContent='Rozpočet funguje, ale rezerva je nízká.';actions=[`Současná rezerva po modelovém šoku pokryje jen ${formatNumber(runway,1)} měsíce.`,`Zvažte zvýšení pravidelného odkládání.`,`Držte rezervu odděleně od peněz na běžné cíle.`];}
    else{title.textContent='Udržujte plán podle skutečných dat.';actions=[`Sledujte největší kategorii: ${largest.label.toLowerCase()}.`,`Roční výdaje tvoří měsíční průměr ${money(annualMonthly)}.`,`Výpočet aktualizujte po změně bydlení, příjmu nebo rodinné situace.`];}
    actions.forEach(text=>{const li=document.createElement('li');li.textContent=text;list.appendChild(li)});
  }
  function renderInvalid(){['monthlyCost','annualCost','perPerson','remaining','requiredIncome'].forEach(id=>$(id).textContent='—');$('resultBadge').textContent='Opravte vstupy';$('decisionCard').className='decision-card is-danger';$('decisionLabel').textContent='Neplatná hodnota';$('decisionTitle').textContent='Výpočet nelze bezpečně dokončit';$('decisionText').textContent='Opravte označená pole. Kalkulačka nepoužije NaN, nekonečno ani záporný počet osob.';}
  function setMode(mode){state.mode=mode;document.querySelectorAll('[data-mode]').forEach(btn=>{const active=btn.dataset.mode===mode;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active))});$('advancedPanel').hidden=mode!=='advanced';calculate();if(mode==='advanced')setTimeout(()=>$('children').focus({preventScroll:true}),0)}
  function applyPreset(name){const preset=presets[name];if(!preset)return;Object.entries(preset).forEach(([id,value])=>{$(id).value=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(value)});document.querySelectorAll('[data-preset]').forEach(btn=>btn.classList.toggle('is-active',btn.dataset.preset===name));calculate();}
  function reset(){applyPreset('family');setMode('basic')}
  async function copyResult(){const text=`Životní náklady: ${$('monthlyCost').textContent} měsíčně, ${$('annualCost').textContent} ročně. Po zaplacení zbývá ${$('remaining').textContent}. Potřebný čistý příjem: ${$('requiredIncome').textContent}.`;try{await navigator.clipboard.writeText(text);$('copyResult').textContent='Zkopírováno';setTimeout(()=>$('copyResult').textContent='Kopírovat shrnutí',1500)}catch{$('copyResult').textContent='Kopírování selhalo'}}
  function bind(){document.querySelectorAll('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));document.querySelectorAll('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));$('lifeCostForm').addEventListener('submit',e=>{e.preventDefault();calculate()});fields.forEach(id=>$(id).addEventListener('input',calculate));$('resetButton').addEventListener('click',reset);$('copyResult').addEventListener('click',copyResult);const top=$('backToTop');const toggle=()=>top.classList.toggle('is-visible',window.scrollY>600);window.addEventListener('scroll',toggle,{passive:true});top.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));}
  function init(){bind();calculate()}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();