
(function(){
  const $ = (id) => document.getElementById(id);
  const fmtCurrency = (value, whole = false) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0, maximumFractionDigits: whole ? 0 : 2 }).format(Number.isFinite(value) ? value : 0);
  const fmtNumber = (value, digits = 2) => new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };

  function getValues() {
    return {
      consumption: Number($('consumption').value),
      fuelPrice: Number($('fuelPrice').value),
      tripDistance: Number($('tripDistance').value),
      monthlyDistance: Number($('monthlyDistance').value),
      extraCostPerKm: Number($('extraCostPerKm').value),
      roundWhole: $('roundMode').value === 'whole'
    };
  }
  function calculate(values) {
    const fuelCostPerKm = values.consumption / 100 * values.fuelPrice;
    const totalCostPerKm = fuelCostPerKm + values.extraCostPerKm;
    const tripFuelUsed = values.tripDistance * values.consumption / 100;
    const tripFuelCost = tripFuelUsed * values.fuelPrice;
    const tripExtraCost = values.tripDistance * values.extraCostPerKm;
    const tripCost = tripFuelCost + tripExtraCost;
    const monthlyCost = values.monthlyDistance * totalCostPerKm;
    const fuelShare = totalCostPerKm > 0 ? fuelCostPerKm / totalCostPerKm * 100 : 0;
    return { fuelCostPerKm, totalCostPerKm, tripFuelUsed, tripFuelCost, tripExtraCost, tripCost, monthlyCost, fuelShare };
  }
  function decision(values, result) {
    if (values.extraCostPerKm === 0) return ['Jen palivový pohled', 'Výsledek počítá pouze palivo. Pro sdílení nákladů na jednu cestu to může stačit, pro dlouhodobý provoz je vhodné přidat i servis a opotřebení.', 'Doplňte provozní náklad'];
    if (result.fuelShare < 45) return ['Provoz výrazně zvedá cenu', 'Větší část ceny za kilometr tvoří servis, opotřebení nebo jiné náklady. To je důležité při vyúčtování cest i porovnání aut.', 'Zkontrolujte položky'];
    return ['Běžný výsledek', 'Cena za kilometr kombinuje palivo a další zadané náklady. Použijte ji pro férovější porovnání než samotnou spotřebu.', 'Porovnejte trasu'];
  }
  function renderHero(values, result) {
    const visual = document.querySelector('.hero-visual');
    if (!visual) return;
    const number = visual.querySelector('.rv-hero-number');
    if (number) number.textContent = `${fmtCurrency(result.totalCostPerKm, values.roundWhole)}/km`;
    const metrics = visual.querySelectorAll('.rv-hero-metrics b');
    if (metrics[0]) metrics[0].textContent = fmtCurrency(result.fuelCostPerKm, values.roundWhole);
    if (metrics[1]) metrics[1].textContent = fmtCurrency(values.extraCostPerKm, values.roundWhole);
    if (metrics[2]) metrics[2].textContent = fmtCurrency(result.tripCost, values.roundWhole);
    const bars = visual.querySelectorAll('.rv-fuel-meter b');
    const labels = visual.querySelectorAll('.rv-fuel-meter strong');
    const fuelShare = Math.max(0, Math.min(100, result.fuelShare));
    const operatingShare = Math.max(0, Math.min(100, 100 - fuelShare));
    if (bars[0]) bars[0].style.width = `${Math.max(6, fuelShare)}%`;
    if (bars[1]) bars[1].style.width = `${Math.max(6, operatingShare)}%`;
    if (labels[0]) labels[0].textContent = `${fmtNumber(fuelShare, 0)} %`;
    if (labels[1]) labels[1].textContent = `${fmtNumber(operatingShare, 0)} %`;
    const floating = visual.querySelector('.rv-floating-card strong');
    if (floating) floating.textContent = `Trasa ${fmtNumber(values.tripDistance, 0)} km vychází na ${fmtCurrency(result.tripCost, values.roundWhole)}.`;
  }
  function renderRows(values, result) {
    const body = $('breakdownBody');
    body.innerHTML = [
      ['Spotřeba', `${fmtNumber(values.consumption, 2)} l / 100 km`, 'Zadaný průměr'],
      ['Cena paliva', fmtCurrency(values.fuelPrice, values.roundWhole), 'Cena za litr'],
      ['Palivo za km', fmtCurrency(result.fuelCostPerKm, values.roundWhole), 'Spotřeba × cena paliva'],
      ['Další náklad', fmtCurrency(values.extraCostPerKm, values.roundWhole), 'Servis, opotřebení nebo interní náklad'],
      ['Celkem za km', fmtCurrency(result.totalCostPerKm, values.roundWhole), 'Palivo + další náklad'],
      ['Cena trasy', fmtCurrency(result.tripCost, values.roundWhole), 'Délka trasy × cena za km'],
      ['Měsíčně', fmtCurrency(result.monthlyCost, values.roundWhole), 'Měsíční nájezd × cena za km']
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('');
  }
  function runCalculation() {
    const values = getValues();
    if (!values.consumption || values.consumption <= 0 || !values.fuelPrice || values.fuelPrice <= 0 || !values.tripDistance || values.tripDistance <= 0) {
      setText('costPerKm', '0 Kč'); setText('resultNote', 'Zadejte platnou spotřebu, cenu paliva a délku trasy.'); return;
    }
    const result = calculate(values);
    setText('costPerKm', fmtCurrency(result.totalCostPerKm, values.roundWhole));
    setText('fuelCostPerKm', fmtCurrency(result.fuelCostPerKm, values.roundWhole));
    setText('tripCost', fmtCurrency(result.tripCost, values.roundWhole));
    setText('monthlyCost', fmtCurrency(result.monthlyCost, values.roundWhole));
    setText('tripFuelUsed', `${fmtNumber(result.tripFuelUsed, 2)} l`);
    setText('tripFuelCost', fmtCurrency(result.tripFuelCost, values.roundWhole));
    setText('tripExtraCost', fmtCurrency(result.tripExtraCost, values.roundWhole));
    setText('summaryTotalPerKm', fmtCurrency(result.totalCostPerKm, values.roundWhole));
    setText('fuelShare', `${fmtNumber(result.fuelShare, 1)} %`);
    setText('resultNote', 'Cena za kilometr zahrnuje palivo a další zadaný provozní náklad. Výsledek je orientační.');
    const [label, text, action] = decision(values, result);
    setText('statusBadge', label); setText('costStatus', label); setText('costText', text); setText('actionStatus', action);
    setText('decisionSummary', `Trasa ${fmtNumber(values.tripDistance, 0)} km vychází na ${fmtCurrency(result.tripCost, values.roundWhole)}.`);
    setText('nextActionText', 'Pro přesnější dlouhodobý výsledek doplňte servis, pneumatiky a opotřebení podle skutečných výdajů.');
    renderHero(values, result);
    renderRows(values, result);
  }
  function setPreset(name) {
    const presets = {
      standard: { consumption: 6.8, fuelPrice: 38.90, tripDistance: 120, monthlyDistance: 1500, extraCostPerKm: 1.20, roundMode: 'exact' },
      fuelOnly: { consumption: 6.8, fuelPrice: 38.90, tripDistance: 120, monthlyDistance: 1500, extraCostPerKm: 0, roundMode: 'exact' },
      higherRun: { consumption: 7.4, fuelPrice: 38.90, tripDistance: 120, monthlyDistance: 1800, extraCostPerKm: 2.50, roundMode: 'exact' },
      longTrip: { consumption: 6.8, fuelPrice: 38.90, tripDistance: 420, monthlyDistance: 2500, extraCostPerKm: 1.20, roundMode: 'exact' }
    };
    const preset = presets[name] || presets.standard;
    Object.entries(preset).forEach(([key, value]) => { const id = key === 'roundMode' ? 'roundMode' : key; if ($(id)) $(id).value = value; });
    document.querySelectorAll('.scenario-chip').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.preset === name)));
    runCalculation();
  }
  $('costPerKmForm').addEventListener('submit', (event) => { event.preventDefault(); runCalculation(); });
  ['consumption','fuelPrice','tripDistance','monthlyDistance','extraCostPerKm','roundMode'].forEach((id) => { $(id).addEventListener('input', runCalculation); $(id).addEventListener('change', runCalculation); });
  document.querySelectorAll('.scenario-chip').forEach((btn) => btn.addEventListener('click', () => setPreset(btn.dataset.preset)));
  $('resetBtn').addEventListener('click', () => setPreset('standard'));
  runCalculation();
})();
