@echo off
chcp 65001 >nul
echo ============================================================
echo 省市区数据转换工具
echo ============================================================
echo.

REM 尝试不同的 Python 命令
where python >nul 2>&1
if %errorlevel% == 0 (
    echo 使用 python 命令...
    python "%~dp0generate_sql_direct.py"
    goto :end
)

where py >nul 2>&1
if %errorlevel% == 0 (
    echo 使用 py 命令...
    py "%~dp0generate_sql_direct.py"
    goto :end
)

where python3 >nul 2>&1
if %errorlevel% == 0 (
    echo 使用 python3 命令...
    python3 "%~dp0generate_sql_direct.py"
    goto :end
)

echo ❌ 找不到 Python！
echo.
echo 请确认：
echo 1. Python 已正确安装
echo 2. 安装时勾选了 "Add Python to PATH"
echo 3. 已重启命令行窗口
echo.
echo 如果刚安装 Python，请：
echo 1. 关闭所有命令行窗口
echo 2. 重新打开命令行
echo 3. 再次运行此脚本
echo.

:end
pause

