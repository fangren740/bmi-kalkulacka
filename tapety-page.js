/* DOM adapter for the isolated wallpaper calculator. */
(() => {
  'use strict';
  const core = window.RVTapety, $ = id => document.getElementById(id), form = $('tp-form');
  const fmt = core.format, cm = n => `${fmt(n)} cm`, m = n => `${fmt(n, 'm')} m`;
  let printDetails = [];
  window.addEventListener('afterprint', () => { printDetails.forEach(([el,open]) => el.open = open); printDetails = []; });
  let current = null, touched = new Set(), removed = null;
  function raw() {
    const v = {};
    ['height','rollWidth','rollLength','trimTop','trimBottom','match','repeat','offset'].forEach(id => { v[id] = $(id).value; });
    v.aligned = $('aligned').checked; v.openings = $('openings').checked;
    v.walls = Array.from($('walls').children, (_, i) => ({width:$(`wall-${i}-width`).value,height:$(`wall-${i}-height`).value,customHeight:$(`wall-${i}-custom`).checked}));
    return v;
  }
  function updatePreview() {
    const wall = $('visual-wall'), strips = $('visual-strips');
    if (!wall || !strips || !$('height') || !$('wall-0-width') || !$('rollWidth')) return;
    const width = core.parseLength($('wall-0-width').value, 'm');
    const custom = $('wall-0-custom')?.checked;
    const hSource = custom ? $('wall-0-height')?.value : $('height').value;
    const height = core.parseLength(hSource, 'm');
    const rollWidth = core.parseLength($('rollWidth').value, 'cm');
    if (width.kind === 'valid') $('visual-width').textContent = `${fmt(width.value, 'm')} m`;
    if (height.kind === 'valid') $('visual-height').textContent = `${fmt(height.value, 'm')} m`;
    strips.replaceChildren();
    if (width.kind !== 'valid' || rollWidth.kind !== 'valid' || width.value <= 0 || rollWidth.value <= 0) return;
    const count = Math.max(1, Math.min(16, Math.ceil(width.value / rollWidth.value)));
    for (let i = 0; i < count; i += 1) strips.append(document.createElement('i'));
  }
  function errors(result, all = false) {
    form.querySelectorAll('.rv-tp-error').forEach(el => { el.hidden = true; el.textContent = ''; });
    form.querySelectorAll('[aria-invalid]').forEach(el => el.removeAttribute('aria-invalid'));
    Object.entries(result.errors || {}).forEach(([id, message]) => {
      if (!all && !touched.has(id)) return;
      const target = $(id), error = $(`${id}-error`);
      if (target) target.setAttribute('aria-invalid', 'true');
      if (error) { error.hidden = false; error.textContent = message; }
    });
    $('error-summary').hidden = true;
  }
  function invalidate() {
    current = null;
    if ($('result-region').dataset.state === 'dirty') return;
    $('result-region').dataset.state = 'dirty';
    $('answer').innerHTML = '<p>Váš řezný plán</p><h2 id="result-heading" tabindex="-1">Údaje se změnily</h2><p>Přepočítejte role a řezný plán tlačítkem pod zadáním.</p>';
    $('result-details').hidden = true; $('result-details').replaceChildren();
    $('live-status').textContent = 'Údaje se změnily. Přepočítejte řezný plán.';
  }
  function syncModes() {
    const patterned = $('match').value !== 'free', offset = $('match').value === 'offset';
    $('pattern-enabled').checked = patterned; $('pattern-options').hidden = !patterned; $('pattern-fields').hidden = !patterned; $('repeat').disabled = !patterned; $('aligned').disabled = !patterned;
    $('offset-wrap').hidden = !offset; $('offset').disabled = !offset; $('half-repeat').disabled = !offset;
    $('match-help').textContent = !patterned ? 'Volné sesazení: vzor při řezání nenavazujete.' : offset ? 'Každý další pás posune motiv po směru odvíjení o zadanou hodnotu. Ověřte, že to odpovídá návodu výrobce.' : 'Všechny pásy začínají stejným motivem. Délku zaokrouhlíme na celý raport.';
    Array.from($('walls').children).forEach((_, i) => {
      const custom = $(`wall-${i}-custom`).checked;
      $(`wall-${i}-height-wrap`).hidden = !custom; $(`wall-${i}-height`).disabled = !custom;
    });
    const top = core.parseLength($('trimTop').value,'cm'), bottom = core.parseLength($('trimBottom').value,'cm');
    $('trim-summary').textContent = top.kind === 'valid' && bottom.kind === 'valid' ? `Ořez: ${cm(top.value)} nahoře + ${cm(bottom.value)} dole` : 'Ořez: zkontrolujte hodnoty';
    $('add-wall').disabled = $('walls').children.length >= core.limits.walls;
    updatePreview();
  }
  // All variable HTML below is generated solely from validated numbers or integer indices.
  function renderWalls(walls) {
    $('walls').replaceChildren();
    walls.forEach((wall, i) => {
      const row = document.createElement('div'); row.className = 'rv-tp-wall'; row.dataset.wall = i;
      row.innerHTML = `<div class="rv-tp-wall-head"><h3>Stěna ${i+1}</h3>${walls.length > 1 ? `<button type="button" data-remove="${i}" aria-label="Odebrat stěnu ${i+1}">Odebrat</button>` : ''}</div><div class="rv-tp-field"><label for="wall-${i}-width">Šířka stěny <span>(m)</span></label><div class="rv-tp-input-wrap"><input id="wall-${i}-width" name="wall-${i}-width" inputmode="decimal" aria-describedby="wall-${i}-width-error"><span>m</span></div><small class="rv-tp-error" id="wall-${i}-width-error" hidden></small></div><details class="rv-tp-subtle-details rv-tp-custom" ${wall.customHeight ? 'open' : ''}><summary>Má tato stěna jinou výšku?</summary><label class="rv-tp-check"><input type="checkbox" id="wall-${i}-custom" name="wall-${i}-custom">Použít vlastní výšku</label><div class="rv-tp-field" id="wall-${i}-height-wrap" hidden><label for="wall-${i}-height">Výška stěny <span>(m)</span></label><div class="rv-tp-input-wrap"><input id="wall-${i}-height" name="wall-${i}-height" inputmode="decimal" aria-describedby="wall-${i}-height-error"><span>m</span></div><small class="rv-tp-error" id="wall-${i}-height-error" hidden></small></div></details>`;
      $('walls').append(row);
      $(`wall-${i}-width`).value = wall.width; $(`wall-${i}-height`).value = wall.height;
      $(`wall-${i}-custom`).checked = wall.customHeight;
    });
    touched = new Set([...touched].filter(id => !id.startsWith('wall-'))); syncModes();
  }
  function show(result, submitted) {
    current = result.state === 'valid' ? result.value : null;
    $('result-region').dataset.state = result.state;
    const details = $('result-details'); details.replaceChildren(); details.hidden = !current;
    if (!current) {
      const title = result.state === 'unavailable' ? 'Plán nelze sestavit' : result.state === 'empty' ? 'Doplňte chybějící údaje' : 'Opravte zadané údaje';
      $('answer').innerHTML = `<p>Váš řezný plán</p><h2 id="result-heading" tabindex="-1">${title}</h2><p id="result-message"></p>`;
      $('result-message').textContent = result.message || 'Zkontrolujte označená pole. Neplatný plán nelze použít k nákupu ani řezání.';
      $('live-status').textContent = `${title}. ${result.message || ''}`;
      if (submitted && result.errors) {
        const summary = $('error-summary'); summary.replaceChildren();
        const heading = document.createElement('strong'); heading.textContent = 'Zkontrolujte zadání'; summary.append(heading);
        const list = document.createElement('ul');
        Object.entries(result.errors).forEach(([id, message]) => {
          touched.add(id);
          const item = document.createElement('li'), link = document.createElement('a');
          const target = id === 'walls' ? 'add-wall' : id;
          link.href = `#${target}`; link.textContent = `${$(id)?.labels?.[0]?.textContent.trim() || 'Stěny'}: ${message}`;
          link.addEventListener('click', e => { e.preventDefault(); let el = $(target); for (let p = el?.parentElement; p; p = p.parentElement) if (p.tagName === 'DETAILS') p.open = true; el?.focus(); }); item.append(link); list.append(item);
        });
        summary.append(list); summary.hidden = false; summary.focus();
      } else if (submitted) $('result-heading').focus();
      return;
    }
    const v = current, patterned = v.input.match !== 'free', conservative = patterned && !v.input.aligned;
    const rollWord = v.rolls.length === 1 ? 'roli' : v.rolls.length <= 4 ? 'role' : 'rolí';
    const lengths = [...new Set(v.strips.map(s => s.length))];
    const resultLead = v.optimal ? 'Potřebujete minimálně' : 'Doporučujeme';
    const certainty = v.optimal
      ? 'Pro zadané pásy máme proveditelný plán se stejným počtem rolí, jaký dává matematická dolní mez — méně rolí tedy nestačí.'
      : 'Jde o konkrétní proveditelný řezný plán. U složitějšího sesazení může jiné pořadí řezů někdy využít role úsporněji.';
    $('answer').innerHTML = `<p>VÝSLEDEK JE PŘIPRAVEN</p><h2 id="result-heading" tabindex="-1"><span>${resultLead}</span> <strong>${v.rolls.length}</strong> ${rollWord} tapet</h2><p>${certainty}</p><dl class="rv-tp-kpis"><div><dt>Počet pásů</dt><dd>${v.strips.length}</dd></div><div><dt>${lengths.length === 1 ? 'Délka pásu' : 'Délky pásů'}</dt><dd>${lengths.length === 1 ? cm(lengths[0]) : `${fmt(Math.min(...lengths))}–${cm(Math.max(...lengths))}`}</dd></div><div><dt>Nařezané pásy</dt><dd>${m(v.totalCut)}</dd></div><div><dt>${conservative ? 'Zbytky nejméně' : 'Zbytky rolí'}</dt><dd>${m(v.totalLeftover)}</dd></div></dl>`;
    const context = `<div class="rv-tp-result-context"><p><strong>Role ${cm(v.input.rollWidth)} × ${m(v.input.rollLength)}.</strong> Ořez ${cm(v.input.trimTop)} nahoře + ${cm(v.input.trimBottom)} dole, již v délce pásů.</p><p>${patterned ? `${v.input.match === 'offset' ? `Přesazené sesazení: raport ${cm(v.input.repeat)}, posun ${cm(v.input.offset)}.` : `Rovné sesazení: raport ${cm(v.input.repeat)}.`} ${conservative ? `Z každé role vyhrazeno ${cm(v.input.repeat)} na nalezení stejného motivu. Uvedené zbytky jsou dolní mez; skutečné mohou být delší.` : 'Předpoklad: ověřený stejný počáteční motiv všech rolí.'}` : 'Bez návaznosti vzoru.'} Každá stěna začíná celým pásem; návaznost přes roh není zahrnuta.</p>${v.input.openings ? '<p><strong>Okna a dveře ponechány ve spotřebě.</strong> Pásy jsou přes celou výšku; materiál na ostění není připočten.</p>' : ''}</div>`;
    const walls = `<div class="rv-tp-wall-summary">${v.wallSummary.map(w => `<p><strong>Stěna ${w.wall}:</strong> ${m(w.width)} × ${m(w.height)} → ${w.count} pásů po ${cm(w.length)}. Poslední pás zakryje ${cm(w.lastWidth)} šířky.</p>`).join('')}</div>`;
    const cuts = v.rolls.map((roll, rollIndex) => {
      const bar = (value, cls = '', label = '') => value ? `<span class="${cls}" style="width:${value/v.input.rollLength*100}%">${value/v.input.rollLength >= .12 ? label : ''}</span>` : '';
      const stripRows = roll.cuts.map(s => `${s.gap ? `<li class="rv-tp-waste"><span>Dorovnat vzor před pásem ${s.id}</span><span>${cm(s.gap)}</span></li>` : ''}<li><div><strong>Pás ${s.id}</strong><br><span>Stěna ${s.wall} · pás ${s.index}${patterned ? ` · poloha vzoru ${cm(s.phase)}` : ''}</span></div><span class="rv-tp-cut-length">${cm(s.length)}</span></li>`).join('');
      return `${rollIndex === 6 ? `<details class="rv-tp-more-rolls"><summary>Zobrazit dalších ${v.rolls.length-6} rolí</summary>` : ''}<article class="rv-tp-roll"><div class="rv-tp-roll-head"><h3>Role ${roll.number}</h3><span>${roll.cuts.length} pásů · zbytek${conservative ? ' nejméně' : ''} <strong>${m(roll.leftover)}</strong></span></div><div class="rv-tp-bar" aria-hidden="true">${bar(roll.allowance,'rv-tp-bar-gap')}${roll.cuts.map(s=>bar(s.gap,'rv-tp-bar-gap')+bar(s.length,'',s.id)).join('')}${bar(roll.leftover,'rv-tp-bar-rest','Zbytek')}</div><details class="rv-tp-cut-detail"><summary>Zobrazit přesné řezy <span>↓</span></summary><p class="rv-tp-plan-note">Číslo pásu = stěna.pás. Řežte v uvedeném pořadí.${conservative ? ' Nejprve najděte společný motiv; vyhrazený raport neodřezávejte automaticky celý.' : ''}</p><ol class="rv-tp-cuts">${roll.allowance ? `<li class="rv-tp-waste"><span>Vyhrazeno na nalezení motivu*</span><span>${cm(roll.allowance)}</span></li>` : ''}${stripRows}</ol><div class="rv-tp-leftover"><span>Zbytek${conservative ? ' nejméně' : ''}</span><span>${cm(roll.leftover)}</span></div></details></article>${rollIndex === v.rolls.length-1 && rollIndex >= 6 ? '</details>' : ''}`;
    }).join('');
    const wallVisuals = `<div class="rv-tp-result-overview"><div class="rv-tp-result-overview-copy"><span class="rv-tp-overline">VAŠE STĚNY</span><h3>Takto se plocha rozdělí na celé pásy.</h3><p>Každý blok představuje jeden svislý pás tapety. Díky tomu je hned vidět, proč samotné m² nestačí.</p></div><div class="rv-tp-result-walls">${v.wallSummary.map(w => `<div class="rv-tp-result-wall-card"><div class="rv-tp-result-wall-label"><strong>Stěna ${w.wall}</strong><span>${m(w.width)} × ${m(w.height)}</span></div><div class="rv-tp-result-wall-shape">${Array.from({length:Math.min(w.count,24)},(_,idx)=>`<i${idx===w.count-1?' class="last"':''}></i>`).join('')}</div><small>${w.count} pásů po ${cm(w.length)}</small></div>`).join('')}</div></div>`;
    details.innerHTML = `${wallVisuals}<div class="rv-tp-plan-head"><div><span class="rv-tp-overline">ŘEZNÝ PLÁN ROLÍ</span><h3>Každá role má svoje řezy a zbytek.</h3></div><button type="button" id="print-plan">Vytisknout plán</button></div><div class="rv-tp-legend"><span><i></i>Celý pás</span><span><i class="rv-tp-bar-gap"></i>Dorovnání vzoru</span><span><i class="rv-tp-bar-rest"></i>Zbytek</span></div><details class="rv-tp-instructions"><summary>Jak podle plánu řezat</summary><p class="rv-tp-plan-note">Řežte shora dolů v každé roli. Číslo 2.3 znamená stěnu 2, třetí pás. Na rub napište číslo i směr nahoru. Při lepení dodržte pořadí pásů na stěně.</p>${conservative ? '<p class="rv-tp-plan-note">* Neodřezávejte slepě celý vyhrazený raport. Najděte stejný motiv jako na první roli; odtud teprve odměřujte další dorovnání a pásy.</p>' : ''}</details>${cuts}<details class="rv-tp-breakdown"><summary>Rozměry, předpoklady a spotřeba podrobně</summary>${context}${walls}<section class="rv-tp-accounting" aria-labelledby="material-heading"><h3 id="material-heading">Kam se délka role rozdělila</h3><dl><dt>Délka koupených rolí</dt><dd>${m(v.rolls.length*v.input.rollLength)}</dd><dt>Nařezané pásy celkem</dt><dd>${m(v.totalCut)}</dd><dt>Z toho horní a dolní ořez</dt><dd>${m(v.trimTotal)}</dd><dt>Z toho prodloužení na raport</dt><dd>${m(v.repeatExtra)}</dd><dt>Odřezky mezi pásy na sesazení</dt><dd>${m(v.alignmentWaste)}</dd><dt>Vyhrazeno na počátky rolí</dt><dd>${m(v.startAllowance)}</dd><dt>Zbytky rolí${conservative ? ' nejméně' : ''}</dt><dd>${m(v.totalLeftover)}</dd></dl><small>Ořez a prodloužení na raport jsou už součástí pásů, nepřičítejte je znovu. Toto je rozpad délky, ne výměra odpadu v m². Podélné ořezy ani výřezy otvorů zde nejsou vyčíslené.</small></section></details><p class="rv-tp-notice">Před řezáním ověřte etiketu, šarži, skutečnou délku a návaznost prvních pásů. Zbytky automaticky nenahrazují náhradní roli na chybu při lepení.</p>`;
    $('print-plan').addEventListener('click', () => { if (current) { printDetails = [...details.querySelectorAll('details')].map(el => [el,el.open]); printDetails.forEach(([el]) => el.open = true); window.print(); } });
    $('live-status').textContent = `${v.optimal ? 'Minimálně' : 'Doporučený počet'} ${v.rolls.length} ${rollWord}, ${v.strips.length} pásů. Řezný plán je připraven.`;
    if (submitted) $('result-heading').focus();
  }
  function calculate(submitted = false) {
    try { const result = core.run(raw()); errors(result, submitted); show(result, submitted); }
    catch (error) { console.error('Tapety calculation failed', error); show({state:'unavailable',message:'Výpočet se nepodařilo dokončit. Obnovte výchozí hodnoty a zkuste zadání znovu.'}, submitted); }
  }
  function validateRaw() {
    const parsed = core.parse(raw());
    return parsed.state === 'parsed' ? core.validate(parsed.value) : parsed;
  }
  form.addEventListener('submit', e => { e.preventDefault(); calculate(true); });
  $('pattern-enabled').addEventListener('change', () => { $('match').value = $('pattern-enabled').checked ? 'straight' : 'free'; syncModes(); });
  form.addEventListener('input', e => { if(e.target.id !== 'pattern-enabled') syncModes(); invalidate(); errors(validateRaw()); });
  form.addEventListener('change', () => { syncModes(); invalidate(); errors(validateRaw()); });
  form.addEventListener('focusout', e => { if (e.target.matches('input,select')) { touched.add(e.target.id); errors(validateRaw()); } });
  $('add-wall').addEventListener('click', () => {
    const walls = raw().walls;
    if (walls.length >= core.limits.walls) return;
    walls.push({width:'',height:$('height').value,customHeight:false});renderWalls(walls);invalidate();$(`wall-${walls.length-1}-width`).focus();
  });
  $('walls').addEventListener('click', e => {
    const button = e.target.closest('[data-remove]'); if (!button) return;
    const walls = raw().walls, index = Number(button.dataset.remove);removed = {index,wall:walls[index]};walls.splice(index,1);
    renderWalls(walls);invalidate();$('undo-wall').hidden = false;$('add-wall').focus();$('live-status').textContent = 'Stěna odebrána. Můžete ji vrátit.';
  });
  $('undo-wall').addEventListener('click', () => {
    if (!removed) return;
    const walls = raw().walls;
    if (walls.length >= core.limits.walls) { $('live-status').textContent = 'Nejprve odeberte jednu stěnu. Limit je 30 stěn.'; return; }
    const index = Math.min(removed.index,walls.length);walls.splice(index,0,removed.wall);renderWalls(walls);removed = null;$('undo-wall').hidden = true;invalidate();$(`wall-${index}-width`).focus();
  });
  $('half-repeat').addEventListener('click', () => {
    const parsed = core.parseLength($('repeat').value,'cm');
    if (parsed.kind !== 'valid' || parsed.value <= 0 || parsed.value % 2) {
      const message = 'Polovinu raportu nelze zadat v přesnosti 1 mm. Ověřte raport a posun na etiketě.';
      $('live-status').textContent = message; $('repeat-error').textContent = message; $('repeat-error').hidden = false;
      return;
    }
    $('offset').value = fmt(parsed.value/2);invalidate();errors(validateRaw());$('offset').focus();
  });
  $('reset').addEventListener('click', () => {
    form.reset();form.querySelectorAll('details').forEach(el => el.open = false);touched.clear();removed = null;$('undo-wall').hidden = true;
    renderWalls([{width:'4',height:'2,5',customHeight:false}]);syncModes();calculate();$('height').focus();
  });
  syncModes();calculate();
})();
