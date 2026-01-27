# 实施计划 - 严格自律教练 (Strict Habit Coach)

## 目标描述

构建一个“严格自律教练” Web3 Agent。 **核心哲学**：**Money is Justice (金钱即正义)**。 你押的 ETH 越多，证明你越认真，系统给你的 `StrictToken` 奖励就越多。 挑战失败则扣除质押的 ETH；挑战成功则全额拿回 ETH + `StrictToken` 奖励。支持随时“认怂”退出，但需支付罚金。

**复活卡 (Resurrection Card)**:

- **机制**: 每个挑战只有 **1 次** 机会。
- **触发条件**: 当 AI 判定任务失败，尚未 Slash（或 Slash 挂起期）时。
- **效果**: 用户点击 "Resurrection"，**不扣除任何 ETH**，挑战进度重置（Restart）。

## 游戏规则 (Game Mechanics)

1. **质押即态度 (Staking)**:
   - 用户创建挑战时必须质押 ETH。
   - **奖励公式**: `Reward = BaseReward * (StakeAmount / StandardStake) * DifficultyMultiplier`。
   - *意思*: 质押金额直接决定挖矿效率。
2. **胜负判定 (Victory/Defeat)**:
   - **成功**: Agent 验证通过 -> Mint `StrictToken` 给用户 -> ETH 本金安全保留。
   - **失败**: Agent 验证不通过 -> 扣除（Slash）当前挑战周期的 ETH 质押金。
3. **惩罚去向 (User Choice Slashing)**: 用户在开始挑战前选择：若我失败，我的钱去哪？
   - A. **销毁 (Burn)**: 发送到黑洞地址，为通缩做贡献。
   - B. **慈善 (Charity)**: 发送到公开募捐地址。
   - C. **项目方 (Support Dev)**: 发送到开发者钱包。
4. **随时退出 (Rage Quit)**:
   - 用户可以随时调用 `emergencyWithdraw()` 终止挑战并取回资金。
   - **代价**: 扣除本金的 **30%** 作为“懦夫税” (Coward Tax)，这部分资金直接进入奖池或销毁。



**👉 用户完成目标 = 全额取回 + 奖励代币，抵押的ETH越多，获得的奖励代币就越多**

👉 **你押的ETH越多，说明你越认真；你越认真，系统给你的认可就越多（项目方会奖励 strict 代币）。**

👉 **随时可退出，但立刻 固定比例罚没（比如 30%）**

👉**每个挑战都质押ETH，只有完成和未完成，挑战失败则质押的代币扣除。**

👉**惩罚机制有三个，要么销毁要么慈善，要么发给项目发，给用户选择三个选择**

# 实施计划 - 严格自律教练 (Strict Habit Coach)

## 目标描述

构建一个“严格自律教练” Web3 Agent，利用 **AI** 验证用户习惯（例如 GitHub 提交），并利用 **区块链支付** (Kite AI) 对失败进行惩罚。目标是创建一个有趣、高风险的习惯追踪器，贯彻“金钱即正义”。