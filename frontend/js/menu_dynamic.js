document.addEventListener("DOMContentLoaded", async function () {
    const root = document.getElementById("dynamicMenuSections");
    if (!root) return;

    try {
        const response = await fetch("/api/menu-items/");
        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load menu.");
        }

        const items = Array.isArray(result.items) ? result.items : [];

        if (!items.length) {
            root.innerHTML = `
                <section class="container py-5">
                    <div class="text-center text-muted">
                        <h4>No menu items are available yet.</h4>
                        <p>Please add restaurant menu items in the database.</p>
                    </div>
                </section>`;
            return;
        }

        /*
         * Delivery menu:
         * All available items from all restaurants are shown here.
         * Items remain linked to their real restaurant through
         * restaurant_id, so the cart/order API knows where they came from.
         */
        const groups = {};
        items.forEach(item => {
            const category = String(item.category || "Other").trim() || "Other";
            if (!groups[category]) groups[category] = [];
            groups[category].push(item);
        });

        const categoryOrder = [
            "Pizza",
            "Burgers",
            "Biryani",
            "South Indian",
            "North Indian",
            "Chinese",
            "Pasta",
            "Starters",
            "Beverages",
            "Desserts"
        ];

        const categories = [
            ...categoryOrder.filter(category => groups[category]),
            ...Object.keys(groups).filter(category => !categoryOrder.includes(category))
        ];

        root.innerHTML = categories.map(category => {
            const sectionId = `menu-${slug(category)}`;

            return `
                <section class="container py-4" id="${sectionId}">
                    <h2 class="text-center fw-bold mb-5">
                        ${categoryIcon(category)} ${escapeHtml(category)}
                    </h2>
                    <div class="row g-4">
                        ${groups[category].map(menuCard).join("")}
                    </div>
                </section>`;
        }).join("");

        /* Keep the existing category buttons and only point them to
           the categories that actually exist in the database. */
        document.querySelectorAll(".category-btn").forEach(button => {
            const label = button.textContent
                .replace(/[^A-Za-z ]/g, "")
                .trim()
                .toLowerCase();

            const match = categories.find(category =>
                category.toLowerCase() === label
            );

            if (match) {
                button.href = `#menu-${slug(match)}`;
                button.style.display = "inline-block";
            } else {
                button.style.display = "none";
            }
        });

        /* Delivery ordering only: Add to Cart never writes to pre-book data. */
        if (typeof setupAddToCartButtons === "function") {
            setupAddToCartButtons();
        }

        if (typeof updateCartCount === "function") {
            updateCartCount();
        }

    } catch (error) {
        console.error("Menu loading error:", error);
        root.innerHTML = `
            <section class="container py-5">
                <div class="text-center text-danger">
                    Unable to load the menu. Please make sure the Django server is running.
                </div>
            </section>`;
    }
});

function menuCard(item) {
    const image = item.image ||
        "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80";

    const price = Number(item.price || 0).toFixed(0);
    const restaurantName = item.restaurant_name || "Restaurant";

    return `
        <div class="col-md-6 col-lg-4">
            <div class="card h-100 shadow">
                <img
                    src="${escapeAttr(image)}"
                    class="card-img-top"
                    alt="${escapeAttr(item.name)}"
                    onerror="this.src='https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80'">

                <div class="card-body text-center">
                    <h5 class="card-title">
                        ${escapeHtml(item.name)}
                    </h5>

                    <p class="text-warning">
                        ★★★★★
                    </p>

                    <h4 class="text-dark">
                        &#8377;${price}
                    </h4>

                    <p>
                        ${escapeHtml(item.description || "Freshly prepared and available for delivery.")}
                    </p>

                    <p class="mb-3">
                        <small class="text-muted">
                            <i class="bi bi-shop"></i>
                            ${escapeHtml(restaurantName)}
                        </small>
                    </p>

                    <button
                        class="btn btn-warning add-to-cart"
                        type="button"
                        data-id="${Number(item.id)}"
                        data-restaurant-id="${Number(item.restaurant_id)}"
                        data-restaurant-name="${escapeAttr(restaurantName)}"
                        data-name="${escapeAttr(item.name)}"
                        data-price="${price}"
                        data-image="${escapeAttr(image)}">
                        <i class="bi bi-cart-fill"></i>
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>`;
}

function slug(value) {
    return String(value)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function categoryIcon(category) {
    return ({
        "Pizza": "🍕",
        "Burgers": "🍔",
        "Biryani": "🍛",
        "South Indian": "🥞",
        "North Indian": "🍲",
        "Chinese": "🍜",
        "Pasta": "🍝",
        "Starters": "🍟",
        "Beverages": "🥤",
        "Desserts": "🍰"
    }[category] || "🍽️");
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>\'"]/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
    }[character]));
}

function escapeAttr(value) {
    return escapeHtml(value);
}
// After adding item to cart 
function showGoToCartButton() 
{ let button = document.getElementById("goToCartButton"); if (!button) { button = document.createElement("button"); button.id = "goToCartButton"; button.className = "primary-btn"; button.innerHTML = '<i class="fa-solid fa-cart-shopping"></i> Go to Cart'; button.style.position = "fixed"; button.style.right = "25px"; button.style.bottom = "25px"; button.style.zIndex = "9999"; button.addEventListener("click", function () { window.location.href = "cart.html"; }); document.body.appendChild(button); } button.style.display = "block"; }