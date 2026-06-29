package cn.iocoder.yudao.server.interceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 鉴权拦截器 —— Phase 0 全部放行，后期接入 Sa-Token
 */
public class AuthInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Phase 0: 全部放行
        // 后期从若依 Sa-Token 读取用户信息
        return true;
    }
}
