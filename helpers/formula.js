const _getAverageHomePrice = arrayOfObjects => {
    let validHomesPricesInArr = 0;
    let aggregatedHomePrices = 0;

    arrayOfObjects.forEach(home => {
        // Make sure the value is a number
        // We increment validHomesPricesInArr so we divide and get the correct average home price in the area
        if (typeof home.currentPrice === 'number' && home.status === 'CL') {
            validHomesPricesInArr++;
            aggregatedHomePrices = aggregatedHomePrices + home.currentPrice;
        } else {
            // The homes logged below should only be non active homes
            console.log(`Home price is either not a number or is not closed:`);
            console.log(home);
        }
    });

    return aggregatedHomePrices / validHomesPricesInArr;
};

const _getActiveHomesXPercentBelowAverageHomePrice = (
    discountPercentage,
    averageHomePrice,
    scrappedResultsArr,
    finalArray
) => {
    let newHomesArr = [];

    const maxHomePrice = averageHomePrice * (1 - discountPercentage);

    scrappedResultsArr.forEach(home => {
        if (finalArray.some(finalHome => finalHome.mls === home.mls)) {
            console.log('[DEBUG] Duplicate Home');
        } else if (home.status === 'A' && home.currentPrice < maxHomePrice) {
            home.dataType = "Deal" // We categorize this as a deal, comparables will have a dataType of "Comparable"
            home.averageHomePriceInTheArea = averageHomePrice; // Add a value to the home with average home price in the area
            home.discountFromAverageHomePrice = Math.round((1 - home.currentPrice / averageHomePrice) * 100) + '%'; // Add percentage discount
            home.comparables = scrappedResultsArr.filter(otherHome => otherHome.mls != home.mls) // Generates array of comparables excluding the home in question itself

            home.comparables.forEach(home => home.dataType = "Comparable") // Here we add dataType of comparable, to comparable homes, this is needed for csv and google spreadsheet displays
            newHomesArr.push(home);
        }
    });

    console.log('✅ New deals we found - newHomesArr:');
    console.log(JSON.stringify(newHomesArr, null, 1));

    return newHomesArr;
};

module.exports = {
    _getAverageHomePrice,
    _getActiveHomesXPercentBelowAverageHomePrice,
};