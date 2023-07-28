// Example script started by Paul Grey to arbitrage trade between ProtonDEX & KuCoin
// ADD YOUR WEBAUTH PRIVATE KEY TO .ENV FILE ON PROTONDEX_API_SECRET
// ADD YOUR KUCOIN KEY & SECRET TO .ENV FILE ON KUCOIN_API_KEY & KUCOIN_SECRET_KEY
// In the current script, the arbitrage threshold is set to 1.0, which means the Kucoin price needs to be at least 1% higher than the ProtonDEX price for an arbitrage opportunity to be detected and a trade to be made.

require('dotenv').config();
const ccxt = require('ccxt-xpr');

const symbolProtonDEX = 'XPR_XMD';
const symbolKucoin = 'XPR/USDT';

async function fetchPrices() {
  const exchangeProtonDEX = new ccxt.protondex({
    'secret': process.env.PROTONDEX_API_SECRET,
    'verbose': process.argv.includes('--verbose'),
    'timeout': 60000,
  });

  const exchangeKucoin = new ccxt.kucoin({
    'apiKey': process.env.KUCOIN_API_KEY,
    'secret': process.env.KUCOIN_SECRET_KEY,
    'verbose': process.argv.includes('--verbose'),
    'timeout': 60000,
  });

  try {
    const [protondexTicker, kucoinTicker] = await Promise.all([
      exchangeProtonDEX.fetchTicker(symbolProtonDEX),
      exchangeKucoin.fetchTicker(symbolKucoin),
    ]);

    //console.log('ProtonDEX Ticker:', protondexTicker);
    //console.log('Kucoin Ticker:', kucoinTicker);

    const protondexPrice = protondexTicker.last;
    const kucoinPrice = kucoinTicker.bid;

    console.log('ProtonDEX Price:', protondexPrice);
    console.log('Kucoin Price:', kucoinPrice);

    if (protondexPrice && kucoinPrice) {
      const spreadPercentage = ((kucoinPrice - protondexPrice) / protondexPrice) * 100;
      console.log('Spread Percentage:', spreadPercentage.toFixed(2) + '%');

      const arbitrageThreshold = 1;
      if (spreadPercentage > arbitrageThreshold) {
        console.log('Arbitrage opportunity detected!');
        const amount = 5;

        const orderProtonDEX = await exchangeProtonDEX.createOrder(symbolProtonDEX, 'limit', 'buy', amount, protondexPrice, {
          'account': 'trading.paul',
          'filltype': 0,
          'triggerprice': 0,
        });
        console.log('ProtonDEX Order placed successfully:', orderProtonDEX);

        const orderKucoin = await exchangeKucoin.createOrder(symbolKucoin, 'limit', 'sell', amount, kucoinPrice);
        console.log('Kucoin Order placed successfully:', orderKucoin);
      } else {
        console.log('No arbitrage opportunity at the moment.');
      }
    } else {
      console.log('Unable to calculate spread percentage. Prices are missing.');
    }
  } catch (error) {
    console.error('Error fetching prices or placing orders:', error.message);
  }
}

// Call the function to fetch prices and execute the arbitrage strategy at 10-second intervals
setInterval(fetchPrices, 30000);
