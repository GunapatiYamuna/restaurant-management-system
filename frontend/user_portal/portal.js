const api=async(u,o={})=>{const r=await fetch(u,{credentials:"same-origin",cache:"no-store",...o});const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw new Error(d.message||"Request failed");return d;};
const esc=v=>String(v??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[c]));
const fmtDate=v=>{try{return new Date(v+"T00:00:00").toLocaleDateString(undefined,{day:"2-digit",month:"short",year:"numeric"})}catch(_){return v||"-"}};
const fmtTime=v=>{if(!v)return "-";const p=String(v).split(":");let h=Number(p[0]||0),m=p[1]||"00";const ap=h>=12?"PM":"AM";h=h%12||12;return h+":"+m+" "+ap};
const statusClass=v=>{const s=String(v||"").toLowerCase();if(["confirmed","completed","attended"].some(x=>s.includes(x)))return"green";if(["cancel","reject","refund"].some(x=>s.includes(x)))return"red";return"amber"};
function renderReservations(rows){
  const box=document.getElementById("reservationCards"); if(!box)return;
  if(!rows.length){box.innerHTML='<div class="card empty">No reservations yet.</div>';return}
  box.innerHTML=rows.map(x=>`<article class="reservation-card">
    <div class="reservation-top"><div><h3>${esc(x.restaurant)}</h3><div class="small">Reservation #${esc(x.id)}</div></div><span class="badge ${statusClass(x.status)}">${esc(x.status||"Pending")}</span></div>
    <div class="reservation-meta">
      <div>Date<strong>${esc(fmtDate(x.date))}</strong></div>
      <div>Time<strong>${esc(fmtTime(x.time))}</strong></div>
      <div>Guests<strong>${esc(x.guests)}</strong></div>
      <div>Booking name<strong>${esc(x.name||"")}</strong></div>
    </div>
    ${x.message?'<div class="small" style="margin-top:10px">Note: '+esc(x.message)+'</div>':""}
  </article>`).join("")
}
async function load(){
  try{
    const me=await api("/api/me/");if(!me.authenticated){location.href="../login/pages/login.html";return}
    document.querySelectorAll("[data-user-name]").forEach(e=>e.textContent=me.user.name||"User");
    const [o,r]=await Promise.all([api("/api/orders/history/"),api("/api/reservations/history/")]);
    document.getElementById("orderCount").textContent=o.orders.length;
    document.getElementById("reservationCount").textContent=r.reservations.length;
    document.getElementById("orders").innerHTML='<div class="panel-head"><div><h2>My orders</h2><span>Track your active delivery from here.</span></div></div><div class="cards">'+(o.orders.map(x=>`<article class="card"><div class="cardhead"><div><h2>Order #${x.id}</h2><div class="small">${new Date(x.created_at).toLocaleString()}</div></div><span class="badge orange">${esc(x.status)}</span></div><p>${x.items.map(i=>esc(i.name)+" × "+i.quantity).join(" · ")}</p><div class="top-actions"><b>₹${Number(x.total).toFixed(2)}</b><a class="btn orange" href="../tracking.html?id=${x.id}">Track order</a></div></article>`).join("")||'<div class="card empty">No delivery orders yet.</div>')+'</div>';
    renderReservations(r.reservations);
  }catch(e){
    const orders=document.getElementById("orders"), reservations=document.getElementById("reservationCards");
    if(orders)orders.innerHTML='<div class="card">'+esc(e.message)+'</div>';
    if(reservations)reservations.innerHTML='<div class="card">'+esc(e.message)+'</div>';
  }
}
const workspaceToggle=document.getElementById("workspaceToggle"), dashboard=document.body, overlay=document.getElementById("workspaceOverlay");
function closeWorkspace(){dashboard.classList.remove("workspace-open");workspaceToggle?.setAttribute("aria-expanded","false");}
workspaceToggle?.addEventListener("click",()=>{const open=!dashboard.classList.contains("workspace-open");dashboard.classList.toggle("workspace-open",open);workspaceToggle.setAttribute("aria-expanded",String(open));});
overlay?.addEventListener("click",closeWorkspace);
document.querySelectorAll(".customer-dashboard .side a").forEach(a=>a.addEventListener("click",()=>{if(window.innerWidth<=760)closeWorkspace()}));
window.addEventListener("resize",()=>{if(window.innerWidth>760)closeWorkspace()});
document.getElementById("logout")?.addEventListener("click",async()=>{try{await api("/api/logout/",{method:"POST"})}catch(_){}localStorage.removeItem("foodiehub_session");location.href="../index.html"});
document.addEventListener("DOMContentLoaded",load);