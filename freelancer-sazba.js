(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const form = $("rateForm");
  if (!form) return;

  const fieldIds = [
    "targetIncome",
    "businessCosts",
    "billableHours",
    "monthsOff",
    "obligationReserve",
    "safetyReserve",
    "pricingBuffer",
    "hoursPerDay",
    "currentRate"
  ];
  const BASIC_DEFAULTS = Object.freeze({
    monthsOff: 2,
    obligationReserve: 30,
    safetyReserve: 10,
    pricingBuffer: 10,
    hoursPerDay: 6,
    currentRate: 0
  });
  let mode = "basic";

  const moneyFormat = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0
  });
  const numberFormat = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const money = (value) => moneyFormat.format(Number.isFinite(value) ? value : 0);
  const hourly = (value) => `${money(value)}/h`;
  const number = (value) => numberFormat.format(Number.isFinite(value) ? value : 0);

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function readValues() {
    const values = Object.fromEntries(fieldIds.map((id) => [id, Number($(id).value)]));
    if (mode === "basic") Object.assign(values, BASIC_DEFAULTS);
    return values;
  }

  function validate(v) {
    if (!Number.isFinite(v.targetIncome) || v.targetIncome < 0) return "Osobní měsíční cíl nemůže být záporný.";
    if (!Number.isFinite(v.businessCosts) || v.businessCosts < 0) return "Náklady podnikání nemohou být záporné.";
    if (v.targetIncome + v.businessCosts <= 0) return "Zadejte osobní cíl nebo náklady vyšší než nula.";
    if (!Number.isFinite(v.billableHours) || v.billableHours < 1 || v.billableHours > 300) return "Fakturovatelné hodiny musí být v rozmezí 1 až 300 za měsíc.";
    if (mode === "advanced") {
      if (!Number.isFinite(v.monthsOff) || v.monthsOff < 0 || v.monthsOff > 11) return "Počet měsíců bez plné fakturace musí být od 0 do 11.";
      if (!Number.isFinite(v.obligationReserve) || v.obligationReserve < 0 || v.obligationReserve >= 90) return "Rezerva na povinné platby musí být od 0 do méně než 90 %.";
      if (!Number.isFinite(v.safetyReserve) || v.safetyReserve < 0 || v.safetyReserve > 100) return "Provozní rezerva musí být v rozmezí 0 až 100 %.";
      if (!Number.isFinite(v.pricingBuffer) || v.pricingBuffer < 0 || v.pricingBuffer > 100) return "Cenový prostor musí být v rozmezí 0 až 100 %.";
      if (!Number.isFinite(v.hoursPerDay) || v.hoursPerDay < 1 || v.hoursPerDay > 24) return "Počet fakturovatelných hodin za den musí být v rozmezí 1 až 24.";
      if (!Number.isFinite(v.currentRate) || v.currentRate < 0) return "Současná sazba nemůže být záporná.";
    }
    return "";
  }

  function calculate(v, hoursOverride) {
    const hours = hoursOverride ?? v.billableHours;
    const activeMonths = 12 - v.monthsOff;
    const annualBase = (v.targetIncome + v.businessCosts) * 12;
    const safetyAmount = annualBase * v.safetyReserve / 100;
    const needBeforeObligations = annualBase + safetyAmount;
    const annualBilling = needBeforeObligations / (1 - v.obligationReserve / 100);
    const obligationAmount = annualBilling - needBeforeObligations;
    const monthlyBilling = annualBilling / activeMonths;
    const minimumRate = monthlyBilling / hours;
    const recommendedRate = minimumRate * (1 + v.pricingBuffer / 100);
    const bufferAmount = recommendedRate * hours * activeMonths - annualBilling;
    const recommendedAnnualBilling = annualBilling + bufferAmount;
    const dayRate = recommendedRate * v.hoursPerDay;
    const annualBillableHours = hours * activeMonths;

    return {
      ...v,
      hours,
      activeMonths,
      annualBase,
      safetyAmount,
      needBeforeObligations,
      obligationAmount,
      annualBilling,
      monthlyBilling,
      minimumRate,
      recommendedRate,
      bufferAmount,
      recommendedAnnualBilling,
      dayRate,
      annualBillableHours
    };
  }

  function interpretation(result) {
    if (result.hours < 50) {
      return {
        badge: "Nízká placená kapacita",
        title: "Sazbu zvyšuje malý počet prodaných hodin",
        text: `Roční cíl se rozpočítává jen do ${number(result.annualBillableHours)} fakturovatelných hodin. To může odpovídat expertní nebo projektové práci, ale ověřte, zda odhad nezapomíná pravidelně účtovaný servis či dlouhodobé zakázky.`,
        next: "Porovnejte scénáře níže a zjistěte, zda lze část administrativy omezit, automatizovat nebo zahrnout do placeného rozsahu."
      };
    }
    if (result.hours > 130) {
      return {
        badge: "Vysoká placená kapacita",
        title: "Výsledek stojí na velmi vysokém vytížení",
        text: `${number(result.hours)} fakturovatelných hodin za aktivní měsíc nechává omezený prostor pro obchod, administrativu, vzdělávání a nečekané opravy. Pokud takové vytížení není dlouhodobě doložené, sazba může být podhodnocená.`,
        next: "Přepočítejte konzervativnější scénář a používejte nižší kapacitu jako bezpečnou hranici pro nové nabídky."
      };
    }
    if (result.monthsOff < 1) {
      return {
        badge: "Těsný roční plán",
        title: "Model téměř nepočítá s volnem ani výpadkem",
        text: `Roční cíl rozdělujete mezi ${number(result.activeMonths)} aktivních měsíců. Matematicky je to možné, ale dlouhodobý plán bez prostoru na dovolenou, nemoc nebo slabší poptávku je citlivý na každý výpadek.`,
        next: "Zvažte alespoň jeden měsíc rezervované kapacity bez plné fakturace a porovnejte dopad na sazbu."
      };
    }
    return {
      badge: "Vyvážený pracovní model",
      title: "Sazba vychází z celého roku, ne jen z placené hodiny",
      text: `Do ${number(result.activeMonths)} aktivních měsíců se rozpočítá osobní cíl, provoz, zvolené rezervy i období bez plné fakturace. Doporučená sazba přidává ${number(result.pricingBuffer)}% cenový prostor nad udržitelné minimum.`,
      next: "Použijte minimum jako interní kontrolu a konečnou nabídku upravte podle rozsahu, rizika, termínu a hodnoty pro klienta."
    };
  }

  function renderComparison(result) {
    if (mode === "basic") {
      setText("currentRateText", "Přepněte na přesný model a doplňte svou současnou sazbu pro přímé porovnání.");
      $("currentComparison").dataset.state = "neutral";
      return;
    }
    if (!result.currentRate) {
      setText("currentRateText", "Doplňte současnou sazbu v přesném modelu pro porovnání.");
      $("currentComparison").dataset.state = "neutral";
      return;
    }

    const difference = result.currentRate - result.minimumRate;
    const monthlyDifference = difference * result.hours;
    if (result.currentRate < result.minimumRate) {
      setText("currentRateText", `${hourly(result.currentRate)} je o ${money(Math.abs(difference))} za hodinu pod udržitelným minimem. Při zadané kapacitě chybí přibližně ${money(Math.abs(monthlyDifference))} za aktivní měsíc.`);
      $("currentComparison").dataset.state = "warning";
    } else if (result.currentRate < result.recommendedRate) {
      setText("currentRateText", `${hourly(result.currentRate)} pokrývá vypočtené minimum, ale je pod doporučenou sazbou. Prostor nad minimem je ${money(difference)} za hodinu.`);
      $("currentComparison").dataset.state = "middle";
    } else {
      setText("currentRateText", `${hourly(result.currentRate)} je alespoň na doporučené úrovni. Rozdíl proti udržitelnému minimu činí ${money(difference)} za hodinu.`);
      $("currentComparison").dataset.state = "good";
    }
  }

  function renderBreakdown(result) {
    const rows = [
      ["Osobní cíl na rok", result.targetIncome * 12],
      ["Náklady podnikání na rok", result.businessCosts * 12],
      ["Provozní rezerva", result.safetyAmount],
      ["Rezerva na povinné platby", result.obligationAmount],
      ["Roční minimum fakturace", result.annualBilling],
      ["Cenový prostor", result.bufferAmount],
      ["Doporučená roční fakturace", result.recommendedAnnualBilling]
    ];
    $("calculationRows").replaceChildren(...rows.map(([label, value]) => {
      const row = document.createElement("div");
      const span = document.createElement("span");
      const strong = document.createElement("strong");
      span.textContent = label;
      strong.textContent = money(value);
      row.append(span, strong);
      return row;
    }));
  }

  function renderScenarios(v) {
    const body = $("scenarioBody");
    const candidates = [
      Math.max(20, Math.round(v.billableHours * .65 / 5) * 5),
      Math.max(20, Math.round(v.billableHours * .85 / 5) * 5),
      Math.round(v.billableHours),
      Math.min(300, Math.round(v.billableHours * 1.15 / 5) * 5),
      Math.min(300, Math.round(v.billableHours * 1.35 / 5) * 5)
    ];
    const unique = [...new Set(candidates)].sort((a, b) => a - b);
    body.replaceChildren(...unique.map((hours) => {
      const result = calculate(v, hours);
      const row = document.createElement("tr");
      if (hours === Math.round(v.billableHours)) row.className = "is-current";
      [
        `${number(hours)} h`,
        hourly(result.minimumRate),
        hourly(result.recommendedRate),
        money(result.dayRate),
        money(result.monthlyBilling)
      ].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });
      return row;
    }));
  }

  function clearResult() {
    ["recommendedRate", "minimumRate", "dayRate", "monthlyBilling", "annualBilling"].forEach((id) => setText(id, "—"));
    setText("resultStatus", "Zkontrolujte zadání");
  }

  function render(options = {}) {
    const values = readValues();
    const error = validate(values);
    const errorBox = $("rateError");
    if (error) {
      errorBox.hidden = false;
      errorBox.textContent = error;
      clearResult();
      return false;
    }

    errorBox.hidden = true;
    const result = calculate(values);
    const insight = interpretation(result);
    setText("recommendedRate", hourly(result.recommendedRate));
    setText("minimumRate", hourly(result.minimumRate));
    setText("dayRate", money(result.dayRate));
    setText("monthlyBilling", money(result.monthlyBilling));
    setText("annualBilling", money(result.annualBilling));
    setText("answerSentence", `Při ${number(result.hours)} placených hodinách a ${number(result.activeMonths)} aktivních měsících za rok.`);
    setText("capacityLabel", `${number(result.hours)} hodin měsíčně`);
    setText("capacityText", `Za rok plánujete ${number(result.annualBillableHours)} fakturovatelných hodin. Každá z nich musí nést část provozu, volna i rezerv.`);
    $("capacityFill").style.width = `${Math.min(100, result.hours / 160 * 100)}%`;
    setText("interpretationBadge", insight.badge);
    setText("interpretationTitle", insight.title);
    setText("interpretationText", insight.text);
    setText("nextStepText", insight.next);
    setText("resultStatus", mode === "basic" ? "Rychlý model" : "Přesný model");
    renderComparison(result);
    renderBreakdown(result);
    renderScenarios(values);

    if (options.scroll && matchMedia("(max-width: 720px)").matches) {
      $("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return true;
  }

  function setMode(nextMode) {
    mode = nextMode === "advanced" ? "advanced" : "basic";
    const advanced = $("advancedFields");
    if (advanced) advanced.hidden = mode !== "advanced";
    document.querySelectorAll("[data-rate-mode]").forEach((button) => {
      const active = button.dataset.rateMode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    setText("modeStatus", mode === "basic" ? "Rychlý model" : "Přesný model");
    setText("modeExplainer", mode === "basic"
      ? "Co právě počítáme: konzervativní rychlý model s 2 měsíci bez plné fakturace, 30% rezervou na povinné platby, 10% provozní rezervou a 10% cenovým prostorem. Pokročilé vstupy do výsledku nevstupují."
      : "Co právě počítáme: přesný model podle vašich vlastních hodnot. Zkontrolujte hlavně měsíce bez plné fakturace a skutečně prodané hodiny, protože mají na sazbu největší vliv.");
    render();
  }

  document.querySelectorAll("[data-rate-mode]").forEach((button) => {
    button.addEventListener("click", () => setMode(button.dataset.rateMode));
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render({ scroll: true });
  });
  fieldIds.forEach((id) => {
    const input = $(id);
    input.addEventListener("input", () => render());
    input.addEventListener("change", () => render());
  });
  $("resetBtn").addEventListener("click", () => {
    form.reset();
    setMode("basic");
  });
  setMode("basic");
})();
