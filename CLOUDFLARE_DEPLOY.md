# Cloudflare Pages 部署指南

## 部署包已生成

**文件**: `dist.zip` (约 100KB)
**授权码**: `7BEE48C1309288BA89AABD3EDF536C02C9A9FB453C64B0D2BD5B6FD9483325D8`

---

## 部署步骤（无需修改 DNS）

### 第一步：注册 Cloudflare 账号

1. 打开 https://dash.cloudflare.com/sign-up
2. 使用邮箱注册账号
3. 验证邮箱

### 第二步：添加域名到 Cloudflare

1. 登录 Cloudflare Dashboard
2. 点击 "Add a site"
3. 输入域名：`picsync.cn`
4. 选择免费套餐（Free）
5. 点击 "Continue"

### 第三步：修改域名 DNS（在域名注册商处）

Cloudflare 会显示两个 NS 服务器地址，类似：
```
clay.ns.cloudflare.com
dana.ns.cloudflare.com
```

**你需要去域名注册商（如阿里云、腾讯云、GoDaddy 等）修改 NS 记录：**

以阿里云为例：
1. 登录阿里云控制台
2. 进入「域名」管理
3. 找到 picsync.cn，点击「管理」
4. 找到「DNS 修改」或「域名服务器」
5. 修改为 Cloudflare 提供的两个 NS 地址
6. 保存

**等待生效**：DNS 修改通常需要 5 分钟到 24 小时生效。

### 第四步：创建 Cloudflare Pages 项目

1. 在 Cloudflare Dashboard 左侧菜单点击 "Pages"
2. 点击 "Create a project"
3. 选择 "Upload assets"
4. 项目名称填写：`ppl-training`
5. 点击 "Create project"

### 第五步：上传部署包

1. 在项目页面，点击 "Upload assets"
2. 拖拽或选择 `dist.zip` 文件
3. 等待上传完成
4. 点击 "Deploy site"

### 第六步：绑定自定义域名

1. 部署完成后，点击 "Custom domains"
2. 点击 "Set up a custom domain"
3. 输入域名：`picsync.cn`
4. 点击 "Continue"
5. 确认 DNS 记录，点击 "Activate domain"

### 第七步：启用 HTTPS

Cloudflare 会自动启用 HTTPS，无需额外配置。

---

## 验证部署

1. 等待 1-2 分钟
2. 访问 https://picsync.cn
3. 应该看到授权登录页面
4. 输入授权码测试

---

## 后续更新

如果需要更新网站：

1. 重新构建项目生成新的 dist.zip
2. 在 Cloudflare Pages 项目页面点击 "Upload assets"
3. 上传新的 dist.zip
4. 自动重新部署

---

## 故障排查

### 域名无法访问
- 检查 DNS 是否已修改为 Cloudflare NS
- 等待 DNS 生效（最长 24 小时）
- 在 Cloudflare Dashboard 查看域名状态

### 页面显示 404
- 确认上传的是 dist 目录内的文件，不是 dist 文件夹本身
- 检查是否有 index.html 文件

### 授权码无效
- 确认输入完整 64 位授权码
- 检查是否有前后空格
- 授权码不区分大小写

---

## 需要帮助？

如果在任何步骤遇到问题，请告诉我具体的错误信息，我可以进一步协助。
