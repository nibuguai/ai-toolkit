package cn.iocoder.yudao.server.modules.task.controller;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.server.modules.task.model.TaskInfo;
import cn.iocoder.yudao.server.modules.task.service.TaskService;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.*;

/**
 * 任务查询 Controller
 */
@RestController
@RequestMapping("/api/task")
public class TaskController {

    @Resource
    private TaskService taskService;

    /**
     * 查询任务状态和结果
     */
    @GetMapping("/{taskId}")
    public CommonResult<TaskInfo> getTask(@PathVariable String taskId) {
        TaskInfo task = taskService.getTask(taskId);
        if (task == null) {
            return CommonResult.error(404, "任务不存在");
        }
        return CommonResult.success(task);
    }
}
