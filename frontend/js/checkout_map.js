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

    const DEFAULT_LAT = 17.3850;
    const DEFAULT_LNG = 78.4867;

    const map = L.map(mapElement, {
        zoomControl: true,
        minZoom: 3,
        maxZoom: 19,
        worldCopyJump: true
    }).setView([DEFAULT_LAT, DEFAULT_LNG], 12);

    // Use Esri's public street-map tiles instead of the OSM tile endpoint
    // that is returning HTTP 403 in the deployed browser environment.
    L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
            maxZoom: 19,
            attribution: "Tiles &copy; Esri"
        }
    ).addTo(map);

    let marker = null;

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

    function getCity(address) {
        return address.city ||
            address.town ||
            address.municipality ||
            address.city_district ||
            address.district ||
            address.county ||
            address.state_district ||
            "";
    }

    function clean(value) {
        return String(value || "").trim().toLowerCase();
    }

    function digits(value) {
        return String(value || "").replace(/\D/g, "");
    }

    async function reverseGeocode(lat, lng) {
        try {
            const url =
                "https://nominatim.openstreetmap.org/reverse" +
                "?format=jsonv2&lat=" + encodeURIComponent(lat) +
                "&lon=" + encodeURIComponent(lng) +
                "&zoom=18&addressdetails=1";

            const response = await fetch(url, {
                headers: { Accept: "application/json" }
            });

            if (!response.ok) {
                throw new Error("Reverse geocoding failed.");
            }

            const result = await response.json();
            const address = result.address || {};

            const parts = [
                address.house_number,
                address.road,
                address.neighbourhood || address.suburb,
                address.village || address.town || address.city
            ].filter(Boolean);

            if (addressInput) addressInput.value = parts.join(", ");
            if (cityInput) cityInput.value = getCity(address);
            if (pincodeInput) pincodeInput.value = address.postcode || "";

            console.log("Delivery location details:", result);
        } catch (error) {
            console.error("Reverse geocoding error:", error);
        }
    }

    map.on("click", async event => {
        setPoint(event.latlng.lat, event.latlng.lng);
        await reverseGeocode(event.latlng.lat, event.latlng.lng);
    });

    function scoreResult(item, address, city, pincode) {
        const a = item.address || {};
        const display = clean(item.display_name);
        const wantedAddress = clean(address);
        const wantedCity = clean(city);
        const wantedPin = digits(pincode);
        let score = Number(item.importance || 0) * 10;

        if (wantedPin && digits(a.postcode) === wantedPin) score += 100;
        if (wantedCity) {
            const resultCity = clean(getCity(a));
            if (resultCity === wantedCity) score += 50;
            if (display.includes(wantedCity)) score += 20;
        }

        const tokens = wantedAddress
            .split(/[\s,]+/)
            .map(clean)
            .filter(token => token.length >= 4);

        tokens.forEach(token => {
            if (display.includes(token)) score += 3;
        });

        if (item.type === "house" || item.type === "building") score += 12;
        if (item.type === "road") score += 5;

        return score;
    }

    async function searchNominatim(query) {
        const url =
            "https://nominatim.openstreetmap.org/search" +
            "?format=jsonv2&limit=10&countrycodes=in&addressdetails=1&q=" +
            encodeURIComponent(query);

        const response = await fetch(url, {
            headers: { Accept: "application/json" }
        });

        if (!response.ok) return [];
        const found = await response.json();
        return Array.isArray(found) ? found : [];
    }

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
            // Search the address by itself first. This prevents an old City
            // value from forcing a new address into the wrong city.
            const queries = [];

            if (address) {
                queries.push(address);

                if (city || pincode) {
                    queries.push([address, city, pincode].filter(Boolean).join(", "));
                }
            } else {
                queries.push([city, pincode].filter(Boolean).join(", "));
            }

            let results = [];

            for (const query of [...new Set(queries)]) {
                if (!query) continue;
                results = await searchNominatim(query);
                if (results.length) break;
            }

            if (!results.length) {
                alert("Address not found. Try entering the street/locality together with the city or PIN code.");
                return;
            }

            const result = [...results].sort(
                (a, b) =>
                    scoreResult(b, address, city, pincode) -
                    scoreResult(a, address, city, pincode)
            )[0];

            const lat = Number(result.lat);
            const lng = Number(result.lon);

            if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
                alert("The address returned an invalid map location.");
                return;
            }

            setPoint(lat, lng, 17, "Delivery location");
            await reverseGeocode(lat, lng);
            marker?.openPopup();

            console.log("Selected delivery address:", result.display_name);
            console.log("Selected coordinates:", lat, lng);
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
            error => {
                console.error("Geolocation error:", error);
                alert("Unable to access your location. Please allow location permission or use Find Address.");

                useLocationButton.disabled = false;
                useLocationButton.innerHTML =
                    '<i class="bi bi-crosshair"></i> Use my location';
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    });

    // Restore only a previously selected location. Otherwise show the
    // neutral Hyderabad fallback until the customer searches or uses GPS.
    try {
        const saved = JSON.parse(
            localStorage.getItem("foodieDeliveryLocation") || "null"
        );

        if (
            saved &&
            Number.isFinite(Number(saved.lat)) &&
            Number.isFinite(Number(saved.lng))
        ) {
            setPoint(Number(saved.lat), Number(saved.lng), 16);
        } else {
            setPoint(DEFAULT_LAT, DEFAULT_LNG, 12);
        }
    } catch (_) {
        setPoint(DEFAULT_LAT, DEFAULT_LNG, 12);
    }

    document.getElementById("checkout-form")?.addEventListener(
        "submit",
        () => {
            if (latInput.value && lngInput.value) {
                localStorage.setItem(
                    "foodieDeliveryLocation",
                    JSON.stringify({
                        lat: Number(latInput.value),
                        lng: Number(lngInput.value)
                    })
                );
            }
        },
        { capture: true }
    );
});