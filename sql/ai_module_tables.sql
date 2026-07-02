-- ============================================================
-- AI 模块建表 SQL
-- 基于 Java 实体类自动生成
-- ============================================================

-- ----------------------------
-- 1. AI API 秘钥表
-- ----------------------------
DROP TABLE IF EXISTS `ai_api_key`;
CREATE TABLE `ai_api_key` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `name` VARCHAR(255) NOT NULL COMMENT '名称',
  `api_key` VARCHAR(512) NOT NULL COMMENT '密钥',
  `platform` VARCHAR(64) NOT NULL COMMENT '平台，枚举 AiPlatformEnum',
  `url` VARCHAR(512) DEFAULT NULL COMMENT 'API 地址',
  `status` INT NOT NULL DEFAULT 0 COMMENT '状态，枚举 CommonStatusEnum（0=开启，1=禁用）',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI API 秘钥表';

-- ----------------------------
-- 2. AI 模型表
-- ----------------------------
DROP TABLE IF EXISTS `ai_model`;
CREATE TABLE `ai_model` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `key_id` BIGINT NOT NULL COMMENT 'API 秘钥编号，关联 ai_api_key.id',
  `name` VARCHAR(255) NOT NULL COMMENT '模型名称',
  `model` VARCHAR(128) NOT NULL COMMENT '模型标志',
  `platform` VARCHAR(64) NOT NULL COMMENT '平台，枚举 AiPlatformEnum',
  `type` INT NOT NULL COMMENT '类型，枚举 AiModelTypeEnum',
  `sort` INT NOT NULL DEFAULT 0 COMMENT '排序值',
  `status` INT NOT NULL DEFAULT 0 COMMENT '状态，枚举 CommonStatusEnum（0=开启，1=禁用）',
  `temperature` DOUBLE DEFAULT NULL COMMENT '温度参数，用于调整生成回复的随机性和多样性程度',
  `max_tokens` INT DEFAULT NULL COMMENT '单条回复的最大 Token 数量',
  `max_contexts` INT DEFAULT NULL COMMENT '上下文的最大 Message 数量',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 模型表';

-- ----------------------------
-- 3. AI 聊天角色表
-- ----------------------------
DROP TABLE IF EXISTS `ai_chat_role`;
CREATE TABLE `ai_chat_role` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `name` VARCHAR(255) NOT NULL COMMENT '角色名称',
  `avatar` VARCHAR(512) DEFAULT NULL COMMENT '角色头像',
  `category` VARCHAR(255) DEFAULT NULL COMMENT '角色分类',
  `description` TEXT DEFAULT NULL COMMENT '角色描述',
  `system_message` TEXT DEFAULT NULL COMMENT '角色设定',
  `user_id` BIGINT DEFAULT NULL COMMENT '用户编号，关联 AdminUserDO 的 userId',
  `model_id` BIGINT DEFAULT NULL COMMENT '模型编号，关联 ai_model.id',
  `knowledge_ids` JSON DEFAULT NULL COMMENT '引用的知识库编号列表，关联 ai_knowledge.id',
  `tool_ids` JSON DEFAULT NULL COMMENT '引用的工具编号列表，关联 ai_tool.id',
  `mcp_client_names` JSON DEFAULT NULL COMMENT '引用的 MCP Client 名字列表',
  `public_status` TINYINT NOT NULL DEFAULT 0 COMMENT '是否公开（true=公开，false=私有）',
  `sort` INT NOT NULL DEFAULT 0 COMMENT '排序值',
  `status` INT NOT NULL DEFAULT 0 COMMENT '状态，枚举 CommonStatusEnum（0=开启，1=禁用）',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 聊天角色表';

-- ----------------------------
-- 4. AI 工具表
-- ----------------------------
DROP TABLE IF EXISTS `ai_tool`;
CREATE TABLE `ai_tool` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '工具编号',
  `name` VARCHAR(255) NOT NULL COMMENT '工具名称，对应 Bean 的名字',
  `description` TEXT DEFAULT NULL COMMENT '工具描述',
  `status` INT NOT NULL DEFAULT 0 COMMENT '状态，枚举 CommonStatusEnum（0=开启，1=禁用）',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 工具表';

