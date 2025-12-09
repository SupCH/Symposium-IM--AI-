# Symposium IM

![Version](https://img.shields.io/badge/version-0.0.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-19.x-61dafb)

一个基于 React + Node.js + SQLite 的即时通讯系统，采用学术论文风格的 UI 设计。

## ✨ 新功能 (v0.0.3)

- 🚀 **一键启动**：双击 `start.bat` 即可启动前后端
- 🔧 **端口调整**：前端 30001，后端 50001

## 技术栈

- **前端**: React 18 + Vite + Socket.IO Client + Zustand
- **后端**: Node.js + Express + Socket.IO
- **数据库**: SQLite (sql.js)
- **认证**: JWT
- **AI**: DEEPSEEK API

## 快速开始

### 一键启动

```bash
# Windows 用户只需双击
start.bat
```

### 手动启动

```bash
# 安装依赖
cd client && npm install
cd ../server && npm install

# 配置环境变量
cp server/.env.example server/.env
# 编辑 .env 设置 JWT_SECRET 和 DEEPSEEK_API_KEY

# 启动后端 (端口 50001)
cd server && npm run dev

# 启动前端 (端口 30001)
cd client && npm run dev
```

### 访问地址

- 前端：http://localhost:30001
- 后端：http://localhost:50001

## 项目结构

```
├── client/          # React 前端 (端口 30001)
├── server/          # Node.js 后端 (端口 50001)
├── start.bat        # 一键启动脚本
└── README.md
```

## 功能特性

- ✅ 用户注册/登录
- ✅ 好友系统
- ✅ 私聊消息
- ✅ 群组聊天
- ✅ 图片消息
- ✅ 实时消息推送
- ✅ 在线状态显示
- ✅ AI 智能对话 (DEEPSEEK)

## 更新日志

### v0.0.3
- 修改端口号：前端 30001，后端 50001
- 添加一键启动批处理文件 start.bat

### v0.0.2
- 添加 AI 用户功能
- 集成 DEEPSEEK API
- 预设 3 个 AI 角色
- [AI] 徽章显示

### v0.0.1
- 项目初始化
- 基础用户系统
- 实时消息功能

## License

MIT
