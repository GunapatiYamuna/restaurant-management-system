console.log("SCRIPT.JS IS WORKING");

//ADD TO CART
document.addEventListener("DOMContentLoaded",function(){
    const addToCartButtons=document.querySelectorAll(".add-to-cart");
    addToCartButtons.forEach(function(button){
        button.addEventListener("click",function(){
            const name=button.dataset.name;
            const price=Number(button.dataset.price);
            const image=button.dataset.image;
            let cart=JSON.parse(localStorage.getItem("cart"))||[];

            //check whether item already exists
            const existingItem=cart.find(item=>item.name===name);
            if(existingItem){
                existingItem.quantity+=1;
            } else{
                cart.push({
                    name:name,
                    price:price,
                    image:image,
                    quantity:1
                });
            }
            //save cart
            localStorage.setItem("cart",JSON.stringify(cart));
            alert(name+" added to cart!");
        });
    });
});
//display cart
const cartContainer=document.getElementById("cart-items");
if(cartContainer){
    let cart=JSON.parse(localStorage.getItem("cart"))||[];
    if(cart.length===0){
        cartContainer.innerHTML=`
        <div class="text-center py-5">
        <h3>Your cart is empty 🛒</h3>
        <p>Add some delicious food from your menu.</p>
        <a href="menu.html" class="btn btn-warning">
        Browse Menu
        </a>
        </div>
        `;
    }else{
        cartContainer.innerHTML="";
        cart.forEach(function(item,index){
            const itemTotal=item.price * item.quantity;
            cartContainer.innerHTML+=`
            <div class="card mb-3 shadow">
            <div class="row g-0 align-items-center">
            <div class="col-md-4">
            <img src="${item.image}"
            class="img-fluid rounded-start"
            alt="${item.name}">
            </div>
            <div class="col-md-8">
            <div class="card-body">
            <h4 class="card-title">
            ${item.name}
            </h4>
            <p>
            Price:
            <strong>&#8377;${item.price}
            </strong>
            </p>
            <p>
            Total:
            <strong>&#8377;${itemTotal}
            </strong>
            </p>
            <!--Quantity-->
            <div class="quantity-box">
            <button class="btn btn-outline-dark"
            onclick="decreaseQuantity(${index})">
            -
            </button>
            <input type="text"
            value="${item.quantity}"
            readonly>
            <button class="btn btn-outline-dark"
            onclick="increaseQuantity(${index})">
            +
            </button>
            </div>
            <!--Remove-->
            <button class="btn btn-danger mt-3"
            onclick="removeItem(${index})">
            <i class="bi bi-trash"></i>
            Remove
            </button>
            </div>
        </div>
        </div>
    </div>
    `;   
        });
    }
    updateCartSummary();
    }

