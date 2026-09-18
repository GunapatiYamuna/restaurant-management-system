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

// =======================================
// HOME NAVBAR LOGIN / PROFILE
// =======================================

document.addEventListener("DOMContentLoaded", function () {

    const sessionData = localStorage.getItem("foodiehub_session");

    const authButtons = document.getElementById("authButtons");
    const userSection = document.getElementById("userSection");
    const userName = document.getElementById("navbarUserName");
    const avatar = document.getElementById("navbarAvatar");

    // Nobody is logged in
    if (!sessionData) {

        if (authButtons) {
            authButtons.style.display = "flex";
        }

        if (userSection) {
            userSection.style.display = "none";
        }

        return;
    }

    // User/Admin is logged in
    let user;

    try {
        user = JSON.parse(sessionData);
    } catch (error) {
        console.error("Invalid session data");
        return;
    }

    if (authButtons) {
        authButtons.style.display = "none";
    }

    if (userSection) {
        userSection.style.display = "flex";
    }

    // Get first name
    const nameParts = user.name.trim().split(/\s+/);
    const firstName = nameParts[0];

    if (userName) {
        userName.textContent = firstName;
    }

    // Create initials
    let initials = firstName.charAt(0).toUpperCase();

    if (nameParts.length > 1) {
        initials += nameParts[nameParts.length - 1]
            .charAt(0)
            .toUpperCase();
    }

    if (avatar) {
        avatar.textContent = initials;
    }

    // Profile click
    if (userSection) {

        userSection.addEventListener("click", function () {

            if (user.role === "admin") {

                window.location.href = "ad_login/pages/profile.html";

            } else {

                window.location.href = "login/pages/profile.html";

            }

        });

    }

});