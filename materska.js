
(function(){
  const $ = (id) => document.getElementById(id);
  const form = $("maternityForm");
  if(!form) return;

  const RH1 = 1633, RH2 = 2449, RH3 = 4897;
  const fmt = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const czk = n => `${fmt.format(Math.round(Number.isFinite(n) ? n : 0))} Kč`;
  const pct = n => `${Math.round((Number.isFinite(n) ? n : 0))} %`;
  const dayText = n => {
    n = Math.round(n);
    if(n === 1) return "1 den";
    if(n >= 2 && n <= 4) return `${n} dny`;
    return `${n} dnů`;
  };
  const monthFmt = new Intl.DateTimeFormat("cs-CZ", { month:"long", year:"numeric" });

  let mode = "monthly";
  const modeBtns = Array.from(document.querySelectorAll(".mt-mode"));

  function val(id){
    const el = $(id);
    const n = Number(String(el.value || "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  function addDays(date, days){
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + Math.max(0, Math.round(days)) - 1);
    return d;
  }

  function reducedDVZ(dvz){
    let r = 0;
    r += Math.min(dvz, RH1);
    if(dvz > RH1) r += Math.min(dvz - RH1, RH2 - RH1) * 0.60;
    if(dvz > RH2) r += Math.min(dvz - RH2, RH3 - RH2) * 0.30;
    return Math.max(0, r);
  }

  function durationByCase(type){
    if(type === "motherMultiple") return 259;
    if(type === "fatherSingle") return 154;
    if(type === "fatherMultiple") return 217;
    return 196;
  }

  function calculate(){
    const monthlyIncome = Math.max(0, val("monthlyIncome"));
    const totalIncome = Math.max(0, val("totalIncome"));
    const days = Math.max(1, val("periodDays"));
    const insuranceDays = Math.max(0, val("insuranceDays"));
    const caseType = $("caseType").value;
    const duration = durationByCase(caseType);

    if(mode === "monthly"){
      $("totalIncome").value = Math.round(monthlyIncome * 12);
    } else {
      $("monthlyIncome").value = Math.round(totalIncome / 12);
    }

    const effectiveTotal = mode === "monthly" ? monthlyIncome * 12 : Math.max(0, val("totalIncome"));
    const dvz = effectiveTotal / days;
    const rdvz = reducedDVZ(dvz);
    const daily = rdvz * 0.70;
    const monthly31 = daily * 31;
    const total = daily * duration;
    const replacement = monthlyIncome > 0 ? monthly31 / monthlyIncome * 100 : 0;

    $("monthlyResult").textContent = czk(monthly31);
    $("dailyResult").textContent = czk(daily);
    $("totalResult").textContent = czk(total);
    $("durationResult").textContent = dayText(duration);
    $("dvzResult").textContent = czk(dvz);
    $("reducedDvzResult").textContent = czk(rdvz);
    $("replacementResult").textContent = pct(replacement);
    $("primarySub").textContent = `Přibližná měsíční částka při 31 dnech. Denní dávka vychází ${czk(daily)}.`;

    const start = $("startDate").value;
    if(start){
      const d = new Date(start + "T00:00:00");
      $("endResult").textContent = monthFmt.format(addDays(d, duration));
    } else {
      $("endResult").textContent = "zadejte datum";
    }

    const insured = $("currentlyInsured").checked;
    const protection = $("pregnancyProtection").checked;
    let status = "Orientační nárok OK";
    let title = "Výpočet vypadá realisticky";
    let text = "Podle zadaných údajů máte splněnou základní kontrolu pojištění a výsledek lze použít pro orientační plánování.";
    let next = "Spočítejte si hned i rodičovský příspěvek, který obvykle navazuje po skončení mateřské.";

    if(insuranceDays < 270){
      status = "Pozor na nárok";
      title = "Nemusí být splněna doba pojištění";
      text = `Zadali jste ${Math.round(insuranceDays)} dnů nemocenského pojištění. Pro nárok na PPM se orientačně sleduje alespoň 270 dnů v posledních dvou letech.`;
      next = "Ověřte nárok u OSSZ. Pokud PPM nevznikne, řešte rodičovský příspěvek od narození dítěte.";
    } else if(!insured || !protection){
      status = "Nutné ověřit";
      title = "Zkontrolujte pojištění nebo ochrannou lhůtu";
      text = "Výše dávky může vycházet dobře, ale nárok závisí i na tom, zda trvá nemocenské pojištění nebo ochranná lhůta.";
      next = "Ověřte konkrétní situaci u OSSZ podle pracovního poměru, ochranné lhůty a data nástupu.";
    } else if(replacement < 55 && monthlyIncome > 0){
      status = "Vyšší příjem se redukuje";
      title = "Mateřská je výrazně nižší než mzda";
      text = "U vyšších příjmů se projevují redukční hranice. Mateřská pak neroste stejně rychle jako hrubá mzda.";
      next = "Doporučuji zkontrolovat rozpočet domácnosti a plán po přechodu na rodičovský příspěvek.";
    }

    $("statusPill").textContent = status;
    $("decisionTitle").textContent = title;
    $("decisionText").textContent = text;
    $("nextActionText").textContent = next;
  }

  function updateModeUi(){
    form.classList.toggle("is-monthly-mode", mode === "monthly");
    form.classList.toggle("is-total-mode", mode === "total");

    const monthlyInput = $("monthlyIncome");
    const totalInput = $("totalIncome");
    const hint = $("modeHint");

    if(monthlyInput && totalInput){
      monthlyInput.readOnly = mode !== "monthly";
      totalInput.readOnly = mode !== "total";
    }

    if(hint){
      hint.textContent = mode === "monthly"
        ? "Zadejte běžnou průměrnou hrubou mzdu. Roční příjem si kalkulačka dopočítá."
        : "Zadejte celkový hrubý příjem za rozhodné období. Měsíční průměr se dopočítá.";
    }
  }

  function setMode(nextMode){
    mode = nextMode;
    modeBtns.forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    updateModeUi();
    calculate();
  }

  modeBtns.forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.mode)));
  ["monthlyIncome","totalIncome","periodDays","insuranceDays","startDate","caseType","currentlyInsured","pregnancyProtection"].forEach(id => {
    const el = $(id);
    if(el) el.addEventListener("input", calculate);
    if(el) el.addEventListener("change", calculate);
  });

  // Set a reasonable default start date 6 weeks from today
  const start = $("startDate");
  if(start && !start.value){
    const d = new Date();
    d.setDate(d.getDate() + 42);
    start.value = d.toISOString().slice(0,10);
  }

  updateModeUi();
  calculate();
})();
