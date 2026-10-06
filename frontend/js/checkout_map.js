document.addEventListener("DOMContentLoaded", function () {

    const mapElement =
        document.getElementById("deliveryMap");

    if (
        !mapElement ||
        typeof L === "undefined" ||
        typeof L.maplibreGL !== "function"
    ) {
        return;
    }


    // =====================================================
    // ELEMENTS
    // =====================================================

    const latInput =
        document.getElementById("deliveryLat");

    const lngInput =
        document.getElementById("deliveryLng");

    const addressInput =
        document.getElementById("address");

    const cityInput =
        document.getElementById("city");

    const pincodeInput =
        document.getElementById("pincode");

    const findAddressButton =
        document.getElementById("findAddress");

    const useLocationButton =
        document.getElementById("useLocation");


    // =====================================================
    // DEFAULT LOCATION
    // =====================================================

    const DEFAULT_LAT = 15.5057;
    const DEFAULT_LNG = 80.0499;


    // =====================================================
    // CREATE MAP
    // =====================================================

    const map = L.map(
        mapElement,
        {
            minZoom: 5,
            maxZoom: 18,

            maxBounds: [
                [6, 68],
                [36, 98]
            ],

            maxBoundsViscosity: 1
        }
    ).setView(
        [
            DEFAULT_LAT,
            DEFAULT_LNG
        ],
        13
    );


    // =====================================================
    // MAP STYLE
    // =====================================================

    L.maplibreGL({
        style:
            "https://tiles.openfreemap.org/styles/liberty"
    }).addTo(map);


    let marker = null;


    // =====================================================
    // SET MARKER
    // =====================================================

    function setPoint(
        lat,
        lng,
        zoom = 16
    ) {

        lat = Number(lat);
        lng = Number(lng);


        if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng)
        ) {
            return;
        }


        // Save coordinates
        latInput.value =
            lat.toFixed(6);

        lngInput.value =
            lng.toFixed(6);


        // Create marker
        if (!marker) {

            marker =
                L.marker(
                    [
                        lat,
                        lng
                    ],
                    {
                        draggable: true
                    }
                )
                .addTo(map)
                .bindPopup(
                    "Delivery location"
                );


            // Marker drag
            marker.on(
                "dragend",
                function () {

                    const point =
                        marker.getLatLng();


                    latInput.value =
                        point.lat.toFixed(6);

                    lngInput.value =
                        point.lng.toFixed(6);

                    reverseGeocode(
                        point.lat,
                        point.lng
                    );

                }
            );

        } else {

            marker.setLatLng(
                [
                    lat,
                    lng
                ]
            );

        }


        // Move map
        map.setView(
            [
                lat,
                lng
            ],
            zoom
        );

    }


    // =====================================================
    // DISTRICT HELPER
    // =====================================================

    function getDistrict(address) {
        return (
            address.district ||
            address.county ||
            address.state_district ||
            address.city_district ||
            address.municipality ||
            address.city ||
            address.town ||
            address.village ||
            ""
        );
    }

    // =====================================================
    // REVERSE GEOCODING
    // =====================================================

    async function reverseGeocode(lat, lng) {

        try {

            const url =
                "https://nominatim.openstreetmap.org/reverse" +
                "?format=jsonv2" +
                "&lat=" + encodeURIComponent(lat) +
                "&lon=" + encodeURIComponent(lng) +
                "&zoom=18" +
                "&addressdetails=1";

            const response =
                await fetch(
                    url,
                    {
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Reverse geocoding failed."
                );
            }

            const result =
                await response.json();

            const address =
                result.address || {};

            const addressParts = [
                address.house_number,
                address.road,
                address.neighbourhood ||
                    address.suburb,
                address.village ||
                    address.town ||
                    address.city_district
            ].filter(Boolean);

            if (addressInput) {
                addressInput.value =
                    addressParts.join(", ");
            }

            if (cityInput) {
                cityInput.value = getDistrict(address);
            }

            if (pincodeInput) {
                pincodeInput.value =
                    address.postcode || "";
            }

            console.log(
                "Delivery location details:",
                result
            );

        } catch (error) {

            console.error(
                "Reverse geocoding error:",
                error
            );

        }

    }


    // =====================================================
    // FILL CITY / PIN FROM COORDINATES
    // =====================================================

    async function fillCityAndPincodeFromLocation(lat, lng) {

        try {

            const url =
                "https://nominatim.openstreetmap.org/reverse" +
                "?format=jsonv2" +
                "&lat=" + encodeURIComponent(lat) +
                "&lon=" + encodeURIComponent(lng) +
                "&zoom=18" +
                "&addressdetails=1";

            const response =
                await fetch(
                    url,
                    {
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

            if (!response.ok) {
                throw new Error(
                    "Unable to fetch location details."
                );
            }

            const result =
                await response.json();

            const address =
                result.address || {};

            if (cityInput) {
                cityInput.value = getDistrict(address);
            }

            if (pincodeInput) {
                pincodeInput.value =
                    address.postcode || "";
            }

            console.log(
                "City/PIN fetched from found location:",
                address
            );

        } catch (error) {

            console.error(
                "City/PIN lookup error:",
                error
            );

        }

    }


    // =====================================================
    // MAP CLICK
    // =====================================================

    map.on(
        "click",
        async function (event) {

            const lat =
                event.latlng.lat;

            const lng =
                event.latlng.lng;

            setPoint(
                lat,
                lng
            );

            await reverseGeocode(
                lat,
                lng
            );

        }
    );


    // =====================================================
    // BUILD ADDRESS
    // =====================================================

    function getDeliveryAddress() {

        const address =
            addressInput
                ? addressInput.value.trim()
                : "";

        const city =
            cityInput
                ? cityInput.value.trim()
                : "";

        const pincode =
            pincodeInput
                ? pincodeInput.value.trim()
                : "";


        const parts = [];


        if (address) {
            parts.push(address);
        }

        if (city) {
            parts.push(city);
        }

        if (pincode) {
            parts.push(pincode);
        }


        parts.push("Andhra Pradesh");
        parts.push("India");


        return parts.join(", ");

    }


    // =====================================================
    // FIND ADDRESS
    // =====================================================

    async function findAddress() {

        const address =
            addressInput
                ? addressInput.value.trim()
                : "";

        const city =
            cityInput
                ? cityInput.value.trim()
                : "";

        const pincode =
            pincodeInput
                ? pincodeInput.value.trim()
                : "";

        if (!address && !city && !pincode) {

            alert(
                "Please enter a delivery address, city, or PIN code first."
            );

            return;

        }

        if (findAddressButton) {

            findAddressButton.disabled = true;

            findAddressButton.innerHTML =
                '<i class="bi bi-hourglass-split"></i> Searching...';

        }

        try {

            // Search the customer's address first. Do not make an
            // old/stale city or PIN prevent a valid address search.
            const queries = [];

            if (address) {

                queries.push(
                    address +
                    (city ? ", " + city : "") +
                    ", Andhra Pradesh, India"
                );

                queries.push(
                    address +
                    ", Andhra Pradesh, India"
                );

            } else {

                queries.push(
                    [city, pincode, "Andhra Pradesh", "India"]
                        .filter(Boolean)
                        .join(", ")
                );

            }

            let results = [];

            for (const query of queries) {

                const url =
                    "https://nominatim.openstreetmap.org/search" +
                    "?format=jsonv2" +
                    "&limit=5" +
                    "&countrycodes=in" +
                    "&addressdetails=1" +
                    "&q=" +
                    encodeURIComponent(query);

                const response =
                    await fetch(
                        url,
                        {
                            headers: {
                                "Accept":
                                    "application/json"
                            }
                        }
                    );

                if (!response.ok) {
                    continue;
                }

                const found =
                    await response.json();

                if (
                    Array.isArray(found) &&
                    found.length > 0
                ) {

                    results = found;
                    break;

                }

            }

            if (
                !results ||
                results.length === 0
            ) {

                alert(
                    "Address not found. Try adding the city or PIN code."
                );

                return;

            }

            // Prefer a result whose PIN matches the customer-entered PIN.
            // This avoids selecting a same-named village from another district.
            const normalizedPin = pincode.replace(/\\D/g, "");
            const result =
                (normalizedPin
                    ? results.find(item => String(item.address?.postcode || "").replace(/\\D/g, "") === normalizedPin)
                    : null) ||
                results[0];

            const lat =
                Number(result.lat);

            const lng =
                Number(result.lon);

            if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lng)
            ) {

                alert(
                    "The address returned an invalid map location."
                );

                return;

            }

            // Move the marker to the searched location.
            setPoint(
                lat,
                lng,
                17
            );

            // Use the address information returned by the search.
            const resultAddress =
                result.address || {};

            if (cityInput) {

                cityInput.value = getDistrict(resultAddress);

            }

            if (pincodeInput) {

                pincodeInput.value =
                    resultAddress.postcode ||
                    "";

            }

            // Reverse-geocode the exact coordinates as a second
            // check so City/PIN are taken from the actual map point.
            await fillCityAndPincodeFromLocation(
                lat,
                lng
            );

            if (marker) {

                marker
                    .setPopupContent(
                        "Delivery location"
                    )
                    .openPopup();

            }

            console.log(
                "Delivery address found:",
                result.display_name
            );

        } catch (error) {

            console.error(
                "Address search error:",
                error
            );

            alert(
                "Unable to find the address right now. Please try again."
            );

        } finally {

            if (findAddressButton) {

                findAddressButton.disabled = false;

                findAddressButton.innerHTML =
                    '<i class="bi bi-search"></i> Find Address';

            }

        }

    }

    // =====================================================
    // FIND ADDRESS BUTTON
    // =====================================================

    if (findAddressButton) {

        findAddressButton.addEventListener(
            "click",
            findAddress
        );

    }


    // =====================================================
    // USE MY LOCATION
    // =====================================================

    if (useLocationButton) {

        useLocationButton.addEventListener(
            "click",
            function () {

                if (!navigator.geolocation) {

                    alert(
                        "Location access is not supported by this browser."
                    );

                    return;

                }


                useLocationButton.disabled =
                    true;

                useLocationButton.innerHTML =
                    '<i class="bi bi-hourglass-split"></i> Finding...';


                navigator.geolocation.getCurrentPosition(

                    async function (position) {

                        setPoint(
                            position.coords.latitude,
                            position.coords.longitude,
                            17
                        );

                        await reverseGeocode(
                            position.coords.latitude,
                            position.coords.longitude
                        );


                        if (marker) {

                            marker
                                .setPopupContent(
                                    "Your current location"
                                )
                                .openPopup();

                        }


                        useLocationButton.disabled =
                            false;

                        useLocationButton.innerHTML =
                            '<i class="bi bi-crosshair"></i> Use my location';

                    },


                    function () {

                        alert(
                            "Unable to access your location. Please allow location permission or use Find Address."
                        );


                        useLocationButton.disabled =
                            false;

                        useLocationButton.innerHTML =
                            '<i class="bi bi-crosshair"></i> Use my location';

                    },


                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }

                );

            }
        );

    }


    // =====================================================
    // RESTORE SAVED DELIVERY LOCATION
    // =====================================================

    try {

        const saved =
            JSON.parse(
                localStorage.getItem(
                    "foodieDeliveryLocation"
                ) || "null"
            );


        if (
            saved &&
            Number.isFinite(
                Number(saved.lat)
            ) &&
            Number.isFinite(
                Number(saved.lng)
            )
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
                13
            );

        }

    } catch (error) {

        console.warn(
            "Unable to restore saved delivery location.",
            error
        );


        setPoint(
            DEFAULT_LAT,
            DEFAULT_LNG,
            13
        );

    }


    // =====================================================
    // SAVE DELIVERY LOCATION
    // =====================================================

    document
        .getElementById("checkout-form")
        ?.addEventListener(
            "submit",
            function () {

                if (
                    latInput.value &&
                    lngInput.value
                ) {

                    localStorage.setItem(
                        "foodieDeliveryLocation",
                        JSON.stringify(
                            {
                                lat:
                                    Number(
                                        latInput.value
                                    ),

                                lng:
                                    Number(
                                        lngInput.value
                                    )
                            }
                        )
                    );

                }

            },
            {
                capture: true
            }
        );

});