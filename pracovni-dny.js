(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const MS_DAY = 86400000;
  const monthNames = ['leden','únor','březen','duben','květen','červen','červenec','srpen','září','říjen','listopad','prosinec'];
  const monthNamesTitle = ['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
  const weekdayShort = ['Ne','Po','Út','St','Čt','Pá','So'];
  const dateFormatter = new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'long',year:'numeric'});
  const shortDateFormatter = new Intl.DateTimeFormat('cs-CZ',{day:'numeric',month:'short',year:'numeric'});
  const weekdayFormatter = new Intl.DateTimeFormat('cs-CZ',{weekday:'long'});
  const numberFormatter = new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:2});
  const STORAGE_KEY = 'rv-workdays-v2';
  let storageControl;

  const state = {
    mode: 'between',
    weekdays: new Set([1,2,3,4,5]),
    exceptions: [],
    result: null,
    yearStats: null
  };

  function localDate(year, month, day) { return new Date(year, month, day, 12, 0, 0, 0); }
  function cloneDate(date) { return localDate(date.getFullYear(), date.getMonth(), date.getDate()); }
  function addDays(date, amount) { return localDate(date.getFullYear(), date.getMonth(), date.getDate() + amount); }
  function daysDiff(a, b) { return Math.round((Date.UTC(b.getFullYear(),b.getMonth(),b.getDate()) - Date.UTC(a.getFullYear(),a.getMonth(),a.getDate())) / MS_DAY); }
  function iso(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
  function parseDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    const date = localDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return iso(date) === value ? date : null;
  }
  function formatDate(date) { return date ? dateFormatter.format(date) : '—'; }
  function capitalize(value) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''; }
  function plural(value, one, few, many) {
    const n = Math.abs(Number(value));
    if (n === 1) return one;
    if (n >= 2 && n <= 4) return few;
    return many;
  }
  function formatNumber(value, digits = 0) {
    return new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(Number.isFinite(value) ? value : 0);
  }
  function getIsoWeek(date) {
    const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = tmp.getUTCDay() || 7;
    tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
    return Math.ceil((((tmp - yearStart) / MS_DAY) + 1) / 7);
  }
  function easterSunday(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19*a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2*e + 2*i - h - k) % 7, m = Math.floor((a + 11*h + 22*l) / 451);
    const month = Math.floor((h + l - 7*m + 114) / 31) - 1;
    const day = ((h + l - 7*m + 114) % 31) + 1;
    return localDate(year, month, day);
  }
  function holidayMap(year) {
    const map = new Map();
    const fixed = [
      [0,1,'Nový rok a Den obnovy samostatného českého státu'],[4,1,'Svátek práce'],[4,8,'Den vítězství'],
      [6,5,'Den slovanských věrozvěstů Cyrila a Metoděje'],[6,6,'Den upálení mistra Jana Husa'],[8,28,'Den české státnosti'],
      [9,28,'Den vzniku samostatného československého státu'],[10,17,'Den boje za svobodu a demokracii a Mezinárodní den studentstva'],
      [11,24,'Štědrý den'],[11,25,'1. svátek vánoční'],[11,26,'2. svátek vánoční']
    ];
    fixed.forEach(([m,d,name]) => map.set(iso(localDate(year,m,d)),name));
    const easter = easterSunday(year);
    map.set(iso(addDays(easter,-2)),'Velký pátek');
    map.set(iso(addDays(easter,1)),'Velikonoční pondělí');
    return map;
  }
  function getException(date) { return state.exceptions.find(item => item.date === iso(date)) || null; }
  function dayInfo(date) {
    const key = iso(date);
    const exception = getException(date);
    const holiday = holidayMap(date.getFullYear()).get(key) || '';
    const inWeek = state.weekdays.has(date.getDay());
    let working = inWeek;
    let reason = inWeek ? 'Běžný pracovní den' : 'Mimo pracovní týden';
    let kind = inWeek ? 'work' : 'weekend';
    if ($('excludeHolidays').checked && holiday) { working = false; reason = holiday; kind = 'holiday'; }
    if (exception) {
      working = exception.type === 'work';
      reason = exception.label || (working ? 'Mimořádně pracovní den' : 'Vlastní volno');
      kind = working ? 'custom-work' : 'custom-off';
    }
    return {date:cloneDate(date),key,working,inWeek,holiday,exception,reason,kind,isWeekend:!inWeek};
  }
  function getHours() { return Math.min(24,Math.max(.25,Number($('hoursPerDay').value) || 8)); }
  function nextWorkingDay(date, direction = 1, includeCurrent = false) {
    let cursor = cloneDate(date);
    if (!includeCurrent) cursor = addDays(cursor,direction);
    for (let i=0;i<3700;i++) {
      if (dayInfo(cursor).working) return cursor;
      cursor = addDays(cursor,direction);
    }
    return null;
  }
  function monthKey(date) { return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`; }
  function aggregateDays(days) {
    const months = new Map();
    days.forEach(day => {
      const key = monthKey(day.date);
      if (!months.has(key)) months.set(key,{year:day.date.getFullYear(),month:day.date.getMonth(),calendar:0,working:0,weekends:0,holidays:0,customOff:0,hours:0});
      const row = months.get(key);
      row.calendar += 1;
      if (day.working) { row.working += 1; row.hours += getHours(); }
      if (!day.inWeek) row.weekends += 1;
      if (day.holiday && !day.working) row.holidays += 1;
      if (day.exception && day.exception.type === 'off') row.customOff += 1;
    });
    return Array.from(months.values());
  }

  function calculateBetween() {
    let start = parseDate($('startDate').value), end = parseDate($('endDate').value);
    if (!start || !end) return {valid:false,error:'Doplňte platná data.'};
    if (end < start) [start,end] = [end,start];
    let calcStart = $('includeStart').checked ? start : addDays(start,1);
    let calcEnd = $('includeEnd').checked ? end : addDays(end,-1);
    const days = [];
    if (calcEnd >= calcStart) {
      for (let cursor=cloneDate(calcStart); cursor<=calcEnd; cursor=addDays(cursor,1)) days.push(dayInfo(cursor));
    }
    const working = days.filter(d=>d.working);
    const holidaysExcluded = days.filter(d=>d.holiday && !d.working);
    const customOff = days.filter(d=>d.exception && d.exception.type==='off');
    const workShare = days.length ? Math.round(working.length/days.length*100) : 0;
    return {
      valid:true, mode:'between', start,end,calcStart,calcEnd,days,workingDays:working.length,calendarDays:days.length,
      offDays:days.length-working.length,weekends:days.filter(d=>!d.inWeek).length,holidays:holidaysExcluded.length,
      customOff:customOff.length,hours:working.length*getHours(),workShare,months:aggregateDays(days),
      next:nextWorkingDay(end,1,false)
    };
  }
  function calculateAdd() {
    const anchor = parseDate($('anchorDate').value);
    if (!anchor) return {valid:false,error:'Doplňte platné výchozí datum.'};
    const amount = Math.min(10000,Math.max(0,Math.trunc(Number($('workdayAmount').value) || 0)));
    const direction = $('direction').value === 'subtract' ? -1 : 1;
    const countAnchor = $('countAnchor').checked;
    let cursor = cloneDate(anchor), counted = 0, skipped = 0;
    const path = [];
    if (amount === 0) {
      path.push(dayInfo(cursor));
      return {valid:true,mode:'add',anchor,resultDate:cursor,amount,direction,countAnchor,days:path,workingDays:0,calendarDays:0,offDays:0,weekends:0,holidays:0,hours:0,workShare:100,months:aggregateDays(path),next:nextWorkingDay(cursor,1,true)};
    }
    if (countAnchor && dayInfo(cursor).working) {
      const info = dayInfo(cursor); path.push(info); counted = 1;
    }
    let guard = 0;
    while (counted < amount && guard < 50000) {
      cursor = addDays(cursor,direction); guard += 1;
      const info = dayInfo(cursor); path.push(info);
      if (info.working) counted += 1; else skipped += 1;
    }
    const weekends = path.filter(d=>!d.inWeek && !d.working).length;
    const holidays = path.filter(d=>d.holiday && !d.working).length;
    return {valid:true,mode:'add',anchor,resultDate:cursor,amount,direction,countAnchor,days:path,workingDays:counted,calendarDays:path.length,offDays:skipped,weekends,holidays,hours:counted*getHours(),workShare:path.length?Math.round(counted/path.length*100):100,months:aggregateDays(path),next:nextWorkingDay(cursor,1,false)};
  }
  function calculateYear(yearValue = Number($('yearInput').value)) {
    const year = Math.min(2200,Math.max(1900,Math.trunc(yearValue || new Date().getFullYear())));
    const days = [];
    for (let cursor=localDate(year,0,1); cursor.getFullYear()===year; cursor=addDays(cursor,1)) days.push(dayInfo(cursor));
    const working = days.filter(d=>d.working);
    const months = aggregateDays(days);
    const weekdayHolidays = days.filter(d=>d.holiday && d.inWeek && !d.working).length;
    const best = months.reduce((a,b)=>b.working>a.working?b:a,months[0]);
    return {valid:true,mode:'year',year,days,workingDays:working.length,calendarDays:days.length,offDays:days.length-working.length,weekends:days.filter(d=>!d.inWeek).length,holidays:days.filter(d=>d.holiday&&!d.working).length,weekdayHolidays,hours:working.length*getHours(),workShare:Math.round(working.length/days.length*100),months,best,next:nextWorkingDay(localDate(year,11,31),1,false)};
  }
  function calculateCurrent() {
    if (state.mode === 'add') return calculateAdd();
    if (state.mode === 'year') return calculateYear();
    return calculateBetween();
  }

  function resultNarrative(data) {
    if (!data.valid) return {tone:'Neúplné zadání',headline:data.error,text:'Zkontrolujte vstupní data a nastavení pracovního kalendáře.'};
    if (data.mode === 'add') {
      if (data.amount === 0) return {tone:'Výchozí datum',headline:'Počet pracovních dnů je nula.',text:'Výsledkem je stejné datum. Pracovní režim nemá při nulovém posunu vliv.'};
      return {tone:'Dopočítaný termín',headline:`Výsledek připadá na ${capitalize(weekdayFormatter.format(data.resultDate))}.`,text:`Pro dosažení ${data.amount} ${plural(data.amount,'pracovního dne','pracovních dnů','pracovních dnů')} bylo potřeba projít ${data.calendarDays} kalendářních dnů a přeskočit ${data.offDays} nepracovních.`};
    }
    if (data.mode === 'year') return {tone:'Roční pracovní rámec',headline:`Rok ${data.year} má podle nastavení ${data.workingDays} pracovních dnů.`,text:`Orientačně jde o ${formatNumber(data.hours, data.hours%1?1:0)} hodin. Nejsilnější měsíc je ${monthNames[data.best.month]} s ${data.best.working} pracovními dny.`};
    if (data.workingDays === 0) return {tone:'Bez pracovní kapacity',headline:'Ve zvoleném rozsahu není žádný pracovní den.',text:'Zkontrolujte krajní dny, pracovní týden, svátky a vlastní výjimky.'};
    if (data.workingDays < 5) return {tone:'Krátké pracovní okno',headline:`V období zbývá pouze ${data.workingDays} ${plural(data.workingDays,'pracovní den','pracovní dny','pracovních dnů')}.`,text:'Pro důležitý termín je vhodná rezerva, protože i malá změna může vyčerpat většinu dostupné kapacity.'};
    if (data.workShare < 55) return {tone:'Kalendářní termín může klamat',headline:'Více než dvě pětiny období nejsou pracovní.',text:`Z ${data.calendarDays} kalendářních dnů zůstává ${data.workingDays} pracovních. Plánujte podle pracovního výsledku, ne pouze podle délky období.`};
    return {tone:'Použitelný plánovací rámec',headline:`V období je ${data.workingDays} pracovních dnů.`,text:`Při délce dne ${numberFormatter.format(getHours())} h jde orientačně o ${numberFormatter.format(data.hours)} pracovních hodin před odečtením dovolené, absencí a provozních ztrát.`};
  }

  function setText(id,value) { const el=$(id); if(el) el.textContent=value; }
  function renderInvalid(data) {
    setText('resultPrimary','—'); setText('resultPrimaryNote','Výpočet není připraven'); setText('resultBadge','Zkontrolujte zadání');
    setText('readingTone','Neúplné zadání'); setText('readingHeadline',data.error || 'Zkontrolujte vstupy.'); setText('readingText','Výsledek se zobrazí po doplnění platných údajů.');
    ['metricCalendar','metricOff','metricWeekends','metricHolidays'].forEach(id=>setText(id,'—'));
    $('timeline').innerHTML='<div class="wd-day-chip is-truncated">Doplňte platné zadání</div>';
    $('monthTableBody').innerHTML='<tr><td colspan="6">Výpočet není připraven.</td></tr>';
  }
  function renderResult(data) {
    state.result = data;
    if (!data.valid) { renderInvalid(data); return; }
    const narrative = resultNarrative(data);
    const isAdd = data.mode === 'add';
    $('resultDateBlock').hidden = !isAdd;
    if (isAdd) {
      setText('resultTitle','Datum po pracovních dnech'); setText('resultPrimaryLabel','Zadaných pracovních dnů'); setText('resultPrimary',data.amount);
      setText('resultPrimaryNote',`${data.direction===1?'Přičteno':'Odečteno'} od ${shortDateFormatter.format(data.anchor)}`);
      setText('resultDate',formatDate(data.resultDate)); setText('resultDateMeta',`${capitalize(weekdayFormatter.format(data.resultDate))} · KT ${getIsoWeek(data.resultDate)}`);
      setText('resultBadge',data.direction===1?'Termín v budoucnosti':'Termín v minulosti');
    } else if (data.mode === 'year') {
      setText('resultTitle',`Pracovní rok ${data.year}`); setText('resultPrimaryLabel','Pracovních dnů'); setText('resultPrimary',data.workingDays);
      setText('resultPrimaryNote',`${numberFormatter.format(data.hours)} pracovních hodin`); setText('resultBadge',`${data.calendarDays} kalendářních dnů`);
    } else {
      setText('resultTitle','Pracovní dny v období'); setText('resultPrimaryLabel','Pracovních dnů'); setText('resultPrimary',data.workingDays);
      setText('resultPrimaryNote',`${numberFormatter.format(data.hours)} pracovních hodin`);
      setText('resultBadge',`${shortDateFormatter.format(data.start)} – ${shortDateFormatter.format(data.end)}`);
    }
    setText('metricCalendar',data.calendarDays); setText('metricOff',data.offDays); setText('metricWeekends',data.weekends); setText('metricHolidays',data.holidays);
    setText('workShareText',`${data.workShare} %`); $('workShareBar').style.width=`${data.workShare}%`;
    setText('readingTone',narrative.tone); setText('readingHeadline',narrative.headline); setText('readingText',narrative.text);
    setText('nextWorkday',data.next ? `${capitalize(weekdayFormatter.format(data.next))} ${shortDateFormatter.format(data.next)}` : '—');
    renderTimeline(data); renderMonthTable(data); renderExcluded(data);
  }

  function renderTimeline(data) {
    const holder = $('timeline');
    if (!data.days.length) { holder.innerHTML='<div class="wd-day-chip is-truncated">Žádné zahrnuté dny</div>'; return; }
    let days = data.days;
    let truncated = false;
    if (days.length > 60) { days = [...days.slice(0,28),...days.slice(-28)]; truncated = true; }
    const html = [];
    days.forEach((day,index) => {
      if (truncated && index===28) html.push(`<div class="wd-day-chip is-truncated">…<br>${data.days.length-56} dnů<br>…</div>`);
      html.push(`<div class="wd-day-chip ${day.kind}" title="${escapeHtml(day.reason)}"><span>${weekdayShort[day.date.getDay()]}</span><strong>${day.date.getDate()}</strong><small>${monthNames[day.date.getMonth()].slice(0,3)}</small></div>`);
    });
    holder.innerHTML=html.join('');
  }
  function renderMonthTable(data) {
    const rows = (data.months || []).map(row => `<tr><td>${monthNamesTitle[row.month]} ${row.year}</td><td>${row.working}</td><td>${numberFormatter.format(row.hours)}</td><td>${row.weekends}</td><td>${row.holidays}</td><td>${row.customOff}</td></tr>`);
    $('monthTableBody').innerHTML=rows.length?rows.join(''):'<tr><td colspan="6">Bez dat k zobrazení.</td></tr>';
  }
  function renderExcluded(data) {
    const excluded = data.days.filter(day => !day.working && (day.holiday || day.exception));
    setText('excludedIntro',excluded.length?`Nalezeno ${excluded.length} zvláštních nepracovních dnů. Víkendy bez dalšího důvodu zde nejsou vypsané.`:'V období nejsou žádné svátky ani vlastní nepracovní výjimky.');
    $('excludedList').innerHTML = excluded.slice(0,16).map(day => `<div class="wd-excluded-item"><span>${day.date.getDate()}. ${day.date.getMonth()+1}.</span><div><strong>${escapeHtml(day.reason)}</strong><small>${capitalize(weekdayFormatter.format(day.date))} · ${day.holiday?'český svátek':'vlastní výjimka'}</small></div></div>`).join('');
    if (excluded.length>16) $('excludedList').insertAdjacentHTML('beforeend',`<div class="wd-excluded-item"><span>+${excluded.length-16}</span><div><strong>Další dny jsou zahrnuté v souhrnu</strong><small>Stáhněte CSV pro úplný seznam.</small></div></div>`);
  }
  function renderYearOverview(year = Number($('yearInput').value) || new Date().getFullYear()) {
    const data = calculateYear(year); state.yearStats=data;
    setText('yearOverviewTitle',data.year); setText('yearWorkingDays',data.workingDays); setText('yearWorkingHours',`${numberFormatter.format(data.hours)} hodin`);
    setText('yearOffDays',data.offDays); setText('yearWeekdayHolidays',data.weekdayHolidays); setText('yearBestMonth',monthNamesTitle[data.best.month]); setText('yearBestMonthHint',`${data.best.working} pracovních dnů`);
    $('yearGrid').innerHTML=data.months.map(row=>{
      const share=Math.round(row.working/row.calendar*100);
      return `<article class="wd-year-card"><div class="wd-year-card-head"><strong>${monthNamesTitle[row.month]}</strong><span>${row.working} dní</span></div><div class="wd-year-card-main"><strong>${numberFormatter.format(row.hours)}</strong><small>hodin</small></div><div class="wd-year-bar"><i style="width:${share}%"></i></div><div class="wd-year-meta"><span>${row.weekends} mimo týden</span><span>${row.holidays} svátků</span></div></article>`;
    }).join('');
  }
  function escapeHtml(value) { return String(value||'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch])); }

  function updateSettingsSummary() {
    const selected = [1,2,3,4,5,6,0].filter(day=>state.weekdays.has(day)).map(day=>weekdayShort[day]);
    const weekText = selected.length===5 && [1,2,3,4,5].every(d=>state.weekdays.has(d)) ? 'Po–Pá' : selected.join(', ');
    setText('settingsSummary',`${weekText || 'žádný den'} · ${$('excludeHolidays').checked?'bez svátků':'včetně svátků'} · ${numberFormatter.format(getHours())} h`);
  }
  function updateExceptionList() {
    setText('exceptionCount',`${state.exceptions.length} ${plural(state.exceptions.length,'výjimka','výjimky','výjimek')}`);
    if (!state.exceptions.length) { $('exceptionList').innerHTML='<p>Zatím nejsou přidané žádné vlastní výjimky.</p>'; return; }
    $('exceptionList').innerHTML=state.exceptions.sort((a,b)=>a.date.localeCompare(b.date)).map(item=>`<span class="wd-exception-chip ${item.type}">${item.date} · ${escapeHtml(item.label || (item.type==='work'?'pracovní den':'volno'))}<button type="button" data-remove-exception="${item.date}" aria-label="Odstranit výjimku">×</button></span>`).join('');
    $$('[data-remove-exception]').forEach(btn=>btn.addEventListener('click',()=>{ state.exceptions=state.exceptions.filter(item=>item.date!==btn.dataset.removeException); updateExceptionList(); saveState(); refresh(); }));
  }
  function addException() {
    const date=$('exceptionDate').value;
    if (!parseDate(date)) { showToast('Vyberte platné datum výjimky.'); return; }
    const item={date,type:$('exceptionType').value,label:$('exceptionLabel').value.trim()};
    state.exceptions=state.exceptions.filter(x=>x.date!==date); state.exceptions.push(item);
    $('exceptionDate').value=''; $('exceptionLabel').value=''; updateExceptionList(); saveState(); refresh(); showToast('Výjimka byla přidána.');
  }

  function setMode(mode,scroll=false) {
    state.mode=mode;
    $$('[data-mode]').forEach(btn=>{ const active=btn.dataset.mode===mode; btn.classList.toggle('is-active',active); btn.setAttribute('aria-selected',String(active)); });
    $('betweenPanel').hidden=mode!=='between'; $('addPanel').hidden=mode!=='add'; $('yearPanel').hidden=mode!=='year';
    const configs={between:['Výpočet období','Kolik pracovních dnů je mezi daty?','Zadejte rozsah. Výsledek se přepočítává okamžitě a oba krajní dny můžete započítat samostatně.','Aktualizovat výsledek'],add:['Výpočet termínu','Jaké datum vyjde za zadaný počet pracovních dnů?','Kalkulačka přeskočí nepracovní dny podle pracovního týdne, svátků a vlastních výjimek.','Dopočítat datum'],year:['Roční pracovní kalendář','Kolik pracovních dnů a hodin má celý rok?','Projděte kapacitu všech měsíců se stejným nastavením pracovního týdne a výjimek.','Přepočítat rok']};
    const [eye,title,desc,button]=configs[mode]; setText('formEyebrow',eye); setText('formTitle',title); setText('formDescription',desc); setText('calculateBtn',button);
    saveState(); refresh(); if(scroll) $('nastroj').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function applyPreset(type) {
    const today=cloneDate(new Date()); let start,end;
    if(type==='month'){start=localDate(today.getFullYear(),today.getMonth(),1);end=localDate(today.getFullYear(),today.getMonth()+1,0);}
    if(type==='next30'){start=today;end=addDays(today,29);}
    if(type==='quarter'){const q=Math.floor(today.getMonth()/3);start=localDate(today.getFullYear(),q*3,1);end=localDate(today.getFullYear(),q*3+3,0);}
    if(type==='year'){start=today;end=localDate(today.getFullYear(),11,31);}
    $('startDate').value=iso(start);$('endDate').value=iso(end);refresh();
  }
  function swapDates(){const a=$('startDate').value;$('startDate').value=$('endDate').value;$('endDate').value=a;refresh();}
  function setDefaults() {
    const today=cloneDate(new Date());
    $('startDate').value=iso(localDate(today.getFullYear(),today.getMonth(),1)); $('endDate').value=iso(localDate(today.getFullYear(),today.getMonth()+1,0));
    $('anchorDate').value=iso(today); $('workdayAmount').value=20; $('direction').value='add'; $('includeStart').checked=true; $('includeEnd').checked=true; $('countAnchor').checked=false;
    $('excludeHolidays').checked=true; $('hoursPerDay').value=8; $('yearInput').value=today.getFullYear(); state.weekdays=new Set([1,2,3,4,5]); state.exceptions=[];
    renderWeekdayButtons(); updateExceptionList(); updateSettingsSummary(); setMode('between'); saveState();
  }
  function renderWeekdayButtons(){ $$('[data-day]').forEach(btn=>btn.classList.toggle('is-on',state.weekdays.has(Number(btn.dataset.day)))); }

  function refresh() {
    updateSettingsSummary(); renderResult(calculateCurrent()); renderYearOverview(Number($('yearInput').value)||new Date().getFullYear()); saveState();
  }
  function showToast(message){const toast=$('toast');toast.textContent=message;toast.hidden=false;clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.hidden=true,2600);}
  async function copyText(text){try{await navigator.clipboard.writeText(text);}catch(e){const ta=document.createElement('textarea');ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();}}
  function resultText() {
    const d=state.result;if(!d||!d.valid)return 'Výpočet pracovních dnů není připraven.';
    if(d.mode==='add') return `${d.direction===1?'Datum za':'Datum před'} ${d.amount} pracovními dny od ${formatDate(d.anchor)}: ${formatDate(d.resultDate)} (${capitalize(weekdayFormatter.format(d.resultDate))}). Přeskočeno ${d.offDays} nepracovních dnů. RychléVýpočty.cz`;
    if(d.mode==='year') return `Pracovní rok ${d.year}: ${d.workingDays} pracovních dnů, ${numberFormatter.format(d.hours)} hodin, ${d.offDays} nepracovních dnů. RychléVýpočty.cz`;
    return `Období ${formatDate(d.start)} až ${formatDate(d.end)}: ${d.workingDays} pracovních dnů, ${numberFormatter.format(d.hours)} hodin, ${d.offDays} nepracovních dnů, ${d.holidays} svátků. RychléVýpočty.cz`;
  }
  function updateUrl(push=false) {
    if (location.protocol === 'about:' || location.protocol === 'data:') return;
    const p=new URLSearchParams(); p.set('mode',state.mode); p.set('week',Array.from(state.weekdays).sort().join(''));
    if(!$('excludeHolidays').checked)p.set('svatky','1'); if(getHours()!==8)p.set('h',String(getHours()));
    if(state.mode==='between'){p.set('od',$('startDate').value);p.set('do',$('endDate').value);if(!$('includeStart').checked)p.set('zacatek','0');if(!$('includeEnd').checked)p.set('konec','0');}
    if(state.mode==='add'){p.set('datum',$('anchorDate').value);p.set('dny',$('workdayAmount').value);p.set('smer',$('direction').value);if($('countAnchor').checked)p.set('vcetne','1');}
    if(state.mode==='year')p.set('rok',$('yearInput').value);
    const url=`${location.pathname}?${p.toString()}`; history[push?'pushState':'replaceState']({},'',url);
  }
  function loadUrl() {
    const p=new URLSearchParams(location.search); const mode=['between','add','year'].includes(p.get('mode'))?p.get('mode'):null;
    if(p.get('week')){const set=new Set(p.get('week').split('').map(Number).filter(n=>n>=0&&n<=6));if(set.size)state.weekdays=set;}
    if(p.has('svatky'))$('excludeHolidays').checked=false;if(p.get('h'))$('hoursPerDay').value=p.get('h');
    if(p.get('od')&&parseDate(p.get('od')))$('startDate').value=p.get('od');if(p.get('do')&&parseDate(p.get('do')))$('endDate').value=p.get('do');
    if(p.get('zacatek')==='0')$('includeStart').checked=false;if(p.get('konec')==='0')$('includeEnd').checked=false;
    if(p.get('datum')&&parseDate(p.get('datum')))$('anchorDate').value=p.get('datum');if(p.get('dny'))$('workdayAmount').value=p.get('dny');if(p.get('smer'))$('direction').value=p.get('smer');if(p.get('vcetne')==='1')$('countAnchor').checked=true;
    if(p.get('rok'))$('yearInput').value=p.get('rok'); renderWeekdayButtons(); if(mode)state.mode=mode;
  }
  function saveState(){if(!storageControl.enabled())return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify({weekdays:Array.from(state.weekdays),exceptions:state.exceptions,holidays:$('excludeHolidays').checked,hours:getHours()}));}catch(e){}}
  function loadState(){if(!storageControl.enabled())return;try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');if(!data)return;if(Array.isArray(data.weekdays)&&data.weekdays.length)state.weekdays=new Set(data.weekdays);if(Array.isArray(data.exceptions))state.exceptions=data.exceptions;if(typeof data.holidays==='boolean')$('excludeHolidays').checked=data.holidays;if(data.hours)$('hoursPerDay').value=data.hours;}catch(e){}}
  function downloadBlob(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},1000);}
  function exportCsv(){const d=state.result;if(!d||!d.valid)return;const rows=[['Datum','Den','Pracovní','Důvod','Svátek','Vlastní výjimka','Hodiny']];d.days.forEach(day=>rows.push([day.key,capitalize(weekdayFormatter.format(day.date)),day.working?'Ano':'Ne',day.reason,day.holiday||'',day.exception?day.exception.label||day.exception.type:'',day.working?String(getHours()).replace('.',','):'0']));const csv='\uFEFF'+rows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\r\n');downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`pracovni-dny-${state.mode}-${new Date().toISOString().slice(0,10)}.csv`);showToast('CSV bylo staženo.');}

  function updateTodayCard(){const today=cloneDate(new Date());const info=dayInfo(today);const next=nextWorkingDay(today,1,!info.working);setText('todayDateText',capitalize(`${weekdayFormatter.format(today)} ${shortDateFormatter.format(today)}`));setText('todayWorkStatus',info.working?'Pracovní den':'Nepracovní den');setText('todayWorkDetail',info.working?(info.holiday?info.holiday:`Další pracovní den: ${next?shortDateFormatter.format(next):'—'}`):`${info.reason}. Další pracovní: ${next?shortDateFormatter.format(next):'—'}`);setText('todayWeek',`KT ${getIsoWeek(today)}`);setText('todayWorkIcon',info.working?'✓':'×');$('todayWorkIcon').style.background=info.working?'linear-gradient(145deg,#98f0bd,#42cd7b)':'linear-gradient(145deg,#ffd2d6,#ee7880)';}

  function bind() {
    $$('[data-mode]').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
    $$('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>applyPreset(btn.dataset.preset)));
    $$('[data-day]').forEach(btn=>btn.addEventListener('click',()=>{const day=Number(btn.dataset.day);if(state.weekdays.has(day)&&state.weekdays.size===1){showToast('Alespoň jeden den týdne musí zůstat pracovní.');return;}state.weekdays.has(day)?state.weekdays.delete(day):state.weekdays.add(day);renderWeekdayButtons();refresh();}));
    $('workdaysForm').addEventListener('submit',event=>{event.preventDefault();refresh();$('vysledek').scrollIntoView({behavior:'smooth',block:'center'});});
    ['startDate','endDate','includeStart','includeEnd','anchorDate','direction','workdayAmount','countAnchor','excludeHolidays','hoursPerDay','yearInput'].forEach(id=>{$(id).addEventListener('input',refresh);$(id).addEventListener('change',refresh);});
    $('swapDatesBtn').addEventListener('click',swapDates);$('setAnchorTodayBtn').addEventListener('click',()=>{$('anchorDate').value=iso(cloneDate(new Date()));refresh();});
    $('useTodayBtn').addEventListener('click',()=>{const t=iso(cloneDate(new Date()));$('startDate').value=t;$('anchorDate').value=t;setMode(state.mode==='year'?'between':state.mode,true);});
    $('prevYearBtn').addEventListener('click',()=>{$('yearInput').value=Number($('yearInput').value)-1;refresh();});$('nextYearBtn').addEventListener('click',()=>{$('yearInput').value=Number($('yearInput').value)+1;refresh();});$('thisYearBtn').addEventListener('click',()=>{$('yearInput').value=new Date().getFullYear();refresh();});
    $('openYearModeBtn').addEventListener('click',()=>setMode('year',true));$('addExceptionBtn').addEventListener('click',addException);
    $('resetBtn').addEventListener('click',()=>{storageControl.disable();setDefaults();updateTodayCard();showToast('Nastavení bylo obnoveno.');});
    $('copyResultBtn').addEventListener('click',async()=>{await copyText(resultText());showToast('Výsledek byl zkopírován.');});
    $('shareResultBtn').addEventListener('click',async()=>{updateUrl(true);const share={title:'Kalkulačka pracovních dnů',text:resultText(),url:location.href};try{if(navigator.share)await navigator.share(share);else{await copyText(location.href);showToast('Odkaz byl zkopírován.');}}catch(e){}});
    $('csvBtn').addEventListener('click',exportCsv);$('printBtn').addEventListener('click',()=>window.print());
    $('toggleMonthTableBtn').addEventListener('click',()=>{const wrap=$('monthTableWrap');wrap.hidden=!wrap.hidden;$('toggleMonthTableBtn').textContent=wrap.hidden?'Zobrazit detail':'Skrýt detail';$('toggleMonthTableBtn').setAttribute('aria-expanded',String(!wrap.hidden));});
    window.addEventListener('popstate',()=>{loadUrl();setMode(state.mode);});
  }

  function init(){
    const today=cloneDate(new Date());
    $('startDate').value=iso(localDate(today.getFullYear(),today.getMonth(),1));$('endDate').value=iso(localDate(today.getFullYear(),today.getMonth()+1,0));$('anchorDate').value=iso(today);$('yearInput').value=today.getFullYear();
    storageControl=window.RVStorageChoice.create({scope:'workdays',dataKey:STORAGE_KEY,inputId:'rememberWorkdaySettings',statusId:'workdayStorageStatus',onEnable:saveState});
    loadState();loadUrl();renderWeekdayButtons();updateExceptionList();bind();setMode(state.mode);updateTodayCard();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
