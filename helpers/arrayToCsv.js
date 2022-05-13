const arrayToCsv = arr => {
    const headers = [
        'Data Type', 'Days On Market', 'MLS Number', 'Listed Price', 
        'Average Price Nearby', 'Discount', 'Address', 'City', 
        'Beds', 'Baths', 'Sqft Above Ground', 'Sqft Below Ground', 
        'Sqft Total', 'Lot Depth', 'Lot Front'
    ];

    const csvString = [
        headers,
        ...arr.map(home => [
            home.dataType, home.daysOnMarket, home.mls, 
            home.currentPrice, home.averageHomePriceInTheArea, 
            home.discountFromAverageHomePrice, home.address, home.city, 
            home.beds, home.baths, home.sqftAboveGround, 
            home.sqftBelowGround, home.sqftTotal, 
            home.lotDepth, home.lotFront
        ]),
    ]
    .map(e => e.join(','))
    .join('\n');

    console.log('✅ CSV generated successfully');
    console.log(csvString);
    return csvString;
};

const arrayToCsvForComps = arr => {
    const headers = [
        'Data Type', 'MLS Number', 'Days On Market', 'Listed Price', 
        'Average Price Nearby', 'Discount', 'Sqft Diff', 
        'Lot Sqft Diff', 'Address', 'City', 'Beds', 'Baths', 
        'Sqft Above Ground', 'Sqft Below Ground', 'Sqft Total', 
        'Lot Depth', 'Lot Front', 'Lot Sqft'
    ];

    let csvArr = [headers.join(',')];

    arr.forEach(home => {
        const csvDeal = [
            home.dataType, home.mls, home.daysOnMarket, 
            `$${home.currentPrice}`, home.averageHomePriceInTheArea, 
            home.discountFromAverageHomePrice, 'NA', 'NA', 
            home.address, home.city, home.beds, home.baths, 
            home.sqftAboveGround, home.sqftBelowGround, home.sqftTotal, 
            home.lotDepth, home.lotFront, home.lotSqft
        ].join(',');

        csvArr.push(csvDeal);

        if (home.comparables && home.comparables.length > 0) {
            home.comparables.forEach(comp => {
                const sqftDiff = comp.sqftTotal && home.sqftTotal
                    ? `${Math.round((comp.sqftTotal / home.sqftTotal - 1) * 100)}%`
                    : 'NA';

                const lotSqftDiff = home.lotSqft > 0 && comp.lotSqft
                    ? `${Math.round((comp.lotSqft / home.lotSqft - 1) * 100)}%`
                    : 'NA';

                const csvComp = [
                    comp.dataType, comp.mls, comp.daysOnMarket, 
                    `$${comp.currentPrice}`, 'NA', 'NA', 
                    sqftDiff, lotSqftDiff, comp.address, comp.city, 
                    comp.beds, comp.baths, comp.sqftAboveGround, 
                    comp.sqftBelowGround, comp.sqftTotal, 
                    comp.lotDepth, comp.lotFront, comp.lotSqft
                ].join(',');

                csvArr.push(csvComp);
            });
        }

        csvArr.push('');
    });

    const csvString = csvArr.join("\r\n");

    console.log('✅ CSV for comparisons generated successfully');
    console.log(csvString);
    return csvString;
};

const arrayToCsvForCompsSimple = arr => {
    const headers = [
        'Data Type', 'MLS Number', 'Days On Market', 'Listed Price', 
        'Average Price Nearby', 'Discount', 'Sqft Diff', 'Lot Sqft Diff'
    ];

    let csvArr = [headers.join(',')];

    arr.sort((a, b) => parseFloat(b.discountFromAverageHomePrice) - parseFloat(a.discountFromAverageHomePrice));

    arr.forEach(home => {
        const csvDeal = [
            home.dataType, home.mls, home.daysOnMarket, 
            `$${home.currentPrice}`, `$${home.averageHomePriceInTheArea}`, 
            home.discountFromAverageHomePrice, 'NA', 'NA'
        ].join(',');

        csvArr.push(csvDeal);

        if (home.comparables && home.comparables.length > 0) {
            home.comparables.forEach(comp => {
                const sqftDiff = comp.sqftTotal && home.sqftTotal
                    ? `${Math.round((comp.sqftTotal / home.sqftTotal - 1) * 100)}%`
                    : 'NA';

                const lotSqftDiff = home.lotSqft > 0 && comp.lotSqft
                    ? `${Math.round((comp.lotSqft / home.lotSqft - 1) * 100)}%`
                    : 'NA';

                const csvComp = [
                    comp.dataType, comp.mls, comp.daysOnMarket, 
                    `$${comp.currentPrice}`, 'NA', 'NA', 
                    sqftDiff, lotSqftDiff
                ].join(',');

                csvArr.push(csvComp);
            });
        }

        csvArr.push('');
    });

    const csvString = csvArr.join("\r\n");

    console.log('✅ Simplified CSV for comparisons generated successfully');
    console.log(csvString);
    return csvString;
};

module.exports = { arrayToCsv, arrayToCsvForComps, arrayToCsvForCompsSimple };