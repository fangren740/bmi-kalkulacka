(() => {
  const ids = [
    "fixedBusinessCosts",
    "personalExpenses",
    "taxReserve",
    "irregularCosts",
    "monthsCoverage",
    "riskLevel",
    "currentReserve",
    "monthlySaving"
  ];
  const $ = (id) => document.getElementById(id);
  const form = $("reserveForm");
  const resetBtn = $("resetBtn");
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0
    }).format(Number.isFinite(value) ? value : 0);
  const num = (value) =>
    new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(
      Number.isFinite(value) ? value : 0
    );

  function values() {
    return Object.fromEntries(
      ids.map((id) => [id, $(id).tagName === "SELECT" ? Number($(id).value) : Number($(id).value) || 0])
    );
  }

  function render() {
    const v = values();
    const monthlyBase =
      v.fixedBusinessCosts + v.personalExpenses + v.taxReserve + v.irregularCosts;
    const baseReserve = monthlyBase * v.monthsCoverage;
    const recommendedReserve = baseReserve * v.riskLevel;
    const missing = Math.max(0, recommendedReserve - v.currentReserve);
    const months = v.monthlySaving > 0 ? Math.ceil(missing / v.monthlySaving) : 0;
    const coverageNow = monthlyBase > 0 ? v.currentReserve / monthlyBase : 0;

    $("recommendedReserve").textContent = money(recommendedReserve);
    $("baseReserve").textContent = money(baseReserve);
    $("missingReserve").textContent = money(missing);
    $("monthsToBuild").textContent = missing > 0 ? `${months} měsíců` : "rezerva stačí";
    $("reserveBadge").textContent =
      missing <= 0 ? "Rezerva vypadá dostatečně" : "Rezervu je potřeba doplnit";
    $("monthlyBase").textContent = money(monthlyBase);
    $("coverageSummary").textContent = `${num(v.monthsCoverage)} měs.`;
    $("riskSummary").textContent = `${num(v.riskLevel)}x`;
    $("currentReserveSummary").textContent = money(v.currentReserve);
    $("coverageNow").textContent = `${num(coverageNow)} měs.`;
    $("decisionHeadline").textContent =
      missing <= 0 ? "Podnikání má rezervu nad cílem" : "Rezerva je pod doporučeným cílem";
    $("decisionText").textContent = `Doporučená podnikatelská rezerva vychází ${money(
      recommendedReserve
    )}. Aktuální rezerva pokryje přibližně ${num(
      coverageNow
    )} měsíce základních výdajů.`;
    $("nextStepText").textContent =
      missing > 0
        ? `Další krok: nastavte pravidelný převod do rezervy. Při zadaném tempu doplnění potrvá asi ${months} měsíců.`
        : "Další krok: držte rezervu odděleně a přepočítejte ji při růstu nákladů nebo vyšší nejistotě příjmů.";
    $("breakdownBody").innerHTML = [
      ["Fixní náklady podnikání", money(v.fixedBusinessCosts), "provoz"],
      ["Osobní výdaje", money(v.personalExpenses), "živobytí"],
      ["Daňová rezerva", money(v.taxReserve), "povinnosti"],
      ["Nepravidelné náklady", money(v.irregularCosts), "výkyvy"],
      ["Základ za zvolený horizont", money(baseReserve), "horizont"],
      ["Rizikový násobek", `${num(v.riskLevel)}x`, "nejistota"]
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