-- ----------------------------
-- 5. AI Chat 对话表
-- ----------------------------
DROP TABLE IF EXISTS `ai_chat_conversation`;
CREATE TABLE `ai_chat_conversation` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `user_id` BIGINT NOT NULL COMMENT '用户编号，关联 AdminUserDO 的 userId',
  `title` VARCHAR(255) NOT NULL DEFAULT '新对话' COMMENT '对话标题，默认由系统自动生成',
  `pinned` TINYINT NOT NULL DEFAULT 0 COMMENT '是否置顶',
  `pinned_time` DATETIME DEFAULT NULL COMMENT '置顶时间',
  `role_id` BIGINT DEFAULT NULL COMMENT '角色编号，关联 ai_chat_role.id',
  `model_id` BIGINT DEFAULT NULL COMMENT '模型编号，关联 ai_model.id',
  `model` VARCHAR(128) DEFAULT NULL COMMENT '模型标志，冗余 ai_model.model',
  `system_message` TEXT DEFAULT NULL COMMENT '角色设定',
  `temperature` DOUBLE DEFAULT NULL COMMENT '温度参数，用于调整生成回复的随机性和多样性程度',
  `max_tokens` INT DEFAULT NULL COMMENT '单条回复的最大 Token 数量',
  `max_contexts` INT DEFAULT NULL COMMENT '上下文的最大 Message 数量',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI Chat 对话表';

-- ----------------------------
-- 6. AI Chat 消息表
-- ----------------------------
DROP TABLE IF EXISTS `ai_chat_message`;
CREATE TABLE `ai_chat_message` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `conversation_id` BIGINT NOT NULL COMMENT '对话编号，关联 ai_chat_conversation.id',
  `reply_id` BIGINT DEFAULT NULL COMMENT '回复消息编号，关联本表 id，用于问答关联',
  `type` VARCHAR(64) NOT NULL COMMENT '消息类型，等价于 OpenAPI 的 role 字段，枚举 MessageType',
  `user_id` BIGINT DEFAULT NULL COMMENT '用户编号，关联 AdminUserDO 的 userId',
  `role_id` BIGINT DEFAULT NULL COMMENT '角色编号，关联 ai_chat_role.id',
  `model` VARCHAR(128) DEFAULT NULL COMMENT '模型标志，冗余 ai_model.model',
  `model_id` BIGINT DEFAULT NULL COMMENT '模型编号，关联 ai_model.id',
  `content` TEXT DEFAULT NULL COMMENT '聊天内容',
  `reasoning_content` TEXT DEFAULT NULL COMMENT '推理内容',
  `use_context` TINYINT DEFAULT NULL COMMENT '是否携带上下文',
  `segment_ids` JSON DEFAULT NULL COMMENT '知识库段落编号数组，关联 ai_knowledge_segment.id',
  `web_search_pages` JSON DEFAULT NULL COMMENT '联网搜索的网页内容数组',
  `attachment_urls` JSON DEFAULT NULL COMMENT '附件 URL 数组',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI Chat 消息表';

-- ----------------------------
-- 7. AI 绘图表
-- ----------------------------
DROP TABLE IF EXISTS `ai_image`;
CREATE TABLE `ai_image` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `user_id` BIGINT NOT NULL COMMENT '用户编号',
  `prompt` TEXT DEFAULT NULL COMMENT '提示词',
  `platform` VARCHAR(64) NOT NULL COMMENT '平台，枚举 AiPlatformEnum',
  `model_id` BIGINT DEFAULT NULL COMMENT '模型编号，关联 ai_model.id',
  `model` VARCHAR(128) DEFAULT NULL COMMENT '模型标识，冗余 ai_model.model',
  `width` INT DEFAULT NULL COMMENT '图片宽度',
  `height` INT DEFAULT NULL COMMENT '图片高度',
  `status` INT NOT NULL DEFAULT 0 COMMENT '生成状态，枚举 AiImageStatusEnum',
  `finish_time` DATETIME DEFAULT NULL COMMENT '完成时间',
  `error_message` TEXT DEFAULT NULL COMMENT '绘画错误信息',
  `pic_url` VARCHAR(512) DEFAULT NULL COMMENT '图片地址',
  `public_status` TINYINT NOT NULL DEFAULT 0 COMMENT '是否公开',
  `options` JSON DEFAULT NULL COMMENT '绘制参数，不同 platform 的不同参数',
  `buttons` JSON DEFAULT NULL COMMENT 'mj buttons 按钮',
  `task_id` VARCHAR(255) DEFAULT NULL COMMENT '任务编号',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 绘图表';

