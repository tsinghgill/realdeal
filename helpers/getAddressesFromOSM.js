const data = require('../dataDump/Hamilton_OSM');

(async function getAddressesFromOSM() {
    let addressesArr = [];

    // This will only happen once to populate the first item we compare with
    data.forEach(addrObj => {
        if (
            addrObj &&
            addrObj.properties &&
            addrObj.properties["addr:housenumber"] &&
            addrObj.properties["addr:housenumber"].length > 0 &&
            addrObj.properties["addr:street"] &&
            addrObj.properties["addr:street"].length > 0 &&
            addrObj.properties["addr:city"] &&
            addrObj.properties["addr:city"].length > 0
        ) {
            addressesArr.push(
                `${addrObj.properties["addr:housenumber"]} ${addrObj.properties["addr:street"]}, ${addrObj.properties["addr:city"]}, ON`
            );
        }
    });

    const uniqueAddressesArr = new Set(addressesArr)

    // console.log(uniqueAddressesArr)
    console.log(JSON.stringify(addressesArr, null, 1));
})();