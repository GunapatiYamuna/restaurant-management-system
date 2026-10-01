(function () {
  const root = document.getElementById("googleButton");
  if (!root) return;
  const role = document.body.dataset.googleRole || "user";
  const alertBox = document.getElementById("loginAlert") || document.getElementById("alert");

  function showError(message) {
    if (alertBox) alertBox.innerHTML = '<div class="alert alert-danger">' + String(message).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])) + '</div>';
    else alert(message);
  }

  async function load() {
    try {
      const configResponse = await fetch("/api/auth/config/", {cache:"no-store"});
      const config = await configResponse.json();
      if (!config.client_id) {
        root.innerHTML = '<div class="text-muted small">Google Sign-In is not configured yet.</div>';
        return;
      }
      await new Promise((resolve, reject) => {
        if (window.google && window.google.accounts) return resolve();
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });

      window.google.accounts.id.initialize({
        client_id: config.client_id,
        callback: async response => {
          try {
            const result = await fetch("/api/auth/google/", {
              method: "POST",
              headers: {"Content-Type":"application/json"},
              credentials: "same-origin",
              body: JSON.stringify({credential: response.credential, role})
            });
            const data = await result.json();
            if (!result.ok || !data.success) throw new Error(data.message || "Google sign-in failed.");
            localStorage.setItem("foodiehub_session", JSON.stringify(data.user));
            if (data.restaurant) localStorage.setItem("foodiehub_restaurant_session", JSON.stringify(data.restaurant));
            const redirects = {
              user: "/user_portal/dashboard.html",
              admin: "/ad_login/pages/dashboard.html",
              restaurant: "/restaurant_portal/dashboard.html",
              delivery: "/delivery_portal/dashboard.html"
            };
            window.location.href = redirects[data.user.role] || "/";
          } catch (error) {
            showError(error.message);
          }
        }
      });
      window.google.accounts.id.renderButton(root, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "continue_with",
        shape: "rectangular"
      });
    } catch (error) {
      console.error("Google Sign-In setup failed", error);
      root.innerHTML = '<div class="text-muted small">Google Sign-In is unavailable.</div>';
    }
  }
  load();
})();