@REM Maven Wrapper for Windows
@REM 此脚本自动下载Maven，无需手动安装
@echo off
setlocal

set MAVEN_PROJECTBASEDIR=%~dp0
set WRAPPER_JAR="%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar"
set WRAPPER_PROPERTIES="%MAVEN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties"

if not exist %WRAPPER_JAR% (
    echo 正在下载Maven Wrapper...
    powershell -Command "Invoke-WebRequest -Uri 'https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper.jar' -OutFile '%MAVEN_PROJECTBASEDIR%.mvn\wrapper\maven-wrapper.jar'"
)

java -Dmaven.multiModuleProjectDirectory=%MAVEN_PROJECTBASEDIR% -cp %WRAPPER_JAR% org.apache.maven.wrapper.MavenWrapperMain %*
