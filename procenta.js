(() => {
  const $ = (id) => document.getElementById(id);
  const buttons = Array.from(document.querySelectorAll("[data-percent-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-percent-panel]"));
  const number = (value, digits = 2) =>
    new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(
      Number.isFinite(value) ? value : 0
    );
  let active = "percent-of";

  function setActive(tab) {
    active = tab;
    buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.percentTab === tab)));
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.percentPanel !== tab;
    });
    render();
  }

  function renderResult(data) {
    $("mainResult").textContent = data.main;
    $("secondaryResult").textContent = data.secondary;
    $("differenceResult").textContent = data.diff;
    $("typeResult").textContent = data.type;
    $("resultBadge").textContent = data.badge;
    $("input1Result").textContent = data.input1;
    $("input2Result").textContent = data.input2;
    $("formulaResult").textContent = data.formula;
    $("contextResult").textContent = data.context;
    $("precisionResult").textContent = "2 desetinná místa";
    $("resultNote").textContent = data.note;
    $("interpretText").textContent = data.interpret;
    $("decisionSummary").textContent = data.next;
    $("nextActionText").textContent = data.action;
  }

  function render() {
    if (active === "percent-of") {
      const percent = Number($("percentValue").value) || 0;
      const base = Number($("baseValue").value) || 0;
      const result = (percent / 100) * base;
      renderResult({
        main: number(result),
        secondary: `${number(percent)} % z ${number(base)}`,
        diff: number(base - result),
        type: "Část ze základu",
        badge: "Procento z částky",
        input1: `${number(percent)} %`,
        input2: number(base),
        formula: "procento / 100 × základ",
        context: "část z celku",
        note: `${number(percent)} % z hodnoty ${number(base)} je ${number(result)}.`,
        interpret: "Tento režim použijte, když znáte procento a základ a chcete zjistit částku.",
        next: "U cen si po výpočtu můžete ověřit DPH nebo slevu.",
        action: "Zkontrolujte, že základ odpovídá částce, ze které se procento opravdu počítá."
      });
      return;
    }
    if (active === "change") {
      const oldValue = Number($("oldValue").value) || 0;
      const newValue = Number($("newValue").value) || 0;
      const diff = newValue - oldValue;
      const change = oldValue !== 0 ? (diff / oldValue) * 100 : 0;
      renderResult({
        main: `${number(change)} %`,
        secondary: diff >= 0 ? "Nárůst" : "Pokles",
        diff: number(diff),
        type: "Procentní změna",
        badge: diff >= 0 ? "Zvýšení" : "Snížení",
        input1: number(oldValue),
        input2: number(newValue),
        formula: "(nová - původní) / původní × 100",
        context: "změna mezi hodnotami",
        note: `Změna z ${number(oldValue)} na ${number(newValue)} je ${number(change)} %.`,
        interpret: "Procentní změna se vždy vztahuje k původní hodnotě.",
        next: "U cen můžete pokračovat přesnější kalkulačkou zdražení a zlevnění.",
        action: "Pozor na záměnu původní a nové hodnoty, výsledek by změnil znaménko."
      });
      return;
    }
    if (active === "share") {
      const a = Number($("valueA").value) || 0;
      const b = Number($("valueB").value) || 0;
      const result = b !== 0 ? (a / b) * 100 : 0;
      renderResult({
        main: `${number(result)} %`,
        secondary: `${number(a)} z ${number(b)}`,
        diff: number(b - a),
        type: "Podíl",
        badge: "Podíl z celku",
        input1: number(a),
        input2: number(b),
        formula: "část / celek × 100",
        context: "porovnání části a celku",
        note: `${number(a)} je ${number(result)} % z hodnoty ${number(b)}.`,
        interpret: "Tento režim se hodí pro poměr části k celku, obsazenost, splnění cíle nebo podíl nákladů.",
        next: "Pokud jde o rozpočet, navazují kalkulačky domácnosti nebo podnikání.",
        action: "Ujistěte se, že druhá hodnota je opravdu celek, ne porovnávaný stav."
      });
      return;
    }
    const original = Number($("priceOriginal").value) || 0;
    const percent = Number($("pricePercent").value) || 0;
    const mode = $("priceMode").value;
    const changeAmount = (percent / 100) * original;
    const finalPrice = mode === "discount" ? original - changeAmount : original + changeAmount;
    renderResult({
      main: money(finalPrice),
      secondary: mode === "discount" ? "Cena po slevě" : "Cena po navýšení",
      diff: money(changeAmount),
      type: mode === "discount" ? "Sleva" : "Navýšení",
      badge: mode === "discount" ? "Sleva z ceny" : "Navýšení ceny",
      input1: money(original),
      input2: `${number(percent)} %`,
      formula: "původní cena ± procento",
      context: "cenový scénář",
      note: `${number(percent)} % z ceny ${money(original)} je ${money(changeAmount)}.`,
      interpret: "Tento režim rychle ukáže novou cenu po slevě nebo zdražení.",
      next: "U obchodních cen si ověřte také marži a minimální prodejní cenu.",
      action: "Pokud máte více po sobě jdoucích slev, použijte kalkulačku slevy."
    });
  }

  buttons.forEach((button) => button.addEventListener("click", () => setActive(button.dataset.percentTab)));
  document.querySelectorAll("input, select").forEach((el) => {
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });
  document.querySelectorAll("[data-reset-percent]").forEach((button) => {
    button.addEventListener("click", () => {
      const values = {
        percentValue: 10,
        baseValue: 200,
        oldValue: 100,
        newValue: 120,
        valueA: 50,
        valueB: 200,
        priceOriginal: 2500,
        pricePercent: 15
      };
      Object.entries(values).forEach(([id, value]) => {
        if ($(id)) $(id).value = value;
      });
      $("priceMode").value = "discount";
      render();
    });
  });
  setActive(active);
})();
