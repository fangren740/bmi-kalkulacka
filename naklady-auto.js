
(function(){
  const $ = (id) => document.getElementById(id);
  const fmtCurrency = (value, digits = 0) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const fmtNumber = (value, digits = 0) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const fmtPercent = (value) => `${fmtNumber(value, 1)} %`;
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const fields = ['annualKm','fuelConsumption','fuelPrice','insuranceMonthly','serviceMonthly','tiresMonthly','parkingMonthly','roadTaxMonthly','carWashMonthly','amortizationMonthly','financingMonthly','otherMonthly','monthlyNetIncome'];
  function getValues() { return Object.fromEntries(fields.map((id) => [id, Number($(id).value)])); }
  function calculate(values) {
    const fuelYearly = values.annualKm / 100 * values.fuelConsumption * values.fuelPrice;
    const fuelMonthly = fuelYearly / 12;
    const fixedMonthly = values.insuranceMonthly + values.serviceMonthly + values.tiresMonthly + values.parkingMonthly + values.roadTaxMonthly + values.carWashMonthly + values.amortizationMonthly + values.financingMonthly + values.otherMonthly;
    const monthlyTotal = fuelMonthly + fixedMonthly;
    const yearlyTotal = monthlyTotal * 12;
    const costPerKm = yearlyTotal / values.annualKm;
    const incomeShare = values.monthlyNetIncome > 0 ? monthlyTotal / values.monthlyNetIncome * 100 : 0;
    const coreCostShare = monthlyTotal > 0 ? (fuelMonthly + values.amortizationMonthly) / monthlyTotal * 100 : 0;
    const items = [
      ['Palivo', fuelMonthly], ['Pojištění', values.insuranceMonthly], ['Servis a údržba', values.serviceMonthly], ['Pneumatiky', values.tiresMonthly], ['Parkování', values.parkingMonthly], ['Dálniční známka a poplatky', values.roadTaxMonthly], ['Mytí a péče', values.carWashMonthly], ['Amortizace', values.amortizationMonthly], ['Leasing / úvěr', values.financingMonthly], ['Ostatní náklady', values.otherMonthly]
    ].filter((item) => item[1] > 0);
    return { fuelYearly, fuelMonthly, fixedMonthly, monthlyTotal, yearlyTotal, costPerKm, incomeShare, coreCostShare, items };
  }
  function decision(result, values) {
    if ((values.monthlyNetIncome > 0 && result.incomeShare <= 15) || (result.costPerKm <= 6 && result.coreCostShare <= 60)) return ['Spíše rozumné', 'Náklady vypadají vzhledem k nájezdu nebo rozpočtu spíše rozumně. Přesto sledujte servis a amortizaci, protože ty bývají nejméně viditelné.', 'Sledujte skutečné výdaje'];
    if ((values.monthlyNetIncome > 0 && result.incomeShare > 25) || result.costPerKm > 9 || (values.financingMonthly > 0 && result.coreCostShare > 65)) return ['Dražší scénář', 'Auto zabírá výraznější část rozpočtu nebo má vyšší cenu za kilometr. Zvažte nájezd, financování, servis a alternativy dopravy.', 'Porovnejte levnější scénář'];
    return ['Na hraně', 'Výsledek není extrémní, ale stojí za kontrolu hlavních položek. Nejvíc obvykle hýbe palivo, amortizace, servis a financování.', 'Zkontrolujte hlavní položky'];
  }
  function renderBreakdown(result) {
    const body = $('breakdownBody');
    body.innerHTML = result.items.map(([name, monthly]) => {
      const yearly = monthly * 12;
      const share = result.yearlyTotal > 0 ? yearly / result.yearlyTotal * 100 : 0;
      return `<tr><td>${name}</td><td>${fmtCurrency(monthly)} měsíčně</td><td>${fmtCurrency(yearly)} ročně, ${fmtPercent(share)}</td></tr>`;
    }).join('');
  }
  function runCalculation() {
    const values = getValues();
    if (!values.annualKm || values.annualKm <= 0 || !values.fuelConsumption || values.fuelConsumption <= 0 || !values.fuelPrice || values.fuelPrice <= 0) {
      setText('monthlyTotal', '0 Kč'); setText('resultNote', 'Zadejte platný roční nájezd, spotřebu a cenu paliva.'); return;
    }
    const result = calculate(values);
    setText('monthlyTotal', fmtCurrency(result.monthlyTotal));
    setText('mainResult', fmtCurrency(result.monthlyTotal));
    setText('yearlyTotal', fmtCurrency(result.yearlyTotal));
    setText('costPerKm', fmtCurrency(result.costPerKm, 2));
    setText('fuelMonthlyResult', fmtCurrency(result.fuelMonthly));
    setText('summaryFuelYearly', fmtCurrency(result.fuelYearly));
    setText('summaryFixedMonthly', fmtCurrency(result.fixedMonthly));
    setText('summaryAnnualKm', `${fmtNumber(values.annualKm)} km`);
    setText('summaryConsumption', `${fmtNumber(values.fuelConsumption, 1)} l / 100 km`);
    setText('summaryCoreCost', fmtCurrency(result.fuelMonthly + values.amortizationMonthly));
    setText('budgetBadge', values.monthlyNetIncome > 0 ? `Podíl auta na příjmu: ${fmtPercent(result.incomeShare)}` : 'Bez porovnání s příjmem');
    setText('resultNote', 'Celkové náklady auta jsou rozpočítané na měsíc, rok a kilometr. Výsledek je orientační.');
    const [label, text, action] = decision(result, values);
    setText('affordabilityStatus', label);
    setText('affordabilityText', text);
    setText('actionStatus', action);
    setText('decisionSummary', `Při nájezdu ${fmtNumber(values.annualKm)} km ročně vychází auto na ${fmtCurrency(result.costPerKm, 2)} za kilometr.`);
    setText('nextActionText', 'Pro přesnější výsledek nahraďte odhady skutečnými průměry ze servisu, pojištění a tankování.');
    renderBreakdown(result);
  }
  function setPreset(name) {
    const presets = {
      standard: { annualKm:15000,fuelConsumption:6.8,fuelPrice:38.5,insuranceMonthly:1500,serviceMonthly:1200,tiresMonthly:400,parkingMonthly:800,roadTaxMonthly:200,carWashMonthly:250,amortizationMonthly:3500,financingMonthly:0,otherMonthly:300,monthlyNetIncome:60000 },
      city: { annualKm:9000,fuelConsumption:6.1,fuelPrice:38.5,insuranceMonthly:1100,serviceMonthly:900,tiresMonthly:300,parkingMonthly:1200,roadTaxMonthly:150,carWashMonthly:180,amortizationMonthly:2200,financingMonthly:0,otherMonthly:200,monthlyNetIncome:50000 },
      family: { annualKm:18000,fuelConsumption:7.4,fuelPrice:38.5,insuranceMonthly:1900,serviceMonthly:1600,tiresMonthly:500,parkingMonthly:900,roadTaxMonthly:200,carWashMonthly:300,amortizationMonthly:4500,financingMonthly:0,otherMonthly:400,monthlyNetIncome:75000 },
      financed: { annualKm:16000,fuelConsumption:7.1,fuelPrice:38.5,insuranceMonthly:1800,serviceMonthly:1400,tiresMonthly:450,parkingMonthly:700,roadTaxMonthly:200,carWashMonthly:250,amortizationMonthly:3000,financingMonthly:6500,otherMonthly:350,monthlyNetIncome:70000 }
    };
    const preset = presets[name] || presets.standard;
    Object.entries(preset).forEach(([id, value]) => { if ($(id)) $(id).value = value; });
    document.querySelectorAll('.scenario-chip').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.preset === name)));
    runCalculation();
  }
  $('carCostForm').addEventListener('submit', (event) => { event.preventDefault(); runCalculation(); });
  fields.forEach((id) => { $(id).addEventListener('input', runCalculation); $(id).addEventListener('change', runCalculation); });
  document.querySelectorAll('.scenario-chip').forEach((btn) => btn.addEventListener('click', () => setPreset(btn.dataset.preset)));
  $('resetBtn').addEventListener('click', () => setPreset('standard'));
  runCalculation();
})();
