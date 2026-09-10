(function () {
  'use strict';

  const Core = window.RVSlopeCore;
  if (!Core) return;

  const $ = (id) => document.getElementById(id);
  let mode = 'slope';
  let unit = 'percent';

  const fmt = (value, digits) => Number(value).toLocaleString('cs-CZ', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function unitCopy(currentUnit) {
    return {
      percent: ['%', 'v %', '2 % znamenají 2 cm převýšení na každý 1 m vodorovně.'],
      degree: ['°', 've stupních', 'Úhel je měřený vůči vodorovné rovině a musí být menší než 90°.'],
      ratio: ['', 'jako 1 : x', 'Zadejte pouze x. Například 50 znamená poměr 1 : 50.'],
      cmm: ['cm/m', 'v cm/m', '1 cm/m odpovídá 1 %; například 20 mm/m = 2 cm/m = 2 %.']
    }[currentUnit];
  }

  function valueForUnit(slopeRatio, targetUnit) {
    if (!Number.isFinite(slopeRatio) || slopeRatio < 0) return null;
    if (targetUnit === 'percent') return slopeRatio * 100;
    if (targetUnit === 'degree') return Math.atan(slopeRatio) * 180 / Math.PI;
    if (targetUnit === 'ratio') return slopeRatio === 0 ? null : 1 / slopeRatio;
    if (targetUnit === 'cmm') return slopeRatio * 100;
    return null;
  }

  function inputModel() {
    return {
      mode,
      runM: Core.parseCzechNumber($('run').value),
      riseCm: Core.parseCzechNumber($('rise').value),
      slopeValue: Core.parseCzechNumber($('slopeValue').value),
      slopeUnit: unit
    };
  }

  function clearErrors() {
    ['run', 'rise', 'slopeValue'].forEach((id) => $(id).removeAttribute('aria-invalid'));
    ['runError', 'riseError', 'slopeError'].forEach((id) => {
      const el = $(id);
      el.hidden = true;
      el.textContent = '';
    });
  }

  function showError(result) {
    clearErrors();
    const mapping = {
      run: ['run', 'runError'],
      rise: ['rise', 'riseError'],
      slope: ['slopeValue', 'slopeError']
    };
    if (mapping[result.field]) {
      const [inputId, errorId] = mapping[result.field];
      $(inputId).setAttribute('aria-invalid', 'true');
      $(errorId).textContent = result.message;
      $(errorId).hidden = false;
    }

    document.querySelector('.result-card').dataset.state = 'invalid';
    $('resultHeadline').textContent = 'Zkontrolujte zadání';
    $('resultHint').textContent = result.message || 'Některý vstup není platný.';
    ['kpiPct', 'kpiDeg', 'kpiRatio', 'kpiCmm', 'kpiHyp'].forEach((id) => $(id).textContent = '—');
    $('formula').innerHTML = '<b>Výsledek byl zneplatněn.</b> Opravte označený vstup; starý výsledek nezůstává aktivní.';
    $('status').textContent = 'Výsledek není platný. ' + (result.message || 'Zkontrolujte zadání.');
  }

  function updateGeometry(result) {
    const visualDegrees = clamp(result.degree, 3, 31);
    $('diagHyp').style.transform = `rotate(${-visualDegrees}deg)`;
    $('heroHyp').style.transform = `rotate(${-visualDegrees}deg)`;

    $('runLab').textContent = fmt(result.runM, 2) + ' m';
    $('riseLab').textContent = fmt(result.riseCm, 1) + ' cm';
    $('angleLab').textContent = fmt(result.degree, 2) + '°';

    $('heroRun').textContent = fmt(result.runM, 2) + ' m';
    $('heroRise').textContent = fmt(result.riseCm, 0) + ' cm';
    $('heroAngle').textContent = fmt(result.degree, 2) + '°';
    $('heroPct').textContent = fmt(result.percent, 1) + ' %';
    $('heroDeg').textContent = fmt(result.degree, 2) + '°';
    $('heroRatio').textContent = Number.isFinite(result.ratioValue) ? '1 : ' + fmt(result.ratioValue, 1) : 'rovina';
    $('heroCmm').textContent = fmt(result.cmPerM, 1) + ' cm/m';

    $('meaningTitle').textContent = `Co znamená ${fmt(result.percent, 1)} % v praxi?`;
    $('meaningText').textContent = `Na každém 1 m vodorovné vzdálenosti se výška změní o ${fmt(result.cmPerM, 1)} cm. Na ${fmt(result.runM, 2)} m je to ${fmt(result.riseCm, 1)} cm.`;
  }

  function renderResult(result) {
    clearErrors();
    document.querySelector('.result-card').dataset.state = 'valid';

    if (result.mode === 'slope') {
      $('resultHeadline').innerHTML = `Sklon je <strong>${fmt(result.percent, 1)} %</strong>`;
      $('resultHint').textContent = `Na ${fmt(result.runM, 2)} m vodorovné vzdálenosti odpovídá převýšení ${fmt(result.riseCm, 1)} cm.`;
      $('formula').innerHTML = `<b>Výpočet:</b> ${fmt(result.riseCm, 1)} cm ÷ ${fmt(result.runM * 100, 0)} cm × 100 = ${fmt(result.percent, 1)} %. Úhel = arctan(${fmt(result.slopeRatio, 4)}) = ${fmt(result.degree, 2)}°.`;
    } else if (result.mode === 'rise') {
      $('resultHeadline').innerHTML = `Převýšení je <strong>${fmt(result.riseCm, 1)} cm</strong>`;
      $('resultHint').textContent = `Při vodorovné vzdálenosti ${fmt(result.runM, 2)} m a sklonu ${fmt(result.percent, 1)} %.`;
      $('formula').innerHTML = `<b>Výpočet:</b> ${fmt(result.runM, 2)} m × ${fmt(result.percent, 2)} % = ${fmt(result.riseCm, 1)} cm převýšení.`;
    } else {
      $('resultHeadline').innerHTML = `Vzdálenost je <strong>${fmt(result.runM, 2)} m</strong>`;
      $('resultHint').textContent = `Pro převýšení ${fmt(result.riseCm, 1)} cm při sklonu ${fmt(result.percent, 1)} %.`;
      $('formula').innerHTML = `<b>Výpočet:</b> ${fmt(result.riseCm / 100, 3)} m ÷ ${fmt(result.slopeRatio, 4)} = ${fmt(result.runM, 2)} m vodorovné vzdálenosti.`;
    }

    $('kpiPct').textContent = fmt(result.percent, 1) + ' %';
    $('kpiDeg').textContent = fmt(result.degree, 2) + '°';
    $('kpiRatio').textContent = Number.isFinite(result.ratioValue) ? '1 : ' + fmt(result.ratioValue, 1) : 'rovina';
    $('kpiCmm').textContent = fmt(result.cmPerM, 1) + ' cm/m';
    $('kpiHyp').textContent = fmt(result.hypotenuseM, 2) + ' m';

    updateGeometry(result);
    $('status').textContent = 'Výsledek byl přepočítán.';
  }

  function calculate(scrollToResult) {
    const result = Core.calculate(inputModel());
    if (!result.ok) {
      showError(result);
      return false;
    }
    renderResult(result);
    if (scrollToResult) {
      document.querySelector('.results').scrollIntoView({ behavior: 'smooth', block: 'start' });
      $('resultHeadline').focus({ preventScroll: true });
    }
    return true;
  }

  function setMode(nextMode) {
    mode = nextMode;
    document.querySelectorAll('[data-mode]').forEach((button) => {
      button.classList.toggle('active', button.dataset.mode === mode);
      button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    });

    $('slopeBlock').hidden = mode === 'slope';
    $('runField').hidden = mode === 'run';
    $('riseField').hidden = mode === 'rise';

    if (mode === 'slope') {
      $('inputTitle').textContent = 'Zadejte dvě známé hodnoty';
      $('inputSub').textContent = 'U sklonu v % používáme vodorovnou vzdálenost, ne délku po šikmině.';
    } else if (mode === 'rise') {
      $('inputTitle').textContent = 'Zadejte vzdálenost a požadovaný sklon';
      $('inputSub').textContent = 'Dopočítáme celkový výškový rozdíl na zadané vodorovné délce.';
    } else {
      $('inputTitle').textContent = 'Zadejte převýšení a požadovaný sklon';
      $('inputSub').textContent = 'Dopočítáme potřebnou vodorovnou vzdálenost.';
    }
    calculate(false);
  }

  function setUnit(nextUnit, convertExisting) {
    if (nextUnit === unit) return;
    if (convertExisting) {
      const oldValue = Core.parseCzechNumber($('slopeValue').value);
      const oldRatio = Core.slopeToRatio(oldValue, unit);
      const converted = valueForUnit(oldRatio, nextUnit);
      if (converted !== null && Number.isFinite(converted)) {
        $('slopeValue').value = String(Math.round(converted * 10000) / 10000).replace('.', ',');
      }
    }

    unit = nextUnit;
    document.querySelectorAll('[data-unit]').forEach((button) => {
      button.classList.toggle('active', button.dataset.unit === unit);
      button.setAttribute('aria-pressed', String(button.dataset.unit === unit));
    });

    const [symbol, label, help] = unitCopy(unit);
    $('slopeUnit').textContent = symbol;
    $('slopeLabelUnit').textContent = label;
    $('slopeHelp').textContent = help;
    $('presets').hidden = unit !== 'percent';
    calculate(false);
  }

  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });
  document.querySelectorAll('[data-unit]').forEach((button) => {
    button.addEventListener('click', () => setUnit(button.dataset.unit, true));
  });
  document.querySelectorAll('[data-value]').forEach((button) => {
    button.addEventListener('click', () => {
      unit = 'percent';
      document.querySelectorAll('[data-unit]').forEach((unitButton) => {
        unitButton.classList.toggle('active', unitButton.dataset.unit === unit);
        unitButton.setAttribute('aria-pressed', String(unitButton.dataset.unit === unit));
      });
      const [symbol, label, help] = unitCopy(unit);
      $('slopeUnit').textContent = symbol;
      $('slopeLabelUnit').textContent = label;
      $('slopeHelp').textContent = help;
      $('presets').hidden = false;
      $('slopeValue').value = button.dataset.value.replace('.', ',');
      calculate(false);
    });
  });

  ['run', 'rise', 'slopeValue'].forEach((id) => {
    $(id).addEventListener('input', () => calculate(false));
  });

  $('calcBtn').addEventListener('click', () => calculate(true));
  $('resetBtn').addEventListener('click', () => {
    $('run').value = '6';
    $('rise').value = '30';
    $('slopeValue').value = '2';
    unit = 'percent';
    document.querySelectorAll('[data-unit]').forEach((button) => {
      button.classList.toggle('active', button.dataset.unit === unit);
      button.setAttribute('aria-pressed', String(button.dataset.unit === unit));
    });
    const [symbol, label, help] = unitCopy(unit);
    $('slopeUnit').textContent = symbol;
    $('slopeLabelUnit').textContent = label;
    $('slopeHelp').textContent = help;
    $('presets').hidden = false;
    setMode('slope');
    $('run').focus();
  });

  document.querySelectorAll('[data-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  document.querySelectorAll('[data-unit]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.unit === unit)));
  calculate(false);
})();
