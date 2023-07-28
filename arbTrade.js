require('dotenv').config();
const ccxt = require('ccxt-xpr');
const fs = require('fs');

let rawdata = fs.readFileSync('protondex_precision.json');
let markets = JSON.parse(rawdata);

const symbolProtonDEX = 'XDOGE_XMD';
const symbolKucoin = 'DOGE/USDT';

// const symbolProtonDEX = 'XPR_XMD';
// const symbolKucoin = 'XPR/USDT';

async function fetchPrices() {
  const exchangeProtonDEX = new ccxt.protondex({
    'secret': process.env.PROTONDEX_API_SECRET,
    'verbose': true,
    'timeout': 60000,
  });

  const exchangeKucoin = new ccxt.kucoin({
    'apiKey': process.env.KUCOIN_API_KEY,
    'secret': process.env.KUCOIN_API_SECRET,
    'password': process.env.KUCOIN_API_PASSWORD,
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

    const marketsKucoin = await exchangeKucoin.fetchMarkets();

    const marketProtonDEX = markets.markets.find(market => market.symbol === symbolProtonDEX);
    const marketKucoin = marketsKucoin.find(market => market.symbol === symbolKucoin);

    // console.log('marketProtonDEX:', marketProtonDEX);
    // console.log('marketKucoin:', marketKucoin);
    
    const precisionProtonDEX = marketProtonDEX.bid_token.precision;
    const precisionKucoin = marketKucoin.precision.price;

    const protondexPrice = Number(protondexTicker.last.toFixed(precisionProtonDEX));
    const kucoinPrice = Number(kucoinTicker.bid);

    // console.log('MarketsProtonDEX:', marketsProtonDEX);
    // console.log('MarketsKucoin:', marketsKucoin);
    
    console.log('ProtonDEX Price:', protondexPrice);
    console.log('Kucoin Price:', kucoinPrice);

    if (protondexPrice && kucoinPrice) {
      const spreadPercentage = Math.abs(((kucoinPrice - protondexPrice) / protondexPrice) * 100);
      console.log('Spread Percentage:', spreadPercentage.toFixed(2) + '%');

      const arbitrageThreshold = 0.4;
      if (spreadPercentage > arbitrageThreshold) {
        console.log('Arbitrage opportunity detected!');
        const minOrderValue = 5; // Minimum order value in USDT

        const protonAmount = Number((minOrderValue).toFixed(2));
        const kucoinAmount = Number((minOrderValue / kucoinPrice).toFixed(2));
        const maxPrice = Math.max(protondexPrice, kucoinPrice); // Use the higher price
        console.log('protonAmount:', `${protonAmount}`);
        console.log(`kucoinAmount:`, `${kucoinAmount}`);
        
        // Fetch balances
        const [balanceProtonDEX, balanceKucoin] = await Promise.all([
          exchangeProtonDEX.fetchBalance({account: process.env.PROTONDEX_ACCOUNT}),
          exchangeKucoin.fetchBalance(),
        ]);
        
        // Check if the balances are sufficient
        const baseTokenProtonDEX = symbolProtonDEX.split('_')[0]; // Token for ProtonDEX
        const baseTokenKucoin = symbolKucoin.split('/')[0]; // Token for Kucoin

        // Quote currencies
        const quoteTokenProtonDEX = symbolProtonDEX.split('_')[1]; // Quote token for ProtonDEX
        const quoteTokenKucoin = symbolKucoin.split('/')[1]; // Quote token for Kucoin

        console.log(`Available balance in ${baseTokenProtonDEX} on ProtonDEX: ${balanceProtonDEX.free[baseTokenProtonDEX]}`);
        console.log(`Available balance in ${baseTokenKucoin} on Kucoin: ${balanceKucoin.free[baseTokenKucoin]}`);
        console.log(`Available balance in ${quoteTokenProtonDEX} on ProtonDEX: ${balanceProtonDEX.free[quoteTokenProtonDEX]}`);
        console.log(`Available balance in ${quoteTokenKucoin} on Kucoin: ${balanceKucoin.free[quoteTokenKucoin]}`);

        if (balanceProtonDEX.free[baseTokenProtonDEX] < amount || balanceKucoin.free[baseTokenKucoin] < amount ||
            balanceProtonDEX.free[quoteTokenProtonDEX] < neededBalance || balanceKucoin.free[quoteTokenKucoin] < neededBalance) {
            console.error('Insufficient balance!');
            return;
        }
        
        if (balanceProtonDEX.free[baseTokenProtonDEX] < amount || balanceKucoin.free[baseTokenKucoin] < amount ||
            balanceProtonDEX.free[quoteTokenProtonDEX] < neededBalance || balanceKucoin.free[quoteTokenKucoin] < neededBalance) {
            console.error('Insufficient balance!');
            return;
        }

        //
        // If Kucoin price is higher, buy on ProtonDEX and sell on Kucoin
        if (kucoinPrice > protondexPrice) {
            try {
                console.log(`Trying to buy ${amount} TOKEN on ProtonDEX at price ${protondexPrice} and sell on Kucoin at price ${kucoinPrice}`);
                const orderProtonDEX = await exchangeProtonDEX.createOrder(symbolProtonDEX, 1, 1, amount, protondexPrice, {
                    'account': process.env.PROTONDEX_ACCOUNT,
                    'filltype': 0,
                    'triggerprice': 0,
                });
                console.log(`${symbolProtonDEX} ${amount} ${protondexPrice}`);

                console.log('ProtonDEX buy order placed:', orderProtonDEX);
            } catch (error) {
                console.error('Error placing ProtonDEX order:', error);
            }

            try {
                const orderKucoin = await exchangeKucoin.createOrder(symbolKucoin, 'limit', 'sell', amount, kucoinPrice);
                console.log('Kucoin sell order placed:', orderKucoin);
            } catch (error) {
                console.error('Error placing Kucoin order:', error);
            }
        } 
        // If ProtonDEX price is lower, buy on Kucoin and sell on ProtonDEX
        else {
            try {                               
                const amount = Number((minOrderValue / maxPrice).toFixed(2));
                console.log(`Trying to buy ${amount} TOKEN on Kucoin at price ${kucoinPrice} and sell on ProtonDEX at price ${protondexPrice}`);
                const orderProtonDEX = await exchangeProtonDEX.createOrder(symbolProtonDEX, 1, 2, amount, protondexPrice, {
                    'account': process.env.PROTONDEX_ACCOUNT,
                    'filltype': 0,
                    'triggerprice': 0,
                });
                console.log(`${symbolProtonDEX} ${amount} ${protondexPrice}`);

                console.log('ProtonDEX sell order placed:', orderProtonDEX);
            } catch (error) {
                console.error('Error placing ProtonDEX order:', error);
            }

            try {
                const orderKucoin = await exchangeKucoin.createOrder(symbolKucoin, 'limit', 'buy', amount, kucoinPrice);
                console.log('Kucoin buy order placed:', orderKucoin);
            } catch (error) {
                console.error('Error placing Kucoin order:', error);
            }
        }
  
        
      } else {
        console.log('No arbitrage opportunity at the moment.');
      }
    } else {
      console.log('Unable to calculate spread percentage. Prices are missing.');
    }
  } catch (error) {
    if (error instanceof ccxt.DDoSProtection || error.message.includes('429')) {
      console.log('Rate limit exceeded, waiting for 1 minute before retrying.');
      setTimeout(fetchPrices, 60000);
    } else {
      console.error('Error fetching prices or placing orders:', error.message);
    }
  }
}

setInterval(fetchPrices, 30000);
