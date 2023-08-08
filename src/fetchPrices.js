const BigNumber = require('bignumber.js');

let marketsProtonDEX, marketsExchange;

async function fetchAndStoreMarkets(exchangeProtonDEX, exchange) {
    [marketsProtonDEX, marketsExchange] = await Promise.all([
        exchangeProtonDEX.fetchMarkets(),
        exchange.fetchMarkets(),
    ]);
}

async function fetchPricesAndPrecision(exchangeProtonDEX, exchange, symbolProtonDEX, symbolExchange) {
    if (!marketsProtonDEX || !marketsExchange) {
        await fetchAndStoreMarkets(exchangeProtonDEX, exchange);
    }

    const [protondexTicker, exchangeTicker] = await Promise.all([
        exchangeProtonDEX.fetchTicker(symbolProtonDEX),
        exchange.fetchTicker(symbolExchange),
    ]);

    // console.log('protondexTicker:', protondexTicker);
    // console.log('kucoinTicker:', kucoinTicker);    
    const marketProtonDEX = marketsProtonDEX.find(market => market.symbol === symbolProtonDEX);
    const marketExchange = marketsExchange.find(market => market.symbol === symbolExchange);

    const precisionProtonDEXAsk = Number(marketProtonDEX.info.ask_token.precision);
    const precisionProtonDEXBid = Number(marketProtonDEX.info.bid_token.precision);

    const precisionExchange = marketExchange.precision.price ? marketExchange.precision.price : 8;

    const priceProtonDEX = Number(new BigNumber(protondexTicker.last).toFixed(precisionProtonDEXAsk));
    const priceExchange = exchangeTicker.bid;

    return {
        priceProtonDEX,
        priceExchange,
        precisionProtonDEXAsk,
        precisionProtonDEXBid,
        precisionExchange
    }
};

module.exports = fetchPricesAndPrecision;
