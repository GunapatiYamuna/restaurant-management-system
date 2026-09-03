document.addEventListener("DOMContentLoaded", function () {

    updateCartCount();
    setupAddToCartButtons();
    renderCartPage();
    renderCheckoutPage();
    setupPaymentMethods();
    setupPlaceOrder();
    renderOrderHistory();

});


/* =========================================================
   GET CART
========================================================= */

function getCart() {

    try {

        return JSON.parse(
            localStorage.getItem("foodieCart")
        ) || [];

    } catch (error) {

        console.error("Error reading cart:", error);

        return [];

    }

}


/* =========================================================
   SAVE CART
========================================================= */

function saveCart(cart) {

    localStorage.setItem(
        "foodieCart",
        JSON.stringify(cart)
    );

    updateCartCount();

}


/* =========================================================
   ADD TO CART
========================================================= */

function setupAddToCartButtons() {

    const buttons =
        document.querySelectorAll(
            ".add-to-cart, .add-cart"
        );

    buttons.forEach(function (button) {

        button.addEventListener("click", function () {

            const name =
                button.getAttribute("data-name");

            const price =
                Number(
                    button.getAttribute("data-price")
                );

            const image =
                button.getAttribute("data-image") || "";

            if (!name || !price) {

                console.error(
                    "Missing data-name or data-price"
                );

                return;

            }

            let cart = getCart();

            const existingItem =
                cart.find(function (item) {

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


            saveCart(cart);


            const oldHTML =
                button.innerHTML;


            button.innerHTML =
                "✓ Added";

            button.disabled = true;


            setTimeout(function () {

                button.innerHTML =
                    oldHTML;

                button.disabled = false;

            }, 1000);


        });

    });

}


/* =========================================================
   CART COUNT
========================================================= */

function updateCartCount() {

    const cart = getCart();

    const totalItems =
        cart.reduce(function (total, item) {

            return total +
                Number(item.quantity || 0);

        }, 0);


    const cartLinks =
        document.querySelectorAll(".nav-cart");


    cartLinks.forEach(function (cartIcon) {

        let badge =
            cartIcon.querySelector(".cart-count");


        if (!badge) {

            badge =
                document.createElement("span");

            badge.className =
                "cart-count";

            cartIcon.style.position =
                "relative";

            cartIcon.appendChild(badge);

        }


        badge.textContent =
            totalItems;

    });

}


/* =========================================================
   RENDER CART PAGE
========================================================= */

function renderCartPage() {

    const container =
        document.getElementById("cart-items");

    if (!container) {

        return;

    }


    const cart = getCart();


    if (cart.length === 0) {

        container.innerHTML = `

            <div class="text-center py-5">

                <i
                    class="bi bi-cart-x"
                    style="font-size:60px;"
                ></i>

                <h3 class="mt-3">
                    Your cart is empty
                </h3>

                <a
                    href="menu.html"
                    class="btn btn-warning mt-3"
                >
                    Continue Shopping
                </a>

            </div>

        `;

        updateCartTotals();

        return;

    }


    container.innerHTML = "";


    cart.forEach(function (item, index) {

        const image =
            item.image || "images/default-food.png";


        const quantity =
            Number(item.quantity) || 1;


        const price =
            Number(item.price) || 0;


        const itemTotal =
            price * quantity;


        const itemDiv =
            document.createElement("div");


        itemDiv.className =
            "cart-item d-flex align-items-center justify-content-between mb-3 p-3";


        itemDiv.innerHTML = `

            <div class="d-flex align-items-center">

                <img
                    src="${image}"
                    alt="${item.name}"
                    style="
                        width:90px;
                        height:70px;
                        object-fit:cover;
                        border-radius:10px;
                        margin-right:20px;
                    "
                    onerror="
                        this.src='images/default-food.png';
                    "
                >

                <div>

                    <h5 class="fw-bold mb-1">
                        ${item.name}
                    </h5>

                    <p class="mb-0">
                        ₹${price}
                    </p>

                </div>

            </div>


            <div class="d-flex align-items-center">

                <button
                    class="btn btn-outline-dark quantity-minus"
                    data-index="${index}">
                    −
                </button>


                <span
                    class="mx-3 fw-bold">
                    ${quantity}
                </span>


                <button
                    class="btn btn-outline-dark quantity-plus"
                    data-index="${index}">
                    +
                </button>

            </div>


            <strong>
                ₹${itemTotal}
            </strong>


            <button
                class="btn btn-danger delete-cart-item"
                data-index="${index}">
                <i class="bi bi-trash"></i>
            </button>

        `;


        container.appendChild(itemDiv);

    });


    setupCartButtons();

    updateCartTotals();

}


/* =========================================================
   CART BUTTONS
========================================================= */

function setupCartButtons() {

    document
        .querySelectorAll(".quantity-minus")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const index =
                        Number(
                            button.getAttribute(
                                "data-index"
                            )
                        );

                    let cart = getCart();


                    if (
                        cart[index] &&
                        cart[index].quantity > 1
                    ) {

                        cart[index].quantity -= 1;

                    }


                    saveCart(cart);

                    renderCartPage();

                }
            );

        });


    document
        .querySelectorAll(".quantity-plus")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const index =
                        Number(
                            button.getAttribute(
                                "data-index"
                            )
                        );

                    let cart = getCart();


                    if (cart[index]) {

                        cart[index].quantity += 1;

                    }


                    saveCart(cart);

                    renderCartPage();

                }
            );

        });


    document
        .querySelectorAll(".delete-cart-item")
        .forEach(function (button) {

            button.addEventListener(
                "click",
                function () {

                    const index =
                        Number(
                            button.getAttribute(
                                "data-index"
                            )
                        );

                    let cart = getCart();


                    cart.splice(index, 1);


                    saveCart(cart);

                    renderCartPage();

                }
            );

        });

}


