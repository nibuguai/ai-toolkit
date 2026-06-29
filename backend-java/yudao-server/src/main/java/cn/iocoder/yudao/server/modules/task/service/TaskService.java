package cn.iocoder.yudao.server.modules.task.service;

import cn.iocoder.yudao.server.modules.task.model.TaskInfo;
import cn.iocoder.yudao.server.modules.task.model.TaskStatus;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 任务管理服务 —— Phase 0 用内存 Map，后期换数据库
 */
@Service
public class TaskService {

    private final Map<String, TaskInfo> taskStore = new ConcurrentHashMap<>();

    public TaskInfo createTask(String taskType) {
        String taskId = java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        TaskInfo task = new TaskInfo();
        task.setTaskId(taskId);
        task.setType(taskType);
        task.setStatus(TaskStatus.PROCESSING);
        taskStore.put(taskId, task);
        return task;
    }

    public void updateStatus(String taskId, TaskStatus status) {
        TaskInfo task = taskStore.get(taskId);
        if (task != null) {
            task.setStatus(status);
        }
    }

    public void setResult(String taskId, String resultUrl) {
        TaskInfo task = taskStore.get(taskId);
        if (task != null) {
            task.setStatus(TaskStatus.DONE);
            task.setResultUrl(resultUrl);
        }
    }

    public void setError(String taskId, String errorMsg) {
        TaskInfo task = taskStore.get(taskId);
        if (task != null) {
            task.setStatus(TaskStatus.FAILED);
            task.setErrorMsg(errorMsg);
        }
    }

    public TaskInfo getTask(String taskId) {
        return taskStore.get(taskId);
    }
}
