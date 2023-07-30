require('dotenv').config();
const ccxt = require('ccxt-xpr');

// OPTIONS
const symbol = 'XBTC_XMD'; // Replace with the trading pair symbol you want to trade (remember XBTC not BTC)
let dollarAmount = 10; // Replace with the amount you want to buy or sell (in XMD / Dollars)
const price = 29550; // Replace with the price at which you want to place the order
const orderSide = 2; // Set the order side, 1 for buy and 2 for sell

// FUNCTIONS
async function placeLimitBuyOrder() {
    const exchange = new ccxt.protondex({
        'secret': process.env.PROTONDEX_API_SECRET,
        'verbose': false,
        'timeout': 60000,
    });

    // fetch markets from protondex and get precision
    const markets = await exchange.fetchMarkets();
    const market = markets.find(market => market.symbol === symbol);
    console.log('Market:', market);

    // set precision depending on the order side buy or sell
    let symbolPrecision;
    if (orderSide === 1) {
        symbolPrecision = market.info.ask_token.precision;
    } else if (orderSide === 2) {
        symbolPrecision = market.info.bid_token.precision;
    }
    console.log('SymbolPrecision:', symbolPrecision);

    // calculate the amount of XPR to buy or sell taking into consideration the precision
    let protondexAmount;
    if (orderSide === 1) {
        protondexAmount = dollarAmount;
    } else if (orderSide === 2) {
        protondexAmount = Number((dollarAmount / price).toFixed(symbolPrecision));
    }

    console.log('Amount of', symbol,' placed:', protondexAmount);

    try {
    // Load markets and fetch the symbol info
        await exchange.loadMarkets();

        const order = await exchange.createOrder(symbol, 1, orderSide, protondexAmount, price, {
            'account': process.env.PROTONDEX_ACCOUNT,
            'filltype': 0,
            'triggerprice': 0,
        });

        console.log('Order placed successfully:');
        // print the log
        console.log(order);
    } catch (error) {
        console.error('Error placing the order:', error.message);
    }
}

placeLimitBuyOrder();
