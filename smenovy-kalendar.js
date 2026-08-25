(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const DAY_MS = 86400000;
  const STORAGE_KEY = 'rv-shift-calendar-v1';
  const MIN_YEAR = 2000;
  const MAX_YEAR = 2100;

  const now = new Date();
  const today = utcDate(now.getFullYear(), now.getMonth(), now.getDate());
  const todayValue = dateValue(today);

  const shiftMeta = {
    R: { code: 'R', name: 'Ranní směna', short: 'ranní', className: 'shift-r', defaultStart: '06:00', defaultHours: 8 },
    O: { code: 'O', name: 'Odpolední směna', short: 'odpolední', className: 'shift-o', defaultStart: '14:00', defaultHours: 8 },
    N: { code: 'N', name: 'Noční směna', short: 'noční', className: 'shift-n', defaultStart: '22:00', defaultHours: 8 },
    D12: { code: 'D', name: 'Denní směna 12 h', short: 'denní 12 h', className: 'shift-d12', defaultStart: '06:00', defaultHours: 12 },
    N12: { code: 'N', name: 'Noční směna 12 h', short: 'noční 12 h', className: 'shift-n12', defaultStart: '18:00', defaultHours: 12 },
    S24: { code: '24', name: 'Služba 24 hodin', short: 'služba 24 h', className: 'shift-s24', defaultStart: '07:00', defaultHours: 24 },
    V: { code: 'V', name: 'Volno', short: 'volno', className: 'shift-v', defaultStart: '', defaultHours: 0 }
  };

  const presets = {
    weekday: { name: 'Ranní pondělí–pátek', cycle: ['R','R','R','R','R','V','V'] },
    '2224': { name: 'R–O–N 2–2–2–4', cycle: ['R','R','O','O','N','N','V','V','V','V'] },
    shortlong: { name: 'Krátký a dlouhý týden – denní', cycle: ['D12','D12','V','V','D12','D12','D12','V','V','D12','D12','V','V','V'] },
    shortlongdn: { name: 'Krátký/dlouhý – den a noc', cycle: ['D12','D12','V','V','D12','D12','D12','V','V','N12','N12','V','V','V','N12','N12','V','V','N12','N12','N12','V','V','D12','D12','V','V','V'] },
    fourfour: { name: 'Čtyři směny / čtyři volno', cycle: ['D12','D12','D12','D12','V','V','V','V','N12','N12','N12','N12','V','V','V','V'] },
    threeweek: { name: 'Třísměnný týdenní provoz', cycle: ['R','R','R','R','R','V','V','O','O','O','O','O','V','V','N','N','N','N','N','V','V'] },
    fire: { name: 'Služba 24/48', cycle: ['S24','V','V'] },
    custom: { name: 'Vlastní směnový cyklus', cycle: [] }
  };

  const monthFormatter = new Intl.DateTimeFormat('cs-CZ', { month: 'long', timeZone: 'UTC' });
  const dateLongFormatter = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const dateShortFormatter = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const weekdayFormatter = new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', timeZone: 'UTC' });
  const weekdayShortFormatter = new Intl.DateTimeFormat('cs-CZ', { weekday: 'short', timeZone: 'UTC' });

  const state = {
    year: today.getUTCFullYear(),
    preset: '2224',
    anchor: todayValue,
    phase: 0,
    customCycle: ['R','R','O','O','N','N','V','V','V','V'],
    selectedDate: todayValue,
    mobileMonth: today.getUTCMonth(),
    settings: {
      R: { start: '06:00', hours: 8 }, O: { start: '14:00', hours: 8 }, N: { start: '22:00', hours: 8 },
      D12: { start: '06:00', hours: 12 }, N12: { start: '18:00', hours: 12 }, S24: { start: '07:00', hours: 24 }
    },
    compare: { enabled: false, preset: 'shortlong', anchor: todayValue, phase: 0 }
  };
  let storageControl;

  function utcDate(year, month, day) { return new Date(Date.UTC(year, month, day)); }
  function addDays(date, amount) { return new Date(date.getTime() + amount * DAY_MS); }
  function pad(value) { return String(value).padStart(2, '0'); }
  function dateValue(date) { return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`; }
  function parseDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    const date = utcDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function mod(value, divisor) { return ((value % divisor) + divisor) % divisor; }
  function daysInMonth(year, month) { return utcDate(year, month + 1, 0).getUTCDate(); }
  function daysInYear(year) { return Math.round((utcDate(year + 1, 0, 1) - utcDate(year, 0, 1)) / DAY_MS); }
  function mondayIndex(date) { return (date.getUTCDay() + 6) % 7; }
  function validYear(value) { const year = Number(value); return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR ? year : null; }
  function formatNumber(value, maximumFractionDigits = 2) { return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits }).format(value); }
  function capitalize(value) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : value; }

  function isoInfo(date) {
    const selected = utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const monday = addDays(selected, -mondayIndex(selected));
    const thursday = addDays(monday, 3);
    const isoYear = thursday.getUTCFullYear();
    const jan4 = utcDate(isoYear, 0, 4);
    const firstMonday = addDays(jan4, -mondayIndex(jan4));
    return { isoYear, week: Math.floor((monday - firstMonday) / (7 * DAY_MS)) + 1 };
  }

  function easterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return utcDate(year, month, day);
  }

  function holidaysForYear(year) {
    const map = new Map();
    const add = (month, day, name) => map.set(`${year}-${pad(month)}-${pad(day)}`, name);
    add(1,1,'Nový rok / Den obnovy samostatného českého státu');
    const easter = easterSunday(year);
    map.set(dateValue(addDays(easter, -2)), 'Velký pátek');
    map.set(dateValue(addDays(easter, 1)), 'Velikonoční pondělí');
    add(5,1,'Svátek práce'); add(5,8,'Den vítězství'); add(7,5,'Den slovanských věrozvěstů Cyrila a Metoděje'); add(7,6,'Den upálení mistra Jana Husa');
    add(9,28,'Den české státnosti'); add(10,28,'Den vzniku samostatného československého státu'); add(11,17,'Den boje za svobodu a demokracii');
    add(12,24,'Štědrý den'); add(12,25,'1. svátek vánoční'); add(12,26,'2. svátek vánoční');
    return map;
  }

  function currentCycle(preset = state.preset) {
    if (preset === 'custom') return state.customCycle.length ? state.customCycle : ['V'];
    return presets[preset]?.cycle || presets['2224'].cycle;
  }

  function configForMain() { return { preset: state.preset, cycle: currentCycle(), anchor: state.anchor, phase: state.phase }; }
  function configForPartner() { return { preset: state.compare.preset, cycle: currentCycle(state.compare.preset), anchor: state.compare.anchor, phase: state.compare.phase }; }

  function shiftForDate(date, config) {
    const anchor = parseDate(config.anchor) || today;
    const cycle = config.cycle?.length ? config.cycle : ['V'];
    const diff = Math.round((date - anchor) / DAY_MS);
    const index = mod(Number(config.phase || 0) + diff, cycle.length);
    return { key: cycle[index], index };
  }

  function shiftDefinition(key) {
    const base = shiftMeta[key] || shiftMeta.V;
    if (key === 'V') return { ...base, start: '', hours: 0 };
    const values = state.settings[key] || { start: base.defaultStart, hours: base.defaultHours };
    const hours = Math.max(0, Math.min(36, Number(values.hours) || 0));
    return { ...base, start: values.start || base.defaultStart, hours };
  }

  function isWork(key) { return shiftDefinition(key).hours > 0 && key !== 'V'; }
  function isWeekend(date) { return date.getUTCDay() === 0 || date.getUTCDay() === 6; }
  function sameYear(date, year) { return date.getUTCFullYear() === year; }

  function shiftTimeText(key) {
    const shift = shiftDefinition(key);
    if (!isWork(key)) return 'Bez pracovní směny';
    const [hours, minutes] = shift.start.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const total = startMinutes + Math.round(shift.hours * 60);
    const endMinutes = mod(total, 1440);
    const end = `${pad(Math.floor(endMinutes / 60))}:${pad(endMinutes % 60)}`;
    const nextDay = total >= 1440 ? ' následující den' : '';
    return `${shift.start}–${end}${nextDay} · ${formatNumber(shift.hours)} placených hodin`;
  }

  function loadState() {
    let stored = null;
    if (storageControl.enabled()) {
      try { stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) { stored = null; }
    }
    if (stored && typeof stored === 'object') {
      if (validYear(stored.year)) state.year = Number(stored.year);
      if (presets[stored.preset]) state.preset = stored.preset;
      if (parseDate(stored.anchor)) state.anchor = stored.anchor;
      if (Number.isInteger(stored.phase)) state.phase = stored.phase;
      if (Array.isArray(stored.customCycle) && stored.customCycle.length && stored.customCycle.every((key) => shiftMeta[key])) state.customCycle = stored.customCycle.slice(0,42);
      if (stored.settings && typeof stored.settings === 'object') {
        Object.keys(state.settings).forEach((key) => {
          if (stored.settings[key]) state.settings[key] = { start: stored.settings[key].start || state.settings[key].start, hours: Number(stored.settings[key].hours ?? state.settings[key].hours) };
        });
      }
      if (stored.compare && typeof stored.compare === 'object') {
        state.compare.enabled = Boolean(stored.compare.enabled);
        if (presets[stored.compare.preset] && stored.compare.preset !== 'custom') state.compare.preset = stored.compare.preset;
        if (parseDate(stored.compare.anchor)) state.compare.anchor = stored.compare.anchor;
        if (Number.isInteger(stored.compare.phase)) state.compare.phase = stored.compare.phase;
      }
    }

    const params = new URLSearchParams(location.search);
    if (validYear(params.get('year'))) state.year = Number(params.get('year'));
    if (presets[params.get('preset')]) state.preset = params.get('preset');
    if (parseDate(params.get('anchor'))) state.anchor = params.get('anchor');
    if (/^\d+$/.test(params.get('phase') || '')) state.phase = Number(params.get('phase'));
    if (params.get('cycle')) {
      const cycle = params.get('cycle').split(',').filter((key) => shiftMeta[key]).slice(0,42);
      if (cycle.length) { state.customCycle = cycle; if (state.preset === 'custom') state.phase = mod(state.phase, cycle.length); }
    }
    if (params.get('compare') === '1') state.compare.enabled = true;
    if (presets[params.get('pPreset')] && params.get('pPreset') !== 'custom') state.compare.preset = params.get('pPreset');
    if (parseDate(params.get('pAnchor'))) state.compare.anchor = params.get('pAnchor');
    if (/^\d+$/.test(params.get('pPhase') || '')) state.compare.phase = Number(params.get('pPhase'));

    state.phase = mod(state.phase, currentCycle().length);
    state.compare.phase = mod(state.compare.phase, currentCycle(state.compare.preset).length);
    const selected = parseDate(state.selectedDate) || today;
    state.selectedDate = dateValue(sameYear(selected, state.year) ? selected : utcDate(state.year, 0, 1));
    state.mobileMonth = sameYear(today, state.year) ? today.getUTCMonth() : 0;
  }

  function saveState() {
    if (!storageControl.enabled()) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ year: state.year, preset: state.preset, anchor: state.anchor, phase: state.phase, customCycle: state.customCycle, settings: state.settings, compare: state.compare }));
    } catch (_) { /* local storage can be unavailable */ }
  }

  function renderPresetGrid() {
    $$('.preset-card').forEach((button) => {
      const active = button.dataset.preset === state.preset;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-checked', active ? 'true' : 'false');
    });
    $('customBuilder').hidden = state.preset !== 'custom';
  }

  function phaseOptionLabel(key, index) {
    const definition = shiftDefinition(key);
    return `${index + 1}. den cyklu — ${definition.name}`;
  }

  function renderPhaseOptions() {
    const cycle = currentCycle();
    state.phase = mod(state.phase, cycle.length);
    $('anchorPhase').innerHTML = cycle.map((key,index) => `<option value="${index}">${phaseOptionLabel(key,index)}</option>`).join('');
    $('anchorPhase').value = String(state.phase);
    $('cycleLengthLabel').textContent = `Cyklus: ${cycle.length} ${cycle.length === 1 ? 'den' : cycle.length < 5 ? 'dny' : 'dnů'}`;
  }

  function renderCyclePreview() {
    const cycle = currentCycle();
    $('cyclePreview').innerHTML = cycle.map((key,index) => {
      const shift = shiftDefinition(key);
      return `<button type="button" class="cycle-day ${shift.className}${index === state.phase ? ' is-selected' : ''}" data-phase="${index}" aria-label="${phaseOptionLabel(key,index)}"><small>${index + 1}</small>${shift.code}</button>`;
    }).join('');
  }

  function renderCustomSequence() {
    $('customSequence').innerHTML = state.customCycle.map((key,index) => {
      const shift = shiftDefinition(key);
      return `<button type="button" class="custom-token ${shift.className}" data-remove-index="${index}" title="Odebrat ${shift.name}"><small>${index + 1}</small>${shift.code}</button>`;
    }).join('');
  }

  function syncControls() {
    $('anchorDate').value = state.anchor;
    $('yearInput').value = state.year;
    $('calendarYearTitle').textContent = state.year;
    $('partnerPreset').value = state.compare.preset;
    $('partnerAnchor').value = state.compare.anchor;
    $('compareEnabled').checked = state.compare.enabled;
    $('compareConfig').hidden = !state.compare.enabled;
    $('sharedLegend').hidden = !state.compare.enabled;
    Object.entries(state.settings).forEach(([key, values]) => {
      const start = $(`start${key}`); const hours = $(`hours${key}`);
      if (start) start.value = values.start;
      if (hours) hours.value = values.hours;
    });
  }

  function renderTodayCard() {
    const result = shiftForDate(today, configForMain());
    const shift = shiftDefinition(result.key);
    const code = $('todayShiftCode');
    code.className = `today-code ${shift.className}`;
    code.textContent = shift.code;
    $('todayDateLabel').textContent = `Dnes · ${dateLongFormatter.format(today)}`;
    $('todayShiftName').textContent = shift.name;
    $('todayShiftTime').textContent = shiftTimeText(result.key) + ' · podle zvoleného cyklu';
    let nextDate = addDays(today, 1);
    let next = shiftForDate(nextDate, configForMain());
    for (let step = 1; step < 60 && next.key === result.key; step += 1) {
      nextDate = addDays(nextDate, 1);
      next = shiftForDate(nextDate, configForMain());
    }
    $('nextShiftLabel').textContent = `${weekdayShortFormatter.format(nextDate)} ${dateShortFormatter.format(nextDate)}: ${shiftDefinition(next.key).short}`;
  }

  function monthStats(year, month, config = configForMain()) {
    const stats = { shifts:0, hours:0, nights:0, weekends:0, holidays:0 };
    const holidays = holidaysForYear(year);
    for (let day = 1; day <= daysInMonth(year,month); day += 1) {
      const date = utcDate(year,month,day);
      const result = shiftForDate(date,config);
      const definition = shiftDefinition(result.key);
      if (isWork(result.key)) {
        stats.shifts += 1; stats.hours += definition.hours;
        if (result.key === 'N' || result.key === 'N12') stats.nights += 1;
        if (isWeekend(date)) stats.weekends += 1;
        if (holidays.has(dateValue(date))) stats.holidays += 1;
      }
    }
    return stats;
  }

  function isSharedFree(date) {
    if (!state.compare.enabled) return false;
    const first = shiftForDate(date, configForMain()).key;
    const second = shiftForDate(date, configForPartner()).key;
    return !isWork(first) && !isWork(second);
  }

  function renderCalendar() {
    const year = state.year;
    const holidays = holidaysForYear(year);
    const config = configForMain();
    $('calendarDescription').textContent = `${presets[state.preset].name} · cyklus ${config.cycle.length} dnů · kliknutím na den zobrazíte detail.`;
    const cards = [];
    for (let month = 0; month < 12; month += 1) {
      const first = utcDate(year,month,1);
      const leading = mondayIndex(first);
      const count = daysInMonth(year,month);
      const stats = monthStats(year,month,config);
      const cells = [];
      for (let i = 0; i < leading; i += 1) cells.push('<span class="day-cell is-empty" aria-hidden="true"></span>');
      for (let day = 1; day <= count; day += 1) {
        const date = utcDate(year,month,day);
        const value = dateValue(date);
        const result = shiftForDate(date,config);
        const shift = shiftDefinition(result.key);
        const holiday = holidays.get(value);
        const classes = ['day-cell',shift.className];
        if (isWeekend(date)) classes.push('is-weekend');
        if (holiday) classes.push('is-holiday');
        if (value === todayValue) classes.push('is-today');
        if (value === state.selectedDate) classes.push('is-selected');
        if (isSharedFree(date)) classes.push('is-shared-free');
        const aria = `${dateLongFormatter.format(date)}, ${shift.name}${holiday ? ', ' + holiday : ''}`;
        cells.push(`<button type="button" class="${classes.join(' ')}" data-date="${value}" aria-label="${aria}" title="${aria}"><span class="day-number">${day}</span><strong class="shift-code">${shift.code}</strong></button>`);
      }
      cards.push(`<article class="month-card${month === state.mobileMonth ? ' is-mobile-active' : ''}" data-month="${month}"><div class="month-head"><strong>${monthFormatter.format(first)}</strong><small>${stats.shifts} směn · ${formatNumber(stats.hours)} h</small></div><div class="month-weekdays" aria-hidden="true"><span>Po</span><span>Út</span><span>St</span><span>Čt</span><span>Pá</span><span>So</span><span>Ne</span></div><div class="month-days">${cells.join('')}</div></article>`);
    }
    $('calendarGrid').innerHTML = cards.join('');
    renderMobileMonthLabel();
  }

  function renderMobileMonthLabel() {
    $('mobileMonthLabel').textContent = `${capitalize(monthFormatter.format(utcDate(state.year,state.mobileMonth,1)))} ${state.year}`;
    $$('.month-card', $('calendarGrid')).forEach((card) => card.classList.toggle('is-mobile-active', Number(card.dataset.month) === state.mobileMonth));
  }

  function renderSelectedDay() {
    const date = parseDate(state.selectedDate) || utcDate(state.year,0,1);
    const result = shiftForDate(date,configForMain());
    const shift = shiftDefinition(result.key);
    const holiday = holidaysForYear(date.getUTCFullYear()).get(dateValue(date));
    const iso = isoInfo(date);
    $('selectedWeekday').textContent = capitalize(weekdayFormatter.format(date));
    $('selectedDate').textContent = dateLongFormatter.format(date);
    const meta = [`${iso.week}. kalendářní týden`, isWeekend(date) ? 'víkend' : 'pracovní den'];
    if (holiday) meta.push(holiday);
    $('selectedMeta').textContent = meta.join(' · ');
    const code = $('selectedShiftCode');
    code.className = `selected-shift-code ${shift.className}`;
    code.textContent = shift.code;
    $('selectedShiftName').textContent = shift.name;
    $('selectedShiftTime').textContent = shiftTimeText(result.key);
  }

  function computeYearStats() {
    const year = state.year;
    const holidays = holidaysForYear(year);
    const config = configForMain();
    const stats = { hours:0, shifts:0, freeDays:0, nights:0, weekends:0, holidayShifts:0, freeWeekends:0, longestWork:0, longestFree:0, months:[] };
    let workRun = 0; let freeRun = 0;
    for (let month = 0; month < 12; month += 1) stats.months.push(monthStats(year,month,config));
    for (let day = 0; day < daysInYear(year); day += 1) {
      const date = addDays(utcDate(year,0,1),day);
      const result = shiftForDate(date,config);
      const shift = shiftDefinition(result.key);
      if (isWork(result.key)) {
        stats.shifts += 1; stats.hours += shift.hours; workRun += 1; freeRun = 0;
        if (result.key === 'N' || result.key === 'N12') stats.nights += 1;
        if (isWeekend(date)) stats.weekends += 1;
        if (holidays.has(dateValue(date))) stats.holidayShifts += 1;
      } else {
        stats.freeDays += 1; freeRun += 1; workRun = 0;
      }
      stats.longestWork = Math.max(stats.longestWork,workRun);
      stats.longestFree = Math.max(stats.longestFree,freeRun);
    }
    for (let day = 0; day < daysInYear(year); day += 1) {
      const date = addDays(utcDate(year,0,1),day);
      if (date.getUTCDay() !== 6) continue;
      const sunday = addDays(date,1);
      if (!sameYear(sunday,year)) continue;
      if (!isWork(shiftForDate(date,config).key) && !isWork(shiftForDate(sunday,config).key)) stats.freeWeekends += 1;
    }
    return stats;
  }

  function renderStats() {
    const stats = computeYearStats();
    $('statHours').textContent = `${formatNumber(stats.hours)} h`;
    $('statAverage').textContent = `průměr ${formatNumber(stats.hours / (daysInYear(state.year) / 7),1)} h týdně`;
    $('statShifts').textContent = stats.shifts;
    $('statFreeDays').textContent = `${stats.freeDays} dnů volna`;
    $('statNights').textContent = stats.nights;
    $('statWeekends').textContent = stats.weekends;
    $('statFreeWeekends').textContent = `${stats.freeWeekends} celých volných víkendů`;
    $('statHolidays').textContent = stats.holidayShifts;
    $('statLongestWork').textContent = `${stats.longestWork} ${stats.longestWork === 1 ? 'den' : stats.longestWork < 5 ? 'dny' : 'dnů'}`;
    $('statLongestFree').textContent = `nejdelší volno ${stats.longestFree} ${stats.longestFree === 1 ? 'den' : stats.longestFree < 5 ? 'dny' : 'dnů'}`;
    $('monthlyTableBody').innerHTML = stats.months.map((month,index) => `<tr><td>${capitalize(monthFormatter.format(utcDate(state.year,index,1)))}</td><td>${month.shifts}</td><td>${formatNumber(month.hours)} h</td><td>${month.nights}</td><td>${month.weekends}</td><td>${month.holidays}</td></tr>`).join('');
  }

  function renderPartnerPhaseOptions() {
    const cycle = currentCycle(state.compare.preset);
    state.compare.phase = mod(state.compare.phase,cycle.length);
    $('partnerPhase').innerHTML = cycle.map((key,index) => `<option value="${index}">${phaseOptionLabel(key,index)}</option>`).join('');
    $('partnerPhase').value = state.compare.phase;
  }

  function renderCompare() {
    $('compareConfig').hidden = !state.compare.enabled;
    $('sharedLegend').hidden = !state.compare.enabled;
    if (!state.compare.enabled) return;
    const year = state.year;
    let sharedDays = 0; let longest = 0; let run = 0; let weekends = 0;
    const periods = [];
    for (let i = 0; i < daysInYear(year); i += 1) {
      const date = addDays(utcDate(year,0,1),i);
      if (isSharedFree(date)) { sharedDays += 1; run += 1; longest = Math.max(longest,run); } else run = 0;
      if (date.getUTCDay() === 6) {
        const sunday = addDays(date,1);
        if (sameYear(sunday,year) && isSharedFree(date) && isSharedFree(sunday)) {
          weekends += 1;
          if (periods.length < 8 && (year !== today.getUTCFullYear() || date >= addDays(today,-7))) periods.push(`${date.getUTCDate()}.–${sunday.getUTCDate()}. ${monthFormatter.format(sunday)}`);
        }
      }
    }
    if (!periods.length) {
      for (let i = 0; i < daysInYear(year) && periods.length < 8; i += 1) {
        const date = addDays(utcDate(year,0,1),i);
        if (date.getUTCDay() === 6 && isSharedFree(date) && isSharedFree(addDays(date,1))) periods.push(`${date.getUTCDate()}.–${addDays(date,1).getUTCDate()}. ${monthFormatter.format(addDays(date,1))}`);
      }
    }
    $('sharedDays').textContent = sharedDays;
    $('sharedWeekends').textContent = weekends;
    $('sharedLongest').textContent = `${longest} ${longest === 1 ? 'den' : longest < 5 ? 'dny' : 'dnů'}`;
    $('sharedPeriodList').innerHTML = periods.length ? periods.map((period) => `<span>${period}</span>`).join('') : '<span>V tomto roce nebyl nalezen celý společný volný víkend.</span>';
  }

  function renderAll({ save = true } = {}) {
    renderPresetGrid();
    renderCustomSequence();
    renderPhaseOptions();
    renderCyclePreview();
    renderPartnerPhaseOptions();
    syncControls();
    renderTodayCard();
    renderCalendar();
    renderSelectedDay();
    renderStats();
    renderCompare();
    if (save) saveState();
  }

  function setYear(year) {
    const valid = validYear(year);
    if (!valid) return;
    const selected = parseDate(state.selectedDate) || utcDate(state.year,0,1);
    const month = selected.getUTCMonth();
    const day = Math.min(selected.getUTCDate(),daysInMonth(valid,month));
    state.year = valid;
    state.selectedDate = dateValue(utcDate(valid,month,day));
    state.mobileMonth = month;
    renderAll();
  }

  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.hidden = true; }, 2600);
  }

  async function copyText(text, successMessage) {
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(text);
      else {
        const textarea = document.createElement('textarea');
        textarea.value = text; textarea.style.position = 'fixed'; textarea.style.opacity = '0';
        document.body.appendChild(textarea); textarea.select(); document.execCommand('copy'); textarea.remove();
      }
      showToast(successMessage);
    } catch (_) { showToast('Kopírování se nepodařilo. Označte text ručně.'); }
  }

  function buildShareUrl() {
    const base = location.protocol === 'file:' ? 'https://rychlevypocty.cz/smenovy-kalendar.html' : `${location.origin}${location.pathname}`;
    const params = new URLSearchParams({ year:String(state.year), preset:state.preset, anchor:state.anchor, phase:String(state.phase) });
    if (state.preset === 'custom') params.set('cycle',state.customCycle.join(','));
    if (state.compare.enabled) {
      params.set('compare','1'); params.set('pPreset',state.compare.preset); params.set('pAnchor',state.compare.anchor); params.set('pPhase',String(state.compare.phase));
    }
    return `${base}?${params.toString()}`;
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url),1000);
  }

  function csvEscape(value) { const text = String(value ?? ''); return /[;"\n]/.test(text) ? `"${text.replace(/"/g,'""')}"` : text; }

  function exportCsv() {
    const holidays = holidaysForYear(state.year);
    const rows = [['Datum','Den','ISO týden','Kód','Směna','Začátek','Placené hodiny','Víkend','Svátek']];
    for (let i = 0; i < daysInYear(state.year); i += 1) {
      const date = addDays(utcDate(state.year,0,1),i);
      const result = shiftForDate(date,configForMain());
      const shift = shiftDefinition(result.key);
      rows.push([dateValue(date),capitalize(weekdayFormatter.format(date)),isoInfo(date).week,shift.code,shift.name,shift.start,shift.hours,isWeekend(date)?'Ano':'Ne',holidays.get(dateValue(date)) || '']);
    }
    const csv = '\ufeff' + rows.map((row) => row.map(csvEscape).join(';')).join('\r\n');
    downloadBlob(new Blob([csv],{type:'text/csv;charset=utf-8'}),`smenovy-kalendar-${state.year}.csv`);
    showToast('CSV tabulka byla vytvořena.');
  }

  function icsEscape(value) { return String(value).replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;'); }
  function icsDateTime(date,time,hoursToAdd = 0) {
    const [h,m] = (time || '00:00').split(':').map(Number);
    const total = h * 60 + m + Math.round(hoursToAdd * 60);
    const shifted = addDays(date,Math.floor(total / 1440));
    const minutes = mod(total,1440);
    return `${dateValue(shifted).replace(/-/g,'')}T${pad(Math.floor(minutes/60))}${pad(minutes%60)}00`;
  }

  function exportIcs() {
    const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//RychleVypocty.cz//Smenovy kalendar//CS','CALSCALE:GREGORIAN','METHOD:PUBLISH',`X-WR-CALNAME:${icsEscape(`Směny ${state.year}`)}`];
    const holidays = holidaysForYear(state.year);
    for (let i = 0; i < daysInYear(state.year); i += 1) {
      const date = addDays(utcDate(state.year,0,1),i);
      const result = shiftForDate(date,configForMain());
      if (!isWork(result.key)) continue;
      const shift = shiftDefinition(result.key);
      const value = dateValue(date);
      lines.push('BEGIN:VEVENT',`UID:${value}-${result.key}-${state.phase}@rychlevypocty.cz`,`DTSTAMP:${dateValue(today).replace(/-/g,'')}T000000Z`,`DTSTART:${icsDateTime(date,shift.start)}`,`DTEND:${icsDateTime(date,shift.start,shift.hours)}`,`SUMMARY:${icsEscape(shift.name)}`,`DESCRIPTION:${icsEscape(`${shiftTimeText(result.key)}${holidays.get(value) ? ' · ' + holidays.get(value) : ''} · vytvořeno na RychléVýpočty.cz`)}`,'END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    downloadBlob(new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'}),`smeny-${state.year}.ics`);
    showToast('Kalendář ICS byl vytvořen.');
  }

  function ascii(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[–—]/g,'-').replace(/[^\x20-\x7E]/g,''); }
  function pdfEsc(value) { return ascii(value).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)'); }
  function pdfText(commands,x,y,size,text,bold=false,color='0 0 0') { commands.push('BT',`${color} rg`, `/${bold?'F2':'F1'} ${size} Tf`, `${x.toFixed(1)} ${y.toFixed(1)} Td`, `(${pdfEsc(text)}) Tj`,'ET'); }
  function pdfRect(commands,x,y,w,h,color,stroke=null) { commands.push('q',`${color} rg`,`${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re f`); if(stroke){commands.push(`${stroke} RG`,`${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)} re S`);} commands.push('Q'); }

  function pdfPage(monthA,monthB,pageNumber,totalPages) {
    const commands = [];
    pdfRect(commands,0,0,842,595,'1 1 1');
    pdfText(commands,35,566,17,`Smenovy kalendar ${state.year}`,true,'0.04 0.12 0.23');
    pdfText(commands,650,568,8,`Strana ${pageNumber}/${totalPages}`,false,'0.35 0.43 0.52');
    const drawMonth = (month,x) => {
      const stats = monthStats(state.year,month,configForMain());
      pdfText(commands,x,535,13,`${capitalize(monthFormatter.format(utcDate(state.year,month,1)))} ${state.year}`,true,'0.04 0.12 0.23');
      pdfText(commands,x+205,536,7,`${stats.shifts} smen / ${formatNumber(stats.hours)} h`,false,'0.35 0.43 0.52');
      const cellW = 52.5; const cellH = 57; const gridTop = 500;
      ['Po','Ut','St','Ct','Pa','So','Ne'].forEach((day,index) => pdfText(commands,x+index*cellW+20,508,7,day,true,'0.4 0.48 0.57'));
      const leading = mondayIndex(utcDate(state.year,month,1));
      const holidays = holidaysForYear(state.year);
      for (let day = 1; day <= daysInMonth(state.year,month); day += 1) {
        const date = utcDate(state.year,month,day);
        const position = leading + day - 1;
        const col = position % 7; const row = Math.floor(position / 7);
        const cx = x + col*cellW; const cy = gridTop - (row+1)*cellH;
        const result = shiftForDate(date,configForMain());
        const colors = {R:'0.07 0.40 0.84',O:'0.95 0.60 0.24',N:'0.45 0.34 0.85',D12:'0.13 0.63 0.41',N12:'0.24 0.31 0.72',S24:'0.89 0.35 0.35',V:'0.90 0.93 0.95'};
        pdfRect(commands,cx,cy,cellW-2,cellH-2,colors[result.key] || colors.V);
        const dark = result.key === 'V';
        pdfText(commands,cx+4,cy+cellH-13,7,String(day),true,dark?'0.28 0.37 0.45':'1 1 1');
        pdfText(commands,cx+20,cy+17,10,shiftDefinition(result.key).code,true,dark?'0.28 0.37 0.45':'1 1 1');
        if (holidays.has(dateValue(date))) pdfRect(commands,cx+cellW-10,cy+cellH-10,5,5,'0.95 0.18 0.18');
      }
    };
    drawMonth(monthA,35); drawMonth(monthB,435);
    pdfText(commands,35,84,7,'Legenda: R ranni | O odpoledni | N nocni | D denni 12 h | 24 sluzba | V volno',false,'0.32 0.4 0.48');
    pdfText(commands,35,67,7,`${ascii(presets[state.preset].name)} | Referencni datum ${state.anchor} | Pozice cyklu ${state.phase+1}`,false,'0.32 0.4 0.48');
    pdfText(commands,35,50,7,'Planovaci pomucka. Rozhodujici je aktualni rozpis zamestnavatele.',false,'0.45 0.5 0.56');
    pdfText(commands,650,50,7,'RychleVypocty.cz',true,'0.07 0.40 0.84');
    return commands.join('\n');
  }

  function makePdf() {
    const pageCount = 6;
    const objects = new Array(17);
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Kids [${Array.from({length:pageCount},(_,i)=>`${i+3} 0 R`).join(' ')}] /Count ${pageCount} >>`;
    for (let i = 0; i < pageCount; i += 1) {
      objects[i+3] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 15 0 R /F2 16 0 R >> >> /Contents ${i+9} 0 R >>`;
      const stream = pdfPage(i*2,i*2+1,i+1,pageCount);
      objects[i+9] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    }
    objects[15] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
    objects[16] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
    let pdf = '%PDF-1.4\n'; const offsets = new Array(objects.length).fill(0);
    for (let i = 1; i < objects.length; i += 1) { offsets[i] = pdf.length; pdf += `${i} 0 obj\n${objects[i]}\nendobj\n`; }
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let i = 1; i < objects.length; i += 1) pdf += `${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Blob([new TextEncoder().encode(pdf)],{type:'application/pdf'});
  }

  function exportPdf() { downloadBlob(makePdf(),`smenovy-kalendar-${state.year}.pdf`); showToast('PDF kalendář byl vytvořen.'); }

  function copySelectedDay() {
    const date = parseDate(state.selectedDate);
    const result = shiftForDate(date,configForMain());
    const shift = shiftDefinition(result.key);
    const holiday = holidaysForYear(date.getUTCFullYear()).get(dateValue(date));
    copyText(`${capitalize(weekdayFormatter.format(date))} ${dateLongFormatter.format(date)} — ${shift.name}, ${shiftTimeText(result.key)}${holiday ? ', ' + holiday : ''}`,'Vybraný den byl zkopírován.');
  }

  function copyYear() {
    const lines = [`Směnový kalendář ${state.year} — ${presets[state.preset].name}`];
    for (let i = 0; i < daysInYear(state.year); i += 1) {
      const date = addDays(utcDate(state.year,0,1),i);
      const shift = shiftDefinition(shiftForDate(date,configForMain()).key);
      lines.push(`${dateValue(date)} ${weekdayShortFormatter.format(date)}: ${shift.code} — ${shift.name}`);
    }
    copyText(lines.join('\n'),'Roční přehled byl zkopírován.');
  }

  function bindEvents() {
    $('presetGrid').addEventListener('click',(event) => {
      const button = event.target.closest('[data-preset]'); if (!button) return;
      state.preset = button.dataset.preset; state.phase = 0; renderAll();
    });
    $('anchorDate').addEventListener('change',(event) => { if (parseDate(event.target.value)) { state.anchor = event.target.value; renderAll(); } });
    $('anchorPhase').addEventListener('change',(event) => { state.phase = Number(event.target.value); renderAll(); });
    $('cyclePreview').addEventListener('click',(event) => { const button = event.target.closest('[data-phase]'); if(button){state.phase=Number(button.dataset.phase);renderAll();} });
    $('customBuilder').addEventListener('click',(event) => {
      const add = event.target.closest('[data-add-shift]');
      if (add && state.customCycle.length < 42) { state.customCycle.push(add.dataset.addShift); renderAll(); return; }
      const remove = event.target.closest('[data-remove-index]');
      if (remove) {
        if (state.customCycle.length <= 1) { showToast('Cyklus musí obsahovat alespoň jeden den.'); return; }
        state.customCycle.splice(Number(remove.dataset.removeIndex),1); state.phase = mod(state.phase,state.customCycle.length); renderAll();
      }
    });
    $('resetCustomBtn').addEventListener('click',() => { state.customCycle=['R','R','O','O','N','N','V','V','V','V']; state.phase=0; renderAll(); });
    $('resetCalendarBtn').addEventListener('click',() => { storageControl.disable(); location.replace(location.pathname); });
    $('prevYearBtn').addEventListener('click',() => setYear(state.year-1)); $('nextYearBtn').addEventListener('click',() => setYear(state.year+1));
    $('yearInput').addEventListener('change',(event) => setYear(event.target.value));
    $('todayBtn').addEventListener('click',() => { state.year=today.getUTCFullYear();state.selectedDate=todayValue;state.mobileMonth=today.getUTCMonth();renderAll(); });
    $('todayCardButton').addEventListener('click',() => { state.year=today.getUTCFullYear();state.selectedDate=todayValue;state.mobileMonth=today.getUTCMonth();renderAll();$('kalendar').scrollIntoView({behavior:'smooth'}); });
    $('prevMonthBtn').addEventListener('click',() => { if(state.mobileMonth===0){setYear(state.year-1);state.mobileMonth=11;}else state.mobileMonth-=1;renderMobileMonthLabel(); });
    $('nextMonthBtn').addEventListener('click',() => { if(state.mobileMonth===11){setYear(state.year+1);state.mobileMonth=0;}else state.mobileMonth+=1;renderMobileMonthLabel(); });
    $('calendarGrid').addEventListener('click',(event) => { const button=event.target.closest('[data-date]');if(!button)return;state.selectedDate=button.dataset.date;state.mobileMonth=parseDate(state.selectedDate).getUTCMonth();renderCalendar();renderSelectedDay(); });
    $('copyDayBtn').addEventListener('click',copySelectedDay);
    $('setAnchorBtn').addEventListener('click',() => { const date=parseDate(state.selectedDate);const current=shiftForDate(date,configForMain());state.anchor=state.selectedDate;state.phase=current.index;renderAll();$('nastaveni').scrollIntoView({behavior:'smooth'});showToast('Vybraný den je nyní referenčním datem.'); });
    $('shareBtn').addEventListener('click',() => copyText(buildShareUrl(),'Odkaz na stejný rozpis byl zkopírován.'));
    $('copyYearBtn').addEventListener('click',copyYear); $('csvBtn').addEventListener('click',exportCsv); $('icsBtn').addEventListener('click',exportIcs); $('pdfBtn').addEventListener('click',exportPdf); $('printBtn').addEventListener('click',() => window.print());
    $('toggleMonthlyBtn').addEventListener('click',() => { const wrap=$('monthlyTableWrap');wrap.hidden=!wrap.hidden;$('toggleMonthlyBtn').setAttribute('aria-expanded',String(!wrap.hidden));$('toggleMonthlyBtn').textContent=wrap.hidden?'Zobrazit tabulku':'Skrýt tabulku'; });
    ['R','O','N','D12','N12','S24'].forEach((key) => {
      $(`start${key}`).addEventListener('change',(event) => { state.settings[key].start=event.target.value;renderAll(); });
      $(`hours${key}`).addEventListener('change',(event) => { state.settings[key].hours=Math.max(0,Math.min(36,Number(event.target.value)||0));renderAll(); });
    });
    $('compareEnabled').addEventListener('change',(event) => { state.compare.enabled=event.target.checked;renderAll(); });
    $('partnerPreset').addEventListener('change',(event) => { state.compare.preset=event.target.value;state.compare.phase=0;renderAll(); });
    $('partnerAnchor').addEventListener('change',(event) => { if(parseDate(event.target.value)){state.compare.anchor=event.target.value;renderAll();} });
    $('partnerPhase').addEventListener('change',(event) => { state.compare.phase=Number(event.target.value);renderAll(); });
  }

  storageControl = window.RVStorageChoice.create({ scope:'shiftCalendar', dataKey:STORAGE_KEY, inputId:'rememberShiftSettings', statusId:'shiftStorageStatus', onEnable:saveState });
  loadState();
  bindEvents();
  renderAll({save:false});
})();
