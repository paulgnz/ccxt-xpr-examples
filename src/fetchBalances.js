// fetchBalances.js
const ccxt = require('ccxt-xpr');

async function fetchBalances({exchangeProtonDEX, exchangeKucoin, baseTokenProtonDEX, baseTokenKucoin, quoteTokenProtonDEX, quoteTokenKucoin}) {
    
    // Fetch balances
    const [balanceProtonDEX, balanceKucoin] = await Promise.all([
        exchangeProtonDEX.fetchBalance({account: process.env.PROTONDEX_ACCOUNT_2}),
        exchangeKucoin.fetchBalance(),
        ]);
                
        console.log(`Available balance in ${baseTokenProtonDEX} on ProtonDEX: ${balanceProtonDEX.free[baseTokenProtonDEX]}`);
        console.log(`Available balance in ${baseTokenKucoin} on Kucoin: ${balanceKucoin.free[baseTokenKucoin]}`);
        console.log(`Available balance in ${quoteTokenProtonDEX} on ProtonDEX: ${balanceProtonDEX.free[quoteTokenProtonDEX]}`);
        console.log(`Available balance in ${quoteTokenKucoin} on Kucoin: ${balanceKucoin.free[quoteTokenKucoin]}`);

    return {
        balanceProtonDEX,
        balanceKucoin
    };
}

module.exports = fetchBalances;
