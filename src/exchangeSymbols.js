function exchangeSymbols(symbolProtonDEX, symbolKucoin) {
    // Base and quote currencies for ProtonDEX
    const baseTokenProtonDEX = symbolProtonDEX.split('_')[0];
    const quoteTokenProtonDEX = symbolProtonDEX.split('_')[1];

    let baseTokenKucoin, quoteTokenKucoin;

    // Base and quote currencies for Kucoin (if provided)
    if (symbolKucoin) {
        baseTokenKucoin = symbolKucoin.split('/')[0];
        quoteTokenKucoin = symbolKucoin.split('/')[1];
    }

    return {
        baseTokenProtonDEX,
        baseTokenKucoin,
        quoteTokenProtonDEX,
        quoteTokenKucoin,
        symbolProtonDEX,
        symbolKucoin
    };
}

module.exports = exchangeSymbols;
