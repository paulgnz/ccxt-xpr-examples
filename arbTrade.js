require('dotenv').config();

const ccxt = require('ccxt-xpr');
const BigNumber = require('bignumber.js');

const TelegramBot = require('node-telegram-bot-api');
const fetchExchanges = require('./src/fetchExchanges.js');
const fetchPricesAndPrecision = require('./src/fetchPrices.js');
const fetchBalances = require('./src/fetchBalances.js');
const exchangeSymbols = require('./src/exchangeSymbols.js');


const testMode = false; // if true, will only search for opportunties and won't actually execute trades
const enableTelegram = true; // if true will send to telegram bot when arb trade happens
const forceMode = true; // if true will keep trying in even if insufficient balance
const exchangeName = 'Gateio'; // the name of the exchange, can use 'Kucoin' instead

// const symbolProtonDEX = 'XLTC_XMD';
// const symbolExchange = 'LTC/USDT';

const tradingPairs = [
    { symbolProtonDEX: 'METAL_XMD', symbolExchange: 'METAL/USDT' },
    { symbolProtonDEX: 'XDOGE_XMD', symbolExchange: 'DOGE/USDT' },
];


const dollarAmount = 10; // Minimal amount in dollars at least $1.5
const arbitrageThreshold = 0.5;


// replace the values in .env with your own 
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: false});
const chatId = process.env.TELEGRAM_CHAT_ID;


// const symbols = exchangeSymbols(symbolProtonDEX, symbolExchange);
// const { baseTokenProtonDEX, baseTokenExchange, quoteTokenProtonDEX, quoteTokenExchange } = symbols;

