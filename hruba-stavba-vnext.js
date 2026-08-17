(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const money = new Intl.NumberFormat("cs-CZ", { style: "currency", currency: "CZK", maximumFractionDigits: 0 });
  const number = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 });

  const refs = [
    {
      id: "aaa-firm", source: "AAApenize.cz", url: "https://www.aaapenize.cz/stavba-domu/",
      label: "dodavatelská hrubá stavba", min: 18000, max: 25000, basis: "usable",
      basisLabel: "užitná plocha", scope: "classic", scopeLabel: "klasická se střechou",
      delivery: "firm", vat: "DPH neuvedeno", region: "ČR / obecná reference"
    },
    {
      id: "aaa-self", source: "AAApenize.cz", url: "https://www.aaapenize.cz/stavba-domu/",
      label: "hrubá stavba svépomocí", min: 10000, max: 16000, basis: "usable",
      basisLabel: "užitná plocha", scope: "classic", scopeLabel: "klasická se střechou",
      delivery: "self", vat: "DPH neuvedeno", region: "ČR / obecná reference"
    },
    {
      id: "praha-closed", source: "Stavba domu Praha", url: "https://stavba-domu-praha.cz/cena-stavby-domu/",
      label: "hrubá stavba uzavřená", min: 21000, max: null, basis: "floor",
      basisLabel: "podlahová plocha", scope: "closed", scopeLabel: "uzavřená",
      delivery: "firm", vat: "bez DPH", region: "Praha + Středočeský kraj"
    },
    {
      id: "bausava", source: "BAUSAVA", url: "https://www.bausava.eu/services/v-stavba-rodinn-ch-dom",
      label: "základy + konstrukce + střecha + okna", min: 22000, max: null, basis: "unknown",
      basisLabel: "definice m² neuvedena", scope: "closed", scopeLabel: "uzavřená",
      delivery: "firm", vat: "bez DPH", region: "neuvedeno"
    },
    {
      id: "superstavby", source: "Superstavby.cz", url: "https://superstavby.cz/hruba-stavba-domu/",
      label: "široké veřejné pásmo", min: 18000, max: 35000, basis: "unknown",
      basisLabel: "m² hrubé stavby – blíže neuvedeno", scope: "variable", scopeLabel: "proměnlivý rozsah",
      delivery: "firm", vat: "DPH neuvedeno", region: "Praha + Středočeský kraj"
    },
    {
      id: "machac-masonry", source: "Projekce Machač", url: "https://www.projekcemachac.cz/clanky/kolik-stoji-hruba-stavba-2026/",
      label: "klasická cihla / pórobeton", min: 7500, max: 11000, basis: "unknown",
      basisLabel: "definice m² neuvedena", scope: "classic", scopeLabel: "klasická se střechou",
      delivery: "any", vat: "DPH neuvedeno", region: "ČR / obecná reference"
    },
    {
      id: "machac-insulated", source: "Projekce Machač", url: "https://www.projekcemachac.cz/clanky/kolik-stoji-hruba-stavba-2026/",
      label: "zateplená cihla", min: 8500, max: 12500, basis: "unknown",
      basisLabel: "definice m² neuvedena", scope: "classic", scopeLabel: "klasická se střechou",
      delivery: "any", vat: "DPH neuvedeno", region: "ČR / obecná reference"
    },
    {
      id: "megastroj", source: "Megastroj.cz", url: "https://www.megastroj.cz/clanky/kolik-stoji-postavit-dum-cena-rodinneho-domu-za-m2-hrube-stavby-i-dum-na-klic_4298",
      label: "obecné pásmo 2026", min: 10000, max: 25000, basis: "unknown",
      basisLabel: "definice m² neuvedena", scope: "variable", scopeLabel: "proměnlivý rozsah",
      delivery: "any", vat: "DPH neuvedeno", region: "ČR / obecná reference"
    }
  ];

  let activeMode = "plan";
  let lastSummary = "";

  const clamp = (value, min, max, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };

  const planScope = () => document.querySelector('input[name="planScope"]:checked')?.value || "classic";
  const offerScope = () => document.querySelector('input[name="offerScope"]:checked')?.value || "classic";

  function formatRange(min, max) {
    if (!Number.isFinite(min)) return "—";
    if (!Number.isFinite(max)) return `od ${number.format(Math.round(min))} Kč`;
    return `${number.format(Math.round(min))}–${number.format(Math.round(max))} Kč`;
  }

  function formatPerM2(ref) {
    if (ref.max) return `${number.format(ref.min)}–${number.format(ref.max)} Kč/m²`;
    return `od ${number.format(ref.min)} Kč/m²`;
  }

  function setHeroScope(scope) {
    const closed = scope === "closed";
    $("heroScopeLabel").textContent = closed ? "Uzavřená hrubá stavba" : "Klasická hrubá stavba";
    $("heroOpenings").classList.toggle("is-on", closed);
  }

  function exactPlanMatch(ref, basis, scope, delivery) {
    return ref.basis === basis &&
      ref.scope === scope &&
      (ref.delivery === delivery || ref.delivery === "any");
  }

  function closestPlanRefs(basis, scope, delivery) {
    return refs.filter((ref) => exactPlanMatch(ref, basis, scope, delivery));
  }

  function renderSourceMap({ area, basis, scope, delivery }) {
    const host = $("sourceMap");
    host.innerHTML = "";

    refs.forEach((ref) => {
      const exact = exactPlanMatch(ref, basis, scope, delivery);
      const sameBasis = ref.basis === basis;
      const comparableTotal = sameBasis && basis !== "unknown";
      const totalMin = comparableTotal ? area * ref.min : null;
      const totalMax = comparableTotal && ref.max ? area * ref.max : null;

      const row = document.createElement("article");
      row.className = `source-row${exact ? " is-match" : ""}`;

      const name = document.createElement("div");
      name.className = "source-name";
      const link = document.createElement("a");
      link.href = ref.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = ref.source;
      link.style.color = "inherit";
      link.style.textDecoration = "none";
      const strong = document.createElement("strong");
      strong.appendChild(link);
      const small = document.createElement("small");
      small.textContent = ref.label;
      name.append(strong, small);
      if (exact) {
        const badge = document.createElement("span");
        badge.className = "match-badge";
        badge.textContent = "nejbližší shoda";
        name.appendChild(badge);
      }

      const price = document.createElement("div");
      price.className = "source-price";
      price.textContent = formatPerM2(ref);

      const meta = document.createElement("div");
      meta.className = "source-meta";
      [ref.basisLabel, ref.scopeLabel, ref.vat].forEach((text) => {
        const chip = document.createElement("span");
        chip.textContent = text;
        meta.appendChild(chip);
      });

      const context = document.createElement("div");
      context.className = "source-context";
      if (comparableTotal) {
        context.textContent = ref.max
          ? `${number.format(area)} m² → ${formatRange(totalMin, totalMax)} · ${ref.region}`
          : `${number.format(area)} m² → od ${money.format(Math.round(totalMin))} · ${ref.region}`;
      } else {
        context.textContent = `Celkový přepočet nezobrazen: ${ref.basis === "unknown" ? "zdroj přesnou definici m² neuvádí" : "jiná definice plochy"} · ${ref.region}`;
      }

      row.append(name, price, meta, context);
      host.appendChild(row);
    });
  }

  function renderPlan() {
    const area = clamp($("planArea").value, 40, 600, 120);
    const basis = $("planBasis").value;
    const scope = planScope();
    const delivery = $("planDelivery").value;
    const reserveRate = clamp($("planReserve").value, 0, 30, 10);
    const matches = closestPlanRefs(basis, scope, delivery);

    setHeroScope(scope);
    $("resultMode").textContent = "PLÁNOVÁNÍ";
    $("resultHeadline").textContent = matches.length ? "Nejbližší srovnatelná reference" : "Přímá cenová shoda chybí";

    if (matches.length) {
      const ref = matches[0];
      const low = area * ref.min;
      const high = ref.max ? area * ref.max : null;
      $("resultValue").textContent = high ? formatRange(low, high).replace(" Kč", " Kč") : `od ${money.format(Math.round(low))}`;
      $("resultPerM2").textContent = `${formatPerM2(ref)} · ${ref.vat}`;
      $("resultExplain").textContent = `Přepočet používá zveřejněnou referenci „${ref.label}“ a stejnou definici plochy. Nejde o průměr trhu ani cenovou nabídku.`;

      const reserveBase = high || low;
      $("metricLabelA").textContent = `Rezerva ${number.format(reserveRate)} % k ${high ? "horní hranici" : "publikovanému minimu"}`;
      $("metricA").textContent = money.format(Math.round(reserveBase * reserveRate / 100));
      $("metricLabelB").textContent = "Rozsah";
      $("metricB").textContent = scope === "closed" ? "včetně otvorů" : "bez oken";
      $("metricLabelC").textContent = "Přímá shoda plochy";
      $("metricC").textContent = "ano";

      $("resultCallout").innerHTML = `<strong>Co ověřit</strong><p>${ref.vat.includes("neuvedeno") ? "Zdroj u tohoto pásma neuvádí režim DPH. " : ""}Před srovnáním nabídky potvrďte stejný rozsah díla a stejnou definici m².</p>`;
      lastSummary = `Hrubá stavba ${number.format(area)} m²: ${high ? formatRange(low, high) : `od ${money.format(Math.round(low))}`} podle reference ${ref.source} (${formatPerM2(ref)}, ${ref.basisLabel}, ${ref.vat}). Rozsah: ${scope === "closed" ? "uzavřená" : "klasická se střechou"}.`;
    } else {
      $("resultValue").textContent = "Bez bezpečného přepočtu";
      $("resultPerM2").textContent = "viz cenová mapa níže";
      $("resultExplain").textContent = "Pro tuto kombinaci nemáme veřejnou referenci se shodným rozsahem, způsobem realizace a zároveň jasně stejnou definicí plochy. Záměrně nedopočítáváme chybějící číslo vlastním koeficientem.";
      $("metricLabelA").textContent = "Rezerva";
      $("metricA").textContent = "až po volbě zdroje";
      $("metricLabelB").textContent = "Rozsah";
      $("metricB").textContent = scope === "closed" ? "uzavřená" : "bez oken";
      $("metricLabelC").textContent = "Přímá shoda plochy";
      $("metricC").textContent = basis === "unknown" ? "neznámá" : "ne";
      $("resultCallout").innerHTML = `<strong>Správný další krok</strong><p>Projděte veřejné reference níže a vyberte jen zdroj, který používá srovnatelný rozsah a stejnou definici m². Pokud už máte nabídku, přepněte do režimu „Mám nabídku“.</p>`;
      lastSummary = `Hrubá stavba ${number.format(area)} m²: pro zadanou kombinaci není k dispozici bezpečný přímý přepočet veřejné reference. Je nutné sjednotit rozsah a definici m².`;
    }

    renderSourceMap({ area, basis, scope, delivery });
  }

  const requiredByScope = {
    classic: ["earth","foundation","waterproof","walls","ceiling","roofStructure","roofCover","site","transport"],
    closed: ["earth","foundation","waterproof","walls","ceiling","roofStructure","roofCover","windows","site","transport"]
  };
  const itemLabels = {
    earth:"zemní práce / výkopy", foundation:"základy a deska", waterproof:"hydroizolace", walls:"zdivo",
    ceiling:"stropy / věnce / překlady", stairs:"schodiště", roofStructure:"nosná konstrukce střechy",
    roofCover:"krytina / klempířské prvky", chimney:"komín", windows:"okna a vnější dveře",
    site:"lešení / staveniště", transport:"doprava / technika"
  };

  function checkedScopeItems() {
    return [...document.querySelectorAll("[data-scope-item]")].filter((el) => el.checked).map((el) => el.dataset.scopeItem);
  }

  function comparableOfferRefs(basis, scope) {
    return refs.filter((ref) => ref.basis === basis && ref.scope === scope && ref.delivery !== "self");
  }

  function renderOffer() {
    const price = clamp($("offerPrice").value, 100000, 100000000, 2700000);
    const area = clamp($("offerArea").value, 40, 600, 120);
    const basis = $("offerBasis").value;
    const scope = offerScope();
    const perM2 = price / area;
    const checked = checkedScopeItems();
    const required = requiredByScope[scope];
    const missing = required.filter((key) => !checked.includes(key));
    const comparable = comparableOfferRefs(basis, scope);

    setHeroScope(scope);
    $("resultMode").textContent = "AUDIT NABÍDKY";
    $("resultHeadline").textContent = "Cena nabídky po přepočtu";
    $("resultValue").textContent = money.format(Math.round(price));
    $("resultPerM2").textContent = `${number.format(Math.round(perM2))} Kč/m² · ${basis === "usable" ? "užitná plocha" : basis === "floor" ? "podlahová plocha" : "definice plochy neuvedena"}`;

    let comparison = "Nemáme přímou veřejnou referenci se stejnou definicí plochy a rozsahem.";
    if (comparable.length) {
      const ref = comparable[0];
      if (ref.max) {
        const position = perM2 < ref.min ? "pod" : perM2 > ref.max ? "nad" : "uvnitř";
        comparison = `Číselně leží ${position} publikovaného pásma ${formatPerM2(ref)} od ${ref.source}. To není verdikt o výhodnosti — nejprve musí sedět scope a DPH.`;
      } else {
        comparison = `Pro srovnatelný typ plochy existuje veřejná reference ${ref.source} „${formatPerM2(ref)}“. Zdroj nepublikuje horní hranici, takže z něj nelze odvodit celé pásmo.`;
      }
    }
    $("resultExplain").textContent = comparison;

    $("metricLabelA").textContent = "Cena na m²";
    $("metricA").textContent = `${number.format(Math.round(perM2))} Kč`;
    $("metricLabelB").textContent = "Povinný scope";
    $("metricB").textContent = `${required.length - missing.length}/${required.length} položek`;
    $("metricLabelC").textContent = "Chybějící klíčové části";
    $("metricC").textContent = missing.length ? `${missing.length}` : "0";

    if (missing.length) {
      $("resultCallout").innerHTML = `<strong>Nejdřív doplňte scope</strong><p>V nabídce nejsou označeny: ${missing.map((key) => itemLabels[key]).join(", ")}. Nižší celková cena může být pouze důsledkem odlišného rozsahu.</p>`;
    } else {
      $("resultCallout").innerHTML = `<strong>Scope checklist je kompletní</strong><p>Teď má smysl porovnat výměry, specifikace, DPH, výluky a jednotkové ceny. Komín a schodiště zůstávají projektově podmíněné položky.</p>`;
    }

    lastSummary = `Nabídka hrubé stavby: ${money.format(Math.round(price))}; ${number.format(area)} m²; ${number.format(Math.round(perM2))} Kč/m². Povinný scope ${required.length - missing.length}/${required.length}. ${missing.length ? `Chybí: ${missing.map((key) => itemLabels[key]).join(", ")}.` : "Základní scope checklist kompletní."}`;
    renderSourceMap({ area, basis, scope, delivery: "firm" });
  }

  function setMode(mode) {
    activeMode = mode === "offer" ? "offer" : "plan";
    document.querySelectorAll("[data-tab]").forEach((button) => {
      const active = button.dataset.tab === activeMode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
    });
    $("panelPlan").hidden = activeMode !== "plan";
    $("panelOffer").hidden = activeMode !== "offer";
    activeMode === "plan" ? renderPlan() : renderOffer();
  }

  function applyPreset(scope) {
    const checked = new Set(scope === "closed"
      ? ["earth","foundation","waterproof","walls","ceiling","roofStructure","roofCover","windows","site","transport"]
      : ["earth","foundation","waterproof","walls","ceiling","roofStructure","roofCover","site","transport"]);
    document.querySelectorAll("[data-scope-item]").forEach((el) => { el.checked = checked.has(el.dataset.scopeItem); });
    const radio = document.querySelector(`input[name="offerScope"][value="${scope}"]`);
    if (radio) radio.checked = true;
    renderOffer();
  }

  function copySummary() {
    const text = lastSummary;
    if (!text) return;
    const button = $("copyResult");
    const done = () => {
      const old = button.textContent;
      button.textContent = "Zkopírováno";
      window.setTimeout(() => { button.textContent = old; }, 1400);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  }

  function fallbackCopy(text, callback) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); callback(); } catch (_) {}
    ta.remove();
  }

  document.querySelectorAll("[data-tab]").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.tab)));

  ["planArea","planBasis","planDelivery","planReserve"].forEach((id) => $(id)?.addEventListener("input", renderPlan));
  document.querySelectorAll('input[name="planScope"]').forEach((el) => el.addEventListener("change", renderPlan));

  ["offerPrice","offerArea","offerBasis"].forEach((id) => $(id)?.addEventListener("input", renderOffer));
  document.querySelectorAll('input[name="offerScope"]').forEach((el) => el.addEventListener("change", renderOffer));
  document.querySelectorAll("[data-scope-item]").forEach((el) => el.addEventListener("change", renderOffer));
  document.querySelectorAll("[data-scope-preset]").forEach((button) => button.addEventListener("click", () => applyPreset(button.dataset.scopePreset)));

  $("copyResult")?.addEventListener("click", copySummary);

  const menuToggle = $("menuToggle");
  const mainNav = $("mainNav");
  menuToggle?.addEventListener("click", () => {
    const open = mainNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Zavřít navigaci" : "Otevřít navigaci");
  });
  mainNav?.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
    mainNav.classList.remove("is-open");
    menuToggle?.setAttribute("aria-expanded", "false");
  }));

  setMode("plan");
})();
