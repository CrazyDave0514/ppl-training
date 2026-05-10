# PPL 三分化训练 App - 部署指南

## 授权码

**授权码**: `7BEE48C1309288BA89AABD3EDF536C02C9A9FB453C64B0D2BD5B6FD9483325D8`

用户首次访问需要输入此授权码才能使用应用。

## 本地构建

```bash
# 安装依赖
npm install

# 生产构建
npm run build

# 构建输出在 dist/ 目录
```

## 部署到 picsync.cn

### 方式一：使用 Nginx 部署（推荐）

1. **服务器准备**
   - 确保服务器已安装 Nginx
   - 域名 picsync.cn 已解析到服务器 IP

2. **上传文件**
   ```bash
   # 将 dist/ 目录内容上传到服务器
   scp -r dist/* user@your-server:/var/www/ppl-training/
   ```

3. **Nginx 配置**
   ```nginx
   server {
       listen 80;
       server_name picsync.cn www.picsync.cn;
       
       # 重定向到 HTTPS（如果有 SSL 证书）
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl http2;
       server_name picsync.cn www.picsync.cn;

       # SSL 证书配置
       ssl_certificate /path/to/your/certificate.crt;
       ssl_certificate_key /path/to/your/private.key;

       root /var/www/ppl-training;
       index index.html;

       # 单页应用路由支持
       location / {
           try_files $uri $uri/ /index.html;
       }

       # 静态资源缓存
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # Gzip 压缩
       gzip on;
       gzip_vary on;
       gzip_min_length 1024;
       gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
   }
   ```

4. **重启 Nginx**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 方式二：使用 Vercel 部署

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **部署**
   ```bash
   vercel --prod
   ```

3. **绑定自定义域名**
   - 在 Vercel Dashboard 中添加 picsync.cn
   - 按提示配置 DNS 解析

### 方式三：使用 Cloudflare Pages

1. **构建项目**
   ```bash
   npm run build
   ```

2. **登录 Cloudflare Dashboard**
   - 进入 Pages 服务
   - 创建新项目
   - 上传 dist/ 目录

3. **配置自定义域名**
   - 在 Pages 设置中添加 picsync.cn
   - 按提示配置 DNS

## 数据说明

- 应用使用 localStorage 存储数据
- 用户数据保存在浏览器本地
- 更换设备或清除浏览器数据会导致数据丢失

## 安全建议

1. **修改授权码**
   - 编辑 `src/store/AuthContext.tsx`
   - 修改 `VALID_AUTH_CODE` 常量
   - 重新构建部署

2. **添加后端验证（生产环境推荐）**
   - 当前授权码验证在前端进行
   - 正式公开测试建议添加后端 API 验证

## 故障排查

### 页面空白
- 检查浏览器控制台是否有错误
- 确认所有资源文件已正确上传
- 检查 Nginx 配置中的 `try_files` 指令

### 路由 404
- 确认服务器配置了单页应用路由支持
- 检查 `base` 配置是否与部署路径一致

### 授权码无效
- 确认输入完整授权码（64 位）
- 检查是否有前后空格
- 授权码不区分大小写
