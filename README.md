# Dutch Auction Engine

This repository contains a Solidity smart contract implementing a Dutch auction mechanism known as the "AucEngine". Dutch auctions start with a high asking price that is gradually reduced until a buyer agrees to purchase at the current price. This contract provides functionalities to create auctions, bid on auctions, and withdraw funds by the owner.

## Contract Overview
The AucEngine contract includes the following features:

Creation of new auctions with customizable parameters.
Bidding on auctions.
Auction price calculation based on a discount rate.
Owner's fee deduction upon successful auction.
Withdrawal of funds by the contract owner.

## Smart Contract Details
The AucEngine contract includes the following key functions:

createAuction: Allows the owner to create a new auction with specified parameters.

buy: Allows a bidder to place a bid on an active auction.

withdraw: Allows the owner to withdraw the contract's balance.

## Testing
This project includes comprehensive tests to ensure the functionality and integrity of the smart contract. The tests are written using Chai and Hardhat's testing utilities.

## Contributing
Feel free to contribute to this project by opening issues and pull requests. Your contributions are highly appreciated.
