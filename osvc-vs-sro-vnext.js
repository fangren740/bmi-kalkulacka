(() => {
  'use strict';

  const CFG = {
    year: 2026,
    taxThreshold: 1762812,
    taxpayerCredit: 30840,
    osvcSocialRate: 0.292,
    osvcSocialShare: 0.55,
    osvcSocialMinMonthlyBase: 17139,
    osvcSocialNewMinMonthlyBase: 12242,
    osvcSocialMaxBase: 2350416,
    osvcHealthRate: 0.135,
    osvcHealthShare: 0.50,
    osvcHealthMinMonthlyBase: 24483.5,
    corpTaxRate: 0.21,
    dividendTaxRate: 0.15,
    employeeSocial: 0.071,
    employeeHealth: 0.045,
    employerSocial: 0.248,
    employerHealth: 0.09,
    obzpMonthly: 3024,
    flatCaps: { 80: 1600000, 60: 1200000, 40: 800000, 30: 600000 }
  };

  const $ = (id) => document.getElementById(id);
  const n = (id, fallback = 0) => {
    const v = Number($(id)?.value);
    return Number.isFinite(v) ? Math.max(0, v) : fallback;
  };
  const checked = (id) => Boolean($(id)?.checked);
  const ceil = (v) => Math.ceil(Math.max(0, Number(v.toFixed(8))));
  const floor100 = (v) => Math.floor(Math.max(0, v) / 100) * 100;
  const floor1000 = (v) => Math.floor(Math.max(0, v) / 1000) * 1000;
  const money = (v) => `${Math.round(v).toLocaleString('cs-CZ')} Kč`;
  const compact = (v) => {
    const x = Math.round(v);
    if (Math.abs(x) >= 1000000) return `${(x / 1000000).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} mil.`;
    if (Math.abs(x) >= 1000) return `${Math.round(x / 1000).toLocaleString('cs-CZ')} tis.`;
    return x.toLocaleString('cs-CZ');
  };
  const percent = (v, d = 0) => `${(v * 100).toLocaleString('cs-CZ', { minimumFractionDigits: d, maximumFractionDigits: d })} %`;

  function progressiveTax(base) {
    const rounded = floor100(base);
    return ceil(Math.min(rounded, CFG.taxThreshold) * 0.15 + Math.max(0, rounded - CFG.taxThreshold) * 0.23);
  }

  function flatExpense(revenue, mode) {
    if (mode === 'actual') return null;
    const rate = Number(mode);
    return Math.min(revenue * rate / 100, CFG.flatCaps[rate] || 0);
  }

  function salaryModel(monthlyGross, creditOn) {
    const gross = Math.max(0, monthlyGross) * 12;
    const employeeSocial = ceil(gross * CFG.employeeSocial);
    const employeeHealth = ceil(gross * CFG.employeeHealth);
    const employerSocial = ceil(gross * CFG.employerSocial);
    const employerHealth = ceil(gross * CFG.employerHealth);
    const tax = Math.max(0, progressiveTax(gross) - (creditOn ? CFG.taxpayerCredit : 0));
    const net = Math.max(0, gross - employeeSocial - employeeHealth - tax);
    const companyCost = gross + employerSocial + employerHealth;
    return { gross, employeeSocial, employeeHealth, employerSocial, employerHealth, tax, net, companyCost };
  }

  function collect() {
    return {
      revenue: n('revenue', 1800000),
      cashCosts: n('cashCosts', 360000),
      expenseMode: $('expenseMode')?.value || '60',
      sroAdmin: n('sroAdmin', 60000),
      newOs: checked('newOs'),
      salaryMonthly: n('salaryMonthly', 0),
      salaryCredit: checked('salaryCredit'),
      distribution: Math.min(1, n('distribution', 100) / 100),
      ownerObzp: checked('ownerObzp')
    };
  }

  function calcOsvc(input, revenueOverride = null, costOverride = null) {
    const revenue = revenueOverride === null ? input.revenue : revenueOverride;
    const cashCosts = costOverride === null ? input.cashCosts : costOverride;
    const flat = flatExpense(revenue, input.expenseMode);
    const taxExpenses = Math.min(revenue, flat === null ? cashCosts : flat);
    const profit = Math.max(0, revenue - taxExpenses);
    const tax = Math.max(0, progressiveTax(profit) - CFG.taxpayerCredit);
    const minSocialBase = (input.newOs ? CFG.osvcSocialNewMinMonthlyBase : CFG.osvcSocialMinMonthlyBase) * 12;
    const socialBase = Math.min(CFG.osvcSocialMaxBase, Math.max(profit * CFG.osvcSocialShare, minSocialBase));
    const social = ceil(socialBase * CFG.osvcSocialRate);
    const healthBase = Math.max(profit * CFG.osvcHealthShare, CFG.osvcHealthMinMonthlyBase * 12);
    const health = ceil(healthBase * CFG.osvcHealthRate);
    const publicPayments = tax + social + health;
    const ownerCash = revenue - cashCosts - publicPayments;
    return { revenue, cashCosts, taxExpenses, profit, tax, social, health, publicPayments, ownerCash, socialBase, healthBase };
  }

  function calcSro(input, revenueOverride = null, costOverride = null) {
    const revenue = revenueOverride === null ? input.revenue : revenueOverride;
    const cashCosts = costOverride === null ? input.cashCosts : costOverride;
    const salary = salaryModel(input.salaryMonthly, input.salaryCredit);
    const profitBeforeTax = Math.max(0, revenue - cashCosts - input.sroAdmin - salary.companyCost);
    const taxable = floor1000(profitBeforeTax);
    const corpTax = ceil(taxable * CFG.corpTaxRate);
    const afterTaxProfit = Math.max(0, profitBeforeTax - corpTax);
    const distributed = afterTaxProfit * input.distribution;
    const dividendTax = ceil(distributed * CFG.dividendTaxRate);
    const netDividend = Math.max(0, distributed - dividendTax);
    const retained = Math.max(0, afterTaxProfit - distributed);
    const obzp = input.ownerObzp ? CFG.obzpMonthly * 12 : 0;
    const ownerCash = salary.net + netDividend - obzp;
    const publicPayments = corpTax + dividendTax + salary.tax + salary.employeeSocial + salary.employeeHealth + salary.employerSocial + salary.employerHealth + obzp;
    return { revenue, cashCosts, salary, profitBeforeTax, taxable, corpTax, afterTaxProfit, distributed, dividendTax, netDividend, retained, obzp, ownerCash, publicPayments };
  }

  function calculate(input, revenueOverride = null, costOverride = null) {
    const osvc = calcOsvc(input, revenueOverride, costOverride);
    const sro = calcSro(input, revenueOverride, costOverride);
    const diff = sro.ownerCash - osvc.ownerCash;
    const winner = Math.abs(diff) < 1000 ? 'tie' : diff > 0 ? 'sro' : 'osvc';
    return { input, osvc, sro, diff, winner };
  }

  function findBreakEven(input) {
    const baseRevenue = Math.max(1, input.revenue);
    const costShare = Math.min(0.95, input.cashCosts / baseRevenue);
    const currentDiff = calculate(input, baseRevenue, baseRevenue * costShare).diff;
    const step = 25000;
    const minRevenue = 100000;
    const maxRevenue = 10000000;

    // Search from the user's current point in the direction that answers the
    // practical question: when does the currently losing form catch up?
    let prevRevenue = baseRevenue;
    let prev = currentDiff;
    const direction = currentDiff <= 0 ? 1 : -1;
    for (let revenue = baseRevenue + direction * step; revenue >= minRevenue && revenue <= maxRevenue; revenue += direction * step) {
      const current = calculate(input, revenue, revenue * costShare).diff;
      if ((prev <= 0 && current >= 0) || (prev >= 0 && current <= 0)) {
        let lo = Math.min(prevRevenue, revenue);
        let hi = Math.max(prevRevenue, revenue);
        let dlo = calculate(input, lo, lo * costShare).diff;
        for (let i = 0; i < 45; i += 1) {
          const mid = (lo + hi) / 2;
          const d = calculate(input, mid, mid * costShare).diff;
          if ((dlo <= 0 && d >= 0) || (dlo >= 0 && d <= 0)) hi = mid;
          else { lo = mid; dlo = d; }
        }
        return { found: true, revenue: hi, costShare, direction };
      }
      prevRevenue = revenue;
      prev = current;
    }
    return { found: false, revenue: null, costShare, direction };
  }

  function taxMethodLabel(input) {
    return input.expenseMode === 'actual' ? 'skutečné výdaje' : `${input.expenseMode}% paušál`;
  }

  function setText(id, value) { if ($(id)) $(id).textContent = value; }

  function renderBreakdown(r) {
    const rows = [
      ['Roční tržby bez DPH', r.osvc.revenue, r.sro.revenue],
      ['Reálné provozní náklady', -r.osvc.cashCosts, -r.sro.cashCosts],
      ['Daňové výdaje / základ firmy', -r.osvc.taxExpenses, r.sro.profitBeforeTax],
      ['Daň z příjmů / daň firmy', -r.osvc.tax, -r.sro.corpTax],
      ['Sociální + zdravotní OSVČ', -(r.osvc.social + r.osvc.health), 0],
      ['Náklady správy s.r.o.', 0, -r.input.sroAdmin],
      ['Čistá odměna majitele', 0, r.sro.salary.net],
      ['Čistý podíl na zisku', 0, r.sro.netDividend],
      ['Zisk ponechaný ve firmě', 0, r.sro.retained],
      ['Osobní cash-flow majitele', r.osvc.ownerCash, r.sro.ownerCash]
    ];
    const body = $('breakdownBody');
    if (!body) return;
    body.innerHTML = rows.map(([label, a, b]) => `<tr><th scope="row">${label}</th><td class="${a < 0 ? 'is-out' : ''}">${a < 0 ? '− ' : ''}${money(Math.abs(a))}</td><td class="${b < 0 ? 'is-out' : ''}">${b < 0 ? '− ' : ''}${money(Math.abs(b))}</td></tr>`).join('');
  }

  function renderHeatmap(mode, rootId) {
    const root = $(rootId);
    if (!root) return;
    const revenues = [600000, 900000, 1200000, 1800000, 2400000, 3000000];
    const shares = [0.10, 0.20, 0.30, 0.40];
    const base = {
      ...collect(),
      expenseMode: mode,
      sroAdmin: 60000,
      salaryMonthly: 0,
      distribution: 1,
      ownerObzp: false,
      newOs: false
    };
    let html = '<div class="ovs-heat-corner"><span>náklady</span><b>tržby</b></div>';
    revenues.forEach((rev) => { html += `<div class="ovs-heat-head">${compact(rev)}</div>`; });
    shares.forEach((share) => {
      html += `<div class="ovs-heat-rowhead">${Math.round(share * 100)} %</div>`;
      revenues.forEach((rev) => {
        const r = calculate(base, rev, rev * share);
        const cls = r.winner === 'sro' ? 'is-sro' : r.winner === 'osvc' ? 'is-osvc' : 'is-tie';
        const label = r.winner === 'sro' ? 's.r.o.' : r.winner === 'osvc' ? 'OSVČ' : '≈';
        html += `<div class="ovs-heat-cell ${cls}" title="${money(Math.abs(r.diff))} rozdíl v osobním cash-flow"><strong>${label}</strong><small>${compact(Math.abs(r.diff))}</small></div>`;
      });
    });
    root.innerHTML = html;
  }

  function render() {
    const input = collect();
    const r = calculate(input);
    const be = findBreakEven(input);
    const abs = Math.abs(r.diff);

    const isActual = input.expenseMode === 'actual';
    const actualHint = $('actualHint');
    if (actualHint) actualHint.hidden = !isActual;

    const title = r.winner === 'osvc'
      ? `OSVČ nechá majiteli o ${money(abs)} více za rok.`
      : r.winner === 'sro'
        ? `s.r.o. nechá majiteli o ${money(abs)} více za rok.`
        : 'Osobní cash-flow obou forem je téměř stejné.';
    const badge = r.winner === 'osvc' ? 'VYCHÁZÍ LÉPE OSVČ' : r.winner === 'sro' ? 'VYCHÁZÍ LÉPE S.R.O.' : 'TÉMĚŘ SHODA';

    setText('winnerBadge', badge);
    setText('winnerTitle', title);
    setText('winnerText', r.winner === 'tie'
      ? 'Rozdíl je pod 1 000 Kč. V této zóně už mají větší váhu administrativa, ručení, práce se ziskem a budoucí plány firmy.'
      : `Porovnání používá stejné tržby ${money(input.revenue)} a stejné reálné provozní náklady ${money(input.cashCosts)}. U OSVČ se daň počítá metodou ${taxMethodLabel(input)}.`);

    setText('osvcCash', money(r.osvc.ownerCash));
    setText('sroCash', money(r.sro.ownerCash));
    setText('osvcPublic', money(r.osvc.publicPayments));
    setText('sroPublic', money(r.sro.publicPayments));
    setText('sroRetained', money(r.sro.retained));
    setText('sroCorpTax', money(r.sro.corpTax));
    setText('sroDividendTax', money(r.sro.dividendTax));
    setText('sroSalaryNet', money(r.sro.salary.net));
    setText('osvcTaxBase', money(r.osvc.profit));
    setText('osvcTaxExpense', money(r.osvc.taxExpenses));
    setText('resultDelta', money(abs));
    setText('resultDeltaLabel', r.winner === 'tie' ? 'rozdíl osobního cash-flow' : `${r.winner === 'osvc' ? 'OSVČ' : 's.r.o.'} navíc za rok`);

    const total = Math.max(1, Math.max(r.osvc.ownerCash, r.sro.ownerCash));
    if ($('osvcBar')) $('osvcBar').style.width = `${Math.max(6, r.osvc.ownerCash / total * 100)}%`;
    if ($('sroBar')) $('sroBar').style.width = `${Math.max(6, r.sro.ownerCash / total * 100)}%`;

    setText('heroRevenue', compact(input.revenue));
    setText('heroOsvcCash', compact(r.osvc.ownerCash));
    setText('heroSroCash', compact(r.sro.ownerCash));
    setText('heroDelta', `${r.diff > 0 ? '+' : r.diff < 0 ? '−' : '±'} ${compact(abs)}`);

    setText('flowOsvcStart', money(input.revenue - input.cashCosts));
    setText('flowOsvcTax', money(r.osvc.tax));
    setText('flowOsvcInsurance', money(r.osvc.social + r.osvc.health));
    setText('flowOsvcEnd', money(r.osvc.ownerCash));
    setText('flowSroStart', money(Math.max(0, input.revenue - input.cashCosts - input.sroAdmin - r.sro.salary.companyCost)));
    setText('flowSroCorp', money(r.sro.corpTax));
    setText('flowSroDividend', money(r.sro.dividendTax));
    setText('flowSroEnd', money(r.sro.ownerCash));

    const breakTitle = $('breakTitle');
    const breakText = $('breakText');
    const breakValue = $('breakValue');
    if (be.found) {
      const roundedBreak = Math.round(be.revenue / 10000) * 10000;
      breakValue.textContent = `≈ ${money(roundedBreak)}`;
      breakTitle.textContent = `Při stejném poměru nákladů se osobní cash-flow protne přibližně kolem ${money(roundedBreak)} tržeb.`;
      breakText.textContent = `Model drží reálné náklady na ${percent(be.costShare, 0)} tržeb, stejné daňové nastavení OSVČ, správu s.r.o., odměnu i podíl rozděleného zisku.`;
      const pos = Math.min(100, input.revenue / Math.max(be.revenue, input.revenue) * 100);
      if ($('breakMarker')) $('breakMarker').style.left = `${pos}%`;
    } else {
      breakValue.textContent = 'nenalezen do 10 mil. Kč';
      breakTitle.textContent = 'V aktuálním nastavení se do 10 mil. Kč tržeb osobní cash-flow neprotne.';
      breakText.textContent = 'To neznamená, že právní forma nemůže dávat smysl z jiných důvodů. Tento bod sleduje pouze peníze dostupné majiteli.';
      if ($('breakMarker')) $('breakMarker').style.left = '100%';
    }

    const routeNote = $('retainedNote');
    if (routeNote) routeNote.textContent = r.sro.retained > 0
      ? `${money(r.sro.retained)} zůstává v s.r.o. po dani firmy. Není to osobní příjem, ale může financovat další růst.`
      : 'V tomto nastavení se všechen zisk po dani rozděluje majiteli; ve firmě nezůstává modelový zisk.';

    renderBreakdown(r);
    window.__rvOsVsSro = { result: r, breakEven: be };
  }

  function reset() {
    $('revenue').value = 1800000;
    $('cashCosts').value = 360000;
    $('expenseMode').value = '60';
    $('sroAdmin').value = 60000;
    $('newOs').checked = false;
    $('salaryMonthly').value = 0;
    $('salaryCredit').checked = true;
    $('distribution').value = 100;
    $('ownerObzp').checked = false;
    render();
  }

  const form = $('entityForm');
  form?.addEventListener('input', render);
  form?.addEventListener('change', render);
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    render();
    $('vysledek')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  $('resetBtn')?.addEventListener('click', reset);

  const menu = document.querySelector('.ovs-menu');
  const nav = document.querySelector('.ovs-nav');
  menu?.addEventListener('click', () => {
    const open = !nav?.classList.contains('is-open');
    nav?.classList.toggle('is-open', open);
    menu.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      nav?.classList.remove('is-open');
      menu?.setAttribute('aria-expanded', 'false');
    }
  });

  renderHeatmap('actual', 'benchmarkActual');
  renderHeatmap('60', 'benchmarkFlat');
  render();
})();
