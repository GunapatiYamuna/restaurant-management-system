document.addEventListener("DOMContentLoaded", function () {

    console.log("FoodieHub JS loaded");

    updateCartCount();

    setupAddToCart();

    renderCart();

    setupCheckout();

    setupPaymentMethods();

    renderCheckout();

    renderOrderConfirmation();

    renderOrderHistory();

});


// ======================================================
// GET CART
// ======================================================

function getCart() {

    return JSON.parse(
        localStorage.getItem("foodieCart")
    ) || [];

}


// ======================================================
// SAVE CART
// ======================================================

function saveCart(cart) {

    localStorage.setItem(
        "foodieCart",
        JSON.stringify(cart)
    );

}


// ======================================================
// ADD TO CART
// ======================================================

function setupAddToCart() {

    const buttons =
        document.querySelectorAll(
            ".add-cart, .add-to-cart"
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
                    "Missing data-name or data-price",
                    button
                );

                return;

            }


            let cart = getCart();


            const existing =
                cart.find(function (item) {

                    return item.name === name;

                });


            if (existing) {

                existing.quantity += 1;

            } else {

                cart.push({

                    name: name,

                    price: price,

                    image: image,

                    quantity: 1

                });

            }


            saveCart(cart);

            updateCartCount();


            // Button feedback

            const oldHTML =
                button.innerHTML;

            button.innerHTML =
                "✓ Added";

            button.disabled = true;


            setTimeout(function () {

                button.innerHTML =
                    oldHTML;

                button.disabled =
                    false;

            }, 1000);

        });

    });

}


// ======================================================
// CART COUNT
// ======================================================

