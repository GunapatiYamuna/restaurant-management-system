document.addEventListener("DOMContentLoaded", function () {
    const el = document.getElementById("deliveryMap");
    if (!el || typeof L === "undefined" || typeof L.maplibreGL !== "function") return;

    const latInput = document.getElementById("deliveryLat");
    const lngInput = document.getElementById("deliveryLng");

    const map = L.map(el, {
        minZoom: 1,
        maxZoom: 18,
        maxBounds: [[85, -180], [-85, 180]],
        maxBoundsViscosity: 1
    }).setView([15.5057, 80.0499], 13);

    // OpenFreeMap provides OSM-based vector tiles without requiring an API key.
    // Leaflet still handles clicks/markers while MapLibre renders the basemap.
    L.maplibreGL({
        style: "https://tiles.openfreemap.org/styles/liberty"
    }).addTo(map);

    let marker;

    function setPoint(lat, lng) {
        latInput.value = lat;
        lngInput.value = lng;

        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng], { draggable: true })
                .addTo(map)
                .bindPopup("Delivery location")
                .openPopup();

            marker.on("dragend", function () {
                const point = marker.getLatLng();
                setPoint(point.lat, point.lng);
            });
        }

        map.setView([lat, lng], Math.max(map.getZoom(), 16));
    }

    map.on("click", function (event) {
        setPoint(event.latlng.lat, event.latlng.lng);
    });

    document.getElementById("useLocation")?.addEventListener("click", function () {
        if (!navigator.geolocation) {
            alert("Location access is not supported by this browser. You can select the delivery point on the map.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            function (position) {
                setPoint(position.coords.latitude, position.coords.longitude);
            },
            function () {
                alert("Unable to access your location. You can select the delivery point on the map.");
            },
            {
                enableHighAccuracy: true,
                timeout: 10000
            }
        );
    });

    try {
        const saved = JSON.parse(localStorage.getItem("foodieDeliveryLocation") || "null");
        if (saved && Number.isFinite(Number(saved.lat)) && Number.isFinite(Number(saved.lng))) {
            setPoint(Number(saved.lat), Number(saved.lng));
        }
    } catch (error) {
        console.warn("Unable to restore saved delivery location.", error);
    }

    document.getElementById("checkout-form")?.addEventListener("submit", function () {
        if (latInput.value && lngInput.value) {
            localStorage.setItem(
                "foodieDeliveryLocation",
                JSON.stringify({
                    lat: Number(latInput.value),
                    lng: Number(lngInput.value)
                })
            );
        }
    }, { capture: true });
});