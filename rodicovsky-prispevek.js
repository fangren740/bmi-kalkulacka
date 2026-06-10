
(function(){
  const $ = (id) => document.getElementById(id);
  const form = $("parentalForm");
  if(!form) return;

  const inputs = ["totalEntitlement","alreadyUsed","monthlyAmount","childAgeMonths","targetMonths","monthlyLimit"].map($);
  const modeBtns = Array.from(document.querySelectorAll(".rp-mode"));
  const typeBtns = Array.from(document.querySelectorAll(".rp-chip"));
  let currentType = "single";
  let currentMode = "duration";

  const fmt = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const czk = (n) => `${fmt.format(Math.round(Number.isFinite(n) ? n : 0))} Kč`;
  const monthFmt = new Intl.DateTimeFormat("cs-CZ", { month:"long", year:"numeric" });

  function val(id){
    const n = Number(String($(id).value).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  function addMonths(date, months){
    const d = new Date(date.getFullYear(), date.getMonth(), 1);
    d.setMonth(d.getMonth() + Math.max(0, Math.ceil(months)));
    return d;
  }

  function monthText(n){
    const r = Math.max(0, Math.ceil(n));
    if(r === 1) return "1 měsíc";
    if(r >= 2 && r <= 4) return `${r} měsíce`;
    return `${r} měsíců`;
  }

  function clampInputs(){
    const total = Math.max(0, val("totalEntitlement"));
    const used = Math.min(Math.max(0, val("alreadyUsed")), total);
    if(used !== val("alreadyUsed")) $("alreadyUsed").value = Math.round(used);
    if(val("monthlyAmount") < 1) $("monthlyAmount").value = 1;
    if(val("targetMonths") < 1) $("targetMonths").value = 1;
    if(val("monthlyLimit") < 1) $("monthlyLimit").value = 1;
  }

  function setType(type){
    currentType = type;
    typeBtns.forEach(btn => {
      const active = btn.dataset.type === type;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });

    if(type === "single"){
      $("totalEntitlement").value = 350000;
      $("monthlyLimit").value = 15000;
      $("totalEntitlement").readOnly = true;
    } else if(type === "multiple"){
      $("totalEntitlement").value = 700000;
      $("monthlyLimit").value = 30000;
      $("totalEntitlement").readOnly = true;
    } else {
      $("totalEntitlement").readOnly = false;
    }
    calculate();
  }

  function setMode(mode){
    currentMode = mode;
    modeBtns.forEach(btn => {
      const active = btn.dataset.mode === mode;
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", String(active));
    });
    if(mode === "target"){
      $("targetMonths").closest(".input-group").style.outline = "3px solid rgba(29,216,139,.12)";
    } else {
      $("targetMonths").closest(".input-group").style.outline = "";
    }
    calculate();
  }

  function makeVariant(label, amount, remaining, today, monthsToThree, limit){
    const safeAmount = Math.max(1, amount);
    const months = remaining / safeAmount;
    const end = addMonths(today, months);
    let rating = "vyrovnané";
    let score = 2;
    if(safeAmount > limit){ rating = "nad limitem"; score = 0; }
    else if(months < monthsToThree * 0.55){ rating = "rychlé"; score = 1; }
    else if(months > monthsToThree * 1.18){ rating = "pomalé"; score = 1; }
    return { label, amount:safeAmount, months, end, rating, score };
  }

  function calculate(){
    clampInputs();

    const total = Math.max(0, val("totalEntitlement"));
    const used = Math.max(0, val("alreadyUsed"));
    const monthly = Math.max(1, val("monthlyAmount"));
    const childAge = Math.max(0, val("childAgeMonths"));
    const targetMonths = Math.max(1, val("targetMonths"));
    const limit = Math.max(1, val("monthlyLimit"));
    const remaining = Math.max(0, total - used);
    const duration = remaining / monthly;
    const monthsToThree = Math.max(0, 36 - childAge);
    const targetMonthly = remaining / targetMonths;
    const today = new Date();
    const end = addMonths(today, duration);

    $("remainingResult").textContent = czk(remaining);
    $("primarySub").textContent = `Při ${czk(monthly)} měsíčně vydrží přibližně ${monthText(duration)}.`;
    $("durationResult").textContent = monthText(duration);
    $("endResult").textContent = remaining > 0 ? monthFmt.format(end) : "vyčerpáno";
    $("targetMonthlyResult").textContent = czk(targetMonthly);
    $("monthsToThreeResult").textContent = monthText(monthsToThree);

    let status = "Vyrovnané čerpání";
    let title = "Toto nastavení je vyrovnané";
    let text = "Měsíční částka rozkládá rodičovský příspěvek relativně rozumně a může dobře zapadnout do rodinného rozpočtu.";
    let next = "Porovnejte variantu s plánem návratu do práce, čistou mzdou a pravidelnými výdaji domácnosti.";

    if(remaining <= 0){
      status = "Rodičák je vyčerpaný";
      title = "Podle zadání už nezbývá co čerpat";
      text = "Už vyčerpaná částka je stejná nebo vyšší než celkový nárok. Zkontrolujte vstupy.";
      next = "Ověřte skutečný zůstatek v podkladech z Úřadu práce.";
    } else if(monthly > limit){
      status = "Nad orientačním limitem";
      title = "Zadaná měsíční částka je nad limitem";
      text = `Zadané čerpání ${czk(monthly)} je vyšší než orientační limit ${czk(limit)}. Pokud máte vyšší limit podle DVZ, upravte pole limitu.`;
      next = "Ověřte limit podle denního vyměřovacího základu a případně přepočítejte scénář.";
    } else if(monthsToThree > 0 && duration < monthsToThree * 0.55){
      status = "Rychlé čerpání";
      title = "Čerpání je rychlé";
      text = "Měsíčně dostanete více peněz, ale rodičovský příspěvek skončí výrazně dříve. Hodí se hlavně při plánovaném návratu do práce nebo jiném příjmu.";
      next = "Zvažte, zda budete mít po vyčerpání rodičáku dostatečný příjem nebo rezervu.";
    } else if(monthsToThree > 0 && duration > monthsToThree * 1.18){
      status = "Pomalé čerpání";
      title = "Čerpání je spíš pomalé";
      text = "Rodičovský příspěvek je rozložený na delší dobu. Měsíční částka může být nízká vůči běžným výdajům domácnosti.";
      next = "Zkuste spočítat částku potřebnou do cílového data nebo do 3 let dítěte.";
    }

    $("statusPill").textContent = status;
    $("decisionTitle").textContent = title;
    $("decisionText").textContent = text;
    $("nextActionText").textContent = next;

    const balancedAmount = monthsToThree > 0 ? Math.min(limit, Math.max(1, remaining / monthsToThree)) : Math.min(limit, monthly);
    const variants = [
      makeVariant("Rychlejší", Math.min(limit, monthly * 1.35), remaining, today, monthsToThree || targetMonths, limit),
      makeVariant("Vyrovnaná", balancedAmount, remaining, today, monthsToThree || targetMonths, limit),
      makeVariant("Delší", Math.max(1, Math.min(limit, monthly * 0.72)), remaining, today, monthsToThree || targetMonths, limit),
      makeVariant("Do cíle", Math.min(limit, targetMonthly), remaining, today, targetMonths, limit)
    ];

    let bestIndex = 0;
    let bestDistance = Infinity;
    variants.forEach((v, i) => {
      const ref = monthsToThree || targetMonths;
      const dist = Math.abs(v.months - ref);
      if(v.score >= 1 && dist < bestDistance){ bestIndex = i; bestDistance = dist; }
    });

    $("variantBody").innerHTML = variants.map((v, i) => `
      <tr class="${i === bestIndex ? "is-best" : ""}">
        <td><strong>${v.label}${i === bestIndex ? " · doporučeno" : ""}</strong></td>
        <td>${czk(v.amount)}</td>
        <td>${monthText(v.months)}</td>
        <td>${remaining > 0 ? monthFmt.format(v.end) : "—"}</td>
        <td>${v.rating}</td>
      </tr>
    `).join("");
  }

  inputs.forEach(input => input.addEventListener("input", calculate));
  modeBtns.forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.mode)));
  typeBtns.forEach(btn => btn.addEventListener("click", () => setType(btn.dataset.type)));

  calculate();
})();
