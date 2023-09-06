require('dotenv').config();

const ccxt = require('ccxt-xpr');
const { Client, GatewayIntentBits } = require('discord.js');
const TelegramBot = require('node-telegram-bot-api');
const fetchExchanges = require('./src/fetchExchanges.js');
const fetchPricesAndPrecision = require('./src/fetchPrices.js');
const exchangeSymbols = require('./src/exchangeSymbols.js');

const enableDiscord = true; // if true will send to discord bot when arb trade happens
const enableTelegram = true; // if true will send to telegram bot when arb trade happens

const arbitrageThreshold = 3;

// Exchanges and trading pairs
const exchangesAndPairs = [
    {
        exchangeName: 'Kucoin',
        tradingPairs: [
            { symbolProtonDEX: 'XPR_XMD', symbolExchange: 'XPR/USDT' },
            { symbolProtonDEX: 'XBTC_XMD', symbolExchange: 'BTC/USDT' },
            { symbolProtonDEX: 'XLTC_XMD', symbolExchange: 'LTC/USDT' },
            { symbolProtonDEX: 'XETH_XMD', symbolExchange: 'ETH/USDT' },
            { symbolProtonDEX: 'XDOGE_XMD', symbolExchange: 'DOGE/USDT' },
            { symbolProtonDEX: 'XHBAR_XMD', symbolExchange: 'HBAR/USDT' },
            // Add other trading pairs for Kucoin
        ],
    },
    {
        exchangeName: 'Gateio',
        tradingPairs: [
            { symbolProtonDEX: 'XPR_XMD', symbolExchange: 'XPR/USDT' },
            { symbolProtonDEX: 'XBTC_XMD', symbolExchange: 'BTC/USDT' },
            { symbolProtonDEX: 'XLTC_XMD', symbolExchange: 'LTC/USDT' },
            { symbolProtonDEX: 'XETH_XMD', symbolExchange: 'ETH/USDT' },
            { symbolProtonDEX: 'XDOGE_XMD', symbolExchange: 'DOGE/USDT' },
            { symbolProtonDEX: 'XHBAR_XMD', symbolExchange: 'HBAR/USDT' },            
            { symbolProtonDEX: 'METAL_XMD', symbolExchange: 'METAL/USDT' },
            // Add other trading pairs for Gate
        ],
    },
    {
        exchangeName: 'MEXC',
        tradingPairs: [
            { symbolProtonDEX: 'XPR_XMD', symbolExchange: 'XPR/USDT' },
            { symbolProtonDEX: 'XBTC_XMD', symbolExchange: 'BTC/USDT' },
            { symbolProtonDEX: 'XLTC_XMD', symbolExchange: 'LTC/USDT' },
            { symbolProtonDEX: 'XETH_XMD', symbolExchange: 'ETH/USDT' },
            { symbolProtonDEX: 'XDOGE_XMD', symbolExchange: 'DOGE/USDT' },
            { symbolProtonDEX: 'XHBAR_XMD', symbolExchange: 'HBAR/USDT' },            
            { symbolProtonDEX: 'METAL_XMD', symbolExchange: 'METAL/USDT' },                               
            // Add other trading pairs for MEXC
        ],
    },
];

// Discord bot settings
const client = new Client({
    intents: [GatewayIntentBits.Guilds] // Update the initialization as per the upgrade guide
});
client.login(process.env.DISCORD_BOT_TOKEN);

async function sendNotification(message) {
    const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL_ID); // Replace with your channel ID
    if (channel) {
        channel.send(message);
    } else {
        console.error('Channel not found');
    }
}

// Telegram bot settings
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
const chatId = "-1001626322562";

// Arbitrage trading function
async function arbTrading(symbolProtonDEX, symbolExchange, exchangeName) {
    try {
        const symbols = exchangeSymbols(symbolProtonDEX, symbolExchange, exchangeName);
        const { baseTokenProtonDEX, baseTokenExchange, quoteTokenProtonDEX, quoteTokenExchange } = symbols;
        const { exchangeProtonDEX, exchange } = await fetchExchanges(exchangeName); // Pass exchangeName

        if (!exchange) {
            console.log(`Skipping ${exchangeName}, as it's not recognized or available.`);
            return;
        }

        const { priceProtonDEX, priceExchange } = 
            await fetchPricesAndPrecision(exchangeProtonDEX, exchange, symbolProtonDEX, symbolExchange, baseTokenProtonDEX, baseTokenExchange, quoteTokenProtonDEX, quoteTokenExchange);

        console.log('ProtonDEX Price for:', symbolProtonDEX,' $', priceProtonDEX);
        console.log(`${exchangeName} Price for :`, symbolExchange,' $', priceExchange);

        if (priceProtonDEX && priceExchange) {
            const spreadPercentage = Math.abs(((priceExchange - priceProtonDEX) / priceProtonDEX) * 100);
            console.log('Spread Percentage:', spreadPercentage.toFixed(2) + '%');

            if (spreadPercentage > arbitrageThreshold) {
                console.log('Arbitrage opportunity detected!');
                let action = '';

                if (priceExchange > priceProtonDEX) {
                    action = (`🚨 ${exchangeName} ${spreadPercentage.toFixed(2)}% Arbitrage Opportunity! \n📈 Buy ${baseTokenProtonDEX} on ProtonDEX at price ${priceProtonDEX} 💰 \n📉 Sell ${baseTokenExchange} on ${exchangeName} at price ${priceExchange}\n\nUnderstand the risks before trading.`);
                } else {
                    action = (`🚨 ${exchangeName} ${spreadPercentage.toFixed(2)}% Arbitrage Opportunity! \n📉 Sell ${baseTokenProtonDEX} on ProtonDEX at price ${priceProtonDEX} 💰 \n📈 Buy ${baseTokenExchange} on ${exchangeName} at price ${priceExchange}\n\nUnderstand the risks before trading.`);
                }
                console.log(action);

                if (enableTelegram) {bot.sendMessage(chatId, action);}
                if (enableDiscord) {sendNotification(action);}
            } else {
                console.log('No arbitrage opportunity at the moment.');
            }
        } else {
            console.log('Unable to calculate spread percentage. Prices are missing.');
        }
    } catch (error) {
        console.error(`Error with ${exchangeName}: ${error.message}`);
    }
    
}


exchangesAndPairs.forEach(exchangeAndPairs => {
    const exchangeName = exchangeAndPairs.exchangeName;
    exchangeAndPairs.tradingPairs.forEach(pair => {
        setInterval(arbTrading, 120000, pair.symbolProtonDEX, pair.symbolExchange, exchangeName);
    });
});
