document.addEventListener("DOMContentLoaded", function () {

    const searchInput = document.getElementById("searchInput");

    if (searchInput) {

        searchInput.addEventListener("input", function () {
            filterRestaurants();
        });

    }


    const cuisineFilters =
        document.querySelectorAll(".cuisine-filter");

    cuisineFilters.forEach(function (filter) {

        filter.addEventListener("change", function () {
            filterRestaurants();
        });

    });


    const ratingFilters =
        document.querySelectorAll('input[name="rating"]');

    ratingFilters.forEach(function (filter) {

        filter.addEventListener("change", function () {
            filterRestaurants();
        });

    });

});


/* ================= SEARCH ================= */

function searchRestaurants() {

    filterRestaurants();

}


/* ================= FILTER ================= */

function filterRestaurants() {

    const searchInput =
        document.getElementById("searchInput");

    const searchTerm =
        searchInput
            ? searchInput.value.toLowerCase().trim()
            : "";


    const selectedCuisine =
        Array.from(
            document.querySelectorAll(".cuisine-filter:checked")
        ).map(function (checkbox) {
            return checkbox.value;
        });


    const selectedRating =
        document.querySelector(
            'input[name="rating"]:checked'
        );


    const minimumRating =
        selectedRating
            ? parseFloat(selectedRating.value)
            : 0;


    const cards =
        document.querySelectorAll(".restaurant-card");


    let visibleCount = 0;


    cards.forEach(function (card) {

        const name =
            card.dataset.name.toLowerCase();

        const cuisine =
            card.dataset.cuisine.toLowerCase();

        const rating =
            parseFloat(card.dataset.rating);


        const matchesSearch =
            name.includes(searchTerm) ||
            cuisine.includes(searchTerm);


        const matchesCuisine =
            selectedCuisine.length === 0 ||
            selectedCuisine.includes(card.dataset.cuisine);


        const matchesRating =
            rating >= minimumRating;


        if (
            matchesSearch &&
            matchesCuisine &&
            matchesRating
        ) {

            card.style.display = "";

            visibleCount++;

        } else {

            card.style.display = "none";

        }

    });


    const count =
        document.getElementById("restaurantCount");

    if (count) {

        count.textContent =
            visibleCount + " Restaurants";

    }


    const noResults =
        document.getElementById("noResults");

    if (noResults) {

        noResults.style.display =
            visibleCount === 0
                ? "block"
                : "none";

    }

}


/* ================= CLEAR FILTERS ================= */

function clearFilters() {

    const searchInput =
        document.getElementById("searchInput");

    if (searchInput) {
        searchInput.value = "";
    }


    document
        .querySelectorAll(".cuisine-filter")
        .forEach(function (checkbox) {

            checkbox.checked = false;

        });


    document
        .querySelectorAll('input[name="rating"]')
        .forEach(function (radio) {

            radio.checked = false;

        });


    filterRestaurants();

}


/* ================= SORT ================= */

function sortRestaurants() {

    const select =
        document.getElementById("sortSelect");

    const grid =
        document.getElementById("restaurantGrid");


    if (!select || !grid) {
        return;
    }


    const cards =
        Array.from(
            grid.querySelectorAll(".restaurant-card")
        );


    if (select.value === "rating") {

        cards.sort(function (a, b) {

            return (
                parseFloat(b.dataset.rating) -
                parseFloat(a.dataset.rating)
            );

        });

    }


    if (select.value === "name") {

        cards.sort(function (a, b) {

            return a.dataset.name.localeCompare(
                b.dataset.name
            );

        });

    }


    cards.forEach(function (card) {

        grid.appendChild(card);

    });

}


/* ================= RESERVATION VALIDATION ================= */

function validateReservationForm() {

    const phone =
        document.getElementById("phone");


    if (phone) {

        const phoneValue =
            phone.value.trim();


        if (!/^[0-9]{10}$/.test(phoneValue)) {

            alert(
                "Please enter a valid 10-digit phone number."
            );

            phone.focus();

            return false;

        }

    }


    const date =
        document.getElementById("date");


    if (date) {

        const today =
            new Date().toISOString().split("T")[0];


        if (date.value < today) {

            alert(
                "Please select today or a future date."
            );

            date.focus();

            return false;

        }

    }


    return true;

}