(function () {
  'use strict';

  var form = document.getElementById('powertrainForm');
  if (!form) return;

  var ids = [
    'annualKm', 'ownershipYears', 'chargingProfile',
    'petrolPrice', 'petrolResale', 'petrolConsumption', 'petrolUnitPrice', 'petrolService', 'petrolInsurance', 'petrolOther', 'petrolSetup',
    'dieselPrice', 'dieselResale', 'dieselConsumption', 'dieselUnitPrice', 'dieselService', 'dieselInsurance', 'dieselOther', 'dieselSetup',
    'evPrice', 'evResale', 'evConsumption', 'evHomePrice', 'evPublicPrice', 'evService', 'evInsurance', 'evOther', 'evSetup'
  ];

  var inputs = {};
  ids.forEach(function (id) { inputs[id] = document.getElementById(id); });

  var presets = {
    family: {
      annualKm: 18000, ownershipYears: 5, chargingProfile: 'mixed',
      petrolPrice: 620000, petrolResale: 315000, petrolConsumption: 6.7, petrolUnitPrice: 38.5, petrolService: 15000, petrolInsurance: 16000, petrolOther: 9000, petrolSetup: 0,
      dieselPrice: 670000, dieselResale: 345000, dieselConsumption: 5.3, dieselUnitPrice: 37.5, dieselService: 20000, dieselInsurance: 17000, dieselOther: 9000, dieselSetup: 0,
      evPrice: 850000, evResale: 420000, evConsumption: 18.2, evHomePrice: 6.2, evPublicPrice: 13.5, evService: 9000, evInsurance: 20000, evOther: 9000, evSetup: 30000
    },
    city: {
      annualKm: 12000, ownershipYears: 5, chargingProfile: 'home',
      petrolPrice: 520000, petrolResale: 270000, petrolConsumption: 6.4, petrolUnitPrice: 38.5, petrolService: 14000, petrolInsurance: 14000, petrolOther: 8000, petrolSetup: 0,
      dieselPrice: 590000, dieselResale: 295000, dieselConsumption: 5.6, dieselUnitPrice: 37.5, dieselService: 21000, dieselInsurance: 15000, dieselOther: 8000, dieselSetup: 0,
      evPrice: 720000, evResale: 350000, evConsumption: 16.5, evHomePrice: 6.2, evPublicPrice: 13.5, evService: 8000, evInsurance: 17000, evOther: 8000, evSetup: 28000
    },
    distance: {
      annualKm: 35000, ownershipYears: 5, chargingProfile: 'public',
      petrolPrice: 700000, petrolResale: 320000, petrolConsumption: 7.2, petrolUnitPrice: 38.5, petrolService: 18000, petrolInsurance: 18000, petrolOther: 12000, petrolSetup: 0,
      dieselPrice: 750000, dieselResale: 370000, dieselConsumption: 5.4, dieselUnitPrice: 37.5, dieselService: 23000, dieselInsurance: 19000, dieselOther: 12000, dieselSetup: 0,
      evPrice: 980000, evResale: 440000, evConsumption: 21.5, evHomePrice: 6.2, evPublicPrice: 13.5, evService: 11000, evInsurance: 23000, evOther: 12000, evSetup: 35000
    }
  };

  var chargingShares = { home: 10, mixed: 40, public: 75 };
  var names = { petrol: 'Benzín', diesel: 'Diesel', ev: 'Elektro' };
  var instrumental = { petrol: 'benzínem', diesel: 'dieselem', ev: 'elektromobilem' };
  var genitive = { petrol: 'benzínu', diesel: 'dieselu', ev: 'elektromobilu' };
  var colors = { petrol: '#e8a44a', diesel: '#62a9e8', ev: '#38c99b' };
  var lastResult = null;

  function numberValue(id) {
    var value = Number(inputs[id] && inputs[id].value);
    return Number.isFinite(value) ? value : 0;
  }

  function money(value) {
    return Math.round(value).toLocaleString('cs-CZ') + ' Kč';
  }

  function decimal(value, digits) {
    return Number(value).toLocaleString('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits });
  }

  function km(value) {
    return Math.round(value).toLocaleString('cs-CZ') + ' km';
  }

  function setText(id, value) {
    var node = document.getElementById(id);
    if (node) node.textContent = value;
  }

  function setWidth(id, value) {
    var node = document.getElementById(id);
    if (node) node.style.width = Math.max(0, Math.min(100, value)) + '%';
  }

  function model() {
    var years = numberValue('ownershipYears');
    var annualKm = numberValue('annualKm');
    var totalKm = years * annualKm;
    var share = chargingShares[inputs.chargingProfile.value] / 100;
    var configs = {
      petrol: {
        purchase: numberValue('petrolPrice'), resale: numberValue('petrolResale'), consumption: numberValue('petrolConsumption'), unit: numberValue('petrolUnitPrice'),
        service: numberValue('petrolService'), insurance: numberValue('petrolInsurance'), other: numberValue('petrolOther'), setup: numberValue('petrolSetup')
      },
      diesel: {
        purchase: numberValue('dieselPrice'), resale: numberValue('dieselResale'), consumption: numberValue('dieselConsumption'), unit: numberValue('dieselUnitPrice'),
        service: numberValue('dieselService'), insurance: numberValue('dieselInsurance'), other: numberValue('dieselOther'), setup: numberValue('dieselSetup')
      },
      ev: {
        purchase: numberValue('evPrice'), resale: numberValue('evResale'), consumption: numberValue('evConsumption'),
        unit: numberValue('evHomePrice') * (1 - share) + numberValue('evPublicPrice') * share,
        service: numberValue('evService'), insurance: numberValue('evInsurance'), other: numberValue('evOther'), setup: numberValue('evSetup')
      }
    };

    var variants = Object.keys(configs).map(function (key) {
      var c = configs[key];
      var depreciation = c.purchase - c.resale;
      var energyPerKm = (c.consumption * c.unit) / 100;
      var energy = totalKm * energyPerKm;
      var fixed = (c.service + c.insurance + c.other) * years;
      var base = depreciation + c.setup + fixed;
      var total = base + energy;
      return {
        key: key, name: names[key], color: colors[key], total: total, totalKm: totalKm,
        monthly: total / (years * 12), annual: total / years, perKm: total / totalKm,
        depreciation: depreciation, setup: c.setup, energy: energy, fixed: fixed,
        energyPerKm: energyPerKm, base: base, config: c
      };
    }).sort(function (a, b) { return a.total - b.total; });

    return { years: years, annualKm: annualKm, totalKm: totalKm, publicShare: share, variants: variants };
  }

  function validate() {
    var issues = [];
    if (numberValue('annualKm') < 500 || numberValue('annualKm') > 100000) issues.push('Roční nájezd musí být mezi 500 a 100 000 km.');
    if (numberValue('ownershipYears') < 1 || numberValue('ownershipYears') > 15) issues.push('Doba vlastnictví musí být mezi 1 a 15 lety.');
    ['petrol', 'diesel', 'ev'].forEach(function (key) {
      var prefix = key === 'ev' ? 'ev' : key;
      var price = numberValue(prefix + 'Price');
      var resale = numberValue(prefix + 'Resale');
      if (price <= 0) issues.push(names[key] + ': pořizovací cena musí být vyšší než nula.');
      if (resale < 0 || resale > price) issues.push(names[key] + ': prodejní hodnota musí být mezi nulou a pořizovací cenou.');
      if (numberValue(prefix + 'Consumption') <= 0) issues.push(names[key] + ': spotřeba musí být vyšší než nula.');
    });
    if (numberValue('petrolUnitPrice') <= 0 || numberValue('dieselUnitPrice') <= 0 || numberValue('evHomePrice') <= 0 || numberValue('evPublicPrice') <= 0) {
      issues.push('Ceny energie musí být vyšší než nula.');
    }
    var message = document.getElementById('formError');
    if (message) {
      message.hidden = !issues.length;
      message.textContent = issues[0] || '';
    }
    return issues.length === 0;
  }

  function breakEven(result) {
    var rows = [];
    var original = result.variants.slice().sort(function (a, b) { return a.key.localeCompare(b.key); });
    for (var i = 0; i < original.length; i += 1) {
      for (var j = i + 1; j < original.length; j += 1) {
        var a = original[i];
        var b = original[j];
        var denominator = result.years * (a.energyPerKm - b.energyPerKm);
        if (Math.abs(denominator) < 0.000001) continue;
        var threshold = (b.base - a.base) / denominator;
        if (threshold > 0 && threshold < 150000) {
          rows.push({ a: a, b: b, threshold: threshold, distance: Math.abs(threshold - result.annualKm) });
        }
      }
    }
    rows.sort(function (a, b) { return a.distance - b.distance; });
    return rows[0] || null;
  }

  function scenarioWinner(base, type) {
    var altered = base.variants.map(function (v) {
      var total = v.total;
      if (type === 'energy') total = v.base + v.energy * 1.15;
      if (type === 'service') total = v.total + v.config.service * base.years * 0.25;
      if (type === 'resale') total = v.total + v.config.resale * 0.10;
      if (type === 'lowKm') total = v.base + v.energy * 0.75;
      return { key: v.key, total: total };
    }).sort(function (a, b) { return a.total - b.total; });
    return altered[0].key;
  }

  function render(result) {
    var winner = result.variants[0];
    var second = result.variants[1];
    var gap = second.total - winner.total;
    var max = result.variants[result.variants.length - 1].total;
    var min = winner.total;
    var range = Math.max(1, max - min);
    lastResult = result;

    setText('winnerName', winner.name);
    setText('winnerTotal', money(winner.total));
    setText('winnerMonthly', money(winner.monthly) + '/měs.');
    setText('winnerPerKm', decimal(winner.perKm, 2) + ' Kč/km');
    setText('winnerGap', money(gap));
    setText('resultPeriod', result.years + (result.years === 1 ? ' rok' : result.years < 5 ? ' roky' : ' let') + ' · ' + km(result.totalKm));
    setText('totalKmResult', km(result.totalKm));
    setText('heroWinner', winner.name);
    setText('heroWinnerTotal', money(winner.total));
    setText('heroWinnerKm', decimal(winner.perKm, 2) + ' Kč/km');
    setText('heroPeriod', result.years + ' let / ' + km(result.totalKm));
    setText('resultStatus', 'Náskok ' + money(gap));

    result.variants.forEach(function (v, index) {
      setText(v.key + 'Total', money(v.total));
      setText(v.key + 'Monthly', money(v.monthly) + '/měs.');
      setText(v.key + 'PerKm', decimal(v.perKm, 2) + ' Kč/km');
      setText(v.key + 'Rank', (index + 1) + '. místo');
      setWidth(v.key + 'RaceBar', 38 + ((max - v.total) / range) * 62);
      setWidth('hero' + v.key.charAt(0).toUpperCase() + v.key.slice(1) + 'Bar', 45 + ((max - v.total) / range) * 55);
      setText('hero' + v.key.charAt(0).toUpperCase() + v.key.slice(1) + 'Cost', decimal(v.perKm, 2) + ' Kč/km');
      var card = document.querySelector('[data-result-card="' + v.key + '"]');
      if (card) card.classList.toggle('is-winner', index === 0);
    });

    var body = document.getElementById('compareBody');
    if (body) {
      body.replaceChildren();
      result.variants.forEach(function (v, index) {
        var row = document.createElement('tr');
        [
          (index === 0 ? '★ ' : '') + v.name,
          money(v.total), money(v.depreciation + v.setup), money(v.energy), money(v.fixed), decimal(v.perKm, 2) + ' Kč'
        ].forEach(function (value) { var cell = document.createElement('td'); cell.textContent = value; row.appendChild(cell); });
        body.appendChild(row);
      });
    }

    var depShare = (winner.depreciation + winner.setup) / winner.total * 100;
    var energyShare = winner.energy / winner.total * 100;
    var fixedShare = winner.fixed / winner.total * 100;
    setWidth('depreciationBar', depShare);
    setWidth('energyBar', energyShare);
    setWidth('fixedBar', fixedShare);
    setText('depreciationShare', decimal(depShare, 0) + ' %');
    setText('energyShare', decimal(energyShare, 0) + ' %');
    setText('fixedShare', decimal(fixedShare, 0) + ' %');
    setText('detailWinner', winner.name);
    setText('detailDepreciation', money(winner.depreciation + winner.setup));
    setText('detailEnergy', money(winner.energy));
    setText('detailFixed', money(winner.fixed));

    var threshold = breakEven(result);
    if (threshold) {
      var lower = threshold.a.energyPerKm < threshold.b.energyPerKm ? threshold.a : threshold.b;
      var higher = lower === threshold.a ? threshold.b : threshold.a;
      setText('breakEvenTitle', 'Hranice mezi ' + instrumental[threshold.a.key] + ' a ' + instrumental[threshold.b.key]);
      setText('breakEvenValue', (Math.round(threshold.threshold / 100) * 100).toLocaleString('cs-CZ') + ' km/rok');
      setText('breakEvenText', 'Nad přibližně ' + (Math.round(threshold.threshold / 100) * 100).toLocaleString('cs-CZ') + ' km ročně začne nižší provozní cena ' + genitive[lower.key] + ' vyrovnávat vyšší fixní náklady proti ' + genitive[higher.key] + '. Hranice platí jen pro právě zadané ceny a období.');
    } else {
      setText('breakEvenTitle', 'V zadaném rozsahu nevzniká užitečný bod zlomu');
      setText('breakEvenValue', 'bez průsečíku');
      setText('breakEvenText', 'Jedna varianta má při zadaných hodnotách současně nižší fixní i provozní náklady, případně by se náklady protnuly až mimo praktický roční nájezd.');
    }

    var scenarios = ['base', 'energy', 'service', 'resale', 'lowKm'];
    var labels = ['Základní model', 'Energie +15 %', 'Servis +25 %', 'Prodejní cena −10 %', 'Nájezd −25 %'];
    var winners = scenarios.map(function (type) { return type === 'base' ? winner.key : scenarioWinner(result, type); });
    var stable = winners.filter(function (key) { return key === winner.key; }).length;
    setText('stabilityScore', stable + ' / ' + winners.length);
    setText('stabilityLabel', stable === winners.length ? 'velmi stabilní výsledek' : stable >= 4 ? 'poměrně stabilní výsledek' : stable >= 3 ? 'citlivý výsledek' : 'velmi citlivý výsledek');
    setWidth('stabilityBar', stable / winners.length * 100);
    var list = document.getElementById('scenarioList');
    if (list) {
      list.replaceChildren();
      labels.forEach(function (label, index) {
        var item = document.createElement('div');
        var span = document.createElement('span');
        var strong = document.createElement('strong');
        span.textContent = label;
        strong.textContent = names[winners[index]];
        strong.style.color = colors[winners[index]];
        item.append(span, strong);
        list.appendChild(item);
      });
    }

    var close = gap / Math.max(1, winner.total) < 0.05;
    setText('decisionTitle', close ? 'Rozdíl je malý — nerozhodujte jen podle vítěze' : winner.name + ' má v tomto modelu zřetelný náskok');
    setText('decisionText', close
      ? 'První dvě varianty dělí méně než pět procent. Jedna oprava, jiná prodejní cena nebo změna nabíjení může pořadí otočit. Porovnejte proto i použitelnost, stav konkrétního vozu a rezervu.'
      : 'Model po započtení ceny auta, prodeje, energie a ročních výdajů favorizuje variantu ' + winner.name + '. Náskok je ' + money(gap) + ' za celé období, ne sleva při dnešní platbě.');
    setText('nextAction', winner.key === 'ev'
      ? 'Ověřte domácí nabíjení, reálnou zimní spotřebu, pojistku a cenu wallboxu.'
      : winner.key === 'diesel'
        ? 'Ověřte profil tras, servisní historii a riziko nákladných emisních komponent.'
        : 'Ověřte reálnou spotřebu na svých trasách a porovnejte nižší pořizovací cenu se spotřebou.');
  }

  function calculate() {
    if (!validate()) return;
    render(model());
  }

  function applyPreset(name) {
    var preset = presets[name];
    if (!preset) return;
    Object.keys(preset).forEach(function (key) { if (inputs[key]) inputs[key].value = preset[key]; });
    document.querySelectorAll('[data-preset]').forEach(function (button) {
      var active = button.getAttribute('data-preset') === name;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    calculate();
  }

  document.querySelectorAll('[data-preset]').forEach(function (button) {
    button.addEventListener('click', function () { applyPreset(button.getAttribute('data-preset')); });
  });

  form.addEventListener('input', calculate);
  form.addEventListener('change', calculate);
  form.addEventListener('submit', function (event) { event.preventDefault(); calculate(); });
  document.getElementById('resetBtn').addEventListener('click', function () { applyPreset('family'); });

  var pro = document.getElementById('proSettings');
  if (pro) pro.addEventListener('toggle', function () { setText('modeBadge', pro.open ? 'PRO režim' : 'BASIC režim'); });

  var copy = document.getElementById('copyResult');
  if (copy) copy.addEventListener('click', function () {
    if (!lastResult) return;
    var winner = lastResult.variants[0];
    var text = 'Benzín vs. diesel vs. elektro: ' + winner.name + ' — ' + money(winner.total) + ' za ' + lastResult.years + ' let, ' + decimal(winner.perKm, 2) + ' Kč/km. Modelový orientační výsledek z RychléVýpočty.cz.';
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { copy.textContent = 'Zkopírováno'; setTimeout(function () { copy.textContent = 'Kopírovat výsledek'; }, 1800); });
  });

  applyPreset('family');
}());