/* =========================================================
   CART TOTALS
========================================================= */

function calculateTotals(cart) {

    let subtotal = 0;


    cart.forEach(function (item) {

        subtotal +=
            Number(item.price || 0) *
            Number(item.quantity || 0);

    });


    const delivery =
        cart.length > 0 ? 50 : 0;


    const discount = 0;


    const gst =
        Math.round(subtotal * 0.05);


    const total =
        subtotal +
        delivery -
        discount +
        gst;


    return {

        subtotal: subtotal,
        delivery: delivery,
        discount: discount,
        gst: gst,
        total: total

    };

}


/* =========================================================
   CART PAGE TOTALS
========================================================= */

function updateCartTotals() {

    const cart = getCart();

    const totals =
        calculateTotals(cart);


    const subtotal =
        document.getElementById("subtotal");

    const deliveryFee =
        document.getElementById("deliveryFee");

    const discount =
        document.getElementById("discount");

    const gst =
        document.getElementById("gst");

    const total =
        document.getElementById("total");


    if (subtotal) {

        subtotal.textContent =
            "₹" + totals.subtotal;

    }


    if (deliveryFee) {

        deliveryFee.textContent =
            "₹" + totals.delivery;

    }


    if (discount) {

        discount.textContent =
            "-₹" + totals.discount;

    }


    if (gst) {

        gst.textContent =
            "₹" + totals.gst;

    }


    if (total) {

        total.textContent =
            "₹" + totals.total;

    }

}


/* =========================================================
   CHECKOUT PAGE
========================================================= */

function renderCheckoutPage() {

    const container =
        document.getElementById(
            "checkout-items"
        );


    if (!container) {

        return;

    }


    const cart = getCart();


    if (cart.length === 0) {

        container.innerHTML = `

            <div class="text-center py-3">

                <p>
                    Your cart is empty.
                </p>

                <a
                    href="menu.html"
                    class="btn btn-warning"
                >
                    Go to Menu
                </a>

            </div>

        `;

        updateCheckoutTotals([]);

        return;

    }


    container.innerHTML = "";


    cart.forEach(function (item) {

        const image =
            item.image || "images/default-food.png";


        const quantity =
            Number(item.quantity) || 1;


        const price =
            Number(item.price) || 0;


        const div =
            document.createElement("div");


        div.className =
            "d-flex justify-content-between align-items-center mb-3";


        div.innerHTML = `

            <div class="d-flex align-items-center">

                <img
                    src="${image}"
                    alt="${item.name}"
                    style="
                        width:55px;
                        height:55px;
                        object-fit:cover;
                        border-radius:8px;
                        margin-right:10px;
                    "
                    onerror="
                        this.src='images/default-food.png';
                    "
                >

                <div>

                    <strong>
                        ${item.name}
                    </strong>

                    <br>

                    <small>
                        ₹${price} × ${quantity}
                    </small>

                </div>

            </div>


            <strong>
                ₹${price * quantity}
            </strong>

        `;


        container.appendChild(div);

    });


    updateCheckoutTotals(cart);

}


/* =========================================================
   CHECKOUT TOTALS
========================================================= */

