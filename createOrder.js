require('dotenv').config();
const ccxt = require('ccxt-xpr');
const BigNumber = require('bignumber.js');


// OPTIONS
const symbol = 'XBTC_XMD'; // Replace with the trading pair symbol you want to trade (remember XBTC not BTC)
let dollarAmount = 5; // Replace with the amount you want to buy or sell (in XMD / Dollars)
const price = 29800; // Replace with the price at which you want to place the order
const orderSide = 2; // Set the order side, 1 for buy and 2 for sell

// FUNCTIONS
async function placeLimitBuyOrder() {
    const exchange = new ccxt.protondex({
        'secret': process.env.PROTONDEX_API_SECRET_2,
        'verbose': true,
        'timeout': 60000,
    });

    // fetch markets from protondex and get precision
    const markets = await exchange.fetchMarkets();
    const market = markets.find(market => market.symbol === symbol);
    console.log('Market:', market);

    // set precision depending on the order side buy or sell
    let symbolPrecision;
    if (orderSide === 1) {
        symbolPrecision = Number(market.info.ask_token.precision);
    } else {
        symbolPrecision = Number(market.info.bid_token.precision);
    }
    console.log('SymbolPrecision:', symbolPrecision);

    // calculate the amount of XPR to buy or sell taking into consideration the precision
    let protondexAmount = dollarAmount;
    if (orderSide === 1) {
        protondexAmount = dollarAmount;
    } else if (orderSide === 2) {
        protondexAmount = Number(new BigNumber(dollarAmount / price).toFixed(symbolPrecision));
    }

    console.log('Amount of', symbol,'placed:', protondexAmount);

    try {
    // Load markets and fetch the symbol info
        await exchange.loadMarkets();

        const order = await exchange.createOrder(symbol, 1, orderSide, protondexAmount, price.toString(), {
            'account': process.env.PROTONDEX_ACCOUNT_2,
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
