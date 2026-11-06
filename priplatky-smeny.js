(() => {
  'use strict';

  const doc = document;
  const $ = (id) => doc.getElementById(id);
  const qsa = (sel) => [...doc.querySelectorAll(sel)];
  const moneyFmt = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });
  const decFmt = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });

  const LEGAL = {
    wage: { night: 10, weekend: 10, holiday: 100, overtime: 25 },
    salary: { night: 20, weekend: 25, holiday: 100, overtime: 25 },
    agreement: { night: 10, weekend: 10, holiday: 100, overtime: 0 },
  };
  const LABEL = { wage: 'mzda', salary: 'plat', agreement: 'DPP / DPČ' };

  let inputMode = 'shift';
  let regime = 'wage';
  let ratesDirty = false;
  let lastCalc = null;
  let lastShift = null;

  function n(id, fallback = 0) {
    const v = Number.parseFloat(String($(id)?.value ?? '').replace(',', '.'));
    return Number.isFinite(v) ? v : fallback;
  }
  function money(v) { return `${moneyFmt.format(Number.isFinite(v) ? v : 0)} Kč`; }
  function hrs(v) { return `${decFmt.format(Number.isFinite(v) ? v : 0)} h`; }
  function pct(v) { return `${decFmt.format(v)} %`; }
  function setText(id, text) { const el = $(id); if (el) el.textContent = text; }

  function nextWeekday(day, weekday) {
    const date=new Date(day+'T00:00Z');
    const add=(weekday-date.getUTCDay()+7)%7;
    date.setUTCDate(date.getUTCDate()+add);
    return date.toISOString().slice(0,10);
  }
  function timeToMinutes(value) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(value || '');
    if(!m)return null;
    const hh=Number(m[1]),mm=Number(m[2]);
    return hh<=23&&mm<=59?hh*60+mm:null;
  }
  function normalizedClock(value) {
    let t=String(value||'').trim();
    if(/^\d{1,4}$/.test(t)){
      if(t.length<=2)t=t.padStart(2,'0')+'00';
      else t=t.padStart(4,'0');
      t=t.slice(0,2)+':'+t.slice(2);
    } else {
      const match=/^(\d{1,2}):(\d{1,2})$/.exec(t);
      if(match)t=match[1].padStart(2,'0')+':'+match[2].padStart(2,'0');
    }
    return timeToMinutes(t)===null?null:t;
  }
  
  function dateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function easterSunday(year) {
    const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4;
    const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30;
    const i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
    const month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
    return new Date(year, month-1, day);
  }
  function czechHolidays(year) {
    const fixed=['01-01','05-01','05-08','07-05','07-06','09-28','10-28','11-17','12-24','12-25','12-26'];
    const out=new Set(fixed.map(md=>`${year}-${md}`));
    const easter=easterSunday(year);
    const fri=new Date(easter); fri.setDate(easter.getDate()-2);
    const mon=new Date(easter); mon.setDate(easter.getDate()+1);
    out.add(dateKey(fri)); out.add(dateKey(mon));
    return out;
  }

  function isoDate(value) {
    const t=String(value||'').trim();
    let year,month,day;
    const iso=/^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
    const cz=/^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\.?$/.exec(t);
    if(iso){year=Number(iso[1]);month=Number(iso[2]);day=Number(iso[3]);}
    else if(cz){day=Number(cz[1]);month=Number(cz[2]);year=Number(cz[3]);}
    else return null;
    if(year<1900||year>2100||month<1||month>12||day<1||day>31)return null;
    const dt=new Date(Date.UTC(year,month-1,day));
    if(dt.getUTCFullYear()!==year||dt.getUTCMonth()!==month-1||dt.getUTCDate()!==day)return null;
    return String(year)+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');
  }
  function czechDate(date) {
    const iso=isoDate(date);
    if(!iso)return '';
    const [y,m,d]=iso.split('-');
    return Number(d)+'. '+Number(m)+'. '+y;
  }

  function defaultDate() {
    if (!$('shiftDate').value) $('shiftDate').value = czechDate(pragueClock.format(new Date()).slice(0,10));
    $('shiftDateNative').value = isoDate($('shiftDate').value)||'';
  }

  const pragueClock = new Intl.DateTimeFormat('sv-SE', {
    timeZone:'Europe/Prague', year:'numeric', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit', hourCycle:'h23'
  });
  const minuteMs = 60000;

  function pragueDateTime(date, minutes) {
    const target = date + ' ' + String(Math.floor(minutes/60)).padStart(2,'0') + ':' + String(minutes%60).padStart(2,'0');
    const wallTime = Date.parse(target.replace(' ','T')+'Z');
    const matches = [60,120].map(offset=>wallTime-offset*minuteMs)
      .filter(instant=>Number.isFinite(instant)&&pragueClock.format(instant)===target);
    return matches.length===1?new Date(matches[0]):null;
  }

  function tomorrow(date) {
    return new Date(Date.parse(date+'T00:00Z')+86400000).toISOString().slice(0,10);
  }

  const clockError = 'Čas v Praze neexistuje nebo je dvojznačný při změně času. Použijte skutečné hodiny z docházky.';
  function getShiftDates() {
    const date = isoDate($('shiftDate').value);
    const startMin = timeToMinutes($('shiftStart').value);
    const endMin = timeToMinutes($('shiftEnd').value);
    if (!date || startMin===null || endMin===null || startMin===endMin) return null;
    const start = pragueDateTime(date,startMin);
    const end = pragueDateTime(endMin<startMin?tomorrow(date):date,endMin);
    if(!start||!end)return {error:clockError};
    if(end<=start||(end-start)>86400000)return null;
    return {date,startMin,start,end};
  }

  function withinShift(dates, minutes) {
    return pragueDateTime(minutes<dates.startMin?tomorrow(dates.date):dates.date,minutes);
  }

  function analyzeShift() {
    const dates = getShiftDates();
    if (!dates) return { error:'Doplňte datum a dva různé časy. Maximální délka jednoho úseku je 24 hodin.' };
    if(dates.error)return dates;
    const { start, end } = dates;
    const breakMinutes = n('breakMinutes');
    if(!Number.isInteger(breakMinutes)||breakMinutes<0||breakMinutes>240)return {error:'Pauzu zadejte v celých minutách od 0 do 240.'};
    const breakTime = timeToMinutes($('breakStart').value);
    if (breakMinutes > 0 && breakTime === null) return { error:'Při nenulové neplacené přestávce zadejte také její začátek.' };

    let breakStart = null, breakEnd = null;
    if (breakMinutes > 0) {
      breakStart = withinShift(dates,breakTime);
      if(!breakStart)return {error:clockError};
      breakEnd = new Date(breakStart.getTime()+breakMinutes*60000);
      if (breakStart >= end || breakEnd > end) return { error:'Zadaná přestávka neleží uvnitř směny.' };
    }

    const overtimeMinutes = regime==='agreement'?0:n('overtimeHours')*60;
    let overtimeStart=null, overtimeEnd=null;
    if(overtimeMinutes>0&&$('overtimeStart').value){
      overtimeStart=withinShift(dates,timeToMinutes($('overtimeStart').value));
      if(!overtimeStart)return {error:clockError};
      overtimeEnd=new Date(overtimeStart.getTime()+overtimeMinutes*minuteMs);
      if(overtimeStart>=end||overtimeEnd>end||(breakStart&&overtimeStart<breakEnd&&overtimeEnd>breakStart)){
        return {error:'Souvislý přesčas musí celý ležet ve směně a nesmí zasahovat do pauzy. Jinak zadejte pouze součet přesčasových hodin.'};
      }
    }
    const totalElapsed = Math.round((end-start)/60000);
    const holidayCache = new Map();
    const getHol = (year) => { if(!holidayCache.has(year)) holidayCache.set(year,czechHolidays(year)); return holidayCache.get(year); };
    const minuteRows=[];
    let worked=0,night=0,weekend=0,holiday=0;
    let nw=0,nh=0,wh=0,nwh=0;

    for(let i=0;i<totalElapsed;i++) {
      const t = new Date(start.getTime()+i*60000);
      const onBreak = breakStart && t >= breakStart && t < breakEnd;
      const local=pragueClock.format(t);
      const day=local.slice(0,10);
      const hour=Number(local.slice(11,13));
      const weekday=new Date(day+'T00:00Z').getUTCDay();
      const isNight=hour>=22||hour<6;
      const isWeekend=weekday===0||weekday===6;
      const isHoliday=getHol(Number(day.slice(0,4))).has(day);
      const active=!onBreak;
      minuteRows.push({active,night:isNight&&active,weekend:isWeekend&&active,holiday:isHoliday&&active,overtime:Boolean(overtimeStart&&t>=overtimeStart&&t<overtimeEnd)});
      if(!active) continue;
      worked++;
      if(isNight) night++;
      if(isWeekend) weekend++;
      if(isHoliday) holiday++;
      if(isNight&&isWeekend&&isHoliday) nwh++;
      else {
        if(isNight&&isWeekend) nw++;
        if(isNight&&isHoliday) nh++;
        if(isWeekend&&isHoliday) wh++;
      }
    }
    const h=v=>v/60;
    return {
      start,end,totalElapsed,minuteRows,
      worked:h(worked),night:h(night),weekend:h(weekend),holiday:h(holiday),
      overlaps:{nw:h(nw+nwh),nh:h(nh+nwh),wh:h(wh+nwh),nwh:h(nwh)}
    };
  }

  function contiguousSegments(rows,key) {
    const out=[]; let start=null;
    rows.forEach((row,i)=>{
      const on=Boolean(row[key]);
      if(on && start===null) start=i;
      if(!on && start!==null){ out.push([start,i]); start=null; }
    });
    if(start!==null) out.push([start,rows.length]);
    return out;
  }
  function renderTrack(id, rows, key, cls) {
    const host=$(id); if(!host) return; host.replaceChildren();
    const total=Math.max(1,rows.length);
    contiguousSegments(rows,key).forEach(([a,b])=>{
      const el=doc.createElement('i'); el.className=`sf-track-bar ${cls}`;
      el.style.left=`${a/total*100}%`; el.style.width=`${(b-a)/total*100}%`;
      host.appendChild(el);
    });
  }
  let displayedShift;
  const timelineClock=new Intl.DateTimeFormat('cs-CZ',{timeZone:'Europe/Prague',hour:'2-digit',minute:'2-digit',hourCycle:'h23',timeZoneName:'shortOffset'});
  function inspectMinute(shift){
    const control=$('timelineCursor');
    const index=Number(control.value);
    const row=shift.minuteRows[index];
    const time=timelineClock.format(shift.start.getTime()+index*minuteMs);
    const labels={night:'Noční',weekend:'Víkend',holiday:'Svátek',overtime:'Přesčas'};
    const flags=row.active?['Práce',...Object.keys(labels).filter(key=>row[key]).map(key=>labels[key])]:['Neplacená pauza'];
    setText('timelineCursorTime',time);
    setText('timelineCursorFlags',flags.join(' · '));
    control.setAttribute('aria-valuetext',time+', '+flags.join(', '));
    $('timelineLanes').style.setProperty('--cursor',(index+.5)/shift.minuteRows.length*100+'%');
  }

  function renderTimeline(shift) {
    if(!shift || shift.error){ ['workTrack','nightTrack','weekendTrack','holidayTrack','overtimeTrack'].forEach(id=>$(id)?.replaceChildren()); return; }
    if(shift===displayedShift)return;
    displayedShift=shift;
    $('timelineCursor').max=shift.minuteRows.length-1;
    $('timelineCursor').value='0';
    inspectMinute(shift);
    renderTrack('workTrack',shift.minuteRows,'active','work');
    renderTrack('nightTrack',shift.minuteRows,'night','night');
    renderTrack('weekendTrack',shift.minuteRows,'weekend','weekend');
    renderTrack('holidayTrack',shift.minuteRows,'holiday','holiday');
    renderTrack('overtimeTrack',shift.minuteRows,'overtime','overtime');
    const overtime=n('overtimeHours');
    setText('overtimeTrackNote',regime==='agreement'||!overtime?'Bez zadaného přesčasu.':$('overtimeStart').value?'Vyznačený podle zadaného začátku.':hrs(overtime)+' bez určení polohy na ose.');
    const fmt=t=>pragueClock.format(t).slice(11,16);
    setText('timelineStart',fmt(shift.start)); setText('timelineEnd',fmt(shift.end));
    setText('timelineRange',`${fmt(shift.start)} → ${fmt(shift.end)} · ${hrs(shift.totalElapsed/60)} uplynulo`);
    setText('autoWorked',hrs(shift.worked)); setText('autoNight',hrs(shift.night)); setText('autoWeekend',hrs(shift.weekend)); setText('autoHoliday',hrs(shift.holiday));
  }

  let shiftKey;
  function currentHours() {
    if(inputMode==='manual') {
      return {
        worked:n('manualWorked'),
        night:n('manualNight'),
        weekend:n('manualWeekend'),
        holiday:n('manualHoliday'),
      };
    }
    const key=[regime,...['shiftDate','shiftStart','shiftEnd','breakMinutes','breakStart','overtimeHours','overtimeStart'].map(id=>$(id).value)].join('|');
    if(key!==shiftKey){lastShift=analyzeShift();shiftKey=key;}
    const s=lastShift;
    return s.error ? {error:s.error,worked:0,night:0,weekend:0,holiday:0} : s;
  }

  function rateDefaults(force=false) {
    if(ratesDirty && !force) return;
    const d=LEGAL[regime];
    $('nightPercent').value=d.night;
    $('weekendPercent').value=d.weekend;
    $('holidayPercent').value=d.holiday;
    $('overtimePercent').value=regime==='salary' && $('salaryRestDay').checked ? 50 : d.overtime;
    ratesDirty=false;
  }
  function updateRegimeUi() {
    $('payRegime').value=regime;
    qsa('[data-regime]').forEach(b=>{const active=b.dataset.regime===regime;b.classList.toggle('is-active',active);b.setAttribute('aria-checked',String(active));b.setAttribute('tabindex',active?'0':'-1');});
    $('salaryRestWrap').hidden=regime!=='salary';
    $('wageOvertimeIncludedWrap').hidden=regime!=='wage';
    if(regime!=='salary') $('salaryRestDay').checked=false;
    if(regime!=='wage') $('wageOvertimeIncluded').checked=false;
    const overtime=$('overtimeHours');
    const overtimeComp=$('overtimeCompensation');
    ['nightPercent','weekendPercent','holidayPercent','overtimePercent'].forEach(id=>$(id).readOnly=regime==='salary');
    $('overtimeStart').disabled=regime==='agreement';
    const disabled=regime==='agreement';
    overtime.disabled=disabled; overtimeComp.disabled=disabled;
    if(disabled){ overtime.value=0; setText('overtimeHint','U DPP/DPČ se práce přesčas v právním smyslu nekoná; zákonný přesčasový příplatek proto model nepřidává.'); }
    else setText('overtimeHint','Použijte pouze hodiny, které skutečně splňují podmínky práce přesčas.');
    setText('ratesIntro',regime==='salary'
      ? 'Pro plat používáme výchozí zákonné sazby 20 % noc, 25 % víkend a 25/50 % přesčas. Procentní sazby jsou v modelu platu pevné.'
      : regime==='agreement'
        ? 'DPP/DPČ používá pro noc, víkend a svátek obdobná pravidla jako mzda. Přesčas je vypnutý. Model předpokládá, že příslušné příplatky již nejsou platně zahrnuté v odměně podle § 138.'
        : 'U mzdy je výchozí model 10 % pro noc a víkend; tyto dvě sazby mohou být sjednány jinak. Přesčasový peněžní příplatek má v modelu minimum 25 % a svátek v penězích 100 %.');
  }
  function ensureRateFloors() {
    const floor = (id, min) => { const el=$(id); const val=n(id); if(el && val < min) el.value=String(min); };
    if(regime==='salary'){rateDefaults(true);}
    else if(regime==='wage'){ floor('holidayPercent',100); floor('overtimePercent',25); }
    else { floor('holidayPercent',100); $('overtimePercent').value='0'; }
  }
  function effectiveRates() {
    ensureRateFloors();
    let night=Math.max(0,n('nightPercent')),weekend=Math.max(0,n('weekendPercent')),
      holiday=Math.max(0,n('holidayPercent')),overtime=Math.max(0,n('overtimePercent'));
    if(regime==='salary'){
      night=Math.max(20,night); weekend=Math.max(25,weekend); holiday=Math.max(100,holiday);
      overtime=Math.max($('salaryRestDay').checked?50:25,overtime);
    } else if(regime==='wage') {
      holiday=Math.max(100,holiday); overtime=Math.max(25,overtime);
    } else {
      holiday=Math.max(100,holiday); overtime=0;
    }
    return {night,weekend,holiday,overtime};
  }

  function validateHours(h,overtime) {
    const errors=[];
    if(h.error) errors.push(h.error);
    ['night','weekend','holiday'].forEach(key=>{ if(h[key] > h.worked + 1e-6) errors.push(`${key==='night'?'Noční':key==='weekend'?'Víkendové':'Sváteční'} hodiny nemohou být vyšší než odpracovaná doba.`); });
    if(overtime > h.worked + 1e-6) errors.push('Přesčasové hodiny nemohou být vyšší než odpracovaná doba této směny.');
    const inputs=['hourlyRate','averageEarnings','repeatCount','customFixedRate','customHours','nightPercent','weekendPercent','holidayPercent','overtimePercent'];
    inputs.push(...(inputMode==='shift'?['breakMinutes']:['manualWorked','manualNight','manualWeekend','manualHoliday']));
    if(regime!=='agreement')inputs.push('overtimeHours');
    if(inputs.some(id=>{
      const field=$(id),value=field.valueAsNumber;
      return !Number.isFinite(value)||field.validity.rangeUnderflow||field.validity.rangeOverflow;
    })||n('averageEarnings')<=0||!Number.isInteger(n('repeatCount'))){
      errors.push('Doplňte platné hodnoty. PHV musí být vyšší než nula a počet směn celé číslo.');
    }
    if(n('customHours')>h.worked)errors.push('Hodiny dalšího příplatku nesmí překročit odpracovanou dobu.');
    if(overtime>0&&inputMode==='shift'&&$('overtimeStart').value&&Math.abs(overtime*60-Math.round(overtime*60))>1e-6)errors.push('Pro umístění na ose zadejte přesčas odpovídající celým minutám.');
    return errors;
  }

  function calculate() {
    const h=currentHours();
    $('resultTimeline').hidden=inputMode!=='shift';
    $('overtimeStartWrap').hidden=inputMode!=='shift'||regime==='agreement';
    const hourly=n('hourlyRate');
    const phv=n('averageEarnings');
    const overtime=regime==='agreement'?0:n('overtimeHours');
    const errors=validateHours(h,overtime);
    const errorBox=$('formError');
    if(errors.length){ errorBox.hidden=false; errorBox.textContent=errors.join(' '); }
    else errorBox.hidden=true;
    $('resultDetails').hidden=Boolean(errors.length);
    $('resultNote').hidden=Boolean(errors.length);
    ['copyResult','copyLink','printResult'].forEach(id=>$(id).disabled=Boolean(errors.length));
    if(errors.length){
      lastCalc=null;
      ['cashBonus','basePay','totalPay','timeOff','repeatBonus'].forEach(id=>setText(id,'—'));
      setText('resultSummary','Opravte zadání ve formuláři.');
      renderAudit();
      return null;
    }
    if(inputMode==='shift')renderTimeline(lastShift);

    const r=effectiveRates();
    const baseHours=h.worked-((regime==='salary'&&$('overtimeCompensation').value==='leave')||(regime==='wage'&&$('wageOvertimeIncluded').checked)?overtime:0);
    const base=hourly*baseHours;
    const night=phv*h.night*r.night/100;
    const weekend=phv*h.weekend*r.weekend/100;
    const holidayCash=$('holidayCompensation').value==='pay' ? phv*h.holiday*r.holiday/100 : 0;
    const overtimeIncluded=regime==='wage' && $('wageOvertimeIncluded').checked;
    const overtimeCash=regime!=='agreement' && $('overtimeCompensation').value==='pay' && !overtimeIncluded ? phv*overtime*r.overtime/100 : 0;
    const custom=Math.max(0,n('customFixedRate'))*Math.max(0,n('customHours'));
    const bonus=night+weekend+holidayCash+overtimeCash+custom;
    const defaults=LEGAL[regime];
    const defaultOvertime=regime==='salary'&&$('salaryRestDay').checked?50:defaults.overtime;
    const standard=phv*(h.night*defaults.night+h.weekend*defaults.weekend+
      (holidayCash>0?h.holiday*defaults.holiday:0)+(overtimeCash>0?overtime*defaultOvertime:0))/100;
    const holidayLeave=$('holidayCompensation').value==='leave'?h.holiday:0;
    const overtimeLeave=regime!=='agreement' && $('overtimeCompensation').value==='leave' && !overtimeIncluded ? overtime:0;
    const leave=holidayLeave+overtimeLeave;
    const total=base+bonus;
    const repeat=Math.max(1,Math.round(n('repeatCount',1)));
    const result={h,hourly,phv,overtime,r,base,night,weekend,holidayCash,overtimeCash,custom,bonus,standard,holidayLeave,overtimeLeave,leave,total,repeat,overtimeIncluded,errors};
    lastCalc=result;
    renderResult(result);
    renderOverlap(result);
    renderAudit();
    renderBenchmark(result);

    return result;
  }

  function row(label,value,note,zero=false){
    const el=doc.createElement('div'); el.className=`sf-breakdown-row${zero?' is-zero':''}`;
    const left=doc.createElement('div'),strong=doc.createElement('strong'),small=doc.createElement('small'),b=doc.createElement('b');
    strong.textContent=label; small.textContent=note; b.textContent=money(value); left.append(strong,small); el.append(left,b); return el;
  }
  function renderResult(x) {
    setText('resultRegime',LABEL[regime]);
    setText('cashBonus',money(x.bonus)); setText('basePay',money(x.base)); setText('totalPay',money(x.total)); setText('timeOff',hrs(x.leave)); setText('repeatBonus',money(x.bonus*x.repeat));
    const active=[]; if(x.h.night)active.push('noční');if(x.h.weekend)active.push('víkend');if(x.h.holiday)active.push('svátek');if(x.overtime)active.push('přesčas');if(x.custom)active.push('další bonus');
    setText('resultSummary',active.length?active.join(' + '):'bez peněžního příplatku');
    setText('rateBasis',regime==='salary'?'Zákonné sazby platu':'Výchozí zákonné sazby');
    setText('standardBonus',money(x.standard));
    setText('leaveBreakdown','Svátek: '+hrs(x.holidayLeave)+' · přesčas: '+hrs(x.overtimeLeave));
    const strip=$('payStrip');
    const parts=[['base',x.base],['night',x.night],['weekend',x.weekend],['holiday',x.holidayCash],['overtime',x.overtimeCash],['custom',x.custom]];
    strip.replaceChildren(...parts.filter(([,amount])=>amount>0).map(([kind,amount])=>{
      const segment=doc.createElement('i');segment.className=kind;segment.style.flexGrow=amount;return segment;
    }));
    strip.hidden=x.total===0;
    const list=$('breakdownList'); list.replaceChildren(
      row('Modelový základ',x.base,'Podle zadané základní sazby',x.base===0),
      row('Noční práce',x.night,`${hrs(x.h.night)} × ${pct(x.r.night)} z PHV`,x.h.night===0),
      row('Sobota / neděle',x.weekend,`${hrs(x.h.weekend)} × ${pct(x.r.weekend)} z PHV`,x.h.weekend===0),
      row('Svátek',x.holidayCash,x.h.holiday===0?'bez svátečních hodin':$('holidayCompensation').value==='leave'?`${hrs(x.h.holiday)} → náhradní volno`:`${hrs(x.h.holiday)} × ${pct(x.r.holiday)} z PHV`,x.h.holiday===0),
      row('Přesčas',x.overtimeCash,x.overtime===0?'bez přesčasových hodin':regime==='agreement'?'DPP/DPČ: bez zákonného přesčasu':x.overtimeIncluded?'mzda sjednána s přihlédnutím k přesčasům':$('overtimeCompensation').value==='leave'?`${hrs(x.overtime)} → náhradní volno`:`${hrs(x.overtime)} × ${pct(x.r.overtime)} z PHV`,x.overtime===0),
      row('Další pevný bonus',x.custom,`${hrs(n('customHours'))} × ${money(n('customFixedRate'))}/h`,x.custom===0)
    );
    [...list.children].forEach((item,index)=>item.dataset.kind=parts[index][0]);
    const note=$('resultNote');
    const leaveNotes=[];
    if(x.holidayLeave)leaveNotes.push(regime==='salary'?'Za sváteční náhradní volno se plat nekrátí.':'Za sváteční náhradní volno náleží náhrada ve výši průměrného výdělku. Tuto budoucí náhradu do součtu za směnu nepřidáváme.');
    if(x.overtimeLeave)leaveNotes.push(regime==='salary'?'Při dohodnutém volnu se přesčasový plat ani příplatek nepřičítá. Při čerpání volna se plat nekrátí.':'Za přesčas zůstává dosažená mzda. Náhradní volno nahrazuje přesčasový příplatek.');
    setText('leaveNote',leaveNotes.join(' '));
    $('leaveNote').hidden=!leaveNotes.length;
    if(regime==='salary') note.querySelector('p').textContent='U platu je hlavní spolehlivý výstup výše příplatků podle PHV. „Základ za hodiny“ je pouze model z vámi zadaného hodinového ekvivalentu; z jedné směny nelze rekonstruovat celý měsíční plat. Zahrnutí přesčasů podle § 127 odst. 3 u příplatku za vedení nebo nejvyššího vedení model neřeší.';
    else if(regime==='agreement') note.querySelector('p').textContent='DPP/DPČ: kalkulačka počítá noc, víkend a svátek obdobně jako u mzdy. Pokud jsou některé příplatky platně zahrnuté v odměně podle § 138, peněžní výsledek upravte podle dohody.';
    else note.querySelector('p').textContent=x.overtimeIncluded?'U přesčasu jste označili mzdu sjednanou s přihlédnutím k určitému rozsahu práce přesčas, proto model k těmto hodinám nepřidává další přesčasový příplatek. Ověřte sjednaný rozsah.':'Peněžní příplatky jsou model podle zadaného PHV, hodin a sazeb. Kalkulačka sama nerozhoduje, zda zaměstnavatel přesčas nebo jinou hodinu právně správně klasifikoval.';
  }

  function renderOverlap(x) {
    const chips=$('overlapChips'); chips.replaceChildren();
    if(inputMode==='manual') { setText('overlapText','Ruční režim zná součty hodin, ale ne jejich časové překryvy.'); return; }
    const s=lastShift; if(!s || s.error){setText('overlapText','Čekám na platný čas směny.');return;}
    const vals=[['noční + víkend',s.overlaps.nw],['noční + svátek',s.overlaps.nh],['víkend + svátek',s.overlaps.wh],['noční + víkend + svátek',s.overlaps.nwh]];
    vals.filter(([,v])=>v>0).forEach(([label,v])=>{const el=doc.createElement('span');el.textContent=`${label}: ${hrs(v)}`;chips.appendChild(el);});
    setText('overlapText',chips.children.length?'Stejná minuta může nést více samostatných příplatků. Přesčas se přidává zvlášť podle vašeho zadání.':'V této směně jsme nenašli překryv nočního, víkendu a svátku.');
  }

  const categories = [
    ['night','Noční'], ['weekend','Víkend'], ['holidayCash','Svátek'],
    ['overtimeCash','Přesčas'], ['custom','Ostatní']
  ];
  const hourKeys = ['worked','night','weekend','holiday','overtime','leave','holidayLeave','overtimeLeave'];
  const shiftFields = [
    'shiftDate','shiftStart','shiftEnd','breakStart','breakMinutes','hourlyRate','averageEarnings',
    'manualWorked','manualNight','manualWeekend','manualHoliday','overtimeHours','overtimeStart',
    'overtimeCompensation','holidayCompensation','repeatCount','nightPercent','weekendPercent',
    'holidayPercent','overtimePercent','customFixedRate','customHours'
  ];
  const shiftChecks = ['salaryRestDay','wageOvertimeIncluded'];
  const entryLimit = 62;
  const entries = [];
  const payslips = new Map();
  const monthFormat = new Intl.DateTimeFormat('cs-CZ',{month:'long',year:'numeric',timeZone:'UTC'});
  let entryId = 0;
  let editingId = null;
  let selectedMonth = '';
  let auditKey = '';

  function snapshot() {
    return {
      regime, inputMode,
      values:Object.fromEntries(shiftFields.map(id=>[id,$(id).value])),
      checks:Object.fromEntries(shiftChecks.map(id=>[id,$(id).checked]))
    };
  }

  function restoreShift(saved) {
    regime=saved.regime;
    Object.entries(saved.values).forEach(([id,value])=>{$(id).value=value;});
    Object.entries(saved.checks).forEach(([id,checked])=>{$(id).checked=checked;});
    $('shiftDateNative').value=isoDate($('shiftDate').value)||'';
    ratesDirty=true;
    updateRegimeUi();
    return setInputMode(saved.inputMode);
  }

  function makeEntry(result, date, id, sample=false) {
    const {h}=result;
    const saved=snapshot();
    saved.values.shiftDate=czechDate(date);
    return {
      id, date, sample, saved,
      start:h.start?.getTime(), end:h.end?.getTime(),
      hours:Object.fromEntries(hourKeys.map(key=>[key,h[key]??result[key]])),
      amounts:Object.fromEntries(categories.map(([key])=>[key,result[key]])),
      base:result.base, bonus:result.bonus
    };
  }

  function monthEntries() {
    return entries.filter(entry=>entry.date.startsWith(selectedMonth))
      .sort((a,b)=>a.date.localeCompare(b.date)||(a.start??0)-(b.start??0)||a.id-b.id);
  }

  function monthName(month) {
    return monthFormat.format(new Date(month+'-01T00:00Z'));
  }

  function monthTotals(rows) {
    const hours=Object.fromEntries(hourKeys.map(key=>[key,0]));
    const amounts=Object.fromEntries(categories.map(([key])=>[key,0]));
    let base=0,bonus=0;
    for(const row of rows){
      base+=row.base; bonus+=row.bonus;
      for(const key of hourKeys)hours[key]+=row.hours[key];
      for(const [key] of categories)amounts[key]+=row.amounts[key];
    }
    return {hours,amounts,base,bonus};
  }

  function monthRow(entry) {
    const row=doc.createElement('li');
    const identity=doc.createElement('div');
    const date=doc.createElement('strong');
    const subtitle=doc.createElement('small');
    date.textContent=czechDate(entry.date);
    const {values,inputMode,regime}=entry.saved;
    subtitle.textContent=(inputMode==='shift'?normalizedClock(values.shiftStart)+' → '+normalizedClock(values.shiftEnd):'Hodiny z docházky')+' · '+LABEL[regime];
    identity.append(date,subtitle);
    const amount=doc.createElement('div');
    const amountValue=doc.createElement('strong');
    amountValue.textContent=money(entry.bonus);
    const amountLabel=doc.createElement('small');
    amountLabel.textContent=hrs(entry.hours.worked)+' práce · '+hrs(entry.hours.leave)+' volna';
    amount.append(amountValue,amountLabel);
    const actions=doc.createElement('div');
    actions.className='sf-month-actions';
    for(const [action,label] of [['edit','Upravit'],['duplicate','Duplikovat'],['remove','Odebrat']]){
      if(entry.sample)break;
      const button=doc.createElement('button');
      button.type='button';
      button.dataset.monthAction=action;
      button.dataset.entry=entry.id;
      button.textContent=label;
      button.setAttribute('aria-label',label+' směnu '+date.textContent+', '+subtitle.textContent);
      actions.append(button);
    }
    row.append(identity,amount,actions);
    return row;
  }

  function renderMonth() {
    const months=[...new Set(entries.map(entry=>entry.date.slice(0,7)))].sort().reverse();
    if(!months.includes(selectedMonth))selectedMonth=months[0]||'';
    const rows=monthEntries();
    const total=monthTotals(rows);
    $('monthEmpty').hidden=Boolean(rows.length);
    $('monthDashboard').hidden=!rows.length;
    $('monthSelect').replaceChildren(...months.map(month=>new Option(monthName(month),month,false,month===selectedMonth)));
    $('monthRows').replaceChildren(...rows.map(monthRow));
    setText('monthBonus',money(total.bonus));
    setText('monthBase',money(total.base));
    setText('monthTotal',money(total.base+total.bonus));
    for(const key of hourKeys.slice(0,6)){
      setText('month'+key[0].toUpperCase()+key.slice(1),hrs(total.hours[key]));
    }
    setText('monthLeaveSplit','Volno ze svátků '+hrs(total.hours.holidayLeave)+' · z přesčasů '+hrs(total.hours.overtimeLeave));
    $('exportMonth').disabled=!entries.some(entry=>!entry.sample);
    const sample=entries.some(entry=>entry.sample);
    $('monthSample').textContent=sample?'Odebrat ukázkové směny':'Vyzkoušet tři různé směny';
    $('monthSample').disabled=!sample&&entries.some(entry=>entry.date.startsWith('2026-12'));
    $('auditScope').options[1].disabled=!months.length;
    if(!months.length)$('auditScope').value='shift';
    renderAudit();
  }

  function setEditing(entry) {
    editingId=entry?.id??null;
    $('cancelShiftEdit').hidden=editingId===null;
    const label=editingId===null?'Přidat do měsíce':'Uložit upravenou směnu';
    setText('saveShift',label);
    setText('saveResultShift',label);
  }

  function focusMonth() {
    $('monthHeading').scrollIntoView({block:'start'});
    $('monthHeading').focus({preventScroll:true});
  }

  function saveShift() {
    const result=calculate();
    const date=isoDate($('shiftDate').value);
    const reject=message=>{
      setText('shiftSaveStatus',message);
      if(message&&doc.activeElement===$('saveResultShift'))$('shiftSaveStatus').scrollIntoView({block:'center'});
    };
    if(!result||!date){reject('Před uložením opravte směnu a doplňte platné datum.');return;}
    const month=date.slice(0,7);
    if(entries.length>=entryLimit&&editingId===null){reject('Přehled pojme 62 směn. Odeberte některou položku.');return;}
    if(entries.some(entry=>entry.sample&&entry.date.startsWith(month))){reject('Pro tento měsíc nejprve odeberte ukázkové směny.');return;}
    const entry=makeEntry(result,date,editingId??entryId+1);
    if(entry.end&&pragueClock.format(entry.end-1).slice(0,7)!==month){
      reject('Směna zasahuje do dalšího měsíce. Rozdělte ji podle docházky a uložte obě části zvlášť.');return;
    }
    if(entries.some(other=>other.id!==editingId&&entriesConflict(entry,other))){reject('Tato směna se překrývá s již uloženým záznamem nebo je s ním totožná.');return;}
    if(editingId===null){entryId++;entries.push(entry);}
    else entries[entries.findIndex(other=>other.id===editingId)]=entry;
    selectedMonth=month;
    $('auditScope').value='month';
    setEditing(null);
    reject('');
    setText('monthStatus','Směna '+czechDate(date)+' je v měsíčním přehledu.');
    renderMonth();
    focusMonth();
  }

  function entriesConflict(entry,other) {
    if(entry.start!==undefined&&other.start!==undefined)return entry.start<other.end&&entry.end>other.start;
    return JSON.stringify(entry.saved)===JSON.stringify(other.saved);
  }

  function downloadFile(name,type,content) {
    const url=URL.createObjectURL(new Blob([content],{type}));
    const link=doc.createElement('a');
    link.href=url;
    link.download=name;
    doc.body.append(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }

  function exportMonth() {
    const shifts=entries.filter(entry=>!entry.sample).map(entry=>entry.saved);
    downloadFile('rychlevypocty-evidence-smen.json','application/json',JSON.stringify({
      format:'rychlevypocty-shifts',version:1,month:selectedMonth,shifts
    },null,2));
    setText('monthStatus','Záloha obsahuje '+shifts.length+' směn. Uložte ji na bezpečné místo.');
  }

  function readSavedShift(saved) {
    const {regime:kind,inputMode:mode,values,checks}=saved??{};
    if(!Object.hasOwn(LABEL,kind)||!['shift','manual'].includes(mode)||!values||!checks||
      !shiftFields.every(id=>typeof values[id]==='string'&&values[id].length<=48)||
      !shiftChecks.every(id=>typeof checks[id]==='boolean')||
      !['holidayCompensation','overtimeCompensation'].every(id=>['pay','leave'].includes(values[id]))) {
      throw new Error('Soubor obsahuje neplatné zadání směny.');
    }
    return {regime:kind,inputMode:mode,
      values:Object.fromEntries(shiftFields.map(id=>[id,values[id]])),
      checks:Object.fromEntries(shiftChecks.map(id=>[id,checks[id]]))};
  }

  async function importMonth(event) {
    const input=event.target;
    const [file]=input.files;
    input.value='';
    if(!file)return;
    let backup;
    try {
      if(file.size>256*1024)throw new Error();
      backup=JSON.parse(await file.text());
    }catch{
      setText('monthStatus','Soubor se nepodařilo přečíst. Vyberte JSON zálohu směn do 256 kB.');
      return;
    }
    if(backup?.format!=='rychlevypocty-shifts'||backup.version!==1||
      !Array.isArray(backup.shifts)||!backup.shifts.length||backup.shifts.length>entryLimit){
      setText('monthStatus','Tento formát zálohy kalkulačka nezná nebo soubor neobsahuje platný počet směn.');
      return;
    }
    const previous=snapshot();
    const previousRatesDirty=ratesDirty;
    const staged=[];
    const existing=entries.filter(entry=>!entry.sample);
    let skipped=0;
    try {
      for(const data of backup.shifts){
        const saved=readSavedShift(data);
        const date=isoDate(saved.values.shiftDate);
        const result=date&&restoreShift(saved);
        if(!result||!shiftFields.every(id=>$(id).value===saved.values[id])||
          ![result.base,result.bonus].every(Number.isFinite)){
          throw new Error('Soubor obsahuje neplatnou směnu.');
        }
        const entry=makeEntry(result,date,entryId+staged.length+1);
        const month=date.slice(0,7);
        if(entry.end&&pragueClock.format(entry.end-1).slice(0,7)!==month){
          throw new Error('Soubor obsahuje směnu zasahující do dalšího měsíce.');
        }
        const candidates=existing.concat(staged);
        if(candidates.some(other=>JSON.stringify(other.saved)===JSON.stringify(entry.saved))){skipped++;continue;}
        if(candidates.some(other=>entriesConflict(entry,other))){
          throw new Error('Směna '+czechDate(date)+' se překrývá s jiným záznamem.');
        }
        if(candidates.length>=entryLimit)throw new Error('Po načtení by přehled překročil limit 62 směn.');
        staged.push(entry);
      }
    }catch(error){
      setText('monthStatus',error.message+' Přehled zůstal beze změny.');
      return;
    }finally{
      restoreShift(previous);
      ratesDirty=previousRatesDirty;
    }
    if(entries.some(entry=>entry.sample))payslips.delete('2026-12');
    entries.splice(0,entries.length,...existing,...staged);
    entryId+=staged.length;
    selectedMonth=typeof backup.month==='string'?backup.month:'';
    $('auditScope').value='month';
    $('auditView').value='categories';
    renderMonth();
    focusMonth();
    setText('monthStatus','Přidáno '+staged.length+' směn · přeskočeno '+skipped+' totožných záznamů.');
  }

  function loadMonthSample() {
    if(entries.some(entry=>entry.sample)){
      for(let i=entries.length-1;i>=0;i--)if(entries[i].sample)entries.splice(i,1);
      payslips.delete('2026-12');
      setText('monthStatus','Ukázkové směny byly odebrány.');
      renderMonth();
      return;
    }
    if(entries.length>entryLimit-3){setText('monthStatus','Pro ukázku potřebujete místo pro tři směny.');return;}
    const previous=snapshot();
    const sample=[
      ['2026-12-05','06:00','14:00','10:00','0',''],
      ['2026-12-11','22:00','06:00','02:00','0',''],
      ['2026-12-25','08:00','16:00','12:00','2','14:00']
    ];
    for(const [date,shiftStart,shiftEnd,breakStart,overtimeHours,overtimeStart] of sample){
      const result=restoreShift({regime:'wage',inputMode:'shift',checks:{salaryRestDay:false,wageOvertimeIncluded:false},
        values:{...previous.values,shiftDate:czechDate(date),shiftStart,shiftEnd,breakStart,breakMinutes:'30',
          hourlyRate:'200',averageEarnings:'200',overtimeHours,overtimeStart,repeatCount:'1',
          overtimeCompensation:'pay',holidayCompensation:'pay',nightPercent:'10',weekendPercent:'10',
          holidayPercent:'100',overtimePercent:'25',customFixedRate:'0',customHours:'0'}});
      entries.push(makeEntry(result,date,++entryId,true));
    }
    restoreShift(previous);
    selectedMonth='2026-12';
    $('auditScope').value='month';
    $('auditView').value='categories';
    setText('monthStatus','Zobrazují se tři ukázkové směny. Před zadáním vlastního prosince ukázku odeberte.');
    renderMonth();
    focusMonth();
  }

  function initMonth() {
    $('timelineCursor').addEventListener('input',()=>{if(displayedShift)inspectMinute(displayedShift);});
    $('saveShift').addEventListener('click',saveShift);
    $('saveResultShift').addEventListener('click',saveShift);
    $('cancelShiftEdit').addEventListener('click',()=>{setEditing(null);setText('shiftSaveStatus','Úprava zrušena. Uložená směna zůstala beze změny.');});
    $('exportMonth').addEventListener('click',exportMonth);
    $('importMonth').addEventListener('click',()=>$('monthBackupFile').click());
    $('monthBackupFile').addEventListener('change',importMonth);
    $('exportAudit').addEventListener('click',exportAudit);
    $('monthSample').addEventListener('click',loadMonthSample);
    $('monthSelect').addEventListener('change',event=>{selectedMonth=event.target.value;renderMonth();});
    $('monthRows').addEventListener('click',event=>{
      const button=event.target.closest('[data-month-action]');
      if(!button)return;
      const index=entries.findIndex(entry=>entry.id===Number(button.dataset.entry));
      const entry=entries[index];
      if(!entry||entry.sample)return;
      if(button.dataset.monthAction==='remove'){
        entries.splice(index,1);
        if(editingId===entry.id)setEditing(null);
        setText('monthStatus','Směna '+czechDate(entry.date)+' byla odebrána.');
        renderMonth();
        focusMonth();
        return;
      }
      const edit=button.dataset.monthAction==='edit';
      setEditing(edit?entry:null);
      const saved={...entry.saved,values:{...entry.saved.values}};
      if(!edit)saved.values.shiftDate='';
      restoreShift(saved);
      setText('shiftSaveStatus',edit?'Upravujete uloženou směnu '+czechDate(entry.date)+'.':'Zkopírované zadání. Doplňte datum nové směny.');
      $('shiftDate').focus();
    });
    $('auditSingleJump').addEventListener('click',()=>{$('auditScope').value='shift';renderAudit();});
    $('auditMonthJump').addEventListener('click',()=>{$('auditScope').value='month';renderAudit();});
    ['auditScope','auditView'].forEach(id=>$(id).addEventListener('change',renderAudit));
    $('auditCategoryRows').replaceChildren(...categories.map(([key,label])=>{
      const row=doc.createElement('div');
      row.className='sf-audit-row';
      row.innerHTML='<strong>'+label+'</strong><div><span>Model</span><b id="expected-'+key+'">—</b></div>'+
        '<label>Na pásce (Kč)<input aria-label="'+label+' na pásce v Kč" id="paid-'+key+'" type="number" min="0" max="1000000" step="0.01" inputmode="decimal"></label>'+
        '<div><span>Rozdíl</span><b id="difference-'+key+'">—</b></div>';
      row.querySelector('input').addEventListener('input',renderAudit);
      return row;
    }));
    renderMonth();
  }

  function paidValue(field) {
    return Number.isFinite(field.valueAsNumber)&&!field.validity.rangeUnderflow&&!field.validity.rangeOverflow&&!field.validity.stepMismatch
      ?field.valueAsNumber:null;
  }

  function difference(paid,expected) {
    return Math.round((paid-expected)*100)/100;
  }

  function signedMoney(value) {
    return (value>0?'+':value<0?'−':'')+money(Math.abs(value));
  }

  function auditContext() {
    const monthly=$('auditScope').value==='month';
    const rows=monthly?monthEntries():[];
    const count=$('auditCount').valueAsNumber;
    const validCount=Number.isInteger(count)&&count>=1&&count<=31;
    if(monthly&&rows.length)return monthTotals(rows);
    if(monthly||!lastCalc||!validCount)return null;
    return {
      bonus:lastCalc.bonus*count,
      amounts:Object.fromEntries(categories.map(([key])=>[key,lastCalc[key]*count]))
    };
  }

  function exportAudit() {
    const rows=[['Rozsah',$('auditScopeNote').textContent],
      ['Položka','Model (Kč)','Páska (Kč)','Rozdíl (Kč)']];
    const context=auditContext();
    if(!context)return;
    const decimal=value=>value===null?'':String(difference(value,0)).replace('.',',');
    const detailed=$('auditView').value==='categories';
    const declared=paidValue($('paidBonus'));
    if(detailed){
      for(const [key,label] of categories){
        const expected=context.amounts[key];
        const paid=paidValue($('paid-'+key));
        rows.push([label,decimal(expected),decimal(paid),decimal(paid===null?null:difference(paid,expected))]);
      }
    }
    const {paid,partial}=auditSum(detailed,declared);
    rows.push([partial?'Neúplný součet':'Celkem',decimal(context.bonus),decimal(paid),
      decimal(partial||paid===null?null:difference(paid,context.bonus))]);
    if(detailed&&declared!==null)rows.push(['Zadaná souhrnná částka','',decimal(declared),'']);
    rows.push(['Vyhodnocení',$('auditMessage').textContent]);
    const csv=rows.map(row=>row.map(cell=>'"'+cell.replace(/"/g,'""')+'"').join(';')).join('\r\n');
    downloadFile('rychlevypocty-kontrola-vyplatnice.csv','text/csv;charset=utf-8','\uFEFF'+csv);
  }

  function auditSum(detailed,declared) {
    if(!detailed)return {paid:declared,partial:false,count:0};
    const values=categories.map(([key])=>paidValue($('paid-'+key))).filter(value=>value!==null);
    return {paid:values.length?values.reduce((sum,value)=>sum+value,0):null,
      partial:values.length<categories.length,count:values.length};
  }

  function renderAudit() {
    const monthly=$('auditScope').value==='month';
    const detailed=$('auditView').value==='categories';
    const key=monthly?selectedMonth:'shift';
    const fields=['paidBonus',...categories.map(([name])=>'paid-'+name)];
    if(auditKey!==key){
      const previous=payslips.get(key);
      fields.forEach(id=>{$(id).value=previous?.[id]??'';});
      auditKey=key;
    }else{
      payslips.set(key,Object.fromEntries(fields.map(id=>[id,$(id).value])));
    }
    $('auditCountField').hidden=monthly;
    $('auditTotalOptional').hidden=!detailed;
    $('auditCategories').hidden=!detailed;
    setText('auditScopeNote',monthly?'Porovnáváte uložené směny za '+monthName(selectedMonth)+'.':'Porovnáváte příplatky z aktuální směny, případně její totožná opakování.');
    const context=auditContext();
    const expected=context?.bonus??null;
    const declaredField=$('paidBonus');
    const declared=paidValue(declaredField);
    const invalid=field=>Boolean(field.value||field.validity.badInput)&&paidValue(field)===null;
    const {paid,partial,count}=auditSum(detailed,declared);
    const diff=expected===null||paid===null||partial?null:difference(paid,expected);
    const box=$('auditResult');
    box.classList.remove('is-good','is-warn');
    $('exportAudit').disabled=expected===null||paid===null;
    declaredField.setAttribute('aria-invalid',String(invalid(declaredField)));
    setText('auditPaidLabel',!detailed?'Vyplaceno na pásce':partial?'Součet vyplněných položek – neúplný':'Součet položek z pásky');
    setText('auditExpected',expected===null?'—':money(expected));
    setText('auditPaid',paid===null?'—':money(paid));
    setText('auditDifference',diff===null?'—':signedMoney(diff));
    let message=monthly?'Přidejte směny do vybraného měsíce.':lastCalc?'Zadejte počet stejných směn od 1 do 31.':'Nejprve opravte zadání směny.';
    if(expected!==null){
      if(detailed&&partial){
        message='Vyplněno '+count+' z '+categories.length+' položek. Celkový rozdíl se ukáže po doplnění všech položek.';
      }else if(diff===null){
        message='Zadejte částku stejných příplatků z pásky.';
      }else{
        box.classList.add(diff<0?'is-warn':'is-good');
        message=diff<0?'Na pásce je proti modelu méně. Ověřte stejné hodiny, PHV a zvolenou kompenzaci.':diff>0?'Na pásce je proti modelu více. Zkontrolujte firemní sazby a další příplatky.':'Zadané příplatky odpovídají modelu.';
      }
      if(detailed&&declared!==null&&paid!==null){
        const mismatch=difference(declared,paid);
        if(!partial&&mismatch!==0){
          box.classList.remove('is-good');
          box.classList.add('is-warn');
          message+=' Zadaná souhrnná částka se od součtu položek liší o '+signedMoney(mismatch)+'. Rozdíl proti modelu vychází ze součtu položek.';
        }else if(partial&&mismatch<0){
          message+=' Už vyplněné položky převyšují zadanou souhrnnou částku.';
        }
      }
      if(invalid(declaredField))message+=' Souhrnná částka musí být od 0 do 1 000 000 Kč a mít nejvýše dvě desetinná místa.';
    }
    setText('auditMessage',message);

    let largest=null;
    for(const [category,label] of categories){
      const value=context?.amounts[category]??null;
      const field=$('paid-'+category);
      const entered=paidValue(field);
      const categoryDiff=value===null||entered===null?null:difference(entered,value);
      setText('expected-'+category,value===null?'—':money(value));
      setText('difference-'+category,categoryDiff===null?'—':signedMoney(categoryDiff));
      $('difference-'+category).dataset.sign=categoryDiff===null?'':categoryDiff<0?'less':categoryDiff>0?'more':'equal';
      field.setAttribute('aria-invalid',String(invalid(field)));
      if(categoryDiff!==null&&(!largest||Math.abs(categoryDiff)>Math.abs(largest.diff)))largest={label,diff:categoryDiff};
    }
    setText('auditLargest',!context?'Nejdřív potřebujete platný výpočet.':!largest?'Zadejte alespoň jednu položku z pásky.':largest.diff===0?'Zadané položky odpovídají modelu.':'Největší odchylka: '+largest.label+' '+signedMoney(largest.diff)+' proti modelu. Ověřte hodiny, sazby, PHV a období zúčtování.');
  }

  function renderBenchmark(x) {
    setText('benchmarkPhv',`${moneyFmt.format(x.phv)} Kč/h`);
    setText('nightLegalKc',`${moneyFmt.format(x.phv*.10)} Kč/h`);
    setText('weekendLegalKc',`${moneyFmt.format(x.phv*.10)} Kč/h`);
    setText('overtimeLegalKc',`${moneyFmt.format(x.phv*.25)} Kč/h`);
    setText('holidayLegalKc',`${moneyFmt.format(x.phv)} Kč/h`);
  }
  function setPreset(name) {
    const today=pragueClock.format(new Date()).slice(0,10);
    if(name==='fridayNight'){
      $('shiftDate').value=czechDate(nextWeekday(today,5)); $('shiftStart').value='22:00'; $('shiftEnd').value='06:00'; $('breakStart').value='02:00'; $('breakMinutes').value=30;
    } else if(name==='saturdayDay') {
      $('shiftDate').value=czechDate(nextWeekday(today,6)); $('shiftStart').value='06:00'; $('shiftEnd').value='14:00'; $('breakStart').value='10:00'; $('breakMinutes').value=30;
    } else if(name==='christmas') {
      const y=today.slice(0,4); $('shiftDate').value=czechDate(`${y}-12-24`); $('shiftStart').value='08:00'; $('shiftEnd').value='16:00'; $('breakStart').value='12:00'; $('breakMinutes').value=30;
    }
    $('shiftDateNative').value=isoDate($('shiftDate').value)||'';
    calculate();
  }

  function shareParams() {
    const p=new URLSearchParams();
    p.set('rezim',regime);p.set('mode',inputMode);p.set('sazba',n('hourlyRate'));p.set('phv',n('averageEarnings'));
    if(inputMode==='shift'){p.set('shiftDate',isoDate($('shiftDate').value)||'');['shiftStart','shiftEnd','breakStart','breakMinutes'].forEach(id=>p.set(id,$(id).value));}
    else {['manualWorked','manualNight','manualWeekend','manualHoliday'].forEach(id=>p.set(id,$(id).value));}
    p.set('prescas',n('overtimeHours'));if(inputMode==='shift'&&$('overtimeStart').value)p.set('prescasOd',$('overtimeStart').value);
    ['nightPercent','weekendPercent','holidayPercent','overtimePercent','customFixedRate','customHours'].forEach(id=>p.set(id,$(id).value));p.set('prescasForma',$('overtimeCompensation').value);p.set('svatekForma',$('holidayCompensation').value);p.set('opakovat',n('repeatCount'));
    if($('salaryRestDay').checked)p.set('platKlid','1');if($('wageOvertimeIncluded').checked)p.set('mzdaPrescas','1');
    return p;
  }
  function loadUrl() {
    const p=new URLSearchParams(location.search);
    if(p.has('rezim')&&Object.hasOwn(LEGAL,p.get('rezim'))) regime=p.get('rezim');
    if(p.get('mode')==='manual') inputMode='manual';
    const map={sazba:'hourlyRate',phv:'averageEarnings',shiftDate:'shiftDate',shiftStart:'shiftStart',shiftEnd:'shiftEnd',breakStart:'breakStart',breakMinutes:'breakMinutes',manualWorked:'manualWorked',manualNight:'manualNight',manualWeekend:'manualWeekend',manualHoliday:'manualHoliday',prescas:'overtimeHours',opakovat:'repeatCount'};
    Object.entries(map).forEach(([key,id])=>{if(p.has(key))$(id).value=key==='shiftDate'?(czechDate(p.get(key))||p.get(key)):p.get(key);});
    $('shiftDateNative').value=isoDate($('shiftDate').value)||'';
    if(['pay','leave'].includes(p.get('prescasForma')))$('overtimeCompensation').value=p.get('prescasForma');
    if(['pay','leave'].includes(p.get('svatekForma')))$('holidayCompensation').value=p.get('svatekForma');
    if(p.has('prescasOd'))$('overtimeStart').value=p.get('prescasOd');
    $('auditCount').value=$('repeatCount').value;
    $('salaryRestDay').checked=p.get('platKlid')==='1'; $('wageOvertimeIncluded').checked=p.get('mzdaPrescas')==='1';
  }

  function setInputMode(mode) {
    inputMode=mode==='manual'?'manual':'shift';
    qsa('[data-input-mode]').forEach(b=>{const active=b.dataset.inputMode===inputMode;b.classList.toggle('is-active',active);b.setAttribute('aria-selected',String(active));});
    $('shiftModePanel').hidden=inputMode!=='shift'; $('manualModePanel').hidden=inputMode!=='manual'; return calculate();
  }

  function copy(text,button){
    const done=()=>{const old=button.textContent;button.textContent='Zkopírováno';setTimeout(()=>button.textContent=old,1300);};
    if(navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(()=>{});
  }
  function summaryText() {
    const x=lastCalc;if(!x)return'';
    return `Příplatky za směnu (${LABEL[regime]}): ${money(x.bonus)} navíc; odpracováno ${hrs(x.h.worked)}; noční ${hrs(x.h.night)}; víkend ${hrs(x.h.weekend)}; svátek ${hrs(x.h.holiday)}; přesčas ${hrs(x.overtime)}; náhradní volno ${hrs(x.leave)}. Celkem v penězích podle zadané základní hodinové hodnoty: ${money(x.total)}.`;
  }

  function wire() {
    defaultDate(); loadUrl(); updateRegimeUi(); rateDefaults(true);
    const params=new URLSearchParams(location.search);
    ['nightPercent','weekendPercent','holidayPercent','overtimePercent','customFixedRate','customHours'].forEach(id=>{
      if(params.has(id)&&!$(id).readOnly){$(id).value=params.get(id);ratesDirty=true;}
    });
    $('shiftForm').addEventListener('submit',event=>{
      event.preventDefault();
      const result=calculate();
      if(result){
        $('vysledek').scrollIntoView({block:'start'});
        $('vysledek').focus({preventScroll:true});
      }
      else {
        $('formError').scrollIntoView({block:'center'});
        $('formError').focus({preventScroll:true});
      }
    });
    qsa('[data-input-mode]').forEach(b=>b.addEventListener('click',()=>setInputMode(b.dataset.inputMode)));
    qsa('[data-regime]').forEach(b=>b.addEventListener('click',()=>{regime=b.dataset.regime;ratesDirty=false;updateRegimeUi();rateDefaults(true);calculate();}));
    qsa('[data-preset]').forEach(b=>b.addEventListener('click',()=>setPreset(b.dataset.preset)));
    $('shiftDateNative').addEventListener('change',()=>{$('shiftDate').value=czechDate($('shiftDateNative').value);calculate();});
    $('shiftDate').addEventListener('input',()=>{$('shiftDateNative').value=isoDate($('shiftDate').value)||'';});
    $('shiftDate').addEventListener('blur',()=>{const normalized=isoDate($('shiftDate').value);if(normalized)$('shiftDate').value=czechDate(normalized);});
    ['shiftStart','shiftEnd','breakStart'].forEach(id=>$(id).addEventListener('blur',()=>{const normalized=normalizedClock($(id).value);if(normalized){$(id).value=normalized;calculate();}}));
    ['hourlyRate','averageEarnings','shiftDate','shiftStart','shiftEnd','breakMinutes','breakStart','manualWorked','manualNight','manualWeekend','manualHoliday','overtimeHours','overtimeStart','repeatCount','customFixedRate','customHours'].forEach(id=>$(id)?.addEventListener('input',calculate));
    ['overtimeCompensation','holidayCompensation'].forEach(id=>$(id)?.addEventListener('change',calculate));
    ['salaryRestDay','wageOvertimeIncluded'].forEach(id=>$(id)?.addEventListener('change',()=>{if(id==='salaryRestDay'&&!ratesDirty)rateDefaults(true);calculate();}));
    ['nightPercent','weekendPercent','holidayPercent','overtimePercent'].forEach(id=>$(id)?.addEventListener('input',()=>{ratesDirty=true;calculate();}));
    $('syncAverage').addEventListener('click',()=>{$('averageEarnings').value=$('hourlyRate').value;calculate();});
    $('resetRates').addEventListener('click',()=>{ratesDirty=false;rateDefaults(true);calculate();});
    $('repeatCount').addEventListener('input',()=>{ $('auditCount').value=$('repeatCount').value;renderAudit(); });
    ['paidBonus','auditCount'].forEach(id=>$(id)?.addEventListener('input',renderAudit));
    $('copyResult').addEventListener('click',e=>copy(summaryText(),e.currentTarget));
    $('copyLink').addEventListener('click',event=>{
      const base=doc.querySelector('link[rel="canonical"]').href;
      const link=new URL('?'+shareParams()+'#kalkulacka',base);
      copy(link.href,event.currentTarget);
    });
    $('printResult').addEventListener('click',()=>window.print());
    const toggle=$('menuToggle'),nav=$('mainNavMobile');
    const setMenu=open=>{
      nav.classList.toggle('is-open',open);
      toggle.setAttribute('aria-expanded',String(open));
      toggle.setAttribute('aria-label',open?'Zavřít navigaci':'Otevřít navigaci');
    };
    toggle.addEventListener('click',()=>setMenu(toggle.getAttribute('aria-expanded')==='false'));
    nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>setMenu(false)));
    toggle.closest('header').addEventListener('keydown',event=>{
      if(event.key!=='Escape'||toggle.getAttribute('aria-expanded')!=='true')return;
      setMenu(false);
      toggle.focus();
    });
    window.matchMedia('(max-width:860px)').addEventListener('change',()=>setMenu(false));
    setInputMode(inputMode); updateRegimeUi(); calculate();
  }
  initMonth();
  wire();

  // RV V-next accessibility hardening: complete keyboard model for ARIA tabs.
  (function bindRvTabs(){
    const tablist=document.querySelector('.sf-mode-tabs');
    if(!tablist) return;
    const tabs=Array.from(tablist.querySelectorAll('[role="tab"]'));
    if(!tabs.length) return;
    const sync=()=>tabs.forEach(tab=>tab.setAttribute('tabindex',tab.getAttribute('aria-selected')==='true'?'0':'-1'));
    tabs.forEach(tab=>tab.addEventListener('click',sync));
    tablist.addEventListener('keydown',event=>{
      const index=tabs.indexOf(document.activeElement);
      if(index<0) return;
      let next=index;
      if(event.key==='ArrowRight'||event.key==='ArrowDown') next=(index+1)%tabs.length;
      else if(event.key==='ArrowLeft'||event.key==='ArrowUp') next=(index-1+tabs.length)%tabs.length;
      else if(event.key==='Home') next=0;
      else if(event.key==='End') next=tabs.length-1;
      else return;
      event.preventDefault();
      tabs[next].click();
      tabs[next].focus();
      sync();
    });
    sync();
  })();

  // RV V-next accessibility hardening: keyboard model for the custom pay-regime radio group.
  (function bindRegimeRadios(){
    const group=document.querySelector('.sf-regime-grid');
    if(!group) return;
    const radios=Array.from(group.querySelectorAll('[role="radio"]'));
    group.addEventListener('keydown',event=>{
      const index=radios.indexOf(document.activeElement);
      if(index<0) return;
      let next=index;
      if(event.key==='ArrowRight'||event.key==='ArrowDown') next=(index+1)%radios.length;
      else if(event.key==='ArrowLeft'||event.key==='ArrowUp') next=(index-1+radios.length)%radios.length;
      else if(event.key==='Home') next=0;
      else if(event.key==='End') next=radios.length-1;
      else return;
      event.preventDefault();
      radios[next].click();
      radios[next].focus();
    });
  })();
})();
