(function () {
  const form = document.getElementById("overtimeForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value, roundWhole) => new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: roundWhole ? 0 : 2
  }).format(value);
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });

  function number(id) {
    return Number($(id).value.toString().replace(",", ".")) || 0;
  }

  function values() {
    return {
      rateMode: $("rateMode").value,
      hourlyRate: number("hourlyRate"),
      monthlySalary: number("monthlySalary"),
      monthlyHours: number("monthlyHours"),
      overtimeHours: number("overtimeHours"),
      overtimeType: $("overtimeType").value,
      customRate: number("customRate"),
      roundWhole: $("roundWholeCrown").checked
    };
  }

  function percent(input) {
    if (input.overtimeType === "weekday") return 25;
    if (input.overtimeType === "weekend") return 50;
    if (input.overtimeType === "holiday") return 100;
    return Math.max(0, input.customRate);
  }

  function typeLabel(input, rate) {
    if (input.overtimeType === "weekday") return "Běžný přesčas";
    if (input.overtimeType === "weekend") return "Víkend nebo vyšší příplatek";
    if (input.overtimeType === "holiday") return "Svátek nebo 100% příplatek";
    return `Vlastní příplatek ${nf.format(rate)} %`;
  }

  function calculate(input) {
    const hourly = input.rateMode === "monthly" ? input.monthlySalary / Math.max(1, input.monthlyHours) : input.hourlyRate;
    const rate = percent(input);
    const basePay = hourly * input.overtimeHours;
    const bonusPay = basePay * rate / 100;
    const totalPay = basePay + bonusPay;
    return {
      hourly,
      rate,
      basePay,
      bonusPay,
      totalPay,
      averagePerHour: input.overtimeHours > 0 ? totalPay / input.overtimeHours : 0
    };
  }

  function renderBreakdown(input, result) {
    $("breakdownBody").innerHTML = [
      ["Hodinová sazba", money(result.hourly, input.roundWhole), input.rateMode === "monthly" ? "Dopočteno z měsíční mzdy a fondu hodin" : "Zadaná hodinová mzda"],
      ["Základ za přesčas", money(result.basePay, input.roundWhole), "Hodinová sazba × počet přesčasových hodin"],
      ["Příplatek", money(result.bonusPay, input.roundWhole), `${nf.format(result.rate)} % ze základu`],
      ["Celkem", money(result.totalPay, input.roundWhole), "Základ plus příplatek"]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function updateVisibility() {
    const mode = $("rateMode").value;
    $("hourlyRateField").classList.toggle("hidden", mode !== "hourly");
    $("monthlySalaryField").classList.toggle("hidden", mode !== "monthly");
    $("monthlyHoursField").classList.toggle("hidden", mode !== "monthly");
    $("customRateField").classList.toggle("hidden", $("overtimeType").value !== "custom");
  }

  function render(input, result) {
    $("totalOvertimePay").textContent = money(result.totalPay, input.roundWhole);
    $("basePay").textContent = money(result.basePay, input.roundWhole);
    $("bonusPay").textContent = money(result.bonusPay, input.roundWhole);
    $("averagePerHour").textContent = money(result.averagePerHour, input.roundWhole);
    $("summaryHourlyRate").textContent = money(result.hourly, input.roundWhole);
    $("summaryHours").textContent = `${nf.format(input.overtimeHours)} h`;
    $("summaryPercent").textContent = `${nf.format(result.rate)} %`;
    $("summaryMode").textContent = input.rateMode === "monthly" ? "Měsíční mzda" : "Hodinová sazba";
    $("summaryType").textContent = typeLabel(input, result.rate);
    $("statusBadge").textContent = result.rate >= 50 ? "Vyšší příplatek" : "Běžný orientační výpočet";
    $("statusBadge").className = result.rate >= 50 ? "badge warning" : "badge success";
    $("resultNote").textContent = `Za ${nf.format(input.overtimeHours)} hodin přesčasu vychází základ ${money(result.basePay, input.roundWhole)} a příplatek ${money(result.bonusPay, input.roundWhole)}. Výsledek je orientační; v praxi ověřte smlouvu, kolektivní dohodu a pravidla náhradního volna.`;
    $("heroTotal").textContent = money(result.totalPay, input.roundWhole);
    $("heroBase").textContent = money(result.basePay, input.roundWhole);
    $("heroBonus").textContent = money(result.bonusPay, input.roundWhole);
    $("heroRate").textContent = `${nf.format(result.rate)} %`;
    $("heroBar").style.width = `${Math.max(8, Math.min(100, result.rate))}%`;
    renderBreakdown(input, result);
  }

  function run() {
    updateVisibility();
    const input = values();
    render(input, calculate(input));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["rateMode", "hourlyRate", "monthlySalary", "monthlyHours", "overtimeHours", "overtimeType", "customRate", "roundWholeCrown"].forEach((id) => {
    const field = $(id);
    field.addEventListener("input", run);
    field.addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("rateMode").value = "hourly";
    $("hourlyRate").value = "180";
    $("monthlySalary").value = "32000";
    $("monthlyHours").value = "168";
    $("overtimeHours").value = "8";
    $("overtimeType").value = "weekday";
    $("customRate").value = "25";
    $("roundWholeCrown").checked = true;
    run();
  });

  run();
})();
