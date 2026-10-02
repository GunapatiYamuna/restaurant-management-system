const alertBox=m=>{const e=document.getElementById("alert");if(e)e.innerHTML='<div style="padding:10px;border-radius:8px;background:#fff1f1;color:#b42318;font-size:12px">'+m+'</div>'};
const api=async(u,o={})=>{const r=await fetch(u,{credentials:"same-origin",...o});const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw new Error(d.message||"Request failed");return d};
document.getElementById("deliveryLogin")?.addEventListener("submit",async e=>{e.preventDefault();try{const d=await api("/api/delivery-login/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:email.value.trim(),password:password.value})});localStorage.setItem("foodiehub_session",JSON.stringify(d.user));location.href="dashboard.html"}catch(x){alertBox(x.message)}});
document.getElementById("deliveryRegister")?.addEventListener("submit",async e=>{e.preventDefault();try{const d=await api("/api/delivery/register/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
name:document.getElementById("name").value.trim(),
email:document.getElementById("email").value.trim(),
phone:document.getElementById("phone").value.trim(),
password:document.getElementById("password").value,
vehicle_type:document.getElementById("vehicle_type").value,
vehicle_number:document.getElementById("vehicle_number").value.trim()
})});alertBox(d.message);setTimeout(()=>location.href="login.html",600)}catch(x){alertBox(x.message)}});