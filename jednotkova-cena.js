(() => {
  const unitGroups = {
    weight: { base: "kg", units: { kg: 1, g: 0.001 } },
    volume: { base: "l", units: { l: 1, ml: 0.001 } },
    length: { base: "m", units: { m: 1, cm: 0.01 } },
    area: { base: "m²", units: { "m²": 1, "cm²": 0.0001 } },
    piece: { base: "ks", units: { ks: 1 } }
  };
  const $ = (id) => document.getElementById(id);
  const form = $("unitPriceForm");
  const money = (value) =>
    new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 2 }).format(
      Number.isFinite(value) ? value : 0
    );
  const pct = (value) =>
    `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 }).format(Number.isFinite(value) ? value : 0)} %`;

  function fillUnits() {
    const group = unitGroups[$("unitType").value];
    ["amountUnitA", "amountUnitB"].forEach((id) => {
      const select = $(id);
      select.innerHTML = Object.keys(group.units).map((unit) => `<option value="${unit}">${unit}</option>`).join("");
    });
  }

  function values() {
    return {
      unitType: $("unitType").value,
      priceA: Number($("priceA").value) || 0,
      amountA: Number($("amountA").value) || 0,
      unitA: $("amountUnitA").value,
      priceB: Number($("priceB").value) || 0,
      amountB: Number($("amountB").value) || 0,
      unitB: $("amountUnitB").value,
      discountB: Number($("discountB").value) || 0
    };
  }

  function render() {
    const v = values();
    const group = unitGroups[v.unitType];
    const amountABase = v.amountA * group.units[v.unitA];
    const amountBBase = v.amountB * group.units[v.unitB];
    const effectivePriceB = v.priceB * (1 - v.discountB / 100);
    const unitPriceA = amountABase > 0 ? v.priceA / amountABase : 0;
    const unitPriceB = amountBBase > 0 ? effectivePriceB / amountBBase : 0;
    const hasB = v.priceB > 0 && v.amountB > 0;
    const difference = hasB ? unitPriceB - unitPriceA : 0;
    const winner = hasB ? (unitPriceA <= unitPriceB ? "A" : "B") : "A";
    const savings = hasB ? Math.abs(difference) : 0;
    const ratio = hasB && Math.min(unitPriceA, unitPriceB) > 0 ? Math.max(unitPriceA, unitPriceB) / Math.min(unitPriceA, unitPriceB) : 1;
    const percentDiff = hasB && Math.max(unitPriceA, unitPriceB) > 0 ? (savings / Math.max(unitPriceA, unitPriceB)) * 100 : 0;
    $("unitPriceA").textContent = `${money(unitPriceA)} / ${group.base}`;
    $("unitPriceB").textContent = hasB ? `${money(unitPriceB)} / ${group.base}` : "—";
    $("differenceValue").textContent = hasB ? `${money(Math.abs(difference))} / ${group.base}` : "—";
    $("winnerOutput").textContent = hasB ? `Výhodnější je ${winner}` : "Jen varianta A";
    $("statusBadge").textContent = hasB ? `Rozdíl ${pct(percentDiff)}` : "Výpočet hotový";
    $("baseUnitOutput").textContent = group.base;
    $("effectivePriceB").textContent = hasB ? money(effectivePriceB) : "—";
    $("savingsOutput").textContent = hasB ? `${money(savings)} / ${group.base}` : "—";
    $("ratioOutput").textContent = hasB ? `${ratio.toFixed(2).replace(".", ",")}×` : "—";
    $("comparisonLabel").textContent = hasB ? `A vs. B` : "A";
    $("resultNote").textContent = hasB
      ? `Varianta ${winner} má nižší jednotkovou cenu. Rozdíl je ${money(savings)} na ${group.base}.`
      : `Jednotková cena varianty A je ${money(unitPriceA)} za ${group.base}.`;
    $("decisionStatus").textContent = percentDiff > 10 ? "Výrazný rozdíl" : "Menší rozdíl";
    $("decisionSummary").textContent = hasB
      ? "U větších nákupů se i malý rozdíl v jednotkové ceně může rychle nasčítat."
      : "Pro porovnání doplňte druhou variantu.";
    $("actionSummary").textContent = "Zkontrolujte také dopravu, expiraci, kvalitu a to, zda větší balení opravdu spotřebujete.";
    $("summaryTableBody").innerHTML = [
      ["Varianta A", `${money(unitPriceA)} / ${group.base}`, `${v.priceA} Kč za ${v.amountA} ${v.unitA}`],
      ["Varianta B", hasB ? `${money(unitPriceB)} / ${group.base}` : "—", hasB ? `${effectivePriceB} Kč za ${v.amountB} ${v.unitB}` : "nezadáno"],
      ["Výhodnější varianta", hasB ? winner : "A", "nižší jednotková cena"],
      ["Rozdíl", hasB ? `${money(savings)} / ${group.base}` : "—", "úspora na základní jednotku"]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  $("unitType").addEventListener("change", () => {
    fillUnits();
    render();
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  ["priceA", "amountA", "amountUnitA", "priceB", "amountB", "amountUnitB", "discountB"].forEach((id) => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });
  $("resetBtn").addEventListener("click", () => {
    form.reset();
    fillUnits();
    render();
  });
  fillUnits();
  render();
})();
