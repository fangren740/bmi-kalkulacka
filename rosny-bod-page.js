(function(){
"use strict";
const core=window.RVDewPointCore;if(!core)return;
const $=id=>document.getElementById(id);let mode="dew";
const parse=v=>{const n=Number(String(v).trim().replace(/\s/g,"").replace(",","."));return Number.isFinite(n)?n:NaN};
const fmt=(n,d=1)=>Number(n).toLocaleString("cs-CZ",{minimumFractionDigits:d,maximumFractionDigits:d});
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const ids={air:$("air"),airRange:$("airRange"),rh:$("rh"),rhRange:$("rhRange"),surface:$("surface"),surfaceRange:$("surfaceRange")};
function invalidate(message){
  $("resultHeadline").innerHTML="Zkontrolujte <strong>zadání</strong>";$("resultHint").textContent=message;$("kpiDew").textContent="—";$("kpiVapor").textContent="—";$("kpiAbs").textContent="—";$("kpiMargin").textContent="—";$("formula").innerHTML="<b>Výpočet:</b> Čeká na platné vstupy.";$("meaningTitle").textContent="Výsledek není aktuální.";$("meaningText").textContent=message;$("status").textContent=message;
}
function pos(t,min,max){return 13+74*clamp((t-min)/(max-min),0,1)}
function setMode(next){mode=next;document.querySelectorAll("[data-mode]").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));$("surfaceField").hidden=mode!=="surface";calc(false)}
function sync(i,r,src){if(src==="input"){const n=parse($(i).value);if(Number.isFinite(n))$(r).value=n}else $(i).value=$(r).value;calc(false)}
function render(r,scroll){
  $("heroAir").textContent=fmt(r.airTempC)+" °C";$("heroRh").textContent=fmt(r.rhPct,0)+" %";$("heroDew").textContent=fmt(r.dewPointC)+" °C";
  $("kpiDew").textContent=fmt(r.dewPointC)+" °C";$("kpiVapor").textContent=fmt(r.vaporKPa,2)+" kPa";$("kpiAbs").textContent=fmt(r.absoluteHumidityGm3)+" g/m³";
  const surface=mode==="surface"?r.surfaceTempC:r.airTempC;const min=Math.min(r.dewPointC,surface)-8,max=Math.max(30,r.dewPointC+10,surface+10);const dp=pos(r.dewPointC,min,max),sp=pos(surface,min,max);
  $("dewMarker").style.left=dp+"%";$("surfaceMarker").style.left=sp+"%";$("dewLabel").style.left=dp+"%";$("surfaceLabel").style.left=sp+"%";$("dewLabel").textContent="Rosný bod "+fmt(r.dewPointC)+" °C";$("surfaceLabel").textContent=(mode==="surface"?"Povrch ":"Vzduch ")+fmt(surface)+" °C";
  if(mode==="dew"){
    $("resultHeadline").innerHTML="Rosný bod je <strong>"+fmt(r.dewPointC)+" °C</strong>";$("resultHint").textContent="Při teplotě vzduchu "+fmt(r.airTempC)+" °C a relativní vlhkosti "+fmt(r.rhPct,0)+" %.";$("kpiMargin").textContent="—";$("meaningTitle").textContent="Co tato teplota znamená?";$("meaningText").textContent="Povrch ochlazený přibližně na "+fmt(r.dewPointC)+" °C nebo níž může při stejném stavu vzduchu dosáhnout podmínek pro kondenzaci.";
  }else{
    $("kpiMargin").textContent=(r.marginC>=0?"+":"")+fmt(r.marginC)+" °C";
    $("resultHeadline").innerHTML=r.condensationPossible?"Povrch je <strong>v oblasti kondenzace</strong>":"Povrch je <strong>nad rosným bodem</strong>";
    const rhText=r.condensationPossible?"u povrchu je dosaženo hranice nasycení":"odhad povrchové RH "+fmt(r.surfaceRhDisplayPct,0)+" %";
    $("resultHint").textContent="Povrch "+fmt(r.surfaceTempC)+" °C · rosný bod "+fmt(r.dewPointC)+" °C · "+rhText+".";
    $("meaningTitle").textContent=r.condensationPossible?"Povrch je na nebo pod rosným bodem.":"Povrch je nad rosným bodem.";
    $("meaningText").textContent=r.condensationPossible?"Za těchto podmínek může na povrchu docházet ke kondenzaci vodní páry.":"Teplotní rezerva je přibližně "+fmt(r.marginC)+" °C. Odhad relativní vlhkosti těsně u povrchu je "+fmt(r.surfaceRhDisplayPct,0)+" %.";
  }
  $("formula").innerHTML="<b>Výpočet:</b> Magnusova aproximace (Alduchov–Eskridge); parciální tlak vodní páry "+fmt(r.vaporKPa,3)+" kPa a rosný bod "+fmt(r.dewPointC,2)+" °C.";
  $("heroDot").style.left=(35+clamp(r.rhPct,10,100)*.45)+"%";$("status").textContent="Výsledek byl přepočítán.";if(scroll)document.querySelector(".results").scrollIntoView({behavior:"smooth",block:"start"});
}
function calc(scroll){const input={airTempC:parse(ids.air.value),rhPct:parse(ids.rh.value)};if(mode==="surface")input.surfaceTempC=parse(ids.surface.value);const r=core.calculate(input);if(!r.ok){invalidate(r.error);return}render(r,scroll)}
document.querySelectorAll("[data-mode]").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));
[["air","airRange"],["rh","rhRange"],["surface","surfaceRange"]].forEach(([i,r])=>{$(i).addEventListener("input",()=>sync(i,r,"input"));$(r).addEventListener("input",()=>sync(i,r,"range"))});
$("calcBtn").addEventListener("click",()=>calc(true));$("resetBtn").addEventListener("click",()=>{ids.air.value="22";ids.airRange.value="22";ids.rh.value="60";ids.rhRange.value="60";ids.surface.value="17";ids.surfaceRange.value="17";setMode("dew");calc(false)});
calc(false);
})();