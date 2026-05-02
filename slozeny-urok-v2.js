(function () {
  const form = document.getElementById("compoundInterestForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
  const pct = (value) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(value)} %`;
  const num = (value) => new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(value);

  function values() {
    return {
      initialDeposit: Number($("initialDeposit").value) || 0,
      monthlyContribution: Number($("monthlyContribution").value) || 0,
      annualRate: Number($("annualRate").value) || 0,
      years: Number($("years").value) || 0,
      contributionTiming: $("contributionTiming").value
    };
  }

  function calculate(input) {
    let balance = input.initialDeposit;
    const months = Math.round(input.years * 12);
    const monthlyRate = Math.pow(1 + input.annualRate / 100, 1 / 12) - 1;
    const yearly = [];
    for (let month = 1; month <= months; month++) {
      if (input.contributionTiming === "beginning") balance += input.monthlyContribution;
      balance *= 1 + monthlyRate;
      if (input.contributionTiming === "end") balance += input.monthlyContribution;
      if (month % 12 === 0) yearly.push(balance);
    }
    const invested = input.initialDeposit + input.monthlyContribution * months;
    const profit = balance - invested;
    return { finalValue: balance, invested, profit, returnPercent: invested > 0 ? profit / invested * 100 : 0, yearly };
  }

  function renderTable(input, result) {
    $("summaryTableBody").innerHTML = result.yearly.slice(0, 12).map((value, index) => {
      const year = index + 1;
      const invested = input.initialDeposit + input.monthlyContribution * 12 * year;
      return `<tr><td>${year}. rok</td><td>${money(value)}</td><td>Vloženo ${money(invested)}</td></tr>`;
    }).join("");
  }

  function render(input, result) {
    $("finalValueResult").textContent = money(result.finalValue);
    $("profitResult").textContent = money(result.profit);
    $("investedResult").textContent = money(result.invested);
    $("returnPercentResult").textContent = pct(result.returnPercent);
    $("resultBadge").textContent = result.profit > 0 ? "Výnos nad vklady" : "Bez kladného výnosu";
    $("initialResult").textContent = money(input.initialDeposit);
    $("monthlyResult").textContent = money(input.monthlyContribution);
    $("rateResult").textContent = pct(input.annualRate);
    $("yearsResult").textContent = `${input.years} let`;
    $("gainAboveContributionResult").textContent = money(result.profit);
    $("resultNote").textContent = `Po ${input.years} letech vychází orientační hodnota ${money(result.finalValue)}. Z toho vložené peníze tvoří ${money(result.invested)} a výnos ${money(result.profit)}.`;
    $("heroFinal").textContent = money(result.finalValue);
    $("heroInvested").textContent = money(result.invested);
    $("heroProfit").textContent = money(result.profit);
    $("heroReturn").textContent = pct(result.returnPercent);
    $("heroBar").style.width = `${Math.max(8, Math.min(100, result.returnPercent))}%`;
    renderTable(input, result);
  }

  function run() {
    const input = values();
    render(input, calculate(input));
  }

  document.querySelectorAll("[data-compound-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      const preset = button.dataset.compoundPreset;
      if (preset === "starter") {
        $("initialDeposit").value = 50000;
        $("monthlyContribution").value = 1500;
        $("annualRate").value = 5;
        $("years").value = 10;
      }
      if (preset === "long") {
        $("initialDeposit").value = 100000;
        $("monthlyContribution").value = 3000;
        $("annualRate").value = 7;
        $("years").value = 20;
      }
      run();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["initialDeposit", "monthlyContribution", "annualRate", "years", "contributionTiming"].forEach((id) => {
    $(id).addEventListener("input", run);
    $(id).addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("initialDeposit").value = 100000;
    $("monthlyContribution").value = 3000;
    $("annualRate").value = 7;
    $("years").value = 20;
    $("contributionTiming").value = "end";
    run();
  });

  run();
})();
