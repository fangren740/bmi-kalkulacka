(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const $$=sel=>Array.from(document.querySelectorAll(sel));
  const DAY=86400000;
  const monthNames=['ledna','února','března','dubna','května','června','července','srpna','září','října','listopadu','prosince'];
  const monthShort=['led','úno','bře','dub','kvě','čer','čvc','srp','zář','říj','lis','pro'];
  const weekdayNames=['neděle','pondělí','úterý','středa','čtvrtek','pátek','sobota'];
  const shopLabels={
    large:'Velká prodejna nad 200 m²',
    small:'Menší prodejna do 200 m²',
    essential:'Lékárna / čerpací stanice',
    travel:'Nádraží / letiště / zdravotnické zařízení'
  };
  const pad=n=>String(n).padStart(2,'0');
  const localDate=(y,m,d)=>new Date(y,m-1,d,12,0,0,0);
  const today=()=>{const n=new Date();return localDate(n.getFullYear(),n.getMonth()+1,n.getDate())};
  const iso=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const utcDay=d=>Date.UTC(d.getFullYear(),d.getMonth(),d.getDate());
  const diffDays=(a,b)=>Math.round((utcDay(b)-utcDay(a))/DAY);
  const addDays=(d,n)=>localDate(new Date(utcDay(d)+n*DAY).getUTCFullYear(),new Date(utcDay(d)+n*DAY).getUTCMonth()+1,new Date(utcDay(d)+n*DAY).getUTCDate());
  const label=d=>`${d.getDate()}. ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
  const parseDate=v=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v||''))return null;const [y,m,d]=v.split('-').map(Number);const x=localDate(y,m,d);return x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d?x:null};
  const plural=(n,one,few,many)=>Math.abs(n)===1?one:(Math.abs(n)>=2&&Math.abs(n)<=4?few:many);
  function easterSunday(y){const a=y%19,b=Math.floor(y/100),c=y%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=(h+l-7*m+114)%31+1;return localDate(y,month,day)}
  function holidays(y){const easter=easterSunday(y);return [
    {date:localDate(y,1,1),name:'Den obnovy samostatného českého státu a Nový rok',short:'Nový rok',kind:'státní svátek',rule:'closed'},
    {date:addDays(easter,-2),name:'Velký pátek',short:'Velký pátek',kind:'ostatní svátek',rule:'open'},
    {date:addDays(easter,1),name:'Velikonoční pondělí',short:'Velikonoční pondělí',kind:'ostatní svátek',rule:'closed'},
    {date:localDate(y,5,1),name:'Svátek práce',short:'Svátek práce',kind:'ostatní svátek',rule:'open'},
    {date:localDate(y,5,8),name:'Den vítězství',short:'Den vítězství',kind:'státní svátek',rule:'closed'},
    {date:localDate(y,7,5),name:'Den slovanských věrozvěstů Cyrila a Metoděje',short:'Cyril a Metoděj',kind:'státní svátek',rule:'open'},
    {date:localDate(y,7,6),name:'Den upálení mistra Jana Husa',short:'Den Jana Husa',kind:'státní svátek',rule:'open'},
    {date:localDate(y,9,28),name:'Den české státnosti',short:'Den české státnosti',kind:'státní svátek',rule:'closed'},
    {date:localDate(y,10,28),name:'Den vzniku samostatného československého státu',short:'28. říjen',kind:'státní svátek',rule:'closed'},
    {date:localDate(y,11,17),name:'Den boje za svobodu a demokracii a Mezinárodní den studentstva',short:'17. listopad',kind:'státní svátek',rule:'open'},
    {date:localDate(y,12,24),name:'Štědrý den',short:'Štědrý den',kind:'ostatní svátek',rule:'noon'},
    {date:localDate(y,12,25),name:'1. svátek vánoční',short:'1. svátek vánoční',kind:'ostatní svátek',rule:'closed'},
    {date:localDate(y,12,26),name:'2. svátek vánoční',short:'2. svátek vánoční',kind:'ostatní svátek',rule:'closed'}
  ].sort((a,b)=>a.date-b.date)}
  const holidayAt=d=>holidays(d.getFullYear()).find(h=>iso(h.date)===iso(d))||null;
  function nextHoliday(from,includeToday=false){for(let y=from.getFullYear();y<=from.getFullYear()+3;y++){const x=holidays(y).find(h=>includeToday?h.date>=from:h.date>from);if(x)return x}return null}
  const ruleTitle=r=>r==='closed'?'Prodej zakázán':r==='noon'?'Od 12:00 zákaz':'Zákon prodej nezakazuje';
  function baseOutcome(date,type){
    const h=holidayAt(date), holidayRule=h?h.rule:'open';
    if(type!=='large'){
      const why=type==='small'?'Prodejna do 200 m² patří mezi zákonné výjimky.':type==='essential'?'Lékárny a čerpací stanice patří mezi zákonné výjimky.':'Vybrané prodejny na letištích, železničních a autobusových nádražích a ve zdravotnických zařízeních patří mezi zákonné výjimky.';
      return {state:'open',main:'Zákon umožňuje otevřít',badge:'ZÁKONNÁ VÝJIMKA',rule:'výjimka z omezení',explain:`${why} Skutečnou otevírací dobu ale stále určuje provozovatel.`,advice:'Ověřte konkrétní provozovnu. Výjimka znamená možnost otevřít, nikoli povinnost mít otevřeno.'};
    }
    if(holidayRule==='closed')return {state:'closed',main:'Musí být zavřeno',badge:'PRODEJ ZAKÁZÁN',rule:'celodenní zákaz prodeje',explain:'U běžné maloobchodní prodejny nad 200 m² zákon pro tento svátek zakazuje prodej.',advice:'Počítejte s uzavřením velkých prodejen. Pro rychlý nákup hledejte menší prodejnu nebo zákonnou výjimku, například lékárnu či čerpací stanici.'};
    if(holidayRule==='noon')return {state:'noon',main:'Do 12:00 ano, potom zavřeno',badge:'OD 12:00 PRODEJ ZAKÁZÁN',rule:'zákaz od 12:00 do 24:00',explain:'Na Štědrý den zákon umožňuje velkým prodejnám prodávat jen do 12:00. Provozovatel může zavřít i dříve.',advice:'Nenechávejte nákup na poledne. Ověřte konkrétní pobočku a počítejte s tím, že může ukončit provoz před 12:00.'};
    return {state:'open',main:'Může mít otevřeno',badge:h?'SVÁTEK BEZ ZÁKAZU PRODEJE':'PRODEJ NENÍ ZÁKONEM OMEZEN',rule:h?'svátek bez zákazu prodeje':'bez svátečního zákazu',explain:h?'Jde o český svátek, ale zákon o prodejní době tento den mezi povinně zavřenými neuvádí. O provozu rozhoduje konkrétní prodejce.':'Zákon pro tento den prodej nezakazuje. O skutečné otevírací době rozhoduje provozovatel.',advice:'Ověřte web nebo aplikaci konkrétní pobočky. Zákon stanoví pouze rámec, ne její reálnou otevírací dobu.'};
  }
  function renderHero(){const d=today(),h=holidayAt(d),out=baseOutcome(d,'large'),shutter=$('heroShutter');$('heroDate').textContent=`${weekdayNames[d.getDay()]} · ${label(d)}`;$('heroHoliday').textContent=h?h.name:'Dnes není státní svátek';$('heroStatus').textContent=out.state==='closed'?'Velké obchody musí být zavřené':out.state==='noon'?(new Date().getHours()>=12?'Velké obchody už musí být zavřené':'Velké obchody mohou prodávat jen do 12:00'):'Zákon velké obchody nezavírá';$('heroDetail').textContent=out.explain;shutter.className=`holiday66-shutter is-${out.state}`;$('heroSignal').textContent=out.state==='closed'?'ZAVŘENO':out.state==='noon'?'DO 12:00':'MŮŽE OTEVŘÍT';$('heroSymbol').textContent=out.state==='closed'?'×':out.state==='noon'?'12':'✓';const n=nextHoliday(d,false),days=diffDays(d,n.date);$('heroNextName').textContent=n.name;$('heroNextDate').textContent=`${label(n.date)} · za ${days} ${plural(days,'den','dny','dní')}`}
  function renderResult(){const d=parseDate($('checkDate').value);if(!d)return;const type=document.querySelector('input[name="shopType"]:checked')?.value||'large',h=holidayAt(d),out=baseOutcome(d,type);$('resultDate').textContent=label(d);$('resultHoliday').textContent=h?h.name:'Běžný den';$('resultWeekday').textContent=weekdayNames[d.getDay()];$('resultKind').textContent=h?h.kind:(d.getDay()===0||d.getDay()===6?'víkend':'běžný den');$('resultRule').textContent=out.rule;$('resultOverline').textContent=shopLabels[type].toUpperCase();$('resultMain').textContent=out.main;$('resultExplanation').textContent=out.explain;$('resultAdvice').textContent=out.advice;const badge=$('resultBadge'),signal=$('resultSignal');badge.className=`holiday66-badge is-${out.state}`;badge.textContent=out.badge;signal.className=`holiday66-signal is-${out.state}`;const url=new URL(location.href);url.searchParams.set('datum',iso(d));url.searchParams.set('typ',type);history.replaceState(null,'',`${url.pathname}${url.search}`)}
  function renderYear(){const y=Number($('yearSelect').value),data=holidays(y),wrap=$('holidayRunway');wrap.innerHTML='';$('summaryTotal').textContent=data.length;$('summaryClosed').textContent=data.filter(h=>h.rule==='closed').length;$('summaryOpen').textContent=data.filter(h=>h.rule==='open').length;for(const h of data){const b=document.createElement('button');b.type='button';b.className=`holiday66-holiday-row is-${h.rule}`;b.innerHTML=`<span class="date">${h.date.getDate()}. ${monthShort[h.date.getMonth()]}</span><span class="name"><strong>${h.name}</strong><span>${h.kind}</span></span><span class="rule">${ruleTitle(h.rule)}</span><span class="day">${weekdayNames[h.date.getDay()]}</span>`;b.addEventListener('click',()=>{$('checkDate').value=iso(h.date);document.querySelector('input[name="shopType"][value="large"]').checked=true;renderResult();$('kontrola').scrollIntoView({behavior:'smooth',block:'start'})});wrap.appendChild(b)}$('futureRuleNote').hidden=y===2026}
  function icsEvent(h){const end=addDays(h.date,1),start=`${h.date.getFullYear()}${pad(h.date.getMonth()+1)}${pad(h.date.getDate())}`,stop=`${end.getFullYear()}${pad(end.getMonth()+1)}${pad(end.getDate())}`;return `BEGIN:VEVENT\r\nUID:svatek-${start}@rychlevypocty.cz\r\nDTSTART;VALUE=DATE:${start}\r\nDTEND;VALUE=DATE:${stop}\r\nSUMMARY:${h.name}\r\nDESCRIPTION:${ruleTitle(h.rule)} pro běžnou velkou prodejnu nad 200 m2. Ověřte konkrétní pobočku.\r\nEND:VEVENT\r\n`}
  function downloadIcs(events,name){const text=`BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//RychleVypocty.cz//Statni svatky//CS\r\n${events}END:VCALENDAR\r\n`,blob=new Blob([text],{type:'text/calendar;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
  async function copyResult(){const d=parseDate($('checkDate').value);if(!d)return;const type=document.querySelector('input[name="shopType"]:checked')?.value||'large',h=holidayAt(d),out=baseOutcome(d,type),text=`${label(d)}${h?` – ${h.name}`:''}. ${shopLabels[type]}: ${out.main}. ${out.explain}`;try{await navigator.clipboard.writeText(text);$('actionStatus').textContent='Výsledek zkopírován.'}catch(_){$('actionStatus').textContent='Kopírování není v tomto prohlížeči dostupné.'}setTimeout(()=>$('actionStatus').textContent='',2200)}
  function bind(){
    $('checkDate').addEventListener('change',renderResult);$$('input[name="shopType"]').forEach(x=>x.addEventListener('change',renderResult));
    $$('[data-quick]').forEach(btn=>btn.addEventListener('click',()=>{const action=btn.dataset.quick,t=today();if(action==='today')$('checkDate').value=iso(t);if(action==='next')$('checkDate').value=iso(nextHoliday(t,true).date);if(action==='christmas')$('checkDate').value=`${$('yearSelect').value}-12-24`;renderResult()}));
    $('[data-christmas-link]')?.addEventListener('click',()=>{$('checkDate').value=`${$('yearSelect').value}-12-24`;renderResult()});
    $('yearSelect').addEventListener('change',renderYear);
    $('downloadYear').addEventListener('click',()=>{const y=Number($('yearSelect').value);downloadIcs(holidays(y).map(icsEvent).join(''),`statni-svatky-${y}.ics`)});
    $('downloadOne').addEventListener('click',()=>{const d=parseDate($('checkDate').value);if(!d)return;const h=holidayAt(d)||{date:d,name:`Kontrola data – ${label(d)}`,rule:'open'};downloadIcs(icsEvent(h),`datum-${iso(d)}.ics`)});
    $('copyResult').addEventListener('click',copyResult);
    const menu=$('menuBtn'),mobile=$('mobile-nav');if(menu&&mobile){menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));mobile.classList.toggle('is-open',!open)});document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.setAttribute('aria-expanded','false');mobile.classList.remove('is-open')}})}
  }
  function init(){const params=new URLSearchParams(location.search),paramDate=parseDate(params.get('datum')||''),type=params.get('typ');const d=paramDate||today();$('checkDate').value=iso(d);$('yearSelect').value=String(Math.min(2030,Math.max(2026,d.getFullYear())));if(shopLabels[type]){const radio=document.querySelector(`input[name="shopType"][value="${type}"]`);if(radio)radio.checked=true}renderHero();renderYear();renderResult();bind()}
  init();
})();
