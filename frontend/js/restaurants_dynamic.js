document.addEventListener("DOMContentLoaded", async function () {
    const grid = document.getElementById("restaurantGrid");
    if (!grid) return;

    try {
        const response = await fetch("/api/restaurants/");
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.message || "Unable to load restaurants.");

        const restaurants = result.restaurants || [];
        const cuisineSelect = document.getElementById("cuisineFilter");
        if (cuisineSelect) {
            const cuisines = [...new Set(restaurants.flatMap(r => String(r.cuisine || "").split(",").map(x => x.trim()).filter(Boolean)))].sort();
            cuisineSelect.innerHTML = '<option value="all">All Cuisines</option>' + cuisines.map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`).join('');
        }
        grid.innerHTML = restaurants.map((r, index) => {
            const image = r.image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80";
            return `
            <div class="col-lg-4 col-md-6 restaurant-item"
                 data-name="${escapeHtml(r.name)}"
                 data-cuisine="${escapeHtml(r.cuisine || "")}" 
                 data-price="${escapeHtml(r.price || "₹₹")}" 
                 data-rating="${Number(r.rating || 0)}">
                <div class="restaurant-card">
                    <div class="restaurant-image">
                        <img src="${escapeAttr(image)}" alt="${escapeAttr(r.name)}" onerror="this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=900&q=80';">
                        ${index < 3 ? '<span class="featured-tag">Featured</span>' : ''}
                        <button class="favorite-btn" type="button"><i class="bi bi-heart"></i></button>
                    </div>
                    <div class="restaurant-card-body">
                        <div class="restaurant-top">
                            <div>
                                <h3>${escapeHtml(r.name)}</h3>
                                <p><i class="bi bi-geo-alt"></i> ${escapeHtml(r.location || "Ongole")}</p>
                            </div>
                            <span class="rating"><i class="bi bi-star-fill"></i> ${Number(r.rating || 0).toFixed(1)}</span>
                        </div>
                        <div class="restaurant-tags">
                            <span>${escapeHtml(r.cuisine || "Indian")}</span>
                            <span>${escapeHtml(r.price || "₹₹")}</span>
                            <span>${Number(r.reviews || 0)} reviews</span>
                        </div>
                        <p class="restaurant-description">${escapeHtml(r.description || "Enjoy delicious food and a comfortable dining experience.")}</p>
                        <div class="restaurant-footer">
                            <span><i class="bi bi-clock"></i> 10:00 AM - 11:00 PM</span>
                            <a href="restaurant-details.html?id=${encodeURIComponent(r.id)}" class="view-btn">View Details <i class="bi bi-arrow-right"></i></a>
                        </div>
                    </div>
                </div>
            </div>`;
        }).join("");

        bindFavorites();
        document.querySelectorAll("#restaurantSearch, #cuisineFilter, #priceFilter, #ratingFilter").forEach(el => el.dispatchEvent(new Event(el.tagName === 'INPUT' ? 'input' : 'change')));
        const count = document.getElementById("restaurantCount");
        if (count) count.textContent = `${restaurants.length} Restaurant${restaurants.length !== 1 ? 's' : ''}`;
    } catch (error) {
        console.error(error);
        grid.innerHTML = `<div class="col-12 text-center py-5 text-danger">Unable to load restaurants. Please make sure the Django server is running.</div>`;
    }
});

function bindFavorites() {
    document.querySelectorAll(".favorite-btn").forEach(button => {
        button.addEventListener("click", function () {
            button.classList.toggle("active");
            const icon = button.querySelector("i");
            if (!icon) return;
            icon.classList.toggle("bi-heart", !button.classList.contains("active"));
            icon.classList.toggle("bi-heart-fill", button.classList.contains("active"));
        });
    });
}
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function escapeAttr(value) { return escapeHtml(value); }
