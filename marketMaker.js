require('dotenv').config();

const ccxt = require('ccxt-xpr');
const BigNumber = require('bignumber.js');

const symbolProtonDEX = 'XPR_XMD';
const dollarAmount = 10; // Minimal amount in dollars at least $1.5

const exchangeProtonDEX = new ccxt.protondex({
    'secret': process.env.PROTONDEX_API_SECRET,
    'verbose': false,
    'timeout': 60000,
});


async function marketMaking() {
    // Fetch the ticker to get the latest price
    const ticker = await exchangeProtonDEX.fetchTicker(symbolProtonDEX);
    //console.log('Ticker:', ticker);


    // get all open orders
    const orders = await exchangeProtonDEX.fetchOpenOrders('XPR_XMD', 1, 100, {
        'account': process.env.PROTONDEX_ACCOUNT, 'offset': 0, 'ordinal_order_ids': ''
    });
    //console.log('Orders:', orders);
    
    // cancel all orders
    for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        try {
            const response = await exchangeProtonDEX.cancelOrder(order.id, symbolProtonDEX, {'account': process.env.PROTONDEX_ACCOUNT});
            console.log(`Order ${order.id} cancelled.`);
        } catch (error) {
            console.error(`Error cancelling order ${order.id}:`, error);
        }
    }
    
    
    // Cancel all open orders
    //const cancelAllOrders = await exchangeProtonDEX.cancelAllOrders('XPR_XMD');
    
    // Fetch the balance to ensure we have enough funds
    //const balance = await exchangeProtonDEX.fetchBalance({'account': process.env.PROTONDEX_ACCOUNT});
    
    // Fetch the markets to get precision info
    const markets = await exchangeProtonDEX.fetchMarkets();
    const marketProtonDEX = markets.find(market => market.symbol === symbolProtonDEX);
    const precisionProtonDEXAsk = Number(marketProtonDEX.info.ask_token.precision);
    const precisionProtonDEXBid = Number(marketProtonDEX.info.bid_token.precision);
    
    // console.log('Market:', marketProtonDEX);
    let price = new BigNumber(ticker.last).toFixed(precisionProtonDEXAsk);
    const incrementPercentage = new BigNumber(0.0025); // 1 percent

    // buy
    let buyPrice = new BigNumber(price).times(0.995);;
    console.log('buyPrice', buyPrice.toString());
    let buyAmount = dollarAmount; // Amount in base currency
    console.log('buyAmount', buyAmount);

    try {
        for (let i = 0; i < 5; i++) {
            let adjustedBuyPrice = new BigNumber(buyPrice).times(new BigNumber(1).minus(incrementPercentage.times(i)));
            adjustedBuyPrice = adjustedBuyPrice.toFixed(precisionProtonDEXAsk);
    
            const buyOrder = await exchangeProtonDEX.createOrder(symbolProtonDEX, 1, 1, dollarAmount, adjustedBuyPrice.toString(), {
                'account': process.env.PROTONDEX_ACCOUNT,
                'filltype': 0,
                'triggerprice': 0,
            });
    
            console.log(`Buy order ${i+1} placed at price ${adjustedBuyPrice.toString()}:`);
            // console.log(`Buy order ${i+1} placed at price ${adjustedBuyPrice.toString()}:`, buyOrder);
        }
    } catch (error) {
        console.error('Error placing buy order:', error);
    }

    
    // For example, to place a sell order:
    let sellPrice = new BigNumber(price).times(1.005); // 1% more than the current bid price
    
    console.log('sellPrice', sellPrice.toString());
    
    //const sellAmount = new BigNumber(dollarAmount).dividedBy(price).toFixed(precisionProtonDEXBid);
    const sellAmount = Number(new BigNumber(dollarAmount).dividedBy(price).toFixed(precisionProtonDEXBid));

    console.log('sellAmount', sellAmount); 
    

    try {
        for (let i = 0; i < 5; i++) {
            let adjustedSellPrice = new BigNumber(sellPrice.times(BigNumber(1).plus(incrementPercentage.times(i))));

            adjustedSellPrice = adjustedSellPrice.toFixed(precisionProtonDEXAsk);

            const sellOrder = await exchangeProtonDEX.createOrder(symbolProtonDEX, 1, 2, sellAmount, adjustedSellPrice.toString(), {
                'account': process.env.PROTONDEX_ACCOUNT,
                'filltype': 0,
                'triggerprice': 0,
            });

            console.log(`Sell order ${i+1} placed at price ${adjustedSellPrice.toString()}:`);
            // console.log(`Sell order ${i+1} placed at price ${adjustedSellPrice.toString()}:`, sellOrder);
        }
    } catch (error) {
        console.error('Error placing sell order:', error);
    }

    // // create a delay of 1 minute
    //await new Promise(resolve => setTimeout(resolve, 120000));

}
marketMaking();
setInterval(marketMaking, 1200000); // Run the marketMaking function every minute
console.log(`Wait for 20 minutes`);
//marketMaking();
