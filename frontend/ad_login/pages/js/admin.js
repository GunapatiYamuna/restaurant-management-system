(async function(){
  const sessionKey='foodiehub_session';
  let user=null;
  try{
    const r=await fetch('/api/me/',{credentials:'same-origin',cache:'no-store'});
    const d=await r.json();
    if(!r.ok||!d.authenticated||!d.user||d.user.role!=='admin') throw new Error('Not authorized');
    user=d.user;
    localStorage.setItem(sessionKey,JSON.stringify(user));
  }catch(e){
    localStorage.removeItem(sessionKey);
    if(!location.pathname.endsWith('/login_register.html')) location.href='../login_register.html';
    return;
  }
  const first=(user.name||'Admin').trim().split(/\s+/)[0]||'Admin';
  const initials=(user.name||'Admin').trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join('')||'A';
  document.querySelectorAll('[data-admin-name]').forEach(el=>el.textContent=first);
  document.querySelectorAll('[data-admin-fullname]').forEach(el=>el.textContent=user.name||'Administrator');
  document.querySelectorAll('[data-admin-email]').forEach(el=>el.textContent=user.email||'');
  document.querySelectorAll('[data-admin-avatar]').forEach(el=>el.textContent=initials);
  document.querySelectorAll('[data-admin-logout]').forEach(el=>el.addEventListener('click',async function(e){e.preventDefault();try{await fetch('/api/logout/',{method:'POST',credentials:'same-origin',cache:'no-store'});}catch(_){}localStorage.removeItem(sessionKey);location.href='../../index.html'}));
  const toggle=document.getElementById('adminMenuToggle'), sidebar=document.getElementById('adminSidebar'), overlay=document.getElementById('adminOverlay');
  function close(){sidebar&&sidebar.classList.remove('open');overlay&&overlay.classList.remove('show')}
  toggle&&toggle.addEventListener('click',()=>{sidebar.classList.toggle('open');overlay&&overlay.classList.toggle('show')});
  overlay&&overlay.addEventListener('click',close);
  document.querySelectorAll('#adminSidebar a').forEach(a=>a.addEventListener('click',close));
  const path=location.pathname.split('/').pop();
  document.querySelectorAll('#adminSidebar a[data-page]').forEach(a=>{if(a.dataset.page===path)a.classList.add('active')});
  window.adminSession=user;
})();;

window.escapeAdminHtml=function(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))};
window.apiGet=async function(url){const r=await fetch(url);const d=await r.json();if(!r.ok||d.success===false)throw new Error(d.message||'Request failed');return d};
