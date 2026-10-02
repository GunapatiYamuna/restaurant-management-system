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

const contactForm = document.getElementById("contactForm");

if (contactForm) {
    contactForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const messageBox = document.getElementById("contactMessage");
        const submitButton = contactForm.querySelector('button[type="submit"]');

        const payload = {
            name: document.getElementById("name")?.value.trim() || "",
            email: document.getElementById("email")?.value.trim() || "",
            phone: document.getElementById("phone")?.value.trim() || "",
            subject: document.getElementById("subject")?.value.trim() || "",
            message: document.getElementById("message")?.value.trim() || ""
        };

        if (!payload.name || !payload.email || !payload.subject || !payload.message) {
            if (messageBox) {
                messageBox.innerHTML = '<div class="alert alert-danger">Please fill in all required fields.</div>';
            }
            return;
        }

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "Sending...";
        }

        try {
            const response = await fetch("/api/contact/", {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Unable to send your message.");
            }

            if (messageBox) {
                messageBox.innerHTML = '<div class="alert alert-success">' +
                    (data.message || "Your message has been sent successfully.") +
                    '</div>';
            }

            contactForm.reset();
        } catch (error) {
            console.error("Contact form error:", error);
            if (messageBox) {
                messageBox.innerHTML = '<div class="alert alert-danger">' +
                    error.message +
                    '</div>';
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Send Message";
            }
        }
    });
}
