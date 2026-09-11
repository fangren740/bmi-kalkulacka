(function(root,factory){
  const api=factory();
  if(typeof module==="object"&&module.exports) module.exports=api;
  else root.RVFormCalc=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";
  function parseCz(value){
    if(typeof value==="number") return Number.isFinite(value)?value:NaN;
    const text=String(value??"").trim().replace(/\s/g,"").replace(",",".");
    if(!text) return NaN;
    const n=Number(text);
    return Number.isFinite(n)?n:NaN;
  }
  function positive(value){const n=parseCz(value);return Number.isFinite(n)&&n>0?n:NaN}
  function area(form){
    if(!form||!form.shape) return NaN;
    if(form.shape==="circle"){const d=positive(form.diameter);return Number.isFinite(d)?Math.PI*(d/2)**2:NaN}
    if(form.shape==="square"){const w=positive(form.width);return Number.isFinite(w)?w*w:NaN}
    if(form.shape==="rect"){const w=positive(form.width),l=positive(form.length);return Number.isFinite(w)&&Number.isFinite(l)?w*l:NaN}
    return NaN;
  }
  function measure(form,useVolume){
    const a=area(form);
    if(!Number.isFinite(a)) return NaN;
    if(!useVolume) return a;
    const h=positive(form.height);
    return Number.isFinite(h)?a*h:NaN;
  }
  function factor(oldForm,newForm,useVolume){
    const oldM=measure(oldForm,useVolume),newM=measure(newForm,useVolume);
    return Number.isFinite(oldM)&&oldM>0&&Number.isFinite(newM)?newM/oldM:NaN;
  }
  function scaleAmount(amount,multiplier){
    const a=parseCz(amount),f=parseCz(multiplier);
    return Number.isFinite(a)&&a>=0&&Number.isFinite(f)&&f>0?a*f:NaN;
  }
  return Object.freeze({parseCz,area,measure,factor,scaleAmount});
});
