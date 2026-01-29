CREATE TABLE IF NOT EXISTS `daily_check_in` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键',
  `wallet_address` varchar(100) NOT NULL COMMENT '钱包地址',
  `challenge_id` bigint NOT NULL COMMENT '挑战ID',
  `check_in_date` date NOT NULL COMMENT '打卡日期',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_wallet_challenge_date` (`wallet_address`,`challenge_id`,`check_in_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日打卡记录表';
