(() => {
  const $ = (id) => document.getElementById(id);
  const form = $('driveCompareForm');
  if (!form) return;

  const defaultValues = {
    balanced: { annualKm: 20000, years: 5, publicChargingShare: 25, petrolPrice: 520000, petrolResidual: 300000, petrolConsumption: 6.7, petrolFuelPrice: 38.5, petrolService: 18000, dieselPrice: 570000, dieselResidual: 320000, dieselConsumption: 5.2, dieselFuelPrice: 37.5, dieselService: 22000, evPrice: 820000, evResidual: 450000, evConsumption: 17.5, evHomePrice: 6, evPublicPrice: 13, evService: 12000 },
    low: { annualKm: 9000, years: 5, publicChargingShare: 30, petrolPrice: 430000, petrolResidual: 260000, petrolConsumption: 6.4, petrolFuelPrice: 38.5, petrolService: 15000, dieselPrice: 480000, dieselResidual: 275000, dieselConsumption: 5.1, dieselFuelPrice: 37.5, dieselService: 21000, evPrice: 720000, evResidual: 410000, evConsumption: 16.8, evHomePrice: 6.2, evPublicPrice: 13.5, evService: 11000 },
    high: { annualKm: 35000, years: 5, publicChargingShare: 20, petrolPrice: 560000, petrolResidual: 290000, petrolConsumption: 7.0, petrolFuelPrice: 38.5, petrolService: 22000, dieselPrice: 610000, dieselResidual: 330000, dieselConsumption: 5.4, dieselFuelPrice: 37.5, dieselService: 27000, evPrice: 850000, evResidual: 455000, evConsumption: 18.5, evHomePrice: 6, evPublicPrice: 12.5, evService: 13000 },
    evhome: { annualKm: 25000, years: 6, publicChargingShare: 10, petrolPrice: 540000, petrolResidual: 270000, petrolConsumption: 6.8, petrolFuelPrice: 38.5, petrolService: 19000, dieselPrice: 590000, dieselResidual: 300000, dieselConsumption: 5.3, dieselFuelPrice: 37.5, dieselService: 24000, evPrice: 790000, evResidual: 390000, evConsumption: 17.0, evHomePrice: 4.5, evPublicPrice: 12.5, evService: 11000 }
  };

  const fieldIds = Object.keys(defaultValues.balanced);
  const fmt = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  const fmt1 = new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const money = (value) => `${fmt.format(Math.round(value || 0))} Kč`;
  const km = (value) => `${fmt.format(Math.round(value || 0))} km`;
  const perKm = (value) => `${fmt1.format(value || 0)} Kč`;
  const num = (id) => {
    const el = $(id);
    if (!el) return 0;
    const raw = String(el.value || '').replace(',', '.');
    const value = Number(raw);
    return Number.isFinite(value) ? value : 0;
  };

  function setPreset(name) {
    const preset = defaultValues[name] || defaultValues.balanced;
    fieldIds.forEach((id) => { if ($(id)) $(id).value = preset[id]; });
    document.querySelectorAll('.scenario-chip').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.preset === name)));
    calculate();
  }

  function variant(label, type, price, residual, energyCostYearly, serviceYearly, years, totalKm) {
    const depreciation = Math.max(0, price - residual);
    const service = Math.max(0, serviceYearly) * years;
    const energy = Math.max(0, energyCostYearly) * years;
    const total = depreciation + service + energy;
    return {
      label, type, price, residual, depreciation, service, energy, total,
      yearly: total / years,
      perKm: totalKm > 0 ? total / totalKm : 0,
      operatingYearly: Math.max(0, energyCostYearly) + Math.max(0, serviceYearly)
    };
  }

  function breakEvenText(results, annualKm, years) {
    const sortedByPrice = [...results].sort((a, b) => a.price - b.price);
    const cheapestPurchase = sortedByPrice[0];
    const candidates = results.filter((r) => r.price > cheapestPurchase.price && r.operatingYearly < cheapestPurchase.operatingYearly);
    if (!candidates.length) return 'není zřejmý';
    const best = candidates.sort((a, b) => (a.total - b.total))[0];
    const extraPrice = best.price - cheapestPurchase.price;
    const annualSavingAtCurrentKm = cheapestPurchase.operatingYearly - best.operatingYearly;
    if (annualSavingAtCurrentKm <= 0) return 'není zřejmý';
    const paybackYears = extraPrice / annualSavingAtCurrentKm;
    if (paybackYears > years * 1.8) return `${best.label}: až při vyšším nájezdu`;
    const kmNeededPerYear = annualKm * (paybackYears / years);
    return `${best.label}: cca ${km(kmNeededPerYear)}/rok`;
  }

  function strongestFactor(r) {
    const factors = [
      ['energie', r.energy],
      ['servis', r.service],
      ['ztráta hodnoty', r.depreciation]
    ].sort((a, b) => b[1] - a[1]);
    return factors[0][0];
  }

  function decisionCopy(winner, second, results, annualKm) {
    const gap = second ? second.total - winner.total : 0;
    const gapPct = second && second.total ? gap / second.total : 0;
    if (gapPct < 0.04) {
      return {
        title: 'Rozdíl je malý',
        text: `Nejlépe vychází ${winner.label}, ale rozdíl proti další variantě je jen ${money(gap)}. U takto těsného výsledku rozhoduje hlavně typ jízd, servisní riziko a pohodlí.`,
        next: 'Zkuste změnit roční nájezd, zůstatkovou hodnotu nebo cenu nabíjení. Uvidíte, jak citlivý je výsledek.'
      };
    }
    if (winner.type === 'ev') {
      return {
        title: 'Elektro vychází nejlépe',
        text: `Elektromobil vyhrává hlavně díky nízkým nákladům na energii a servisu. Výsledek ale stojí na předpokladu, že část nabíjení zvládnete za zadanou cenu.`,
        next: 'Ověřte hlavně cenu domácí elektřiny, podíl veřejného nabíjení a realistickou prodejní hodnotu auta.'
      };
    }
    if (winner.type === 'diesel') {
      return {
        title: 'Diesel dává v tomto scénáři smysl',
        text: `Diesel vychází nejlépe zejména při nájezdu ${km(annualKm)} ročně. Úspora na spotřebě zde převáží vyšší servis nebo pořizovací rozdíl.`,
        next: 'U dieselu si pohlídejte typ tras. Krátké městské jízdy mohou zhoršit reálné náklady i servisní riziko.'
      };
    }
    return {
      title: 'Benzín vychází nejlépe',
      text: `Benzínová varianta vítězí hlavně díky nižší pořizovací ceně a přijatelným celkovým nákladům. Při nižším nebo středním nájezdu může být finančně rozumnější než dražší alternativy.`,
      next: 'Pokud čekáte výrazně vyšší nájezd, zkuste scénář přepočítat. Diesel nebo elektro se mohou začít vyplácet až při více kilometrech.'
    };
  }

  function calculate() {
    const annualKm = Math.max(1, num('annualKm'));
    const years = Math.max(1, num('years'));
    const totalKm = annualKm * years;
    const publicShare = Math.min(100, Math.max(0, num('publicChargingShare'))) / 100;

    const petrolEnergyYearly = annualKm / 100 * num('petrolConsumption') * num('petrolFuelPrice');
    const dieselEnergyYearly = annualKm / 100 * num('dieselConsumption') * num('dieselFuelPrice');
    const evWeightedKwh = (num('evHomePrice') * (1 - publicShare)) + (num('evPublicPrice') * publicShare);
    const evEnergyYearly = annualKm / 100 * num('evConsumption') * evWeightedKwh;

    const results = [
      variant('Benzín', 'petrol', num('petrolPrice'), num('petrolResidual'), petrolEnergyYearly, num('petrolService'), years, totalKm),
      variant('Diesel', 'diesel', num('dieselPrice'), num('dieselResidual'), dieselEnergyYearly, num('dieselService'), years, totalKm),
      variant('Elektro', 'ev', num('evPrice'), num('evResidual'), evEnergyYearly, num('evService'), years, totalKm)
    ].sort((a, b) => a.total - b.total);

    const winner = results[0];
    const second = results[1];
    const gap = second ? second.total - winner.total : 0;
    const copy = decisionCopy(winner, second, results, annualKm);

    $('winnerBadge').textContent = `${winner.label} vychází nejlépe`;
    $('winnerName').textContent = winner.label;
    $('resultNote').textContent = `Za ${fmt.format(years)} let a ${km(totalKm)} vychází ${winner.label.toLowerCase()} na ${money(winner.total)} celkem.`;
    $('winnerGap').textContent = money(gap);
    $('bestPerKm').textContent = `${perKm(winner.perKm)}/km`;
    $('totalKmResult').textContent = km(totalKm);
    $('breakEvenResult').textContent = breakEvenText(results, annualKm, years);
    $('decisionTitle').textContent = copy.title;
    $('decisionText').textContent = copy.text;
    $('nextActionText').textContent = copy.next;

    const bestTotal = winner.total;
    $('compareBody').innerHTML = results.map((r) => `<tr class="bve-result-row ${r === winner ? 'is-winner' : ''}"><td>${r.label}${r === winner ? ' · nejlepší' : ''}</td><td>${money(r.total)}</td><td>${money(r.yearly)}</td><td>${perKm(r.perKm)}/km</td><td>${r === winner ? 'nejlevnější' : '+' + money(r.total - bestTotal)}</td></tr>`).join('');

    $('factorCards').innerHTML = results.map((r) => `<div class="bve-factor-card ${r === winner ? 'best' : ''}"><span>${r.label}</span><strong>${strongestFactor(r)}</strong><small>Energie ${money(r.energy)}, servis ${money(r.service)}, ztráta hodnoty ${money(r.depreciation)}.</small></div>`).join('');
  }

  form.addEventListener('submit', (event) => { event.preventDefault(); calculate(); });
  form.addEventListener('input', calculate);
  document.querySelectorAll('.scenario-chip').forEach((button) => button.addEventListener('click', () => setPreset(button.dataset.preset)));
  const resetBtn = $('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', () => setPreset('balanced'));
  setPreset('balanced');
})();
