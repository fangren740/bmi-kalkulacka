(function(){
'use strict';
var LIMIT1=2000000, LIMIT2=2536500, YEAR=2026;
var $=function(id){return document.getElementById(id)};
var form=$('vatTrackerForm'), txRows=$('txRows');
function num(v){var n=Number(String(v==null?'':v).replace(/\s/g,'').replace(',','.'));return Number.isFinite(n)?n:0}
function clamp(v,a,b){return Math.min(b,Math.max(a,v))}
function isoDate(d){if(!d||isNaN(d))return '';return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function parseDate(v){if(!v)return null;var p=v.split('-').map(Number);if(p.length!==3)return null;var d=new Date(p[0],p[1]-1,p[2],12);return isNaN(d)?null:d}
function fmtDate(d){if(!d)return '—';return new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'numeric',year:'numeric'}).format(d)}
function fmtDateShort(d){if(!d)return '—';return new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'numeric'}).format(d)}
function fmtMoney(v){return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(v))+' Kč'}
function fmtPct(v){return new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:1}).format(v)+' %'}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
function daysInYear(y){return ((y%4===0&&y%100!==0)||y%400===0)?366:365}
function dayOfYear(d){return Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(d.getFullYear(),0,0))/86400000)}
function easterSunday(year){
  var a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
  return new Date(year,month-1,day,12);
}
function holidaySet(year){
  var out=new Set(['01-01','05-01','05-08','07-05','07-06','09-28','10-28','11-17','12-24','12-25','12-26'].map(function(md){return year+'-'+md}));
  var e=easterSunday(year);out.add(isoDate(addDays(e,-2)));out.add(isoDate(addDays(e,1)));return out;
}
function isWorkday(d){return d.getDay()!==0&&d.getDay()!==6&&!holidaySet(d.getFullYear()).has(isoDate(d))}
function addWorkdaysAfter(date,count){if(!date)return null;var d=new Date(date),n=0,guard=0;while(n<count&&guard<100){d=addDays(d,1);if(isWorkday(d))n++;guard++;}return d}
function nextDay(date){return date?addDays(date,1):null}
function nextJan1(date){return date?new Date(date.getFullYear()+1,0,1,12):null}
function currentYearDate(){var now=new Date();if(now.getFullYear()===YEAR)return now;return new Date(YEAR,7,16,12)}
function setDefaultDates(){if(!$('asOfDate').value)$('asOfDate').value=isoDate(currentYearDate())}
function mode(){return document.body.dataset.vatView||'basic'}
function setMode(next){
  document.body.dataset.vatView=next;
  document.querySelectorAll('.vat-mode-btn').forEach(function(btn){var on=btn.dataset.vatMode===next;btn.classList.toggle('is-active',on);btn.setAttribute('aria-selected',String(on));btn.tabIndex=on?0:-1});
  $('basicPanel').hidden=next!=='basic';$('trackerPanel').hidden=next!=='tracker';render();
}
function forecast(turnover,asOf,limit){
  if(!asOf||asOf.getFullYear()!==YEAR||turnover<=0||turnover>limit)return null;
  var doy=dayOfYear(asOf),rate=turnover/Math.max(1,doy),targetDay=Math.ceil(limit/rate);
  if(targetDay>daysInYear(YEAR))return null;
  return new Date(YEAR,0,targetDay,12);
}
function getBasic(){
  var turnover=Math.max(0,num($('basicTurnover').value)),asOf=parseDate($('asOfDate').value),c1=parseDate($('crossDate1').value),c2=parseDate($('crossDate2').value);
  return {turnover:turnover,asOf:asOf,cross1:c1,cross2:c2,source:'basic'};
}
function getTransactions(){
  var rows=[];
  txRows.querySelectorAll('.tx-row').forEach(function(row){var d=parseDate(row.querySelector('.tx-date').value),a=Math.max(0,num(row.querySelector('.tx-amount').value));if(d&&a>0&&d.getFullYear()===YEAR)rows.push({date:d,amount:a})});
  rows.sort(function(a,b){return a.date-b.date});return rows;
}
function getTracker(){
  var rows=getTransactions(),turnover=0,c1=null,c2=null;rows.forEach(function(r){turnover+=r.amount;if(!c1&&turnover>LIMIT1)c1=new Date(r.date);if(!c2&&turnover>LIMIT2)c2=new Date(r.date)});
  var asOf=rows.length?new Date(rows[rows.length-1].date):parseDate($('asOfDate').value)||currentYearDate();
  return {turnover:turnover,asOf:asOf,cross1:c1,cross2:c2,source:'tracker',rows:rows};
}
function stateFor(r){
  var t=r.turnover;
  if(t>LIMIT2)return 'upper';
  if(t===LIMIT2)return 'upper-equal';
  if(t>LIMIT1)return 'lower';
  if(t===LIMIT1)return 'lower-equal';
  return 'below';
}
function statusText(state){return {below:'Pod limity','lower-equal':'Přesně na 2 mil.','lower':'Překročen 1. limit','upper-equal':'Přesně na vyšším limitu','upper':'Překročen vyšší limit'}[state]}
function renderHero(r){
  $('heroTurnover').textContent=fmtMoney(r.turnover);var pct=clamp(r.turnover/LIMIT2*100,0,100);$('heroFill').style.width=pct+'%';$('heroDot').style.left=pct+'%';
  var rem1=Math.max(0,LIMIT1-r.turnover),rem2=Math.max(0,LIMIT2-r.turnover),state=stateFor(r);
  if(state==='below')$('heroCaption').textContent=fmtMoney(rem1)+' do prvního limitu';
  else if(state==='lower-equal')$('heroCaption').textContent='2 mil. Kč dosaženy, ale ještě nepřekročeny';
  else if(state==='lower')$('heroCaption').textContent='První limit překročen · '+fmtMoney(rem2)+' do vyššího';
  else if(state==='upper-equal')$('heroCaption').textContent='Vyšší limit dosažen, ale ještě nepřekročen';
  else $('heroCaption').textContent='Vyšší limit překročen';
}
function renderBasicConditional(r){
  var show1=r.turnover>LIMIT1,show2=r.turnover>LIMIT2;$('cross1Block').hidden=!show1;$('cross2Block').hidden=!show2;
}
function deadlineFor(r){if(r.turnover>LIMIT2&&r.cross2)return addWorkdaysAfter(r.cross2,10);if(r.turnover>LIMIT1&&r.cross1)return addWorkdaysAfter(r.cross1,10);return null}
function render(r){
  r=r||(mode()==='tracker'?getTracker():getBasic());var state=stateFor(r),rem1=Math.max(0,LIMIT1-r.turnover),rem2=Math.max(0,LIMIT2-r.turnover),pct=clamp(r.turnover/LIMIT2*100,0,100);
  if(r.source==='basic')renderBasicConditional(r);renderHero(r);
  $('resultStatus').textContent=statusText(state);$('resultStatus').className='vat-status '+(state==='upper'?'is-danger':state==='lower'?'is-warning':(state.indexOf('equal')>-1?'is-edge':'is-safe'));
  $('resultTurnover').textContent=fmtMoney(r.turnover);$('resultAsOf').textContent=r.asOf?'stav k '+fmtDate(r.asOf):'stav bez data';
  $('progressFill').style.width=pct+'%';$('progressDot').style.left=pct+'%';$('progressPct').textContent=fmtPct(pct);
  $('toFirst').textContent=r.turnover>LIMIT1?'překročeno':r.turnover===LIMIT1?'0 Kč · přesně na hranici':fmtMoney(rem1);
  $('toSecond').textContent=r.turnover>LIMIT2?'překročeno':r.turnover===LIMIT2?'0 Kč · přesně na hranici':fmtMoney(rem2);
  var dl=deadlineFor(r);$('registrationDeadline').textContent=dl?fmtDate(dl):((r.turnover>LIMIT1)?'doplňte datum':'zatím nevznikla');
  var f1=forecast(r.turnover,r.asOf,LIMIT1),f2=forecast(r.turnover,r.asOf,LIMIT2);
  $('forecastFirst').textContent=r.turnover>LIMIT1?'už překročeno':r.turnover===LIMIT1?'na hranici':(f1?fmtDate(f1):'při tempu letos ne');
  $('forecastSecond').textContent=r.turnover>LIMIT2?'už překročeno':r.turnover===LIMIT2?'na hranici':(f2?fmtDate(f2):'při tempu letos ne');
  var headline='',meaning='',next='';
  if(state==='below'){headline='Registrační povinnost z obratu zatím nevzniká';meaning='Do prvního limitu zbývá '+fmtMoney(rem1)+'. Vyšší limit je ještě o '+fmtMoney(rem2)+' dál.';next='Sledujte obrat za celý kalendářní rok. Jakmile 2 mil. Kč skutečně překročíte, začne běžet 10 pracovních dnů na přihlášku.';}
  if(state==='lower-equal'){headline='Jste přesně na 2 000 000 Kč';meaning='Zákon pracuje s překročením částky. Samotné dosažení 2 mil. Kč ještě není totéž jako její překročení.';next='Další započitatelné plnění může spustit registrační lhůtu. Hlídání po jednotlivých transakcích je teď přesnější než měsíční odhad.';}
  if(state==='lower'){headline='Překročili jste první limit 2 mil. Kč';meaning='Přihlášku je třeba podat do 10 pracovních dnů od dne překročení. Bez volby dřívějšího plátcovství se standardně stanete plátcem 1. ledna následujícího roku.';next='Pokud ve včasné přihlášce zvolíte § 6 odst. 2 písm. a), můžete být plátcem už od následujícího dne po překročení 2 mil. Kč. Pokud ještě letos překročíte 2 536 500 Kč, vznikne dřívější plátcovství ze zákona.';}
  if(state==='upper-equal'){headline='Jste přesně na 2 536 500 Kč';meaning='Vyšší limit je dosažen, ale zákon opět mluví o jeho překročení. Rozhodující může být další započitatelné plnění.';next='Přesný tracker pomůže zachytit první transakci, která kumulativní obrat posune nad 2 536 500 Kč.';}
  if(state==='upper'){headline='Vyšší limit byl překročen';meaning='Plátcem se standardně stáváte dnem následujícím po překročení 2 536 500 Kč. Přihláška se podává do 10 pracovních dnů od překročení.';next='Pokud už jste podali přihlášku po překročení 2 mil. Kč s plátcovstvím od 1. ledna, Finanční správa uvádí, že po překročení 2 536 500 Kč se podává nová přihláška.';}
  $('resultHeadline').textContent=headline;$('resultMeaning').textContent=meaning;$('nextAction').textContent=next;
  var defaultPayer='—',earlyPayer='—',upperPayer='—';
  if(r.cross1){defaultPayer=fmtDate(nextJan1(r.cross1));earlyPayer=fmtDate(nextDay(r.cross1));}
  if(r.cross2)upperPayer=fmtDate(nextDay(r.cross2));
  $('defaultPayer').textContent=defaultPayer;$('earlyPayer').textContent=earlyPayer;$('upperPayer').textContent=upperPayer;
  $('crossOneResult').textContent=r.cross1?fmtDate(r.cross1):'—';$('crossTwoResult').textContent=r.cross2?fmtDate(r.cross2):'—';
  $('deadlineNote').textContent=dl?'10. pracovní den po překročení vychází na '+fmtDate(dl)+'.':'Pro přesný termín registrace potřebujeme datum skutečného překročení příslušné hranice.';
  $('trackerCount').textContent=r.source==='tracker'?(r.rows.length+' položek'):'rychlý stav';

  // Progressive disclosure: show only information that matters in the current state.
  var crossed=state==='lower'||state==='upper';
  $('vatResultMeta').hidden=!crossed;
  $('metaCross1').hidden=state!=='lower'&&state!=='upper';
  $('metaCross2').hidden=state!=='upper';
  $('metaDeadline').hidden=!crossed;
  $('metaMode').hidden=!crossed;
  $('deadlineNote').hidden=!crossed;

  var pathDetails=$('vatPathDetails');
  pathDetails.open=crossed;
  $('pathDefault').hidden=state==='upper';
  $('pathEarly').hidden=state==='upper';
  $('pathUpper').hidden=false;

  var forecastDetails=$('vatForecastDetails');
  var forecastRequested=r.source==='tracker'||($('asOfDetails')&&$('asOfDetails').open);
  forecastDetails.hidden=crossed||!forecastRequested;
  forecastDetails.open=false;
  var forecastLabel='Zobrazit orientační forecast';
  if(state==='below'||state==='lower-equal'){
    if(f1)forecastLabel='2 mil. kolem '+fmtDate(f1);
    else if(f2)forecastLabel='vyšší limit kolem '+fmtDate(f2);
    else forecastLabel='při aktuálním tempu letos ne';
  }
  $('forecastSummary').textContent=forecastLabel;
}
function addTx(date,amount){
  var row=document.createElement('div');row.className='tx-row';row.innerHTML='<label><span>Datum plnění</span><input class="tx-date" type="date" min="2026-01-01" max="2026-12-31" value="'+(date||'')+'"></label><label><span>Částka do obratu</span><span class="money-input"><input class="tx-amount" type="number" min="0" step="1" inputmode="decimal" value="'+(amount||'')+'"><em>Kč</em></span></label><button type="button" class="tx-remove" aria-label="Odstranit položku">×</button>';txRows.appendChild(row);return row;
}
function loadExample(){txRows.innerHTML='';addTx('2026-02-16','480000');addTx('2026-04-30','620000');addTx('2026-06-30','610000');addTx('2026-08-16','450000');render(getTracker())}
function serialize(){var p=new URLSearchParams();if(mode()==='tracker'){p.set('mode','tracker');var rows=getTransactions();if(rows.length<=20)p.set('tx',rows.map(function(r){return isoDate(r.date)+':'+Math.round(r.amount)}).join(','));}else{p.set('obrat',String(Math.round(num($('basicTurnover').value))));p.set('datum',$('asOfDate').value);if($('crossDate1').value)p.set('c1',$('crossDate1').value);if($('crossDate2').value)p.set('c2',$('crossDate2').value);}return location.origin+location.pathname+'?'+p.toString()+'#kalkulacka'}
function applyQuery(){var p=new URLSearchParams(location.search);if(p.get('mode')==='tracker'&&p.get('tx')){txRows.innerHTML='';p.get('tx').split(',').forEach(function(part){var s=part.split(':');if(s.length===2)addTx(s[0],s[1])});setMode('tracker');return;}if(p.get('obrat'))$('basicTurnover').value=p.get('obrat');if(p.get('datum'))$('asOfDate').value=p.get('datum');if(p.get('c1'))$('crossDate1').value=p.get('c1');if(p.get('c2'))$('crossDate2').value=p.get('c2');}
function flash(btn,text){var old=btn.textContent;btn.textContent=text;setTimeout(function(){btn.textContent=old},1400)}
function copyText(text,btn,ok){if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(function(){flash(btn,ok)})}else{var t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();flash(btn,ok)}}
function summary(){var r=mode()==='tracker'?getTracker():getBasic(),state=stateFor(r);return 'Obrat pro DPH: '+fmtMoney(r.turnover)+' ('+statusText(state)+'). Překročení 2 mil.: '+(r.cross1?fmtDate(r.cross1):'nezadáno')+'. Překročení 2 536 500 Kč: '+(r.cross2?fmtDate(r.cross2):'nezadáno')+'.'}
setDefaultDates();
if($('asOfDetails'))$('asOfDetails').addEventListener('toggle',function(){render()});
form.addEventListener('input',function(){render()});form.addEventListener('change',function(){render()});
document.querySelectorAll('.vat-mode-btn').forEach(function(btn){btn.addEventListener('click',function(){setMode(btn.dataset.vatMode)})});
$('addTx').addEventListener('click',function(){addTx('','');render(getTracker())});$('loadExample').addEventListener('click',loadExample);$('clearTx').addEventListener('click',function(){txRows.innerHTML='';addTx('','');render(getTracker())});
txRows.addEventListener('click',function(e){var b=e.target.closest('.tx-remove');if(b){b.closest('.tx-row').remove();if(!txRows.children.length)addTx('','');render(getTracker())}});
$('copyResult').addEventListener('click',function(){copyText(summary(),this,'Zkopírováno')});$('shareResult').addEventListener('click',function(){copyText(serialize(),this,'Odkaz zkopírován')});
$('resetVat').addEventListener('click',function(){form.reset();$('basicTurnover').value='1850000';$('asOfDate').value=isoDate(currentYearDate());$('crossDate1').value='';$('crossDate2').value='';txRows.innerHTML='';loadExample();setMode('basic');history.replaceState(null,'',location.pathname+'#kalkulacka')});
var menu=$('menuToggle'),nav=$('mainNav');if(menu&&nav){menu.addEventListener('click',function(){var open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav.classList.toggle('is-open',!open)});document.addEventListener('keydown',function(e){if(e.key==='Escape'){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open')}})}
applyQuery();if(!txRows.children.length)loadExample();render();
})();
