
const RKEY='foodiehub_restaurant_session';
async function api(url,opt={}){const r=await fetch(url,{credentials:'same-origin',cache:'no-store',...opt});const d=await r.json().catch(()=>({}));if(!r.ok||d.success===false)throw new Error(d.message||'Request failed');return d}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function money(v){return `₹${Number(v||0).toLocaleString('en-IN')}`}
function initials(name){return String(name||'R').split(/\s+/).map(x=>x[0]).join('').slice(0,2).toUpperCase()}
function toast(msg){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';t.className='toast';document.body.appendChild(t)}t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
async function requireRestaurant(){try{const d=await api('/api/restaurant/me/');document.querySelectorAll('[data-rname]').forEach(x=>x.textContent=d.restaurant.name);document.querySelectorAll('[data-avatar]').forEach(x=>x.textContent=initials(d.restaurant.name));document.querySelectorAll('[data-user]').forEach(x=>x.textContent=d.user.name||'Partner');return d}catch(e){location.href='login.html';throw e}}
async function logoutRestaurant(){try{await api('/api/logout/',{method:'POST'})}catch(e){}localStorage.removeItem(RKEY);localStorage.removeItem('foodiehub_session');location.href='login.html'}
document.addEventListener('DOMContentLoaded',()=>document.getElementById('logout')?.addEventListener('click',logoutRestaurant));

async function loadDashboard(){
 try{
  // /api/restaurant/me/ returns identity only.
  // /api/restaurant/dashboard/ returns the live restaurant KPIs.
  const me = await requireRestaurant();
  const d = await api('/api/restaurant/dashboard/');

  const restaurantNameEl = document.getElementById('restaurantName');
  if (restaurantNameEl) {
    restaurantNameEl.textContent = d.restaurant.name;
  }
  document.getElementById('menu').textContent = Number(d.stats?.menu_items ?? 0);
  document.getElementById('orders').textContent = Number(d.stats?.orders ?? 0);
  document.getElementById('pendingOrders').textContent = Number(d.stats?.pending_orders ?? 0);
  document.getElementById('reservations').textContent = Number(d.stats?.reservations ?? 0);

  document.getElementById('account').innerHTML =
    `<b>${esc(me.user.name)}</b><br>${esc(me.user.email)}<br>${esc(d.restaurant.location||'')}`;

  const od = await api('/api/restaurant/orders/').catch(()=>({orders:[]}));
  const recent = (od.orders || []).slice(0,6);
  const el = document.getElementById('recentOrders');
  if(el) {
    el.innerHTML = recent.map(o =>
      `<div class="kpi-line"><span><b>#${o.id}</b> · ${esc(o.name)}</span><span>${money(o.total)}</span></div>`
    ).join('') || '<div class="empty">No orders yet.</div>';
  }
 }catch(e){
  console.error('Dashboard load failed:', e);
  ['menu','orders','pendingOrders','reservations'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.textContent='0';
  });
  const el=document.getElementById('recentOrders');
  if(el) el.innerHTML=`<div class="empty">${esc(e.message||'Unable to load dashboard data.')}</div>`;
 }
}

async function loadMenu(){
 try{
  await requireRestaurant();const d=await api('/api/restaurant/menu/');const el=document.getElementById('rows');
  el.innerHTML=(d.items||[]).map(i=>`<tr><td><div class="item-cell"><img class="item-thumb" src="${esc(i.image||'/static/images/default-food.jpg')}" onerror="this.style.visibility='hidden'"><div><b>${esc(i.name)}</b><div class="small">${esc(i.description||'')}</div></div></div></td><td>${esc(i.category||'Other')}</td><td>${money(i.price)}</td><td><button class="status ${i.available?'on':'off'}" onclick="toggleMenu(${i.id},${!i.available})">${i.available?'Available':'Unavailable'}</button></td><td><button class="btn" onclick="editMenu(${i.id})">Edit</button> <button class="btn danger" onclick="deleteMenu(${i.id})">Delete</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">No menu items yet.</td></tr>';
 }catch(e){document.getElementById('rows').innerHTML=`<tr><td colspan="5">${esc(e.message)}</td></tr>`}
}
async function addMenu(e){e.preventDefault();try{const body=new URLSearchParams({name:mName.value.trim(),category:mCategory.value.trim(),description:mDescription.value.trim(),price:mPrice.value,image:mImage.value.trim(),available:'true'});await api('/api/restaurant/menu/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});e.target.reset();toast('Menu item added');loadMenu()}catch(err){alert(err.message)}}
async function toggleMenu(id,val){try{await api('/api/restaurant/menu/'+id+'/',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({available:val})});loadMenu();toast(val?'Item available':'Item hidden')}catch(e){alert(e.message)}}
async function editMenu(id){const price=prompt('New price:');if(price===null)return;try{await api('/api/restaurant/menu/'+id+'/',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({price})});loadMenu();toast('Price updated')}catch(e){alert(e.message)}}
async function deleteMenu(id){if(!confirm('Delete this menu item?'))return;try{await api('/api/restaurant/menu/'+id+'/',{method:'DELETE'});loadMenu();toast('Menu item deleted')}catch(e){alert(e.message)}}

async function loadOrders(){
 try{await requireRestaurant();const d=await api('/api/restaurant/orders/');const el=document.getElementById('rows');
 el.innerHTML=(d.orders||[]).map(o=>`<tr><td><b>#${o.id}</b><div class="small">${esc(o.created_at||'')}</div></td><td><b>${esc(o.name)}</b><div class="small">${esc(o.phone)} · ${esc(o.address)}</div></td><td>${o.items.map(i=>`${esc(i.name)} × ${i.quantity}`).join('<br>')}</td><td><b>${money(o.total)}</b></td><td><select onchange="setOrder(${o.id},this.value)">${['placed','confirmed','preparing','ready','out_for_delivery','delivered','cancelled'].map(s=>`<option ${s===o.status?'selected':''}>${s}</option>`).join('')}</select></td></tr>`).join('')||'<tr><td colspan="5" class="empty">No orders yet.</td></tr>';
 }catch(e){document.getElementById('rows').innerHTML=`<tr><td colspan="5">${esc(e.message)}</td></tr>`}
}
async function setOrder(id,status){try{await api('/api/restaurant/orders/'+id+'/',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});toast('Order status updated')}catch(e){alert(e.message)}}

