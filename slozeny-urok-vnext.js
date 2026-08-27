(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const form = $("compoundForm");
  if (!form) return;
  const nf0 = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const money = (n) => Number.isFinite(n) ? `${nf0.format(Math.round(n))} Kč` : "—";
  const compact = (n) => {
    if (!Number.isFinite(n)) return "—";
    const a = Math.abs(n);
    if (a >= 1e6) return `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 }).format(n / 1e6)} mil. Kč`;
    if (a >= 1e3) return `${nf0.format(Math.round(n / 1000))} tis. Kč`;
    return money(n);
  };
  const pct = (n) => `${nf1.format(n)} %`;
  const parse = (id) => {
    const raw = String($(id).value ?? "").trim().replace(/\s+/g, "").replace(",", ".");
    return raw === "" ? NaN : Number(raw);
  };
  const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };

  function read() {
    return {
      initial: parse("initialDeposit"), monthly: parse("monthlyContribution"), rate: parse("annualRate"), years: parse("years"),
      annualFee: parse("annualFee"), entryFee: parse("entryFee"), inflation: parse("inflationRate"), growth: parse("contributionGrowth"),
      timing: $("contributionTiming").value
    };
  }
  function validate(v) {
    if (![v.initial, v.monthly, v.rate, v.years, v.annualFee, v.entryFee, v.inflation, v.growth].every(Number.isFinite)) return "Vyplňte všechna pole platnými čísly.";
    if (v.initial < 0 || v.monthly < 0 || (v.initial === 0 && v.monthly === 0)) return "Zadejte kladnou počáteční částku nebo měsíční vklad.";
    if (v.initial > 1e10 || v.monthly > 1e8) return "Zadaná částka je mimo podporovaný rozsah modelu.";
    if (v.rate <= -99 || v.rate > 100) return "Modelové zhodnocení musí být větší než −99 % a nejvýše 100 % ročně.";
    if (!Number.isInteger(v.years) || v.years < 1 || v.years > 60) return "Doba musí být celé číslo od 1 do 60 let.";
    if (v.annualFee < 0 || v.annualFee > 20) return "Průběžný poplatek zadejte v rozsahu 0–20 % ročně.";
    if (v.entryFee < 0 || v.entryFee >= 100) return "Poplatek z vkladu musí být od 0 % do méně než 100 %.";
    if (v.inflation < 0 || v.inflation > 50) return "Inflaci zadejte v rozsahu 0–50 % ročně.";
    if (v.growth < -50 || v.growth > 100) return "Roční změna měsíčního vkladu musí být mezi −50 % a 100 %.";
    return "";
  }
  function simulate(v, opts = {}) {
    const years = opts.years ?? v.years;
    const rate = opts.rate ?? v.rate;
    const monthlyBase = opts.monthly ?? v.monthly;
    const ignoreFees = Boolean(opts.ignoreFees);
    const months = years * 12;
    const grossFactor = Math.pow(1 + rate / 100, 1 / 12);
    const feeFactor = ignoreFees ? 1 : Math.pow(1 + v.annualFee / 100, 1 / 12);
    const netDepositFactor = ignoreFees ? 1 : 1 - v.entryFee / 100;
    let balance = v.initial * netDepositFactor;
    let grossDeposits = v.initial;
    const yearly = [{ year: 0, balance, grossDeposits }];
    for (let m = 1; m <= months; m++) {
      const yrIndex = Math.floor((m - 1) / 12);
      const grossContribution = monthlyBase * Math.pow(1 + v.growth / 100, yrIndex);
      const netContribution = grossContribution * netDepositFactor;
      if (v.timing === "beginning") { balance += netContribution; grossDeposits += grossContribution; }
      balance *= grossFactor;
      balance /= feeFactor;
      if (v.timing === "end") { balance += netContribution; grossDeposits += grossContribution; }
      if (!Number.isFinite(balance) || balance > 1e16) return { balance: NaN, grossDeposits: NaN, yearly: [] };
      if (m % 12 === 0) yearly.push({ year: m / 12, balance, grossDeposits });
    }
    return { balance, grossDeposits, growthValue: balance - grossDeposits, yearly, years, rate };
  }
  function requiredMonthly(v, target) {
    if (!Number.isFinite(target) || target <= 0) return null;
    if (simulate(v, { monthly: 0 }).balance >= target) return 0;
    let lo = 0, hi = Math.max(v.monthly, 100);
    for (let i = 0; i < 70 && simulate(v, { monthly: hi }).balance < target; i++) {
      hi *= 2;
      if (hi > 1e9) return null;
    }
    for (let i = 0; i < 70; i++) {
      const mid = (lo + hi) / 2;
      if (simulate(v, { monthly: mid }).balance >= target) hi = mid; else lo = mid;
    }
    return hi;
  }
  function renderLadder(v) {
    const holder = $("timeLadder"); holder.replaceChildren();
    [5, 10, 20, 30].forEach((yr) => {
      const r = simulate(v, { years: yr });
      const positiveGrowth = Math.max(0, r.growthValue);
      const ownPct = r.balance > 0 ? clamp(r.grossDeposits / r.balance * 100, 0, 100) : 100;
      const growthPct = r.balance > 0 ? clamp(positiveGrowth / r.balance * 100, 0, 100) : 0;
      const article = document.createElement("article"); article.className = "cmp71-ladder-card";
      article.innerHTML = `<span>${yr} LET</span><strong>${compact(r.balance)}</strong><p>vloženo ${compact(r.grossDeposits)}</p><div class="cmp71-ladder-mini"><div><i style="width:${ownPct.toFixed(2)}%"></i><b style="width:${growthPct.toFixed(2)}%"></b></div><small><span>vklady ${nf1.format(ownPct)} %</span><span>výnos ${nf1.format(growthPct)} %</span></small></div><em>${yr}</em>`;
      holder.append(article);
    });
  }
  function renderScenarios(v) {
    const holder = $("scenarioCards"); holder.replaceChildren();
    const configs = [
      { label: "Nižší scénář", rate: Math.max(-98, v.rate - 2), cls: "" },
      { label: "Vaše zadání", rate: v.rate, cls: "is-base" },
      { label: "Vyšší scénář", rate: Math.min(100, v.rate + 2), cls: "" }
    ];
    configs.forEach((c) => {
      const r = simulate(v, { rate: c.rate });
      const article = document.createElement("article"); article.className = `cmp71-scenario ${c.cls}`.trim();
      article.innerHTML = `<span>${c.label.toUpperCase()}</span><strong>${compact(r.balance)}</strong><p>${pct(c.rate)} p. a. · ${v.years} let</p><small>vlastní vklady ${compact(r.grossDeposits)}</small>`;
      holder.append(article);
    });
  }
  function resultNarrative(result) {
    if (result.growthValue <= 0) return ["Modelový výnos zatím nepřevýšil vklady.", "Při záporném nebo nízkém čistém scénáři může být konečná hodnota blízko vlastním vkladům nebo pod nimi."];
    const share = result.growthValue / result.balance * 100;
    if (share >= 60) return ["V tomto modelu už dominuje čas.", "Více než 60 % konečné hodnoty tvoří modelové zhodnocení. Výsledek je proto velmi citlivý na sazbu a průběžné náklady."];
    if (share >= 50) return ["Čas už převažuje nad vlastními vklady.", "Modelové zhodnocení tvoří více než polovinu konečné hodnoty. Nižší výnos nebo vyšší poplatky tento poměr mohou výrazně změnit."];
    return ["Vlastní vklady jsou zatím hlavní složkou.", "S delším horizontem roste prostor pro složené zhodnocení, ale výsledek zůstává závislý na skutečně dosaženém výnosu."];
  }
  function update() {
    const v = read(); const err = validate(v);
    $("formError").hidden = !err; $("formError").textContent = err;
    if (err) return false;
    const r = simulate(v); const noFee = simulate(v, { ignoreFees: true });
    if (!Number.isFinite(r.balance)) { $("formError").hidden = false; $("formError").textContent = "Tato kombinace vytváří příliš vysoké hodnoty. Snižte sazbu, částku nebo horizont."; return false; }
    const positiveGrowth = Math.max(0, r.growthValue);
    const ownPct = r.balance > 0 ? clamp(r.grossDeposits / r.balance * 100, 0, 100) : 100;
    const growthPct = r.balance > 0 ? clamp(positiveGrowth / r.balance * 100, 0, 100) : 0;
    set("resultYears", v.years); set("resultBadge", `Model ${nf1.format(v.rate)} %`); set("futureValue", money(r.balance));
    set("ownDeposits", money(r.grossDeposits)); set("modelGrowth", money(r.growthValue)); set("growthShare", `${nf1.format(r.balance > 0 ? r.growthValue / r.balance * 100 : 0)} %`);
    set("resultSentence", `Z toho ${money(r.grossDeposits)} jsou vaše vlastní hrubé vklady.`); $("ownBar").style.width = `${ownPct}%`; $("growthBar").style.width = `${growthPct}%`;
    set("feeDrag", money(Math.max(0, noFee.balance - r.balance)));
    if (v.inflation > 0) { set("realValue", money(r.balance / Math.pow(1 + v.inflation / 100, v.years))); set("realValueNote", `v dnešní kupní síle při inflaci ${nf1.format(v.inflation)} %`); }
    else { set("realValue", "—"); set("realValueNote", "zapněte inflaci v nastavení"); }
    const [title, text] = resultNarrative(r); set("resultNoteTitle", title); set("resultNoteText", text);
    set("advancedSummary", `poplatky ${nf1.format(v.annualFee)} % p. a. · inflace ${v.inflation > 0 ? `${nf1.format(v.inflation)} %` : "vypnutá"}`);
    renderLadder(v); renderScenarios(v); renderGoal(v, r); return true;
  }
  function renderGoal(v, current) {
    const target = parse("targetAmount");
    if (!Number.isFinite(target) || target <= 0) { set("requiredMonthly", "—"); set("goalText", "Zadejte kladnou cílovou částku."); set("goalStatus", "Cíl není platný"); set("goalGap", "—"); return; }
    const req = requiredMonthly(v, target); const gap = current.balance - target;
    set("requiredMonthly", req === null ? "Mimo rozsah" : money(req));
    set("goalText", `Při stejných předpokladech a ${v.years}letém horizontu.`);
    set("goalGap", `${gap >= 0 ? "+" : "−"}${money(Math.abs(gap))}`);
    if (gap >= 0) set("goalStatus", "Současný plán cíl překračuje");
    else if (Math.abs(gap) / target <= .08) set("goalStatus", "Současný plán je blízko cíli");
    else set("goalStatus", "Současný plán je pod cílem");
  }

  form.addEventListener("submit", (e) => { e.preventDefault(); update(); if (matchMedia("(max-width:880px)").matches) $("vysledek").scrollIntoView({ behavior: "smooth", block: "start" }); });
  ["initialDeposit","monthlyContribution","annualRate","years","annualFee","entryFee","inflationRate","contributionGrowth","contributionTiming"].forEach((id) => { const el = $(id); el.addEventListener("input", update); el.addEventListener("change", update); });
  $("targetAmount").addEventListener("input", update); $("targetAmount").addEventListener("change", update);
  $("resetBtn").addEventListener("click", () => {
    $("initialDeposit").value = "100000"; $("monthlyContribution").value = "3000"; $("annualRate").value = "7"; $("years").value = "20"; $("annualFee").value = "0"; $("entryFee").value = "0"; $("inflationRate").value = "0"; $("contributionGrowth").value = "0"; $("contributionTiming").value = "end"; $("targetAmount").value = "2000000"; $("formError").hidden = true; update();
  });
  $("copyBtn").addEventListener("click", async () => {
    const text = `Složený úrok: budoucí hodnota ${$("futureValue").textContent}; vlastní vklady ${$("ownDeposits").textContent}; modelový výnos ${$("modelGrowth").textContent}; horizont ${$("resultYears").textContent} let.`;
    try { await navigator.clipboard.writeText(text); $("copyBtn").textContent = "Zkopírováno"; setTimeout(() => $("copyBtn").textContent = "Zkopírovat stručný výsledek", 1400); } catch (_) { $("copyBtn").textContent = "Kopírování není dostupné"; }
  });
  const menu = $("menuBtn"), mobile = $("mobile-nav");
  if (menu && mobile) { menu.addEventListener("click", () => { const on = menu.getAttribute("aria-expanded") === "true"; menu.setAttribute("aria-expanded", String(!on)); mobile.classList.toggle("is-open", !on); }); document.addEventListener("keydown", (e) => { if (e.key === "Escape") { menu.setAttribute("aria-expanded", "false"); mobile.classList.remove("is-open"); } }); }
  update();
})();
