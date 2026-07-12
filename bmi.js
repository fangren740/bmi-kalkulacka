(function () {
  'use strict';

  const form = document.getElementById('bmiForm');
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const heightInput = $('height');
  const weightInput = $('weight');
  const waistInput = $('waist');
  const advanced = $('bmiAdvanced');
  const feetInput = $('feetInput');
  const inchesInput = $('inchesInput');
  const poundsInput = $('poundsInput');
  const conversionNote = $('conversionNote');
  const errorBox = $('inputError');

  const outputIds = [
    'heroBmi', 'heroCategory', 'heroHeight', 'heroWeight', 'heroRange', 'heroNeedle',
    'heroWaist', 'heroFormula', 'resultBadge', 'bmiResult', 'resultNote', 'bmiGaugeBar',
    'categoryResult', 'rangeResult', 'differenceResult', 'waistRatioResult',
    'interpretStatus', 'interpretText', 'decisionSummary', 'nextActionText',
    'readingTitle', 'readingText', 'heightResult', 'weightResult', 'normalMinResult',
    'normalMaxResult', 'formulaResult', 'waistDetailResult', 'summaryTableBody'
  ];
  const out = Object.fromEntries(outputIds.map((id) => [id, $(id)]));

  const number = (value, digits = 1) => new Intl.NumberFormat('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  }).format(value);
  const compact = (value, digits = 1) => new Intl.NumberFormat('cs-CZ', {
    maximumFractionDigits: digits
  }).format(value);
  const kg = (value) => `${number(value, 1)} kg`;

  function values() {
    return {
      height: Number(heightInput.value),
      weight: Number(weightInput.value),
      waist: waistInput.value.trim() === '' ? null : Number(waistInput.value)
    };
  }

  function validate(v) {
    if (!Number.isFinite(v.height) || v.height < 100 || v.height > 250) {
      return 'Výška musí být mezi 100 a 250 cm.';
    }
    if (!Number.isFinite(v.weight) || v.weight < 25 || v.weight > 350) {
      return 'Hmotnost musí být mezi 25 a 350 kg.';
    }
    if (v.waist !== null && (!Number.isFinite(v.waist) || v.waist < 40 || v.waist > 250)) {
      return 'Obvod pasu musí být prázdný, nebo mezi 40 a 250 cm.';
    }
    return '';
  }

  function category(bmi) {
    if (bmi < 18.5) return {
      label: 'Podváha', badge: 'is-low',
      note: 'BMI je pod standardním referenčním pásmem pro dospělé.',
      status: 'Výsledek je pod hranicí 18,5',
      text: 'Nízké BMI může mít více příčin. Důležitý je trend, tělesné složení a případné nechtěné změny hmotnosti.',
      next: 'Pokud je nízká hmotnost nová, nechtěná nebo spojená s obtížemi, nespoléhejte jen na online výpočet.'
    };
    if (bmi < 25) return {
      label: 'Referenční pásmo', badge: '',
      note: 'BMI spadá do standardního referenčního pásma pro dospělé.',
      status: 'Screeningové pásmo, ne diagnóza',
      text: 'Hodnota leží mezi 18,5 a 24,9. Stále však nepopisuje podíl svalů, tuku ani celkový zdravotní stav.',
      next: 'Sledujte dlouhodobý trend a běžný zdravotní kontext, ne jediný izolovaný výpočet.'
    };
    if (bmi < 30) return {
      label: 'Nadváha', badge: 'is-high',
      note: 'BMI spadá do pásma nadváhy podle standardní klasifikace dospělých.',
      status: 'Výsledek je mezi 25,0 a 29,9',
      text: 'BMI nepozná, kolik hmotnosti tvoří svaly. Užitečným doplňkem může být obvod pasu a vývoj v čase.',
      next: 'Doplňte kontext pomocí obvodu pasu, tělesného složení a případně odborného posouzení.'
    };
    if (bmi < 35) return {
      label: 'Obezita I. třídy', badge: 'is-risk',
      note: 'BMI spadá do I. třídy obezity podle standardní klasifikace dospělých.',
      status: 'Výsledek je mezi 30,0 a 34,9',
      text: 'Jde o screeningovou kategorii, nikoli diagnózu. Význam upřesňuje zdravotní historie, obvod pasu a další údaje.',
      next: 'Pro zdravotní rozhodnutí použijte širší odborné posouzení a nespoléhejte pouze na BMI.'
    };
    if (bmi < 40) return {
      label: 'Obezita II. třídy', badge: 'is-risk',
      note: 'BMI spadá do II. třídy obezity podle standardní klasifikace dospělých.',
      status: 'Výsledek je mezi 35,0 a 39,9',
      text: 'Při BMI 35 a více se poměr pasu k výšce nepoužívá jako hlavní doplňková klasifikace. Rozhoduje širší kontext.',
      next: 'Výsledek je vhodné probrat v rámci odborného zdravotního posouzení.'
    };
    return {
      label: 'Obezita III. třídy', badge: 'is-risk',
      note: 'BMI je 40 nebo vyšší a spadá do III. třídy obezity.',
      status: 'Výsledek je 40 nebo vyšší',
      text: 'BMI samo neurčuje diagnózu ani osobní postup, ale tato kategorie vyžaduje širší zdravotní kontext.',
      next: 'Pro další rozhodování vyhledejte kvalifikované odborné zdravotní posouzení.'
    };
  }

  function waistInfo(waist, height, bmi) {
    if (waist === null) return {
      short: 'nezadáno', detail: 'Obvod pasu nebyl zadán.',
      sentence: 'Volitelný obvod pasu může doplnit pohled na centrální adipositu.'
    };
    const ratio = waist / height;
    let label;
    if (ratio < 0.4) label = 'pod 0,40 – nízký poměr';
    else if (ratio < 0.5) label = '0,40–0,49 – bez zvýšení';
    else if (ratio < 0.6) label = '0,50–0,59 – zvýšený';
    else label = '0,60+ – vysoký';
    const caveat = bmi >= 35
      ? ' Při BMI 35 a více NICE tento poměr nepoužívá jako hlavní doplňkovou klasifikaci.'
      : ' Orientační pravidlo doporučuje držet pas pod polovinou výšky.';
    return {
      ratio,
      short: `${number(ratio, 2)} · ${label}`,
      detail: `${number(ratio, 2)} (${label})`,
      sentence: `Poměr pasu ${number(ratio, 2)} vychází z ${compact(waist, 1)} cm ÷ ${compact(height, 1)} cm.${caveat}`
    };
  }

  function distanceText(weight, min, max) {
    if (weight < min) return `${kg(min - weight)} pod dolní hranicí`;
    if (weight > max) return `${kg(weight - max)} nad horní hranicí`;
    const toMin = weight - min;
    const toMax = max - weight;
    return toMin <= toMax ? `${kg(toMin)} k dolní hranici` : `${kg(toMax)} k horní hranici`;
  }

  function gaugePosition(bmi) {
    return Math.max(2, Math.min(98, ((bmi - 15) / 30) * 100));
  }

  function calculate(v) {
    const heightM = v.height / 100;
    const bmi = v.weight / (heightM * heightM);
    return {
      bmi,
      min: 18.5 * heightM * heightM,
      max: 24.9 * heightM * heightM,
      category: category(bmi),
      waist: waistInfo(v.waist, v.height, bmi)
    };
  }

  function row(name, value, meaning) {
    return `<tr><td>${name}</td><td><strong>${value}</strong></td><td>${meaning}</td></tr>`;
  }

  function render(v, r) {
    const bmiText = number(r.bmi, 1);
    const rangeText = `${kg(r.min)}–${kg(r.max)}`;
    const formulaText = `${compact(v.weight, 1)} ÷ ${number(v.height / 100, 2)}²`;
    const needle = `${gaugePosition(r.bmi)}%`;
    const difference = distanceText(v.weight, r.min, r.max);

    errorBox.hidden = true;
    out.heroBmi.textContent = bmiText;
    out.heroCategory.textContent = r.category.label;
    out.heroHeight.textContent = `${compact(v.height, 1)} cm`;
    out.heroWeight.textContent = kg(v.weight);
    out.heroRange.textContent = rangeText;
    out.heroNeedle.style.left = needle;
    out.heroWaist.textContent = v.waist === null ? 'BMI je screening, ne diagnóza' : `Pas / výška: ${number(r.waist.ratio, 2)}`;
    out.heroFormula.textContent = `${formulaText} = ${bmiText}`;

    out.resultBadge.className = `badge ${r.category.badge}`.trim();
    out.resultBadge.textContent = r.category.label;
    out.bmiResult.textContent = bmiText;
    out.resultNote.textContent = r.category.note;
    out.bmiGaugeBar.style.left = needle;
    out.categoryResult.textContent = r.category.label;
    out.rangeResult.textContent = rangeText;
    out.differenceResult.textContent = difference;
    out.waistRatioResult.textContent = r.waist.short;
    out.interpretStatus.textContent = r.category.status;
    out.interpretText.textContent = r.category.text;
    out.decisionSummary.textContent = r.waist.sentence;
    out.nextActionText.textContent = r.category.next;

    out.readingTitle.textContent = `BMI ${bmiText} patří do kategorie „${r.category.label}“.`;
    out.readingText.textContent = `Pro výšku ${compact(v.height, 1)} cm odpovídá standardnímu referenčnímu pásmu přibližně ${rangeText}. ${r.waist.sentence}`;
    out.heightResult.textContent = `${compact(v.height, 1)} cm`;
    out.weightResult.textContent = kg(v.weight);
    out.normalMinResult.textContent = kg(r.min);
    out.normalMaxResult.textContent = kg(r.max);
    out.formulaResult.textContent = formulaText;
    out.waistDetailResult.textContent = r.waist.detail;
    out.summaryTableBody.innerHTML = [
      row('BMI', bmiText, 'Hmotnost v kg dělená druhou mocninou výšky v metrech.'),
      row('Kategorie pro dospělé', r.category.label, 'Standardní screeningová klasifikace; nejde o diagnózu.'),
      row('Referenční hmotnostní pásmo', rangeText, 'Přepočet BMI 18,5 až 24,9 pro zadanou výšku.'),
      row('Vzdálenost k pásmu', difference, 'Matematická vzdálenost k nejbližší hranici, ne osobní cíl.'),
      row('Poměr pasu k výšce', r.waist.detail, r.waist.sentence)
    ].join('');
  }

  function renderError(message) {
    errorBox.textContent = message;
    errorBox.hidden = false;
    out.resultBadge.className = 'badge is-high';
    out.resultBadge.textContent = 'Zkontrolujte vstup';
    out.resultNote.textContent = message;
  }

  function run() {
    const v = values();
    const error = validate(v);
    if (error) {
      renderError(error);
      return false;
    }
    render(v, calculate(v));
    return true;
  }

  function convertImperial() {
    const feet = Number(feetInput.value);
    const inches = Number(inchesInput.value || 0);
    const pounds = Number(poundsInput.value);
    if (!Number.isFinite(feet) || feet < 3 || feet > 8 || !Number.isFinite(inches) || inches < 0 || inches >= 12 || !Number.isFinite(pounds) || pounds < 55 || pounds > 770) {
      conversionNote.textContent = 'Zadejte 3–8 stop, 0–11,9 palce a 55–770 liber.';
      return;
    }
    const centimeters = (feet * 12 + inches) * 2.54;
    const kilograms = pounds * 0.45359237;
    heightInput.value = centimeters.toFixed(1);
    weightInput.value = kilograms.toFixed(1);
    conversionNote.textContent = `Převedeno na ${number(centimeters, 1)} cm a ${number(kilograms, 1)} kg.`;
    run();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    run();
  });
  [heightInput, weightInput, waistInput].forEach((input) => {
    input.addEventListener('input', run);
    input.addEventListener('change', run);
  });
  $('convertImperialBtn').addEventListener('click', convertImperial);
  $('resetBtn').addEventListener('click', () => {
    heightInput.value = '180';
    weightInput.value = '80';
    waistInput.value = '';
    feetInput.value = '';
    inchesInput.value = '';
    poundsInput.value = '';
    conversionNote.textContent = '';
    advanced.open = false;
    run();
  });

  run();
})();
