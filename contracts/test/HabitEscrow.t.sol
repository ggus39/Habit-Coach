// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {StrictToken} from "../src/StrictToken.sol";
import {HabitEscrow} from "../src/HabitEscrow.sol";

/**
 * @title HabitEscrowTest
 * @dev Comprehensive test suite for HabitEscrow contract
 */
contract HabitEscrowTest is Test {
    // ========== Contract Instances ==========
    StrictToken public token;
    HabitEscrow public escrow;

    // ========== Test Accounts ==========
    address public owner = address(this);
    address public agent = address(0xABCD);
    address public charity = address(0xC0FFEE);
    address public user1 = address(0x1);
    address public user2 = address(0x2);

    // ========== Constants ==========
    uint256 public constant MIN_STAKE = 0.01 ether;
    uint256 public constant BASE_DAYS = 7;

    // ========== Setup ==========
    function setUp() public {
        // Deploy StrictToken
        token = new StrictToken();

        // Deploy HabitEscrow
        escrow = new HabitEscrow(address(token), agent, charity);

        // Transfer tokens to escrow as reward pool
        token.transfer(address(escrow), token.totalSupply());

        // Give test users some ETH
        vm.deal(user1, 10 ether);
        vm.deal(user2, 10 ether);
    }

    // Allow test contract to receive ETH (for test_Slash_Dev)
    receive() external payable {}

    // ========== StrictToken Basic Tests ==========

    function test_TokenInitialization() public view {
        assertEq(token.name(), "Strict Token");
        assertEq(token.symbol(), "STRICT");
        assertEq(token.totalSupply(), 100_000_000 * 10 ** 18);
    }

    function test_TokenTransferredToEscrow() public view {
        assertEq(token.balanceOf(address(escrow)), 100_000_000 * 10 ** 18);
    }

    // ========== Create Challenge Tests ==========

    function test_CreateChallenge() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            21,
            HabitEscrow.PenaltyType.Charity,
            "Daily reading 30min"
        );

        // Verify challenge creation
        HabitEscrow.Challenge memory challenge = escrow.getChallenge(user1, 0);
        assertEq(challenge.stakeAmount, 0.1 ether);
        assertEq(challenge.targetDays, 21);
        assertEq(challenge.completedDays, 0);
        assertEq(
            uint256(challenge.penaltyType),
            uint256(HabitEscrow.PenaltyType.Charity)
        );
        assertEq(
            uint256(challenge.status),
            uint256(HabitEscrow.ChallengeStatus.Active)
        );
        assertFalse(challenge.resurrectionUsed);
    }

    function test_CreateChallenge_EmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit HabitEscrow.ChallengeCreated(
            user1,
            0,
            0.1 ether,
            21,
            HabitEscrow.PenaltyType.Charity
        );

        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            21,
            HabitEscrow.PenaltyType.Charity,
            "Daily reading 30min"
        );
    }

    function test_CreateChallenge_RevertIfStakeTooLow() public {
        vm.prank(user1);
        vm.expectRevert("Stake too low");
        escrow.createChallenge{value: 0.001 ether}(
            21,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );
    }

    function test_CreateChallenge_RevertIfDaysTooShort() public {
        vm.prank(user1);
        vm.expectRevert("Target days too short");
        escrow.createChallenge{value: 0.1 ether}(
            3,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );
    }

    function test_CreateMultipleChallenges() public {
        vm.startPrank(user1);

        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Burn,
            "Challenge 1"
        );
        escrow.createChallenge{value: 0.2 ether}(
            14,
            HabitEscrow.PenaltyType.Charity,
            "Challenge 2"
        );
        escrow.createChallenge{value: 0.3 ether}(
            21,
            HabitEscrow.PenaltyType.Dev,
            "Challenge 3"
        );

        vm.stopPrank();

        assertEq(escrow.challengeCount(user1), 3);
    }

    // ========== Record Day Complete Tests ==========

    function test_RecordDayComplete() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );

        vm.prank(agent);
        escrow.recordDayComplete(user1, 0);

        HabitEscrow.Challenge memory challenge = escrow.getChallenge(user1, 0);
        assertEq(challenge.completedDays, 1);
    }

    function test_RecordDayComplete_RevertIfNotAgent() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );

        vm.prank(user1);
        vm.expectRevert("Only agent can call");
        escrow.recordDayComplete(user1, 0);
    }

    function test_RecordDayComplete_CompletesChallenge() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );

        vm.startPrank(agent);
        for (uint256 i = 0; i < 7; i++) {
            escrow.recordDayComplete(user1, 0);
        }
        vm.stopPrank();

        HabitEscrow.Challenge memory challenge = escrow.getChallenge(user1, 0);
        assertEq(challenge.completedDays, 7);
        assertEq(
            uint256(challenge.status),
            uint256(HabitEscrow.ChallengeStatus.Completed)
        );
    }

    // ========== Claim Reward Tests ==========

    function test_ClaimReward() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );

        vm.startPrank(agent);
        for (uint256 i = 0; i < 7; i++) {
            escrow.recordDayComplete(user1, 0);
        }
        vm.stopPrank();

        uint256 ethBefore = user1.balance;
        uint256 tokenBefore = token.balanceOf(user1);

        vm.prank(user1);
        escrow.claimReward(0);

        assertEq(user1.balance, ethBefore + 0.1 ether);
        assertGt(token.balanceOf(user1), tokenBefore);
    }

    function test_ClaimReward_RevertIfNotCompleted() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );

        vm.prank(user1);
        vm.expectRevert("Challenge not completed");
        escrow.claimReward(0);
    }

    function test_ClaimReward_CalculationIsCorrect() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            14,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );

        vm.startPrank(agent);
        for (uint256 i = 0; i < 14; i++) {
            escrow.recordDayComplete(user1, 0);
        }
        vm.stopPrank();

        uint256 expectedReward = escrow.calculateReward(0.1 ether, 14);

        vm.prank(user1);
        escrow.claimReward(0);

        assertEq(token.balanceOf(user1), expectedReward);
    }

    // ========== Slash Tests ==========

    function test_Slash_Burn() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Burn,
            "Test"
        );

        uint256 burnAddressBalanceBefore = escrow.BURN_ADDRESS().balance;

        vm.prank(agent);
        escrow.slash(user1, 0);

        HabitEscrow.Challenge memory challenge = escrow.getChallenge(user1, 0);
        assertEq(
            uint256(challenge.status),
            uint256(HabitEscrow.ChallengeStatus.Failed)
        );
        assertEq(challenge.stakeAmount, 0);
        assertEq(
            escrow.BURN_ADDRESS().balance,
            burnAddressBalanceBefore + 0.1 ether
        );
    }

    function test_Slash_Charity() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );

        uint256 charityBalanceBefore = charity.balance;

        vm.prank(agent);
        escrow.slash(user1, 0);

        assertEq(charity.balance, charityBalanceBefore + 0.1 ether);
    }

    function test_Slash_Dev() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Dev,
            "Test"
        );

        uint256 ownerBalanceBefore = owner.balance;

        vm.prank(agent);
        escrow.slash(user1, 0);

        assertEq(owner.balance, ownerBalanceBefore + 0.1 ether);
    }

    function test_Slash_RevertIfNotAgent() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );

        vm.prank(user1);
        vm.expectRevert("Only agent can call");
        escrow.slash(user1, 0);
    }

    // ========== Emergency Withdraw Tests ==========

    function test_EmergencyWithdraw() public {
        vm.prank(user1);
        escrow.createChallenge{value: 1 ether}(
            7,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );

        uint256 balanceBefore = user1.balance;

        vm.prank(user1);
        escrow.emergencyWithdraw(0);

        uint256 expectedRefund = 0.7 ether;
        assertEq(user1.balance, balanceBefore + expectedRefund);

        HabitEscrow.Challenge memory challenge = escrow.getChallenge(user1, 0);
        assertEq(
            uint256(challenge.status),
            uint256(HabitEscrow.ChallengeStatus.Withdrawn)
        );
    }

    function test_EmergencyWithdraw_RevertIfNotActive() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );

        vm.prank(user1);
        escrow.emergencyWithdraw(0);

        vm.prank(user1);
        vm.expectRevert("Challenge not active");
        escrow.emergencyWithdraw(0);
    }

    // ========== Resurrection Tests ==========

    function test_UseResurrection() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );

        vm.startPrank(agent);
        escrow.recordDayComplete(user1, 0);
        escrow.recordDayComplete(user1, 0);
        vm.stopPrank();

        vm.prank(user1);
        escrow.useResurrection(0);

        HabitEscrow.Challenge memory challenge = escrow.getChallenge(user1, 0);
        assertEq(challenge.completedDays, 0);
        assertTrue(challenge.resurrectionUsed);
    }

    function test_UseResurrection_RevertIfAlreadyUsed() public {
        vm.prank(user1);
        escrow.createChallenge{value: 0.1 ether}(
            7,
            HabitEscrow.PenaltyType.Charity,
            "Test"
        );

        vm.prank(user1);
        escrow.useResurrection(0);

        vm.prank(user1);
        vm.expectRevert("Resurrection already used");
        escrow.useResurrection(0);
    }

    // ========== Admin Functions Tests ==========

    function test_SetAgent() public {
        address newAgent = address(0x999);
        escrow.setAgent(newAgent);
        assertEq(escrow.agent(), newAgent);
    }

    function test_SetCharityAddress() public {
        address newCharity = address(0x888);
        escrow.setCharityAddress(newCharity);
        assertEq(escrow.charityAddress(), newCharity);
    }

    function test_SetMinStakeAmount() public {
        escrow.setMinStakeAmount(0.05 ether);
        assertEq(escrow.minStakeAmount(), 0.05 ether);
    }

    function test_SetBaseReward() public {
        escrow.setBaseReward(200 * 10 ** 18);
        assertEq(escrow.baseReward(), 200 * 10 ** 18);
    }

    function test_SetBaseDays() public {
        escrow.setBaseDays(14);
        assertEq(escrow.baseDays(), 14);
    }

    function test_SetCowardTaxRate() public {
        escrow.setCowardTaxRate(50);
        assertEq(escrow.cowardTaxRate(), 50);
    }

    function test_SetBaseDays_RevertIfZero() public {
        vm.expectRevert("Base days must be > 0");
        escrow.setBaseDays(0);
    }

    function test_SetCowardTaxRate_RevertIfOver100() public {
        vm.expectRevert("Rate cannot exceed 100%");
        escrow.setCowardTaxRate(101);
    }

    // ========== Query Functions Tests ==========

    function test_GetRewardPoolBalance() public view {
        assertEq(escrow.getRewardPoolBalance(), 100_000_000 * 10 ** 18);
    }

    function test_CalculateReward() public view {
        uint256 reward = escrow.calculateReward(0.1 ether, 14);
        assertEq(reward, 2000 * 10 ** 18);
    }

    // ========== Fuzz Tests ==========

    function testFuzz_CreateChallenge(
        uint256 stakeAmount,
        uint256 targetDays
    ) public {
        stakeAmount = bound(stakeAmount, MIN_STAKE, 10 ether);
        targetDays = bound(targetDays, BASE_DAYS, 365);

        vm.prank(user1);
        escrow.createChallenge{value: stakeAmount}(
            targetDays,
            HabitEscrow.PenaltyType.Charity,
            "Fuzz Test"
        );

        HabitEscrow.Challenge memory challenge = escrow.getChallenge(user1, 0);
        assertEq(challenge.stakeAmount, stakeAmount);
        assertEq(challenge.targetDays, targetDays);
    }
}
