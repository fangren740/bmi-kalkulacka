(() => {
  "use strict";

  const YEAR = 2026;
  const LIMITS = [1633, 2449, 4897];
  const BENEFIT_RATE = 0.6;
  const DEFAULTS = {
    basic: { gross: 42000, days: 9, caregiver: "standard" },
    pro: { income: 504000, countedDays: 365, directDvz: 1381, days: 9, caregiver: "standard", workType: "employee", insured: true }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const byId = (id) => document.getElementById(id);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const parseNumber = (value) => {
    const cleaned = String(value ?? "").replace(/\s/g, "").replace(/,/g, ".").replace(/[^0-9.-]/g, "");
    const parsed = Number.parseFloat(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const whole = (value) => new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(Math.round(value || 0));
  const decimal = (value, digits = 2) => new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value || 0);
  const money = (value) => `${whole(value)} Kč`;
  const checkedValue = (name, fallback) => $(`input[name="${name}"]:checked`)?.value || fallback;
  const setText = (id, value) => { const node = byId(id); if (node) node.textContent = value; };
  const setWidth = (id, value) => { const node = byId(id); if (node) node.style.width = `${clamp(value, 0, 100)}%`; };

  let activeMode = "basic";

  function limitFor(caregiver) {
    return caregiver === "lone" ? 16 : 9;
  }

  function basicInput() {
    const gross = clamp(parseNumber(byId("basicGross")?.value), 0, 10000000);
    const requestedDays = clamp(Math.ceil(parseNumber(byId("basicDays")?.value)), 1, 365);
    const caregiver = checkedValue("basicCaregiver", DEFAULTS.basic.caregiver);
    const dvz = gross * 12 / 365;
    return {
      mode: "basic",
      dvz,
      averageDailyIncome: dvz,
      requestedDays,
      caregiver,
      dayLimit: limitFor(caregiver),
      source: "měsíční mzda × 12 ÷ 365",
      workType: "employee",
      insured: null
    };
  }

  function proInput() {
    const direct = Boolean(byId("proUseDirect")?.checked);
    const income = clamp(parseNumber(byId("proIncome")?.value), 0, 100000000);
    const countedDays = clamp(Math.ceil(parseNumber(byId("proCountedDays")?.value)), 1, 3660);
    const directDvz = clamp(parseNumber(byId("proDirectDvz")?.value), 0, 1000000);
    const requestedDays = clamp(Math.ceil(parseNumber(byId("proDays")?.value)), 1, 365);
    const caregiver = byId("proCaregiver")?.value || DEFAULTS.pro.caregiver;
    const workType = byId("proWorkType")?.value || DEFAULTS.pro.workType;
    const insured = Boolean(byId("proInsured")?.checked);
    const dvz = direct ? directDvz : income / countedDays;
    return {
      mode: "pro",
      dvz,
      averageDailyIncome: dvz,
      requestedDays,
      caregiver,
      dayLimit: limitFor(caregiver),
      source: direct ? "přímo zadaný denní vyměřovací základ" : "započitatelný příjem ÷ kalendářní dny",
      workType,
      insured,
      direct,
      income,
      countedDays
    };
  }

  function reduceDvz(dvz) {
    const safe = Math.max(0, dvz);
    const firstBase = Math.min(safe, LIMITS[0]);
    const secondBase = Math.max(0, Math.min(safe, LIMITS[1]) - LIMITS[0]);
    const thirdBase = Math.max(0, Math.min(safe, LIMITS[2]) - LIMITS[1]);
    const ignored = Math.max(0, safe - LIMITS[2]);
    const firstContribution = firstBase * 0.9;
    const secondContribution = secondBase * 0.6;
    const thirdContribution = thirdBase * 0.3;
    return {
      firstBase,
      secondBase,
      thirdBase,
      ignored,
      firstContribution,
      secondContribution,
      thirdContribution,
      reduced: firstContribution + secondContribution + thirdContribution
    };
  }

  function calculate(input) {
    const bands = reduceDvz(input.dvz);
    const dailyBenefit = Math.ceil(bands.reduced * BENEFIT_RATE);
    const paidDays = Math.min(input.requestedDays, input.dayLimit);
    const ignoredDays = Math.max(0, input.requestedDays - paidDays);
    const total = dailyBenefit * paidDays;
    const replacement = input.averageDailyIncome > 0 ? dailyBenefit / input.averageDailyIncome * 100 : 0;
    const incomeGap = Math.max(0, input.averageDailyIncome - dailyBenefit) * paidDays;
    return { ...input, ...bands, dailyBenefit, paidDays, ignoredDays, total, replacement, incomeGap };
  }

  function resultStatus(result) {
    if (result.mode === "pro" && !result.insured) {
      return {
        tone: "danger",
        title: "Bez účasti na pojištění nelze nárok potvrdit",
        text: "U zaměstnance, DPP, DPČ i OSVČ je rozhodující účast na nemocenském pojištění. Částku proto berte jen jako technický model výpočtu."
      };
    }
    if (result.ignoredDays > 0) {
      const ignoredLabel = result.ignoredDays === 1 ? "1 den je" : result.ignoredDays >= 2 && result.ignoredDays <= 4 ? `${result.ignoredDays} dny jsou` : `${result.ignoredDays} dnů je`;
      return {
        tone: "warning",
        title: `${ignoredLabel} nad zvoleným limitem`,
        text: `Do částky se započítává ${result.paidDays} kalendářních dnů. Delší potřeba péče automaticky neznamená delší podpůrčí dobu.`
      };
    }
    if (result.mode === "basic") {
      return {
        tone: "",
        title: "Rychlý scénář je připraven",
        text: "Basic používá stabilní hrubou měsíční mzdu jako odhad ročního příjmu. Při proměnlivé mzdě použijte PRO režim."
      };
    }
    return {
      tone: "",
      title: "Detailní scénář je připraven",
      text: result.direct ? "Výpočet vychází z přímo zadaného DVZ." : "Výpočet vychází ze započitatelného příjmu a zadaných kalendářních dnů."
    };
  }

  function workTypeName(value) {
    return ({ employee: "zaměstnanec", agreement: "DPP / DPČ", osvc: "OSVČ" })[value] || "zaměstnanec";
  }

  function renderTimeline(result) {
    $$(".ocr-timeline span").forEach((node, index) => {
      const day = index + 1;
      node.classList.toggle("is-paid", day <= result.paidDays);
      node.classList.toggle("is-over", day > result.dayLimit && day <= result.requestedDays);
      node.title = day <= result.paidDays ? `Den ${day}: započítaný` : day <= result.requestedDays ? `Den ${day}: nad limitem` : `Den ${day}: mimo scénář`;
    });
  }

  function renderBands(result) {
    const denominator = Math.max(result.dvz, 1);
    const rows = [
      ["bandOneValue", "bandOneBar", result.firstBase, result.firstContribution],
      ["bandTwoValue", "bandTwoBar", result.secondBase, result.secondContribution],
      ["bandThreeValue", "bandThreeBar", result.thirdBase, result.thirdContribution],
      ["bandIgnoredValue", "bandIgnoredBar", result.ignored, 0]
    ];
    rows.forEach(([valueId, barId, base, contribution], index) => {
      setText(valueId, index === 3 ? `${whole(base)} Kč` : `${whole(base)} → ${whole(contribution)} Kč`);
      setWidth(barId, base / denominator * 100);
    });
  }

  function renderScenarios(result) {
    const scenario = (days) => money(result.dailyBenefit * Math.min(days, result.dayLimit));
    setText("scenario5", scenario(5));
    setText("scenario9", scenario(9));
    setText("scenario16", scenario(16));
    setText("scenarioUser", money(result.total));
    setText("scenarioUserDays", `${result.paidDays} započtených z ${result.requestedDays} zadaných dnů`);
  }

  function renderBreakdown(result) {
    const body = byId("breakdownBody");
    if (!body) return;
    const rows = [
      ["Výchozí DVZ", `${decimal(result.dvz)} Kč`, result.source],
      ["1. redukční pásmo", `${money(result.firstContribution)}`, `${whole(result.firstBase)} Kč započteno z 90 %`],
      ["2. redukční pásmo", `${money(result.secondContribution)}`, `${whole(result.secondBase)} Kč započteno z 60 %`],
      ["3. redukční pásmo", `${money(result.thirdContribution)}`, `${whole(result.thirdBase)} Kč započteno z 30 %`],
      ["Redukovaný DVZ", `${decimal(result.reduced)} Kč`, "Součet redukovaných částí"],
      ["Denní ošetřovné", money(result.dailyBenefit), "60 % redukovaného DVZ, zaokrouhleno nahoru"],
      ["Započtená doba", `${result.paidDays} dnů`, `Limit scénáře: ${result.dayLimit} dnů`],
      ["Odhad celkem", money(result.total), "Denní dávka × započtené kalendářní dny"]
    ];
    body.innerHTML = rows.map(([name, value, meaning]) => `<tr><td>${name}</td><td>${value}</td><td>${meaning}</td></tr>`).join("");
  }

  function renderDecision(result) {
    const title = byId("decisionTitle");
    const text = byId("decisionText");
    if (!title || !text) return;
    if (result.mode === "pro" && !result.insured) {
      title.textContent = "Nejdřív ověřte účast na pojištění";
      text.textContent = `Pro režim ${workTypeName(result.workType)} nelze z pouhé výše příjmu bezpečně potvrdit nárok. Ověřte účast na nemocenském pojištění a vznik sociální události.`;
    } else if (result.ignoredDays > 0) {
      title.textContent = "Výpočet narazil na podpůrčí limit";
      text.textContent = `Zadaná péče trvá ${result.requestedDays} dnů, ale použitý scénář započítá nejvýše ${result.dayLimit}. Zkontrolujte, zda opravdu splňujete podmínky standardního nebo osamělého pečujícího.`;
    } else {
      title.textContent = "Částku čtěte jako dávku, ne jako mzdu";
      text.textContent = `Model odhaduje ${money(result.dailyBenefit)} za kalendářní den a ${money(result.total)} za zadanou dobu. Reálný výpočet ČSSZ závisí na evidovaném příjmu, vyloučených dnech a účasti na pojištění.`;
    }
  }

  function renderExamples(result) {
    setText("exampleFive", money(result.dailyBenefit * Math.min(5, result.dayLimit)));
    setText("exampleNine", money(result.dailyBenefit * Math.min(9, result.dayLimit)));
  }

  function render() {
    const result = calculate(activeMode === "pro" ? proInput() : basicInput());
    const status = resultStatus(result);
    setText("modeStatus", result.mode === "basic" ? "Basic odhad" : "PRO výpočet");
    setText("resultBadge", result.mode === "basic" ? "ORIENTAČNÍ VÝPOČET" : "DETAILNÍ SCÉNÁŘ");
    setText("totalBenefit", money(result.total));
    setText("dailyBenefit", `${money(result.dailyBenefit)} za den`);
    setText("resultReplacement", `${whole(result.replacement)} % denního příjmu`);
    setWidth("benefitBar", result.replacement);
    setText("resultDvz", `${decimal(result.dvz)} Kč`);
    setText("resultReduced", `${decimal(result.reduced)} Kč`);
    setText("resultPaidDays", `${result.paidDays} z ${result.requestedDays}`);
    setText("resultLimit", `${result.dayLimit} dnů`);
    setText("resultStatus", status.title);
    setText("resultStatusText", status.text);
    setText("resultIncomeGap", `Orientační rozdíl proti výchozímu dennímu příjmu za započtenou dobu: ${money(result.incomeGap)}.`);
    const statusBox = byId("resultStatusBox");
    if (statusBox) statusBox.className = `ocr-status${status.tone ? ` is-${status.tone}` : ""}`;

    const summary = byId("proSummary");
    if (summary) summary.hidden = result.mode !== "pro";
    setText("proInputMethod", result.mode === "pro" ? result.source : "—");
    setText("proInsuranceStatus", result.mode === "pro" ? `${workTypeName(result.workType)} · ${result.insured ? "pojištění potvrzeno" : "pojištění nepotvrzeno"}` : "—");
    setText("proInputDays", result.mode === "pro" ? `${result.requestedDays} dnů` : "—");
    setText("proIgnoredDays", result.mode === "pro" ? `${result.ignoredDays} dnů` : "—");
    setText("resultAlert", result.ignored > 0 ? `Část DVZ nad ${money(LIMITS[2])} se v roce ${YEAR} nezohledňuje.` : `V roce ${YEAR} se váš scénář vejde do prvních tří redukčních pásem.`);

    setText("heroAmount", money(result.total));
    setText("heroDaily", `${money(result.dailyBenefit)} / den`);
    setText("heroDays", `${result.paidDays} dnů`);
    setText("heroDvz", `${whole(result.dvz)} Kč`);
    setText("heroReduced", `${whole(result.reduced)} Kč`);
    setText("heroLimit", `${result.dayLimit} dnů`);
    setWidth("heroBar", result.replacement);

    renderTimeline(result);
    renderBands(result);
    renderScenarios(result);
    renderBreakdown(result);
    renderDecision(result);
    renderExamples(result);
    window.__ocrLastResult = result;
  }

  function updateDirectFields() {
    const direct = Boolean(byId("proUseDirect")?.checked);
    if (byId("proPeriodFields")) byId("proPeriodFields").hidden = direct;
    if (byId("proDirectField")) byId("proDirectField").hidden = !direct;
  }

  function setMode(mode, moveFocus = false) {
    activeMode = mode === "pro" ? "pro" : "basic";
    document.body.dataset.ocrMode = activeMode;
    $$('[data-mode-button]').forEach((button) => {
      const active = button.dataset.modeButton === activeMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    $$('[data-mode-panel]').forEach((panel) => { panel.hidden = panel.dataset.modePanel !== activeMode; });
    updateDirectFields();
    render();
    if (moveFocus) {
      const panel = activeMode === "pro" ? byId("proPanel") : byId("basicPanel");
      panel?.querySelector("input,select")?.focus({ preventScroll: true });
    }
  }

  function syncBasicToPro() {
    const gross = parseNumber(byId("basicGross")?.value) || DEFAULTS.basic.gross;
    const days = Math.ceil(parseNumber(byId("basicDays")?.value)) || DEFAULTS.basic.days;
    if (byId("proIncome")) byId("proIncome").value = String(Math.round(gross * 12));
    if (byId("proCountedDays")) byId("proCountedDays").value = "365";
    if (byId("proDays")) byId("proDays").value = String(days);
    const caregiver = checkedValue("basicCaregiver", "standard");
    if (byId("proCaregiver")) byId("proCaregiver").value = caregiver;
    if (byId("proUseDirect")) byId("proUseDirect").checked = false;
    updateDirectFields();
  }

  function resetBasic() {
    if (byId("basicGross")) byId("basicGross").value = String(DEFAULTS.basic.gross);
    if (byId("basicDays")) byId("basicDays").value = String(DEFAULTS.basic.days);
    const caregiver = $(`input[name="basicCaregiver"][value="${DEFAULTS.basic.caregiver}"]`);
    if (caregiver) caregiver.checked = true;
    setMode("basic");
  }

  function resetPro() {
    if (byId("proIncome")) byId("proIncome").value = String(DEFAULTS.pro.income);
    if (byId("proCountedDays")) byId("proCountedDays").value = String(DEFAULTS.pro.countedDays);
    if (byId("proDirectDvz")) byId("proDirectDvz").value = String(DEFAULTS.pro.directDvz);
    if (byId("proDays")) byId("proDays").value = String(DEFAULTS.pro.days);
    if (byId("proWorkType")) byId("proWorkType").value = DEFAULTS.pro.workType;
    if (byId("proInsured")) byId("proInsured").checked = DEFAULTS.pro.insured;
    if (byId("proUseDirect")) byId("proUseDirect").checked = false;
    if (byId("proCaregiver")) byId("proCaregiver").value = DEFAULTS.pro.caregiver;
    updateDirectFields();
    setMode("pro");
  }

  async function copyResult() {
    const result = window.__ocrLastResult;
    if (!result) return;
    const text = `Odhad ošetřovného: ${money(result.total)} celkem, ${money(result.dailyBenefit)} za den, ${result.paidDays} započtených dnů. Orientační výpočet RychléVýpočty.cz.`;
    try {
      await navigator.clipboard.writeText(text);
      setText("copyResult", "Zkopírováno");
    } catch (_) {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      setText("copyResult", "Zkopírováno");
    }
    window.setTimeout(() => setText("copyResult", "Kopírovat výsledek"), 1800);
  }

  $$('[data-mode-button]').forEach((button) => button.addEventListener("click", () => setMode(button.dataset.modeButton, true)));
  $$('[data-open-pro]').forEach((button) => button.addEventListener("click", () => { syncBasicToPro(); setMode("pro", true); }));
  byId("copyFromBasic")?.addEventListener("click", () => { syncBasicToPro(); render(); });
  byId("resetBasic")?.addEventListener("click", resetBasic);
  byId("resetPro")?.addEventListener("click", resetPro);
  byId("proUseDirect")?.addEventListener("change", () => { updateDirectFields(); render(); });
  byId("copyResult")?.addEventListener("click", copyResult);
  byId("printResult")?.addEventListener("click", () => window.print());
  byId("ocrForm")?.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    if (window.matchMedia("(max-width: 820px)").matches) byId("vysledek")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  $$("#ocrForm input, #ocrForm select").forEach((input) => input.addEventListener("input", render));

  setMode("basic");
})();
