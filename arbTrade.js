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

const symbolProtonDEX = 'XLTC_XMD';
const symbolKucoin = 'LTC/USDT';

const dollarAmount = 10; // Minimal amount in dollars at least $1.5
const arbitrageThreshold = 0.5;

// replace the values in .env with your own 
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {polling: false});
const chatId = process.env.TELEGRAM_CHAT_ID;

const symbols = exchangeSymbols(symbolProtonDEX, symbolKucoin);
const { baseTokenProtonDEX, baseTokenKucoin, quoteTokenProtonDEX, quoteTokenKucoin } = symbols;

async function arbTrading() {
    const { exchangeProtonDEX, exchangeKucoin } = await fetchExchanges();

    // Fetch prices and precision
    const { priceProtonDEX, priceKucoin, precisionProtonDEXAsk, precisionProtonDEXBid, precisionKucoin } = 
        await fetchPricesAndPrecision(exchangeProtonDEX, exchangeKucoin, symbolProtonDEX, symbolKucoin, baseTokenProtonDEX, baseTokenKucoin, quoteTokenProtonDEX, quoteTokenKucoin);

    // Fetch balances
    const { balanceProtonDEX, balanceKucoin } =
        await fetchBalances({exchangeProtonDEX, exchangeKucoin, priceProtonDEX, priceKucoin, ...symbols});

    try {
        console.log('ProtonDEX Price:', priceProtonDEX);
        console.log('Kucoin Price:', priceKucoin);

        if (priceProtonDEX && priceKucoin) {
            const spreadPercentage = Math.abs(((priceKucoin - priceProtonDEX) / priceProtonDEX) * 100);
            console.log('Spread Percentage:', spreadPercentage.toFixed(2) + '%');

            if (spreadPercentage > arbitrageThreshold) {
                console.log('Arbitrage opportunity detected!');
                const maxPrice = Math.max(priceProtonDEX, priceKucoin); // Use the higher price
                let amount = new BigNumber(dollarAmount / maxPrice).toFixed(12); // Amount in base currency
                console.log('Amount ', amount);

                const sufficientBalance = true;
                
                // If ProtonDEX price is lower, BUY on ProtonDEX and SELL on Kucoin
                if (priceKucoin > priceProtonDEX) {
                    const amountProtonDEX = Number(new BigNumber(dollarAmount).toFixed(precisionProtonDEXAsk));
                    const amountKucoin = amount.toFixed(precisionKucoin);                        
                    const action = (`Buy ${amountProtonDEX} ${quoteTokenProtonDEX} of ${baseTokenProtonDEX} on ProtonDEX at price ${priceProtonDEX} and sell ${amountKucoin} ${baseTokenKucoin} on Kucoin at price ${priceKucoin}`);
                    console.log(action);
                    
                    if (enableTelegram) {
                        bot.sendMessage(chatId, action);
                    }

                    console.log(amountProtonDEX);               
                    console.log(amountKucoin);
            
                    console.log(precisionProtonDEXAsk);
                    console.log(precisionProtonDEXBid);
                    console.log(precisionKucoin);

                    if (balanceProtonDEX.free[quoteTokenProtonDEX] < dollarAmount ||
                        balanceKucoin.free[baseTokenKucoin] < amountKucoin) {
                        console.error('Insufficient balance!');
                        sufficientBalance = false;
                        //console.log(sufficientBalance);
                        //process.exit(1);
                        // We can keep trying until we have sufficient balance in one direction
                    }
                    
                    // now buy and sell
                    if (!testMode && sufficientBalance) {
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

                        // Sell on Kucoin
                        try {
                            const orderKucoin = await exchangeKucoin.createOrder(symbolKucoin, 'limit', 'sell', amountKucoin, priceKucoin);
                            console.log('Kucoin sell order placed:', orderKucoin);
                        } catch (error) {
                            console.error('Error placing Kucoin order:', error);
                        }

                    } else {
                        console.log('Insufficient Balalance or Test Mode enabled, no order placed.');
                    }
                }
                // If ProtonDEX price is higher, SELL on ProtonDEX and BUY on Kucoin
                else {
                    // Sell on ProtonDEX
                    const amountProtonDEX = Number(new BigNumber(dollarAmount / priceProtonDEX).toFixed(precisionProtonDEXBid)); // Amount to sell on ProtonDEX
                    const amountKucoin = Number((dollarAmount / priceKucoin).toFixed(8)); // Amount to buy on Kucoin
                    const action = (`Sell ${amountProtonDEX} ${baseTokenProtonDEX} worth ${dollarAmount.toFixed(precisionProtonDEXAsk)} ${quoteTokenProtonDEX} on ProtonDEX at price ${priceProtonDEX} and buy ${dollarAmount} ${quoteTokenKucoin} worth of ${baseTokenKucoin} on Kucoin at price ${priceKucoin}`);
                    console.log(action);
                    if (enableTelegram) { bot.sendMessage(chatId, action);};

                    console.log(amountProtonDEX);               
                    console.log(amountKucoin);
            
                    console.log(precisionProtonDEXAsk);
                    console.log(precisionProtonDEXBid);
                    console.log(precisionKucoin);


                    if (balanceProtonDEX.free[baseTokenProtonDEX] < amountProtonDEX ||
                        balanceKucoin.free[quoteTokenKucoin] < dollarAmount) {
                        console.error('Insufficient balance!');
                        sufficientBalance = false;
                        console.log(sufficientBalance);
                        //process.exit(1);
                        // We can keep trying until we have sufficient balance in one direction
                    }                    

                    if (!testMode && sufficientBalance) {

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

                        // Buy on Kucoin
                        try {
                            const orderKucoin = await exchangeKucoin.createOrder(symbolKucoin, 'limit', 'buy', amountKucoin, priceKucoin);
                            console.log('Kucoin buy order placed:', orderKucoin);
                        } catch (error) {
                            console.error('Error placing Kucoin order:', error);
                        }
                    } else {
                        console.log('Test Mode enabled, no order placed. To place order change testMode to false.');
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
            setTimeout(fetchPricesAndPrecision, 60000, exchangeProtonDEX, exchangeKucoin, symbolProtonDEX, symbolKucoin);
        } else {
            console.error('Error fetching prices or placing orders:', error.message);
            process.exit(1);
        }
    }
}

setInterval(arbTrading, 60000);

