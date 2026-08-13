(() => {
  'use strict';

  const CONFIG = {
    year: 2026,
    taxThreshold: 1762812,
    taxpayerCredit: 30840,
    socialRate: 0.292,
    socialBaseShare: 0.55,
    socialMaxBase: 2350416,
    socialMainMin2026: 17139,
    socialNewMin: 12242,
    socialSideMin: 5387,
    sideThresholdFull: 117521,
    sideThresholdReduction: 9794,
    healthRate: 0.135,
    healthBaseShare: 0.5,
    healthMinMonthlyBase: 24483.5,
    flatCaps: { 80: 1600000, 60: 1200000, 40: 800000, 30: 600000 }
  };

  const $ = (id) => document.getElementById(id);
  const num = (id) => Math.max(0, Number($(id)?.value || 0));
  const bool = (id) => Boolean($(id)?.checked);
  const val = (id) => $(id)?.value || '';
  const ceil = (n) => Math.ceil(Math.max(0, n));
  const floor100 = (n) => Math.floor(Math.max(0, n) / 100) * 100;
  const money = (n) => `${Math.round(n).toLocaleString('cs-CZ')} Kč`;
  const signedMoney = (n) => `${n >= 0 ? '+' : '−'} ${money(Math.abs(n))}`;
  const pct = (n, digits = 1) => `${(n * 100).toLocaleString('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
  const shortMoney = (n) => {
    const x = Math.abs(n);
    if (x >= 1000000) return `${(n / 1000000).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} mil.`;
    if (x >= 1000) return `${Math.round(n / 1000).toLocaleString('cs-CZ')} tis.`;
    return Math.round(n).toLocaleString('cs-CZ');
  };

  function flatExpenseSingle(revenue, rate) {
    const r = Number(rate);
    return Math.min(Math.max(0, revenue) * r / 100, CONFIG.flatCaps[r] || 0);
  }

  function mixedFlatExpenses(parts) {
    return [80, 60, 40, 30].reduce((sum, rate) => sum + flatExpenseSingle(parts[rate] || 0, rate), 0);
  }

  function socialMinimumBase(activity, months, isNew) {
    if (activity === 'side') return CONFIG.socialSideMin * months;
    if (isNew) return CONFIG.socialNewMin * months;
    return CONFIG.socialMainMin2026 * months;
  }

  function sideThreshold(months) {
    return Math.max(0, CONFIG.sideThresholdFull - CONFIG.sideThresholdReduction * (12 - months));
  }

  function computeVariant(input, method) {
    const revenue = Math.max(0, input.revenue);
    const taxExpenses = method === 'flat'
      ? Math.min(revenue, Math.max(0, input.flatExpenses))
      : Math.max(0, input.actualTaxExpenses);
    const taxProfitRaw = revenue - taxExpenses;
    const taxProfit = Math.max(0, taxProfitRaw);
    const taxBase = floor100(Math.max(0, taxProfitRaw - input.deductions));
    const grossTax = ceil(
      Math.min(taxBase, CONFIG.taxThreshold) * 0.15 +
      Math.max(0, taxBase - CONFIG.taxThreshold) * 0.23
    );
    const credits = (input.taxpayerCredit ? CONFIG.taxpayerCredit : 0) + Math.max(0, input.extraCredits);
    const incomeTax = Math.max(0, grossTax - credits);

    const threshold = sideThreshold(input.months);
    const socialRequired = input.activity === 'main' || taxProfit >= threshold || input.socialVoluntary;
    const socialActualBase = taxProfit * CONFIG.socialBaseShare;
    const socialMinBase = socialMinimumBase(input.activity, input.months, input.isNew);
    let socialBase = 0;
    let social = 0;
    if (socialRequired) {
      socialBase = Math.min(CONFIG.socialMaxBase, Math.max(socialActualBase, socialMinBase));
      social = ceil(socialBase * CONFIG.socialRate);
    }

    const healthActualBase = taxProfit * CONFIG.healthBaseShare;
    const healthMinBase = input.healthMinimum ? CONFIG.healthMinMonthlyBase * input.months : 0;
    const healthBase = Math.max(healthActualBase, healthMinBase);
    const health = ceil(healthBase * CONFIG.healthRate);

    const duties = incomeTax + social + health;
    const adminCost = method === 'flat' ? input.flatAdminCost : input.actualAdminCost;
    const adminHours = method === 'flat' ? input.flatAdminHours : input.actualAdminHours;
    const timeCost = adminHours * input.hourValue;
    const cashAfterDuties = revenue - input.cashCosts - duties;
    const economicNet = cashAfterDuties - adminCost - timeCost;

    return {
      method,
      revenue,
      taxExpenses,
      taxProfitRaw,
      taxProfit,
      taxBase,
      grossTax,
      credits,
      incomeTax,
      socialRequired,
      socialBase,
      social,
      healthBase,
      health,
      duties,
      adminCost,
      adminHours,
      timeCost,
      cashAfterDuties,
      economicNet,
      effectiveBurden: revenue ? duties / revenue : 0,
      expenseShare: revenue ? taxExpenses / revenue : 0,
      threshold
    };
  }

  function makeBasicInput() {
    const revenue = num('basicRevenue');
    const rate = Number(val('basicRate') || 60);
    return {
      mode: 'basic',
      revenue,
      flatExpenses: flatExpenseSingle(revenue, rate),
      flatDescription: `Paušál ${rate} %`,
      actualTaxExpenses: num('basicActualTaxExpenses'),
      cashCosts: num('basicCashCosts'),
      activity: val('basicActivity') || 'main',
      startMonth: 1,
      months: 12,
      taxpayerCredit: bool('basicTaxpayerCredit'),
      extraCredits: 0,
      deductions: 0,
      isNew: false,
      socialVoluntary: false,
      healthMinimum: (val('basicActivity') || 'main') === 'main',
      flatAdminCost: 0,
      actualAdminCost: 0,
      flatAdminHours: 0,
      actualAdminHours: 0,
      hourValue: 0,
      evidenceConfidence: 'high'
    };
  }

  function makeAdvancedInput() {
    const startMonth = Math.min(12, Math.max(1, Math.round(num('advStartMonth') || 1)));
    const months = Math.min(13 - startMonth, Math.max(1, Math.round(num('advMonths') || 12)));
    if ($('advMonths')) $('advMonths').value = months;
    const parts = {
      80: num('advRevenue80'),
      60: num('advRevenue60'),
      40: num('advRevenue40'),
      30: num('advRevenue30')
    };
    const revenue = Object.values(parts).reduce((sum, n) => sum + n, 0);
    const flatExpenses = mixedFlatExpenses(parts);
    return {
      mode: 'advanced',
      revenue,
      revenueParts: parts,
      flatExpenses,
      flatDescription: 'Kombinovaný výdajový paušál',
      actualTaxExpenses: num('advActualTaxExpenses'),
      cashCosts: num('advCashCosts'),
      activity: val('advActivity') || 'main',
      startMonth,
      months,
      taxpayerCredit: bool('advTaxpayerCredit'),
      extraCredits: num('advExtraCredits'),
      deductions: num('advDeductions'),
      isNew: bool('advNewOs'),
      socialVoluntary: bool('advSocialVoluntary'),
      healthMinimum: bool('advHealthMinimum'),
      flatAdminCost: num('advFlatAdminCost'),
      actualAdminCost: num('advActualAdminCost'),
      flatAdminHours: num('advFlatAdminHours'),
      actualAdminHours: num('advActualAdminHours'),
      hourValue: num('advHourValue'),
      evidenceConfidence: val('advEvidenceConfidence') || 'high'
    };
  }

  function findBreakEven(input, targetEconomicNet) {
    let low = 0;
    let high = Math.max(input.revenue * 1.5, input.flatExpenses * 1.5, 100000);
    for (let i = 0; i < 70; i += 1) {
      const mid = (low + high) / 2;
      const test = computeVariant({ ...input, actualTaxExpenses: mid }, 'actual');
      if (test.economicNet >= targetEconomicNet) high = mid;
      else low = mid;
    }
    return high;
  }

  function recommendation(input, flat, actual) {
    const difference = flat.economicNet - actual.economicNet;
    const confidencePenalty = input.evidenceConfidence === 'low' ? Math.max(5000, input.actualTaxExpenses * 0.03) : 0;
    const adjustedDifference = difference + confidencePenalty;
    const tolerance = Math.max(1200, input.revenue * 0.0015);
    if (Math.abs(adjustedDifference) <= tolerance) {
      return {
        winner: 'tie',
        title: 'Finanční výsledek je téměř vyrovnaný',
        badge: 'Rozhoduje jednoduchost a evidence',
        text: 'Rozdíl je malý. Rozhodnutí proto více ovlivní kvalita dokladů, čas na administrativu, stabilita nákladů a jistota správného daňového zařazení.'
      };
    }
    if (adjustedDifference > 0) {
      return {
        winner: 'flat',
        title: 'V modelu vycházejí lépe paušální výdaje',
        badge: `Výhoda ${money(Math.abs(difference))} za rok`,
        text: 'Paušál vytváří v zadaném scénáři vyšší ekonomický čistý výsledek po dani, pojistném a administrativních nákladech. Skutečné peněžní náklady ale stále musíte zaplatit.'
      };
    }
    return {
      winner: 'actual',
      title: 'V modelu vycházejí lépe skutečné výdaje',
      badge: `Výhoda ${money(Math.abs(difference))} za rok`,
      text: 'Prokazatelné daňové výdaje jsou dostatečně vysoké, aby jejich uplatnění převážilo jednodušší paušál. Výsledek předpokládá úplnou a obhajitelnou evidenci.'
    };
  }

  function renderScenarioGrid(input) {
    const grid = $('scenarioGrid');
    if (!grid) return;
    const shares = [10, 20, 30, 40, 50, 60];
    const flat = computeVariant(input, 'flat');
    grid.innerHTML = shares.map((share) => {
      const actual = computeVariant({ ...input, actualTaxExpenses: input.revenue * share / 100 }, 'actual');
      const diff = flat.economicNet - actual.economicNet;
      const winner = Math.abs(diff) < 1000 ? 'Vyrovnáno' : diff > 0 ? 'Paušál' : 'Skutečné';
      const cls = Math.abs(input.actualTaxExpenses / Math.max(1, input.revenue) * 100 - share) < 4 ? ' is-current' : '';
      return `<article class="scenario-card${cls}"><span>Skutečné výdaje ${share} %</span><strong>${winner}</strong><small>${Math.abs(diff) < 1000 ? 'rozdíl do 1 000 Kč' : `${money(Math.abs(diff))} / rok`}</small></article>`;
    }).join('');
  }

  function renderBreakdown(input, flat, actual) {
    const body = $('breakdownBody');
    if (!body) return;
    const rows = [
      ['Daňové výdaje', flat.taxExpenses, actual.taxExpenses],
      ['Základ před odpočty', flat.taxProfitRaw, actual.taxProfitRaw],
      ['Daň z příjmů', flat.incomeTax, actual.incomeTax],
      ['Sociální pojištění', flat.social, actual.social],
      ['Zdravotní pojištění', flat.health, actual.health],
      ['Daň a pojistné celkem', flat.duties, actual.duties],
      ['Administrativa a hodnota času', flat.adminCost + flat.timeCost, actual.adminCost + actual.timeCost],
      ['Ekonomicky zůstane', flat.economicNet, actual.economicNet]
    ];
    body.innerHTML = rows.map(([label, a, b], index) => {
      const highlight = index === rows.length - 1 ? ' class="is-total"' : '';
      return `<tr${highlight}><td>${label}</td><td>${money(a)}</td><td>${money(b)}</td><td>${signedMoney(a - b)}</td></tr>`;
    }).join('');
  }

  function renderMixedRevenue(input) {
    const box = $('mixedRevenueSummary');
    if (!box) return;
    if (input.mode !== 'advanced') {
      box.innerHTML = '<p>V základním režimu se počítá jedna sazba výdajového paušálu.</p>';
      return;
    }
    const parts = [80, 60, 40, 30].map((rate) => {
      const revenue = input.revenueParts[rate] || 0;
      const expense = flatExpenseSingle(revenue, rate);
      return `<div><span>${rate}% činnost</span><strong>${money(revenue)}</strong><small>paušální výdaj ${money(expense)}</small></div>`;
    }).join('');
    box.innerHTML = parts;
  }

  function render(input) {
    const flat = computeVariant(input, 'flat');
    const actual = computeVariant(input, 'actual');
    const rec = recommendation(input, flat, actual);
    const diff = flat.economicNet - actual.economicNet;
    const breakEven = findBreakEven(input, flat.economicNet);
    const breakEvenShare = input.revenue ? breakEven / input.revenue : 0;

    $('winnerTitle').textContent = rec.title;
    $('winnerBadge').textContent = rec.badge;
    $('winnerText').textContent = rec.text;
    $('resultMethod').textContent = rec.winner === 'flat' ? 'Paušální výdaje' : rec.winner === 'actual' ? 'Skutečné výdaje' : 'Téměř shodné';
    $('annualAdvantage').textContent = money(Math.abs(diff));
    $('monthlyAdvantage').textContent = money(Math.abs(diff) / Math.max(1, input.months));
    $('breakEvenExpenses').textContent = money(breakEven);
    $('breakEvenShare').textContent = pct(breakEvenShare);

    $('flatTaxExpenses').textContent = money(flat.taxExpenses);
    $('actualTaxExpensesResult').textContent = money(actual.taxExpenses);
    if ($('actualTaxExpensesResultCard')) $('actualTaxExpensesResultCard').textContent = money(actual.taxExpenses);
    $('flatDuties').textContent = money(flat.duties);
    $('actualDuties').textContent = money(actual.duties);
    $('flatNet').textContent = money(flat.economicNet);
    $('actualNet').textContent = money(actual.economicNet);
    $('flatBurden').textContent = pct(flat.effectiveBurden);
    $('actualBurden').textContent = pct(actual.effectiveBurden);

    const actualShare = input.revenue ? input.actualTaxExpenses / input.revenue : 0;
    const flatShare = input.revenue ? input.flatExpenses / input.revenue : 0;
    $('expenseGaugeFlat').style.width = `${Math.min(100, flatShare * 100)}%`;
    $('expenseGaugeActual').style.width = `${Math.min(100, actualShare * 100)}%`;
    $('expenseGaugeFlatLabel').textContent = pct(flatShare);
    $('expenseGaugeActualLabel').textContent = pct(actualShare);

    $('heroWinner').textContent = rec.winner === 'actual' ? 'Skutečné' : rec.winner === 'tie' ? 'Vyrovnáno' : 'Paušál';
    $('heroDifference').textContent = shortMoney(Math.abs(diff));
    if ($('heroDifferenceFoot')) $('heroDifferenceFoot').textContent = money(Math.abs(diff));
    $('heroThreshold').textContent = pct(breakEvenShare, 0);

    const evidenceWarning = $('evidenceWarning');
    if (evidenceWarning) {
      evidenceWarning.hidden = input.mode !== 'advanced' || input.evidenceConfidence !== 'low';
    }

    $('resultPanel').dataset.winner = rec.winner;
    renderScenarioGrid(input);
    renderBreakdown(input, flat, actual);
    renderMixedRevenue(input);

    window.__expenseComparisonResult = { input, flat, actual, recommendation: rec, breakEven };
  }

  function currentInput() {
    return document.body.dataset.mode === 'advanced' ? makeAdvancedInput() : makeBasicInput();
  }

  function update() {
    render(currentInput());
  }

  function setMode(mode, transfer = true) {
    document.body.dataset.mode = mode;
    $('expenseForm').dataset.mode = mode;
    const basic = mode === 'basic';
    $('basicCalculation').hidden = !basic;
    $('advancedCalculation').hidden = basic;
    $('advancedResultPanel').hidden = basic;
    $('basicModeTab').classList.toggle('is-active', basic);
    $('advancedModeTab').classList.toggle('is-active', !basic);
    $('basicModeTab').setAttribute('aria-selected', String(basic));
    $('advancedModeTab').setAttribute('aria-selected', String(!basic));
    $('resultMode').textContent = basic ? 'Základní režim' : 'PRO srovnání';
    if (!basic && transfer) {
      const rate = val('basicRate') || '60';
      ['80', '60', '40', '30'].forEach((r) => {
        const el = $(`advRevenue${r}`);
        if (el) el.value = r === rate ? num('basicRevenue') : 0;
      });
      $('advActualTaxExpenses').value = num('basicActualTaxExpenses');
      $('advCashCosts').value = num('basicCashCosts');
      $('advActivity').value = val('basicActivity');
      $('advTaxpayerCredit').checked = bool('basicTaxpayerCredit');
      $('advHealthMinimum').checked = val('basicActivity') === 'main';
      showWizardStep(1);
    }
    update();
  }

  function showWizardStep(step) {
    const s = Math.max(1, Math.min(3, Number(step) || 1));
    document.querySelectorAll('[data-wizard-panel]').forEach((panel) => {
      panel.hidden = Number(panel.dataset.wizardPanel) !== s;
    });
    document.querySelectorAll('[data-wizard-step]').forEach((button) => {
      const active = Number(button.dataset.wizardStep) === s;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-current', active ? 'step' : 'false');
    });
    $('wizardProgressBar').style.width = `${s / 3 * 100}%`;
    $('wizardProgressText').textContent = `Krok ${s} ze 3`;
    $('wizardBack').disabled = s === 1;
    $('wizardNext').hidden = s === 3;
    $('wizardFinish').hidden = s !== 3;
    $('advancedCalculation').dataset.currentStep = String(s);
  }

  function changeWizard(delta) {
    const current = Number($('advancedCalculation').dataset.currentStep || 1);
    showWizardStep(current + delta);
    $('advancedCalculation').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetDefaults() {
    $('expenseForm').reset();
    setMode('basic', false);
    showWizardStep(1);
  }

  function copyResult() {
    const data = window.__expenseComparisonResult;
    if (!data) return;
    const { input, flat, actual, recommendation: rec, breakEven } = data;
    const text = [
      'Paušální výdaje vs. skutečné výdaje OSVČ 2026',
      rec.title,
      `Roční příjmy: ${money(input.revenue)}`,
      `Paušální daňové výdaje: ${money(flat.taxExpenses)}`,
      `Skutečné daňové výdaje: ${money(actual.taxExpenses)}`,
      `Povinnosti při paušálu: ${money(flat.duties)}`,
      `Povinnosti při skutečných výdajích: ${money(actual.duties)}`,
      `Ekonomicky zůstane – paušál: ${money(flat.economicNet)}`,
      `Ekonomicky zůstane – skutečné: ${money(actual.economicNet)}`,
      `Bod zvratu skutečných výdajů: ${money(breakEven)}`,
      'Výsledek je orientační.'
    ].join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      const btn = $('copyResult');
      const old = btn.textContent;
      btn.textContent = 'Zkopírováno';
      setTimeout(() => { btn.textContent = old; }, 1600);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('basicModeTab')?.addEventListener('click', () => setMode('basic'));
    $('advancedModeTab')?.addEventListener('click', () => setMode('advanced'));
    document.querySelectorAll('[data-wizard-step]').forEach((button) => {
      button.addEventListener('click', () => showWizardStep(button.dataset.wizardStep));
    });
    $('wizardBack')?.addEventListener('click', () => changeWizard(-1));
    $('wizardNext')?.addEventListener('click', () => changeWizard(1));
    $('wizardFinish')?.addEventListener('click', () => $('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' }));
    $('resetButton')?.addEventListener('click', resetDefaults);
    $('copyResult')?.addEventListener('click', copyResult);
    $('printResult')?.addEventListener('click', () => window.print());
    $('expenseForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      update();
      $('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('expenseForm')?.addEventListener('input', update);
    $('expenseForm')?.addEventListener('change', update);
    showWizardStep(1);
    setMode('basic', false);
  });
})();
