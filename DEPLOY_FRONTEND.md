# 🚀 部署指南 (Deployment Guide)

本项目包含三个主要组件：
- **智能合约** - Solidity (Foundry)
- **后端服务** - Spring Boot (Java 17)
- **前端应用** - React + Vite

---

## 📋 环境要求

| 组件 | 要求 |
|------|------|
| Node.js | >= 18.x |
| Java | 17+ |
| Foundry | 最新版 |
| Git | 最新版 |

---

## 1️⃣ 智能合约部署 (Foundry)

### 1.1 安装 Foundry

```bash
# Linux/Mac/WSL
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 验证安装
forge --version
```

### 1.2 编译合约

```bash
cd contracts
forge build
```

### 1.3 配置环境变量

在 `contracts/` 目录下创建 `.env` 文件：

```bash
# 部署者私钥
PRIVATE_KEY=your_private_key

# Sepolia RPC URL
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY

# Etherscan API Key (用于验证合约)
ETHERSCAN_API_KEY=your_etherscan_api_key
```

### 1.4 部署合约

```bash
# 加载环境变量
source .env

# 部署 StrictToken
forge create --rpc-url $SEPOLIA_RPC_URL \
    --private-key $PRIVATE_KEY \
    src/StrictToken.sol:StrictToken \
    --constructor-args "Strict Token" "STRICT"

# 记录 StrictToken 地址后，部署 HabitEscrow
forge create --rpc-url $SEPOLIA_RPC_URL \
    --private-key $PRIVATE_KEY \
    src/HabitEscrow.sol:HabitEscrow \
    --constructor-args <STRICT_TOKEN_ADDRESS> <AGENT_ADDRESS> <CHARITY_ADDRESS>
```

### 1.5 验证合约 (可选)

```bash
forge verify-contract <CONTRACT_ADDRESS> src/HabitEscrow.sol:HabitEscrow \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --chain sepolia \
    --constructor-args $(cast abi-encode "constructor(address,address,address)" <STRICT_TOKEN> <AGENT> <CHARITY>)
```

### 1.6 当前已部署地址 (Sepolia)

| 合约 | 地址 |
|------|------|
| StrictToken | `0xcECDE33801aDa871ABD5cd0406248B8A70a6FC32` |
| HabitEscrow | `0xba1180cC038342d9be147cfeC8490af8c44aCE44` |

---

## 2️⃣ 后端部署 (Spring Boot)

### 2.1 配置环境变量

在服务器上设置以下环境变量：

```bash
# 数据库配置
export MYSQL_HOST=localhost
export MYSQL_PORT=3306
export MYSQL_DATABASE=strict_habit
export MYSQL_USERNAME=root
export MYSQL_PASSWORD=your_password

# Redis配置
export REDIS_HOST=localhost
export REDIS_PORT=6379
export REDIS_PASSWORD=

# GitHub OAuth
export GITHUB_CLIENT_ID=your_github_client_id
export GITHUB_CLIENT_SECRET=your_github_client_secret

# Strava OAuth
export STRAVA_CLIENT_ID=your_strava_client_id
export STRAVA_CLIENT_SECRET=your_strava_client_secret

# AI Agent 私钥 (用于链上交易)
export AGENT_PRIVATE_KEY=your_agent_private_key

# 前端URL (用于OAuth回调)
export FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### 2.2 本地开发运行

```bash
cd backend

# Maven 运行
./mvnw spring-boot:run

# 或指定配置文件
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### 2.3 生产环境构建

```bash
cd backend

# 打包为 JAR
./mvnw clean package -DskipTests

# 运行 JAR
java -jar target/strict-habit-coach-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
```

### 2.4 Docker 部署 (推荐)

创建 `Dockerfile`：

```dockerfile
FROM eclipse-temurin:17-jdk-alpine
VOLUME /tmp
COPY target/*.jar app.jar
ENTRYPOINT ["java","-jar","/app.jar"]
```

构建并运行：

```bash
# 构建镜像
docker build -t strict-habit-backend .

# 运行容器
docker run -d -p 8080:8080 \
    -e MYSQL_HOST=host.docker.internal \
    -e MYSQL_USERNAME=root \
    -e MYSQL_PASSWORD=password \
    --name strict-backend \
    strict-habit-backend
```

### 2.5 使用云服务部署

**Railway/Render/Fly.io** 等平台支持一键部署 Spring Boot 应用：

```bash
# Railway
railway init
railway up

# Render
# 在 render.com 创建 Web Service，连接 GitHub 仓库
```

