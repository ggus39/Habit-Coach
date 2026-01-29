package com.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.domain.DailyCheckIn;
import com.domain.entity.GitHubConnection;
import com.service.GitHubOAuthService;
import com.service.GitHubService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Agent 控制器
 * 负责 GitHub OAuth 授权和打卡检测
 */
@RestController
@RequestMapping("/agent")
@CrossOrigin(origins = "*")
public class AgentController {

    @Autowired
    private GitHubService gitHubService;

    @Autowired
    private GitHubOAuthService gitHubOAuthService;

    @Autowired
    private com.service.BlockchainService blockchainService;

    @Value("${frontend.url:http://localhost:5173}")
    private String frontendUrl;

    // ==================== GitHub OAuth 相关 ====================

    /**
     * 发起 GitHub 授权
     * 前端调用此接口，后端重定向到 GitHub 授权页面
     * @param walletAddress 用户钱包地址
     */
    @GetMapping("/github/auth")
    public void auth(@RequestParam String walletAddress, HttpServletResponse response) throws IOException {
        String authUrl = gitHubOAuthService.getAuthorizationUrl(walletAddress);
        response.sendRedirect(authUrl);
    }

    /**
     * GitHub OAuth 回调
     * GitHub 授权成功后回调此接口
     * @param code 授权码
     * @param state 钱包地址 (之前传入的 state)
     */
    @GetMapping("/github/callback")
    public void callback(@RequestParam String code, 
                         @RequestParam String state,
                         HttpServletResponse response) throws IOException {
        String walletAddress = state;
        
        // 1. 用 code 换 token
        Map<String, Object> tokenResponse = gitHubOAuthService.exchangeCodeForToken(code);
        String accessToken = (String) tokenResponse.get("access_token");
        String tokenType = (String) tokenResponse.get("token_type");
        String scope = (String) tokenResponse.get("scope");

        // 2. 获取 GitHub 用户信息
        Map<String, Object> githubUser = gitHubOAuthService.getGitHubUser(accessToken);

        // 3. 保存到数据库
        gitHubOAuthService.saveOrUpdateConnection(walletAddress, accessToken, tokenType, scope, githubUser);

        // 4. 重定向回前端 (带上成功标记)
        String redirectUrl = frontendUrl + "/dashboard?github_connected=true&github_user=" + githubUser.get("login");
        response.sendRedirect(redirectUrl);
    }

    /**
     * 获取用户的 GitHub 绑定状态
     * @param walletAddress 钱包地址
     * @return 绑定信息
     */
    @GetMapping("/github/status")
    public Map<String, Object> getStatus(@RequestParam String walletAddress) {
        Map<String, Object> result = new HashMap<>();
        
        GitHubConnection connection = gitHubOAuthService.getConnectionByWallet(walletAddress);
        if (connection != null) {
            result.put("connected", true);
            result.put("githubUsername", connection.getGithubUsername());
            result.put("githubAvatarUrl", connection.getGithubAvatarUrl());
        } else {
            result.put("connected", false);
        }
        
        return result;
    }

    // ==================== GitHub 打卡检测 ====================

    @Autowired
    private com.mapper.DailyCheckInMapper dailyCheckInMapper;

    /**
     * 检查用户今日 GitHub 打卡状态
     * @param walletAddress 用户钱包地址
     * @param challengeId   挑战ID (前端传入)
     * @return 打卡结果
     */
    @GetMapping("/github/check")
    public Map<String, Object> checkGitHub(
            @RequestParam String walletAddress,
            @RequestParam(required = false) Long challengeId) {
        
        Map<String, Object> result = new HashMap<>();
        
        // 1. 获取用户的 GitHub 连接
        GitHubConnection connection = gitHubOAuthService.getConnectionByWallet(walletAddress);
        if (connection == null) {
            result.put("success", false);
            result.put("message", "请先绑定 GitHub 账号");
            return result;
        }

        // 2. 检查今日提交
        String username = connection.getGithubUsername();
        String token = connection.getAccessToken();
        
        // 不再检查特定仓库，而是检查用户今日是否有 Push 事件
        boolean hasCommits = gitHubService.hasCommitsToday(username, token);
        
        if (hasCommits) {
            result.put("success", true);
            result.put("clockedIn", true);
            result.put("message", "今日已打卡 ✅");
            
            // 3. 如果从前端传入了 challengeId，则尝试记录上链
            if (challengeId != null) {
                // Check idempotency
                java.time.LocalDate today = java.time.LocalDate.now(java.time.ZoneId.of("Asia/Shanghai"));
                LambdaQueryWrapper<DailyCheckIn> query = new LambdaQueryWrapper<>();
                query.eq(DailyCheckIn::getWalletAddress, walletAddress)
                     .eq(DailyCheckIn::getChallengeId, challengeId)
                     .eq(DailyCheckIn::getCheckInDate, today);
                
                if (dailyCheckInMapper.exists(query)) {
                    result.put("message", "今日已打卡 ✅ (无需重复上链)");
                } else {
                    try {
                        String txHash = blockchainService.recordDayComplete(walletAddress, java.math.BigInteger.valueOf(challengeId));
                        
                        // Record success in DB
                        com.domain.DailyCheckIn checkIn = new com.domain.DailyCheckIn();
                        checkIn.setWalletAddress(walletAddress);
                        checkIn.setChallengeId(challengeId);
                        checkIn.setCheckInDate(today);
                        checkIn.setCreatedAt(java.time.LocalDateTime.now());
                        dailyCheckInMapper.insert(checkIn);

                        result.put("txHash", txHash);
                        result.put("message", "今日已打卡 ✅ (链上记录成功: " + txHash + ")");
                    } catch (Exception e) {
                        e.printStackTrace();
                        result.put("message", "今日已打卡 ✅ (但链上记录失败: " + e.getMessage() + ")");
                    }
                }
            }
        } else {
            result.put("success", true);
            result.put("clockedIn", false);
            result.put("message", "今日未打卡 ❌");
        }
        
        result.put("githubUsername", username);
        
        return result;
    }
}
