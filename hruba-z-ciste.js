(function () {
  const form = document.getElementById("grossFromNetForm");
  if (!form) return;

  const $ = (id) => document.getElementById(id);
  const TAX_RATE = 0.15;
  const SOCIAL_EMPLOYEE_RATE = 0.071;
  const HEALTH_EMPLOYEE_RATE = 0.045;
  const SOCIAL_EMPLOYER_RATE = 0.248;
  const HEALTH_EMPLOYER_RATE = 0.09;
  const TAXPAYER_DISCOUNT = 2570;
  const STUDENT_DISCOUNT = 335;
  const CHILD_BONUSES = { 0: 0, 1: 1267, 2: 3131, 3: 5453 };

  function money(value) {
    return new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 }).format(value);
  }

  function round(value) {
    return Math.round(value);
  }

  function forwardNetFromGross(grossSalary, children, taxpayer, student) {
    const socialEmployee = round(grossSalary * SOCIAL_EMPLOYEE_RATE);
    const healthEmployee = round(grossSalary * HEALTH_EMPLOYEE_RATE);
    const taxBeforeDiscounts = round(grossSalary * TAX_RATE);
    const totalDiscounts = (taxpayer ? TAXPAYER_DISCOUNT : 0) + (student ? STUDENT_DISCOUNT : 0) + CHILD_BONUSES[Math.min(children, 3)];
    const taxAfterDiscounts = Math.max(0, taxBeforeDiscounts - totalDiscounts);
    const netSalary = grossSalary - socialEmployee - healthEmployee - taxAfterDiscounts;
    const socialEmployer = round(grossSalary * SOCIAL_EMPLOYER_RATE);
    const healthEmployer = round(grossSalary * HEALTH_EMPLOYER_RATE);
    return {
      grossSalary,
      netSalary,
      socialEmployee,
      healthEmployee,
      taxBeforeDiscounts,
      totalDiscounts,
      taxAfterDiscounts,
      employeeDeductions: socialEmployee + healthEmployee + taxAfterDiscounts,
      socialEmployer,
      healthEmployer,
      totalCost: grossSalary + socialEmployer + healthEmployer
    };
  }

  function estimateGrossFromNet(targetNet, children, taxpayer, student) {
    let low = 0;
    let high = Math.max(targetNet * 2.2, 30000);
    let result = forwardNetFromGross(high, children, taxpayer, student);
    let safety = 0;
    while (result.netSalary < targetNet && safety < 40) {
      high *= 1.5;
      result = forwardNetFromGross(high, children, taxpayer, student);
      safety++;
    }
    let best = result;
    for (let i = 0; i < 60; i++) {
      const mid = Math.round((low + high) / 2);
      const current = forwardNetFromGross(mid, children, taxpayer, student);
      if (Math.abs(current.netSalary - targetNet) < Math.abs(best.netSalary - targetNet)) best = current;
      if (current.netSalary < targetNet) low = mid + 1;
      else high = mid - 1;
    }
    return best;
  }

  function renderTable(targetNet, data) {
    $("summaryTableBody").innerHTML = [
      ["Zadaná čistá mzda", money(targetNet), "Cílová částka po odvodech a dani"],
      ["Hrubá mzda", money(data.grossSalary), "Orientačně dopočtený základ"],
      ["Sociální pojištění", money(data.socialEmployee), "Odvod zaměstnance"],
      ["Zdravotní pojištění", money(data.healthEmployee), "Odvod zaměstnance"],
      ["Daň před slevami", money(data.taxBeforeDiscounts), "Základní daň"],
      ["Slevy a zvýhodnění", money(data.totalDiscounts), "Poplatník, student, děti"],
      ["Daň po slevách", money(data.taxAfterDiscounts), "Započtená orientační daň"],
      ["Cena práce", money(data.totalCost), "Orientační náklad zaměstnavatele"]
    ].map((row) => `<tr><td>${row[0]}</td><td>${row[1]}</td><td>${row[2]}</td></tr>`).join("");
  }

  function run() {
    const targetNet = Number($("netSalary").value) || 0;
    const children = Number($("children").value) || 0;
    const taxpayer = $("taxpayerDiscount").checked;
    const student = $("studentDiscount").checked;
    if (targetNet <= 0) return;
    const data = estimateGrossFromNet(targetNet, children, taxpayer, student);
    const diff = Math.abs(data.netSalary - targetNet);
    $("grossSalaryResult").textContent = money(data.grossSalary);
    $("totalCostResult").textContent = money(data.totalCost);
    $("employeeDeductionsResult").textContent = money(data.employeeDeductions);
    $("taxResult").textContent = money(data.taxAfterDiscounts);
    $("netSalaryResult").textContent = money(targetNet);
    $("socialEmployeeResult").textContent = money(data.socialEmployee);
    $("healthEmployeeResult").textContent = money(data.healthEmployee);
    $("socialEmployerResult").textContent = money(data.socialEmployer);
    $("healthEmployerResult").textContent = money(data.healthEmployer);
    $("discountsResult").textContent = money(data.totalDiscounts);
    $("resultBadge").className = diff <= 50 ? "badge success" : "badge warning";
    $("resultBadge").textContent = diff <= 50 ? "Velmi blízký odhad" : "Orientační odhad";
    $("resultNote").textContent = `Zadané čisté mzdě ${money(targetNet)} odpovídá přibližně hrubá mzda ${money(data.grossSalary)}. Model počítá běžný zaměstnanecký scénář.`;
    $("heroGross").textContent = money(data.grossSalary);
    $("heroNet").textContent = money(targetNet);
    $("heroCost").textContent = money(data.totalCost);
    $("heroDeductions").textContent = money(data.employeeDeductions);
    $("heroBar").style.width = `${Math.max(8, Math.min(100, data.employeeDeductions / Math.max(data.grossSalary, 1) * 100))}%`;
    renderTable(targetNet, data);
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    run();
  });

  ["netSalary", "children", "taxpayerDiscount", "studentDiscount"].forEach((id) => {
    $(id).addEventListener("input", run);
    $(id).addEventListener("change", run);
  });

  $("resetBtn").addEventListener("click", () => {
    $("netSalary").value = 35000;
    $("children").value = 0;
    $("taxpayerDiscount").checked = true;
    $("studentDiscount").checked = false;
    run();
  });

  run();
})();
