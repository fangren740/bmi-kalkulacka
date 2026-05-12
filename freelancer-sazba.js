(() => {
  const ids = [
    "targetNetIncome",
    "monthlyCosts",
    "hoursPerMonth",
    "currentRate",
    "leviesRate",
    "nonBillableRate",
    "monthsOff",
    "reserveRate",
    "pricingBuffer"
  ];
  const $ = (id) => document.getElementById(id);
  const form = $("rateForm");
  const resetBtn = $("resetBtn");
  const formatter = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0
  });
  const numberFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const money = (value) => formatter.format(Number.isFinite(value) ? value : 0);
  const rate = (value) => `${money(value)}/h`;
  const hours = (value) => `${numberFormatter.format(Number.isFinite(value) ? value : 0)} h`;

  if (!form) return;

  function values() {
    return Object.fromEntries(ids.map((id) => [id, Number($(id)?.value) || 0]));
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function ensureNextActions() {
    const summary = document.querySelector(".result-panel .rv-output-summary");
    if (!summary || document.querySelector(".rv-business-next-actions")) return;
    summary.insertAdjacentHTML(
      "afterend",
      `<div class="rv-business-next-actions" aria-label="Co spočítat dál">
        <strong>Co spočítat dál</strong>
        <a href="kalkulacka-minimalni-fakturace-osvc.html">Ověřit minimální měsíční fakturaci</a>
        <a href="minimalni-prodejni-cena-kalkulacka.html">Spočítat minimální cenu služby</a>
        <a href="kalkulacka-marze-a-prirazky.html">Zkontrolovat marži a přirážku</a>
      </div>`
    );
  }

  function updateHero(result) {
    const number = document.querySelector(".hero-visual .reno-number");
    if (number) number.textContent = rate(result.recommendedRate);
    document.querySelectorAll(".hero-visual .reno-metrics b").forEach((element, index) => {
      const valuesForHero = [
        money(result.targetNetIncome),
        hours(result.billableHours),
        `${result.reserveRate} %`
      ];
      element.textContent = valuesForHero[index] || element.textContent;
    });
    const sub = document.querySelector(".hero-visual .reno-sub");
    if (sub) {
      sub.textContent = `Z ${hours(result.billableHours)} placeného času má sazba pokrýt příjem, náklady, odvody i rezervu.`;
    }
  }

  function calculate(v) {
    const base = v.targetNetIncome + v.monthlyCosts;
    const seasonMultiplier = 12 / Math.max(1, 12 - v.monthsOff);
    const seasonalNeed = base * seasonMultiplier;
    const seasonExtra = seasonalNeed - base;
    const reserve = seasonalNeed * (v.reserveRate / 100);
    const beforeLevies = seasonalNeed + reserve;
    const grossNeeded = beforeLevies / Math.max(0.1, 1 - v.leviesRate / 100);
    const levies = grossNeeded - beforeLevies;
    const billableHours = v.hoursPerMonth * (1 - v.nonBillableRate / 100);
    const minimumRate = grossNeeded / Math.max(1, billableHours);
    const buffer = grossNeeded * (v.pricingBuffer / 100);
    const recommendedBilling = grossNeeded + buffer;
    const recommendedRate = recommendedBilling / Math.max(1, billableHours);
    const dayRate = recommendedRate * 6;
    const currentBilling = v.currentRate > 0 ? v.currentRate * billableHours : 0;
    return {
      ...v,
      base,
      seasonExtra,
      reserve,
      levies,
      billableHours,
      minimumRate,
      buffer,
      recommendedBilling,
      recommendedRate,
      dayRate,
      currentBilling
    };
  }

  function status(result) {
    if (result.billableHours < 85) {
      return {
        label: "Nízká kapacita",
        title: "Sazbu zvedá nízký počet placených hodin",
        text: `Doporučená sazba vychází ${rate(result.recommendedRate)}, protože z měsíční práce fakturujete jen ${hours(result.billableHours)}. To může být správně u seniorní práce, ale u jednodušších služeb je potřeba hlídat tržní cenu.`,
        next: "Zkuste zvýšit fakturovatelné hodiny, omezit neplacenou administrativu nebo nabídku balíčkovat podle výsledku."
      };
    }
    if (result.recommendedRate > 1800) {
      return {
        label: "Vyšší odborná sazba",
        title: "Výsledek patří do vyšší cenové hladiny",
        text: `Doporučená sazba ${rate(result.recommendedRate)} dává smysl hlavně tam, kde klient platí za expertizu, rychlost, odpovědnost nebo měřitelný dopad.`,
        next: "Před zdražením si připravte argumenty: rozsah, hodnotu pro klienta, výstupy a jasné hranice spolupráce."
      };
    }
    if (result.recommendedRate < 850) {
      return {
        label: "Spíš nižší sazba",
        title: "Sazba vychází nízko",
        text: `Doporučená sazba ${rate(result.recommendedRate)} je nižší. Pokud jde o dlouhodobou práci, ověřte, že opravdu pokrývá odvody, rezervu, dovolenou a slabší měsíce.`,
        next: "Porovnejte výsledek s minimální fakturací OSVČ a zkontrolujte, jestli v zadání nechybí náklady."
      };
    }
    return {
      label: "Udržitelná sazba",
      title: "Sazba působí jako použitelná pracovní hranice",
      text: `Doporučená sazba ${rate(result.recommendedRate)} pokrývá cílový čistý příjem, náklady, odvody, rezervu, neplacený čas a cenový buffer.`,
      next: "Použijte ji jako interní minimum pro nabídky a u větších projektů ji přepočítejte na denní sazbu nebo balíček."
    };
  }

  function currentAssessment(result) {
    if (!result.currentRate) return "Doplňte současnou sazbu a uvidíte, jestli je pod minimem nebo nad doporučenou hodnotou.";
    if (result.currentRate < result.minimumRate) {
      return `Současná sazba ${rate(result.currentRate)} je pod vypočteným minimem. Dlouhodobě pravděpodobně nepokrývá celý model podnikání.`;
    }
    if (result.currentRate < result.recommendedRate) {
      return `Současná sazba ${rate(result.currentRate)} je nad minimem, ale pod doporučenou sazbou. Pro dlouhé zakázky hlídejte rezervu a rozsah práce.`;
    }
    return `Současná sazba ${rate(result.currentRate)} je nad doporučenou hranicí. Pokud ji trh přijímá, máte prostor na rezervu i slabší měsíce.`;
  }

  function render() {
    const result = calculate(values());
    const interpretation = status(result);
    setText("recommendedRate", rate(result.recommendedRate));
    setText("minimumRate", rate(result.minimumRate));
    setText("requiredBilling", money(result.recommendedBilling));
    setText("billableHours", hours(result.billableHours));
    setText("rateBadge", interpretation.label);
    setText("decisionTitle", interpretation.title);
    setText("decisionText", interpretation.text);
    setText("summaryNetIncome", money(result.targetNetIncome));
    setText("summaryCosts", money(result.monthlyCosts));
    setText("summaryLevies", money(result.levies));
    setText("summaryReserve", money(result.reserve));
    setText("summarySeasonality", money(result.seasonExtra));
    setText("summaryBuffer", money(result.buffer));
    setText("currentRateAssessment", currentAssessment(result));
    setText("dayRateText", `Orientační denní sazba při 6 fakturovatelných hodinách vychází ${money(result.dayRate)}.`);
    setText("nextStepText", interpretation.next);
    const body = $("breakdownBody");
    if (body) {
      body.innerHTML = [
        ["Cílový čistý příjem a náklady", result.base, "základ"],
        ["Slabší měsíce a volno", result.seasonExtra, "čas"],
        ["Rezerva", result.reserve, "bezpečnost"],
        ["Odvody a daň", result.levies, "povinnosti"],
        ["Cenový buffer", result.buffer, "vyjednávání"]
      ]
        .map((row) => `<tr><td>${row[0]}</td><td>${money(row[1])}</td><td>${row[2]}</td></tr>`)
        .join("");
    }
    updateHero(result);
  }

  ensureNextActions();
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  ids.forEach((id) => {
    const element = $(id);
    if (!element) return;
    element.addEventListener("input", render);
    element.addEventListener("change", render);
  });
  resetBtn?.addEventListener("click", () => {
    form.reset();
    render();
  });
  render();
})();
