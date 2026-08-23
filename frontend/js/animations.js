document.addEventListener("DOMContentLoaded",()=>{
  const revealObserver=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("visible")});
  },{threshold:.12});
  document.querySelectorAll(".reveal").forEach(el=>revealObserver.observe(el));

  const countObserver=new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(!e.isIntersecting)return;
      const el=e.target; if(el.dataset.done)return; el.dataset.done="1";
      const target=Number(el.dataset.count), duration=900, start=performance.now();
      const tick=now=>{const p=Math.min((now-start)/duration,1);el.textContent=Math.floor(target*(1-Math.pow(1-p,3)))+(target>=10?"+":"+");if(p<1)requestAnimationFrame(tick)};
      requestAnimationFrame(tick);
    });
  },{threshold:.8});
  document.querySelectorAll("[data-count]").forEach(el=>countObserver.observe(el));
});
