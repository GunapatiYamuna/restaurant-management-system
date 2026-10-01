document.addEventListener("DOMContentLoaded", async function () {
    const params = new URLSearchParams(window.location.search);
    const restaurantId = Number(params.get("id")) || Number(localStorage.getItem("foodieSelectedRestaurantId")) || 1;
    localStorage.setItem("foodieSelectedRestaurantId", String(restaurantId));

    try {
        const response = await fetch(`/api/restaurants/${restaurantId}/`);
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Restaurant not found.");
        const r = result.restaurant;

        document.title = `FoodieHub | ${r.name}`;
        setText("restaurantName", r.name);
        setText("restaurantCuisine", r.cuisine || "Restaurant");
        setText("restaurantRating", `★ ${Number(r.rating || 0).toFixed(1)} (${r.reviews || 0} reviews)`);
        setText("restaurantLocation", `📍 ${r.location || "Ongole"}`);
        setText("restaurantPrice", r.price || "₹₹");
        setText("restaurantDescription", r.description || "Enjoy a delicious dining experience at this FoodieHub restaurant.");
        setText("aboutTitle", `${r.name} — Dining Experience`);
        setText("bookingLocation", r.location || "Ongole");
        setText("bookingRestaurant", r.name);
        const hero=document.getElementById("restaurantHeroImage");
        if (hero && r.image) { hero.src=r.image; hero.alt=r.name; }

        const menu=document.getElementById("prebookMenu");
        const items=r.menu || [];
        if (!items.length) {
            menu.innerHTML='<div class="text-muted py-3">No menu items are currently available.</div>';
        } else {
            menu.innerHTML=items.map(item=>`<div class="menu-item prebook-row" data-id="${item.id}" data-price="${Number(item.price||0)}">
                <div><h4>${esc(item.name)}</h4><p>${esc(item.description||item.category||'Deliciously prepared for you.')}</p><small>${esc(item.category||'Menu')}</small></div>
                <div class="text-end"><strong>₹${Number(item.price||0).toFixed(0)}</strong><div class="mt-2 d-flex align-items-center gap-2 justify-content-end"><button class="btn btn-sm btn-outline-dark prebook-minus" type="button">−</button><span class="prebook-qty fw-bold">0</span><button class="btn btn-sm btn-outline-dark prebook-plus" type="button">+</button></div></div>
            </div>`).join('');
            bindPrebook(items);
        }

        document.getElementById("prebookButton")?.addEventListener("click", function(){
            const selected=readSelectedItems(items);
            if (!selected.length) { alert("Please select at least one item to pre-book."); return; }
            localStorage.setItem("foodiePrebook", JSON.stringify({restaurant_id:r.id, restaurant_name:r.name, items:selected}));
            window.location.href="booking.html";
        });
        document.getElementById("reserveOnlyButton")?.addEventListener("click", function(e){
            e.preventDefault();
            localStorage.setItem("foodiePrebook", JSON.stringify({restaurant_id:r.id, restaurant_name:r.name, items:[]}));
            window.location.href="booking.html";
        });
    } catch(e) {
        console.error(e);
        const menu=document.getElementById("prebookMenu"); if(menu) menu.innerHTML='<div class="text-danger py-3">Unable to load this restaurant.</div>';
    }
});
function bindPrebook(items){
 document.querySelectorAll('.prebook-row').forEach(row=>{
   row.querySelector('.prebook-plus').addEventListener('click',()=>{ const q=row.querySelector('.prebook-qty'); q.textContent=Number(q.textContent)+1; updateTotal(); });
   row.querySelector('.prebook-minus').addEventListener('click',()=>{ const q=row.querySelector('.prebook-qty'); q.textContent=Math.max(0,Number(q.textContent)-1); updateTotal(); });
 });
}
function readSelectedItems(items){ return items.map(i=>{const row=document.querySelector(`.prebook-row[data-id="${i.id}"]`); return {id:i.id,name:i.name,price:Number(i.price),quantity:Number(row?.querySelector('.prebook-qty')?.textContent||0)};}).filter(i=>i.quantity>0); }
function updateTotal(){let t=0;document.querySelectorAll('.prebook-row').forEach(r=>t+=Number(r.dataset.price||0)*Number(r.querySelector('.prebook-qty')?.textContent||0));const e=document.getElementById('prebookTotal');if(e)e.textContent=`₹${t.toFixed(0)}`;}
function setText(id,v){const e=document.getElementById(id);if(e)e.textContent=v;}
function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
