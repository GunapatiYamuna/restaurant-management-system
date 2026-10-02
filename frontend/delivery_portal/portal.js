const api = async (url, options = {}) => {
    const response = await fetch(url, {
        credentials: "same-origin",
        cache: "no-store",
        ...options
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
        throw new Error(data.message || "Request failed.");
    }

    return data;
};

function esc(value) {
    return String(value ?? "").replace(/[&<>'"]/g, function (char) {
        return {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        }[char];
    });
}

function money(value) {
    return "₹" + Number(value || 0).toLocaleString("en-IN");
}

let watchId = null;
let activeOrderId = null;
let refreshTimer = null;
let loading = false;
const customerMaps = new Map();

function statusLabel(status) {
    return String(status || "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
}

function renderActiveOrders(orders) {
    const active = document.getElementById("active");

    if (!active) return;

    if (!orders.length) {
        active.innerHTML = '<div class="card empty">No active delivery.</div>';
        return;
    }

    active.innerHTML = orders.map(function (order) {
        const isDelivered = order.status === "delivered";
        const assignmentStatus = order.assignment_status || "assigned";
        const isPickedUp =
            assignmentStatus === "picked_up" ||
            assignmentStatus === "out_for_delivery";

        const canUseGps =
            !isDelivered && order.status === "out_for_delivery";

        const gpsButton = canUseGps
            ? activeOrderId === order.id
                ? '<button type="button" class="btn" data-action="stop-gps" data-order-id="' + order.id + '">Stop GPS</button>'
                : '<button type="button" class="btn orange" data-action="start-gps" data-order-id="' + order.id + '">Start / Resume GPS</button>'
            : "";

        const pickupButton = !isDelivered
            ? isPickedUp
                ? '<button type="button" class="btn" disabled>Picked up ✓</button>'
                : '<button type="button" class="btn" data-action="picked-up" data-order-id="' + order.id + '">Picked up</button>'
            : "";

        const deliveredButton = isDelivered
            ? '<button type="button" class="btn" disabled>Delivered ✓</button>'
            : '<button type="button" class="btn" data-action="delivered" data-order-id="' + order.id + '">Delivered</button>';

        const phone = String(order.phone || "").trim();

        const customerDetails = isDelivered
            ? ""
            : `
                <p>
                    <b>Customer address:</b>
                    ${esc(order.address)}, ${esc(order.city)} - ${esc(order.pincode)}
                </p>

                ${order.delivery_lat != null && order.delivery_lng != null
                    ? '<div class="customer-location"><div class="customer-location-title">📍 Customer location</div><div class="delivery-map" id="customer-map-' + order.id + '"></div><div class="location-note">Exact delivery point selected by the customer.</div></div>'
                    : '<div class="location-note customer-location">📍 Customer map location was not saved for this order.</div>'}
            `;

        return `
            <article class="card delivery-order-card">
                <div class="cardhead">
                    <div>
                        <h2>Order #${order.id}</h2>
                        <div class="small">${esc(order.name)} · ${esc(phone)}</div>
                    </div>
                    <span class="badge orange">${esc(statusLabel(order.status))}</span>
                </div>

                ${customerDetails}

                <p>
                    ${order.items.map(function (item) {
                        return esc(item.name) + " × " + Number(item.quantity || 0);
                    }).join(" · ")}
                </p>

                <div class="top-actions">
                    ${!isDelivered && phone
                        ? '<a class="btn" href="tel:' + encodeURIComponent(phone) + '">Call customer</a>'
                        : ""}

                    ${gpsButton}
                    ${pickupButton}
                    ${deliveredButton}
                </div>

                <div class="small delivery-action-message" id="deliveryMessage-${order.id}"></div>
            </article>
        `;
    }).join("");

    renderCustomerMaps(orders);
}

function renderAvailableOrders(orders) {
    const available = document.getElementById("available");

    if (!available) return;

    if (!orders.length) {
        available.innerHTML = '<div class="card empty">No ready orders waiting.</div>';
        return;
    }

    available.innerHTML = orders.map(function (order) {
        const phone = String(order.phone || "").trim();

        return `
            <article class="card delivery-order-card">
                <div class="cardhead">
                    <div>
                        <h2>Order #${order.id}</h2>
                        <div class="small">${esc(order.name)} · ${esc(phone)}</div>
                    </div>
                    <span class="badge green">${esc(statusLabel(order.status || "ready"))}</span>
                </div>

                <p>
                    <b>Delivery address:</b>
                    ${esc(order.address)}, ${esc(order.city)} - ${esc(order.pincode)}
                </p>

                <p>
                    ${order.items.map(function (item) {
                        return esc(item.name) + " × " + Number(item.quantity || 0);
                    }).join(" · ")}
                </p>

                <div class="small">
                    <b>Total:</b> ${money(order.total)}
                </div>

                ${order.delivery_lat != null && order.delivery_lng != null
                    ? '<div class="customer-location"><div class="customer-location-title">📍 Customer location</div><div class="delivery-map" id="customer-map-' + order.id + '"></div><div class="location-note">Exact delivery point selected by the customer.</div></div>'
                    : '<div class="location-note customer-location">📍 Customer map location was not saved for this order.</div>'}

                <div class="top-actions">
                    <button type="button" class="btn orange" data-action="accept" data-order-id="${order.id}">
                        Accept order
                    </button>
                </div>

                <div class="small delivery-action-message" id="availableMessage-${order.id}"></div>
            </article>
        `;
    }).join("");

    renderCustomerMaps(orders);
}

function renderCustomerMaps(orders) {
    if (typeof L === "undefined") return;

    orders.forEach(function (order) {
        if (order.delivery_lat == null || order.delivery_lng == null) return;

        const element = document.getElementById("customer-map-" + order.id);
        if (!element) return;
        if (customerMaps.has(order.id)) {
            customerMaps.get(order.id).invalidateSize();
            return;
        }

        const lat = Number(order.delivery_lat);
        const lng = Number(order.delivery_lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const map = L.map(element, { zoomControl: true, scrollWheelZoom: false }).setView([lat, lng], 16);
        L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
            attribution: "&copy; OpenStreetMap contributors &copy; CARTO"
        }).addTo(map);
        L.marker([lat, lng]).addTo(map).bindPopup("Customer delivery location").openPopup();
        customerMaps.set(order.id, map);
        setTimeout(function () { map.invalidateSize(); }, 100);
    });
}

function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("en-IN");
}

