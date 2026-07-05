(() => {
  const $ = (id) => document.getElementById(id);
  const numberList = $("numberList");
  const decimalPlaces = $("decimalPlaces");
  const weightedTableBody = $("weightedTableBody");
  const num = (value, digits = 2) =>
    new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: digits }).format(Number.isFinite(value) ? value : 0);
  let active = "arithmetic";

  function digits() {
    return Number(decimalPlaces.value) || 2;
  }

  function parseList(text) {
    const normalized = text.trim();
    const parts = /[;\n\r]|\s/.test(normalized)
      ? normalized.split(/(?:\s*;\s*|\s+)/)
      : normalized.split(/\s*,\s*/);
    return parts
      .map((item) => Number(item.replace(",", ".")))
      .filter((value) => Number.isFinite(value));
  }

  function update(data) {
    $("averageResult").textContent = num(data.average, digits());
    $("averageType").textContent = data.type;
    $("countResult").textContent = String(data.count);
    $("sumResult").textContent = num(data.sum, digits());
    $("minResult").textContent = num(data.min, digits());
    $("maxResult").textContent = num(data.max, digits());
    $("rangeResult").textContent = num(data.range, digits());
    $("weightsSumResult").textContent = data.weightsSum == null ? "—" : num(data.weightsSum, digits());
    $("inputPreview").textContent = data.preview;
    $("resultBadge").textContent = "Výpočet hotový";
    $("resultNote").textContent = `${data.type} průměr vychází ${num(data.average, digits())}.`;
    $("affordabilityStatus").textContent = data.type;
    $("affordabilityText").textContent = data.note;
    $("decisionSummary").textContent = "Zkontrolujte rozsah hodnot, minimum a maximum. Extrémy mohou běžný průměr výrazně posunout.";
    $("nextActionText").textContent = active === "weighted" ? "U váženého průměru ověřte hlavně váhy." : "Pokud mají hodnoty různou důležitost, použijte vážený průměr.";
  }

  function calculateArithmetic() {
    active = "arithmetic";
    const values = parseList(numberList.value);
    if (!values.length) return;
    const sum = values.reduce((acc, value) => acc + value, 0);
    const average = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    update({
      average,
      type: "Aritmetický",
      count: values.length,
      sum,
      min,
      max,
      range: max - min,
      weightsSum: null,
      preview: values.slice(0, 8).map((value) => num(value, digits())).join(", "),
      note: "Aritmetický průměr dává každé hodnotě stejnou váhu."
    });
  }

  function weightedRows() {
    return Array.from(weightedTableBody.querySelectorAll("tr"))
      .map((row) => {
        const inputs = row.querySelectorAll("input");
        return { value: Number(inputs[0].value) || 0, weight: Number(inputs[1].value) || 0 };
      })
      .filter((row) => row.weight > 0);
  }

  function calculateWeighted() {
    active = "weighted";
    const rows = weightedRows();
    if (!rows.length) return;
    const weightedSum = rows.reduce((acc, row) => acc + row.value * row.weight, 0);
    const weightsSum = rows.reduce((acc, row) => acc + row.weight, 0);
    const values = rows.map((row) => row.value);
    const sum = values.reduce((acc, value) => acc + value, 0);
    const average = weightedSum / weightsSum;
    const min = Math.min(...values);
    const max = Math.max(...values);
    update({
      average,
      type: "Vážený",
      count: rows.length,
      sum,
      min,
      max,
      range: max - min,
      weightsSum,
      preview: rows.map((row) => `${num(row.value, digits())} × ${num(row.weight, digits())}`).join(", "),
      note: "Vážený průměr dává vyšší váze větší vliv na výsledek."
    });
  }

  function bindWeightedInputs() {
    weightedTableBody.querySelectorAll("input").forEach((input) => input.addEventListener("input", calculateWeighted));
  }

  $("calcArithmeticBtn").addEventListener("click", calculateArithmetic);
  $("calcWeightedBtn").addEventListener("click", calculateWeighted);
  $("fillExampleBtn").addEventListener("click", () => {
    numberList.value = "10, 15, 20, 25";
    calculateArithmetic();
  });
  $("clearArithmeticBtn").addEventListener("click", () => {
    numberList.value = "";
  });
  $("addRowBtn").addEventListener("click", () => {
    weightedTableBody.insertAdjacentHTML("beforeend", '<tr><td><input type="number" step="any" value="1"></td><td><input type="number" step="any" value="1"></td></tr>');
    bindWeightedInputs();
    calculateWeighted();
  });
  $("fillWeightedExampleBtn").addEventListener("click", () => {
    weightedTableBody.innerHTML = '<tr><td><input type="number" step="any" value="1"></td><td><input type="number" step="any" value="1"></td></tr><tr><td><input type="number" step="any" value="2"></td><td><input type="number" step="any" value="2"></td></tr><tr><td><input type="number" step="any" value="3"></td><td><input type="number" step="any" value="3"></td></tr>';
    bindWeightedInputs();
    calculateWeighted();
  });
  $("resetWeightedBtn").addEventListener("click", () => {
    weightedTableBody.innerHTML = '<tr><td><input type="number" step="any" value="1"></td><td><input type="number" step="any" value="1"></td></tr>';
    bindWeightedInputs();
    calculateWeighted();
  });
  numberList.addEventListener("input", calculateArithmetic);
  decimalPlaces.addEventListener("change", () => (active === "weighted" ? calculateWeighted() : calculateArithmetic()));
  bindWeightedInputs();
  calculateArithmetic();
})();
