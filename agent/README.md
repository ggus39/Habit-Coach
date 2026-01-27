# 🤖 AI Agent 层 (AI Agent Layer)

### 核心功能描述：
- **数据采集 (Data Fetching)**：利用 GitHub REST API 定时拉取用户的 Commit 记录和代码变更（Diff）。
- **LLM 裁决 (AI Verdict)**：将抓取的数据发送至 LLM（如 GPT-4o）。判定逻辑侧重于区分“真正的进步”与“欺诈式更新”。
    - *示例*：若判定为“在 README 中仅添加了 2 行敷衍代码”，则视为不合格。
- **自动签名执行 (Automated Execution)**：Agent 维护一个持有私钥的服务器端钱包。一旦判定失败，将自动调用智能合约的 `slash()` 函数。

### 协作任务：
- [ ] 编写 `askLLM(data)` 函数：优化对“代码质量”的判定 Prompt。
- [ ] 编写 `executeSlash(user)` 函数：集成链上交互逻辑。
