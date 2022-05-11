require('dotenv').config();
const stringify = require('json-stringify-safe'); // Required to stringify circular objects
const puppeteer = require('puppeteer');

const kitchenerWaterlooV1 = require('./data/kitchenerWaterloo_v1');
const allDataV1 = require('./data/allData_v1');
const { arrayToCsvForCompsSimple } = require('./helpers/arrayToCsv');
const { 
    _getActiveHomesXPercentBelowAverageHomePrice, 
    _getAverageHomePrice 
} = require('./helpers/formula');

/**
 * Opens the real estate website.
 * @param {Object} browser - Puppeteer browser instance
 * @returns {Object} page - Puppeteer page instance
 */
async function openWebsite(browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto('https://itsorealestate.ca');
    return page;
}

/**
 * Signs into the real estate portal.
 * @param {Object} page - Puppeteer page instance
 */
async function signIntoPortal(page) {
    try {
        const navigationPromise = page.waitForNavigation();

        await page.waitForSelector('#clareity', { visible: true });
        await page.type('#clareity', process.env.EMAIL);

        // Input password with retries to avoid bugs
        await page.waitForTimeout(1000);
        await page.type('#security', 'SOLDEASY');
        await page.waitForTimeout(2000);
        await page.type('#security', 'SOLDEASY');

        await page.waitForSelector('#loginbtn', { visible: true });
        await page.click('#loginbtn');

        await navigationPromise;
    } catch (error) {
        console.error(`❌ Error during login: ${error}`);
        await page.screenshot({ path: 'login_error.png' });
        throw error;
    }
}

/**
 * Opens the Matrix search page for residential properties.
 * @param {Object} browser - Puppeteer browser instance
 * @returns {Object} page - Puppeteer page instance
 */
async function openSearchResidential(browser) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 800 });
    await page.goto('https://matrix.itsorealestate.ca/Matrix/Search/Residential');
    return page;
}

/**
 * Configures the search settings on the real estate website.
 * @param {Object} page - Puppeteer page instance
 */
async function setSearchSettings(page) {
    await page.waitForSelector(`[data-mtx-track="Status - Active"]`);
    await page.type('#FmFm23_Ctrl18_119_Ctrl18_TB', '0-25');
    await page.click(`[data-mtx-track="Status - Closed"]`);
    await page.click(`[data-mtx-track="Property Sub Type - House"]`);
    await page.click(`[data-mtx-track="Property Attached - Detached"]`);

    await page.waitForTimeout(500);
    await page.type('.mapSearchDistance', '0.33');
}

/**
 * Sets the address for the property search.
 * @param {Object} page - Puppeteer page instance
 * @param {string} addressQuery - Address to search
 */
async function setAddress(page, addressQuery) {
    await page.waitForSelector('#m_ucResultsPageTabs_m_pnlSearchTab');
    await page.click('#m_ucResultsPageTabs_m_pnlSearchTab');

    await page.waitForSelector('#Fm23_Ctrl19_TB', { visible: true });
    await page.evaluate(() => (document.getElementById('Fm23_Ctrl19_TB').value = ''));
    await page.type('#Fm23_Ctrl19_TB', addressQuery);

    await page.waitForSelector('.disambiguation', { visible: true });
    await page.evaluate(() => {
        document.querySelector('.disambiguation').children[1].click();
    });
}

/**
 * Retrieves search results for a given address.
 * @param {Object} page - Puppeteer page instance
 * @param {string} addressQuery - Address to search
 * @returns {Array} Array of formatted results
 */
async function gotoResultsThenScrapeThenReturnArray(page, addressQuery) {
    await page.waitForSelector('#m_ucResultsPageTabs_m_pnlResultsTab');
    await page.click('#m_ucResultsPageTabs_m_pnlResultsTab');
    await page.waitForTimeout(1000);

    const noListingsFound = await page.evaluate(() => document.querySelector('#m_pnlNoResults'));

    if (!noListingsFound) {
        try {
            await page.waitForSelector('.j-DisplayCore-item');
            const scrappedResultsArr = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.j-DisplayCore-item')).map(row => ({
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
                    sqftTotal: (parseInt(row.children[17].innerText.replace(/\D/g, '')) || 0) + 
                                (parseInt(row.children[18].innerText.replace(/\D/g, '')) || 0),
                    daysOnMarket: parseInt(row.children[19].innerText.replace(/\D/g, '')),
                    lotDepth: Math.round(row.children[20].innerText),
                    lotFront: Math.round(row.children[21].innerText),
                    beds: row.children[22].innerText,
                    baths: row.children[23].innerText,
                    lotSqft: Math.round(row.children[20].innerText) * Math.round(row.children[21].innerText)
                }));
            });
            return scrappedResultsArr;
        } catch {
            console.error(`❌ Possible bug for address: ${addressQuery}. Returning empty array.`);
            return [];
        }
    } else {
        console.warn(`❌ No listings found for addressQuery: ${addressQuery}. Returning empty array.`);
        return [];
    }
}

/**
 * Setup the browser, log in to the website and initiate search settings.
 * @returns {Object} searchPage - Puppeteer page instance after setup
 */
async function connectToRealEstate() {
    const browser = await puppeteer.launch({ headless: false });
    try {
        const loginPage = await openWebsite(browser);
        await signIntoPortal(loginPage);
        await openIsoMatrix(loginPage);
        const searchPage = await openSearchResidential(browser);
        await setSearchSettings(searchPage);
        return searchPage;
    } catch (error) {
        console.error(`❌ Failed to scrape or log listings: ${error}`);
        await browser.close();
    }
}

/**
 * Parses the results for a list of addresses.
 * @param {Object} searchPage - Puppeteer page instance
 * @param {Array} addressArr - Array of addresses to search
 * @returns {Array} Array of final results
 */
async function parseResults(searchPage, addressArr) {
    let finalArray = [];

    for (const address of addressArr) {
        console.log(`Trying address: ${address}`);

        try {
            await setAddress(searchPage, address);
        } catch (error) {
            console.error(`❌ Error setting address ${address}: ${error}`);
            continue;
        }

        const scrappedResultsArr = await gotoResultsThenScrapeThenReturnArray(searchPage, address);

        if (scrappedResultsArr.length === 0) {
            console.warn(`❌ No results found for ${address}`);
            continue;
        }

        const averageHomePrice = _getAverageHomePrice(scrappedResultsArr);
        console.log(`Average home price: ${averageHomePrice}`);

        scrappedResultsArr.forEach(home => {
            home.averageHomePriceInTheArea = averageHomePrice;
            home.discountFromAverageHomePrice = 
                Math.round((1 - home.currentPrice / averageHomePrice) * 100) + '%';
        });

        const discountedHomesArr = _getActiveHomesXPercentBelowAverageHomePrice(
            0.2,
            averageHomePrice,
            scrappedResultsArr,
            finalArray
        );

        finalArray = [...finalArray, ...discountedHomesArr];

        console.log('✅ Updated final array:', stringify(finalArray, null, 1));
    }

    console.log('✅ Scraping complete. Final results:', finalArray);
    return finalArray;
}

/**
 * Main function to initiate scraping process.
 */
async function main() {
    const searchPage = await connectToRealEstate();
    if (searchPage) {
        const resultsArr = await parseResults(searchPage, allDataV1);
        const csvResult = arrayToCsvForCompsSimple(resultsArr);
    }
}

main();