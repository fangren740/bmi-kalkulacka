(function () {
  "use strict";

  const form = document.getElementById("severanceForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const moneyFormatter = new Intl.NumberFormat("cs-CZ", {
    style: "currency",
    currency: "CZK",
    maximumFractionDigits: 0
  });
  const numberFormatter = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });

  let mode = "basic";
  let lastResult = null;

  const reasonData = {
    organizational: {
      short: "Organizační důvod",
      type: "Zákonné odstupné",
      basis: "§ 67 odst. 1",
      tax: "zdanění ano · pojistné obvykle ne",
      check: "Organizační důvod podle § 52 písm. a) až c) a způsob skončení."
    },
    exposure: {
      short: "Nejvyšší přípustná expozice",
      type: "Zákonné odstupné 12×",
      basis: "§ 67 odst. 3",
      tax: "zdanění ano · pojistné obvykle ne",
      check: "Rozhodnutí o nejvyšší přípustné expozici a přesný důvod skončení."
    },
    workHealth: {
      short: "Pracovní úraz / nemoc z povolání",
      type: "Jednorázová náhrada",
      basis: "§ 271ca",
      tax: "daň ano · sociální a zdravotní ne",
      check: "Pracovnělékařský posudek a souvislost s pracovním úrazem či nemocí z povolání."
    },
    other: {
      short: "Jiný důvod",
      type: "Bez zákonného násobku",
      basis: "individuální posouzení",
      tax: "ověřte daň i pojistné",
      check: "Právní titul případného dobrovolného nebo smluvního plnění."
    }
  };

  function parseNumber(value) {
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const normalized = String(value || "")
      .replace(/\s/g, "")
      .replace(/[^0-9,.-]/g, "")
      .replace(",", ".");
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function money(value) {
    return moneyFormatter.format(Math.round(Math.max(0, value)));
  }

  function multiple(value) {
    return `${numberFormatter.format(Math.max(0, value))}×`;
  }

  function months(value) {
    const rounded = Math.round(value * 10) / 10;
    if (rounded === 1) return "1 měsíc";
    if (rounded >= 2 && rounded <= 4 && Number.isInteger(rounded)) return `${rounded} měsíce`;
    return `${numberFormatter.format(rounded)} měsíců`;
  }

  function selected(name) {
    const input = form.querySelector(`input[name="${name}"]:checked`);
    return input ? input.value : "";
  }

  function durationFromMonths(totalMonths) {
    if (totalMonths < 12) return "under1";
    if (totalMonths < 24) return "1to2";
    return "over2";
  }

  function durationLabel(duration, exactMonths) {
    if (Number.isFinite(exactMonths)) {
      if (exactMonths < 12) return `${numberFormatter.format(exactMonths)} měs. · méně než rok`;
      if (exactMonths < 24) return `${numberFormatter.format(exactMonths)} měs. · 1–2 roky`;
      return `${numberFormatter.format(exactMonths)} měs. · alespoň 2 roky`;
    }
    if (duration === "under1") return "méně než 1 rok";
    if (duration === "1to2") return "1 až méně než 2 roky";
    return "alespoň 2 roky";
  }

  function compactDuration(duration) {
    if (duration === "under1") return "< 1 rok";
    if (duration === "1to2") return "1–2 roky";
    return "2+ roky";
  }

  function legalMultiplier(reason, duration, workTimeAccount) {
    if (reason === "exposure" || reason === "workHealth") return 12;
    if (reason !== "organizational") return 0;
    const base = duration === "under1" ? 1 : duration === "1to2" ? 2 : 3;
    return base + (workTimeAccount ? 3 : 0);
  }

  function getBasicInput() {
    const duration = selected("basicDuration");
    return {
      mode: "basic",
      workTimeAccount: false,
      earnings: clamp(parseNumber($("basicEarnings").value), 0, 10000000),
      reason: selected("basicReason"),
      duration,
      totalMonths: null,
      extraMultiplier: 0,
      monthlyCosts: 0,
      returnEnabled: false,
      returnAfter: 0
    };
  }

  function getProInput() {
    const currentMonths = clamp(parseNumber($("proCurrentMonths").value), 0, 1200);
    const previousMonths = $("proPreviousEligible").checked
      ? clamp(parseNumber($("proPreviousMonths").value), 0, 1200)
      : 0;
    const totalMonths = currentMonths + previousMonths;
    return {
      mode: "pro",
      workTimeAccount: $("proReason").value === "organizational" && $("proWorkTimeAccount").checked,
      earnings: clamp(parseNumber($("proEarnings").value), 0, 10000000),
      reason: $("proReason").value,
      duration: durationFromMonths(totalMonths),
      totalMonths,
      currentMonths,
      previousMonths,
      extraMultiplier: clamp(parseNumber($("proExtraMultiplier").value), 0, 50),
      monthlyCosts: clamp(parseNumber($("proMonthlyCosts").value), 0, 10000000),
      returnEnabled: $("proReturnEnabled").checked,
      returnAfter: clamp(parseNumber($("proReturnAfter").value), 0, 120)
    };
  }

  function calculate(input) {
    const statutoryMultiplier = legalMultiplier(input.reason, input.duration, input.workTimeAccount);
    const totalMultiplier = statutoryMultiplier + input.extraMultiplier;
    const statutoryAmount = input.earnings * statutoryMultiplier;
    const extraAmount = input.earnings * input.extraMultiplier;
    const totalAmount = statutoryAmount + extraAmount;
    const runway = input.monthlyCosts > 0 ? totalAmount / input.monthlyCosts : null;
    let repayment = 0;
    let repaymentShare = 0;
    const repaymentEligible = input.reason === "organizational" || input.reason === "exposure";

    if (repaymentEligible && input.returnEnabled && totalMultiplier > 0 && input.returnAfter < totalMultiplier) {
      repaymentShare = (totalMultiplier - input.returnAfter) / totalMultiplier;
      repayment = totalAmount * repaymentShare;
    }

    return {
      ...input,
      statutoryMultiplier,
      totalMultiplier,
      statutoryAmount,
      extraAmount,
      totalAmount,
      runway,
      repayment,
      repaymentShare,
      repaymentEligible
    };
  }

  function resultType(result) {
    if (result.reason === "other" && result.extraMultiplier > 0) return "Smluvní plnění";
    if (result.reason === "workHealth" && result.extraMultiplier > 0) return "Náhrada + další plnění";
    if (result.reason === "exposure" && result.extraMultiplier > 0) return "Odstupné + další plnění";
    return reasonData[result.reason].type;
  }

  function statusCopy(result) {
    if (result.earnings <= 0) {
      return {
        title: "Doplňte průměrný výdělek",
        text: "Bez kladného průměrného měsíčního výdělku nelze částku vypočítat."
      };
    }

    if (result.reason === "organizational") {
      return {
        title: result.workTimeAccount ? "Organizační důvod · konto pracovní doby" : "Organizační důvod",
        text: `Pro dobu ${durationLabel(result.duration, result.totalMonths)} vychází zákonné minimum ${multiple(result.statutoryMultiplier)} průměrného měsíčního výdělku.${result.workTimeAccount ? " Zahrnut je zvláštní příplatek 3× podle § 67 odst. 1 písm. d)." : ""}${result.extraMultiplier > 0 ? ` Dokumenty přidávají dalších ${multiple(result.extraMultiplier)}.` : ""}`
      };
    }

    if (result.reason === "exposure") {
      return {
        title: "Nejvyšší přípustná expozice",
        text: "Model počítá zákonné odstupné nejméně ve výši dvanáctinásobku. Ověřte rozhodnutí a přesný důvod skončení."
      };
    }

    if (result.reason === "workHealth") {
      return {
        title: "Jednorázová náhrada, ne běžné odstupné",
        text: "Od 1. 6. 2025 model počítá 12× podle § 271ca. Nárok vyžaduje pracovní příčinu a odpovídající posudek."
      };
    }

    if (result.extraMultiplier > 0) {
      return {
        title: "Pouze smluvní nebo dobrovolné plnění",
        text: "Zvolený důvod nevytváří zákonný násobek. Částku tvoří jen navýšení zadané podle vašich dokumentů."
      };
    }

    return {
      title: "Zákonné odstupné nevychází",
      text: "Vlastní výpověď nebo jiný obecný důvod sám o sobě nezakládá zákonné odstupné. Ověřte, zda neexistuje jiné ujednání."
    };
  }

  function tableRows(result) {
    const rows = [
      ["Průměrný měsíční výdělek", money(result.earnings), "Základ použitý pro všechny násobky"],
      ["Právní scénář", reasonData[result.reason].short, result.workTimeAccount ? "§ 67 odst. 1 písm. d)" : reasonData[result.reason].basis],
      ["Délka pracovního poměru", durationLabel(result.duration, result.totalMonths), result.mode === "pro" ? "Současná a případně návazná předchozí doba" : "Zvolená hranice v Basic režimu"],
      ["Zákonný násobek", multiple(result.statutoryMultiplier), result.reason === "organizational" ? (result.workTimeAccount ? "Běžné minimum podle délky + zvláštní 3× za konto pracovní doby" : "Minimum podle délky poměru") : "Minimum podle zvoleného zvláštního důvodu"],
      ["Zákonná část", money(result.statutoryAmount), `${money(result.earnings)} × ${multiple(result.statutoryMultiplier)}`]
    ];

    if (result.mode === "pro") {
      rows.push(["Smluvní navýšení", `${multiple(result.extraMultiplier)} · ${money(result.extraAmount)}`, "Nad zákonné minimum podle zadaných dokumentů"]);
    }

    rows.push(["Celkové hrubé plnění", money(result.totalAmount), `${multiple(result.totalMultiplier)} průměrného výdělku`]);

    if (result.runway !== null) {
      rows.push(["Hrubá finanční rezerva", months(result.runway), `Při nutných výdajích ${money(result.monthlyCosts)} měsíčně`]);
    }

    return rows;
  }

  function renderTable(result) {
    $("summaryTableBody").innerHTML = tableRows(result)
      .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
      .join("");
  }

  function renderScenarios(earnings) {
    $("scenarioOne").textContent = money(earnings);
    $("scenarioTwo").textContent = money(earnings * 2);
    $("scenarioThree").textContent = money(earnings * 3);
    $("scenarioTwelve").textContent = money(earnings * 12);
  }

  function render(result) {
    const config = reasonData[result.reason];
    const type = resultType(result);
    const status = statusCopy(result);
    const barWidth = result.totalMultiplier > 0 ? clamp((result.totalMultiplier / 12) * 100, 5, 100) : 0;

    lastResult = result;
    document.body.dataset.mode = result.mode;
    $("modeStatus").textContent = result.mode === "pro" ? "PRO scénář" : "Basic výpočet";
    $("heroMode").textContent = result.mode === "pro" ? "PRO" : "Basic";

    $("resultType").textContent = type;
    $("resultTotal").textContent = money(result.totalAmount);
    $("resultMultiplier").textContent = result.totalMultiplier > 0
      ? `${multiple(result.totalMultiplier)} průměrného výdělku`
      : "bez zákonného násobku";
    $("resultMinimum").textContent = multiple(result.statutoryMultiplier);
    $("resultBar").style.width = `${barWidth}%`;
    $("resultAverage").textContent = money(result.earnings);
    $("resultLegal").textContent = multiple(result.statutoryMultiplier);
    $("resultDuration").textContent = compactDuration(result.duration);
    $("resultExtra").textContent = multiple(result.extraMultiplier);
    $("resultRunway").textContent = result.runway === null ? "—" : months(result.runway);
    $("resultStatus").textContent = status.title;
    $("resultStatusText").textContent = status.text;
    $("resultTax").textContent = result.extraMultiplier > 0
      ? "navýšení: ověřte pojistný režim"
      : config.tax;
    $("checkReason").textContent = config.check;
    $("checkDuration").textContent = result.mode === "pro" && result.previousMonths > 0
      ? `Délku současného poměru a návaznost předchozích ${numberFormatter.format(result.previousMonths)} měsíců.`
      : "Délku pracovního poměru a případnou návaznost.";

    $("heroType").textContent = type;
    $("heroAmount").textContent = money(result.totalAmount);
    $("heroTitle").textContent = result.totalMultiplier > 0 ? `${multiple(result.totalMultiplier)} průměrného výdělku` : "zákonný násobek 0×";
    $("heroMultiplier").textContent = multiple(result.totalMultiplier);
    $("heroAverage").textContent = money(result.earnings);
    $("heroDuration").textContent = compactDuration(result.duration);
    $("heroBar").style.width = `${barWidth}%`;

    $("readingTitle").textContent = result.totalAmount > 0
      ? `${type} vychází na ${multiple(result.totalMultiplier)} průměrného výdělku.`
      : "Pro zadaný scénář nevychází zákonná částka.";
    $("readingText").textContent = result.totalAmount > 0
      ? `Při základu ${money(result.earnings)} jde o ${money(result.totalAmount)} před zdaněním. ${status.text}`
      : status.text;
    $("decisionType").textContent = result.workTimeAccount ? "§ 67 odst. 1 písm. d)" : config.basis;
    $("decisionMultiplier").textContent = multiple(result.totalMultiplier);
    $("decisionAmount").textContent = money(result.totalAmount);

    const returnToggle = $("proReturnEnabled");
    const accountToggle = $("proWorkTimeAccount");
    const eligibleReturn = result.reason === "organizational" || result.reason === "exposure";
    returnToggle.disabled = result.mode === "pro" && !eligibleReturn;
    $("returnToggle").classList.toggle("is-disabled", returnToggle.disabled);
    $("returnEligibilityNote").textContent = eligibleReturn
      ? "Model je dostupný pro odstupné podle § 67; zákon stanoví poměrnou část podle kalendářních dnů, proto je výsledek níže jen orientační."
      : result.reason === "workHealth"
        ? "Jednorázová náhrada podle § 271ca není odstupné podle § 67; automatickou vratku podle § 68 proto nepočítáme."
        : "U obecného smluvního plnění nelze vratku odvozovat automaticky z § 68; rozhodují konkrétní dokumenty.";
    if (!eligibleReturn) $("returnAfterField").hidden = true;
    accountToggle.disabled = result.mode === "pro" && result.reason !== "organizational";
    $("accountToggle").classList.toggle("is-disabled", accountToggle.disabled);
    $("repaymentBox").hidden = !(result.mode === "pro" && result.repaymentEligible && result.returnEnabled && result.totalMultiplier > 0);
    if (!$("repaymentBox").hidden) {
      $("resultRepayment").textContent = money(result.repayment);
      $("returnText").textContent = result.repayment > 0
        ? `Při návratu po ${months(result.returnAfter)} zbývá orientačně ${numberFormatter.format(result.repaymentShare * 100)} % odpovídající doby. Skutečnou vratku ověřte podle přesných dat.`
        : "Zadaný návrat nastává až po uplynutí modelované doby; orientační vratka vychází nulová.";
    }

    renderTable(result);
    renderScenarios(result.earnings);
  }

  function completionState() {
    if (mode === "basic") {
      const reason = selected("basicReason");
      const earnings = parseNumber($("basicEarnings").value);
      const duration = selected("basicDuration");
      if (!reason) return { complete: false, next: "1. Vyberte důvod skončení pracovního poměru." };
      if (!(earnings > 0)) return { complete: false, next: "2. Zadejte svůj průměrný měsíční výdělek." };
      if (!duration) return { complete: false, next: "3. Vyberte délku pracovního poměru." };
      return { complete: true, next: "" };
    }
    const reason = $("proReason").value;
    const earnings = parseNumber($("proEarnings").value);
    const currentMonths = parseNumber($("proCurrentMonths").value);
    if (!reason) return { complete: false, next: "Vyberte právní důvod skončení." };
    if (!(earnings > 0)) return { complete: false, next: "Zadejte svůj průměrný měsíční výdělek." };
    if (!(currentMonths > 0)) return { complete: false, next: "Zadejte délku současného pracovního poměru." };
    return { complete: true, next: "" };
  }

  function renderIdle(next) {
    lastResult = null;
    document.body.dataset.mode = mode;
    document.body.dataset.resultState = "idle";
    $("modeStatus").textContent = mode === "pro" ? "Kontrola dokumentů" : "Rychlý výpočet";
    $("heroMode").textContent = mode === "pro" ? "PRO" : "RYCHLE";
    $("heroType").textContent = "Výsledek po vyplnění";
    $("heroAmount").textContent = "Čeká na údaje";
    $("heroTitle").textContent = next || "Důvod → výdělek → délka poměru";
    $("heroAverage").textContent = "—";
    $("heroDuration").textContent = "—";
    $("heroMultiplier").textContent = "—";
    $("heroBar").style.width = "0%";
    $("resultType").textContent = "Čeká na vaše údaje";
    $("resultTotal").textContent = "— Kč";
    $("resultMultiplier").textContent = next || "Vyplňte požadované kroky vlevo";
    $("resultMinimum").textContent = "—";
    $("resultBar").style.width = "0%";
    $("resultAverage").textContent = "—";
    $("resultLegal").textContent = "—";
    $("resultDuration").textContent = "—";
    $("resultExtra").textContent = "—";
    $("resultRunway").textContent = "—";
    $("resultStatus").textContent = next || "Začněte důvodem skončení";
    $("resultStatusText").textContent = "Výsledek počítáme až z vašich údajů — nepoužíváme předvyplněný ukázkový nárok.";
    $("resultTax").textContent = "výsledek se zobrazí po vyplnění";
    $("readingTitle").textContent = "Kontrolní list se doplní po výpočtu.";
    $("readingText").textContent = next || "Vyplňte požadované údaje v kalkulačce.";
    $("decisionType").textContent = "—";
    $("decisionMultiplier").textContent = "—";
    $("decisionAmount").textContent = "—";
    $("summaryTableBody").innerHTML = '<tr><td colspan="3">Výpočet čeká na vaše údaje.</td></tr>';
    renderScenarios(0);
    $("repaymentBox").hidden = true;
  }

  function run() {
    const state = completionState();
    if (!state.complete) {
      renderIdle(state.next);
      return;
    }
    document.body.dataset.resultState = "ready";
    render(calculate(mode === "pro" ? getProInput() : getBasicInput()));
  }

  function setMode(nextMode, options) {
    mode = nextMode === "pro" ? "pro" : "basic";
    const isPro = mode === "pro";
    $("basicPanel").hidden = isPro;
    $("proPanel").hidden = !isPro;
    $("basicTab").classList.toggle("is-active", !isPro);
    $("proTab").classList.toggle("is-active", isPro);
    $("basicTab").setAttribute("aria-selected", String(!isPro));
    $("proTab").setAttribute("aria-selected", String(isPro));
    form.dataset.mode = mode;

    if (isPro && options && options.copyBasic) copyBasicToPro();
    if (options && options.silent) renderIdle(completionState().next);
    else run();
  }

  function copyBasicToPro() {
    const basic = getBasicInput();
    if (basic.earnings > 0) $("proEarnings").value = Math.round(basic.earnings);
    if (basic.reason) $("proReason").value = basic.reason;
    if (basic.duration) $("proCurrentMonths").value = basic.duration === "under1" ? 8 : basic.duration === "1to2" ? 18 : 30;
    $("proPreviousEligible").checked = false;
    $("proPreviousMonths").value = 0;
    $("proWorkTimeAccount").checked = false;
    $("previousMonthsField").hidden = true;
  }

  function resetBasic() {
    $("basicEarnings").value = "";
    form.querySelectorAll('input[name="basicReason"],input[name="basicDuration"]').forEach((input) => { input.checked = false; });
    run();
  }

  function resetPro() {
    $("proEarnings").value = "";
    $("proReason").value = "";
    $("proCurrentMonths").value = "";
    $("proPreviousEligible").checked = false;
    $("proPreviousMonths").value = "0";
    $("proWorkTimeAccount").checked = false;
    $("proExtraMultiplier").value = "0";
    $("proMonthlyCosts").value = "30000";
    $("proReturnEnabled").checked = false;
    $("proReturnAfter").value = "1";
    $("previousMonthsField").hidden = true;
    $("returnAfterField").hidden = true;
    run();
  }

  function resultText(result) {
    return [
      "Kalkulačka odstupného 2026 – RychléVýpočty.cz",
      `Typ: ${resultType(result)}`,
      `Průměrný výdělek: ${money(result.earnings)}`,
      `Zákonný násobek: ${multiple(result.statutoryMultiplier)}`,
      `Navýšení: ${multiple(result.extraMultiplier)}`,
      `Celkem: ${money(result.totalAmount)}`,
      result.runway === null ? null : `Hrubá finanční rezerva: ${months(result.runway)}`,
      "Výsledek je orientační a nenahrazuje právní ani mzdové posouzení."
    ].filter(Boolean).join("\n");
  }

  async function copyResult() {
    if (!lastResult) return;
    const text = resultText(lastResult);
    try {
      await navigator.clipboard.writeText(text);
      $("copyResult").textContent = "Zkopírováno";
      window.setTimeout(() => { $("copyResult").textContent = "Kopírovat výsledek"; }, 1600);
    } catch (error) {
      const helper = document.createElement("textarea");
      helper.value = text;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  $("basicTab").addEventListener("click", () => setMode("basic"));
  $("proTab").addEventListener("click", () => setMode("pro", { copyBasic: mode === "basic" }));
  form.querySelectorAll("[data-open-pro]").forEach((button) => button.addEventListener("click", () => setMode("pro", { copyBasic: true })));
  $("copyFromBasic").addEventListener("click", () => { copyBasicToPro(); run(); });
  $("resetBasic").addEventListener("click", resetBasic);
  $("resetPro").addEventListener("click", resetPro);

  $("proPreviousEligible").addEventListener("change", () => {
    $("previousMonthsField").hidden = !$("proPreviousEligible").checked;
    run();
  });
  $("proReturnEnabled").addEventListener("change", () => {
    $("returnAfterField").hidden = !$("proReturnEnabled").checked;
    run();
  });

  form.querySelectorAll("input,select").forEach((control) => {
    control.addEventListener("input", run);
    control.addEventListener("change", run);
  });

  $("copyResult").addEventListener("click", copyResult);
  $("printResult").addEventListener("click", () => window.print());

  setMode("basic", { silent: true });
})();
