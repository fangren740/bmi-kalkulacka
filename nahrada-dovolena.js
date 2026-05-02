(function () {
  const form = document.getElementById("vacationPayForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });

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
    return `${nf.format(value)} ${unit(value, "den", "dny", "dní")}`;
  }

  function values() {
    return {
      averageHourlyWage: Number($("averageHourlyWage").value) || 0,
      hoursPerDay: Number($("hoursPerDay").value) || 0,
      inputMode: $("inputMode").value,
      vacationAmount: Number($("vacationAmount").value) || 0,
      deductionRate: Number($("deductionRate").value) || 0,
      weekDays: Number($("weekDays").value) || 0
    };
  }

  function calculate(input) {
    const vacationHours = input.inputMode === "hours" ? input.vacationAmount : input.vacationAmount * input.hoursPerDay;
    const vacationDays = input.hoursPerDay > 0 ? vacationHours / input.hoursPerDay : 0;
    const grossVacationPay = input.averageHourlyWage * vacationHours;
    const netVacationPay = grossVacationPay * (1 - input.deductionRate / 100);
    const dailyVacationPay = input.averageHourlyWage * input.hoursPerDay;
    const weeklyVacationPay = dailyVacationPay * input.weekDays;
    return { vacationHours, vacationDays, grossVacationPay, netVacationPay, dailyVacationPay, weeklyVacationPay };
  }

  function renderTable(input, result) {
    $("summaryTableBody").innerHTML = [
      ["Průměrný hodinový výdělek", money(input.averageHourlyWage), "Zadaný základ pro náhradu mzdy"],
      ["Rozsah dovolené", `${hours(result.vacationHours)} / ${days(result.vacationDays)}`, "Přepočet dovolené na hodiny a dny"],
      ["Hrubá náhrada", money(result.grossVacationPay), "Hodinový výdělek × hodiny dovolené"],
      ["Po zadané srážce", money(result.netVacationPay), "Jen orientační pomocný odhad"],
      ["Týden dovolené", money(result.weeklyVacationPay), "Denní náhrada × pracovní dny v týdnu"]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function render(input, result) {
    $("grossVacationPay").textContent = money(result.grossVacationPay);
    $("netVacationPay").textContent = money(result.netVacationPay);
    $("dailyVacationPay").textContent = money(result.dailyVacationPay);
    $("hourlyVacationPay").textContent = money(input.averageHourlyWage);
    $("weeklyVacationPay").textContent = money(result.weeklyVacationPay);
    $("vacationHoursOutput").textContent = hours(result.vacationHours);
    $("vacationDaysOutput").textContent = days(result.vacationDays);
    $("averageWageOutput").textContent = money(input.averageHourlyWage);
    $("modeOutput").textContent = input.inputMode === "hours" ? "Zadáno v hodinách" : "Zadáno ve dnech";
    $("statusBadge").textContent = "Orientační náhrada mzdy je spočítaná";
    $("resultNote").textContent = `Za ${hours(result.vacationHours)} dovolené vychází orientační náhrada ${money(result.grossVacationPay)}. Skutečná výplata se může lišit podle průměrného výdělku používaného zaměstnavatelem.`;
    $("heroPay").textContent = money(result.grossVacationPay);
    $("heroHours").textContent = hours(result.vacationHours);
    $("heroDaily").textContent = money(result.dailyVacationPay);
    $("heroWeek").textContent = money(result.weeklyVacationPay);
    $("heroBar").style.width = `${Math.max(8, Math.min(100, result.vacationHours / 40 * 100))}%`;
    renderTable(input, result);
  }

  function run() {
    render(values(), calculate(values()));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["averageHourlyWage", "hoursPerDay", "inputMode", "vacationAmount", "deductionRate", "weekDays"].forEach((id) => {
    $(id).addEventListener("input", run);
    $(id).addEventListener("change", run);
  });

  document.querySelectorAll("[data-vacation-pay-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.vacationPayPreset;
      if (preset === "two-days") {
        $("inputMode").value = "days";
        $("vacationAmount").value = 2;
      }
      if (preset === "week") {
        $("inputMode").value = "days";
        $("vacationAmount").value = 5;
      }
      if (preset === "hours") {
        $("inputMode").value = "hours";
        $("vacationAmount").value = 16;
      }
      run();
    });
  });

  $("resetBtn").addEventListener("click", () => {
    $("averageHourlyWage").value = 265;
    $("hoursPerDay").value = 8;
    $("inputMode").value = "hours";
    $("vacationAmount").value = 16;
    $("deductionRate").value = 0;
    $("weekDays").value = 5;
    run();
  });

  run();
})();
