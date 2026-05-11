
(function(){
  const $ = (id) => document.getElementById(id);
  const fmt = (value, digits = 0) => new Intl.NumberFormat('cs-CZ', { style:'currency', currency:'CZK', maximumFractionDigits:digits }).format(Number.isFinite(value) ? value : 0);
  const num = (value, digits = 0) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits:digits }).format(Number.isFinite(value) ? value : 0);
  const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const heroSet = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const fields = ['carPrice','downPayment','interestRate','years','monthlyFee','insuranceMonthly','incomeShare','balloonPayment'];

  function ensureNextActions() {
    if (document.querySelector('.rv-next-actions')) return;
    const note = document.querySelector('.rv-result-note');
    if (!note) return;
    note.insertAdjacentHTML('afterend', `
      <div class="rv-next-actions" aria-label="Co spočítat dál">
        <strong>Co spočítat dál</strong>
        <div class="rv-next-actions__grid">
          <a href="/naklady-na-provoz-auta-kalkulacka.html">Přidat palivo, servis a pojištění</a>
          <a href="/cena-za-km-kalkulacka.html">Přepočítat auto na cenu za km</a>
          <a href="/amortizace-auta-kalkulacka.html">Zohlednit ztrátu hodnoty auta</a>
        </div>
      </div>
    `);
  }

  function updateHero(v, r) {
    heroSet('.rv-hero-number', fmt(r.monthlyWithFees || r.monthlyPayment));
    document.querySelectorAll('.rv-hero-metrics b').forEach((el, index) => {
      const values = [fmt(v.carPrice), fmt(v.downPayment), `${num(v.years)} let`];
      el.textContent = values[index] || el.textContent;
    });
    const bars = document.querySelectorAll('.rv-fuel-meter b');
    const labels = document.querySelectorAll('.rv-fuel-meter strong');
    const financedShare = v.carPrice > 0 ? (r.loanAmount / v.carPrice) * 100 : 0;
    const incomeLoad = r.neededIncome > 0 ? (r.monthlyWithFees / r.neededIncome) * 100 : 0;
    if (bars[0]) bars[0].style.width = `${clamp(financedShare, 8, 100)}%`;
    if (labels[0]) labels[0].textContent = `${Math.round(clamp(financedShare, 0, 100))} %`;
    if (bars[1]) bars[1].style.width = `${clamp(incomeLoad, 8, 100)}%`;
    if (labels[1]) labels[1].textContent = `${Math.round(clamp(incomeLoad, 0, 100))} %`;
  }

  function values(){ return Object.fromEntries(fields.map((id) => [id, Number($(id).value)])); }
  function calc(v){
    const loanAmount = v.carPrice - v.downPayment;
    const months = v.years * 12;
    const monthlyRate = v.interestRate / 100 / 12;
    let monthlyPayment = 0;
    if (monthlyRate === 0) monthlyPayment = (loanAmount - v.balloonPayment) / months;
    else {
      const pvBalloon = v.balloonPayment / Math.pow(1 + monthlyRate, months);
      const principal = loanAmount - pvBalloon;
      monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
    }
    const totalInstallments = monthlyPayment * months;
    const monthlyWithFees = monthlyPayment + v.monthlyFee + v.insuranceMonthly;
    const totalPaid = v.downPayment + totalInstallments + v.balloonPayment + ((v.monthlyFee + v.insuranceMonthly) * months);
    const totalOverpayment = totalPaid - v.carPrice;
    const neededIncome = monthlyWithFees / (v.incomeShare / 100);
    const downPaymentPercent = v.downPayment / v.carPrice * 100;
    return { loanAmount, months, monthlyPayment, monthlyWithFees, totalPaid, totalOverpayment, neededIncome, downPaymentPercent };
  }
  function schedule(v, r){
    const monthlyRate = v.interestRate / 100 / 12;
    let balance = v.carPrice - v.downPayment;
    const rows = [];
    for (let i=1;i<=r.months;i++){
      const interest = monthlyRate === 0 ? 0 : balance * monthlyRate;
      const principal = r.monthlyPayment - interest;
      balance = Math.max(0, balance - principal);
      if (i <= 3 || i > r.months - 3) rows.push([i, r.monthlyPayment, interest, principal, balance]);
      if (i === 4 && r.months > 7) rows.push(null);
    }
    if (v.balloonPayment > 0) rows.push(['doplatek', v.balloonPayment, 0, 0, 0]);
    $('scheduleBody').innerHTML = rows.map((row) => row ? `<tr><td>${row[0]}.</td><td>${fmt(row[1])}</td><td>${fmt(row[2])}</td><td>${fmt(row[3])}</td><td>${fmt(row[4])}</td></tr>` : '<tr><td colspan="5">...</td></tr>').join('');
  }
  function decision(v,r){
    const ratio = r.loanAmount > 0 ? r.totalOverpayment / r.loanAmount : 0;
    if (ratio > 0.35 || r.monthlyWithFees > 18000) return ['Přeplacení nebo zatížení je vysoké','Tento scénář už může být na auto zbytečně drahý. Zkuste levnější vůz, vyšší akontaci nebo kratší financování.','Prověřte celkové náklady auta'];
    if (ratio > 0.18 || v.downPayment < v.carPrice * 0.15) return ['Sledujte přeplacení','Splátka může dávat smysl, ale nízká akontace nebo delší financování dělají scénář citlivější.','Porovnejte jinou akontaci'];
    return ['Financování působí vyváženě','Scénář vypadá relativně zvládnutelně, pokud vedle splátky zůstává prostor i na provoz auta a rezervu.','Dopočítejte provoz auta'];
  }
  function run(){
    const v = values();
    if (!v.carPrice || v.downPayment >= v.carPrice || !v.years || v.balloonPayment >= (v.carPrice - v.downPayment)) {
      set('monthlyPayment','0 Kč');
      set('monthlyWithFees','0 Kč');
      set('totalPaid','0 Kč');
      set('totalOverpayment','0 Kč');
      set('neededIncome','0 Kč');
      set('financingBadge','Zkontrolujte zadání');
      set('resultNote','Zkontrolujte cenu auta, akontaci a závěrečný doplatek. Doplatek nesmí být vyšší než financovaná částka.');
      const body = $('scheduleBody');
      if (body) body.innerHTML = '';
      return;
    }
    const r = calc(v);
    set('monthlyPayment', fmt(r.monthlyPayment)); set('monthlyWithFees', fmt(r.monthlyWithFees)); set('totalPaid', fmt(r.totalPaid)); set('totalOverpayment', fmt(r.totalOverpayment)); set('neededIncome', fmt(r.neededIncome));
    set('summaryLoanAmount', fmt(r.loanAmount)); set('summaryDownPaymentPercent', `${num(r.downPaymentPercent,1)} %`); set('summaryInstallments', `${r.months}`); set('summaryBalloon', fmt(v.balloonPayment));
    const d = decision(v,r); set('financingBadge', d[0]); set('budgetStatus', d[0]); set('budgetText', d[1]); set('actionStatus', d[2]); set('decisionSummary', `Splátka včetně poplatků vychází na ${fmt(r.monthlyWithFees)} měsíčně. Při zvoleném limitu by měla odpovídat čistému příjmu zhruba ${fmt(r.neededIncome)}.`); set('nextActionText', 'Po splátce vždy dopočítejte palivo, servis, pojištění a ztrátu hodnoty auta. Až součet projde rozpočtem, porovnejte konkrétní nabídky podle RPSN a smluvních podmínek.'); set('resultNote', 'Výpočet je orientační a nezahrnuje všechny smluvní podmínky konkrétní nabídky.');
    updateHero(v, r);
    schedule(v,r);
  }
  function preset(name){
    const presets={standard:{carPrice:650000,downPayment:130000,interestRate:6.49,years:5,monthlyFee:0,insuranceMonthly:0,incomeShare:30,balloonPayment:0},safe:{carPrice:650000,downPayment:220000,interestRate:6.19,years:4,monthlyFee:0,insuranceMonthly:0,incomeShare:30,balloonPayment:0},'low-down':{carPrice:650000,downPayment:65000,interestRate:6.79,years:6,monthlyFee:0,insuranceMonthly:0,incomeShare:30,balloonPayment:0},balloon:{carPrice:650000,downPayment:130000,interestRate:6.49,years:4,monthlyFee:0,insuranceMonthly:0,incomeShare:30,balloonPayment:120000}};
    Object.entries(presets[name] || presets.standard).forEach(([id,value]) => { $(id).value = value; });
    document.querySelectorAll('.scenario-chip').forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.preset === name)));
    run();
  }
  $('carLoanForm').addEventListener('submit', (e) => { e.preventDefault(); run(); });
  fields.forEach((id) => { $(id).addEventListener('input', run); $(id).addEventListener('change', run); });
  document.querySelectorAll('.scenario-chip').forEach((btn) => btn.addEventListener('click', () => preset(btn.dataset.preset)));
  $('resetBtn').addEventListener('click', () => preset('standard'));
  ensureNextActions();
  run();
})();
