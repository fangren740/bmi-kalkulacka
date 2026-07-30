(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const form = $("commissionForm");
  if (!form) return;

  let taskMode = "earn";
  let detailMode = "basic";

  const moneyFormatter = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const numberFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });

  const money = (value) => moneyFormatter.format(Number.isFinite(value) ? value : 0);
  const percent = (value) => `${numberFormatter.format(Number.isFinite(value) ? value : 0)} %`;
  const setText = (id, value) => {
    const element = $(id);
    if (element) element.textContent = value;
  };
  const numberValue = (id) => {
    const element = $(id);
    const value = Number(element?.value);
    return Number.isFinite(value) ? value : 0;
  };

  function readValues() {
    const advanced = detailMode === "advanced";
    return {
      base: numberValue("baseAmount"),
      target: numberValue("targetCommission"),
      rate: numberValue("commissionRate"),
      fixed: advanced ? numberValue("fixedCommission") : 0,
      settlement: advanced ? $("settlementMode").value : "deduct",
      tier: advanced && $("tierEnabled").value === "yes",
      threshold: advanced ? numberValue("tierThreshold") : 0,
      tierRate: advanced ? numberValue("tierRate") : 0,
      team: advanced ? numberValue("teamSize") : 1
    };
  }

  function validate(values) {
    if (!Number.isFinite(values.rate) || values.rate < 0 || values.rate > 100) {
      return "Sazba musí být v rozmezí 0 až 100 %.";
    }
    if (taskMode === "earn" && (!Number.isFinite(values.base) || values.base < 0)) {
      return "Obrat nebo základ provize nemůže být záporný.";
    }
    if (taskMode === "target" && (!Number.isFinite(values.target) || values.target < 0)) {
      return "Cílová provize nemůže být záporná.";
    }
    if (detailMode === "advanced") {
      if (!Number.isFinite(values.fixed) || values.fixed < 0) {
        return "Pevná složka nemůže být záporná.";
      }
      if (!Number.isInteger(values.team) || values.team < 1) {
        return "Počet lidí musí být celé číslo alespoň 1.";
      }
      if (values.tier && (
        !Number.isFinite(values.threshold) || values.threshold < 0 ||
        !Number.isFinite(values.tierRate) || values.tierRate < 0 || values.tierRate > 100
      )) {
        return "Zkontrolujte hranici a sazbu druhého pásma.";
      }
    }
    if (taskMode === "target" && values.target < values.fixed) {
      return "Cílová provize je nižší než pevná složka.";
    }
    if (taskMode === "target" && values.rate === 0 && values.target > values.fixed) {
      return "Pro výpočet cílového obratu musí být sazba vyšší než nula.";
    }
    return "";
  }

  function commissionForBase(base, values, useTier = true) {
    if (useTier && values.tier) {
      const first = Math.min(base, values.threshold) * values.rate / 100;
      const second = Math.max(0, base - values.threshold) * values.tierRate / 100;
      return { percentPart: first + second, first, second };
    }
    const percentPart = base * values.rate / 100;
    return { percentPart, first: percentPart, second: 0 };
  }

  function calculate(values) {
    if (taskMode === "target") {
      const percentTarget = Math.max(0, values.target - values.fixed);
      const base = values.rate > 0 ? percentTarget / (values.rate / 100) : 0;
      return {
        base,
        percentPart: percentTarget,
        total: values.target,
        first: percentTarget,
        second: 0
      };
    }

    const calculated = commissionForBase(values.base, values);
    return {
      base: values.base,
      percentPart: calculated.percentPart,
      total: calculated.percentPart + values.fixed,
      first: calculated.first,
      second: calculated.second
    };
  }

  function renderTier(result, values) {
    const root = $("tierBreakdown");
    if (!root) return;
    if (taskMode !== "earn" || detailMode !== "advanced" || !values.tier) {
      root.replaceChildren();
      return;
    }
    root.innerHTML = `
      <h3>Rozpad pásem</h3>
      <div><span>Do ${money(values.threshold)} při ${percent(values.rate)}</span><strong>${money(result.first)}</strong></div>
      <div><span>Nad hranici při ${percent(values.tierRate)}</span><strong>${money(result.second)}</strong></div>`;
  }

  function renderScenarios(values) {
    const body = $("scenarioBody");
    if (!body) return;
    body.replaceChildren();
    const center = taskMode === "target" ? calculate(values).base : values.base;

    [0.5, 0.75, 1, 1.25, 1.5].forEach((multiplier) => {
      const base = center * multiplier;
      const calculated = commissionForBase(base, values, taskMode === "earn");
      const total = calculated.percentPart + values.fixed;
      const effective = base > 0 ? total / base * 100 : 0;
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${money(base)}</td>
        <td>${money(calculated.percentPart)}</td>
        <td>${money(total)}</td>
        <td>${percent(effective)}</td>
        <td>${money(total / values.team)}</td>`;
      body.appendChild(row);
    });
  }

  function render(options = {}) {
    const values = readValues();
    const errorMessage = validate(values);
    const errorBox = $("commissionError");

    if (errorMessage) {
      errorBox.hidden = false;
      errorBox.textContent = errorMessage;
      ["answerValue", "percentPart", "fixedPart", "effectiveRate", "perPerson", "settlementValue"]
        .forEach((id) => setText(id, "—"));
      setText("statusBadge", "Neplatné zadání");
      return false;
    }

    errorBox.hidden = true;
    const result = calculate(values);
    const effectiveRate = result.base > 0 ? result.total / result.base * 100 : 0;
    const perPerson = result.total / values.team;
    const settlementValue = taskMode === "target"
      ? Math.max(0, result.base - result.total)
      : values.settlement === "add"
        ? result.base + result.total
        : Math.max(0, result.base - result.total);

    setText("resultTitle", taskMode === "target" ? "Potřebný obrat" : "Celková provize");
    setText("answerLabel", taskMode === "target" ? "Pro cílovou provizi potřebujete" : "Provize činí");
    setText("answerValue", money(taskMode === "target" ? result.base : result.total));
    setText(
      "resultSentence",
      taskMode === "target"
        ? `Cíl ${money(values.target)} při sazbě ${percent(values.rate)}${values.fixed > 0 ? ` a pevné složce ${money(values.fixed)}` : ""} vyžaduje základ ${money(result.base)}.`
        : `Ze základu ${money(result.base)} vychází celková provize ${money(result.total)}.`
    );
    setText("percentPart", money(result.percentPart));
    setText("fixedPart", money(values.fixed));
    setText("effectiveRate", percent(effectiveRate));
    setText("perPerson", money(perPerson));
    setText(
      "settlementLabel",
      taskMode === "target"
        ? "Základ po odečtení cílové provize"
        : values.settlement === "add"
          ? "Celkem účtováno zákazníkovi"
          : "Po odečtení provize zbývá"
    );
    setText("settlementValue", money(settlementValue));
    setText(
      "settlementText",
      taskMode === "target"
        ? "Ukazuje, jaká část dopočítaného základu zbývá po cílové provizi."
        : values.settlement === "add"
          ? "Provize je přičtena k základu navíc."
          : "Provize je odečtena ze zadaného základu."
    );
    setText("statusBadge", `${taskMode === "target" ? "Cílový obrat" : "Výpočet hotový"} · ${detailMode === "basic" ? "rychlý" : "pokročilý"}`);
    setText(
      "decisionHeadline",
      effectiveRate > 15 ? "Provize tvoří výraznou část základu" : "Provizní zatížení je přehledně vyčíslené"
    );
    setText("decisionText", `Efektivní sazba včetně všech zapnutých složek je ${percent(effectiveRate)}. Na jednu osobu připadá ${money(perPerson)}.`);
    setText("nextStepText", "Porovnejte provizi s marží, náklady zakázky a smluvními podmínkami vzniku nároku.");

    renderTier(result, values);
    renderScenarios(values);

    if (options.scroll && window.matchMedia("(max-width: 720px)").matches) {
      $("vysledek")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return true;
  }

  function syncTaskVisibility() {
    form.dataset.mode = taskMode;
    document.querySelectorAll(".commission-modes [data-mode]").forEach((button) => {
      const active = button.dataset.mode === taskMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== taskMode;
    });
    document.querySelectorAll("[data-earn-only]").forEach((element) => {
      element.hidden = taskMode !== "earn";
    });
    setText("inputStepTitle", taskMode === "earn" ? "Doplňte základ a sazbu" : "Doplňte cílovou odměnu a sazbu");
    setText(
      "inputStepText",
      taskMode === "earn"
        ? "Pro první výsledek stačí základ provize a procentní sazba."
        : "Kalkulačka obrátí vzorec a dopočítá minimální potřebný základ."
    );
  }

  function syncDetailVisibility() {
    form.dataset.detail = detailMode;
    document.querySelectorAll(".detail-modes [data-detail]").forEach((button) => {
      const active = button.dataset.detail === detailMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    $("advancedFields").hidden = detailMode !== "advanced";
    setText(
      "modeAssumption",
      detailMode === "basic"
        ? "Rychlý režim používá pouze hlavní částku a základní procentní sazbu."
        : "Pokročilý režim započítá pouze parametry, které jsou právě zadané a aktivní."
    );
  }

  function setTaskMode(next) {
    taskMode = next === "target" ? "target" : "earn";
    syncTaskVisibility();
    render();
  }

  function setDetailMode(next) {
    detailMode = next === "advanced" ? "advanced" : "basic";
    syncDetailVisibility();
    render();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render({ scroll: true });
  });

  [
    "baseAmount", "targetCommission", "commissionRate", "fixedCommission",
    "settlementMode", "tierEnabled", "tierThreshold", "tierRate", "teamSize"
  ].map($).filter(Boolean).forEach((element) => {
    element.addEventListener("input", render);
    element.addEventListener("change", render);
  });

  document.querySelectorAll(".commission-modes [data-mode]").forEach((button) => {
    button.addEventListener("click", () => setTaskMode(button.dataset.mode));
  });
  document.querySelectorAll(".detail-modes [data-detail]").forEach((button) => {
    button.addEventListener("click", () => setDetailMode(button.dataset.detail));
  });

  $("resetBtn").addEventListener("click", () => {
    form.reset();
    taskMode = "earn";
    detailMode = "basic";
    syncTaskVisibility();
    syncDetailVisibility();
    render();
  });

  syncTaskVisibility();
  syncDetailVisibility();
  render();
})();
