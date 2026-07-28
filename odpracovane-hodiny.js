(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const body = document.body;
  const form = $("workedHoursForm");
  const template = $("shiftBlockTemplate");
  const blocksRoot = $("shiftBlocks");
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 2 });
  const intf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });

  const outputIds = [
    "heroTotal", "heroMode", "heroWorkBar", "heroBreakBar", "heroClock", "heroShift", "heroBreak", "heroNight", "heroNote",
    "statusBadge", "resultTotal", "resultSummary", "resultGross", "resultBreaks", "resultNight", "resultAverage", "resultDifference",
    "fundInterpretation", "fundTrack", "qualityScore", "qualityList"
  ];
  const out = Object.fromEntries(outputIds.map((id) => [id, $(id)]));

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
    if (compact && mins === 0) return `${intf.format(hours)} h`;
    if (hours === 0) return `${mins} min`;
    if (mins === 0) return `${intf.format(hours)} h`;
    return `${intf.format(hours)} h ${mins} min`;
  }

  function formatSignedHours(minutes) {
    const sign = minutes > 0 ? "+" : minutes < 0 ? "−" : "";
    return `${sign}${formatHours(Math.abs(minutes), true)}`;
  }

  function clearErrors() {
    document.querySelectorAll(".field.has-error").forEach((field) => field.classList.remove("has-error"));
    document.querySelectorAll(".field-error").forEach((error) => setText(error, ""));
  }

  function fieldError(id, message) {
    const input = $(id);
    const error = $(`${id}Error`);
    const field = input ? input.closest(".field") : null;
    if (field) field.classList.add("has-error");
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
    if (!timeToMinutes(input.start) && input.start !== "00:00") { fieldError("startTime", "Zadejte platný čas začátku."); ok = false; }
    if (!timeToMinutes(input.end) && input.end !== "00:00") { fieldError("endTime", "Zadejte platný čas konce."); ok = false; }
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
    if (block.count === null || !Number.isInteger(block.count) || block.count < 1 || block.count > 366) return { valid: false, reason: "Počet směn musí být celé číslo." };
    const net = base.gross - block.breakMinutes;
    const rawNight = nightMinutes(base.start, base.end);
    const night = Math.min(net, rawNight);
    return {
      valid: true,
      name: block.name || "Směna",
      start: block.start,
      end: block.end,
      grossPerShift: base.gross,
      breakPerShift: block.breakMinutes,
      netPerShift: net,
      nightPerShift: night,
      count: block.count,
      crossesMidnight: base.crossesMidnight,
      gross: base.gross * block.count,
      breaks: block.breakMinutes * block.count,
      net: net * block.count,
      night: night * block.count
    };
  }

  function calculateBasic(input) {
    const block = calculateBlock({ name: "Stejná směna", start: input.start, end: input.end, breakMinutes: input.breakMinutes, count: input.count });
    if (!block.valid) return null;
    return aggregate([block], input.fundHours, "basic");
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
    const blocks = Array.from(blocksRoot.querySelectorAll(".shift-block")).map(blockInput);
    return { blocks, fundHours: parseNumber($("advancedFund").value) };
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
      if (!result.valid) {
        const note = article.querySelector(".block-note");
        setText(note, result.reason);
        ok = false;
      }
    });
    return ok && input.blocks.length > 0;
  }

  function aggregate(blocks, fundHours, sourceMode) {
    const result = blocks.reduce((sum, block) => {
      sum.gross += block.gross;
      sum.breaks += block.breaks;
      sum.net += block.net;
      sum.night += block.night;
      sum.count += block.count;
      sum.maxGross = Math.max(sum.maxGross, block.grossPerShift);
      sum.minBreakForLongShift = sum.minBreakForLongShift || (block.grossPerShift > 360 && block.breakPerShift < 30);
      sum.crossesMidnight = sum.crossesMidnight || block.crossesMidnight;
      sum.overTwelve = sum.overTwelve || block.grossPerShift > 720;
      return sum;
    }, { gross: 0, breaks: 0, net: 0, night: 0, count: 0, maxGross: 0, minBreakForLongShift: false, crossesMidnight: false, overTwelve: false });
    result.blocks = blocks;
    result.average = result.count ? result.net / result.count : 0;
    result.fundMinutes = fundHours === null ? null : Math.round(fundHours * 60);
    result.difference = result.fundMinutes === null ? null : result.net - result.fundMinutes;
    result.sourceMode = sourceMode;
    return result;
  }

  function qualityItems(result) {
    const items = [];
    items.push({ state: "ok", text: `${result.count} ${result.count === 1 ? "směna" : result.count < 5 ? "směny" : "směn"} se započítalo do výsledku.` });
    if (result.crossesMidnight) items.push({ state: "ok", text: "Směna přes půlnoc byla převedena do následujícího dne." });
    else items.push({ state: "ok", text: "Časy směn nevyžadují přechod přes půlnoc." });
    if (result.overTwelve) items.push({ state: "danger", text: "Alespoň jeden blok přesahuje obecnou hranici 12 hodin směny; ověřte výjimku nebo zadání." });
    else items.push({ state: "ok", text: "Žádný zadaný blok nepřesahuje 12 hodin hrubé délky." });
    if (result.minBreakForLongShift) items.push({ state: "warn", text: "U směny delší než 6 hodin je odečteno méně než 30 minut; ověřte skutečný režim přestávky." });
    else items.push({ state: "ok", text: "Dlouhé směny mají alespoň 30 minut odečtené pauzy, nebo jsou kratší než 6 hodin." });
    return items;
  }

  function status(result) {
    if (result.overTwelve) return { label: "Ověřte délku směny", className: "is-danger" };
    if (result.minBreakForLongShift) return { label: "Ověřte režim pauzy", className: "is-warning" };
    if (result.difference !== null && Math.abs(result.difference) > 60) return { label: "Rozdíl proti fondu", className: "is-warning" };
    if (result.crossesMidnight) return { label: "Směna přes půlnoc", className: "" };
    return { label: "Vstupy působí konzistentně", className: "" };
  }

  function fundMessage(result) {
    if (result.fundMinutes === null) return { value: "nezadán", text: "Cílový fond nebyl zadán. Výsledek ukazuje pouze součet odpracovaného času.", ratio: 0, state: "neutral" };
    if (result.difference === 0) return { value: "0 h", text: "Výsledek odpovídá zadanému fondu. Přesto ověřte, že fond i směny patří do stejného období.", ratio: 50, state: "ok" };
    const absolute = Math.abs(result.difference);
    const direction = result.difference > 0 ? "nad" : "pod";
    const ratio = Math.min(100, 50 + (result.difference / Math.max(result.fundMinutes, 60)) * 100);
    const text = `Součet je ${formatHours(absolute)} ${direction} zadaným fondem. Rozdíl je kontrolní údaj, nikoli automatické určení přesčasu nebo absence.`;
    return { value: formatSignedHours(result.difference), text, ratio: Math.max(4, ratio), state: Math.abs(result.difference) > 60 ? "warn" : "ok" };
  }

  function render(result) {
    lastResult = result;
    const first = result.blocks[0];
    const basicLabel = result.sourceMode === "basic" ? `${result.count} stejných směn` : `${result.blocks.length} typy směn`;
    setText(out.heroTotal, formatHours(result.net, true));
    setText(out.heroMode, basicLabel);
    setText(out.heroClock, result.sourceMode === "basic" ? `${first.start} → ${first.end}` : "součet směnových bloků");
    setText(out.heroShift, formatHours(result.average, true));
    setText(out.heroBreak, formatHours(result.breaks, true));
    setText(out.heroNight, formatHours(result.night, true));
    setText(out.heroNote, result.sourceMode === "basic" ? `Jedna směna má ${formatHours(first.netPerShift)} čistého času. Celkem je započteno ${result.count} směn.` : `Pokročilý režim sečetl ${result.blocks.length} směnové bloky a ${result.count} směn.`);
    const grossShare = result.gross > 0 ? result.net / result.gross * 100 : 0;
    const breakShare = result.gross > 0 ? result.breaks / result.gross * 100 : 0;
    out.heroWorkBar.style.width = `${Math.max(0, Math.min(100, grossShare))}%`;
    out.heroBreakBar.style.width = `${Math.max(0, Math.min(100, breakShare))}%`;

    const state = status(result);
    setText(out.statusBadge, state.label);
    out.statusBadge.className = state.className;
    setText(out.resultTotal, formatHours(result.net));
    setText(out.resultSummary, result.sourceMode === "basic" ? `${result.count} směn po ${formatHours(first.netPerShift)} po odečtení ${first.breakPerShift}minutové pauzy.` : `${result.blocks.length} typy směn, celkem ${result.count} směn a průměr ${formatHours(result.average)} čistého času.`);
    setText(out.resultGross, formatHours(result.gross));
    setText(out.resultBreaks, formatHours(result.breaks));
    setText(out.resultNight, formatHours(result.night));
    setText(out.resultAverage, formatHours(result.average));

    const fund = fundMessage(result);
    setText(out.resultDifference, fund.value);
    setText(out.fundInterpretation, fund.text);
    out.fundTrack.style.width = `${fund.ratio}%`;
    out.fundTrack.style.background = fund.state === "warn" ? "linear-gradient(90deg,#f1a826,#ffd17d)" : "linear-gradient(90deg,#44d7a8,#9ae5cd)";

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
    const data = blockInput(article);
    const result = calculateBlock(data);
    article.classList.toggle("has-error", !result.valid);
    const value = article.querySelector(".block-result");
    const note = article.querySelector(".block-note");
    if (!result.valid) {
      setText(value, "—");
      setText(note, result.reason);
      return;
    }
    setText(value, formatHours(result.net));
    const nightText = result.night ? `${formatHours(result.night)} nočního času` : "bez nočního času";
    setText(note, `${result.count} ${result.count === 1 ? "směna" : result.count < 5 ? "směny" : "směn"}, ${nightText}`);
  }

  function run() {
    if (mode === "basic") {
      const input = basicInput();
      if (!validateBasic(input)) return;
      const result = calculateBasic(input);
      if (result) render(result);
      return;
    }
    const input = advancedInput();
    if (!validateAdvanced(input)) return;
    const blocks = input.blocks.map(calculateBlock).filter((block) => block.valid);
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
    mode = nextMode;
    body.dataset.mode = mode;
    document.querySelectorAll("[data-mode]").forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => panel.classList.toggle("is-hidden", panel.dataset.panel !== mode));
    run();
  }

  document.querySelectorAll("[data-mode]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
  document.querySelectorAll("[data-preset]").forEach((button) => button.addEventListener("click", () => {
    const [start, end, pause] = button.dataset.preset.split("|");
    $("startTime").value = start;
    $("endTime").value = end;
    $("breakMinutes").value = pause;
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
      `Noční hodiny: ${formatHours(lastResult.night)}`,
      `Počet směn: ${lastResult.count}`,
      `Rozdíl proti fondu: ${fund.value}`
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setText($("copySummary"), "Souhrn zkopírován");
      window.setTimeout(() => setText($("copySummary"), "Kopírovat souhrn"), 1700);
    } catch {
      setText($("copySummary"), "Kopírování není dostupné");
    }
  });

  loadDefaultBlocks();
  run();
})();
