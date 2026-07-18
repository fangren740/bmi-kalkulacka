(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const form = $("refinanceForm");
  if (!form) return;

  const elements = {
    basicTab: $("basicTab"), proTab: $("proTab"), basicFields: $("basicFields"), proFields: $("proFields"),
    formModeLabel: $("formModeLabel"), formModeText: $("formModeText"), modeStatus: $("modeStatus"),
    switchToPro: $("switchToPro"), resetBtn: $("resetBtn"), formError: $("formError"),
    basicBalance: $("basicBalance"), basicYears: $("basicYears"), basicCurrentRate: $("basicCurrentRate"), basicNewRate: $("basicNewRate"),
    proBalance: $("proBalance"), proCurrentRate: $("proCurrentRate"), proCurrentYears: $("proCurrentYears"), proCurrentMonths: $("proCurrentMonths"),
    proNewRate: $("proNewRate"), proNewYears: $("proNewYears"), proNewMonths: $("proNewMonths"), proOneTimeCosts: $("proOneTimeCosts"),
    proCurrentMonthlyCosts: $("proCurrentMonthlyCosts"), proNewMonthlyCosts: $("proNewMonthlyCosts"),
    netSavingResult: $("netSavingResult"), statusBadge: $("statusBadge"), resultLead: $("resultLead"),
    currentInterestBar: $("currentInterestBar"), newInterestBar: $("newInterestBar"), currentInterestResult: $("currentInterestResult"), newInterestResult: $("newInterestResult"),
    currentPaymentResult: $("currentPaymentResult"), newPaymentResult: $("newPaymentResult"), monthlySavingResult: $("monthlySavingResult"), breakEvenResult: $("breakEvenResult"),
    decisionHeadline: $("decisionHeadline"), decisionText: $("decisionText"), termCheck: $("termCheck"), termStatus: $("termStatus"), termText: $("termText"),
    interestSavingResult: $("interestSavingResult"), costsResult: $("costsResult"), monthlyCostsMeta: $("monthlyCostsMeta"),
    comparisonBody: $("comparisonBody"), detailHeadline: $("detailHeadline"), detailText: $("detailText"),
    checkRateGap: $("checkRateGap"), checkTermGap: $("checkTermGap"), checkCosts: $("checkCosts"),
    heroCurrentRate: $("heroCurrentRate"), heroNewRate: $("heroNewRate"), heroMonthlySaving: $("heroMonthlySaving"), heroVerdict: $("heroVerdict"),
    copyResult: $("copyResult"), printResult: $("printResult")
  };

  const numberFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const decimalFormat = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  let mode = "basic";
  let latest = null;

  function value(input) {
    return Number(String(input.value).replace(",", "."));
  }

  function setValue(input, val) {
    input.value = String(val);
  }

  function money(val) {
    if (!Number.isFinite(val)) return "—";
    return numberFormat.format(Math.round(val)) + " Kč";
  }

  function signedMoney(val) {
    if (!Number.isFinite(val)) return "—";
    const rounded = Math.round(val);
    return (rounded > 0 ? "+" : rounded < 0 ? "−" : "") + numberFormat.format(Math.abs(rounded)) + " Kč";
  }

  function percent(val) {
    return decimalFormat.format(val) + " %";
  }

  function monthLabel(months) {
    const safe = Math.max(0, Math.round(months));
    const years = Math.floor(safe / 12);
    const rest = safe % 12;
    if (!years) return rest + (rest === 1 ? " měsíc" : rest >= 2 && rest <= 4 ? " měsíce" : " měsíců");
    if (!rest) return years + (years === 1 ? " rok" : years >= 2 && years <= 4 ? " roky" : " let");
    return years + (years === 1 ? " rok" : years >= 2 && years <= 4 ? " roky" : " let") + " a " + rest + (rest === 1 ? " měsíc" : rest >= 2 && rest <= 4 ? " měsíce" : " měsíců");
  }

  function annuity(principal, annualRate, months) {
    if (principal <= 0 || months <= 0) return { payment: 0, interest: 0, total: 0 };
    const monthlyRate = annualRate / 1200;
    const payment = monthlyRate === 0
      ? principal / months
      : principal * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
    const total = payment * months;
    return { payment, interest: Math.max(0, total - principal), total };
  }

  function model(principal, annualRate, months, monthlyCosts, oneTimeCosts) {
    const loan = annuity(principal, annualRate, months);
    const recurringCosts = monthlyCosts * months;
    return {
      principal, annualRate, months, monthlyCosts, oneTimeCosts,
      payment: loan.payment,
      monthlyOutflow: loan.payment + monthlyCosts,
      interest: loan.interest,
      recurringCosts,
      sideCosts: recurringCosts + oneTimeCosts,
      total: loan.total + recurringCosts + oneTimeCosts
    };
  }

  function calculateBreakEven(current, next) {
    if (next.oneTimeCosts <= 0 && next.monthlyOutflow <= current.monthlyOutflow) return 0;
    let currentPaid = 0;
    let nextPaid = next.oneTimeCosts;
    const horizon = Math.max(current.months, next.months);
    for (let month = 1; month <= horizon; month += 1) {
      if (month <= current.months) currentPaid += current.monthlyOutflow;
      if (month <= next.months) nextPaid += next.monthlyOutflow;
      if (nextPaid <= currentPaid) return month;
    }
    return null;
  }

  function dataFromForm() {
    if (mode === "basic") {
      const years = value(elements.basicYears);
      return {
        principal: value(elements.basicBalance),
        currentRate: value(elements.basicCurrentRate),
        newRate: value(elements.basicNewRate),
        currentMonths: Math.round(years * 12),
        newMonths: Math.round(years * 12),
        oneTimeCosts: 0,
        currentMonthlyCosts: 0,
        newMonthlyCosts: 0
      };
    }
    return {
      principal: value(elements.proBalance),
      currentRate: value(elements.proCurrentRate),
      newRate: value(elements.proNewRate),
      currentMonths: Math.round(value(elements.proCurrentYears) * 12 + value(elements.proCurrentMonths)),
      newMonths: Math.round(value(elements.proNewYears) * 12 + value(elements.proNewMonths)),
      oneTimeCosts: value(elements.proOneTimeCosts),
      currentMonthlyCosts: value(elements.proCurrentMonthlyCosts),
      newMonthlyCosts: value(elements.proNewMonthlyCosts)
    };
  }

  function validate(data) {
    const values = Object.values(data);
    if (values.some((item) => !Number.isFinite(item))) return "Vyplňte všechna zobrazená pole platným číslem.";
    if (data.principal < 10000 || data.principal > 1000000000) return "Zůstatek hypotéky musí být mezi 10 000 Kč a 1 miliardou Kč.";
    if (data.currentRate < 0 || data.currentRate > 30 || data.newRate < 0 || data.newRate > 30) return "Úroková sazba musí být mezi 0 % a 30 % ročně.";
    if (data.currentMonths < 1 || data.currentMonths > 600 || data.newMonths < 1 || data.newMonths > 600) return "Každá splatnost musí být alespoň 1 měsíc a nejvýše 50 let.";
    if (data.oneTimeCosts < 0 || data.oneTimeCosts > 100000000) return "Jednorázové náklady musí být mezi 0 Kč a 100 miliony Kč.";
    if (data.currentMonthlyCosts < 0 || data.newMonthlyCosts < 0 || data.currentMonthlyCosts > 1000000 || data.newMonthlyCosts > 1000000) return "Měsíční náklady musí být mezi 0 Kč a 1 milionem Kč.";
    return "";
  }

  function setError(message) {
    elements.formError.textContent = message;
    elements.formError.hidden = !message;
  }

  function rateGapLabel(gap) {
    const absolute = decimalFormat.format(Math.abs(gap));
    if (gap > 0) return "nová nižší o " + absolute + " p. b.";
    if (gap < 0) return "nová vyšší o " + absolute + " p. b.";
    return "stejná sazba";
  }

  function tableRow(name, scenario, variant) {
    return "<tr class=\"" + variant + "\">" +
      "<td data-label=\"Varianta\"><strong>" + name + "</strong></td>" +
      "<td data-label=\"Měsíční výdaj\">" + money(scenario.monthlyOutflow) + "</td>" +
      "<td data-label=\"Splatnost\">" + monthLabel(scenario.months) + "</td>" +
      "<td data-label=\"Úroky\">" + money(scenario.interest) + "</td>" +
      "<td data-label=\"Vedlejší náklady\">" + money(scenario.sideCosts) + "</td>" +
      "<td data-label=\"Celkem\"><strong>" + money(scenario.total) + "</strong></td></tr>";
  }

  function render(data) {
    const current = model(data.principal, data.currentRate, data.currentMonths, data.currentMonthlyCosts, 0);
    const next = model(data.principal, data.newRate, data.newMonths, data.newMonthlyCosts, data.oneTimeCosts);
    const fair = model(data.principal, data.newRate, data.currentMonths, data.newMonthlyCosts, data.oneTimeCosts);
    const netSaving = current.total - next.total;
    const interestSaving = current.interest - next.interest;
    const monthlySaving = current.monthlyOutflow - next.monthlyOutflow;
    const rateGap = data.currentRate - data.newRate;
    const termGap = data.newMonths - data.currentMonths;
    const breakEven = calculateBreakEven(current, next);
    const maxInterest = Math.max(current.interest, next.interest, 1);
    const meaningful = Math.max(10000, data.principal * 0.005);

    latest = { data, current, next, fair, netSaving, interestSaving, monthlySaving, rateGap, termGap, breakEven };

    elements.netSavingResult.textContent = signedMoney(netSaving);
    elements.currentInterestResult.textContent = money(current.interest);
    elements.newInterestResult.textContent = money(next.interest);
    elements.currentInterestBar.style.width = Math.max(5, current.interest / maxInterest * 100) + "%";
    elements.newInterestBar.style.width = Math.max(5, next.interest / maxInterest * 100) + "%";
    elements.currentPaymentResult.textContent = money(current.monthlyOutflow);
    elements.newPaymentResult.textContent = money(next.monthlyOutflow);
    elements.monthlySavingResult.textContent = signedMoney(monthlySaving);
    elements.breakEvenResult.textContent = breakEven === null ? "v modelu nenastane" : breakEven === 0 ? "ihned" : monthLabel(breakEven);
    elements.interestSavingResult.textContent = signedMoney(interestSaving);
    elements.costsResult.textContent = money(data.oneTimeCosts);
    const monthlyCostDiff = data.newMonthlyCosts - data.currentMonthlyCosts;
    elements.monthlyCostsMeta.textContent = monthlyCostDiff === 0 ? "stejné měsíční služby" : (monthlyCostDiff > 0 ? "nově +" : "nově −") + money(Math.abs(monthlyCostDiff)) + "/měs.";

    elements.statusBadge.classList.remove("is-warning", "is-negative");
    if (netSaving > meaningful) {
      elements.statusBadge.textContent = "Nová varianta je v modelu levnější";
      elements.resultLead.textContent = "Po započtení zadané délky a nákladů vychází nová hypotéka celkově levněji. Před podpisem ověřte dokumenty a podmínky sazby.";
    } else if (netSaving >= 0) {
      elements.statusBadge.textContent = "Přínos je těsný";
      elements.statusBadge.classList.add("is-warning");
      elements.resultLead.textContent = "Nová nabídka je v modelu mírně levnější, ale malý rozdíl může změnit nezařazený poplatek, povinná služba nebo budoucí sazba.";
    } else {
      elements.statusBadge.textContent = "Nová varianta je v modelu dražší";
      elements.statusBadge.classList.add("is-negative");
      elements.resultLead.textContent = "Nižší sazba nebo splátka nestačila vyrovnat délku a zadané náklady. Zkontrolujte stejnou splatnost a úplný ceník.";
    }

    elements.termCheck.classList.remove("is-warning", "is-positive");
    if (termGap === 0) {
      elements.termStatus.textContent = "Stejná doba";
      elements.termText.textContent = "Sazby a náklady lze přímo porovnat.";
      elements.termCheck.classList.add("is-positive");
      elements.decisionHeadline.textContent = netSaving >= 0 ? "Férové srovnání ukazuje čistou úsporu" : "Ani při stejné době nabídka nešetří";
      elements.decisionText.textContent = "Obě varianty běží " + monthLabel(data.currentMonths) + ". Rozdíl proto nevytváří prodloužení splatnosti; hlavní roli má sazba a zadané vedlejší náklady.";
      elements.detailHeadline.textContent = "Stejná splatnost oddělila sazbu od délky.";
      elements.detailText.textContent = "Nová měsíční platba je " + (monthlySaving >= 0 ? "nižší o " + money(monthlySaving) : "vyšší o " + money(Math.abs(monthlySaving))) + " a čistý rozdíl celkových nákladů činí " + signedMoney(netSaving) + ".";
    } else if (termGap > 0) {
      elements.termStatus.textContent = "Nově o " + monthLabel(termGap) + " déle";
      elements.termText.textContent = "Nižší splátku může vytvářet prodloužení.";
      elements.termCheck.classList.add("is-warning");
      elements.decisionHeadline.textContent = monthlySaving > 0 ? "Splátka klesla, ale hlídejte celkovou cenu" : "Delší doba nepřinesla nižší měsíční výdaj";
      elements.decisionText.textContent = "Nová splatnost je delší. Pro férovou kontrolu vychází stejná nová sazba při původní době celkem na " + money(fair.total) + ". Rozdíl proti vybrané době není cenou sazby, ale rozhodnutím splácet déle.";
      elements.detailHeadline.textContent = "Prodloužení snížilo povinný měsíční výdaj.";
      elements.detailText.textContent = "Vybranou novou nabídku proto porovnejte také s řádkem „Nová při stejné době“. Ten ukazuje, jak by nabídka vypadala bez prodloužení.";
    } else {
      elements.termStatus.textContent = "Nově o " + monthLabel(Math.abs(termGap)) + " kratší";
      elements.termText.textContent = "Vyšší splátka může urychlit konec úvěru.";
      elements.termCheck.classList.add("is-positive");
      elements.decisionHeadline.textContent = monthlySaving < 0 ? "Vyšší splátka kupuje rychlejší konec" : "Kratší doba i nižší měsíční výdaj";
      elements.decisionText.textContent = "Nová hypotéka skončí dříve. Čistý rozdíl už zahrnuje vyšší či nižší měsíční výdaj i kratší počet plateb, proto jej čtěte společně s odolností rozpočtu.";
      elements.detailHeadline.textContent = "Kratší splatnost snižuje dobu úročení.";
      elements.detailText.textContent = "Vyšší povinná splátka nemusí znamenat dražší úvěr. Tabulka porovnává celý počet plateb a ukazuje úplný modelový rozdíl.";
    }

    let rows = tableRow("Současná hypotéka", current, "is-current") + tableRow("Nová nabídka", next, "is-new");
    if (termGap !== 0) rows += tableRow("Nová při stejné době", fair, "is-fair");
    elements.comparisonBody.innerHTML = rows;

    elements.checkRateGap.textContent = rateGapLabel(rateGap);
    elements.checkTermGap.textContent = termGap === 0 ? "stejná doba" : (termGap > 0 ? "+" : "−") + monthLabel(Math.abs(termGap));
    elements.checkCosts.textContent = money(next.sideCosts);

    elements.heroCurrentRate.textContent = percent(data.currentRate);
    elements.heroNewRate.textContent = percent(data.newRate);
    elements.heroMonthlySaving.textContent = signedMoney(monthlySaving);
    elements.heroVerdict.textContent = termGap === 0 ? "stejná splatnost" : termGap > 0 ? "nová doba je delší" : "nová doba je kratší";
  }

  function update() {
    const data = dataFromForm();
    const error = validate(data);
    setError(error);
    if (error) return false;
    render(data);
    return true;
  }

  function syncBasicToPro() {
    const months = Math.max(1, Math.round(value(elements.basicYears) * 12));
    setValue(elements.proBalance, value(elements.basicBalance));
    setValue(elements.proCurrentRate, value(elements.basicCurrentRate));
    setValue(elements.proNewRate, value(elements.basicNewRate));
    setValue(elements.proCurrentYears, Math.floor(months / 12));
    setValue(elements.proCurrentMonths, months % 12);
    setValue(elements.proNewYears, Math.floor(months / 12));
    setValue(elements.proNewMonths, months % 12);
  }

  function syncProToBasic() {
    const months = Math.max(1, Math.round(value(elements.proCurrentYears) * 12 + value(elements.proCurrentMonths)));
    setValue(elements.basicBalance, value(elements.proBalance));
    setValue(elements.basicCurrentRate, value(elements.proCurrentRate));
    setValue(elements.basicNewRate, value(elements.proNewRate));
    setValue(elements.basicYears, Math.round(months / 12 * 100) / 100);
  }

  function setMode(nextMode, shouldSync) {
    if (nextMode === mode) return;
    if (shouldSync && nextMode === "pro") syncBasicToPro();
    if (shouldSync && nextMode === "basic") syncProToBasic();
    mode = nextMode;
    const isBasic = mode === "basic";
    elements.basicFields.hidden = !isBasic;
    elements.proFields.hidden = isBasic;
    elements.basicTab.classList.toggle("is-active", isBasic);
    elements.proTab.classList.toggle("is-active", !isBasic);
    elements.basicTab.setAttribute("aria-selected", String(isBasic));
    elements.proTab.setAttribute("aria-selected", String(!isBasic));
    elements.modeStatus.textContent = isBasic ? "Basic" : "PRO";
    elements.switchToPro.hidden = !isBasic;
    elements.formModeLabel.textContent = isBasic ? "Stačí 4 údaje" : "Přesné porovnání nabídek";
    elements.formModeText.textContent = isBasic
      ? "Porovnejte sazby při stejném zůstatku a stejné době. Bez poplatků tak uvidíte čistý rozdíl vytvořený úrokovou sazbou."
      : "Nastavte přesnou dobu obou úvěrů, jednorázové výdaje a povinné měsíční služby. Výsledek odliší splátku, úroky a úplnou cenu.";
    update();
  }

  function applyPreset(name) {
    if (name === "standard") {
      setMode("basic", false);
      setValue(elements.basicBalance, 3200000); setValue(elements.basicYears, 24); setValue(elements.basicCurrentRate, 5.69); setValue(elements.basicNewRate, 4.29);
    } else if (name === "closeRates") {
      setMode("pro", true);
      setValue(elements.proBalance, 4000000); setValue(elements.proCurrentRate, 4.89); setValue(elements.proCurrentYears, 20); setValue(elements.proCurrentMonths, 0);
      setValue(elements.proNewRate, 4.59); setValue(elements.proNewYears, 20); setValue(elements.proNewMonths, 0); setValue(elements.proOneTimeCosts, 25000);
      setValue(elements.proCurrentMonthlyCosts, 0); setValue(elements.proNewMonthlyCosts, 299);
    } else if (name === "shorterTerm") {
      setMode("pro", true);
      setValue(elements.proBalance, 3000000); setValue(elements.proCurrentRate, 5.2); setValue(elements.proCurrentYears, 22); setValue(elements.proCurrentMonths, 0);
      setValue(elements.proNewRate, 4.4); setValue(elements.proNewYears, 18); setValue(elements.proNewMonths, 0); setValue(elements.proOneTimeCosts, 15000);
      setValue(elements.proCurrentMonthlyCosts, 0); setValue(elements.proNewMonthlyCosts, 0);
    }
    update();
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    if (update()) $("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  form.addEventListener("input", function (event) {
    if (event.target.matches("input, select")) update();
  });

  elements.basicTab.addEventListener("click", () => setMode("basic", true));
  elements.proTab.addEventListener("click", () => setMode("pro", true));
  elements.switchToPro.addEventListener("click", () => setMode("pro", true));

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });

  elements.resetBtn.addEventListener("click", function () {
    setMode("basic", false);
    setValue(elements.basicBalance, 3200000); setValue(elements.basicYears, 24); setValue(elements.basicCurrentRate, 5.69); setValue(elements.basicNewRate, 4.29);
    setValue(elements.proBalance, 3200000); setValue(elements.proCurrentRate, 5.69); setValue(elements.proCurrentYears, 24); setValue(elements.proCurrentMonths, 0);
    setValue(elements.proNewRate, 4.29); setValue(elements.proNewYears, 24); setValue(elements.proNewMonths, 0); setValue(elements.proOneTimeCosts, 15000);
    setValue(elements.proCurrentMonthlyCosts, 0); setValue(elements.proNewMonthlyCosts, 0);
    update();
  });

  elements.copyResult.addEventListener("click", async function () {
    if (!latest) return;
    const text = [
      "Refinancování hypotéky – orientační výsledek",
      "Zůstatek: " + money(latest.data.principal),
      "Současná sazba: " + percent(latest.data.currentRate) + ", nová sazba: " + percent(latest.data.newRate),
      "Současný měsíční výdaj: " + money(latest.current.monthlyOutflow),
      "Nový měsíční výdaj: " + money(latest.next.monthlyOutflow),
      "Čistý rozdíl celkových nákladů: " + signedMoney(latest.netSaving),
      "Doba návratnosti: " + (latest.breakEven === null ? "v modelu nenastane" : latest.breakEven === 0 ? "ihned" : monthLabel(latest.breakEven)),
      "Výsledek je orientační a nenahrazuje nabídku banky."
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      const original = elements.copyResult.textContent;
      elements.copyResult.textContent = "Zkopírováno";
      window.setTimeout(() => { elements.copyResult.textContent = original; }, 1600);
    } catch (error) {
      elements.copyResult.textContent = "Kopírování se nezdařilo";
    }
  });

  elements.printResult.addEventListener("click", () => window.print());
  update();
})();
