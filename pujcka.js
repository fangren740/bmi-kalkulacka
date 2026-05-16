(function () {
  const form = document.getElementById("loanForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const resetBtn = $("resetBtn");
  const presetButtons = Array.from(document.querySelectorAll(".scenario-chip"));
  const outputs = {
    monthlyPayment: $("monthlyPayment"),
    monthlyWithFees: $("monthlyWithFees"),
    totalPaid: $("totalPaid"),
    totalOverpayment: $("totalOverpayment"),
    summaryLoan: $("summaryLoan"),
    summaryYears: $("summaryYears"),
    summaryRate: $("summaryRate"),
    summaryInstallments: $("summaryInstallments"),
    neededIncome: $("neededIncome"),
    neededIncomeKpi: $("neededIncomeKpi"),
    monthlyWithFeesDetail: $("monthlyWithFeesDetail"),
    summaryInstallmentsCompact: $("summaryInstallmentsCompact"),
    incomeBurden: $("incomeBurden"),
    cockpitHeadline: $("cockpitHeadline"),
    burdenFill: $("burdenFill"),
    burdenLabel: $("burdenLabel"),
    overpayFill: $("overpayFill"),
    overpayLabel: $("overpayLabel"),
    principalPart: $("principalPart"),
    interestPart: $("interestPart"),
    feePart: $("feePart"),
    stressRatePayment: $("stressRatePayment"),
    shorterTotalSaving: $("shorterTotalSaving"),
    longerTotalCost: $("longerTotalCost"),
    feesTotal: $("feesTotal"),
    loanBadge: $("loanBadge"),
    scheduleBody: $("scheduleBody"),
    affordabilityStatus: $("affordabilityStatus"),
    affordabilityText: $("affordabilityText"),
    actionStatus: $("actionStatus"),
    decisionSummary: $("decisionSummary"),
    nextActionText: $("nextActionText"),
    primaryNextCta: $("primaryNextCta"),
    secondaryNextCta: $("secondaryNextCta"),
    heroMonthly: $("heroMonthly"),
    heroAmount: $("heroAmount"),
    heroPaid: $("heroPaid"),
    heroOverpayment: $("heroOverpayment"),
    heroRate: $("heroRate"),
    heroBarPaid: $("heroBarPaid"),
    heroBarOverpay: $("heroBarOverpay"),
    heroHealthScore: $("heroHealthScore"),
    heroHealthBar: $("heroHealthBar"),
    heroScenarioBase: $("heroScenarioBase"),
    heroScenarioShort: $("heroScenarioShort"),
    heroScenarioLong: $("heroScenarioLong"),
    heroOverpayShare: $("heroOverpayShare"),
    heroInsight: $("heroInsight")
  };

  function formatCurrency(value) {
    return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  function formatPercent(value, digits = 1) {
    return `${new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(Number(value) || 0)} %`;
  }

  function pluralYears(years) {
    return `${years}${years === 1 ? " rok" : years >= 2 && years <= 4 ? " roky" : " let"}`;
  }

  function ensureNextLinks() {
    if (document.querySelector(".rv-loan-next-grid")) return;
    const actions = document.querySelector(".rv-next-actions .hero-actions");
    if (!actions) return;
    actions.insertAdjacentHTML("beforebegin", '<div class="rv-loan-next-grid" aria-label="Co spočítat dál"><strong>Co spočítat dál</strong><a href="kolik-muzu-splacet-kalkulacka.html">Ověřit bezpečnou splátku</a><a href="domaci-rozpocet.html">Zkontrolovat rozpočet domácnosti</a><a href="kalkulacka-financni-rezervy.html">Spočítat finanční rezervu</a></div>');
  }

  function getValues() {
    return {
      loanAmount: Number($("loanAmount").value) || 0,
      interestRate: Number($("interestRate").value) || 0,
      years: Number($("years").value) || 0,
      monthlyFee: Number($("monthlyFee").value) || 0,
      upfrontFee: Number($("upfrontFee")?.value) || 0,
      incomeShare: Number($("incomeShare").value) || 0,
      monthlyIncome: Number($("monthlyIncome")?.value) || 0
    };
  }

  function validate(values) {
    if (!values.loanAmount || values.loanAmount <= 0) return "Zadejte platnou výši půjčky.";
    if (values.interestRate < 0) return "Zadejte platnou úrokovou sazbu.";
    if (!values.years || values.years <= 0) return "Zadejte platnou dobu splácení.";
    if (values.monthlyFee < 0 || values.upfrontFee < 0) return "Poplatky nemohou být záporné.";
    if (!values.incomeShare || values.incomeShare <= 0) return "Zadejte platný podíl splátky na příjmu.";
    return "";
  }

  function calculateLoan(values) {
    const months = Math.round(values.years * 12);
    const monthlyRate = values.interestRate / 100 / 12;
    let monthlyPayment = 0;
    if (monthlyRate === 0) {
      monthlyPayment = values.loanAmount / months;
    } else {
      monthlyPayment = values.loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }

    const totalPaidWithoutFees = monthlyPayment * months;
    const monthlyFeesTotal = values.monthlyFee * months;
    const totalFees = monthlyFeesTotal + values.upfrontFee;
    const totalPaid = totalPaidWithoutFees + totalFees;
    const totalOverpayment = totalPaid - values.loanAmount;
    const monthlyWithFees = monthlyPayment + values.monthlyFee;
    const neededIncome = monthlyWithFees / (values.incomeShare / 100);
    const overpaymentRatio = values.loanAmount > 0 ? totalOverpayment / values.loanAmount * 100 : 0;
    const actualIncomeShare = values.monthlyIncome > 0 ? monthlyWithFees / values.monthlyIncome * 100 : 0;
    const interestPaid = totalPaidWithoutFees - values.loanAmount;

    return {
      months,
      monthlyPayment,
      monthlyWithFees,
      monthlyFeesTotal,
      totalFees,
      totalPaid,
      totalOverpayment,
      interestPaid,
      neededIncome,
      overpaymentRatio,
      actualIncomeShare
    };
  }

  function scenarioPayment(values, years) {
    return calculateLoan({ ...values, years }).monthlyWithFees;
  }

  function scenarioTotal(values, years, rate = values.interestRate) {
    return calculateLoan({ ...values, years, interestRate: rate }).totalPaid;
  }

  function buildSchedule(values, monthlyPayment, months) {
    const monthlyRate = values.interestRate / 100 / 12;
    let balance = values.loanAmount;
    const rows = [];
    for (let i = 1; i <= months; i++) {
      const interestPart = monthlyRate === 0 ? 0 : balance * monthlyRate;
      const principalPart = monthlyPayment - interestPart;
      balance = Math.max(0, balance - principalPart);
      rows.push({ month: i, payment: monthlyPayment + values.monthlyFee, interest: interestPart, principal: principalPart, balance });
    }
    const preview = rows.slice(0, 4);
    if (rows.length > 8) preview.push({ separator: true });
    return preview.concat(rows.slice(-4));
  }

  function renderSchedule(schedule) {
    if (!schedule.length) {
      outputs.scheduleBody.innerHTML = '<tr><td colspan="5">Po zadání údajů se zobrazí orientační přehled splátek.</td></tr>';
      return;
    }
    outputs.scheduleBody.innerHTML = schedule.map((row) => row.separator
      ? '<tr><td colspan="5">…</td></tr>'
      : `<tr><td>${row.month}.</td><td>${formatCurrency(row.payment)}</td><td>${formatCurrency(row.interest)}</td><td>${formatCurrency(row.principal)}</td><td>${formatCurrency(row.balance)}</td></tr>`
    ).join("");
  }

  function getAffordabilityMessage(values, result) {
    const overpay = result.overpaymentRatio;
    const burden = result.actualIncomeShare;
    let data = {
      statusClass: "caution",
      statusLabel: "Na hraně",
      statusText: "Splátka může být zvládnutelná, ale je potřeba ověřit rezervu na bydlení, energie, jídlo, dopravu a neočekávané výdaje.",
      actionLabel: "Další krok",
      summaryText: "Porovnejte kratší a delší splatnost a sledujte nejen měsíční splátku, ale i celkové přeplacení.",
      nextActionText: "Pokud vychází splátka těsně vůči příjmu, zkuste nižší částku, kratší rozumnou splatnost nebo výsledek porovnejte s rozpočtem domácnosti.",
      primaryHref: "kolik-muzu-splacet-kalkulacka.html",
      primaryText: "Ověřit bezpečnou splátku",
      secondaryHref: "domaci-rozpocet.html",
      secondaryText: "Zkontrolovat rozpočet"
    };

    if ((values.monthlyIncome > 0 && burden <= 20 && overpay <= 30) || (values.monthlyIncome <= 0 && overpay <= 25)) {
      data = {
        statusClass: "safe",
        statusLabel: "Spíše bezpečné",
        statusText: "V tomto modelu splátka nepůsobí přestřeleně. Přesto má smysl ověřit rezervu a porovnat nabídky podle RPSN, ne jen podle úroku.",
        actionLabel: "Dobrá pozice",
        summaryText: "Scénář vypadá relativně zdravě. Největší přínos teď má srovnání více nabídek a kontrola celkové ceny půjčky.",
        nextActionText: "Ověřte ještě bezpečnou splátku a finanční rezervu. Pokud kratší splatnost moc nezvedne splátku, může snížit přeplacení.",
        primaryHref: "kolik-muzu-splacet-kalkulacka.html",
        primaryText: "Bezpečná splátka",
        secondaryHref: "kalkulacka-financni-rezervy.html",
        secondaryText: "Finanční rezerva"
      };
    }

    if ((values.monthlyIncome > 0 && burden > values.incomeShare) || overpay > 55) {
      data = {
        statusClass: "risk",
        statusLabel: "Rizikovější varianta",
        statusText: "Splátka nebo celkové přeplacení jsou v tomto scénáři citlivé. Nižší měsíční splátka může vypadat příjemně, ale celková cena půjčky roste.",
        actionLabel: "Pozor",
        summaryText: "Tento scénář by měl projít rozpočtem domácnosti. Zvažte nižší částku, jinou splatnost nebo levnější nabídku.",
        nextActionText: "Než by dávalo smysl pokračovat, ověřte rozpočet, rezervu a RPSN. U dražší půjčky je největší riziko dlouhá splatnost a poplatky.",
        primaryHref: "domaci-rozpocet.html",
        primaryText: "Zkontrolovat rozpočet",
        secondaryHref: "kolik-muzu-splacet-kalkulacka.html",
        secondaryText: "Bezpečná splátka"
      };
    }

    return data;
  }

  function render(values, result) {
    outputs.monthlyPayment.textContent = formatCurrency(result.monthlyPayment);
    outputs.monthlyWithFees.textContent = formatCurrency(result.monthlyWithFees);
    outputs.monthlyWithFeesDetail.textContent = formatCurrency(result.monthlyWithFees);
    outputs.neededIncomeKpi.textContent = formatCurrency(result.neededIncome);
    outputs.totalPaid.textContent = formatCurrency(result.totalPaid);
    outputs.totalOverpayment.textContent = formatCurrency(result.totalOverpayment);
    if (outputs.principalPart) outputs.principalPart.textContent = formatCurrency(values.loanAmount);
    if (outputs.interestPart) outputs.interestPart.textContent = formatCurrency(result.interestPaid);
    if (outputs.feePart) outputs.feePart.textContent = formatCurrency(result.totalFees);
    outputs.summaryLoan.textContent = formatCurrency(values.loanAmount);
    outputs.summaryYears.textContent = pluralYears(values.years);
    outputs.summaryRate.textContent = formatPercent(values.interestRate, 2);
    outputs.summaryInstallments.textContent = String(result.months);
    outputs.summaryInstallmentsCompact.textContent = String(result.months);
    outputs.neededIncome.textContent = formatCurrency(result.neededIncome);
    if (outputs.incomeBurden) outputs.incomeBurden.textContent = values.monthlyIncome > 0 ? formatPercent(result.actualIncomeShare, 1) : "nezadáno";

    const shorterYears = Math.max(1, values.years - 2);
    const longerYears = values.years + 2;
    const rateStress = calculateLoan({ ...values, interestRate: values.interestRate + 2 });
    const shorterDiff = scenarioTotal(values, shorterYears) - result.totalPaid;
    const longerDiff = scenarioTotal(values, longerYears) - result.totalPaid;
    if (outputs.stressRatePayment) outputs.stressRatePayment.textContent = formatCurrency(rateStress.monthlyWithFees);
    if (outputs.shorterTotalSaving) outputs.shorterTotalSaving.textContent = `${shorterDiff <= 0 ? "− " : "+ "}${formatCurrency(Math.abs(shorterDiff))}`;
    if (outputs.longerTotalCost) outputs.longerTotalCost.textContent = `${longerDiff >= 0 ? "+ " : "− "}${formatCurrency(Math.abs(longerDiff))}`;
    if (outputs.feesTotal) outputs.feesTotal.textContent = formatCurrency(result.totalFees);

    const affordability = getAffordabilityMessage(values, result);
    if (outputs.cockpitHeadline) outputs.cockpitHeadline.textContent = affordability.statusText.split(".")[0] + ".";
    if (outputs.burdenFill) outputs.burdenFill.style.width = `${Math.max(4, Math.min(100, result.actualIncomeShare || 0))}%`;
    if (outputs.overpayFill) outputs.overpayFill.style.width = `${Math.max(4, Math.min(100, result.overpaymentRatio))}%`;
    if (outputs.burdenLabel) outputs.burdenLabel.textContent = values.monthlyIncome > 0 ? formatPercent(result.actualIncomeShare, 1) : "nezadáno";
    if (outputs.overpayLabel) outputs.overpayLabel.textContent = formatPercent(result.overpaymentRatio, 1);
    outputs.loanBadge.className = `badge ${affordability.statusClass === "safe" ? "success" : affordability.statusClass === "risk" ? "risk" : "warning"}`;
    outputs.loanBadge.textContent = affordability.statusLabel;
    outputs.affordabilityStatus.textContent = affordability.statusLabel;
    outputs.affordabilityStatus.className = `decision-status ${affordability.statusClass}`;
    outputs.affordabilityText.textContent = `${affordability.statusText} Splátka tvoří ${values.monthlyIncome > 0 ? formatPercent(result.actualIncomeShare, 1) : "nezadaný podíl"} příjmu a celkové přeplacení je ${formatPercent(result.overpaymentRatio, 1)} z půjčené částky.`;
    outputs.actionStatus.textContent = affordability.actionLabel;
    outputs.actionStatus.className = `decision-status ${affordability.statusClass}`;
    outputs.decisionSummary.textContent = affordability.summaryText;
    outputs.nextActionText.textContent = affordability.nextActionText;
    outputs.primaryNextCta.href = affordability.primaryHref;
    outputs.primaryNextCta.textContent = affordability.primaryText;
    outputs.secondaryNextCta.href = affordability.secondaryHref;
    outputs.secondaryNextCta.textContent = affordability.secondaryText;

    outputs.heroMonthly.textContent = formatCurrency(result.monthlyWithFees);
    outputs.heroAmount.textContent = formatCurrency(values.loanAmount);
    outputs.heroPaid.textContent = formatCurrency(result.totalPaid);
    outputs.heroOverpayment.textContent = formatCurrency(result.totalOverpayment);
    outputs.heroRate.textContent = `${formatPercent(values.interestRate, 1)} na ${pluralYears(values.years)}`;
    const principalShare = Math.min(94, Math.max(10, values.loanAmount / Math.max(result.totalPaid, 1) * 100));
    const overpayShare = Math.min(90, Math.max(6, result.totalOverpayment / Math.max(result.totalPaid, 1) * 100));
    outputs.heroBarPaid.style.width = `${principalShare}%`;
    outputs.heroBarOverpay.style.width = `${overpayShare}%`;
    if (outputs.heroHealthScore) {
      outputs.heroHealthScore.textContent = affordability.statusLabel;
      outputs.heroHealthBar.style.width = `${affordability.statusClass === "safe" ? 82 : affordability.statusClass === "risk" ? 32 : 58}%`;
      outputs.heroScenarioBase.textContent = formatCurrency(result.monthlyWithFees);
      outputs.heroScenarioShort.textContent = formatCurrency(scenarioPayment(values, Math.max(1, values.years - 2)));
      outputs.heroScenarioLong.textContent = formatCurrency(scenarioPayment(values, values.years + 2));
      outputs.heroOverpayShare.textContent = `${formatPercent(result.overpaymentRatio, 0)} přeplacení`;
      outputs.heroInsight.textContent = result.totalFees > 0 ? "Poplatky, RPSN, rezerva" : result.overpaymentRatio > 50 ? "Zkraťte splatnost" : "RPSN, poplatky, rezerva";
    }

    renderSchedule(buildSchedule(values, result.monthlyPayment, result.months));
  }

  function runCalculation() {
    const values = getValues();
    const error = validate(values);
    if (error) return;
    render(values, calculateLoan(values));
  }

  function setPreset(name) {
    const presets = {
      standard: { loanAmount: 250000, interestRate: 7.9, years: 5, monthlyFee: 0, upfrontFee: 0, incomeShare: 30, monthlyIncome: 45000 },
      safe: { loanAmount: 180000, interestRate: 7.9, years: 4, monthlyFee: 0, upfrontFee: 0, incomeShare: 25, monthlyIncome: 50000 },
      "higher-loan": { loanAmount: 400000, interestRate: 8.9, years: 7, monthlyFee: 99, upfrontFee: 2500, incomeShare: 30, monthlyIncome: 52000 },
      shorter: { loanAmount: 250000, interestRate: 7.9, years: 3, monthlyFee: 0, upfrontFee: 0, incomeShare: 30, monthlyIncome: 50000 }
    };
    const preset = presets[name];
    if (!preset) return;
    Object.keys(preset).forEach((key) => {
      const element = $(key);
      if (element) element.value = preset[key];
    });
    presetButtons.forEach((btn) => {
      const active = btn.dataset.preset === name;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
    runCalculation();
  }

  ensureNextLinks();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    runCalculation();
  });

  ["loanAmount", "interestRate", "years", "monthlyFee", "upfrontFee", "incomeShare", "monthlyIncome"].forEach((id) => {
    const element = $(id);
    if (!element) return;
    element.addEventListener("input", runCalculation);
    element.addEventListener("change", runCalculation);
  });
  presetButtons.forEach((btn) => btn.addEventListener("click", () => setPreset(btn.dataset.preset)));
  resetBtn.addEventListener("click", () => setPreset("standard"));
  runCalculation();
})();
