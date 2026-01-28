# Strict-Habit-Coach
AI Agent 监督你的自律：要么完成任务，要么质押代币被 Slash。由 LLM 判定贡献质量，Kite AI 驱动支付闭环。
# ⚖️ Strict Habit Coach (严格自律教练)

> **"要么自律，要么破产。"** —— 这是一个基于 Web3 AI Agent 的硬核习惯监督系统。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build: Web3-AI](https://img.shields.io/badge/Build-Kite%20AI-blue)](https://kite.ai)

---

## 📖 项目愿景
本项目旨在通过 **AI 裁判** 的无情审计与 **智能合约** 的强制执行，彻底解决个人自律难题。用户质押代币，AI 监控产出，敷衍即惩罚。自律获得Strict代币奖励。

---

## 🛠️ 技术层级架构

### 1. 智能合约层 (`/contracts`)
* **核心合约**: `HabitEscrow.sol`
* **逻辑**: 负责资金质押 (`deposit`) 与受权惩罚 (`slash`)。
* **惩罚去向**: 资金将被发送至 `0x00...dEaD` 地址进行彻底销毁。

### 2. AI Agent 逻辑层，Java后台 (`/agent`)


### 3. 前端交互层 (`/frontend`)
* **核心组件**: `Dashboard.tsx`
* **功能**: 连接钱包、展示质押余额、以及实时滚动 AI 的毒舌评价。

---

## 🧪 核心判罚逻辑 (The Loop)



1. **质押阶段**: 用户通过前端存入 0.1 ETH 作为自律保证金。
2. **审计阶段**: 
3. **裁决阶段**: 
4. **惩罚阶段**: Agent 触发合约 `slash` 函数，扣除 0.01 ETH 并销毁。

---

## 🚀 快速启动

1. **克隆项目**:
   ```bash
   git clone [https://github.com/ggus39/Strict-Habit-Coach.git](https://github.com/ggus39/Strict-Habit-Coach.git)
   ```
