/**
 * @title Strict Habit Coach - 核心资金合约
 * @notice 本合约实现了“严格自律教练”项目的质押与惩罚机制。
 * @dev 逻辑流程：
 * 1. 用户调用 deposit() 质押代币。
 * 2. AI Agent 监控外部数据（如 GitHub），若判定不合格则调用 slash()。
 * 3. slash() 函数将资金划转至慈善地址或直接销毁。
 * 4. 任务完成后，用户可调用 withdraw() 取回剩余资金。
 */
