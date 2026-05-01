(() => {
  const ids = ["baseAmount", "commissionRate", "fixedCommission", "calculationMode"];
  const $ = (id) => document.getElementById(id);
  const form = $("commissionForm");
  const resetBtn = $("resetBtn");
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0
    }).format(Number.isFinite(value) ? value : 0);
  const pct = (value) =>
    `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(
      Number.isFinite(value) ? value : 0
    )} %`;

  function values() {
    return {
      baseAmount: Number($("baseAmount").value) || 0,
      commissionRate: Number($("commissionRate").value) || 0,
      fixedCommission: Number($("fixedCommission").value) || 0,
      calculationMode: $("calculationMode").value
    };
  }

  function calculate(v) {
    let percentCommission = 0;
    if (v.calculationMode === "fromBase") {
      percentCommission = v.baseAmount * (v.commissionRate / 100);
    } else {
      percentCommission = v.baseAmount * (v.commissionRate / (100 + v.commissionRate));
    }
    const totalCommission = Math.round(percentCommission + v.fixedCommission);
    const roundedPercent = Math.round(percentCommission);
    const afterCommission = Math.round(v.baseAmount - totalCommission);
    const effectiveRate = v.baseAmount > 0 ? (totalCommission / v.baseAmount) * 100 : 0;
    return { percentCommission: roundedPercent, totalCommission, grossAmount: v.baseAmount, afterCommission, effectiveRate };
  }

  function render() {
    const v = values();
    const r = calculate(v);
    $("totalCommissionResult").textContent = money(r.totalCommission);
    $("netAmountResult").textContent = money(r.afterCommission);
    $("percentCommissionResult").textContent = money(r.percentCommission);
    $("effectiveRateResult").textContent = pct(r.effectiveRate);
    $("baseAmountResult").textContent = money(v.baseAmount);
    $("commissionRateResult").textContent = pct(v.commissionRate);
    $("fixedCommissionResult").textContent = money(v.fixedCommission);
    $("grossAmountResult").textContent = money(r.grossAmount);
    $("afterCommissionResult").textContent = money(r.afterCommission);
    $("differenceResult").textContent = money(r.totalCommission);
    $("resultBadge").textContent = r.effectiveRate <= 10 ? "Nižší efektivní provize" : "Vyšší efektivní provize";
    $("decisionHeadline").textContent =
      r.effectiveRate <= 10 ? "Provize je v běžném pásmu" : "Provize tvoří výraznou část částky";
    $("decisionText").textContent = `Celková provize vychází ${money(
      r.totalCommission
    )}. Po odečtení provize zůstává ${money(r.afterCommission)}.`;
    $("nextStepText").textContent =
      "Další krok: porovnejte efektivní sazbu s marží obchodu a ověřte, zda provize nese i náklady na získání zakázky.";
    $("resultNote").textContent = $("decisionText").textContent;
    $("summaryTableBody").innerHTML = [
      ["Základní částka", money(v.baseAmount), "vstup pro výpočet"],
      ["Provizní sazba", pct(v.commissionRate), "procentní složka"],
      ["Procentní provize", money(r.percentCommission), "výpočet podle sazby"],
      ["Pevná provize", money(v.fixedCommission), "volitelná složka"],
      ["Celková provize", money(r.totalCommission), "součet provizí"],
      ["Částka po provizi", money(r.afterCommission), "zůstatek po odečtení"]
    ]
      .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
      .join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  ids.forEach((id) => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });
  resetBtn.addEventListener("click", () => {
    form.reset();
    render();
  });
  render();
})();
