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
      console.log(`Home price is either not a number or is not closed:`);
      console.log(home);
    }
  });

  return aggregatedHomePrices / validHomesPricesInArr;
};

const _getActiveHomesXPercentBelowAverageHomePrice = (
  discountPercentage,
  averageHomePrice,
  arrayOfHomes,
  finalArray
) => {
  let discountedHomes = [];

  const maxHomePrice = averageHomePrice * (1 - discountPercentage);

  arrayOfHomes.forEach(home => {
    // console.log('✅ ✅ ✅ ✅ ✅ home ✅ ✅ ✅ ✅ ✅')
    // console.log(home)
    if (finalArray.some(finalHome => finalHome.mls === home.mls)) {
      console.log('✅ ✅ ✅ ✅ ✅ duplicate home ✅ ✅ ✅ ✅ ✅');
      // console.log(finalHome)
    } else if (home.status === 'A' && home.currentPrice < maxHomePrice) {
      home.averageHomePriceInTheArea = averageHomePrice; // Add a value to the home with average home price in the area
      home.discountFromAverageHomePrice =
        Math.round((1 - home.currentPrice / averageHomePrice) * 100) + '%'; // Add percentage discount
      // console.log('✅ Found discounted home ✅')
      // console.log(home)
      discountedHomes.push(home);
    }
  });

  console.log('✅ FINAL discountedHomes ✅');
  console.log(discountedHomes);

  return discountedHomes;
};

module.exports = {
  _getAverageHomePrice,
  _getActiveHomesXPercentBelowAverageHomePrice,
};