function updateCheckoutTotals(cart) {

    const totals =
        calculateTotals(cart);


    const subtotal =
        document.getElementById(
            "checkout-subtotal"
        );

    const delivery =
        document.getElementById(
            "checkout-delivery"
        );

    const discount =
        document.getElementById(
            "checkout-discount"
        );

    const gst =
        document.getElementById(
            "checkout-gst"
        );

    const total =
        document.getElementById(
            "checkout-total"
        );


    if (subtotal) {

        subtotal.textContent =
            "₹" + totals.subtotal;

    }


    if (delivery) {

        delivery.textContent =
            "₹" + totals.delivery;

    }


    if (discount) {

        discount.textContent =
            "-₹" + totals.discount;

    }


    if (gst) {

        gst.textContent =
            "₹" + totals.gst;

    }


    if (total) {

        total.textContent =
            "₹" + totals.total;

    }

}


/* =========================================================
   PAYMENT METHODS
========================================================= */

function setupPaymentMethods() {

    const cod =
        document.getElementById("cod");

    const upi =
        document.getElementById("upi");

    const card =
        document.getElementById("card");

    const upiDetails =
        document.getElementById(
            "upiDetails"
        );

    const cardDetails =
        document.getElementById(
            "cardDetails"
        );


    if (
        !cod ||
        !upi ||
        !card ||
        !upiDetails ||
        !cardDetails
    ) {

        return;

    }


    function updatePaymentDetails() {

        upiDetails.style.display =
            "none";

        cardDetails.style.display =
            "none";


        if (upi.checked) {

            upiDetails.style.display =
                "block";

        }


        if (card.checked) {

            cardDetails.style.display =
                "block";

        }

    }


    cod.addEventListener(
        "change",
        updatePaymentDetails
    );


    upi.addEventListener(
        "change",
        updatePaymentDetails
    );


    card.addEventListener(
        "change",
        updatePaymentDetails
    );


    updatePaymentDetails();

}


/* =========================================================
   PLACE ORDER
========================================================= */

function setupPlaceOrder() {

    const form =
        document.getElementById(
            "checkout-form"
        );


    if (!form) {

        return;

    }


    /* Prevent duplicate event listeners */

    if (
        form.dataset.orderHandler === "true"
    ) {

        return;

    }


    form.dataset.orderHandler =
        "true";


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            const cart = getCart();


            if (cart.length === 0) {

                alert(
                    "Your cart is empty!"
                );

                return;

            }


            /* Check required fields */

            if (!form.checkValidity()) {

                form.reportValidity();

                return;

            }


            const selectedPayment =
                document.querySelector(
                    'input[name="payment"]:checked'
                );


            const paymentMethod =
                selectedPayment
                    ? selectedPayment.value
                    : "Cash on Delivery";


            const totals =
                calculateTotals(cart);


            const order = {

                orderId:
                    "FH" +
                    Math.floor(
                        100000 +
                        Math.random() * 900000
                    ),

                date:
                    new Date().toLocaleString(),

                payment:
                    paymentMethod,

                cart:
                    cart,

                subtotal:
                    totals.subtotal,

                delivery:
                    totals.delivery,

                discount:
                    totals.discount,

                gst:
                    totals.gst,

                total:
                    totals.total

            };


            /* Save latest order */

            localStorage.setItem(
                "foodieOrder",
                JSON.stringify(order)
            );


            /* Get existing history */

            let history = [];


            try {

                history =
                    JSON.parse(
                        localStorage.getItem(
                            "foodieOrderHistory"
                        )
                    ) || [];

            } catch (error) {

                history = [];

            }


            /* Add new order */

            history.push(order);


            localStorage.setItem(
                "foodieOrderHistory",
                JSON.stringify(history)
            );


            /* CLEAR CART */

            localStorage.removeItem(
                "foodieCart"
            );


            /* Update cart count */

            updateCartCount();


            console.log(
                "Order successfully saved:",
                order
            );


            /* IMPORTANT:
               Go directly to confirmation */

            window.location.assign(
                "order-confirmation.html"
            );

        }
    );

}


