(function () {
  const form = document.getElementById("vacationForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const outputs = {
    remainingHours: $("remainingHours"),
    remainingSummary: $("remainingSummary"),
    statusBadge: $("statusBadge"),
    annualHours: $("annualHours"),
    earnedHours: $("earnedHours"),
    usedOutput: $("usedOutput"),
    remainingDays: $("remainingDays"),
    annualDays: $("annualDays"),
    earnedDays: $("earnedDays"),
    summaryWeeks: $("summaryWeeks"),
    summaryWeeklyHours: $("summaryWeeklyHours"),
    summaryTableBody: $("summaryTableBody"),
    heroRemaining: $("heroRemaining"),
    heroEarned: $("heroEarned"),
    heroUsed: $("heroUsed"),
    heroDays: $("heroDays"),
    heroBar: $("heroBar")
  };

  function number(id) {
    return Number($(id).value.toString().replace(",", ".")) || 0;
  }

  function hours(value) {
    return `${nf.format(value)} h`;
  }

  function unit(value, one, few, many) {
    const absolute = Math.abs(value);
    if (Number.isInteger(absolute) && absolute === 1) return one;
    if (Number.isInteger(absolute) && absolute >= 2 && absolute <= 4) return few;
    if (Number.isInteger(absolute)) return many;
    return few;
  }

  function days(value) {
    const rounded = nf.format(value);
    return `${rounded} ${unit(value, "den", "dny", "dní")}`;
  }

  function weeks(value) {
    return `${nf.format(value)} ${unit(value, "týden", "týdny", "týdnů")}`;
  }

  function values() {
    return {
      weeklyHours: number("weeklyHours"),
      annualWeeks: number("annualWeeks"),
      monthsWorked: number("monthsWorked"),
      usedHours: number("usedHours"),
      workdayHours: number("workdayHours")
    };
  }

  function validate(input) {
    if (input.weeklyHours <= 0 || input.weeklyHours > 80) return "Zadejte platný týdenní úvazek.";
    if (input.annualWeeks <= 0 || input.annualWeeks > 10) return "Zadejte platný roční nárok v týdnech.";
    if (input.monthsWorked <= 0 || input.monthsWorked > 12) return "Počet odpracovaných měsíců musí být 1 až 12.";
    if (input.usedHours < 0) return "Vyčerpaná dovolená nemůže být záporná.";
    if (input.workdayHours <= 0 || input.workdayHours > 16) return "Zadejte platnou délku pracovního dne.";
    return "";
  }

  function calculate(input) {
    const annualHours = input.weeklyHours * input.annualWeeks;
    const earnedHours = annualHours * (input.monthsWorked / 12);
    const remainingHours = earnedHours - input.usedHours;
    return {
      annualHours,
      earnedHours,
      remainingHours,
      annualDays: annualHours / input.workdayHours,
      earnedDays: earnedHours / input.workdayHours,
      remainingDays: remainingHours / input.workdayHours,
      usageRatio: earnedHours > 0 ? input.usedHours / earnedHours : 0
    };
  }

  function renderTable(input, result) {
    outputs.summaryTableBody.innerHTML = [
      ["Roční nárok", hours(result.annualHours), `${weeks(input.annualWeeks)} × ${hours(input.weeklyHours)} úvazku`],
      ["Poměrná část", hours(result.earnedHours), `${input.monthsWorked} měsíců z 12`],
      ["Vyčerpáno", hours(input.usedHours), "Zadaná již použitá dovolená"],
      ["Zůstatek", hours(result.remainingHours), "Poměrný nárok minus vyčerpání"]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function render(input, result) {
    outputs.remainingHours.textContent = hours(result.remainingHours);
    outputs.annualHours.textContent = hours(result.annualHours);
    outputs.earnedHours.textContent = hours(result.earnedHours);
    outputs.usedOutput.textContent = hours(input.usedHours);
    outputs.remainingDays.textContent = days(result.remainingDays);
    outputs.annualDays.textContent = days(result.annualDays);
    outputs.earnedDays.textContent = days(result.earnedDays);
    outputs.summaryWeeks.textContent = weeks(input.annualWeeks);
    outputs.summaryWeeklyHours.textContent = hours(input.weeklyHours);

    if (result.remainingHours < 0) {
      outputs.statusBadge.textContent = "Dovolená vychází přečerpaná";
      outputs.statusBadge.className = "badge warning";
      outputs.remainingSummary.textContent = `Podle zadaných hodnot je vyčerpáno o ${hours(Math.abs(result.remainingHours))} více, než odpovídá poměrné části. Ověřte pravidla u zaměstnavatele.`;
    } else if (result.remainingHours <= input.workdayHours) {
      outputs.statusBadge.textContent = "Zbývá už jen malá rezerva";
      outputs.statusBadge.className = "badge warning";
      outputs.remainingSummary.textContent = `Zbývá přibližně ${days(result.remainingDays)}. Pokud plánujete volno, zkontrolujte ještě směny a interní evidenci dovolené.`;
    } else {
      outputs.statusBadge.textContent = "Zůstatek dovolené je orientačně v pořádku";
      outputs.statusBadge.className = "badge success";
      outputs.remainingSummary.textContent = `Zbývá přibližně ${hours(result.remainingHours)}, tedy ${days(result.remainingDays)} při délce pracovního dne ${hours(input.workdayHours)}.`;
    }

    outputs.heroRemaining.textContent = hours(result.remainingHours);
    outputs.heroEarned.textContent = hours(result.earnedHours);
    outputs.heroUsed.textContent = hours(input.usedHours);
    outputs.heroDays.textContent = days(result.remainingDays);
    outputs.heroBar.style.width = `${Math.max(8, Math.min(100, (1 - result.usageRatio) * 100))}%`;
    renderTable(input, result);
  }

  function run() {
    const input = values();
    const error = validate(input);
    if (error) {
      outputs.statusBadge.textContent = error;
      outputs.statusBadge.className = "badge warning";
      return;
    }
    render(input, calculate(input));
  }

  document.querySelectorAll("[data-vacation-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.vacationPreset;
      if (preset === "full") {
        $("weeklyHours").value = 40;
        $("annualWeeks").value = 5;
        $("monthsWorked").value = 12;
        $("usedHours").value = 40;
        $("workdayHours").value = 8;
      }
      if (preset === "part") {
        $("weeklyHours").value = 30;
        $("annualWeeks").value = 5;
        $("monthsWorked").value = 6;
        $("usedHours").value = 16;
        $("workdayHours").value = 6;
      }
      if (preset === "new") {
        $("weeklyHours").value = 40;
        $("annualWeeks").value = 5;
        $("monthsWorked").value = 3;
        $("usedHours").value = 0;
        $("workdayHours").value = 8;
      }
      run();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["weeklyHours", "annualWeeks", "monthsWorked", "usedHours", "workdayHours"].forEach((id) => {
    const field = $(id);
    field.addEventListener("input", run);
    field.addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("weeklyHours").value = 40;
    $("annualWeeks").value = 5;
    $("monthsWorked").value = 12;
    $("usedHours").value = 0;
    $("workdayHours").value = 8;
    run();
  });

  run();
})();
