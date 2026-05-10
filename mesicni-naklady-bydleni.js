(function () {
  const $ = (id) => document.getElementById(id);
  const form = $("housingForm");
  if (!form) return;

  const format = (value, digits = 0) =>
    new Intl.NumberFormat("cs-CZ", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Number.isFinite(value) ? value : 0);

  const money = (value) => `${format(value)} Kč`;
  const percent = (value) => `${format(value, 1)} %`;
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const num = (id) => Math.max(0, Number($(id)?.value) || 0);

  const scenarios = {
    "rent-flat": {
      housingType: "rent",
      primaryCost: 18000,
      electricity: 1800,
      gas: 900,
      water: 900,
      heating: 1500,
      services: 2200,
      internet: 700,
      insurance: 300,
      repairReserve: 1500,
      parking: 0,
      other: 500,
      people: 2,
      area: 65,
      netIncome: 55000,
    },
    "own-flat": {
      housingType: "own",
      primaryCost: 24500,
      electricity: 2100,
      gas: 700,
      water: 1100,
      heating: 1900,
      services: 3500,
      internet: 700,
      insurance: 450,
      repairReserve: 2500,
      parking: 1200,
      other: 600,
      people: 2,
      area: 72,
      netIncome: 78000,
    },
    "family-house": {
      housingType: "own",
      primaryCost: 31000,
      electricity: 3200,
      gas: 2400,
      water: 1300,
      heating: 3200,
      services: 900,
      internet: 800,
      insurance: 700,
      repairReserve: 4500,
      parking: 0,
      other: 900,
      people: 4,
      area: 145,
      netIncome: 98000,
    },
  };

  function setValues(values) {
    Object.entries(values).forEach(([id, value]) => {
      const el = $(id);
      if (el) el.value = value;
    });
  }

  function values() {
    return {
      housingType: $("housingType").value,
      primaryCost: num("primaryCost"),
      electricity: num("electricity"),
      gas: num("gas"),
      water: num("water"),
      heating: num("heating"),
      services: num("services"),
      internet: num("internet"),
      insurance: num("insurance"),
      repairReserve: num("repairReserve"),
      parking: num("parking"),
      other: num("other"),
      people: Math.max(1, num("people")),
      area: Math.max(1, num("area")),
      netIncome: num("netIncome"),
    };
  }

  function calculate(v) {
    const utilitiesTotal = v.electricity + v.gas + v.water + v.heating;
    const fixedReserveTotal =
      v.services + v.internet + v.insurance + v.repairReserve + v.parking + v.other;
    const monthlyTotal = v.primaryCost + utilitiesTotal + fixedReserveTotal;
    const yearlyTotal = monthlyTotal * 12;
    const perPerson = monthlyTotal / v.people;
    const perSquareMeter = monthlyTotal / v.area;
    const incomeShare = v.netIncome > 0 ? (monthlyTotal / v.netIncome) * 100 : 0;
    const items = [
      { name: v.housingType === "rent" ? "Nájemné" : "Splátka hypotéky", amount: v.primaryCost },
      { name: "Elektřina", amount: v.electricity },
      { name: "Plyn", amount: v.gas },
      { name: "Voda", amount: v.water },
      { name: "Vytápění", amount: v.heating },
      { name: "Služby domu", amount: v.services },
      { name: "Internet a TV", amount: v.internet },
      { name: "Pojištění", amount: v.insurance },
      { name: "Rezerva na opravy", amount: v.repairReserve },
      { name: "Parkování", amount: v.parking },
      { name: "Ostatní", amount: v.other },
    ].filter((item) => item.amount > 0);

    return {
      utilitiesTotal,
      fixedReserveTotal,
      monthlyTotal,
      yearlyTotal,
      perPerson,
      perSquareMeter,
      incomeShare,
      items,
    };
  }

  function decision(r, v) {
    if (v.netIncome <= 0) {
      return {
        tone: "watch",
        status: "Doplňte příjem",
        badge: "Podíl bydlení na příjmu: nezadáno",
        headline: "Zatím jde jen o součet nákladů.",
        text:
          "Pro rozhodnutí je důležitý hlavně poměr k čistému příjmu domácnosti. Jakmile příjem doplníte, kalkulačka ukáže, jestli je bydlení bezpečné, hraniční nebo napjaté.",
        next:
          "Jako další krok zadejte čistý příjem a potom ověřte finanční rezervu domácnosti.",
      };
    }

    if (r.incomeShare <= 33) {
      return {
        tone: "safe",
        status: "Zdravé zatížení",
        badge: `Podíl bydlení na příjmu: ${percent(r.incomeShare)}`,
        headline: "Bydlení je podle zadaných hodnot v rozumném poměru k příjmu.",
        text:
          "Měsíční náklady by neměly samy o sobě dusit rozpočet. Přesto má smysl držet rezervu na energie, opravy a jednorázové doplatky.",
        next:
          "Pokračujte kontrolou finanční rezervy a celkového rozpočtu domácnosti.",
      };
    }

    if (r.incomeShare <= 40) {
      return {
        tone: "watch",
        status: "Hraniční rozpočet",
        badge: `Podíl bydlení na příjmu: ${percent(r.incomeShare)}`,
        headline: "Bydlení už zabírá citelnou část rozpočtu.",
        text:
          "Scénář může fungovat, pokud máte stabilní příjem a po zaplacení bydlení zůstává rezerva na běžné výdaje i nečekané situace.",
        next:
          "Zkontrolujte rozpočet domácnosti a zjistěte, kolik měsíců výdajů pokryje finanční rezerva.",
      };
    }

    return {
      tone: "risk",
      status: "Napjaté bydlení",
      badge: `Podíl bydlení na příjmu: ${percent(r.incomeShare)}`,
      headline: "Bydlení je podle zadaných hodnot rizikově vysoké.",
      text:
        "Rozpočet může být citlivý na výpadek příjmu, růst energií nebo mimořádnou opravu. Samotná hlavní platba nevystihuje celý tlak na domácnost.",
      next:
        "Zvažte levnější variantu, silnější rezervu nebo porovnání nájmu a hypotéky před finálním rozhodnutím.",
    };
  }

  function renderBreakdown(items, total) {
    $("breakdownBody").innerHTML = items
      .map((item) => {
        const share = total > 0 ? (item.amount / total) * 100 : 0;
        return `<tr><td>${item.name}</td><td>${money(item.amount)}</td><td>${money(
          item.amount * 12
        )}</td><td>${percent(share)}</td></tr>`;
      })
      .join("");
  }

  function renderHero(r, v, decisionData) {
    const primaryShare = r.monthlyTotal > 0 ? (v.primaryCost / r.monthlyTotal) * 100 : 0;
    const utilityShare = r.monthlyTotal > 0 ? (r.utilitiesTotal / r.monthlyTotal) * 100 : 0;
    const hero = document.querySelector(".hero-visual");
    if (hero) hero.dataset.tone = decisionData.tone;
    if ($("heroHousingTotal")) $("heroHousingTotal").textContent = money(r.monthlyTotal);
    if ($("heroHousingPerson")) $("heroHousingPerson").textContent = money(r.perPerson);
    if ($("heroHousingMeter")) $("heroHousingMeter").textContent = `${format(r.perSquareMeter)} Kč`;
    if ($("heroHousingShare")) {
      $("heroHousingShare").textContent = v.netIncome > 0 ? percent(r.incomeShare) : "nezadáno";
    }
    if ($("heroPrimaryBar")) $("heroPrimaryBar").style.width = `${clamp(primaryShare, 6, 100)}%`;
    if ($("heroUtilityBar")) $("heroUtilityBar").style.width = `${clamp(utilityShare, 6, 100)}%`;
    if ($("heroPrimaryShare")) $("heroPrimaryShare").textContent = `${format(primaryShare)} %`;
    if ($("heroUtilityShare")) $("heroUtilityShare").textContent = `${format(utilityShare)} %`;
    if ($("heroHousingStatus")) $("heroHousingStatus").textContent = decisionData.status;
  }

  function render() {
    const v = values();
    const result = calculate(v);
    const decisionData = decision(result, v);

    $("monthlyTotal").textContent = money(result.monthlyTotal);
    $("yearlyTotal").textContent = money(result.yearlyTotal);
    $("perPerson").textContent = money(result.perPerson);
    $("perSquareMeter").textContent = `${format(result.perSquareMeter)} Kč/m²`;
    $("summaryPrimary").textContent = money(v.primaryCost);
    $("summaryUtilities").textContent = money(result.utilitiesTotal);
    $("summaryFixed").textContent = money(result.fixedReserveTotal);
    $("summaryPeople").textContent = format(v.people);
    $("summaryArea").textContent = `${format(v.area)} m²`;
    $("burdenBadge").textContent = decisionData.badge;
    $("decisionHeadline").textContent = decisionData.headline;
    $("decisionText").textContent = decisionData.text;
    $("nextStepText").textContent = decisionData.next;

    const resultPanel = $("vysledek");
    if (resultPanel) resultPanel.dataset.tone = decisionData.tone;

    renderBreakdown(result.items, result.monthlyTotal);
    renderHero(result, v, decisionData);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });

  Object.keys(scenarios["rent-flat"]).forEach((id) => {
    const el = $(id);
    if (!el) return;
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });

  document.querySelectorAll(".scenario-chip[data-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      setValues(scenarios[button.dataset.scenario]);
      document.querySelectorAll(".scenario-chip[data-scenario]").forEach((item) => {
        item.setAttribute("aria-pressed", item === button ? "true" : "false");
      });
      render();
    });
  });

  $("resetBtn")?.addEventListener("click", () => {
    setValues(scenarios["rent-flat"]);
    document.querySelectorAll(".scenario-chip[data-scenario]").forEach((button) => {
      button.setAttribute("aria-pressed", button.dataset.scenario === "rent-flat" ? "true" : "false");
    });
    render();
  });

  render();
})();
