// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ArcVault.sol";
import "../src/BondConfig.sol";

contract MockUSDC {
    string public name = "Mock USDC";
    string public symbol = "USDC";
    uint8 public decimals = 6;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount, "insufficient");
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "insufficient");
        require(allowance[from][msg.sender] >= amount, "allowance");
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

/// @title ArcVault audit-patch tests (H2 / H3 / H4 / L4 / M3)
contract ArcVaultTest is Test {
    MockUSDC usdc;
    BondConfig bondConfig;
    ArcVault vault;

    address owner = address(this);
    address resolver = address(0xA350);
    address client = address(0xC117);
    address jobber = address(0x70BB);
    address attacker = address(0xBADD);

    uint256 constant USDC_1 = 1_000_000;        // $1 in 6-dec USDC
    uint256 constant JOB_AMOUNT = 100 * USDC_1; // $100

    function setUp() public {
        usdc = new MockUSDC();
        bondConfig = new BondConfig();
        vault = new ArcVault(address(usdc), address(bondConfig), resolver);

        usdc.mint(client, 10_000 * USDC_1);
        usdc.mint(jobber, 10_000 * USDC_1);
    }

    // ─── helpers ─────────────────────────────────────────────────────────

    function _depositAndCreateJob(uint256 totalAmount, uint256 nMilestones) internal returns (uint256 jobId) {
        vm.startPrank(client);
        usdc.approve(address(vault), totalAmount);
        vault.deposit(totalAmount);

        uint256[] memory amts = new uint256[](nMilestones);
        uint256[] memory dls  = new uint256[](nMilestones);
        uint256 share = totalAmount / nMilestones;
        for (uint256 i; i < nMilestones; i++) {
            amts[i] = (i == nMilestones - 1) ? (totalAmount - share * (nMilestones - 1)) : share;
            dls[i]  = block.timestamp + 7 days;
        }
        jobId = vault.createJob(totalAmount, keccak256("spec"), amts, dls, block.timestamp + 30 days);
        vm.stopPrank();
    }

    function _acceptJob(uint256 jobId) internal {
        // Bond config tier 2 ($50–$300) = $5 flat
        vm.startPrank(jobber);
        usdc.approve(address(vault), 1000 * USDC_1);
        vault.acceptJob(jobId, 0, 0);
        vm.stopPrank();
    }

    // ─── H2: net payout accounting ──────────────────────────────────────

    function test_H2_releasedToJobber_isNet_notGross() public {
        uint256 jobId = _depositAndCreateJob(JOB_AMOUNT, 1);
        _acceptJob(jobId);

        vm.prank(jobber);
        vault.submitMilestone(jobId, 0, "ipfs://x");

        uint256 jobberBefore = usdc.balanceOf(jobber);
        vm.prank(client);
        vault.approveMilestone(jobId, 0);

        // platformFeeBps default = 50 (0.5%)
        uint256 fee    = (JOB_AMOUNT * 50) / 10_000;
        uint256 payout = JOB_AMOUNT - fee;

        // Job completes and returns the $5 bond too; payout itself remains net of platform fee.
        assertEq(usdc.balanceOf(jobber) - jobberBefore, payout + 5 * USDC_1, "jobber payout plus returned bond");

        (
            ,                  // id
            ,                  // client
            ,                  // jobber
            ,                  // totalAmount
            ,                  // bondAmount
            uint256 released,  // releasedToJobber
            ,                  // refundedToClient
            ,                  // milestoneCount
            ,                  // deadline
            ,                  // specHash
            ,                  // status
            ,                  // createdAt
                               // acceptedAt
        ) = vault.jobs(jobId);
        assertEq(released, payout, "H2: releasedToJobber must equal NET payout");
    }

    // ─── H3: dispute Release uses arbiter fee only (no double-fee) ─────

    function test_H3_dispute_release_singleFee() public {
        uint256 jobId = _depositAndCreateJob(JOB_AMOUNT, 1);
        _acceptJob(jobId);

        vm.prank(jobber);
        vault.submitMilestone(jobId, 0, "ipfs://x");

        // Client opens dispute
        vm.prank(client);
        vault.openDispute(jobId, 0, 1, "ipfs://reason");

        uint256 jobberBefore = usdc.balanceOf(jobber);
        uint256 ownerBefore  = usdc.balanceOf(owner);

        // Resolver awards Release → jobber wins
        vm.prank(resolver);
        vault.resolveDispute(jobId, 0, ArcVault.DisputeOutcome.Release, 0, 0);

        // arbiterFeeBps default = 500 (5%); platformFee NOT charged again.
        uint256 arbiterFee = (JOB_AMOUNT * 500) / 10_000;
        uint256 expectedPayout = JOB_AMOUNT - arbiterFee;

        // Job completes after dispute → bond ($5) also returned to jobber
        assertEq(usdc.balanceOf(jobber) - jobberBefore, expectedPayout + 5 * USDC_1, "H3: jobber gets amount - arbiterFee + bond return");
        assertEq(usdc.balanceOf(owner)  - ownerBefore,  arbiterFee,     "H3: owner gets arbiterFee only");
    }

    // ─── H4: 48h timelock on resolver/config changes ───────────────────

    function test_H4_resolver_change_requires_timelock() public {
        address newResolver = address(0xBEEF);

        vault.queueResolverChange(newResolver);
        // Immediate execute MUST revert
        vm.expectRevert(bytes("Vault: timelock not elapsed"));
        vault.executeResolverChange(newResolver);

        vm.warp(block.timestamp + vault.TIMELOCK_DELAY());
        vault.executeResolverChange(newResolver);
        assertEq(vault.resolver(), newResolver, "H4: resolver updated after timelock");
    }

    function test_H4_resolver_change_hashMustMatch() public {
        address newResolver = address(0xBEEF);
        vault.queueResolverChange(newResolver);
        vm.warp(block.timestamp + vault.TIMELOCK_DELAY());
        vm.expectRevert(bytes("Vault: hash mismatch"));
        vault.executeResolverChange(address(0xC0FFEE));
    }

    function test_H4_config_change_requires_timelock() public {
        vault.queueConfigChange(100, 600, 24 hours, 12 hours);
        vm.expectRevert(bytes("Vault: timelock not elapsed"));
        vault.executeConfigChange(100, 600, 24 hours, 12 hours);

        vm.warp(block.timestamp + vault.TIMELOCK_DELAY());
        vault.executeConfigChange(100, 600, 24 hours, 12 hours);
        assertEq(vault.platformFeeBps(), 100, "H4: config updated");
        assertEq(vault.arbiterFeeBps(),  600, "H4: arbiter fee updated");
    }

    // ─── M3: BondConfig 24h tier timelock ──────────────────────────────

    function test_M3_bond_tier_update_requires_timelock() public {
        bondConfig.queueUpdateTier(0, 0, 50e6, true, 0, 0);
        vm.expectRevert(bytes("BondConfig: timelock active"));
        bondConfig.executeUpdateTier(0, 0, 50e6, true, 0, 0);

        vm.warp(block.timestamp + bondConfig.TIER_TIMELOCK());
        bondConfig.executeUpdateTier(0, 0, 50e6, true, 0, 0);
    }

    function test_M3_bond_tier_update_hashMustMatch() public {
        bondConfig.queueUpdateTier(0, 0, 50e6, true, 0, 0);
        vm.warp(block.timestamp + bondConfig.TIER_TIMELOCK());
        // try to execute different params → must revert
        vm.expectRevert(bytes("BondConfig: hash mismatch"));
        bondConfig.executeUpdateTier(0, 0, 50e6, true, 1e6, 0);
    }

    // ─── L4: non-owner cannot bypass admin gates ───────────────────────

    function test_L4_setBondConfig_ownerOnly() public {
        vm.prank(attacker);
        vm.expectRevert(bytes("Vault: not owner"));
        vault.setBondConfig(address(0));
    }

    function test_L4_queueResolverChange_ownerOnly() public {
        vm.prank(attacker);
        vm.expectRevert(bytes("Vault: not owner"));
        vault.queueResolverChange(attacker);
    }
}
