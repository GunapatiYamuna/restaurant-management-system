document.addEventListener("DOMContentLoaded",async function(){
  const loginUrl=document.body.dataset.loginUrl||"/login/login-options.html";
  const $=id=>document.getElementById(id);
  const show=(id,msg,type)=>{const e=$(id);if(!e)return;e.innerHTML='<div class="alert alert-'+(type==="success"?"success":"danger")+'">'+msg+'</div>';};
  async function api(url,opt={}){const r=await fetch(url,{credentials:"same-origin",cache:"no-store",...opt}),d=await r.json().catch(()=>({}));if(r.status===401){location.href=loginUrl;return null;}if(!r.ok||d.success===false)throw new Error(d.message||"Request failed.");return d;}
  try{
    const s=await api("/api/me/");if(!s||!s.authenticated){location.href=loginUrl;return;}const u=s.user;
    const map={profileName:u.name||"User",profileEmail:u.email||"",profilePhone:u.phone||"",profileCity:u.city||"",editName:u.name||"",editEmail:u.email||"",editPhone:u.phone||"",editCity:u.city||""};
    Object.entries(map).forEach(([id,v])=>{const e=$(id);if(!e)return;if("value"in e)e.value=v;else e.textContent=v;});
    const a=$("profileAvatar");if(a)a.textContent=(String(u.name||"U").trim().split(/\s+/).filter(Boolean).map(x=>x[0]).join("").slice(0,2)||"U").toUpperCase();
    const role=$("profileRole");if(role)role.textContent=u.role||"Account";
    async function loadProfileCounts() {
      try {
        const [ordersResponse, reservationsResponse] = await Promise.all([
          fetch("/api/orders/history/", { credentials: "same-origin", cache: "no-store" }),
          fetch("/api/reservations/history/", { credentials: "same-origin", cache: "no-store" })
        ]);

        if (ordersResponse.status === 401 || reservationsResponse.status === 401) {
          location.href = loginUrl;
          return;
        }

        const ordersData = await ordersResponse.json().catch(() => ({}));
        const reservationsData = await reservationsResponse.json().catch(() => ({}));

        if (ordersData.success !== false) {
          const orderCount = Array.isArray(ordersData.orders) ? ordersData.orders.length : 0;
          const element = $("navOrderCount");
          if (element) element.textContent = orderCount;
        }

        if (reservationsData.success !== false) {
          const reservationCount = Array.isArray(reservationsData.reservations)
            ? reservationsData.reservations.length
            : 0;
          const element = $("navReservationCount");
          if (element) element.textContent = reservationCount;
        }
      } catch (error) {
        console.error("Profile activity count load error:", error);
      }
    }

    loadProfileCounts();

    $("profileForm")?.addEventListener("submit",async e=>{e.preventDefault();try{const d=await api("/api/profile/update/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:$("editName")?.value.trim(),email:$("editEmail")?.value.trim(),phone:$("editPhone")?.value.trim(),city:$("editCity")?.value.trim()})});if(d){localStorage.setItem("foodiehub_session",JSON.stringify(d.user));show("profileAlert",d.message,"success");}}catch(err){show("profileAlert",err.message,"danger");}});
    $("passwordForm")?.addEventListener("submit",async e=>{e.preventDefault();try{const d=await api("/api/profile/change-password/",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({current_password:$("currentPassword")?.value||"",new_password:$("newPassword")?.value||"",confirm_password:$("confirmPassword")?.value||""})});if(d){e.target.reset();show("passwordAlert",d.message,"success");}}catch(err){show("passwordAlert",err.message,"danger");}});
  }catch(err){show("profileAlert",err.message,"danger");}
});