// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./UrbanToken.sol";

contract UrbanImprover {
    struct Campaign {
        string title;
        uint256 goal;
        uint256 deadline;
        uint256 currentAmount;
        address creator;
        bool completed;
    }

    UrbanToken public rewardToken;
    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    constructor(address _tokenAddress) {
        rewardToken = UrbanToken(_tokenAddress);
    }

    function createCampaign(string memory _title, uint256 _goal, uint256 _durationInDays) external {
        campaignCount++;
        campaigns[campaignCount] = Campaign({
            title: _title,
            goal: _goal,
            deadline: block.timestamp + (_durationInDays * 1 days),
            currentAmount: 0,
            creator: msg.sender,
            completed: false
        });
    }

    function contribute(uint256 _campaignId) external payable {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp < campaign.deadline, "Campaign ended");
        require(msg.value > 0, "Contribution must be > 0");

        campaign.currentAmount += msg.value;
        contributions[_campaignId][msg.sender] += msg.value;

        rewardToken.mint(msg.sender, msg.value);
    }

    function finalizeCampaign(uint256 _campaignId) external {
        Campaign storage campaign = campaigns[_campaignId];
        require(block.timestamp >= campaign.deadline, "Not ended yet");
        require(!campaign.completed, "Already finalized");

        campaign.completed = true;
        
        if (campaign.currentAmount >= campaign.goal) {
            payable(campaign.creator).transfer(campaign.currentAmount);
        }
    }
}