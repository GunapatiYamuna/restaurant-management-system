window.initializeFoodieNavbarAuth = async function () {
  const authButtons = document.getElementById("authButtons");
  const userSection = document.getElementById("userSection");
  const userName = document.getElementById("navbarUserName");
  const userRole = document.getElementById("navbarUserRole");
  const avatar = document.getElementById("navbarAvatar");

  if (!authButtons || !userSection) return;

  const roleLabels = {
    user: "Customer",
    restaurant: "Restaurant Partner",
    admin: "Administrator",
    delivery: "Delivery Partner"
  };

  const profileUrls = {
    user: "/login/pages/profile.html",
    restaurant: "/restaurant_portal/profile.html",
    admin: "/ad_login/pages/profile.html",
    delivery: "/delivery_portal/profile.html"
  };

  try {
    const response = await fetch("/api/me/", {
      credentials: "same-origin",
      cache: "no-store"
    });
    const data = await response.json();

    if (!response.ok || !data.authenticated || !data.user) {
      localStorage.removeItem("foodiehub_session");
      authButtons.style.display = "flex";
      userSection.style.display = "none";
      return;
    }

    const user = data.user;
    localStorage.setItem("foodiehub_session", JSON.stringify(user));

    authButtons.style.display = "none";
    userSection.style.display = "flex";

    const parts = (user.name || "User").trim().split(/\s+/);
    const first = parts[0] || "User";
    const initials = (first[0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();

    if (userName) userName.textContent = first;
    if (userRole) userRole.textContent = roleLabels[user.role] || "FoodieHub";
    if (avatar) avatar.textContent = initials;

    userSection.href = profileUrls[user.role] || "/login/pages/profile.html";
  } catch (error) {
    console.error("Navbar authentication check failed", error);
    const cached = localStorage.getItem("foodiehub_session");

    if (!cached) {
      authButtons.style.display = "flex";
      userSection.style.display = "none";
    }
  }
};

document.addEventListener("DOMContentLoaded", function () {
  window.initializeFoodieNavbarAuth();
});
