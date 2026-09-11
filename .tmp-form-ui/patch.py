from pathlib import Path
import re

ROOT=Path('.')
html_path=ROOT/'prepocet-formy-na-peceni.html'
js_path=ROOT/'prepocet-formy-page.js'
html=html_path.read_text(encoding='utf-8')
js=js_path.read_text(encoding='utf-8')

css=r'''
/* ===== ingredient editor UX polish 2026-09-11 ===== */
.ingredients{padding:34px 34px 32px;background:linear-gradient(180deg,#fff 0%,#fbfdff 100%)}
.ing-top{display:flex;justify-content:space-between;align-items:center;gap:24px;margin-bottom:18px}
.ing-top h3{display:flex;align-items:center;gap:11px;margin:0;font-size:24px;letter-spacing:-.025em;color:var(--ink)}
.ing-top h3:before{content:"";display:inline-block;width:20px;height:27px;border-radius:90% 12% 90% 12%;background:linear-gradient(145deg,#67df70,#35aa47);transform:rotate(-28deg);box-shadow:0 6px 14px rgba(52,168,71,.18)}
.ing-top p{margin:5px 0 0;color:#667b90;font-size:12px;line-height:1.5}
.add{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:46px;padding:0 17px;border:1px solid rgba(35,151,227,.4);border-radius:11px;background:linear-gradient(180deg,#fff,#f6fbff);color:#1166b4;font-size:11px;font-weight:950;box-shadow:0 7px 18px rgba(35,151,227,.08);transition:transform .15s ease,border-color .15s ease,box-shadow .15s ease}
.add:hover{transform:translateY(-1px);border-color:#2397e3;box-shadow:0 10px 22px rgba(35,151,227,.13)}
.add:focus-visible{outline:3px solid rgba(35,151,227,.2);outline-offset:2px}
.add-plus{font-size:22px;line-height:1;font-weight:600}
.recipe-presets{margin-bottom:16px}
.table{overflow:visible;border:0;border-radius:0;background:transparent}
.th{display:grid;grid-template-columns:minmax(0,1.6fr) 190px 150px 56px;gap:12px;padding:0 16px 7px;background:transparent;color:#667c92;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}
.th>div{padding:0;border:0}
#rows{display:grid;gap:12px}
.tr{display:grid;grid-template-columns:minmax(0,1.6fr) 190px 150px 56px;gap:12px;align-items:end;padding:14px 16px;border:1px solid #dbe5ec;border-radius:14px;background:#fff;box-shadow:0 8px 24px rgba(7,26,51,.045)}
.tr>div{padding:0;border:0;min-width:0}
.cell-label{display:none;margin:0 0 6px;color:#536b82;font-size:9px;font-weight:900}
.tr input,.tr select{display:block;width:100%;min-width:0;height:48px;padding:0 14px;border:1px solid #cbd8e2;border-radius:10px;outline:0;background:#fff;color:var(--ink);font-size:15px;font-weight:800;box-shadow:inset 0 1px 2px rgba(7,26,51,.02);transition:border-color .15s ease,box-shadow .15s ease,background .15s ease}
.tr select{padding-right:34px;cursor:pointer}
.tr input:hover,.tr select:hover{border-color:#aebfcd;background:#fcfdff}
.tr input:focus,.tr select:focus{border-color:#2397e3;background:#fff;box-shadow:0 0 0 3px rgba(35,151,227,.11)}
.tr .amount{font-size:15px;font-weight:900;font-variant-numeric:tabular-nums}
.remove{display:grid;place-items:center;width:48px;height:48px;border:1px solid #f0c8ce;border-radius:10px;background:#fff3f5;color:#d43b50;transition:background .15s ease,border-color .15s ease,transform .15s ease}
.remove:hover{transform:translateY(-1px);border-color:#e99da8;background:#ffe9ed}
.remove:focus-visible{outline:3px solid rgba(212,59,80,.15);outline-offset:2px}
.remove svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.ingredient-helper{display:grid;grid-template-columns:auto 1fr;gap:11px;align-items:center;margin-top:16px;padding:14px 16px;border:1px solid #d6e9f7;border-radius:12px;background:linear-gradient(90deg,#eef7ff,#f7fbff)}
.ingredient-helper i{display:grid;place-items:center;width:30px;height:30px;border-radius:50%;background:#3b8eea;color:#fff;font-style:normal;font-size:13px;font-weight:950;box-shadow:0 6px 14px rgba(59,142,234,.18)}
.ingredient-helper strong{display:block;color:#244057;font-size:10px}.ingredient-helper span{display:block;margin-top:2px;color:#688096;font-size:9px;line-height:1.45}
@media(max-width:860px){
  .th,.tr{grid-template-columns:minmax(0,1.4fr) 140px 120px 52px}
}
@media(max-width:680px){
  .ingredients{padding:24px 14px 24px}
  .ing-top{display:flex;flex-direction:column;align-items:stretch;gap:13px;margin-bottom:14px}
  .ing-top h3{font-size:22px}.ing-top p{font-size:11px}
  .add{width:100%;min-height:48px;font-size:12px}
  .recipe-presets{margin-bottom:14px}
  .th{display:none}
  #rows{gap:11px}
  .tr{grid-template-columns:minmax(0,1fr) 96px 48px;grid-template-areas:"name name name" "amount unit remove";gap:10px 8px;padding:13px;border-radius:13px;align-items:end}
  .ing-name{grid-area:name}.ing-amount{grid-area:amount}.ing-unit{grid-area:unit}.ing-remove{grid-area:remove}
  .cell-label{display:block}
  .tr input,.tr select{height:46px;padding:0 11px;font-size:14px;border-radius:9px}
  .tr .amount{font-size:14px}
  .remove{width:46px;height:46px;border-radius:9px}
  .ingredient-helper{margin-top:13px;padding:12px 13px}
}
'''
if 'ingredient editor UX polish 2026-09-11' in html:
    raise SystemExit('ingredient UI CSS already present')
