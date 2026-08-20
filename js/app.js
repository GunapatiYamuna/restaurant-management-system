/* =========================================================
   FOODIEHUB FRONTEND JAVASCRIPT
========================================================= */

document.addEventListener("DOMContentLoaded", function () {


    /* =====================================================
       SET MINIMUM DATE
    ===================================================== */

    const dateInput = document.getElementById("date");

    if (dateInput) {

        const today = new Date();

        const year = today.getFullYear();

        const month = String(
            today.getMonth() + 1
        ).padStart(2, "0");

        const day = String(
            today.getDate()
        ).padStart(2, "0");

        dateInput.min =
            `${year}-${month}-${day}`;

    }


    /* =====================================================
       RESTAURANT SEARCH AND FILTER
    ===================================================== */

    const restaurantSearch =
        document.getElementById("restaurantSearch");

    const heroSearch =
        document.getElementById("heroSearch");

    const heroSearchBtn =
        document.getElementById("heroSearchBtn");

    const cuisineFilter =
        document.getElementById("cuisineFilter");

    const priceFilter =
        document.getElementById("priceFilter");

    const ratingFilter =
        document.getElementById("ratingFilter");

    const restaurantGrid =
        document.getElementById("restaurantGrid");

    const restaurantCount =
        document.getElementById("restaurantCount");

    const noResults =
        document.getElementById("noResults");


    function filterRestaurants(searchValue = null) {

        if (!restaurantGrid) {
            return;
        }

        const items =
            document.querySelectorAll(".restaurant-item");

        let searchTerm = "";

        if (searchValue !== null) {

            searchTerm =
                searchValue
                    .trim()
                    .toLowerCase();

        } else if (restaurantSearch) {

            searchTerm =
                restaurantSearch.value
                    .trim()
                    .toLowerCase();

        }


        const cuisine =
            cuisineFilter
                ? cuisineFilter.value
                : "all";


        const price =
            priceFilter
                ? priceFilter.value
                : "all";


        const rating =
            ratingFilter
                ? ratingFilter.value
                : "all";


        let visibleCount = 0;


        items.forEach(function (item) {

            const name =
                item.dataset.name
                    .toLowerCase();

            const itemCuisine =
                item.dataset.cuisine;

            const itemPrice =
                item.dataset.price;

            const itemRating =
                parseFloat(item.dataset.rating);


            const matchesSearch =
                !searchTerm ||
                name.includes(searchTerm) ||
                itemCuisine
                    .toLowerCase()
                    .includes(searchTerm);


            const matchesCuisine =
                cuisine === "all" ||
                itemCuisine === cuisine;


            const matchesPrice =
                price === "all" ||
                itemPrice === price;


            const matchesRating =
                rating === "all" ||
                itemRating >= parseFloat(rating);


            const shouldShow =
                matchesSearch &&
                matchesCuisine &&
                matchesPrice &&
                matchesRating;


            if (shouldShow) {

                item.style.display = "";

                visibleCount++;

            } else {

                item.style.display = "none";

            }

        });


        if (restaurantCount) {

            restaurantCount.textContent =
                `${visibleCount} Restaurant${visibleCount !== 1 ? "s" : ""}`;

        }


        if (noResults) {

            noResults.style.display =
                visibleCount === 0
                    ? "block"
                    : "none";

        }

    }


    if (restaurantSearch) {

        restaurantSearch.addEventListener(
            "input",
            function () {

                filterRestaurants();

            }
        );

    }


    if (heroSearchBtn) {

        heroSearchBtn.addEventListener(
            "click",
            function () {

                if (!heroSearch) {
                    return;
                }

                const value =
                    heroSearch.value.trim();

                if (restaurantSearch) {

                    restaurantSearch.value =
                        value;

                }

                filterRestaurants(value);

                const restaurantsSection =
                    document.getElementById(
                        "restaurants"
                    );

                if (restaurantsSection) {

                    restaurantsSection.scrollIntoView({
                        behavior: "smooth"
                    });

                }

            }
        );

    }


    if (heroSearch) {

        heroSearch.addEventListener(
            "keydown",
            function (event) {

                if (event.key === "Enter") {

                    event.preventDefault();

                    if (heroSearchBtn) {
                        heroSearchBtn.click();
                    }

                }

            }
        );

    }


    if (cuisineFilter) {

        cuisineFilter.addEventListener(
            "change",
            function () {

                filterRestaurants();

            }
        );

    }


    if (priceFilter) {

        priceFilter.addEventListener(
            "change",
            function () {

                filterRestaurants();

            }
        );

    }


    if (ratingFilter) {

        ratingFilter.addEventListener(
            "change",
            function () {

                filterRestaurants();

            }
        );

    }


    /* =====================================================
       FAVORITE BUTTONS
    ===================================================== */

    const favoriteButtons =
        document.querySelectorAll(".favorite-btn");


    favoriteButtons.forEach(function (button) {

        button.addEventListener(
            "click",
            function () {

                button.classList.toggle("active");

                const icon =
                    button.querySelector("i");

                if (!icon) {
                    return;
                }


                if (
                    button.classList.contains(
                        "active"
                    )
                ) {

                    icon.classList.remove(
                        "bi-heart"
                    );

                    icon.classList.add(
                        "bi-heart-fill"
                    );

                } else {

                    icon.classList.remove(
                        "bi-heart-fill"
                    );

                    icon.classList.add(
                        "bi-heart"
                    );

                }

            }
        );

    });


    /* =====================================================
       RESERVATION FORM
    ===================================================== */

    const reservationForm =
        document.getElementById(
            "reservationForm"
        );


    if (reservationForm) {


        const fullName =
            document.getElementById(
                "fullName"
            );

        const email =
            document.getElementById(
                "email"
            );

        const phone =
            document.getElementById(
                "phone"
            );

        const guests =
            document.getElementById(
                "guests"
            );

        const date =
            document.getElementById(
                "date"
            );

        const time =
            document.getElementById(
                "time"
            );

        const message =
            document.getElementById(
                "message"
            );

        const agreement =
            document.getElementById(
                "agreement"
            );


        /* =================================================
           LIVE SUMMARY
        ================================================= */

        function updateSummary() {

            const summaryDate =
                document.getElementById(
                    "summaryDate"
                );

            const summaryTime =
                document.getElementById(
                    "summaryTime"
                );

            const summaryGuests =
                document.getElementById(
                    "summaryGuests"
                );


            if (summaryDate) {

                if (date.value) {

                    const selectedDate =
                        new Date(
                            date.value + "T00:00:00"
                        );

                    summaryDate.textContent =
                        selectedDate.toLocaleDateString(
                            "en-US",
                            {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                            }
                        );

                } else {

                    summaryDate.textContent =
                        "Select date";

                }

            }


            if (summaryTime) {

                summaryTime.textContent =
                    time.value ||
                    "Select time";

            }


            if (summaryGuests) {

                if (guests.value) {

                    const guestCount =
                        guests.value;

                    summaryGuests.textContent =
                        `${guestCount} Guest${guestCount !== "1" ? "s" : ""}`;

                } else {

                    summaryGuests.textContent =
                        "Select guests";

                }

            }

        }


        if (date) {
            date.addEventListener(
                "change",
                updateSummary
            );
        }

        if (time) {
            time.addEventListener(
                "change",
                updateSummary
            );
        }

        if (guests) {
            guests.addEventListener(
                "change",
                updateSummary
            );
        }


        /* =================================================
           FORM VALIDATION
        ================================================= */

        reservationForm.addEventListener(
            "submit",
            function (event) {

                event.preventDefault();


                let valid = true;


                /* NAME */

                const nameError =
                    document.getElementById(
                        "nameError"
                    );

                if (
                    !fullName.value.trim() ||
                    fullName.value.trim().length < 2
                ) {

                    nameError.textContent =
                        "Please enter your full name.";

                    valid = false;

                } else {

                    nameError.textContent =
                        "";

                }


                /* EMAIL */

                const emailError =
                    document.getElementById(
                        "emailError"
                    );

                const emailPattern =
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


                if (
                    !email.value.trim() ||
                    !emailPattern.test(
                        email.value.trim()
                    )
                ) {

                    emailError.textContent =
                        "Please enter a valid email.";

                    valid = false;

                } else {

                    emailError.textContent =
                        "";

                }


                /* PHONE */

                const phoneError =
                    document.getElementById(
                        "phoneError"
                    );


                const phonePattern =
                    /^[0-9+\-\s()]{7,20}$/;


                if (
                    !phone.value.trim() ||
                    !phonePattern.test(
                        phone.value.trim()
                    )
                ) {

                    phoneError.textContent =
                        "Please enter a valid phone number.";

                    valid = false;

                } else {

                    phoneError.textContent =
                        "";

                }


                /* GUESTS */

                const guestsError =
                    document.getElementById(
                        "guestsError"
                    );


                if (!guests.value) {

                    guestsError.textContent =
                        "Please select number of guests.";

                    valid = false;

                } else {

                    guestsError.textContent =
                        "";

                }


                /* DATE */

                const dateError =
                    document.getElementById(
                        "dateError"
                    );


                if (!date.value) {

                    dateError.textContent =
                        "Please select a reservation date.";

                    valid = false;

                } else {

                    dateError.textContent =
                        "";

                }


                /* TIME */

                const timeError =
                    document.getElementById(
                        "timeError"
                    );


                if (!time.value) {

                    timeError.textContent =
                        "Please select a reservation time.";

                    valid = false;

                } else {

                    timeError.textContent =
                        "";

                }


                /* AGREEMENT */

                const agreementError =
                    document.getElementById(
                        "agreementError"
                    );


                if (!agreement.checked) {

                    agreementError.textContent =
                        "Please accept the reservation policy.";

                    valid = false;

                } else {

                    agreementError.textContent =
                        "";

                }


                if (!valid) {

                    return;

                }


                /* =========================================
                   SAVE BOOKING IN LOCAL STORAGE
                ========================================= */

                const bookingData = {

                    name:
                        fullName.value.trim(),

                    email:
                        email.value.trim(),

                    phone:
                        phone.value.trim(),

                    guests:
                        guests.value,

                    date:
                        date.value,

                    time:
                        time.value,

                    message:
                        message
                            ? message.value.trim()
                            : "",

                    restaurant:
                        "Spice Symphony"

                };


                localStorage.setItem(
                    "foodieHubBooking",
                    JSON.stringify(
                        bookingData
                    )
                );


                /* =========================================
                   REDIRECT
                ========================================= */

                window.location.href =
                    "confirmation.html";

            }
        );

    }


    /* =====================================================
       CONFIRMATION PAGE
    ===================================================== */

    const bookingReference =
        document.getElementById(
            "bookingReference"
        );


    if (bookingReference) {

        const savedBooking =
            localStorage.getItem(
                "foodieHubBooking"
            );


        if (savedBooking) {

            const booking =
                JSON.parse(
                    savedBooking
                );


            const confirmedDate =
                document.getElementById(
                    "confirmedDate"
                );

            const confirmedTime =
                document.getElementById(
                    "confirmedTime"
                );

            const confirmedGuests =
                document.getElementById(
                    "confirmedGuests"
                );

            const confirmedName =
                document.getElementById(
                    "confirmedName"
                );


            if (confirmedName) {

                confirmedName.textContent =
                    booking.name ||
                    "Guest";

            }


            if (confirmedDate) {

                if (booking.date) {

                    const selectedDate =
                        new Date(
                            booking.date +
                            "T00:00:00"
                        );

                    confirmedDate.textContent =
                        selectedDate.toLocaleDateString(
                            "en-US",
                            {
                                month: "short",
                                day: "numeric",
                                year: "numeric"
                            }
                        );

                }

            }


            if (confirmedTime) {

                confirmedTime.textContent =
                    booking.time ||
                    "Not selected";

            }


            if (confirmedGuests) {

                confirmedGuests.textContent =
                    `${booking.guests || 0} Guest${booking.guests !== "1" ? "s" : ""}`;

            }

        }

    }


    /* =====================================================
       PRINT CONFIRMATION
    ===================================================== */

    const printButton =
        document.getElementById(
            "printBooking"
        );


    if (printButton) {

        printButton.addEventListener(
            "click",
            function () {

                window.print();

            }
        );

    }


    /* =====================================================
       INITIAL FILTER
    ===================================================== */

    if (restaurantGrid) {

        filterRestaurants();

    }

});
