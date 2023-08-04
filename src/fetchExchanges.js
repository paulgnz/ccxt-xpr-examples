const ccxt = require('ccxt-xpr');

async function fetchExchanges() {
    const exchangeProtonDEX = new ccxt.protondex({
        'secret': process.env.PROTONDEX_API_SECRET_2,
        'verbose': false,
        'timeout': 60000,
    });

    const exchangeKucoin = new ccxt.kucoin({
        'apiKey': process.env.KUCOIN_API_KEY,
        'secret': process.env.KUCOIN_API_SECRET,
        'password': process.env.KUCOIN_API_PASSWORD,
        'verbose': false,
        'timeout': 60000,
    });

    return { exchangeProtonDEX, exchangeKucoin };
};

module.exports = fetchExchanges;
