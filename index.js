require('dotenv').config();
const kitchenerWaterlooV1 = require('./data/kitchenerWaterloo_v1');
const { arrayToCsv } = require('./helpers/convert');

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

  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('https://matrix.itsorealestate.ca/Matrix/Search/Residential');

  return page;
}

/* Choose the "options" on the Search page */
async function setSearchSettings(page) {
  await page.waitForSelector(`[data-mtx-track="Status - Active"]`);
  await page.type('#FmFm23_Ctrl18_119_Ctrl18_TB', '0-5');
  // await page.click(`[data-mtx-track="Status - Suspended"]`);
  await page.click(`[data-mtx-track="Status - Closed"]`);
  await page.click(`[data-mtx-track="Property Sub Type - House"]`);
  await page.click(`[data-mtx-track="Property Attached - Detached"]`);

  await page.waitForTimeout(500);
  await page.type('.mapSearchDistance', '0.3');
  // console.log("✅ Done setting search settings.");
}

async function setPostalCode(page, postalCodeQuery) {
  // await page.waitForSelector(`[data-mtx-track="Status - Active"]`);
  // await page.click(`[data-mtx-track="Status - Suspended"]`);
  // await page.click(`[data-mtx-track="Status - Closed"]`);

  // await page.waitForTimeout(1000);
  // await page.type(".mapSearchDistance", "0.5");
  // console.log("Setting postal code ...")
  await page.waitForSelector('#Fm23_Ctrl19_TB', { visible: true });
  await page.type('#Fm23_Ctrl19_TB', postalCodeQuery);

  // await page.waitForTimeout(1000);
  // Wait for the location results to show up
  await page.waitForSelector('.disambiguation', { visible: true });

  // await page.waitForTimeout(1000);
  await page.evaluate(() => {
    document.querySelector('.disambiguation').children[1].click();
  });
}

async function scrapeResult(page, postalCode) {
  // await page.waitForTimeout(1000);
  await page.waitForSelector('#m_ucResultsPageTabs_m_pnlResultsTab');
  await page.click('#m_ucResultsPageTabs_m_pnlResultsTab');

  await page.waitForTimeout(1000);

  const failed = await page.evaluate(() => {
    return document.querySelector('#m_pnlNoResults');
  });

  let scrappedResultsArr = [];
  if (failed == null) {
    try {
      await page.waitForSelector('.j-DisplayCore-item');
    } catch {
      console.log(
        `❌ WARNING possibly no results for postal code: ${postalCode}. Returning empty array for now.`
      );
      return [];
    }

    scrappedResultsArr = await page.evaluate(() => {
      const results = Array.from(
        document.querySelectorAll('.j-DisplayCore-item')
      );
      // console.log("Raw HTML Results:");
      // console.log(results);

      let scrappedResultsArr = [];
      // mls number will be the unique identifier for each property
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
          beds: row.children[15].innerText,
          baths: row.children[16].innerText,
          sqftAboveGround: parseInt(
            row.children[17].innerText.replace(/\D/g, '')
          ),
          sqftBelowGround: parseInt(
            row.children[18].innerText.replace(/\D/g, '')
          ),
          daysOnMarket: parseInt(row.children[19].innerText.replace(/\D/g, '')),
        };
        scrappedResultsArr.push(homeObj);
      });
      return scrappedResultsArr;
    });
  }
  return scrappedResultsArr;
}

function _getAverageHomePrice(arrayOfObjects) {
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
}

function _getActiveHomesXPercentBelowAverageHomePrice(
  discountPercentage,
  averageHomePrice,
  arrayOfHomes,
  finalArray
) {
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
  const arr = [];
  let finalArray = [];

  for (const address of addressArr) {
    console.log(`In for of loop, trying address: ${address}`);

    try {
      await setPostalCode(searchPage, address);
    } catch (error) {
      await searchPage.waitForSelector('#m_ucResultsPageTabs_m_pnlSearchTab');
      await searchPage.click('#m_ucResultsPageTabs_m_pnlSearchTab');
      await searchPage.waitForSelector('#Fm23_Ctrl19_TB', {
        visible: true,
      });
      await searchPage.evaluate(
        () => (document.getElementById('Fm23_Ctrl19_TB').value = '')
      );
      continue;
    }

    const scrappedResultsArr = await scrapeResult(searchPage, address);
    // console.log("✅ Listings have been scrapped and logged to the console");
    // console.log(scrappedResultsArr)

    const averageHomePrice = _getAverageHomePrice(scrappedResultsArr);
    console.log(`averageHomePrice: ${averageHomePrice}`);

    const discountedHomesArr = _getActiveHomesXPercentBelowAverageHomePrice(
      0.2,
      averageHomePrice,
      scrappedResultsArr,
      arr
    );
    // console.log("✅ discountedHomesArr");
    // console.log(discountedHomesArr)
    finalArray = [...arr, ...discountedHomesArr];

    console.log(`Updated finalArray with results from ${address}`);
    // console.log(finalArray);

    await searchPage.waitForSelector('#m_ucResultsPageTabs_m_pnlSearchTab');
    await searchPage.click('#m_ucResultsPageTabs_m_pnlSearchTab');

    await searchPage.waitForSelector('#Fm23_Ctrl19_TB', { visible: true });
    await searchPage.evaluate(
      () => (document.getElementById('Fm23_Ctrl19_TB').value = '')
    );
  }
  console.log('✅ ✅ ✅ ✅ ✅ ✅ ✅ DONE ✅ ✅ ✅ ✅ ✅ ✅ ✅');
  console.log('finalArray');
  console.log(finalArray);
  return finalArray;
}

// We want to build query to only have location address
// We can have postalCodeQuery & withinKMQuery
// Then we want to loop through the query and export all the data
async function main() {
  const searchPage = await connectToRealEstate();
  const resultsArr = await parseResults(
    searchPage,
    kitchenerWaterlooV1.slice(0, 3)
  );
  const csvResult = arrayToCsv(resultsArr);
}

main();
