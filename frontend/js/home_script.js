// =======================================
// CART
// =======================================

let cart = JSON.parse(localStorage.getItem("restaurantCart")) || [];

const cartCount = document.getElementById("cart-count");


// Update cart count


function updateCartCount() {
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
}


// Add food to cart

const addButtons = document.querySelectorAll(".add-cart");

addButtons.forEach(button => {

    button.addEventListener("click", function () {

        const foodName = this.dataset.name;
        const foodPrice = this.dataset.price;

        const food = {
            name: foodName,
            price: Number(foodPrice)
        };

        cart.push(food);

        localStorage.setItem(
            "restaurantCart",
            JSON.stringify(cart)
        );

        updateCartCount();

        // Change button temporarily

        const originalText = this.innerHTML;

        this.innerHTML =
            '<i class="fa-solid fa-check"></i> Added';

        this.style.background = "#ff6b00";

        setTimeout(() => {

            this.innerHTML = originalText;

            this.style.background = "";

        }, 1200);

    });

});


// Initial cart count

updateCartCount();





// =======================================
// ORDER NOW BUTTON
// =======================================

const orderButton =
    document.querySelector(".primary-btn");

orderButton.addEventListener("click", function () {

    document
        .getElementById("restaurants")
        .scrollIntoView({
            behavior: "smooth"
        });

});

// =======================================
// VIEW MENU BUTTONS
// =======================================

const menuButtons =
    document.querySelectorAll(".menu-btn");

menuButtons.forEach(button => {

    button.addEventListener("click", function () {

        document
            .getElementById("restaurants")
            .scrollIntoView({
                behavior: "smooth"
            });

    });

});