---

## 3️⃣ 前端部署 (Vercel)

### 3.1 方式一：Vercel CLI (推荐)

```bash
cd frontend

# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署到生产环境
vercel --prod
```

部署时按提示操作：
- Set up and deploy? → **Y**
- Which scope? → (选择你的账号)
- Link to existing project? → **N**
- Project name? → `strict-habit-coach`
- In which directory is your code located? → `./`
- Want to modify these settings? → **N**

### 3.2 方式二：Vercel 控制台

1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Add New Project"
3. 导入 GitHub 仓库
4. 设置 **Root Directory** 为 `frontend`
5. 框架自动识别为 Vite
6. 点击 Deploy

### 3.3 环境变量配置

在 Vercel 项目设置中添加环境变量：

| 变量名 | 值 |
|--------|-----|
| `VITE_BACKEND_URL` | `https://your-backend-domain.com` |
| `VITE_WALLETCONNECT_PROJECT_ID` | `your_walletconnect_project_id` |

### 3.4 本地构建预览

```bash
cd frontend

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产构建
npm run build

# 预览生产构建
npm run preview
```

---

## 4️⃣ 一键部署脚本

创建 `deploy.sh`：

```bash
#!/bin/bash

echo "=========================================="
echo "Strict Habit Coach - 一键部署脚本"
echo "=========================================="

# 检查环境
check_env() {
    command -v node >/dev/null 2>&1 || { echo "需要安装 Node.js"; exit 1; }
    command -v java >/dev/null 2>&1 || { echo "需要安装 Java 17"; exit 1; }
    command -v forge >/dev/null 2>&1 || { echo "需要安装 Foundry"; exit 1; }
}

# 部署合约
deploy_contracts() {
    echo "📦 部署智能合约..."
    cd contracts
    forge build
    # forge create ... (需要配置私钥)
    cd ..
}

# 构建后端
build_backend() {
    echo "🔧 构建后端..."
    cd backend
    ./mvnw clean package -DskipTests
    echo "✅ 后端构建完成: target/*.jar"
    cd ..
}

# 部署前端
deploy_frontend() {
    echo "🚀 部署前端到 Vercel..."
    cd frontend
    npm install
    npx vercel --prod
    cd ..
}

# 主流程
main() {
    check_env
    
    echo ""
    echo "选择要部署的组件："
    echo "1) 智能合约"
    echo "2) 后端服务"
    echo "3) 前端应用"
    echo "4) 全部部署"
    echo ""
    read -p "请选择 (1-4): " choice
    
    case $choice in
        1) deploy_contracts ;;
        2) build_backend ;;
        3) deploy_frontend ;;
        4) 
            deploy_contracts
            build_backend
            deploy_frontend
            ;;
        *) echo "无效选择" ;;
    esac
    
    echo ""
    echo "✅ 部署完成!"
}

main
```

使用方法：

```bash
chmod +x deploy.sh
./deploy.sh
```

---

## 5️⃣ 部署检查清单

### 合约部署
- [ ] Foundry 已安装
- [ ] `.env` 配置私钥和 RPC URL
- [ ] 合约已编译通过
- [ ] 合约已部署到 Sepolia
- [ ] 合约地址已更新到前端 `contracts/index.ts`

### 后端部署
- [ ] Java 17 已安装
- [ ] MySQL 数据库已配置
- [ ] 环境变量已设置
- [ ] JAR 已构建
- [ ] 服务已启动并可访问

### 前端部署
- [ ] Node.js 18+ 已安装
- [ ] 依赖已安装
- [ ] 环境变量已配置
- [ ] Vercel 部署成功
- [ ] 域名配置正确

---

## 🔗 相关链接

- **Sepolia Faucet**: https://sepoliafaucet.com/
- **Etherscan (Sepolia)**: https://sepolia.etherscan.io/
- **Vercel**: https://vercel.com/
- **Foundry Book**: https://book.getfoundry.sh/

---

## ❓ 常见问题

### Q: 合约部署失败？
A: 检查私钥格式、RPC URL 是否正确、账户是否有足够的 Sepolia ETH。

### Q: 后端无法连接数据库？
A: 确认 MySQL 服务已启动，检查环境变量配置是否正确。

### Q: 前端部署后页面空白？
A: 检查 Vercel 构建日志，确认 Root Directory 设置为 `frontend`。

### Q: OAuth 回调失败？
A: 确认 GitHub/Strava 应用的回调 URL 配置正确。
