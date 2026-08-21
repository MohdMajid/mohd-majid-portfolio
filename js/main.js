document.addEventListener("DOMContentLoaded",async()=>{
  const toggle=document.getElementById("menuToggle"),nav=document.getElementById("navLinks");
  const links=[...document.querySelectorAll(".nav-links a[href^='#']")];
  toggle?.addEventListener("click",()=>{const open=nav.classList.toggle("open");toggle.setAttribute("aria-expanded",open)});
  links.forEach(link=>link.addEventListener("click",()=>nav.classList.remove("open")));
  document.getElementById("year").textContent=new Date().getFullYear();

  const api=window.PORTFOLIO_API||"/api";
  const fallbackSkills=[["🐍","Python",90],["🧠","Machine Learning",80],["◉","Deep Learning",75],["✦","Artificial Intelligence",85],["JS","JavaScript",80],["HTML","HTML5",90],["CSS","CSS3",90],["TW","Tailwind CSS",75],["N","Node.js",75],["EX","Express.js",75],["DB","MongoDB",70],["G","Git",80],["GH","GitHub",80]];
  try{
    const [sr,er,setr]=await Promise.all([fetch(`${api}/skills`),fetch(`${api}/experience`),fetch(`${api}/settings`)]);
    const skills=sr.ok?await sr.json():fallbackSkills.map(x=>({icon:x[0],name:x[1],level:x[2]}));
    const exp=er.ok?await er.json():[];
    const s=setr.ok?await setr.json():{};
    applySettings(s);
    document.getElementById("skillGrid").innerHTML=skills.map(x=>`<div class="skill"><div class="skill-icon">${escapeHtml(x.icon||"✦")}</div><div class="skill-name">${escapeHtml(x.name)}</div><div class="skill-level">${Number(x.level)||0}%</div></div>`).join("");
    document.getElementById("timeline").innerHTML=exp.map(x=>`<article class="timeline-item"><small>${escapeHtml(x.period||"")}</small><h3>${escapeHtml(x.title||"")}</h3><p>${escapeHtml(x.place||"")}${x.place&&x.description?" — ":""}${escapeHtml(x.description||"")}</p></article>`).join("");
  }catch(e){console.warn("Dynamic content unavailable",e)}

  const sections=[...document.querySelectorAll("main section[id]")];
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){const id=entry.target.id;links.forEach(a=>a.classList.toggle("active",a.getAttribute("href")===`#${id}`))}}),{rootMargin:"-35% 0px -55% 0px"});sections.forEach(s=>observer.observe(s));
  for(let i=0;i<35;i++){const p=document.createElement("span");p.style.cssText=`position:absolute;width:2px;height:2px;border-radius:50%;background:#7784ff;opacity:${Math.random()*.45+.1};left:${Math.random()*100}%;top:${Math.random()*100}%;`;document.getElementById("particles").appendChild(p)}
});
function applySettings(s){
  const name=s.name||"Mohd Majid";const social=s.social||{};
  const set=(id,v)=>{const e=document.getElementById(id);if(e&&v!=null)e.textContent=v};
  set("siteTitle",s.title);document.title=s.title||document.title;set("brandName",name);set("footerName",name);set("footerBrandName",name);set("heroName",name);set("heroEyebrow",s.eyebrow);set("heroRole",s.role);set("heroDescription",s.heroDescription);set("aboutText",s.about);set("factName",name);set("factFocus",s.focus);set("factLocation",s.location);set("factDegree",s.degree);
  ["Github","Linkedin","Instagram","X"].forEach(k=>{const el=document.getElementById("social"+k);const url=social[k.toLowerCase()]||social[k==='X'?'x':k.toLowerCase()]||"#";if(el)el.href=url||"#"});
  const profile=document.querySelector(".profile-frame img");if(profile&&s.profileImage)profile.src=s.profileImage.startsWith("/")?s.profileImage:"/"+s.profileImage;
}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
