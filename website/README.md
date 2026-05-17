# 养老金测算平台 - 网页端

## 快速开始

### 本地运行
```bash
# 方法 1: 使用 Python HTTP 服务器
cd website
python -m http.server 8080
# 访问 http://localhost:8080

# 方法 2: 使用 Node.js http-server
npx http-server website -p 8080
```

### GitHub Pages 部署
```bash
# 推送代码到 GitHub 仓库
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main

# 在 GitHub 仓库设置中启用 Pages
# Settings → Pages → Source → main branch / root folder
```

## 项目结构
```
website/
├── index.html              # 首页
├── pension.html            # 养老金测算页
├── retire-age.html         # 退休年龄查询页
├── css/
│   └── style.css           # 全局样式
├── js/
│   ├── app.js              # 业务逻辑
│   ├── pension-engine-browser.js  # 浏览器端引擎
│   └── provinces/          # 省份配置 JSON
│       ├── jilin.json
│       ├── liaoning.json
│       └── heilongjiang.json
└── README.md
```

## 功能特性

- ✅ 基本养老金测算（四部分）
- ✅ 弹性提前退休对比
- ✅ 法定退休年龄查询
- ✅ 无需注册，零门槛使用
- ✅ 响应式设计，支持移动端
- ✅ 数据完全本地计算，保护隐私

## 技术栈

- 纯 HTML/CSS/JavaScript
- 无外部依赖
- 参数化引擎驱动
- 适配微信小程序和网页端双平台

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
