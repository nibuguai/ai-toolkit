package cn.iocoder.yudao.server.modules.document.service;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.server.modules.document.client.VisionServiceClient;
import cn.iocoder.yudao.server.modules.task.model.TaskInfo;
import cn.iocoder.yudao.server.modules.task.model.TaskStatus;
import cn.iocoder.yudao.server.modules.task.service.TaskService;
import cn.iocoder.yudao.server.websocket.TaskNotificationHandler;
import jakarta.annotation.Resource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

/**
 * 文档处理 Service —— 编排 FastAPI 调用
 */
@Service("docProcessService")
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);

    @Resource
    private VisionServiceClient visionClient;

    @Resource
    private TaskService taskService;

    @Resource
    private TaskNotificationHandler notifyHandler;

    /**
     * 1. 创建任务 → 立即返回 taskId
     * 2. 后台异步调 FastAPI 抠图
     * 3. 完成后 WebSocket 通知前端
     */
    public TaskInfo submitRemoveBg(byte[] fileBytes, String fileName) {
        TaskInfo task = taskService.createTask("remove-bg");
        processRemoveBg(task.getTaskId(), fileBytes, fileName);
        return task;
    }

    @Async("taskExecutor")
    public void processRemoveBg(String taskId, byte[] fileBytes, String fileName) {
        try {
            log.info("Processing remove-bg: taskId={}", taskId);

            // 调 FastAPI
            CommonResult<Map> result = visionClient.removeBackground(fileBytes, fileName)
                    .get(30, TimeUnit.SECONDS);

            if (result.getCode() == 200) {
                // Phase 0: 结果先存内存（后期换 MinIO）
                Map<String, Object> data = result.getData();
                String resultData = (String) data.get("result");
                taskService.setResult(taskId, resultData);
                notifyHandler.notifyDone(taskId, resultData);
                log.info("Task done: taskId={}", taskId);
            } else {
                taskService.setError(taskId, result.getMsg());
                notifyHandler.notifyFailed(taskId, result.getMsg());
            }

        } catch (Exception e) {
            log.error("Task failed: taskId={}", taskId, e);
            taskService.setError(taskId, e.getMessage());
            notifyHandler.notifyFailed(taskId, e.getMessage());
        }
    }
}
