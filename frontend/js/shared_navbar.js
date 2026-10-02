document.addEventListener("DOMContentLoaded",async function(){
  const nav=document.querySelector("[data-shared-navbar]"); if(!nav)return;
  const active=nav.querySelector('[data-nav="'+window.location.pathname+'"]'); if(active)active.classList.add("active");
  const auth=document.getElementById("authButtons"), profile=document.getElementById("userSection");
  const nameEl=document.getElementById("navbarUserName"), roleEl=document.getElementById("navbarUserRole"), avatar=document.getElementById("navbarAvatar");
  if(!auth||!profile)return;
  const profileUrls={user:"/login/pages/profile.html",restaurant:"/restaurant_portal/profile.html",admin:"/ad_login/pages/profile.html",delivery:"/delivery_portal/profile.html"};
  const roleLabels={user:"Customer",restaurant:"Restaurant Partner",admin:"Administrator",delivery:"Delivery Partner"};
  try{
    const r=await fetch("/api/me/",{credentials:"same-origin",cache:"no-store"}),d=await r.json();
    if(!r.ok||!d.authenticated||!d.user){auth.style.display="flex";profile.style.display="none";return;}
    const u=d.user; localStorage.setItem("foodiehub_session",JSON.stringify(u)); auth.style.display="none";profile.style.display="flex";
    profile.href=profileUrls[u.role]||profileUrls.user; roleEl&&(roleEl.textContent=roleLabels[u.role]||"FoodieHub");
    const p=String(u.name||"User").trim().split(/\s+/).filter(Boolean),first=p[0]||"User";
    nameEl&&(nameEl.textContent=first); avatar&&(avatar.textContent=(first[0]+(p.length>1?p[p.length-1][0]:"")).toUpperCase());
  }catch(e){console.error("Shared navbar auth error:",e);}
});