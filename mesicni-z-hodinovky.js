(function () {
  const form = document.getElementById("monthlyFromHourlyForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
  const hours = (value) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(value)} h`;

  function values() {
    return {
      hourlyRate: Number($("hourlyRate").value) || 0,
      hoursPerWeek: Number($("hoursPerWeek").value) || 0,
      weeksPerMonth: Number($("weeksPerMonth").value) || 0,
      hoursPerMonthOverride: Number($("hoursPerMonthOverride").value) || 0
    };
  }

  function calculate(input) {
    const hoursPerMonth = input.hoursPerMonthOverride > 0 ? input.hoursPerMonthOverride : input.hoursPerWeek * input.weeksPerMonth;
    const weeklyPay = Math.round(input.hourlyRate * input.hoursPerWeek);
    const monthlyPay = Math.round(input.hourlyRate * hoursPerMonth);
    const yearlyPay = monthlyPay * 12;
    return {
      hoursPerMonth,
      hoursPerYear: hoursPerMonth * 12,
      weeklyPay,
      monthlyPay,
      yearlyPay,
      dayPay: Math.round(input.hourlyRate * 8),
      longShiftPay: Math.round(input.hourlyRate * 12)
    };
  }

  function renderTable(input, result) {
    $("summaryRows").innerHTML = [
      ["Hodinová sazba", money(input.hourlyRate), "Základní odměna za hodinu"],
      ["Hodin týdně", hours(input.hoursPerWeek), "Zadaný týdenní fond"],
      ["Hodin za měsíc", hours(result.hoursPerMonth), input.hoursPerMonthOverride > 0 ? "Ručně zadaný měsíční fond" : "Přepočet z týdnů v měsíci"],
      ["Týdenní odměna", money(result.weeklyPay), "Sazba × hodiny týdně"],
      ["Měsíční mzda", money(result.monthlyPay), "Sazba × hodiny za měsíc"],
      ["Roční mzda", money(result.yearlyPay), "Orientační odhad za 12 měsíců"]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function render(input, result) {
    $("monthlyPayResult").textContent = money(result.monthlyPay);
    $("yearlyPayResult").textContent = money(result.yearlyPay);
    $("weeklyPayResult").textContent = money(result.weeklyPay);
    $("shiftPayResult").textContent = money(result.dayPay);
    $("hourlyRateResult").textContent = money(input.hourlyRate);
    $("hoursPerWeekResult").textContent = hours(input.hoursPerWeek);
    $("hoursPerMonthResult").textContent = hours(result.hoursPerMonth);
    $("hoursPerYearResult").textContent = hours(result.hoursPerYear);
    $("dayPayResult").textContent = money(result.dayPay);
    $("longShiftPayResult").textContent = money(result.longShiftPay);
    $("resultBadge").textContent = input.hoursPerMonthOverride > 0 ? "Použit vlastní měsíční fond" : "Použit průměrný fond";
    $("resultBadge").className = "badge success";
    $("resultNote").textContent = `Při hodinové sazbě ${money(input.hourlyRate)} a měsíčním fondu ${hours(result.hoursPerMonth)} vychází orientační měsíční mzda ${money(result.monthlyPay)}.`;
    $("heroMonthly").textContent = money(result.monthlyPay);
    $("heroWeekly").textContent = money(result.weeklyPay);
    $("heroYearly").textContent = money(result.yearlyPay);
    $("heroHours").textContent = hours(result.hoursPerMonth);
    $("heroBar").style.width = `${Math.max(8, Math.min(100, result.hoursPerMonth / 180 * 100))}%`;
    renderTable(input, result);
  }

  function run() {
    const input = values();
    render(input, calculate(input));
  }

  document.querySelectorAll("[data-hourly-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.hourlyPreset;
      if (preset === "standard") {
        $("hourlyRate").value = 220;
        $("hoursPerWeek").value = 40;
        $("weeksPerMonth").value = 4.33;
        $("hoursPerMonthOverride").value = "";
      }
      if (preset === "part-time") {
        $("hourlyRate").value = 220;
        $("hoursPerWeek").value = 20;
        $("weeksPerMonth").value = 4.33;
        $("hoursPerMonthOverride").value = "";
      }
      if (preset === "custom-hours") {
        $("hourlyRate").value = 220;
        $("hoursPerWeek").value = 40;
        $("weeksPerMonth").value = 4.33;
        $("hoursPerMonthOverride").value = 168;
      }
      run();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["hourlyRate", "hoursPerWeek", "weeksPerMonth", "hoursPerMonthOverride"].forEach((id) => {
    $(id).addEventListener("input", run);
    $(id).addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("hourlyRate").value = 220;
    $("hoursPerWeek").value = 40;
    $("weeksPerMonth").value = 4.33;
    $("hoursPerMonthOverride").value = "";
    run();
  });

  run();
})();
