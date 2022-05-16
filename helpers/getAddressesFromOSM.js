const data = require('../dataDump/Hamilton_OSM');

/**
 * Extracts addresses from OpenStreetMap (OSM) data.
 * Filters out addresses that are incomplete or missing key information.
 */
(async function getAddressesFromOSM() {
    let addressesArr = [];

    // Loop through the OSM data and extract complete addresses
    data.forEach(addrObj => {
        const { properties } = addrObj;
        const { "addr:housenumber": houseNumber, "addr:street": street, "addr:city": city } = properties || {};

        if (houseNumber && street && city) {
            addressesArr.push(`${houseNumber} ${street}, ${city}, ON`);
        }
    });

    const uniqueAddressesArr = Array.from(new Set(addressesArr)); // Ensure uniqueness of addresses

    console.log('✅ Extracted Unique Addresses:');
    console.log(JSON.stringify(uniqueAddressesArr, null, 2)); // Pretty print JSON
})();