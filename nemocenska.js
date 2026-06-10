
(function(){
  const $ = id => document.getElementById(id);
  const form = $("sickForm");
  if(!form) return;

  const RH1 = 1633, RH2 = 2449, RH3 = 4897;
  const fmt = new Intl.NumberFormat("cs-CZ", {maximumFractionDigits:0});
  const czk = n => `${fmt.format(Math.round(Number.isFinite(n) ? n : 0))} Kč`;
  const dayText = n => {
    n = Math.round(n);
    if(n === 1) return "1 den";
    if(n >= 2 && n <= 4) return `${n} dny`;
    return `${n} dnů`;
  };
  const monthFmt = new Intl.DateTimeFormat("cs-CZ", {day:"numeric", month:"long", year:"numeric"});
  let mode = "monthly";
  const modeBtns = Array.from(document.querySelectorAll(".ns-mode"));

  function val(id){
    const el = $(id);
    const n = Number(String(el?.value || "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  function reducedDVZ(dvz){
    let r = 0;
    r += Math.min(dvz, RH1) * 0.90;
    if(dvz > RH1) r += Math.min(dvz - RH1, RH2 - RH1) * 0.60;
    if(dvz > RH2) r += Math.min(dvz - RH2, RH3 - RH2) * 0.30;
    return Math.max(0, r);
  }

  function addDays(date, days){
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + Math.max(0, Math.round(days)) - 1);
    return d;
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

  function calculate(){
    const monthlyIncome = Math.max(0, val("monthlyIncome"));
    const totalIncome = Math.max(0, val("totalIncome"));
    const periodDays = Math.max(1, val("periodDays"));
    const sickDays = Math.max(1, val("sickDays"));
    const reductionType = $("reductionType").value;
    const penalty = reductionType === "half" ? 0.5 : 1;

    if(mode === "monthly"){
      $("totalIncome").value = Math.round(monthlyIncome * 12);
    } else {
      $("monthlyIncome").value = Math.round(totalIncome / 12);
    }

    const effectiveMonthly = Math.max(0, val("monthlyIncome"));
    const effectiveTotal = mode === "monthly" ? effectiveMonthly * 12 : Math.max(0, val("totalIncome"));
    const dvz = effectiveTotal / periodDays;
    const rdvz = reducedDVZ(dvz);

    const {paid,b1,b2,b3} = bandDays(sickDays);
    const daily60 = rdvz * 0.60 * penalty;
    const daily66 = rdvz * 0.66 * penalty;
    const daily72 = rdvz * 0.72 * penalty;

    const amount1 = b1 * daily60;
    const amount2 = b2 * daily66;
    const amount3 = b3 * daily72;
    const total = amount1 + amount2 + amount3;
    const avgDaily = paid > 0 ? total / paid : 0;
    const normalIncomeForPeriod = effectiveMonthly > 0 ? effectiveMonthly / 30.4167 * sickDays : 0;
    const loss = Math.max(0, normalIncomeForPeriod - total);

    $("totalResult").textContent = czk(total);
    $("paidDaysResult").textContent = dayText(paid);
    $("dailyResult").textContent = paid > 0 ? czk(avgDaily) : "0 Kč";
    $("bandResult").textContent = sickDays <= 14 ? "bez dávky ČSSZ" : sickDays <= 30 ? "60 %" : sickDays <= 60 ? "60 / 66 %" : "60 / 66 / 72 %";
    $("primarySub").textContent = paid > 0 ? `Za ${dayText(paid)} nemocenského od ČSSZ.` : "Při délce do 14 dnů nevzniká nemocenské od ČSSZ.";
    $("band1Result").textContent = czk(amount1);
    $("band2Result").textContent = czk(amount2);
    $("band3Result").textContent = czk(amount3);
    $("dvzResult").textContent = czk(dvz);
    $("reducedDvzResult").textContent = czk(rdvz);
    $("lossResult").textContent = effectiveMonthly > 0 ? czk(loss) : "—";

    const start = $("startDate").value;
    if(start){
      const d = new Date(start + "T00:00:00");
      $("endResult").textContent = monthFmt.format(addDays(d, sickDays));
    } else {
      $("endResult").textContent = "zadejte datum";
    }

    let status = "Nemocenské od 15. dne";
    let title = "Praktický závěr";
    let text = "Nemocenské od ČSSZ začíná až od 15. dne. U delší neschopenky sledujte hlavně celkový výpadek příjmu proti běžné mzdě.";
    let next = "Porovnejte výsledek s čistou mzdou a zkontrolujte finanční rezervu domácnosti.";

    if(sickDays <= 14){
      status = "Bez nemocenské ČSSZ";
      title = "Krátká neschopenka";
      text = "Při neschopence do 14 dnů kalkulačka ukazuje 0 Kč nemocenského od ČSSZ. Toto období se obvykle řeší náhradou mzdy od zaměstnavatele.";
      next = "Pro přesný výpočet prvních 14 dnů je potřeba znát rozvrh směn a průměrný hodinový výdělek.";
    } else if(sickDays > 60){
      status = "Dlouhá neschopenka";
      title = "Dlouhá pracovní neschopnost";
      text = "U delší nemoci se použije i sazba 72 %, ale příjem může být stále výrazně nižší než běžná výplata.";
      next = "Zkontrolujte rozpočet domácnosti a finanční rezervu na několik měsíců.";
    } else if(reductionType === "half"){
      status = "Snížená dávka";
      title = "Výsledek počítá snížení o 50 %";
      text = "Zvolili jste speciální snížení dávky. Používejte ho jen pro situace, kdy se nemocenské podle pravidel opravdu krátí.";
      next = "Ověřte konkrétní důvod snížení u ČSSZ.";
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

  const start = $("startDate");
  if(start && !start.value){
    const d = new Date();
    start.value = d.toISOString().slice(0,10);
  }

  setMode("monthly");
})();
