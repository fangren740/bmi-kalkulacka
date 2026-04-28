(function(){
  const form = document.getElementById('salaryForm');
  if(!form) return;

  const elements = {
    grossSalary: document.getElementById('grossSalary'),
    children: document.getElementById('children'),
    taxpayerDiscount: document.getElementById('taxpayerDiscount'),
    resetBtn: document.getElementById('resetBtn'),
    presets: Array.from(document.querySelectorAll('[data-preset]')),

    netSalaryResult: document.getElementById('netSalaryResult'),
    grossSalaryResult: document.getElementById('grossSalaryResult'),
    totalCostResult: document.getElementById('totalCostResult'),
    employeeDeductionsResult: document.getElementById('employeeDeductionsResult'),
    taxResult: document.getElementById('taxResult'),
    discountsResult: document.getElementById('discountsResult'),
    netRatioResult: document.getElementById('netRatioResult'),
    resultBadge: document.getElementById('resultBadge'),
    resultNote: document.getElementById('resultNote'),
    meterPercent: document.getElementById('meterPercent'),
    netRatioBar: document.getElementById('netRatioBar'),
    breakdownBody: document.getElementById('breakdownBody'),

    heroNet: document.getElementById('heroNet'),
    heroGross: document.getElementById('heroGross'),
    heroCost: document.getElementById('heroCost'),
    heroRatio: document.getElementById('heroRatio'),
    heroCalcNet: document.getElementById('heroCalcNet'),
    heroNetBar: document.getElementById('heroNetBar'),
    heroDeductionsBar: document.getElementById('heroDeductionsBar'),

    decisionText: document.getElementById('decisionText'),
    decisionNetText: document.getElementById('decisionNetText'),
    decisionDeductionsText: document.getElementById('decisionDeductionsText'),
    decisionCostText: document.getElementById('decisionCostText'),
    decisionCostTag: document.getElementById('decisionCostTag')
  };

  const CONFIG = {
    socialRateEmployee: 0.065,
    healthRateEmployee: 0.045,
    socialRateEmployer: 0.248,
    healthRateEmployer: 0.09,
    taxRate: 0.15,
    taxpayerDiscount: 2570,
    child1: 1267,
    child2: 1860,
    child3plus: 2320
  };

  const presetValues = {
    standard: { gross: 45000, children: 0, taxpayerDiscount: true },
    entry: { gross: 32000, children: 0, taxpayerDiscount: true },
    family: { gross: 52000, children: 2, taxpayerDiscount: true },
    higher: { gross: 70000, children: 0, taxpayerDiscount: true }
  };

  const round = (value) => Math.round(Number(value) || 0);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const formatCurrency = (value) => `${round(value).toLocaleString('cs-CZ')} Kč`;
  const formatPlain = (value) => round(value).toLocaleString('cs-CZ');
  const formatPercent = (value) => `${value.toLocaleString('cs-CZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;

  function getChildCredit(children){
    if(children <= 0) return 0;
    if(children === 1) return CONFIG.child1;
    if(children === 2) return CONFIG.child1 + CONFIG.child2;
    return CONFIG.child1 + CONFIG.child2 + CONFIG.child3plus;
  }

  function compute(){
    const gross = Math.max(0, Number(elements.grossSalary.value) || 0);
    const children = Math.max(0, Number(elements.children.value) || 0);
    const withTaxpayerDiscount = elements.taxpayerDiscount.checked;

    const socialEmployee = round(gross * CONFIG.socialRateEmployee);
    const healthEmployee = round(gross * CONFIG.healthRateEmployee);
    const employeeDeductions = socialEmployee + healthEmployee;

    const socialEmployer = round(gross * CONFIG.socialRateEmployer);
    const healthEmployer = round(gross * CONFIG.healthRateEmployer);
    const totalCost = round(gross + socialEmployer + healthEmployer);

    const taxBeforeDiscounts = round(gross * CONFIG.taxRate);
    const basicDiscount = withTaxpayerDiscount ? CONFIG.taxpayerDiscount : 0;
    const childCredit = getChildCredit(children);

    const taxAfterBasic = Math.max(0, taxBeforeDiscounts - basicDiscount);
    const taxAfterChildren = taxAfterBasic - childCredit;
    const taxAfterDiscounts = Math.max(0, taxAfterChildren);
    const taxBonus = Math.max(0, -taxAfterChildren);
    const totalDiscountsUsed = (taxBeforeDiscounts - taxAfterDiscounts) + taxBonus;

    const netSalary = round(gross - employeeDeductions - taxAfterDiscounts + taxBonus);
    const netRatio = gross > 0 ? (netSalary / gross) * 100 : 0;
    const deductionsShare = gross > 0 ? ((employeeDeductions + taxAfterDiscounts - taxBonus) / gross) * 100 : 0;

    return {
      gross,
      children,
      withTaxpayerDiscount,
      socialEmployee,
      healthEmployee,
      employeeDeductions,
      socialEmployer,
      healthEmployer,
      totalCost,
      taxBeforeDiscounts,
      basicDiscount,
      childCredit,
      taxAfterDiscounts,
      taxBonus,
      totalDiscountsUsed,
      netSalary,
      netRatio,
      deductionsShare
    };
  }

  function buildBadge(result){
    const badge = elements.resultBadge;
    badge.classList.remove('warning', 'risk');
    if(result.netRatio >= 80){
      badge.textContent = 'Vyšší čistý podíl';
    } else if(result.netRatio >= 74){
      badge.textContent = 'Vyvážený poměr';
      badge.classList.add('warning');
    } else {
      badge.textContent = 'Nižší čistý podíl';
      badge.classList.add('risk');
    }
  }

  function updateDecisionTexts(result){
    const childrenText = result.children === 0 ? 'bez daňového zvýhodnění na děti' : `s daňovým zvýhodněním na ${result.children} ${result.children === 1 ? 'dítě' : 'děti'}`;
    elements.decisionText.textContent = `Z hrubé mzdy ${formatCurrency(result.gross)} vám orientačně zůstane ${formatCurrency(result.netSalary)}. To je zhruba ${formatPercent(result.netRatio)} hrubé mzdy ${childrenText}.`;
    elements.decisionNetText.textContent = `Na účet vychází přibližně ${formatCurrency(result.netSalary)}. Tohle číslo je klíčové pro rozpočet domácnosti, nájem nebo hypotéku.`;
    elements.decisionDeductionsText.textContent = `Na sociální, zdravotní a daň po slevách odchází přibližně ${formatCurrency(result.employeeDeductions + result.taxAfterDiscounts - result.taxBonus)}.`;
    elements.decisionCostText.textContent = `Celkový náklad zaměstnavatele je orientačně ${formatCurrency(result.totalCost)}, tedy o ${formatCurrency(result.totalCost - result.gross)} více než samotná hrubá mzda.`;
    elements.decisionCostTag.classList.remove('risk', 'warning');
    elements.decisionCostTag.classList.add('safe');
  }

  function updateNote(result){
    const parts = [];
    parts.push(result.withTaxpayerDiscount ? 'Počítáme se slevou na poplatníka.' : 'Počítáme bez slevy na poplatníka.');
    if(result.children > 0) {
      parts.push(`Zahrnuto je orientační daňové zvýhodnění na ${result.children} ${result.children === 1 ? 'dítě' : 'děti'}.`);
    }
    if(result.taxBonus > 0) {
      parts.push(`V modelu vychází i daňový bonus ${formatCurrency(result.taxBonus)}.`);
    }
    parts.push('Výpočet je orientační a nezohledňuje všechny individuální situace.');
    elements.resultNote.textContent = parts.join(' ');
  }

  function updateBreakdown(result){
    const rows = [
      ['Hrubá mzda', formatCurrency(result.gross)],
      ['Sociální pojištění zaměstnance (6,5 %)', formatCurrency(result.socialEmployee)],
      ['Zdravotní pojištění zaměstnance (4,5 %)', formatCurrency(result.healthEmployee)],
      ['Daň před slevami (15 %)', formatCurrency(result.taxBeforeDiscounts)],
      ['Sleva na poplatníka', `− ${formatCurrency(result.basicDiscount)}`],
      ['Daňové zvýhodnění na děti', `− ${formatCurrency(result.childCredit)}`],
      ['Daň po slevách', formatCurrency(result.taxAfterDiscounts)],
      ['Daňový bonus', formatCurrency(result.taxBonus)],
      ['Čistá mzda', formatCurrency(result.netSalary)],
      ['Sociální pojištění zaměstnavatele', formatCurrency(result.socialEmployer)],
      ['Zdravotní pojištění zaměstnavatele', formatCurrency(result.healthEmployer)],
      ['Cena práce', formatCurrency(result.totalCost)]
    ];

    elements.breakdownBody.innerHTML = rows.map(([label, value]) => `<tr><td>${label}</td><td>${value}</td></tr>`).join('');
  }

  function updateUI(){
    const result = compute();

    elements.netSalaryResult.textContent = formatCurrency(result.netSalary);
    elements.grossSalaryResult.textContent = formatCurrency(result.gross);
    elements.totalCostResult.textContent = formatCurrency(result.totalCost);
    elements.employeeDeductionsResult.textContent = formatCurrency(result.employeeDeductions);
    elements.taxResult.textContent = formatCurrency(result.taxAfterDiscounts);
    elements.discountsResult.textContent = formatCurrency(result.totalDiscountsUsed);
    elements.netRatioResult.textContent = formatPercent(result.netRatio);
    elements.meterPercent.textContent = formatPercent(result.netRatio);
    elements.netRatioBar.style.width = `${clamp(result.netRatio, 0, 100)}%`;

    elements.heroNet.textContent = formatCurrency(result.netSalary);
    elements.heroGross.textContent = formatCurrency(result.gross);
    elements.heroCost.textContent = formatCurrency(result.totalCost);
    elements.heroRatio.textContent = formatPercent(result.netRatio);
    elements.heroCalcNet.textContent = formatPlain(result.netSalary);
    elements.heroNetBar.style.width = `${clamp(result.netRatio, 12, 100)}%`;
    elements.heroDeductionsBar.style.width = `${clamp(result.deductionsShare, 8, 88)}%`;

    buildBadge(result);
    updateNote(result);
    updateDecisionTexts(result);
    updateBreakdown(result);
  }

  function setPreset(name){
    const preset = presetValues[name];
    if(!preset) return;
    elements.grossSalary.value = preset.gross;
    elements.children.value = String(preset.children);
    elements.taxpayerDiscount.checked = preset.taxpayerDiscount;
    elements.presets.forEach((button) => {
      button.classList.toggle('active', button.dataset.preset === name);
    });
    updateUI();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    updateUI();
  });

  ['input', 'change'].forEach((eventName) => {
    form.addEventListener(eventName, () => updateUI());
  });

  elements.presets.forEach((button) => {
    button.addEventListener('click', () => setPreset(button.dataset.preset));
  });

  elements.resetBtn.addEventListener('click', () => setPreset('standard'));

  updateUI();
})();
