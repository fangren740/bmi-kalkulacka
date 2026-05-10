(function () {
  const $ = (id) => document.getElementById(id);
  const form = $("solarForm");
  if (!form) return;

  const fmt = (value, digits = 0) => new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const czk = (value) => `${fmt(value)} Kč`;
  const kwh = (value) => `${fmt(value)} kWh`;
  const set = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };

  const fields = ["systemPrice", "subsidy", "systemPower", "yieldPerKwp", "selfConsumption", "electricityPrice", "exportPrice", "annualService", "degradation", "analysisYears"];

  function num(id) {
    return Number($(id).value) || 0;
  }

  function values() {
    return {
      systemPrice: num("systemPrice"),
      subsidy: num("subsidy"),
      systemPower: num("systemPower"),
      yieldPerKwp: num("yieldPerKwp"),
      selfConsumption: num("selfConsumption"),
      electricityPrice: num("electricityPrice"),
      exportPrice: num("exportPrice"),
      annualService: num("annualService"),
      degradation: num("degradation"),
      analysisYears: num("analysisYears"),
    };
  }

  function calc(v) {
    const netInvestment = Math.max(v.systemPrice - v.subsidy, 0);
    const annualProduction = v.systemPower * v.yieldPerKwp;
    const selfUseKwh = annualProduction * (v.selfConsumption / 100);
    const exportKwh = annualProduction - selfUseKwh;
    const selfUseValue = selfUseKwh * v.electricityPrice;
    const exportValue = exportKwh * v.exportPrice;
    const annualBenefit = selfUseValue + exportValue - v.annualService;
    let totalBenefit = 0;
    for (let year = 0; year < v.analysisYears; year += 1) {
      const yearFactor = Math.pow(1 - v.degradation / 100, year);
      const yearProduction = annualProduction * yearFactor;
      const yearSelfUse = yearProduction * (v.selfConsumption / 100);
      const yearExport = yearProduction - yearSelfUse;
      totalBenefit += yearSelfUse * v.electricityPrice + yearExport * v.exportPrice - v.annualService;
    }
    const paybackYears = annualBenefit > 0 ? netInvestment / annualBenefit : Infinity;
    return { netInvestment, annualProduction, selfUseKwh, exportKwh, selfUseValue, exportValue, annualBenefit, paybackYears, totalBenefit };
  }

  function verdict(v, r) {
    if (!Number.isFinite(r.paybackYears) || r.paybackYears > v.analysisYears) {
      return ["Návratnost je delší než zvolený horizont", "Zkuste porovnat vyšší vlastní spotřebu, jinou cenu systému nebo variantu bez drahých doplňků."];
    }
    if (r.paybackYears > 12) {
      return ["Návratnost je delší, ale může dávat smysl", "Ekonomika stojí hlavně na dlouhodobém využití elektřiny a stabilitě budoucích nákladů."];
    }
    return ["Fotovoltaika vychází orientačně rozumně", "Největší vliv má vlastní spotřeba. Pokud ji dokážete zvýšit, návratnost se může dál zkrátit."];
  }

  function renderHero(v, r, years) {
    const visual = document.querySelector(".hero-visual");
    if (!visual) return;
    const number = visual.querySelector(".rv-hero-number");
    if (number) number.textContent = years;
    const metrics = visual.querySelectorAll(".rv-hero-metrics b");
    if (metrics[0]) metrics[0].textContent = czk(r.netInvestment);
    if (metrics[1]) metrics[1].textContent = czk(r.annualBenefit);
    if (metrics[2]) metrics[2].textContent = `${fmt(v.selfConsumption, 0)} %`;
    const flow = visual.querySelectorAll(".solar-flow span");
    if (flow[0]) flow[0].innerHTML = `${fmt(v.systemPower, 1)} kWp<small>výkon</small>`;
    if (flow[1]) flow[1].innerHTML = `${kwh(r.annualProduction)}<small>výroba</small>`;
    const bars = visual.querySelectorAll(".energy-meter b");
    const labels = visual.querySelectorAll(".energy-meter strong");
    const self = Math.max(0, Math.min(100, v.selfConsumption));
    if (bars[0]) bars[0].style.width = `${Math.max(6, self)}%`;
    if (bars[1]) bars[1].style.width = `${Math.max(6, 100 - self)}%`;
    if (labels[0]) labels[0].textContent = `${fmt(self, 0)} %`;
    if (labels[1]) labels[1].textContent = `${fmt(100 - self, 0)} %`;
    const card = visual.querySelector(".energy-mini-card strong");
    if (card) card.textContent = `Čistá investice ${czk(r.netInvestment)}, roční přínos asi ${czk(r.annualBenefit)}.`;
  }

  function render() {
    const v = values();
    if (v.systemPower <= 0 || v.yieldPerKwp <= 0 || v.selfConsumption < 0 || v.selfConsumption > 100) return;
    const r = calc(v);
    const years = Number.isFinite(r.paybackYears) ? `${fmt(r.paybackYears, 1)} let` : "Nedosažitelná";
    const [badge, note] = verdict(v, r);

    set("paybackYears", years);
    set("netInvestment", czk(r.netInvestment));
    set("annualBenefit", czk(r.annualBenefit));
    set("annualProduction", kwh(r.annualProduction));
    set("selfUseKwh", kwh(r.selfUseKwh));
    set("exportKwh", kwh(r.exportKwh));
    set("selfUseValue", czk(r.selfUseValue));
    set("exportValue", czk(r.exportValue));
    set("totalBenefit", czk(r.totalBenefit));
    set("analysisYearsOutput", `${fmt(v.analysisYears)} let`);
    set("statusBadge", badge);
    set("solarVerdict", badge);
    set("decisionSummary", `Čistá investice je ${czk(r.netInvestment)}, roční přínos přibližně ${czk(r.annualBenefit)} a návratnost ${years}.`);
    set("interpretationNote", note);
    renderHero(v, r, years);

    $("summaryTableBody").innerHTML = [
      ["Čistá investice po dotaci", czk(r.netInvestment), "Cena systému snížená o dotaci"],
      ["Roční výroba FVE", kwh(r.annualProduction), "Odhad výroby za první rok"],
      ["Vlastní spotřeba", kwh(r.selfUseKwh), "Energie využitá přímo doma"],
      ["Přetoky do sítě", kwh(r.exportKwh), "Nevyužitá část výroby"],
      ["Roční čistý přínos", czk(r.annualBenefit), "Úspora a přetoky po odečtení servisu"],
      ["Orientační návratnost", years, "Přibližná doba splacení investice"],
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  fields.forEach((id) => {
    const el = $(id);
    el.addEventListener("input", render);
    el.addEventListener("change", render);
  });
  $("resetBtn").addEventListener("click", () => {
    Object.entries({
      systemPrice: 350000,
      subsidy: 120000,
      systemPower: 6,
      yieldPerKwp: 1050,
      selfConsumption: 65,
      electricityPrice: 6.5,
      exportPrice: 2.2,
      annualService: 2500,
      degradation: 0.5,
      analysisYears: 15,
    }).forEach(([id, value]) => {
      $(id).value = value;
    });
    render();
  });
  render();
})();
