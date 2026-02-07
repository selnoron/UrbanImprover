const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("UrbanImprover & UrbanToken", function () {
  let token, crowdfunding, owner, addr1, addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const UrbanToken = await ethers.getContractFactory("UrbanToken");
    token = await UrbanToken.deploy();

    const UrbanImprover = await ethers.getContractFactory("UrbanImprover");
    crowdfunding = await UrbanImprover.deploy(await token.getAddress());

    await token.setMinter(await crowdfunding.getAddress());
  });

  describe("Campaign Management", function () {
    it("Should create a campaign successfully", async function () {
      await crowdfunding.createCampaign("Test Park", ethers.parseEther("10"), 7);
      const campaign = await crowdfunding.campaigns(1);
      expect(campaign.title).to.equal("Test Park");
    });
  });

  describe("Contributions & Rewards", function () {
    it("Should issue reward tokens (1 ETH = 1 URB)", async function () {
      await crowdfunding.createCampaign("Test Park", ethers.parseEther("10"), 7);
      await crowdfunding.connect(addr1).contribute(1, { value: ethers.parseEther("1") });
      const balance = await token.balanceOf(addr1.address);
      expect(balance).to.equal(ethers.parseEther("1"));
    });

    it("Should fail if contribution is 0 ETH", async function () {
      await crowdfunding.createCampaign("Zero Test", ethers.parseEther("10"), 7);
      await expect(
        crowdfunding.connect(addr1).contribute(1, { value: 0 })
      ).to.be.revertedWith("Contribution must be > 0");
    });
  });

  describe("Finalization & Security", function () {
    it("Should not allow contributions after deadline", async function () {
      await crowdfunding.createCampaign("Expired Test", ethers.parseEther("10"), 1);
      await time.increase(2 * 24 * 60 * 60);
      await expect(
        crowdfunding.connect(addr1).contribute(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign ended");
    });

    it("Should transfer funds to creator if goal is reached", async function () {
      const goal = ethers.parseEther("2");
      await crowdfunding.connect(addr1).createCampaign("Fund Test", goal, 1);
      await crowdfunding.connect(addr2).contribute(1, { value: goal });
      await time.increase(2 * 24 * 60 * 60);
      const initialBalance = await ethers.provider.getBalance(addr1.address);
      await crowdfunding.finalizeCampaign(1);
      const finalBalance = await ethers.provider.getBalance(addr1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should fail to finalize before deadline", async function () {
        await crowdfunding.createCampaign("Early Test", ethers.parseEther("10"), 1);
        await expect(
            crowdfunding.finalizeCampaign(1)
        ).to.be.revertedWith("Not ended yet");
    });
  });
});