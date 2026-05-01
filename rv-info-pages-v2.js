(function(){
  const path=(window.location.pathname.replace(/\/$/, '') || '/');
  document.querySelectorAll('.rv-nav a[href]').forEach((link)=>{const href=(link.getAttribute('href')||'').replace(/\/$/,'')||'/'; if(href===path) link.setAttribute('aria-current','page');});
  const btn=document.getElementById('rvBackToTop');
  if(btn){const toggle=()=>btn.classList.toggle('is-visible', window.scrollY>520); window.addEventListener('scroll',toggle,{passive:true}); toggle(); btn.addEventListener('click',()=>window.scrollTo({top:0,behavior:'smooth'}));}
})();
