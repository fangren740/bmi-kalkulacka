(() => {
  'use strict';

  const doc = document;
  const $ = (id) => doc.getElementById(id);
  const qsa = (sel) => [...doc.querySelectorAll(sel)];
  const moneyFmt = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
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
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function money(v) { return `${moneyFmt.format(Number.isFinite(v) ? v : 0)} Kč`; }
  function hrs(v) { return `${decFmt.format(Number.isFinite(v) ? v : 0)} h`; }
  function pct(v) { return `${decFmt.format(v)} %`; }
  function setText(id, text) { const el = $(id); if (el) el.textContent = text; }

  function localDateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  }
  function nextWeekday(from, weekday) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const add = (weekday - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + add);
    return d;
  }
  function timeToMinutes(value) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(value || '');
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
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

  function defaultDate() {
    if (!$('shiftDate').value) $('shiftDate').value = localDateString(new Date());
  }

  function getShiftDates() {
    const dateValue = $('shiftDate').value;
    const startMin = timeToMinutes($('shiftStart').value);
    const endMin = timeToMinutes($('shiftEnd').value);
    if (!dateValue || startMin === null || endMin === null) return null;
    const [y,m,d] = dateValue.split('-').map(Number);
    const start = new Date(y,m-1,d,Math.floor(startMin/60),startMin%60,0,0);
    const end = new Date(y,m-1,d,Math.floor(endMin/60),endMin%60,0,0);
    if (end <= start) end.setDate(end.getDate()+1);
    if ((end-start) > 24*3600000) return null;
    return { start, end };
  }

  function analyzeShift() {
    const dates = getShiftDates();
    if (!dates) return { error:'Zkontrolujte datum a čas směny. Maximální délka jednoho zadaného úseku je 24 hodin.' };
    const { start, end } = dates;
    const breakMinutes = clamp(n('breakMinutes',0),0,240);
    const breakTime = timeToMinutes($('breakStart').value);
    if (breakMinutes > 0 && breakTime === null) return { error:'Při nenulové neplacené přestávce zadejte také její začátek.' };

    let breakStart = null, breakEnd = null;
    if (breakMinutes > 0) {
      breakStart = new Date(start.getFullYear(),start.getMonth(),start.getDate(),Math.floor(breakTime/60),breakTime%60,0,0);
      if (breakStart < start) breakStart.setDate(breakStart.getDate()+1);
      breakEnd = new Date(breakStart.getTime()+breakMinutes*60000);
      if (breakStart >= end || breakEnd <= start) return { error:'Zadaná přestávka neleží uvnitř směny.' };
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
      const isNight = t.getHours()>=22 || t.getHours()<6;
      const isWeekend = t.getDay()===0 || t.getDay()===6;
      const isHoliday = getHol(t.getFullYear()).has(dateKey(t));
      const active = !onBreak;
      minuteRows.push({active,night:isNight&&active,weekend:isWeekend&&active,holiday:isHoliday&&active});
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
  function renderTimeline(shift) {
    if(!shift || shift.error){ ['workTrack','nightTrack','weekendTrack','holidayTrack'].forEach(id=>$(id)?.replaceChildren()); return; }
    renderTrack('workTrack',shift.minuteRows,'active','work');
    renderTrack('nightTrack',shift.minuteRows,'night','night');
    renderTrack('weekendTrack',shift.minuteRows,'weekend','weekend');
    renderTrack('holidayTrack',shift.minuteRows,'holiday','holiday');
    const fmt=t=>`${String(t.getHours()).padStart(2,'0')}:${String(t.getMinutes()).padStart(2,'0')}`;
    setText('timelineStart',fmt(shift.start)); setText('timelineEnd',fmt(shift.end));
    setText('timelineRange',`${fmt(shift.start)} → ${fmt(shift.end)}`);
    setText('autoWorked',hrs(shift.worked)); setText('autoNight',hrs(shift.night)); setText('autoWeekend',hrs(shift.weekend)); setText('autoHoliday',hrs(shift.holiday));
  }

  function currentHours() {
    if(inputMode==='manual') {
      return {
        worked:clamp(n('manualWorked'),0,24),
        night:clamp(n('manualNight'),0,24),
        weekend:clamp(n('manualWeekend'),0,24),
        holiday:clamp(n('manualHoliday'),0,24),
      };
    }
    const s=analyzeShift(); lastShift=s;
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
    const disabled=regime==='agreement';
    overtime.disabled=disabled; overtimeComp.disabled=disabled;
    if(disabled){ overtime.value=0; setText('overtimeHint','U DPP/DPČ se práce přesčas v právním smyslu nekoná; zákonný přesčasový příplatek proto model nepřidává.'); }
    else setText('overtimeHint','Použijte pouze hodiny, které skutečně splňují podmínky práce přesčas.');
    setText('ratesIntro',regime==='salary'
      ? 'Pro plat používáme výchozí zákonné sazby 20 % noc, 25 % víkend a 25/50 % přesčas. Vyšší interní sazby můžete zadat ručně; zadané nižší hodnoty budou při výpočtu zvýšeny alespoň na zákonnou úroveň modelu.'
      : regime==='agreement'
        ? 'DPP/DPČ používá pro noc, víkend a svátek obdobná pravidla jako mzda. Přesčasový příplatek je v tomto režimu vypnutý.'
        : 'U mzdy je výchozí model 10 % pro noc a víkend; tyto dvě sazby mohou být sjednány jinak. Přesčasový peněžní příplatek má v modelu minimum 25 % a svátek v penězích 100 %.');
  }
  function ensureRateFloors() {
    const floor = (id, min) => { const el=$(id); const val=n(id); if(el && val < min) el.value=String(min); };
    if(regime==='salary'){ floor('nightPercent',20); floor('weekendPercent',25); floor('holidayPercent',100); floor('overtimePercent',$('salaryRestDay').checked?50:25); }
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
    if(n('hourlyRate')<0 || n('averageEarnings')<0) errors.push('Sazby musí být nezáporné.');
    return errors;
  }

  function calculate() {
    const h=currentHours();
    if(inputMode==='shift') renderTimeline(lastShift);
    const hourly=Math.max(0,n('hourlyRate'));
    const phv=Math.max(0,n('averageEarnings')||hourly);
    const overtime=regime==='agreement'?0:clamp(n('overtimeHours'),0,24);
    const errors=validateHours(h,overtime);
    const errorBox=$('formError');
    if(errors.length){ errorBox.hidden=false; errorBox.textContent=errors.join(' '); }
    else errorBox.hidden=true;

    const r=effectiveRates();
    const base=hourly*h.worked;
    const night=phv*h.night*r.night/100;
    const weekend=phv*h.weekend*r.weekend/100;
    const holidayCash=$('holidayCompensation').value==='pay' ? phv*h.holiday*r.holiday/100 : 0;
    const overtimeIncluded=regime==='wage' && $('wageOvertimeIncluded').checked;
    const overtimeCash=regime!=='agreement' && $('overtimeCompensation').value==='pay' && !overtimeIncluded ? phv*overtime*r.overtime/100 : 0;
    const custom=Math.max(0,n('customFixedRate'))*Math.max(0,n('customHours'));
    const bonus=night+weekend+holidayCash+overtimeCash+custom;
    const holidayLeave=$('holidayCompensation').value==='leave'?h.holiday:0;
    const overtimeLeave=regime!=='agreement' && $('overtimeCompensation').value==='leave' && !overtimeIncluded ? overtime:0;
    const leave=holidayLeave+overtimeLeave;
    const total=base+bonus;
    const repeat=Math.max(1,Math.round(n('repeatCount',1)));
    const result={h,hourly,phv,overtime,r,base,night,weekend,holidayCash,overtimeCash,custom,bonus,leave,total,repeat,overtimeIncluded,errors};
    lastCalc=result;
    renderResult(result);
    renderOverlap(result);
    renderAudit();
    renderBenchmark(result);
    updateHero(result);
    updateUrl();
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
    const list=$('breakdownList'); list.replaceChildren(
      row('Noční práce',x.night,`${hrs(x.h.night)} × ${pct(x.r.night)} z PHV`,x.h.night===0),
      row('Sobota / neděle',x.weekend,`${hrs(x.h.weekend)} × ${pct(x.r.weekend)} z PHV`,x.h.weekend===0),
      row('Svátek',x.holidayCash,x.h.holiday===0?'bez svátečních hodin':$('holidayCompensation').value==='leave'?`${hrs(x.h.holiday)} → náhradní volno`:`${hrs(x.h.holiday)} × ${pct(x.r.holiday)} z PHV`,x.h.holiday===0),
      row('Přesčas',x.overtimeCash,x.overtime===0?'bez přesčasových hodin':regime==='agreement'?'DPP/DPČ: bez zákonného přesčasu':x.overtimeIncluded?'mzda sjednána s přihlédnutím k přesčasům':$('overtimeCompensation').value==='leave'?`${hrs(x.overtime)} → náhradní volno`:`${hrs(x.overtime)} × ${pct(x.r.overtime)} z PHV`,x.overtime===0),
      row('Další pevný bonus',x.custom,`${hrs(n('customHours'))} × ${money(n('customFixedRate'))}/h`,x.custom===0)
    );
    const note=$('resultNote');
    if(regime==='salary') note.querySelector('p').textContent='U platu je hlavní spolehlivý výstup výše příplatků podle PHV. „Základ za hodiny“ je pouze model z vámi zadaného hodinového ekvivalentu; z jedné směny nelze rekonstruovat celý měsíční plat.';
    else if(regime==='agreement') note.querySelector('p').textContent='DPP/DPČ: kalkulačka počítá noc, víkend a svátek obdobně jako u mzdy. Přesčasový příplatek nepřidává, protože na dohodách se práce přesčas v právním smyslu nekoná.';
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

  function renderAudit() {
    if(!lastCalc) return;
    const count=Math.max(1,Math.round(n('auditCount',lastCalc.repeat)));
    const expected=lastCalc.bonus*count; setText('auditExpected',money(expected));
    const paidRaw=$('paidBonus').value.trim(); const box=$('auditResult'); box.classList.remove('is-good','is-warn','is-bad');
    if(!paidRaw){setText('auditMessage','Zadejte částku z pásky a uvidíte rozdíl.');return;}
    const paid=Math.max(0,n('paidBonus')); const diff=paid-expected;
    if(Math.abs(diff)<1){box.classList.add('is-good');setText('auditMessage','Model a zadaná částka se shodují. Přesto ověřte počet hodin a PHV.');}
    else if(diff>0){box.classList.add('is-good');setText('auditMessage',`Na pásce je o ${money(diff)} více. Může jít o vyšší firemní sazby, další bonus nebo jiný počet hodin.`);}
    else {box.classList.add('is-warn');setText('auditMessage',`Na pásce je o ${money(Math.abs(diff))} méně než v tomto modelu. Nejdřív ověřte PHV, evidenci hodin, firemní sazby a náhradní volno.`);}
  }

  function renderBenchmark(x) {
    setText('benchmarkPhv',`${moneyFmt.format(x.phv)} Kč/h`);
    setText('nightLegalKc',`${moneyFmt.format(x.phv*.10)} Kč/h`);
    setText('weekendLegalKc',`${moneyFmt.format(x.phv*.10)} Kč/h`);
    setText('overtimeLegalKc',`${moneyFmt.format(x.phv*.25)} Kč/h`);
    setText('holidayLegalKc',`${moneyFmt.format(x.phv)} Kč/h`);
  }
  function updateHero(x) {
    setText('heroBonus',money(x.bonus)); setText('heroWorked',hrs(x.h.worked)); setText('heroTotal',money(x.total)); setText('heroLeave',hrs(x.leave));
    const active=[];if(x.h.night)active.push('noční');if(x.h.weekend)active.push('víkend');if(x.h.holiday)active.push('svátek');if(x.overtime)active.push('přesčas');
    setText('heroCaption',active.length?active.join(' + '):'bez příplatkového režimu');
  }

  function setPreset(name) {
    const today=new Date();
    if(name==='fridayNight'){
      const d=nextWeekday(today,5); $('shiftDate').value=localDateString(d); $('shiftStart').value='22:00'; $('shiftEnd').value='06:00'; $('breakStart').value='02:00'; $('breakMinutes').value=30;
    } else if(name==='saturdayDay') {
      const d=nextWeekday(today,6); $('shiftDate').value=localDateString(d); $('shiftStart').value='06:00'; $('shiftEnd').value='14:00'; $('breakStart').value='10:00'; $('breakMinutes').value=30;
    } else if(name==='christmas') {
      const y=today.getFullYear(); $('shiftDate').value=`${y}-12-24`; $('shiftStart').value='08:00'; $('shiftEnd').value='16:00'; $('breakStart').value='12:00'; $('breakMinutes').value=30;
    }
    calculate();
  }

  function shareParams() {
    const p=new URLSearchParams();
    p.set('rezim',regime);p.set('mode',inputMode);p.set('sazba',n('hourlyRate'));p.set('phv',n('averageEarnings'));
    if(inputMode==='shift'){['shiftDate','shiftStart','shiftEnd','breakStart','breakMinutes'].forEach(id=>p.set(id,$(id).value));}
    else {['manualWorked','manualNight','manualWeekend','manualHoliday'].forEach(id=>p.set(id,$(id).value));}
    p.set('prescas',n('overtimeHours'));p.set('prescasForma',$('overtimeCompensation').value);p.set('svatekForma',$('holidayCompensation').value);p.set('opakovat',n('repeatCount'));
    if($('salaryRestDay').checked)p.set('platKlid','1');if($('wageOvertimeIncluded').checked)p.set('mzdaPrescas','1');
    return p;
  }
  function updateUrl(){try{history.replaceState(null,'',`${location.pathname}?${shareParams().toString()}${location.hash}`);}catch(_){} }
  function loadUrl() {
    const p=new URLSearchParams(location.search);
    if(p.has('rezim')&&LEGAL[p.get('rezim')]) regime=p.get('rezim');
    if(p.get('mode')==='manual') inputMode='manual';
    const map={sazba:'hourlyRate',phv:'averageEarnings',shiftDate:'shiftDate',shiftStart:'shiftStart',shiftEnd:'shiftEnd',breakStart:'breakStart',breakMinutes:'breakMinutes',manualWorked:'manualWorked',manualNight:'manualNight',manualWeekend:'manualWeekend',manualHoliday:'manualHoliday',prescas:'overtimeHours',opakovat:'repeatCount'};
    Object.entries(map).forEach(([key,id])=>{if(p.has(key))$(id).value=p.get(key);});
    if(p.has('prescasForma'))$('overtimeCompensation').value=p.get('prescasForma');if(p.has('svatekForma'))$('holidayCompensation').value=p.get('svatekForma');
    $('salaryRestDay').checked=p.get('platKlid')==='1'; $('wageOvertimeIncluded').checked=p.get('mzdaPrescas')==='1';
  }

  function setInputMode(mode) {
    inputMode=mode==='manual'?'manual':'shift';
    qsa('[data-input-mode]').forEach(b=>{const active=b.dataset.inputMode===inputMode;b.classList.toggle('is-active',active);b.setAttribute('aria-selected',String(active));});
    $('shiftModePanel').hidden=inputMode!=='shift'; $('manualModePanel').hidden=inputMode!=='manual'; calculate();
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
    qsa('[data-input-mode]').forEach(b=>b.addEventListener('click',()=>setInputMode(b.dataset.inputMode)));
    qsa('[data-regime]').forEach(b=>b.addEventListener('click',()=>{regime=b.dataset.regime;ratesDirty=false;updateRegimeUi();rateDefaults(true);calculate();}));
    qsa('[data-preset]').forEach(b=>b.addEventListener('click',()=>setPreset(b.dataset.preset)));
    ['hourlyRate','averageEarnings','shiftDate','shiftStart','shiftEnd','breakMinutes','breakStart','manualWorked','manualNight','manualWeekend','manualHoliday','overtimeHours','repeatCount','customFixedRate','customHours'].forEach(id=>$(id)?.addEventListener('input',calculate));
    ['overtimeCompensation','holidayCompensation'].forEach(id=>$(id)?.addEventListener('change',calculate));
    ['salaryRestDay','wageOvertimeIncluded'].forEach(id=>$(id)?.addEventListener('change',()=>{if(id==='salaryRestDay'&&!ratesDirty)rateDefaults(true);calculate();}));
    ['nightPercent','weekendPercent','holidayPercent','overtimePercent'].forEach(id=>$(id)?.addEventListener('input',()=>{ratesDirty=true;calculate();}));
    $('syncAverage').addEventListener('click',()=>{$('averageEarnings').value=$('hourlyRate').value;calculate();});
    $('resetRates').addEventListener('click',()=>{ratesDirty=false;rateDefaults(true);calculate();});
    ['paidBonus','auditCount'].forEach(id=>$(id)?.addEventListener('input',renderAudit));
    $('copyResult').addEventListener('click',e=>copy(summaryText(),e.currentTarget));
    $('copyLink').addEventListener('click',e=>copy(location.href,e.currentTarget));
    $('printResult').addEventListener('click',()=>window.print());
    const toggle=$('menuToggle'),nav=$('mainNavMobile');
    toggle?.addEventListener('click',()=>{const open=nav.classList.toggle('is-open');toggle.setAttribute('aria-expanded',String(open));});
    nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('is-open');toggle?.setAttribute('aria-expanded','false');}));
    setInputMode(inputMode); updateRegimeUi(); calculate();
  }
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
