(function (root) {
  'use strict';

  const EPS = 1e-12;

  function isFiniteNumber(value) {
    return typeof value === 'number' && Number.isFinite(value);
  }

  function parseCzechNumber(value) {
    if (typeof value === 'number') return Number.isFinite(value) ? value : NaN;
    if (typeof value !== 'string') return NaN;
    const normalized = value
      .trim()
      .replace(/[\u00A0\u202F\s]/g, '')
      .replace(',', '.');
    if (!normalized || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return NaN;
    const result = Number(normalized);
    return Number.isFinite(result) ? result : NaN;
  }

  function slopeToRatio(value, unit) {
    if (!isFiniteNumber(value) || value < 0) return NaN;
    switch (unit) {
      case 'percent':
        return value / 100;
      case 'degree':
        if (value >= 90) return NaN;
        return Math.tan(value * Math.PI / 180);
      case 'ratio':
        return value > 0 ? 1 / value : NaN;
      case 'cmm':
        return value / 100;
      default:
        return NaN;
    }
  }

  function equivalents(slopeRatio) {
    if (!isFiniteNumber(slopeRatio) || slopeRatio < 0) return null;
    return {
      ratioValue: slopeRatio <= EPS ? Infinity : 1 / slopeRatio,
      percent: slopeRatio * 100,
      degree: Math.atan(slopeRatio) * 180 / Math.PI,
      cmPerM: slopeRatio * 100
    };
  }

  function calculate(input) {
    if (!input || !['slope', 'rise', 'run'].includes(input.mode)) {
      return { ok: false, field: 'mode', message: 'Vyberte, co chcete spočítat.' };
    }

    let runM = input.runM;
    let riseCm = input.riseCm;
    let slopeRatio;

    if (input.mode === 'slope') {
      if (!isFiniteNumber(runM) || runM <= 0) {
        return { ok: false, field: 'run', message: 'Zadejte vodorovnou vzdálenost větší než 0.' };
      }
      if (!isFiniteNumber(riseCm) || riseCm < 0) {
        return { ok: false, field: 'rise', message: 'Zadejte převýšení 0 nebo vyšší.' };
      }
      slopeRatio = (riseCm / 100) / runM;
    } else {
      slopeRatio = slopeToRatio(input.slopeValue, input.slopeUnit);
      if (!isFiniteNumber(slopeRatio) || slopeRatio < 0) {
        const degreeMessage = input.slopeUnit === 'degree'
          ? 'Zadejte úhel od 0° do méně než 90°.'
          : input.slopeUnit === 'ratio'
            ? 'U poměru 1 : x zadejte x větší než 0.'
            : 'Zadejte platnou nezápornou hodnotu sklonu.';
        return { ok: false, field: 'slope', message: degreeMessage };
      }

      if (input.mode === 'rise') {
        if (!isFiniteNumber(runM) || runM <= 0) {
          return { ok: false, field: 'run', message: 'Zadejte vodorovnou vzdálenost větší než 0.' };
        }
        riseCm = runM * slopeRatio * 100;
      } else {
        if (!isFiniteNumber(riseCm) || riseCm < 0) {
          return { ok: false, field: 'rise', message: 'Zadejte převýšení 0 nebo vyšší.' };
        }
        if (slopeRatio <= EPS) {
          return { ok: false, field: 'slope', message: 'Pro výpočet vzdálenosti musí být sklon větší než 0.' };
        }
        runM = (riseCm / 100) / slopeRatio;
      }
    }

    if (!isFiniteNumber(runM) || runM < 0 || !isFiniteNumber(riseCm) || riseCm < 0 || !isFiniteNumber(slopeRatio) || slopeRatio < 0) {
      return { ok: false, field: 'general', message: 'Zadané hodnoty nelze bezpečně přepočítat.' };
    }

    const eq = equivalents(slopeRatio);
    const riseM = riseCm / 100;
    const hypotenuseM = Math.hypot(runM, riseM);

    return {
      ok: true,
      mode: input.mode,
      runM,
      riseCm,
      slopeRatio,
      hypotenuseM,
      ...eq
    };
  }

  root.RVSlopeCore = Object.freeze({ parseCzechNumber, slopeToRatio, equivalents, calculate });
})(typeof window !== 'undefined' ? window : globalThis);
