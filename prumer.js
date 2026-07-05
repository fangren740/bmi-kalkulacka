(() => {
  const $ = (id) => document.getElementById(id);
  const numberList = $("numberList");
  const decimalPlaces = $("decimalPlaces");
  const weightedTableBody = $("weightedTableBody");
  const modeButtons = Array.from(document.querySelectorAll("[data-average-mode]"));
  const modePanels = Array.from(document.querySelectorAll("[data-average-panel]"));
  const num = (value, digits = 2) =>
    new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  let active = "arithmetic";

  function digits() {
    return Number(decimalPlaces.value) || 0;
  }

  function parseList(text) {
    const normalized = text.trim();
    if (!normalized) return [];
    const parts = /[;\n\r]|\s/.test(normalized)
      ? normalized.split(/(?:\s*;\s*|\s+)/)
      : normalized.split(/\s*,\s*/);
    return parts
      .map((item) => Number(item.replace(/,$/, "").replace(",", ".")))
      .filter((value) => Number.isFinite(value));
  }

  function setMode(mode, focusPanel = false) {
    active = mode === "weighted" ? "weighted" : "arithmetic";
    modeButtons.forEach((button) => {
      const selected = button.dataset.averageMode === active;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    });
    modePanels.forEach((panel) => {
      panel.hidden = panel.dataset.averagePanel !== active;
    });
    $("averageModeContext").textContent = active === "weighted" ? "Vážený průměr" : "Aritmetický průměr";
    if (focusPanel) $(active === "weighted" ? "average-panel-weighted" : "average-panel-arithmetic").focus?.();
    active === "weighted" ? calculateWeighted() : calculateArithmetic();
  }

  function setEmpty(type, message) {
    $("countLabel").textContent = type === "Vážený" ? "Počet řádků" : "Počet hodnot";
    $("sumLabel").textContent = type === "Vážený" ? "Vážený součet" : "Součet";
    $("averageResult").textContent = "—";
    $("averageResult").classList.add("average-empty");
    $("averageType").textContent = type;
    $("countResult").textContent = "0";
    $("sumResult").textContent = "—";
    $("rangeResult").textContent = "—";
    $("minResult").textContent = "—";
    $("maxResult").textContent = "—";
    $("weightsSumResult").textContent = "—";
    $("inputPreview").textContent = "—";
    $("resultBadge").textContent = "Doplňte hodnoty";
    $("resultNote").textContent = message;
    $("affordabilityStatus").textContent = "Bez výsledku";
    $("affordabilityText").textContent = "Výsledek se zobrazí, jakmile zadání obsahuje platná čísla.";
    $("decisionSummary").textContent = "Zkontrolujte formát čísel a u váženého průměru také kladné váhy.";
    $("nextActionText").textContent = "Můžete použít připravený příklad a následně hodnoty přepsat.";
  }

  function update(data) {
    $("countLabel").textContent = data.type === "Vážený" ? "Počet řádků" : "Počet hodnot";
    $("sumLabel").textContent = data.type === "Vážený" ? "Vážený součet" : "Součet";
    $("averageResult").classList.remove("average-empty");
    $("averageResult").textContent = num(data.average, digits());
    $("averageType").textContent = data.type;
    $("countResult").textContent = String(data.count);
    $("sumResult").textContent = num(data.sum, digits());
    $("minResult").textContent = num(data.min, digits());
    $("maxResult").textContent = num(data.max, digits());
    $("rangeResult").textContent = num(data.range, digits());
    $("weightsSumResult").textContent = data.weightsSum == null ? "—" : num(data.weightsSum, digits());
    $("inputPreview").textContent = data.preview;
    $("resultBadge").textContent = "Výsledek odpovídá aktivnímu režimu";
    $("resultNote").textContent = `${data.type} průměr vychází ${num(data.average, digits())}.`;
    $("affordabilityStatus").textContent = data.type;
    $("affordabilityText").textContent = data.note;
    $("decisionSummary").textContent = data.range > 0
      ? `Hodnoty leží v rozsahu ${num(data.range, digits())}. Minimum je ${num(data.min, digits())} a maximum ${num(data.max, digits())}.`
      : "Všechny započítané hodnoty jsou stejné, takže rozsah je nulový.";
    $("nextActionText").textContent = active === "weighted"
      ? "Ověřte, že váhy vyjadřují skutečnou důležitost nebo četnost hodnot."
      : "Pokud mají hodnoty různou důležitost, přepněte na vážený průměr.";
  }

  function calculateArithmetic() {
    const values = parseList(numberList.value);
    if (!values.length) {
      setEmpty("Aritmetický", "Zadejte alespoň jednu platnou číselnou hodnotu.");
      return;
    }
    const sum = values.reduce((acc, value) => acc + value, 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    update({
      average: sum / values.length,
      type: "Aritmetický",
      count: values.length,
      sum,
      min,
      max,
      range: max - min,
      weightsSum: null,
      preview: values.slice(0, 8).map((value) => num(value, digits())).join(" · "),
      note: "Každá zadaná hodnota má ve výsledku stejný vliv."
    });
  }

  function weightedRows() {
    return Array.from(weightedTableBody.querySelectorAll("tr"))
      .map((row) => {
        const inputs = row.querySelectorAll("input");
        const value = Number(inputs[0].value);
        const weight = Number(inputs[1].value);
        return { value, weight };
      })
      .filter((row) => Number.isFinite(row.value) && Number.isFinite(row.weight) && row.weight > 0);
  }

  function calculateWeighted() {
    const rows = weightedRows();
    if (!rows.length) {
      setEmpty("Vážený", "Zadejte alespoň jednu hodnotu s váhou větší než nula.");
      return;
    }
    const weightedSum = rows.reduce((acc, row) => acc + row.value * row.weight, 0);
    const weightsSum = rows.reduce((acc, row) => acc + row.weight, 0);
    const values = rows.map((row) => row.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    update({
      average: weightedSum / weightsSum,
      type: "Vážený",
      count: rows.length,
      sum: weightedSum,
      min,
      max,
      range: max - min,
      weightsSum,
      preview: rows.slice(0, 6).map((row) => `${num(row.value, digits())} × ${num(row.weight, digits())}`).join(" · "),
      note: "Vyšší váha dává příslušné hodnotě větší vliv na výsledek."
    });
  }

  function rowMarkup(value = "", weight = "") {
    return `<tr><td><input type="number" step="any" value="${value}" aria-label="Hodnota"></td><td><input type="number" min="0" step="any" value="${weight}" aria-label="Váha"></td><td><button class="average-remove-row" type="button" aria-label="Odstranit řádek">×</button></td></tr>`;
  }

  function recalculate() {
    active === "weighted" ? calculateWeighted() : calculateArithmetic();
  }

  modeButtons.forEach((button) => button.addEventListener("click", () => setMode(button.dataset.averageMode)));
  $("calcArithmeticBtn").addEventListener("click", calculateArithmetic);
  $("calcWeightedBtn").addEventListener("click", calculateWeighted);
  $("fillExampleBtn").addEventListener("click", () => {
    numberList.value = "10; 15; 20; 25";
    calculateArithmetic();
  });
  $("clearArithmeticBtn").addEventListener("click", () => {
    numberList.value = "";
    setEmpty("Aritmetický", "Zadejte alespoň jednu platnou číselnou hodnotu.");
    numberList.focus();
  });
  $("addRowBtn").addEventListener("click", () => {
    if (weightedTableBody.querySelectorAll("tr").length >= 20) return;
    weightedTableBody.insertAdjacentHTML("beforeend", rowMarkup());
  });
  $("fillWeightedExampleBtn").addEventListener("click", () => {
    weightedTableBody.innerHTML = rowMarkup(1, 1) + rowMarkup(2, 2) + rowMarkup(3, 3);
    calculateWeighted();
  });
  $("resetWeightedBtn").addEventListener("click", () => {
    weightedTableBody.innerHTML = rowMarkup();
    setEmpty("Vážený", "Zadejte alespoň jednu hodnotu s váhou větší než nula.");
  });
  weightedTableBody.addEventListener("click", (event) => {
    const button = event.target.closest(".average-remove-row");
    if (!button) return;
    const rows = weightedTableBody.querySelectorAll("tr");
    if (rows.length === 1) {
      rows[0].querySelectorAll("input").forEach((input) => { input.value = ""; });
    } else {
      button.closest("tr").remove();
    }
    calculateWeighted();
  });
  weightedTableBody.addEventListener("input", () => {
    if (active === "weighted") calculateWeighted();
  });
  numberList.addEventListener("input", () => {
    if (active === "arithmetic") calculateArithmetic();
  });
  decimalPlaces.addEventListener("change", recalculate);
  setMode("arithmetic");
})();
