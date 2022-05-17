// This script processes address data, filters out irrelevant addresses, and formats them into a usable array.
// It's designed to work with output from getUniqueAddressObjects.js, which provides unique address objects.

const ADDRESSES = []; // Placeholder for address data

/**
 * Extracts unique addresses from the provided data.
 * Filters out addresses with "Unit" or "Suite" in the street name and formats them for use in real estate queries.
 */
(async function getUniqueAddresses() {
    let uniqueAddresses = [];

    // Loop through the address data and extract valid addresses
    ADDRESSES.forEach(addrObj => {
        const { number, street, city } = addrObj.properties || {};

        if (number && street && !street.split(' ').includes('Unit') && !street.split(' ').includes('Suite') && city) {
            uniqueAddresses.push(`${number} ${street}, ${city}, ON`);
        }
    });

    const uniqueAddressesArr = Array.from(new Set(uniqueAddresses)); // Ensure uniqueness of addresses

    console.log('✅ Extracted Unique Addresses:');
    console.log(JSON.stringify(uniqueAddressesArr, null, 2)); // Pretty print JSON
})();