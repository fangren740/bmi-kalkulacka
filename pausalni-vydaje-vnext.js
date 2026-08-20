(() => {
  'use strict';

  const CFG = {
    year: 2026,
    taxThreshold: 1762812,
    taxpayerCredit: 30840,
    socialRate: 0.292,
    socialBaseShare: 0.55,
    socialMaxBase: 2350416,
    socialMainMinMonthlyBase: 17139,
    socialNewMinMonthlyBase: 12242,
    socialSideMinMonthlyBase: 5387,
    sideThresholdFull: 117521,
    sideThresholdReduction: 9794,
    healthRate: 0.135,
    healthBaseShare: 0.5,
    healthMinMonthlyBase: 24483.5,
    flatCaps: { 80: 1600000, 60: 1200000, 40: 800000, 30: 600000 }
  };

  const $ = (id) => document.getElementById(id);
  const numberValue = (id, fallback = 0) => {
    const n = Number($(id)?.value);
    return Number.isFinite(n) ? Math.max(0, n) : fallback;
  };
  const checked = (id) => Boolean($(id)?.checked);
  const ceil = (n) => Math.ceil(Math.max(0, Number(n.toFixed(8))));
  const floor100 = (n) => Math.floor(Math.max(0, n) / 100) * 100;
  const money = (n) => `${Math.round(Math.max(0, n)).toLocaleString('cs-CZ')} Kč`;
  const pct = (n, digits = 0) => `${(Math.max(0, n) * 100).toLocaleString('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;

  function progressiveTax(base) {
    const rounded = floor100(base);
    return ceil(Math.min(rounded, CFG.taxThreshold) * 0.15 + Math.max(0, rounded - CFG.taxThreshold) * 0.23);
  }

  function incomeTaxIncrement(profit, input) {
    const other = Math.max(0, input.otherTaxBase);
    const deductions = Math.max(0, input.deductions);
    const credits = (input.taxpayerCredit ? CFG.taxpayerCredit : 0) + Math.max(0, input.extraCredits);
    const beforeBase = Math.max(0, other - deductions);
    const afterBase = Math.max(0, other + profit - deductions);
    const beforeTax = Math.max(0, progressiveTax(beforeBase) - credits);
    const afterTax = Math.max(0, progressiveTax(afterBase) - credits);
    return Math.max(0, afterTax - beforeTax);
  }

  function sideThreshold(months) {
    return Math.max(0, CFG.sideThresholdFull - CFG.sideThresholdReduction * (12 - months));
  }

  function socialMinimumBase(input) {
    if (input.activity === 'side') return CFG.socialSideMinMonthlyBase * input.months;
    return (input.newOsvc ? CFG.socialNewMinMonthlyBase : CFG.socialMainMinMonthlyBase) * input.months;
  }

  function flatExpenseFor(revenue, rate) {
    const r = Number(rate);
    return Math.min(Math.max(0, revenue) * r / 100, CFG.flatCaps[r] || 0);
  }

  function getRevenueAndFlatExpense() {
    const rate = $('flatRate')?.value || '60';
    if (rate !== 'mixed') {
      const revenue = numberValue('revenue', 1200000);
      return { revenue, flatExpenses: flatExpenseFor(revenue, rate), rate, label: `${rate}% výdajový paušál` };
    }
    const parts = [80, 60, 40, 30].map((r) => ({ rate: r, revenue: numberValue(`revenue${r}`) }));
    const revenue = parts.reduce((sum, p) => sum + p.revenue, 0);
    const flatExpenses = parts.reduce((sum, p) => sum + flatExpenseFor(p.revenue, p.rate), 0);
    return { revenue, flatExpenses, rate, parts, label: 'kombinovaný výdajový paušál' };
  }

  function collect() {
    const flat = getRevenueAndFlatExpense();
    const months = Math.min(12, Math.max(1, Math.round(numberValue('months', 12))));
    return {
      ...flat,
      actualExpensesEntered: numberValue('actualExpenses', 360000),
      activity: $('activity')?.value || 'main',
      months,
      otherTaxBase: numberValue('otherTaxBase', 0),
      deductions: numberValue('deductions', 0),
      extraCredits: numberValue('extraCredits', 0),
      taxpayerCredit: checked('taxpayerCredit'),
      newOsvc: checked('newOsvc'),
      healthMinimum: checked('healthMinimum'),
      socialVoluntary: checked('socialVoluntary')
    };
  }

  function calculateVariant(input, method, actualOverride = null) {
    const taxExpenses = method === 'flat'
      ? Math.min(input.revenue, input.flatExpenses)
      : Math.min(input.revenue, Math.max(0, actualOverride === null ? input.actualExpensesEntered : actualOverride));
    const profit = Math.max(0, input.revenue - taxExpenses);
    const tax = incomeTaxIncrement(profit, input);

    const threshold = sideThreshold(input.months);
    const socialRequired = input.activity === 'main' || profit >= threshold || input.socialVoluntary;
    const socialActualBase = profit * CFG.socialBaseShare;
    const socialMin = socialMinimumBase(input);
    const socialBase = socialRequired ? Math.min(CFG.socialMaxBase, Math.max(socialActualBase, socialMin)) : 0;
    const social = socialRequired ? ceil(socialBase * CFG.socialRate) : 0;

    const healthActualBase = profit * CFG.healthBaseShare;
    const healthMin = input.healthMinimum ? CFG.healthMinMonthlyBase * input.months : 0;
    const healthBase = Math.max(healthActualBase, healthMin);
    const health = ceil(healthBase * CFG.healthRate);

    return { method, taxExpenses, profit, tax, social, health, total: tax + social + health, threshold, socialRequired, socialBase, healthBase };
  }

  function findBreakEven(input, flat) {
    if (input.revenue <= 0) return 0;
    const atZero = calculateVariant(input, 'actual', 0).total;
    if (atZero <= flat.total) return 0;
    let low = 0;
    let high = input.revenue;
    const atHigh = calculateVariant(input, 'actual', high).total;
    if (atHigh > flat.total) return input.revenue;
    for (let i = 0; i < 70; i += 1) {
      const mid = (low + high) / 2;
      const value = calculateVariant(input, 'actual', mid).total;
      if (value <= flat.total) high = mid;
      else low = mid;
    }
    return high;
  }

  function methodLabel(input) {
    if (input.rate === 'mixed') return 'kombinace 80 / 60 / 40 / 30 %';
    return `${input.rate} % z příjmů`;
  }

  function recommendation(flat, actual) {
    const diff = flat.total - actual.total;
    if (Math.abs(diff) <= 100) return { winner: 'tie', diff: Math.abs(diff) };
    return { winner: diff < 0 ? 'flat' : 'actual', diff: Math.abs(diff) };
  }

  function renderScenarioGrid(input, flat) {
    const root = $('scenarioGrid');
    if (!root) return;
    const shares = [10, 20, 30, 40, 50, 60, 70, 80];
    const currentShare = input.revenue > 0 ? Math.min(1, input.actualExpensesEntered / input.revenue) : 0;
    root.innerHTML = shares.map((share) => {
      const actual = calculateVariant(input, 'actual', input.revenue * share / 100);
      const rec = recommendation(flat, actual);
      const current = Math.abs(currentShare * 100 - share) <= 5;
      const label = rec.winner === 'tie' ? 'Téměř shodné' : rec.winner === 'flat' ? 'Paušál' : 'Skutečné';
      return `<article class="pv-scenario${current ? ' is-current' : ''}" data-winner="${rec.winner}"><span>${share} %</span><strong>${label}</strong><small>${rec.winner === 'tie' ? 'rozdíl do 100 Kč' : `${money(rec.diff)} / rok`}</small></article>`;
    }).join('');
  }

  function render() {
    const input = collect();
    const flat = calculateVariant(input, 'flat');
    const actual = calculateVariant(input, 'actual');
    const rec = recommendation(flat, actual);
    const breakEven = findBreakEven(input, flat);
    const breakShare = input.revenue > 0 ? breakEven / input.revenue : 0;
    const actualShare = input.revenue > 0 ? Math.min(1, input.actualExpensesEntered / input.revenue) : 0;

    $('mixedFields').hidden = input.rate !== 'mixed';
    $('revenue').closest('.pv-form-block').hidden = input.rate === 'mixed';
    $('mixedTotal').textContent = money(input.revenue);
    $('expenseWarning').hidden = input.actualExpensesEntered <= input.revenue || input.revenue === 0;
    $('newOsvcWrap').hidden = input.activity !== 'main';
    $('socialVoluntaryWrap').hidden = input.activity !== 'side';

    $('flatMethodLabel').textContent = methodLabel(input);
    $('flatExpenses').textContent = money(flat.taxExpenses);
    $('flatProfit').textContent = money(flat.profit);
    $('flatTax').textContent = money(flat.tax);
    $('flatSocial').textContent = money(flat.social);
    $('flatHealth').textContent = money(flat.health);
    $('flatTotal').textContent = money(flat.total);
    $('actualExpensesResult').textContent = money(actual.taxExpenses);
    $('actualProfit').textContent = money(actual.profit);
    $('actualTax').textContent = money(actual.tax);
    $('actualSocial').textContent = money(actual.social);
    $('actualHealth').textContent = money(actual.health);
    $('actualTotal').textContent = money(actual.total);

    const monthDivisor = Math.max(1, input.months);
    $('savingValue').textContent = rec.winner === 'tie' ? 'téměř 0 Kč' : money(rec.diff);
    $('savingMonth').textContent = rec.winner === 'tie' ? 'metody jsou prakticky vyrovnané' : `≈ ${money(rec.diff / monthDivisor)} / aktivní měsíc`;

    const winnerTag = $('winnerTag');
    const result = $('vysledek');
    result.dataset.winner = rec.winner;
    if (rec.winner === 'flat') {
      winnerTag.textContent = 'VYCHÁZÍ LÉPE PAUŠÁL';
      $('winnerTitle').textContent = 'Paušální výdaje v tomto scénáři snižují odvody.';
      $('winnerText').textContent = `Paušál vytváří daňové výdaje ${money(flat.taxExpenses)}, zatímco zadané skutečné výdaje jsou ${money(actual.taxExpenses)}. Rozdíl se promítá do daně a pojistného.`;
    } else if (rec.winner === 'actual') {
      winnerTag.textContent = 'VYCHÁZEJÍ LÉPE SKUTEČNÉ';
      $('winnerTitle').textContent = 'Skutečné výdaje v tomto scénáři snižují odvody.';
      $('winnerText').textContent = `Prokazatelné skutečné výdaje ${money(actual.taxExpenses)} jsou v modelu dostatečně vysoké, aby snížily daňový základ více než paušál ${money(flat.taxExpenses)}.`;
    } else {
      winnerTag.textContent = 'VÝSLEDEK JE VYROVNANÝ';
      $('winnerTitle').textContent = 'Daňový rozdíl mezi metodami je zanedbatelný.';
      $('winnerText').textContent = 'Při téměř shodném výsledku rozhoduje hlavně evidence, administrativní náročnost a jistota, že skutečné výdaje jsou obhajitelné.';
    }

    $('breakEvenValue').textContent = `${money(breakEven)} skutečných výdajů`;
    $('breakEvenPct').textContent = pct(breakShare, 0);
    $('actualPct').textContent = pct(actualShare, 0);
    $('breakEvenText').textContent = input.revenue > 0
      ? `Při současných parametrech se skutečné výdaje začnou daňově vyrovnávat paušálu přibližně na ${pct(breakShare, 1)} příjmů. Bod může být jiný než samotná sazba paušálu kvůli stropům, minimům a slevám.`
      : 'Zadejte kladné příjmy a kalkulačka dopočítá hranici, od které se skutečné výdaje vyrovnají paušálu.';
    const breakPos = Math.min(100, breakShare * 100);
    const actualPos = Math.min(100, actualShare * 100);
    $('breakEvenFill').style.width = `${breakPos}%`;
    $('breakEvenMarker').style.left = `${breakPos}%`;
    $('actualMarker').style.left = `${actualPos}%`;

    $('heroRevenue').textContent = money(input.revenue);
    $('heroFlatExpense').textContent = money(flat.taxExpenses);
    $('heroActualExpense').textContent = money(actual.taxExpenses);
    $('heroSaving').textContent = rec.winner === 'tie' ? '≈ 0 Kč' : money(rec.diff);
    $('heroWinnerLabel').textContent = rec.winner === 'flat' ? 'LÉPE VYCHÁZÍ PAUŠÁL' : rec.winner === 'actual' ? 'LÉPE VYCHÁZEJÍ SKUTEČNÉ' : 'VÝSLEDEK JE VYROVNANÝ';
    $('heroBreakEven').textContent = input.revenue > 0 ? `${pct(breakShare, 0)} příjmů` : '—';
    $('heroBreakFill').style.width = `${breakPos}%`;
    $('heroBreakMarker').style.left = `${breakPos}%`;

    $('resultMeaning').textContent = `Při stejných příjmech ${money(input.revenue)} měníte pouze daňovou metodu. Reálné podnikatelské náklady tím nezmizí ani nevzniknou. V tomto modelu je rozdíl na dani a povinném pojistném ${rec.winner === 'tie' ? 'zanedbatelný' : money(rec.diff)}.`;

    renderScenarioGrid(input, flat);
    window.__rvPausalniVydaje = { input, flat, actual, recommendation: rec, breakEven };
  }

  function reset() {
    $('revenue').value = 1200000;
    $('flatRate').value = '60';
    $('revenue80').value = 0;
    $('revenue60').value = 900000;
    $('revenue40').value = 300000;
    $('revenue30').value = 0;
    $('actualExpenses').value = 360000;
    $('activity').value = 'main';
    $('months').value = 12;
    $('otherTaxBase').value = 0;
    $('deductions').value = 0;
    $('extraCredits').value = 0;
    $('taxpayerCredit').checked = true;
    $('newOsvc').checked = false;
    $('healthMinimum').checked = true;
    $('socialVoluntary').checked = false;
    render();
  }

  const form = $('expenseForm');
  form?.addEventListener('input', render);
  form?.addEventListener('change', (event) => {
    if (event.target?.id === 'activity') {
      const side = event.target.value === 'side';
      $('healthMinimum').checked = !side;
      $('newOsvc').checked = false;
      $('socialVoluntary').checked = false;
    }
    render();
  });
  form?.addEventListener('submit', (event) => { event.preventDefault(); render(); document.getElementById('vysledek')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  $('resetButton')?.addEventListener('click', reset);

  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  render();
})();
