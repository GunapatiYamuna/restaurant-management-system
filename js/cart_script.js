document.addEventListener("DOMContentLoaded", function () {

    let cart = JSON.parse(localStorage.getItem("foodieCart")) || [];

    // =========================
    // ADD TO CART
    // =========================

    const addButtons = document.querySelectorAll(".add-to-cart, .add-cart");

    addButtons.forEach(function (button) {

        button.addEventListener("click", function () {

            const name = button.getAttribute("data-name");
            const price = Number(button.getAttribute("data-price"));
            const image = button.getAttribute("data-image") || "";

            const existingItem = cart.find(function (item) {
                return item.name === name;
            });

            if (existingItem) {

                existingItem.quantity += 1;

            } else {

                cart.push({
                    name: name,
                    price: price,
                    image: image,
                    quantity: 1
                });

            }

            // Save cart
            localStorage.setItem("foodieCart", JSON.stringify(cart));

            // Button feedback
            const oldHTML = button.innerHTML;

            button.innerHTML = "✓ Added";
            button.disabled = true;

            setTimeout(function () {
                button.innerHTML = oldHTML;
                button.disabled = false;
            }, 1000);

            updateCartCount();

        });

    });


    // =========================
    // CART PAGE
    // =========================

    renderCart();

    // Update navbar cart count
    updateCartCount();

});


// ========================================
// RENDER CART ITEMS
// ========================================

function renderCart() {

    const cartItemsContainer = document.getElementById("cart-items");

    // Not on cart page
    if (!cartItemsContainer) {
        return;
    }

    const cart = JSON.parse(localStorage.getItem("foodieCart")) || [];

    // Empty cart
    if (cart.length === 0) {

        cartItemsContainer.innerHTML = `
            <div class="text-center p-5">
                <i class="bi bi-cart-x" style="font-size:50px;"></i>
                <h4 class="mt-3">Your cart is empty</h4>
                <p class="text-muted">
                    Add some delicious food to your cart.
                </p>
                <a href="menu.html" class="btn btn-warning">
                    Browse Menu
                </a>
            </div>
        `;

        updateBill(0);
        return;
    }


    // Create cart items
    cartItemsContainer.innerHTML = cart.map(function (item, index) {

        return `
            <div class="card shadow-sm mb-3 p-3">

                <div class="row align-items-center">

                    <div class="col-md-2 text-center">

                        ${
                            item.image
                            ? `<img src="${item.image}"
                                    alt="${item.name}"
                                    style="width:100px;height:80px;object-fit:cover;border-radius:10px;"
                                    onerror="this.style.display='none';">`
                            : `<i class="bi bi-egg-fried" style="font-size:40px;"></i>`
                        }

                    </div>


                    <div class="col-md-4">

                        <h5 class="fw-bold mb-1">
                            ${item.name}
                        </h5>

                        <p class="mb-0 text-muted">
                            ₹${item.price}
                        </p>

                    </div>


                    <div class="col-md-3">

                        <div class="d-flex align-items-center justify-content-center gap-2">

                            <button
                                class="btn btn-outline-dark quantity-btn"
                                onclick="changeQuantity(${index}, -1)">
                                −
                            </button>

                            <strong>
                                ${item.quantity}
                            </strong>

                            <button
                                class="btn btn-outline-dark quantity-btn"
                                onclick="changeQuantity(${index}, 1)">
                                +
                            </button>

                        </div>

                    </div>


                    <div class="col-md-2 text-center">

                        <strong class="text-warning">
                            ₹${item.price * item.quantity}
                        </strong>

                    </div>


                    <div class="col-md-1 text-center">

                        <button
                            class="btn btn-danger"
                            onclick="removeItem(${index})">

                            <i class="bi bi-trash"></i>

                        </button>

                    </div>

                </div>

            </div>
        `;

    }).join("");


    // Calculate subtotal
    let subtotal = cart.reduce(function (total, item) {

        return total + (item.price * item.quantity);

    }, 0);


    updateBill(subtotal);

}


// ========================================
// CHANGE QUANTITY
// ========================================

function changeQuantity(index, amount) {

    let cart = JSON.parse(localStorage.getItem("foodieCart")) || [];

    if (!cart[index]) {
        return;
    }

    cart[index].quantity += amount;


    // Remove if quantity becomes zero
    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }


    localStorage.setItem("foodieCart", JSON.stringify(cart));

    renderCart();
    updateCartCount();

}


// ========================================
// REMOVE ITEM
// ========================================

function removeItem(index) {

    let cart = JSON.parse(localStorage.getItem("foodieCart")) || [];

    cart.splice(index, 1);

    localStorage.setItem("foodieCart", JSON.stringify(cart));

    renderCart();
    updateCartCount();

}


// ========================================
// UPDATE BILL
// ========================================

function updateBill(subtotal) {

    const subtotalElement = document.getElementById("subtotal");
    const deliveryElement = document.getElementById("deliveryFee");
    const discountElement = document.getElementById("discount");
    const gstElement = document.getElementById("gst");
    const totalElement = document.getElementById("total");


    // Delivery fee
    const deliveryFee = subtotal > 0 ? 50 : 0;


    // GST = 5%
    const gst = subtotal * 0.05;


    // No discount for now
    const discount = 0;


    const total = subtotal + deliveryFee + gst - discount;


    if (subtotalElement) {
        subtotalElement.textContent = "₹" + subtotal.toFixed(0);
    }

    if (deliveryElement) {
        deliveryElement.textContent = "₹" + deliveryFee;
    }

    if (discountElement) {
        discountElement.textContent = "-₹" + discount;
    }

    if (gstElement) {
        gstElement.textContent = "₹" + gst.toFixed(0);
    }

    if (totalElement) {
        totalElement.textContent = "₹" + total.toFixed(0);
    }

}


// ========================================
// UPDATE NAVBAR CART COUNT
// ========================================

function updateCartCount() {

    const cart = JSON.parse(localStorage.getItem("foodieCart")) || [];

    const totalItems = cart.reduce(function (total, item) {

        return total + item.quantity;

    }, 0);


    const cartIcons = document.querySelectorAll(".nav-cart");


    cartIcons.forEach(function (cartIcon) {

        let countBadge = cartIcon.querySelector(".cart-count");


        if (!countBadge) {

            countBadge = document.createElement("span");

            countBadge.className = "cart-count";

            cartIcon.style.position = "relative";

            cartIcon.appendChild(countBadge);

        }


        countBadge.textContent = totalItems;

    });

}