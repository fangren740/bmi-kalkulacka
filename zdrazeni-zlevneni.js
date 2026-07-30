(() => {
  "use strict";

  const form = document.getElementById("priceChangeForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const moneyFormatter = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const numberFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });

  let depth = "basic";
  let mode = "compare";
  let result = null;

  const presets = {
    energy: { mode: "compare", old: 5.2, new: 5.98, units: 250, months: 12 },
    rent: { mode: "compare", old: 18000, new: 19440, units: 1, months: 12 },
    sale: { mode: "forward", base: 2490, percent: 25, direction: "decrease", units: 1, months: 1 },
    reverse: { mode: "reverse", current: 1200, percent: 20, direction: "increase", units: 1, months: 12 },
  };

  const text = (id, value) => {
    const element = $(id);
    if (element) element.textContent = value;
  };
  const money = (value) => moneyFormatter.format(Number.isFinite(value) ? value : 0);
  const percent = (value) => `${numberFormatter.format(Number.isFinite(value) ? value : 0)} %`;
  const number = (value) => numberFormatter.format(Number.isFinite(value) ? value : 0);

  function readValues() {
    if (mode === "compare") {
      return { mode, old: Number($("oldPrice").value), now: Number($("newPrice").value) };
    }
    if (mode === "forward") {
      return {
        mode,
        base: Number($("basePrice").value),
        change: Number($("changePercent").value),
        direction: $("forwardDirection").value,
      };
    }
    return {
      mode,
      current: Number($("currentPrice").value),
      change: Number($("previousPercent").value),
      direction: $("reverseDirection").value,
    };
  }

  function validate(values) {
    if (values.mode === "compare") {
      if (!Number.isFinite(values.old) || values.old <= 0) return "Původní cena musí být vyšší než nula.";
      if (!Number.isFinite(values.now) || values.now < 0) return "Nová cena nemůže být záporná.";
      return "";
    }

    if (values.mode === "forward") {
      if (!Number.isFinite(values.base) || values.base <= 0) return "Výchozí cena musí být vyšší než nula.";
      if (!Number.isFinite(values.change) || values.change < 0) return "Změna ceny nemůže být záporná.";
      if (values.direction === "decrease" && values.change > 100) return "Zlevnění nemůže být vyšší než 100 %.";
      if (values.direction === "increase" && values.change > 1000) return "Zadejte zdražení nejvýše 1 000 %.";
      return "";
    }

    if (!Number.isFinite(values.current) || values.current <= 0) return "Současná cena musí být vyšší než nula.";
    if (!Number.isFinite(values.change) || values.change < 0) return "Předchozí změna nemůže být záporná.";
    if (values.direction === "decrease" && values.change >= 100) return "Po zlevnění o 100 % nelze původní cenu jednoznačně určit.";
    if (values.direction === "increase" && values.change > 1000) return "Zadejte předchozí zdražení nejvýše 1 000 %.";
    return "";
  }

  function calculate(values) {
    let oldPrice;
    let newPrice;

    if (values.mode === "compare") {
      oldPrice = values.old;
      newPrice = values.now;
    } else if (values.mode === "forward") {
      oldPrice = values.base;
      const coefficient = values.direction === "increase" ? 1 + values.change / 100 : 1 - values.change / 100;
      newPrice = oldPrice * coefficient;
    } else {
      newPrice = values.current;
      const coefficient = values.direction === "increase" ? 1 + values.change / 100 : 1 - values.change / 100;
      oldPrice = newPrice / coefficient;
    }

    const difference = newPrice - oldPrice;
    const relativeChange = (difference / oldPrice) * 100;
    const priceIndex = (newPrice / oldPrice) * 100;
    const returnPercent = newPrice === 0 ? null : (Math.abs(difference) / newPrice) * 100;

    return { oldPrice, newPrice, difference, relativeChange, priceIndex, returnPercent };
  }

  function clearResult(message) {
    const error = $("changeError");
    error.hidden = false;
    error.textContent = message;
    [
      "answerValue", "oldPriceResult", "newPriceResult", "difference", "priceIndex", "returnPercent",
      "oldPeriodCost", "newPeriodCost", "periodDifference", "monthlyDifference",
    ].forEach((id) => text(id, "—"));
    text("resultTitle", "Zkontrolujte zadání");
    text("statusBadge", "Neplatný vstup");
    text("resultSentence", message);
    text("impactNote", "Dopad lze spočítat až po opravě hlavního zadání.");
    $("scenarioBody").replaceChildren();
    result = null;
  }

  function renderMain(options = {}) {
    const values = readValues();
    const validationMessage = validate(values);
    if (validationMessage) {
      clearResult(validationMessage);
      return false;
    }

    $("changeError").hidden = true;
    result = calculate(values);

    const isUp = result.difference > 0;
    const isDown = result.difference < 0;
    const signedPercent = result.relativeChange > 0 ? `+${percent(result.relativeChange)}` : percent(result.relativeChange);

    text("resultTitle", isUp ? "Cena zdražila" : isDown ? "Cena zlevnila" : "Cena se nezměnila");
    text("statusBadge", signedPercent);
    text("answerLabel", mode === "reverse" ? "Dopočítaná původní cena" : mode === "forward" ? "Vypočítaná nová cena" : "Procentní změna");
    text("answerValue", mode === "reverse" ? money(result.oldPrice) : mode === "forward" ? money(result.newPrice) : signedPercent);
    text("oldPriceResult", money(result.oldPrice));
    text("newPriceResult", money(result.newPrice));
    text("difference", `${result.difference > 0 ? "+" : ""}${money(result.difference)}`);
    text("priceIndex", number(result.priceIndex));
    text(
      "resultSentence",
      `Změna z ${money(result.oldPrice)} na ${money(result.newPrice)} představuje ${isUp ? "zdražení" : isDown ? "zlevnění" : "nulovou změnu"} o ${percent(Math.abs(result.relativeChange))}.`,
    );

    text("returnLabel", isUp ? "Nutné zlevnění pro návrat" : isDown ? "Nutné zdražení pro návrat" : "Návrat k původní ceně");
    text("returnPercent", result.returnPercent === null ? "Nedefinováno" : percent(result.returnPercent));
    text(
      "returnText",
      isUp
        ? `Z nové ceny je potřeba odečíst ${money(Math.abs(result.difference))}, tedy ${percent(result.returnPercent)}.`
        : isDown
          ? `K nové ceně je potřeba přidat ${money(Math.abs(result.difference))}, tedy ${result.returnPercent === null ? "nedefinované procento" : percent(result.returnPercent)}.`
          : "Cena už odpovídá původní hodnotě.",
    );

    const intensity = Math.abs(result.relativeChange);
    text("decisionHeadline", intensity >= 20 ? "Výrazná cenová změna" : intensity >= 5 ? "Změna je dobře znatelná" : "Menší relativní změna");
    text("decisionText", `Cenový index je ${number(result.priceIndex)}. Nová cena tedy odpovídá ${percent(result.priceIndex)} původní hodnoty.`);
    text(
      "nextStepText",
      isUp
        ? depth === "advanced" ? "Zkontrolujte dopad za celé období a porovnejte alternativní scénáře." : "U pravidelného výdaje přepněte na pokročilý režim a spočítejte roční dopad."
        : isDown
          ? "Ověřte, zda se nezměnilo množství, kvalita nebo podmínky nabídky."
          : "Obě porovnávané ceny jsou stejné.",
    );

    renderImpact();
    renderScenarios();
    updateHeroPreview();

    if (options.scroll && window.matchMedia("(max-width: 760px)").matches) {
      $("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return true;
  }

  function renderImpact() {
    if (!result) return;
    const units = Number($("unitsPerMonth").value);
    const months = Number($("periodMonths").value);
    const error = $("impactError");

    if (!Number.isFinite(units) || units < 0 || !Number.isInteger(months) || months < 1 || months > 120) {
      error.hidden = false;
      error.textContent = "Zadejte nezáporné množství a celé období od 1 do 120 měsíců.";
      return;
    }

    error.hidden = true;
    const oldCost = result.oldPrice * units * months;
    const newCost = result.newPrice * units * months;
    const difference = newCost - oldCost;

    text("oldPeriodCost", money(oldCost));
    text("newPeriodCost", money(newCost));
    text("periodDifference", `${difference > 0 ? "+" : ""}${money(difference)}`);
    text("monthlyDifference", `${difference > 0 ? "+" : ""}${money(difference / months)}`);
    text(
      "impactNote",
      difference > 0
        ? `Za ${months} měsíců zaplatíte při stejném množství o ${money(difference)} více.`
        : difference < 0
          ? `Za ${months} měsíců ušetříte při stejném množství ${money(Math.abs(difference))}.`
          : "Výdaj za období se nemění.",
    );
  }

  function renderScenarios() {
    if (!result) return;
    const body = $("scenarioBody");
    body.replaceChildren();

    [-25, -10, -5, 5, 10, 25].forEach((change) => {
      const price = result.oldPrice * (1 + change / 100);
      const difference = price - result.oldPrice;
      const row = document.createElement("tr");
      row.className = change < 0 ? "down" : "up";
      row.innerHTML = `<td><strong>${change > 0 ? "+" : ""}${change} %</strong></td><td>${money(price)}</td><td>${difference > 0 ? "+" : ""}${money(difference)}</td><td>${number(100 + change)}</td>`;
      body.appendChild(row);
    });
  }

  function updateHeroPreview() {
    if (!result) return;
    const badge = document.querySelector(".chart-head b");
    const value = document.querySelector(".chart-value strong");
    const labels = document.querySelectorAll(".chart-bars span");
    const bars = document.querySelectorAll(".chart-bars u");
    if (badge) badge.textContent = `${result.relativeChange > 0 ? "+" : ""}${percent(result.relativeChange)}`;
    if (value) value.textContent = money(result.newPrice);
    if (labels[0]) labels[0].textContent = money(result.oldPrice);
    if (labels[1]) labels[1].textContent = money(result.newPrice);
    if (bars.length === 2) {
      const max = Math.max(result.oldPrice, result.newPrice, 1);
      bars[0].style.height = `${Math.max(12, (result.oldPrice / max) * 88)}%`;
      bars[1].style.height = `${Math.max(12, (result.newPrice / max) * 88)}%`;
    }
  }

  function setMode(nextMode) {
    mode = depth === "basic" ? "compare" : nextMode;
    form.dataset.mode = mode;

    document.querySelectorAll(".mode-tabs [data-mode]").forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.panel !== mode;
    });
    renderMain();
  }

  function setDepth(nextDepth) {
    depth = nextDepth;
    form.dataset.depth = depth;
    document.querySelectorAll("[data-depth]").forEach((button) => {
      const active = button.dataset.depth === depth;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll(".advanced-only").forEach((element) => {
      element.hidden = depth !== "advanced";
    });
    if (depth === "basic") setMode("compare");
    else setMode(mode || "compare");
  }

  function setPreset(name) {
    const preset = presets[name];
    if (!preset) return;
    if (depth !== "advanced") setDepth("advanced");
    setMode(preset.mode);

    if (preset.mode === "compare") {
      $("oldPrice").value = preset.old;
      $("newPrice").value = preset.new;
    } else if (preset.mode === "forward") {
      $("basePrice").value = preset.base;
      $("changePercent").value = preset.percent;
      $("forwardDirection").value = preset.direction;
    } else {
      $("currentPrice").value = preset.current;
      $("previousPercent").value = preset.percent;
      $("reverseDirection").value = preset.direction;
    }

    $("unitsPerMonth").value = preset.units;
    $("periodMonths").value = preset.months;
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.preset === name);
    });
    renderMain();
  }

  function reset() {
    form.reset();
    $("oldPrice").value = 1000;
    $("newPrice").value = 1200;
    $("unitsPerMonth").value = 1;
    $("periodMonths").value = 12;
    document.querySelectorAll("[data-preset]").forEach((button) => button.classList.remove("is-active"));
    mode = "compare";
    setDepth("basic");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderMain({ scroll: true });
  });
  form.addEventListener("input", () => renderMain());
  form.addEventListener("change", () => renderMain());
  document.querySelectorAll("[data-depth]").forEach((button) => button.addEventListener("click", () => setDepth(button.dataset.depth)));
  document.querySelectorAll(".mode-tabs [data-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => setPreset(button.dataset.preset)));
  $("impactForm").addEventListener("submit", (event) => {
    event.preventDefault();
    renderImpact();
  });
  ["unitsPerMonth", "periodMonths"].forEach((id) => $(id).addEventListener("input", renderImpact));
  $("resetBtn").addEventListener("click", reset);

  setDepth("basic");
})();
