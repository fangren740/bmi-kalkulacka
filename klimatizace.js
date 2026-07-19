(() => {
  'use strict';

  const $ = selector => document.querySelector(selector);
  const $$ = selector => Array.from(document.querySelectorAll(selector));
  const form = $('#acForm');
  if (!form) return;

  const ids = [
    'devicePreset', 'powerW', 'hoursPerDay', 'daysPerMonth', 'pricePerKwh',
    'loadFactor', 'seasonDays', 'unitsCount', 'standbyPower', 'monthlyLimit',
    'optimizationPercent', 'rememberInput'
  ];
  const fields = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const STORAGE_KEY = 'rv_ac_calculator_v3';
  const numberFormat = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 });
  const integerFormat = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });
  let mode = 'basic';
  let statusTimer;

  const presets = {
    bedroom: { device: '700', hours: 4, days: 25, load: 55, season: 75, standby: 1.5, limit: 500, saving: 12 },
    living: { device: '900', hours: 6, days: 30, load: 65, season: 90, standby: 2, limit: 1000, saving: 15 },
    office: { device: '900', hours: 8, days: 22, load: 55, season: 80, standby: 2, limit: 850, saving: 15 },
    mobile: { device: '1200', hours: 5, days: 30, load: 85, season: 60, standby: 1, limit: 1200, saving: 18 }
  };

  const ranges = {
    powerW: [50, 15000], hoursPerDay: [0.1, 24], daysPerMonth: [1, 31],
    pricePerKwh: [0.01, 100], loadFactor: [10, 100], seasonDays: [1, 365],
    unitsCount: [1, 20], standbyPower: [0, 100], monthlyLimit: [0, 100000],
    optimizationPercent: [0, 80]
  };

  function value(id) {
    const raw = String(fields[id]?.value ?? '').trim().replace(',', '.');
    return Number.parseFloat(raw);
  }

  function clamp(valueToClamp, min, max) {
    return Math.min(max, Math.max(min, valueToClamp));
  }

  function selectedDevice() {
    const option = fields.devicePreset.options[fields.devicePreset.selectedIndex];
    const custom = fields.devicePreset.value === 'custom';
    return {
      custom,
      power: custom ? value('powerW') : Number(fields.devicePreset.value),
      defaultLoad: Number(option?.dataset.load || 65),
      label: option?.textContent?.split('·')[0]?.trim() || 'Klimatizace'
    };
  }

  function validate() {
    const device = selectedDevice();
    const checks = {
      powerW: device.power,
      hoursPerDay: value('hoursPerDay'),
      daysPerMonth: value('daysPerMonth'),
      pricePerKwh: value('pricePerKwh'),
      loadFactor: value('loadFactor'),
      seasonDays: value('seasonDays'),
      unitsCount: value('unitsCount'),
      standbyPower: value('standbyPower'),
      monthlyLimit: value('monthlyLimit'),
      optimizationPercent: value('optimizationPercent')
    };
    for (const [id, numericValue] of Object.entries(checks)) {
      const [min, max] = ranges[id];
      if (!Number.isFinite(numericValue) || numericValue < min || numericValue > max) {
        return { ok: false, message: `Zkontrolujte pole „${labelFor(id)}“. Povolený rozsah je ${min} až ${max}.` };
      }
    }
    return { ok: true };
  }

  function labelFor(id) {
    const labels = {
      powerW: 'vlastní elektrický příkon', hoursPerDay: 'hodiny denně',
      daysPerMonth: 'dny v měsíci', pricePerKwh: 'cena elektřiny',
      loadFactor: 'průměrné zatížení', seasonDays: 'délka sezony',
      unitsCount: 'počet jednotek', standbyPower: 'standby',
      monthlyLimit: 'měsíční limit', optimizationPercent: 'úspornější scénář'
    };
    return labels[id] || id;
  }

  function model() {
    const device = selectedDevice();
    const basic = mode === 'basic';
    const powerW = device.power;
    const hours = value('hoursPerDay');
    const daysMonth = value('daysPerMonth');
    const price = value('pricePerKwh');
    const load = basic ? device.defaultLoad : value('loadFactor');
    const seasonDays = basic ? 90 : value('seasonDays');
    const units = basic ? 1 : Math.round(value('unitsCount'));
    const standbyW = basic ? 0 : value('standbyPower');
    const limit = basic ? 0 : value('monthlyLimit');
    const optimization = basic ? 15 : value('optimizationPercent');
    const effectiveW = powerW * (load / 100) * units;
    const activeHourlyKwh = effectiveW / 1000;
    const activeDailyKwh = activeHourlyKwh * hours;
    const standbyHours = Math.max(0, 24 - hours);
    const standbyDailyKwh = (standbyW / 1000) * standbyHours * units;
    const dailyKwh = activeDailyKwh + standbyDailyKwh;
    const monthlyKwh = dailyKwh * daysMonth;
    const activeSeasonKwh = activeDailyKwh * seasonDays;
    const standbySeasonKwh = standbyDailyKwh * seasonDays;
    const seasonKwh = activeSeasonKwh + standbySeasonKwh;
    const activeHourlyCost = activeHourlyKwh * price;
    const dailyCost = dailyKwh * price;
    const monthlyCost = monthlyKwh * price;
    const seasonCost = seasonKwh * price;
    const savingKwh = seasonKwh * (optimization / 100);
    const savingCost = seasonCost * (optimization / 100);
    const activeShare = seasonKwh > 0 ? (activeSeasonKwh / seasonKwh) * 100 : 100;
    const standbyShare = 100 - activeShare;
    return {
      device, basic, powerW, hours, daysMonth, price, load, seasonDays, units,
      standbyW, limit, optimization, effectiveW, activeHourlyKwh,
      activeDailyKwh, standbyDailyKwh, dailyKwh, monthlyKwh, activeSeasonKwh,
      standbySeasonKwh, seasonKwh, activeHourlyCost, dailyCost, monthlyCost,
      seasonCost, savingKwh, savingCost, activeShare, standbyShare
    };
  }

  const money = (number, decimals = 0) => `${new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(number)} Kč`;
  const kwh = (number, decimals = 1) => `${new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(number)} kWh`;
  const percent = number => `${integerFormat.format(number)} %`;

  function setText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  function setBar(id, percentage) {
    const element = document.getElementById(id);
    if (element) element.style.width = `${clamp(percentage, 0, 100)}%`;
  }

  function addRow(tbody, label, consumption, cost, meaning) {
    const row = document.createElement('tr');
    [label, consumption, cost, meaning].forEach((text, index) => {
      const cell = document.createElement('td');
      if (index === 0 || index === 2) {
        const strong = document.createElement('strong');
        strong.textContent = text;
        cell.append(strong);
      } else {
        cell.textContent = text;
      }
      row.append(cell);
    });
    tbody.append(row);
  }

  function renderBreakdown(result) {
    const tbody = $('#breakdownBody');
    if (!tbody) return;
    tbody.replaceChildren();
    addRow(tbody, '1 hodina aktivního chlazení', kwh(result.activeHourlyKwh, 3), money(result.activeHourlyCost, 2), `${integerFormat.format(result.effectiveW)} W efektivního příkonu`);
    addRow(tbody, 'Typický den', kwh(result.dailyKwh, 2), money(result.dailyCost, 2), `${numberFormat.format(result.hours)} h aktivně + standby`);
    addRow(tbody, 'Zadaný měsíc', kwh(result.monthlyKwh, 1), money(result.monthlyCost, 0), `${integerFormat.format(result.daysMonth)} dnů stejného režimu`);
    addRow(tbody, 'Chladicí sezona', kwh(result.seasonKwh, 1), money(result.seasonCost, 0), `${integerFormat.format(result.seasonDays)} modelových dnů`);
    addRow(tbody, 'Z toho standby', kwh(result.standbySeasonKwh, 2), money(result.standbySeasonKwh * result.price, 0), result.basic ? 'V Basic režimu se nezapočítává' : `${numberFormat.format(result.standbyW)} W mimo aktivní chod`);
    addRow(tbody, 'Úspornější scénář', `−${kwh(result.savingKwh, 1)}`, `−${money(result.savingCost, 0)}`, `Modelové snížení o ${integerFormat.format(result.optimization)} %`);
  }

  function budgetState(result) {
    if (result.basic || result.limit <= 0) {
      return { status: result.basic ? 'Základní režim' : 'Bez nastaveného limitu', difference: result.basic ? 'Limit nastavíte v PRO' : 'Zadejte částku vyšší než nula', ratio: 0 };
    }
    const difference = result.limit - result.monthlyCost;
    const ratio = (result.monthlyCost / result.limit) * 100;
    if (ratio <= 75) return { status: 'S bezpečnou rezervou', difference: `Zbývá ${money(difference, 0)}`, ratio };
    if (ratio <= 100) return { status: 'Blízko nastaveného limitu', difference: `Zbývá ${money(difference, 0)}`, ratio };
    return { status: 'Nad nastaveným limitem', difference: `Překročení ${money(Math.abs(difference), 0)}`, ratio };
  }

  function readingState(result) {
    const monthly = result.monthlyCost;
    if (monthly < 350) return {
      title: 'Chlazení má v modelu nižší měsíční dopad',
      text: `Zadaný režim přidává přibližně ${money(monthly, 0)} za měsíc. Ověřte hlavně, zda hodiny a cena kWh odpovídají skutečnému provozu.`
    };
    if (monthly <= 1000) return {
      title: 'Provoz má zvládnutelný, ale viditelný dopad',
      text: `Model počítá ${integerFormat.format(result.units)} ${result.units === 1 ? 'jednotku' : 'jednotky'}, ${numberFormat.format(result.hours)} hodiny denně a ${integerFormat.format(result.seasonDays)} dnů chlazení. Měsíční účet zvyšuje přibližně o ${money(monthly, 0)}.`
    };
    return {
      title: 'Chlazení už tvoří významnou rozpočtovou položku',
      text: `Měsíční model vychází na ${money(monthly, 0)}. Před rozhodnutím ověřte elektrický příkon, počet jednotek, zatížení a reálné kWh z několika horkých dnů.`
    };
  }

  function render() {
    const validation = validate();
    const error = $('#formError');
    if (!validation.ok) {
      error.textContent = validation.message;
      error.hidden = false;
      return;
    }
    error.hidden = true;
    const result = model();
    const budget = budgetState(result);
    const reading = readingState(result);

    setText('seasonCostResult', money(result.seasonCost, 0));
    setText('hourlyCostResult', money(result.activeHourlyCost, 2));
    setText('dailyCostResult', money(result.dailyCost, 2));
    setText('monthlyCostResult', money(result.monthlyCost, 0));
    setText('seasonKwhResult', kwh(result.seasonKwh, 1));
    setText('effectivePowerResult', `${integerFormat.format(result.effectiveW)} W`);
    setText('dailyKwhResult', kwh(result.dailyKwh, 2));
    setText('monthlyKwhResult', kwh(result.monthlyKwh, 1));
    setText('activeShare', percent(result.activeShare));
    setText('standbyShare', percent(result.standbyShare));
    setBar('activeBar', result.activeShare);
    setBar('standbyBar', Math.max(result.standbyShare, result.standbyShare > 0 ? 2 : 0));
    setText('budgetStatus', budget.status);
    setText('budgetDifference', budget.difference);
    setBar('budgetBar', budget.ratio);
    setText('savingResult', money(result.savingCost, 0));
    setText('savingNote', `Při modelovém snížení spotřeby o ${integerFormat.format(result.optimization)} % (${kwh(result.savingKwh, 1)}).`);
    setText('resultMode', result.basic ? 'Základní režim' : 'PRO režim');
    setText('statusBadge', result.basic ? 'Modelový odhad' : budget.status);
    setText('resultSummary', `Při zvoleném režimu jde přibližně o ${money(result.dailyCost, 0)} za den a ${money(result.monthlyCost, 0)} za zadaný měsíc.`);
    setText('decisionNote', result.basic
      ? 'Basic používá modelové zatížení podle zvoleného typu. Pro vlastní sezonu, více jednotek, standby a rozpočtový limit přepněte na PRO.'
      : `PRO počítá ${integerFormat.format(result.units)} ${result.units === 1 ? 'jednotku' : 'jednotky'}, zatížení ${integerFormat.format(result.load)} % a sezonu ${integerFormat.format(result.seasonDays)} dnů. Výsledek porovnejte s vlastním měřením.`);
    setText('readingTitle', reading.title);
    setText('readingText', reading.text);

    setText('heroSeasonCost', money(result.seasonCost, 0));
    setText('heroSeasonKwh', `${kwh(result.seasonKwh, 0)} · ${integerFormat.format(result.seasonDays)} dnů`);
    setText('heroDailyCost', money(result.dailyCost, 0));
    setText('heroMonthlyCost', money(result.monthlyCost, 0));
    setText('heroEffectivePower', `${integerFormat.format(result.effectiveW)} W`);

    renderBreakdown(result);
    saveIfAllowed();
    return result;
  }

  function syncCustomPower() {
    const custom = fields.devicePreset.value === 'custom';
    $('#customPowerField').hidden = !custom;
    if (!custom) fields.powerW.value = fields.devicePreset.value;
  }

  function setMode(nextMode) {
    mode = nextMode === 'pro' ? 'pro' : 'basic';
    document.body.dataset.mode = mode;
    $('#advancedPanel').hidden = mode !== 'pro';
    $$('[data-mode]').forEach(button => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    setText('modeDescription', mode === 'basic'
      ? 'Základní režim používá čtyři srozumitelné volby. Technické detaily doplní rozumnou modelovou předvolbou.'
      : 'PRO režim dovolí upravit zatížení, sezonu, počet jednotek, standby, rozpočtový limit a úspornější scénář.');
    render();
  }

  function applyPreset(name) {
    const preset = presets[name] || presets.living;
    fields.devicePreset.value = preset.device;
    fields.powerW.value = preset.device;
    fields.hoursPerDay.value = preset.hours;
    fields.daysPerMonth.value = preset.days;
    fields.loadFactor.value = preset.load;
    fields.seasonDays.value = preset.season;
    fields.standbyPower.value = preset.standby;
    fields.monthlyLimit.value = preset.limit;
    fields.optimizationPercent.value = preset.saving;
    fields.unitsCount.value = 1;
    syncCustomPower();
    $$('[data-preset]').forEach(button => button.classList.toggle('is-active', button.dataset.preset === name));
    render();
  }

  function serializableState() {
    return {
      mode,
      devicePreset: fields.devicePreset.value,
      powerW: fields.powerW.value,
      hoursPerDay: fields.hoursPerDay.value,
      daysPerMonth: fields.daysPerMonth.value,
      pricePerKwh: fields.pricePerKwh.value,
      loadFactor: fields.loadFactor.value,
      seasonDays: fields.seasonDays.value,
      unitsCount: fields.unitsCount.value,
      standbyPower: fields.standbyPower.value,
      monthlyLimit: fields.monthlyLimit.value,
      optimizationPercent: fields.optimizationPercent.value
    };
  }

  function saveIfAllowed() {
    try {
      if (fields.rememberInput.checked) localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState()));
      else localStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // Kalkulačka zůstává plně použitelná i při zakázaném úložišti.
    }
  }

  function restoreState() {
    let restored = null;
    try { restored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); } catch (_) { restored = null; }
    if (restored) {
      Object.entries(restored).forEach(([key, saved]) => {
        if (fields[key] && key !== 'rememberInput') fields[key].value = saved;
      });
      fields.rememberInput.checked = true;
      mode = restored.mode === 'pro' ? 'pro' : 'basic';
    }

    const params = new URLSearchParams(location.search);
    const map = {
      d: 'devicePreset', w: 'powerW', h: 'hoursPerDay', dm: 'daysPerMonth',
      p: 'pricePerKwh', l: 'loadFactor', sd: 'seasonDays', u: 'unitsCount',
      sb: 'standbyPower', ml: 'monthlyLimit', op: 'optimizationPercent'
    };
    let hasSharedState = false;
    Object.entries(map).forEach(([param, id]) => {
      if (params.has(param)) {
        fields[id].value = params.get(param);
        hasSharedState = true;
      }
    });
    if (params.get('mode') === 'pro') mode = 'pro';
    if (hasSharedState) fields.rememberInput.checked = false;
    syncCustomPower();
    setMode(mode);
  }

  function shareUrl() {
    const state = serializableState();
    const params = new URLSearchParams();
    const map = {
      devicePreset: 'd', powerW: 'w', hoursPerDay: 'h', daysPerMonth: 'dm',
      pricePerKwh: 'p', loadFactor: 'l', seasonDays: 'sd', unitsCount: 'u',
      standbyPower: 'sb', monthlyLimit: 'ml', optimizationPercent: 'op'
    };
    params.set('mode', mode);
    Object.entries(map).forEach(([key, param]) => params.set(param, state[key]));
    return `${location.origin}${location.pathname}?${params.toString()}#vysledek`;
  }

  async function copyText(text, message) {
    try {
      await navigator.clipboard.writeText(text);
      announce(message);
    } catch (_) {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.append(area);
      area.select();
      document.execCommand('copy');
      area.remove();
      announce(message);
    }
  }

  function resultText() {
    const result = model();
    return [
      'Kalkulačka spotřeby klimatizace – RychléVýpočty.cz',
      `Zařízení: ${result.device.label}`,
      `Režim: ${result.basic ? 'Basic' : 'PRO'}`,
      `Denně: ${kwh(result.dailyKwh, 2)} / ${money(result.dailyCost, 2)}`,
      `Měsíčně: ${kwh(result.monthlyKwh, 1)} / ${money(result.monthlyCost, 0)}`,
      `Sezona: ${kwh(result.seasonKwh, 1)} / ${money(result.seasonCost, 0)}`,
      `Modelová úspora: ${money(result.savingCost, 0)} při ${integerFormat.format(result.optimization)} %`,
      'Výsledek je orientační a závisí na zadaných hodnotách.'
    ].join('\n');
  }

  function announce(message) {
    clearTimeout(statusTimer);
    setText('actionStatus', message);
    statusTimer = window.setTimeout(() => setText('actionStatus', ''), 3500);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const result = render();
    if (result) $('#vysledek').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  form.addEventListener('input', event => {
    if (event.target === fields.devicePreset) return;
    $$('[data-preset]').forEach(button => button.classList.remove('is-active'));
    render();
  });

  fields.devicePreset.addEventListener('change', () => {
    syncCustomPower();
    const option = fields.devicePreset.options[fields.devicePreset.selectedIndex];
    if (option?.dataset.load) fields.loadFactor.value = option.dataset.load;
    $$('[data-preset]').forEach(button => button.classList.remove('is-active'));
    render();
  });

  fields.rememberInput.addEventListener('change', saveIfAllowed);
  $$('[data-mode]').forEach(button => button.addEventListener('click', () => setMode(button.dataset.mode)));
  $$('[data-preset]').forEach(button => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
  $('#resetBtn').addEventListener('click', () => {
    form.reset();
    fields.pricePerKwh.value = '6.50';
    fields.rememberInput.checked = false;
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) { /* bez dopadu */ }
    setMode('basic');
    applyPreset('living');
    announce('Výchozí hodnoty byly obnoveny.');
  });
  $('#copyResultBtn').addEventListener('click', () => copyText(resultText(), 'Výsledek byl zkopírován.'));
  $('#shareBtn').addEventListener('click', () => copyText(shareUrl(), 'Odkaz se zadanými hodnotami byl zkopírován.'));
  $('#printBtn').addEventListener('click', () => window.print());

  restoreState();
})();
