package cn.iocoder.yudao.server.modules.document.client;

import cn.iocoder.yudao.framework.common.pojo.CommonResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.util.Base64;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * 视觉服务 HTTP 客户端 —— 调用 doc-fastapi-vision
 */
@Component
public class VisionServiceClient {

    private final RestClient restClient;

    public VisionServiceClient(@Value("${fastapi.vision.url}") String baseUrl,
                               RestClient.Builder builder) {
        this.restClient = builder
                .baseUrl(baseUrl)
                .defaultHeader("Content-Type", "application/json")
                .build();
    }

    /**
     * 异步抠图
     */
    @Async("taskExecutor")
    public CompletableFuture<CommonResult<Map>> removeBackground(byte[] file, String fileName) {
        Map<String, Object> body = Map.of(
                "file_data", Base64.getEncoder().encodeToString(file),
                "file_name", fileName,
                "params", Map.of()
        );

        CommonResult<Map> result = restClient.post()
                .uri("/api/v1/vision/id-photo/remove-bg")
                .body(body)
                .retrieve()
                .body(CommonResult.class);

        return CompletableFuture.completedFuture(result);
    }
}
