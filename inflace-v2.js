(function () {
  const form = document.getElementById("inflationForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
  const pct = (value) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(value)} %`;
  const num = (value, digits) => new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits ?? 2 }).format(value);

  function values() {
    return {
      mode: $("inflationMode").value,
      amount: Number($("inflationAmount").value) || 0,
      rate: Number($("inflationRate").value) || 0,
      years: Number($("inflationYears").value) || 0
    };
  }

  function calculate(input) {
    const factor = Math.pow(1 + input.rate / 100, input.years);
    if (input.mode === "futureValue") {
      const realValue = input.amount / factor;
      return { main: realValue, secondary: input.amount, difference: input.amount - realValue, percent: (1 - 1 / factor) * 100, factor };
    }
    const future = input.amount * factor;
    return { main: future, secondary: input.amount, difference: future - input.amount, percent: (factor - 1) * 100, factor };
  }

  function modeLabel(mode) {
    if (mode === "futureValue") return "Reálná hodnota peněz";
    if (mode === "requiredAmount") return "Částka pro zachování kupní síly";
    return "Budoucí cena";
  }

  function renderTable(input, result) {
    const rows = [];
    for (let year = 1; year <= Math.min(input.years, 12); year++) {
      const factor = Math.pow(1 + input.rate / 100, year);
      const value = input.mode === "futureValue" ? input.amount / factor : input.amount * factor;
      rows.push(`<tr><td>${year}. rok</td><td>${money(value)}</td><td>Faktor ${num(factor, 3)}×</td></tr>`);
    }
    $("summaryTableBody").innerHTML = rows.join("");
  }

  function render(input, result) {
    $("mainResult").textContent = money(result.main);
    $("differenceResult").textContent = money(result.difference);
    $("percentResult").textContent = pct(result.percent);
    $("factorResult").textContent = `${num(result.factor, 3)}×`;
    $("inflationBadge").textContent = result.percent >= 30 ? "Výrazný dopad inflace" : "Orientační dopad inflace";
    $("typeResult").textContent = modeLabel(input.mode);
    $("baseAmountResult").textContent = money(input.amount);
    $("rateResult").textContent = pct(input.rate);
    $("yearsResult").textContent = `${input.years} let`;
    $("secondaryResult").textContent = money(result.secondary);
    $("resultNote").textContent = `Při inflaci ${pct(input.rate)} po dobu ${input.years} let je kumulovaný dopad přibližně ${pct(result.percent)}.`;
    $("heroMain").textContent = money(result.main);
    $("heroDifference").textContent = money(result.difference);
    $("heroFactor").textContent = `${num(result.factor, 2)}×`;
    $("heroYears").textContent = `${input.years} let`;
    $("heroBar").style.width = `${Math.max(8, Math.min(100, result.percent))}%`;
    renderTable(input, result);
  }

  function run() {
    const input = values();
    render(input, calculate(input));
  }

  document.querySelectorAll("[data-inflation-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      $("inflationMode").value = button.dataset.inflationPreset;
      run();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["inflationMode", "inflationAmount", "inflationRate", "inflationYears"].forEach((id) => {
    $(id).addEventListener("input", run);
    $(id).addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("inflationMode").value = "futurePrice";
    $("inflationAmount").value = 100000;
    $("inflationRate").value = 3;
    $("inflationYears").value = 10;
    run();
  });

  run();
})();
