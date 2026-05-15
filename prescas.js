(function () {
  const form = document.getElementById("overtimeForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value, roundWhole) => new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: roundWhole ? 0 : 2
  }).format(Number.isFinite(value) ? value : 0);
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function number(id) {
    const element = $(id);
    return Number((element ? element.value : "0").toString().replace(",", ".")) || 0;
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
    if (input.overtimeType === "weekend") return "Víkend / vyšší sazba";
    if (input.overtimeType === "holiday") return "Svátek nebo 100% sazba";
    return `Vlastní příplatek ${nf.format(rate)} %`;
  }

  function hoursLabel(hours) {
    const normalized = Math.abs(hours);
    if (normalized === 1) return `${nf.format(hours)} hodinu`;
    if (normalized > 1 && normalized < 5) return `${nf.format(hours)} hodiny`;
    return `${nf.format(hours)} hodin`;
  }

  function calculate(input) {
    const hourly = input.rateMode === "monthly"
      ? input.monthlySalary / Math.max(1, input.monthlyHours)
      : input.hourlyRate;
    const rate = percent(input);
    const basePay = hourly * input.overtimeHours;
    const bonusPay = basePay * rate / 100;
    const totalPay = basePay + bonusPay;
    const averagePerHour = input.overtimeHours > 0 ? totalPay / input.overtimeHours : 0;
    const bonusPerHour = input.overtimeHours > 0 ? bonusPay / input.overtimeHours : 0;
    const bonusShare = totalPay > 0 ? bonusPay / totalPay * 100 : 0;
    return { hourly, rate, basePay, bonusPay, totalPay, averagePerHour, bonusPerHour, bonusShare };
  }

  function renderBreakdown(input, result) {
    const body = $("breakdownBody");
    if (!body) return;
    const source = input.rateMode === "monthly"
      ? "Dopočteno z měsíční mzdy a zadaného fondu hodin"
      : "Zadaná hrubá hodinová sazba";
    body.innerHTML = [
      ["Hodinová sazba", money(result.hourly, input.roundWhole), source],
      ["Přesčasové hodiny", `${nf.format(input.overtimeHours)} h`, "Hodiny, které v modelu řešíte jako přesčas"],
      ["Základ za přesčas", money(result.basePay, input.roundWhole), "Hodinová sazba × počet přesčasových hodin"],
      ["Sazba příplatku", `${nf.format(result.rate)} %`, typeLabel(input, result.rate)],
      ["Příplatek", money(result.bonusPay, input.roundWhole), `${nf.format(result.rate)} % ze základu za přesčas`],
      ["Celkem hrubě", money(result.totalPay, input.roundWhole), "Základ plus příplatek před daní a odvody"]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function updateVisibility() {
    const mode = $("rateMode").value;
    $("hourlyRateField").classList.toggle("hidden", mode !== "hourly");
    $("monthlySalaryField").classList.toggle("hidden", mode !== "monthly");
    $("monthlyHoursField").classList.toggle("hidden", mode !== "monthly");
    $("customRateField").classList.toggle("hidden", $("overtimeType").value !== "custom");
  }

  function statusText(input, result) {
    if (input.overtimeHours <= 0 || result.hourly <= 0) return "Doplňte sazbu a hodiny";
    if (result.rate >= 100) return "Vysoký příplatek";
    if (result.rate >= 50) return "Vyšší příplatek";
    return "Běžný orientační výpočet";
  }

  function decisionText(input, result) {
    if (input.overtimeHours <= 0 || result.hourly <= 0) {
      return "Zadejte sazbu a počet hodin, aby šel přesčas porovnat s páskou.";
    }
    if (result.bonusShare >= 45) {
      return "Příplatek tvoří výraznou část výsledku. Ověřte hlavně procento a to, zda místo peněz není dohodnuté náhradní volno.";
    }
    if (input.rateMode === "monthly") {
      return "U měsíční mzdy je klíčový fond hodin. Jiný fond změní hodinovou sazbu i celý výsledek.";
    }
    return "Výsledek je vhodný jako rychlá kontrola, zda páska obsahuje základ za přesčas i odpovídající příplatek.";
  }

  function focusText(input, result) {
    if (result.rate >= 100) return "Zaměřte se na souběh se svátkem, víkendem nebo interní dohodou. U takto vysoké sazby bývá největší riziko ve špatném režimu.";
    if (input.rateMode === "monthly") return "Nejcitlivější vstup je měsíční fond hodin. Pokud je na pásce jiný fond nebo průměr, výsledek se změní.";
    return "Nejcitlivější vstupy jsou počet přesčasových hodin a sazba příplatku. Tyto dvě hodnoty porovnejte s docházkou a smlouvou.";
  }

  function render(input, result) {
    setText("totalOvertimePay", money(result.totalPay, input.roundWhole));
    setText("basePay", money(result.basePay, input.roundWhole));
    setText("bonusPay", money(result.bonusPay, input.roundWhole));
    setText("averagePerHour", money(result.averagePerHour, input.roundWhole));
    setText("summaryHourlyRate", money(result.hourly, input.roundWhole));
    setText("summaryHours", `${nf.format(input.overtimeHours)} h`);
    setText("summaryPercent", `${nf.format(result.rate)} %`);
    setText("summaryMode", input.rateMode === "monthly" ? "Měsíční mzda" : "Hodinová sazba");
    setText("summaryType", typeLabel(input, result.rate));
    setText("overtimeBonusShare", `${nf.format(result.bonusShare)} %`);
    setText("overtimeExtraPerHour", money(result.bonusPerHour, input.roundWhole));
    setText("overtimePeriodImpact", money(result.totalPay, input.roundWhole));
    setText("decisionText", decisionText(input, result));
    setText("overtimeCheckFocus", focusText(input, result));

    const status = $("statusBadge");
    if (status) {
      status.textContent = statusText(input, result);
      status.className = result.rate >= 50 ? "badge warning" : "badge success";
    }

    setText("resultNote", `Za ${hoursLabel(input.overtimeHours)} přesčasu vychází základ ${money(result.basePay, input.roundWhole)} a příplatek ${money(result.bonusPay, input.roundWhole)}. Celkový hrubý dopad je ${money(result.totalPay, input.roundWhole)}. Před kontrolou pásky ověřte evidenci hodin, sazbu příplatku a případné náhradní volno.`);

    setText("heroTotal", money(result.totalPay, input.roundWhole));
    setText("heroBase", money(result.basePay, input.roundWhole));
    setText("heroBonus", money(result.bonusPay, input.roundWhole));
    setText("heroRate", `${nf.format(result.rate)} %`);
    setText("heroHours", `${nf.format(input.overtimeHours)} h`);
    setText("heroMode", input.rateMode === "monthly" ? "Měsíční mzda" : "Hodinová sazba");
    const bar = $("heroBar");
    if (bar) bar.style.width = `${Math.max(12, Math.min(100, result.rate))}%`;

    renderBreakdown(input, result);
  }

  function run() {
    updateVisibility();
    const input = values();
    render(input, calculate(input));
  }

  function setPreset(name) {
    if (name === "weekday") {
      $("rateMode").value = "hourly";
      $("overtimeType").value = "weekday";
      $("overtimeHours").value = "8";
    }
    if (name === "weekend") {
      $("rateMode").value = "hourly";
      $("overtimeType").value = "weekend";
      $("overtimeHours").value = "8";
    }
    if (name === "holiday") {
      $("rateMode").value = "hourly";
      $("overtimeType").value = "holiday";
      $("overtimeHours").value = "8";
    }
    if (name === "monthly") {
      $("rateMode").value = "monthly";
      $("monthlySalary").value = "42000";
      $("monthlyHours").value = "168";
      $("overtimeType").value = "weekday";
      $("overtimeHours").value = "10";
    }
    run();
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

  document.querySelectorAll("[data-overtime-preset]").forEach((button) => {
    button.addEventListener("click", () => setPreset(button.dataset.overtimePreset));
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
