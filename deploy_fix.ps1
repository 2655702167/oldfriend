# 真机测试快速部署脚本
# 用于修复所有已发现的问题并准备测试环境

Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  老友伴 - 真机测试问题修复脚本" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# 获取项目根目录
$projectRoot = $PSScriptRoot
$javaBackend = Join-Path $projectRoot "java-backend"
$database = Join-Path $projectRoot "database"
$minicode = Join-Path $projectRoot "minicode-1"

Write-Host "项目路径: $projectRoot" -ForegroundColor Yellow
Write-Host ""

# ============================================
# 步骤1: 检查数据库连接
# ============================================
Write-Host "[步骤 1/5] 检查MySQL数据库连接..." -ForegroundColor Green

# 提示用户输入数据库信息
$dbHost = Read-Host "请输入MySQL主机地址 (默认: localhost)"
if ([string]::IsNullOrWhiteSpace($dbHost)) { $dbHost = "localhost" }

$dbPort = Read-Host "请输入MySQL端口 (默认: 3306)"
if ([string]::IsNullOrWhiteSpace($dbPort)) { $dbPort = "3306" }

$dbUser = Read-Host "请输入MySQL用户名 (默认: root)"
if ([string]::IsNullOrWhiteSpace($dbUser)) { $dbUser = "root" }

$dbPassword = Read-Host "请输入MySQL密码" -AsSecureString
$dbPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
)

Write-Host "正在测试数据库连接..." -ForegroundColor Yellow

# 测试MySQL连接
$mysqlTest = "mysql -h$dbHost -P$dbPort -u$dbUser -p$dbPasswordPlain -e 'SELECT 1;' 2>&1"
$testResult = Invoke-Expression $mysqlTest

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ 数据库连接成功!" -ForegroundColor Green
} else {
    Write-Host "✗ 数据库连接失败，请检查配置" -ForegroundColor Red
    Write-Host "错误信息: $testResult" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# 步骤2: 导入福建地区医院数据
# ============================================
Write-Host "[步骤 2/5] 导入福建地区医院测试数据..." -ForegroundColor Green

$fujianHospitals = Join-Path $database "fujian_hospitals.sql"

if (Test-Path $fujianHospitals) {
    Write-Host "正在导入 fujian_hospitals.sql..." -ForegroundColor Yellow
    
    $importCmd = "mysql -h$dbHost -P$dbPort -u$dbUser -p$dbPasswordPlain elderly_assistant < `"$fujianHospitals`" 2>&1"
    $importResult = Invoke-Expression $importCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 福建医院数据导入成功!" -ForegroundColor Green
        
        # 验证导入结果
        $verifyCmd = "mysql -h$dbHost -P$dbPort -u$dbUser -p$dbPasswordPlain -D elderly_assistant -e 'SELECT COUNT(*) FROM HOSPITAL_INFO WHERE hospital_id IN (\"H008\",\"H009\",\"H010\",\"H011\",\"H012\");' -s -N"
        $count = Invoke-Expression $verifyCmd
        Write-Host "  已导入 $count 家福建地区医院" -ForegroundColor Cyan
    } else {
        Write-Host "✗ 导入失败: $importResult" -ForegroundColor Red
    }
} else {
    Write-Host "✗ 找不到 fujian_hospitals.sql 文件" -ForegroundColor Red
}

Write-Host ""

# ============================================
# 步骤3: 检查生活缴费测试数据
# ============================================
Write-Host "[步骤 3/5] 检查生活缴费测试数据..." -ForegroundColor Green

$paymentCheckCmd = "mysql -h$dbHost -P$dbPort -u$dbUser -p$dbPasswordPlain -D elderly_assistant -e 'SELECT COUNT(*) FROM PAYMENT_CONFIG WHERE user_id=\"USER_123\";' -s -N"
$paymentCount = Invoke-Expression $paymentCheckCmd

if ([int]$paymentCount -gt 0) {
    Write-Host "✓ 找到 $paymentCount 条缴费记录 (USER_123)" -ForegroundColor Green
} else {
    Write-Host "⚠ 没有找到USER_123的缴费记录，正在导入..." -ForegroundColor Yellow
    
    $testDataSql = Join-Path $database "test_data.sql"
    if (Test-Path $testDataSql) {
        $importTestData = "mysql -h$dbHost -P$dbPort -u$dbUser -p$dbPasswordPlain elderly_assistant < `"$testDataSql`" 2>&1"
        Invoke-Expression $importTestData
        Write-Host "✓ 测试数据导入完成" -ForegroundColor Green
    }
}

Write-Host ""

# ============================================
# 步骤4: 编译并启动Java后端
# ============================================
Write-Host "[步骤 4/5] 准备Java后端服务..." -ForegroundColor Green

