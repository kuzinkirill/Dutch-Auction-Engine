const hre = require("hardhat");

async function main() {
    const [signer] = await hre.ethers.getSigners()
    console.log(await signer.getBalance())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
  });
  