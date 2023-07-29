require('dotenv').config();
const ccxt = require('ccxt-xpr');
const fs = require('fs');

let rawdata = fs.readFileSync('protondex_precision.json');
let markets = JSON.parse(rawdata);

const symbolProtonDEX = 'METAL_XMD';
const symbolGateio = 'METAL/USDT';

async function fetchPrices() {
  const exchangeProtonDEX = new ccxt.protondex({
    'secret': process.env.PROTONDEX_API_SECRET,
    'verbose': false,
    'timeout': 60000,
  });

  const exchangeGateio = new ccxt.gateio({
    'apiKey': process.env.GATEIO_API_KEY,
    'secret': process.env.GATEIO_API_SECRET,
    'verbose': false,
    'timeout': 60000,
  });

  try {
    const [protondexTicker, gateioTicker] = await Promise.all([
      exchangeProtonDEX.fetchTicker(symbolProtonDEX),
      exchangeGateio.fetchTicker(symbolGateio),
    ]);

    // console.log('Fetched ticker from Gate.io:', gateioTicker);

    // console.log('ProtonDEX markets:', markets);
    const marketProtonDEX = markets.data.find(market => market.symbol === symbolProtonDEX);
    
    const precisionProtonDEX = marketProtonDEX.ask_token.precision;
    const protondexPrice = Number(protondexTicker.last.toFixed(precisionProtonDEX));
    const gateioPrice = Number(gateioTicker.bid);

    const marketsGateio = await exchangeGateio.fetchMarkets();
    const marketGateio = marketsGateio.find(market => market.symbol === symbolGateio);
    const precisionGateio = marketGateio.precision.price;

    console.log('ProtonDEX Price:', protondexPrice);
    console.log('Gateio Price:', gateioPrice);

    if (protondexPrice && gateioPrice) {
      const spreadPercentage = Math.abs(((gateioPrice - protondexPrice) / protondexPrice) * 100);
      console.log('Spread Percentage:', spreadPercentage.toFixed(2) + '%');

      const arbitrageThreshold = 1;
      if (spreadPercentage > arbitrageThreshold) {
        console.log('Arbitrage opportunity detected!');
        const minOrderValue = 4; // Minimum order value in USDT
        const maxPrice = Math.max(protondexPrice, gateioPrice); // Use the higher price
        const amount = Number((minOrderValue / maxPrice).toFixed(precisionProtonDEX)); // Amount in base currency (XPR)
        const gateioBuyAmount = Number((minOrderValue / gateioPrice).toFixed(precisionGateio)); // Amount to buy on Gateio
        console.log('protonAmount:', `${minOrderValue}`);
        console.log(`gateioAmount:`, `${gateioBuyAmount}`);
        
        // Fetch balances
        const [balanceProtonDEX, balanceGateio] = await Promise.all([
          exchangeProtonDEX.fetchBalance({account: process.env.PROTONDEX_ACCOUNT}),
          exchangeGateio.fetchBalance(),
        ]);
        
        // Check if the balances are sufficient
        const baseTokenProtonDEX = symbolProtonDEX.split('_')[0]; // Token for ProtonDEX
        const baseTokenGateio = symbolGateio.split('/')[0]; // Token for Gateio

        // Quote currencies
        const quoteTokenProtonDEX = symbolProtonDEX.split('_')[1]; // Quote token for ProtonDEX
        const quoteTokenGateio = symbolGateio.split('/')[1]; // Quote token for Gateio
        const neededBalance = minOrderValue; // You need at least this amount of quote currency to execute the trade
        console.log(`Available balance in ${baseTokenProtonDEX} on ProtonDEX: ${balanceProtonDEX.free[baseTokenProtonDEX]}`);
        console.log(`Available balance in ${baseTokenGateio} on Gateio: ${balanceGateio.free[baseTokenGateio]}`);
        console.log(`Available balance in ${quoteTokenProtonDEX} on ProtonDEX: ${balanceProtonDEX.free[quoteTokenProtonDEX]}`);
        console.log(`Available balance in ${quoteTokenGateio} on Gateio: ${balanceGateio.free[quoteTokenGateio]}`);

        if (balanceProtonDEX.free[baseTokenProtonDEX] < amount || balanceGateio.free[baseTokenGateio] < gateioBuyAmount ||
            balanceProtonDEX.free[quoteTokenProtonDEX] < neededBalance || balanceGateio.free[quoteTokenGateio] < neededBalance) {
            console.error('Insufficient balance!');
            return;
        }
        
        // If Gateio price is higher, buy on ProtonDEX and sell on Gateio
        if (gateioPrice > protondexPrice) {
            try {
                console.log(`Trying to buy TOKEN worth ${minOrderValue} on ProtonDEX at price ${protondexPrice} and sell on Gateio at price ${gateioPrice}`);
                const orderProtonDEX = await exchangeProtonDEX.createOrder(symbolProtonDEX, 1, 1, minOrderValue, protondexPrice, {
                    'account': process.env.PROTONDEX_ACCOUNT,
                    'filltype': 0,
                    'triggerprice': 0,
                });
                console.log(`${symbolProtonDEX} ${minOrderValue} ${protondexPrice}`);

                console.log('ProtonDEX buy order placed:', orderProtonDEX);
            } catch (error) {
                console.error('Error placing ProtonDEX order:', error);
            }

            try {
                const orderGateio = await exchangeGateio.createOrder(symbolGateio, 'limit', 'sell', amount, gateioPrice);
                console.log('Gateio sell order placed:', orderGateio);
            } catch (error) {
                console.error('Error placing Gateio order:', error);
            }
        } 
        // If ProtonDEX price is lower, buy on Gateio and sell on ProtonDEX
        else {
            try {
                console.log(`Trying to buy ${gateioBuyAmount} TOKEN worth ${minOrderValue} on Gateio at price ${gateioPrice} and sell on ProtonDEX at price ${protondexPrice}`);
                const orderProtonDEX = await exchangeProtonDEX.createOrder(symbolProtonDEX, 1, 2, gateioBuyAmount, protondexPrice, {
                    'account': process.env.PROTONDEX_ACCOUNT,
                    'filltype': 0,
                    'triggerprice': 0,
                });
                console.log(`${symbolProtonDEX} ${gateioBuyAmount} ${protondexPrice}`);

                console.log('ProtonDEX sell order placed:', orderProtonDEX);
            } catch (error) {
                console.error('Error placing ProtonDEX order:', error);
            }

            try {
                const orderGateio = await exchangeGateio.createOrder(symbolGateio, 'limit', 'buy', gateioBuyAmount, gateioPrice);
                console.log('Gateio buy order placed:', orderGateio);
            } catch (error) {
                console.error('Error placing Gateio order:', error);
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

setInterval(fetchPrices, 60000);
