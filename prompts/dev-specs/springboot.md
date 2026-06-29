# SpringBoot 开发规范

> 后端业务中枢的开发约束。架构设计详见《项目架构文档》。



------



## 状态

🟢 已确认（2026-06-29）



## 基础选型

| 项 | 选择 | 版本 | 说明 |
| ---- | ---- | ---- | ---- |
| 基础框架 | 若依 Office | 最新版 | 复用用户管理、权限、代码生成器 |
| JDK | OpenJDK | 21 LTS | 虚拟线程支持 |
| 构建工具 | Maven | 3.9+ | 若依默认 |
| 数据库 | MySQL | 8.0 | 用户、任务、日志 |
| ORM | MyBatis-Plus | 3.5+ | 若依自带 |
| 缓存 | Redis | 7.x | 会话、结果缓存、任务队列 |
| 对象存储 | MinIO | 最新版 | 文件上传/下载 |



## 核心依赖

```xml
<!-- 若依 Office 自带（直接复用） -->
<!-- Spring Boot 3.x, MyBatis-Plus, Sa-Token, Lombok, Knife4j -->

<!-- 需要确认是否已包含，没有则新增 -->
<!-- MinIO 客户端 -->
<dependency>
    <groupId>io.minio</groupId>
    <artifactId>minio</artifactId>
    <version>8.5.10</version>
</dependency>

<!-- HTTP 客户端（调用 FastAPI） -->
<!-- Spring 6 自带 RestClient，不需要额外依赖 -->

<!-- 异步任务 -->
<!-- Spring Boot 自带 @Async + TaskExecutor，不需要额外依赖 -->

<!-- WebSocket -->
<!-- Spring Boot 自带 spring-boot-starter-websocket -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-websocket</artifactId>
</dependency>
```



## 项目结构

```
backend-java/
├── pom.xml
├── Dockerfile
└── src/main/java/com/xxx/
    ├── common/                    ← 公共类
    │   ├── result/
    │   │   └── Result.java        ← 统一响应 { code, message, data }
    │   ├── exception/
    │   │   ├── GlobalExceptionHandler.java  ← 全局异常处理
    │   │   └── BusinessException.java
    │   └── constant/
    ├── config/
    │   ├── RestClientConfig.java  ← HTTP 客户端配置（超时、连接池）
    │   ├── AsyncConfig.java       ← 异步任务线程池配置
    │   ├── WebSocketConfig.java   ← WebSocket 端点注册
    │   └── MinioConfig.java
    ├── interceptor/
    │   ├── AuthInterceptor.java   ← 鉴权拦截器（前期放行）
    │   └── TraceInterceptor.java  ← traceId 生成与注入
    ├── websocket/
    │   └── TaskNotificationHandler.java  ← WebSocket 通知处理器（只推送，不传数据）
    ├── modules/                   ← 新增业务模块
    │   ├── document/              ← 文档处理模块
    │   │   ├── controller/
    │   │   ├── service/
    │   │   ├── client/            ← FastAPI 调用客户端
    │   │   └── model/
    │   ├── quota/                 ← 额度管理模块
    │   └── task/                  ← 任务管理模块
    └── utils/
        ├── Base64Util.java        ← Base64 编解码
        └── FileTypeUtil.java      ← 文件类型校验
```



## 前后端通信方案

**选定方案：WebSocket 通知 + HTTP 拉取结果**

```
1. 前端提交任务 → SpringBoot → 立即返回 taskId（毫秒级）
2. SpringBoot @Async 后台调用 FastAPI
3. 前端通过 WebSocket 订阅 taskId，等待通知
4. FastAPI 返回结果 → SpringBoot 存库 → WebSocket 推送 "done"
5. 前端收到通知 → HTTP GET 拉取完整结果
```

**为什么：**
- 轮询浪费：800 次请求里 700 次返回"还没好"
- WebSocket 通知：100 个任务只有 100 条推送（几十字节）
- 结果走 HTTP：天然支持大文件、断点续传、失败重试

## FastAPI 调用客户端规范

```java
// 每个 FastAPI 服务一个 Client 类
// 异步调用，返回 CompletableFuture

@Component
public class VisionServiceClient {

    private final RestClient restClient;

    public VisionServiceClient(@Value("${vision.service.url}") String baseUrl,
                                RestClient.Builder builder) {
        this.restClient = builder
            .baseUrl(baseUrl)
            .defaultHeader("Content-Type", "application/json")
            .build();
    }

    // 异步调用 FastAPI，不阻塞
    @Async
    public CompletableFuture<VisionResponse> removeBackground(byte[] file, String fileName) {
        Map<String, Object> body = Map.of(
            "file_data", Base64.getEncoder().encodeToString(file),
            "file_name", fileName,
            "params", Map.of()
        );

        VisionResponse result = restClient.post()
            .uri("/api/v1/vision/id-photo/remove-bg")
            .body(body)
            .retrieve()
            .body(VisionResponse.class);

        return CompletableFuture.completedFuture(result);
    }
}
```

