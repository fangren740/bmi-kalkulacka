(function () {
  const $ = (id) => document.getElementById(id);
  const form = $("ledForm");
  if (!form) return;

  const fmt = (value, digits = 0) =>
    new Intl.NumberFormat("cs-CZ", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(Number.isFinite(value) ? value : 0);
  const czk = (value) => `${fmt(value)} Kč`;
  const kwh = (value) => `${fmt(value)} kWh`;
  const months = (value) => (Number.isFinite(value) ? `${fmt(value, 1)} měs.` : "nelze určit");
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const presets = {
    classic: {
      oldPower: 60,
      ledPower: 8,
      bulbCount: 8,
      hoursPerDay: 4,
      daysPerYear: 365,
      pricePerKwh: 6.5,
      ledPrice: 129,
      lightingType: "classic",
    },
    halogen: {
      oldPower: 42,
      ledPower: 6,
      bulbCount: 10,
      hoursPerDay: 5,
      daysPerYear: 365,
      pricePerKwh: 6.5,
      ledPrice: 119,
      lightingType: "halogen",
    },
    many: {
      oldPower: 50,
      ledPower: 7,
      bulbCount: 16,
      hoursPerDay: 6,
      daysPerYear: 300,
      pricePerKwh: 6.5,
      ledPrice: 129,
      lightingType: "custom",
    },
  };

  function num(id) {
    return Math.max(0, Number($(id)?.value) || 0);
  }

  function values() {
    return {
      oldPower: num("oldPower"),
      ledPower: num("ledPower"),
      bulbCount: Math.max(1, num("bulbCount")),
      hoursPerDay: num("hoursPerDay"),
      daysPerYear: num("daysPerYear"),
      pricePerKwh: num("pricePerKwh"),
      ledPrice: num("ledPrice"),
      lightingType: $("lightingType").value,
    };
  }

  function calculate(v) {
    const hoursYear = v.hoursPerDay * v.daysPerYear;
    const oldYearlyConsumption = (v.oldPower * v.bulbCount * hoursYear) / 1000;
    const ledYearlyConsumption = (v.ledPower * v.bulbCount * hoursYear) / 1000;
    const oldYearlyCost = oldYearlyConsumption * v.pricePerKwh;
    const ledYearlyCost = ledYearlyConsumption * v.pricePerKwh;
    const yearlySavingKwh = Math.max(0, oldYearlyConsumption - ledYearlyConsumption);
    const yearlySavingMoney = Math.max(0, oldYearlyCost - ledYearlyCost);
    const monthlySavingMoney = yearlySavingMoney / 12;
    const totalLedInvestment = v.ledPrice * v.bulbCount;
    const paybackMonths =
      monthlySavingMoney > 0 ? totalLedInvestment / monthlySavingMoney : Infinity;
    const savingPercent =
      oldYearlyConsumption > 0 ? (yearlySavingKwh / oldYearlyConsumption) * 100 : 0;
    return {
      oldYearlyConsumption,
      ledYearlyConsumption,
      oldYearlyCost,
      ledYearlyCost,
      yearlySavingKwh,
      yearlySavingMoney,
      monthlySavingMoney,
      totalLedInvestment,
      paybackMonths,
      savingPercent,
    };
  }

  function note(result, v) {
    if (result.yearlySavingMoney <= 0) {
      return {
        label: "Úspora nevychází",
        text:
          "Nový zdroj podle zadání nesnižuje spotřebu. Zkontrolujte příkon LED náhrady a původního světla.",
        next:
          "Porovnejte konkrétní lumeny a příkon. U málo používaných světel může rozhodovat spíš komfort než návratnost.",
        speed: "nevychází",
      };
    }
    if (result.paybackMonths <= 12) {
      return {
        label: "Rychlá návratnost",
        text:
          "Výměna za LED podle zadaných hodnot dává silný ekonomický smysl, hlavně pokud světla opravdu svítí pravidelně.",
        next:
          "Jako další krok zkontrolujte další dlouho běžící spotřebiče a promítněte úsporu do rozpočtu domácnosti.",
        speed: "rychlá",
      };
    }
    if (result.paybackMonths <= 36) {
      return {
        label: "Rozumná návratnost",
        text:
          "Úspora je zajímavá, ale návratnost už závisí na reálné době svícení a ceně LED. Nejvíc se vyplatí měnit světla s dlouhým provozem.",
        next:
          "Začněte místnostmi, kde se svítí nejčastěji. U zbytku domácnosti porovnejte i kvalitu světla a životnost.",
        speed: "rozumná",
      };
    }
    return {
      label: "Pomalejší návratnost",
      text:
        "Ekonomický efekt je slabší. Důvodem může být krátká doba svícení, nízký rozdíl příkonu nebo vyšší pořizovací cena LED.",
      next:
        "Výměna může dávat smysl kvůli životnosti nebo kvalitě světla, ale čistě finančně má přednost jiné místo v domácnosti.",
      speed: "pomalejší",
    };
  }

  function renderHero(result, v, decision) {
    $("heroLedSaving").textContent = `${czk(result.yearlySavingMoney)}/rok`;
    $("heroLedKwh").textContent = kwh(result.yearlySavingKwh);
    $("heroLedPayback").textContent = months(result.paybackMonths);
    $("heroLedCount").textContent = `${fmt(v.bulbCount)} ks`;
    $("heroLedPercent").textContent = `${fmt(result.savingPercent)} %`;
    $("heroLedSpeed").textContent = decision.speed;
    $("heroLedPercentBar").style.width = `${clamp(result.savingPercent, 8, 100)}%`;
    const paybackScore = Number.isFinite(result.paybackMonths)
      ? clamp(100 - result.paybackMonths * 2.5, 8, 100)
      : 8;
    $("heroLedPaybackBar").style.width = `${paybackScore}%`;
  }

  function ensureNextActions() {
    if (document.querySelector(".rv-led-page .rv-next-actions")) return;
    const box = document.createElement("div");
    box.className = "rv-next-actions";
    box.setAttribute("aria-label", "Co spočítat dál");
    box.innerHTML =
      '<strong>Co spočítat dál</strong><a href="spotreba-elektriny-kalkulacka.html">Zkontrolovat další spotřebiče</a><a href="kalkulacka-rozpoctu-domacnosti.html">Promítnout úsporu do rozpočtu</a><a href="mesicni-naklady-na-bydleni-kalkulacka.html">Započítat energii do bydlení</a>';
    document.querySelector("#vysledek .rv-result-note")?.after(box);
  }

  function render() {
    const v = values();
    if (v.lightingType === "classic") {
      v.oldPower = 60;
      v.ledPower = 8;
      $("oldPower").value = 60;
      $("ledPower").value = 8;
    } else if (v.lightingType === "halogen") {
      v.oldPower = 42;
      v.ledPower = 6;
      $("oldPower").value = 42;
      $("ledPower").value = 6;
    }
    if (v.oldPower <= 0 || v.ledPower <= 0 || v.bulbCount <= 0) return;

    const result = calculate(v);
    const decision = note(result, v);

    $("yearlySavingMoney").textContent = czk(result.yearlySavingMoney);
    $("yearlySavingKwh").textContent = kwh(result.yearlySavingKwh);
    $("monthlySavingMoney").textContent = czk(result.monthlySavingMoney);
    $("paybackResult").textContent = months(result.paybackMonths);
    $("savingPercent").textContent = `${fmt(result.savingPercent)} %`;
    $("oldYearlyConsumption").textContent = kwh(result.oldYearlyConsumption);
    $("ledYearlyConsumption").textContent = kwh(result.ledYearlyConsumption);
    $("oldYearlyCost").textContent = czk(result.oldYearlyCost);
    $("ledYearlyCost").textContent = czk(result.ledYearlyCost);
    $("totalLedInvestment").textContent = czk(result.totalLedInvestment);
    $("statusBadge").textContent = decision.label;
    $("interpretationNote").textContent = decision.text;
    $("decisionSummary").textContent =
      `${decision.next} Při zadaných hodnotách ušetříte přibližně ${kwh(
        result.yearlySavingKwh
      )} a ${czk(result.yearlySavingMoney)} ročně.`;
    $("summaryTableBody").innerHTML = [
      ["Původní osvětlení", kwh(result.oldYearlyConsumption), czk(result.oldYearlyCost)],
      ["LED osvětlení", kwh(result.ledYearlyConsumption), czk(result.ledYearlyCost)],
      ["Úspora", kwh(result.yearlySavingKwh), czk(result.yearlySavingMoney)],
      ["Investice", `${fmt(v.bulbCount)} ks`, czk(result.totalLedInvestment)],
    ]
      .map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`)
      .join("");

    renderHero(result, v, decision);
    ensureNextActions();
  }

  function applyPreset(id) {
    const preset = presets[id];
    if (!preset) return;
    Object.entries(preset).forEach(([key, value]) => {
      $(key).value = value;
    });
    document.querySelectorAll("[data-preset]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.preset === id));
    });
    render();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  form.querySelectorAll("input,select").forEach((element) => {
    ["input", "change"].forEach((eventName) => {
      element.addEventListener(eventName, () => {
        if (["oldPower", "ledPower"].includes(element.id)) $("lightingType").value = "custom";
        render();
      });
    });
  });
  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => applyPreset(button.dataset.preset));
  });
  $("resetBtn").addEventListener("click", () => applyPreset("classic"));
  render();
})();
