(function () {
  const $ = (id) => document.getElementById(id);
  const cur = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
  const kmc = (value) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0)} Kč/km`;
  const num = (value, digits = 0) => new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const set = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };

  const fields = ["purchasePrice", "residualValue", "yearsUsed", "annualMileage", "downPayment", "calculationMode", "vehicleType", "compareFuelCost"];

  function values() {
    return {
      purchasePrice: Number($("purchasePrice").value),
      residualValue: Number($("residualValue").value),
      yearsUsed: Number($("yearsUsed").value),
      annualMileage: Number($("annualMileage").value),
      downPayment: Number($("downPayment").value),
      calculationMode: $("calculationMode").value,
      vehicleType: $("vehicleType").value,
      compareFuelCost: Number($("compareFuelCost").value),
    };
  }

  function calc(v) {
    const effectivePurchase = v.calculationMode === "extended" ? v.purchasePrice + v.downPayment : v.purchasePrice;
    const totalLoss = effectivePurchase - v.residualValue;
    const totalMileage = v.annualMileage * v.yearsUsed;
    const perYear = totalLoss / v.yearsUsed;
    const perMonth = perYear / 12;
    const perKm = totalLoss / totalMileage;
    const lossShare = totalLoss / effectivePurchase * 100;
    const fullKmCost = perKm + v.compareFuelCost;
    return { effectivePurchase, totalLoss, totalMileage, perYear, perMonth, perKm, lossShare, fullKmCost };
  }

  function note(v, r) {
    const type = v.vehicleType === "city" ? "městském provozu" : v.vehicleType === "long" ? "vyšším dálničním nájezdu" : "kombinovaném provozu";
    if (r.perKm > 3.5) return `Amortizace vychází poměrně vysoko. U auta v ${type} může být ztráta hodnoty zásadní část ceny za kilometr.`;
    if (r.perKm > 1.5) return `Amortizace vychází ve středním pásmu. U auta v ${type} ji dává smysl přičíst k palivu, servisu a pojištění.`;
    return `Amortizace vychází spíše nízko. U auta v ${type} to může znamenat rozumnou cenu, vyšší zůstatkovou hodnotu nebo vyšší nájezd.`;
  }

  function renderHero(v, r) {
    const visual = document.querySelector(".hero-visual");
    if (!visual) return;
    const number = visual.querySelector(".rv-hero-number");
    if (number) number.textContent = kmc(r.perKm);
    const metrics = visual.querySelectorAll(".rv-hero-metrics b");
    if (metrics[0]) metrics[0].textContent = cur(r.totalLoss);
    if (metrics[1]) metrics[1].textContent = cur(r.perMonth);
    if (metrics[2]) metrics[2].textContent = `${num(r.totalMileage)} km`;
    const bars = visual.querySelectorAll(".rv-fuel-meter b");
    const labels = visual.querySelectorAll(".rv-fuel-meter strong");
    const loss = Math.max(0, Math.min(100, r.lossShare));
    const residual = Math.max(0, Math.min(100, 100 - loss));
    if (bars[0]) bars[0].style.width = `${Math.max(6, loss)}%`;
    if (bars[1]) bars[1].style.width = `${Math.max(6, residual)}%`;
    if (labels[0]) labels[0].textContent = `${num(loss, 0)} %`;
    if (labels[1]) labels[1].textContent = `${num(residual, 0)} %`;
    const floating = visual.querySelector(".rv-floating-card strong");
    if (floating) floating.textContent = `Ztráta hodnoty vychází na ${cur(r.totalLoss)} za ${num(v.yearsUsed)} let používání.`;
  }

  function table(r) {
    $("summaryTableBody").innerHTML = [
      ["Celková ztráta hodnoty", cur(r.totalLoss), "Rozdíl mezi pořizovací a prodejní cenou"],
      ["Amortizace za rok", cur(r.perYear), "Průměrná roční ztráta"],
      ["Amortizace za měsíc", cur(r.perMonth), "Průměrná měsíční ztráta"],
      ["Amortizace za kilometr", kmc(r.perKm), "Kolik připadá na 1 km"],
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function run() {
    const v = values();
    if (!v.purchasePrice || !v.yearsUsed || !v.annualMileage || v.residualValue > v.purchasePrice + v.downPayment) {
      set("perKmResult", "0 Kč/km");
      set("interpretationNote", "Zkontrolujte pořizovací cenu, prodejní cenu, dobu používání a roční nájezd.");
      return;
    }
    const r = calc(v);
    set("perKmResult", kmc(r.perKm));
    set("perMonthResult", cur(r.perMonth));
    set("perYearResult", cur(r.perYear));
    set("totalLossResult", cur(r.totalLoss));
    set("totalMileageResult", `${num(r.totalMileage)} km`);
    set("entryCostsResult", cur(v.downPayment));
    set("effectivePurchaseResult", cur(r.effectivePurchase));
    set("lossShareResult", `${num(r.lossShare, 1)} %`);
    set("fuelServiceResult", kmc(v.compareFuelCost));
    set("fullKmCostResult", kmc(r.fullKmCost));
    set("interpretationNote", note(v, r));
    set("statusBadge", r.perKm > 3.5 ? "Vyšší amortizace" : r.perKm > 1.5 ? "Běžná amortizace" : "Nižší amortizace");
    renderHero(v, r);
    table(r);
  }

  $("amortizationForm").addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });
  fields.forEach((id) => {
    $(id).addEventListener("input", run);
    $(id).addEventListener("change", run);
  });
  $("resetBtn").addEventListener("click", () => {
    $("purchasePrice").value = 450000;
    $("residualValue").value = 250000;
    $("yearsUsed").value = 5;
    $("annualMileage").value = 15000;
    $("downPayment").value = 0;
    $("calculationMode").value = "basic";
    $("vehicleType").value = "mixed";
    $("compareFuelCost").value = 3.2;
    run();
  });
  run();
})();
