(()=>{
  const root=document.documentElement;
  let workingTimer=0, idleTimer=0;
  const setState=(state)=>{root.dataset.rvState=state};
  const react=()=>{
    clearTimeout(workingTimer);clearTimeout(idleTimer);
    setState('working');
    workingTimer=setTimeout(()=>setState('ready'),190);
    idleTimer=setTimeout(()=>setState('idle'),860);
  };
  document.addEventListener('input',react,{passive:true});
  document.addEventListener('change',react,{passive:true});
  document.addEventListener('click',event=>{
    if(event.target.closest('button,[role="tab"],.mode-button,.calc-tab'))react();
  },{passive:true});
  setState('idle');
})();
