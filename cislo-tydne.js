(() => {
  'use strict';
  const DAY_MS = 86400000;
  const WEEK_MS = 7 * DAY_MS;
  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const state = { mode: 'basic', year: 2026, selectedWeek: 29, selectedDate: null, wizardStep: 1, view: 'cards' };
  const csLong = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const csShort = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const csMonth = new Intl.DateTimeFormat('cs-CZ', { month: 'long', timeZone: 'UTC' });
  const csWeekday = new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', timeZone: 'UTC' });
  const csDayMonth = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', timeZone: 'UTC' });
  const dayNamesShort = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

  function utcDate(year, month, day) { return new Date(Date.UTC(year, month, day)); }
  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null;
    const [y, m, d] = value.split('-').map(Number);
    const date = utcDate(y, m - 1, d);
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
  }
  function inputValue(date) { return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`; }
  function todayUTC() { const n = new Date(); return utcDate(n.getFullYear(), n.getMonth(), n.getDate()); }
  function addDays(date, days) { return new Date(date.getTime() + days * DAY_MS); }
  function mondayIndex(date) { return (date.getUTCDay() + 6) % 7; }
  function isoInfo(date) {
    const selected = new Date(date.getTime());
    const monday = addDays(selected, -mondayIndex(selected));
    const thursday = addDays(monday, 3);
    const isoYear = thursday.getUTCFullYear();
    const jan4 = utcDate(isoYear, 0, 4);
    const firstMonday = addDays(jan4, -mondayIndex(jan4));
    const week = 1 + Math.round((monday - firstMonday) / WEEK_MS);
    const sunday = addDays(monday, 6);
    return { isoYear, week, monday, sunday, dayPosition: mondayIndex(selected) + 1, selected };
  }
  function weeksInYear(year) { return isoInfo(utcDate(year, 11, 28)).week; }
  function dateFromWeek(year, week) {
    const max = weeksInYear(year);
    const w = Math.max(1, Math.min(max, Number(week) || 1));
    const jan4 = utcDate(year, 0, 4);
    return addDays(addDays(jan4, -mondayIndex(jan4)), (w - 1) * 7);
  }
  function isoCode(year, week) { return `${year}-W${String(week).padStart(2, '0')}`; }
  function capitalize(text) { return text ? text.charAt(0).toUpperCase() + text.slice(1) : ''; }
  function parityLabel(week) { return week % 2 ? 'lichý' : 'sudý'; }
  function quarterOfWeek(info) { const thursday = addDays(info.monday, 3); return Math.floor(thursday.getUTCMonth() / 3) + 1; }
  function formatRange(monday, sunday, includeYear = true) {
    const sameMonth = monday.getUTCMonth() === sunday.getUTCMonth() && monday.getUTCFullYear() === sunday.getUTCFullYear();
    const sameYear = monday.getUTCFullYear() === sunday.getUTCFullYear();
    if (sameMonth) return `${monday.getUTCDate()}.–${csLong.format(sunday)}`;
    if (sameYear) return `${monday.getUTCDate()}. ${csMonth.format(monday)}–${csLong.format(sunday)}`;
    return `${csLong.format(monday)}–${csLong.format(sunday)}`;
  }
  function setText(id, text) { const el = $(id); if (el) el.textContent = text; }
  function currentInfo() { return isoInfo(todayUTC()); }
  function validYear(value) { const y = Number(value); return Number.isInteger(y) && y >= 1900 && y <= 2100 ? y : null; }

  function renderHero() {
    const info = currentInfo();
    setText('heroIsoCode', isoCode(info.isoYear, info.week));
    setText('heroWeekNumber', info.week);
    setText('heroParity', `${parityLabel(info.week)} týden`);
    setText('heroRange', formatRange(info.monday, info.sunday));
    setText('heroToday', `dnes je ${csWeekday.format(info.selected)}`);
    setText('heroYearWeeks', `rok má ${weeksInYear(info.isoYear)} týdnů`);
    const container = $('heroDays');
    if (container) {
      container.innerHTML = '';
      for (let i = 0; i < 7; i++) {
        const d = addDays(info.monday, i);
        const span = document.createElement('span');
        if (inputValue(d) === inputValue(info.selected)) span.className = 'is-today';
        span.innerHTML = `<b>${d.getUTCDate()}</b><small>${dayNamesShort[i]}</small>`;
        container.appendChild(span);
      }
    }
  }

  function selectedInfo() {
    if (state.mode === 'advanced') return isoInfo(dateFromWeek(state.year, state.selectedWeek));
    return isoInfo(state.selectedDate || todayUTC());
  }

  function renderResult() {
    const info = selectedInfo();
    state.year = info.isoYear;
    state.selectedWeek = info.week;
    const dateForLabel = state.mode === 'basic' ? info.selected : info.monday;
    const parity = parityLabel(info.week);
    setText('resultModeBadge', state.mode === 'basic' ? 'Rychlý režim' : 'Roční plánovač');
    setText('resultParityBadge', parity.toUpperCase());
    setText('weekResult', info.week);
    setText('weekRangeResult', formatRange(info.monday, info.sunday));
    setText('weekDescription', state.mode === 'basic' ? `Vybrané datum patří do ${info.week}. kalendářního týdne roku ${info.isoYear}.` : `Vybrali jste ${info.week}. kalendářní týden roku ${info.isoYear}.`);
    setText('isoCodeResult', isoCode(info.isoYear, info.week));
    setText('dayNameResult', capitalize(csWeekday.format(dateForLabel)));
    setText('dateShortResult', csShort.format(dateForLabel));
    setText('quarterResult', `Q${quarterOfWeek(info)}`);
    setText('monthResult', csMonth.format(addDays(info.monday, 3)));
    const count = weeksInYear(info.isoYear);
    setText('weeksInYearResult', count);
    setText('yearTypeResult', `rok s ${count} týdny`);
    setText('weekMondayLabel', `pondělí ${csDayMonth.format(info.monday)}`);
    setText('weekSundayLabel', `neděle ${csDayMonth.format(info.sunday)}`);
    setText('weekDayPosition', state.mode === 'basic' ? `${info.dayPosition}. den týdne` : 'celý týden');
    const progress = state.mode === 'basic' ? info.dayPosition / 7 * 100 : 100;
    $('weekProgressBar').style.width = `${progress}%`;
    setText('insightTitle', `${info.week}. týden je ${parity}`);
    setText('insightText', `ISO týden ${info.week} běží od pondělí ${csLong.format(info.monday)} do neděle ${csLong.format(info.sunday)}.`);
    const prevMonday = addDays(info.monday, -7), nextMonday = addDays(info.monday, 7);
    const prev = isoInfo(prevMonday), next = isoInfo(nextMonday), today = currentInfo();
    setText('prevWeekLabel', `KT ${prev.week}`);
    setText('nextWeekLabel', `KT ${next.week}`);
    setText('todayWeekLabel', `KT ${today.week}`);
    if ($('weekNumberInput')) { $('weekNumberInput').max = count; $('weekNumberInput').value = info.week; }
    setText('stepSelectedRange', formatRange(info.monday, info.sunday));
    setText('stepSelectedCode', `ISO ${isoCode(info.isoYear, info.week)} · ${parity} týden`);
    updateUrl(info);
    renderOverviewSelection();
  }

  function renderQuickAnswers() {
    const today = currentInfo();
    const next = isoInfo(addDays(today.monday, 7));
    setText('quickTodayWeek', `${today.week}. týden`);
    setText('quickTodayRange', formatRange(today.monday, today.sunday));
    setText('quickNextWeek', `${next.week}. týden`);
    setText('quickNextRange', formatRange(next.monday, next.sunday));
    setText('quickParity', `${capitalize(parityLabel(today.week))} týden`);
    setText('currentWeekSummary', `KT ${today.week}`);
  }

  function filteredWeeks() {
    const count = weeksInYear(state.year);
    const parity = $('parityFilter')?.value || 'all';
    const quarter = $('quarterFilter')?.value || 'all';
    const month = $('monthFilter')?.value || 'all';
    const result = [];
    for (let week = 1; week <= count; week++) {
      const monday = dateFromWeek(state.year, week), info = isoInfo(monday), sunday = addDays(monday, 6), thursday = addDays(monday, 3);
      if (parity === 'odd' && week % 2 === 0) continue;
      if (parity === 'even' && week % 2 !== 0) continue;
      const q = Math.floor(thursday.getUTCMonth()/3)+1;
      if (quarter !== 'all' && q !== Number(quarter)) continue;
      if (month !== 'all') {
        const target = Number(month);
        const touches = Array.from({length:7},(_,i)=>addDays(monday,i)).some(d=>d.getUTCMonth()===target && d.getUTCFullYear()===state.year);
        if (!touches) continue;
      }
      result.push({week, monday, sunday, info, quarter:q});
    }
    return result;
  }

  function renderOverview() {
    const count = weeksInYear(state.year);
    const firstMonday = dateFromWeek(state.year, 1), lastMonday = dateFromWeek(state.year, count), lastSunday = addDays(lastMonday, 6);
    setText('overviewTitle', `Kalendářní týdny roku ${state.year}`);
    setText('overviewLead', `Rok ${state.year} má podle ISO 8601 celkem ${count} týdnů. Kliknutím na týden zobrazíte přesné datum, lichost nebo sudost a ISO kód.`);
    setText('firstWeekSummary', formatRange(firstMonday, addDays(firstMonday,6)));
    setText('lastWeekSummary', formatRange(lastMonday, lastSunday));
    setText('totalWeeksSummary', count);
    setText('stepYearWeeks', count);
    setText('stepYearRange', `1. týden: ${csShort.format(firstMonday)} až ${csShort.format(addDays(firstMonday,6))}`);
    const weeks = filteredWeeks();
    const grid = $('weekGrid'), body = $('weekTableBody');
    grid.innerHTML = ''; body.innerHTML = '';
    const current = currentInfo();
    weeks.forEach(item => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'week-card';
      button.dataset.week = item.week;
      if (state.year === state.selectedInfoYear && item.week === state.selectedWeek) button.classList.add('is-selected');
      if (state.year === current.isoYear && item.week === current.week) button.classList.add('is-current');
      button.innerHTML = `<span class="week-card-number">${item.week}</span><span><b>${formatRange(item.monday,item.sunday,false)}</b><small>${isoCode(state.year,item.week)}</small></span><em>${parityLabel(item.week)} · Q${item.quarter}</em>`;
      button.addEventListener('click', () => selectWeek(state.year, item.week, true));
      grid.appendChild(button);
      const tr = document.createElement('tr');
      tr.dataset.week = item.week;
      if (state.year === state.selectedInfoYear && item.week === state.selectedWeek) tr.classList.add('is-selected');
      tr.innerHTML = `<td><strong>${item.week}</strong></td><td>${isoCode(state.year,item.week)}</td><td>${csShort.format(item.monday)}</td><td>${csShort.format(item.sunday)}</td><td>${parityLabel(item.week)}</td><td>Q${item.quarter}</td>`;
      tr.addEventListener('click', () => selectWeek(state.year, item.week, true));
      body.appendChild(tr);
    });
    $('overviewEmpty').hidden = weeks.length > 0;
    setOverviewView(state.view);
  }

  function renderOverviewSelection() {
    state.selectedInfoYear = selectedInfo().isoYear;
    $$('.week-card').forEach(el => el.classList.toggle('is-selected', Number(el.dataset.week) === state.selectedWeek && state.year === state.selectedInfoYear));
    $$('#weekTableBody tr').forEach(el => el.classList.toggle('is-selected', Number(el.dataset.week) === state.selectedWeek && state.year === state.selectedInfoYear));
  }

  function selectWeek(year, week, scroll = false) {
    state.year = validYear(year) || state.year;
    state.selectedWeek = Math.max(1, Math.min(weeksInYear(state.year), Number(week)||1));
    if ($('yearInput')) $('yearInput').value = state.year;
    if ($('weekNumberInput')) $('weekNumberInput').value = state.selectedWeek;
    state.mode = 'advanced';
    setMode('advanced', false);
    renderResult(); renderOverview();
    if (scroll) $('vysledek').scrollIntoView({behavior:'smooth',block:'start'});
  }

  function setMode(mode, render = true) {
    state.mode = mode;
    document.body.dataset.mode = mode;
    $('basicCalculation').hidden = mode !== 'basic';
    $('advancedCalculation').hidden = mode !== 'advanced';
    $$('.mode-button').forEach(btn => { const active = btn.dataset.mode === mode; btn.classList.toggle('is-active', active); btn.setAttribute('aria-selected', active); });
    if (mode === 'basic') { state.selectedDate = parseDate($('dateInput').value) || todayUTC(); }
    if (render) { renderResult(); renderOverview(); }
  }

  function setWizardStep(step) {
    state.wizardStep = Math.max(1, Math.min(3, Number(step)||1));
    $$('.wizard-tab').forEach(btn => btn.classList.toggle('is-active', Number(btn.dataset.step) === state.wizardStep));
    $$('[data-step-panel]').forEach(panel => panel.hidden = Number(panel.dataset.stepPanel) !== state.wizardStep);
    $('wizardProgress').style.width = `${state.wizardStep / 3 * 100}%`;
    $('wizardBack').disabled = state.wizardStep === 1;
    $('wizardNext').textContent = state.wizardStep === 3 ? 'Hotovo' : 'Pokračovat';
  }

  function setOverviewView(view) {
    state.view = view === 'table' ? 'table' : 'cards';
    $('weekGrid').hidden = state.view !== 'cards';
    $('weekTableWrap').hidden = state.view !== 'table';
    $$('[data-overview-view], [data-view]').forEach(btn => btn.classList.toggle('is-active', (btn.dataset.overviewView || btn.dataset.view) === state.view));
  }

  function updateUrl(info) {
    const url = new URL(location.href);
    url.search = '';
    if (state.mode === 'basic') url.searchParams.set('datum', inputValue(info.selected));
    else { url.searchParams.set('rok', info.isoYear); url.searchParams.set('tyden', info.week); }
    history.replaceState(null, '', url);
  }

  async function copyText(text, button) {
    try { await navigator.clipboard.writeText(text); const original = button.textContent; button.textContent = 'Zkopírováno'; setTimeout(()=>button.textContent=original,1400); }
    catch { window.prompt('Zkopírujte text:', text); }
  }
  function selectedText() { const i=selectedInfo(); return `${i.week}. kalendářní týden (${isoCode(i.isoYear,i.week)}): ${formatRange(i.monday,i.sunday)} – ${parityLabel(i.week)} týden.`; }
  function yearText() { return filteredWeeks().map(x=>`${x.week}. týden (${isoCode(state.year,x.week)}): ${csShort.format(x.monday)}–${csShort.format(x.sunday)} · ${parityLabel(x.week)}`).join('\n'); }
  function exportCsv() {
    const rows = [['Týden','ISO kód','Pondělí','Neděle','Typ','Čtvrtletí']];
    filteredWeeks().forEach(x=>rows.push([x.week,isoCode(state.year,x.week),inputValue(x.monday),inputValue(x.sunday),parityLabel(x.week),`Q${x.quarter}`]));
    const csv='\ufeff'+rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\r\n');
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}), a=document.createElement('a');
    a.href=URL.createObjectURL(blob); a.download=`kalendarni-tydny-${state.year}.csv`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function applyDatePreset(type) {
    let d=todayUTC();
    if(type==='tomorrow') d=addDays(d,1);
    if(type==='next-monday') { const delta=(7-mondayIndex(d))%7 || 7; d=addDays(d,delta); }
    if(type==='year-end') d=utcDate(d.getUTCFullYear(),11,31);
    $('dateInput').value=inputValue(d); state.selectedDate=d; setMode('basic');
  }

  function bind() {
    $$('.mode-button').forEach(btn=>btn.addEventListener('click',()=>setMode(btn.dataset.mode)));
    $$('[data-date-preset]').forEach(btn=>btn.addEventListener('click',()=>applyDatePreset(btn.dataset.datePreset)));
    $('dateInput').addEventListener('input',()=>{ const d=parseDate($('dateInput').value); if(d){state.selectedDate=d; setMode('basic');} });
    $('weekForm').addEventListener('submit',e=>{e.preventDefault(); $('formError').hidden=true; if(state.mode==='basic'){const d=parseDate($('dateInput').value); if(!d){$('formError').hidden=false;return;} state.selectedDate=d;} else {const y=validYear($('yearInput').value), w=Number($('weekNumberInput').value); if(!y||!w||w<1||w>weeksInYear(y)){$('formError').hidden=false;return;} state.year=y;state.selectedWeek=w;} renderResult();renderOverview();});
    $('resetBtn').addEventListener('click',()=>initialize(true));
    $$('.wizard-tab').forEach(btn=>btn.addEventListener('click',()=>setWizardStep(btn.dataset.step)));
    $('wizardBack').addEventListener('click',()=>setWizardStep(state.wizardStep-1));
    $('wizardNext').addEventListener('click',()=>state.wizardStep<3?setWizardStep(state.wizardStep+1):$('prehled').scrollIntoView({behavior:'smooth'}));
    $('yearInput').addEventListener('input',()=>{const y=validYear($('yearInput').value);if(y){state.year=y;state.selectedWeek=Math.min(state.selectedWeek,weeksInYear(y));renderResult();renderOverview();}});
    $$('[data-year-shift]').forEach(btn=>btn.addEventListener('click',()=>{state.year=Math.max(1900,Math.min(2100,state.year+Number(btn.dataset.yearShift)));$('yearInput').value=state.year;state.selectedWeek=Math.min(state.selectedWeek,weeksInYear(state.year));renderResult();renderOverview();}));
    document.querySelector('[data-year-current]').addEventListener('click',()=>{state.year=currentInfo().isoYear;$('yearInput').value=state.year;state.selectedWeek=currentInfo().week;renderResult();renderOverview();});
    $('weekNumberInput').addEventListener('input',()=>{const w=Number($('weekNumberInput').value);if(w>=1&&w<=weeksInYear(state.year)){state.selectedWeek=w;renderResult();renderOverview();}});
    $('advancedDateInput').addEventListener('input',()=>{const d=parseDate($('advancedDateInput').value);if(d){const i=isoInfo(d);state.year=i.isoYear;state.selectedWeek=i.week;$('yearInput').value=state.year;renderResult();renderOverview();}});
    ['parityFilter','quarterFilter','monthFilter'].forEach(id=>$(id).addEventListener('change',renderOverview));
    $('prevWeekBtn').addEventListener('click',()=>shiftSelectedWeek(-1)); $('nextWeekBtn').addEventListener('click',()=>shiftSelectedWeek(1));
    $('resultPrevWeek').addEventListener('click',()=>shiftSelectedWeek(-1)); $('resultNextWeek').addEventListener('click',()=>shiftSelectedWeek(1));
    $('resultToday').addEventListener('click',()=>{const t=currentInfo();state.selectedDate=t.selected;$('dateInput').value=inputValue(t.selected);setMode('basic');});
    $$('[data-overview-view]').forEach(btn=>btn.addEventListener('click',()=>setOverviewView(btn.dataset.overviewView)));
    $$('[data-view]').forEach(btn=>btn.addEventListener('click',()=>setOverviewView(btn.dataset.view)));
    $('copyResultBtn').addEventListener('click',e=>copyText(selectedText(),e.currentTarget));
    $('copyWeekBtn').addEventListener('click',e=>copyText(selectedText(),e.currentTarget));
    $('copyYearBtn').addEventListener('click',e=>copyText(yearText(),e.currentTarget));
    $('csvBtn').addEventListener('click',exportCsv); $('printBtn').addEventListener('click',()=>{setOverviewView('table');setTimeout(()=>window.print(),50)});
    $('shareResultBtn').addEventListener('click',async e=>{const data={title:'Číslo týdne',text:selectedText(),url:location.href};if(navigator.share){try{await navigator.share(data)}catch{}}else copyText(location.href,e.currentTarget)});
  }
  function shiftSelectedWeek(delta){const i=selectedInfo(), target=isoInfo(addDays(i.monday,delta*7));state.year=target.isoYear;state.selectedWeek=target.week;$('yearInput').value=state.year;state.mode='advanced';setMode('advanced',false);renderResult();renderOverview();}

  function initialize(reset=false) {
    const params=new URLSearchParams(location.search), today=todayUTC(), todayInfo=currentInfo();
    let date=parseDate(params.get('datum')) || today;
    let y=validYear(params.get('rok')) || todayInfo.isoYear;
    let w=Number(params.get('tyden')) || todayInfo.week;
    w=Math.max(1,Math.min(weeksInYear(y),w));
    state.selectedDate=date;state.year=y;state.selectedWeek=w;state.view='cards';state.wizardStep=1;
    $('dateInput').value=inputValue(date);$('advancedDateInput').value=inputValue(date);$('yearInput').value=y;$('weekNumberInput').value=w;
    $('parityFilter').value='all';$('quarterFilter').value='all';$('monthFilter').value='all';
    setWizardStep(1);setOverviewView('cards');setMode(params.has('rok')||params.has('tyden')?'advanced':'basic',false);
    renderHero();renderResult();renderOverview();renderQuickAnswers();
  }

  bind(); initialize();
})();