html=html.replace('</style>',css+'\n</style>',1)

old_head='<div class="ingredients"><div class="ing-top"><div><h3>Suroviny receptu</h3><p>Zadejte vlastní suroviny. Nové množství se počítá automaticky.</p></div><button type="button" class="add" id="addIng">+ Přidat surovinu</button></div>'
new_head='<div class="ingredients"><div class="ing-top"><div><h3>Suroviny receptu</h3><p>Zadejte suroviny receptu – množství se při přepočtu automaticky upraví.</p></div><button type="button" class="add" id="addIng"><span class="add-plus" aria-hidden="true">+</span><span>Přidat surovinu</span></button></div>'
if old_head not in html:
    raise SystemExit('ingredient header marker not found')
html=html.replace(old_head,new_head,1)

if '/prepocet-formy-page.js?v=20260911-2' not in html:
    raise SystemExit('expected page JS cachebuster not found')
html=html.replace('/prepocet-formy-page.js?v=20260911-2','/prepocet-formy-page.js?v=20260911-3',1)

old_markup='''row.innerHTML=`<div><input aria-label="Název suroviny" data-i="${i}" data-k="name" value="${String(x.name).replace(/"/g,"&quot;")}"></div>\n<div><input class="amount" aria-label="Množství" data-i="${i}" data-k="amount" inputmode="decimal" value="${String(x.amount).replace(".",",")}"></div>\n<div><select aria-label="Jednotka" data-i="${i}" data-k="unit">${["g","kg","ml","l","ks","lžíce","lžička"].map(u=>`<option ${u===x.unit?"selected":""}>${u}</option>`).join("")}</select></div>\n<div><button class="remove" aria-label="Odebrat surovinu" data-remove="${i}" type="button">×</button></div>`;'''
new_markup='''row.innerHTML=`<div class="ing-cell ing-name"><span class="cell-label">Název suroviny</span><input aria-label="Název suroviny" data-i="${i}" data-k="name" value="${String(x.name).replace(/"/g,"&quot;")}"></div>\n<div class="ing-cell ing-amount"><span class="cell-label">Množství</span><input class="amount" aria-label="Množství" data-i="${i}" data-k="amount" inputmode="decimal" value="${String(x.amount).replace(".",",")}"></div>\n<div class="ing-cell ing-unit"><span class="cell-label">Jednotka</span><select aria-label="Jednotka" data-i="${i}" data-k="unit">${["g","kg","ml","l","ks","lžíce","lžička"].map(u=>`<option ${u===x.unit?"selected":""}>${u}</option>`).join("")}</select></div>\n<div class="ing-cell ing-remove"><button class="remove" aria-label="Odebrat surovinu ${String(x.name)}" title="Odebrat surovinu" data-remove="${i}" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg></button></div>`;'''
if old_markup not in js:
    raise SystemExit('row markup marker not found')
js=js.replace(old_markup,new_markup,1)

old_add='''$("addIng").addEventListener("click",()=>{ingredients.push({name:"Nová surovina",amount:100,unit:"g"});renderRows();calc(false)});'''
new_add='''$("addIng").addEventListener("click",()=>{ingredients.push({name:"Nová surovina",amount:100,unit:"g"});renderRows();calc(false);const last=document.querySelector(`#rows [data-i="${ingredients.length-1}"][data-k="name"]`);if(last){last.focus();last.select()}});'''
if old_add not in js:
    raise SystemExit('add ingredient handler marker not found')
js=js.replace(old_add,new_add,1)

html_path.write_text(html,encoding='utf-8')
js_path.write_text(js,encoding='utf-8')

# Final release commit must contain only product files.
wf=ROOT/'.github/workflows/form-ingredient-ui-hotfix.yml'
if wf.exists(): wf.unlink()
import shutil
shutil.rmtree(ROOT/'.tmp-form-ui')
print('ingredient UI patch applied')
