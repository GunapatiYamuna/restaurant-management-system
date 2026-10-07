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

    function clean(value) {
        return String(value || "").trim();
    }

    function digits(value) {
        return clean(value).replace(/\D/g, "");
    }

    function setPoint(lat, lng, zoom = 16, popupText = "Delivery location") {
        lat = Number(lat);
        lng = Number(lng);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

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

        // Keep the map clean on mobile. The previous popup was being squeezed by global responsive CSS.\n        marker.unbindPopup();\n        map.setView([lat, lng], zoom, { animate: true });
        setTimeout(() => map.invalidateSize(true), 50);
        return true;
    }

    function setButton(button, disabled, html) {
        if (!button) return;
        button.disabled = disabled;
        button.innerHTML = html;
    }

    function getCity(address) {
        return address.City ||
            address.city ||
            address.Town ||
            address.town ||
            address.Municipality ||
            address.municipality ||
            address.District ||
            address.district ||
            "";
    }

    function getPostal(address) {
        return address.Postal ||
            address.postal ||
            address.postcode ||
            "";
    }

    function getDisplayAddress(attributes, fallback) {
        return attributes.Match_addr ||
            attributes.LongLabel ||
            attributes.Address ||
            fallback ||
            "";
    }

    // ArcGIS is used for both forward and reverse geocoding so that the
    // address -> map and GPS -> address operations use the same provider.
    async function geocodeSearch(singleLine) {
        const response = await fetch(
            "/api/geocode/?mode=search&q=" + encodeURIComponent(singleLine),
            { credentials: "same-origin", cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("Address search service is unavailable.");
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || "Address search failed.");
        }

        return data.candidates || [];
    }

    async function geocodeReverse(lat, lng) {
        const response = await fetch(
            "/api/geocode/?mode=reverse&lat=" +
            encodeURIComponent(lat) +
            "&lng=" + encodeURIComponent(lng),
            { credentials: "same-origin", cache: "no-store" }
        );

        if (!response.ok) {
            throw new Error("Reverse location service is unavailable.");
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message || "Reverse geocoding failed.");
        }

        return data;
    }

    function applyReverseResult(data) {
        const address = data?.address || {};

        if (addressInput) {
            addressInput.value =
                address.Address ||
                address.Match_addr ||
                data?.address?.LongLabel ||
                "";
        }

        if (cityInput) {
            cityInput.value = getCity(address);
        }

        if (pincodeInput) {
            pincodeInput.value = getPostal(address);
        }

        return address;
    }

    async function reverseGeocode(lat, lng) {
        try {
            const data = await geocodeReverse(lat, lng);
            const address = applyReverseResult(data);

            if (marker) {
                marker.bindPopup(
                    "<strong>Delivery location</strong><br>" +
                    (address.Match_addr || address.Address || "Selected location")
                );
            }

            console.log("Reverse geocoded delivery location:", data);
            return address;
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            return null;
        }
    }

    function scoreCandidate(candidate, wantedAddress, wantedCity, wantedPin) {
        const a = candidate.attributes || {};
        const label = clean(candidate.address).toLowerCase();
        const city = clean(
            a.City || a.Town || a.Municipality || a.District
        ).toLowerCase();

        const requested = clean(wantedAddress).toLowerCase();
        const requestedCity = clean(wantedCity).toLowerCase();
        const requestedPin = digits(wantedPin);

        let score = Number(candidate.score || 0);

        // ArcGIS score is the primary ranking.
        if (requestedCity && city === requestedCity) score += 20;

        if (requestedPin && digits(a.Postal) === requestedPin) {
            score += 100;
        }

        // Prefer a result that actually contains the important address text.
        const importantWords = requested
            .split(/[\s,/-]+/)
            .filter(word => word.length >= 4);

        for (const word of importantWords) {
            if (label.includes(word)) score += 2;
        }

        return score;
    }

    async function findAddress() {
        const address = clean(addressInput?.value);
        const city = clean(cityInput?.value);
        const pincode = clean(pincodeInput?.value);

        if (!address && !city && !pincode) {
            alert("Please enter your delivery address first.");
            return;
        }

        setButton(
            findAddressButton,
            true,
            '<i class="bi bi-hourglass-split"></i> Finding...'
        );

        try {
            // Do NOT trust an old city/PIN blindly. Search the complete
            // address first, then use city/PIN only as additional context.
            const queries = [];

            if (address) {
                queries.push(address);

                if (city || pincode) {
                    queries.push(
                        [address, city, pincode, "India"]
                            .filter(Boolean)
                            .join(", ")
                    );
                }
            } else {
                queries.push(
                    [city, pincode, "India"]
                        .filter(Boolean)
                        .join(", ")
                );
            }

            let candidates = [];

            for (const query of [...new Set(queries)]) {
                candidates = await geocodeSearch(query);

                if (candidates.length) break;
            }

            if (!candidates.length) {
                alert(
                    "Address not found. Please enter the street/locality and city, or use your current location."
                );
                return;
            }

            const selected = [...candidates].sort(
                (a, b) =>
                    scoreCandidate(b, address, city, pincode) -
                    scoreCandidate(a, address, city, pincode)
            )[0];

            const lat = Number(selected.location.lat);
            const lng = Number(selected.location.lng);

            if (!setPoint(lat, lng, 17, "Delivery location")) {
                alert("The address returned an invalid map location.");
                return;
            }

            // Use the selected geocoder result immediately so the form does
            // not depend on a second provider giving a different answer.
            const attrs = selected.attributes || {};

            if (addressInput) {
                addressInput.value = getDisplayAddress(attrs, selected.address);
            }

            if (cityInput) {
                cityInput.value = getCity(attrs);
            }

            if (pincodeInput) {
                pincodeInput.value = getPostal(attrs);
            }



            // Reverse-geocode the exact selected coordinates once, so the
            // displayed address is tied to the actual marker position.
            await reverseGeocode(lat, lng);

            console.log("Selected address:", selected.address);
            console.log("Selected coordinates:", lat, lng);
        } catch (error) {
            console.error("Address search error:", error);
            alert(
                "Unable to find the address right now. Please try again."
            );
        } finally {
            setButton(
                findAddressButton,
                false,
                '<i class="bi bi-search"></i> Find Address'
            );
        }
    }

    findAddressButton?.addEventListener("click", findAddress);

    useLocationButton?.addEventListener("click", () => {
        if (!navigator.geolocation) {
            alert("Location access is not supported by this browser.");
            return;
        }

        setButton(
            useLocationButton,
            true,
            '<i class="bi bi-hourglass-split"></i> Finding...'
        );

        navigator.geolocation.getCurrentPosition(
            async position => {
                try {
                    const { latitude, longitude, accuracy } = position.coords;

                    // Always use the browser's actual GPS coordinates.
                    // Never use the old address/city/PIN fields for this action.
                    setPoint(
                        latitude,
                        longitude,
                        17,
                        "Your current location"
                    );

                    const address = await reverseGeocode(latitude, longitude);

                    if (marker) {
                        marker.bindPopup(
                            "<strong>Your current location</strong><br>" +
                            (address?.Match_addr ||
                                address?.Address ||
                                "GPS location")
                        ).openPopup();
                    }

                    console.log(
                        "GPS location:",
                        latitude,
                        longitude,
                        "accuracy:",
                        accuracy,
                        "meters"
                    );

                    if (accuracy > 100) {
                        console.warn(
                            "Browser reported low GPS accuracy:",
                            accuracy,
                            "meters"
                        );
                    }
                } catch (error) {
                    console.error("GPS reverse-geocoding error:", error);
                    alert(
                        "Your GPS location was found, but the address could not be loaded. The map marker is still at your actual location."
                    );
                } finally {
                    setButton(
                        useLocationButton,
                        false,
                        '<i class="bi bi-crosshair"></i> Use my location'
                    );
                }
            },
            error => {
                console.error("Geolocation error:", error);

                let message =
                    "Unable to get your current location.";

                if (error.code === 1) {
                    message =
                        "Location permission was denied. Allow location access in Chrome and try again.";
                } else if (error.code === 2) {
                    message =
                        "Your location could not be determined. Try again or use Find Address.";
                } else if (error.code === 3) {
                    message =
                        "Location request timed out. Try again.";
                }

                alert(message);

                setButton(
                    useLocationButton,
                    false,
                    '<i class="bi bi-crosshair"></i> Use my location'
                );
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    });

    map.on("click", async event => {
        setPoint(
            event.latlng.lat,
            event.latlng.lng,
            Math.max(map.getZoom(), 16),
            "Selected delivery location"
        );

        await reverseGeocode(
            event.latlng.lat,
            event.latlng.lng
        );
    });

    try {
        const saved = JSON.parse(
            localStorage.getItem("foodieDeliveryLocation") || "null"
        );

        if (
            saved &&
            Number.isFinite(Number(saved.lat)) &&
            Number.isFinite(Number(saved.lng))
        ) {
            setPoint(
                Number(saved.lat),
                Number(saved.lng),
                16
            );
        } else {
            setPoint(
                DEFAULT_LAT,
                DEFAULT_LNG,
                12,
                "Default map location"
            );
        }
    } catch (_) {
        setPoint(
            DEFAULT_LAT,
            DEFAULT_LNG,
            12,
            "Default map location"
        );
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