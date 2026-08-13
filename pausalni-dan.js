(() => {
  'use strict';

  const CONFIG = {
    year: 2026,
    bands: {
      1: { monthly: 9162, annual: 109944, label: 'I. pásmo' },
      2: { monthly: 16745, annual: 200940, label: 'II. pásmo' },
      3: { monthly: 27139, annual: 325668, label: 'III. pásmo' }
    },
    firstBandOriginalMonthly: 9984,
    firstBandRefund: 4932,
    taxThreshold: 1762812,
    taxpayerCredit: 30840,
    socialRate: 0.292,
    socialBaseShare: 0.55,
    socialMaxBase: 2350416,
    socialMainMin2026: 17139,
    socialSideMin: 5387,
    sideThreshold: 117521,
    healthRate: 0.135,
    healthBaseShare: 0.5,
    healthMinMonthlyBase: 24483.5,
    flatCaps: { 80: 1600000, 60: 1200000, 40: 800000, 30: 600000 }
  };

  const $ = (id) => document.getElementById(id);
  const num = (id) => Math.max(0, Number($(id)?.value || 0));
  const checked = (id) => Boolean($(id)?.checked);
  const val = (id) => $(id)?.value || '';
  const money = (value) => `${Math.round(Math.abs(value)).toLocaleString('cs-CZ')} Kč`;
  const signedMoney = (value) => `${value >= 0 ? '+ ' : '− '}${money(value)}`;
  const percent = (value) => `${(value * 100).toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} %`;
  const ceil = (value) => Math.ceil(Math.max(0, value));
  const roundHundredsDown = (value) => Math.floor(Math.max(0, value) / 100) * 100;

  function revenueMapBasic() {
    const revenue = num('basicRevenue');
    return { 80: 0, 60: 0, 40: 0, 30: 0, [val('basicCategory')]: revenue };
  }

  function revenueMapAdvanced() {
    return {
      80: num('advRevenue80'),
      60: num('advRevenue60'),
      40: num('advRevenue40'),
      30: num('advRevenue30')
    };
  }

  function totalRevenue(map) {
    return Object.values(map).reduce((sum, item) => sum + item, 0);
  }

  function eligibility(map, blockers) {
    const revenue = totalRevenue(map);
    const share80 = revenue > 0 ? map[80] / revenue : 0;
    const share8060 = revenue > 0 ? (map[80] + map[60]) / revenue : 0;
    const reasons = [];
    if (revenue <= 0) reasons.push('Zadejte kladné příjmy ze samostatné činnosti.');
    if (revenue > 2000000) reasons.push('Příjmy přesahují horní limit 2 000 000 Kč.');
    if (blockers.employment) reasons.push('Běžné zaměstnání se zálohovou daní je překážkou paušálního režimu.');
    if (blockers.vat) reasons.push('Plátcovství DPH nebo vznik registrační povinnosti je překážkou.');
    if (blockers.otherIncome) reasons.push('Jiné zdanitelné příjmy nad 50 000 Kč mohou znamenat povinnost standardního přiznání.');
    if (blockers.insolvency) reasons.push('Probíhající insolvenční řízení je překážkou vstupu.');
    if (blockers.partner) reasons.push('Společník v.o.s. nebo komplementář k.s. nesplňuje běžné podmínky vstupu.');
    const blocked = reasons.length > 0;
    const bands = {
      1: !blocked && (revenue <= 1000000 || (revenue <= 1500000 && share8060 >= 0.75) || (revenue <= 2000000 && share80 >= 0.75)),
      2: !blocked && (revenue <= 1500000 || (revenue <= 2000000 && share8060 >= 0.75)),
      3: !blocked && revenue <= 2000000
    };
    const available = [1, 2, 3].filter((band) => bands[band]);
    return { revenue, share80, share8060, bands, available, blocked, reasons };
  }

  function flatTaxExpenses(map, actualCosts, mode) {
    if (mode === 'actual') return Math.min(totalRevenue(map), actualCosts);
    return [80, 60, 40, 30].reduce((sum, rate) => {
      return sum + Math.min(map[rate] * rate / 100, CONFIG.flatCaps[rate]);
    }, 0);
  }

  function standardRegime(input) {
    const revenue = totalRevenue(input.map);
    const expenses = flatTaxExpenses(input.map, input.actualCosts, input.expenseMode);
    const profit = Math.max(0, revenue - expenses);
    const taxBase = roundHundredsDown(Math.max(0, profit - input.deductions));
    const grossTax = ceil(Math.min(taxBase, CONFIG.taxThreshold) * 0.15 + Math.max(0, taxBase - CONFIG.taxThreshold) * 0.23);
    const credits = (input.taxpayerCredit ? CONFIG.taxpayerCredit : 0) + input.extraCredits;
    const incomeTax = Math.max(0, grossTax - credits);

    const socialActualBase = profit * CONFIG.socialBaseShare;
    let social = 0;
    if (input.activity === 'side') {
      if (profit >= CONFIG.sideThreshold) {
        const base = Math.min(CONFIG.socialMaxBase, Math.max(socialActualBase, CONFIG.socialSideMin * 12));
        social = ceil(base * CONFIG.socialRate);
      }
    } else {
      const minimumBase = CONFIG.socialMainMin2026 * 12;
      const base = Math.min(CONFIG.socialMaxBase, Math.max(socialActualBase, minimumBase));
      social = ceil(base * CONFIG.socialRate);
    }

    const healthActualBase = profit * CONFIG.healthBaseShare;
    const healthMinimumBase = input.healthMinimum ? CONFIG.healthMinMonthlyBase * 12 : 0;
    const health = ceil(Math.max(healthActualBase, healthMinimumBase) * CONFIG.healthRate);
    const duties = incomeTax + social + health;
    const net = revenue - input.actualCosts - duties;
    return { revenue, expenses, profit, taxBase, incomeTax, social, health, duties, net };
  }

  function chooseBand(eligibilityResult, preferred) {
    if (!eligibilityResult.available.length) return null;
    if (preferred !== 'auto') {
      const selected = Number(preferred);
      if (eligibilityResult.bands[selected]) return selected;
    }
    return eligibilityResult.available[0];
  }

  function basicInput() {
    return {
      mode: 'basic',
      map: revenueMapBasic(),
      actualCosts: num('basicActualCosts'),
      expenseMode: 'flat',
      activity: 'main',
      taxpayerCredit: checked('basicCredit'),
      deductions: 0,
      extraCredits: 0,
      healthMinimum: true,
      preferredBand: 'auto',
      savedHours: 0,
      hourlyValue: 0,
      firstHalfPaid: false,
      blockers: {
        employment: checked('basicEmployment'),
        vat: checked('basicVat'),
        otherIncome: checked('basicOtherIncome'),
        insolvency: false,
        partner: false
      }
    };
  }

  function advancedInput() {
    return {
      mode: 'advanced',
      map: revenueMapAdvanced(),
      actualCosts: num('advActualCosts'),
      expenseMode: val('advExpenseMode'),
      activity: val('advActivity'),
      taxpayerCredit: checked('advCredit'),
      deductions: num('advDeductions'),
      extraCredits: num('advExtraCredits'),
      healthMinimum: checked('advHealthMinimum'),
      preferredBand: val('advBand'),
      savedHours: num('advSavedHours'),
      hourlyValue: num('advHourlyValue'),
      firstHalfPaid: checked('advFirstHalfPaid'),
      blockers: {
        employment: checked('advEmployment'),
        vat: checked('advVat'),
        otherIncome: checked('advOtherIncome'),
        insolvency: checked('advInsolvency'),
        partner: checked('advPartner')
      }
    };
  }

  function calculate(input) {
    const eligible = eligibility(input.map, input.blockers);
    const standard = standardRegime(input);
    const band = chooseBand(eligible, input.preferredBand);
    const flat = band ? CONFIG.bands[band] : null;
    const flatAnnual = flat?.annual || 0;
    const flatNet = eligible.revenue - input.actualCosts - flatAnnual;
    const difference = standard.duties - flatAnnual;
    const adminValue = input.savedHours * input.hourlyValue;
    const adjustedDifference = difference + adminValue;
    const firstBandCash = band === 1 && input.firstHalfPaid
      ? CONFIG.firstBandOriginalMonthly * 6 + CONFIG.bands[1].monthly * 6
      : flatAnnual;
    const refund = band === 1 && input.firstHalfPaid ? CONFIG.firstBandRefund : 0;
    return { input, eligible, standard, band, flat, flatAnnual, flatNet, difference, adminValue, adjustedDifference, firstBandCash, refund };
  }

  function renderScenarios(result) {
    const grid = $('scenarioGrid');
    if (!grid) return;
    const standardCard = `<article class="scenario-card${result.band === null ? ' is-current' : ''}"><span>Standardní režim</span><strong>${money(result.standard.duties)}</strong><small>čisté cash-flow ${money(result.standard.net)}</small></article>`;
    const bands = [1, 2, 3].map((band) => {
      const cfg = CONFIG.bands[band];
      const allowed = result.eligible.bands[band];
      const current = result.band === band ? ' is-current' : '';
      return `<article class="scenario-card${current}"><span>${cfg.label}${allowed ? '' : ' · nedostupné'}</span><strong>${money(cfg.annual)}</strong><small>${allowed ? `čisté cash-flow ${money(result.eligible.revenue - result.input.actualCosts - cfg.annual)}` : 'nesplněné podmínky'}</small></article>`;
    }).join('');
    grid.innerHTML = standardCard + bands;
  }

  function renderBreakdown(result) {
    const flatLabel = result.flat ? CONFIG.bands[result.band].label : 'Nedostupné';
    const rows = [
      ['Roční příjmy', result.eligible.revenue, result.standard.revenue, 'Stejný příjem v obou variantách.'],
      ['Daňové / skutečné výdaje', result.input.actualCosts, result.standard.expenses, 'Paušální režim používá skutečné náklady jen pro cash-flow; standardní režim podle zvolené metody.'],
      ['Daň z příjmů', result.flat ? result.flatAnnual : 0, result.standard.incomeTax, result.flat ? `V paušální platbě je daň součástí ${flatLabel}.` : 'Paušální režim není podle vstupů dostupný.'],
      ['Sociální pojištění', result.flat ? result.flatAnnual : 0, result.standard.social, 'V paušálním režimu je pojistné součástí jedné platby.'],
      ['Zdravotní pojištění', result.flat ? result.flatAnnual : 0, result.standard.health, 'Standardní režim počítá samostatnou povinnost.'],
      ['Celkové veřejné platby', result.flatAnnual, result.standard.duties, 'Hlavní finanční srovnání obou režimů.'],
      ['Cash-flow po skutečných nákladech', result.flatNet, result.standard.net, 'Příjmy minus skutečné náklady a veřejné platby.']
    ];
    $('breakdownBody').innerHTML = rows.map(([name, flat, standard, note], index) => {
      const flatDisplay = index >= 2 && index <= 4 && result.flat ? 'součást jedné platby' : money(flat);
      return `<tr><td>${name}</td><td>${flatDisplay}</td><td>${money(standard)}</td><td>${note}</td></tr>`;
    }).join('');
  }

  function render(result) {
    const eligible = result.eligible.available.length > 0;
    const flatCheaper = result.difference > 0;
    const differenceAbs = Math.abs(result.difference);
    $('resultModeBadge').textContent = result.input.mode === 'advanced' ? 'Rozšířený režim' : 'Základní režim';
    $('resultBandBadge').textContent = result.flat ? CONFIG.bands[result.band].label.toUpperCase() : 'NEDOSTUPNÉ';
    $('resultHeadline').textContent = !eligible ? 'Paušální režim podle vstupů nevychází dostupný' : flatCheaper ? 'Paušální režim vychází levněji' : 'Standardní režim vychází levněji';
    $('resultLabel').textContent = eligible ? 'Orientační roční rozdíl' : 'Výsledek kontroly podmínek';
    $('mainDifference').textContent = eligible ? money(differenceAbs) : '—';
    $('differenceCaption').textContent = eligible ? (flatCheaper ? 've prospěch paušálního režimu' : 've prospěch standardního režimu') : 'paušální platbu nelze spolehlivě použít';
    $('monthlyFlat').textContent = result.flat ? money(result.flat.monthly) : '—';
    $('monthlyNote').textContent = result.band === 1 ? 'efektivní částka po změně 2026' : 'měsíční záloha 2026';
    $('flatAnnual').textContent = result.flat ? money(result.flatAnnual) : '—';
    $('standardAnnual').textContent = money(result.standard.duties);
    $('flatNet').textContent = result.flat ? money(result.flatNet) : '—';
    $('standardNet').textContent = money(result.standard.net);
    $('eligibleShare').textContent = percent(result.eligible.share8060);

    const max = Math.max(1, result.flatAnnual, result.standard.duties);
    $('flatBar').style.width = `${result.flat ? Math.max(6, result.flatAnnual / max * 100) : 0}%`;
    $('standardBar').style.width = `${Math.max(6, result.standard.duties / max * 100)}%`;

    const availableLabels = result.eligible.available.map((band) => CONFIG.bands[band].label).join(', ');
    const eligibilityBox = $('eligibilityBox');
    if (eligible) {
      eligibilityBox.classList.remove('is-danger');
      $('eligibilityTitle').textContent = `Dostupná pásma: ${availableLabels}`;
      $('eligibilityText').textContent = `Nejnižší dostupnou variantou je ${CONFIG.bands[result.eligible.available[0]].label}. Kalkulačka používá ${result.flat ? CONFIG.bands[result.band].label : 'nejnižší dostupné pásmo'} pro hlavní porovnání.`;
    } else {
      eligibilityBox.classList.add('is-danger');
      $('eligibilityTitle').textContent = 'Paušální režim podle zadaných údajů není dostupný';
      $('eligibilityText').textContent = result.eligible.reasons.join(' ');
    }

    $('resultSummary').textContent = eligible
      ? `Paušální platba ${money(result.flatAnnual)} se porovnává se standardními povinnostmi ${money(result.standard.duties)}. Při skutečných nákladech ${money(result.input.actualCosts)} zůstane v paušálním režimu ${money(result.flatNet)} a ve standardním režimu ${money(result.standard.net)}.`
      : `Standardní model vychází na veřejné platby ${money(result.standard.duties)}. Paušální výsledek není použitelný, dokud není odstraněna uvedená překážka.`;

    $('advancedResult').hidden = result.input.mode !== 'advanced';
    $('adminValue').textContent = money(result.adminValue);
    $('adjustedDifference').textContent = eligible ? signedMoney(result.adjustedDifference) : '—';
    $('firstBandCash').textContent = result.band === 1 ? money(result.firstBandCash) : 'Nevztahuje se';
    $('firstBandRefund').textContent = result.band === 1 ? money(result.refund) : 'Nevztahuje se';

    let insightTitle = 'Porovnávejte peníze i jednoduchost';
    let insightText = eligible
      ? `Čistý peněžní rozdíl je ${money(differenceAbs)} ${flatCheaper ? 've prospěch paušálního režimu' : 've prospěch standardního režimu'}. Hodnotu jednodušší administrativy posuzujte odděleně.`
      : 'Nejdříve ověřte zákonné podmínky. Finanční porovnání pásem nemá smysl, pokud paušální režim není dostupný.';
    if (eligible && Math.abs(result.difference) < 15000 && result.input.mode === 'advanced') {
      insightTitle = 'Rozhodnutí je na hraně';
      insightText = `Peněžní rozdíl je relativně malý. Po započtení hodnoty ušetřeného času ${money(result.adminValue)} vychází upravený rozdíl ${signedMoney(result.adjustedDifference)}.`;
    } else if (eligible && !flatCheaper && result.adminValue > differenceAbs) {
      insightTitle = 'Administrativa může převážit finanční nevýhodu';
      insightText = `Standardní režim je levnější o ${money(differenceAbs)}, ale zadaná hodnota ušetřeného času je ${money(result.adminValue)}. Jde o ekonomické ocenění času, nikoli daňovou úsporu.`;
    }
    $('insightTitle').textContent = insightTitle;
    $('insightText').textContent = insightText;

    document.querySelector('[data-hero-band]').textContent = result.flat ? CONFIG.bands[result.band].label : 'Nedostupné';
    document.querySelector('[data-hero-diff]').textContent = eligible ? signedMoney(result.difference) : 'ověřte podmínky';
    renderScenarios(result);
    renderBreakdown(result);
  }

  let mode = 'basic';
  function calculateCurrent() {
    const input = mode === 'advanced' ? advancedInput() : basicInput();
    const result = calculate(input);
    render(result);
    return result;
  }

  function setMode(nextMode) {
    mode = nextMode;
    document.body.dataset.mode = mode;
    $('basicModeTab').classList.toggle('is-active', mode === 'basic');
    $('advancedModeTab').classList.toggle('is-active', mode === 'advanced');
    $('basicModeTab').setAttribute('aria-selected', String(mode === 'basic'));
    $('advancedModeTab').setAttribute('aria-selected', String(mode === 'advanced'));
    $('basicCalculation').hidden = mode !== 'basic';
    $('advancedCalculation').hidden = mode !== 'advanced';
    calculateCurrent();
  }

  function transferToAdvanced() {
    const category = val('basicCategory');
    [80, 60, 40, 30].forEach((rate) => { $(`advRevenue${rate}`).value = rate === Number(category) ? num('basicRevenue') : 0; });
    $('advActualCosts').value = num('basicActualCosts');
    $('advCredit').checked = checked('basicCredit');
    $('advEmployment').checked = checked('basicEmployment');
    $('advVat').checked = checked('basicVat');
    $('advOtherIncome').checked = checked('basicOtherIncome');
    setMode('advanced');
    $('advancedCalculation').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function resetBasic() {
    $('basicRevenue').value = 1200000;
    $('basicCategory').value = '60';
    $('basicActualCosts').value = 220000;
    $('basicEmployment').checked = false;
    $('basicVat').checked = false;
    $('basicOtherIncome').checked = false;
    $('basicCredit').checked = true;
    setMode('basic');
  }

  function resetAdvanced() {
    $('advRevenue80').value = 0;
    $('advRevenue60').value = 1200000;
    $('advRevenue40').value = 0;
    $('advRevenue30').value = 0;
    $('advActualCosts').value = 220000;
    $('advExpenseMode').value = 'flat';
    $('advActivity').value = 'main';
    $('advDeductions').value = 0;
    $('advExtraCredits').value = 0;
    $('advBand').value = 'auto';
    $('advCredit').checked = true;
    $('advHealthMinimum').checked = true;
    ['advEmployment', 'advVat', 'advOtherIncome', 'advInsolvency', 'advPartner'].forEach((id) => { $(id).checked = false; });
    $('advFirstHalfPaid').checked = true;
    $('advSavedHours').value = 15;
    $('advHourlyValue').value = 800;
    setMode('advanced');
  }

  document.querySelectorAll('#flatForm input, #flatForm select').forEach((element) => {
    element.addEventListener('input', calculateCurrent);
    element.addEventListener('change', calculateCurrent);
  });
  $('flatForm').addEventListener('submit', (event) => { event.preventDefault(); calculateCurrent(); });
  $('basicModeTab').addEventListener('click', () => setMode('basic'));
  $('advancedModeTab').addEventListener('click', () => setMode('advanced'));
  $('transferToAdvanced').addEventListener('click', transferToAdvanced);
  $('resetBtn').addEventListener('click', resetBasic);
  $('resetAdvanced').addEventListener('click', resetAdvanced);
  $('printResult').addEventListener('click', () => window.print());
  $('copyResult').addEventListener('click', async () => {
    const result = calculateCurrent();
    const text = result.flat
      ? `${CONFIG.bands[result.band].label}: ${money(result.flatAnnual)} ročně. Standardní režim: ${money(result.standard.duties)} ročně. Rozdíl: ${signedMoney(result.difference)}.`
      : `Paušální režim není podle zadaných podmínek dostupný. Standardní režim: ${money(result.standard.duties)} ročně.`;
    try {
      await navigator.clipboard.writeText(text);
      $('copyResult').textContent = 'Zkopírováno';
      setTimeout(() => { $('copyResult').textContent = 'Kopírovat výsledek'; }, 1600);
    } catch {
      window.prompt('Zkopírujte výsledek:', text);
    }
  });

  calculateCurrent();
})();
