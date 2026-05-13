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
      hoursWorked: 8,
      shiftCount: 8,
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
      hoursWorked: 8,
      shiftCount: 10,
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
      hoursWorked: 8,
      shiftCount: 2,
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
      hoursWorked: 11,
      shiftCount: 6,
      includeNight: true,
      includeWeekend: false,
      includeHoliday: false,
      nightPercent: 10,
      weekendPercent: 10,
      holidayPercent: 0,
      customPercent: 15,
      fixedRate: 20
    }
  };

  const inputIds = [
    "hourlyRate",
    "hoursWorked",
    "shiftCount",
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
      hoursWorked: numeric("hoursWorked"),
      shiftCount: Math.max(1, Math.round(numeric("shiftCount") || 1)),
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
    const percentTotal = items.reduce((sum, item) => sum + item.percent, 0);
    const percentBonus = basePay * percentTotal / 100;
    const fixedBonus = input.fixedRate * input.hoursWorked;
    const bonusPay = percentBonus + fixedBonus;
    const totalPay = basePay + bonusPay;
    const averageHourlyPay = input.hoursWorked > 0 ? totalPay / input.hoursWorked : 0;
    const monthlyBase = basePay * input.shiftCount;
    const monthlyBonus = bonusPay * input.shiftCount;
    const monthlyTotal = totalPay * input.shiftCount;
    const bonusShare = totalPay > 0 ? bonusPay / totalPay * 100 : 0;

    return {
      items,
      basePay,
      percentTotal,
      percentBonus,
      fixedBonus,
      bonusPay,
      totalPay,
      averageHourlyPay,
      monthlyBase,
      monthlyBonus,
      monthlyTotal,
      bonusShare
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
      ["Hodiny ve směně", `${nf.format(input.hoursWorked)} h`, "Počet hodin v příplatkovém režimu"],
      ["Základ za směnu", money(result.basePay, input.roundWhole), `${nf.format(input.hoursWorked)} × ${money(input.hourlyRate, input.roundWhole)}`]
    ];

    result.items.forEach((item) => {
      rows.push([item.label, money(result.basePay * item.percent / 100, input.roundWhole), `${nf.format(item.percent)} % ze základu`]);
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
    let verdict = "Výsledek je neutrální kontrolní odhad.";
    if (result.bonusShare >= 40) verdict = "Příplatky tvoří výraznou část směny, proto zkontrolujte sazby a souběh na výplatní pásce.";
    else if (result.bonusShare >= 15) verdict = "Příplatky mají viditelný dopad na odměnu, hlavně pokud se směny opakují každý měsíc.";
    else if (result.bonusPay <= 0) verdict = "Bez započteného příplatku jde jen o základní odměnu za hodiny.";

    setText("decisionText", `${verdict} Pro další krok porovnejte měsíční příplatky ${money(result.monthlyBonus, input.roundWhole)} s čistou mzdou.`);
    setText("statusBadge", result.bonusPay > 0 ? "Příplatky započteny" : "Bez příplatku");
    $("statusBadge").className = result.bonusPay > 0 ? "badge warning" : "badge success";
    setText("resultNote", `Za ${nf.format(input.hoursWorked)} hodin v režimu ${active} vychází základ ${money(result.basePay, input.roundWhole)}, příplatky ${money(result.bonusPay, input.roundWhole)} a celkem ${money(result.totalPay, input.roundWhole)} hrubého za směnu. Výsledek berte jako orientační kontrolu, protože skutečná páska může pracovat s průměrným výdělkem, náhradním volnem nebo jinou smluvní sazbou.`);
  }

  function render(input, result) {
    const activeLabel = labels(result);
    setText("totalPay", money(result.totalPay, input.roundWhole));
    setText("basePay", money(result.basePay, input.roundWhole));
    setText("bonusPay", money(result.bonusPay, input.roundWhole));
    setText("averageHourlyPay", money(result.averageHourlyPay, input.roundWhole));
    setText("monthlyTotalPay", money(result.monthlyTotal, input.roundWhole));
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
