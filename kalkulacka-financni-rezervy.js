(() => {
  "use strict";

  const form = document.querySelector("#reserveForm");
  if (!form) return;

  const el = (id) => document.getElementById(id);
  const money = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  });
  const number = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const czk = (value) => money.format(Math.round(value));
  const months = (value) => `${number.format(value)} měs.`;
  const pct = (value) => `${number.format(value)} %`;
  const set = (id, value) => {
    const node = el(id);
    if (node) node.textContent = value;
  };

  const defaults = {
    expenses: 60000,
    savings: 260000,
    targetMonths: 6,
    shock: 30000,
    monthlySaving: 8000,
  };

  const inputs = {
    expenses: el("reserveExpenses"),
    savings: el("reserveSavings"),
    targetMonths: el("reserveTargetMonths"),
    shock: el("reserveShock"),
    monthlySaving: el("reserveMonthlySaving"),
  };

  const profiles = {
    starter: { expenses: 42000, savings: 95000, targetMonths: 3, shock: 20000, monthlySaving: 5000 },
    family: { expenses: 60000, savings: 260000, targetMonths: 6, shock: 30000, monthlySaving: 8000 },
    mortgage: { expenses: 78000, savings: 340000, targetMonths: 9, shock: 50000, monthlySaving: 12000 },
    osvc: { expenses: 52000, savings: 210000, targetMonths: 9, shock: 40000, monthlySaving: 15000 },
  };

  const read = () =>
    Object.fromEntries(
      Object.entries(inputs).map(([key, input]) => [
        key,
        Number(String(input.value).replace(",", ".")),
      ])
    );

  function validate(data) {
    if (!Number.isFinite(data.expenses) || data.expenses <= 0 || data.expenses > 100000000) {
      return "Měsíční nutné výdaje musí být vyšší než 0 Kč.";
    }
    if (!Number.isFinite(data.savings) || data.savings < 0 || data.savings > 1000000000) {
      return "Aktuální rezerva nesmí být záporná.";
    }
    if (!Number.isInteger(data.targetMonths) || data.targetMonths < 1 || data.targetMonths > 24) {
      return "Cíl rezervy zadejte jako celé číslo od 1 do 24 měsíců.";
    }
    if (!Number.isFinite(data.shock) || data.shock < 0 || data.shock > 100000000) {
      return "Jednorázová rezerva na výkyv nesmí být záporná.";
    }
    if (!Number.isFinite(data.monthlySaving) || data.monthlySaving < 0 || data.monthlySaving > 100000000) {
      return "Měsíční odklad nesmí být záporný.";
    }
    return "";
  }

  function classify(coverage, targetMonths, gap) {
    if (coverage < 1) {
      return {
        badge: "Kriticky nízká",
        title: "Rezerva nepokrývá ani jeden měsíc nutných výdajů",
        text:
          "Nejdřív vytvořte základní hotovostní polštář. I menší pravidelný odklad je teď důležitější než hledání ideální cílové částky.",
      };
    }
    if (coverage < 3) {
      return {
        badge: "Nízká rezerva",
        title: "Rezerva dává čas, ale větší výpadek by byl problém",
        text:
          "Prioritou je dostat se alespoň na tři měsíce nutných výdajů a současně hlídat, aby běžný rozpočet nevytvářel nový schodek.",
      };
    }
    if (gap > 0) {
      return {
        badge: "Rozumný základ",
        title: `Aktuálně pokrýváte ${months(coverage)}, cílem je ${targetMonths} měsíců`,
        text:
          "Základ už existuje. Teď dává smysl rezervu pravidelně dorovnávat a oddělit ji od peněz na plánované cíle.",
      };
    }
    if (coverage < 12) {
      return {
        badge: "Cíl splněn",
        title: "Zvolený cíl finanční rezervy je pokrytý",
        text:
          "Rezervu dál pravidelně aktualizujte podle skutečných výdajů. Přebytečné peníze už mohou směřovat na další finanční cíle.",
      };
    }
    return {
      badge: "Velmi vysoká",
      title: "Rezerva je výrazně nad běžným cílem",
      text:
        "To je silná bezpečnostní pozice. Zvažte, jakou část ponechat likvidně a co už má pracovat pro dlouhodobější cíle.",
    };
  }

  function scenarioRow(label, monthsCount, expenses, shock, savings) {
    const target = expenses * monthsCount + shock;
    const gap = Math.max(0, target - savings);
    const status = gap === 0 ? "splněno" : `chybí ${czk(gap)}`;
    return `<tr><td>${label}</td><td>${monthsCount} měs.</td><td>${czk(target)}</td><td>${status}</td></tr>`;
  }

  function stressRow(label, expenseMultiplier, monthsCount, shock, savings) {
    const expenses = Number(inputs.expenses.value) * expenseMultiplier;
    const target = expenses * monthsCount + shock;
    const coverage = expenses > 0 ? savings / expenses : 0;
    return `<tr><td>${label}</td><td>${czk(expenses)}</td><td>${czk(target)}</td><td>${months(coverage)}</td></tr>`;
  }

  function render() {
    const data = read();
    const error = validate(data);

    if (error) {
      el("reserveError").hidden = false;
      set("reserveError", error);
      [
        "coverageResult",
        "targetReserveResult",
        "gapReserveResult",
        "timeToTargetResult",
        "minimumReserveResult",
        "comfortReserveResult",
      ].forEach((id) => set(id, "—"));
      return;
    }

    el("reserveError").hidden = true;

    const coverage = data.savings / data.expenses;
    const target = data.expenses * data.targetMonths + data.shock;
    const gap = Math.max(0, target - data.savings);
    const minimum = data.expenses * 3 + data.shock;
    const comfortMonths = Math.max(9, data.targetMonths + 3);
    const comfort = data.expenses * comfortMonths + data.shock;
    const monthsToTarget =
      gap === 0 ? 0 : data.monthlySaving > 0 ? Math.ceil(gap / data.monthlySaving) : Infinity;
    const targetCoverage = target > 0 ? Math.min(100, (data.savings / target) * 100) : 0;
    const classification = classify(coverage, data.targetMonths, gap);

    set("coverageResult", months(coverage));
    set("targetReserveResult", czk(target));
    set("gapReserveResult", czk(gap));
    set(
      "timeToTargetResult",
      gap === 0 ? "splněno" : Number.isFinite(monthsToTarget) ? `${monthsToTarget} měsíců` : "není nastaveno"
    );
    set("minimumReserveResult", czk(minimum));
    set("comfortReserveResult", czk(comfort));
    set("heroCoverage", months(coverage));
    set("heroTarget", czk(target));
    set("heroGap", gap === 0 ? "0 Kč" : czk(gap));
    set("statusBadge", classification.badge);
    set("interpretationTitle", classification.title);
    set("interpretationText", classification.text);
    set(
      "nextStepText",
      gap === 0
        ? "Zvolená rezerva je pokrytá. Dalším krokem je držet ji odděleně, jednou ročně přepočítat výdaje a přebytky plánovat mimo krizový polštář."
        : data.monthlySaving > 0
          ? `Při měsíčním odkladu ${czk(data.monthlySaving)} bude do cíle zbývat přibližně ${monthsToTarget} měsíců.`
          : "Bez měsíčního odkladu se mezera sama nezmenší. Nastavte realistickou částku, která neohrozí běžný rozpočet."
    );
    set(
      "answerSentence",
      `Aktuální rezerva ${czk(data.savings)} pokryje ${months(coverage)} nutných výdajů. Cíl ${data.targetMonths} měsíců plus jednorázový šok ${czk(data.shock)} odpovídá částce ${czk(target)}.`
    );
    set("targetShare", pct(targetCoverage));
    el("targetFill").style.width = `${targetCoverage}%`;

    el("reserveScenarioBody").innerHTML = [
      scenarioRow("Minimum", 3, data.expenses, data.shock, data.savings),
      scenarioRow("Praktický cíl", 6, data.expenses, data.shock, data.savings),
      scenarioRow("Vyšší jistota", 9, data.expenses, data.shock, data.savings),
      scenarioRow("Velmi konzervativně", 12, data.expenses, data.shock, data.savings),
    ].join("");

    el("reserveStressBody").innerHTML = [
      stressRow("Výdaje o 10 % nižší", 0.9, data.targetMonths, data.shock, data.savings),
      stressRow("Zadané výdaje", 1, data.targetMonths, data.shock, data.savings),
      stressRow("Výdaje o 10 % vyšší", 1.1, data.targetMonths, data.shock, data.savings),
    ].join("");

    el("vysledek").dataset.status = classification.badge;
  }

  form.addEventListener("input", render);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    el("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  el("resetReserve").addEventListener("click", () => {
    Object.entries(defaults).forEach(([key, value]) => {
      inputs[key].value = value;
    });
    document.querySelectorAll("[data-profile]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.profile === "family" ? "true" : "false");
    });
    render();
  });

  document.querySelectorAll("[data-profile]").forEach((button) => {
    button.addEventListener("click", () => {
      const profile = profiles[button.dataset.profile];
      Object.entries(profile).forEach(([key, value]) => {
        inputs[key].value = value;
      });
      document.querySelectorAll("[data-profile]").forEach((item) => {
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      render();
    });
  });

  render();
})();
