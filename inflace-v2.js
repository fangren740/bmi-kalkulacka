(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const qsa=sel=>[...document.querySelectorAll(sel)];
  const form=$('inflationForm');
  if(!form)return;

  const state={mode:'basic',task:'future'};
  const moneyFmt=new Intl.NumberFormat('cs-CZ',{style:'currency',currency:'CZK',maximumFractionDigits:0});
  const numFmt=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2});
  const oneFmt=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1});
  const money=v=>moneyFmt.format(Number.isFinite(v)?v:0);
  const pct=v=>`${numFmt.format(Number.isFinite(v)?v:0)} %`;
  const pct1=v=>`${oneFmt.format(Number.isFinite(v)?v:0)} %`;
  const num=v=>numFmt.format(Number.isFinite(v)?v:0);
  const set=(id,value)=>{const el=$(id);if(el)el.textContent=value};
  const parse=value=>{
    const cleaned=String(value??'').trim().replace(/\s|\u00a0/g,'').replace(',','.');
    return cleaned===''?NaN:Number(cleaned);
  };
  const formatInput=(el,decimals=2)=>{
    const value=parse(el.value);
    if(!Number.isFinite(value))return;
    el.value=new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:decimals}).format(value);
  };

  const fields={
    amount:$('amount'),rate:$('inflationRate'),years:$('years'),twoPhase:$('twoPhase'),
    phaseYears:$('phaseYears'),phaseRate:$('phaseRate'),nominal:$('nominalReturn'),fee:$('annualFee')
  };

  function read(){
    return{
      amount:parse(fields.amount.value),
      rate:parse(fields.rate.value),
      years:parse(fields.years.value),
      twoPhase:state.mode==='advanced'&&fields.twoPhase.checked,
      phaseYears:parse(fields.phaseYears.value),
      phaseRate:parse(fields.phaseRate.value),
      nominal:state.mode==='advanced'?parse(fields.nominal.value):0,
      fee:state.mode==='advanced'?parse(fields.fee.value):0
    };
  }

  function clearErrors(){
    qsa('.field').forEach(el=>el.classList.remove('has-error'));
    qsa('.field-error').forEach(el=>el.textContent='');
    $('formError').hidden=true;
  }
  function error(id,message){
    const el=$(id+'Error');
    const input=$(id);
    if(el)el.textContent=message;
    if(input)input.closest('.field')?.classList.add('has-error');
  }
  function validate(v){
    clearErrors();
    let ok=true;
    if(!Number.isFinite(v.amount)||v.amount<=0||v.amount>1e15){error('amount','Zadejte částku vyšší než 0 a menší než 1 biliarda Kč.');ok=false}
    if(!Number.isFinite(v.rate)||v.rate<=-100||v.rate>100){error('inflationRate','Sazba musí být vyšší než −100 % a nejvýše 100 %.');ok=false}
    if(!Number.isInteger(v.years)||v.years<1||v.years>100){error('years','Zadejte celé číslo od 1 do 100 let.');ok=false}
    if(v.twoPhase){
      if(!Number.isInteger(v.phaseYears)||v.phaseYears<1||v.phaseYears>=v.years){error('phaseYears','První období musí být celé číslo od 1 do počtu let minus 1.');ok=false}
      if(!Number.isFinite(v.phaseRate)||v.phaseRate<=-100||v.phaseRate>100){error('phaseRate','Sazba musí být vyšší než −100 % a nejvýše 100 %.');ok=false}
    }
    if(!Number.isFinite(v.nominal)||v.nominal<=-100||v.nominal>100){error('nominalReturn','Zhodnocení musí být vyšší než −100 % a nejvýše 100 %.');ok=false}
    if(!Number.isFinite(v.fee)||v.fee<0||v.fee>=100){error('annualFee','Poplatek musí být od 0 % do méně než 100 %.');ok=false}
    const netFactor=(1+v.nominal/100)*(1-v.fee/100);
    if(Number.isFinite(netFactor)&&netFactor<=0){error('annualFee','Kombinace zhodnocení a poplatku nesmí vytvořit nulový nebo záporný roční faktor.');ok=false}
    if(!ok){$('formError').hidden=false;$('formError').textContent='Zkontrolujte označené hodnoty.'}
    return ok;
  }

  function factorFor(v,years=v.years,overrideRate=null){
    const baseRate=overrideRate===null?v.rate:overrideRate;
    if(v.twoPhase){
      const first=Math.min(years,v.phaseYears);
      const second=Math.max(0,years-first);
      return Math.pow(1+v.phaseRate/100,first)*Math.pow(1+baseRate/100,second);
    }
    return Math.pow(1+baseRate/100,years);
  }

  function calculate(v,overrideRate=null){
    const factor=factorFor(v,v.years,overrideRate);
    const effectiveRate=(Math.pow(factor,1/v.years)-1)*100;
    const future=v.amount*factor;
    const power=v.amount/factor;
    const cumulative=(factor-1)*100;
    const preserved=(1/factor)*100;
    const netFactor=(1+v.nominal/100)*(1-v.fee/100);
    const nominalSavings=v.amount*Math.pow(netFactor,v.years);
    const realSavings=nominalSavings/factor;
    const realChange=(realSavings/v.amount-1)*100;
    const realAnnual=(netFactor/Math.pow(factor,1/v.years)-1)*100;
    return{...v,factor,effectiveRate,future,power,cumulative,preserved,netFactor,nominalSavings,realSavings,realChange,realAnnual};
  }

  function modeText(){
    if(state.task==='future'){
      set('inputTitle','Zadejte dnešní cenu a scénář inflace');
      set('inputHelp','Výsledek ukáže nominální částku potřebnou pro zachování stejné kupní síly.');
      set('amountLabel','Dnešní cena nebo částka');
      set('amountHelp','Cena nákupu, cíle nebo rozpočtu v dnešních korunách.');
      set('resultTitle','Budoucí cena');
      set('answerLabel','Za stejný nákup budete potřebovat');
      set('differenceLabel','Navýšení ceny');
    }else{
      set('inputTitle','Zadejte pevnou budoucí částku a scénář inflace');
      set('inputHelp','Výsledek převede nominální budoucí částku do dnešní kupní síly.');
      set('amountLabel','Pevná částka v budoucnu');
      set('amountHelp','Nominální částka, která se sama nezvyšuje s růstem cen.');
      set('resultTitle','Dnešní kupní síla');
      set('answerLabel','V dnešních cenách bude částka odpovídat');
      set('differenceLabel','Ztráta kupní síly');
    }
  }

  function interpretation(r){
    if(r.factor<1){
      return{badge:'Deflační scénář',title:'Cenová hladina v modelu klesá.',text:`Efektivní průměrná změna ${pct(r.effectiveRate)} ročně snižuje cenový faktor na ${num(r.factor)}×. Dlouhodobá konstantní deflace je matematický scénář, nikoli běžná jistota.`,next:'Porovnejte také nulovou a kladnou inflaci; samotný pokles cen nepopisuje stav celé ekonomiky.'};
    }
    if(state.mode==='advanced'&&r.realChange<0&&r.nominal!==0){
      return{badge:'Kupní síla úspor klesá',title:'Zhodnocení po poplatcích nepřekonává inflaci.',text:`Nominální zůstatek by dosáhl ${money(r.nominalSavings)}, ale jeho reálná hodnota je přibližně ${money(r.realSavings)}. Reálná roční změna vychází ${pct(r.realAnnual)}.`,next:'Ověřte realističnost výnosu, poplatky, daně a také vyšší inflační scénář.'};
    }
    if(r.cumulative>=100){
      return{badge:'Velmi silný dlouhodobý dopad',title:'Cenová hladina se v modelu více než zdvojnásobí.',text:`Kumulovaný růst cen dosahuje ${pct(r.cumulative)}. Dlouhý horizont násobí i zdánlivě střední roční sazbu.`,next:'Důležitý cíl rozdělte na pravidelné kontroly a aktualizujte jeho dnešní cenu alespoň jednou ročně.'};
    }
    if(r.cumulative>=40){
      return{badge:'Výrazný dopad',title:'Pevná korunová částka ztrácí podstatnou část kupní síly.',text:`Inflační faktor ${num(r.factor)}× znamená kumulovaný růst cen ${pct(r.cumulative)} a zachování přibližně ${pct(r.preserved)} dnešní kupní síly.`,next:'Použijte základní i stresový scénář a ponechte prostor pro cenu konkrétního cíle.'};
    }
    if(r.cumulative>=15){
      return{badge:'Střední dlouhodobý dopad',title:'Malé roční procento se v čase výrazně nasčítá.',text:`Rozdíl nevzniká prostým násobením sazby počtem let. Každý rok se změna počítá z nové cenové hladiny.`,next:'Pro důležitý cíl porovnejte také nižší a vyšší scénář níže.'};
    }
    return{badge:'Omezený dopad v zadaném horizontu',title:'Výsledek je stále scénář, ne přesná cenová prognóza.',text:`Kumulovaný dopad je ${pct(r.cumulative)}. U krátkého horizontu mohou být konkrétní ceníky a nabídky důležitější než obecná inflace.`,next:'Ověřte skutečnou cenu dané položky a plán přepočítejte při změně podmínek.'};
  }

  function renderTimeline(v,r){
    const years=new Set([1,v.years]);
    [3,5,10,15,20,25,30,40,50].filter(y=>y<v.years).forEach(y=>years.add(y));
    if(v.years>4){years.add(Math.round(v.years/2));years.add(Math.round(v.years*.75))}
    const points=[...years].filter(y=>y>=1&&y<=v.years).sort((a,b)=>a-b);
    const values=points.map(year=>{
      const factor=factorFor(v,year);
      return{year,value:state.task==='future'?v.amount*factor:v.amount/factor};
    });
    const max=Math.max(v.amount,...values.map(x=>x.value));
    const min=Math.min(v.amount,...values.map(x=>x.value));
    $('timeline').replaceChildren(...values.map(item=>{
      const row=document.createElement('div');row.className='timeline-row';
      const label=document.createElement('span');label.textContent=`${item.year}. rok`;
      const track=document.createElement('i');const fill=document.createElement('b');
      const width=state.task==='future'?(item.value/max)*100:Math.max(8,((item.value-min)/(v.amount-min||1))*92+8);
      fill.style.width=`${Math.min(100,Math.max(6,width))}%`;track.append(fill);
      const value=document.createElement('strong');value.textContent=money(item.value);
      row.append(label,track,value);return row;
    }));
  }

  function renderScenarios(v){
    const rates=[v.rate-2,v.rate-1,v.rate,v.rate+1,v.rate+2].filter((x,i,a)=>x>-100&&x<=100&&a.indexOf(x)===i);
    const base=calculate(v);
    $('scenarioGrid').replaceChildren(...rates.map(rate=>{
      const r=calculate(v,rate);
      const main=state.task==='future'?r.future:r.power;
      const delta=main-(state.task==='future'?base.future:base.power);
      const article=document.createElement('article');
      if(rate===v.rate)article.className='baseline';
      const rateEl=document.createElement('span');rateEl.className='scenario-rate';rateEl.textContent=`${pct(rate)} ročně`;
      const title=document.createElement('h3');title.textContent=rate===v.rate?'Váš scénář':rate<v.rate?'Nižší inflace':'Vyšší inflace';
      const strong=document.createElement('strong');strong.textContent=money(main);
      const desc=document.createElement('p');desc.textContent=state.task==='future'?`Budoucí cena po ${v.years} letech`:`Dnešní kupní síla po ${v.years} letech`;
      const deltaEl=document.createElement('div');deltaEl.className='scenario-delta';deltaEl.textContent=rate===v.rate?'Výchozí hodnota':`${delta>=0?'+':''}${money(delta)} proti zadané sazbě`;
      article.append(rateEl,title,strong,desc,deltaEl);return article;
    }));
  }

  function render(options={}){
    const v=read();
    if(!validate(v))return false;
    const r=calculate(v);
    const main=state.task==='future'?r.future:r.power;
    const difference=state.task==='future'?r.future-v.amount:v.amount-r.power;
    const differencePct=state.task==='future'?r.cumulative:100-r.preserved;
    const i=interpretation(r);

    set('mainResult',money(main));
    set('answerSentence',state.task==='future'?`${money(v.amount)}, efektivní inflace ${pct(r.effectiveRate)} a horizont ${v.years} let.`:`Pevná částka ${money(v.amount)}, efektivní inflace ${pct(r.effectiveRate)} a horizont ${v.years} let.`);
    set('compareStartLabel',state.task==='future'?'Dnes':'Pevná částka');
    set('compareStart',money(v.amount));
    set('compareEndLabel',state.task==='future'?`Za ${v.years} let`:'Dnešní kupní síla');
    set('compareEnd',money(main));
    set('differenceResult',money(Math.abs(difference)));
    set('differenceNote',`${differencePct>=0?'+':''}${pct(differencePct)} ${state.task==='future'?'proti dnešku':'ztracené kupní síly'}`);
    set('cumulativeResult',pct(r.cumulative));
    set('factorNote',`cenový faktor ${num(r.factor)}×`);
    set('powerPercent',pct(r.preserved));
    set('powerValue',`odpovídá ${money(r.power)}`);
    set('realChange',pct(r.realChange));
    set('realValue',`reálná hodnota ${money(r.realSavings)} · ${pct(r.realAnnual)} ročně`);
    set('meterValue',pct1(Math.max(0,Math.min(100,r.preserved))));
    $('meterFill').style.width=`${Math.max(0,Math.min(100,r.preserved))}%`;
    set('meterText',`Pevných ${money(v.amount)} bude mít po ${v.years} letech kupní sílu přibližně ${money(r.power)} v dnešních cenách.`);
    set('interpretationBadge',i.badge);set('interpretationTitle',i.title);set('interpretationText',i.text);set('nextStepText',i.next);
    set('resultStatus',v.twoPhase?'Dvoufázový scénář':'Scénář přepočítán');

    set('heroScenario',v.twoPhase?`${pct1(v.phaseRate)} první ${v.phaseYears} roky, poté ${pct1(v.rate)}`:`${pct1(v.rate)} ročně · ${v.years} let`);
    set('heroFuture',money(r.future));set('heroDifference',`${r.future>=v.amount?'o':'o'} ${money(Math.abs(r.future-v.amount))} ${r.future>=v.amount?'více':'méně'}`);
    set('heroPower',money(r.power));set('heroFactor',`${num(r.factor)}×`);
    $('heroMeter').style.width=`${Math.max(0,Math.min(100,r.preserved))}%`;
    set('heroMeterText',`Pevná částka si zachová ${pct1(r.preserved)} dnešní kupní síly`);

    $('advancedMetric').hidden=state.mode!=='advanced';
    renderTimeline(v,r);renderScenarios(v);
    qsa('[data-rate]').forEach(b=>b.classList.toggle('is-active',Math.abs(parse(b.dataset.rate)-v.rate)<1e-9));
    if(options.scroll&&matchMedia('(max-width:820px)').matches)$('vysledek').scrollIntoView({behavior:'smooth',block:'start'});
    return true;
  }

  function setTask(task){
    state.task=task;
    qsa('[data-task]').forEach(btn=>{const active=btn.dataset.task===task;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active))});
    modeText();render();
  }
  function setMode(mode){
    state.mode=mode;
    qsa('[data-mode]').forEach(btn=>{const active=btn.dataset.mode===mode;btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active))});
    $('advancedPanel').hidden=mode!=='advanced';
    $('advancedMetric').hidden=mode!=='advanced';
    if(mode==='basic')$('phasePanel').hidden=true;else $('phasePanel').hidden=!fields.twoPhase.checked;
    render();
  }
  function reset(){
    form.reset();
    fields.amount.value='100 000';fields.rate.value='3';fields.years.value='10';fields.phaseYears.value='3';fields.phaseRate.value='5';fields.nominal.value='0';fields.fee.value='0';
    state.task='future';modeText();
    qsa('[data-task]').forEach(btn=>{const active=btn.dataset.task==='future';btn.classList.toggle('is-active',active);btn.setAttribute('aria-pressed',String(active))});
    setMode('basic');
  }

  form.addEventListener('submit',e=>{e.preventDefault();render({scroll:true})});
  qsa('[data-task]').forEach(btn=>btn.addEventListener('click',()=>setTask(btn.dataset.task)));
  qsa('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
  qsa('[data-rate]').forEach(btn=>btn.addEventListener('click',()=>{fields.rate.value=btn.dataset.rate;render()}));
  fields.twoPhase.addEventListener('change',()=>{$('phasePanel').hidden=!fields.twoPhase.checked;render()});
  Object.values(fields).filter(el=>el&&el!==fields.twoPhase).forEach(el=>{
    el.addEventListener('input',()=>render());
    el.addEventListener('blur',()=>{formatInput(el,el===fields.years||el===fields.phaseYears?0:2);render()});
  });
  $('resetButton').addEventListener('click',reset);
  modeText();setMode('basic');
})();
