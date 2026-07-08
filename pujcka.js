(() => {
  "use strict";

  const form = document.querySelector("#loanForm");
  if (!form) return;

  const byId = id => document.getElementById(id);
  const fields = {
    amount: byId("loanAmount"), rate: byId("interestRate"), years: byId("loanYears"),
    monthlyFee: byId("monthlyFee"), upfrontFee: byId("upfrontFee"),
    extra: byId("extraPayment"), income: byId("monthlyIncome")
  };
  const errorBox = byId("loanError");
  const currency = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });

  const value = input => Number(String(input.value).replace(",", "."));
  const money = value => currency.format(Math.round(value));
  const percent = value => `${number.format(value)} %`;

  function annuity(principal, annualRate, months) {
    const monthlyRate = annualRate / 1200;
    if (monthlyRate === 0) return principal / months;
    return principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
  }

  function modelApr(principal, upfrontFee, monthlyPayment, months) {
    const net = principal - upfrontFee;
    if (net <= 0 || monthlyPayment <= 0) return NaN;
    const pv = rate => {
      if (Math.abs(rate) < 1e-12) return monthlyPayment * months;
      return monthlyPayment * (1 - Math.pow(1 + rate, -months)) / rate;
    };
    let low = 0, high = 1;
    if (pv(0) < net) return 0;
    for (let i = 0; i < 100; i += 1) {
      const mid = (low + high) / 2;
      if (pv(mid) > net) low = mid; else high = mid;
    }
    return (Math.pow(1 + (low + high) / 2, 12) - 1) * 100;
  }

  function simulate(principal, annualRate, scheduledAnnuity, monthlyFee, extraPayment, maxMonths = 1200) {
    const monthlyRate = annualRate / 1200;
    let balance = principal, interestTotal = 0, paidTotal = 0, month = 0;
    const rows = [];
    while (balance > 0.005 && month < maxMonths) {
      month += 1;
      const interest = balance * monthlyRate;
      const principalPart = Math.min(balance, Math.max(0, scheduledAnnuity + extraPayment - interest));
      const payment = principalPart + interest;
      balance = Math.max(0, balance - principalPart);
      interestTotal += interest;
      paidTotal += payment + monthlyFee;
      if (month <= 12 || month % 12 === 0 || balance === 0) rows.push({ month, payment: payment + monthlyFee, principalPart, interest, balance });
      if (principalPart <= 0) break;
    }
    return { months: month, interestTotal, paidTotal, rows, finished: balance <= 0.005 };
  }

  function validate(data) {
    const messages = [];
    if (!Number.isFinite(data.amount) || data.amount < 1000 || data.amount > 100000000) messages.push("Výše půjčky musí být od 1 000 do 100 000 000 Kč.");
    if (!Number.isFinite(data.rate) || data.rate < 0 || data.rate > 100) messages.push("Roční úrok musí být od 0 do 100 %.");
    if (!Number.isInteger(data.years) || data.years < 1 || data.years > 40) messages.push("Doba splácení musí být celé číslo od 1 do 40 let.");
    if (!Number.isFinite(data.monthlyFee) || data.monthlyFee < 0 || data.monthlyFee > 100000) messages.push("Měsíční poplatek musí být od 0 do 100 000 Kč.");
    if (!Number.isFinite(data.upfrontFee) || data.upfrontFee < 0 || data.upfrontFee >= data.amount) messages.push("Počáteční poplatek musí být nezáporný a nižší než půjčená částka.");
    if (!Number.isFinite(data.extra) || data.extra < 0 || data.extra > 10000000) messages.push("Pravidelná platba navíc musí být nezáporná.");
    if (!Number.isFinite(data.income) || data.income < 0 || data.income > 100000000) messages.push("Čistý měsíční příjem musí být nezáporný.");
    return messages;
  }

  function emptyResult(message) {
    errorBox.hidden = false;
    errorBox.textContent = message;
    ["monthlyResult", "totalResult", "overpaymentResult", "aprResult", "interestResult", "feeResult", "incomeResult", "ratioResult"].forEach(id => { byId(id).textContent = "—"; });
  }

  function scenarioRow(principal, rate, years, monthlyFee, currentYears) {
    const months = years * 12;
    const payment = annuity(principal, rate, months) + monthlyFee;
    const total = payment * months;
    return `<tr class="${years === currentYears ? "is-current" : ""}"><td>${years} ${years === 1 ? "rok" : years < 5 ? "roky" : "let"}</td><td>${money(payment)}</td><td>${money(total)}</td><td>${money(total - principal)}</td></tr>`;
  }

  function render() {
    const data = Object.fromEntries(Object.entries(fields).map(([key, input]) => [key, value(input)]));
    const errors = validate(data);
    if (errors.length) { emptyResult(errors[0]); return; }
    errorBox.hidden = true;

    const months = data.years * 12;
    const baseAnnuity = annuity(data.amount, data.rate, months);
    const monthlyOutflow = baseAnnuity + data.monthlyFee;
    const interestTotal = baseAnnuity * months - data.amount;
    const feesTotal = data.upfrontFee + data.monthlyFee * months;
    const totalPaid = data.amount + interestTotal + feesTotal;
    const overpayment = totalPaid - data.amount;
    const apr = modelApr(data.amount, data.upfrontFee, monthlyOutflow, months);
    const incomeRatio = data.income > 0 ? monthlyOutflow / data.income * 100 : NaN;
    const recommendedIncome = monthlyOutflow / 0.3;
    const accelerated = simulate(data.amount, data.rate, baseAnnuity, data.monthlyFee, data.extra);
    const acceleratedTotal = accelerated.paidTotal + data.upfrontFee;
    const savings = Math.max(0, totalPaid - acceleratedTotal);
    const monthsSaved = Math.max(0, months - accelerated.months);

    byId("monthlyResult").textContent = money(monthlyOutflow);
    byId("totalResult").textContent = money(totalPaid);
    byId("overpaymentResult").textContent = money(overpayment);
    byId("aprResult").textContent = Number.isFinite(apr) ? percent(apr) : "—";
    byId("interestResult").textContent = money(interestTotal);
    byId("feeResult").textContent = money(feesTotal);
    byId("incomeResult").textContent = money(recommendedIncome);
    byId("ratioResult").textContent = Number.isFinite(incomeRatio) ? percent(incomeRatio) : "Nezadáno";
    byId("answerSentence").textContent = `Při ${percent(data.rate)} ročně a splatnosti ${data.years} let zaplatíte celkem přibližně ${money(totalPaid)}.`;

    const share = Math.min(100, Math.max(0, overpayment / totalPaid * 100));
    byId("costFill").style.width = `${share}%`;
    byId("costShare").textContent = `${percent(share)} z plateb tvoří úroky a zadané poplatky.`;

    let badge = "Rozpočet";
    let title = "Splátku porovnejte s volným cashflow";
    let text = `Orientačně by splátka odpovídala ${Number.isFinite(incomeRatio) ? percent(incomeRatio) : "nezadanému podílu"} čistého příjmu. Počítejte i s ostatními závazky a rezervou.`;
    if (Number.isFinite(incomeRatio) && incomeRatio <= 20) { badge = "Nižší zatížení"; title = "Splátka má vůči zadanému příjmu větší prostor"; }
    if (Number.isFinite(incomeRatio) && incomeRatio > 35) { badge = "Vyšší zatížení"; title = "Splátka výrazně zatěžuje zadaný příjem"; text = `Podíl ${percent(incomeRatio)} je pouze orientační signál. Prověřte kratší částku půjčky, delší splatnost i celkové náklady a hlavně vlastní měsíční rezervu.`; }
    byId("interpretationBadge").textContent = badge;
    byId("interpretationTitle").textContent = title;
    byId("interpretationText").textContent = text;
    byId("extraSummary").hidden = data.extra <= 0;
    if (data.extra > 0) byId("extraSummary").innerHTML = `<strong>Platba navíc ${money(data.extra)} měsíčně</strong><span>Modelové splacení za ${accelerated.months} měsíců, o ${monthsSaved} měsíců dříve. Úspora proti základnímu scénáři přibližně ${money(savings)}.</span>`;

    const variants = [...new Set([Math.max(1, data.years - 2), data.years, Math.min(40, data.years + 2)])];
    byId("loanScenarioBody").innerHTML = variants.map(years => scenarioRow(data.amount, data.rate, years, data.monthlyFee, data.years)).join("");
    const baseSchedule = simulate(data.amount, data.rate, baseAnnuity, data.monthlyFee, 0, months + 2);
    byId("scheduleRows").innerHTML = baseSchedule.rows.map(row => `<div><span>${row.month}. měsíc</span><b>${money(row.payment)}</b><small>jistina ${money(row.principalPart)} · úrok ${money(row.interest)} · zůstatek ${money(row.balance)}</small></div>`).join("");

    byId("heroMonthly").textContent = money(monthlyOutflow);
    byId("heroAmount").textContent = money(data.amount);
    byId("heroPaid").textContent = money(totalPaid);
    byId("heroOverpayment").textContent = money(overpayment);
    byId("heroMeta").textContent = `${percent(data.rate)} · ${data.years} let`;
  }

  form.addEventListener("input", render);
  form.addEventListener("submit", event => { event.preventDefault(); render(); byId("vysledek").scrollIntoView({ behavior: "smooth", block: "start" }); });
  byId("resetLoan").addEventListener("click", () => { form.reset(); render(); });
  render();
})();