if (Test-Path $javaBackend) {
    Push-Location $javaBackend
    
    Write-Host "正在检查Maven..." -ForegroundColor Yellow
    $mavenVersion = mvn -v 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Maven已安装" -ForegroundColor Green
        
        Write-Host ""
        Write-Host "是否需要重新编译后端? (y/n)" -ForegroundColor Yellow
        $compile = Read-Host
        
        if ($compile -eq "y" -or $compile -eq "Y") {
            Write-Host "正在执行 mvn clean package..." -ForegroundColor Yellow
            mvn clean package -DskipTests
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✓ 后端编译成功!" -ForegroundColor Green
            } else {
                Write-Host "✗ 编译失败，请检查日志" -ForegroundColor Red
            }
        }
        
        Write-Host ""
        Write-Host "是否立即启动后端服务? (y/n)" -ForegroundColor Yellow
        Write-Host "  (服务将在后台运行，API地址: http://localhost:8081/api)" -ForegroundColor Cyan
        $startServer = Read-Host
        
        if ($startServer -eq "y" -or $startServer -eq "Y") {
            Write-Host "正在启动后端服务..." -ForegroundColor Yellow
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$javaBackend'; mvn spring-boot:run"
            Write-Host "✓ 后端服务已在新窗口中启动" -ForegroundColor Green
            Write-Host "  请等待15-30秒让服务完全启动" -ForegroundColor Cyan
        }
        
    } else {
        Write-Host "✗ Maven未安装或未配置到PATH" -ForegroundColor Red
        Write-Host "  请先安装Maven: https://maven.apache.org/download.cgi" -ForegroundColor Yellow
    }
    
    Pop-Location
} else {
    Write-Host "✗ 找不到java-backend目录" -ForegroundColor Red
}

Write-Host ""

# ============================================
# 步骤5: 前端配置检查
# ============================================
Write-Host "[步骤 5/5] 检查前端配置..." -ForegroundColor Green

$configFile = Join-Path $minicode "utils\config.js"

if (Test-Path $configFile) {
    $configContent = Get-Content $configFile -Raw
    
    Write-Host "当前API配置:" -ForegroundColor Yellow
    if ($configContent -match "const\s+API_BASE_URL\s*=\s*['""]([^'""]+)['""]") {
        $apiUrl = $matches[1]
        Write-Host "  API_BASE_URL = $apiUrl" -ForegroundColor Cyan
    }
    
    Write-Host ""
    Write-Host "⚠ 注意: 真机测试需要将API地址改为局域网IP" -ForegroundColor Yellow
    Write-Host "  当前可能是: http://localhost:8081/api 或 http://127.0.0.1:8081/api" -ForegroundColor Yellow
    Write-Host "  需要改为: http://192.168.x.x:8081/api (你的电脑局域网IP)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "获取本机IP地址:" -ForegroundColor Cyan
    
    $ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.IPAddress -like "192.168.*" -or $_.IPAddress -like "10.*" 
    } | Select-Object -ExpandProperty IPAddress
    
    foreach ($ip in $ipAddresses) {
        Write-Host "  - $ip" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "请在 minicode-1/utils/config.js 中将 API_BASE_URL 改为:" -ForegroundColor Yellow
    if ($ipAddresses) {
        Write-Host "  const API_BASE_URL = 'http://$($ipAddresses[0]):8081/api';" -ForegroundColor Cyan
    }
    
} else {
    Write-Host "✗ 找不到 utils/config.js 文件" -ForegroundColor Red
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "  部署完成!" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# ============================================
# 测试清单
# ============================================
Write-Host "后续测试步骤:" -ForegroundColor Green
Write-Host ""
Write-Host "1. 确认后端服务已启动 (访问 http://localhost:8081/api/health)" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. 修改前端API配置:" -ForegroundColor Yellow
Write-Host "   minicode-1/utils/config.js" -ForegroundColor Cyan
Write-Host "   将 API_BASE_URL 改为你的局域网IP" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. 用微信开发者工具打开 minicode-1 目录" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. 真机测试重点:" -ForegroundColor Yellow
Write-Host "   ✓ 主页按键大小 (已调整为330x280)" -ForegroundColor Cyan
Write-Host "   ✓ 帮助中心滚动 (已添加底部边距)" -ForegroundColor Cyan
Write-Host "   ✓ 生活缴费显示 (检查是否显示4项费用)" -ForegroundColor Cyan
Write-Host "   ✓ 医院挂号列表 (福建地区应显示3家医院)" -ForegroundColor Cyan
Write-Host "   ✓ 打车自动输入 (目的地已复制到剪贴板)" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. 查看详细修复报告:" -ForegroundColor Yellow
Write-Host "   md/真机测试问题修复报告.md" -ForegroundColor Cyan
Write-Host ""

Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
