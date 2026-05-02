(function () {
  const form = document.getElementById("shiftForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value, whole) => new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: whole ? 0 : 2,
    minimumFractionDigits: whole ? 0 : 2
  }).format(value);
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });

  function presetPercent(type) {
    if (type === "nightPercent") return 10;
    if (type === "weekendPercent") return 10;
    if (type === "holidayPercent") return 100;
    return null;
  }

  function shiftLabel(type) {
    if (type === "nightPercent") return "Noční práce";
    if (type === "weekendPercent") return "Víkend";
    if (type === "holidayPercent") return "Svátek";
    if (type === "customPercent") return "Vlastní procentní příplatek";
    if (type === "customFixed") return "Pevný příplatek za hodinu";
    return "Směna";
  }

  function updateFields() {
    const type = $("shiftType").value;
    const isFixed = type === "customFixed";
    $("percentRateField").classList.toggle("hidden", isFixed);
    $("fixedRateField").classList.toggle("hidden", !isFixed);
    const preset = presetPercent(type);
    if (preset !== null) $("percentRate").value = preset;
  }

  function values() {
    return {
      hourlyRate: Number($("hourlyRate").value) || 0,
      hoursWorked: Number($("hoursWorked").value) || 0,
      shiftType: $("shiftType").value,
      percentRate: Number($("percentRate").value) || 0,
      fixedRate: Number($("fixedRate").value) || 0,
      roundWhole: $("roundWhole").checked
    };
  }

  function calculate(input) {
    const basePay = input.hourlyRate * input.hoursWorked;
    const isFixed = input.shiftType === "customFixed";
    const bonusPay = isFixed ? input.fixedRate * input.hoursWorked : basePay * input.percentRate / 100;
    const totalPay = basePay + bonusPay;
    return {
      basePay,
      bonusPay,
      totalPay,
      averageHourlyPay: input.hoursWorked > 0 ? totalPay / input.hoursWorked : 0,
      modeLabel: isFixed ? "Pevná částka za hodinu" : "Procento ze základní sazby",
      bonusValueLabel: isFixed ? `${money(input.fixedRate, input.roundWhole)} / h` : `${nf.format(input.percentRate)} %`,
      shiftLabel: shiftLabel(input.shiftType)
    };
  }

  function renderTable(input, result) {
    $("breakdownBody").innerHTML = [
      ["Základní odměna", money(result.basePay, input.roundWhole), `${nf.format(input.hoursWorked)} h × ${money(input.hourlyRate, input.roundWhole)}`],
      ["Příplatek", money(result.bonusPay, input.roundWhole), `${result.modeLabel} (${result.bonusValueLabel})`],
      ["Celková odměna", money(result.totalPay, input.roundWhole), "Základ plus příplatek"],
      ["Průměr za hodinu", money(result.averageHourlyPay, input.roundWhole), "Celková odměna dělená hodinami"]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function render(input, result) {
    $("totalPay").textContent = money(result.totalPay, input.roundWhole);
    $("basePay").textContent = money(result.basePay, input.roundWhole);
    $("bonusPay").textContent = money(result.bonusPay, input.roundWhole);
    $("averageHourlyPay").textContent = money(result.averageHourlyPay, input.roundWhole);
    $("summaryHourlyRate").textContent = money(input.hourlyRate, input.roundWhole);
    $("summaryHours").textContent = `${nf.format(input.hoursWorked)} h`;
    $("summaryShiftType").textContent = result.shiftLabel;
    $("summaryMode").textContent = result.modeLabel;
    $("summaryBonusValue").textContent = result.bonusValueLabel;
    $("statusBadge").textContent = result.bonusPay > 0 ? "Zahrnut příplatek" : "Bez příplatku";
    $("statusBadge").className = result.bonusPay > 0 ? "badge warning" : "badge success";
    $("resultNote").textContent = `Za ${nf.format(input.hoursWorked)} hodin v režimu ${result.shiftLabel.toLowerCase()} vychází základ ${money(result.basePay, input.roundWhole)} a příplatek ${money(result.bonusPay, input.roundWhole)}. Výsledek je orientační a je potřeba ověřit souběhy příplatků podle pravidel zaměstnavatele.`;
    $("heroTotal").textContent = money(result.totalPay, input.roundWhole);
    $("heroBase").textContent = money(result.basePay, input.roundWhole);
    $("heroBonus").textContent = money(result.bonusPay, input.roundWhole);
    $("heroType").textContent = result.shiftLabel;
    $("heroBar").style.width = `${Math.max(8, Math.min(100, result.totalPay ? result.bonusPay / result.totalPay * 100 : 0))}%`;
    renderTable(input, result);
  }

  function run() {
    updateFields();
    const input = values();
    render(input, calculate(input));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["hourlyRate", "hoursWorked", "percentRate", "fixedRate", "shiftType", "roundWhole"].forEach((id) => {
    $(id).addEventListener("input", run);
    $(id).addEventListener("change", run);
  });

  document.querySelectorAll("[data-shift-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      $("shiftType").value = button.dataset.shiftPreset;
      run();
    });
  });

  $("resetBtn").addEventListener("click", () => {
    $("hourlyRate").value = 180;
    $("hoursWorked").value = 8;
    $("shiftType").value = "nightPercent";
    $("percentRate").value = 10;
    $("fixedRate").value = 25;
    $("roundWhole").checked = true;
    run();
  });

  run();
})();
