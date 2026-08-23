document.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("contactForm"),status=document.getElementById("formStatus"),btn=document.getElementById("sendBtn");
  form.addEventListener("submit",async e=>{
    e.preventDefault(); status.textContent="Sending..."; btn.disabled=true;
    const data=Object.fromEntries(new FormData(form).entries());
    try{
      const r=await fetch(`${window.PORTFOLIO_API}/contact`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
      const out=await r.json();
      if(!r.ok)throw new Error(out.message||"Unable to send message");
      status.textContent="Message sent successfully. Thank you!";
      form.reset();
    }catch(err){status.textContent=err.message||"Something went wrong. Please try again."}
    finally{btn.disabled=false}
  });
});
