(() => {
  'use strict';

  const CFG = {
    year: 2026,
    sideThresholdFull: 117521,
    sideThresholdReduction: 9794,
    socialRate: 0.292,
    socialBaseShare: 0.55,
    socialMinMonthlyBase: 5387,
    socialMaxBase: 2350416,
    healthRate: 0.135,
    healthBaseShare: 0.5,
    healthMinMonthlyBase: 24483.5,
    taxThreshold: 1762812,
    taxpayerCredit: 30840,
    flatCaps: { 80: 1600000, 60: 1200000, 40: 800000, 30: 600000 }
  };

  const $ = (id) => document.getElementById(id);
  const toNumber = (value) => Math.max(0, Number(value || 0));
  const money = (value) => `${Math.round(value).toLocaleString('cs-CZ')} Kč`;
  const ceil = (value) => Math.ceil(Number(Math.max(0, value).toFixed(8)));
  const floorHundreds = (value) => Math.floor(Math.max(0, value) / 100) * 100;

  function activeMonths() {
    return Math.min(12, Math.max(1, Math.round(toNumber($('months')?.value || 12))));
  }

  function sideThreshold(months) {
    return Math.max(0, CFG.sideThresholdFull - CFG.sideThresholdReduction * (12 - months));
  }

  function taxExpensesFor(revenue, mode, actual) {
    if (mode === 'actual') return Math.min(revenue, toNumber(actual));
    const rate = Number(mode);
    return Math.min(revenue * rate / 100, CFG.flatCaps[rate] || 0);
  }

  function progressiveTax(base) {
    const rounded = floorHundreds(base);
    return ceil(
      Math.min(rounded, CFG.taxThreshold) * 0.15 +
      Math.max(0, rounded - CFG.taxThreshold) * 0.23
    );
  }

  function incomeTaxIncrement(profit, otherTaxBase, creditAvailable) {
    const other = toNumber(otherTaxBase);
    const credit = creditAvailable ? CFG.taxpayerCredit : 0;
    const withBusiness = Math.max(0, progressiveTax(other + profit) - credit);
    const withoutBusiness = Math.max(0, progressiveTax(other) - credit);
    return Math.max(0, withBusiness - withoutBusiness);
  }

  function revenueAtThreshold(mode, actualExpenses, months) {
    if (mode === 'actual') return null;
    const target = sideThreshold(months);
    let low = 0;
    let high = 6000000;
    for (let i = 0; i < 80; i += 1) {
      const mid = (low + high) / 2;
      const expenses = taxExpensesFor(mid, mode, actualExpenses);
      const profit = Math.max(0, mid - expenses);
      if (profit >= target) high = mid;
      else low = mid;
    }
    return high;
  }

  function getInput() {
    const revenue = toNumber($('revenue')?.value);
    const expenseMode = $('expenseMode')?.value || '60';
    const actualExpenses = toNumber($('actualExpenses')?.value);
    const months = activeMonths();
    const taxExpenses = taxExpensesFor(revenue, expenseMode, actualExpenses);
    const taxProfit = Math.max(0, revenue - taxExpenses);
    return {
      revenue,
      expenseMode,
      actualExpenses,
      months,
      taxExpenses,
      taxProfit,
      healthNoMinimum: Boolean($('healthNoMinimum')?.checked),
      socialVoluntary: Boolean($('socialVoluntary')?.checked),
      otherTaxBase: toNumber($('otherTaxBase')?.value),
      creditAvailable: Boolean($('creditAvailable')?.checked),
      cashCosts: toNumber($('cashCosts')?.value),
      status: $('sideReason')?.value || 'employee'
    };
  }

  function calculate(input) {
    const threshold = sideThreshold(input.months);
    const socialRequired = input.socialVoluntary || input.taxProfit >= threshold;
    const socialActualBase = ceil(input.taxProfit * CFG.socialBaseShare);
    const socialBase = socialRequired
      ? Math.min(CFG.socialMaxBase, Math.max(socialActualBase, CFG.socialMinMonthlyBase * input.months))
      : 0;
    const social = socialRequired ? ceil(socialBase * CFG.socialRate) : 0;

    const healthActualBase = input.taxProfit * CFG.healthBaseShare;
    const healthMinimumBase = input.healthNoMinimum ? 0 : CFG.healthMinMonthlyBase * input.months;
    const health = ceil(Math.max(healthActualBase, healthMinimumBase) * CFG.healthRate);
    const tax = incomeTaxIncrement(input.taxProfit, input.otherTaxBase, input.creditAvailable);
    const total = tax + social + health;
    const cashCosts = input.cashCosts;
    const netCash = input.revenue - cashCosts - total;
    const delta = input.taxProfit - threshold;
    const runway = revenueAtThreshold(input.expenseMode, input.actualExpenses, input.months);

    return { ...input, threshold, socialRequired, socialBase, social, health, tax, total, cashCosts, netCash, delta, runway };
  }

  function reasonLabel(value) {
    const labels = {
      employee: 'zaměstnání zakládající účast na pojištění',
      pension: 'důchod',
      parental: 'péče / rodičovská situace',
      student: 'studium',
      other: 'jiný doložený důvod'
    };
    return labels[value] || 'doložený důvod';
  }

  function renderMonthReference(currentMonths, profit) {
    const root = $('monthReference');
    if (!root) return;
    root.innerHTML = Array.from({ length: 12 }, (_, index) => 12 - index).map((month) => {
      const threshold = sideThreshold(month);
      const active = month === currentMonths;
      const crossed = profit >= threshold;
      return `<div class="sv-month${active ? ' is-active' : ''}${crossed ? ' is-crossed' : ''}">
        <span>${month} ${month === 1 ? 'měsíc' : month < 5 ? 'měsíce' : 'měsíců'}</span>
        <strong>${money(threshold)}</strong>
      </div>`;
    }).join('');
  }

  function renderRunway(result) {
    const title = $('runwayTitle');
    const value = $('runwayValue');
    const note = $('runwayNote');
    if (!title || !value || !note) return;
    if (result.runway !== null) {
      title.textContent = 'Orientační obrat na hranici sociálního';
      value.textContent = money(result.runway);
      note.textContent = `Při zvoleném ${result.expenseMode}% výdajovém paušálu a ${result.months} měsících činnosti. Jde o odvozenou referenci, ne zákonný limit obratu.`;
    } else {
      title.textContent = result.delta < 0 ? 'Rezerva v daňovém základu' : 'Překročení rozhodné částky';
      value.textContent = money(Math.abs(result.delta));
      note.textContent = 'U skutečných výdajů nelze bezpečně převést hranici daňového základu na budoucí obrat bez předpokladu dalších nákladů.';
    }
  }

  function render(result) {
    const below = !result.socialRequired;
    const progress = result.threshold > 0 ? Math.min(100, result.taxProfit / result.threshold * 100) : 100;

    $('resultState').textContent = below ? 'SOCIÁLNÍ NEVZNIKÁ' : (result.socialVoluntary && result.taxProfit < result.threshold ? 'DOBROVOLNÁ ÚČAST' : 'SOCIÁLNÍ VZNIKÁ');
    $('resultState').className = `sv-state ${below ? 'is-safe' : 'is-alert'}`;
    $('resultTitle').textContent = below
      ? 'Daňový základ zůstává pod rozhodnou částkou.'
      : result.socialVoluntary && result.taxProfit < result.threshold
        ? 'Jste pod hranicí, ale počítáme dobrovolnou účast.'
        : 'Daňový základ dosáhl rozhodné částky.';
    $('resultLead').textContent = below
      ? `Při ${result.months} měsících vedlejší činnosti je hranice ${money(result.threshold)}. Váš modelový daňový základ je ${money(result.taxProfit)}.`
      : `Při ${result.months} měsících vedlejší činnosti porovnáváme daňový základ ${money(result.taxProfit)} s hranicí ${money(result.threshold)}.`;

    $('profitValue').textContent = money(result.taxProfit);
    $('limitValue').textContent = money(result.threshold);
    $('gaugeFill').style.width = `${progress}%`;
    $('gaugeMarker').style.left = `${progress}%`;
    $('gaugeMarker').setAttribute('aria-valuenow', String(Math.round(progress)));

    if (result.delta < 0 && !result.socialVoluntary) {
      $('deltaLabel').textContent = 'Rezerva do hranice';
      $('deltaValue').textContent = money(Math.abs(result.delta));
      $('deltaCopy').textContent = 'O tolik může vzrůst daňový základ ze samostatné činnosti, než vznikne povinná účast na důchodovém pojištění.';
    } else {
      $('deltaLabel').textContent = result.socialVoluntary && result.delta < 0 ? 'Pod zákonnou hranicí' : 'Nad hranicí';
      $('deltaValue').textContent = money(Math.abs(result.delta));
      $('deltaCopy').textContent = result.socialVoluntary && result.delta < 0
        ? 'Sociální počítáme pouze proto, že jste zapnuli dobrovolnou účast.'
        : 'Od této hranice už model počítá povinné sociální pojištění za daný rok.';
    }

    $('taxResult').textContent = money(result.tax);
    $('socialResult').textContent = money(result.social);
    $('healthResult').textContent = money(result.health);
    $('totalResult').textContent = money(result.total);
    $('netResult').textContent = money(result.netCash);

    $('resultWhy').textContent = below
      ? `Povinné sociální u vedlejší činnosti nevzniká, pokud daňový základ nedosáhne rozhodné částky a nepřihlásíte se dobrovolně. Daň a zdravotní se posuzují samostatně.`
      : `Sociální pojištění počítáme z 55 % daňového základu, nejméně z vedlejšího minima za aktivní měsíce. Daň a zdravotní zůstávají samostatnými výpočty.`;

    $('nextAction').textContent = below
      ? 'Pohlídejte si skutečný daňový základ, ne obrat. Pokud se k hranici blížíte, přepočítejte výsledek po každé větší faktuře nebo změně výdajů.'
      : 'Po podání přehledu ověřte doplatek a novou výši sociálních záloh. Pokud jste činnost zahájili v roce 2026, samotná povinnost záloh během prvního roku se posuzuje zvlášť.';

    $('assumptionStatus').textContent = reasonLabel(result.status);
    $('assumptionHealth').textContent = result.healthNoMinimum ? 'výjimka z minima zapnuta' : 'zdravotní minimum zapnuto';
    $('assumptionTax').textContent = result.creditAvailable ? 'základní sleva zahrnuta' : 'základní sleva neodečítána';

    renderRunway(result);
    renderMonthReference(result.months, result.taxProfit);

    const heroPct = Math.min(100, result.threshold ? result.taxProfit / result.threshold * 100 : 100);
    $('heroMarker').style.left = `${heroPct}%`;
    $('heroProfit').textContent = money(result.taxProfit);
    $('heroThreshold').textContent = money(result.threshold);
    $('heroStatus').textContent = below ? 'POD HRANICÍ' : 'NA / NAD HRANICÍ';

    window.__rvSideResult = result;
  }

  function syncConditional() {
    const actual = $('expenseMode')?.value === 'actual';
    $('actualWrap').hidden = !actual;
  }

  function update() {
    syncConditional();
    render(calculate(getInput()));
  }

  function reset() {
    $('sideReason').value = 'employee';
    $('months').value = '12';
    $('revenue').value = '250000';
    $('expenseMode').value = '60';
    $('actualExpenses').value = '100000';
    $('healthNoMinimum').checked = true;
    $('socialVoluntary').checked = false;
    $('otherTaxBase').value = '0';
    $('creditAvailable').checked = false;
    $('cashCosts').value = '60000';
    update();
  }

  function copyResult() {
    const r = window.__rvSideResult;
    if (!r) return;
    const text = [
      `Vedlejší OSVČ ${CFG.year}`,
      `Příjmy: ${money(r.revenue)}`,
      `Daňový základ: ${money(r.taxProfit)}`,
      `Rozhodná částka: ${money(r.threshold)}`,
      `Sociální: ${money(r.social)}`,
      `Zdravotní: ${money(r.health)}`,
      `Orientační daň navíc: ${money(r.tax)}`,
      `Čistý cash-flow po zadaných nákladech: ${money(r.netCash)}`
    ].join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      const button = $('copyResult');
      const original = button.textContent;
      button.textContent = 'Zkopírováno';
      setTimeout(() => { button.textContent = original; }, 1400);
    }).catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', () => {
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
    $('sideForm')?.addEventListener('submit', (event) => { event.preventDefault(); update(); });
    document.querySelectorAll('#sideForm input, #sideForm select').forEach((control) => {
      control.addEventListener('input', update);
      control.addEventListener('change', update);
    });
    $('resetButton')?.addEventListener('click', reset);
    $('copyResult')?.addEventListener('click', copyResult);
    update();
  });
})();
