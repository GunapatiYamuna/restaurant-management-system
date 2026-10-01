document.addEventListener("DOMContentLoaded", async function () {
    const authButtons = document.getElementById("authButtons");
    const userSection = document.getElementById("userSection");
    const userName = document.getElementById("navbarUserName");
    const avatar = document.getElementById("navbarAvatar");
    if (!authButtons || !userSection) return;
    try {
        const response = await fetch("/api/me/", {credentials:"same-origin", cache:"no-store"});
        const data = await response.json();
        if (!response.ok || !data.authenticated || !data.user) {
            localStorage.removeItem("foodiehub_session");
            authButtons.style.display="flex"; userSection.style.display="none"; return;
        }
        const user=data.user;
        localStorage.setItem("foodiehub_session", JSON.stringify(user));
        authButtons.style.display="none"; userSection.style.display="flex";
        const parts=(user.name||"User").trim().split(/\s+/), first=parts[0]||"User";
        if(userName) userName.textContent=first;
        if(avatar) avatar.textContent=(first[0]+(parts[1]?parts[parts.length-1][0]:"")).toUpperCase();
        userSection.onclick=function(){
            if(user.role==="admin") location.href="ad_login/pages/profile.html";
            else if(user.role==="restaurant") location.href="restaurant_portal/dashboard.html";
            else location.href="login/pages/profile.html";
        };
    } catch(e) {
        console.error("Navbar authentication check failed",e);
        const cached=localStorage.getItem("foodiehub_session");
        if(!cached){authButtons.style.display="flex";userSection.style.display="none";}
    }
});
