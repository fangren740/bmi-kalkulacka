(function () {
  "use strict";
  const form = document.getElementById("rentalYieldForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const num = (id) => Number($(id)?.value) || 0;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
  const pct = (value, digits = 2) => `${new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0)} %`;
  let mode = "basic";
  let currentStep = 1;

  function monthlyPayment(principal, annualRate, years) {
    if (principal <= 0 || years <= 0) return 0;
    const n = years * 12;
    const r = annualRate / 100 / 12;
    if (r === 0) return principal / n;
    return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1);
  }

  function remainingBalance(principal, annualRate, years, paidMonths) {
    if (principal <= 0) return 0;
    const n = years * 12;
    const p = Math.min(paidMonths, n);
    const r = annualRate / 100 / 12;
    if (r === 0) return Math.max(0, principal * (1 - p / n));
    const payment = monthlyPayment(principal, annualRate, years);
    return Math.max(0, principal * Math.pow(1 + r, p) - payment * (Math.pow(1 + r, p) - 1) / r);
  }

  function basicInput() {
    return {
      propertyPrice: num("bPropertyPrice"),
      renovation: num("bAcquisitionCosts"),
      furnishing: 0,
      closingCosts: 0,
      initialReserve: 0,
      targetYield: num("bTargetYield"),
      monthlyRent: num("bMonthlyRent"),
      parkingIncome: 0,
      otherAnnualIncome: 0,
      vacancy: clamp(num("bVacancy"), 0, 100),
      badDebt: 0,
      rentGrowth: 0,
      hoa: num("bOwnerCosts"),
      maintenance: 0,
      insurance: 0,
      management: 0,
      propertyTax: 0,
      capex: 0,
      otherCosts: 0,
      costGrowth: 0,
      loanAmount: 0,
      interestRate: 0,
      loanYears: 30,
      appreciation: 0,
      horizon: 5,
      sellingCosts: 0
    };
  }

  function proInput() {
    return {
      propertyPrice: num("pPropertyPrice"),
      renovation: num("pRenovation"),
      furnishing: num("pFurnishing"),
      closingCosts: num("pClosingCosts"),
      initialReserve: num("pInitialReserve"),
      targetYield: num("pTargetYield"),
      monthlyRent: num("pMonthlyRent"),
      parkingIncome: num("pParkingIncome"),
      otherAnnualIncome: num("pOtherAnnualIncome"),
      vacancy: clamp(num("pVacancy"), 0, 100),
      badDebt: clamp(num("pBadDebt"), 0, 100),
      rentGrowth: num("pRentGrowth"),
      hoa: num("pHoa"),
      maintenance: num("pMaintenance"),
      insurance: num("pInsurance"),
      management: num("pManagement"),
      propertyTax: num("pPropertyTax"),
      capex: num("pCapex"),
      otherCosts: num("pOtherCosts"),
      costGrowth: num("pCostGrowth"),
      loanAmount: num("pLoanAmount"),
      interestRate: num("pInterestRate"),
      loanYears: Math.max(1, num("pLoanYears")),
      appreciation: num("pAppreciation"),
      horizon: Number($("pHorizon").value) || 5,
      sellingCosts: clamp(num("pSellingCosts"), 0, 100)
    };
  }

  function calculate(input, overrides = {}) {
    const data = { ...input, ...overrides };
    const projectCosts = data.renovation + data.furnishing + data.closingCosts;
    const totalInvestment = data.propertyPrice + projectCosts;
    const potentialAnnualIncome = (data.monthlyRent + data.parkingIncome) * 12 + data.otherAnnualIncome;
    const vacancyLoss = potentialAnnualIncome * data.vacancy / 100;
    const badDebtLoss = Math.max(0, potentialAnnualIncome - vacancyLoss) * data.badDebt / 100;
    const effectiveIncome = potentialAnnualIncome - vacancyLoss - badDebtLoss;
    const operatingCosts = (data.hoa + data.maintenance + data.insurance + data.management) * 12 + data.propertyTax + data.capex + data.otherCosts;
    const noi = effectiveIncome - operatingCosts;
    const grossYield = totalInvestment > 0 ? potentialAnnualIncome / totalInvestment * 100 : 0;
    const netYield = totalInvestment > 0 ? noi / totalInvestment * 100 : 0;
    const monthlyDebt = monthlyPayment(data.loanAmount, data.interestRate, data.loanYears);
    const annualDebt = monthlyDebt * 12;
    const annualCashflow = noi - annualDebt;
    const ownCash = Math.max(0, totalInvestment - data.loanAmount) + data.initialReserve;
    const cashOnCash = ownCash > 0 ? annualCashflow / ownCash * 100 : 0;
    const dscr = annualDebt > 0 ? noi / annualDebt : null;
    const maxTotalInvestment = data.targetYield > 0 ? noi / (data.targetYield / 100) : 0;
    const maxPurchasePrice = Math.max(0, maxTotalInvestment - projectCosts);
    const netIncomeFactor = Math.max(0.0001, (1 - data.vacancy / 100) * (1 - data.badDebt / 100));
    const requiredPotentialIncome = data.targetYield > 0 ? (totalInvestment * data.targetYield / 100 + operatingCosts) / netIncomeFactor : 0;
    const requiredRent = Math.max(0, (requiredPotentialIncome - data.otherAnnualIncome) / 12 - data.parkingIncome);
    const breakEvenOccupancy = potentialAnnualIncome > 0 ? (operatingCosts + annualDebt) / potentialAnnualIncome * 100 : 0;
    const expenseRatio = effectiveIncome > 0 ? operatingCosts / effectiveIncome * 100 : 0;
    return { ...data, projectCosts, totalInvestment, potentialAnnualIncome, vacancyLoss, badDebtLoss, effectiveIncome, operatingCosts, noi, grossYield, netYield, monthlyDebt, annualDebt, annualCashflow, ownCash, cashOnCash, dscr, maxTotalInvestment, maxPurchasePrice, requiredRent, breakEvenOccupancy, expenseRatio };
  }

  function interpretation(r) {
    if (r.netYield >= 5 && (r.dscr === null || r.dscr >= 1.15)) {
      return { label: "Silnější provozní výnos", cls: "is-strong", text: "Nemovitost má podle zadaných předpokladů solidní provozní výnos a přiměřenou rezervu. Přesto ověřte technický stav, tržní nájem a kombinovaný stres." };
    }
    if (r.netYield >= 3 || (r.dscr !== null && r.dscr >= 1)) {
      return { label: "Střední výnos, rozhodují detaily", cls: "is-medium", text: "Výsledek může dávat smysl, ale je citlivější na cenu, neobsazenost nebo financování. Zaměřte se na cílovou kupní cenu a stresové scénáře." };
    }
    return { label: "Slabý nebo napjatý scénář", cls: "is-weak", text: "Výnos nebo krytí dluhu vychází slabě. Investice může stát hlavně na budoucím růstu ceny nebo na pravidelném doplácení, což zvyšuje riziko." };
  }

  function setText(id, value) { const el = $(id); if (el) el.textContent = value; }
  function setBar(id, value) { const el = $(id); if (el) el.style.width = `${clamp(value, 0, 100)}%`; }

  function renderProjection(input, r) {
    const body = $("projectionBody");
    if (!body) return;
    const years = mode === "pro" ? input.horizon : 5;
    const rows = [];
    for (let year = 1; year <= years; year += 1) {
      const rentFactor = Math.pow(1 + input.rentGrowth / 100, year - 1);
      const costFactor = Math.pow(1 + input.costGrowth / 100, year - 1);
      const potential = r.potentialAnnualIncome * rentFactor;
      const effective = potential * (1 - input.vacancy / 100) * (1 - input.badDebt / 100);
      const costs = r.operatingCosts * costFactor;
      const noi = effective - costs;
      const cash = noi - r.annualDebt;
      const balance = remainingBalance(input.loanAmount, input.interestRate, input.loanYears, year * 12);
      const value = input.propertyPrice * Math.pow(1 + input.appreciation / 100, year);
      const sellingNet = value * (1 - input.sellingCosts / 100);
      const equity = sellingNet - balance;
      rows.push(`<tr><td>${year}</td><td>${money(noi)}</td><td>${money(cash)}</td><td>${money(balance)}</td><td>${money(value)}</td><td>${money(equity)}</td></tr>`);
    }
    body.innerHTML = rows.join("");
  }

  function renderStress(input, r) {
    const rent = calculate(input, { monthlyRent: input.monthlyRent * .9, parkingIncome: input.parkingIncome * .9, otherAnnualIncome: input.otherAnnualIncome * .9 });
    const vacancy = calculate(input, { vacancy: clamp(input.vacancy + 5, 0, 100) });
    const costs = calculate(input, { hoa: input.hoa * 1.2, maintenance: input.maintenance * 1.2, insurance: input.insurance * 1.2, management: input.management * 1.2, propertyTax: input.propertyTax * 1.2, capex: input.capex * 1.2, otherCosts: input.otherCosts * 1.2 });
    const combined = calculate(input, {
      monthlyRent: input.monthlyRent * .9,
      parkingIncome: input.parkingIncome * .9,
      otherAnnualIncome: input.otherAnnualIncome * .9,
      vacancy: clamp(input.vacancy + 5, 0, 100),
      hoa: input.hoa * 1.2,
      maintenance: input.maintenance * 1.2,
      insurance: input.insurance * 1.2,
      management: input.management * 1.2,
      propertyTax: input.propertyTax * 1.2,
      capex: input.capex * 1.2,
      otherCosts: input.otherCosts * 1.2,
      interestRate: input.interestRate + (input.loanAmount > 0 ? 2 : 0)
    });
    [["stressRentYield","stressRentCash",rent],["stressVacancyYield","stressVacancyCash",vacancy],["stressCostsYield","stressCostsCash",costs],["stressCombinedYield","stressCombinedCash",combined]].forEach(([a,b,x])=>{setText(a,pct(x.netYield));setText(b,`Cashflow ${money(x.annualCashflow)} / rok`);});
    setText("negotiationGap", money(r.maxPurchasePrice - input.propertyPrice));
  }

  function render(input, r) {
    const state = interpretation(r);
    const score = $("netYield");
    setText("netYield", pct(r.netYield));
    setText("yieldStatus", state.label);
    score?.parentElement?.classList.remove("is-strong", "is-medium", "is-weak");
    score?.parentElement?.classList.add(state.cls);
    setText("noiAnnual", money(r.noi));
    setText("grossYield", pct(r.grossYield));
    setText("cashOnCash", r.loanAmount > 0 ? pct(r.cashOnCash) : "Bez úvěru");
    setText("dscr", r.dscr === null ? "Bez úvěru" : new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(r.dscr));
    setText("maxPurchasePrice", money(r.maxPurchasePrice));
    setText("requiredRent", `${money(r.requiredRent)}/měs.`);
    setText("breakEvenOccupancy", pct(r.breakEvenOccupancy, 1));
    setText("expenseRatio", pct(r.expenseRatio, 1));
    setText("annualCashflow", money(r.annualCashflow));
    setText("resultMessage", state.text);
    setText("heroNetYield", pct(r.netYield));
    setText("heroNoi", money(r.noi));
    setText("heroGrossYield", pct(r.grossYield));
    setText("heroCoc", r.loanAmount > 0 ? pct(r.cashOnCash) : "Bez úvěru");
    setText("heroMaxPrice", money(r.maxPurchasePrice));
    setBar("heroMeter", r.targetYield > 0 ? r.netYield / r.targetYield * 100 : 0);
    setText("wfGross", money(r.potentialAnnualIncome));
    setText("wfVacancy", `−${money(r.vacancyLoss + r.badDebtLoss)}`);
    setText("wfCosts", `−${money(r.operatingCosts)}`);
    setText("wfNoi", money(r.noi));
    const max = Math.max(r.potentialAnnualIncome, 1);
    setBar("wfGrossBar", 100); setBar("wfVacancyBar", (r.vacancyLoss + r.badDebtLoss) / max * 100); setBar("wfCostsBar", r.operatingCosts / max * 100); setBar("wfNoiBar", Math.max(0, r.noi) / max * 100);
    renderStress(input, r);
    renderProjection(input, r);
  }

  function run() {
    const input = mode === "basic" ? basicInput() : proInput();
    render(input, calculate(input));
  }

  function setMode(nextMode) {
    mode = nextMode;
    document.querySelectorAll(".yield-mode-btn").forEach((btn) => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll(".yield-mode-panel").forEach((panel) => panel.classList.toggle("is-active", panel.dataset.panel === mode));
    run();
  }

  function setStep(step) {
    currentStep = clamp(step, 1, 4);
    document.querySelectorAll(".yield-pro-step").forEach((btn) => {
      const n = Number(btn.dataset.step);
      btn.classList.toggle("is-active", n === currentStep);
      btn.classList.toggle("is-done", n < currentStep);
    });
    document.querySelectorAll(".yield-pro-stage").forEach((stage) => stage.classList.toggle("is-active", Number(stage.dataset.stage) === currentStep));
    setText("stepCounter", `Krok ${currentStep} ze 4`);
    $("prevStep").disabled = currentStep === 1;
    $("nextStep").textContent = currentStep === 4 ? "Hotovo" : "Pokračovat";
  }

  document.querySelectorAll(".yield-mode-btn").forEach((btn) => btn.addEventListener("click", () => setMode(btn.dataset.mode)));
  document.querySelectorAll(".yield-pro-step").forEach((btn) => btn.addEventListener("click", () => setStep(Number(btn.dataset.step))));
  $("prevStep").addEventListener("click", () => setStep(currentStep - 1));
  $("nextStep").addEventListener("click", () => { if (currentStep < 4) setStep(currentStep + 1); else document.getElementById("vysledek")?.scrollIntoView({ behavior: "smooth", block: "start" }); });

  const presets = {
    balanced: { bPropertyPrice: 4900000, bAcquisitionCosts: 350000, bMonthlyRent: 22500, bVacancy: 5, bOwnerCosts: 3900, bTargetYield: 4 },
    yield: { bPropertyPrice: 3500000, bAcquisitionCosts: 220000, bMonthlyRent: 21500, bVacancy: 4, bOwnerCosts: 3300, bTargetYield: 5 },
    premium: { bPropertyPrice: 6900000, bAcquisitionCosts: 420000, bMonthlyRent: 27500, bVacancy: 5, bOwnerCosts: 4400, bTargetYield: 3.5 }
  };
  document.querySelectorAll("[data-preset]").forEach((btn) => btn.addEventListener("click", () => { const preset = presets[btn.dataset.preset]; Object.entries(preset).forEach(([id,value]) => { if ($(id)) $(id).value = value; }); run(); }));

  $("resetBasic").addEventListener("click", () => { Object.entries(presets.balanced).forEach(([id,value]) => { if ($(id)) $(id).value = value; }); run(); });
  form.addEventListener("submit", (event) => { event.preventDefault(); run(); });
  form.querySelectorAll("input,select").forEach((field) => { field.addEventListener("input", run); field.addEventListener("change", run); });
  $("copyResult").addEventListener("click", async () => {
    const input = mode === "basic" ? basicInput() : proInput();
    const r = calculate(input);
    const text = `Čistý výnos z pronájmu: ${pct(r.netYield)}\nNOI: ${money(r.noi)} ročně\nHrubý výnos: ${pct(r.grossYield)}\nCash-on-cash: ${r.loanAmount > 0 ? pct(r.cashOnCash) : "bez úvěru"}\nMaximální kupní cena pro cíl: ${money(r.maxPurchasePrice)}\nRychléVýpočty.cz`;
    try { await navigator.clipboard.writeText(text); $("copyResult").textContent = "Zkopírováno"; setTimeout(() => { $("copyResult").textContent = "Kopírovat"; }, 1600); } catch (_) { window.prompt("Zkopírujte výsledek:", text); }
  });
  $("printResult").addEventListener("click", () => window.print());
  setStep(1);
  run();
})();
