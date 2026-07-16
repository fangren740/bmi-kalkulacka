(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const DAY_MS = 86400000;
  const MIN_YEAR = 1900;
  const MAX_YEAR = 2100;

  const csLong = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const csDayMonth = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', timeZone: 'UTC' });
  const csShort = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const csWeekday = new Intl.DateTimeFormat('cs-CZ', { weekday: 'long', timeZone: 'UTC' });
  const monthName = new Intl.DateTimeFormat('cs-CZ', { month: 'long', timeZone: 'UTC' });

  const localNow = new Date();
  const today = utcDate(localNow.getFullYear(), localNow.getMonth(), localNow.getDate());
  const todayInfo = isoInfo(today);

  const state = {
    year: todayInfo.isoYear,
    selectedYear: todayInfo.isoYear,
    selectedWeek: todayInfo.week,
    parity: 'all'
  };

  function utcDate(year, month, day) {
    return new Date(Date.UTC(year, month, day));
  }

  function addDays(date, amount) {
    return new Date(date.getTime() + amount * DAY_MS);
  }

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function inputValue(date) {
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  }

  function parseDate(value) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
    if (!match) return null;
    const date = utcDate(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function mondayIndex(date) {
    return (date.getUTCDay() + 6) % 7;
  }

  function isoInfo(date) {
    const selected = utcDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    const monday = addDays(selected, -mondayIndex(selected));
    const thursday = addDays(monday, 3);
    const isoYear = thursday.getUTCFullYear();
    const firstThursday = utcDate(isoYear, 0, 4);
    const firstWeekMonday = addDays(firstThursday, -mondayIndex(firstThursday));
    const week = Math.floor((monday - firstWeekMonday) / (7 * DAY_MS)) + 1;
    return { selected, monday, sunday: addDays(monday, 6), thursday, isoYear, week };
  }

  function weeksInYear(year) {
    return isoInfo(utcDate(year, 11, 28)).week;
  }

  function weekDates(year, week) {
    const jan4 = utcDate(year, 0, 4);
    const firstMonday = addDays(jan4, -mondayIndex(jan4));
    const monday = addDays(firstMonday, (week - 1) * 7);
    return { monday, sunday: addDays(monday, 6) };
  }

  function validYear(value) {
    const year = Number(value);
    return Number.isInteger(year) && year >= MIN_YEAR && year <= MAX_YEAR ? year : null;
  }

  function clampWeek(year, value) {
    const max = weeksInYear(year);
    return Math.max(1, Math.min(max, Number(value) || 1));
  }

  function isoCode(year, week) {
    return `${year}-W${pad(week)}`;
  }

  function parityKey(week) {
    return week % 2 ? 'odd' : 'even';
  }

  function parityLabel(week) {
    return week % 2 ? 'lichý' : 'sudý';
  }

  function parityLong(week) {
    return `${parityLabel(week)} týden`;
  }

  function formatRange(monday, sunday) {
    if (monday.getUTCFullYear() === sunday.getUTCFullYear() && monday.getUTCMonth() === sunday.getUTCMonth()) {
      return `${monday.getUTCDate()}.–${csLong.format(sunday)}`;
    }
    if (monday.getUTCFullYear() === sunday.getUTCFullYear()) {
      return `${csDayMonth.format(monday)} – ${csLong.format(sunday)}`;
    }
    return `${csLong.format(monday)} – ${csLong.format(sunday)}`;
  }

  function compactRange(monday, sunday) {
    if (monday.getUTCFullYear() === sunday.getUTCFullYear()) {
      return `${monday.getUTCDate()}. ${monday.getUTCMonth() === sunday.getUTCMonth() ? '–' : monthName.format(monday) + ' –'} ${sunday.getUTCDate()}. ${monthName.format(sunday)}`;
    }
    return `${monday.getUTCDate()}. ${monthName.format(monday)} – ${sunday.getUTCDate()}. ${monthName.format(sunday)}`;
  }

  function quarterForWeek(monday) {
    const thursday = addDays(monday, 3);
    return Math.floor(thursday.getUTCMonth() / 3) + 1;
  }

  function hasOverlap(monday, sunday, year) {
    return monday.getUTCMonth() !== sunday.getUTCMonth() || monday.getUTCFullYear() !== year || sunday.getUTCFullYear() !== year;
  }

  function currentSelection() {
    const { monday, sunday } = weekDates(state.selectedYear, state.selectedWeek);
    return { year: state.selectedYear, week: state.selectedWeek, monday, sunday };
  }

  function allWeeks(year) {
    return Array.from({ length: weeksInYear(year) }, (_, index) => {
      const week = index + 1;
      const { monday, sunday } = weekDates(year, week);
      return { year, week, monday, sunday, quarter: quarterForWeek(monday) };
    });
  }

  function visibleWeeks() {
    return allWeeks(state.year).filter((item) => state.parity === 'all' || parityKey(item.week) === state.parity);
  }

  function renderToday() {
    $('todayWeekNumber').textContent = todayInfo.week;
    $('todayIsoCode').textContent = isoCode(todayInfo.isoYear, todayInfo.week);
    $('todayParity').textContent = parityLong(todayInfo.week);
    $('todayRange').textContent = formatRange(todayInfo.monday, todayInfo.sunday);
  }

  function renderCalendar() {
    const year = state.year;
    const weeks = visibleWeeks();
    const total = weeksInYear(year);
    $('headlineYear').textContent = year;
    $('calendarYear').textContent = year;
    $('yearSelect').value = year;
    $('calendarSummary').textContent = `Rok ${year} má ${total} ${total === 53 ? 'týdnů' : 'týdnů'}. Každý řádek zobrazuje pondělí, neděli, ISO kód a lichost nebo sudost.`;

    const grid = $('quarterGrid');
    grid.innerHTML = '';

    for (let quarter = 1; quarter <= 4; quarter += 1) {
      const items = weeks.filter((item) => item.quarter === quarter);
      if (!items.length) continue;

      const section = document.createElement('section');
      section.className = 'quarter-column';
      section.setAttribute('aria-label', `${quarter}. čtvrtletí`);
      const first = items[0];
      const last = items[items.length - 1];
      section.innerHTML = `<div class="quarter-head"><strong>${quarter}. čtvrtletí</strong><span>KT ${pad(first.week)}–${pad(last.week)}</span></div><div class="week-list"></div>`;
      const list = section.querySelector('.week-list');

      items.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'week-row';
        button.dataset.year = item.year;
        button.dataset.week = item.week;
        button.setAttribute('aria-label', `${item.week}. týden roku ${item.year}, ${formatRange(item.monday, item.sunday)}, ${parityLong(item.week)}`);
        button.setAttribute('aria-pressed', String(item.year === state.selectedYear && item.week === state.selectedWeek));
        if (item.year === todayInfo.isoYear && item.week === todayInfo.week) button.classList.add('is-current');
        if (item.year === state.selectedYear && item.week === state.selectedWeek) button.classList.add('is-selected');
        if (hasOverlap(item.monday, item.sunday, item.year)) button.classList.add('has-overlap');
        button.innerHTML = `
          <span class="week-number">${item.week}</span>
          <span class="week-dates"><strong>${compactRange(item.monday, item.sunday)}</strong><small>${isoCode(item.year, item.week)} · Po ${csShort.format(item.monday)} / Ne ${csShort.format(item.sunday)}</small></span>
          <span class="week-tags"><em>${parityLabel(item.week)}</em><b>${hasOverlap(item.monday, item.sunday, item.year) ? 'přesah' : 'Q' + item.quarter}</b></span>`;
        button.addEventListener('click', () => selectWeek(item.year, item.week, true));
        list.appendChild(button);
      });
      grid.appendChild(section);
    }

    $('calendarEmpty').hidden = weeks.length > 0;
    renderSelectedBar();
    renderParityLists();
  }

  function renderSelectedBar() {
    const selection = currentSelection();
    $('selectedWeekNumber').textContent = selection.week;
    $('selectedWeekIso').textContent = isoCode(selection.year, selection.week);
    $('selectedWeekRange').textContent = formatRange(selection.monday, selection.sunday);
    $('selectedWeekDetail').textContent = `Pondělí ${csShort.format(selection.monday)} až neděle ${csShort.format(selection.sunday)} · ${parityLong(selection.week)}`;

    $('toolYearInput').value = selection.year;
    $('weekInput').max = weeksInYear(selection.year);
    $('weekInput').value = selection.week;
    renderWeekTool();
  }

  function selectWeek(year, week, updateUrl = false) {
    const checkedYear = validYear(year);
    if (!checkedYear) return;
    state.selectedYear = checkedYear;
    state.selectedWeek = clampWeek(checkedYear, week);
    if (state.year !== checkedYear) state.year = checkedYear;
    renderCalendar();
    if (updateUrl) updateAddress();
  }

  function setYear(year, keepWeek = true) {
    const checkedYear = validYear(year);
    if (!checkedYear) {
      $('yearSelect').value = state.year;
      showToast(`Zadejte rok od ${MIN_YEAR} do ${MAX_YEAR}.`);
      return;
    }
    state.year = checkedYear;
    state.selectedYear = checkedYear;
    state.selectedWeek = keepWeek ? clampWeek(checkedYear, state.selectedWeek) : 1;
    renderCalendar();
    updateAddress();
  }

  function shiftSelectedWeek(delta) {
    const current = currentSelection();
    const target = isoInfo(addDays(current.monday, delta * 7));
    state.year = target.isoYear;
    state.selectedYear = target.isoYear;
    state.selectedWeek = target.week;
    renderCalendar();
    updateAddress();
  }

  function renderDateTool() {
    const date = parseDate($('dateInput').value);
    if (!date) return;
    const info = isoInfo(date);
    $('dateResultWeek').textContent = info.week;
    $('dateResultIso').textContent = isoCode(info.isoYear, info.week);
    $('dateResultRange').textContent = formatRange(info.monday, info.sunday);
    $('dateResultParity').textContent = parityLong(info.week);
  }

  function weekToolValues() {
    const year = validYear($('toolYearInput').value);
    if (!year) return null;
    const week = clampWeek(year, $('weekInput').value);
    $('weekInput').max = weeksInYear(year);
    $('weekInput').value = week;
    return { year, week, ...weekDates(year, week) };
  }

  function renderWeekTool() {
    const info = weekToolValues();
    if (!info) return;
    $('weekResultWeek').textContent = info.week;
    $('weekResultIso').textContent = isoCode(info.year, info.week);
    $('weekResultRange').textContent = formatRange(info.monday, info.sunday);
    $('weekResultParity').textContent = parityLong(info.week);
  }

  function renderParityLists() {
    const total = weeksInYear(state.year);
    const odd = [];
    const even = [];
    for (let week = 1; week <= total; week += 1) (week % 2 ? odd : even).push(week);
    $('oddWeeksList').textContent = odd.join(', ');
    $('evenWeeksList').textContent = even.join(', ');
  }

  function selectionText(selection = currentSelection()) {
    return `${selection.week}. kalendářní týden (${isoCode(selection.year, selection.week)}): ${formatRange(selection.monday, selection.sunday)} – ${parityLong(selection.week)}.`;
  }

  function dateToolText() {
    const date = parseDate($('dateInput').value);
    if (!date) return '';
    const info = isoInfo(date);
    return `${csLong.format(date)} patří do ${info.week}. kalendářního týdne (${isoCode(info.isoYear, info.week)}), ${formatRange(info.monday, info.sunday)} – ${parityLong(info.week)}.`;
  }

  function weekToolText() {
    const info = weekToolValues();
    return info ? selectionText(info) : '';
  }

  function yearText(parity = state.parity) {
    return allWeeks(state.year)
      .filter((item) => parity === 'all' || parityKey(item.week) === parity)
      .map((item) => `${pad(item.week)} | ${isoCode(item.year, item.week)} | ${inputValue(item.monday)} – ${inputValue(item.sunday)} | ${parityLong(item.week)}`)
      .join('\n');
  }

  async function copyText(text, successMessage = 'Zkopírováno do schránky.') {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
    } catch (error) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      if (copied) showToast(successMessage);
      else window.prompt('Zkopírujte text:', text);
    }
  }

  let toastTimer = null;
  function showToast(message) {
    const toast = $('toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 2400);
  }

  function downloadBlob(content, type, filename) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
  }

  function exportCsv() {
    const rows = [['Týden', 'ISO kód', 'Pondělí', 'Neděle', 'Typ', 'Čtvrtletí']];
    visibleWeeks().forEach((item) => rows.push([
      item.week,
      isoCode(item.year, item.week),
      inputValue(item.monday),
      inputValue(item.sunday),
      parityLong(item.week),
      `Q${item.quarter}`
    ]));
    const csv = '\ufeff' + rows.map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    downloadBlob(csv, 'text/csv;charset=utf-8', `kalendarni-tydny-${state.year}${state.parity === 'all' ? '' : '-' + state.parity}.csv`);
    showToast('CSV přehled byl vytvořen.');
  }

  const pdfCustomChars = {
    'č': 128, 'Č': 129, 'ď': 130, 'Ď': 131, 'ě': 132, 'Ě': 133,
    'ň': 134, 'Ň': 135, 'ř': 136, 'Ř': 137, 'š': 138, 'Š': 139,
    'ť': 140, 'Ť': 141, 'ů': 142, 'Ů': 143, 'ž': 144, 'Ž': 145
  };

  const pdfWinAnsiChars = {
    'á': 225, 'Á': 193, 'é': 233, 'É': 201, 'í': 237, 'Í': 205,
    'ó': 243, 'Ó': 211, 'ú': 250, 'Ú': 218, 'ý': 253, 'Ý': 221
  };

  function pdfEncodeText(text) {
    let binary = '';
    for (const char of String(text)) {
      const code = char.charCodeAt(0);
      if (code >= 32 && code <= 126) binary += char;
      else if (pdfCustomChars[char] !== undefined) binary += String.fromCharCode(pdfCustomChars[char]);
      else if (pdfWinAnsiChars[char] !== undefined) binary += String.fromCharCode(pdfWinAnsiChars[char]);
      else if (char === '–' || char === '—') binary += '-';
      else binary += ' ';
    }
    return binary;
  }

  function pdfEscape(text) {
    return pdfEncodeText(text).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  }

  function binaryBytes(binary) {
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index) & 255;
    return bytes;
  }

  function pdfPageContent(year, items, pageNumber, totalPages) {
    const commands = ['BT', '/F1 17 Tf', '48 805 Td', `(${pdfEscape(`Kalendářní týdny ${year} – ISO 8601`)}) Tj`, '/F1 9 Tf', '0 -20 Td', `(${pdfEscape(`Strana ${pageNumber}/${totalPages} | Vytvořeno na RychléVýpočty.cz`)}) Tj`, '0 -24 Td'];
    items.forEach((item, index) => {
      if (index > 0) commands.push('0 -25 Td');
      const line = `KT ${pad(item.week)}   ${isoCode(item.year, item.week)}   ${inputValue(item.monday)} – ${inputValue(item.sunday)}   ${parityLong(item.week)}`;
      commands.push(`(${pdfEscape(line)}) Tj`);
    });
    commands.push('ET');
    return commands.join('\n');
  }

  function makePdf(year, items) {
    const chunks = [items.slice(0, 27), items.slice(27)];
    const pageCount = chunks[1].length ? 2 : 1;
    const objects = [];
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Kids [3 0 R${pageCount === 2 ? ' 5 0 R' : ''}] /Count ${pageCount} >>`;
    const firstContent = pdfPageContent(year, chunks[0], 1, pageCount);
    objects[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>';
    objects[4] = `<< /Length ${firstContent.length} >>\nstream\n${firstContent}\nendstream`;
    if (pageCount === 2) {
      const secondContent = pdfPageContent(year, chunks[1], 2, pageCount);
      objects[5] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>';
      objects[6] = `<< /Length ${secondContent.length} >>\nstream\n${secondContent}\nendstream`;
    } else {
      objects[5] = '<<>>';
      objects[6] = '<<>>';
    }
    objects[7] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding << /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [128 /ccaron /Ccaron /dcaron /Dcaron /ecaron /Ecaron /ncaron /Ncaron /rcaron /Rcaron /scaron /Scaron /tcaron /Tcaron /uring /Uring /zcaron /Zcaron] >> >>';

    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [0];
    for (let index = 1; index <= 7; index += 1) {
      offsets[index] = pdf.length;
      pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
    }
    const xrefOffset = pdf.length;
    pdf += 'xref\n0 8\n0000000000 65535 f \n';
    for (let index = 1; index <= 7; index += 1) pdf += `${String(offsets[index]).padStart(10, '0')} 00000 n \n`;
    pdf += `trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([binaryBytes(pdf)], { type: 'application/pdf' });
  }

  function exportPdf() {
    const items = visibleWeeks();
    downloadBlob(makePdf(state.year, items), 'application/pdf', `kalendarni-tydny-${state.year}${state.parity === 'all' ? '' : '-' + state.parity}.pdf`);
    showToast('PDF přehled byl vytvořen.');
  }

  function updateAddress() {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('rok', state.selectedYear);
    url.searchParams.set('tyden', state.selectedWeek);
    if (state.parity !== 'all') url.searchParams.set('filtr', state.parity);
    history.replaceState(null, '', url);
  }

  function initializeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const year = validYear(params.get('rok')) || todayInfo.isoYear;
    const week = clampWeek(year, params.get('tyden') || todayInfo.week);
    const filter = ['all', 'odd', 'even'].includes(params.get('filtr')) ? params.get('filtr') : 'all';
    state.year = year;
    state.selectedYear = year;
    state.selectedWeek = week;
    state.parity = filter;
    $$('[data-parity]').forEach((button) => {
      const active = button.dataset.parity === filter;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function bindEvents() {
    $('prevYearBtn').addEventListener('click', () => setYear(state.year - 1));
    $('nextYearBtn').addEventListener('click', () => setYear(state.year + 1));
    $('currentYearBtn').addEventListener('click', () => {
      state.parity = 'all';
      $$('[data-parity]').forEach((button) => {
        const active = button.dataset.parity === 'all';
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      state.year = todayInfo.isoYear;
      state.selectedYear = todayInfo.isoYear;
      state.selectedWeek = todayInfo.week;
      renderCalendar();
      updateAddress();
      document.querySelector(`[data-year="${todayInfo.isoYear}"][data-week="${todayInfo.week}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    $('yearSelect').addEventListener('change', (event) => setYear(event.target.value));
    $('yearSelect').addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); setYear(event.currentTarget.value); } });

    $$('[data-parity]').forEach((button) => button.addEventListener('click', () => {
      state.parity = button.dataset.parity;
      $$('[data-parity]').forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle('is-active', active);
        candidate.setAttribute('aria-pressed', String(active));
      });
      renderCalendar();
      updateAddress();
    }));

    $('selectedPrevBtn').addEventListener('click', () => shiftSelectedWeek(-1));
    $('selectedNextBtn').addEventListener('click', () => shiftSelectedWeek(1));
    $('copySelectedBtn').addEventListener('click', () => copyText(selectionText(), 'Vybraný týden byl zkopírován.'));
    $('copyYearBtn').addEventListener('click', () => copyText(yearText(), 'Roční přehled byl zkopírován.'));
    $('printBtn').addEventListener('click', () => window.print());
    $('pdfBtn').addEventListener('click', exportPdf);
    $('csvBtn').addEventListener('click', exportCsv);

    $('dateInput').addEventListener('input', renderDateTool);
    $('dateToWeekForm').addEventListener('submit', (event) => event.preventDefault());
    $('dateTodayBtn').addEventListener('click', () => { $('dateInput').value = inputValue(today); renderDateTool(); });
    $('dateTomorrowBtn').addEventListener('click', () => { $('dateInput').value = inputValue(addDays(today, 1)); renderDateTool(); });
    $('dateNextMondayBtn').addEventListener('click', () => {
      const offset = (7 - mondayIndex(today)) % 7 || 7;
      $('dateInput').value = inputValue(addDays(today, offset));
      renderDateTool();
    });
    $('copyDateResultBtn').addEventListener('click', () => copyText(dateToolText(), 'Výsledek data byl zkopírován.'));

    $('toolYearInput').addEventListener('input', renderWeekTool);
    $('weekInput').addEventListener('input', renderWeekTool);
    $('weekToDateForm').addEventListener('submit', (event) => event.preventDefault());
    $('toolPrevWeekBtn').addEventListener('click', () => {
      const info = weekToolValues();
      if (!info) return;
      const target = isoInfo(addDays(info.monday, -7));
      $('toolYearInput').value = target.isoYear;
      $('weekInput').value = target.week;
      renderWeekTool();
    });
    $('toolCurrentWeekBtn').addEventListener('click', () => {
      $('toolYearInput').value = todayInfo.isoYear;
      $('weekInput').value = todayInfo.week;
      renderWeekTool();
    });
    $('toolNextWeekBtn').addEventListener('click', () => {
      const info = weekToolValues();
      if (!info) return;
      const target = isoInfo(addDays(info.monday, 7));
      $('toolYearInput').value = target.isoYear;
      $('weekInput').value = target.week;
      renderWeekTool();
    });
    $('copyWeekResultBtn').addEventListener('click', () => copyText(weekToolText(), 'Rozsah týdne byl zkopírován.'));

    $('copyOddBtn').addEventListener('click', () => copyText(yearText('odd'), `Liché týdny roku ${state.year} byly zkopírovány.`));
    $('copyEvenBtn').addEventListener('click', () => copyText(yearText('even'), `Sudé týdny roku ${state.year} byly zkopírovány.`));
  }

  function initialize() {
    initializeFromUrl();
    $('dateInput').value = inputValue(today);
    $('toolYearInput').value = state.selectedYear;
    $('weekInput').value = state.selectedWeek;
    renderToday();
    renderDateTool();
    renderCalendar();
    bindEvents();
  }

  initialize();
})();