## Service 层编排（完整流程）

```java
@Service
public class IdPhotoService {

    @Autowired
    private VisionServiceClient visionClient;

    @Autowired
    private TaskNotificationService notifyService;  // WebSocket 通知

    @Autowired
    private TaskService taskService;  // 任务状态管理

    // 1. Controller 调这里 → 立刻返回 taskId
    @Async
    public CompletableFuture<Void> processIdPhoto(String taskId, byte[] file, String fileName) {

        try {
            // 2. 更新状态：处理中
            taskService.updateStatus(taskId, TaskStatus.PROCESSING);

            // 3. 调用 FastAPI（阻塞后台线程，但 Tomcat 线程已释放）
            VisionResponse result = visionClient.removeBackground(file, fileName).get(120, TimeUnit.SECONDS);

            // 4. 存结果到 MinIO + 数据库
            String resultUrl = taskService.saveResult(taskId, result);

            // 5. WebSocket 通知前端
            notifyService.notifyDone(taskId, resultUrl);

        } catch (Exception e) {
            taskService.updateStatus(taskId, TaskStatus.FAILED);
            notifyService.notifyFailed(taskId, e.getMessage());
        }

        return CompletableFuture.completedFuture(null);
    }
}
```

## WebSocket 通知处理器

```java
// 极简设计：只推送事件，不传输数据

@Component
public class TaskNotificationHandler extends TextWebSocketHandler {

    // taskId → session 映射
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // 前端发送: { "action": "subscribe", "task_id": "abc123" }
        String taskId = extractTaskId(message.getPayload());
        sessions.put(taskId, session);
    }

    // Service 层调用：通知前端任务完成
    public void notifyDone(String taskId, String resultUrl) {
        WebSocketSession session = sessions.remove(taskId);
        if (session != null && session.isOpen()) {
            String msg = String.format(
                "{\"event\":\"done\",\"task_id\":\"%s\",\"result_url\":\"%s\"}",
                taskId, resultUrl
            );
            session.sendMessage(new TextMessage(msg));
            session.close();
        }
    }

    public void notifyFailed(String taskId, String error) {
        WebSocketSession session = sessions.remove(taskId);
        if (session != null && session.isOpen()) {
            String msg = String.format(
                "{\"event\":\"failed\",\"task_id\":\"%s\",\"error\":\"%s\"}",
                taskId, error
            );
            session.sendMessage(new TextMessage(msg));
            session.close();
        }
    }
}
```

> WebSocket 端点路径：`ws://domain.com/ws/task` — 在 WebSocketConfig 中注册。



## 编码规范

| 规范 | 说明 |
| ---- | ---- |
| Controller | 提交任务 → 返回 taskId，查询结果走 TaskController |
| Service | @Async 异步编排，调用 FastAPI → 存结果 → WebSocket 通知 |
| Client | 封装 RestClient HTTP 调用，每个 FastAPI 服务一个 Client |
| WebSocket | 只推送事件通知（"done"/"failed"），不传输数据 |
| 统一响应 | 所有接口返回 `Result<T>`，异常由全局处理器统一包装 |
| 异步任务 | 耗时超过 3s 的操作使用 `@Async` |
| 日志 | traceId 全链路透传，请求入参/出参记录 |
| 超时 | FastAPI 调用超时见《FastAPI 文档》2.4 节 |



## 模块裁剪

| 模块 | 处理 | 方式 |
| ---- | ---- | ---- |
| HRM 人力资源 | ✂️ 裁剪 | 注释掉模块依赖和菜单，保证编译不报错 |
| ERP 企业资源 | ✂️ 裁剪 | 同上 |
| 项目管理 | ✂️ 裁剪 | 同上 |
| 财务管理 | ✂️ 裁剪 | 同上 |
| OA / BPM / CRM | ✂️ 裁剪 | 同上，后期按需解开 |



## 已确认决策

| # | 决策 | 结论 |
| ---- | ---- | ---- |
| 1 | 若依版本 | 若依 Office 最新版 |
| 2 | SpringBoot → FastAPI 调用方式 | RestClient（HTTP POST），@Async 异步执行 |
| 3 | 前端等待方案 | WebSocket 通知 + HTTP 拉取结果 |
| 4 | 模块裁剪 | HRM/ERP/项目管理/财务/OA/BPM/CRM 全部注释掉 |
| 5 | 任务队列 | @Async + TaskExecutor，单机够用 |
| 6 | JDK | OpenJDK 21 LTS |