function renderDeliveredOrders(orders) {
    const delivered = document.getElementById("delivered");

    if (!delivered) return;

    if (!orders.length) {
        delivered.innerHTML = '<div class="card empty">No delivered orders yet.</div>';
        return;
    }

    delivered.innerHTML = orders.map(function (order) {
        return `
            <article class="card delivery-order-card">
                <div class="cardhead">
                    <div>
                        <h2>Order #${order.id}</h2>
                        <div class="small">${esc(order.name)} · ${formatDate(order.delivered_at)}</div>
                    </div>
                    <span class="badge green">Delivered</span>
                </div>

                <p>
                    <b>Delivery address:</b>
                    ${esc(order.address)}, ${esc(order.city)} - ${esc(order.pincode)}
                </p>

                <p>
                    ${order.items.map(function (item) {
                        return esc(item.name) + " × " + Number(item.quantity || 0);
                    }).join(" · ")}
                </p>

                <div class="d-flex justify-content-between align-items-center">
                    <span class="small">Delivered at: ${formatDate(order.delivered_at)}</span>
                    <strong>${money(order.total)}</strong>
                </div>
            </article>
        `;
    }).join("");
}

async function load() {
    if (loading) {
        return;
    }

    loading = true;

    try {
        const me = await api("/api/delivery/me/");
        const availability = document.getElementById("availability");

        if (availability) {
            const isAvailable = Boolean(me.partner.is_available);

            availability.textContent =
                isAvailable ? "Available for orders" : "Offline";

            availability.className =
                "btn " + (isAvailable ? "orange" : "");

            availability.disabled = false;
        }

        const dashboard = await api("/api/delivery/dashboard/");

        renderActiveOrders(dashboard.active_orders || []);
        renderDeliveredOrders(dashboard.delivered_orders || []);
        renderAvailableOrders(dashboard.available_orders || []);

        if (activeOrderId) {
            const stillActive =
                (dashboard.active_orders || []).some(function (order) {
                    return Number(order.id) === Number(activeOrderId);
                });

            if (!stillActive) {
                stopGps();
            }
        }

    } catch (error) {
        const active = document.getElementById("active");

        if (active) {
            active.innerHTML =
                '<div class="card">' + esc(error.message) + "</div>";
        }

        const delivered = document.getElementById("delivered");
        if (delivered) {
            delivered.innerHTML =
                '<div class="card">' + esc(error.message) + "</div>";
        }

        const available = document.getElementById("available");
        if (available) {
            available.innerHTML =
                '<div class="card">' + esc(error.message) + "</div>";
        }

        console.error("Delivery dashboard error:", error);

    } finally {
        loading = false;
    }
}

