// replace PVT_K1_ with your private key
// replace trading.paul with your XPR account 

const ccxt = require('ccxt-xpr');

async function placeLimitBuyOrder() {
  const exchange = new ccxt.protondex({
    'secret': 'PVT_K1_',
    'verbose': process.argv.includes('--verbose'),
    'timeout': 60000,
  });

  const symbol = 'XPR_XMD'; // Replace with the trading pair symbol you want to trade
  const amount = 1100; // Replace with the amount you want to buy
  const price = 0.000916; // Replace with the price at which you want to place the order

  try {
    // Load markets and fetch the symbol info
    await exchange.loadMarkets();
    const symbolInfo = exchange.markets[symbol];

    // Place a limit buy order (after symbol, is the order type, then order side)
    // LIMIT = 1, STOPLOSS = 2, TAKEPROFIT = 3
    // BUY = 1, SELL = 2
    const order = await exchange.createOrder(symbol, 1, 1, amount, price, {
      'account': 'trading.paul',
      'filltype': 0,
      'triggerprice': 0,
    });

    console.log('Order placed successfully:');
    console.log(order);
  } catch (error) {
    console.error('Error placing the order:', error.message);
  }
}

placeLimitBuyOrder();
