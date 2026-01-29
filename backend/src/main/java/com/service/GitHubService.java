package com.service;

import org.kohsuke.github.GHEvent;
import org.kohsuke.github.GHEventInfo;
import org.kohsuke.github.GitHub;
import org.kohsuke.github.GitHubBuilder;
import org.kohsuke.github.PagedIterable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

/**
 * GitHub 服务
 * 用于检查用户代码提交
 */
@Service
public class GitHubService {

    /**
     * 检查用户今日是否有提交 (任意仓库)
     * @param username GitHub 用户名
     * @param token GitHub Token
     * @return true 如果今日有提交
     */
    public boolean hasCommitsToday(String username, String token) {
        try {
            GitHub github;
            if (token != null && !token.isEmpty()) {
                github = new GitHubBuilder().withOAuthToken(token).build();
            } else {
                github = new GitHubBuilder().build();
            }

            // 获取今日零点时间
            Date today = Date.from(LocalDate.now().atStartOfDay(ZoneId.systemDefault()).toInstant());

            // 获取用户事件列表
            // events 是按时间倒序排列的
            PagedIterable<GHEventInfo> events = github.getUser(username).listEvents();

            for (GHEventInfo event : events) {
                // 如果事件时间早于今天，说明已经检查完今日所有事件，未发现 Push
                if (event.getCreatedAt().before(today)) {
                    break;
                }

                // 检查是否是 Push 事件
                if (event.getType() == GHEvent.PUSH) {
                    return true;
                }
            }

            return false;
        } catch (Exception e) {
            // 记录日志但不抛出异常
            System.err.println("检查 GitHub 提交失败: " + e.getMessage());
            return false;
        }
    }
}

