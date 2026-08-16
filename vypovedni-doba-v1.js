(function(){
'use strict';

var $=function(id){return document.getElementById(id);};
var form=$('noticeForm');
if(!form) return;

var state={mode:'basic'};
var cutoff=new Date(2025,5,1); // 1. 6. 2025

function pad(n){return String(n).padStart(2,'0');}
function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function parseDate(value){
  if(!value) return null;
  var p=value.split('-').map(Number);
  if(p.length!==3||!p[0]||!p[1]||!p[2]) return null;
  var d=new Date(p[0],p[1]-1,p[2]);
  return (d.getFullYear()===p[0]&&d.getMonth()===p[1]-1&&d.getDate()===p[2])?d:null;
}
function fmt(d){return d?new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'long',year:'numeric'}).format(d):'—';}
function fmtShort(d){return d?new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'numeric',year:'numeric'}).format(d):'—';}
function monthName(d){return d?new Intl.DateTimeFormat('cs-CZ',{month:'long',year:'numeric'}).format(d):'—';}
function daysBetween(a,b){return Math.round((b-a)/86400000);}
function addMonthsSameDay(d,n){
  var y=d.getFullYear(),m=d.getMonth()+n,day=d.getDate();
  var targetY=y+Math.floor(m/12),targetM=((m%12)+12)%12;
  var last=new Date(targetY,targetM+1,0).getDate();
  return new Date(targetY,targetM,Math.min(day,last));
}
function oldStyleEnd(d,months){
  var start=new Date(d.getFullYear(),d.getMonth()+1,1);
  return new Date(start.getFullYear(),start.getMonth()+months,0);
}
function oldStyleStart(d){return new Date(d.getFullYear(),d.getMonth()+1,1);}
function plusDaysInclusiveStart(d,days){var out=new Date(d);out.setDate(out.getDate()+Math.max(0,days-1));return out;}
// § 51a contains both a deadline (lhůta) for giving notice and a 15-day notice period (doba).
// The notice period starts on the delivery day; statutory deadlines are modelled separately.
function easterSunday(year){
  var a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
  var h=(19*a+b-Math.floor(b/4)-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
  var month=Math.floor((h+l-7*m+114)/31)-1,day=((h+l-7*m+114)%31)+1;
  return new Date(year,month,day);
}
function sameDay(a,b){return a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();}
function isCzechPublicHoliday(d){
  var m=d.getMonth()+1,day=d.getDate();
  var fixed={'1-1':1,'5-1':1,'5-8':1,'7-5':1,'7-6':1,'9-28':1,'10-28':1,'11-17':1,'12-24':1,'12-25':1,'12-26':1};
  if(fixed[m+'-'+day]) return true;
  var easter=easterSunday(d.getFullYear()),goodFriday=new Date(easter),easterMonday=new Date(easter);
  goodFriday.setDate(goodFriday.getDate()-2);easterMonday.setDate(easterMonday.getDate()+1);
  return sameDay(d,goodFriday)||sameDay(d,easterMonday);
}
function isWorkingDay(d){var wd=d.getDay();return wd!==0&&wd!==6&&!isCzechPublicHoliday(d);}
function extendDeadlineToWorkingDay(d){var out=new Date(d);while(!isWorkingDay(out))out.setDate(out.getDate()+1);return out;}
function deadlineDaysAfterEvent(d,days){var out=new Date(d);out.setDate(out.getDate()+Math.max(0,days));return extendDeadlineToWorkingDay(out);}
function deadlineMonthsAfterEvent(d,months){return extendDeadlineToWorkingDay(addMonthsSameDay(d,months));}
function escapeText(v){return String(v==null?'':v);}

function getMode(){return document.body.dataset.noticeMode||'basic';}
function selected(name){var el=form.querySelector('input[name="'+name+'"]:checked');return el?el.value:'';}

function baseMinimumMonths(who,reason){
  return who==='employer'&&reason==='short'?1:2;
}

function calculate(){
  var delivery=parseDate($('deliveryDate').value);
  var who=selected('who')||'employee';
  var reason=selected('reason')||'standard';
  var mode=getMode();
  var contractRule=mode==='advanced'&&$('contractOldStyle').checked;
  var customLength=mode==='advanced'&&$('customLength').checked;
  var requestedMonths=Math.max(1,Math.min(12,parseInt($('customMonths').value,10)||2));
  var protection=mode==='advanced'&&$('protectionFlag').checked;
  var transfer=mode==='advanced'&&$('transferFlag').checked;
  var minimum=baseMinimumMonths(who,reason);
  var months=customLength?Math.max(requestedMonths,minimum):minimum;
  var historical=delivery&&delivery<cutoff;
  var running=historical?'old':(contractRule?'contract-old':'current');
  var start,end,regimeLabel,regimeShort;

  var transferDate=parseDate($('transferDate').value);
  var informedDate=parseDate($('informedDate').value);
  var informedTimely=$('informedTimely').checked;
  var transferSpecial=null;

  if(delivery && transfer && who==='employee' && transferDate){
    if(informedTimely && informedDate){
      var deadline=deadlineDaysAfterEvent(informedDate,15);
      if(delivery>=informedDate && delivery<=deadline){
        transferSpecial='before-transfer';
        start=delivery;
        end=new Date(transferDate); end.setDate(end.getDate()-1);
        regimeLabel='Speciální režim § 51a — oznámený přechod';
        regimeShort='§ 51a · konec před přechodem';
      }
    }else if(!informedTimely){
      if(delivery<transferDate){
        transferSpecial='before-transfer';
        start=delivery;
        end=new Date(transferDate); end.setDate(end.getDate()-1);
        regimeLabel='Speciální režim § 51a — pozdní/neúplné informování';
        regimeShort='§ 51a · konec před přechodem';
      }else{
        var twoMonthsAfter=deadlineMonthsAfterEvent(transferDate,2);
        if(delivery<=twoMonthsAfter){
          transferSpecial='fifteen-days';
          start=delivery;
          end=plusDaysInclusiveStart(delivery,15);
          regimeLabel='Speciální 15denní výpovědní doba podle § 51a';
          regimeShort='§ 51a · 15 dnů';
        }
      }
    }
  }

  if(delivery && !transferSpecial){
    if(running==='current'){
      start=new Date(delivery);
      end=addMonthsSameDay(delivery,months);
      regimeLabel='Zákonný běh od 1. 6. 2025';
      regimeShort='§ 51 · ode dne doručení';
    }else{
      start=oldStyleStart(delivery);
      end=oldStyleEnd(delivery,months);
      regimeLabel=historical?'Historický režim do 31. 5. 2025':'Smluvní model: od 1. dne dalšího měsíce';
      regimeShort=historical?'starý § 51':'smluvní běh';
    }
  }

  var statutoryEnd=delivery?addMonthsSameDay(delivery,months):null;
  var oldEnd=delivery?oldStyleEnd(delivery,months):null;
  var delta=statutoryEnd&&oldEnd?daysBetween(statutoryEnd,oldEnd):null;
  var invalidCustom=customLength&&requestedMonths<minimum;
  var transferUnresolved=transfer && who==='employee' && transferDate && !transferSpecial;

  return {delivery:delivery,who:who,reason:reason,mode:mode,minimum:minimum,months:months,requestedMonths:requestedMonths,customLength:customLength,invalidCustom:invalidCustom,contractRule:contractRule,historical:historical,running:running,start:start,end:end,statutoryEnd:statutoryEnd,oldEnd:oldEnd,delta:delta,protection:protection,transfer:transfer,transferSpecial:transferSpecial,transferUnresolved:transferUnresolved,transferDate:transferDate,informedDate:informedDate,informedTimely:informedTimely,regimeLabel:regimeLabel,regimeShort:regimeShort};
}

function render(){
  var r=calculate();
  var employer=$('employerReasonWrap');
  employer.hidden=r.who!=='employer';
  $('employeeTransferWrap').hidden=!(r.mode==='advanced'&&r.who==='employee');
  $('advancedFields').hidden=r.mode!=='advanced';
  $('customMonthsWrap').hidden=!$('customLength').checked;
  $('transferFields').hidden=!($('transferFlag').checked&&r.who==='employee');

  var resultDate=$('resultDate');
  var resultTitle=$('resultTitle');
  var status=$('resultStatus');
  var statusText='Běžný výpočet';
  var statusClass='notice-status';

  if(!r.delivery){
    resultDate.textContent='Zadejte datum';
    resultTitle.textContent='Poslední den pracovního poměru';
    $('resultMeaning').textContent='Nejdřív potřebujeme datum, kdy byla výpověď skutečně doručena druhé straně.';
    return;
  }

  if(r.transferUnresolved){
    resultDate.textContent='Ověřte § 51a';
    resultTitle.textContent='Speciální režim nelze bezpečně určit';
    $('resultMeaning').textContent='Zadané údaje nespadají jednoznačně do modelované 15denní nebo před-přechodové varianty. Zobrazujeme proto jen standardní orientaci níže, ne právní závěr.';
    statusText='Individuální kontrola'; statusClass+=' is-warning';
  }else if(r.end){
    resultDate.textContent=fmt(r.end);
    resultTitle.textContent='Pracovní poměr končí';
    $('resultMeaning').textContent=r.transferSpecial?
      'Výsledek používá speciální režim přechodu práv a povinností. Před použitím ověřte, že jsou splněny přesné podmínky § 51a.':
      (r.historical?'Výpověď byla doručena před 1. 6. 2025, proto se běh určuje podle dřívější úpravy.':(r.contractRule?'Počítáme model výslovně sjednaného běhu od prvního dne dalšího měsíce. MPSV tento výklad označuje jako nezávazný.':'Od 1. 6. 2025 standardně běží výpovědní doba už ode dne doručení.'));
  }

  if(r.protection&&r.who==='employer'){
    statusText='Pozor na ochrannou dobu'; statusClass+=' is-warning';
    $('resultMeaning').textContent+=' Pokud po doručení nastala ochranná doba a § 53 se na váš důvod vztahuje, může se skutečný konec posunout. Kalkulačka tento individuální posun automaticky nedopočítává.';
  }else if(r.invalidCustom){
    statusText='Použito zákonné minimum'; statusClass+=' is-warning';
  }else if(r.transferSpecial){
    statusText='Speciální režim'; statusClass+=' is-special';
  }else if(r.contractRule){
    statusText='Smluvní model'; statusClass+=' is-special';
  }else if(r.historical){
    statusText='Historický režim'; statusClass+=' is-special';
  }else if(r.reason==='short'&&r.who==='employer'){
    statusText='1měsíční minimum'; statusClass+=' is-special';
  }
  status.className=statusClass; status.textContent=statusText;

  $('startValue').textContent=fmtShort(r.start);
  $('endValue').textContent=fmtShort(r.end);
  $('lengthValue').textContent=r.transferSpecial==='fifteen-days'?'15 dnů':(r.transferSpecial==='before-transfer'?'do dne před přechodem':r.months+' '+(r.months===1?'měsíc':'měsíce'));
  $('regimeValue').textContent=r.regimeShort||'—';
  $('calendarValue').textContent=r.delivery&&r.end?(daysBetween(r.delivery,r.end)+1)+' kalendářních dnů':'—';
  var next=r.end?new Date(r.end):null;if(next)next.setDate(next.getDate()+1);
  $('nextDayValue').textContent=next?fmtShort(next):'—';

  $('timelineDelivery').textContent=fmtShort(r.delivery);
  $('timelineStart').textContent=fmtShort(r.start);
  $('timelineEnd').textContent=fmtShort(r.end);
  $('timelineStartLabel').textContent=(r.running==='old'||r.running==='contract-old')?'1. den dalšího měsíce':'běží od doručení';

  var compare=$('compareCard');
  if(!r.transferSpecial && !r.historical && r.statutoryEnd && r.oldEnd){
    compare.hidden=false;
    $('compareCurrent').textContent=fmtShort(r.statutoryEnd);
    $('compareOld').textContent=fmtShort(r.oldEnd);
    $('compareDelta').textContent=(r.delta>0?'+':'')+r.delta+' dnů';
    $('compareText').textContent=r.delta===0?'V tomto datu vycházejí oba modely stejně.':'Model od 1. dne dalšího měsíce by v tomto scénáři skončil o '+r.delta+' '+(r.delta===1?'den':'dnů')+' později.';
  }else compare.hidden=true;

  $('methodDate').textContent='Metodika ověřena 16. 8. 2026';
  $('resultSource').textContent=r.contractRule?'Smluvní model + nezávazný výklad MPSV':(r.historical?'Přechodná pravidla flexinovely':'§ 51 zákoníku práce');

  updateHeroExample(r.delivery);
  document.documentElement.dataset.rvState='ready';
  setTimeout(function(){delete document.documentElement.dataset.rvState;},340);
}

function updateHeroExample(d){
  if(!d) return;
  var newEnd=addMonthsSameDay(d,2),oldEnd=oldStyleEnd(d,2),delta=daysBetween(newEnd,oldEnd);
  $('heroDelivery').textContent=fmtShort(d);
  $('heroCurrentEnd').textContent=fmtShort(newEnd);
  $('heroOldEnd').textContent=fmtShort(oldEnd);
  $('heroDelta').textContent=(delta>0?'+':'')+delta+' dnů';
}

function setMode(mode){
  document.body.dataset.noticeMode=mode;
  document.querySelectorAll('[data-notice-mode]').forEach(function(btn){
    var active=btn.dataset.noticeMode===mode;
    btn.classList.toggle('is-active',active);btn.setAttribute('aria-selected',String(active));
  });
  render();
}

function serialize(){
  var r=calculate(),p=new URLSearchParams();
  if(r.delivery)p.set('d',iso(r.delivery));
  p.set('by',r.who); if(r.who==='employer')p.set('reason',r.reason);
  if(r.mode==='advanced'){
    p.set('mode','advanced');
    if(r.contractRule)p.set('contract','oldstyle');
    if(r.customLength){p.set('length','custom');p.set('months',String(r.requestedMonths));}
    if(r.protection)p.set('protection','1');
    if(r.transfer){p.set('transfer','1');if(r.transferDate)p.set('td',iso(r.transferDate));if(r.informedDate)p.set('id',iso(r.informedDate));if(r.informedTimely)p.set('timely','1');}
  }
  return location.origin+location.pathname+'?'+p.toString()+'#kalkulacka';
}
function applyQuery(){
  var p=new URLSearchParams(location.search);
  if(p.get('d'))$('deliveryDate').value=p.get('d');
  var by=p.get('by');if(by&&form.querySelector('input[name="who"][value="'+by+'"]'))form.querySelector('input[name="who"][value="'+by+'"]').checked=true;
  var reason=p.get('reason');if(reason&&form.querySelector('input[name="reason"][value="'+reason+'"]'))form.querySelector('input[name="reason"][value="'+reason+'"]').checked=true;
  if(p.get('mode')==='advanced')document.body.dataset.noticeMode='advanced';
  $('contractOldStyle').checked=p.get('contract')==='oldstyle';
  $('customLength').checked=p.get('length')==='custom';
  if(p.get('months'))$('customMonths').value=p.get('months');
  $('protectionFlag').checked=p.get('protection')==='1';
  $('transferFlag').checked=p.get('transfer')==='1';
  if(p.get('td'))$('transferDate').value=p.get('td');if(p.get('id'))$('informedDate').value=p.get('id');$('informedTimely').checked=p.get('timely')==='1';
}

function copyText(text,button,ok){
  if(navigator.clipboard&&window.isSecureContext){navigator.clipboard.writeText(text).then(function(){flash(button,ok);});}
  else{var t=document.createElement('textarea');t.value=text;document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();flash(button,ok);}
}
function flash(btn,text){var old=btn.textContent;btn.textContent=text;setTimeout(function(){btn.textContent=old;},1500);}

form.addEventListener('input',render);form.addEventListener('change',render);
document.querySelectorAll('[data-notice-mode]').forEach(function(btn){btn.addEventListener('click',function(){setMode(btn.dataset.noticeMode);});});
$('resetNotice').addEventListener('click',function(){
  form.reset();var today=new Date();$('deliveryDate').value=iso(today);document.body.dataset.noticeMode='basic';history.replaceState(null,'',location.pathname+'#kalkulacka');setMode('basic');
});
$('copyResult').addEventListener('click',function(){var r=calculate();if(!r.end)return;copyText('Výpověď doručena '+fmtShort(r.delivery)+' → pracovní poměr končí '+fmtShort(r.end)+' ('+(r.regimeShort||'výpočet')+').',this,'Zkopírováno');});
$('shareResult').addEventListener('click',function(){copyText(serialize(),this,'Odkaz zkopírován');});

var menu=$('menuToggle'),nav=$('mainNav');if(menu&&nav){menu.addEventListener('click',function(){var open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));nav.classList.toggle('is-open',!open);});document.addEventListener('keydown',function(e){if(e.key==='Escape'){menu.setAttribute('aria-expanded','false');nav.classList.remove('is-open');}});}

applyQuery();
if(!$('deliveryDate').value)$('deliveryDate').value=iso(new Date());
setMode(document.body.dataset.noticeMode||'basic');
})();
