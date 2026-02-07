const { ethers } = require("hardhat");

async function main() {
  const IMPROVER_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
  
  const [signer] = await ethers.getSigners();
  const improver = await ethers.getContractAt("UrbanImprover", IMPROVER_ADDRESS);

  console.log("Creating campaign...");
  const createTx = await improver.createCampaign("Clean Park", 10, 7);
  await createTx.wait();

  console.log("Contributing 1 ETH...");
  const contributeTx = await improver.contribute(1, { value: ethers.parseEther("1.0") });
  await contributeTx.wait();

  console.log("Done! Now run check.js again.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});