function updateCartCount() {

    const cart = getCart();

    const totalItems =
        cart.reduce(
            function (total, item) {

                return total +
                    Number(item.quantity || 0);

            },
            0
        );


    const cartIcons =
        document.querySelectorAll(
            ".nav-cart"
        );


    cartIcons.forEach(function (cartIcon) {

        let badge =
            cartIcon.querySelector(
                ".cart-count"
            );


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


// ======================================================
// RENDER CART
// ======================================================

function renderCart() {

    const container =
        document.getElementById(
            "cart-items"
        );


    if (!container) {

        return;

    }


    const cart = getCart();


    if (cart.length === 0) {

        container.innerHTML = `

            <div class="text-center p-5">

                <i
                    class="bi bi-cart-x"
                    style="font-size:50px;">
                </i>

                <h4 class="mt-3">
                    Your cart is empty
                </h4>

                <p class="text-muted">
                    Add some delicious food to your cart.
                </p>

                <a
                    href="menu.html"
                    class="btn btn-warning">

                    Browse Menu

                </a>

            </div>

        `;

        updateBill(0);

        return;

    }


    container.innerHTML =
        cart.map(function (item, index) {

            return `

                <div class="card shadow-sm mb-3 p-3">

                    <div class="row align-items-center">

                        <!-- IMAGE -->

                        <div class="col-md-2 text-center">

                            ${
                                item.image

                                ?

                                `
                                <img
                                    src="${item.image}"
                                    alt="${item.name}"
                                    style="
                                        width:100px;
                                        height:80px;
                                        object-fit:cover;
                                        border-radius:10px;
                                    "
                                    onerror="
                                        this.style.display='none';
                                    ">
                                `

                                :

                                `
                                <i
                                    class="bi bi-egg-fried"
                                    style="font-size:40px;">
                                </i>
                                `
                            }

                        </div>


                        <!-- NAME -->

                        <div class="col-md-4">

                            <h5 class="fw-bold mb-1">
                                ${item.name}
                            </h5>

                            <p class="mb-0 text-muted">
                                ₹${Number(item.price).toFixed(0)}
                            </p>

                        </div>


                        <!-- QUANTITY -->

                        <div class="col-md-3">

                            <div
                                class="
                                    d-flex
                                    align-items-center
                                    justify-content-center
                                    gap-2
                                ">

                                <button
                                    type="button"
                                    class="
                                        btn
                                        btn-outline-dark
                                        quantity-btn
                                    "
                                    onclick="
                                        changeQuantity(
                                            ${index},
                                            -1
                                        )
                                    ">

                                    −

                                </button>


                                <strong>
                                    ${item.quantity}
                                </strong>


                                <button
                                    type="button"
                                    class="
                                        btn
                                        btn-outline-dark
                                        quantity-btn
                                    "
                                    onclick="
                                        changeQuantity(
                                            ${index},
                                            1
                                        )
                                    ">

                                    +

                                </button>

                            </div>

                        </div>


                        <!-- ITEM TOTAL -->

                        <div class="col-md-2 text-center">

                            <strong class="text-warning">

                                ₹${(
                                    Number(item.price) *
                                    Number(item.quantity)
                                ).toFixed(0)}

                            </strong>

                        </div>


                        <!-- DELETE -->

                        <div class="col-md-1 text-center">

                            <button
                                type="button"
                                class="btn btn-danger"
                                onclick="
                                    removeItem(${index})
                                ">

                                <i class="bi bi-trash"></i>

                            </button>

                        </div>

                    </div>

                </div>

            `;

        }).join("");


    const subtotal =
        cart.reduce(
            function (total, item) {

                return total +
                    Number(item.price) *
                    Number(item.quantity);

            },
            0
        );


    updateBill(subtotal);

}


// ======================================================
// CHANGE QUANTITY
// ======================================================

function changeQuantity(index, amount) {

    let cart = getCart();


    if (!cart[index]) {

        return;

    }


    cart[index].quantity += amount;


    if (cart[index].quantity <= 0) {

        cart.splice(index, 1);

    }


    saveCart(cart);

    renderCart();

    updateCartCount();

}


// ======================================================
// REMOVE ITEM
// ======================================================

function removeItem(index) {

    let cart = getCart();


    if (!cart[index]) {

        return;

    }


    cart.splice(index, 1);


    saveCart(cart);

    renderCart();

    updateCartCount();

}


// ======================================================
// UPDATE CART BILL
// ======================================================

function updateBill(subtotal) {

    const subtotalElement =
        document.getElementById("subtotal");

    const deliveryElement =
        document.getElementById("deliveryFee");

    const discountElement =
        document.getElementById("discount");

    const gstElement =
        document.getElementById("gst");

    const totalElement =
        document.getElementById("total");


    const delivery =
        subtotal > 0 ? 50 : 0;

    const discount = 0;

    const gst =
        Math.round(subtotal * 0.05);

    const total =
        subtotal +
        delivery +
        gst -
        discount;


    if (subtotalElement) {

        subtotalElement.textContent =
            "₹" + subtotal.toFixed(0);

    }


    if (deliveryElement) {

        deliveryElement.textContent =
            "₹" + delivery;

    }


    if (discountElement) {

        discountElement.textContent =
            "-₹" + discount;

    }


    if (gstElement) {

        gstElement.textContent =
            "₹" + gst;

    }


    if (totalElement) {

        totalElement.textContent =
            "₹" + total;

    }

}


// ======================================================
// PAYMENT METHOD
// ======================================================

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


// ======================================================
// CHECKOUT SUMMARY
// ======================================================

function renderCheckout() {

    const itemsContainer =
        document.getElementById(
            "checkout-items"
        );


    if (!itemsContainer) {

        return;

    }


    const cart = getCart();


    if (cart.length === 0) {

        itemsContainer.innerHTML = `

            <p class="text-muted text-center">
                Your cart is empty.
            </p>

        `;

        updateCheckoutBill(0);

        return;

    }


    itemsContainer.innerHTML =
        cart.map(function (item) {

            return `

                <div
                    class="
                        d-flex
                        justify-content-between
                        align-items-center
                        mb-3
                    ">

                    <div
                        class="
                            d-flex
                            align-items-center
                        ">

                        ${
                            item.image

                            ?

                            `
                            <img
                                src="${item.image}"
                                alt="${item.name}"
                                style="
                                    width:55px;
                                    height:55px;
                                    object-fit:cover;
                                    border-radius:8px;
                                    margin-right:10px;
                                "
                                onerror="
                                    this.style.display='none';
                                ">
                            `

                            :

                            ""
                        }


                        <div>

                            <strong>
                                ${item.name}
                            </strong>

                            <div class="text-muted">
                                ₹${item.price}
                                ×
                                ${item.quantity}
                            </div>

                        </div>

                    </div>


                    <strong>

                        ₹${(
                            Number(item.price) *
                            Number(item.quantity)
                        ).toFixed(0)}

                    </strong>

                </div>

            `;

        }).join("");


    const subtotal =
        cart.reduce(
            function (total, item) {

                return total +
                    Number(item.price) *
                    Number(item.quantity);

            },
            0
        );


    updateCheckoutBill(subtotal);

}


// ======================================================
// CHECKOUT BILL
// ======================================================

function updateCheckoutBill(subtotal) {

    const delivery =
        subtotal > 0 ? 50 : 0;

    const discount = 0;

    const gst =
        Math.round(subtotal * 0.05);

    const total =
        subtotal +
        delivery +
        gst -
        discount;


    const subtotalElement =
        document.getElementById(
            "checkout-subtotal"
        );

    const deliveryElement =
        document.getElementById(
            "checkout-delivery"
        );

    const discountElement =
        document.getElementById(
            "checkout-discount"
        );

    const gstElement =
        document.getElementById(
            "checkout-gst"
        );

    const totalElement =
        document.getElementById(
            "checkout-total"
        );


    if (subtotalElement) {

        subtotalElement.textContent =
            "₹" + subtotal;

    }


    if (deliveryElement) {

        deliveryElement.textContent =
            "₹" + delivery;

    }


    if (discountElement) {

        discountElement.textContent =
            "-₹" + discount;

    }


    if (gstElement) {

        gstElement.textContent =
            "₹" + gst;

    }


    if (totalElement) {

        totalElement.textContent =
            "₹" + total;

    }

}


// ======================================================
// PLACE ORDER
// ======================================================

function setupCheckout() {

    const form =
        document.getElementById(
            "checkout-form"
        );


    if (!form) {

        return;

    }


    form.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();


            console.log(
                "PLACE ORDER CLICKED"
            );


            const cart = getCart();


            if (cart.length === 0) {

                alert(
                    "Your cart is empty!"
                );

                return;

            }


            // Delivery details

            const name =
                document
                    .getElementById("full-name")
                    .value
                    .trim();

            const phone =
                document
                    .getElementById("phone")
                    .value
                    .trim();

            const address =
                document
                    .getElementById("address")
                    .value
                    .trim();

            const city =
                document
                    .getElementById("city")
                    .value
                    .trim();

            const pincode =
                document
                    .getElementById("pincode")
                    .value
                    .trim();


            if (
                name === "" ||
                phone === "" ||
                address === "" ||
                city === "" ||
                pincode === ""
            ) {

                alert(
                    "Please fill all delivery details."
                );

                return;

            }


            // Payment

            const selectedPayment =
                document.querySelector(
                    'input[name="payment"]:checked'
                );


            const payment =
                selectedPayment
                    ? selectedPayment.value
                    : "Cash on Delivery";


            // Calculate bill

            const subtotal =
                cart.reduce(
                    function (total, item) {

                        return total +
                            Number(item.price) *
                            Number(item.quantity);

                    },
                    0
                );


            const deliveryFee =
                subtotal > 0 ? 50 : 0;

            const discount = 0;

            const gst =
                Math.round(subtotal * 0.05);

            const total =
                subtotal +
                deliveryFee +
                gst -
                discount;


            // Create order

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
                    payment,

                customer: {

                    name:
                        name,

                    phone:
                        phone,

                    address:
                        address,

                    city:
                        city,

                    pincode:
                        pincode

                },

                cart:
                    cart,

                subtotal:
                    subtotal,

                deliveryFee:
                    deliveryFee,

                discount:
                    discount,

                gst:
                    gst,

                total:
                    total

            };


            console.log(
                "ORDER CREATED:",
                order
            );


            // Save latest order

            localStorage.setItem(
                "foodieOrder",
                JSON.stringify(order)
            );


            // Get existing history

            let history =
                JSON.parse(
                    localStorage.getItem(
                        "foodieOrderHistory"
                    )
                ) || [];


            // Add new order

            history.push(order);


            // Save history

            localStorage.setItem(
                "foodieOrderHistory",
                JSON.stringify(history)
            );


            // CLEAR CART

            localStorage.removeItem(
                "foodieCart"
            );


            console.log(
                "CART CLEARED"
            );


            // Go to confirmation

            window.location.href =
                "order-confirmation.html";

        }
    );

}


