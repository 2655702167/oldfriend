# 启动老友助手后端服务
Write-Host "正在启动老友助手后端服务..." -ForegroundColor Green

# 进入后端目录
Set-Location "java-backend"

# 检查Maven是否安装
$mavenVersion = mvn -version 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "错误：未检测到Maven，请先安装Maven" -ForegroundColor Red
    Write-Host "下载地址：https://maven.apache.org/download.cgi" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Maven版本检测成功" -ForegroundColor Green

# 检查MySQL是否运行
Write-Host "检查MySQL服务..." -ForegroundColor Cyan
$mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
if ($null -eq $mysqlService) {
    Write-Host "警告：未检测到MySQL服务，请确保MySQL已安装并运行" -ForegroundColor Yellow
} else {
    Write-Host "MySQL服务状态：$($mysqlService.Status)" -ForegroundColor Green
}

# 清理并编译项目
Write-Host "`n清理并编译项目..." -ForegroundColor Cyan
mvn clean package -DskipTests

if ($LASTEXITCODE -ne 0) {
    Write-Host "编译失败，请检查错误信息" -ForegroundColor Red
    pause
    exit 1
}

# 启动Spring Boot应用
Write-Host "`n启动Spring Boot应用..." -ForegroundColor Cyan
Write-Host "服务将在 http://localhost:8081 启动" -ForegroundColor Green
Write-Host "按 Ctrl+C 停止服务`n" -ForegroundColor Yellow

mvn spring-boot:run