//increase quantity
function increaseQuantity(index){
    let cart=JSON.parse(localStorage.getItem("cart"))||[];
    cart[index].quantity+=1;
        localStorage.setItem("cart", JSON.stringify(cart));
        location.reload();
}
//decrease quantity
function decreaseQuantity(index){
    let cart=JSON.parse(localStorage.getItem("cart"))||[];
    if(cart[index].quantity>1){
        cart[index].quantity-=1;
    }else{
        cart.splice(index,1);
    }
    localStorage.setItem("cart",JSON.stringify(cart));
    location.reload();
}
//remove item
function removeItem(index){
    let cart=JSON.parse(localStorage.getItem("cart"))||[];
    cart.splice(index,1);
    localStorage.setItem("cart",JSON.stringify(cart));
    location.reload();
}
//update cart summary
function updateCartSummary(){
    let cart=JSON.parse(localStorage.getItem("cart"))||[];
    let subtotal=0;
    //calculate subtotal
    cart.forEach(function(item){
        subtotal+=item.price * item.quantity;
    });
    //delivery fee
    let deliveryFee = subtotal > 0 ? 50 : 0;

    //discount
    let discount = subtotal >= 500 ? 50 : 0;

    //gst - 5%
    let gst = Math.round((subtotal - discount) * 0.05);

    //final total
    let total = subtotal + deliveryFee - discount + gst;

    //display subtotal
    const subtotalElement = document.getElementById("subtotal");

    if (subtotalElement) {
        subtotalElement.textContent = "₹" + subtotal;
    }

    //display delivery fee
    const deliveryElement = document.getElementById("deliveryFee");

    if (deliveryElement) {
        deliveryElement.textContent = "₹" + deliveryFee;
    }

    //display discount
    const discountElement = document.getElementById("discount");

    if (discountElement) {
        discountElement.textContent = "-₹" + discount;
    }

    //display GST
    const gstElement = document.getElementById("gst");

    if (gstElement) {
        gstElement.textContent = "₹" + gst;
    }

    //display total
    const totalElement = document.getElementById("total");

    if (totalElement) {
        totalElement.textContent = "₹" + total;
    }

    //console check
    console.log("Subtotal:", subtotal);
    console.log("Delivery:", deliveryFee);
    console.log("Discount:", discount);
    console.log("GST:", gst);
    console.log("Total:", total);

}
//checkout page
document.addEventListener("DOMContentLoaded", function () {

    const checkoutItems = document.getElementById("checkout-items");

    //run only on checkout page
    if (!checkoutItems) {
        return;
    }
    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    //if cart is empty
    if (cart.length === 0) {
        checkoutItems.innerHTML = `
            <div class="text-center py-3">
                <p>Your cart is empty 🛒</p>
                <a href="menu.html" class="btn btn-warning">
                    Browse Menu
                </a>
            </div>
        `;

        return;
    }
//display cart items
checkoutItems.innerHTML = "";
    cart.forEach(function (item) {
        const itemTotal = item.price * item.quantity;
        checkoutItems.innerHTML += `
            <div class="d-flex justify-content-between mb-3">
                <span>
                    ${item.name} × ${item.quantity}
                </span>
                <strong>
                    ₹${itemTotal}
                </strong>
            </div>
        `;
    });
//calculate bill
let subtotal = 0;
    cart.forEach(function (item) {
        subtotal += Number(item.price) * Number(item.quantity);
    });

    let deliveryFee = subtotal > 0 ? 50 : 0;

    let discount = subtotal >= 500 ? 50 : 0;

    let gst = Math.round((subtotal - discount) * 0.05);

    let total = subtotal + deliveryFee - discount + gst;

//display bill
document.getElementById("checkout-subtotal").textContent =
        "₹" + subtotal;

    document.getElementById("checkout-delivery").textContent =
        "₹" + deliveryFee;

    document.getElementById("checkout-discount").textContent =
        "-₹" + discount;

    document.getElementById("checkout-gst").textContent =
        "₹" + gst;

    document.getElementById("checkout-total").textContent =
        "₹" + total;

    console.log("Checkout Subtotal:", subtotal);
    console.log("Checkout Total:", total);

//place order
const checkoutForm =
        document.getElementById("checkout-form");

    checkoutForm.addEventListener("submit", function (event) {

        event.preventDefault();

        //get customer details
        const name =
            document.getElementById("full-name").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const address =
            document.getElementById("address").value.trim();

        const city =
            document.getElementById("city").value.trim();

        const pincode =
            document.getElementById("pincode").value.trim();

        //get selected payment
        const payment =
            document.querySelector(
                'input[name="payment"]:checked'
            );
        let paymentMethod="";
        if(payment){
            if(payment.id==="cod"){
                paymentMethod="Cash on Delivery";
            }
            else if(payment.id==="upi"){
                paymentMethod="UPI Payment";
            }
            else if(payment.id==="card"){
                paymentMethod="Credit/Debit Card";
            }
        }

        //validate
        if (!name || !phone || !address || !city || !pincode) {

            alert("Please fill all delivery details.");

            return;
        }

        if (!payment) {

            alert("Please select a payment method.");

            return;
        }

        //create order
        const order = {
            orderId:
                "FD" +
                Date.now(),

            date:
                new Date().toLocaleDateString(),

            customer: {
                name: name,
                phone: phone,
                address: address,
                city: city,
                pincode: pincode
            },

            paymentMethod:
                paymentMethod,

            items:
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
        //save order
        localStorage.setItem(
            "currentOrder",
            JSON.stringify(order)
        );

        //save to order history
        let orderHistory =
            JSON.parse(
                localStorage.getItem("orderHistory")
            ) || [];

        orderHistory.push(order);

        localStorage.setItem(
            "orderHistory",
            JSON.stringify(orderHistory)
        );

        //clear cart
        localStorage.removeItem("cart");

        //go to confirmation page
        window.location.href =
            "order-confirmation.html";
    });

});

//order confirmation
document.addEventListener("DOMContentLoaded", function () {

    const orderIdElement =
        document.getElementById("confirmation-order-id");

    //run only on confirmation page
    if (!orderIdElement) {
        return;
    }

    //get current order
    const order =
        JSON.parse(localStorage.getItem("currentOrder"));

    //check whether order exists
    if (!order) {
        orderIdElement.textContent = "No order found";
        return;
    }

    //Order details
    document.getElementById("confirmation-order-id")
        .textContent = "#" + order.orderId;

    document.getElementById("confirmation-date")
        .textContent = order.date;

    document.getElementById("confirmation-payment")
        .textContent = order.paymentMethod;

//order items
const itemsContainer =
        document.getElementById("confirmation-items");
if (itemsContainer) {
    itemsContainer.innerHTML = "";
    order.items.forEach(function (item) {
        const itemTotal =
        Number(item.price) * 
        Number(item.quantity);

        itemsContainer.innerHTML += `
            <div class="d-flex justify-content-between mb-3">
                <span>
                    ${item.name} × ${item.quantity}
                </span>
                <strong>
                    ₹${itemTotal}
                </strong>
            </div>
        `;
    });
}
//bill details

const subtotal = Number(order.subtotal) || 0;
const deliveryFee = Number(order.deliveryFee) || 0;
const discount = Number(order.discount) || 0;
const gst = Number(order.gst) || 0;

// Recalculate total
const total =
    subtotal +
    deliveryFee -
    discount +
    gst;

//Display subtotal
document.getElementById("confirmation-subtotal")
    .textContent = "₹" + subtotal;


//Display delivery
document.getElementById("confirmation-delivery")
    .textContent = "₹" + deliveryFee;


//Display discount
document.getElementById("confirmation-discount")
    .textContent = "-₹" + discount;


//Display GST
document.getElementById("confirmation-gst")
    .textContent = "₹" + gst;


//Display final total
document.getElementById("confirmation-total")
    .textContent = "₹" + total;


//Update saved order also
order.total = total;

localStorage.setItem(
    "currentOrder",
    JSON.stringify(order)
);

console.log("Confirmation Subtotal:", subtotal);
console.log("Confirmation Delivery:", deliveryFee);
console.log("Confirmation Discount:", discount);
console.log("Confirmation GST:", gst);
console.log("Confirmation Total:", total);

});
//order history
document.addEventListener("DOMContentLoaded", function () {

    const orderHistoryContainer =
        document.getElementById("order-history-container");

    //run only on order history page
    if (!orderHistoryContainer) {
        return;
    }

    //get saved orders
    let orderHistory =
        JSON.parse(
            localStorage.getItem("orderHistory")
        ) || [];
//no orders
if (orderHistory.length === 0) {

        orderHistoryContainer.innerHTML = `
            <div class="card shadow p-5 text-center">
                <h3>No Orders Yet 🛒</h3>
                <p class="text-muted">
                    You haven't placed any orders yet.
                </p>
                <a href="menu.html"
                   class="btn btn-warning">
                    Browse Menu
                </a>
            </div>
        `;
        return;
    }

    //clear container
    orderHistoryContainer.innerHTML = "";
//display orders
    orderHistory
        .slice()
        .reverse()
        .forEach(function (order) {

            // Number of items
            let itemCount = 0;

            order.items.forEach(function (item) {

                itemCount += item.quantity;

            });


            // Create order card
            orderHistoryContainer.innerHTML += `
                <div class="card shadow mb-4">
                    <div class="card-body">
                        <div class="row align-items-center g-3">
                            <!-- Order ID -->
                            <div class="col-md-3">
                                <h5 class="fw-bold">
                                    Order ID
                                </h5>
                                <p>
                                    #${order.orderId}
                                </p>
                            </div>

                            <!-- Date -->
                            <div class="col-md-2">
                                <h5 class="fw-bold">
                                    Date
                                </h5>
                                <p>
                                    ${order.date}
                                </p>
                            </div>

                            <!-- Items -->
                            <div class="col-md-2">
                                <h5 class="fw-bold">
                                    Items
                                </h5>
                                <p>
                                    ${itemCount} Item${itemCount > 1 ? "s" : ""}
                                </p>
                            </div>

                            <!-- Amount -->
                            <div class="col-md-2">
                                <h5 class="fw-bold">
                                    Amount
                                </h5>
                                <p class="fw-bold">
                                     ₹${
                                        Number(order.subtotal) +
                                        Number(order.deliveryFee) -
                                        Number(order.discount) +
                                        Number(order.gst)
                                    }
                                </p>
                            </div>

                            <!-- Status + View -->
                            <div class="col-md-3 text-md-end">
                                <span class="badge bg-success mb-2">
                                    Order Placed
                                </span>
                                <br>
                                <button
                                    class="btn btn-outline-dark view-order-btn"
                                    onclick="viewOrder('${order.orderId}')">
                                    <i class="bi bi-eye"></i>
                                    View Order
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
});
//view orders
function viewOrder(orderId) {

    let orderHistory =
        JSON.parse(
            localStorage.getItem("orderHistory")
        ) || [];

    const selectedOrder =
        orderHistory.find(function (order) {
            return order.orderId === orderId;
        });

    if (!selectedOrder) {
        alert("Order not found.");
        return;
    }

    //save selected order
    localStorage.setItem(
        "currentOrder",
        JSON.stringify(selectedOrder)
    );

    //open confirmation page
    window.location.href =
        "order-confirmation.html";
}
//payment method
document.addEventListener("DOMContentLoaded", function () {

    const cod = document.getElementById("cod");
    const upi = document.getElementById("upi");
    const card = document.getElementById("card");

    const upiDetails = document.getElementById("upiDetails");
    const cardDetails = document.getElementById("cardDetails");

    if (cod && upi && card) {

        function showPaymentDetails() {

            //hide both
            upiDetails.style.display = "none";
            cardDetails.style.display = "none";

            //show UPI
            if (upi.checked) {
                upiDetails.style.display = "block";
            }

            //show Card
            if (card.checked) {
                cardDetails.style.display = "block";
            }
        }
        cod.addEventListener("change", showPaymentDetails);
        upi.addEventListener("change", showPaymentDetails);
        card.addEventListener("change", showPaymentDetails);
    }
});
//card number formatting
document.addEventListener("DOMContentLoaded", function () {

    const cardNumber = document.getElementById("cardNumber");

    if (cardNumber) {

        cardNumber.addEventListener("input", function () {

            let value = cardNumber.value.replace(/\D/g, "");

            value = value.substring(0, 16);

            let formatted = value.match(/.{1,4}/g);

            cardNumber.value = formatted
                ? formatted.join(" ")
                : "";
        });
    }
});