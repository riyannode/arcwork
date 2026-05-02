// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/Achievement.sol";
import "../src/Invoice.sol";
import "../src/Subscription.sol";

contract DeployArcWork is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address usdc = vm.envAddress("USDC");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy Achievement
        Achievement achievement = new Achievement();
        console.log("Achievement deployed at:", address(achievement));
        
        // Deploy Invoice
        Invoice invoice = new Invoice(usdc);
        console.log("Invoice deployed at:", address(invoice));
        
        // Deploy Subscription
        Subscription subscription = new Subscription(usdc);
        console.log("Subscription deployed at:", address(subscription));
        
        vm.stopBroadcast();
    }
}
