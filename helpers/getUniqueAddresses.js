// This file works in conjunction with getUniqueAddressObjects
// We get our address data from https://batch.openaddresses.io/data
// First we use getUniqueAddressObjects.js to filter through the data from openaddresses
// getUniqueAddressObjects.js gives us unique objects
// Then we use getUniqueAddresses.js with the result of getUniqueAddressObjects.js
// getUniqueAddresses.js gives us a list of addresses in strings as an array
// This array is fed to the data folder which is then used by index.js to query for listings

// TODO: Clean this file up to import the data
// TODO: Combine both getUniqueAddressObjects.js and getUniqueAddresses.js
// TODO: The data from open addresses doesnt cover all the areas, we need to figure a way to cover every area

const ADDRESSES = []

(async function getUniqueAddresses() {
    let uniqueAddresses = [];

    // This will only happen once to populate the first item we compare with
    ADDRESSES.forEach(addrObj => {
        if (
            addrObj.properties.number &&
            addrObj.properties.street &&
            !addrObj.properties.street.split(' ').includes('Unit') &&
            !addrObj.properties.street.split(' ').includes('Suite')
        ) {
            uniqueAddresses.push(
                `${addrObj.properties.number} ${addrObj.properties.street}, Hamilton, ON`
            );
        }
    });

    // console.log(uniqueAddresses)
    console.log(JSON.stringify(uniqueAddresses, null, 1));
})();

// (async function getUniqueAddresses() {

//     let uniqueAddresses = []

//     // This will only happen once to populate the first item we compare with
//     ADDRESSES.forEach(addrObj => {
//         if (
//             addrObj.properties.number &&
//             addrObj.properties.street &&
//             !addrObj.properties.street.split(" ").includes("Unit") &&
//             !addrObj.properties.street.split(" ").includes("Suite") &&
//             addrObj.properties.city &&
//             (['Waterloo', 'Kitchener', 'Cambridge'].includes(addrObj.properties.city))
//         ) {
//             uniqueAddresses.push(
//                 `${addrObj.properties.number} ${addrObj.properties.street}, ${addrObj.properties.city}`
//             )
//         }
//     });

//     // console.log(uniqueAddresses)
//     console.log(JSON.stringify(uniqueAddresses, null, 1));
// })();