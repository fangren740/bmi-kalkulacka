(function () {
  "use strict";

  const form = document.getElementById("strategyForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const moneyFormatter = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0
  });
  const numberFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });

  const defaults = {
    basic: { balance: 3000000, extra: 300000, rate: 4.8, years: 20, investmentReturn: 7 },
    pro: {
      balance: 3000000,
      extra: 300000,
      rate: 4.8,
      years: 20,
      investmentReturn: 7,
      annualCost: 0.6,
      fee: 0,
      taxLoss: 0,
      inflation: 2.5,
      strategy: "term"
    }
  };

  function parseNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
    const normalized = String(value == null ? "" : value)
      .trim()
      .replace(/[\s\u00a0\u202f]/g, "")
      .replace(",", ".");
    if (!normalized) return NaN;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function money(value) {
    const safe = Number.isFinite(value) ? value : 0;
    return moneyFormatter.format(Math.round(safe));
  }

  function percent(value, digits) {
    const safe = Number.isFinite(value) ? value : 0;
    const places = digits == null ? 2 : digits;
    return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: places }).format(safe) + " %";
  }

  function monthsLabel(value) {
    const months = Math.max(0, Math.round(value));
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const yearWord = years === 1 ? "rok" : years < 5 ? "roky" : "let";
    const monthWord = rest === 1 ? "měsíc" : rest < 5 ? "měsíce" : "měsíců";
    if (years && rest) return years + " " + yearWord + " a " + rest + " " + monthWord;
    if (years) return years + " " + yearWord;
    return rest + " " + monthWord;
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function annuityPayment(balance, annualRate, months) {
    if (balance <= 0 || months <= 0) return 0;
    const monthlyRate = annualRate / 1200;
    if (Math.abs(monthlyRate) < 1e-12) return balance / months;
    return balance * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
  }

  function simulateLoan(balance, annualRate, plannedMonths, payment) {
    let remaining = Math.max(0, balance);
    const monthlyRate = annualRate / 1200;
    let totalInterest = 0;
    let totalPaid = 0;
    let month = 0;
    const maximumMonths = Math.max(plannedMonths + 2, 2);

    while (remaining > 0.005 && month < maximumMonths) {
      const interest = remaining * monthlyRate;
      const due = remaining + interest;
      const actualPayment = Math.min(payment, due);
      const principalPart = actualPayment - interest;
      if (principalPart <= 0 && remaining > 0) {
        return { valid: false, months: month, totalInterest: totalInterest, totalPaid: totalPaid, remaining: remaining };
      }
      remaining = Math.max(0, remaining - principalPart);
      totalInterest += interest;
      totalPaid += actualPayment;
      month += 1;
    }

    return {
      valid: remaining <= 0.005,
      months: month,
      totalInterest: totalInterest,
      totalPaid: totalPaid,
      remaining: remaining
    };
  }

  function calculateScenario(input) {
    const months = Math.max(1, Math.round(input.years * 12));
    const basePayment = annuityPayment(input.balance, input.rate, months);
    const baseSchedule = simulateLoan(input.balance, input.rate, months, basePayment);
    const balanceAfterExtra = Math.max(0, input.balance - input.extra);

    let newPayment = basePayment;
    let repaySchedule;
    if (input.strategy === "payment") {
      newPayment = annuityPayment(balanceAfterExtra, input.rate, months);
      repaySchedule = simulateLoan(balanceAfterExtra, input.rate, months, newPayment);
    } else {
      repaySchedule = simulateLoan(balanceAfterExtra, input.rate, months, basePayment);
    }

    const interestSaved = Math.max(0, baseSchedule.totalInterest - repaySchedule.totalInterest);
    const repayGain = interestSaved - input.fee - input.taxLoss;
    const netReturn = input.investmentReturn - input.annualCost;
    const growthBase = Math.max(0.000001, 1 + netReturn / 100);
    const investmentFinal = input.extra * Math.pow(growthBase, input.years);
    const investmentGain = investmentFinal - input.extra;
    const difference = investmentGain - repayGain;
    const breakEvenBase = 1 + repayGain / Math.max(input.extra, 1);
    const breakEvenNet = breakEvenBase > 0 ? (Math.pow(breakEvenBase, 1 / input.years) - 1) * 100 : -100;
    const breakEvenGross = breakEvenNet + input.annualCost;
    const inflationFactor = Math.pow(Math.max(0.000001, 1 + input.inflation / 100), input.years);

    return {
      months: months,
      basePayment: basePayment,
      baseSchedule: baseSchedule,
      balanceAfterExtra: balanceAfterExtra,
      newPayment: newPayment,
      repaySchedule: repaySchedule,
      interestSaved: interestSaved,
      repayGain: repayGain,
      netReturn: netReturn,
      investmentFinal: investmentFinal,
      investmentGain: investmentGain,
      difference: difference,
      breakEvenNet: breakEvenNet,
      breakEvenGross: breakEvenGross,
      realInvestmentGain: investmentGain / inflationFactor,
      realRepayGain: repayGain / inflationFactor,
      shortenedMonths: Math.max(0, months - repaySchedule.months),
      monthlyRelief: Math.max(0, basePayment - newPayment)
    };
  }

  function activeMode() {
    return form.dataset.mode === "pro" ? "pro" : "basic";
  }

  function selectedStrategy() {
    const selected = form.querySelector('input[name="repayStrategy"]:checked');
    return selected && selected.value === "payment" ? "payment" : "term";
  }

  function readBasic() {
    return {
      balance: parseNumber($("basicBalance").value),
      extra: parseNumber($("basicExtra").value),
      rate: parseNumber($("basicRate").value),
      years: parseNumber($("basicYears").value),
      investmentReturn: parseNumber($("basicReturn").value),
      annualCost: 0,
      fee: 0,
      taxLoss: 0,
      inflation: 0,
      strategy: "term"
    };
  }

  function readPro() {
    return {
      balance: parseNumber($("proBalance").value),
      extra: parseNumber($("proExtra").value),
      rate: parseNumber($("proRate").value),
      years: parseNumber($("proYears").value),
      investmentReturn: parseNumber($("proReturn").value),
      annualCost: parseNumber($("proCost").value),
      fee: parseNumber($("proFee").value),
      taxLoss: parseNumber($("proTaxLoss").value),
      inflation: parseNumber($("proInflation").value),
      strategy: selectedStrategy()
    };
  }

  function fieldIdsForMode(mode) {
    return mode === "pro"
      ? ["proBalance", "proExtra", "proRate", "proYears", "proReturn", "proCost", "proFee", "proTaxLoss", "proInflation"]
      : ["basicBalance", "basicExtra", "basicRate", "basicYears", "basicReturn"];
  }

  function clearValidation() {
    form.querySelectorAll(".ivh-field.is-invalid").forEach(function (element) {
      element.classList.remove("is-invalid");
    });
    setText("formMessage", "");
  }

  function markInvalid(id) {
    const field = $(id);
    const container = field ? field.closest(".ivh-field") : null;
    if (container) container.classList.add("is-invalid");
  }

  function validate(input, mode) {
    clearValidation();
    const errors = [];
    const prefix = mode === "pro" ? "pro" : "basic";
    const checks = [
      { ok: input.balance >= 10000 && input.balance <= 100000000, id: prefix + "Balance", message: "Zůstatek hypotéky musí být mezi 10 000 Kč a 100 miliony Kč." },
      { ok: input.extra >= 1000 && input.extra <= input.balance, id: prefix + "Extra", message: "Volná částka musí být alespoň 1 000 Kč a nesmí převýšit zůstatek hypotéky." },
      { ok: input.rate >= 0 && input.rate <= 30, id: prefix + "Rate", message: "Úrok hypotéky zadejte v rozsahu 0 až 30 %." },
      { ok: input.years >= 1 && input.years <= 40, id: prefix + "Years", message: "Zbývající dobu zadejte od 1 do 40 let." },
      { ok: input.investmentReturn > -99 && input.investmentReturn <= 40, id: prefix + "Return", message: "Očekávaný výnos musí být vyšší než −99 % a nejvýše 40 %." }
    ];

    if (mode === "pro") {
      checks.push(
        { ok: input.annualCost >= 0 && input.annualCost <= 15, id: "proCost", message: "Roční náklady zadejte v rozsahu 0 až 15 %." },
        { ok: input.fee >= 0 && input.fee <= input.extra, id: "proFee", message: "Poplatek nesmí být záporný ani vyšší než mimořádná splátka." },
        { ok: input.taxLoss >= 0 && input.taxLoss <= input.extra, id: "proTaxLoss", message: "Daňový dopad nesmí být záporný ani vyšší než volná částka." },
        { ok: input.inflation > -99 && input.inflation <= 30, id: "proInflation", message: "Inflaci zadejte v rozumném rozsahu od −99 % do 30 %." },
        { ok: input.investmentReturn - input.annualCost > -99, id: "proCost", message: "Čistý investiční výnos musí zůstat vyšší než −99 %." }
      );
    }

    checks.forEach(function (check) {
      if (!check.ok) {
        markInvalid(check.id);
        errors.push(check.message);
      }
    });

    fieldIdsForMode(mode).forEach(function (id) {
      if (!Number.isFinite(parseNumber($(id).value))) {
        markInvalid(id);
        if (!errors.length) errors.push("Vyplňte všechna pole platnými čísly.");
      }
    });

    if (errors.length) {
      setText("formMessage", errors[0]);
      return false;
    }
    return true;
  }

  function decisionState(input, result) {
    const closeLimit = Math.max(10000, input.extra * 0.03);
    if (Math.abs(result.difference) <= closeLimit) {
      return {
        type: "close",
        badge: "Výsledek je těsný",
        leader: "Oba přínosy jsou v modelu blízko",
        narrative: "Rozdíl " + money(Math.abs(result.difference)) + " je proti volné částce malý. Větší váhu proto mají rezerva, likvidita, smluvní podmínky a vaše schopnost unést investiční pokles."
      };
    }
    if (result.difference > 0) {
      return {
        type: "invest",
        badge: "Číselně vede investice",
        leader: "Modelový investiční zisk je vyšší",
        narrative: "Investiční scénář vytváří o " + money(result.difference) + " vyšší modelový přínos. Výsledek předpokládá průměrný čistý výnos " + percent(result.netReturn) + " ročně, který není zaručen."
      };
    }
    return {
      type: "repay",
      badge: "Číselně vede mimořádná splátka",
      leader: "Čistá úspora úroků je vyšší",
      narrative: "Mimořádná splátka vytváří o " + money(Math.abs(result.difference)) + " vyšší modelový přínos. Ověřte poplatek, nový kalendář a dopad na dostupnou rezervu."
    };
  }

  function setBar(id, value, maximum) {
    const element = $(id);
    if (!element) return;
    const positive = Math.max(0, value);
    const width = maximum > 0 ? Math.max(4, Math.min(100, positive / maximum * 100)) : 4;
    element.style.width = width + "%";
  }

  function renderSummaryTable(input, result) {
    const rows = [
      ["Výchozí jistina hypotéky", money(input.balance), "aktuální nesplacený zůstatek"],
      ["Volná částka", money(input.extra), "stejný základ pro obě strategie"],
      ["Původní měsíční splátka", money(result.basePayment), percent(input.rate) + " p.a. na " + numberFormatter.format(input.years) + " let"],
      ["Původní úroky do konce", money(result.baseSchedule.totalInterest), "při neměnné sazbě"],
      ["Úroky po mimořádné splátce", money(result.repaySchedule.totalInterest), input.strategy === "term" ? "při zachování původní splátky" : "při zachování původního konce"],
      ["Ušetřené úroky", money(result.interestSaved), "rozdíl obou anuitních kalendářů"],
      ["Náklady splátkové varianty", money(input.fee + input.taxLoss), "poplatek a zadaný daňový dopad"],
      ["Čistá úspora splátky", money(result.repayGain), "ušetřené úroky po nákladech"],
      ["Konečná hodnota investice", money(result.investmentFinal), "při čistém výnosu " + percent(result.netReturn) + " p.a."],
      ["Čistý investiční zisk", money(result.investmentGain), "budoucí hodnota minus původní vklad"],
      ["Rozdíl přínosů", money(result.difference), "investiční zisk minus čistá úspora splátky"]
    ];
    $("summaryTableBody").innerHTML = rows.map(function (row) {
      return '<tr><td data-label="Položka">' + row[0] + '</td><td data-label="Hodnota"><strong>' + row[1] + '</strong></td><td data-label="Co znamená">' + row[2] + "</td></tr>";
    }).join("");
  }

  function renderScenarioTable(input, result) {
    const scenarios = [
      { label: "Slabší výnos", value: input.investmentReturn - 2, cls: "" },
      { label: "Zadaný výnos", value: input.investmentReturn, cls: "is-base" },
      { label: "Vyšší výnos", value: input.investmentReturn + 2, cls: "" }
    ];
    $("scenarioTableBody").innerHTML = scenarios.map(function (scenario) {
      const net = scenario.value - input.annualCost;
      const final = input.extra * Math.pow(Math.max(0.000001, 1 + net / 100), input.years);
      const gain = final - input.extra;
      const difference = gain - result.repayGain;
      return '<tr class="' + scenario.cls + '"><td data-label="Scénář">' + scenario.label + '</td><td data-label="Čistý výnos">' + percent(net) + ' p.a.</td><td data-label="Investiční zisk"><strong>' + money(gain) + '</strong></td><td data-label="Úspora splátky">' + money(result.repayGain) + '</td><td data-label="Rozdíl">' + money(difference) + "</td></tr>";
    }).join("");
  }

  function render(input, result, mode) {
    const state = decisionState(input, result);
    const maxGain = Math.max(1, result.investmentGain, result.repayGain);
    const differenceText = money(Math.abs(result.difference));

    setText("modeStatus", mode === "pro" ? "PRO scénář" : "Basic");
    setText("resultDifference", differenceText);
    setText("resultBadge", state.badge);
    $("resultBadge").className = "ivh-result__badge" + (state.type === "repay" ? " is-repay" : state.type === "close" ? " is-close" : "");
    setText("resultNarrative", state.narrative);
    setText("investGain", money(result.investmentGain));
    setText("repayGain", money(result.repayGain));
    setText("investFinal", money(result.investmentFinal));
    setText("interestSaved", money(result.interestSaved));
    setText("breakEven", percent(result.breakEvenNet) + " p.a.");
    setText("basePayment", money(result.basePayment));
    setBar("investBar", result.investmentGain, maxGain);
    setBar("repayBar", result.repayGain, maxGain);

    if (input.strategy === "payment") {
      setText("paymentMetricLabel", "Nová měsíční splátka");
      setText("newPayment", money(result.newPayment));
      setText("paymentMetricHelp", "pokles o " + money(result.monthlyRelief));
      setText("termMetricLabel", "Doba splácení");
      setText("termChange", monthsLabel(result.repaySchedule.months));
      setText("termMetricHelp", "původní konec zůstává");
    } else {
      setText("paymentMetricLabel", "Splátka po mimořádné splátce");
      setText("newPayment", money(result.basePayment));
      setText("paymentMetricHelp", "původní splátka zůstává");
      setText("termMetricLabel", "Zkrácení úvěru");
      setText("termChange", monthsLabel(result.shortenedMonths));
      setText("termMetricHelp", "nově doplaceno za " + monthsLabel(result.repaySchedule.months));
    }

    $("realValues").hidden = mode !== "pro";
    setText("realInvestGain", money(result.realInvestmentGain));
    setText("realRepayGain", money(result.realRepayGain));

    setText("overviewAmount", money(input.extra));
    setText("overviewInvest", money(result.investmentGain));
    setText("overviewRepay", money(result.repayGain));
    setText("overviewDifference", money(result.difference));
    setText("readingTitle", state.leader + ".");
    setText("readingText", state.narrative + " Bod zvratu po nákladech vychází přibližně na " + percent(result.breakEvenNet) + " ročně.");
    setText("decisionAmount", money(input.extra));
    setText("decisionMortgage", percent(input.rate) + " · " + numberFormatter.format(input.years) + " let");
    setText("decisionReturn", percent(result.netReturn) + " p.a.");
    setText("decisionBreakEven", percent(result.breakEvenNet) + " p.a.");
    setText("capitalAmountHero", money(input.extra));
    setText("capitalReturnLive", percent(result.netReturn) + " p.a.");
    setText("capitalBreakEvenLive", percent(result.breakEvenNet) + " p.a.");

    setText("heroDifference", differenceText);
    setText("heroLeader", state.leader);
    setText("heroInvest", money(result.investmentGain));
    setText("heroRepay", money(result.repayGain));
    setText("heroBreakEven", percent(result.breakEvenNet) + " p.a.");
    setText("heroPayment", money(result.basePayment));
    setText("heroYears", numberFormatter.format(input.years) + " let");
    setBar("heroInvestBar", result.investmentGain, maxGain);
    setBar("heroRepayBar", result.repayGain, maxGain);

    renderSummaryTable(input, result);
    renderScenarioTable(input, result);
  }

  function run(options) {
    const settings = options || {};
    const mode = activeMode();
    const input = mode === "pro" ? readPro() : readBasic();
    if (!validate(input, mode)) return null;
    const result = calculateScenario(input);
    if (!result.baseSchedule.valid || !result.repaySchedule.valid) {
      setText("formMessage", "Zadané hodnoty nevytvářejí platný splátkový kalendář. Zkontrolujte sazbu a dobu.");
      return null;
    }
    render(input, result, mode);
    if (settings.scrollToResult && window.matchMedia("(max-width: 820px)").matches) {
      $("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return { input: input, result: result };
  }

  function setValue(id, value) {
    $(id).value = String(value).replace(".", ",");
  }

  function copyBasicToPro() {
    const input = readBasic();
    setValue("proBalance", input.balance);
    setValue("proExtra", input.extra);
    setValue("proRate", input.rate);
    setValue("proYears", input.years);
    setValue("proReturn", input.investmentReturn);
  }

  function setMode(mode, options) {
    const settings = options || {};
    const next = mode === "pro" ? "pro" : "basic";
    form.dataset.mode = next;
    document.body.dataset.mode = next;
    document.querySelectorAll("[data-mode-button]").forEach(function (button) {
      const active = button.dataset.modeButton === next;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.setAttribute("tabindex", active ? "0" : "-1");
    });
    document.querySelectorAll("[data-mode-panel]").forEach(function (panel) {
      panel.hidden = panel.dataset.modePanel !== next;
    });
    if (next === "pro" && settings.copyBasic) copyBasicToPro();
    run();
  }

  function resetBasic() {
    const d = defaults.basic;
    setValue("basicBalance", d.balance);
    setValue("basicExtra", d.extra);
    setValue("basicRate", d.rate);
    setValue("basicYears", d.years);
    setValue("basicReturn", d.investmentReturn);
    document.querySelectorAll("[data-basic-preset]").forEach(function (button) {
      button.classList.toggle("is-active", button.dataset.basicPreset === "balanced");
    });
    run();
  }

  function resetPro() {
    const d = defaults.pro;
    setValue("proBalance", d.balance);
    setValue("proExtra", d.extra);
    setValue("proRate", d.rate);
    setValue("proYears", d.years);
    setValue("proReturn", d.investmentReturn);
    setValue("proCost", d.annualCost);
    setValue("proFee", d.fee);
    setValue("proTaxLoss", d.taxLoss);
    setValue("proInflation", d.inflation);
    form.querySelector('input[name="repayStrategy"][value="' + d.strategy + '"]').checked = true;
    run();
  }

  const modeButtons = Array.from(document.querySelectorAll("[data-mode-button]"));
  modeButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      setMode(button.dataset.modeButton);
    });
    button.addEventListener("keydown", function (event) {
      if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
      event.preventDefault();
      let index = modeButtons.indexOf(button);
      if (event.key === "Home") index = 0;
      else if (event.key === "End") index = modeButtons.length - 1;
      else if (event.key === "ArrowRight") index = (index + 1) % modeButtons.length;
      else index = (index - 1 + modeButtons.length) % modeButtons.length;
      const target = modeButtons[index];
      setMode(target.dataset.modeButton);
      target.focus();
    });
  });

  document.querySelectorAll("[data-open-pro]").forEach(function (button) {
    button.addEventListener("click", function () {
      setMode("pro", { copyBasic: true });
    });
  });

  document.querySelectorAll("[data-basic-preset]").forEach(function (button) {
    button.addEventListener("click", function () {
      const preset = button.dataset.basicPreset;
      const values = preset === "debt"
        ? { balance: 2400000, extra: 250000, rate: 5.6, years: 12, investmentReturn: 4 }
        : preset === "long"
          ? { balance: 3500000, extra: 300000, rate: 3.7, years: 25, investmentReturn: 7 }
          : defaults.basic;
      setValue("basicBalance", values.balance);
      setValue("basicExtra", values.extra);
      setValue("basicRate", values.rate);
      setValue("basicYears", values.years);
      setValue("basicReturn", values.investmentReturn);
      document.querySelectorAll("[data-basic-preset]").forEach(function (item) {
        item.classList.toggle("is-active", item === button);
      });
      run();
    });
  });

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    run({ scrollToResult: true });
  });

  form.querySelectorAll("input").forEach(function (field) {
    field.addEventListener("input", function () { run(); });
    field.addEventListener("change", function () { run(); });
  });

  $("resetBasic").addEventListener("click", resetBasic);
  $("resetPro").addEventListener("click", resetPro);
  $("copyFromBasic").addEventListener("click", function () {
    copyBasicToPro();
    run();
  });

  $("copyResult").addEventListener("click", async function () {
    const calculated = run();
    if (!calculated) return;
    const input = calculated.input;
    const result = calculated.result;
    const state = decisionState(input, result);
    const text = "Investovat vs. splatit hypotéku: " + state.badge + ". Rozdíl přínosů " + money(Math.abs(result.difference)) + ". Investiční zisk " + money(result.investmentGain) + ", čistá úspora splátky " + money(result.repayGain) + ", bod zvratu " + percent(result.breakEvenNet) + " p.a.";
    try {
      await navigator.clipboard.writeText(text);
      setText("copyResult", "Zkopírováno");
      window.setTimeout(function () { setText("copyResult", "Kopírovat výsledek"); }, 1600);
    } catch (_) {
      setText("copyResult", "Kopírování se nezdařilo");
    }
  });

  $("printResult").addEventListener("click", function () { window.print(); });

  window.__ivhCalculator = {
    parseNumber: parseNumber,
    annuityPayment: annuityPayment,
    simulateLoan: simulateLoan,
    calculateScenario: calculateScenario
  };

  run();
})();