async function toggleAvailability() {
    const button = document.getElementById("availability");

    if (!button) {
        return;
    }

    try {
        const me = await api("/api/delivery/me/");

        const result = await api(
            "/api/delivery/availability/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    is_available: !Boolean(me.partner.is_available)
                })
            }
        );

        button.textContent =
            result.is_available
                ? "Available for orders"
                : "Offline";

        button.className =
            "btn " + (result.is_available ? "orange" : "");

        await load();

    } catch (error) {
        alert(error.message);
    }
}

async function acceptOrder(orderId) {
    const message =
        document.getElementById("availableMessage-" + orderId);

    try {
        if (message) {
            message.textContent = "Accepting delivery...";
        }

        await api(
            "/api/delivery/orders/" + orderId + "/accept/",
            {
                method: "POST"
            }
        );

        await load();

    } catch (error) {
        if (message) {
            message.textContent = error.message;
        } else {
            alert(error.message);
        }
    }
}

async function updateDeliveryStatus(orderId, status) {
    const message =
        document.getElementById("deliveryMessage-" + orderId);

    try {
        if (message) {
            message.textContent =
                "Updating status to " + statusLabel(status) + "...";
        }

        const result = await api(
            "/api/delivery/orders/" + orderId + "/status/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    status: status
                })
            }
        );

        if (message) {
            message.textContent =
                "Order status updated to " +
                statusLabel(result.status) +
                ".";
        }

        if (status === "delivered") {
            stopGps();
        }

        await load();

    } catch (error) {
        if (message) {
            message.textContent = error.message;
        } else {
            alert(error.message);
        }
    }
}

function startGps(orderId) {
    if (!navigator.geolocation) {
        alert("GPS is not available in this browser.");
        return;
    }

    activeOrderId = Number(orderId);

    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    const gpsStatus = document.getElementById("gpsStatus");

    if (gpsStatus) {
        gpsStatus.textContent = "Requesting GPS...";
    }

    watchId = navigator.geolocation.watchPosition(
        async function (position) {
            try {
                await api(
                    "/api/delivery/orders/" + orderId + "/location/",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        })
                    }
                );

                if (gpsStatus) {
                    gpsStatus.textContent =
                        "GPS sharing active · " +
                        position.coords.latitude.toFixed(5) +
                        ", " +
                        position.coords.longitude.toFixed(5);
                }

            } catch (error) {
                console.error("GPS update failed:", error);

                if (gpsStatus) {
                    gpsStatus.textContent =
                        "GPS update failed: " + error.message;
                }
            }

            await load();
        },
        function (error) {
            if (gpsStatus) {
                gpsStatus.textContent =
                    "GPS error: " + error.message;
            }

            activeOrderId = null;
            watchId = null;

            load();
        },
        {
            enableHighAccuracy: true,
            maximumAge: 5000,
            timeout: 10000
        }
    );

    load();
}

function stopGps() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }

    activeOrderId = null;

    const gpsStatus = document.getElementById("gpsStatus");

    if (gpsStatus) {
        gpsStatus.textContent = "GPS idle";
    }
}

document.addEventListener("click", function (event) {
    const button =
        event.target.closest("[data-action]");

    if (!button) {
        return;
    }

    const action =
        button.dataset.action;

    const orderId =
        Number(button.dataset.orderId);

    if (!orderId) {
        return;
    }

    if (action === "accept") {
        acceptOrder(orderId);
        return;
    }

    if (action === "start-gps") {
        startGps(orderId);
        return;
    }

    if (action === "stop-gps") {
        stopGps();
        load();
        return;
    }

    if (action === "picked-up") {
        updateDeliveryStatus(orderId, "picked_up");
        return;
    }

    if (action === "delivered") {
        updateDeliveryStatus(orderId, "delivered");
    }
});

document
    .getElementById("availability")
    ?.addEventListener(
        "click",
        toggleAvailability
    );

document
    .getElementById("refreshOrders")
    ?.addEventListener(
        "click",
        load
    );

document
    .getElementById("logout")
    ?.addEventListener(
        "click",
        async function () {
            try {
                await api(
                    "/api/logout/",
                    {
                        method: "POST"
                    }
                );
            } catch (_) {
                // Continue to login even if logout request fails.
            }

            stopGps();
            location.href = "login.html";
        }
    );

document.addEventListener("DOMContentLoaded", function () {
    load();

    refreshTimer = window.setInterval(
        load,
        10000
    );
});

window.addEventListener("beforeunload", function () {
    if (refreshTimer) {
        clearInterval(refreshTimer);
    }

    stopGps();
});
