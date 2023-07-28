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

    const protondexPrice = protondexTicker.last;
    const kucoinPrice = kucoinTicker.bid;

    console.log('ProtonDEX Price:', protondexPrice);
    console.log('Kucoin Price:', kucoinPrice);

    if (protondexPrice && kucoinPrice) {
      const spreadPercentage = Math.abs(((kucoinPrice - protondexPrice) / protondexPrice) * 100);
      console.log('Spread Percentage:', spreadPercentage.toFixed(2) + '%');

      const arbitrageThreshold = 0.5;
      if (spreadPercentage > arbitrageThreshold) {
        console.log('Arbitrage opportunity detected!');
        const minOrderValue = 2; // Minimum order value in USDT
        const maxPrice = Math.max(protondexPrice, kucoinPrice); // Use the higher price
        const amount = minOrderValue / maxPrice; // Amount of XPR to buy or sell        

        // If Kucoin price is higher, buy on ProtonDEX and sell on Kucoin
        // If Kucoin price is higher, buy on ProtonDEX and sell on Kucoin
        if (kucoinPrice > protondexPrice) {
            try {
                console.log('Amount:', Number(amount.toFixed(4)));
                console.log('Price:', Number(protondexPrice.toFixed(6)));                
                console.log(`Trying to buy ${amount} XPR on ProtonDEX at price ${protondexPrice} and sell on Kucoin at price ${kucoinPrice}`);
                const orderProtonDEX = await exchangeProtonDEX.createOrder(symbolProtonDEX, 1, 1, Number(amount.toFixed(4)), Number(protondexPrice.toFixed(6)), {
                    'account': process.env.PROTONDEX_ACCOUNT,
                    'filltype': 0,
                    'triggerprice': 0,
                });
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
                console.log('Amount:', Number(amount.toFixed(4)));
                console.log('Price:', Number(protondexPrice.toFixed(6)));
                                
                console.log(`Trying to buy ${amount} XPR on Kucoin at price ${kucoinPrice} and sell on ProtonDEX at price ${protondexPrice}`);
                const orderProtonDEX = await exchangeProtonDEX.createOrder(symbolProtonDEX, 1, 2, Number(amount.toFixed(4)), Number(protondexPrice.toFixed(6)), {
                    'account': process.env.PROTONDEX_ACCOUNT,
                    'filltype': 0,
                    'triggerprice': 0,
                });
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