/* =========================================================
   ORDER HISTORY
   SHOW ONLY THE LATEST ORDER
========================================================= */
console.log("RENDER ORDER HISTORY CALLED")
function renderOrderHistory() {

    const container =
        document.getElementById("order-history-container");

    if (!container) {
        return;
    }

    let history = [];

    try {
        history =
            JSON.parse(
                localStorage.getItem("foodieOrderHistory")
            ) || [];
    } catch (error) {
        console.error("Order history error:", error);
        history = [];
    }

    container.innerHTML = "";

    if (!Array.isArray(history) || history.length === 0) {

        container.innerHTML = `
            <div class="text-center py-5">

                <i
                    class="bi bi-receipt"
                    style="font-size:60px;">
                </i>

                <h3 class="mt-3">
                    No orders yet
                </h3>

                <p class="text-muted">
                    Your completed orders will appear here.
                </p>

                <a
                    href="menu.html"
                    class="btn btn-warning">
                    Browse Menu
                </a>

            </div>
        `;

        return;
    }


    /* Show ALL orders - newest first */

    const ordersToDisplay =
        history.slice().reverse();


    ordersToDisplay.forEach(function (order) {

        const cart =
            order.cart || [];

        let subtotal =
            Number(order.subtotal || 0);

        let delivery =
            Number(order.delivery || 50);

        let discount =
            Number(order.discount || 0);

        let gst =
            Number(order.gst || 0);

        let total =
            Number(order.total || 0);


        /* If old order doesn't have totals,
           calculate them */

        if (subtotal === 0 && cart.length > 0) {

            subtotal = cart.reduce(
                function (sum, item) {

                    return sum +
                        Number(item.price || 0) *
                        Number(item.quantity || 1);

                },
                0
            );

            delivery = 50;
            discount = 0;
            gst = Math.round(subtotal * 0.05);
            total =
                subtotal +
                delivery +
                gst -
                discount;
        }


        let itemsHTML = "";


        cart.forEach(function (item) {

            const image =
                item.image ||
                "images/default-food.png";

            const price =
                Number(item.price || 0);

            const quantity =
                Number(item.quantity || 1);

            const itemTotal =
                price * quantity;


            itemsHTML += `

                <div
                    class="d-flex align-items-center
                           justify-content-between mb-3">

                    <div class="d-flex align-items-center">

                        <img
                            src="${image}"
                            alt="${item.name}"
                            style="
                                width:60px;
                                height:60px;
                                object-fit:cover;
                                border-radius:8px;
                                margin-right:12px;
                            "
                            onerror="
                                this.style.display='none';
                            "
                        >

                        <div>

                            <strong>
                                ${item.name}
                            </strong>

                            <br>

                            <span class="text-muted">
                                ₹${price} × ${quantity}
                            </span>

                        </div>

                    </div>

                    <strong>
                        ₹${itemTotal}
                    </strong>

                </div>

            `;

        });


        /* Create ONE card for this order */

        const orderCard =
            document.createElement("div");

        orderCard.className =
            "card shadow p-4 mb-4";


        orderCard.innerHTML = `

            <div
                class="d-flex justify-content-between
                       align-items-center mb-3">

                <h3 class="fw-bold mb-0">

                    <i
                        class="bi bi-receipt text-warning">
                    </i>

                    Order #${order.orderId || "N/A"}

                </h3>

                <span class="badge bg-success">
                    Order Placed
                </span>

            </div>


            <p class="text-muted">
                ${order.date || ""}
            </p>


            <hr>


            <p>

                <strong>
                    Payment Method:
                </strong>

                ${order.payment || "Cash on Delivery"}

            </p>


            <h4 class="fw-bold mt-4 mb-3">

                <i
                    class="bi bi-bag-check text-warning">
                </i>

                Ordered Items

            </h4>


            ${itemsHTML}


            <hr>


            <div class="d-flex justify-content-between mb-2">

                <span>
                    Subtotal
                </span>

                <strong>
                    ₹${subtotal}
                </strong>

            </div>


            <div class="d-flex justify-content-between mb-2">

                <span>
                    Delivery Fee
                </span>

                <strong>
                    ₹${delivery}
                </strong>

            </div>


            <div class="d-flex justify-content-between mb-2">

                <span>
                    Discount
                </span>

                <strong>
                    -₹${discount}
                </strong>

            </div>


            <div class="d-flex justify-content-between mb-3">

                <span>
                    GST
                </span>

                <strong>
                    ₹${gst}
                </strong>

            </div>


            <hr>


            <div
                class="d-flex justify-content-between
                       align-items-center">

                <strong class="fs-5">
                    Total
                </strong>

                <strong class="fs-5">
                    ₹${total}
                </strong>

            </div>


            <div
                class="d-flex gap-3 mt-4 flex-wrap">

                <button
                    type="button"
                    class="btn btn-warning order-again-button"
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        gap:8px;
                        min-width:175px;
                        height:50px;
                    ">

                    <i class="bi bi-shop"></i>

                    <span>
                        Order Again
                    </span>

                </button>


                <a
                    href="index.html"
                    class="btn btn-outline-dark"
                    style="
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        gap:8px;
                        min-width:120px;
                        height:50px;
                        text-decoration:none;
                    ">

                    <i class="bi bi-house-fill"></i>

                    <span>
                        Home
                    </span>

                </a>

            </div>

        `;


        /* Add this order to the page */

        container.appendChild(orderCard);


        /* Order Again */

        const orderAgainButton =
            orderCard.querySelector(
                ".order-again-button"
            );


        orderAgainButton.addEventListener(
            "click",
            function () {

                localStorage.setItem(
                    "foodieCart",
                    JSON.stringify(cart)
                );

                window.location.href =
                    "cart.html";

            }
        );

    });

}