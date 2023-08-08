// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract AucEngine {
    address public owner; // platform owner
    uint constant DURATION = 2 days; 
    uint constant FEE = 10; //owner's fee

    struct Auction {
        address payable seller;
        uint startingPrice; //start(max) price
        uint finalPrice; //шmplementation cost
        uint startAt;
        uint endsAt;
        uint discountRate;
        string item; //description of the item
        bool stopped; // stopped/not
    }

    Auction[] public auctions;

    event AuctionCreated(uint index, string itemName, uint startingPrice, uint duration);
    event AuctionEnded(uint index, uint finalPrice, address winner);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner(address _to) { 
        require(msg.sender == owner, "you are not an owner!");
        _;
    }

    function withdraw(address payable _to) external onlyOwner(_to) {
        _to.transfer(address(this).balance);
    }

    function createAuction(uint _startingPrice, uint _discountRate, string calldata _item, uint _duration) external {

        uint duration = _duration == 0 ? DURATION : _duration; 

        require(_startingPrice >= _discountRate * duration, "incorrect starting price!");  //To prevent the price from going into the negative
        Auction memory newAuction = Auction({
            seller: payable(msg.sender),
            startingPrice: _startingPrice,
            finalPrice: _startingPrice, //going to calculate separately in another function.
            discountRate: _discountRate,
            startAt: block.timestamp, // now
            endsAt: block.timestamp + duration,
            item: _item,
            stopped: false
        });

        auctions.push(newAuction); 

        emit AuctionCreated(auctions.length - 1, _item, _startingPrice, duration);
    }

    function getPriceFor(uint index) public view returns(uint) {
        Auction memory cAuction = auctions[index];
        require(!cAuction.stopped, "stopped!");
        uint elapsed = block.timestamp - cAuction.startAt;
        uint discount = cAuction.discountRate * elapsed;
        return cAuction.startingPrice - discount;
    }

    function buy(uint index) external payable {
        Auction storage cAuction = auctions[index];  //storage for saving the modified results
        require(!cAuction.stopped, "stopped!");
        require(block.timestamp < cAuction.endsAt, "ended!");
        uint cPrice = getPriceFor(index);
        require(msg.value >= cPrice, "not enought funds!");
        cAuction.stopped = true;
        cAuction.finalPrice = cPrice;
        uint refund = msg.value - cPrice; // Since the price at a Dutch auction decreases with every passing moment, 
        //it is necessary to account for refunds if a user bids more.
        if(refund > 0) {
            payable(msg.sender).transfer(refund);
        }

        cAuction.seller.transfer(
            cPrice - ((cPrice * FEE) / 100)
        ); //multiply first, then - devide

        emit AuctionEnded(index, cPrice, msg.sender);
    }
}