(function(){
  'use strict';
  const DAY=86400000;
  const q=(s,r=document)=>r.querySelector(s);
  const qa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const form=q('#ovulationForm');
  if(!form) return;

  function utcDate(value){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(value||'')) return null;
    const [y,m,d]=value.split('-').map(Number);
    const date=new Date(Date.UTC(y,m-1,d));
    return date.getUTCFullYear()===y&&date.getUTCMonth()===m-1&&date.getUTCDate()===d?date:null;
  }
  function addDays(date,days){return new Date(date.getTime()+days*DAY)}
  function diffDays(a,b){return Math.round((a-b)/DAY)}
  function inputDate(date){return date.toISOString().slice(0,10)}
  function fmt(date,year=true){return new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'long',year:year?'numeric':undefined,timeZone:'UTC'}).format(date)}
  function fmtShort(date){return new Intl.DateTimeFormat('cs-CZ',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}).format(date)}
  function setText(id,text){const el=q('#'+id);if(el)el.textContent=text}
  function plural(n,one,few,many){const a=Math.abs(n);return a===1?one:(a>=2&&a<=4?few:many)}

  const now=new Date();
  const today=new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()));
  const defaultStart=addDays(today,-7);
  q('#basicStart').value=inputDate(defaultStart);
  q('#advancedStart').value=inputDate(defaultStart);
  let mode='basic';
  let latestResult=null;

  function switchMode(next,focus){
    mode=next;
    qa('[data-mode]').forEach(btn=>{
      const active=btn.dataset.mode===next;
      btn.classList.toggle('is-active',active);
      btn.setAttribute('aria-pressed',String(active));
    });
    q('#basicFields').hidden=next!=='basic';
    q('#advancedFields').hidden=next!=='advanced';
    if(focus)(next==='basic'?q('#basicFields'):q('#advancedFields')).querySelector('input,select')?.focus();
    calculate(false);
  }

  function inputs(){
    if(mode==='basic'){
      const start=utcDate(q('#basicStart').value);
      const length=Number(q('#basicLength').value);
      if(!start)return {error:'Zadejte platné datum prvního dne poslední menstruace.'};
      if(length<21||length>45||!Number.isInteger(length))return {error:'Obvyklá délka cyklu musí být celé číslo mezi 21 a 45 dny.'};
      return {start,shortest:length,longest:length,lutealMin:14,lutealMax:14,average:length,kind:'basic'};
    }
    const start=utcDate(q('#advancedStart').value);
    const shortest=Number(q('#shortestCycle').value);
    const longest=Number(q('#longestCycle').value);
    const lutealMin=Number(q('#lutealMin').value);
    const lutealMax=Number(q('#lutealMax').value);
    if(!start)return {error:'Zadejte platné datum prvního dne poslední menstruace.'};
    if(shortest<18||shortest>60||!Number.isInteger(shortest))return {error:'Nejkratší cyklus musí být celé číslo mezi 18 a 60 dny.'};
    if(longest<18||longest>60||!Number.isInteger(longest))return {error:'Nejdelší cyklus musí být celé číslo mezi 18 a 60 dny.'};
    if(shortest>longest)return {error:'Nejkratší cyklus nemůže být delší než nejdelší.'};
    if(lutealMin<10||lutealMin>18||lutealMax<10||lutealMax>18)return {error:'Rozmezí luteální fáze musí být mezi 10 a 18 dny.'};
    if(lutealMin>lutealMax)return {error:'Nejkratší luteální fáze nemůže být delší než nejdelší.'};
    return {start,shortest,longest,lutealMin,lutealMax,average:(shortest+longest)/2,kind:'advanced'};
  }

  function cycleResult(data,start,index){
    const centralLength=Math.round(data.average);
    const centralLuteal=(data.lutealMin+data.lutealMax)/2;
    const centerOv=addDays(start,Math.round(centralLength-centralLuteal));
    const earlyOv=addDays(start,data.shortest-data.lutealMax);
    const lateOv=addDays(start,data.longest-data.lutealMin);
    const fertileStart=addDays(earlyOv,-5);
    const fertileEnd=lateOv;
    const periodEarly=addDays(start,data.shortest);
    const periodLate=addDays(start,data.longest);
    const nextStart=addDays(start,centralLength);
    return {index,start,centerOv,earlyOv,lateOv,fertileStart,fertileEnd,periodEarly,periodLate,nextStart,centralLength};
  }

  function reliability(data,span){
    const variability=data.longest-data.shortest;
    if(data.kind==='basic')return {label:'Střední',className:'is-medium',copy:'Jeden průměr cyklu dává jeden kalendářní odhad, nikoli potvrzení ovulace.'};
    if(variability<=2&&span<=8)return {label:'Vyšší',className:'is-good',copy:'Zadané délky jsou si blízko. I pravidelný cyklus se ale může jednorázově posunout.'};
    if(variability<=5&&span<=14)return {label:'Střední',className:'is-medium',copy:'Rozmezí zachycuje běžnou variabilitu, proto sledujte i tělesné signály nebo LH test.'};
    return {label:'Nízká',className:'is-low',copy:'Široké rozpětí cyklů vytváří dlouhé okno. Kalendářní odhad je v této situaci slabý.'};
  }

  function renderForecast(results,data){
    const box=q('#cycleForecast');
    box.innerHTML='';
    results.forEach((r,i)=>{
      const article=document.createElement('article');
      article.className='o-cycle-card';
      const ovulation=data.kind==='basic'?fmt(r.centerOv):`${fmt(r.earlyOv,false)} – ${fmt(r.lateOv)}`;
      const period=data.shortest===data.longest?fmt(r.periodEarly):`${fmt(r.periodEarly,false)} – ${fmt(r.periodLate)}`;
      article.innerHTML=`<div class="o-cycle-head"><span>Cyklus ${i+1}</span><strong>${fmt(r.start)}</strong></div><div class="o-cycle-line"><i></i><b>Plodné okno</b><span>${fmt(r.fertileStart,false)} – ${fmt(r.fertileEnd)}</span></div><div class="o-cycle-line is-peak"><i></i><b>Odhad ovulace</b><span>${ovulation}</span></div><div class="o-cycle-line is-period"><i></i><b>Další menstruace</b><span>${period}</span></div>`;
      box.appendChild(article);
    });
  }

  function calculate(scroll){
    const data=inputs();
    const error=q('#formError');
    if(data.error){
      error.hidden=false;
      error.textContent=data.error;
      q('#resultStatus').textContent='Zkontrolujte vstupy';
      return;
    }
    if(data.start>addDays(today,1)){
      error.hidden=false;
      error.textContent='První den poslední menstruace nemůže být v budoucnosti.';
      return;
    }
    error.hidden=true;
    const results=[];
    let cycleStart=data.start;
    for(let i=0;i<3;i++){
      const result=cycleResult(data,cycleStart,i);
      results.push(result);
      cycleStart=result.nextStart;
    }
    const first=results[0];
    const span=diffDays(first.fertileEnd,first.fertileStart)+1;
    const rel=reliability(data,span);
    latestResult={data,results,rel};

    const ovulationText=data.kind==='basic'?fmt(first.centerOv):`${fmt(first.earlyOv,false)} – ${fmt(first.lateOv)}`;
    const ovulationDay=data.kind==='basic'?diffDays(first.centerOv,data.start)+1:`${diffDays(first.earlyOv,data.start)+1}.–${diffDays(first.lateOv,data.start)+1}. den`;
    const periodText=data.shortest===data.longest?fmt(first.periodEarly):`${fmt(first.periodEarly,false)} – ${fmt(first.periodLate)}`;
    setText('mainWindow',`${fmt(first.fertileStart,false)} – ${fmt(first.fertileEnd)}`);
    setText('ovulationEstimate',ovulationText);
    setText('cycleDay',typeof ovulationDay==='number'?`${ovulationDay}. den cyklu`:ovulationDay);
    setText('nextPeriod',periodText);
    setText('windowLength',`${span} ${plural(span,'den','dny','dní')}`);
    setText('resultReliability',rel.label);
    setText('reliabilityCopy',rel.copy);
    q('#resultReliability').className='o-reliability '+rel.className;
    q('#resultStatus').textContent='Přepočítáno';

    const standard=data.shortest>=21&&data.longest<=35;
    const variability=data.longest-data.shortest;
    let insight=`Centrální odhad ovulace vychází na ${fmt(first.centerOv)}. Největší šance na početí bývá v několika dnech před ovulací a v den ovulace; kalendář ale skutečné uvolnění vajíčka nepotvrzuje.`;
    if(data.kind==='advanced') insight=`Z délek ${data.shortest}–${data.longest} dní a luteální fáze ${data.lutealMin}–${data.lutealMax} dní vychází možné plodné období ${fmt(first.fertileStart,false)} až ${fmt(first.fertileEnd)}. Čím širší interval, tím méně je vhodné spoléhat na jediný den.`;
    setText('resultInsight',insight);

    const warning=q('#resultWarning');
    if(!standard||variability>7){
      warning.hidden=false;
      warning.textContent=variability>7?'Délka cyklu se výrazně mění. Kalendářní metoda může plodné dny minout; zvažte LH test, sledování hlenu nebo konzultaci při dlouhodobé nepravidelnosti.':'Zadaná délka je mimo běžné rozmezí 21–35 dní. Výsledek berte pouze jako hrubý kalendářní odhad.';
    }else warning.hidden=true;

    setText('heroWindow',`${fmtShort(first.fertileStart)} – ${fmtShort(first.fertileEnd)}`);
    setText('heroOvulation',fmtShort(first.centerOv));
    setText('heroReliability',rel.label.toLowerCase());
    renderForecast(results,data);
    if(scroll)q('#vysledek').scrollIntoView({behavior:'smooth',block:'start'});
  }

  qa('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>switchMode(btn.dataset.mode,true)));
  form.addEventListener('input',()=>calculate(false));
  form.addEventListener('change',()=>calculate(false));
  form.addEventListener('submit',e=>{e.preventDefault();calculate(true)});
  q('#resetForm').addEventListener('click',()=>{
    q('#basicStart').value=inputDate(defaultStart);
    q('#basicLength').value='28';
    q('#advancedStart').value=inputDate(defaultStart);
    q('#shortestCycle').value='27';
    q('#longestCycle').value='30';
    q('#lutealMin').value='12';
    q('#lutealMax').value='16';
    switchMode('basic',false);
  });
  q('#copyResult').addEventListener('click',async()=>{
    if(!latestResult)return;
    const first=latestResult.results[0];
    const text=`Orientační plodné období: ${fmt(first.fertileStart)} – ${fmt(first.fertileEnd)}\nCentrální odhad ovulace: ${fmt(first.centerOv)}\nOčekávaná další menstruace: ${fmt(first.periodEarly)}${latestResult.data.shortest!==latestResult.data.longest?' – '+fmt(first.periodLate):''}\nKalendářní odhad nepotvrzuje ovulaci a není určen jako antikoncepce.`;
    try{
      await navigator.clipboard.writeText(text);
      const btn=q('#copyResult');
      const old=btn.textContent;
      btn.textContent='Zkopírováno';
      setTimeout(()=>btn.textContent=old,1800);
    }catch(e){q('#copyResult').textContent='Kopírování není dostupné';}
  });
  switchMode('basic',false);
})();
