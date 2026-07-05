(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("workdaysForm");
  if (!form) return;

  const nf = new Intl.NumberFormat("cs-CZ");
  const fmtNum = (value, digits = 0) =>
    nf.format(Number.isFinite(value) ? Number(value.toFixed(digits)) : 0);
  const fmtDate = (date) =>
    new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short", year: "numeric" }).format(date);
  const fmtMonth = (date) =>
    new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric" }).format(date);
  const iso = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const parseDate = (value) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return null;
    const [year, month, day] = String(value || "").split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  };
  const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
  const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const key = (date) => iso(date);

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
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  function holidays(year) {
    const map = {};
    [
      [0, 1, "Nový rok"],
      [4, 1, "Svátek práce"],
      [4, 8, "Den vítězství"],
      [6, 5, "Cyril a Metoděj"],
      [6, 6, "Jan Hus"],
      [8, 28, "Den české státnosti"],
      [9, 28, "Vznik Československa"],
      [10, 17, "17. listopad"],
      [11, 24, "Štědrý den"],
      [11, 25, "1. svátek vánoční"],
      [11, 26, "2. svátek vánoční"]
    ].forEach(([month, day, name]) => {
      map[key(new Date(year, month, day))] = name;
    });
    const easter = easterSunday(year);
    map[key(addDays(easter, -2))] = "Velký pátek";
    map[key(addDays(easter, 1))] = "Velikonoční pondělí";
    return map;
  }

  function setDefaults() {
    const today = new Date();
    $("startDate").value = iso(startOfMonth(today));
    $("endDate").value = iso(endOfMonth(today));
    $("hoursPerDay").value = 8;
    $("countMode").value = "inclusive";
    $("excludeWeekends").checked = true;
    $("excludeHolidays").checked = true;
  }

  function applyPreset(type) {
    const today = new Date();
    if (type === "month") {
      $("startDate").value = iso(startOfMonth(today));
      $("endDate").value = iso(endOfMonth(today));
    }
    if (type === "next-month") {
      const next = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      $("startDate").value = iso(startOfMonth(next));
      $("endDate").value = iso(endOfMonth(next));
    }
    if (type === "30") {
      $("startDate").value = iso(today);
      $("endDate").value = iso(addDays(today, 29));
    }
    if (type === "quarter") {
      $("startDate").value = iso(today);
      $("endDate").value = iso(addDays(today, 89));
    }
    render();
  }

  function readInputs() {
    let start = parseDate($("startDate").value);
    let end = parseDate($("endDate").value);
    if (!start || !end) return { valid: false };
    if (end < start) [start, end] = [end, start];
    const displayEnd = new Date(end);
    if ($("countMode").value === "exclusive-end") {
      end = addDays(end, -1);
    }
    const hours = Math.min(24, Math.max(0.5, Number($("hoursPerDay").value) || 8));
    return {
      start,
      end,
      displayEnd,
      valid: true,
      hours,
      excludeWeekends: $("excludeWeekends").checked,
      excludeHolidays: $("excludeHolidays").checked
    };
  }

  function calculate() {
    const input = readInputs();
    if (!input.valid) return input;
    const days = [];
    const end = input.end;

    for (let cursor = new Date(input.start); cursor <= end; cursor = addDays(cursor, 1)) {
      const holidayMap = holidays(cursor.getFullYear());
      const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;
      const holidayName = holidayMap[key(cursor)] || "";
      const isHoliday = Boolean(holidayName);
      const excludedByWeekend = input.excludeWeekends && isWeekend;
      const excludedByHoliday = input.excludeHolidays && isHoliday;
      const isWorking = !excludedByWeekend && !excludedByHoliday;
      days.push({
        date: new Date(cursor),
        isWeekend,
        isHoliday,
        holidayName,
        isWorking,
        note: holidayName || (isWeekend ? "víkend" : "běžný pracovní den")
      });
    }

    const calendarDays = days.length;
    const workingDays = days.filter((day) => day.isWorking).length;
    const weekendDays = days.filter((day) => day.isWeekend).length;
    const holidayDays = days.filter((day) => day.isHoliday && (!day.isWeekend || !input.excludeWeekends)).length;
    const nonWorking = calendarDays - workingDays;
    const workingHours = workingDays * input.hours;
    const workShare = calendarDays ? Math.round((workingDays / calendarDays) * 100) : 0;
    const offShare = Math.max(0, 100 - workShare);

    return { ...input, days, calendarDays, workingDays, weekendDays, holidayDays, nonWorking, workingHours, workShare, offShare };
  }

  function interpretation(data) {
    if (data.workingDays <= 0) {
      return {
        headline: "V období nevychází žádný pracovní den.",
        status: "Období je celé mimo pracovní režim.",
        text: "Pro běžnou práci nebo dodání je potřeba posunout termín, započítat směny mimo víkend, nebo vypnout odečtení víkendů a svátků.",
        next: "Ověřte, jestli opravdu řešíte pracovní dny. Pro prostý odpočet zkuste kalkulačku dní do data."
      };
    }
    if (data.workingDays < 5) {
      return {
        headline: "Jde o krátké pracovní okno.",
        status: "Rezerva je malá.",
        text: `Z ${fmtNum(data.calendarDays)} kalendářních dnů zůstává jen ${fmtNum(data.workingDays)} pracovních dnů. U termínů je dobré počítat s rezervou nebo posunout deadline.`,
        next: "Pro plán práce si dopočítejte odpracované hodiny a u dovolené ověřte zůstatek."
      };
    }
    if (data.workShare < 60) {
      return {
        headline: "Volné dny tvoří výraznou část období.",
        status: "Kalendářní termín může klamat.",
        text: `Pracovní část tvoří přibližně ${fmtNum(data.workShare)} % období. Pokud plánujete zakázku, kapacitu nebo výplatní období, čtěte hlavně pracovní dny a hodiny.`,
        next: "Navazujte výpočtem dovolené, odpracovaných hodin nebo hodinové mzdy."
      };
    }
    return {
      headline: "Období má použitelnou pracovní kapacitu.",
      status: "Výsledek je vhodný jako plánovací rámec.",
      text: `V období vychází ${fmtNum(data.workingDays)} pracovních dnů, tedy orientačně ${fmtNum(data.workingHours)} hodin při délce dne ${fmtNum(data.hours, 1)} h.`,
      next: "Pro přesnější plán odečtěte dovolenou, interní volno, porady a rezervu."
    };
  }

  function renderTable(data) {
    const rows = data.days.slice(0, 14).map((day) => {
      const type = day.isWorking ? "pracovní den" : "volno";
      return `<tr><td>${fmtDate(day.date)}</td><td>${type}</td><td>${day.note}</td></tr>`;
    });
    if (data.days.length > 14) {
      rows.push(`<tr><td colspan="3">Dalších ${fmtNum(data.days.length - 14)} dnů je zahrnuto v souhrnu výše.</td></tr>`);
    }
    if (!rows.length) {
      rows.push('<tr><td colspan="3">V zadaném režimu období neobsahuje žádný započítaný den.</td></tr>');
    }
    $("scheduleBody").innerHTML = rows.join("");
  }

  function render() {
    const data = calculate();
    if (!data.valid) {
      $("workingDays").textContent = "—";
      $("workingHours").textContent = "—";
      $("periodBadge").textContent = "Doplňte obě data";
      $("capacityStatus").textContent = "Neúplné zadání";
      $("capacityText").textContent = "Pro výpočet je potřeba platné počáteční i koncové datum.";
      $("decisionHeadline").textContent = "Zkontrolujte datumy";
      $("decisionSummary").textContent = "Prázdné nebo neplatné datum nelze bezpečně započítat.";
      $("scheduleBody").innerHTML = '<tr><td colspan="3">Doplňte platný rozsah dat.</td></tr>';
      return;
    }
    const text = interpretation(data);

    $("workingDays").textContent = fmtNum(data.workingDays);
    $("workingHours").textContent = `${fmtNum(data.workingHours, data.workingHours % 1 ? 1 : 0)} h`;
    $("calendarDays").textContent = fmtNum(data.calendarDays);
    $("weekendDays").textContent = fmtNum(data.weekendDays);
    $("holidayDays").textContent = fmtNum(data.holidayDays);
    $("nonWorkingDays").textContent = fmtNum(data.nonWorking);
    $("dayLengthLabel").textContent = `${fmtNum(data.hours, data.hours % 1 ? 1 : 0)} h`;
    $("periodLabel").textContent = `${fmtDate(data.start)} - ${fmtDate(data.displayEnd)}`;
    $("periodBadge").textContent = `${fmtDate(data.start)} - ${fmtDate(data.displayEnd)}`;
    $("workShareText").textContent = `${data.workShare} %`;
    $("offShareText").textContent = `${data.offShare} %`;
    $("workShareBar").style.width = `${data.workShare}%`;
    $("offShareBar").style.width = `${data.offShare}%`;
    $("capacityStatus").textContent = text.status;
    $("capacityText").textContent = text.text;
    $("nextActionText").textContent = text.next;
    $("decisionHeadline").textContent = text.headline;
    $("decisionSummary").textContent = text.text;

    $("heroWorkingDays").textContent = fmtNum(data.workingDays);
    $("heroCapacity").textContent = `${fmtNum(data.workingHours, data.workingHours % 1 ? 1 : 0)} h kapacity`;
    $("heroRange").textContent = fmtMonth(data.start);
    $("heroWorkBar").style.width = `${data.workShare}%`;
    $("heroOffBar").style.width = `${data.offShare}%`;
    $("heroWorkShare").textContent = `${data.workShare} %`;
    $("heroOffShare").textContent = `${data.offShare} %`;

    renderTable(data);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    $("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  ["startDate", "endDate", "hoursPerDay", "countMode", "excludeWeekends", "excludeHolidays"].forEach((id) => {
    const el = $(id);
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });

  $("resetBtn").addEventListener("click", () => {
    setDefaults();
    render();
  });

  setDefaults();
  render();
})();
