(function () {
  async function loadSharedNavbar() {
    const placeholder = document.getElementById("shared-navbar");
    if (!placeholder || placeholder.dataset.loaded === "true") return;

    try {
      const cssHref = "/css/navbar_shared.css";
      if (!document.querySelector('link[data-shared-navbar-css]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = cssHref;
        link.dataset.sharedNavbarCss = "true";
        document.head.appendChild(link);
      }

      const response = await fetch("/navbar.html", {
        credentials: "same-origin",
        cache: "no-store"
      });

      if (!response.ok) throw new Error("Unable to load shared navbar.");

      placeholder.innerHTML = await response.text();
      placeholder.dataset.loaded = "true";

      if (window.initializeFoodieNavbarAuth) {
        window.initializeFoodieNavbarAuth();
      } else {
        const script = document.createElement("script");
        script.src = "/js/navbar_auth.js?v=20261002-navbar";
        script.onload = function () {
          if (window.initializeFoodieNavbarAuth) {
            window.initializeFoodieNavbarAuth();
          }
        };
        document.body.appendChild(script);
      }
    } catch (error) {
      console.error("Shared navbar load failed:", error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSharedNavbar);
  } else {
    loadSharedNavbar();
  }
})();