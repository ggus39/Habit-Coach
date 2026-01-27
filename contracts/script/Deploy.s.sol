// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/StrictToken.sol";
import "../src/HabitEscrow.sol";

contract DeployScript is Script {
    function run() external {
        // 从环境变量获取私钥
        // 本地使用 Anvil 测试时，如果不指定，将使用默认账户之一
        uint256 deployerPrivateKey = vm.envOr(
            "PRIVATE_KEY_ETH",
            uint256(
                0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
            )
        );

        // 开始广播交易
        vm.startBroadcast(deployerPrivateKey);

        // 1. 部署 StrictToken
        StrictToken token = new StrictToken();
        console.log("StrictToken deployed to:", address(token));

        // 2. 准备 HabitEscrow 构造函数参数
        address agent = vm.addr(deployerPrivateKey); // 初始使用部署者作为 agent
        address charity = address(0x24440EC6A8FD6f89F1Fe45aa5A1B281cEae993B2); // 占位符慈善地址

        // 3. 部署 HabitEscrow
        HabitEscrow escrow = new HabitEscrow(address(token), agent, charity);
        console.log("HabitEscrow deployed to:", address(escrow));

        // 4. 将所有代币转移到 Escrow (根据代币经济学)
        uint256 totalSupply = token.totalSupply();
        token.transfer(address(escrow), totalSupply);
        console.log("Transferred", totalSupply, "STRICT tokens to Escrow");

        vm.stopBroadcast();
    }
}
