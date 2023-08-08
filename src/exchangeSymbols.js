function exchangeSymbols(symbolProtonDEX, symbolExchange, exchangeName) {
    // Base and quote currencies for ProtonDEX
    const baseTokenProtonDEX = symbolProtonDEX.split('_')[0];
    const quoteTokenProtonDEX = symbolProtonDEX.split('_')[1];

    let baseTokenExchange, quoteTokenExchange;

    // Base and quote currencies for other exchange (if provided)
    if (symbolExchange) {
        switch(exchangeName) {
            case 'Kucoin':
                baseTokenExchange = symbolExchange.split('/')[0];
                quoteTokenExchange = symbolExchange.split('/')[1];
                break;
            case 'Gateio':
                // Assuming Gate.io uses the same format as Kucoin
                baseTokenExchange = symbolExchange.split('/')[0];
                quoteTokenExchange = symbolExchange.split('/')[1];
                break;
            // Add more cases for other exchanges as needed
            default:
                console.log(`Exchange ${exchangeName} not recognized`);
        }
    }

    return {
        baseTokenProtonDEX,
        baseTokenExchange,
        quoteTokenProtonDEX,
        quoteTokenExchange,
        symbolProtonDEX,
        symbolExchange
    };
}

module.exports = exchangeSymbols;
