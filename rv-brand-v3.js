(()=>{
 const root=document.documentElement;let a=0,b=0;
 const react=()=>{clearTimeout(a);clearTimeout(b);root.dataset.rvState='working';a=setTimeout(()=>root.dataset.rvState='ready',210);b=setTimeout(()=>root.dataset.rvState='idle',900)};
 document.addEventListener('input',react,{passive:true});document.addEventListener('change',react,{passive:true});
 document.addEventListener('click',e=>{if(e.target.closest('button,[role="tab"],.mode-button,.calc-tab,.category-filter,.group-toggle'))react()},{passive:true});
 root.dataset.rvState='idle';
})();