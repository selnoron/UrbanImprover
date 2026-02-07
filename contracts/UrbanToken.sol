// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UrbanToken is ERC20 {
    address public minter;

    modifier onlyMinter() {
        require(msg.sender == minter, "Caller is not the minter");
        _;
    }

    constructor() ERC20("Urban Reward Token", "URB") {
        minter = msg.sender;
    }

    function mint(address to, uint256 amount) external onlyMinter {
        _mint(to, amount);
    }
    
    function setMinter(address newMinter) external onlyMinter {
        minter = newMinter;
    }
}