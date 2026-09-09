/* Wallpaper model v1. Integer millimetres; no DOM. See audits/tapety/MODEL_AND_EXPECTED.md. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RVTapety = api;
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';
  const limits = Object.freeze({ walls: 30, strips: 500, length: 100000, width: 10000, trim: 1000 });
  // No implicit rounding: cm supports tenths; metres support thousandths (1 mm).
  function parseLength(raw, unit) {
    const text = String(raw ?? '').trim();
    if (!text) return { kind: 'empty', message: 'Vyplňte hodnotu.' };
    const digits = unit === 'm' ? 3 : unit === 'cm' ? 1 : null;
    if (digits === null) return { kind: 'invalid', message: 'Neznámá jednotka.' };
    if (text.length > 40 || !/^[+-]?(?:\d+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+)(?:[.,]\d+)?$/.test(text))
      return { kind: 'invalid', message: 'Zadejte číslo, například 2,5. Nemíchejte čárku a tečku.' };
    const clean = text.replace(/[ \u00a0\u202f]/g, '').replace(',', '.');
    const [whole, fraction = ''] = clean.replace(/^[+-]/, '').split('.');
    if (/[1-9]/.test(fraction.slice(digits))) return { kind: 'invalid', message: `Zadejte nejvýše ${digits === 1 ? '1 desetinné místo' : '3 desetinná místa'} (přesnost 1 mm).` };
    const value = (Number(whole) * 10 ** digits + Number(fraction.slice(0, digits).padEnd(digits, '0'))) * (clean.startsWith('-') ? -1 : 1);
    if (!Number.isSafeInteger(value)) return { kind: 'invalid', message: 'Hodnota je příliš velká.' };
    return { kind: 'valid', value };
  }
  function parse(raw) {
    const fields = {}, errors = {}, kinds = {};
    function read(id, value, unit) {
      const parsed = parseLength(value, unit); kinds[id] = parsed.kind;
      if (parsed.kind === 'valid') fields[id] = parsed.value;
      else errors[id] = parsed.message;
    }
    read('height', raw.height, 'm'); read('rollWidth', raw.rollWidth, 'cm'); read('rollLength', raw.rollLength, 'm');
    read('trimTop', raw.trimTop, 'cm'); read('trimBottom', raw.trimBottom, 'cm');
    const patterned = raw.match !== 'free';
    if (patterned) read('repeat', raw.repeat, 'cm');
    if (raw.match === 'offset') read('offset', raw.offset, 'cm');
    const walls = Array.isArray(raw.walls) ? raw.walls : [];
    walls.forEach((wall, i) => {
      read(`wall-${i}-width`, wall.width, 'm');
      if (wall.customHeight) read(`wall-${i}-height`, wall.height, 'm');
    });
    if (Object.keys(errors).length) return { state: Object.values(kinds).includes('invalid') ? 'invalid' : 'empty', errors };
    return { state: 'parsed', value: {
      height: fields.height, rollWidth: fields.rollWidth, rollLength: fields.rollLength,
      trimTop: fields.trimTop, trimBottom: fields.trimBottom,
      match: raw.match, repeat: patterned ? fields.repeat : 0,
      offset: raw.match === 'offset' ? fields.offset : 0,
      aligned: raw.aligned === true, openings: raw.openings === true,
      walls: walls.map((w, i) => ({ width: fields[`wall-${i}-width`], height: w.customHeight ? fields[`wall-${i}-height`] : fields.height }))
    } };
  }
  function validate(v) {
    const errors = {};
    function range(id, n, min, max, message) {
      if (!Number.isSafeInteger(n) || n < min || n > max) errors[id] = message;
    }
    range('height', v.height, 1, limits.length, 'Výška musí být 0,001 až 100 m.');
    range('rollWidth', v.rollWidth, 1, limits.width, 'Využitelná šířka role musí být 0,1 až 1 000 cm.');
    range('rollLength', v.rollLength, 1, limits.length, 'Délka role musí být 0,001 až 100 m.');
    range('trimTop', v.trimTop, 0, limits.trim, 'Horní ořez musí být 0 až 100 cm.');
    range('trimBottom', v.trimBottom, 0, limits.trim, 'Dolní ořez musí být 0 až 100 cm.');
    if (!['free', 'straight', 'offset'].includes(v.match)) errors.match = 'Vyberte způsob sesazení.';
    if (v.match !== 'free') range('repeat', v.repeat, 1, limits.length, 'Raport musí být 0,1 až 10 000 cm.');
    if (v.match === 'offset') range('offset', v.offset, 1, v.repeat - 1, 'Posun musí být větší než 0 a menší než raport.');
    if (!Array.isArray(v.walls) || !v.walls.length || v.walls.length > limits.walls) errors.walls = 'Zadejte 1 až 30 stěn.';
    (v.walls || []).forEach((w, i) => {
      range(`wall-${i}-width`, w.width, 1, limits.length, 'Šířka stěny musí být 0,001 až 100 m.');
      range(`wall-${i}-height`, w.height, 1, limits.length, 'Výška stěny musí být 0,001 až 100 m.');
    });
    if (!Object.keys(errors).length && v.walls.reduce((n, w) => n + Math.ceil(w.width / v.rollWidth), 0) > limits.strips)
      errors.walls = 'Plán podporuje nejvýše 500 pásů. Zkontrolujte jednotky nebo rozdělte projekt.';
    return Object.keys(errors).length ? { state: 'invalid', errors } : { state: 'validated', value: v };
  }
  const mod = (n, r) => ((n % r) + r) % r;
  function packSimple(items, capacity, nodeBudget = 120000) {
    const sorted = items.slice().sort((a, b) => b.length - a.length || a.wall - b.wall || a.index - b.index);
    const heuristic = [];
    for (const item of sorted) {
      let best = -1, bestRemain = Infinity;
      for (let i = 0; i < heuristic.length; i++) {
        const remain = capacity - heuristic[i].used;
        if (item.length <= remain && remain - item.length < bestRemain) { best = i; bestRemain = remain - item.length; }
      }
      if (best < 0) heuristic.push({ used: item.length, items: [item] });
      else { heuristic[best].used += item.length; heuristic[best].items.push(item); }
    }
    const total = sorted.reduce((n, item) => n + item.length, 0);
    const lowerBound = Math.max(1, Math.ceil(total / capacity));
    if (heuristic.length === lowerBound) return { bins: heuristic.map(b => b.items), optimal: true, lowerBound, method: 'lower-bound' };
    if (sorted.length > 24) return { bins: heuristic.map(b => b.items), optimal: false, lowerBound, method: 'best-fit-decreasing' };

    let budget = nodeBudget;
    function tryBins(target) {
      const bins = Array.from({ length: target }, () => ({ used: 0, items: [] }));
      function dfs(pos) {
        if (--budget < 0) return 'budget';
        if (pos === sorted.length) return true;
        const item = sorted[pos];
        const seen = new Set();
        for (let i = 0; i < bins.length; i++) {
          const remain = capacity - bins[i].used;
          if (item.length > remain || seen.has(remain)) continue;
          seen.add(remain);
          bins[i].used += item.length; bins[i].items.push(item);
          const result = dfs(pos + 1);
          if (result === true) return true;
          bins[i].items.pop(); bins[i].used -= item.length;
          if (result === 'budget') return 'budget';
          if (bins[i].used === 0) break;
        }
        return false;
      }
      const result = dfs(0);
      return { result, bins: result === true ? bins.map(b => b.items.slice()) : null };
    }
    for (let target = lowerBound; target < heuristic.length; target++) {
      const attempt = tryBins(target);
      if (attempt.result === true) return { bins: attempt.bins, optimal: true, lowerBound, method: 'exact' };
      if (attempt.result === 'budget') return { bins: heuristic.map(b => b.items), optimal: false, lowerBound, method: 'best-fit-decreasing' };
    }
    return { bins: heuristic.map(b => b.items), optimal: true, lowerBound, method: 'exact-proof' };
  }
  function calculate(v) {
    const checked = validate(v);
    if (checked.state !== 'validated') return checked;
    const r = v.match === 'free' ? 0 : v.repeat;
    if (r > v.rollLength) return { state: 'unavailable', message: 'Raport je delší než role. Pro tento model nelze sestavit řezný plán.' };
    const allowance = r && !v.aligned ? r : 0;
    const rolls = [], strips = [], wallSummary = [], pending = [];
    for (let i = 0; i < v.walls.length; i++) {
      const wall = v.walls[i], count = Math.ceil(wall.width / v.rollWidth);
      const base = wall.height + v.trimTop + v.trimBottom;
      const length = r ? Math.ceil(base / r) * r : base;
      wallSummary.push({ wall: i + 1, count, base, length, width: wall.width, height: wall.height, lastWidth: wall.width - (count - 1) * v.rollWidth });
      for (let j = 0; j < count; j++) {
        const phase = v.match === 'offset' ? mod(j * v.offset, r) : 0;
        if (allowance + phase + length > v.rollLength) return {
          state: 'unavailable', message: `Stěna ${i + 1}, pás ${j + 1}: řez ${format(length)} cm${r ? ` + dorovnání až ${format(allowance + phase)} cm` : ''} se do role ${format(v.rollLength)} cm nevejde. Ověřte výšku, délku role a sesazení${allowance ? '; případně potvrďte shodný počátek rolí, pokud jste jej skutečně ověřili' : ''}.`
        };
        pending.push({ id: `${i + 1}.${j + 1}`, wall: i + 1, index: j + 1, phase, base, length });
      }
    }

    let optimal = false, lowerBound = 1, packingMethod = 'phase-aware-first-fit';
    const capacity = v.rollLength - allowance;
    if (v.match === 'free' || v.match === 'straight') {
      const packed = packSimple(pending, capacity);
      optimal = packed.optimal; lowerBound = packed.lowerBound; packingMethod = packed.method;
      packed.bins.forEach((items, ri) => {
        const roll = { number: ri + 1, allowance, used: 0, cuts: [] };
        for (const item of items) {
          const strip = { ...item, gap: 0, start: roll.used, roll: roll.number };
          roll.cuts.push(strip); strips.push(strip); roll.used += item.length;
        }
        rolls.push(roll);
      });
    } else {
      for (const item of pending) {
        let roll, gap;
        for (const candidate of rolls) {
          const g = mod(item.phase - candidate.used, r);
          if (candidate.used + g + item.length <= capacity) { roll = candidate; gap = g; break; }
        }
        if (!roll) { roll = { number: rolls.length + 1, allowance, used: 0, cuts: [] }; rolls.push(roll); gap = item.phase; }
        const strip = { ...item, gap, start: roll.used + gap, roll: roll.number };
        roll.cuts.push(strip); strips.push(strip); roll.used += gap + item.length;
      }
      lowerBound = Math.max(1, Math.ceil(pending.reduce((n, item) => n + item.length, 0) / capacity));
      optimal = rolls.length === lowerBound;
    }
    rolls.forEach(roll => { roll.leftover = v.rollLength - allowance - roll.used; });
    return { state: 'valid', value: { input: v, rolls, strips, wallSummary, optimal, lowerBound, packingMethod,
      totalCut: strips.reduce((n, s) => n + s.length, 0),
      repeatExtra: strips.reduce((n, s) => n + s.length - s.base, 0),
      alignmentWaste: strips.reduce((n, s) => n + s.gap, 0),
      startAllowance: rolls.length * allowance,
      trimTotal: strips.length * (v.trimTop + v.trimBottom),
      totalLeftover: rolls.reduce((n, roll) => n + roll.leftover, 0)
    } };
  }
  function run(raw) { const p = parse(raw); return p.state === 'parsed' ? calculate(p.value) : p; }
  function format(mm, unit = 'cm') { return (mm / (unit === 'm' ? 1000 : 10)).toLocaleString('cs-CZ', { maximumFractionDigits: unit === 'm' ? 3 : 1 }); }
  return Object.freeze({ parseLength, parse, validate, calculate, run, format, limits });
});
