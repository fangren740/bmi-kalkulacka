(() => {
  "use strict";
  const $ = id => document.getElementById(id);
  const form = $("ratioForm");
  if (!form) return;
  const nf = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 6 });
  const presets = {
    shopping:{relation:"direct",a:3,b:120,c:5,x:null,left:"Množství",leftUnit:"kusů",right:"Cena",rightUnit:"Kč",question:"Když 3 kusy stojí 120 Kč, kolik stojí 5 kusů?"},
    recipe:{relation:"direct",a:4,b:300,c:7,x:null,left:"Porce",leftUnit:"porce",right:"Mouka",rightUnit:"g",question:"Na 4 porce je potřeba 300 g mouky. Kolik na 7 porcí?"},
    workers:{relation:"inverse",a:4,b:12,c:6,x:null,left:"Pracovníci",leftUnit:"osob",right:"Čas",rightUnit:"h",question:"4 pracovníci zvládnou úkol za 12 hodin. Za jak dlouho ho zvládne 6 pracovníků?"},
    speed:{relation:"inverse",a:80,b:3,c:120,x:null,left:"Rychlost",leftUnit:"km/h",right:"Čas",rightUnit:"h",question:"Při 80 km/h trvá stejná cesta 3 hodiny. Jak dlouho při 120 km/h?"},
    map:{relation:"direct",a:5,b:2,c:8,x:null,left:"Na mapě",leftUnit:"cm",right:"Ve skutečnosti",rightUnit:"km",question:"5 cm na mapě odpovídá 2 km. Kolik kilometrů odpovídá 8 cm?"}
  };
  let relation = "direct";
  let unknown = "x";
  let activePreset = "shopping";
  const ids = ["a","b","c","x"];
  const fieldId = k => ({a:"valueA",b:"valueB",c:"valueC",x:"valueX"})[k];
  const parse = v => {
    const s = String(v ?? "").trim().replace(/\s/g, "").replace(",", ".");
    if (!s || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(s)) return NaN;
    return Number(s);
  };
  const fmt = (n, mode = $("rounding")?.value || "auto") => {
    if (!Number.isFinite(n)) return "—";
    let value=n;
    if(mode==="whole") value=Math.round(n);
    if(mode==="up") value=Math.ceil(n);
    if(mode==="down") value=Math.floor(n);
    if(mode==="2") return new Intl.NumberFormat("cs-CZ",{minimumFractionDigits:2,maximumFractionDigits:2}).format(value);
    return nf.format(value);
  };
  const rawFmt = n => new Intl.NumberFormat("cs-CZ",{maximumFractionDigits:6}).format(n);
  const values = () => Object.fromEntries(ids.map(k => [k, parse($(fieldId(k)).value)]));
  function solve(vals, rel=relation, unk=unknown){
    const {a,b,c,x}=vals;
    if(rel==="direct"){
      if(unk==="x") return b*c/a;
      if(unk==="a") return b*c/x;
      if(unk==="b") return a*x/c;
      return a*x/b;
    }
    if(unk==="x") return a*b/c;
    if(unk==="a") return c*x/b;
    if(unk==="b") return c*x/a;
    return a*b/x;
  }
  const requiredKnown = () => ids.filter(k=>k!==unknown);
  function setRelation(next){
    relation=next;
    [$("directBtn"),$("inverseBtn")].forEach(btn=>{ const on=btn.dataset.relation===next; btn.classList.toggle("is-active",on); btn.setAttribute("aria-pressed",String(on)); });
    render();
  }
  function setUnknown(next){
    unknown=next;
    document.querySelectorAll('input[name="unknown"]').forEach(r=>r.checked=r.value===next);
    ids.forEach(k=>{
      const input=$(fieldId(k)); const cell=input.closest(".ratio69-cell");
      const isUnknown=k===next;
      input.readOnly=isUnknown;
      if(isUnknown) input.value="";
      cell.classList.toggle("is-answer",isUnknown);
      const label=cell.querySelector(":scope > span");
      if(label) label.textContent=`${k.toUpperCase()} · ${isUnknown?"hledaná hodnota":(k==="a"||k==="b"?"známá situace":"nová situace")}`;
    });
    render();
  }
  function applyPreset(name){
    const p=presets[name]; if(!p) return;
    activePreset=name;
    document.querySelectorAll("[data-preset]").forEach(btn=>{ const on=btn.dataset.preset===name; btn.classList.toggle("is-active",on); btn.setAttribute("aria-pressed",String(on)); });
    $("leftLabel").value=p.left; $("leftUnit").value=p.leftUnit; $("rightLabel").value=p.right; $("rightUnit").value=p.rightUnit;
    $("valueA").value=String(p.a).replace(".",","); $("valueB").value=String(p.b).replace(".",","); $("valueC").value=String(p.c).replace(".",",");
    unknown="x"; document.querySelector('input[name="unknown"][value="x"]').checked=true;
    ids.forEach(k=>{const input=$(fieldId(k));input.readOnly=k==="x";input.closest(".ratio69-cell").classList.toggle("is-answer",k==="x");});
    setRelation(p.relation);
    syncLabels(); render();
  }
  function syncLabels(){
    const left=$("leftLabel").value.trim()||"První veličina"; const lu=$("leftUnit").value.trim(); const right=$("rightLabel").value.trim()||"Druhá veličina"; const ru=$("rightUnit").value.trim();
    $("leftNameHead").textContent=left; $("rightNameHead").textContent=right; $("leftUnitHead").textContent=lu; $("rightUnitHead").textContent=ru;
    $("unitA").textContent=lu; $("unitC").textContent=lu; $("unitB").textContent=ru; $("unitX").textContent=ru;
    $("resultUnit").textContent=(unknown==="a"||unknown==="c")?lu:ru;
  }
  function validate(vals){
    let ok=true; $("formError").hidden=true;
    ids.forEach(k=>{ const err=$("error"+k.toUpperCase()); if(err) err.textContent=""; });
    for(const k of requiredKnown()){
      const n=vals[k]; const err=$("error"+k.toUpperCase());
      if(!Number.isFinite(n)){ if(err) err.textContent="Zadejte číslo."; ok=false; }
      else if(n===0){ if(err) err.textContent="Nula zde vede k neplatnému dělení."; ok=false; }
    }
    if(!ok){$("formError").hidden=false;$("formError").textContent="Zkontrolujte tři známé hodnoty. Musí být číselné a v tomto modelu nenulové.";}
    return ok;
  }
  function buildQuestion(vals){
    const left=$("leftLabel").value.trim().toLowerCase()||"první veličina"; const right=$("rightLabel").value.trim().toLowerCase()||"druhá veličina"; const lu=$("leftUnit").value.trim(); const ru=$("rightUnit").value.trim();
    if(unknown==="x" && Number.isFinite(vals.a)&&Number.isFinite(vals.b)&&Number.isFinite(vals.c)) return `${rawFmt(vals.a)} ${lu} odpovídá ${rawFmt(vals.b)} ${ru}. Kolik ${right} odpovídá ${rawFmt(vals.c)} ${lu}?`;
    return `Hledáme hodnotu ${unknown.toUpperCase()} tak, aby mezi oběma řádky zůstala ${relation==="direct"?"stejná přímá úměra":"stejná nepřímá úměra"}.`;
  }
  function render(){
    syncLabels();
    const vals=values();
    if(!validate(vals)){ $(fieldId(unknown)).value=""; $("resultValue").textContent="—"; return false; }
    const result=solve(vals); if(!Number.isFinite(result)){ $("formError").hidden=false; $("formError").textContent="Výsledek není konečné číslo. Zkontrolujte vstupy."; return false; }
    vals[unknown]=result; $(fieldId(unknown)).value=fmt(result);
    const lu=$("leftUnit").value.trim(), ru=$("rightUnit").value.trim(); const resultUnit=(unknown==="a"||unknown==="c")?lu:ru;
    $("resultValue").textContent=fmt(result); $("resultUnit").textContent=resultUnit;
    $("liveQuestion").textContent=buildQuestion(vals);
    const a=vals.a,b=vals.b,c=vals.c,x=vals.x;
    if(relation==="direct"){
      const rate1=b/a, rate2=x/c, factor=c/a;
      $("equation").textContent=unknown==="x"?`${rawFmt(b)} × ${rawFmt(c)} ÷ ${rawFmt(a)} = ${fmt(result)}`:`Výpočet ${unknown.toUpperCase()} podle rovnosti poměrů`;
      $("formula").textContent="b ÷ a = x ÷ c";
      $("checkEquation").textContent=`${rawFmt(b)} ÷ ${rawFmt(a)} = ${rawFmt(x)} ÷ ${rawFmt(c)} = ${rawFmt(rate1)}`;
      $("checkText").textContent="jednotkový poměr je stejný";
      $("relationBadge").textContent="PŘÍMÁ ÚMĚRA";
      $("directionTitle").textContent=factor>=1?"Obě veličiny rostou společně.":"Obě veličiny klesají společně.";
      $("directionText").textContent=`První veličina se změnila ${rawFmt(factor)}× a druhá se při přímé úměře mění stejným poměrem.`;
    } else {
      const prod1=a*b, prod2=c*x, factor=c/a;
      $("equation").textContent=unknown==="x"?`${rawFmt(a)} × ${rawFmt(b)} ÷ ${rawFmt(c)} = ${fmt(result)}`:`Výpočet ${unknown.toUpperCase()} podle rovnosti součinů`;
      $("formula").textContent="a × b = c × x";
      $("checkEquation").textContent=`${rawFmt(a)} × ${rawFmt(b)} = ${rawFmt(c)} × ${rawFmt(x)} = ${rawFmt(prod1)}`;
      $("checkText").textContent="součin obou veličin je stejný";
      $("relationBadge").textContent="NEPŘÍMÁ ÚMĚRA";
      $("directionTitle").textContent=factor>=1?"První roste, druhá klesá.":"První klesá, druhá roste.";
      $("directionText").textContent=`První veličina se změnila ${rawFmt(factor)}×; při nepřímé úměře se druhá mění opačným poměrem.`;
    }
    const altRel=relation==="direct"?"inverse":"direct"; const alt=solve(vals,altRel,unknown); $("alternative").textContent=`${fmt(alt)} ${resultUnit}`.trim();
    const leftName=$("leftLabel").value.trim()||"první veličina", rightName=$("rightLabel").value.trim()||"druhá veličina";
    $("resultSentence").textContent=`Hledaná hodnota ${unknown.toUpperCase()} je ${fmt(result)} ${resultUnit}. Vztah počítáme jako ${relation==="direct"?"přímou":"nepřímou"} úměru mezi „${leftName}“ a „${rightName}“.`;
    return true;
  }
  document.querySelectorAll("[data-preset]").forEach(btn=>btn.addEventListener("click",()=>applyPreset(btn.dataset.preset)));
  document.querySelectorAll("[data-relation]").forEach(btn=>btn.addEventListener("click",()=>{activePreset="";document.querySelectorAll("[data-preset]").forEach(x=>{x.classList.remove("is-active");x.setAttribute("aria-pressed","false")});setRelation(btn.dataset.relation)}));
  document.querySelectorAll('input[name="unknown"]').forEach(r=>r.addEventListener("change",()=>setUnknown(r.value)));
  ["valueA","valueB","valueC","valueX","leftLabel","leftUnit","rightLabel","rightUnit","rounding"].forEach(id=>$(id).addEventListener("input",render));
  $("rounding").addEventListener("change",render);
  form.addEventListener("submit",e=>{e.preventDefault();render();if(matchMedia("(max-width:880px)").matches)$("vysledek").scrollIntoView({behavior:"smooth",block:"start"});});
  $("resetForm").addEventListener("click",()=>{ $("advanced").open=false; $("rounding").value="auto"; applyPreset("shopping"); });
  $("copyResult").addEventListener("click",async()=>{ if(!render())return; const text=`Trojčlenka: ${$("resultValue").textContent} ${$("resultUnit").textContent}. ${$("equation").textContent}. Kontrola: ${$("checkEquation").textContent}.`; try{await navigator.clipboard.writeText(text);$("copyResult").textContent="Zkopírováno";setTimeout(()=>$("copyResult").textContent="Zkopírovat výsledek a postup",1400);}catch(_){$("copyResult").textContent="Kopírování není dostupné";} });
  const menu=$("menuBtn"), mobile=$("mobile-nav"); if(menu&&mobile){menu.addEventListener("click",()=>{const on=menu.getAttribute("aria-expanded")==="true";menu.setAttribute("aria-expanded",String(!on));mobile.classList.toggle("is-open",!on)});document.addEventListener("keydown",e=>{if(e.key==="Escape"){menu.setAttribute("aria-expanded","false");mobile.classList.remove("is-open")}})}
  applyPreset("shopping");
})();
