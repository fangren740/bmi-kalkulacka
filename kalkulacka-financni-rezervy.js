(function () {
  const $ = (id) => document.getElementById(id);
  const money = (value) => `${Math.round(value).toLocaleString("cs-CZ")} Kč`;
  const monthsText = (value) =>
    `${value.toLocaleString("cs-CZ", { maximumFractionDigits: 1 })} měsíce`;
  const num = (id) => Math.max(0, Number($(id)?.value || 0));

  const scenarios = {
    "stable-couple": {
      monthlyExpenses: 42000,
      currentSavings: 180000,
      adults: 2,
      children: 0,
      incomeStability: "stable",
      housingType: "low",
      carRisk: "no",
      monthlySaving: 6000,
    },
    "family-mortgage": {
      monthlyExpenses: 60000,
      currentSavings: 260000,
      adults: 2,
      children: 1,
      incomeStability: "mixed",
      housingType: "rent",
      carRisk: "yes",
      monthlySaving: 8000,
    },
    "single-income": {
      monthlyExpenses: 48000,
      currentSavings: 120000,
      adults: 1,
      children: 1,
      incomeStability: "mixed",
      housingType: "mortgage",
      carRisk: "yes",
      monthlySaving: 5000,
    },
    osvc: {
      monthlyExpenses: 52000,
      currentSavings: 210000,
      adults: 2,
      children: 0,
      incomeStability: "unstable",
      housingType: "rent",
      carRisk: "no",
      monthlySaving: 12000,
    },
  };

  function setValues(values) {
    Object.entries(values).forEach(([id, value]) => {
      const el = $(id);
      if (el) el.value = value;
    });
  }

  function calculate() {
    const expenses = num("monthlyExpenses");
    const savings = num("currentSavings");
    const adults = Math.max(1, num("adults"));
    const children = num("children");
    const monthlySaving = num("monthlySaving");
    const stability = $("incomeStability").value;
    const housing = $("housingType").value;
    const car = $("carRisk").value;
    const factors = [];

    let base = 3;
    factors.push("Základ výpočtu je 3 měsíce nutných výdajů.");

    if (stability === "mixed") {
      base += 1;
      factors.push("Běžné riziko příjmu přidává 1 měsíc rezervy.");
    }
    if (stability === "unstable") {
      base += 3;
      factors.push("Nestabilní příjem nebo OSVČ přidává 3 měsíce rezervy.");
    }
    if (housing === "rent") {
      base += 0.75;
      factors.push("Nájem nebo běžná hypotéka zvyšuje cíl o 0,75 měsíce.");
    }
    if (housing === "mortgage") {
      base += 1.5;
      factors.push("Vysoké fixní náklady na bydlení přidávají 1,5 měsíce.");
    }
    if (children > 0) {
      const childAdd = Math.min(1.5, children * 0.6);
      base += childAdd;
      factors.push(`Děti přidávají ${childAdd.toLocaleString("cs-CZ")} měsíce rezervy.`);
    }
    if (adults === 1) {
      base += 0.75;
      factors.push("Jeden dospělý v domácnosti znamená menší prostor pro výpadek příjmu.");
    }
    if (car === "yes") {
      base += 0.5;
      factors.push("Auto nutné k práci přidává rezervu na poruchu nebo servis.");
    }

    const recMonths = Math.min(10, Math.max(3, Math.round(base * 10) / 10));
    const minMonths = Math.max(2, Math.round((recMonths - 2) * 10) / 10);
    const comfortMonths = Math.min(12, Math.round((recMonths + 3) * 10) / 10);
    const minimum = expenses * minMonths;
    const recommended = expenses * recMonths;
    const comfort = expenses * comfortMonths;
    const survival = expenses > 0 ? savings / expenses : 0;
    const gap = Math.max(0, recommended - savings);
    const coverage = recommended > 0 ? Math.min(1.25, savings / recommended) : 0;
    const score = Math.max(0, Math.min(100, Math.round((coverage / 1.05) * 100)));

    let tone = "risk";
    let label = "Rezerva je nízká";
    let summary =
      "Aktuální rezerva nepokrývá ani minimální bezpečnostní polštář. Prioritou je omezit rizikové výdaje a začít rezervu pravidelně doplňovat.";
    let nextTitle = "Další krok: dostaňte se nejdřív na minimum.";
    let nextText =
      "Začněte menším automatickým odkladem a řešte výdaje, které nejsou nutné.";

    if (savings >= minimum) {
      tone = "watch";
      label = "Rezerva pokrývá základ";
      summary =
        "Máte základní bezpečnostní polštář. Doporučená rezerva ale ještě poskytne větší klid při výpadku příjmu nebo nečekaných výdajích.";
      nextTitle = "Další krok: dorovnejte doporučenou rezervu.";
    }
    if (savings >= recommended) {
      tone = "safe";
      label = "Rezerva je bezpečná";
      summary =
        "Aktuální úspory pokrývají doporučenou rezervu pro vaši situaci. Teď dává smysl hlídat rozpočet a oddělit rezervu od dlouhodobých investic.";
      nextTitle = "Další krok: držte rezervu odděleně.";
      nextText =
        "Peníze na rezervu nechte likvidní a další přebytky řešte podle dlouhodobých cílů.";
    }
    if (savings >= comfort) {
      tone = "comfort";
      label = "Rezerva je komfortní";
      summary =
        "Rezerva je nad komfortní hranicí. To je silná pozice; další volné peníze už mohou mířit na cíle, bydlení nebo investice podle vašeho plánu.";
      nextTitle = "Další krok: naplánujte přebytky.";
      nextText =
        "Zvažte, kolik ponechat jako rezervu a co už může pracovat dlouhodobě.";
    }

    const monthsToGoal = gap > 0 && monthlySaving > 0 ? Math.ceil(gap / monthlySaving) : 0;
    if (gap > 0 && monthlySaving > 0) {
      nextText = `Při odkládání ${money(monthlySaving)} měsíčně dorovnáte doporučenou rezervu přibližně za ${monthsToGoal} měsíců.`;
    }
    if (gap > 0 && monthlySaving === 0) {
      nextText =
        "Bez pravidelného odkladu se rezerva nedoplní. Nastavte si měsíční částku, která je realistická pro váš rozpočet.";
    }

    $("recommendedReserve").textContent = money(recommended);
    $("minimumReserve").textContent = money(minimum);
    $("comfortReserve").textContent = money(comfort);
    $("survivalMonths").textContent = monthsText(survival);
    $("gapValue").textContent = gap > 0 ? money(gap) : "0 Kč";
    $("scoreLabel").textContent = label;
    $("scoreValue").textContent = `${score} / 100`;
    $("resultSummary").textContent = summary;
    $("nextTitle").textContent = nextTitle;
    $("nextText").textContent = nextText;
    $("levelMin").textContent = monthsText(minMonths);
    $("levelRecommended").textContent = monthsText(recMonths);
    $("levelComfort").textContent = monthsText(comfortMonths);
    $("meterFill").style.width = `${Math.min(100, Math.round(coverage * 100))}%`;
    $("meterText").textContent = `Máte pokryto ${Math.round(
      Math.min(100, coverage * 100)
    )} % doporučené rezervy.`;
    $("savingPlan").textContent = money(monthlySaving);
    $("monthsToGoal").textContent =
      gap <= 0 ? "splněno" : monthlySaving > 0 ? `${monthsToGoal} měsíců` : "není nastaveno";
    $("heroReserve").textContent = money(recommended);
    $("heroReserveStatus").textContent = `${monthsText(recMonths)} výdajů`;
    $("vysledek").dataset.tone = tone;

    const factorList = $("reserveFactorList");
    if (factorList) {
      factorList.innerHTML = factors
        .slice(0, 5)
        .map((factor) => `<li>${factor}</li>`)
        .join("");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("calculateReserve")?.addEventListener("click", calculate);
    document.querySelectorAll("#reserveForm input,#reserveForm select").forEach((el) => {
      el.addEventListener("input", calculate);
      el.addEventListener("change", calculate);
    });
    document.querySelectorAll(".rv-reserve-scenarios button[data-scenario]").forEach((button) => {
      button.addEventListener("click", () => {
        setValues(scenarios[button.dataset.scenario]);
        document.querySelectorAll(".rv-reserve-scenarios button[data-scenario]").forEach((item) => {
          item.setAttribute("aria-pressed", item === button ? "true" : "false");
        });
        calculate();
      });
    });
    calculate();
  });
})();