// ======================================================
// ORDER CONFIRMATION
// ======================================================

function renderOrderConfirmation() {

    const itemsContainer =
        document.getElementById(
            "confirmation-items"
        );


    if (!itemsContainer) {

        return;

    }


    const order =
        JSON.parse(
            localStorage.getItem(
                "foodieOrder"
            )
        );


    if (!order) {

        itemsContainer.innerHTML = `

            <p class="text-danger">
                No order information found.
            </p>

            <a
                href="menu.html"
                class="btn btn-warning">

                Go to Menu

            </a>

        `;

        return;

    }


    // Order information

    const orderIdElement =
        document.getElementById(
            "confirmation-order-id"
        );

    const dateElement =
        document.getElementById(
            "confirmation-date"
        );

    const paymentElement =
        document.getElementById(
            "confirmation-payment"
        );


    if (orderIdElement) {

        orderIdElement.textContent =
            order.orderId;

    }


    if (dateElement) {

        dateElement.textContent =
            order.date;

    }


    if (paymentElement) {

        paymentElement.textContent =
            order.payment;

    }


    // Items

    const cart =
        order.cart || [];


    itemsContainer.innerHTML =
        cart.map(function (item) {

            return `

                <div
                    class="
                        d-flex
                        justify-content-between
                        align-items-center
                        mb-3
                    ">

                    <div
                        class="
                            d-flex
                            align-items-center
                        ">

                        ${
                            item.image

                            ?

                            `
                            <img
                                src="${item.image}"
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
                                ">
                            `

                            :

                            ""
                        }


                        <div>

                            <strong>
                                ${item.name}
                            </strong>

                            <div class="text-muted">

                                ₹${item.price}
                                ×
                                ${item.quantity}

                            </div>

                        </div>

                    </div>


                    <strong>

                        ₹${(
                            Number(item.price) *
                            Number(item.quantity)
                        ).toFixed(0)}

                    </strong>

                </div>

            `;

        }).join("");


    // BILL

    const subtotal =
        Number(order.subtotal || 0);

    const delivery =
        Number(order.deliveryFee || 0);

    const discount =
        Number(order.discount || 0);

    const gst =
        Number(order.gst || 0);

    const total =
        Number(order.total || 0);


    const subtotalElement =
        document.getElementById(
            "confirmation-subtotal"
        );

    const deliveryElement =
        document.getElementById(
            "confirmation-delivery"
        );

    const discountElement =
        document.getElementById(
            "confirmation-discount"
        );

    const gstElement =
        document.getElementById(
            "confirmation-gst"
        );

    const totalElement =
        document.getElementById(
            "confirmation-total"
        );


    if (subtotalElement) {

        subtotalElement.textContent =
            "₹" + subtotal;

    }


    if (deliveryElement) {

        deliveryElement.textContent =
            "₹" + delivery;

    }


    if (discountElement) {

        discountElement.textContent =
            "-₹" + discount;

    }


    if (gstElement) {

        gstElement.textContent =
            "₹" + gst;

    }


    if (totalElement) {

        totalElement.textContent =
            "₹" + total;

    }

}


