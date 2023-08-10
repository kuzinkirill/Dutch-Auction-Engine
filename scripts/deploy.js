const hre = require('hardhat');

async function main() {
  const AucEngine = await hre.ethers.getContractFactory('AucEngine');
  const auct = await AucEngine.deploy();

  await auct.deployed();

  console.log('AucEngine deployed to:', auct.address);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
