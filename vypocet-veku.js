(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const form = $("ageForm");
  if (!form) return;

  const MS_PER_DAY = 86400000;
  const number = new Intl.NumberFormat("cs-CZ");
  const dateFormatter = new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "long", year: "numeric" });
  const weekdayFormatter = new Intl.DateTimeFormat("cs-CZ", { weekday: "long" });
  const formatNumber = (value) => number.format(Number.isFinite(value) ? value : 0);
  const pad = (value) => String(value).padStart(2, "0");
  const toInputValue = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const utcDay = (date) => Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const daysBetween = (start, end) => Math.round((utcDay(end) - utcDay(start)) / MS_PER_DAY);
  const todayLocal = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) return null;
    return parsed;
  }

  function isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  }

  function birthdayForYear(birth, year, rule) {
    if (birth.getMonth() === 1 && birth.getDate() === 29 && !isLeapYear(year)) {
      return rule === "mar1" ? new Date(year, 2, 1) : new Date(year, 1, 28);
    }
    return new Date(year, birth.getMonth(), birth.getDate());
  }

  function addMonthsClamped(date, months) {
    const monthStart = new Date(date.getFullYear(), date.getMonth() + months, 1);
    const lastDay = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    return new Date(monthStart.getFullYear(), monthStart.getMonth(), Math.min(date.getDate(), lastDay));
  }

  function ageBreakdown(birth, target, rule) {
    let years = target.getFullYear() - birth.getFullYear();
    if (birthdayForYear(birth, birth.getFullYear() + years, rule) > target) years -= 1;
    const lastBirthday = birthdayForYear(birth, birth.getFullYear() + years, rule);
    let months = (target.getFullYear() - lastBirthday.getFullYear()) * 12 + target.getMonth() - lastBirthday.getMonth();
    if (addMonthsClamped(lastBirthday, months) > target) months -= 1;
    months = Math.min(11, months);
    const monthAnchor = addMonthsClamped(lastBirthday, months);
    return { years, months, days: daysBetween(monthAnchor, target), lastBirthday };
  }

  function nextBirthday(birth, target, rule) {
    let date = birthdayForYear(birth, target.getFullYear(), rule);
    if (date < target) date = birthdayForYear(birth, target.getFullYear() + 1, rule);
    return { date, days: daysBetween(target, date) };
  }

  function addYearsClamped(date, years) {
    return birthdayForYear(date, date.getFullYear() + years, "feb28");
  }

  function word(value, one, few, many) {
    const absolute = Math.abs(value);
    if (absolute === 1) return one;
    if (absolute >= 2 && absolute <= 4) return few;
    return many;
  }

  const yearsText = (value) => `${formatNumber(value)} ${word(value, "rok", "roky", "let")}`;
  const monthsText = (value) => `${formatNumber(value)} ${word(value, "měsíc", "měsíce", "měsíců")}`;
  const daysText = (value) => `${formatNumber(value)} ${word(value, "den", "dny", "dní")}`;

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function setDefaults() {
    const today = todayLocal();
    $("targetDate").value = toInputValue(today);
    $("birthDate").value = toInputValue(addYearsClamped(today, -30));
    $("feb29Rule").value = "feb28";
    $("ageAdvanced").open = false;
    $("inputError").hidden = true;
  }

  function setInvalidState(message) {
    $("inputError").hidden = false;
    setText("resultBadge", "Zkontrolujte zadání");
    setText("exactAgeResult", "—");
    setText("resultNote", message);
    setText("timingStatus", "Výsledek nelze spočítat");
    setText("timingText", "Datum narození musí být stejné nebo dřívější než cílové datum.");
    setText("readingTitle", "Zadaná data potřebují opravu.");
    setText("readingText", message);
  }

  function render() {
    const birth = parseDate($("birthDate").value);
    const target = parseDate($("targetDate").value);
    if (!birth || !target) {
      setInvalidState("Vyplňte platné datum narození i cílové datum.");
      return;
    }
    if (birth > target) {
      setInvalidState("Datum narození je pozdější než cílové datum.");
      return;
    }

    $("inputError").hidden = true;
    const rule = $("feb29Rule").value;
    const age = ageBreakdown(birth, target, rule);
    const totalDays = daysBetween(birth, target);
    const fullWeeks = Math.floor(totalDays / 7);
    const remainingWeekDays = totalDays % 7;
    const totalMonths = age.years * 12 + age.months;
    const next = nextBirthday(birth, target, rule);
    const nextAge = next.days === 0 ? age.years : age.years + 1;
    const nextRoundAge = Math.ceil((age.years + 1) / 10) * 10;
    const roundDate = birthdayForYear(birth, birth.getFullYear() + nextRoundAge, rule);
    const daysToRound = daysBetween(target, roundDate);
    const isLeapBirth = birth.getMonth() === 1 && birth.getDate() === 29;
    const ruleText = isLeapBirth
      ? rule === "mar1" ? "1. březen v nepřestupném roce" : "28. únor v nepřestupném roce"
      : "není potřeba – datum není 29. 2.";
    const exact = `${yearsText(age.years)}, ${monthsText(age.months)} a ${daysText(age.days)}`;
    const birthdayText = next.days === 0 ? "dnes" : daysText(next.days);
    const weeksSummary = `${formatNumber(fullWeeks)} týd. + ${formatNumber(remainingWeekDays)} d.`;

    setText("exactAgeResult", exact);
    setText("yearsResult", formatNumber(age.years));
    setText("monthsRemainder", formatNumber(age.months));
    setText("daysRemainder", formatNumber(age.days));
    setText("daysResult", formatNumber(totalDays));
    setText("monthsResult", formatNumber(totalMonths));
    setText("weeksResult", weeksSummary);
    setText("nextBirthdayResult", birthdayText);
    setText("nextBirthdayDate", dateFormatter.format(next.date));
    setText("birthDateResult", dateFormatter.format(birth));
    setText("targetDateResult", dateFormatter.format(target));
    setText("weekdayBirthResult", weekdayFormatter.format(birth));
    setText("nextAgeResult", yearsText(nextAge));
    setText("resultBadge", next.days === 0 ? "Narozeniny jsou dnes" : "Výpočet hotový");
    setText("resultNote", `K datu ${dateFormatter.format(target)} je věk ${exact}.`);
    setText("birthdayProgressLabel", next.days === 0 ? "Narozeniny" : "Do narozenin");
    setText("timingStatus", next.days === 0 ? "Dnes začíná nový rok věku" : `${yearsText(age.years)} je dokončeno`);
    setText("timingText", next.days === 0
      ? `V cílový den probíhají narozeniny a dokončený věk je ${yearsText(age.years)}.`
      : `Další celý rok věku začne ${dateFormatter.format(next.date)}, tedy za ${daysText(next.days)}.`);
    setText("decisionSummary", `Celkem uplynulo ${formatNumber(totalDays)} kalendářních dnů neboli ${weeksSummary}`);
    setText("nextActionText", `Další kulatý milník jsou ${nextRoundAge}. narozeniny, do kterých zbývá ${daysText(daysToRound)}.`);
    setText("readingTitle", `K cílovému datu je věk ${exact}.`);
    setText("readingText", `Dokončeno bylo ${formatNumber(age.years)} narozenin. Výpočet pracuje s pravidlem: ${ruleText}`);

    setText("heroAge", yearsText(age.years));
    setText("heroPhase", next.days === 0 ? "Narozeniny jsou dnes" : `Další narozeniny za ${daysText(next.days)}`);
    setText("heroBirth", dateFormatter.format(birth));
    setText("heroTarget", dateFormatter.format(target));
    setText("heroYears", formatNumber(age.years));
    setText("heroDays", formatNumber(totalDays));
    setText("heroNextAge", yearsText(nextAge));
    setText("heroNextBirthday", next.days === 0 ? "právě dnes" : `za ${daysText(next.days)}`);

    const previousBirthday = age.lastBirthday;
    const followingBirthday = birthdayForYear(birth, birth.getFullYear() + age.years + 1, rule);
    const birthdayYearLength = Math.max(1, daysBetween(previousBirthday, followingBirthday));
    const elapsedSinceBirthday = Math.max(0, daysBetween(previousBirthday, target));
    const progress = Math.max(3, Math.min(100, elapsedSinceBirthday / birthdayYearLength * 100));
    $("heroProgress").style.width = `${progress}%`;
    $("birthdayProgressBar").style.width = `${progress}%`;

    const rows = [
      ["Datum narození", dateFormatter.format(birth), `den v týdnu: ${weekdayFormatter.format(birth)}`],
      ["Cílové datum", dateFormatter.format(target), "den, ke kterému se věk počítá"],
      ["Přesný věk", exact, "dokončené roky, měsíce a dny"],
      ["Celkový počet dnů", daysText(totalDays), "skutečná kalendářní vzdálenost"],
      ["Celkové týdny", weeksSummary, "dokončené týdny a zbývající dny"],
      ["Další narozeniny", `${dateFormatter.format(next.date)} (${birthdayText})`, `začne věk ${yearsText(nextAge)}`],
      ["Další kulaté narozeniny", `${nextRoundAge}. narozeniny`, `za ${daysText(daysToRound)}`],
      ["Pravidlo pro 29. únor", ruleText, "použité výroční nastavení"]
    ];
    $("summaryTableBody").replaceChildren(...rows.map((row) => {
      const tr = document.createElement("tr");
      row.forEach((cell) => {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      return tr;
    }));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    render();
    if (window.matchMedia("(max-width: 980px)").matches) $("vysledek").scrollIntoView({ behavior: "smooth", block: "start" });
  });
  ["birthDate", "targetDate", "feb29Rule"].forEach((id) => {
    $(id).addEventListener("input", render);
    $(id).addEventListener("change", render);
  });
  $("setTodayBtn").addEventListener("click", () => {
    $("targetDate").value = toInputValue(todayLocal());
    render();
  });
  $("resetBtn").addEventListener("click", () => {
    setDefaults();
    render();
  });

  setDefaults();
  render();
})();
