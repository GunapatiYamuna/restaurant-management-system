document.addEventListener("DOMContentLoaded", async function () {
  const body = document.body;
  const loginUrl = body?.dataset?.loginUrl || "/login/pages/login.html";

  function show(targetId, message, type) {
    const box = document.getElementById(targetId);
    if (!box) return;
    box.innerHTML = '<div class="profile-alert profile-alert-' + type + '">' + message + '</div>';
  }

  function fill(user) {
    const fields = {
      profileName: user.name || "",
      profileEmail: user.email || "",
      profilePhone: user.phone || "",
      profileCity: user.city || "",
      editName: user.name || "",
      editEmail: user.email || "",
      editPhone: user.phone || "",
      editCity: user.city || ""
    };

    Object.keys(fields).forEach(function (id) {
      const element = document.getElementById(id);
      if (!element) return;
      if ("value" in element) element.value = fields[id];
      else element.textContent = fields[id];
    });

    const role = document.getElementById("profileRole");
    if (role) role.textContent = user.role || "Account";
  }

  async function api(url, options) {
    const response = await fetch(url, Object.assign({
      credentials: "same-origin",
      cache: "no-store",
      headers: { "Content-Type": "application/json" }
    }, options || {}));

    const data = await response.json().catch(function () { return {}; });

    if (response.status === 401) {
      window.location.href = loginUrl;
      return null;
    }

    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Request failed.");
    }

    return data;
  }

  try {
    const data = await api("/api/me/");
    if (!data || !data.authenticated) {
      window.location.href = loginUrl;
      return;
    }

    fill(data.user);

    document.getElementById("profileForm")?.addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        const data = await api("/api/profile/update/", {
          method: "POST",
          body: JSON.stringify({
            name: document.getElementById("editName")?.value.trim(),
            email: document.getElementById("editEmail")?.value.trim(),
            phone: document.getElementById("editPhone")?.value.trim(),
            city: document.getElementById("editCity")?.value.trim()
          })
        });

        if (data) {
          localStorage.setItem("foodiehub_session", JSON.stringify(data.user));
          fill(data.user);
          show("profileAlert", data.message, "success");
        }
      } catch (error) {
        show("profileAlert", error.message, "danger");
      }
    });

    document.getElementById("passwordForm")?.addEventListener("submit", async function (event) {
      event.preventDefault();
      try {
        const data = await api("/api/profile/change-password/", {
          method: "POST",
          body: JSON.stringify({
            current_password: document.getElementById("currentPassword")?.value,
            new_password: document.getElementById("newPassword")?.value,
            confirm_password: document.getElementById("confirmPassword")?.value
          })
        });

        if (data) {
          this.reset();
          show("passwordAlert", data.message, "success");
        }
      } catch (error) {
        show("passwordAlert", error.message, "danger");
      }
    });
  } catch (error) {
    show("profileAlert", error.message, "danger");
  }
});
