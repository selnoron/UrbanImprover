const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Token = await hre.ethers.getContractFactory("UrbanToken");
  const token = await Token.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("UrbanToken deployed to:", tokenAddress);

  const Improver = await hre.ethers.getContractFactory("UrbanImprover");
  const improver = await Improver.deploy(tokenAddress);
  await improver.waitForDeployment();
  const improverAddress = await improver.getAddress();
  console.log("UrbanImprover deployed to:", improverAddress);

  const setMinterTx = await token.setMinter(improverAddress);
  await setMinterTx.wait();
  console.log("Minter role given to UrbanImprover");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});