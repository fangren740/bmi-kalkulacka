(function () {
  const form = document.getElementById("workedHoursForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const nf = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

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
    return { gross, net, total, crossesMidnight: endRaw <= start };
  }

  function periodLabel(input) {
    if (input.periodType === "week") return "týdenní součet";
    if (input.periodType === "month") return "měsíční součet";
    return "součet za zadané období";
  }

  function render(input, result) {
    $("statShift").textContent = durationLabel(result.net);
    $("statDay").textContent = decimalHours(result.net);
    $("statPeriod").textContent = decimalHours(result.total);
    $("rowStart").textContent = clock(input.startHour, input.startMinute);
    $("rowEnd").textContent = clock(input.endHour, input.endMinute);
    $("rowGross").textContent = durationLabel(result.gross);
    $("rowBreak").textContent = `${input.breakMinutes} min`;
    $("rowNet").textContent = durationLabel(result.net);
    $("rowDays").textContent = String(input.workDays);
    $("rowTotal").textContent = decimalHours(result.total);
    $("heroShift").textContent = durationLabel(result.net);
    $("heroPeriod").textContent = decimalHours(result.total);
    $("heroBreak").textContent = `${input.breakMinutes} min`;
    $("heroDays").textContent = `${input.workDays} dní`;
    $("heroBar").style.width = `${Math.max(8, Math.min(100, result.net / 720 * 100))}%`;

    const midnight = result.crossesMidnight ? " Směna přechází přes půlnoc, proto se konec počítá jako další den." : "";
    $("resultNote").textContent = `Čistý čas směny je ${durationLabel(result.net)}. ${periodLabel(input)} při ${input.workDays} dnech vychází ${decimalHours(result.total)}.${midnight}`;
    $("detailText").textContent = `Výpočet: hrubá délka směny ${durationLabel(result.gross)} minus pauza ${input.breakMinutes} minut = čistý čas ${durationLabel(result.net)}.`;
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
