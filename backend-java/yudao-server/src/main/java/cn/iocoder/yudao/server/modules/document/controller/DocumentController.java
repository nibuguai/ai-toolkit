package cn.iocoder.yudao.server.modules.document.controller;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import cn.iocoder.yudao.server.modules.document.service.DocumentService;
import cn.iocoder.yudao.server.modules.task.model.TaskInfo;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.Resource;
import java.io.IOException;

/**
 * 文档处理 Controller
 */
@RestController
@RequestMapping("/api/document")
public class DocumentController {

    @Resource
    private DocumentService documentService;

    /**
     * 证件照抠图 —— 提交任务
     */
    @PostMapping("/id-photo/remove-bg")
    public CommonResult<TaskInfo> removeBackground(@RequestParam("file") MultipartFile file) throws IOException {
        TaskInfo task = documentService.submitRemoveBg(
                file.getBytes(),
                file.getOriginalFilename()
        );
        return CommonResult.success(task);
    }
}
