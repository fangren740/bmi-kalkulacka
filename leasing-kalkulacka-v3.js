(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const form = $("leasingForm");
  if (!form) return;

  const ids = [
    "assetPrice", "downPaymentPercent", "leaseMonths", "annualRate",
    "residualPercent", "processingFee", "monthlyFee", "monthlyInsurance",
    "monthlyService", "monthlyBudget", "annualKm", "vatMode", "compareDown",
    "compareMonths", "compareRate", "compareResidual", "compareInitialFee",
    "compareMonthlyExtras"
  ];
  const fields = Object.fromEntries(ids.map((id) => [id, $(id)]));

  const defaults = {
    assetPrice: 650000,
    downPaymentPercent: 20,
    leaseMonths: 60,
    annualRate: 6.9,
    residualPercent: 0,
    processingFee: 0,
    monthlyFee: 0,
    monthlyInsurance: 0,
    monthlyService: 0,
    monthlyBudget: 15000,
    annualKm: 15000,
    vatMode: "gross",
    compareDown: 10,
    compareMonths: 72,
    compareRate: 5.9,
    compareResidual: 15,
    compareInitialFee: 5000,
    compareMonthlyExtras: 1500
  };

  const presets = {
    standard: { assetPrice: 650000, downPaymentPercent: 20, leaseMonths: 60, annualRate: 6.9 },
    low: { assetPrice: 550000, downPaymentPercent: 10, leaseMonths: 72, annualRate: 7.4 },
    short: { assetPrice: 650000, downPaymentPercent: 30, leaseMonths: 36, annualRate: 5.9 }
  };

  const money = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0
  });
  const number = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
  const whole = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });

  let lastValid = null;

  function value(id) {
    const raw = Number.parseFloat(fields[id].value.replace ? fields[id].value.replace(",", ".") : fields[id].value);
    return Number.isFinite(raw) ? raw : 0;
  }

  function formatMoney(amount) {
    return money.format(Math.round(amount)).replace(/\u00a0/g, " ");
  }

  function formatPercent(amount) {
    return `${number.format(amount)} %`;
  }

  function setText(id, text) {
    const node = $(id);
    if (node) node.textContent = text;
  }

  function setInvalid(element, invalid) {
    if (!element) return;
    element.setAttribute("aria-invalid", invalid ? "true" : "false");
    element.closest(".mrp-field")?.classList.toggle("is-invalid", invalid);
  }

  function monthlyInstallment(principal, residual, annualRate, months) {
    if (months <= 0) return 0;
    const monthlyRate = annualRate / 1200;
    if (Math.abs(monthlyRate) < 0.0000001) return Math.max(0, (principal - residual) / months);
    const discount = Math.pow(1 + monthlyRate, -months);
    return Math.max(0, (principal - residual * discount) * monthlyRate / (1 - discount));
  }

  function calculateScenario(source) {
    const down = source.price * source.downPercent / 100;
    const financed = source.price - down;
    const residual = source.price * source.residualPercent / 100;
    const basePayment = monthlyInstallment(financed, residual, source.annualRate, source.months);
    const monthlyExtras = source.monthlyExtras || 0;
    const monthlyPayment = basePayment + monthlyExtras;
    const installmentsTotal = monthlyPayment * source.months;
    const totalPaid = down + installmentsTotal + residual + (source.initialFee || 0);
    return {
      ...source,
      down,
      financed,
      residual,
      basePayment,
      monthlyPayment,
      installmentsTotal,
      totalPaid,
      overpayment: totalPaid - source.price,
      effectiveMonthly: totalPaid / source.months,
      extraCosts: (source.initialFee || 0) + monthlyExtras * source.months
    };
  }

  function readPrimary() {
    return {
      price: value("assetPrice"),
      downPercent: value("downPaymentPercent"),
      months: value("leaseMonths"),
      annualRate: value("annualRate"),
      residualPercent: value("residualPercent"),
      initialFee: value("processingFee"),
      monthlyExtras: value("monthlyFee") + value("monthlyInsurance") + value("monthlyService"),
      monthlyFee: value("monthlyFee"),
      monthlyInsurance: value("monthlyInsurance"),
      monthlyService: value("monthlyService"),
      monthlyBudget: value("monthlyBudget"),
      annualKm: value("annualKm"),
      vatMode: fields.vatMode.value
    };
  }

  function validate(source, compare) {
    const downField = compare ? fields.compareDown : fields.downPaymentPercent;
    const residualField = compare ? fields.compareResidual : fields.residualPercent;
    const priceField = compare ? null : fields.assetPrice;
    const monthsField = compare ? fields.compareMonths : fields.leaseMonths;
    const rateField = compare ? fields.compareRate : fields.annualRate;

    const states = {
      price: source.price < 10000,
      down: source.downPercent < 0 || source.downPercent > 90,
      months: source.months < 6 || source.months > 120,
      rate: source.annualRate < 0 || source.annualRate > 50,
      residual: source.residualPercent < 0 || source.residualPercent > 80 || source.downPercent + source.residualPercent >= 100
    };
    if (priceField) setInvalid(priceField, states.price);
    setInvalid(downField, states.down || states.residual);
    setInvalid(monthsField, states.months);
    setInvalid(rateField, states.rate);
    setInvalid(residualField, states.residual);
    return !Object.values(states).some(Boolean);
  }

  function buildRows(result) {
    const mode = result.vatMode === "net" ? "bez DPH" : "včetně DPH";
    const rows = [
      ["Pořizovací cena", formatMoney(result.price), `Zadaná částka ${mode}`],
      ["Akontace", formatMoney(result.down), `${formatPercent(result.downPercent)} ceny zaplaceno předem`],
      ["Financovaná částka", formatMoney(result.financed), "Cena po odečtení akontace"],
      ["Základní splátka", formatMoney(result.basePayment), `${result.months} měsíců při sazbě ${number.format(result.annualRate)} % p. a.`]
    ];
    if (result.monthlyExtras > 0) rows.push(["Povinné měsíční náklady", formatMoney(result.monthlyExtras), "Poplatky, pojištění a servis za jeden měsíc"]);
    if (result.initialFee > 0) rows.push(["Jednorázové poplatky", formatMoney(result.initialFee), "Náklady zaplacené mimo pravidelné splátky"]);
    if (result.residual > 0) rows.push(["Konečný doplatek", formatMoney(result.residual), `${formatPercent(result.residualPercent)} ceny ponecháno na konec`]);
    rows.push(
      ["Měsíční platba", formatMoney(result.monthlyPayment), "Splátka včetně zadaných měsíčních služeb"],
      ["Celkem zaplaceno", formatMoney(result.totalPaid), "Akontace + všechny platby + doplatek + poplatky"],
      ["Náklady nad cenu", formatMoney(result.overpayment), "Rozdíl mezi celkovou platbou a pořizovací cenou"]
    );
    $("summaryTableBody").innerHTML = rows.map(([label, amount, meaning]) => `<tr><th scope="row">${label}</th><td>${amount}</td><td>${meaning}</td></tr>`).join("");
  }

  function updateBudget(result) {
    const panel = $("budgetPanel");
    const budget = result.monthlyBudget;
    if (budget <= 0) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    const usage = result.monthlyPayment / budget * 100;
    const remainder = budget - result.monthlyPayment;
    setText("budgetUse", `${whole.format(Math.round(usage))} %`);
    $("budgetBar").style.width = `${Math.min(100, Math.max(0, usage))}%`;
    $("budgetBar").classList.toggle("is-over", usage > 100);
    setText("budgetText", remainder >= 0
      ? `Po platbě zbývá v zadaném limitu ${formatMoney(remainder)}.`
      : `Platba překračuje zadaný měsíční limit o ${formatMoney(Math.abs(remainder))}.`);
  }

  function updateDecision(result) {
    const panel = $("decisionPanel");
    panel.classList.remove("is-warning", "is-danger", "is-positive");
    let title = "Struktura plateb je čitelná";
    let copy = "Porovnejte stejnou akontaci, délku a doplatek také u druhé nabídky. Teprve potom rozhoduje rozdíl v ceně.";
    if (result.monthlyBudget > 0 && result.monthlyPayment > result.monthlyBudget) {
      title = "Měsíční limit nestačí";
      copy = `Pravidelná platba je o ${formatMoney(result.monthlyPayment - result.monthlyBudget)} nad zadaným limitem. Upravte cenu, akontaci, délku nebo povinné služby.`;
      panel.classList.add("is-danger");
    } else if (result.residualPercent >= 20) {
      title = "Nízkou splátku drží velký doplatek";
      copy = `Na konec se přesouvá ${formatMoney(result.residual)}. Vedle splátky by čisté odkládání vyžadovalo přibližně ${formatMoney(result.residual / result.months)} měsíčně.`;
      panel.classList.add("is-warning");
    } else if (result.downPercent >= 40) {
      title = "Splátku snižuje vysoká platba předem";
      copy = `Akontace spotřebuje ${formatMoney(result.down)}. Ověřte, zda po zaplacení zůstane bezpečná hotovostní rezerva.`;
      panel.classList.add("is-warning");
    } else if (result.overpayment <= result.price * 0.2) {
      panel.classList.add("is-positive");
    }
    panel.innerHTML = `<strong>${title}</strong><p>${copy}</p>`;

    setText("detailHeadline", title);
    setText("detailText", copy);
  }

  function updateResidual(result) {
    if (result.residual <= 0) {
      setText("residualReserveHeadline", "Doplatek si převeďte na měsíční rezervu");
      setText("residualReserveText", "Při nulové zůstatkové hodnotě není zvláštní rezerva na konečný odkup v modelu potřeba.");
      return;
    }
    const reserve = result.residual / result.months;
    setText("residualReserveHeadline", `Na doplatek odkládejte orientačně ${formatMoney(reserve)} měsíčně`);
    setText("residualReserveText", `Konečný doplatek ${formatMoney(result.residual)} nezmizí v nízké splátce. Prosté rozložení do ${result.months} měsíců odpovídá uvedené rezervě bez započtení výnosu nebo inflace.`);
  }

  function updateCompare(primary) {
    const enabled = $("compareEnabled").checked;
    $("compareFields").hidden = !enabled;
    $("compareResult").hidden = !enabled;
    if (!enabled) return;

    const scenario = {
      price: primary.price,
      downPercent: value("compareDown"),
      months: value("compareMonths"),
      annualRate: value("compareRate"),
      residualPercent: value("compareResidual"),
      initialFee: value("compareInitialFee"),
      monthlyExtras: value("compareMonthlyExtras")
    };
    if (!validate(scenario, true)) {
      setText("compareWinner", "Upravte zadání nabídky B");
      setText("compareDifference", "Součet akontace a konečné hodnoty musí být nižší než 100 %.");
      return;
    }
    const alternative = calculateScenario(scenario);
    const difference = Math.abs(primary.totalPaid - alternative.totalPaid);
    const primaryWins = primary.totalPaid <= alternative.totalPaid;
    setText("compareWinner", difference < 1 ? "Obě nabídky mají stejný úplný součet" : `Nabídka ${primaryWins ? "A" : "B"} je celkově levnější`);
    setText("compareATotal", formatMoney(primary.totalPaid));
    setText("compareBTotal", formatMoney(alternative.totalPaid));
    setText("compareDifference", difference < 1 ? "Rozdíl úplných nákladů je nulový." : `Rozdíl úplných nákladů: ${formatMoney(difference)}. Nabídka B má platbu ${formatMoney(alternative.monthlyPayment)} měsíčně.`);
  }

  function render(result) {
    lastValid = result;
    const extras = result.monthlyExtras;
    const totalKm = result.annualKm > 0 ? result.annualKm * result.months / 12 : 0;
    const costPerKm = totalKm > 0 ? result.totalPaid / totalKm : 0;
    const pro = $("proSettings").open || result.residualPercent > 0 || result.initialFee > 0 || result.monthlyExtras > 0 || $("compareEnabled").checked;

    setText("modeBadge", pro ? "PRO režim" : "Základní režim");
    setText("monthlyPaymentResult", formatMoney(result.monthlyPayment));
    setText("resultStatus", "Výpočet připraven");
    setText("resultFormulaNote", extras > 0 ? `z toho ${formatMoney(extras)} tvoří měsíční služby` : "splátka bez dalších měsíčních služeb");
    setText("downPaymentResult", formatMoney(result.down));
    setText("installmentsTotalResult", formatMoney(result.installmentsTotal));
    setText("residualValueResult", formatMoney(result.residual));
    setText("totalPaidResult", formatMoney(result.totalPaid));
    setText("overpaymentResult", formatMoney(result.overpayment));
    setText("financedAmountResult", formatMoney(result.financed));
    setText("effectiveMonthlyResult", formatMoney(result.effectiveMonthly));

    setText("heroFinanced", formatMoney(result.financed));
    setText("heroPayment", formatMoney(result.monthlyPayment));
    setText("heroPaymentMeta", `${result.months} měsíců · ${number.format(result.annualRate)} % p. a.`);
    setText("heroDown", formatMoney(result.down));
    setText("heroResidual", formatMoney(result.residual));
    setText("heroTotal", formatMoney(result.totalPaid));

    setText("checkDownShare", formatPercent(result.downPercent));
    setText("checkResidualShare", formatPercent(result.residualPercent));
    setText("checkExtraCosts", formatMoney(result.extraCosts));
    setText("checkCostKm", totalKm > 0 ? `${number.format(costPerKm)} Kč` : "nezadáno");

    updateBudget(result);
    updateDecision(result);
    updateResidual(result);
    updateCompare(result);
    buildRows(result);
  }

  function update() {
    const source = readPrimary();
    if (!validate(source, false)) {
      setText("resultStatus", "Upravte neplatné zadání");
      setText("resultFormulaNote", "Akontace a konečný doplatek musí dohromady zůstat pod 100 % ceny.");
      $("decisionPanel").className = "lease-result__decision is-danger";
      $("decisionPanel").innerHTML = "<strong>Výpočet nelze bezpečně sestavit</strong><p>Zkontrolujte zvýrazněná pole. Poslední platný výsledek zůstává zobrazený.</p>";
      if (lastValid) updateCompare(lastValid);
      return false;
    }
    render(calculateScenario(source));
    return true;
  }

  function setValues(values) {
    Object.entries(values).forEach(([id, val]) => {
      if (fields[id]) fields[id].value = val;
    });
  }

  form.addEventListener("input", (event) => {
    if (event.target.matches("input, select")) update();
  });
  form.addEventListener("change", update);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (update() && window.matchMedia("(max-width: 920px)").matches) {
      $("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-preset]").forEach((item) => item.classList.toggle("is-active", item === button));
      setValues({ ...presets[button.dataset.preset], residualPercent: 0, processingFee: 0, monthlyFee: 0, monthlyInsurance: 0, monthlyService: 0 });
      update();
    });
  });

  $("proSettings").addEventListener("toggle", update);
  $("compareEnabled").addEventListener("change", update);
  $("resetBtn").addEventListener("click", () => {
    setValues(defaults);
    $("compareEnabled").checked = false;
    $("proSettings").open = false;
    document.querySelectorAll("[data-preset]").forEach((item) => item.classList.toggle("is-active", item.dataset.preset === "standard"));
    fields.assetPrice.focus({ preventScroll: true });
    update();
  });

  $("copyResult").addEventListener("click", async () => {
    if (!lastValid) return;
    const text = [
      "Leasing – orientační výsledek",
      `Cena: ${formatMoney(lastValid.price)}`,
      `Akontace: ${formatMoney(lastValid.down)}`,
      `Měsíční platba: ${formatMoney(lastValid.monthlyPayment)}`,
      `Konečný doplatek: ${formatMoney(lastValid.residual)}`,
      `Celkem zaplaceno: ${formatMoney(lastValid.totalPaid)}`,
      `Náklady nad cenu: ${formatMoney(lastValid.overpayment)}`,
      "RychléVýpočty.cz – výsledek je orientační"
    ].join("\n");
    const button = $("copyResult");
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = "Výsledek zkopírován";
    } catch (_) {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      button.textContent = "Výsledek zkopírován";
    }
    window.setTimeout(() => { button.textContent = "Kopírovat výsledek"; }, 1800);
  });

  update();
})();
