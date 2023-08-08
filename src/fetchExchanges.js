const ccxt = require('ccxt-xpr');

async function fetchExchanges(exchangeName) {
    const exchangeProtonDEX = new ccxt.protondex({
        'secret': process.env.PROTONDEX_API_SECRET_2,
        'verbose': false,
        'timeout': 60000,
    });

    let exchange;

    switch(exchangeName) {
        case 'Kucoin':
            exchange = new ccxt.kucoin({
                'apiKey': process.env.KUCOIN_API_KEY,
                'secret': process.env.KUCOIN_API_SECRET,
                'password': process.env.KUCOIN_API_PASSWORD,
                'verbose': false,
                'timeout': 60000,
            });
            break;
        case 'Gateio':
            exchange = new ccxt.gateio({
                'apiKey': process.env.GATEIO_API_KEY,
                'secret': process.env.GATEIO_API_SECRET,
                'verbose': false,
                'timeout': 60000,
            });
            break;
        // Add more cases for other exchanges as needed
        default:
            console.log(`Exchange ${exchangeName} not recognized`);
    }

    return { exchangeProtonDEX, exchange };
};

module.exports = fetchExchanges;
