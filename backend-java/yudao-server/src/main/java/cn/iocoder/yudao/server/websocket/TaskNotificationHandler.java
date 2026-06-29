package cn.iocoder.yudao.server.websocket;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.concurrent.ConcurrentHashMap;

/**
 * 任务通知 WebSocket 处理器
 * 功能极简：前端订阅 taskId → 任务完成后推送 "done"/"failed"
 */
@Component
public class TaskNotificationHandler extends TextWebSocketHandler {

    private static final Logger log = LoggerFactory.getLogger(TaskNotificationHandler.class);

    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        String payload = message.getPayload();
        // 前端发送: {"action":"subscribe","task_id":"abc123"}
        String taskId = extractTaskId(payload);
        if (taskId != null) {
            sessions.put(taskId, session);
            log.info("WebSocket subscribed: taskId={}", taskId);
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.values().remove(session);
    }

    /**
     * 通知前端任务完成
     */
    public void notifyDone(String taskId, String resultUrl) {
        send(taskId, String.format(
                "{\"event\":\"done\",\"task_id\":\"%s\",\"result_url\":\"%s\"}",
                taskId, resultUrl));
    }

    /**
     * 通知前端任务失败
     */
    public void notifyFailed(String taskId, String error) {
        send(taskId, String.format(
                "{\"event\":\"failed\",\"task_id\":\"%s\",\"error\":\"%s\"}",
                taskId, error != null ? error : "未知错误"));
    }

    private void send(String taskId, String message) {
        WebSocketSession session = sessions.remove(taskId);
        if (session != null && session.isOpen()) {
            try {
                session.sendMessage(new TextMessage(message));
                session.close();
            } catch (Exception e) {
                log.error("WebSocket send failed: taskId={}", taskId, e);
            }
        }
    }

    private String extractTaskId(String payload) {
        // 简单 JSON 解析，避免引入额外依赖
        int start = payload.indexOf("\"task_id\":\"");
        if (start == -1) return null;
        start += 11;
        int end = payload.indexOf("\"", start);
        if (end == -1) return null;
        return payload.substring(start, end);
    }
}
