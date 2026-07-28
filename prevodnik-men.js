(() => {
  'use strict';
  const API_URL = 'https://api.cnb.cz/cnbapi/exrates/daily';
  const FALLBACK_DATE = '2026-07-28';
  const FALLBACK = [
    ['AUD','Australský dolar',1,14.830],['BRL','Brazilský real',1,4.156],['CNY','Čínský jüan',1,3.143],['DKK','Dánská koruna',1,3.236],['EUR','Euro',1,24.190],['PHP','Filipínské peso',100,34.530],['HKD','Hongkongský dolar',1,2.714],['INR','Indická rupie',100,22.203],['IDR','Indonéská rupie',1000,1.178],['ISK','Islandská koruna',100,16.987],['ILS','Izraelský nový šekel',1,6.963],['JPY','Japonský jen',100,12.984],['ZAR','Jihoafrický rand',1,1.268],['CAD','Kanadský dolar',1,15.083],['KRW','Jihokorejský won',100,1.458],['HUF','Maďarský forint',100,6.702],['MYR','Malajsijský ringgit',1,5.201],['MXN','Mexické peso',1,1.218],['XDR','Zvláštní práva čerpání',1,28.871],['NOK','Norská koruna',1,2.198],['NZD','Novozélandský dolar',1,12.283],['PLN','Polský zlotý',1,5.592],['RON','Rumunský leu',1,4.622],['SGD','Singapurský dolar',1,16.456],['SEK','Švédská koruna',1,2.187],['CHF','Švýcarský frank',1,25.957],['THB','Thajský baht',100,63.326],['TRY','Turecká lira',100,44.932],['USD','Americký dolar',1,21.284],['GBP','Britská libra',1,28.276]
  ];
  const SYMBOLS={CZK:'Kč',EUR:'€',USD:'$',GBP:'£',CHF:'CHF',PLN:'zł',JPY:'¥',CNY:'CNY',AUD:'A$',CAD:'C$',SEK:'SEK',NOK:'NOK',DKK:'DKK',HUF:'Ft'};
  const POPULAR=['EUR','USD','GBP','CHF','PLN','AUD'];
  const state={rates:new Map(),validFor:FALLBACK_DATE,source:'fallback',mode:'basic'};
  const $=(id)=>document.getElementById(id);
  const els={form:$('currencyForm'),amount:$('amount'),from:$('fromCurrency'),to:$('toCurrency'),date:$('rateDate'),customRate:$('customRate'),markup:$('markupPercent'),fixed:$('fixedFee'),monthly:$('monthlyCount'),round:$('roundCash'),advanced:$('advancedPanel')};

  const parseNumber=(value)=>{const cleaned=String(value??'').trim().replace(/\s+/g,'').replace(',','.').replace(/[^0-9.+-]/g,'');const n=Number(cleaned);return Number.isFinite(n)?n:NaN};
  const fmt=(n,max=2,min=0)=>new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:min,maximumFractionDigits:max}).format(Number.isFinite(n)?n:0);
  const fmtMoney=(n,code,maximum=2)=>`${fmt(n,maximum,Math.abs(n)<100&&maximum>0?2:0)} ${SYMBOLS[code]||code}`;
  const isoToday=()=>{const d=new Date();const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,10)};
  const formatDate=(iso)=>{if(!iso)return '—';const [y,m,d]=iso.split('-');return `${d}. ${m}. ${y}`};
  const setFieldError=(el,message)=>{const field=el.closest('.field');if(field)field.classList.toggle('has-error',Boolean(message));const err=$(el.id+'Error');if(err)err.textContent=message||''};
  const normalizeEntry=(r)=>{const code=String(r.currencyCode||r.code||'').toUpperCase();const amount=Number(r.amount);const rate=Number(r.rate);if(!/^[A-Z]{3}$/.test(code)||!Number.isFinite(amount)||amount<=0||!Number.isFinite(rate)||rate<=0)return null;return {code,name:String(r.currency||r.name||code),amount,rate,unitCZK:rate/amount,validFor:String(r.validFor||'')};};
  const fallbackEntries=()=>FALLBACK.map(([code,name,amount,rate])=>({code,name,amount,rate,unitCZK:rate/amount,validFor:FALLBACK_DATE}));
  const applyEntries=(entries,validFor,source)=>{state.rates=new Map([['CZK',{code:'CZK',name:'Česká koruna',amount:1,rate:1,unitCZK:1,validFor}],...entries.map(e=>[e.code,e])]);state.validFor=validFor||entries[0]?.validFor||FALLBACK_DATE;state.source=source;populateSelects();renderMatrix();updateSourceUI();calculate();};
  const cacheKey=(date)=>`rv-cnb-rates-${date}`;
  const readCache=(date)=>{try{const raw=localStorage.getItem(cacheKey(date));if(!raw)return null;const data=JSON.parse(raw);if(!Array.isArray(data.rates)||!data.validFor)return null;return data}catch{return null}};
  const writeCache=(date,data)=>{try{localStorage.setItem(cacheKey(date),JSON.stringify({validFor:data.validFor,rates:data.rates,savedAt:Date.now()}))}catch{}}

  async function loadRates({force=false}={}){
    const requested=els.date.value||isoToday();
    setLoading(true);
    const cached=!force&&readCache(requested);
    if(cached){const entries=cached.rates.map(normalizeEntry).filter(Boolean);if(entries.length){applyEntries(entries,cached.validFor,'cache');setLoading(false);return;}}
    try{
      const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),7000);
      const response=await fetch(`${API_URL}?date=${encodeURIComponent(requested)}&lang=CS`,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'});clearTimeout(timer);
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const data=await response.json();const raw=Array.isArray(data)?data:(Array.isArray(data.rates)?data.rates:[]);const entries=raw.map(normalizeEntry).filter(Boolean);
      if(entries.length<10)throw new Error('Neúplný kurzovní lístek');
      const validFor=entries[0].validFor||requested;writeCache(requested,{validFor,rates:raw});applyEntries(entries,validFor,'live');
    }catch(err){
      const anyCache=findLatestCache();
      if(anyCache){const entries=anyCache.rates.map(normalizeEntry).filter(Boolean);applyEntries(entries,anyCache.validFor,'cache-fallback');}
      else applyEntries(fallbackEntries(),FALLBACK_DATE,'fallback');
    }finally{setLoading(false)}
  }
  function findLatestCache(){try{let best=null;for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key?.startsWith('rv-cnb-rates-'))continue;const data=JSON.parse(localStorage.getItem(key));if(Array.isArray(data.rates)&&(!best||Number(data.savedAt)>Number(best.savedAt)))best=data;}return best}catch{return null}}
  function setLoading(on){$('refreshRates').disabled=on;$('refreshHint').textContent=on?'Načítám…':'ČNB API';if(on){$('sourceStatus').textContent='Načítám kurzovní lístek ČNB';$('sourceDetail').textContent='Jeden požadavek pro zvolené datum.'}}
  function updateSourceUI(){const source=$('sourceStrip');const dot=source.querySelector('.status-dot');dot.className='status-dot';$('heroStatusDot').className='status-dot';let title,detail,badge;
    if(state.source==='live'){dot.classList.add('is-live');$('heroStatusDot').classList.add('is-live');title='Aktuální data z API ČNB';detail=`Platnost kurzu: ${formatDate(state.validFor)}.`;badge='Živá data ČNB';}
    else if(state.source==='cache'){dot.classList.add('is-live');$('heroStatusDot').classList.add('is-live');title='Kurz z místní cache ČNB';detail=`Dříve načtená data s platností ${formatDate(state.validFor)}.`;badge='Uložená data ČNB';}
    else if(state.source==='cache-fallback'){dot.classList.add('is-error');$('heroStatusDot').classList.add('is-error');title='API není dostupné – použit poslední uložený kurz';detail=`Data mají platnost ${formatDate(state.validFor)}.`;badge='Poslední uložený kurz';}
    else{dot.classList.add('is-error');$('heroStatusDot').classList.add('is-error');title='API není dostupné – použita záložní sada';detail=`Záložní data mají platnost ${formatDate(state.validFor)}. Pro důležitou transakci kurz ověřte.`;badge='Záložní data';}
    $('sourceStatus').textContent=title;$('sourceDetail').textContent=detail;$('heroStatus').textContent=badge;$('heroRateDate').textContent=formatDate(state.validFor);$('resultBadge').textContent=badge;
  }
  function populateSelects(){const currentFrom=els.from.value||'EUR',currentTo=els.to.value||'CZK';const entries=[...state.rates.values()].sort((a,b)=>a.code==='CZK'?-1:b.code==='CZK'?1:a.code.localeCompare(b.code,'cs'));const options=entries.map(e=>`<option value="${e.code}">${e.code} — ${e.name}</option>`).join('');els.from.innerHTML=options;els.to.innerHTML=options;els.from.value=state.rates.has(currentFrom)?currentFrom:'EUR';els.to.value=state.rates.has(currentTo)?currentTo:'CZK';$('fixedFeeCurrency').textContent=els.from.value;updateCustomHelp();}
  function updateCustomHelp(){$('customRateHelp').textContent=`Počet ${els.to.value} za 1 ${els.from.value}. Nechte prázdné pro kurz ČNB.`;$('fixedFeeCurrency').textContent=els.from.value;}
  function validate(){let ok=true;const amount=parseNumber(els.amount.value),markup=parseNumber(els.markup.value),fixed=parseNumber(els.fixed.value),monthly=parseNumber(els.monthly.value),custom=els.customRate.value.trim()===''?NaN:parseNumber(els.customRate.value);
    setFieldError(els.amount,!Number.isFinite(amount)||amount<=0?'Zadejte částku větší než 0.':'');if(!Number.isFinite(amount)||amount<=0)ok=false;
    setFieldError(els.markup,!Number.isFinite(markup)||markup<0||markup>=100?'Přirážka musí být od 0 do méně než 100 %.':'');if(!Number.isFinite(markup)||markup<0||markup>=100)ok=false;
    setFieldError(els.fixed,!Number.isFinite(fixed)||fixed<0?'Poplatek nesmí být záporný.':Number.isFinite(amount)&&fixed>=amount?'Poplatek musí být nižší než převáděná částka.':'');if(!Number.isFinite(fixed)||fixed<0||(Number.isFinite(amount)&&fixed>=amount))ok=false;
    setFieldError(els.monthly,!Number.isFinite(monthly)||monthly<1||monthly>120?'Zadejte 1 až 120 převodů za měsíc.':'');if(!Number.isFinite(monthly)||monthly<1||monthly>120)ok=false;
    setFieldError(els.customRate,els.customRate.value.trim()!==''&&(!Number.isFinite(custom)||custom<=0)?'Vlastní kurz musí být větší než 0.':'');if(els.customRate.value.trim()!==''&&(!Number.isFinite(custom)||custom<=0))ok=false;
    return {ok,amount,markup,fixed,monthly,custom};
  }
  function calculate(){if(!state.rates.size)return;updateCustomHelp();const v=validate();const from=state.rates.get(els.from.value),to=state.rates.get(els.to.value);if(!from||!to||!v.ok){renderInvalid();return;}
    const referenceRate=from.unitCZK/to.unitCZK;const usedBase=Number.isFinite(v.custom)?v.custom:referenceRate;const netSource=Math.max(0,v.amount-v.fixed);const beforeMarkup=netSource*usedBase;const resultRaw=beforeMarkup*(1-v.markup/100);const result=els.round.checked?Math.round(resultRaw):resultRaw;const referenceAmount=v.amount*referenceRate;const cost=Math.max(0,referenceAmount-resultRaw);const costPct=referenceAmount>0?cost/referenceAmount*100:0;const effective=resultRaw/v.amount;const annualCost=cost*Math.round(v.monthly)*12;const stress=Math.max(0,(v.amount-v.fixed)*usedBase*(1-Math.min(99,v.markup+2)/100));
    $('resultPair').textContent=`${from.code} → ${to.code}`;$('convertedResult').textContent=fmtMoney(result,to.code,result>=100?2:4);$('resultSentence').textContent=`Za ${fmt(v.amount,4)} ${from.code} získáte podle zadaného scénáře přibližně ${fmt(result,4)} ${to.code}.`;
    $('referenceRateResult').textContent=fmt(referenceRate,6,Math.abs(referenceRate)<1?6:4);$('referenceRateUnit').textContent=`${to.code} za 1 ${from.code}`;$('usedRateResult').textContent=fmt(usedBase,6,Math.abs(usedBase)<1?6:4);$('usedRateUnit').textContent=`${to.code} za 1 ${from.code}`;
    $('costResult').textContent=fmtMoney(cost,to.code,cost<10?2:0);$('costPercentResult').textContent=`${fmt(costPct,2,2)} % z referenční částky`;$('effectiveRateResult').textContent=fmt(effective,6,Math.abs(effective)<1?6:4);$('effectiveRateUnit').textContent=`${to.code} za 1 původní ${from.code}`;
    renderDecision(costPct,Number.isFinite(v.custom),v.markup,v.fixed);renderScenarios(referenceAmount,resultRaw,stress,to.code);$('annualCostResult').textContent=fmtMoney(annualCost,to.code,annualCost<100?2:0);$('annualCostDetail').textContent=`Při ${Math.round(v.monthly)} ${plural(Math.round(v.monthly),'převodu','převodech','převodech')} měsíčně.`;
    $('heroFrom').textContent=`${fmt(v.amount,2)} ${from.code}`;$('heroTo').textContent=fmtMoney(result,to.code,result>=100?0:2);$('heroRate').textContent=`1 ${from.code} = ${fmt(referenceRate,6,Math.abs(referenceRate)<1?6:3)} ${to.code}`;$('heroCost').textContent=fmtMoney(cost,to.code,cost<10?2:0);$('heroEffective').textContent=fmt(effective,6,Math.abs(effective)<1?6:4);$('heroNote').textContent=costPct<.01?'Výchozí převod bez zadané odchylky od reference ČNB.':`Zadané podmínky snižují cílovou částku o ${fmt(costPct,2)} % proti referenci.`;
  }
  function renderInvalid(){$('convertedResult').textContent='—';$('resultSentence').textContent='Opravte označené vstupy, aby bylo možné převod bezpečně spočítat.';['referenceRateResult','usedRateResult','costResult','effectiveRateResult','annualCostResult'].forEach(id=>$(id).textContent='—');}
  function renderDecision(costPct,custom,markup,fixed){const card=$('decisionCard');card.className='decision-card';let label='Referenční přepočet',title='Bez zadané odchylky od ČNB',text='Výsledek používá čistý křížový kurz ČNB. Skutečná platba může být jiná podle kurzu a poplatků poskytovatele.';
    if(costPct>=4){card.classList.add('is-danger');label='Výrazný rozdíl';title=`Náklad proti referenci ${fmt(costPct,2)} %`;text='Zkontrolujte vlastní kurz, přirážku i pevný poplatek. U vyšší částky může mít smysl porovnat alternativní nabídku.';}
    else if(costPct>=1){card.classList.add('is-warning');label='Viditelný náklad';title=`Náklad proti referenci ${fmt(costPct,2)} %`;text='Rozdíl už je při opakovaných nebo vyšších převodech významný. Porovnejte konečnou částku u dalšího poskytovatele.';}
    else if(costPct>.01){label='Malá odchylka';title=`Náklad proti referenci ${fmt(costPct,2)} %`;text='Rozdíl je v tomto objemu omezený, ale ověřte, zda se při zúčtování nepřidá další poplatek.';}
    if(custom||markup>0||fixed>0)label+=' · vlastní scénář';$('decisionLabel').textContent=label;$('decisionTitle').textContent=title;$('decisionText').textContent=text;
  }
  function renderScenarios(reference,current,stress,code){const max=Math.max(reference,current,stress,1);$('scenarioReferenceValue').textContent=fmtMoney(reference,code,reference<100?2:0);$('scenarioCurrentValue').textContent=fmtMoney(current,code,current<100?2:0);$('scenarioStressValue').textContent=fmtMoney(stress,code,stress<100?2:0);$('scenarioReferenceBar').style.width=`${reference/max*100}%`;$('scenarioCurrentBar').style.width=`${current/max*100}%`;$('scenarioStressBar').style.width=`${stress/max*100}%`;}
  function renderMatrix(){const box=$('rateMatrix');box.innerHTML=POPULAR.filter(c=>state.rates.has(c)).map(code=>{const e=state.rates.get(code);return `<article class="rate-tile"><span>1 ${code} v korunách</span><strong>${fmt(e.unitCZK,4,code==='JPY'?4:2)} Kč</strong><small>ČNB ${formatDate(state.validFor)}</small></article>`}).join('');}
  function plural(n,one,few,many){return n===1?one:n>=2&&n<=4?few:many}
  function setMode(mode){state.mode=mode;document.querySelectorAll('[data-mode]').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('is-active',active);b.setAttribute('aria-pressed',String(active));});els.advanced.hidden=mode!=='advanced';if(mode==='advanced')setTimeout(()=>els.customRate.focus({preventScroll:true}),0);}
  function reset(){els.amount.value='1 000';els.from.value='EUR';els.to.value='CZK';els.date.value=isoToday();els.customRate.value='';els.markup.value='0';els.fixed.value='0';els.monthly.value='1';els.round.checked=false;setMode('basic');loadRates();}
  async function copyResult(){const text=`${$('resultPair').textContent}: ${$('convertedResult').textContent} | referenční kurz ${$('referenceRateResult').textContent} ${$('referenceRateUnit').textContent} | data ${formatDate(state.validFor)}`;try{await navigator.clipboard.writeText(text);$('copyResult').textContent='Zkopírováno';setTimeout(()=>$('copyResult').textContent='Kopírovat výsledek',1500)}catch{$('copyResult').textContent='Kopírování selhalo'}}
  function bind(){document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));document.querySelectorAll('[data-pair]').forEach(b=>b.addEventListener('click',()=>{const [f,t]=b.dataset.pair.split(',');els.from.value=f;els.to.value=t;calculate();}));$('swapCurrencies').addEventListener('click',()=>{const a=els.from.value;els.from.value=els.to.value;els.to.value=a;calculate();});$('refreshRates').addEventListener('click',()=>loadRates({force:true}));$('resetButton').addEventListener('click',reset);$('copyResult').addEventListener('click',copyResult);els.form.addEventListener('submit',e=>{e.preventDefault();calculate();});[els.amount,els.from,els.to,els.customRate,els.markup,els.fixed,els.monthly,els.round].forEach(el=>el.addEventListener(el.tagName==='SELECT'||el.type==='checkbox'?'change':'input',calculate));els.date.addEventListener('change',()=>loadRates());}
  function init(){document.addEventListener('keydown',e=>{if(e.key==='Tab')document.body.classList.add('keyboard-user')},{once:true});document.addEventListener('pointerdown',()=>document.body.classList.remove('keyboard-user'));const skip=document.querySelector('.skip-link');if(document.activeElement===skip)skip.blur();els.date.max=isoToday();els.date.value=isoToday();applyEntries(fallbackEntries(),FALLBACK_DATE,'fallback');bind();loadRates();}
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();