import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './db/index.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import friendRoutes from './routes/friends.js';
import conversationRoutes from './routes/conversations.js';
import fileRoutes from './routes/files.js';
import aiRoutes from './routes/ai.js';
import { setupSocket } from './socket/index.js';

// 配置
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 50001;

// 初始化 Express
const app = express();
const httpServer = createServer(app);

// 初始化 Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: ['http://localhost:30001', 'http://localhost:50001'],
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// 中间件
app.use(cors({
    origin: ['http://localhost:30001', 'http://localhost:50001'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 上传的文件
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API 路由
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/ai', aiRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 初始化数据库
initDatabase();

// 设置 WebSocket
setupSocket(io);

// 启动服务器
httpServer.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   ✦ SYMPOSIUM IM SERVER                               ║
║   ─────────────────────────────────────────────────   ║
║   Server running on http://localhost:${PORT}            ║
║   WebSocket enabled                                   ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

export { io };
