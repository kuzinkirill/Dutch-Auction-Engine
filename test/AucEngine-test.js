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

  //хочу получить информацию о блоке по его номеру
  async function getTimestamp(bn) {
    return (
      await ethers.provider.getBlock(bn) //provider - спец объект Ethers.js, с помощью которого фактически мы подключаемся к конкретному блокчейну
    ).timestamp //нас интересует метка времени
  }

  //проверка, корректно ли создался аукцион
  describe("createAuction", function () {
    it("creates auction correctly", async function() {
      const duration = 60
      const tx = await auct.createAuction(
        ethers.utils.parseEther("0.0001"), //parseEther - встроенная утилита, принимает значение ETH и конвертирует в Wei
        3,
        "fake item",
        duration
      )

      //Вытащим информацию о текущем аукционе из блокчейна
      const cAuction = await auct.auctions(0) // Если в командной строке выскакивает Promise и ошибка, ставим await
      expect(cAuction.item).to.eq("fake item")
      const ts = await getTimestamp(tx.blockNumber)
      expect(cAuction.endsAt).to.eq(ts + duration)
    })
  })

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  //проверка работы функции buy
  describe("buy", function () {
    it("allows to buy", async function() {
      await auct.connect(seller).createAuction(
        ethers.utils.parseEther("0.0001"),
        3,
        "fake item",
        60 //пререквизиты
      )

      this.timeout(5000) // 5s
      //таймаут нужен, чтобы mocha не вылетела слишком рано, сообщив об ошибке таймаута
      //таймаут говорит о том, что тест может работать до 5 секунд; если больше - тест вылетт
      await delay(1000) //хочу ждать 1 секунду прежде, чем приступать к выполнению теста

      //инициализируем вызов контракта аккаунтом buyer
      //по умолчанию бы вызвал от первого аккаунта (владельца)
      const buyTx = await auct.connect(buyer). 
        buy(0, {value: ethers.utils.parseEther("0.0001")})

      const cAuction = await auct.auctions(0)
      const finalPrice = cAuction.finalPrice
      await expect(() => buyTx).
        to.changeEtherBalance(
          seller, finalPrice - Math.floor((finalPrice * 10) / 100)
        ) //changeEtherBalance - проверка, доступная благодаря установке Waffle
        
      await expect(buyTx)
        .to.emit(auct, 'AuctionEnded')
        .withArgs(0, finalPrice, buyer.address)

      await expect(
        auct.connect(buyer).
          buy(0, {value: ethers.utils.parseEther("0.0001")})
      ).to.be.revertedWith('stopped!')

    })
  })
})