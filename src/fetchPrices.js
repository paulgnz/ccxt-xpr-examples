const BigNumber = require('bignumber.js');

let marketsProtonDEX, marketsKucoin;

async function fetchAndStoreMarkets(exchangeProtonDEX, exchangeKucoin) {
    [marketsProtonDEX, marketsKucoin] = await Promise.all([
        exchangeProtonDEX.fetchMarkets(),
        exchangeKucoin.fetchMarkets(),
    ]);
}


async function fetchPricesAndPrecision(exchangeProtonDEX, exchangeKucoin, symbolProtonDEX, symbolKucoin) {
    if (!marketsProtonDEX || !marketsKucoin) {
        await fetchAndStoreMarkets(exchangeProtonDEX, exchangeKucoin);
    }

    const [protondexTicker, kucoinTicker] = await Promise.all([
        exchangeProtonDEX.fetchTicker(symbolProtonDEX),
        exchangeKucoin.fetchTicker(symbolKucoin),
    ]);

    // console.log('protondexTicker:', protondexTicker);
    // console.log('kucoinTicker:', kucoinTicker);
    const marketProtonDEX = marketsProtonDEX.find(market => market.symbol === symbolProtonDEX);
    
    const marketKucoin = marketsKucoin.find(market => market.symbol === symbolKucoin);

    const precisionProtonDEXAsk = Number(marketProtonDEX.info.ask_token.precision);
    const precisionProtonDEXBid = Number(marketProtonDEX.info.bid_token.precision);
    const precisionKucoin = 8;

    const priceProtonDEX = Number(new BigNumber(protondexTicker.last).toFixed(precisionProtonDEXAsk));
    const priceKucoin = kucoinTicker.bid;

    return {
        priceProtonDEX,
        priceKucoin,
        precisionProtonDEXAsk,
        precisionProtonDEXBid,
        precisionKucoin
    }
};

module.exports = fetchPricesAndPrecision;
