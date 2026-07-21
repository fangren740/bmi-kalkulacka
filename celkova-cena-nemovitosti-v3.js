(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const money = (value) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(value || 0)) + ' Kč';
  const pct = (value, digits = 1) => new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value || 0) + ' %';
  const num = (id, fallback = 0) => {
    const el = $(id);
    const value = el ? Number(el.value) : fallback;
    return Number.isFinite(value) ? value : fallback;
  };
  const val = (id, fallback = '') => ($(id) ? $(id).value : fallback);
  const checked = (id) => Boolean($(id)?.checked);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  const state = { mode: 'basic', step: 1 };

  function basicModel(overrides = {}) {
    const price = Math.max(0, overrides.price ?? num('basicPrice'));
    const commissionRate = clamp(overrides.commissionRate ?? num('basicCommissionRate'), 0, 20);
    const transaction = Math.max(0, overrides.transaction ?? num('basicTransactionCosts'));
    const upgrade = Math.max(0, overrides.upgrade ?? num('basicUpgrade'));
    const reserve = Math.max(0, overrides.reserve ?? num('basicReserve'));
    const ltv = clamp(overrides.ltv ?? num('basicLtv'), 0, 100);
    const commission = price * commissionRate / 100;
    const extras = commission + transaction + upgrade + reserve;
    const total = price + extras;
    const mortgage = price * ltv / 100;
    const cash = Math.max(0, total - mortgage);
    return {
      price, commissionRate, commission, transaction, upgrade, reserve, extras, total,
      ltv, mortgage, cash,
      uplift: price > 0 ? extras / price * 100 : 0,
      categories: {
        'Kupní cena': price,
        'Provize navíc': commission,
        'Právní a převodní náklady': transaction,
        'Úpravy a vybavení': upgrade,
        'Rezerva po koupi': reserve
      }
    };
  }

  function referenceLtv(purpose, under36) {
    if (purpose === 'investment' || purpose === 'third') return 70;
    return under36 ? 90 : 80;
  }

  function commissionFor(mode, price, rate, fixed) {
    if (mode === 'percent') return price * clamp(rate, 0, 20) / 100;
    if (mode === 'fixed') return Math.max(0, fixed);
    return 0;
  }

  function cadastreFee(filings, online) {
    const base = Math.max(0, Math.round(filings)) * 2000;
    return online ? base * 0.8 : base;
  }

  function proModel(overrides = {}) {
    const price = Math.max(0, overrides.price ?? num('proPrice'));
    const commissionMode = overrides.commissionMode ?? val('proCommissionMode', 'percent');
    const commissionRate = overrides.commissionRate ?? num('proCommissionRate');
    const commissionFixed = overrides.commissionFixed ?? num('proCommissionFixed');
    const commission = commissionFor(commissionMode, price, commissionRate, commissionFixed);
    const filings = Math.max(0, overrides.filings ?? num('proCadastreFilings', 1));
    const online = overrides.online ?? checked('proCadastreOnline');
    const cadastre = cadastreFee(filings, online);

    const legal = Math.max(0, overrides.legal ?? num('proLegal'));
    const escrow = Math.max(0, overrides.escrow ?? num('proEscrow'));
    const inspection = Math.max(0, overrides.inspection ?? num('proInspection'));
    const appraisal = Math.max(0, overrides.appraisal ?? num('proAppraisal'));
    const mortgageFees = Math.max(0, overrides.mortgageFees ?? num('proMortgageFees'));
    const otherTransaction = Math.max(0, overrides.otherTransaction ?? num('proOtherTransaction'));
    const dueDiligence = legal + escrow + inspection + appraisal + mortgageFees + otherTransaction + cadastre;

    const renovation = Math.max(0, overrides.renovation ?? num('proRenovation'));
    const renovationContingencyRate = clamp(overrides.renovationContingencyRate ?? num('proRenovationContingency'), 0, 100);
    const renovationContingency = renovation * renovationContingencyRate / 100;
    const equipment = Math.max(0, overrides.equipment ?? num('proEquipment'));
    const moving = Math.max(0, overrides.moving ?? num('proMoving'));
    const utilityDeposits = Math.max(0, overrides.utilityDeposits ?? num('proUtilityDeposits'));
    const doubleHousing = Math.max(0, overrides.doubleHousing ?? num('proDoubleHousing'));
    const reserve = Math.max(0, overrides.reserve ?? num('proReserve'));
    const afterHandover = renovation + renovationContingency + equipment + moving + utilityDeposits + doubleHousing + reserve;

    const purpose = overrides.purpose ?? val('proPurpose', 'own');
    const under36 = overrides.under36 ?? checked('proUnder36');
    const refLtv = referenceLtv(purpose, under36);
    const appraisalValueRaw = Math.max(0, overrides.appraisalValue ?? num('proAppraisalValue'));
    const appraisalValue = appraisalValueRaw > 0 ? appraisalValueRaw : price;
    const collateralBase = Math.min(price, appraisalValue || price);
    const chosenLtv = clamp(overrides.chosenLtv ?? num('proChosenLtv'), 0, 100);
    const mortgage = collateralBase * chosenLtv / 100;
    const availableCash = Math.max(0, overrides.availableCash ?? num('proAvailableCash'));
    const allInBudget = Math.max(0, overrides.allInBudget ?? num('proAllInBudget'));

    const extras = commission + dueDiligence + afterHandover;
    const total = price + extras;
    const ownFunds = Math.max(0, total - mortgage);
    const fundingGap = ownFunds - availableCash;
    const budgetGap = total - allInBudget;
    const fixedExtrasWithoutPercentCommission = dueDiligence + afterHandover + (commissionMode === 'fixed' ? commission : 0);
    let maxOffer = 0;
    if (allInBudget > 0) {
      if (commissionMode === 'percent') maxOffer = Math.max(0, (allInBudget - dueDiligence - afterHandover) / (1 + commissionRate / 100));
      else maxOffer = Math.max(0, allInBudget - fixedExtrasWithoutPercentCommission);
    }

    const beforeReservation = inspection + appraisal + Math.min(legal, legal * 0.35);
    const atTransfer = Math.max(0, price - mortgage) + commission + cadastre + escrow + Math.max(0, legal - Math.min(legal, legal * 0.35)) + mortgageFees + otherTransaction;
    const afterTransfer = afterHandover;

    return {
      price, commissionMode, commissionRate, commission, cadastre, dueDiligence,
      legal, escrow, inspection, appraisal, mortgageFees, otherTransaction,
      renovation, renovationContingencyRate, renovationContingency, equipment, moving,
      utilityDeposits, doubleHousing, reserve, afterHandover,
      extras, total, purpose, under36, refLtv, appraisalValue, collateralBase, chosenLtv,
      mortgage, availableCash, allInBudget, ownFunds, fundingGap, budgetGap, maxOffer,
      uplift: price > 0 ? extras / price * 100 : 0,
      ltvWarning: chosenLtv > refLtv,
      beforeReservation, atTransfer, afterTransfer,
      categories: {
        'Kupní cena': price,
        'Provize navíc': commission,
        'Právní a prověřovací náklady': dueDiligence,
        'Rekonstrukce a její rezerva': renovation + renovationContingency,
        'Vybavení a stěhování': equipment + moving + utilityDeposits + doubleHousing,
        'Bezpečnostní rezerva': reserve
      }
    };
  }

  function model() {
    return state.mode === 'pro' ? proModel() : basicModel();
  }

  function setText(id, text) {
    const el = $(id);
    if (el) el.textContent = text;
  }

  function setWidth(id, value) {
    const el = $(id);
    if (el) el.style.width = clamp(value, 0, 100) + '%';
  }

  function renderBreakdown(data) {
    const body = $('breakdownBody');
    if (!body) return;
    body.innerHTML = '';
    Object.entries(data.categories).forEach(([label, amount]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${label}</td><td>${money(amount)}</td><td>${data.total > 0 ? pct(amount / data.total * 100, 1) : '0,0 %'}</td>`;
      body.appendChild(tr);
    });
  }

  function renderScenarioCard(id, label, data, note) {
    setText(id + 'Label', label);
    setText(id + 'Value', money(data.ownFunds ?? data.cash));
    setText(id + 'Note', note);
  }

  function render() {
    const data = model();
    setText('heroTotal', money(data.total));
    setText('heroExtras', money(data.extras));
    setText('heroCash', money(data.ownFunds ?? data.cash));
    setText('heroUplift', pct(data.uplift, 1));
    const maxCat = Math.max(...Object.values(data.categories), 1);
    setWidth('heroPriceBar', (data.price / maxCat) * 100);
    setWidth('heroExtraBar', (data.extras / Math.max(data.total, 1)) * 100);

    setText('resultTotal', money(data.total));
    setText('resultExtras', money(data.extras));
    setText('resultCash', money(data.ownFunds ?? data.cash));
    setText('resultMortgage', money(data.mortgage));
    setText('resultUplift', pct(data.uplift, 1));
    setText('resultPrice', money(data.price));
    setText('resultStatus', data.extras > 0 ? `K ceně připočítáváte ${pct(data.uplift, 1)}` : 'Bez vedlejších nákladů');

    const msg = $('resultMessage');
    if (msg) {
      if (state.mode === 'pro') {
        if (data.fundingGap > 0) msg.innerHTML = `<strong>Chybí vlastní hotovost.</strong> Pro zadaný model potřebujete ještě přibližně ${money(data.fundingGap)} nad dostupné prostředky.`;
        else if (data.budgetGap > 0 && data.allInBudget > 0) msg.innerHTML = `<strong>Projekt překračuje all-in rozpočet.</strong> Rozdíl je přibližně ${money(data.budgetGap)}.`;
        else msg.innerHTML = `<strong>Rozpočet je krytý.</strong> Po započtení hypotéky a vedlejších nákladů zůstává přibližně ${money(Math.max(0, -data.fundingGap))} z dostupné hotovosti.`;
      } else {
        msg.innerHTML = `<strong>Nezapomeňte:</strong> hypotéka se obvykle vztahuje k hodnotě zástavy, zatímco provizi, právní služby, úpravy a rezervu často hradíte z vlastních peněz.`;
      }
    }

    renderBreakdown(data);

    if (state.mode === 'pro') {
      setText('proReferenceLtv', pct(data.refLtv, 0));
      setText('proCollateralBase', money(data.collateralBase));
      setText('proFundingGap', data.fundingGap > 0 ? money(data.fundingGap) : '0 Kč');
      setText('proBudgetGap', data.budgetGap > 0 ? money(data.budgetGap) : '0 Kč');
      setText('proMaxOffer', money(data.maxOffer));
      setText('timelineBefore', money(data.beforeReservation));
      setText('timelineTransfer', money(data.atTransfer));
      setText('timelineAfter', money(data.afterTransfer));
      const ltvNote = $('ltvReferenceNote');
      if (ltvNote) {
        ltvNote.classList.toggle('is-warning', data.ltvWarning);
        ltvNote.innerHTML = data.ltvWarning
          ? `<strong>Zvolených ${pct(data.chosenLtv, 0)} je nad referenční hranicí ${pct(data.refLtv, 0)}.</strong> Banka může použít nižší úvěr nebo přísnější posouzení.`
          : `<strong>Zvolené LTV je v referenčním rámci.</strong> Kalkulačka používá hodnotu ${pct(data.refLtv, 0)} podle účelu koupě a věku.`;
      }

      const renovationStress = proModel({ renovation: data.renovation * 1.2 });
      const appraisalStress = proModel({ appraisalValue: data.appraisalValue * 0.95 });
      const combined = proModel({ renovation: data.renovation * 1.2, appraisalValue: data.appraisalValue * 0.95 });
      renderScenarioCard('scenarioBase', 'Základní model', data, 'Vlastní hotovost potřebná podle aktuálního zadání.');
      renderScenarioCard('scenarioRenovation', 'Rekonstrukce +20 %', renovationStress, `Navíc ${money(renovationStress.ownFunds - data.ownFunds)}.`);
      renderScenarioCard('scenarioAppraisal', 'Odhad −5 %', appraisalStress, `Nižší zástavní hodnota zvyšuje vlastní vklad o ${money(appraisalStress.ownFunds - data.ownFunds)}.`);
      renderScenarioCard('scenarioCombined', 'Kombinovaný stres', combined, `Celkový nárůst vlastní hotovosti ${money(combined.ownFunds - data.ownFunds)}.`);
    } else {
      const before = data.transaction * 0.3;
      const atTransfer = Math.max(0, data.price - data.mortgage) + data.commission + data.transaction * 0.7;
      const after = data.upgrade + data.reserve;
      setText('timelineBefore', money(before));
      setText('timelineTransfer', money(atTransfer));
      setText('timelineAfter', money(after));
      const renovationStress = basicModel({ upgrade: data.upgrade * 1.2 });
      const appraisalMortgage = data.price * 0.95 * data.ltv / 100;
      const appraisalStress = { ...data, mortgage: appraisalMortgage, cash: Math.max(0, data.total - appraisalMortgage) };
      const combinedBase = basicModel({ upgrade: data.upgrade * 1.2 });
      const combinedMortgage = data.price * 0.95 * data.ltv / 100;
      const combined = { ...combinedBase, mortgage: combinedMortgage, cash: Math.max(0, combinedBase.total - combinedMortgage) };
      renderScenarioCard('scenarioBase', 'Základní model', data, 'Vlastní hotovost potřebná podle aktuálního zadání.');
      renderScenarioCard('scenarioRenovation', 'Úpravy +20 %', renovationStress, `Navíc ${money(renovationStress.cash - data.cash)}.`);
      renderScenarioCard('scenarioAppraisal', 'Odhad −5 %', appraisalStress, `Vlastní vklad roste o ${money(appraisalStress.cash - data.cash)}.`);
      renderScenarioCard('scenarioCombined', 'Kombinovaný stres', combined, `Celkový nárůst vlastní hotovosti ${money(combined.cash - data.cash)}.`);
    }
  }

  function updateConditionalFields() {
    const mode = val('proCommissionMode', 'percent');
    document.querySelectorAll('[data-commission-field]').forEach((el) => {
      el.hidden = el.dataset.commissionField !== mode;
    });
    const purpose = val('proPurpose', 'own');
    const under36 = $('under36Wrap');
    if (under36) under36.hidden = purpose !== 'own';
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('.purchase-mode-btn').forEach((btn) => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('.purchase-mode-panel').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === mode));
    $('proResultExtras')?.classList.toggle('is-visible', mode === 'pro');
    render();
  }

  function setStep(step) {
    state.step = clamp(step, 1, 4);
    document.querySelectorAll('.purchase-pro-step').forEach((btn) => {
      const n = Number(btn.dataset.step);
      btn.classList.toggle('is-active', n === state.step);
      btn.classList.toggle('is-done', n < state.step);
      btn.setAttribute('aria-current', n === state.step ? 'step' : 'false');
    });
    document.querySelectorAll('.purchase-pro-stage').forEach((stage) => stage.classList.toggle('is-active', Number(stage.dataset.stage) === state.step));
    setText('stepCounter', `Krok ${state.step} ze 4`);
    if ($('prevStep')) $('prevStep').disabled = state.step === 1;
    if ($('nextStep')) $('nextStep').textContent = state.step === 4 ? 'Zobrazit souhrn' : 'Pokračovat';
  }

  function applyPreset(name) {
    const presets = {
      flat: { basicPrice: 5200000, basicCommissionRate: 3, basicTransactionCosts: 45000, basicUpgrade: 280000, basicReserve: 200000, basicLtv: 80 },
      house: { basicPrice: 8500000, basicCommissionRate: 3, basicTransactionCosts: 75000, basicUpgrade: 900000, basicReserve: 400000, basicLtv: 80 },
      ready: { basicPrice: 4800000, basicCommissionRate: 0, basicTransactionCosts: 35000, basicUpgrade: 100000, basicReserve: 180000, basicLtv: 80 }
    };
    const p = presets[name];
    if (!p) return;
    Object.entries(p).forEach(([id, value]) => { if ($(id)) $(id).value = value; });
    render();
  }

  function resetAll() {
    $('purchaseForm')?.reset();
    state.step = 1;
    updateConditionalFields();
    setStep(1);
    render();
  }

  function copyResult() {
    const data = model();
    const text = [
      'Celková cena nemovitosti – RychléVýpočty.cz',
      `Kupní cena: ${money(data.price)}`,
      `Vedlejší náklady: ${money(data.extras)}`,
      `Celkový rozpočet: ${money(data.total)}`,
      `Odhad hypotéky: ${money(data.mortgage)}`,
      `Potřebná vlastní hotovost: ${money(data.ownFunds ?? data.cash)}`
    ].join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      const btn = $('copyResult');
      if (btn) { const old = btn.textContent; btn.textContent = 'Zkopírováno'; setTimeout(() => btn.textContent = old, 1600); }
    }).catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.purchase-mode-btn').forEach((btn) => btn.addEventListener('click', () => setMode(btn.dataset.mode)));
    document.querySelectorAll('.purchase-pro-step').forEach((btn) => btn.addEventListener('click', () => setStep(Number(btn.dataset.step))));
    $('prevStep')?.addEventListener('click', () => setStep(state.step - 1));
    $('nextStep')?.addEventListener('click', () => {
      if (state.step < 4) setStep(state.step + 1);
      else document.querySelector('#vysledek')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    document.querySelectorAll('[data-preset]').forEach((btn) => btn.addEventListener('click', () => applyPreset(btn.dataset.preset)));
    $('proCommissionMode')?.addEventListener('change', () => { updateConditionalFields(); render(); });
    $('proPurpose')?.addEventListener('change', () => { updateConditionalFields(); render(); });
    $('purchaseForm')?.addEventListener('submit', (event) => { event.preventDefault(); render(); document.querySelector('#vysledek')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    $('resetBtn')?.addEventListener('click', resetAll);
    $('copyResult')?.addEventListener('click', copyResult);
    $('printResult')?.addEventListener('click', () => window.print());
    document.querySelectorAll('#purchaseForm input, #purchaseForm select').forEach((el) => el.addEventListener('input', render));
    updateConditionalFields();
    setStep(1);
    setMode('basic');
  });
})();
