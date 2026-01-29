// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title HabitEscrow
 * @dev 严格自律教练的核心托管合约
 *
 * 功能：
 * 1. 用户质押 ETH 创建挑战
 * 2. 选择惩罚去向（销毁/慈善/项目方）
 * 3. Agent 判定失败后执行 Slash
 * 4. 成功完成挑战获得 ETH 返还 + STRICT 代币奖励
 * 5. 紧急退出支付30%懦夫税
 * 6. 复活卡机制
 *
 * 奖励公式：reward = baseReward * (stakeAmount / minStakeAmount) * (targetDays / baseDays)
 */
contract HabitEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ========== 状态变量 ==========

    IERC20 public strictToken; // STRICT 代币合约
    address public agent; // AI Agent 地址（有权执行 slash）
    address public charityAddress; // 慈善地址
    address public constant BURN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;

    uint256 public minStakeAmount = 0.01 ether; // 最低质押金额
    uint256 public baseReward = 100 * 10 ** 18; // 基础奖励（100 STRICT，对应最低质押+7天）
    uint256 public baseDays = 7; // 基准挑战天数
    uint256 public cowardTaxRate = 30; // 懦夫税比例（30%）

    // ========== 枚举 ==========

    // 惩罚去向
    enum PenaltyType {
        Burn, // 销毁
        Charity, // 慈善
        Dev // 项目方
    }

    // 挑战状态
    enum ChallengeStatus {
        Active, // 进行中
        Completed, // 已完成
        Failed, // 已失败
        Withdrawn // 已退出
    }

    // ========== 结构体 ==========

    struct Challenge {
        uint256 stakeAmount; // 质押金额
        uint256 targetDays; // 目标天数
        uint256 completedDays; // 已完成天数
        uint256 startTime; // 开始时间
        PenaltyType penaltyType; // 惩罚去向
        ChallengeStatus status; // 挑战状态
        bool resurrectionUsed; // 复活卡是否已使用
        string habitDescription; // 习惯描述
    }

    // ========== 映射 ==========

    // 用户地址 => 挑战ID => 挑战详情
    mapping(address => mapping(uint256 => Challenge)) public challenges;
    // 用户地址 => 挑战计数
    mapping(address => uint256) public challengeCount;

    // ========== 事件 ==========

    event ChallengeCreated(
        address indexed user,
        uint256 indexed challengeId,
        uint256 stakeAmount,
        uint256 targetDays,
        PenaltyType penaltyType
    );

    event DayCompleted(
        address indexed user,
        uint256 indexed challengeId,
        uint256 completedDays
    );

    event ChallengeCompleted(
        address indexed user,
        uint256 indexed challengeId,
        uint256 reward
    );

    event Slashed(
        address indexed user,
        uint256 indexed challengeId,
        uint256 amount,
        PenaltyType penaltyType
    );

    event EmergencyWithdraw(
        address indexed user,
        uint256 indexed challengeId,
        uint256 refundAmount,
        uint256 penaltyAmount
    );

    event ResurrectionUsed(address indexed user, uint256 indexed challengeId);

    // ========== 修饰器 ==========

    modifier onlyAgent() {
        require(msg.sender == agent, "Only agent can call");
        _;
    }

    // ========== 构造函数 ==========

    /**
     * @dev 构造函数
     * @param _strictToken STRICT 代币地址
     * @param _agent AI Agent 地址
     * @param _charityAddress 慈善地址
     */
    constructor(
        address _strictToken,
        address _agent,
        address _charityAddress
    ) Ownable(msg.sender) {
        strictToken = IERC20(_strictToken);
        agent = _agent;
        charityAddress = _charityAddress;
    }

    // ========== 用户函数 ==========

    /**
     * @dev 创建挑战
     * @param _targetDays 目标天数（最少7天）
     * @param _penaltyType 惩罚去向
     * @param _habitDescription 习惯描述
     */
    function createChallenge(
        uint256 _targetDays,
        PenaltyType _penaltyType,
        string calldata _habitDescription
    ) external payable nonReentrant {
        require(msg.value >= minStakeAmount, "Stake too low");
        require(_targetDays >= baseDays, "Target days too short");

        uint256 challengeId = challengeCount[msg.sender]; // 获取当前挑战ID，也就是挑战计数

        challenges[msg.sender][challengeId] = Challenge({
            stakeAmount: msg.value,
            targetDays: _targetDays,
            completedDays: 0,
            startTime: block.timestamp,
            penaltyType: _penaltyType,
            status: ChallengeStatus.Active,
            resurrectionUsed: false,
            habitDescription: _habitDescription
        });

        challengeCount[msg.sender]++;

        emit ChallengeCreated(
            msg.sender,
            challengeId,
            msg.value,
            _targetDays,
            _penaltyType
        );
    }

    /**
     * @dev 紧急退出（支付30%懦夫税）
     * @param _challengeId 挑战ID
     */
    function emergencyWithdraw(uint256 _challengeId) external nonReentrant {
        Challenge storage challenge = challenges[msg.sender][_challengeId];
        require(
            challenge.status == ChallengeStatus.Active,
            "Challenge not active"
        );

        uint256 penalty = (challenge.stakeAmount * cowardTaxRate) / 100;
        uint256 refund = challenge.stakeAmount - penalty;

        challenge.status = ChallengeStatus.Withdrawn;

        // 退还剩余资金
        (bool success, ) = msg.sender.call{value: refund}("");
        require(success, "Refund failed");

        // 懦夫税处理（发送到销毁地址）
        (bool penaltySuccess, ) = BURN_ADDRESS.call{value: penalty}("");
        require(penaltySuccess, "Penalty transfer failed");

        emit EmergencyWithdraw(msg.sender, _challengeId, refund, penalty);
    }

    /**
     * @dev 使用复活卡
     * @param _challengeId 挑战ID
     */
    function useResurrection(uint256 _challengeId) external nonReentrant {
        Challenge storage challenge = challenges[msg.sender][_challengeId];
        require(
            challenge.status == ChallengeStatus.Active,
            "Challenge not active"
        );
        require(!challenge.resurrectionUsed, "Resurrection already used");

        challenge.resurrectionUsed = true;
        challenge.completedDays = 0;
        challenge.startTime = block.timestamp;

        emit ResurrectionUsed(msg.sender, _challengeId);
    }

    /**
     * @dev 领取奖励（挑战完成后）
     * @param _challengeId 挑战ID
     */
    function claimReward(uint256 _challengeId) external nonReentrant {
        Challenge storage challenge = challenges[msg.sender][_challengeId];
        require(
            challenge.status == ChallengeStatus.Completed,
            "Challenge not completed"
        );

        // 计算奖励: baseReward * (stakeAmount / minStake) * (targetDays / baseDays)
        uint256 reward = (baseReward *
            challenge.stakeAmount *
            challenge.targetDays) / (minStakeAmount * baseDays);

        // 检查奖励池余额
        uint256 tokenBalance = strictToken.balanceOf(address(this));
        if (reward > tokenBalance) {
            reward = tokenBalance;
        }

        // 返还 ETH 本金
        (bool success, ) = msg.sender.call{value: challenge.stakeAmount}("");
        require(success, "ETH refund failed");

        // 发放 STRICT 代币奖励
        if (reward > 0) {
            strictToken.safeTransfer(msg.sender, reward);
        }

        // 重置质押金额防止重复领取
        challenge.stakeAmount = 0;

        emit ChallengeCompleted(msg.sender, _challengeId, reward);
    }

    // ========== Agent 函数 ==========

    /**
     * @dev 记录每日完成（Agent 调用）
     * @param _user 用户地址
     * @param _challengeId 挑战ID
     */
    function recordDayComplete(
        address _user,
        uint256 _challengeId
    ) external onlyAgent {
        Challenge storage challenge = challenges[_user][_challengeId];
        require(
            challenge.status == ChallengeStatus.Active,
            "Challenge not active"
        );

        challenge.completedDays++;

        emit DayCompleted(_user, _challengeId, challenge.completedDays);

        // 检查是否完成挑战
        if (challenge.completedDays >= challenge.targetDays) {
            challenge.status = ChallengeStatus.Completed;
        }
    }

    /**
     * @dev 执行惩罚（Agent 调用）
     * @param _user 用户地址
     * @param _challengeId 挑战ID
     */
    function slash(
        address _user,
        uint256 _challengeId
    ) external onlyAgent nonReentrant {
        Challenge storage challenge = challenges[_user][_challengeId];
        require(
            challenge.status == ChallengeStatus.Active,
            "Challenge not active"
        );

        uint256 slashAmount = challenge.stakeAmount;
        challenge.status = ChallengeStatus.Failed;
        challenge.stakeAmount = 0;

        // 根据惩罚类型处理资金
        address recipient;
        if (challenge.penaltyType == PenaltyType.Burn) {
            recipient = BURN_ADDRESS;
        } else if (challenge.penaltyType == PenaltyType.Charity) {
            recipient = charityAddress;
        } else {
            recipient = owner();
        }

        (bool success, ) = recipient.call{value: slashAmount}("");
        require(success, "Slash transfer failed");

        emit Slashed(_user, _challengeId, slashAmount, challenge.penaltyType);
    }

    // ========== 管理函数 ==========

    /**
     * @dev 更新 Agent 地址
     */
    function setAgent(address _agent) external onlyOwner {
        agent = _agent;
    }

    /**
     * @dev 更新慈善地址
     */
    function setCharityAddress(address _charityAddress) external onlyOwner {
        charityAddress = _charityAddress;
    }

    /**
     * @dev 更新最低质押金额
     */
    function setMinStakeAmount(uint256 _minStakeAmount) external onlyOwner {
        minStakeAmount = _minStakeAmount;
    }

    /**
     * @dev 更新基础奖励
     */
    function setBaseReward(uint256 _baseReward) external onlyOwner {
        baseReward = _baseReward;
    }

    /**
     * @dev 更新基准天数
     */
    function setBaseDays(uint256 _baseDays) external onlyOwner {
        require(_baseDays > 0, "Base days must be > 0");
        baseDays = _baseDays;
    }

    /**
     * @dev 更新懦夫税比例
     */
    function setCowardTaxRate(uint256 _rate) external onlyOwner {
        require(_rate <= 100, "Rate cannot exceed 100%");
        cowardTaxRate = _rate;
    }

    // ========== 查询函数 ==========

    /**
     * @dev 获取挑战详情
     */
    function getChallenge(
        address _user,
        uint256 _challengeId
    ) external view returns (Challenge memory) {
        return challenges[_user][_challengeId];
    }

    /**
     * @dev 获取奖励池余额
     */
    function getRewardPoolBalance() external view returns (uint256) {
        return strictToken.balanceOf(address(this));
    }

    /**
     * @dev 计算预估奖励
     * @param _stakeAmount 质押金额
     * @param _targetDays 目标天数
     */
    function calculateReward(
        uint256 _stakeAmount,
        uint256 _targetDays
    ) external view returns (uint256) {
        return
            (baseReward * _stakeAmount * _targetDays) /
            (minStakeAmount * baseDays);
    }

    // ========== 接收 ETH ==========

    receive() external payable {}
}
