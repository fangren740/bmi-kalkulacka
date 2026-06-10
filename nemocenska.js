
(function(){
  const $ = id => document.getElementById(id);
  const form = $("sickForm");
  if(!form) return;

  const RH1 = 1633, RH2 = 2449, RH3 = 4897;
  const HR1 = RH1 * 0.175, HR2 = RH2 * 0.175, HR3 = RH3 * 0.175;
  const fmt = new Intl.NumberFormat("cs-CZ", {maximumFractionDigits:0});
  const czk = n => `${fmt.format(Math.round(Number.isFinite(n) ? n : 0))} Kč`;
  const hour = n => `${fmt.format(Math.round(Number.isFinite(n) ? n : 0))} h`;
  const dayText = n => {
    n = Math.round(n);
    if(n === 1) return "1 den";
    if(n >= 2 && n <= 4) return `${n} dny`;
    return `${n} dnů`;
  };
  const monthFmt = new Intl.DateTimeFormat("cs-CZ", {day:"numeric", month:"long", year:"numeric"});
  let mode = "monthly";
  let manualHourly = false;
  let manualHours = false;
  const modeBtns = Array.from(document.querySelectorAll(".ns-mode"));

  function val(id){
    const el = $(id);
    const n = Number(String(el?.value || "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  function reduceBase(x, a, b, c){
    let r = 0;
    r += Math.min(x, a) * 0.90;
    if(x > a) r += Math.min(x - a, b - a) * 0.60;
    if(x > b) r += Math.min(x - b, c - b) * 0.30;
    return Math.max(0, r);
  }

  function addDays(date, days){
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + Math.max(0, Math.round(days)) - 1);
    return d;
  }

  function weekdaysInFirstPeriod(startDate, totalDays){
    const days = Math.min(14, Math.max(0, Math.round(totalDays)));
    let workdays = 0;
    const d = new Date(startDate.getTime());
    for(let i = 0; i < days; i++){
      const dow = d.getDay();
      if(dow !== 0 && dow !== 6) workdays++;
      d.setDate(d.getDate() + 1);
    }
    return workdays;
  }

  function bandDays(totalDays){
    const paid = Math.max(0, totalDays - 14);
    const b1 = Math.max(0, Math.min(totalDays, 30) - 14);
    const b2 = Math.max(0, Math.min(totalDays, 60) - 30);
    const b3 = Math.max(0, totalDays - 60);
    return {paid,b1,b2,b3};
  }

  function setMode(nextMode){
    mode = nextMode;
    modeBtns.forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    form.classList.toggle("is-monthly-mode", mode === "monthly");
    form.classList.toggle("is-total-mode", mode === "total");
    const hint = $("modeHint");
    if(hint){
      hint.textContent = mode === "monthly"
        ? "Zadejte běžnou průměrnou hrubou mzdu. Roční příjem si kalkulačka dopočítá."
        : "Zadejte celkový hrubý příjem za rozhodné období. Měsíční průměr se dopočítá.";
    }
    calculate();
  }

  function syncAutoInputs(effectiveMonthly, sickDays){
    const hourly = $("averageHourly");
    const hours = $("missedHours");
    const start = $("startDate");
    if(hourly && !manualHourly){
      hourly.value = Math.max(0, Math.round(effectiveMonthly / 173.92));
    }
    if(hours && !manualHours){
      const startDate = start && start.value ? new Date(start.value + "T00:00:00") : new Date();
      hours.value = Math.min(80, weekdaysInFirstPeriod(startDate, sickDays) * 8);
    }
  }

  function calculate(){
    const monthlyIncomeRaw = Math.max(0, val("monthlyIncome"));
    const totalIncomeRaw = Math.max(0, val("totalIncome"));
    const periodDays = Math.max(1, val("periodDays"));
    const sickDays = Math.max(1, val("sickDays"));
    const reductionType = $("reductionType").value;
    const penalty = reductionType === "half" ? 0.5 : 1;

    if(mode === "monthly"){
      $("totalIncome").value = Math.round(monthlyIncomeRaw * 12);
    } else {
      $("monthlyIncome").value = Math.round(totalIncomeRaw / 12);
    }

    const effectiveMonthly = Math.max(0, val("monthlyIncome"));
    syncAutoInputs(effectiveMonthly, sickDays);

    const averageHourly = Math.max(0, val("averageHourly"));
    const missedHours = Math.max(0, val("missedHours"));
    const effectiveTotal = mode === "monthly" ? effectiveMonthly * 12 : Math.max(0, val("totalIncome"));
    const dvz = effectiveTotal / periodDays;
    const rdvz = reduceBase(dvz, RH1, RH2, RH3);

    const reducedHourly = reduceBase(averageHourly, HR1, HR2, HR3);
    const wageComp = reducedHourly * 0.60 * missedHours;

    const {paid,b1,b2,b3} = bandDays(sickDays);
    const daily60 = rdvz * 0.60 * penalty;
    const daily66 = rdvz * 0.66 * penalty;
    const daily72 = rdvz * 0.72 * penalty;
    const amount1 = b1 * daily60;
    const amount2 = b2 * daily66;
    const amount3 = b3 * daily72;
    const sickness = amount1 + amount2 + amount3;
    const total = wageComp + sickness;
    const avgDaily = paid > 0 ? sickness / paid : 0;
    const normalIncomeForPeriod = effectiveMonthly > 0 ? effectiveMonthly / 30.4167 * sickDays : 0;
    const loss = Math.max(0, normalIncomeForPeriod - total);

    $("totalResult").textContent = czk(total);
    $("wageCompResult").textContent = czk(wageComp);
    $("sicknessResult").textContent = czk(sickness);
    $("paidDaysResult").textContent = dayText(paid);
    $("dailyResult").textContent = paid > 0 ? czk(avgDaily) : "0 Kč";
    $("bandResult") && ($("bandResult").textContent = sickDays <= 14 ? "jen zaměstnavatel" : sickDays <= 30 ? "60 %" : sickDays <= 60 ? "60 / 66 %" : "60 / 66 / 72 %");
    $("primarySub").textContent = paid > 0 ? `Náhrada mzdy + ${dayText(paid)} nemocenského od ČSSZ.` : "Jen orientační náhrada mzdy za prvních 14 dnů.";
    $("band1Result").textContent = czk(amount1);
    $("band2Result").textContent = czk(amount2);
    $("band3Result").textContent = czk(amount3);
    $("dvzResult").textContent = czk(dvz);
    $("reducedDvzResult").textContent = czk(rdvz);
    $("lossResult").textContent = effectiveMonthly > 0 ? czk(loss) : "—";
    $("missedHoursResult").textContent = hour(missedHours);
    $("reducedHourlyResult").textContent = `${czk(reducedHourly)}/h`;
    $("wageCompBreakdownResult").textContent = czk(wageComp);

    const start = $("startDate").value;
    if(start){
      const d = new Date(start + "T00:00:00");
      $("endResult").textContent = monthFmt.format(addDays(d, sickDays));
    } else {
      $("endResult").textContent = "zadejte datum";
    }

    let status = "Celkem za neschopenku";
    let title = "Praktický závěr";
    let text = "Výsledek zahrnuje náhradu mzdy od zaměstnavatele za prvních 14 dnů a nemocenské od ČSSZ od 15. dne.";
    let next = "Porovnejte celkový výsledek s běžnou čistou mzdou a finanční rezervou.";

    if(sickDays <= 14){
      status = "Jen zaměstnavatel";
      title = "Krátká neschopenka";
      text = "Při neschopence do 14 dnů nevzniká nemocenské od ČSSZ. Výsledek ukazuje jen orientační náhradu mzdy za zameškané hodiny.";
      next = "Pro přesnější částku upravte zameškané hodiny podle skutečného rozvrhu směn.";
    } else if(sickDays > 60){
      status = "Dlouhá neschopenka";
      title = "Dlouhá pracovní neschopnost";
      text = "U delší nemoci se započítá i sazba 72 %, ale celkový příjem může být stále výrazně nižší než běžná výplata.";
      next = "Zkontrolujte rozpočet domácnosti a finanční rezervu na několik měsíců.";
    } else if(reductionType === "half"){
      status = "Snížená dávka";
      title = "Výsledek počítá snížení o 50 %";
      text = "Zvolili jste speciální snížení nemocenského od ČSSZ. Náhrada mzdy od zaměstnavatele se v tomto orientačním modelu nesnižuje.";
      next = "Ověřte konkrétní důvod snížení u ČSSZ nebo zaměstnavatele.";
    }

    $("statusPill").textContent = status;
    $("decisionTitle").textContent = title;
    $("decisionText").textContent = text;
    $("nextActionText").textContent = next;
  }

  modeBtns.forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.mode)));
  ["monthlyIncome","totalIncome","periodDays","sickDays","startDate","reductionType"].forEach(id => {
    const el = $(id);
    if(el){
      el.addEventListener("input", calculate);
      el.addEventListener("change", calculate);
    }
  });
  ["averageHourly","missedHours"].forEach(id => {
    const el = $(id);
    if(el){
      el.addEventListener("input", () => {
        if(id === "averageHourly") manualHourly = true;
        if(id === "missedHours") manualHours = true;
        calculate();
      });
      el.addEventListener("change", () => {
        if(id === "averageHourly") manualHourly = true;
        if(id === "missedHours") manualHours = true;
        calculate();
      });
    }
  });

  const start = $("startDate");
  if(start && !start.value){
    const d = new Date();
    start.value = d.toISOString().slice(0,10);
  }
  setMode("monthly");
})();
