// fetchBalances.js
const ccxt = require('ccxt-xpr');

async function fetchBalances({exchangeProtonDEX, exchange, baseTokenProtonDEX, baseTokenExchange, quoteTokenProtonDEX, quoteTokenExchange, exchangeName}) {
    
    // Fetch balances
    const [balanceProtonDEX, balanceExchange] = await Promise.all([
        exchangeProtonDEX.fetchBalance({account: process.env.PROTONDEX_ACCOUNT_2}),
        exchange.fetchBalance(),
    ]);
                
    console.log(`Available balance in ${baseTokenProtonDEX} on ProtonDEX: ${balanceProtonDEX.free[baseTokenProtonDEX]}`);
    console.log(`Available balance in ${quoteTokenProtonDEX} on ProtonDEX: ${balanceProtonDEX.free[quoteTokenProtonDEX]}`);

    console.log(`Available balance in ${baseTokenExchange} on ${exchangeName}: ${balanceExchange.free[baseTokenExchange]}`);
    console.log(`Available balance in ${quoteTokenExchange} on ${exchangeName}: ${balanceExchange.free[quoteTokenExchange]}`);

    return {
        balanceProtonDEX,
        balanceExchange
    };
}

module.exports = fetchBalances;
