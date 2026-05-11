(() => {
  const $ = (id) => document.getElementById(id);
  const form = $("waterForm");
  if (!form) return;

  const ids = [
    "persons",
    "dailyLiters",
    "waterPrice",
    "sewerPrice",
    "monthlyFee",
    "periodMonths",
    "usageProfile",
    "includeSewer",
  ];
  const profileFactor = { economical: 0.8, standard: 1, higher: 1.25, custom: 1 };
  const profileLiters = { economical: 70, standard: 90, higher: 125 };
  const number = (value, digits = 1) =>
    new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(
      Number.isFinite(value) ? value : 0
    );
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", {
      style: "currency",
      currency: "CZK",
      maximumFractionDigits: 0,
    }).format(Number.isFinite(value) ? value : 0);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function value(id) {
    const element = $(id);
    if (!element) return 0;
    return element.tagName === "SELECT"
      ? element.value
      : Number(String(element.value || "").replace(",", ".")) || 0;
  }

  function setText(id, text) {
    const element = $(id);
    if (element) element.textContent = text;
  }

  function setProfile(profile) {
    if (profileLiters[profile]) $("dailyLiters").value = profileLiters[profile];
    $("usageProfile").value = profile;
    document.querySelectorAll("[data-profile]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.profile === profile ? "true" : "false");
    });
  }

  function statusFor(monthlyCost, dailyPerPerson) {
    if (dailyPerPerson >= 120 || monthlyCost > 1600) {
      return {
        label: "Vyšší náklady na vodu",
        text:
          "Spotřeba nebo měsíční náklad už stojí za kontrolu. Podívejte se hlavně na sprchování, protékající toaletu, praní a nastavení záloh.",
        next:
          "Porovnejte výsledek s posledním vyúčtováním a promítněte vodu do celkových nákladů na bydlení.",
      };
    }
    if (dailyPerPerson <= 80 && monthlyCost <= 900) {
      return {
        label: "Úsporný provoz vody",
        text:
          "Spotřeba na osobu působí úsporně. Pokud odpovídá realitě, hlavní riziko bude spíš ve změně cen vodného a stočného než v návycích domácnosti.",
        next:
          "Další krok je zkontrolovat elektřinu, ohřev vody a celkové měsíční náklady domácnosti.",
      };
    }
    return {
      label: "Běžné náklady na vodu",
      text:
        "Výsledek odpovídá běžnému provozu domácnosti. Sledujte hlavně trend spotřeby v čase a rozdíl mezi zálohami a skutečným vyúčtováním.",
      next:
        "Pokračujte kontrolou elektřiny nebo celkových nákladů na bydlení, kde se voda potká s ostatními platbami.",
    };
  }

  function renderHero(data) {
    const variable = data.monthlyWater + data.monthlySewer;
    const waterShare = variable > 0 ? (data.monthlyWater / variable) * 100 : 0;
    const sewerShare = variable > 0 ? (data.monthlySewer / variable) * 100 : 0;
    setText("heroWaterCost", `${money(data.monthlyCost)}/měs.`);
    setText("heroWaterPeople", `${number(data.persons, 0)} osoby`);
    setText("heroWaterM3", `${number(data.monthlyM3)} m³`);
    setText("heroWaterYear", money(data.yearlyCost));
    setText("heroWaterShare", `${number(waterShare, 0)} %`);
    setText("heroSewerShare", `${number(sewerShare, 0)} %`);
    if ($("heroWaterBar")) $("heroWaterBar").style.width = `${clamp(waterShare, 8, 100)}%`;
    if ($("heroSewerBar")) $("heroSewerBar").style.width = `${clamp(sewerShare, 8, 100)}%`;
  }

  function render() {
    const persons = Math.max(1, value("persons"));
    const dailyLiters = Math.max(0, value("dailyLiters"));
    const waterPrice = Math.max(0, value("waterPrice"));
    const sewerPrice = Math.max(0, value("sewerPrice"));
    const monthlyFee = Math.max(0, value("monthlyFee"));
    const months = Math.max(1, value("periodMonths"));
    const factor = profileFactor[value("usageProfile")] || 1;
    const includeSewer = value("includeSewer") !== "no";
    const dailyPerPerson = dailyLiters * factor;
    const dailyM3 = (persons * dailyPerPerson) / 1000;
    const monthlyM3 = dailyM3 * 30;
    const yearlyM3 = dailyM3 * 365;
    const monthlyWater = monthlyM3 * waterPrice;
    const monthlySewer = includeSewer ? monthlyM3 * sewerPrice : 0;
    const monthlyCost = monthlyWater + monthlySewer + monthlyFee;
    const periodM3 = monthlyM3 * months;
    const periodCost = monthlyCost * months;
    const yearlyCost = monthlyCost * 12;
    const status = statusFor(monthlyCost, dailyPerPerson);

    setText("periodCost", money(periodCost));
    setText("monthlyCost", money(monthlyCost));
    setText("yearlyCost", money(yearlyCost));
    setText("periodConsumption", `${number(periodM3)} m³`);
    setText("monthlyConsumption", `${number(monthlyM3)} m³`);
    setText("dailyConsumption", `${number(dailyM3, 2)} m³`);
    setText("dailyPerPerson", `${number(dailyPerPerson, 0)} l/os.`);
    setText("monthlyWaterCost", money(monthlyWater));
    setText("monthlySewerCost", money(monthlySewer));
    setText("monthlyFixedCost", money(monthlyFee));
    setText("statusBadge", status.label);
    setText("costStatus", status.label);
    setText(
      "costStatusText",
      `${status.text} Domácnost spotřebuje přibližně ${number(monthlyM3)} m³ vody měsíčně.`
    );
    setText("decisionSummary", status.next);
    setText(
      "resultNote",
      `Za ${number(months, 0)} měsíců vychází spotřeba asi ${number(
        periodM3
      )} m³ a náklad ${money(periodCost)}.`
    );

    const table = $("summaryTableBody");
    if (table) {
      table.innerHTML = [
        ["Den", `${number(dailyM3, 2)} m³`, money(monthlyCost / 30)],
        ["Měsíc", `${number(monthlyM3)} m³`, money(monthlyCost)],
        [`${number(months, 0)} měsíců`, `${number(periodM3)} m³`, money(periodCost)],
        ["Rok", `${number(yearlyM3)} m³`, money(yearlyCost)],
      ]
        .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
        .join("");
    }

    renderHero({ persons, monthlyM3, monthlyCost, yearlyCost, monthlyWater, monthlySewer });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });

  ids.forEach((id) => {
    const element = $(id);
    if (element) {
      element.addEventListener("input", render);
      element.addEventListener("change", render);
    }
  });

  document.querySelectorAll("[data-profile]").forEach((button) => {
    button.addEventListener("click", () => {
      setProfile(button.dataset.profile);
      render();
    });
  });

  $("resetBtn")?.addEventListener("click", () => {
    form.reset();
    setProfile("standard");
    render();
  });

  render();
})();