async function loadReservations(){
 try{await requireRestaurant();const d=await api('/api/restaurant/reservations/');const el=document.getElementById('cards');
 el.innerHTML=(d.reservations||[]).map(r=>`<article class="card"><div class="cardhead"><div><h2>#${r.id} · ${esc(r.name)}</h2><div class="small">${esc(r.email)} · ${esc(r.phone)}</div></div><select onchange="setReservation(${r.id},this.value)">${['pending','confirmed','completed','cancelled'].map(s=>`<option ${s===r.status?'selected':''}>${s}</option>`).join('')}</select></div><p><b>${esc(r.date)}</b> at <b>${esc(r.time)}</b> · ${r.guests} guest${r.guests==1?'':'s'}</p><div class="small">${r.message?esc(r.message):'No message'}</div><div class="small" style="margin-top:8px"><b>Customer attendance:</b> ${r.attendance_response==='coming'?'Coming':r.attendance_response==='not_coming'?'Not coming':'Awaiting response'}</div><div class="prebook">${r.items.length?r.items.map(i=>`${esc(i.name)} × ${i.quantity}`).join(' · '):'No pre-booked food'} ${r.prebook_total?`<b>· ${money(r.prebook_total)}</b>`:''}</div>${r.payment?`<div class="small" style="margin-top:8px"><b>Food payment:</b> 50% paid ${money(r.payment.upfront_amount)} · Remaining ${money(r.payment.remaining_amount)} · ${esc(r.payment.remaining_status)}${r.payment.refund_status==='processed'?` · Refund ${money(r.payment.refund_amount)} (${esc(r.payment.refund_type)})`:''}</div>`:''} </article>`).join('')||'<div class="card empty">No reservations yet.</div>';
 }catch(e){document.getElementById('cards').innerHTML=`<div class="card">${esc(e.message)}</div>`}
}
async function setReservation(id,status){try{await api('/api/restaurant/reservations/'+id+'/',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});toast('Reservation updated')}catch(e){alert(e.message)}}

async function loadInventory(){
 try{await requireRestaurant();const d=await api('/api/restaurant/inventory/');const el=document.getElementById('rows');
 el.innerHTML=(d.items||[]).map(i=>`<tr><td><b>${esc(i.name)}</b></td><td>${i.quantity} ${esc(i.unit)}</td><td>${i.reorder_level}</td><td>${i.quantity<=i.reorder_level?'<span class="badge amber">Low stock</span>':'<span class="badge green">Healthy</span>'}</td><td><button class="btn danger" onclick="deleteInventory(${i.id})">Delete</button></td></tr>`).join('')||'<tr><td colspan="5" class="empty">No inventory items yet.</td></tr>';
 }catch(e){document.getElementById('rows').innerHTML=`<tr><td colspan="5">${esc(e.message)}</td></tr>`}
}
async function addInventory(e){e.preventDefault();try{const body=new URLSearchParams({name:iName.value.trim(),quantity:iQty.value,unit:iUnit.value,reorder_level:iReorder.value});await api('/api/restaurant/inventory/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});e.target.reset();loadInventory();toast('Inventory item added')}catch(err){alert(err.message)}}
async function deleteInventory(id){if(!confirm('Delete this inventory item?'))return;try{await api('/api/restaurant/inventory/'+id+'/',{method:'DELETE'});loadInventory();toast('Inventory item deleted')}catch(e){alert(e.message)}}

async function loadReports(){
 try{
  const d=await requireRestaurant();
  const [od,rv]=await Promise.all([api('/api/restaurant/orders/').catch(()=>({orders:[]})),api('/api/restaurant/reservations/').catch(()=>({reservations:[]}))]);
  const orders=od.orders||[], reservations=rv.reservations||[];
  const revenue=orders.reduce((s,o)=>s+Number(o.total||0),0);
  document.getElementById('rRevenue').textContent=money(revenue);
  document.getElementById('rOrders').textContent=orders.length;
  document.getElementById('rReservations').textContent=reservations.length;
  document.getElementById('rAvg').textContent=money(orders.length?revenue/orders.length:0);
  const status={placed:0,confirmed:0,preparing:0,ready:0,out_for_delivery:0,delivered:0,cancelled:0};
  orders.forEach(o=>status[o.status]=(status[o.status]||0)+1);
  const max=Math.max(1,...Object.values(status));
  document.getElementById('orderChart').innerHTML=Object.entries(status).filter(([k])=>k!=='cancelled').map(([k,v])=>`<div class="bar" style="height:${Math.max(8,(v/max)*155)}px" title="${k}: ${v}"><span>${k.replaceAll('_',' ').slice(0,8)}</span></div>`).join('');
 }catch(e){console.error(e)}
}
