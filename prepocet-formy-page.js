(function(){
"use strict";
const Core=window.RVFormCalc;
if(!Core)return;
const $=id=>document.getElementById(id);
let shapes={old:"circle",new:"circle"};
let ingredients=[
{name:"Hladká mouka",amount:250,unit:"g"},{name:"Cukr",amount:150,unit:"g"},{name:"Máslo",amount:100,unit:"g"},
{name:"Vejce",amount:3,unit:"ks"},{name:"Mléko",amount:120,unit:"ml"},{name:"Prášek do pečiva",amount:10,unit:"g"}];
const recipeSets={
cake:ingredients.map(x=>({...x})),
cheesecake:[{name:"Sušenky",amount:200,unit:"g"},{name:"Máslo",amount:90,unit:"g"},{name:"Krémový sýr",amount:600,unit:"g"},{name:"Cukr",amount:160,unit:"g"},{name:"Vejce",amount:3,unit:"ks"},{name:"Smetana",amount:180,unit:"ml"}],
brownies:[{name:"Hořká čokoláda",amount:200,unit:"g"},{name:"Máslo",amount:170,unit:"g"},{name:"Cukr",amount:220,unit:"g"},{name:"Vejce",amount:3,unit:"ks"},{name:"Hladká mouka",amount:100,unit:"g"},{name:"Kakao",amount:25,unit:"g"}],
empty:[{name:"Surovina",amount:100,unit:"g"}]};
const fmt=(n,d=2)=>Number(n).toLocaleString("cs-CZ",{minimumFractionDigits:d,maximumFractionDigits:d});
const amt=(n,u)=>u==="ks"?fmt(n,n<10?2:1):n>=100?fmt(n,0):n>=10?fmt(n,1):fmt(n,2);
function formData(side){return{shape:shapes[side],diameter:$(side+"D").value,width:$(side+"W").value,length:$(side+"L").value,height:$(side+"H").value}}
function setInvalid(message){
  $("resultsSection").hidden=true;
  $("status").textContent=message||"Zkontrolujte zadané rozměry.";
}
function fields(side){
  const s=shapes[side];
  $(side+"DField").hidden=s!=="circle";$(side+"WField").hidden=s==="circle";$(side+"LField").hidden=s!=="rect";$(side+"HField").hidden=!$("useVolume").checked;
  document.querySelectorAll(`.shape-tabs[data-side="${side}"] .shape`).forEach(b=>b.classList.toggle("active",b.dataset.shape===s));
  const quick=$(side+"Quick");if(quick)quick.style.display=s==="circle"?"flex":"none";
}
function visualLabel(side){
  const s=shapes[side];
  if(s==="circle")return "Ø "+$(side+"D").value+" cm";
  if(s==="square")return $(side+"W").value+" × "+$(side+"W").value+" cm";
  return $(side+"W").value+" × "+$(side+"L").value+" cm";
}
function updatePreview(side){
  const box=$(side+"Preview"),label=$(side+"PreviewLabel");if(!box||!label)return;
  const s=shapes[side],a=Core.area(formData(side));box.className="form-shape "+s;label.textContent=visualLabel(side);
  const scale=Number.isFinite(a)?Math.max(.68,Math.min(1.18,Math.sqrt(a/314))):1;
  if(s==="circle"){const px=52*scale;box.style.width=px+"px";box.style.height=px+"px"}
  else if(s==="square"){const px=50*scale;box.style.width=px+"px";box.style.height=px+"px"}
  else{const w=Core.parseCz($(side+"W").value),l=Core.parseCz($(side+"L").value),r=Number.isFinite(w)&&Number.isFinite(l)&&w>0&&l>0?l/w:1.5;box.style.width=Math.min(78,50*scale*Math.sqrt(r))+"px";box.style.height=Math.min(58,50*scale/Math.sqrt(r))+"px"}
}
function updatePreviews(){updatePreview("old");updatePreview("new")}
function renderRows(){
  const rows=$("rows");rows.innerHTML="";
  ingredients.forEach((x,i)=>{
    const row=document.createElement("div");row.className="ing-row";
    row.innerHTML=`<div><input aria-label="Název suroviny" data-i="${i}" data-k="name" value="${String(x.name).replace(/"/g,"&quot;")}"></div>
<div><input class="amount" aria-label="Množství" data-i="${i}" data-k="amount" inputmode="decimal" value="${String(x.amount).replace(".",",")}"></div>
<div><select aria-label="Jednotka" data-i="${i}" data-k="unit">${["g","kg","ml","l","ks","lžíce","lžička"].map(u=>`<option ${u===x.unit?"selected":""}>${u}</option>`).join("")}</select></div>
<div><button class="remove" aria-label="Odebrat surovinu" data-remove="${i}" type="button">×</button></div>`;
    rows.appendChild(row);
  });
  rows.querySelectorAll("input,select").forEach(el=>el.addEventListener("input",e=>{
    const i=Number(e.target.dataset.i),k=e.target.dataset.k;
    ingredients[i][k]=k==="amount"?Core.parseCz(e.target.value):e.target.value;calc(false);
  }));
  rows.querySelectorAll("[data-remove]").forEach(b=>b.addEventListener("click",()=>{ingredients.splice(Number(b.dataset.remove),1);renderRows();calc(false)}));
}
function calc(scroll){
  const oldForm=formData("old"),newForm=formData("new"),useVolume=$("useVolume").checked;
  const oldA=Core.area(oldForm),newA=Core.area(newForm),f=Core.factor(oldForm,newForm,useVolume);
  if(!Number.isFinite(oldA)||!Number.isFinite(newA)||!Number.isFinite(f)||f<=0){setInvalid("Zkontrolujte rozměry forem. Všechny použité rozměry musí být větší než nula.");return}
  for(const x of ingredients){if(!Number.isFinite(x.amount)||x.amount<0){setInvalid("Zkontrolujte množství surovin.");return}}
  $("resultsSection").hidden=false;
  const delta=(f-1)*100;
  $("oldArea").textContent=fmt(oldA,0)+" cm²";$("newArea").textContent=fmt(newA,0)+" cm²";
  $("factor").textContent="× "+fmt(f,2);$("heroFactor").textContent="× "+fmt(f,2);
  $("resultFactor").textContent=fmt(f*100,0)+" %";$("kpiFactor").textContent="× "+fmt(f,2);
  $("kpiOld").textContent=fmt(oldA,0)+" cm²";$("kpiNew").textContent=fmt(newA,0)+" cm²";$("kpiDelta").textContent=(delta>=0?"+":"")+fmt(delta,0)+" %";
  $("resultHint").textContent=useVolume?`Objemový poměr je ${fmt(f,2)}×. Přepočet zohledňuje plochu i zadanou výšku těsta.`:`Nová forma je ${Math.abs(delta)<0.5?"prakticky stejně velká":delta>0?"o "+fmt(delta,0)+" % větší":"o "+fmt(Math.abs(delta),0)+" % menší"} než původní. Pro podobnou výšku těsta použijte ${fmt(f,2)}× množství surovin.`;
  const grid=$("scaledGrid");grid.innerHTML="";
  ingredients.forEach(x=>{const target=Core.scaleAmount(x.amount,f);const item=document.createElement("div");item.className="scaled-item";const before=amt(x.amount,x.unit)+" "+x.unit,after=amt(target,x.unit)+" "+x.unit;item.innerHTML=`<div><span>${x.name||"Surovina"}</span><div class="change"><b>${before}</b><i>→</i><b>${after}</b></div></div><strong>${after}</strong>`;grid.appendChild(item)});
  const flour=ingredients.find(x=>/mouka/i.test(x.name)),eggs=ingredients.find(x=>/vejce/i.test(x.name));
  if(flour)$("heroFlour").textContent=`${amt(flour.amount,flour.unit)} ${flour.unit} → ${amt(Core.scaleAmount(flour.amount,f),flour.unit)} ${flour.unit}`;
  if(eggs)$("heroEggs").textContent=`${amt(eggs.amount,eggs.unit)} ${eggs.unit} → ${amt(Core.scaleAmount(eggs.amount,f),eggs.unit)} ${eggs.unit}`;
  const hint=$("eggHint");hint.classList.remove("show");hint.textContent="";
  if(eggs&&eggs.unit==="ks"){const target=Core.scaleAmount(eggs.amount,f),whole=Math.floor(target),frac=target-whole;if(frac>.03&&frac<.97){hint.classList.add("show");hint.innerHTML=`<b>Prakticky s vejci:</b> matematicky vychází ${fmt(target,2)} ks. Pro přesnější výsledek použijte ${whole} celé ${whole===1?"vejce":"vejce"} a přibližně ${fmt(frac*100,0)} % dalšího rozšlehaného vejce.`}}
  updatePreviews();$("status").textContent="Recept byl přepočítán.";
  if(scroll)$("resultsSection").scrollIntoView({behavior:"smooth",block:"start"});
}
function reset(){
  shapes={old:"circle",new:"circle"};
  ["oldD","newD"].forEach((id,i)=>$(id).value=i===0?"20":"24");
  ["oldW","newW"].forEach(id=>$(id).value="20");["oldL","newL"].forEach(id=>$(id).value="30");["oldH","newH"].forEach(id=>$(id).value="5");
  $("useVolume").checked=false;ingredients=recipeSets.cake.map(x=>({...x}));
  document.querySelectorAll("[data-scale-mode]").forEach(b=>b.classList.toggle("active",b.dataset.scaleMode==="area"));
  document.querySelectorAll(".recipe-preset").forEach(b=>b.classList.toggle("active",b.dataset.recipe==="cake"));
  fields("old");fields("new");renderRows();updatePreviews();calc(false);
}
document.querySelectorAll(".shape").forEach(b=>b.addEventListener("click",()=>{const side=b.closest(".shape-tabs").dataset.side;shapes[side]=b.dataset.shape;fields(side);updatePreview(side);calc(false)}));
document.querySelectorAll("[data-scale-mode]").forEach(b=>b.addEventListener("click",()=>{$("useVolume").checked=b.dataset.scaleMode==="volume";document.querySelectorAll("[data-scale-mode]").forEach(x=>x.classList.toggle("active",x===b));fields("old");fields("new");calc(false)}));
document.querySelectorAll(".quick-size").forEach(b=>b.addEventListener("click",()=>{const side=b.dataset.side;$(side+"D").value=b.dataset.size;document.querySelectorAll(`.quick-size[data-side="${side}"]`).forEach(x=>x.classList.toggle("active",x===b));updatePreview(side);calc(false)}));
document.querySelectorAll(".recipe-preset").forEach(b=>b.addEventListener("click",()=>{ingredients=recipeSets[b.dataset.recipe].map(x=>({...x}));document.querySelectorAll(".recipe-preset").forEach(x=>x.classList.toggle("active",x===b));renderRows();calc(false)}));
["oldD","oldW","oldL","oldH","newD","newW","newL","newH"].forEach(id=>$(id).addEventListener("input",()=>{updatePreviews();calc(false)}));
$("addIng").addEventListener("click",()=>{ingredients.push({name:"Nová surovina",amount:100,unit:"g"});renderRows();calc(false)});
$("calcBtn").addEventListener("click",()=>calc(true));$("resetBtn").addEventListener("click",reset);
fields("old");fields("new");renderRows();updatePreviews();calc(false);
})();
