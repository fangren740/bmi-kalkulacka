(() => {
  const ids = ["proportionMode", "aValue", "bValue", "cValue", "resultLabel"];
  const $ = (id) => document.getElementById(id);
  const form = $("proportionForm");
  const resetBtn = $("resetBtn");
  const num = (value, digits = 6) =>
    new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);

  function values() {
    return {
      mode: $("proportionMode").value,
      a: Number($("aValue").value) || 0,
      b: Number($("bValue").value) || 0,
      c: Number($("cValue").value) || 0,
      label: $("resultLabel").value || "Výsledek x"
    };
  }

  function direct(v) {
    return (v.b * v.c) / v.a;
  }

  function inverse(v) {
    return (v.a * v.b) / v.c;
  }

  function render() {
    const v = values();
    const mode = v.mode === "inverse" ? "inverse" : "direct";
    const divisor = mode === "inverse" ? v.c : v.a;
    if (divisor === 0) {
      $("resultValue").textContent = "—";
      $("statusBadge").textContent = "Dělitel nesmí být nula";
      $("sentenceOutput").textContent = mode === "inverse" ? "Pro nepřímou úměru zadejte c různé od nuly." : "Pro přímou úměru zadejte a různé od nuly.";
      $("logicStatus").textContent = "Neplatné zadání";
      $("logicText").textContent = "Dělení nulou nemá definovaný číselný výsledek.";
      $("exactOutput").textContent = "—";
      return;
    }
    const directResult = v.a !== 0 ? direct(v) : 0;
    const inverseResult = v.c !== 0 ? inverse(v) : 0;
    const result = mode === "inverse" ? inverseResult : directResult;
    const modeLabel = mode === "inverse" ? "Nepřímá" : "Přímá";
    const ratio = v.a > 0 ? v.b / v.a : 0;
    $("resultValue").textContent = num(result);
    $("resultType").textContent = modeLabel;
    $("ratioValue").textContent = num(ratio);
    $("roundedValue").textContent = num(Math.round(result * 100) / 100, 2);
    $("statusBadge").textContent = "Výpočet hotový";
    $("sentenceOutput").textContent =
      mode === "inverse"
        ? `${v.label} vychází ${num(result)}. U nepřímé úměry se větší hodnota na jedné straně promítá opačně.`
        : `${v.label} vychází ${num(result)}. U přímé úměry roste výsledek ve stejném poměru.`;
    $("resultLabelOutput").textContent = v.label;
    $("inputSummary").textContent = `a=${num(v.a)}, b=${num(v.b)}, c=${num(v.c)}`;
    $("formulaOutput").textContent = mode === "inverse" ? "x = (a × b) ÷ c" : "x = (b × c) ÷ a";
    $("stepOutput").textContent =
      mode === "inverse"
        ? `${num(v.a)} × ${num(v.b)} ÷ ${num(v.c)}`
        : `${num(v.b)} × ${num(v.c)} ÷ ${num(v.a)}`;
    $("exactOutput").textContent = num(result);
    $("logicStatus").textContent = modeLabel + " úměra";
    $("logicText").textContent =
      mode === "inverse"
        ? "Nepřímá úměra se hodí pro situace, kdy více lidí nebo vyšší výkon zkrátí čas."
        : "Přímá úměra se hodí pro cenu za kusy, spotřebu, vzdálenost nebo běžné přepočty.";
    $("decisionSummary").textContent = "Nejdůležitější je ověřit, zda se má výsledek s hodnotou c zvětšovat, nebo zmenšovat.";
    $("nextActionText").textContent = "Pokud jde o cenu za balení nebo množství, pokračujte jednotkovou cenou.";
    $("directCompareText").textContent = num(directResult);
    $("inverseCompareText").textContent = num(inverseResult);
    $("summaryTableBody").innerHTML = [
      ["Typ úměry", modeLabel, "zvolený režim"],
      ["Vstupy", `a=${num(v.a)}, b=${num(v.b)}, c=${num(v.c)}`, "zadání"],
      ["Vzorec", $("formulaOutput").textContent, "postup"],
      ["Výsledek", num(result), v.label]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
  });
  ids.forEach((id) => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });
  resetBtn.addEventListener("click", () => {
    form.reset();
    render();
  });
  render();
})();
