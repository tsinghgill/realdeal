(async function getUniqueAddressObjects() {
    var result = addrArr.reduce((unique, o) => {
        if (!unique.some(obj => obj.properties.street === o.properties.street)) {
            unique.push(o);
        }
        return unique;
    }, []);
    // console.log(result)
    console.log(JSON.stringify(result, null, 1));
    return result;
})();