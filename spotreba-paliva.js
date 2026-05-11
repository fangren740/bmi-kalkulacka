
(function(){
  const $ = (id) => document.getElementById(id);
  let activeTab = 'real';
  const fmtNumber = (value, digits = 2) => new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 0, maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  const fmtCurrency = (value) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(Number.isFinite(value) ? value : 0);
  const fmtCurrencyFine = (value) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(Number.isFinite(value) ? value : 0);
  const fmtLiters = (value) => `${fmtNumber(value, 2)} l`;
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const setHeroText = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function ensureNextActions() {
    if (document.querySelector('.rv-next-actions')) return;
    const note = document.querySelector('.rv-result-note');
    if (!note) return;
    note.insertAdjacentHTML('afterend', `
      <div class="rv-next-actions" aria-label="Co spočítat dál">
        <strong>Co spočítat dál</strong>
        <div class="rv-next-actions__grid">
          <a href="/cena-za-km-kalkulacka.html">Přepočítat plné náklady na 1 km</a>
          <a href="/naklady-na-provoz-auta-kalkulacka.html">Dopočítat měsíční provoz auta</a>
          <a href="/amortizace-auta-kalkulacka.html">Zohlednit ztrátu hodnoty auta</a>
        </div>
      </div>
    `);
  }

  function updateHero(primary, metricValues, fuelShare, efficiencyShare, label) {
    setHeroText('.rv-hero-number', primary);
    document.querySelectorAll('.rv-hero-metrics b').forEach((el, index) => {
      if (metricValues[index]) el.textContent = metricValues[index];
    });
    const bars = document.querySelectorAll('.rv-fuel-meter b');
    const labels = document.querySelectorAll('.rv-fuel-meter strong');
    if (bars[0]) bars[0].style.width = `${clamp(fuelShare, 8, 100)}%`;
    if (labels[0]) labels[0].textContent = `${Math.round(clamp(fuelShare, 0, 100))} %`;
    if (bars[1]) bars[1].style.width = `${clamp(efficiencyShare, 8, 100)}%`;
    if (labels[1]) labels[1].textContent = label || `${Math.round(clamp(efficiencyShare, 0, 100))} %`;
  }

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
    updateHero('Doplňte data', ['- km', '- Kč', '- l'], 0, 0, 'čeká');
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
    setText('costPerKmResult', `${fmtCurrencyFine(costPerKm)}/km`);
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
    setText('decisionSummary', `Palivový náklad vychází na ${fmtCurrencyFine(costPerKm)} za kilometr. To je dobré vodítko pro porovnání tras i aut, ale nezahrnuje servis, pojištění ani ztrátu hodnoty.`);
    setText('nextActionText', 'Pro přesnější průměr zopakujte výpočet po několika tankováních a navazujte kalkulačkou celkové ceny za kilometr.');
    updateHero(`${fmtNumber(consumption, 2)} l/100 km`, [`${fmtNumber(distance, 0)} km`, fmtCurrency(totalFuelCost), fmtLiters(fuelUsed)], Math.min(100, costPerKm / 5 * 100), Math.min(100, consumption / 9 * 100), `${fmtNumber(consumption, 1)} l`);
    renderRows([
      { name: 'Spotřeba', value: `${fmtNumber(consumption, 2)} l / 100 km`, note: 'Výpočet z reálného tankování' },
      { name: 'Spotřebované palivo', value: fmtLiters(fuelUsed), note: 'Zadané množství' },
      { name: 'Cena paliva', value: fmtCurrency(totalFuelCost), note: 'Pouze palivo' },
      { name: 'Cena za km', value: `${fmtCurrencyFine(costPerKm)}/km`, note: 'Palivový náklad bez servisu a amortizace' }
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
    setText('costPerKmResult', `${fmtCurrencyFine(costPerKm)}/km`);
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
    setText('decisionSummary', `Trasa potřebuje přibližně ${fmtLiters(fuelNeeded)} paliva a vychází na ${fmtCurrency(totalCost)}. Cena za kilometr je ${fmtCurrencyFine(costPerKm)}.`);
    setText('nextActionText', 'U delších cest počítejte s rezervou na objížďky, parkování a změnu ceny paliva. Pokud cestu rozpočítáváte mezi lidi, navazujte výpočtem ceny za kilometr.');
    updateHero(`${fmtCurrencyFine(costPerKm)}/km`, [`${fmtNumber(totalDistance, 0)} km`, fmtCurrency(totalCost), fmtLiters(fuelNeeded)], Math.min(100, costPerKm / 5 * 100), Math.min(100, fuelNeeded / 45 * 100), `${fmtNumber(fuelNeeded, 1)} l`);
    renderRows([
      { name: 'Celková cena', value: fmtCurrency(totalCost), note: 'Včetně dalších zadaných nákladů' },
      { name: 'Palivo', value: fmtCurrency(fuelCost), note: 'Pouze spotřebované palivo' },
      { name: 'Litry', value: fmtLiters(fuelNeeded), note: 'Odhad podle průměrné spotřeby' },
      { name: 'Cena za km', value: `${fmtCurrencyFine(costPerKm)}/km`, note: 'Celkový náklad zadané trasy' }
    ]);
  }

  $('calcRealBtn').addEventListener('click', calculateReal);
  $('calcTripBtn').addEventListener('click', calculateTrip);
  $('resetRealBtn').addEventListener('click', () => { $('distanceReal').value = 520; $('fuelUsed').value = 34.8; $('fuelPriceReal').value = 38.9; $('fuelTypeReal').value = 'Benzín'; calculateReal(); });
  $('resetTripBtn').addEventListener('click', () => { $('tripDistance').value = 250; $('tripConsumption').value = 6.7; $('fuelPriceTrip').value = 38.9; $('tripMode').value = 'oneway'; $('extraCosts').value = 0; calculateTrip(); });
  ['distanceReal','fuelUsed','fuelPriceReal','fuelTypeReal'].forEach((id) => { $(id).addEventListener('input', calculateReal); $(id).addEventListener('change', calculateReal); });
  ['tripDistance','tripConsumption','fuelPriceTrip','tripMode','extraCosts'].forEach((id) => { $(id).addEventListener('input', calculateTrip); $(id).addEventListener('change', calculateTrip); });
  document.querySelectorAll('.tab-button').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));
  ensureNextActions();
  calculateReal();
})();
