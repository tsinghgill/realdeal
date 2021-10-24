const arrayToCsv = arr => {
  const csvString = [
    [
      'Days On Market',
      'MlS Number',
      'Listed Price',
      'Average Price Nearby',
      'Discount',
      'Address',
      'City',
      'Beds',
      'Baths',
      'Sqft Above Ground',
      'Sqft Below Ground',
    ],
    ...arr.map(home => [
      home.daysOnMarket,
      home.mls,
      home.currentPrice,
      home.averageHomePriceInTheArea,
      home.discountFromAverageHomePrice,
      home.address,
      home.city,
      home.beds,
      home.baths,
      home.sqftAboveGround,
      home.sqftBelowGround,
    ]),
  ]
    .map(e => e.join(','))
    .join('\n');

  console.log('✅ ✅ ✅ ✅ ✅ ✅ ✅  csvString  ✅ ✅ ✅ ✅ ✅ ✅ ✅');
  console.log(csvString);
  return csvString;
};

module.exports = { arrayToCsv };
