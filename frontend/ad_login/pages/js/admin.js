(function(){
  const sessionKey='foodiehub_session';
  function session(){try{return JSON.parse(localStorage.getItem(sessionKey))||null}catch(e){return null}}
  const user=session();
  if(!user || user.role!=='admin'){
    if(!location.pathname.endsWith('/login_register.html')) location.href='../login_register.html';
    return;
  }
  const first=(user.name||'Admin').trim().split(/\s+/)[0]||'Admin';
  const initials=(user.name||'Admin').trim().split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0].toUpperCase()).join('')||'A';
  document.querySelectorAll('[data-admin-name]').forEach(el=>el.textContent=first);
  document.querySelectorAll('[data-admin-fullname]').forEach(el=>el.textContent=user.name||'Administrator');
  document.querySelectorAll('[data-admin-email]').forEach(el=>el.textContent=user.email||'');
  document.querySelectorAll('[data-admin-avatar]').forEach(el=>el.textContent=initials);
  document.querySelectorAll('[data-admin-logout]').forEach(el=>el.addEventListener('click',function(e){e.preventDefault();localStorage.removeItem(sessionKey);fetch('/api/logout/',{method:'POST'}).catch(()=>{});location.href='../login_register.html'}));
  const toggle=document.getElementById('adminMenuToggle'), sidebar=document.getElementById('adminSidebar'), overlay=document.getElementById('adminOverlay');
  function close(){sidebar&&sidebar.classList.remove('open');overlay&&overlay.classList.remove('show')}
  toggle&&toggle.addEventListener('click',()=>{sidebar.classList.toggle('open');overlay&&overlay.classList.toggle('show')});
  overlay&&overlay.addEventListener('click',close);
  document.querySelectorAll('#adminSidebar a').forEach(a=>a.addEventListener('click',close));
  const path=location.pathname.split('/').pop();
  document.querySelectorAll('#adminSidebar a[data-page]').forEach(a=>{if(a.dataset.page===path)a.classList.add('active')});
  window.adminSession=user;
})();

window.escapeAdminHtml=function(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))};
window.apiGet=async function(url){const r=await fetch(url);const d=await r.json();if(!r.ok||d.success===false)throw new Error(d.message||'Request failed');return d};
