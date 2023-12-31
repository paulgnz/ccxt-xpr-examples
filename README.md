# ccxt-xpr-examples
![ccxt-xpr](https://pbs.twimg.com/media/F15fJHHaIAA-GCt?format=jpg&name=large)

Arbitrage trading bots and example scripts for protondex ccxt-xpr integration 

Get the fork of ccxt for protondex here https://www.npmjs.com/package/ccxt-xpr

# Trading Scripts using CCXT-XPR for Proton DEX

This repository contains example scripts for placing trades on Proton DEX using the CCXT-XPR library.

## Installation

Before running the scripts, you need to install the CCXT-XPR library. If you don't have Node.js and npm installed, you need to install them first. You can download Node.js and npm from [here](https://nodejs.org/).

After you have Node.js and npm installed, you can install the CCXT-XPR library by running the following command in your terminal:

```shell
npm install ccxt-xpr
```

## Running the Scripts

To run the scripts, you will need to replace placeholder values in the scripts with your own data. For example, you will need to replace 'PVT_K1_' and 'trading.paul' with your actual XPR Private key and account name in the .env.example file. Once you have entered your values save the file as .env (remove the .example)

You also need to replace the symbol, amount, and price variables with the actual values you want to use in each script.

Take a look at the .env.example file, most scripts moving forward will use this to store your api keys. Once you've renamed it to .env don't upload it to github or share it!

```code
PROTONDEX_ACCOUNT=xpraccount
PROTONDEX_API_SECRET=PVT_K1_YOURKEY
KUCOIN_API_KEY=YOUR_KEY
KUCOIN_API_SECRET=YOUR_SECRET
KUCOIN_API_PASSWORD=YOUR_PASSWORD
GATEIO_API_KEY=YOUR_KEY
GATEIO_API_SECRET=YOUR_KEY
```

After replacing the placeholder values, you can run a script by navigating to the directory containing the script in your terminal and running the following command:

```shell
node createOrder.js
```

Replace createOrder.js with the name of the script you want to run.

## Errors and Troubleshooting

If you run into any issues while running the scripts, make sure you have the latest version of the CCXT-XPR library installed. You can update CCXT-XPR by running this command in your terminal:

```shell
npm update ccxt-xpr
```

Also, remember that not all exchanges support all features, so make sure to check the specific exchange's documentation for any exchange-specific details.


## Contributing

If you'd like to contribute to this repository, please open an issue or submit a pull request.
