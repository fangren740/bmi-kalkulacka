(() => {
  "use strict";
  const doc = document;
  const $ = (id) => doc.getElementById(id);
  const form = $("ledForm");
  if (!form) return;
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 1 });
  const money = (v) => `${new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 }).format(Number.isFinite(v) ? v : 0)} Kč`;
  const kwh = (v) => `${nf.format(Number.isFinite(v) ? v : 0)} kWh`;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const numericIds = ["oldPower","ledPower","count","hoursDay","priceKwh","daysYear","ledPrice","budget","installCost","oldResidual","oldLampPrice","oldLife","ledLife","replacementLabor","horizon","priceGrowth","discount","degradation"];
  let mode = "basic";
  let step = 0;
  let lastResult = null;

  function parseLocalized(value) {
    const cleaned = String(value ?? "").replace(/[\s\u00a0]/g, "").replace(",", ".").replace(/[^0-9.+-]/g, "");
    const n = Number.parseFloat(cleaned);
    return Number.isFinite(n) ? n : 0;
  }
  function read(id) {
    const el = $(id); if (!el) return 0;
    const min = el.dataset.min !== undefined ? parseLocalized(el.dataset.min) : -Infinity;
    const max = el.dataset.max !== undefined ? parseLocalized(el.dataset.max) : Infinity;
    return clamp(parseLocalized(el.value), min, max);
  }
  function formatInput(id) {
    const el = $(id); if (!el) return;
    const decimals = ["oldPower","ledPower","hoursDay","priceKwh","priceGrowth","discount","degradation"].includes(id) ? 2 : 0;
    el.value = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: decimals }).format(read(id));
  }
  function collect() {
    const values = Object.fromEntries(numericIds.map(id => [id, read(id)]));
    if (mode === "basic") {
      values.installCost = 0;
      values.oldResidual = 0;
      values.oldLampPrice = 0;
      values.oldLife = 1000;
      values.ledLife = 15000;
      values.replacementLabor = 0;
      values.horizon = 10;
      values.priceGrowth = 0;
      values.discount = 0;
    }
    return values;
  }
  function calculate(v, hoursMultiplier = 1) {
    const hoursYear = v.hoursDay * hoursMultiplier * v.daysYear;
    const oldKwh = v.oldPower / 1000 * v.count * hoursYear;
    const ledKwh = v.ledPower / 1000 * v.count * hoursYear;
    const savingKwh = Math.max(0, oldKwh - ledKwh);
    const energySaving = savingKwh * v.priceKwh;
    const investment = Math.max(0, v.ledPrice * v.count + v.installCost - v.oldResidual);
    const oldReplacementAnnual = mode === "advanced" && v.oldLife > 0 ? (hoursYear / v.oldLife) * v.count * (v.oldLampPrice + v.replacementLabor) : 0;
    const ledReplacementAnnual = mode === "advanced" && v.ledLife > 0 ? (hoursYear / v.ledLife) * v.count * (v.ledPrice + v.replacementLabor) : 0;
    const maintenanceSaving = Math.max(0, oldReplacementAnnual - ledReplacementAnnual);
    const annualBenefit = energySaving + maintenanceSaving;
    const paybackMonths = annualBenefit > 0 ? investment / annualBenefit * 12 : Infinity;
    let npv = -investment;
    let cumulative = -investment;
    let permanentPayback = investment <= 0 ? 0 : Infinity;
    let lastNegativeYear = investment > 0 ? 0 : -1;
    for (let year = 1; year <= Math.max(1, Math.round(v.horizon)); year++) {
      const growth = Math.pow(1 + v.priceGrowth / 100, year - 1);
      const benefit = energySaving * growth + maintenanceSaving;
      cumulative += benefit;
      npv += benefit / Math.pow(1 + v.discount / 100, year);
      if (cumulative < 0) lastNegativeYear = year;
    }
    if (Number.isFinite(paybackMonths)) permanentPayback = paybackMonths;
    const savingPercent = v.oldPower > 0 ? clamp((v.oldPower - v.ledPower) / v.oldPower * 100, 0, 100) : 0;
    return { ...v, hoursYear, oldKwh, ledKwh, savingKwh, energySaving, investment, oldReplacementAnnual, ledReplacementAnnual, maintenanceSaving, annualBenefit, paybackMonths: permanentPayback, npv, cumulative, savingPercent };
  }
  function setText(id, text) { const el = $(id); if (el) el.textContent = text; }
  function decision(r) {
    if (r.ledPower >= r.oldPower) return ["Bez energetické úspory", "Nová varianta nemá nižší příkon. Ověřte zadané hodnoty a srovnatelný světelný tok."];
    if (!Number.isFinite(r.paybackMonths)) return ["Návratnost nelze určit", "Roční přínos je nulový. Zkontrolujte dobu svícení, cenu elektřiny a příkon."];
    if (r.paybackMonths <= 12) return ["Velmi rychlá návratnost", `Investice se v modelu vrátí přibližně za ${Math.max(1, Math.round(r.paybackMonths))} měsíců. Výměna patří mezi silné kandidáty.`];
    if (r.paybackMonths <= 36) return ["Dobrá ekonomika", `Návratnost vychází přibližně na ${Math.round(r.paybackMonths)} měsíců. Ověřte hlavně kvalitu LED a reálné hodiny provozu.`];
    return ["Pomalejší návratnost", `Návratnost je přibližně ${Math.round(r.paybackMonths)} měsíců. Prioritu mohou mít světla s delší dobou svícení.`];
  }
  function renderBreakdown(r) {
    const rows = [
      ["Původní spotřeba", kwh(r.oldKwh), `${nf.format(r.hoursYear)} hodin provozu ročně`],
      ["Spotřeba LED", kwh(r.ledKwh), `${r.count} světel po ${nf.format(r.ledPower)} W`],
      ["Úspora elektřiny", kwh(r.savingKwh), `${nf.format(r.savingPercent)} % proti původnímu příkonu`],
      ["Úspora energie v penězích", money(r.energySaving), `${nf.format(r.priceKwh)} Kč/kWh`],
      ["Úspora na výměnách", money(r.maintenanceSaving), mode === "advanced" ? "odhad podle životnosti" : "v rychlém režimu se nepočítá"],
      ["Čistá investice", money(r.investment), "LED, montáž a případná zbytková hodnota"],
    ];
    const wrap = $("breakdownList");
    if (!wrap) return;
    wrap.replaceChildren(...rows.map(([name, amount, note]) => {
      const row = doc.createElement("div"); row.className = "breakdown-row";
      const copy = doc.createElement("div");
      const strong = doc.createElement("strong"); strong.textContent = name;
      const small = doc.createElement("small"); small.textContent = note;
      const b = doc.createElement("b"); b.textContent = amount;
      copy.append(strong, small); row.append(copy, b); return row;
    }));
  }
  function render() {
    const v = collect();
    const errors = [];
    if (v.oldPower <= 0 || v.ledPower <= 0) errors.push("Příkon musí být vyšší než nula.");
    if (v.count < 1) errors.push("Zadejte alespoň jedno světlo.");
    if (v.hoursDay < 0 || v.hoursDay > 24) errors.push("Doba svícení musí být mezi 0 a 24 hodinami.");
    setText("formStatus", errors.join(" "));
    if (errors.length) return;
    const r = calculate(v); lastResult = r;
    const [title, text] = decision(r);
    setText("modeLabel", mode === "advanced" ? "Podrobný model" : "Rychlý odhad");
    setText("annualSaving", `${money(r.annualBenefit)}/rok`);
    setText("annualKwh", `${kwh(r.savingKwh)} ročně`);
    setText("payback", Number.isFinite(r.paybackMonths) ? `${Math.max(0, Math.round(r.paybackMonths))} měs.` : "nelze určit");
    setText("investment", money(r.investment));
    setText("savingPercent", `${nf.format(r.savingPercent)} %`);
    setText("horizonBenefit", money(r.npv));
    setText("horizonLabel", `současná hodnota za ${Math.round(v.horizon)} let`);
    setText("statusBadge", title);
    setText("decisionTitle", title);
    setText("decisionText", text);
    setText("resultSummary", `Původní osvětlení spotřebuje ${kwh(r.oldKwh)} ročně, LED ${kwh(r.ledKwh)}. Rozdíl je ${kwh(r.savingKwh)}.`);
    if (v.budget > 0) {
      const diff = v.budget - r.investment;
      setText("budgetResult", diff >= 0 ? `Zbývá ${money(diff)}` : `Chybí ${money(Math.abs(diff))}`);
      setText("budgetText", diff >= 0 ? "Zadaný limit pokrývá investici." : "Limit nepokrývá celou investici do LED a montáže.");
    } else { setText("budgetResult", "Limit nebyl zadán"); setText("budgetText", "Doplňte nepovinný limit a uvidíte, zda pokrývá celou investici."); }
    const bar = $("paybackBar"); if (bar) bar.style.width = `${Number.isFinite(r.paybackMonths) ? clamp(100 - r.paybackMonths / 60 * 100, 4, 100) : 4}%`;
    setText("paybackTrackText", Number.isFinite(r.paybackMonths) ? `${Math.round(r.paybackMonths)} měsíců` : "bez návratnosti");
    const low = calculate(v, .5), high = calculate(v, 1.5);
    setText("scenarioLow", money(low.annualBenefit)); setText("scenarioCurrent", money(r.annualBenefit)); setText("scenarioHigh", money(high.annualBenefit));
    setText("heroSaving", `${money(r.annualBenefit)}/rok`); setText("heroCaption", `${r.count} světel, ${nf.format(r.hoursDay)} hodiny denně.`); setText("heroOldW", `${nf.format(r.oldPower)} W`); setText("heroLedW", `${nf.format(r.ledPower)} W`); setText("heroKwh", kwh(r.savingKwh)); setText("heroPayback", Number.isFinite(r.paybackMonths) ? `${Math.round(r.paybackMonths)} měs.` : "—"); setText("heroTenYears", money(r.npv));
    renderBreakdown(r);
  }
  function setMode(next) {
    mode = next === "advanced" ? "advanced" : "basic";
    doc.querySelectorAll(".mode-btn").forEach(btn => { const active = btn.dataset.mode === mode; btn.classList.toggle("is-active", active); btn.setAttribute("aria-pressed", String(active)); });
    const panel = $("advancedPanel"); if (panel) panel.hidden = mode !== "advanced";
    render();
  }
  function setStep(index) {
    const stages = [...doc.querySelectorAll("[data-stage]")];
    step = clamp(Number(index) || 0, 0, stages.length - 1);
    stages.forEach((stage, i) => stage.hidden = i !== step);
    doc.querySelectorAll(".step").forEach((btn, i) => btn.classList.toggle("is-active", i === step));
    $("prevStep").disabled = step === 0; $("nextStep").disabled = step === stages.length - 1;
    $("nextStep").textContent = step === stages.length - 1 ? "Vše hotovo" : "Další krok →";
    setText("stepStatus", `Krok ${step + 1} ze ${stages.length}`);
  }
  function preset(name) {
    const values = {
      classic: { oldPower:60, ledPower:8, count:8, hoursDay:4, daysYear:365 },
      halogen: { oldPower:42, ledPower:6, count:6, hoursDay:3, daysYear:365 },
      spots: { oldPower:35, ledPower:5, count:10, hoursDay:3, daysYear:365 },
      office: { oldPower:36, ledPower:18, count:20, hoursDay:10, daysYear:250 },
    }[name];
    if (!values) return;
    Object.entries(values).forEach(([id, value]) => { $(id).value = value; formatInput(id); });
    doc.querySelectorAll(".preset-chip").forEach(btn => btn.classList.toggle("is-active", btn.dataset.preset === name));
    render();
  }
  function shareUrl() {
    const url = new URL(location.href); url.search = "";
    numericIds.forEach(id => url.searchParams.set(id, String(read(id))));
    url.searchParams.set("rezim", mode); return url.toString();
  }
  function loadUrl() {
    const params = new URLSearchParams(location.search);
    numericIds.forEach(id => { if (params.has(id) && $(id)) { $(id).value = params.get(id); formatInput(id); } });
    mode = params.get("rezim") === "advanced" ? "advanced" : "basic";
  }
  async function copy(value, message) {
    try { await navigator.clipboard.writeText(value); setText("copyStatus", message); }
    catch { setText("copyStatus", "Kopírování se nepodařilo. Použijte adresní řádek prohlížeče."); }
  }
  function resultText() {
    if (!lastResult) return "";
    const r = lastResult;
    return `LED kalkulačka – RychléVýpočty.cz\nRoční úspora: ${money(r.annualBenefit)}\nÚspora energie: ${kwh(r.savingKwh)}\nInvestice: ${money(r.investment)}\nNávratnost: ${Number.isFinite(r.paybackMonths) ? Math.round(r.paybackMonths)+" měsíců" : "nelze určit"}\nVýsledek je orientační.`;
  }
  function reset() {
    form.reset(); numericIds.forEach(formatInput); mode = "basic"; setStep(0); setMode("basic"); setText("copyStatus", "");
  }
  form.addEventListener("submit", e => { e.preventDefault(); render(); });
  numericIds.forEach(id => { const el = $(id); if (!el) return; el.addEventListener("input", render); el.addEventListener("change", render); el.addEventListener("blur", () => { formatInput(id); render(); }); });
  doc.querySelectorAll(".mode-btn").forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.mode)));
  doc.querySelectorAll(".step").forEach(btn => btn.addEventListener("click", () => setStep(Number(btn.dataset.step))));
  doc.querySelectorAll(".preset-chip").forEach(btn => btn.addEventListener("click", () => preset(btn.dataset.preset)));
  $("prevStep").addEventListener("click", () => setStep(step - 1)); $("nextStep").addEventListener("click", () => setStep(step + 1));
  $("toggleBreakdown").addEventListener("click", e => { const wrap = $("breakdownWrap"); const collapsed = wrap.classList.toggle("is-collapsed"); e.currentTarget.setAttribute("aria-expanded", String(!collapsed)); e.currentTarget.textContent = collapsed ? "Zobrazit detail" : "Skrýt detail"; });
  $("copyResult").addEventListener("click", () => copy(resultText(), "Výsledek byl zkopírován."));
  $("copyLink").addEventListener("click", () => copy(shareUrl(), "Odkaz s nastavením byl zkopírován."));
  $("resetBtn").addEventListener("click", reset);
  loadUrl(); numericIds.forEach(formatInput); setStep(0); setMode(mode); render();
})();
