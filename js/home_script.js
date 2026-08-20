// =======================================
// CART
// =======================================

let cart = JSON.parse(localStorage.getItem("restaurantCart")) || [];

const cartCount = document.getElementById("cartCount");


// Update cart count

function updateCartCount() {

    cartCount.textContent = cart.length;

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
// SEARCH FOOD
// =======================================

const searchInput =
    document.getElementById("searchInput");

const foodCards =
    document.querySelectorAll(".food-card");

searchInput.addEventListener("input", function () {

    const searchValue =
        this.value.toLowerCase().trim();

    foodCards.forEach(card => {

        const foodName =
            card.querySelector("h3")
                .textContent
                .toLowerCase();

        if (foodName.includes(searchValue)) {

            card.style.display = "block";

        } else {

            card.style.display = "none";

        }

    });

});


// =======================================
// ORDER NOW BUTTON
// =======================================

const orderButton =
    document.querySelector(".primary-btn");

orderButton.addEventListener("click", function () {

    document
        .getElementById("popular")
        .scrollIntoView({
            behavior: "smooth"
        });

});


// =======================================
// BOOK TABLE BUTTON
// =======================================

const bookButton =
    document.querySelector(".secondary-btn");

bookButton.addEventListener("click", function () {

    alert(
        "Table booking feature will be available soon!"
    );

});


// =======================================
// EXPLORE BUTTONS
// =======================================

const exploreButtons =
    document.querySelectorAll(".explore-btn");

exploreButtons.forEach(button => {

    button.addEventListener("click", function () {

        document
            .getElementById("popular")
            .scrollIntoView({
                behavior: "smooth"
            });

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
            .getElementById("popular")
            .scrollIntoView({
                behavior: "smooth"
            });

    });

});