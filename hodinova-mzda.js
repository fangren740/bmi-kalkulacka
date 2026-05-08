(function () {
  const form = document.getElementById('wageForm');
  if (!form) return;

  const $ = id => document.getElementById(id);
  const resetBtn = $('resetBtn');
  const fieldIds = ['incomeType', 'monthlyIncome', 'workedHours', 'hoursPerDay', 'workDaysWeek', 'compareRate'];

  const outputs = {
    hourlyWage: $('hourlyWage'),
    dailyWage: $('dailyWage'),
    weeklyWage: $('weeklyWage'),
    monthlyCheck: $('monthlyCheck'),
    summaryType: $('summaryType'),
    summaryHours: $('summaryHours'),
    summaryDayHours: $('summaryDayHours'),
    summaryWeekDays: $('summaryWeekDays'),
    rateDifference: $('rateDifference'),
    statusBadge: $('statusBadge'),
    summaryTableBody: $('summaryTableBody'),
    resultInterpretation: $('resultInterpretation'),
    heroHourly: $('heroHourly'),
    heroMonthly: $('heroMonthly'),
    heroDaily: $('heroDaily'),
    heroWeekly: $('heroWeekly'),
    heroDiff: $('heroDiff'),
    heroHoursBar: $('heroHoursBar'),
    heroRateBar: $('heroRateBar'),
    premiumVerdict: $('hourlyPremiumVerdict'),
    premiumSubline: $('hourlyPremiumSubline'),
    premiumSentence: $('hourlyPremiumSentence'),
    premiumChecklist: $('hourlyPremiumChecklist'),
    premiumTable: $('hourlyScenarioTableBody')
  };

  function formatCurrency(value) {
    return new Intl.NumberFormat('cs-CZ', {
      style: 'currency',
      currency: 'CZK',
      maximumFractionDigits: 0
    }).format(Number.isFinite(value) ? value : 0);
  }

  function formatHours(value) {
    return `${new Intl.NumberFormat('cs-CZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(Number.isFinite(value) ? value : 0)} h`;
  }

  function getValues() {
    return {
      incomeType: $('incomeType').value,
      monthlyIncome: Number($('monthlyIncome').value) || 0,
      workedHours: Number($('workedHours').value) || 0,
      hoursPerDay: Number($('hoursPerDay').value) || 0,
      workDaysWeek: Number($('workDaysWeek').value) || 0,
      compareRate: Number($('compareRate').value) || 0
    };
  }

  function validate(values) {
    if (values.monthlyIncome <= 0) return 'Zadejte platný měsíční příjem.';
    if (values.workedHours <= 0) return 'Zadejte platný počet odpracovaných hodin.';
    if (values.hoursPerDay <= 0) return 'Zadejte platnou délku pracovního dne.';
    if (values.workDaysWeek <= 0) return 'Zvolte platný počet pracovních dnů v týdnu.';
    if (values.compareRate < 0) return 'Zadejte platnou srovnávací sazbu.';
    return '';
  }

  function calculateWage(values) {
    const hourlyWage = values.monthlyIncome / values.workedHours;
    const dailyWage = hourlyWage * values.hoursPerDay;
    const weeklyWage = dailyWage * values.workDaysWeek;
    const monthlyCheck = hourlyWage * values.workedHours;
    const difference = hourlyWage - values.compareRate;
    return { hourlyWage, dailyWage, weeklyWage, monthlyCheck, difference };
  }

  function stateFor(values, result) {
    const absDifference = Math.abs(result.difference);
    const diffText = formatCurrency(absDifference);
    if (result.difference >= values.compareRate * 0.08) {
      return {
        badge: 'Nad srovnávací sazbou',
        className: 'badge success',
        text: `Zadaný příjem vychází na ${formatCurrency(result.hourlyWage)} za hodinu, tedy přibližně o ${diffText} nad srovnávací sazbou. Nabídka z pohledu času působí dobře, ale ještě porovnejte benefity, dojíždění a přesčasy.`,
        next: 'Další krok: spočítejte čistou mzdu a ověřte, kolik zůstane po odvodech.'
      };
    }
    if (result.difference >= -values.compareRate * 0.08) {
      return {
        badge: 'Kolem srovnávací sazby',
        className: 'badge warning',
        text: `Hodinová mzda ${formatCurrency(result.hourlyWage)} je blízko zvolené srovnávací sazby. Rozhodovat budou hlavně benefity, stabilita práce, dojíždění a placení přesčasů.`,
        next: 'Další krok: porovnejte skutečný fond pracovní doby a případné příplatky.'
      };
    }
    return {
      badge: 'Pod srovnávací sazbou',
      className: 'badge warning',
      text: `Zadaný příjem vychází na ${formatCurrency(result.hourlyWage)} za hodinu, tedy přibližně o ${diffText} pod srovnávací sazbou. Zkontrolujte, zda nižší sazbu vyvažuje kratší dojíždění, benefity nebo větší jistota.`,
      next: 'Další krok: přepočítejte čistou mzdu a srovnejte nabídku s variantou DPP/DPČ nebo přesčasy.'
    };
  }

  function renderTable(result) {
    outputs.summaryTableBody.innerHTML = [
      ['Hodinová mzda', formatCurrency(result.hourlyWage), 'Přepočet měsíčního příjmu na 1 hodinu práce'],
      ['Denní výdělek', formatCurrency(result.dailyWage), 'Orientační výdělek za jeden pracovní den'],
      ['Týdenní výdělek', formatCurrency(result.weeklyWage), 'Orientační výdělek za pracovní týden'],
      ['Rozdíl proti sazbě', formatCurrency(result.difference), 'Kladné číslo znamená výsledek nad srovnáním']
    ].map(row => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join('');
  }

  function renderPremium(values, result, state) {
    if (!outputs.premiumVerdict) return;

    outputs.premiumVerdict.textContent = state.badge;
    outputs.premiumSubline.textContent = `${formatCurrency(result.hourlyWage)} / hod. při ${formatHours(values.workedHours)} za měsíc`;
    outputs.premiumSentence.textContent = state.text;
    outputs.premiumChecklist.innerHTML = [
      values.workedHours > 180
        ? 'Počet hodin je vyšší. Ptejte se, zda jde o běžný fond, přesčasy, nebo mimořádný měsíc.'
        : 'Počet hodin nepůsobí extrémně, ale u směn nebo sezónní práce počítejte raději průměr za více měsíců.',
      values.incomeType === 'gross'
        ? 'Zadali jste hrubý příjem. Pro reálný dopad na peněženku navazuje výpočet čisté mzdy.'
        : 'Zadali jste čistý příjem. Pro porovnání s pracovní nabídkou si hlídejte, zda druhá strana mluví o hrubé částce.',
      result.difference < 0
        ? 'Pokud je sazba pod cílem, porovnejte benefity, dojíždění a placené volno. Samotné číslo nemusí říct celý příběh.'
        : 'Pokud je sazba nad cílem, ověřte ještě stabilitu příjmu, příplatky a pravidla pro přesčasy.'
    ].map(item => `<li>${item}</li>`).join('');

    const scenarios = [
      ['Aktuální hodiny', values.workedHours],
      ['O 10 h méně', Math.max(1, values.workedHours - 10)],
      ['O 10 h více', values.workedHours + 10],
      ['Plný fond 168 h', 168]
    ].map(([label, hours]) => {
      const hourly = values.monthlyIncome / hours;
      const difference = hourly - values.compareRate;
      const sign = difference >= 0 ? '+' : '-';
      return `<tr><td>${label}</td><td>${formatCurrency(hourly)}</td><td>${sign} ${formatCurrency(Math.abs(difference))}</td></tr>`;
    }).join('');

    outputs.premiumTable.innerHTML = scenarios;
  }

  function render(values, result) {
    const state = stateFor(values, result);
    const sign = result.difference >= 0 ? '+' : '-';

    outputs.hourlyWage.textContent = formatCurrency(result.hourlyWage);
    outputs.dailyWage.textContent = formatCurrency(result.dailyWage);
    outputs.weeklyWage.textContent = formatCurrency(result.weeklyWage);
    outputs.monthlyCheck.textContent = formatCurrency(result.monthlyCheck);
    outputs.summaryType.textContent = values.incomeType === 'gross' ? 'Hrubý příjem' : 'Čistý příjem';
    outputs.summaryHours.textContent = formatHours(values.workedHours);
    outputs.summaryDayHours.textContent = formatHours(values.hoursPerDay);
    outputs.summaryWeekDays.textContent = String(values.workDaysWeek);
    outputs.rateDifference.textContent = `${sign} ${formatCurrency(Math.abs(result.difference))}`;
    outputs.statusBadge.className = state.className;
    outputs.statusBadge.textContent = state.badge;
    outputs.resultInterpretation.textContent = `${state.text} ${state.next}`;
    outputs.heroHourly.textContent = formatCurrency(result.hourlyWage);
    outputs.heroMonthly.textContent = `${formatCurrency(values.monthlyIncome)} / ${formatHours(values.workedHours)}`;
    outputs.heroDaily.textContent = formatCurrency(result.dailyWage);
    outputs.heroWeekly.textContent = formatCurrency(result.weeklyWage);
    outputs.heroDiff.textContent = `${sign} ${formatCurrency(Math.abs(result.difference))}`;
    outputs.heroHoursBar.style.width = `${Math.max(12, Math.min(100, values.workedHours / 200 * 100))}%`;
    outputs.heroRateBar.style.width = `${Math.max(12, Math.min(100, result.hourlyWage / Math.max(values.compareRate, 1) * 70))}%`;

    renderTable(result);
    renderPremium(values, result, state);
  }

  function runCalculation() {
    const values = getValues();
    const error = validate(values);
    if (error) {
      outputs.statusBadge.className = 'badge warning';
      outputs.statusBadge.textContent = error;
      return;
    }
    render(values, calculateWage(values));
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    runCalculation();
  });

  fieldIds.forEach(id => {
    const element = $(id);
    element.addEventListener('input', runCalculation);
    element.addEventListener('change', runCalculation);
  });

  resetBtn.addEventListener('click', () => {
    $('incomeType').value = 'gross';
    $('monthlyIncome').value = 40000;
    $('workedHours').value = 168;
    $('hoursPerDay').value = 8;
    $('workDaysWeek').value = 5;
    $('compareRate').value = 250;
    runCalculation();
  });

  runCalculation();
})();
