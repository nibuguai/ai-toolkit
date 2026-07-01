@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: ============================================
:: AI Toolkit 一键部署脚本（Windows 环境）
:: 用法:
::   deploy.bat              → 全量部署
::   deploy.bat mobile       → 只部署移动端前端
::   deploy.bat admin        → 只部署管理端前端
::   deploy.bat java         → 只部署 Spring Boot
::   deploy.bat python       → 只部署 FastAPI
::   deploy.bat nginx        → 只重启 Nginx
::   deploy.bat frontend     → 部署两个前端
:: ============================================

set PROJECT_DIR=G:\ai-toolkit
set WSL_DIST=Ubuntu-24.04
set TARGET=%1
if "%TARGET%"=="" set TARGET=all

echo.
echo ========================================
echo   AI Toolkit 部署 [%TARGET%]
echo ========================================
echo.

:: ---- Git Pull ----
echo [1/N] 拉取最新代码...
cd /d %PROJECT_DIR%
git pull origin master
if errorlevel 1 (
    echo [ERROR] git pull 失败！
    exit /b 1
)
echo [OK] 代码已更新
echo.

:: ---- 根据参数部署 ----

if "%TARGET%"=="all" goto :deploy_all
if "%TARGET%"=="frontend" goto :deploy_frontend
if "%TARGET%"=="admin" goto :deploy_admin
if "%TARGET%"=="mobile" goto :deploy_mobile
if "%TARGET%"=="java" goto :deploy_java
if "%TARGET%"=="python" goto :deploy_python
if "%TARGET%"=="nginx" goto :deploy_nginx
echo [ERROR] 未知参数: %TARGET%
exit /b 1

:: ========== 全量部署 ==========
:deploy_all
echo [2/N] 部署 Spring Boot...
wsl -d %WSL_DIST% -- bash -c "cd /mnt/g/ai-toolkit && docker compose build doc-springboot && docker compose up -d doc-springboot"
echo [OK] Spring Boot 已部署
echo.

echo [3/N] 部署 FastAPI...
wsl -d %WSL_DIST% -- bash -c "cd /mnt/g/ai-toolkit && docker compose build doc-fastapi-vision && docker compose up -d doc-fastapi-vision"
echo [OK] FastAPI 已部署
echo.

:deploy_frontend
echo [4/N] 构建管理端前端...
cd /d %PROJECT_DIR%\frontend\yudao-ui-admin-vue3
call pnpm install
call pnpm build
echo [OK] 管理端前端已构建
echo.

echo [5/N] 构建移动端前端...
cd /d %PROJECT_DIR%\frontend\yudao-ui-admin-uniapp
call pnpm install
call pnpm build:h5
echo [OK] 移动端前端已构建
echo.

:deploy_nginx
echo [6/N] 重启 Nginx...
wsl -d %WSL_DIST% -- bash -c "docker exec doc-nginx nginx -s reload 2>/dev/null || (cd /mnt/g/ai-toolkit && docker compose up -d doc-nginx)"
echo [OK] Nginx 已重启
echo.
goto :done

:: ========== 单独部署 ==========
:deploy_java
echo [2/N] 部署 Spring Boot...
wsl -d %WSL_DIST% -- bash -c "cd /mnt/g/ai-toolkit && docker compose build doc-springboot && docker compose up -d doc-springboot"
echo [OK] Spring Boot 已部署
goto :done

:deploy_python
echo [2/N] 部署 FastAPI...
wsl -d %WSL_DIST% -- bash -c "cd /mnt/g/ai-toolkit && docker compose build doc-fastapi-vision && docker compose up -d doc-fastapi-vision"
echo [OK] FastAPI 已部署
goto :done

:deploy_admin
echo [2/N] 构建管理端前端...
cd /d %PROJECT_DIR%\frontend\yudao-ui-admin-vue3
call pnpm install
call pnpm build
echo [OK] 管理端前端已构建
echo.
goto :deploy_nginx

:deploy_mobile
echo [2/N] 构建移动端前端...
cd /d %PROJECT_DIR%\frontend\yudao-ui-admin-uniapp
call pnpm install
call pnpm build:h5
echo [OK] 移动端前端已构建
echo.
goto :deploy_nginx

:: ========== 完成 ==========
:done
echo ========================================
echo   部署完成！
echo   管理后台: http://localhost:8880
echo   移动端:   http://localhost:8880/mobile/
echo ========================================

endlocal
