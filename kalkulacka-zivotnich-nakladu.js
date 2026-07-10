(() => {
  "use strict";

  const form = document.querySelector("#lifeCostForm");
  if (!form) return;

  const el = (id) => document.getElementById(id);
  const money = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  });
  const number = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const czk = (value) => money.format(Math.round(value));
  const pct = (value) => `${number.format(value)} %`;
  const months = (value) => `${number.format(value)} měs.`;
  const set = (id, value) => {
    const node = el(id);
    if (node) node.textContent = value;
  };

  const fields = {
    income: el("lifeIncome"),
    adults: el("lifeAdults"),
    children: el("lifeChildren"),
    housing: el("lifeHousing"),
    utilities: el("lifeUtilities"),
    food: el("lifeFood"),
    transport: el("lifeTransport"),
    childrenCosts: el("lifeChildrenCosts"),
    insurance: el("lifeInsurance"),
    debt: el("lifeDebt"),
    other: el("lifeOther"),
    irregular: el("lifeIrregular"),
    savings: el("lifeSavings"),
  };

  const presets = {
    single: {
      income: 52000,
      adults: 1,
      children: 0,
      housing: 18000,
      utilities: 4200,
      food: 8500,
      transport: 3500,
      childrenCosts: 0,
      insurance: 1600,
      debt: 0,
      other: 4500,
      irregular: 3500,
      savings: 120000,
    },
    couple: {
      income: 82000,
      adults: 2,
      children: 0,
      housing: 24000,
      utilities: 5600,
      food: 13500,
      transport: 6500,
      childrenCosts: 0,
      insurance: 2600,
      debt: 0,
      other: 6500,
      irregular: 5200,
      savings: 210000,
    },
    family: {
      income: 98000,
      adults: 2,
      children: 1,
      housing: 26000,
      utilities: 6500,
      food: 15500,
      transport: 8000,
      childrenCosts: 5500,
      insurance: 3000,
      debt: 0,
      other: 7000,
      irregular: 6000,
      savings: 220000,
    },
    mortgage: {
      income: 118000,
      adults: 2,
      children: 2,
      housing: 36500,
      utilities: 7600,
      food: 20500,
      transport: 10500,
      childrenCosts: 9800,
      insurance: 4200,
      debt: 3500,
      other: 9500,
      irregular: 9000,
      savings: 360000,
    },
  };

  const categories = [
    ["housing", "Bydlení", "Nájem, hypotéka, fond oprav nebo dlouhodobé náklady na střechu nad hlavou."],
    ["utilities", "Energie a služby", "Elektřina, plyn, voda, teplo, internet, telefon a pravidelné služby."],
    ["food", "Jídlo a drogerie", "Potraviny, drogerie, základní potřeby a běžné nákupy pro domácnost."],
    ["transport", "Doprava a auto", "Palivo, MHD, servis, parkování, pneumatiky nebo provoz auta."],
    ["childrenCosts", "Děti a škola", "Školka, škola, kroužky, obědy, výbava a pravidelné dětské náklady."],
    ["insurance", "Pojištění a zdraví", "Pojištění, léky, zdravotní péče a pravidelné ochranné platby."],
    ["debt", "Splátky", "Půjčky, leasing, kreditní karta a jiné závazky mimo bydlení."],
    ["other", "Volný čas a ostatní", "Oblečení, kultura, dárky, domácnost, malé opravy a běžný život."],
    ["irregular", "Nepravidelné výdaje", "Roční platby, servis, dovolená, rezerva na opravy a sezónní náklady."],
  ];

  function read() {
    return Object.fromEntries(
      Object.entries(fields).map(([key, input]) => [
        key,
        Number(String(input.value).replace(",", ".")),
      ])
    );
  }

  function validate(data) {
    if (!Number.isFinite(data.income) || data.income <= 0 || data.income > 100000000) {
      return "Čistý měsíční příjem musí být vyšší než 0 Kč.";
    }
    if (!Number.isInteger(data.adults) || data.adults < 1 || data.adults > 10) {
      return "Počet dospělých musí být celé číslo od 1 do 10.";
    }
    if (!Number.isInteger(data.children) || data.children < 0 || data.children > 12) {
      return "Počet dětí musí být celé číslo od 0 do 12.";
    }
    for (const [key] of categories) {
      if (!Number.isFinite(data[key]) || data[key] < 0 || data[key] > 100000000) {
        return "Náklady nesmí být záporné ani nereálně vysoké.";
      }
    }
    if (!Number.isFinite(data.savings) || data.savings < 0 || data.savings > 1000000000) {
      return "Aktuální rezerva nesmí být záporná.";
    }
    return "";
  }

  function classify(surplus, surplusRate, runway, housingShare, debtShare) {
    if (surplus < 0) {
      return {
        badge: "Schodek",
        title: "Životní náklady převyšují čistý příjem",
        text:
          "Domácnost by při zadaných hodnotách každý měsíc spotřebovala úspory nebo vytvářela dluh. Nejdřív řešte největší fixní položky a ověřte, zda jsou vstupy realistické.",
        next:
          "Priorita je zastavit měsíční schodek. Nová splátka, dražší bydlení nebo velký nákup teď nedávají bezpečný smysl.",
      };
    }
    if (surplusRate < 8 || runway < 2) {
      return {
        badge: "Napjaté",
        title: "Rozpočet vychází, ale má malý bezpečnostní polštář",
        text:
          "Běžný měsíc je zaplatitelný, jenže prostor na výkyv je nízký. Doplatek energií, nemoc nebo oprava auta může rychle snížit rezervu.",
        next:
          "Nejdřív navyšte dostupnou rezervu a roční platby rozpočítejte do měsíčního průměru.",
      };
    }
    if (housingShare > 40 || debtShare > 15) {
      return {
        badge: "Hlídat fixní závazky",
        title: "Celkově to vychází, ale velké fixní položky snižují pružnost",
        text:
          "Příjem náklady pokrývá, ale bydlení nebo splátky zabírají významnou část rozpočtu. Při změně sazeb, nájmu nebo příjmu je potřeba rychle přepočítat plán.",
        next:
          "Otestujte horší měsíc a před novým závazkem porovnejte rozpočet i finanční rezervu.",
      };
    }
    return {
      badge: "Zdravější prostor",
      title: "Životní náklady nechávají prostor na rezervu a cíle",
      text:
        "Domácnost má po zaplacení realistických nákladů použitelný přebytek. Důležité je dál sledovat hlavní položky a oddělit krizovou rezervu od peněz na plánované cíle.",
      next:
        "Přebytek rozdělte mezi finanční rezervu, očekávané roční platby a další cíle podle priority.",
    };
  }

  function render() {
    const data = read();
    const error = validate(data);
    if (error) {
      el("lifeError").hidden = false;
      set("lifeError", error);
      [
        "totalCostResult",
        "surplusResult",
        "perPersonResult",
        "recommendedIncomeResult",
        "minimumCostResult",
        "comfortCostResult",
        "reserveRunwayResult",
      ].forEach((id) => set(id, "—"));
      return;
    }
    el("lifeError").hidden = true;

    const total = categories.reduce((sum, [key]) => sum + data[key], 0);
    const essential =
      data.housing +
      data.utilities +
      data.food * 0.85 +
      data.transport * 0.75 +
      data.childrenCosts * 0.8 +
      data.insurance +
      data.debt;
    const comfort = total * 1.15;
    const people = data.adults + data.children;
    const surplus = data.income - total;
    const surplusRate = (surplus / data.income) * 100;
    const perPerson = total / Math.max(1, people);
    const recommendedIncome = total / 0.8;
    const runway = data.savings / total;
    const housingShare = (data.housing / data.income) * 100;
    const debtShare = (data.debt / data.income) * 100;
    const status = classify(surplus, surplusRate, runway, housingShare, debtShare);
    const biggest = categories
      .map(([key, label, help]) => ({ key, label, help, value: data[key], share: (data[key] / total) * 100 }))
      .sort((a, b) => b.value - a.value);

    set("totalCostResult", czk(total));
    set("surplusResult", czk(surplus));
    set("perPersonResult", czk(perPerson));
    set("recommendedIncomeResult", czk(recommendedIncome));
    set("minimumCostResult", czk(essential));
    set("comfortCostResult", czk(comfort));
    set("reserveRunwayResult", months(runway));
    set("heroTotal", czk(total));
    set("heroSurplus", czk(surplus));
    set("heroIncomeNeed", czk(recommendedIncome));
    set("statusBadge", status.badge);
    set("answerSentence", `Zadaný životní standard stojí přibližně ${czk(total)} měsíčně. Po odečtení od příjmu zbývá ${czk(surplus)} a aktuální rezerva pokryje ${months(runway)} těchto nákladů.`);
    set("interpretationTitle", status.title);
    set("interpretationText", status.text);
    set("nextStepText", status.next);
    set("biggestCategory", `${biggest[0].label}: ${czk(biggest[0].value)} (${pct(biggest[0].share)})`);
    set("housingShare", pct(housingShare));
    set("surplusRate", pct(surplusRate));

    el("surplusResult").classList.toggle("is-negative", surplus < 0);
    el("surplusFill").style.width = `${Math.max(0, Math.min(100, surplusRate))}%`;
    document.querySelector("#vysledek").dataset.status = status.badge;

    el("categoryRows").innerHTML = biggest
      .map(
        (item) =>
          `<div><span>${item.label}</span><b>${czk(item.value)}</b><i><em style="width:${Math.max(4, Math.min(100, item.share))}%"></em></i><small>${pct(item.share)} nákladů · ${item.help}</small></div>`
      )
      .join("");

    el("scenarioBody").innerHTML = [
      ["Úsporné minimum", essential, "Použitelné pro krizový režim, ne jako dlouhodobý životní standard."],
      ["Realistický měsíc", total, "Nejlepší základ pro plánování příjmu, bydlení a splátek."],
      ["Komfortnější měsíc", comfort, "Varianta s vyšším prostorem na opravy, volný čas a výkyvy."],
      ["Příjem doporučený pro 20% rezervu", recommendedIncome, "Čistý příjem, při kterém náklady tvoří zhruba 80 % příjmu."],
    ]
      .map((row) => `<tr><td>${row[0]}</td><td>${czk(row[1])}</td><td>${row[2]}</td></tr>`)
      .join("");

    el("stressBody").innerHTML = [
      ["Výdaje +10 %", total * 1.1, data.income - total * 1.1],
      ["Příjem −10 %", total, data.income * 0.9 - total],
      ["Bydlení +15 %", total + data.housing * 0.15, data.income - total - data.housing * 0.15],
    ]
      .map((row) => `<tr><td>${row[0]}</td><td>${czk(row[1])}</td><td class="${row[2] < 0 ? "is-negative" : ""}">${czk(row[2])}</td></tr>`)
      .join("");
  }

  form.addEventListener("input", render);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    el("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  el("resetLifeCost").addEventListener("click", () => {
    Object.entries(presets.family).forEach(([key, value]) => {
      fields[key].value = value;
    });
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.preset === "family" ? "true" : "false");
    });
    render();
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      Object.entries(presets[button.dataset.preset]).forEach(([key, value]) => {
        fields[key].value = value;
      });
      document.querySelectorAll("[data-preset]").forEach((item) => {
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      render();
    });
  });

  render();
})();
