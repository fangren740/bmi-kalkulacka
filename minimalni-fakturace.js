(() => {
  const ids = [
    "targetNetIncome",
    "monthlyCosts",
    "estimatedLevies",
    "reserveRate",
    "nonBillableRate",
    "monthsWithLowerIncome",
    "billableHours",
    "currentBilling"
  ];
  const $ = (id) => document.getElementById(id);
  const form = $("billingForm");
  const resetBtn = $("resetBtn");
  const moneyFormatter = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0
  });
  const numberFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const money = (value) => moneyFormatter.format(Number.isFinite(value) ? value : 0);
  const pct = (value) => `${numberFormatter.format(Number.isFinite(value) ? value : 0)} %`;
  const rate = (value) => `${money(value)}/h`;

  if (!form) return;

  function values() {
    return Object.fromEntries(ids.map((id) => [id, Number($(id)?.value) || 0]));
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function ensureNextActions() {
    const list = $("nextStepList");
    if (!list || document.querySelector(".rv-business-next-actions")) return;
    list.insertAdjacentHTML(
      "afterend",
      `<div class="rv-business-next-actions" aria-label="Co spočítat dál">
        <strong>Co spočítat dál</strong>
        <a href="kalkulacka-hodinove-sazby-freelancera.html">Přepočítat na hodinovou sazbu</a>
        <a href="kalkulacka-marze-a-prirazky.html">Ověřit marži a přirážku</a>
        <a href="minimalni-prodejni-cena-kalkulacka.html">Spočítat minimální cenu služby</a>
      </div>`
    );
  }

  function calculate(v) {
    const workingMonthsRatio = 12 / Math.max(1, 12 - v.monthsWithLowerIncome);
    const billableTimeRatio = 1 / Math.max(0.1, 1 - v.nonBillableRate / 100);
    const base = v.targetNetIncome + v.monthlyCosts;
    const seasonalBase = base * workingMonthsRatio;
    const seasonExtra = seasonalBase - base;
    const reserve = seasonalBase * (v.reserveRate / 100);
    const subtotal = seasonalBase + reserve;
    const beforeTime = subtotal / Math.max(0.1, 1 - v.estimatedLevies / 100);
    const requiredBilling = beforeTime * billableTimeRatio;
    const levies = requiredBilling * (v.estimatedLevies / 100);
    const yearly = requiredBilling * 12;
    const coverage = requiredBilling - v.targetNetIncome;
    const hourly = requiredBilling / Math.max(1, v.billableHours);
    const daily = requiredBilling / 20;
    const billableShare = 100 - v.nonBillableRate;
    const gap = v.currentBilling > 0 ? v.currentBilling - requiredBilling : 0;
    const nonBillable = Math.max(
      0,
      requiredBilling - (v.targetNetIncome + v.monthlyCosts + reserve + levies) - seasonExtra
    );
    return {
      ...v,
      workingMonthsRatio,
      billableTimeRatio,
      base,
      seasonExtra,
      reserve,
      subtotal,
      requiredBilling,
      levies,
      yearly,
      coverage,
      hourly,
      daily,
      billableShare,
      gap,
      nonBillable
    };
  }

  function interpretation(result) {
    if (result.currentBilling > 0 && result.gap < 0) {
      return {
        badge: "Současná fakturace je pod minimem",
        title: "Fakturace nepokrývá zadaný model",
        text: `Chybí přibližně ${money(Math.abs(result.gap))} měsíčně. To může znamenat příliš nízkou cenu, málo fakturovatelných hodin, vysoké náklady nebo příliš mnoho neplaceného času.`,
        steps: [
          "Zkontrolujte, zda jsou v nákladech všechny pravidelné položky.",
          "Přepočítejte výsledek na hodinovou sazbu.",
          "Upravte cenu, balíčky nebo podíl neplacené práce."
        ]
      };
    }
    if (result.requiredBilling > 130000) {
      return {
        badge: "Vyšší potřebná fakturace",
        title: "Model vyžaduje silnou cenotvorbu",
        text: `Potřebná fakturace ${money(result.requiredBilling)} měsíčně už vyžaduje buď vyšší specializaci, větší kapacitu, nebo dobře zabalené služby s jasnou hodnotou pro klienta.`,
        steps: [
          "Ověřte, jestli trh unese potřebnou hodinovou sazbu.",
          "Zvažte produktizované balíčky místo čisté hodinovky.",
          "Sledujte, kolik času skutečně fakturujete."
        ]
      };
    }
    if (result.nonBillableRate >= 35) {
      return {
        badge: "Neplacený čas výrazně zvedá minimum",
        title: "Největší páka je fakturovatelný čas",
        text: `Při ${pct(result.nonBillableRate)} neplaceného času musí zbylé hodiny nést větší část podnikání. I malá úspora administrativy může snížit tlak na cenu.`,
        steps: [
          "Zkraťte administrativu nebo ji zahrňte do ceny.",
          "Rozlišujte přípravu, komunikaci a placené výstupy.",
          "U dlouhých zakázek nastavte jasný rozsah spolupráce."
        ]
      };
    }
    return {
      badge: "Běžná podnikatelská fakturace",
      title: "Výsledek působí jako použitelná spodní hranice",
      text: `Potřebujete přibližně ${money(result.requiredBilling)} měsíčně, aby zbyl cílový čistý příjem, náklady, odvody, rezerva a prostor na neplacený čas.`,
      steps: [
        "Porovnejte výsledek se skutečnou fakturací za poslední měsíce.",
        "Přepočítejte měsíční minimum na hodinovou sazbu.",
        "Neberte minimum jako cílovou cenu, ale jako dolní hranici."
      ]
    };
  }

  function updateHero(result) {
    const number = document.querySelector(".hero-visual .reno-number");
    if (number) number.textContent = money(result.requiredBilling);
    const sub = document.querySelector(".hero-visual .reno-sub");
    if (sub) {
      sub.textContent = `Měsíční minimum odpovídá zhruba ${rate(result.hourly)} při ${numberFormatter.format(result.billableHours)} fakturovatelných hodinách.`;
    }
    document.querySelectorAll(".hero-visual .reno-metrics b").forEach((element, index) => {
      const valuesForHero = [money(result.targetNetIncome), money(result.monthlyCosts), pct(result.billableShare)];
      element.textContent = valuesForHero[index] || element.textContent;
    });
  }

  function render() {
    const result = calculate(values());
    const read = interpretation(result);
    setText("requiredBilling", money(result.requiredBilling));
    setText("requiredYearlyBilling", money(result.yearly));
    setText("requiredHourlyRate", rate(result.hourly));
    setText("coverageAmount", money(result.coverage));
    setText("billingBadge", read.badge);
    const insight = $("insightBox");
    if (insight) {
      insight.innerHTML = `<strong>${read.title}</strong><p>${read.text}</p>`;
    }
    const next = $("nextStepList");
    if (next) {
      next.innerHTML = read.steps.map((step) => `<li>${step}</li>`).join("");
    }
    setText("summaryNet", money(result.targetNetIncome));
    setText("summaryCosts", money(result.monthlyCosts));
    setText("summaryLevies", money(result.levies));
    setText("summaryReserve", money(result.reserve));
    setText("summarySeasonality", money(result.seasonExtra));
    setText("summaryBillableShare", pct(result.billableShare));
    setText("billingGap", result.currentBilling > 0 ? money(result.gap) : "—");
    setText(
      "billingGapText",
      result.currentBilling > 0
        ? result.gap >= 0
          ? `Současná fakturace je nad orientačním minimem o ${money(result.gap)}.`
          : `Současná fakturace je pod orientačním minimem o ${money(Math.abs(result.gap))}.`
        : "Když zadáte současnou fakturaci, uvidíte rezervu nebo deficit."
    );
    setText("requiredDailyTarget", money(result.daily));
    const body = $("breakdownBody");
    if (body) {
      body.innerHTML = [
        ["Cílový čistý příjem", result.targetNetIncome, "osobní příjem"],
        ["Náklady podnikání", result.monthlyCosts, "provoz"],
        ["Slabší měsíce", result.seasonExtra, "sezonnost"],
        ["Rezerva", result.reserve, "bezpečnost"],
        ["Odvody a daň", result.levies, "povinnosti"],
        ["Neplacený čas", result.nonBillable, "kapacita"]
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
