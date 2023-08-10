const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("AucEngine", function () { 
  let owner  
  let seller
  let buyer
  let auct

  beforeEach(async function () {
    [owner, seller, buyer] = await ethers.getSigners()

    const AucEngine = await ethers.getContractFactory("AucEngine", owner)
    auct = await AucEngine.deploy()
    await auct.deployed()
  })

//is the owner corrected
  it("sets owner", async function() {
    const currentOwner = await auct.owner()
    console.log(currentOwner)
    expect(currentOwner).to.eq(owner.address)
  })

  
  //want to retrieve information about a block using its number
  async function getTimestamp(bn) {
    return (
      await ethers.provider.getBlock(bn) //is a specialized Ethers.js object that allows us to connect to a specific blockchain
    ).timestamp 
  }

  //Checking whether the auction has been created correctly.
  describe("createAuction", function () {
    it("creates auction correctly", async function() {
      const duration = 60
      const tx = await auct.createAuction(
        ethers.utils.parseEther("0.0001"), //parseEther is a built-in utility that takes an ETH value and converts it to Wei.
        3,
        "fake item",
        duration
      )

      //retrieve information about the current auction from the blockchain
      const cAuction = await auct.auctions(0) 
      expect(cAuction.item).to.eq("fake item")
      const ts = await getTimestamp(tx.blockNumber)
      expect(cAuction.endsAt).to.eq(ts + duration)
    })
  })

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  //testing buy-function
  describe("buy", function () {
    it("allows to buy", async function() {
      await auct.connect(seller).createAuction(
        ethers.utils.parseEther("0.0001"),
        3,
        "fake item",
        60 //prerequisites
      )

      this.timeout(5000) // 5s
      //The timeout is needed to prevent Mocha from failing too early and reporting a timeout error.
      //The timeout indicates that the test can run for up to 5 seconds; if it takes longer, the test will fail.
      await delay(1000) //I want to wait for 1 second before starting the test execution

      //initialize the contract call with the buyer account
      //By default, it would be called from the first account (owner)
      const buyTx = await auct.connect(buyer). 
        buy(0, {value: ethers.utils.parseEther("0.0001")})

      const cAuction = await auct.auctions(0)
      const finalPrice = cAuction.finalPrice
      await expect(() => buyTx).
        to.changeEtherBalance(
          seller, finalPrice - Math.floor((finalPrice * 10) / 100)
        ) //changeEtherBalance - checking with Waffle
        
      await expect(buyTx)
        .to.emit(auct, 'AuctionEnded')
        .withArgs(0, finalPrice, buyer.address)

      await expect(
        auct.connect(buyer).
          buy(0, {value: ethers.utils.parseEther("0.0001")})
      ).to.be.revertedWith('stopped!')  
    })
  })

  describe("only owner is able to withdraw", function () {
    it("should allow owner to withdraw funds", async function () {
      const initialBalance = await ethers.provider.getBalance(owner.address);
  
      await auct.connect(seller).createAuction(
        ethers.utils.parseEther("0.1"),
        2,
        "Test Item",
        60
      );
  
      await auct.connect(buyer).buy(0, { value: ethers.utils.parseEther("0.1") });
  
      await auct.connect(owner).withdraw(owner.address);
  
      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.above(initialBalance);
    });

    it("should not allow non-owner to withdraw funds", async function () {
      await expect(auct.connect(buyer).withdraw(buyer.address)).to.be.revertedWith("you are not an owner!");
    });
  })
})