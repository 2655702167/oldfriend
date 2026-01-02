**项目简介**

这是啊队队队小组完成的“老友助手”小程序项目，包含前端小程序（WeChat 小程序）、后端（Spring Boot）和数据库脚本。


**本地启动说明（简洁）**
1) 数据库（MySQL）

   - 在 MySQL 中创建数据库并导入脚本：

```bash
mysql -u root -p
CREATE DATABASE elderly_assistant DEFAULT CHARSET utf8mb4;
USE elderly_assistant;
SOURCE database/init_database.sql;
SOURCE database/insert_test_data.sql;
```

2) 后端（需要 Java 17 与 Maven）

   - 推荐使用项目自带脚本：在 PowerShell 中运行：

```powershell
.\start_backend.ps1
```

   - 或手动启动（在 `java-backend` 目录）：

```bash
cd java-backend
mvn spring-boot:run
```

   - 后端默认监听 `8082`，若需要修改，编辑后端配置或在 `minicode-1/utils/config.js` 中修改 `apiBaseUrl` 指向后端地址（使用开发机局域网 IP 便于真机调试）。

3) 前端（WeChat 小程序）

   - 用微信开发者工具打开工作目录 `minicode-1`。
   - 在 `minicode-1/utils/config.js` 中确认 `apiBaseUrl` 指向后端，例如：

```js
apiBaseUrl: 'http://<你的电脑局域网IP>:8082/api'
```

   - 真机测试时请确保手机与开发机在同一网络，且防火墙允许端口 8082。

4) 常见检查点

- 若前端请求失败：检查 `minicode-1/utils/config.js` 的 `apiBaseUrl` 与后端是否启动。
- 若后端报 MySQL 错误：确认数据库已导入并向 `application.yml` 或环境变量中配置正确的 DB 连接。

