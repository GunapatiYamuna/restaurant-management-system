/* =========================================================
   FOODIEHUB NAVBAR LOGIN / USER DISPLAY
   Only controls the Login/Admin Login -> user avatar state.
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    const authButtons = document.getElementById("authButtons");
    const userSection = document.getElementById("userSection");
    const userName = document.getElementById("navbarUserName");
    const avatar = document.getElementById("navbarAvatar");

    if (!authButtons || !userSection) {
        return;
    }

    const sessionData = localStorage.getItem("foodiehub_session");

    if (!sessionData) {
        authButtons.style.display = "flex";
        userSection.style.display = "none";
        return;
    }

    let user;

    try {
        user = JSON.parse(sessionData);
    } catch (error) {
        authButtons.style.display = "flex";
        userSection.style.display = "none";
        return;
    }

    if (!user || !user.name) {
        authButtons.style.display = "flex";
        userSection.style.display = "none";
        return;
    }

    authButtons.style.display = "none";
    userSection.style.display = "flex";

    const nameParts = user.name.trim().split(/\s+/);
    const firstName = nameParts[0] || "User";

    if (userName) {
        userName.textContent = firstName;
    }

    let initials = firstName.charAt(0).toUpperCase();

    if (nameParts.length > 1) {
        initials += nameParts[nameParts.length - 1]
            .charAt(0)
            .toUpperCase();
    }

    if (avatar) {
        avatar.textContent = initials;
    }

    userSection.addEventListener("click", function () {
        if (user.role === "admin") {
            window.location.href = "ad_login/pages/profile.html";
        } else {
            window.location.href = "login/pages/profile.html";
        }
    });
});
