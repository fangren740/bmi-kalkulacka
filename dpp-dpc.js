(() => {
  'use strict';

  const DEFAULTS = {
    dppThreshold: 12000,
    dpcThreshold: 4500,
    minimumHourly: 134.4,
    employeeSocialRate: 7.1,
    employeeHealthRate: 4.5,
    employerSocialRate: 24.8,
    employerHealthRate: 9,
    minimumHealthBase: 22400,
    personalCredit: 2570,
    taxRate: 15,
    highTaxRate: 23,
    highTaxThreshold: 146901
  };

  const state = { mode: 'basic' };
  const $ = (id) => document.getElementById(id);
  const els = {
    form: $('dppDpcForm'), agreement: $('agreementType'), gross: $('grossReward'), same: $('sameEmployerReward'), hours: $('hoursWorked'), declaration: $('signedDeclaration'),
    advanced: $('advancedMode'), healthMode: $('healthMinimumMode'), additionalCredit: $('additionalCredit'), hoursBefore: $('hoursBefore'), relationshipDays: $('relationshipDays'), dpcWeekly: $('dpcWeeklyHours'),
    dppThreshold: $('dppThreshold'), dpcThreshold: $('dpcThreshold'), minimumHourly: $('minimumHourly'), employeeSocialRate: $('employeeSocialRate'), employeeHealthRate: $('employeeHealthRate'), employerSocialRate: $('employerSocialRate'), employerHealthRate: $('employerHealthRate'), minimumHealthBase: $('minimumHealthBase'), personalCredit: $('personalCredit')
  };

  const parseNumber = (value) => {
    const cleaned = String(value ?? '').trim().replace(/\s+/g, '').replace(',', '.').replace(/[^0-9.+-]/g, '');
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : NaN;
  };
  const fmt = (number, digits = 0) => new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(Number.isFinite(number) ? number : 0);
  const money = (number) => `${fmt(Math.round(number), 0)} Kč`;
  const percent = (number, digits = 1) => `${fmt(number, digits)} %`;
  const ceilMoney = (number) => Math.ceil(Math.max(0, number - 1e-9));
  const taxBaseRounded = (gross) => gross <= 100 ? Math.ceil(gross) : Math.ceil(gross / 100) * 100;
  const setText = (id, text) => { const element = $(id); if (element) element.textContent = text; };
  const setDot = (id, kind = 'ok') => { const dot = $(id); if (!dot) return; dot.className = kind === 'warn' ? 'warn' : kind === 'danger' ? 'danger' : ''; };

  function setError(input, message) {
    const field = input.closest('.field');
    if (field) field.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    const target = $(`${input.id}Error`);
    if (target) target.textContent = message || '';
  }

  function readRates() {
    const read = (element, fallback) => {
      const value = parseNumber(element?.value);
      return Number.isFinite(value) && value >= 0 ? value : fallback;
    };
    return {
      dppThreshold: read(els.dppThreshold, DEFAULTS.dppThreshold),
      dpcThreshold: read(els.dpcThreshold, DEFAULTS.dpcThreshold),
      minimumHourly: read(els.minimumHourly, DEFAULTS.minimumHourly),
      employeeSocialRate: read(els.employeeSocialRate, DEFAULTS.employeeSocialRate),
      employeeHealthRate: read(els.employeeHealthRate, DEFAULTS.employeeHealthRate),
      employerSocialRate: read(els.employerSocialRate, DEFAULTS.employerSocialRate),
      employerHealthRate: read(els.employerHealthRate, DEFAULTS.employerHealthRate),
      minimumHealthBase: read(els.minimumHealthBase, DEFAULTS.minimumHealthBase),
      personalCredit: read(els.personalCredit, DEFAULTS.personalCredit),
      taxRate: DEFAULTS.taxRate,
      highTaxRate: DEFAULTS.highTaxRate,
      highTaxThreshold: DEFAULTS.highTaxThreshold
    };
  }

  function validate() {
    const values = {
      agreement: els.agreement.value,
      gross: parseNumber(els.gross.value),
      same: parseNumber(els.same.value),
      hours: parseNumber(els.hours.value),
      declaration: els.declaration.checked,
      healthMode: els.healthMode.value,
      additionalCredit: parseNumber(els.additionalCredit.value),
      hoursBefore: parseNumber(els.hoursBefore.value),
      relationshipDays: parseNumber(els.relationshipDays.value),
      dpcWeekly: parseNumber(els.dpcWeekly.value),
      rates: readRates()
    };
    let valid = true;
    const checks = [
      [els.gross, values.gross, 'Zadejte kladnou hrubou odměnu.', (v) => v > 0],
      [els.same, values.same, 'Další odměna nesmí být záporná.', (v) => v >= 0],
      [els.hours, values.hours, 'Zadejte počet hodin větší než 0.', (v) => v > 0],
      [els.additionalCredit, values.additionalCredit, 'Další sleva nesmí být záporná.', (v) => v >= 0],
      [els.hoursBefore, values.hoursBefore, 'Počet hodin nesmí být záporný.', (v) => v >= 0],
      [els.relationshipDays, values.relationshipDays, 'Délka trvání nesmí být záporná.', (v) => v >= 0],
      [els.dpcWeekly, values.dpcWeekly, 'Týdenní průměr nesmí být záporný.', (v) => v >= 0]
    ];
    checks.forEach(([element, value, message, test]) => {
      const error = !Number.isFinite(value) || !test(value) ? message : '';
      setError(element, error);
      if (error) valid = false;
    });
    return { valid, ...values };
  }

  function calculateModel(totalGross, options, rates) {
    const threshold = options.agreement === 'dpp' ? rates.dppThreshold : rates.dpcThreshold;
    const insured = totalGross >= threshold;
    const employeeSocial = insured ? ceilMoney(totalGross * rates.employeeSocialRate / 100) : 0;
    const regularEmployeeHealth = insured ? ceilMoney(totalGross * rates.employeeHealthRate / 100) : 0;
    const healthSupplement = insured && options.healthMode === 'applies' && totalGross < rates.minimumHealthBase
      ? ceilMoney((rates.minimumHealthBase - totalGross) * 13.5 / 100)
      : 0;
    const employeeHealth = regularEmployeeHealth + healthSupplement;
    const employerSocial = insured ? ceilMoney(totalGross * rates.employerSocialRate / 100) : 0;
    const employerHealth = insured ? ceilMoney(totalGross * rates.employerHealthRate / 100) : 0;

    const belowWithholdingBoundary = totalGross < threshold;
    let taxRegime;
    let taxBeforeCredit;
    let tax;
    if (!options.declaration && belowWithholdingBoundary) {
      taxRegime = 'Srážková daň';
      taxBeforeCredit = Math.floor(totalGross * rates.taxRate / 100);
      tax = taxBeforeCredit;
    } else {
      taxRegime = 'Zálohová daň';
      const base = taxBaseRounded(totalGross);
      const lowerPart = Math.min(base, rates.highTaxThreshold);
      const upperPart = Math.max(0, base - rates.highTaxThreshold);
      taxBeforeCredit = Math.round(lowerPart * rates.taxRate / 100 + upperPart * rates.highTaxRate / 100);
      const credit = options.declaration ? rates.personalCredit + options.additionalCredit : 0;
      tax = Math.max(0, taxBeforeCredit - credit);
    }

    const deductions = employeeSocial + employeeHealth + tax;
    const net = Math.max(0, totalGross - deductions);
    const employerCost = totalGross + employerSocial + employerHealth;
    return { threshold, insured, employeeSocial, regularEmployeeHealth, healthSupplement, employeeHealth, employerSocial, employerHealth, taxRegime, taxBeforeCredit, tax, deductions, net, employerCost };
  }

  function renderInvalid() {
    setText('netResult', '—');
    setText('resultSummary', 'Opravte označené vstupy, aby bylo možné výpočet bezpečně dokončit.');
    ['deductionsResult','netHourlyResult','employerCostResult','thresholdDistanceResult','grossTotalResult','socialResult','healthResult','healthSupplementResult','taxResult','netBreakdownResult'].forEach((id) => setText(id, '—'));
  }

  function statusCopy(values, model, grossHourly, minimumGap, annualHours, vacationCandidate) {
    if (model.insured) {
      setText('insuranceStatus', 'Vzniká');
      const minimumNote = values.healthMode === 'applies' && model.healthSupplement > 0 ? ` Včetně doplatku ${money(model.healthSupplement)} do zdravotního minima.` : values.healthMode === 'unknown' && values.gross + values.same < values.rates.minimumHealthBase ? ' Ověřte, zda se na vás vztahuje zdravotní minimum.' : '';
      setText('insuranceText', `Součet dosáhl rozhodné částky.${minimumNote}`);
      setDot('insuranceDot', values.healthMode === 'unknown' && values.gross + values.same < values.rates.minimumHealthBase ? 'warn' : 'ok');
    } else {
      setText('insuranceStatus', 'Nevzniká');
      setText('insuranceText', 'Součet je pod rozhodnou částkou; zdravotní krytí řešte podle svého dalšího postavení.');
      setDot('insuranceDot', 'warn');
    }

    setText('taxStatus', model.taxRegime);
    setText('taxText', values.declaration ? (model.tax === 0 ? 'Měsíční sleva pokryla vypočtenou daň.' : `Po slevách zbývá daň ${money(model.tax)}.`) : 'Bez Prohlášení se měsíční sleva neuplatňuje.');
    setDot('taxDot', model.tax > 0 ? 'warn' : 'ok');

    if (minimumGap > 0) {
      setText('wageStatus', 'Pod minimem');
      setText('wageText', `Do hodinového minima chybí přibližně ${money(minimumGap)}.`);
      setDot('wageDot', 'danger');
    } else {
      setText('wageStatus', 'Splněno');
      setText('wageText', `Hrubá hodinovka ${money(grossHourly)} je nad minimem ${fmt(values.rates.minimumHourly, 2)} Kč.`);
      setDot('wageDot', 'ok');
    }

    if (values.agreement === 'dpp') {
      if (annualHours > 300) {
        setText('hoursStatus', 'Překročení 300 h');
        setText('hoursText', `Zadaný součet je ${fmt(annualHours, 1)} h, tedy nad ročním limitem DPP.`);
        setDot('hoursDot', 'danger');
      } else {
        setText('hoursStatus', `${fmt(300 - annualHours, 1)} h zbývá`);
        setText('hoursText', vacationCandidate ? 'Rozsah je pod limitem; současně mohou být splněné první podmínky dovolené.' : 'Rozsah je pod ročním limitem DPP.');
        setDot('hoursDot', annualHours > 270 ? 'warn' : 'ok');
      }
    } else {
      if (values.dpcWeekly > 20) {
        setText('hoursStatus', 'Nad 20 h týdně');
        setText('hoursText', 'Zadaný průměr překračuje polovinu běžné čtyřicetihodinové týdenní doby.');
        setDot('hoursDot', 'danger');
      } else {
        setText('hoursStatus', `${fmt(values.dpcWeekly, 1)} h týdně`);
        setText('hoursText', vacationCandidate ? 'Průměr je v limitu; mohou být splněné první podmínky dovolené.' : 'Zadaný průměr nepřekračuje 20 hodin týdně.');
        setDot('hoursDot', values.dpcWeekly > 18 ? 'warn' : 'ok');
      }
    }
  }

  function renderScenarios(values, options) {
    const table = $('scenarioTable');
    table.replaceChildren();
    const threshold = options.agreement === 'dpp' ? values.rates.dppThreshold : values.rates.dpcThreshold;
    const current = values.gross + values.same;
    const scenarios = [
      { label: 'Pod limitem', gross: Math.max(1, threshold - 1), note: 'Poslední částka před vznikem pojistného.' },
      { label: 'Na limitu', gross: threshold, note: 'První částka v pojištěném režimu.' },
      { label: 'Váš scénář', gross: current, note: 'Součet zadaných dohod u zaměstnavatele.', current: true },
      { label: '+ 20 %', gross: Math.round(current * 1.2), note: 'Kontrola, co přinese vyšší hrubá odměna.' }
    ];
    const models = scenarios.map((item) => ({ ...item, model: calculateModel(item.gross, options, values.rates) }));
    const maxNet = Math.max(...models.map((item) => item.model.net), 1);
    models.forEach((item) => {
      const card = document.createElement('article');
      card.className = `scenario-row-card${item.current ? ' current' : ''}`;
      const label = document.createElement('span'); label.textContent = item.label;
      const title = document.createElement('h3'); title.textContent = `${money(item.gross)} hrubého`;
      const amount = document.createElement('strong'); amount.textContent = `${money(item.model.net)} čistého`;
      const note = document.createElement('p'); note.textContent = `${item.note} ${item.model.insured ? 'Pojistné se odvádí.' : 'Bez pojistného z dohody.'}`;
      const bar = document.createElement('div'); bar.className = 'scenario-bar';
      const fill = document.createElement('i'); fill.style.width = `${Math.max(4, item.model.net / maxNet * 100)}%`;
      bar.appendChild(fill); card.append(label, title, amount, note, bar); table.appendChild(card);
    });
  }

  function calculate() {
    const values = validate();
    if (!values.valid) { renderInvalid(); return; }
    const totalGross = values.gross + values.same;
    const options = { agreement: values.agreement, declaration: values.declaration, healthMode: values.healthMode, additionalCredit: values.additionalCredit };
    const model = calculateModel(totalGross, options, values.rates);
    const threshold = model.threshold;
    const distance = threshold - totalGross;
    const grossHourly = values.gross / values.hours;
    const netHourly = model.net / values.hours;
    const minimumGap = Math.max(0, values.rates.minimumHourly * values.hours - values.gross);
    const annualHours = values.hoursBefore + values.hours;
    const vacationCandidate = values.relationshipDays >= 28 && annualHours >= 80;
    const agreementName = values.agreement === 'dpp' ? 'DPP' : 'DPČ';
    const belowLabel = model.insured ? 's pojistným' : 'pod limitem';
    const deductionRatio = totalGross > 0 ? model.deductions / totalGross * 100 : 0;
    const limitRatio = threshold > 0 ? totalGross / threshold * 100 : 0;

    setText('resultTitle', `${agreementName} ${belowLabel}`);
    setText('resultBadge', model.insured ? 'Pojistné vzniká' : 'Bez pojistného');
    setText('netResult', money(model.net));
    setText('resultSummary', `Z hrubého součtu ${money(totalGross)} se odečte ${money(model.deductions)}. Daňový režim: ${model.taxRegime.toLowerCase()}.`);
    setText('deductionsResult', money(model.deductions));
    setText('deductionsDetail', `${percent(deductionRatio)} hrubého příjmu`);
    setText('netHourlyResult', `${money(netHourly)}/h`);
    setText('grossHourlyDetail', `Hrubě ${money(grossHourly)}/h`);
    setText('employerCostResult', money(model.employerCost));
    setText('employerCostDetail', model.insured ? `Odvody firmy ${money(model.employerSocial + model.employerHealth)}` : 'Bez pojistného zaměstnavatele');
    setText('thresholdDistanceResult', money(Math.abs(distance)));
    setText('thresholdDistanceDetail', distance > 0 ? `Do rozhodné částky ${agreementName}` : distance === 0 ? `Přesně na rozhodné částce ${agreementName}` : `Nad rozhodnou částkou ${agreementName}`);

    setText('grossTotalResult', money(totalGross));
    setText('socialResult', money(model.employeeSocial));
    setText('healthResult', money(model.employeeHealth));
    setText('healthSupplementResult', money(model.healthSupplement));
    $('healthSupplementRow').hidden = model.healthSupplement === 0;
    setText('taxResult', money(model.tax));
    setText('netBreakdownResult', money(model.net));

    setText('limitPercent', `${fmt(limitRatio, 0)} % limitu`);
    setText('limitTarget', money(threshold));
    $('limitBar').style.width = `${Math.min(100, Math.max(0, limitRatio))}%`;

    const decision = $('decisionCard');
    decision.className = 'decision-card';
    let decisionLabel = 'Přehledný scénář';
    let decisionTitle = model.insured ? 'Odměna je v pojištěném režimu' : 'Odměna je pod rozhodnou částkou';
    let decisionText = model.insured ? 'Sociální i zdravotní pojištění se počítá z celého součtu zadaných dohod stejného typu.' : 'Z dohody nevzniká pojistné. Ověřte však své zdravotní pojištění mimo tuto výplatu.';
    if (minimumGap > 0) { decision.classList.add('is-danger'); decisionLabel = 'Nutná kontrola'; decisionTitle = 'Hrubá hodinová odměna je pod minimem'; decisionText = `Pro zadané hodiny chybí do minimální odměny přibližně ${money(minimumGap)}.`; }
    else if (values.healthMode === 'unknown' && model.insured && totalGross < values.rates.minimumHealthBase) { decision.classList.add('is-warning'); decisionLabel = 'Ověřte zdravotní minimum'; decisionTitle = 'Výsledek zatím neobsahuje možný doplatek'; decisionText = 'V pokročilém režimu zvolte, zda se na vás vztahuje minimální vyměřovací základ zdravotního pojištění.'; }
    else if (model.healthSupplement > 0) { decision.classList.add('is-warning'); decisionLabel = 'Zdravotní minimum'; decisionTitle = 'Čistou odměnu snižuje doplatek do minima'; decisionText = `Do zdravotního minima je zahrnut doplatek ${money(model.healthSupplement)}.`; }
    setText('decisionLabel', decisionLabel); setText('decisionTitle', decisionTitle); setText('decisionText', decisionText);

    statusCopy(values, model, grossHourly, minimumGap, annualHours, vacationCandidate);
    renderScenarios(values, options);

    setText('heroAgreement', `${agreementName} · ${belowLabel}`);
    setText('heroRegime', model.insured ? 'Pojistné vzniká' : 'Bez pojistného');
    setText('heroNet', money(model.net));
    setText('heroDeductions', money(model.deductions));
    setText('heroHourly', `${money(netHourly)}/h`);
    setText('heroLimitText', `${fmt(limitRatio, 0)} %`);
    $('heroLimitBar').style.width = `${Math.min(100, Math.max(0, limitRatio))}%`;
    setText('heroSentence', minimumGap > 0 ? `Hodinová odměna je pod minimem; chybí přibližně ${money(minimumGap)}.` : model.insured ? `Součet ${money(totalGross)} dosáhl rozhodné částky a vstupuje do odvodů.` : `Součet ${money(totalGross)} je pod rozhodnou částkou pro pojistné.`);
  }


  function syncAgreementPicker() {
    document.querySelectorAll('[data-agreement]').forEach((button) => {
      const active = button.dataset.agreement === els.agreement.value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('[data-mode]').forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    els.advanced.hidden = mode !== 'advanced';
    calculate();
  }

  function applyPreset(name) {
    const presets = {
      'dpp-low': { agreement: 'dpp', gross: '10 000', same: '0', hours: '60', declaration: true },
      'dpp-threshold': { agreement: 'dpp', gross: '12 000', same: '0', hours: '70', declaration: true },
      'dpc': { agreement: 'dpc', gross: '8 000', same: '0', hours: '45', declaration: true }
    };
    const preset = presets[name];
    if (!preset) return;
    els.agreement.value = preset.agreement; els.gross.value = preset.gross; els.same.value = preset.same; els.hours.value = preset.hours; els.declaration.checked = preset.declaration;
    syncAgreementPicker();
    calculate();
  }

  function reset() {
    els.agreement.value = 'dpp'; syncAgreementPicker(); els.gross.value = '10 000'; els.same.value = '0'; els.hours.value = '60'; els.declaration.checked = true;
    els.healthMode.value = 'unknown'; els.additionalCredit.value = '0'; els.hoursBefore.value = '0'; els.relationshipDays.value = '30'; els.dpcWeekly.value = '15';
    els.dppThreshold.value = '12 000'; els.dpcThreshold.value = '4 500'; els.minimumHourly.value = '134,40'; els.employeeSocialRate.value = '7,1'; els.employeeHealthRate.value = '4,5'; els.employerSocialRate.value = '24,8'; els.employerHealthRate.value = '9'; els.minimumHealthBase.value = '22 400'; els.personalCredit.value = '2 570';
    setMode('basic');
  }

  async function copyResult() {
    const text = `${$('resultTitle').textContent}: ${$('netResult').textContent}; srážky ${$('deductionsResult').textContent}; náklad zaměstnavatele ${$('employerCostResult').textContent}; ${$('insuranceStatus').textContent}; ${$('taxStatus').textContent}.`;
    try { await navigator.clipboard.writeText(text); setText('copyResult', 'Zkopírováno'); setTimeout(() => setText('copyResult', 'Kopírovat výsledek'), 1400); }
    catch { setText('copyResult', 'Kopírování selhalo'); }
  }

  function bind() {
    document.querySelectorAll('[data-agreement]').forEach((button) => button.addEventListener('click', () => { els.agreement.value = button.dataset.agreement; syncAgreementPicker(); calculate(); }));
    document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
    document.querySelectorAll('[data-preset]').forEach((button) => button.addEventListener('click', () => applyPreset(button.dataset.preset)));
    $('resetButton').addEventListener('click', reset);
    $('copyResult').addEventListener('click', copyResult);
    els.form.addEventListener('submit', (event) => { event.preventDefault(); calculate(); });
    Object.values(els).filter((element) => element && ['INPUT','SELECT'].includes(element.tagName)).forEach((element) => {
      element.addEventListener(element.tagName === 'SELECT' || element.type === 'checkbox' ? 'change' : 'input', calculate);
    });
  }

  function init() { bind(); syncAgreementPicker(); setMode('basic'); }
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
})();
