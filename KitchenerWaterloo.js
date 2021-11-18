require('dotenv').config();
const stringify = require('json-stringify-safe'); // Required to stringify cicular objects, crashed out script using regular JSON.stringify (TypeError: Converting circular structure to JSON --> starting at object with constructor 'Object')


const kitchenerWaterlooV1 = require('./data/kitchenerWaterloo_v1');
const allDataV1 = require('./data/allData_v1');
const searchData = require('./data/KitchenerWaterloo_OSM_Parsed');

const { arrayToCsv, arrayToCsvForComps, arrayToCsvForCompsSimple } = require('./helpers/arrayToCsv');
const {
    _getActiveHomesXPercentBelowAverageHomePrice,
    _getAverageHomePrice,
} = require('./helpers/formula');
const puppeteer = require('puppeteer');
const path = require('path');

/* Returns Page For Login */
async function openWebsite(browser) {
    const page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('https://itsorealestate.ca');
    return page;
}

async function signIntoPortal(page) {
    const navigationPromise = page.waitForNavigation();
    // await page.setDefaultNavigationTimeout(250);

    /* Input Email */
    await page.waitForSelector('#clareity', {
        visible: true,
    });
    await page.type('#clareity', process.env.EMAIL);

    // Some bug with inputing password so we have to do it twice
    /* Input Password */
    await page.waitForTimeout(1000);
    await page.type('#security', 'SOLDEASY99');
    await page.waitForTimeout(2000);
    await page.type('#security', 'SOLDEASY99');

    /* Click "Sign In" */
    await page.waitForSelector('#loginbtn', { visible: true });
    await page.click('#loginbtn');

    await navigationPromise;
}

async function openIsoMatrix(page) {
    const navigationPromise = page.waitForNavigation();

    await page.waitForSelector('#appColumn1253', {
        visible: true,
    });
    // const newPage = await page.click("#appColumn1253");

    await navigationPromise;
}

/* Returns Page For Residential Search */
async function openSearchResidental(browser) {
    const page = await browser.newPage();

    await page.setViewport({ width: 1400, height: 800 });
    await page.goto('https://matrix.itsorealestate.ca/Matrix/Search/Residential');

    return page;
}

/* Choose the "options" on the Search page */
async function setSearchSettings(page) {
    await page.waitForSelector(`[data-mtx-track="Status - Active"]`);
    await page.type('#FmFm23_Ctrl18_119_Ctrl18_TB', '0-3');
    // await page.click(`[data-mtx-track="Status - Suspended"]`);
    await page.click(`[data-mtx-track="Status - Closed"]`);
    await page.click(`[data-mtx-track="Property Sub Type - House"]`);
    await page.click(`[data-mtx-track="Property Attached - Detached"]`);

    await page.waitForTimeout(500);
    await page.type('.mapSearchDistance', '0.33');
    // console.log("✅ Done setting search settings.");
}

async function setAddress(page, addressQuery) {
    // Make sure we are on "Criteria" tab aka "m_ucResultsPageTabs_m_pnlSearchTab"
    await page.waitForSelector('#m_ucResultsPageTabs_m_pnlSearchTab');
    await page.click('#m_ucResultsPageTabs_m_pnlSearchTab');

    // Make sure the address search input is cleared aka "Fm23_Ctrl19_TB"
    await page.waitForSelector('#Fm23_Ctrl19_TB', {
        visible: true,
    });
    await page.evaluate(
        () => (document.getElementById('Fm23_Ctrl19_TB').value = '')
    );

    // Type address query in address search input
    await page.waitForSelector('#Fm23_Ctrl19_TB', { visible: true });
    await page.type('#Fm23_Ctrl19_TB', addressQuery);

    // Wait for the address search suggesstion results to show up
    // await page.waitForTimeout(1000);
    await page.waitForSelector('.disambiguation', { visible: true });

    // Select the first address search suggestion
    // await page.waitForTimeout(1000);
    await page.evaluate(() => {
        document.querySelector('.disambiguation').children[1].click();
    });
}

