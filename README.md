# Symposium IM

![Version](https://img.shields.io/badge/version-0.0.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![React](https://img.shields.io/badge/react-19.x-61dafb)

一个基于 React + Node.js + SQLite 的即时通讯系统，采用学术论文风格的 UI 设计。

## 技术栈

- **前端**: React 18 + Vite + Socket.IO Client + Zustand
- **后端**: Node.js + Express + Socket.IO
- **数据库**: SQLite (sql.js)
- **认证**: JWT

## 快速开始

### 安装依赖

```bash
# 前端
cd client && npm install

# 后端
cd server && npm install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp server/.env.example server/.env

# 编辑 .env 文件设置你的 JWT 密钥
```

### 运行开发服务器

```bash
# 后端 (端口 3000)
cd server && npm run dev

# 前端 (端口 5173)
cd client && npm run dev
```

## 项目结构

```
├── client/          # React 前端
│   ├── src/
│   │   ├── pages/       # 页面组件
│   │   ├── store/       # Zustand状态管理
│   │   ├── services/    # API服务
│   │   └── socket/      # WebSocket客户端
│   └── package.json
│
├── server/          # Node.js 后端
│   ├── src/
│   │   ├── routes/      # API路由
│   │   ├── middleware/  # 中间件
│   │   ├── socket/      # WebSocket处理
│   │   └── db/          # 数据库
│   └── package.json
│
├── deploy/          # 部署配置
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

## License

MIT
