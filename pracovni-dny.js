(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("workdaysForm");
  const resetBtn = $("resetBtn");
  const int = (value) => new Intl.NumberFormat("cs-CZ").format(Number.isFinite(value) ? value : 0);
  const dateValue = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const parse = (value) => {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const fmt = (date) => new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short", year: "numeric" }).format(date);
  const key = (date) => dateValue(date);
  const addDays = (date, days) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

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
    map[key(addDays(easterSunday(year), -2))] = "Velký pátek";
    map[key(addDays(easterSunday(year), 1))] = "Velikonoční pondělí";
    return map;
  }

  function setDefaults() {
    const today = new Date();
    $("startDate").value = dateValue(today);
    $("endDate").value = dateValue(addDays(today, 30));
  }

  function render() {
    let start = parse($("startDate").value);
    let end = parse($("endDate").value);
    if (end < start) [start, end] = [end, start];
    const hours = Number($("hoursPerDay").value) || 8;
    const excludeWeekends = $("excludeWeekends").checked;
    const excludeHolidays = $("excludeHolidays").checked;
    const days = [];
    for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
      const isWeekend = cursor.getDay() === 0 || cursor.getDay() === 6;
      const holidayName = holidays(cursor.getFullYear())[key(cursor)] || "";
      const isHoliday = Boolean(holidayName);
      const isWorking = !(excludeWeekends && isWeekend) && !(excludeHolidays && isHoliday);
      days.push({ date: new Date(cursor), isWeekend, isHoliday, holidayName, isWorking });
    }
    const workingDays = days.filter((day) => day.isWorking).length;
    const weekendDays = days.filter((day) => day.isWeekend).length;
    const holidayDays = days.filter((day) => day.isHoliday && !day.isWeekend).length;
    const calendarDays = days.length;
    const nonWorking = calendarDays - workingDays;
    $("workingDays").textContent = int(workingDays);
    $("workingHours").textContent = `${int(workingDays * hours)} h`;
    $("calendarDays").textContent = int(calendarDays);
    $("nonWorkingDays").textContent = int(nonWorking);
    $("periodBadge").textContent = "Výpočet hotový";
    $("weekendDays").textContent = int(weekendDays);
    $("holidayDays").textContent = int(holidayDays);
    $("periodLabel").textContent = `${fmt(start)} až ${fmt(end)}`;
    $("modeLabel").textContent = `${excludeWeekends ? "bez víkendů" : "včetně víkendů"}, ${excludeHolidays ? "bez svátků" : "včetně svátků"}`;
    $("dayLengthLabel").textContent = `${hours} h`;
    $("capacityStatus").textContent = nonWorking > 0 ? "Kalendářní dny se liší od pracovních" : "Všechny dny jsou započtené";
    $("capacityText").textContent = `Z ${int(calendarDays)} kalendářních dnů vychází ${int(workingDays)} pracovních dnů.`;
    $("decisionSummary").textContent = "Pro termíny a kapacitu používejte pracovní dny, pro jednoduchý odpočet stačí kalendářní dny.";
    $("nextActionText").textContent = "Pokud výpočet navazuje na mzdu nebo dovolenou, zkontrolujte i hodinovou sazbu a mzdové kalkulačky.";
    $("scheduleBody").innerHTML = days.slice(0, 8).map((day) => `<tr><td>${fmt(day.date)}</td><td>${day.isWorking ? "pracovní" : "volno"}</td><td>${day.holidayName || (day.isWeekend ? "víkend" : "—")}</td></tr>`).join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  ["startDate", "endDate", "hoursPerDay", "countMode", "excludeWeekends", "excludeHolidays"].forEach((id) => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });
  resetBtn.addEventListener("click", () => {
    setDefaults();
    render();
  });
  setDefaults();
  render();
})();
