(()=>{
  'use strict';
  const q=(s,r=document)=>r.querySelector(s), qa=(s,r=document)=>[...r.querySelectorAll(s)];
  const money=n=>new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(Math.round(Number(n)||0))+' Kč';
  const shortRange=(a,b)=>`${new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(a/1000)}–${new Intl.NumberFormat('cs-CZ',{maximumFractionDigits:0}).format(b/1000)} tis. Kč`;

  const menu=q('#menuToggle'), mobile=q('#mobileNav');
  if(menu&&mobile){
    const close=()=>{menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Otevřít navigaci');mobile.classList.remove('is-open')};
    menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));menu.setAttribute('aria-label',open?'Otevřít navigaci':'Zavřít navigaci');mobile.classList.toggle('is-open',!open)});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  }

  const scopes={
    refresh:{min:70000,max:100000,kicker:'Rychlý cenový rámec',copy:'Dvě veřejné české reference pro rok 2026 uvádějí u renovace funkční stávající kuchyně přibližně stejné pásmo.',inc:'dvířka · desku · drobné úpravy',exc:'novou kompletní linku a rozvody',source:'Veřejné orientace RealFree + NejŘemeslníci, kontrola 19. 8. 2026.'},
    complete:{min:250000,max:400000,kicker:'Kompletní rekonstrukce',copy:'RealFree i NejŘemeslníci uvádějí pro kompletní rekonstrukci kuchyně v roce 2026 pásmo 250–400 tis. Kč.',inc:'novou linku · spotřebiče · povrchy · rozvody',exc:'luxusní atypy nebo skryté stavební problémy',source:'Dvě nezávislé veřejné české reference 2026, kontrola 19. 8. 2026.'},
    layout:{min:280000,max:500000,kicker:'Změna dispozice / rozvodů',copy:'Regionální reference StavDAM pro Prahu a Středočeský kraj uvádí u větší přestavby se změnou dispozice přibližně 280–500 tis. Kč.',inc:'větší stavební zásahy · nové rozvody',exc:'celostátní univerzální ceník',source:'Regionální firemní reference Praha / Středočeský kraj; používáme ji odděleně.'},
    own:{min:null,max:null,kicker:'Váš vlastní rozpočet',copy:'Veřejný rámec teď neřídí výsledek. Vyplňte níže částky z konkrétních nabídek a dostanete jejich čistý součet.',inc:'jen to, co sami zadáte',exc:'žádné automaticky přidané ceny',source:'Vlastní vstupy uživatele mají přednost před veřejnými orientacemi.'}
  };
  let activeScope='refresh';
  const resultRange=q('#resultRange'),resultKicker=q('#resultKicker'),resultCopy=q('#resultCopy'),resultIncludes=q('#resultIncludes'),resultExcludes=q('#resultExcludes'),resultSource=q('#resultSource');
  function renderScope(){
    const s=scopes[activeScope];
    if(resultKicker)resultKicker.textContent=s.kicker;
    if(resultRange)resultRange.textContent=s.min===null?'Zadejte vlastní částky':shortRange(s.min,s.max);
    if(resultCopy)resultCopy.textContent=s.copy;
    if(resultIncludes)resultIncludes.textContent=s.inc;
    if(resultExcludes)resultExcludes.textContent=s.exc;
    if(resultSource)resultSource.textContent=s.source;
    renderBudget();
  }
  qa('input[name="scope"]').forEach(el=>el.addEventListener('change',()=>{if(el.checked){activeScope=el.value;renderScope()}}));

  const budgetIds=['costFurniture','costAppliances','costInstall','costDemo','costElectric','costWater','costSurfaces','costOther'];
  function readNum(id){const el=q('#'+id);return Math.max(0,Number(el?.value)||0)}
  function renderBudget(){
    const vals=budgetIds.map(readNum), subtotal=vals.reduce((a,b)=>a+b,0), reservePct=Math.max(0,Math.min(50,readNum('reservePct'))), reserve=subtotal*reservePct/100,total=subtotal+reserve,filled=vals.filter(v=>v>0).length;
    q('#ownSubtotal').textContent=money(subtotal);q('#ownReserve').textContent=money(reserve);q('#ownTotal').textContent=money(total);q('#ownFilled').textContent=`${filled} z 8 položek vyplněno`;q('#ownFillBar').style.width=`${filled/8*100}%`;
    const cmp=q('#ownComparison');
    if(!cmp)return;
    if(subtotal===0){cmp.textContent=activeScope==='own'?'Začněte vyplněním částek, které už máte v nabídkách.':'Jakmile zadáte vlastní částky, porovnáme je s veřejným rámcem zvoleného rozsahu.';return;}
    const s=scopes[activeScope];
    if(!s||s.min===null){cmp.textContent='Tento výsledek tvoří pouze vaše zadané částky. Nic dalšího jsme automaticky nepřičetli.';return;}
    if(total<s.min)cmp.textContent=`Váš součet je pod veřejným rámcem ${shortRange(s.min,s.max)}. Zkontrolujte, zda v nabídce nechybí některý větší balík.`;
    else if(total>s.max)cmp.textContent=`Váš součet je nad veřejným rámcem ${shortRange(s.min,s.max)}. Může to být zcela v pořádku — veřejný rámec nezná váš standard ani atypy.`;
    else cmp.textContent=`Váš součet leží uvnitř veřejného rámce ${shortRange(s.min,s.max)}. Teď je důležité zkontrolovat hlavně rozsah nabídky.`;
  }
  budgetIds.concat('reservePct').forEach(id=>q('#'+id)?.addEventListener('input',renderBudget));
  q('#resetBudget')?.addEventListener('click',()=>{budgetIds.concat('reservePct').forEach(id=>{const el=q('#'+id);if(el)el.value='0'});renderBudget()});

  function renderInstall(){
    const count=Math.max(1,Math.min(40,Math.round(readNum('cabinetCount')||1))), type=q('input[name="installType"]:checked')?.value||'basic', rate=type==='complete'?1690:1390, verify=q('#includeVerify')?.checked?1490:0,total=count*rate+verify;
    q('#installTotal').textContent=money(total);
    q('#installExplain').textContent=`${count} skříněk × ${new Intl.NumberFormat('cs-CZ').format(rate)} Kč${verify?' + 1 490 Kč verifikace plánu':''}. Doprava montážního týmu a atypické práce v tomto součtu nejsou.`;
  }
  q('#cabinetCount')?.addEventListener('input',renderInstall);qa('input[name="installType"]').forEach(el=>el.addEventListener('change',renderInstall));q('#includeVerify')?.addEventListener('change',renderInstall);

  function renderAudit(){
    const boxes=qa('#auditList input[type="checkbox"]'), checked=boxes.filter(x=>x.checked).length, missing=boxes.length-checked;
    q('#auditScore').textContent=`${checked} / ${boxes.length}`;q('#auditBar').style.width=`${checked/boxes.length*100}%`;
    q('#auditText').textContent=missing===0?'Všech devět kontrolních oblastí máte označených jako součást nabídky.':missing===1?'Jedna kontrolní oblast zatím není označena jako součást nabídky.':`${missing} kontrolních oblastí zatím není označeno jako součást nabídky.`;
  }
  qa('#auditList input[type="checkbox"]').forEach(el=>el.addEventListener('change',renderAudit));

  renderScope();renderInstall();renderAudit();
})();
