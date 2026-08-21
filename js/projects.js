document.addEventListener("DOMContentLoaded",async()=>{
  const grid=document.getElementById("projectGrid");
  const fallback=[{title:"Quality Index Prediction",category:"AI / ML",description:"Machine learning project for predicting quality index using ML algorithms.",image:"assets/images/project-1.svg",github:"#",demo:"#",technologies:["Python","Machine Learning"]}];
  let projects=fallback;
  try{const r=await fetch(`${window.PORTFOLIO_API||"/api"}/projects`);if(r.ok){const d=await r.json();if(Array.isArray(d)&&d.length)projects=d}}catch{}
  projects=[...projects].sort((a,b)=>Number(b.featured)-Number(a.featured));
  grid.innerHTML=projects.map(p=>`<article class="project-card"><div class="project-img"><img loading="lazy" src="${safeUrl(p.image||"assets/images/project-1.svg")}" alt="${escapeHtml(p.title)}"><span class="project-tag">${escapeHtml(p.category||"Web")}</span></div><div class="project-body"><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.description||"")}</p>${(p.technologies||[]).length?`<div class="project-tech">${p.technologies.map(t=>`<span>${escapeHtml(t)}</span>`).join("")}</div>`:""}<div class="project-links">${p.github&&p.github!=="#"?`<a href="${safeUrl(p.github)}" target="_blank" rel="noopener">◌ GitHub</a>`:""}${p.demo&&p.demo!=="#"?`<a href="${safeUrl(p.demo)}" target="_blank" rel="noopener">◉ Live Demo</a>`:""}</div></div></article>`).join("");
});
function safeUrl(v){return String(v||"").replace(/"/g,"&quot;")}
function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
