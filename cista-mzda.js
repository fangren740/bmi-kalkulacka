(function () {
  const form = document.getElementById('salaryForm');
  if (!form) return;

  const resetBtn = document.getElementById('resetBtn');
  const grossSalaryInput = document.getElementById('grossSalary');
  const childrenInput = document.getElementById('children');
  const taxpayerDiscountInput = document.getElementById('taxpayerDiscount');
  const taxpayerRow = document.getElementById('taxpayerRow');

  const outputs = {
    netSalaryResult: document.getElementById('netSalaryResult'),
    totalCostResult: document.getElementById('totalCostResult'),
    employeeDeductionsResult: document.getElementById('employeeDeductionsResult'),
    taxResult: document.getElementById('taxResult'),
    resultBadge: document.getElementById('resultBadge'),
    grossSalaryResult: document.getElementById('grossSalaryResult'),
    socialEmployeeResult: document.getElementById('socialEmployeeResult'),
    healthEmployeeResult: document.getElementById('healthEmployeeResult'),
    socialEmployerResult: document.getElementById('socialEmployerResult'),
    healthEmployerResult: document.getElementById('healthEmployerResult'),
    discountsResult: document.getElementById('discountsResult'),
    netRatioResult: document.getElementById('netRatioResult'),
    resultNote: document.getElementById('resultNote'),
    summaryTableBody: document.getElementById('summaryTableBody'),
    nextActionText: document.getElementById('nextActionText'),
    primaryNextCta: document.getElementById('primaryNextCta'),
    secondaryNextCta: document.getElementById('secondaryNextCta'),
    heroPreviewNet: document.getElementById('heroPreviewNet'),
    heroPreviewGross: document.getElementById('heroPreviewGross'),
    heroPreviewCost: document.getElementById('heroPreviewCost'),
    meterDot: document.getElementById('meterDot')
  };

  const presetButtons = Array.from(document.querySelectorAll('[data-preset]'));

  const TAX_RATE = 0.15;
  const SOCIAL_EMPLOYEE_RATE = 0.071;
  const HEALTH_EMPLOYEE_RATE = 0.045;
  const SOCIAL_EMPLOYER_RATE = 0.248;
  const HEALTH_EMPLOYER_RATE = 0.09;
  const TAXPAYER_DISCOUNT = 2570;
  const CHILD_BONUSES = { 0: 0, 1: 1267, 2: 3127, 3: 5447 };

  function formatCurrency(value) {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 0
    }).format(Math.round(Number(value) || 0));
  }

  function formatPercent(value, digits = 1) {
    return new Intl.NumberFormat('cs-CZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: digits
    }).format(Number(value) || 0) + ' %';
  }

  function roundCurrency(value) {
    return Math.round(Number(value) || 0);
  }

  function setText(key, value) {
    if (outputs[key]) outputs[key].textContent = value;
  }

  function buildSummaryRows(rows) {
    if (!outputs.summaryTableBody) return;
    outputs.summaryTableBody.innerHTML = rows.map((row) => `
      <tr>
        <td>${row.label}</td>
        <td>${row.amount}</td>
        <td>${row.note}</td>
      </tr>
    `).join('');
  }

  function syncCheckboxCard() {
    if (taxpayerRow && taxpayerDiscountInput) {
      taxpayerRow.classList.toggle('is-checked', taxpayerDiscountInput.checked);
    }
  }

  function getValues() {
    return {
      grossSalary: Number(grossSalaryInput.value),
      children: Number(childrenInput.value),
      applyTaxpayerDiscount: taxpayerDiscountInput.checked
    };
  }

  function validate(values) {
    if (!values.grossSalary || values.grossSalary <= 0) return 'Zadejte platnou hrubou mzdu.';
    return '';
  }

  function calculateNetSalary(values) {
    const socialEmployee = roundCurrency(values.grossSalary * SOCIAL_EMPLOYEE_RATE);
    const healthEmployee = roundCurrency(values.grossSalary * HEALTH_EMPLOYEE_RATE);
    const taxBeforeDiscounts = roundCurrency(values.grossSalary * TAX_RATE);
    const taxpayerDiscount = values.applyTaxpayerDiscount ? TAXPAYER_DISCOUNT : 0;
    const childBonus = CHILD_BONUSES[Math.min(values.children, 3)] || 0;
    const totalDiscounts = taxpayerDiscount + childBonus;
    const taxAfterDiscounts = Math.max(0, taxBeforeDiscounts - totalDiscounts);
    const employeeDeductions = socialEmployee + healthEmployee + taxAfterDiscounts;
    const netSalary = values.grossSalary - employeeDeductions;
    const socialEmployer = roundCurrency(values.grossSalary * SOCIAL_EMPLOYER_RATE);
    const healthEmployer = roundCurrency(values.grossSalary * HEALTH_EMPLOYER_RATE);
    const totalCost = values.grossSalary + socialEmployer + healthEmployer;
    const netRatio = values.grossSalary > 0 ? (netSalary / values.grossSalary) * 100 : 0;

    return {
      socialEmployee,
      healthEmployee,
      taxBeforeDiscounts,
      taxpayerDiscount,
      childBonus,
      totalDiscounts,
      taxAfterDiscounts,
      employeeDeductions,
      netSalary,
      socialEmployer,
      healthEmployer,
      totalCost,
      netRatio
    };
  }

  function getIncomeMessage(result, values) {
    let statusClass = 'warning';
    let statusLabel = 'Běžný výsledek';
    let nextActionText = 'Nejdřív sledujte čistou mzdu. Pak si ověřte, jak velká část hrubé mzdy vám opravdu zůstane a jestli tento příjem stačí na bydlení, rezervu a běžné výdaje.';
    let primaryHref = '/hypotecni-kalkulacka.html';
    let primaryText = 'Spočítat hypotéku';
    let secondaryHref = '/porovnani-najem-vs-hypoteka-kalkulacka.html';
    let secondaryText = 'Nájem vs. hypotéka';

    if (result.netRatio >= 78) {
      statusClass = 'success';
      statusLabel = 'Vyšší čistý podíl';
      nextActionText = 'Výsledek působí příznivěji. Další krok je ověřit, jak by vedle tohoto příjmu vypadaly náklady na bydlení nebo pravidelná rezerva.';
    } else if (result.netRatio <= 72) {
      statusClass = 'risk';
      statusLabel = 'Nižší čistý podíl';
      nextActionText = 'Z hrubé mzdy vám zůstává menší část. O to důležitější je navázat rozpočtem a ověřit, kolik vám zůstane po bydlení a dalších pevných výdajích.';
    }

    if (values.children > 0) {
      secondaryHref = '/finance-a-hypoteky.html';
      secondaryText = 'Další finance';
    }

    return { statusClass, statusLabel, nextActionText, primaryHref, primaryText, secondaryHref, secondaryText };
  }

  function render(values, result) {
    setText('netSalaryResult', formatCurrency(result.netSalary));
    setText('totalCostResult', formatCurrency(result.totalCost));
    setText('employeeDeductionsResult', formatCurrency(result.employeeDeductions));
    setText('taxResult', formatCurrency(result.taxAfterDiscounts));
    setText('grossSalaryResult', formatCurrency(values.grossSalary));
    setText('socialEmployeeResult', formatCurrency(result.socialEmployee));
    setText('healthEmployeeResult', formatCurrency(result.healthEmployee));
    setText('socialEmployerResult', formatCurrency(result.socialEmployer));
    setText('healthEmployerResult', formatCurrency(result.healthEmployer));
    setText('discountsResult', formatCurrency(result.totalDiscounts));
    setText('netRatioResult', formatPercent(result.netRatio));
    setText('heroPreviewNet', formatCurrency(result.netSalary));
    setText('heroPreviewGross', formatCurrency(values.grossSalary));
    setText('heroPreviewCost', formatCurrency(result.totalCost));

    if (outputs.meterDot) {
      const meterPosition = Math.min(96, Math.max(4, result.netRatio));
      outputs.meterDot.style.left = `${meterPosition}%`;
    }

    const incomeState = getIncomeMessage(result, values);
    setText('nextActionText', incomeState.nextActionText);
    if (outputs.primaryNextCta) {
      outputs.primaryNextCta.href = incomeState.primaryHref;
      outputs.primaryNextCta.textContent = incomeState.primaryText;
    }
    if (outputs.secondaryNextCta) {
      outputs.secondaryNextCta.href = incomeState.secondaryHref;
      outputs.secondaryNextCta.textContent = incomeState.secondaryText;
    }

    if (outputs.resultBadge) {
      outputs.resultBadge.className = `status-chip ${incomeState.statusClass}`;
      outputs.resultBadge.textContent = incomeState.statusLabel;
    }

    setText('resultNote', 'Výpočet je orientační a počítá s běžným zaměstnaneckým scénářem. Pro účetní nebo právní účely je vhodné ověřit výpočet podle konkrétní situace.');

    buildSummaryRows([
      { label: 'Hrubá mzda', amount: formatCurrency(values.grossSalary), note: 'Základ pro výpočet' },
      { label: 'Sociální pojištění zaměstnance', amount: formatCurrency(result.socialEmployee), note: 'Odečítá se z hrubé mzdy' },
      { label: 'Zdravotní pojištění zaměstnance', amount: formatCurrency(result.healthEmployee), note: 'Odečítá se z hrubé mzdy' },
      { label: 'Daň před slevami', amount: formatCurrency(result.taxBeforeDiscounts), note: 'Základní orientační daň' },
      { label: 'Slevy a zvýhodnění', amount: formatCurrency(result.totalDiscounts), note: 'Poplatník a děti' },
      { label: 'Daň po slevách', amount: formatCurrency(result.taxAfterDiscounts), note: 'Skutečně započtená orientační daň' },
      { label: 'Čistá mzda', amount: formatCurrency(result.netSalary), note: 'Orientační částka pro zaměstnance' },
      { label: 'Cena práce', amount: formatCurrency(result.totalCost), note: 'Orientační náklad zaměstnavatele' }
    ]);
  }

  function renderError(message) {
    ['netSalaryResult', 'totalCostResult', 'employeeDeductionsResult', 'taxResult', 'grossSalaryResult', 'socialEmployeeResult', 'healthEmployeeResult', 'socialEmployerResult', 'healthEmployerResult', 'discountsResult', 'heroPreviewNet', 'heroPreviewGross', 'heroPreviewCost'].forEach((key) => setText(key, '0 Kč'));
    setText('netRatioResult', '0 %');
    setText('resultNote', message);
    setText('nextActionText', 'Po zadání údajů si jako první vezměte čistou mzdu a podíl z hrubé mzdy. Až potom řešte detailní rozpis nebo návazné rozhodnutí.');
    if (outputs.resultBadge) {
      outputs.resultBadge.className = 'status-chip warning';
      outputs.resultBadge.textContent = 'Chybí vstupní data';
    }
    buildSummaryRows([{ label: 'Hrubá mzda', amount: '—', note: message }]);
  }

  function runCalculation() {
    syncCheckboxCard();
    const values = getValues();
    const error = validate(values);
    if (error) {
      renderError(error);
      return;
    }
    render(values, calculateNetSalary(values));
  }

  function setPreset(name) {
    const presets = {
      standard: { grossSalary: 45000, children: 0, taxpayerDiscount: true },
      entry: { grossSalary: 32000, children: 0, taxpayerDiscount: true },
      family: { grossSalary: 52000, children: 2, taxpayerDiscount: true },
      higher: { grossSalary: 70000, children: 0, taxpayerDiscount: true }
    };
    const preset = presets[name];
    if (!preset) return;

    grossSalaryInput.value = preset.grossSalary;
    childrenInput.value = preset.children;
    taxpayerDiscountInput.checked = preset.taxpayerDiscount;

    presetButtons.forEach((btn) => {
      const active = btn.dataset.preset === name;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    runCalculation();
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    runCalculation();
  });

  if (resetBtn) resetBtn.addEventListener('click', () => setPreset('standard'));

  if (taxpayerRow) {
    taxpayerRow.addEventListener('click', (event) => {
      if (event.target.tagName !== 'INPUT') {
        taxpayerDiscountInput.checked = !taxpayerDiscountInput.checked;
        runCalculation();
      }
    });
  }

  [grossSalaryInput, childrenInput, taxpayerDiscountInput].forEach((element) => {
    if (!element) return;
    element.addEventListener('input', runCalculation);
    element.addEventListener('change', runCalculation);
  });

  presetButtons.forEach((btn) => {
    btn.addEventListener('click', () => setPreset(btn.dataset.preset));
  });

  runCalculation();
})();
