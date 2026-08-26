(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const DAY = 86400000;
  const pad = (n) => String(n).padStart(2, "0");
  const mod = (n, m) => ((n % m) + m) % m;
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const dateLong = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const dateShort = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "numeric", timeZone: "UTC" });
  const weekdayShort = new Intl.DateTimeFormat("cs-CZ", { weekday: "short", timeZone: "UTC" });
  const weekdayLong = new Intl.DateTimeFormat("cs-CZ", { weekday: "long", timeZone: "UTC" });
  const monthLong = new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric", timeZone: "UTC" });
  const monthNames = ["Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen","Listopad","Prosinec"];

  const shiftTypes = {
    R:   { code: "R", name: "Ranní směna", short: "Ranní", className: "s-r", start: "06:00", hours: 8, night: false },
    O:   { code: "O", name: "Odpolední směna", short: "Odpolední", className: "s-o", start: "14:00", hours: 8, night: false },
    N:   { code: "N", name: "Noční směna", short: "Noční", className: "s-n", start: "22:00", hours: 8, night: true },
    D12: { code: "D", name: "12 h denní", short: "12 h den", className: "s-d12", start: "06:00", hours: 12, night: false },
    N12: { code: "N", name: "12 h noční", short: "12 h noc", className: "s-n12", start: "18:00", hours: 12, night: true },
    H24: { code: "24", name: "24 h směna", short: "24 h", className: "s-h24", start: "08:00", hours: 24, night: true },
    V:   { code: "V", name: "Volno", short: "Volno", className: "s-v", start: "", hours: 0, night: false }
  };

  const presets = {
    "2224": { label: "2–2–2–4", cycle: ["R","R","O","O","N","N","V","V","V","V"] },
    "12rot": { label: "2D · 2N · 4V", cycle: ["D12","D12","N12","N12","V","V","V","V"] },
    "shortlong": { label: "Krátký / dlouhý", cycle: ["D12","D12","V","V","D12","D12","D12","V","V","D12","D12","V","V","V"] },
    "2448": { label: "24 / 48", cycle: ["H24","V","V"] },
    "three8": { label: "5R · 2V · 5O · 2V · 5N · 2V", cycle: ["R","R","R","R","R","V","V","O","O","O","O","O","V","V","N","N","N","N","N","V","V"] },
    "custom": { label: "Vlastní cyklus", cycle: [] }
  };

  const localToday = new Date();
  const today = new Date(Date.UTC(localToday.getFullYear(), localToday.getMonth(), localToday.getDate()));
  const valueOfDate = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth()+1)}-${pad(d.getUTCDate())}`;
  const parseDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const [y,m,d] = value.split("-").map(Number);
    const x = new Date(Date.UTC(y,m-1,d));
    return x.getUTCFullYear() === y && x.getUTCMonth() === m-1 && x.getUTCDate() === d ? x : null;
  };
  const addDays = (date, amount) => new Date(date.getTime() + amount * DAY);
  const daysDiff = (from, to) => Math.round((to.getTime() - from.getTime()) / DAY);
  const daysInMonth = (year, month) => new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const mondayIndex = (date) => (date.getUTCDay() + 6) % 7;
  const isWeekend = (date) => date.getUTCDay() === 0 || date.getUTCDay() === 6;

  function easterSunday(year) {
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3), h = (19*a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2*e + 2*i - h - k) % 7;
    const m = Math.floor((a + 11*h + 22*l) / 451);
    const month = Math.floor((h + l - 7*m + 114) / 31) - 1;
    const day = ((h + l - 7*m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month, day));
  }

  function holidaysForYear(year) {
    const map = new Map();
    const add = (month, day, label) => map.set(`${year}-${pad(month)}-${pad(day)}`, label);
    add(1,1,"Nový rok / Den obnovy samostatného českého státu");
    const easter = easterSunday(year);
    map.set(valueOfDate(addDays(easter,-2)), "Velký pátek");
    map.set(valueOfDate(addDays(easter,1)), "Velikonoční pondělí");
    add(5,1,"Svátek práce"); add(5,8,"Den vítězství"); add(7,5,"Den slovanských věrozvěstů Cyrila a Metoděje"); add(7,6,"Den upálení mistra Jana Husa");
    add(9,28,"Den české státnosti"); add(10,28,"Den vzniku samostatného československého státu"); add(11,17,"Den boje za svobodu a demokracii");
    add(12,24,"Štědrý den"); add(12,25,"1. svátek vánoční"); add(12,26,"2. svátek vánoční");
    return map;
  }

  const state = {
    year: today.getUTCFullYear(),
    month: today.getUTCMonth(),
    preset: "2224",
    anchor: valueOfDate(today),
    phase: 0,
    customCycle: [...presets["2224"].cycle],
    selectedDate: valueOfDate(today),
    settings: Object.fromEntries(Object.entries(shiftTypes).filter(([k]) => k !== "V").map(([k,v]) => [k,{ start:v.start, hours:v.hours }]))
  };

  function cycle() {
    if (state.preset === "custom") return state.customCycle.length ? state.customCycle : ["V"];
    return presets[state.preset].cycle;
  }

  function shiftDef(key) {
    const base = shiftTypes[key] || shiftTypes.V;
    if (key === "V") return base;
    const custom = state.settings[key] || {};
    return { ...base, start: custom.start || base.start, hours: Math.max(0, Math.min(24, Number(custom.hours ?? base.hours) || 0)) };
  }

  function shiftAt(date) {
    const anchor = parseDate(state.anchor) || today;
    const list = cycle();
    const index = mod(state.phase + daysDiff(anchor, date), list.length);
    const key = list[index];
    return { key, index, def: shiftDef(key) };
  }

  function isWorkKey(key) { return key !== "V" && shiftDef(key).hours > 0; }

  function shiftTime(key) {
    const def = shiftDef(key);
    if (!isWorkKey(key)) return "Bez pracovní směny";
    const [h,m] = def.start.split(":").map(Number);
    const startMinutes = h*60 + m;
    const total = startMinutes + Math.round(def.hours*60);
    const end = mod(total,1440);
    const endText = `${pad(Math.floor(end/60))}:${pad(end%60)}`;
    return `${def.start}–${endText}${total >= 1440 ? " (+1 den)" : ""} · ${nf.format(def.hours)} h`;
  }

  function setText(id, text) { const el = $(id); if (el) el.textContent = text; }

  function populateYears() {
    const select = $("yearSelect");
    const start = today.getUTCFullYear() - 2;
    const end = today.getUTCFullYear() + 9;
    select.innerHTML = "";
    for (let year = start; year <= end; year++) {
      const option = document.createElement("option");
      option.value = year; option.textContent = year;
      select.append(option);
    }
    select.value = String(state.year);
  }

  function renderPresetButtons() {
    $$("#presetGrid [data-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.preset === state.preset));
    });
    $("customDetails").open = state.preset === "custom";
  }

  function renderPhaseGrid() {
    const list = cycle();
    state.phase = mod(state.phase, list.length);
    $("phaseGrid").innerHTML = list.map((key,index) => {
      const def = shiftDef(key);
      return `<button type="button" class="shift62-phase-day ${def.className}" data-phase="${index}" aria-pressed="${index === state.phase}"><small>${index+1}. den</small><b>${def.code}</b></button>`;
    }).join("");
  }

  function renderCustomBuilder() {
    const keys = ["R","O","N","D12","N12","H24","V"];
    $("customAdd").innerHTML = keys.map((key) => `<button type="button" data-add-shift="${key}">${shiftTypes[key].short}</button>`).join("");
    $("customCycle").innerHTML = state.customCycle.map((key,index) => {
      const def = shiftDef(key);
      return `<button type="button" class="shift62-custom-token ${def.className}" data-remove-shift="${index}" title="Odebrat ${def.name}" aria-label="Odebrat ${index+1}. den: ${def.name}">${def.code}</button>`;
    }).join("");
  }

  function renderSettings() {
    const keys = ["R","O","N","D12","N12","H24"];
    $("shiftSettings").innerHTML = keys.map((key) => {
      const def = shiftDef(key);
      return `<div class="shift62-setting"><span>${def.name}</span><label><span>Začátek</span><input type="time" data-setting-start="${key}" value="${def.start}"></label><label><span>Hodin</span><input type="number" inputmode="decimal" min="0" max="24" step="0.5" data-setting-hours="${key}" value="${state.settings[key].hours}"></label></div>`;
    }).join("");
  }

  function syncBasicControls() {
    $("anchorDate").value = state.anchor;
    $("yearSelect").value = String(state.year);
  }

  function findNextChange(startDate) {
    const current = shiftAt(startDate).key;
    for (let i=1; i<=60; i++) {
      const d = addDays(startDate,i);
      const next = shiftAt(d);
      if (next.key !== current) return { date:d, ...next };
    }
    return null;
  }

  function renderHero() {
    const now = shiftAt(today);
    const list = cycle();
    setText("heroPreset", presets[state.preset].label);
    setText("heroDate", `DNES · ${dateShort.format(today)}`);
    setText("heroShiftCode", now.def.code);
    setText("heroShiftName", now.def.name);
    setText("heroShiftTime", shiftTime(now.key));
    setText("heroLength", `${list.length} ${list.length === 1 ? "den" : list.length < 5 ? "dny" : "dní"}`);
    const next = findNextChange(today);
    setText("heroNext", next ? `${weekdayShort.format(next.date)} ${dateShort.format(next.date)} · ${next.def.short}` : "—");
    const max = Math.min(list.length,12);
    $("heroCycle").innerHTML = list.slice(0,max).map((key,index) => {
      const def = shiftDef(key);
      const absoluteIndex = mod(state.phase + daysDiff(parseDate(state.anchor)||today, today), list.length);
      return `<span class="shift62-cycle-dot ${def.className}${index===absoluteIndex ? " is-current" : ""}" title="${def.name}">${def.code}</span>`;
    }).join("") + (list.length > max ? `<span class="shift62-cycle-dot">+${list.length-max}</span>` : "");
  }

  function renderNow() {
    const result = shiftAt(today);
    const badge = $("todayBadge");
    badge.className = `shift62-now-badge ${result.def.className}`;
    badge.textContent = result.def.code;
    setText("todayLabel", `Dnes · ${dateLong.format(today)}`);
    setText("todayName", result.def.name);
    setText("todayTime", shiftTime(result.key));
    const holiday = holidaysForYear(today.getUTCFullYear()).get(valueOfDate(today));
    $("todayHoliday").hidden = !holiday;
    if (holiday) setText("todayHoliday", `Dnes je ${holiday}. Směna zůstává podle vašeho turnusu.`);
    $("weekStrip").innerHTML = Array.from({length:7},(_,i) => {
      const d = addDays(today,i);
      const s = shiftAt(d);
      return `<div class="shift62-week-day${i===0?" is-today":""}"><span>${weekdayShort.format(d)}</span><b class="${s.def.className}" style="padding:3px 7px;border-radius:7px">${s.def.code}</b><small>${dateShort.format(d)}</small></div>`;
    }).join("");
  }

  function monthStats(year, month) {
    const holidays = holidaysForYear(year);
    let shifts=0,hours=0,nights=0,weekends=0,holidayShifts=0;
    for (let day=1; day<=daysInMonth(year,month); day++) {
      const d = new Date(Date.UTC(year,month,day));
      const s = shiftAt(d);
      if (isWorkKey(s.key)) {
        shifts++; hours += s.def.hours;
        if (s.def.night) nights++;
        if (isWeekend(d)) weekends++;
        if (holidays.has(valueOfDate(d))) holidayShifts++;
      }
    }
    return {shifts,hours,nights,weekends,holidayShifts};
  }

  function renderMonth() {
    const year = state.year, month = state.month;
    const total = daysInMonth(year,month);
    const first = new Date(Date.UTC(year,month,1));
    const leading = mondayIndex(first);
    const holidays = holidaysForYear(year);
    setText("monthTitle", monthLong.format(first));
    const stats = monthStats(year,month);
    setText("monthSubtitle", `${stats.shifts} směn · ${nf.format(stats.hours)} h · ${stats.holidayShifts} směn ve svátek`);
    const cells = [];
    for (let i=0;i<leading;i++) cells.push(`<span class="shift62-day is-empty" aria-hidden="true"></span>`);
    for (let day=1;day<=total;day++) {
      const d = new Date(Date.UTC(year,month,day));
      const value = valueOfDate(d);
      const s = shiftAt(d);
      const holiday = holidays.get(value);
      const classes = ["shift62-day"];
      if (value === valueOfDate(today)) classes.push("is-today");
      if (isWeekend(d)) classes.push("is-weekend");
      if (holiday) classes.push("is-holiday");
      const aria = `${dateLong.format(d)}, ${s.def.name}${holiday ? `, ${holiday}` : ""}`;
      cells.push(`<button type="button" class="${classes.join(" ")}" data-date="${value}" aria-label="${aria.replace(/"/g,"&quot;")}"><span class="shift62-day-no">${day}${holiday?"<i></i>":""}</span><b class="shift62-day-code ${s.def.className}">${s.def.code}</b><span class="shift62-day-name">${s.def.short}</span></button>`);
    }
    $("monthGrid").innerHTML = cells.join("");
    let selected = parseDate(state.selectedDate);
    if (!selected || selected.getUTCFullYear() !== year || selected.getUTCMonth() !== month) {
      selected = year===today.getUTCFullYear() && month===today.getUTCMonth() ? today : new Date(Date.UTC(year,month,1));
      state.selectedDate = valueOfDate(selected);
    }
    renderDayDetail(selected);
  }

  function renderDayDetail(date) {
    state.selectedDate = valueOfDate(date);
    const s = shiftAt(date);
    const holiday = holidaysForYear(date.getUTCFullYear()).get(valueOfDate(date));
    setText("detailDate", `${weekdayLong.format(date)} · ${dateLong.format(date)}`);
    const code = $("detailCode"); code.className = s.def.className; code.textContent = s.def.code;
    setText("detailName", s.def.name); setText("detailTime", shiftTime(s.key));
    setText("detailPhase", `${s.index+1}. / ${cycle().length}. den`);
    setText("detailDayType", holiday ? "svátek" : isWeekend(date) ? "víkend" : "běžný den");
    setText("detailHoliday", holiday ? `${holiday}. Kalendář směnu nemění; svátek je pouze informační vrstva.` : isWeekend(date) ? "Víkend nemění pořadí cyklu. Směna zůstává podle turnusu." : "Běžný kalendářní den bez českého svátku.");
    $$("#monthGrid [data-date]").forEach(btn => btn.classList.toggle("is-selected",btn.dataset.date===state.selectedDate));
  }

  function yearStats(year) {
    const holidays = holidaysForYear(year);
    let shifts=0,hours=0,nights=0,weekends=0,holidayShifts=0;
    const end = new Date(Date.UTC(year,11,31));
    for (let d=new Date(Date.UTC(year,0,1)); d<=end; d=addDays(d,1)) {
      const s = shiftAt(d);
      if (!isWorkKey(s.key)) continue;
      shifts++; hours += s.def.hours;
      if (s.def.night) nights++;
      if (isWeekend(d)) weekends++;
      if (holidays.has(valueOfDate(d))) holidayShifts++;
    }
    return {shifts,hours,nights,weekends,holidayShifts};
  }

  function renderYear() {
    const stats = yearStats(state.year);
    setText("statShifts", nf.format(stats.shifts)); setText("statHours", nf.format(stats.hours)); setText("statNights", nf.format(stats.nights)); setText("statWeekends", nf.format(stats.weekends)); setText("statHolidays", nf.format(stats.holidayShifts));
    const holidays = holidaysForYear(state.year);
    $("yearRhythm").innerHTML = monthNames.map((name,month) => {
      const dim = daysInMonth(state.year,month);
      const days = Array.from({length:31},(_,index) => {
        const day = index+1;
        if (day>dim) return `<i class="shift62-year-day is-none"></i>`;
        const d = new Date(Date.UTC(state.year,month,day)); const s = shiftAt(d);
        const classes = ["shift62-year-day",s.def.className];
        if (isWeekend(d)) classes.push("is-weekend"); if (holidays.has(valueOfDate(d))) classes.push("is-holiday");
        return `<i class="${classes.join(" ")}" title="${day}. ${month+1}. · ${s.def.short}"></i>`;
      }).join("");
      return `<div class="shift62-year-row"><span>${name}</span><div class="shift62-year-days">${days}</div></div>`;
    }).join("");
  }

  function renderAll() {
    state.phase = mod(state.phase, cycle().length);
    renderPresetButtons(); renderPhaseGrid(); renderCustomBuilder(); renderSettings(); syncBasicControls(); renderHero(); renderNow(); renderMonth(); renderYear();
  }

  function resetState() {
    state.year = today.getUTCFullYear(); state.month = today.getUTCMonth(); state.preset = "2224"; state.anchor = valueOfDate(today); state.phase = 0; state.customCycle = [...presets["2224"].cycle]; state.selectedDate = valueOfDate(today);
    state.settings = Object.fromEntries(Object.entries(shiftTypes).filter(([k]) => k !== "V").map(([k,v]) => [k,{ start:v.start, hours:v.hours }]));
    populateYears(); renderAll();
  }

  function shareUrl() {
    const url = new URL(location.origin + location.pathname);
    url.searchParams.set("y",state.year); url.searchParams.set("p",state.preset); url.searchParams.set("a",state.anchor); url.searchParams.set("ph",state.phase);
    if (state.preset === "custom") url.searchParams.set("c",state.customCycle.join(","));
    Object.entries(state.settings).forEach(([key,val]) => {
      const base = shiftTypes[key];
      if (val.start !== base.start || Number(val.hours) !== base.hours) url.searchParams.set(`t${key}`,`${val.start},${val.hours}`);
    });
    return url.toString();
  }

  function readUrl() {
    const q = new URLSearchParams(location.search);
    const y = Number(q.get("y"));
    if (Number.isInteger(y) && y >= today.getUTCFullYear()-5 && y <= today.getUTCFullYear()+15) state.year = y;
    if (presets[q.get("p")]) state.preset = q.get("p");
    if (parseDate(q.get("a"))) state.anchor = q.get("a");
    if (/^\d+$/.test(q.get("ph") || "")) state.phase = Number(q.get("ph"));
    if (q.get("c")) {
      const list = q.get("c").split(",").filter(k => shiftTypes[k]).slice(0,42);
      if (list.length) state.customCycle = list;
    }
    Object.keys(state.settings).forEach((key) => {
      const raw = q.get(`t${key}`); if (!raw) return;
      const [start,hours] = raw.split(",");
      if (/^\d{2}:\d{2}$/.test(start || "")) state.settings[key].start = start;
      const h = Number(hours); if (Number.isFinite(h) && h >=0 && h<=24) state.settings[key].hours = h;
    });
    state.month = state.year === today.getUTCFullYear() ? today.getUTCMonth() : 0;
  }

  function csvRows() {
    const rows = [["Datum","Den","Směna","Kód","Začátek","Hodiny","Víkend","Svátek"]];
    const holidays = holidaysForYear(state.year);
    for (let d=new Date(Date.UTC(state.year,0,1)); d.getUTCFullYear()===state.year; d=addDays(d,1)) {
      const s=shiftAt(d); const h=holidays.get(valueOfDate(d)) || "";
      rows.push([valueOfDate(d),weekdayLong.format(d),s.def.name,s.def.code,s.def.start || "",String(s.def.hours),isWeekend(d)?"ano":"ne",h]);
    }
    return rows;
  }

  function download(name, content, type) {
    const blob = new Blob([content],{type}); const url = URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=name; document.body.append(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),500);
  }

  function exportCsv() {
    const esc = (v) => `"${String(v).replace(/"/g,'""')}"`;
    const text = "\ufeff" + csvRows().map(row => row.map(esc).join(";")).join("\r\n");
    download(`smenovy-kalendar-${state.year}.csv`,text,"text/csv;charset=utf-8");
    status("CSV bylo vytvořeno.");
  }

  function icsDate(date, time) {
    const [h,m] = time.split(":").map(Number); return `${date.getUTCFullYear()}${pad(date.getUTCMonth()+1)}${pad(date.getUTCDate())}T${pad(h)}${pad(m)}00`;
  }

  function icsEscape(text) { return String(text).replace(/\\/g,"\\\\").replace(/\n/g,"\\n").replace(/,/g,"\\,").replace(/;/g,"\\;"); }

  function exportIcs() {
    const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//RychleVypocty.cz//Smenovy kalendar//CS","CALSCALE:GREGORIAN","METHOD:PUBLISH"];
    const holidays = holidaysForYear(state.year);
    for (let d=new Date(Date.UTC(state.year,0,1)); d.getUTCFullYear()===state.year; d=addDays(d,1)) {
      const s=shiftAt(d); if (!isWorkKey(s.key)) continue;
      const [h,m] = s.def.start.split(":").map(Number); const total = h*60+m+Math.round(s.def.hours*60); const endDay=addDays(d,Math.floor(total/1440)); const endTime=`${pad(Math.floor(mod(total,1440)/60))}:${pad(mod(total,1440)%60)}`;
      const holiday=holidays.get(valueOfDate(d));
      lines.push("BEGIN:VEVENT",`UID:${valueOfDate(d)}-${s.key}@rychlevypocty.cz`,`DTSTAMP:${state.year}0101T000000Z`,`DTSTART:${icsDate(d,s.def.start)}`,`DTEND:${icsDate(endDay,endTime)}`,`SUMMARY:${icsEscape(s.def.name)}`,`DESCRIPTION:${icsEscape(`Směnový kalendář RychléVýpočty.cz${holiday ? ` · ${holiday}` : ""}`)}`,"END:VEVENT");
    }
    lines.push("END:VCALENDAR");
    download(`smenovy-kalendar-${state.year}.ics`,lines.join("\r\n"),"text/calendar;charset=utf-8");
    status("ICS kalendář byl vytvořen.");
  }

  function status(text) { setText("exportStatus",text); setTimeout(()=>{ if ($("exportStatus").textContent===text) setText("exportStatus",""); },2200); }

  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (_) {
      const ta=document.createElement("textarea"); ta.value=text; ta.style.position="fixed"; ta.style.opacity="0"; document.body.append(ta); ta.select(); const ok=document.execCommand("copy"); ta.remove(); return ok;
    }
  }

  // events
  $("presetGrid").addEventListener("click",(e) => {
    const button=e.target.closest("[data-preset]"); if (!button) return;
    state.preset=button.dataset.preset; state.phase=0; if (state.preset==="custom" && !state.customCycle.length) state.customCycle=[...presets["2224"].cycle]; renderAll();
  });
  $("phaseGrid").addEventListener("click",(e) => { const button=e.target.closest("[data-phase]"); if(!button)return; state.phase=Number(button.dataset.phase); renderAll(); });
  $("anchorDate").addEventListener("change",() => { if(parseDate($("anchorDate").value)){state.anchor=$("anchorDate").value;renderAll();} });
  $("yearSelect").addEventListener("change",() => { state.year=Number($("yearSelect").value); state.month=state.year===today.getUTCFullYear()?today.getUTCMonth():0; renderAll(); });
  $("shiftForm").addEventListener("submit",(e)=>{e.preventDefault();renderAll(); if(matchMedia("(max-width:880px)").matches) $("kalendar").scrollIntoView({behavior:"smooth",block:"start"});});
  $("resetBtn").addEventListener("click",resetState);
  $("customAdd").addEventListener("click",(e)=>{const b=e.target.closest("[data-add-shift]");if(!b)return;if(state.customCycle.length>=42){status("Vlastní cyklus může mít maximálně 42 dnů.");return;}state.preset="custom";state.customCycle.push(b.dataset.addShift);state.phase=mod(state.phase,state.customCycle.length);renderAll();});
  $("customCycle").addEventListener("click",(e)=>{const b=e.target.closest("[data-remove-shift]");if(!b)return;if(state.customCycle.length<=1){status("Cyklus musí obsahovat alespoň jeden den.");return;}state.customCycle.splice(Number(b.dataset.removeShift),1);state.preset="custom";state.phase=mod(state.phase,state.customCycle.length);renderAll();});
  $("customClear").addEventListener("click",()=>{state.preset="custom";state.customCycle=["V"];state.phase=0;renderAll();});
  $("customStarter").addEventListener("click",()=>{state.preset="custom";state.customCycle=[...presets["2224"].cycle];state.phase=0;renderAll();});
  $("shiftSettings").addEventListener("change",(e)=>{
    const start=e.target.dataset.settingStart, hours=e.target.dataset.settingHours;
    if(start){state.settings[start].start=e.target.value || shiftTypes[start].start;renderAll();}
    if(hours){const val=Math.max(0,Math.min(24,Number(e.target.value)||0));state.settings[hours].hours=val;renderAll();}
  });
  $("monthPrev").addEventListener("click",()=>{state.month--;if(state.month<0){state.month=11;state.year--;populateYears();}$("yearSelect").value=state.year;renderAll();});
  $("monthNext").addEventListener("click",()=>{state.month++;if(state.month>11){state.month=0;state.year++;populateYears();}$("yearSelect").value=state.year;renderAll();});
  $("monthGrid").addEventListener("click",(e)=>{const b=e.target.closest("[data-date]");if(!b)return;const d=parseDate(b.dataset.date);if(d)renderDayDetail(d);});
  $("copyLink").addEventListener("click",async()=>status(await copyText(shareUrl())?"Odkaz na turnus je zkopírovaný.":"Odkaz se nepodařilo zkopírovat."));
  $("exportCsv").addEventListener("click",exportCsv); $("exportIcs").addEventListener("click",exportIcs); $("printBtn").addEventListener("click",()=>window.print());
  const menu=$("menuBtn"), mobile=$("mobile-nav"); if(menu&&mobile){menu.addEventListener("click",()=>{const open=menu.getAttribute("aria-expanded")==="true";menu.setAttribute("aria-expanded",String(!open));mobile.classList.toggle("is-open",!open);});document.addEventListener("keydown",e=>{if(e.key==="Escape"){menu.setAttribute("aria-expanded","false");mobile.classList.remove("is-open");}});}

  readUrl(); populateYears(); renderAll();
})();
