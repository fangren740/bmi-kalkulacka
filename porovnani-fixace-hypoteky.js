(() => {
  const $ = (id) => document.getElementById(id);
  const fmt = (n) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(Number.isFinite(n) ? n : 0)) + ' Kč';
  const pct = (n) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(Number.isFinite(n) ? n : 0) + ' %';
  const num = (id) => Math.max(0, parseFloat($(id)?.value || '0') || 0);

  const presets = {
    standard: { principal: 3500000, remainingYears: 25, horizonYears: 5, monthlyFee: 0, rateA: 4.79, rateB: 5.09, fixYearsA: 3, fixYearsB: 5, followRateA: 4.29, followRateB: 4.79, feeA: 0, feeB: 0 },
    drop: { principal: 4200000, remainingYears: 27, horizonYears: 5, monthlyFee: 0, rateA: 4.69, rateB: 5.15, fixYearsA: 2, fixYearsB: 5, followRateA: 3.89, followRateB: 4.79, feeA: 0, feeB: 0 },
    security: { principal: 3000000, remainingYears: 22, horizonYears: 7, monthlyFee: 0, rateA: 4.85, rateB: 5.05, fixYearsA: 3, fixYearsB: 7, followRateA: 5.25, followRateB: 4.95, feeA: 0, feeB: 0 }
  };

  function payment(principal, annualRate, months) {
    if (principal <= 0 || months <= 0) return 0;
    const r = annualRate / 100 / 12;
    if (r === 0) return principal / months;
    return principal * r / (1 - Math.pow(1 + r, -months));
  }

  function simulate({ principal, years, horizon, firstRate, fixYears, followRate, oneTimeFee, monthlyFee }) {
    let balance = principal;
    const totalMonths = Math.max(1, Math.round(years * 12));
    const horizonMonths = Math.min(Math.max(1, Math.round(horizon * 12)), totalMonths);
    const fixedMonths = Math.max(1, Math.round(fixYears * 12));
    let paid = 0;
    let interest = 0;
    let principalPaid = 0;
    let firstPayment = payment(balance, firstRate, totalMonths);
    let paymentAfterFix = null;

    for (let m = 1; m <= horizonMonths; m++) {
      const remainingMonths = totalMonths - m + 1;
      const rate = m <= fixedMonths ? firstRate : followRate;
      if (m === fixedMonths + 1) paymentAfterFix = payment(balance, followRate, remainingMonths);
      const currentPayment = m <= fixedMonths ? firstPayment : (paymentAfterFix || payment(balance, rate, remainingMonths));
      const monthlyRate = rate / 100 / 12;
      const monthInterest = balance * monthlyRate;
      const monthPrincipal = Math.min(balance, Math.max(0, currentPayment - monthInterest));
      balance = Math.max(0, balance - monthPrincipal);
      paid += currentPayment + monthlyFee;
      interest += monthInterest;
      principalPaid += monthPrincipal;
    }

    return {
      firstPayment,
      paymentAfterFix: paymentAfterFix || firstPayment,
      paid,
      interest,
      principalPaid,
      balance,
      totalCost: interest + oneTimeFee + monthlyFee * horizonMonths,
      oneTimeFee,
      monthlyFeeTotal: monthlyFee * horizonMonths
    };
  }

  function setValues(values) {
    Object.entries(values).forEach(([key, value]) => { if ($(key)) $(key).value = value; });
    calculate();
  }

  function calculate() {
    const principal = num('principal');
    const years = Math.max(1, num('remainingYears'));
    const horizon = Math.max(1, num('horizonYears'));
    const monthlyFee = num('monthlyFee');
    const a = simulate({ principal, years, horizon, firstRate: num('rateA'), fixYears: num('fixYearsA'), followRate: num('followRateA'), oneTimeFee: num('feeA'), monthlyFee });
    const b = simulate({ principal, years, horizon, firstRate: num('rateB'), fixYears: num('fixYearsB'), followRate: num('followRateB'), oneTimeFee: num('feeB'), monthlyFee });
    const diff = a.totalCost - b.totalCost;
    const absDiff = Math.abs(diff);
    const winner = diff < -500 ? 'Varianta A' : diff > 500 ? 'Varianta B' : 'Velmi podobné';
    const riskGapA = Math.abs(num('followRateA') - num('rateA'));
    const riskGapB = Math.abs(num('followRateB') - num('rateB'));
    const risk = Math.max(riskGapA, riskGapB);
    const riskLabel = risk >= 1 ? 'Vyšší' : risk >= 0.4 ? 'Střední' : 'Nižší';

    $('winnerLabel').textContent = winner;
    $('resultSub').textContent = winner === 'Velmi podobné' ? 'Rozdíl nákladů je malý, rozhodovat může jistota splátky a flexibilita.' : `${winner} má v zadaném horizontu nižší orientační úroky a poplatky.`;
    $('paymentA').textContent = fmt(a.firstPayment);
    $('paymentB').textContent = fmt(b.firstPayment);
    $('costDiff').textContent = fmt(absDiff);
    $('riskLabel').textContent = riskLabel;
    $('bdCostA').textContent = fmt(a.totalCost);
    $('bdCostB').textContent = fmt(b.totalCost);
    $('bdBalanceA').textContent = fmt(a.balance);
    $('bdBalanceB').textContent = fmt(b.balance);
    $('bdTextA').textContent = `Z toho úroky ${fmt(a.interest)}, jednorázové náklady ${fmt(a.oneTimeFee)} a měsíční poplatky ${fmt(a.monthlyFeeTotal)}.`;
    $('bdTextB').textContent = `Z toho úroky ${fmt(b.interest)}, jednorázové náklady ${fmt(b.oneTimeFee)} a měsíční poplatky ${fmt(b.monthlyFeeTotal)}.`;

    $('heroWinner').textContent = winner;
    $('heroSaving').textContent = winner === 'Velmi podobné' ? 'rozdíl je malý' : `rozdíl ${fmt(absDiff)}`;
    $('heroPaymentA').textContent = fmt(a.firstPayment);
    $('heroPaymentB').textContent = fmt(b.firstPayment);
    $('heroCostA').textContent = fmt(a.totalCost);
    $('heroCostB').textContent = fmt(b.totalCost);

    let verdict;
    let next;
    if (winner === 'Velmi podobné') {
      verdict = 'Obě varianty vycházejí velmi podobně. V takové situaci má větší váhu jistota splátky, flexibilita, podmínky mimořádných splátek a vaše finanční rezerva.';
      next = 'Zkontrolujte podmínky banky, rezervu domácnosti a scénář, kdy by sazba po kratší fixaci byla horší, než čekáte.';
    } else if (winner === 'Varianta A' && num('fixYearsA') < num('fixYearsB')) {
      verdict = 'Kratší fixace vychází levněji, ale výsledek stojí na předpokladu navazující sazby. Otestujte i pesimističtější scénář po konci fixace.';
      next = 'Zvyšte odhad sazby po fixaci A a sledujte, kdy se výhoda kratší fixace ztratí.';
    } else if (winner === 'Varianta B' && num('fixYearsB') >= num('fixYearsA')) {
      verdict = 'Delší fixace vychází v modelu lépe nebo bezpečněji. Může dávat smysl hlavně tehdy, pokud chcete stabilní splátku a nechcete brzy řešit novou nabídku.';
      next = 'Porovnejte delší fixaci ještě s nabídkou refinancování a s možností mimořádných splátek.';
    } else {
      verdict = `${winner} vychází levněji. Vedle čísla zvažte také délku jistoty splátky a to, zda budete hypotéku v nejbližších letech měnit.`;
      next = 'Ověřte, jestli výsledek platí i při mírně horší navazující sazbě a při započtení všech poplatků.';
    }
    $('resultVerdict').textContent = verdict;
    $('nextStep').textContent = next;
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('fixForm')?.addEventListener('submit', (event) => { event.preventDefault(); calculate(); });
    document.querySelectorAll('#fixForm input').forEach((el) => el.addEventListener('input', calculate));
    document.querySelectorAll('.preset').forEach((button) => {
      button.addEventListener('click', () => {
        document.querySelectorAll('.preset').forEach((b) => b.classList.remove('active'));
        button.classList.add('active');
        setValues(presets[button.dataset.preset] || presets.standard);
      });
    });
    $('resetFix')?.addEventListener('click', () => {
      document.querySelectorAll('.preset').forEach((b) => b.classList.toggle('active', b.dataset.preset === 'standard'));
      setValues(presets.standard);
    });
    calculate();
  });
})();
