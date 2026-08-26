(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  const form=$('bmiForm');
  if(!form) return;
  const height=$('height'),weight=$('weight'),waist=$('waist');
  const reset=$('resetForm'),error=$('formError');
  const menu=$('menuBtn'),mobile=$('mobile-nav');
  const fmt=(n,d=1)=>new Intl.NumberFormat('cs-CZ',{minimumFractionDigits:d,maximumFractionDigits:d}).format(n);
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const catFor=bmi=>{
    if(bmi<18.5)return {key:'under',name:'Podváha',range:'pod 18,5',color:'#5aa6d6',badge:'#e7f3fa',ink:'#185d87'};
    if(bmi<25)return {key:'ref',name:'Referenční rozmezí',range:'18,5–24,9',color:'#52ba77',badge:'#e9f6ec',ink:'#1d6b2c'};
    if(bmi<30)return {key:'over',name:'Nadváha',range:'25,0–29,9',color:'#e2a23f',badge:'#fff4df',ink:'#8a5b0a'};
    if(bmi<35)return {key:'o1',name:'Obezita I',range:'30,0–34,9',color:'#e88343',badge:'#fff0e8',ink:'#8d481b'};
    if(bmi<40)return {key:'o2',name:'Obezita II',range:'35,0–39,9',color:'#d95c57',badge:'#fdecec',ink:'#893533'};
    return {key:'o3',name:'Obezita III',range:'40 a více',color:'#8a4f73',badge:'#f5eaf1',ink:'#63334f'};
  };
  const bmiPercent=bmi=>clamp((bmi-14)/(45-14)*100,1,99);
  const waistPercent=r=>clamp((r-.32)/(.70-.32)*100,1,99);
  const nearestBoundary=bmi=>{
    const pts=[18.5,25,30,35,40];
    const near=pts.reduce((a,b)=>Math.abs(b-bmi)<Math.abs(a-bmi)?b:a,pts[0]);
    return {point:near,diff:Math.abs(near-bmi)};
  };
  function read(){
    const h=parseFloat(String(height.value).replace(',','.'));
    const w=parseFloat(String(weight.value).replace(',','.'));
    const wc=waist.value.trim()===''?null:parseFloat(String(waist.value).replace(',','.'));
    return {h,w,wc};
  }
  function valid({h,w,wc}){
    return Number.isFinite(h)&&h>=100&&h<=250&&Number.isFinite(w)&&w>=25&&w<=350&&(wc===null||(Number.isFinite(wc)&&wc>=40&&wc<=250));
  }
  function waistText(r,bmi){
    if(bmi>=35) return 'Poměr je vypočtený, ale NICE doporučuje tuto doplňkovou klasifikaci primárně u dospělých s BMI pod 35.';
    if(r<.4) return 'Poměr je pod 0,40. Standardní NICE kategorie centrální adiposity na této stránce začínají hodnotou 0,40.';
    if(r<.5) return 'NICE řadí 0,40–0,49 do pásma zdravé centrální adiposity. Jde o orientační screening, ne individuální diagnózu.';
    if(r<.6) return 'NICE řadí 0,50–0,59 do pásma zvýšené centrální adiposity. Samotný poměr neurčuje vaše individuální riziko.';
    return 'NICE řadí 0,60 a více do pásma vysoké centrální adiposity. Výsledek je screeningový údaj a patří do širšího zdravotního kontextu.';
  }
  function update(){
    const v=read();
    if(!valid(v)){
      error.hidden=false;
      return;
    }
    error.hidden=true;
    const hm=v.h/100,bmi=v.w/(hm*hm),cat=catFor(bmi),lower=18.5*hm*hm,upper=24.9*hm*hm,kgPoint=hm*hm,near=nearestBoundary(bmi),pct=bmiPercent(bmi);
    $('bmiValue').textContent=fmt(bmi,1);$('heroBmi').textContent=fmt(bmi,1);
    $('heroCategory').textContent=cat.name;
    $('categoryRange').textContent=cat.range;
    $('weightRange').textContent=`${fmt(lower,1)}–${fmt(upper,1)} kg`;
    $('kgPerPoint').textContent=`${fmt(kgPoint,2)} kg`;
    $('nearestBoundary').textContent=`${fmt(near.diff,1)} bodu od ${fmt(near.point,1)}`;
    $('formulaLine').textContent=`${fmt(v.w,1)} ÷ ${fmt(hm,2)}² = ${fmt(bmi,1)}`;
    $('resultBadge').textContent=cat.name;
    $('resultBadge').style.background=cat.badge;$('resultBadge').style.color=cat.ink;
    $('resultText').textContent=bmi<18.5?'Výsledek je pod standardním referenčním rozmezím pro dospělé.':bmi<25?'Výsledek leží ve standardním referenčním rozmezí BMI pro dospělé.':bmi<30?'Výsledek leží v pásmu nadváhy podle standardní klasifikace dospělých.':`Výsledek leží v pásmu ${cat.name.toLowerCase()} podle standardní klasifikace dospělých.`;
    document.querySelectorAll('[data-bmi-needle]').forEach(el=>el.style.left=`${pct}%`);
    $('heroHeight').textContent=`${fmt(v.h,0)} cm`;$('heroWeight').textContent=`${fmt(v.w,1)} kg`;
    if(v.wc!==null){
      const r=v.wc/v.h,wp=waistPercent(r);
      $('waistResult').hidden=false;$('waistRatio').textContent=fmt(r,2);$('waistText').textContent=waistText(r,bmi);$('waistNeedle').style.left=`${wp}%`;
      $('rulerValue').textContent=fmt(r,2);$('rulerPointer').style.left=`${wp}%`; $('rulerState').textContent=r<.5?'pod polovinou výšky':r<.6?'0,50–0,59':'0,60 a více';
    }else{
      $('waistResult').hidden=true;$('rulerValue').textContent='—';$('rulerState').textContent='doplňte obvod pasu';$('rulerPointer').style.left='49%';
    }
  }
  ['input','change'].forEach(ev=>form.addEventListener(ev,update));
  form.addEventListener('submit',e=>{e.preventDefault();update();if(!error.hidden) return;$('vysledek').scrollIntoView({behavior:'smooth',block:'center'});});
  reset.addEventListener('click',()=>{height.value='180';weight.value='80';waist.value='';update();height.focus();});
  if(menu&&mobile){menu.addEventListener('click',()=>{const open=mobile.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(open));});document.addEventListener('keydown',e=>{if(e.key==='Escape'){mobile.classList.remove('is-open');menu.setAttribute('aria-expanded','false');}});}
  update();
})();
