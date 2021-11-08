const arrayToCsv = arr => {
    const csvString = [
            [
                'Data Type',
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
                'Sqft Total',
                'Lot Depth',
                'Lot Front'
            ],
            ...arr.map(home => [
                home.dataType,
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
                home.sqftTotal,
                home.lotDepth,
                home.lotFront
            ]),
        ]
        .map(e => e.join(','))
        .join('\n');

    console.log('✅ ✅ ✅ ✅ ✅ ✅ ✅  csvString  ✅ ✅ ✅ ✅ ✅ ✅ ✅');
    console.log(csvString);
    return csvString;
};

// 'Data Type,Days On Market,MlS Number,Listed Price,Average Price Nearby,Discount,Address,City,Beds,Baths,Sqft Above Ground,Sqft Below Ground,Sqft Total,Lot Depth,Lot Front\nDeal,1,40183428,849000,1090200,22%,38 ROSE BRIDGE Crescent,Cambridge,3,4,1845,0,1845,0,52'

const arrayToCsvForComps = arr => {
    let csvArr = [
        'Data Type, MlS Number, Days On Market, Listed Price, Average Price Nearby, Discount, Address, City, Beds, Baths, Sqft Above Ground, Sqft Below Ground, Sqft Total, Sqft Diff, Lot Depth, Lot Front, Lot Sqft, Lot Sqft Diff'
    ]

    arr.forEach(home => {
        let csvDeal = home.dataType + ',' + home.mls + ',' + home.daysOnMarket + ',' + home.currentPrice + ',' + home.averageHomePriceInTheArea + ',' + home.discountFromAverageHomePrice + ',' + home.address + ',' + home.city + ',' + home.beds + ',' + home.baths + ',' + home.sqftAboveGround + ',' + home.sqftBelowGround + ',' + home.sqftTotal + ',' + 'NA' + ',' + home.lotDepth + ',' + home.lotFront + ',' + home.lotSqft
        csvArr.push(csvDeal)

        if (home.comparables && home.comparables.length > 0) {
            home.comparables.forEach(comp => {
                const sqftDiff = Math.round((comp.sqftTotal / home.sqftTotal - 1) * 100) || undefined // TODO: does the undefined even do anything here? Why doesnt this editor support ?? (You can use ?? in typescript hmm ...)
                let formattedSqftDiff = sqftDiff ? sqftDiff + '%' : 'NA'

                let formattedLotSqftDiff = 'NA'
                if (home.lotSqft > 0) {
                    const lotSqftDiff = Math.round((comp.lotSqft / home.lotSqft - 1) * 100) || undefined
                    let formattedLotSqftDiff = lotSqftDiff + '%'
                }

                let csvComp = comp.dataType + ',' + comp.mls + ',' + comp.daysOnMarket + ',' + comp.currentPrice + ',' + "NA" + ',' + "NA" + ',' + comp.address + ',' + comp.city + ',' + comp.beds + ',' + comp.baths + ',' + comp.sqftAboveGround + ',' + comp.sqftBelowGround + ',' + comp.sqftTotal + ',' + formattedSqftDiff + ',' + comp.lotDepth + ',' + comp.lotFront + ',' + comp.lotSqft + ',' + formattedLotSqftDiff
                csvArr.push(csvComp)
            })
        }
        csvArr.push(' ')
    })

    const csvString = csvArr.join("\r\n");

    console.log('✅ ✅ ✅ ✅ ✅ ✅ ✅  csvString  ✅ ✅ ✅ ✅ ✅ ✅ ✅');
    console.log(csvString);
    return csvString;
};

module.exports = { arrayToCsv, arrayToCsvForComps };