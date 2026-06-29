package cn.iocoder.yudao.server.modules.task.model;

import lombok.Data;

/**
 * 任务信息
 */
@Data
public class TaskInfo {
    private String taskId;
    private String type;
    private TaskStatus status;
    private String resultUrl;
    private String errorMsg;
}
