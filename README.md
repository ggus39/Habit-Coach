# Strict-Habit-Coach
AI Agent 监督你的自律：要么完成任务，要么质押代币被 Slash。由 **DeepSeek V3** 判定内容质量，**AI Agent** 驱动链上支付闭环。

# ⚖️ Strict Habit Coach (严格自律教练)

> **"要么自律，要么破产。"** —— 这是一个基于 Web3 **AI Agent Payment** 的硬核习惯监督系统。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build: EVM](https://img.shields.io/badge/Build-EVM%20Compatible-blue)](https://ethereum.org)

---

## 📖 项目愿景
本项目旨在通过 **AI 裁判 (DeepSeek V3)** 的深度内容分析与 **AI Agent** 的自主链上执行，彻底解决个人自律难题。
用户质押 ETH，连接 Strava/GitHub 或上传阅读笔记。AI Agent 每日自动验证行为数据真实性与质量，敷衍即由 Agent 直接发起 Slash 交易扣款，达标则自动记录并在周期结束后发放 STRICT 代币奖励。

---

## 🏗️ 核心架构

```mermaid
graph TB
    subgraph Frontend["🖥️ 前端层 (React + Vite)"]
        LP[LandingPage<br/>落地页]
        DB[Dashboard<br/>仪表盘]
        CL[ChallengeList<br/>挑战列表]
        CC[CreateChallenge<br/>创建挑战]
        CD[ChallengeDetail<br/>挑战详情]
        LP --> DB
        DB --> CL
        DB --> CC
        CL --> CD
    end

    subgraph Backend["⚙️ 后端 API 层"]
        API[REST Controller]
        SVC[Service 层]
        REPO[Repository]
        WEB3[Web3 服务]
        AGENT[AI Agent 服务]
        API --> SVC
        SVC --> REPO
        SVC --> WEB3
        SVC --> AGENT
    end

    subgraph Database["🗄️ 数据库 (MySQL)"]
        MYSQL[(用户/挑战/记录)]
    end

    subgraph Blockchain["⛓️ 智能合约层 (Solidity)"]
        ESC[HabitEscrow.sol]
        TOKEN[StrictToken.sol]
    end

    subgraph External["🌐 外部服务"]
        GHAPI[GitHub API]
        STRAPI[Strava API]
        DS["DeepSeek V3<br/>(AI 内容分析)"]
        CHAIN["EVM 兼容网络<br/>(Sepolia/Base/etc.)"]
    end

    Frontend <-->|钱包交互/签名| Blockchain
    Frontend <-->|HTTP API| Backend
    REPO --> Database
    AGENT -->|代码提交| GHAPI
    AGENT -->|运动数据| STRAPI
    AGENT -->|阅读笔记/内容审核| DS
    WEB3 -->|Gas 支付/链上结算| CHAIN
    Blockchain <-->|交易广播| CHAIN
```

---

## 📊 核心业务流程：AI Agent Payment Loop

本系统的核心在于 **无人工干预的自动化验证与支付闭环**。AI Agent 拥有独立的链上钱包，根据 DeepSeek V3 的分析结果自动签署交易。

```mermaid
sequenceDiagram
    participant U as 用户 (User)
    participant F as 前端 (Frontend)
    participant A as AI Agent (Spring Boot)
    participant E as 外部数据 (GitHub/Strava)
    participant D as DeepSeek V3
    participant C as 智能合约 (EVM)

    Note over U,C: 🟢 1. 承诺确立 (Commitment)
    U->>F: 发起挑战 (跑步/阅读/代码)
    F->>C: 质押 ETH (deposit)
    C-->>F: 锁定资产

    Note over U,C: 🔄 2. 每日验证循环 (Daily Verification)
    loop 每日 24:00 结算
        A->>E: 拉取今日数据 (代码提交/运动记录)
        A->>F: (若阅读挑战) 拉取用户上传的阅读笔记
        
        alt 无数据/无笔记
            A->>A: 判定：MISS (未完成)
        else 有数据
            A->>D: Prompt: 分析代码质量/阅读笔记深度...
            D-->>A: 返回：PASS (达标) 或 FAIL (敷衍)
        end

        Note over A,C: 🤖 3. AI Agent 自主支付 (Agent Payment)
        alt 判定结果 = PASS
            A->>C: 调用 recordDayComplete(user)
            C-->>A: 更新链上进度
            A->>U: 发送鼓励通知
        else 判定结果 = FAIL / MISS
            A->>C: 调用 slash(user) [Agent 支付 Gas]
            C-->>A: 扣除今日质押金 -> 捐赠池
            A->>U: 发送惩罚警示
        end
    end

    Note over U,C: 🏆 4. 最终结算 (Final Settlement)
    U->>F: 挑战周期结束
    F->>C: claimReward()
    C-->>U: 返还剩余本金 + STRICT 代币奖励
```

---

## 🧩 模块职责

### 1. 前端层 (`/frontend`)
| 页面 | 职责 |
|------|------|
| `LandingPage.tsx` | 产品理念介绍、AI Agent Payment 概念展示 |
| `Dashboard.tsx` | 个人资产看板、STRICT 代币余额、挑战状态概览 |
| `CreateChallenge.tsx` | 创建挑战、设置质押金额与习惯类型 |
| `ChallengeDetail.tsx` | 详细进度追踪、查看 AI 对阅读笔记/代码的评价 |

### 2. 后端与 AI Agent 层 (`/backend`)
*   **数据聚合**: 定时从 GitHub (代码)、Strava (运动) 拉取原始行为数据。
*   **内容分析**: 接收用户提交的阅读笔记。
*   **AI 核心 (DeepSeek V3)**:
    *   分析代码 Commit 的有效性（非简单的空格修改）。
    *   分析阅读笔记的深度与真实性（防止复制粘贴）。
    *   分析运动数据的真实性。
*   **Agent Payment**: 封装 Web3j，管理 Agent 私钥，自主发起链上交易（Slash 或 记录进度）。

### 3. 智能合约层 (`/contracts`)

#### StrictToken.sol - ERC20 激励代币
*   用户完成挑战后的额外奖励。

#### HabitEscrow.sol - 核心托管逻辑
| 函数 | 说明 |
|------|------|
| `createChallenge` | 用户端调用，质押 ETH 创建条站并锁定资金。 |
| `slash` | **仅限 Agent 调用**。当 AI 判定未达标时，扣除质押金。 |
| `recordDayComplete` | **仅限 Agent 调用**。记录每日打卡状态，累积天数。 |
| `claimReward` | 用户端调用。挑战成功后取回本金和代币。 |
| `emergencyWithdraw` | 用户端调用。紧急“认怂”退出，扣除 30% 懦夫税。 |
| `useResurrection` | 用户端调用。消耗复活卡重置当前周期进度。 |

---

## 🚀 快速启动

1. **克隆项目**:
   ```bash
   git clone [https://github.com/ggus39/Strict-Habit-Coach.git](https://github.com/ggus39/Strict-Habit-Coach.git)
   ```
