const stringify = require('json-stringify-safe'); // Handles circular references in JSON.stringify

/**
 * Calculate the average home price from an array of home objects.
 * Only considers homes that are closed (status 'CL').
 *
 * @param {Array} arrayOfObjects - Array of home objects
 * @returns {number} - The average home price
 */
const _getAverageHomePrice = arrayOfObjects => {
    let validHomesPricesInArr = 0;
    let aggregatedHomePrices = 0;

    arrayOfObjects.forEach(home => {
        // Check if the current price is a number and the home is closed
        if (typeof home.currentPrice === 'number' && home.status === 'CL') {
            validHomesPricesInArr++;
            aggregatedHomePrices += home.currentPrice;
        } else {
            // Log homes that do not meet the criteria
            console.log('Home price is either not a number or is not closed:', home);
        }
    });

    return aggregatedHomePrices / validHomesPricesInArr || 0;
};

/**
 * Get homes that are listed below a certain percentage of the average home price.
 *
 * @param {number} discountPercentage - The discount percentage below the average home price
 * @param {number} averageHomePrice - The average home price
 * @param {Array} scrappedResultsArr - Array of scrapped home objects
 * @param {Array} finalArray - Array to store final results
 * @returns {Array} - Array of homes that meet the discount criteria
 */
const _getActiveHomesXPercentBelowAverageHomePrice = (
    discountPercentage,
    averageHomePrice,
    scrappedResultsArr,
    finalArray
) => {
    let newHomesArr = [];
    const maxHomePrice = averageHomePrice * (1 - discountPercentage);

    scrappedResultsArr.forEach(home => {
        const isDuplicate = finalArray.some(finalHome => finalHome.mls === home.mls);
        const isEligibleForDeal = home.status === 'A' && home.currentPrice < maxHomePrice;

        if (isDuplicate) {
            console.log('[DEBUG] Duplicate Home:', home.mls);
        } else if (isEligibleForDeal) {
            home.dataType = 'Deal'; // Categorize this as a deal
            home.comparables = scrappedResultsArr.filter(otherHome => otherHome.mls !== home.mls); // Generate array of comparables

            home.comparables.forEach(comp => (comp.dataType = 'Comparable')); // Mark comparables

            newHomesArr.push(home);
        }
    });

    console.log('✅ New deals found:', stringify(newHomesArr, null, 2));
    return newHomesArr;
};

module.exports = {
    _getAverageHomePrice,
    _getActiveHomesXPercentBelowAverageHomePrice,
};