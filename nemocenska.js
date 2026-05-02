(function () {
  const form = document.getElementById("sickForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const RULES_2026 = {
    dailyThresholds: [1633, 2449, 4897],
    hourlyThresholds: [285.78, 428.58, 856.98]
  };

  function money(value, whole) {
    return new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      minimumFractionDigits: whole ? 0 : 2,
      maximumFractionDigits: whole ? 0 : 2
    }).format(value);
  }

  function nf(value, digits) {
    return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits ?? 2 }).format(value);
  }

  function values() {
    return {
      avgHourlyEarnings: Number($("avgHourlyEarnings").value) || 0,
      avgMonthlyGross: Number($("avgMonthlyGross").value) || 0,
      missedHoursFirst14: Number($("missedHoursFirst14").value) || 0,
      totalSickDays: Number($("totalSickDays").value) || 0,
      roundWhole: $("roundMode").value === "whole"
    };
  }

  function reduceBase(value, thresholds) {
    const [t1, t2, t3] = thresholds;
    let reduced = Math.min(value, t1) * 0.9;
    if (value > t1) reduced += Math.max(0, Math.min(value, t2) - t1) * 0.6;
    if (value > t2) reduced += Math.max(0, Math.min(value, t3) - t2) * 0.3;
    return reduced;
  }

  function calculate(input) {
    const reducedHourly = reduceBase(input.avgHourlyEarnings, RULES_2026.hourlyThresholds);
    const wageCompensation = reducedHourly * input.missedHoursFirst14 * 0.6;
    const estimatedDVZ = (input.avgMonthlyGross * 12) / 365;
    const reducedDVZ = reduceBase(estimatedDVZ, RULES_2026.dailyThresholds);
    const days15to30 = Math.max(0, Math.min(input.totalSickDays, 30) - 14);
    const days31to60 = Math.max(0, Math.min(input.totalSickDays, 60) - 30);
    const days61plus = Math.max(0, input.totalSickDays - 60);
    const benefit15to30 = days15to30 * reducedDVZ * 0.6;
    const benefit31to60 = days31to60 * reducedDVZ * 0.66;
    const benefit61plus = days61plus * reducedDVZ * 0.72;
    const sicknessBenefit = benefit15to30 + benefit31to60 + benefit61plus;
    const totalCompensation = wageCompensation + sicknessBenefit;
    const totalBenefitDays = days15to30 + days31to60 + days61plus;
    return {
      reducedHourly,
      wageCompensation,
      estimatedDVZ,
      reducedDVZ,
      days15to30,
      days31to60,
      days61plus,
      benefit15to30,
      benefit31to60,
      benefit61plus,
      sicknessBenefit,
      totalCompensation,
      avgDailyBenefit: totalBenefitDays > 0 ? sicknessBenefit / totalBenefitDays : 0
    };
  }

  function renderTable(input, result) {
    $("breakdownBody").innerHTML = [
      ["Průměrný hodinový výdělek", money(input.avgHourlyEarnings, input.roundWhole), "Vstup pro prvních 14 dní"],
      ["Redukovaný hodinový výdělek", money(result.reducedHourly, input.roundWhole), "Upravený hodinový základ"],
      ["Náhrada mzdy", money(result.wageCompensation, input.roundWhole), "60 % z redukovaného hodinového výdělku"],
      ["Odhad DVZ", money(result.estimatedDVZ, input.roundWhole), "Orientační denní základ z měsíční mzdy"],
      ["Redukovaný DVZ", money(result.reducedDVZ, input.roundWhole), "Denní základ pro nemocenské"],
      ["Dny 15-30", money(result.benefit15to30, input.roundWhole), `${result.days15to30} dní × 60 %`],
      ["Dny 31-60", money(result.benefit31to60, input.roundWhole), `${result.days31to60} dní × 66 %`],
      ["Dny 61+", money(result.benefit61plus, input.roundWhole), `${result.days61plus} dní × 72 %`],
      ["Celkem", money(result.totalCompensation, input.roundWhole), "Náhrada mzdy plus nemocenské"]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function render(input, result) {
    $("totalCompensation").textContent = money(result.totalCompensation, input.roundWhole);
    $("wageCompensation").textContent = money(result.wageCompensation, input.roundWhole);
    $("sicknessBenefit").textContent = money(result.sicknessBenefit, input.roundWhole);
    $("avgDailyBenefit").textContent = money(result.avgDailyBenefit, input.roundWhole);
    $("reducedHourly").textContent = money(result.reducedHourly, input.roundWhole);
    $("estimatedDVZ").textContent = money(result.estimatedDVZ, input.roundWhole);
    $("reducedDVZ").textContent = money(result.reducedDVZ, input.roundWhole);
    $("days15to30").textContent = String(result.days15to30);
    $("days31to60").textContent = String(result.days31to60);
    $("days61plus").textContent = String(result.days61plus);
    $("statusBadge").textContent = input.totalSickDays <= 14 ? "Jen náhrada mzdy" : "Náhrada mzdy + nemocenské";
    $("statusBadge").className = input.totalSickDays <= 14 ? "badge warning" : "badge success";
    $("resultNote").textContent = input.totalSickDays <= 14
      ? "Podle zadané délky neschopnosti se počítá jen orientační náhrada mzdy za zameškané pracovní hodiny."
      : `Za ${nf(input.totalSickDays, 0)} kalendářních dnů vychází orientační součet náhrady mzdy a nemocenského ${money(result.totalCompensation, input.roundWhole)}.`;
    $("heroTotal").textContent = money(result.totalCompensation, input.roundWhole);
    $("heroWage").textContent = money(result.wageCompensation, input.roundWhole);
    $("heroBenefit").textContent = money(result.sicknessBenefit, input.roundWhole);
    $("heroDays").textContent = `${nf(input.totalSickDays, 0)} dní`;
    $("heroBar").style.width = `${Math.max(8, Math.min(100, input.totalSickDays / 60 * 100))}%`;
    renderTable(input, result);
  }

  function run() {
    render(values(), calculate(values()));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["avgHourlyEarnings", "avgMonthlyGross", "missedHoursFirst14", "totalSickDays", "roundMode"].forEach((id) => {
    $(id).addEventListener("input", run);
    $(id).addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("avgHourlyEarnings").value = 220;
    $("avgMonthlyGross").value = 38000;
    $("missedHoursFirst14").value = 56;
    $("totalSickDays").value = 30;
    $("roundMode").value = "exact";
    run();
  });

  run();
})();
