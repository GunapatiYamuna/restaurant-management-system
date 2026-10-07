document.addEventListener("DOMContentLoaded", function () {
    const mapElement = document.getElementById("deliveryMap");
    if (!mapElement || typeof L === "undefined") return;

    const latInput = document.getElementById("deliveryLat");
    const lngInput = document.getElementById("deliveryLng");
    const addressInput = document.getElementById("address");
    const cityInput = document.getElementById("city");
    const pincodeInput = document.getElementById("pincode");
    const findAddressButton = document.getElementById("findAddress");
    const useLocationButton = document.getElementById("useLocation");

    // Hyderabad is only the fallback view; it is never forced into searches.
    const DEFAULT_LAT = 17.3850;
    const DEFAULT_LNG = 78.4867;

    const map = L.map(mapElement, {
        zoomControl: true,
        minZoom: 3,
        maxZoom: 19,
        worldCopyJump: true
    }).setView([DEFAULT_LAT, DEFAULT_LNG], 12);

    // Use normal Leaflet OpenStreetMap tiles. This is more reliable here than
    // embedding a MapLibre style through the Leaflet adapter.
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let marker = null;

    // Leaflet needs a size recalculation when the page/container has finished
    // rendering, especially on mobile.
    setTimeout(() => map.invalidateSize(true), 100);
    window.addEventListener("resize", () => map.invalidateSize());

    function setPoint(lat, lng, zoom = 16, popupText = "Delivery location") {
        lat = Number(lat);
        lng = Number(lng);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        latInput.value = lat.toFixed(6);
        lngInput.value = lng.toFixed(6);

        if (!marker) {
            marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            marker.on("dragend", async () => {
                const point = marker.getLatLng();
                latInput.value = point.lat.toFixed(6);
                lngInput.value = point.lng.toFixed(6);
                await reverseGeocode(point.lat, point.lng);
            });
        } else {
            marker.setLatLng([lat, lng]);
        }

        marker.bindPopup(popupText);
        map.setView([lat, lng], zoom, { animate: true });
        setTimeout(() => map.invalidateSize(true), 50);
    }

    function getDistrict(address) {
        return address.city || address.town || address.municipality ||
            address.city_district || address.district || address.county ||
            address.state_district || address.suburb || "";
    }

    async function reverseGeocode(lat, lng) {
        try {
            const url = "https://nominatim.openstreetmap.org/reverse" +
                "?format=jsonv2&lat=" + encodeURIComponent(lat) +
                "&lon=" + encodeURIComponent(lng) +
                "&zoom=18&addressdetails=1";

            const response = await fetch(url, {
                headers: { Accept: "application/json" }
            });
            if (!response.ok) throw new Error("Reverse geocoding failed.");

            const result = await response.json();
            const address = result.address || {};
            const parts = [
                address.house_number,
                address.road,
                address.neighbourhood || address.suburb,
                address.village || address.town || address.city
            ].filter(Boolean);

            if (addressInput) addressInput.value = parts.join(", ");
            if (cityInput) cityInput.value = getDistrict(address);
            if (pincodeInput) pincodeInput.value = address.postcode || "";

            console.log("Delivery location details:", result);
        } catch (error) {
            console.error("Reverse geocoding error:", error);
        }
    }

    async function fillCityAndPincode(lat, lng) {
        await reverseGeocode(lat, lng);
    }

    map.on("click", async event => {
        setPoint(event.latlng.lat, event.latlng.lng);
        await reverseGeocode(event.latlng.lat, event.latlng.lng);
    });

    async function findAddress() {
        const address = addressInput?.value.trim() || "";
        const city = cityInput?.value.trim() || "";
        const pincode = pincodeInput?.value.trim() || "";

        if (!address && !city && !pincode) {
            alert("Please enter a delivery address, city, or PIN code first.");
            return;
        }

        if (findAddressButton) {
            findAddressButton.disabled = true;
            findAddressButton.innerHTML =
                '<i class="bi bi-hourglass-split"></i> Searching...';
        }

        try {
            const queryParts = [address, city, pincode].filter(Boolean);
            const queries = [
                queryParts.join(", "),
                [address, city].filter(Boolean).join(", "),
                [city, pincode].filter(Boolean).join(", ")
            ].filter(Boolean);

            let results = [];

            for (const query of [...new Set(queries)]) {
                const url = "https://nominatim.openstreetmap.org/search" +
                    "?format=jsonv2&limit=8&countrycodes=in&addressdetails=1&q=" +
                    encodeURIComponent(query);

                const response = await fetch(url, {
                    headers: { Accept: "application/json" }
                });
                if (!response.ok) continue;

                const found = await response.json();
                if (Array.isArray(found) && found.length) {
                    results = found;
                    break;
                }
            }

            if (!results.length) {
                alert("Address not found. Try adding the city or PIN code.");
                return;
            }

            const normalizedPin = pincode.replace(/D/g, "");
            const result = normalizedPin
                ? results.find(item =>
                    String(item.address?.postcode || "").replace(/D/g, "") === normalizedPin
                  ) || results[0]
                : results[0];

            const lat = Number(result.lat);
            const lng = Number(result.lon);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                alert("The address returned an invalid map location.");
                return;
            }

            setPoint(lat, lng, 17, "Delivery location");
            await fillCityAndPincode(lat, lng);

            marker?.openPopup();
            console.log("Delivery address found:", result.display_name);
        } catch (error) {
            console.error("Address search error:", error);
            alert("Unable to find the address right now. Please try again.");
        } finally {
            if (findAddressButton) {
                findAddressButton.disabled = false;
                findAddressButton.innerHTML =
                    '<i class="bi bi-search"></i> Find Address';
            }
        }
    }

    findAddressButton?.addEventListener("click", findAddress);

    useLocationButton?.addEventListener("click", () => {
        if (!navigator.geolocation) {
            alert("Location access is not supported by this browser.");
            return;
        }

        useLocationButton.disabled = true;
        useLocationButton.innerHTML =
            '<i class="bi bi-hourglass-split"></i> Finding...';

        navigator.geolocation.getCurrentPosition(
            async position => {
                const { latitude, longitude } = position.coords;
                setPoint(latitude, longitude, 17, "Your current location");
                await reverseGeocode(latitude, longitude);
                marker?.openPopup();
                useLocationButton.disabled = false;
                useLocationButton.innerHTML =
                    '<i class="bi bi-crosshair"></i> Use my location';
            },
            () => {
                alert("Unable to access your location. Please allow location permission or use Find Address.");
                useLocationButton.disabled = false;
                useLocationButton.innerHTML =
                    '<i class="bi bi-crosshair"></i> Use my location';
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });

    try {
        const saved = JSON.parse(localStorage.getItem("foodieDeliveryLocation") || "null");
        if (saved && Number.isFinite(Number(saved.lat)) && Number.isFinite(Number(saved.lng))) {
            setPoint(Number(saved.lat), Number(saved.lng), 16);
        } else {
            setPoint(DEFAULT_LAT, DEFAULT_LNG, 12);
        }
    } catch (_) {
        setPoint(DEFAULT_LAT, DEFAULT_LNG, 12);
    }

    document.getElementById("checkout-form")?.addEventListener("submit", () => {
        if (latInput.value && lngInput.value) {
            localStorage.setItem("foodieDeliveryLocation", JSON.stringify({
                lat: Number(latInput.value),
                lng: Number(lngInput.value)
            }));
        }
    }, { capture: true });
});