@echo off
title 平台庫存系統 - 本地伺服器
color 0A

echo ==========================================
echo      正在啟動本地網頁伺服器...
echo ==========================================
echo.

:: 檢查是否安裝 Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [錯誤] 未偵測到 Node.js！
    echo.
    echo 請先安裝 Node.js (https://nodejs.org/)
    echo 安裝後請重新執行此檔案。
    echo.
    pause
    exit
)

:: 啟動伺服器
echo [狀態] Node.js 已安裝，正在啟動服務...
echo [提示] 請勿關閉此視窗，否則網頁將無法運作。
echo.
echo 伺服器網址: http://localhost:8080
echo.

:: 自動開啟瀏覽器
start http://localhost:8080

:: 執行伺服器腳本
node server.js

pause
