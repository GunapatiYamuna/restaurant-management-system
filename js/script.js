/* =========================================================
   FOODIEHUB COMMON JAVASCRIPT
   ========================================================= */


/* =========================================================
   NEWSLETTER
   ========================================================= */

function subscribeNewsletter() {

    const emailInput =
        document.getElementById("newsletterEmail");

    if (!emailInput) {
        return;
    }

    const email = emailInput.value.trim();

    if (email === "") {

        alert("Please enter your email address.");

        return;
    }


    const emailPattern =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailPattern.test(email)) {

        alert("Please enter a valid email address.");

        return;
    }


    alert(
        "Thank you for subscribing to FoodieHub!"
    );

    emailInput.value = "";
}


/* =========================================================
   CONTACT FORM
   ========================================================= */

const contactForm =
    document.getElementById("contactForm");


if (contactForm) {

    contactForm.addEventListener(
        "submit",
        function(event) {

            event.preventDefault();


            const name =
                document.getElementById("name").value.trim();

            const email =
                document.getElementById("email").value.trim();

            const subject =
                document.getElementById("subject").value.trim();

            const message =
                document.getElementById("message").value.trim();


            const messageBox =
                document.getElementById("contactMessage");


            if (
                name === "" ||
                email === "" ||
                subject === "" ||
                message === ""
            ) {

                messageBox.innerHTML = `
                    <div class="alert alert-danger">
                        Please fill in all required fields.
                    </div>
                `;

                return;
            }


            messageBox.innerHTML = `
                <div class="alert alert-success">
                    Your message has been sent successfully!
                </div>
            `;


            contactForm.reset();

        }
    );

}
