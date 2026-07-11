(function(){
  const form = document.getElementById('dppDpcForm');
  if (!form) return;

  const CZK = new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 });
  const NUM = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });
  const MIN_HOURLY_2026 = 134.4;
  const EMPLOYER_SOCIAL_RATE = 0.248;
  const EMPLOYER_HEALTH_RATE = 0.09;

  const $ = id => document.getElementById(id);
  const els = {
    agreementType: $('agreementType'),
    grossReward: $('grossReward'),
    sameEmployerReward: $('sameEmployerReward'),
    hoursWorked: $('hoursWorked'),
    signedDeclaration: $('signedDeclaration'),
    includeTaxCredit: $('includeTaxCredit'),
    taxRate: $('taxRate'),
    employeeSocialRate: $('employeeSocialRate'),
    employeeHealthRate: $('employeeHealthRate'),
    taxpayerCredit: $('taxpayerCredit'),
    agreementHint: $('agreementHint'),
    netReward: $('netReward'),
    resultBadge: $('resultBadge'),
    grossOut: $('grossOut'),
    limitBaseOut: $('limitBaseOut'),
    socialOut: $('socialOut'),
    healthOut: $('healthOut'),
    taxOut: $('taxOut'),
    hourlyNetOut: $('hourlyNetOut'),
    limitLabel: $('limitLabel'),
    limitPercent: $('limitPercent'),
    limitBar: $('limitBar'),
    verdictText: $('verdictText'),
    limitCheck: $('limitCheck'),
    taxCheck: $('taxCheck'),
    wageCheck: $('wageCheck'),
    breakdownRows: $('breakdownRows'),
    heroType: $('heroType'),
    heroNet: $('heroNet'),
    heroSentence: $('heroSentence'),
    heroInsurance: $('heroInsurance'),
    heroTax: $('heroTax'),
    heroHourly: $('heroHourly')
  };

  const presets = {
    'dpp-low': { agreementType: 'dpp', grossReward: 10000, sameEmployerReward: 0, hoursWorked: 60, signedDeclaration: true, includeTaxCredit: true },
    'dpp-high': { agreementType: 'dpp', grossReward: 15000, sameEmployerReward: 0, hoursWorked: 80, signedDeclaration: true, includeTaxCredit: true },
    dpc: { agreementType: 'dpc', grossReward: 8000, sameEmployerReward: 0, hoursWorked: 45, signedDeclaration: false, includeTaxCredit: false }
  };

  function money(value){ return CZK.format(Number.isFinite(value) ? value : 0); }
  function number(value){ return NUM.format(Number.isFinite(value) ? value : 0); }
  function readNumber(el){ return Math.max(0, Number(String(el.value).replace(',', '.')) || 0); }
  function limitFor(type){ return type === 'dpp' ? 12000 : 4500; }
  function typeLabel(type){ return type === 'dpp' ? 'DPP' : 'DPČ'; }

  function getValues(){
    const signed = els.signedDeclaration.checked;
    return {
      agreementType: els.agreementType.value,
      grossReward: readNumber(els.grossReward),
      sameEmployerReward: readNumber(els.sameEmployerReward),
      hoursWorked: readNumber(els.hoursWorked),
      signedDeclaration: signed,
      includeTaxCredit: signed && els.includeTaxCredit.checked,
      taxRate: readNumber(els.taxRate) / 100,
      employeeSocialRate: readNumber(els.employeeSocialRate) / 100,
      employeeHealthRate: readNumber(els.employeeHealthRate) / 100,
      taxpayerCredit: readNumber(els.taxpayerCredit)
    };
  }

  function calculate(values){
    const limit = limitFor(values.agreementType);
    const limitBase = values.grossReward + values.sameEmployerReward;
    const insured = limitBase >= limit && values.grossReward > 0;
    const employeeSocial = Math.round(values.grossReward * (insured ? values.employeeSocialRate : 0));
    const employeeHealth = Math.round(values.grossReward * (insured ? values.employeeHealthRate : 0));
    const taxBeforeCredit = Math.round(values.grossReward * values.taxRate);
    const creditApplied = values.includeTaxCredit ? Math.min(values.taxpayerCredit, taxBeforeCredit) : 0;
    const taxAfterCredit = Math.max(0, taxBeforeCredit - creditApplied);
    const netReward = Math.max(0, values.grossReward - employeeSocial - employeeHealth - taxAfterCredit);
    const hourlyGross = values.hoursWorked > 0 ? values.grossReward / values.hoursWorked : 0;
    const hourlyNet = values.hoursWorked > 0 ? netReward / values.hoursWorked : 0;
    const employerSocial = Math.round(values.grossReward * (insured ? EMPLOYER_SOCIAL_RATE : 0));
    const employerHealth = Math.round(values.grossReward * (insured ? EMPLOYER_HEALTH_RATE : 0));
    const employerCost = values.grossReward + employerSocial + employerHealth;
    const taxMode = !values.signedDeclaration && !insured ? 'srážková daň' : 'zálohová daň';
    return { limit, limitBase, insured, employeeSocial, employeeHealth, taxBeforeCredit, creditApplied, taxAfterCredit, netReward, hourlyGross, hourlyNet, employerSocial, employerHealth, employerCost, taxMode };
  }

  function statusClass(el, state){
    el.classList.remove('ok','warn','risk');
    el.classList.add(state);
  }

  function renderChecks(values, result){
    const type = typeLabel(values.agreementType);
    const gap = result.limit - result.limitBase;
    const nearLimit = Math.abs(gap) <= Math.max(500, result.limit * 0.08);

    els.limitCheck.textContent = result.insured
      ? `Limit: ${type} je nad hranicí, odvody se počítají z odměny ${money(values.grossReward)}.`
      : `Limit: do hranice ${money(result.limit)} zbývá ${money(Math.max(0, gap))}.`;
    statusClass(els.limitCheck, result.insured || nearLimit ? 'warn' : 'ok');

    els.taxCheck.textContent = values.includeTaxCredit
      ? `Daň: uplatněná sleva snížila daň o ${money(result.creditApplied)}.`
      : `Daň: bez uplatněné slevy, režim ${result.taxMode}.`;
    statusClass(els.taxCheck, values.includeTaxCredit ? 'ok' : 'warn');

    if (!values.hoursWorked) {
      els.wageCheck.textContent = 'Hodinová sazba: doplňte hodiny pro kontrolu minima.';
      statusClass(els.wageCheck, 'warn');
    } else if (result.hourlyGross >= MIN_HOURLY_2026) {
      els.wageCheck.textContent = `Hodinová sazba: hrubě ${money(result.hourlyGross)} / h, nad minimem 134,40 Kč/h.`;
      statusClass(els.wageCheck, 'ok');
    } else {
      els.wageCheck.textContent = `Hodinová sazba: hrubě ${money(result.hourlyGross)} / h, pod minimem 134,40 Kč/h.`;
      statusClass(els.wageCheck, 'risk');
    }
  }

  function renderBreakdown(values, result){
    const rows = [
      ['Typ dohody', typeLabel(values.agreementType), values.agreementType === 'dpp' ? 'Dohoda o provedení práce má v roce 2026 limit 12 000 Kč.' : 'Dohoda o pracovní činnosti má v roce 2026 limit 4 500 Kč.'],
      ['Hrubá odměna', money(values.grossReward), 'Částka zadaná pro tento měsíc a tuto dohodu.'],
      ['Započtený příjem pro limit', money(result.limitBase), 'Hrubá odměna plus další dohody stejného typu u jednoho zaměstnavatele.'],
      ['Rozhodný limit', money(result.limit), result.insured ? 'Limit je dosažen, model počítá pojistné.' : 'Limit dosažen není, model pojistné neodečítá.'],
      ['Sociální pojištění zaměstnance', money(result.employeeSocial), `${number(values.employeeSocialRate * 100)} % ze zadané odměny, pokud vzniká účast na pojištění.`],
      ['Zdravotní pojištění zaměstnance', money(result.employeeHealth), `${number(values.employeeHealthRate * 100)} % ze zadané odměny, pokud vzniká účast na pojištění.`],
      ['Daň před slevou', money(result.taxBeforeCredit), `${number(values.taxRate * 100)} % z hrubé odměny.`],
      ['Uplatněná sleva', money(result.creditApplied), values.includeTaxCredit ? 'Základní sleva na poplatníka snížila daň.' : 'Sleva se neuplatňuje.'],
      ['Daňový režim', result.taxMode, 'Bez prohlášení a pod limitem jde orientačně o srážkovou daň, jinak o zálohovou daň.'],
      ['Čistá odměna', money(result.netReward), 'Orientační částka k výplatě po dani a případných odvodech.'],
      ['Hrubá hodinová sazba', values.hoursWorked ? `${money(result.hourlyGross)} / h` : '—', 'Kontrola proti minimální hodinové mzdě 134,40 Kč/h pro rok 2026.'],
      ['Orientační náklad zaměstnavatele', money(result.employerCost), 'Hrubá odměna plus případné zaměstnavatelské odvody.']
    ];
    els.breakdownRows.innerHTML = rows.map(([item, value, meaning]) => `<tr><td>${item}</td><td>${value}</td><td>${meaning}</td></tr>`).join('');
  }

  function renderHero(values, result){
    const type = typeLabel(values.agreementType);
    els.heroType.textContent = `${type} ${result.insured ? 'nad limitem' : 'pod limitem'}`;
    els.heroNet.textContent = money(result.netReward);
    els.heroInsurance.textContent = money(result.employeeSocial + result.employeeHealth);
    els.heroTax.textContent = money(result.taxAfterCredit);
    els.heroHourly.textContent = values.hoursWorked ? money(result.hourlyNet) : '—';
    els.heroSentence.textContent = result.insured
      ? `${type} dosahuje rozhodné částky, proto se do čisté odměny promítá sociální a zdravotní pojištění.`
      : `${type} je pod rozhodnou částkou, takže model neodečítá sociální ani zdravotní pojištění.`;
  }

  function render(){
    const values = getValues();
    if (values.grossReward <= 0) return;
    const result = calculate(values);
    const type = typeLabel(values.agreementType);
    const percent = result.limit > 0 ? Math.round((result.limitBase / result.limit) * 100) : 0;
    const barWidth = Math.min(100, Math.max(0, percent));

    els.agreementHint.textContent = `${type} má pro rok 2026 rozhodnou částku ${money(result.limit)}. Započtený příjem je ${money(result.limitBase)}.`;
    els.netReward.textContent = money(result.netReward);
    els.resultBadge.textContent = result.insured ? 'Vznikají odvody' : 'Bez odvodů';
    els.grossOut.textContent = money(values.grossReward);
    els.limitBaseOut.textContent = money(result.limitBase);
    els.socialOut.textContent = money(result.employeeSocial);
    els.healthOut.textContent = money(result.employeeHealth);
    els.taxOut.textContent = money(result.taxAfterCredit);
    els.hourlyNetOut.textContent = values.hoursWorked ? `${money(result.hourlyNet)} / h` : '—';
    els.limitLabel.textContent = `Využití limitu ${money(result.limit)}`;
    els.limitPercent.textContent = `${percent} %`;
    els.limitBar.style.width = `${barWidth}%`;
    els.verdictText.textContent = result.insured
      ? `Započtený příjem ${money(result.limitBase)} dosahuje hranice pro ${type}. Čistý výsledek proto snižuje pojistné ${money(result.employeeSocial + result.employeeHealth)} a daň ${money(result.taxAfterCredit)}.`
      : `Započtený příjem ${money(result.limitBase)} je pod hranicí pro ${type}. Do čisté odměny se neodečítá pojistné; největší roli hraje daňové prohlášení a sleva.`;

    renderChecks(values, result);
    renderBreakdown(values, result);
    renderHero(values, result);
  }

  function syncCredit(){
    if (!els.signedDeclaration.checked) {
      els.includeTaxCredit.checked = false;
      els.includeTaxCredit.disabled = true;
    } else {
      els.includeTaxCredit.disabled = false;
    }
  }

  function applyPreset(key){
    const preset = presets[key] || presets['dpp-low'];
    els.agreementType.value = preset.agreementType;
    els.grossReward.value = preset.grossReward;
    els.sameEmployerReward.value = preset.sameEmployerReward;
    els.hoursWorked.value = preset.hoursWorked;
    els.signedDeclaration.checked = preset.signedDeclaration;
    els.includeTaxCredit.checked = preset.includeTaxCredit;
    syncCredit();
    document.querySelectorAll('[data-preset]').forEach(btn => btn.classList.toggle('active', btn.dataset.preset === key));
    render();
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    render();
  });

  ['agreementType','grossReward','sameEmployerReward','hoursWorked','signedDeclaration','includeTaxCredit','taxRate','employeeSocialRate','employeeHealthRate','taxpayerCredit'].forEach(id => {
    const el = $(id);
    el.addEventListener('input', () => { if (id === 'signedDeclaration') syncCredit(); render(); });
    el.addEventListener('change', () => { if (id === 'signedDeclaration') syncCredit(); render(); });
  });

  document.querySelectorAll('[data-preset]').forEach(btn => btn.addEventListener('click', () => applyPreset(btn.dataset.preset)));
  $('resetForm').addEventListener('click', () => applyPreset('dpp-low'));
  $('copyResult').addEventListener('click', async () => {
    const values = getValues();
    const result = calculate(values);
    const text = [
      'DPP / DPČ kalkulačka 2026',
      `Typ dohody: ${typeLabel(values.agreementType)}`,
      `Hrubá odměna: ${money(values.grossReward)}`,
      `Čistá odměna: ${money(result.netReward)}`,
      `Započteno do limitu: ${money(result.limitBase)} / limit ${money(result.limit)}`,
      `Sociální + zdravotní: ${money(result.employeeSocial + result.employeeHealth)}`,
      `Daň po slevě: ${money(result.taxAfterCredit)}`,
      `Daňový režim: ${result.taxMode}`
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      els.resultBadge.textContent = 'Výsledek zkopírován';
    } catch (error) {
      els.resultBadge.textContent = 'Kopírování se nepovedlo';
    }
  });

  syncCredit();
  render();
})();
