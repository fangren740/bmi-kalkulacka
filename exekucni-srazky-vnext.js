(function (root) {
  'use strict';

  const PARAMS = Object.freeze({
    year: 2026,
    livingMinimum: 4860,
    normativeRent: 9430,
    energyFlat: 2300,
    baseRaw: 14101.50,
    dependentQuarter: 3525.375,
    fullSeizureLimit: 31521,
    pensionExceptionThirdLimit: 1089,
    employerFeeMax: 50
  });

  function toMoney(value) {
    return Math.round(Number(value) || 0);
  }

  function calculate(input) {
    const netWage = Math.max(0, toMoney(input.netWage));
    const dependents = Math.max(0, Math.floor(Number(input.dependents) || 0));
    const spouseEligible = Boolean(input.spouseEligible);
    const priority = input.debtType === 'priority';
    const fourExecutions = Boolean(input.fourExecutions);
    const pensionException = Boolean(input.pensionException);
    const employerFeeEnabled = Boolean(input.employerFee);
    const debtCapRaw = Number(input.debtCap);
    const debtCap = Number.isFinite(debtCapRaw) && debtCapRaw > 0 ? Math.round(debtCapRaw) : Infinity;

    const dependentCountForFormula = dependents + (spouseEligible ? 1 : 0);
    const protectedThreshold = Math.ceil(PARAMS.baseRaw + dependentCountForFormula * PARAMS.dependentQuarter);
    const residual = Math.max(0, netWage - protectedThreshold);
    const fullySeizable = Math.max(0, residual - PARAMS.fullSeizureLimit);
    const thirdsBase = Math.min(residual, PARAMS.fullSeizureLimit);
    const divisibleByThree = Math.floor(thirdsBase / 3) * 3;
    const oneThird = divisibleByThree / 3;
    const roundingRemainder = thirdsBase - divisibleByThree;

    const pensionFourExceptionApplies = fourExecutions && pensionException && oneThird < PARAMS.pensionExceptionThirdLimit;
    const twoThirdMode = priority || (fourExecutions && !pensionFourExceptionApplies);
    const thirdsSeized = twoThirdMode ? 2 : 1;
    const monthlyPotential = oneThird * thirdsSeized + fullySeizable;
    const deduction = Math.min(monthlyPotential, debtCap);
    const takeHome = Math.max(0, netWage - deduction);

    const fee = employerFeeEnabled && deduction > 0
      ? Math.min(PARAMS.employerFeeMax, Math.ceil(deduction / 3))
      : 0;
    const toExecutor = Math.max(0, deduction - fee);

    return {
      netWage,
      dependents,
      spouseEligible,
      protectedThreshold,
      protectedFromThisWage: Math.min(netWage, protectedThreshold),
      residual,
      fullySeizable,
      thirdsBase,
      divisibleByThree,
      oneThird,
      roundingRemainder,
      priority,
      fourExecutions,
      pensionException,
      pensionFourExceptionApplies,
      twoThirdMode,
      thirdsSeized,
      monthlyPotential,
      debtCap,
      debtCapped: Number.isFinite(debtCap) && debtCap < monthlyPotential,
      deduction,
      takeHome,
      employerFeeEnabled,
      fee,
      toExecutor
    };
  }

  const engine = { PARAMS, calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = engine;
  root.RVExekuceEngine = engine;

  if (typeof document === 'undefined') return;

  const $ = (id) => document.getElementById(id);
  const form = $('executionForm');
  if (!form) return;

  const els = {
    netWage: $('netWage'), children: $('children'), spouseEligible: $('spouseEligible'),
    fourExecutions: $('fourExecutions'), pensionException: $('pensionException'), employerFee: $('employerFee'),
    debtCap: $('debtCap'), calculate: $('calculate'), reset: $('reset'), formError: $('formError'),
    advancedPanel: $('advancedPanel'), tabBasic: $('tabBasic'), tabAdvanced: $('tabAdvanced'),
    takeHome: $('takeHome'), resultSentence: $('resultSentence'), protectedAmount: $('protectedAmount'),
    keepExtra: $('keepExtra'), deductionAmount: $('deductionAmount'), oneThird: $('oneThird'),
    fullySeizable: $('fullySeizable'), effectiveMode: $('effectiveMode'), modeReason: $('modeReason'),
    roundRemainder: $('roundRemainder'), barProtected: $('barProtected'), barKeep: $('barKeep'),
    barDeduct: $('barDeduct'), resultNote: $('resultNote'), feeSplit: $('feeSplit'),
    executorAmount: $('executorAmount'), employerFeeAmount: $('employerFeeAmount'),
    heroTakeHome: $('heroTakeHome'), heroDeduction: $('heroDeduction'), copyLink: $('copyLink'),
    mainNav: $('mainNav'), menuToggle: $('menuToggle')
  };

  let mode = 'basic';

  const fmt = (value) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(value || 0))} Kč`;

  function debtType() {
    const checked = form.querySelector('input[name="debtType"]:checked');
    return checked ? checked.value : 'ordinary';
  }

  function readInput() {
    return {
      netWage: els.netWage.value,
      dependents: els.children.value,
      debtType: debtType(),
      fourExecutions: els.fourExecutions.checked,
      spouseEligible: mode === 'advanced' && els.spouseEligible.checked,
      pensionException: mode === 'advanced' && els.pensionException.checked,
      employerFee: mode === 'advanced' && els.employerFee.checked,
      debtCap: mode === 'advanced' ? els.debtCap.value : ''
    };
  }

  function validate(input) {
    const wage = Number(input.netWage);
    const deps = Number(input.dependents);
    if (!Number.isFinite(wage) || wage < 0) return 'Zadejte platnou čistou mzdu.';
    if (!Number.isFinite(deps) || deps < 0 || !Number.isInteger(deps)) return 'Počet vyživovaných osob musí být celé nezáporné číslo.';
    if (deps > 20) return 'Pro tento orientační model zadejte nejvýše 20 vyživovaných osob.';
    return '';
  }

  function modeDescription(result) {
    if (result.priority) return ['2 třetiny', 'přednostní pohledávka'];
    if (result.fourExecutions && result.pensionFourExceptionApplies) return ['1 třetina', 'uplatněna důchodová výjimka u 4+ exekucí'];
    if (result.fourExecutions) return ['2 třetiny', 'pravidlo nejméně 4 exekucí'];
    return ['1 třetina', 'nepřednostní pohledávka'];
  }

  function setBar(result) {
    const total = Math.max(1, result.netWage);
    const protectedVisual = Math.min(result.takeHome, result.protectedThreshold);
    const extraKeep = Math.max(0, result.takeHome - protectedVisual);
    const p1 = (protectedVisual / total) * 100;
    const p2 = (extraKeep / total) * 100;
    const p3 = (result.deduction / total) * 100;
    els.barProtected.style.width = `${p1}%`;
    els.barKeep.style.width = `${p2}%`;
    els.barDeduct.style.width = `${p3}%`;
    els.protectedAmount.textContent = fmt(protectedVisual);
    els.keepExtra.textContent = fmt(extraKeep);
    els.deductionAmount.textContent = fmt(result.deduction);
  }

  function updateQuickButtons() {
    const current = Math.round(Number(els.netWage.value) || 0);
    form.querySelectorAll('[data-wage]').forEach((button) => {
      button.classList.toggle('is-active', Number(button.dataset.wage) === current);
    });
  }

  function updateResult() {
    const input = readInput();
    const error = validate(input);
    els.formError.hidden = !error;
    els.formError.textContent = error;
    if (error) return null;

    const result = calculate(input);
    const [modeTitle, modeReason] = modeDescription(result);
    const typeLabel = result.priority ? 'přednostní' : 'nepřednostní';

    els.takeHome.textContent = fmt(result.takeHome);
    els.resultSentence.textContent = `Z čisté mzdy ${fmt(result.netWage)} vychází orientační ${typeLabel} srážka ${fmt(result.deduction)}.`;
    els.oneThird.textContent = fmt(result.oneThird);
    els.fullySeizable.textContent = fmt(result.fullySeizable);
    els.effectiveMode.textContent = modeTitle;
    els.modeReason.textContent = modeReason;
    els.roundRemainder.textContent = fmt(result.roundingRemainder);
    setBar(result);

    els.feeSplit.hidden = !result.employerFeeEnabled || result.deduction <= 0;
    els.executorAmount.textContent = fmt(result.toExecutor);
    els.employerFeeAmount.textContent = fmt(result.fee);

    if (result.debtCapped) {
      els.resultNote.textContent = 'Srážka je v modelu zastropovaná zadaným zůstatkem pohledávky. Skutečný rozvrh mezi více věřiteli může být jiný.';
    } else if (result.pensionFourExceptionApplies) {
      els.resultNote.textContent = 'Model uplatnil důchodovou výjimku z pravidla 4+ exekucí, protože jedna třetina zbytku je pod 1 089 Kč. Skutečné splnění podmínek musí být plátci mzdy doloženo.';
    } else {
      els.resultNote.textContent = 'Orientační model. Skutečný výpočet plátce mzdy závisí také na konkrétních exekučních příkazech, jejich pořadí a doložených skutečnostech.';
    }

    els.heroTakeHome.textContent = fmt(result.takeHome);
    els.heroDeduction.textContent = `Orientační srážka ${fmt(result.deduction)}`;
    updateQuickButtons();
    return result;
  }

  function setMode(nextMode, focusButton) {
    mode = nextMode === 'advanced' ? 'advanced' : 'basic';
    const advanced = mode === 'advanced';
    els.advancedPanel.hidden = !advanced;
    els.tabBasic.classList.toggle('is-active', !advanced);
    els.tabAdvanced.classList.toggle('is-active', advanced);
    els.tabBasic.setAttribute('aria-selected', String(!advanced));
    els.tabAdvanced.setAttribute('aria-selected', String(advanced));
    els.tabBasic.tabIndex = advanced ? -1 : 0;
    els.tabAdvanced.tabIndex = advanced ? 0 : -1;
    if (focusButton) (advanced ? els.tabAdvanced : els.tabBasic).focus();
    updateResult();
  }

  function updateUrl() {
    const input = readInput();
    const url = new URL(location.href);
    url.searchParams.set('mzda', String(Math.round(Number(input.netWage) || 0)));
    url.searchParams.set('osoby', String(Math.max(0, Math.floor(Number(input.dependents) || 0))));
    url.searchParams.set('typ', input.debtType);
    if (input.fourExecutions) url.searchParams.set('ctyri', '1'); else url.searchParams.delete('ctyri');
    if (mode === 'advanced') url.searchParams.set('rezim', 'presny'); else url.searchParams.delete('rezim');
    if (input.spouseEligible) url.searchParams.set('partner', '1'); else url.searchParams.delete('partner');
    if (input.pensionException) url.searchParams.set('duchod', '1'); else url.searchParams.delete('duchod');
    if (input.employerFee) url.searchParams.set('nahrada', '1'); else url.searchParams.delete('nahrada');
    if (input.debtCap) url.searchParams.set('dluh', String(Math.round(Number(input.debtCap) || 0))); else url.searchParams.delete('dluh');
    history.replaceState({}, '', url);
    return url;
  }

  function loadFromUrl() {
    const q = new URLSearchParams(location.search);
    if (q.has('mzda')) els.netWage.value = q.get('mzda');
    if (q.has('osoby')) els.children.value = q.get('osoby');
    const typ = q.get('typ');
    if (typ === 'priority' || typ === 'ordinary') {
      const radio = form.querySelector(`input[name="debtType"][value="${typ}"]`);
      if (radio) radio.checked = true;
    }
    els.fourExecutions.checked = q.get('ctyri') === '1';
    els.spouseEligible.checked = q.get('partner') === '1';
    els.pensionException.checked = q.get('duchod') === '1';
    els.employerFee.checked = q.get('nahrada') === '1';
    if (q.has('dluh')) els.debtCap.value = q.get('dluh');
    setMode(q.get('rezim') === 'presny' ? 'advanced' : 'basic', false);
  }

  form.addEventListener('input', updateResult);
  form.addEventListener('change', updateResult);
  form.querySelectorAll('[data-wage]').forEach((button) => button.addEventListener('click', () => {
    els.netWage.value = button.dataset.wage;
    updateResult();
  }));

  els.calculate.addEventListener('click', () => {
    const result = updateResult();
    if (result) updateUrl();
  });

  els.reset.addEventListener('click', () => {
    els.netWage.value = '40000';
    els.children.value = '0';
    form.querySelector('input[name="debtType"][value="ordinary"]').checked = true;
    els.fourExecutions.checked = false;
    els.spouseEligible.checked = false;
    els.pensionException.checked = false;
    els.employerFee.checked = false;
    els.debtCap.value = '';
    setMode('basic', false);
    history.replaceState({}, '', location.pathname);
  });

  els.tabBasic.addEventListener('click', () => setMode('basic', false));
  els.tabAdvanced.addEventListener('click', () => setMode('advanced', false));
  [els.tabBasic, els.tabAdvanced].forEach((tab) => tab.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft' || event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      setMode(tab === els.tabBasic ? 'advanced' : 'basic', true);
    }
  }));

  els.copyLink.addEventListener('click', async () => {
    const url = updateUrl();
    try {
      await navigator.clipboard.writeText(url.toString());
      const old = els.copyLink.textContent;
      els.copyLink.textContent = 'Odkaz zkopírován';
      setTimeout(() => { els.copyLink.textContent = old; }, 1800);
    } catch (_) {
      window.prompt('Zkopírujte odkaz:', url.toString());
    }
  });

  els.menuToggle.addEventListener('click', () => {
    const open = els.mainNav.classList.toggle('is-open');
    els.menuToggle.setAttribute('aria-expanded', String(open));
    els.menuToggle.setAttribute('aria-label', open ? 'Zavřít menu' : 'Otevřít menu');
  });

  loadFromUrl();
})(typeof window !== 'undefined' ? window : globalThis);
