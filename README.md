# RealDeal - Real Estate Data Scrapper

RealDeal is a simple real estate data scrapper designed to automate the process of gathering and analyzing property data. It scrapes real estate listings, processes the data, and helps identify potential deals by comparing current listings against historical data.

## Features

- **Automated Scraping**: Uses Puppeteer to automate the login and data extraction process from real estate websites.
- **Data Processing**: Calculates average home prices, discounts, and compares listings to identify potential deals.
- **CSV Export**: Converts the processed data into CSV format for easy analysis and sharing.

## Getting Started

### Prerequisites

- **Node.js** version `16.1.0` or higher
- Puppeteer dependencies (installed automatically with `npm install`)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/realdeal.git
cd realdeal
```

2.	Install the necessary dependencies:

```bash
npm install
```

3.	If Puppeteer throws an error during installation, manually install the browser:

```bash
cd ./node_modules/puppeteer
npm run install
cd ../../
```

### Configuration

1.	Copy the sample.env file to .env and fill in your credentials:

```bash
cp sample.env .env
```

2.	Add your email and other required environment variables to the .env file.

### Running the Scraper

Run the main script to start scraping data:

```bash
node index.js
```