-- ----------------------------
-- 8. AI 音乐表
-- ----------------------------
DROP TABLE IF EXISTS `ai_music`;
CREATE TABLE `ai_music` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `user_id` BIGINT NOT NULL COMMENT '用户编号，关联 AdminUserDO 的 userId',
  `title` VARCHAR(255) DEFAULT NULL COMMENT '音乐名称',
  `lyric` TEXT DEFAULT NULL COMMENT '歌词',
  `image_url` VARCHAR(512) DEFAULT NULL COMMENT '图片地址',
  `audio_url` VARCHAR(512) DEFAULT NULL COMMENT '音频地址',
  `video_url` VARCHAR(512) DEFAULT NULL COMMENT '视频地址',
  `status` INT NOT NULL DEFAULT 0 COMMENT '音乐状态，枚举 AiMusicStatusEnum',
  `generate_mode` INT DEFAULT NULL COMMENT '生成模式，枚举 AiMusicGenerateModeEnum',
  `description` TEXT DEFAULT NULL COMMENT '描述词',
  `platform` VARCHAR(64) DEFAULT NULL COMMENT '平台，枚举 AiPlatformEnum',
  `model` VARCHAR(128) DEFAULT NULL COMMENT '模型',
  `tags` JSON DEFAULT NULL COMMENT '音乐风格标签',
  `duration` DOUBLE DEFAULT NULL COMMENT '音乐时长',
  `public_status` TINYINT NOT NULL DEFAULT 0 COMMENT '是否公开',
  `task_id` VARCHAR(255) DEFAULT NULL COMMENT '任务编号',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 音乐表';

-- ----------------------------
-- 9. AI 写作表
-- ----------------------------
DROP TABLE IF EXISTS `ai_write`;
CREATE TABLE `ai_write` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `user_id` BIGINT NOT NULL COMMENT '用户编号，关联 AdminUserDO 的 userId',
  `type` INT NOT NULL COMMENT '写作类型，枚举 AiWriteTypeEnum',
  `platform` VARCHAR(64) DEFAULT NULL COMMENT '平台，枚举 AiPlatformEnum',
  `model_id` BIGINT DEFAULT NULL COMMENT '模型编号，关联 ai_model.id',
  `model` VARCHAR(128) DEFAULT NULL COMMENT '模型',
  `prompt` TEXT DEFAULT NULL COMMENT '生成内容提示',
  `generated_content` MEDIUMTEXT DEFAULT NULL COMMENT '生成的内容',
  `original_content` MEDIUMTEXT DEFAULT NULL COMMENT '原文',
  `length` INT DEFAULT NULL COMMENT '长度提示词，字典 AI_WRITE_LENGTH',
  `format` INT DEFAULT NULL COMMENT '格式提示词，字典 AI_WRITE_FORMAT',
  `tone` INT DEFAULT NULL COMMENT '语气提示词，字典 AI_WRITE_TONE',
  `language` INT DEFAULT NULL COMMENT '语言提示词，字典 AI_WRITE_LANGUAGE',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 写作表';

-- ----------------------------
-- 10. AI 思维导图表
-- ----------------------------
DROP TABLE IF EXISTS `ai_mind_map`;
CREATE TABLE `ai_mind_map` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `user_id` BIGINT NOT NULL COMMENT '用户编号，关联 AdminUserDO 的 userId',
  `platform` VARCHAR(64) DEFAULT NULL COMMENT '平台，枚举 AiPlatformEnum',
  `model_id` BIGINT DEFAULT NULL COMMENT '模型编号，关联 ai_model.id',
  `model` VARCHAR(128) DEFAULT NULL COMMENT '模型',
  `prompt` TEXT DEFAULT NULL COMMENT '生成内容提示',
  `generated_content` MEDIUMTEXT DEFAULT NULL COMMENT '生成的内容',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 思维导图表';