async function gotoResultsThenScrapeThenReturnArray(page, addressQuery) {
    // This selects the "Results" tab aka "m_ucResultsPageTabs_m_pnlResultsTab"
    // await page.waitForTimeout(1000);
    await page.waitForSelector('#m_ucResultsPageTabs_m_pnlResultsTab');
    await page.click('#m_ucResultsPageTabs_m_pnlResultsTab');

    await page.waitForTimeout(1000);

    // If noListingsFound gives us a value, that means no listings were found
    const noListingsFound = await page.evaluate(() => {
        return document.querySelector('#m_pnlNoResults');
    });

    if (!noListingsFound) {
        try {
            await page.waitForSelector('.j-DisplayCore-item');
        } catch {
            console.log(`❌ ❌ ❌ [BUG] Possible bug here for address: ${addressQuery}. Should have loaded listings. Returning empty array for now.`);
            return [];
        }

        // Here we grab the raw HTML then generate an object which is stored in scrappedResultsArr
        const scrappedResultsArr = await page.evaluate(() => {
            const results = Array.from(
                document.querySelectorAll('.j-DisplayCore-item')
            );
            // console.log("Raw HTML Results:");
            // console.log(results);

            let formattedResultsArr = [];
            results.forEach(row => {
                let homeObj = {
                    distanceFromSearch: row.children[1].innerText,
                    mls: row.children[8].innerText,
                    mlsUrl: '',
                    status: row.children[9].innerText,
                    currentPrice: parseInt(row.children[10].innerText.replace(/\D/g, '')),
                    subType: row.children[11].innerText,
                    commonInterest: row.children[12].innerText,
                    address: row.children[13].innerText,
                    city: row.children[14].innerText,
                    sqftAboveGround: parseInt(row.children[17].innerText.replace(/\D/g, '')) || 0,
                    sqftBelowGround: parseInt(row.children[18].innerText.replace(/\D/g, '')) || 0,
                    sqftTotal: (parseInt(row.children[17].innerText.replace(/\D/g, '')) || 0) + (parseInt(row.children[18].innerText.replace(/\D/g, '')) || 0), // TODO: This might not be calculating correctly
                    daysOnMarket: parseInt(row.children[19].innerText.replace(/\D/g, '')),
                    lotDepth: Math.round(row.children[20].innerText),
                    lotFront: Math.round(row.children[21].innerText),
                    beds: row.children[22].innerText,
                    baths: row.children[23].innerText,
                    lotSqft: Math.round(row.children[20].innerText) * Math.round(row.children[21].innerText)
                };
                formattedResultsArr.push(homeObj);
            });

            // Here we return scrappedResultsArr which has the formatted HTML data
            return formattedResultsArr;
        });

        return scrappedResultsArr
    } else {
        console.log(`❌ [WARN] no listings found for addressQuery: ${addressQuery}. Returning empty array.`);
        return [];
    }
}

/**
 * Setup the browser
 * log in to the website and initiate search settings
 */
async function connectToRealEstate() {
    const browser = await puppeteer.launch({ headless: false });

    try {
        const loginPage = await openWebsite(browser);
        await signIntoPortal(loginPage);
        await openIsoMatrix(loginPage);
        const searchPage = await openSearchResidental(browser);
        await setSearchSettings(searchPage);
        return searchPage;
    } catch (error) {
        console.log(`❌ Failed to scrape or log listings: ${error}`);
    }
}

/**
 * @param {*} searchPage
 * @param [] addressArr - Which addresses we want to run algo on
 * @returns Array of results
 */
async function parseResults(searchPage, addressArr) {
    let finalArray = [];

    for (const address of addressArr) {
        console.log(`In for of loop, trying address: ${address}`);

        try {
            await setAddress(searchPage, address);
        } catch (error) {
            console.log(`❌ ${error}`);
            continue;
        }

        const scrappedResultsArr = await gotoResultsThenScrapeThenReturnArray(searchPage, address);

        if (scrappedResultsArr.length === 0) {
            console.log(`❌ [WARN] No results found for ${address}`);
            continue;
        }

        const averageHomePrice = _getAverageHomePrice(scrappedResultsArr);
        console.log(`averageHomePrice: ${averageHomePrice}`);

        // averageHomePrice is our main compare value. We should add all metrics before we extract deals, since we are using the metrics to determine the deals!
        // Add averageHomePriceInTheArea & discountFromAverageHomePrice to each house
        scrappedResultsArr.forEach(home => {
            home.averageHomePriceInTheArea = averageHomePrice;
            home.discountFromAverageHomePrice = Math.round((1 - home.currentPrice / averageHomePrice) * 100) + '%';
        })

        const discountedHomesArr = _getActiveHomesXPercentBelowAverageHomePrice(
            0.2,
            averageHomePrice,
            scrappedResultsArr,
            finalArray
        );

        finalArray = [...finalArray, ...discountedHomesArr];

        console.log('✅ Updated finalArray:');
        console.log(stringify(finalArray, null, 1));

        // await searchPage.waitForSelector('#m_ucResultsPageTabs_m_pnlSearchTab');
        // await searchPage.click('#m_ucResultsPageTabs_m_pnlSearchTab');

        // await searchPage.waitForSelector('#Fm23_Ctrl19_TB', { visible: true });
        // await searchPage.evaluate(
        //     () => (document.getElementById('Fm23_Ctrl19_TB').value = '')
        // );
    }
    console.log('✅ ✅ ✅ ✅ ✅ ✅ ✅ DONE ✅ ✅ ✅ ✅ ✅ ✅ ✅');
    console.log('finalArray');
    console.log(finalArray);
    return finalArray;
}

// We want to build query to only have location address
// We can have addressQuery & withinKMQuery
// Then we want to loop through the query and export all the data
async function main() {
    const searchPage = await connectToRealEstate();
    const resultsArr = await parseResults(
        searchPage,
        // kitchenerWaterlooV1.slice(10, 11)
        searchData
    );
    const csvResult = arrayToCsvForCompsSimple(resultsArr);
}

main();