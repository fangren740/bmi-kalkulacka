(function () {
  const form = document.getElementById("electricityForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const number = (value, digits = 1) => new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const money = (value) => new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
  const read = (id) => Number($(id)?.value) || 0;

  function renderHero() {
    const visual = document.querySelector(".hero-visual");
    if (!visual) return;
    const power = Math.max(0, read("devicePower"));
    const hours = Math.max(0, read("hoursPerDay"));
    const days = Math.max(0, read("daysUsed"));
    const price = Math.max(0, read("pricePerKwh"));
    const standby = Math.max(0, read("standbyPower"));
    const daily = power / 1000 * hours + standby / 1000 * Math.max(0, 24 - hours);
    const period = daily * days;
    const monthly = daily * 30;
    const yearly = daily * 365;
    const monthlyCost = monthly * price;
    const yearlyCost = yearly * price;

    const numberEl = visual.querySelector(".rv-hero-number");
    if (numberEl) numberEl.textContent = `${money(monthlyCost)}/měs.`;
    const metrics = visual.querySelectorAll(".rv-hero-metrics b");
    if (metrics[0]) metrics[0].textContent = `${number(monthly, 1)} kWh`;
    if (metrics[1]) metrics[1].textContent = `${number(price, 2)} Kč`;
    if (metrics[2]) metrics[2].textContent = money(yearlyCost);
    const bars = visual.querySelectorAll(".energy-meter b");
    const labels = visual.querySelectorAll(".energy-meter strong");
    const usagePct = Math.max(6, Math.min(100, hours / 24 * 100));
    const impactPct = Math.max(6, Math.min(100, monthlyCost / 1200 * 100));
    if (bars[0]) bars[0].style.width = `${usagePct}%`;
    if (bars[1]) bars[1].style.width = `${impactPct}%`;
    if (labels[0]) labels[0].textContent = `${number(hours, 1)} h/den`;
    if (labels[1]) labels[1].textContent = monthlyCost > 1000 ? "vysoký" : monthlyCost > 250 ? "střední" : "nízký";
    const card = visual.querySelector(".energy-mini-card strong");
    if (card) card.textContent = `Za ${number(days, 0)} dní spotřebič odebere asi ${number(period, 1)} kWh a stojí přibližně ${money(period * price)}.`;
  }

  ["devicePower", "hoursPerDay", "daysUsed", "pricePerKwh", "standbyPower"].forEach((id) => {
    const input = $(id);
    if (input) {
      input.addEventListener("input", renderHero);
      input.addEventListener("change", renderHero);
    }
  });
  form.addEventListener("click", (event) => {
    if (event.target && event.target.matches("[data-preset]")) {
      window.setTimeout(renderHero, 0);
    }
  });
  $("resetBtn")?.addEventListener("click", () => window.setTimeout(renderHero, 0));
  renderHero();
})();
