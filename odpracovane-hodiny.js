(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const form = $("workedHoursForm");
  const template = $("shiftBlockTemplate");
  const blocksRoot = $("shiftBlocks");
  const intf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });

  const ids = [
    "heroStart", "heroEnd", "heroGross", "heroBreak", "heroShift", "heroCount", "heroTotal", "heroNote",
    "railStart", "railEnd", "railGross", "railBreak", "railNet",
    "inlineGross", "inlineBreak", "inlineNet",
    "statusBadge", "resultTotal", "resultSummary", "resultGross", "resultBreaks", "ledgerNet",
    "resultAverage", "resultNight", "resultCount", "resultDifference", "fundInterpretation", "fundNeedle",
    "qualityScore", "qualityList", "anatomyStart", "anatomyGross", "anatomyBreak", "anatomyNet"
  ];
  const out = Object.fromEntries(ids.map((id) => [id, $(id)]));

  let mode = "basic";
  let lastResult = null;

  function setText(node, value) {
    if (node) node.textContent = value;
  }

  function parseNumber(value) {
    const normalized = String(value ?? "").trim().replace(/\s+/g, "").replace(",", ".");
    if (!normalized) return null;
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
  }

  function timeToMinutes(value) {
    if (!/^\d{2}:\d{2}$/.test(String(value))) return null;
    const [hours, minutes] = value.split(":").map(Number);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    return hours * 60 + minutes;
  }

  function duration(startValue, endValue) {
    const start = timeToMinutes(startValue);
    const endRaw = timeToMinutes(endValue);
    if (start === null || endRaw === null || start === endRaw) return null;
    const end = endRaw <= start ? endRaw + 1440 : endRaw;
    return { start, end, gross: end - start, crossesMidnight: endRaw <= start };
  }

  function overlap(aStart, aEnd, bStart, bEnd) {
    return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
  }

  function nightMinutes(start, end) {
    let total = 0;
    for (let day = -1; day <= 2; day += 1) {
      total += overlap(start, end, day * 1440 + 1320, day * 1440 + 1800);
    }
    return total;
  }

  function formatHours(minutes, compact = false) {
    const safe = Math.max(0, Math.round(minutes));
    const hours = Math.floor(safe / 60);
    const mins = safe % 60;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${intf.format(hours)} h`;
    if (compact) return `${intf.format(hours)} h ${mins} min`;
    return `${intf.format(hours)} h ${mins} min`;
  }

  function formatSignedHours(minutes) {
    const rounded = Math.round(minutes);
    const sign = rounded > 0 ? "+" : rounded < 0 ? "−" : "";
    return `${sign}${formatHours(Math.abs(rounded), true)}`;
  }

  function countLabel(count) {
    if (count === 1) return "1 směna";
    if (count >= 2 && count <= 4) return `${count} směny`;
    return `${count} směn`;
  }

  function clearErrors() {
    document.querySelectorAll(".field.has-error").forEach((field) => field.classList.remove("has-error"));
    document.querySelectorAll("[aria-invalid=\"true\"]").forEach((field) => field.removeAttribute("aria-invalid"));
    document.querySelectorAll(".field-error").forEach((error) => setText(error, ""));
  }

  function fieldError(id, message) {
    const input = $(id);
    const error = $(`${id}Error`);
    const field = input ? input.closest(".field") : null;
    if (field) field.classList.add("has-error");
    if (input) input.setAttribute("aria-invalid", "true");
    if (error) setText(error, message);
  }

  function basicInput() {
    return {
      start: $("startTime").value,
      end: $("endTime").value,
      breakMinutes: parseNumber($("breakMinutes").value),
      count: parseNumber($("shiftCount").value),
      fundHours: parseNumber($("targetFund").value)
    };
  }

  function validateBasic(input) {
    clearErrors();
    let ok = true;
    if (timeToMinutes(input.start) === null) { fieldError("startTime", "Zadejte platný čas začátku."); ok = false; }
    if (timeToMinutes(input.end) === null) { fieldError("endTime", "Zadejte platný čas konce."); ok = false; }
    if (input.start === input.end) { fieldError("endTime", "Stejný začátek a konec je nejednoznačný."); ok = false; }
    if (input.breakMinutes === null || input.breakMinutes < 0 || input.breakMinutes > 720) { fieldError("breakMinutes", "Zadejte pauzu od 0 do 720 minut."); ok = false; }
    if (input.count === null || !Number.isInteger(input.count) || input.count < 1 || input.count > 366) { fieldError("shiftCount", "Zadejte celé číslo od 1 do 366."); ok = false; }
    if (input.fundHours !== null && (input.fundHours < 0 || input.fundHours > 5000)) { fieldError("targetFund", "Fond musí být mezi 0 a 5 000 hodinami."); ok = false; }
    const base = duration(input.start, input.end);
    if (base && input.breakMinutes !== null && input.breakMinutes >= base.gross) { fieldError("breakMinutes", "Pauza musí být kratší než celá směna."); ok = false; }
    return ok;
  }

  function calculateBlock(block) {
    const base = duration(block.start, block.end);
    if (!base) return { valid: false, reason: "Zkontrolujte začátek a konec." };
    if (block.breakMinutes === null || block.breakMinutes < 0 || block.breakMinutes >= base.gross || block.breakMinutes > 720) return { valid: false, reason: "Pauza je mimo platný rozsah." };
    if (block.count === null || !Number.isInteger(block.count) || block.count < 1 || block.count > 366) return { valid: false, reason: "Počet směn musí být celé číslo od 1 do 366." };

    const net = base.gross - block.breakMinutes;
    const rawNight = nightMinutes(base.start, base.end);
    const nonNightGross = Math.max(0, base.gross - rawNight);
    const breakInsideNightMin = Math.max(0, block.breakMinutes - nonNightGross);
    const breakInsideNightMax = Math.min(block.breakMinutes, rawNight);
    const nightMax = Math.max(0, rawNight - breakInsideNightMin);
    const nightMin = Math.max(0, rawNight - breakInsideNightMax);

    return {
      valid: true,
      name: block.name || "Směna",
      start: block.start,
      end: block.end,
      grossPerShift: base.gross,
      breakPerShift: block.breakMinutes,
      netPerShift: net,
      nightMinPerShift: nightMin,
      nightMaxPerShift: nightMax,
      count: block.count,
      crossesMidnight: base.crossesMidnight,
      gross: base.gross * block.count,
      breaks: block.breakMinutes * block.count,
      net: net * block.count,
      nightMin: nightMin * block.count,
      nightMax: nightMax * block.count
    };
  }

  function aggregate(blocks, fundHours, sourceMode) {
    const result = blocks.reduce((sum, block) => {
      sum.gross += block.gross;
      sum.breaks += block.breaks;
      sum.net += block.net;
      sum.nightMin += block.nightMin;
      sum.nightMax += block.nightMax;
      sum.count += block.count;
      sum.maxGross = Math.max(sum.maxGross, block.grossPerShift);
      sum.minBreakForLongShift = sum.minBreakForLongShift || (block.grossPerShift > 360 && block.breakPerShift < 30);
      sum.crossesMidnight = sum.crossesMidnight || block.crossesMidnight;
      sum.overTwelve = sum.overTwelve || block.grossPerShift > 720;
      return sum;
    }, { gross: 0, breaks: 0, net: 0, nightMin: 0, nightMax: 0, count: 0, maxGross: 0, minBreakForLongShift: false, crossesMidnight: false, overTwelve: false });

    result.blocks = blocks;
    result.average = result.count ? result.net / result.count : 0;
    result.fundMinutes = fundHours === null ? null : Math.round(fundHours * 60);
    result.difference = result.fundMinutes === null ? null : result.net - result.fundMinutes;
    result.sourceMode = sourceMode;
    return result;
  }

  function calculateBasic(input) {
    const block = calculateBlock({ name: "Stejná směna", start: input.start, end: input.end, breakMinutes: input.breakMinutes, count: input.count });
    return block.valid ? aggregate([block], input.fundHours, "basic") : null;
  }

  function blockInput(article) {
    return {
      name: article.querySelector(".block-name").value.trim(),
      start: article.querySelector(".block-start").value,
      end: article.querySelector(".block-end").value,
      breakMinutes: parseNumber(article.querySelector(".block-break").value),
      count: parseNumber(article.querySelector(".block-count").value)
    };
  }

  function advancedInput() {
    return {
      blocks: Array.from(blocksRoot.querySelectorAll(".shift-block")).map(blockInput),
      fundHours: parseNumber($("advancedFund").value)
    };
  }

  function validateAdvanced(input) {
    clearErrors();
    let ok = true;
    if (input.fundHours !== null && (input.fundHours < 0 || input.fundHours > 5000)) { fieldError("advancedFund", "Fond musí být mezi 0 a 5 000 hodinami."); ok = false; }
    const articles = Array.from(blocksRoot.querySelectorAll(".shift-block"));
    input.blocks.forEach((block, index) => {
      const result = calculateBlock(block);
      const article = articles[index];
      article.classList.toggle("has-error", !result.valid);
      const note = article.querySelector(".block-note");
      if (!result.valid) {
        setText(note, result.reason);
        ok = false;
      }
    });
    return ok && input.blocks.length > 0;
  }

  function formatNightRange(result, compact = false) {
    if (Math.round(result.nightMin) === Math.round(result.nightMax)) return formatHours(result.nightMax, compact);
    return `${formatHours(result.nightMin, compact)}–${formatHours(result.nightMax, compact)}`;
  }

  function fundMessage(result) {
    if (result.fundMinutes === null) return { value: "nezadán", text: "Fond jste nezadali. Výsledek proto ukazuje pouze skutečný součet zadaných směn.", position: 50, state: "neutral" };
    if (result.difference === 0) return { value: "0 h", text: "Čistý součet se přesně shoduje se zadaným fondem. Ověřte ještě, že oba údaje patří do stejného období.", position: 50, state: "ok" };
    const absolute = Math.abs(result.difference);
    const direction = result.difference > 0 ? "nad" : "pod";
    const normalized = result.difference / Math.max(result.fundMinutes, 60);
    const position = Math.max(4, Math.min(96, 50 + normalized * 180));
    return {
      value: formatSignedHours(result.difference),
      text: `Čistý součet je ${formatHours(absolute)} ${direction} zadaným fondem. Jde o kontrolní rozdíl, ne automatický přesčas nebo absenci.`,
      position,
      state: Math.abs(result.difference) > 60 ? "warn" : "ok"
    };
  }

  function status(result) {
    if (result.overTwelve) return { label: "Ověřte délku směny", className: "is-danger" };
    if (result.minBreakForLongShift) return { label: "Ověřte režim pauzy", className: "is-warning" };
    if (result.difference !== null && Math.abs(result.difference) > 60) return { label: "Rozdíl proti fondu", className: "is-warning" };
    if (result.crossesMidnight) return { label: "Směna přes půlnoc", className: "" };
    return { label: "Vstupy vypadají konzistentně", className: "" };
  }

  function qualityItems(result) {
    const items = [];
    items.push({ state: "ok", text: `${countLabel(result.count)} se započítalo do souhrnu.` });
    items.push(result.crossesMidnight
      ? { state: "ok", text: "Přechod přes půlnoc byl započítán do následujícího dne." }
      : { state: "ok", text: "Zadané časy nevyžadují přechod přes půlnoc." });
    items.push(result.overTwelve
      ? { state: "danger", text: "Alespoň jeden hrubý interval přesahuje 12 hodin; ověřte zadání nebo zvláštní režim." }
      : { state: "ok", text: "Žádný zadaný hrubý interval nepřesahuje obecnou 12hodinovou hranici." });
    items.push(result.minBreakForLongShift
      ? { state: "warn", text: "U směny delší než 6 hodin je odečteno méně než 30 minut; ověřte skutečný režim přestávky." }
      : { state: "ok", text: "Pauza nevyvolává základní kontrolní upozornění pro směnu delší než 6 hodin." });
    return items;
  }

  function renderInvalid(message = "Opravte označené vstupy. Předchozí výsledek jsme skryli, aby nepůsobil jako aktuální.") {
    lastResult = null;
    ["heroGross", "heroBreak", "heroShift", "heroTotal", "railGross", "railBreak", "railNet", "inlineGross", "inlineBreak", "inlineNet",
      "resultTotal", "resultGross", "resultBreaks", "ledgerNet", "resultAverage", "resultNight", "resultCount", "resultDifference",
      "anatomyGross", "anatomyBreak", "anatomyNet"].forEach((id) => setText(out[id], "—"));
    setText(out.heroNote, message);
    setText(out.resultSummary, message);
    setText(out.fundInterpretation, "Po opravě vstupů se znovu zobrazí aktuální součet a porovnání s fondem.");
    setText(out.statusBadge, "Opravte vstupy");
    out.statusBadge.className = "is-danger";
    if (out.fundNeedle) out.fundNeedle.style.left = "50%";
    out.qualityList.replaceChildren();
    const li = document.createElement("li");
    li.className = "danger";
    li.textContent = "Některý vstup není platný.";
    out.qualityList.append(li);
    setText(out.qualityScore, "0 / 1");
  }

  function render(result) {
    lastResult = result;
    const first = result.blocks[0];
    const state = status(result);
    const fund = fundMessage(result);
    const summary = result.sourceMode === "basic"
      ? `${countLabel(result.count)} × ${formatHours(first.netPerShift)} čistého času = ${formatHours(result.net)} za období.`
      : `${result.blocks.length} typy směn, ${countLabel(result.count)} celkem. Průměrná čistá směna ${formatHours(result.average)}.`;

    setText(out.heroStart, result.sourceMode === "basic" ? first.start : "MIX");
    setText(out.heroEnd, result.sourceMode === "basic" ? first.end : `${result.blocks.length} typy`);
    setText(out.heroGross, result.sourceMode === "basic" ? formatHours(first.grossPerShift) : formatHours(result.gross));
    setText(out.heroBreak, result.sourceMode === "basic" ? `− ${formatHours(first.breakPerShift)}` : `− ${formatHours(result.breaks)}`);
    setText(out.heroShift, result.sourceMode === "basic" ? formatHours(first.netPerShift) : formatHours(result.average));
    setText(out.heroCount, countLabel(result.count));
    setText(out.heroTotal, formatHours(result.net));
    setText(out.heroNote, result.sourceMode === "basic"
      ? `${countLabel(result.count)} po ${formatHours(first.netPerShift)} čistého času. Fond je pouze kontrolní bod.`
      : `Součet vzniká z ${result.blocks.length} směnových bloků a ${countLabel(result.count)}.`);

    setText(out.railStart, result.sourceMode === "basic" ? first.start : "mix");
    setText(out.railEnd, result.sourceMode === "basic" ? first.end : `${result.count}×`);
    setText(out.railGross, result.sourceMode === "basic" ? formatHours(first.grossPerShift) : formatHours(result.gross));
    setText(out.railBreak, result.sourceMode === "basic" ? formatHours(first.breakPerShift) : formatHours(result.breaks));
    setText(out.railNet, result.sourceMode === "basic" ? formatHours(first.netPerShift) : formatHours(result.net));

    setText(out.inlineGross, result.sourceMode === "basic" ? formatHours(first.grossPerShift) : formatHours(result.gross));
    setText(out.inlineBreak, result.sourceMode === "basic" ? formatHours(first.breakPerShift) : formatHours(result.breaks));
    setText(out.inlineNet, result.sourceMode === "basic" ? formatHours(first.netPerShift) : formatHours(result.net));

    setText(out.statusBadge, state.label);
    out.statusBadge.className = state.className;
    setText(out.resultTotal, formatHours(result.net));
    setText(out.resultSummary, summary);
    setText(out.resultGross, formatHours(result.gross));
    setText(out.resultBreaks, `− ${formatHours(result.breaks)}`);
    setText(out.ledgerNet, formatHours(result.net));
    setText(out.resultAverage, formatHours(result.average));
    setText(out.resultNight, formatNightRange(result));
    setText(out.resultCount, intf.format(result.count));
    setText(out.resultDifference, fund.value);
    setText(out.fundInterpretation, fund.text);
    if (out.fundNeedle) out.fundNeedle.style.left = `${fund.position}%`;

    setText(out.anatomyStart, result.sourceMode === "basic" ? first.start : "mix");
    setText(out.anatomyGross, result.sourceMode === "basic" ? formatHours(first.grossPerShift) : formatHours(result.gross));
    setText(out.anatomyBreak, result.sourceMode === "basic" ? `− ${formatHours(first.breakPerShift)}` : `− ${formatHours(result.breaks)}`);
    setText(out.anatomyNet, result.sourceMode === "basic" ? formatHours(first.netPerShift) : formatHours(result.net));

    const items = qualityItems(result);
    out.qualityList.replaceChildren();
    let okCount = 0;
    items.forEach((item) => {
      const li = document.createElement("li");
      li.className = item.state === "ok" ? "" : item.state;
      li.textContent = item.text;
      out.qualityList.append(li);
      if (item.state === "ok") okCount += 1;
    });
    setText(out.qualityScore, `${okCount} / ${items.length}`);
  }

  function renderBlock(article) {
    const result = calculateBlock(blockInput(article));
    article.classList.toggle("has-error", !result.valid);
    const value = article.querySelector(".block-result");
    const note = article.querySelector(".block-note");
    if (!result.valid) {
      setText(value, "—");
      setText(note, result.reason);
      return;
    }
    setText(value, formatHours(result.net));
    const nightText = result.nightMax ? `${formatNightRange(result)} nočního času` : "bez nočního času";
    setText(note, `${countLabel(result.count)}, ${nightText}`);
  }

  function run() {
    if (mode === "basic") {
      const input = basicInput();
      if (!validateBasic(input)) { renderInvalid(); return; }
      const result = calculateBasic(input);
      if (!result) { renderInvalid(); return; }
      render(result);
      return;
    }

    const input = advancedInput();
    if (!validateAdvanced(input)) { renderInvalid(); return; }
    const blocks = input.blocks.map(calculateBlock).filter((block) => block.valid);
    if (!blocks.length) { renderInvalid(); return; }
    render(aggregate(blocks, input.fundHours, "advanced"));
  }

  function addBlock(data = {}) {
    if (blocksRoot.children.length >= 6) return;
    const fragment = template.content.cloneNode(true);
    const article = fragment.querySelector(".shift-block");
    article.querySelector(".block-name").value = data.name ?? `Směna ${blocksRoot.children.length + 1}`;
    article.querySelector(".block-start").value = data.start ?? "08:00";
    article.querySelector(".block-end").value = data.end ?? "16:30";
    article.querySelector(".block-break").value = String(data.breakMinutes ?? 30);
    article.querySelector(".block-count").value = String(data.count ?? 1);

    article.querySelectorAll("input").forEach((input) => {
      input.addEventListener("input", () => { renderBlock(article); run(); });
      input.addEventListener("change", () => { renderBlock(article); run(); });
    });
    article.querySelector(".remove-block").addEventListener("click", () => {
      if (blocksRoot.children.length <= 1) return;
      article.remove();
      run();
    });

    blocksRoot.append(article);
    renderBlock(article);
  }

  function loadDefaultBlocks() {
    blocksRoot.replaceChildren();
    addBlock({ name: "Ranní", start: "06:00", end: "14:30", breakMinutes: 30, count: 10 });
    addBlock({ name: "Odpolední", start: "14:00", end: "22:30", breakMinutes: 30, count: 5 });
    addBlock({ name: "Noční", start: "22:00", end: "06:30", breakMinutes: 30, count: 5 });
  }

  function setMode(nextMode) {
    mode = nextMode === "advanced" ? "advanced" : "basic";
    body.dataset.mode = mode;
    document.querySelectorAll(".wh-mode [data-mode]").forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.panel !== mode));
    run();
  }

  document.querySelectorAll(".wh-mode [data-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));

  document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => {
    const [start, end, pause] = button.dataset.preset.split("|");
    $("startTime").value = start;
    $("endTime").value = end;
    $("breakMinutes").value = pause;
    document.querySelectorAll("[data-preset]").forEach((item) => item.classList.toggle("is-active", item === button));
    run();
  }));

  ["startTime", "endTime", "breakMinutes", "shiftCount", "targetFund", "advancedFund"].forEach((id) => {
    const field = $(id);
    field.addEventListener("input", run);
    field.addEventListener("change", run);
  });

  $("addShiftBlock").addEventListener("click", () => { addBlock(); run(); });
  $("loadShiftExample").addEventListener("click", () => { loadDefaultBlocks(); run(); });
  form.addEventListener("submit", (event) => { event.preventDefault(); run(); });

  $("resetBtn").addEventListener("click", () => {
    $("startTime").value = "08:00";
    $("endTime").value = "16:30";
    $("breakMinutes").value = "30";
    $("shiftCount").value = "20";
    $("targetFund").value = "160";
    $("advancedFund").value = "160";
    document.querySelectorAll("[data-preset]").forEach((item) => item.classList.toggle("is-active", item.dataset.preset === "08:00|16:30|30"));
    loadDefaultBlocks();
    setMode("basic");
  });

  $("copySummary").addEventListener("click", async () => {
    if (!lastResult) return;
    const fund = fundMessage(lastResult);
    const text = [
      "Souhrn odpracovaných hodin",
      `Čistý čas: ${formatHours(lastResult.net)}`,
      `Hrubý čas: ${formatHours(lastResult.gross)}`,
      `Pauzy: ${formatHours(lastResult.breaks)}`,
      `Noční čas: ${formatNightRange(lastResult)}`,
      `Počet směn: ${lastResult.count}`,
      `Rozdíl proti fondu: ${fund.value}`,
      "Pozn.: rozdíl proti fondu není automaticky přesčas ani absence."
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setText($("copySummary"), "Souhrn zkopírován");
      window.setTimeout(() => setText($("copySummary"), "Kopírovat souhrn"), 1600);
    } catch {
      setText($("copySummary"), "Kopírování není dostupné");
      window.setTimeout(() => setText($("copySummary"), "Kopírovat souhrn"), 1600);
    }
  });

  loadDefaultBlocks();
  run();
})();
