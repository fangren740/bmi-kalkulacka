(() => {
  const ids = [
    'usableArea',
    'houseType',
    'floors',
    'roofType',
    'buildStandard',
    'completionStage',
    'garage',
    'landComplexity',
    'regionFactor',
    'reserveRate'
  ];

  const $ = (id) => document.getElementById(id);
  const form = $('houseBuildForm');
  const resetBtn = $('resetBtn');
  const moneyFormat = new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency: 'CZK',
    maximumFractionDigits: 0
  });
  const numberFormat = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });
  const money = (value) => moneyFormat.format(Number.isFinite(value) ? value : 0);
  const pct = (value) => `${numberFormat.format(value)} %`;

  function text(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function values() {
    return Object.fromEntries(ids.map((id) => {
      const element = $(id);
      return [id, element.tagName === 'SELECT' ? element.value : Number(element.value) || 0];
    }));
  }

  function baseRate(type) {
    if (type === 'compact') return 38000;
    if (type === 'bungalow') return 46000;
    return 42000;
  }

  function floorMul(floors) {
    return Number(floors) === 2 ? 1.03 : 1;
  }

  function roofMul(type) {
    if (type === 'medium') return 1.06;
    if (type === 'complex') return 1.13;
    return 1;
  }

  function standardMul(type) {
    if (type === 'basic') return 0.92;
    if (type === 'higher') return 1.18;
    return 1;
  }

  function stageMul(type) {
    if (type === 'rough') return 0.54;
    if (type === 'shell') return 0.78;
    return 1;
  }

  function garageCost(type) {
    if (type === 'carport') return 180000;
    if (type === 'garage') return 420000;
    return 0;
  }

  function landMul(type) {
    if (type === 'medium') return 1.05;
    if (type === 'hard') return 1.12;
    return 1;
  }

  function typeLabel(type) {
    if (type === 'bungalow') return 'Bungalov';
    if (type === 'compact') return 'Kompaktní dům';
    return 'Patrový dům';
  }

  function stageLabel(type) {
    if (type === 'rough') return 'Hrubá stavba';
    if (type === 'shell') return 'Dům k dokončení';
    return 'Dům na klíč';
  }

  function standardLabel(type) {
    if (type === 'basic') return 'úspornější standard';
    if (type === 'higher') return 'vyšší standard';
    return 'běžný standard';
  }

  function compactMillions(value) {
    if (value >= 1000000) return `${numberFormat.format(value / 1000000)} mil. Kč`;
    return money(value);
  }

  function budgetTone(totalCost) {
    if (totalCost < 5500000) {
      return {
        badge: 'Spíš úspornější rozpočet',
        headline: 'Rozpočet působí úsporněji',
        tone: 'low'
      };
    }
    if (totalCost < 9000000) {
      return {
        badge: 'Spíš střední rozpočet stavby',
        headline: 'Rozpočet je ve středním pásmu',
        tone: 'medium'
      };
    }
    return {
      badge: 'Spíš náročnější rozpočet stavby',
      headline: 'Rozpočet míří do náročnější stavby',
      tone: 'high'
    };
  }

  function updateHero(v, result, tone) {
    const hero = document.querySelector('.hero-visual');
    if (hero) hero.setAttribute('data-tone', tone.tone);

    const number = document.querySelector('.reno-number');
    if (number) number.textContent = compactMillions(result.totalCost);

    const sub = document.querySelector('.reno-sub');
    if (sub) {
      sub.textContent = `${stageLabel(v.completionStage).toLowerCase()} · ${standardLabel(v.buildStandard)} · ${money(result.pricePerM2)} za m². Výsledek je orientační rámec pro nabídky a rezervu.`;
    }

    const metrics = document.querySelectorAll('.reno-metrics b');
    if (metrics[0]) metrics[0].textContent = `${v.usableArea} m²`;
    if (metrics[1]) metrics[1].textContent = stageLabel(v.completionStage).toLowerCase();
    if (metrics[2]) metrics[2].textContent = `${v.reserveRate} %`;

    const product = document.querySelector('.product-card strong');
    if (product) product.textContent = `${typeLabel(v.houseType)} · ${standardLabel(v.buildStandard)}`;

    const strip = document.querySelectorAll('.hero-mini-strip span');
    if (strip[0]) strip[0].textContent = `${money(result.baseCost)} základ`;
    if (strip[1]) strip[1].textContent = `${money(result.reserveCost)} rezerva`;
    if (strip[2]) strip[2].textContent = tone.badge.replace('Spíš ', '');
  }

  function render() {
    const v = values();
    v.usableArea = Number(v.usableArea);
    v.floors = Number(v.floors);
    v.regionFactor = Number(v.regionFactor);
    v.reserveRate = Number(v.reserveRate);

    const areaBase = v.usableArea * baseRate(v.houseType);
    const coreCost = areaBase *
      floorMul(v.floors) *
      roofMul(v.roofType) *
      standardMul(v.buildStandard) *
      stageMul(v.completionStage) *
      landMul(v.landComplexity);
    const garage = garageCost(v.garage);
    const baseCost = (coreCost + garage) * v.regionFactor;
    const reserveCost = baseCost * (v.reserveRate / 100);
    const totalCost = baseCost + reserveCost;
    const pricePerM2 = totalCost / Math.max(v.usableArea, 1);
    const result = { coreCost, garage, baseCost, reserveCost, totalCost, pricePerM2 };
    const tone = budgetTone(totalCost);

    text('totalCost', money(totalCost));
    text('pricePerM2', money(pricePerM2));
    text('baseCost', money(baseCost));
    text('reserveCost', money(reserveCost));
    text('summaryArea', `${v.usableArea} m²`);
    text('summaryType', typeLabel(v.houseType));
    text('summaryStage', stageLabel(v.completionStage));
    text('summaryCore', money(coreCost * v.regionFactor));
    text('summaryExtras', money(garage * v.regionFactor));
    text('summaryReserveShare', pct(v.reserveRate));
    text('budgetBadge', tone.badge);
    text('decisionHeadline', tone.headline);
    text(
      'decisionText',
      `Orientační cena vychází ${money(totalCost)}, tedy ${money(pricePerM2)} za m². Největší vliv má plocha, fáze dokončení, standard, střecha a pozemek.`
    );
    text(
      'nextStepText',
      'Další krok: rozdělte výsledek na základy, hrubou stavbu, střechu, technologie a dokončovací práce. Nabídky porovnávejte jen při stejném rozsahu.'
    );

    const rows = [
      ['Hlavní stavební část domu', coreCost * v.regionFactor, 'hlavní položka'],
      ['Garáž / přístřešek', garage * v.regionFactor, 'volitelně'],
      ['Rezerva', reserveCost, 'bezpečnost']
    ].filter((row) => row[1] > 0);

    const body = $('breakdownBody');
    if (body) {
      body.innerHTML = rows
        .map((row) => `<tr><td>${row[0]}</td><td>${money(row[1])}</td><td>${row[2]}</td></tr>`)
        .join('');
    }

    updateHero(v, result, tone);
  }

  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    render();
  });
  ids.forEach((id) => {
    $(id)?.addEventListener('input', render);
    $(id)?.addEventListener('change', render);
  });
  resetBtn?.addEventListener('click', () => {
    form.reset();
    render();
  });
  render();
})();
