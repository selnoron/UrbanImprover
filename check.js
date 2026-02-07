const { ethers } = require("hardhat");

async function main() {
  const TOKEN_ADDRESS = "0x0165878A594ca255338adfa4d48449f69242Eb8F"; 
  const USER_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const token = await ethers.getContractAt("UrbanToken", TOKEN_ADDRESS);
  const balance = await token.balanceOf(USER_ADDRESS);

  console.log(`Address: ${USER_ADDRESS}`);
  console.log(`Balance: ${ethers.formatEther(balance)} URB`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});