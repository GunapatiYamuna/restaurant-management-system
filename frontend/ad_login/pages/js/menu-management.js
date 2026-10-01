/* FoodieHub Admin - Menu Management
   Reads the real menu data from Django and normalizes image paths/availability
   without changing the underlying database values.
*/
(function () {
    const sections = document.getElementById('menuSections');
    const searchInput = document.getElementById('menuSearch');
    const restaurantFilter = document.getElementById('restaurantFilter');

    if (!sections || !searchInput || !restaurantFilter) return;

    let items = [];

    const imageFallbacks = {
        pizza: '/images/cheese%20pizza.png',
        burger: '/images/burger.png',
        biryani: '/images/biriyani.png',
        chinese: '/images/chinese.png',
        'south indian': '/images/southindian.png',
        'north indian': '/images/northindian.png',
        dessert: '/images/desserts.png',
        beverages: '/images/beverages.png'
    };

    function escape(value) {
        return window.escapeAdminHtml ? window.escapeAdminHtml(value) : String(value ?? '');
    }

    function imageUrl(value, category, name) {
        const raw = String(value || '').trim();

        // API may return a complete URL or an absolute frontend path.
        if (/^(https?:|data:|blob:|\/)/i.test(raw)) return raw;

        // Database values such as "images/biriyani.png" must be absolute.
        if (/^images\//i.test(raw)) return '/' + raw.replace(/^\/+/, '');

        if (raw) return '/images/' + raw.replace(/^\/+/, '');

        const key = String(category || '').toLowerCase().trim();
        const foodName = String(name || '').toLowerCase();

        for (const [match, fallback] of Object.entries(imageFallbacks)) {
            if (key.includes(match) || foodName.includes(match)) return fallback;
        }

        return '/images/burger.png';
    }

    function availability(value) {
        // Preserve the actual backend value; only normalize common API formats.
        if (value === true || value === 1 || value === '1') return true;
        if (typeof value === 'string') {
            const v = value.trim().toLowerCase();
            if (['true', 'yes', 'available', 'active', 'in stock'].includes(v)) return true;
            if (['false', 'no', 'unavailable', 'inactive', 'out of stock', '0'].includes(v)) return false;
        }
        if (value === false || value === 0) return false;
        // Older responses may omit the field. Treat that as available rather than
        // incorrectly displaying every item as unavailable.
        return value == null ? true : Boolean(value);
    }

    function formatPrice(value) {
        const number = Number(value);
        if (!Number.isFinite(number)) return '₹0';
        return '₹' + number.toLocaleString('en-IN', { maximumFractionDigits: 2 });
    }

    function populateRestaurants() {
        const seen = new Set();
        const options = [];

        items.forEach(item => {
            const id = item.restaurant_id;
            const name = item.restaurant_name || 'Unknown Restaurant';
            if (id == null || seen.has(String(id))) return;
            seen.add(String(id));
            options.push(`<option value="${escape(id)}">${escape(name)}</option>`);
        });

        restaurantFilter.innerHTML = '<option value="">All restaurants</option>' + options.join('');
    }

    function render() {
        const term = String(searchInput.value || '').trim().toLowerCase();
        const restaurantId = restaurantFilter.value;

        const filtered = items.filter(item => {
            const matchesRestaurant = !restaurantId || String(item.restaurant_id) === restaurantId;
            const searchable = [item.name, item.category, item.restaurant_name, item.description]
                .filter(Boolean).join(' ').toLowerCase();
            return matchesRestaurant && searchable.includes(term);
        });

        const groups = new Map();
        filtered.forEach(item => {
            const restaurantName = item.restaurant_name || 'Unknown Restaurant';
            if (!groups.has(restaurantName)) groups.set(restaurantName, []);
            groups.get(restaurantName).push(item);
        });

        if (!groups.size) {
            sections.innerHTML = '<div class="admin-card admin-empty">No menu items match your filters.</div>';
            return;
        }

        sections.innerHTML = Array.from(groups.entries()).map(([restaurantName, restaurantItems]) => {
            const availableCount = restaurantItems.filter(item => availability(item.available ?? item.is_available ?? item.status)).length;

            return `
                <section class="admin-card menu-restaurant-card">
                    <div class="admin-card-head menu-restaurant-head">
                        <div>
                            <h2>${escape(restaurantName)}</h2>
                            <span>${restaurantItems.length} menu item${restaurantItems.length === 1 ? '' : 's'} · ${availableCount} available</span>
                        </div>
                    </div>
                    <div class="admin-table-wrap">
                        <table class="admin-table menu-admin-table">
                            <thead>
                                <tr>
                                    <th>Item</th>
                                    <th>Category</th>
                                    <th>Price</th>
                                    <th>Availability</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${restaurantItems.map(item => {
                                    const isAvailable = availability(item.available ?? item.is_available ?? item.status);
                                    const src = imageUrl(item.image, item.category, item.name);
                                    const categoryFallback = imageUrl('', item.category, item.name);
                                    return `
                                        <tr>
                                            <td>
                                                <div class="admin-menu-row">
                                                    <img class="menu-item-image" src="${escape(src)}" alt="${escape(item.name)}" loading="lazy" data-fallback="${escape(categoryFallback)}">
                                                    <div class="menu-item-copy">
                                                        <strong>${escape(item.name)}</strong>
                                                        ${item.description ? `<small>${escape(item.description)}</small>` : ''}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>${escape(item.category || 'Other')}</td>
                                            <td><strong>${formatPrice(item.price)}</strong></td>
                                            <td><span class="admin-pill ${isAvailable ? 'pill-green' : 'pill-red'}">${isAvailable ? 'Available' : 'Unavailable'}</span></td>
                                        </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </section>`;
        }).join('');

        sections.querySelectorAll('img[data-fallback]').forEach(img => {
            img.addEventListener('error', function () {
                const fallback = this.dataset.fallback;
                if (fallback && this.src !== new URL(fallback, window.location.origin).href) {
                    this.src = fallback;
                } else {
                    this.style.visibility = 'hidden';
                }
            }, { once: true });
        });
    }

    async function loadMenu() {
        sections.innerHTML = `
            <div class="admin-card admin-empty menu-loading">
                <i class="bi bi-arrow-repeat spin"></i>
                <div>Loading menu from FoodieHub...</div>
            </div>`;

        try {
            const data = await window.apiGet('/api/menu-items/');
            items = Array.isArray(data.items) ? data.items : [];
            populateRestaurants();
            render();
        } catch (error) {
            console.error('Menu Management:', error);
            sections.innerHTML = `
                <div class="admin-card admin-empty menu-error">
                    <i class="bi bi-exclamation-circle"></i>
                    <strong>Unable to load menu data</strong>
                    <span>Make sure Django is running and the menu API is available.</span>
                    <button type="button" class="admin-btn" id="menuRetry">Retry</button>
                </div>`;
            document.getElementById('menuRetry')?.addEventListener('click', loadMenu);
        }
    }

    searchInput.addEventListener('input', render);
    restaurantFilter.addEventListener('change', render);
    loadMenu();
})();