// ======================================================
// ORDER HISTORY
// ======================================================

function renderOrderHistory() {

    const container =
        document.getElementById(
            "order-history-container"
        );


    if (!container) {

        return;

    }


    const history =
        JSON.parse(
            localStorage.getItem(
                "foodieOrderHistory"
            )
        ) || [];


    if (history.length === 0) {

        container.innerHTML = `

            <div class="text-center p-5">

                <i
                    class="bi bi-receipt"
                    style="font-size:50px;">
                </i>

                <h4 class="mt-3">
                    No orders yet
                </h4>

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


    container.innerHTML =
        history
            .slice()
            .reverse()
            .map(function (order) {

                const cart =
                    order.cart || [];


                const total =
                    Number(
                        order.total || 0
                    );


                return `

                    <div
                        class="
                            card
                            shadow-sm
                            p-4
                            mb-4
                        ">

                        <div
                            class="
                                d-flex
                                justify-content-between
                                align-items-center
                            ">

                            <div>

                                <h4 class="fw-bold">

                                    Order #${order.orderId}

                                </h4>


                                <p class="text-muted mb-1">

                                    ${order.date}

                                </p>


                                <p class="mb-0">

                                    <strong>
                                        Payment:
                                    </strong>

                                    ${order.payment}

                                </p>

                            </div>


                            <span
                                class="badge bg-success">

                                Confirmed

                            </span>

                        </div>


                        <hr>


                        ${

                            cart.map(function (item) {

                                return `

                                    <div
                                        class="
                                            d-flex
                                            justify-content-between
                                            align-items-center
                                            mb-3
                                        ">

                                        <div>

                                            <strong>
                                                ${item.name}
                                            </strong>

                                            <div
                                                class="text-muted">

                                                ₹${item.price}
                                                ×
                                                ${item.quantity}

                                            </div>

                                        </div>


                                        <strong>

                                            ₹${(
                                                Number(item.price) *
                                                Number(item.quantity)
                                            ).toFixed(0)}

                                        </strong>

                                    </div>

                                `;

                            }).join("")

                        }


                        <hr>


                        <div
                            class="
                                d-flex
                                justify-content-between
                            ">

                            <strong>
                                Total
                            </strong>

                            <strong
                                class="text-warning">

                                ₹${total}

                            </strong>

                        </div>

                    </div>

                `;

            })
            .join("");

}