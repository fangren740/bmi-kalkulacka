(function () {
  const form = document.getElementById("workedHoursForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const nf = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const pf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });

  const outputs = {
    statShift: $("statShift"),
    statGross: $("statGross"),
    statPeriod: $("statPeriod"),
    rowStart: $("rowStart"),
    rowEnd: $("rowEnd"),
    rowBreak: $("rowBreak"),
    rowNet: $("rowNet"),
    rowDays: $("rowDays"),
    rowTotal: $("rowTotal"),
    resultNote: $("resultNote"),
    detailText: $("detailText"),
    statusBadge: $("statusBadge"),
    readingTitle: $("readingTitle"),
    readingText: $("readingText"),
    workShareBar: $("workShareBar"),
    breakShareBar: $("breakShareBar"),
    workShareText: $("workShareText"),
    breakShareText: $("breakShareText"),
    workedTableBody: $("workedTableBody"),
    heroShift: $("heroShift"),
    mobileHeroShift: $("mobileHeroShift"),
    heroClock: $("heroClock"),
    heroStart: $("heroStart"),
    heroEnd: $("heroEnd"),
    heroBreak: $("heroBreak"),
    heroPeriod: $("heroPeriod"),
    heroDays: $("heroDays"),
    heroWorkBar: $("heroWorkBar"),
    heroBreakBar: $("heroBreakBar")
  };

  function setText(target, value) {
    if (target) target.textContent = value;
  }

  function setWidth(target, value) {
    if (target) target.style.width = value;
  }

  function fillSelect(select, start, end, step, pad) {
    select.innerHTML = "";
    for (let value = start; value <= end; value += step) {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = pad ? String(value).padStart(2, "0") : String(value);
      select.appendChild(option);
    }
  }

  fillSelect($("startHour"), 0, 23, 1, true);
  fillSelect($("endHour"), 0, 23, 1, true);
  fillSelect($("startMinute"), 0, 55, 5, true);
  fillSelect($("endMinute"), 0, 55, 5, true);

  $("startHour").value = "8";
  $("startMinute").value = "0";
  $("endHour").value = "16";
  $("endMinute").value = "30";

  function minutes(hour, minute) {
    return Number(hour) * 60 + Number(minute);
  }

  function durationLabel(totalMinutes) {
    const sign = totalMinutes < 0 ? "-" : "";
    const absolute = Math.abs(Math.round(totalMinutes));
    const hours = Math.floor(absolute / 60);
    const mins = absolute % 60;
    return `${sign}${hours} h ${String(mins).padStart(2, "0")} min`;
  }

  function decimalHours(totalMinutes) {
    return `${nf.format(totalMinutes / 60)} h`;
  }

  function clock(hour, minute) {
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function dayLabel(value) {
    const absolute = Math.abs(value);
    if (absolute === 1) return "1 směna";
    if (absolute >= 2 && absolute <= 4) return `${value} směny`;
    return `${value} směn`;
  }

  function values() {
    return {
      startHour: Number($("startHour").value),
      startMinute: Number($("startMinute").value),
      endHour: Number($("endHour").value),
      endMinute: Number($("endMinute").value),
      breakMinutes: Math.max(0, Number($("breakMinutes").value) || 0),
      workDays: Math.max(1, Number($("workDays").value) || 1),
      periodType: $("periodType").value
    };
  }

  function calculate(input) {
    const start = minutes(input.startHour, input.startMinute);
    const endRaw = minutes(input.endHour, input.endMinute);
    const end = endRaw <= start ? endRaw + 1440 : endRaw;
    const gross = end - start;
    const net = Math.max(0, gross - input.breakMinutes);
    const total = net * input.workDays;
    const workShare = gross > 0 ? (net / gross) * 100 : 0;
    const breakShare = gross > 0 ? Math.min(100, (input.breakMinutes / gross) * 100) : 0;
    return { gross, net, total, workShare, breakShare, crossesMidnight: endRaw <= start };
  }

  function periodLabel(input) {
    if (input.periodType === "week") return "týdenní součet";
    if (input.periodType === "month") return "měsíční součet";
    return "součet za zadané období";
  }

  function renderStatus(input, result) {
    if (result.net === 0) {
      setText(outputs.statusBadge, "Pauza pohltila celou směnu");
      setText(outputs.resultNote, "Čistý čas vychází 0 h. Zkontrolujte, zda pauza není delší než samotná směna.");
      setText(outputs.detailText, `Hrubá směna je ${durationLabel(result.gross)}, zadaná pauza ${input.breakMinutes} minut.`);
      setText(outputs.readingTitle, "Výsledek je potřeba ověřit.");
      setText(outputs.readingText, "Pokud čistý čas vychází nulový, obvykle je špatně zadaná pauza, začátek nebo konec směny.");
      return;
    }

    if (result.net > 12 * 60) {
      setText(outputs.statusBadge, "Neobvykle dlouhá směna");
      setText(outputs.readingTitle, "Směna je delší než běžný pracovní den.");
      setText(outputs.readingText, "Výsledek může být správný u specifických směn, ale pro mzdu a bezpečnostní přestávky ho ověřte proti docházce a pravidlům zaměstnavatele.");
    } else if (result.crossesMidnight) {
      setText(outputs.statusBadge, "Směna přes půlnoc");
      setText(outputs.readingTitle, "Konec směny je započtený do dalšího dne.");
      setText(outputs.readingText, "U směny přes půlnoc zkontrolujte, zda zadáváte skutečný začátek a konec jedné směny, ne dvě oddělené směny.");
    } else {
      setText(outputs.statusBadge, "Směna vypadá standardně");
      setText(outputs.readingTitle, "Směna vypadá standardně.");
      setText(outputs.readingText, `Čistý čas směny je ${durationLabel(result.net)} a ${periodLabel(input)} při ${dayLabel(input.workDays)} vychází ${decimalHours(result.total)}.`);
    }

    const midnight = result.crossesMidnight ? " Směna přechází přes půlnoc, proto se konec počítá jako následující den." : "";
    setText(outputs.resultNote, `Čistý čas směny je ${durationLabel(result.net)}. ${periodLabel(input)} při ${dayLabel(input.workDays)} vychází ${decimalHours(result.total)}.${midnight}`);
    setText(outputs.detailText, `Výpočet: hrubá délka směny ${durationLabel(result.gross)} minus pauza ${input.breakMinutes} minut = čistý čas ${durationLabel(result.net)}.`);
  }

  function renderTable(input, result) {
    if (!outputs.workedTableBody) return;
    const rows = [
      ["Začátek směny", clock(input.startHour, input.startMinute), "Čas nástupu na směnu"],
      ["Konec směny", clock(input.endHour, input.endMinute), result.crossesMidnight ? "Konec je počítaný jako následující den" : "Čas odchodu ze směny"],
      ["Hrubá směna", durationLabel(result.gross), "Čas mezi začátkem a koncem"],
      ["Pauza", `${input.breakMinutes} min`, "Odečtená neplacená část"],
      ["Čistý čas", durationLabel(result.net), "Započtený pracovní čas"],
      ["Celkem", decimalHours(result.total), `Čistý čas × ${dayLabel(input.workDays)}`]
    ];
    outputs.workedTableBody.innerHTML = rows.map((row) => (
      `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`
    )).join("");
  }

  function renderBars(result) {
    const workShare = Math.max(0, Math.min(100, result.workShare));
    const breakShare = Math.max(0, Math.min(100, result.breakShare));
    setText(outputs.workShareText, `${pf.format(workShare)} %`);
    setText(outputs.breakShareText, `${pf.format(breakShare)} %`);
    setWidth(outputs.workShareBar, `${Math.max(4, workShare)}%`);
    setWidth(outputs.breakShareBar, `${Math.max(4, breakShare)}%`);
    setWidth(outputs.heroWorkBar, `${Math.max(8, Math.min(100, result.net / 720 * 100))}%`);
    setWidth(outputs.heroBreakBar, `${Math.max(4, Math.min(100, breakShare))}%`);
  }

  function render(input, result) {
    const startClock = clock(input.startHour, input.startMinute);
    const endClock = clock(input.endHour, input.endMinute);

    setText(outputs.statShift, durationLabel(result.net));
    setText(outputs.statGross, durationLabel(result.gross));
    setText(outputs.statPeriod, decimalHours(result.total));
    setText(outputs.rowStart, startClock);
    setText(outputs.rowEnd, endClock);
    setText(outputs.rowBreak, `${input.breakMinutes} min`);
    setText(outputs.rowNet, durationLabel(result.net));
    setText(outputs.rowDays, String(input.workDays));
    setText(outputs.rowTotal, decimalHours(result.total));

    setText(outputs.heroShift, durationLabel(result.net));
    setText(outputs.mobileHeroShift, durationLabel(result.net));
    setText(outputs.heroClock, `${startClock} → ${endClock}`);
    setText(outputs.heroStart, startClock);
    setText(outputs.heroEnd, endClock);
    setText(outputs.heroBreak, `${input.breakMinutes} min`);
    setText(outputs.heroPeriod, decimalHours(result.total));
    setText(outputs.heroDays, dayLabel(input.workDays));

    renderStatus(input, result);
    renderBars(result);
    renderTable(input, result);
  }

  function run() {
    const input = values();
    render(input, calculate(input));
  }

  document.querySelectorAll("[data-time-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const [start, end] = button.dataset.timePreset.split("-");
      const [sh, sm] = start.split(":");
      const [eh, em] = end.split(":");
      $("startHour").value = String(Number(sh));
      $("startMinute").value = String(Number(sm));
      $("endHour").value = String(Number(eh));
      $("endMinute").value = String(Number(em));
      run();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["startHour", "startMinute", "endHour", "endMinute", "breakMinutes", "workDays", "periodType"].forEach((id) => {
    const field = $(id);
    field.addEventListener("input", run);
    field.addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("startHour").value = "8";
    $("startMinute").value = "0";
    $("endHour").value = "16";
    $("endMinute").value = "30";
    $("breakMinutes").value = "30";
    $("workDays").value = "20";
    $("periodType").value = "month";
    run();
  });

  run();
})();