async function arbTrading(symbolProtonDEX, symbolExchange, exchangeName) {
    const symbols = exchangeSymbols(symbolProtonDEX, symbolExchange, exchangeName);
    const { baseTokenProtonDEX, baseTokenExchange, quoteTokenProtonDEX, quoteTokenExchange } = symbols;
    const { exchangeProtonDEX, exchange } = await fetchExchanges(exchangeName);

    // Fetch prices and precision
    const { priceProtonDEX, priceExchange, precisionProtonDEXAsk, precisionProtonDEXBid, precisionExchange } = 
        await fetchPricesAndPrecision(exchangeProtonDEX, exchange, symbolProtonDEX, symbolExchange, baseTokenProtonDEX, baseTokenExchange, quoteTokenProtonDEX, quoteTokenExchange);

    // Fetch balances
    const { balanceProtonDEX, balanceExchange } =
        await fetchBalances({exchangeProtonDEX, exchange, priceProtonDEX, priceExchange,exchangeName, ...symbols});

    try {
        console.log('ProtonDEX Price:', priceProtonDEX);
        console.log(`${exchangeName} Price:`, priceExchange);

        if (priceProtonDEX && priceExchange) {
            const spreadPercentage = Math.abs(((priceExchange - priceProtonDEX) / priceProtonDEX) * 100);
            console.log('Spread Percentage:', spreadPercentage.toFixed(2) + '%');

            if (spreadPercentage > arbitrageThreshold) {
                console.log('Arbitrage opportunity detected!');
                const maxPrice = Math.max(priceProtonDEX, priceExchange); // Use the higher price
                let amount = Number(new BigNumber(dollarAmount / maxPrice).toFixed(12)); // Amount in base currency
                console.log('Amount ', amount);

                let sufficientBalance = true;
                
                // If ProtonDEX price is lower, BUY on ProtonDEX and SELL on Exchange
                if (priceExchange > priceProtonDEX) {
                    const amountProtonDEX = Number(new BigNumber(dollarAmount).toFixed(precisionProtonDEXAsk));
                    const amountExchange = amount.toFixed(precisionExchange);                        
                    const action = (`Buy ${amountProtonDEX} ${quoteTokenProtonDEX} of ${baseTokenProtonDEX} on ProtonDEX at price ${priceProtonDEX} and sell ${amountExchange} ${baseTokenExchange} on ${exchangeName} at price ${priceExchange}`);
                    console.log(action);

                    console.log(amountProtonDEX);               
                    console.log(amountExchange);
            
                    console.log(precisionProtonDEXAsk);
                    console.log(precisionProtonDEXBid);
                    console.log(precisionExchange);
                    
                    if (balanceProtonDEX.free[quoteTokenProtonDEX] < dollarAmount ||
                        balanceExchange.free[baseTokenExchange] < amountExchange) {
                        console.error('Insufficient balance!');
                        sufficientBalance = false;
                        //if (enableTelegram) {bot.sendMessage(chatId, "Insufficient balance!");}
                        //console.log(sufficientBalance);
                        //process.exit(1);
                        // We can keep trying until we have sufficient balance in one direction                        
                    }
                    
                    // now buy and sell

                    if (!testMode && sufficientBalance) {
                        if (enableTelegram) {bot.sendMessage(chatId, action);}

                        // Buy on ProtonDEX
                        try {
                            const orderProtonDEX = await exchangeProtonDEX.createOrder(symbolProtonDEX, 1, 1, amountProtonDEX, priceProtonDEX, {
                                'account': process.env.PROTONDEX_ACCOUNT_2,
                                'filltype': 0,
                                'triggerprice': 0,
                            });

                            console.log('ProtonDEX buy order placed:', orderProtonDEX);
                        } catch (error) {
                            console.error('Error placing ProtonDEX order:', error);
                        }

                        // Sell on Exchange
                        try {
                            const orderExchange = await exchange.createOrder(symbolExchange, 'limit', 'sell', amountExchange, priceExchange);
                            console.log(`${exchangeName} sell order placed:`, orderExchange);
                        } catch (error) {
                            console.error(`Error placing ${exchangeName} order:`, error);
                        }

                    } else {
                        console.log('Insufficient Balalance or Test Mode enabled, no order placed.');
                    }
                }
                // If ProtonDEX price is higher, SELL on ProtonDEX and BUY on Exchange
                else {
                    // Sell on ProtonDEX
                    const amountProtonDEX = Number(new BigNumber(dollarAmount / priceProtonDEX).toFixed(precisionProtonDEXBid)); // Amount to sell on ProtonDEX
                    const amountExchange = Number((dollarAmount / priceExchange).toFixed(8)); // Amount to buy on Exchange
                    const action = (`Sell ${amountProtonDEX} ${baseTokenProtonDEX} worth ${dollarAmount.toFixed(precisionProtonDEXAsk)} ${quoteTokenProtonDEX} on ProtonDEX at price ${priceProtonDEX} and buy ${dollarAmount} ${quoteTokenExchange} worth of ${baseTokenExchange} on ${exchangeName} at price ${priceExchange}`);
                    console.log(action);

                    console.log(amountProtonDEX);               
                    console.log(amountExchange);
            
                    console.log(precisionProtonDEXAsk);
                    console.log(precisionProtonDEXBid);
                    console.log(precisionExchange);

                    if (balanceProtonDEX.free[baseTokenProtonDEX] < amountProtonDEX ||
                        balanceExchange.free[quoteTokenExchange] < dollarAmount) {
                        console.error('Insufficient balance!');
                        console.log(sufficientBalance);
                        //if (enableTelegram) {bot.sendMessage(chatId, "Insufficient balance!");}
                        //process.exit(1);
                        // We can keep trying until we have sufficient balance in one direction
                    }                    

                    if (!testMode && sufficientBalance) {
                        if (enableTelegram) { bot.sendMessage(chatId, action);};

                        try {
                            const orderProtonDEX = await exchangeProtonDEX.createOrder(symbolProtonDEX, 1, 2, amountProtonDEX, priceProtonDEX, {
                                'account': process.env.PROTONDEX_ACCOUNT_2,
                                'filltype': 0,
                                'triggerprice': 0,
                            });

                            console.log('ProtonDEX sell order placed:', orderProtonDEX);
                        } catch (error) {
                            console.error('Error placing ProtonDEX order:', error);
                        }

                        // Buy on Exchange
                        try {
                            const orderExchange = await exchange.createOrder(symbolExchange, 'limit', 'buy', amountExchange, priceExchange);
                            console.log(`${exchangeName} buy order placed:`, orderExchange);
                        } catch (error) {
                            console.error(`Error placing ${exchangeName} order:`, error);
                        }
                    } else {
                        console.log('Insufficient Balalance or Test Mode enabled, no order placed.');
                    }
                }

            } else {
                console.log('No arbitrage opportunity at the moment.');
            }
        } else {
            console.log('Unable to calculate spread percentage. Prices are missing.');
        }
    } catch (error) {
        if (error instanceof ccxt.DDoSProtection || error.message.includes('429')) {
            console.log('Rate limit exceeded, waiting for 1 minute before retrying.');
            setTimeout(fetchPricesAndPrecision, 60000, exchangeProtonDEX, exchange, symbolProtonDEX, symbolExchange);
        } else {
            console.error('Error fetching prices or placing orders:', error.message);
            process.exit(1);
        }
    }
}

// setInterval(arbTrading, 60000);
tradingPairs.forEach(pair => {
    setInterval(arbTrading, 60000, pair.symbolProtonDEX, pair.symbolExchange, exchangeName);
});
