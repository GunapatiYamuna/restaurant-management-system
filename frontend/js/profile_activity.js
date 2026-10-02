document.addEventListener("DOMContentLoaded", async function () {
  const view = document.body.dataset.activityView;
  const list = document.getElementById("activityList");
  const title = document.getElementById("activityTitle");
  const subtitle = document.getElementById("activitySubtitle");

  if (!list || !view) return;

  const loginUrl = "/login/pages/login.html";

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleString([], {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
  }

  function formatReservationDate(dateValue, timeValue) {
    if (!dateValue) return "";
    const date = new Date(dateValue + "T" + (timeValue || "00:00"));
    return Number.isNaN(date.getTime())
      ? (dateValue + " " + (timeValue || ""))
      : date.toLocaleString([], {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
  }

  async function load() {
    const endpoint = view === "orders"
      ? "/api/orders/history/"
      : "/api/reservations/history/";

    try {
      const response = await fetch(endpoint, {
        credentials: "same-origin",
        cache: "no-store"
      });

      const data = await response.json().catch(() => ({}));

      if (response.status === 401) {
        window.location.href = loginUrl;
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load your details.");
      }

      if (view === "orders") {
        if (title) title.innerHTML = '<i class="bi bi-bag-check me-2"></i>My Orders';
        if (subtitle) subtitle.textContent = "All orders placed through your FoodieHub account.";

        const orders = Array.isArray(data.orders) ? data.orders : [];

        if (!orders.length) {
          list.innerHTML = '<div class="text-muted">You have not placed any orders yet.</div>';
          return;
        }

        list.innerHTML = orders.map(order => {
          const items = Array.isArray(order.items) ? order.items : [];
          const itemText = items.length
            ? items.map(item => esc(item.name) + " × " + Number(item.quantity || 1)).join(", ")
            : "No item details";

          return `
            <article class="activity-item">
              <div class="activity-head">
                <div>
                  <strong>Order #${esc(order.id)}</strong>
                  <div class="activity-muted">${esc(formatDate(order.created_at))}</div>
                </div>
                <span class="activity-status">${esc(order.status || "placed")}</span>
              </div>
              <div class="activity-items">${itemText}</div>
              <div class="activity-total">Total: ₹${Number(order.total || 0).toFixed(2)}</div>
              <div class="activity-meta">
                <span>Payment: ${esc(order.payment_method || "—")}</span>
                <span>Payment status: ${esc(order.payment_status || "—")}</span>
              </div>
            </article>
          `;
        }).join("");
      } else {
        if (title) title.innerHTML = '<i class="bi bi-calendar-check me-2"></i>My Reservations';
        if (subtitle) subtitle.textContent = "All table reservations made through your FoodieHub account.";

        const reservations = Array.isArray(data.reservations) ? data.reservations : [];

        if (!reservations.length) {
          list.innerHTML = '<div class="text-muted">You have not made any reservations yet.</div>';
          return;
        }

        list.innerHTML = reservations.map(reservation => {
          const items = Array.isArray(reservation.items) ? reservation.items : [];
          const prebooked = items.length
            ? '<div class="activity-detail"><strong>Pre-booked food:</strong> ' +
              items.map(item => esc(item.name) + " × " + Number(item.quantity || 1)).join(", ") +
              '</div>'
            : "";

          return `
            <article class="activity-item">
              <div class="activity-head">
                <div>
                  <strong>${esc(reservation.restaurant)}</strong>
                  <div class="activity-muted">Reservation #${esc(reservation.id)}</div>
                </div>
                <span class="activity-status">${esc(reservation.status || "pending")}</span>
              </div>
              <div class="activity-detail"><strong>Date & time:</strong> ${esc(formatReservationDate(reservation.date, reservation.time))}</div>
              <div class="activity-detail"><strong>Guests:</strong> ${esc(reservation.guests)}</div>
              ${prebooked}
              ${Number(reservation.prebook_total || 0) > 0
                ? '<div class="activity-total">Pre-booked food: ₹' + Number(reservation.prebook_total).toFixed(2) + '</div>'
                : ""}
              ${reservation.message
                ? '<div class="activity-muted">Note: ' + esc(reservation.message) + '</div>'
                : ""}
            </article>
          `;
        }).join("");
      }
    } catch (error) {
      console.error("Profile activity view error:", error);
      list.innerHTML = '<div class="alert alert-danger mb-0">' + esc(error.message) + '</div>';
    }
  }

  load();
});
