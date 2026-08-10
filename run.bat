@echo off
chcp 65001 >nul
echo ========================================
echo   卷包过程质量数智管控一体化平台
echo   环境检查与启动脚本
echo ========================================
echo.

REM 检查Java环境
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到Java环境！
    echo.
    echo 请安装 JDK 1.8：
    echo   下载地址: https://www.oracle.com/java/technologies/javase/javase8-archive-downloads.html
    echo   或搜索: JDK 1.8 下载
    echo.
    echo 安装后请设置环境变量:
    echo   JAVA_HOME = JDK安装目录
    echo   Path 添加 %%JAVA_HOME%%\bin
    echo.
    pause
    exit /b 1
)

echo [OK] Java环境检测通过
java -version 2>&1 | findstr "version"
echo.

REM 使用Maven Wrapper编译并启动（自动下载Maven）
echo 正在编译项目（首次运行会自动下载依赖，请耐心等待）...
call mvnw.cmd spring-boot:run -f pom.xml

pause