-- ----------------------------
-- 11. AI 工作流表
-- ----------------------------
DROP TABLE IF EXISTS `ai_workflow`;
CREATE TABLE `ai_workflow` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `name` VARCHAR(255) NOT NULL COMMENT '工作流名称',
  `code` VARCHAR(255) NOT NULL COMMENT '工作流标识',
  `graph` LONGTEXT DEFAULT NULL COMMENT '工作流模型 JSON 数据',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `status` INT NOT NULL DEFAULT 0 COMMENT '状态，枚举 CommonStatusEnum（0=开启，1=禁用）',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 工作流表';

-- ----------------------------
-- 12. AI 知识库表
-- ----------------------------
DROP TABLE IF EXISTS `ai_knowledge`;
CREATE TABLE `ai_knowledge` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `name` VARCHAR(255) NOT NULL COMMENT '知识库名称',
  `description` TEXT DEFAULT NULL COMMENT '知识库描述',
  `embedding_model_id` BIGINT DEFAULT NULL COMMENT '向量模型编号，关联 ai_model.id',
  `embedding_model` VARCHAR(128) DEFAULT NULL COMMENT '模型标识，冗余 ai_model.model',
  `top_k` INT DEFAULT NULL COMMENT 'topK',
  `similarity_threshold` DOUBLE DEFAULT NULL COMMENT '相似度阈值',
  `status` INT NOT NULL DEFAULT 0 COMMENT '状态，枚举 CommonStatusEnum（0=开启，1=禁用）',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 知识库表';

-- ----------------------------
-- 13. AI 知识库-文档表
-- ----------------------------
DROP TABLE IF EXISTS `ai_knowledge_document`;
CREATE TABLE `ai_knowledge_document` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `knowledge_id` BIGINT NOT NULL COMMENT '知识库编号，关联 ai_knowledge.id',
  `name` VARCHAR(255) NOT NULL COMMENT '文档名称',
  `url` VARCHAR(512) DEFAULT NULL COMMENT '文件 URL',
  `content` LONGTEXT DEFAULT NULL COMMENT '内容',
  `content_length` INT DEFAULT NULL COMMENT '文档长度',
  `tokens` INT DEFAULT NULL COMMENT '文档 token 数量',
  `segment_max_tokens` INT DEFAULT NULL COMMENT '分片最大 Token 数',
  `retrieval_count` INT NOT NULL DEFAULT 0 COMMENT '召回次数',
  `status` INT NOT NULL DEFAULT 0 COMMENT '状态，枚举 CommonStatusEnum（0=开启，1=禁用）',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 知识库-文档表';

-- ----------------------------
-- 14. AI 知识库-文档分段表
-- ----------------------------
DROP TABLE IF EXISTS `ai_knowledge_segment`;
CREATE TABLE `ai_knowledge_segment` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '编号',
  `knowledge_id` BIGINT NOT NULL COMMENT '知识库编号，关联 ai_knowledge.id',
  `document_id` BIGINT NOT NULL COMMENT '文档编号，关联 ai_knowledge_document.id',
  `content` TEXT DEFAULT NULL COMMENT '切片内容',
  `content_length` INT DEFAULT NULL COMMENT '切片内容长度',
  `vector_id` VARCHAR(255) DEFAULT NULL COMMENT '向量库的编号',
  `tokens` INT DEFAULT NULL COMMENT 'token 数量',
  `retrieval_count` INT NOT NULL DEFAULT 0 COMMENT '召回次数',
  `status` INT NOT NULL DEFAULT 0 COMMENT '状态，枚举 CommonStatusEnum（0=开启，1=禁用）',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `creator` VARCHAR(255) DEFAULT NULL COMMENT '创建者',
  `updater` VARCHAR(255) DEFAULT NULL COMMENT '更新者',
  `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0=未删除，1=已删除）',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI 知识库-文档分段表';
