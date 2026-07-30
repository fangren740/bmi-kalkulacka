(() => {
  "use strict";

  const form = document.getElementById("reserveForm");
  if (!form) return;

  const get = (id) => document.getElementById(id);
  const set = (id, value) => {
    const node = get(id);
    if (node) node.textContent = value;
  };

  const currency = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0,
  });
  const decimal = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const czk = (value) => currency.format(Math.round(value));
  const monthLabel = (value) => `${decimal.format(value)} ${value === 1 ? "měsíc" : value >= 2 && value < 5 ? "měsíce" : "měsíců"}`;
  const shortMonths = (value) => `${decimal.format(value)} měs.`;

  const inputs = {
    expenses: get("reserveExpenses"),
    savings: get("reserveSavings"),
    shock: get("reserveShock"),
    monthlySaving: get("reserveMonthlySaving"),
    stress: get("reserveStress"),
  };

  const riskInputs = [get("riskSingle"), get("riskVariable"), get("riskMortgage"), get("riskDependents")];
  const defaults = { expenses: 60000, savings: 260000, shock: 30000, monthlySaving: 8000, stress: 10, targetMonths: 6 };
  let mode = "basic";

  function targetMonths() {
    const selected = form.querySelector('input[name="targetMonths"]:checked');
    return selected ? Number(selected.value) : 6;
  }

  function read() {
    return {
      expenses: Number(String(inputs.expenses.value).replace(",", ".")),
      savings: Number(String(inputs.savings.value).replace(",", ".")),
      shock: mode === "advanced" ? Number(String(inputs.shock.value).replace(",", ".")) : 0,
      monthlySaving: mode === "advanced" ? Number(String(inputs.monthlySaving.value).replace(",", ".")) : 0,
      stress: mode === "advanced" ? Number(String(inputs.stress.value).replace(",", ".")) : 0,
      targetMonths: targetMonths(),
    };
  }

  function validate(data) {
    if (!Number.isFinite(data.expenses) || data.expenses <= 0 || data.expenses > 100000000) return "Nutné měsíční výdaje musí být vyšší než 0 Kč.";
    if (!Number.isFinite(data.savings) || data.savings < 0 || data.savings > 1000000000) return "Současná likvidní rezerva nesmí být záporná.";
    if (![3, 6, 9, 12].includes(data.targetMonths)) return "Vyberte cílový počet měsíců.";
    if (!Number.isFinite(data.shock) || data.shock < 0 || data.shock > 100000000) return "Jednorázový rizikový polštář nesmí být záporný.";
    if (!Number.isFinite(data.monthlySaving) || data.monthlySaving < 0 || data.monthlySaving > 100000000) return "Měsíční odklad nesmí být záporný.";
    if (!Number.isFinite(data.stress) || data.stress < 0 || data.stress > 100) return "Stresové zvýšení výdajů zadejte v rozsahu 0 až 100 %.";
    return "";
  }

  function recommendation() {
    if (mode === "basic") {
      return { min: 3, max: 6, text: "Bez dalších rizikových údajů ukazujeme běžné orientační rozpětí. Pokročilý režim ho zpřesní podle vaší situace." };
    }
    let score = 0;
    if (get("riskSingle").checked) score += 2;
    if (get("riskVariable").checked) score += 2;
    if (get("riskMortgage").checked) score += 1;
    if (get("riskDependents").checked) score += 1;
    if (score === 0) return { min: 3, max: 6, text: "Při stabilním příjmu a bez označených rizik je běžné rozpětí tři až šest měsíců." };
    if (score <= 2) return { min: 6, max: 9, text: "Označená rizika snižují pružnost rozpočtu. Delší horizont přidává čas bez nutnosti rychle se zadlužit." };
    return { min: 9, max: 12, text: "Kombinace více rizik podporuje konzervativnější horizont. Výsledné číslo ale vždy porovnejte s reálnou možností rezervu vytvořit." };
  }

  function classification(coverage, target, gap) {
    if (coverage < 1) return { badge: "Kriticky nízká", title: "Nejdřív vytvořte první pohotovostní polštář", text: "Prioritou je částka, která zabrání tomu, aby první nečekaný výdaj vytvořil nový dluh." };
    if (coverage < 3) return { badge: "Nízká rezerva", title: "Zaměřte se na milník tří měsíců", text: "Současná rezerva už pomůže, ale delší výpadek příjmu by rychle vyčerpal dostupnou hotovost." };
    if (gap > 0) return { badge: "Rozumný základ", title: "Základ už existuje, teď uzavřete mezeru do cíle", text: "Pravidelný převod po výplatě pomůže rezervu doplňovat bez náhodných rozhodnutí." };
    if (coverage < 12) return { badge: "Cíl splněn", title: "Zvolený cíl je pokrytý", text: "Rezervu udržujte odděleně a přepočítejte ji po změně výdajů, bydlení nebo příjmu." };
    return { badge: "Velmi vysoká", title: "Rezerva výrazně převyšuje běžný provozní cíl", text: "Ověřte, jaká část musí zůstat likvidní a co už může sloužit dlouhodobějším cílům." };
  }

  function completionDate(monthsCount) {
    if (!Number.isFinite(monthsCount) || monthsCount <= 0) return "";
    const date = new Date();
    date.setMonth(date.getMonth() + monthsCount);
    return new Intl.DateTimeFormat("cs-CZ", { month: "long", year: "numeric" }).format(date);
  }

  function renderBars(data) {
    const root = get("scenarioBars");
    if (!root) return;
    const horizons = [3, 6, 9, 12];
    const values = horizons.map((months) => data.expenses * months + data.shock);
    const max = Math.max(...values, 1);
    root.innerHTML = horizons.map((months, index) => {
      const value = values[index];
      const width = Math.max(4, (value / max) * 100);
      const current = months === data.targetMonths ? " is-selected" : "";
      return `<div class="reserve-bar-row${current}"><span>${months} měsíců</span><div class="reserve-bar-track"><div class="reserve-bar-fill" style="width:${width}%">${months === data.targetMonths ? "váš cíl" : ""}</div></div><b>${czk(value)}</b></div>`;
    }).join("");
  }

  function render() {
    const data = read();
    const error = validate(data);
    const errorNode = get("reserveError");
    if (error) {
      errorNode.hidden = false;
      errorNode.textContent = error;
      ["coverageResult", "targetReserveResult", "gapReserveResult", "timeToTargetResult", "stressCoverageResult"].forEach((id) => set(id, "—"));
      return;
    }
    errorNode.hidden = true;

    const coverage = data.savings / data.expenses;
    const target = data.expenses * data.targetMonths + data.shock;
    const gap = Math.max(0, target - data.savings);
    const progress = target > 0 ? Math.min(100, data.savings / target * 100) : 0;
    const monthsToTarget = gap === 0 ? 0 : data.monthlySaving > 0 ? Math.ceil(gap / data.monthlySaving) : Infinity;
    const stressedExpenses = data.expenses * (1 + data.stress / 100);
    const stressedCoverage = data.savings / stressedExpenses;
    const stressedTarget = stressedExpenses * data.targetMonths + data.shock;
    const rec = recommendation();
    const status = classification(coverage, target, gap);
    const firstMilestone = data.expenses + data.shock;
    const threeMilestone = data.expenses * 3 + data.shock;

    set("coverageResult", monthLabel(coverage));
    set("heroCoverage", shortMonths(coverage));
    set("heroStatus", status.badge);
    set("statusBadge", status.badge);
    set("targetReserveResult", czk(target));
    set("heroTarget", czk(target));
    set("gapReserveResult", czk(gap));
    set("heroGap", gap === 0 ? "splněno" : czk(gap));
    set("targetShare", `${Math.round(progress)} %`);
    set("progressCaption", gap === 0 ? "Zvolený cíl je pokrytý." : `Do cílové rezervy zbývá ${czk(gap)}.`);
    set("targetFormulaText", `${data.targetMonths} měsíců${data.shock > 0 ? " + rizikový polštář" : " bez dalšího polštáře"}`);
    set("stressCoverageResult", shortMonths(stressedCoverage));
    set("stressExpensesResult", czk(stressedExpenses));
    set("stressCurrentTarget", czk(target));
    set("stressTargetResult", czk(stressedTarget));
    set("stressLabel", `+${decimal.format(data.stress)} %`);
    set("stressRingValue", decimal.format(stressedCoverage));
    set("stressText", data.stress > 0 ? `Při zvýšení výdajů o ${decimal.format(data.stress)} % se současná rezerva zkrátí přibližně o ${decimal.format(Math.max(0, coverage - stressedCoverage))} měsíce.` : "Bez stresového navýšení jsou výdaje stejné jako v základním scénáři.");
    set("recommendedRange", `${rec.min}–${rec.max} měsíců`);
    set("recommendationText", rec.text);
    set("interpretationTitle", status.title);
    set("interpretationText", status.text);
    set("answerSentence", `Likvidní rezerva ${czk(data.savings)} pokryje ${monthLabel(coverage)} nutných výdajů. Zvolený cíl odpovídá částce ${czk(target)}.`);
    set("milestoneOne", czk(firstMilestone));
    set("milestoneThree", czk(threeMilestone));
    set("milestoneTarget", czk(target));
    set("milestoneTargetCaption", `${data.targetMonths} měsíců výdajů${data.shock > 0 ? " včetně polštáře" : ""}.`);
    set("heroMilestone", gap === 0 ? "Cíl je splněn" : `${data.targetMonths} měsíců výdajů`);

    if (gap === 0) {
      set("timeToTargetResult", "splněno");
      set("heroMilestoneText", "Rezervu pravidelně přepočítejte podle aktuálních výdajů.");
      set("nextStepTitle", "Udržujte rezervu odděleně a aktualizujte její cíl");
      set("nextStepText", "Zvolený cíl je pokrytý. Dalším krokem je jasné pravidlo použití, pravidelná kontrola výdajů a oddělení přebytků pro další finanční cíle.");
    } else if (Number.isFinite(monthsToTarget)) {
      const date = completionDate(monthsToTarget);
      set("timeToTargetResult", `${monthsToTarget} měsíců`);
      set("heroMilestoneText", `Při odkladu ${czk(data.monthlySaving)} měsíčně přibližně za ${monthsToTarget} měsíců${date ? ` (${date})` : ""}.`);
      set("nextStepTitle", `Při současném tempu může být cíl hotový za ${monthsToTarget} měsíců`);
      set("nextStepText", `Měsíční odklad ${czk(data.monthlySaving)} uzavře mezeru přibližně za ${monthsToTarget} měsíců. První prioritu dejte nejbližšímu milníku a mimořádné příjmy používejte vědomě.`);
    } else {
      set("timeToTargetResult", "není nastaveno");
      set("heroMilestoneText", "V pokročilém režimu nastavte měsíční odklad a kalkulačka dopočítá dobu tvorby.");
      set("nextStepTitle", "Nastavte udržitelný měsíční odklad");
      set("nextStepText", "Bez pravidelného odkladu se mezera do cíle sama nezmenší. Zvolte částku, která neohrozí běžný rozpočet, a nastavte automatický převod po příjmu.");
    }

    get("targetFill").style.width = `${progress}%`;
    get("heroProgress").style.width = `${progress}%`;
    const ringPercent = Math.min(100, stressedCoverage / Math.max(data.targetMonths, 1) * 100);
    get("stressRing").style.setProperty("--ring", `${ringPercent}%`);

    renderBars(data);
  }

  function setMode(nextMode) {
    mode = nextMode;
    document.querySelectorAll("[data-mode]").forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    });
    get("advancedFields").hidden = mode !== "advanced";
    get("modeNote").innerHTML = mode === "advanced"
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v5m0 4h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><p><strong>Pokročilý režim</strong> přidává jednorázový šok, tempo tvorby, stresový scénář a transparentní doporučené rozpětí podle označených rizik.</p>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-14v5m0 4h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><p><strong>Základní režim</strong> počítá rezervu z nutných výdajů, současných úspor a vámi zvoleného počtu měsíců.</p>';
    render();
  }

  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    get("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));

  get("resetReserve").addEventListener("click", () => {
    inputs.expenses.value = defaults.expenses;
    inputs.savings.value = defaults.savings;
    inputs.shock.value = defaults.shock;
    inputs.monthlySaving.value = defaults.monthlySaving;
    inputs.stress.value = defaults.stress;
    form.querySelector(`input[name="targetMonths"][value="${defaults.targetMonths}"]`).checked = true;
    riskInputs.forEach((input) => { input.checked = false; });
    setMode("basic");
  });

  render();
})();
