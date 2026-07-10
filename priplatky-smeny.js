(function () {
  const form = document.getElementById("shiftForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
  const money = (value, whole = true) => new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: whole ? 0 : 2,
    minimumFractionDigits: whole ? 0 : 2
  }).format(Number.isFinite(value) ? value : 0);

  const PRESETS = {
    night: {
      hourlyRate: 180,
      averageEarnings: 180,
      hoursWorked: 8,
      shiftCount: 8,
      payRegime: "wage",
      useAverageForBonus: true,
      includeNight: true,
      includeWeekend: false,
      includeHoliday: false,
      nightPercent: 10,
      weekendPercent: 10,
      holidayPercent: 0,
      customPercent: 0,
      fixedRate: 0
    },
    weekendNight: {
      hourlyRate: 180,
      averageEarnings: 180,
      hoursWorked: 8,
      shiftCount: 10,
      payRegime: "wage",
      useAverageForBonus: true,
      includeNight: true,
      includeWeekend: true,
      includeHoliday: false,
      nightPercent: 10,
      weekendPercent: 10,
      holidayPercent: 0,
      customPercent: 0,
      fixedRate: 0
    },
    holiday: {
      hourlyRate: 220,
      averageEarnings: 220,
      hoursWorked: 8,
      shiftCount: 2,
      payRegime: "wage",
      useAverageForBonus: true,
      includeNight: false,
      includeWeekend: false,
      includeHoliday: true,
      nightPercent: 10,
      weekendPercent: 10,
      holidayPercent: 100,
      customPercent: 0,
      fixedRate: 0
    },
    custom: {
      hourlyRate: 210,
      averageEarnings: 230,
      hoursWorked: 11,
      shiftCount: 6,
      payRegime: "wage",
      useAverageForBonus: true,
      includeNight: true,
      includeWeekend: false,
      includeHoliday: false,
      nightPercent: 10,
      weekendPercent: 10,
      holidayPercent: 0,
      customPercent: 15,
      fixedRate: 20
    },
    publicPay: {
      hourlyRate: 220,
      averageEarnings: 240,
      hoursWorked: 8,
      shiftCount: 6,
      payRegime: "salary",
      useAverageForBonus: true,
      includeNight: true,
      includeWeekend: true,
      includeHoliday: false,
      nightPercent: 20,
      weekendPercent: 25,
      holidayPercent: 100,
      customPercent: 0,
      fixedRate: 0
    }
  };

  const inputIds = [
    "hourlyRate",
    "averageEarnings",
    "hoursWorked",
    "shiftCount",
    "payRegime",
    "useAverageForBonus",
    "nightPercent",
    "weekendPercent",
    "holidayPercent",
    "customPercent",
    "fixedRate",
    "includeNight",
    "includeWeekend",
    "includeHoliday",
    "roundWhole"
  ];

  function numeric(id) {
    return Math.max(0, Number($(id).value) || 0);
  }

  function readInput() {
    return {
      hourlyRate: numeric("hourlyRate"),
      averageEarnings: numeric("averageEarnings"),
      hoursWorked: numeric("hoursWorked"),
      shiftCount: Math.max(1, Math.round(numeric("shiftCount") || 1)),
      payRegime: $("payRegime")?.value || "wage",
      useAverageForBonus: $("useAverageForBonus")?.checked ?? true,
      nightPercent: numeric("nightPercent"),
      weekendPercent: numeric("weekendPercent"),
      holidayPercent: numeric("holidayPercent"),
      customPercent: numeric("customPercent"),
      fixedRate: numeric("fixedRate"),
      includeNight: $("includeNight").checked,
      includeWeekend: $("includeWeekend").checked,
      includeHoliday: $("includeHoliday").checked,
      roundWhole: $("roundWhole").checked
    };
  }

  function activeItems(input) {
    const items = [];
    if (input.includeNight && input.nightPercent > 0) items.push({ key: "night", label: "Noční práce", percent: input.nightPercent });
    if (input.includeWeekend && input.weekendPercent > 0) items.push({ key: "weekend", label: "Víkend", percent: input.weekendPercent });
    if (input.includeHoliday && input.holidayPercent > 0) items.push({ key: "holiday", label: "Svátek", percent: input.holidayPercent });
    if (input.customPercent > 0) items.push({ key: "custom", label: "Další příplatek", percent: input.customPercent });
    return items;
  }

  function calculate(input) {
    const items = activeItems(input);
    const basePay = input.hourlyRate * input.hoursWorked;
    const bonusBaseRate = input.useAverageForBonus && input.averageEarnings > 0 ? input.averageEarnings : input.hourlyRate;
    const bonusBasePay = bonusBaseRate * input.hoursWorked;
    const percentTotal = items.reduce((sum, item) => sum + item.percent, 0);
    const percentBonus = bonusBasePay * percentTotal / 100;
    const fixedBonus = input.fixedRate * input.hoursWorked;
    const bonusPay = percentBonus + fixedBonus;
    const totalPay = basePay + bonusPay;
    const averageHourlyPay = input.hoursWorked > 0 ? totalPay / input.hoursWorked : 0;
    const monthlyBase = basePay * input.shiftCount;
    const monthlyBonus = bonusPay * input.shiftCount;
    const monthlyTotal = totalPay * input.shiftCount;
    const bonusShare = totalPay > 0 ? bonusPay / totalPay * 100 : 0;
    const extraHourlyPay = input.hoursWorked > 0 ? bonusPay / input.hoursWorked : 0;
    const effectiveBonusPercent = basePay > 0 ? bonusPay / basePay * 100 : 0;

    return {
      items,
      basePay,
      bonusBaseRate,
      bonusBasePay,
      percentTotal,
      percentBonus,
      fixedBonus,
      bonusPay,
      totalPay,
      averageHourlyPay,
      monthlyBase,
      monthlyBonus,
      monthlyTotal,
      bonusShare,
      extraHourlyPay,
      effectiveBonusPercent
    };
  }

  function labels(result) {
    if (result.items.length === 0 && result.fixedBonus <= 0) return "bez příplatku";
    const active = result.items.map((item) => item.label.toLowerCase());
    if (result.fixedBonus > 0) active.push("pevná částka");
    return active.join(" + ");
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function width(value, max) {
    if (!max) return "0%";
    return `${Math.max(8, Math.min(100, value / max * 100))}%`;
  }

  function renderTable(input, result) {
    const rows = [
      ["Hodinová sazba", money(input.hourlyRate, input.roundWhole), "Základ pro výpočet hrubé odměny"],
      ["Průměrný hodinový výdělek", money(result.bonusBaseRate, input.roundWhole), input.useAverageForBonus ? "Základ použitý pro procentní příplatky" : "Procentní příplatky počítáte ze stejné sazby jako základ"],
      ["Hodiny ve směně", `${nf.format(input.hoursWorked)} h`, "Počet hodin v příplatkovém režimu"],
      ["Základ za směnu", money(result.basePay, input.roundWhole), `${nf.format(input.hoursWorked)} × ${money(input.hourlyRate, input.roundWhole)}`]
    ];

    result.items.forEach((item) => {
      rows.push([item.label, money(result.bonusBasePay * item.percent / 100, input.roundWhole), `${nf.format(item.percent)} % z ${money(result.bonusBaseRate, input.roundWhole)} za hodinu`]);
    });

    if (result.fixedBonus > 0) rows.push(["Pevná částka", money(result.fixedBonus, input.roundWhole), `${money(input.fixedRate, input.roundWhole)} za hodinu`]);

    rows.push(
      ["Příplatky celkem", money(result.bonusPay, input.roundWhole), `${nf.format(result.percentTotal)} % + pevná částka`],
      ["Celkem za směnu", money(result.totalPay, input.roundWhole), "Základ plus všechny započtené příplatky"],
      ["Měsíční příplatky", money(result.monthlyBonus, input.roundWhole), `${input.shiftCount} stejných směn`],
      ["Měsíční hrubý dopad", money(result.monthlyTotal, input.roundWhole), "Součet základu a příplatků za zadané směny"]
    );

    $("breakdownBody").innerHTML = rows.map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function renderDecision(input, result) {
    const active = labels(result);
    const hasStack = result.items.length > 1 || result.fixedBonus > 0;
    let verdict = "Výsledek je neutrální kontrolní odhad.";
    let badge = "Nízký dopad příplatků";
    let badgeClass = "badge success";
    let focus = "evidence hodin";

    if (result.bonusPay <= 0) {
      verdict = "Bez započteného příplatku jde jen o základní odměnu za hodiny.";
      badge = "Bez příplatku";
      focus = "zapnuté režimy";
    } else if (result.bonusShare >= 40) {
      verdict = "Příplatky tvoří výraznou část směny. Zkontrolujte hlavně sazby, souběh a to, zda výplatní páska počítá stejný počet hodin.";
      badge = "Vysoký podíl příplatků";
      badgeClass = "badge warning";
      focus = hasStack ? "souběh příplatků" : "sazba příplatku";
    } else if (result.bonusShare >= 15) {
      verdict = "Příplatky mají viditelný dopad na odměnu, hlavně pokud se stejné směny opakují každý měsíc.";
      badge = "Příplatky mají dopad";
      badgeClass = "badge warning";
      focus = hasStack ? "souběh příplatků" : "měsíční dopad";
    }

    setText("decisionText", `${verdict} Pro další krok porovnejte měsíční příplatky ${money(result.monthlyBonus, input.roundWhole)} s čistou mzdou a s evidencí pracovní doby.`);
    setText("statusBadge", badge);
    $("statusBadge").className = badgeClass;
    setText("resultNote", `Za ${nf.format(input.hoursWorked)} hodin v režimu ${active} vychází základ ${money(result.basePay, input.roundWhole)}, příplatky ${money(result.bonusPay, input.roundWhole)} a celkem ${money(result.totalPay, input.roundWhole)} hrubého za směnu. Procentní příplatky jsou počítané ze sazby ${money(result.bonusBaseRate, input.roundWhole)} za hodinu. Výsledek berte jako orientační kontrolu, protože skutečná páska může pracovat s průměrným výdělkem, náhradním volnem nebo jinou smluvní sazbou.`);
    setText("payrollCheckFocus", focus);
  }

  function render(input, result) {
    const activeLabel = labels(result);
    setText("totalPay", money(result.totalPay, input.roundWhole));
    setText("basePay", money(result.basePay, input.roundWhole));
    setText("bonusPay", money(result.bonusPay, input.roundWhole));
    setText("averageHourlyPay", money(result.averageHourlyPay, input.roundWhole));
    setText("monthlyTotalPay", money(result.monthlyTotal, input.roundWhole));
    setText("monthlyBonusPay", money(result.monthlyBonus, input.roundWhole));
    setText("extraHourlyPay", money(result.extraHourlyPay, input.roundWhole));
    setText("effectiveBonusPercent", `${nf.format(result.effectiveBonusPercent)} %`);
    setText("summaryShiftType", activeLabel);
    setText("bonusShare", `${nf.format(result.bonusShare)} %`);

    setText("heroTotal", money(result.totalPay, input.roundWhole));
    setText("heroBase", money(result.basePay, input.roundWhole));
    setText("heroBonus", money(result.bonusPay, input.roundWhole));
    setText("heroMonth", money(result.monthlyTotal, input.roundWhole));
    setText("heroScenario", activeLabel);
    setText("heroCheck", result.items.length > 1 || result.fixedBonus > 0 ? "ověřit souběh" : "ověřit sazbu");

    const max = Math.max(result.monthlyTotal, result.totalPay, result.basePay, 1);
    $("heroBaseBar").style.width = width(result.basePay, result.totalPay || max);
    $("heroBonusBar").style.width = width(result.bonusPay, result.totalPay || max);
    $("heroMonthBar").style.width = width(result.monthlyTotal, max);

    renderDecision(input, result);
    renderTable(input, result);
  }

  function run() {
    const input = readInput();
    render(input, calculate(input));
  }

  function applyPreset(name) {
    const preset = PRESETS[name] || PRESETS.weekendNight;
    Object.entries(preset).forEach(([key, value]) => {
      const element = $(key);
      if (!element) return;
      if (element.type === "checkbox") element.checked = Boolean(value);
      else element.value = value;
    });
    run();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  inputIds.forEach((id) => {
    const element = $(id);
    if (!element) return;
    element.addEventListener("input", run);
    element.addEventListener("change", run);
  });

  document.querySelectorAll("[data-shift-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.shiftPreset));
  });

  $("resetBtn").addEventListener("click", () => applyPreset("weekendNight"));

  run();
})();
