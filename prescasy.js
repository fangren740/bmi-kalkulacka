(() => {
  "use strict";

  const form = document.getElementById("overtimeForm");
  if (!form) return;

  const byId = (id) => document.getElementById(id);
  const moneyFormatter = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0
  });
  const moneyDetailedFormatter = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 2
  });
  const numberFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
  const percentFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });

  const state = { mode: "basic" };

  function safeNumber(value) {
    const normalized = String(value ?? "")
      .replace(/[\s\u00a0\u202f]/g, "")
      .replace(",", ".");
    if (!normalized) return 0;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function fieldNumber(id) {
    const input = byId(id);
    return input ? safeNumber(input.value) : 0;
  }

  function selectedValue(name) {
    const selected = form.querySelector(`input[name="${name}"]:checked`);
    return selected ? selected.value : "";
  }

  function money(value, detailed = false) {
    const safe = Number.isFinite(value) ? value : 0;
    return (detailed ? moneyDetailedFormatter : moneyFormatter).format(safe);
  }

  function hours(value) {
    return `${numberFormatter.format(Number.isFinite(value) ? value : 0)} h`;
  }

  function setText(id, text) {
    const element = byId(id);
    if (element) element.textContent = text;
  }

  function toggle(elementOrId, hidden) {
    const element = typeof elementOrId === "string" ? byId(elementOrId) : elementOrId;
    if (!element) return;
    element.classList.toggle("is-hidden", hidden);
  }

  function setError(id, message) {
    const input = byId(id);
    const error = byId(`${id}Error`);
    const field = input ? input.closest(".field") : null;
    if (error) error.textContent = message;
    if (field) field.classList.toggle("has-error", Boolean(message));
    if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validate(values) {
    const errors = {};
    if (values.rateMode === "hourly") {
      if (values.hourlyBase <= 0) errors.hourlyBase = "Zadejte kladnou hodinovou sazbu.";
      if (values.hourlyBase > 100000) errors.hourlyBase = "Zkontrolujte nezvykle vysokou sazbu.";
    } else {
      if (values.monthlyPay <= 0) errors.monthlyPay = "Zadejte kladnou měsíční částku.";
      if (values.monthlyPay > 10000000) errors.monthlyPay = "Zkontrolujte nezvykle vysokou částku.";
      if (values.monthlyFund <= 0) errors.monthlyFund = "Fond hodin musí být větší než nula.";
      if (values.monthlyFund > 744) errors.monthlyFund = "Fond hodin nemůže být vyšší než počet hodin v měsíci.";
    }
    if (values.overtimeHours <= 0) errors.overtimeHours = "Zadejte alespoň část přesčasové hodiny.";
    if (values.overtimeHours > 1000) errors.overtimeHours = "Zkontrolujte počet přesčasových hodin.";
    if (values.separateAverage) {
      if (values.averageEarnings <= 0) errors.averageEarnings = "Zadejte kladný průměrný výdělek.";
      if (values.averageEarnings > 100000) errors.averageEarnings = "Zkontrolujte nezvykle vysoký průměr.";
    }
    if (values.customPremium) {
      if (values.premiumPercent < 0) errors.premiumPercent = "Procento nemůže být záporné.";
      if (values.premiumPercent > 500) errors.premiumPercent = "Zkontrolujte nezvykle vysoké procento.";
    }
    if (values.includedOvertime && values.paySystem === "wage") {
      if (values.includedAnnual < 0 || values.includedAnnual > 150) errors.includedAnnual = "Pro běžného zaměstnance zadejte 0 až 150 hodin.";
      if (values.includedUsed < 0) errors.includedUsed = "Počet využitých hodin nemůže být záporný.";
      if (values.includedUsed > values.includedAnnual) errors.includedUsed = "Využité hodiny jsou vyšší než sjednaný rozsah.";
    }

    ["hourlyBase", "monthlyPay", "monthlyFund", "overtimeHours", "averageEarnings", "premiumPercent", "includedAnnual", "includedUsed"].forEach((id) => {
      setError(id, errors[id] || "");
    });
    return Object.keys(errors).length === 0;
  }

  function readValues() {
    return {
      paySystem: selectedValue("paySystem") || "wage",
      rateMode: byId("rateMode").value,
      hourlyBase: fieldNumber("hourlyBase"),
      monthlyPay: fieldNumber("monthlyPay"),
      monthlyFund: fieldNumber("monthlyFund"),
      overtimeHours: fieldNumber("overtimeHours"),
      settlement: selectedValue("settlement") || "cash",
      salaryDayType: byId("salaryDayType").value,
      separateAverage: byId("separateAverage").checked,
      averageEarnings: fieldNumber("averageEarnings"),
      customPremium: byId("customPremium").checked,
      premiumPercent: fieldNumber("premiumPercent"),
      includedOvertime: byId("includedOvertime").checked,
      includedAnnual: fieldNumber("includedAnnual"),
      includedUsed: fieldNumber("includedUsed")
    };
  }

  function calculate(values) {
    const hourly = values.rateMode === "monthly"
      ? values.monthlyPay / Math.max(values.monthlyFund, 1)
      : values.hourlyBase;
    const average = values.separateAverage ? values.averageEarnings : hourly;
    const defaultPercent = values.paySystem === "salary" && values.salaryDayType === "rest" ? 50 : 25;
    const premiumPercent = values.customPremium ? Math.max(values.premiumPercent, 0) : defaultPercent;

    const validIncluded = values.paySystem === "wage" && values.includedOvertime;
    const remainingIncluded = validIncluded ? Math.max(0, values.includedAnnual - values.includedUsed) : 0;
    const coveredHours = validIncluded ? Math.min(Math.max(values.overtimeHours, 0), remainingIncluded) : 0;
    const payableHours = Math.max(0, values.overtimeHours - coveredHours);

    const earnedPay = hourly * payableHours;
    const potentialPremium = average * payableHours * premiumPercent / 100;
    const leaveHours = values.settlement === "leave" ? payableHours : 0;

    let basePay = earnedPay;
    let premiumPay = potentialPremium;
    let totalCash = earnedPay + potentialPremium;

    if (values.settlement === "leave") {
      premiumPay = 0;
      if (values.paySystem === "salary") {
        basePay = 0;
        totalCash = 0;
      } else {
        totalCash = earnedPay;
      }
    }

    const cashScenario = earnedPay + potentialPremium;
    const leaveCashScenario = values.paySystem === "salary" ? 0 : earnedPay;
    const higherAveragePremium = average * 1.15 * payableHours * premiumPercent / 100;
    const higherAverageTotal = earnedPay + higherAveragePremium;
    const effectiveHourly = values.overtimeHours > 0 ? totalCash / values.overtimeHours : 0;
    const premiumHourly = payableHours > 0 ? potentialPremium / payableHours : 0;
    const componentTotal = basePay + premiumPay;
    const baseShare = componentTotal > 0 ? basePay / componentTotal * 100 : 0;
    const premiumShare = componentTotal > 0 ? premiumPay / componentTotal * 100 : 0;

    return {
      hourly,
      average,
      premiumPercent,
      remainingIncluded,
      coveredHours,
      payableHours,
      earnedPay,
      potentialPremium,
      basePay,
      premiumPay,
      totalCash,
      leaveHours,
      cashScenario,
      leaveCashScenario,
      higherAverageTotal,
      effectiveHourly,
      premiumHourly,
      baseShare,
      premiumShare
    };
  }

  function updateVisibility(values) {
    const monthly = values.rateMode === "monthly";
    toggle("hourlyBaseWrap", monthly);
    toggle("monthlyPayWrap", !monthly);
    toggle("monthlyFundWrap", !monthly);
    toggle("salaryDayWrap", values.paySystem !== "salary");
    toggle("averageEarningsWrap", !values.separateAverage);
    toggle("premiumPercentWrap", !values.customPremium);
    toggle("includedFields", !(values.includedOvertime && values.paySystem === "wage"));
    toggle("includedSection", values.paySystem !== "wage");

    const advancedPanel = byId("advancedPanel");
    advancedPanel.hidden = state.mode !== "advanced";
  }

  function interpretation(values, result) {
    if (result.coveredHours > 0 && result.payableHours === 0) {
      return `Všech ${hours(result.coveredHours)} model označuje jako pokryté dosud nevyčerpaným sjednaným rozsahem. Platnost ujednání musí být ověřena ve smlouvě; bez konkrétního rozsahu tento závěr neplatí.`;
    }
    if (result.coveredHours > 0) {
      return `${hours(result.coveredHours)} pokrývá dosud nevyčerpaný sjednaný rozsah a ${hours(result.payableHours)} zůstává k běžnému vyrovnání. Zkontrolujte roční evidenci zahrnutých hodin.`;
    }
    if (values.settlement === "leave" && values.paySystem === "wage") {
      return `Náhradní volno nahrazuje příplatek, nikoli dosaženou mzdu za ${hours(result.payableHours)} práce. Sledujte, zda bude volno skutečně poskytnuto do tří měsíců nebo v jiné dohodnuté době.`;
    }
    if (values.settlement === "leave" && values.paySystem === "salary") {
      return `V modelu nevzniká okamžitá částka navíc; za ${hours(result.leaveHours)} přesčasu má následovat náhradní volno a za dobu jeho čerpání se plat nekrátí.`;
    }
    if (values.separateAverage && Math.abs(result.average - result.hourly) > 0.01) {
      return `Příplatek se počítá z průměrného výdělku ${money(result.average, true)} za hodinu, zatímco odměna za práci z hodinové hodnoty ${money(result.hourly, true)}. Právě tento rozdíl často vysvětluje odchylku na pásce.`;
    }
    if (values.paySystem === "salary" && result.premiumPercent === 50) {
      return "U platu v den nepřetržitého odpočinku kalkulačka používá 50% příplatek. Ověřte, zda konkrétní den skutečně odpovídá tomuto režimu.";
    }
    return "Výsledek odděluje odměnu za odpracované hodiny a příplatek. Pro přesnou kontrolu pásky ověřte zejména průměrný hodinový výdělek.";
  }

  function summary(values, result) {
    if (result.payableHours <= 0 && result.coveredHours > 0) {
      return `Aktuální přesčas je v modelu celý pokryt dosud nevyčerpaným rozsahem sjednaným ve mzdě. Bez ověření smlouvy nejde tento výsledek považovat za potvrzený.`;
    }
    if (values.settlement === "leave") {
      if (values.paySystem === "salary") {
        return `Za ${hours(result.payableHours)} vychází ${hours(result.leaveHours)} náhradního volna. Peněžní částka navíc je v tomto zjednodušeném platovém modelu nulová.`;
      }
      return `Za ${hours(result.payableHours)} vychází dosažená mzda ${money(result.basePay)} a ${hours(result.leaveHours)} náhradního volna místo příplatku.`;
    }
    return `Za ${hours(result.payableHours)} vychází odměna za práci ${money(result.basePay)} a příplatek ${money(result.premiumPay)}. Celkový orientační hrubý dopad je ${money(result.totalCash)}.`;
  }

  function title(values) {
    if (values.settlement === "leave") return values.paySystem === "salary" ? "Peněžní dopad a náhradní volno" : "Dosažená mzda a náhradní volno";
    return "Celkem navíc k výplatě";
  }

  function status(values, result) {
    if (result.coveredHours > 0) return { text: "Část hodin pokrývá mzda", className: "status-badge warning" };
    if (values.settlement === "leave") return { text: "Náhradní volno", className: "status-badge neutral" };
    if (result.premiumPercent > 25) return { text: `${percentFormatter.format(result.premiumPercent)}% příplatek`, className: "status-badge warning" };
    return { text: "Peněžní vyrovnání", className: "status-badge" };
  }

  function createBreakdownRow(label, value, note) {
    const row = document.createElement("tr");
    const heading = document.createElement("th");
    const amount = document.createElement("td");
    const explanation = document.createElement("td");
    heading.scope = "row";
    heading.textContent = label;
    amount.textContent = value;
    explanation.textContent = note;
    row.append(heading, amount, explanation);
    return row;
  }

  function renderBreakdown(values, result) {
    const body = byId("breakdownBody");
    if (!body) return;
    body.replaceChildren();
    const sourceNote = values.rateMode === "monthly"
      ? `${money(values.monthlyPay)} / ${hours(values.monthlyFund)}`
      : "zadaná hodinová sazba";
    const rows = [
      ["Hodinová odměna", `${money(result.hourly, true)}/h`, sourceNote],
      ["Průměrný výdělek", `${money(result.average, true)}/h`, values.separateAverage ? "zadán samostatně" : "v základním režimu shodný s hodinovou odměnou"],
      ["Přesčas celkem", hours(values.overtimeHours), "všechny zadané hodiny"],
      ["Pokryté sjednanou mzdou", hours(result.coveredHours), result.coveredHours > 0 ? "bez další odměny pouze při platném ujednání" : "žádné hodiny"],
      ["Hodiny k vyrovnání", hours(result.payableHours), "přesčas po odečtení pokrytých hodin"],
      ["Dosažená odměna", money(result.basePay), values.settlement === "leave" && values.paySystem === "salary" ? "u platového modelu nahrazena volnem" : "hodinová odměna × placené hodiny"],
      ["Sazba příplatku", `${percentFormatter.format(result.premiumPercent)} %`, values.customPremium ? "vlastní zadaná sazba" : "zákonný výchozí režim"],
      ["Příplatek", money(result.premiumPay), values.settlement === "leave" ? "nahrazen náhradním volnem" : "průměrný výdělek × hodiny × procento"],
      ["Náhradní volno", hours(result.leaveHours), values.settlement === "leave" ? "v rozsahu placených přesčasových hodin" : "nezvoleno"],
      ["Peněžní dopad", money(result.totalCash), "orientační hrubá částka navíc v tomto modelu"]
    ];
    rows.forEach((row) => body.appendChild(createBreakdownRow(row[0], row[1], row[2])));
  }

  function renderScenarios(values, result) {
    setText("scenarioCash", money(result.cashScenario));
    setText("scenarioCashText", `Při peněžním vyrovnání se sečte odměna ${money(result.earnedPay)} a příplatek ${money(result.potentialPremium)}.`);

    const leaveLabel = values.paySystem === "salary"
      ? `${hours(result.payableHours)} volna`
      : `${money(result.leaveCashScenario)} + ${hours(result.payableHours)} volna`;
    setText("scenarioLeave", leaveLabel);
    setText("scenarioLeaveText", values.paySystem === "salary"
      ? "U platu model ukazuje volno bez okamžité částky navíc; za dobu čerpání se plat nekrátí."
      : "U mzdy zůstává dosažená mzda, zatímco procentní příplatek nahrazuje volno.");

    setText("scenarioAverage", money(result.higherAverageTotal));
    setText("scenarioAverageText", `Při průměrném výdělku vyšším o 15 % vzroste pouze příplatek; hodinová odměna ${money(result.earnedPay)} zůstává stejná.`);

    if (values.paySystem !== "wage") {
      setText("scenarioIncluded", "Na plat se nepoužije");
      setText("scenarioIncludedText", "Sjednaná mzda s přihlédnutím k přesčasům je jiný institut než odměňování platem.");
    } else if (!values.includedOvertime) {
      setText("scenarioIncluded", "Zkontrolujte smlouvu");
      setText("scenarioIncludedText", "Bez konkrétně sjednaného rozsahu kalkulačka žádné hodiny automaticky neodečítá.");
    } else {
      setText("scenarioIncluded", `${hours(result.coveredHours)} pokryto`);
      setText("scenarioIncludedText", `${hours(result.payableHours)} zůstává k běžnému vyrovnání; před použitím ověřte platnost ujednání.`);
    }
  }

  function renderPayslip(values, result) {
    setText("mockHoursA", numberFormatter.format(result.payableHours));
    setText("mockHoursB", numberFormatter.format(result.payableHours));
    setText("mockRateA", money(result.hourly, true));
    setText("mockRateB", money(result.premiumHourly, true));
    setText("mockBase", money(result.basePay));
    setText("mockPremium", money(result.premiumPay));
    setText("mockTotal", money(result.totalCash));
  }

  function render(values, result, valid) {
    const cash = valid ? result.totalCash : 0;
    setText("resultTitle", title(values));
    setText("totalCash", money(cash));
    setText("resultSummary", valid ? summary(values, result) : "Opravte zvýrazněné vstupy. Kalkulačka nezobrazuje nesmyslné nebo neúplné výsledky.");
    setText("basePay", money(valid ? result.basePay : 0));
    setText("premiumPay", money(valid ? result.premiumPay : 0));
    setText("leaveHours", hours(valid ? result.leaveHours : 0));
    setText("coveredHours", hours(valid ? result.coveredHours : 0));
    setText("basePayNote", values.settlement === "leave" && values.paySystem === "salary" ? "nahrazeno náhradním volnem" : "hodinová odměna × placené hodiny");
    setText("premiumPayNote", values.settlement === "leave" ? "nahrazen náhradním volnem" : `${percentFormatter.format(result.premiumPercent)} % z průměrného výdělku`);
    setText("leaveNote", values.settlement === "leave" ? "v rozsahu placených hodin" : "nebylo zvoleno");
    setText("coveredNote", result.coveredHours > 0 ? "ověřte konkrétní ujednání" : "nejsou zahrnuté ve mzdě");
    setText("interpretationText", valid ? interpretation(values, result) : "Zkontrolujte sazbu, počet hodin a případné pokročilé údaje.");
    setText("usedHourly", `${money(valid ? result.hourly : 0, true)}/h`);
    setText("usedAverage", `${money(valid ? result.average : 0, true)}/h`);
    setText("payableHours", hours(valid ? result.payableHours : 0));
    setText("effectiveHourly", `${money(valid ? result.effectiveHourly : 0, true)}/h`);
    setText("baseShareLabel", `${percentFormatter.format(valid ? result.baseShare : 0)} %`);
    setText("premiumShareLabel", `${percentFormatter.format(valid ? result.premiumShare : 0)} %`);
    byId("baseShareBar").style.width = `${valid ? Math.max(0, Math.min(100, result.baseShare)) : 0}%`;
    byId("premiumShareBar").style.width = `${valid ? Math.max(0, Math.min(100, result.premiumShare)) : 0}%`;

    const badge = status(values, result);
    const badgeElement = byId("statusBadge");
    badgeElement.textContent = valid ? badge.text : "Doplňte vstupy";
    badgeElement.className = valid ? badge.className : "status-badge warning";

    setText("heroCash", money(cash));
    setText("heroSettlement", values.settlement === "leave" ? "náhradní volno" : "peněžní příplatek");
    setText("heroBase", money(valid ? result.basePay : 0));
    setText("heroPremium", money(valid ? result.premiumPay : 0));
    setText("heroHours", hours(valid ? result.payableHours : 0));
    setText("heroEffective", money(valid ? result.effectiveHourly : 0));
    setText("heroSystem", values.paySystem === "salary" ? "Plat" : "Mzda");
    setText("heroNote", valid ? interpretation(values, result) : "Opravte vstupy, aby bylo možné zobrazit spolehlivý náhled.");

    const visualTotal = result.basePay + result.premiumPay;
    const premiumRatio = visualTotal > 0 ? result.premiumPay / visualTotal : 0;
    byId("heroPremiumBar").style.width = `${Math.max(32, Math.min(100, 32 + premiumRatio * 68))}%`;

    renderBreakdown(values, result);
    renderScenarios(values, result);
    renderPayslip(values, result);
  }

  function run() {
    const values = readValues();
    if (values.paySystem === "salary" && values.includedOvertime) {
      byId("includedOvertime").checked = false;
      values.includedOvertime = false;
    }
    updateVisibility(values);
    const valid = validate(values);
    const result = calculate(values);
    render(values, result, valid);
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll("[data-mode]").forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    if (mode === "basic") {
      byId("separateAverage").checked = false;
      byId("customPremium").checked = false;
      byId("includedOvertime").checked = false;
    }
    run();
  }

  function reset() {
    form.querySelector('input[name="paySystem"][value="wage"]').checked = true;
    form.querySelector('input[name="settlement"][value="cash"]').checked = true;
    byId("rateMode").value = "hourly";
    byId("hourlyBase").value = "180";
    byId("monthlyPay").value = "32 000";
    byId("monthlyFund").value = "168";
    byId("overtimeHours").value = "8";
    byId("salaryDayType").value = "regular";
    byId("separateAverage").checked = false;
    byId("averageEarnings").value = "180";
    byId("customPremium").checked = false;
    byId("premiumPercent").value = "25";
    byId("includedOvertime").checked = false;
    byId("includedAnnual").value = "150";
    byId("includedUsed").value = "0";
    setMode("basic");
  }

  document.querySelectorAll("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.mode));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  form.querySelectorAll("input, select").forEach((control) => {
    control.addEventListener("input", run);
    control.addEventListener("change", () => {
      if (control.id === "separateAverage" && control.checked) {
        const current = calculate(readValues()).hourly;
        if (current > 0) byId("averageEarnings").value = numberFormatter.format(current);
      }
      if (control.name === "paySystem" && control.value === "salary" && control.checked) {
        byId("includedOvertime").checked = false;
      }
      run();
    });
  });

  byId("resetButton").addEventListener("click", reset);
  byId("breakdownToggle").addEventListener("click", () => {
    const panel = byId("breakdownPanel");
    const open = panel.hidden;
    panel.hidden = !open;
    byId("breakdownToggle").setAttribute("aria-expanded", open ? "true" : "false");
  });

  run();
})();
