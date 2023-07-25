# ccxt-xpr-examples
example scripts for protondex ccxt integration 

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

To run the scripts, you will need to replace placeholder values in the scripts with your own data. For example, you will need to replace 'PVT_K1_' and 'trading.paul' with your actual XPR Private key and account name. You also need to replace the symbol, amount, and price variables with the actual values you want to use.

After replacing the placeholder values, you can run a script by navigating to the directory containing the script in your terminal and running the following command:

```shell
node createOrder.js
```

Replace createOrder.js with the name of the script you want to run.

## Errors and Troubleshooting

If you run into any issues while running the scripts, make sure you have the latest version of the CCXT-XPR library installed. You can update CCXT-XPR by running ```npm update ccxt-xpr in your terminal.

Also, remember that not all exchanges support all features, so make sure to check the specific exchange's documentation for any exchange-specific details.


## Contributing

If you'd like to contribute to this repository, please open an issue or submit a pull request.
