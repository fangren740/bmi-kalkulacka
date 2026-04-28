
(function(){
  const $ = (id) => document.getElementById(id);
  let activeTab = 'real';
  const fmtNumber = (value, digits = 2) => new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const fmtCurrency = (value) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
  const fmtLiters = (value) => `${fmtNumber(value, 2)} l`;
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };

  function setTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-button').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.tab === tab)));
    document.querySelectorAll('.tab-panel').forEach((panel) => { panel.hidden = panel.dataset.panel !== tab; });
    tab === 'real' ? calculateReal() : calculateTrip();
  }

  function renderRows(rows) {
    const body = $('summaryTableBody');
    if (!body) return;
    body.innerHTML = rows.map((row) => `<tr><td>${row.name}</td><td>${row.value}</td><td>${row.note}</td></tr>`).join('');
  }

  function renderEmpty(message) {
    setText('mainResult', '0');
    setText('costResult', '0 Kč');
    setText('costPerKmResult', '0 Kč');
    setText('fuelNeededResult', '0 l');
    setText('resultNote', message);
    setText('consumptionBadge', 'Chybí vstupní data');
  }

  function decision(costPerKm, consumption) {
    if (costPerKm <= 2.5 || consumption <= 5.5) return ['Spíše úsporné', 'Výsledek působí úsporně. Přesto ho porovnejte s dlouhodobým průměrem, protože jedna cesta může zkreslit styl jízdy i provoz.', 'Sledujte delší období'];
    if (costPerKm > 4.5 || consumption > 8) return ['Vyšší náklad', 'Spotřeba nebo cena za kilometr je vyšší. Zkontrolujte tlak v pneumatikách, styl jízdy, rychlost na dálnici a případné krátké městské trasy.', 'Porovnejte další trasu'];
    return ['Běžný výsledek', 'Výsledek je v běžném pásmu. Největší smysl má sledovat změnu v čase a cenu za kilometr při různých trasách.', 'Uložte si srovnání'];
  }

  function calculateReal() {
    const distance = Number($('distanceReal').value);
    const fuelUsed = Number($('fuelUsed').value);
    const fuelPrice = Number($('fuelPriceReal').value);
    const fuelType = $('fuelTypeReal').value;
    if (!distance || distance <= 0 || !fuelUsed || fuelUsed <= 0) return renderEmpty('Zadejte platnou vzdálenost a spotřebované palivo.');
    const consumption = fuelUsed / distance * 100;
    const totalFuelCost = fuelUsed * fuelPrice;
    const costPerKm = totalFuelCost / distance;
    setText('mainResult', `${fmtNumber(consumption, 2)} l / 100 km`);
    setText('costResult', fmtCurrency(totalFuelCost));
    setText('costPerKmResult', fmtCurrency(costPerKm));
    setText('fuelNeededResult', fmtLiters(fuelUsed));
    setText('calcTypeResult', 'Skutečná spotřeba');
    setText('distanceResult', `${fmtNumber(distance, 1)} km`);
    setText('contextResult', fuelType);
    setText('pricePerLiterResult', fmtCurrency(fuelPrice));
    setText('extraCostsResult', fmtCurrency(0));
    setText('resultNote', 'Spotřeba je spočítaná z reálné vzdálenosti a spotřebovaného paliva. Hodí se pro dlouhodobé sledování auta.');
    const [label, text, action] = decision(costPerKm, consumption);
    setText('consumptionBadge', label);
    setText('affordabilityStatus', label);
    setText('affordabilityText', text);
    setText('actionStatus', action);
    setText('decisionSummary', `Palivový náklad vychází na ${fmtCurrency(costPerKm)} za kilometr.`);
    setText('nextActionText', 'Pro přesnější průměr zopakujte výpočet po několika tankováních.');
    renderRows([
      { name: 'Spotřeba', value: `${fmtNumber(consumption, 2)} l / 100 km`, note: 'Výpočet z reálného tankování' },
      { name: 'Spotřebované palivo', value: fmtLiters(fuelUsed), note: 'Zadané množství' },
      { name: 'Cena paliva', value: fmtCurrency(totalFuelCost), note: 'Pouze palivo' },
      { name: 'Cena za km', value: fmtCurrency(costPerKm), note: 'Palivový náklad' }
    ]);
  }

  function calculateTrip() {
    const distance = Number($('tripDistance').value);
    const consumption = Number($('tripConsumption').value);
    const fuelPrice = Number($('fuelPriceTrip').value);
    const multiplier = $('tripMode').value === 'return' ? 2 : 1;
    const extraCosts = Number($('extraCosts').value);
    if (!distance || distance <= 0 || !consumption || consumption <= 0) return renderEmpty('Zadejte platnou délku trasy a průměrnou spotřebu.');
    const totalDistance = distance * multiplier;
    const fuelNeeded = totalDistance * consumption / 100;
    const fuelCost = fuelNeeded * fuelPrice;
    const totalCost = fuelCost + extraCosts;
    const costPerKm = totalCost / totalDistance;
    setText('mainResult', fmtCurrency(totalCost));
    setText('costResult', fmtCurrency(fuelCost));
    setText('costPerKmResult', fmtCurrency(costPerKm));
    setText('fuelNeededResult', fmtLiters(fuelNeeded));
    setText('calcTypeResult', 'Cena cesty');
    setText('distanceResult', `${fmtNumber(totalDistance, 1)} km`);
    setText('contextResult', $('tripMode').value === 'return' ? 'Tam i zpět' : 'Jedna cesta');
    setText('pricePerLiterResult', fmtCurrency(fuelPrice));
    setText('extraCostsResult', fmtCurrency(extraCosts));
    setText('resultNote', 'Cena cesty je spočítaná ze spotřeby, trasy, ceny paliva a dalších přímých výdajů.');
    const [label, text, action] = decision(costPerKm, consumption);
    setText('consumptionBadge', label);
    setText('affordabilityStatus', label);
    setText('affordabilityText', text);
    setText('actionStatus', action);
    setText('decisionSummary', `Trasa potřebuje přibližně ${fmtLiters(fuelNeeded)} paliva a vychází na ${fmtCurrency(totalCost)}.`);
    setText('nextActionText', 'U delších cest počítejte s rezervou na objížďky, parkování a změnu ceny paliva.');
    renderRows([
      { name: 'Celková cena', value: fmtCurrency(totalCost), note: 'Včetně dalších zadaných nákladů' },
      { name: 'Palivo', value: fmtCurrency(fuelCost), note: 'Pouze spotřebované palivo' },
      { name: 'Litry', value: fmtLiters(fuelNeeded), note: 'Odhad podle průměrné spotřeby' },
      { name: 'Cena za km', value: fmtCurrency(costPerKm), note: 'Celkový náklad trasy' }
    ]);
  }

  $('calcRealBtn').addEventListener('click', calculateReal);
  $('calcTripBtn').addEventListener('click', calculateTrip);
  $('resetRealBtn').addEventListener('click', () => { $('distanceReal').value = 520; $('fuelUsed').value = 34.8; $('fuelPriceReal').value = 38.9; $('fuelTypeReal').value = 'Benzín'; calculateReal(); });
  $('resetTripBtn').addEventListener('click', () => { $('tripDistance').value = 250; $('tripConsumption').value = 6.7; $('fuelPriceTrip').value = 38.9; $('tripMode').value = 'oneway'; $('extraCosts').value = 0; calculateTrip(); });
  ['distanceReal','fuelUsed','fuelPriceReal','fuelTypeReal'].forEach((id) => { $(id).addEventListener('input', calculateReal); $(id).addEventListener('change', calculateReal); });
  ['tripDistance','tripConsumption','fuelPriceTrip','tripMode','extraCosts'].forEach((id) => { $(id).addEventListener('input', calculateTrip); $(id).addEventListener('change', calculateTrip); });
  document.querySelectorAll('.tab-button').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));
  calculateReal();
})();
